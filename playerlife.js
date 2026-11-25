/* حياة اللاعب (V12 / حساب 4): بداية آمنة + استرجاع آخر مكان صالح + مقدّمة قصيرة للاعب الجديد.
   - لاعب جديد (ما كتب أي حدث قبل) ← بيبدأ جوّا البيت مع شرح الحركة والتفاعل والأنشطة.
   - لاعب راجع ← آخر مكان محفوظ إذا صالح (داخل العالم، مش جوّا جدار)، وإلا بيت اللاعب.
   - الحفظ: kv "me:<uid>".lastPos كل ≤15 ثانية وبس لما يتغيّر (ما في شغل كل فريم). */
(function () {
  const OSW = window.OSW, P = (OSW.plife = {});
  const ui = () => OSW.ui, db = () => OSW.ui.db, W = () => OSW.world;
  const fin = (v) => typeof v === "number" && isFinite(v);
  P.isNew = () => { const u = db().uid, my = ui().my(); return !my.started && !db().entries.some((e) => e.author === u && !(e.house === "game" && e.title === "needinit")); }; // needinit = حدث تلقائي من النظام، مش لعب فعلي
  // نقطة صالحة؟ ضمن حدود العالم، وإذا كانت جوّا جدار/مبنى بنزحها لأقرب مكان مفتوح (وإذا بعيد كتير بنرفضها)
  P.safe = (x, z) => {
    const w = W(); if (!w || !w.S || !fin(x) || !fin(z)) return null; const b = w.S.bounds;
    if (x < b.x0 + 2 || x > b.x1 - 2 || z < b.z0 + 2 || z > b.z1 - 2) return null;
    const o = { x, z }; try { w._int.collide(o, 0.45); } catch (e) { return null; }
    return Math.hypot(o.x - x, o.z - z) <= 3 ? o : null;
  };
  P.plan = () => {
    if (P.isNew()) return { mode: "home", first: true };
    const lp = ui().my().lastPos;
    if (lp && lp.in === "home") return { mode: "home" };
    if (lp && !lp.in) { const s = P.safe(lp.x, lp.z); if (s) return { mode: "out", x: s.x, z: s.z }; }
    return { mode: "home", fallback: !!lp };
  };
  P.after = (plan) => { if (plan && plan.first) P.intro(); };
  P.intro = () => {
    const touch = matchMedia("(pointer:coarse)").matches;
    ui().openModal(`<h3>🏡 أهلاً ببيتكم!</h3><p class="hint">هاد بيتكم الصغير، من هون بتبدأ حكايتكم. دقيقة وبتعرف كل شي:</p>
      <div class="items">
        <div class="irow"><span class="ie">🕹️</span><div class="iname"><b>الحركة</b><small>${touch ? "اسحب العصا اللي تحت يسار الشاشة، وزر 🏃 للركض" : "الأسهم أو W A S D للمشي، Shift للركض"}</small></div></div>
        <div class="irow"><span class="ie">👆</span><div class="iname"><b>التفاعل</b><small>اضغط ع أي غرض أو شخص لتتفاعل معه. الباب بيطلعك للقرية</small></div></div>
        <div class="irow"><span class="ie">🛋️</span><div class="iname"><b>رتّبوا البيت</b><small>زر 🛋️ بيفتح الأثاث: اشتروا، حرّكوا، لوّنوا واحفظوا تصميم</small></div></div>
        <div class="irow"><span class="ie">✅</span><div class="iname"><b>مهام وتحديات</b><small>زر ✅ فيه مهام اليوم وتحديات اليوم والأسبوع والموسم والسنة بمكافآت</small></div></div>
        <div class="irow"><span class="ie">🌾</span><div class="iname"><b>بالقرية</b><small>مزرعة، سمك، حيوانات، سيارات، والمدينة الكبرى. وكل شي بتعملوه محفوظ</small></div></div>
      </div><button class="btn berry" style="width:100%;min-height:48px;margin-top:8px" data-act="close-modal" id="introOk">يلا نبدأ 🚀</button>`);
    ui().saveMy({ started: 1 });
  };
  /* ---- حفظ آخر مكان صالح ---- */
  let last = "", lastAt = 0;
  P.save = (force) => {
    try {
      const d = db(), w = W(); if (!d || !d.me || !w || !w.S || !w.S.ready || !ui().state || document.getElementById("hud").hidden) return;
      let lp = null;
      if (w.mode === "in") { const I = w._int.curInt(); if (I && I.id === "home") lp = { in: "home" }; }
      else if (w.mode === "out") { const m = w.getMe(); if (P.safe(m.x, m.z)) lp = { in: null, x: Math.round(m.x * 10) / 10, z: Math.round(m.z * 10) / 10 }; }
      if (!lp) return; const key = JSON.stringify(lp); if (key === last || (!force && Date.now() - lastAt < 15000)) return;
      if (lp.x != null && last && !force) { const o = JSON.parse(last); if (o.x != null && Math.hypot(o.x - lp.x, o.z - lp.z) < 2) return; }
      last = key; lastAt = Date.now(); lp.t = Date.now(); ui().saveMy({ lastPos: lp }).catch(() => {});
    } catch (e) { /* أفضل جهد */ }
  };
  /* بونص الأكل: توست عند الأكل + تحديث السرعة لما يخلص */
  const G = OSW.game, baseDo = G.do; let hadBuff = false;
  G.do = async (type, data) => { const r = await baseDo(type, data); if (type === "eat") { const m = G.buffMul(); if (m > 1) { ui().toast("⚡ بونص سرعة +" + Math.round((m - 1) * 100) + "% لمدة " + Math.ceil(G.buffLeft() / 60000) + " د", "gold", 3500); hadBuff = true; } } return r; };
  setInterval(() => { const on = G.buffMul() > 1; if (hadBuff && !on) { hadBuff = false; OSW.world.setSpeedMul(G.speedMul()); } }, 4000);
  setInterval(() => P.save(false), 8000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) P.save(true); });
  addEventListener("pagehide", () => P.save(true));
})();
