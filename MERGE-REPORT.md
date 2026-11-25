# تقرير الدمج — عالمنا الصغير V12 (الحسابات 1 + 3 + 4)

## المصادر
| الحزمة | المحتوى | الاستخدام |
|---|---|---|
| `v12-account4__2_` (الأحدث، 25 نوفمبر 10:01) | الحساب 4 + منظور الشخص الأول + الإعدادات (`settings.js`) | **الأساس** |
| `v12-account4__1_` | نسخة أقدم من الحساب 4 (بدون settings/camera) | مُغطّاة بالكامل بالأحدث؛ أُخذ منها فقط مجلد `migrations/` |
| `v12-account4-plus-account1` | الحساب 4 + `routines.js` (الحساب 1) | أُخذ منها `routines.js` وتوثيقه |
| `v11-delivery` | V11 + التوصيل (الحساب 3) | أُخذ منها `delivery*.js` وتوثيقه والـmigration والاختبارات |

كل حزمة مبنية على V11 نفسه، وتعديلاتها على الملفات المشتركة منفصلة (ما في تعارض سطور)، فطُبّقت كخطافات صغيرة على الأساس.

## التعديلات على الملفات المشتركة
- `index.html`: `delivery.js, delivery3d.js, delivery_ui.js` بعد `agri3d.js`؛ و`routines.js` بعد `city_int.js` وقبل `app.js`.
- `world3d.js`: سطر `OSW.deliv.draw(t)` بعد رسم الزراعة.
- `sw.js`: أُضيفت الملفات الأربعة الجديدة لـCORE، والكاش `osw-v24` (كان v22 عند التوصيل و v23 عند الحساب 4).
- `whats-new.md`: سطران جديدان للتوصيل والروتين.
- `game.js` / `app.js` / `events.js` / `places.js` / `style.css`: من الحساب 4 كما هي (التوصيل ما عدّلها).

## الملفات
- جديدة من الحساب 3: `delivery.js`, `delivery3d.js`, `delivery_ui.js`, `docs/DELIVERY.md`, `migrations/20261125_account3_delivery.sql`, `tests/delivery/*`.
- جديدة من الحساب 1: `routines.js`, `docs/ACCOUNT1-integration.md`.
- من الحساب 4: `challenges.js`, `playerlife.js`, `settings.js`, `docs/V12-ACCOUNT4.md`, `migrations/001_private_worlds*.sql` (أعدتها لأن النسخة الأحدث ما كان فيها مجلد migrations)، واختباراته.
- `docs/MERGE-REPORT-V11.md`: تقرير دمج V11 القديم.

## الاختبارات (Chromium فعلي، وضع demo)
- كل ملفات JS سليمة الصياغة؛ كل سكربتات `index.html` موجودة وموجودة بـ`sw.js` وبالعكس.
- التحميل بصفر أخطاء؛ `OSW.deliv` و`OSW.routines` و`OSW.chal` و`OSW.plife` وزر الشخص الأول وزر `#btnShip` كلها موجودة.
- `test_regression.py`: 3/3 (84 نافذة تفتح بلا أخطاء). `test_challenges.py`: 29/29. `test_playerlife.py`: 17/17.

## لم يُختبر
- اختبارات التوصيل (`tests/delivery/t8.py`) ما أعدت تشغيلها على النسخة المدموجة (تحتاج نسخة اختبار بـcoins=20000 وخادم 8765 حسب `tests/delivery/README.md`).
- التفاعل الفعلي بين الروتين والتوصيل (مثلاً شاحنة التوصيل مع شخصيات الروتين عند الأبواب).
- `test_extras.py` و`test_camera.py` و`test_challenges_ui.py` ما شغّلتها.
- جهاز فعلي، ومزامنة هاتفين عبر Supabase.

## ملاحظات
- الـmigrations: الحساب 3 ما يغيّر الـschema (فهرس اختياري فقط)؛ الحساب 4 يحتاج `001_private_worlds.sql` قبل النشر.
- الحزم الأصلية ما عُدّلت.
