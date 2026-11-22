/* التشغيل: الدخول، التنقل بالقرية ثلاثية الأبعاد، الحضور، الإشعارات */
(function () {
  const OSW = window.OSW;
  const { $, $$, esc, rand, sleep, tpl } = OSW;
  const app = (OSW.app = {});
  let db, ui, W, P, G, busyNav = false, ready = false, introDone = false, busySince = 0;

  /* ---------- الشخصية (شكلي وشكل الشريك) ---------- */
  app.lookOf = (uid) => {
    const p = db.profiles.find((x) => x.id === uid) || db.me || {}, k = db.kv["look:" + uid] || {};
    return { gender: k.gender || "boy", hairStyle: k.hairStyle || (k.gender === "girl" ? "long" : "short"), skin: k.skin || "#f2c9a0", color: p.color, hair: p.hair, outfit: k.outfit || "casual", acc: k.acc || [] };
  };
  app.refreshAvatars = (draft) => {
    if (!db.me || !W.S || !W.S.ready) return;
    const me = Object.assign(app.lookOf(db.uid), draft || {}, { color: db.me.color, hair: db.me.hair });
    W.setLook("me", me, db.me.name);
    if (db.partner) W.setLook("partner", app.lookOf(db.partner.id), db.partner.name);
  };

  /* ---------- شاشات الدخول ---------- */
  function authCard(html) { $("#authCard").innerHTML = html; $("#auth").hidden = false; }
  const swatch = (arr, cur, k) => arr.map((c) => `<button type="button" style="background:${c}" class="${cur === c ? "on" : ""}" data-pick="${k}" data-v="${c}" aria-label="${c}"></button>`).join("");
  function showAuth(mode = "in", msg = "") {
    if (db.mode === "demo") return showDemoAuth();
    const up = mode === "up";
    authCard(`<div class="logo">🏡</div><h1>عالمنا الصغير</h1><p>${up ? "أنشئ حسابك" : "سجّل دخولك لقريتكم"}</p>
      <div class="field"><label for="em">الإيميل</label><input type="email" id="em" autocomplete="email"></div>
      <div class="field"><label for="pw">كلمة السر</label><input type="password" id="pw" autocomplete="${up ? "new-password" : "current-password"}"></div>
      <div class="err" id="aerr">${esc(msg)}</div>
      <button class="btn berry" id="abtn">${up ? "إنشاء حساب" : "دخول"}</button>
      <p style="margin-top:14px"><button class="link-btn" id="atoggle">${up ? "عندي حساب، بدي أسجّل دخول" : "أول مرة؟ أنشئ حساب"}</button></p>`);
    $("#atoggle").onclick = () => showAuth(up ? "in" : "up");
    const go = async () => {
      $("#abtn").disabled = true; $("#aerr").textContent = "";
      try {
        const r = up ? await db.signUp($("#em").value.trim(), $("#pw").value) : await db.signIn($("#em").value.trim(), $("#pw").value);
        if (r === "confirm") return showAuth("in", "تم! أكّد الإيميل من الرسالة اللي وصلتك وبعدين سجّل دخول.");
        route(r);
      } catch (e) { $("#aerr").textContent = e.message; $("#abtn").disabled = false; }
    };
    $("#abtn").onclick = go; $("#pw").onkeydown = (e) => e.key === "Enter" && go();
  }
  function showDemoAuth() {
    const users = db.demoUsers();
    if (users.length < 2) {
      authCard(`<div class="logo">🏡</div><h1>عالمنا الصغير</h1><div class="demo-banner">وضع تجريبي: البيانات عالجهاز بس. للاستخدام الحقيقي اربطوا Supabase.</div>
        <div class="field"><label for="n1">اسم الولد</label><input type="text" id="n1" maxlength="20"></div>
        <div class="field"><label for="n2">اسم البنت</label><input type="text" id="n2" maxlength="20"></div>
        <div class="err" id="aerr"></div><button class="btn berry" id="abtn">ابدأ</button>`);
      $("#abtn").onclick = () => { const a = $("#n1").value.trim(), b = $("#n2").value.trim(); if (!a || !b) return ($("#aerr").textContent = "اكتب الاسمين"); route(db.demoSetup(a, b)); };
    } else {
      authCard(`<div class="logo">🏡</div><h1>عالمنا الصغير</h1><div class="demo-banner">وضع تجريبي</div><p>مين أنت؟</p>${users.map((u) => `<button class="btn" style="margin-bottom:10px;background:${esc(u.color)}" data-who="${u.id}">${esc(u.name)}</button>`).join("")}`);
      $$("[data-who]").forEach((b) => (b.onclick = () => route(db.demoLogin(b.dataset.who))));
    }
  }
  function showOnboard() {
    const pal = OSW.PALETTES, v = { color: pal.shirts[0], hair: pal.hairs[0], gender: "boy", hairStyle: "short" };
    const seg = (arr, k) => arr.map(([val, t]) => `<button type="button" class="${v[k] === val ? "on" : ""}" data-sg="${k}" data-v="${val}">${t}</button>`).join("");
    authCard(`<div class="logo">👋</div><h1>أهلاً فيك!</h1><p>اصنع شخصيتك بالقرية</p>
      <div class="field"><label for="nm">اسمك</label><input type="text" id="nm" maxlength="20"></div>
      <div class="field"><label>أنا…</label><div class="seg">${seg([["boy", "ولد 👦"], ["girl", "بنت 👧"]], "gender")}</div></div>
      <div class="field"><label>الشعر</label><div class="seg">${seg(pal.styles, "hairStyle")}</div></div>
      <div class="field"><label>لون ملابسك</label><div class="swatches">${swatch(pal.shirts, v.color, "color")}</div></div>
      <div class="field"><label>لون الشعر / الحجاب</label><div class="swatches">${swatch(pal.hairs, v.hair, "hair")}</div></div>
      <div class="err" id="aerr"></div><button class="btn berry" id="abtn">دخول القرية</button>`);
    $$("[data-pick]").forEach((b) => (b.onclick = () => { v[b.dataset.pick] = b.dataset.v; $$(`[data-pick=${b.dataset.pick}]`).forEach((x) => x.classList.toggle("on", x === b)); }));
    $$("[data-sg]").forEach((b) => (b.onclick = () => { v[b.dataset.sg] = b.dataset.v; $$(`[data-sg=${b.dataset.sg}]`).forEach((x) => x.classList.toggle("on", x === b)); }));
    $("#abtn").onclick = async () => {
      const name = $("#nm").value.trim(); if (!name) return ($("#aerr").textContent = "اكتب اسمك");
      $("#abtn").disabled = true;
      try { const r = await db.createProfile({ name, color: v.color, hair: v.hair }); await db.kvSet("look:" + db.uid, { gender: v.gender, hairStyle: v.hairStyle }); route(r); } catch (e) { $("#aerr").textContent = e.message; $("#abtn").disabled = false; }
    };
  }
  function route(status) { if (status === "ready") return enterVillage(); if (status === "onboard") return showOnboard(); showAuth(); }

  /* ---------- دخول القرية ---------- */
  async function enterVillage() {
    $("#auth").hidden = true; $("#hud").hidden = false; $("#zoomctl").hidden = false; $("#guide").hidden = false; $("#joy").hidden = false; $("#btnSprint").hidden = false;
    ready = true; G.init(db, ui); OSW.chat.init(db, ui, W); if (OSW.events) OSW.events.start(db, ui, W); if (OSW.law) OSW.law.start(db, ui, W); if (OSW.extras) { try { OSW.extras.start(db, ui, W); } catch (e) { console.error(e); } }
    app.refreshAvatars(); syncAll(); P.checkAchievements();
    db.on("change", onChange); db.on("presence", updatePresence); db.on("pos", onPos);
    W.onMove = (p) => db.sendPos(p);
    W.onTogether = () => { if (db.partner && db.uid < db.partner.id) G.do("together", {}).then(() => ui.toast("💞 مشيتوا سوا: +3🪙", "love")).catch(() => {}); };
    W.onAct = onAct;
    updatePresence();
    W.setInputEnabled(false); W.spawnMe(0, 40); W.goTo(0, 9);
    OSW.audio.resumeIfEnabled();
    await W.intro(); W.setInputEnabled(true); introDone = true;
    const per = W.period(W.updateSky().hour);
    let line = tpl(rand(OSW.GREET[per]), { name: db.me.name });
    const un = totalUnread(), pend = G.tasks().filter((t) => !t.done && !t.soft);
    if (un) line += ` عندكم ${un} شي جديد من ${ui.partnerName()}! 💌`;
    else if (pend.length) line += ` لسا ${pend[0].e} ${pend[0].t}`;
    else if (!db.partner) line += " بانتظار شريكك يدخل القرية 🏡";
    guideSay(line, 9000); db.track("village"); celebrate();
  }
  document.addEventListener("pointerdown", () => OSW.audio.resumeIfEnabled(), { once: true });
  // احتفال بالأيام المميزة
  function celebrate() {
    const d = P.days(), sd = db.kv.start_date && db.kv.start_date.date, key = "cel:" + OSW.todayKey();
    if (d == null || ui.my()[key]) return;
    let msg = "";
    if (d > 0 && d % 365 === 0) msg = `🎉 ${d / 365} سنة على حكايتكم! كل عام وانتم الأحلى`;
    else if (d > 0 && d % 100 === 0) msg = `🎊 مبروك! ${d} يوم مع بعض`;
    else if (d > 0 && new Date(sd).getDate() === new Date().getDate()) msg = "💞 ميلاد الشهر! كل شهر وانتم مع بعض بخير";
    if (!msg) return;
    ui.saveMy({ [key]: 1 });
    setTimeout(() => { OSW.audio.sfx("fanfare"); ui.hearts("🎆", 22); ui.hearts("💖", 20); ui.toast(msg, "gold", 9000); guideSay(msg, 9000); }, 1500);
  }

  function syncAll() {
    updateBadges(); W.setTree(db.entries.filter((e) => OSW.HOUSE[e.house]).length);
    W.setBoard(db.entries.filter((e) => e.house === "board").length); W.setLighthouse(P.lighthouseLit());
    updateHome(); updateDays(); W.setHiddenFound(new Set(ui.my().found)); G.sync3d();
  }
  const totalUnread = () => OSW.HOUSES.reduce((a, h) => a + ui.unread(h.id), 0);
  function updateBadges() { const m = {}; OSW.HOUSES.forEach((h) => { m[h.id] = ui.state.room === h.id ? 0 : ui.unread(h.id); }); Object.assign(m, G.badges || {}); W.setBadges(m); }
  function updateHome() { W.updateHome(P.homeCfg(), P.homeName()); }
  function updateDays() { const d = P.days(); $("#dayNum").textContent = d == null ? "؟" : d; $("#dayPill").querySelector("span").textContent = d == null ? "حدّدوا البداية" : "يوم"; }
  Object.assign(app, { updateDays, updateHome, updateBadges, updateLighthouse: () => W.setLighthouse(P.lighthouseLit()), checkAchievements: () => P.checkAchievements() });

  /* ---------- أحداث البيانات ---------- */
  let syncTimer, achTimer;
  const NICE = (e) => (e.house === "game" ? ({ water: "سقى ورود الحب 💦", feed: "أطعم الحجّي والحجّة 🍞", plant: "زرع بالمزرعة 🌱", harvest: "قطف من المزرعة 🧺", sell: "باع محاصيل 🪙", buy: "اشترى من سعدون 🏪", gift: "أرسل هدية 🎁", order: "سلّم طلب لأهل القرية 📋", abuy: "اشترى حيوان للمزرعة 🐑", afeed: "أطعم الحيوانات 🌾", asell: "باع للملحمة 🥩", draw: "سلّم رسمة التحدي 🎨", cart_pull: "عم يسحب العربة! 🛒 اضغط «اسحب» الحين" }[e.title] || "لعب بالمزرعة") : ({ comment: "علّق على شي", fountain: "جاوب سؤال النافورة", wish: "رمى عملة بالنافورة", light: "ضوّى المنارة 🔦", board: "علّق ورقة بالساحة" }[e.house] || ("أضاف شي بـ" + (OSW.HOUSE[e.house] ? OSW.HOUSE[e.house].name : "القرية"))));
  function onChange(ev) {
    if (!ready) return;
    clearTimeout(syncTimer); syncTimer = setTimeout(() => { syncAll(); app.refreshAvatars(); updatePresence(); ui.room.refreshSoon(); P.refresh(); }, 90);
    clearTimeout(achTimer); achTimer = setTimeout(() => P.checkAchievements(), 1500);
    if (ev.remote && ev.table === "entries" && ev.type === "INSERT" && ev.row && ev.row.house === "chat" && ev.row.author !== db.uid) { OSW.chat.incoming(ev.row); return; }
    if (ev.remote && ev.table === "entries" && ev.type === "INSERT" && ev.row && ev.row.author !== db.uid) {
      const n = ui.prof(ev.row.author).name, game = ev.row.house === "game";
      if (game && ["story", "together", "harvest", "plant", "sell", "buy", "order", "stash", "cart_load", "sellcrate", "acollect", "acarry", "adrop", "psell", "dstroke", "fish"].includes(ev.row.title)) return;
      const inside = ui.state.room === ev.row.house;
      if (!inside) { ui.toast("💌 " + esc(n) + ": " + NICE(ev.row), "love", 4500); OSW.audio.sfx("ding"); }
      notify("عالمنا الصغير", `${n}: ${NICE(ev.row)}`);
    }
    if (ev.remote && ev.table === "reactions" && ev.type === "INSERT" && ev.row && ev.row.author !== db.uid) {
      const e = db.entries.find((x) => x.id === ev.row.entry_id);
      if (e && e.author === db.uid) { ui.toast(`${ev.row.emoji} ${esc(ui.prof(ev.row.author).name)} تفاعل مع شي كتبته`, "love"); OSW.audio.sfx("heart"); }
    }
  }
  let lastReload = 0;
  setInterval(async () => {
    if (!ready || !db.sealed.length) return;
    if (db.sealed.some((s) => new Date(s.unlock_at) <= new Date()) && Date.now() - lastReload > 15000) {
      lastReload = Date.now(); await db.reload();
      ui.toast("🎁 انفتحت مفاجأة كانت مقفلة!", "gold", 5000); OSW.audio.sfx("fanfare"); ui.hearts("🎁", 14);
    }
  }, 20000);
  setInterval(() => { if (ready) updateDays(); }, 60000);

  /* ---------- الحضور والشريك ---------- */
  function onPos(p) { if (ready && db.partner && p.u === db.partner.id) { const pr = db.presence[db.partner.id]; if (!pr || !OSW.HOUSE[pr.where]) W.remote(p); } }
  const PLACE_NAMES = { village: "بالقرية", fountain: "عند النافورة", plaza: "بالساحة", tree: "عند الشجرة", home: "ببيتكم", garden: "بالحديقة", lighthouse: "عند المنارة", gate: "عند البوابة", ach: "بالإنجازات", shop: "عند سعدون", farm: "بالمزرعة", flowers: "عند ورود الحب", hajji: "عند الحجّي", tasks: "بالمهام", orders: "بالطلبات", inv: "بالمخزن", pens: "بحظيرة المزرعة", fishing: "عالمرسى 🎣", butcher: "عند الملحمة", draw: "بغرفة الرسم" };
  function updatePresence() {
    if (!ready) return;
    const el = $("#presence"), p = db.partner;
    if (!p) { el.classList.remove("on"); $("#presenceText").textContent = "بانتظار شريكك يدخل القرية"; W.setPartnerState({ visible: false }); return; }
    const pr = db.presence[p.id];
    if (pr) {
      const inHouse = OSW.HOUSE[pr.where] ? "house:" + pr.where : null, sp = /^in:/.test(pr.where || "") ? pr.where.slice(3) : null;
      W.setPartnerSpace(sp);
      el.classList.add("on"); $("#presenceText").textContent = `${p.name} موجود هلأ · ${inHouse ? "في " + OSW.HOUSE[pr.where].name : sp ? { home: "ببيتكم من جوّا", shop: "جوّا الدكان", boutique: "بمحل الأناقة", police: "بمركز الشرطة" }[sp] || "جوّا" : PLACE_NAMES[pr.where] || "بالقرية"}`;
      W.setPartnerState({ visible: true, sleeping: false, inside: inHouse });
      if (inHouse && W.S.poi[inHouse]) W.remote({ x: W.S.poi[inHouse].x, z: W.S.poi[inHouse].z, ry: 0 });
    } else {
      el.classList.remove("on"); $("#presenceText").textContent = p.last_seen ? `${p.name} · آخر ظهور ${OSW.timeAgo(p.last_seen)}` : `${p.name} · مش موجود هلأ`;
      W.setPartnerState({ visible: true, inside: null, sleeping: true });
    }
  }

  /* ---------- الدليل ---------- */
  let gTimer;
  function guideSay(text, ms = 7000) { $("#guideText").textContent = text; clearTimeout(gTimer); gTimer = setTimeout(() => ($("#guideText").textContent = ""), ms); }
  function guideTalk() {
    OSW.audio.sfx("pop"); const un = totalUnread(), pool = OSW.GUIDE_TIPS.slice();
    pool.push("اضغط على أي بيت أو مكان وشخصيتك بتمشي له لحالها 🚶", "استعمل العصا (أو الأسهم/WASD) للمشي، واسحب الشاشة لتدوير الكاميرا 🎥", "الورد بيكبر لما الاثنين يسقوه كل يوم 🌹", "بيعوا المحاصيل عند سعدون بسعر أحسن 🏪", "اضغط 🤝 وامشوا سوا ماسكين إيد بعض 💞");
    if (un) pool.push(`في ${un} شي جديد من ${ui.partnerName()} 🔴`);
    G.tasks().filter((t) => !t.done && !t.soft).forEach((t) => pool.push(`${t.e} ${t.t}`));
    const found = ui.my().found.length; pool.push(found < OSW.HIDDEN.length ? `لقيت ${found} من ${OSW.HIDDEN.length} كنوز مخبّأة… كمّل دوّر!` : "لقيت كل الكنوز، أنت أسطورة 🧭");
    guideSay(rand(pool));
  }

  /* ---------- التنقل: البيوت والأماكن ---------- */
  async function enterHouse(id) {
    if (busyNav) return; busyNav = true; W.setInputEnabled(false); guideSay("", 1);
    OSW.audio.sfx("pop");
    await W.walkToPOI("house:" + id); await W.focusOn("house:" + id, 850);
    OSW.audio.sfx("door"); await sleep(200);
    $("#curtain").classList.add("on"); await sleep(320);
    $("#hud").hidden = true; $("#zoomctl").hidden = true; $("#guide").hidden = true; $("#joy").hidden = true; $("#btnSprint").hidden = true; W.pause(true);
    ui.room.open(id); await sleep(60); $("#curtain").classList.remove("on"); busyNav = false;
  }
  async function exitHouse() {
    if (busyNav || !ui.state.room) return; busyNav = true;
    const r = $("#room"); r.classList.add("out"); await sleep(260);
    ui.room.close(); r.classList.remove("out");
    if (W.mode === "in") { $("#hud").hidden = false; $("#zoomctl").hidden = false; $("#guide").hidden = false; $("#joy").hidden = false; $("#btnSprint").hidden = false; $("#btnFurn").hidden = W.interior !== "home"; W.pause(false); OSW.audio.sfx("door"); W.setInputEnabled(true); busyNav = false; return; }
    $("#hud").hidden = false; $("#zoomctl").hidden = false; $("#guide").hidden = false; $("#joy").hidden = false; $("#btnSprint").hidden = false; W.pause(false);
    OSW.audio.sfx("door"); syncAll(); P.checkAchievements();
    await W.releaseFocus(750); W.setInputEnabled(true); busyNav = false; db.track("village");
  }
  app.enterHouse = enterHouse; app.exitHouse = exitHouse;

  async function goPlace(id) {
    if (id === "fishingB") { if (W.mode === "out" && W.S.poi.fishingB) await W.walkToPOI("fishingB"); W.setInputEnabled(false); OSW.audio.sfx("pop"); P.open("fishing"); const pv = ui.onModalClose; ui.onModalClose = () => { pv && pv(); W.setInputEnabled(true); }; return; }
    if (!$("#modal").hidden && P.current === id) return;
    if (!["fountain", "plaza", "tree", "garden", "lighthouse", "gate", "home", "ach", "shop", "farm", "flowers", "tasks", "orders", "inv", "boutique", "wardrobe", "cart", "pens", "butcher", "draw", "fishing", "fishingB", "cars"].includes(id) && !G.openers[id]) return;
    if (W.mode === "out" && W._int.me.veh) return ui.toast("🚪 انزلوا من السيارة أول");
    if (W.mode === "out" && W.S.poi[id]) { const p = W.S.poi[id], m = W._int.me; if ((p.z > 1000) !== (m.z > 1000)) return ui.toast("🚗 المكان بالجزيرة الثانية — لازم سيارة عشان توصلوا!"); await W.walkToPOI(id); }
    W.setInputEnabled(false); OSW.audio.sfx("pop"); P.open(id);
    const prev = ui.onModalClose; ui.onModalClose = () => { prev && prev(); W.setInputEnabled(true); };
  }
  app.goPlace = goPlace;
  // زرع/قطف بالإيد: بتضغط عالأرض، الشخصية بتمشي وبتشتغل
  function plotAct(i, walk) {
    if (walk) { const p = W.S.poi["plot:" + i]; return p ? W.goTo(p.x, p.z, "plot:" + i) : null; }
    if (i >= 12 && OSW.lands && !OSW.lands.owned(i)) return OSW.lands.open(OSW.lands.landOfPlot(i));
    const v = G.view(), p = v.plots[i], carried = G.carryOf(db.uid);
    OSW.audio.sfx("pop");
    if (!p) {
      const c = G.CROPS[G.ui.last], fert = !!G.ui.fert && G.has("fert");
      if (G.state().coins < c.seed) return ui.toast(`ما معك مصاري للبذرة 🪙 (${c.seed})`);
      W.say("me", "🌱", 1600); return G.do("plant", { plot: i, crop: G.ui.last, fert }).then(() => ui.toast(`${c.e} زرعت ${c.n}${fert ? " بسماد 🌿" : ""}`, "", 1800)).catch((e) => ui.toast("⚠️ " + esc(e.message)));
    }
    if (!p.ripe) return ui.toast(`${G.CROPS[p.crop].e} لسا بدها ${p.left >= 60 ? Math.floor(p.left / 60) + " س " + (p.left % 60) : p.left} د`, "", 2200);
    if (carried.length >= G.carryMax()) return ui.toast("إيدك مليانة! 📦📦📦 حطّ الصناديق بالمخزن 🏚️ أو بالعربة 🛒", "gold", 3200);
    W.say("me", "🧺", 1600); return G.do("harvest", { plot: i }).then(() => { OSW.audio.sfx("coin"); ui.toast(`📦 شلت صندوق ${G.CROPS[p.crop].n} (${G.carryOf(db.uid).length}/3)`, "", 1800); }).catch((e) => ui.toast("⚠️ " + esc(e.message)));
  }
  function barnAct() {
    const c = G.carryOf(db.uid);
    if (c.length) return G.do("stash", {}).then(() => { OSW.audio.sfx("coin"); ui.toast("🏚️ حطّيت الصناديق بالمخزن", "", 2000); }).catch((e) => ui.toast("⚠️ " + esc(e.message)));
    return goPlace("xbarn");
  }
  app.plotAct = plotAct;
  async function foundHidden(id) {
    const my = ui.my(); if (my.found.includes(id)) return;
    const o = OSW.HIDDEN.find((x) => x.id === id), found = my.found.concat(id);
    ui.saveMy({ found }); W.setHiddenFound(new Set(found)); OSW.audio.sfx("magic"); ui.hearts(o.emoji, 10);
    ui.toast(`${o.emoji} ${esc(o.msg)}`, "gold", 6000);
    if (found.length === OSW.HIDDEN.length) setTimeout(() => ui.toast("🧭 لقيت كل الكنوز المخبّأة! أنت صيّاد أسطوري", "gold", 6000), 1500);
    P.checkAchievements();
  }
  function onAct(act) {
    if (!ready || busyNav) return;
    const i = act.indexOf(":"), k = i < 0 ? act : act.slice(0, i), v = i < 0 ? "" : act.slice(i + 1);
    if (k === "house") return enterHouse(v);
    if (k === "hidden") return foundHidden(v);
    if (k === "partner") return toggleWalk();
    if (k === "plot") return plotAct(+v);
    if (k === "land" && OSW.lands) return OSW.lands.open(v);
    if (k === "lshed" && OSW.logi) return OSW.logi.shedAct(v);
    if (k === "exit") return exitInterior();
    if (act === "wedding") return goPlace("wedding");
    if (k === "console") return openConsole(v);
    if (k === "scene") return OSW.events && OSW.events.openScene(v);
    if (k === "furn") return furnTap(v);
    if (k === "counter") return goPlace(W.interior === "boutique" ? "boutique" : W.interior === "butcher" ? "butcher" : W.interior === "dealer" ? "cars" : "shop");
    if (k === "shelf") return goPlace("shop");
    if (k === "rack") return goPlace("boutique");
    if (k === "mirror") return goPlace("wardrobe");
    if (W.mode === "out" && (act === "home" || act === "shop" || act === "boutique")) return enterInterior(act);
    if (k === "car") return OSW.veh.tap(v);
    if (act === "butchershop" && W.mode === "out") return enterInterior("butcher");
    if (act === "dealer" && W.mode === "out") return enterInterior("dealer");
    if (k === "barn") return barnAct();
    if (k === "pet") { OSW.audio.sfx("heart"); ui.hearts("🐱", 6); W.say("pet", rand(["مياوو 😻", "بدي سمكة 🐟", "فركلي راسي 💕", "بحبكم! مياو"]), 3500); return; }
    if (k === "mypet") { const p = OSW.game.state().pets.find((x) => x.id === v); if (!p) return; const PT = OSW.game.PETS[p.kind]; OSW.audio.sfx("heart"); ui.hearts(PT.e, 6); W.say("pet:" + v, (p.name ? p.name + ": " : "") + rand(PT.says), 3500); return; }
    if (k === "npc") return npcTalk(v);
    return goPlace(k);
  }
  function npcTalk(id) {
    const n = OSW.NPC_BY[id]; if (!n) return; OSW.audio.sfx("pop"); W.say(id, rand(n.lines), 5500);
    const s = G.state(), day = G.today(), mineO = G.ordersOf(day).filter((o) => o.npc === id && !s.orders[day + ":" + o.idx]);
    if (mineO.length) { setTimeout(() => ui.toast(`❗ ${esc(n.name)} عنده طلب إلكم`, "gold", 3000), 600); setTimeout(() => goPlace("orders"), 1200); }
  }
  function toggleWalk() {
    if (!db.partner || W.partnerDist() > 1e8) return ui.toast(`${esc(ui.partnerName())} مش موجود بالقرية هلأ`);
    const on = !W.following; W.followPartner(on); $("#btnWalk").classList.toggle("on", on);
    ui.toast(on ? `💞 ماشي مع ${esc(db.partner.name)}` : "وقفت المشي سوا", on ? "love" : "", 2200); if (on) ui.hearts("💞", 8);
  }

  /* ---------- الدخول لبيتنا والدكان من جوّا ---------- */
  let placing = null;
  async function enterInterior(id) {
    if (busyNav) return; busyNav = true; W.setInputEnabled(false); OSW.audio.sfx("door");
    await W.walkToPOI(OSW.INT.enterAct[id]); $("#curtain").classList.add("on"); await sleep(330);
    W.enter(id); G.sync3d(); db.track("in:" + id); $("#btnFurn").hidden = id !== "home";
    await sleep(80); $("#curtain").classList.remove("on"); W.setInputEnabled(true); busyNav = false;
    if (id === "home") guideSay("بيتكم من جوّا! 🏡 خمس غرف: النوم (فيه رف الصور والأغاني)، الذكريات، المطبخ، الصالون، الشرفة. اضغط 🛋️ للأثاث 😴", 6500);
  }
  async function exitInterior() {
    if (busyNav || W.mode !== "in") return; busyNav = true; W.setInputEnabled(false); cancelPlacing(); OSW.audio.sfx("door");
    $("#curtain").classList.add("on"); await sleep(330); W.leave(); $("#btnFurn").hidden = true; db.track("village");
    await sleep(80); $("#curtain").classList.remove("on"); W.setInputEnabled(true); busyNav = false;
  }
  function openConsole(id) { if (busyNav) return; OSW.audio.sfx("pop"); enterHouseDirect(id); }
  async function enterHouseDirect(id) {
    busyNav = true; W.setInputEnabled(false); $("#hud").hidden = true; $("#zoomctl").hidden = true; $("#guide").hidden = true; $("#joy").hidden = true; $("#btnSprint").hidden = true; $("#btnFurn").hidden = true; W.pause(true);
    ui.room.open(id); busyNav = false;
  }
  function furnTap(id) { if (placing) return; { const fi = G.state().furn[id]; if (fi && fi.item === "fridge") return goPlace("fridge"); } G.ui.finst = id; W.selectFurn(id); OSW.audio.sfx("pop"); P.open("furnitem"); const prev = ui.onModalClose; ui.onModalClose = () => { prev && prev(); W.selectFurn(null); W.setInputEnabled(true); }; }
  function startPlacing(item, moveId, rot) {
    placing = { item, move: moveId || null, rot: rot || 0 }; const F = OSW.FURN[item];
    $("#placeBar").hidden = false; $("#placeTxt").textContent = `${F.e} ${F.n}: اضغط عالأرض لتضعها`; W.setInputEnabled(true);
    W.setFloorHandler((x, z) => {
      if (!placing) return; const sx = Math.round(x * 2) / 2, sz = Math.round(z * 2) / 2, others = G.furnList();
      if (!OSW.HOME.valid(placing.item, sx, sz, placing.rot, others, placing.move)) { OSW.audio.sfx("pop"); return ui.toast("المكان مش مناسب 🚫 (فوق قطعة ثانية أو عند باب أو برا الغرفة)", "", 2200); }
      const mv = placing.move, it = placing.item, rt = placing.rot;
      (mv ? G.do("furn_move", { inst: mv, x: sx, z: sz, rot: rt }) : G.do("furn_place", { item: it, x: sx, z: sz, rot: rt })).then(() => {
        OSW.audio.sfx("coin"); ui.hearts("✨", 4);
        if (!mv && G.has("fu_" + it)) { $("#placeTxt").textContent = `${F.e} ${F.n}: بعدك معك قطع، كمّل أو اضغط ✖`; } else cancelPlacing();
      }).catch((e) => ui.toast("⚠️ " + esc(e.message)));
    });
  }
  function cancelPlacing() { placing = null; $("#placeBar").hidden = true; W.setFloorHandler(null); }
  function rotateFurn() {
    if (placing) { placing.rot = (placing.rot + 1) % 4; return ui.toast("🔄 دوّرتها", "", 900); }
    const f = G.state().furn[G.ui.finst]; if (!f) return;
    if (!OSW.HOME.valid(f.item, f.x, f.z, (f.rot + 1) % 4, G.furnList(), f.id)) return ui.toast("ما بتنفع تدور هون (ما في مكان) 🚫", "", 1800);
    G.do("furn_move", { inst: f.id, x: f.x, z: f.z, rot: f.rot + 1 }).then(() => { ui.closeModal(); OSW.audio.sfx("pop"); });
  }
  async function goSleep() {
    if (busyNav) return; busyNav = true; W.setInputEnabled(false);
    const f = $("#sleepFade"); f.classList.add("on"); OSW.audio.sfx("magic"); await sleep(2200);
    W.sleepTo(7.5); G.sync3d(); await sleep(600); f.classList.remove("on"); W.setInputEnabled(true); busyNav = false;
    ui.toast("☀️ صباح الخير! نمتوا زي الملوك", "gold", 4000); ui.hearts("💤", 10); ui.saveMy({ slept: (ui.my().slept || 0) + 1 }); P.checkAchievements();
  }
  Object.assign(app, { startPlacing, cancelPlacing, rotateFurn, sleep: goSleep, enterInterior, exitInterior });

  /* ---------- الإشعارات والتثبيت والنسخ الاحتياطي ---------- */
  function notify(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then((r) => r.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", dir: "rtl", lang: "ar", tag: "osw" }));
  }
  app.askNotifications = async () => { if (!("Notification" in window)) return ui.toast("المتصفح ما بيدعم الإشعارات"); const r = await Notification.requestPermission(); ui.toast(r === "granted" ? "تفعّلت الإشعارات 🔔" : "الإشعارات مقفلة من إعدادات المتصفح"); };
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.__installPrompt = e; });
  app.install = async () => { const p = window.__installPrompt; if (!p) return ui.toast("افتح قائمة المتصفح واختار «تثبيت التطبيق»"); p.prompt(); window.__installPrompt = null; };
  app.exportBackup = async () => {
    ui.toast("عم نجهّز النسخة… ⏳", "", 2500);
    const out = { app: "osw", exported: new Date().toISOString(), profiles: db.profiles, kv: db.kv, reactions: db.reactions, entries: [] };
    for (const e of db.entries) out.entries.push(Object.assign({}, e, { media: e.media_count ? await db.getMedia(e.id) : [] }));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" })); a.download = "our-small-world-backup-" + OSW.todayKey() + ".json"; a.click();
    ui.toast("نزلت النسخة الاحتياطية 💾", "gold");
  };

  /* ---------- واجهة الشاشة ---------- */
  function bindHud() {
    const snd = $("#btnSound"); snd.textContent = OSW.audio.enabled ? "🔊" : "🔇";
    snd.onclick = () => { const on = OSW.audio.toggle(); snd.textContent = on ? "🔊" : "🔇"; ui.toast(on ? "الصوت شغّال 🎶" : "الصوت مسكّر", "", 1500); };
    $("#btnAch").onclick = () => !busyNav && goPlace("ach"); $("#btnMenu").onclick = () => !busyNav && goPlace("gate");
    $("#btnTasks").onclick = () => !busyNav && goPlace("tasks"); $("#btnChat").onclick = () => OSW.chat.toggle(); $("#btnFurn").onclick = () => !busyNav && P.open("furniture"); $("#placeRot").onclick = () => rotateFurn(); $("#placeCancel").onclick = () => cancelPlacing();
    const sp = $("#btnSprint"); sp.onpointerdown = (e) => { e.preventDefault(); W.setSprint(true); sp.classList.add("on"); }; const spOff = () => { W.setSprint(false); sp.classList.remove("on"); }; sp.onpointerup = spOff; sp.onpointerleave = spOff; sp.onpointercancel = spOff; $("#coinPill").onclick = () => !busyNav && goPlace("inv"); $("#needPill").onclick = () => !busyNav && P.open("needs"); $("#dayPill").onclick = () => !busyNav && goPlace("plaza");
    $("#guide").onclick = guideTalk;
    $("#zoomctl").onclick = (e) => {
      const b = e.target.closest("[data-z]"); if (!b) return; const z = b.dataset.z;
      if (z === "in") W.zoomBy(1.25); else if (z === "out") W.zoomBy(1 / 1.25); else if (z === "walk") toggleWalk(); else if (W.mode === "in") { W.resetCam(); } else { W.resetCam(); W.goTo(0, 8); }
    };
  }

  /* ---------- الإقلاع ---------- */
  async function boot() {
    db = OSW.createDB(); ui = OSW.ui; W = OSW.world; P = OSW.places; G = OSW.game;
    ui.init(db); P.init(db); G.init(db, ui);
    const l = $("#loading");
    let wok = false; try { wok = W.init(); } catch (e) { console.error(e); l.classList.add("gone"); authCard(`<div class="logo">😕</div><h1>مشكلة برسم العالم</h1><p>${esc(e.message)}</p><button class="btn" onclick="location.reload()">جرّب مرة ثانية</button>`); return; }
    if (!wok) { l.classList.add("gone"); authCard(`<div class="logo">😕</div><h1>المتصفح ما بيدعم 3D</h1><p>جرّب كروم أو افتح الموقع من متصفح أحدث، وتأكد إنو تسريع الرسوم (Hardware acceleration) شغّال.</p><button class="btn" onclick="location.reload()">جرّب مرة ثانية</button>`); return; }
    bindHud();
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
    window.addEventListener("unhandledrejection", (e) => ui.toast("⚠️ " + esc((e.reason && e.reason.message) || e.reason), "", 5000));
    let status = "auth";
    const hang = setTimeout(() => { const ll = $("#loading"); if (ll && !ll.classList.contains("gone")) ll.querySelector("p").innerHTML = "الاتصال بطيء… استنى شوي أو <a href='check.html' style='color:#FFC24B'>افحص المشكلة</a>"; }, 12000);
    try { status = await db.start(); clearTimeout(hang); }
    catch (e) {
      clearTimeout(hang); l.classList.add("gone"); setTimeout(() => l.remove(), 800);
      authCard(`<div class="logo">😕</div><h1>مشكلة بالاتصال</h1><p>${esc(e.message)}</p><a class="btn" style="display:block;text-decoration:none;margin-bottom:10px" href="check.html">🔍 افحص المشكلة</a><button class="btn alt" onclick="location.reload()">جرّب مرة ثانية</button>`);
      return;
    }
    l.classList.add("gone"); setTimeout(() => l.remove(), 800); route(status);
  }
  OSW.app.state = () => ({ ready, busyNav });
  /* حارس الحركة: أي قائمة تتسكّر والاعب لسا واقف، بنرجّع الحركة لحالها */
  function inputGuard() {
    try {
      if (!ready || !introDone || !W || !ui) return;
      if (busyNav) { busySince = busySince || Date.now(); if (Date.now() - busySince > 30000) { busyNav = false; busySince = 0; $("#curtain").classList.remove("on"); } return; }
      busySince = 0;
      const dr = document.getElementById("drawRoom");
      if (!$("#modal").hidden || !$("#sheet").hidden || ui.state.room || $("#curtain").classList.contains("on") || (dr && !dr.hidden)) return;
      if (!W.inputOn) W.setInputEnabled(true);
      if (W.paused && OSW.R && OSW.R.gl && !OSW.R.gl.isContextLost()) W.pause(false);
    } catch (e) { /* ما نوقف اللعبة */ }
  }
  setInterval(inputGuard, 350);
  document.addEventListener("DOMContentLoaded", () => { if (OSW.ui) OSW.ui.afterModalClose = () => { if (OSW.game) OSW.game.shopId = null; setTimeout(inputGuard, 0); }; });
  document.addEventListener("DOMContentLoaded", boot);
})();
