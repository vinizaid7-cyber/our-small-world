/* السيارات: كتالوج، مجسمات بكابينة مفتوحة، سواقة من جوا السيارة (راكبين اثنين)، وكاميرا قمرة/خارجية */
(function () {
  const OSW = window.OSW, PI = Math.PI, hy = Math.hypot, Builder = OSW.Builder, M = OSW.M, R = OSW.R, dk = OSW.col.dk, lt = OSW.col.lt;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; };
  const V = (OSW.veh = { me: null });

  /* ---------- الجغرافيا: الجزيرتين والطريق ---------- */
  V.ISLE = { x: 0, z: 1180, r: 92 };            // الجزيرة الثانية
  V.ROAD = { x: 0, z0: 72, z1: 1092, w: 10 };   // الطريق الطويل (بين الجزيرتين)
  V.VIL = { x0: -112, x1: 112, z0: -62, z1: 98 };
  V.LOTS = { A: { x: 11, z: 72, dz: 4.2, h: -PI / 2, cx: 11, cz: 82 }, B: { x: -8, z: 1102, dz: 4.2, h: PI / 2, cx: -8, cz: 1112 } };
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
    sport: { n: "سبورت", e: "🏎️", price: 950, vmax: 42, acc: 15, hand: 1.25, brake: 24, cargo: 2, shape: { len: 4.3, hood: 1.5, trunk: 0.9, roof: 1.22, y1: 0.78, low: 1, open: 1 }, note: "الأسرع على الطريق · طبون صغير (2 حيوان)" },
  };
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
    [0.42, -0.42].forEach((sx) => { b.box(sx, 0.3, cb + 0.9, 0.56, 0.22, 0.6, "#5a4a42"); b.push(sx, 0.55, cb + 0.5, 0, -0.18); b.box(0, 0, 0, 0.56, 0.62, 0.14, "#5a4a42"); b.box(0, 0.5, 0, 0.3, 0.14, 0.12, "#6b5a52"); b.pop(); });
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
  V.eye = (kind, role) => { const D = V.CARS[kind], P = D.shape, cf = P.len / 2 - P.hood, cb = -P.len / 2 + P.trunk; return { x: role === "p" ? -0.42 : 0.42, y: (P.lift || 0) + P.y1 + (P.low ? 0.3 : 0.42), z: cb + (cf - cb) * 0.4 }; };
  V.seat = (kind, role) => { const D = V.CARS[kind], P = D.shape; return { x: role === "p" ? -0.42 : 0.42, y: (P.lift || 0) + 0.28, z: -P.len / 2 + P.trunk + 0.62 }; };

  /* ---------- حالة السيارات المملوكة ومواقفها ---------- */
  const G = () => OSW.game, W = () => OSW.world, ctx = () => W()._int;
  V.owned = () => { const db = OSW.ui && OSW.ui.db; return db && db.entries && db.me && G() ? G().state().cars || [] : []; };
  V.slot = (car) => {
    const list = V.owned().filter((c) => (c.at || "A") === (car.at || "A")), i = Math.max(0, list.findIndex((c) => c.id === car.id)), L = V.LOTS[car.at || "A"];
    return { x: L.x, z: L.z + i * L.dz, h: L.h };
  };
  const busyIds = () => { const c = ctx(), s = new Set(); if (V.me) s.add(V.me.id); if (c.pa.veh && c.pa.veh.id) s.add(c.pa.veh.id); return s; };

  /* ---------- الدخول والنزول ---------- */
  V.tap = (id) => {
    const car = V.owned().find((c) => c.id === id), c = ctx(), me = c.me; if (!car || V.me) return;
    const pa = c.pa, hand = OSW.game.animalCarry(OSW.ui.db.uid);
    if (hand.length && !(pa.veh && pa.veh.id === id)) {
      const s0 = V.slot(car); if (hy(me.x - s0.x, me.z - s0.z) > 6) return W().goTo(s0.x + Math.cos(s0.h) * 2.8, s0.z - Math.sin(s0.h) * 2.8, "car:" + id);
      const room = V.CARS[car.car].cargo - (car.cargo || []).length;
      if (room > 0) { OSW.game.do("aload", { id }); OSW.audio && OSW.audio.sfx("pop"); return OSW.ui.toast("🧳 حمّلتوا الحيوانات بـ" + (V.CARS[car.car].shape.bed ? "صندوق البكم" : "الطبون") + "! (" + Math.min(hand.length, room) + ")"); }
      OSW.ui.toast("📦 السيارة ممتلية!");
    }
    if (pa.veh && pa.veh.role === "d" && pa.veh.id === id) { if (hy(me.x - pa.x, me.z - pa.z) > 12) return OSW.ui.toast("🚗 قرّب من السيارة أول"); return V.board(car, "p"); }
    const s = V.slot(car); if (hy(me.x - s.x, me.z - s.z) > 5.5) return W().goTo(s.x + Math.cos(s.h) * 2.8, s.z - Math.sin(s.h) * 2.8, "car:" + id);
    V.board(car, "d");
  };
  V.board = (car, role) => {
    const c = ctx(), me = c.me, s = V.slot(car), pa = c.pa;
    if (role === "d") { me.x = s.x; me.z = s.z; me.ry = s.h; V.me = { id: car.id, car: car.car, color: car.color, role: "d", h: s.h, v: 0, view: "in", name: V.CARS[car.car].n }; }
    else { me.x = pa.x; me.z = pa.z; me.ry = pa.ry; V.me = { id: car.id, car: car.car, color: car.color, role: "p", h: pa.ry, v: 0, view: "in", name: V.CARS[car.car].n }; }
    me.veh = { id: car.id, car: car.car, color: car.color, role }; me.vx = me.vz = 0; me.target = null; me.act = null;
    c.cancelAuto(); OSW.audio && OSW.audio.sfx("door"); hud(true); c.cam.follow = false; c.setInput(true);
  };
  V.exit = (force) => {
    const m = V.me; if (!m) return; const c = ctx(), me = c.me, car = V.owned().find((x) => x.id === m.id);
    if (m.role === "p") return leave(me, m, null);
    if (Math.abs(m.v) > 1.5 && !force) return OSW.ui.toast("🛑 وقّف السيارة أول");
    const near = ["A", "B"].map((k) => ({ k, d: hy(me.x - V.LOTS[k].cx, me.z - V.LOTS[k].cz) })).sort((a, b) => a.d - b.d)[0];
    if (near.d > 26 && !force) return OSW.ui.toast("🅿️ نزّلوا جنب الموقف (عند المعرض أو عند محلات الجزيرة)");
    if (car) { if ((car.at || "A") !== near.k) OSW.game.do("cpark", { id: car.id, at: near.k }); }
    leave(me, m, near.k);
  };
  function leave(me, m, lot) {
    const h = m.h; me.veh = null; V.me = null; me.vx = me.vz = 0;
    me.x += Math.cos(h) * 2.4; me.z -= Math.sin(h) * 2.4; // نزول من جهة السواق
    if (lot) { const L = V.LOTS[lot]; me.x = L.cx + (lot === "A" ? -4.5 : 4.5); me.z = L.cz + 2; }
    ctx().collide(me, 0.45); ctx().cam.fp = false; ctx().cam.follow = true; ctx().cam.dist = 20; ctx().cam.pitch = 0.5; ctx().cam.yaw = 0; hud(false); OSW.audio && OSW.audio.sfx("door"); OSW.game.sync3d();
  }

  /* ---------- الفيزياء ---------- */
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
    m.h -= m.steer * D.hand * clamp(v / 4.5, -1, 1) / (1 + Math.abs(v) / D.vmax * 0.9) * dt * 1.6;
    const ox = me.x, oz = me.z;
    me.x += Math.sin(m.h) * v * dt; me.z += Math.cos(m.h) * v * dt;
    for (const k of c.S.colliders) { const dx = me.x - k.x, dz = me.z - k.z, rr = k.r + 1.25; if (dx * dx + dz * dz < rr * rr) { const d = hy(dx, dz) || 0.001; me.x = k.x + (dx / d) * rr; me.z = k.z + (dz / d) * rr; if (Math.abs(v) > 4) OSW.audio && OSW.audio.sfx("pop"); v *= 0.55; } }
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
      cam.dist = 0.02; cam.pitch = 0.1; cam.yaw = cam.yaw + angDiff(cam.yaw, m.h + PI) * Math.min(1, dt * 14);
    } else {
      cam.fp = false; const k = 1 - Math.exp(-dt * 6); cam.tx += (me.x - cam.tx) * k; cam.tz += (me.z - cam.tz) * k; cam.ty += (1.0 - cam.ty) * k;
      cam.dist += (8.5 + Math.abs(m.v) * 0.12 - cam.dist) * k; cam.pitch += (0.3 - cam.pitch) * k; cam.yaw += angDiff(cam.yaw, m.h + PI) * Math.min(1, dt * 3.2);
    }
  };
  V.fov = (base) => (V.me ? base + clamp(Math.abs(V.me.v) / 60, 0, 0.18) + (V.me.view === "in" ? 0.18 : 0) : base);

  /* ---------- الرسم ---------- */
  V.drawAll = (t, withPeople) => {
    const c = ctx(), pa = c.pa, me = c.me, busy = busyIds();
    const bed = (carObj, x, z, h) => { const ks = (carObj.cargo || []).slice(0, 12); if (!ks.length || carObj.car !== "pickup") return; const s = Math.sin(h), co = Math.cos(h); ks.forEach((an, i) => { const ox2 = i % 2 ? 0.42 : -0.42, oz2 = -0.95 - Math.floor(i / 2) * 0.62, sc = an.kind === "chicken" ? 0.62 : 0.5; M.trs(x + ox2 * co + oz2 * s, 0.45, z - ox2 * s + oz2 * co, h, 0, 0, sc, sc, sc, V._m2); R.draw(c.meshes[an.kind], V._m2); }); };
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
      { const co2 = V.owned().find((x) => x.id === (a.drv === "me" && V.me ? V.me.id : pa.veh && pa.veh.id)); if (co2) bed(co2, a.x, a.z, a.h); }
    });
  };
  V.drawing = () => !!(V.me || (ctx().pa.veh && ctx().pa.vis));
  V._m1 = new Float32Array(16); V._m2 = new Float32Array(16);

  /* ---------- شاشة السواقة ---------- */
  function hud(on) {
    let h = document.getElementById("carHud");
    if (!h) {
      h = document.createElement("div"); h.id = "carHud"; h.hidden = true;
      h.innerHTML = `<div class="ch-speed"><b id="chSpd">0</b><small>كم/س</small></div><div class="ch-name" id="chName"></div><div class="ch-btns"><button data-ch="view" aria-label="تغيير المنظر">👁️</button><button data-ch="exit" aria-label="نزول">🚪 انزل</button></div>`;
      document.body.appendChild(h); V.hudEl = h; V.spd = h.querySelector("#chSpd");
      h.addEventListener("click", (e) => { const b = e.target.closest("[data-ch]"); if (!b) return; if (b.dataset.ch === "view" && V.me) { V.me.view = V.me.view === "in" ? "out" : "in"; OSW.audio && OSW.audio.sfx("pop"); } else V.exit(); });
    }
    document.documentElement.classList.toggle("driving", on); h.hidden = !on; if (on) h.querySelector("#chName").textContent = (V.CARS[V.me.car].e) + " " + V.CARS[V.me.car].n + (V.me.role === "p" ? " (راكب)" : "") + (() => { const c2 = V.owned().find((x) => x.id === V.me.id); return c2 && c2.cargo && c2.cargo.length ? " · 🐾 " + c2.cargo.length : ""; })();
    ["btnSprint", "zoomctl", "guide"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.visibility = on ? "hidden" : ""; });
  }
  V.hud = hud;
  // وصف مختصر للشريك بالرسائل
  V.pack = () => (V.me ? { id: V.me.id, car: V.me.car, color: V.me.color, role: V.me.role } : null);
})();
