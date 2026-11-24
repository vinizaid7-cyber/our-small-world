/* التحديات (V12 / حساب 4): يومية، أسبوعية، موسمية، سنوية.
   كل شي محسوب من أحداث game بجدول entries (نفس نظام اللعبة)، فالتقدّم محفوظ وبيتزامن، وما في مكافأة مرتين
   مهما أعدتوا التحميل أو الاتصال: المكافأة بتنصرف بالـfold عند حدث chal_claim، ولأي (لاعب + تحدي + فترة) مرة وحدة.
   روابط الدمج (للحسابات التانية): OSW.chal.bump(S, uid, t, metric, n) من داخل أي fold، ونظام الإشعارات OSW.chal.feed(). */
(function () {
  const OSW = window.OSW, G = OSW.game, esc = OSW.esc;
  const C = (OSW.chal = { v: 1 });
  const OFF = 3 * 3600000, DAY = 86400000;
  const ui = () => OSW.ui, db = () => OSW.ui.db;
  const dayKey = (t) => Math.floor((t + OFF) / DAY);

  /* ============ الفترات ============ */
  const SEAS = (m) => (m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn");
  const SEAS_AR = { winter: "الشتاء ❄️", spring: "الربيع 🌸", summer: "الصيف ☀️", autumn: "الخريف 🍂" };
  C.keyOf = (sc, t) => {
    if (sc === "d") return String(dayKey(t));
    if (sc === "w") return String(Math.floor((dayKey(t) + 3) / 7)); // الأسبوع بيبدأ الاثنين
    const D = new Date(t + OFF), y = D.getUTCFullYear(), m = D.getUTCMonth();
    if (sc === "y") return String(y);
    return SEAS(m) + "-" + (m === 11 ? y + 1 : y);
  };
  C.endOf = (sc, t) => {
    if (sc === "d") return (dayKey(t) + 1) * DAY - OFF;
    if (sc === "w") return ((Math.floor((dayKey(t) + 3) / 7) + 1) * 7 - 3) * DAY - OFF;
    const D = new Date(t + OFF), y = D.getUTCFullYear(), m = D.getUTCMonth();
    if (sc === "y") return Date.UTC(y + 1, 0, 1) - OFF;
    const nm = m >= 2 && m <= 4 ? [y, 5] : m >= 5 && m <= 7 ? [y, 8] : m >= 8 && m <= 10 ? [y, 11] : m === 11 ? [y + 1, 2] : [y, 2];
    return Date.UTC(nm[0], nm[1], 1) - OFF;
  };
  C.EPOCH = Date.UTC(2026, 10, 24); // تاريخ إطلاق النظام: الفترات الموسمية/السنوية اللي بدأت قبله بتتقلّص أهدافها ومكافآتها بنسبة الوقت المتاح
  const startOf = (sc, t) => {
    if (sc === "d") return dayKey(t) * DAY - OFF;
    if (sc === "w") return (Math.floor((dayKey(t) + 3) / 7) * 7 - 3) * DAY - OFF;
    const D = new Date(t + OFF), y = D.getUTCFullYear(), m = D.getUTCMonth();
    if (sc === "y") return Date.UTC(y, 0, 1) - OFF;
    return Date.UTC(m === 11 ? y : m <= 1 ? y - 1 : y, m >= 2 && m <= 4 ? 2 : m >= 5 && m <= 7 ? 5 : m >= 8 && m <= 10 ? 8 : 11, 1) - OFF;
  };
  const tOfKey = (sc, key) => {
    if (sc === "d") return +key * DAY - OFF + 12 * 3600000;
    if (sc === "w") return (+key * 7 - 3) * DAY - OFF + 3 * DAY;
    if (sc === "y") return Date.UTC(+key, 5, 15) - OFF;
    const [nm, ly] = String(key).split("-"); return Date.UTC(+ly, { winter: 0, spring: 3, summer: 6, autumn: 9 }[nm], 15) - OFF;
  };
  const effm = {};
  // الهدف والمكافأة الفعلية لتحدي بفترة معيّنة (حتمي من المفتاح: كل الأجهزة بتحسب نفس الشي)
  C.eff = (def, key) => {
    const k = def.id + key; if (effm[k]) return effm[k];
    let f = 1; if (def.sc === "s" || def.sc === "y") { const t = tOfKey(def.sc, key), st = startOf(def.sc, t), en = C.endOf(def.sc, t); f = Math.max(0.25, Math.min(1, (en - Math.max(st, C.EPOCH)) / (en - st))); }
    return (effm[k] = { f, n: Math.max(1, Math.ceil(def.n * f)), coins: Math.round(def.coins * f), items: f >= 0.5, badge: f >= 0.5 });
  };
  C.SCALES = [["d", "اليوم", "📅"], ["w", "الأسبوع", "🗓️"], ["s", "الموسم", "🌿"], ["y", "السنة", "🏆"]];
  const NPICK = { d: 3, w: 3, s: 2, y: 2 };

  /* ============ التعريفات ============
     m = المقياس (metric) · n = الهدف · coins/items/badge = المكافأة. التحديات مختارة بحيث ما يتكرر نفس النوع بنفس الفترة. */
  const D = (sc, id, m, n, coins, t, x) => Object.assign({ id, sc, m, n, coins, t }, x || {});
  const DEFS = (C.DEFS = [
    D("d", "d_harvest", "harvest", 6, 18, "🌾 اقطفوا 6 مرات من المزرعة"), D("d", "d_plant", "plant", 6, 14, "🌱 ازرعوا 6 مرات"),
    D("d", "d_deliver", "deliver", 1, 26, "🛒 وصّلوا عربة محاصيل للسوق (بسحب الاثنين)"), D("d", "d_visit", "visit", 1, 22, "🧭 زوروا مكان: مطعم/فندق بالمدينة أو نزهة بالجزيرة"),
    D("d", "d_sale", "sale", 4, 16, "🪙 بيعوا 4 مرات (محاصيل، سمك، منتجات)"), D("d", "d_income", "income", 150, 20, "💰 اكسبوا 150 🪙"),
    D("d", "d_order", "order", 1, 24, "📋 نفّذوا طلب زبون من طلبات الأهل"), D("d", "d_fish", "fish", 2, 14, "🎣 اصطادوا سمكتين"),
    D("d", "d_act", "act", 1, 28, "🎮 العبوا نشاط مشترك للنهاية سوا"), D("d", "d_photo", "photo", 1, 16, "📸 خلّصوا مهمة تصوير"),
    D("d", "d_eat", "eat", 2, 10, "🍽️ كُل مرتين (حافظ على طاقتك)"),
    D("w", "w_order", "order", 5, 75, "📋 نفّذوا 5 طلبات زبائن"), D("w", "w_harvest", "harvest", 40, 85, "🌾 اقطفوا 40 مرة هالأسبوع"),
    D("w", "w_act", "act", 3, 95, "💞 مهمة تعاونية: خلّصوا 3 أنشطة مشتركة"), D("w", "w_visit", "visit", 4, 85, "🧭 زوروا 4 أماكن مختلفة (مدينة وجزيرة)"),
    D("w", "w_income", "income", 1000, 100, "💰 اكسبوا 1000 🪙 هالأسبوع"), D("w", "w_deliver", "deliver", 4, 90, "🛒 4 توصيلات بالعربة"),
    D("w", "w_sale", "sale", 25, 80, "🪙 25 عملية بيع"), D("w", "w_fish", "fish", 10, 65, "🎣 صيد 10 سمكات"), D("w", "w_plant", "plant", 30, 75, "🌱 30 زراعة"),
    D("s", "s_harvest", "harvest", 220, 260, "🌾 حصاد {s}: اقطفوا 220 مرة", { badge: "b_harvest" }), D("s", "s_income", "income", 6000, 320, "💰 اكسبوا 6000 🪙 خلال {s}", { items: { fu_pinball: 1 } }),
    D("s", "s_visit", "visit", 16, 280, "🧭 سياحة {s}: 16 زيارة للمدينة والجزر", { badge: "b_tourist" }), D("s", "s_act", "act", 12, 300, "🎪 تحضير مهرجان {s}: 12 نشاط مشترك", { items: { fu_karaoke: 1 } }),
    D("s", "s_deliver", "deliver", 14, 270, "🚚 وصّلوا منتجات {s}: 14 توصيلة"), D("s", "s_order", "order", 20, 290, "📋 لبّوا الطلب الموسمي: 20 طلب زبون"),
    D("y", "y_harvest", "harvest", 1500, 700, "🌾 هدف إنتاج السنة: 1500 قطفة", { badge: "b_farmer", items: { fu_greenhouse: 1 } }), D("y", "y_income", "income", 40000, 900, "💰 إنجاز الشركة: اكسبوا 40000 🪙 بالسنة", { badge: "b_tycoon", items: { fu_piano: 1 } }),
    D("y", "y_visit", "visit", 100, 750, "🧭 رحّالة السنة: 100 زيارة", { badge: "b_explorer", items: { fu_gazebo: 1 } }), D("y", "y_act", "act", 60, 800, "💞 جائزة الثنائي: 60 نشاط مشترك", { badge: "b_duo", items: { fu_cinema: 1 } }),
    D("y", "y_deliver", "deliver", 120, 850, "🚚 عقد التصدير الكبير: 120 توصيلة", { badge: "b_export" }), D("y", "y_order", "order", 120, 780, "🏅 أفضل خدمة: 120 طلب زبون", { badge: "b_service" }),
  ]);
  const DEF = (C.DEF = {}); DEFS.forEach((d) => { d.t = d.t.replace(String(d.n), "{n}"); DEF[d.id] = d; });
  const BADGES = (C.BADGES = { b_harvest: ["🥇", "حصّاد الموسم"], b_tourist: ["🧳", "سائح الموسم"], b_farmer: ["🧑‍🌾", "مزارع السنة"], b_tycoon: ["💼", "قطب الشركة"], b_explorer: ["🗺️", "رحّالة السنة"], b_duo: ["💞", "ثنائي السنة"], b_export: ["🚢", "ملك التصدير"], b_service: ["⭐", "أفضل خدمة"] });
  const METRIC_AR = { harvest: "قطفة", plant: "زراعة", deliver: "توصيلة", visit: "زيارة", sale: "عملية بيع", income: "🪙", order: "طلب", fish: "سمكة", act: "نشاط مشترك", photo: "تصوير", eat: "وجبة", buy: "شراء" };

  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const memo = {};
  // الاختيار حتمي بالفترة: نفس المفتاح = نفس التحديات عند كل اللاعبين وبكل إعادة حساب
  C.pick = (sc, key) => {
    const k = sc + key; if (memo[k]) return memo[k];
    let h = hash(k), r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0), h / 4294967296);
    const pool = DEFS.filter((d) => d.sc === sc).sort((a, b) => (a.id < b.id ? -1 : 1));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const out = [], used = new Set();
    pool.forEach((d) => { if (out.length < NPICK[sc] && !used.has(d.m)) { used.add(d.m); out.push(d.id); } });
    return (memo[k] = out);
  };

  /* ============ الحالة (fold) ============ */
  const root = (S) => S.chal || (S.chal = { m: {}, claimed: {}, done: {}, hist: [], badges: {}, feed: [] });
  const feedPush = (S, o) => { const R = root(S); R.feed.push(o); if (R.feed.length > 80) R.feed.splice(0, R.feed.length - 80); };
  const prog = (S, a, sc, key, m) => { const u = root(S).m[a]; return (u && u[sc] && u[sc][key] && u[sc][key][m]) || 0; };
  C.bump = (S, a, t, metric, n) => {
    if (!(n > 0)) return; const R = root(S), u = R.m[a] || (R.m[a] = { d: {}, w: {}, s: {}, y: {} });
    ["d", "w", "s", "y"].forEach((sc) => { const k = C.keyOf(sc, t), o = u[sc][k] || (u[sc][k] = {}); o[metric] = (o[metric] || 0) + n; });
    checkDone(S, a, t, metric);
  };
  function checkDone(S, a, t, metric) {
    const R = root(S);
    ["d", "w", "s", "y"].forEach((sc) => { const key = C.keyOf(sc, t); C.pick(sc, key).forEach((id) => {
      const def = DEF[id], ck = a + "|" + id + "|" + key; if (def.m !== metric || R.done[ck]) return;
      if (prog(S, a, sc, key, metric) >= C.eff(def, key).n) { R.done[ck] = t; feedPush(S, { id: "done:" + ck, t, a, k: "done", c: id, p: key }); }
    }); });
  }
  const SALE = new Set(["sell", "sellcrate", "psell", "asell", "order", "cart_pull", "dsell", "csell", "ct_psell", "co_sell"]);
  const NOINC = new Set(["chal_claim", "furn_sell", "land_sell"]);
  const BYTYPE = { afeed: "feed", acollect: "collect", order: "order", eat: "eat" };
  C.snap = (S) => ({ c: S.coins, h: S.harvests, p: S.plants, f: S.fished || 0, cn: S.cityN || 0, ou: S.outings || 0, cm: S.cityMeals || 0, hn: S.hotelNights || 0, dv: S.cart ? S.cart.deliveries : 0, by: S.buys });
  C.track = (S, sn, ty, e, d, t, a, day) => {
    if (ty === "chal_claim") return claim(S, d, t, a);
    const gain = S.coins - sn.c;
    C.bump(S, a, t, "harvest", S.harvests - sn.h); C.bump(S, a, t, "plant", S.plants - sn.p); C.bump(S, a, t, "fish", (S.fished || 0) - sn.f);
    C.bump(S, a, t, "buy", S.buys - sn.by); C.bump(S, a, t, "deliver", (S.cart ? S.cart.deliveries : 0) - sn.dv);
    C.bump(S, a, t, "visit", Math.max(0, (S.cityN || 0) - sn.cn) + Math.max(0, (S.outings || 0) - sn.ou) + ((S.cityMeals || 0) > sn.cm ? 1 : 0) + ((S.hotelNights || 0) > sn.hn ? 1 : 0));
    if (BYTYPE[ty]) C.bump(S, a, t, BYTYPE[ty], 1);
    if (SALE.has(ty) && gain > 0) C.bump(S, a, t, "sale", 1);
    if (gain > 0 && !NOINC.has(ty)) C.bump(S, a, t, "income", gain);
    if (ty === "photo_ok" && gain > 0) C.bump(S, a, t, "photo", 1);
    if (ty === "act_new" && S.act && S.act.sess[e.id]) feedPush(S, { id: "inv:" + e.id, t, a, k: "invite", c: d.kind });
    if (ty === "act_fin" && S.act) { const s = S.act.sess[d.sid]; if (s && s.paid && s.paid.t === t) { Object.keys(s.p).forEach((u) => C.bump(S, u, t, "act", 1)); feedPush(S, { id: "actfin:" + d.sid, t, a, k: "actdone", c: s.kind }); } }
  };
  function claim(S, d, t, a) {
    const R = root(S), def = DEF[d && d.id]; if (!def) return;
    const key = C.keyOf(def.sc, t); if (String(d.key) !== key || C.pick(def.sc, key).indexOf(def.id) < 0) return; // فترة غلط أو تحدي مش من تحديات الفترة
    const ck = a + "|" + def.id + "|" + key, E = C.eff(def, key); if (R.claimed[ck] || prog(S, a, def.sc, key, def.m) < E.n) return;
    R.claimed[ck] = t; S.coins += E.coins;
    const items = {}; E.items && Object.keys(def.items || {}).forEach((k) => { if (OSW.FURN[k.replace(/^fu_/, "")]) { S.inv[k] = (S.inv[k] || 0) + def.items[k]; items[k] = def.items[k]; } });
    if (def.badge && E.badge) R.badges[def.badge] = t;
    R.hist.push({ a, id: def.id, sc: def.sc, key, t, coins: E.coins, items, badge: def.badge && E.badge ? def.badge : null });
    feedPush(S, { id: "claim:" + ck, t, a, k: "claim", c: def.id, p: key });
  }

  /* ============ واجهة الاستعلام ============ */
  const S0 = () => G.state().chal || root({});
  C.list = (uid, t) => {
    uid = uid || db().uid; t = t || Date.now(); const S = G.state(), R = S.chal || root({}), out = [];
    C.SCALES.forEach(([sc]) => { const key = C.keyOf(sc, t); C.pick(sc, key).forEach((id) => {
      const def = DEF[id], E = C.eff(def, key), p = Math.min(E.n, prog(S, uid, sc, key, def.m)), ck = uid + "|" + id + "|" + key, claimed = !!R.claimed[ck];
      out.push({ def, sc, key, E, n: E.n, end: C.endOf(sc, t), p, claimed, done: p >= E.n, claimable: p >= E.n && !claimed });
    }); });
    return out;
  };
  C.claimable = (uid) => (db() && db().me ? C.list(uid).filter((x) => x.claimable).length : 0);
  C.history = (uid) => S0().hist.filter((h) => h.a === (uid || db().uid)).slice().reverse();
  C.feed = () => S0().feed.slice().reverse();
  C.badges = () => S0().badges;
  C.title = (def, key) => def.t.replace("{s}", SEAS_AR[String(key).split("-")[0]] || "").replace("{n}", key == null || key === "" ? def.n : C.eff(def, key).n);

  /* ============ النوافذ ============ */
  const left = (ms) => { const m = Math.max(0, Math.ceil(ms / 60000)); if (m >= 2880) return Math.floor(m / 1440) + " يوم"; if (m >= 60) return Math.floor(m / 60) + " س " + (m % 60) + " د"; return m + " د"; };
  const rewardTxt = (def, E) => `🪙 ${E.coins}` + (E.items ? Object.keys(def.items || {}) : []).filter((k) => OSW.FURN[k.replace(/^fu_/, "")]).map((k) => ` · 🛋️ ${esc(OSW.FURN[k.replace(/^fu_/, "")].n)}`).join("") + (def.badge && E.badge ? ` · ${BADGES[def.badge][0]} ${BADGES[def.badge][1]}` : "");
  const who = (u) => esc((ui().prof && ui().prof(u) && ui().prof(u).name) || "؟");
  const FEED_TXT = (f) => {
    const me = f.a === db().uid ? "أنت" : who(f.a), def = DEF[f.c];
    if (f.k === "done") return `✅ ${me} خلّصت تحدي: ${esc(C.title(def, f.p))}`;
    if (f.k === "claim") return `🎁 ${me} استلمت مكافأة (${esc(C.title(def, f.p))})`;
    if (f.k === "invite") return `💌 ${me} دعوت لنشاط مشترك${G && OSW.act && OSW.act.GAMES[f.c] ? ": " + OSW.act.GAMES[f.c].n : ""}`;
    if (f.k === "actdone") return `🎮 خلّصتوا نشاط مشترك${OSW.act && OSW.act.GAMES[f.c] ? ": " + OSW.act.GAMES[f.c].n : ""}`;
    return "";
  };
  G.ui.ctab = G.ui.ctab || "now";
  G.openers.challenges = () => {
    const tab = G.ui.ctab, now = Date.now(), cl = C.claimable();
    const tabs = [["now", "🎯 تحدياتي"], ["hist", "📜 السجل"], ["feed", "🔔 النشاط"]].map(([k, n]) => `<button class="btn sm ${tab === k ? "berry" : "alt"}" style="min-height:44px;flex:1" data-act="g-chal-tab" data-k="${k}">${n}</button>`).join(" ");
    let body = "";
    if (tab === "now") {
      const L = C.list();
      body = C.SCALES.map(([sc, nm, ic]) => { const rows = L.filter((x) => x.sc === sc); if (!rows.length) return "";
        return `<div class="sep"></div><b>${ic} ${nm}</b> <small class="hint">· ينتهي بعد ${left(rows[0].end - now)}</small><div class="items">${rows.map((x) => {
          const pc = Math.round((x.p / x.n) * 100), unit = METRIC_AR[x.def.m] || "";
          return `<div class="irow ${x.claimed ? "done" : ""}"><span class="ie">${x.claimed ? "✅" : x.done ? "🎁" : "🎯"}</span><div class="iname"><b>${esc(C.title(x.def, x.key))}</b><div class="progress" style="height:7px;margin:3px 0"><i style="width:${pc}%"></i></div><small>${x.p}/${x.n} ${unit} · المكافأة: ${rewardTxt(x.def, x.E)}</small></div><div class="ib">${x.claimed ? "<small>استلمت</small>" : x.claimable ? `<button class="btn sm gold" style="min-height:44px;min-width:64px" data-act="g-chal-claim" data-id="${x.def.id}" data-key="${x.key}">استلم</button>` : ""}</div></div>`; }).join("")}</div>`; }).join("");
      const bd = Object.keys(C.badges()).map((k) => BADGES[k] && `<span title="${esc(BADGES[k][1])}" style="font-size:26px">${BADGES[k][0]}</span>`).join(" ");
      if (bd) body += `<div class="sep"></div><b>🏅 أوسمتكم</b><div>${bd}</div>`;
    } else if (tab === "hist") {
      const H = C.history(); body = H.length ? `<div class="items">${H.slice(0, 40).map((h) => `<div class="irow"><span class="ie">✅</span><div class="iname"><b>${esc(C.title(DEF[h.id], h.key))}</b><small>${esc(OSW.fmtDateTime(new Date(h.t).toISOString()))} · 🪙 ${h.coins}${Object.keys(h.items).length ? " · 🛋️" : ""}${h.badge ? " · " + BADGES[h.badge][0] : ""}</small></div></div>`).join("")}</div>` : `<div class="empty"><span class="big">📜</span>لسا ما استلمت مكافآت. كملوا تحدي وبيظهر هون!</div>`;
    } else {
      const F = C.feed().slice(0, 30); body = F.length ? `<div class="items">${F.map((f) => `<div class="irow"><div class="iname"><b>${FEED_TXT(f)}</b><small>${esc(OSW.timeAgo(new Date(f.t).toISOString()))}</small></div></div>`).join("")}</div>` : `<div class="empty"><span class="big">🔔</span>ما في أحداث لسا</div>`;
    }
    ui().openModal(`<h3>🏆 التحديات${cl ? ` <span class="hint">· ${cl} جاهز للاستلام 🎁</span>` : ""}</h3><div class="row" style="gap:6px;margin:6px 0">${tabs}</div>${body}`);
    OSW.places.noRefresh = OSW.places.noRefresh || {}; OSW.places.noRefresh.challenges = false;
  };
  const baseClick = G.click;
  G.click = (a, el) => {
    if (a.indexOf("g-chal-") !== 0) return baseClick(a, el);
    if (a === "g-chal-tab") { G.ui.ctab = el.dataset.k; return OSW.places.refresh(); }
    if (a === "g-chal-claim") { const id = el.dataset.id, key = el.dataset.key; el.disabled = true;
      return G.do("chal_claim", { id, key }).then(() => { OSW.audio.sfx("fanfare"); ui().hearts("🎁", 12); ui().toast("🎁 استلمت المكافأة!", "gold"); OSW.places.refresh(); }).catch((e) => { el.disabled = false; ui().toast("⚠️ " + esc(e.message)); }); }
  };

  /* ============ إشعارات حقيقية مربوطة بأحداث الـfeed ============ */
  const shown = new Set();
  function notifyNew() {
    if (!db() || !db().me) return; const my = ui().my(); let seen = my.chalSeen;
    const F = S0().feed;
    if (seen == null) { seen = F.length ? F[F.length - 1].t : Date.now(); ui().saveMy({ chalSeen: seen }); }
    const fresh = F.filter((f) => f.t > seen && !shown.has(f.id));
    if (!fresh.length) return;
    fresh.forEach((f) => { shown.add(f.id); const txt = f.k === "done" && f.a === db().uid ? "🏆 تحدي جاهز للاستلام! افتحوا ✅ ← التحديات" : f.k === "claim" && f.a !== db().uid ? FEED_TXT(f) : ""; if (txt) ui().toast(txt, "gold", 4500); });
    ui().saveMy({ chalSeen: Math.max.apply(null, fresh.map((f) => f.t)) });
  }
  function init() { const u = ui(); if (!u || !u.db) return setTimeout(init, 800); u.db.on("change", () => setTimeout(notifyNew, 200)); setTimeout(notifyNew, 1500); }
  setTimeout(init, 1500);
})();
