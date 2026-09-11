const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// يمكن تغيير النموذج من Render بواسطة GEMINI_MODEL
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  : null;

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY غير موجود.');
}

const aiGames = new Map();

app.use(express.json({
  limit: '64kb'
}));

app.use(
  express.static(path.join(__dirname))
);


/* =========================================================
   Health
   ========================================================= */

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL
  });
});


/* =========================================================
   أدوات عامة
   ========================================================= */

function cleanHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.slice(-20).map((x) => ({
    question: String(x.question || '').slice(0, 300),
    answer: String(x.answer || '').slice(0, 100)
  }));
}


function requireAI(res) {
  if (!ai) {
    res.status(500).json({
      error:
        'مفتاح Gemini غير مضبوط. أضف GEMINI_API_KEY إلى Render.'
    });

    return false;
  }

  return true;
}


async function askModel(instructions, input) {
  const response = await ai.models.generateContent({
    model: MODEL,

    contents:
      `${instructions}\n\n${input}`,

    config: {
      maxOutputTokens: 200
    }
  });

  return String(
    response.text || ''
  ).trim();
}


/* =========================================================
   قراءة JSON من Gemini
   ========================================================= */

function parseJSON(text) {

  // المحاولة الأولى
  try {
    return JSON.parse(text);
  } catch (_) {}

  // إزالة markdown إن وجد
  const cleaned = String(text)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // البحث عن object داخل النص
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  return null;
}


/* =========================================================
   AI start
   ========================================================= */

app.post('/api/ai/start', async (req, res) => {

  if (!requireAI(res)) {
    return;
  }

  const {
    difficulty = 'easy'
  } = req.body || {};

  const prompt = `
اختر كلمة سرية عربية للعبة تخمين اسمها "خمّنها".

مستوى الصعوبة:
${difficulty}

القواعد:

- اختر كلمة واحدة فقط.
- ليست جملة.
- السهل: كلمة عربية شائعة.
- المتوسط: كلمة معروفة ولكن ليست سهلة جدًا.
- الصعب: كلمة أصعب ويمكن أن تكون نادرة نسبيًا.
- يمكن أن تكون اسمًا أو فعلًا أو صفة.
- لا تستخدم أسماء أشخاص حقيقيين.
- لا تستخدم كلمات مسيئة.

أعد JSON فقط بهذا الشكل:

{"word":"الكلمة"}
`;

  try {

    const raw = await askModel(
      prompt,
      'اختر الكلمة الآن.'
    );

    console.log(
      '🤖 AI START RAW:',
      raw
    );

    const data = parseJSON(raw);

    const chosen =
      data &&
      typeof data.word === 'string'
        ? data.word.trim()
        : '';

    if (
      !chosen ||
      !/^[\u0600-\u06FF\s]+$/.test(chosen)
    ) {

      return res.status(500).json({
        error:
          'تعذر إنشاء كلمة عربية صالحة.',
        raw
      });
    }

    const gameId =
      crypto.randomUUID();

    aiGames.set(gameId, {
      word: chosen,
      createdAt: Date.now()
    });

    res.json({
      gameId
    });

  } catch (err) {

    console.error(
      'AI START ERROR:',
      err
    );

    res.status(500).json({
      error:
        'تعذر إنشاء كلمة للعبة.',
      details:
        err.message || String(err)
    });
  }
});
/* =========================================================
   AI answer
   ========================================================= */

