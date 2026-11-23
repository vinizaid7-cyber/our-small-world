/* الأراضي، تطويرات المزرعة، كشك بيع الوجبات، وخريطة القرية.
   نفس مبدأ اللعبة: كل شي أحداث (entries) والحالة بتنحسب منها. */
(function () {
  const OSW = window.OSW, G = OSW.game, L = (OSW.lands = {}), esc = OSW.esc;
  const ui = () => OSW.ui, db = () => OSW.ui.db, P = () => OSW.places, W = () => OSW.world;
  const toast = (m, c) => ui().toast(m, c || "");
  const LANDS = () => OSW.EX.LANDS;

  /* ---------- تطويرات المزرعة ---------- */
  const UPS = (L.UPS = {
    soil: { n: "تربة خصبة", e: "🌱", cost: [250, 500, 1000], note: "كل مستوى: المحاصيل الجديدة بتكبر أسرع 10%" },
    barn: { n: "مخزن وإيدين أقوى", e: "🏚️", cost: [150, 300, 600], note: "كل مستوى: +1 صندوق بالإيد، و+4 بالعربة" },
    pens: { n: "حظائر أكبر", e: "🐄", cost: [200, 400, 800], note: "كل مستوى: دجاج +4، خرفان +3، أبقار +2" },
  });

  /* ---------- أسعار الوجبات للكشك (تكلفة المواد + هامش ربح) ---------- */
  const unit = (id) => { const f = G.FOOD[id], c = G.CROPS[id]; if (f) return f.price; if (c) return c.sell; return { egg: 4, milk: 11, fish_s: 6, fish_m: 16 }[id] || 5; };
  L.dishPrice = (d) => Math.round(Object.keys(d.need).reduce((n, k) => n + unit(k) * d.need[k], 0) * 1.35) + 3;

  /* ---------- مواد الطبخ (سعدون بيبيعها) ---------- */
  const ING = (L.ING = { cucumber: 8, tomato: 10, carrot: 11, wheat: 6, lemon: 22, egg: 6, milk: 14, fish_s: 9 });
  const nameE = (k) => { const it = G.ITEM[k] || { n: k, e: "📦" }; return [it.e, it.n]; };

  /* ---------- طي الأحداث ---------- */
  L.fold = (ty, e, d, t, a, day, S, H) => {
    const lands = S.lands || (S.lands = {}), up = S.up || (S.up = {}), mark = H.mark;
    if (ty === "land_buy") { const Ld = LANDS().find((x) => x.id === d.id); if (!Ld || lands[Ld.id] || S.coins < Ld.price) return true; S.coins -= Ld.price; lands[Ld.id] = { by: a, t }; mark(); return true; }
    if (ty === "land_sell") {
      const i = LANDS().findIndex((x) => x.id === d.id), Ld = LANDS()[i]; if (!Ld || !lands[Ld.id]) return true;
      for (let k = 0; k < 6; k++) if (S.plots[12 + i * 6 + k]) return true; // لازم تكون فاضية
      S.coins += Math.floor(Ld.price * 0.7); delete lands[Ld.id]; mark(); return true;
    }
    if (ty === "farm_up") { const U = UPS[d.k]; if (!U) return true; const lv = up[d.k] || 0; if (lv >= U.cost.length || S.coins < U.cost[lv]) return true; S.coins -= U.cost[lv]; up[d.k] = lv + 1; mark(); return true; }
    if (ty === "ibuy") { const pr = ING[d.id], q = Math.max(1, Math.min(20, d.q | 0)); if (!pr || S.coins < pr * q) return true; S.coins -= pr * q; H.add(d.id, q); mark(); return true; }
    if (ty === "dsell") {
      const D = OSW.fam && OSW.fam.DISHES[d.item], fr = S.fridge || {}; if (!D || (fr[d.item] || 0) < 1) return true;
      fr[d.item]--; if (fr[d.item] <= 0) delete fr[d.item]; S.coins += L.dishPrice(D); S.dsold = (S.dsold || 0) + 1; mark(); return true;
    }
    return false;
  };

  /* ---------- أدوات ---------- */
  L.landOfPlot = (i) => LANDS()[Math.floor((i - 12) / 6)].id;
  L.owned = (i) => i < 12 || !!(G.state().lands || {})[L.landOfPlot(i)];
  L.open = (id) => { G.ui.landId = id; OSW.app.goPlace("land"); };
  // أرضيات الأراضي المملوكة بتنرسم داخل شبكة المزرعة (نفس الشكل الموجود)
  L.beds = (B) => {
    const own = (G.state && G.state().lands) || {};
    LANDS().forEach((Ld, li) => { if (!own[Ld.id]) return; for (let k = 0; k < 6; k++) { const p = OSW.EX.plotPos(12 + li * 6 + k); B.box(p.x, 0.08, p.z, 4.4, 0.3, 4.4, "#6b4a30"); B.box(p.x, 0.3, p.z, 4.6, 0.08, 0.14, "#8a5a3b"); for (let j = -1; j <= 1; j++) B.box(p.x + j * 1.2, 0.38, p.z, 0.5, 0.1, 4.0, "#553820"); } });
  };
  L.syncLabels = () => {
    const w = W(); if (!w || !w.setLandLabels) return; const own = G.state().lands || {}, key = Object.keys(own).join(",");
    if (L._lk === key) return; L._lk = key;
    w.setLandLabels(LANDS().map((Ld) => ({ id: Ld.id, x: Ld.x, z: Ld.z + 10.7, act: "land:" + Ld.id, text: own[Ld.id] ? "🌾 " + Ld.n + " (أرضنا)" : "🪧 " + Ld.n + " للبيع · " + Ld.price + "🪙" })));
  };

  /* ---------- مزرعة: عرض الأرضيات + أزرار جماعية ---------- */
  L.cells = (plots, cell) => {
    const own = G.state().lands || {}; let h = plots.slice(0, 12).map((p, i) => cell(p, i)).join("");
    LANDS().forEach((Ld, li) => { if (!own[Ld.id]) return; h += `<div style="grid-column:1/-1;margin-top:6px"><small>🏞️ ${esc(Ld.n)}</small></div>`; for (let k = 0; k < 6; k++) h += cell(plots[12 + li * 6 + k], 12 + li * 6 + k); });
    return h;
  };
  L.farmBtns = () => `<div class="row" style="margin:8px 0;gap:6px;flex-wrap:wrap"><button class="btn gold sm" data-act="g-fam-lharvest">🧺 اقطف كل الجاهز</button><button class="btn gold sm" data-act="g-fam-lplant">🌱 ازرع كل الفاضي</button><button class="btn alt sm" data-act="g-fam-open" data-k="farmup">⬆️ تطويرات المزرعة</button><button class="btn alt sm" data-act="g-fam-open" data-k="lands">🏞️ سوق الأراضي</button></div>`;

  /* ---------- نوافذ ---------- */
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${esc(name)}</b><small>${sub || ""}</small></div><div class="ib">${btns || ""}</div></div>`;
  const coinBar = () => `<div class="coinbar">🪙 <b>${G.state().coins}</b></div>`;
  const back = (to) => `<div class="sep"></div><button class="btn alt sm" data-act="g-fam-open" data-k="${to}">↩️ رجوع</button>`;
  const landStat = (Ld, i) => { const s = G.state(); let g = 0, r = 0; const v = G.view(); for (let k = 0; k < 6; k++) { const p = v.plots[12 + i * 6 + k]; if (p) { g++; if (p.ripe) r++; } } return { g, r, own: !!(s.lands || {})[Ld.id] }; };

  G.openers.lands = () => {
    const s = G.state(), rows = LANDS().map((Ld, i) => { const st = landStat(Ld, i); return irow(st.own ? "🌾" : "🪧", Ld.n, st.own ? `ملككم · ${st.g}/6 مزروع${st.r ? " · 🧺 " + st.r + " جاهز" : ""}` : `للبيع · 6 أرضيات زراعة`, st.own ? `<button class="btn sm gold" data-act="g-fam-lgo" data-id="${Ld.id}">🚶 روح</button>` : `<button class="btn sm berry" data-act="g-fam-lbuy" data-id="${Ld.id}" ${s.coins < Ld.price ? "disabled" : ""}>اشتري · ${Ld.price}🪙</button>`); }).join("");
    ui().openModal(`<h3>🏞️ سوق الأراضي</h3>${coinBar()}<p class="hint">أراضي حوالين القرية (عليها لافتات 🪧). كل قطعة فيها 6 أرضيات زراعة، وأسعارها غالية بس بتوسّع مزرعتكم كتير. بتقدروا تبيعوها بـ70% لو فاضية.</p><div class="items">${rows}</div>${back("farm")}`);
  };
  G.openers.land = () => {
    const i = LANDS().findIndex((x) => x.id === G.ui.landId), Ld = LANDS()[i]; if (!Ld) return G.openers.lands();
    const st = landStat(Ld, i), s = G.state();
    ui().openModal(`<h3>🏞️ ${esc(Ld.n)}</h3>${coinBar()}
      <div class="chk" style="margin:6px 0">${st.own ? `🌾 أرضنا · ${st.g}/6 مزروع${st.r ? " · 🧺 " + st.r + " جاهز للقطف" : ""}` : `🪧 للبيع بـ ${Ld.price}🪙 · 6 أرضيات زراعة`}</div>
      <p class="hint">${st.own ? "اضغط على أي أرضية جوا السياج لتزرع أو تقطف. بتنزرع بنفس البذور والأسعار." : "اشتروها وبتصير أرضكم، وبتنفتح الأرضيات للزراعة."}</p>
      <div class="row" style="gap:6px;flex-wrap:wrap">${st.own ? `<button class="btn gold sm" data-act="g-fam-lgo" data-id="${Ld.id}">🚶 روح للأرض</button><button class="btn alt sm" data-act="g-fam-lsell" data-id="${Ld.id}" ${st.g ? "disabled" : ""}>💰 بيعها (${Math.floor(Ld.price * 0.7)}🪙)</button>` : `<button class="btn berry" data-act="g-fam-lbuy" data-id="${Ld.id}" ${s.coins < Ld.price ? "disabled" : ""}>اشتري · ${Ld.price}🪙</button>`}</div>${back("lands")}`);
  };
  G.openers.farmup = () => {
    const s = G.state(), up = s.up || {};
    const rows = Object.keys(UPS).map((k) => { const U = UPS[k], lv = up[k] || 0, max = lv >= U.cost.length; return irow(U.e, `${U.n} (مستوى ${lv}/${U.cost.length})`, U.note, max ? "<small>✅ أعلى مستوى</small>" : `<button class="btn sm gold" data-act="g-fam-lup" data-k="${k}" ${s.coins < U.cost[lv] ? "disabled" : ""}>طوّر · ${U.cost[lv]}🪙</button>`); }).join("");
    ui().openModal(`<h3>⬆️ تطويرات المزرعة</h3>${coinBar()}<div class="items">${rows}</div><p class="hint">الحد الحالي: ${G.carryMax()} صناديق بالإيد · ${G.cartMax()} بالعربة · دجاج ${G.capOf("chicken")} · خرفان ${G.capOf("sheep")} · أبقار ${G.capOf("cow")}</p>${back("farm")}`);
  };
  L.ingShop = (s) => `<p class="hint">مواد طبخ طازجة (خضار، بيض، حليب، سمك). كلها بتنحط بمخزنكم، وبعدين بتخزّنوها بالثلاجة 🧊 وبتطبخوا. وبتقدروا تزرعوها بنفسكم أرخص!</p>` +
    Object.keys(ING).map((k) => { const [e, n] = nameE(k); return irow(e, n, `عندكم ${s.inv[k] || 0}`, `<button class="btn sm gold" data-act="g-fam-libuy" data-id="${k}" data-q="1" ${s.coins < ING[k] ? "disabled" : ""}>1 · ${ING[k]}🪙</button><button class="btn sm gold" data-act="g-fam-libuy" data-id="${k}" data-q="5" ${s.coins < ING[k] * 5 ? "disabled" : ""}>5 · ${ING[k] * 5}🪙</button>`); }).join("");
  G.openers.prices = () => {
    const day = G.today(), C = G.CROPS, tag = (p) => (p >= 12 ? "🔥 مرتفع — بيعوا اليوم" : p <= -8 ? "❄️ منخفض — استنوا" : "😐 عادي"), arr = (a, b) => (a > b ? "▲" : a < b ? "▼" : "•");
    const rows = Object.keys(C).map((k) => { const base = C[k].sell, now = G.priceOf(k, day), tom = G.priceOf(k, day + 1), yes = G.priceOf(k, day - 1); return { k, base, now, tom, yes, pct: Math.round((now / base - 1) * 100) }; }).sort((a, b) => b.pct - a.pct);
    const crop = rows.map((r) => irow(C[r.k].e, C[r.k].n, `اليوم <b>${r.now}🪙</b> (الأساسي ${r.base}) ${arr(r.now, r.yes)} عن مبارح · بكرة ${arr(r.tom, r.now)} ${r.tom}🪙`, `<small>${tag(r.pct)}<br>${r.pct > 0 ? "+" : ""}${r.pct}%</small>`)).join("");
    const hi = rows.filter((r) => r.pct >= 12).map((r) => C[r.k].e).join(" "), lo = rows.filter((r) => r.pct <= -8).map((r) => C[r.k].e).join(" ");
    const food = Object.keys(G.FOOD).map((k) => { const f = G.FOOD[k]; return `<span class="tag">${f.e} ${esc(f.n)} ${f.price}🪙</span>`; }).join(" ");
    const ing = Object.keys(ING).map((k) => { const [e, n] = nameE(k); return `<span class="tag">${e} ${esc(n)} ${ING[k]}🪙</span>`; }).join(" ");
    const prod = Object.keys(G.PRODUCE).map((k) => { const p = G.PRODUCE[k]; return `<span class="tag">${p.e} ${esc(p.n)} ${p.sell}🪙</span>`; }).join(" ");
    const dishes = Object.values(OSW.fam.DISHES).map((d) => `<span class="tag">${d.e} ${esc(d.n)} ${L.dishPrice(d)}🪙</span>`).join(" ");
    ui().openModal(`<h3>📈 لائحة أسعار سعدون</h3>${coinBar()}
      <div class="chk" style="margin:6px 0">🔥 مرتفعة اليوم: ${hi || "ولا واحد"} · ❄️ منخفضة: ${lo || "ولا واحد"}</div>
      <b>🌾 المحاصيل (سعر البيع اليوم، بيتغير كل يوم)</b><div class="items" style="margin:6px 0">${crop}</div><p class="hint">العربة بتنباع بزيادة 15%، وببسطة المزرعة بنقص 20%.</p>
      <b>🧺 مواد الطبخ (شراء)</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${ing}</div>
      <b>🍞 أكل وشرب (شراء، أسعار ثابتة)</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${food}</div>
      <b>🥚 منتجات الحيوانات والصيد (بيع)</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${prod}</div>
      <b>🍽️ الوجبات (كشك)</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${dishes}</div>
      <div class="row" style="gap:6px;margin-top:8px"><button class="btn gold sm" data-act="g-gotoshop">🏪 رجوع لسعدون</button></div>`);
  };
  G.openers.kiosk = () => {
    const s = G.state(), fr = s.fridge || {}, D = OSW.fam.DISHES, items = Object.keys(fr).filter((k) => D[k] && fr[k] > 0);
    const rows = items.map((k) => irow(D[k].e, `${D[k].n} ×${fr[k]}`, `سعر البيع ${L.dishPrice(D[k])}🪙`, `<button class="btn sm gold" data-act="g-fam-ldsell" data-item="${k}" data-q="1">بيع 1</button><button class="btn sm gold" data-act="g-fam-ldsell" data-item="${k}" data-q="${fr[k]}">الكل</button>`)).join("");
    ui().openModal(`<h3>💰 كشك الوجبات</h3>${coinBar()}<p class="hint">بيعوا الوجبات اللي طبختوها من الثلاجة للناس بالقرية. الربح بيزيد لما تزرعوا المواد بأنفسكم 🌾</p><div class="items">${rows || '<div class="empty">ما في وجبات مطبوخة بالثلاجة. اطبخوا أول 🍳</div>'}</div>${back("fridge")}`);
  };
  const MAP = [
    ["🏡 الساحة والبيت", [["home", "🏡", "بيتنا"], ["fountain", "⛲", "النافورة"], ["plaza", "🎠", "الساحة"], ["tree", "🌳", "الشجرة الكبيرة"], ["flowers", "🌹", "ورد الحب"], ["garden", "🌷", "الحديقة"], ["lighthouse", "🗼", "المنارة"]]],
    ["🛒 الخدمات", [["shop", "🏪", "بقالة سعدون"], ["orders", "📋", "طلبات الناس"], ["prices", "📈", "لائحة الأسعار"], ["cars", "🚗", "معرض السيارات"], ["gate", "⚙️", "بوابة القرية"]]],
    ["🌾 المزرعة والأراضي", [["farm", "🌾", "المزرعة"], ["cart", "🛒", "عربة المزرعة"], ["pens", "🐄", "الحظائر"], ["lands", "🏞️", "سوق الأراضي"], ["farmup", "⬆️", "تطويرات المزرعة"]]],
    ["🏝️ الجزيرة الثانية (بالسيارة)", [["butcher", "🥩", "ملحمة أبو سليمان"], ["boutique", "👗", "محل الأناقة"], ["fishing", "🎣", "صيد السمك"], ["acts", "🎈", "نزهات الجزيرة"]]],
    ["🎮 حياتنا المشتركة", [["hub", "🎮", "الأنشطة المشتركة"], ["city", "🏙️", "دليل المدينة"], ["designs", "🛋️", "تصاميم البيت"], ["fridge", "🧊", "الثلاجة والطبخ"], ["mypets", "🐾", "حيواناتنا"], ["kiosk", "💰", "كشك الوجبات"]]],
  ];
  G.openers.map = () => {
    ui().openModal(`<h3>🗺️ خريطة القرية</h3><p class="hint">كل مكان بالقرية منظّم هون. اضغط عشان تروح له أو تفتحه مباشرة.</p>` + MAP.map(([t, list]) => `<b>${t}</b><div class="seg" style="margin:6px 0 10px;flex-wrap:wrap">${list.map(([id, e, n]) => `<button data-act="g-fam-lmap" data-id="${id}">${e} ${n}</button>`).join("")}</div>`).join(""));
  };

  /* ---------- النقرات ---------- */
  L.click = async (a, el) => {
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } }, sfx = (n) => OSW.audio && OSW.audio.sfx(n), P_ = P();
    switch (a) {
      case "g-fam-lbuy": { const Ld = LANDS().find((x) => x.id === d.id); return busy(async () => { await G.do("land_buy", { id: d.id }); sfx("fanfare"); ui().hearts && ui().hearts("🏞️", 14); toast(`🏞️ مبروك! ${Ld.n} صارت أرضكم`, "gold"); L.syncLabels(); G.sync3d(); }); }
      case "g-fam-libuy": return busy(async () => { await G.do("ibuy", { id: d.id, q: +d.q }); sfx("coin"); const [e, n] = nameE(d.id); toast(`${e} اشتريت ${d.q} ${n}`); });
      case "g-fam-lhome": { const n = OSW.veh.sendHome(); return toast(n ? `🏠 ${n} سيارة رجعت لكراج البيت` : "كل السيارات بالكراج ✅"); }
      case "g-fam-lshopi": G.ui.tab = "ing"; ui().closeModal(); return OSW.app.goPlace("shop");
      case "g-fam-lsell": return busy(async () => { await G.do("land_sell", { id: d.id }); sfx("coin"); toast("💰 انباعت الأرض"); L._lk = null; L.syncLabels(); G.sync3d(); P_.open("lands"); });
      case "g-fam-lgo": { const p = W().S.poi["land:" + d.id]; ui().closeModal(); if (W().mode !== "out") return toast("اطلعوا من البيت أول 🚪"); if (W()._int.me.veh) return toast("🚪 انزلوا من السيارة أول"); if (p) W().goTo(p.x, p.z); return; }
      case "g-fam-lup": return busy(async () => { await G.do("farm_up", { k: d.k }); sfx("fanfare"); ui().hearts && ui().hearts(UPS[d.k].e, 10); toast(`${UPS[d.k].e} تطوّرت المزرعة!`, "gold"); });
      case "g-fam-ldsell": return busy(async () => { await G.do("dsell", { item: d.item }); for (let i = 1; i < +d.q; i++) await G.do("dsell", { item: d.item }); sfx("coin"); toast("🪙 انباعت!"); });
      case "g-fam-lmap": { const id = d.id; ui().closeModal(); if (["lands", "farmup", "kiosk", "mypets", "acts", "hub", "city", "designs", "fridge"].includes(id)) return OSW.app.goPlace(id); return OSW.app.goPlace(id); }
      case "g-fam-lharvest": return busy(async () => {
        const v = G.view(), s = G.state(); let have = G.carryOf(db().uid).length, n = 0; const max = G.carryMax();
        for (let i = 0; i < 48 && have < max; i++) { const p = v.plots[i]; if (p && p.ripe && L.owned(i)) { await G.do("harvest", { plot: i }); have++; n++; } }
        if (!n) return toast(have >= max ? "إيدك مليانة 📦 حطّ الصناديق بالمخزن أو العربة" : "ما في شي جاهز للقطف حالياً 🌱"); sfx("coin"); toast(`📦 قطفت ${n} صناديق (${have}/${max})`);
      });
      case "g-fam-lplant": return busy(async () => {
        const v = G.view(), crop = G.ui.last, c = G.CROPS[crop], fert = !!G.ui.fert; let n = 0, coins = G.state().coins;
        for (let i = 0; i < 48; i++) { if (v.plots[i] || !L.owned(i) || coins < c.seed) continue; await G.do("plant", { plot: i, crop, fert: fert && G.has("fert") }); coins -= c.seed; n++; }
        if (!n) return toast(coins < c.seed ? "ما معك مصاري للبذور 🪙" : "كل الأرضيات مزروعة 🌿"); sfx("magic"); toast(`${c.e} زرعت ${n} أرضيات`);
      });
    }
  };

  /* ---------- زر الخريطة ---------- */
  function init() {
    const bx = document.querySelector(".hud-btns");
    if (bx && !document.getElementById("btnMap")) { const b = document.createElement("button"); b.id = "btnMap"; b.className = "rbtn"; b.setAttribute("aria-label", "خريطة القرية"); b.textContent = "🗺️"; b.onclick = () => OSW.app && OSW.app.goPlace("map"); bx.insertBefore(b, bx.firstChild); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
