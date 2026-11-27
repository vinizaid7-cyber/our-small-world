/* لمسات الأسطورة (V13): كبسولة الزمن · وعاء الأسباب · سؤال اليوم · نجوم الأمنيات.
   كل شي أحداث game (lg_*) والحالة بتنحسب بالـfold (نفس نظام اللعبة): بيتحفظ، بيتزامن بين التلفونين، والمكافآت مرة وحدة مهما أعدتوا التحميل.
   ربط الدمج: سطر واحد بـ extras.js (OSW.legend.fold) وتغليف G.click لبادئة g-lgd-. */
(function () {
  "use strict";
  const OSW = window.OSW; if (!OSW || !OSW.game) return;
  const L = (OSW.legend = { v: 1 }), esc = OSW.esc;
  const $ = (s) => document.querySelector(s);
  const G = () => OSW.game, ui = () => OSW.ui, db = () => OSW.ui.db, P = () => OSW.places;
  const toast = (m, c, ms) => ui().toast(m, c || "", ms), sfx = (n) => { try { OSW.audio && OSW.audio.sfx(n); } catch (e) { /* */ } };
  const hearts = (e, n) => { try { ui().hearts(e, n || 8); } catch (er) { /* */ } };
  const dayOf = (t) => Math.floor((t + 3 * 3600000) / 86400000);
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const fmt = (t) => new Date(t).toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" });
  const CAP_COINS = 25, DRAW_COINS = 5, QA_COINS = 15, WISH_COINS = 3;

  /* ============ أسئلة اليوم (حتمية بالتاريخ: نفس السؤال عند الاثنين) ============ */
  const QS = L.QUESTIONS = [
    "شو أول شي لفت نظرك فيّ؟", "شو أحلى ذكرى بيناتنا لهلأ؟", "لو سافرنا بكرة، وين بتاخدني؟", "شو الشي اللي بيضحّكك مهما كان مزاجك؟",
    "شو أكلة بتذكّرك فيّ؟", "شو أكتر موقف حسّيت فيه إني سندك؟", "شو حلمك اللي ما حكيتلي عنه؟", "لو كان عنا بيت على البحر، شو أول شي بنعمل فيه؟",
    "شو الأغنية اللي بتحسّها بتشبهنا؟", "شو شي صغير بعمله وبيفرّحك؟", "أي يوم من أيامنا بتتمنى تعيده؟", "شو أكتر شي بتحب نعمله سوا بنهاية الأسبوع؟",
    "شو الشي اللي تعلّمته مني؟", "لو بتعطيني لقب، شو بيكون؟", "شو أكتر شي بيريّحك لما تكون تعبان؟", "شو أغرب شي بتحب تجرّبه سوا؟",
    "شو اللي بتتخيله لما تفكر فينا بعد 10 سنين؟", "شو أحلى كلمة سمعتها مني؟", "شو الصفة اللي بتحبها فيك وبتحس إني بشوفها؟", "لو معنا يوم فاضي بدون موبايلات، شو بنعمل؟",
    "شو أول إشي بتحب نشتريه لبيتنا؟", "مين الشخص اللي بتتمنى أعرّفك عليه أكتر؟", "شو شي بتخاف منه وبتحس إني بخفّف عنك؟", "شو أحلى مفاجأة عملتها أو بتحلم تعملها إلي؟",
    "شو الفلم اللي بدك نشوفه سوا؟", "شو العادة اللي عندي وبتحبها كتير؟", "شو بتحب أكتر: الصبح أو الليل؟ وليش؟", "لو رجعنا لأول يوم، شو بتغيّر؟ ولا ولا شي؟",
    "شو الهدية اللي بتتمنى تاخدها مني؟", "شو أحلى مكان قعدنا فيه سوا؟", "شو بيخلّيك تحس إنك مهم عندي؟", "شو نصيحة بتعطيني ياها هالأسبوع؟",
    "شو الأكلة اللي بدك أطبخها لك؟", "شو أكتر شي بتشتاقله لما نبعد؟", "شو الشي اللي بتتمنى نعمله كل سنة بنفس اليوم؟", "شو اللقطة اللي بتحب تتصوّرها معي؟",
    "شو أكتر كلمة بتحب أسمّيك فيها؟", "شو الشي اللي بتفتخر فيه عنا؟", "لو كتبنا كتاب عن قصتنا، شو اسمه؟", "شو أمنيتك لسنتنا الجاية؟",
  ];
  L.questionFor = (day) => QS[(day * 7 + 3) % QS.length];

  /* ============ الحالة (fold) ============ */
  const st = (S) => S.lg || (S.lg = { caps: {}, opened: {}, reasons: [], drawn: {}, qa: {}, qaPaid: {}, wishes: [], wishDay: {} });
  L.state = (S) => st(S || G().state());
  L.fold = (ty, e, d, t, a, day, S, H) => {
    if (typeof ty !== "string" || ty.slice(0, 3) !== "lg_") return false;
    const s = st(S); d = d || {};
    if (ty === "lg_cap") {
      const text = String(d.text || "").trim().slice(0, 700), open = Number(d.open);
      if (!text || !(open > 0) || !d.to) return true;
      s.caps[e.id] = { id: e.id, from: a, to: String(d.to), open, t, text, emo: String(d.emo || "💌").slice(0, 4) }; return true;
    }
    if (ty === "lg_open") {
      const c = s.caps[d.cap]; if (!c || s.opened[c.id] || a !== c.to || t < c.open) return true;
      s.opened[c.id] = t; S.coins += CAP_COINS; return true;
    }
    if (ty === "lg_reason") {
      const x = String(d.text || "").trim().slice(0, 160); if (!x || s.reasons.length >= 500) return true;
      s.reasons.push({ id: e.id, by: a, t, text: x }); return true;
    }
    if (ty === "lg_draw") {
      const k = a + ":" + day; if (s.drawn[k]) return true;
      const pool = s.reasons.filter((r) => r.by !== a); if (!pool.length) return true;
      s.drawn[k] = pool[hash(k + ":" + pool.length) % pool.length].id; S.coins += DRAW_COINS; return true;
    }
    if (ty === "lg_ans") {
      if (Number(d.q) !== day) return true;
      const x = String(d.text || "").trim().slice(0, 500); if (!x) return true;
      const m = s.qa[day] || (s.qa[day] = {}); if (m[a]) return true; m[a] = { t, text: x };
      if (Object.keys(m).length >= 2 && !s.qaPaid[day]) { s.qaPaid[day] = 1; S.coins += QA_COINS; } return true;
    }
    if (ty === "lg_wish") {
      const x = String(d.text || "").trim().slice(0, 140); if (!x || s.wishes.length >= 300) return true;
      s.wishes.push({ by: a, t, text: x }); const k = a + ":" + day; if (!s.wishDay[k]) { s.wishDay[k] = 1; S.coins += WISH_COINS; } return true;
    }
    return true;
  };

  /* ============ مساعدات ============ */
  const me = () => db().uid, pa = () => db().partner || null;
  const nameOf = (uid) => { try { return uid === me() ? (db().me && db().me.name) || "أنا" : (pa() && pa().id === uid ? pa().name : ui().prof(uid).name) || "شريكك"; } catch (e) { return "شريكك"; } };
  const today = () => dayOf(Date.now());
  const coinBar = () => `<div class="coinbar">🪙 <b>${G().state().coins}</b></div>`;
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${name}</b><small>${sub}</small></div><div class="ib">${btns || ""}</div></div>`;
  const back = `<div class="row" style="margin-top:10px"><button class="btn alt sm" data-act="g-lgd-open" data-k="legend">↩️ رجوع</button></div>`;
  const capsForMe = () => Object.values(L.state().caps).filter((c) => c.to === me()).sort((a, b) => a.open - b.open);
  const capsFromMe = () => Object.values(L.state().caps).filter((c) => c.from === me() && c.to !== me()).sort((a, b) => a.open - b.open);
  const readyCaps = () => capsForMe().filter((c) => !L.state().opened[c.id] && Date.now() >= c.open);
  const qaToday = () => (L.state().qa[today()] || {});
  const qStreak = () => { const s = L.state(); let d = today(), n = 0; if (!(s.qa[d] && Object.keys(s.qa[d]).length >= 2)) d--; while (s.qa[d] && Object.keys(s.qa[d]).length >= 2) { n++; d--; } return n; };
  const badgeCount = () => readyCaps().length + (qaToday()[me()] ? 0 : 1);

  /* ============ النوافذ ============ */
  if (P()) { P().noRefresh = Object.assign(P().noRefresh || {}, { lgcapnew: 1, lgjar: 1, lgq: 1, lgwish: 1, lgletter: 1 }); }
  const O = G().openers;
  O.legend = () => {
    const s = L.state(), rc = readyCaps().length, qd = qaToday(), my = !!qd[me()], jar = s.reasons.length, nw = s.wishes.length;
    ui().openModal(`<h3>🌟 لمسات الأسطورة</h3>${coinBar()}<div class="items" style="margin:8px 0">
      ${irow("💌", "كبسولة الزمن", rc ? `🎁 عندك ${rc} رسالة جاهزة تنفتح!` : "رسالة بتنفتح بتاريخ بالمستقبل", `<button class="btn sm alt" data-act="g-lgd-open" data-k="lgcap">افتح</button>`)}
      ${irow("🫙", "وعاء الأسباب", `${jar} سبب بالوعاء · اسحبوا سبب كل يوم`, `<button class="btn sm alt" data-act="g-lgd-open" data-k="lgjar">افتح</button>`)}
      ${irow("❓", "سؤال اليوم", my ? (Object.keys(qd).length >= 2 ? "جاوبتوا الاثنين ✅" : "بانتظار جواب شريكك") : "جاوب وشوف جواب شريكك", `<button class="btn sm alt" data-act="g-lgd-open" data-k="lgq">افتح</button>`)}
      ${irow("🌠", "نجوم الأمنيات", nw ? `${nw} أمنية بالسما` : "بالليل بتعبر نجمة… تمنّى", `<button class="btn sm alt" data-act="g-lgd-open" data-k="lgwish">افتح</button>`)}
    </div><p class="hint">كل شي بينحفظ ويتزامن بين تلفونكم 💞</p>`);
  };

  O.lgcap = () => {
    const s = L.state(), mine = capsForMe(), sent = capsFromMe(), now = Date.now();
    const sealedAll = (db().sealed || []).filter((x) => x.house === "game" && x.title === "lg_cap" && !s.caps[x.id]);
    const sealedIn = sealedAll.filter((x) => x.author !== me() && pa() && x.author === pa().id);
    const sealedOut = sealedAll.filter((x) => x.author === me());
    const mineRows = mine.map((c) => {
      const op = !!s.opened[c.id], ready = !op && now >= c.open, left = Math.ceil((c.open - now) / 86400000);
      const sub = op ? `انفتحت · من ${esc(nameOf(c.from))}` : ready ? `جاهزة! من ${esc(nameOf(c.from))}` : `🔒 بتنفتح ${fmt(c.open)} (باقي ${left} يوم)`;
      const btn = op ? `<button class="btn sm alt" data-act="g-lgd-read" data-id="${c.id}">اقرأ</button>` : ready ? `<button class="btn sm gold" data-act="g-lgd-unseal" data-id="${c.id}">🎁 افتح +${CAP_COINS}🪙</button>` : `<span class="tag">🔒</span>`;
      return irow(c.emo, `رسالة ${op || ready ? "إلك" : "مختومة"}`, sub, btn);
    }).concat(sealedIn.map((c) => {
      const openMs = new Date(c.unlock_at).getTime(), left = Math.max(1, Math.ceil((openMs - now) / 86400000));
      return irow("💌", "رسالة مختومة", `🔒 بتنفتح ${fmt(openMs)} (باقي ${left} يوم)`, `<span class="tag">🔒</span>`);
    })).join("");
    const sentRows = sent.map((c) => irow(c.emo, `أرسلت لـ${esc(nameOf(c.to))}`, `${now >= c.open ? "انفتحت/جاهزة" : "🔒 بتنفتح"} ${fmt(c.open)}`, ""))
      .concat(sealedOut.map((c) => irow("💌", `أرسلت لـ${esc(pa() ? pa().name : "شريكك")}`, `🔒 بتنفتح ${fmt(new Date(c.unlock_at).getTime())}`, "")))
      .join("");
    ui().openModal(`<h3>💌 كبسولة الزمن</h3><p class="hint">اكتب رسالة وحدد تاريخ، وما بتنفتح عند شريكك إلا بهالتاريخ ⏳</p>
      <button class="btn berry" style="width:100%" data-act="g-lgd-open" data-k="lgcapnew">✍️ اكتب كبسولة جديدة</button>
      <b style="display:block;margin-top:10px">📥 إلي</b><div class="items" style="margin:6px 0">${mineRows || '<div class="empty">ما في رسائل إلك لسا</div>'}</div>
      <b>📤 اللي أرسلتها</b><div class="items" style="margin:6px 0">${sentRows || '<div class="empty">ما أرسلت شي لسا</div>'}</div>${back}`);
  };
  O.lgcapnew = () => {
    const p = pa(), min = new Date(Date.now() + 86400000 + 3 * 3600000).toISOString().slice(0, 10);
    ui().openModal(`<h3>✍️ كبسولة جديدة</h3><p class="hint">لـ <b>${esc(p ? p.name : "نفسك")}</b></p>
      <textarea id="lgText" class="in" rows="5" maxlength="700" placeholder="اكتب اللي بدك ياه ينفتح بالمستقبل…"></textarea>
      <div class="field"><label>تنفتح بتاريخ</label><input type="date" class="in" id="lgDate" min="${min}"></div>
      <div class="seg" style="margin:6px 0">${[[7, "أسبوع"], [30, "شهر"], [100, "100 يوم"], [365, "سنة"]].map(([n, t]) => `<button data-act="g-lgd-preset" data-k="${n}">${t}</button>`).join("")}</div>
      <button class="btn berry" style="width:100%" data-act="g-lgd-capsave">🔒 اختم الكبسولة</button>
      <div class="row" style="margin-top:8px"><button class="btn alt sm" data-act="g-lgd-open" data-k="lgcap">↩️ رجوع</button></div>`);
  };
  O.lgjar = () => {
    const s = L.state(), k = me() + ":" + today(), drawnId = s.drawn[k], r = drawnId && s.reasons.find((x) => x.id === drawnId);
    const mineN = s.reasons.filter((x) => x.by === me()).length, theirs = s.reasons.filter((x) => x.by !== me()).length;
    ui().openModal(`<h3>🫙 وعاء الأسباب</h3><p class="hint">اكتب سبب بتحبه فيه. وكل يوم بتسحب سبب من اللي كتبه شريكك عنك.</p>
      <div class="row"><input class="in" id="lgReason" maxlength="160" placeholder="بحبك لأنك…" style="flex:1"><button class="btn berry" data-act="g-lgd-reason">أضف</button></div>
      <div class="chk" style="margin:10px 0;justify-content:center">كتبت ${mineN} · كتب ${esc(pa() ? pa().name : "شريكك")} ${theirs}</div>
      ${r ? `<div class="top-block" style="text-align:center">🫙 سبب اليوم<br><b style="font-size:1.15em">${esc(r.text)}</b></div>` : `<button class="btn gold" style="width:100%" data-act="g-lgd-draw" ${theirs ? "" : "disabled"}>🫙 اسحب سبب اليوم (+${DRAW_COINS}🪙)</button>${theirs ? "" : '<p class="hint">لسا شريكك ما كتب أسباب</p>'}`}${back}`);
  };
  O.lgq = () => {
    const day = today(), q = L.questionFor(day), m = qaToday(), mine = m[me()], both = Object.keys(m).length >= 2, p = pa(), sk = qStreak();
    const ans = (uid, a) => `<div class="note" style="--nc:#fff3b0;--rot:0deg;min-height:60px;margin:6px 0"><b>${esc(nameOf(uid))}</b><br>${esc(a.text)}</div>`;
    let body;
    if (!mine) body = `<textarea id="lgAns" class="in" rows="4" maxlength="500" placeholder="جاوب بصراحة…"></textarea><button class="btn berry" style="width:100%;margin-top:8px" data-act="g-lgd-ans">أرسل جوابي</button>`;
    else if (!both) body = ans(me(), mine) + `<p class="hint">🔒 جواب ${esc(p ? p.name : "شريكك")} بيظهر لما يجاوب</p>`;
    else body = Object.entries(m).map(([u, a]) => ans(u, a)).join("") + `<p class="hint">✅ جاوبتوا الاثنين! (+${QA_COINS}🪙)</p>`;
    const past = Object.keys(L.state().qa).map(Number).filter((d) => d < day && Object.keys(L.state().qa[d]).length >= 2).sort((a, b) => b - a).slice(0, 5)
      .map((d) => irow("📖", esc(L.questionFor(d)), Object.entries(L.state().qa[d]).map(([u, a]) => `${esc(nameOf(u))}: ${esc(a.text.slice(0, 40))}`).join(" · "), "")).join("");
    ui().openModal(`<h3>❓ سؤال اليوم</h3><div class="chk" style="justify-content:center">🔥 سلسلة ${sk} يوم</div>
      <div class="top-block" style="text-align:center;margin:8px 0"><b>${esc(q)}</b></div>${body}
      ${past ? `<b style="display:block;margin-top:10px">أيام فاتت</b><div class="items" style="margin:6px 0">${past}</div>` : ""}${back}`);
  };
  O.lgwish = () => {
    const ws = L.state().wishes.slice(-6).reverse().map((w) => irow("🌠", esc(w.text), `${esc(nameOf(w.by))} · ${fmt(w.t)}`, "")).join("");
    ui().openModal(`<h3>🌠 نجوم الأمنيات</h3><p class="hint">لما تشوفوا نجمة بالسما بالليل اضغطوا عليها وتمنّوا. أو اكتبوا أمنية هلأ.</p>
      <div class="row"><input class="in" id="lgWish" maxlength="140" placeholder="شو أمنيتك؟" style="flex:1"><button class="btn gold" data-act="g-lgd-wish">🌠 تمنّى</button></div>
      <div class="items" style="margin:10px 0">${ws || '<div class="empty">ما في أمنيات لسا</div>'}</div>${back}`);
  };

  /* ============ النقرات ============ */
  L.click = async (a, el) => {
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } }, val = (id) => (($(id) || {}).value || "").trim();
    switch (a) {
      case "g-lgd-open": return P().open(d.k);
      case "g-lgd-preset": { const t = new Date(Date.now() + Number(d.k) * 86400000 + 3 * 3600000).toISOString().slice(0, 10); const i = $("#lgDate"); if (i) i.value = t; return; }
      case "g-lgd-capsave": return busy(async () => {
        const text = val("#lgText"), v = val("#lgDate"), m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
        if (!text) return toast("اكتب الرسالة أول 😊"); if (!m) return toast("اختار تاريخ");
        const open = new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0).getTime(); if (open <= Date.now()) return toast("لازم التاريخ بالمستقبل ⏳");
        await G().do("lg_cap", { to: pa() ? pa().id : me(), open, text, emo: "💌" }, { unlock_at: new Date(open).toISOString() }); sfx("magic"); hearts("💌", 10); toast("🔒 انختمت الكبسولة", "gold"); P().open("lgcap");
      });
      case "g-lgd-unseal": return busy(async () => { await G().do("lg_open", { cap: d.id }); const c = L.state().caps[d.id]; if (c && L.state().opened[c.id]) { sfx("fanfare"); hearts("💌", 14); toast(`🎁 +${CAP_COINS}🪙`, "gold"); L.showLetter(d.id); } else toast("⏳ لسا ما حان وقتها (ساعة جهازك أسرع من السيرفر؟)"); });
      case "g-lgd-read": return L.showLetter(d.id);
      case "g-lgd-reason": return busy(async () => { const x = val("#lgReason"); if (!x) return; await G().do("lg_reason", { text: x }); sfx("heart"); hearts("💗", 8); toast("🫙 انضاف للوعاء"); P().open("lgjar"); });
      case "g-lgd-draw": return busy(async () => { await G().do("lg_draw", {}); sfx("magic"); hearts("🫙", 10); P().open("lgjar"); });
      case "g-lgd-ans": return busy(async () => { const x = val("#lgAns"); if (!x) return toast("اكتب جوابك"); await G().do("lg_ans", { q: today(), text: x }); sfx("pop"); hearts("💬", 8); P().open("lgq"); refreshBadge(); });
      case "g-lgd-wish": return busy(async () => { const x = val("#lgWish"); if (!x) return; await G().do("lg_wish", { text: x }); sfx("magic"); hearts("🌠", 12); toast("🌠 الله يحققها", "gold"); P().open("lgwish"); });
    }
  };
  L.showLetter = (id) => { L.letterId = id; P().open("lgletter"); };
  O.lgletter = () => {
    const id = L.letterId, c = L.state().caps[id]; if (!c || !L.state().opened[id]) return O.lgcap();
    ui().openModal(`<h3>${esc(c.emo)} رسالة من ${esc(nameOf(c.from))}</h3><small class="hint">كُتبت ${fmt(c.t)} · انفتحت ${fmt(L.state().opened[id])}</small>
      <div class="top-block" style="margin:10px 0;white-space:pre-wrap">${esc(c.text)}</div><div class="row"><button class="btn alt sm" data-act="g-lgd-open" data-k="lgcap">↩️ رجوع</button></div>`);
  };
  const gc = G().click; G().click = (a, el) => (typeof a === "string" && a.indexOf("g-lgd-") === 0 ? L.click(a, el) : gc(a, el));

  /* ============ نجمة الأمنيات (بالليل) ============ */
  const nightNow = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--night")) || 0;
  L.spawnStar = () => {
    if ($("#lgStar")) return; const b = document.createElement("button"); b.id = "lgStar"; b.textContent = "🌠"; b.setAttribute("aria-label", "نجمة أمنيات");
    b.style.top = 8 + Math.random() * 22 + "%"; b.onclick = () => { b.remove(); sfx("magic"); P().open("lgwish"); }; document.body.appendChild(b);
    setTimeout(() => { try { b.remove(); } catch (e) { /* */ } }, 9000);
  };
  let nextStar = Date.now() + 25000;
  const skyTick = () => { if (document.hidden || Date.now() < nextStar || !$("#modal").hidden) return; if (nightNow() < 0.6) { nextStar = Date.now() + 30000; return; } if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; L.spawnStar(); nextStar = Date.now() + 70000 + Math.random() * 90000; };

  /* ============ الزر والتشغيل ============ */
  const css = document.createElement("style");
  css.textContent = `#lgStar{position:fixed;right:-60px;z-index:19;font-size:34px;background:none;filter:drop-shadow(0 0 10px #ffe9a8);animation:lgfly 8s linear forwards;touch-action:manipulation}
@keyframes lgfly{from{transform:translateX(0) rotate(-20deg)}to{transform:translateX(-120vw) rotate(-20deg)}}
@media (prefers-reduced-motion:reduce){#lgStar{animation-duration:20s}}`;
  document.head.appendChild(css);
  L.badge = () => { try { return badgeCount(); } catch (e) { return 0; } };
  // صف 🌟 جوّا قائمة ✨ الموجودة (بدل زر جديد بالعمود الجانبي: ما بنزاحم أزرار الـHUD على الشاشات الصغيرة)
  const ox = O.xhub;
  if (ox) O.xhub = () => {
    ox();
    try {
      const box = document.querySelector("#modalCard .items"), n = badgeCount(); if (!box) return;
      box.insertAdjacentHTML("afterbegin", irow("🌟", "لمسات الأسطورة", n ? `🎁 في ${n} شي بانتظارك` : "كبسولة زمن · أسباب · سؤال اليوم · أمنيات", `<button class="btn sm gold" data-act="g-lgd-open" data-k="legend">افتح</button>`));
    } catch (e) { /* */ }
  };
  const refreshBadge = () => { try { const b = $("#xBadge"); if (!b || !OSW.extras) return; const n = OSW.extras.goalStatus().goals.filter((g) => g.done && !g.claimed).length + badgeCount(); b.textContent = n; b.hidden = !n; } catch (e) { /* */ } };
  let told = false;
  setInterval(() => { try { refreshBadge(); skyTick(); if (!told && $("#zoomctl") && readyCaps().length) { told = true; toast("💌 عندك كبسولة زمن جاهزة تنفتح! (✨ ثم 🌟)", "gold", 5000); } } catch (e) { /* ما نوقف اللعبة */ } }, 1500);
})();
