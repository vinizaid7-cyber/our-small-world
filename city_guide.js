/* حياة المدينة + تصاميم البيت (V11): زيارة مطاعم وفنادق ومتاجر، حفظ/تحميل تصاميم الغرف، تفريغ الغرف، وتلوين الأثاث. */
(function () {
  const OSW = window.OSW, G = OSW.game, A = OSW.act, esc = OSW.esc, MIN = 60000;
  const ui = () => OSW.ui, db = () => OSW.ui.db;
  /* قطع الأثاث الجديدة لازم تنسجّل كأغراض بالسوق (game.js بنى القائمة قبل ما تتحمّل furniture2.js) */
  Object.keys(OSW.FURN).forEach((k) => { if (!G.ITEM["fu_" + k]) G.ITEM["fu_" + k] = { n: OSW.FURN[k].n, e: OSW.FURN[k].e, price: OSW.FURN[k].price, furn: 1 }; });
  const CITY = (OSW.CITY = {
    shami: { k: "rest", n: "مطعم الشام", e: "🥙", cost: 45, food: 45, drink: 25, note: "شاورما وحمص ومقبلات" },
    napoli: { k: "rest", n: "بيتزا نابولي", e: "🍕", cost: 60, food: 55, drink: 25, note: "بيتزا على الحطب" },
    grill: { k: "rest", n: "مشاوي الأصيل", e: "🍖", cost: 85, food: 80, drink: 30, note: "مشاوي مشكّلة وسلطات" },
    cafe: { k: "rest", n: "كافيه الورد", e: "☕", cost: 30, food: 20, drink: 55, note: "قهوة وكيك وجلسة هادية" },
    palm: { k: "hotel", n: "فندق النخيل ⭐⭐⭐", e: "🏨", cost: 150, food: 40, drink: 40, note: "ليلة بسيطة مريحة · كل 5 ليالي هدية" },
    palace: { k: "hotel", n: "قصر الجزيرة ⭐⭐⭐⭐⭐", e: "🏰", cost: 320, food: 70, drink: 70, note: "جناح ملكي وإفطار · كل 3 ليالي هدية" },
  });
  const CARDS = ["شو أحلى ذكرى بيناتنا هالسنة؟ 💞", "لو نسافر بكرا، وين بدك نروح؟ ✈️", "شو الشي اللي بتحبه فيّ وما قلتلي؟ 🥰", "شو حلمك الكبير اللي بدك نحققه سوا؟ 🌟", "اختار أغنية لعلاقتنا 🎵", "شو أول انطباع إلك عني؟ 👀", "لو عندنا يوم فاضي بالكامل، شو بنعمل؟ ☀️", "شو الشي اللي بيضحكك لما بتتذكره عنا؟ 😂", "شو الأكلة اللي بتذكّرك فيني؟ 🍽️", "وين بتشوفنا بعد 5 سنين؟ 🏡"];
  const left = (ms) => { const m = Math.ceil(ms / MIN); return m >= 60 ? Math.floor(m / 60) + "س " + (m % 60) + "د" : m + "د"; };
  /* ---- fold ---- */
  const A2 = OSW.act2, prev = A2.fold;
  A2.fold = (ty, e, d, t, a, day, S, H) => {
    if (ty !== "act_city") return prev(ty, e, d, t, a, day, S, H);
    const V = CITY[d.v]; if (!V || S.coins < V.cost) return true; const at = (S.cityAt = S.cityAt || {}), k = a + ":" + d.v; if ((at[k] || 0) > t - 90 * MIN) return true;
    at[k] = t; S.coins -= V.cost; const targets = Object.keys(S.need).concat(S.need[a] ? [] : [a]);
    targets.forEach((u) => { const n = S.need[u] || (S.need[u] = { food: 100, drink: 100, t, sip: 0 }), dt = Math.max(0, t - n.t); n.food = Math.max(0, n.food - (dt * 100) / (8 * 3600000)); n.drink = Math.max(0, n.drink - (dt * 100) / (5 * 3600000)); n.t = Math.max(n.t, t); n.food = Math.min(100, n.food + V.food); n.drink = Math.min(100, n.drink + V.drink); });
    S.cityN = (S.cityN || 0) + 1; const vis = (S.cityVis = S.cityVis || {}), vv = (vis[d.v] = vis[d.v] || {}); vv[a] = t;
    if (Object.keys(vv).some((u) => u !== a && t - vv[u] < 40 * MIN) && !vv.paid) { vv.paid = 1; S.coins += 25; S.dates = (S.dates || 0) + 1; }
    if (V.k === "hotel") { const st = (S.stays = (S.stays || 0) + 1); if (d.v === "palace" && st % 3 === 0) H.add("fu_bedRound", 1); if (d.v === "palm" && st % 5 === 0) H.add("fu_vanity", 1); }
    H.mark(); return true;
  };
  /* ---- دليل المدينة ---- */
  G.openers.city = () => {
    const s = G.state(), now = Date.now(), at = s.cityAt || {}, me = db().uid, msg = G.ui.cityMsg; G.ui.cityMsg = null;
    const row = ([id, v]) => { const w = Math.max(0, (at[me + ":" + id] || 0) + 90 * MIN - now), dis = s.coins < v.cost || w > 0; return `<div class="irow"><span class="ie">${v.e}</span><div class="iname"><b>${v.n}</b><small>${v.note} · 🍞+${v.food} 💧+${v.drink} للاثنين${w > 0 ? " · ⏳ " + left(w) : ""}</small></div><div class="ib"><button class="btn sm gold" data-act="g-des-visit" data-v="${id}" ${dis ? "disabled" : ""}>${v.cost}🪙</button></div></div>`; };
    const E = Object.entries(CITY), shops = [["shop", "🏪", "سعدون: أكل ومستلزمات"], ["boutique", "👗", "محل الأناقة: ملابس وأحذية وشنط"], ["furniture", "🛋️", "معرض الأثاث"], ["flowers", "💐", "محل الورد والهدايا"], ["butcher", "🥩", "الجزّار"]];
    ui().openModal(`<h3>🏙️ دليل المدينة</h3><div class="coinbar">🪙 <b>${s.coins}</b></div>${msg ? `<div class="pick" style="font-size:16px;margin:6px 0">${msg}</div>` : ""}<p class="hint">اطلعوا موعد! الزيارة بتشبّع وبتروّي الاثنين، ولو زرتوا نفس المكان خلال 40 دقيقة بتاخدوا مكافأة موعد 💞 (+25🪙). عدد المواعيد: ${s.dates || 0} · ليالي الفنادق: ${s.stays || 0}</p>
      <b>🍽️ مطاعم</b><div class="items" style="margin:6px 0 10px">${E.filter(([, v]) => v.k === "rest").map(row).join("")}</div><b>🏨 فنادق</b><div class="items" style="margin:6px 0 10px">${E.filter(([, v]) => v.k === "hotel").map(row).join("")}</div>
      <b>🛍️ متاجر</b><div class="items" style="margin:6px 0">${shops.map(([id, e, n]) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${n}</b></div><div class="ib"><button class="btn sm alt" data-act="g-des-go" data-k="${id}">زوروا</button></div></div>`).join("")}</div><button class="btn alt sm" data-act="g-des-go" data-k="hub">↩️ الأنشطة</button>`);
  };
  /* ---- تصاميم البيت ---- */
  G.openers.designs = () => {
    const s = G.state(), R = A.R(), lay = Object.keys(R.layouts), rooms = Object.values(OSW.HOME.byId), furn = Object.values(s.furn);
    const inRoom = (r) => furn.filter((f) => f.x >= r.x0 && f.x < r.x1 && f.z >= r.z0 && f.z < r.z1).length;
    const counts = (OSW.FURN_CATS || []).filter(([c]) => c !== "music" && c !== "study").map(([c, n]) => `${n.split(" ")[0]} ${OSW.FURN_COUNT ? OSW.FURN_COUNT(c) : ""}`).join(" · ");
    const list = furn.slice(0, 40).map((f) => { const it = OSW.FURN[f.item]; return `<div class="irow" style="flex-direction:column;align-items:stretch;gap:4px"><div><b>${it.e} ${it.n}</b> <small>${f.tint ? "🎨" : ""}</small></div><div class="two" style="flex-wrap:wrap">${(OSW.FURN_TINTS || []).map((c) => `<button data-act="g-des-tint" data-i="${f.id}" data-c="${c}" style="width:26px;height:26px;border-radius:50%;border:2px solid ${f.tint === c ? "#fff" : "#0003"};background:${c}"></button>`).join("")}<button class="btn sm alt" data-act="g-des-tint" data-i="${f.id}" data-c="">↺</button></div></div>`; }).join("");
    ui().openModal(`<h3>🛋️ تصاميم البيت</h3><div class="coinbar">🪙 <b>${s.coins}</b></div><p class="hint">بيتكم 14 غرفة، والمعرض فيه ${(OSW.FURN_IDS || []).length} قطعة بشكل مختلف: ${counts}. اشتروا من «معرض الأثاث» وحطّوا القطع جوّا بيتكم.</p>
      <b>💾 احفظ تصميم البيت كامل</b><div class="row" style="gap:6px;margin:6px 0 10px"><input class="in" id="layName" maxlength="20" placeholder="اسم التصميم" style="flex:1"><button class="btn sm gold" data-act="g-des-save">حفظ</button></div>
      <b>📁 تصاميمكم المحفوظة (${lay.length}/12)</b><div class="items" style="margin:6px 0 10px">${lay.map((n) => `<div class="irow"><span class="ie">🏠</span><div class="iname"><b>${esc(n)}</b><small>${R.layouts[n].length} قطعة</small></div><div class="ib"><button class="btn sm gold" data-act="g-des-load" data-n="${esc(n)}">طبّق</button><button class="btn sm alt" data-act="g-des-del" data-n="${esc(n)}">🗑️</button></div></div>`).join("") || '<div class="empty">لسا ما حفظتوا تصميم</div>'}</div>
      <p class="hint">«طبّق» بيرجّع كل القطع الحالية للمخزن وبيرتّب التصميم المحفوظ باللي عندكم من قطع (القطع الناقصة بتنتخطى).</p>
      <b>🧹 تفريغ غرفة</b><div class="items" style="margin:6px 0 10px">${rooms.map((r) => `<div class="irow"><span class="ie">${r.emoji}</span><div class="iname"><b>${esc(r.name)}</b><small>${inRoom(r)} قطعة</small></div><div class="ib"><button class="btn sm alt" data-act="g-des-clear" data-r="${r.id}" ${inRoom(r) ? "" : "disabled"}>فضّي</button></div></div>`).join("")}</div>
      <b>🎨 تلوين الأثاث (15🪙)</b><div class="items" style="margin:6px 0">${list || '<div class="empty">ما في أثاث موضوع بالبيت</div>'}</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn alt sm" data-act="g-des-go" data-k="furniture">🛋️ معرض الأثاث</button><button class="btn alt sm" data-act="g-des-go" data-k="hub">↩️ الأنشطة</button></div>`);
  };
  const base = G.click;
  G.click = (a, el) => {
    if (a.indexOf("g-des-") !== 0) return base(a, el);
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { ui().toast("⚠️ " + esc(e.message)); } };
    switch (a) {
      case "g-des-go": ui().closeModal(); return OSW.app.goPlace(d.k);
      case "g-des-visit": return busy(async () => { await A.send("act_city", { v: d.v }); OSW.audio.sfx("fanfare"); ui().hearts(CITY[d.v].e, 10); G.ui.cityMsg = `${CITY[d.v].e} ${CITY[d.v].n} — سؤال الموعد:<br><b>${CARDS[A.hash(d.v + Date.now() / 3.6e6 | 0) % CARDS.length]}</b>`; OSW.places.open("city"); });
      case "g-des-save": return busy(async () => { const n = ((document.getElementById("layName") || {}).value || "").trim(); if (!n) return ui().toast("اكتب اسم للتصميم"); await A.send("layout_save", { name: n }); ui().toast("💾 انحفظ التصميم"); OSW.places.open("designs"); });
      case "g-des-load": return busy(async () => { await A.send("layout_load", { name: d.n }); G.sync3d(); OSW.audio.sfx("magic"); ui().toast("🏠 انطبّق التصميم"); OSW.places.open("designs"); });
      case "g-des-del": return busy(async () => { await A.send("layout_del", { name: d.n }); OSW.places.open("designs"); });
      case "g-des-clear": return busy(async () => { await A.send("furn_clear", { room: d.r }); G.sync3d(); OSW.places.open("designs"); });
      case "g-des-tint": return busy(async () => { if (G.state().coins < 15) return ui().toast("🪙 التلوين 15"); await A.send("furn_tint", { inst: d.i, tint: d.c || null }); G.sync3d(); OSW.audio.sfx("pop"); OSW.places.open("designs"); });
    }
  };
})();
