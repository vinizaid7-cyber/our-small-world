/* بناء القرية ثلاثية الأبعاد: الأرض، الطرق، الأماكن الخاصة، الزينة */
(function () {
  const OSW = window.OSW, X = OSW.EX, R = OSW.R, Builder = OSW.Builder, M = OSW.M;
  const dk = OSW.col.dk, lt = OSW.col.lt, PI = Math.PI, hy = Math.hypot;
  const angDiff0 = (a, b) => { let d = b - a; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; };
  const S = (OSW.S = { acts: [], colliders: [], rects: [], dynRects: {}, labels: [], poi: {}, pos: {}, dyn: {}, ready: false, bounds: { x0: -112, x1: 112, z0: -62, z1: 98 } });

  /* ---------- المواقع ---------- */
  const POS = S.pos;
  const VH = []; // بيوت القرية: ما بقى فيه، كل الأماكن صارت جوّا بيتنا
  Object.assign(POS, {
    home: { x: 0, z: -14 }, fountain: { x: 0, z: 0 }, tree: { x: -15, z: 0.5 }, plaza: { x: 15, z: -0.5 }, shop: { x: -24, z: 9.5 }, flowers: { x: 24, z: 9 },
    farm: { x: -22, z: -28 }, gate: { x: 0, z: 31 }, garden: { x: 62, z: 19 }, lighthouse: { x: 75, z: -2 }, lake: { x: 72, z: -2 },
  });
  OSW.VILLAGERS = [
    { id: "v1", x: -12, z: 40, name: "بيت أبو خالد", wall: "#e8d3b0", roof: "#a4452c", t: 0 },
    { id: "v2", x: 12, z: 40, name: "بيت أم أحمد", wall: "#f2c6c6", roof: "#7a3b69", t: 1 },
    { id: "v3", x: -30, z: 40, name: "بيت المعلّم سامر", wall: "#cde4d3", roof: "#2e6f5e", t: 2 },
    { id: "v4", x: 30, z: 40, name: "بيت الخالة سعاد", wall: "#f3e2a9", roof: "#c0642a", t: 3 },
    { id: "v5", x: -48, z: 40, name: "بيت أبو علي", wall: "#cfd8f0", roof: "#3a4f9a", t: 4 },
    { id: "v6", x: 48, z: 40, name: "بيت الولد فادي", wall: "#f0d0f5", roof: "#8a3fa8", t: 5 },
    { id: "v7", x: -66, z: 40, name: "بيت أبو سليمان", wall: "#f1e3c6", roof: "#9b3b2b", t: 6 },
    { id: "v8", x: 66, z: 40, name: "المزرعة الصغيرة", wall: "#f6f0e0", roof: "#2f7d46", t: 7 },
    { id: "v9", x: -57, z: 66, name: "الفيلا الزرقاء", wall: "#d6e6f5", roof: "#2f5d9a", t: 0 },
    { id: "v10", x: -38, z: 66, name: "بيت الحجر", wall: "#e9d6b0", roof: "#6b8e5a", t: 1 },
    { id: "v11", x: -20, z: 66, name: "بيت الزجاج", wall: "#8e9aa8", roof: "#334155", t: 2 },
    { id: "v12", x: 20, z: 66, name: "كوخ الورد", wall: "#f7d6e0", roof: "#b5476b", t: 3 },
    { id: "v13", x: 38, z: 66, name: "القصر الصغير", wall: "#efe7d2", roof: "#7a3b69", t: 4 },
    { id: "v14", x: 57, z: 66, name: "بيت الدائرة", wall: "#e0f0d8", roof: "#d97a2b", t: 5 },
  ];
  OSW.VILLAGERS.forEach((v) => (POS[v.id] = { x: v.x, z: v.z }));

  S.col = null;
  const reg = (act, x, y, z, r, px, pz) => { S.acts.push({ act, x, y, z, r }); if (px != null) S.poi[act] = { x: px, z: pz }; };
  const col = (x, z, r) => S.colliders.push({ x, z, r });
  // سلسلة دوائر متلاصقة = جدار صلب (للأسوار المنحنية)
  col.line = (x0, z0, x1, z1, r = 0.3) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / (r * 1.3))); for (let i = 0; i <= n; i++) S.colliders.push({ x: x0 + ((x1 - x0) * i) / n, z: z0 + ((z1 - z0) * i) / n, r }); };
  // مستطيل صلب (حدود x0,z0 → x1,z1)
  col.rect = (x0, z0, x1, z1) => S.rects.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
  // سور مستقيم: مستطيل رفيع إذا كان على المحور، وإلا سلسلة دوائر
  col.seg = (x0, z0, x1, z1, th = 0.12) => { if (Math.abs(x1 - x0) < 0.01 || Math.abs(z1 - z0) < 0.01) col.rect(Math.min(x0, x1) - th, Math.min(z0, z1) - th, Math.max(x0, x1) + th, Math.max(z0, z1) + th); else col.line(x0, z0, x1, z1, 0.3); };
  const label = (id, text, x, y, z, o = {}) => S.labels.push(Object.assign({ id, text, x, y, z, cls: "", max: 60 }, o));
  S.reg = reg; S.label = label; S.col = col;

  /* ---------- ألوان المواسم ---------- */
  const SEAS = {
    winter: { g1: "#dfeaf1", g2: "#c3d6e2", l1: "#8fae9f", l2: "#eaf4f2", hill: "#c5d8e6" },
    spring: { g1: "#8ed98f", g2: "#62b873", l1: "#7fd08a", l2: "#ffb7d5", hill: "#9ccdb4" },
    summer: { g1: "#7bcb84", g2: "#52a366", l1: "#4fa860", l2: "#8bd36f", hill: "#8fc4a3" },
    autumn: { g1: "#bcc77a", g2: "#8fa75f", l1: "#d98a2b", l2: "#c2562b", hill: "#b9b88a" },
  };

  /* ---------- طرق ---------- */
  const PATHS = [];
  function planPaths() {
    const doors = [];
    VH.forEach((h) => { if (h.id === "capsule" || h.id === "surprise") return; const p = S.poi["house:" + h.id]; doors.push([p.x, p.z]); });
    doors.forEach(([x, z]) => PATHS.push([[0, 0], [x * 0.55, z * 0.55 + (z > 0 ? -1 : 1)], [x, z]]));
    PATHS.push([[0, 32], [0, 14]], [[0, -2], [0, -8]]);
    PATHS.push([[-24, 15.6], [-24, 11]], [[-12, 8], [-24, 15.6]], [[24, 15.6], [12, 8]], [[24, 15.6], [24, 11]]);
    PATHS.push([[-30, 6], [-44, 7.5], [-62, 14.6]], [[34, 6], [48, 10], [61, 25.6]], [[44, 4], [58, -2]]);
    PATHS.push([[-12, -3], [-24, -4], [-24, -9], [-24, -12]], [[-24, -4], [-30, 6]], [[-44, 7.5], [-44, 5]]);
    PATHS.push([[0, 33], [0, 58]], [[-72, 34.5], [72, 34.5]], [[-72, 57], [72, 57]]);
    OSW.VILLAGERS.forEach((v) => { const z = v.z > 50 ? 57 : 34.5; PATHS.push([[v.x, v.z - 5.8], [v.x, z]]); });
  }
  function distSeg(px, pz, a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((px - a[0]) * dx + (pz - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t));
    return hy(px - (a[0] + t * dx), pz - (a[1] + t * dz));
  }
  const nearPath = (x, z, d) => PATHS.some((p) => { for (let i = 0; i < p.length - 1; i++) if (distSeg(x, z, p[i], p[i + 1]) < d) return true; return false; });

  /* ---------- أشياء صغيرة ---------- */
  function tree(B, F, x, z, k, c1, c2, rnd) {
    const s = 0.8 + rnd() * 0.7;
    if (k < 0.62) { F.cyl(x, 0, z, 0.28 * s, 0.22 * s, 2.0 * s, "#7a5236", 6); [[0, 2.7, 0, 1.5], [-0.8, 2.3, 0.2, 1.1], [0.8, 2.4, -0.2, 1.2], [0.1, 3.4, 0.1, 1.0]].forEach(([dx, dy, dz, r]) => F.sphere(x + dx * s, dy * s, z + dz * s, r * s, r * s * 0.92, r * s, rnd() < 0.5 ? c1 : dk(c1, 0.08), 6)); }
    else { F.cyl(x, 0, z, 0.25 * s, 0.2 * s, 1.2 * s, "#6b4a30", 6); for (let i = 0; i < 3; i++) F.cyl(x, (0.9 + i * 1.15) * s, z, (1.7 - i * 0.45) * s, 0.1, 1.9 * s, dk(c1, 0.18 + i * 0.04), 8); }
    S._sh(x, z, 1.7 * s);
  }
  S._sh = () => {};

  /* ---------- البناء الرئيسي ---------- */
  S.build = function (season, rebuildOnly) {
    const gl = R.gl, P = SEAS[season] || SEAS.summer;
    S.season = season; S.palette = P;
    ["main", "foliage", "shadow"].forEach((k) => S.dyn[k] && R.free(S.dyn[k]));
    S.acts.length = 0; S.colliders.length = 0; S.rects.length = 0; S.labels.length = 0; Object.keys(S.poi).forEach((k) => delete S.poi[k]); PATHS.length = 0;
    const B = new Builder(), F = new Builder(), SH = new Builder();
    S._sh = (x, z, r) => SH.disc(x, 0.1, z, r, "#000000", 12);
    const rnd = OSW.seeded(4242);

    /* مواقع الاستقبال (POI) قبل رسم الطرق */
    VH.forEach((h) => { const p = POS[h.id], m = OSW.HMETA[h.id] || {}; S.poi["house:" + h.id] = { x: p.x, z: p.z + (m.dz || 5.6) }; });
    Object.assign(S.poi, {
      home: { x: 0, z: -7.2 }, fountain: { x: 0, z: 5.6 }, plaza: { x: 15, z: 3.4 }, tree: { x: -15, z: 5.2 }, shop: { x: -24, z: 15.8 }, flowers: { x: 22.4, z: 14.6 }, gate: { x: 0, z: 28.4 }, garden: { x: 62, z: 25.4 }, lighthouse: { x: 61, z: -2 },
    });
    OSW.VILLAGERS.forEach((v) => (S.poi[v.id] = { x: v.x, z: v.z - 5.8 }));
    planPaths();

    /* الأرض والتلال البعيدة */
    B.disc(0, 0, 0, 260, P.g2, 40); B.disc(2, 0.01, 6, 128, P.g1, 40);
    for (let i = 0; i < 46; i++) { const x = -90 + rnd() * 190, z = -40 + rnd() * 95; B.push(x, 0.04, z, 0, 0, 0, 1, 1, 0.6 + rnd() * 0.5); B.disc(0, 0, 0, 3 + rnd() * 7, rnd() < 0.5 ? lt(P.g1, 0.07) : dk(P.g2, 0.05), 12); B.pop(); }
    for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2, r = 170 + rnd() * 50, sk = Math.abs(angDiff0(a, PI / 2)) < 0.62; if (sk) { rnd(); rnd(); rnd(); rnd(); continue; } B.sphere(Math.cos(a) * r, -4, Math.sin(a) * r, 55 + rnd() * 40, 24 + rnd() * 26, 55 + rnd() * 40, i % 2 ? P.hill : dk(P.hill, 0.1), 8, 0, true); }
    for (let i = 0; i < 9; i++) { const a = PI * (1.1 + i * 0.1), r = 210; B.cyl(Math.cos(a) * r, -2, Math.sin(a) * r, 34 + rnd() * 20, 0, 60 + rnd() * 40, i % 2 ? "#a7b6d3" : "#97a8c9", 7); }

    /* بحيرة + جزيرة */
    const lk = POS.lake;
    B.push(lk.x, 0.05, lk.z, 0, 0, 0, 1, 1, 1.35); B.disc(0, 0, 0, 13.2, "#e9d8b4", 28); B.disc(0, 0.04, 0, 12.0, "#4aa3e0", 28); B.disc(0, 0.06, 0, 8.6, "#63b6ee", 28); B.pop();
    B.push(75, 0.1, -2, 0, 0, 0, 1, 1, 1); B.disc(0, 0, 0, 3.6, "#e9d8b4", 14); B.pop();
    for (let i = 0; i < 8; i++) B.box(57.5 + i * 0.9, 0.15, -2, 0.85, 0.14, 2.2, i % 2 ? "#a97c50" : "#b98d5e");
    [[72, -12, 5.6], [72, -6, 9.4], [72, -2, 9.8], [72, 2, 9.4], [72, 8.5, 6.4], [79, -2, 4]].forEach(([x, z, r]) => col(x, z, r));
    /* طرق وساحة */
    PATHS.forEach((p) => B.strip(p, 3.4, 0.07, "#e3d3ad"));
    B.disc(0, 0.08, 0, 12.6, "#d3c196", 40); B.disc(0, 0.09, 0, 11.7, "#e9dcba", 40); B.disc(0, 0.1, 0, 8.4, "#e1d1aa", 40);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; B.disc(Math.cos(a) * 10.1, 0.11, Math.sin(a) * 10.1, 0.5, "#cdbb90", 6); }

    /* البيوت الرئيسية (كل بيت بشكله) */
    VH.forEach((h) => {
      const p = POS[h.id], m = OSW.HMETA[h.id] || { r: 5, dz: 5.6, ly: 9 }, d = OSW.HDESIGN[h.id];
      if (!d) return;
      B.push(p.x, 0, p.z); d(B, h); B.pop();
      SH.disc(p.x, 0.1, p.z, m.r + 1.2, "#000000", 16); col(p.x, p.z, m.r);
      const mini = h.kind === "mini", act = "house:" + h.id;
      reg(act, p.x, mini ? 1.6 : 2.6, p.z, mini ? 2.6 : (m.r + 0.8));
      label(act, `${h.emoji} ${h.name}`, p.x, m.ly, p.z, { cls: mini ? "sm" : "", max: mini ? 40 : 75, act, badge: h.id });
    });

    SH.disc(0, 0.1, -14, 6.6, "#000000", 16); col(0, -14, 4.9);
    reg("home", 0, 2.8, -14, 5.6); label("home_sign", "", 0, 0, -14, { hidden: true });
    /* النافورة */
    const fo = POS.fountain;
    B.cyl(fo.x, 0, fo.z, 3.9, 3.9, 0.8, "#9aa7b8", 20); B.cyl(fo.x, 0.8, fo.z, 3.5, 3.5, 0.05, "#bfe6ff", 20); B.cyl(fo.x, 0, fo.z, 3.3, 3.3, 0.78, "#cfe9fb", 20);
    B.cyl(fo.x, 0.78, fo.z, 3.35, 3.35, 0.08, "#9cdcff", 20); B.cyl(fo.x, 0.8, fo.z, 0.6, 0.45, 2.4, "#a3b3c4", 10); B.cyl(fo.x, 3.1, fo.z, 1.7, 0.7, 0.35, "#93a6ba", 14); B.cyl(fo.x, 3.4, fo.z, 1.5, 1.5, 0.05, "#bfe6ff", 14);
    B.sphere(fo.x, 3.9, fo.z, 0.45, 0.5, 0.45, "#bfe6ff", 8);
    SH.disc(fo.x, 0.1, fo.z, 4.4, "#000000", 18); col(fo.x, fo.z, 3.9); reg("fountain", fo.x, 1.8, fo.z, 4.6);
    label("fountain", "⛲ النافورة", fo.x, 6.2, fo.z, { act: "fountain", max: 55 });
    /* الساحة: لوحة */
    const pl = POS.plaza;
    B.box(pl.x - 2.2, 0, pl.z, 0.3, 3.4, 0.3, "#7a5236"); B.box(pl.x + 2.2, 0, pl.z, 0.3, 3.4, 0.3, "#7a5236");
    B.box(pl.x, 1.5, pl.z, 5.6, 2.9, 0.35, "#9a6a45"); B.box(pl.x, 1.7, pl.z + 0.2, 5.2, 2.5, 0.1, "#c89a6a"); B.box(pl.x, 4.4, pl.z, 6, 0.3, 0.6, "#7a5236");
    SH.disc(pl.x, 0.1, pl.z, 3.2, "#000000", 12); col(pl.x, pl.z, 2.6); reg("plaza", pl.x, 2.4, pl.z, 3.6);
    label("plaza", "📌 لوحة الساحة", pl.x, 6, pl.z, { act: "plaza", max: 55 });
    /* الشجرة الكبيرة (أوراقها ديناميكية) */
    const tr = POS.tree;
    B.cyl(tr.x, 0, tr.z, 1.0, 0.7, 5.2, "#7a5236", 9); B.cyl(tr.x, 0, tr.z, 1.5, 1.0, 0.7, "#6b4a30", 9);
    B.push(tr.x, 3.4, tr.z, 0.6, 0, 0.9); B.cyl(0, 0, 0, 0.3, 0.2, 3.0, "#7a5236", 6); B.pop(); B.push(tr.x, 3.8, tr.z, 2.4, 0, -0.9); B.cyl(0, 0, 0, 0.3, 0.2, 3.0, "#7a5236", 6); B.pop();
    [[0, 8.6, 0, 3.9], [-3.2, 7.2, 0.6, 3.0], [3.2, 7.3, -0.4, 3.1], [-1.3, 10.4, 0.3, 3.0], [1.7, 10.0, 0.4, 2.9]].forEach(([dx, dy, dz, r]) => F.sphere(tr.x + dx, dy, tr.z + dz, r, r * 0.92, r, P.l1, 10));
    SH.disc(tr.x, 0.1, tr.z, 5.4, "#000000", 18); col(tr.x, tr.z, 1.5); reg("tree", tr.x, 7, tr.z, 5);
    label("tree", "🌳 شجرة العلاقة", tr.x, 14.6, tr.z, { act: "tree", max: 70 });
    /* بوابة القرية */
    const g = POS.gate;
    [-5.6, 5.6].forEach((dx) => { B.box(g.x + dx, 0, g.z, 1.5, 4.8, 1.5, "#b7aea0"); B.box(g.x + dx, 4.8, g.z, 1.9, 0.4, 1.9, "#8d8478"); B.sphere(g.x + dx, 5.6, g.z, 0.4, 0.45, 0.4, "#ffe7a0", 7, 1); col(g.x + dx, g.z, 1.1); });
    B.box(g.x, 4.6, g.z, 10.8, 0.9, 0.9, "#6b4a3a"); B.box(g.x, 4.7, g.z + 0.46, 10.0, 0.7, 0.08, "#8a6350");
    for (let i = 0; i < 10; i++) { const x = g.x + (i < 5 ? -1 : 1) * (8 + (i % 5) * 2.6); B.box(x, 0, g.z, 0.3, 1.5, 0.3, "#b98d5e"); col(x, g.z, 0.5); }
    col.seg(g.x - 27.9, g.z, g.x - 8, g.z); col.seg(g.x + 8, g.z, g.x + 27.9, g.z);
    B.box(g.x - 20.4, 0.9, g.z, 15, 0.25, 0.2, "#a97c50"); B.box(g.x + 20.4, 0.9, g.z, 15, 0.25, 0.2, "#a97c50");
    reg("gate", g.x, 3, g.z, 5.5); label("gate", "🚪 البوابة", g.x, 7.6, g.z, { act: "gate", max: 70, cls: "gate" });
    /* الحديقة (ملعب صغير) */
    const ga = POS.garden;
    B.push(ga.x, 0.06, ga.z, 0, 0, 0, 1, 1, 0.72); B.disc(0, 0, 0, 10, "#8fd694", 24); B.pop();
    for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2; const x = ga.x + Math.cos(a) * 10, z = ga.z + Math.sin(a) * 7.2; if (Math.abs(a - PI / 2) < 0.4) continue; B.box(x, 0, z, 0.25, 1.0, 0.25, "#b98d5e"); col(x, z, 0.45); }
    for (let i = 0; i < 26; i++) { const a0 = (i / 26) * PI * 2, a1 = ((i + 1) / 26) * PI * 2; if (Math.abs(a0 - PI / 2) < 0.4 || Math.abs(a1 - PI / 2) < 0.4) continue; col.line(ga.x + Math.cos(a0) * 10, ga.z + Math.sin(a0) * 7.2, ga.x + Math.cos(a1) * 10, ga.z + Math.sin(a1) * 7.2, 0.3); }
    [-1.3, 1.3].forEach((dx) => { B.push(ga.x + 3.5 + dx * 1.6, 0, ga.z - 1.2, 0, 0, dx * 0.22); B.box(0, 0, 0, 0.18, 3.6, 0.18, "#7a5236"); B.pop(); });
    B.box(ga.x + 3.5, 3.5, ga.z - 1.2, 4.2, 0.2, 0.2, "#7a5236"); B.box(ga.x + 2.6, 1.0, ga.z - 1.2, 1.2, 0.14, 0.5, "#e63e6d"); B.box(ga.x + 4.4, 1.2, ga.z - 1.2, 1.2, 0.14, 0.5, "#4aa3ff");
    B.box(ga.x - 4, 0.5, ga.z - 1.5, 0.2, 0.9, 2.4, "#cfd3d8"); B.box(ga.x - 4.6, 0.5, ga.z - 1.5, 0.2, 2.2, 2.4, "#ff9f1c"); B.box(ga.x - 5.2, 0, ga.z - 1.5, 0.2, 0.9, 2.4, "#cfd3d8");
    for (let i = 0; i < 24; i++) F.sphere(ga.x - 8 + rnd() * 16, 0.22, ga.z - 4.5 + rnd() * 9, 0.25, 0.22, 0.25, ["#ff8fb1", "#ffd34e", "#fff", "#c9a6ff"][i % 4], 5);
    reg("garden", ga.x, 1.6, ga.z, 8, ga.x, ga.z + 6.4); label("garden", "🎮 الحديقة", ga.x, 5.6, ga.z, { act: "garden", max: 60 });
    /* المنارة */
    for (let i = 0; i < 4; i++) B.cyl(75, 0.2 + i * 2.7, -2, 2.0 - i * 0.26, 1.74 - i * 0.26, 2.7, i % 2 ? "#ffffff" : "#e5484d", 12);
    B.cyl(75, 11.0, -2, 2.4, 2.4, 0.3, "#444", 12); B.cyl(75, 11.3, -2, 1.6, 1.6, 1.7, "#cfd3d8", 10); B.cyl(75, 13.0, -2, 2.0, 0, 1.8, "#e5484d", 12);
    SH.disc(75, 0.15, -2, 3.6, "#000000", 14); reg("lighthouse", 75, 6, -2, 4.2); label("lighthouse", "🔦 المنارة", 75, 16, -2, { act: "lighthouse", max: 90 });

    /* دكّان سعدون */
    const sh = POS.shop;
    B.push(sh.x, 0, sh.z); OSW.hparts.found(B, 8, 5.4);
    B.box(0, 0.35, 0, 8, 3.5, 5.4, "#f4ead2"); B.prism(0, 3.85, 0, 8.8, 2.3, 6, "#2f8f5b");
    for (let i = 0; i < 8; i++) { B.push(-3.5 + i * 1.0, 3.4, 3.5, 0, -0.5); B.box(0, 0, 0, 0.98, 0.1, 2.0, i % 2 ? "#ffffff" : "#2f8f5b"); B.pop(); }
    OSW.hparts.win(B, -2.8, 1.6, 2.7, 1.5, 1.4); OSW.hparts.win(B, 2.8, 1.6, 2.7, 1.5, 1.4); OSW.hparts.door(B, 0, 2.7, "#7a4a1f");
    B.box(0, 0, 4.2, 3.6, 1.05, 1.0, "#a97c50"); B.box(0, 1.05, 4.2, 3.9, 0.12, 1.2, "#d7b98a");
    [[-4.7, "#e63946"], [-4.7, "#ffd23f"], [4.7, "#ff9f1c"], [4.7, "#7ac74f"]].forEach(([x, c], i) => { const z = 3.3 + (i % 2) * 1.3; B.box(x, 0, z, 1.1, 0.7, 1.1, "#a97c50"); for (let k = 0; k < 4; k++) B.sphere(x - 0.3 + (k % 2) * 0.6, 0.85, z - 0.3 + (k >> 1) * 0.6, 0.28, 0.28, 0.28, c, 6); });
    B.sphere(-6.0, 0.5, 2.6, 0.55, 0.5, 0.5, "#d9c9a3", 6); B.sphere(-6.6, 0.4, 3.3, 0.5, 0.45, 0.5, "#cdbb90", 6);
    B.pop(); SH.disc(sh.x, 0.1, sh.z, 6.6, "#000000", 16); col(sh.x, sh.z, 5.2);
    reg("shop", sh.x, 2.4, sh.z, 6, S.poi.shop.x, S.poi.shop.z); label("shop", "🏪 بقالة سعدون", sh.x, 8.8, sh.z, { act: "shop", max: 80 });

    /* حديقة ورود الحب */
    const fl = POS.flowers;
    B.push(fl.x, 0.06, fl.z, 0, 0, 0, 1, 1, 1); B.disc(0, 0, 0, 5.2, "#7a5a3a", 24); B.disc(0, 0.03, 0, 4.7, "#5b3f27", 24); B.pop();
    for (let i = 0; i < 28; i++) { const a = (i / 28) * PI * 2, x = fl.x + Math.cos(a) * 6.4, z = fl.z + Math.sin(a) * 6.4; if (Math.abs(a - PI / 2) < 0.38) continue; B.sphere(x, 0.3, z, 0.4, 0.3, 0.4, "#f1ece0", 6); col(x, z, 0.45); }
    for (let i = 0; i < 28; i++) { const a0 = (i / 28) * PI * 2, a1 = ((i + 1) / 28) * PI * 2; if (Math.abs(a0 - PI / 2) < 0.38 || Math.abs(a1 - PI / 2) < 0.38) continue; col.line(fl.x + Math.cos(a0) * 6.4, fl.z + Math.sin(a0) * 6.4, fl.x + Math.cos(a1) * 6.4, fl.z + Math.sin(a1) * 6.4, 0.3); }
    [-1, 1].forEach((d) => { B.cyl(fl.x + d * 2.0, 0, fl.z + 5.4, 0.18, 0.18, 3.6, "#fff", 6); for (let k = 0; k < 4; k++) B.sphere(fl.x + d * 2.0, 1.0 + k * 0.7, fl.z + 5.65, 0.3, 0.3, 0.2, ["#ff4d6d", "#ff8fab"][k % 2], 6, 0.6); });
    B.box(fl.x, 3.4, fl.z + 5.4, 4.4, 0.2, 0.3, "#fff"); for (let k = 0; k < 7; k++) B.sphere(fl.x - 2.0 + k * 0.67, 3.55, fl.z + 5.4, 0.3, 0.3, 0.3, ["#ff4d6d", "#ff8fab", "#ffb3c7"][k % 3], 6, 0.6);
    B.box(fl.x - 6.6, 0, fl.z - 1, 0.7, 0.7, 2.4, "#a97c50"); B.box(fl.x - 6.6, 0.7, fl.z - 1, 0.7, 0.14, 2.6, "#b98d5e");
    B.cyl(fl.x + 6.2, 0, fl.z + 1, 0.35, 0.3, 0.7, "#4a90c2", 8); B.box(fl.x + 6.7, 0.35, fl.z + 1, 0.7, 0.14, 0.14, "#4a90c2"); B.box(fl.x + 6.0, 0.7, fl.z + 1, 0.5, 0.1, 0.1, "#4a90c2");
    SH.disc(fl.x, 0.1, fl.z, 6, "#000000", 16);
    reg("flowers", fl.x, 1.2, fl.z, 5.6, S.poi.flowers.x, S.poi.flowers.z); label("flowers", "🌹 ورود الحب", fl.x, 5.2, fl.z, { act: "flowers", max: 70, badge: "flowers" });

    /* بيوت أهل القرية: صفين وشوارع منظمة */
    OSW.VILLAGERS.forEach((v) => X.buildVillager({ B, SH, col, label }, v));
    X.buildFarm({ B, F, SH, S, reg, label, col, rnd }); X.buildPier({ B, S, reg, label }); X.buildDealer({ B, SH, S, reg, label, col }); X.buildRoadAndIsland({ B, F, SH, S, reg, label, col, rnd, P });

    /* زينة: أشجار متنوعة وشجيرات وزهور وأحجار */
    const anchors = [];
    Object.keys(POS).forEach((k) => anchors.push([POS[k].x, POS[k].z, k === "lake" ? 17 : k === "farm" ? 3 : 8.4]));
    anchors.push([X.BUTCHER.x, X.BUTCHER.z, 9], [X.SQUARE.x, X.SQUARE.z, 12]);
    const inRect = (x, z, a, b, c2, d) => x > a && x < b && z > c2 && z < d;
    const okSpot = (x, z, r) => !(x < S.bounds.x0 + 2 || x > S.bounds.x1 - 2 || z < S.bounds.z0 + 1 || z > S.bounds.z1 - 1) && !anchors.some((a) => hy(x - a[0], z - a[1]) < a[2] + r) && hy(x, z) > 14.5 && !nearPath(x, z, 3.4) && !inRect(x, z, -64, -8, -50, -6) && !inRect(x, z, -4, 10, -52, -34) && !inRect(x, z, 58, 92, -20, 14) && !inRect(x, z, -76, 76, 31, 75) && !inRect(x, z, -34, 40, 70, 102);
    const kinds = ["oak", "pine", "cypress", "olive", "birch", "round"];
    function deco(x, z, k, s) {
      if (k === "pine") { B.cyl(x, 0, z, 0.25 * s, 0.2 * s, 1.2 * s, "#6b4a30", 6); for (let i = 0; i < 4; i++) F.cyl(x, (0.9 + i * 1.05) * s, z, (1.8 - i * 0.4) * s, 0.1, 1.9 * s, dk(P.l1, 0.2 + i * 0.04), 8); }
      else if (k === "cypress") { B.cyl(x, 0, z, 0.2 * s, 0.18 * s, 0.8 * s, "#6b4a30", 5); F.sphere(x, 2.6 * s, z, 0.8 * s, 2.6 * s, 0.8 * s, dk(P.l1, 0.3), 7); }
      else if (k === "olive") { B.cyl(x, 0, z, 0.32 * s, 0.22 * s, 1.3 * s, "#8a7a62", 6); B.push(x, 1.0 * s, z, 0.5, 0, 0.4); B.cyl(0, 0, 0, 0.16 * s, 0.1 * s, 1.2 * s, "#8a7a62", 5); B.pop(); [[0, 2.3, 0, 1.5], [-1.0, 2.0, 0.3, 1.1], [1.0, 2.1, -0.3, 1.2]].forEach(([dx, dy, dz, r]) => F.sphere(x + dx * s, dy * s, z + dz * s, r * s, r * s * 0.6, r * s, "#8aa07a", 6)); }
      else if (k === "birch") { B.cyl(x, 0, z, 0.2 * s, 0.16 * s, 2.6 * s, "#efe9dc", 6); for (let i = 0; i < 3; i++) B.box(x - 0.1 * s, (0.6 + i * 0.7) * s, z + 0.1 * s, 0.25 * s, 0.08 * s, 0.1 * s, "#444"); [[0, 3.2, 0, 1.3], [-0.7, 2.8, 0.2, 1.0], [0.7, 3.0, -0.2, 1.0]].forEach(([dx, dy, dz, r]) => F.sphere(x + dx * s, dy * s, z + dz * s, r * s, r * s * 0.95, r * s, lt(P.l1, 0.15), 6)); }
      else if (k === "round") { B.cyl(x, 0, z, 0.3 * s, 0.24 * s, 1.5 * s, "#7a5236", 6); F.sphere(x, 2.7 * s, z, 1.7 * s, 1.5 * s, 1.7 * s, rnd() < 0.5 ? P.l1 : dk(P.l1, 0.1), 8); F.sphere(x + 0.6 * s, 3.3 * s, z - 0.3 * s, 1.0 * s, 0.9 * s, 1.0 * s, lt(P.l1, 0.08), 7); }
      else tree(B, F, x, z, rnd() * 0.5, P.l1, P.l2, rnd);
      S._sh(x, z, 1.7 * s);
    }
    let nt = 0;
    for (let t = 0; t < 9000 && nt < 190; t++) {
      const x = S.bounds.x0 + rnd() * (S.bounds.x1 - S.bounds.x0), z = S.bounds.z0 + rnd() * (S.bounds.z1 - S.bounds.z0); if (!okSpot(x, z, 1.4)) continue;
      nt++; deco(x, z, kinds[(rnd() * kinds.length) | 0], 0.85 + rnd() * 0.6); col(x, z, 0.8); anchors.push([x, z, 0.5]);
    }
    for (let t = 0, n = 0; t < 7000 && n < 150; t++) {
      const x = S.bounds.x0 + rnd() * (S.bounds.x1 - S.bounds.x0), z = S.bounds.z0 + rnd() * (S.bounds.z1 - S.bounds.z0); if (!okSpot(x, z, 0.4)) continue; n++;
      const r = rnd();
      if (r < 0.3) F.sphere(x, 0.5, z, 0.8, 0.6, 0.8, rnd() < 0.5 ? P.l1 : dk(P.l1, 0.1), 6);
      else if (r < 0.8) for (let k = 0; k < 8; k++) { const fx = x + rnd() * 1.8 - 0.9, fz = z + rnd() * 1.8 - 0.9; F.cyl(fx, 0.04, fz, 0.03, 0.02, 0.28, "#4f9a52", 4); F.sphere(fx, 0.34, fz, 0.13, 0.11, 0.13, ["#ff8fb1", "#ffd34e", "#ffffff", "#c9a6ff", "#ff6b6b"][(rnd() * 5) | 0], 4, 0.15); }
      else { B.sphere(x, 0.3, z, 0.7, 0.45, 0.6, "#9aa0a8", 5); B.sphere(x + 0.7, 0.2, z + 0.3, 0.4, 0.28, 0.4, "#aab0b8", 5); }
    }
    // عشب طويل متفرق
    for (let t = 0, n = 0; t < 6000 && n < 320; t++) { const x = S.bounds.x0 + rnd() * (S.bounds.x1 - S.bounds.x0), z = S.bounds.z0 + rnd() * (S.bounds.z1 - S.bounds.z0); if (!okSpot(x, z, 0.2)) continue; n++; for (let k = 0; k < 4; k++) F.cyl(x + (k - 1.5) * 0.12, 0, z + (k % 2) * 0.1, 0.07, 0.01, 0.55 + rnd() * 0.3, dk(P.g1, 0.12), 3); }
    // أعمدة إنارة وكراسي
    S.lamps = [[-7, 9], [7, 9], [-7, 22], [7, 22], [-10, -10], [10, -10], [-14, 14], [14, 14], [0, 26], [-40, 8], [40, 6], [-30, -8], [60, 14], [-6, 37], [6, 37], [-36, 37], [36, 37], [-60, 37], [60, 37], [-6, 55], [6, 55], [-36, 56], [36, 56], [-60, 56], [60, 56], [-2, 46], [2, 46]];
    S.lamps.forEach(([x, z]) => { B.cyl(x, 0, z, 0.1, 0.1, 3.4, "#4a3d38", 6); B.sphere(x, 3.6, z, 0.34, 0.4, 0.34, "#ffe7a0", 7, 1); col(x, z, 0.3); });
    [[-8, 4, 0], [8, 4, 0], [-12, -6, 0.3], [12, -6, -0.3], [-4, 36.5, 0], [4, 36.5, 0], [-4, 57, 0], [4, 57, 0], [26, 12, 0], [-26, 17.5, 0]].forEach(([x, z, r]) => { B.push(x, 0, z, r); B.box(0, 0.4, 0, 1.8, 0.1, 0.55, "#a97c50"); B.box(0, 0.8, -0.22, 1.8, 0.45, 0.08, "#a97c50"); B.box(-0.8, 0, 0, 0.1, 0.4, 0.5, "#555"); B.box(0.8, 0, 0, 0.1, 0.4, 0.5, "#555"); B.pop(); });
    // ساحة السوق الجنوبية: بئر + برج ساعة + بسطات
    const sq = X.SQUARE;
    B.disc(sq.x, 0.08, sq.z, 11, "#d3c196", 32); B.disc(sq.x, 0.09, sq.z, 10.2, "#e9dcba", 32);
    for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2; B.disc(sq.x + Math.cos(a) * 8.4, 0.1, sq.z + Math.sin(a) * 8.4, 0.45, "#cdbb90", 6); }
    B.cyl(sq.x, 0, sq.z, 2.0, 2.0, 0.7, "#9aa7b8", 14); B.cyl(sq.x, 0.6, sq.z, 1.7, 1.7, 0.1, "#63b6ee", 14);
    B.cyl(sq.x, 0, sq.z + 0.0, 0.1, 0.1, 0.1, "#fff", 4); col(sq.x, sq.z, 2.2);
    B.box(sq.x, 0.7, sq.z - 7.5, 1.8, 7.5, 1.8, "#e9dcc0"); B.box(sq.x, 8.2, sq.z - 7.5, 2.4, 0.4, 2.4, "#8a3b2e"); B.prism(sq.x, 8.6, sq.z - 7.5, 2.6, 1.6, 2.6, "#8a3b2e"); B.cyl(sq.x, 5.3, sq.z - 6.6, 0.8, 0.8, 0.1, "#fffdf5", 12); B.box(sq.x, 5.2, sq.z - 6.55, 0.08, 0.8, 0.05, "#333"); col(sq.x, sq.z - 7.5, 1.6); S._sh(sq.x, sq.z - 7.5, 2.4);
    [[-6.5, 2, "#c0392b"], [6.5, 2, "#2a9d8f"], [-6.5, -3, "#e0a200"], [6.5, -3, "#6e4bc4"]].forEach(([dx, dz, cc]) => { const x = sq.x + dx, z = sq.z + dz; B.box(x, 0, z, 2.6, 1.0, 1.4, "#a97c50"); [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]].forEach(([px, pz]) => B.box(x + px, 1.0, z + pz, 0.1, 1.6, 0.1, "#7a5236")); for (let i = 0; i < 4; i++) { B.push(x - 1.4 + i * 0.95, 2.4, z, 0, 0, 0.12); B.box(0, 0, 0, 0.93, 0.08, 1.8, i % 2 ? "#fff" : cc); B.pop(); } for (let k = 0; k < 5; k++) B.sphere(x - 0.9 + k * 0.45, 1.15, z, 0.2, 0.17, 0.2, ["#e63946", "#ffd23f", "#7ac74f", "#ff8c42", "#9b5de5"][k], 5); col(x, z, 1.5); });
    label("square", "🏘️ ساحة السوق", sq.x, 7, sq.z, { cls: "sm", max: 60 });

    S.dyn.main = B.build(gl); S.dyn.foliage = F.build(gl); S.dyn.shadow = SH.build(gl);

    /* كنوز مخبّأة (عناصر ملصقة) */
    OSW.HIDDEN.forEach((o) => label("hid_" + o.id, o.emoji, (o.x - 1300) / 21, 1.2, (o.y - 940) / 21, { cls: "hid", act: "hidden:" + o.id, max: 26, hid: o.id }));
    S.ready = true;
  };

  /* ---------- أجزاء ديناميكية (تتغير مع البيانات) ---------- */
  const swap = (name, b) => { if (S.dyn[name]) R.free(S.dyn[name]); S.dyn[name] = b.build(R.gl); };
  S.rebuildTree = (total) => {
    const B = new Builder(), tr = POS.tree, rnd = OSW.seeded(7), P = S.palette || SEAS.summer;
    for (let i = 0, n = Math.min(total, 160); i < n; i++) {
      const th = rnd() * PI * 2, ph = Math.acos(1 - rnd() * 1.1), r = 4.2;
      B.sphere(tr.x + Math.cos(th) * Math.sin(ph) * r * 1.0, 8.3 + Math.cos(ph) * r * 0.95, tr.z + Math.sin(th) * Math.sin(ph) * r, 0.34, 0.3, 0.34, i % 7 === 0 ? "#ffd54a" : P.l2, 5, i % 7 === 0 ? 0.4 : 0);
    }
    for (let i = 0, n = Math.min(Math.floor(total / 10), 16); i < n; i++) {
      const th = rnd() * PI * 2, r = 3.2 + rnd() * 1.4, x = tr.x + Math.cos(th) * r, z = tr.z + Math.sin(th) * r, y = 6.2 + rnd() * 4;
      B.sphere(x - 0.15, y, z, 0.2, 0.2, 0.2, "#e11d48", 6, 0.8); B.sphere(x + 0.15, y, z, 0.2, 0.2, 0.2, "#e11d48", 6, 0.8); B.cyl(x, y - 0.5, z, 0.0, 0.34, 0.45, "#e11d48", 4, 0.8);
    }
    swap("tree", B);
  };
  S.rebuildBoard = (n) => {
    const B = new Builder(), pl = POS.plaza, cols = ["#fff3a0", "#ffc2d6", "#bfe9ff", "#c9f2c7", "#e1ccff"];
    for (let i = 0; i < Math.min(n, 9); i++) { const x = pl.x - 2.0 + (i % 3) * 1.45, y = 1.8 + Math.floor(i / 3) * 0.9; B.push(x, y, pl.z + 0.3, 0, 0, ((i * 37) % 11 - 5) * 0.02); B.box(0, 0, 0, 1.15, 0.75, 0.06, cols[i % 5]); B.box(0, 0.45, 0.04, 0.8, 0.05, 0.02, "#555"); B.pop(); }
    swap("board", B);
  };
  S.rebuildHome = (cfg) => {
    const B = new Builder(), h = POS.home, wall = cfg.wall, roof = cfg.roof;
    // قوالب شكل البيت من برا: 0 = كلاسيك، 1..8 = تصاميم بيوت القرية
    const tpl = +cfg.tpl || 0, HB = OSW.EX && OSW.EX.HOUSE && OSW.EX.HOUSE[tpl - 1];
    if (tpl >= 1 && HB) {
      const FP = OSW.EX.FOOT[tpl - 1] || [8, 6];
      B.push(h.x, 0, h.z, 0); HB(B, { wall, roof, door: cfg.door, t: tpl - 1 });
      B.cyl(5.9, 0, 4.4, 0.07, 0.07, 2.4, "#555", 6); B.sphere(5.9, 2.5, 4.4, 0.45, 0.4, 0.12, "#ff4d6d", 8, 0.8);
      B.pop(); S.dynRects.home = { x0: h.x - FP[0] / 2 - 0.25, x1: h.x + FP[0] / 2 + 0.25, z0: h.z - FP[1] / 2 - 0.25, z1: h.z + FP[1] / 2 + 0.25 };
      swap("home", B); return;
    }
    S.dynRects.home = null;
    B.push(h.x, 0, h.z, 0); OSW.hparts.found(B, 7.4, 5.8); B.box(0, 0.35, 0, 7.2, 3.6, 5.6, wall); B.prism(0, 3.95, 0, 8.2, 2.9, 6.4, roof);
    B.box(2.4, 5.2, -1.2, 0.9, 2.8, 0.9, "#8a5a44"); OSW.hparts.win(B, -2.4, 1.6, 2.8, 1.3, 1.5); OSW.hparts.win(B, 2.4, 1.6, 2.8, 1.3, 1.5);
    OSW.hparts.door(B, 0, 2.8, cfg.door || "#8a3b3b"); B.sphere(0, 2.5, 2.97, 0.42, 0.42, 0.1, "#ff4d6d", 8, 1); B.sphere(0, 5.3, 3.0, 0.45, 0.4, 0.15, "#ff4d6d", 8, 0.8);
    B.cyl(4.6, 0, 3.8, 0.08, 0.08, 1.2, "#555", 6); B.box(4.6, 1.2, 3.8, 0.8, 0.6, 0.5, "#e5484d");
    for (let i = 0; i < 6; i++) { B.box(-5.4 + i * 0.5, 0, 4.6, 0.12, 0.8, 0.12, "#fff"); } B.box(-4.2, 0.6, 4.6, 2.6, 0.08, 0.1, "#fff");
    B.sphere(-4.6, 0.55, 3.2, 0.7, 0.55, 0.7, "#6ec26e", 7); B.sphere(-3.6, 0.35, 3.8, 0.4, 0.3, 0.4, "#ff8fb1", 6, 0.3);
    B.pop(); swap("home", B);
  };
  S.rebuildWedding = (on) => {
    const B = new Builder();
    if (on) {
      const ax = -7, az = -5.5;
      [-2.2, 2.2].forEach((dx) => { B.cyl(ax + dx, 0, az, 0.16, 0.16, 3.4, "#fff", 8); for (let k = 0; k < 6; k++) B.sphere(ax + dx, 0.5 + k * 0.5, az + 0.1, 0.17, 0.17, 0.17, ["#ff4d6d", "#ff8fab", "#fff"][k % 3], 5, 0.6); });
      B.box(ax, 3.3, az, 4.9, 0.18, 0.22, "#fff"); for (let k = 0; k < 14; k++) B.sphere(ax - 2.3 + k * 0.355, 3.45, az, 0.16, 0.14, 0.16, ["#ff4d6d", "#ff8fab", "#ffd23f", "#fff"][k % 4], 5, 0.7);
      B.box(ax, 0.02, az + 3.5, 2.0, 0.03, 8.0, "#c0392b");
      [[-4.0, 2], [4.0, 2]].forEach(([dx, dz]) => { B.box(ax + dx, 0, az + dz, 1.0, 0.9, 5.0, "#f4f1e8"); B.box(ax + dx, 0.9, az + dz, 1.1, 0.06, 5.1, "#d7b98a"); for (let k = 0; k < 6; k++) B.sphere(ax + dx - 0.2 + (k % 2) * 0.4, 1.05, az + dz - 2 + k * 0.8, 0.2, 0.12, 0.2, ["#e63946", "#ffd23f", "#7ac74f", "#ff8c42"][k % 4], 5); });
      for (let k = 0; k < 7; k++) { const bx = ax - 6 + k * 2, y = 4.2 - Math.sin((k / 6) * PI) * 0.7; B.sphere(bx, y, az + 2, 0.18, 0.18, 0.18, ["#ff4d6d", "#ffd23f", "#7bdff2", "#ff9ad5"][k % 4], 5, 1); }
      B.cyl(ax - 6, 0, az + 2, 0.06, 0.06, 4.2, "#777", 4); B.cyl(ax + 6, 0, az + 2, 0.06, 0.06, 4.2, "#777", 4);
      [[-3, 5], [3, 5], [0, 6.4]].forEach(([dx, dz], i) => { B.sphere(ax + dx, 1.3, az + dz, 0.4, 0.5, 0.4, ["#ff4d6d", "#4dabf7", "#ffd43b"][i], 6, 0.3); B.cyl(ax + dx, 0, az + dz, 0.015, 0.015, 0.9, "#ddd", 3); });
    }
    swap("wedding", B);
  };
  S.rebuildCart = (colors, name) => {
    const B = new Builder();
    B.box(0, 0.45, 0, 2.5, 0.2, 1.6, "#9a6a3a"); [[-1.2, 0], [1.2, 0]].forEach(([x]) => [-0.9, 0.9].forEach((z) => { B.push(x, 0.42, z, 0, PI / 2); B.cyl(0, -0.05, 0, 0.42, 0.42, 0.14, "#4a3320", 10); B.pop(); }));
    B.box(-1.25, 0.6, 0, 0.1, 0.5, 1.6, "#7a5236"); B.box(1.25, 0.6, 0, 0.1, 0.5, 1.6, "#7a5236"); B.box(0, 0.6, -0.8, 2.5, 0.5, 0.1, "#7a5236"); B.box(0, 0.6, 0.8, 2.5, 0.5, 0.1, "#7a5236");
    B.box(-1.55, 0.9, 0, 1.2, 0.07, 0.07, "#5b3f27"); B.box(-2.2, 0.9, 0, 0.07, 0.07, 1.0, "#5b3f27");
    colors.forEach((c, i) => { const col_ = i % 3, row = Math.floor(i / 3) % 2, lay = Math.floor(i / 6); B.push(-0.75 + col_ * 0.75, 0.65 + lay * 0.4, -0.3 + row * 0.6); B.box(0, 0, 0, 0.66, 0.36, 0.52, "#c9a06a"); B.sphere(0, 0.34, 0, 0.26, 0.1, 0.2, c, 5); B.pop(); });
    swap(name || "cart", B);
  };
  S.rebuildFarm = (plots) => {
    const B = new Builder();
    plots.forEach((p, i) => {
      if (!p) return;
      const pp = OSW.EX.plotPos(i), x = pp.x, z = pp.z, g = p.progress, ripe = g >= 1;
      const n = 6, sz = ripe ? 1 : 0.35 + 0.6 * g;
      for (let k = 0; k < n; k++) {
        const px = x - 1.5 + (k % 3) * 1.5, pz = z - 0.9 + Math.floor(k / 3) * 1.8, hgt = (0.25 + 0.55 * sz);
        B.cyl(px, 0.4, pz, 0.08, 0.05, hgt, "#4e9a47", 5);
        if (g > 0.35) B.sphere(px - 0.18, 0.4 + hgt * 0.8, pz, 0.22 * sz, 0.2 * sz, 0.2 * sz, "#5db04f", 5);
        if (g > 0.35) B.sphere(px + 0.18, 0.4 + hgt * 0.6, pz + 0.1, 0.2 * sz, 0.18 * sz, 0.2 * sz, "#5db04f", 5);
        if (g >= 0.7) B.sphere(px, 0.4 + hgt + 0.1, pz, (ripe ? 0.34 : 0.2) * (p.size || 1), (ripe ? 0.34 : 0.2) * (p.size || 1), (ripe ? 0.34 : 0.2) * (p.size || 1), p.color, 7, ripe ? 0.5 : 0);
      }
    });
    swap("farm", B);
  };
  // الورد على شكل قلب. level = أيام السلسلة، done = اتسقوا اليوم، wilt = ذبلان
  S.rebuildFlowers = (level, done, wilt) => {
    const B = new Builder(), fl = POS.flowers, L = Math.min(level, 24);
    const pts = []; for (let i = 0; i < 26; i++) { const t = (i / 26) * PI * 2; pts.push([16 * Math.pow(Math.sin(t), 3) * 0.185, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.185 + 0.4]); }
    for (let i = 0; i < 9; i++) pts.push([((i % 3) - 1) * 0.95, -1.0 + Math.floor(i / 3) * 0.8]);
    pts.forEach(([dx, dz], i) => {
      const x = fl.x + dx, z = fl.z + dz, k = Math.max(0, Math.min(1, L / 18)), stem = wilt ? 0.35 : 0.35 + 0.7 * k, rad = wilt ? 0.13 : 0.14 + 0.2 * k;
      const c = wilt ? "#8a6a4a" : ["#e11d48", "#ff4d6d", "#ff8fab", "#fb7185"][i % 4];
      B.push(x, 0.3, z, 0, 0, wilt ? ((i % 2) ? 0.5 : -0.5) : 0); B.cyl(0, 0, 0, 0.05, 0.04, stem, wilt ? "#7d6b4f" : "#3f9a4a", 5);
      if (!wilt && L > 0) { B.box(0.1, stem * 0.45, 0, 0.3, 0.05, 0.12, "#3f9a4a"); }
      if (wilt || L === 0) B.sphere(0, stem + 0.05, 0, 0.1, 0.08, 0.1, c, 5); else { B.sphere(0, stem + rad * 0.5, 0, rad, rad * 0.9, rad, c, 7, done ? 0.7 : 0.15); if (L > 5) B.sphere(0, stem + rad * 0.9, 0, rad * 0.55, rad * 0.5, rad * 0.55, dk(c, 0.25), 6, done ? 0.7 : 0.15); }
      B.pop();
    });
    swap("flowers", B);
  };
})();
