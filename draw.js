/* غرفة تحدي الرسم: لوحتين (لوحتي + لوحة الشريك مباشرة)، تحدي عشوائي، مؤقت، وألبوم الرسمات */
(function () {
  const OSW = window.OSW, { esc } = OSW;
  const D = (OSW.draw = {});
  let db, ui, G, W, built = false, isOpen = false, tick = null, galTimer = null;
  const CW = 800, CH = 600;
  const COLORS = ["#2b2b3a", "#e5484d", "#ff8c42", "#ffd23f", "#7ac74f", "#12a594", "#4dabf7", "#2f5de0", "#9b5de5", "#ff7aa8", "#8a5a2b", "#ffffff"];
  const SIZES = [4, 9, 16, 28];
  const st = { mine: [], cur: null, his: [], live: {}, color: COLORS[0], size: 9, eraser: false, rid: null, buf: [], timer: null, sid: 0, autoDone: {}, hisSeen: 0 };
  const $ = (s) => document.querySelector(s);

  /* ---------- أفكار التحدي ---------- */
  const SUBJ = [["🦒", "زرافة", 1], ["🐘", "فيل", 0], ["🦖", "ديناصور", 0], ["🐱", "قطة", 1], ["🐰", "أرنب", 0], ["🐟", "سمكة", 1], ["🐧", "بطريق", 0], ["🐴", "حصان", 0], ["🐶", "كلب", 0], ["🐻", "دب", 0], ["🐙", "أخطبوط", 0], ["🐫", "جمل", 0], ["🐯", "نمر", 0], ["🦜", "ببغاء", 0], ["🐄", "بقرة", 1], ["🐔", "دجاجة", 1], ["🐑", "خروف", 0], ["🐢", "سلحفاة", 1], ["🐸", "ضفدع", 0], ["👨‍🚀", "رائد فضاء", 0], ["🧙", "ساحر", 0], ["🤖", "روبوت", 0], ["👸", "أميرة", 1], ["🏴‍☠️", "قرصان", 0], ["👨‍🍳", "طباخ", 0], ["🥷", "نينجا", 0], ["🍕", "بيتزا", 1], ["🍯", "كنافة", 1], ["🍲", "منسف", 0], ["☕", "كاسة شاي", 1], ["🚗", "سيارة", 1], ["🏰", "قلعة", 1], ["🌳", "شجرة", 1], ["🏠", "بيت", 0], ["🦄", "حصان وحيد القرن", 0], ["🐉", "تنين", 0]];
  const ACT = [["بيطير", "بتطير"], ["بيرقص", "بترقص"], ["بيسوق سيارة", "بتسوق سيارة"], ["بياكل بيتزا", "بتاكل بيتزا"], ["بيلعب كرة", "بتلعب كرة"], ["بيسبح", "بتسبح"], ["بينط عالحبل", "بتنط عالحبل"], ["بيغني", "بتغني"], ["بيطبخ", "بتطبخ"], ["بيركب دراجة", "بتركب دراجة"], ["بيصطاد سمك", "بتصطاد سمك"], ["بيقرا كتاب", "بتقرا كتاب"], ["نايم", "نايمة"], ["بيتزلج", "بتتزلج"], ["بيعزف جيتار", "بتعزف جيتار"], ["لابس نظارة شمس", "لابسة نظارة شمس"]];
  const PLC = ["فوق الغيم", "بالفضاء", "تحت البحر", "بوسط الصحرا", "عالقمر", "بالغابة", "فوق جبل ثلج", "بمطبخ ماما", "بعرس", "بالسوق", "عالشاطئ", "بالمدرسة", "بالملاهي", "بمحطة قطار", "بقلب المدينة"];
  const COUPLE = ["ارسموا بعض 😄 (كل واحد يرسم شريكه)", "ارسم أحلى ذكرى إلنا 📷", "ارسم بيتنا بعد 10 سنين 🏡", "ارسم أغنيتنا 🎵", "ارسم شريكك كأنه بطل خارق 🦸", "ارسم أول مرة تقابلنا فيها 🐣", "ارسم رحلة أحلامنا ✈️", "ارسم وجبتنا المفضلة 🍽️", "ارسم يومنا المثالي ☀️", "ارسم نفسك كحيوان 🐾", "ارسم قصتنا كفيلم 🎬", "ارسم هدية للشريك 🎁"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  D.randomPrompt = () => {
    if (Math.random() < 0.25) return pick(COUPLE);
    const [e, n, f] = pick(SUBJ), a = pick(ACT)[f], p = pick(PLC);
    return `${e} ${n} ${a} ${p}`;
  };

  /* ---------- الجولة ---------- */
  const round = () => (db.kv && db.kv["draw:round"]) || null;
  const mySub = (rid) => db.entries.find((e) => e.house === "game" && e.title === "draw" && e.data && e.data.round === rid && e.author === db.uid);
  const hisSub = (rid) => db.partner && db.entries.find((e) => e.house === "game" && e.title === "draw" && e.data && e.data.round === rid && e.author === db.partner.id);
  const endAt = (r) => (r && r.start && r.mins > 0 ? r.start + r.mins * 60000 : 0);
  const locked = () => { const r = round(); if (!r) return false; if (mySub(r.id)) return true; const e = endAt(r); return !!(e && Date.now() > e); };
  const lsKey = (rid) => "osw_draw:" + rid + ":" + db.uid;

  /* ---------- رسم ---------- */
  function paint(ctx, s, from) {
    const p = s.p; ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = s.s; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], s.s / 2, 0, 6.29); ctx.fill(); return; }
    const i0 = Math.max(1, from || 1); ctx.beginPath(); ctx.moveTo(p[i0 - 1][0], p[i0 - 1][1]);
    for (let i = i0; i < p.length; i++) { const m = i < p.length - 1 ? [(p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2] : p[i]; ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]); }
    ctx.stroke();
  }
  function redraw(cv, strokes, extra) { const c = cv.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, CW, CH); strokes.forEach((s) => paint(c, s, 0)); (extra || []).forEach((s) => paint(c, s, 0)); }
  const cvMine = () => $("#drMine"), cvHis = () => $("#drHis");
  const save = () => { const r = round(); if (r) try { localStorage.setItem(lsKey(r.id), JSON.stringify(st.mine)); } catch (e) {} };
  const send = (o) => { const r = round(); if (db.sendDraw && r) db.sendDraw(Object.assign({ r: r.id }, o)); };
  function flush(end) {
    if (!st.cur) return; const pts = st.buf; st.buf = [];
    if (pts.length || end) send({ k: "pts", sid: st.cur.sid, c: st.cur.c, s: st.cur.s, p: pts, end: end ? 1 : 0 });
  }
  const pos = (e, cv) => { const r = cv.getBoundingClientRect(); return [Math.round(((e.clientX - r.left) / r.width) * CW), Math.round(((e.clientY - r.top) / r.height) * CH)]; };
  function bindCanvas() {
    const cv = cvMine(); let down = false;
    cv.addEventListener("pointerdown", (e) => {
      if (locked()) return D.toast("🔒 اللوحة مقفلة (سلّمتوا أو خلص الوقت)"); down = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      const pt = pos(e, cv); st.cur = { c: st.eraser ? "#ffffff" : st.color, s: st.eraser ? st.size * 1.8 : st.size, p: [pt], sid: ++st.sid + "" + db.uid.slice(0, 4) }; st.buf = [pt[0], pt[1]];
      paint(cv.getContext("2d"), st.cur, 0); clearTimeout(st.timer); st.timer = setInterval(() => flush(false), 140); e.preventDefault();
    });
    cv.addEventListener("pointermove", (e) => {
      if (!down || !st.cur) return; const pt = pos(e, cv), l = st.cur.p[st.cur.p.length - 1]; if (Math.hypot(pt[0] - l[0], pt[1] - l[1]) < 2) return;
      st.cur.p.push(pt); st.buf.push(pt[0], pt[1]); paint(cv.getContext("2d"), st.cur, st.cur.p.length - 1); e.preventDefault();
    });
    const up = () => { if (!down) return; down = false; clearInterval(st.timer); flush(true); st.mine.push(st.cur); st.cur = null; save(); };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  }

  /* ---------- استقبال لوحة الشريك مباشرة ---------- */
  function onMsg(m) {
    if (!isOpen || !db.partner || m.u !== db.partner.id) return; const r = round(); if (!r || m.r !== r.id) return;
    st.hisSeen = Date.now(); live();
    if (m.k === "hello") send({ k: "sync", strokes: st.mine.slice(-120) });
    else if (m.k === "sync") { st.his = m.strokes || []; redraw(cvHis(), st.his); }
    else if (m.k === "pts") {
      const L = (st.live[m.sid] = st.live[m.sid] || { c: m.c, s: m.s, p: [] }), from = L.p.length;
      for (let i = 0; i + 1 < m.p.length; i += 2) L.p.push([m.p[i], m.p[i + 1]]);
      if (L.p.length) paint(cvHis().getContext("2d"), L, from > 0 ? from : 1);
      if (m.end) { st.his.push(L); delete st.live[m.sid]; }
    } else if (m.k === "undo") { st.his.pop(); redraw(cvHis(), st.his); }
    else if (m.k === "clear") { st.his = []; redraw(cvHis(), st.his); }
  }
  function live() { const d = $("#drLive"); if (d) d.classList.toggle("on", Date.now() - st.hisSeen < 9000); }

  /* ---------- واجهة ---------- */
  D.toast = (m) => ui.toast(m, "", 2200);
  function build() {
    if (built) return; built = true;
    const el = document.createElement("div"); el.id = "drawRoom"; el.hidden = true; document.body.appendChild(el);
    el.addEventListener("click", onClick); el.addEventListener("change", (e) => { if (e.target.id === "drMins") { const r = round(); if (r && !r.start) db.kvSet("draw:round", Object.assign({}, r, { mins: +e.target.value })); else st.mins = +e.target.value; } });
    db.on("draw", onMsg);
    db.on("change", (ev) => { if (!isOpen) return; if (ev.table === "kv" && ev.row && ev.row.key === "draw:round") syncRound(); else if (ev.table === "entries" || ev.table === "all") { clearTimeout(galTimer); galTimer = setTimeout(() => { head(); gallery(); }, 200); } });
  }
  function shell() {
    const he = db.partner ? db.partner.name : "شريكي";
    $("#drawRoom").innerHTML = `<div class="dr-in">
      <div class="dr-top"><button class="dr-back" data-dr="back" aria-label="رجوع">➜</button><b>🎨 غرفة تحدي الرسم</b><span class="dr-coins">🪙 ${G.state().coins}</span></div>
      <div class="dr-chal" id="drChal"></div>
      <div class="dr-board"><div class="dr-lbl"><i style="background:${esc(db.me.color)}"></i>لوحتي <span id="drLock"></span></div><canvas id="drMine" width="${CW}" height="${CH}"></canvas></div>
      <div class="dr-tools" id="drTools"></div>
      <div class="dr-board his"><div class="dr-lbl"><i style="background:${esc(db.partner ? db.partner.color : "#999")}"></i>لوحة ${esc(he)} <span class="dr-live" id="drLive">● مباشر</span></div><canvas id="drHis" width="${CW}" height="${CH}"></canvas></div>
      <div class="dr-sub"><button class="btn berry" data-dr="submit" id="drSubmit">📤 سلّم رسمتي</button></div>
      <h4 class="dr-h">🖼️ ألبوم الرسمات</h4><div id="drGal"></div></div>`;
    tools(); bindCanvas();
  }
  function tools() {
    $("#drTools").innerHTML = `<div class="dr-colors">${COLORS.map((c) => `<button class="dr-c ${!st.eraser && st.color === c ? "on" : ""}" data-dr="color" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>
      <div class="dr-row">${SIZES.map((s) => `<button class="dr-s ${st.size === s ? "on" : ""}" data-dr="size" data-v="${s}" aria-label="حجم ${s}"><i style="width:${Math.max(6, s * 0.7)}px;height:${Math.max(6, s * 0.7)}px"></i></button>`).join("")}
      <button class="dr-t ${st.eraser ? "on" : ""}" data-dr="eraser">🧽 ممحاة</button><button class="dr-t" data-dr="undo">↩️ تراجع</button><button class="dr-t" data-dr="clear">🗑️ مسح</button></div>`;
  }
  function head() {
    const r = round(), el = $("#drChal"); if (!el) return;
    const me = r && mySub(r.id), he = r && hisSub(r.id), e = endAt(r), left = e ? Math.max(0, e - Date.now()) : 0, mins = r ? r.mins : st.mins == null ? 2 : st.mins;
    const sel = `<select id="drMins" class="dr-sel" ${r && r.start ? "disabled" : ""}>${[[1, "دقيقة"], [2, "دقيقتين"], [3, "3 دقايق"], [5, "5 دقايق"], [0, "بدون وقت"]].map(([v, t]) => `<option value="${v}" ${v === mins ? "selected" : ""}>${t}</option>`).join("")}</select>`;
    const html = r ? `<div class="dr-prompt">${esc(r.prompt)}</div>
      <div class="dr-ctl">${r.start && r.mins > 0 ? `<div class="dr-timer" id="drTimer"></div>` : r.start ? `<div class="dr-timer">✏️ ارسموا على راحتكم</div>` : `${sel}<button class="btn gold sm" data-dr="start">▶ ابدأ التحدي</button>`}
      <button class="btn alt sm" data-dr="new">🎲 تحدي جديد</button></div>
      <div class="dr-state"><span class="${me ? "ok" : ""}">${me ? "✅" : "⬜"} أنا</span><span class="${he ? "ok" : ""}">${he ? "✅" : "⬜"} ${esc(db.partner ? db.partner.name : "الشريك")}</span><small>الاثنين لما يسلموا: +20🪙 🎁</small></div>`
      : `<div class="dr-prompt">جاهزين؟ 🎨</div><div class="dr-ctl">${sel}<button class="btn gold" data-dr="new">🎲 اسحب تحدي عشوائي</button></div><div class="dr-state"><small>بتطلع فكرة عشوائية (زي زرافة بتطير!) وبترسموا سوا، كل واحد على لوحته، وبتشوفوا بعض مباشرة 👀</small></div>`;
    const key = html + "|" + (me ? 1 : 0) + (he ? 1 : 0);
    if (el.dataset.k !== key) { el.innerHTML = html; el.dataset.k = key; }
    const tm = $("#drTimer"); if (tm) { tm.textContent = left > 0 ? "⏳ " + String(Math.floor(left / 60000)).padStart(2, "0") + ":" + String(Math.floor((left % 60000) / 1000)).padStart(2, "0") : "⏰ خلص الوقت!"; tm.classList.toggle("hot", left < 15000 && left > 0); }
    const lk = $("#drLock"); if (lk) lk.textContent = locked() ? "🔒" : "";
    const sb = $("#drSubmit"); if (sb) { sb.disabled = !r || !!me || locked() && !me && false; sb.textContent = me ? "✅ سلّمت رسمتك" : "📤 سلّم رسمتي"; }
  }
  function syncRound() {
    const r = round(), rid = r ? r.id : null;
    if (rid !== st.rid) {
      st.rid = rid; st.mine = []; st.his = []; st.live = {}; st.autoDone = {};
      if (r) { try { st.mine = JSON.parse(localStorage.getItem(lsKey(rid))) || []; } catch (e) {} }
      redraw(cvMine(), st.mine); redraw(cvHis(), st.his);
      if (r) { send({ k: "hello" }); const he = hisSub(rid); if (he) loadHis(he); }
    }
    head();
  }
  async function loadHis(e) { try { const m = await db.getMedia(e.id); if (m && m[0]) { const im = new Image(); im.onload = () => { const c = cvHis().getContext("2d"); c.drawImage(im, 0, 0, CW, CH); }; im.src = m[0]; } } catch (_) {} }
  function gallery() {
    const el = $("#drGal"); if (!el) return;
    const subs = db.entries.filter((e) => e.house === "game" && e.title === "draw" && e.data && e.data.round), by = {};
    subs.forEach((e) => ((by[e.data.round] = by[e.data.round] || { prompt: e.data.prompt, t: e.created_at, list: [] }).list.push(e)));
    const rs = Object.values(by).sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 12);
    el.innerHTML = rs.map((r) => `<div class="dr-card"><div class="dr-cp">${esc(r.prompt)}</div><div class="dr-pair">${r.list.map((e) => `<figure><img data-id="${e.id}" alt="رسمة"><figcaption><i style="background:${esc(ui.prof(e.author).color)}"></i>${esc(ui.prof(e.author).name)}</figcaption><div class="dr-rx">${["❤️", "😂", "👏", "🔥"].map((em) => { const n = ui.reacts(e.id).filter((x) => x.emoji === em).length; const on = ui.reacts(e.id).some((x) => x.emoji === em && x.author === db.uid); return `<button class="${on ? "on" : ""}" data-dr="react" data-id="${e.id}" data-v="${em}">${em}${n || ""}</button>`; }).join("")}</div></figure>`).join("")}</div></div>`).join("") || `<div class="empty"><span class="big">🖼️</span>لسا ما في رسمات. سلّموا أول تحدي!</div>`;
    el.querySelectorAll("img[data-id]").forEach(async (im) => { try { const m = await db.getMedia(im.dataset.id); if (m && m[0]) im.src = m[0]; } catch (_) {} });
  }
  async function submit(auto) {
    const r = round(); if (!r || mySub(r.id)) return; if (!st.mine.length && !auto) return D.toast("ارسم شي أول 🙂");
    const tmp = document.createElement("canvas"); tmp.width = 560; tmp.height = 420; const c = tmp.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, 560, 420); c.drawImage(cvMine(), 0, 0, 560, 420);
    const url = tmp.toDataURL("image/jpeg", 0.8);
    try { await db.addEntry({ house: "game", title: "draw", data: { round: r.id, prompt: r.prompt }, media: [url] }); } catch (e) { return ui.toast("⚠️ " + esc(e.message)); }
    G.sync3d(); OSW.audio.sfx("fanfare"); ui.hearts("🎨", 12); D.toast(auto ? "⏰ انسلّمت رسمتك تلقائياً" : "🎨 سلّمت رسمتك!");
    if (hisSub(r.id)) { ui.hearts("🪙", 14); }
    head(); gallery(); const co = document.querySelector(".dr-coins"); if (co) co.textContent = "🪙 " + G.state().coins; if (OSW.app) OSW.app.checkAchievements();
  }
  function onClick(e) {
    const b = e.target.closest("[data-dr]"); if (!b) { const im = e.target.closest(".dr-card img"); if (im) im.classList.toggle("zoom"); return; }
    const a = b.dataset.dr;
    if (a === "back") return D.close();
    if (a === "color") { st.color = b.dataset.v; st.eraser = false; return tools(); }
    if (a === "size") { st.size = +b.dataset.v; return tools(); }
    if (a === "eraser") { st.eraser = !st.eraser; return tools(); }
    if (a === "undo") { if (locked()) return; st.mine.pop(); redraw(cvMine(), st.mine); save(); send({ k: "undo" }); return; }
    if (a === "clear") { if (locked()) return; st.mine = []; redraw(cvMine(), st.mine); save(); send({ k: "clear" }); return; }
    if (a === "new") { const sel = $("#drMins"), mins = sel ? +sel.value : 2, r = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), prompt: D.randomPrompt(), start: null, mins }; OSW.audio.sfx("magic"); ui.hearts("🎲", 8); return db.kvSet("draw:round", r); }
    if (a === "start") { const r = round(); if (r) { const sel = $("#drMins"); OSW.audio.sfx("fanfare"); return db.kvSet("draw:round", Object.assign({}, r, { start: Date.now(), mins: sel ? +sel.value : r.mins })); } }
    if (a === "submit") return submit(false);
    if (a === "react") return db.react(b.dataset.id, b.dataset.v).then(() => gallery()).catch((er) => ui.toast("⚠️ " + esc(er.message)));
  }
  D.open = () => {
    ui = OSW.ui; db = ui.db; G = OSW.game; W = OSW.world; build(); shell(); isOpen = true; st.rid = null; st.hisSeen = 0;
    $("#drawRoom").hidden = false; syncRound(); gallery(); live();
    clearInterval(tick); tick = setInterval(() => {
      if (!isOpen) return; const r = round(); head(); live();
      const e = endAt(r); if (r && e && Date.now() > e && !mySub(r.id) && !st.autoDone[r.id]) { st.autoDone[r.id] = 1; if (st.mine.length) submit(true); }
    }, 500);
    db.track && db.track("draw");
  };
  D.close = () => { isOpen = false; clearInterval(tick); const el = $("#drawRoom"); if (el) el.hidden = true; ui.closeModal(); };
  const hook = () => { if (OSW.game && OSW.game.openers) OSW.game.openers.draw = () => D.open(); else setTimeout(hook, 50); };
  hook();
})();
