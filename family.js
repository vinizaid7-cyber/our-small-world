/* الحياة المشتركة (V11): ثلاجة وطبخ، حيوانات أليفة بتتحكم فيها، ونزهات الجزيرة للاثنين.
   (نظام الأطفال انشال بالكامل بـ V11. أحداث kid_* القديمة بالسجل بتنتجاهل بدون ما تكسر الحفظ.)
   كل شي محفوظ كأحداث (entries) مثل باقي اللعبة. */
(function () {
  const OSW = window.OSW, G = OSW.game, F = (OSW.fam = {}), esc = OSW.esc, hy = Math.hypot;
  const MIN = 60000, HOUR = 3600000, DAY = 86400000, FR_CAP = 80;
  const ui = () => OSW.ui, db = () => OSW.ui.db, P = () => OSW.places, W = () => OSW.world, V = () => OSW.veh;
  const toast = (m, c) => ui().toast(m, c || "");
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const left = (ms) => { const m = Math.max(1, Math.ceil(ms / MIN)); return m >= 60 ? Math.floor(m / 60) + " س " + (m % 60) + " د" : m + " د"; };

  /* ---------- الأكل والطبخ ---------- */
  const D = (id, n, e, need, food, drink, joy) => ({ id, n, e, need, food, drink, joy, dish: 1 });
  const DISHES = (F.DISHES = {
    d_salad: D("d_salad", "سلطة خضار", "🥗", { cucumber: 1, tomato: 1 }, 18, 6, 5),
    d_omelet: D("d_omelet", "عجّة بيض", "🍳", { egg: 2 }, 26, 0, 6),
    d_sand: D("d_sand", "ساندويش جبنة", "🥪", { bread: 1, cheese: 1 }, 34, 0, 8),
    d_labneh: D("d_labneh", "صحن لبنة وخبز", "🥣", { labneh: 1, bread: 1 }, 30, 2, 7),
    d_fruit: D("d_fruit", "صحن فواكه", "🍓", { apple: 1, banana: 1, orange: 1 }, 22, 14, 9),
    d_shake: D("d_shake", "ميلك شيك موز", "🥤", { milk: 1, banana: 1 }, 16, 22, 14),
    d_pancake: D("d_pancake", "بان كيك", "🥞", { milk: 1, egg: 1, wheat: 1 }, 38, 6, 16),
    d_soup: D("d_soup", "شوربة خضار", "🍲", { carrot: 1, tomato: 1, cucumber: 1 }, 30, 14, 6),
    d_chickrice: D("d_chickrice", "دجاج وأرز", "🍗", { chicken: 1, rice: 1 }, 58, 2, 14),
    d_fishmeal: D("d_fishmeal", "سمك مقلي مع ليمون", "🐟", { fish_s: 1, lemon: 1 }, 44, 0, 12),
    d_maqluba: D("d_maqluba", "مقلوبة البيت", "🍛", { rice: 1, chicken: 1, tomato: 1, carrot: 1 }, 75, 6, 22),
    d_cake: D("d_cake", "كيكة البيت", "🍰", { wheat: 2, egg: 2, milk: 1 }, 30, 0, 28),
  });
  const itemOf = (id) => DISHES[id] || (G.ITEM && G.ITEM[id]) || null;
  const nameOf = (id) => (itemOf(id) || { n: id }).n, emojiOf = (id) => (itemOf(id) || { e: "📦" }).e;
  const val = (id) => {
    if (DISHES[id]) return DISHES[id];
    if (G.FOOD[id]) { const f = G.FOOD[id]; return { food: f.food, drink: f.drink, joy: f.joy }; }
    if (id === "milk") return { food: 12, drink: 16, joy: 2 };
    if (G.CROPS[id]) return { food: 10, drink: 6, joy: 1 };
    return null;
  };
  const storable = (id) => !!(G.FOOD[id] || G.CROPS[id] || DISHES[id] || id === "egg" || id === "milk" || id === "fish_s" || id === "fish_m");

  /* ---------- فعاليات الجزيرة الثانية والمهام ---------- */
  const A = (n, e, cost, min, joy, spot, o) => Object.assign({ n, e, cost, min, joy, spot }, o);
  const ACTS = (F.ACTS = {
    park: A("نزهة بالساحة والنافورة", "⛲", 0, 3, 16, [0, 1170, 5]),
    ice: A("بوظة عند أبو جميل", "🍦", 8, 3, 25, [14, 1175, 3]),
    vb: A("كرة طائرة على الشاطئ", "🏐", 0, 4, 22, [-45, 1200, 5]),
    sand: A("قلعة رمل", "🏰", 0, 4, 24, [-30, 1160, 4]),
    fish: A("صيد سمك على المرسى", "🎣", 0, 5, 20, [0, 1275, 3]),
    guard: A("زيارة المنقذ والبحر", "🛟", 0, 3, 18, [48, 1230, 3]),
    juice: A("عصير ببار الشاطئ", "🍹", 6, 3, 20, [40, 1192, 3]),
    picnic: A("بيكنيك عائلي (بياخد وجبة من الثلاجة)", "🧺", 0, 6, 42, [-14, 1160, 4], { dish: 1 }),
  });
  /* ---------- طي الأحداث (بيستدعيه game.js) ---------- */
  const LEGACY = { kid_born: 1, kid_drop: 1, kid_pick: 1, kid_play: 1, kid_use: 1, kid_cmd: 1, kid_act: 1, kid_help: 1 };
  F.fold = (ty, e, d, t, a, day, S, H) => {
    if (LEGACY[ty]) return true; // أحداث قديمة من نظام الأطفال: بتنتجاهل (حفظ قديم متوافق)
    const fr = S.fridge || (S.fridge = {}), add = H.add, mark = H.mark;
    const frn = () => Object.keys(fr).reduce((n, x) => n + fr[x], 0);
    const frTake = (it, q) => { fr[it] = (fr[it] || 0) - q; if (fr[it] <= 0) delete fr[it]; };
    const canCook = (dish) => Object.keys(dish.need).every((x) => (fr[x] || 0) >= dish.need[x]);
    const doCook = (dish) => { Object.keys(dish.need).forEach((x) => frTake(x, dish.need[x])); fr[dish.id] = (fr[dish.id] || 0) + 1; S.cooked = (S.cooked || 0) + 1; };
    switch (ty) {
      case "fstore": { const q = d.qty | 0, it = d.item; if (!(q >= 1) || !storable(it) || (S.inv[it] || 0) < q || frn() + q > FR_CAP) return true; add(it, -q); fr[it] = (fr[it] || 0) + q; mark(); return true; }
      case "ftake": { const q = d.qty | 0, it = d.item; if (!(q >= 1) || (fr[it] || 0) < q) return true; frTake(it, q); add(it, q); mark(); return true; }
      case "cook": { const dish = DISHES[d.dish]; if (!dish || !canCook(dish)) return true; doCook(dish); mark(); return true; }
      case "feat": {
        if (d.kid) return true; // كان لإطعام الأولاد (انشال)
        const it = d.item, src = d.src === "inv" ? S.inv : fr, v = val(it); if (!v || (src[it] || 0) < 1) return true;
        const n = S.need[a] || (S.need[a] = { food: 100, drink: 100, t, sip: 0 }), dt = Math.max(0, t - n.t);
        n.food = Math.max(0, n.food - (dt * 100) / (8 * HOUR)); n.drink = Math.max(0, n.drink - (dt * 100) / (5 * HOUR)); n.t = Math.max(n.t, t);
        n.food = Math.min(100, n.food + v.food * 1.2); n.drink = Math.min(100, n.drink + v.drink * 1.2);
        if (src === S.inv) add(it, -1); else frTake(it, 1); mark(); return true;
      }
      case "couple_act": { // نزهة للاثنين بالجزيرة الثانية
        const AC = ACTS[d.act]; if (!AC || S.coins < AC.cost) return true; const oa = (S.outAt = S.outAt || {});
        if ((oa[d.act] || 0) > t - 20 * MIN) return true;
        if (AC.dish) { const di = Object.keys(fr).find((x) => DISHES[x]); if (!di) return true; frTake(di, 1); }
        const oc = (S.outCoins = S.outCoins || {}), got = Math.min(Math.round(AC.joy / 4), Math.max(0, 40 - (oc[day] || 0)));
        oc[day] = (oc[day] || 0) + got; oa[d.act] = t; S.coins += got - AC.cost; S.outings = (S.outings || 0) + 1; mark(); return true;
      }
      case "pet_cmd": { const p = S.pets.find((x) => x.id === d.id); if (!p || !["follow", "stay", "home"].includes(d.mode)) return true; p.mode = d.mode; p.hx = d.mode === "stay" ? +d.x || 0 : null; p.hz = d.mode === "stay" ? +d.z || 0 : null; return true; }
      case "pet_name": { const p = S.pets.find((x) => x.id === d.id); if (p) p.name = String(d.name || "").trim().slice(0, 14); return true; }
    }
    return OSW.act && OSW.act.fold ? OSW.act.fold(ty, e, d, t, a, day, S, H) : false;
  };

  /* ---------- عرض الحيوانات الأليفة للعالم ثلاثي الأبعاد ---------- */
  F.pets3d = () => {
    const s = G.state(), uid = db().uid;
    return s.pets.map((p) => ({ id: p.id, kind: p.kind, owner: p.owner === uid ? "me" : "partner", mode: p.mode || "follow", hx: p.hx, hz: p.hz, label: p.name ? G.PETS[p.kind].e + " " + p.name : "" }));
  };

  /* ---------- أدوات واجهة ---------- */
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${esc(name)}</b><small>${sub || ""}</small></div><div class="ib">${btns || ""}</div></div>`;
  const meter = (l, v, c) => `<div class="mrow"><span>${l}</span><div class="mbar"><i style="width:${Math.round(v)}%;background:${c}"></i></div><b>${Math.round(v)}</b></div>`;
  const coinBar = () => `<div class="coinbar">🪙 <b>${G.state().coins}</b></div>`;
  const back = (to) => `<div class="sep"></div><button class="btn alt sm" data-act="g-fam-open" data-k="${to || "hub"}">↩️ رجوع</button>`;
  const onIsle = () => { const m = W().getMe(); return W().mode === "out" && V().onIsle(m.x, m.z); };

  /* ---------- نوافذ ---------- */
  G.openers.fridge = () => {
    const s = G.state(), fr = s.fridge || {}, total = Object.keys(fr).reduce((n, x) => n + fr[x], 0), nv = G.needOf(db().uid);
    const fi = Object.values(s.furn).find((f) => f.item === "fridge" || f.item === "fridge2"); G.ui.fridgeInst = fi ? fi.id : null;
    const rows = Object.keys(fr).filter((i) => fr[i] > 0).map((i) => {
      const v = val(i);
      return irow(emojiOf(i), nameOf(i) + " ×" + fr[i], v ? `🍞+${Math.round(v.food * 1.2)} 💧+${Math.round(v.drink * 1.2)}` : "", (v ? `<button class="btn sm gold" data-act="g-fam-eat" data-item="${i}" data-src="fridge">كُل أنا</button>` : "") + `<button class="btn sm alt" data-act="g-fam-take" data-item="${i}">طلّع</button>`);
    }).join("");
    const inv = Object.keys(s.inv).filter((i) => s.inv[i] > 0 && storable(i)).map((i) => irow(emojiOf(i), nameOf(i) + " ×" + s.inv[i], "بمخزنكم", `<button class="btn sm gold" data-act="g-fam-store" data-item="${i}" data-q="1">+1</button><button class="btn sm gold" data-act="g-fam-store" data-item="${i}" data-q="${s.inv[i]}">الكل</button>`)).join("");
    const rec = Object.values(DISHES).map((d) => {
      const ok = Object.keys(d.need).every((x) => (fr[x] || 0) >= d.need[x]), need = Object.keys(d.need).map((x) => `<span style="color:${(fr[x] || 0) >= d.need[x] ? "#2a9d8f" : "#e63946"}">${emojiOf(x)}${d.need[x]}</span>`).join(" ");
      return irow(d.e, d.n, `${need}<br>🍞+${d.food} 💧+${d.drink} 😊+${d.joy}`, `<button class="btn sm berry" data-act="g-fam-cook" data-dish="${d.id}" ${ok ? "" : "disabled"}>👩‍🍳 اطبخ</button>`);
    }).join("");
    ui().openModal(`<h3>🧊 الثلاجة (${total}/${FR_CAP})</h3>${coinBar()}${meter("🍞 شبعي", nv.food, "#f4a261")}${meter("💧 ريّي", nv.drink, "#4aa3e0")}
      <p class="hint">خزّنوا مواد من مخزنكم، واطبخوا وجبة من القائمة (بشرط المواد تكون بالثلاجة). وبتقدروا كمان تلعبوا <b>تحدي الطبخ المشترك</b> 🍳 وتاخدوا وجبات مجاناً.</p>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:6px"><button class="btn berry sm" data-act="g-act-new" data-k="cook">🍳 تحدي الطبخ المشترك</button></div>
      <b>🍽️ بالثلاجة</b><div class="items" style="margin:6px 0">${rows || '<div class="empty">الثلاجة فاضية! اشتروا أكل من سعدون وخزّنوه 🛒</div>'}</div>
      <b>📥 حط من المخزن</b><div class="items" style="margin:6px 0">${inv || '<div class="empty">ما عندكم مواد بالمخزن</div>'}</div>
      <b>👩‍🍳 وصفات</b><div class="items" style="margin:6px 0">${rec}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn alt sm" data-act="g-fam-lshopi">🧺 مواد الطبخ من سعدون</button><button class="btn alt sm" data-act="g-gotoshop">🏪 سعدون</button><button class="btn alt sm" data-act="g-fam-open" data-k="kiosk">💰 بيع وجبات</button>${fi ? '<button class="btn alt sm" data-act="g-fam-furn">🔧 نقل/بيع الثلاجة</button>' : ""}<button class="btn alt sm" data-act="g-fam-open" data-k="hub">🎮 الأنشطة</button></div>`);
  };

  G.openers.acts = () => {
    const s = G.state(), isle = onIsle(), now = Date.now(), oa = s.outAt || {};
    const hasDish = Object.keys(s.fridge || {}).some((x) => DISHES[x]);
    const rows = Object.keys(ACTS).map((i) => {
      const a = ACTS[i], wait = Math.max(0, (oa[i] || 0) + 20 * MIN - now), dis = !isle || s.coins < a.cost || (a.dish && !hasDish) || wait > 0;
      return irow(a.e, a.n, `${a.cost ? a.cost + "🪙 · " : "مجاناً · "}+${Math.round(a.joy / 4)}🪙 ذكرى${a.dish && !hasDish ? " · ❗بدها وجبة بالثلاجة" : ""}${wait > 0 ? " · ⏳ " + left(wait) : ""}`, `<button class="btn sm gold" data-act="g-fam-act" data-act2="${i}" ${dis ? "disabled" : ""}>روحوا</button>`);
    }).join("");
    ui().openModal(`<h3>🎈 نزهات الجزيرة الثانية</h3>${coinBar()}
      ${isle ? '<div class="chk" style="margin:6px 0">🏝️ أنتوا بالجزيرة! اختاروا نزهة للاثنين</div>' : '<div class="chk" style="margin:6px 0">🚗 النزهات بالجزيرة الثانية: روحوا بالسيارة (الطريق الطويل) وافتحوا هالصفحة هناك</div>'}
      <div class="items" style="margin:8px 0">${rows}</div><p class="hint">كل نزهة بترجّعلكم شوية 🪙 (حد أقصى 40 باليوم) وبتعدّ بالأهداف. للتحديات الأكبر شوفوا <b>الأنشطة المشتركة</b> 🎮.</p>${back("hub")}`);
  };

  G.openers.mypets = () => {
    const s = G.state(), uid = db().uid, MD = { follow: "🚶 يمشي وراي", stay: "📍 يوقف هون", home: "🏡 بالبيت" };
    const rows = s.pets.map((p) => {
      const PT = G.PETS[p.kind], mode = p.mode || "follow";
      return `<div class="irow" style="flex-direction:column;align-items:stretch;gap:6px"><div style="display:flex;gap:8px;align-items:center"><span class="ie">${PT.e}</span><input class="in" id="pn_${p.id}" maxlength="14" value="${esc(p.name || "")}" placeholder="اسم ${PT.n}" style="flex:1"><button class="btn sm gold" data-act="g-fam-petname" data-id="${p.id}">حفظ</button></div>
        <div class="seg" style="flex-wrap:wrap">${Object.keys(MD).map((m) => `<button class="${mode === m ? "on" : ""}" data-act="g-fam-petcmd" data-id="${p.id}" data-mode="${m}">${MD[m]}</button>`).join("")}</div><small>${p.owner === uid ? "إلك" : "عند " + esc(ui().partnerName())}</small></div>`;
    }).join("");
    ui().openModal(`<h3>🐾 حيواناتنا (${s.pets.length})</h3><p class="hint">سمّوهم وتحكموا فيهم: «يوقف هون» بيوقفه مكانك، «بالبيت» بيقعد ببيتكم (بتشوفه لما تدخل).</p><div class="items">${rows || '<div class="empty">ما في حيوانات. تبنّوا من سعدون ← 🐾 أليفة</div>'}</div>
      <button class="btn gold sm" style="margin-top:8px" data-act="g-gotoshop-pets">🐾 تبنّوا المزيد</button>${back("hub")}`);
  };

  /* ---------- النقرات ---------- */
  F.click = async (a, el) => {
    if (a.indexOf("g-fam-l") === 0 && OSW.lands) return OSW.lands.click(a, el);
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } };
    const sfx = (n) => OSW.audio && OSW.audio.sfx(n), hearts = (e, n) => ui().hearts && ui().hearts(e, n || 6), me = () => W().getMe(), st = G.ui;
    switch (a) {
      case "g-fam-open": return P().open(d.k === "family" ? "hub" : d.k);
      case "g-fam-cars": ui().closeModal(); return OSW.app.goPlace("cars");
      case "g-fam-fridge": return P().open("fridge");
      case "g-fam-furn": { const id = st.fridgeInst; if (!id) return; ui().closeModal(); st.finst = id; W().selectFurn(id); return P().open("furnitem"); }
      case "g-fam-eat": return busy(async () => { await G.do("feat", { item: d.item, src: d.src || "fridge" }); sfx("pop"); hearts(emojiOf(d.item), 6); toast(`${emojiOf(d.item)} بالهنا والشفا`); });
      case "g-fam-store": return busy(async () => { await G.do("fstore", { item: d.item, qty: +d.q }); sfx("pop"); });
      case "g-fam-take": return busy(async () => { await G.do("ftake", { item: d.item, qty: 1 }); sfx("pop"); });
      case "g-fam-cook": return busy(async () => { const D2 = DISHES[d.dish]; await G.do("cook", { dish: d.dish }); sfx("magic"); hearts(D2.e, 8); toast(`${D2.e} طبختوا ${D2.n}! صارت بالثلاجة`, "love"); });
      case "g-fam-act": {
        if (!onIsle()) return toast("🏝️ لازم تكونوا بالجزيرة الثانية (بالسيارة)");
        return busy(async () => { await G.do("couple_act", { act: d.act2 }); sfx("fanfare"); hearts(ACTS[d.act2].e, 12); toast(`${ACTS[d.act2].e} ${ACTS[d.act2].n}!`, "love"); });
      }
      case "g-fam-petname": return busy(async () => { const v = ((document.getElementById("pn_" + d.id) || {}).value || "").trim(); await G.do("pet_name", { id: d.id, name: v }); sfx("heart"); toast("🐾 انحفظ الاسم"); });
      case "g-fam-petcmd": return busy(async () => { const m = me(); await G.do("pet_cmd", { id: d.id, mode: d.mode, x: m.x, z: m.z }); sfx("pop"); toast(d.mode === "stay" ? "📍 وقّفته هون" : d.mode === "home" ? "🏡 رجع عالبيت" : "🚶 بيمشي وراك"); });
    }
  };

  /* ---------- أزرار وتركيب ---------- */
  function init() {
    const pill = document.getElementById("needPill"); if (pill) { pill.style.cursor = "pointer"; pill.addEventListener("click", () => OSW.app && OSW.app.goPlace("needs")); }
    const bx = document.querySelector(".hud-btns");
    if (bx && !document.getElementById("btnHub")) {
      const mk = (id, em, lab, act) => { const b = document.createElement("button"); b.id = id; b.className = "rbtn"; b.setAttribute("aria-label", lab); b.textContent = em; b.onclick = () => OSW.app && act(); return b; };
      bx.insertBefore(mk("btnFridge", "🧊", "الثلاجة والأكل", () => OSW.app.goPlace("fridge")), bx.firstChild);
      bx.insertBefore(mk("btnHub", "🎮", "الأنشطة المشتركة", () => OSW.app.goPlace("hub")), bx.firstChild);
      const act = mk("btnActs", "🎈", "نزهات الجزيرة", () => OSW.app.goPlace("acts")); act.hidden = true; bx.insertBefore(act, bx.firstChild);
      setInterval(() => { try { const w = W(); act.hidden = !(w && w.S && w.S.ready && w.mode === "out" && onIsle() && !(V() && V().me)); } catch (e) { /* */ } }, 1500);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
