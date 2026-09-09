const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY غير موجود. أضفه في ملف .env قبل تشغيل اللعبة.');
}

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const aiGames = new Map();

app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname)));

app.get('/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-20).map((x) => ({
    question: String(x.question || '').slice(0, 300),
    answer: String(x.answer || '').slice(0, 100)
  }));
}

function requireAI(res) {
  if (!client) {
    res.status(500).json({ error: 'مفتاح OpenAI غير مضبوط. أضف OPENAI_API_KEY إلى ملف .env.' });
    return false;
  }
  return true;
}

async function askModel(instructions, input) {
  const response = await client.responses.create({
    model: MODEL,
    instructions,
    input,
    max_output_tokens: 200
  });
  return response.output_text.trim();
}

function parseJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) {}
  }
  return null;
}


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
- أعد JSON فقط: {"word":"..."}.
`;
  try {
    const raw = await askModel(prompt, 'اختر الكلمة الآن.');
    const data = parseJSON(raw);
    const chosen = data && typeof data.word === 'string' ? data.word.trim() : '';
    if (!chosen || !/^[\u0600-\u06FF\s]+$/.test(chosen)) {
      return res.status(500).json({ error: 'تعذر إنشاء كلمة عربية صالحة.' });
    }
    const gameId = require('crypto').randomUUID();
    aiGames.set(gameId, { word: chosen, createdAt: Date.now() });
    res.json({ gameId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'تعذر إنشاء كلمة للعبة.' });
  }
});

app.post('/api/ai/answer', async (req, res) => {
  if (!requireAI(res)) return;

  const { word: suppliedWord, gameId, question, history = [], difficulty = 'easy' } = req.body || {};
  const game = gameId ? aiGames.get(gameId) : null;
  const word = game ? game.word : suppliedWord;
  if (!word || !question) return res.status(400).json({ error: 'الكلمة والسؤال مطلوبان.' });

  const safeHistory = cleanHistory(history);
  const prompt = `
أنت صاحب الكلمة في لعبة تخمين عربية اسمها "خمّنها".
الكلمة السرية هي: ${String(word).slice(0, 80)}

مستوى اللعبة: ${difficulty}
سؤال اللاعب الحالي: ${String(question).slice(0, 500)}

سجل الأسئلة السابقة:
${JSON.stringify(safeHistory, null, 2)}

قواعد صارمة:
1. أجب عن السؤال الحالي بالنسبة إلى الكلمة السرية، بصدق واتساق مع إجاباتك السابقة.
2. افهم السؤال العربي الطبيعي، وليس فقط أسئلة القوالب. يمكنك استخدام المعرفة العامة.
3. إذا كان السؤال يمكن الإجابة عنه بوضوح، اختر "نعم" أو "لا".
4. استخدم "قد تكون" فقط عندما تكون الإجابة غير مؤكدة فعلًا، وليس كإجابة افتراضية.
5. استخدم "لا أعرف" فقط إذا كانت المعلومة لا يمكن تحديدها بشكل معقول.
6. لا تكشف الكلمة السرية ولا تذكرها ولا تعطِ تلميحًا مباشرًا عنها.
7. لا تناقض إجابة سابقة إلا إذا كان السؤال الجديد مختلفًا فعلًا.
8. إذا كان السؤال مركبًا أو غير صالح كلعبة نعم/لا، اختر "لا أعرف".
9. أعد JSON فقط بهذا الشكل: {"answer":"نعم"} أو {"answer":"لا"} أو {"answer":"قد تكون"} أو {"answer":"لا أعرف"}.
`;

  try {
    const raw = await askModel(prompt, 'أجب الآن بصيغة JSON فقط.');
    const data = parseJSON(raw);
    const allowed = ['نعم', 'لا', 'قد تكون', 'لا أعرف'];
    const answer = data && allowed.includes(data.answer) ? data.answer : 'لا أعرف';
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'تعذر الاتصال بالذكاء الاصطناعي.' });
  }
});


app.post('/api/ai/guess', async (req, res) => {
  if (!requireAI(res)) return;
  const { gameId, guess, finalAttempt = false } = req.body || {};
  const game = aiGames.get(gameId);
  if (!game || !guess) return res.status(400).json({ error: 'جلسة اللعبة أو التخمين غير صالح.' });
  const normalize = (v) => String(v).replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/\s+/g,' ').trim().toLowerCase();
  const correct = normalize(guess) === normalize(game.word);
  res.json({ correct, word: correct || finalAttempt ? game.word : undefined });
});

app.post('/api/ai/hint', async (req, res) => {
  if (!requireAI(res)) return;
  const { gameId, number = 1 } = req.body || {};
  const game = aiGames.get(gameId);
  if (!game) return res.status(400).json({ error: 'جلسة اللعبة غير صالحة.' });
  const n = Math.max(1, Number(number) || 1);
  try {
    let hint;
    if (n === 1) {
      const raw = await askModel(`
