const $ = x => document.getElementById(x);

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
let gameHistory = [];
let aiGameId = "";


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
   معلومات الكلمات في الوضع دون اتصال
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
   
