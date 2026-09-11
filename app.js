/* =========================================================
   خمنها - Khamminha
   App.js
   ========================================================= */


/* =========================================================
   أدوات عامة
   ========================================================= */

const $ = (id) =>
  document.getElementById(id);

const screens = [
  "home",
  "difficulty-screen",
  "ai-mode-screen",
  "local-setup-screen",
  "local-round-screen",
  "word-screen",
  "handoff-screen",
  "game-screen",
  "answer-screen",
  "result-screen",
  "match-result-screen"
];


/* =========================================================
   المتغيرات
   ========================================================= */

let mode = "";

let difficulty = "easy";

let word = "";

let count = 0;

let score = 100;

let hints = 0;

let current = "";

let holder = "";

let guesser = "";

let roundScore = 0;

let p1 = "";

let p2 = "";

let round = 1;

let s1 = 0;

let s2 = 0;

let aiRole = "guesser";

let aiQuestionIndex = 0;

let aiCandidates = [];

let aiAsked = [];

let gameHistory = [];

let aiGameId = "";

/*
   مهم:
   نستخدم هذا لمعرفة هل سؤال AI الحالي
   سؤال عادي أم تخمين.
*/

let currentAIType = "question";


/* =========================================================
   الكلمات المحلية
   ========================================================= */

const words = {

  easy: [
    "هاتف",
    "كتاب",
    "قلم",
    "كرسي",
    "باب",
    "ماء",
    "شجرة",
    "سيارة",
    "مدرسة",
    "قمر",
    "تفاحة",
    "حقيبة"
  ],

  medium: [
    "مظلة",
    "بوصلة",
    "منظار",
    "مكتبة",
    "سفينة",
    "مغناطيس",
    "مرآة",
    "مصباح",
    "جسر",
    "حديقة",
    "مسبار",
    "منارة"
  ],

  hard: [
    "مخطوطة",
    "فسيفساء",
    "محراب",
    "سرداب",
    "مئذنة",
    "مجهر",
    "مذياع",
    "أطلس",
    "مشكاة",
    "بوصلة",
    "منظار",
    "سفينة"
  ]

};


/* =========================================================
   معلومات الكلمات
   ========================================================= */

const facts = {

  هاتف: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 1
  },

  كتاب: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  قلم: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  كرسي: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 1,
    metal: 0
  },

  باب: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 1,
    metal: 0
  },

  ماء: {
    object: 1,
    animal: 0,
    place: 0,
    food: 1,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  شجرة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 0,
    portable: 0,
    indoors: 0,
    metal: 0
  },

  سيارة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 0,
    indoors: 0,
    metal: 1
  },

  مدرسة: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 1,
    metal: 0
  },

  قمر: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 0,
    portable: 0,
    indoors: 0,
    metal: 0
  },

  تفاحة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 1,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 0,
    metal: 0
  },

  حقيبة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  مظلة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 0,
    metal: 0
  },

  بوصلة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 0,
    metal: 1
  },

  منظار: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 0,
    metal: 1
  },

  مكتبة: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 1,
    metal: 0
  },

  سفينة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 0,
    indoors: 0,
    metal: 1
  },

  مغناطيس: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 1
  },

  مرآة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  مصباح: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 1
  },

  جسر: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 0,
    metal: 1
  },

  حديقة: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 0,
    metal: 0
  },

  مسبار: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 0,
    metal: 1
  },

  منارة: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 0,
    metal: 1
  },

  مخطوطة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  فسيفساء: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  محراب: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 1,
    metal: 0
  },

  سرداب: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 1,
    metal: 0
  },

  مئذنة: {
    object: 1,
    animal: 0,
    place: 1,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 0,
    indoors: 0,
    metal: 0
  },

  مجهر: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 1
  },

  مذياع: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 1,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 1
  },

  أطلس: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  },

  مشكاة: {
    object: 1,
    animal: 0,
    place: 0,
    food: 0,
    person: 0,
    tool: 0,
    used: 1,
    portable: 1,
    indoors: 1,
    metal: 0
  }

};


/* =========================================================
   Navigation
   ========================================================= */

function show(id) {

  screens.forEach(
    (x) => {

      const element = $(x);

      if (!element) return;

      element.style.display =
        x === id
          ? "block"
          : "none";

    }
  );
}


