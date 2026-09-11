/* =========================================================
   خمنها - Khamminha
   server.js
   ========================================================= */

const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");
const crypto = require("crypto");

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

/*
   يمكن تغيير النموذج من Render عن طريق:
   GEMINI_MODEL
*/
const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.7-flash";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  : null;

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY غير موجود.");
}

const aiGames = new Map();

/* =========================================================
   Middleware
   ========================================================= */

app.use(express.json({ limit: "64kb" }));

app.use(
  express.static(path.join(__dirname))
);

/* =========================================================
   Health
   ========================================================= */

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL
  });
});

/* =========================================================
   Helpers
   ========================================================= */

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history.slice(-20).map((x) => ({
    question: String(x.question || "").slice(0, 300),
    answer: String(x.answer || "").slice(0, 100)
  }));
}

function requireAI(res) {
  if (!ai) {
    res.status(500).json({
      error:
        "مفتاح Gemini غير مضبوط. أضف GEMINI_API_KEY إلى Render."
    });

    return false;
  }

  return true;
}

/* =========================================================
   AI request
   ========================================================= */

async function askModel(instructions, input) {
  const response = await ai.models.generateContent({
    model: MODEL,

    contents:
      instructions +
      "\n\n" +
      input,

    config: {
      maxOutputTokens: 200,

      /*
         نطلب من النموذج إخراج JSON.
      */
      responseMimeType: "application/json"
    }
  });

  return String(response.text || "").trim();
}

/* =========================================================
   JSON parser
   ========================================================= */

function parseJSON(text) {
  if (!text) return null;

  let cleaned = String(text).trim();

  /*
     إزالة markdown إذا رجع:
     ```json
     {...}
     ```
  */

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  /*
     محاولة استخراج JSON من النص.
  */

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    const part = cleaned.slice(start, end + 1);

    try {
      return JSON.parse(part);
    } catch (_) {}
  }

  return null;
}

/* =========================================================
   AI START
   ========================================================= */

app.post("/api/ai/start", async (req, res) => {
  if (!requireAI(res)) return;

  const {
    difficulty = "easy"
  } = req.body || {};

  const prompt = `
أنت مولد كلمات للعبة عربية اسمها "خمّنها".

اختر كلمة سرية واحدة فقط.

مستوى الصعوبة:
${difficulty}

القواعد:

- السهل: كلمة عربية شائعة جدًا.
- المتوسط: كلمة معروفة ولكن تحتاج بعض التفكير.
- الصعب: كلمة أصعب نسبيًا ولكن يمكن تخمينها.
- استخدم كلمة عربية حقيقية.
- لا تستخدم اسم شخص حقيقي.
- لا تستخدم كلمة مسيئة.
- لا تستخدم جملة.
- لا تضف أي شرح.

أعد JSON فقط بهذا الشكل:

{"word":"الكلمة"}
`;

  try {
    const raw = await askModel(
      prompt,
      "اختر الكلمة الآن."
    );

    const data = parseJSON(raw);

    const chosen =
      data &&
      typeof data.word === "string"
        ? data.word.trim()
        : "";

    if (
      !chosen ||
      !/^[\u0600-\u06FF\s]+$/.test(chosen)
    ) {
      return res.status(500).json({
        error:
          "تعذر إنشاء كلمة عربية صالحة."
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
      "AI START ERROR:",
      err
    );

    res.status(500).json({
      error:
        "تعذر إنشاء كلمة للعبة."
    });
  }
});

/* =========================================================
   AI ANSWER
   ========================================================= */

app.post("/api/ai/answer", async (req, res) => {
  if (!requireAI(res)) return;

  const {
    word: suppliedWord,
    gameId,
    question,
    history = [],
    difficulty = "easy"
  } = req.body || {};

  const game =
    gameId
      ? aiGames.get(gameId)
      : null;

  const word =
    game
      ? game.word
      : suppliedWord;

  if (!word || !question) {
    return res.status(400).json({
      error:
        "الكلمة والسؤال مطلوبان."
    });
  }

  const safeHistory =
    cleanHistory(history);

  const prompt = `
أنت صاحب الكلمة في لعبة "خمّنها".

الكلمة السرية:
${String(word).slice(0, 80)}

مستوى اللعبة:
${difficulty}

السؤال الحالي:
${String(question).slice(0, 500)}

الأسئلة السابقة:
${JSON.stringify(
  safeHistory,
  null,
  2
)}

أجب عن السؤال بالنسبة إلى الكلمة السرية.

القواعد:

1. يجب أن تكون الإجابة صادقة.
2. لا تكشف الكلمة.
3. لا تذكر الكلمة السرية.
4. لا تعطِ تلميحًا مباشرًا.
5. إذا كان السؤال واضحًا استخدم نعم أو لا.
6. إذا كانت الإجابة غير مؤكدة استخدم قد تكون.
7. إذا كان السؤال غير مناسب استخدم لا أعرف.

يجب أن تكون الإجابة واحدة فقط من:

نعم
لا
قد تكون
لا أعرف

أعد JSON فقط:

{"answer":"نعم"}

أو

{"answer":"لا"}

أو

{"answer":"قد تكون"}

أو

{"answer":"لا أعرف"}
`;

  try {
    const raw = await askModel(
      prompt,
      "أجب الآن بصيغة JSON فقط."
    );

    const data = parseJSON(raw);

    const allowed = [
      "نعم",
      "لا",
      "قد تكون",
      "لا أعرف"
    ];

    const answer =
      data &&
      allowed.includes(data.answer)
        ? data.answer
        : "لا أعرف";

    res.json({
      answer
    });
  } catch (err) {
    console.error(
      "AI ANSWER ERROR:",
      err
    );

    res.status(500).json({
      error:
        "تعذر الاتصال بالذكاء الاصطناعي."
    });
  }
});

/* =========================================================
   AI GUESS CHECK
   ========================================================= */

app.post("/api/ai/guess", async (req, res) => {
  if (!requireAI(res)) return;

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
        "جلسة اللعبة أو التخمين غير صالح."
    });
  }

  const normalize = (v) =>
    String(v)
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/\s+/g, " ")
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
   AI HINT
   ========================================================= */

