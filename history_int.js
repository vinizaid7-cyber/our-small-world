/* ============================================================
   عالمنا الصغير V14 — داخليات المباني التاريخية السبعة والمتحف ثلاثي الأبعاد
   قصر الحاكم، بيت الحكمة، المتحف الخاص (بعرض مجسمات الآثار المرممة)،
   الحمّام التاريخي، القلعة العسكرية، خان القوافل، والسوق المسقوف.
   ============================================================ */
(function () {
  const OSW = window.OSW, PI = Math.PI;
  const H = (OSW.HIST = OSW.history = OSW.history || {});
  const C = OSW.city, INT = OSW.INT, R = OSW.R, M = OSW.M, G = () => OSW.game;
  const hall = C.hall, npc = C.intNpc;
  const m1 = new Float32Array(16);

  const OUT_AT = {
    hist_palace: { x: 0, z: -338 },
    hist_library: { x: 52, z: -313 },
    hist_museum: { x: -58, z: -318 },
    hist_hammam: { x: 76, z: -236 },
    hist_citadel: { x: 275, z: -286 },
    hist_khan: { x: -76, z: -494 },
    hist_souq: { x: -26, z: -239 }
  };
  Object.keys(OUT_AT).forEach((id) => {
    INT.outAt[id] = OUT_AT[id];
    INT.enterAct[id] = "hist:in:" + id;
  });

  // 1) قصر الحاكم: ديوان العرش، منصة المعالم، بساط ملكي وأعمدة رخامية
  INT.defs.hist_palace = () => {
    const I = hall({ id: "hist_palace", hw: 15, hd: 11, floor: "#f2e5cb", floor2: "#e3d1ae", wall: "#f8eed9", mat: "#168077", cam: 24 });
    const B = I.B, ox = I.ox, z0 = I.z0;
    B.box(ox, 0, 1.5, 4.6, 0.03, 14, "#8a2b2b");
    B.box(ox, 0, z0 + 2.2, 7.6, 0.45, 4.0, "#d8b46a");
    I.solid(ox, z0 + 2.2, 7.6, 4.0);
    I.desk(ox, z0 + 2.0, 5.2, "#4a2559", "hist:monuments", "🏗️ ديوان المعالم والعمران", "#c8964b");
    [-9, 9].forEach((dx) => {
      [-5, 0, 5].forEach((dz) => {
        B.cyl(ox + dx, 0, dz, 0.5, 0.42, 4.2, "#efe2cc", 10);
        I.solid(ox + dx, dz, 1.0, 1.0);
      });
    });
    I.sofa(ox - 11.5, 3, 4.5, PI / 2, "#8a2b2b");
    I.sofa(ox + 11.5, 3, 4.5, -PI / 2, "#168077");
    I.plant(I.x0 + 1.5, I.z0 + 1.5); I.plant(I.x1 - 1.5, I.z0 + 1.5);
    I.exit();
    return I.fin({ npcs: [npc("hi_palace_i", "hi_palace", ox, z0 + 4.4, "hist:monuments")] });
  };

  // 2) بيت الحكمة (المكتبة والمركز العلمي)
  INT.defs.hist_library = () => {
    const I = hall({ id: "hist_library", hw: 14, hd: 10, floor: "#ead9b7", floor2: "#dcc69c", wall: "#f7ecd5", mat: "#245c8a", cam: 22 });
    const B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.4, 8, "#245c8a", "hist:eras", "⏳ أرشيف العصور والحضارات", "#1d8a7e");
    // رفوف مخطوطات ومجلدات على الجوانب
    [[-10, -3], [-10, 3], [10, -3], [10, 3]].forEach(([dx, dz]) => {
      B.box(ox + dx, 0, dz, 4.4, 2.6, 1.1, "#6b4426");
      for (let r = 0; r < 3; r++) B.box(ox + dx, 0.4 + r * 0.72, dz + 0.1, 4.0, 0.45, 0.9, ["#c9963a", "#168077", "#8a2b2b"][r]);
      I.solid(ox + dx, dz, 4.5, 1.2);
    });
    I.table(ox - 5, 3, "lib1", 4, "#7a5236", "#245c8a");
    I.table(ox + 5, 3, "lib2", 4, "#7a5236", "#168077");
    I.act("hist:puzzles", ox + 5, 3, 2.2, ox + 5, 5.2, 1.2);
    I.lab("lib_pz", "🧩 مخطوطات الألغاز", ox + 5, 2.8, 3, "hist:puzzles");
    I.plant(I.x0 + 1.4, I.z1 - 1.4); I.plant(I.x1 - 1.4, I.z1 - 1.4);
    I.exit();
    return I.fin({ npcs: [npc("hi_library_i", "hi_library", ox, z0 + 3.2, "hist:eras")] });
  };

  // 3) المتحف الخاص للآثار (بـ 12 منصة عرض ثلاثية الأبعاد)
  const PEDESTALS = [];
  for (let i = 0; i < 6; i++) {
    PEDESTALS.push({ x: 700 - 10 + (i % 3) * 10 - (i % 3 === 1 ? 0 : 0), z: -4 + Math.floor(i / 3) * 5.2 });
  }
  const MUSEUM_SLOTS = [
    [-10, -4.5], [-3.4, -4.5], [3.4, -4.5], [10, -4.5],
    [-10, 0.8], [-3.4, 0.8], [3.4, 0.8], [10, 0.8],
    [-10, 5.6], [-3.4, 5.6], [3.4, 5.6], [10, 5.6]
  ];
  INT.defs.hist_museum = () => {
    const I = hall({ id: "hist_museum", hw: 15, hd: 11, floor: "#eee5d3", floor2: "#e0d3bc", wall: "#f7f1e4", mat: "#c27d32", cam: 24 });
    const B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.2, 9.5, "#7d542d", "hist:museum", "🏛️ إدارة المتحف والترميم والدخل اليومي", "#c27d32");
    MUSEUM_SLOTS.forEach(([dx, dz], idx) => {
      B.cyl(ox + dx, 0, dz, 0.72, 0.65, 1.05, "#dfd3bc", 8);
      B.box(ox + dx, 1.05, dz, 1.32, 0.14, 1.32, "#c9963a");
      I.solid(ox + dx, dz, 1.45, 1.45);
      I.act("hist:museum", ox + dx, dz, 1.9, ox + dx, dz + 1.6, 1.1);
      if (idx < 4) I.lab("mp_" + idx, "🏺 جناح الآثار", ox + dx, 2.6, dz, "hist:museum");
    });
    I.plant(I.x0 + 1.4, I.z0 + 1.4); I.plant(I.x1 - 1.4, I.z0 + 1.4);
    I.exit();
    return I.fin({ npcs: [npc("hi_museum_i", "hi_museum", ox, z0 + 3.0, "hist:museum")] });
  };

  // رسم الآثار المرممة فعلياً فوق منصات المتحف في المشهد ثلاثي الأبعاد
  H.drawInside = (curInt, t) => {
    if (!curInt || curInt.id !== "hist_museum") return;
    const g = G(), hs = g && g.state ? g.state().hist : null;
    if (!hs || !hs.exhibited || !hs.exhibited.length) return;
    hs.exhibited.slice(0, MUSEUM_SLOTS.length).forEach((artId, idx) => {
      const art = H.ARTIFACTS && H.ARTIFACTS[artId];
      if (!art) return;
      const [dx, dz] = MUSEUM_SLOTS[idx];
      const mesh = H.miniMesh && H.miniMesh(art.model);
      if (!mesh) return;
      M.trs(700 + dx, 1.24 + Math.sin(t * 2.2 + idx) * 0.05, dz, t * 0.9 + idx, 0, 0, 1.15, 1.15, 1.15, m1);
      R.draw(mesh, m1);
    });
  };

  // 4) الحمّام العام التاريخي
  INT.defs.hist_hammam = () => {
    const I = hall({ id: "hist_hammam", hw: 12, hd: 9, floor: "#d7e6e4", floor2: "#c2d7d4", wall: "#f2eadb", mat: "#1d8a7e", cam: 20 });
    const B = I.B, ox = I.ox, z0 = I.z0;
    B.cyl(ox, 0, 1.5, 4.2, 4.0, 0.55, "#b89668", 12);
    B.cyl(ox, 0.1, 1.5, 3.6, 3.6, 0.5, "#26a8b8", 12, 0.3);
    I.solid(ox, 1.5, 8.2, 8.2);
    I.desk(ox, z0 + 1.2, 7.2, "#1d8a7e", "hist:hammam", "♨️ استجمام الحمّام التاريخي", "#c9963a");
    I.sofa(ox - 8.5, 2, 4, PI / 2, "#1d8a7e");
    I.sofa(ox + 8.5, 2, 4, -PI / 2, "#1d8a7e");
    I.plant(I.x0 + 1.3, I.z0 + 1.3); I.plant(I.x1 - 1.3, I.z0 + 1.3);
    I.exit();
    return I.fin({ npcs: [npc("hi_hammam_i", "hi_hammam", ox, z0 + 3.0, "hist:hammam")] });
  };

  // 5) القلعة العسكرية
  INT.defs.hist_citadel = () => {
    const I = hall({ id: "hist_citadel", hw: 14, hd: 10, floor: "#a8aab0", floor2: "#95989e", wall: "#c5c7cc", mat: "#6a3028", cam: 22 });
    const B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.4, 8.5, "#6a3028", "hist:craft:armorer", "🛡️ صانع الأسلحة والدروع الاحتفالية", "#8c3d32");
    [[-9, -2], [-9, 4], [9, -2], [9, 4]].forEach(([dx, dz]) => {
      B.box(ox + dx, 0, dz, 2.2, 2.2, 1.1, "#4a3322");
      B.box(ox + dx, 1.4, dz + 0.6, 1.2, 1.2, 0.12, "#d4af37", 0.25);
      I.solid(ox + dx, dz, 2.4, 1.2);
    });
    I.table(ox, 3.2, "cit1", 4, "#5a3d2b", "#6a3028");
    I.exit();
    return I.fin({ npcs: [npc("hi_citadel_i", "hi_citadel", ox, z0 + 3.2, "hist:craft:armorer")] });
  };

  // 6) خان القوافل
  INT.defs.hist_khan = () => {
    const I = hall({ id: "hist_khan", hw: 13, hd: 9.5, floor: "#e3cca2", floor2: "#d2b684", wall: "#efe0c2", mat: "#b68036", cam: 22 });
    const B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.3, 8.5, "#8c5934", "hist:caravans", "🐪 ديوان القوافل والمواد الخام", "#b68036");
    [[-8.5, -1], [-8.5, 3.8], [8.5, -1], [8.5, 3.8]].forEach(([dx, dz]) => {
      B.box(ox + dx, 0, dz, 2.4, 1.2, 2.0, "#7c4e2d");
      B.box(ox + dx, 1.2, dz, 1.8, 0.8, 1.5, "#c98b32");
      I.solid(ox + dx, dz, 2.5, 2.1);
    });
    I.table(ox, 3.0, "kh1", 4, "#8d6e63", "#b68036");
    I.plant(I.x0 + 1.3, I.z0 + 1.3); I.plant(I.x1 - 1.3, I.z0 + 1.3);
    I.exit();
    return I.fin({ npcs: [npc("hi_khan_i", "hi_khan", ox, z0 + 3.1, "hist:caravans")] });
  };

  // 7) السوق التاريخي المسقوف
  INT.defs.hist_souq = () => {
    const I = hall({ id: "hist_souq", hw: 15, hd: 10, floor: "#e4d2b0", floor2: "#d4bd94", wall: "#f5e8cf", mat: "#c9702e", cam: 23 });
    const B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.3, 9, "#c9702e", "hist:market", "⚖️ بورصة السوق التاريخي والحرف", "#168077");
    const stalls = [
      [-9.5, 1.5, "#7b3b2e", "hist:craft:blacksmith", "⚒️ الحداد"],
      [-9.5, 5.5, "#1d8a7e", "hist:craft:potter", "🏺 الفخار"],
      [9.5, 1.5, "#7e3a8a", "hist:craft:weaver", "🧶 النسّاج"],
      [9.5, 5.5, "#c9963a", "hist:craft:jeweler", "💎 المجوهرات"]
    ];
    stalls.forEach(([dx, dz, col, act, txt], i) => {
      B.box(ox + dx, 0, dz, 3.4, 1.1, 2.0, col);
      B.box(ox + dx, 2.3, dz, 3.6, 0.25, 2.2, col);
      I.solid(ox + dx, dz, 3.6, 2.2);
      I.act(act, ox + dx, dz, 2.8, ox + dx + (dx < 0 ? 2.6 : -2.6), dz, 1.0);
      I.lab("sq_" + i, txt, ox + dx, 2.8, dz, act);
    });
    I.exit();
    return I.fin({ npcs: [npc("hi_souq_i", "hi_souq", ox, z0 + 3.1, "hist:market")] });
  };
})();
