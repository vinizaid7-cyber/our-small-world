/* اقتصاد القرية: المزرعة (بالإيد)، الدكان، المحل، الورد، الحجّي والحجّة، العربة، الطلبات
   كل شي محفوظ كـ"أحداث" (entries) وبنحسب الحالة منها، فما في تعارض بين تلفونين. */
(function () {
  const OSW = window.OSW, { esc, nl2br } = OSW;
  const G = (OSW.game = { ui: { tab: "food", last: "tomato", wtab: "outfit" }, _s: null, _k: "" });
  let db, ui;
  G.init = (d, u) => { db = d; ui = u; };

  /* ---------- الكتالوج ---------- */
  const CROPS = (G.CROPS = {
    wheat: { n: "قمح", e: "🌾", g: 10, seed: 2, sell: 5, c: "#e9c46a" }, cucumber: { n: "خيار", e: "🥒", g: 15, seed: 3, sell: 7, c: "#4caf50" },
    tomato: { n: "بندورة", e: "🍅", g: 20, seed: 4, sell: 9, c: "#e63946" }, carrot: { n: "جزر", e: "🥕", g: 25, seed: 4, sell: 10, c: "#ff8c42" },
    strawberry: { n: "فراولة", e: "🍓", g: 40, seed: 8, sell: 20, c: "#ff4d6d" }, corn: { n: "ذرة", e: "🌽", g: 60, seed: 10, sell: 26, c: "#ffd23f" },
    lemon: { n: "ليمون", e: "🍋", g: 75, seed: 12, sell: 33, c: "#f5e663" }, watermelon: { n: "بطيخ", e: "🍉", g: 90, seed: 16, sell: 44, c: "#2e9e5b" },
    grapes: { n: "عنب", e: "🍇", g: 120, seed: 20, sell: 56, c: "#7b3fa0" },
  });
  const F = (n, e, price, food, drink, joy, cat) => ({ n, e, price, food, drink, joy, cat });
  const FOOD = (G.FOOD = {
    bread: F("خبز طازة", "🥖", 3, 22, 0, 2, "food"), taboon: F("خبز طابون", "🫓", 4, 26, 0, 3, "food"), cheese: F("جبنة بلدية", "🧀", 6, 25, 0, 3, "food"),
    labneh: F("لبنة بزيت", "🥣", 6, 22, 4, 4, "food"), hummus: F("حمّص", "🧆", 7, 24, 0, 5, "food"), falafel: F("فلافل", "🧆", 6, 20, 0, 4, "food"),
    eggs: F("بيض مقلي", "🍳", 6, 22, 0, 3, "food"), rice: F("أرز", "🍚", 9, 30, 2, 5, "food"), soup: F("شوربة عدس", "🥣", 8, 24, 10, 6, "food"),
    maqluba: F("مقلوبة", "🍛", 20, 45, 6, 14, "food"), mansaf: F("منسف", "🍲", 25, 55, 5, 22, "food"), fish: F("سمك مشوي", "🐟", 18, 40, 0, 10, "food"),
    chicken: F("دجاج مشوي", "🍗", 16, 38, 0, 9, "food"), dates: F("تمر", "🌴", 4, 14, 0, 3, "food"), olives: F("زيتون", "🫒", 4, 10, 0, 2, "food"),
    apple: F("تفاح", "🍎", 3, 8, 6, 2, "food"), orange: F("برتقال", "🍊", 3, 8, 8, 2, "food"), banana: F("موز", "🍌", 3, 12, 0, 2, "food"), nuts: F("مكسرات", "🥜", 6, 14, 0, 4, "food"),
    water: F("ماء بارد", "💧", 2, 0, 20, 0, "drink"), tea: F("شاي بالنعنع", "🫖", 4, 0, 24, 4, "drink"), coffee: F("قهوة عربية", "☕", 5, 0, 18, 6, "drink"),
    laban: F("لبن", "🥛", 3, 8, 14, 2, "drink"), juice: F("عصير برتقال", "🧃", 5, 2, 26, 5, "drink"), lemonade: F("ليمون بالنعنع", "🍹", 5, 0, 28, 6, "drink"),
    tamar: F("تمر هندي", "🥤", 5, 0, 26, 5, "drink"), yansoon: F("ينسون", "🍵", 4, 0, 22, 5, "drink"), sahlab: F("سحلب", "🥛", 8, 10, 16, 12, "drink"),
    kanafeh: F("كنافة", "🍯", 12, 18, 0, 18, "sweet"), baklava: F("بقلاوة", "🥮", 10, 14, 0, 16, "sweet"), qatayef: F("قطايف", "🥞", 9, 14, 0, 14, "sweet"),
    halawa: F("حلاوة", "🍫", 6, 12, 0, 10, "sweet"), cake: F("كيكة", "🍰", 14, 20, 0, 20, "sweet"), icecream: F("بوظة", "🍦", 6, 4, 6, 12, "sweet"),
    maamoul: F("معمول", "🍪", 8, 14, 0, 14, "sweet"), harissa: F("هريسة", "🍮", 8, 16, 0, 12, "sweet"),
  });
  const GIFTS = (G.GIFTS = {
    card: { n: "كرت حب", e: "💌", price: 6 }, balloon: { n: "بالونة", e: "🎈", price: 8 }, rose: { n: "وردة حمرا", e: "🌹", price: 12 }, choc: { n: "شوكولاتة", e: "🍫", price: 15 },
    book: { n: "كتاب", e: "📖", price: 20 }, plant: { n: "نبتة", e: "🪴", price: 25 }, bouquet: { n: "بوكيه ورد", e: "💐", price: 30 }, lantern: { n: "فانوس", e: "🏮", price: 35 },
    teddy: { n: "دبدوب", e: "🧸", price: 40 }, perfume: { n: "عطر", e: "🧴", price: 45 }, musicbox: { n: "صندوق موسيقى", e: "🎵", price: 60 }, watch: { n: "ساعة", e: "⌚", price: 90 },
    necklace: { n: "عقد", e: "📿", price: 110 }, ring: { n: "خاتم", e: "💍", price: 120 },
  });
  const HOUR = 3600000;
  const AN = (G.AN = {
    chicken: { n: "دجاجة", e: "🐔", price: 15, mature: 24 * HOUR, sell: 32, cap: 8, prod: "egg", period: 8 * HOUR, note: "بتبيّض كل 8 ساعات بعد ما تكبر (يوم)" },
    sheep: { n: "خروف", e: "🐑", price: 60, mature: 72 * HOUR, sell: 170, cap: 6, note: "بيكبر بـ3 أيام وبعدين بتبيعه للملحمة" },
    cow: { n: "بقرة", e: "🐄", price: 130, mature: 96 * HOUR, sell: 380, cap: 3, prod: "milk", period: 12 * HOUR, note: "بتعطي حليب كل 12 ساعة بعد ما تكبر (4 أيام)" },
  });
  const PRODUCE = (G.PRODUCE = { egg: { n: "بيض", e: "🥚", sell: 4 }, milk: { n: "حليب طازج", e: "🥛", sell: 11 }, fish_s: { n: "سمكة صغيرة", e: "🐟", sell: 6 }, fish_m: { n: "سمكة كبيرة", e: "🐠", sell: 16 }, fish_g: { n: "سمكة ذهبية", e: "✨🐟", sell: 80 }, boot: { n: "حذاء قديم", e: "🥾", sell: 1 } });
  const SUPPLY = (G.SUPPLY = { hay: { n: "علف الحيوانات", e: "🌾", price: 6, note: "بيطعم كل الحيوانات 24 ساعة" }, wcan: { n: "ماء سقاية الورد", e: "💦", price: 3, note: "سقية وحدة" }, fert: { n: "سماد المزرعة", e: "🌿", price: 8, note: "بيسرّع نمو الزرعة 25%" } });
  const CLOTH = (G.CLOTH = Object.fromEntries(Object.entries(OSW.CLOTHES).filter(([k]) => k !== "casual")));
  const FURNITEMS = Object.fromEntries(Object.entries(OSW.FURN).map(([k, f]) => ["fu_" + k, { n: f.n, e: f.e, price: f.price, furn: 1 }]));
  const ITEM = (G.ITEM = Object.assign({}, FOOD, SUPPLY, Object.fromEntries(Object.entries(PRODUCE).map(([k, v]) => [k, { n: v.n, e: v.e, price: 0, produce: 1 }])), GIFTS, FURNITEMS, Object.fromEntries(Object.entries(CLOTH).map(([k, v]) => ["cl_" + k, Object.assign({ cloth: 1 }, v)])), Object.fromEntries(Object.entries(CROPS).map(([k, v]) => [k, { n: v.n, e: v.e, price: v.seed, crop: 1 }]))));
  const PLOTS = 12, SALARY = 100, CART_MAX = 12, CARRY_MAX = 3, PULL_MS = 20000;
  const DECAY = { food: 100 / (22 * 3600000), drink: 100 / (16 * 3600000), joy: 100 / (40 * 3600000) };
  const SLOT_MS = 12 * 3600000, SLOT_OFF = 2 * 3600000;                                 // جولتين بكل يوم: 5ص و5م (بتوقيت عمّان)
  const MILES = { 6: 10, 14: 25, 28: 60, 60: 150, 120: 300, 200: 500 };

  /* ---------- أدوات ---------- */
  const dayKey = (t) => Math.floor((t + 3 * 3600000) / 86400000);
  const slotOf = (t) => Math.floor((t - SLOT_OFF) / SLOT_MS);
  G.today = () => dayKey(Date.now()); G.slot = () => slotOf(Date.now());
  G.slotName = (s) => (((s % 2) + 2) % 2 === 0 ? "الصباحية ☀️" : "المسائية 🌙");
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rnd01 = (s) => (hash(s) % 10000) / 10000;
  const FOOD_IDS = Object.keys(FOOD);
  G.reqOf = (day, who) => FOOD_IDS[hash("req" + day + who) % FOOD_IDS.length];
  G.priceOf = (crop, day) => Math.max(1, Math.round(CROPS[crop].sell * (0.85 + 0.35 * rnd01(crop + ":" + day))));
  G.trend = (crop, day) => { const a = G.priceOf(crop, day), b = G.priceOf(crop, day - 1); return a > b ? "▲" : a < b ? "▼" : "•"; };
  const WANDERERS = ["abukhaled", "umahmad", "samer", "khalasuad", "abuali", "fadi"];
  const ORDER_CROPS = ["wheat", "cucumber", "tomato", "carrot", "strawberry", "corn", "lemon"];
  G.ordersOf = (day) => [0, 1, 2].map((i) => {
    const npc = WANDERERS[hash("n" + day + i) % WANDERERS.length], crop = ORDER_CROPS[hash("c" + day + i) % ORDER_CROPS.length], qty = 2 + (hash("q" + day + i) % 3);
    return { idx: i, day, npc, crop, qty, reward: Math.round(CROPS[crop].sell * qty * 1.5) + 3 };
  });
  const cost = (price, qty, buys) => Math.ceil(price * qty * (buys >= 30 ? 0.9 : 1));
  const growMs = (p) => CROPS[p.crop].g * 60000 * (p.fert ? 0.75 : 1);
  const left = (m) => (m >= 60 ? Math.floor(m / 60) + " س " + (m % 60) + " د" : m + " د");

  /* ---------- حساب الحالة من الأحداث ---------- */
  function fold(events) {
    const S = { coins: 50, inv: {}, plots: Array(PLOTS).fill(null), m: { hajji: { food: 70, drink: 70, joy: 60, up: false }, hajjeh: { food: 70, drink: 70, joy: 60, up: false } }, mt: 0,
      slots: {}, comp: {}, streak: 0, lastComp: -99, runStart: 0, paidMile: {}, orders: {}, till: {}, tillPaid: {}, buys: 0, harvests: 0, plants: 0, sells: 0, feeds: 0, refused: 0, blessed: {}, gifts: [],
      tog: {}, acts: {}, fed: {}, carry: {}, cart: { crates: [], pulls: [], deliveries: 0, last: null }, barnT: 0, animals: [], acarry: {}, asold: 0, sheepSold: 0, draws: {}, drawCoins: {}, furn: {}, scenes: {}, sceneCoins: {}, wedGifts: {}, weddings: 0 };
    OSW.HOME.defaults.forEach((d) => (S.furn[d.id] = { id: d.id, item: d.item, x: d.x, z: d.z, rot: d.rot }));
    const ev = events.slice().sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id < b.id ? -1 : 1));
    S.mt = ev.length ? new Date(ev[0].created_at).getTime() : Date.now();
    const decay = (t) => { const dt = Math.max(0, t - S.mt); ["hajji", "hajjeh"].forEach((w) => { const m = S.m[w]; m.food = Math.max(0, m.food - dt * DECAY.food); m.drink = Math.max(0, m.drink - dt * DECAY.drink); m.joy = Math.max(0, m.joy - dt * DECAY.joy); if (m.food < 15 || m.drink < 15) m.up = true; }); S.mt = t; };
    const add = (id, n) => (S.inv[id] = (S.inv[id] || 0) + n);
    const adv = (an, t) => { if (t <= an.mt) return; const A = AN[an.kind], dt = Math.max(0, Math.min(t, an.fedUntil) - an.mt); an.age += dt; if (A.prod) { const md = Math.max(0, Math.min(dt, an.age - A.mature)); an.prod = Math.min(3 * A.period, an.prod + md); } an.mt = t; };
    const acar = (a) => (S.acarry[a] = S.acarry[a] || []);
    const car = (a) => (S.carry[a] = S.carry[a] || []);
    ev.forEach((e) => {
      const t = new Date(e.created_at).getTime(), d = e.data || {}, day = dayKey(t), a = e.author, ty = e.title;
      const mark = () => { (S.acts[day] = S.acts[day] || {})[a + ":" + ty] = 1; };
      if (ty === "buy") {
        const it = ITEM[d.id]; if (!it || it.crop || !(d.qty >= 1 && d.qty <= 99)) return; if (it.cloth && ((S.inv[d.id] || 0) >= 1 || d.qty !== 1)) return;
        const c = cost(it.price, d.qty, S.buys); if (S.coins < c) return;
        S.coins -= c; add(d.id, d.qty); S.buys += d.qty; mark(); if (it.cloth) S.lastCloth = { a, t };
        const wk = Math.floor(day / 7); S.till[wk] = (S.till[wk] || 0) + c * 0.3;
        if (S.till[wk] >= SALARY && !S.tillPaid[wk]) { S.tillPaid[wk] = 1; S.coins += 10; }
      } else if (ty === "plant") {
        const c = CROPS[d.crop], p = d.plot; if (!c || !(p >= 0 && p < PLOTS) || S.plots[p] || S.coins < c.seed) return;
        const fert = !!d.fert && (S.inv.fert || 0) >= 1; if (fert) add("fert", -1);
        S.coins -= c.seed; S.plots[p] = { crop: d.crop, at: t, fert }; S.plants++; mark();
      } else if (ty === "harvest") {
        const p = S.plots[d.plot]; if (!p || t - p.at < growMs(p) - 1500 || car(a).length >= CARRY_MAX) return;
        car(a).push({ crop: p.crop, units: 2 + (hash(e.id) % 2) }); S.plots[d.plot] = null; S.harvests++; mark();
      } else if (ty === "stash") {
        const cs = car(a); if (!cs.length) return; cs.forEach((c) => add(c.crop, c.units)); S.carry[a] = []; mark();
      } else if (ty === "sellcrate") {
        const cs = car(a); if (!cs.length) return; cs.forEach((c) => { S.coins += G.priceOf(c.crop, day) * c.units; S.sells += c.units; }); S.carry[a] = []; mark();
      } else if (ty === "cart_load") {
        const cs = car(a); if (!cs.length || S.cart.crates.length >= CART_MAX) return; while (cs.length && S.cart.crates.length < CART_MAX) S.cart.crates.push(cs.shift()); mark();
      } else if (ty === "cart_pull") {
        if (!S.cart.crates.length) return; S.cart.pulls = S.cart.pulls.filter((p) => t - p.t <= PULL_MS && p.a !== a); S.cart.pulls.push({ a, t });
        const other = S.cart.pulls.find((p) => p.a !== a && t - p.t <= PULL_MS);
        if (other) { let gain = 0; S.cart.crates.forEach((c) => (gain += Math.floor(G.priceOf(c.crop, day) * 1.15) * c.units)); S.coins += gain; S.cart.last = { t, n: S.cart.crates.length, gain }; S.cart.deliveries++; S.cart.crates = []; S.cart.pulls = []; }
      } else if (ty === "sell") {
        const c = CROPS[d.id], q = d.qty; if (!c || !(q >= 1) || (S.inv[d.id] || 0) < q) return;
        add(d.id, -q); S.coins += Math.floor(G.priceOf(d.id, day) * (d.stand ? 0.8 : 1)) * q; S.sells += q; mark();
      } else if (ty === "feed") {
        const f = FOOD[d.item], w = d.who; if (!f || !S.m[w] || (S.inv[d.item] || 0) < 1) return;
        decay(t); const m = S.m[w];
        if (m.up && d.item !== G.reqOf(day, w)) { S.refused++; (S.lastRefuse = S.lastRefuse || {})[w] = t; return; }
        add(d.item, -1); m.food = Math.min(100, m.food + f.food); m.drink = Math.min(100, m.drink + f.drink); m.joy = Math.min(100, m.joy + f.joy + (m.up ? 12 : 0)); if (m.up) m.up = false; S.feeds++; mark();
        (S.fed[day] = S.fed[day] || {})[w] = 1;
        if (!S.blessed[day] && ["hajji", "hajjeh"].every((x) => S.m[x].food >= 55 && S.m[x].drink >= 55 && !S.m[x].up)) { S.blessed[day] = 1; S.coins += 8; }
      } else if (ty === "story") {
        decay(t); ["hajji", "hajjeh"].forEach((w) => (S.m[w].joy = Math.min(100, S.m[w].joy + 6))); mark();
      } else if (ty === "water") {
        if ((S.inv.wcan || 0) < 1) return; const s = slotOf(t), set = (S.slots[s] = S.slots[s] || {}); if (set[a]) return;
        add("wcan", -1); set[a] = 1; mark();
        if (Object.keys(set).length >= 2 && !S.comp[s]) {
          S.comp[s] = 1; if (S.lastComp >= s - 2) S.streak++; else { S.streak = 1; S.runStart = s; } S.lastComp = s;
          const r = MILES[S.streak], k = S.runStart + ":" + S.streak; if (r && !S.paidMile[k]) { S.paidMile[k] = 1; S.coins += r; }
        }
      } else if (ty === "order") {
        const o = G.ordersOf(d.day)[d.idx]; if (!o || d.day !== day || S.orders[d.day + ":" + d.idx] || (S.inv[o.crop] || 0) < o.qty) return;
        add(o.crop, -o.qty); S.coins += o.reward; S.orders[d.day + ":" + d.idx] = 1; mark();
      } else if (ty === "gift") {
        const g = GIFTS[d.id]; if (!g || S.coins < g.price) return; S.coins -= g.price; S.gifts.push({ id: d.id, from: a, note: String(d.note || "").slice(0, 140), t, key: e.id }); mark();
      } else if (ty === "scene") {
        const sc = OSW.events && OSW.events.SCENES.find((x) => x.id === d.id); if (!sc) return; const key = day + ":" + sc.id; if (S.scenes[key]) return;
        let rw = d.ok ? sc.win : sc.lose; if (rw > 0) { S.sceneCoins[day] = S.sceneCoins[day] || 0; rw = Math.min(rw, Math.max(0, 40 - S.sceneCoins[day])); S.sceneCoins[day] += rw; }
        S.coins = Math.max(0, S.coins + rw); if (d.ok && sc.item) add(sc.item, 1); S.scenes[key] = 1; mark();
      } else if (ty === "wedding_gift") {
        const w = OSW.events && OSW.events.weddingAt(t); if (!w || d.day !== day || ![10, 25, 50].includes(d.amt) || S.coins < d.amt) return;
        const k = day + ":" + a; if ((S.wedGifts[k] || 0) >= 2) return;
        S.coins -= d.amt; S.wedGifts[k] = (S.wedGifts[k] || 0) + 1; add("baklava", 1); if (d.formal) S.coins += Math.floor(d.amt * 0.3); S.weddings++; mark();
      } else if (ty === "furn_place") {
        const it = d.item, f = OSW.FURN[it]; if (!f || (S.inv["fu_" + it] || 0) < 1) return;
        const rot = ((d.rot | 0) % 4 + 4) % 4; if (!OSW.HOME.valid(it, +d.x, +d.z, rot, Object.values(S.furn), null)) return;
        add("fu_" + it, -1); S.furn[e.id] = { id: e.id, item: it, x: +d.x, z: +d.z, rot }; mark();
      } else if (ty === "furn_move") {
        const f = S.furn[d.inst]; if (!f) return; const rot = ((d.rot | 0) % 4 + 4) % 4;
        if (!OSW.HOME.valid(f.item, +d.x, +d.z, rot, Object.values(S.furn), f.id)) return; f.x = +d.x; f.z = +d.z; f.rot = rot; mark();
      } else if (ty === "furn_pick") {
        const f = S.furn[d.inst]; if (!f) return; add("fu_" + f.item, 1); delete S.furn[d.inst]; mark();
      } else if (ty === "furn_sell") {
        const f = S.furn[d.inst]; if (!f) return; S.coins += Math.floor(OSW.FURN[f.item].price * 0.7); delete S.furn[d.inst]; mark();
      } else if (ty === "abuy") {
        const A = AN[d.kind]; if (!A || S.coins < A.price || S.animals.filter((x) => x.kind === d.kind).length >= A.cap) return;
        S.coins -= A.price; S.animals.push({ id: e.id, kind: d.kind, born: t, mt: t, age: 0, prod: 0, fedUntil: t + 6 * HOUR }); mark();
      } else if (ty === "afeed") {
        if ((S.inv.hay || 0) < 1 || !S.animals.length) return; add("hay", -1);
        S.animals.forEach((an) => { adv(an, t); an.fedUntil = Math.min(t + 48 * HOUR, Math.max(t, an.fedUntil) + 24 * HOUR); }); mark();
      } else if (ty === "acollect") {
        let eg = 0, mk = 0; S.animals.forEach((an) => { adv(an, t); const A = AN[an.kind]; if (!A.prod) return; const u = Math.floor(an.prod / A.period); an.prod -= u * A.period; if (A.prod === "egg") eg += u; else mk += u; });
        if (!eg && !mk) return; if (eg) add("egg", eg); if (mk) add("milk", mk); mark();
      } else if (ty === "acarry") {
        const i = S.animals.findIndex((x) => x.id === d.id), cs = acar(a); if (i < 0 || cs.length >= 2) return; const an = S.animals[i]; adv(an, t); if (an.age < AN[an.kind].mature) return;
        S.animals.splice(i, 1); cs.push(an); mark();
      } else if (ty === "adrop") {
        const cs = acar(a); if (!cs.length) return; const back = []; cs.forEach((an) => { if (S.animals.filter((x) => x.kind === an.kind).length < AN[an.kind].cap) { an.mt = t; S.animals.push(an); } else back.push(an); }); S.acarry[a] = back; mark();
      } else if (ty === "asell") {
        const cs = acar(a); if (!cs.length) return; cs.forEach((an) => { S.coins += AN[an.kind].sell; S.asold++; if (an.kind === "sheep") S.sheepSold++; }); S.acarry[a] = []; mark();
      } else if (ty === "fish") {
        if (PRODUCE[d.id] && d.id !== "egg" && d.id !== "milk") { add(d.id, 1); S.fished = (S.fished || 0) + 1; mark(); }
      } else if (ty === "psell") {
        const p = PRODUCE[d.id], q = d.qty; if (!p || !(q >= 1) || (S.inv[d.id] || 0) < q) return; add(d.id, -q); S.coins += Math.floor(p.sell * (d.stand ? 0.8 : 1)) * q; mark();
      } else if (ty === "draw") {
        const r = (S.draws[d.round] = S.draws[d.round] || { by: {}, prompt: d.prompt }); r.by[a] = e.id;
        if (Object.keys(r.by).length >= 2 && !r.paid) { r.paid = 1; const k = day; S.drawCoins[k] = (S.drawCoins[k] || 0) + 1; if (S.drawCoins[k] <= 2) S.coins += 20; }
        mark();
      } else if (ty === "together") {
        S.tog[day] = (S.tog[day] || 0) + 1; if (S.tog[day] <= 10) S.coins += 3;
      }
    });
    return S;
  }
  G.state = () => {
    const evs = db.entries.filter((e) => e.house === "game"), key = evs.length + ":" + (evs.length ? evs[evs.length - 1].id : "") + ":" + db.uid;
    if (G._k !== key) { G._s = fold(evs); G._k = key; }
    return G._s;
  };
  G.furnList = () => Object.values(G.state().furn);
  G.carryOf = (uid) => G.state().carry[uid] || [];
  G.view = () => {
    const s = G.state(), now = Date.now(), dt = Math.max(0, now - s.mt), v = { m: {} }, day = dayKey(now), cs = slotOf(now);
    ["hajji", "hajjeh"].forEach((w) => { const m = s.m[w], f = Math.max(0, m.food - dt * DECAY.food), d = Math.max(0, m.drink - dt * DECAY.drink); v.m[w] = { food: f, drink: d, joy: Math.max(0, m.joy - dt * DECAY.joy), up: m.up || f < 15 || d < 15, req: G.reqOf(day, w) }; });
    v.today = day; v.slot = cs; v.set = s.slots[cs] || {}; v.myWater = !!v.set[db.uid]; v.partnerWater = !!(db.partner && v.set[db.partner.id]);
    v.alive = s.lastComp >= cs - 2; v.streak = v.alive ? s.streak : 0; v.completeNow = !!s.comp[cs]; v.wilt = !v.alive && s.lastComp > -99; v.thirsty = v.alive && !s.comp[cs] && s.lastComp === cs - 2;
    v.days = Math.floor(v.streak / 2);
    v.plots = s.plots.map((p) => { if (!p) return null; const c = CROPS[p.crop], gm = growMs(p), prog = Math.min(1, (now - p.at) / gm); return { crop: p.crop, progress: prog, ripe: prog >= 1, left: Math.max(0, Math.ceil((gm - (now - p.at)) / 60000)), color: c.c, fert: p.fert }; });
    v.pullWait = (() => { const me = s.cart.pulls.find((p) => p.a === db.uid && now - p.t <= PULL_MS), ot = s.cart.pulls.find((p) => p.a !== db.uid && now - p.t <= PULL_MS); return { me: !!me, other: !!ot, left: me ? Math.ceil((PULL_MS - (now - me.t)) / 1000) : 0 }; })();
    return Object.assign(v, { s });
  };
  G.animalsView = () => {
    const s = G.state(), now = Date.now(), out = [];
    s.animals.forEach((an) => { const A = AN[an.kind], c = Object.assign({}, an); const dt = Math.max(0, Math.min(now, c.fedUntil) - c.mt); c.age += dt; let prod = c.prod; if (A.prod) { const md = Math.max(0, Math.min(dt, c.age - A.mature)); prod = Math.min(3 * A.period, prod + md); }
      const prog = Math.min(1, c.age / A.mature); out.push({ id: an.id, kind: an.kind, A, age: c.age, prog, mature: prog >= 1, size: 0.45 + 0.55 * prog, units: A.prod ? Math.floor(prod / A.period) : 0, fed: an.fedUntil > now, fedLeft: Math.max(0, an.fedUntil - now), left: Math.max(0, A.mature - c.age) }); });
    return out;
  };
  G.animalCarry = (uid) => (G.state().acarry[uid] || []);
  const mine = (day, ty) => !!((G.state().acts[day] || {})[db.uid + ":" + ty]);
  G.has = (id) => (G.state().inv[id] || 0) >= 1;
  G.speedMul = () => {
    const lk = (db.kv["look:" + db.uid] || {}), o = OSW.CLOTHES[lk.outfit || "casual"] || OSW.CLOTHES.casual;
    return (o.speed || 1) * Math.pow(0.92, G.carryOf(db.uid).length) * Math.pow(0.88, G.animalCarry(db.uid).length);
  };

  /* ---------- تنفيذ الأفعال ---------- */
  G.do = async (type, data) => { await db.addEntry({ house: "game", title: type, data }); G.sync3d(); if (OSW.places) OSW.places.refresh(); if (OSW.app) OSW.app.checkAchievements(); };
  const toast = (m, c) => ui.toast(m, c || "");
  const needCoins = (n) => { const c = G.state().coins; if (c < n) { toast(`ما معك مصاري كفاية 🪙 (بدك ${n}، معك ${c})`); OSW.audio.sfx("pop"); return true; } return false; };

  /* ---------- مزامنة المشهد ثلاثي الأبعاد ---------- */
  G.sync3d = () => {
    const W = OSW.world; if (!W || !W.S || !W.S.ready || !db.me) return;
    const v = G.view(), s = v.s;
    const key = JSON.stringify([v.plots.map((p) => p && [p.crop, Math.round(p.progress * 12)]), v.streak, v.completeNow, v.wilt]);
    if (G._k3 !== key) { G._k3 = key; W.setFarm(v.plots.map((p) => p && { crop: p.crop, progress: p.progress, color: p.color, size: 1 })); W.setFlowers(v.streak, v.completeNow, v.wilt); }
    ["hajji", "hajjeh"].forEach((w) => { const m = v.m[w], lo = Math.min(m.food, m.drink); W.setNpcMood(w, v.m[w].up ? "😠" : lo < 25 ? "😢" : lo < 55 ? "😐" : "😊", lo < 40 || v.m[w].up ? "❗" : ""); });
    W.setCarry("me", G.carryOf(db.uid).map((c) => CROPS[c.crop].c)); if (db.partner) W.setCarry("partner", G.carryOf(db.partner.id).map((c) => CROPS[c.crop].c));
    W.setCart(s.cart.crates.map((c) => CROPS[c.crop].c), s.cart.last);
    W.setSpeedMul(G.speedMul());
    if (W.setAnimals) { const av = G.animalsView(); W.setAnimals(av.map((a) => ({ id: a.id, kind: a.kind, size: a.size }))); W.setAnimalCarry("me", G.animalCarry(db.uid).map((a) => a.kind)); if (db.partner) W.setAnimalCarry("partner", G.animalCarry(db.partner.id).map((a) => a.kind)); }
    const fk = JSON.stringify(G.furnList()); if (G._fk !== fk) { G._fk = fk; W.setFurniture(G.furnList()); }
    const lc = s.lastCloth, bags = lc && lc.a === db.uid && (ui.my().bagsSeen || 0) < lc.t ? Math.min(3, db.entries.filter((e) => e.house === "game" && e.title === "buy" && e.author === db.uid && new Date(e.created_at).getTime() > (ui.my().bagsSeen || 0) && /^cl_/.test((e.data || {}).id)).length) : 0;
    W.setBags(bags);
    const ripe = v.plots.filter((p) => p && p.ripe).length, lowH = ["hajji", "hajjeh"].some((w) => v.m[w].up || Math.min(v.m[w].food, v.m[w].drink) < 40) ? 1 : 0;
    const av2 = G.animalsView(); G.badges = { farm: ripe, hajji: lowH, flowers: v.myWater ? 0 : 1, pens: av2.reduce((n, a) => n + a.units, 0) + (av2.some((a) => !a.fed) ? 1 : 0), butcher: av2.filter((a) => a.mature && a.kind === "sheep").length };
    const pill = document.getElementById("coinNum"); if (pill) pill.textContent = s.coins;
    const tb = document.getElementById("taskBadge"); if (tb) { const n = G.tasks().filter((t) => !t.done).length; tb.textContent = n; tb.hidden = !n; }
    OSW.app && OSW.app.updateBadges && OSW.app.updateBadges();
    G.checkGifts();
  };
  setInterval(() => { try { if (db && db.me) G.sync3d(); } catch (e) {} }, 15000);

  G.checkGifts = () => {
    const s = G.state(), my = ui.my(), seen = my.giftSeen || 0, inc = s.gifts.filter((g) => g.from !== db.uid);
    if (inc.length > seen) {
      const g = inc[seen], it = GIFTS[g.id]; ui.saveMy({ giftSeen: seen + 1 }); OSW.audio.sfx("fanfare"); ui.hearts(it.e, 20);
      ui.openModal(`<h3>🎁 وصلتك هدية!</h3><div class="pick"><div style="font-size:72px">${it.e}</div><b>${esc(it.n)}</b><br>من ${esc(ui.prof(g.from).name)}${g.note ? `<div style="margin-top:8px;font-size:22px">«${esc(g.note)}»</div>` : ""}</div>`);
    }
  };

  /* ---------- مهام اليوم ---------- */
  G.tasks = () => {
    if (!db.me) return [];
    const v = G.view(), s = v.s, d = v.today, fedToday = s.fed[d] || {};
    return [
      { e: "🌹", t: `اسقِ ورود الحب (الجولة ${G.slotName(v.slot)})`, done: v.myWater, go: "flowers" },
      { e: "💞", t: `${db.partner ? db.partner.name : "شريكك"} سقى/سقت كمان`, done: v.partnerWater, go: "flowers", soft: 1 },
      { e: "🧓", t: "أطعم الحجّي والحجّة", done: !!(fedToday.hajji && fedToday.hajjeh), go: "hajji" },
      { e: "🌾", t: "ازرع أو اقطف من المزرعة", done: mine(d, "plant") || mine(d, "harvest"), go: "farm" },
      ...(s.animals.length ? [{ e: "🐄", t: "اطعم الحيوانات واجمع الحليب والبيض", done: mine(d, "afeed") || mine(d, "acollect"), go: "pens" }] : []),
      { e: "🏪", t: "مرّ على سعدون واشترِ أو بيع", done: mine(d, "buy") || mine(d, "sell") || mine(d, "sellcrate"), go: "shop" },
    ];
  };
  G.perfectToday = () => G.tasks().every((t) => t.done);

  /* ---------- النوافذ ---------- */
  const coinBar = () => `<div class="coinbar">🪙 <b>${G.state().coins}</b></div>`;
  const meter = (l, v, c) => `<div class="mrow"><span>${l}</span><div class="mbar"><i style="width:${Math.round(v)}%;background:${c}"></i></div><b>${Math.round(v)}</b></div>`;
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${esc(name)}</b><small>${sub}</small></div><div class="ib">${btns}</div></div>`;

  G.openers = {
    shop() {
      const s = G.state(), tab = G.ui.tab, wk = Math.floor(G.today() / 7), till = Math.floor(s.till[wk] || 0), paid = s.tillPaid[wk];
      const lines = ["أهلين فيكم! اللي بدكم إياه عندي 😎", "اليوم الخضرة طازة والأسعار على قد الحال 🥬", "بدي أقبض راتبي آخر الأسبوع، اشتروا كتير! 😂", "للحجّي والحجّة عندي أحسن شاي بالقرية ☕", "جيبوا المحاصيل بصناديق وأنا بدفع أحسن سعر 📦"];
      const buy = (id, it, extra, qty) => irow(it.e, it.n, extra, qty.map((q) => `<button class="btn sm gold" data-act="g-buy" data-id="${id}" data-q="${q}" ${s.coins < cost(it.price, q, s.buys) ? "disabled" : ""}>×${q} · ${cost(it.price, q, s.buys)}🪙</button>`).join(""));
      const foodTab = (cat) => Object.entries(FOOD).filter(([, f]) => f.cat === cat).map(([k, f]) => buy(k, f, `🍞+${f.food} 💧+${f.drink} 😊+${f.joy} · عندك ${s.inv[k] || 0}`, [1, 5])).join("");
      let body = "";
      if (tab === "food" || tab === "drink" || tab === "sweet") body = foodTab(tab);
      else if (tab === "farm") body = Object.entries(SUPPLY).map(([k, f]) => buy(k, f, `${f.note} · عندك ${s.inv[k] || 0}`, k === "wcan" ? [1, 3, 7] : [1, 3])).join("");
      else if (tab === "gift") body = `<p class="hint">اشترِ هدية وسعدون بيوصّلها لـ${esc(ui.partnerName())} مع كلمة منك 💌</p><input class="in" id="giftNote" maxlength="120" placeholder="اكتب كلمة حلوة مع الهدية…" style="margin-bottom:8px">` + Object.entries(GIFTS).map(([k, g]) => irow(g.e, g.n, "", `<button class="btn sm berry" data-act="g-gift" data-id="${k}" ${s.coins < g.price ? "disabled" : ""}>أرسل · ${g.price}🪙</button>`)).join("");
      else body = `<p class="hint">أسعار اليوم بتتغير كل يوم ▲▼. المحاصيل اللي بمخزن المزرعة ببيعها هون:</p>` + (Object.keys(PRODUCE).filter((k) => s.inv[k] > 0).map((k) => { const c = PRODUCE[k]; return irow(c.e, `${c.n} ×${s.inv[k]}`, `سعر ${c.sell}🪙 للواحدة`, `<button class="btn sm gold" data-act="g-psell" data-id="${k}" data-q="1">بيع 1</button><button class="btn sm gold" data-act="g-psell" data-id="${k}" data-q="${s.inv[k]}">الكل</button>`); }).join("") + Object.keys(CROPS).filter((k) => s.inv[k] > 0).map((k) => { const c = CROPS[k]; return irow(c.e, `${c.n} ×${s.inv[k]}`, `سعر اليوم ${G.priceOf(k, G.today())}🪙 ${G.trend(k, G.today())}`, `<button class="btn sm gold" data-act="g-sell" data-id="${k}" data-q="1">بيع 1</button><button class="btn sm gold" data-act="g-sell" data-id="${k}" data-q="${s.inv[k]}">الكل</button>`); }).join("") || `<div class="empty">ما عندك محاصيل بالمخزن. اقطفوا من المزرعة وحطوا الصناديق بالمخزن 🌾</div>`);
      const carried = G.carryOf(db.uid);
      ui.openModal(`<h3>🏪 بقالة سعدون</h3>${coinBar()}
        <div class="npc-say"><span class="nav">🧑‍🍳</span><div class="res-say"><small>سعدون</small>${esc(lines[Math.floor(Date.now() / 60000) % lines.length])}</div></div>
        ${carried.length ? `<div class="chk" style="margin:6px 0">📦 معك ${carried.length} صندوق <button class="btn sm gold" data-act="g-sellcrate">سلّمهم لسعدون (سعر اليوم)</button></div>` : ""}
        <div class="salary"><small>راتب سعدون الأسبوعي: ${till}/${SALARY}🪙 ${paid ? "✅ انصرف (وأعطاكم 10🪙 مكافأة!)" : "— كل ما اشتريتوا بيقرب يقبض"}</small><div class="progress"><i style="width:${Math.min(100, till)}%"></i></div></div>
        <div class="seg" style="margin:10px 0">${[["food", "🍞 أكل"], ["drink", "🥤 مشروبات"], ["sweet", "🍰 حلويات"], ["farm", "🌱 مزرعة وورد"], ["gift", "🎁 هدايا"], ["sell", "🧺 بيع"]].map(([k, t]) => `<button class="${tab === k ? "on" : ""}" data-act="g-tab" data-k="${k}">${t}</button>`).join("")}</div>
        <div class="items">${body}</div>`);
    },
    farm() {
      const v = G.view(), s = v.s, carried = G.carryOf(db.uid);
      const cell = (p, i) => !p ? `<button class="plot empty" data-act="g-plot" data-i="${i}"><span>＋</span><small>ازرع</small></button>`
        : p.ripe ? `<button class="plot ripe" data-act="g-plot" data-i="${i}"><span>${CROPS[p.crop].e}</span><small>اقطف!</small></button>`
        : `<button class="plot grow" data-act="g-plot" data-i="${i}"><span>${p.progress < 0.4 ? "🌱" : "🌿"}</span><small>${CROPS[p.crop].e} ${left(p.left)}${p.fert ? " 🌿" : ""}</small></button>`;
      const seeds = Object.entries(CROPS).map(([k, c]) => `<button class="seed ${G.ui.last === k ? "on" : ""}" data-act="g-seed" data-k="${k}"><span>${c.e}</span><b>${c.n}</b><small>بذرة ${c.seed}🪙 · ${left(c.g)} · ~${c.sell}🪙</small></button>`).join("");
      const inv = Object.keys(CROPS).filter((k) => s.inv[k] > 0).map((k) => `<span class="tag">${CROPS[k].e} ×${s.inv[k]}</span>`).join(" ");
      ui.openModal(`<h3>🌾 المزرعة</h3>${coinBar()}<p class="hint">اضغط على أي أرض (هون أو بالقرية): الفاضية بتزرع، والجاهزة بتقطفها بإيدك 📦 (3 صناديق بالإيد كحد أقصى). حطّ الصناديق بالمخزن أو بالعربة.</p>
        <div class="chk" style="margin:6px 0">📦 معك ${carried.length}/3 صناديق ${carried.map((c) => CROPS[c.crop].e).join("")} · 🌿 سماد عندك ${s.inv.fert || 0}</div>
        <div class="plots">${v.plots.map(cell).join("")}</div>
        <div class="row" style="margin:8px 0"><button class="btn alt sm" data-act="g-stash" ${carried.length ? "" : "disabled"}>🏚️ حطّ الصناديق بالمخزن</button><button class="btn alt sm" data-act="g-fert-toggle">${G.ui.fert ? "✅ بستخدم سماد" : "🌿 استخدم سماد بالزرع"}</button></div>
        <b>اختار البذرة:</b><div class="seeds">${seeds}</div>
        <div class="sep"></div><b>مخزن المزرعة:</b> ${inv || '<span class="hint">فاضي</span>'}
        ${inv ? `<div class="row" style="margin-top:8px"><button class="btn alt sm" data-act="g-standsell">بيع الكل ببسطة المزرعة (-20%)</button><button class="btn alt sm" data-act="g-gotoshop">للدكان (سعر أحسن) 🏪</button></div>` : ""}`);
    },
    cart() {
      const v = G.view(), s = v.s, carried = G.carryOf(db.uid), crates = s.cart.crates, pw = v.pullWait;
      const cart = OSW.world.S.cartHome || { x: -18.5, z: -12.6 }, both = db.partner && OSW.world.partnerDist() < 14 && OSW.world.distTo(cart.x, cart.z) < 12;
      ui.openModal(`<h3>🛒 عربة المزرعة</h3>${coinBar()}
        <p class="hint">العربة بتشيل لحد ${CART_MAX} صندوق، وبتنباع بسعر أحسن بـ15% عند سعدون. بس بتحتاج <b>الاثنين</b> يسحبوها سوا (اضغطوا «اسحب» خلال 20 ثانية) 🤝</p>
        <div class="two"><div class="chk">📦<b>${crates.length}/${CART_MAX}</b> بالعربة</div><div class="chk">🧍<b>${carried.length}/3</b> معك</div></div>
        <div class="row" style="margin:10px 0;justify-content:center"><button class="btn gold" data-act="g-cartload" ${carried.length ? "" : "disabled"}>حمّل الصناديق على العربة</button></div>
        <div class="pick" style="font-size:18px">${pw.me && !pw.other ? `سحبت! بانتظار ${esc(ui.partnerName())}… ⏳ (${pw.left}ث)` : pw.other && !pw.me ? `${esc(ui.partnerName())} عم يسحب! اضغط «اسحب» هلأ 💪` : "ما حدا عم يسحب"}</div>
        <div class="row" style="margin-top:10px;justify-content:center"><button class="btn berry" data-act="g-cartpull" ${crates.length && both ? "" : "disabled"}>🤝 اسحب العربة</button></div>
        <p class="hint" style="text-align:center">${crates.length ? (both ? "جاهزين!" : "لازم الاثنين يكونوا عند العربة (قريبين منها).") : "العربة فاضية."}${s.cart.last ? `<br>آخر توصيل: ${s.cart.last.n} صناديق = ${s.cart.last.gain}🪙` : ""}</p>`);
    },
    flowers() {
      const v = G.view(), s = v.s, pn = ui.partnerName(), n = v.streak, stage = n === 0 ? (v.wilt ? "🥀" : "🌱") : n < 6 ? "🌷" : n < 14 ? "🌸" : n < 28 ? "🌹" : "💐";
      const nextM = Object.keys(MILES).map(Number).find((m) => m > n);
      ui.openModal(`<h3>🌹 ورود الحب</h3>
        <div class="bigflower">${stage}</div>
        <div class="big-days" style="font-size:54px">${v.days}</div><div style="text-align:center;font-weight:700">${n ? `يوم من السقي المتواصل (${n} جولة)` : v.wilt ? "الورد ذبل… ابدأوا من جديد 💔" : "ابدأوا أول جولة!"}</div>
        ${v.thirsty ? `<div class="chk" style="margin:8px 0;justify-content:center">⚠️ الورد عطشان! فاتتكم جولة، اسقوه هلأ قبل ما يذبل</div>` : ""}
        ${nextM ? `<p class="hint" style="text-align:center">الهدية القادمة عند ${nextM} جولة: ${MILES[nextM]}🪙</p>` : ""}
        <div class="chk" style="margin:8px 0;justify-content:center">🕔 روتين الورد: جولتين كل يوم (5 الصبح و5 المسا). الجولة الحالية: <b>${G.slotName(v.slot)}</b></div>
        <div class="two"><div class="chk ${v.myWater ? "ok" : ""}">${v.myWater ? "✅" : "⬜"}<b>أنا</b></div><div class="chk ${v.partnerWater ? "ok" : ""}">${v.partnerWater ? "✅" : "⬜"}<b>${esc(pn)}</b></div></div>
        <div class="row" style="justify-content:center;margin-top:8px"><button class="btn berry" data-act="g-water" ${v.myWater ? "disabled" : ""}>💦 ${v.myWater ? "سقيتو بهالجولة" : "اسقِ الورد"} <small>(عندك ${s.inv.wcan || 0})</small></button><button class="btn alt" data-act="g-gotoshop-flower">اشتري ماء 🏪</button></div>
        ${v.completeNow ? `<div class="pick" style="margin-top:12px">💞 الاثنين سقوا الورد بهالجولة! الورد بيشع 🌟</div>` : ""}`);
    },
    hajji() {
      const v = G.view(), s = v.s, blessed = !!s.blessed[v.today];
      const stories = ["أيام زمان يا ابني، كنا نقعد عالدرج بعد العشا ونحكي… والقلوب كانت أوسع من البيوت.", "الورد يا ولدي بدو سقي كل يوم، والحب مثلو بالضبط.", "سمعت حكاية عن اثنين… كل يوم يقولوا لبعض «كيف أصبحت؟» وعاشوا ستين سنة 🌹", "أحلى كنز بالدنيا لمّة بيت صغير فيه ضحكة.", "الله يبارك لكم بالعمر والصحة والذرية الطيبة 🤲"];
      const who = (w, nm, e) => { const m = v.m[w], low = Math.min(m.food, m.drink), r = FOOD[m.req];
        const state = m.up ? `زعلان 😠 ما بيقبل إلا: ${r.e} ${r.n}` : low < 25 ? "جوعان/عطشان 😢" : low < 55 ? "ينتظر منكم شي 😐" : "مبسوط الحمدلله 😊";
        const items = Object.entries(FOOD).filter(([k]) => (s.inv[k] || 0) > 0 && (!m.up || k === m.req));
        return `<div class="hcard ${m.up ? "mad" : ""}"><div class="hav">${e}</div><b>${nm}</b><small>${state}</small>${meter("🍞 أكل", m.food, "#f4a261")}${meter("💧 شرب", m.drink, "#4aa3e0")}${meter("😊 فرحة", m.joy, "#e63e6d")}
        <div class="feedrow">${items.map(([k, f]) => `<button class="btn sm gold" data-act="g-feed" data-w="${w}" data-i="${k}">${f.e} ×${s.inv[k]}</button>`).join("") || `<small class="hint">${m.up ? `ما عندك ${r.e} ${r.n}. روح لسعدون 🏪` : "ما عندك أكل. روح لسعدون 🏪"}</small>`}</div></div>`; };
      ui.openModal(`<h3>🧓 الحجّي والحجّة</h3>${coinBar()}
        <p class="hint">كل يوم لازم تطعموهم وتسقوهم. لو الاثنين فوق 55% بتاخدوا «بركة اليوم» 🤲 + 8🪙. <b>إذا أهملتوهم زيادة بيزعلوا</b> وما بيقبلوا إلا الأكلة اللي بيطلبوها (وبتصالحوهم فيها).</p>
        <div class="${blessed ? "pick" : "chk"}" style="margin:8px 0;text-align:center">${blessed ? "🤲 بركة اليوم: «الله يسعدكم ويحفظ لبعض ويجمعكم على الخير»" : "بركة اليوم: لسا ⏳"}</div>
        <div class="two">${who("hajji", "الحجّي أبو محمود", "👳")}${who("hajjeh", "الحجّة أم محمود", "👵")}</div>
        <div class="row" style="margin-top:10px"><button class="btn alt" data-act="g-chat">📜 احكيلنا حكاية يا حجّي</button><button class="btn alt" data-act="g-gotoshop">للدكان 🏪</button></div>
        <div id="hStory" class="pick" style="display:none;margin-top:10px;font-size:19px"></div>`);
      G._stories = stories;
    },
    pens() {
      const s = G.state(), av = G.animalsView(), carry = G.animalCarry(db.uid), fedAll = av.length && av.every((a) => a.fed), minLeft = av.length ? Math.min(...av.map((a) => a.fedLeft)) : 0, eg = av.filter((a) => a.kind === "chicken").reduce((n, a) => n + a.units, 0), mk = av.filter((a) => a.kind === "cow").reduce((n, a) => n + a.units, 0);
      const days = (ms) => (ms >= 86400000 ? Math.floor(ms / 86400000) + " يوم " + Math.floor((ms % 86400000) / 3600000) + " س" : Math.max(1, Math.ceil(ms / 60000 / 60 * 10) / 10) + " س");
      const cards = Object.entries(AN).map(([k, A]) => { const n = av.filter((a) => a.kind === k).length; return `<div class="seed"><span>${A.e}</span><b>${A.n}</b><small>${A.price}🪙 · ${n}/${A.cap}</small><button class="btn sm gold" data-act="g-abuy" data-k="${k}" ${s.coins < A.price || n >= A.cap ? "disabled" : ""}>اشتري صغير</button><small>${A.note}</small></div>`; }).join("");
      const rows = av.map((a, i) => irow(a.A.e, `${a.A.n} #${i + 1}${a.mature ? " ✅ كبير" : ""}`, `<div class="progress" style="height:8px;margin:4px 0"><i style="width:${Math.round(a.prog * 100)}%"></i></div>${a.mature ? (a.units ? `جاهز: ${a.units} ${a.A.prod === "egg" ? "🥚" : "🥛"}` : a.A.prod ? "بينتج…" : `جاهز للملحمة (${a.A.sell}🪙)`) : "بيكبر… باقي " + days(a.left)}${a.fed ? "" : " · 😢 جوعان"}`, a.mature ? `<button class="btn sm berry" data-act="g-acarry" data-id="${a.id}" ${carry.length >= 2 ? "disabled" : ""}>🧍 شيله</button>` : "")).join("");
      ui.openModal(`<h3>🐾 حيوانات المزرعة</h3>${coinBar()}
        <p class="hint">اطعموا الحيوانات كل يوم عشان تكبر وتنتج 🌾. الدجاج بيعطي بيض، البقر حليب، والخرفان لما يكبروا (3 أيام) بتشيلوهم وبتبيعوهم للملحمة 🥩.</p>
        <div class="chk" style="margin:6px 0;justify-content:center">${!av.length ? "ما عندكم حيوانات لسا — اشتروا من تحت 👇" : fedAll ? `😊 شبعانين لمدة ${days(minLeft)}` : "😢 في حيوانات جوعانة! اطعموهم"}</div>
        <div class="row" style="margin:6px 0"><button class="btn gold sm" data-act="g-afeed" ${s.inv.hay && av.length ? "" : "disabled"}>🌾 اطعم الكل (عندك ${s.inv.hay || 0})</button><button class="btn alt sm" data-act="g-gotoshop-hay">اشتري علف 🏪</button><button class="btn berry sm" data-act="g-acollect" ${eg + mk ? "" : "disabled"}>🧺 اجمع (${eg}🥚 ${mk}🥛)</button></div>
        ${carry.length ? `<div class="pick" style="margin:8px 0;font-size:18px">معك: ${carry.map((c) => AN[c.kind].e).join(" ")} <button class="btn sm gold" data-act="g-gotobutcher">للملحمة 🥩</button> <button class="btn sm alt" data-act="g-adrop">رجّعهم</button></div>` : ""}
        ${(s.inv.egg || s.inv.milk) ? `<div class="chk" style="margin:6px 0">مخزن المنتجات: ${s.inv.egg || 0}🥚 ${s.inv.milk || 0}🥛 <button class="btn sm alt" data-act="g-pstand">بيع ببسطة المزرعة (-20%)</button></div>` : ""}
        <b>الحيوانات (${av.length})</b><div class="items" style="margin:8px 0">${rows || '<div class="empty">الحظيرة فاضية</div>'}</div>
        <b>اشتري حيوانات صغيرة</b><div class="seeds">${cards}</div>`);
    },
    fishing() {
      const f = G.ui.fish || (G.ui.fish = { st: "idle" }), s = G.state(), tot = ["fish_s", "fish_m", "fish_g", "boot"].map((k) => PRODUCE[k].e + "×" + (s.inv[k] || 0)).join("  ");
      const body = f.st === "idle" ? `<button class="btn gold" style="font-size:20px;padding:14px 30px" data-act="g-cast">🎣 ارمي الصنارة</button>${f.msg ? `<p class="hint" style="font-size:18px;margin-top:10px">${f.msg}</p>` : ""}` : f.st === "wait" ? `<div style="font-size:54px;animation:pop 1s infinite alternate">🎣</div><p class="hint">استنى لحد ما تهتز العوامة… 🌊</p>` : `<button class="btn berry" style="font-size:26px;padding:18px 34px;animation:pop .3s infinite alternate" data-act="g-reel">🐟 اسحب!!</button>`;
      ui.openModal(`<h3>🎣 صيد السمك</h3>${coinBar()}<p class="hint">ارمي الصنارة وأول ما تطلع 🐟 اسحب بسرعة! الصيد بتبيعه عند سعدون أو ببسطة المزرعة.</p><div style="text-align:center;margin:14px 0;min-height:110px">${body}</div><div class="chk" style="justify-content:center">${tot}</div>`);
    },
    butcher() {
      const s = G.state(), carry = G.animalCarry(db.uid), av = G.animalsView(), ready = av.filter((a) => a.mature && (a.kind === "sheep"));
      const lines = ["أهلين! عندك خروف كبير؟ بدفع أحسن سعر بالقرية 🐑", "اللحمة الطازة سر الأكلة الحلوة! 🥩", "الخروف لازم يكبر ثلاث أيام، ما بشتري صغار 😄", "جيبوا الخرفان وأنا بدفع كاش 💰", "المنسف بدو لحمة بلدي! 🍲"];
      const total = carry.reduce((n, c) => n + AN[c.kind].sell, 0);
      ui.openModal(`<h3>🥩 ملحمة أبو سليمان</h3>${coinBar()}
        <div class="npc-say"><span class="nav">🧔</span><div class="res-say"><small>أبو سليمان</small>${esc(lines[Math.floor(Date.now() / 60000) % lines.length])}</div></div>
        <div class="items" style="margin:10px 0">${Object.entries(AN).map(([k, A]) => irow(A.e, A.n, `بيشتريه لما يكبر · ${A.sell}🪙`, "")).join("")}</div>
        ${carry.length ? `<div class="pick" style="font-size:20px">معك: ${carry.map((c) => AN[c.kind].e).join(" ")}<br><button class="btn gold" data-act="g-asell">بيع الكل · ${total}🪙</button></div>` : `<div class="chk" style="justify-content:center">ما معك حيوانات. ${ready.length ? `عندكم ${ready.length} خروف كبير جاهز! 🐑` : "كبّروا الخرفان بالحظيرة أول 🐾"}</div>`}
        <div class="row" style="margin-top:10px;justify-content:center"><button class="btn alt" data-act="g-gotopens">للحظيرة 🐾</button></div>
        <p class="hint" style="text-align:center">🥩 بعتوا ${s.asold} حيوان · ${s.sheepSold} خروف</p>`);
    },
    orders() {
      const s = G.state(), day = G.today(), os = G.ordersOf(day);
      ui.openModal(`<h3>📋 طلبات أهل القرية</h3>${coinBar()}<p class="hint">كل يوم 3 طلبات جديدة من مخزن المزرعة، والسعر أعلى من السوق بـ50% 💰</p>` + os.map((o) => { const n = OSW.NPC_BY[o.npc], done = s.orders[day + ":" + o.idx], have = s.inv[o.crop] || 0, c = CROPS[o.crop];
        return `<div class="irow ${done ? "done" : ""}"><span class="ie">${n.emoji}</span><div class="iname"><b>${esc(n.name)}</b><small>بدو ${o.qty}× ${c.e} ${c.n} · عندك ${have}</small></div><div class="ib">${done ? '<span class="badge-ok">تم ✅</span>' : `<button class="btn sm gold" data-act="g-order" data-i="${o.idx}" ${have < o.qty ? "disabled" : ""}>سلّم · ${o.reward}🪙</button>`}</div></div>`; }).join(""));
    },
    tasks() {
      const ts = G.tasks(), done = ts.filter((t) => t.done).length;
      ui.openModal(`<h3>✅ مهام اليوم</h3><div class="progress" style="margin-bottom:10px"><i style="width:${(done / ts.length) * 100}%"></i></div><p class="hint">${done === ts.length ? "يوم مثالي! 🎉 ما قصّرتوا بشي" : `${done} من ${ts.length} — كملوا عشان يكون يومكم مثالي`}</p>` + ts.map((t) => `<button class="irow taskrow ${t.done ? "done" : ""}" data-act="g-go" data-k="${t.go}"><span class="ie">${t.done ? "✅" : t.e}</span><div class="iname"><b>${esc(t.t)}</b></div></button>`).join("") +
        `<div class="sep"></div><div class="row"><button class="btn alt" data-act="g-orders">📋 طلبات الأهل</button><button class="btn alt" data-act="g-inv">🎒 مخزني</button><button class="btn alt" data-act="g-wardrobe">👗 الخزانة</button></div>`);
    },
    inv() {
      const s = G.state(), items = Object.keys(s.inv).filter((k) => s.inv[k] > 0 && ITEM[k] && !ITEM[k].cloth), got = s.gifts.filter((g) => g.from !== db.uid);
      ui.openModal(`<h3>🎒 مخزنكم</h3>${coinBar()}<div class="chips" style="gap:8px">${items.map((k) => `<span class="tag" style="font-size:15px">${ITEM[k].e} ${esc(ITEM[k].n)} ×${s.inv[k]}</span>`).join("") || '<span class="hint">فاضي</span>'}</div>
        <div class="sep"></div><b>هدايا وصلتني 💝</b>${got.map((g) => `<div class="ans">${GIFTS[g.id].e} ${esc(GIFTS[g.id].n)} من ${esc(ui.prof(g.from).name)}${g.note ? ` — «${esc(g.note)}»` : ""}</div>`).join("") || '<div class="hint">لسا ما وصلتك هدايا</div>'}`);
    },
    furniture() {
      const s = G.state(), tab = G.ui.ftab || "living", list = Object.values(OSW.FURN).filter((f) => f.cat === tab);
      const placedCount = G.furnList().length;
      ui.openModal(`<h3>🛋️ موسوعة الأثاث</h3>${coinBar()}<p class="hint">اشتروا قطع وركّبوها بغرف البيت. القطع اللي معكم بتضغطوا «ضع» وبعدين بتضغطوا عالأرض بالغرفة. (بالبيت ${placedCount} قطعة)</p>
        <div class="seg" style="margin:8px 0">${OSW.FURN_CATS.map(([k, t]) => `<button class="${tab === k ? "on" : ""}" data-act="g-ftab" data-k="${k}">${t}</button>`).join("")}</div>
        <div class="items">${list.map((f) => { const own = s.inv["fu_" + f.id] || 0; return irow(f.e, f.n, `${f.w}×${f.d} م · عندك ${own}`, `<button class="btn sm gold" data-act="g-buy" data-id="fu_${f.id}" data-q="1" ${s.coins < cost(f.price, 1, s.buys) ? "disabled" : ""}>${cost(f.price, 1, s.buys)}🪙</button>${own ? `<button class="btn sm berry" data-act="g-place" data-item="${f.id}">ضع (${own})</button>` : ""}`); }).join("")}</div>`);
    },
    furnitem() {
      const f = G.state().furn[G.ui.finst]; if (!f) return ui.closeModal(); const F = OSW.FURN[f.item];
      ui.openModal(`<h3>${F.e} ${esc(F.n)}</h3><p class="hint">اللي بدك تعمله فيها؟</p>
        <div class="row" style="gap:8px;margin:10px 0"><button class="btn gold" data-act="g-frot">🔄 دوّرها</button><button class="btn alt" data-act="g-fmove">✋ انقلها</button><button class="btn alt" data-act="g-fpick">📦 للمخزن</button><button class="btn alt" data-act="g-fsell">🪙 بيع (${Math.floor(F.price * 0.7)})</button></div>
        ${F.sleep ? `<div class="row" style="justify-content:center"><button class="btn berry" data-act="g-sleep">😴 نام للصبح</button></div>` : ""}`);
    },
    boutique() {
      const s = G.state(), lk = OSW.app.lookOf(db.uid), gender = lk.gender, tab = G.ui.wtab;
      const cat = G.ui.wcat || "all", list = Object.entries(CLOTH).filter(([, c]) => (tab === "outfit" ? c.kind === "outfit" && (cat === "all" || c.cat === cat) : c.kind === "acc") && (!c.gender || c.gender === gender));
      const chips = tab === "outfit" ? `<div class="seg" style="margin:0 0 8px">${OSW.CLOTH_CATS.map(([k, t]) => `<button class="${cat === k ? "on" : ""}" data-act="g-wcat" data-k="${k}">${t}</button>`).join("")}</div>` : "";
      ui.openModal(`<h3>👗 محل الأناقة</h3>${coinBar()}<p class="hint">اللبس بيغيّر شكلك، وبعضه بيأثر على سرعتك! الأغراض بتجيك بأكياس، وبتلبسها من الخزانة 🛍️</p>
        <div class="seg" style="margin:8px 0">${[["outfit", "👕 أطقم"], ["acc", "🧢 إكسسوارات"]].map(([k, t]) => `<button class="${tab === k ? "on" : ""}" data-act="g-wtab" data-k="${k}">${t}</button>`).join("")}</div>
        ${chips}<div class="items">${list.map(([k, c]) => { const own = (s.inv["cl_" + k] || 0) >= 1; return irow(c.e, c.n, esc(c.note || ""), own ? `<span class="badge-ok">عندك ✅</span>` : `<button class="btn sm berry" data-act="g-buy" data-id="cl_${k}" data-q="1" ${s.coins < c.price ? "disabled" : ""}>${c.price}🪙</button>`); }).join("")}</div>
        <div class="row" style="margin-top:12px"><button class="btn alt" data-act="g-wardrobe">👗 افتح الخزانة</button></div>`);
    },
    wardrobe() {
      const s = G.state(), lk = OSW.app.lookOf(db.uid), cur = lk.outfit || "casual", acc = lk.acc || [];
      const owned = (k) => k === "casual" || (s.inv["cl_" + k] || 0) >= 1;
      const outfits = Object.entries(OSW.CLOTHES).filter(([k, c]) => c.kind === "outfit" && owned(k) && (!c.gender || c.gender === lk.gender));
      const accs = Object.entries(OSW.CLOTHES).filter(([k, c]) => c.kind === "acc" && owned(k));
      ui.openModal(`<h3>🚪 خزانة الملابس</h3><p class="hint">ألبس اللي بدك. السرعة الحالية: <b>${Math.round(G.speedMul() * 100)}%</b></p>
        <b>الأطقم</b><div class="items" style="margin:8px 0">${outfits.map(([k, c]) => irow(c.e, c.n, esc(c.note || ""), cur === k ? `<span class="badge-ok">لابسه ✅</span>` : `<button class="btn sm gold" data-act="g-wear" data-k="${k}">البس</button>`)).join("")}</div>
        <b>الإكسسوارات</b><div class="items" style="margin-top:8px">${accs.map(([k, c]) => irow(c.e, c.n, "", acc.includes(k) ? `<button class="btn sm alt" data-act="g-wearacc" data-k="${k}">انزع</button>` : `<button class="btn sm gold" data-act="g-wearacc" data-k="${k}">البس</button>`)).join("") || '<div class="hint">ما عندك إكسسوارات. اشتروا من محل الأناقة 👗</div>'}</div>`);
      ui.saveMy({ bagsSeen: Date.now() }); setTimeout(() => G.sync3d(), 50);
    },
  };

  /* ---------- نقرات ---------- */
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  G.click = (a, el) => {
    const P = OSW.places, st = G.ui, v = () => G.view(), busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } };
    switch (a) {
      case "g-ftab": st.ftab = el.dataset.k; return P.refresh();
      case "g-place": ui.closeModal(); return OSW.app.startPlacing(el.dataset.item, null);
      case "g-frot": return OSW.app.rotateFurn();
      case "g-fmove": { const f = G.state().furn[st.finst]; ui.closeModal(); return f && OSW.app.startPlacing(f.item, f.id, f.rot); }
      case "g-fpick": return busy(async () => { await G.do("furn_pick", { inst: st.finst }); ui.closeModal(); OSW.world.selectFurn(null); toast("📦 رجعت للمخزن"); });
      case "g-fsell": return busy(async () => { await G.do("furn_sell", { inst: st.finst }); ui.closeModal(); OSW.world.selectFurn(null); OSW.audio.sfx("coin"); toast("🪙 انباعت"); });
      case "g-sleep": ui.closeModal(); return OSW.app.sleep();
      case "g-wcat": G.ui.wcat = el.dataset.k; return P.refresh();
      case "g-tab": st.tab = el.dataset.k; return P.refresh();
      case "g-wtab": st.wtab = el.dataset.k; return P.refresh();
      case "g-buy": { const it = ITEM[el.dataset.id], q = +el.dataset.q, c = cost(it.price, q, G.state().buys); if (needCoins(c)) return; return busy(async () => { await G.do("buy", { id: el.dataset.id, qty: q }); OSW.audio.sfx("coin"); toast(`${it.e} اشتريت ${it.cloth ? "(الكيس بإيدك 🛍️)" : "×" + q}`); }); }
      case "g-sell": return busy(async () => { await G.do("sell", { id: el.dataset.id, qty: +el.dataset.q }); OSW.audio.sfx("coin"); toast("🪙 انباعت!"); });
      case "g-sellcrate": return busy(async () => { await G.do("sellcrate", {}); OSW.audio.sfx("coin"); ui.hearts("🪙", 8); });
      case "g-gift": { const g = GIFTS[el.dataset.id]; if (needCoins(g.price)) return; if (!db.partner) return toast("لسا شريكك ما دخل القرية"); const note = ((document.getElementById("giftNote") || {}).value || "").trim(); return busy(async () => { await G.do("gift", { id: el.dataset.id, note }); OSW.audio.sfx("heart"); ui.hearts(g.e, 14); toast(`${g.e} سعدون راح يوصّل الهدية 💌`, "love"); }); }
      case "g-plot": ui.closeModal(); return OSW.app.plotAct(+el.dataset.i, true);
      case "g-seed": st.last = el.dataset.k; return P.refresh();
      case "g-fert-toggle": st.fert = !st.fert; return P.refresh();
      case "g-stash": return busy(async () => { await G.do("stash", {}); OSW.audio.sfx("pop"); toast("🏚️ انحطّوا بالمخزن"); });
      case "g-standsell": return busy(async () => { const s = G.state(); for (const k of Object.keys(CROPS)) if (s.inv[k] > 0) await db.addEntry({ house: "game", title: "sell", data: { id: k, qty: s.inv[k], stand: 1 } }); G.sync3d(); P.refresh(); OSW.audio.sfx("coin"); });
      case "g-gotoshop": case "g-gotoshop-flower": st.tab = a === "g-gotoshop" ? "food" : "farm"; ui.closeModal(); return OSW.app.goPlace("shop");
      case "g-cartload": return busy(async () => { await G.do("cart_load", {}); OSW.audio.sfx("pop"); });
      case "g-cartpull": return busy(async () => { await G.do("cart_pull", {}); OSW.audio.sfx("pop"); const w = G.view().pullWait; if (!w.other) toast("سحبت! خلّي شريكك يسحب خلال 20 ثانية 🤝", "love"); else { OSW.audio.sfx("fanfare"); ui.hearts("🛒", 12); } });
      case "g-cast": { const f = G.ui.fish; f.st = "wait"; f.msg = ""; OSW.audio.sfx("pop"); P.refresh(); const my = (f.token = Math.random()); setTimeout(() => { if (G.ui.fish.token !== my || !document.querySelector("[data-act=g-cast],.hint")) return; f.st = "bite"; OSW.audio.sfx("ding"); P.refresh(); setTimeout(() => { if (G.ui.fish.token === my && f.st === "bite") { f.st = "idle"; f.msg = "😅 فلتت السمكة!"; P.refresh(); } }, 1200); }, 1500 + Math.random() * 3000); return; }
      case "g-reel": { const f = G.ui.fish; f.token = 0; f.st = "idle"; const r = Math.random(), id = r < 0.5 ? "fish_s" : r < 0.8 ? "fish_m" : r < 0.9 ? "fish_g" : "boot"; f.msg = `${PRODUCE[id].e} طلعت ${PRODUCE[id].n}!`; OSW.audio.sfx(id === "fish_g" ? "fanfare" : "coin"); return busy(async () => { await db.addEntry({ house: "game", title: "fish", data: { id } }); G.sync3d(); P.refresh(); }); }
      case "g-abuy": { const A = AN[el.dataset.k]; if (needCoins(A.price)) return; return busy(async () => { await G.do("abuy", { kind: el.dataset.k }); OSW.audio.sfx("coin"); ui.hearts(A.e, 8); toast(`${A.e} اشتريتوا ${A.n} صغير!`); }); }
      case "g-afeed": return busy(async () => { await G.do("afeed", {}); OSW.audio.sfx("pop"); ui.hearts("🌾", 8); toast("🌾 الحيوانات شبعت"); });
      case "g-acollect": return busy(async () => { await G.do("acollect", {}); OSW.audio.sfx("coin"); toast("🧺 جمعتوا البيض والحليب"); });
      case "g-acarry": return busy(async () => { await G.do("acarry", { id: el.dataset.id }); OSW.audio.sfx("pop"); toast("🧍 شلت الحيوان! روح للملحمة 🥩"); });
      case "g-adrop": return busy(async () => { await G.do("adrop", {}); OSW.audio.sfx("pop"); });
      case "g-asell": return busy(async () => { const t = G.animalCarry(db.uid).reduce((n, c) => n + AN[c.kind].sell, 0); await G.do("asell", {}); OSW.audio.sfx("fanfare"); ui.hearts("🪙", 14); toast(`🥩 أبو سليمان دفعلك ${t}🪙`, "gold"); const ab = OSW.world.npcPos && OSW.world; OSW.world.say("abusulaiman", "تسلم إيدك! صفقة رابحة 🤝", 4000); });
      case "g-psell": return busy(async () => { await G.do("psell", { id: el.dataset.id, qty: +el.dataset.q }); OSW.audio.sfx("coin"); toast("🪙 انباعت!"); });
      case "g-pstand": return busy(async () => { const s = G.state(); for (const k of Object.keys(PRODUCE)) if (s.inv[k] > 0) await db.addEntry({ house: "game", title: "psell", data: { id: k, qty: s.inv[k], stand: 1 } }); G.sync3d(); P.refresh(); OSW.audio.sfx("coin"); });
      case "g-gotobutcher": ui.closeModal(); return OSW.app.goPlace("butcher");
      case "g-gotopens": ui.closeModal(); return OSW.app.goPlace("pens");
      case "g-gotoshop-hay": st.tab = "farm"; ui.closeModal(); return OSW.app.goPlace("shop");
      case "g-water": { if ((G.state().inv.wcan || 0) < 1) { toast("ما عندك ماء سقاية 💦 اشتري من سعدون"); return; } return busy(async () => { await G.do("water", {}); OSW.audio.sfx("magic"); ui.hearts("💦", 10); toast("سقيت الورد 🌹", "love"); if (G.view().completeNow) { ui.hearts("💞", 16); OSW.audio.sfx("fanfare"); } }); }
      case "g-feed": { const w = el.dataset.w, m = v().m[w]; if (m.up && el.dataset.i !== m.req) return toast("الحجّ زعلان وما بيقبل غير " + FOOD[m.req].e); return busy(async () => { const wasUp = m.up; await G.do("feed", { who: w, item: el.dataset.i }); OSW.audio.sfx("heart"); OSW.world.say(w, wasUp ? "الله يسامحكم… تسلم إيدك! 🤲" : rnd(["الله يسعدك! 🤲", "تسلم إيدك يا ولدي!", "بالهنا والشفا! 😊", "الله يخليكم لبعض 💞"]), 4000); if (G.state().blessed[G.today()]) ui.hearts("🤲", 12); }); }
      case "g-chat": { const s = rnd(G._stories || ["الله يحفظكم"]); const o = document.getElementById("hStory"); if (o) { o.style.display = ""; o.textContent = s; } return busy(async () => { await db.addEntry({ house: "game", title: "story", data: {} }); G.sync3d(); }); }
      case "g-order": return busy(async () => { await G.do("order", { day: G.today(), idx: +el.dataset.i }); OSW.audio.sfx("fanfare"); ui.hearts("🪙", 12); });
      case "g-go": ui.closeModal(); return OSW.app.goPlace(el.dataset.k);
      case "g-orders": return P.open("orders"); case "g-inv": return P.open("inv"); case "g-wardrobe": return P.open("wardrobe");
      case "g-wear": return busy(async () => { await db.kvSet("look:" + db.uid, Object.assign({}, db.kv["look:" + db.uid], { outfit: el.dataset.k })); OSW.app.refreshAvatars(); G.sync3d(); OSW.audio.sfx("magic"); ui.hearts("✨", 8); P.refresh(); });
      case "g-wearacc": return busy(async () => { const cur = Object.assign({}, db.kv["look:" + db.uid]), acc = (cur.acc || []).slice(), k = el.dataset.k, sl = OSW.CLOTHES[k].slot, i = acc.indexOf(k); if (i > -1) acc.splice(i, 1); else { for (let j = acc.length - 1; j >= 0; j--) if (OSW.CLOTHES[acc[j]].slot === sl) acc.splice(j, 1); acc.push(k); } cur.acc = acc; await db.kvSet("look:" + db.uid, cur); OSW.app.refreshAvatars(); OSW.audio.sfx("pop"); P.refresh(); });
    }
  };
})();
