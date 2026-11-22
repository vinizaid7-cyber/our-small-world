/* السيارات: كتالوج، مجسمات بكابينة مفتوحة، سواقة من جوا السيارة (راكبين اثنين)، وكاميرا قمرة/خارجية */
(function () {
  const OSW = window.OSW, PI = Math.PI, hy = Math.hypot, Builder = OSW.Builder, M = OSW.M, R = OSW.R, dk = OSW.col.dk, lt = OSW.col.lt;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; };
  const V = (OSW.veh = { me: null, input: { x: 0, y: 0, gas: 0, brake: 0 } });

  /* ---------- الجغرافيا: الجزيرتين والطريق ---------- */
  V.ISLE = { x: 0, z: 1180, r: 92 };            // الجزيرة الثانية
  V.ROAD = { x: 0, z0: 72, z1: 1092, w: 10 };   // الطريق الطويل (بين الجزيرتين)
  V.VIL = { x0: -112, x1: 112, z0: -62, z1: 98 };
  V.LOTS = { A: { x: 11, z: 70, dz: 5.9, h: -PI / 2, cx: 11, cz: 84 }, B: { x: -8, z: 1102, dz: 5.9, h: PI / 2, cx: -8, cz: 1116 }, H: { x: 13, z: -44, dz: 5.9, h: -PI / 2, cx: 13, cz: -30 } }; // H = موقف جنب بيتنا
  V.onIsle = (x, z) => hy(x - V.ISLE.x, z - V.ISLE.z) < V.ISLE.r - 2;
  V.pedOk = (x, z) => V.onIsle(x, z) || (x >= V.VIL.x0 && x <= V.VIL.x1 && z >= V.VIL.z0 && z <= V.VIL.z1);
  V.carOk = (x, z) => V.pedOk(x, z) || (Math.abs(x - V.ROAD.x) < V.ROAD.w / 2 - 0.9 && z > V.VIL.z1 - 6 && z < V.ROAD.z1 + 8);
  // تقييد المشاة: ما بيطلعوا من الجزيرة أو القرية (الطريق للسيارات بس)
  V.constrain = (o) => {
    if (V.onIsle(o.x, o.z)) return false;
    let hit = false; const c = (v, a, b) => { const r = clamp(v, a, b); if (r !== v) hit = true; return r; };
    o.x = c(o.x, V.VIL.x0, V.VIL.x1); o.z = c(o.z, V.VIL.z0, V.VIL.z1);
    if (o.z > 1000 && !V.onIsle(o.x, o.z)) { const a = Math.atan2(o.x - V.ISLE.x, o.z - V.ISLE.z), r = V.ISLE.r - 3; o.x = V.ISLE.x + Math.sin(a) * r; o.z = V.ISLE.z + Math.cos(a) * r; }
    return hit;
  };

  /* ---------- كتالوج السيارات ---------- */
  V.CARS = {
    mini: { n: "ميني هاتشباك", e: "🚗", price: 150, vmax: 22, acc: 9, hand: 1.75, brake: 18, cargo: 4, shape: { len: 3.6, hood: 0.9, trunk: 0.7, roof: 1.5, y1: 0.92 }, note: "خفيفة وسهلة · طبون بيشيل 4 حيوانات" },
    sedan: { n: "سيدان عائلية", e: "🚙", price: 320, vmax: 30, acc: 10, hand: 1.5, brake: 20, cargo: 6, shape: { len: 4.4, hood: 1.2, trunk: 1.0, roof: 1.52, y1: 0.92 }, note: "مريحة وسرعتها حلوة · طبون بيشيل 6 حيوانات" },
    pickup: { n: "بكم (بيك أب)", e: "🛻", price: 480, vmax: 26, acc: 8, hand: 1.3, brake: 17, cargo: 12, shape: { len: 5.0, hood: 1.2, trunk: 1.9, roof: 1.55, y1: 0.95, bed: 1 }, note: "الأكبر: صندوقه بيشيل 12 حيوان للملحمة!" },
    jeep: { n: "جيب الصحراء", e: "🚐", price: 620, vmax: 27, acc: 9, hand: 1.45, brake: 19, cargo: 8, shape: { len: 4.0, hood: 1.0, trunk: 0.8, roof: 1.75, y1: 1.05, lift: 0.18, boxy: 1, open: 1 }, note: "عالي وقوي · بيشيل 8 حيوانات" },
    classic: { n: "كلاسيك قديمة", e: "🚘", price: 700, vmax: 24, acc: 8, hand: 1.7, brake: 17, cargo: 6, shape: { len: 4.3, hood: 1.3, trunk: 1.1, roof: 1.55, y1: 0.95, round: 1, open: 1 }, note: "شكلها ساحر · طبون بيشيل 6 حيوانات" },
    van: { n: "فان عائلي (6 مقاعد+)", e: "🚌", price: 520, vmax: 25, acc: 8, hand: 1.35, brake: 18, cargo: 8, seats: 8, rowsL: [3, 3], shape: { len: 4.6, hood: 1.0, trunk: 0.5, roof: 1.95, y1: 1.0, boxy: 1 }, note: "بتسع 8 أشخاص · مناسبة للعيلة الكبيرة" },
    sport: { n: "سبورت", e: "🏎️", price: 950, vmax: 42, acc: 15, hand: 1.25, brake: 24, cargo: 2, shape: { len: 4.3, hood: 1.5, trunk: 0.9, roof: 1.22, y1: 0.78, low: 1, open: 1 }, note: "الأسرع على الطريق · طبون صغير (2 حيوان)" },
  };
  // مقاعد: كل سيارة (ما عدا السبورت) بتسع 6 أشخاص على الأقل، والبكم 4، والميني 4
  const LAYOUT = { mini: [2], sedan: [2, 2], pickup: [2], jeep: [2, 2], classic: [2, 2], sport: [] };
  Object.keys(V.CARS).forEach((k) => { const D = V.CARS[k], rows = D.rowsL || LAYOUT[k] || []; D.rows = rows; D.seats = D.seats || 2 + rows.reduce((n, r) => n + r, 0); D.shape.len0 = D.shape.len; D.shape.len += rows.length * 0.68; });
  V.COLORS = ["#e63946", "#ffd23f", "#4dabf7", "#2a9d8f", "#f4f1e8", "#2b2b35", "#ff8c42", "#9b5de5", "#7ac74f", "#ff7aa8"];

  /* ---------- مجسم السيارة (كابينة مفتوحة للسواقة من جوا) ---------- */
  const cache = {};
  function carMesh(kind, color) {
    const key = kind + color; if (cache[key]) return cache[key];
    const D = V.CARS[kind], P = D.shape, b = new Builder(), W = P.low ? 2.0 : 1.9, L = P.len, hl = L / 2, y1 = P.y1, lift = P.lift || 0, dark = "#23242b", body = color, hw = W / 2;
    const cf = hl - P.hood, cb = -hl + P.trunk, cz = (cf + cb) / 2, cl = cf - cb;
    b.push(0, lift, 0);
    b.box(0, 0.22, 0, W - 0.1, 0.12, L, dark);                                                   // أرضية
    [-1, 1].forEach((s) => b.box(s * (hw - 0.06), 0.25, cz, 0.12, y1 - 0.25, cl, body));         // أبواب (جدران جانبية)
    b.box(0, 0.25, hl - P.hood / 2, W, y1 - 0.3, P.hood, body); b.box(0, y1 - 0.05, hl - P.hood / 2, W - 0.1, 0.06, P.hood, lt(body, 0.12)); // غطاء المحرك
    if (P.bed) {                                                                                 // صندوق البكم
      b.box(0, 0.3, cb - P.trunk / 2 + 0.0, W - 0.2, 0.1, P.trunk, "#4a4a52"); [-1, 1].forEach((s) => b.box(s * (hw - 0.07), 0.3, -hl + P.trunk / 2, 0.12, 0.75, P.trunk, body)); b.box(0, 0.3, -hl + 0.06, W, 0.75, 0.12, body); b.box(0, 0.3, cb - 0.05, W, 0.8, 0.12, body);
    } else b.box(0, 0.25, -hl + P.trunk / 2, W, y1 - 0.3, P.trunk, body), b.box(0, y1 - 0.05, -hl + P.trunk / 2, W - 0.1, 0.06, P.trunk, lt(body, 0.12));
    // طبلون + مقاعد + مقود
    b.box(0, y1 - 0.34, cf - 0.2, W - 0.15, 0.3, 0.4, dark); b.box(0, y1 - 0.1, cf - 0.14, W - 0.5, 0.05, 0.24, "#2a2b33");
    const ST = V.seats(kind), lo = lt(dark, 0.1);
    ST.forEach((q) => { const z0 = q.z + 0.28; b.box(q.x, 0.3, z0, 0.5, 0.22, 0.56, "#5a4a42"); b.push(q.x, 0.55, z0 - 0.4, 0, -0.18); b.box(0, 0, 0, 0.5, 0.62, 0.14, "#5a4a42"); b.box(0, 0.5, 0, 0.26, 0.14, 0.12, "#6b5a52"); b.pop(); });
    b.box(0, 0.25, ST[0].z + 0.28, 0.22, 0.24, 1.0, "#2a2b33"); b.box(0, 0.4, ST[0].z + 0.55, 0.06, 0.2, 0.06, "#555a64");             // كونسول + ناقل الحركة
    ST.slice(0, 2).forEach((q) => { const z0 = q.z + 0.28; b.push(q.x * 1.45, y1 - 0.25, z0 - 0.4, 0, q.x > 0 ? -0.75 : 0.75); b.box(0, 0, 0, 0.03, 0.55, 0.03, "#25262d"); b.pop(); }); // أحزمة
    [-1, 1].forEach((s2) => { b.box(s2 * (hw - 0.13), 0.55, cz, 0.05, 0.4, cl - 0.3, "#3a3b44"); b.box(s2 * (hw - 0.12), 0.78, cz, 0.04, 0.05, cl - 0.5, "#8a8c96"); }); // لوح الأبواب
    ST.forEach((q) => b.box(q.x, 0.24, q.z + 0.1, 0.5, 0.02, 0.7, "#2f3a52"));                                                               // سجاد الأرضية
    b.box(0, y1 - 0.22, cf - 0.2, 0.38, 0.22, 0.04, "#0d1b2a"); b.box(0, y1 - 0.22, cf - 0.22, 0.34, 0.18, 0.02, "#2fd3ff", 0.5); [-0.6, 0.62].forEach((x) => b.box(x, y1 - 0.2, cf - 0.19, 0.18, 0.05, 0.03, "#16171c")); // شاشة وفتحات تكييف
    b.box(0, Math.max(P.roof, y1 + 0.78) - 0.35 + (P.open ? 0.0 : 0), cf - 0.65, 0.3, 0.1, 0.04, "#16171c");
    if (!P.open) { b.box(0, Math.max(P.roof, y1 + 0.78) - 0.12, cz, 0.3, 0.03, 0.2, "#fff6d0", 0.6); }                                          // نور السقف
    b.push(0.42, y1 - 0.14, cf - 0.5, 0, -1.1); for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; b.box(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13, 0.035, 0.025, 0.035, "#1c1c22"); } b.box(0, 0, 0, 0.06, 0.03, 0.06, "#555a64"); b.pop();
    b.box(0.42, y1 - 0.18, cf - 0.3, 0.2, 0.07, 0.03, "#2fd3ff", 0.5);
    // أعمدة وسقف
    const roofY = P.open ? y1 + 0.62 : Math.max(P.roof, y1 + 0.78);
    [-1, 1].forEach((s) => {
      b.push(s * (hw - 0.07), y1, cf - 0.02, 0, -0.55); b.box(0, 0, 0, 0.09, (roofY - y1) / Math.cos(0.55), 0.09, body); b.pop();
      b.box(s * (hw - 0.07), y1, cb + 0.05, 0.09, roofY - y1, 0.09, body);
      if (!P.low) b.box(s * (hw - 0.04), y1, cz, 0.06, 0.05, cl, dark);
    });
    const rz0 = cb - 0.1, rz1 = cf - (roofY - y1) * 0.62;
    if (!P.open) { b.box(0, roofY - 0.04, (rz0 + rz1) / 2, W - 0.04, 0.09, rz1 - rz0 + 0.1, body); b.box(0, roofY - 0.04, (rz0 + rz1) / 2, W - 0.5, 0.1, rz1 - rz0 - 0.4, lt(body, 0.1)); b.box(0, roofY - 0.28, cf - 0.55, 0.45, 0.11, 0.05, dark); }
    else { [-1, 1].forEach((sd) => b.box(sd * (hw - 0.15), y1, cb + 0.15, 0.08, roofY - y1 + (P.boxy ? 0.25 : 0), 0.08, dark)); b.box(0, roofY + (P.boxy ? 0.25 : 0) - 0.04, cb + 0.15, W - 0.2, 0.08, 0.08, dark); if (P.boxy) b.box(0, roofY + 0.15, cf - 0.1, W - 0.1, 0.06, 0.06, dark); }
    // مرايا جانبية وكشافات وأضواء
    [-1, 1].forEach((s) => { b.box(s * (hw + 0.1), y1 + 0.05, cf - 0.2, 0.14, 0.14, 0.1, body); b.sphere(s * 0.66, y1 - 0.2, hl + 0.01, 0.17, 0.15, 0.08, "#fffbe0", 6, 1); b.box(s * 0.66, y1 - 0.3, -hl - 0.01, 0.3, 0.12, 0.05, "#ff2a2a", 0.9); });
    b.box(0, 0.22, hl + 0.04, W - 0.1, 0.22, 0.12, "#c0c4cc"); b.box(0, 0.22, -hl - 0.04, W - 0.1, 0.22, 0.12, "#c0c4cc"); b.box(0, 0.55, hl + 0.02, 0.8, 0.16, 0.04, "#2a2a30");
    if (P.low) { b.box(0, y1 + 0.1, -hl + 0.2, W - 0.1, 0.07, 0.5, dark); [-1, 1].forEach((s) => b.box(s * 0.75, y1 - 0.05, -hl + 0.25, 0.07, 0.3, 0.3, dark)); }
    if (P.round) [-1, 1].forEach((s) => { b.sphere(s * (hw - 0.02), 0.5, hl - 0.6, 0.22, 0.3, 0.6, body, 7); b.sphere(s * (hw - 0.02), 0.5, -hl + 0.6, 0.22, 0.3, 0.6, body, 7); });
    b.pop();
    // عجلات
    const wr = 0.38 + lift * 0.6;
    [[-1, hl - 0.95], [1, hl - 0.95], [-1, -hl + 0.95], [1, -hl + 0.95]].forEach(([s, z]) => { b.push(s * (hw - 0.02), wr, z, 0, 0, PI / 2); b.cyl(0, -0.19, 0, wr, wr, 0.38, "#1d1d22", 10); b.cyl(0, s > 0 ? -0.2 : 0.15, 0, wr * 0.55, wr * 0.55, 0.06, "#c0c4cc", 8); b.pop(); });
    return (cache[key] = b.build(R.gl));
  }
  V.mesh = carMesh;
  V.seats = (kind) => { // 0 سواق، 1 جنبه، 2.. ورا
    const D = V.CARS[kind], P = D.shape, cf = P.len / 2 - P.hood, cl0 = P.len0 - P.hood - P.trunk, zf = cf - (cl0 - 0.9), y = (P.lift || 0) + 0.28, out = [{ x: 0.42, y, z: zf }, { x: -0.42, y, z: zf }];
    D.rows.forEach((n, r) => (n === 3 ? [-0.6, 0, 0.6] : [0.42, -0.42]).forEach((x) => out.push({ x, y, z: zf - 0.68 * (r + 1) })));
    return out;
  };
  V.eye = (kind, role) => { const D = V.CARS[kind], P = D.shape, s = V.seats(kind)[role === "p" ? 1 : 0]; return { x: s.x, y: (P.lift || 0) + P.y1 + (P.low ? 0.3 : 0.42), z: s.z - 0.02 }; };
  V.seat = (kind, role) => { const s = V.seats(kind)[role === "p" ? 1 : 0]; return { x: s.x, y: s.y, z: s.z - 0.28 }; };

  /* ---------- حالة السيارات المملوكة ومواقفها ---------- */
  const G = () => OSW.game, W = () => OSW.world, ctx = () => W()._int;
  V.owned = () => { const db = OSW.ui && OSW.ui.db; return db && db.entries && db.me && G() ? G().state().cars || [] : []; };
  // السيارة المركونة بأي مكان ("free") بترجع لحالها لكراج البيت بعد 25 دقيقة
  V.RETURN_MS = 25 * 60000;
  V.atOf = (c) => { const a = c.at || "A"; return a === "free" && Date.now() - (c.ft || 0) > V.RETURN_MS ? "H" : a; };
  V.slot = (car) => {
    const at = V.atOf(car); if (at === "free") return { x: car.fx, z: car.fz, h: car.fh };
    const list = V.owned().filter((c) => V.atOf(c) === at), i = Math.max(0, list.findIndex((c) => c.id === car.id)), L = V.LOTS[at];
    const cap = L.cap || 1e9, row = Math.floor(i / cap), j = i % cap; return { x: L.x + j * (L.dx || 0) + row * (L.rowdx || 0), z: L.z + j * L.dz, h: L.h };
  };
  V.sendHome = () => { const me = V.me, n = V.owned().filter((c) => V.atOf(c) !== "H" && !(me && me.id === c.id)); n.reduce((p, c) => p.then(() => OSW.game.do("cpark", { id: c.id, at: "H" })).catch(() => {}), Promise.resolve()); return n.length; };
  // السيارات اللي على الجزيرة الثانية أو الطريق (برا القرية)
  V.away = () => { const bz = busyIds(); return V.owned().filter((car) => { if (bz.has(car.id)) return false; const a = V.atOf(car); return a === "B" || (a === "free" && !(car.fx >= V.VIL.x0 && car.fx <= V.VIL.x1 && car.fz >= V.VIL.z0 && car.fz <= V.VIL.z1)); }); };
  // زر الاستدعاء: بيرجّع كل سيارات الجزيرة الثانية للجزيرة الأولى (أقرب موقف إلك: معرض السيارات أو كراج البيت)
  V.summon = async () => {
    const away = V.away(); if (!away.length) return 0;
    const me = ctx().me, dA = hy(me.x - V.LOTS.A.cx, me.z - V.LOTS.A.cz), dH = hy(me.x - V.LOTS.H.cx, me.z - V.LOTS.H.cz), inA = V.owned().filter((c) => V.atOf(c) === "A").length;
    const at = dA < dH && inA + away.length <= 4 ? "A" : "H";
    for (const car of away) { try { await OSW.game.do("cpark", { id: car.id, at }); } catch (e) { /* كمّل على الباقي */ } }
    V.summonedTo = at; return away.length;
  };
  const busyIds = () => { const c = ctx(), s = new Set(); if (V.me) s.add(V.me.id); if (c.pa.veh && c.pa.veh.id) s.add(c.pa.veh.id); return s; };

  /* ---------- الدخول والنزول ---------- */
  const appr = (car, s) => { const L = V.LOTS[V.atOf(car)]; return L && L.approach ? [L.approach.x, L.approach.z] : [s.x + Math.cos(s.h) * 2.8, s.z - Math.sin(s.h) * 2.8]; };
  V.tap = (id) => {
    const car = V.owned().find((c) => c.id === id), c = ctx(), me = c.me; if (!car || V.me) return;
    const pa = c.pa, hand = OSW.game.animalCarry(OSW.ui.db.uid), crates = OSW.game.carryOf(OSW.ui.db.uid);
    if (crates.length && !hand.length && !(pa.veh && pa.veh.id === id) && OSW.logi) {
      const s1 = V.slot(car); if (hy(me.x - s1.x, me.z - s1.z) > 6) return W().goTo(...appr(car, s1), "car:" + id);
      if (OSW.logi.room(car) > 0) { OSW.game.do("cload", { id }); OSW.audio && OSW.audio.sfx("pop"); return OSW.ui.toast("📦 حطّيت الكراتين بـ" + V.CARS[car.car].n + "! (" + Math.min(crates.length, OSW.logi.room(car)) + ")", "", 2200); }
      return OSW.ui.toast("🚫 السيارة ممتلئة بالكراتين!");
    }
    if (hand.length && !(pa.veh && pa.veh.id === id)) {
      const s0 = V.slot(car); if (hy(me.x - s0.x, me.z - s0.z) > 6) return W().goTo(...appr(car, s0), "car:" + id);
      const room = V.CARS[car.car].cargo - (car.cargo || []).length;
      if (room > 0) { OSW.game.do("aload", { id }); OSW.audio && OSW.audio.sfx("pop"); return OSW.ui.toast("🧳 حمّلتوا الحيوانات بـ" + (V.CARS[car.car].shape.bed ? "صندوق البكم" : "الطبون") + "! (" + Math.min(hand.length, room) + ")"); }
      OSW.ui.toast("📦 السيارة ممتلية!");
    }
    if (pa.veh && pa.veh.role === "d" && pa.veh.id === id) { if (hy(me.x - pa.x, me.z - pa.z) > 12) return OSW.ui.toast("🚗 قرّب من السيارة أول"); return V.board(car, "p"); }
    const s = V.slot(car); if (hy(me.x - s.x, me.z - s.z) > 5.5) return W().goTo(...appr(car, s), "car:" + id);
    V.board(car, "d");
  };
  V.board = (car, role) => {
    const c = ctx(), me = c.me, s = V.slot(car), pa = c.pa;
    if (role === "d") { me.x = s.x; me.z = s.z; me.ry = s.h; V.me = { id: car.id, car: car.car, color: car.color, role: "d", h: s.h, v: 0, view: "in", name: V.CARS[car.car].n }; }
    else { me.x = pa.x; me.z = pa.z; me.ry = pa.ry; V.me = { id: car.id, car: car.car, color: car.color, role: "p", h: pa.ry, v: 0, view: "in", name: V.CARS[car.car].n }; }
    me.veh = { id: car.id, car: car.car, color: car.color, role }; me.vx = me.vz = 0; me.target = null; me.act = null;
    c.cancelAuto(); OSW.audio && OSW.audio.sfx("door"); hud(true); OSW.game.sync3d(); if (OSW.audio && !OSW.audio.enabled) OSW.ui.toast("🔊 فعّل الصوت 🔇 فوق عشان تسمع الأولاد بالسيارة"); c.cam.follow = false; c.setInput(true);
  };
  V.exit = (force) => {
    const m = V.me; if (!m) return; const c = ctx(), me = c.me, car = V.owned().find((x) => x.id === m.id);
    if (m.role === "p") return leave(me, m, null);
    if (Math.abs(m.v) > 1.5 && !force) return OSW.ui.toast("🛑 وقّف السيارة أول");
    const near = Object.keys(V.LOTS).map((k) => ({ k, d: hy(me.x - V.LOTS[k].cx, me.z - V.LOTS[k].cz) - ((V.LOTS[k].rad || 28) - 28) })).sort((a, b) => a.d - b.d)[0];
    if (near.d > 28) { // ركنة حرّة بأي مكان
      if (car) OSW.game.do("cpark", { id: car.id, at: "free", x: me.x, z: me.z, h: m.h });
      OSW.ui.toast("🅿️ ركنتوا السيارة هون. بترجع لحالها لكراج البيت بعد 25 دقيقة، أو ارجعوها من «العيلة ← 🏠 كراج البيت»", "", 4200);
      return leave(me, m, null);
    }
    if (car) { if (V.atOf(car) !== near.k) OSW.game.do("cpark", { id: car.id, at: near.k }); }
    leave(me, m, near.k); if (OSW.logi && OSW.logi.onPark) OSW.logi.onPark(near.k, car);
  };
  function leave(me, m, lot) {
    const h = m.h; me.veh = null; V.me = null; me.vx = me.vz = 0;
    me.x += Math.cos(h) * 2.4; me.z -= Math.sin(h) * 2.4; // نزول من جهة السواق
    if (lot) { const L = V.LOTS[lot]; if (L.out) { me.x = L.out.x; me.z = L.out.z; } else { me.x = L.cx + (lot === "A" || lot === "H" ? -4.5 : 4.5); me.z = L.cz + 2; } }
    ctx().collide(me, 0.45); ctx().cam.fp = false; ctx().cam.follow = true; ctx().cam.dist = 20; ctx().cam.pitch = 0.5; ctx().cam.yaw = 0; hud(false); OSW.audio && OSW.audio.sfx("door"); OSW.game.sync3d();
  }

  /* ---------- الفيزياء ---------- */
  const t0 = () => performance.now();
  V.step = (dt, ix, iy) => {
    const m = V.me, c = ctx(), me = c.me, pa = c.pa; if (!m) return;
    if (m.role === "p") {
      if (!(pa.veh && pa.veh.role === "d" && pa.veh.id === m.id)) { if (!m.waitLoss) m.waitLoss = 0; m.waitLoss += dt; if (m.waitLoss > 1.5) V.exit(true); return; } m.waitLoss = 0;
      me.x = pa.x; me.z = pa.z; me.ry = pa.ry; m.h = pa.ry; m.v = pa.vel || 0; return;
    }
    const D = V.CARS[m.car], thr = clamp(-iy, -1, 1), st = clamp(ix, -1, 1);
    let v = m.v;
    if (thr > 0.08) v += (v < -0.5 ? D.brake : D.acc) * thr * dt; else if (thr < -0.08) v -= (v > 0.5 ? D.brake : D.acc * 0.55) * -thr * dt; else v -= Math.sign(v) * Math.min(Math.abs(v), 3.2 * dt);
    v -= v * Math.abs(v) * 0.0016 * dt * (D.acc);                  // مقاومة الهواء
    v = clamp(v, -D.vmax * 0.28, D.vmax);
    m.steer = (m.steer || 0) + (st - (m.steer || 0)) * Math.min(1, dt * 7);
    m.h -= m.steer * D.hand * clamp(v / 2.6, -1, 1) / (1 + Math.abs(v) / D.vmax * 0.8) * dt * 1.75;
    const ox = me.x, oz = me.z;
    me.x += Math.sin(m.h) * v * dt; me.z += Math.cos(m.h) * v * dt;
    for (const k of c.S.colliders) { const dx = me.x - k.x, dz = me.z - k.z, rr = k.r + (k.r < 1.2 ? 0.95 : 1.25); if (dx * dx + dz * dz < rr * rr) { const d = hy(dx, dz) || 0.001; me.x = k.x + (dx / d) * rr; me.z = k.z + (dz / d) * rr; if (Math.abs(v) > 6 && !(m.pt > t0())) { OSW.audio && OSW.audio.sfx("pop"); m.pt = t0() + 600; } v *= 0.82; } }
    if (!V.carOk(me.x, me.z)) { me.x = ox; me.z = oz; v *= -0.25; }
    m.v = v; me.ry = m.h; me.vx = Math.sin(m.h) * v; me.vz = Math.cos(m.h) * v; me.mv = 0; m.dist = (m.dist || 0) + Math.abs(v) * dt;
    me.vel = v; if (V.hudEl) { V.spd.textContent = Math.round(Math.abs(v) * 3.6); }
  };
  // الكاميرا: قمرة السائق (من جوا) أو خارجية خلف السيارة
  V.camStep = (cam, dt) => {
    const m = V.me; if (!m) return; const c = ctx(), me = c.me, D = V.CARS[m.car];
    if (m.view === "in") {
      const e = V.eye(m.car, m.role), s = Math.sin(m.h), co = Math.cos(m.h);
      cam.fp = true; cam.tx = me.x + e.x * co + e.z * s; cam.tz = me.z - e.x * s + e.z * co; cam.ty = e.y;
      cam.dist = 0.02; cam.pitch = (cam.pitch + ((m.lookP || 0.1) - cam.pitch) * Math.min(1, dt * 8)); cam.yaw = cam.yaw + angDiff(cam.yaw, m.h + PI + (m.look || 0)) * Math.min(1, dt * 12);
    } else {
      cam.fp = false; const k = 1 - Math.exp(-dt * 6); cam.tx += (me.x - cam.tx) * k; cam.tz += (me.z - cam.tz) * k; cam.ty += (1.0 - cam.ty) * k;
      cam.dist += (8.5 + Math.abs(m.v) * 0.12 - cam.dist) * k; cam.pitch += (0.3 - cam.pitch) * k; cam.yaw += angDiff(cam.yaw, m.h + PI) * Math.min(1, dt * 3.2);
    }
  };
  V.lookDrag = (dx, dy) => { const m = V.me; if (!m || m.view !== "in") return false; m.look = clamp((m.look || 0) - dx * 0.0062, -PI * 1.05, PI * 1.05); m.lookP = clamp((m.lookP == null ? 0.1 : m.lookP) + dy * 0.003, -0.5, 0.7); return true; };
  V.fov = (base) => (V.me ? base + clamp(Math.abs(V.me.v) / 60, 0, 0.18) + (V.me.view === "in" ? 0.18 : 0) : base);

  /* ---------- الرسم ---------- */
  V.drawAll = (t, withPeople) => {
    const c = ctx(), pa = c.pa, me = c.me, busy = busyIds();
    const bed = (carObj, x, z, h) => { if (OSW.logi) OSW.logi.drawCar(carObj, x, z, h); const ks = (carObj.cargo || []).slice(0, 12); if (!ks.length || carObj.car !== "pickup") return; const s = Math.sin(h), co = Math.cos(h); ks.forEach((an, i) => { const ox2 = i % 2 ? 0.42 : -0.42, oz2 = -0.95 - Math.floor(i / 2) * 0.62, sc = an.kind === "chicken" ? 0.62 : 0.5; M.trs(x + ox2 * co + oz2 * s, 0.45, z - ox2 * s + oz2 * co, h, 0, 0, sc, sc, sc, V._m2); R.draw(c.meshes[an.kind], V._m2); }); };
    V.owned().forEach((car) => { if (busy.has(car.id)) return; const s = V.slot(car); M.trs(s.x, 0, s.z, s.h, 0, 0, 1, 1, 1, V._m1); R.draw(carMesh(car.car, car.color), V._m1); bed(car, s.x, s.z, s.h); });
    const act = [];
    if (V.me && V.me.role === "d") act.push({ car: V.me.car, color: V.me.color, x: me.x, z: me.z, h: V.me.h, v: V.me.v, st: V.me.steer || 0, drv: "me", pas: pa.veh && pa.veh.id === V.me.id && pa.veh.role === "p" ? "pa" : null });
    else if (V.me && V.me.role === "p" && pa.veh) act.push({ car: pa.veh.car, color: pa.veh.color, x: pa.x, z: pa.z, h: pa.ry, v: 0, st: 0, drv: "pa", pas: "me" });
    else if (pa.veh && pa.veh.role === "d" && pa.vis) act.push({ car: pa.veh.car, color: pa.veh.color, x: pa.x, z: pa.z, h: pa.ry, v: 0, st: 0, drv: "pa", pas: null });
    act.forEach((a) => {
      M.trs(a.x, 0, a.z, a.h, 0, 0, 1, 1, 1, V._m1); R.draw(carMesh(a.car, a.color), V._m1);
      [["drv", "d"], ["pas", "p"]].forEach(([k, role]) => {
        const who = a[k]; if (!who) return; if (who === "me" && V.me && V.me.view === "in" && !withPeople) return; if (who === "me" && V.me && V.me.view === "in") return;
        const o = who === "me" ? me : pa, S = V.seat(a.car, role), s = Math.sin(a.h), co = Math.cos(a.h);
        if (!o.ch) return; OSW.drawChar(o.ch, a.x + S.x * co + S.z * s, a.z - S.x * s + S.z * co, a.h, 0, 0, t, 1, null, 0.74, S.y - 0.1);
      });
      if (OSW.fam) OSW.fam.drawRiders(a, t);
      { const co2 = V.owned().find((x) => x.id === (a.drv === "me" && V.me ? V.me.id : pa.veh && pa.veh.id)); if (co2) bed(co2, a.x, a.z, a.h); }
    });
  };
  // سيارة أهل القرية (بتستخدمها life.js)
  V.drawNpcCar = (kind, color, x, z, h, t, ch) => {
    M.trs(x, 0, z, h, 0, 0, 1, 1, 1, V._m1); R.draw(carMesh(kind, color), V._m1);
    if (ch) { const S = V.seat(kind, "d"), s = Math.sin(h), co = Math.cos(h); OSW.drawChar(ch, x + S.x * co + S.z * s, z - S.x * s + S.z * co, h, 0, 0, t, 1, null, 0.74, S.y - 0.1); }
  };
  V.drawing = () => !!(V.me || (ctx().pa.veh && ctx().pa.vis));
  V._m1 = new Float32Array(16); V._m2 = new Float32Array(16);

  /* ---------- شاشة السواقة ---------- */
  function hud(on) {
    let h = document.getElementById("carHud");
    if (!h) {
      h = document.createElement("div"); h.id = "carHud"; h.hidden = true;
      h.innerHTML = `<div class="ch-speed"><b id="chSpd">0</b><small>كم/س</small></div><div class="ch-name" id="chName"></div><div class="ch-bubble" id="carBubble"></div><div class="ch-wheel" id="chWheel"><div class="ch-wheel-in" id="chWheelIn"><i class="w-sp a"></i><i class="w-sp b"></i><i class="w-sp c"></i><i class="w-hub"></i><i class="w-mark"></i></div></div><div class="ch-pedals"><button id="chBrake" aria-label="فرامل">🛑<small>فرامل</small></button><button id="chGas" aria-label="بنزين">⛽<small>بنزين</small></button></div><div class="ch-btns"><button data-ch="back" aria-label="شوف الأولاد">🔙 الأولاد</button><button data-ch="kids" aria-label="الأولاد بالسيارة">🧒</button><button data-ch="horn" aria-label="بوق">📯</button><button data-ch="radio" aria-label="راديو">📻</button><button data-ch="view" aria-label="تغيير المنظر">👁️</button><button data-ch="exit" aria-label="نزول">🚪 انزل</button></div>`;
      document.body.appendChild(h); V.hudEl = h; V.spd = h.querySelector("#chSpd");
      // المقود: اسحبوه بإصبعكم ودوّروه، وبيرجع لحاله. والدواسات: بنزين وفرامل (ورجوع)
      const wh = h.querySelector("#chWheel"), wi = h.querySelector("#chWheelIn"); let ang = 0, drag = false, a0 = 0, base = 0, pid = null, raf = 0;
      const setAng = (a) => { ang = clamp(a, -120, 120); wi.style.transform = "rotate(" + ang + "deg)"; V.input.x = clamp(ang / 100, -1, 1); };
      V.resetWheel = () => { drag = false; cancelAnimationFrame(raf); setAng(0); V.input.gas = V.input.brake = 0; V.input.y = 0; };
      const pt = (e) => { const r = wh.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / PI; };
      wh.addEventListener("pointerdown", (e) => { pid = e.pointerId; try { wh.setPointerCapture(pid); } catch (er) { /* */ } drag = true; a0 = pt(e); base = ang; cancelAnimationFrame(raf); e.preventDefault(); });
      wh.addEventListener("pointermove", (e) => { if (!drag || e.pointerId !== pid) return; let d = pt(e) - a0; while (d > 180) d -= 360; while (d < -180) d += 360; setAng(base + d); });
      const rel = (e) => { if (e.pointerId !== pid) return; drag = false; pid = null; let tp = performance.now(); const back = () => { if (drag) return; const n = performance.now(), dt = Math.min(0.5, (n - tp) / 1000); tp = n; ang *= Math.pow(0.0005, dt); if (Math.abs(ang) < 1) ang = 0; setAng(ang); if (ang) raf = requestAnimationFrame(back); }; raf = requestAnimationFrame(back); };
      wh.addEventListener("pointerup", rel); wh.addEventListener("pointercancel", rel);
      const pedal = (id, key) => { const b = h.querySelector(id), set = (v) => (e) => { V.input[key] = v; V.input.y = V.input.brake - V.input.gas; if (e && e.preventDefault) e.preventDefault(); }; b.addEventListener("pointerdown", (e) => { try { b.setPointerCapture(e.pointerId); } catch (er) { /* */ } set(1)(e); b.classList.add("on"); }); ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => b.addEventListener(ev, (e) => { set(0)(e); b.classList.remove("on"); })); };
      pedal("#chGas", "gas"); pedal("#chBrake", "brake");
      h.addEventListener("click", (e) => { const b = e.target.closest("[data-ch]"); if (!b) return; if (b.dataset.ch === "back" && V.me) { V.me.view = "in"; V.me.look = Math.abs(V.me.look || 0) > 1.5 ? 0 : PI; V.me.lookP = V.me.look ? 0.35 : 0.1; OSW.audio && OSW.audio.sfx("pop"); } else if (b.dataset.ch === "horn") { OSW.audio && OSW.audio.sfx("horn"); } else if (b.dataset.ch === "radio") { const on = OSW.audio && OSW.audio.radio(); OSW.ui.toast(on ? "📻 الراديو شغّال" : "📻 طفّيت الراديو"); } else if (b.dataset.ch === "kids") { OSW.places.open("riders"); } else if (b.dataset.ch === "view" && V.me) { V.me.view = V.me.view === "in" ? "out" : "in"; OSW.audio && OSW.audio.sfx("pop"); } else V.exit(); });
    }
    document.documentElement.classList.toggle("driving", on); h.hidden = !on; if (on) h.querySelector("#chName").textContent = (V.CARS[V.me.car].e) + " " + V.CARS[V.me.car].n + (V.me.role === "p" ? " (راكب)" : "") + (() => { const c2 = V.owned().find((x) => x.id === V.me.id); return c2 && c2.cargo && c2.cargo.length ? " · 🐾 " + c2.cargo.length : ""; })();
    if (!on && V.resetWheel) V.resetWheel(); h.classList.toggle("passenger", !!(V.me && V.me.role === "p"));
    ["btnSprint", "zoomctl", "guide", "joy"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.visibility = on ? "hidden" : ""; });
  }
  V.hud = hud;
  // وصف مختصر للشريك بالرسائل
  V.pack = () => (V.me ? { id: V.me.id, car: V.me.car, color: V.me.color, role: V.me.role } : null);
})();
