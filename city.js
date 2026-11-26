/* ============================================================
   المدينة الكبرى (V11) — النواة
   - مدينة 5×5 بلوك (400×400 م) على ساحل بعيد، مربوطة بطريق من الطريق الطويل
   - كل بلوك بيتبني لما تقرب منه وبيتحرر لما تبعد (تحميل عند الحاجة)
   - تصادم بسيط (مستطيلات ودوائر) بدون ما نلمس S.colliders تبع القرية
   - مواصلات (تاكسي) بين القرية والجزيرة والمدينة
   الملفات المرتبطة: city_blocks.js (الأحياء والمباني) + city_int.js (الداخل والخدمات)
   ============================================================ */
(function () {
  const OSW = window.OSW, R = OSW.R, Builder = OSW.Builder, M = OSW.M, PI = Math.PI, hy = Math.hypot;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const C = (OSW.city = { blocks: {}, gen: {}, ready: false });

  /* ---------- الجغرافيا ---------- */
  const G = (C.GEO = { x0: 70, z0: 400, bs: 80, n: 5, hs: 7, branchZ: 560, branchW: 10 });
  G.x1 = G.x0 + G.bs * G.n; G.z1 = G.z0 + G.bs * G.n;
  G.cx = (G.x0 + G.x1) / 2; G.cz = (G.z0 + G.z1) / 2;
  C.org = (bx, bz) => ({ x: G.x0 + bx * G.bs, z: G.z0 + bz * G.bs });
  // خريطة الأحياء (صف = z من الشمال للجنوب، عمود = x من الغرب للشرق)
  C.MAP = [
    ["res", "res", "park", "tour", "beach"],
    ["res", "com", "hotel", "food", "port"],
    ["res", "mall", "plaza", "hosp", "pmkt"],
    ["res", "lotC1", "police", "lotC2", "port"],
    ["res", "ind", "ind", "ind", "port"],
  ];
  C.kindAt = (bx, bz) => C.MAP[bz][bx];
  C.DISTRICT = { res: "🏘️ حي سكني", com: "🏢 حي الأعمال", hotel: "🏨 الحي السياحي", park: "🌳 الحديقة العامة", tour: "🎡 الكورنيش", beach: "🏖️ الشاطئ", food: "🍽️ شارع المطاعم", mall: "🛍️ حي التسوق", plaza: "⛲ ميدان المدينة", hosp: "🏥 الحي الطبي", port: "⚓ الميناء", pmkt: "⚓ ميناء الصيد", police: "🚓 الحي الإداري", lotC1: "🅿️ مواقف", lotC2: "🅿️ مواقف", ind: "🏭 الحي الصناعي" };

  /* أماكن وظيفية: المواقع ثابتة (محسوبة بالأرقام) عشان الدخول والمواصلات يشتغلوا حتى قبل تحميل البلوك */
  const P = (C.PLACES = {
    hotel: { name: "فندق الواحة", e: "🏨", door: { x: 270, z: 533 }, front: { x: 270, z: 541 }, bx: 2, bz: 1 },
    mall: { name: "مجمّع المدينة", e: "🛍️", door: { x: 206, z: 600 }, front: { x: 214, z: 600 }, bx: 1, bz: 2 },
    hospital: { name: "مستشفى الشفاء", e: "🏥", door: { x: 330, z: 600 }, front: { x: 322, z: 600 }, bx: 3, bz: 2 },
    police: { name: "مركز الشرطة", e: "🚓", door: { x: 270, z: 658 }, front: { x: 270, z: 650 }, bx: 2, bz: 3 },
    resto_a: { name: "مطعم الديوان", e: "🍲", door: { x: 331, z: 528 }, front: { x: 331, z: 536 }, bx: 3, bz: 1 },
    resto_b: { name: "بيت البيتزا", e: "🍕", door: { x: 352, z: 528 }, front: { x: 352, z: 536 }, bx: 3, bz: 1 },
    cafe: { name: "مقهى الكورنيش", e: "☕", door: { x: 373, z: 528 }, front: { x: 373, z: 536 }, bx: 3, bz: 1 },
    port: { name: "سوق الميناء", e: "⚓", door: { x: 405, z: 600 }, front: { x: 397, z: 600 }, bx: 4, bz: 2 },
  });
  C.STOPS = {
    village: { n: "القرية", e: "🏡", x: 12, z: 25, ax: 12, az: 29.2 },
    city: { n: "المدينة", e: "🏙️", x: 262, z: 580, ax: 262, az: 584.4 },
    island: { n: "الجزيرة الثانية", e: "🏝️", x: -16, z: 1152, ax: -16, az: 1148.2 },
  };
  C.LOT_DEFS = {
    C1: { x: 190, z: 652, dz: 3.1, h: -PI / 2, cx: 190, cz: 664, rad: 18, out: { x: 181, z: 666 } },
    C2: { x: 330, z: 652, dz: 3.1, h: PI / 2, cx: 330, cz: 664, rad: 18, out: { x: 339, z: 666 } },
  };
  // مرسى الصيد: ممر خشبي بالبحر شرق السوق
  C.PIER = { x0: 466, x1: 508, z: 600, w: 8 };
  C.inCity = (x, z, m = 0) => x > G.x0 - 10 - m && x < G.x1 + 10 + m && z > G.z0 - 10 - m && z < G.z1 + 10 + m;
  C.inPier = (x, z) => x >= C.PIER.x0 - 2 && x <= C.PIER.x1 && Math.abs(z - C.PIER.z) <= C.PIER.w / 2;
  C.onBranch = (x, z) => x > -6 && x < G.x0 - 8 && Math.abs(z - G.branchZ) < G.branchW / 2 - 0.9;
  C.zoneOf = (x, z) => (C.inCity(x, z, 6) || C.inPier(x, z) || (x > 6 && x < G.x0 && Math.abs(z - G.branchZ) < 8) ? "city" : z > 1000 ? "island" : "village");

  /* ---------- ألوان وأدوات ---------- */
  const dk = OSW.col.dk, lt = OSW.col.lt;
  C.pal = {
    wall: ["#e9dfcf", "#dcd2c0", "#efe3d3", "#d9cfc6", "#f0e6d8", "#e4d6c3", "#cfd6dc", "#e8d9d1"],
    warm: ["#f2d8b8", "#f0c9b4", "#efe0b0", "#e8c9a0", "#f6e0c8"],
    glass: ["#7fb6d6", "#6aa3c9", "#8cc0dc", "#5f93b8"],
    cars: ["#e63946", "#4dabf7", "#f4f1e8", "#2b2b35", "#ffd23f", "#2a9d8f", "#9b5de5", "#c0c4cc", "#ff8c42"],
  };
  C.pick = (rnd, a) => a[(rnd() * a.length) | 0];

  /* ===== أدوات رسم مشتركة (بتُستخدم من city_blocks.js و city_int.js) ===== */
  // سياق البلوك: كل شي بنضيفه (هندسة + تصادم + أفعال + لافتات) بيتحرر مع البلوك
  C.newCtx = (bx, bz) => {
    const o = C.org(bx, bz), rnd = OSW.seeded(9100 + bx * 31 + bz * 97);
    return { bx, bz, key: bx + "," + bz, ox: o.x, oz: o.z, cx: o.x + G.bs / 2, cz: o.z + G.bs / 2, B: new Builder(), F: new Builder(), rnd, rects: [], circs: [], acts: [], pois: {}, labels: [], peds: [], cars: [], kind: C.kindAt(bx, bz) };
  };
  C.rect = (c, x0, z0, x1, z1) => c.rects.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
  C.circ = (c, x, z, r) => c.circs.push({ x, z, r });
  C.act = (c, act, x, y, z, r, px, pz) => { c.acts.push({ act, x, y, z, r }); if (px != null) c.pois[act] = { x: px, z: pz }; };
  C.label = (c, id, text, x, y, z, o = {}) => c.labels.push(Object.assign({ id, text, x, y, z, cls: "", max: 70 }, o));

  // شريط نوافذ لكل طابق على الأضلاع الأربعة (قطع زجاج + بلاطة)، بدون كثرة صناديق
  C.ribbons = (c, x, z, w, d, y0, floors, fh, o) => {
    const B = c.B, rnd = c.rnd, gh = fh * (o.gh || 0.52), seg = o.seg || 8, lit = o.lit == null ? 0.35 : o.lit, gl = o.glass || "#6aa3c9", sl = o.slab || "#cfc7b8";
    for (let i = 0; i < floors; i++) {
      const y = y0 + i * fh;
      B.box(x, y + fh - 0.12, z, w + 0.2, 0.14, d + 0.2, sl);
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz]) => {
        const len = sx ? d : w, n = Math.max(1, Math.round((len - 2) / seg)), sw = (len - 2) / n - 1.0;
        for (let k = 0; k < n; k++) {
          const t = -len / 2 + 1.5 + (k + 0.5) * ((len - 2) / n) + 0.0;
          const px = sx ? x + sx * (w / 2 + 0.03) : x + t, pz = sx ? z + t : z + sz * (d / 2 + 0.03);
          const l = rnd() < lit ? 0.55 : 0;
          if (sx) B.box(px, y + (fh - gh) * 0.5, pz, 0.08, gh, sw, l ? lt(gl, 0.25) : gl, l); else B.box(px, y + (fh - gh) * 0.5, pz, sw, gh, 0.08, l ? lt(gl, 0.25) : gl, l);
        }
      });
    }
  };
  // مبنى كامل: جسم + شرائط + سقف بمعدات
  C.tower = (c, x, z, w, d, h, o = {}) => {
    const B = c.B, rnd = c.rnd, base = o.base == null ? 3.2 : o.base, floors = o.floors || Math.max(2, Math.round((h - base) / 3.4)), fh = (h - base) / floors;
    B.box(x, 0, z, w, h, d, o.wall || C.pick(rnd, C.pal.wall));
    if (o.base !== 0) B.box(x, 0, z, w + 0.5, base, d + 0.5, o.baseCol || dk(o.wall || "#d9cfc6", 0.18));
    C.ribbons(c, x, z, w, d, base, floors, fh, { glass: o.glass || C.pick(rnd, C.pal.glass), slab: o.slab || lt(o.wall || "#d9cfc6", 0.1), seg: o.seg, lit: o.lit });
    B.box(x, h, z, w + 0.5, 0.35, d + 0.5, o.roof || "#8d8a85");
    if (!o.flat) { // معدات سقف
      const k = 1 + ((rnd() * 3) | 0);
      for (let i = 0; i < k; i++) B.box(x + (rnd() - 0.5) * w * 0.6, h + 0.35, z + (rnd() - 0.5) * d * 0.6, 1.8 + rnd() * 1.6, 1.0 + rnd() * 0.8, 1.6 + rnd(), "#b9bcc2");
      if (rnd() < 0.5) { B.cyl(x + w * 0.25, h + 0.35, z - d * 0.2, 1.2, 1.2, 1.8, "#8aa0b3", 8); }
      if (h > 40) { B.cyl(x, h + 0.35, z, 0.12, 0.08, 8, "#9aa0a8", 5); B.sphere(x, h + 8.4, z, 0.25, 0.25, 0.25, "#ff3b3b", 5, 1); }
    }
    C.rect(c, x - w / 2 - 0.3, z - d / 2 - 0.3, x + w / 2 + 0.3, z + d / 2 + 0.3);
    return { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 };
  };
  C.lamp = (c, x, z, ry = 0) => { c.B.cyl(x, 0.15, z, 0.1, 0.08, 4.4, "#444a52", 6); c.B.box(x + Math.sin(ry) * 0.5, 4.45, z + Math.cos(ry) * 0.5, 1.2, 0.1, 0.18, "#444a52"); c.B.sphere(x + Math.sin(ry) * 1.0, 4.35, z + Math.cos(ry) * 1.0, 0.3, 0.16, 0.3, "#fff0b8", 6, 1); C.circ(c, x, z, 0.25); };
  C.tree = (c, x, z, s = 1, kind) => {
    const rnd = c.rnd, B = c.B, F = c.F, k = kind || (rnd() < 0.55 ? "round" : rnd() < 0.5 ? "palm" : "cyp");
    if (k === "palm") { B.cyl(x, 0.15, z, 0.26 * s, 0.18 * s, 4.4 * s, "#9a7650", 6); for (let i = 0; i < 6; i++) { F.push(x, 4.5 * s, z, (i / 6) * PI * 2); F.push(0, 0, 0, 0, 0.55); F.box(0, 0, 1.2 * s, 0.6 * s, 0.05, 2.4 * s, i % 2 ? "#4fa860" : "#3f9a52"); F.pop(); F.pop(); } }
    else if (k === "cyp") { B.cyl(x, 0.15, z, 0.2 * s, 0.16 * s, 0.9 * s, "#6b4a30", 5); F.sphere(x, 2.8 * s, z, 0.9 * s, 2.7 * s, 0.9 * s, "#2f7d46", 6); }
    else { B.cyl(x, 0.15, z, 0.3 * s, 0.24 * s, 1.8 * s, "#7a5236", 6); F.sphere(x, 3.2 * s, z, 1.9 * s, 1.6 * s, 1.9 * s, rnd() < 0.5 ? "#4fa860" : "#5ab56a", 7); F.sphere(x + 0.7 * s, 3.9 * s, z - 0.3 * s, 1.1 * s, 1.0 * s, 1.1 * s, "#6cc47a", 6); }
    C.circ(c, x, z, 0.5 * s);
  };
  C.bench = (c, x, z, ry = 0) => { c.B.push(x, 0.15, z, ry); c.B.box(0, 0.4, 0, 1.8, 0.1, 0.55, "#a97c50"); c.B.box(0, 0.8, -0.22, 1.8, 0.45, 0.08, "#a97c50"); c.B.box(-0.8, 0.15, 0, 0.1, 0.3, 0.5, "#555"); c.B.box(0.8, 0.15, 0, 0.1, 0.3, 0.5, "#555"); c.B.pop(); };
  // سيارة صغيرة (بتنرسم ضمن البلوك للمواقف، أو كمجسّم منفرد للمرور)
  C.carShape = (B, col, o = {}) => {
    const L = o.len || 4.2, W = 1.8;
    B.box(0, 0.35, 0, W, 0.55, L, col); B.box(0, 0.88, -0.2, W - 0.2, 0.5, L * 0.52, lt(col, 0.1)); B.box(0, 0.92, -0.2, W - 0.1, 0.34, L * 0.5, "#27384a");
    [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]].forEach(([sx, z]) => { B.push(sx * (W / 2 - 0.05), 0.32, z, 0, 0, PI / 2); B.cyl(0, -0.12, 0, 0.32, 0.32, 0.24, "#1b1b1f", 8); B.pop(); });
    B.box(0, 0.45, L / 2, W - 0.3, 0.12, 0.06, "#ffe9a8", 0.6); B.box(0, 0.45, -L / 2, W - 0.3, 0.12, 0.06, "#c0262d", 0.4);
  };
  C.parkedCar = (c, x, z, h, col) => {
    c.B.push(x, 0.15, z, h); C.carShape(c.B, col); c.B.pop();
    const ca = Math.abs(Math.sin(h)), co = Math.abs(Math.cos(h)); C.rect(c, x - (ca * 2.2 + co * 1.0), z - (co * 2.2 + ca * 1.0), x + (ca * 2.2 + co * 1.0), z + (co * 2.2 + ca * 1.0));
  };
  // لافتة محل (شاشة مضيئة)
  C.sign = (c, x, y, z, w, h, col, ry = 0) => { c.B.push(x, y, z, ry); c.B.box(0, 0, 0, w, h, 0.25, "#2b2b30"); c.B.box(0, 0.08, 0.14, w - 0.3, h - 0.16, 0.05, col, 1); c.B.pop(); };
  // باب مبنى + درجة + مظلة + إضاءة (ry: اتجاه الواجهة: 0=+z، PI/2=+x، PI=-z، -PI/2=-x)
  C.door = (c, x, z, ry, w = 3.4, col = "#6b4a3a") => {
    c.B.push(x, 0.15, z, ry);
    c.B.box(0, 0, 0.02, w + 0.8, 3.2, 0.3, dk(col, 0.1)); c.B.box(0, 0.05, 0.18, w, 2.8, 0.1, "#243445"); c.B.box(0, 0.05, 0.22, w - 0.15, 2.6, 0.04, "#9fd4f0", 0.45);
    c.B.box(0, 0, 0.18, 0.1, 2.8, 0.12, "#222"); c.B.box(0, 3.1, 1.0, w + 2.2, 0.18, 2.2, "#e6e0d6"); c.B.box(0, 0, 1.4, w + 1.4, 0.12, 1.4, "#cfc7b8"); c.B.sphere(0, 3.0, 1.9, 0.18, 0.12, 0.18, "#fff0b8", 5, 1);
    c.B.pop();
  };

  /* ---------- بناء/تحرير بلوك ---------- */
  function groundOf(c) {
    const B = c.B, ox = c.ox, oz = c.oz, bs = G.bs, last = G.n - 1, kind = c.kind;
    B.box(c.cx, -0.5, c.cz, bs, 0.53, bs, "#4a4d55");                 // أسفلت (الشوارع على حواف البلوك)
    B.box(c.cx, -0.4, c.cz, bs - 2 * G.hs + 6, 0.55, bs - 2 * G.hs + 6, "#cfc8b8");  // رصيف
    const green = kind === "park" || kind === "beach" || kind === "res";
    B.box(c.cx, -0.3, c.cz, bs - 20, 0.47, bs - 20, kind === "beach" ? "#ead9a8" : kind === "ind" || kind === "pmkt" || kind === "port" ? "#9a9a96" : kind === "lotC1" || kind === "lotC2" ? "#55585f" : green ? "#6fbf7a" : kind === "tour" ? "#d9d0bd" : "#d6cfc0");
    // خطوط وسط الشارع (الحافة الغربية والشمالية لكل بلوك + الحافة الشرقية والجنوبية للأخيرين)
    const dash = (x0, z0, x1, z1) => { const L = hy(x1 - x0, z1 - z0), n = Math.floor(L / 6); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; B.box(x0 + (x1 - x0) * t, 0.04, z0 + (z1 - z0) * t, x0 === x1 ? 0.25 : 2.6, 0.02, z0 === z1 ? 0.25 : 2.6, "#f1e27a"); } };
    const edgeW = c.bx > 0 || true, edgeN = true;
    if (edgeW) dash(ox, oz + 10, ox, oz + bs - 10);
    if (edgeN) dash(ox + 10, oz, ox + bs - 10, oz);
    if (c.bx === last) dash(ox + bs, oz + 10, ox + bs, oz + bs - 10);
    if (c.bz === last) dash(ox + 10, oz + bs, ox + bs - 10, oz + bs);
    // مشاة (زيبرا) عند زاوية الشمال الغربي
    for (let i = 0; i < 7; i++) { B.box(ox - 5.5 + i * 1.6, 0.045, oz + 7.6, 0.8, 0.02, 3.6, "#f4f4f4"); B.box(ox + 7.6, 0.045, oz - 5.5 + i * 1.6, 3.6, 0.02, 0.8, "#f4f4f4"); }
    // أعمدة إنارة وأشجار على الأرصفة
    for (let t = 16; t < bs - 8; t += 22) { C.lamp(c, ox + 8.2, oz + t, PI / 2); C.lamp(c, ox + t, oz + 8.2, 0); }
    if (kind !== "port" && kind !== "pmkt" && kind !== "ind") for (let t = 22; t < bs - 14; t += 22) { C.tree(c, ox + 9.4, oz + t + 8, 0.7, "round"); }
    // رصيف بحري (أسوار) على حواف المدينة الخارجية
    const wall = (x0, z0, x1, z1, ry) => { const L = hy(x1 - x0, z1 - z0); B.box((x0 + x1) / 2, -3.2, (z0 + z1) / 2, x0 === x1 ? 1.2 : L, 3.4, z0 === z1 ? 1.2 : L, "#8e8a84"); B.box((x0 + x1) / 2, 0.2, (z0 + z1) / 2, x0 === x1 ? 0.3 : L, 0.9, z0 === z1 ? 0.3 : L, "#b9b4aa"); };
    if (c.bx === 0) wall(ox - 0.5, oz, ox - 0.5, oz + bs); if (c.bx === last) wall(ox + bs + 0.5, oz, ox + bs + 0.5, oz + bs);
    if (c.bz === 0) wall(ox, oz - 0.5, ox + bs, oz - 0.5); if (c.bz === last) wall(ox, oz + bs + 0.5, ox + bs, oz + bs + 0.5);
  }
  C.buildBlock = (bx, bz) => {
    const c = C.newCtx(bx, bz), g = C.gen[c.kind] || C.gen.res;
    groundOf(c); g(c);
    c.mesh = c.B.build(R.gl); c.fol = c.F.a.length ? c.F.build(R.gl) : null;
    c.B = c.F = null; c.born = performance.now(); return c;
  };
  C.freeBlock = (c) => { if (c.mesh) R.free(c.mesh); if (c.fol) R.free(c.fol); };

  /* ---------- ربط الأفعال والتسميات والـ POI مع عالم القرية (S) ---------- */
  function attach(c) {
    const S = OSW.S, W = OSW.world;
    c.acts.forEach((a) => S.acts.push(a)); Object.assign(S.poi, c.pois);
    c.labels.forEach((l) => W.addLabel(Object.assign({ dynamic: "ct:" + c.key }, l)));
  }
  function detach(c) {
    const S = OSW.S, W = OSW.world;
    c.acts.forEach((a) => { const i = S.acts.indexOf(a); if (i > -1) S.acts.splice(i, 1); }); Object.keys(c.pois).forEach((k) => delete S.poi[k]);
    W.dropLabels("ct:" + c.key);
  }

  /* ---------- التحميل التدريجي ---------- */
  const LOAD_R = () => (C.low ? 180 : 280), UNLOAD_R = () => LOAD_R() + 70;
  const distToBlock = (x, z, bx, bz) => { const o = C.org(bx, bz), dx = Math.max(o.x - x, 0, x - (o.x + G.bs)), dz = Math.max(o.z - z, 0, z - (o.z + G.bs)); return hy(dx, dz); };
  C.update = (me, maxBuild = 1) => {
    const near = me.x > G.x0 - 260 && me.x < G.x1 + 260 && me.z > G.z0 - 260 && me.z < G.z1 + 260;
    let built = 0;
    if (near) {
      const list = [];
      for (let bx = 0; bx < G.n; bx++) for (let bz = 0; bz < G.n; bz++) { const k = bx + "," + bz; if (C.blocks[k]) continue; const d = distToBlock(me.x, me.z, bx, bz); if (d < LOAD_R()) list.push([d, bx, bz]); }
      list.sort((a, b) => a[0] - b[0]);
      for (const [, bx, bz] of list) { if (built >= maxBuild) break; const c = C.buildBlock(bx, bz); C.blocks[c.key] = c; attach(c); built++; }
    }
    Object.keys(C.blocks).forEach((k) => { const c = C.blocks[k]; if (distToBlock(me.x, me.z, c.bx, c.bz) > UNLOAD_R()) { detach(c); C.freeBlock(c); delete C.blocks[k]; } });
    return built;
  };
  // بعد S.build (تبديل الفصل مثلاً) بنعيد ربط الأفعال للبلوكات المحمّلة
  C.reattach = () => Object.values(C.blocks).forEach((c) => { c.acts.forEach((a) => { if (OSW.S.acts.indexOf(a) < 0) OSW.S.acts.push(a); }); Object.assign(OSW.S.poi, c.pois); });
  C.preload = (x, z) => { for (let i = 0; i < 12; i++) if (!C.update({ x, z }, 4)) break; };

  /* ---------- التصادم ---------- */
  const cellsAround = (x, z) => { const bx = Math.floor((x - G.x0) / G.bs), bz = Math.floor((z - G.z0) / G.bs), out = []; for (let i = bx - 1; i <= bx + 1; i++) for (let j = bz - 1; j <= bz + 1; j++) { const c = C.blocks[i + "," + j]; if (c) out.push(c); } return out; };
  C.collide = (o, r) => {
    const cs = cellsAround(o.x, o.z);
    for (const c of cs) {
      for (const b of c.rects) { const l = b.x0 - r, rr = b.x1 + r, t = b.z0 - r, bo = b.z1 + r; if (o.x > l && o.x < rr && o.z > t && o.z < bo) { const dl = o.x - l, dr = rr - o.x, dt = o.z - t, db = bo - o.z, m = Math.min(dl, dr, dt, db); if (m === dl) o.x = l; else if (m === dr) o.x = rr; else if (m === dt) o.z = t; else o.z = bo; } }
      for (const k of c.circs) { const dx = o.x - k.x, dz = o.z - k.z, rr = k.r + r; if (dx * dx + dz * dz < rr * rr) { const d = hy(dx, dz) || 0.001; o.x = k.x + (dx / d) * rr; o.z = k.z + (dz / d) * rr; } }
    }
    // حدود المدينة (البحر) إلا الممر الخشبي
    if (C.inPier(o.x, o.z)) { o.z = clamp(o.z, C.PIER.z - C.PIER.w / 2 + r, C.PIER.z + C.PIER.w / 2 - r); o.x = clamp(o.x, G.x1 - 6, C.PIER.x1 - r); }
    else { o.x = clamp(o.x, G.x0 - 0.6 + r, G.x1 + 0.6 - r); o.z = clamp(o.z, G.z0 - 0.6 + r, G.z1 + 0.6 - r); }
  };
  C.carBlocked = (x, z) => {
    if (x < G.x0 - 1 || x > G.x1 + 1 || z < G.z0 - 1 || z > G.z1 + 1) return !(C.onBranch(x, z) || (x >= G.x0 - 10 && x <= G.x0 && Math.abs(z - G.branchZ) < G.branchW / 2 - 0.9));   // الفرع يوصل لحدّ المدينة (كانت بينهم فجوة تمنع السيارات)
    for (const c of cellsAround(x, z)) {
      for (const b of c.rects) if (x > b.x0 - 1.3 && x < b.x1 + 1.3 && z > b.z0 - 1.3 && z < b.z1 + 1.3) return true;
      for (const k of c.circs) if ((x - k.x) * (x - k.x) + (z - k.z) * (z - k.z) < (k.r + 1.2) * (k.r + 1.2)) return true;
    }
    return false;
  };

  /* ---------- الطريق الدائم: فرع الطريق + بوابة المدينة (مجسّم خفيف دايماً محمّل) ---------- */
  C.buildRoad = () => {
    const B = new Builder(), z = G.branchZ, w = G.branchW, x0 = 2, x1 = G.x0 - 10;
    B.box((x0 + x1) / 2, -0.75, z, x1 - x0, 0.9, w + 1.2, "#6e6f78"); B.strip([[x0, z], [x1, z]], w, 0.14, "#3b3f47");
    B.strip([[x0, z - 4.5], [x1, z - 4.5]], 0.22, 0.16, "#f4f4f4"); B.strip([[x0, z + 4.5], [x1, z + 4.5]], 0.22, 0.16, "#f4f4f4");
    for (let x = x0 + 6; x < x1; x += 7) B.box(x, 0.15, z, 2.6, 0.03, 0.2, "#ffd23f");
    for (let x = x0 + 10; x < x1; x += 8) [-1, 1].forEach((sd) => B.box(x, 0, z + sd * 5.4, 0.2, 0.95, 0.2, "#9aa0a8"));
    [-1, 1].forEach((sd) => { B.box((x0 + 10 + x1) / 2, 0.75, z + sd * 5.4, x1 - x0 - 10, 0.14, 0.14, "#c9ccd2"); });
    for (let x = x0 + 14, i = 0; x < x1; x += 22, i++) { const sd = i % 2 ? 1 : -1; B.cyl(x, 0, z + sd * 5.4, 0.1, 0.08, 4.4, "#4a3d38", 6); B.box(x, 4.3, z + sd * 4.6, 0.12, 0.1, 1.6, "#4a3d38"); B.sphere(x, 4.15, z + sd * 3.9, 0.3, 0.2, 0.3, "#ffe7a0", 6, 1); }
    for (let x = x0 + 16; x < x1; x += 5) B.cyl(x, -4, z, 0.8, 0.8, 3.4, "#8a8a92", 8);
    // مفرق على الطريق الطويل + لوحة اتجاهات
    B.box(0, 0.16, z, 12, 0.02, 12, "#3b3f47");
    B.box(7.6, 0, z - 8, 0.16, 3.6, 0.16, "#555"); B.box(7.6, 2.1, z - 8, 0.2, 1.4, 4.4, "#1f7a44"); B.box(7.7, 2.2, z - 8, 0.05, 1.2, 4.2, "#f4f4f4", 0.15);
    // بوابة المدينة
    const gx = G.x0 - 14;
    [-1, 1].forEach((sd) => { B.box(gx, 0, z + sd * 7.5, 1.0, 7, 1.0, "#b6b2aa"); B.box(gx, 7, z + sd * 7.5, 1.4, 0.4, 1.4, "#8d8478"); });
    B.box(gx, 7.2, z, 1.2, 1.8, 16.6, "#2b3a55"); B.box(gx + 0.7, 7.3, z, 0.1, 1.5, 15.4, "#ffd98a", 0.8);
    S_roadMesh = B.build(R.gl);
  };
  let S_roadMesh = null;
  C.buildRoadLabels = () => {
    const W = OSW.world, z = G.branchZ;
    W.addLabel({ id: "ct_gate", text: "🏙️ أهلاً بكم بالمدينة الكبرى", x: G.x0 - 14, y: 10, z, cls: "gate", max: 130, dynamic: "ct:road" });
    W.addLabel({ id: "ct_jn", text: "🏙️ المدينة →", x: 7.6, y: 4.6, z: z - 8, cls: "sm", max: 60, dynamic: "ct:road" });
  };

  /* ---------- العمران الحي: مشاة وسيارات مرور (خفيفة) ---------- */
  const looks = [
    { gender: "boy", color: "#2f7de1", hair: "#2b1d14" }, { gender: "girl", color: "#e63946", hair: "#3b2a20", hairStyle: "long" }, { gender: "boy", color: "#2a9d8f", hair: "#5a3a22" },
    { gender: "girl", color: "#9b5de5", hair: "#1b1b1b", hairStyle: "ponytail" }, { gender: "boy", color: "#f4a261", hair: "#1b1b1b", hairStyle: "cap", cap: "#2b3a55" }, { gender: "girl", color: "#4dabf7", hair: "#c9a06a" },
    { gender: "boy", color: "#ffd23f", hair: "#2a1d12" }, { gender: "girl", color: "#2b2b35", hair: "#2a1d12", hairStyle: "long" },
  ];
  const lookKey = (l) => ({ gender: l.gender || "boy", color: l.color, hair: l.hair, hairStyle: l.hairStyle, skin: l.skin, cap: l.cap });
  const pedChars = [], carMeshes = [];
  C.pedCount = () => (C.low ? 2 : 4);
  function ensureAssets() {
    if (!pedChars.length) looks.forEach((l) => pedChars.push(OSW.makeChar(lookKey(l))));
    if (!carMeshes.length) C.pal.cars.forEach((col) => { const b = new Builder(); C.carShape(b, col); carMeshes.push(b.build(R.gl)); });
  }
  const m1 = new Float32Array(16);
  // مشاة: يمشوا على رصيف كل بلوك (مسار مستطيل) — بيُنشأوا مع البلوك ويموتوا معه
  function seedLife(c) {
    c.peds = []; const n = C.pedCount(), rnd = OSW.seeded(500 + c.bx * 13 + c.bz * 7), k0 = c.kind;
    const busy = k0 === "plaza" || k0 === "mall" || k0 === "food" || k0 === "hotel" || k0 === "tour";
    for (let i = 0; i < (busy ? n + 2 : n); i++) c.peds.push({ t: rnd(), sp: 0.6 + rnd() * 0.7, ch: (rnd() * looks.length) | 0, off: 4.2 + rnd() * 1.4, dir: rnd() < 0.5 ? 1 : -1, ph: rnd() * 6, ry: 0, x: 0, z: 0 });
  }
  const pedPos = (c, p) => { // محيط مستطيل حول البلوك على الرصيف
    const a = G.hs + 1 + p.off - 4.2, s = G.bs - 2 * a, per = s * 4, d = (((p.t % 1) + 1) % 1) * per;
    let x, z, ry; if (d < s) { x = c.ox + a + d; z = c.oz + a; ry = PI / 2; } else if (d < 2 * s) { x = c.ox + a + s; z = c.oz + a + (d - s); ry = 0; } else if (d < 3 * s) { x = c.ox + a + s - (d - 2 * s); z = c.oz + a + s; ry = -PI / 2; } else { x = c.ox + a; z = c.oz + a + s - (d - 3 * s); ry = PI; }
    return { x, z, ry: p.dir > 0 ? ry : ry + PI };
  };
  // سيارات مرور: حلقات على الشوارع الرئيسية
  const TR = { cars: [], loop: null };
  function seedTraffic() {
    const rnd = OSW.seeded(777), n = C.low ? 5 : 9, a = G.x0 + G.bs, b = G.x1 - G.bs, z0 = G.z0 + G.bs, z1 = G.z1 - G.bs;
    TR.loop = { a, b, z0, z1, lane: 3.2 }; TR.cars = [];
    for (let i = 0; i < n; i++) TR.cars.push({ t: rnd(), sp: 7 + rnd() * 5, col: (rnd() * C.pal.cars.length) | 0, v: 1, x: 0, z: 0, h: 0 });
  }
  const loopPos = (t) => { // حلقة مستطيلة (اتجاه عقارب الساعة) على خطوط الشوارع x=a,b و z=z0,z1
    const L = TR.loop, w = L.b - L.a, h = L.z1 - L.z0, per = 2 * (w + h), d = (((t % 1) + 1) % 1) * per, l = L.lane;
    if (d < w) return { x: L.a + d, z: L.z0 - l, h: PI / 2 }; if (d < w + h) return { x: L.b + l, z: L.z0 + (d - w), h: 0 };
    if (d < 2 * w + h) return { x: L.b - (d - w - h), z: L.z1 + l, h: -PI / 2 }; return { x: L.a - l, z: L.z1 - (d - 2 * w - h), h: PI };
  };
  C.per = () => { const L = TR.loop; return 2 * ((L.b - L.a) + (L.z1 - L.z0)); };
  let lastT = 0;
  C.stepLife = (dt, me) => {
    if (!TR.loop) seedTraffic();
    const per = C.per();
    TR.cars.forEach((k) => { const p = loopPos(k.t); let sp = k.sp; const dx = me.x - p.x, dz = me.z - p.z, d = hy(dx, dz); if (d < 14 && dx * Math.sin(p.h) + dz * Math.cos(p.h) > 0) sp = 0; k.v += (sp - k.v) * Math.min(1, dt * 2.2); k.t += (k.v * dt) / per; const q = loopPos(k.t); k.x = q.x; k.z = q.z; k.h = q.h; });
    Object.values(C.blocks).forEach((c) => { if (!c.peds.length && !c.seeded) { seedLife(c); c.seeded = 1; } c.peds.forEach((p) => { p.t += (p.dir * p.sp * dt) / ((G.bs - 2 * (G.hs + 1)) * 4); const q = pedPos(c, p); p.x = q.x; p.z = q.z; p.ry = q.ry; p.ph += dt * p.sp * 5; }); });
  };

  /* ---------- الرسم ---------- */
  C.draw = (t) => {
    const W = OSW.world, me = W.getMe();
    if (!C.ready) return;
    const dt = Math.min(0.05, t - lastT || 0.016); lastT = t;
    const near = C.inCity(me.x, me.z, 330) || (me.x < 130 && Math.abs(me.z - G.branchZ) < 260);
    if (!near) return;
    if (C.inCity(me.x, me.z, 260)) C.update(me, 1);
    if (S_roadMesh) R.draw(S_roadMesh);
    const bl = Object.values(C.blocks); if (!bl.length) return;
    ensureAssets();
    bl.forEach((c) => { R.draw(c.mesh); if (c.fol) R.draw(c.fol, null, null, 1, 1.4); });
    C.stepLife(dt, me);
    // مشاة وسيارات (بس القريبين)
    bl.forEach((c) => c.peds.forEach((p) => { if (Math.abs(p.x - me.x) > 70 || Math.abs(p.z - me.z) > 70) return; OSW.drawChar(pedChars[p.ch], p.x, p.z, p.ry, p.ph, 1, t, 1, null, 1, 0); }));
    TR.cars.forEach((k) => { if (Math.abs(k.x - me.x) > 200 || Math.abs(k.z - me.z) > 200) return; M.trs(k.x, 0.12, k.z, k.h, 0, 0, 1, 1, 1, m1); R.draw(carMeshes[k.col], m1); });
    if (C.drawExtra) C.drawExtra(t, me);
    R.blend(true);
    bl.forEach((c) => c.peds.forEach((p) => { if (Math.abs(p.x - me.x) > 50 || Math.abs(p.z - me.z) > 50) return; OSW.drawShadow(p.x, p.z, 0.55); }));
    R.blend(false);
  };

  /* ---------- مواصلات (تاكسي): نقل سلس بين المناطق ---------- */
  C.FARE = 12;
  C.travel = async (to) => {
    const W = OSW.world, ui = OSW.ui, s = C.STOPS[to]; if (!s) return;
    const G2 = OSW.game, me = W.getMe();
    if (W._int.me.veh) return ui.toast("🚪 انزلوا من السيارة أول");
    if (C.zoneOf(me.x, me.z) === to) return ui.toast("📍 إنتوا أصلاً هون");
    if (G2.state().coins < C.FARE) { ui.toast("ما معك أجرة التاكسي 🪙 " + C.FARE); return; }
    ui.closeModal();
    await G2.do("ct_fare", { to });
    OSW.audio && OSW.audio.sfx("door");
    const cur = document.getElementById("curtain"); cur.classList.add("on"); await OSW.sleep(420);
    if (to === "city") C.preload(s.ax, s.az);
    W.placeMe(s.ax, s.az); W.resetCam && W.resetCam(); W.setInputEnabled(true);
    await OSW.sleep(120); cur.classList.remove("on");
    ui.toast(`${s.e} وصلتوا ${s.n}`, "gold", 2600);
  };


  /* ---------- محطات المواصلات بالقرية والجزيرة (دايماً موجودة) ---------- */
  C.buildStops = (c) => {
    const { B, SH, reg, label, col } = c;
    [["village", "ct:taxi:v", 0], ["island", "ct:taxi:i", PI]].forEach(([k, act, ry]) => {
      const s = C.STOPS[k], x = s.x, z = s.z;
      B.push(x, 0, z, ry);
      B.box(0, 0.05, 0, 7, 0.2, 3.4, "#cfc7b8"); [[-3.2, -1.3], [3.2, -1.3], [-3.2, 1.3], [3.2, 1.3]].forEach(([a, b]) => B.box(a, 0.2, b, 0.16, 2.8, 0.16, "#3b4452"));
      B.box(0, 3.0, 0, 7.6, 0.25, 4, "#2b6b85"); B.box(0, 0.8, -1.5, 6, 1.5, 0.08, "#9fd4f0", 0.3); B.box(0, 0.45, -1.0, 5, 0.12, 0.5, "#a97c50");
      B.box(0, 3.9, 1.6, 5, 1.1, 0.2, "#2b2b30"); B.box(0, 3.95, 1.72, 4.7, 0.95, 0.05, "#ffd23f", 1);
      B.pop(); SH.disc(x, 0.1, z, 4.6, "#000000", 12); col.rect(x - 3.8, z - 2.1, x + 3.8, z + 2.1);
      reg(act, x, 1.6, z, 4.2, x, z + (ry ? -3.6 : 3.6)); label("ct_stop_" + k, "🚕 المواصلات", x, 5.6, z, { act, max: 70, cls: "sm" });
    });
  };

  /* ---------- تركيب: ربط كل شي بالنظام الموجود بدون تعديل ملفات الحسابات الثانية ---------- */
  C.install = () => {
    const V = OSW.veh;
    // حركة المشاة والسيارات: بنفتح المدينة والفرع قبل ما نسلّم للقيود الأصلية
    const _con = V.constrain, _pedOk = V.pedOk, _carOk = V.carOk;
    V.constrain = (o) => { if (C.inCity(o.x, o.z, 4) || C.inPier(o.x, o.z)) { C.collide(o, 0.45); return false; } return _con(o); };
    V.pedOk = (x, z) => C.inCity(x, z, 0) || C.inPier(x, z) || _pedOk(x, z);
    V.carOk = (x, z) => { if (C.inCity(x, z, 0)) return !C.carBlocked(x, z); if (C.onBranch(x, z)) return true; return _carOk(x, z); };
    // مواقف السيارات
    Object.keys(C.LOT_DEFS).forEach((k) => (V.LOTS[k] = C.LOT_DEFS[k]));
    C.ready = true;
  };
  C.low = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || innerWidth < 700;
  C.install();
})();
