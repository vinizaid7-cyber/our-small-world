/* الأنشطة التعاونية بالأدوار (V11): طبخ، كنز، توصيل، مطعم، أربعة بصف، ذاكرة، تحدي تصميم.
   حالة اللعبة كاملة بتنحسب من أحداث act_mv (مرتبة بالوقت) فبتتزامن وبتنحفظ. */
(function () {
  const OSW = window.OSW, A = OSW.act, G = OSW.game, esc = OSW.esc, P = A.P;
  const ui = () => OSW.ui, db = () => OSW.ui.db, order = (s) => A.order(s), me = () => db().uid;
  const who = (u) => esc(ui().prof(u).name), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  A.act2 = OSW.act2 = { fold: () => true };
  const CO = (id, n, e, desc, o) => (A.GAMES[id] = Object.assign({ id, n, e, desc, co: 1 }, o));
  const mvSend = (s, m) => A.send("act_mv", { sid: s.id, m }).catch((e) => ui().toast("⚠️ " + esc(e.message)));
  const turnTxt = (s, u) => (u === me() ? `<div class="chk ok">🟢 دورك!</div>` : `<div class="chk">⏳ دور ${who(u)}</div>`);
  const stars = (n) => "⭐".repeat(n) + "☆".repeat(3 - n);

  /* ---------- 🍳 الطبخ المشترك ---------- */
  const STEPS = [["chop", "🔪 تقطيع", "قطّعوا الخضار بدقة"], ["stir", "🥄 تقليب", "قلّبوا الحلة"], ["season", "🧂 تتبيل", "تذكّروا التوابل"], ["bake", "🔥 فرن", "ثبّتوا الحرارة"]];
  CO("cook", "تحدي الطبخ المشترك", "🍳", "وصفة بـ4 خطوات: الشيف ياخد التقطيع والتتبيل، والمساعد التقليب والفرن. كل خطوة لعبة صغيرة، وجودة الأكل بتحدد النجوم. 3 نجوم = وجبة بالثلاجة!", {
    roles: (s) => { const o = A.order(s); return [`👩‍🍳 الشيف: ${o[0] ? who(o[0]) : "…"} (تقطيع + تتبيل)`, `🥘 المساعد: ${o[1] ? who(o[1]) : "…"} (تقليب + فرن)`]; },
    init: (s, r) => { const k = Object.keys(OSW.fam.DISHES); s.st = { i: 0, dish: k[Math.floor(r() * k.length)], sc: [], last: s.go || s.t0 }; },
    mv: (s, a, m, t) => { const st = s.st, o = order(s); if (m.k !== "step" || m.i !== st.i || a !== o[st.i % 2] || !(m.score >= 0 && m.score <= 100) || t - Math.max(st.last, s.go) < 2000) return false; st.sc.push(Math.round(m.score)); st.i++; st.last = t; return true; },
    complete: (s) => s.st.i >= 4,
    reward: (s) => { const avg = s.st.sc.reduce((x, y) => x + y, 0) / 4, n = avg >= 80 ? 3 : avg >= 55 ? 2 : 1; s.st.stars = n; return { coins: 14 * n + 6, items: n >= 2 ? { ["@f:" + s.st.dish]: 1 } : {}, best: Math.round(avg), text: `${stars(n)} · ${OSW.fam.DISHES[s.st.dish].e} ${OSW.fam.DISHES[s.st.dish].n}` }; },
    summary: (s) => `${OSW.fam.DISHES[s.st.dish].e} <b>${OSW.fam.DISHES[s.st.dish].n}</b><br>${s.st.sc.map((x, i) => STEPS[i][1] + ": " + x + "%").join("<br>")}<br>${s.paid ? s.paid.text : ""}`,
    view: (s, box) => { const st = s.st, o = order(s), D = OSW.fam.DISHES[st.dish], u = o[st.i % 2], stp = STEPS[st.i];
      if (st.i >= 4) return; box.innerHTML = `<div class="pick" style="font-size:20px">${D.e} ${D.n}</div><div class="progress" style="margin:8px 0"><i style="width:${(st.i / 4) * 100}%"></i></div><p class="hint">الخطوة ${st.i + 1}/4: <b>${stp[1]}</b> — ${stp[2]}</p>${u === me() ? `<button class="btn berry" data-a="cstep">▶️ ابدأ الخطوة</button>` : `<div class="chk">⏳ ${who(u)} عم يعمل ${stp[1]}…</div>`}<div class="chk" style="margin-top:8px">${st.sc.map((x, i) => STEPS[i][1] + " " + x + "%").join(" · ") || "ما بدأتوا بعد"}</div>`; },
    click: (a, b, s) => { if (a !== "cstep") return; const st = s.st, i = st.i, k = STEPS[i][0], box = document.getElementById("actBody"); A.busy = true; const fin = (score) => { A.busy = false; mvSend(s, { k: "step", i, score }).then(() => A.view()); };
      if (k === "chop") P.timing(box, { hits: 6, speed: 1.1, zone: 0.18, label: "قطّع! اضغط لما المؤشر بالأخضر 🔪", btn: "🔪 قصّ" }).then(fin); else if (k === "stir") P.spin(box, { secs: 9, turns: 4 }).then(fin); else if (k === "season") P.seq(box, { len: 4, seed: s.id + i, label: "احفظ ترتيب التوابل 🧂" }).then(fin); else P.hold(box, { secs: 9, label: "ثبّت حرارة الفرن بالأخضر 🔥" }).then(fin); },
  });

  /* ---------- 🏴‍☠️ كنز ---------- */
  const LM = ["🌴", "🪨", "🌵", "🐚", "🦀", "⚓", "🌺", "🛶"];
  CO("treasure", "البحث عن الكنز", "🏴‍☠️", "الكنز مدفون بجزيرة 8×8. الملّاح بيشوف علامة ❌ لكنه ما بيقدر يحفر، والحفّار عنده 6 معاول بس ويشوف حار/بارد. احكوا مع بعض! (4 دقايق)", {
    dur: 240000, fin: 1, tick: 1, roles: (s) => { const o = A.order(s); return [`⛏️ الحفّار: ${o[0] ? who(o[0]) : "…"}`, `🧭 الملّاح (بيشوف الكنز): ${o[1] ? who(o[1]) : "…"}`]; },
    init: (s, r) => { s.st = { tx: Math.floor(r() * 8), ty: Math.floor(r() * 8), d: [], found: 0, lm: Array.from({ length: 64 }, () => (r() < 0.2 ? LM[Math.floor(r() * LM.length)] : "")) }; },
    mv: (s, a, m) => { const st = s.st; if (m.k !== "dig" || a !== order(s)[0] || st.found || st.d.length >= 6 || !(m.x >= 0 && m.x < 8 && m.y >= 0 && m.y < 8) || st.d.some((q) => q[0] === m.x && q[1] === m.y)) return false; st.d.push([m.x, m.y]); if (m.x === st.tx && m.y === st.ty) st.found = 1; return true; },
    complete: (s) => !!s.st.found || s.st.d.length >= 6,
    reward: (s) => { const st = s.st, left = 6 - st.d.length; return st.found ? { coins: 35 + 12 * left, items: left >= 3 ? { fu_birdhouse: 1 } : {}, best: left, text: `💎 لقيتوا الكنز بـ${st.d.length} معاول!` } : { coins: 8, text: "😅 ما لقيتوا الكنز… الكنز كان بـ" + (st.tx + 1) + "," + (st.ty + 1) }; },
    summary: (s) => s.paid ? s.paid.text : "",
    view: (s, box) => { const st = s.st, o = order(s), dig = me() === o[0], now = Math.max(0, Math.ceil((s.go + 240000 - Date.now()) / 1000));
      const cell = (x, y) => { const i = y * 8 + x, d = st.d.find((q) => q[0] === x && q[1] === y), dist = d ? Math.abs(x - st.tx) + Math.abs(y - st.ty) : 0, tag = d ? (dist === 0 ? "💎" : dist <= 2 ? "🔥" : dist <= 4 ? "🌤️" : "❄️") : (!dig && x === st.tx && y === st.ty ? "❌" : st.lm[i]); return `<button class="tr-c ${d ? "dug" : ""}" data-a="dig" data-x="${x}" data-y="${y}" ${!dig || d ? "disabled" : ""}>${tag || ""}</button>`; };
      box.innerHTML = `<div class="chk">${dig ? "⛏️ أنت الحفّار" : "🧭 أنت الملّاح: وجّه شريكك!"} · معاول: ${6 - st.d.length} · ⏱️ ${now}ث</div><div class="tr-g">${Array.from({ length: 64 }, (_, i) => cell(i % 8, Math.floor(i / 8))).join("")}</div><p class="hint">🔥 قريب جداً · 🌤️ دافي · ❄️ بعيد</p>`; },
    click: (a, b, s) => { if (a === "dig") mvSend(s, { k: "dig", x: +b.dataset.x, y: +b.dataset.y }); },
  });

  /* ---------- 🛵 توصيل ---------- */
  const SPD = 1300; // ملي ثانية لكل خانة
  const dOrders = (s) => s.st.orders;
  CO("deliver", "توصيل الطلبات", "🛵", "المنسّق بيشوف الطلبات الجديدة وبيسند (حد أقصى 3 مع السائق). السائق بيروح للبيوت (كل خانة ~1.3ث) ويوصّل قبل المهلة. توصيل بالوقت = أجرة كاملة، متأخر = نص. دقيقتين ونص!", {
    dur: 150000, fin: 1, tick: 1, roles: (s) => { const o = A.order(s); return [`📋 المنسّق: ${o[0] ? who(o[0]) : "…"}`, `🛵 السائق: ${o[1] ? who(o[1]) : "…"}`]; },
    init: (s, r) => { s.st = { orders: Array.from({ length: 10 }, (_, i) => ({ id: i, x: Math.floor(r() * 9), y: Math.floor(r() * 9), ap: 2 + i * 11 + Math.floor(r() * 6), dl: 60 + Math.floor(r() * 30), pay: 12 + Math.floor(r() * 24), as: 0, dn: 0, ok: 0 })), pos: [4, 4], last: s.go || s.t0, score: 0, n: 0 }; },
    mv: (s, a, m, t) => { const st = s.st, o = order(s), od = st.orders[m.o]; if (!od || od.dn) return false;
      if (m.k === "assign") { if (a !== o[0] || od.as || t < s.go + od.ap * 1000 || st.orders.filter((q) => q.as && !q.dn).length >= 3) return false; od.as = t; return true; }
      if (m.k === "deliver") { if (a !== o[1] || !od.as) return false; const dist = Math.abs(st.pos[0] - od.x) + Math.abs(st.pos[1] - od.y); if (t - Math.max(st.last, od.as) < Math.max(1, dist) * SPD * 0.8) return false; od.dn = t; od.ok = t <= s.go + (od.ap + od.dl) * 1000 ? 1 : 0; st.pos = [od.x, od.y]; st.last = t; st.score += od.ok ? od.pay : Math.round(od.pay / 2); st.n++; return true; }
      return false; },
    complete: (s) => s.st.orders.every((q) => q.dn),
    reward: (s) => ({ coins: Math.min(80, Math.round(s.st.score * 0.7)), best: s.st.score, text: `🛵 وصّلتوا ${s.st.n} طلب · أجرة ${s.st.score}` }), summary: (s) => s.paid ? s.paid.text : "",
    view: (s, box) => { const st = s.st, o = order(s), dispatcher = me() === o[0], now = Date.now(), el = Math.floor((now - s.go) / 1000), act = st.orders.filter((q) => q.as && !q.dn);
      const row = (q) => { const dist = Math.abs(st.pos[0] - q.x) + Math.abs(st.pos[1] - q.y), left = Math.max(0, q.ap + q.dl - el), eta = Math.max(0, Math.ceil((Math.max(st.last, q.as) + Math.max(1, dist) * SPD * 0.8 - now) / 1000)); return dispatcher ? `<div class="irow"><span class="ie">📦</span><div class="iname"><b>طلب #${q.id + 1} → (${q.x + 1},${q.y + 1})</b><small>أجرة ${q.pay}🪙 · مهلة ${left}ث</small></div><div class="ib"><button class="btn sm gold" data-a="asg" data-o="${q.id}" ${q.as || act.length >= 3 ? "disabled" : ""}>${q.as ? "مُسنَد" : "أسند"}</button></div></div>` : `<div class="irow"><span class="ie">📦</span><div class="iname"><b>طلب #${q.id + 1} → (${q.x + 1},${q.y + 1})</b><small>مسافة ${dist} · مهلة ${left}ث${eta > 0 ? " · وصول بعد " + eta + "ث" : ""}</small></div><div class="ib"><button class="btn sm berry" data-a="dlv" data-o="${q.id}" ${eta > 0 ? "disabled" : ""}>✅ وصّلت</button></div></div>`; };
      const list = (dispatcher ? st.orders.filter((q) => !q.dn && q.ap <= el) : act).map(row).join("") || `<div class="empty">${dispatcher ? "ما في طلبات جديدة هلأ…" : "بانتظار المنسّق يسند طلبات…"}</div>`;
      const grid = Array.from({ length: 81 }, (_, i) => { const x = i % 9, y = Math.floor(i / 9), q = st.orders.find((z) => z.x === x && z.y === y && !z.dn && (z.as || (dispatcher && z.ap <= el))); return `<i class="dl-c">${st.pos[0] === x && st.pos[1] === y ? "🛵" : q ? (q.as ? "🏠" : "📦") : ""}</i>`; }).join("");
      box.innerHTML = `<div class="chk">${dispatcher ? "📋 منسّق" : "🛵 سائق"} · ⏱️ ${Math.max(0, 150 - el)}ث · أجرة ${st.score}🪙 · موصّل ${st.n}</div><div class="dl-g">${grid}</div><div class="items">${list}</div>`; },
    click: (a, b, s) => { if (a === "asg") mvSend(s, { k: "assign", o: +b.dataset.o }); if (a === "dlv") mvSend(s, { k: "deliver", o: +b.dataset.o }); },
  });

  /* ---------- 🍽️ مطعم ---------- */
  const MENU = [["🍔", ["🍞", "🥩", "🧀"]], ["🍕", ["🫓", "🍅", "🧀"]], ["🥗", ["🥬", "🍅", "🥒"]], ["🍝", ["🍝", "🍅", "🧄"]]];
  CO("resto", "تحدي المطعم", "🍽️", "النادل بياخد طلبات الزبائن ويقدّمها، والطباخ بيحضّر كل طبق بالترتيب الصحيح للمكوّنات. الزبون صبره 50 ثانية! دقيقتين وبتشوفوا كم زبون رضيتوا.", {
    dur: 120000, fin: 1, tick: 1, roles: (s) => { const o = A.order(s); return [`🧑‍🍳 النادل: ${o[0] ? who(o[0]) : "…"}`, `👨‍🍳 الطباخ: ${o[1] ? who(o[1]) : "…"}`]; },
    init: (s, r) => { s.st = { cs: Array.from({ length: 11 }, (_, i) => ({ id: i, ap: 3 + i * 10, m: Math.floor(r() * 4), tk: 0, ck: 0, sv: 0, bad: 0 })), served: 0, tip: 0 }; },
    mv: (s, a, m, t) => { const o = order(s), c = s.st.cs[m.c]; if (!c || c.sv || t < s.go + c.ap * 1000) return false; if (t > s.go + (c.ap + 50) * 1000 + 2500) return false;
      if (m.k === "take") { if (a !== o[0] || c.tk) return false; c.tk = t; return true; }
      if (m.k === "cook") { if (a !== o[1] || !c.tk || c.ck) return false; if (!m.ok) { c.bad++; return c.bad < 99; } c.ck = t; return true; }
      if (m.k === "serve") { if (a !== o[0] || !c.ck) return false; c.sv = t; s.st.served++; s.st.tip += c.ck - c.tk < 14000 ? 9 : 6; return true; } return false; },
    complete: (s) => s.st.cs.every((c) => c.sv),
    reward: (s) => ({ coins: Math.min(90, s.st.tip + 5), items: s.st.served >= 8 ? { "@f:d_fruit": 1 } : {}, best: s.st.served, text: `🍽️ رضيتوا ${s.st.served}/11 زبون · بقشيش ${s.st.tip}` }), summary: (s) => s.paid ? s.paid.text : "",
    view: (s, box) => { const st = s.st, o = order(s), waiter = me() === o[0], now = Date.now(), el = (now - s.go) / 1000;
      const live = st.cs.filter((c) => !c.sv && c.ap <= el && el <= c.ap + 50);
      const row = (c) => { const left = Math.ceil(c.ap + 50 - el), M = MENU[c.m]; return waiter ? `<div class="irow"><span class="ie">${M[0]}</span><div class="iname"><b>طاولة ${c.id + 1}</b><small>⏳ ${left}ث · ${c.sv ? "" : c.ck ? "جاهز للتقديم 🛎️" : c.tk ? "عند الطباخ" : "بانتظار الطلب"}</small></div><div class="ib">${!c.tk ? `<button class="btn sm gold" data-a="rt" data-c="${c.id}">📝 خذ الطلب</button>` : c.ck ? `<button class="btn sm berry" data-a="rs" data-c="${c.id}">🛎️ قدّم</button>` : ""}</div></div>` : (c.tk && !c.ck ? `<div class="irow"><span class="ie">${M[0]}</span><div class="iname"><b>طلب طاولة ${c.id + 1}</b><small>⏳ ${left}ث · ${M[1].join(" ")}</small></div><div class="ib"><button class="btn sm gold" data-a="rc" data-c="${c.id}">🍳 حضّر</button></div></div>` : ""); };
      box.innerHTML = `<div class="chk">${waiter ? "🧑‍🍳 نادل" : "👨‍🍳 طباخ"} · ⏱️ ${Math.max(0, 120 - Math.floor(el))}ث · قُدّم ${st.served} · بقشيش ${st.tip}</div><div class="items">${live.map(row).join("") || '<div class="empty">بانتظار زبائن…</div>'}</div>`; },
    click: (a, b, s) => { const c = +b.dataset.c; if (a === "rt") mvSend(s, { k: "take", c }); if (a === "rs") mvSend(s, { k: "serve", c });
      if (a === "rc") { const M = MENU[s.st.cs[c].m], box = document.getElementById("actBody"), need = M[1], ans = []; const all = ["🍞", "🥩", "🧀", "🫓", "🍅", "🥬", "🥒", "🍝", "🧄"]; A.busy = true;
        const draw = () => { box.innerHTML = `<p class="hint">حضّر ${M[0]} بالترتيب: <b>${need.join(" → ")}</b></p><div class="sq-pick">${all.map((x) => `<button class="btn alt" data-k="${x}">${x}</button>`).join("")}</div><div class="sq-ans">${ans.join(" ")}</div>`; }; draw();
        box.onclick = (ev) => { const bt = ev.target.closest("[data-k]"); if (!bt) return; ans.push(bt.dataset.k); if (ans.length >= need.length) { box.onclick = null; const ok = ans.every((x, i) => x === need[i]); A.busy = false; OSW.audio.sfx(ok ? "coin" : "boom"); mvSend(s, { k: "cook", c, ok }).then(() => A.view()); } else draw(); }; } },
  });

  /* ---------- 🔴 أربعة بصف ---------- */
  const win4 = (b, c, r) => { const v = b[r * 7 + c]; for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { let n = 1; for (const sg of [1, -1]) { let x = c + dx * sg, y = r + dy * sg; while (x >= 0 && x < 7 && y >= 0 && y < 6 && b[y * 7 + x] === v) { n++; x += dx * sg; y += dy * sg; } } if (n >= 4) return true; } return false; };
  CO("c4", "أربعة بصف", "🔴", "لعبة الطاولة الكلاسيكية بالدور: أول واحد يرتّب 4 قطع بصف (أفقي/عمودي/قطري) بيفوز. المكافأة الصغيرة للاثنين، والفخر للفائز! 😎", {
    roles: (s) => { const o = A.order(s); return [`🔴 ${o[0] ? who(o[0]) : "…"} · 🟡 ${o[1] ? who(o[1]) : "…"} · الأحمر بيبدأ`]; },
    init: (s) => { s.st = { b: Array(42).fill(0), turn: 0, win: -1, n: 0 }; },
    mv: (s, a, m) => { const st = s.st, o = order(s); if (m.k !== "drop" || st.win >= 0 || a !== o[st.turn] || !(m.c >= 0 && m.c < 7)) return false; let r = 5; while (r >= 0 && st.b[r * 7 + m.c]) r--; if (r < 0) return false; st.b[r * 7 + m.c] = st.turn + 1; st.n++; if (win4(st.b, m.c, r)) st.win = st.turn; else if (st.n >= 42) st.win = 2; else st.turn = 1 - st.turn; return true; },
    complete: (s) => s.st.win >= 0, reward: (s) => ({ coins: s.st.win === 2 ? 15 : 22, best: 1, text: s.st.win === 2 ? "🤝 تعادل" : `🏆 الفائز: ${who(order(s)[s.st.win])}` }), summary: (s) => s.paid ? s.paid.text : "",
    view: (s, box) => { const st = s.st, o = order(s); box.innerHTML = `${turnTxt(s, o[st.turn])}<div class="c4-g">${Array.from({ length: 42 }, (_, i) => `<i class="c4-c c4-${st.b[i]}"></i>`).join("")}</div><div class="c4-b">${Array.from({ length: 7 }, (_, c) => `<button class="btn sm ${st.turn === 0 ? "berry" : "gold"}" data-a="drop" data-c="${c}" ${o[st.turn] !== me() ? "disabled" : ""}>⬇️</button>`).join("")}</div>`; },
    click: (a, b, s) => { if (a === "drop") mvSend(s, { k: "drop", c: +b.dataset.c }); },
  });

  /* ---------- 🃏 ذاكرة الأزواج ---------- */
  CO("memo", "ذاكرة الأزواج", "🃏", "16 ورقة مقلوبة بالدور: اقلب ورقتين، لو تطابقوا خود نقطة وكمّل. الأكثر أزواج بيفوز.", {
    roles: () => ["🃏 بالدور · الأول بيبدأ"], init: (s, r) => { const e = ["🍎", "🌟", "🐱", "🚗", "🎈", "🍕", "🌙", "🎵"], d = e.concat(e).map((x) => [r(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); s.st = { d, open: [], m: {}, turn: 0, sc: [0, 0], last: null }; },
    mv: (s, a, m) => { const st = s.st, o = order(s); if (m.k !== "flip" || a !== o[st.turn] || !(m.i >= 0 && m.i < 16) || st.m[m.i] || st.open.includes(m.i)) return false; if (!st.open.length) st.last = null; st.open.push(m.i);
      if (st.open.length === 2) { const [x, y] = st.open; if (st.d[x] === st.d[y]) { st.m[x] = st.m[y] = 1; st.sc[st.turn]++; } else { st.last = [x, y]; st.turn = 1 - st.turn; } st.open = []; } return true; },
    complete: (s) => Object.keys(s.st.m).length >= 16, reward: (s) => ({ coins: 20, best: Math.max(...s.st.sc), text: s.st.sc[0] === s.st.sc[1] ? "🤝 تعادل" : `🏆 الفائز: ${who(order(s)[s.st.sc[0] > s.st.sc[1] ? 0 : 1])} (${Math.max(...s.st.sc)}-${Math.min(...s.st.sc)})` }), summary: (s) => s.paid ? s.paid.text : "",
    view: (s, box) => { const st = s.st, o = order(s); box.innerHTML = `${turnTxt(s, o[st.turn])}<div class="chk">${who(o[0])}: ${st.sc[0]} · ${who(o[1])}: ${st.sc[1]}</div><div class="mm-g">${st.d.map((x, i) => { const up = st.m[i] || st.open.includes(i) || (st.last && st.last.includes(i)); return `<button class="mm-c ${up ? "up" : ""}" data-a="flip" data-i="${i}" ${o[st.turn] !== me() || up ? "disabled" : ""}>${up ? x : "❓"}</button>`; }).join("")}</div>`; },
    click: (a, b, s) => { if (a === "flip") mvSend(s, { k: "flip", i: +b.dataset.i }); },
  });

  /* ---------- 🛋️ تحدي التصميم ---------- */
  const THEMES = [["غرفة نوم رومانسية", ["bed"], "🛏️"], ["ركن قراءة هادي", ["office", "decor"], "📚"], ["صالة استقبال فخمة", ["living"], "🛋️"], ["غرفة ألعاب الأحلام", ["fun"], "🎮"], ["حديقة حلوة", ["garden"], "🌿"], ["مطبخ عصري", ["kitchen"], "🍳"]];
  const BUDGET = 1800;
  const dItems = (s) => { const th = THEMES[s.st.th], FU = OSW.FURN, ids = Object.keys(FU), sh = (a, sd) => a.map((k) => [A.hash(sd + k), k]).sort((x, y) => x[0] - y[0]).map((x) => x[1]), pool = sh(ids.filter((k) => th[1].includes(FU[k].cat)), s.id).slice(0, 16), rest = sh(ids.filter((k) => !pool.includes(k) && FU[k].price <= 400), s.id + "r").slice(0, 8); return pool.concat(rest); };
  CO("design", "تحدي التصميم", "🛋️", "ثيم مشترك وميزانية افتراضية 1800🪙: كل واحد بيصمّم غرفة صغيرة بالأثاث، وبعدين بتقيّموا بعض بالنجوم. التصميم على الثيم بيعطي نقاط زيادة!", {
    roles: () => ["🎨 كل واحد بيصمّم لحاله وبعدين تقيّموا"], init: (s, r) => { s.st = { th: Math.floor(r() * THEMES.length), sub: {}, rate: {} }; },
    mv: (s, a, m) => { const st = s.st, o = order(s); if (m.k === "sub") { if (st.sub[a] || !Array.isArray(m.it) || m.it.length > 24) return false; let cost = 0; const FU = OSW.FURN; for (const q of m.it) { if (!FU[q[0]] || !(q[1] >= 0 && q[1] < 8 && q[2] >= 0 && q[2] < 6)) return false; cost += FU[q[0]].price; } if (cost > BUDGET) return false; st.sub[a] = m.it.map((q) => [q[0], q[1] | 0, q[2] | 0]); return true; }
      if (m.k === "rate") { const tgt = o.find((u) => u !== a); if (!(m.n >= 1 && m.n <= 5) || st.rate[tgt] || !st.sub[tgt] || !st.sub[a]) return false; st.rate[tgt] = m.n | 0; return true; } return false; },
    complete: (s) => Object.keys(s.st.rate).length >= 2, reward: (s) => { const st = s.st, th = THEMES[st.th], FU = OSW.FURN; const on = Object.values(st.sub).reduce((n, it) => n + it.filter((q) => th[1].includes(FU[q[0]].cat)).length, 0), avg = (Object.values(st.rate).reduce((x, y) => x + y, 0)) / 2; return { coins: Math.round(15 + avg * 6 + Math.min(20, on * 2)), best: Math.round(avg * 10), text: `⭐ متوسط التقييم ${avg} · قطع على الثيم ${on}` }; }, summary: (s) => s.paid ? s.paid.text : "",
    view: (s, box) => { const st = s.st, o = order(s), th = THEMES[st.th], u = me(), other = o.find((x) => x !== u), FU = OSW.FURN, items = dItems(s); const ds = A._ds = A._ds && A._ds.sid === s.id ? A._ds : { sid: s.id, sel: null, it: [] };
      const grid = (it, click) => `<div class="ds-g">${Array.from({ length: 48 }, (_, i) => { const x = i % 8, y = Math.floor(i / 8), q = it.find((z) => z[1] === x && z[2] === y); return `<button class="ds-c ${q ? "on" : ""}" ${click ? `data-a="cell" data-x="${x}" data-y="${y}"` : "disabled"}>${q ? FU[q[0]].e : ""}</button>`; }).join("")}</div>`;
      if (!st.sub[u]) { const cost = ds.it.reduce((n, q) => n + FU[q[0]].price, 0); box.innerHTML = `<div class="pick" style="font-size:17px">${th[2]} الثيم: <b>${th[0]}</b></div><div class="chk">💰 ${cost}/${BUDGET}</div>${grid(ds.it, true)}<div class="ds-p">${items.map((k) => `<button class="btn sm ${ds.sel === k ? "gold" : "alt"}" data-a="pick" data-k="${k}">${FU[k].e}<small>${FU[k].price}</small></button>`).join("")}</div><p class="hint">اختار قطعة وانقر خانة، وانقر القطعة مرة ثانية لحذفها</p><button class="btn berry" data-a="subm" ${ds.it.length ? "" : "disabled"}>✅ سلّم التصميم</button>`; return; }
      if (!st.sub[other]) { box.innerHTML = `<div class="chk ok">✅ سلّمت تصميمك</div><div class="chk">⏳ بانتظار ${who(other)}…</div>${grid(st.sub[u], false)}`; return; }
      if (!st.rate[other]) { box.innerHTML = `<div class="pick">تصميم ${who(other)} 👀 (${th[0]})</div>${grid(st.sub[other], false)}<div class="two">${[1, 2, 3, 4, 5].map((n) => `<button class="btn sm gold" data-a="rate" data-n="${n}">${"⭐".repeat(n)}</button>`).join("")}</div>`; return; }
      box.innerHTML = `<div class="chk ok">✅ قيّمت تصميم ${who(other)}</div><div class="chk">⏳ بانتظار تقييمك من ${who(other)}…</div>`; },
    click: (a, b, s) => { const ds = A._ds; if (!ds) return; if (a === "pick") { ds.sel = b.dataset.k; return A.view(); } if (a === "cell") { const x = +b.dataset.x, y = +b.dataset.y, i = ds.it.findIndex((q) => q[1] === x && q[2] === y); if (i >= 0) ds.it.splice(i, 1); else if (ds.sel) { if (ds.it.reduce((n, q) => n + OSW.FURN[q[0]].price, 0) + OSW.FURN[ds.sel].price > BUDGET) return ui().toast("💰 تعدّيت الميزانية"); ds.it.push([ds.sel, x, y]); } return A.view(); }
      if (a === "subm") return mvSend(s, { k: "sub", it: ds.it }).then(() => A.view()); if (a === "rate") return mvSend(s, { k: "rate", n: +b.dataset.n }); },
  });
})();
