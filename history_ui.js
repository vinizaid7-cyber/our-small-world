/* ============================================================
   عالمنا الصغير V14 — واجهات التاريخ والحرف والآثار والمتحف والشخصيات
   ============================================================ */
(function () {
  const OSW = window.OSW, esc = OSW.esc, hy = Math.hypot;
  const H = (OSW.HIST = OSW.history = OSW.history || {});
  const G = () => OSW.game, UI = () => OSW.ui, DB = () => OSW.ui.db, W = () => OSW.world;

  const fmtTime = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60), r = s % 60;
    return m ? `${m}د ${r}ث` : `${r}ث`;
  };

  function tabs(cur) {
    const ev = H.activeEvent(), hs = H.ensureState(G().state()), era = H.ERAS[hs.era] || H.ERAS.islamic;
    const list = [
      ["hist_atlas", "🗺️", "الأطلس"],
      ["hist_eras", "⏳", "العصور"],
      ["hist_crafts", "⚒️", "المهن"],
      ["hist_market", "⚖️", "السوق"],
      ["hist_arch", "⛏️", "التنقيب"],
      ["hist_puzzles", "🧩", "الألغاز"],
      ["hist_museum", "🏛️", "المتحف"],
      ["hist_npcs", "🧑‍🤝‍🧑", "السكان"],
      ["hist_caravans", "🐪", "القوافل"],
      ["hist_monuments", "🏗️", "المعالم"]
    ];
    return `<div class="hst-top">
      <div class="hst-ev"><span>${ev.e} <b>${esc(ev.n)}</b></span><small>${esc(ev.bonus)}</small></div>
      <div class="hst-era-tag">${era.e} ${esc(era.n)} · 🪙 ${G().state().coins}</div>
    </div>
    <div class="vchips hst-tabs">${list.map(([k, e, n]) => `<button class="vchip ${cur === k ? "on" : ""}" data-act="g-hst-tab" data-t="${k}">${e} ${n}</button>`).join("")}</div>`;
  }

  const opener = {};

  opener.hist_atlas = () => {
    const s = G().state(), hs = H.ensureState(s), bc = H.badgeCount();
    const curZ = (W() && W().S && W().S.ready && H.zoneOf(W().getMe().x, W().getMe().z)) || null;
    const zCards = Object.keys(H.ZONES).map((k) => {
      const z = H.ZONES[k];
      return `<button class="hst-zbtn ${curZ === k ? "on" : ""}" data-act="g-hst-go" data-z="${k}"><b>${z.e} ${esc(z.n)}</b><small>${curZ === k ? "أنتم هنا الآن" : "انتقال مباشر"}</small></button>`;
    }).join("");
    const mOwned = Object.keys(H.MOUNTS).map((k) => {
      const m = H.MOUNTS[k], has = !!hs.mounts[k], on = hs.mountOn[DB().uid] === k;
      return `<div class="irow"><span>${m.e}</span><div><b>${esc(m.n)}</b><small>${esc(m.note)}</small></div>${has ? `<button class="btn sm ${on ? "berry" : "gold"}" data-act="g-hst-mount" data-id="${on ? "" : k}">${on ? "نزول" : "امتطاء"}</button>` : `<button class="btn sm gold" data-act="g-hst-mbuy" data-id="${k}" ${s.coins < m.price ? "disabled" : ""}>${m.price}🪙</button>`}</div>`;
    }).join("");
    UI().openModal(`<h3>🏛️ التاريخ الحي — عالمنا الصغير V14</h3>${tabs("hist_atlas")}
      ${bc ? `<div class="hst-alert">✨ لديكم <b>${bc}</b> إشعارات جاهزة في القوافل أو المتحف أو الترميم!</div>` : ""}
      <div class="hst-prof-box" style="margin-bottom:10px">
        <div><b>📦 تحميل ملفات اللعبة للتعديل</b><small>حزمة المصدر الكاملة (HTML / JS / CSS) بصيغة ZIP</small></div>
        <a class="btn sm gold" href="/Our-Small-World-V14.zip" download="Our-Small-World-V14.zip" style="text-decoration:none">⬇️ تحميل اللعبة (ZIP)</a>
      </div>
      <b>🧭 السفر السريع عبر القارة التاريخية</b>
      <div class="hst-zgrid">${zCards}
        <button class="hst-zbtn" data-act="g-hst-go" data-z="village"><b>🏡 القرية الرئيسية</b><small>العودة للبيت والقرية</small></button>
        <button class="hst-zbtn" data-act="g-hst-go" data-z="bigcity"><b>🏙️ المدينة الكبرى</b><small>الفندق والمجمّع</small></button>
      </div>
      <div class="sep"></div>
      <b>🐪 الدواب والمركبات التاريخية (للسرعة وحمل القوافل)</b>
      <div class="items">${mOwned}</div>`);
  };

  opener.hist_eras = () => {
    const hs = H.ensureState(G().state());
    const cards = H.ERA_ORDER.map((k) => {
      const E = H.ERAS[k], active = hs.era === k;
      return `<div class="hst-era-card ${active ? "on" : ""}" style="--ec:${E.accent}">
        <div class="hst-eh"><b>${E.e} ${esc(E.n)}</b><small>${esc(E.years)}</small></div>
        <p>${esc(E.lore)}</p>
        <div class="hst-emeta">
          <span>🏛️ ${esc(E.arch)}</span>
          <span>🐪 ${esc(E.transport)}</span>
          <span>🌾 ${esc(E.food)}</span>
          <span>⚒️ ${esc(E.crafts)}</span>
        </div>
        <div class="row" style="margin-top:8px">
          ${active ? `<span class="btn sm alt" style="pointer-events:none">✓ العصر النشط حالياً</span>` : `<button class="btn sm gold" data-act="g-hst-era" data-id="${k}">اعتماد أجواء وموسيقى هذا العصر</button>`}
        </div>
      </div>`;
    }).join("");
    UI().openModal(`<h3>⏳ موسوعة العصور والحضارات</h3>${tabs("hist_eras")}
      <p class="hint">كل منطقة أثرية مصممة وفق عصرها دون خلط عشوائي، ويمكنكم تفعيل طابع وموسيقى أي عصر هنا (أو ارتداء أزيائه من الخزانة 👗).</p>
      <div class="hst-list">${cards}</div>`);
  };

  opener.hist_crafts = () => {
    const hs = H.ensureState(G().state()), ev = H.activeEvent();
    const curP = H.openProf && H.PROFS[H.openProf] ? H.openProf : "blacksmith";
    const prof = H.PROFS[curP], xp = hs.profXp[curP] || 0, lvl = H.profLevel(xp), nxt = lvl * 80;
    const pChips = Object.values(H.PROFS).map((p) => `<button class="vchip ${p.id === curP ? "on" : ""}" data-act="g-hst-prof" data-id="${p.id}">${p.e} ${esc(p.n)}</button>`).join("");
    const recHtml = prof.recipes.map((r) => {
      const ok = Object.keys(r.mats).every((mk) => (hs.mats[mk] || 0) >= r.mats[mk]);
      const reqStr = Object.keys(r.mats).map((mk) => `${H.MATS[mk].e} ${H.MATS[mk].n} (${hs.mats[mk] || 0}/${r.mats[mk]})`).join(" · ");
      const mkt = H.craftPrice(r.id);
      return `<div class="irow">
        <span>${r.e}</span>
        <div><b>${esc(r.n)} (لديكم: ${hs.crafts[r.id] || 0})</b><small>${esc(reqStr)}<br>قيمة السوق اليوم: ${mkt}🪙 · +${Math.round(r.xp * (ev.xpMul || 1))} خبرة</small></div>
        <button class="btn sm ${ok ? "gold" : "alt"}" data-act="g-hst-craft" data-id="${r.id}" ${ok ? "" : "disabled"}>صناعة ⚒️</button>
      </div>`;
    }).join("");
    UI().openModal(`<h3>⚒️ المهن والحرف التاريخية</h3>${tabs("hist_crafts")}
      <div class="vchips">${pChips}</div>
      <div class="hst-prof-box">
        <div><b>${prof.e} ${esc(prof.n)} — المستوى ${lvl}</b><small>${esc(prof.building)} · ${esc(prof.desc)}</small></div>
        <div><small>الخبرة: ${xp}/${nxt} (+${Math.min(35, (lvl - 1) * 5)}% زيادة بيع)</small></div>
      </div>
      <div class="items">${recHtml}</div>`);
  };

  opener.hist_market = () => {
    const s = G().state(), hs = H.ensureState(s), ev = H.activeEvent(), day = H.dayOf();
    const matsHtml = Object.keys(H.MATS).map((k) => {
      const m = H.MATS[k], unit = Math.max(1, Math.round(m.price * (ev.matDiscount || 1)));
      return `<div class="irow"><span>${m.e}</span><div><b>${esc(m.n)} (المخزون: ${hs.mats[k] || 0})</b><small>${unit}🪙 للقطعة ${ev.matDiscount ? "(خصم القافلة 20%)" : ""}</small></div>
        <div class="row"><button class="btn sm gold" data-act="g-hst-bmat" data-id="${k}" data-q="1" ${s.coins < unit ? "disabled" : ""}>×1</button>
        <button class="btn sm alt" data-act="g-hst-bmat" data-id="${k}" data-q="5" ${s.coins < unit * 5 ? "disabled" : ""}>×5</button></div></div>`;
    }).join("");
    const ownedCrafts = Object.keys(hs.crafts || {}).filter((k) => hs.crafts[k] > 0 && H.CRAFT_BY_ID[k]);
    const sellHtml = ownedCrafts.map((k) => {
      const r = H.CRAFT_BY_ID[k], lvl = H.profLevel(hs.profXp[r.prof] || 0);
      const mul = H.marketMul(k, day), unit = Math.round(H.craftPrice(k, day) * (1 + Math.min(0.35, (lvl - 1) * 0.05)) * (ev.craftBonus || 1));
      return `<div class="irow"><span>${r.e}</span><div><b>${esc(r.n)} ×${hs.crafts[k]}</b><small>سعر اليوم: ${unit}🪙 (طلب ${Math.round(mul * 100)}%)</small></div>
        <button class="btn sm berry" data-act="g-hst-sell" data-id="${k}" data-q="${hs.crafts[k]}">بيع الكل (+${unit * hs.crafts[k]}🪙)</button></div>`;
    }).join("");
    UI().openModal(`<h3>⚖️ سوق المواد الخام والمنتجات</h3>${tabs("hist_market")}
      <b>🏺 بيع تحف الحرفيين (الأسعار تتغير يومياً)</b>
      <div class="items">${sellHtml || '<div class="empty">لا تملكون منتجات حرفية جاهزة بعد — اصنعوها من تبويب «المهن»!</div>'}</div>
      <div class="sep"></div>
      <b>🪵 شراء المواد الخام للتصنيع والترميم وبناء المعالم</b>
      <div class="items">${matsHtml}</div>`);
  };

  opener.hist_arch = () => {
    const s = G().state(), hs = H.ensureState(s), ev = H.activeEvent(), now = Date.now();
    const eq = H.getEquippedTool(hs), odds = H.rarityOdds(eq, hs, ev);
    const me = W() && W().getMe ? W().getMe() : { x: 0, z: 0 };
    const probe = H.probeTerrain(me.x, me.z, hs, now);
    const tHtml = Object.values(H.DIG_TOOLS).map((tl) => {
      const uses = hs.tools[tl.id] || 0, isEq = eq === tl.id && uses > 0;
      return `<div class="irow"><span>${tl.e}</span><div><b>${esc(tl.n)} (المتبقي: ${uses})</b><small>${esc(tl.note)}</small></div>
        <div class="row">
          ${uses > 0 ? `<button class="btn sm ${isEq ? "berry" : "alt"}" data-act="g-hst-equip" data-id="${tl.id}">${isEq ? "✓ مجهزة" : "تجهيز"}</button>` : ""}
          <button class="btn sm gold" data-act="g-hst-tool" data-id="${tl.id}" ${s.coins < tl.price ? "disabled" : ""}>+${tl.uses} (${tl.price}🪙)</button>
        </div></div>`;
    }).join("");

    const spotCd = Math.round(120000 * (ev.digFast || 1));
    const hasAnyTool = Object.values(hs.tools || {}).some((v) => v > 0);
    const spotsHtml = (H.BURIED_SPOTS || []).map((sp) => {
      const E = H.ERAS[sp.era], st = (hs.spots && hs.spots[sp.id]) || { digs: 0, coolAt: 0 };
      const wait = st.coolAt ? Math.max(0, spotCd - (now - st.coolAt)) : 0;
      const dist = Math.round(hy(sp.x - me.x, sp.z - me.z));
      const canSpot = wait === 0 && hasAnyTool;
      return `<div class="hst-site-card">
        <div class="hst-eh"><b>${sp.e} ${esc(sp.n)}</b><small>${E.e} ${esc(E.n)} · ${dist}م</small></div>
        <p>${esc(sp.hint)} · العمق: ${st.digs || 0}/${sp.depth}</p>
        <div class="hst-bar"><i style="width:${Math.round(((st.digs || 0) / sp.depth) * 100)}%"></i></div>
        <div class="row" style="justify-content:space-between;margin-top:8px">
          <button class="btn sm alt" data-act="g-hst-gospot" data-spot="${sp.id}">🧭 انتقال للموقع</button>
          <button class="btn sm ${canSpot ? "berry" : "alt"}" data-act="g-hst-digspot" data-spot="${sp.id}" ${canSpot ? "" : "disabled"}>${wait ? "⏳ " + fmtTime(wait) : hasAnyTool ? `⛏️ احفر (${st.digs || 0}/${sp.depth})` : "يلزم أداة"}</button>
        </div>
      </div>`;
    }).join("");

    const cd = Math.round(60000 * (ev.digFast || 1));
    const sHtml = Object.values(H.SITES).map((st) => {
      const E = H.ERAS[st.era], last = hs.digAt[st.id] || 0, wait = Math.max(0, cd - (now - last));
      const reqTool = H.DIG_TOOLS[st.tool], hasReq = (hs.tools[st.tool] || 0) > 0, hasAst = (hs.tools.astrolabe || 0) > 0;
      const canDig = wait === 0 && (hasReq || hasAst);
      const pzDone = !!hs.puzzles[st.puzzle];
      return `<div class="hst-site-card ${H.openSite === st.id ? "on" : ""}">
        <div class="hst-eh"><b>${st.e} ${esc(st.n)}</b><small>${E.e} ${esc(E.n)}</small></div>
        <p>${esc(st.desc)}</p>
        <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">
          <small>الأداة: ${reqTool.e} ${esc(reqTool.n)}</small>
          <div class="row">
            <button class="btn sm ${canDig ? "berry" : "alt"}" data-act="g-hst-dig" data-site="${st.id}" data-tool="${hasAst ? "astrolabe" : st.tool}" ${canDig ? "" : "disabled"}>${wait ? "⏳ " + fmtTime(wait) : hasReq || hasAst ? "⛏️ نقّب الآن" : "يلزم أداة"}</button>
            <button class="btn sm ${pzDone ? "alt" : "gold"}" data-act="g-hst-openpz" data-id="${st.puzzle}">${pzDone ? "✓ تم حل اللغز" : "🧩 اللغز"}</button>
          </div>
        </div>
      </div>`;
    }).join("");
    UI().openModal(`<h3>⛏️ بعثة الآثار والتنقيب</h3>${tabs("hist_arch")}
      <div class="hst-prof-box">
        <div>
          <b>🧭 رادار الآثار المدفونة تحت التضاريس</b>
          <small>${probe ? `أقرب كنز مدفون: ${probe.spot.e} ${esc(probe.spot.n)} على بُعد <b>${Math.round(probe.dist)}م</b>` : "كل الكنوز المدفونة قيد التجدد حالياً"}</small>
          <small>نِسَب الندرة (${H.DIG_TOOLS[eq].e} ${esc(H.DIG_TOOLS[eq].n)}): عادي ${odds.common}% · نادر ${odds.rare}% · ملحمي ${odds.epic}% · أسطوري ${odds.legendary}%</small>
        </div>
        ${probe ? `<button class="btn sm gold" data-act="g-hst-gospot" data-spot="${probe.spot.id}">📍 توجّه للأقرب</button>` : ""}
      </div>
      <b>🧰 أدوات التنقيب الأثرية</b>
      <div class="items">${tHtml}</div>
      <div class="sep"></div>
      <b>🌍 الكنوز المخفية تحت تضاريس العالم (اضغط التراب في 3D أو احفر هنا)</b>
      <div class="hst-list">${spotsHtml}</div>
      <div class="sep"></div>
      <b>🗺️ المواقع الأثرية الستة (مفصولة حسب العصور)</b>
      <div class="hst-list">${sHtml}</div>`);
  };

  opener.hist_puzzles = () => {
    const hs = H.ensureState(G().state());
    const pzList = Object.values(H.PUZZLES).map((pz) => {
      const done = !!hs.puzzles[pz.id], art = H.ARTIFACTS[pz.rewardArt];
      if (done) {
        return `<div class="hst-site-card"><b>${pz.e} ${esc(pz.n)} — ✓ تم حلها!</b><small>المكافأة: +${pz.rewardCoins}🪙 و ${art.e} ${esc(art.n)}</small></div>`;
      }
      return `<div class="hst-site-card">
        <b>${pz.e} ${esc(pz.n)}</b>
        <p style="margin:6px 0">${esc(pz.q)}</p>
        <div class="hst-pz-opts">${pz.opts.map((opt, idx) => `<button class="btn sm alt" data-act="g-hst-pz" data-id="${pz.id}" data-ans="${idx}">${esc(opt)}</button>`).join("")}</div>
      </div>`;
    }).join("");
    UI().openModal(`<h3>🧩 الألغاز التاريخية والشيفرات السرية</h3>${tabs("hist_puzzles")}
      <p class="hint">حلّوا الألغاز في كل موقع أثري أو من أرشيف بيت الحكمة لفتح الغرف السرية والحصول على تحف نادرة!</p>
      <div class="hst-list">${pzList}</div>`);
  };

  opener.hist_museum = () => {
    const s = G().state(), hs = H.ensureState(s), day = H.dayOf();
    const rawList = Object.keys(hs.rawArt || {}).filter((k) => hs.rawArt[k] > 0);
    const resList = Object.keys(hs.restoredArt || {}).filter((k) => hs.restoredArt[k] > 0);
    const inc = H.museumIncome(hs), claimed = hs.museumClaimDay === day;

    const rawHtml = rawList.map((k) => {
      const A = H.ARTIFACTS[k], Rr = H.RARITY[A.rarity];
      const matsOk = Object.keys(A.restoreMats || {}).every((mk) => (hs.mats[mk] || 0) >= A.restoreMats[mk]);
      const ok = s.coins >= A.restoreCoins && matsOk;
      const reqStr = `${A.restoreCoins}🪙` + Object.keys(A.restoreMats || {}).map((mk) => ` + ${H.MATS[mk].e}${A.restoreMats[mk]}`).join("");
      return `<div class="irow"><span>${A.e}</span><div><b>${esc(A.n)} ×${hs.rawArt[k]}</b><small style="color:${Rr.c}">[${esc(Rr.n)}] · كلفة الترميم: ${esc(reqStr)}</small></div>
        <button class="btn sm ${ok ? "gold" : "alt"}" data-act="g-hst-restore" data-id="${k}" ${ok ? "" : "disabled"}>ترميم ✨</button></div>`;
    }).join("");

    const resHtml = resList.map((k) => {
      const A = H.ARTIFACTS[k], Rr = H.RARITY[A.rarity], onShow = hs.exhibited.includes(k);
      return `<div class="irow"><span>${A.e}</span><div><b>${esc(A.n)}</b><small style="color:${Rr.c}">[${esc(Rr.n)}] · دخل يومي: +${A.income}🪙<br>${esc(A.desc)}</small></div>
        <button class="btn sm ${onShow ? "berry" : "gold"}" data-act="g-hst-exhibit" data-id="${k}">${onShow ? "إزالة من العرض" : hs.exhibited.length >= 12 ? "ممتلئ" : "عرض بالمتحف"}</button></div>`;
    }).join("");

    const rs = hs.rarityStats || {};
    const rarityBar = Object.keys(H.RARITY).map((rk) => {
      const r = H.RARITY[rk];
      return `<span style="color:${r.c};font-weight:700">${esc(r.n)}: ${rs[rk] || 0}</span>`;
    }).join(" · ");

    UI().openModal(`<h3>🏛️ المتحف الخاص والترميم</h3>${tabs("hist_museum")}
      <div class="hst-prof-box">
        <div>
          <b>🏛️ صالة العرض: ${hs.exhibited.length} / 12 تحفة معروضة</b>
          <small>الدخل الثقافي اليومي للمتحف: ${inc}🪙 يومياً (تُعرض تلقائياً داخل مبنى المتحف 3D!)</small>
          <small>📊 سجل الندرة: ${rarityBar}</small>
        </div>
        <button class="btn sm ${inc > 0 && !claimed ? "gold" : "alt"}" data-act="g-hst-mclaim" ${inc <= 0 || claimed ? "disabled" : ""}>${claimed ? "✓ استُلم اليوم" : `تحصيل ${inc}🪙`}</button>
      </div>
      <b>🛠️ مختبر ترميم الآثار المكتشفة</b>
      <div class="items">${rawHtml || '<div class="empty">لا توجد قطع خام بانتظار الترميم — نقّبوا في المواقع الأثرية أو احفروا التضاريس!</div>'}</div>
      <div class="sep"></div>
      <b>✨ القطع المرممة ومعروضات المتحف (${resList.length} / ${Object.keys(H.ARTIFACTS).length})</b>
      <div class="items">${resHtml || '<div class="empty">رمّموا أول قطعة أثرية لعرضها على منصات المتحف.</div>'}</div>`);
  };

  opener.hist_npcs = () => {
    const hs = H.ensureState(G().state());
    const phase = W() && W().period ? W().period() : "morning";
    const pName = { dawn: "الفجر", morning: "الصباح", afternoon: "الظهيرة", noon: "الظهر", evening: "المساء", night: "الليل" }[phase] || phase;
    const html = H.NPCS.map((n) => {
      const q = n.quest, done = q && hs.quests[q.id], hasMat = q && (hs.mats[q.needMat] || 0) >= q.qty;
      const aff = hs.affinity[n.id] || 0;
      return `<div class="hst-site-card">
        <div class="hst-eh"><b>${n.emoji} ${esc(n.name)}</b><small>🏠 ${esc(n.homeName)} · 💞 مودة: ${aff}</small></div>
        <p style="margin:4px 0;font-size:.9em">💬 «${esc(n.lines[0])}» · <small>الوقت الحالي: ${pName}</small></p>
        ${q ? `<div class="row" style="justify-content:space-between;align-items:center;margin-top:6px">
          <small>📜 <b>${esc(q.title)}:</b> ${esc(q.desc)} (${hs.mats[q.needMat] || 0}/${q.qty})</small>
          ${done ? `<span class="btn sm alt" style="pointer-events:none">✓ مُنجزة</span>` : `<button class="btn sm ${hasMat ? "gold" : "alt"}" data-act="g-hst-quest" data-id="${q.id}" ${hasMat ? "" : "disabled"}>تسليم (+${q.coins}🪙)</button>`}
        </div>` : ""}
      </div>`;
    }).join("");
    UI().openModal(`<h3>🧑‍🤝‍🧑 سكان دار السلام والمهام</h3>${tabs("hist_npcs")}
      <div class="hst-list">${html}</div>`);
  };

  opener.hist_caravans = () => {
    const s = G().state(), hs = H.ensureState(s), now = Date.now(), day = H.dayOf();
    const cap = 4 + (hs.mounts.carriage ? 8 : hs.mounts.camel ? 4 : 0);
    const crafts = Object.keys(hs.crafts || {}).filter((k) => hs.crafts[k] > 0 && H.CRAFT_BY_ID[k]);
    const carList = (hs.caravans || []).slice().reverse().slice(0, 5).map((c) => {
      const left = Math.max(0, c.end - now);
      return `<div class="irow"><span>🐪</span><div><b>قافلة صحراوية (+${c.payout}🪙)</b><small>${c.done ? "✓ وصلت واستُلمت" : left ? "في الطريق: " + fmtTime(left) : "🎉 وصلت القافلة!"}</small></div>
        ${c.done ? "" : `<button class="btn sm ${left ? "alt" : "gold"}" data-act="g-hst-cclaim" data-id="${c.id}" ${left ? "disabled" : ""}>${left ? fmtTime(left) : "استلام الربح"}</button>`}</div>`;
    }).join("");
    const voyList = (hs.voyages || []).slice().reverse().slice(0, 5).map((v) => {
      const left = Math.max(0, v.end - now), mat = H.MATS[v.bonusMat];
      return `<div class="irow"><span>⛵</span><div><b>${esc(v.label)} (+${v.payout}🪙 + ${mat ? mat.e : ""})</b><small>${v.done ? "✓ رست في الميناء" : left ? "تبحر: " + fmtTime(left) : "⚓ وصلت السفينة!"}</small></div>
        ${v.done ? "" : `<button class="btn sm ${left ? "alt" : "gold"}" data-act="g-hst-vclaim" data-id="${v.id}" ${left ? "disabled" : ""}>${left ? fmtTime(left) : "استلام"}</button>`}</div>`;
    }).join("");
    const sendBtns = crafts.map((k) => {
      const r = H.CRAFT_BY_ID[k], q = Math.min(cap, hs.crafts[k]), pay = Math.round(H.craftPrice(k, day) * q * 1.45 * ((hs.monuments.mon_arch || 0) >= 3 ? 1.15 : 1));
      return `<div class="irow"><span>${r.e}</span><div><b>${esc(r.n)} (ترسل ×${q})</b><small>عائد القافلة (+45%): ${pay}🪙 خلال 3 دقائق</small></div>
        <div class="row"><button class="btn sm gold" data-act="g-hst-caravan" data-id="${k}" data-q="${q}">🐪 قافلة</button>
        <button class="btn sm berry" data-act="g-hst-voyage" data-mode="craft" data-id="${k}">⛵ ميناء</button></div></div>`;
    }).join("");
    UI().openModal(`<h3>🐪 القوافل والتجارة البحرية</h3>${tabs("hist_caravans")}
      <div class="hst-prof-box">
        <div><b>📦 سعة القافلة الحالية: ${cap} قطعة</b><small>امتلاك جمل (+4) أو عربة خيول (+8) يرفع السعة. الرحلة تستغرق 3 دقائق (+45% ربح) والميناء 4 دقائق (+65% + مادة نادرة).</small></div>
        <button class="btn sm gold" data-act="g-hst-voyage" data-mode="charter" ${s.coins < 45 ? "disabled" : ""}>⛵ تمويل رحلة بحرية (45🪙 ← 74🪙 + نادر)</button>
      </div>
      <b>🚀 تجهيز وإرسال بضائع الحرفيين</b>
      <div class="items">${sendBtns || '<div class="empty">اصنع تحفاً من تبويب «المهن» لإرسالها عبر القوافل أو السفن!</div>'}</div>
      ${carList ? `<div class="sep"></div><b>🐪 سجل قوافل الجمال</b><div class="items">${carList}</div>` : ""}
      ${voyList ? `<div class="sep"></div><b>⛵ سجل رحلات الميناء القديم</b><div class="items">${voyList}</div>` : ""}`);
  };

  opener.hist_monuments = () => {
    const s = G().state(), hs = H.ensureState(s);
    const html = H.MONUMENTS.map((mn) => {
      const stg = hs.monuments[mn.id] || 0, done = stg >= mn.stages;
      const ok = !done && s.coins >= mn.stageCoins && (hs.mats.stone_block || 0) >= 3 && (hs.mats.cedar_wood || 0) >= 2;
      return `<div class="hst-site-card">
        <div class="hst-eh"><b>${mn.e} ${esc(mn.n)}</b><small>المرحلة ${stg} / ${mn.stages}</small></div>
        <p>${esc(mn.desc)}</p>
        <div class="hst-bar"><i style="width:${Math.round((stg / mn.stages) * 100)}%"></i></div>
        <div class="row" style="justify-content:space-between;margin-top:8px">
          <small>${done ? "🎉 اكتمل الصرح وتفعّلت ميزته الدائمة!" : `المرحلة التالية: ${mn.stageCoins}🪙 + 🧱3 + 🪵2 · مكافأة الإتمام: ${mn.rewardCoins}🪙`}</small>
          ${done ? `<span class="btn sm alt" style="pointer-events:none">✓ مكتمل</span>` : `<button class="btn sm ${ok ? "berry" : "alt"}" data-act="g-hst-mon" data-id="${mn.id}" ${ok ? "" : "disabled"}>ساهما بالبناء 🏗️</button>`}
        </div>
      </div>`;
    }).join("");
    UI().openModal(`<h3>🏗️ المعالم التعاونية (للاثنين معاً)</h3>${tabs("hist_monuments")}
      <p class="hint">معالم كبرى تُبنى على مراحل وتظهر مباشرة في ساحة دار السلام 3D وتمنح مكافآت دائمة لمتحفكما وقوافلكما وآثاركما.</p>
      <div class="hst-list">${html}</div>`);
  };

  opener.hist_coop_tomb = () => {
    const hs = H.ensureState(G().state()), ct = hs.coopTomb, now = Date.now(), meId = DB().uid;
    const pPull = Object.keys(ct.pulls || {}).find((u) => u !== meId && now - ct.pulls[u] <= H.COOP_TOMB.windowMs);
    const mPull = ct.pulls && ct.pulls[meId] && now - ct.pulls[meId] <= H.COOP_TOMB.windowMs;
    UI().openModal(`<h3>🔐 بوابة الكنز المزدوجة (تعاون اللاعبين)</h3>
      <div class="qbox">
        <p>بوابة الغرفة الملكية القديمة لا تُفتح إلا بضغط كلا اللاعبين على ذراعَي الختم خلال <b>35 ثانية</b> معاً!</p>
        ${ct.done
          ? `<div class="hst-alert">👑 تم فتح الغرفة الملكية معاً واستلمتما ${H.COOP_TOMB.rewardCoins}🪙 وتاج الشمس الفرعوني!</div>`
          : `<p>${pPull ? "🔥 شريكك ضغط على الختم للتو! اضغطي فوراً لفتح الغرفة!" : mPull ? `⏳ تم سحب ذراعك — بانتظار الشريك خلال ${fmtTime(H.COOP_TOMB.windowMs - (now - ct.pulls[meId]))}` : "اضغطا معاً على الذراعين هنا لفتح الكنز المشترك."}</p>
             <button class="btn berry" data-act="g-hst-cooptomb" style="width:100%;margin-top:8px">🔐 اسحب ذراع الختم الحجري</button>`}
      </div>`);
  };

  opener.hist_hammam = () => {
    const s = G().state();
    UI().openModal(`<h3>♨️ الحمّام التاريخي العام</h3>
      <p class="hint">مياه دافئة وبخار معطر بماء الورد الدمشقي يعيد الشبع والريّ إلى 100% فوراً.</p>
      <div class="items">
        <div class="irow"><span>♨️</span><div><b>استجمام فردي</b><small>شبع وري 100%</small></div><button class="btn sm gold" data-act="g-hst-hammam" data-b="0" ${s.coins < 20 ? "disabled" : ""}>20🪙</button></div>
        <div class="irow"><span>💞</span><div><b>استجمام لكما معاً</b><small>يعالج الاثنين 100%</small></div><button class="btn sm berry" data-act="g-hst-hammam" data-b="1" ${s.coins < 35 ? "disabled" : ""}>35🪙</button></div>
      </div>`);
  };

  /* ---------- معالج النقرات g-hst-* ---------- */
  H.click = async (a, el) => {
    const g = G(), ui = UI();
    const run = async (fn) => { try { await fn(); } catch (e) { ui.toast("⚠️ " + esc(e.message)); } };
    if (a === "g-hst-tab") return opener[el.dataset.t] && opener[el.dataset.t]();
    if (a === "g-hst-go") return H.travel(el.dataset.z);
    if (a === "g-hst-era") return run(async () => { await g.do("hist_era", { era: el.dataset.id }); OSW.audio && OSW.audio.sfx("magic"); ui.toast("⏳ تم تفعيل طابع " + H.ERAS[el.dataset.id].n, "gold"); });
    if (a === "g-hst-prof") { H.openProf = el.dataset.id; return opener.hist_crafts(); }
    if (a === "g-hst-bmat") return run(async () => { await g.do("hist_buy_mat", { id: el.dataset.id, qty: +el.dataset.q || 1 }); OSW.audio && OSW.audio.sfx("coin"); ui.toast("🪵 تم شراء المادة الخام!"); });
    if (a === "g-hst-craft") {
      const coop = W() && W().partnerDist && W().partnerDist() < 12;
      return run(async () => { await g.do("hist_craft", { id: el.dataset.id, coop }); OSW.audio && OSW.audio.sfx("craft"); ui.hearts("⚒️", 5); ui.toast("✨ صنعتوا " + H.CRAFT_BY_ID[el.dataset.id].n + (coop ? " (بونص تعاون +25% خبرة)" : ""), "gold"); });
    }
    if (a === "g-hst-sell") return run(async () => { await g.do("hist_sellcraft", { id: el.dataset.id, qty: +el.dataset.q || 1 }); OSW.audio && OSW.audio.sfx("coin"); ui.toast("🪙 تم البيع في السوق التاريخي!", "gold"); });
    if (a === "g-hst-tool") return run(async () => { await g.do("hist_dig_tool", { id: el.dataset.id }); H.equipTool(el.dataset.id); OSW.audio && OSW.audio.sfx("coin"); ui.toast("🧰 جاهز للتنقيب وتجهيز الأداة!"); });
    if (a === "g-hst-equip") { H.equipTool(el.dataset.id); OSW.audio && OSW.audio.sfx("pop"); ui.toast("⛏️ تم تجهيز: " + H.DIG_TOOLS[el.dataset.id].n); return opener.hist_arch(); }
    if (a === "g-hst-digspot") return run(async () => { await H.digTerrainSpot(el.dataset.spot); });
    if (a === "g-hst-gospot") {
      const sp = H.SPOT_BY_ID[el.dataset.spot], w = W();
      if (!sp || !w) return;
      if (w._int && w._int.me && w._int.me.veh) return ui.toast("🚪 انزلوا من السيارة أولاً قبل الانتقال");
      ui.closeModal();
      if (w.mode === "in" && OSW.app && OSW.app.exitInterior) await OSW.app.exitInterior();
      const cur = document.getElementById("curtain");
      cur && cur.classList.add("on");
      OSW.audio && OSW.audio.sfx("door");
      await OSW.sleep(300);
      w.placeMe(sp.x, sp.z + 2.2);
      w.resetCam && w.resetCam();
      w.setInputEnabled(true);
      await OSW.sleep(80);
      cur && cur.classList.remove("on");
      return ui.toast(`${sp.e} وصلتم إلى ${sp.n} — انقروا على كومة التراب للحفر!`, "gold", 3000);
    }
    if (a === "g-hst-dig") {
      return run(async () => {
        const before = Object.assign({}, H.ensureState(g.state()).rawArt);
        await g.do("hist_dig", { site: el.dataset.site, tool: el.dataset.tool });
        const after = H.ensureState(g.state()).rawArt;
        const found = Object.keys(after).find((k) => (after[k] || 0) > (before[k] || 0));
        OSW.audio && OSW.audio.sfx("magic");
        ui.hearts("⛏️", 7);
        ui.toast(found ? `🎉 [${H.RARITY[H.ARTIFACTS[found].rarity].n}] اكتشفتوا: ${H.ARTIFACTS[found].e} ${H.ARTIFACTS[found].n}!` : "🪨 استخرجتم مواد أثرية!", "gold", 3500);
      });
    }
    if (a === "g-hst-openpz") return opener.hist_puzzles();
    if (a === "g-hst-pz") {
      const pz = H.PUZZLES[el.dataset.id], ans = +el.dataset.ans;
      if (!pz) return;
      if (ans !== pz.ans) { OSW.audio && OSW.audio.sfx("pop"); return ui.toast("❌ ليس هذا الرمز الصحيح — جرّبا التفكير من جديد!"); }
      return run(async () => { await g.do("hist_puzzle", { id: pz.id, ans }); OSW.audio && OSW.audio.sfx("fanfare"); ui.hearts("👑", 12); ui.toast(`🧩 أحسنتم! فُتح الكنز: +${pz.rewardCoins}🪙 وتحفة أثرية!`, "gold", 3800); });
    }
    if (a === "g-hst-restore") return run(async () => { await g.do("hist_restore", { id: el.dataset.id }); OSW.audio && OSW.audio.sfx("magic"); ui.hearts("✨", 8); ui.toast("✨ تم ترميم التحفة بنجاح — أصبحت جاهزة للمتحف!", "gold"); });
    if (a === "g-hst-exhibit") return run(async () => { await g.do("hist_exhibit", { id: el.dataset.id }); OSW.audio && OSW.audio.sfx("pop"); ui.toast("🏛️ تم تحديث منصة المتحف ثلاثية الأبعاد!", "gold"); });
    if (a === "g-hst-mclaim") return run(async () => { await g.do("hist_museum_claim", {}); OSW.audio && OSW.audio.sfx("coin"); ui.toast("🪙 تم تحصيل الدخل الثقافي للمتحف!", "gold"); });
    if (a === "g-hst-quest") return run(async () => { await g.do("hist_quest", { id: el.dataset.id }); OSW.audio && OSW.audio.sfx("fanfare"); ui.hearts("💞", 10); ui.toast("📜 تم تسليم المهمة بنجاح وارتفعت المودة!", "gold"); });
    if (a === "g-hst-mbuy") return run(async () => { await g.do("hist_mount_buy", { id: el.dataset.id }); OSW.audio && OSW.audio.sfx("coin"); ui.toast("🐪 تم اقتناء الدابة وامتطاؤها بنجاح!", "gold"); });
    if (a === "g-hst-mount") return run(async () => { await g.do("hist_mount_toggle", { id: el.dataset.id || null }); OSW.audio && OSW.audio.sfx("pop"); ui.toast(el.dataset.id ? "🐪 تم الامتطاء!" : "🚶 ترجلتم بأمان"); });
    if (a === "g-hst-caravan") return run(async () => { await g.do("hist_caravan", { items: [{ id: el.dataset.id, qty: +el.dataset.q || 1 }] }); OSW.audio && OSW.audio.sfx("pop"); ui.toast("🐪 انطلقت قافلة الجمال نحو الشمال!", "gold"); });
    if (a === "g-hst-cclaim") return run(async () => { await g.do("hist_caravan_claim", { id: el.dataset.id }); OSW.audio && OSW.audio.sfx("coin"); ui.toast("🪙 استلمتم أرباح القافلة!"); });
    if (a === "g-hst-voyage") return run(async () => { await g.do("hist_voyage", { mode: el.dataset.mode, item: el.dataset.id }); OSW.audio && OSW.audio.sfx("pop"); ui.toast("⛵ أبحرت السفينة من الميناء القديم!", "gold"); });
    if (a === "g-hst-vclaim") return run(async () => { await g.do("hist_voyage_claim", { id: el.dataset.id }); OSW.audio && OSW.audio.sfx("coin"); ui.toast("⛵ وصلت السفينة بالبضائع والأرباح!"); });
    if (a === "g-hst-mon") return run(async () => { await g.do("hist_monument", { id: el.dataset.id }); OSW.audio && OSW.audio.sfx("fanfare"); ui.hearts("🏗️", 10); ui.toast("🏗️ تقدّم بناء الصرح التاريخي في الساحة!", "gold"); });
    if (a === "g-hst-cooptomb") return run(async () => { await g.do("hist_coop_tomb", {}); OSW.audio && OSW.audio.sfx("magic"); ui.toast("🔐 تم ضغط الختم الحجري!", "gold"); });
    if (a === "g-hst-hammam") return run(async () => { await g.do("hist_hammam", { both: el.dataset.b === "1" }); OSW.audio && OSW.audio.sfx("magic"); ui.hearts("♨️", 10); ui.toast("♨️ استعادة الحيوية 100%!", "gold"); });
  };

  function installHooks() {
    const g = G(); if (!g || !g.openers) return;
    Object.assign(g.openers, opener);
    if (!g._hstClickHook) {
      g._hstClickHook = true;
      const origClick = g.click;
      g.click = (a, el) => (String(a).indexOf("g-hst-") === 0 ? H.click(a, el) : origClick(a, el));
    }
    if (OSW.places) {
      OSW.places.noRefresh = Object.assign(OSW.places.noRefresh || {}, { hist_puzzles: true });
    }
    // إضافة قسم القارة التاريخية لخريطة القرية بعد تحميل توسعات الخريطة الأخرى
    H.ensureMapHook = () => {
      if (!g.openers.map || g.openers.map._hstMapHook) return;
      const origMap = g.openers.map;
      const wrapped = () => {
        origMap();
        const card = document.querySelector("#modalCard");
        if (!card) return;
        const btns = Object.keys(H.ZONES).map((k) => `<button data-act="g-hst-go" data-z="${k}">${H.ZONES[k].e} ${H.ZONES[k].n}</button>`).join("");
        card.insertAdjacentHTML("beforeend", `<b>🏛️ القارة التاريخية (شمال القرية — انتقال مجاني)</b><div class="seg" style="margin:6px 0 10px;flex-wrap:wrap">${btns}</div>`);
      };
      wrapped._hstMapHook = true;
      g.openers.map = wrapped;
    };
    H.ensureMapHook();
    const bh = document.getElementById("btnHist");
    if (bh && !bh._hstBound) {
      bh._hstBound = true;
      bh.onclick = () => {
        const st = OSW.app && OSW.app.state && OSW.app.state();
        if (st && st.busyNav) return;
        OSW.app && OSW.app.goPlace && OSW.app.goPlace("hist_atlas");
      };
    }
  }

  document.addEventListener("DOMContentLoaded", installHooks);
  if (document.readyState !== "loading") installHooks();
})();
