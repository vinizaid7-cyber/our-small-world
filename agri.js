/* ============================================================
   الشركة الزراعية (Agri Company) — نظام مضاف فوق مزرعة اللعبة
   - كل شي أحداث (entries / house="game" / title="co_*") والحالة بتنحسب بالـ fold
     نفس مبدأ اللعبة، فما في أي جدول جديد بقاعدة البيانات ولا تعارض بين تلفونين.
   - المحاكاة الزمنية (عمال، مصانع، مشاكل) بتمشي بخطوات ثابتة كل 10 دقايق (TICK)
     وبتنحسب بنفس الطريقة عند الاثنين، حتى لو كانوا أوفلاين.
   - الملف مقسوم: agri.js (المنطق + النوافذ)، agri3d.js (العالم المرئي).
   ============================================================ */
(function () {
  const OSW = window.OSW, A = (OSW.agri = {}), esc = OSW.esc;
  const G = () => OSW.game, ui = () => OSW.ui, db = () => OSW.ui.db, P = () => OSW.places, W = () => OSW.world, V = () => OSW.veh;
  const HOUR = 3600000, DAY = 86400000, MIN = 60000, TICK = 10 * MIN, AMMAN = 3 * HOUR, ISSUE_MS = 3 * HOUR, PERIOD = 2 * DAY;
  const dayOf = (t) => Math.floor((t + AMMAN) / DAY);
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const r01 = (s) => (hash(s) % 100000) / 100000;
  A.HOUR = HOUR; A.DAY = DAY; A.TICK = TICK;

  /* ---------------- الإعدادات ---------------- */
  const FOUND_COST = 600, TRACTOR_COST = 450, PALLET = 5, SHIELD = 24 * HOUR, MAX_ISSUES = 3;
  const HQ_LV = [{ cap: 6, tr: 2, cost: 0 }, { cap: 12, tr: 3, cost: 700 }, { cap: 20, tr: 4, cost: 1400 }];
  const WH_CAP = [80, 140, 220], WH_UP = [0, 400, 800];
  const IRR = { cost: [30, 55], mul: [1, 0.88, 0.76], names: ["بدون ري", "رشّاشات", "ري بالتنقيط + مضخة"] }; // السعر لكل أرضية
  const ROLES = {
    farmer: { n: "مزارع", e: "👨‍🌾", wage: 25, note: "بيقطف ويزرع الأرض اللي معيّن عليها لحاله" },
    driver: { n: "سائق جرار", e: "🚜", wage: 40, note: "بيشغّل جرار: الأرض بتشتغل أسرع مرتين وبتنحرث" },
    factory: { n: "عامل مصنع", e: "🏭", wage: 30, note: "لازم عامل بالمصنع عشان يشتغل" },
    mechanic: { n: "ميكانيكي", e: "🔧", wage: 45, note: "بيصلّح الأعطال بنص السعر وبيصلّح الآلات لحاله بعد 3 ساعات" },
  };
  const NAMES_M = ["أبو جابر", "سامي", "خالد", "يوسف", "عمر", "ماهر", "فراس", "بسّام", "طارق", "نادر", "زيد", "حسّان"];
  const NAMES_F = ["هدى", "رنا", "سهى", "لمى", "ديما", "ميساء", "نور", "ريما"];
  const COUNTRIES = [
    { id: "zah", n: "جمهورية زهرستان", e: "🏜️" }, { id: "yaq", n: "مملكة بحر الياقوت", e: "💎" }, { id: "nkh", n: "اتحاد جزر النخيل", e: "🌴" },
    { id: "wad", n: "إمارة الوادي الأخضر", e: "🏞️" }, { id: "nuj", n: "سلطنة النجوم الذهبية", e: "⭐" }, { id: "jal", n: "دوقية الجليد الأبيض", e: "❄️" },
  ];
  const GOODS = {
    flour: { n: "طحين", e: "🥡", base: 11, perish: 0 }, bread: { n: "خبز مصنّع", e: "🥖", base: 8, perish: 0 },
    butter: { n: "زبدة", e: "🧈", base: 33, perish: 1 }, cheese: { n: "جبنة", e: "🧀", base: 34, perish: 1 },
    jam: { n: "مربى فراولة", e: "🍯", base: 45, perish: 0 }, grapejuice: { n: "عصير عنب", e: "🧃", base: 78, perish: 1 },
    lemonade: { n: "عصير ليمون", e: "🍹", base: 55, perish: 1 }, wmjuice: { n: "عصير بطيخ", e: "🥤", base: 62, perish: 1 },
  };
  const EXPORTABLE = ["bread", "butter", "cheese", "jam", "grapejuice", "lemonade", "wmjuice", "flour"];
  // المصانع: مواقعها بالمنطقة الصناعية جنوب شرق القرية
  const PLANTS = {
    mill: { n: "المطحنة", e: "🌾", cost: 600, x: 55, z: 89, w: 14, d: 10, wall: "#e8dcc2", roof: "#a0522d" },
    bakery: { n: "المخبز الصناعي", e: "🥖", cost: 700, x: 72, z: 89, w: 12, d: 10, wall: "#f4e3d0", roof: "#c0392b" },
    dairy: { n: "مصنع الألبان", e: "🥛", cost: 900, x: 86, z: 89, w: 12, d: 10, wall: "#eaf2f8", roof: "#4a7fb5" },
    juice: { n: "مصنع العصائر والمربى", e: "🧃", cost: 1000, x: 101, z: 89, w: 14, d: 10, wall: "#fdf0d5", roof: "#e07a1f" },
  };
  const RECIPES = {
    flour: { plant: "mill", in: { wheat: 6 }, out: { flour: 4 }, min: 25 },
    bread: { plant: "bakery", in: { flour: 4 }, out: { bread: 8 }, min: 20 },
    butter: { plant: "dairy", in: { milk: 4 }, out: { butter: 2 }, min: 30 },
    cheese: { plant: "dairy", in: { milk: 6 }, out: { cheese: 3 }, min: 40 },
    jam: { plant: "juice", in: { strawberry: 6 }, out: { jam: 4 }, min: 35 },
    grapejuice: { plant: "juice", in: { grapes: 4 }, out: { grapejuice: 4 }, min: 30 },
    lemonade: { plant: "juice", in: { lemon: 6 }, out: { lemonade: 5 }, min: 30 },
    wmjuice: { plant: "juice", in: { watermelon: 4 }, out: { wmjuice: 4 }, min: 30 },
  };
  const RAW = { milk: { n: "حليب طازج", e: "🥛" } };
  // مواقع ثابتة بالعالم (بتستخدمها agri3d.js كمان)
  A.POS = {
    hq: { x: -92, z: 89, w: 24, d: 10 }, depot: { x: -71, z: 88, w: 10, d: 8 }, wh: { x: -55, z: 89, w: 14, d: 10 },
    lotCO: { x: -46, z: 83.5, dz: 3.2, h: -Math.PI / 2, cx: -46, cz: 86, rad: 12, out: { x: -42.5, z: 80.5 } },
    port: { x: 50, z: 1258, w: 10, d: 9 }, lotPT: { x: 62, z: 1256, dz: 3.2, h: 0, cx: 62, cz: 1260, rad: 12, out: { x: 67, z: 1256 } },
    quay: { x: 62, z: 1297 }, ship: { x: 62, z: 1310 },
  };
  A.OFFICES = [
    { id: "ov", e: "🏢", n: "الإدارة", x: -100 }, { id: "fl", e: "🌾", n: "الأراضي", x: -96 }, { id: "wk", e: "👷", n: "العمال", x: -92 },
    { id: "st", e: "📦", n: "المخازن", x: -88 }, { id: "ct", e: "📜", n: "العقود", x: -84 }, { id: "sl", e: "💰", n: "المبيعات", x: -80 },
  ];
  A.ROLES = ROLES; A.PLANTS = PLANTS; A.RECIPES = RECIPES; A.GOODS = GOODS; A.COUNTRIES = COUNTRIES; A.IRR = IRR; A.PALLET = PALLET; A.HQ_LV = HQ_LV; A.WH_CAP = WH_CAP;

  // الأراضي: المزرعة الأم + الأراضي الستة
  const FIELDS = (A.FIELDS = []);
  function initFields() {
    if (FIELDS.length) return FIELDS;
    FIELDS.push({ id: "f0", n: "المزرعة الأم", plots: Array.from({ length: 12 }, (_, i) => i), cx: -21.6, cz: -31, hw: 9, hd: 11, pump: { x: -32, z: -26 }, park: { x: -31, z: -20 } });
    ((OSW.EX && OSW.EX.LANDS) || []).forEach((L, i) => { const side = L.id === "l6" ? -1 : 1; FIELDS.push({ id: L.id, n: L.n, plots: Array.from({ length: 6 }, (_, k) => 12 + i * 6 + k), cx: L.x, cz: L.z, hw: 6, hd: 9, pump: { x: L.x - side * 10.2, z: L.z - 3 }, park: { x: L.x - side * 10.2, z: L.z + 4 } }); });
    return FIELDS;
  }
  initFields();
  const fieldById = (id) => FIELDS.find((f) => f.id === id);
  const fieldOfPlot = (i) => (i < 12 ? FIELDS[0] : FIELDS[1 + Math.floor((i - 12) / 6)]);
  A.fieldById = fieldById; A.fieldOfPlot = fieldOfPlot;
  const owns = (S, f) => f.id === "f0" || !!(S.lands && S.lands[f.id]);

  /* ---------------- الحالة ---------------- */
  const blank = () => ({ on: false, name: "", t0: 0, tk: 0, payDay: 0, hq: 1, wh: 0, rep: 0, irr: {}, dry: {}, blight: {}, plan: {}, tr: [], w: [], wid: 0, trid: 0, pl: {}, goods: {}, pack: {}, dock: {}, acc: {}, done: 0, iss: {}, hired: {}, lastAct: 0, shipT: 0, shipCid: null, cold: null, auto: { h: 0, p: 0 }, led: { rev: 0, exp: 0, wages: 0, exported: 0, lost: 0, fixed: 0, made: 0 }, log: [] });
  const co = (S) => S.co || (S.co = blank());
  A.co = co;
  const log = (c, t, m) => { c.log.unshift({ t, m }); if (c.log.length > 14) c.log.length = 14; };
  const goodsUsed = (c) => Object.keys(c.goods).reduce((n, k) => n + c.goods[k], 0) + Object.keys(c.pack).reduce((n, k) => n + c.pack[k] * PALLET, 0);
  A.cap = (c) => WH_CAP[c.wh || 0];
  A.goodsUsed = goodsUsed;
  const effOf = (w) => 0.85 + 0.15 * w.sk;
  const active = (w) => !!w.to && !w.strike && !w.sick;
  const workersOn = (c, role, to) => c.w.filter((w) => w.role === role && w.to === to && active(w));
  const mechanicOn = (c) => c.w.some((w) => w.role === "mechanic" && active(w));
  A.workersOn = workersOn; A.mechanicOn = mechanicOn; A.effOf = effOf; A.active = active;
  const cropsOf = () => G().CROPS;
  const growMs = (p) => cropsOf()[p.crop].g * MIN * (p.fert ? 0.75 : 1) * (p.sm || 1);
  // جرار شغّال على الأرض: عنده سائق ومش معطّل
  const mech = (c, f) => c.tr.some((tr) => tr.field === f.id && !tr.broken && workersOn(c, "driver", tr.id).length > 0);
  A.mech = mech;

  /* ---- أدوات تأثير على الزراعة (بتنستدعى من game.js) ---- */
  A.growMul = (S, plot, t) => {
    const c = S.co; if (!c || !c.on) return 1; const f = fieldOfPlot(plot); let m = 1;
    const lv = c.irr[f.id] || 0; if (lv > 0 && !c.dry[f.id]) m *= IRR.mul[lv];
    if (c.dry[f.id]) m *= 1.25;
    if (mech(c, f)) m *= 0.92;
    return m;
  };
  A.yieldAdj = (S, plot, t) => { const c = S.co; if (!c || !c.on) return 0; return c.blight[fieldOfPlot(plot).id] ? -1 : 0; };

  /* ---------------- مصانع ---------------- */
  const recIn = (rec, lv) => Object.keys(RECIPES[rec].in).map((k) => [k, RECIPES[rec].in[k] * lv]);
  const recOut = (rec, lv) => Object.keys(RECIPES[rec].out).map((k) => [k, RECIPES[rec].out[k] * lv]);
  const have = (S, k) => (GOODS[k] ? (S.co.goods[k] || 0) : (S.inv[k] || 0));
  const take = (S, k, n) => { if (GOODS[k]) { S.co.goods[k] = (S.co.goods[k] || 0) - n; if (S.co.goods[k] <= 0) delete S.co.goods[k]; } else S.inv[k] = (S.inv[k] || 0) - n; };
  A.canRun = (S, id, rec) => {
    const c = S.co, pl = c.pl[id], R = RECIPES[rec]; if (!pl || !pl.built || !R || R.plant !== id) return "ما في مصنع";
    if (pl.broken) return "المصنع معطّل 🔧"; if (pl.job) return "في دفعة شغّالة";
    if (!workersOn(c, "factory", id).length) return "ما في عامل معيّن بالمصنع 👷";
    for (const [k, n] of recIn(rec, pl.lv)) if (have(S, k) < n) return "المواد ناقصة";
    return null;
  };
  function startJob(S, id, rec, t) {
    if (A.canRun(S, id, rec)) return false; const c = S.co, pl = c.pl[id], R = RECIPES[rec];
    recIn(rec, pl.lv).forEach(([k, n]) => take(S, k, n));
    const speed = Math.min(3, workersOn(c, "factory", id).reduce((s, w) => s + effOf(w), 0)), dur = (R.min * MIN * (1 + 0.1 * (pl.lv - 1))) / speed;
    pl.job = { rec, t0: t, end: t + dur, lv: pl.lv }; pl.rec = rec; return true;
  }
  A.jobDur = (S, id, rec) => { const c = S.co, pl = c.pl[id]; const speed = Math.max(0.01, Math.min(3, workersOn(c, "factory", id).reduce((s, w) => s + effOf(w), 0))); return (RECIPES[rec].min * MIN * (1 + 0.1 * (pl.lv - 1))) / speed; };
  function plantsStep(S, tk) {
    const c = S.co;
    Object.keys(c.pl).forEach((id) => {
      const pl = c.pl[id]; if (!pl.built) return;
      if (pl.job) {
        if (pl.broken) { pl.job.end += TICK; return; }
        if (tk >= pl.job.end) {
          const outs = recOut(pl.job.rec, pl.job.lv), n = outs.reduce((s, o) => s + o[1], 0);
          if (goodsUsed(c) + n > A.cap(c)) { pl.job.wait = true; return; } // المخزن ممتلي
          outs.forEach(([k, q]) => (c.goods[k] = (c.goods[k] || 0) + q)); c.led.made += n; log(c, tk, `${PLANTS[id].e} ${PLANTS[id].n}: خلّصت ${outs.map(([k, q]) => q + " " + GOODS[k].n).join(" + ")}`); pl.job = null;
        } else return;
      }
      if (pl.auto && pl.rec && !pl.broken) startJob(S, id, pl.rec, tk);
    });
  }

  /* ---------------- عمال: شغل الأراضي ---------------- */
  function farmStep(S, tk) {
    const c = S.co, C = cropsOf();
    FIELDS.forEach((f) => {
      if (!owns(S, f)) return; const fs = workersOn(c, "farmer", f.id); if (!fs.length) return;
      let cap = Math.max(1, Math.round(fs.reduce((s, w) => s + effOf(w), 0) * (mech(c, f) ? 2 : 1)));
      for (const i of f.plots) { if (cap <= 0) break; const p = S.plots[i]; if (!p || tk < p.at + growMs(p) - 1500) continue;
        const units = Math.max(1, 2 + (hash(i + ":" + p.at) % 2) + (c.blight[f.id] ? -1 : 0)); S.inv[p.crop] = (S.inv[p.crop] || 0) + units; S.plots[i] = null; S.harvests++; c.auto.h++; cap--; }
      const crop = c.plan[f.id]; if (!crop || !C[crop]) return;
      for (const i of f.plots) { if (cap <= 0) break; if (S.plots[i] || S.coins < C[crop].seed) continue;
        S.coins -= C[crop].seed; c.led.exp += C[crop].seed; S.plots[i] = { crop, at: tk, fert: false, sm: Math.pow(0.9, (S.up && S.up.soil) || 0) * A.growMul(S, i, tk) }; S.plants++; c.auto.p++; cap--; }
    });
  }

  /* ---------------- رواتب ---------------- */
  function payroll(S, tk) {
    const c = S.co; let n = 0;
    c.w.forEach((w) => { if (w.strike) return; if (S.coins >= w.wage) { S.coins -= w.wage; c.led.wages += w.wage; c.led.exp += w.wage; } else { w.strike = true; n++; } });
    if (n) log(c, tk, `⚠️ ${n} عمال ما اندفعلهم راتب وأضربوا! ادفعوا من مكتب العمال`);
  }

  /* ---------------- المشاكل ---------------- */
  const KINDS = {
    tractor: { e: "🚜", n: "تعطّل جرار", ddl: 0 }, plant: { e: "🏭", n: "تعطّل مصنع", ddl: 0 }, water: { e: "💧", n: "نقص مياه بالري", ddl: 0 },
    blight: { e: "🐛", n: "آفة بالمحاصيل", ddl: 10 * HOUR }, staff: { e: "🤒", n: "عامل مريض/غايب", ddl: 12 * HOUR }, cold: { e: "🧊", n: "تعطّل تبريد المخزن", ddl: 8 * HOUR },
  };
  A.KINDS = KINDS;
  A.repairCost = (S, is) => {
    const c = S.co; let b = 0;
    if (is.kind === "tractor") b = 80; else if (is.kind === "plant") b = 50 + 40 * ((c.pl[is.target] || { lv: 1 }).lv); else if (is.kind === "water") b = 35; else if (is.kind === "blight") b = 45; else if (is.kind === "staff") b = 25; else b = 90;
    return Math.ceil(b * (mechanicOn(c) ? 0.5 : 1));
  };
  A.issueName = (S, is) => {
    const c = S.co, K = KINDS[is.kind];
    if (is.kind === "tractor") { const i = c.tr.findIndex((x) => x.id === is.target); return `${K.e} جرار #${i + 1} معطّل`; }
    if (is.kind === "plant") return `${K.e} ${(PLANTS[is.target] || {}).n || ""} معطّل`;
    if (is.kind === "water") return `${K.e} نقص مياه: ${(fieldById(is.target) || {}).n}`;
    if (is.kind === "blight") return `${K.e} آفة: ${(fieldById(is.target) || {}).n}`;
    if (is.kind === "staff") { const w = c.w.find((x) => x.id === is.target); return `${K.e} ${w ? w.name : "عامل"} مريض`; }
    return `${K.e} تبريد مخزن الشركة معطّل`;
  };
  A.issueHelp = (is) => ({
    tractor: "الجرار واقف: الأرض بتشتغل أبطأ. روح عند الجرار وأصلحه.", plant: "المصنع واقف والدفعة متجمّدة. روح للمصنع وأصلحه.",
    water: "خزان الري فاضي: الأرض بتنمو أبطأ بدل أسرع. روح لمضخة الأرض وعبّي المياه.", blight: "آفة بتأكل المحصول! إذا ما رشّيتوا مبيد قبل الموعد بتتلف الزراعة.",
    staff: "عامل غايب وشغله واقف. اعطوه علاوة بالمقر ليرجع، أو بيرجع لحاله بعد 12 ساعة.", cold: "المنتجات القابلة للتلف (ألبان وعصائر) بتخرب إذا ما انصلح التبريد قبل الموعد.",
  }[is.kind]);
  // مكان المشكلة بالعالم
  A.issueLoc = (S, is, t) => {
    const c = S.co;
    if (is.kind === "tractor") { const tr = c.tr.find((x) => x.id === is.target), f = tr && fieldById(tr.field); return f ? { x: f.park.x, z: f.park.z, poi: "co:field:" + f.id } : { x: A.POS.depot.x, z: A.POS.depot.z - 5 }; }
    if (is.kind === "plant") { const p = PLANTS[is.target]; return { x: p.x, z: p.z - 7, poi: "co:plant:" + is.target }; }
    if (is.kind === "water" || is.kind === "blight") { const f = fieldById(is.target); return { x: is.kind === "water" ? f.pump.x : f.cx, z: is.kind === "water" ? f.pump.z : f.cz + f.hd + 1.5, poi: "co:field:" + f.id }; }
    if (is.kind === "staff") return { x: A.POS.hq.x, z: A.POS.hq.z - 7, poi: "co:hq:wk" };
    return { x: A.POS.wh.x, z: A.POS.wh.z - 10, poi: "co:wh" };
  };
  const activeIssues = (c) => Object.values(c.iss).filter((i) => !i.done && !i.fail);
  A.activeIssues = (S) => (S.co ? activeIssues(S.co) : []);
  function clearEffect(S, is) {
    const c = S.co;
    if (is.kind === "tractor") { const tr = c.tr.find((x) => x.id === is.target); if (tr) tr.broken = null; }
    else if (is.kind === "plant") { const pl = c.pl[is.target]; if (pl) pl.broken = null; }
    else if (is.kind === "water") delete c.dry[is.target]; else if (is.kind === "blight") delete c.blight[is.target];
    else if (is.kind === "staff") { const w = c.w.find((x) => x.id === is.target); if (w) w.sick = null; } else c.cold = null;
  }
  function failIssue(S, is, tk) {
    const c = S.co; is.fail = true; clearEffect(S, is);
    if (is.kind === "blight") { const f = fieldById(is.target); let n = 0; f.plots.forEach((i) => { if (S.plots[i]) { S.plots[i] = null; n++; } }); c.led.lost += n; log(c, tk, `🐛 الآفة أتلفت ${n} مزروعات بـ${f.n}`); }
    else if (is.kind === "cold") { let n = 0; Object.keys(c.goods).forEach((k) => { if (GOODS[k].perish) { const loss = Math.ceil(c.goods[k] * 0.4); c.goods[k] -= loss; n += loss; if (c.goods[k] <= 0) delete c.goods[k]; } }); c.led.lost += n; log(c, tk, `🧊 تلف ${n} وحدة من المنتجات بالمخزن`); }
    else if (is.kind === "staff") log(c, tk, "🤒 العامل رجع للشغل لحاله");
  }
  function fixIssue(S, is, t, auto) { clearEffect(S, is); is.done = true; is.fixT = t; is.auto = !!auto; S.co.led.fixed++; log(S.co, t, `🔧 ${auto ? "الميكانيكي صلّح" : "انصلح"}: ${A.issueName(S, is).replace(/^\S+\s/, "")}`); }
  function issuesStep(S, tk) {
    const c = S.co;
    Object.values(c.iss).forEach((is) => {
      if (is.done || is.fail) return;
      if (is.ddl && tk >= is.ddl) return failIssue(S, is, tk);
      if ((is.kind === "tractor" || is.kind === "plant") && mechanicOn(c) && tk >= is.t0 + 3 * HOUR) { const cost = A.repairCost(S, is); if (S.coins >= cost) { S.coins -= cost; c.led.exp += cost; fixIssue(S, is, tk, true); } }
    });
    if (tk % ISSUE_MS !== 0 || tk - c.lastAct > SHIELD || tk - c.t0 < 6 * HOUR) return;
    if (activeIssues(c).length >= MAX_ISSUES) return;
    const w = tk / ISSUE_MS, cands = [];
    c.tr.forEach((tr) => { if (tr.field && !tr.broken) cands.push(["tractor", tr.id, 3]); });
    Object.keys(c.pl).forEach((id) => { const pl = c.pl[id]; if (pl.built && !pl.broken && pl.job) cands.push(["plant", id, 3]); });
    FIELDS.forEach((f) => { if (!owns(S, f)) return; if ((c.irr[f.id] || 0) > 0 && !c.dry[f.id]) cands.push(["water", f.id, 2]); if (!c.blight[f.id] && f.plots.filter((i) => S.plots[i]).length >= 2) cands.push(["blight", f.id, 2]); });
    if (!c.cold && Object.keys(c.goods).some((k) => GOODS[k].perish && c.goods[k] >= 6)) cands.push(["cold", "wh", 2]);
    c.w.filter((x) => !x.sick && active(x)).length >= 2 && c.w.filter((x) => !x.sick && active(x)).forEach((x) => cands.push(["staff", x.id, 1]));
    if (!cands.length) return;
    if (r01("isp" + w + ":" + c.t0) >= Math.min(0.14, 0.03 + 0.012 * cands.length)) return; // ~0.4-0.9 مشكلة باليوم حسب حجم الشركة
    let tot = cands.reduce((s, x) => s + x[2], 0), r = r01("isk" + w + ":" + c.t0) * tot, pick = cands[0]; for (const x of cands) { r -= x[2]; if (r <= 0) { pick = x; break; } }
    const [kind, target] = pick, is = { id: "i" + w, kind, target, t0: tk, ddl: KINDS[kind].ddl ? tk + KINDS[kind].ddl : 0, done: false, fail: false };
    c.iss[is.id] = is;
    if (kind === "tractor") c.tr.find((x) => x.id === target).broken = is.id; else if (kind === "plant") c.pl[target].broken = is.id; else if (kind === "water") c.dry[target] = is.id;
    else if (kind === "blight") c.blight[target] = is.id; else if (kind === "staff") c.w.find((x) => x.id === target).sick = is.id; else c.cold = is.id;
    log(c, tk, "⚠️ " + A.issueName(S, is));
  }

  /* ---------------- عقود التصدير ---------------- */
  A.period = (t) => Math.floor(dayOf(t) / 2);
  A.offers = (p) => [0, 1, 2, 3].map((i) => {
    const item = EXPORTABLE[hash("co" + p + i) % EXPORTABLE.length], qty = PALLET * (2 + (hash("q" + p + i) % 5)), ctry = COUNTRIES[hash("c" + p + i) % COUNTRIES.length], dur = (2 + (hash("d" + p + i) % 3)) * DAY, mult = 1.55 + (hash("m" + p + i) % 60) / 100;
    return { id: "c" + p + "-" + i, p, i, item, qty, ctry: ctry.id, dur, mult, reward: Math.round(GOODS[item].base * qty * mult) };
  });
  A.offerEnd = (p) => (p + 1) * PERIOD - AMMAN;
  const loaded = (S, cid) => S.cars.reduce((n, car) => n + (car.pal || []).filter((x) => x.cid === cid).length, 0);
  A.palletsOf = (S, cid) => { const c = S.co; return { pack: c.pack[cid] || 0, car: loaded(S, cid), dock: c.dock[cid] || 0 }; };
  function contractsStep(S, tk) {
    const c = S.co;
    Object.keys(c.acc).forEach((cid) => { const k = c.acc[cid]; if (k.done || k.fail || tk <= k.ddl) return; k.fail = true; c.rep = Math.max(0, c.rep - 1);
      const back = (c.pack[cid] || 0) + (c.dock[cid] || 0); if (back) { const q = Math.min(back * PALLET, Math.max(0, A.cap(c) - goodsUsed(c))); c.goods[k.item] = (c.goods[k.item] || 0) + q; }
      delete c.pack[cid]; delete c.dock[cid]; log(c, tk, `⌛ انتهى موعد عقد ${GOODS[k.item].n} (${(COUNTRIES.find((x) => x.id === k.ctry) || {}).n})`); });
  }
  A.price = (item, day) => Math.max(1, Math.round(GOODS[item].base * (0.85 + 0.35 * r01("gp" + item + ":" + day))));
  A.trend = (item, day) => { const a = A.price(item, day), b = A.price(item, day - 1); return a > b ? "▲" : a < b ? "▼" : "•"; };

  /* ---------------- العمال المتاحين للتوظيف ---------------- */
  A.cands = (day) => Array.from({ length: 6 }, (_, i) => {
    const h = hash("cand" + day + ":" + i), role = Object.keys(ROLES)[h % 4], sk = 1 + (hash("sk" + day + i) % 3), girl = hash("g" + day + i) % 3 === 0, nm = (girl ? NAMES_F : NAMES_M)[hash("n" + day + i) % (girl ? NAMES_F.length : NAMES_M.length)];
    return { key: day + ":" + i, i, day, role, sk, girl, name: nm, wage: ROLES[role].wage + 8 * (sk - 1) };
  });
  // أهداف التعيين المسموحة لدور معيّن
  A.targets = (S, role) => {
    const c = S.co, out = [];
    if (role === "farmer") FIELDS.forEach((f) => { if (owns(S, f)) out.push({ id: f.id, n: "🌾 " + f.n, max: 3 }); });
    else if (role === "driver") c.tr.forEach((tr, i) => out.push({ id: tr.id, n: "🚜 جرار #" + (i + 1) + (tr.field ? " (" + fieldById(tr.field).n + ")" : " (بالمخزن)"), max: 1 }));
    else if (role === "factory") Object.keys(c.pl).forEach((id) => { if (c.pl[id].built) out.push({ id, n: PLANTS[id].e + " " + PLANTS[id].n, max: 3 }); });
    else out.push({ id: "hq", n: "🏢 المقر", max: 2 });
    return out;
  };

  /* ---------------- المحاكاة الزمنية ---------------- */
  function step(S, tk) {
    const c = S.co, day = dayOf(tk);
    issuesStep(S, tk); plantsStep(S, tk); farmStep(S, tk);
    if (day !== c.payDay) { c.payDay = day; payroll(S, tk); }
    contractsStep(S, tk);
  }
  function advance(S, t) {
    const c = S.co; if (!c || !c.on) return;
    let tk = c.tk + TICK; if (t - tk > 7 * DAY) tk = Math.floor((t - 7 * DAY) / TICK) * TICK + TICK; // سقف تعويض الغياب: أسبوع
    for (; tk <= t; tk += TICK) { step(S, tk); c.tk = tk; }
  }
  A.pre = (S, t) => { if (S.co && S.co.on) advance(S, t); };
  A.now = (S) => { if (!S.co || !S.co.on) return; const n = Date.now(); if (S.__an && n - S.__an < 8000) return; S.__an = n; advance(S, n); };

  /* ---------------- الأحداث ---------------- */
  A.fold = (ty, e, d, t, a, day, S, H) => {
    if (ty.slice(0, 3) !== "co_") return false;
    const c = co(S), C = cropsOf(), mark = H.mark, spend = (n) => { S.coins -= n; c.led.exp += n; };
    if (ty === "co_found") {
      if (c.on || S.coins < FOUND_COST) return true;
      const nm = String(d.name || "").trim().slice(0, 22) || "شركتنا الزراعية";
      S.coins -= FOUND_COST; Object.assign(c, { on: true, name: nm, t0: t, tk: Math.floor(t / TICK) * TICK, payDay: dayOf(t), lastAct: t }); c.led.exp += FOUND_COST;
      Object.keys(PLANTS).forEach((id) => (c.pl[id] = { lv: 1, built: false, job: null, auto: false, rec: null, broken: null }));
      log(c, t, "🏢 تأسست الشركة"); mark(); return true;
    }
    if (!c.on) return true;
    c.lastAct = t;
    const car = () => S.cars.find((x) => x.id === d.car), acc = () => c.acc[d.cid], live = (k) => k && !k.done && !k.fail;
    switch (ty) {
      case "co_hqup": { const nx = HQ_LV[c.hq]; if (!nx || S.coins < nx.cost) return true; spend(nx.cost); c.hq++; mark(); return true; }
      case "co_whup": { const cost = WH_UP[(c.wh || 0) + 1]; if (!cost || S.coins < cost) return true; spend(cost); c.wh++; mark(); return true; }
      case "co_hire": {
        const cd = A.cands(d.day)[d.i | 0]; if (!cd || d.day !== day || c.hired[cd.key] || c.w.length >= HQ_LV[c.hq - 1].cap || S.coins < cd.wage) return true;
        spend(cd.wage); c.led.wages += cd.wage; c.hired[cd.key] = 1; c.w.push({ id: "w" + ++c.wid, name: cd.name, girl: cd.girl, role: cd.role, sk: cd.sk, wage: cd.wage, to: null, sick: null, strike: false, since: t }); mark(); return true;
      }
      case "co_fire": { const i = c.w.findIndex((x) => x.id === d.w); if (i < 0) return true; const w = c.w[i]; if (w.sick && c.iss[w.sick]) { c.iss[w.sick].done = true; } c.w.splice(i, 1); mark(); return true; }
      case "co_assign": {
        const w = c.w.find((x) => x.id === d.w); if (!w) return true;
        if (!d.to) { w.to = null; mark(); return true; }
        const tg = A.targets(S, w.role).find((x) => x.id === d.to); if (!tg || c.w.filter((x) => x.role === w.role && x.to === d.to && x.id !== w.id).length >= tg.max) return true;
        w.to = d.to; mark(); return true;
      }
      case "co_pay": { c.w.forEach((w) => { if (w.strike && S.coins >= w.wage) { S.coins -= w.wage; c.led.wages += w.wage; c.led.exp += w.wage; w.strike = false; } }); mark(); return true; }
      case "co_plan": { const f = fieldById(d.field); if (!f || !owns(S, f)) return true; if (!d.crop) delete c.plan[f.id]; else if (C[d.crop]) c.plan[f.id] = d.crop; mark(); return true; }
      case "co_irr": { const f = fieldById(d.field); if (!f || !owns(S, f)) return true; const lv = c.irr[f.id] || 0; if (lv >= 2 || S.coins < IRR.cost[lv] * f.plots.length) return true; spend(IRR.cost[lv] * f.plots.length); c.irr[f.id] = lv + 1; mark(); return true; }
      case "co_tbuy": { if (c.tr.length >= HQ_LV[c.hq - 1].tr || S.coins < TRACTOR_COST) return true; spend(TRACTOR_COST); c.tr.push({ id: "t" + ++c.trid, field: null, broken: null }); mark(); return true; }
      case "co_tfield": { const tr = c.tr.find((x) => x.id === d.id); if (!tr) return true; const f = d.field ? fieldById(d.field) : null; if (d.field && (!f || !owns(S, f))) return true; tr.field = f ? f.id : null; mark(); return true; }
      case "co_pbuild": { const pl = c.pl[d.plant], PL = PLANTS[d.plant]; if (!pl || pl.built || S.coins < PL.cost) return true; spend(PL.cost); pl.built = true; log(c, t, `${PL.e} اتبنى ${PL.n}`); mark(); return true; }
      case "co_pup": { const pl = c.pl[d.plant], PL = PLANTS[d.plant]; if (!pl || !pl.built || pl.lv >= 3) return true; const cost = Math.round(PL.cost * 0.8 * pl.lv); if (S.coins < cost) return true; spend(cost); pl.lv++; mark(); return true; }
      case "co_run": { if (startJob(S, d.plant, d.rec, t)) mark(); return true; }
      case "co_auto": { const pl = c.pl[d.plant]; if (!pl || !pl.built) return true; pl.auto = !!d.on; if (d.rec && RECIPES[d.rec] && RECIPES[d.rec].plant === d.plant) pl.rec = d.rec; if (pl.auto && pl.rec && !pl.job) startJob(S, d.plant, pl.rec, t); mark(); return true; }
      case "co_sell": { const it = GOODS[d.item], q = d.q | 0; if (!it || q < 1 || (c.goods[d.item] || 0) < q) return true; const gain = A.price(d.item, day) * q; c.goods[d.item] -= q; if (c.goods[d.item] <= 0) delete c.goods[d.item]; S.coins += gain; c.led.rev += gain; mark(); return true; }
      case "co_accept": {
        const of = A.offers(A.period(t)).find((x) => x.id === d.id); if (!of || c.acc[of.id] || Object.values(c.acc).filter(live).length >= 3) return true;
        c.acc[of.id] = { id: of.id, item: of.item, qty: of.qty, ctry: of.ctry, t, ddl: t + of.dur, reward: Math.round(of.reward * (1 + 0.02 * Math.min(c.rep, 10))), done: false, fail: false }; mark(); return true;
      }
      case "co_pack": {
        const k = acc(); if (!live(k)) return true; const have_ = Math.floor((c.goods[k.item] || 0) / PALLET), P_ = A.palletsOf(S, d.cid), need = k.qty / PALLET - P_.pack - P_.car - P_.dock, n = Math.min(d.n | 0, have_, need); if (n < 1) return true;
        c.goods[k.item] -= n * PALLET; if (c.goods[k.item] <= 0) delete c.goods[k.item]; c.pack[d.cid] = (c.pack[d.cid] || 0) + n; mark(); return true;
      }
      case "co_unpack": { const n = c.pack[d.cid] || 0, k = acc(); if (!n || !k) return true; c.goods[k.item] = (c.goods[k.item] || 0) + n * PALLET; delete c.pack[d.cid]; mark(); return true; }
      case "co_cload": {
        const cr = car(), k = acc(); if (!cr || !live(k) || cr.at !== "CO") return true; cr.pal = cr.pal || [];
        const cap = (V().CARS[cr.car] || {}).cargo || 4, room = cap - (cr.crates || []).length - cr.pal.length; let n = Math.min(d.n | 0, room, c.pack[d.cid] || 0); if (n < 1) return true;
        c.pack[d.cid] -= n; if (c.pack[d.cid] <= 0) delete c.pack[d.cid]; while (n--) cr.pal.push({ cid: d.cid, item: k.item }); mark(); return true;
      }
      case "co_cunload": {
        const cr = car(); if (!cr || cr.at !== "PT" || !(cr.pal || []).length) return true;
        cr.pal.forEach((p) => { const k = c.acc[p.cid]; if (live(k)) c.dock[p.cid] = (c.dock[p.cid] || 0) + 1; else if (goodsUsed(c) + PALLET <= A.cap(c)) c.goods[p.item] = (c.goods[p.item] || 0) + PALLET; }); cr.pal = []; mark(); return true;
      }
      case "co_cback": {
        const cr = car(); if (!cr || cr.at !== "CO" || !(cr.pal || []).length) return true;
        cr.pal.forEach((p) => { if (live(c.acc[p.cid])) c.pack[p.cid] = (c.pack[p.cid] || 0) + 1; else c.goods[p.item] = (c.goods[p.item] || 0) + PALLET; }); cr.pal = []; mark(); return true;
      }
      case "co_ship": {
        const k = acc(); if (!live(k) || t > k.ddl || (c.dock[d.cid] || 0) * PALLET < k.qty) return true;
        const early = k.ddl - t > (k.ddl - k.t) / 2, bonus = early ? Math.round(k.reward * 0.12) : 0;
        S.coins += k.reward + bonus; k.done = true; k.paid = k.reward + bonus; k.early = early; delete c.dock[d.cid]; c.done++; c.rep++; c.led.rev += k.reward + bonus; c.led.exported += k.qty; c.shipT = t; c.shipCid = d.cid;
        log(c, t, `🚢 شحنّا ${k.qty} ${GOODS[k.item].n} — ربحنا ${k.reward + bonus}🪙`); mark(); return true;
      }
      case "co_fix": { const is = c.iss[d.id]; if (!is || is.done || is.fail) return true; const cost = A.repairCost(S, is); if (S.coins < cost) return true; spend(cost); fixIssue(S, is, t, false); mark(); return true; }
    }
    return true;
  };

  /* =====================================================================
     الواجهة: نوافذ المقر والمصانع والمخزن والميناء والإصلاح
     ===================================================================== */
  const cur = (A.cur = { tab: "ov", plant: "mill", field: "f0", fix: null, aw: null, car: null });
  const toast = (m, c, ms) => ui().toast(m, c || "", ms), sfx = (n) => OSW.audio && OSW.audio.sfx(n), hearts = (e, n) => ui().hearts && ui().hearts(e, n || 8);
  const S_ = () => G().state(), C_ = () => co(S_());
  const coinBar = () => `<div class="coinbar">🪙 <b>${S_().coins}</b></div>`;
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${name}</b><small>${sub || ""}</small></div><div class="ib">${btns || ""}</div></div>`;
  const meter = (l, v, max, col) => `<div class="mrow"><span>${l}</span><div class="mbar"><i style="width:${Math.max(0, Math.min(100, Math.round((v / max) * 100)))}%;background:${col || "#4caf50"}"></i></div><b>${Math.round(v)}</b></div>`;
  const btn = (act, label, data, cls, dis) => `<button class="btn sm ${cls || "gold"}" data-act="g-co-${act}" ${Object.keys(data || {}).map((k) => `data-${k}="${esc(data[k])}"`).join(" ")} ${dis ? "disabled" : ""}>${label}</button>`;
  const left = (ms) => { const m = Math.max(0, Math.ceil(ms / MIN)); return m >= 1440 ? Math.floor(m / 1440) + " يوم " + Math.floor((m % 1440) / 60) + " س" : m >= 60 ? Math.floor(m / 60) + " س " + (m % 60) + " د" : m + " د"; };
  const itemName = (k) => (GOODS[k] ? GOODS[k].e + " " + GOODS[k].n : (G().ITEM[k] ? G().ITEM[k].e + " " + G().ITEM[k].n : k));
  const ctryOf = (id) => COUNTRIES.find((x) => x.id === id) || COUNTRIES[0];
  const fieldName = (id) => (fieldById(id) || {}).n || id;
  const me = () => W() && W()._int && W()._int.me;
  A.near = (loc, r) => { const m = me(); return !!m && Math.hypot(m.x - loc.x, m.z - loc.z) < (r || 15); };
  A.goTo = (loc) => {
    ui().closeModal(); const w = W(), m = me(); if (!w || !m) return;
    if (w.mode !== "out") return toast("اطلعوا من البيت أول 🚪");
    if (m.veh) return toast("🚪 انزلوا من السيارة أول (بتمشوا على رجليكم للموقع)");
    if (loc.z > 1000 && m.z < 1000) return toast("🏝️ الموقع بالجزيرة الثانية: لازم تسوقوا بالسيارة على الطريق الطويل");
    w.goTo(loc.x, loc.z);
  };
  const open = (id) => P().open(id);
  const noCo = () => `<div class="empty"><span class="big">🏢</span>الشركة لسا ما اتأسست. اذهبوا لمكتب <b>الإدارة</b> بالمقر 🌾</div>`;

  /* ---------- لوحات صغيرة ---------- */
  function issueBox(is, S) {
    const loc = A.issueLoc(S, is), near = A.near(loc, 16), cost = A.repairCost(S, is), K = KINDS[is.kind];
    return `<div class="chk" style="margin:6px 0;border-right:4px solid #e63946"><b>${A.issueName(S, is)}</b>${is.ddl ? `<small> · ⏳ ${left(is.ddl - Date.now())} قبل ما يتلف</small>` : ""}<div class="hint">${A.issueHelp(is)}</div>
      <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">${near ? btn("fix", `🔧 ${is.kind === "staff" ? "اعطيه علاوة" : is.kind === "blight" ? "رشّ مبيد" : is.kind === "water" ? "عبّي المياه" : "أصلح"} · ${cost}🪙`, { id: is.id }, "gold", S.coins < cost) : btn("goto", "🚶 روح للموقع", { id: is.id }, "berry")}${btn("pin", "📍 تفاصيل", { id: is.id }, "alt")}</div></div>`;
  }
  const workerChip = (w) => `${ROLES[w.role].e} ${esc(w.name)}${"⭐".repeat(w.sk)}${w.strike ? " 🪧مضرب" : w.sick ? " 🤒" : ""}`;

  /* ---------- نافذة المقر الرئيسية (بتتغير حسب المكتب) ---------- */
  const TABS = [["ov", "🏢 الإدارة"], ["fl", "🌾 الأراضي"], ["pr", "🏭 الإنتاج"], ["wk", "👷 العمال"], ["st", "📦 المخازن"], ["ct", "📜 العقود"], ["sl", "💰 المبيعات"]];
  G().openers.co = () => {
    const S = S_(), c = co(S), tab = cur.tab;
    const bar = `<div class="seg" style="margin:6px 0 10px">${TABS.map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="g-co-tab" data-k="${k}">${n}</button>`).join("")}</div>`;
    const body = !c.on ? (tab === "ov" || true ? foundView(S) : "") : { ov: ovView, fl: flView, pr: prView, wk: wkView, st: stView, ct: ctView, sl: slView }[tab](S, c);
    ui().openModal(`<h3>🏢 ${esc(c.on ? c.name : "الشركة الزراعية")}</h3>${coinBar()}${c.on ? bar : ""}${body}`);
  };
  function foundView(S) {
    return `<div class="chk" style="margin:8px 0">🌾 حوّلوا مزرعتكم لشركة زراعية حقيقية: عمال ورواتب، جرارات وري، مصانع (طحين ← خبز، حليب ← زبدة وجبنة، فواكه ← عصير ومربى)، وعقود تصدير لدول خيالية بالسفينة 🚢</div>
      <ul class="hint" style="margin:6px 18px;line-height:1.9"><li>المقر فيه 6 مكاتب (الإدارة، الأراضي، العمال، المخازن، العقود، المبيعات).</li><li>العمال بيشتغلوا لحالهم بس بياخدوا راتب يومي من مصاريفكم المشتركة.</li><li>بتطلع مشاكل (عطل جرار، نقص مياه، آفة، عطل مصنع…) ولازم حدا منكم يروح ويصلحها.</li><li>كل المزارع والمصانع والميناء بتشوفوها بالقرية والجزيرة.</li></ul>
      <input id="coName" class="in" maxlength="22" placeholder="اسم الشركة (مثلاً: مزارع الحب)" style="margin:8px 0;width:100%"><div class="row">${btn("found", `🏢 أسّسوا الشركة · ${FOUND_COST}🪙`, {}, "berry", S.coins < FOUND_COST)}</div>`;
  }
  function ovView(S, c) {
    const iss = activeIssues(c), net = c.led.rev - c.led.exp, hq = HQ_LV[c.hq - 1], nx = HQ_LV[c.hq], days = Math.max(0, dayOf(Date.now()) - dayOf(c.t0));
    const running = Object.keys(c.pl).filter((k) => c.pl[k].built && c.pl[k].job).length, wk = c.w.filter(active).length;
    const alerts = iss.length ? iss.map((is) => issueBox(is, S)).join("") : `<div class="chk" style="margin:6px 0">✅ ما في مشاكل هلأ. الشركة ماشية تمام 👌</div>`;
    return `<div class="chk" style="margin:6px 0">📅 عمر الشركة ${days} يوم · ⭐ السمعة ${c.rep} · 🚢 ${c.done} شحنة · 👷 ${wk}/${c.w.length} عمال شغّالين · 🏭 ${running} مصنع شغّال · 🚜 ${c.tr.length} جرار</div>
      <b>⚠️ المشاكل (${iss.length})</b>${alerts}
      <b>💹 الحسابات</b><div class="items" style="margin:6px 0">${irow("📈", "إيرادات", `بيع وتصدير: <b>${c.led.rev}🪙</b>`)}${irow("📉", "مصاريف", `رواتب ${c.led.wages} · الباقي ${c.led.exp - c.led.wages}🪙`)}${irow(net >= 0 ? "✅" : "🔻", "الصافي", `<b>${net}🪙</b> · خسائر تلف: ${c.led.lost} وحدة · إصلاحات: ${c.led.fixed}`)}</div>
      <b>🏢 المقر (مستوى ${c.hq}/3)</b><div class="hint">سعة ${hq.cap} عامل · ${hq.tr} جرارات${nx ? "" : " · أعلى مستوى ✅"}</div>${nx ? `<div class="row" style="margin:6px 0">${btn("hqup", `⬆️ وسّعوا المقر · ${nx.cost}🪙 (${nx.cap} عامل، ${nx.tr} جرارات)`, {}, "gold", S.coins < nx.cost)}</div>` : ""}
      <b>📰 آخر الأخبار</b><div class="items" style="margin:6px 0">${c.log.length ? c.log.slice(0, 8).map((l) => `<div class="hint" style="padding:3px 0">• ${esc(l.m)}</div>`).join("") : '<div class="hint">لسا ما صار شي</div>'}</div>
      <p class="hint">الرواتب بتنخصم كل يوم تلقائي. إذا نقصت المصاري العمال بيضربوا.</p>`;
  }
  function flView(S, c) {
    const C = cropsOf();
    const rows = FIELDS.map((f) => {
      const own = owns(S, f), v = G().view(), pl = f.plots.map((i) => v.plots[i]).filter(Boolean), rp = pl.filter((p) => p.ripe).length, fs = workersOn(c, "farmer", f.id), trs = c.tr.filter((t) => t.field === f.id);
      return irow(own ? "🌾" : "🔒", f.n, own ? `${pl.length}/${f.plots.length} مزروع${rp ? " · 🧺 " + rp + " جاهز" : ""} · ${c.plan[f.id] ? "خطة: " + C[c.plan[f.id]].e : "بدون خطة زراعة"}<br>💧 ${IRR.names[c.irr[f.id] || 0]}${c.dry[f.id] ? " ⚠️ ناشف" : ""} · 👨‍🌾 ${fs.length} · 🚜 ${trs.length}${c.blight[f.id] ? " · 🐛 آفة" : ""}` : "اشتروا الأرض من سوق الأراضي أول", own ? btn("field", "تفاصيل ›", { id: f.id }, "gold") : "");
    }).join("");
    const trs = c.tr.map((t, i) => { const dr = c.w.find((w) => w.role === "driver" && w.to === t.id); return irow(t.broken ? "🔧" : "🚜", `جرار #${i + 1}`, `${t.field ? "على: " + fieldName(t.field) : "واقف بالمخزن"} · سائق: ${dr ? workerChip(dr) : "ما في"}${t.broken ? " · ⚠️ معطّل" : ""}`, btn("field", "تعيين ›", { id: t.field || "f0", tr: t.id }, "alt")); }).join("");
    return `<p class="hint">كل أرض بتتشغّل بالعمال لحالها: بيقطفوا ويزرعوا المحصول اللي بتختاروه، والمحاصيل بتنزل لمخزن المزرعة (نفس المخزن المعتاد).</p><div class="items">${rows}</div>
      <b>🚜 الجرارات (${c.tr.length}/${HQ_LV[c.hq - 1].tr})</b><div class="items" style="margin:6px 0">${trs || '<div class="hint">ما عندكم جرارات. الجرار + سائق = الأرض بتشتغل مرتين أسرع وبتنحرث (نمو أسرع 8%)</div>'}</div>
      <div class="row">${btn("tbuy", `🚜 اشتروا جرار · ${TRACTOR_COST}🪙`, {}, "gold", c.tr.length >= HQ_LV[c.hq - 1].tr || S.coins < TRACTOR_COST)}</div>`;
  }
  function prView(S, c) {
    const rows = Object.keys(PLANTS).map((id) => {
      const PL = PLANTS[id], pl = c.pl[id], j = pl.job, ws = workersOn(c, "factory", id);
      const sub = !pl.built ? `ما انبنى · ${PL.cost}🪙` : `مستوى ${pl.lv}/3 · ${pl.broken ? "⚠️ معطّل" : j ? `⚙️ ${itemName(j.rec)} · باقي ${left(j.end - Date.now())}` : "واقف"} · 👷 ${ws.length}${pl.auto ? " · 🔁 تلقائي" : ""}`;
      return irow(PL.e, PL.n, sub, btn("plant", "فتح ›", { id }, "gold"));
    }).join("");
    return `<p class="hint">سلاسل الإنتاج: 🌾 قمح ← 🥡 طحين ← 🥖 خبز · 🥛 حليب ← 🧈 زبدة / 🧀 جبنة · 🍓🍇🍋🍉 فواكه ← 🍯 مربى وعصائر. المصانع بجنوب شرق القرية (المنطقة الصناعية). المنتجات بتروح لمخزن الشركة.</p><div class="items">${rows}</div>
      <div class="row" style="margin-top:8px">${btn("goto-p", "🚶 روح للمنطقة الصناعية", { id: "mill" }, "berry")}</div>`;
  }
  function wkView(S, c) {
    const cap = HQ_LV[c.hq - 1].cap, daily = c.w.reduce((n, w) => n + (w.strike ? 0 : w.wage), 0), strikers = c.w.filter((w) => w.strike).length;
    const list = c.w.map((w) => {
      const tg = A.targets(S, w.role), cur_ = tg.find((x) => x.id === w.to);
      let row = irow(ROLES[w.role].e, workerChip(w), `${ROLES[w.role].n} · ${w.wage}🪙/يوم · ${cur_ ? "📌 " + cur_.n : "<b>بدون تعيين</b>"}`, `${btn("aw", "📌 عيّن", { w: w.id }, "gold")}${btn("fire", "✖", { w: w.id }, "alt")}`);
      if (cur.aw === w.id) row += `<div class="chk" style="margin:4px 0">${tg.length ? tg.map((x) => btn("assign", x.n, { w: w.id, to: x.id }, "gold")).join(" ") : '<small>ما في أهداف متاحة لهالدور هلأ (ابنوا مصنع / اشتروا جرار / اشتروا أرض)</small>'} ${w.to ? btn("assign", "إلغاء التعيين", { w: w.id, to: "" }, "alt") : ""}</div>`;
      return row;
    }).join("");
    const day = dayOf(Date.now()), cs = A.cands(day).filter((x) => !c.hired[x.key]);
    const cand = cs.map((x) => irow(ROLES[x.role].e, `${esc(x.name)} ${"⭐".repeat(x.sk)}`, `${ROLES[x.role].n} · ${x.wage}🪙/يوم (أول يوم بيندفع فوراً)`, btn("hire", "وظّف", { i: x.i, day: x.day }, "gold", c.w.length >= cap || S.coins < x.wage))).join("");
    return `<div class="chk" style="margin:6px 0">👷 ${c.w.length}/${cap} · الرواتب اليومية: <b>${daily}🪙</b> (بتنخصم كل صباح)${strikers ? `<br>🪧 ${strikers} مضربين! ${btn("pay", "💸 ادفعوا الرواتب", {}, "berry")}` : ""}</div>
      <b>الطاقم</b><div class="items" style="margin:6px 0">${list || '<div class="hint">ما في عمال. وظّفوا من القائمة تحت 👇</div>'}</div>
      <b>🧑‍💼 مرشحين اليوم (بيتجددوا كل يوم)</b><div class="items" style="margin:6px 0">${cand || '<div class="hint">وظّفتوا كل مرشحين اليوم</div>'}</div>
      <p class="hint">${Object.keys(ROLES).map((k) => ROLES[k].e + " " + ROLES[k].n + ": " + ROLES[k].note).join("<br>")}</p>`;
  }
  function stView(S, c) {
    const used = goodsUsed(c), cap = A.cap(c), C = cropsOf(), raw = Object.keys(C).concat(["milk"]).filter((k) => (S.inv[k] || 0) > 0).map((k) => `<span class="tag">${itemName(k)} ${S.inv[k]}</span>`).join(" ");
    const gl = Object.keys(c.goods).map((k) => irow(GOODS[k].e, GOODS[k].n, `${c.goods[k]} وحدة${GOODS[k].perish ? " · ❄️ بيحتاج تبريد" : ""} · سعر الجملة اليوم ${A.price(k, dayOf(Date.now()))}🪙`, "")).join("");
    const nx = WH_UP[(c.wh || 0) + 1];
    return `<b>🌾 مواد خام (مخزن المزرعة)</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${raw || '<small class="hint">فاضي</small>'}</div><p class="hint">المواد الخام بتجي من الأراضي والحيوانات، والمصانع بتسحب منها مباشرة.</p>
      <b>🏬 مخزن الشركة</b>${meter("🧺", used, cap, used > cap * 0.85 ? "#e63946" : "#4caf50")}${c.cold ? `<div class="chk" style="margin:6px 0">${issueBox(c.iss[c.cold], S)}</div>` : '<div class="hint">❄️ التبريد شغّال</div>'}
      <div class="items" style="margin:6px 0">${gl || '<div class="empty">المخزن فاضي. شغّلوا المصانع 🏭</div>'}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${nx ? btn("whup", `⬆️ وسّعوا المخزن · ${nx}🪙 (سعة ${WH_CAP[(c.wh || 0) + 1]})`, {}, "gold", S.coins < nx) : "<small>✅ أعلى سعة</small>"}${btn("goto-w", "🚶 روح للمخزن", {}, "berry")}</div>`;
  }
  function ctView(S, c) {
    const now = Date.now(), p = A.period(now), offers = A.offers(p).filter((o) => !c.acc[o.id]), liveN = Object.values(c.acc).filter((k) => !k.done && !k.fail).length;
    const accs = Object.values(c.acc).filter((k) => !k.done && !k.fail).map((k) => {
      const pp = A.palletsOf(S, k.id), need = k.qty / PALLET, ct = ctryOf(k.ctry), ready = pp.dock * PALLET >= k.qty;
      return irow(ct.e, `${ct.n}: ${k.qty} ${itemName(k.item)}`, `⏳ باقي ${left(k.ddl - now)} · 🪙 ${k.reward} (+12% لو بدري)<br>📦 تجهيز ${pp.pack} · 🚚 بالسيارات ${pp.car} · ⚓ بالميناء ${pp.dock} / ${need} طبليات`, ready ? btn("goto-port", "🚢 جاهز للشحن!", {}, "berry") : btn("goto-w", "جهّز ›", {}, "gold"));
    }).join("");
    const offs = offers.map((o) => { const ct = ctryOf(o.ctry); return irow(ct.e, `${ct.n} بدها ${o.qty} ${itemName(o.item)}`, `مهلة ${Math.round(o.dur / DAY)} أيام بعد القبول · مكافأة <b>${Math.round(o.reward * (1 + 0.02 * Math.min(c.rep, 10)))}🪙</b> (سعر الجملة ${GOODS[o.item].base * o.qty})`, btn("accept", "✍️ اقبل العقد", { id: o.id }, "gold", liveN >= 3)); }).join("");
    const done = Object.values(c.acc).filter((k) => k.done).length;
    return `<div class="chk" style="margin:6px 0">⭐ السمعة ${c.rep} (بتزيد المكافآت 2% لكل نقطة، لحد 20%) · عقود منتهية بنجاح: ${done} · عقود شغّالة: ${liveN}/3</div>
      <b>📜 عقودكم الشغّالة</b><div class="items" style="margin:6px 0">${accs || '<div class="hint">ما في عقود شغّالة. اقبلوا واحد من تحت 👇</div>'}</div>
      <b>🌍 عروض التصدير (بتتجدد كل يومين)</b><div class="items" style="margin:6px 0">${offs || '<div class="hint">قبلتوا كل العروض الحالية</div>'}</div>
      <p class="hint">طريقة الشحن: جهّزوا الطبليات من مخزن الشركة 📦 ← حمّلوها بسيارة بموقف الشركة 🚚 ← سوقوا للميناء بالجزيرة الثانية 🏝️ ← فرّغوها ثم اشحنوا بالسفينة 🚢. (الطبلية = 5 وحدات)</p>`;
  }
  function slView(S, c) {
    const day = dayOf(Date.now()), rows = Object.keys(GOODS).map((k) => { const n = c.goods[k] || 0; return irow(GOODS[k].e, GOODS[k].n, `عندكم ${n} · سعر اليوم <b>${A.price(k, day)}🪙</b> ${A.trend(k, day)} (الأساسي ${GOODS[k].base})`, n ? `${btn("sell", "بيع 1", { k, q: 1 })}${n >= 5 ? btn("sell", "بيع 5", { k, q: 5 }) : ""}${btn("sell", "الكل", { k, q: n }, "alt")}` : ""); }).join("");
    return `<p class="hint">البيع المحلي للتجار بسعر الجملة. التصدير بيدفع أكتر بكتير (من +55% لـ +115%) بس بده شحن ومهلة ⏳.</p><div class="items">${rows}</div>`;
  }

  /* ---------- نافذة الأرض ---------- */
  G().openers.cofield = () => {
    const S = S_(), c = co(S), f = fieldById(cur.field); if (!c.on || !f) return open("co");
    const C = cropsOf(), lv = c.irr[f.id] || 0, own = owns(S, f), v = G().view(), pl = f.plots.map((i) => v.plots[i]).filter(Boolean), fs = c.w.filter((w) => w.role === "farmer" && w.to === f.id);
    const crops = Object.keys(C).map((k) => `<button class="${c.plan[f.id] === k ? "on" : ""}" data-act="g-co-plan" data-f="${f.id}" data-k="${k}">${C[k].e}</button>`).join("");
    const trs = c.tr.map((t, i) => irow(t.broken ? "🔧" : "🚜", `جرار #${i + 1}`, t.field === f.id ? "✅ شغّال هون" : t.field ? "على " + fieldName(t.field) : "واقف بالمخزن", t.field === f.id ? btn("tfield", "رجّعه", { id: t.id, f: "" }, "alt") : btn("tfield", "حطّه هون", { id: t.id, f: f.id }, "gold"))).join("");
    const iss = [c.dry[f.id], c.blight[f.id]].filter(Boolean).map((id) => c.iss[id]).filter(Boolean).map((is) => issueBox(is, S)).join("");
    ui().openModal(`<h3>🌾 ${esc(f.n)}</h3>${coinBar()}${iss}
      <div class="chk" style="margin:6px 0">${pl.length}/${f.plots.length} مزروع · ${pl.filter((p) => p.ripe).length} جاهز · 👨‍🌾 ${fs.length} مزارع${mech(c, f) ? " · 🚜 ميكنة شغّالة" : ""}</div>
      <b>🌱 المحصول اللي بيزرعه العمال</b><div class="seg" style="margin:6px 0;flex-wrap:wrap"><button class="${!c.plan[f.id] ? "on" : ""}" data-act="g-co-plan" data-f="${f.id}" data-k="">بدون</button>${crops}</div><p class="hint">العمال بيقطفوا الجاهز ويزرعوا هالمحصول (بتنخصم البذور). لو ما في عمال، ازرعوا بإيديكم زي العادة.</p>
      <b>💧 الري: ${IRR.names[lv]}</b><div class="hint">${lv ? `نمو أسرع ${Math.round((1 - IRR.mul[lv]) * 100)}% — بس لو المضخة تعطلت بيرجع أبطأ.` : "بدون ري. الرشّاشات: نمو أسرع 12%، التنقيط: 24%."}</div>
      <div class="row" style="margin:6px 0">${lv < 2 ? btn("irr", `💧 ${lv ? "طوّروه لتنقيط" : "ركّبوا رشّاشات"} · ${IRR.cost[lv] * f.plots.length}🪙`, { f: f.id }, "gold", S.coins < IRR.cost[lv] * f.plots.length || !own) : "<small>✅ أعلى مستوى</small>"}</div>
      <b>🚜 الجرارات</b><div class="items" style="margin:6px 0">${trs || '<div class="hint">ما عندكم جرارات (اشتروا من تبويب الأراضي)</div>'}</div>
      <b>👨‍🌾 العمال المعيّنين</b><div style="margin:6px 0">${fs.map(workerChip).join(" · ") || '<span class="hint">ما في. عيّنوا مزارعين من مكتب العمال</span>'}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${btn("goto-f", "🚶 روح للأرض", { f: f.id }, "berry")}${btn("hq", "↩️ المقر", { k: "fl" }, "alt")}</div>`);
  };
  /* ---------- نافذة المصنع ---------- */
  G().openers.coplant = () => {
    const S = S_(), c = co(S), id = cur.plant, PL = PLANTS[id], pl = c.pl[id]; if (!c.on || !PL) return open("co");
    const now = Date.now(), ws = workersOn(c, "factory", id), j = pl.job;
    let st = !pl.built ? `<div class="chk" style="margin:6px 0">🏗️ أرض مصنع جاهزة. التكلفة <b>${PL.cost}🪙</b> وبتحتاجوا عامل مصنع 👷</div><div class="row">${btn("pbuild", `🏗️ ابنوا ${PL.n} · ${PL.cost}🪙`, { id }, "berry", S.coins < PL.cost)}</div>` : "";
    if (pl.built) {
      const iss = pl.broken ? issueBox(c.iss[pl.broken], S) : "";
      const prog = j ? `<div class="chk" style="margin:6px 0">⚙️ بتصنّع <b>${itemName(j.rec)}</b> (x${recOut(j.rec, j.lv).reduce((s, o) => s + o[1], 0)}) · باقي ${left(j.end - now)}${j.wait ? " · ⛔ المخزن ممتلي!" : ""}${meter("", Math.min(100, ((now - j.t0) / Math.max(1, j.end - j.t0)) * 100), 100, "#e9c46a")}</div>` : "";
      const recs = Object.keys(RECIPES).filter((k) => RECIPES[k].plant === id).map((k) => {
        const ins = recIn(k, pl.lv).map(([m, n]) => `${itemName(m)} ${have(S, m)}/${n}`).join(" + "), outs = recOut(k, pl.lv).map(([m, n]) => `${n} ${itemName(m)}`).join(" + "), why = A.canRun(S, id, k);
        return irow(GOODS[k].e, `${ins} ← ${outs}`, `⏱️ ${Math.round(A.jobDur(S, id, k) / MIN)} د${why && !j ? " · ⛔ " + why : ""}${pl.rec === k && pl.auto ? " · 🔁" : ""}`, `${btn("run", "▶️ شغّل", { id, k }, "gold", !!why)}${btn("auto", pl.auto && pl.rec === k ? "⏹ ألغي التلقائي" : "🔁 تلقائي", { id, k, on: pl.auto && pl.rec === k ? 0 : 1 }, "alt")}`);
      }).join("");
      st = `${iss}<div class="chk" style="margin:6px 0">مستوى ${pl.lv}/3 · 👷 ${ws.length ? ws.map(workerChip).join(" · ") : "<b>ما في عامل!</b> عيّنوا عامل مصنع من مكتب العمال"} · السرعة ×${Math.min(3, ws.reduce((s, w) => s + effOf(w), 0)).toFixed(2)}</div>${prog}
        <b>📋 الوصفات</b><div class="items" style="margin:6px 0">${recs}</div><p class="hint">التلقائي: لما تخلص دفعة بتبدأ التالية لحالها طالما المواد موجودة والعامل موجود.</p>
        <div class="row" style="gap:6px;flex-wrap:wrap">${pl.lv < 3 ? btn("pup", `⬆️ طوّروا المصنع · ${Math.round(PL.cost * 0.8 * pl.lv)}🪙 (دفعات أكبر)`, { id }, "gold", S.coins < Math.round(PL.cost * 0.8 * pl.lv)) : "<small>✅ أعلى مستوى</small>"}</div>`;
    }
    ui().openModal(`<h3>${PL.e} ${PL.n}</h3>${coinBar()}${st}<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${btn("hq", "↩️ المقر", { k: "pr" }, "alt")}${btn("goto-p", "🚶 روح للمصنع", { id }, "berry")}</div>`);
  };
  /* ---------- نافذة مخزن الشركة (تجهيز + تحميل) ---------- */
  G().openers.cowh = () => {
    const S = S_(), c = co(S); if (!c.on) return open("co");
    const gl = Object.keys(c.goods).map((k) => `<span class="tag">${itemName(k)} ${c.goods[k]}</span>`).join(" ") || '<small class="hint">فاضي</small>';
    const live = Object.values(c.acc).filter((k) => !k.done && !k.fail);
    const cars = V().owned().filter((x) => V().atOf(x) === "CO");
    const rows = live.map((k) => {
      const pp = A.palletsOf(S, k.id), need = k.qty / PALLET, ct = ctryOf(k.ctry), canPack = Math.floor((c.goods[k.item] || 0) / PALLET), remain = need - pp.pack - pp.car - pp.dock;
      let btns = remain > 0 ? btn("pack", "📦 جهّز 1", { cid: k.id, n: 1 }, "gold", canPack < 1) + (remain > 1 ? btn("pack", "جهّز الكل", { cid: k.id, n: remain }, "gold", canPack < 1) : "") : "";
      if (pp.pack) btns += btn("unpack", "↩️", { cid: k.id }, "alt");
      let ld = ""; if (pp.pack) ld = cars.map((cr) => { const cap = V().CARS[cr.car].cargo, room = cap - (cr.crates || []).length - (cr.pal || []).length; return btn("cload", `🚚 حمّل ${V().CARS[cr.car].n} (${Math.min(room, pp.pack)})`, { car: cr.id, cid: k.id, n: pp.pack }, "berry", room < 1); }).join(" ");
      return irow(ct.e, `${k.qty} ${itemName(k.item)} → ${ct.n}`, `📦 جاهز ${pp.pack} · 🚚 محمّل ${pp.car} · ⚓ بالميناء ${pp.dock} / ${need} طبلية · ⏳ ${left(k.ddl - Date.now())}`, btns) + (ld ? `<div class="chk" style="margin:2px 0 6px">${ld}</div>` : "");
    }).join("");
    const carRows = cars.map((cr) => { const n = (cr.pal || []).length; return irow(V().CARS[cr.car].e, V().CARS[cr.car].n, n ? `محمّلة ${n} طبلية` : "فاضية", n ? btn("cback", "⬇️ فرّغها هون", { car: cr.id }, "alt") : ""); }).join("");
    ui().openModal(`<h3>🏬 مخزن الشركة</h3>${coinBar()}
      ${c.cold ? issueBox(c.iss[c.cold], S) : ""}
      <b>المنتجات (${goodsUsed(c)}/${A.cap(c)})</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${gl}</div>
      <b>📜 تجهيز شحنات التصدير</b><div class="items" style="margin:6px 0">${rows || '<div class="hint">ما في عقود شغّالة. اقبلوا عقد من مكتب العقود 📜</div>'}</div>
      <b>🅿️ السيارات بموقف الشركة (شرق المخزن)</b><div class="items" style="margin:6px 0">${carRows || '<div class="hint">ركّوا سيارة بموقف الشركة عشان تحمّلوا الطبليات. البكم (🛻) بيشيل أكتر شي.</div>'}</div>
      <div class="row" style="gap:6px"><button class="btn alt sm" data-act="g-co-hq" data-k="st">↩️ المقر</button></div>`);
  };
  /* ---------- نافذة الميناء ---------- */
  G().openers.coport = () => {
    const S = S_(), c = co(S); if (!c.on) return ui().openModal(`<h3>🚢 ميناء التصدير</h3>${noCo()}`);
    const cars = V().owned().filter((x) => V().atOf(x) === "PT"), now = Date.now();
    const live = Object.values(c.acc).filter((k) => !k.done && !k.fail);
    const rows = live.map((k) => {
      const pp = A.palletsOf(S, k.id), need = k.qty / PALLET, ct = ctryOf(k.ctry), ready = pp.dock * PALLET >= k.qty, early = k.ddl - now > (k.ddl - k.t) / 2;
      return irow(ct.e, `${ct.n}: ${k.qty} ${itemName(k.item)}`, `⚓ ${pp.dock}/${need} طبلية بالميناء · 🚚 ${pp.car} بالطريق · ⏳ ${left(k.ddl - now)}<br>🪙 ${k.reward}${early ? " + 12% مكافأة شحن بدري" : ""}`, btn("ship", "🚢 اشحن", { cid: k.id }, "berry", !ready));
    }).join("");
    const carRows = cars.map((cr) => { const n = (cr.pal || []).length; return irow(V().CARS[cr.car].e, V().CARS[cr.car].n, n ? `${n} طبلية` : "فاضية", n ? btn("cunload", "⬇️ فرّغ بالميناء", { car: cr.id }, "gold") : ""); }).join("");
    const since = now - (c.shipT || 0);
    ui().openModal(`<h3>🚢 ميناء التصدير</h3>${coinBar()}
      <div class="chk" style="margin:6px 0">${c.shipT && since < 240000 ? "🚢 السفينة غادرت وبترجع بعد شوي…" : "⚓ السفينة راسية بالميناء وجاهزة للتحميل"} · 🚢 ${c.done} شحنات · ⭐ ${c.rep}</div>
      <b>🅿️ سيارات بموقف الميناء</b><div class="items" style="margin:6px 0">${carRows || '<div class="hint">وصّلوا السيارة المحمّلة لموقف الميناء (جنوب شرق الجزيرة) وركّوها هون.</div>'}</div>
      <b>📜 العقود</b><div class="items" style="margin:6px 0">${rows || '<div class="hint">ما في عقود شغّالة. اقبلوا عقد من مقر الشركة 🏢</div>'}</div>
      <p class="hint">لما الطبليات كلها توصل للميناء بتقدروا تشحنوا: السفينة بتتحمّل وبتبحر، وبتنزل المكافأة فوراً. إذا خلص الموعد بينلغي العقد وبتنقص السمعة.</p>`);
  };
  /* ---------- نافذة المشكلة ---------- */
  G().openers.cofix = () => {
    const S = S_(), c = co(S), is = c.on && c.iss[cur.fix]; if (!is) return ui().closeModal();
    if (is.done || is.fail) return ui().openModal(`<h3>${KINDS[is.kind].e} ${A.issueName(S, is).replace(/^\S+\s/, "")}</h3><div class="chk">${is.done ? "✅ انحلّت المشكلة" : "❌ انتهى الموعد وصارت الخسارة"}</div>`);
    ui().openModal(`<h3>⚠️ مشكلة تحتاج تدخّل</h3>${coinBar()}${issueBox(is, S)}${mechanicOn(c) && (is.kind === "tractor" || is.kind === "plant") ? '<p class="hint">🔧 الميكانيكي بيصلّحها لحاله بعد 3 ساعات من الحدوث (بنص السعر).</p>' : ""}`);
  };

  /* ---------- نقرات الأزرار ---------- */
  const plantFront = (id) => ({ x: PLANTS[id].x, z: PLANTS[id].z - 7.5 });
  const fieldFront = (f) => ({ x: f.cx, z: f.cz + f.hd + 1.8 });
  A.click = async (a, el) => {
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } }, D = (ty, data) => G().do(ty, data), S = S_();
    switch (a) {
      case "g-co-tab": cur.tab = d.k; cur.aw = null; return open("co");
      case "g-co-hq": cur.tab = d.k || "ov"; return open("co");
      case "g-co-found": return busy(async () => { const nm = ((document.getElementById("coName") || {}).value || "").trim(); await D("co_found", { name: nm }); sfx("fanfare"); hearts("🏢", 14); toast("🏢 مبروك! تأسست شركتكم الزراعية", "gold"); });
      case "g-co-hqup": return busy(async () => { await D("co_hqup", {}); sfx("fanfare"); toast("🏢 توسّع المقر!", "gold"); });
      case "g-co-whup": return busy(async () => { await D("co_whup", {}); sfx("coin"); toast("🏬 توسّع مخزن الشركة", "gold"); });
      case "g-co-hire": return busy(async () => { await D("co_hire", { day: +d.day, i: +d.i }); sfx("pop"); toast("👷 تم التوظيف! عيّنوه بمكان شغل"); });
      case "g-co-fire": return busy(async () => { await D("co_fire", { w: d.w }); sfx("pop"); });
      case "g-co-aw": cur.aw = cur.aw === d.w ? null : d.w; return open("co");
      case "g-co-assign": return busy(async () => { await D("co_assign", { w: d.w, to: d.to }); cur.aw = null; sfx("pop"); });
      case "g-co-pay": return busy(async () => { await D("co_pay", {}); sfx("coin"); toast("💸 انصرفت الرواتب"); });
      case "g-co-field": cur.field = d.id; return open("cofield");
      case "g-co-plan": return busy(async () => { await D("co_plan", { field: d.f, crop: d.k }); sfx("pop"); });
      case "g-co-irr": return busy(async () => { await D("co_irr", { field: d.f }); sfx("magic"); toast("💧 تركّب نظام الري!", "gold"); });
      case "g-co-tbuy": return busy(async () => { await D("co_tbuy", {}); sfx("fanfare"); toast("🚜 وصل جرار جديد للمخزن", "gold"); });
      case "g-co-tfield": return busy(async () => { await D("co_tfield", { id: d.id, field: d.f }); sfx("pop"); });
      case "g-co-plant": cur.plant = d.id; return open("coplant");
      case "g-co-pbuild": return busy(async () => { await D("co_pbuild", { plant: d.id }); sfx("fanfare"); hearts(PLANTS[d.id].e, 12); toast(`${PLANTS[d.id].e} اتبنى ${PLANTS[d.id].n}! عيّنوا عامل مصنع`, "gold"); });
      case "g-co-pup": return busy(async () => { await D("co_pup", { plant: d.id }); sfx("fanfare"); toast("⬆️ تطوّر المصنع", "gold"); });
      case "g-co-run": return busy(async () => { await D("co_run", { plant: d.id, rec: d.k }); sfx("magic"); toast("⚙️ بدأت الدفعة"); });
      case "g-co-auto": return busy(async () => { await D("co_auto", { plant: d.id, rec: d.k, on: +d.on }); sfx("pop"); });
      case "g-co-sell": return busy(async () => { const b = S.coins; await D("co_sell", { item: d.k, q: +d.q }); sfx("coin"); hearts("🪙", 6); toast(`💰 بعتوا بـ ${S_().coins - b}🪙`, "gold"); });
      case "g-co-accept": return busy(async () => { await D("co_accept", { id: d.id }); sfx("fanfare"); toast("✍️ وقّعتوا العقد! جهّزوا الشحنة بمخزن الشركة", "gold"); });
      case "g-co-pack": return busy(async () => { await D("co_pack", { cid: d.cid, n: +d.n }); sfx("pop"); });
      case "g-co-unpack": return busy(async () => { await D("co_unpack", { cid: d.cid }); sfx("pop"); });
      case "g-co-cload": return busy(async () => { await D("co_cload", { car: d.car, cid: d.cid, n: +d.n }); sfx("pop"); toast("🚚 انحمّلت الطبليات! سوقوا للميناء بالجزيرة 🏝️", "", 3500); });
      case "g-co-cunload": return busy(async () => { await D("co_cunload", { car: d.car }); sfx("coin"); toast("⚓ نزلت الطبليات بالميناء", "gold"); });
      case "g-co-cback": return busy(async () => { await D("co_cback", { car: d.car }); sfx("pop"); });
      case "g-co-ship": return busy(async () => { const b = S.coins; await D("co_ship", { cid: d.cid }); const g = S_().coins - b; if (g > 0) { sfx("fanfare"); hearts("🚢", 16); toast(`🚢 انشحنت! ربحتوا ${g}🪙`, "gold", 5000); A.shipAnim = Date.now(); } });
      case "g-co-fix": return busy(async () => { const c = C_(), is = c.iss[d.id]; if (!is) return; if (!A.near(A.issueLoc(S, is), 17)) return toast("🚶 لازم تكون عند موقع المشكلة عشان تصلحها"); const b = S.coins; await D("co_fix", { id: d.id }); sfx(b > S_().coins ? "coin" : "pop"); hearts("🔧", 8); toast("🔧 انصلحت المشكلة!", "gold"); });
      case "g-co-pin": cur.fix = d.id; return open("cofix");
      case "g-co-goto": { const is = C_().iss[d.id]; return is && A.goTo(A.issueLoc(S, is)); }
      case "g-co-goto-p": return A.goTo(plantFront(d.id));
      case "g-co-goto-w": return A.goTo({ x: A.POS.wh.x, z: A.POS.wh.z - 10.5 });
      case "g-co-goto-f": return A.goTo(fieldFront(fieldById(d.f)));
      case "g-co-goto-port": return A.goTo({ x: A.POS.port.x, z: A.POS.port.z + 8 });
      case "g-co-gomap": { const k = d.k; if (k === "hq") return A.goTo({ x: -90, z: 81 }); if (k === "wh") return A.goTo({ x: A.POS.wh.x, z: A.POS.wh.z - 10.5 }); if (k === "port") return A.goTo({ x: A.POS.port.x, z: A.POS.port.z + 8 }); return A.goTo(plantFront(k)); }
    }
  };
  // نقرة على مكان بالعالم (act مثل co:hq:fl)
  A.act = (v) => {
    const [k, x] = v.split(":"), go = (id) => (OSW.app && OSW.app.goPlace ? OSW.app.goPlace(id) : P().open(id));
    if (k === "hq") { cur.tab = x || "ov"; cur.aw = null; return go("co"); }
    if (k === "plant") { cur.plant = x; return go("coplant"); }
    if (k === "field") { cur.field = x; return go("cofield"); }
    if (k === "wh") return go("cowh");
    if (k === "port") return go("coport");
    if (k === "fix") { cur.fix = x; return go("cofix"); }
    if (k === "depot") { cur.tab = "fl"; return go("co"); }
  };

  /* ---------- أوسمة العالم + تنبيهات المشاكل ---------- */
  let lblSig = "", seen = null;
  A.sync = () => {
    try {
      const w = W(); if (!w || !w.S || !w.S.ready || !db() || !db().me || !w.setDynLabels) return;
      const S = S_(), c = co(S), list = [], now = Date.now();
      if (c.on) {
        activeIssues(c).forEach((is) => { const l = A.issueLoc(S, is, now); list.push({ id: is.id, text: "⚠️ " + A.issueName(S, is) + " — اضغط", x: l.x, z: l.z, y: 5.2, act: "co:fix:" + is.id, cls: "tag", max: 160 }); });
        Object.keys(PLANTS).forEach((id) => { const pl = c.pl[id], PL = PLANTS[id]; const st = !pl.built ? "🏗️ أرض مصنع للبيع" : pl.broken ? "🔧 معطّل" : pl.job ? `⚙️ ${itemName(pl.job.rec)} · ${left(pl.job.end - now)}` : "⏸ واقف"; list.push({ id: "p" + id, text: `${PL.e} ${PL.n} · ${st}`, x: PL.x, z: PL.z, y: 9.5, act: "co:plant:" + id, cls: "tag", max: 70 }); });
        FIELDS.filter((f) => owns(S, f)).forEach((f) => list.push({ id: "f" + f.id, text: "📋 " + f.n + " · الشركة", x: f.park.x, z: f.park.z, y: 3.2, act: "co:field:" + f.id, cls: "tag", max: 42 }));
        const dock = Object.keys(c.dock).reduce((n, k) => n + c.dock[k], 0); list.push({ id: "port", text: `⚓ الميناء · ${dock} طبلية جاهزة`, x: A.POS.port.x + 8, z: A.POS.port.z + 6, y: 6, act: "co:port", cls: "tag", max: 80 });
      }
      const sig = JSON.stringify(list); if (sig !== lblSig) { lblSig = sig; w.setDynLabels("co", list); }
      const ids = activeIssues(c).map((i) => i.id);
      if (seen === null) seen = new Set(ids); else ids.forEach((id) => { if (!seen.has(id)) { seen.add(id); sfx("pop"); toast("⚠️ " + A.issueName(S, c.iss[id]) + " — شوفوا الأوسمة بالعالم أو المقر 🏢", "gold", 5200); } });
    } catch (e) { /* ما بنوقف اللعبة */ }
  };
  setInterval(A.sync, 5000);

  /* ---------- زر المقر + قسم بخريطة القرية ---------- */
  function init() {
    const bx = document.querySelector(".hud-btns");
    if (bx && !document.getElementById("btnCo")) { const b = document.createElement("button"); b.id = "btnCo"; b.className = "rbtn"; b.setAttribute("aria-label", "الشركة الزراعية"); b.textContent = "🏢"; b.onclick = () => OSW.app && OSW.app.goPlace("co"); bx.insertBefore(b, bx.firstChild); }
    const om = G().openers.map;
    if (om && !om._co) {
      G().openers.map = function () {
        om(); const el = document.querySelector("#modalCard"); if (!el) return;
        const go = (k, e, n) => `<button data-act="g-co-gomap" data-k="${k}">${e} ${n}</button>`;
        el.insertAdjacentHTML("beforeend", `<b>🏢 الشركة الزراعية</b><div class="seg" style="margin:6px 0 10px;flex-wrap:wrap"><button data-act="g-co-hq" data-k="ov">🏢 فتح المقر</button>${go("hq", "🚶", "روح للمقر")}${go("wh", "🏬", "مخزن الشركة")}${Object.keys(PLANTS).map((k) => go(k, PLANTS[k].e, PLANTS[k].n)).join("")}${go("port", "🚢", "ميناء التصدير (جزيرة)")}</div>`);
      };
      G().openers.map._co = 1;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