function goHome() {
  show("home");
}


function comingSoon(x) {
  alert(
    "🚧 " +
    x +
    " ستكون متاحة قريبًا."
  );
}


/* =========================================================
   AI Difficulty
   ========================================================= */

function showDifficulty() {
  show("difficulty-screen");
}


function chooseAIMode(level) {

  difficulty = level;

  const names = {
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب"
  };

  $("ai-mode-desc").textContent =
    "الصعوبة: " +
    names[level] +
    ". اختر هل تريد التخمين أم اختيار الكلمة.";

  show("ai-mode-screen");
}


/* =========================================================
   Start AI
   ========================================================= */

async function startAI(role) {

  aiRole = role;

  if (role === "guesser") {

    mode = "ai";

    holder = "الذكاء الاصطناعي";

    guesser = "أنت";

    reset();

    $("turn").textContent =
      "أنت المخمّن • الذكاء الاصطناعي يختار كلمة سرية";

    show("game-screen");

    setLoading(
      true,
      "🤖 الذكاء الاصطناعي يختار الكلمة..."
    );

    try {

      const data =
        await api(
          "/api/ai/start",
          {
            difficulty
          }
        );

      aiGameId =
        data.gameId;

      if (!aiGameId) {
        throw new Error(
          "لم تبدأ جلسة الذكاء الاصطناعي."
        );
      }

    } catch (e) {

      $("msg").textContent =
        "⚠️ " +
        e.message;

    } finally {

      setLoading(false);

    }

  }

  else {

    mode = "ai-holder";

    holder = "أنت";

    guesser = "الذكاء الاصطناعي";

    show("word-screen");

    const names = {
      easy: "السهل",
      medium: "المتوسط",
      hard: "الصعب"
    };

    $("word-owner").textContent =
      "اختر كلمة مناسبة لمستوى " +
      names[difficulty] +
      ". بعد التأكيد سيبدأ الذكاء الاصطناعي بالتخمين.";

    $("word-input").value = "";

    $("word-warning").textContent = "";

  }

}


/* =========================================================
   Offline
   ========================================================= */

function startOfflineGame() {

  mode = "offline";

  difficulty = "easy";

  word = random("easy");

  holder = "النظام";

  guesser = "أنت";

  reset();

  $("turn").textContent =
    "وضع دون اتصال • أنت المخمّن والنظام صاحب الكلمة";

  show("game-screen");
}


/* =========================================================
   Local Multiplayer
   ========================================================= */

function startLocalGame() {
  show("local-setup-screen");
}


function startLocalMatch() {

  const a =
    $("p1").value.trim();

  const b =
    $("p2").value.trim();

  if (!a || !b) {

    $("local-warning").textContent =
      "⚠️ أدخل الاسمين.";

    return;
  }

  if (a === b) {

    $("local-warning").textContent =
      "⚠️ يجب أن يكون الاسمان مختلفين.";

    return;
  }

  p1 = a;

  p2 = b;

  round = 1;

  s1 = 0;

  s2 = 0;

  localRound();
}


function localRound() {

  holder =
    round % 2
      ? p1
      : p2;

  guesser =
    round % 2
      ? p2
      : p1;

  $("round-title").textContent =
    "الجولة " +
    round +
    " من 5";

  $("round-role").textContent =
    "صاحب الكلمة: " +
    holder;

  $("round-info").innerHTML =
    "👤 " +
    holder +
    " يختار الكلمة<br>" +
    "🎯 " +
    guesser +
    " يخمّن";

  show("local-round-screen");
}


function startLocalRound() {

  mode = "local";

  reset();

  $("word-owner").textContent =
    holder +
    "، اكتب الكلمة ثم مرّر الجهاز إلى " +
    guesser;

  show("word-screen");
}


/* =========================================================
   Reset
   ========================================================= */

function reset() {

  count = 0;

  score = 100;

  hints = 0;

  roundScore = 0;

  current = "";

  currentAIType = "question";

  aiQuestionIndex = 0;

  aiAsked = [];

  aiCandidates =
    Object.keys(facts);

  gameHistory = [];

  $("qnum").textContent = "0";

  $("points").textContent = "100";

  $("question").value = "";

  $("guess").value = "";

  $("msg").textContent = "";

  $("guessbox").classList.add(
    "hidden"
  );

  $("history").innerHTML =
    "<p>لا توجد أسئلة بعد.</p>";

}