أنت مساعد في لعبة تخمين. الكلمة السرية هي: ${game.word}
أعطِ تلميحًا عامًا جدًا عن نوع الكلمة دون ذكر الكلمة أو جزء واضح منها. لا تستخدم حروفًا من الكلمة ولا مرادفًا يكشفها مباشرة. اجعل التلميح جملة عربية قصيرة.`, 'أعطِ التلميح فقط.');
      hint = raw.replace(/^['"“”]+|['"“”]+$/g,'').trim();
    } else if (n === 2) {
      hint = `تبدأ بحرف «${game.word.replace(/\s/g,'')[0]}».`;
    } else if (n === 3) {
      hint = `عدد أحرفها ${game.word.replace(/\s/g,'').length}.`;
    } else {
      const clean = game.word.replace(/\s/g,'');
      hint = `تنتهي بحرف «${clean[clean.length-1]}».`;
    }
    res.json({ hint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'تعذر إنشاء التلميح.' });
  }
});

app.post('/api/ai/question', async (req, res) => {
  if (!requireAI(res)) return;

  const { history = [], difficulty = 'easy', remaining = 20 } = req.body || {};
  const safeHistory = cleanHistory(history);

  const prompt = `
أنت المخمّن في لعبة "خمّنها" العربية. المستخدم يعرف كلمة سرية وأنت لا تعرفها.
مستوى الصعوبة: ${difficulty}
عدد الأسئلة المتبقية: ${Math.max(0, Number(remaining) || 0)}

إجابات صاحب الكلمة حتى الآن:
${JSON.stringify(safeHistory, null, 2)}

مهمتك اختيار أفضل سؤال تالٍ للحصول على أكبر قدر من المعلومات.
القواعد:
1. اسأل سؤالًا واحدًا فقط يمكن الإجابة عنه بنعم أو لا.
2. استخدم العربية الطبيعية والواضحة.
3. لا تكرر سؤالًا سابقًا أو سؤالًا له المعنى نفسه.
4. لا تسأل عن شيء سبق حسمه بوضوح.
5. ابدأ بالأسئلة التي تقسّم الاحتمالات إلى مجموعات كبيرة، ثم انتقل إلى الخصائص الأكثر تحديدًا.
6. يمكنك السؤال عن النوع، الوظيفة، المكان، الاستخدام، الشكل، المادة، الحجم، الحركة، الحروف أو غير ذلك عندما يكون مفيدًا.
7. إذا أصبحت لديك ثقة عالية، يمكنك تقديم تخمين واحد مباشر بدل السؤال.
8. إذا كان هذا تخمينًا، اجعله كلمة واحدة أو عبارة قصيرة جدًا.
9. لا تدّعِ معرفة الكلمة قبل وجود أدلة كافية.
10. أعد JSON فقط بهذا الشكل:
{"type":"question","text":"هل ...؟"}
أو
{"type":"guess","text":"هل الكلمة هي ...؟"}
`;

  try {
    const raw = await askModel(prompt, 'اختر أفضل خطوة الآن وأعد JSON فقط.');
    const data = parseJSON(raw);
    if (!data || !['question', 'guess'].includes(data.type) || !data.text) {
      return res.status(500).json({ error: 'الذكاء الاصطناعي أعاد استجابة غير صالحة.' });
    }
    res.json({ type: data.type, text: String(data.text).slice(0, 300) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'تعذر الاتصال بالذكاء الاصطناعي.' });
  }
});

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, game] of aiGames) if (game.createdAt < cutoff) aiGames.delete(id);
}, 10 * 60 * 1000);

app.listen(PORT, HOST, () => {
  console.log(`🎯 خمّنها تعمل على ${HOST}:${PORT}`);
});
