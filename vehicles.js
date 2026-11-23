/* السيارات: كتالوج، مجسمات بكابينة مفتوحة، سواقة من جوا السيارة (راكبين اثنين)، وكاميرا قمرة/خارجية */
(function () {
  const OSW = window.OSW, PI = Math.PI, hy = Math.hypot, Builder = OSW.Builder, M = OSW.M, R = OSW.R, dk = OSW.col.dk, lt = OSW.col.lt;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; };
  const V = (OSW.veh = { me: null, input: { x: 0, y: 0, gas: 0, brake: 0 } });

  /* ---------- الجغرافيا: الجزيرتين والطريق ---------- */
  V.ISLE = { x: 0, z: 1180, r: 130 };            // الجزيرة الثانية
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
  // تصنيفات المعرض
  V.CATS = [["all", "🚘", "الكل"], ["small", "🚗", "صغيرة"], ["sedan", "🚙", "سيدان"], ["family", "👨‍👩‍👧", "عائلية"], ["suv", "🏔️", "SUV"], ["sport", "🏎️", "رياضية"], ["lux", "💎", "فاخرة"], ["classic", "🚘", "كلاسيك"], ["pickup", "🛻", "بيك أب"], ["van", "🚐", "فانات"], ["truck", "🚛", "شاحنات"], ["tractor", "🚜", "جرارات"], ["service", "🚑", "خدمات"]];
  const CATOF = { mini: "small", sedan: "sedan", pickup: "pickup", jeep: "suv", classic: "classic", van: "van", sport: "sport" };
  // مركبات جديدة. (الأصلية فوق ما انلمست: أسعارها وسعاتها ثابتة عشان الحفظ القديم يضل صحيح)
  const N = (n, e, cat, price, vmax, acc, hand, brake, cargo, shape, note, x) => Object.assign({ n, e, cat, price, vmax, acc, hand, brake, cargo, shape, note }, x || {});
  Object.assign(V.CARS, {
    kei: N("ميني كي (سيتي)", "🚗", "small", 90, 18, 8, 1.8, 16, 2, { len: 3.0, hood: 0.6, trunk: 0.5, roof: 1.45, y1: 0.9, W: 1.6 }, "أصغر وأرخص سيارة · سهلة جداً بالشوارع الضيقة"),
    hatch: N("هاتشباك رياضي", "🚗", "small", 380, 33, 12, 1.6, 21, 4, { len: 3.9, hood: 1.0, trunk: 0.6, roof: 1.45, y1: 0.88, stripe: "#f4f1e8", spoiler: 1 }, "صغيرة وسريعة وخفيفة بالمنعطفات", { rowsL: [2] }),
    buggy: N("بجي الشاطئ", "🏖️", "small", 260, 26, 11, 1.65, 17, 2, { len: 3.3, hood: 0.8, trunk: 0.5, roof: 1.5, y1: 0.85, lift: 0.15, open: 1, wr: 0.5, cage: 1 }, "مكشوفة ومرحة · أحلى شي عالرمل والجزيرة"),
    taxi: N("تاكسي", "🚕", "sedan", 400, 28, 9, 1.5, 19, 4, { len: 4.4, hood: 1.2, trunk: 1.0, roof: 1.52, y1: 0.92, sign: 1 }, "سيدان بلوحة تاكسي · ريّحة للعيلة", { rowsL: [2] }),
    wagon: N("ستيشن عائلية", "🚙", "family", 430, 29, 9, 1.45, 19, 8, { len: 4.6, hood: 1.1, trunk: 0.5, roof: 1.6, y1: 0.93, rack: 1 }, "سقفها طويل وبتسع 6 أشخاص وحمولة حلوة", { rowsL: [2, 2] }),
    minivan: N("ميني فان (7 مقاعد)", "🚐", "family", 560, 27, 8.5, 1.4, 18, 8, { len: 4.5, hood: 1.0, trunk: 0.4, roof: 1.85, y1: 0.98, boxy: 1 }, "7 مقاعد ومريحة للعيلة الكبيرة", { rowsL: [2, 3] }),
    suvc: N("SUV كومباكت", "🚙", "suv", 560, 29, 9.5, 1.5, 19, 6, { len: 4.0, hood: 1.0, trunk: 0.6, roof: 1.7, y1: 1.0, lift: 0.1 }, "عالية شوي وسهلة بالمدينة", { rowsL: [2] }),
    suv: N("SUV عائلي (7 مقاعد)", "🚙", "suv", 780, 31, 10, 1.4, 20, 10, { len: 4.5, hood: 1.2, trunk: 0.7, roof: 1.8, y1: 1.05, lift: 0.15, rack: 1, bar: 1 }, "قوية وبتسع 7 وحمولة كبيرة", { rowsL: [2, 3] }),
    offroad: N("دفع رباعي صحراوي", "🏜️", "suv", 900, 29, 11, 1.4, 19, 10, { len: 4.2, hood: 1.1, trunk: 0.7, roof: 1.85, y1: 1.1, lift: 0.3, boxy: 1, spare: 1, bar: 1, rack: 1, flare: 1 }, "عجلات كبيرة ومرتفعة · للطرق الوعرة", { rowsL: [2] }),
    coupe: N("كوبيه رياضي", "🏎️", "sport", 780, 38, 13, 1.35, 23, 2, { len: 4.3, hood: 1.5, trunk: 0.8, roof: 1.28, y1: 0.8, low: 1, stripe: "#ffd23f" }, "منخفضة وانسيابية وسريعة"),
    muscle: N("ماسل كار", "🏎️", "sport", 1050, 40, 16, 1.15, 22, 2, { len: 4.8, hood: 1.7, trunk: 0.9, roof: 1.3, y1: 0.82, low: 1, stripe: "#f4f1e8", pipe: 1 }, "قوة هائلة · بدها إيد ثابتة بالتحكم"),
    roadster: N("رودستر مكشوفة", "🏎️", "sport", 1100, 41, 14, 1.4, 23, 2, { len: 4.0, hood: 1.4, trunk: 0.8, roof: 1.2, y1: 0.78, low: 1, open: 1, spoiler: 1 }, "مكشوفة وسريعة ومرحة"),
    super: N("سوبر كار", "🏎️", "sport", 2400, 50, 19, 1.2, 28, 2, { len: 4.5, hood: 1.7, trunk: 1.0, roof: 1.1, y1: 0.72, low: 1, W: 2.1, spoiler: 1, stripe: "#2b2b35", wr: 0.36 }, "الأسرع بالقرية كلها 🚀"),
    lux: N("سيدان فاخرة", "💎", "lux", 1500, 36, 12, 1.4, 22, 6, { len: 4.9, hood: 1.4, trunk: 1.1, roof: 1.5, y1: 0.93, chrome: 1 }, "فخمة ومريحة وهادية", { rowsL: [2] }),
    limo: N("ليموزين (8 مقاعد)", "🥂", "lux", 2000, 33, 9, 1.1, 20, 6, { len: 4.8, hood: 1.3, trunk: 1.0, roof: 1.5, y1: 0.93, chrome: 1 }, "طويلة جداً وبتسع 8 أشخاص", { rowsL: [2, 2, 2] }),
    beetle: N("خنفساء كلاسيك", "🐞", "classic", 520, 21, 7.5, 1.8, 17, 3, { len: 3.9, hood: 0.9, trunk: 0.9, roof: 1.5, y1: 0.9, round: 1 }, "دايرية وظريفة · سرعة هادية", { rowsL: [2] }),
    oldpick: N("بيك أب كلاسيكي", "🛻", "pickup", 380, 20, 7, 1.4, 16, 10, { len: 4.4, hood: 1.0, trunk: 1.6, roof: 1.55, y1: 0.95, round: 1, bed: 1 }, "قديم وشغّيل · صندوقه بيشيل 10"),
    pickup2: N("بيك أب مزدوج", "🛻", "pickup", 700, 28, 9, 1.3, 18, 14, { len: 5.2, hood: 1.3, trunk: 1.7, roof: 1.6, y1: 0.98, bed: 1, bar: 1 }, "كابينة مزدوجة وصندوق كبير (14)", { rowsL: [2] }),
    cargovan: N("فان بضاعة", "🚚", "van", 640, 26, 8, 1.35, 18, 16, { len: 5.0, hood: 0.7, trunk: 2.0, roof: 1.95, y1: 1.0, box: { h: 1.95 } }, "صندوق مغلق كبير · حمولة 16"),
    minibus: N("ميني باص (11 مقعد)", "🚌", "van", 1400, 24, 6.5, 1.2, 17, 8, { len: 5.2, hood: 0.9, trunk: 0.4, roof: 2.1, y1: 1.0, boxy: 1 }, "للمجموعات الكبيرة · بتسع 11", { rowsL: [3, 3, 3] }),
    boxtruck: N("شاحنة صندوق", "🚛", "truck", 1600, 22, 6, 1.0, 16, 24, { len: 7.0, hood: 0.6, trunk: 4.2, roof: 2.25, y1: 1.15, W: 2.2, box: { h: 2.5 }, dual: 1, ax: 1.3 }, "حمولة ضخمة (24) · ثقيلة وبطيئة بالمنعطفات"),
    tractor: N("جرار زراعي", "🚜", "tractor", 600, 12, 5, 1.5, 14, 6, { len: 4.2, hood: 1.5, trunk: 0.8, roof: 1.9, y1: 0.7, lift: 0.55, open: 1, bed: 1, type: "tractor" }, "بطيء بس قوي · عجلاته الكبيرة للمزرعة"),
    ambulance: N("إسعاف", "🚑", "service", 1200, 32, 11, 1.3, 22, 2, { len: 5.2, hood: 0.9, trunk: 1.8, roof: 2.0, y1: 1.0, box: { h: 1.9 }, light: ["#ff2a2a", "#2fb0ff"], cross: 1 }, "إسعاف بإضاءة · سريعة ومستقرة", { rowsL: [2] }),
    police: N("سيارة شرطة", "🚓", "service", 1000, 36, 12, 1.45, 23, 2, { len: 4.5, hood: 1.2, trunk: 1.0, roof: 1.52, y1: 0.92, light: ["#ff2a2a", "#2fb0ff"], stripe: "#f4f1e8" }, "سيدان بإضاءة الطوارئ", { rowsL: [2] }),
    firetruck: N("سيارة إطفاء", "🚒", "service", 1800, 26, 7, 1.0, 18, 6, { len: 7.0, hood: 0.7, trunk: 3.3, roof: 2.2, y1: 1.15, W: 2.2, box: { h: 1.55 }, ladder: 1, light: ["#ff2a2a", "#ff2a2a"], dual: 1, ax: 1.3 }, "طويلة بسلّم وإضاءة", { rowsL: [2] }),
  });
  // مقاعد: كل سيارة (ما عدا السبورت) بتسع 6 أشخاص على الأقل، والبكم 4، والميني 4
  const LAYOUT = { mini: [2], sedan: [2, 2], pickup: [2], jeep: [2, 2], classic: [2, 2], sport: [] };
  Object.keys(V.CARS).forEach((k) => { const D = V.CARS[k], rows = D.rowsL || LAYOUT[k] || []; D.cat = D.cat || CATOF[k]; D.rows = rows; D.seats = D.seats || 2 + rows.reduce((n, r) => n + r, 0); D.shape.len0 = D.shape.len; D.shape.len += rows.length * 0.68; });
  V.COLORS = ["#e63946", "#ffd23f", "#4dabf7", "#2a9d8f", "#f4f1e8", "#2b2b35", "#ff8c42", "#9b5de5", "#7ac74f", "#ff7aa8"];

  /* ---------- مجسم السيارة (كابينة مفتوحة للسواقة من جوا) ---------- */
  const cache = {}; let cacheTick = 0;
  // ذاكرة المجسمات: نحتفظ بآخر 28 مجسم فقط ونحرّر الباقي (يخفف الذاكرة على التلفونات الضعيفة)
  function remember(key, mesh) {
    mesh.t = ++cacheTick; cache[key] = mesh; const keys = Object.keys(cache);
    if (keys.length > 28) { keys.sort((a, c) => cache[a].t - cache[c].t); for (let i = 0; i < keys.length - 28; i++) { if (cache[keys[i]].t >= cacheTick - 2) continue; R.free(cache[keys[i]]); delete cache[keys[i]]; } }
    return mesh;
  }
  function carMesh(kind, color) {
    if (!V.CARS[kind]) kind = "sedan";                       // نوع مجهول (نسخة أقدم/أحدث عند اللاعب الثاني): نرسم سيدان بدل ما تقع اللعبة
    const key = kind + color; if (cache[key]) { cache[key].t = ++cacheTick; return cache[key]; }
    if (V.CARS[kind].shape.type === "tractor") return remember(key, tractorMesh(kind, color));
    const D = V.CARS[kind], P = D.shape, b = new Builder(), W = P.W || (P.low ? 2.0 : 1.9), L = P.len, hl = L / 2, y1 = P.y1, lift = P.lift || 0, dark = "#23242b", body = color, hw = W / 2;
    const cf = hl - P.hood, cb = -hl + P.trunk, cz = (cf + cb) / 2, cl = cf - cb;
    b.push(0, lift, 0);
    b.box(0, 0.22, 0, W - 0.1, 0.12, L, dark);                                                   // أرضية
    [-1, 1].forEach((s) => b.box(s * (hw - 0.06), 0.25, cz, 0.12, y1 - 0.25, cl, body));         // أبواب (جدران جانبية)
    b.box(0, 0.25, hl - P.hood / 2, W, y1 - 0.3, P.hood, body); b.box(0, y1 - 0.05, hl - P.hood / 2, W - 0.1, 0.06, P.hood, lt(body, 0.12)); // غطاء المحرك
    if (P.bed) {                                                                                 // صندوق البكم
      b.box(0, 0.3, cb - P.trunk / 2 + 0.0, W - 0.2, 0.1, P.trunk, "#4a4a52"); [-1, 1].forEach((s) => b.box(s * (hw - 0.07), 0.3, -hl + P.trunk / 2, 0.12, 0.75, P.trunk, body)); b.box(0, 0.3, -hl + 0.06, W, 0.75, 0.12, body); b.box(0, 0.3, cb - 0.05, W, 0.8, 0.12, body);
    } else if (P.box) {                                                                           // صندوق مغلق (فان/شاحنة/إسعاف/إطفاء)
      const bc = P.box.c || body; b.box(0, 0.25, -hl + P.trunk / 2, W, P.box.h, P.trunk, bc); b.box(0, 0.25 + P.box.h - 0.02, -hl + P.trunk / 2, W - 0.12, 0.06, P.trunk - 0.1, lt(bc, 0.14));
      for (let i = 1; i < 4; i++) b.box(0, 0.25 + P.box.h * 0.5, -hl + (P.trunk * i) / 4, W + 0.02, P.box.h - 0.3, 0.03, dk(bc, 0.12));
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
    decor(b, P, { W, hl, hw, y1, roofY, body, dark, cf, cb, cz, cl });
    b.pop();
    // عجلات
    const wr = P.wr || 0.38 + lift * 0.6, fz = hl - (P.ax || 0.95), rz = -hl + (P.ax || 0.95), ww = P.dual ? 0.5 : 0.38, wl = [[-1, fz], [1, fz], [-1, rz], [1, rz]];
    if (P.dual) wl.push([-1, rz + 1.25], [1, rz + 1.25]);           // محور خلفي إضافي للشاحنات
    wl.forEach(([s, z]) => { b.push(s * (hw - 0.02), wr, z, 0, 0, PI / 2); b.cyl(0, -ww / 2, 0, wr, wr, ww, "#1d1d22", 10); b.cyl(0, s > 0 ? -0.2 : 0.15, 0, wr * 0.55, wr * 0.55, 0.06, "#c0c4cc", 8); b.pop(); });
    return remember(key, b.build(R.gl));
  }
  // زخارف وملحقات تميّز المركبات عن بعض (شرائط، جناح، سلّم، إضاءة طوارئ، حامل سقف...)
  function decor(b, P, k) {
    const { W, hl, hw, y1, roofY, body, dark, cb, cz, cl } = k, mt = "#2a2b33", chr = "#c0c4cc";
    if (P.stripe) [-0.2, 0.2].forEach((s) => { b.box(s, y1 - 0.015, hl - P.hood / 2, 0.16, 0.02, P.hood - 0.12, P.stripe); if (!P.bed && !P.box) b.box(s, y1 - 0.015, -hl + P.trunk / 2, 0.16, 0.02, P.trunk - 0.12, P.stripe); });
    if (P.spoiler) { b.box(0, y1 + 0.3, -hl + 0.22, W - 0.25, 0.06, 0.38, dark); [-1, 1].forEach((s) => b.box(s * (hw - 0.35), y1 + 0.1, -hl + 0.22, 0.06, 0.26, 0.2, dark)); }
    if (P.rack) { const ry = roofY + 0.08; b.box(0, ry, cz - 0.2, W - 0.3, 0.04, cl * 0.6, mt); [-1, 1].forEach((s) => b.box(s * (hw - 0.2), ry - 0.04, cz - 0.2, 0.05, 0.08, cl * 0.6, mt)); [-0.3, 0.3].forEach((t) => b.box(0, ry + 0.03, cz - 0.2 + t * cl * 0.6, W - 0.3, 0.04, 0.05, "#8a8c96")); }
    if (P.bar) { b.box(0, 0.4, hl + 0.14, W - 0.3, 0.1, 0.08, mt); [-0.55, 0.55].forEach((x) => b.box(x, 0.5, hl + 0.1, 0.07, 0.5, 0.07, mt)); }
    if (P.spare) { b.push(0, 0.72, -hl - 0.14, 0, PI / 2); b.cyl(0, 0, 0, 0.4, 0.4, 0.2, "#1d1d22", 10); b.cyl(0, 0.11, 0, 0.22, 0.22, 0.03, chr, 8); b.pop(); }
    if (P.flare) [-1, 1].forEach((s) => { b.box(s * (hw + 0.05), 0.58, hl - 0.95, 0.12, 0.14, 0.95, mt); b.box(s * (hw + 0.05), 0.58, -hl + 0.95, 0.12, 0.14, 0.95, mt); });
    if (P.pipe) [-1, 1].forEach((s) => b.box(s * 0.55, 0.28, -hl - 0.1, 0.12, 0.12, 0.3, chr));
    if (P.chrome) { b.box(0, 0.58, hl + 0.03, 0.9, 0.22, 0.05, chr); [-1, 1].forEach((s) => b.box(s * (hw + 0.01), 0.4, cz, 0.03, 0.05, cl + P.hood * 0.5, chr)); }
    if (P.sign) { b.box(0, roofY + 0.07, cz, 0.55, 0.17, 0.22, "#fff3b0", 0.75); b.box(0, roofY + 0.0, cz, 0.3, 0.03, 0.12, dark); }
    if (P.light) { b.box(0, roofY + 0.05, cz, W * 0.62, 0.09, 0.28, "#1b1c22"); b.box(-W * 0.16, roofY + 0.12, cz, W * 0.24, 0.07, 0.24, P.light[0], 0.9); b.box(W * 0.16, roofY + 0.12, cz, W * 0.24, 0.07, 0.24, P.light[1], 0.9); }
    if (P.cross) [-1, 1].forEach((s) => { b.box(s * (hw + 0.025), 0.28 + (P.box ? P.box.h * 0.55 : 0.6), -hl + P.trunk / 2, 0.02, 0.5, 0.16, "#e63946"); b.box(s * (hw + 0.025), 0.28 + (P.box ? P.box.h * 0.55 : 0.6), -hl + P.trunk / 2, 0.02, 0.16, 0.5, "#e63946"); });
    if (P.ladder) { const ly = 0.25 + P.box.h + 0.12; [-0.3, 0.3].forEach((x) => b.box(x, ly, -hl + P.trunk / 2, 0.05, 0.05, P.trunk - 0.2, chr)); for (let i = 0; i < 9; i++) b.box(0, ly, -hl + 0.3 + i * ((P.trunk - 0.6) / 8), 0.6, 0.03, 0.04, chr); }
    if (P.cage) { const ry = y1 + 0.62; [-1, 1].forEach((s) => { b.box(s * (hw - 0.12), y1, cb + 0.1, 0.06, 0.62, 0.06, mt); b.box(s * (hw - 0.12), ry - 0.03, cz, 0.05, 0.05, cl, mt); }); b.box(0, ry - 0.03, cb + 0.1, W - 0.2, 0.05, 0.05, mt); }
  }

  // الجرار: عجلات خلفية كبيرة وقمرة مفتوحة بإطار حماية
  function tractorMesh(kind, color) {
    const D = V.CARS[kind], P = D.shape, b = new Builder(), hl = P.len / 2, lift = P.lift, dark = "#23242b", body = color, mt = "#2a2b33", y1 = P.y1;
    const cf = hl - P.hood, cb = -hl + P.trunk, cz = (cf + cb) / 2, cl = cf - cb;
    b.push(0, lift, 0);
    b.box(0, 0.2, 0, 1.3, 0.22, P.len - 0.3, dark);                                              // شاسيه
    b.box(0, 0.62, hl - P.hood / 2, 1.0, 0.8, P.hood, body); b.box(0, 1.04, hl - P.hood / 2, 0.9, 0.06, P.hood - 0.1, lt(body, 0.14)); // غطاء المحرك
    b.box(0, 0.7, hl + 0.01, 0.8, 0.5, 0.05, "#2a2a30"); [-0.25, 0, 0.25].forEach((x) => b.box(x, 0.7, hl + 0.04, 0.05, 0.42, 0.03, "#8a8c96")); // شبك المبرد
    b.sphere(-0.4, 0.8, hl + 0.03, 0.14, 0.12, 0.06, "#fffbe0", 6, 1); b.sphere(0.4, 0.8, hl + 0.03, 0.14, 0.12, 0.06, "#fffbe0", 6, 1);
    b.cyl(0.3, 1.35, hl - 0.6, 0.06, 0.05, 0.6, "#555a64", 6);                                    // عادم
    b.box(0, 0.3, cz, 1.9, 0.1, cl, "#3a3b44");                                                   // أرضية القمرة
    const ST = V.seats(kind);
    ST.forEach((q) => { b.box(q.x, 0.34, q.z + 0.28, 0.5, 0.16, 0.5, "#4a3b34"); b.push(q.x, 0.55, q.z - 0.0, 0, -0.18); b.box(0, 0, 0, 0.5, 0.5, 0.12, "#4a3b34"); b.pop(); });
    b.push(0.42, y1 + 0.02, cf - 0.35, 0, -1.0); for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; b.box(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15, 0.04, 0.03, 0.04, "#1c1c22"); } b.pop(); b.box(0.42, y1 - 0.2, cf - 0.35, 0.05, 0.4, 0.05, "#555a64");
    [-1, 1].forEach((s) => { b.box(s * 0.92, 0.95, -hl + 1.0, 0.1, 0.1, 1.5, body); b.box(s * 0.95, 0.75, -hl + 1.0, 0.2, 0.6, 1.5, dk(body, 0.08)); }); // رفارف خلفية
    [-1, 1].forEach((s) => { [cf - 0.05, cb + 0.1].forEach((z) => b.box(s * 0.85, 0.3, z, 0.07, 1.65, 0.07, mt)); });                                   // أعمدة الحماية
    b.box(0, 1.95, cz, 1.9, 0.07, cl + 0.15, body);                                               // سقف
    b.box(0, 0.38, -hl + P.trunk / 2, 1.5, 0.08, P.trunk, "#4a4a52"); b.box(0, 0.5, -hl + 0.06, 1.5, 0.3, 0.1, mt);                                      // منصة خلفية
    b.pop();
    const wl = [[-1, 0.52, hl - 1.0, 0.36], [1, 0.52, hl - 1.0, 0.36], [-1, 0.95, -hl + 1.0, 0.62], [1, 0.95, -hl + 1.0, 0.62]];
    wl.forEach(([s, r, z, w]) => { b.push(s * (r > 0.8 ? 1.0 : 0.82), r, z, 0, 0, PI / 2); b.cyl(0, -w / 2, 0, r, r, w, "#1d1d22", 12); b.cyl(0, s > 0 ? -w / 2 - 0.01 : w / 2 - 0.05, 0, r * 0.5, r * 0.5, 0.07, body, 8); b.pop(); });
    return b.build(R.gl);
  }
  V.mesh = carMesh;
  V.seats = (kind) => { // 0 سواق، 1 جنبه، 2.. ورا
    const D = V.CARS[kind] || V.CARS.sedan, P = D.shape, cf = P.len / 2 - P.hood, cl0 = P.len0 - P.hood - P.trunk, zf = cf - (cl0 - 0.9), y = (P.lift || 0) + 0.28, out = [{ x: 0.42, y, z: zf }, { x: -0.42, y, z: zf }];
    D.rows.forEach((n, r) => (n === 3 ? [-0.6, 0, 0.6] : [0.42, -0.42]).forEach((x) => out.push({ x, y, z: zf - 0.68 * (r + 1) })));
    return out;
  };
  V.eye = (kind, role) => { const D = V.CARS[kind] || V.CARS.sedan, P = D.shape, s = V.seats(V.CARS[kind] ? kind : "sedan")[role === "p" ? 1 : 0]; return { x: s.x, y: (P.lift || 0) + P.y1 + (P.low ? 0.3 : 0.42), z: s.z - 0.02 }; };
  V.seat = (kind, role) => { const s = V.seats(V.CARS[kind] ? kind : "sedan")[role === "p" ? 1 : 0]; return { x: s.x, y: s.y, z: s.z - 0.28 }; };

  /* ---------- حالة السيارات المملوكة ومواقفها ---------- */
  const G = () => OSW.game, W = () => OSW.world, ctx = () => W()._int;
  let ownedKey = "", ownedVal = [];
  V.owned = () => {
    const db = OSW.ui && OSW.ui.db; if (!(db && db.entries && db.me && G())) return [];
    const n = db.entries.length, last = n ? db.entries[n - 1] : null, key = n + ":" + (last ? last.id : "") + ":" + (last && last.created_at || "");
    if (key === ownedKey) return ownedVal; ownedVal = G().state().cars || []; ownedKey = key; return ownedVal;   // نفس الحالة = نفس القائمة (بدون إعادة حساب)
  };
  // السيارة المركونة بأي مكان ("free") بترجع لحالها لكراج البيت بعد 25 دقيقة
  V.RETURN_MS = 25 * 60000;
  V.atOf = (c) => { const a = c.at || "A"; return a === "free" && Date.now() - (c.ft || 0) > V.RETURN_MS ? "H" : a; };
  const LOT_LAT = { A: 1, B: -1, H: 1 };
  V.slot = (car) => {
    const at = V.atOf(car); if (at === "free") return { x: car.fx, z: car.fz, h: car.fh };
    const list = V.owned().filter((c) => V.atOf(c) === at), i = Math.max(0, list.findIndex((c) => c.id === car.id)), L = V.LOTS[at], lat = LOT_LAT[at];
    if (!lat) return { x: L.x + i * (L.dx || 0), z: L.z + i * L.dz, h: L.h };
    // مواقف القرية/البيت/الجزيرة: كل مركبة بتاخد مساحة على قد طولها، وإذا زاد العدد بتنفتح صفوف جديدة بعيد عن الشارع
    const dir = Math.sign(L.dz) || 1; let pos = 0, col = 0;
    for (let j = 0; j < list.length; j++) {
      const len = (V.CARS[list[j].car] || V.CARS.sedan).shape.len, step = len + 0.9;
      if (pos > 0 && pos + step > (L.span || 34)) { col++; pos = 0; }
      if (list[j].id === car.id) return { x: L.x + col * lat * 6.8, z: L.z + dir * (pos + len / 2 - 2.2), h: L.h };
      pos += step;
    }
    return { x: L.x, z: L.z, h: L.h };
  };
  V.sendHome = () => { const me = V.me, n = V.owned().filter((c) => V.atOf(c) !== "H" && !(me && me.id === c.id)); n.forEach((c) => OSW.game.do("cpark", { id: c.id, at: "H" })); return n.length; };
  const busyIds = () => { const c = ctx(), s = new Set(); if (V.me) s.add(V.me.id); if (c.pa.veh && c.pa.veh.id) s.add(c.pa.veh.id); return s; };

  /* ---------- الدخول والنزول ---------- */
  V.tap = (id) => {
    const car = V.owned().find((c) => c.id === id), c = ctx(), me = c.me; if (!car || V.me) return;
    const pa = c.pa, hand = OSW.game.animalCarry(OSW.ui.db.uid), crates = OSW.game.carryOf(OSW.ui.db.uid);
    if (crates.length && !hand.length && !(pa.veh && pa.veh.id === id) && OSW.logi) {
      const s1 = V.slot(car); if (hy(me.x - s1.x, me.z - s1.z) > 6) return W().goTo(s1.x + Math.cos(s1.h) * 2.8, s1.z - Math.sin(s1.h) * 2.8, "car:" + id);
      if (OSW.logi.room(car) > 0) { OSW.game.do("cload", { id }); OSW.audio && OSW.audio.sfx("pop"); return OSW.ui.toast("📦 حطّيت الكراتين بـ" + V.CARS[car.car].n + "! (" + Math.min(crates.length, OSW.logi.room(car)) + ")", "", 2200); }
      return OSW.ui.toast("🚫 السيارة ممتلئة بالكراتين!");
    }
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
    c.cancelAuto(); OSW.audio && OSW.audio.sfx("door"); hud(true); OSW.game.sync3d(); c.cam.follow = false; c.setInput(true);
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
    m.ck = (m.ck || 0) + dt; if (m.ck > 1.2) { m.ck = 0; if (!V.owned().some((x) => x.id === m.id)) return V.exit(true); }   // السيارة انباعت/اختفت وانت سايق: نزّلنا بأمان
    const D = V.CARS[m.car] || V.CARS.sedan, want = clamp(-iy, -1, 1), st = clamp(ix, -1, 1), heavy = clamp((D.shape.len - 4.6) / 3, 0, 0.8);
    m.thr = (m.thr || 0) + (want - (m.thr || 0)) * Math.min(1, dt * (want ? 8 : 14));           // تنعيم الدواسة: انطلاقة ونزول بدون رجّة
    const thr = Math.abs(m.thr) < 0.02 ? 0 : m.thr;
    let v = m.v;
    if (thr > 0.08) v += (v < -0.5 ? D.brake : D.acc) * thr * dt; else if (thr < -0.08) v -= (v > 0.5 ? D.brake : D.acc * 0.55) * -thr * dt; else v -= Math.sign(v) * Math.min(Math.abs(v), 3.2 * dt);
    v -= v * Math.abs(v) * 0.0016 * dt * (D.acc);                  // مقاومة الهواء
    v = clamp(v, -D.vmax * 0.28, D.vmax);
    m.steer = (m.steer || 0) + (st - (m.steer || 0)) * Math.min(1, dt * 7);
    m.h -= m.steer * D.hand * (1 - heavy * 0.25) * clamp(v / 2.6, -1, 1) / (1 + Math.abs(v) / D.vmax * 0.8) * dt * 1.75;
    const ox = me.x, oz = me.z;
    me.x += Math.sin(m.h) * v * dt; me.z += Math.cos(m.h) * v * dt;
    for (const k of c.S.colliders) { const dx = me.x - k.x, dz = me.z - k.z, rr = k.r + (k.r < 1.2 ? 0.95 : 1.25) + heavy * 0.9; if (dx * dx + dz * dz < rr * rr) { const d = hy(dx, dz) || 0.001; me.x = k.x + (dx / d) * rr; me.z = k.z + (dz / d) * rr; if (Math.abs(v) > 6 && !(m.pt > t0())) { OSW.audio && OSW.audio.sfx("pop"); m.pt = t0() + 600; } v *= 0.82; } }
    if (!V.carOk(me.x, me.z)) { me.x = ox; me.z = oz; v *= -0.25; }
    m.v = v; me.ry = m.h; me.vx = Math.sin(m.h) * v; me.vz = Math.cos(m.h) * v; me.mv = 0; m.dist = (m.dist || 0) + Math.abs(v) * dt;
    me.vel = v; if (V.hudEl) { V.spd.textContent = Math.round(Math.abs(v) * 3.6); }
  };
  // الكاميرا: قمرة السائق (من جوا) أو خارجية خلف السيارة
  V.camStep = (cam, dt) => {
    const m = V.me; if (!m) return; const c = ctx(), me = c.me, D = V.CARS[m.car] || V.CARS.sedan, now = performance.now();
    if (m.look && !m.back && now - (m.lookT || 0) > (m.view === "in" ? 3200 : 1500)) { m.look *= Math.exp(-dt * 2.6); if (Math.abs(m.look) < 0.01) m.look = 0; if (m.view === "in" && m.lookP != null) m.lookP += (0.1 - m.lookP) * Math.min(1, dt * 3); }   // الكاميرا بترجع لقدام بعد ما ترفع إصبعك
    if (m.view === "in") {
      const e = V.eye(m.car, m.role), s = Math.sin(m.h), co = Math.cos(m.h);
      cam.fp = true; cam.tx = me.x + e.x * co + e.z * s; cam.tz = me.z - e.x * s + e.z * co; cam.ty = e.y;
      cam.dist = 0.02; cam.pitch = (cam.pitch + ((m.lookP || 0.1) - cam.pitch) * Math.min(1, dt * 8)); cam.yaw = cam.yaw + angDiff(cam.yaw, m.h + PI + (m.look || 0)) * Math.min(1, dt * 12);
    } else {
      const far = m.view === "far", big = clamp((D.shape.len - 4.4) * 0.45, 0, 2.2);
      cam.fp = false; const k = 1 - Math.exp(-dt * 6); cam.tx += (me.x - cam.tx) * k; cam.tz += (me.z - cam.tz) * k; cam.ty += ((far ? 0.6 : 1.0) - cam.ty) * k;
      cam.dist += ((far ? 15 + Math.abs(m.v) * 0.2 : 8.5 + Math.abs(m.v) * 0.12) + big - cam.dist) * k; cam.pitch += ((far ? 0.62 : 0.3) - cam.pitch) * k; cam.yaw += angDiff(cam.yaw, m.h + PI + (m.look || 0)) * Math.min(1, dt * 3.2);
    }
  };
  V.lookDrag = (dx, dy) => { const m = V.me; if (!m) return false; m.lookT = performance.now(); m.look = clamp((m.look || 0) - dx * 0.0062 * (m.view === "in" ? 1 : -1), -PI * 1.05, PI * 1.05); if (m.view === "in") m.lookP = clamp((m.lookP == null ? 0.1 : m.lookP) + dy * 0.003, -0.5, 0.7); return true; };
  V.fov = (base) => (V.me ? base + clamp(Math.abs(V.me.v) / 60, 0, 0.18) + (V.me.view === "in" ? 0.18 : 0) : base);

  /* ---------- الرسم ---------- */
  V.drawAll = (t, withPeople) => {
    const c = ctx(), pa = c.pa, me = c.me, busy = busyIds();
    const bed = (carObj, x, z, h) => { if (OSW.logi) OSW.logi.drawCar(carObj, x, z, h); const ks = (carObj.cargo || []).slice(0, 12); if (!ks.length || !((V.CARS[carObj.car] || {}).shape || {}).bed) return; const s = Math.sin(h), co = Math.cos(h); ks.forEach((an, i) => { const ox2 = i % 2 ? 0.42 : -0.42, oz2 = -0.95 - Math.floor(i / 2) * 0.62, sc = an.kind === "chicken" ? 0.62 : 0.5; M.trs(x + ox2 * co + oz2 * s, 0.45, z - ox2 * s + oz2 * co, h, 0, 0, sc, sc, sc, V._m2); R.draw(c.meshes[an.kind], V._m2); }); };
    const ex = R.eye[0], ez = R.eye[2]; V.owned().forEach((car) => { if (busy.has(car.id)) return; const s = V.slot(car); if (Math.abs(s.x - ex) > 200 || Math.abs(s.z - ez) > 200) return; M.trs(s.x, 0, s.z, s.h, 0, 0, 1, 1, 1, V._m1); R.draw(carMesh(car.car, car.color), V._m1); bed(car, s.x, s.z, s.h); });
    const act = [];
    if (V.me && V.me.role === "d") act.push({ car: V.me.car, color: V.me.color, x: me.x, z: me.z, h: V.me.h, v: V.me.v, st: V.me.steer || 0, drv: "me", pas: pa.veh && pa.veh.id === V.me.id && pa.veh.role === "p" ? "pa" : null });
    else if (V.me && V.me.role === "p" && pa.veh) act.push({ car: pa.veh.car, color: pa.veh.color, x: pa.x, z: pa.z, h: pa.ry, v: 0, st: 0, drv: "pa", pas: "me" });
    else if (pa.veh && pa.veh.role === "d" && pa.vis) act.push({ car: pa.veh.car, color: pa.veh.color, x: pa.x, z: pa.z, h: pa.ry, v: 0, st: 0, drv: "pa", pas: null });
    act.forEach((a) => {
      M.trs(a.x, 0, a.z, a.h, 0, 0, 1, 1, 1, V._m1); R.draw(carMesh(a.car, a.color), V._m1);
      [["drv", "d"], ["pas", "p"]].forEach(([k, role]) => {
        const who = a[k]; if (!who) return; if (who === "me" && V.me && V.me.view === "in" && !withPeople) return; if (who === "me" && V.me && V.me.view === "in") return;
        const o = who === "me" ? me : pa, S = V.seat(a.car, role), s = Math.sin(a.h), co = Math.cos(a.h);
        if (!o.ch) return; OSW.drawChar(o.ch, a.x + S.x * co + S.z * s, a.z - S.x * s + S.z * co, a.h, 0, 0, t, 1, null, 0.74, S.y - 0.1, { sit: 1, drive: role === "d" });
      });
      { const co2 = V.owned().find((x) => x.id === (a.drv === "me" && V.me ? V.me.id : pa.veh && pa.veh.id)); if (co2) bed(co2, a.x, a.z, a.h); }
    });
  };
  // سيارة أهل القرية (بتستخدمها life.js)
  V.drawNpcCar = (kind, color, x, z, h, t, ch) => {
    M.trs(x, 0, z, h, 0, 0, 1, 1, 1, V._m1); R.draw(carMesh(kind, color), V._m1);
    if (ch) { const S = V.seat(kind, "d"), s = Math.sin(h), co = Math.cos(h); OSW.drawChar(ch, x + S.x * co + S.z * s, z - S.x * s + S.z * co, h, 0, 0, t, 1, null, 0.74, S.y - 0.1, { sit: 1, drive: 1 }); }
  };
  V.drawing = () => !!(V.me || (ctx().pa.veh && ctx().pa.vis));
  V._m1 = new Float32Array(16); V._m2 = new Float32Array(16);

  /* ---------- شاشة السواقة ---------- */
  function hud(on) {
    let h = document.getElementById("carHud");
    if (!h) {
      h = document.createElement("div"); h.id = "carHud"; h.hidden = true;
      h.innerHTML = `<div class="ch-speed"><b id="chSpd">0</b><small>كم/س</small></div><div class="ch-name" id="chName"></div><div class="ch-wheel" id="chWheel"><div class="ch-wheel-in" id="chWheelIn"><i class="w-sp a"></i><i class="w-sp b"></i><i class="w-sp c"></i><i class="w-hub"></i><i class="w-mark"></i></div></div><div class="ch-pedals"><button id="chBrake" aria-label="فرامل">🛑<small>فرامل</small></button><button id="chGas" aria-label="بنزين">⛽<small>بنزين</small></button></div><div class="ch-btns"><button data-ch="back" aria-label="التفات للخلف" title="التفات للخلف">🔙</button><button data-ch="horn" aria-label="بوق">📯</button><button data-ch="radio" aria-label="راديو">📻</button><button data-ch="view" aria-label="تغيير المنظر">👁️</button><button data-ch="exit" aria-label="نزول" title="انزل">🚪</button></div>`;
      document.body.appendChild(h); V.hudEl = h; V.spd = h.querySelector("#chSpd");
      // المقود: اسحبوه بإصبعكم ودوّروه، وبيرجع لحاله. والدواسات: بنزين وفرامل — كل واحد بلمسة مستقلة (لمس متعدد)
      const wh = h.querySelector("#chWheel"), wi = h.querySelector("#chWheelIn"); let ang = 0, drag = false, a0 = 0, base = 0, pid = null, raf = 0, hornT = 0;
      const setAng = (a) => { ang = clamp(a, -135, 135); wi.style.transform = "rotate(" + ang + "deg)"; const r = Math.min(1, Math.abs(ang) / 90); V.input.x = Math.sign(ang) * Math.pow(r, 1.15); };  // استجابة أنعم حول المنتصف
      const stopHorn = () => { clearInterval(hornT); hornT = 0; };
      const pedals = () => Array.from(h.querySelectorAll(".ch-pedals button"));
      // تصفير كل شي (إصبع انرفع/التطبيق راح بالخلفية/الشاشة انخفت): ما بيضل بنزين ولا مقود عالق
      const releaseAll = (instant) => { drag = false; pid = null; V.input.gas = V.input.brake = 0; V.input.y = 0; pedals().forEach((b) => { b.classList.remove("on"); b._pid = null; }); stopHorn(); if (instant) { cancelAnimationFrame(raf); setAng(0); } else springBack(); };
      const springBack = () => { cancelAnimationFrame(raf); let tp = performance.now(); const back = () => { if (drag) return; const n = performance.now(), dt = Math.min(0.5, (n - tp) / 1000); tp = n; ang *= Math.pow(0.0005, dt); if (Math.abs(ang) < 1) ang = 0; setAng(ang); if (ang) raf = requestAnimationFrame(back); }; raf = requestAnimationFrame(back); };
      V.resetWheel = () => releaseAll(true);
      const pt = (e) => { const r = wh.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / PI; };
      wh.addEventListener("pointerdown", (e) => { if (drag) return; pid = e.pointerId; try { wh.setPointerCapture(pid); } catch (er) { /* */ } drag = true; a0 = pt(e); base = ang; cancelAnimationFrame(raf); e.preventDefault(); });
      wh.addEventListener("pointermove", (e) => { if (!drag || e.pointerId !== pid) return; let d = pt(e) - a0; while (d > 180) d -= 360; while (d < -180) d += 360; setAng(base + d); e.preventDefault(); });
      const rel = (e) => { if (e.pointerId !== pid) return; drag = false; pid = null; springBack(); };
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => wh.addEventListener(ev, rel));
      const pedal = (id, key) => {
        const b = h.querySelector(id), set = (v) => { V.input[key] = v; V.input.y = V.input.brake - V.input.gas; };
        b.addEventListener("pointerdown", (e) => { if (b._pid != null) return; b._pid = e.pointerId; try { b.setPointerCapture(e.pointerId); } catch (er) { /* */ } set(1); b.classList.add("on"); e.preventDefault(); });
        const up = (e) => { if (e.pointerId !== b._pid) return; b._pid = null; set(0); b.classList.remove("on"); };
        ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => b.addEventListener(ev, up));
      };
      pedal("#chGas", "gas"); pedal("#chBrake", "brake");
      // البوق: ضغطة = تمّ، وإذا ضلّيت ضاغط بيكرر
      const hb = h.querySelector("[data-ch=horn]");
      hb.addEventListener("pointerdown", (e) => { try { hb.setPointerCapture(e.pointerId); } catch (er) { /* */ } OSW.audio && OSW.audio.sfx("horn"); stopHorn(); hornT = setInterval(() => OSW.audio && OSW.audio.sfx("horn"), 420); e.preventDefault(); hb._hp = e.pointerId; });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => hb.addEventListener(ev, (e) => { if (e.pointerId === hb._hp) { hb._hp = null; stopHorn(); } }));
      // حمايات عامة (إصبع انرفع برا الزر/تبديل تطبيق/شاشة مقفلة/لمس انلغى)
      window.addEventListener("blur", () => releaseAll(false)); window.addEventListener("pagehide", () => releaseAll(true));
      document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(true); });
      const noTouch = (e) => { if (e.touches && e.touches.length === 0) releaseAll(false); };
      document.addEventListener("touchend", noTouch, { passive: true }); document.addEventListener("touchcancel", noTouch, { passive: true });
      h.addEventListener("contextmenu", (e) => e.preventDefault());
      h.addEventListener("click", (e) => { const b = e.target.closest("[data-ch]"); if (!b) return; if (b.dataset.ch === "back" && V.me) { V.me.view = "in"; V.me.back = !(Math.abs(V.me.look || 0) > 1.5); V.me.look = V.me.back ? PI : 0; V.me.lookP = V.me.back ? 0.35 : 0.1; OSW.audio && OSW.audio.sfx("pop"); } else if (b.dataset.ch === "horn") { /* البوق بيشتغل من الضغط نفسه */ } else if (b.dataset.ch === "radio") { const on = OSW.audio && OSW.audio.radio(); OSW.ui.toast(on ? "📻 الراديو شغّال" : "📻 طفّيت الراديو"); } else if (b.dataset.ch === "view" && V.me) { V.me.view = V.me.view === "in" ? "out" : V.me.view === "out" ? "far" : "in"; V.me.back = false; V.me.look = 0; OSW.ui.toast(V.me.view === "in" ? "👁️ منظر السائق" : V.me.view === "out" ? "🎥 كاميرا خلف السيارة" : "🛰️ كاميرا عالية", "", 900); OSW.audio && OSW.audio.sfx("pop"); } else V.exit(); });
    }
    document.documentElement.classList.toggle("driving", on); h.hidden = !on; if (on) h.querySelector("#chName").textContent = (V.CARS[V.me.car].e) + " " + V.CARS[V.me.car].n + (V.me.role === "p" ? " (راكب)" : "") + (() => { const c2 = V.owned().find((x) => x.id === V.me.id); return c2 && c2.cargo && c2.cargo.length ? " · 🐾 " + c2.cargo.length : ""; })();
    if (!on && V.resetWheel) V.resetWheel(); h.classList.toggle("passenger", !!(V.me && V.me.role === "p"));
    ["btnSprint", "zoomctl", "guide", "joy"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.visibility = on ? "hidden" : ""; });
  }
  V.hud = hud;

  /* ---------- بيع السيارات + معرض جديد (تصنيفات، ألوان، مواقف) ---------- */
  const esc2 = (x) => String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  V.SELL_RATE = 0.6;
  V.sellValue = (car) => Math.floor(((V.CARS[car.car] || {}).price || 0) * V.SELL_RATE);
  // حدث جديد "csellcar": يرجّع 60% من السعر. ما بينباع إذا فيها حيوانات/كراتين (لازم تفضّيها أول). الأحداث القديمة ما بتتأثر.
  V.fold = (ty, e, d, t, a, day, S, H) => {
    if (ty !== "csellcar") return false;
    const i = S.cars.findIndex((x) => x.id === d.id); if (i < 0) return true; const c = S.cars[i];
    if ((c.cargo && c.cargo.length) || (c.crates && c.crates.length)) return true;
    S.coins += Math.floor(((V.CARS[c.car] || {}).price || 0) * V.SELL_RATE); S.cars.splice(i, 1); H.mark(); return true;
  };
  const LOT_NAME = { A: "القرية 🏘️", H: "كراج البيت 🏡", B: "الجزيرة 🏝️", free: "مركونة بالطريق 🅿️" };
  // رسمة جانبية صغيرة (SVG) للسيارة بلونها — بتبيّن الفرق بين الأشكال بالكتالوج بدون تحميل مجسمات
  V.icon = (kind, color) => {
    const D = V.CARS[kind] || V.CARS.sedan, P = D.shape, L = P.len, hl = L / 2, sc = Math.min(14, 108 / L), X = (z) => (60 + z * sc).toFixed(1), Y = (h) => (50 - h * sc).toFixed(1), y1 = P.y1, wr = P.wr || 0.38 + (P.lift || 0) * 0.6, lf = P.lift || 0;
    const cf = hl - P.hood, cb = -hl + P.trunk, roof = P.open ? y1 + 0.55 : Math.max(P.roof, y1 + 0.78), glass = "#bfe6ff", dark = "#2b2d38", tr = P.type === "tractor";
    let o = `<svg viewBox="0 0 120 58" class="vicon" aria-hidden="true">`;
    if (tr) {
      o += `<rect x="${X(cf - 0.1)}" y="${Y(1.4 + lf)}" width="${(P.hood * sc).toFixed(1)}" height="${(1.0 * sc).toFixed(1)}" rx="2" fill="${color}"/><rect x="${X(cb)}" y="${Y(1.95 + lf)}" width="${((cf - cb) * sc).toFixed(1)}" height="${(1.4 * sc).toFixed(1)}" fill="none" stroke="${dark}" stroke-width="1.6"/>`;
      o += `<circle cx="${X(-hl + 1)}" cy="${Y(0.95)}" r="${(0.95 * sc).toFixed(1)}" fill="${dark}"/><circle cx="${X(hl - 1)}" cy="${Y(0.52)}" r="${(0.52 * sc).toFixed(1)}" fill="${dark}"/></svg>`; return o;
    }
    o += `<rect x="${X(-hl)}" y="${Y(y1)}" width="${(L * sc).toFixed(1)}" height="${((y1 - 0.25) * sc).toFixed(1)}" rx="2" fill="${color}"/>`;
    if (P.box) o += `<rect x="${X(-hl)}" y="${Y(0.25 + P.box.h)}" width="${(P.trunk * sc).toFixed(1)}" height="${(P.box.h * sc).toFixed(1)}" rx="1.5" fill="${P.box.c || color}" stroke="rgba(0,0,0,.25)"/>`;
    if (P.bed) o += `<rect x="${X(-hl)}" y="${Y(y1)}" width="${(P.trunk * sc).toFixed(1)}" height="${(0.3 * sc).toFixed(1)}" fill="${dark}" opacity=".55"/>`;
    o += P.open ? `<polyline points="${X(cb)},${Y(y1)} ${X(cb + 0.1)},${Y(roof)} ${X(cf - 0.5)},${Y(roof - 0.15)} ${X(cf)},${Y(y1)}" fill="none" stroke="${dark}" stroke-width="1.8"/>` : `<polygon points="${X(cb)},${Y(y1)} ${X(cb + 0.18)},${Y(roof)} ${X(cf - 0.5)},${Y(roof)} ${X(cf)},${Y(y1)}" fill="${glass}" stroke="${color}" stroke-width="2"/>`;
    if (P.light) o += `<rect x="${X((cf + cb) / 2 - 0.3)}" y="${Y(roof + 0.18)}" width="${(0.6 * sc).toFixed(1)}" height="${(0.18 * sc).toFixed(1)}" fill="${P.light[0]}"/>`;
    if (P.sign) o += `<rect x="${X((cf + cb) / 2 - 0.25)}" y="${Y(roof + 0.2)}" width="${(0.5 * sc).toFixed(1)}" height="${(0.2 * sc).toFixed(1)}" fill="#fff3b0"/>`;
    const ax = P.ax || 0.95; [hl - ax, -hl + ax].forEach((z) => { o += `<circle cx="${X(z)}" cy="${Y(wr)}" r="${(wr * sc).toFixed(1)}" fill="${dark}"/><circle cx="${X(z)}" cy="${Y(wr)}" r="${(wr * sc * 0.45).toFixed(1)}" fill="#c0c4cc"/>`; });
    if (P.dual) o += `<circle cx="${X(-hl + ax + 1.25)}" cy="${Y(wr)}" r="${(wr * sc).toFixed(1)}" fill="${dark}"/>`;
    return o + `</svg>`;
  };
  V.ui = { cat: "all", confirm: null, busy: false };
  V.showroom = (keep) => {
    const card0 = document.getElementById("modalCard"), sc0 = keep === true && card0 ? card0.scrollTop : 0, ch0 = keep === true && card0 && card0.querySelector(".vchips") ? card0.querySelector(".vchips").scrollLeft : 0;   // التحديث من جوا بدون ما ترجع الصفحة لفوق
    const G2 = OSW.game, s = G2.state(), sel = G2.ui.ccolor || V.COLORS[0], busy = busyIds(), bar = (v, m) => `<div class="progress" style="height:6px;margin:1px 0"><i style="width:${Math.round(Math.min(1, v / m) * 100)}%"></i></div>`;
    const items = Object.entries(V.CARS).filter(([, C]) => V.ui.cat === "all" || C.cat === V.ui.cat).sort((a, b) => a[1].price - b[1].price);
    const cards = items.map(([k, C]) => `<div class="seed carc"><span class="vi">${V.icon(k, sel)}</span><b>${esc2(C.n)}</b><small>${esc2(C.note)}</small><div class="stat">⚡ السرعة ${bar(C.vmax, 50)}🚀 التسارع ${bar(C.acc, 19)}🎯 التحكم ${bar(C.hand, 1.8)}🎛️ الفرامل ${bar(C.brake, 28)}<span class="vspec">📦 حمولة ${C.cargo} · 👥 ${C.seats} مقاعد</span></div><button class="btn sm gold" data-act="g-v-buy" data-k="${k}" ${s.coins < C.price ? "disabled" : ""}>${C.price}🪙 اشتري</button></div>`).join("") || `<p class="hint">ما في مركبات بهالتصنيف</p>`;
    const mine = s.cars.map((c) => {
      const C = V.CARS[c.car] || V.CARS.sedan, at = V.atOf(c), inUse = busy.has(c.id), loaded = (c.cargo && c.cargo.length) || (c.crates && c.crates.length), val = V.sellValue(c), askSell = V.ui.confirm === c.id;
      const park = ["A", "H", "B"].filter((l) => l !== at).map((l) => `<button class="btn sm alt" data-act="g-v-park" data-id="${c.id}" data-at="${l}" ${inUse ? "disabled" : ""}>🅿️ ${l === "A" ? "القرية" : l === "H" ? "البيت" : "الجزيرة"}</button>`).join("");
      const sell = askSell ? `<button class="btn sm berry" data-act="g-v-sell" data-id="${c.id}" data-ok="1">✅ تأكيد البيع +${val}🪙</button><button class="btn sm alt" data-act="g-v-sell" data-id="${c.id}" data-ok="0">إلغاء</button>` : `<button class="btn sm alt" data-act="g-v-sell" data-id="${c.id}" ${inUse || loaded ? "disabled" : ""}>💰 بيع ${val}🪙</button>`;
      return `<div class="irow vmine"><span class="ie">${V.icon(c.car, c.color)}</span><div class="iname"><b>${esc2(C.n)}</b><small><span class="dot" style="background:${c.color}"></span> ${LOT_NAME[at] || LOT_NAME.A}${inUse ? " · مستخدمة هلأ" : ""}${loaded ? " · فيها حمولة (فضّيها قبل البيع)" : ""}</small></div><div class="ib vbtns"><button class="btn sm alt" data-act="g-v-paint" data-id="${c.id}" ${s.coins < 30 ? "disabled" : ""}>🎨 دهان 30🪙</button>${park}${sell}</div></div>`;
    }).join("");
    const chips = V.CATS.map(([id, e, n]) => `<button class="vchip ${V.ui.cat === id ? "on" : ""}" data-act="g-v-cat" data-k="${id}">${e} ${n}</button>`).join("");
    OSW.ui.openModal(`<h3>🚗 معرض السيارات <small style="font-size:13px">(${Object.keys(V.CARS).length} مركبة)</small></h3><div class="coinbar">🪙 <b>${s.coins}</b></div><p class="hint">كل مركبة إلها شكل وسرعة وتسارع وتحكم وحمولة. بتسوقوا من جوا المركبة، وشريكك بيركب راكب. الطريق الطويل للجزيرة للسيارات بس!</p>
      <div style="margin:8px 0"><b>لون المركبة الجديدة:</b><div class="dr-colors" style="justify-content:flex-start;margin-top:6px">${V.COLORS.map((c) => `<button class="dr-c ${sel === c ? "on" : ""}" data-act="g-v-color" data-k="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div></div>
      ${s.cars.length ? `<b>مركباتكم (${s.cars.length})</b><div class="items" style="margin:8px 0">${mine}</div><p class="hint">اضغط على المركبة بالموقف لتركبها 🚪. تقدروا تنقلوها بين مواقف القرية والبيت والجزيرة، وتدهنوها، أو تبيعوها بـ60% من سعرها.</p>` : ""}
      <b>الكتالوج</b><div class="vchips">${chips}</div><div class="seeds" style="display:block">${cards}</div>`);
    if (keep === true) { const c1 = document.getElementById("modalCard"); if (c1) { c1.scrollTop = sc0; const v1 = c1.querySelector(".vchips"); if (v1) v1.scrollLeft = ch0; } }
  };
  V.click = async (a, el) => {
    const d = el.dataset, G2 = OSW.game, ui = OSW.ui; if (V.ui.busy) return; V.ui.busy = true;
    try {
      if (a === "g-v-cat") { V.ui.cat = d.k; }
      else if (a === "g-v-color") { G2.ui.ccolor = d.k; }
      else if (a === "g-v-buy") { const C = V.CARS[d.k]; if (!C) return; if (G2.state().coins < C.price) return ui.toast("🪙 ما معك مصاري كفاية"); await G2.do("cbuy", { car: d.k, color: G2.ui.ccolor || V.COLORS[0] }); OSW.audio && OSW.audio.sfx("magic"); ui.toast("🚗 مبروك! " + C.n + " صارت إلكم. بتلاقوها بموقف القرية"); }
      else if (a === "g-v-paint") { await G2.do("cpaint", { id: d.id, color: G2.ui.ccolor || V.COLORS[0] }); OSW.audio && OSW.audio.sfx("magic"); ui.toast("🎨 انتغيّر لون السيارة"); }
      else if (a === "g-v-park") { if (busyIds().has(d.id)) return ui.toast("🚗 السيارة مستخدمة هلأ"); await G2.do("cpark", { id: d.id, at: d.at }); ui.toast("🅿️ انركنت بـ" + (LOT_NAME[d.at] || "")); }
      else if (a === "g-v-sell") {
        const car = V.owned().find((c) => c.id === d.id); if (!car) return;
        if (d.ok == null) { V.ui.confirm = car.id; }
        else if (d.ok === "0") V.ui.confirm = null;
        else {
          V.ui.confirm = null; if (busyIds().has(car.id)) return ui.toast("🚗 السيارة مستخدمة هلأ");
          if ((car.cargo && car.cargo.length) || (car.crates && car.crates.length)) return ui.toast("📦 فضّي الحمولة قبل ما تبيع");
          const val = V.sellValue(car); await G2.do("csellcar", { id: car.id }); OSW.audio && OSW.audio.sfx("coin"); ui.toast("💰 بعتوا السيارة وقبضتوا " + val + "🪙");
        }
      }
    } catch (er) { console.warn("[veh] click", er); } finally { V.ui.busy = false; }
    V.showroom(true);
  };
  // ربط بدون تعديل ملفات ثانية: حدث البيع + أزرار المعرض + صفحة المعرض الجديدة
  let installed = false;
  V.install = () => {
    if (installed) return true; if (!(OSW.fam && OSW.fam.fold && OSW.game && OSW.game.openers && OSW.game.click)) return false;
    const of = OSW.fam.fold; OSW.fam.fold = (ty, e, d, t, a, day, S, H) => (ty === "csellcar" ? V.fold(ty, e, d, t, a, day, S, H) : of(ty, e, d, t, a, day, S, H));
    const oc = OSW.game.click; OSW.game.click = (a, el) => (typeof a === "string" && a.indexOf("g-v-") === 0 ? V.click(a, el) : oc(a, el));
    OSW.game.openers.cars = V.showroom; installed = true; return true;
  };
  if (!V.install()) { const tryI = () => V.install(); document.addEventListener("DOMContentLoaded", tryI); window.addEventListener("load", tryI); }
  // وصف مختصر للشريك بالرسائل
  V.pack = () => (V.me ? { id: V.me.id, car: V.me.car, color: V.me.color, role: V.me.role } : null);
})();