/* =========================================================
   Confirm Word
   ========================================================= */

function confirmWord() {

  const w =
    $("word-input")
      .value
      .trim();

  if (!w) {

    $("word-warning").textContent =
      "⚠️ اكتب كلمة.";

    return;
  }

  if (
    !/^[\u0600-\u06FF\s]+$/.test(w)
  ) {

    $("word-warning").textContent =
      "⚠️ استخدم العربية فقط.";

    return;
  }

  word = norm(w);

  if (mode === "local") {

    $("handoff").textContent =
      guesser +
      "، حان دورك.";

    show("handoff-screen");

  }

  else if (
    mode === "ai-holder"
  ) {

    reset();

    $("turn").textContent =
      "الذكاء الاصطناعي هو المخمّن • أجب عن أسئلته";

    show("game-screen");

    setLoading(
      true,
      "🤖 الذكاء الاصطناعي يجهز أول سؤال..."
    );

    aiNextQuestion()
      .catch(
        (e) => {

          $("msg").textContent =
            "⚠️ " +
            e.message;

        }
      )
      .finally(
        () => {

          setLoading(false);

        }
      );

  }

  else {

    reset();

    $("turn").textContent =
      "أنت المخمّن";

    show("game-screen");

  }
}


/* =========================================================
   Handoff
   ========================================================= */

function finishHandoff() {

  show("game-screen");

  $("turn").textContent =
    guesser +
    " المخمّن • اسأل سؤالًا بنعم أو لا";

}


/* =========================================================
   Question Validation
   ========================================================= */

function validQuestion(q) {

  return (
    q.includes("هل") ||
    q.includes("؟") ||
    q.includes("?")
  );

}


/* =========================================================
   Ask
   ========================================================= */

async function ask() {

  const q =
    $("question")
      .value
      .trim();

  /*
     في وضع AI holder
     لا نستخدم هذا الزر.
  */

  if (mode === "ai-holder") {
    return;
  }

  if (count >= 20) {

    $("msg").textContent =
      "⚠️ انتهت الأسئلة. قم بالتخمين النهائي.";

    return;
  }

  if (!q) {

    $("msg").textContent =
      "⚠️ اكتب سؤالًا.";

    return;
  }

  if (!validQuestion(q)) {

    $("msg").textContent =
      "⚠️ يجب أن يكون السؤال بصيغة سؤال نعم أو لا.";

    return;
  }

  if (
    /\s(و|أو|ثم)\s/.test(
      q.replace(/[؟?!]/g, " ")
    )
  ) {

    $("msg").textContent =
      "⚠️ لا تجمع سؤالين في سؤال واحد.";

    return;
  }

  count++;

  score =
    points(count);

  $("qnum").textContent =
    count;

  $("points").textContent =
    score;

  current = q;

  $("asked").textContent =
    q;

  $("question").value = "";

  /*
     AI Guessing
  */

  if (mode === "ai") {

    setLoading(
      true,
      "🤖 الذكاء الاصطناعي يفكر في الإجابة..."
    );

    try {

      const data =
        await api(
          "/api/ai/answer",
          {
            gameId: aiGameId,
            question: q,
            history: gameHistory,
            difficulty
          }
        );

      const a =
        data.answer ||
        "لا أعرف";

      gameHistory.push({
        question: q,
        answer: a
      });

      add(q, a);

    }

    catch (e) {

      count--;

      score =
        count === 0
          ? 100
          : points(count);

      $("qnum").textContent =
        count;

      $("points").textContent =
        score;

      $("msg").textContent =
        "⚠️ " +
        e.message;

    }

    finally {

      setLoading(false);

    }

    return;
  }


  /*
     Offline
  */

  if (mode === "offline") {

    const a =
      aiAnswer(q);

    add(q, a);

    show("game-screen");

    return;
  }


  /*
     Local multiplayer
  */

  $("answer-title").textContent =
    "أجب عن السؤال";

  $("answer-name").textContent =
    holder;

  show("answer-screen");

}


/* =========================================================
   Answer
   ========================================================= */

