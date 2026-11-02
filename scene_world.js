/* بناء القرية ثلاثية الأبعاد: الأرض، الطرق، الأماكن الخاصة، الزينة */
(function () {
  const OSW = window.OSW, R = OSW.R, Builder = OSW.Builder, M = OSW.M;
  const dk = OSW.col.dk, lt = OSW.col.lt, PI = Math.PI, hy = Math.hypot;
  const S = (OSW.S = { acts: [], colliders: [], labels: [], poi: {}, pos: {}, dyn: {}, ready: false, bounds: { x0: -84, x1: 90, z0: -36, z1: 52 } });

  /* ---------- المواقع ---------- */
  const POS = S.pos;
  OSW.HOUSES.forEach((h) => (POS[h.id] = { x: (h.x - 1300) / 21, z: (h.y - 940) / 21 }));
  Object.assign(POS, {
    home: { x: 0, z: -14 }, fountain: { x: 0, z: 0 }, tree: { x: -15, z: 0.5 }, plaza: { x: 15, z: -0.5 }, shop: { x: -24, z: 9.5 }, flowers: { x: 24, z: 9 },
    hajji: { x: -62, z: 8 }, farm: { x: -57, z: 34 }, gate: { x: 0, z: 31 }, garden: { x: 62, z: 19 }, lighthouse: { x: 75, z: -2 }, lake: { x: 72, z: -2 },
  });
  OSW.VILLAGERS = [
    { id: "v1", x: -8, z: 42, name: "بيت أبو خالد", wall: "#e8d3b0", roof: "#a4452c", t: 0 },
    { id: "v2", x: -28, z: 41, name: "بيت أم أحمد", wall: "#f2c6c6", roof: "#7a3b69", t: 1 },
    { id: "v3", x: 12, z: 42, name: "بيت المعلّم سامر", wall: "#cde4d3", roof: "#2e6f5e", t: 2 },
    { id: "v4", x: 31, z: 40, name: "بيت الخالة سعاد", wall: "#f3e2a9", roof: "#c0642a", t: 3 },
    { id: "v5", x: 52, z: 37, name: "بيت أبو علي", wall: "#cfd8f0", roof: "#3a4f9a", t: 4 },
    { id: "v6", x: 69, z: 38, name: "بيت الولد فادي", wall: "#f0d0f5", roof: "#8a3fa8", t: 5 },
  ];
  OSW.VILLAGERS.forEach((v) => (POS[v.id] = { x: v.x, z: v.z }));

  const reg = (act, x, y, z, r, px, pz) => { S.acts.push({ act, x, y, z, r }); if (px != null) S.poi[act] = { x: px, z: pz }; };
  const col = (x, z, r) => S.colliders.push({ x, z, r });
  const label = (id, text, x, y, z, o = {}) => S.labels.push(Object.assign({ id, text, x, y, z, cls: "", max: 60 }, o));
  S.reg = reg; S.label = label;

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
    OSW.HOUSES.forEach((h) => { if (h.id === "capsule" || h.id === "surprise") return; const p = S.poi["house:" + h.id]; doors.push([p.x, p.z]); });
    doors.forEach(([x, z]) => PATHS.push([[0, 0], [x * 0.55, z * 0.55 + (z > 0 ? -1 : 1)], [x, z]]));
    PATHS.push([[0, 32], [0, 14]], [[0, -2], [0, -8]]);
    PATHS.push([[-24, 15.6], [-24, 11]], [[-12, 8], [-24, 15.6]], [[24, 15.6], [12, 8]], [[24, 15.6], [24, 11]]);
    PATHS.push([[-30, 6], [-52, 12], [-62, 14.6]], [[-24, 15.6], [-40, 22], [-56, 24.5]], [[34, 6], [48, 10], [61, 25.6]], [[44, 4], [58, -2]]);
    OSW.VILLAGERS.forEach((v) => PATHS.push([[v.x, v.z - 5.8], [v.x * 0.5, 34.5], [0, 33]]));
    PATHS.push([[0, 33], [0, 14]]);
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
    S.acts.length = 0; S.colliders.length = 0; S.labels.length = 0; Object.keys(S.poi).forEach((k) => delete S.poi[k]); PATHS.length = 0;
    const B = new Builder(), F = new Builder(), SH = new Builder();
    S._sh = (x, z, r) => SH.disc(x, 0.1, z, r, "#000000", 12);
    const rnd = OSW.seeded(4242);

    /* مواقع الاستقبال (POI) قبل رسم الطرق */
    OSW.HOUSES.forEach((h) => { const p = POS[h.id], m = OSW.HMETA[h.id] || {}; S.poi["house:" + h.id] = { x: p.x, z: p.z + (m.dz || 5.6) }; });
    Object.assign(S.poi, {
      home: { x: 0, z: -7.2 }, fountain: { x: 0, z: 5.6 }, plaza: { x: 15, z: 3.4 }, tree: { x: -15, z: 5.2 }, shop: { x: -24, z: 15.8 }, flowers: { x: 22.4, z: 14.6 },
      hajji: { x: -62, z: 14.8 }, farm: { x: -56, z: 24 }, gate: { x: 0, z: 28.4 }, garden: { x: 62, z: 25.4 }, lighthouse: { x: 61, z: -2 },
    });
    OSW.VILLAGERS.forEach((v) => (S.poi[v.id] = { x: v.x, z: v.z - 5.8 }));
    planPaths();

    /* الأرض والتلال البعيدة */
    B.disc(0, 0, 0, 260, P.g2, 40); B.disc(2, 0.01, 6, 128, P.g1, 40);
    for (let i = 0; i < 46; i++) { const x = -90 + rnd() * 190, z = -40 + rnd() * 95; B.push(x, 0.04, z, 0, 0, 0, 1, 1, 0.6 + rnd() * 0.5); B.disc(0, 0, 0, 3 + rnd() * 7, rnd() < 0.5 ? lt(P.g1, 0.07) : dk(P.g2, 0.05), 12); B.pop(); }
    for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2, r = 170 + rnd() * 50; B.sphere(Math.cos(a) * r, -4, Math.sin(a) * r, 55 + rnd() * 40, 24 + rnd() * 26, 55 + rnd() * 40, i % 2 ? P.hill : dk(P.hill, 0.1), 8, 0, true); }
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
    OSW.HOUSES.forEach((h) => {
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
    B.box(g.x - 20.4, 0.9, g.z, 15, 0.25, 0.2, "#a97c50"); B.box(g.x + 20.4, 0.9, g.z, 15, 0.25, 0.2, "#a97c50");
    reg("gate", g.x, 3, g.z, 5.5); label("gate", "🚪 البوابة", g.x, 7.6, g.z, { act: "gate", max: 70, cls: "gate" });
    /* الحديقة (ملعب صغير) */
    const ga = POS.garden;
    B.push(ga.x, 0.06, ga.z, 0, 0, 0, 1, 1, 0.72); B.disc(0, 0, 0, 10, "#8fd694", 24); B.pop();
    for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2; const x = ga.x + Math.cos(a) * 10, z = ga.z + Math.sin(a) * 7.2; if (Math.abs(a - PI / 2) < 0.4) continue; B.box(x, 0, z, 0.25, 1.0, 0.25, "#b98d5e"); col(x, z, 0.45); }
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
    [-1, 1].forEach((d) => { B.cyl(fl.x + d * 2.0, 0, fl.z + 5.4, 0.18, 0.18, 3.6, "#fff", 6); for (let k = 0; k < 4; k++) B.sphere(fl.x + d * 2.0, 1.0 + k * 0.7, fl.z + 5.65, 0.3, 0.3, 0.2, ["#ff4d6d", "#ff8fab"][k % 2], 6, 0.6); });
    B.box(fl.x, 3.4, fl.z + 5.4, 4.4, 0.2, 0.3, "#fff"); for (let k = 0; k < 7; k++) B.sphere(fl.x - 2.0 + k * 0.67, 3.55, fl.z + 5.4, 0.3, 0.3, 0.3, ["#ff4d6d", "#ff8fab", "#ffb3c7"][k % 3], 6, 0.6);
    B.box(fl.x - 6.6, 0, fl.z - 1, 0.7, 0.7, 2.4, "#a97c50"); B.box(fl.x - 6.6, 0.7, fl.z - 1, 0.7, 0.14, 2.6, "#b98d5e");
    B.cyl(fl.x + 6.2, 0, fl.z + 1, 0.35, 0.3, 0.7, "#4a90c2", 8); B.box(fl.x + 6.7, 0.35, fl.z + 1, 0.7, 0.14, 0.14, "#4a90c2"); B.box(fl.x + 6.0, 0.7, fl.z + 1, 0.5, 0.1, 0.1, "#4a90c2");
    SH.disc(fl.x, 0.1, fl.z, 6, "#000000", 16);
    reg("flowers", fl.x, 1.2, fl.z, 5.6, S.poi.flowers.x, S.poi.flowers.z); label("flowers", "🌹 ورود الحب", fl.x, 5.2, fl.z, { act: "flowers", max: 70, badge: "flowers" });

    /* بيت الحجّي والحجّة */
    const hj = POS.hajji;
    B.push(hj.x, 0, hj.z); B.box(0, 0, 0, 8, 0.35, 6.4, "#a89f8f");
    B.box(0, 0.35, 0, 7.6, 3.6, 6, "#e6d5b0"); B.box(0, 3.95, 0, 8, 0.35, 6.4, "#cdbb90");
    [[-3.8, -3], [3.8, -3], [-3.8, 3], [3.8, 3]].forEach(([x, z]) => B.box(x, 4.3, z, 0.5, 0.7, 0.5, "#cdbb90"));
    B.box(0, 4.3, 3.05, 7.6, 0.55, 0.3, "#d7c6a0"); B.sphere(-2.4, 4.3, -1.2, 1.4, 1.2, 1.4, "#fffaf0", 10, 0, true);
    B.box(0, 0.35, 3.0, 2.2, 2.7, 0.14, "#2a1d12"); B.sphere(0, 3.05, 3.0, 1.1, 0.7, 0.14, "#2a1d12", 10, 0, true); B.box(0, 0.35, 3.1, 1.8, 2.5, 0.08, "#ffcf70", 1);
    OSW.hparts.win(B, -2.7, 1.7, 3.0, 1.0, 1.3); OSW.hparts.win(B, 2.7, 1.7, 3.0, 1.0, 1.3);
    B.box(0, 0.05, 5.0, 5, 0.06, 3.0, "#b3263e"); B.box(0, 0.1, 5.0, 4.4, 0.03, 2.4, "#e9c46a"); B.box(0, 0.12, 5.0, 3.2, 0.03, 1.6, "#2a9d8f");
    B.box(-3.4, 0.6, 5.2, 0.5, 0.6, 2.0, "#8a5a3b"); B.box(-3.4, 1.2, 5.2, 0.7, 0.1, 2.2, "#a97c50");
    B.cyl(2.6, 0, 5.6, 0.6, 0.6, 0.6, "#8a5a3b", 10); B.cyl(2.6, 0.6, 5.6, 0.7, 0.7, 0.07, "#d7b98a", 10); B.cyl(2.5, 0.67, 5.6, 0.16, 0.2, 0.4, "#cfa94b", 8); B.sphere(2.9, 0.75, 5.7, 0.1, 0.1, 0.1, "#fff", 4);
    B.cyl(-5.6, 0, 1.0, 0.35, 0.28, 2.2, "#6b4a30", 6); [[0, 3.1, 0, 1.4], [-0.9, 2.6, 0.3, 1.0], [0.9, 2.7, -0.2, 1.1]].forEach(([dx, dy, dz, r]) => F.sphere(hj.x - 5.6 + dx, dy, hj.z + 1 + dz, r, r * 0.8, r, "#8aa07a", 7));
    B.pop(); SH.disc(hj.x, 0.1, hj.z, 6, "#000000", 14); col(hj.x, hj.z, 4.6);
    reg("hajji", hj.x, 2.4, hj.z, 5.4, S.poi.hajji.x, S.poi.hajji.z); label("hajji", "🧓 بيت الحجّي والحجّة", hj.x, 8, hj.z, { act: "hajji", max: 80, badge: "hajji" });

    /* المزرعة */
    const fx0 = -69, fx1 = -45, fz0 = 25.2, fz1 = 43;
    B.push(0, 0.06, 0, 0, 0, 0); B.box((fx0 + fx1) / 2, 0, (fz0 + fz1) / 2, fx1 - fx0, 0.05, fz1 - fz0, "#9bc47a"); B.pop();
    for (let i = 0; i < 12; i++) { const x = -66 + (i % 4) * 5.4, z = 28.4 + Math.floor(i / 4) * 5.4; B.box(x, 0.08, z, 4.4, 0.3, 4.4, "#6b4a30"); for (let k = -1; k <= 1; k++) B.box(x + k * 1.2, 0.38, z, 0.5, 0.1, 4.0, "#553820"); }
    const fence = (x, z, rot) => { B.box(x, 0, z, 0.22, 1.0, 0.22, "#b98d5e"); col(x, z, 0.55); };
    for (let x = fx0; x <= fx1 + 0.1; x += 2.4) { if (x < -58.4 || x > -53.6) fence(x, fz0); fence(x, fz1); }
    for (let z = fz0; z <= fz1 + 0.1; z += 2.4) { fence(fx0, z); fence(fx1, z); }
    B.box((fx0 + -58.4) / 2 + 0.2, 0.5, fz0, -58.4 - fx0, 0.14, 0.12, "#a97c50"); B.box((fx1 + -53.6) / 2 - 0.2, 0.5, fz0, fx1 - -53.6, 0.14, 0.12, "#a97c50");
    B.box((fx0 + fx1) / 2, 0.5, fz1, fx1 - fx0, 0.14, 0.12, "#a97c50"); B.box(fx0, 0.5, (fz0 + fz1) / 2, 0.12, 0.14, fz1 - fz0, "#a97c50"); B.box(fx1, 0.5, (fz0 + fz1) / 2, 0.12, 0.14, fz1 - fz0, "#a97c50");
    B.push(-74.5, 0, 34); B.box(0, 0, 0, 6.4, 3.4, 5.4, "#b3452c"); B.prism(0, 3.4, 0, 7.2, 2.6, 6, "#7a2e1f"); B.box(0, 0, 2.7, 3.0, 2.8, 0.1, "#f4ead2"); B.box(0, 0.1, 2.76, 2.6, 2.6, 0.06, "#8a2f1e"); B.pop(); col(-74.5, 34, 4.2);
    B.push(-56, 0, 47.5); B.cyl(0, 0, 0, 2.0, 1.3, 7.2, "#efe6d2", 10); B.cyl(0, 7.2, 0, 1.6, 0, 1.8, "#8a3b2e", 10); B.pop(); col(-56, 47.5, 2.2);
    B.cyl(-47.5, 0, 27.5, 0.1, 0.1, 2.4, "#7a5236", 5); B.box(-47.5, 1.7, 27.5, 1.9, 0.14, 0.14, "#7a5236"); B.sphere(-47.5, 2.5, 27.5, 0.35, 0.38, 0.35, "#e9d8a6", 7); B.cyl(-47.5, 2.8, 27.5, 0.6, 0.3, 0.2, "#6b4a30", 8); B.box(-47.5, 1.0, 27.5, 0.7, 0.9, 0.3, "#c4573a");
    for (let i = 0; i < 5; i++) B.sphere(-71 + i * 0.1, 0.2 + i * 0.01, 28.5 + i * 0.7, 0.55, 0.45, 0.55, "#e0cf93", 6);
    reg("farm", -57, 1, 34, 14, S.poi.farm.x, S.poi.farm.z); label("farm", "🌾 المزرعة", -57, 4.4, 28, { act: "farm", max: 85, badge: "farm" });

    /* بيوت أهل القرية */
    OSW.VILLAGERS.forEach((v) => {
      B.push(v.x, 0, v.z, PI); OSW.hparts.found(B, 6, 5); B.box(0, 0.35, 0, 6, 3.0, 5, v.wall);
      if (v.t === 0) { B.prism(0, 3.35, 0, 6.8, 2.2, 5.8, v.roof); B.box(1.8, 4.2, -1, 0.8, 2.6, 0.8, "#8a5a44"); }
      else if (v.t === 1) { B.box(0, 3.35, 0, 6.6, 0.4, 5.6, v.roof); B.box(1.6, 3.75, -0.6, 2.2, 2.4, 2.2, dk(v.wall, 0.08)); B.cyl(1.6, 6.15, -0.6, 1.7, 0, 1.4, v.roof, 4); }
      else if (v.t === 2) { B.sphere(0, 3.3, 0, 3.6, 2.6, 3.0, v.roof, 12, 0, true); B.cyl(0, 3.2, 0, 3.7, 3.7, 0.2, dk(v.roof, 0.2), 14); }
      else if (v.t === 3) { B.prism(0, 3.35, 0, 6.8, 3.6, 5.8, v.roof); }
      else if (v.t === 4) { B.prism(0, 3.35, 0, 6.8, 2.0, 5.8, v.roof); B.box(-1.6, 4.4, 1.6, 1.6, 1.2, 1.2, v.wall); B.prism(-1.6, 5.6, 1.6, 2.0, 1.0, 1.5, dk(v.roof, 0.15)); }
      else { B.cyl(0, 3.3, 0, 3.7, 0, 3.2, v.roof, 14); }
      OSW.hparts.win(B, -1.8, 1.5, 2.5, 1.0, 1.2); OSW.hparts.win(B, 1.9, 1.5, 2.5, 1.0, 1.2); OSW.hparts.door(B, 0, 2.5, dk(v.roof, 0.1), 1.2, 2.2);
      B.sphere(-3.4, 0.4, 3.0, 0.5, 0.4, 0.5, "#6ec26e", 6); B.pop(); SH.disc(v.x, 0.1, v.z, 5, "#000000", 12); col(v.x, v.z, 3.8);
      label(v.id, "🏠 " + v.name, v.x, 8.2, v.z, { max: 48, cls: "sm" });
    });

    /* زينة: أشجار وشجيرات وزهور */
    const anchors = [];
    Object.keys(POS).forEach((k) => anchors.push([POS[k].x, POS[k].z, k === "lake" ? 17 : k === "farm" ? 20 : 8.4]));
    const okSpot = (x, z, r) => !(x < S.bounds.x0 + 2 || x > S.bounds.x1 - 2 || z < S.bounds.z0 + 1 || z > S.bounds.z1 - 1) && !anchors.some((a) => hy(x - a[0], z - a[1]) < a[2] + r) && hy(x, z) > 14.5 && !nearPath(x, z, 3.2) && !(x > -75 && x < -44 && z > 23 && z < 49) && !(x > 58 && x < 90 && z > -20 && z < 14);
    let nt = 0;
    for (let t = 0; t < 4000 && nt < 150; t++) {
      const x = -84 + rnd() * 174, z = -36 + rnd() * 88; if (!okSpot(x, z, 1.4)) continue;
      nt++; const k = rnd(); tree(B, F, x, z, k, P.l1, P.l2, rnd); col(x, z, 0.8); SH.disc(x, 0.1, z, 1.7, "#000000", 8);
      anchors.push([x, z, 0.5]);
    }
    for (let t = 0, n = 0; t < 3000 && n < 110; t++) {
      const x = -84 + rnd() * 174, z = -36 + rnd() * 88; if (!okSpot(x, z, 0.4)) continue; n++;
      if (rnd() < 0.4) F.sphere(x, 0.5, z, 0.8, 0.6, 0.8, rnd() < 0.5 ? P.l1 : dk(P.l1, 0.1), 6);
      else for (let k = 0; k < 6; k++) F.sphere(x + rnd() * 1.6 - 0.8, 0.18, z + rnd() * 1.6 - 0.8, 0.17, 0.15, 0.17, ["#ff8fb1", "#ffd34e", "#ffffff", "#c9a6ff", "#ff6b6b"][(rnd() * 5) | 0], 4, 0.15);
      if (rnd() < 0.12) B.sphere(x + 1.2, 0.3, z + 0.4, 0.55, 0.4, 0.5, "#9aa0a8", 5);
    }
    // أعمدة إنارة
    [[-7, 9], [7, 9], [-7, 22], [7, 22], [-10, -10], [10, -10], [-14, 14], [14, 14], [0, 26], [-40, 8], [40, 6], [-56, 20], [60, 14]].forEach(([x, z]) => { B.cyl(x, 0, z, 0.1, 0.1, 3.4, "#4a3d38", 6); B.sphere(x, 3.6, z, 0.34, 0.4, 0.34, "#ffe7a0", 7, 1); col(x, z, 0.3); S.labels; });
    S.lamps = [[-7, 9], [7, 9], [-7, 22], [7, 22], [-10, -10], [10, -10], [-14, 14], [14, 14], [0, 26], [-40, 8], [40, 6], [-56, 20], [60, 14]];

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
    B.push(h.x, 0, h.z, 0); OSW.hparts.found(B, 7.4, 5.8); B.box(0, 0.35, 0, 7.2, 3.6, 5.6, wall); B.prism(0, 3.95, 0, 8.2, 2.9, 6.4, roof);
    B.box(2.4, 5.2, -1.2, 0.9, 2.8, 0.9, "#8a5a44"); OSW.hparts.win(B, -2.4, 1.6, 2.8, 1.3, 1.5); OSW.hparts.win(B, 2.4, 1.6, 2.8, 1.3, 1.5);
    OSW.hparts.door(B, 0, 2.8, cfg.door || "#8a3b3b"); B.sphere(0, 2.5, 2.97, 0.42, 0.42, 0.1, "#ff4d6d", 8, 1); B.sphere(0, 5.3, 3.0, 0.45, 0.4, 0.15, "#ff4d6d", 8, 0.8);
    B.cyl(4.6, 0, 3.8, 0.08, 0.08, 1.2, "#555", 6); B.box(4.6, 1.2, 3.8, 0.8, 0.6, 0.5, "#e5484d");
    for (let i = 0; i < 6; i++) { B.box(-5.4 + i * 0.5, 0, 4.6, 0.12, 0.8, 0.12, "#fff"); } B.box(-4.2, 0.6, 4.6, 2.6, 0.08, 0.1, "#fff");
    B.sphere(-4.6, 0.55, 3.2, 0.7, 0.55, 0.7, "#6ec26e", 7); B.sphere(-3.6, 0.35, 3.8, 0.4, 0.3, 0.4, "#ff8fb1", 6, 0.3);
    B.pop(); swap("home", B);
  };
  S.rebuildFarm = (plots) => {
    const B = new Builder();
    plots.forEach((p, i) => {
      if (!p) return;
      const x = -66 + (i % 4) * 5.4, z = 28.4 + Math.floor(i / 4) * 5.4, g = p.progress, ripe = g >= 1;
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