app.post('/api/ai/answer', async (req, res) => {

  if (!requireAI(res)) {
    return;
  }

  const {
    word: suppliedWord,
    gameId,
    question,
    history = [],
    difficulty = 'easy'
  } = req.body || {};

  const game = gameId
    ? aiGames.get(gameId)
    : null;

  const word = game
    ? game.word
    : suppliedWord;

  if (!word || !question) {
    return res.status(400).json({
      error: 'الكلمة والسؤال مطلوبان.'
    });
  }

  const safeHistory =
    cleanHistory(history);

  const prompt = `
أنت صاحب الكلمة في لعبة تخمين عربية اسمها "خمّنها".

الكلمة السرية:
${String(word).slice(0, 80)}

مستوى اللعبة:
${difficulty}

سؤال اللاعب:
${String(question).slice(0, 500)}

الأسئلة السابقة:
${JSON.stringify(
  safeHistory,
  null,
  2
)}

القواعد:

1. أجب عن السؤال بالنسبة إلى الكلمة السرية.
2. يجب أن تكون الإجابة صادقة ومتسقة.
3. إذا كان السؤال واضحًا استخدم نعم أو لا.
4. استخدم قد تكون فقط عندما تكون الإجابة غير مؤكدة.
5. استخدم لا أعرف عندما لا يمكن تحديد الإجابة.
6. لا تكشف الكلمة السرية.
7. لا تذكر الكلمة السرية.
8. لا تعط تلميحًا مباشرًا.
9. إذا كان السؤال مركبًا أجب لا أعرف.

أعد JSON فقط:

{"answer":"نعم"}

أو:

{"answer":"لا"}

أو:

{"answer":"قد تكون"}

أو:

{"answer":"لا أعرف"}
`;

  try {

    const raw = await askModel(
      prompt,
      'أجب الآن بصيغة JSON فقط.'
    );

    // 👇 هذا مهم جدًا للتشخيص
    console.log(
      '🤖 AI ANSWER RAW:',
      raw
    );

    const data =
      parseJSON(raw);

    const allowed = [
      'نعم',
      'لا',
      'قد تكون',
      'لا أعرف'
    ];

    const answer =
      data &&
      allowed.includes(data.answer)
        ? data.answer
        : 'لا أعرف';

    res.json({
      answer,

      // نرسل الرد الأصلي أيضًا
      // حتى نستطيع رؤيته في الموقع
      raw: raw
    });

  } catch (err) {

    console.error(
      'AI ANSWER ERROR:',
      err
    );

    res.status(500).json({
      error:
        'تعذر الاتصال بالذكاء الاصطناعي.',
      details:
        err.message || String(err)
    });
  }
});


/* =========================================================
   AI guess
   ========================================================= */

app.post('/api/ai/guess', async (req, res) => {

  if (!requireAI(res)) {
    return;
  }

  const {
    gameId,
    guess,
    finalAttempt = false
  } = req.body || {};

  const game =
    aiGames.get(gameId);

  if (!game || !guess) {
    return res.status(400).json({
      error:
        'جلسة اللعبة أو التخمين غير صالح.'
    });
  }

  const normalize = (v) =>
    String(v)
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const correct =
    normalize(guess) ===
    normalize(game.word);

  res.json({

    correct,

    word:
      correct || finalAttempt
        ? game.word
        : undefined

  });
});


/* =========================================================
   AI hints
   ========================================================= */

