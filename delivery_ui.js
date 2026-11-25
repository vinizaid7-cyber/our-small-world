/* ============================================================
   التوصيل — الواجهة: شاشة الطلب (مورّد/وجهة/شركة/خدمة/سعر/وقت)، شاشة التتبّع بالخريطة،
   إشعارات الحالة، إرسال حدث الاستلام بعد التفريغ، وربط بدون تعديل ثقيل بالملفات المشتركة.
   ============================================================ */
(function () {
  const OSW = window.OSW, D = OSW.deliv; if (!D) return;
  const G = () => OSW.game, V = () => OSW.veh, W = () => OSW.world, ui = () => OSW.ui, esc = (s) => (OSW.esc ? OSW.esc(String(s)) : String(s));
  const toast = (m, c, ms) => { try { ui().toast(m, c || "", ms); } catch (e) { /* */ } };
  const sfx = (n) => { try { OSW.audio && OSW.audio.sfx(n); } catch (e) { /* */ } };
  const hy = Math.hypot, fmt = D.fmt;
  const trackId = (o) => "OSW-" + (D.testHooks.hash(o.id) % 1679616).toString(36).toUpperCase().padStart(4, "0");
  D.trackId = trackId;

  /* ---------- ستايل ---------- */
  const css = document.createElement("style");
  css.textContent = `.dl-opt{display:inline-flex;flex-direction:column;align-items:center;gap:1px;margin:3px;padding:7px 10px;border-radius:12px;border:2px solid #e3d9c8;background:#fffaf0;font:inherit;cursor:pointer;min-width:84px}
.dl-opt.on{border-color:#2a9d8f;background:#e6f7f4}.dl-opt[disabled]{opacity:.45;cursor:not-allowed}.dl-opt small{font-size:11px;opacity:.75}.dl-opt b{color:#b7791f}
.dl-chip{display:inline-block;margin:3px;padding:6px 12px;border-radius:999px;border:2px solid #e3d9c8;background:#fffaf0;font:inherit;cursor:pointer}.dl-chip.on{border-color:#e63946;background:#ffe9eb}
.dl-prov{border:1px solid #e3d9c8;border-radius:14px;padding:8px 10px;margin:8px 0;background:#fff}.dl-prov h4{margin:0 0 2px;font-size:15px}.dl-prov small{display:block;opacity:.8}
.dl-sum{background:#fff6e0;border-radius:14px;padding:10px;margin:10px 0;line-height:1.7}.dl-card{border:1px solid #e3d9c8;border-radius:16px;padding:10px;margin:10px 0;background:#fff}
.dl-head{display:flex;gap:8px;align-items:center}.dl-head .ie{font-size:28px}.dl-head small{display:block;opacity:.75}.dl-badge{margin-inline-start:auto;padding:3px 9px;border-radius:999px;background:#eef2f7;font-size:13px;white-space:nowrap}
.dl-badge.delivered{background:#d9f7e4}.dl-badge.out_for_delivery,.dl-badge.arrived,.dl-badge.unloading{background:#fff0c2}.dl-badge.cancelled,.dl-badge.failed{background:#ffd9d9}
.dl-steps{display:flex;gap:3px;margin:8px 0}.dl-steps i{flex:1;height:7px;border-radius:4px;background:#e5e7eb}.dl-steps i.on{background:#2a9d8f}.dl-steps i.cur{background:#f4a261;animation:pop .6s infinite alternate}
.dl-delay{background:#fff3cd;border-radius:10px;padding:6px 9px;margin:6px 0;font-size:13px}.dl-log{font-size:12px;opacity:.85;line-height:1.55;margin:4px 0}
.dl-map{width:100%;height:auto;background:#eaf3e3;border-radius:12px;margin:6px 0}#btnShip{position:relative}`;
  document.head.appendChild(css);

  /* ---------- شاشة الطلب ---------- */
  const U = D.ui; D.busy = false;
  D.checkout = (carKey) => {
    const C = V().CARS[carKey]; if (!C) return;
    Object.assign(U, { car: carKey, color: G().ui.ccolor || V().COLORS[0], sup: "dealer", dest: "H", prov: null, svc: null }); render(); sfx("pop");
  };
  function pickDefault(it) {
    // اقتراح أرخص خيار متاح إذا ما اختار اللاعب
    let best = null; Object.keys(D.PROV).forEach((pk) => D.PROV[pk].svcs.forEach((sk) => { if (D.avail(it, U.sup, U.dest, pk, sk)) return; const q = D.quote(it, U.sup, U.dest, pk, sk); if (!best || q.ship < best.q) best = { pk, sk, q: q.ship }; }));
    return best;
  }
  function render() {
    const S = G().state(), C = V().CARS[U.car]; if (!C) return; const it = { kind: "car", car: U.car, color: U.color };
    const card0 = document.getElementById("modalCard"), sc0 = card0 ? card0.scrollTop : 0;
    const dests = D.dests(); if (!dests.some((d) => d.id === U.dest)) U.dest = "H";
    if (U.prov && D.avail(it, U.sup, U.dest, U.prov, U.svc)) { U.prov = null; U.svc = null; }
    if (!U.prov) { const b = pickDefault(it); if (b) { U.prov = b.pk; U.svc = b.sk; } }
    const q = U.prov ? D.quote(it, U.sup, U.dest, U.prov, U.svc) : null, price = D.itemPrice(it, U.sup);
    const supChips = Object.keys(D.SUPPLIERS).map((k) => `<button class="dl-chip ${U.sup === k ? "on" : ""}" data-act="g-dl-sup" data-k="${k}">${D.SUPPLIERS[k].e} ${D.SUPPLIERS[k].n}</button>`).join("");
    const destChips = dests.map((d) => `<button class="dl-chip ${U.dest === d.id ? "on" : ""}" data-act="g-dl-dest" data-k="${d.id}">${d.e} ${esc(d.n)}</button>`).join("");
    const provs = Object.keys(D.PROV).map((pk) => {
      const P = D.PROV[pk], opts = P.svcs.map((sk) => {
        const SV = D.SVC[sk], why = D.avail(it, U.sup, U.dest, pk, sk);
        if (why) return `<button class="dl-opt" disabled title="${esc(why)}">${SV.e} ${SV.n}<small>${esc(why)}</small></button>`;
        const qq = D.quote(it, U.sup, U.dest, pk, sk);
        return `<button class="dl-opt ${U.prov === pk && U.svc === sk ? "on" : ""}" data-act="g-dl-pick" data-p="${pk}" data-s="${sk}">${SV.e} ${SV.n}<b>${qq.ship}🪙</b><small>≈ ${fmt(qq.eta)}</small></button>`;
      }).join("");
      const stars = "⭐".repeat(Math.round(D.rating(S, pk)));
      return `<div class="dl-prov"><h4>${P.e} ${esc(P.n)} <span style="font-weight:400;font-size:12px">${stars} ${D.rating(S, pk)} · موثوقية ${Math.round(P.rel * 100)}%</span></h4><small>${esc(P.d)} · 🚛 ${esc(P.fleet)}</small>${opts}</div>`;
    }).join("");
    const risk = q ? (q.risk < 0.12 ? "منخفض 🟢" : q.risk < 0.3 ? "متوسط 🟡" : "مرتفع 🟠") : "";
    const sum = q ? `<div class="dl-sum"><b>${V().icon(U.car, U.color)} ${esc(C.n)}</b> — ${D.SUPPLIERS[U.sup].n} ← ${esc((dests.find((d) => d.id === U.dest) || {}).n || "")}<br>
      🏷️ السعر ${price}🪙 + 🚚 الشحن ${q.ship}🪙 (${q.km} كم) = <b>${q.total}🪙</b> (معكم ${S.coins}🪙)<br>⏱ الوصول المتوقع بعد ≈ <b>${fmt(q.eta)}</b> · احتمال التأخير: ${risk}${q.storm ? " · 🌪️ طقس سيئ اليوم" : ""}<br>
      <small>التأخير بيتوضّح أسبابه بالتتبّع (طقس/ازدحام/عطل/ميناء/مناولة)، وإذا تأخرت أكثر من 25% بتتعوضوا 15% من الشحن. بتقدروا تلغوا قبل الاستلام (رسم 10%).</small></div>` : `<div class="dl-sum">ما في خدمة متاحة لهالاختيار. غيّروا المورّد أو الوجهة.</div>`;
    ui().openModal(`<h3>🚚 توصيل ${esc(C.n)}</h3><div class="coinbar">🪙 <b>${S.coins}</b></div>
      <p class="hint">الحمولة بتوصل بشاحنة حقيقية على موقعكم وبينزّلوها عمال. اختاروا المورّد والوجهة وشركة الشحن.</p>
      <b>المورّد</b><div>${supChips}</div><b>وين نوصّل؟</b><div>${destChips}</div><b>شركة الشحن والخدمة</b>${provs}${sum}
      <button class="btn gold" data-act="g-dl-go" ${q && S.coins >= q.total ? "" : "disabled"}>✅ تأكيد الطلب والدفع ${q ? q.total + "🪙" : ""}</button>
      ${U.sup === "dealer" ? `<button class="btn alt" data-act="g-dl-pickup" ${S.coins >= price ? "" : "disabled"}>🏬 استلام فوري من المعرض ${price}🪙 (بتسوقها من موقف المعرض)</button>` : ""}
      <button class="btn alt" data-act="g-dl-track">📦 شحناتي</button>`);
    const c1 = document.getElementById("modalCard"); if (c1) c1.scrollTop = sc0;
  }

  /* ---------- الخريطة ---------- */
  function mapSvg(o, st) {
    const R = D.route(o.sup, o.dest), N = D.net, W1 = 190, H1 = 150, X = (x) => (6 + ((x + 112) / 224) * (W1 - 12)).toFixed(1), Z = (z) => (6 + ((z + 62) / 160) * (H1 - 12)).toFixed(1);
    const HX = 238, HY = (z) => (10 + ((z - 98) / 1220) * 130).toFixed(1);
    let s = `<svg class="dl-map" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" direction="ltr">`;
    N.EDGES.forEach(([a, b]) => { const A = N.NODES[a], B = N.NODES[b]; s += `<line x1="${X(A[0])}" y1="${Z(A[1])}" x2="${X(B[0])}" y2="${Z(B[1])}" stroke="#9aa0aa" stroke-width="3"/>`; });
    ((OSW.EX && OSW.EX.LANDS) || []).forEach((L) => { s += `<rect x="${X(L.x - 9)}" y="${Z(L.z - 12)}" width="${(18 / 224 * (W1 - 12)).toFixed(1)}" height="${(26 / 160 * (H1 - 12)).toFixed(1)}" fill="#c9e3b4" stroke="#8fbf74" rx="2"/>`; });
    s += `<text x="${X(0) - 6}" y="${Z(-22)}" font-size="10">🏠</text><text x="${X(-23) - 6}" y="${Z(86)}" font-size="9">🏬</text>`;
    const vp = R.pts.filter((p) => p[1] < 105); if (vp.length > 1) s += `<polyline points="${vp.map((p) => X(p[0]) + "," + Z(p[1])).join(" ")}" fill="none" stroke="#e63946" stroke-width="2.2" stroke-dasharray="5 3"/>`;
    s += `<text x="${X(D.park(R).x) - 6}" y="${Z(D.park(R).z) + 4}" font-size="13">🏁</text>`;
    if (st.vis && st.z < 105) s += `<text x="${X(st.x) - 8}" y="${Z(st.z) + 5}" font-size="16">🚚</text>`;
    s += `<text x="4" y="146" font-size="8" fill="#555">القرية</text>`;
    s += `<line x1="${HX}" y1="${HY(98)}" x2="${HX}" y2="${HY(1318)}" stroke="#9aa0aa" stroke-width="4"/><text x="${HX - 8}" y="8" font-size="8" fill="#555">القرية</text><text x="${HX - 10}" y="148" font-size="8" fill="#555">🏝️</text>`;
    s += `<text x="${HX + 6}" y="${HY(420) + 3}" font-size="9">🏭</text>`;
    if (o.dest === "B" || o.sup === "import") s += `<text x="${HX - 6}" y="${HY(1262) + 3}" font-size="10">⚓</text>`;
    if (o.dest === "B") s += `<text x="${HX + 6}" y="${HY(1110) + 3}" font-size="11">🏁</text>`;
    if (st.vis && st.z >= 90) s += `<text x="${HX - 9}" y="${(+HY(Math.min(st.z, 1300))) + 5}" font-size="15">🚚</text>`;
    if (st.off) s += `<text x="${HX + 20}" y="75" font-size="16">${D.SVC[o.svc].air ? "✈️" : "🚢"}</text>`;
    return s + `</svg>`;
  }

  /* ---------- شاشة التتبّع ---------- */
  const STEPS = ["placed", "preparing", "awaiting_pickup", "picked_up", "in_transit", "at_port", "out_for_delivery", "arrived", "unloading", "delivered"];
  function destName(o) { const d = D.dests().find((x) => x.id === o.dest); return d ? d.n : o.dest === "B" ? "موقف الجزيرة" : o.dest; }
  function card(o, now, S) {
    const P = D.PROV[o.prov], SV = D.SVC[o.svc], st = D.stateAt(o, now), code = o.done ? "delivered" : st.code, [em, lab] = D.STATUS[st.delay && !o.done && code !== "delivered" ? "delayed" : code] || ["📦", code];
    const tr = o.sup === "import" || SV.sea || SV.air, steps = STEPS.filter((c) => tr || c !== "at_port"), idx = steps.indexOf(code === "cancelled" ? "placed" : code);
    const eta = D.etaOf(o, now), revealed = o.plan.delays.filter((d) => now >= d.at), cargo = (D.CARGO[o.item.kind] || D.CARGO.car).label(o.item);
    const log = []; const T = o.plan.T; [["placed0", "placed"], ["prep0", "preparing"], ["pick0", "awaiting_pickup"], ["pick1", "picked_up"], ["road0", "in_transit"], ["arr0", "arrived"], ["unl0", "unloading"], ["unl1", "delivered"]].forEach(([k, c]) => { if (T[k] !== undefined && now >= T[k]) log.push(`• ${D.STATUS[c][1]}`); });
    revealed.forEach((d) => log.push("• " + d.why));
    const canCancel = !o.done && !o.cancelled && now < T.pick0, open = D.tui.open === o.id, local = st.vis && (st.z < 1000) === (G && W() && W()._int && W()._int.me ? W()._int.me.z < 1000 : true);
    return `<div class="dl-card"><div class="dl-head"><span class="ie">${P.e}</span><div><b>#${o.seq} ${esc(cargo)}</b><small>${esc(P.n)} · ${SV.e} ${SV.n} · ${esc(D.SUPPLIERS[o.sup].n)}</small></div><span class="dl-badge ${st.delay && !o.done ? "delayed" : code}">${em} ${lab}</span></div>
      <div class="dl-steps">${steps.map((c, i) => `<i class="${o.cancelled ? "" : i < idx || code === "delivered" ? "on" : i === idx ? "cur" : ""}" title="${D.STATUS[c][1]}"></i>`).join("")}</div>
      <div style="font-size:13px;line-height:1.7">🔖 <b>${trackId(o)}</b> · 📍 ${esc(st.loc)} ← 🏁 ${esc(destName(o))}<br>💰 ${o.price}🪙 + شحن ${o.ship}🪙 = <b>${o.total}🪙</b>${o.done || o.cancelled ? "" : `<br>⏱ الوصول المتوقع بعد <b>${fmt(eta - now)}</b>`}${o.done && o.plan.late ? `<br>🎁 تعويض تأخير ${Math.round(o.ship * D.LATE_REFUND)}🪙` : ""}${o.rerouted ? "<br>↩️ تعذّر الوصول للموقع فانتسلمت ببيتكم" : ""}</div>
      ${st.delay && !o.done ? `<div class="dl-delay">⚠️ ${esc(st.delay)}</div>` : ""}<div class="dl-log">${log.slice(-5).join("<br>")}</div>
      ${open && !o.cancelled ? mapSvg(o, st) : ""}
      <div class="ib" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${o.cancelled || o.done ? "" : `<button class="btn sm alt" data-act="g-dl-open" data-id="${o.id}">🗺️ ${open ? "أخفِ الخريطة" : "الخريطة"}</button>${st.vis ? `<button class="btn sm alt" data-act="g-dl-goto" data-id="${o.id}">🚶 شاهدوها بالعالم</button>` : ""}`}${canCancel ? `<button class="btn sm alt" data-act="g-dl-cancel" data-id="${o.id}">🚫 إلغاء (-10%)</button>` : ""}</div></div>`;
  }
  D.openTracker = () => {
    D.tui.live = true; const S = G().state(), now = Date.now(), list = D.list();
    const act = list.filter((o) => !o.done && !o.cancelled), past = list.filter((o) => o.done || o.cancelled).slice(0, 4);
    ui().openModal(`<h3>📦 شحناتي</h3><div class="coinbar">🪙 <b>${S.coins}</b></div><p class="hint">الشحنات بتتحرك بالعالم فعلاً: روحوا لموقعكم وشوفوا الشاحنة وهي بتوصل وبتتفرّغ. التتبّع والخريطة بيتحدّثوا مع حركة الشاحنة.</p>
      ${list.length ? "" : `<div class="empty"><span class="big">🚚</span>ما في شحنات لسا. اطلبوا مركبة من <b>معرض السيارات</b> واختاروا التوصيل.</div>`}
      ${act.map((o) => card(o, now, S)).join("")}${past.length ? `<b>السابقة</b>${past.map((o) => card(o, now, S)).join("")}` : ""}<button class="btn alt" data-act="g-dl-shop">🚗 معرض السيارات</button>`);
  };
  const modalIsTracker = () => { const m = document.getElementById("modalCard"); return m && !document.getElementById("modal").hidden && m.querySelector("h3") && m.querySelector("h3").textContent.indexOf("شحناتي") >= 0; };
  const refreshTracker = () => { if (!modalIsTracker()) return; const m = document.getElementById("modalCard"), sc = m.scrollTop; D.openTracker(); const m2 = document.getElementById("modalCard"); if (m2) m2.scrollTop = sc; };

  /* ---------- الأزرار ---------- */
  D.click = async (a, el) => {
    const d = el.dataset; if (D.busy) return; D.busy = true;
    try {
      if (a === "g-dl-sup") { U.sup = d.k; U.prov = U.svc = null; render(); }
      else if (a === "g-dl-dest") { U.dest = d.k; U.prov = U.svc = null; render(); }
      else if (a === "g-dl-pick") { U.prov = d.p; U.svc = d.s; render(); }
      else if (a === "g-dl-go") {
        const it = { kind: "car", car: U.car, color: U.color }, why = D.avail(it, U.sup, U.dest, U.prov, U.svc), q = !why && D.quote(it, U.sup, U.dest, U.prov, U.svc);
        if (why || !q) return toast("⚠️ " + (why || "اختاروا خدمة"));
        if (G().state().coins < q.total) return toast(`ما معك مصاري كفاية 🪙 (بدك ${q.total})`);
        const before = D.list().length; await D.order(it, U.sup, U.dest, U.prov, U.svc);
        const S = G().state(), ok = D.list().length > before;
        if (!ok) return toast("⚠️ ما انقبل الطلب (راجعوا الوجهة والحد الأقصى للشحنات الفعالة)");
        sfx("magic"); toast(`📦 انطلب! رقم التتبّع ${trackId(D.list()[0])} · الوصول ≈ ${fmt(q.eta)}`, "gold", 5000); D.tui.open = D.list()[0].id; D.openTracker(); tick();
      }
      else if (a === "g-dl-pickup") { const C = V().CARS[U.car], price = D.itemPrice({ car: U.car }, "dealer"); if (G().state().coins < price) return toast("🪙 ما معك مصاري كفاية"); await G().do("cbuy", { car: U.car, color: U.color }); sfx("magic"); ui().closeModal(); toast(`${C.e} مبروك! ${C.n} صارت إلكم - مركونة بموقف المعرض`, "gold", 4000); }
      else if (a === "g-dl-track") D.openTracker();
      else if (a === "g-dl-shop") V().showroom();
      else if (a === "g-dl-open") { D.tui.open = D.tui.open === d.id ? null : d.id; D.openTracker(); }
      else if (a === "g-dl-cancel") { await D.cancel(d.id); toast("🚫 انلغت الشحنة ورجعت لكم المصاري (ناقص 10%)"); D.openTracker(); }
      else if (a === "g-dl-goto") {
        const o = D.list().find((x) => x.id === d.id); if (!o) return; const st = D.stateAt(o, Date.now()), w = W(), m = w && w._int && w._int.me;
        ui().closeModal(); if (!w || !m) return; if (w.mode !== "out") return toast("اطلعوا من البيت أول 🚪"); if (m.veh) return toast("🚪 انزلوا من السيارة أول");
        const pk = D.park(D.route(o.sup, o.dest)), tg = st.vis && st.z < 100 ? { x: st.x, z: st.z } : pk;
        if ((tg.z > 1000) !== (m.z > 1000)) return toast("🏝️ الشحنة بمنطقة ثانية: لازم تسوقوا بالسيارة على الطريق الطويل");
        w.goTo(tg.x + 6, tg.z + 6);
      }
    } catch (er) { console.warn("[deliv] click", er); toast("⚠️ " + esc(er.message || er)); } finally { D.busy = false; }
  };

  /* ---------- مؤقّت: إشعارات + حدث الاستلام + علامات + زر ---------- */
  let badgeEl = null, lastLab = 0;
  function ensureBtn() {
    if (badgeEl) return badgeEl; const bar = document.querySelector(".hud-btns"); if (!bar) return null;
    const b = document.createElement("button"); b.id = "btnShip"; b.className = "rbtn"; b.hidden = true; b.setAttribute("aria-label", "شحناتي"); b.innerHTML = `📦<i class="rb" hidden>0</i>`;
    b.onclick = () => D.openTracker(); bar.insertBefore(b, bar.firstChild); return (badgeEl = b);
  }
  const notify = (o, code, st) => {
    const lab = D.STATUS[code] ? D.STATUS[code][1] : code, tag = `📦 #${o.seq}`;
    if (code === "delivered") { sfx("fanfare"); toast(`🎉 ${tag}: وصلت ${(D.CARGO[o.item.kind] || D.CARGO.car).label(o.item)} إلى ${destName(o)}! بتلاقوها بالموقف`, "gold", 6000); return; }
    if (code === "out_for_delivery") sfx("pop"); if (code === "arrived") { sfx("pop"); }
    toast(`${D.STATUS[code] ? D.STATUS[code][0] : "📦"} ${tag}: ${lab}`, "", 3200);
  };
  function tick() {
    try {
      const S = G().state(), SS = S.ship, now = Date.now(), b = ensureBtn(); if (!SS) { if (b) b.hidden = true; return; }
      const act = [];
      Object.values(SS.orders).forEach((o) => {
        const st = D.stateAt(o, now), code = o.cancelled ? "cancelled" : o.done ? "delivered" : st.code;
        if (D._last[o.id] === undefined) D._last[o.id] = code; else if (D._last[o.id] !== code) { D._last[o.id] = code; if (code !== "cancelled" && code !== "placed") notify(o, code, st); }
        const nd = o.plan.delays.filter((d) => now >= d.at).length; if (D._dl === undefined) D._dl = {}; if (D._dl[o.id] === undefined) D._dl[o.id] = nd; else if (nd > D._dl[o.id]) { D._dl[o.id] = nd; if (!o.done && !o.cancelled) toast(`⚠️ #${o.seq} تأخّرت: ${o.plan.delays.filter((d) => now >= d.at).pop().why} · الوصول المتوقع بعد ${fmt(D.etaOf(o, now) - now)}`, "", 5500); }
        if (!o.done && !o.cancelled) { act.push({ o, st });
          if (now >= o.plan.T.unl1) { if (!D._sent[o.id] || now - D._sent[o.id] > 20000) { D._sent[o.id] = now; G().do("ship_recv", { id: o.id }).catch((e) => { D._sent[o.id] = 0; console.warn("[deliv] recv", e); }); } } }
      });
      if (b) { b.hidden = !Object.keys(SS.orders).length; const i = b.querySelector(".rb"); if (i) { i.hidden = !act.length; i.textContent = act.length; } }
      if (now - lastLab > 2000) { lastLab = now; const w = W(), me = w && w._int && w._int.me;
        if (w && w.setDynLabels) w.setDynLabels("ship", me ? act.filter((x) => x.st.vis && hy(x.st.x - me.x, x.st.z - me.z) < 420 && (x.st.z > 1000) === (me.z > 1000)).map((x) => ({ id: x.o.id, x: x.st.x, z: x.st.z, y: 4.8, text: `🚚 ${D.PROV[x.o.prov].n} · ${D.STATUS[x.st.code][1]} · ${fmt(D.etaOf(x.o, now) - now)}`, cls: "tag", max: 160 })) : []); }
      if (D.tui.live && modalIsTracker()) refreshTracker();
    } catch (e) { if (!D._terr) { D._terr = 1; console.error("[deliv] tick", e); } }
  }
  D.tick = tick;

  /* ---------- الربط ---------- */
  let installed = false;
  D.install = () => {
    if (installed) return true; const g = G(), v = V(); if (!(g && g.click && g.openers && v && v.showroom && g.openers.cars === v.showroom)) return false;
    const oc = g.click; g.click = (a, el) => { if (typeof a === "string") { if (a === "g-v-buy") { return D.checkout(el.dataset.k); } if (a.indexOf("g-dl-") === 0) return D.click(a, el); } return oc(a, el); };
    const os = v.showroom; v.showroom = function (keep) { const r = os.apply(this, arguments); try { const m = document.getElementById("modalCard"), h = m && m.querySelector("h3"); if (h && !m.querySelector("#dlShipBtn")) h.insertAdjacentHTML("afterend", `<button id="dlShipBtn" class="btn sm gold" data-act="g-dl-track" style="margin:4px 0">📦 شحناتي (${D.list().filter((o) => !o.done && !o.cancelled).length} فعّالة)</button><p class="hint" style="margin:2px 0">اضغطوا على أي مركبة بالكتالوج لتطلبوا توصيلها لبيتكم أو أرضكم 🚚</p>`); } catch (e) { /* */ } return r; };
    g.openers.cars = v.showroom; g.openers.ship = D.openTracker; installed = true; return true;
  };
  const tryI = () => { if (D.install()) return; let n = 0; const iv = setInterval(() => { if (D.install() || ++n > 60) clearInterval(iv); }, 500); };
  tryI(); document.addEventListener("DOMContentLoaded", () => D.install()); window.addEventListener("load", () => D.install());
  D._timer = setInterval(tick, 1000);
})();
