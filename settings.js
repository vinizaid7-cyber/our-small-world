/* الإعدادات (V12 / حساب 4): جودة الرسوميات (تلقائي/منخفض/متوسط/عالي) + سهولة الاستخدام.
   محفوظة عالجهاز (localStorage) لأنها تخص الجهاز مش الثنائي. لا شغل كل فريم: بس أعلام بتقرأها محرّك الرسم. */
(function () {
  const OSW = window.OSW, G = OSW.game, ui = () => OSW.ui, esc = OSW.esc;
  const KEY = "osw_settings_v1", DEF = { gfx: "auto", text: 100, contrast: false, motion: false, lefty: false, big: false, haptics: true };
  const S = (OSW.settings = { v: 1, cfg: Object.assign({}, DEF) });
  try { Object.assign(S.cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* قيم افتراضية */ }
  const mobile = () => innerWidth < 700;
  const GFX = {
    low: { dpr: () => 0.75, shadows: false, npcDist: 45, npcHalf: true },
    med: { dpr: () => (mobile() ? 1 : 1.25), shadows: false, npcDist: 80, npcHalf: false },
    high: { dpr: () => (mobile() ? 1.5 : 2), shadows: true, npcDist: 1e9, npcHalf: false },
  };
  // يقرأها engine3d (دقة الرسم) وworld3d (كثافة الشخصيات والظلال)
  OSW.gfx = {
    level: () => S.cfg.gfx,
    dprCap: () => (GFX[S.cfg.gfx] ? GFX[S.cfg.gfx].dpr() : null),
    showNpc: (d, o, me) => {
      const g = GFX[S.cfg.gfx]; if (!g) return true;
      if (g.npcHalf && ((d.id.length + d.id.charCodeAt(0)) & 1)) return false;
      return Math.hypot(o.x - me.x, o.z - me.z) < g.npcDist;
    },
  };
  S.apply = () => {
    const c = S.cfg, el = document.documentElement.classList;
    el.toggle("hc", !!c.contrast); el.toggle("rm", !!c.motion); el.toggle("lefty", !!c.lefty); el.toggle("bigtouch", !!c.big);
    el.toggle("txt-lg", c.text === 115); el.toggle("txt-xl", c.text === 130);
    if (GFX[c.gfx]) OSW.shadowsOn = GFX[c.gfx].shadows;
    window.dispatchEvent(new Event("resize"));
  };
  S.set = (k, v) => { S.cfg[k] = v; try { localStorage.setItem(KEY, JSON.stringify(S.cfg)); } catch (e) { /* خزن ممتلئ */ } S.apply(); };
  OSW.haptic = (ms) => { try { if (S.cfg.haptics && navigator.vibrate) navigator.vibrate(ms || 20); } catch (e) { /* مش مدعوم */ } };

  const css = document.createElement("style");
  css.textContent = `
  .txt-lg #modalCard{zoom:1.15}.txt-xl #modalCard{zoom:1.3}
  .rm *,.rm *::before,.rm *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important;scroll-behavior:auto!important}
  .hc #modalCard{background:#fff!important;color:#000!important}.hc #modalCard .hint,.hc #modalCard small{color:#1a1a1a!important}
  .hc #modalCard .btn.alt{background:#fff!important;color:#000!important;border:2px solid #000!important}.hc .rbtn{border:2px solid #fff!important;background:#000b!important}
  .bigtouch #joy{width:clamp(150px,40vh,190px)!important;height:clamp(150px,40vh,190px)!important}.bigtouch .rbtn{min-width:52px;min-height:52px}.bigtouch .sprint{width:90px;height:90px}
  .lefty #joy{left:auto!important;right:calc(16px + var(--sar,0px))!important}.lefty .sprint{right:auto!important;left:calc(84px + var(--sal,0px))!important}`;
  document.head.appendChild(css);

  G.ui.setBusy = G.ui.setBusy || false;
  G.openers.settings = () => {
    const c = S.cfg, seg = (k, arr) => arr.map(([v, t]) => `<button class="${c[k] === v ? "on" : ""}" data-act="g-set" data-k="${k}" data-v="${v}" style="min-height:44px">${t}</button>`).join("");
    const tog = (k, t, hint) => `<div class="field"><label>${t}</label><div class="seg">${[[true, "تشغيل"], [false, "إيقاف"]].map(([v, n]) => `<button class="${!!c[k] === v ? "on" : ""}" data-act="g-set" data-k="${k}" data-v="${v}" style="min-height:44px">${n}</button>`).join("")}</div>${hint ? `<small class="hint">${hint}</small>` : ""}</div>`;
    ui().openModal(`<h3>🎛️ الإعدادات</h3><small class="hint">محفوظة على هالجهاز بس</small>
      <div class="field"><label>🖼️ جودة الرسوميات</label><div class="seg">${seg("gfx", [["auto", "تلقائي"], ["low", "منخفض"], ["med", "متوسط"], ["high", "عالي"]])}</div>
      <small class="hint">منخفض: أخف عالتلفونات الضعيفة (دقة أقل، شخصيات أقل، بدون ظلال). عالي: ظلال ودقة أعلى.</small></div>
      <div class="field"><label>🔤 حجم الخط بالنوافذ</label><div class="seg">${seg("text", [[100, "عادي"], [115, "كبير"], [130, "أكبر"]])}</div></div>
      ${tog("contrast", "🌓 تباين عالي", "نوافذ بيضاء ونص أسود أوضح")}${tog("motion", "🐢 تقليل الحركة", "بيوقف الحركات والانتقالات بالواجهة")}
      ${tog("big", "👆 أزرار تحكم أكبر", "عصا وأزرار أكبر للأصابع")}${tog("lefty", "🤚 وضع اليد اليسار", "بيبدّل مكان العصا وزر الركض")}${tog("haptics", "📳 اهتزاز خفيف", "عند استلام المكافآت")}
      <button class="btn alt" style="width:100%;min-height:44px" data-act="g-set" data-k="reset" data-v="1">↩️ رجّع الافتراضي</button>`);
  };
  const baseClick = G.click;
  G.click = (a, el) => {
    if (a !== "g-set") return baseClick(a, el);
    const k = el.dataset.k, raw = el.dataset.v;
    if (k === "reset") Object.keys(DEF).forEach((x) => S.set(x, DEF[x]));
    else S.set(k, raw === "true" ? true : raw === "false" ? false : isNaN(+raw) ? raw : +raw);
    OSW.places.refresh();
  };
  S.apply();
})();
