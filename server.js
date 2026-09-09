const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// يمكن تغييره من Render لاحقًا إذا أردت استخدام نموذج آخر
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY غير موجود.');
}

const aiGames = new Map();

app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname)));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL
  });
});

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history.slice(-20).map((x) => ({
    question: String(x.question || '').slice(0, 300),
    answer: String(x.answer || '').slice(0, 100)
  }));
}

function requireAI(res) {
  if (!ai) {
    res.status(500).json({
      error: 'مفتاح Gemini غير مضبوط. أضف GEMINI_API_KEY إلى Render.'
    });

    return false;
  }

  return true;
}

async function askModel(instructions, input) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${instructions}\n\n${input}`,
    config: {
      maxOutputTokens: 200
    }
  });

  return String(response.text || '').trim();
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (_) {}

  const match = text.match(/\{[\s\S]*\}/);

  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  return null;
}


/* =========================
   بدء لعبة AI
========================= */

app.post('/api/ai/start', async (req, res) => {
  if (!requireAI(res)) return;

  const { difficulty = 'easy' } = req.body || {};

  const prompt = `
اختر كلمة سرية عربية للعبة تخمين اسمها "خمّنها".

مستوى الصعوبة: ${difficulty}

القواعد:
- اختر كلمة واحدة فقط، وليست جملة.
- السهل: كلمة عربية شائعة يعرفها أغلب الناس.
- المتوسط: كلمة معروفة لكن ليست أول كلمة تخطر في البال.
- الصعب: كلمة أصعب ويمكن أن تكون نادرة نسبيًا، لكنها ما زالت كلمة عربية حقيقية قابلة للتخمين بالأسئلة.
- يمكن أن تكون اسمًا أو فعلًا أو صفة.
- لا تستخدم أسماء أشخاص حقيقيين أو كلمات مسيئة.
- أعد JSON فقط بهذا الشكل:
{"word":"الكلمة"}
`;

  try {
    const raw = await askModel(prompt, 'اختر الكلمة الآن.');

    const data = parseJSON(raw);

    const chosen =
      data && typeof data.word === 'string'
        ? data.word.trim()
        : '';

    if (!chosen || !/^[\u0600-\u06FF\s]+$/.test(chosen)) {
      return res.status(500).json({
        error: 'تعذر إنشاء كلمة عربية صالحة.'
      });
    }

    const gameId = crypto.randomUUID();

    aiGames.set(gameId, {
      word: chosen,
      createdAt: Date.now()
    });

    res.json({ gameId });

  } catch (err) {
    console.error('AI START ERROR:', err);

    res.status(500).json({
      error: 'تعذر إنشاء كلمة للعبة.'
    });
  }
});


/* =========================
   إجابة AI عن أسئلة اللاعب
========================= */

app.post('/api/ai/answer', async (req, res) => {
  if (!requireAI(res)) return;

  const {
    word: suppliedWord,
    gameId,
    question,
    history = [],
    difficulty = 'easy'
  } = req.body || {};

  const game = gameId ? aiGames.get(gameId) : null;
  const word = game ? game.word : suppliedWord;

  if (!word || !question) {
    return res.status(400).json({
      error: 'الكلمة والسؤال مطلوبان.'
    });
  }

  const safeHistory = cleanHistory(history);

  const prompt = `
أنت صاحب الكلمة في لعبة تخمين عربية اسمها "خمّنها".

الكلمة السرية:
${String(word).slice(0, 80)}

مستوى اللعبة:
${difficulty}

سؤال اللاعب الحالي:
${String(question).slice(0, 500)}

سجل الأسئلة السابقة:
${JSON.stringify(safeHistory, null, 2)}

القواعد الصارمة:

1. أجب عن السؤال الحالي بالنسبة إلى الكلمة السرية.
2. يجب أن تكون إجابتك صادقة ومتسقة.
3. إذا كان السؤال يمكن الإجابة عنه بوضوح، استخدم "نعم" أو "لا".
4. استخدم "قد تكون" فقط عندما تكون الإجابة غير مؤكدة فعلًا.
5. استخدم "لا أعرف" فقط عندما لا يمكن تحديد الإجابة بشكل معقول.
6. لا تكشف الكلمة السرية.
7. لا تذكر الكلمة السرية داخل الإجابة.
8. لا تعطِ تلميحًا مباشرًا.
9. إذا كان السؤال مركبًا أو غير صالح كلعبة نعم/لا، أجب "لا أعرف".
10. أعد JSON فقط.

الإجابة يجب أن تكون واحدة من:
{"answer":"نعم"}
{"answer":"لا"}
{"answer":"قد تكون"}
{"answer":"لا أعرف"}
`;

  try {
    const raw = await askModel(
      prompt,
      'أجب الآن بصيغة JSON فقط.'
    );

    const data = parseJSON(raw);

    const allowed = [
      'نعم',
      'لا',
      'قد تكون',
      'لا أعرف'
    ];

    const answer =
      data && allowed.includes(data.answer)
        ? data.answer
        : 'لا أعرف';

    res.json({ answer });

  } catch (err) {
    console.error('AI ANSWER ERROR:', err);

    res.status(500).json({
      error: 'تعذر الاتصال بالذكاء الاصطناعي.'
    });
  }
});


/* =========================
   التخمين
========================= */

app.post('/api/ai/guess', async (req, res) => {
  if (!requireAI(res)) return;

  const {
    gameId,
    guess,
    finalAttempt = false
  } = req.body || {};

  const game = aiGames.get(gameId);

  if (!game || !guess) {
    return res.status(400).json({
      error: 'جلسة اللعبة أو التخمين غير صالح.'
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
    normalize(guess) === normalize(game.word);

  res.json({
    correct,
    word: correct || finalAttempt
      ? game.word
      : undefined
  });
});


/* =========================
   التلميحات
========================= */

app.post('/api/ai/hint', async (req, res) => {
  if (!requireAI(res)) return;

  const {
    gameId,
    number = 1
  } = req.body || {};

  const game = aiGames.get(gameId);

  if (!game) {
    return res.status(400).json({
      error: 'جلسة اللعبة غير صالحة.'
    });
  }

  const n = Math.max(1, Number(number) || 1);

  try {
    let hint;

    if (n === 1) {

      const raw = await askModel(
        `
أنت مساعد في لعبة تخمين.

الكلمة السرية هي:
${game.word}

أعطِ تلميحًا عامًا جدًا عن نوع الكلمة.

القواعد:
- لا تذكر الكلمة.
- لا تذكر جزءًا واضحًا منها.
- لا تستخدم مرادفًا يكشفها مباشرة.
- اجعل التلميح جملة عربية قصيرة.
`,
        'أعطِ التلميح فقط.'
      );

      hint = raw
        .replace(/^['"“”]+|['"“”]+$/g, '')
        .trim();

    } else if (n === 2) {

      hint = `تبدأ بحرف «${game.word.replace(/\s/g, '')[0]}».`;

    } else if (n === 3) {

      hint = `عدد أحرفها ${game.word.replace(/\s/g, '').length}.`;

    } else {

      const clean = game.word.replace(/\s/g, '');

      hint = `تنتهي بحرف «${clean[clean.length - 1]}».`;
    }

    res.json({ hint });

  } catch (err) {
    console.error('AI HINT ERROR:', err);

    res.status(500).json({
      error: 'تعذر إنشاء التلميح.'
    });
  }
});


/* =========================
   AI هو المخمّن
========================= */

app.post('/api/ai/question', async (req, res) => {
  if (!requireAI(res)) return;

  const {
    history = [],
    difficulty = '
