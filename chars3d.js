/* شخصيات القرية: ولد وبنت وسكان وسعدون والحجّي والحجّة */
(function () {
  const OSW = window.OSW, R = OSW.R, Builder = OSW.Builder, M = OSW.M, PI = Math.PI;
  const dk = OSW.col.dk;
  const cache = {};
  const sc1 = new Float32Array(16), sc2 = new Float32Array(16), sc3 = new Float32Array(16);

  function makeChar(look) {
    const key = JSON.stringify(look);
    if (cache[key]) return cache[key];
    const gl = R.gl, skin = look.skin || "#f2c9a0", girl = look.gender === "girl", hairC = look.hair || "#2b1d14";
    const shirt = look.color || "#2F7DE1", pants = look.pants || (girl ? skin : "#34495e");
    const body = new Builder(), legL = new Builder(), legR = new Builder(), armL = new Builder(), armR = new Builder();
    // الجذع
    if (girl) {
      body.box(0, 0.62, 0, 0.58, 0.62, 0.34, shirt); body.cyl(0, 0.34, 0, 0.5, 0.32, 0.5, shirt, 10); body.cyl(0, 0.34, 0, 0.51, 0.51, 0.05, dk(shirt, 0.25), 10);
    } else {
      body.box(0, 0.6, 0, 0.62, 0.74, 0.36, shirt); body.box(0, 0.56, 0, 0.64, 0.12, 0.38, dk(shirt, 0.2));
    }
    if (look.apron) body.box(0, 0.6, 0.19, 0.5, 0.6, 0.04, look.apron);
    if (look.sash) body.box(0, 0.86, 0.19, 0.64, 0.1, 0.04, look.sash);
    body.box(0, 1.28, 0, 0.16, 0.1, 0.16, skin); // رقبة
    // الرأس
    body.sphere(0, 1.62, 0, 0.32, 0.33, 0.31, skin, 10);
    body.sphere(-0.115, 1.66, 0.28, 0.045, 0.055, 0.03, "#2a2030", 5); body.sphere(0.115, 1.66, 0.28, 0.045, 0.055, 0.03, "#2a2030", 5);
    body.sphere(-0.19, 1.55, 0.25, 0.06, 0.04, 0.03, "#ff9aa8", 5); body.sphere(0.19, 1.55, 0.25, 0.06, 0.04, 0.03, "#ff9aa8", 5);
    body.box(0, 1.5, 0.3, 0.1, 0.022, 0.02, "#7a3b3b"); body.sphere(0, 1.58, 0.31, 0.03, 0.03, 0.03, dk(skin, 0.08), 4);
    if (look.mustache) body.box(0, 1.535, 0.305, 0.2, 0.04, 0.03, look.elder ? "#d8d8d8" : "#2b2b2b");
    const hs = look.hairStyle || (girl ? "long" : "short");
    if (hs === "short") { body.sphere(0, 1.68, -0.03, 0.345, 0.3, 0.34, hairC, 9, 0, true); body.box(0, 1.84, 0.2, 0.46, 0.09, 0.16, hairC); }
    else if (hs === "long") { body.sphere(0, 1.68, -0.03, 0.35, 0.3, 0.34, hairC, 9, 0, true); body.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, hairC); body.box(0, 0.95, -0.22, 0.62, 0.85, 0.12, hairC); body.box(-0.32, 1.2, -0.05, 0.1, 0.6, 0.22, hairC); body.box(0.32, 1.2, -0.05, 0.1, 0.6, 0.22, hairC); }
    else if (hs === "ponytail") { body.sphere(0, 1.68, -0.03, 0.35, 0.3, 0.34, hairC, 9, 0, true); body.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, hairC); body.sphere(0, 1.78, -0.36, 0.14, 0.14, 0.14, hairC, 7); body.cyl(0, 1.2, -0.4, 0.07, 0.11, 0.6, hairC, 6); }
    else if (hs === "hijab") { body.sphere(0, 1.63, -0.03, 0.375, 0.4, 0.37, hairC, 12); body.sphere(0, 1.58, 0.14, 0.255, 0.28, 0.2, skin, 10); body.cyl(0, 1.0, 0, 0.5, 0.3, 0.5, hairC, 12);
      body.sphere(-0.115, 1.66, 0.3, 0.045, 0.055, 0.03, "#2a2030", 5); body.sphere(0.115, 1.66, 0.3, 0.045, 0.055, 0.03, "#2a2030", 5); body.box(0, 1.5, 0.335, 0.1, 0.022, 0.02, "#7a3b3b"); }
    else if (hs === "keffiyeh") { body.sphere(0, 1.7, -0.02, 0.37, 0.3, 0.36, "#f6f3ea", 10, 0, true); body.cyl(0, 1.86, 0, 0.35, 0.35, 0.07, "#1b1b1b", 12); body.box(0, 1.45, -0.28, 0.6, 0.5, 0.1, "#f6f3ea"); }
    else if (hs === "cap") { body.sphere(0, 1.68, -0.03, 0.35, 0.3, 0.34, look.cap || "#2f8f5b", 9, 0, true); body.box(0, 1.8, 0.3, 0.42, 0.05, 0.2, look.cap || "#2f8f5b"); }
    // الأطراف (نقطة الدوران بالأعلى)
    const leg = (b, x) => { b.box(0, -0.62, 0, 0.2, 0.55, 0.2, pants); b.box(0, -0.66, 0.05, 0.23, 0.12, 0.32, look.shoe || "#3b2f2f"); };
    leg(legL, 0); leg(legR, 0);
    const arm = (b, cane) => { b.box(0, -0.5, 0, 0.16, 0.5, 0.16, girl && !look.elder ? skin : shirt); b.sphere(0, -0.56, 0, 0.09, 0.09, 0.09, skin, 6); if (cane) { b.cyl(0.04, -1.5, 0.1, 0.03, 0.03, 1.55, "#7a5236", 5); b.sphere(0.04, 0.05, 0.1, 0.06, 0.05, 0.06, "#7a5236", 5); } };
    arm(armL, false); arm(armR, !!look.cane);
    if (!look.elder && girl) { /* كم قصير للبنت */ }
    const ch = { body: body.build(gl), legL: legL.build(gl), legR: legR.build(gl), armL: armL.build(gl), armR: armR.build(gl), h: look.hairStyle === "keffiyeh" ? 2.15 : 2.1 };
    return (cache[key] = ch);
  }
  // ظل دائري موحّد
  let shadowMesh;
  function shadow() { if (!shadowMesh) { const b = new Builder(); b.disc(0, 0.12, 0, 1, "#000000", 14); shadowMesh = b.build(R.gl); } return shadowMesh; }

  // يرسم شخصية: x,z,ry,phase(حركة الأرجل),moving(0..1)
  OSW.drawChar = (ch, x, z, ry, phase, moving, t, alpha, tint, scale, y0) => {
    scale = scale || 1; const bob = (moving > 0.05 ? Math.abs(Math.sin(phase)) * 0.07 * moving : Math.sin(t * 2.2) * 0.012) * scale + (y0 || 0);
    M.trs(x, bob, z, ry, 0, 0, scale, scale, scale, sc1);
    R.draw(ch.body, sc1, tint, alpha);
    const sw = Math.sin(phase) * 0.85 * moving, idle = Math.sin(t * 2.2) * 0.04;
    const limb = (mesh, px, py, ang) => { M.trs(px, py, 0, 0, ang, 0, 1, 1, 1, sc2); M.mul(sc1, sc2, sc3); R.draw(mesh, sc3, tint, alpha); };
    limb(ch.legL, -0.17, 0.62, sw); limb(ch.legR, 0.17, 0.62, -sw);
    limb(ch.armL, -0.4, 1.24, -sw * 0.9 + idle); limb(ch.armR, 0.4, 1.24, ch.armR && ch.cane ? 0 : sw * 0.9 - idle);
  };
  OSW.drawShadow = (x, z, r) => { M.trs(x, 0, z, 0, 0, 0, r, 1, r, sc1); R.draw(shadow(), sc1, [0, 0, 0], 0.3); };
  OSW.makeChar = makeChar;

  /* ---------- أهل القرية ---------- */
  OSW.NPCS = [
    { id: "saadoun", name: "سعدون", emoji: "🧑‍🍳", look: { gender: "boy", color: "#f4f1e8", hair: "#1b1b1b", hairStyle: "cap", cap: "#2f8f5b", apron: "#2f8f5b", mustache: true }, pos: [-24, 13.2], face: 0, stay: true, act: "shop",
      lines: ["أهلين وسهلين! شو بدك اليوم؟ عندي أطيب خضرة بالقرية 🥬", "والله الطماطم اليوم نار! جرّب وبتشكرني 😎", "أنا ما بسرق… بس بحسب غلط أحياناً 😂", "راتبي ما بكفي حق القهوة! اشتروا كتير يا جماعة ☕", "للحجّي والحجّة عندي خبز طازة وشاي وتمر 🌴"] },
    { id: "hajji", name: "الحجّي أبو محمود", emoji: "👳", look: { gender: "boy", elder: true, color: "#efe9d8", pants: "#cfc7b4", hair: "#eee", hairStyle: "keffiyeh", mustache: true, cane: true }, pos: [-64.4, 14.2], face: 0.3, stay: true, act: "hajji",
      lines: ["الله يحفظكم ويجمعكم يا ولدي، ويرزقكم السعادة 🤲", "أيام زمان كان الشاي على الفحم أطيب! ☕", "ما أحلى لمّة الحبايب… دوموا لبعض.", "الحبيب الصادق يا ابني بيسأل عنك وانت مش جنبو."] },
    { id: "hajjeh", name: "الحجّة أم محمود", emoji: "👵", look: { gender: "girl", elder: true, color: "#5a3d6b", hair: "#f7f7f7", hairStyle: "hijab", skin: "#e8bf98" }, pos: [-59.6, 14.2], face: -0.3, stay: true, act: "hajji",
      lines: ["الله يرضى عليكم يا حبايبي، تعالوا خدوا شاي 🫖", "اللي بيسقي الورد بحب بيطلع قلبو أخضر 🌹", "ما بتطلع الشمس من غير ما أدعيلكم.", "كلوا وارتاحوا، الدنيا مش هاربة."] },
    { id: "abukhaled", name: "أبو خالد", emoji: "👨‍🌾", home: "v1", look: { gender: "boy", color: "#8a6a3b", pants: "#4a4a4a", hair: "#555", hairStyle: "short", mustache: true }, speed: 1.8,
      lines: ["صباح الخير يا نشامى! الجو حلو اليوم 🌤️", "سمعت إنو المزرعة عندكم بتحمّل طماطم! 🍅", "أنا بدور على قطتي من الصبح… شفتوها؟ 🐈", "أنا بحب أمشي بالساحة قبل المغرب."] },
    { id: "umahmad", name: "أم أحمد", emoji: "👩", home: "v2", look: { gender: "girl", color: "#b04a7a", hair: "#2b1d14", hairStyle: "hijab", skin: "#efc8a0" }, speed: 1.6,
      lines: ["يا ويلي على العشا اليوم! بدي كم حبة بندورة 🍅", "الله يخليكم لبعض، الحب الحلو بيبان 💕", "ابني أحمد مش بيسمع كلامي أبداً 😅", "وين بتروحوا؟ الساحة اليوم حلوة!"] },
    { id: "samer", name: "المعلّم سامر", emoji: "👨‍🏫", home: "v3", look: { gender: "boy", color: "#3b5ba5", pants: "#2c2c3a", hair: "#222", hairStyle: "short" }, speed: 1.9,
      lines: ["العلم نور… والحب نور فوق نور 📚", "كل يوم سؤال جديد بالنافورة، جاوبتوا؟ ⛲", "مين بيعرف عاصمة الأردن؟ عمّان طبعاً! 😄", "الصبر مفتاح الفرج، بس الورد بدو ماي كل يوم 🌹"] },
    { id: "khalasuad", name: "الخالة سعاد", emoji: "🧕", home: "v4", look: { gender: "girl", color: "#2a8f78", hair: "#f0e9d6", hairStyle: "hijab", skin: "#e6bb94" }, speed: 1.5,
      lines: ["يا حبيبي ما في أحلى من ورد الحب! 🌹", "جيت من السوق، الأسعار ولعت يا ناس!", "ربنا يتمم لكم عالخير ويفرّحكم دايماً ✨", "الحجّي والحجّة بدهم رعاية، لا تنسوهم!"] },
    { id: "abuali", name: "أبو علي", emoji: "👮", home: "v5", look: { gender: "boy", color: "#39507a", pants: "#26324a", hair: "#222", hairStyle: "cap", cap: "#26324a", mustache: true }, speed: 1.8,
      lines: ["القرية آمنة والحمدلله… بس اللي بيدوس عالورد بخالفو! 😠", "أنا الشرطي الوحيد هون، يعني أنا المدير 😎", "ممنوع الركض عالساحة… إلا إذا كنتوا تلحقوا بعض 😂", "إنتوا أحلى ثنائي بالقرية، شهادة من الشرطة!"] },
    { id: "fadi", name: "فادي الصغير", emoji: "🧒", home: "v6", look: { gender: "boy", color: "#e5484d", pants: "#2f6fb5", hair: "#3b2a20", hairStyle: "short" }, speed: 2.8, scale: 0.68,
      lines: ["بدي بوظة! 🍦 معكم مصاري؟", "بتعرفوا؟ أنا بسابق أي حدا بالقرية! 🏃", "أنا شفت الكنز المخبّى… بس ما بقول وين 🤫", "ليش الكبار دايماً مشغولين؟"] },
  ];
  OSW.NPC_BY = Object.fromEntries(OSW.NPCS.map((n) => [n.id, n]));
})();
