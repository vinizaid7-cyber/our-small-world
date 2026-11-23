/* الأنشطة المشتركة (V11): إطار الجلسات + الألعاب. كل شي محفوظ كأحداث game بجدول entries (نفس نظام اللعبة)، فبيتزامن
   تلقائياً بين التلفونين وبينحفظ. الإطار: act_new (دعوة) → act_join → act_go (بداية) → act_res/act_mv (نتائج وحركات) → مكافأة وحدة بالـfold.
   ألعاب المهارة (كارتينغ، حصاد، صيد، تنظيف، مهرجان، ترميم، تصوير) هون، والألعاب التعاونية بدور (طبخ، كنز، توصيل، مطعم، طاولة، تصميم) بـ activities2.js */
(function () {
  const OSW = window.OSW, G = OSW.game, esc = OSW.esc;
  const A = (OSW.act = { GAMES: {}, P: {}, cleanups: [], cur: null, _fs: {} });
  const MIN = 60000, DAYCAP = 160;
  const ui = () => OSW.ui, db = () => OSW.ui.db, W = () => OSW.world;
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (s) => OSW.seeded(hash(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  A.hash = hash; A.rng = rng;
  const dayKey = (t) => Math.floor((t + 3 * 3600000) / 86400000);

  /* ============ الحالة (fold) ============ */
  const root = (S) => S.act || (S.act = { sess: {}, day: {}, rest: { stage: 0, by: {}, done: 0 }, fest: {}, photo: {}, layouts: {}, stat: {} });
  const order = (s) => Object.keys(s.p).sort((x, y) => (s.p[x].j - s.p[y].j) || (x < y ? -1 : 1)); // ترتيب الانضمام: الأول = صاحب الدعوة
  A.order = order;
  const rewardNow = (S, s, t, day, H) => {
    const g = A.GAMES[s.kind], R = root(S), dd = (R.day[day] = R.day[day] || { coins: 0, runs: {} });
    const r = g.reward(s) || { coins: 0 }, runs = (dd.runs[s.kind] = (dd.runs[s.kind] || 0) + 1), full = runs <= 3;
    let c = Math.round((r.coins || 0) * (full ? 1 : 0.25)); c = Math.max(0, Math.min(c, DAYCAP - dd.coins)); dd.coins += c; S.coins += c;
    const items = full ? r.items || {} : {}; Object.keys(items).forEach((k) => { if (k.indexOf("@f:") === 0) { S.fridge = S.fridge || {}; S.fridge[k.slice(3)] = (S.fridge[k.slice(3)] || 0) + items[k]; } else H.add(k, items[k]); });
    s.paid = { coins: c, items, text: r.text || "", full, t };
    if (s.kind) { const st = (R.stat[s.kind] = R.stat[s.kind] || { n: 0, best: 0 }); st.n++; st.best = Math.max(st.best, r.best || 0); }
  };
  A.fold = (ty, e, d, t, a, day, S, H) => {
    const R = root(S);
    switch (ty) {
      case "act_new": { const g = A.GAMES[d.kind]; if (!g) return true; R.sess[e.id] = { id: e.id, kind: d.kind, host: a, t0: t, go: 0, p: { [a]: { j: t, res: null } }, ev: [], st: null, paid: null, done: 0, seed: hash(e.id) }; if (g.init) g.init(R.sess[e.id], rng(e.id)); H.mark(); return true; }
      case "act_join": { const s = R.sess[d.sid]; if (!s || s.go || Object.keys(s.p).length >= 2 || s.p[a]) return true; s.p[a] = { j: t, res: null }; return true; }
      case "act_go": { const s = R.sess[d.sid]; if (!s || s.go || s.host !== a || Object.keys(s.p).length < 2) return true; s.go = t; return true; }
      case "act_cancel": { const s = R.sess[d.sid]; if (s && !s.go && s.host === a) s.done = 1; return true; }
      case "act_res": { const s = R.sess[d.sid], g = s && A.GAMES[s.kind]; if (!s || !s.go || s.paid || !s.p[a] || s.p[a].res || !g.par) return true; if (t < s.go + g.min || t > s.go + g.max) return true; const r = g.clean(d.r || {}); if (!r) return true; s.p[a].res = r; if (order(s).every((u) => s.p[u].res)) { s.done = 1; rewardNow(S, s, t, day, H); H.mark(); } return true; }
      case "act_mv": { const s = R.sess[d.sid], g = s && A.GAMES[s.kind]; if (!s || !s.go || s.paid || !s.p[a] || !g.mv) return true; if (g.mv(s, a, d.m || {}, t)) { s.ev.push(Object.assign({ a, t }, d.m)); if (s.ev.length > 400) s.ev.shift(); } if (g.complete(s, t)) { s.done = 1; rewardNow(S, s, t, day, H); H.mark(); } return true; }
      case "act_fin": { const s = R.sess[d.sid], g = s && A.GAMES[s.kind]; if (!s || !s.go || s.paid || !g.fin || t < s.go + g.dur - 2500) return true; s.done = 1; rewardNow(S, s, t, day, H); H.mark(); return true; }
      case "rest_done": { const r = R.rest; if (d.stage !== r.stage || r.stage >= 6 || !(d.score >= 0 && d.score <= 100) || r.by[a]) return true; r.by[a] = d.score; if (Object.keys(r.by).length >= 2) { r.stage++; r.by = {}; S.coins += 20 + 10 * r.stage; if (r.stage >= 6) { H.add("fu_statue", 1); H.add("fu_kilimStand", 1); H.add("fu_archMirror", 1); r.done = t; } H.mark(); } return true; }
      case "fest_st": { const f = A.festival(t); if (!f || !["lantern", "fire", "food"].includes(d.st) || d.day !== day) return true; const k = day, F = (R.fest[k] = R.fest[k] || { by: {}, paid: 0 }); (F.by[a] = F.by[a] || {})[d.st] = 1; if (!F.paid && Object.keys(F.by).length >= 2 && Object.values(F.by).every((o) => o.lantern && o.fire && o.food)) { F.paid = 1; S.coins += 90; H.add("fu_lanternR", 1); H.mark(); } return true; }
      case "photo_ok": { const k = day + ":" + d.m; const P = (R.photo[k] = R.photo[k] || {}); if (P[a] || !A.MISSIONS.some((m) => m.id === d.m)) return true; P[a] = t; S.coins += 12; if (Object.keys(P).length >= 2) S.coins += 10; H.mark(); return true; }
      case "furn_tint": { const f = S.furn[d.inst]; if (!f || S.coins < 15 || !(OSW.FURN_TINTS || []).concat([null]).includes(d.tint || null)) return true; S.coins -= 15; if (d.tint) f.tint = d.tint; else delete f.tint; H.mark(); return true; }
      case "layout_save": { const n = String(d.name || "").trim().slice(0, 20); if (!n) return true; const L = Object.keys(R.layouts); if (!R.layouts[n] && L.length >= 12) return true; R.layouts[n] = Object.values(S.furn).map((f) => ({ item: f.item, x: f.x, z: f.z, rot: f.rot, tint: f.tint || null })); H.mark(); return true; }
      case "layout_del": { delete R.layouts[d.name]; return true; }
      case "layout_load": {
        const L = R.layouts[d.name]; if (!L) return true;
        Object.values(S.furn).forEach((f) => { H.add("fu_" + f.item, 1); delete S.furn[f.id]; });
        L.forEach((x, i) => { if ((S.inv["fu_" + x.item] || 0) < 1) return; if (!OSW.HOME.valid(x.item, x.x, x.z, x.rot, Object.values(S.furn), null)) return; H.add("fu_" + x.item, -1); const id = e.id + ":" + i; S.furn[id] = { id, item: x.item, x: x.x, z: x.z, rot: x.rot }; if (x.tint) S.furn[id].tint = x.tint; }); H.mark(); return true;
      }
      case "furn_clear": { const room = OSW.HOME.byId[d.room]; if (!room) return true; Object.values(S.furn).forEach((f) => { if (f.x >= room.x0 && f.x < room.x1 && f.z >= room.z0 && f.z < room.z1) { H.add("fu_" + f.item, 1); delete S.furn[f.id]; } }); H.mark(); return true; }
    }
    if (ty.indexOf("act_") === 0 || ty.indexOf("des_") === 0) return OSW.act2 && OSW.act2.fold ? OSW.act2.fold(ty, e, d, t, a, day, S, H) : true;
    return false;
  };
  A.R = () => root(G.state());
  A.sess = (id) => A.R().sess[id] || null;
  A.mine = () => { const me = db().uid, now = Date.now(); return Object.values(A.R().sess).filter((s) => !s.done && s.p[me] && now - s.t0 < 25 * MIN).sort((x, y) => y.t0 - x.t0)[0] || null; };
  A.invites = () => { const me = db().uid, now = Date.now(); return Object.values(A.R().sess).filter((s) => !s.done && !s.go && !s.p[me] && s.host !== me && now - s.t0 < 10 * MIN); };
  A.send = async (type, data) => { const row = await db().addEntry({ house: "game", title: type, data }); G.sync3d(); return row; };

  /* ============ المهرجان والمهام اليومية ============ */
  A.THEMES = [["مهرجان الفوانيس", "🏮"], ["مهرجان الورد", "🌹"], ["مهرجان الحصاد", "🌾"], ["مهرجان النجوم", "✨"]];
  A.festival = (t) => { const d = new Date(t + 3 * 3600000), wd = d.getUTCDay(), day = dayKey(t); const occ = OSW.extras && OSW.extras.today && OSW.extras.today.length; if (wd !== 5 && wd !== 6 && !occ) return null; const th = A.THEMES[hash("fest" + day) % 4]; return { day, n: th[0], e: th[1] }; };
  A.MISSIONS = [
    { id: "fount", t: "سيلفي الاثنين عند النافورة ⛲", poi: "fountain", pair: 1 }, { id: "light", t: "صورة عند المنارة 🗼", poi: "lighthouse" },
    { id: "farm", t: "صورة بالمزرعة 🌾", poi: "farm" }, { id: "sunset", t: "صورة وقت الغروب (5-7 مساءً) 🌇", hours: [17, 19] },
    { id: "night", t: "صورة ليلية مع بعض 🌙", hours: [20, 28], pair: 1 }, { id: "tree", t: "صورة عند الشجرة الكبيرة 🌳", poi: "tree" },
    { id: "hug", t: "صورة قريبين من بعض (أقل من 4 م) 🤗", pair: 1, near: 4 }, { id: "home", t: "صورة قدام بيتكم 🏡", poi: "home" },
  ];
  A.missionsToday = () => { const d = dayKey(Date.now()); return A.MISSIONS.map((m) => [hash("ms" + d + m.id), m]).sort((x, y) => x[0] - y[0]).slice(0, 3).map((x) => x[1]); };
  A.missionOk = (m) => {
    try {
      const w = W(), me = w.getMe(), h = (new Date(Date.now() + 3 * 3600000).getUTCHours() + 24) % 24; if (w.mode !== "out") return "اطلعوا للقرية أول 🚪";
      if (m.hours && !(h >= m.hours[0] && (h < m.hours[1] || (m.hours[1] > 24 && h < m.hours[1] - 24 + 24 && (h >= m.hours[0] || h < m.hours[1] - 24))))) return "الوقت مش مناسب هلأ ⏰";
      if (m.poi) { const p = w.S.poi && w.S.poi[m.poi]; if (!p) return "المكان مش متاح"; if (Math.hypot(me.x - p.x, me.z - p.z) > 12) return "قرّب أكتر من المكان 📍"; }
      if (m.pair && w.partnerDist() > (m.near || 8)) return "شريكك لازم يكون جنبك 💞"; return null;
    } catch (e) { return "جرّب من القرية"; }
  };

  /* ============ الواجهة العامة (overlay) ============ */
  const el = () => { let o = document.getElementById("actRoom"); if (!o) { o = document.createElement("div"); o.id = "actRoom"; o.hidden = true; document.body.appendChild(o); } return o; };
  A.open = (sid) => {
    const o = el(); A.cur = sid; o.hidden = false; document.documentElement.classList.add("actOn");
    try { W().setInputEnabled(false); } catch (e) { /* */ }
    OSW.places.noRefresh = OSW.places.noRefresh || {}; try { ui().closeModal(); } catch (e) { /* */ } A.view();
  };
  A.close = () => { A._tk = null; A._shownId = null; A.busy = false; A.cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* */ } }); const o = el(); o.hidden = true; o.innerHTML = ""; A.cur = null; A.playing = null; document.documentElement.classList.remove("actOn"); try { W().setInputEnabled(true); } catch (e) { /* */ } };
  const shell = (title, body, foot) => { el().innerHTML = `<div class="act-card"><div class="act-head"><b>${title}</b><button class="act-x" data-a="close">✕</button></div><div class="act-body" id="actBody">${body}</div>${foot ? `<div class="act-foot">${foot}</div>` : ""}</div>`; };
  A.shell = shell;
  const who = (u) => esc(ui().prof(u).name);
  A.view = () => { // يعرض شاشة الجلسة حسب حالتها
    if (!A.cur) return; const s = A.sess(A.cur), me = db().uid; if (!s) return A.close(); const g = A.GAMES[s.kind]; if (A.playing === s.id && !s.done && !s.paid) return; // لعب محلي شغّال: ما نقاطعه
    if (s.paid || s.done) return A.resultView(s);
    const ps = order(s), joined = !!s.p[me], pn = db().partner ? db().partner.name : "شريكك";
    if (!s.go) {
      const roles = g.roles ? g.roles(s).map((r) => `<div class="chk">${r}</div>`).join("") : "";
      shell(`${g.e} ${g.n}`, `<p class="hint">${esc(g.desc)}</p>${roles}<div class="two">${ps.map((u) => `<div class="chk ok">✅ ${who(u)}</div>`).join("")}${ps.length < 2 ? `<div class="chk">⏳ بانتظار ${esc(pn)}…</div>` : ""}</div>`,
        (!joined ? `<button class="btn berry" data-a="join">🙋 انضم</button>` : s.host === me ? `<button class="btn gold" data-a="go" ${ps.length < 2 ? "disabled" : ""}>🚀 يلا نبدأ!</button><button class="btn alt" data-a="cancel">إلغاء</button>` : `<span class="hint">بانتظار ${who(s.host)} يبدأ…</span>`));
      return;
    }
    A.play(s);
  };
  A.resultView = (s) => {
    const g = A.GAMES[s.kind], p = s.paid; const lines = g.summary ? g.summary(s) : "";
    shell(`${g.e} ${g.n} — النتيجة`, `<div class="pick">${lines}</div>${p ? `<div class="chk ok" style="justify-content:center;margin:10px 0">🪙 +${p.coins}${Object.keys(p.items || {}).map((k) => " · " + (k.indexOf("@f:") === 0 ? "🍽️ وجبة بالثلاجة" : (G.ITEM[k] ? G.ITEM[k].e + " " + G.ITEM[k].n : k)) + " ×" + p.items[k]).join("")}${p.full ? "" : " <small>(حد التكرار اليومي)</small>"}</div>` : `<p class="hint">بانتظار شريكك يخلّص…</p>`}`, `<button class="btn alt" data-a="close">تمام</button>`);
    if (p && !s._shown) { s._shown = 1; OSW.audio.sfx("fanfare"); ui().hearts("🎉", 12); }
  };
  A.play = (s) => { // بداية اللعب المحلي
    const g = A.GAMES[s.kind], me = db().uid;
    if (g.par) { if (s.p[me].res) { shell(`${g.e} ${g.n}`, `<div class="pick">خلّصت! بانتظار ${esc(db().partner ? db().partner.name : "شريكك")}… ⏳</div><p class="hint">نتيجتك: ${esc(g.show ? g.show(s.p[me].res) : "")}</p>`, ""); return; }
      if (A.playing === s.id) return; A.playing = s.id; shell(`${g.e} ${g.n}`, `<div id="actGame"></div>`, ""); const box = document.getElementById("actGame");
      g.run(box, s, (r) => { A.playing = null; A.send("act_res", { sid: s.id, r }).catch((e) => ui().toast("⚠️ " + esc(e.message))); }); return; }
    if (!A._tk) A._tk = timer(() => { const c = A.cur && A.sess(A.cur); if (!c || c.done) return; const gg = A.GAMES[c.kind]; if (gg.fin && Date.now() >= c.go + gg.dur && !A._fs[c.id]) { A._fs[c.id] = 1; A.send("act_fin", { sid: c.id }).catch(() => {}); } if (gg.tick && !A.busy) A.view(); }, 1000);
    if (A.busy) return; if (!document.getElementById("actBody") || A._shownId !== s.id) { shell(`${g.e} ${g.n}`, "", `<span class="hint">${g.e} ${esc(g.n)}</span>`); A._shownId = s.id; }
    g.view(s, document.getElementById("actBody"));
  };
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest("#actRoom [data-a]"); if (!b) return; const a = b.dataset.a, s = A.cur && A.sess(A.cur);
    if (a === "close") return A.close();
    if (a === "join" && s) return A.send("act_join", { sid: s.id }).then(A.view).catch(() => {});
    if (a === "go" && s) return A.send("act_go", { sid: s.id }).then(A.view).catch(() => {});
    if (a === "cancel" && s) return A.send("act_cancel", { sid: s.id }).then(A.close).catch(() => {});
    if (A.GAMES[s && s.kind] && A.GAMES[s.kind].click) A.GAMES[s.kind].click(a, b, s);
  });
  A.start = async (kind) => {
    const mine = A.mine(); if (mine && !mine.go && mine.host === db().uid) return A.open(mine.id);
    const row = await A.send("act_new", { kind }); A.open(row.id);
  };

  /* ============ لبنات اللعب (Primitives) ============ */
  const P = A.P, raf = (f) => { let on = true, id; const loop = (t) => { if (!on) return; f(t); id = requestAnimationFrame(loop); }; id = requestAnimationFrame(loop); const stop = () => { on = false; cancelAnimationFrame(id); }; A.cleanups.push(stop); return stop; };
  const timer = (f, ms) => { const id = setInterval(f, ms); const stop = () => clearInterval(id); A.cleanups.push(stop); return stop; };
  const canvasIn = (box, w, h) => { box.innerHTML = `<canvas id="actCv" width="${w}" height="${h}" style="width:100%;max-width:${w}px;touch-action:none;border-radius:14px;background:#0e1030;display:block;margin:0 auto"></canvas>`; const c = box.firstChild; return [c, c.getContext("2d")]; };
  const ptrX = (c, ev) => { const r = c.getBoundingClientRect(); return ((ev.clientX - r.left) / r.width) * c.width; };
  const ptrY = (c, ev) => { const r = c.getBoundingClientRect(); return ((ev.clientY - r.top) / r.height) * c.height; };

  /* توقيت: مؤشر بيروح ويجي وبتضغط لما يكون بالمنطقة الخضرا */
  P.timing = (box, o) => new Promise((res) => {
    const hits = o.hits || 5, sp = o.speed || 1, zw = o.zone || 0.2; let n = 0, tot = 0, x = 0, dir = 1, zc = Math.random() * (1 - zw) + zw / 2;
    box.innerHTML = `<p class="hint">${o.label || "اضغط لما المؤشر يكون بالأخضر"} (${hits})</p><div class="tm-bar"><i class="tm-z"></i><i class="tm-c"></i></div><button class="btn gold tm-btn">${o.btn || "الحين!"}</button><div class="tm-n"></div>`;
    const z = box.querySelector(".tm-z"), c = box.querySelector(".tm-c"), nn = box.querySelector(".tm-n"); const setZ = () => { z.style.left = (zc - zw / 2) * 100 + "%"; z.style.width = zw * 100 + "%"; }; setZ();
    const stop = raf(() => { x += dir * 0.016 * sp * (0.9 + n * 0.12); if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } c.style.left = x * 100 + "%"; });
    box.querySelector(".tm-btn").onclick = () => { const d = Math.abs(x - zc); tot += clamp(1 - d / (zw * 1.6), 0, 1); n++; OSW.audio.sfx(d < zw / 2 ? "coin" : "pop"); nn.textContent = (d < zw / 2 ? "✅ " : "❌ ") + n + "/" + hits; zc = Math.random() * (1 - zw) + zw / 2; setZ(); if (n >= hits) { stop(); res(Math.round((tot / hits) * 100)); } };
  });
  /* تذكّر التسلسل */
  P.seq = (box, o) => new Promise((res) => {
    const len = o.len || 4, icons = o.icons || ["🍅", "🧅", "🧄", "🌶️", "🥕", "🧂", "🍋", "🌿"], r = A.rng("seq" + (o.seed || Math.random())), pat = Array.from({ length: len }, () => Math.floor(r() * icons.length)); let i = 0, ans = [], show = true;
    const draw = () => { box.innerHTML = show ? `<p class="hint">${o.label || "احفظ الترتيب 👀"}</p><div class="sq-show">${pat.map((p, k) => `<span class="sq-i" style="animation-delay:${k * 0.7}s">${icons[p]}</span>`).join("")}</div>` : `<p class="hint">رتّبهم زي ما شفتهم (${ans.length}/${len})</p><div class="sq-pick">${icons.map((ic, k) => `<button class="btn alt" data-k="${k}">${ic}</button>`).join("")}</div><div class="sq-ans">${ans.map((k) => icons[k]).join(" ")}</div>`; };
    draw(); const t = setTimeout(() => { show = false; draw(); }, len * 700 + 900); A.cleanups.push(() => clearTimeout(t));
    box.onclick = (ev) => { const b = ev.target.closest("[data-k]"); if (!b || show) return; ans.push(+b.dataset.k); OSW.audio.sfx("pop"); if (ans.length >= len) { box.onclick = null; res(Math.round((ans.filter((a, k) => a === pat[k]).length / len) * 100)); } else draw(); };
  });
  /* تقليب (تحريك دائري) */
  P.spin = (box, o) => new Promise((res) => {
    const secs = o.secs || 8, need = (o.turns || 4) * Math.PI * 2; let acc = 0, last = null, t0 = performance.now(); const [c, x] = canvasIn(box, 280, 280);
    c.onpointermove = (ev) => { if (!(ev.buttons || ev.pressure)) return; const a = Math.atan2(ptrY(c, ev) - 140, ptrX(c, ev) - 140); if (last != null) { let d = a - last; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; acc += Math.abs(d); } last = a; }; c.onpointerup = () => (last = null); c.onpointerleave = () => (last = null);
    const stop = raf((t) => { const el2 = (performance.now() - t0) / 1000, p = clamp(acc / need, 0, 1); x.clearRect(0, 0, 280, 280); x.fillStyle = "#3b2a1a"; x.beginPath(); x.arc(140, 140, 120, 0, 7); x.fill(); x.fillStyle = `hsl(${30 + p * 20},80%,${45 + p * 15}%)`; x.beginPath(); x.arc(140, 140, 100, 0, 7); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 8; x.lineCap = "round"; const a = acc % (Math.PI * 2); x.beginPath(); x.arc(140, 140, 60, a, a + 0.8); x.stroke(); x.fillStyle = "#fff"; x.font = "bold 18px sans-serif"; x.textAlign = "center"; x.fillText((o.label || "دوّر بإصبعك بحركة دائرية 🌀") + "  " + Math.max(0, Math.ceil(secs - el2)) + "ث", 140, 270); if (p >= 1 || el2 >= secs) { stop(); res(Math.round(p * 100)); } });
  });
  /* إبقاء المؤشر بالمنطقة (حرارة الفرن) */
  P.hold = (box, o) => new Promise((res) => {
    const secs = o.secs || 8; let v = 0.5, vel = 0, inz = 0, t0 = performance.now(), last = t0, pr = 0;
    box.innerHTML = `<p class="hint">${o.label || "خلّي الحرارة بالأخضر 🔥 (اضغط باستمرار ترفعها)"}</p><div class="hd-bar"><i class="hd-z"></i><i class="hd-c"></i></div><button class="btn gold hd-b">🔥 اضغط باستمرار</button>`;
    const c = box.querySelector(".hd-c"), b = box.querySelector(".hd-b"); b.onpointerdown = () => (pr = 1); b.onpointerup = b.onpointerleave = b.onpointercancel = () => (pr = 0);
    const stop = raf(() => { const n = performance.now(), dt = (n - last) / 1000; last = n; vel += ((pr ? 0.9 : -0.7) - vel) * 0.1 + (Math.random() - 0.5) * 0.04; v = clamp(v + vel * dt * 0.5, 0, 1); if (v > 0.38 && v < 0.62) inz += dt; c.style.left = v * 100 + "%"; if (n - t0 >= secs * 1000) { stop(); res(Math.round(clamp(inz / secs, 0, 1) * 100)); } });
  });
  /* سلّة المحصول: التقاط ما بتقع */
  P.catchGame = (box, o) => new Promise((res) => {
    const [c, x] = canvasIn(box, 320, 440), secs = o.secs || 60, r = A.rng(o.seed || "c"), items = [], emo = o.emo || ["🍅", "🌽", "🥕", "🍆", "🍇"], bad = o.bad || ["🌿"]; let bx = 160, score = 0, t0 = performance.now(), last = t0, nxt = 0, gold = 0;
    const mv = (ev) => { bx = clamp(ptrX(c, ev), 30, 290); }; c.onpointermove = mv; c.onpointerdown = mv; const kd = (e) => { if (e.key === "ArrowLeft") bx = Math.max(30, bx - 24); if (e.key === "ArrowRight") bx = Math.min(290, bx + 24); }; document.addEventListener("keydown", kd); A.cleanups.push(() => document.removeEventListener("keydown", kd));
    const stop = raf(() => { const n = performance.now(), dt = (n - last) / 1000, el2 = (n - t0) / 1000; last = n; nxt -= dt; if (nxt <= 0) { nxt = 0.45 + r() * 0.5 - el2 * 0.004; const g = r() < 0.07, b = !g && r() < 0.22; items.push({ x: 20 + r() * 280, y: -20, v: 110 + r() * 90 + el2 * 2, e: g ? "⭐" : b ? bad[0] : emo[Math.floor(r() * emo.length)], k: g ? 5 : b ? -3 : 1 }); }
      x.clearRect(0, 0, 320, 440); x.fillStyle = "#16204f"; x.fillRect(0, 0, 320, 440); x.font = "28px serif"; x.textAlign = "center";
      for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; it.y += it.v * dt; x.fillText(it.e, it.x, it.y); if (it.y > 400 && it.y < 430 && Math.abs(it.x - bx) < 38) { score = Math.max(0, score + it.k); OSW.audio.sfx(it.k > 0 ? "pop" : "buzz"); items.splice(i, 1); } else if (it.y > 450) items.splice(i, 1); }
      x.fillText("🧺", bx, 428); x.fillStyle = "#fff"; x.font = "bold 18px sans-serif"; x.textAlign = "left"; x.fillText("🪙 " + score, 10, 24); x.textAlign = "right"; x.fillText(Math.max(0, Math.ceil(secs - el2)) + "ث", 310, 24);
      if (el2 >= secs) { stop(); res({ score }); } });
  });
  /* سباق كارتينغ (منظر علوي، سحب أفقي) */
  P.race = (box, o) => new Promise((res) => {
    const [c, x] = canvasIn(box, 300, 460), secs = o.secs || 45, r = A.rng(o.seed || "k"), obs = []; let px = 150, dist = 0, sp = 150, t0 = performance.now(), last = t0, boost = 0, nxt = 0, hit = 0, lastSend = 0; const lanes = [70, 150, 230];
    const mv = (ev) => { px = clamp(ptrX(c, ev), 40, 260); }; c.onpointermove = mv; c.onpointerdown = mv; const kd = (e) => { if (e.key === "ArrowLeft") px = Math.max(40, px - 30); if (e.key === "ArrowRight") px = Math.min(260, px + 30); }; document.addEventListener("keydown", kd); A.cleanups.push(() => document.removeEventListener("keydown", kd));
    for (let i = 0; i < 400; i++) obs.push({ d: 400 + i * 150 + r() * 90, x: lanes[Math.floor(r() * 3)] + (r() - 0.5) * 30, t: r() < 0.22 ? "b" : r() < 0.5 ? "c" : "o" });
    const stop = raf(() => { const n = performance.now(), dt = Math.min(0.05, (n - last) / 1000), el2 = (n - t0) / 1000; last = n; sp += ((boost > 0 ? 330 : 190 + el2 * 2.2) - sp) * 0.05; boost = Math.max(0, boost - dt); hit = Math.max(0, hit - dt); dist += sp * dt;
      x.fillStyle = "#3b3f51"; x.fillRect(0, 0, 300, 460); x.fillStyle = "#4aa84a"; x.fillRect(0, 0, 20, 460); x.fillRect(280, 0, 20, 460); x.fillStyle = "#fff"; for (let k = 0; k < 12; k++) { const yy = ((k * 60 - dist * 0.9) % 720 + 720) % 720 - 60; [110, 190].forEach((lx) => x.fillRect(lx, yy, 4, 30)); }
      obs.forEach((o2) => { const y = 380 - (o2.d - dist); if (y < -30 || y > 480) return; x.font = "26px serif"; x.textAlign = "center"; x.fillText(o2.t === "b" ? "⚡" : o2.t === "c" ? "🚧" : "🛢️", o2.x, y); if (Math.abs(y - 400) < 18 && Math.abs(o2.x - px) < 26 && !o2.h) { o2.h = 1; if (o2.t === "b") { boost = 1.6; OSW.audio.sfx("magic"); } else { sp *= 0.45; hit = 0.6; OSW.audio.sfx("boom"); } } });
      x.font = "34px serif"; x.fillText(hit > 0 && Math.floor(n / 80) % 2 ? "💥" : "🏎️", px, 420); x.fillStyle = "#fff"; x.font = "bold 16px sans-serif"; x.textAlign = "left"; x.fillText(Math.round(dist) + " م", 8, 22); x.textAlign = "right"; x.fillText(Math.max(0, Math.ceil(secs - el2)) + "ث", 292, 22);
      if (o.onProg && n - lastSend > 600) { lastSend = n; o.onProg(Math.round(dist)); } if (el2 >= secs) { stop(); res({ dist: Math.round(dist) }); } });
  });
  /* صيد: شد الخيط بدون ما ينقطع */
  P.reel = (box, o) => new Promise((res) => {
    const casts = o.casts || 5, r = A.rng(o.seed || "f"); let n = 0, W2 = 0, ten = 0.3, prog = 0, pull = 0, held = 0, fishW = 0, t0 = performance.now(), last = t0, ph = 0;
    box.innerHTML = `<p class="hint">🎣 اضغط باستمرار تشدّ السمكة، فك لما الخيط يحمرّ! (${casts} سمكات)</p><div class="rl-n" id="rlN"></div><div class="hd-bar"><i class="hd-z" style="left:25%;width:50%"></i><i class="hd-c" id="rlT"></i></div><div class="progress" style="margin:8px 0"><i id="rlP" style="width:0%"></i></div><button class="btn berry hd-b" id="rlB" style="font-size:20px;padding:16px">🎣 شدّ</button>`;
    const nn = box.querySelector("#rlN"), tt = box.querySelector("#rlT"), pp = box.querySelector("#rlP"), bb = box.querySelector("#rlB"); bb.onpointerdown = () => (held = 1); bb.onpointerup = bb.onpointerleave = bb.onpointercancel = () => (held = 0);
    const nextFish = () => { fishW = Math.round((1 + r() * 4 + (r() < 0.12 ? 6 : 0)) * 10) / 10; prog = 0; ph = r() * 6; nn.textContent = `🐟 سمكة ${n + 1}/${casts} · ${fishW} كغ`; }; nextFish();
    const stop = raf(() => { const t = performance.now(), dt = Math.min(0.05, (t - last) / 1000); last = t; ph += dt * (1.5 + fishW * 0.15); pull = (Math.sin(ph) + Math.sin(ph * 2.3)) * 0.5; ten = clamp(ten + (held ? 0.55 : -0.4) * dt + pull * 0.35 * dt, 0, 1); const safe = ten > 0.25 && ten < 0.75; if (held && safe) prog += dt * (0.2 + 0.05 * (5 - Math.min(5, fishW))); if (ten >= 1) { OSW.audio.sfx("boom"); nn.textContent = "💥 انقطع الخيط!"; ten = 0.3; n++; if (n >= casts) { stop(); return res({ w: Math.round(W2 * 10) / 10 }); } fishW = 0; setTimeout(nextFish, 500); prog = 0; }
      tt.style.left = ten * 100 + "%"; tt.style.background = safe ? "#fff" : "#e63946"; pp.style.width = Math.min(100, prog * 100) + "%"; if (prog >= 1) { W2 += fishW; OSW.audio.sfx("coin"); n++; if (n >= casts) { stop(); return res({ w: Math.round(W2 * 10) / 10 }); } nextFish(); } if (t - t0 > 90000) { stop(); res({ w: Math.round(W2 * 10) / 10 }); } });
  });
  /* مسح الوسخ */
  P.scrub = (box, o) => new Promise((res) => {
    const [c, x] = canvasIn(box, 300, 300), secs = o.secs || 45, r = A.rng(o.seed || "s"); let t0 = performance.now(), down = false;
    x.fillStyle = o.bg || "#d8c9a8"; x.fillRect(0, 0, 300, 300); x.font = "120px serif"; x.textAlign = "center"; x.fillText(o.emoji || "🖼️", 150, 190);
    x.fillStyle = "rgba(70,50,30,0.93)"; x.fillRect(0, 0, 300, 300); for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(${40 + r() * 30},${30 + r() * 20},20,0.9)`; x.beginPath(); x.arc(r() * 300, r() * 300, 20 + r() * 40, 0, 7); x.fill(); }
    const cover = () => { const d = x.getImageData(0, 0, 300, 300).data; let tot = 0, cl = 0; for (let yy = 0; yy < 300; yy += 10) for (let xx = 0; xx < 300; xx += 10) { tot++; if (d[(yy * 300 + xx) * 4 + 3] < 40) cl++; } return cl / tot; }; // مشان نعرف النسبة نرسم الصورة تحت بطبقة منفصلة
    const layer = document.createElement("canvas"); layer.width = 300; layer.height = 300; const lx = layer.getContext("2d"); lx.drawImage(c, 0, 0); // طبقة الوسخ
    const bgc = document.createElement("canvas"); bgc.width = 300; bgc.height = 300; const bx = bgc.getContext("2d"); bx.fillStyle = o.bg || "#d8c9a8"; bx.fillRect(0, 0, 300, 300); bx.font = "120px serif"; bx.textAlign = "center"; bx.fillText(o.emoji || "🖼️", 150, 190);
    const draw = () => { x.clearRect(0, 0, 300, 300); x.drawImage(bgc, 0, 0); x.drawImage(layer, 0, 0); }; draw();
    const wipe = (ev) => { if (!down) return; const px = ptrX(c, ev), py = ptrY(c, ev); lx.globalCompositeOperation = "destination-out"; lx.beginPath(); lx.arc(px, py, 20, 0, 7); lx.fill(); lx.globalCompositeOperation = "source-over"; draw(); };
    c.onpointerdown = (ev) => { down = true; wipe(ev); }; c.onpointermove = wipe; c.onpointerup = c.onpointerleave = () => (down = false);
    const pct = () => { const d = lx.getImageData(0, 0, 300, 300).data; let tot = 0, cl = 0; for (let yy = 0; yy < 300; yy += 6) for (let xx = 0; xx < 300; xx += 6) { tot++; if (d[(yy * 300 + xx) * 4 + 3] < 60) cl++; } return cl / tot; };
    const stop = raf(() => { const el2 = (performance.now() - t0) / 1000, p = el2 > 1 && Math.floor(el2 * 4) % 2 ? pct() : null; x.fillStyle = "#fff"; x.font = "bold 16px sans-serif"; x.textAlign = "left"; x.fillText("🧽 امسح!  " + Math.max(0, Math.ceil(secs - el2)) + "ث" + (p != null ? "  " + Math.round(p * 100) + "%" : ""), 8, 20); if (el2 >= secs || (p != null && p > 0.96)) { stop(); res({ pct: Math.round(pct() * 100), secs: Math.round(el2) }); } });
  });
  /* بزل منزلق 3×3 (ترميم لوحة) */
  P.slide = (box, o) => new Promise((res) => {
    const r = A.rng(o.seed || "p"), N = 3, src = document.createElement("canvas"); src.width = src.height = 270; const g = src.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 270); gr.addColorStop(0, "#9bd1ff"); gr.addColorStop(1, "#ffe2a8"); g.fillStyle = gr; g.fillRect(0, 0, 270, 270); g.fillStyle = "#6fbf73"; g.fillRect(0, 190, 270, 80); g.font = "70px serif"; g.fillText("☀️", 190, 70); g.font = "90px serif"; g.fillText("🏡", 80, 200); g.font = "46px serif"; g.fillText("🌳", 10, 215); g.fillText("🌷", 200, 245); g.fillText("☁️", 20, 60);
    let board = [0, 1, 2, 3, 4, 5, 6, 7, 8], e = 8, moves = 0; const nb = (i) => [i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 < 2 ? i + 1 : -1].filter((k) => k >= 0 && k < 9);
    for (let k = 0; k < 60; k++) { const o2 = nb(e), m = o2[Math.floor(r() * o2.length)]; [board[e], board[m]] = [board[m], board[e]]; e = m; }
    const t0 = performance.now(); const render = () => { box.innerHTML = `<p class="hint">رتّب القطع لترجع اللوحة 🖼️ · حركات: ${moves}</p><div class="sl-g">${board.map((b, i) => b === 8 ? `<i class="sl-t sl-e"></i>` : `<button class="sl-t" data-i="${i}" style="background:url(${src.toDataURL()}) ${-(b % 3) * 90}px ${-Math.floor(b / 3) * 90}px/270px 270px"></button>`).join("")}</div>`; };
    render(); box.onclick = (ev) => { const b = ev.target.closest("[data-i]"); if (!b) return; const i = +b.dataset.i; if (!nb(e).includes(i)) return; [board[e], board[i]] = [board[i], board[e]]; e = i; moves++; OSW.audio.sfx("pop"); render(); if (board.every((v, k) => v === k)) { box.onclick = null; res({ moves, secs: Math.round((performance.now() - t0) / 1000) }); } };
  });

  /* ============ ألعاب المهارة المتوازية ============ */
  const PAR = (id, n, e, desc, o) => (A.GAMES[id] = Object.assign({ id, n, e, desc, par: 1, min: 8000, max: 6 * MIN }, o));
  const tot = (s, k) => order(s).reduce((n, u) => n + ((s.p[u].res || {})[k] || 0), 0);
  const winner = (s, k) => { const o = order(s), a = (s.p[o[0]].res || {})[k] || 0, b = (s.p[o[1]].res || {})[k] || 0; return a === b ? null : a > b ? o[0] : o[1]; };
  const nameLine = (s, k, u) => `${who(u)}: <b>${(s.p[u].res || {})[k] || 0}</b>`;
  PAR("kart", "سباق كارتينغ", "🏎️", "سباق 45 ثانية على نفس المضمار! اسحب إصبعك يمين ويسار، خذ ⚡ وتجنّب 🚧 و🛢️. اللي يقطع مسافة أكبر بيفوز.", {
    min: 40000, roles: () => ["🏁 نفس المضمار للاثنين وبتشوفوا تقدّم بعض مباشرة"], clean: (r) => (r.dist >= 0 && r.dist < 9000 ? { dist: Math.round(r.dist) } : null), show: (r) => r.dist + " م",
    run: (box, s, done) => { let opp = 0; const bar = document.createElement("div"); bar.className = "chk"; bar.id = "kartOpp"; const inner = document.createElement("div"); box.appendChild(inner); box.appendChild(bar); const h = (m) => { if (m && m.act === "kart" && m.sid === s.id && m.u !== db().uid) { opp = m.d; bar.textContent = "🏎️ " + ui().prof(m.u).name + ": " + opp + " م"; } }; db().on("draw", h);
      let cd = 3; inner.innerHTML = `<div class="pick" style="font-size:54px">${cd}</div>`; const iv = setInterval(() => { cd--; if (cd > 0) inner.innerHTML = `<div class="pick" style="font-size:54px">${cd}</div>`; else { clearInterval(iv); P.race(inner, { secs: 45, seed: s.id, onProg: (d) => db().sendDraw && db().sendDraw({ act: "kart", sid: s.id, d }) }).then(done); } }, 900); A.cleanups.push(() => clearInterval(iv)); },
    reward: (s) => { const t = tot(s, "dist"), w = winner(s, "dist"); return { coins: Math.min(70, Math.round(t / 40) + 20), best: Math.max(...order(s).map((u) => s.p[u].res.dist)), text: w ? `🏆 الفائز: ${who(w)}` : "🤝 تعادل!" }; },
    summary: (s) => order(s).map((u) => nameLine(s, "dist", u) + " م").join("<br>") + `<br>${s.paid ? s.paid.text : ""}`,
  });
  PAR("farm", "تحدي الحصاد", "🌾", "60 ثانية: التقطوا المحاصيل بالسلة 🧺 وتجنّبوا الأعشاب 🌿 (−3). النجمة ⭐ بـ5! مجموع نقاطكم الاثنين بيحدد المكافأة (محاصيل حقيقية).", {
    min: 55000, roles: () => ["🧺 كل واحد بسلّته، والنتيجة مجموعكم سوا"], clean: (r) => (r.score >= 0 && r.score < 400 ? { score: Math.round(r.score) } : null), show: (r) => r.score + " نقطة",
    run: (box, s, done) => { const crops = G.CROPS; P.catchGame(box, { secs: 60, seed: s.id, emo: ["🍅", "🌽", "🥕", "🍆", "🍇"] }).then(done); void crops; },
    reward: (s) => { const t = tot(s, "score"), items = {}; if (t >= 40) items.corn = 2; if (t >= 80) items.watermelon = 1; if (t >= 120) items.grapes = 2; return { coins: Math.min(80, Math.round(t / 2)), items, best: t, text: `🌾 مجموعكم: ${t} نقطة` }; },
    summary: (s) => order(s).map((u) => nameLine(s, "score", u)).join("<br>") + `<br>${s.paid ? s.paid.text : ""}`,
  });
  PAR("fish", "مسابقة صيد", "🎣", "5 سمكات لكل واحد! اضغط باستمرار لتشدّ السمكة وفك قبل ما ينقطع الخيط. الأثقل بيربح، والسمك بيروح لمخزنكم.", {
    min: 20000, roles: () => ["⚖️ بتتقارنوا بإجمالي وزن السمك"], clean: (r) => (r.w >= 0 && r.w < 60 ? { w: Math.round(r.w * 10) / 10 } : null), show: (r) => r.w + " كغ",
    run: (box, s, done) => { P.reel(box, { casts: 5, seed: s.id }).then(done); },
    reward: (s) => { const t = tot(s, "w"), items = {}; items.fish_s = 1 + Math.floor(t / 14); if (t >= 12) items.fish_m = 1 + Math.floor(t / 30); if (Math.max(...order(s).map((u) => s.p[u].res.w)) >= 18) items.fish_g = 1; const w = winner(s, "w"); return { coins: Math.min(50, Math.round(t * 1.3) + 10), items, best: Math.round(t), text: w ? `🏆 الأثقل: ${who(w)}` : "🤝 تعادل!" }; },
    summary: (s) => order(s).map((u) => nameLine(s, "w", u) + " كغ").join("<br>") + `<br>${s.paid ? s.paid.text : ""}`,
  });
  const CLEANS = [["🖼️", "#d8c9a8", "لوحة البيت القديم"], ["🪟", "#cfe0e8", "نوافذ الكراج"], ["🏺", "#e0d2b8", "تحف العلّية"], ["🚗", "#d8dde2", "سيارة الجد"]];
  PAR("clean", "تنظيف سوا", "🧽", "قدّامكم أغراض مغبّرة! كل واحد بيمسح لوحته بإصبعه ضد الوقت (45ث). النظافة الجماعية بتحدد المكافأة.", {
    min: 20000, roles: (s) => ["🧽 نفس الغرض مغبّر، ولكل واحد نسخة يمسحها"], clean: (r) => (r.pct >= 0 && r.pct <= 100 ? { pct: Math.round(r.pct), secs: Math.round(r.secs || 45) } : null), show: (r) => r.pct + "% نظافة",
    run: (box, s, done) => { const c = CLEANS[s.seed % CLEANS.length]; P.scrub(box, { secs: 45, seed: s.id, emoji: c[0], bg: c[1] }).then(done); },
    reward: (s) => { const t = tot(s, "pct") / 2; return { coins: Math.round(t * 0.5) + 8, best: Math.round(t), text: `✨ نظافة الفريق: ${Math.round(t)}%` }; },
    summary: (s) => `${CLEANS[s.seed % CLEANS.length][2]}<br>` + order(s).map((u) => nameLine(s, "pct", u) + "%").join("<br>") + `<br>${s.paid ? s.paid.text : ""}`,
  });

  /* ============ لوحة الأنشطة (hub) ============ */
  const CARD = [["cook", "🍳", "تحدي الطبخ المشترك", "أدوار: شيف ومساعد · 4 خطوات · وجبة حقيقية للثلاجة"], ["farm", "🌾", "تحدي الحصاد", "التقاط محاصيل 60ث · مكافأة محاصيل"], ["fish", "🎣", "مسابقة صيد", "شدّ السمكة بدون ما ينقطع الخيط"], ["kart", "🏎️", "سباق كارتينغ", "سباق مباشر 45ث ضد بعض"],
    ["treasure", "🏴‍☠️", "البحث عن الكنز", "حفّار وملّاح · خريطة جزيرة · 6 معاول"], ["deliver", "🛵", "توصيل الطلبات", "منسّق وسائق · مواعيد وتحف"], ["resto", "🍽️", "تحدي المطعم", "نادل وطباخ · زبائن بصبر محدود"], ["c4", "🔴", "أربعة بصف", "لعبة طاولة بالدور"], ["memo", "🃏", "ذاكرة الأزواج", "لعبة طاولة بالدور"], ["design", "🛋️", "تحدي التصميم", "صمّموا غرفة وقيّموا بعض"],
    ["clean", "🧽", "تنظيف سوا", "امسحوا الغبار ضد الوقت"]];
  G.openers.hub = () => {
    const s = A.mine(), inv = A.invites(), R = A.R(), f = A.festival(Date.now()), day = G.today(), dd = R.day[day] || { coins: 0, runs: {} };
    const rest = R.rest, STG = ["تنظيف الواجهة", "ترميم السقف", "إصلاح الباب", "ترميم اللوحة", "دهان الجدران", "الحديقة الأمامية"];
    ui().openModal(`<h3>🎮 الأنشطة المشتركة</h3>${s ? `<div class="chk" style="margin:6px 0">🔔 عندكم جلسة مفتوحة: ${A.GAMES[s.kind].e} ${A.GAMES[s.kind].n} <button class="btn sm gold" data-act="g-act-open" data-sid="${s.id}">ادخل</button></div>` : ""}
      ${inv.map((x) => `<div class="pick" style="font-size:17px;margin:6px 0">💌 ${who(x.host)} عزمك على ${A.GAMES[x.kind].e} ${A.GAMES[x.kind].n} <button class="btn sm berry" data-act="g-act-open" data-sid="${x.id}">انضم</button></div>`).join("")}
      <div class="chk" style="margin:6px 0">🪙 مكافآت اليوم من الأنشطة: ${dd.coins}/${DAYCAP} · أول 3 مرات لكل نشاط بمكافأة كاملة</div>
      ${f ? `<div class="pick" style="font-size:17px;margin:6px 0">${f.e} اليوم <b>${f.n}</b>! <button class="btn sm gold" data-act="g-act-open-k" data-k="festival">شاركوا</button></div>` : `<div class="hint">🎪 المهرجان بيصير كل جمعة وسبت وبالأعياد</div>`}
      <div class="items">${CARD.map(([k, e, n, d]) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${n}</b><small>${d}${(R.stat[k] ? " · لعبتوه " + R.stat[k].n + " مرة" : "")}</small></div><div class="ib"><button class="btn sm gold" data-act="g-act-new" data-k="${k}">ابدأوا</button></div></div>`).join("")}</div>
      <div class="sep"></div><b>🛠️ مشاريع وفعاليات</b><div class="items">
        <div class="irow"><span class="ie">🏚️</span><div class="iname"><b>ترميم البيت القديم</b><small>المرحلة ${Math.min(6, rest.stage + 1)}/6 · ${rest.stage >= 6 ? "✅ تم الترميم!" : STG[rest.stage]}</small></div><div class="ib"><button class="btn sm gold" data-act="g-act-open-k" data-k="restore">ارمّموا</button></div></div>
        <div class="irow"><span class="ie">📸</span><div class="iname"><b>مهام التصوير</b><small>3 مهام يومية للاثنين</small></div><div class="ib"><button class="btn sm gold" data-act="g-act-open-k" data-k="photo">صوّروا</button></div></div>
        <div class="irow"><span class="ie">🎈</span><div class="iname"><b>نزهات الجزيرة</b><small>خروجات للاثنين</small></div><div class="ib"><button class="btn sm alt" data-act="g-fam-open" data-k="acts">افتح</button></div></div>
        <div class="irow"><span class="ie">🏙️</span><div class="iname"><b>دليل المدينة</b><small>مطاعم · فنادق · متاجر</small></div><div class="ib"><button class="btn sm alt" data-act="g-fam-open" data-k="city">افتح</button></div></div>
        <div class="irow"><span class="ie">🛋️</span><div class="iname"><b>تصاميم البيت</b><small>احفظوا ورتّبوا غرفكم</small></div><div class="ib"><button class="btn sm alt" data-act="g-fam-open" data-k="designs">افتح</button></div></div>
        <div class="irow"><span class="ie">👗</span><div class="iname"><b>الإطلالات</b><small>شعر، أحذية، شنط، إطلالات محفوظة</small></div><div class="ib"><button class="btn sm alt" data-act="g-fam-open" data-k="looks">افتح</button></div></div></div>`);
    OSW.places.noRefresh = OSW.places.noRefresh || {}; OSW.places.noRefresh.hub = false;
  };
  G.openers.restore = () => {
    const R = A.R(), r = R.rest, me = db().uid, STG = ["🧽 نظّفوا واجهة البيت", "🧩 رمّموا السقف", "🧽 نظّفوا الباب", "🧩 رمّموا اللوحة", "🧽 دهان الجدران", "🧩 جنّنوا الحديقة"], st = r.stage;
    ui().openModal(`<h3>🏚️ ترميم البيت القديم</h3><p class="hint">مشروع بيتقدّم عبر الأيام: كل مرحلة لازم <b>الاثنين</b> يخلّصوا لعبتهم (تنظيف أو بزل ترميم). بعد 6 مراحل بتاخدوا 3 قطع أثرية للبيت!</p><div class="progress" style="margin:8px 0"><i style="width:${(st / 6) * 100}%"></i></div>
      ${st >= 6 ? `<div class="pick">🏆 البيت القديم رجع أحلى من أول! أخدتوا التمثال والمرآة والسجّادة التراثية</div>` : `<div class="chk" style="margin:6px 0">${STG[st]} · ${r.by[me] != null ? "✅ خلّصت دورك (" + r.by[me] + "%)" : "⏳ دورك"} ${Object.keys(r.by).some((u) => u !== me) ? "· ✅ شريكك خلّص" : ""}</div>
      <button class="btn berry" style="width:100%" data-act="g-act-rest" ${r.by[me] != null ? "disabled" : ""}>${st % 2 ? "🧩 ابدأ البزل" : "🧽 ابدأ التنظيف"}</button><p class="hint">مكافأة المرحلة: ${20 + 10 * (st + 1)}🪙 للاثنين</p>`}${st >= 0 ? `<button class="btn alt sm" data-act="g-act-open-k" data-k="hub">↩️ رجوع</button>` : ""}`);
  };
  G.openers.photo = () => {
    const ms = A.missionsToday(), R = A.R(), day = G.today(), me = db().uid;
    ui().openModal(`<h3>📸 مهام التصوير</h3><p class="hint">كل مهمة: اتجهوا للمكان/الوقت المطلوب وصوّروا. كل واحد بياخد 12🪙، ولو الاثنين خلّصوها +10 مكافأة 💞</p><div class="items">${ms.map((m) => { const P2 = R.photo[day + ":" + m.id] || {}, done = !!P2[me], both = Object.keys(P2).length >= 2; return `<div class="irow"><span class="ie">${both ? "💞" : done ? "✅" : "📷"}</span><div class="iname"><b>${m.t}</b><small>${both ? "الاثنين خلّصوها" : done ? "بانتظار شريكك" : "لسا"}</small></div><div class="ib"><button class="btn sm gold" data-act="g-act-photo" data-m="${m.id}" ${done ? "disabled" : ""}>صوّر</button></div></div>`; }).join("")}</div><button class="btn alt sm" data-act="g-act-open-k" data-k="hub">↩️ رجوع</button>`);
  };
  G.openers.festival = () => {
    const f = A.festival(Date.now()), R = A.R(), day = G.today(), F = (R.fest[day] || { by: {} }), me = db().uid, my = F.by[me] || {};
    if (!f) return ui().openModal(`<h3>🎪 المهرجان</h3><div class="empty"><span class="big">🎪</span>المهرجان بيفتح كل جمعة وسبت وبالأعياد والمناسبات!</div>`);
    const ST = [["lantern", "🏮", "إضاءة الفوانيس", "توقيت دقيق"], ["fire", "🎆", "الألعاب النارية", "احفظ التسلسل"], ["food", "🍢", "كشك الأكل", "التقط الأكل"]];
    ui().openModal(`<h3>${f.e} ${f.n}</h3><p class="hint">خلّصوا المحطات الثلاث <b>الاثنين</b> وبتفتح الصندوق الكبير: 90🪙 + فانوس رمضان للبيت 🏮</p><div class="items">${ST.map(([k, e, n, d]) => `<div class="irow"><span class="ie">${my[k] ? "✅" : e}</span><div class="iname"><b>${n}</b><small>${d}${Object.keys(F.by).some((u) => u !== me && (F.by[u] || {})[k]) ? " · شريكك خلّصها" : ""}</small></div><div class="ib"><button class="btn sm gold" data-act="g-act-fest" data-st="${k}" ${my[k] ? "disabled" : ""}>العب</button></div></div>`).join("")}</div>${F.paid ? `<div class="pick">🎊 فتحتوا صندوق المهرجان!</div>` : ""}<button class="btn alt sm" data-act="g-act-open-k" data-k="hub">↩️ رجوع</button>`);
  };

  /* ============ نقرات ============ */
  const baseClick = G.click;
  G.click = (a, el2) => {
    if (a.indexOf("g-act-") !== 0) return baseClick(a, el2);
    const d = el2.dataset, busy = async (f) => { try { await f(); } catch (e) { ui().toast("⚠️ " + esc(e.message)); } };
    switch (a) {
      case "g-act-new": return busy(async () => { ui().closeModal(); await A.start(d.k); });
      case "g-act-open": ui().closeModal(); return A.open(d.sid);
      case "g-act-open-k": return OSW.places.open(d.k);
      case "g-act-rest": { const st = A.R().rest.stage; ui().closeModal(); const o = el(); o.hidden = false; document.documentElement.classList.add("actOn"); try { W().setInputEnabled(false); } catch (e) { /* */ } A.cur = null; A.playing = "rest"; shell("🏚️ ترميم", `<div id="actGame"></div>`, ""); const box = document.getElementById("actGame");
        const fin = (score) => busy(async () => { A.playing = null; await A.send("rest_done", { stage: st, score }); shell("🏚️ ترميم", `<div class="pick">تمام! دورك خلّص (${score}%)</div>`, `<button class="btn alt" data-a="close">إغلاق</button>`); });
        return st % 2 ? P.slide(box, { seed: "rest" + st + db().uid }).then((r) => fin(clamp(Math.round(100 - r.moves * 0.8 - r.secs * 0.3), 20, 100))) : P.scrub(box, { secs: 45, seed: "rest" + st, emoji: "🏚️", bg: "#d8c9a8" }).then((r) => fin(r.pct)); }
      case "g-act-photo": { const m = A.MISSIONS.find((x) => x.id === d.m), why = A.missionOk(m); if (why) return ui().toast("📸 " + why, "", 3000); return busy(async () => { ui().closeModal(); await A.send("photo_ok", { m: m.id }); ui().toast("📸 تمام! صوّروا وخزّنوا اللقطة بالألبوم", "gold"); if (OSW.extras && OSW.extras.snap) OSW.extras.snap(); }); }
      case "g-act-fest": { const k = d.st, day = G.today(); ui().closeModal(); const o = el(); o.hidden = false; document.documentElement.classList.add("actOn"); try { W().setInputEnabled(false); } catch (e) { /* */ } A.cur = null; shell("🎪 المهرجان", `<div id="actGame"></div>`, ""); const box = document.getElementById("actGame");
        const fin = (ok) => busy(async () => { if (ok) await A.send("fest_st", { st: k, day }); shell("🎪 المهرجان", `<div class="pick">${ok ? "✅ نجحت بالمحطة!" : "😅 جرّب مرة ثانية"}</div>`, `<button class="btn alt" data-a="close">إغلاق</button>`); });
        const p = k === "lantern" ? P.timing(box, { hits: 6, speed: 1.2, zone: 0.16, label: "اضغط لما المؤشر بالأخضر وضوّي الفانوس 🏮" }).then((s) => s >= 55) : k === "fire" ? P.seq(box, { len: 6, icons: ["🔴", "🟡", "🟢", "🔵", "🟣", "🟠"], label: "احفظ ترتيب الألعاب النارية 🎆", seed: day + k }).then((s) => s >= 66) : P.catchGame(box, { secs: 30, seed: "food" + day, emo: ["🍢", "🍡", "🥙", "🍧"], bad: ["🔥"] }).then((r) => r.score >= 18); return p.then(fin); }
    }
  };

  /* ============ ستايل ============ */
  const st = document.createElement("style"); st.textContent = `
#actRoom{position:fixed;inset:0;z-index:9000;background:rgba(8,10,30,.86);display:flex;align-items:center;justify-content:center;padding:8px;overflow:auto}
#actRoom[hidden]{display:none}.act-card{background:#1b1f45;color:#fff;border-radius:20px;width:100%;max-width:420px;max-height:96vh;display:flex;flex-direction:column;box-shadow:0 10px 40px #0008}
.act-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;font-size:18px}.act-x{background:#fff2;border:0;color:#fff;border-radius:50%;width:34px;height:34px;font-size:16px}
.act-body{padding:8px 14px 12px;overflow:auto;flex:1}.act-foot{padding:10px 14px 14px;display:flex;gap:8px;justify-content:center}
.tm-bar,.hd-bar{position:relative;height:34px;background:#0006;border-radius:17px;margin:12px 0;overflow:hidden}.tm-z,.hd-z{position:absolute;top:0;bottom:0;background:#2a9d8f;opacity:.85;left:38%;width:24%}.tm-c,.hd-c{position:absolute;top:2px;bottom:2px;width:10px;margin-left:-5px;background:#fff;border-radius:5px}
.tm-btn,.hd-b{width:100%;padding:16px;font-size:20px;touch-action:none;user-select:none}.tm-n{text-align:center;margin-top:8px}
.sq-show,.sq-pick,.sq-ans{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0;font-size:34px}.sq-i{opacity:0;animation:sqin .5s forwards}@keyframes sqin{to{opacity:1}}
.sl-g{display:grid;grid-template-columns:repeat(3,90px);gap:3px;justify-content:center}.sl-t{width:90px;height:90px;border:0;border-radius:8px}.sl-e{background:#0004;display:block}
.tr-g,.ds-g{display:grid;grid-template-columns:repeat(8,1fr);gap:2px;margin:8px 0}.tr-c,.ds-c{aspect-ratio:1;border:0;border-radius:6px;background:#2f4a7a;font-size:18px;padding:0;color:#fff}.tr-c.dug{background:#6b4a30}.ds-c.on{background:#2a9d8f}
.dl-g{display:grid;grid-template-columns:repeat(9,1fr);gap:1px;margin:8px 0}.dl-c{aspect-ratio:1;background:#2f4a7a;font-size:14px;display:flex;align-items:center;justify-content:center;border-radius:3px;font-style:normal}
.c4-g{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;background:#1d4f9f;padding:8px;border-radius:12px;margin:8px 0}.c4-c{aspect-ratio:1;border-radius:50%;background:#0b1d3f;display:block}.c4-1{background:#e63946}.c4-2{background:#ffd23f}.c4-b{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.mm-g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}.mm-c{aspect-ratio:1;font-size:28px;border:0;border-radius:10px;background:#3a4a8a;color:#fff}.mm-c.up{background:#fff}.ds-p{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.ds-p small{display:block;font-size:9px}
.rl-n{text-align:center;font-weight:700;margin:6px 0}.pulse{animation:pls 1s infinite}@keyframes pls{50%{transform:scale(1.25)}}`; document.head.appendChild(st);
  /* ============ دعوات الشريك + تفعيل ============ */
  const seenInv = {};
  function onChange(ev) {
    if (ev.table === "entries" && ev.row && ev.row.house === "game") {
      if (ev.row.title === "act_new" && ev.row.author !== db().uid && !seenInv[ev.row.id] && Date.now() - new Date(ev.row.created_at).getTime() < 3 * MIN) { seenInv[ev.row.id] = 1; const g = A.GAMES[(ev.row.data || {}).kind]; if (g) { ui().toast(`💌 شريكك عزمك على ${g.e} ${g.n} — افتح 🎮`, "gold", 6000); OSW.audio.sfx("ding"); const hb = document.getElementById("btnHub"); if (hb) hb.classList.add("pulse"); } }
    }
    if (A.cur) setTimeout(() => A.view(), 60);
  }
  function init() { const u = ui(); if (!u || !u.db) return setTimeout(init, 800); u.db.on("change", onChange); setInterval(() => { const hb = document.getElementById("btnHub"); if (hb && !A.invites().length) hb.classList.remove("pulse"); }, 4000); }
  setTimeout(init, 1500);
  OSW.places.noRefresh = OSW.places.noRefresh || {};
})();
