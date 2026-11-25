/* مناسبات القرية: الأعراس ودعواتها، وأسئلة أهل القرية ومشاهدهم */
(function () {
  const OSW = window.OSW, { esc, rand } = OSW;
  const E = (OSW.events = { cur: null, pending: null });
  let db, ui, W, G;
  const AMMAN = 3 * 3600000, H = 3600000;
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const dayOf = (t) => Math.floor((t + AMMAN) / 86400000);
  E.dayStart = (day) => day * 86400000 - AMMAN;
  E.hourNow = () => (((Date.now() + AMMAN) % 86400000) / H);

  /* ---------- الأعراس ---------- */
  const COUPLES = [["علي", "ليلى"], ["سامي", "هنادي"], ["خالد", "دانة"], ["محمود", "سلمى"], ["يوسف", "رند"], ["عمر", "جنى"]];
  E.wedding = (day) => {
    if (hash("wed" + day) % 4 !== 0) return null;
    const c = COUPLES[hash("cp" + day) % COUPLES.length], s0 = E.dayStart(day);
    return { day, g: c[0], b: c[1], start: s0 + 17 * H, end: s0 + 21 * H };
  };
  E.weddingAt = (t) => { const w = E.wedding(dayOf(t)); return w && t >= w.start && t <= w.end ? w : null; };
  E.weddingToday = () => E.wedding(dayOf(Date.now()));
  const GROOM = (w) => ({ id: "wed_groom", name: w.g + " (العريس)", emoji: "🤵", look: { gender: "boy", outfit: "suit", hair: "#2b1d14", hairStyle: "short", skin: "#f2c9a0", color: "#2b3a55" }, pos: [-8.6, -4.2], face: 0, stay: true, act: "wedding", lines: ["الله يبارك فيكم! تفضلوا شاركونا الفرحة 🎉", "اليوم أسعد يوم بحياتي! 💍", "شكراً إنكم حضرتوا 🥹"] });
  const BRIDE = (w) => ({ id: "wed_bride", name: w.b + " (العروس)", emoji: "👰", look: { gender: "girl", outfit: "gown", hair: "#3b2a20", hairStyle: "long", skin: "#f2c9a0", color: "#fff" }, pos: [-5.8, -4.2], face: 0, stay: true, act: "wedding", lines: ["يسلموا! دايماً بتفرحونا 💖", "أحلى ليلة بحياتي ✨", "الله يخليكم لبعض يا حبايب"] });
  let wedOn = false;
  E.tickWedding = () => {
    const now = Date.now(), w = E.weddingAt(now), t = E.weddingToday();
    if (w && !wedOn) {
      wedOn = true; E.cur = w; W.addNpc(GROOM(w)); W.addNpc(BRIDE(w)); W.setWedding(true); W.setCrowd(-7, -1); W.npcProps("wed_groom", { mood: "💍" }); W.npcProps("wed_bride", { mood: "💐" });
      if (W.mode === "out") { ui.toast(`🎊 بلّش عرس ${esc(w.g)} و${esc(w.b)} بالساحة!`, "gold", 6000); OSW.audio.sfx("fanfare"); }
    } else if (!w && wedOn) { wedOn = false; E.cur = null; W.removeNpc("wed_groom"); W.removeNpc("wed_bride"); W.setWedding(false); W.setCrowd(null); OSW.NPCS.forEach((n) => W.npcProps(n.id, { dance: false })); }
    if (wedOn) { const sp = { x: -7, z: -1 }; OSW.NPCS.forEach((n) => { const p = W.npcPos(n.id); if (p) W.npcProps(n.id, { dance: Math.hypot(p.x - sp.x, p.z - sp.z) < 8 }); }); }
    if (t && !w && t.start - now > 0 && t.start - now < 20 * 60000 && !E._remind) { E._remind = t.day; ui.toast(`⏰ عرس ${esc(t.g)} و${esc(t.b)} بعد ${Math.ceil((t.start - now) / 60000)} دقيقة بالساحة 🎉`, "gold", 6000); }
  };
  E.invite = () => {
    const t = E.weddingToday(), key = "inv:" + (t && t.day); if (!t || ui.my()[key] || Date.now() > t.end) return;
    ui.saveMy({ [key]: 1 });
    const hh = (x) => { const d = new Date(x + AMMAN), h = d.getUTCHours(); return (h % 12 || 12) + (h >= 12 ? " مساءً" : " صباحاً"); };
    setTimeout(() => { OSW.audio.sfx("fanfare"); ui.openModal(`<h3>💌 دعوة عرس</h3><div class="pick" style="font-size:22px">يتشرّف <b>${esc(t.g)}</b> و<b>${esc(t.b)}</b><br>بدعوتكم لحضور حفل زفافهم<br><b>اليوم الساعة ${hh(t.start)}</b><br>بالساحة، جنب النافورة 🎉<div class="hint" style="font-size:14px;margin-top:8px">البسوا حلو! البدلة والفستان بيعطوكم مكافأة أنيقة 🤵👗</div></div><div class="row" style="justify-content:center;margin-top:10px"><button class="btn berry" data-act="close-modal">إن شاء الله بنحضر 💞</button></div>`); }, 2500);
  };

  /* ---------- أسئلة أهل القرية (مشاهد) ---------- */
  const SC = (E.SCENES = [
    { id: "cat", npc: "abukhaled", q: "يا شباب، قطتي الصفراء ضايعة! 🐈 وين بتنصحوني أدوّر عليها؟", opts: ["عند النافورة، آخر مرة شفتها هناك", "بالمزرعة بين الزرع", "بدكان سعدون"], okIdx: [0], win: 6, lose: 1, say: ["لقيتها! شكراً يا نشامى 😻", "ما لقيتها… رح أكمل التدوير 😿", "سعدون لقاها بتاكل سمك! 😂"] },
    { id: "clock", npc: "umahmad", q: "ساعتي واقفة! كم الساعة هلأ تقريباً؟ ⏰", dyn: "clock", win: 5, lose: 0, say: ["تسلموا! خلصت منها 🥰", "لا يا حبيبي، مش هيك الساعة 😅"] },
    { id: "capital", npc: "samer", q: "سؤال للأذكياء: شو عاصمة الأردن؟ 📚", opts: ["القاهرة", "عمّان", "بيروت"], okIdx: [1], win: 6, lose: 0, say: ["برافو! عمّان عاصمة المحبة 👏", "قريب… بس لأ 😄"] },
    { id: "riddle", npc: "samer", q: "لغز: شو اللي بيمشي بلا رجلين وبيبكي بلا عيون؟ 🤔", opts: ["الساعة", "الغيمة", "القمر"], okIdx: [1], win: 6, lose: 0, say: ["صح! الغيمة ☁️ شاطرين", "لأ، فكّروا بالمطر 🌧️"] },
    { id: "icecream", npc: "fadi", q: "بتعطوني مصاري بوظة؟ 🍦 بليز بليز!", opts: ["خد يا حبيبي 🍦 (-6)", "ما معي 🙃"], okIdx: [0], win: -6, lose: 0, say: ["يييي! شكراً! بحبكم! 🥳", "ماشي… رح أطلب من غيركم 😢"] },
    { id: "flowers", npc: "khalasuad", q: "وين بلاقي ورود الحب يا أولادي؟ 🌹", opts: ["شرق الساحة، جنب صندوق المفاجآت", "عند المنارة", "جوّا المخزن"], okIdx: [0], win: 5, lose: 0, say: ["تسلموا! رح أروح أشوفها 🌷", "لأ مش هناك يا ولدي 😅"] },
    { id: "shopdir", npc: "abuali", q: "وين دكان سعدون؟ بدي رغيف خبز 🥖", opts: ["غرب الساحة، جنب المقهى", "جنب المحطة", "بالحديقة"], okIdx: [0], win: 5, lose: 0, say: ["الله يعطيكم العافية! 👮", "مش هيك… رح أسأل غيركم 😅"] },
    { id: "mansaf", npc: "umahmad", q: "عملت منسف زيادة اليوم! بدكم صحن؟ 🍲", opts: ["آه والله! 😋", "شكراً شبعانين 🙏"], okIdx: [0], win: 0, lose: 2, item: "mansaf", say: ["بالهنا والشفا! هاد إلكم 🍲", "الله يعطيك العافية، خد هاي 😊"] },
    { id: "love", npc: "khalasuad", q: "بتحبوا بعض كتير؟ 🥰", opts: ["كتير كتير 💞", "شوي 😂"], okIdx: [0], win: 4, lose: 1, say: ["الله يتمم لكم عالخير 💖", "هههه الله يهديكم 😄"] },
    { id: "math", npc: "samer", q: "حساب سريع: كم 7 × 8؟ 🧮", opts: ["54", "56", "63"], okIdx: [1], win: 6, lose: 0, say: ["ممتاز! ٥٦ 👏", "لأ، جرّبوا مرة ثانية 😊"] },
    { id: "tug", npc: "fadi", q: "بدنا نلعب شد حبل؟ اللي بيخسر بيشتري بوظة! 🪢", opts: ["أنا مع فادي 😂", "بلا بلا 🙃"], okIdx: [0], win: 3, lose: 0, say: ["هههه إنت قوي! خدوا هاي 😆", "ماشي، مرة ثانية 😄"] },
    /* مشاهد من جوّا البيت (مرة باليوم لكل مشهد) */
    { id: "cook", home: 1, e: "🍳", title: "اطبخوا سوا", q: "قررتوا تطبخوا سوا اليوم! 🍳 شو بتحبوا تعملوا؟", opts: ["مقلوبة بالفرن 🍚", "بيض مقلي على السريع 🍳", "نطلب دليفري وخلص 🛵"], okIdx: [0, 1], win: 6, lose: 1, item: "mansaf", itemLabel: " + 🍲 صحن منسف", say: ["المقلوبة قلبتوها بنجاح! 👏", "بيض مقلي وضحك… أحلى طبخة 😂", "ههه الدليفري أسرع، بس الطبخ أحلى 🛵"] },
    { id: "movie", home: 1, e: "📺", title: "سهرة فيلم", q: "سهرة فيلم 🍿 شو بدكم تشوفوا؟", opts: ["فيلم رومانسي 💕", "فيلم رعب 😱", "كرتون بيضحّك 😂"], okIdx: [0, 2], win: 6, lose: 2, say: ["دموع وفشار… ليلة مثالية 🥹", "خفتوا وغطّيتوا وشكم ببعض 🙈", "ضحكتوا لحد ما دمعت عيونكم 😂"] },
    { id: "stars", home: 1, e: "🔭", title: "نجوم الليل", q: "السما صافية! 🌌 تمنّوا أمنية على نجمة 🌠", opts: ["نتقابل قريب 🫶", "سفرة سوا ✈️", "بيت مثل هاد 🏡"], okIdx: [0, 1, 2], win: 7, lose: 0, say: ["الله يحقق! النجمة سمعتكم 💫", "حقائب جاهزة بالقلب ✈️", "وهاد البيت بالبداية 🏡💖"] },
    { id: "goodnight", home: 1, e: "🌙", title: "قبل النوم", q: "لمبة القمر نوّرت 🌙 شو بتقولوا لبعض قبل النوم؟", opts: ["تصبح على خير يا قلبي 💞", "نام بدري! 😴", "ولا كلمة… بس حضن 🤗"], okIdx: [0, 1, 2], win: 5, lose: 0, say: ["وإنت من أهله يا عمري 💞", "حاضر يا ماما 😂", "أحلى حضن بالعالم 🤗"] },
    { id: "selfie", home: 1, e: "📸", title: "سيلفي", q: "كاميرا السيلفي جاهزة 🤳 شو الوضعية؟", opts: ["ابتسامة كبيرة 😁", "وجه مضحك 🤪", "بوسة بالهوا 😘"], okIdx: [0, 1, 2], win: 5, lose: 0, say: ["كليك! أحلى ابتسامة 📸", "هاي للألبوم السري 🤪", "💋 الصورة طلعت قمر"] },
    { id: "runner", npc: "abuali", q: "شفتوا حدا بيركض بالساحة؟ ممنوع! 👮", opts: ["لا والله ما شفت", "شفتك إنت بتركض 😂"], okIdx: [0], win: 2, lose: -2, say: ["الله يعطيكم العافية، قلب نظيف 👍", "ههه ما بصير! خدوا غرامة صغيرة 😅"] },
  ]);
  E.sceneDone = (id) => !!(G.state().scenes || {})[G.today() + ":" + id];
  const sceneOpts = (sc) => {
    if (sc.dyn === "clock") { const h = Math.floor(E.hourNow()), f = (x) => ((((x % 12) + 12) % 12) || 12) + ":00"; const o = [f(h), f(h + 1), f(h - 2)].sort(() => Math.random() - 0.5); return { opts: o, okIdx: [o.indexOf(f(h))] }; }
    return { opts: sc.opts, okIdx: sc.okIdx };
  };
  let nextScene = Date.now() + 90000, sceneBusy = false;
  E.tickScene = () => {
    const now = Date.now();
    if (now < nextScene || sceneBusy || !W || W.mode !== "out" || !document.getElementById("modal").hidden || !document.getElementById("room").hidden || (OSW.app.state && OSW.app.state().busyNav)) return;
    const avail = SC.filter((s) => !s.home && !E.sceneDone(s.id) && OSW.NPC_BY[s.npc]); if (!avail.length) { nextScene = now + 600000; return; }
    const sc = rand(avail); sceneBusy = true; nextScene = now + (240 + Math.random() * 180) * 1000;
    const me = W.getMe(); W.npcProps(sc.npc, { mark: "❗" }); W.say(sc.npc, rand(["يا نشامى! بدي أسألكم شي 🙋", "لحظة لحظة! عندي سؤال 🤚", "ممكن مساعدة؟ 🙏"]), 4000);
    OSW.audio.sfx("ding");
    const ok = W.npcGoto(sc.npc, me.x + (Math.random() < 0.5 ? 3 : -3), me.z + 2.5, () => { W.npcProps(sc.npc, { mark: "" }); sceneBusy = false; E.openScene(sc.id); });
    if (!ok) sceneBusy = false;
    setTimeout(() => { sceneBusy = false; W.npcProps(sc.npc, { mark: "" }); }, 60000);
  };
  E.openScene = (id) => { const sc = SC.find((s) => s.id === id); if (!sc || !document.getElementById("modal").hidden) return; if (E.sceneDone(id)) return ui.toast("خلصتوا هالمشهد اليوم 😊 ارجعوا بكرة", "", 2200); E.scene = Object.assign({}, sc, sceneOpts(sc)); OSW.places.open("scene"); };

  /* ---------- نوافذ ---------- */
  G = OSW.game;
  G.openers.scene = () => {
    const sc = E.scene; if (!sc) return ui.closeModal(); const n = sc.home ? { emoji: sc.e, name: sc.title } : OSW.NPC_BY[sc.npc];
    ui.openModal(`<h3>${n.emoji} ${esc(n.name)}</h3><div class="pick" style="font-size:21px;margin:8px 0">${esc(sc.q)}</div><div class="items">${sc.opts.map((o, i) => `<button class="btn alt" style="padding:12px;text-align:start;font-size:15px" data-act="e-scene" data-i="${i}">${esc(o)}</button>`).join("")}</div>`);
  };
  G.openers.wedding = () => {
    const now = Date.now(), t = E.weddingToday(), w = E.weddingAt(now), s = G.state(), day = G.today();
    if (!t) return ui.openModal(`<h3>💍 الأعراس</h3><div class="empty"><span class="big">💒</span>ما في عرس اليوم. الأعراس بتصير بعض الأيام الساعة 5 مساءً بالساحة 🎉</div>`);
    const gifts = (s.wedGifts || {})[day + ":" + db.uid] || 0, formal = ["suit", "gown", "dress"].includes(OSW.app.lookOf(db.uid).outfit);
    ui.openModal(`<h3>💍 عرس ${esc(t.g)} و${esc(t.b)}</h3>${w ? `<div class="pick" style="font-size:20px">العرس شغّال هلأ! 🎉🎶</div>` : now < t.start ? `<div class="chk" style="justify-content:center">بيبلّش بعد ${Math.ceil((t.start - now) / 60000)} دقيقة ⏳</div>` : `<div class="chk" style="justify-content:center">العرس خلص 😊</div>`}
      <p class="hint" style="text-align:center">${formal ? "🤵 لابسين أنيق! بتاخدوا 30% مكافأة على النقوط" : "ألبسوا بدلة أو فستان بتاخدوا مكافأة أنيقة 👗"}</p>
      ${w ? `<div class="row" style="justify-content:center"><button class="btn gold" data-act="e-wish">💬 مبروك!</button></div><div class="sep"></div><b>نقوط للعروسين (${gifts}/2)</b><div class="row" style="margin-top:8px">${[10, 25, 50].map((a) => `<button class="btn berry sm" data-act="e-wgift" data-a="${a}" ${gifts >= 2 || s.coins < a ? "disabled" : ""}>${a}🪙</button>`).join("")}</div><p class="hint">وبتاخدوا حلوى العرس 🥮 مقابل كل نقطة</p>` : ""}`);
  };
  const base = G.click;
  G.click = (a, el) => {
    if (a === "e-scene") {
      const sc = E.scene; if (!sc) return; const i = +el.dataset.i, ok = sc.okIdx.includes(i); ui.closeModal();
      G.do("scene", { id: sc.id, i, ok }).then(() => {
        const rw = ok ? sc.win : sc.lose; OSW.audio.sfx(ok ? "fanfare" : "pop"); if (ok) ui.hearts("⭐", 10);
        W.say(sc.home ? "me" : sc.npc, sc.say[ok ? (sc.say.length > 2 ? i : 0) : sc.say.length > 2 ? i : 1] || sc.say[0], 5000);
        ui.toast(`${ok ? "✅ صح!" : "😅"} ${rw > 0 ? "+" + rw + "🪙" : rw < 0 ? rw + "🪙" : ""}${ok && sc.item ? sc.itemLabel || " + 🍲 صحن منسف" : ""}`, ok ? "gold" : "", 3500);
      }).catch((e) => ui.toast("⚠️ " + esc(e.message))); return;
    }
    if (a === "e-wish") { OSW.audio.sfx("heart"); ui.hearts("💖", 12); ["wed_groom", "wed_bride"].forEach((id) => W.say(id, rand(["الله يبارك فيكم! 🥰", "يسلمو! 💖", "عقبالكم! 😍"]), 4000)); return; }
    if (a === "e-wgift") { const amt = +el.dataset.a, formal = ["suit", "gown", "dress"].includes(OSW.app.lookOf(db.uid).outfit) ? 1 : 0; return G.do("wedding_gift", { day: G.today(), amt, formal }).then(() => { OSW.audio.sfx("coin"); ui.hearts("🥮", 10); ui.toast(`💍 نقّطتوا ${amt}🪙 وأخدتوا حلوى!`, "gold"); OSW.places.refresh(); }).catch((e) => ui.toast("⚠️ " + esc(e.message))); }
    return base(a, el);
  };

  E.start = (d, u, w) => {
    db = d; ui = u; W = w; G = OSW.game;
    setInterval(() => { try { E.tickWedding(); E.tickScene(); } catch (e) { console.error(e); } }, 3000);
    E.tickWedding(); setTimeout(() => E.invite(), 1500);
  };
})();
