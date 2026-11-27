/* ============================================================
   systems.js — طبقة الأنظمة (الحساب 2): ربط مع العالم + ملكية القطع الزراعية + السجل المالي
   - ما بتعدّل أي ملف عالم. بتقرا بس من OSW.islands / OSW_ISL بالمعرفات الثابتة (WORLD_INTEGRATION.md).
   - كل شي أحداث (entries / title = sys_*) والحالة بتنحسب بالـ fold (نفس مبدأ اللعبة): بدون جداول جديدة.
   - ما فيها بيئة اختبار مؤقتة: لو معرّف ناقص، S.check() بيرجّع القائمة وما بنفترض إنه موجود.
   ============================================================ */
(function () {
  "use strict";
  const OSW = window.OSW; if (!OSW || !OSW.game) return;
  const Y = (OSW.sys = { version: 1 });
  const G = () => OSW.game, V = () => OSW.veh, ISL = () => OSW.islands, hy = Math.hypot;
  const AGRI = "ISL_AGRI";

  /* ---------- المعرفات المطلوبة من الحساب 1 (لازم تكون موجودة، وإلا الميزة بتتعطل برسالة واضحة) ---------- */
  Y.REQUIRED = { islands: [AGRI], bridges: ["BRG_AGRI"], sites: ["AGRI_YARD", "AGRI_ORCH"], points: ["AGRI_EQ_1"], roads: ["AGRI_R_EW", "AGRI_R_NS"] };
  Y.check = () => {
    const D = window.OSW_ISL, miss = [];
    if (!D || !ISL()) return ["OSW_ISL/OSW.islands غير محمّل"];
    Y.REQUIRED.islands.forEach((k) => { if (!D.islands[k]) miss.push("island:" + k); });
    Y.REQUIRED.bridges.forEach((k) => { if (!(D.bridges || []).some((b) => b.id === k)) miss.push("bridge:" + k); });
    Y.REQUIRED.sites.forEach((k) => { if (!D.sites.some((s) => s.id === k)) miss.push("site:" + k); });
    Y.REQUIRED.points.forEach((k) => { if (!D.points.some((p) => p.id === k)) miss.push("point:" + k); });
    Y.REQUIRED.roads.forEach((k) => { if (!(D.roads || []).some((r) => r.id === k)) miss.push("road:" + k); });
    if (!D.parcels.some((p) => p.isl === AGRI)) miss.push("parcels:" + AGRI);
    return miss;
  };
  Y.ready = () => Y.check().length === 0;

  /* ---------- القطع ---------- */
  const parcels = () => ((window.OSW_ISL && window.OSW_ISL.parcels) || []).filter((p) => p.isl === AGRI);
  const parcelBy = (id) => parcels().find((p) => p.id === id) || null;
  Y.parcels = parcels; Y.parcel = parcelBy;
  const CROP_MUL = { olive: 1.35, lemon: 1.3, strawberry: 1.3, corn: 1.1, sunflower: 1.05, tomato: 1.1, cucumber: 1.05, carrot: 1.05, wheat: 1 };
  const RATE = 0.1;                  // عملة لكل م² (قطعة 44×34 = 1496م² ≈ 150-200)
  Y.priceOf = (p) => Math.max(10, Math.round(p.area * RATE * (CROP_MUL[p.crop] || 1)));
  Y.SELL_BACK = 0.7;                 // البيع بيرجّع 70% من سعر الشراء
  Y.cropName = (c) => ({ olive: "زيتون 🫒", wheat: "قمح 🌾", tomato: "بندورة 🍅", cucumber: "خيار 🥒", carrot: "جزر 🥕", corn: "ذرة 🌽", sunflower: "دوّار الشمس 🌻", lemon: "ليمون 🍋", strawberry: "فراولة 🍓" }[c] || (c ? c : "أرض فاضية"));

  // التجاور: نفس الصف/العمود بفجوة ≤ 3.5م وتداخل على المحور الثاني
  const overlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);
  Y.adjacent = (a, b) => {
    if (!a || !b || a.id === b.id) return false;
    const ox = overlap(a.x0, a.x1, b.x0, b.x1), oz = overlap(a.z0, a.z1, b.z0, b.z1);
    const gx = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1), gz = Math.max(a.z0, b.z0) - Math.min(a.z1, b.z1);
    return (oz > 5 && gx <= 3.5 && gx > -0.5) || (ox > 5 && gz <= 3.5 && gz > -0.5);
  };

  /* ---------- الحالة (fold) ---------- */
  const sysS = (S) => S.sys || (S.sys = { parcels: {}, groups: {}, ledger: [], n: 0 });
  Y.state = (S) => sysS(S || G().state());
  const post = (S, t, a, kind, amt, ref, note) => { const s = sysS(S); s.ledger.push({ n: ++s.n, t, by: a, k: kind, amt, ref: ref || null, note: note || "", bal: S.coins }); };
  Y.post = post;
  Y.ledger = (S) => sysS(S || G().state()).ledger;
  Y.owned = (S) => { const s = sysS(S || G().state()); return Object.keys(s.parcels).filter((k) => !s.parcels[k].sold); };
  Y.groupOf = (S, id) => { const s = sysS(S || G().state()), p = s.parcels[id]; return p && p.grp ? s.groups[p.grp] : null; };
  Y.area = (S, id) => { const g = Y.groupOf(S, id); const ids = g ? g.ids : [id]; return ids.reduce((n, k) => n + ((parcelBy(k) || {}).area || 0), 0); };

  Y.fold = (ty, e, d, t, a, day, S, H) => {
    if (ty === "sys_cheat_coins") { const n = Math.floor(Number(d.n)); if (!(n >= 1 && n <= 1000000)) return true; S.coins += n; post(S, t, a, "cheat", n, null, "إضافة مصاري (كلمة السر)"); H.mark(); return true; }
    if (ty !== "sys_parcel_buy" && ty !== "sys_parcel_sell" && ty !== "sys_parcel_merge" && ty !== "sys_parcel_split") return false;
    try {
      if (!Y.ready()) return true;
      const s = sysS(S);
      if (ty === "sys_parcel_buy") {
        const p = parcelBy(d.id); if (!p) return true;
        const cur = s.parcels[p.id]; if (cur && !cur.sold) return true;            // ما بنشتري ملك حدا (ولا بنكرر)
        if (Y.npcOwns && Y.npcOwns(S, p.id, t)) return true;
        const price = Y.priceOf(p); if (S.coins < price) return true;
        S.coins -= price; s.parcels[p.id] = { by: a, t, price, grp: null, sold: false };
        post(S, t, a, "parcel_buy", -price, p.id, "شراء " + p.id); Y.ensureLot("AP:" + p.id); H.mark(); return true;
      }
      const p = s.parcels[d.id];
      if (ty === "sys_parcel_sell") {
        if (!p || p.sold) return true;
        if (Object.values(S.ship ? S.ship.orders : {}).some((o) => !o.done && !o.cancelled && o.dest === "AP:" + d.id)) return true; // في شحنة جاية للأرض
        if (Object.values(S.cars || []).some((c) => c.at === "AP:" + d.id)) return true;                                        // في مركبات واقفة عليها
        const gp = p.grp; if (gp) { const g = s.groups[gp]; g.ids = g.ids.filter((k) => k !== d.id); if (g.ids.length < 2) { g.ids.forEach((k) => (s.parcels[k].grp = null)); delete s.groups[gp]; } p.grp = null; }
        const back = Math.round(p.price * Y.SELL_BACK); S.coins += back; p.sold = true; post(S, t, a, "parcel_sell", back, d.id, "بيع " + d.id); H.mark(); return true;
      }
      if (ty === "sys_parcel_merge") {
        const ids = Array.from(new Set(d.ids || [])); if (ids.length < 2 || ids.length > 12) return true;
        if (!ids.every((k) => s.parcels[k] && !s.parcels[k].sold)) return true;
        const ps = ids.map(parcelBy); if (ps.some((x) => !x)) return true;
        // لازم تكون كتلة متصلة (كل قطعة مجاورة لوحدة من الباقي)
        const seen = new Set([ps[0].id]), q = [ps[0]]; while (q.length) { const c = q.pop(); ps.forEach((x) => { if (!seen.has(x.id) && Y.adjacent(c, x)) { seen.add(x.id); q.push(x); } }); }
        if (seen.size !== ps.length) return true;
        // لو في قطع مدموجة قبل بنوحّد مجموعاتها
        const all = new Set(ids); ids.forEach((k) => { const g = s.groups[s.parcels[k].grp]; if (g) g.ids.forEach((z) => all.add(z)); });
        const gid = "G" + (++s.n); const list = Array.from(all); list.forEach((k) => { const og = s.parcels[k].grp; if (og && s.groups[og]) delete s.groups[og]; s.parcels[k].grp = gid; });
        s.groups[gid] = { id: gid, ids: list, by: a, t }; post(S, t, a, "parcel_merge", 0, gid, "دمج " + list.join("+")); H.mark(); return true;
      }
      if (ty === "sys_parcel_split") {
        if (!p || p.sold || !p.grp) return true; const g = s.groups[p.grp]; g.ids.forEach((k) => (s.parcels[k].grp = null)); delete s.groups[g.id]; post(S, t, a, "parcel_split", 0, g.id, "فك دمج"); H.mark(); return true;
      }
    } catch (er) { console.warn("[sys] fold", er); }
    return true;
  };
  // ربط الحدث بنظام fold الموجود بدون ما نعدّل game.js (نفس أسلوب التوصيل)
  try { if (OSW.fam && OSW.fam.fold && !OSW.fam._sys) { const of = OSW.fam.fold; OSW.fam.fold = (ty, e, d, t, a, day, S, H) => (/^sys_/.test(ty) ? Y.fold(ty, e, d, t, a, day, S, H) || of(ty, e, d, t, a, day, S, H) : of(ty, e, d, t, a, day, S, H)); OSW.fam._sys = 1; } } catch (er) { /* */ }

  /* ---------- أفعال اللاعب ---------- */
  Y.buy = (id) => G().do("sys_parcel_buy", { id });
  Y.sell = (id) => G().do("sys_parcel_sell", { id });
  Y.merge = (ids) => G().do("sys_parcel_merge", { ids });
  Y.split = (id) => G().do("sys_parcel_split", { id });

  /* ---------- وجهات التوصيل: كل قطعة مملوكة = وجهة فعلية بموقف مركبات داخلها ---------- */
  const ROAD = (id) => ((window.OSW_ISL && window.OSW_ISL.roads) || []).find((r) => r.id === id);
  const BRG = () => ((window.OSW_ISL && window.OSW_ISL.bridges) || []).find((b) => b.id === "BRG_AGRI");
  const isAp = (k) => typeof k === "string" && k.indexOf("AP:") === 0;
  Y.isDest = isAp;
  Y.ownsDest = (S, k) => { if (!isAp(k)) return false; const s = sysS(S), p = s.parcels[k.slice(3)]; return !!(p && !p.sold && parcelBy(k.slice(3))); };

  // نقاط المسار داخل الجزيرة الزراعية لقطعة: جسر ← طريق شرق-غرب ← (طريق شمال-جنوب) ← مدخل القطعة ← موقف التفريغ
  Y.plan = (id) => {
    const p = parcelBy(id), I = window.OSW_ISL.islands[AGRI], br = BRG(), ew = ROAD("AGRI_R_EW"), ns = ROAD("AGRI_R_NS");
    if (!p || !I || !br || !ew || !ns) return null;
    const zEW = ew.pts ? ew.pts[0][1] : I.c.z, xNS = ns.pts ? ns.pts[0][0] : I.c.x;
    const gateX = br.xb;
    // مرشّح A: طريق شرق-غرب إلى x القطعة ثم ندخل عمودياً؛ مرشّح B: طريق شمال-جنوب ثم ندخل أفقياً
    const sv = p.z >= zEW ? 1 : -1, su = p.x >= xNS ? 1 : -1;
    const hA = Math.abs(p.z - zEW) - 17, hB = Math.abs(p.x - xNS) - 22;
    const useA = hA <= hB + 0.01;
    const L = [];                                              // الدخول للجزيرة
    L.push([gateX, zEW]);
    let pad, lotC, heading;
    if (useA) { L.push([p.x, zEW]); pad = { x: p.x, z: p.z - sv * 6 }; heading = sv > 0 ? 0 : Math.PI; lotC = { x: p.x - 13, z: p.z + sv * 9 }; }
    else { L.push([xNS, zEW]); L.push([xNS, p.z]); pad = { x: p.x - su * 6, z: p.z }; heading = su > 0 ? Math.PI / 2 : -Math.PI / 2; lotC = { x: p.x + su * 9, z: p.z - 13 }; }
    L.push([pad.x, pad.z]);
    return { pts: L, pad, lot: { x: lotC.x, z: lotC.z, dx: 6.5, dz: 0, h: heading, cx: p.x, cz: p.z, rad: 36, out: { x: pad.x, z: pad.z } }, gateX, zEW };
  };

  Y.ensureLot = (k) => {
    if (!isAp(k) || !V() || !V().LOTS) return null;
    if (V().LOTS[k]) return V().LOTS[k];
    const pl = Y.plan(k.slice(3)); if (!pl) return null; V().LOTS[k] = pl.lot; return pl.lot;
  };
  Y.destList = (S) => Y.owned(S).map((id) => { const p = parcelBy(id); return p ? { id: "AP:" + id, n: (Y.cropName(p.crop) + " — " + id), e: p.crop === "olive" ? "🫒" : "🌾", reg: "I", parcel: id } : null; }).filter(Boolean);

  // أرض الزيتون: أول قطعة مملوكة محصولها زيتون (للاختبارات والواجهة)
  Y.oliveParcels = () => parcels().filter((p) => p.crop === "olive");


  /* ---------- واجهة القطع: شراء / بيع / دمج + سجل مالي ---------- */
  const esc = (t) => (OSW.esc ? OSW.esc(String(t)) : String(t)), UI = () => OSW.ui;
  Y.ui = { sel: {} };
  Y.openParcel = (id) => {
    const S = G().state(), s = sysS(S), p = parcelBy(id); if (!p) return;
    const own = s.parcels[id] && !s.parcels[id].sold, g = own ? Y.groupOf(S, id) : null, price = Y.priceOf(p);
    const nb = parcels().filter((q) => Y.adjacent(p, q) && s.parcels[q.id] && !s.parcels[q.id].sold && (!g || g.ids.indexOf(q.id) < 0));
    const sel = Y.ui.sel[id] || (Y.ui.sel[id] = {});
    let body = `<p class="hint">${esc(Y.cropName(p.crop))} · ${p.area} م² · ${esc(p.id)}${g ? " · أرض مدموجة (" + g.ids.length + " قطع، " + Y.area(S, id) + " م²)" : ""}</p>`;
    if (!own) body += `<button class="btn gold" data-act="g-sys-buy" data-id="${id}">🪙 شراء بـ ${price}</button>`;
    else {
      body += `<p>✅ ملككم. سعر الشراء ${s.parcels[id].price} · بيعها بيرجّع ${Math.round(s.parcels[id].price * Y.SELL_BACK)}</p>`;
      if (nb.length) body += `<p class="hint">ادمجوها مع قطعة مجاورة مملوكة:</p>` + nb.map((q) => `<button class="btn sm" data-act="g-sys-merge" data-id="${id}" data-with="${q.id}">🔗 ${esc(q.id)}</button>`).join(" ");
      if (g) body += ` <button class="btn sm" data-act="g-sys-split" data-id="${id}">✂️ فك الدمج</button>`;
      body += `<div style="margin-top:8px"><button class="btn sm alt" data-act="g-sys-sell" data-id="${id}">بيع القطعة</button></div>`;
    }
    UI().openModal(`<h3>🌾 ${esc(p.id)}</h3>${body}<div style="margin-top:10px"><button class="btn sm alt" data-act="g-sys-ledger">📒 السجل المالي</button></div>`);
  };
  Y.openLedger = () => {
    const L = Y.ledger(G().state()).slice(-40).reverse();
    const rows = L.map((l) => `<div class="irow"><div class="iname"><b>${esc(l.note || l.k)}</b><small>${new Date(l.t).toLocaleString("ar")}</small></div><div class="ib"><b style="color:${l.amt < 0 ? "#c0392b" : "#2e7d32"}">${l.amt > 0 ? "+" : ""}${l.amt}</b> <small>رصيد ${l.bal}</small></div></div>`).join("") || `<p class="hint">ما في حركات بعد.</p>`;
    UI().openModal(`<h3>📒 السجل المالي</h3><div class="items">${rows}</div>`);
  };

  /* ---------- كلمة سر: بتفتح نافذة إضافة مصاري ---------- */
  Y.SECRET = "money2026"; Y.SECRETS = [Y.SECRET, "1220"];                       // غيّرها من هون
  Y.addCoins = (n) => G().do("sys_cheat_coins", { n: Math.floor(Number(n)) });
  Y.openCheat = () => {
    UI().openModal(`<h3>🪙 إضافة مصاري</h3><p class="hint">رصيدكم هلأ: <b>${G().state().coins}</b></p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${[100, 1000, 10000, 100000].map((n) => `<button class="btn sm gold" data-act="g-sys-cheat" data-n="${n}">+${n}</button>`).join("")}</div>
      <div style="display:flex;gap:6px"><input id="sysCheatN" type="number" min="1" max="1000000" placeholder="مبلغ آخر" style="flex:1;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn gold" data-act="g-sys-cheat" data-n="custom">زيدوا</button></div>`);
  };
  Y.install = () => {
    if (Y._inst) return; Y._inst = 1;
    const gc = G().click;
    G().click = (a, el) => {
      const d = (el && el.dataset) || {};
      const run = async (f, ok, cond) => { try { await f(); for (let i = 0; i < 25 && cond && !cond(); i++) await OSW.sleep(120); await OSW.sleep(150); ok && ok(); } catch (e) { console.error(e); } };
      if (a === "g-sys-buy") return run(() => Y.buy(d.id), () => Y.openParcel(d.id), () => Y.owned().includes(d.id));
      if (a === "g-sys-sell") return run(() => Y.sell(d.id), () => UI().closeModal(), () => !Y.owned().includes(d.id));
      if (a === "g-sys-split") return run(() => Y.split(d.id), () => Y.openParcel(d.id), () => !Y.groupOf(G().state(), d.id));
      if (a === "g-sys-merge") { const g = Y.groupOf(G().state(), d.id); const ids = (g ? g.ids : [d.id]).concat([d.with]); return run(() => Y.merge(ids), () => Y.openParcel(d.id), () => !!Y.groupOf(G().state(), d.id)); }
      if (a === "g-sys-ledger") return Y.openLedger();
      if (a === "g-sys-cheat") { const n = d.n === "custom" ? (document.getElementById("sysCheatN") || {}).value : d.n; if (!(Number(n) >= 1)) return; return run(() => Y.addCoins(n), () => Y.openCheat()); }
      return gc(a, el);
    };
    // كلمة السر بالشات: ما بتنبعت للشريك، بتفتح النافذة بس
    if (OSW.chat && OSW.chat.send && !OSW.chat._sysw) { const os = OSW.chat.send; OSW.chat.send = function (txt) { if (Y.SECRETS.indexOf(String(txt || "").trim()) >= 0) { const i = document.getElementById("chatIn"); if (i) i.value = ""; const c = document.getElementById("chat"); if (c) c.hidden = true; Y.openCheat(); return Promise.resolve(); } return os.apply(this, arguments); }; OSW.chat._sysw = 1; }
    if (ISL() && ISL().on) ISL().on((e) => { if (e.type === "parcel" && e.id && Y.ready()) { Y.openParcel(e.id); return true; } return false; });
  };
  const X = OSW.extras; if (X && X.start) { const st = X.start; X.start = function () { const r = st.apply(X, arguments); try { Y.install(); } catch (e) { console.error(e); } return r; }; } else setTimeout(() => { try { Y.install(); } catch (e) { /* */ } }, 0);

  // سجل دخول/خروج صالح للاختبار: لا يوجد شي مؤقت هون — كله من OSW_ISL
  window.dispatchEvent && window.dispatchEvent(new Event("osw-sys-core"));
})();