async function answer(a) {

  add(current, a);

  gameHistory.push({
    question: current,
    answer: a
  });


  /*
     AI Holder
  */

  if (mode === "ai-holder") {

    /*
       إذا كان السؤال تخمينًا
       وأجاب المستخدم بنعم،
       فالذكاء الاصطناعي فاز.
    */

    if (
      currentAIType === "guess" &&
      a === "نعم"
    ) {

      roundScore =
        Math.max(0, score);

      finish(
        true,
        "🤖 خمن الذكاء الاصطناعي الكلمة: «" +
        word +
        "»"
      );

      return;
    }


    /*
       إذا كان تخمين AI خاطئًا
    */

    if (
      currentAIType === "guess" &&
      a !== "نعم"
    ) {

      if (count >= 20) {

        finishAIHolder();

        return;
      }

    }


    /*
       انتهت الأسئلة
    */

    if (count >= 20) {

      finishAIHolder();

      return;
    }


    /*
       طلب السؤال التالي
    */

    setLoading(
      true,
      "🤖 الذكاء الاصطناعي يحلل إجابتك..."
    );

    try {

      await aiNextQuestion();

    }

    catch (e) {

      $("msg").textContent =
        "⚠️ " +
        e.message;

      show("game-screen");

    }

    finally {

      setLoading(false);

    }

    return;
  }


  /*
     Local
  */

  show("game-screen");

}


/* =========================================================
   Add History
   ========================================================= */

function add(q, a) {

  const h =
    $("history");

  if (
    h.innerHTML.includes(
      "لا توجد"
    )
  ) {

    h.innerHTML = "";

  }

  h.innerHTML +=
    "<div class='history-item'>" +
    "<b>السؤال " +
    Math.min(count, 20) +
    ":</b> " +
    esc(q) +
    "<br><span>الإجابة: " +
    esc(a) +
    "</span></div>";

}


/* =========================================================
   Loading
   ========================================================= */

function setLoading(on, text) {

  $("msg").textContent =
    on
      ? (
        text ||
        "🤖 جاري التفكير..."
      )
      : "";

  $("question").disabled =
    on;

  document
    .querySelectorAll(
      ".ask-button,.guess-button,.hint-button"
    )
    .forEach(
      (b) => {

        b.disabled = on;

      }
    );

}


/* =========================================================
   API
   ========================================================= */

async function api(url, body) {

  const r =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)
      }
    );

  let d = {};

  try {

    d =
      await r.json();

  }

  catch (_) {}

  if (!r.ok) {

    throw new Error(
      d.error ||
      "حدث خطأ في الخادم"
    );

  }

  return d;

}


/* =========================================================
   Guess UI
   ========================================================= */

function showGuess() {

  $("guessbox")
    .classList
    .remove("hidden");

  $("guess").focus();

}


function hideGuess() {

  $("guessbox")
    .classList
    .add("hidden");

  $("guess").value = "";

}


/* =========================================================
   Confirm Guess
   ========================================================= */

async function confirmGuess() {

  const g =
    norm(
      $("guess")
        .value
        .trim()
    );

  if (!g) {

    alert(
      "⚠️ اكتب التخمين."
    );

    return;
  }

  count =
    count < 20
      ? count + 1
      : 21;

  score =
    count > 20
      ? 10
      : points(count);

  $("qnum").textContent =
    Math.min(count, 20);

  $("points").textContent =
    score;

  hideGuess();


  /*
     AI mode
  */

  if (mode === "ai") {

    setLoading(
      true,
      "🤖 يتحقق من التخمين..."
    );

    try {

      const data =
        await api(
          "/api/ai/guess",
          {
            gameId: aiGameId,
            guess: g,
            finalAttempt:
              count >= 20
          }
        );

      if (data.correct) {

        roundScore =
          Math.max(0, score);

        finish(
          true,
          "🎉 إجابة صحيحة! الكلمة هي «" +
          data.word +
          "»"
        );

      }

      else if (
        count >= 20
      ) {

        roundScore = 0;

        finish(
          false,
          "❌ انتهت الجولة. الكلمة كانت «" +
          data.word +
          "»"
        );

      }

      else {

        $("msg").textContent =
          "❌ تخمين خاطئ، واحتُسب كسؤال.";

      }

    }

    catch (e) {

      $("msg").textContent =
        "⚠️ " +
        e.message;

    }

    finally {

      setLoading(false);

    }

    return;
  }


  /*
     Local / Offline
  */

  if (
    g === norm(word)
  ) {

    roundScore =
      Math.max(0, score);

    finish(
      true,
      "🎉 إجابة صحيحة! الكلمة هي «" +
      word +
      "»"
    );

  }

  else if (
    count >= 20
  ) {

    roundScore = 0;

    finish(
      false,
      "❌ انتهت الجولة. الكلمة كانت «" +
      word +
      "»"
    );

  }

  else {

    $("msg").textContent =
      "❌ تخمين خاطئ، واحتُسب كسؤال.";

  }

}