app.post('/api/ai/hint', async (req, res) => {

  if (!requireAI(res)) {
    return;
  }

  const {
    gameId,
    number = 1
  } = req.body || {};

  const game =
    aiGames.get(gameId);

  if (!game) {
    return res.status(400).json({
      error:
        'جلسة اللعبة غير صالحة.'
    });
  }

  const n =
    Math.max(
      1,
      Number(number) || 1
    );

  try {

    let hint;

    if (n === 1) {

      const raw =
        await askModel(
          `
أنت مساعد في لعبة تخمين.

الكلمة السرية هي:

${game.word}

أعط تلميحًا عامًا جدًا عن نوع الكلمة.

القواعد:
- لا تذكر الكلمة.
- لا تذكر جزءًا واضحًا منها.
- لا تستخدم مرادفًا يكشفها مباشرة.
- اجعل التلميح جملة عربية قصيرة.
`,
          'أعط التلميح فقط.'
        );

      hint =
        raw
          .replace(
            /^['"“”]+|['"“”]+$/g,
            ''
          )
          .trim();

    } else if (n === 2) {

      const clean =
        game.word.replace(/\s/g, '');

      hint =
        `تبدأ بحرف «${clean[0]}».`;

    } else if (n === 3) {

      const clean =
        game.word.replace(/\s/g, '');

      hint =
        `عدد أحرفها ${clean.length}.`;

    } else {

      const clean =
        game.word.replace(/\s/g, '');

      hint =
        `تنتهي بحرف «${clean[clean.length - 1]}».`;
    }

    res.json({
      hint
    });

  } catch (err) {

    console.error(
      'AI HINT ERROR:',
      err
    );

    res.status(500).json({
      error:
        'تعذر إنشاء التلميح.',
      details:
        err.message || String(err)
    });
  }
});


/* =========================================================
   AI is guesser
   ========================================================= */

app.post('/api/ai/question', async (req, res) => {

  if (!requireAI(res)) {
    return;
  }

  const {
    history = [],
    difficulty = 'easy',
    remaining = 20
  } = req.body || {};

  const safeHistory =
    cleanHistory(history);

  const prompt = `
أنت المخمّن في لعبة "خمّنها" العربية.

المستخدم يعرف كلمة سرية وأنت لا تعرفها.

مستوى الصعوبة:
${difficulty}

الأسئلة المتبقية:
${Math.max(
  0,
  Number(remaining) || 0
)}

إجابات صاحب الكلمة حتى الآن:
${JSON.stringify(
  safeHistory,
  null,
  2
)}

مهمتك اختيار أفضل خطوة تالية.

القواعد:

1. اسأل سؤالًا واحدًا فقط.
2. يجب أن يكون السؤال قابلًا للإجابة بنعم أو لا.
3. استخدم العربية الطبيعية والواضحة.
4. لا تكرر سؤالًا سابقًا.
5. لا تسأل عن شيء تم حسمه بوضوح.
6. ابدأ بالأسئلة التي تقسم الاحتمالات إلى مجموعات كبيرة.
7. بعد تضييق الاحتمالات انتقل إلى خصائص أكثر تحديدًا.
8. يمكنك السؤال عن النوع أو الوظيفة أو المكان أو الاستخدام أو الشكل أو المادة أو الحجم أو الحروف.
9. عندما تصبح لديك ثقة عالية يمكنك التخمين.
10. التخمين يجب أن يكون كلمة واحدة أو عبارة قصيرة جدًا.
11. لا تدّع معرفة الكلمة دون أدلة كافية.

أعد JSON فقط.

للسؤال:

{"type":"question","text":"هل ...؟"}

للتخمين:

{"type":"guess","text":"هل الكلمة هي ...؟"}
`;

  try {

    const raw =
      await askModel(
        prompt,
        'اختر أفضل خطوة الآن وأعد JSON فقط.'
      );

    // 👇 سنرى بالضبط ماذا أرسل Gemini
    console.log(
      '🤖 AI QUESTION RAW:',
      raw
    );

    const data =
      parseJSON(raw);

    if (
      !data ||
      !['question', 'guess']
        .includes(data.type) ||
      !data.text
    ) {

      return res.status(500).json({

        error:
          'الذكاء الاصطناعي أعاد استجابة غير صالحة.',

        // 👇 مهم للتشخيص
        raw: raw
      });
    }

    res.json({

      type:
        data.type,

      text:
        String(data.text)
          .slice(0, 300),

      // نرسل الرد الأصلي أيضًا
      raw:
        raw
    });

  } catch (err) {

    console.error(
      'AI QUESTION ERROR:',
      err
    );

    res.status(500).json({

      error:
        'تعذر الاتصال بالذكاء الاصطناعي.',

      details:
        err.message || String(err)
    });
  }
});


/* =========================================================
   تشغيل الخادم
   ========================================================= */

app.listen(
  PORT,
  HOST,
  () => {

    console.log(
      `🎮 Khamminha server running on ${HOST}:${PORT}`
    );

  }
);
