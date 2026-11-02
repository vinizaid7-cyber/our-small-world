/* أماكن القرية: النافورة، الساحة، بيتنا، الشجرة، الحديقة، المنارة، البوابة، الإنجازات */
(function () {
  const OSW = window.OSW;
  const { $, $$, esc, nl2br, timeAgo, fmtDate, rand } = OSW;
  const ui = OSW.ui;
  let db;
  const P = (OSW.places = { current: null });
  P.init = (d) => { db = d; };
  const partner = () => (db.partner ? db.partner.name : "شريكك");
  const startDate = () => (db.kv.start_date && db.kv.start_date.date) || null;
  P.days = () => { const s = startDate(); return s ? Math.max(0, OSW.daysBetween(s)) : null; };
  const ents = (house) => db.entries.filter((e) => e.house === house).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const busy = async (fn) => { try { await fn(); } catch (e) { ui.toast("⚠️ " + esc(e.message)); } };

  /* ---------- الفتح ---------- */
  P.open = (id) => {
    P.current = id;
    const f = { fountain, plaza, home, tree, garden, lighthouse, gate, ach }[id] || (OSW.game && OSW.game.openers[id]);
    if (!f) return;
    f();
    ui.markSeen(id); db.track && db.track(id);
    ui.onModalClose = () => { P.current = null; db.track && db.track("village"); };
  };
  P.refresh = () => {
    if (!P.current || $("#modal").hidden) return;
    const ae = document.activeElement;
    if (ae && ae.closest("#modal") && /TEXTAREA|INPUT/.test(ae.tagName) && ae.value) return; // لا نمسح كتابة المستخدم
    const sc = $("#modalCard").scrollTop; const cb = ui.onModalClose;
    const id = P.current; P.open(id); ui.onModalClose = cb; $("#modalCard").scrollTop = sc;
  };

  /* ---------- النافورة ---------- */
  function dayIndex() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); }
  function fountain() {
    const key = OSW.todayKey(), q = OSW.DAILY_Q[dayIndex() % OSW.DAILY_Q.length];
    const all = ents("fountain");
    const today = all.filter((e) => e.data.day === key);
    const mine = today.find((e) => e.author === db.uid), his = today.find((e) => e.author !== db.uid);
    const ans = (e, who, blur) => `<div class="ans"><div class="who"><i style="background:${esc(ui.prof(e.author).color)}"></i>${esc(who)}</div><div class="${blur ? "blur" : ""}">${blur ? "جواب مخفي لحد ما تجاوب أنت كمان 🤫" : nl2br(e.body)}</div></div>`;
    const past = {};
    all.filter((e) => e.data.day !== key).forEach((e) => ((past[e.data.day] = past[e.data.day] || { q: e.data.q, a: [] }).a.push(e)));
    const pastHtml = Object.keys(past).sort().reverse().slice(0, 6).map((d) => `<div class="qbox" style="margin-top:8px"><div class="hint">${fmtDate(d)}</div><div class="q" style="font-size:18px">${esc(past[d].q)}</div>${past[d].a.map((e) => ans(e, ui.prof(e.author).name, false)).join("")}</div>`).join("");
    const wishes = ents("wish").slice(0, 5);
    ui.openModal(`<h3>⛲ النافورة</h3>
      <div class="qbox"><div class="hint">سؤال اليوم</div><div class="q">${esc(q)}</div>
      ${mine ? ans(mine, "جوابي", false) : `<textarea id="fqText" class="in" rows="3" placeholder="جاوب بصراحة…" style="margin-top:10px"></textarea><button class="btn" data-act="fq-save" style="margin-top:8px">أرسل جوابي</button>`}
      ${his ? ans(his, ui.prof(his.author).name, !mine) : `<div class="hint" style="margin-top:8px">${esc(partner())} لسا ما جاوب اليوم…</div>`}</div>
      <div class="sep"></div>
      <div class="row"><button class="btn gold" data-act="sweet">💬 جملة حلوة</button></div><div id="sweetOut" class="pick" style="display:none;margin-top:10px"></div>
      <div class="sep"></div>
      <b>🪙 ارمي عملة وتمنّى أمنية</b>
      <div class="row" style="margin-top:6px"><input class="in" id="wishText" placeholder="شو أمنيتك؟" style="flex:1"><button class="btn berry" data-act="wish">ارمي</button></div>
      ${wishes.map((w) => `<div class="ans"><div class="who"><i style="background:${esc(ui.prof(w.author).color)}"></i>${esc(ui.prof(w.author).name)} · ${timeAgo(w.created_at)}</div>${nl2br(w.body)}</div>`).join("")}
      ${pastHtml ? `<div class="sep"></div><b>أسئلة الأيام الماضية</b>${pastHtml}` : ""}`);
  }

  /* ---------- الساحة / اللوحة ---------- */
  const VERB = {
    first: "أول مرة جديدة", memories: "ذكرى جديدة", moments: "موقف جديد", letters: "رسالة جديدة", dreams: "حلم جديد", songs: "أغنية جديدة", photos: "صور جديدة",
    cafe: "جواب بالمقهى", because: "سبب حب جديد 💗", station: "رحلة جديدة", fights: "خلاف حلو للتعلّم", secrets: "سر جديد 🤫", stories: "حكاية جديدة", laugh: "ضحكة جديدة 😂",
    quotes: "اقتباس جديد", library: "عنوان جديد بالمكتبة", capsule: "كبسولة جديدة ⏳", surprise: "مفاجأة جاهزة 🎁", fountain: "جواب سؤال اليوم ⛲", wish: "أمنية بالنافورة 🪙",
    light: "المنارة اضاءت 🔦", board: "ورقة على اللوحة 📌", comment: "تعليق 💬",
  };
  function plaza() {
    const d = P.days(), notes = ents("board").slice(0, 12);
    const feed = db.entries.filter((e) => e.house !== "game").sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 18).map((e) => {
      const t = e.house === "secrets" || e.private ? "" : e.title && e.title !== "🔒" ? ` «${esc(e.title)}»` : "";
      return `<div><b style="color:${esc(ui.prof(e.author).color)}">${esc(ui.prof(e.author).name)}</b> · ${VERB[e.house] || "شي جديد"}${t}<small>${timeAgo(e.created_at)}</small></div>`;
    }).join("");
    const pres = db.partner && db.presence[db.partner.id];
    const cols = ["#fff3a0", "#ffc2d6", "#bfe9ff", "#c9f2c7", "#e1ccff"];
    ui.openModal(`<h3>📌 ساحة القرية</h3>
      ${d != null ? `<div class="hint" style="text-align:center">معاً من</div><div class="big-days">${d}</div><div style="text-align:center;font-weight:700">يوم من الحب 💞</div>` : `<div class="top-block"><b>متى بلّشت حكايتكم؟</b><input type="date" class="in" id="startIn" max="${OSW.todayKey()}"><button class="btn berry" data-act="start-save">احفظ التاريخ</button></div>`}
      <div class="sep"></div>
      <div class="row"><input class="in" id="noteText" maxlength="140" placeholder="علّق ورقة على اللوحة…" style="flex:1"><button class="btn gold" data-act="note-add">📌</button></div>
      <div class="note-wall" style="margin-top:12px">${notes.map((n, i) => `<div class="note" style="--nc:${cols[i % 5]};--rot:${(i % 5) - 2}deg;min-height:90px">${nl2br(n.body)}<div class="nf"><span>— ${esc(ui.prof(n.author).name)}</span>${n.author === db.uid ? `<button data-act="note-del" data-id="${n.id}" aria-label="حذف">🗑️</button>` : ""}</div></div>`).join("") || `<div class="empty" style="grid-column:1/-1">اللوحة فاضية… علّق أول ورقة!</div>`}</div>
      <div class="sep"></div><b>${pres ? "🟢 " + esc(partner()) + " موجود هلأ" : "آخر الأخبار"}</b>
      <div class="feed" style="margin-top:8px">${feed || '<div>ما في أخبار لسا</div>'}</div>`);
  }

  /* ---------- بيتنا ---------- */
  const SW = { wall: ["#FFF1D6", "#FFD6E0", "#D6ECFF", "#E3D6FF", "#D8F5E4", "#FFE9B8"], roof: ["#E5484D", "#2F7DE1", "#6E4BC4", "#12A594", "#F08A24", "#2B2B3A"], door: ["#8a3b3b", "#2f4f7a", "#4b3a7a", "#1f6b5e", "#7a4a1f", "#222222"], emoji: ["💞", "🏡", "🌹", "⭐", "🦋", "🔥"] };
  P.homeCfg = () => Object.assign({ wall: SW.wall[0], roof: SW.roof[0], door: SW.door[0], emoji: "💞", flag: "💞" }, db.kv.home || {});
  P.homeName = () => (db.kv.home && db.kv.home.name) || (db.partner ? `بيت ${db.me.name} و${db.partner.name}` : "بيتنا");
  let homeDraft;
  function home(reuse) {
    if (!reuse || !homeDraft) { homeDraft = P.homeCfg(); homeDraft.name = homeDraft.name || P.homeName(); }
    const total = db.entries.filter((e) => !["comment", "board", "light", "wish", "fountain"].includes(e.house)).length;
    const sw = (k) => `<div class="field"><label>${{ wall: "لون الجدران", roof: "لون السقف", door: "لون الباب", emoji: "شعار البيت" }[k]}</label><div class="swatches">${SW[k].map((c) => k === "emoji" ? `<button style="background:#fff;font-size:20px" class="${homeDraft.emoji === c ? "on" : ""}" data-act="home-pick" data-k="emoji" data-v="${c}">${c}</button>` : `<button style="background:${c}" class="${homeDraft[k] === c ? "on" : ""}" data-act="home-pick" data-k="${k}" data-v="${c}" aria-label="${c}"></button>`).join("")}</div></div>`;
    ui.openModal(`<h3>🏡 بيتنا</h3>
      <div class="row hint" style="margin-bottom:10px"><span>📚 ${total} شي محفوظ</span>${P.days() != null ? `<span>💞 ${P.days()} يوم</span>` : ""}</div>
      <div class="field"><label>اسم بيتكم</label><input class="in" id="homeName" value="${esc(homeDraft.name)}" maxlength="30"></div>
      ${sw("wall")}${sw("roof")}${sw("door")}${sw("emoji")}
      <div class="field"><label>تاريخ بداية حكايتكم</label><input type="date" class="in" id="startIn" value="${esc(startDate() || "")}" max="${OSW.todayKey()}"></div>
      <button class="btn berry" data-act="home-save" style="width:100%">احفظ</button>`);
  }

  /* ---------- الشجرة ---------- */
  function tree() {
    const houses = OSW.HOUSES.map((h) => [h, ents(h.id).length]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const total = houses.reduce((a, b) => a + b[1], 0), max = houses.length ? houses[0][1] : 1;
    ui.openModal(`<h3>🌳 شجرة العلاقة</h3><p class="hint">كل ذكرى أو رسالة أو سبب بتضيفوه، بتطلّع ورقة جديدة. وكل 10 أشياء بتطلع ثمرة قلب ❤️</p>
      <div class="big-days">${total}</div><div style="text-align:center;font-weight:700">ورقة على الشجرة · ${Math.floor(total / 10)} قلب</div><div class="sep"></div>
      ${houses.map(([h, n]) => `<div class="stat-row" style="--h2:${h.roof}"><span style="width:130px">${h.emoji} ${esc(h.name)}</span><span class="bar"><i style="width:${(n / max) * 100}%"></i></span><b>${n}</b></div>`).join("") || '<div class="empty">الشجرة لسا صغيرة… ابدأوا بأول ذكرى!</div>'}`);
  }

  /* ---------- الحديقة (لعبة الذاكرة) ---------- */
  let game;
  function garden() {
    const best = P.bestOf(db.uid), his = db.partner ? P.bestOf(db.partner.id) : 0;
    ui.openModal(`<h3>🌷 الحديقة</h3><p class="hint">لاقوا كل الأزواج بأقل حركات! 🎮</p>
      <div class="row hint"><span>أفضل نتيجة إلي: ${best || "—"}</span>${db.partner ? `<span>${esc(partner())}: ${his || "—"}</span>` : ""}<span id="gMoves">الحركات: 0</span></div>
      <div class="game" id="gGrid"></div><button class="btn alt" data-act="game-new">لعبة جديدة 🔄</button>`);
    newGame();
  }
  P.bestOf = (uid) => ((db.kv["me:" + uid] || {}).game) || 0;
  function newGame() {
    const em = ["💖", "🌹", "🎵", "📷", "🦋", "☕", "⭐", "🏡"];
    const deck = em.concat(em).sort(() => Math.random() - 0.5);
    game = { deck, open: [], matched: new Set(), moves: 0, lock: false };
    $("#gGrid").innerHTML = deck.map((e, i) => `<button class="gcard" data-act="gcard" data-i="${i}" aria-label="ورقة"><span>${e}</span></button>`).join("");
    $("#gMoves").textContent = "الحركات: 0";
  }
  function flip(i, el) {
    if (game.lock || game.matched.has(i) || game.open.includes(i)) return;
    el.classList.add("up"); game.open.push(i); OSW.audio.sfx("pop");
    if (game.open.length === 2) {
      game.moves++; $("#gMoves").textContent = "الحركات: " + game.moves;
      const [a, b] = game.open;
      if (game.deck[a] === game.deck[b]) {
        game.matched.add(a); game.matched.add(b); game.open = [];
        $$(".gcard").filter((c) => game.matched.has(+c.dataset.i)).forEach((c) => { c.classList.remove("up"); c.classList.add("ok"); });
        OSW.audio.sfx("coin");
        if (game.matched.size === 16) {
          ui.hearts("🌷", 14); OSW.audio.sfx("fanfare");
          const best = P.bestOf(db.uid);
          if (!best || game.moves < best) { ui.saveMy({ game: game.moves }); ui.toast(`رقم قياسي جديد: ${game.moves} حركة! 🏆`, "gold"); }
          else ui.toast(`خلّصتها بـ ${game.moves} حركة 🎉`);
        }
      } else {
        game.lock = true;
        setTimeout(() => { $$(".gcard").forEach((c) => { if (!game.matched.has(+c.dataset.i)) c.classList.remove("up"); }); game.open = []; game.lock = false; }, 800);
      }
    }
  }

  /* ---------- المنارة ---------- */
  P.lighthouseLit = () => { const l = ents("light")[0]; return !!l && Date.now() - new Date(l.created_at).getTime() < 24 * 3600 * 1000; };
  function lighthouse() {
    const notes = ents("light").slice(0, 10), lit = P.lighthouseLit();
    ui.openModal(`<h3>🔦 المنارة</h3><p class="hint">${lit ? "المنارة مضيئة هلأ 🌟 لأن حدا كتب كلمة حلوة آخر 24 ساعة." : "المنارة مطفية… اكتب كلمة حلوة وضوّيها!"}</p>
      <div class="row"><input class="in" id="lightText" maxlength="160" placeholder="اكتب كلمة حلوة أو شي إيجابي…" style="flex:1"><button class="btn gold" data-act="light-add">ضوّي 🔦</button></div>
      <div class="feed" style="margin-top:12px;max-height:320px">${notes.map((n) => `<div><b style="color:${esc(ui.prof(n.author).color)}">${esc(ui.prof(n.author).name)}</b>: ${nl2br(n.body)}<small>${timeAgo(n.created_at)}</small></div>`).join("") || "<div>ما في كلمات لسا</div>"}</div>`);
  }

  /* ---------- البوابة / القائمة ---------- */
  function gate() {
    const me = db.me, pal = OSW.PALETTES, wm = OSW.world.weather, lk = OSW.app.lookOf(db.uid);
    P.draft = { gender: lk.gender, hairStyle: lk.hairStyle, skin: lk.skin };
    const sw = (arr, cur, k) => arr.map((c) => `<button style="background:${c}" class="${cur === c ? "on" : ""}" data-act="prof-pick" data-k="${k}" data-v="${c}" aria-label="${c}"></button>`).join("");
    const seg = (arr, cur, k) => arr.map(([v, t]) => `<button class="${cur === v ? "on" : ""}" data-act="look-pick" data-k="${k}" data-v="${v}">${t}</button>`).join("");
    ui.openModal(`<h3>🚪 البوابة</h3>
      ${db.mode === "demo" ? `<div class="demo-banner">أنت بالوضع التجريبي: البيانات محفوظة عالجهاز بس. اربط Supabase (شوف README) عشان تشتغلوا سوا من تلفونين.</div>` : ""}
      <div class="field"><label>اسمك بالقرية</label><input class="in" id="profName" value="${esc(me.name)}" maxlength="20"></div>
      <div class="field"><label>الشخصية</label><div class="seg">${seg([["boy", "ولد 👦"], ["girl", "بنت 👧"]], P.draft.gender, "gender")}</div></div>
      <div class="field"><label>تسريحة الشعر</label><div class="seg">${seg(pal.styles, P.draft.hairStyle, "hairStyle")}</div></div>
      <div class="field"><label>لون ملابسك</label><div class="swatches">${sw(pal.shirts, me.color, "color")}</div></div>
      <div class="field"><label>لون الشعر / الحجاب</label><div class="swatches">${sw(pal.hairs, me.hair, "hair")}</div></div>
      <div class="field"><label>لون البشرة</label><div class="swatches">${sw(pal.skins, P.draft.skin, "skin")}</div></div>
      <button class="btn" data-act="prof-save">حفظ</button>
      <div class="sep"></div>
      <div class="field"><label>الطقس</label><div class="seg">${[["auto", "تلقائي"], ["clear", "صافي"], ["rain", "مطر 🌧️"], ["snow", "ثلج ❄️"]].map(([k, t]) => `<button class="${wm === k ? "on" : ""}" data-act="weather" data-k="${k}">${t}</button>`).join("")}</div></div>
      <div class="row">
        <button class="btn alt" data-act="notif">🔔 تفعيل الإشعارات</button>
        ${window.__installPrompt ? `<button class="btn gold" data-act="install">📲 ثبّت التطبيق</button>` : ""}
        <button class="btn alt" data-act="export">💾 نسخة احتياطية</button>
      </div>
      <p class="hint">الإشعارات بتظهر لما التطبيق مفتوح بالخلفية. للإشعارات والتطبيق مسكّر بتحتاج خطوة إضافية (شوف README).</p>
      <div class="sep"></div>
      <div class="row">${db.mode === "demo" ? `<button class="btn alt" data-act="switch-user">🔁 بدّل الحساب (تجريبي)</button>` : ""}<button class="btn alt" data-act="logout">تسجيل خروج</button></div>`);
  }

  /* ---------- الإنجازات ---------- */
  const cnt = (h) => db.entries.filter((e) => e.house === h).length;
  P.ACH = [
    ["visit", "👋", "أول زيارة", "دخلت القرية", () => true],
    ["mem1", "📷", "أول ذكرى", "سجّلتوا ذكرى", () => cnt("memories") >= 1],
    ["mem10", "🎞️", "عشر ذكريات", "10 ذكريات بالبيت", () => cnt("memories") >= 10],
    ["mem50", "🏛️", "خمسين ذكرى", "50 ذكرى!", () => cnt("memories") >= 50],
    ["letter1", "✉️", "أول رسالة", "كتبتوا رسالة", () => cnt("letters") >= 1],
    ["because10", "💗", "عشرة أسباب", "10 أسباب للحب", () => cnt("because") >= 10],
    ["dream1", "🌠", "أول حلم", "كتبتوا حلم مشترك", () => cnt("dreams") >= 1],
    ["dreamDone", "🏆", "حلم اتحقق", "علّمتوا نجمة", () => db.entries.some((e) => e.house === "dreams" && e.data && e.data.done)],
    ["song", "🎵", "أغنيتنا", "اخترتوا أغنيتكم", () => db.entries.some((e) => e.house === "songs" && e.data && e.data.ours)],
    ["photos10", "🖼️", "ألبوم صغير", "10 صور", () => db.entries.filter((e) => e.house === "photos").reduce((a, e) => a + (e.media_count || 0), 0) >= 10],
    ["d30", "🌙", "شهر معاً", "30 يوم", () => (P.days() || 0) >= 30],
    ["d100", "💯", "مية يوم", "100 يوم معاً", () => (P.days() || 0) >= 100],
    ["d365", "🎉", "سنة كاملة", "365 يوم معاً", () => (P.days() || 0) >= 365],
    ["allhouses", "🏘️", "زرت كل البيوت", "دخلت كل بيت", () => OSW.HOUSES.every((h) => ui.my().visited.includes(h.id))],
    ["treasure", "🧭", "صيّاد الكنوز", "لقيت كل العناصر المخفية", () => OSW.HIDDEN.every((o) => ui.my().found.includes(o.id))],
    ["qa7", "❓", "سبعة أسئلة", "جاوبتوا 7 أسئلة بالنافورة", () => new Set(db.entries.filter((e) => e.house === "fountain").map((e) => e.data.day)).size >= 7],
    ["story", "✍️", "حكاية مشتركة", "كمّلتوا حكاية سوا", () => db.entries.some((e) => e.house === "comment" && e.data.kind === "continue")],
    ["peace", "🕊️", "صلحنا", "حليتوا خلاف", () => db.entries.some((e) => e.house === "fights" && e.data && e.data.resolved)],
    ["light", "🔦", "منارة مضيئة", "ضوّيتوا المنارة", () => cnt("light") >= 1],
    ["wish", "⛲", "أمنية", "رميتوا عملة بالنافورة", () => cnt("wish") >= 1],
    ["capsule", "⏳", "كبسولة مدفونة", "دفنتوا كبسولة زمنية", () => cnt("capsule") >= 1],
    ["farm1", "🌾", "أول حصاد", "قطفتوا أول محصول", () => OSW.game.state().harvests >= 1],
    ["rich", "💰", "أغنياء القرية", "جمعتوا 300 كوين", () => OSW.game.state().coins >= 300],
    ["streak7", "🌹", "ورد أسبوع", "سقيتوا الورد 7 أيام ورا بعض", () => OSW.game.state().streak >= 7 && OSW.game.view().streak >= 7],
    ["bless3", "🤲", "دعوة الحجّي", "نلتوا بركة الحجّي 3 أيام", () => Object.keys(OSW.game.state().blessed).length >= 3],
    ["gift1", "🎁", "هدية من القلب", "أرسلتوا هدية", () => OSW.game.state().gifts.length >= 1],
    ["order3", "📋", "خدّام أهل القرية", "سلّمتوا 3 طلبات", () => Object.keys(OSW.game.state().orders).length >= 3],
    ["perfect", "🌟", "يوم مثالي", "خلّصتوا كل مهام اليوم", () => OSW.game.perfectToday()],
    ["night", "🦉", "سهرانين", "دخلت القرية بعد منتصف الليل", () => { const h = new Date().getHours(); return h >= 0 && h < 4; }],
  ];
  function ach() {
    const got = new Set(ui.my().ach);
    ui.openModal(`<h3>🏅 الإنجازات</h3><p class="hint">${got.size} من ${P.ACH.length}</p><div class="ach-grid">${P.ACH.map(([id, e, t, d]) => `<div class="ach ${got.has(id) ? "" : "lock"}"><span class="e">${e}</span><b>${t}</b>${d}</div>`).join("")}</div>`);
  }
  P.checkAchievements = () => {
    if (!db.me) return;
    const my = ui.my(), got = new Set(my.ach), fresh = [];
    P.ACH.forEach(([id, e, t, d, test]) => { if (!got.has(id)) { let ok = false; try { ok = test(); } catch (_) {} if (ok) { fresh.push(id); got.add(id); } } });
    if (!fresh.length) return;
    ui.saveMy({ ach: Array.from(got) });
    fresh.forEach((id, i) => {
      const a = P.ACH.find((x) => x[0] === id);
      if (id === "visit" && fresh.length > 1) return;
      setTimeout(() => { ui.toast(`${a[1]} إنجاز جديد: <b>${a[2]}</b>`, "gold", 4200); OSW.audio.sfx("fanfare"); if (id !== "visit") ui.hearts(a[1], 12); }, 600 + i * 1400);
    });
  };

  /* ---------- النقرات داخل النوافذ ---------- */
  P.click = (a, el) => {
    switch (a) {
      case "fq-save": { const t = $("#fqText"); const txt = (t.value || "").trim(); if (!txt) return; return busy(async () => { await db.addEntry({ house: "fountain", body: txt, data: { day: OSW.todayKey(), q: OSW.DAILY_Q[dayIndex() % OSW.DAILY_Q.length] } }); OSW.audio.sfx("magic"); ui.hearts("💧", 8); fountain(); P.checkAchievements(); }); }
      case "sweet": { const o = $("#sweetOut"); o.style.display = ""; o.textContent = rand(OSW.SWEET); OSW.audio.sfx("heart"); return; }
      case "wish": { const t = $("#wishText"); const txt = (t.value || "").trim(); if (!txt) return ui.toast("اكتب أمنيتك أول ✨"); return busy(async () => { await db.addEntry({ house: "wish", body: txt }); OSW.audio.sfx("coin"); ui.hearts("🪙", 8); fountain(); P.checkAchievements(); }); }
      case "start-save": { const v = $("#startIn").value; if (!v) return; return busy(async () => { await db.kvSet("start_date", { date: v }); ui.toast("انحفظ التاريخ 💞"); OSW.app.updateDays(); plaza(); P.checkAchievements(); }); }
      case "note-add": { const t = $("#noteText"); const txt = (t.value || "").trim(); if (!txt) return; return busy(async () => { await db.addEntry({ house: "board", body: txt }); OSW.audio.sfx("pop"); plaza(); }); }
      case "note-del": return busy(async () => { await db.removeEntry(el.dataset.id); plaza(); });
      case "home-pick": { homeDraft[el.dataset.k] = el.dataset.v; homeDraft.name = ($("#homeName") || {}).value || homeDraft.name; const s = $("#startIn").value; home_keep(s); return; }
      case "home-save": return busy(async () => { const cfg = Object.assign({}, homeDraft, { name: ($("#homeName").value || "").trim() || undefined, flag: homeDraft.emoji }); await db.kvSet("home", cfg); const s = $("#startIn").value; if (s && s !== startDate()) await db.kvSet("start_date", { date: s }); OSW.app.updateHome(); OSW.app.updateDays(); ui.closeModal(); ui.toast("بيتكم صار أحلى 🏡"); P.checkAchievements(); });
      case "game-new": return newGame();
      case "gcard": return flip(+el.dataset.i, el);
      case "light-add": { const t = $("#lightText"); const txt = (t.value || "").trim(); if (!txt) return; return busy(async () => { await db.addEntry({ house: "light", body: txt }); OSW.audio.sfx("magic"); ui.hearts("✨", 10); OSW.app.updateLighthouse(); lighthouse(); P.checkAchievements(); }); }
      case "prof-pick": { const k = el.dataset.k; $$(`[data-act=prof-pick][data-k=${k}]`).forEach((b) => b.classList.toggle("on", b === el)); if (k === "skin") P.draft.skin = el.dataset.v; else db.me[k] = el.dataset.v; return OSW.app.refreshAvatars(P.draft); }
      case "look-pick": { const k = el.dataset.k; $$(`[data-act=look-pick][data-k=${k}]`).forEach((b) => b.classList.toggle("on", b === el)); P.draft[k] = el.dataset.v; return OSW.app.refreshAvatars(P.draft); }
      case "prof-save": return busy(async () => { const name = ($("#profName").value || "").trim() || db.me.name; await db.saveProfile({ name, color: db.me.color, hair: db.me.hair }); await db.kvSet("look:" + db.uid, Object.assign({}, db.kv["look:" + db.uid], P.draft)); OSW.app.refreshAvatars(); ui.toast("انحفظ ✨"); });
      case "weather": OSW.world.setWeather(el.dataset.k); $$("[data-act=weather]").forEach((b) => b.classList.toggle("on", b === el)); return;
      case "notif": return OSW.app.askNotifications();
      case "install": return OSW.app.install();
      case "export": return OSW.app.exportBackup();
      case "switch-user": return db.switchUser && (location.reload());
      case "logout": return db.signOut();
      default: return OSW.game && OSW.game.click(a, el);
    }
  };
  function home_keep(startVal) {
    const keepName = ($("#homeName") || {}).value;
    home(true); $("#homeName").value = keepName; if (startVal) $("#startIn").value = startVal;
  }
  // تبديل الحساب بالتجريبي
  const origClick = P.click;
  P.click = (a, el, ev) => {
    if (a === "switch-user") { db.switchUser(); location.reload(); return; }
    return origClick(a, el, ev);
  };
})();
