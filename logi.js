/* اللوجستيات والتطوير: كراتين حقيقية، مخازن ومرايب وطرق للأراضي، كراج البيت، سوق الجزيرة.
   كل شي محمي بـ try/catch حتى ما يوقف اللعبة. */
(function () {
  const OSW = window.OSW, L = (OSW.logi = { doors: [], anchors: [] }), PI = Math.PI, hy = Math.hypot, esc = OSW.esc;
  const Builder = OSW.Builder, M = OSW.M, R = OSW.R;
  const G = () => OSW.game, W = () => OSW.world, V = () => OSW.veh, ui = () => OSW.ui, db = () => OSW.ui.db, P = () => OSW.places;
  const toast = (m, c, ms) => ui().toast(m, c || "", ms);
  const sfx = (n) => OSW.audio && OSW.audio.sfx(n);
  const hearts = (e, n) => ui().hearts && ui().hearts(e, n || 8);

  // سعر شراء الكراتين: بقالة سعدون سعرها عادي، وسوبرماركت الجزيرة بيدفع أكثر 💰
  const SHOPS = (L.SHOPS = { s1: { n: "بقالة سعدون", mult: 1 }, s2: { n: "سوبرماركت الجزيرة", mult: 1.12 } });
  const UNITS = 3, LCAP = 36;

  /* ===== الأراضي: مخزن + طريق + مرآب لكل أرض ===== */
  const LANDS = (OSW.EX && OSW.EX.LANDS) || [];
  const KITS = (L.KITS = LANDS.map((Ld) => {
    const side = Ld.id === "l6" ? -1 : 1, d = 6.4, w = 7.4, zb = Ld.z + 10.7, cz = zb + 3.6, cx = Ld.x + side * (7.7 + 3.0 + d / 2), frontX = cx + side * (d / 2);
    return { id: Ld.id, n: Ld.n, key: "L" + Ld.id.slice(1), side, cx, cz, d, w, face: side, frontX, zb, shed: { cx: Ld.x + side * 11.0, cz: Ld.z + 5.2, w: 5.2, dp: 3.4 }, road: [[Ld.x, zb], [Ld.x, cz], [frontX + side * 4, cz]], gx: Ld.x };
  }));
  const kitOf = (id) => KITS.find((k) => k.id === id);

  /* ===== مواقف السيارات ===== */
  if (V() && V().LOTS) {
    V().LOTS.G = { x: -31.8, z: -26.5, dz: -5.2, h: PI, cx: -31.8, cz: -31.5, rad: 16, out: { x: -30.0, z: -29.6 } };      // موقف المخزن الرئيسي
    V().LOTS.S = { x: -16.4, z: 19.6, dz: 3.0, h: -PI / 2, cx: -16.4, cz: 21.1, rad: 12, out: { x: -9.6, z: 21.6 } };       // مرآب سعدون
    V().LOTS.S2 = { x: -64.4, z: 1135.45, dz: 3.1, h: -PI / 2, cx: -64.4, cz: 1137, rad: 12, out: { x: -58.9, z: 1141.6 } };   // مرآب سوبرماركت الجزيرة
    KITS.forEach((k) => { V().LOTS[k.key] = { x: k.cx, z: k.cz - 1.55, dz: 3.1, h: k.side > 0 ? -PI / 2 : PI / 2, cx: k.cx, cz: k.cz, rad: 12, out: { x: k.frontX + k.side * 2.2, z: k.cz + 4.8 } }; });
    V().LOTS.H.rad = 28;
  }

  /* ===== أحداث اللعبة (بتنحسب بالـ fold) ===== */
  const capOfCar = (car) => (OSW.veh.CARS[car.car] || {}).cargo || 4;
  L.fold = (ty, e, d, t, a, day, S, H) => {
    const hand = () => (S.carry[a] = S.carry[a] || []), carObj = () => S.cars.find((x) => x.id === d.id), handCap = () => 3 + ((S.up && S.up.barn) || 0);
    const shed = () => { if (!kitOf(d.land)) return null; const st = S.lstore || (S.lstore = {}); return st[d.land] || (st[d.land] = []); };
    if (ty === "unstash") {
      const C = G().CROPS[d.crop]; if (!C) return true; const n = Math.max(1, Math.min(6, d.n | 0)); let k = 0;
      while (k < n && hand().length < handCap() && (S.inv[d.crop] || 0) >= 1) { const u = Math.min(UNITS, S.inv[d.crop]); S.inv[d.crop] -= u; hand().push({ crop: d.crop, units: u }); k++; }
      if (k) H.mark(); return true;
    }
    if (ty === "cload") {
      const car = carObj(); if (!car) return true; car.crates = car.crates || []; const h = hand(), cap = capOfCar(car); let k = 0;
      while (h.length && car.crates.length < cap) { car.crates.push(h.shift()); k++; }
      if (k) H.mark(); return true;
    }
    if (ty === "cunload") {
      const car = carObj(); if (!car || !(car.crates || []).length) return true;
      car.crates.forEach((c) => H.add(c.crop, c.units)); car.crates = []; H.mark(); return true;
    }
    if (ty === "csell") {
      const car = carObj(); if (!car || !(car.crates || []).length) return true; const sh = SHOPS[d.shop] || SHOPS.s1; let gain = 0, n = 0;
      car.crates.forEach((c) => { gain += Math.round(G().priceOf(c.crop, day) * c.units * sh.mult); n += c.units; });
      S.coins += gain; S.sells += n; car.crates = []; H.mark(); return true;
    }
    // مخازن الأراضي
    if (ty === "lstash") { const arr = shed(); if (!arr) return true; const h = hand(); let k = 0; while (h.length && arr.length < LCAP) { arr.push(h.shift()); k++; } if (k) H.mark(); return true; }
    if (ty === "lunstash") {
      const arr = shed(); if (!arr || !G().CROPS[d.crop]) return true; const n = Math.max(1, Math.min(6, d.n | 0)); let k = 0;
      while (k < n && hand().length < handCap()) { const i = arr.findIndex((c) => c.crop === d.crop); if (i < 0) break; hand().push(arr.splice(i, 1)[0]); k++; }
      if (k) H.mark(); return true;
    }
    if (ty === "lunload") {
      const arr = shed(), car = carObj(); if (!arr || !car || !(car.crates || []).length) return true; let k = 0;
      while (car.crates.length && arr.length < LCAP) { arr.push(car.crates.shift()); k++; }
      if (k) H.mark(); return true;
    }
    return false;
  };

  /* ===== شكل الكراتين ===== */
  const cc = {};
  function addCrate(b, x, y, z, c) {
    b.box(x, y, z, 0.66, 0.36, 0.5, "#c9a06a"); b.box(x, y + 0.05, z + 0.26, 0.6, 0.04, 0.02, "#a97c50");
    b.sphere(x - 0.15, y + 0.36, z, 0.17, 0.12, 0.17, c, 5); b.sphere(x + 0.15, y + 0.36, z + 0.02, 0.17, 0.12, 0.17, c, 5); b.sphere(x, y + 0.4, z - 0.08, 0.15, 0.11, 0.15, c, 5);
  }
  const crateMesh = (c) => cc[c] || (cc[c] = (() => { const b = new Builder(); addCrate(b, 0, 0, 0, c); return b.build(R.gl); })());

  /* كراتين المخزن الرئيسي (جوا الهنقر) */
  const STK = { cx: -45, step: 0.74, rows: [-32.9, -32.25], cols: 14, max: 84 };
  let stMesh = null, stSig = "";
  function storageMesh() {
    const s = G().state(), list = [], C = G().CROPS;
    Object.keys(C).forEach((k) => { const n = Math.ceil((s.inv[k] || 0) / UNITS); for (let i = 0; i < n; i++) list.push(C[k].c); });
    const lst = list.slice(0, STK.max), sig = lst.join(",");
    if (sig !== stSig) {
      stSig = sig; if (stMesh) { R.free(stMesh); stMesh = null; }
      if (lst.length) { const b = new Builder(); lst.forEach((c, i) => { const col = i % STK.cols, row = Math.floor(i / STK.cols) % 2, layer = Math.floor(i / (STK.cols * 2)); addCrate(b, STK.cx + (col - (STK.cols - 1) / 2) * STK.step, 0.18 + layer * 0.4, STK.rows[row], c); }); stMesh = b.build(R.gl); }
    }
    return stMesh;
  }
  L.storedCrates = () => { const s = G().state(); return Object.keys(G().CROPS).reduce((n, k) => n + Math.ceil((s.inv[k] || 0) / UNITS), 0); };

  /* كراتين مخازن الأراضي */
  const lm = {};
  function landMesh(k) {
    const arr = ((G().state().lstore || {})[k.id]) || [], C = G().CROPS, sig = arr.map((c) => c.crop).join(",");
    const o = lm[k.id] || (lm[k.id] = { mesh: null, sig: "" });
    if (o.sig !== sig) {
      o.sig = sig; if (o.mesh) { R.free(o.mesh); o.mesh = null; }
      if (arr.length) { const b = new Builder(); arr.slice(0, LCAP).forEach((cr, i) => { const col = i % 6, row = Math.floor(i / 6) % 2, layer = Math.floor(i / 12); addCrate(b, k.shed.cx + (col - 2.5) * 0.74, 0.1 + layer * 0.4, k.shed.cz - 1.16 + row * 0.6, (C[cr.crop] || { c: "#999" }).c); }); o.mesh = b.build(R.gl); }
    }
    return o.mesh;
  }

  /* كراتين السيارات: صندوق البيك أب، وسقف باقي السيارات */
  function slot(kind, i, n) {
    const D = V().CARS[kind], Pp = D.shape, hl = Pp.len / 2, lift = Pp.lift || 0;
    if (Pp.bed) { const k = i % 6, row = Math.floor(k / 2), col = k % 2, layer = Math.floor(i / 6); return { x: col ? 0.42 : -0.42, y: 0.42 + lift + layer * 0.4, z: -hl + 0.48 + row * 0.56 }; }
    const rows = Math.ceil(n / 2), cf = hl - Pp.hood, cb = -hl + Pp.trunk, cz = (cf + cb) / 2, row = Math.floor(i / 2), col = i % 2;
    const y = Pp.open ? Pp.y1 - 0.08 + lift : Math.max(Pp.roof, Pp.y1 + 0.78) + 0.05 + lift;
    return { x: col ? 0.4 : -0.4, y, z: cz + (row - (rows - 1) / 2) * 0.56 };
  }
  const mm = new Float32Array(16);
  L.drawCar = (car, x, z, h) => {
    try {
      const cr = car.crates; if (!cr || !cr.length) return; const D = V().CARS[car.car]; if (!D) return;
      const n = Math.min(cr.length, D.cargo), s = Math.sin(h), co = Math.cos(h), C = G().CROPS;
      for (let i = 0; i < n; i++) { const p = slot(car.car, i, n); M.trs(x + p.x * co + p.z * s, p.y, z - p.x * s + p.z * co, h, 0, 0, 1, 1, 1, mm); R.draw(crateMesh(C[cr[i].crop].c), mm); }
    } catch (e) { /* ما نوقف الرسم */ }
  };
  L.room = (car) => capOfCar(car) - (car.crates || []).length;

  /* ===== بناء: مرايب بأبواب، مخازن، محلات ===== */
  const doorMs = {};
  function doorM(w) {
    const k = Math.round(w * 10); if (doorMs[k]) return doorMs[k];
    const b = new Builder();
    b.box(0, 0, 0, 0.14, 2.75, w, "#dfe2e7"); for (let i = 1; i < 6; i++) b.box(0.08, i * 0.45, 0, 0.02, 0.05, w, "#9aa0aa"); for (let i = 1; i < 6; i++) b.box(-0.08, i * 0.45, 0, 0.02, 0.05, w, "#9aa0aa");
    b.box(0.09, 0.06, 0, 0.03, 0.12, 1.2, "#6b7280");
    return (doorMs[k] = b.build(R.gl));
  }
  // مرآب: سقف وجدران وباب بيطلع وبينزل. face=+1 معناه مفتوح ناحية +x
  function garage(c, g) {
    const { B, S, reg, label, col } = c, hx = g.d / 2, hz = g.w / 2, f = g.face, xf = g.cx + f * hx, xb = g.cx - f * hx;
    B.box(g.cx, 0.04, g.cz, g.d + 1.0, 0.06, g.w + 0.8, "#5f6571");
    B.box(xb + f * 0.15, 0, g.cz, 0.3, 3.0, g.w, "#e8dcc2");
    [-1, 1].forEach((s) => { B.box(g.cx, 0, g.cz + s * (hz - 0.15), g.d, 1.3, 0.3, "#e8dcc2"); B.box(xf - f * 0.2, 0, g.cz + s * (hz - 0.2), 0.4, 3.2, 0.4, "#8a6a4a"); });
    B.box(g.cx, 3.2, g.cz, g.d + 0.8, 0.3, g.w + 0.8, g.roof || "#c0563a"); B.box(g.cx, 3.5, g.cz, g.d + 0.5, 0.12, g.w + 0.5, "#a64830");
    B.box(xf - f * 0.2, 2.9, g.cz, 0.4, 0.4, g.w, "#8a6a4a"); B.box(xf + f * 0.05, 3.0, g.cz, 0.08, 0.5, 4.2, "#2f7d46");
    for (let z = g.cz - hz; z <= g.cz + hz + 0.01; z += 1.5) col(xb + f * 0.3, z, 0.5);
    for (let x = Math.min(xb, xf); x <= Math.max(xb, xf) + 0.01; x += 1.5) { col(x, g.cz - hz + 0.15, 0.5); col(x, g.cz + hz - 0.15, 0.5); }
    L.doors.push({ x: xf - f * 0.1, z: g.cz, w: g.w - 0.6, h: 2.7, open: 0, last: 0 });
    L.anchors.push([g.cx, g.cz, 6.5]);
    if (g.act) { reg(g.act, g.cx, 1.6, g.cz, 5.2, xf + f * 2.5, g.cz + 0.5); S.poi[g.act] = { x: xf + f * 2.5, z: g.cz + 0.5 }; label(g.act, g.name, xf, 5.0, g.cz, { act: g.act, max: 70 }); }
    else if (g.name) label("gl_" + g.cx.toFixed(0) + "_" + g.cz.toFixed(0), g.name, xf, 4.6, g.cz, { cls: "sm", max: 38 });
  }
  // مخزن أرض: كوخ مفتوح من الجنوب، الكراتين بتنرصّ جواته
  function shedBuild(c, k) {
    const { B, S, reg, label, col } = c, s = k.shed, id = k.id;
    B.box(s.cx, 0.04, s.cz, s.w + 0.6, 0.06, s.dp + 0.6, "#9b8465");
    B.box(s.cx, 0, s.cz - s.dp / 2 + 0.12, s.w, 2.5, 0.24, "#a0522d");
    [-1, 1].forEach((sd) => B.box(s.cx + sd * (s.w / 2 - 0.12), 0, s.cz, 0.24, 2.5, s.dp, "#a0522d"));
    B.box(s.cx, 2.5, s.cz, s.w + 0.6, 0.22, s.dp + 0.8, "#6e4b3a"); B.box(s.cx, 2.72, s.cz - 0.1, s.w + 0.4, 0.12, s.dp + 0.5, "#5b3d2f");
    B.box(s.cx, 0.1, s.cz - 0.85, s.w - 0.5, 0.06, 1.7, "#b8946a");
    for (let x = s.cx - s.w / 2; x <= s.cx + s.w / 2 + 0.01; x += 1.4) col(x, s.cz - s.dp / 2 + 0.12, 0.45);
    [-1, 1].forEach((sd) => { col(s.cx + sd * (s.w / 2 - 0.12), s.cz - 0.6, 0.4); col(s.cx + sd * (s.w / 2 - 0.12), s.cz + 0.9, 0.4); });
    const px = s.cx, pz = s.cz + s.dp / 2 + 1.6;
    reg("lshed:" + id, s.cx, 1.4, s.cz, 3.4, px, pz); S.poi["lshed:" + id] = { x: px, z: pz };
    label("lshed_" + id, "📦 مخزن " + k.n, s.cx, 3.6, s.cz, { act: "lshed:" + id, max: 45, cls: "sm" });
    L.anchors.push([s.cx, s.cz, 4.5]);
  }
  // محل: مبنى بباب ونوافذ ومظلة، بيفتح نافذة الشراء
  function shopBuild(c, s) {
    const { B, S, reg, label, col } = c, f = s.face, d = 9, w = 10, xf = s.x + f * d / 2;
    B.box(s.x, 0.04, s.z, d + 1.6, 0.06, w + 1.6, "#d9cba6");
    B.box(s.x, 0, s.z, d, 4.2, w, s.wall || "#f1e6cf"); B.box(s.x, 4.2, s.z, d + 0.8, 0.3, w + 0.8, s.roof); B.box(s.x, 4.5, s.z, d + 0.4, 0.16, w + 0.4, "#ffffff", 0.2);
    B.box(xf + f * 0.02, 0, s.z, 0.12, 2.4, 1.8, "#5a3d2b"); [-3.2, 3.2].forEach((dz) => B.box(xf + f * 0.02, 1.0, s.z + dz, 0.12, 1.5, 2.2, "#9bd1f0"));
    for (let i = 0; i < 10; i++) B.box(xf + f * 0.9, 3.15, s.z - 4.5 + i, 1.9, 0.1, 1, i % 2 ? "#ffffff" : s.roof);
    B.box(xf + f * 0.05, 3.5, s.z, 0.1, 0.55, 6.2, "#3a2f2b");
    for (let z = s.z - w / 2; z <= s.z + w / 2 + 0.01; z += 1.8) { col(s.x - f * d / 2, z, 0.6); col(xf - f * 0.3, z, 0.6); }
    for (let x = s.x - d / 2; x <= s.x + d / 2 + 0.01; x += 1.8) { col(x, s.z - w / 2, 0.6); col(x, s.z + w / 2, 0.6); }
    reg(s.act, s.x, 2.2, s.z, 6.5, xf + f * 3.0, s.z); S.poi[s.act] = { x: xf + f * 3.0, z: s.z };
    label(s.act, s.name, xf, 6.0, s.z, { act: s.act, max: 90 });
    L.anchors.push([s.x, s.z, 9]);
  }

  const GSHOP = { id: "S", cx: -16.4, cz: 21.1, d: 6.4, w: 7.4, face: 1, act: "garageS", name: "🚚 مرآب سعدون" };
  const ISL_SHOPS = [
    { act: "shop2", name: "🏬 سوبرماركت الجزيرة", x: -70, z: 1160, face: 1, roof: "#2a9d8f", wall: "#eaf6f3" },
    { act: "furnstore", name: "🛋️ معرض الأثاث", x: -70, z: 1186, face: 1, roof: "#b5651d", wall: "#f6e8d6" },
    { act: "eatery", name: "🍽️ مطعم الجزيرة", x: -70, z: 1212, face: 1, roof: "#e63946", wall: "#fbe9e7" },
    { act: "giftshop", name: "🎁 محل الهدايا", x: 70, z: 1160, face: -1, roof: "#9b5de5", wall: "#f1eafc" },
    { act: "farmstore", name: "🧰 مستلزمات المزرعة", x: 70, z: 1186, face: -1, roof: "#6a994e", wall: "#eef5e6" },
  ];

  L.build = (c) => {
    try {
      L.doors = []; L.anchors = []; const { B, S, reg, label } = c;
      // رف خشبي تحت كراتين المخزن + بوصلة الموقف عالطريق شرق الهنقر
      B.box(STK.cx, 0.1, (STK.rows[0] + STK.rows[1]) / 2, 11.2, 0.08, 1.7, "#a97c50"); B.box(STK.cx, 0.17, STK.rows[0] - 0.55, 11.2, 0.5, 0.1, "#8a5a3b");
      for (let i = 0; i < 3; i++) { B.box(-33.15, 0.1, -26.5 - i * 5.2 - 2.4, 0.1, 0.03, 0.1, "#f4f1e8"); B.box(-33.15, 0.1, -26.5 - i * 5.2 + 2.4, 0.1, 0.03, 0.1, "#f4f1e8"); }
      S.poi.barn = { x: -45, z: -30.2 };
      label("barnstore", "📦 المخزن", STK.cx, 3.4, -32.6, { act: "barn", max: 45, cls: "sm" }); label("lotG", "🅿️ موقف المخزن", -31.8, 2.4, -29.2, { act: "barn", max: 30, cls: "sm" });
      L.anchors.push([-31.8, -31.5, 7]);
      // مرآب سعدون
      garage(c, GSHOP);
      // كراج البيت (أول موقفين عند البيت)
      garage(c, { cx: 12.9, cz: -41.05, d: 6.4, w: 9.4, face: 1, name: "🏠 كراج بيتنا", roof: "#8a5a3b" });
      // الأراضي: طريق + مرآب + مخزن
      KITS.forEach((k) => {
        B.strip(k.road, 3.6, 0.11, "#b8a98a"); L.anchors.push([(k.gx + k.frontX) / 2, k.cz, 7]);
        garage(c, { cx: k.cx, cz: k.cz, d: k.d, w: k.w, face: k.face, name: "🚪 مرآب " + k.n, roof: "#7a5a3a" });
        shedBuild(c, k);
      });
    } catch (e) { console.error("logi.build", e); }
  };

  // سوق الجزيرة: شوارع + محلات + مرآب للسوبرماركت
  L.buildIsland = (c) => {
    try {
      const { B } = c;
      [-58, 58].forEach((x) => { B.strip([[x, 1122], [x, 1250]], 6, 0.12, "#3b3f47"); B.strip([[x - 2.7, 1122], [x - 2.7, 1250]], 0.16, 0.14, "#f4f4f4"); B.strip([[x + 2.7, 1122], [x + 2.7, 1250]], 0.16, 0.14, "#f4f4f4"); });
      B.strip([[-58, 1128], [58, 1128]], 6, 0.12, "#3b3f47"); B.strip([[-20, 1180], [-58, 1180]], 6, 0.12, "#3b3f47"); B.strip([[20, 1180], [58, 1180]], 6, 0.12, "#3b3f47");
      for (let x = -52; x <= 52; x += 8) B.box(x, 0.14, 1128, 2.6, 0.03, 0.2, "#ffd23f");
      garage(c, { cx: -64.4, cz: 1137, d: 6.4, w: 7.4, face: 1, act: "garageS2", name: "🚚 مرآب السوبرماركت", roof: "#2a9d8f" });
      ISL_SHOPS.forEach((s) => shopBuild(c, s));
      [[-58, 1190], [58, 1190], [-58, 1235], [58, 1235]].forEach(([x, z]) => { B.cyl(x + (x < 0 ? 3.9 : -3.9), 0, z, 0.1, 0.08, 3.6, "#4a3d38", 6); B.sphere(x + (x < 0 ? 3.9 : -3.9), 3.8, z, 0.34, 0.4, 0.34, "#ffe7a0", 7, 1); });
    } catch (e) { console.error("logi.buildIsland", e); }
  };
  L.islandBlocked = (x, z) => (Math.abs(x) > 36 && Math.abs(x) < 80 && z > 1118 && z < 1252) || (z > 1122 && z < 1134) || (z > 1175 && z < 1185 && Math.abs(x) < 62);

  /* ===== رسم: كراتين المخازن + أبواب المرايب ===== */
  L.draw = (t) => {
    try {
      const sm = storageMesh(); if (sm) R.draw(sm);
      const me = W()._int.me, pa = W()._int.pa;
      KITS.forEach((k) => { if (hy(me.x - k.shed.cx, me.z - k.shed.cz) < 160) { const m = landMesh(k); if (m) R.draw(m); } });
      const now = performance.now();
      L.doors.forEach((d) => {
        const dt = Math.min(0.1, (now - (d.last || now)) / 1000); d.last = now;
        const near = (o, r) => o && hy(o.x - d.x, o.z - d.z) < r;
        const want = near(me, me.veh ? 14 : 7) || (pa.vis && near(pa, pa.veh ? 14 : 7)) ? 1 : 0;
        d.open += (want - d.open) * Math.min(1, dt * 3.2);
        if (d.open < 0.97) { M.trs(d.x, d.open * 2.6, d.z, 0, 0, 0, 1, 1, 1, mm); R.draw(doorM(d.w), mm); }
      });
    } catch (e) { /* ما نوقف الرسم */ }
  };

  /* ===== نوافذ ===== */
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${name}</b><small>${sub}</small></div><div class="ib">${btns || ""}</div></div>`;
  const coinBar = () => `<div class="coinbar">🪙 <b>${G().state().coins}</b></div>`;
  const crateIcons = (cr) => (cr || []).map((c) => (G().CROPS[c.crop] || {}).e || "📦").join("");
  const carName = (c) => `${V().CARS[c.car].e} ${V().CARS[c.car].n}`;
  const lotCars = (k) => V().owned().filter((c) => V().atOf(c) === k);
  const worth = (cr, shop) => { const day = G().today(), m = (SHOPS[shop] || SHOPS.s1).mult; return (cr || []).reduce((n, c) => n + Math.round(G().priceOf(c.crop, day) * c.units * m), 0); };
  const handLine = () => { const hand = G().carryOf(db().uid); return `🤲 بإيدك ${hand.length}/${G().carryMax()} ${crateIcons(hand)}`; };

  function garageModal(lot, shop) {
    const cars = lotCars(lot), C = G().CROPS, day = G().today(), sh = SHOPS[shop];
    const rows = cars.map((c) => { const n = (c.crates || []).length; return irow("🚚", carName(c), n ? `${crateIcons(c.crates)} · ${n} كراتين` : "فاضية", n ? `<button class="btn sm gold" data-act="g-lg-sell" data-id="${c.id}" data-shop="${shop}">💰 بيع (${worth(c.crates, shop)}🪙)</button>` : ""); }).join("");
    const board = Object.keys(C).map((k) => `<span class="tag">${C[k].e} ${Math.round(G().priceOf(k, day) * sh.mult)}🪙 ${G().trend(k, day)}</span>`).join(" ");
    ui().openModal(`<h3>🚚 مرآب ${esc(sh.n)}</h3>${coinBar()}
      <p class="hint">ركّوا السيارة المحمّلة جوا المرآب (انزلوا منها هون)، وبعدين بيعوا الحمولة كاملة${sh.mult > 1 ? ` — هون بيدفعوا أكثر بـ ${Math.round((sh.mult - 1) * 100)}٪! 🏝️` : " بسعر اليوم"} 💰</p>
      <div class="items" style="margin:8px 0">${rows || '<div class="empty">ما في سيارة بالمرآب. ركّ سيارتك هون 🚗</div>'}</div>
      <b>📈 أسعار اليوم عندهم</b><div class="chips" style="gap:6px;margin-top:6px">${board}</div>`);
  }
  function shopWrap(id, title, tab, shopId) {
    return () => {
      const G_ = G(), fresh = document.querySelector("#modal").hidden; if (fresh) G_.ui.tab = tab; G_.shopId = shopId;
      G_.openers.shop(); const h = document.querySelector("#modalCard h3"); if (h) { h.textContent = title; const mul = G_.SHOP_MUL[shopId] || 1; if (mul !== 1) h.insertAdjacentHTML("afterend", `<p class="hint" style="margin:2px 0 6px">🏝️ أسعار الجزيرة ${mul < 1 ? "أرخص" : "أغلى"} بـ ${Math.round(Math.abs(1 - mul) * 100)}٪ من البر!</p>`); }
    };
  }

  const O = OSW.game && OSW.game.openers;
  if (O) {
    if (OSW.places) OSW.places.noRefresh = Object.assign(OSW.places.noRefresh || {}, {});
    O.xbarn = () => {
      const s = G().state(), hand = G().carryOf(db().uid), C = G().CROPS;
      const rows = Object.keys(C).filter((k) => (s.inv[k] || 0) > 0).map((k) => irow(C[k].e, C[k].n, `${s.inv[k]} وحدة ≈ ${Math.ceil(s.inv[k] / UNITS)} كراتين`,
        `<button class="btn sm gold" data-act="g-lg-take" data-k="${k}" data-n="1">📦 خذ 1</button><button class="btn sm alt" data-act="g-lg-take" data-k="${k}" data-n="3">خذ 3</button>`)).join("");
      const cars = lotCars("G").filter((c) => (c.crates || []).length).map((c) => irow("🚚", carName(c), `${crateIcons(c.crates)} · ${c.crates.length} كراتين`, `<button class="btn sm berry" data-act="g-lg-unload" data-id="${c.id}">⬇️ فرّغها بالمخزن</button>`)).join("");
      ui().openModal(`<h3>📦 مخزن المزرعة</h3>${coinBar()}
        <p class="hint">كراتينك بتتحط هون وبتشوفوها مرصوصة جوا الهنقر. خذ كراتين بإيدك، وروح للسيارة واضغط عليها لتحمّلها، وبعدين وصّلها لمرآب سعدون (أو لسوبرماركت الجزيرة 🏝️ بسعر أعلى) وبيعها 🚚</p>
        <div class="chk" style="margin:6px 0">${handLine()} ${hand.length ? `<button class="btn sm alt" data-act="g-lg-stash">⬇️ حطها بالمخزن</button>` : ""}</div>
        <div class="items" style="margin:8px 0">${rows || '<div class="empty">المخزن فاضي… اقطفوا محصول وحطوه هون 🌾</div>'}</div>
        ${cars ? `<b>🚗 سيارات واقفة عند المخزن</b><div class="items" style="margin:6px 0">${cars}</div>` : `<p class="hint">ركّ السيارة بموقف المخزن عالطريق عشان تفرّغ حمولتها هون.</p>`}
        <div class="row" style="margin-top:8px"><button class="btn alt sm" data-act="g-go" data-k="farm">🌾 المزرعة</button></div>`);
    };
    O.xshed = () => {
      const k = kitOf(L.curShed); if (!k) return ui().closeModal();
      const arr = ((G().state().lstore || {})[k.id]) || [], hand = G().carryOf(db().uid), C = G().CROPS, cnt = {};
      arr.forEach((c) => (cnt[c.crop] = (cnt[c.crop] || 0) + 1));
      const rows = Object.keys(cnt).map((cr) => irow(C[cr].e, C[cr].n, `${cnt[cr]} كراتين`, `<button class="btn sm gold" data-act="g-lg-ltake" data-k="${cr}" data-n="1">📦 خذ 1</button><button class="btn sm alt" data-act="g-lg-ltake" data-k="${cr}" data-n="3">خذ 3</button>`)).join("");
      const cars = lotCars(k.key).filter((c) => (c.crates || []).length).map((c) => irow("🚚", carName(c), `${crateIcons(c.crates)} · ${c.crates.length} كراتين`, `<button class="btn sm berry" data-act="g-lg-lunload" data-id="${c.id}">⬇️ فرّغها هون</button>`)).join("");
      ui().openModal(`<h3>📦 مخزن ${esc(k.n)}</h3><p class="hint">${arr.length} / ${LCAP} كراتين. اقطف من الأرض وخزّن هون، وبعدين حمّل السيارة وروح بيع 🚚</p>
        <div class="chk" style="margin:6px 0">${handLine()} ${hand.length ? `<button class="btn sm gold" data-act="g-lg-lstash">⬇️ حطها هون</button>` : ""}</div>
        <div class="items" style="margin:8px 0">${rows || '<div class="empty">المخزن فاضي… اقطف من الأرض وحط الكراتين هون 🌾</div>'}</div>
        ${cars ? `<b>🚗 سيارات واقفة بمرآب الأرض</b><div class="items" style="margin:6px 0">${cars}</div>` : `<p class="hint">ركّ السيارة بالمرآب اللي جنب الأرض عشان تفرّغ أو تحمّل منها.</p>`}`);
    };
    O.garageS = () => garageModal("S", "s1");
    O.garageS2 = () => garageModal("S2", "s2");
    O.shop2 = shopWrap("shop2", "🏬 سوبرماركت الجزيرة", "food", "s2");
    O.furnstore = () => { G().shopId = "fu"; O.furniture(); const h = document.querySelector("#modalCard h3"); if (h) { h.textContent = "🛋️ معرض الأثاث"; h.insertAdjacentHTML("afterend", `<p class="hint" style="margin:2px 0 6px">🏝️ أسعار الجزيرة أرخص بـ 10٪ من البر!</p>`); } };
    O.eatery = shopWrap("eatery", "🍽️ مطعم الجزيرة", "food", "eat");
    O.giftshop = shopWrap("giftshop", "🎁 محل الهدايا", "gift", "gs");
    O.farmstore = shopWrap("farmstore", "🧰 مستلزمات المزرعة", "farm", "fm");
  }

  L.shedAct = (id) => {
    try {
      L.curShed = id; const hand = G().carryOf(db().uid);
      if (hand.length) { G().do("lstash", { land: id }); sfx("pop"); return toast("📦 حطّيت الكراتين بمخزن الأرض", "", 1800); }
      OSW.app.goPlace("xshed");
    } catch (e) { /* */ }
  };

  L.click = async (a, el) => {
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } };
    const full = () => G().carryOf(db().uid).length >= G().carryMax();
    switch (a) {
      case "g-lg-take": return busy(async () => { if (full()) return toast("🤲 إيدك ممتلئة! حمّل السيارة أول", "", 2600); await G().do("unstash", { crop: d.k, n: +d.n || 1 }); sfx("pop"); P().open("xbarn"); });
      case "g-lg-stash": return busy(async () => { await G().do("stash", {}); sfx("coin"); P().open("xbarn"); });
      case "g-lg-unload": return busy(async () => { await G().do("cunload", { id: d.id }); sfx("coin"); toast("⬇️ انحطّت الكراتين بالمخزن", "gold"); P().open("xbarn"); });
      case "g-lg-ltake": return busy(async () => { if (full()) return toast("🤲 إيدك ممتلئة! حمّل السيارة أول", "", 2600); await G().do("lunstash", { land: L.curShed, crop: d.k, n: +d.n || 1 }); sfx("pop"); P().open("xshed"); });
      case "g-lg-lstash": return busy(async () => { await G().do("lstash", { land: L.curShed }); sfx("pop"); P().open("xshed"); });
      case "g-lg-lunload": return busy(async () => { await G().do("lunload", { id: d.id, land: L.curShed }); sfx("coin"); toast("⬇️ انحطّت الكراتين بمخزن الأرض", "gold"); P().open("xshed"); });
      case "g-lg-sell": return busy(async () => {
        const car = V().owned().find((c) => c.id === d.id); if (!car) return; const before = G().state().coins, shop = d.shop || "s1";
        await G().do("csell", { id: d.id, shop }); const gain = G().state().coins - before; sfx("coin"); hearts("🪙", 10); toast(`💰 بعتوا الحمولة وربحتوا ${gain}🪙`, "gold", 4000); P().open(shop === "s2" ? "garageS2" : "garageS");
      });
    }
  };

  // لما يركّ اللاعب السيارة: عند مرآب البيع بيفتح نافذة البيع، وعند المخازن بيذكّره
  L.onPark = (lot, car) => {
    try {
      if (!car || !(car.crates || []).length) return;
      if (lot === "S") setTimeout(() => OSW.app && OSW.app.goPlace("garageS"), 700);
      else if (lot === "S2") setTimeout(() => OSW.app && OSW.app.goPlace("garageS2"), 700);
      else if (lot === "G") toast("📦 اضغطوا عالمخزن لتفريغ الحمولة", "", 3500);
      else if (/^L\d$/.test(lot)) toast("📦 اضغطوا عمخزن الأرض لتفريغ الحمولة", "", 3500);
    } catch (e) { /* */ }
  };
})();
