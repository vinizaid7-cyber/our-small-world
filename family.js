/* العيلة: أولاد بيكبروا (شهر)، فعاليات الجزيرة، ثلاجة وطبخ، حيوانات أليفة بتتحكم فيها، مستلزمات، وأولاد بالسيارة.
   كل شي محفوظ كأحداث (entries) مثل باقي اللعبة، وكل المنطق هون عشان ما نخرّب الملفات الثانية. */
(function () {
  const OSW = window.OSW, G = OSW.game, F = (OSW.fam = {}), esc = OSW.esc, hy = Math.hypot;
  const MIN = 60000, HOUR = 3600000, DAY = 86400000, BABY_END = 5 * DAY, TEEN = 30 * DAY, FR_CAP = 80;
  const ui = () => OSW.ui, db = () => OSW.ui.db, P = () => OSW.places, W = () => OSW.world, V = () => OSW.veh;
  const toast = (m, c) => ui().toast(m, c || "");
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- الأكل والطبخ ---------- */
  const D = (id, n, e, need, food, drink, joy, baby) => ({ id, n, e, need, food, drink, joy, baby: !!baby, dish: 1 });
  const DISHES = (F.DISHES = {
    d_salad: D("d_salad", "سلطة خضار", "🥗", { cucumber: 1, tomato: 1 }, 18, 6, 5),
    d_omelet: D("d_omelet", "عجّة بيض", "🍳", { egg: 2 }, 26, 0, 6),
    d_sand: D("d_sand", "ساندويش جبنة", "🥪", { bread: 1, cheese: 1 }, 34, 0, 8),
    d_labneh: D("d_labneh", "صحن لبنة وخبز", "🥣", { labneh: 1, bread: 1 }, 30, 2, 7),
    d_fruit: D("d_fruit", "صحن فواكه", "🍓", { apple: 1, banana: 1, orange: 1 }, 22, 14, 9, 1),
    d_puree: D("d_puree", "هريس للرضيع", "🥕", { carrot: 1, apple: 1 }, 20, 6, 6, 1),
    d_shake: D("d_shake", "ميلك شيك موز", "🥤", { milk: 1, banana: 1 }, 16, 22, 14, 1),
    d_pancake: D("d_pancake", "بان كيك", "🥞", { milk: 1, egg: 1, wheat: 1 }, 38, 6, 16),
    d_soup: D("d_soup", "شوربة خضار", "🍲", { carrot: 1, tomato: 1, cucumber: 1 }, 30, 14, 6),
    d_chickrice: D("d_chickrice", "دجاج وأرز", "🍗", { chicken: 1, rice: 1 }, 58, 2, 14),
    d_fishmeal: D("d_fishmeal", "سمك مقلي مع ليمون", "🐟", { fish_s: 1, lemon: 1 }, 44, 0, 12),
    d_maqluba: D("d_maqluba", "مقلوبة البيت", "🍛", { rice: 1, chicken: 1, tomato: 1, carrot: 1 }, 75, 6, 22),
    d_cake: D("d_cake", "كيكة البيت", "🍰", { wheat: 2, egg: 2, milk: 1 }, 30, 0, 28),
  });
  const BABY_RAW = { milk: 1, laban: 1, banana: 1, apple: 1 };
  const itemOf = (id) => DISHES[id] || (G.ITEM && G.ITEM[id]) || KIDITEMS[id] || null;
  const nameOf = (id) => (itemOf(id) || { n: id }).n, emojiOf = (id) => (itemOf(id) || { e: "📦" }).e;
  const val = (id) => {
    if (DISHES[id]) return DISHES[id];
    if (G.FOOD[id]) { const f = G.FOOD[id]; return { food: f.food, drink: f.drink, joy: f.joy, baby: !!BABY_RAW[id] }; }
    if (id === "milk") return { food: 12, drink: 16, joy: 2, baby: true };
    if (G.CROPS[id]) return { food: 10, drink: 6, joy: 1, baby: false };
    return null;
  };
  const storable = (id) => !!(G.FOOD[id] || G.CROPS[id] || DISHES[id] || id === "egg" || id === "milk" || id === "fish_s" || id === "fish_m");

  /* ---------- مستلزمات الأولاد ---------- */
  const K = (n, e, price, o) => Object.assign({ n, e, price, kid: 1 }, o);
  const KIDITEMS = (F.KIDITEMS = {
    k_bottle: K("رضّاعة حليب", "🍼", 4, { food: 40, joy: 3, note: "للرضّع وغيرهم" }),
    k_snack: K("سناك أطفال", "🍪", 4, { food: 18, joy: 6, note: "شبّعه بسرعة" }),
    k_juice: K("عصير أطفال", "🧃", 3, { food: 8, joy: 4, note: "منعش" }),
    k_diaper: K("حفّاضات", "🧷", 5, { food: 0, joy: 8, note: "ارتياح ونظافة" }),
    k_book: K("قصص أطفال", "📚", 12, { food: 0, joy: 10, note: "قصة قبل النوم" }),
    k_color: K("ألوان ودفتر رسم", "🖍️", 14, { food: 0, joy: 12, note: "يرسم ويفرح" }),
    k_ball: K("كرة", "⚽", 18, { gear: 1, note: "لعبة دايمة: كل لعب بيفرّحه أكتر" }),
    k_blocks: K("مكعّبات", "🧱", 22, { gear: 1, note: "لعبة دايمة" }),
    k_doll: K("دمية", "🪆", 24, { gear: 1, note: "لعبة دايمة" }),
    k_scooter: K("سكوتر", "🛴", 45, { gear: 1, note: "لعبة دايمة" }),
    k_bike: K("دراجة", "🚲", 60, { gear: 1, note: "لعبة دايمة" }),
    k_sand: K("عدّة قلعة رمل", "🏖️", 16, { gear: 1, note: "لعبة دايمة للشاطئ" }),
  });
  Object.keys(KIDITEMS).forEach((k) => { G.ITEM[k] = KIDITEMS[k]; });

  /* ---------- فعاليات الجزيرة الثانية والمهام ---------- */
  const A = (n, e, cost, min, joy, spot, o) => Object.assign({ n, e, cost, min, joy, spot }, o);
  const ACTS = (F.ACTS = {
    park: A("نزهة بالساحة والنافورة", "⛲", 0, 3, 16, [0, 1170, 5]),
    ice: A("بوظة عند أبو جميل", "🍦", 8, 3, 25, [14, 1175, 3]),
    vb: A("كرة طائرة على الشاطئ", "🏐", 0, 4, 22, [-45, 1200, 5]),
    sand: A("قلعة رمل", "🏰", 0, 4, 24, [-30, 1240, 3.5]),
    fish: A("صيد سمك على المرسى", "🎣", 0, 5, 20, [0, 1262, 3]),
    guard: A("زيارة المنقذ والبحر", "🛟", 0, 3, 18, [48, 1230, 3]),
    juice: A("عصير ببار الشاطئ", "🍹", 6, 3, 20, [40, 1192, 3]),
    picnic: A("بيكنيك عائلي (بياخد وجبة من الثلاجة)", "🧺", 0, 6, 42, [-14, 1160, 4], { dish: 1 }),
  });
  const CHORES = (F.CHORES = {
    eggs: { n: "يجمع البيض", e: "🥚", cd: 25 * MIN, note: "+2 بيض (لازم عندكم دجاج)" },
    water: { n: "يسقي الورد", e: "💦", cd: 25 * MIN, note: "+5🪙" },
    cook: { n: "يطبخ وجبة من الثلاجة", e: "👩‍🍳", cd: 25 * MIN, note: "بيطبخ أول وجبة مواده موجودة" },
    market: { n: "يروح عالسوق", e: "🛒", cd: 40 * MIN, note: "+10🪙" },
    tidy: { n: "يرتّب البيت", e: "🧹", cd: 25 * MIN, note: "+3🪙 وبيفرّح إخوانه" },
  });
  const CMDS = (F.CMDS = { free: ["🎈", "يلعب براحته"], follow: ["🚶", "يمشي وراي"], car: ["🚗", "معنا بالسيارة"], home: ["🏡", "يقعد ببيت"], sleep: ["😴", "ينام بغرفته"], stay: ["📍", "يوقف هون"] });

  /* ---------- حالة الأولاد ---------- */
  const KD = (k, t) => {
    if (k.mt == null) { k.food = 85; k.joy = 85; k.mt = k.born || t; k.bond = {}; k.actAt = {}; k.chAt = {}; k.lp = 0; k.fun = 0; }
    const dt = Math.max(0, t - k.mt); k.food = Math.max(8, k.food - (dt * 100) / (9 * HOUR)); k.joy = Math.max(8, k.joy - (dt * 100) / (12 * HOUR)); k.mt = Math.max(k.mt, t); return k;
  };
  const snap = (k, now) => {
    const f0 = k.mt == null ? 85 : k.food, j0 = k.mt == null ? 85 : k.joy, from = k.mt == null ? k.born : k.mt, dt = Math.max(0, now - from);
    return { food: Math.max(8, f0 - (dt * 100) / (9 * HOUR)), joy: Math.max(8, j0 - (dt * 100) / (12 * HOUR)) };
  };
  const gearBonus = (S) => Math.min(12, 3 * Object.keys(S.gear || {}).length);

  /* ---------- طي الأحداث (بيستدعيه game.js) ---------- */
  F.fold = (ty, e, d, t, a, day, S, H) => {
    const fr = S.fridge || (S.fridge = {}), gear = S.gear || (S.gear = {}), add = H.add, mark = H.mark;
    const frn = () => Object.keys(fr).reduce((n, x) => n + fr[x], 0), kid = (id) => S.kids.find((x) => x.id === id);
    const frTake = (it, q) => { fr[it] = (fr[it] || 0) - q; if (fr[it] <= 0) delete fr[it]; };
    const canCook = (dish) => Object.keys(dish.need).every((x) => (fr[x] || 0) >= dish.need[x]);
    const doCook = (dish) => { Object.keys(dish.need).forEach((x) => frTake(x, dish.need[x])); fr[dish.id] = (fr[dish.id] || 0) + 1; S.cooked = (S.cooked || 0) + 1; };
    switch (ty) {
      case "fstore": { const q = d.qty | 0, it = d.item; if (!(q >= 1) || !storable(it) || (S.inv[it] || 0) < q || frn() + q > FR_CAP) return true; add(it, -q); fr[it] = (fr[it] || 0) + q; mark(); return true; }
      case "ftake": { const q = d.qty | 0, it = d.item; if (!(q >= 1) || (fr[it] || 0) < q) return true; frTake(it, q); add(it, q); mark(); return true; }
      case "cook": { const dish = DISHES[d.dish]; if (!dish || !canCook(dish)) return true; doCook(dish); mark(); return true; }
      case "feat": {
        const it = d.item, src = d.src === "inv" ? S.inv : fr, v = val(it); if (!v || (src[it] || 0) < 1) return true;
        if (d.kid) {
          const k = kid(d.kid); if (!k) return true; if (t - k.born < BABY_END && !v.baby) return true;
          KD(k, t); k.food = Math.min(100, k.food + v.food * 1.3 + v.drink * 0.3); k.joy = Math.min(100, k.joy + v.joy);
        } else {
          const n = S.need[a] || (S.need[a] = { food: 100, drink: 100, t, sip: 0 }), dt = Math.max(0, t - n.t);
          n.food = Math.max(0, n.food - (dt * 100) / (8 * HOUR)); n.drink = Math.max(0, n.drink - (dt * 100) / (5 * HOUR)); n.t = Math.max(n.t, t);
          n.food = Math.min(100, n.food + v.food * 1.2); n.drink = Math.min(100, n.drink + v.drink * 1.2);
        }
        if (src === S.inv) add(it, -1); else frTake(it, 1); mark(); return true;
      }
      case "kid_play": {
        const k = kid(d.id); if (!k) return true; KD(k, t); if (t - (k.lp || 0) < 45000) return true; k.lp = t;
        let g = 12 + gearBonus(S); if (d.pet && S.pets.find((x) => x.id === d.pet)) { g += 10; k.bond[d.pet] = (k.bond[d.pet] || 0) + 1; }
        k.joy = Math.min(100, k.joy + g); k.fun++; mark(); return true;
      }
      case "kid_use": {
        const k = kid(d.id), it = KIDITEMS[d.item]; if (!k || !it || (S.inv[d.item] || 0) < 1) return true; KD(k, t);
        if (it.gear) { if (gear[d.item]) return true; gear[d.item] = 1; k.joy = Math.min(100, k.joy + 15); }
        else { k.food = Math.min(100, k.food + it.food); k.joy = Math.min(100, k.joy + it.joy); }
        add(d.item, -1); mark(); return true;
      }
      case "kid_cmd": { const k = kid(d.id); if (!k || !CMDS[d.cmd]) return true; k.cmd = d.cmd; k.cx = +d.x || 0; k.cz = +d.z || 0; k.ct = t; return true; }
      case "kid_act": {
        const AC = ACTS[d.act]; if (!AC || !Array.isArray(d.ids)) return true;
        const ok = d.ids.slice(0, 6).map(kid).filter((k) => k && k.at === "home" && t - k.born >= BABY_END && !(k.act && t < k.act.until) && !(KD(k, t).actAt[d.act] > t - 20 * MIN));
        if (!ok.length || S.coins < AC.cost) return true;
        if (AC.dish) { const di = Object.keys(fr).find((x) => DISHES[x]); if (!di) return true; frTake(di, 1); }
        S.coins -= AC.cost; const gb = gearBonus(S);
        ok.forEach((k) => { k.act = { id: d.act, t, until: t + AC.min * MIN }; k.actAt[d.act] = t; k.joy = Math.min(100, k.joy + AC.joy + gb); k.fun++; });
        S.outings = (S.outings || 0) + 1; mark(); return true;
      }
      case "kid_help": {
        const k = kid(d.id), C = CHORES[d.task]; if (!k || !C || t - k.born < TEEN) return true; KD(k, t);
        if (k.food < 15 || (k.chAt[d.task] || 0) > t - C.cd) return true; k.chAt[d.task] = t; k.food = Math.max(8, k.food - 6);
        if (d.task === "eggs") { if (S.animals.some((x) => x.kind === "chicken")) add("egg", 2); }
        else if (d.task === "water") S.coins += 5;
        else if (d.task === "cook") { const dish = Object.values(DISHES).find(canCook); if (dish) doCook(dish); }
        else if (d.task === "market") S.coins += 10;
        else if (d.task === "tidy") { S.coins += 3; S.kids.forEach((x) => { KD(x, t); x.joy = Math.min(100, x.joy + 4); }); }
        S.helped = (S.helped || 0) + 1; mark(); return true;
      }
      case "pet_cmd": { const p = S.pets.find((x) => x.id === d.id); if (!p || !["follow", "stay", "home"].includes(d.mode)) return true; p.mode = d.mode; p.hx = d.mode === "stay" ? +d.x || 0 : null; p.hz = d.mode === "stay" ? +d.z || 0 : null; return true; }
      case "pet_name": { const p = S.pets.find((x) => x.id === d.id); if (p) p.name = String(d.name || "").trim().slice(0, 14); return true; }
    }
    return false;
  };

  /* ---------- عرض الأولاد والحيوانات للعالم ثلاثي الأبعاد ---------- */
  F.kidsView = () => {
    const now = Date.now(), night = !!(W() && (W().night || 0) > 0.6);
    return G.state().kids.map((k) => {
      const age = now - k.born, stage = age < BABY_END ? "baby" : age < TEEN ? "child" : "teen", m = snap(k, now), acting = k.act && now < k.act.until;
      const loc = acting ? "act:" + k.act.id : k.at, cmd = k.cmd || "free";
      // بالليل (أو لما تقوله ينام) بينام بغرفة الأولاد، و«يقعد ببيت» بيدخل البيت
      const sleeping = loc === "home" && (cmd === "sleep" || (night && (cmd === "free" || cmd === "home"))), indoors = loc === "home" && (sleeping || cmd === "home");
      return Object.assign({}, k, { stage, ageDays: Math.floor(age / DAY), grade: Math.min(6, Math.floor((k.xp || 0) / 3)), growLeft: stage === "baby" ? BABY_END - age : stage === "child" ? TEEN - age : 0,
        schoolLeft: k.at === "school" ? Math.max(0, 300000 - (now - k.since)) : 0, rewardedToday: k.lastReward === G.today(), food: m.food, joy: m.joy, loc, actLeft: acting ? k.act.until - now : 0, cmd, sleeping, indoors });
    });
  };
  G.kidsView = F.kidsView;
  const roamOf = (k) => (k.loc === "school" ? [0, 1216, 6.5] : k.loc.indexOf("act:") === 0 ? ACTS[k.loc.slice(4)].spot : [6, -4.5, k.stage === "baby" ? 1.6 : 3.8]);
  F.riders = () => {
    const v = V(); if (!v || !v.me) return [];
    const seats = (v.CARS[v.me.car].seats || 2) - 2; if (seats <= 0) return [];
    return F.kidsView().filter((k) => k.cmd === "car" && k.loc === "home").slice(0, seats);
  };
  F.kidsIn = () => F.kidsView().filter((k) => k.indoors).map((k) => ({ id: k.id, name: k.name, g: k.g, stage: k.stage, sleeping: k.sleeping }));
  F.kids3d = () => { const ride = F.riders().map((k) => k.id); return F.kidsView().filter((k) => ride.indexOf(k.id) < 0 && !k.indoors).map((k) => ({ id: k.id, name: k.name, g: k.g, stage: k.stage, at: k.loc, roam: roamOf(k) })); };
  F.pets3d = () => {
    const s = G.state(), uid = db().uid;
    return s.pets.map((p) => ({ id: p.id, kind: p.kind, owner: p.owner === uid ? "me" : "partner", mode: p.mode || "follow", hx: p.hx, hz: p.hz, label: p.name ? G.PETS[p.kind].e + " " + p.name : "" }));
  };
  const COLS = ["#ff7aa8", "#4dabf7", "#7ac74f", "#ffb347", "#b565b0", "#e5484d"], HAIRS = ["#2a1d12", "#6b4423", "#1b1b1b", "#a0522d"];
  const chCache = {};
  F.drawRiders = (a, t) => {
    if (!(a.drv === "me" || a.pas === "me")) return;
    const r = F.riders(); if (!r.length) return; const seats = V().seats(a.car).slice(2), s = Math.sin(a.h), co = Math.cos(a.h);
    r.forEach((k, i) => {
      const S = seats[i]; if (!S) return; let h = 0; for (const c of String(k.id)) h += c.charCodeAt(0); const girl = k.g === "girl", key = k.id + k.stage;
      if (!chCache[key]) chCache[key] = OSW.makeChar({ gender: k.g, color: COLS[h % COLS.length], hair: HAIRS[h % HAIRS.length], hairStyle: girl ? "ponytail" : "short", pants: girl ? undefined : "#2f6fb5", scale: 1 });
      const sc = k.stage === "baby" ? 0.34 : k.stage === "child" ? 0.5 : 0.64;
      OSW.drawChar(chCache[key], a.x + S.x * co + S.z * s, a.z - S.x * s + S.z * co, a.h, 0, 0, t, 1, null, sc, S.y - 0.08);
    });
  };

  /* ---------- أدوات واجهة ---------- */
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${esc(name)}</b><small>${sub || ""}</small></div><div class="ib">${btns || ""}</div></div>`;
  const meter = (l, v, c) => `<div class="mrow"><span>${l}</span><div class="mbar"><i style="width:${Math.round(v)}%;background:${c}"></i></div><b>${Math.round(v)}</b></div>`;
  const coinBar = () => `<div class="coinbar">🪙 <b>${G.state().coins}</b></div>`;
  const back = (to) => `<div class="sep"></div><button class="btn alt sm" data-act="g-fam-open" data-k="${to || "family"}">↩️ رجوع</button>`;
  const left = (ms) => { const m = Math.max(1, Math.ceil(ms / MIN)); return m >= 1440 ? Math.floor(m / 1440) + " يوم" : m >= 60 ? Math.floor(m / 60) + " س " + (m % 60) + " د" : m + " د"; };
  const stageTxt = (k) => (k.stage === "baby" ? `👶 رضيع · بيصير ولد بعد ${left(k.growLeft)}` : k.stage === "child" ? `🧒 ولد (يوم ${k.ageDays}) · بيصير شاب/صبية بعد ${left(k.growLeft)}` : `🧑 كبر! بيساعدكم بالبيت (يوم ${k.ageDays})`);
  const kidEm = (k) => (k.stage === "teen" ? (k.g === "girl" ? "👩" : "👨") : k.g === "girl" ? "👧" : "👦");
  const onIsle = () => { const m = W().getMe(); return W().mode === "out" && V().onIsle(m.x, m.z); };

  /* ---------- نوافذ ---------- */
  G.openers.family = () => {
    const ks = F.kidsView(), s = G.state(), kg = G.ui.kidg || "boy", cap = 4;
    const rows = ks.map((k) => irow(kidEm(k), k.name, stageTxt(k) + `<br>🍽️ ${Math.round(k.food)} · 😊 ${Math.round(k.joy)}` + (k.loc.indexOf("act:") === 0 ? ` · ${ACTS[k.loc.slice(4)].e} بالفعالية` : k.loc === "school" ? " · 🏫 بالمدرسة" : ""), `<button class="btn sm gold" data-act="g-fam-kid" data-id="${k.id}">🎛️ تحكم</button>`)).join("");
    const form = ks.length < cap ? `<b>👶 جيبوا طفل جديد</b><p class="hint">بـ200🪙. بيكبر بالوقت الحقيقي: رضيع 5 أيام، ولد لحد 30 يوم، وبعدها بيصير شاب/صبية وبيساعدكم 🧑‍🍳 (لحد ${cap} أولاد، والسيارة بتتسع لـ6)</p>
      <input class="in" id="kidName" maxlength="12" placeholder="اسم الطفل" style="margin-bottom:8px">
      <div class="seg" style="margin-bottom:8px"><button class="${kg === "boy" ? "on" : ""}" data-act="g-kidg" data-g="boy">👦 ولد</button><button class="${kg === "girl" ? "on" : ""}" data-act="g-kidg" data-g="girl">👧 بنت</button></div>
      <button class="btn berry" style="width:100%" data-act="g-kidborn" ${s.coins < 200 ? "disabled" : ""}>👶 جيب الطفل (200🪙)</button>` : `<p class="hint">عيلتكم كاملة 💞 (${cap} أولاد)</p>`;
    ui().openModal(`<h3>👨‍👩‍👧 عيلتنا</h3>${coinBar()}<div class="items" style="margin:8px 0">${rows || '<div class="empty">لسا ما عندكم أولاد 🍼</div>'}</div>${form}
      <div class="sep"></div><div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn alt sm" data-act="g-fam-open" data-k="acts">🎈 فعاليات الجزيرة</button><button class="btn alt sm" data-act="g-fam-open" data-k="fridge">🧊 الثلاجة</button><button class="btn alt sm" data-act="g-fam-open" data-k="mypets">🐾 حيواناتنا</button><button class="btn alt sm" data-act="g-fam-shop">🛍️ مستلزمات الأولاد</button><button class="btn alt sm" data-act="g-gotoschool">🏫 المدرسة</button><button class="btn alt sm" data-act="g-fam-cars">🚗 سياراتنا</button><button class="btn alt sm" data-act="g-fam-lhome">🏠 كراج البيت (رجّع السيارات)</button><button class="btn alt sm" data-act="g-fam-summon">🚙 استدعي سيارات الجزيرة الثانية</button><button class="btn alt sm" data-act="g-fam-sleepall">😴 نيّم الأولاد</button><button class="btn alt sm" data-act="g-fam-wakeall">☀️ صحّي الأولاد</button></div>`);
  };

  G.openers.kid = () => {
    const k = F.kidsView().find((x) => x.id === G.ui.kidId); if (!k) return G.openers.family();
    const s = G.state(), fr = s.fridge || {}, pets = s.pets, baby = k.stage === "baby";
    const cmds = Object.keys(CMDS).map((c) => `<button class="${k.cmd === c ? "on" : ""}" data-act="g-fam-cmd" data-cmd="${c}">${CMDS[c][0]} ${CMDS[c][1]}</button>`).join("");
    const eatable = Object.keys(fr).filter((i) => fr[i] > 0 && val(i) && (!baby || val(i).baby)).slice(0, 8);
    const eat = eatable.map((i) => `<button class="btn sm gold" data-act="g-fam-eat" data-item="${i}" data-src="fridge" data-kid="${k.id}">${emojiOf(i)} ${esc(nameOf(i))} ×${fr[i]}</button>`).join(" ") || '<small>الثلاجة ما فيها أكل مناسب. اطبخوا أو خزّنوا أكل 🧊</small>';
    const play = `<button class="btn sm alt" data-act="g-fam-play" data-id="${k.id}">🤸 العب معه</button> ` + pets.map((p) => `<button class="btn sm berry" data-act="g-fam-play" data-id="${k.id}" data-pet="${p.id}">${G.PETS[p.kind].e} مع ${esc(p.name || G.PETS[p.kind].n)}</button>`).join(" ");
    const kitems = Object.keys(KIDITEMS).filter((i) => (s.inv[i] || 0) > 0 && !(KIDITEMS[i].gear && s.gear && s.gear[i])).map((i) => `<button class="btn sm gold" data-act="g-fam-use" data-item="${i}" data-id="${k.id}">${KIDITEMS[i].e} ${esc(KIDITEMS[i].n)} ×${s.inv[i]}</button>`).join(" ") || '<small>ما عندكم مستلزمات. اشتروا من بقالة سعدون ← 👶 الأولاد</small>';
    const owned = Object.keys(s.gear || {}).map((i) => KIDITEMS[i].e).join(" ");
    let chores = "";
    if (k.stage === "teen") {
      const now = Date.now();
      chores = `<div class="sep"></div><b>🧑‍🍳 مساعدة البيت</b><p class="hint">${esc(k.name)} كبر وبقدر يساعدكم (لازم ما يكون جوعان)</p>` + Object.keys(CHORES).map((c) => { const C = CHORES[c], w = Math.max(0, ((k.chAt || {})[c] || 0) + C.cd - now), dis = w > 0 || k.food < 15 || (c === "eggs" && !s.animals.some((x) => x.kind === "chicken")); return irow(C.e, C.n, C.note + (w > 0 ? ` · ⏳ ${left(w)}` : ""), `<button class="btn sm gold" data-act="g-fam-help" data-task="${c}" data-id="${k.id}" ${dis ? "disabled" : ""}>يلا</button>`); }).join("");
    }
    ui().openModal(`<h3>${kidEm(k)} ${esc(k.name)}</h3><p class="hint">${stageTxt(k)}${k.loc === "school" ? " · 🏫 بالمدرسة" : ""}</p>
      ${meter("🍽️ الشبع", k.food, "#f4a261")}${meter("😊 الفرحة", k.joy, "#ff7aa8")}
      <b>🎛️ شو يسوي؟</b><div class="seg" style="margin:6px 0;flex-wrap:wrap">${cmds}</div>
      <p class="hint">«يقعد ببيت» بيدخل البيت، «ينام بغرفته» بينيّمه بغرفة الأولاد (وبالليل بينام لحاله إذا كان «يلعب براحته» أو «يقعد ببيت»)، «يوقف هون» بيوقفه مكانك، «معنا بالسيارة» بيركب ورا 🚗. ادخلوا البيت وشوفوه 🛏️</p>
      <div class="sep"></div><b>🍽️ أكّله من الثلاجة</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${eat}</div>
      <div class="sep"></div><b>🎾 لعب</b><div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${play}</div>
      <div class="sep"></div><b>🧸 مستلزمات</b> ${owned ? `<small>عنده: ${owned}</small>` : ""}<div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px">${kitems}</div>${chores}${back("family")}`);
  };

  G.openers.fridge = () => {
    const s = G.state(), fr = s.fridge || {}, total = Object.keys(fr).reduce((n, x) => n + fr[x], 0), ks = F.kidsView(), nv = G.needOf(db().uid);
    const fi = Object.values(s.furn).find((f) => f.item === "fridge"); G.ui.fridgeInst = fi ? fi.id : null;
    const rows = Object.keys(fr).filter((i) => fr[i] > 0).map((i) => {
      const v = val(i), kb = v ? ks.map((k) => `<button class="btn sm alt" data-act="g-fam-eat" data-item="${i}" data-src="fridge" data-kid="${k.id}" ${k.stage === "baby" && !v.baby ? "disabled" : ""}>${kidEm(k)}</button>`).join("") : "";
      return irow(emojiOf(i), nameOf(i) + " ×" + fr[i], v ? `🍞+${Math.round(v.food * 1.2)} 💧+${Math.round(v.drink * 1.2)}` : "", (v ? `<button class="btn sm gold" data-act="g-fam-eat" data-item="${i}" data-src="fridge">كُل أنا</button>` : "") + kb + `<button class="btn sm alt" data-act="g-fam-take" data-item="${i}">طلّع</button>`);
    }).join("");
    const inv = Object.keys(s.inv).filter((i) => s.inv[i] > 0 && storable(i)).map((i) => irow(emojiOf(i), nameOf(i) + " ×" + s.inv[i], "بمخزنكم", `<button class="btn sm gold" data-act="g-fam-store" data-item="${i}" data-q="1">+1</button><button class="btn sm gold" data-act="g-fam-store" data-item="${i}" data-q="${s.inv[i]}">الكل</button>`)).join("");
    const rec = Object.values(DISHES).map((d) => {
      const ok = Object.keys(d.need).every((x) => (fr[x] || 0) >= d.need[x]), need = Object.keys(d.need).map((x) => `<span style="color:${(fr[x] || 0) >= d.need[x] ? "#2a9d8f" : "#e63946"}">${emojiOf(x)}${d.need[x]}</span>`).join(" ");
      return irow(d.e, d.n, `${need}<br>🍞+${d.food} 💧+${d.drink} 😊+${d.joy}${d.baby ? " · 👶 مناسب للرضّع" : ""}`, `<button class="btn sm berry" data-act="g-fam-cook" data-dish="${d.id}" ${ok ? "" : "disabled"}>👩‍🍳 اطبخ</button>`);
    }).join("");
    ui().openModal(`<h3>🧊 الثلاجة (${total}/${FR_CAP})</h3>${coinBar()}${meter("🍞 شبعي", nv.food, "#f4a261")}${meter("💧 ريّي", nv.drink, "#4aa3e0")}
      <p class="hint">خزّنوا مواد من مخزنكم، واطبخوا وجبة من القائمة (بشرط المواد تكون بالثلاجة)، وبعدين كُل أنت أو أطعم الأولاد 🍽️</p>
      <b>🍽️ بالثلاجة</b><div class="items" style="margin:6px 0">${rows || '<div class="empty">الثلاجة فاضية! اشتروا أكل من سعدون وخزّنوه 🛒</div>'}</div>
      <b>📥 حط من المخزن</b><div class="items" style="margin:6px 0">${inv || '<div class="empty">ما عندكم مواد بالمخزن</div>'}</div>
      <b>👩‍🍳 وصفات</b><div class="items" style="margin:6px 0">${rec}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn alt sm" data-act="g-fam-lshopi">🧺 مواد الطبخ من سعدون</button><button class="btn alt sm" data-act="g-gotoshop">🏪 سعدون</button><button class="btn alt sm" data-act="g-fam-open" data-k="kiosk">💰 بيع وجبات</button>${fi ? '<button class="btn alt sm" data-act="g-fam-furn">🔧 نقل/بيع الثلاجة</button>' : ""}<button class="btn alt sm" data-act="g-fam-open" data-k="family">👨‍👩‍👧 العيلة</button></div>`);
  };

  G.openers.acts = () => {
    const ks = F.kidsView().filter((k) => k.stage !== "baby"), sel = G.ui.actSel || (G.ui.actSel = {}), s = G.state(), isle = onIsle(), now = Date.now();
    const kbtn = ks.map((k) => { const on = sel[k.id] !== false, busy = k.loc !== "home"; return `<button class="${on && !busy ? "on" : ""}" data-act="g-fam-seltog" data-id="${k.id}" ${busy ? "disabled" : ""}>${kidEm(k)} ${esc(k.name)}${busy ? " ⏳" : ""}</button>`; }).join("");
    const hasDish = Object.keys(s.fridge || {}).some((x) => DISHES[x]);
    const rows = Object.keys(ACTS).map((i) => {
      const a = ACTS[i], pick = ks.filter((k) => sel[k.id] !== false && k.loc === "home"), cd = pick.length && pick.every((k) => ((k.actAt || {})[i] || 0) > now - 20 * MIN), dis = !isle || !pick.length || cd || s.coins < a.cost || (a.dish && !hasDish);
      return irow(a.e, a.n, `${a.cost ? a.cost + "🪙 · " : "مجاناً · "}${a.min} دقايق · 😊+${a.joy + gearBonus(s)}${a.dish && !hasDish ? " · ❗بدها وجبة بالثلاجة" : ""}${cd ? " · ⏳ لعبوها قبل شوي (كل 20 دقيقة)" : ""}`, `<button class="btn sm gold" data-act="g-fam-act" data-act2="${i}" ${dis ? "disabled" : ""}>ابدأ</button>`);
    }).join("");
    ui().openModal(`<h3>🎈 فعاليات الجزيرة الثانية</h3>${coinBar()}
      ${isle ? '<div class="chk" style="margin:6px 0">🏝️ أنتوا بالجزيرة، اختاروا الأولاد والفعالية</div>' : '<div class="chk" style="margin:6px 0">🚗 الفعاليات بالجزيرة الثانية: روحوا بالسيارة (الطريق الطويل) وافتحوا هالصفحة هناك</div>'}
      ${ks.length ? `<b>مين بدك ياخد؟</b><div class="seg" style="margin:6px 0;flex-wrap:wrap">${kbtn}</div>` : '<div class="empty">ما في أولاد كبار لسا (الرضّع بيستنوا لبعد 5 أيام) 👶</div>'}
      <div class="items" style="margin:8px 0">${rows}</div><p class="hint">كل فعالية بتفرّح الأولاد، والألعاب اللي بتشتروها بتزيد الفرحة 🧸. بيرجعوا لحالهم بعد ما تخلص.</p>${back("family")}`);
  };

  G.openers.mypets = () => {
    const s = G.state(), uid = db().uid, MD = { follow: "🚶 يمشي وراي", stay: "📍 يوقف هون", home: "🏡 بالبيت" };
    const rows = s.pets.map((p) => {
      const PT = G.PETS[p.kind], mode = p.mode || "follow";
      return `<div class="irow" style="flex-direction:column;align-items:stretch;gap:6px"><div style="display:flex;gap:8px;align-items:center"><span class="ie">${PT.e}</span><input class="in" id="pn_${p.id}" maxlength="14" value="${esc(p.name || "")}" placeholder="اسم ${PT.n}" style="flex:1"><button class="btn sm gold" data-act="g-fam-petname" data-id="${p.id}">حفظ</button></div>
        <div class="seg" style="flex-wrap:wrap">${Object.keys(MD).map((m) => `<button class="${mode === m ? "on" : ""}" data-act="g-fam-petcmd" data-id="${p.id}" data-mode="${m}">${MD[m]}</button>`).join("")}</div><small>${p.owner === uid ? "إلك" : "عند " + esc(ui().partnerName())}</small></div>`;
    }).join("");
    ui().openModal(`<h3>🐾 حيواناتنا (${s.pets.length})</h3><p class="hint">سمّوهم وتحكموا فيهم: «يوقف هون» بيوقفه مكانك، «بالبيت» بيقعد ببيتكم (بتشوفه لما تدخل). والأولاد بيلعبوا معهم وبيفرحوا 💕</p><div class="items">${rows || '<div class="empty">ما في حيوانات. تبنّوا من سعدون ← 🐾 أليفة</div>'}</div>
      <button class="btn gold sm" style="margin-top:8px" data-act="g-gotoshop-pets">🐾 تبنّوا المزيد</button>${back("family")}`);
  };

  G.openers.riders = () => {
    const v = V(), rear = v && v.me ? v.CARS[v.me.car].seats - 2 : 4, ks = F.kidsView().filter((k) => k.loc === "home");
    const rows = ks.map((k) => irow(kidEm(k), k.name, k.cmd === "car" ? "🚗 راكب معكم" : "🏡 مش راكب", `<button class="btn sm ${k.cmd === "car" ? "alt" : "gold"}" data-act="g-fam-ride" data-id="${k.id}" data-on="${k.cmd === "car" ? 0 : 1}">${k.cmd === "car" ? "نزّله" : "ركّبه"}</button>`)).join("");
    ui().openModal(`<h3>🧒 الأولاد بالسيارة</h3><p class="hint">مقاعد ورا: ${rear} · بتقدر تلف الكاميرا بزر 🔙 وتسمعهم وتشوفهم طول الطريق</p><div class="items">${rows || '<div class="empty">ما في أولاد بالبيت</div>'}</div>`);
  };

  F.kidsShop = (s) => `<p class="hint">مستلزمات الأولاد: الاستهلاكية بتستخدموها من صفحة الولد، والألعاب «الدايمة» بتزيد فرحتهم بكل لعب وفعالية 🧸</p>` +
    Object.keys(KIDITEMS).map((i) => { const it = KIDITEMS[i], own = it.gear && s.gear && s.gear[i]; return irow(it.e, it.n, `${it.note || ""} · عندكم ${s.inv[i] || 0}${own ? " · ✅ مستخدمة" : ""}`, `<button class="btn sm gold" data-act="g-buy" data-id="${i}" data-q="1" ${s.coins < it.price ? "disabled" : ""}>اشتري · ${it.price}🪙</button>`); }).join("");

  /* ---------- النقرات ---------- */
  F.click = async (a, el) => {
    if (a.indexOf("g-fam-l") === 0 && OSW.lands) return OSW.lands.click(a, el);
    const st = G.ui, d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } };
    const sfx = (n) => OSW.audio && OSW.audio.sfx(n), hearts = (e, n) => ui().hearts && ui().hearts(e, n || 6), me = () => W().getMe();
    switch (a) {
      case "g-fam-open": return P().open(d.k);
      case "g-fam-kid": st.kidId = d.id; return P().open("kid");
      case "g-fam-shop": st.tab = "kids"; ui().closeModal(); return OSW.app.goPlace("shop");
      case "g-fam-cars": ui().closeModal(); return OSW.app.goPlace("cars");
      case "g-fam-fridge": return P().open("fridge");
      case "g-fam-furn": { const id = st.fridgeInst; if (!id) return; ui().closeModal(); st.finst = id; W().selectFurn(id); return P().open("furnitem"); }
      case "g-fam-eat": return busy(async () => { await G.do("feat", { item: d.item, src: d.src || "fridge", kid: d.kid || null }); sfx("pop"); hearts(emojiOf(d.item), 6); toast(`${emojiOf(d.item)} بالهنا والشفا`); });
      case "g-fam-store": return busy(async () => { await G.do("fstore", { item: d.item, qty: +d.q }); sfx("pop"); });
      case "g-fam-take": return busy(async () => { await G.do("ftake", { item: d.item, qty: 1 }); sfx("pop"); });
      case "g-fam-cook": return busy(async () => { const D2 = DISHES[d.dish]; await G.do("cook", { dish: d.dish }); sfx("magic"); hearts(D2.e, 8); toast(`${D2.e} طبختوا ${D2.n}! صارت بالثلاجة`, "love"); });
      case "g-fam-cmd": return busy(async () => { const m = me(); await G.do("kid_cmd", { id: st.kidId, cmd: d.cmd, x: m.x, z: m.z }); sfx("pop"); toast(`${CMDS[d.cmd][0]} ${CMDS[d.cmd][1]}`); });
      case "g-fam-ride": return busy(async () => { await G.do("kid_cmd", { id: d.id, cmd: d.on === "1" ? "car" : "home", x: 0, z: 0 }); sfx("pop"); G.sync3d(); });
      case "g-fam-play": return busy(async () => { const k = F.kidsView().find((x) => x.id === d.id); await G.do("kid_play", { id: d.id, pet: d.pet || null }); sfx("heart"); hearts(d.pet ? "💕" : "🤸", 8); if (k) W().say("kid_" + k.id, rnd(["هههه! 😆", "يلا نلعب أكتر! 🎈", "حلو كتير! 💕", "بحبكم! 🥰"]), 3000); });
      case "g-fam-use": return busy(async () => { await G.do("kid_use", { id: d.id, item: d.item }); sfx("magic"); hearts(emojiOf(d.item), 8); });
      case "g-fam-help": return busy(async () => { await G.do("kid_help", { id: d.id, task: d.task }); sfx("coin"); hearts(CHORES[d.task].e, 6); toast(`${CHORES[d.task].e} تسلم إيدو! ساعدكم`); });
      case "g-fam-seltog": st.actSel = st.actSel || {}; st.actSel[d.id] = st.actSel[d.id] === false; return P().refresh();
      case "g-fam-act": {
        if (!onIsle()) return toast("🏝️ لازم تكونوا بالجزيرة الثانية (بالسيارة)");
        const sel = st.actSel || {}, ids = F.kidsView().filter((k) => k.stage !== "baby" && k.loc === "home" && sel[k.id] !== false).map((k) => k.id);
        if (!ids.length) return toast("اختاروا ولد واحد على الأقل (والأولاد لازم يكونوا بالبيت مش بالمدرسة ولا بفعالية) 🧒");
        const AC = ACTS[d.act2], nowT = Date.now(), fresh = F.kidsView().filter((k) => ids.indexOf(k.id) > -1 && !(((k.actAt || {})[d.act2] || 0) > nowT - 20 * MIN)).map((k) => k.id);
        if (!fresh.length) return toast("⏳ هالفعالية لعبوها قبل شوي، جرّبوا فعالية ثانية أو استنوا شوي");
        if (G.state().coins < AC.cost) return toast("🪙 ما معكم مصاري كفاية للفعالية");
        if (AC.dish && !Object.keys(G.state().fridge || {}).some((x) => DISHES[x])) return toast("🧺 البيكنيك بدو وجبة مطبوخة بالثلاجة");
        return busy(async () => { await G.do("kid_act", { ids: fresh, act: d.act2 }); sfx("fanfare"); hearts(ACTS[d.act2].e, 12); toast(`${ACTS[d.act2].e} الأولاد راحوا ${ACTS[d.act2].n}!`, "love"); });
      }
      case "g-fam-summon": return busy(async () => { const n = await F.summon(); sfx(n ? "door" : "pop"); });
      case "g-fam-sleepall": case "g-fam-wakeall": return busy(async () => {
        const on = a === "g-fam-sleepall", ks = F.kidsView().filter((k) => k.loc === "home"); if (!ks.length) return toast("ما في أولاد بالبيت هلأ 🏡");
        for (const k of ks) await G.do("kid_cmd", { id: k.id, cmd: on ? "sleep" : "free", x: 0, z: 0 });
        sfx("pop"); toast(on ? "😴 الأولاد راحوا ينامون بغرفتهم" : "☀️ الأولاد صحيوا وطلعوا يلعبوا"); G.sync3d();
      });
      case "g-fam-petname": return busy(async () => { const v = ((document.getElementById("pn_" + d.id) || {}).value || "").trim(); await G.do("pet_name", { id: d.id, name: v }); sfx("heart"); toast("🐾 انحفظ الاسم"); });
      case "g-fam-petcmd": return busy(async () => { const m = me(); await G.do("pet_cmd", { id: d.id, mode: d.mode, x: m.x, z: m.z }); sfx("pop"); toast(d.mode === "stay" ? "📍 وقّفته هون" : d.mode === "home" ? "🏡 رجع عالبيت" : "🚶 بيمشي وراك"); });
    }
  };

  /* ---------- حياة الأولاد بالقرية (كل ~0.7 ثانية) + أصوات ---------- */
  const LINES = { hungry: ["جعااان! 🍽️", "بدي آكل! 🥪", "ماما بطني بتزقزق 😢"], sad: ["زهقت 😔", "العبوا معي! 🎈", "ما في شي أعمله…"], happy: ["أنا مبسوط! 😄", "يلا نلعب! 🎈", "بحبكم كتير 🥰", "شوفوا شو عملت! ✨"], car: ["شوفوا البحر! 🌊", "إحنا وصلنا؟ 🚗", "بابا أسرع شوي! 😆", "أنا جعان! 🍪", "هههه 😂", "ماما شوفي الطيور 🐦", "بدنا بوظة! 🍦"] };
  let lastAuto = {}, lastBub = 0, lastSay = 0;
  const bubble = (txt) => {
    let b = document.getElementById("carBubble"); if (!b) return; b.textContent = txt; b.classList.add("on"); clearTimeout(bubble.t); bubble.t = setTimeout(() => b.classList.remove("on"), 3600);
  };
  F.tick = () => {
    const w = W(); if (!w || !w.S || !w.S.ready || !db() || !db().me) return;
    const kv = F.kidsView(), now = Date.now(), me = w.getMe(), v = V();
    { const sig = kv.map((k) => k.id + (k.indoors ? (k.sleeping ? "s" : "i") : "o")).join(","); if (F._sig !== undefined && sig !== F._sig) { F._sig = sig; try { G.sync3d(); } catch (e) { /* */ } } else F._sig = sig; }
    if (v && v.me) {
      if (now - lastBub > 3500 + Math.random() * 3500) {
        lastBub = now; const r = F.riders();
        if (r.length) { const k = rnd(r), lo = Math.min(k.food, k.joy); bubble(`${kidEm(k)} ${k.name}: ` + rnd(lo < 30 ? LINES.hungry : LINES.car)); OSW.audio && OSW.audio.sfx(Math.random() < 0.5 ? "babble" : "giggle"); }
      }
      return;
    }
    if (w.mode !== "out") return;
    kv.forEach((k) => {
      const id = "kid_" + k.id, def = OSW.NPC_BY[id], pos = w.npcPos(id); if (!def || !pos) return;
      if (k.loc !== "home") { def.stay = false; return; }
      const dist = hy(pos.x - me.x, pos.z - me.z), side = (z) => z > 1000;
      if (k.cmd === "follow" || k.cmd === "car") {
        def.stay = false;
        if (dist > 45 || side(pos.z) !== side(me.z)) w.npcSetPos(id, me.x - 1.6, me.z - 1.6, 0);
        else if (dist > 4) w.npcGoto(id, me.x - 1.4, me.z - 1.2);
      } else if (k.cmd === "stay") {
        const key = k.ct || 1; if (def._st !== key) { def._st = key; w.npcSetPos(id, k.cx, k.cz, 0); } def.stay = true;
      } else if (k.cmd === "home") { def.stay = false; def.roam = [6, -4.5, k.stage === "baby" ? 1.6 : 3.8]; if (hy(pos.x - 6, pos.z + 4.5) > 40) w.npcSetPos(id, 6, -4.5, 0); }
      else def.stay = false;
      if (dist < 14 && now - lastSay > 9000 && Math.random() < 0.08) {
        lastSay = now; const lo = Math.min(k.food, k.joy); w.say(id, rnd(k.food < 30 ? LINES.hungry : k.joy < 30 ? LINES.sad : LINES.happy), 3500);
        if (dist < 9 && OSW.audio) OSW.audio.sfx(k.stage === "baby" ? "babble" : "giggle");
      }
      // لعب تلقائي مع الحيوانات الأليفة القريبة
      if (k.by === db().uid && w.petsPos && now - (lastAuto[k.id] || 0) > 150000) {
        const near = w.petsPos().find((p) => hy(p.x - pos.x, p.z - pos.z) < 3.2);
        if (near) { lastAuto[k.id] = now; G.do("kid_play", { id: k.id, pet: near.id, auto: 1 }).catch(() => {}); w.say(id, rnd(["🐾 أحبك يا " + (near.name || "حيوان") + "!", "هههه لحسني! 😂", "تعال تعال! 🎾"]), 3500); if (ui().hearts) ui().hearts("💕", 4); }
      }
    });
  };

  F.summon = async () => {
    const v = V(); if (!v) return 0; if (v.me) { toast("🚗 انزل من السيارة أول"); return 0; }
    const n = await v.summon();
    toast(n ? `🚙 ${n} ${n === 1 ? "سيارة رجعت" : "سيارات رجعوا"} من الجزيرة الثانية لـ${v.summonedTo === "A" ? "موقف معرض السيارات" : "كراج البيت"}` : "كل سياراتكم بالجزيرة الأولى ✅", n ? "gold" : "");
    try { G.sync3d(); } catch (e) { /* */ } return n;
  };
  /* ---------- أزرار وتركيب ---------- */
  function init() {
    setInterval(() => { try { F.tick(); } catch (e) { /* ما نوقف اللعبة */ } }, 700);
    const pill = document.getElementById("needPill"); if (pill) { pill.style.cursor = "pointer"; pill.addEventListener("click", () => OSW.app && OSW.app.goPlace("needs")); }
    const bx = document.querySelector(".hud-btns");
    if (bx && !document.getElementById("btnFam")) {
      const mk = (id, em, lab, act) => { const b = document.createElement("button"); b.id = id; b.className = "rbtn"; b.setAttribute("aria-label", lab); b.textContent = em; b.onclick = () => OSW.app && act(); return b; };
      bx.insertBefore(mk("btnFridge", "🧊", "الثلاجة والأكل", () => OSW.app.goPlace("fridge")), bx.firstChild);
      bx.insertBefore(mk("btnFam", "👨‍👩‍👧", "العيلة", () => OSW.app.goPlace("family")), bx.firstChild);
      const act = mk("btnActs", "🎈", "فعاليات", () => OSW.app.goPlace("acts")); act.hidden = true; bx.insertBefore(act, bx.firstChild);
      const sum = mk("btnSummon", "🚙", "استدعي سيارات الجزيرة الثانية", () => F.summon()); sum.hidden = true; sum.title = "استدعي كل السيارات اللي بالجزيرة الثانية للجزيرة الأولى"; bx.insertBefore(sum, bx.firstChild);
      setInterval(() => { try { const w = W(), vv = V(); sum.hidden = !(w && w.S && w.S.ready && w.mode === "out" && vv && !vv.me && vv.away().length); } catch (e) { /* */ } }, 1500);
      setInterval(() => { try { const w = W(); act.hidden = !(w && w.S && w.S.ready && w.mode === "out" && onIsle() && !(V() && V().me)); } catch (e) { /* */ } }, 1500);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
