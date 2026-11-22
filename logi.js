/* اللوجستيات: كراتين حقيقية بالمخزن وبالسيارة، مرآب سعدون ومرآب المزرعة، بيع الحمولة.
   كل شي محمي بـ try/catch حتى ما يوقف اللعبة. */
(function () {
  const OSW = window.OSW, L = (OSW.logi = { doors: [] }), PI = Math.PI, hy = Math.hypot, esc = OSW.esc;
  const Builder = OSW.Builder, M = OSW.M, R = OSW.R;
  const G = () => OSW.game, W = () => OSW.world, V = () => OSW.veh, ui = () => OSW.ui, db = () => OSW.ui.db, P = () => OSW.places;
  const toast = (m, c, ms) => ui().toast(m, c || "", ms);
  const sfx = (n) => OSW.audio && OSW.audio.sfx(n);
  const hearts = (e, n) => ui().hearts && ui().hearts(e, n || 8);

  // أسعار البيع حسب المحل (المرحلة التالية: محلات الجزيرة الثانية)
  const SHOPS = (L.SHOPS = { s1: { n: "بقالة سعدون", mult: 1 } });
  const UNITS = 3; // وحدات المحصول بالكرتونة اللي بتطلع من المخزن

  /* ===== مواقف جديدة للسيارات ===== */
  if (V() && V().LOTS) {
    V().LOTS.G = { x: -31.8, z: -26.5, dz: -5.2, h: PI, cx: -31.8, cz: -31.5, rad: 16, out: { x: -30.0, z: -29.6 } };       // موقف المخزن عالطريق شرق الهنقر
    V().LOTS.S = { x: -16.4, z: 19.6, dz: 3.0, h: -PI / 2, cx: -16.4, cz: 21.1, rad: 12, out: { x: -9.6, z: 21.6 } };       // مرآب سعدون
  }

  /* ===== أحداث اللعبة (بتنحسب بالـ fold) ===== */
  const capOfCar = (car) => (OSW.veh.CARS[car.car] || {}).cargo || 4;
  L.fold = (ty, e, d, t, a, day, S, H) => {
    const hand = () => (S.carry[a] = S.carry[a] || []), carObj = () => S.cars.find((x) => x.id === d.id);
    if (ty === "unstash") {
      const C = G().CROPS[d.crop]; if (!C) return true; const n = Math.max(1, Math.min(6, d.n | 0)), cap = 3 + ((S.up && S.up.barn) || 0); let k = 0;
      while (k < n && hand().length < cap && (S.inv[d.crop] || 0) >= 1) { const u = Math.min(UNITS, S.inv[d.crop]); S.inv[d.crop] -= u; hand().push({ crop: d.crop, units: u }); k++; }
      if (k) H.mark(); return true;
    }
    if (ty === "cload") {
      const car = carObj(); if (!car) return true; car.crates = car.crates || []; const h = hand(), cap = capOfCar(car); let k = 0;
      while (h.length && car.crates.length < cap) { car.crates.push(h.shift()); k++; }
      if (k) H.mark(); return true;
    }
    if (ty === "cunload") {
      const car = carObj(); if (!car || !(car.crates || []).length) return true;
      car.crates.forEach((c) => H.add(c.crop, c.units)); car.crates = []; H.mark(); return true;
    }
    if (ty === "csell") {
      const car = carObj(); if (!car || !(car.crates || []).length) return true; const sh = SHOPS[d.shop] || SHOPS.s1; let gain = 0, n = 0;
      car.crates.forEach((c) => { gain += Math.round(G().priceOf(c.crop, day) * c.units * sh.mult); n += c.units; });
      S.coins += gain; S.sells += n; car.crates = []; H.mark(); return true;
    }
    return false;
  };

  /* ===== شكل الكراتين ===== */
  const cc = {};
  function addCrate(b, x, y, z, c) {
    b.box(x, y, z, 0.66, 0.36, 0.5, "#c9a06a"); b.box(x, y + 0.05, z + 0.26, 0.6, 0.04, 0.02, "#a97c50");
    b.sphere(x - 0.15, y + 0.36, z, 0.17, 0.12, 0.17, c, 5); b.sphere(x + 0.15, y + 0.36, z + 0.02, 0.17, 0.12, 0.17, c, 5); b.sphere(x, y + 0.4, z - 0.08, 0.15, 0.11, 0.15, c, 5);
  }
  const crateMesh = (c) => cc[c] || (cc[c] = (() => { const b = new Builder(); addCrate(b, 0, 0, 0, c); return b.build(R.gl); })());

  /* كراتين المخزن (جوا الهنقر): بتتبدّل لما يتغيّر اللي بالمخزن */
  const STK = { cx: -45, step: 0.74, rows: [-32.9, -32.25], cols: 14, max: 84 };
  let stMesh = null, stSig = "";
  function storageMesh() {
    const s = G().state(), list = [], C = G().CROPS;
    Object.keys(C).forEach((k) => { const n = Math.ceil((s.inv[k] || 0) / UNITS); for (let i = 0; i < n; i++) list.push(C[k].c); });
    const lst = list.slice(0, STK.max), sig = lst.join(",");
    if (sig !== stSig) {
      stSig = sig; if (stMesh) { R.free(stMesh); stMesh = null; }
      if (lst.length) { const b = new Builder(); lst.forEach((c, i) => { const col = i % STK.cols, row = Math.floor(i / STK.cols) % 2, layer = Math.floor(i / (STK.cols * 2)); addCrate(b, STK.cx + (col - (STK.cols - 1) / 2) * STK.step, 0.18 + layer * 0.4, STK.rows[row], c); }); stMesh = b.build(R.gl); }
    }
    return stMesh;
  }
  L.storedCrates = () => { const s = G().state(); return Object.keys(G().CROPS).reduce((n, k) => n + Math.ceil((s.inv[k] || 0) / UNITS), 0); };

  /* كراتين السيارات: صندوق البيك أب، وسقف باقي السيارات */
  function slot(kind, i, n) {
    const D = V().CARS[kind], Pp = D.shape, hl = Pp.len / 2, lift = Pp.lift || 0;
    if (Pp.bed) { const k = i % 6, row = Math.floor(k / 2), col = k % 2, layer = Math.floor(i / 6); return { x: col ? 0.42 : -0.42, y: 0.42 + lift + layer * 0.4, z: -hl + 0.48 + row * 0.56 }; }
    const rows = Math.ceil(n / 2), cf = hl - Pp.hood, cb = -hl + Pp.trunk, cz = (cf + cb) / 2, row = Math.floor(i / 2), col = i % 2;
    const y = Pp.open ? Pp.y1 - 0.08 + lift : Math.max(Pp.roof, Pp.y1 + 0.78) + 0.05 + lift;
    return { x: col ? 0.4 : -0.4, y, z: cz + (row - (rows - 1) / 2) * 0.56 };
  }
  const mm = new Float32Array(16);
  L.drawCar = (car, x, z, h) => {
    try {
      const cr = car.crates; if (!cr || !cr.length) return; const D = V().CARS[car.car]; if (!D) return;
      const n = Math.min(cr.length, D.cargo), s = Math.sin(h), co = Math.cos(h), C = G().CROPS;
      for (let i = 0; i < n; i++) { const p = slot(car.car, i, n); M.trs(x + p.x * co + p.z * s, p.y, z - p.x * s + p.z * co, h, 0, 0, 1, 1, 1, mm); R.draw(crateMesh(C[cr[i].crop].c), mm); }
    } catch (e) { /* ما نوقف الرسم */ }
  };
  L.room = (car) => capOfCar(car) - (car.crates || []).length;

  /* ===== المرآب: سقف وجدران وباب بيطلع وبينزل ===== */
  const GAR = { id: "S", cx: -16.4, cz: 21.1, d: 6.4, w: 7.4, lot: "S" };
  let doorMesh = null;
  L.build = (c) => {
    try {
      const { B, S, reg, label, col } = c;
      // رف خشبي تحت كراتين المخزن + رسم مواقف أمام الهنقر
      B.box(STK.cx, 0.1, (STK.rows[0] + STK.rows[1]) / 2, 11.2, 0.08, 1.7, "#a97c50"); B.box(STK.cx, 0.17, STK.rows[0] - 0.55, 11.2, 0.5, 0.1, "#8a5a3b");
      for (let i = 0; i < 3; i++) { B.box(-33.15, 0.1, -26.5 - i * 5.2 - 2.4, 0.1, 0.03, 0.1, "#f4f1e8"); B.box(-33.15, 0.1, -26.5 - i * 5.2 + 2.4, 0.1, 0.03, 0.1, "#f4f1e8"); }
      S.poi.barn = { x: -45, z: -30.2 };
      // مرآب سعدون
      const g = GAR, hx = g.d / 2, hz = g.w / 2, fx = g.cx + hx;
      B.box(g.cx, 0.04, g.cz, g.d + 1.0, 0.06, g.w + 0.8, "#5f6571");
      B.box(g.cx - hx + 0.15, 0, g.cz, 0.3, 3.0, g.w, "#e8dcc2");
      [-1, 1].forEach((s) => { B.box(g.cx, 0, g.cz + s * (hz - 0.15), g.d, 1.3, 0.3, "#e8dcc2"); B.box(fx - 0.2, 0, g.cz + s * (hz - 0.2), 0.4, 3.2, 0.4, "#8a6a4a"); });
      B.box(g.cx, 3.2, g.cz, g.d + 0.8, 0.3, g.w + 0.8, "#c0563a"); B.box(g.cx, 3.5, g.cz, g.d + 0.5, 0.12, g.w + 0.5, "#a64830");
      B.box(fx - 0.2, 2.9, g.cz, 0.4, 0.4, g.w, "#8a6a4a");
      B.box(fx + 0.05, 3.0, g.cz, 0.08, 0.5, 4.2, "#2f7d46");
      for (let z = g.cz - hz; z <= g.cz + hz + 0.01; z += 1.5) { col(g.cx - hx + 0.3, z, 0.5); }
      for (let x = g.cx - hx; x <= fx; x += 1.5) { col(x, g.cz - hz + 0.15, 0.5); col(x, g.cz + hz - 0.15, 0.5); }
      reg("garageS", g.cx, 1.6, g.cz, 5.2, fx + 2.5, g.cz + 0.5); S.poi.garageS = { x: fx + 2.5, z: g.cz + 0.5 };
      label("garageS", "🚚 مرآب سعدون", fx, 5.0, g.cz, { act: "garageS", max: 70 });
      label("barnstore", "📦 المخزن", STK.cx, 3.4, -32.6, { act: "barn", max: 45, cls: "sm" }); label("lotG", "🅿️ موقف المخزن", -31.8, 2.4, -29.2, { act: "barn", max: 30, cls: "sm" });
    } catch (e) { console.error("logi.build", e); }
  };

  // أبواب المرآب: بتفتح لما تقرب سيارة أو لاعب
  L.doors = [{ id: "S", x: GAR.cx + GAR.d / 2 - 0.1, z: GAR.cz, w: GAR.w - 0.6, h: 2.7, open: 0, last: 0 }];
  function doorM() {
    if (doorMesh) return doorMesh; const b = new Builder(), w = GAR.w - 0.6;
    b.box(0, 0, 0, 0.14, 2.75, w, "#dfe2e7"); for (let k = 1; k < 6; k++) b.box(0.08, k * 0.45, 0, 0.02, 0.05, w, "#9aa0aa");
    b.box(0.09, 0.06, 0, 0.03, 0.12, 1.2, "#6b7280");
    return (doorMesh = b.build(R.gl));
  }
  L.draw = (t) => {
    try {
      const sm = storageMesh(); if (sm) R.draw(sm);
      const c = W()._int, me = c.me, pa = c.pa, now = performance.now();
      L.doors.forEach((d) => {
        const dt = Math.min(0.1, (now - (d.last || now)) / 1000); d.last = now;
        const near = (o, r) => o && hy(o.x - d.x, o.z - d.z) < r;
        const want = near(me, me.veh ? 14 : 7) || (pa.vis && near(pa, pa.veh ? 14 : 7)) ? 1 : 0;
        d.open += (want - d.open) * Math.min(1, dt * 3.2);
        if (d.open < 0.97) { M.trs(d.x, d.open * 2.6, d.z, 0, 0, 0, 1, 1, 1, mm); R.draw(doorM(), mm); }
      });
    } catch (e) { /* ما نوقف الرسم */ }
  };

  /* ===== نوافذ ===== */
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${name}</b><small>${sub}</small></div><div class="ib">${btns || ""}</div></div>`;
  const coinBar = () => `<div class="coinbar">🪙 <b>${G().state().coins}</b></div>`;
  const crateIcons = (cr) => (cr || []).map((c) => (G().CROPS[c.crop] || {}).e || "📦").join("");
  const carName = (c) => `${V().CARS[c.car].e} ${V().CARS[c.car].n}`;
  const lotCars = (k) => V().owned().filter((c) => V().atOf(c) === k);
  const worth = (cr, shop) => { const day = G().today(), m = (SHOPS[shop] || SHOPS.s1).mult; return (cr || []).reduce((n, c) => n + Math.round(G().priceOf(c.crop, day) * c.units * m), 0); };

  const O = OSW.game && OSW.game.openers;
  if (O) {
    O.xbarn = () => {
      const s = G().state(), hand = G().carryOf(db().uid), cap = G().carryMax(), C = G().CROPS;
      const rows = Object.keys(C).filter((k) => (s.inv[k] || 0) > 0).map((k) => irow(C[k].e, C[k].n, `${s.inv[k]} وحدة ≈ ${Math.ceil(s.inv[k] / UNITS)} كراتين`,
        `<button class="btn sm gold" data-act="g-lg-take" data-k="${k}" data-n="1">📦 خذ 1</button><button class="btn sm alt" data-act="g-lg-take" data-k="${k}" data-n="3">خذ 3</button>`)).join("");
      const cars = lotCars("G").filter((c) => (c.crates || []).length).map((c) => irow("🚚", carName(c), `${crateIcons(c.crates)} · ${c.crates.length} كراتين`, `<button class="btn sm berry" data-act="g-lg-unload" data-id="${c.id}">⬇️ فرّغها بالمخزن</button>`)).join("");
      ui().openModal(`<h3>📦 مخزن المزرعة</h3>${coinBar()}
        <p class="hint">كراتينك بتتحط هون وبتشوفوها مرصوصة جوا الهنقر. خذ كراتين بإيدك، وروح للسيارة واضغط عليها لتحمّلها، وبعدين وصّلها لمرآب سعدون وبيعها 🚚</p>
        <div class="chk" style="margin:6px 0">🤲 بإيدك ${hand.length}/${cap} ${crateIcons(hand)} ${hand.length ? `<button class="btn sm alt" data-act="g-lg-stash">⬇️ حطها بالمخزن</button>` : ""}</div>
        <div class="items" style="margin:8px 0">${rows || '<div class="empty">المخزن فاضي… اقطفوا محصول وحطوه هون 🌾</div>'}</div>
        ${cars ? `<b>🚗 سيارات واقفة عند المخزن</b><div class="items" style="margin:6px 0">${cars}</div>` : `<p class="hint">ركّ السيارة أمام الهنقر عشان تفرّغ حمولتها هون.</p>`}
        <div class="row" style="margin-top:8px"><button class="btn alt sm" data-act="g-go" data-k="farm">🌾 المزرعة</button></div>`);
    };
    O.garageS = () => {
      const cars = lotCars("S"), C = G().CROPS, day = G().today();
      const rows = cars.map((c) => { const n = (c.crates || []).length; return irow("🚚", carName(c), n ? `${crateIcons(c.crates)} · ${n} كراتين` : "فاضية", n ? `<button class="btn sm gold" data-act="g-lg-sell" data-id="${c.id}">💰 بيع (${worth(c.crates, "s1")}🪙)</button>` : ""); }).join("");
      const board = Object.keys(C).map((k) => `<span class="tag">${C[k].e} ${G().priceOf(k, day)}🪙 ${G().trend(k, day)}</span>`).join(" ");
      ui().openModal(`<h3>🚚 مرآب سعدون</h3>${coinBar()}
        <p class="hint">ركّوا السيارة المحمّلة جوا المرآب (انزلوا منها هون)، وبعدين بيعوا الحمولة كاملة بسعر اليوم 💰</p>
        <div class="items" style="margin:8px 0">${rows || '<div class="empty">ما في سيارة بالمرآب. ركّ سيارتك هون 🚗</div>'}</div>
        <b>📈 أسعار اليوم</b><div class="chips" style="gap:6px;margin-top:6px">${board}</div>`);
    };
  }

  L.click = async (a, el) => {
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { toast("⚠️ " + esc(e.message)); } };
    switch (a) {
      case "g-lg-take": return busy(async () => {
        const hand = G().carryOf(db().uid); if (hand.length >= G().carryMax()) return toast("🤲 إيدك ممتلئة! حمّل السيارة أول", "", 2600);
        await G().do("unstash", { crop: d.k, n: +d.n || 1 }); sfx("pop"); toast("📦 أخذت كراتين من المخزن", "", 1600); P().open("xbarn");
      });
      case "g-lg-stash": return busy(async () => { await G().do("stash", {}); sfx("coin"); P().open("xbarn"); });
      case "g-lg-unload": return busy(async () => { await G().do("cunload", { id: d.id }); sfx("coin"); toast("⬇️ انحطّت الكراتين بالمخزن", "gold"); P().open("xbarn"); });
      case "g-lg-sell": return busy(async () => {
        const car = V().owned().find((c) => c.id === d.id); if (!car) return; const before = G().state().coins;
        await G().do("csell", { id: d.id, shop: "s1" }); const gain = G().state().coins - before; sfx("coin"); hearts("🪙", 10); toast(`💰 بعتوا الحمولة وربحتوا ${gain}🪙`, "gold", 4000); P().open("garageS");
      });
    }
  };

  // لما يركّ اللاعب السيارة: لو محمّلة عند مرآب سعدون بيفتح نافذة البيع
  L.onPark = (lot, car) => {
    try {
      if (!car || !(car.crates || []).length) return;
      if (lot === "S") setTimeout(() => OSW.app && OSW.app.goPlace("garageS"), 700);
      else if (lot === "G") toast("📦 اضغطوا عالمخزن لتفريغ الحمولة", "", 3500);
    } catch (e) { /* */ }
  };
})();