/* =========================================================
   Hints
   ========================================================= */

async function hint() {

  if (score < 10) {

    alert(
      "⚠️ لا توجد نقاط كافية."
    );

    return;
  }

  score -= 10;

  hints++;

  $("points").textContent =
    score;


  /*
     AI
  */

  if (mode === "ai") {

    try {

      const data =
        await api(
          "/api/ai/hint",
          {
            gameId: aiGameId,
            number: hints
          }
        );

      alert(
        "💡 التلميح " +
        hints +
        ": " +
        data.hint
      );

    }

    catch (e) {

      score += 10;

      hints--;

      $("points").textContent =
        score;

      alert(
        "⚠️ " +
        e.message
      );

    }

    return;
  }


  /*
     Offline / Local
  */

  const clean =
    word.replace(/\s/g, "");

  const h =
    hints === 1
      ? firstHint()
      : hints === 2
        ? "تبدأ بحرف «" +
          clean[0] +
          "»."
        : hints === 3
          ? "عدد أحرفها " +
            clean.length +
            "."
          : "تنتهي بحرف «" +
            clean[
              clean.length - 1
            ] +
            "».";

  alert(
    "💡 التلميح " +
    hints +
    ": " +
    h
  );

}


function firstHint() {

  const f =
    getFacts(word);

  if (f && f.place)
    return "هي مكان.";

  if (f && f.animal)
    return "هي كائن حي.";

  if (f && f.food)
    return "هي شيء يمكن تناوله أو شربه.";

  if (f && f.tool)
    return "هي أداة أو وسيلة تُستخدم لشيء ما.";

  return "هي شيء أو مفهوم معروف في الحياة اليومية.";

}


/* =========================================================
   Finish
   ========================================================= */

function finish(ok, text) {

  $("result-title").textContent =
    ok
      ? "🎉 نجحت!"
      : "انتهت الجولة";

  $("result-text").textContent =
    text;

  $("rs").textContent =
    roundScore;

  $("rq").textContent =
    Math.min(count, 20);

  $("rh").textContent =
    hints;


  if (mode === "local") {

    if (round % 2)
      s2 += roundScore;
    else
      s1 += roundScore;

  }

  show("result-screen");

}


/* =========================================================
   Next
   ========================================================= */

function next() {

  if (
    mode === "local" &&
    round < 5
  ) {

    round++;

    localRound();

  }

  else if (
    mode === "local"
  ) {

    $("final").textContent =
      s1 === s2
        ? "🤝 تعادل!"
        : s1 > s2
          ? "🏆 الفائز: " + p1
          : "🏆 الفائز: " + p2;

    $("board").innerHTML =
      "<div class='score-row'>" +
      "<span>" +
      esc(p1) +
      "</span><b>" +
      s1 +
      "</b></div>" +

      "<div class='score-row'>" +
      "<span>" +
      esc(p2) +
      "</span><b>" +
      s2 +
      "</b></div>";

    show("match-result-screen");

  }

  else {

    goHome();

  }

}


/* =========================================================
   Facts
   ========================================================= */

function getFacts(w) {

  return (
    facts[norm(w)] ||
    null
  );

}


/* =========================================================
   Offline AI Answer
   ========================================================= */

