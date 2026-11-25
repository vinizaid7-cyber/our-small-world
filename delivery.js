/* ============================================================
   التوصيل واللوجستيات (الحساب 3): شحنات حقيقية، شركات توصيل، تتبّع، شاحنات مرئية بالعالم، تفريغ.
   كل شي أحداث (event sourcing) بجدول entries: ship_order / ship_cancel / ship_recv.
   حالة الشحنة والمكان بتنحسب من وقت الطلب (بدون عشوائية) فبتتطابق عند الشريك والخريطة والعالم.
   محمي بـ try/catch حتى ما يوقف اللعبة.
   ============================================================ */
(function () {
  const OSW = window.OSW; if (!OSW || !OSW.game) return;
  const D = (OSW.deliv = { ui: { }, tui: { open: null, map: {} }, _sent: {}, _last: {}, _anim: {} });
  const PI = Math.PI, hy = Math.hypot, sin = Math.sin, cos = Math.cos, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const G = () => OSW.game, V = () => OSW.veh, W = () => OSW.world, ui = () => OSW.ui, esc = (s) => (OSW.esc ? OSW.esc(String(s)) : String(s));
  const toast = (m, c, ms) => { try { ui().toast(m, c || "", ms); } catch (e) { /* */ } };
  const sfx = (n) => { try { OSW.audio && OSW.audio.sfx(n); } catch (e) { /* */ } };

  /* ---------------- ثوابت ---------------- */
  D.MAX_ACTIVE = 6;                // أقصى شحنات فعالة بنفس الوقت (حماية للأداء)
  D.DUP_MS = 4000;                 // نفس الطلب بنفس الثواني = مكرر
  D.CANCEL_FEE = 0.1;
  D.LATE_REFUND = 0.15;            // تعويض لو التأخير كبير
  D.TRUCK_SPEED = 11;              // وحدة/ثانية
  const UNLOAD_MS = 12000, ARRIVE_MS = 2500, PLACED_MS = 1500, PICK_MS = 4000;
  const HUB = { mid: [0, 420], isl: [0, 1085] }, PORT = [62, 1262];

  /* ---------------- شركات التوصيل ---------------- */
  D.PROV = {
    nasim: { n: "نسيم إكسبرس", e: "🚐", col: "#e63946", rate: 1.0, spd: 1.15, rel: 0.93, q: 4.5, maxLen: 5.2, svcs: ["standard", "express"], cov: "VI", fleet: "فانات وسيارات نقل خفيفة", d: "سريعة وموثوقة للسيارات الصغيرة" },
    jabal: { n: "الجبل للنقل الثقيل", e: "🚛", col: "#f4a261", rate: 1.3, spd: 0.9, rel: 0.9, q: 4, maxLen: 14, svcs: ["standard", "heavy", "bulk"], cov: "VI", fleet: "شاحنات مسطّحة ورافعات", d: "بتنقل الجرارات والشاحنات الكبيرة" },
    wahat: { n: "الواحة الاقتصادية", e: "🚚", col: "#2a9d8f", rate: 0.72, spd: 0.8, rel: 0.76, q: 3, maxLen: 9, svcs: ["standard", "heavy", "bulk"], cov: "V", fleet: "شاحنات قديمة", d: "الأرخص، بس أبطأ وتتأخر أكثر (القرية بس)" },
    barq: { n: "برق للشحن السريع", e: "⚡", col: "#7b2cbf", rate: 1.7, spd: 1.5, rel: 0.96, q: 5, maxLen: 5.2, svcs: ["express", "air"], cov: "VI", fleet: "سيارات سريعة وطيران", d: "الأسرع والأغلى" },
    bahr: { n: "بحر الشرق للشحن", e: "🚢", col: "#1d6fa5", rate: 0.9, spd: 0.95, rel: 0.85, q: 4, maxLen: 14, svcs: ["sea", "bulk", "heavy"], cov: "VI", fleet: "سفن حاويات وشاحنات", d: "شحن بحري للمستوردات والحمولات الكبيرة" },
    thalj: { n: "ثلج للشحن المبرّد", e: "❄️", col: "#48cae4", rate: 1.4, spd: 1.0, rel: 0.95, q: 4.5, maxLen: 8, svcs: ["cold"], cov: "VI", fleet: "شاحنات مبرّدة", d: "للأغذية والألبان فقط (مش للمركبات)" },
  };
  D.SVC = {
    standard: { n: "عادي", e: "📦", price: 1, time: 1, spd: 1, classes: ["veh"], perKm: 0.9 },
    express: { n: "سريع", e: "⚡", price: 1.9, time: 0.5, spd: 1.6, classes: ["veh"], perKm: 0.9 },
    heavy: { n: "معدات ثقيلة", e: "🏗️", price: 1.1, time: 1.15, spd: 0.85, classes: ["veh", "heavy"], perKm: 0.9 },
    bulk: { n: "شحن جماعي", e: "🧱", price: 0.65, time: 1.8, spd: 0.8, classes: ["veh", "heavy", "bulk"], perKm: 0.9 },
    cold: { n: "مبرّد", e: "❄️", price: 1.6, time: 1, spd: 1, classes: ["cold"], perKm: 0.9 },
    sea: { n: "شحن بحري", e: "🚢", price: 1, time: 1, spd: 0.9, classes: ["veh", "heavy", "bulk"], perKm: 0.12, sea: 1 },
    air: { n: "شحن جوي", e: "✈️", price: 1, time: 1, spd: 1.2, classes: ["veh"], perKm: 0.35, air: 1 },
  };
  D.SUPPLIERS = {
    dealer: { n: "معرض القرية", e: "🏬", disc: 0, hub: "mid", d: "مخزون محلي · بدون جمارك" },
    import: { n: "المستورد (وراء البحار)", e: "🌍", disc: 0.08, hub: "port", d: "خصم 8% بس شحن بحري/جوي طويل" },
  };
  D.STATUS = {
    placed: ["📝", "تم الطلب"], preparing: ["🏭", "تجهيز الشحنة"], awaiting_pickup: ["⏳", "بانتظار الاستلام"], picked_up: ["📦", "انستلمت من المورّد"],
    in_transit: ["🚚", "بالطريق"], at_port: ["⚓", "بالميناء/المحطة"], out_for_delivery: ["📍", "خرجت للتوصيل"], arrived: ["🏁", "وصلت"],
    unloading: ["👷", "جاري التفريغ"], delivered: ["✅", "انتسلمت"], delayed: ["⚠️", "متأخرة"], failed: ["❌", "فشل التوصيل"], cancelled: ["🚫", "ملغية"],
  };
  const DEST = () => {
    const out = [{ id: "H", n: "بيتنا", e: "🏠", reg: "V" }], L = (OSW.EX && OSW.EX.LANDS) || [], S = G().state();
    L.forEach((Ld, i) => { if (S.lands && S.lands[Ld.id]) out.push({ id: "L" + (i + 1), n: Ld.n, e: "🌾", reg: "V", land: Ld.id }); });
    out.push({ id: "B", n: "موقف الجزيرة", e: "🏝️", reg: "I" });
    return out;
  };
  D.dests = DEST;
  const destOk = (S, id) => id === "H" || id === "B" || (/^L[1-6]$/.test(id) && !!(S.lands && S.lands["l" + id.slice(1)]));

  /* ---------------- أنواع الحمولة (واجهة للحسابات الثانية) ---------------- */
  D.CARGO = {
    car: {
      cls: (it) => { const C = (V() && V().CARS[it.car]) || {}; return C.shape && (C.shape.type === "tractor" || C.cat === "truck" || C.cat === "tractor" || C.cat === "service" || C.shape.len > 6.2) ? "heavy" : "veh"; },
      len: (it) => (((V() && V().CARS[it.car]) || {}).shape || {}).len || 4.5,
      label: (it) => { const C = (V() && V().CARS[it.car]) || {}; return (C.e || "🚗") + " " + (C.n || it.car); },
      ok: (S, it) => !!(V() && V().CARS[it.car]),
      grant: (S, it, dest, o, H) => { S.cars.push({ id: o.id, car: it.car, color: it.color || "#e63946", at: dest, cargo: [], deliv: o.id }); H.mark(); },
    },
  };
  // الحسابات الثانية بتسجّل أنواع حمولة جديدة: OSW.deliv.registerCargo("tractor_kit", { cls, len, label, ok, grant })
  D.registerCargo = (kind, def) => { D.CARGO[kind] = def; };

  /* ---------------- أدوات ---------------- */
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rnd = (seed, i) => (hash(seed + ":" + i) % 100000) / 100000;
  const fmt = (ms) => { ms = Math.max(0, Math.round(ms / 1000)); const m = Math.floor(ms / 60), s = ms % 60; return m ? `${m} د ${s ? s + " ث" : ""}` : `${s} ث`; };
  D.fmt = fmt;
  const clsOf = (it) => ((D.CARGO[it.kind] || D.CARGO.car).cls(it));
  const lenOf = (it) => ((D.CARGO[it.kind] || D.CARGO.car).len(it));
  const regOf = (dest) => (dest === "B" ? "I" : "V");

  /* ---------------- الطرق (شبكة شوارع القرية + الطريق الطويل) ---------------- */
  const NODES = { gate: [0, 98], c73: [0, 73], c57: [0, 57], w57: [-74, 57], e57: [74, 57], w34: [-74, 34.5], e34: [74, 34.5], c34: [0, 34.5], c14: [0, 14] };
  const EDGES = [["gate", "c73"], ["c73", "c57"], ["c57", "w57"], ["c57", "e57"], ["w57", "w34"], ["e57", "e34"], ["w34", "c34"], ["c34", "e34"], ["c57", "c34"], ["c34", "c14"]];
  const bfs = (from, to) => {
    const prev = { [from]: null }, q = [from];
    while (q.length) { const c = q.shift(); if (c === to) break; EDGES.forEach(([a, b]) => { const n = a === c ? b : b === c ? a : null; if (n && !(n in prev)) { prev[n] = c; q.push(n); } }); }
    const path = []; for (let c = to; c; c = prev[c]) path.unshift(c); return path.map((k) => NODES[k]);
  };
  const lotOut = (k) => { const L = V() && V().LOTS[k]; if (!L) return null; return L.out || { x: L.cx + (k === "A" || k === "H" ? -4.5 : 4.5), z: L.cz + 2 }; };
  D.lotOut = lotOut;
  const lenPts = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += hy(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  const rcache = {};
  // مسار الشاحنة: [نقاط], gateS = المسافة لما تصير "خارجة للتوصيل"
  D.route = (sup, dest) => {
    const key = sup + ">" + dest; if (rcache[key]) return rcache[key];
    const out = lotOut(dest) || lotOut("H") || { x: 8.5, z: -28 };
    let pts = [], gateIdx = 0;
    if (sup === "import") pts.push(PORT.slice(), [20, 1190], [0, 1120]); else pts.push(HUB.mid.slice());
    if (dest === "B") { pts.push([0, 1088]); pts.push([out.x, out.z]); }
    else {
      if (sup === "import") pts.push([0, 1085]);
      pts.push([0, 98]); gateIdx = pts.length - 1;
      // أقرب عقدة شارع للموقع
      let best = "c57", bd = 1e9; Object.keys(NODES).forEach((k) => { if (k === "gate") return; const d = hy(NODES[k][0] - out.x, NODES[k][1] - out.z); if (d < bd) { bd = d; best = k; } });
      bfs("gate", best).slice(1).forEach((p) => pts.push(p.slice())); pts.push([out.x, out.z]);
    }
    // أدق: نحذف النقاط المكررة
    const clean = [pts[0]]; for (let i = 1; i < pts.length; i++) if (hy(pts[i][0] - clean[clean.length - 1][0], pts[i][1] - clean[clean.length - 1][1]) > 0.5) clean.push(pts[i]);
    const total = lenPts(clean); let gs = total - 120;
    if (dest !== "B") { const gp = clean.findIndex((p) => p[0] === 0 && p[1] === 98); gs = gp >= 0 ? lenPts(clean.slice(0, gp + 1)) : gs; }
    const last = clean[clean.length - 1], pr = clean[clean.length - 2] || last;
    return (rcache[key] = { pts: clean, len: total, gateS: clamp(gs, 0, total), park: { x: last[0], z: last[1], h: Math.atan2(last[0] - pr[0], last[1] - pr[1]) } });
  };
  const ptAt = (R, s) => {
    s = clamp(s, 0, R.len); const p = R.pts; let acc = 0;
    for (let i = 1; i < p.length; i++) {
      const L = hy(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (acc + L >= s || i === p.length - 1) { const f = L ? clamp((s - acc) / L, 0, 1) : 0; return { x: p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, z: p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f, h: Math.atan2(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) }; }
      acc += L;
    }
    return { x: p[0][0], z: p[0][1], h: 0 };
  };


  /* ---------- مسار العرض: تنعيم الزوايا + الابتعاد عن العوائق (الجداول الزمنية بتعتمد المسار الأساسي بس، فبتضل حتمية) ---------- */
  const chaikin = (pts, it) => { let p = pts; for (let k = 0; k < it; k++) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; };
  const densify = (p, step) => { const out = [p[0].slice()]; for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], L = hy(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step)); for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); } return out; };
  const buildVis = (R, useCols) => {
    let P = densify(chaikin(R.pts, 2), 2); const n = P.length;
    if (useCols) {
      const cols = OSW.S.colliders, cell = 10, grid = {}, key = (x, z) => Math.floor(x / cell) + "," + Math.floor(z / cell);
      cols.forEach((c) => { const k = key(c.x, c.z); (grid[k] = grid[k] || []).push(c); });
      const near = (x, z) => { const out = [], cx = Math.floor(x / cell), cz = Math.floor(z / cell); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const g = grid[(cx + i) + "," + (cz + j)]; if (g) for (const c of g) out.push(c); } return out; };
      const push = (fixTail) => { for (let i = 1; i < n - fixTail; i++) { for (let it = 0; it < 2; it++) near(P[i][0], P[i][1]).forEach((c) => { const dx = P[i][0] - c.x, dz = P[i][1] - c.z, rr = c.r + 1.55, d = hy(dx, dz); if (d < rr) { if (d < 0.001) { P[i][0] += rr; } else { P[i][0] = c.x + (dx / d) * rr; P[i][1] = c.z + (dz / d) * rr; } } }); } };
      for (let pass = 0; pass < 8; pass++) { push(3); for (let i = 1; i < n - 3; i++) { P[i] = [(P[i - 1][0] + P[i][0] * 2 + P[i + 1][0]) / 4, (P[i - 1][1] + P[i][1] * 2 + P[i + 1][1]) / 4]; } }
      push(3);
    }
    const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + hy(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    return { P, cum, len: cum[n - 1], cols: !!useCols };
  };
  D.visOf = (R) => { const ready = !!(OSW.S && OSW.S.colliders && OSW.S.colliders.length > 200); if (R._vis && (R._vis.cols || !ready)) return R._vis; return (R._vis = buildVis(R, ready)); };
  D.posOn = (R, s) => {
    const v = D.visOf(R), f = clamp(s / R.len, 0, 1), d = f * v.len; let lo = 0, hi = v.P.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (v.cum[m] <= d) lo = m; else hi = m; }
    const a = v.P[lo], b = v.P[hi], L = v.cum[hi] - v.cum[lo] || 1, t = clamp((d - v.cum[lo]) / L, 0, 1);
    const i0 = Math.max(0, lo - 2), i1 = Math.min(v.P.length - 1, hi + 2), h = Math.atan2(v.P[i1][0] - v.P[i0][0], v.P[i1][1] - v.P[i0][1]);
    return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, h };
  };
  D.park = (R) => { const v = D.visOf(R), n = v.P.length, e = v.P[n - 1], q = v.P[Math.max(0, n - 4)]; return { x: e[0], z: e[1], h: Math.atan2(e[0] - q[0], e[1] - q[1]) }; };

  /* ---------------- التسعير والتقدير ---------------- */
  D.kmOf = (sup, dest) => {
    const out = lotOut(dest) || { x: 0, z: 0 };
    if (sup === "import") return 1700 + (dest === "B" ? 0 : 90);
    if (dest === "B") return 90;
    return Math.round(4 + hy(out.x + 23, out.z - 86) * 0.06);
  };
  // أسباب عدم التوفر
  D.avail = (it, sup, dest, pk, svk) => {
    const P = D.PROV[pk], SV = D.SVC[svk], cls = clsOf(it);
    if (!P.svcs.includes(svk)) return "الشركة ما بتقدّم هالخدمة";
    if (!SV.classes.includes(cls)) return cls === "heavy" ? "الحمولة ثقيلة: بدها خدمة معدات ثقيلة" : "الخدمة مش مناسبة لهالحمولة";
    if (regOf(dest) === "I" && !P.cov.includes("I")) return "الشركة ما بتغطي الجزيرة";
    if (lenOf(it) > P.maxLen) return "الحمولة أطول من مركبات الشركة";
    if (sup === "import" && !(SV.sea || SV.air)) return "المستورد بيشحن بحري/جوي بس";
    if (sup === "dealer" && (SV.sea || SV.air)) return "الشحن البحري/الجوي للمستوردات بس";
    return null;
  };
  D.itemPrice = (it, sup) => { const C = ((V() && V().CARS[it.car]) || {}).price || 0; return Math.round(C * (1 - (D.SUPPLIERS[sup] || {}).disc)); };
  D.quote = (it, sup, dest, pk, svk) => {
    const P = D.PROV[pk], SV = D.SVC[svk], km = D.kmOf(sup, dest), cm = clsOf(it) === "heavy" ? 1.6 : 1;
    const ship = Math.max(8, Math.round((10 + km * SV.perKm * cm) * SV.price * P.rate));
    const R = D.route(sup, dest), spd = D.TRUCK_SPEED * P.spd * SV.spd;
    let eta = (PLACED_MS + 11000 * SV.time * (clsOf(it) === "heavy" ? 1.4 : 1) + 9000 * SV.time + PICK_MS) + (R.len / spd) * 1000 + ARRIVE_MS + UNLOAD_MS;
    if (SV.sea) eta += km * 180 + 25000; if (SV.air) eta += km * 45 + 20000;
    const risk = (1 - P.rel) * 2.2 + (SV.sea ? 0.12 : 0), storm = D.stormDay(Date.now());
    return { km, ship, item: D.itemPrice(it, sup), total: D.itemPrice(it, sup) + ship, eta, risk: clamp(risk + (storm ? 0.12 : 0), 0, 0.9), storm };
  };
  D.stormDay = (t) => hash("storm" + Math.floor((t + 3 * 3600000) / 86400000)) % 6 === 0;

  /* ---------------- خطة الشحنة (حتمية من رقم الطلب) ---------------- */
  D.plan = (o) => {
    const P = D.PROV[o.prov], SV = D.SVC[o.svc], R = D.route(o.sup, o.dest), sd = o.id, heavy = o.cls === "heavy";
    const spd = D.TRUCK_SPEED * P.spd * SV.spd, km = o.km;
    const T = {}; let t = o.t;
    T.placed0 = t; t += PLACED_MS;
    T.prep0 = t; let prep = (8000 + rnd(sd, 1) * 6000) * SV.time * (heavy ? 1.4 : 1); t += prep;
    const delays = [], risk = (1 - P.rel) * 2.2 + (SV.sea ? 0.12 : 0) + (o.storm ? 0.12 : 0), cap = 0.3;
    const roadBase = (R.len / spd) * 1000;
    // تأخير بالتجهيز (تعامل مع الشحنة)
    if (rnd(sd, 2) < risk * 0.45) { const ms = Math.round(clamp(prep * (0.25 + rnd(sd, 3) * 0.35), 4000, 20000)); delays.push({ ph: "prep", ms, why: "🏭 تأخّر تجهيز الشحنة بالمستودع (ضغط طلبات ومناولة بطيئة)" }); }
    const dPrep = delays.find((x) => x.ph === "prep"); if (dPrep) { dPrep.at = t; t += dPrep.ms; }
    T.wait0 = t; t += 9000 * SV.time;
    T.pick0 = t; t += PICK_MS; T.pick1 = t;
    if (SV.sea || SV.air) {
      T.sea0 = t; t += SV.sea ? km * 180 : km * 45; T.sea1 = t;
      T.port0 = t; t += 20000 + rnd(sd, 4) * 8000;
      if (SV.sea && rnd(sd, 5) < risk * 0.9) { const ms = Math.round(12000 + rnd(sd, 6) * 14000); delays.push({ ph: "port", at: t, ms, why: "⚓ ازدحام الميناء: انتظار دور التفريغ والتفتيش" }); t += ms; }
      T.port1 = t;
    }
    T.road0 = t;
    // توقفات الطريق (مواضع ثابتة على المسار)
    const reasons = [o.storm ? "🌪️ عاصفة بالمنطقة: السائق خفّض السرعة وانتظر" : "🌧️ طقس سيئ: السائق خفّض السرعة", "🚦 ازدحام على الطريق", "🔧 عطل بسيط بالشاحنة وتم إصلاحه", "🚧 إغلاق مؤقت للطريق للصيانة"];
    const stops = [];
    for (let k = 0; k < 2; k++) {
      if (rnd(sd, 10 + k) < risk * (k ? 0.5 : 0.8)) {
        const ms = Math.round(clamp(roadBase * (0.06 + rnd(sd, 20 + k) * 0.1), 6000, 40000)), s = R.len * (0.25 + 0.4 * k + rnd(sd, 30 + k) * 0.12);
        const why = reasons[hash(sd + "r" + k) % reasons.length]; stops.push({ ph: "road", s, ms, why });
      }
    }
    stops.sort((a, b) => a.s - b.s);
    const legs = []; let s0 = 0, tt = t;
    stops.forEach((st) => { const mv = ((st.s - s0) / spd) * 1000; legs.push({ t0: tt, t1: tt + mv, s0, s1: st.s }); tt += mv; st.at = tt; legs.push({ t0: tt, t1: tt + st.ms, s0: st.s, s1: st.s, stop: st }); tt += st.ms; s0 = st.s; delays.push(st); });
    const mv = ((R.len - s0) / spd) * 1000; legs.push({ t0: tt, t1: tt + mv, s0, s1: R.len }); tt += mv;
    T.road1 = tt; T.arr0 = tt; T.unl0 = tt + ARRIVE_MS; T.unl1 = T.unl0 + UNLOAD_MS;
    const base = T.unl1 - delays.reduce((a, d) => a + d.ms, 0), delayMs = delays.reduce((a, d) => a + d.ms, 0);
    return { T, legs, delays, spd, base, end: T.unl1, delayMs, late: delayMs > (base - o.t) * 0.25 };
  };
  const sAtTime = (pl, now) => {
    if (now <= pl.T.road0) return 0; if (now >= pl.T.road1) return -1;
    for (const L of pl.legs) if (now < L.t1) return L.s0 + (L.s1 - L.s0) * ((now - L.t0) / Math.max(1, L.t1 - L.t0));
    return -1;
  };
  const stopAt = (pl, now) => { for (const L of pl.legs) if (L.stop && now >= L.t0 && now < L.t1) return L.stop; return null; };

  /* ---------------- الحالة والموقع حسب الوقت ---------------- */
  D.stateAt = (o, now) => {
    const pl = o.plan, T = pl.T, R = D.route(o.sup, o.dest), SV = D.SVC[o.svc];
    const base = { code: "placed", vis: false, x: 0, z: 0, h: 0, s: 0, moving: false, u: 0, delay: null, loc: "عند المورّد" };
    if (o.cancelled) return Object.assign(base, { code: "cancelled", loc: "—" });
    let dl = null; pl.delays.forEach((d) => { if (now >= d.at && now < d.at + d.ms) dl = d; });
    base.delay = dl ? dl.why : null;
    const hubName = o.sup === "import" ? "المستورد" : "المستودع المركزي";
    if (now < T.prep0) return Object.assign(base, { code: "placed", loc: hubName });
    if (now < T.wait0) return Object.assign(base, { code: "preparing", loc: hubName });
    if (now < T.pick0) return Object.assign(base, { code: "awaiting_pickup", loc: hubName });
    if (now < T.pick1) return Object.assign(base, { code: "picked_up", loc: hubName });
    if (T.sea0 !== undefined && now < T.port0) return Object.assign(base, { code: "in_transit", loc: SV.sea ? "🌊 بالبحر (سفينة حاويات)" : "☁️ بالجو (طائرة شحن)", off: 1 });
    if (T.port0 !== undefined && now < T.road0) return Object.assign(base, { code: "at_port", loc: SV.sea ? "ميناء الجزيرة" : "مطار الجزيرة" });
    if (now < T.road1) {
      let s = sAtTime(pl, now); if (s < 0) s = R.len; const p = D.posOn(R, s), moving = !stopAt(pl, now);
      return Object.assign(base, { code: s >= R.gateS ? "out_for_delivery" : "in_transit", vis: true, x: p.x, z: p.z, h: p.h, s, moving, loc: D.locName(o, p, s) });
    }
    const pk = D.park(R);
    if (now < T.unl0) return Object.assign(base, { code: "arrived", vis: true, x: pk.x, z: pk.z, h: pk.h, s: R.len, loc: "وصلت لموقعكم" });
    if (now < T.unl1) return Object.assign(base, { code: "unloading", vis: true, x: pk.x, z: pk.z, h: pk.h, s: R.len, u: (now - T.unl0) / UNLOAD_MS, loc: "جاري التفريغ بموقعكم" });
    return Object.assign(base, { code: o.done ? "delivered" : "unloading", vis: !o.done, x: pk.x, z: pk.z, h: pk.h, s: R.len, u: 1, loc: o.done ? "انتسلمت" : "جاري التسجيل…" });
  };
  D.locName = (o, p, s) => {
    const R = D.route(o.sup, o.dest);
    if (p.z > 1100) return "جزيرة — قرب الميناء"; if (p.z > 110) return `الطريق الطويل (${Math.round(p.z - 98)} م من القرية)`;
    if (s >= R.len - 8) return "عند موقعكم"; if (p.z > 60) return "مدخل القرية"; if (Math.abs(p.x) > 60) return "شارع الأطراف"; if (p.z > 30) return "شارع القرية"; return "طريق المرآب";
  };
  // التقدير المعروض: بيتحدّث لما يصير تأخير فعلي (تحديثات منطقية للاعب)
  D.etaOf = (o, now) => { const pl = o.plan; let hidden = 0; pl.delays.forEach((d) => { if (now < d.at) hidden += d.ms; }); return pl.end - hidden; };
  D.ownerOf = (S) => S.ship;

  /* ---------------- الحدث: fold ---------------- */
  const shipS = (S) => S.ship || (S.ship = { orders: {}, rep: {}, n: 0 });
  D.active = (S) => Object.values(shipS(S).orders).filter((o) => !o.done && !o.cancelled);
  const refund = (S, n) => { S.coins += n; };
  D.fold = (ty, e, d, t, a, day, S, H) => {
    if (ty !== "ship_order" && ty !== "ship_cancel" && ty !== "ship_recv") return false;
    const SS = shipS(S);
    if (ty === "ship_order") {
      try {
        const it = d.item || {}, kind = D.CARGO[it.kind || "car"] ? it.kind || "car" : null; if (!kind) return true;
        const item = Object.assign({}, it, { kind }); if (!D.CARGO[kind].ok(S, item)) return true;
        const sup = D.SUPPLIERS[d.sup] ? d.sup : null, P = D.PROV[d.prov], SV = D.SVC[d.svc]; if (!sup || !P || !SV) return true;
        if (!destOk(S, d.dest) || !(V() && V().LOTS[d.dest])) return true;           // الوجهة موجودة وملك اللاعب ومدخلها متاح
        if (D.avail(item, sup, d.dest, d.prov, d.svc)) return true;                    // الحمولة تناسب الشاحنة/الخدمة
        if (SS.orders[e.id]) return true;                                              // ما بنكرر
        if (Object.values(SS.orders).some((x) => x.by === a && x.dest === d.dest && x.prov === d.prov && x.svc === d.svc && x.sup === sup && JSON.stringify(x.item) === JSON.stringify(item) && Math.abs(x.t - t) < D.DUP_MS)) return true;
        if (D.active(S).length >= D.MAX_ACTIVE) return true;
        const q = D.quote(item, sup, d.dest, d.prov, d.svc); if (S.coins < q.total) return true;   // الدفع صالح (السعر بيتحسب هون مش من العميل)
        S.coins -= q.total;
        const o = { id: e.id, t, by: a, item, sup, prov: d.prov, svc: d.svc, dest: d.dest, cls: clsOf(item), km: q.km, price: q.item, ship: q.ship, total: q.total, storm: D.stormDay(t), seq: ++SS.n, done: false };
        o.plan = D.plan(o); SS.orders[o.id] = o; H.mark();
      } catch (er) { console.warn("[deliv] order", er); }
      return true;
    }
    const o = SS.orders[d.id]; if (!o) return true;
    if (ty === "ship_cancel") {
      if (o.done || o.cancelled || t >= o.plan.T.pick0) return true;               // بس قبل الاستلام
      o.cancelled = true; refund(S, o.total - Math.round(o.total * D.CANCEL_FEE)); H.mark(); return true;
    }
    if (ty === "ship_recv") {
      if (o.done || o.cancelled) return true;
      if (t < o.plan.T.unl1 - 2500) return true;                                   // لازم ينتهي التفريغ أول
      let dest = o.dest; if (!(V() && V().LOTS[dest])) { dest = "H"; o.rerouted = true; }
      D.CARGO[o.item.kind].grant(S, o.item, dest, o, H); o.done = true; o.doneAt = t;
      if (o.plan.late) refund(S, Math.round(o.ship * D.LATE_REFUND));              // تعويض عن تأخير كبير
      const r = (SS.rep[o.prov] = SS.rep[o.prov] || { n: 0, sum: 0 }); r.n++; r.sum += o.plan.late ? 2.5 : o.plan.delayMs ? 3.8 : 5;
      H.mark(); return true;
    }
    return true;
  };
  D.rating = (S, pk) => { const P = D.PROV[pk], r = shipS(S).rep[pk]; return Math.round(((P.q * 3 + (r ? r.sum : 0)) / (3 + (r ? r.n : 0))) * 10) / 10; };

  // ربط الحدث بنظام fold الموجود بدون ما نعدّل game.js
  try { if (OSW.fam && OSW.fam.fold && !OSW.fam._deliv) { const of = OSW.fam.fold; OSW.fam.fold = (ty, e, d, t, a, day, S, H) => (ty === "ship_order" || ty === "ship_cancel" || ty === "ship_recv" ? D.fold(ty, e, d, t, a, day, S, H) : of(ty, e, d, t, a, day, S, H)); OSW.fam._deliv = 1; } } catch (e) { console.error("[deliv] hook", e); }

  /* ---------------- إرسال أحداث ---------------- */
  D.order = async (item, sup, dest, prov, svc) => { await G().do("ship_order", { item, sup, dest, prov, svc }); };
  D.cancel = async (id) => { await G().do("ship_cancel", { id }); };
  D.list = () => { const S = G().state(); return Object.values(shipS(S).orders).sort((a, b) => b.t - a.t); };

  D.net = { NODES, EDGES, HUB, PORT };
  D.testHooks = { sAtTime, ptAt, stopAt, hash };
  window.dispatchEvent && window.dispatchEvent(new Event("osw-deliv-core"));
})();
