/* إضافات الإصدار الثامن: طقس حي، مناسبات وأعياد، ألبوم ذكريات، أهداف أسبوعية.
   كل شي هون محمي بـ try/catch: لو صار أي خطأ ما بيوقف اللعبة. */
(function () {
  const OSW = window.OSW, X = (OSW.extras = { th: {}, today: [] }), esc = OSW.esc;
  const $ = (s) => document.querySelector(s);
  const ui = () => OSW.ui, G = () => OSW.game, W = () => OSW.world, P = () => OSW.places, db = () => OSW.ui.db;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const toast = (m, c, ms) => ui().toast(m, c || "", ms);
  const sfx = (n) => OSW.audio && OSW.audio.sfx(n);
  const hearts = (e, n) => ui().hearts && ui().hearts(e, n || 8);
  const pad = (n) => String(n).padStart(2, "0");
  const AMMAN = 3 * 3600000;
  function hash01(n) { let x = n | 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x ^= x >>> 16; return (x >>> 0) / 4294967296; }

  /* ============ الأهداف الأسبوعية ============ */
  const dayKey = (t) => Math.floor((t + AMMAN) / 86400000);
  const weekOf = (t) => Math.floor((dayKey(t) - 2) / 7); // الأسبوع بيبدأ السبت
  const POOL = [
    { id: "harvest", e: "🌾", n: 20, r: 60, ty: ["harvest"], t: (n) => `اقطفوا ${n} محصول` },
    { id: "plant", e: "🌱", n: 25, r: 50, ty: ["plant"], t: (n) => `ازرعوا ${n} أرض` },
    { id: "fish", e: "🎣", n: 5, r: 60, ty: ["fish"], t: (n) => `اصطادوا ${n} سمكات` },
    { id: "draw", e: "🎨", n: 3, r: 70, ty: ["draw"], t: (n) => `سلّموا ${n} رسمات بغرفة الرسم` },
    { id: "together", e: "🤝", n: 8, r: 60, ty: ["together"], t: (n) => `امشوا سوا ${n} مرات` },
    { id: "orders", e: "📋", n: 4, r: 80, ty: ["order"], t: (n) => `لبّوا ${n} طلبات من أهل القرية` },
    { id: "sell", e: "💰", n: 6, r: 50, ty: ["sellcrate", "sell"], t: (n) => `بيعوا محاصيل ${n} مرات` },
    { id: "gift", e: "🎁", n: 2, r: 60, ty: ["gift"], t: (n) => `ابعتوا ${n} هدايا لبعض` },
    { id: "eat", e: "🍽️", n: 6, r: 40, ty: ["eat"], t: (n) => `كلوا ${n} وجبات` },
    { id: "snap", e: "📸", n: 3, r: 60, ty: ["snap"], t: (n) => `صوّروا ${n} لقطات للألبوم` },
  ];
  const ALL_BONUS = 100;
  const pick = (w) => POOL.map((g, i) => [hash01(w * 131 + i * 17 + 5), g]).sort((a, b) => a[0] - b[0]).slice(0, 4).map((x) => x[1]);
  X.POOL = POOL; X.pick = pick; X.weekOf = weekOf;

  // بتنحسب مع باقي أحداث اللعبة (fold): استلام مكافأة هدف أو مكافأة الأسبوع الكاملة
  X.fold = (ty, e, d, t, a, day, S, H) => {
    if (OSW.logi && OSW.logi.fold(ty, e, d, t, a, day, S, H)) return true;
    if (OSW.agri && OSW.agri.fold(ty, e, d, t, a, day, S, H)) return true;
    if (ty === "snap") return true;
    if (ty === "wgoal") {
      const wg = S.wg || (S.wg = {}), w = weekOf(t);
      if (d.w !== w) return true;
      if (d.id === "all") { const k = w + ":all"; if (wg[k] || !pick(w).every((g) => wg[w + ":" + g.id])) return true; wg[k] = a; S.coins += ALL_BONUS; return true; }
      const g = POOL.find((x) => x.id === d.id), k = w + ":" + d.id; if (!g || wg[k]) return true;
      wg[k] = a; S.coins += g.r; return true;
    }
    return false;
  };
  X.progress = (w) => { const out = {}; (db().entries || []).forEach((e) => { if (e.house !== "game") return; if (weekOf(new Date(e.created_at).getTime()) !== w) return; out[e.title] = (out[e.title] || 0) + 1; }); return out; };
  X.goalStatus = () => {
    const w = weekOf(Date.now()), pr = X.progress(w), wg = G().state().wg || {};
    return { w, allClaimed: !!wg[w + ":all"], goals: pick(w).map((g) => { const have = g.ty.reduce((s, k) => s + (pr[k] || 0), 0); return Object.assign({}, g, { have: Math.min(have, g.n), done: have >= g.n, claimed: !!wg[w + ":" + g.id] }); }) };
  };

  /* ============ المناسبات والأعياد وأعياد الميلاد ============ */
  const bday = (uid) => db().kv["bday:" + uid] || null;
  function hijri(date) {
    try {
      const p = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Amman" }).formatToParts(date);
      const g = (t) => +(p.find((x) => x.type === t) || {}).value; const m = g("month"), d = g("day"); return m && d ? { m, d } : null;
    } catch (e) { return null; }
  }
  const GREG = {
    "01-01": ["newyear", "🎆", "رأس السنة", "سنة جديدة سعيدة! 🎆 الله يجعلها أحلى سنة إلكم", 1],
    "02-14": ["love", "💝", "عيد الحب", "اليوم عيد الحب 💝 فاجئوا بعض بهدية من بقالة سعدون!"],
    "03-21": ["mother", "💐", "عيد الأم", "عيد الأم 💐 كل عام وأمهاتنا بألف خير"],
    "05-25": ["indep", "🇯🇴", "عيد الاستقلال", "كل عام والأردن بخير 🇯🇴 عيد الاستقلال مبارك!", 1],
  };
  function occasionsAt(date) {
    const a = new Date(date.getTime() + AMMAN), md = pad(a.getUTCMonth() + 1) + "-" + pad(a.getUTCDate()), h = hijri(date), out = [];
    if (h) {
      if (h.m === 9) out.push({ id: "ramadan", e: "🌙", name: "رمضان كريم", msg: "رمضان كريم! 🌙 كل عام وانتوا بخير" });
      if (h.m === 10 && h.d <= 3) out.push({ id: "fitr", e: "🎉", name: "عيد الفطر", msg: "عيد فطر مبارك! 🎉🍬 كل عام وانتوا بخير", big: 1 });
      if (h.m === 12 && h.d === 9) out.push({ id: "arafa", e: "🕋", name: "يوم عرفة", msg: "يوم عرفة… الله يتقبّل منا ومنكم 🤲" });
      if (h.m === 12 && h.d >= 10 && h.d <= 13) out.push({ id: "adha", e: "🐑", name: "عيد الأضحى", msg: "عيد أضحى مبارك! 🐑🎉 كل عام وانتوا بخير", big: 1 });
      if (h.m === 1 && h.d === 1) out.push({ id: "hijri", e: "🌅", name: "رأس السنة الهجرية", msg: "كل عام وانتوا بخير بالسنة الهجرية الجديدة 🌅" });
    }
    if (GREG[md]) { const [id, e, name, msg, big] = GREG[md]; out.push({ id, e, name, msg, big }); }
    (db().profiles || []).forEach((p) => {
      const b = bday(p.id); if (!b || b.d !== md) return;
      const mine = p.id === db().uid;
      out.push({ id: "bday_" + p.id, e: "🎂", name: `عيد ميلاد ${p.name}`, big: 1, bday: p.id,
        msg: mine ? `كل سنة وانت طيب يا ${p.name}! 🎂🎉 يوم حلو إلك` : `اليوم عيد ميلاد ${p.name}! 🎂 فاجئ شريكك بهدية من بقالة سعدون 🎁` });
    });
    return out;
  }
  X.upcoming = () => {
    const seen = {}, out = [], t0 = Date.now();
    for (let i = 0; i <= 120 && out.length < 6; i++) {
      occasionsAt(new Date(t0 + i * 86400000)).forEach((o) => { if (!seen[o.id]) { seen[o.id] = 1; out.push(Object.assign({ in: i }, o)); } });
    }
    return out;
  };
  function sunsetHour(date) {
    const a = new Date(date.getTime() + AMMAN), doy = Math.floor((Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()) - Date.UTC(a.getUTCFullYear(), 0, 0)) / 86400000);
    return 18.2 + 1.6 * Math.sin((2 * Math.PI * (doy - 80)) / 365);
  }
  function tickIftar() {
    const h = hijri(new Date()); if (!h || h.m !== 9) return;
    const a = new Date(Date.now() + AMMAN), hr = a.getUTCHours() + a.getUTCMinutes() / 60, ss = sunsetHour(new Date()), key = "osw_iftar_" + a.toISOString().slice(0, 10);
    if (hr >= ss && hr < ss + 0.3 && !localStorage.getItem(key)) { localStorage.setItem(key, "1"); sfx("boom"); toast("🌙 أذّن المغرب… إفطار هني! 🍽️", "gold", 9000); hearts("🌙", 12); }
  }
  function refreshBanner() {
    let el = $("#occBanner");
    if (!el) {
      el = document.createElement("div"); el.id = "occBanner"; el.className = "pill occ"; el.hidden = true; el.onclick = () => OSW.app.goPlace("xocc");
      const pr = $("#presence"); if (pr && pr.parentNode) pr.parentNode.insertBefore(el, pr.nextSibling); else if ($("#hud")) $("#hud").appendChild(el); else return;
    }
    const occ = occasionsAt(new Date()); X.today = occ;
    if (!occ.length) { el.hidden = true; document.documentElement.removeAttribute("data-occ"); return; }
    el.hidden = false; el.textContent = occ.map((o) => o.e + " " + o.name).join(" · "); document.documentElement.dataset.occ = occ[0].id;
  }
  function celebrate() {
    const dk = new Date(Date.now() + AMMAN).toISOString().slice(0, 10);
    (X.today || []).forEach((o, i) => {
      const key = "osw_occ_" + dk + "_" + o.id; if (localStorage.getItem(key)) return; localStorage.setItem(key, "1");
      setTimeout(() => { sfx(o.big ? "fanfare" : "magic"); toast(o.msg, "gold", 9000); hearts(o.e, 14); if (o.big) confetti(); }, 2500 + i * 3500);
    });
  }
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cv = $("#xconf"); if (!cv) { cv = document.createElement("canvas"); cv.id = "xconf"; document.body.appendChild(cv); }
    cv.width = innerWidth; cv.height = innerHeight; const c = cv.getContext("2d"), cols = ["#ff6b9d", "#ffc24b", "#4dabf7", "#7ac74f", "#b565b0", "#ff8c42"];
    const ps = Array.from({ length: 110 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.6, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, r: 4 + Math.random() * 5, a: Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] }));
    const t0 = performance.now();
    (function f(now) { c.clearRect(0, 0, cv.width, cv.height); ps.forEach((p) => { p.x += p.vx + Math.sin(p.a) * 0.8; p.y += p.vy; p.a += 0.08; c.fillStyle = p.c; c.fillRect(p.x, p.y, p.r, p.r * 0.6); }); if (now - t0 < 7000) requestAnimationFrame(f); else c.clearRect(0, 0, cv.width, cv.height); })(t0);
  }

  /* ============ الطقس: صوت المطر والرعد والبرق ============ */
  let lastType = null, nextFlash = 0;
  function flash(white) {
    let f = $("#wxFlash"); if (!f) { f = document.createElement("div"); f.id = "wxFlash"; document.body.appendChild(f); }
    f.style.transition = "none"; f.style.opacity = white ? "0.85" : "0.55"; void f.offsetWidth; f.style.transition = "opacity " + (white ? 0.5 : 0.45) + "s"; f.style.opacity = "0";
  }
  function weatherTick() {
    const w = W(); if (!w || !w.wxType) return;
    const type = w.wxType, storm = w.storm, raining = type === "rain", inside = w.mode === "in";
    document.documentElement.dataset.wx = type + (storm ? "-storm" : "");
    if (OSW.audio && OSW.audio.rain) OSW.audio.rain(raining ? (inside ? 0.35 : storm ? 1.6 : 1) : 0);
    if (lastType !== null && type !== lastType) {
      if (type === "rain") toast(storm ? "⛈️ عاصفة ومطر غزير!" : "🌧️ بلّشت تمطر", "", 4500);
      else if (lastType === "rain") toast("🌤️ وقفت المطرة", "", 3500);
      if (type === "snow") toast("❄️ بلّش يتلّج!", "", 4000);
    }
    lastType = type;
    if (raining && storm && !inside && Date.now() > nextFlash) {
      nextFlash = Date.now() + 6000 + Math.random() * 12000;
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) flash(false);
      setTimeout(() => sfx("thunder"), 500 + Math.random() * 1500);
    }
  }

  /* ============ التقاط الصور وألبوم أيامنا ============ */
  X.snap = async () => {
    const w = W(); if (!w || !w.snapshot) return;
    toast("📸 ثبّتوا…", "", 900); await sleep(900); flash(true); sfx("pop");
    const url = await Promise.race([w.snapshot(), sleep(2500).then(() => null)]);
    if (!url) return toast("⚠️ ما قدرت ألتقط الصورة، جرّب مرة ثانية");
    X.pending = url; OSW.app.goPlace("xsnap");
  };
  const snaps = () => (db().entries || []).filter((e) => e.house === "game" && e.title === "snap").sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${name}</b><small>${sub}</small></div><div class="ib">${btns || ""}</div></div>`;
  const coinBar = () => `<div class="coinbar">🪙 <b>${G().state().coins}</b></div>`;
  function loadThumbs(list) {
    let i = 0;
    const run = async () => {
      while (i < list.length) {
        const e = list[i++];
        try {
          let u = X.th[e.id]; if (!u) { const m = await db().getMedia(e.id); u = m && m[0]; if (u) X.th[e.id] = u; }
          const el = document.getElementById("xt_" + e.id); if (el && u) el.style.backgroundImage = `url("${u}")`;
        } catch (er) { /* ما نوقف */ }
      }
    };
    run(); run(); run();
  }
  const WX = { rain: "🌧️ مطر", snow: "❄️ ثلج", leaves: "🍂 أوراق خريف", petals: "🌸 زهور الربيع", none: "☀️ صافي" };

  if (OSW.places) OSW.places.noRefresh = { xsnap: 1, xview: 1, xalbum: 1, xocc: 1 };

  /* ---- النوافذ ---- */
  if (OSW.game && OSW.game.openers) {
    const O = OSW.game.openers;
    O.xhub = () => {
      const st = X.goalStatus(), ready = st.goals.filter((g) => g.done && !g.claimed).length, n = snaps().length, wm = W().weather;
      const wxNow = W().storm ? "⛈️ عاصفة" : WX[W().wxType] || "☀️ صافي";
      ui().openModal(`<h3>✨ المزيد من عالمنا</h3>${coinBar()}<div class="items" style="margin:8px 0">
        ${irow("📸", "التقطوا لحظة", "صوّروا القرية وهي حلوة واحفظوها", `<button class="btn sm gold" data-act="g-x-snap">صوّر</button>`)}
        ${irow("🖼️", "ألبوم أيامنا", `${n} ذكرى محفوظة`, `<button class="btn sm alt" data-act="g-x-open" data-k="xalbum">افتح</button>`)}
        ${irow("🎯", "أهداف الأسبوع", ready ? `🎁 في ${ready} مكافأة جاهزة!` : "مهام مشتركة بجوائز", `<button class="btn sm alt" data-act="g-x-open" data-k="xgoals">افتح</button>`)}
        ${irow("🎂", "المناسبات والتواريخ", "أعيادكم وأعياد الميلاد", `<button class="btn sm alt" data-act="g-x-open" data-k="xocc">افتح</button>`)}
      </div>
      <b>⛅ الطقس الآن: ${wxNow}</b>
      <div class="seg" style="margin:8px 0">${[["auto", "تلقائي"], ["clear", "صافي"], ["rain", "مطر 🌧️"], ["snow", "ثلج ❄️"]].map(([k, t]) => `<button class="${wm === k ? "on" : ""}" data-act="weather" data-k="${k}">${t}</button>`).join("")}</div>
      <p class="hint">«تلقائي» بيجيب مطر وعواصف وثلج حسب الفصل، وبنفس الوقت عندك وعند شريكك 🌦️</p>`);
    };
    O.xsnap = () => {
      if (!X.pending) return ui().openModal(`<h3>📸 لقطة</h3><p class="hint">ما في لقطة جاهزة. اضغط زر 📸 من الشاشة.</p>`);
      ui().openModal(`<h3>📸 لقطة جديدة</h3><img class="xbig" src="${X.pending}" alt=""><input class="in" id="xcap" maxlength="80" placeholder="اكتب ذكرى صغيرة عن هالصورة (اختياري)" style="margin:8px 0">
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn berry" data-act="g-x-save">💾 احفظها بألبوم أيامنا</button><button class="btn alt" data-act="g-x-discard">تجاهل</button></div>`);
    };
    O.xalbum = () => {
      const all = snaps(), page = X.page || 24, list = all.slice(0, page);
      const cells = list.map((e) => `<button class="xph" data-act="g-x-view" data-id="${e.id}"><div class="xthumb" id="xt_${e.id}"${X.th[e.id] ? ` style="background-image:url('${X.th[e.id]}')"` : ""}></div><small>${esc(e.body || new Date(e.created_at).toLocaleDateString("ar", { day: "numeric", month: "short" }))}</small></button>`).join("");
      ui().openModal(`<h3>🖼️ ألبوم أيامنا</h3><p class="hint">${all.length} ذكرى. صوّروا من زر 📸 على الشاشة.</p>
        ${all.length ? `<div class="xgrid">${cells}</div>` : `<div class="empty">لسا ما في صور 📷 اضغطوا 📸 والتقطوا أول ذكرى!</div>`}
        ${all.length > page ? `<button class="btn alt sm" data-act="g-x-more">عرض المزيد</button>` : ""}
        <div class="row" style="margin-top:10px"><button class="btn gold sm" data-act="g-x-snap">📸 صوّر هلأ</button></div>`);
      loadThumbs(list.filter((e) => !X.th[e.id]));
    };
    O.xview = () => {
      const e = (db().entries || []).find((x) => x.id === X.viewId); if (!e) return O.xalbum();
      const who = ui().prof ? ui().prof(e.author).name : "";
      ui().openModal(`<h3>🖼️ ذكرى</h3><div id="xvimg" class="xbig">⏳</div>
        <small class="hint">${new Date(e.created_at).toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" })} · ${esc(who)}</small>
        <input class="in" id="xvcap" maxlength="80" value="${esc(e.body || "")}" placeholder="أضف تعليق" style="margin:8px 0">
        <div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn sm gold" data-act="g-x-capsave">💾 احفظ التعليق</button><button class="btn sm alt" data-act="g-x-zoom">🔍 تكبير</button><button class="btn sm alt" data-act="g-x-del">🗑️ حذف</button><button class="btn sm alt" data-act="g-x-back">⬅️ رجوع</button></div>`);
      (async () => { try { let u = X.th[e.id]; if (!u) { const m = await db().getMedia(e.id); u = m && m[0]; if (u) X.th[e.id] = u; } const box = document.getElementById("xvimg"); if (box && u) box.outerHTML = `<img id="xvimg" class="xbig" src="${u}" alt="">`; } catch (er) { /* */ } })();
    };
    O.xgoals = () => {
      const st = X.goalStatus(), nextWeek = ((st.w + 1) * 7 + 2) * 86400000 - AMMAN, daysLeft = Math.max(1, Math.ceil((nextWeek - Date.now()) / 86400000));
      const rows = st.goals.map((g) => {
        const pct = Math.round((g.have / g.n) * 100), btn = g.claimed ? "✅" : g.done ? `<button class="btn sm gold" data-act="g-x-claim" data-id="${g.id}">🎁 +${g.r}🪙</button>` : `<span class="tag">+${g.r}🪙</span>`;
        return `<div class="irow${g.claimed ? " done" : ""}"><span class="ie">${g.e}</span><div class="iname"><b>${esc(g.t(g.n))}</b><small>${g.have} من ${g.n}</small><div class="progress" style="margin-top:4px"><i style="width:${pct}%"></i></div></div><div class="ib">${btn}</div></div>`;
      }).join("");
      const allDone = st.goals.every((g) => g.claimed);
      ui().openModal(`<h3>🎯 أهداف الأسبوع</h3>${coinBar()}<p class="hint">مهام مشتركة بينكم، التقدم بيحسب من شغل الاثنين سوا. بتتجدد كل سبت (باقي ${daysLeft} ${daysLeft > 2 && daysLeft < 11 ? "أيام" : "يوم"}).</p>
        <div class="items" style="margin:8px 0">${rows}</div>
        ${st.allClaimed ? `<p class="hint">🏆 خلّصتوا كل أهداف الأسبوع واستلمتوا المكافأة الكبيرة!</p>` : `<button class="btn berry" style="width:100%" data-act="g-x-claimall" ${allDone ? "" : "disabled"}>🏆 مكافأة الأسبوع الكاملة (+${ALL_BONUS}🪙)</button><p class="hint">استلموا مكافآت الأهداف الأربعة أول، وبعدين بتفتح المكافأة الكبيرة.</p>`}`);
    };
    O.xocc = () => {
      const pa = db().partner, mine = bday(db().uid), theirs = pa ? bday(pa.id) : null;
      const val = (b) => (b && b.d ? `${b.y || 2000}-${b.d}` : "");
      const up = X.upcoming().map((o) => `<div class="irow"><span class="ie">${o.e}</span><div class="iname"><b>${esc(o.name)}</b><small>${o.in === 0 ? "اليوم! 🎉" : o.in === 1 ? "بكرة" : "بعد " + o.in + " يوم"}</small></div></div>`).join("");
      ui().openModal(`<h3>🎂 المناسبات والتواريخ</h3><div class="items" style="margin:8px 0">${up || '<div class="empty">ما في مناسبات قريبة</div>'}</div>
        <b>🎈 أعياد الميلاد</b><p class="hint">اكتبوا التواريخ وبنحتفل فيها بالقرية (كونفيتي وتهنئة) 🎉</p>
        <div class="field"><label>ميلادك ${esc(db().me ? db().me.name : "")}</label><input type="date" class="in" id="xbd_me" value="${val(mine)}"></div>
        ${pa ? `<div class="field"><label>ميلاد ${esc(pa.name)}</label><input type="date" class="in" id="xbd_pa" value="${val(theirs)}"></div>` : ""}
        <button class="btn berry" data-act="g-x-bday" style="width:100%">💾 احفظ التواريخ</button>
        <p class="hint">أعياد رمضان والفطر والأضحى محسوبة بالتقويم الهجري، وممكن تتأخر أو تتقدم يوم عن الإعلان الرسمي.</p>`);
    };
  }

  /* ---- النقرات ---- */
  X.click = async (a, el) => {
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } };
    switch (a) {
      case "g-x-open": ui().closeModal(); return OSW.app.goPlace(d.k);
      case "g-x-snap": ui().closeModal(); return X.snap();
      case "g-x-discard": X.pending = null; return ui().closeModal();
      case "g-x-save": return busy(async () => {
        const url = X.pending; if (!url) return; const cap = (($("#xcap") || {}).value || "").trim().slice(0, 80);
        await db().addEntry({ house: "game", title: "snap", body: cap || null, data: { at: new Date().toISOString() }, media: [url] });
        X.pending = null; sfx("coin"); hearts("📸", 8); ui().closeModal(); toast("🖼️ انحفظت بألبوم أيامنا", "gold");
      });
      case "g-x-view": X.viewId = d.id; return P().open("xview");
      case "g-x-back": return P().open("xalbum");
      case "g-x-more": X.page = (X.page || 24) + 24; return P().open("xalbum");
      case "g-x-zoom": return X.viewId && ui().lightbox && ui().lightbox(X.viewId, 0);
      case "g-x-capsave": return busy(async () => { await db().updateEntry(X.viewId, { body: (($("#xvcap") || {}).value || "").trim().slice(0, 80) || null }); sfx("pop"); toast("💾 انحفظ التعليق"); });
      case "g-x-del": return busy(async () => {
        if (!confirm("متأكد بدك تحذف هالذكرى؟")) return;
        await db().removeEntry(X.viewId); delete X.th[X.viewId]; X.viewId = null; P().open("xalbum");
      });
      case "g-x-claim": return busy(async () => { await G().do("wgoal", { w: weekOf(Date.now()), id: d.id }); sfx("coin"); hearts("🪙", 8); toast("🎁 استلمتوا مكافأة الهدف!", "gold"); badgeTick(); });
      case "g-x-claimall": return busy(async () => { await G().do("wgoal", { w: weekOf(Date.now()), id: "all" }); sfx("fanfare"); hearts("🏆", 14); confetti(); toast("🏆 مبروك! خلّصتوا أهداف الأسبوع", "gold", 6000); badgeTick(); });
      case "g-x-bday": return busy(async () => {
        const save = async (uid, id) => { const v = ($(id) || {}).value; if (!v) return; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); if (!m) return; await db().kvSet("bday:" + uid, { d: m[2] + "-" + m[3], y: +m[1] }); };
        await save(db().uid, "#xbd_me"); if (db().partner) await save(db().partner.id, "#xbd_pa");
        refreshBanner(); sfx("magic"); hearts("🎂", 8); toast("🎂 انحفظت التواريخ", "gold"); P().open("xocc");
      });
    }
  };

  /* ---- الأزرار والتشغيل ---- */
  function badgeTick() {
    try { const b = $("#xBadge"); if (!b) return; const n = X.goalStatus().goals.filter((g) => g.done && !g.claimed).length; b.textContent = n; b.hidden = !n; } catch (e) { /* */ }
  }
  function buildHud() {
    const z = $("#zoomctl"); if (!z || $("#btnExtras")) return;
    const mk = (id, em, label, fn) => { const b = document.createElement("button"); b.id = id; b.textContent = em; b.setAttribute("aria-label", label); b.onclick = fn; z.appendChild(b); return b; };
    const free = () => !(OSW.app.state && OSW.app.state().busyNav);
    mk("btnSnap", "📸", "لقطة", () => free() && X.snap());
    const hb = mk("btnExtras", "✨", "المزيد", () => free() && OSW.app.goPlace("xhub"));
    const bd = document.createElement("i"); bd.id = "xBadge"; bd.hidden = true; hb.appendChild(bd);
  }
  let started = false;
  X.start = () => {
    if (started) return; started = true;
    buildHud(); refreshBanner(); badgeTick();
    setTimeout(() => { try { celebrate(); } catch (e) { /* */ } }, 1500);
    setInterval(() => { try { refreshBanner(); celebrate(); tickIftar(); badgeTick(); } catch (e) { /* */ } }, 20000);
    setInterval(() => { try { weatherTick(); } catch (e) { /* */ } }, 2000);
    setTimeout(() => { try { weatherTick(); } catch (e) { /* */ } }, 3000);
    try { db().on("change", () => badgeTick()); } catch (e) { /* */ }
  };
})();