app.post("/api/ai/hint", async (req, res) => {
  if (!requireAI(res)) return;

  const {
    gameId,
    number = 1
  } = req.body || {};

  const game =
    aiGames.get(gameId);

  if (!game) {
    return res.status(400).json({
      error:
        "جلسة اللعبة غير صالحة."
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

الكلمة السرية:
${game.word}

أعط تلميحًا عامًا جدًا.

القواعد:
- لا تذكر الكلمة.
- لا تذكر جزءًا واضحًا منها.
- لا تستخدم مرادفًا يكشفها مباشرة.
- اجعل التلميح قصيرًا.
`,
          "أعط التلميح فقط."
        );

      hint = raw
        .replace(
          /^['"“”]+|['"“”]+$/g,
          ""
        )
        .trim();
    }

    else if (n === 2) {
      hint =
        `تبدأ بحرف «${
          game.word.replace(/\s/g, "")[0]
        }».`;
    }

    else if (n === 3) {
      hint =
        `عدد أحرفها ${
          game.word.replace(/\s/g, "").length
        }.`;
    }

    else {
      const clean =
        game.word.replace(/\s/g, "");

      hint =
        `تنتهي بحرف «${
          clean[clean.length - 1]
        }».`;
    }

    res.json({
      hint
    });
  } catch (err) {
    console.error(
      "AI HINT ERROR:",
      err
    );

    res.status(500).json({
      error:
        "تعذر إنشاء التلميح."
    });
  }
});

/* =========================================================
   AI IS GUESSER
   ========================================================= */

app.post("/api/ai/question", async (req, res) => {
  if (!requireAI(res)) return;

  const {
    history = [],
    difficulty = "easy",
    remaining = 20
  } = req.body || {};

  const safeHistory =
    cleanHistory(history);

  const prompt = `
أنت المخمّن في لعبة "خمّنها".

المستخدم يعرف كلمة سرية وأنت لا تعرفها.

مستوى الصعوبة:
${difficulty}

الأسئلة المتبقية:
${Math.max(
  0,
  Number(remaining) || 0
)}

إجابات صاحب الكلمة السابقة:
${JSON.stringify(
  safeHistory,
  null,
  2
)}

مهمتك اختيار أفضل سؤال أو تخمين.

القواعد:

1. اسأل سؤالًا واحدًا فقط.
2. يجب أن يكون السؤال قابلًا للإجابة بنعم أو لا.
3. استخدم العربية الطبيعية.
4. لا تكرر سؤالًا سابقًا.
5. لا تسأل عن شيء تم حسمه.
6. ابدأ بالأسئلة العامة التي تستبعد أكبر عدد من الاحتمالات.
7. بعد تضييق الاحتمالات اسأل أسئلة أكثر تحديدًا.
8. يمكنك السؤال عن النوع أو الاستخدام أو المكان أو الشكل أو المادة أو الحجم أو الحروف.
9. إذا أصبحت لديك ثقة عالية يمكنك تقديم تخمين.
10. لا تخمن كلمة عشوائية.

إذا كنت تسأل:

{"type":"question","text":"هل هي شيئ مادي؟"}

وإذا كنت تخمن:

{"type":"guess","text":"هل الكلمة هي هاتف؟"}

مهم جدًا:

أعد JSON صالحًا فقط.
لا تضف شرحًا.
`;


  try {

    /*
       المحاولة الأولى
    */

    let raw;

    try {
      raw =
        await askModel(
          prompt,
          "اختر أفضل خطوة الآن."
        );
    } catch (firstError) {

      console.error(
        "AI QUESTION FIRST TRY:",
        firstError
      );

      /*
         محاولة ثانية
      */

      raw =
        await askModel(
          prompt +
            `

تذكير:
يجب أن يكون الناتج JSON صالحًا تمامًا.
`,
          "أعد JSON فقط."
        );
    }

    const data =
      parseJSON(raw);

    /*
       إذا كانت الاستجابة صحيحة
    */

    if (
      data &&
      ["question", "guess"].includes(
        data.type
      ) &&
      data.text
    ) {
      return res.json({
        type: data.type,
        text: String(
          data.text
        ).slice(0, 300)
      });
    }

    /*
       إذا رجع AI ردًا غير صالح،
       نستخدم سؤالًا احتياطيًا.
    */

    const fallback =
      getFallbackQuestion(
        safeHistory
      );

    return res.json({
      type: "question",
      text: fallback
    });

  } catch (err) {

    console.error(
      "AI QUESTION ERROR:",
      err
    );

    /*
       حتى إذا فشل Gemini بالكامل،
       لا نوقف اللعبة.
    */

    const fallback =
      getFallbackQuestion(
        safeHistory
      );

    return res.json({
      type: "question",
      text: fallback
    });
  }
});

/* =========================================================
   Fallback Questions
   ========================================================= */

function getFallbackQuestion(history) {

  const asked =
    history.map(
      (x) =>
        String(
          x.question || ""
        )
    );

  const questions = [
    "هل هي شيء مادي يمكن لمسه؟",
    "هل يمكن حملها بسهولة؟",
    "هل تُستخدم عادةً؟",
    "هل توجد عادةً داخل المنزل؟",
    "هل هي أداة؟",
    "هل تحتوي على معدن؟",
    "هل هي مكان؟",
    "هل يمكن استخدامها في الخارج؟",
    "هل حجمها صغير نسبيًا؟",
    "هل يستخدمها الإنسان بشكل مباشر؟",
    "هل لها وظيفة محددة؟",
    "هل يمكن رؤيتها بالعين المجردة؟"
  ];

  for (const q of questions) {
    if (!asked.includes(q)) {
      return q;
    }
  }

  return "هل هي شيء مادي؟";
}

/* =========================================================
   تنظيف الجلسات القديمة
   ========================================================= */

setInterval(() => {

  const now =
    Date.now();

  for (
    const [id, game]
    of aiGames
  ) {

    if (
      now - game.createdAt >
      1000 * 60 * 60
    ) {
      aiGames.delete(id);
    }
  }

}, 1000 * 60 * 60);

/* =========================================================
   START SERVER
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
