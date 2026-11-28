# عالمنا الصغير V16 — المرحلة 1 (الأساس)

## ما تغيّر
- `src/data/islandsData.ts`: إضافة `interiorId` للمواقع الستة (home_hall, biz_ruin, port_lighthouse, agri_village, agri_dam, life_amuse). حُفظ `actionType` الأصلي لكل موقع.
- `src/interiors/InteriorBuilders.ts`: إعدادات الغرف الستة + بناء الأثاث والتصادمات ومنطقة تفاعل تحافظ على الإجراء الأصلي (quests / archaeology / port / farm / leisure). الخروج يعود إلى frontX/frontZ للموقع.
- `src/entities/NPCManager.ts`: حذف npc_home_child1 وnpc_life_child1.
- `src/entities/Characters3D.ts`: حذف دور child وتصغير الأطفال.

## ما لم يُختبر
- لم يُشغَّل `npm run lint` ولا `npm run build` (لا إنترنت في بيئتي، حزم three/vite غير مثبتة).
- فُحص الكود بـ tsc بلا أخطاء صياغة، لكن أنواع Three غير متاحة فلم يُتحقق منها كاملاً.
- لم تُجرَّب اللعبة في متصفح.
- لا توجد شخصيات (NPCs) داخل الداخليات الستة بعد؛ تأتي مع مرحلة الشخصيات.
- لم تُراجَع بعد مخارج وتصادمات الداخليات القديمة (جزء من المرحلة 1 المتبقي).

## تشغيل
npm install && npm run lint && npm run build && npm run dev
