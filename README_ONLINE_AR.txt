خمّنها - نسخة AI أونلاين
========================

هذه النسخة مصممة لتعمل على خدمة أونلاين مثل Render، لذلك لا تحتاج إلى تثبيت Node.js على الهاتف.

المشروع يحتوي على:
- index.html
- style.css
- app.js
- server.js
- package.json
- render.yaml
- .env.example

طريقة النشر المختصرة:
1) أنشئ مستودعًا جديدًا على GitHub.
2) ارفع محتويات هذا المجلد إلى المستودع، وليس ملف ZIP نفسه.
3) افتح Render وأنشئ Web Service من مستودع GitHub.
4) إذا ظهر render.yaml، يمكن استخدام الإعدادات الموجودة فيه.
5) Build Command: npm install
6) Start Command: npm start
7) أضف متغير البيئة:
   OPENAI_API_KEY = مفتاح OpenAI الخاص بك
8) المتغير OPENAI_MODEL يمكن تركه على:
   gpt-5.6-luna
9) شغّل Deploy.
10) بعد نجاح النشر، افتح رابط onrender.com الذي يعطيه Render.

مهم:
- لا ترفع ملف .env إلى GitHub.
- لا تضع مفتاح OpenAI داخل app.js أو index.html.
- مفتاح OpenAI يجب أن يبقى في Environment Variables على Render.
- الخطة المجانية في Render قد توقف الخدمة بعد فترة من عدم الاستخدام، ثم تعود للعمل عند وصول طلب جديد.

اختبار:
بعد فتح رابط Render، جرّب وضع AI ثم "أنت المخمّن".
إذا كان المفتاح صحيحًا، سيختار الذكاء الاصطناعي كلمة سرية وتستطيع سؤاله أسئلة عربية طبيعية.