function aiAnswer(q) {

  const s =
    norm(q);

  const f =
    getFacts(word);

  if (
    s.includes("حيوان")
  )
    return f && f.animal
      ? "نعم"
      : "لا";

  if (
    s.includes("مكان") ||
    s.includes("موقع")
  )
    return f && f.place
      ? "نعم"
      : "لا";

  if (
    s.includes("طعام") ||
    s.includes("اكل") ||
    s.includes("شراب") ||
    s.includes("يؤكل") ||
    s.includes("يشرب")
  )
    return f && f.food
      ? "نعم"
      : "لا";

  if (
    s.includes("مادي") ||
    s.includes("ملموس")
  )
    return f && f.object
      ? "نعم"
      : "لا";

  if (
    s.includes("اداه") ||
    s.includes("أداة")
  )
    return f && f.tool
      ? "نعم"
      : "لا";

  if (
    s.includes("يستخدم") ||
    s.includes("استعمال") ||
    s.includes("يستعمل")
  )
    return f && f.used
      ? "نعم"
      : "لا";

  if (
    s.includes("محمول") ||
    s.includes("تحمله") ||
    s.includes("تحملها")
  )
    return f && f.portable
      ? "نعم"
      : "لا";

  if (
    s.includes("داخل") ||
    s.includes("منزل") ||
    s.includes("البيت")
  )
    return f && f.indoors
      ? "نعم"
      : "لا";

  if (
    s.includes("معدن") ||
    s.includes("معدنية")
  )
    return f && f.metal
      ? "نعم"
      : "لا";

  if (
    s.includes("يبدأ") ||
    s.includes("يبدا")
  ) {

    const m =
      s.match(
        /حرف\s+([ء-ي])/
      );

    if (m) {

      return norm(word)
        .startsWith(
          norm(m[1])
        )
        ? "نعم"
        : "لا";

    }

  }

  if (
    s.includes("عدد") &&
    s.includes("حرف")
  ) {

    const m =
      s.match(
        /(\d+)/
      );

    if (m) {

      return (
        word
          .replace(/\s/g, "")
          .length ===
        Number(m[1])
      )
        ? "نعم"
        : "لا";

    }

  }

  return difficulty === "hard"
    ? "لا أعرف"
    : "لا";

}


/* =========================================================
   AI Question
   ========================================================= */

async function aiNextQuestion() {

  if (count >= 20) {

    finishAIHolder();

    return;
  }

  const remaining =
    20 - count;

  const data =
    await api(
      "/api/ai/question",
      {
        history:
          gameHistory,
        difficulty,
        remaining
      }
    );

  const text =
    String(
      data.text || ""
    ).trim();

  if (!text) {

    throw new Error(
      "لم يصل سؤال من الذكاء الاصطناعي."
    );

  }

  /*
     مهم جدًا:
     حفظ نوع السؤال.
  */

  currentAIType =
    data.type === "guess"
      ? "guess"
      : "question";

  count++;

  score =
    points(count);

  $("qnum").textContent =
    count;

  $("points").textContent =
    score;

  current = text;

  $("asked").textContent =
    text;

  $("answer-name").textContent =
    "أنت";

  $("answer-title").textContent =
    currentAIType === "guess"
      ? "🎯 تخمين الذكاء الاصطناعي"
      : "🧠 أجب عن سؤال الذكاء الاصطناعي";

  show("answer-screen");

}


/* =========================================================
   AI Holder Finish
   ========================================================= */

function finishAIHolder() {

  roundScore = 0;

  finish(
    false,
    "❌ لم يصل الذكاء الاصطناعي إلى الكلمة خلال 20 سؤالًا. الكلمة كانت «" +
    word +
    "»"
  );

}


/* =========================================================
   Random
   ========================================================= */

function random(level) {

  const a =
    words[level];

  return a[
    Math.floor(
      Math.random() *
      a.length
    )
  ];

}


/* =========================================================
   Points
   ========================================================= */

function points(n) {

  if (n <= 5)
    return 100;

  if (n <= 10)
    return 75;

  if (n <= 15)
    return 50;

  return 25;

}


/* =========================================================
   Normalize Arabic
   ========================================================= */

function norm(s) {

  return String(s)

    .replace(
      /[أإآ]/g,
      "ا"
    )

    .replace(
      /ى/g,
      "ي"
    )

    .replace(
      /ة/g,
      "ه"
    )

    .replace(
      /ؤ/g,
      "و"
    )

    .replace(
      /ئ/g,
      "ي"
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim()

    .toLowerCase();

}


/* =========================================================
   Escape HTML
   ========================================================= */

function esc(s) {

  return String(s)
    .replace(
      /[&<>\"]/g,
      (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
      }[c])
    );

}
