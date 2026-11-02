/* اقتصاد القرية: المزرعة، الدكان، ورود الحب، الحجّي والحجّة، طلبات الأهل
   كل شي محفوظ كـ"أحداث" (entries) وبنحسب الحالة منها، فما في تعارض بين تلفونين. */
(function () {
  const OSW = window.OSW, { esc, nl2br } = OSW;
  const G = (OSW.game = { ui: { tab: "food", seed: null, last: "tomato", sel: null }, _s: null, _k: "" });
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
  const FOOD = (G.FOOD = {
    bread: { n: "خبز طازة", e: "🥖", price: 3, food: 22, drink: 0, joy: 2 }, tea: { n: "شاي بالنعنع", e: "🫖", price: 4, food: 0, drink: 24, joy: 4 },
    coffee: { n: "قهوة عربية", e: "☕", price: 5, food: 0, drink: 18, joy: 6 }, dates: { n: "تمر", e: "🌴", price: 4, food: 14, drink: 0, joy: 3 },
    laban: { n: "لبن", e: "🥛", price: 3, food: 8, drink: 14, joy: 2 }, water: { n: "ماء بارد", e: "💧", price: 2, food: 0, drink: 20, joy: 0 },
    cheese: { n: "جبنة بلدية", e: "🧀", price: 6, food: 25, drink: 0, joy: 3 }, kanafeh: { n: "كنافة", e: "🍯", price: 12, food: 18, drink: 0, joy: 18 },
    mansaf: { n: "منسف", e: "🍲", price: 25, food: 55, drink: 5, joy: 22 },
  });
  const GIFTS = (G.GIFTS = {
    rose: { n: "وردة حمرا", e: "🌹", price: 12 }, choc: { n: "شوكولاتة", e: "🍫", price: 15 }, book: { n: "كتاب", e: "📖", price: 20 },
    teddy: { n: "دبدوب", e: "🧸", price: 40 }, perfume: { n: "عطر", e: "🧴", price: 45 }, ring: { n: "خاتم", e: "💍", price: 120 },
  });
  const SUPPLY = (G.SUPPLY = { wcan: { n: "ماء سقاية الورد", e: "💦", price: 3 } });
  const ITEM = (G.ITEM = Object.assign({}, FOOD, SUPPLY, GIFTS, Object.fromEntries(Object.entries(CROPS).map(([k, v]) => [k, { n: v.n, e: v.e, price: v.seed, crop: 1 }]))));
  const PLOTS = 12, SALARY = 100;
  const DECAY = { food: 100 / (22 * 3600000), drink: 100 / (16 * 3600000), joy: 100 / (40 * 3600000) };
  const MILES = { 3: 10, 7: 25, 14: 60, 30: 150, 60: 300, 100: 500 };

  /* ---------- أدوات ---------- */
  const dayKey = (t) => Math.floor((t + 3 * 3600000) / 86400000);
  G.today = () => dayKey(Date.now());
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); };
  const rnd01 = (s) => (hash(s) % 10000) / 10000;
  G.priceOf = (crop, day) => Math.max(1, Math.round(CROPS[crop].sell * (0.85 + 0.35 * rnd01(crop + ":" + day))));
  G.trend = (crop, day) => { const a = G.priceOf(crop, day), b = G.priceOf(crop, day - 1); return a > b ? "▲" : a < b ? "▼" : "•"; };
  const WANDERERS = ["abukhaled", "umahmad", "samer", "khalasuad", "abuali", "fadi"];
  const ORDER_CROPS = ["wheat", "cucumber", "tomato", "carrot", "strawberry", "corn", "lemon"];
  G.ordersOf = (day) => [0, 1, 2].map((i) => {
    const npc = WANDERERS[hash("n" + day + i) % WANDERERS.length], crop = ORDER_CROPS[hash("c" + day + i) % ORDER_CROPS.length], qty = 2 + (hash("q" + day + i) % 3);
    return { idx: i, day, npc, crop, qty, reward: Math.round(CROPS[crop].sell * qty * 1.5) + 3 };
  });
  const PRICE_DISC = (buys) => (buys >= 30 ? 0.9 : 1);
  const cost = (price, qty, buys) => Math.ceil(price * qty * PRICE_DISC(buys));

  /* ---------- حساب الحالة من الأحداث ---------- */
  function fold(events) {
    const S = { coins: 50, inv: {}, plots: Array(PLOTS).fill(null), m: { hajji: { food: 70, drink: 70, joy: 60 }, hajjeh: { food: 70, drink: 70, joy: 60 } }, mt: 0,
      days: {}, comp: {}, streak: 0, lastComp: -9, paidMile: {}, orders: {}, till: {}, tillPaid: {}, buys: 0, harvests: 0, plants: 0, sells: 0, feeds: 0, blessed: {}, gifts: [], tog: {}, acts: {}, fed: {}, log: 0 };
    const ev = events.slice().sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id < b.id ? -1 : 1));
    if (ev.length) S.mt = new Date(ev[0].created_at).getTime(); else S.mt = Date.now();
    const decay = (t) => { const dt = Math.max(0, t - S.mt); ["hajji", "hajjeh"].forEach((w) => { const m = S.m[w]; m.food = Math.max(0, m.food - dt * DECAY.food); m.drink = Math.max(0, m.drink - dt * DECAY.drink); m.joy = Math.max(0, m.joy - dt * DECAY.joy); }); S.mt = t; };
    const add = (id, n) => (S.inv[id] = (S.inv[id] || 0) + n);
    ev.forEach((e) => {
      const t = new Date(e.created_at).getTime(), d = e.data || {}, day = dayKey(t), a = e.author, ty = e.title;
      const mark = () => { (S.acts[day] = S.acts[day] || {})[a + ":" + ty] = 1; };
      if (ty === "buy") {
        const it = ITEM[d.id]; if (!it || it.crop || !(d.qty >= 1 && d.qty <= 99)) return;
        const c = cost(it.price, d.qty, S.buys); if (S.coins < c) return;
        S.coins -= c; add(d.id, d.qty); S.buys += d.qty; mark();
        const wk = Math.floor(day / 7); S.till[wk] = (S.till[wk] || 0) + c * 0.3;
        if (S.till[wk] >= SALARY && !S.tillPaid[wk]) { S.tillPaid[wk] = 1; S.coins += 10; }
      } else if (ty === "plant") {
        const c = CROPS[d.crop], p = d.plot; if (!c || !(p >= 0 && p < PLOTS) || S.plots[p] || S.coins < c.seed) return;
        S.coins -= c.seed; S.plots[p] = { crop: d.crop, at: t }; S.plants++; mark();
      } else if (ty === "harvest") {
        const p = S.plots[d.plot]; if (!p) return; const c = CROPS[p.crop]; if (t - p.at < c.g * 60000 - 1500) return;
        add(p.crop, hash(e.id) % 100 < 30 ? 2 : 1); S.plots[d.plot] = null; S.harvests++; mark();
      } else if (ty === "sell") {
        const c = CROPS[d.id], q = d.qty; if (!c || !(q >= 1) || (S.inv[d.id] || 0) < q) return;
        const unit = Math.floor(G.priceOf(d.id, day) * (d.stand ? 0.8 : 1)); add(d.id, -q); S.coins += unit * q; S.sells += q; mark();
      } else if (ty === "feed") {
        const f = FOOD[d.item], w = d.who; if (!f || !S.m[w] || (S.inv[d.item] || 0) < 1) return;
        decay(t); const m = S.m[w]; add(d.item, -1); m.food = Math.min(100, m.food + f.food); m.drink = Math.min(100, m.drink + f.drink); m.joy = Math.min(100, m.joy + f.joy); S.feeds++; mark();
        (S.fed[day] = S.fed[day] || {})[w] = 1;
        if (!S.blessed[day] && ["hajji", "hajjeh"].every((x) => S.m[x].food >= 55 && S.m[x].drink >= 55)) { S.blessed[day] = 1; S.coins += 8; }
      } else if (ty === "chat") {
        decay(t); ["hajji", "hajjeh"].forEach((w) => (S.m[w].joy = Math.min(100, S.m[w].joy + 6))); mark();
      } else if (ty === "water") {
        if ((S.inv.wcan || 0) < 1) return; const set = (S.days[day] = S.days[day] || {}); if (set[a]) return;
        add("wcan", -1); set[a] = 1; mark();
        if (Object.keys(set).length >= 2 && !S.comp[day]) {
          S.comp[day] = 1; S.streak = S.lastComp === day - 1 ? S.streak + 1 : 1; S.lastComp = day;
          const r = MILES[S.streak]; if (r && !S.paidMile[S.lastComp - S.streak + ":" + S.streak]) { S.paidMile[S.lastComp - S.streak + ":" + S.streak] = 1; S.coins += r; }
        }
      } else if (ty === "order") {
        const o = G.ordersOf(d.day)[d.idx]; if (!o || d.day !== day || S.orders[d.day + ":" + d.idx] || (S.inv[o.crop] || 0) < o.qty) return;
        add(o.crop, -o.qty); S.coins += o.reward; S.orders[d.day + ":" + d.idx] = 1; mark();
      } else if (ty === "gift") {
        const g = GIFTS[d.id]; if (!g || S.coins < g.price) return; S.coins -= g.price; S.gifts.push({ id: d.id, from: a, note: String(d.note || "").slice(0, 140), t, key: e.id }); mark();
      } else if (ty === "together") {
        S.tog[day] = (S.tog[day] || 0) + 1; if (S.tog[day] <= 10) S.coins += 3;
      }
    });
    S.last = ev.length ? ev[ev.length - 1].id : "";
    return S;
  }
  G.state = () => {
    const evs = db.entries.filter((e) => e.house === "game"), key = evs.length + ":" + (evs.length ? evs[evs.length - 1].id : "") + ":" + db.uid;
    if (G._k !== key) { G._s = fold(evs); G._k = key; }
    return G._s;
  };
  // عرض الحالة بالوقت الحالي (تناقص مؤشرات الحجّي)
  G.view = () => {
    const s = G.state(), now = Date.now(), dt = Math.max(0, now - s.mt), v = { m: {} }, day = dayKey(now);
    ["hajji", "hajjeh"].forEach((w) => { const m = s.m[w]; v.m[w] = { food: Math.max(0, m.food - dt * DECAY.food), drink: Math.max(0, m.drink - dt * DECAY.drink), joy: Math.max(0, m.joy - dt * DECAY.joy) }; });
    v.today = day; v.doneToday = Object.keys(s.days[day] || {}); v.myWater = !!(s.days[day] || {})[db.uid];
    v.partnerWater = !!(db.partner && (s.days[day] || {})[db.partner.id]);
    v.streakAlive = s.lastComp >= day - 1; v.streak = v.streakAlive ? s.streak : 0; v.completeToday = !!s.comp[day]; v.wilt = !v.streakAlive && s.lastComp > -9;
    v.plots = s.plots.map((p) => { if (!p) return null; const c = CROPS[p.crop], prog = Math.min(1, (now - p.at) / (c.g * 60000)); return { crop: p.crop, progress: prog, ripe: prog >= 1, left: Math.max(0, Math.ceil((c.g * 60000 - (now - p.at)) / 60000)), color: c.c }; });
    return Object.assign(v, { s });
  };
  const mine = (day, ty) => !!((G.state().acts[day] || {})[db.uid + ":" + ty]);

  /* ---------- تنفيذ الأفعال ---------- */
  G.do = async (type, data) => {
    await db.addEntry({ house: "game", title: type, data });
    G.sync3d(); if (OSW.places) OSW.places.refresh(); if (OSW.app) OSW.app.checkAchievements();
  };
  const toast = (m, c) => ui.toast(m, c || "");
  const needCoins = (n) => { const c = G.state().coins; if (c < n) { toast(`ما معك مصاري كفاية 🪙 (بدك ${n}، معك ${c})`); OSW.audio.sfx("pop"); return true; } return false; };

  /* ---------- مزامنة المشهد ثلاثي الأبعاد ---------- */
  G.sync3d = () => {
    const W = OSW.world; if (!W || !W.S || !W.S.ready || !db.me) return;
    const v = G.view();
    const key = JSON.stringify([v.plots.map((p) => p && [p.crop, Math.round(p.progress * 10)]), v.streak, v.completeToday, v.wilt]);
    if (G._k3 !== key) { G._k3 = key; W.setFarm(v.plots.map((p) => p && { crop: p.crop, progress: p.progress, color: p.color, size: 1 })); W.setFlowers(v.streak, v.completeToday, v.wilt); }
    ["hajji", "hajjeh"].forEach((w) => { const m = v.m[w], lo = Math.min(m.food, m.drink); W.setNpcMood(w, lo < 25 ? "😢" : lo < 55 ? "😐" : "😊", lo < 40 ? "❗" : ""); });
    const ripe = v.plots.filter((p) => p && p.ripe).length, lowH = Math.min(v.m.hajji.food, v.m.hajji.drink, v.m.hajjeh.food, v.m.hajjeh.drink) < 40 ? 1 : 0;
    G.badges = { farm: ripe, hajji: lowH, flowers: v.myWater ? 0 : 1 };
    const pill = document.getElementById("coinNum"); if (pill) pill.textContent = G.state().coins;
    const tb = document.getElementById("taskBadge"); if (tb) { const n = G.tasks().filter((t) => !t.done).length; tb.textContent = n; tb.hidden = !n; }
    OSW.app && OSW.app.updateBadges && OSW.app.updateBadges();
    G.checkGifts();
  };
  setInterval(() => { try { if (db && db.me) G.sync3d(); } catch (e) {} }, 20000);

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
      { e: "🌹", t: "اسقِ ورود الحب", done: v.myWater, go: "flowers" },
      { e: "💞", t: `${db.partner ? db.partner.name : "شريكك"} سقت/سقى الورد كمان`, done: v.partnerWater, go: "flowers", soft: 1 },
      { e: "🧓", t: "أطعم الحجّي والحجّة", done: !!(fedToday.hajji && fedToday.hajjeh), go: "hajji" },
      { e: "🌾", t: "ازرع أو اقطف من المزرعة", done: mine(d, "plant") || mine(d, "harvest"), go: "farm" },
      { e: "🏪", t: "مرّ على سعدون واشترِ شي", done: mine(d, "buy") || mine(d, "sell"), go: "shop" },
    ];
  };
  G.perfectToday = () => G.tasks().every((t) => t.done);

  /* ---------- النوافذ ---------- */
  const coinBar = () => `<div class="coinbar">🪙 <b>${G.state().coins}</b></div>`;
  const left = (m) => (m >= 60 ? Math.floor(m / 60) + " س " + (m % 60) + " د" : m + " د");
  const meter = (l, v, c) => `<div class="mrow"><span>${l}</span><div class="mbar"><i style="width:${Math.round(v)}%;background:${c}"></i></div><b>${Math.round(v)}</b></div>`;

  G.openers = {
    shop() {
      const s = G.state(), tab = G.ui.tab, wk = Math.floor(G.today() / 7), till = Math.floor(s.till[wk] || 0), paid = s.tillPaid[wk];
      const lines = ["أهلين فيكم! اللي بدكم إياه عندي 😎", "اليوم الخضرة طازة والأسعار على قد الحال 🥬", "بدي أقبض راتبي آخر الأسبوع، اشتروا كتير! 😂", "للحجّي والحجّة عندي أحسن شاي بالقرية ☕"];
      const row = (id, it, extra, price, qty = [1, 5]) => `<div class="irow"><span class="ie">${it.e}</span><div class="iname"><b>${esc(it.n)}</b><small>${extra}</small></div><div class="ib">${qty.map((q) => `<button class="btn sm gold" data-act="g-buy" data-id="${id}" data-q="${q}" ${s.coins < cost(price, q, s.buys) ? "disabled" : ""}>×${q} · ${cost(price, q, s.buys)}🪙</button>`).join("")}</div></div>`;
      let body = "";
      if (tab === "food") body = Object.entries(FOOD).map(([k, f]) => row(k, f, `🍞+${f.food} 💧+${f.drink} 😊+${f.joy} · عندك ${s.inv[k] || 0}`, f.price)).join("");
      else if (tab === "flower") body = row("wcan", SUPPLY.wcan, `بتسقي فيها الورد مرة وحدة · عندك ${s.inv.wcan || 0}`, SUPPLY.wcan.price, [1, 3, 7]);
      else if (tab === "gift") body = `<p class="hint">اشترِ هدية وسعدون بيوصّلها لـ${esc(ui.partnerName())} مع كلمة منك 💌</p><input class="in" id="giftNote" maxlength="120" placeholder="اكتب كلمة حلوة مع الهدية…" style="margin-bottom:8px">` + Object.entries(GIFTS).map(([k, g]) => `<div class="irow"><span class="ie">${g.e}</span><div class="iname"><b>${esc(g.n)}</b></div><div class="ib"><button class="btn sm berry" data-act="g-gift" data-id="${k}" ${s.coins < g.price ? "disabled" : ""}>أرسل · ${g.price}🪙</button></div></div>`).join("");
      else body = `<p class="hint">أسعار اليوم بتتغير كل يوم ▲▼ — بيع المحاصيل بالوقت المناسب!</p>` + (Object.keys(CROPS).filter((k) => s.inv[k] > 0).map((k) => { const c = CROPS[k]; return `<div class="irow"><span class="ie">${c.e}</span><div class="iname"><b>${c.n} ×${s.inv[k]}</b><small>سعر اليوم ${G.priceOf(k, G.today())}🪙 ${G.trend(k, G.today())}</small></div><div class="ib"><button class="btn sm gold" data-act="g-sell" data-id="${k}" data-q="1">بيع 1</button><button class="btn sm gold" data-act="g-sell" data-id="${k}" data-q="${s.inv[k]}">الكل</button></div></div>`; }).join("") || `<div class="empty">ما عندك محاصيل للبيع. روح للمزرعة 🌾</div>`);
      ui.openModal(`<h3>🏪 بقالة سعدون</h3>${coinBar()}
        <div class="npc-say"><span class="nav">🧑‍🍳</span><div class="res-say"><small>سعدون</small>${esc(lines[Math.floor(Date.now() / 60000) % lines.length])}</div></div>
        <div class="salary"><small>راتب سعدون الأسبوعي: ${till}/${SALARY}🪙 ${paid ? "✅ انصرف (وأعطاكم 10🪙 مكافأة!)" : "— كل ما اشتريتوا بيقرب يقبض"}</small><div class="progress"><i style="width:${Math.min(100, till)}%"></i></div></div>
        <div class="seg" style="margin:10px 0">${[["food", "🍞 أكل للحجّيين"], ["flower", "🌹 للورد"], ["gift", "🎁 هدايا"], ["sell", "🧺 بيع محصولك"]].map(([k, t]) => `<button class="${tab === k ? "on" : ""}" data-act="g-tab" data-k="${k}">${t}</button>`).join("")}</div>
        <div class="items">${body}</div>`);
    },
    farm() {
      const v = G.view(), s = v.s, sel = G.ui.seed;
      const cell = (p, i) => !p ? `<button class="plot empty" data-act="g-plot" data-i="${i}"><span>＋</span><small>فاضية</small></button>`
        : p.ripe ? `<button class="plot ripe" data-act="g-harvest" data-i="${i}"><span>${CROPS[p.crop].e}</span><small>جاهز! اقطف</small></button>`
        : `<button class="plot grow" data-act="g-plot" data-i="${i}"><span>${p.progress < 0.4 ? "🌱" : "🌿"}</span><small>${CROPS[p.crop].e} ${left(p.left)}</small></button>`;
      const seeds = Object.entries(CROPS).map(([k, c]) => `<button class="seed ${G.ui.last === k ? "on" : ""}" data-act="g-seed" data-k="${k}"><span>${c.e}</span><b>${c.n}</b><small>بذرة ${c.seed}🪙 · ${left(c.g)} · يُباع ~${c.sell}🪙</small></button>`).join("");
      const ripeN = v.plots.filter((p) => p && p.ripe).length, emptyN = v.plots.filter((p) => !p).length;
      const inv = Object.keys(CROPS).filter((k) => s.inv[k] > 0).map((k) => `<span class="tag">${CROPS[k].e} ×${s.inv[k]}</span>`).join(" ");
      ui.openModal(`<h3>🌾 المزرعة</h3>${coinBar()}<p class="hint">الهدف: تزرعوا وتبيعوا وتشتروا أكل للحجّي والحجّة وماء للورد 💕 المحاصيل بتكبر حتى وانتم مش هون.</p>
        <div class="plots">${v.plots.map(cell).join("")}</div>
        <div class="row" style="margin:8px 0"><button class="btn gold" data-act="g-harvest-all" ${ripeN ? "" : "disabled"}>🧺 اقطف الجاهز (${ripeN})</button><button class="btn alt" data-act="g-plant-all" ${emptyN ? "" : "disabled"}>🌱 ازرع ${CROPS[G.ui.last].e} بالفاضي</button></div>
        <b>اختار البذرة:</b><div class="seeds">${seeds}</div>
        <div class="sep"></div><b>مخزنك:</b> ${inv || '<span class="hint">فاضي</span>'}
        ${inv ? `<div class="row" style="margin-top:8px"><button class="btn alt sm" data-act="g-standsell">بيع الكل ببسطة المزرعة (-20%)</button><button class="btn alt sm" data-act="g-gotoshop">للدكان (سعر أحسن) 🏪</button></div>` : ""}`);
    },
    flowers() {
      const v = G.view(), s = v.s, pn = ui.partnerName(), n = v.streak, stage = n === 0 ? (v.wilt ? "🥀" : "🌱") : n < 3 ? "🌷" : n < 7 ? "🌸" : n < 14 ? "🌹" : "💐";
      const nextM = Object.keys(MILES).map(Number).find((m) => m > n);
      ui.openModal(`<h3>🌹 ورود الحب</h3>
        <div class="bigflower">${stage}</div>
        <div class="big-days" style="font-size:54px">${n}</div><div style="text-align:center;font-weight:700">${n ? "يوم متواصل من السقي" : v.wilt ? "الورد ذبل… ابدأوا من جديد 💔" : "ابدأوا أول يوم!"}</div>
        ${nextM ? `<p class="hint" style="text-align:center">الهدية القادمة عند ${nextM} يوم: ${MILES[nextM]}🪙</p>` : ""}
        <div class="two"><div class="chk ${v.myWater ? "ok" : ""}">${v.myWater ? "✅" : "⬜"}<b>أنا</b></div><div class="chk ${v.partnerWater ? "ok" : ""}">${v.partnerWater ? "✅" : "⬜"}<b>${esc(pn)}</b></div></div>
        <p class="hint" style="text-align:center">الورد بيكبر لما الاثنين يسقوه كل يوم. كل واحد بيحتاج «ماء سقاية» من سعدون.</p>
        <div class="row" style="justify-content:center"><button class="btn berry" data-act="g-water" ${v.myWater ? "disabled" : ""}>💦 ${v.myWater ? "سقيتو اليوم" : "اسقِ الورد"} <small>(عندك ${s.inv.wcan || 0})</small></button><button class="btn alt" data-act="g-gotoshop-flower">اشتري ماء 🏪</button></div>
        ${v.completeToday ? `<div class="pick" style="margin-top:12px">💞 الاثنين سقوا الورد اليوم! الورد بيشع 🌟</div>` : ""}`);
    },
    hajji() {
      const v = G.view(), s = v.s, blessed = !!s.blessed[v.today];
      const stories = ["أيام زمان يا ابني، كنا نقعد عالدرج بعد العشا ونحكي… والقلوب كانت أوسع من البيوت.", "الورد يا ولدي بدو سقي كل يوم، والحب مثلو بالضبط.", "سمعت حكاية عن اثنين… كل يوم يقولوا لبعض «كيف أصبحت؟» وعاشوا ستين سنة 🌹", "أحلى كنز بالدنيا لمّة بيت صغير فيه ضحكة.", "الله يبارك لكم بالعمر والصحة والذرية الطيبة 🤲"];
      const who = (w, nm, e) => { const m = v.m[w], low = Math.min(m.food, m.drink), state = low < 25 ? "جوعان/عطشان وزعلان 😢" : low < 55 ? "ينتظر منكم شي 😐" : "مبسوط الحمدلله 😊";
        return `<div class="hcard"><div class="hav">${e}</div><b>${nm}</b><small>${state}</small>${meter("🍞 أكل", m.food, "#f4a261")}${meter("💧 شرب", m.drink, "#4aa3e0")}${meter("😊 فرحة", m.joy, "#e63e6d")}
        <div class="feedrow">${Object.entries(FOOD).filter(([k]) => (s.inv[k] || 0) > 0).map(([k, f]) => `<button class="btn sm gold" data-act="g-feed" data-w="${w}" data-i="${k}">${f.e} ×${s.inv[k]}</button>`).join("") || `<small class="hint">ما عندك أكل. روح لسعدون 🏪</small>`}</div></div>`; };
      ui.openModal(`<h3>🧓 الحجّي والحجّة</h3>${coinBar()}
        <p class="hint">كل يوم لازم تطعموهم وتسقوهم. لو الاثنين فوق 55% بالأكل والشرب بتاخدوا «بركة اليوم» 🤲 + 8🪙</p>
        <div class="${blessed ? "pick" : "chk"}" style="margin:8px 0;text-align:center">${blessed ? "🤲 بركة اليوم: «الله يسعدكم ويحفظ لبعض ويجمعكم على الخير»" : "بركة اليوم: لسا ⏳"}</div>
        <div class="two">${who("hajji", "الحجّي أبو محمود", "👳")}${who("hajjeh", "الحجّة أم محمود", "👵")}</div>
        <div class="row" style="margin-top:10px"><button class="btn alt" data-act="g-chat">📜 احكيلنا حكاية يا حجّي</button><button class="btn alt" data-act="g-gotoshop">للدكان 🏪</button></div>
        <div id="hStory" class="pick" style="display:none;margin-top:10px;font-size:19px"></div>`);
      G._stories = stories;
    },
    orders() {
      const s = G.state(), day = G.today(), os = G.ordersOf(day);
      ui.openModal(`<h3>📋 طلبات أهل القرية</h3>${coinBar()}<p class="hint">كل يوم 3 طلبات جديدة، والسعر أعلى من السوق بـ50% 💰</p>` + os.map((o) => { const n = OSW.NPC_BY[o.npc], done = s.orders[day + ":" + o.idx], have = s.inv[o.crop] || 0, c = CROPS[o.crop];
        return `<div class="irow ${done ? "done" : ""}"><span class="ie">${n.emoji}</span><div class="iname"><b>${esc(n.name)}</b><small>بدو ${o.qty}× ${c.e} ${c.n} · عندك ${have}</small></div><div class="ib">${done ? '<span class="badge-ok">تم ✅</span>' : `<button class="btn sm gold" data-act="g-order" data-i="${o.idx}" ${have < o.qty ? "disabled" : ""}>سلّم · ${o.reward}🪙</button>`}</div></div>`; }).join(""));
    },
    tasks() {
      const ts = G.tasks(), done = ts.filter((t) => t.done).length;
      ui.openModal(`<h3>✅ مهام اليوم</h3><div class="progress" style="margin-bottom:10px"><i style="width:${(done / ts.length) * 100}%"></i></div><p class="hint">${done === ts.length ? "يوم مثالي! 🎉 ما قصّرتوا بشي" : `${done} من ${ts.length} — كملوا عشان يكون يومكم مثالي`}</p>` + ts.map((t) => `<button class="irow taskrow ${t.done ? "done" : ""}" data-act="g-go" data-k="${t.go}"><span class="ie">${t.done ? "✅" : t.e}</span><div class="iname"><b>${esc(t.t)}</b></div></button>`).join("") +
        `<div class="sep"></div><div class="row"><button class="btn alt" data-act="g-orders">📋 طلبات الأهل</button><button class="btn alt" data-act="g-inv">🎒 مخزني</button></div>`);
    },
    inv() {
      const s = G.state(), items = Object.keys(s.inv).filter((k) => s.inv[k] > 0 && ITEM[k]);
      const got = s.gifts.filter((g) => g.from !== db.uid);
      ui.openModal(`<h3>🎒 مخزنكم</h3>${coinBar()}<div class="chips" style="gap:8px">${items.map((k) => `<span class="tag" style="font-size:15px">${ITEM[k].e} ${esc(ITEM[k].n)} ×${s.inv[k]}</span>`).join("") || '<span class="hint">فاضي</span>'}</div>
        <div class="sep"></div><b>هدايا وصلتني 💝</b>${got.map((g) => `<div class="ans">${GIFTS[g.id].e} ${esc(GIFTS[g.id].n)} من ${esc(ui.prof(g.from).name)}${g.note ? ` — «${esc(g.note)}»` : ""}</div>`).join("") || '<div class="hint">لسا ما وصلتك هدايا</div>'}`);
    },
  };

  /* ---------- نقرات ---------- */
  G.click = (a, el) => {
    const P = OSW.places, st = G.ui, v = () => G.view(), busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } };
    switch (a) {
      case "g-tab": st.tab = el.dataset.k; return P.refresh();
      case "g-buy": { const it = ITEM[el.dataset.id], q = +el.dataset.q, c = cost(it.price, q, G.state().buys); if (needCoins(c)) return; return busy(async () => { await G.do("buy", { id: el.dataset.id, qty: q }); OSW.audio.sfx("coin"); toast(`${it.e} اشتريت ×${q}`); }); }
      case "g-sell": return busy(async () => { await G.do("sell", { id: el.dataset.id, qty: +el.dataset.q }); OSW.audio.sfx("coin"); toast("🪙 انباعت!"); });
      case "g-gift": { const g = GIFTS[el.dataset.id]; if (needCoins(g.price)) return; if (!db.partner) return toast("لسا شريكك ما دخل القرية"); const note = ((document.getElementById("giftNote") || {}).value || "").trim(); return busy(async () => { await G.do("gift", { id: el.dataset.id, note }); OSW.audio.sfx("heart"); ui.hearts(g.e, 14); toast(`${g.e} سعدون راح يوصّل الهدية 💌`, "love"); }); }
      case "g-plot": { const i = +el.dataset.i, p = v().plots[i]; if (p) return toast(`${CROPS[p.crop].e} لسا بدها ${left(p.left)}`); const c = CROPS[st.last]; if (needCoins(c.seed)) return; return busy(async () => { await G.do("plant", { plot: i, crop: st.last }); OSW.audio.sfx("pop"); }); }
      case "g-seed": st.last = el.dataset.k; return P.refresh();
      case "g-harvest": return busy(async () => { await G.do("harvest", { plot: +el.dataset.i }); OSW.audio.sfx("coin"); ui.hearts("🧺", 4); });
      case "g-harvest-all": return busy(async () => { const ps = v().plots; for (let i = 0; i < ps.length; i++) if (ps[i] && ps[i].ripe) await db.addEntry({ house: "game", title: "harvest", data: { plot: i } }); G.sync3d(); P.refresh(); OSW.audio.sfx("fanfare"); ui.hearts("🧺", 10); OSW.app.checkAchievements(); });
      case "g-plant-all": return busy(async () => { const ps = v().plots, c = CROPS[st.last]; let coins = G.state().coins, n = 0; for (let i = 0; i < ps.length; i++) if (!ps[i] && coins >= c.seed) { await db.addEntry({ house: "game", title: "plant", data: { plot: i, crop: st.last } }); coins -= c.seed; n++; } if (!n) toast("ما معك مصاري للبذور"); G.sync3d(); P.refresh(); OSW.audio.sfx("pop"); });
      case "g-standsell": return busy(async () => { const s = G.state(); for (const k of Object.keys(CROPS)) if (s.inv[k] > 0) await db.addEntry({ house: "game", title: "sell", data: { id: k, qty: s.inv[k], stand: 1 } }); G.sync3d(); P.refresh(); OSW.audio.sfx("coin"); });
      case "g-gotoshop": case "g-gotoshop-flower": st.tab = a === "g-gotoshop" ? "food" : "flower"; ui.closeModal(); return OSW.app.goPlace("shop");
      case "g-water": { if ((G.state().inv.wcan || 0) < 1) { toast("ما عندك ماء سقاية 💦 اشتري من سعدون"); return; } return busy(async () => { await G.do("water", {}); OSW.audio.sfx("magic"); ui.hearts("💦", 10); toast("سقيت الورد 🌹", "love"); if (G.view().completeToday) { ui.hearts("💞", 16); OSW.audio.sfx("fanfare"); } }); }
      case "g-feed": return busy(async () => { await G.do("feed", { who: el.dataset.w, item: el.dataset.i }); OSW.audio.sfx("heart"); OSW.world.say(el.dataset.w, rnd(["الله يسعدك! 🤲", "تسلم إيدك يا ولدي!", "بالهنا والشفا! 😊", "الله يخليكم لبعض 💞"]), 4000); if (G.state().blessed[G.today()]) { ui.hearts("🤲", 12); } });
      case "g-chat": { const s = rnd(G._stories || ["الله يحفظكم"]); const o = document.getElementById("hStory"); if (o) { o.style.display = ""; o.textContent = s; } return busy(async () => { await db.addEntry({ house: "game", title: "chat", data: {} }); G.sync3d(); }); }
      case "g-order": return busy(async () => { await G.do("order", { day: G.today(), idx: +el.dataset.i }); OSW.audio.sfx("fanfare"); ui.hearts("🪙", 12); });
      case "g-go": ui.closeModal(); return OSW.app.goPlace(el.dataset.k);
      case "g-orders": return P.open("orders"); case "g-inv": return P.open("inv");
    }
  };
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
})();
