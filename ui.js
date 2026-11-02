/* واجهة الغرف والبطاقات والنماذج */
(function () {
  const OSW = window.OSW;
  const { $, $$, esc, nl2br, timeAgo, fmtDate, tpl, rand } = OSW;
  const ui = (OSW.ui = {
    db: null,
    state: { room: null, filter: "all", say: null, pick: null, cafeQ: -1, composer: null, key: null, dec: {}, typing: false, pendingRender: false },
  });
  let db;
  ui.init = (d) => { db = ui.db = d; };

  /* ---------- أدوات صغيرة ---------- */
  ui.toast = (msg, cls = "", ms = 3400) => {
    const t = document.createElement("div"); t.className = "toast " + cls; t.innerHTML = msg;
    $("#toasts").appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, ms);
  };
  ui.hearts = (emoji = "💖", n = 16) => {
    const w = document.createElement("div"); w.className = "hearts";
    for (let i = 0; i < n; i++) { const h = document.createElement("i"); h.textContent = emoji; h.style.left = Math.random() * 100 + "%"; h.style.fontSize = 18 + Math.random() * 26 + "px"; h.style.animationDelay = Math.random() * 0.6 + "s"; w.appendChild(h); }
    document.body.appendChild(w); setTimeout(() => w.remove(), 3400);
  };
  ui.openSheet = (html) => { $("#sheetCard").innerHTML = `<button class="xbtn" data-act="close-sheet" aria-label="إغلاق">✕</button>` + html; $("#sheet").hidden = false; };
  ui.closeSheet = () => { $("#sheet").hidden = true; $("#sheetCard").innerHTML = ""; ui.state.typing = false; if (ui.state.pendingRender) { ui.state.pendingRender = false; ui.room.render(); } };
  ui.openModal = (html) => { $("#modalCard").innerHTML = `<button class="xbtn" data-act="close-modal" aria-label="إغلاق">✕</button>` + html; $("#modal").hidden = false; };
  ui.closeModal = () => { $("#modal").hidden = true; $("#modalCard").innerHTML = ""; if (ui.onModalClose) { const f = ui.onModalClose; ui.onModalClose = null; f(); } };
  ui.prof = (uid) => db.profiles.find((p) => p.id === uid) || { name: "؟", color: "#999" };
  ui.who = (uid) => { const p = ui.prof(uid); return `<span class="who"><i style="background:${esc(p.color)}"></i>${esc(p.name)}</span>`; };
  ui.partnerName = () => (db.partner ? db.partner.name : "حبيبك");
  const byNew = (a, b) => new Date(b.created_at) - new Date(a.created_at);
  const byOld = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  ui.entries = (house) => db.entries.filter((e) => e.house === house).sort(byNew);
  ui.comments = (id) => db.entries.filter((e) => e.house === "comment" && e.data && e.data.parent === id).sort(byOld);
  ui.reacts = (id) => db.reactions.filter((r) => r.entry_id === id);
  const isLocked = (e) => e.unlock_at && new Date(e.unlock_at) > new Date();
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
  const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const stars = (n) => `<span class="stars">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= n ? "on" : ""}">★</span>`).join("")}</span>`;

  /* ---------- حالة خاصة بي (زيارات، كنوز، آخر مرة شفت) ---------- */
  ui.myKey = () => "me:" + db.uid;
  ui.my = () => Object.assign({ visited: [], found: [], seen: {}, ach: [], game: 0 }, db.kv[ui.myKey()] || {});
  ui.saveMy = (patch) => db.kvSet(ui.myKey(), Object.assign(ui.my(), patch));
  let seenTimer;
  ui.markSeen = (house) => {
    const my = ui.my(); my.seen = Object.assign({}, my.seen, { [house]: new Date().toISOString() });
    if (!my.visited.includes(house)) my.visited = my.visited.concat(house);
    db.kv[ui.myKey()] = my; // محلياً أولاً
    clearTimeout(seenTimer); seenTimer = setTimeout(() => db.kvSet(ui.myKey(), my), 1200);
  };
  ui.unread = (house) => {
    const seen = ui.my().seen[house];
    return db.entries.filter((e) => e.house === house && e.author !== db.uid && (!seen || new Date(e.created_at) > new Date(seen))).length;
  };

  /* ---------- التشفير (بيت الأسرار) ---------- */
  const b64e = (u8) => btoa(String.fromCharCode(...u8));
  const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const te = new TextEncoder(), td = new TextDecoder();
  async function deriveKey(pass, saltB64) {
    if (!(window.crypto && crypto.subtle)) throw new Error("التشفير بيحتاج رابط https");
    const km = await crypto.subtle.importKey("raw", te.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64d(saltB64), iterations: 250000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function enc(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(JSON.stringify(obj))));
    const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length);
    return b64e(out);
  }
  async function dec(key, b64) {
    const raw = b64d(b64);
    return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, key, raw.slice(12))));
  }
  ui.secretSetup = async (pass) => {
    const salt = b64e(crypto.getRandomValues(new Uint8Array(16)));
    const key = await deriveKey(pass, salt);
    await db.kvSet("secret_check", { salt, check: await enc(key, { ok: 1 }) });
    ui.state.key = key;
  };
  ui.secretUnlock = async (pass) => {
    const c = db.kv.secret_check;
    const key = await deriveKey(pass, c.salt);
    try { await dec(key, c.check); } catch (e) { throw new Error("كلمة السر غلط"); }
    ui.state.key = key;
  };
  async function decryptAll() {
    if (!ui.state.key) return;
    for (const e of ui.entries("secrets")) {
      if (ui.state.dec[e.id] || !(e.data && e.data.enc)) continue;
      try { ui.state.dec[e.id] = await dec(ui.state.key, e.body); } catch (err) { ui.state.dec[e.id] = { title: "⚠️ ما انفكّ تشفيره", body: "" }; }
    }
  }

  /* ---------- الصور ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((list) => list.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); loadPics(en.target); } }), { rootMargin: "300px" }) : null;
  async function loadPics(el) {
    const id = el.dataset.media;
    try {
      const arr = await db.getMedia(id);
      el.innerHTML = arr.map((s, i) => `<img src="${s}" alt="صورة" data-act="zoom" data-id="${id}" data-i="${i}">`).join("");
    } catch (e) { el.innerHTML = ""; }
  }
  const pics = (e) => (e.media_count > 0 ? `<div class="pics ${e.media_count === 1 ? "one" : ""}" data-media="${e.id}">${'<div class="ph"></div>'.repeat(e.media_count)}</div>` : "");
  function hydrate(root) { $$(".pics[data-media]", root).forEach((el) => (io ? io.observe(el) : loadPics(el))); }
  ui.lightbox = async (id, i) => {
    const arr = await db.getMedia(id); if (!arr.length) return;
    let idx = i; const lb = $("#lightbox");
    const show = () => {
      lb.innerHTML = `<img src="${arr[idx]}" alt=""><button class="lbx" data-lb="x" aria-label="إغلاق">✕</button>${arr.length > 1 ? `<button class="lbn" data-lb="n" aria-label="التالية">‹</button><button class="lbp" data-lb="p" aria-label="السابقة">›</button>` : ""}`;
    };
    lb.hidden = false; show();
    lb.onclick = (ev) => {
      const t = ev.target.closest("[data-lb]"); const k = t && t.dataset.lb;
      if (k === "n") { idx = (idx + 1) % arr.length; show(); } else if (k === "p") { idx = (idx - 1 + arr.length) % arr.length; show(); }
      else { lb.hidden = true; lb.innerHTML = ""; }
    };
  };

  /* ---------- أجزاء البطاقة ---------- */
  function reactBar(e) {
    const rs = ui.reacts(e.id);
    return `<div class="react-bar">${OSW.REACTIONS.map((em) => {
      const l = rs.filter((r) => r.emoji === em), on = l.some((r) => r.author === db.uid);
      return `<button class="rx ${on ? "on" : ""}" data-act="react" data-id="${e.id}" data-e="${em}" title="${esc(l.map((r) => ui.prof(r.author).name).join("، "))}" aria-label="${em}">${em}${l.length ? `<small>${l.length}</small>` : ""}</button>`;
    }).join("")}</div>`;
  }
  function commentsBlock(e, h) {
    const cfg = h.comment || { kind: "comment", label: "علّق", ph: "اكتب تعليقك…" };
    const cs = ui.comments(e.id);
    const open = ui.state.composer === e.id;
    return `<div class="comments">${cs.map((c) => {
      const p = ui.prof(c.author);
      return `<div class="cm ${esc(c.data.kind || "")}" style="--cc:${esc(p.color)}"><div class="who"><i style="background:${esc(p.color)}"></i>${esc(p.name)}${c.data.kind === "feel" ? " · شعوره بالذكرى" : c.data.kind === "pov" ? " · من وجهة نظره" : c.data.kind === "continue" ? " · كمّل الحكاية" : ""}</div>${nl2br(c.body)}${c.author === db.uid ? `<button class="del" data-act="cm-del" data-id="${c.id}" aria-label="حذف">🗑️</button>` : ""}</div>`;
    }).join("")}${open
      ? `<div class="cform"><textarea id="cmText" rows="2" placeholder="${esc(cfg.ph)}"></textarea><button class="btn sm" data-act="cm-send" data-id="${e.id}" data-kind="${cfg.kind}">أرسل</button></div>`
      : `<div><button class="link-btn" data-act="cm-open" data-id="${e.id}">💬 ${cfg.label}</button></div>`}</div>`;
  }
  function shell(e, h, inner, o = {}) {
    const mine = e.author === db.uid, p = ui.prof(e.author);
    const menu = mine ? `<span class="cmenu">${o.noEdit ? "" : `<button data-act="edit" data-id="${e.id}" aria-label="تعديل">✏️</button>`}<button data-act="del" data-id="${e.id}" aria-label="حذف">🗑️</button></span>` : "";
    return `<article class="card ${h.card} ${mine ? "mine" : ""} ${o.cls || ""}" data-id="${e.id}" style="--cc:${esc(p.color)};${o.style || ""}"><div class="chead">${ui.who(e.author)}<span>${timeAgo(e.created_at)}</span>${menu}</div>${inner}${o.noReact ? "" : reactBar(e)}${o.noComments ? "" : commentsBlock(e, h)}</article>`;
  }
  const dateTag = (e) => (e.data && e.data.when ? `<span class="tag">📅 ${fmtDate(e.data.when)}</span>` : "");
  const body = (e, cls = "") => (e.body ? `<div class="cbody ${cls}">${nl2br(e.body)}</div>` : "");

  /* ---------- رسم كل نوع بطاقة ---------- */
  const CARD = {
    first: (e, h) => shell(e, h, `<h3 class="ctitle">${esc(e.title)}</h3><div class="meta">${dateTag(e)}</div>${body(e)}${pics(e)}`),
    memory: (e, h) => shell(e, h, `<div class="row"><span class="mood-big">${esc((e.data && e.data.mood) || "💗")}</span><h3 class="ctitle">${esc(e.title)}</h3></div><div class="meta">${dateTag(e)}</div>${body(e)}${pics(e)}`),
    moment: (e, h) => shell(e, h, `<h3 class="ctitle">${esc(e.title)}</h3><div class="meta">${dateTag(e)}</div>${body(e)}${pics(e)}`),
    letter: (e, h) => {
      const mine = e.author === db.uid, locked = isLocked(e);
      let rcpt = "";
      if (mine && !e.private) { const r = db.reads.find((x) => x.entry_id === e.id && x.user_id !== db.uid); rcpt = r ? `<span class="read-ok">✓✓ قرأها ${timeAgo(r.read_at)}</span>` : `<span class="hint">✓ وصلت (لسا ما انقرأت)</span>`; }
      if (!mine && !locked) ui._toRead.push(e.id);
      const to = e.private ? "🔒 لنفسي" : mine ? `✉️ إلى ${esc(ui.partnerName())}` : "✉️ إلك";
      return shell(e, h, `<h3 class="ctitle">${esc(e.title)}</h3><div class="meta"><span class="tag">${to}</span>${locked ? `<span class="tag">⏳ تنفتح بعد ${OSW.countdown(e.unlock_at)}</span>` : e.unlock_at ? `<span class="tag">🎉 انفتحت</span>` : ""}</div><div class="cbody">${nl2br(e.body)}</div>${rcpt}`, { noComments: true });
    },
    dream: (e, h) => {
      const done = e.data && e.data.done;
      return shell(e, h, `<div class="drow"><button class="star-btn" data-act="dream-toggle" data-id="${e.id}" aria-label="علّم كمتحقق">⭐</button><div><h3 class="ctitle">${esc(e.title)}</h3><div class="meta">${e.data.cat ? `<span class="tag">${esc(e.data.cat)}</span>` : ""}${done ? `<span class="badge-ok">اتحقق 🎉 ${e.data.done_at ? fmtDate(e.data.done_at) : ""}</span>` : ""}</div></div></div>${body(e, "small")}`, { cls: done ? "done" : "" });
    },
    song: (e, h) => {
      const q = encodeURIComponent((e.title || "") + " " + ((e.data && e.data.artist) || ""));
      const link = safeUrl(e.data && e.data.link) || `https://www.youtube.com/results?search_query=${q}`;
      return shell(e, h, `<div class="song-row"><div class="vinyl"></div><div><h3 class="ctitle">${esc(e.title)}</h3><div>${esc((e.data && e.data.artist) || "")}</div>${e.data && e.data.ours ? `<span class="ours">⭐ أغنيتنا</span>` : ""}</div></div>${body(e, "small")}<div><a class="btn gold sm" href="${esc(link)}" target="_blank" rel="noopener noreferrer">▶ شغّلها</a></div>`);
    },
    photo: (e, h) => shell(e, h, `${pics(e)}<h3 class="ctitle">${esc(e.title)}</h3><div class="meta">${dateTag(e)}</div>${body(e, "small")}`, { cls: "polaroid", style: `--rot:${(hash(e.id) % 5) - 2}deg` }),
    because: (e) => {
      const p = ui.prof(e.author), cols = ["#fff3a0", "#ffc2d6", "#bfe9ff", "#c9f2c7", "#e1ccff", "#ffd9a8"];
      const n = ui.reacts(e.id).filter((r) => r.emoji === "❤️"), on = n.some((r) => r.author === db.uid);
      return `<div class="note" data-id="${e.id}" style="--nc:${cols[hash(e.id) % 6]};--rot:${(hash(e.id) % 7) - 3}deg"><div>بحبك لأنو… ${nl2br(e.body)}</div><div class="nf"><span>— ${esc(p.name)}</span><span><button class="rx ${on ? "on" : ""}" data-act="react" data-id="${e.id}" data-e="❤️">❤️${n.length ? `<small>${n.length}</small>` : ""}</button>${e.author === db.uid ? `<button data-act="del" data-id="${e.id}" aria-label="حذف">🗑️</button>` : ""}</span></div></div>`;
    },
    fight: (e, h) => {
      const d = e.data || {}, col = (t, v) => (v ? `<div class="fcol"><b>${t}</b>${nl2br(v)}</div>` : "");
      return shell(e, h, `<h3 class="ctitle">${esc(e.title)}</h3>${d.resolved ? `<span class="badge-ok">انحلّت ✅</span>` : `<button class="btn alt sm" data-act="fight-toggle" data-id="${e.id}">علّمها كمنحلّة ✅</button>`}<div class="cols">${col("شو زعّل", e.body)}${col("كيف صالحنا بعض", d.fix)}${col("شو تعلّمنا", d.lesson)}</div>`);
    },
    secret: (e, h) => {
      const d = ui.state.dec[e.id];
      if (!ui.state.key || !d) return shell(e, h, `<h3 class="ctitle">🔒 سر مقفول</h3><div class="hint">افتح البيت بكلمة السر لتشوفه.</div>`, { noReact: true, noComments: true, noEdit: true });
      return shell(e, h, `<h3 class="ctitle">${esc(d.title)}</h3><div class="cbody">${nl2br(d.body)}</div>`, { noComments: true });
    },
    story: (e, h) => shell(e, h, `<h3 class="ctitle">${esc(e.title)}</h3>${body(e)}`),
    laugh: (e, h) => shell(e, h, `${body(e)}${pics(e)}`, { noComments: true }),
    quote: (e, h) => shell(e, h, `<div class="qtxt">${nl2br(e.body)}</div>${e.data.by ? `<div class="qby">— ${esc(e.data.by)}</div>` : ""}${e.data.why ? `<div class="cbody small">${nl2br(e.data.why)}</div>` : ""}`, { noComments: true }),
    library: (e, h) => {
      const r = (e.data && e.data.ratings) || {}, mine = r[db.uid] || 0, other = db.partner ? r[db.partner.id] || 0 : 0;
      const rate = `<span class="stars">${[1, 2, 3, 4, 5].map((i) => `<button class="${i <= mine ? "on" : ""}" data-act="rate" data-id="${e.id}" data-n="${i}" aria-label="${i}">★</button>`).join("")}</span>`;
      return shell(e, h, `<div class="meta"><span class="tag">${esc(e.data.kind || "")}</span><span class="tag">${e.data.status === "done" ? "خلّصناه ✅" : "بالانتظار"}</span></div><h3 class="ctitle">${esc(e.title)}</h3>${body(e)}<div class="row"><span>تقييمي:</span>${rate}</div>${db.partner ? `<div class="row hint"><span>تقييم ${esc(db.partner.name)}:</span>${other ? stars(other) : "لسا ما قيّم"}</div>` : ""}${e.data.status !== "done" ? `<div><button class="btn alt sm" data-act="lib-done" data-id="${e.id}">خلّصناه ✅</button></div>` : ""}`, { noComments: true });
    },
    trip: (e, h) => {
      const done = e.data.status === "done";
      return shell(e, h, `<div class="meta"><span class="tag">${done ? "رحنا ✅" : "بدنا نروح 🧳"}</span>${dateTag(e)}</div><h3 class="ctitle">${esc(e.title)}</h3>${body(e)}${pics(e)}${done ? "" : `<div><button class="btn alt sm" data-act="trip-toggle" data-id="${e.id}">رحنا فعلاً! ✅</button></div>`}`);
    },
    capsule: (e, h) => capsuleLike(e, h, "⏳"),
    surprise: (e, h) => capsuleLike(e, h, "🎁"),
    qa: (e, h) => shell(e, h, `<div class="q">${esc((e.data && e.data.q) || e.title)}</div><div class="cbody">${nl2br(e.body)}</div>`, { noComments: true }),
  };
  function capsuleLike(e, h, em) {
    const locked = isLocked(e);
    return shell(e, h, `<h3 class="ctitle">${em} ${esc(e.title)}</h3><div class="meta">${locked ? `<span class="tag">⏳ تنفتح بعد ${OSW.countdown(e.unlock_at)}</span>` : `<span class="tag">🎉 انفتحت!</span>`}</div><div class="cbody">${nl2br(e.body)}</div>${pics(e)}`, { noComments: true });
  }
  function sealedCard(s, h) {
    const p = ui.prof(s.author);
    return `<article class="card sealed"><div class="seal"><span class="env">${h.id === "letters" ? "💌" : h.id === "capsule" ? "⏳" : "🎁"}</span><div><b>${esc(p.name)} خبّى إلك شي!</b><div class="hint">بينفتح بعد ${OSW.countdown(s.unlock_at)} · ${OSW.fmtDate(s.unlock_at)}</div></div></div></article>`;
  }

  /* ---------- الفلاتر (التبويبات) ---------- */
  function tabsFor(h) {
    const mineF = (e) => e.author === db.uid, hisF = (e) => e.author !== db.uid, pn = ui.partnerName();
    if (h.id === "dreams") return [["all", "الكل", () => true], ["todo", "لسا ⏳", (e) => !(e.data && e.data.done)], ["done", "اتحققت 🎉", (e) => e.data && e.data.done]];
    if (h.id === "station") return [["all", "الكل", () => true], ["planned", "بدنا نروح", (e) => e.data.status !== "done"], ["done", "رحنا", (e) => e.data.status === "done"]];
    if (h.id === "library") return [["all", "الكل", () => true]].concat(["فيلم 🎬", "مسلسل 📺", "كتاب 📖", "برنامج 🎙️", "لعبة 🎮"].map((k) => [k, k, (e) => e.data.kind === k]));
    if (h.id === "letters") return [["all", "الكل", () => true], ["in", "الواردة", (e) => !mineF(e)], ["out", "المرسلة", (e) => mineF(e) && !e.private], ["self", "لنفسي", (e) => e.private]];
    if (h.id === "songs") return [["all", "الكل", () => true], ["ours", "أغنيتنا ⭐", (e) => e.data.ours], ["mine", "إلي", mineF], ["his", pn, hisF]];
    return [["all", "الكل", () => true], ["mine", "إلي", mineF], ["his", pn, hisF]];
  }

  /* ---------- الغرفة ---------- */
  const room = (ui.room = {});
  room.open = (id) => {
    const h = OSW.HOUSE[id]; if (!h) return;
    const st = ui.state; st.room = id; st.filter = "all"; st.pick = null; st.composer = null;
    st.say = rand(h.resident.lines);
    const r = $("#room");
    r.style.setProperty("--h1", h.wall); r.style.setProperty("--h2", h.roof);
    r.classList.remove("out"); r.hidden = false;
    ui.markSeen(id); db.track && db.track(id);
    room.render(); $("#roomBody").scrollTop = 0;
  };
  room.close = () => {
    const r = $("#room"); ui.state.room = null; r.hidden = true; $("#roomBody").innerHTML = ""; db.track && db.track("village");
  };
  room.render = async () => {
    const st = ui.state, h = OSW.HOUSE[st.room]; if (!h) return;
    if (st.typing) { st.pendingRender = true; return; }
    if (h.id === "secrets") await decryptAll();
    if (st.room !== h.id) return;
    ui._toRead = [];
    const tabs = h.special === "cafe" ? [] : tabsFor(h);
    const curTab = tabs.find((t) => t[0] === st.filter) || tabs[0];
    const all = ui.entries(h.id);
    const list = curTab ? all.filter(curTab[2]) : all;
    $("#roomHead").innerHTML = `
      <div class="rh-row"><button class="back" data-act="room-back" aria-label="رجوع">➜</button><h2 class="rh-title">${h.emoji} ${esc(h.name)}</h2>${h.add && h.special !== "secrets" || (h.special === "secrets" && st.key) ? `<button class="addbtn" data-act="add">＋ ${esc(h.add)}</button>` : ""}</div>
      <div class="resident" data-act="res-say"><div class="res-ava">${h.resident.emoji}</div><div class="res-say"><small>${esc(h.resident.name)}</small>${esc(tpl(st.say || "", { partner: ui.partnerName(), me: db.me.name }))}</div></div>
      ${tabs.length > 1 ? `<div class="tabs">${tabs.map((t) => `<button class="tab ${t[0] === (curTab && curTab[0]) ? "on" : ""}" data-act="tab" data-k="${esc(t[0])}">${esc(t[1])}</button>`).join("")}</div>` : ""}`;
    let html = topBlock(h, all);
    const sealed = h.sealed ? db.sealed.filter((s) => s.house === h.id) : [];
    const cards = (h.id === "secrets" && !st.key) ? "" : list.map((e) => (CARD[h.card] || CARD.first)(e, h)).join("");
    const emptyHtml = `<div class="empty"><span class="big">${h.emoji}</span>${esc(h.empty)}</div>`;
    const inner = sealed.map((s) => sealedCard(s, h)).join("") + (cards || (sealed.length || (h.id === "secrets" && !st.key) ? "" : emptyHtml));
    html += h.card === "because" ? `<div class="note-wall">${cards || emptyHtml}</div>` : inner;
    const keepScroll = $("#roomBody").scrollTop;
    $("#roomBody").innerHTML = `<div class="room-inner">${html}</div>`;
    $("#roomBody").scrollTop = keepScroll;
    hydrate($("#roomBody"));
    (ui._toRead || []).forEach((id) => db.markRead(id));
  };
  let renderTimer;
  room.refreshSoon = () => { if (!ui.state.room) return; clearTimeout(renderTimer); renderTimer = setTimeout(room.render, 120); };

  function topBlock(h, all) {
    const st = ui.state;
    if (h.id === "because") {
      const pick = st.pick && all.find((e) => e.id === st.pick);
      return `<div class="top-block"><div class="row"><b>💗 ${all.length} سبب للحب</b><button class="btn berry sm" data-act="rand-because">اسحب سبب عشوائي</button></div>${pick ? `<div class="pick">بحبك لأنو… ${nl2br(pick.body)}<div class="hint">— ${esc(ui.prof(pick.author).name)}</div></div>` : ""}</div>`;
    }
    if (h.id === "laugh") {
      const pick = st.pick && all.find((e) => e.id === st.pick);
      return `<div class="top-block"><div class="row"><b>😂 ${all.length} ضحكة</b><button class="btn gold sm" data-act="rand-laugh">ضحّكني!</button></div>${pick ? `<div class="pick">${pick.body ? nl2br(pick.body) : "🖼️ شوف الميم تحت 👇"}</div>` : ""}</div>`;
    }
    if (h.id === "dreams") {
      const done = all.filter((e) => e.data && e.data.done).length, pc = all.length ? Math.round((done / all.length) * 100) : 0;
      return `<div class="top-block"><div class="row"><b>🌠 ${done} من ${all.length} اتحقق</b></div><div class="progress"><i style="width:${pc}%"></i></div></div>`;
    }
    if (h.id === "cafe") {
      if (st.cafeQ < 0) st.cafeQ = Math.floor(Math.random() * OSW.CAFE_Q.length);
      return `<div class="top-block"><div class="qbox"><div class="q">${esc(OSW.CAFE_Q[st.cafeQ])}</div></div><textarea id="qaText" class="in" rows="3" placeholder="جاوب بصراحة…"></textarea><div class="row"><button class="btn" data-act="qa-save">خزّن جوابي</button><button class="btn alt" data-act="qa-next">سؤال ثاني 🔄</button></div></div>`;
    }
    if (h.id === "secrets") {
      if (!window.crypto || !crypto.subtle) return `<div class="top-block"><b>⚠️ التشفير ما بيشتغل هون</b><div class="hint">لازم الموقع يكون على رابط https (مثل Netlify أو Vercel).</div></div>`;
      if (!db.kv.secret_check) return `<div class="top-block"><b>🔐 حدّدوا كلمة سر الأسرار</b><div class="hint">كلمة السر ما بتنبعت لأي مكان، وما في طريقة نرجّعها إذا نسيتوها. اتفقوا عليها بينكم (مثلاً مرة وانتم مع بعض).</div><input class="in" type="password" id="sPass" placeholder="كلمة السر"><input class="in" type="password" id="sPass2" placeholder="أعد كتابتها"><div id="sErr" class="err"></div><button class="btn" data-act="secret-setup">تفعيل</button></div>`;
      if (!st.key) return `<div class="top-block"><b>🔒 البيت مقفول</b><input class="in" type="password" id="sPass" placeholder="كلمة السر"><div id="sErr" class="err"></div><button class="btn" data-act="secret-open">افتح</button></div>`;
      return `<div class="top-block"><div class="row"><b>🔓 البيت مفتوح (التشفير على جهازك)</b><button class="btn alt sm" data-act="secret-lock">قفل</button></div></div>`;
    }
    return "";
  }

  /* ---------- المحرّر (إضافة/تعديل) ---------- */
  let ed = null;
  function fieldHTML(f, v, h) {
    const id = "f_" + f.k, lab = `<label for="${id}">${esc(f.label)}${f.req ? " *" : ""}</label>`;
    switch (f.type) {
      case "text": case "url":
        return `<div class="field">${lab}<input type="${f.type === "url" ? "url" : "text"}" id="${id}" value="${esc(v || "")}" placeholder="${esc(f.ph || "")}" maxlength="300">${f.chips ? `<div class="chips">${f.chips.map((c) => `<button type="button" data-act="chip" data-t="${id}" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : ""}</div>`;
      case "area": return `<div class="field">${lab}<textarea id="${id}" class="${f.big ? "big" : ""}" placeholder="${esc(f.ph || "")}" maxlength="8000">${esc(v || "")}</textarea></div>`;
      case "date": return `<div class="field">${lab}<input type="date" id="${id}" value="${esc(v || "")}"></div>`;
      case "select": return `<div class="field">${lab}<select id="${id}">${f.opts.map(([k, t]) => `<option value="${esc(k)}" ${k === v ? "selected" : ""}>${esc(tpl(t, { partner: ui.partnerName() }))}</option>`).join("")}</select></div>`;
      case "check": return `<div class="field"><label class="check"><input type="checkbox" id="${id}" ${v ? "checked" : ""}> ${esc(f.label)}</label></div>`;
      case "mood": return `<div class="field">${lab}<input type="hidden" id="${id}" value="${esc(v || "")}"><div class="moods">${OSW.MOODS.map((m) => `<button type="button" class="${m === v ? "on" : ""}" data-act="mood" data-t="${id}" data-v="${m}">${m}</button>`).join("")}</div></div>`;
      case "photos": return `<div class="field">${lab}<div class="thumbs" id="thumbs"></div><div class="hint" id="photoHint">لحد 6 صور — بتنضغط تلقائياً.</div></div>`;
      case "unlock": return `<div class="field">${lab}<input type="date" id="${id}" value="${esc(v || "")}" min="${OSW.todayKey(new Date(Date.now() + 86400000))}"><div class="chips">${f.chips.map(([t, d]) => `<button type="button" data-act="unl" data-t="${id}" data-d="${d}">${esc(t)}</button>`).join("")}</div></div>`;
    }
    return "";
  }
  function renderThumbs() {
    const box = $("#thumbs"); if (!box) return;
    box.innerHTML = ed.media.map((s, i) => `<div class="th"><img src="${s}" alt=""><button type="button" data-act="photo-rm" data-i="${i}" aria-label="حذف">✕</button></div>`).join("") + (ed.media.length < 6 ? `<label class="filebtn" aria-label="أضف صورة">＋<input type="file" id="photoIn" accept="image/*" multiple hidden></label>` : "");
    const inp = $("#photoIn");
    if (inp) inp.onchange = async () => {
      for (const f of Array.from(inp.files)) {
        if (ed.media.length >= 6) break;
        try {
          let s = await OSW.compressImage(f, 1000, 0.72);
          const total = () => ed.media.reduce((a, b) => a + b.length, 0);
          if (total() + s.length > 900000) s = await OSW.compressImage(f, 760, 0.6);
          if (total() + s.length > 900000) { $("#photoHint").textContent = "حجم الصور كبير، جرّب صور أقل."; break; }
          ed.media.push(s);
        } catch (err) { $("#photoHint").textContent = err.message; }
      }
      renderThumbs();
    };
  }
  ui.edit = async (houseId, entry) => {
    const h = OSW.HOUSE[houseId]; if (!h || !h.fields.length) return;
    let dataSrc = entry ? Object.assign({}, entry.data) : {};
    let titleV = entry ? entry.title : "", bodyV = entry ? entry.body : "";
    if (houseId === "secrets") {
      if (!ui.state.key) return ui.toast("افتح البيت بكلمة السر أول 🔒");
      if (entry) { const d = ui.state.dec[entry.id] || { title: "", body: "" }; titleV = d.title; bodyV = d.body; }
    }
    ed = { h, entry, media: [] };
    if (entry && entry.media_count > 0) ed.media = (await db.getMedia(entry.id)).slice();
    const val = (f) => {
      if (f.k === "title") return titleV; if (f.k === "body") return bodyV;
      if (f.k === "unlock_at") return entry && entry.unlock_at ? OSW.todayKey(new Date(entry.unlock_at)) : "";
      if (f.k === "when") return dataSrc.when || (entry ? "" : OSW.todayKey());
      if (f.k in dataSrc) return dataSrc[f.k];
      if (f.type === "select") return f.opts[0][0];
      return "";
    };
    ui.openSheet(`<h3>${h.emoji} ${entry ? "تعديل" : esc(h.add)}</h3>${h.fields.map((f) => fieldHTML(f, val(f), h)).join("")}<div id="edErr" class="err"></div><div class="actions"><button class="btn alt" data-act="close-sheet">إلغاء</button><button class="btn berry" id="edSave" data-act="ed-save">${entry ? "حفظ التعديل" : "حفظ"}</button></div>`);
    ui.state.typing = true;
    if (h.fields.some((f) => f.type === "photos")) renderThumbs();
  };
  async function saveEditor() {
    const { h, entry } = ed, err = (m) => { $("#edErr").textContent = m; };
    const v = {}; let media = null;
    for (const f of h.fields) {
      const el = $("#f_" + f.k);
      if (f.type === "photos") { media = ed.media; continue; }
      v[f.k] = f.type === "check" ? el.checked : (el.value || "").trim();
      if (f.req && !v[f.k]) return err(`حط ${f.label} أول 🙂`);
    }
    if (h.id === "photos" && !(media && media.length)) return err("أضف صورة وحدة على الأقل");
    if (h.id === "laugh" && !v.body && !(media && media.length)) return err("اكتب شي أو نزّل صورة");
    const top = { title: null, body: null, unlock_at: null, private: false, data: Object.assign({}, entry ? entry.data : {}) };
    for (const f of h.fields) {
      if (f.type === "photos") continue;
      if (f.k === "title") top.title = v.title || null;
      else if (f.k === "body") top.body = v.body || null;
      else if (f.k === "unlock_at") top.unlock_at = v.unlock_at ? new Date(v.unlock_at + "T00:00:00").toISOString() : null;
      else top.data[f.k] = v[f.k];
    }
    if (top.unlock_at && new Date(top.unlock_at) <= new Date()) top.unlock_at = null;
    if (h.id === "letters") top.private = v.to === "me";
    if (h.id === "secrets") {
      const payload = await enc(ui.state.key, { title: v.title, body: v.body });
      top.body = payload; top.title = "🔒"; top.data.enc = 1;
      const ex = { title: v.title, body: v.body };
      top._dec = ex;
    }
    if (media) top.media = media;
    const btn = $("#edSave"); btn.disabled = true;
    try {
      let saved;
      const dec2 = top._dec; delete top._dec;
      if (entry) saved = await db.updateEntry(entry.id, top);
      else saved = await db.addEntry(Object.assign({ house: h.id }, top));
      if (dec2) ui.state.dec[saved.id] = dec2;
      ui.closeSheet(); OSW.audio.sfx("page");
      ui.toast(entry ? "انحفظ التعديل ✨" : "انحفظ! 💛", "");
      if (!entry) ui.hearts("💛", 8);
      room.render();
      if (OSW.app) OSW.app.checkAchievements();
    } catch (e) { err(e.message); btn.disabled = false; }
  }

  /* ---------- النقرات ---------- */
  ui._toRead = [];
  const withBusy = async (fn) => { try { await fn(); } catch (e) { ui.toast("⚠️ " + esc(e.message)); } };
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]");
    if (ev.target.id === "sheet") return ui.closeSheet();
    if (ev.target.id === "modal") return ui.closeModal();
    if (!el || el.closest("#world")) return;
    const a = el.dataset.act, id = el.dataset.id, st = ui.state, h = OSW.HOUSE[st.room];
    const entry = id && db.entries.find((e) => e.id === id);
    switch (a) {
      case "close-sheet": return ui.closeSheet();
      case "close-modal": return ui.closeModal();
      case "room-back": return OSW.app && OSW.app.exitHouse();
      case "add": return ui.edit(st.room);
      case "edit": return entry && ui.edit(st.room, entry);
      case "del": if (entry && confirm("متأكد بدك تحذف؟")) withBusy(async () => { await db.removeEntry(id); room.render(); }); return;
      case "ed-save": return withBusy(saveEditor);
      case "chip": { const t = $("#" + el.dataset.t); t.value = el.dataset.v; t.focus(); return; }
      case "mood": { $("#" + el.dataset.t).value = el.dataset.v; $$(".moods button").forEach((b) => b.classList.toggle("on", b === el)); return; }
      case "unl": { const d = new Date(Date.now() + el.dataset.d * 86400000); $("#" + el.dataset.t).value = OSW.todayKey(d); return; }
      case "photo-rm": ed.media.splice(+el.dataset.i, 1); return renderThumbs();
      case "tab": st.filter = el.dataset.k; return room.render();
      case "res-say": st.say = rand(h.resident.lines); OSW.audio.sfx("pop"); return room.render();
      case "zoom": return ui.lightbox(id, +el.dataset.i);
      case "react": return withBusy(async () => { await db.react(id, el.dataset.e); if (el.dataset.e === "❤️" && !el.classList.contains("on")) { OSW.audio.sfx("heart"); ui.hearts("❤️", 7); } room.render(); });
      case "cm-open": st.composer = id; room.render(); setTimeout(() => { const t = $("#cmText"); t && t.focus(); }, 50); return;
      case "cm-send": { const t = $("#cmText"); const txt = (t.value || "").trim(); if (!txt) return; return withBusy(async () => { await db.addEntry({ house: "comment", body: txt, data: { parent: id, kind: el.dataset.kind } }); st.composer = null; st.typing = false; OSW.audio.sfx("pop"); room.render(); OSW.app && OSW.app.checkAchievements(); }); }
      case "cm-del": return withBusy(async () => { await db.removeEntry(id); room.render(); });
      case "dream-toggle": if (!entry) return; return withBusy(async () => { const d = Object.assign({}, entry.data); d.done = !d.done; d.done_at = d.done ? new Date().toISOString() : null; await db.updateEntry(id, { data: d }); if (d.done) { OSW.audio.sfx("fanfare"); ui.hearts("⭐", 18); ui.toast("مبروك! حلم جديد اتحقق 🎉", "gold"); OSW.app && OSW.app.checkAchievements(); } room.render(); });
      case "fight-toggle": return entry && withBusy(async () => { await db.updateEntry(id, { data: Object.assign({}, entry.data, { resolved: true }) }); ui.hearts("🕊️", 10); OSW.app && OSW.app.checkAchievements(); room.render(); });
      case "trip-toggle": return entry && withBusy(async () => { await db.updateEntry(id, { data: Object.assign({}, entry.data, { status: "done" }) }); ui.hearts("🧳", 10); room.render(); });
      case "lib-done": return entry && withBusy(async () => { await db.updateEntry(id, { data: Object.assign({}, entry.data, { status: "done" }) }); room.render(); });
      case "rate": return entry && withBusy(async () => { const r = Object.assign({}, entry.data.ratings, { [db.uid]: +el.dataset.n }); await db.updateEntry(id, { data: Object.assign({}, entry.data, { ratings: r }) }); OSW.audio.sfx("pop"); room.render(); });
      case "rand-because": case "rand-laugh": {
        const all = ui.entries(st.room); if (!all.length) return ui.toast("لسا ما في شي نسحبه 🙂");
        const his = all.filter((e) => e.author !== db.uid), pool = a === "rand-because" && his.length ? his : all;
        st.pick = rand(pool).id; OSW.audio.sfx(a === "rand-because" ? "heart" : "pop"); if (a === "rand-because") ui.hearts("💗", 10); return room.render();
      }
      case "qa-next": st.cafeQ = (st.cafeQ + 1 + Math.floor(Math.random() * 5)) % OSW.CAFE_Q.length; return room.render();
      case "qa-save": { const t = $("#qaText"); const txt = (t.value || "").trim(); if (!txt) return ui.toast("اكتب جوابك أول 🙂"); return withBusy(async () => { await db.addEntry({ house: "cafe", title: OSW.CAFE_Q[st.cafeQ], body: txt, data: { q: OSW.CAFE_Q[st.cafeQ] } }); st.typing = false; OSW.audio.sfx("page"); ui.toast("انحفظ جوابك ☕"); st.cafeQ = (st.cafeQ + 1) % OSW.CAFE_Q.length; room.render(); }); }
      case "secret-setup": { const p1 = $("#sPass").value, p2 = $("#sPass2").value; const er = $("#sErr"); if (p1.length < 4) return (er.textContent = "كلمة السر لازم 4 أحرف على الأقل"); if (p1 !== p2) return (er.textContent = "الكلمتين مش متطابقتين"); el.disabled = true; return ui.secretSetup(p1).then(() => { ui.toast("تفعّل التشفير 🔐"); room.render(); }).catch((e) => { er.textContent = e.message; el.disabled = false; }); }
      case "secret-open": { const er = $("#sErr"); el.disabled = true; return ui.secretUnlock($("#sPass").value).then(() => { OSW.audio.sfx("door"); room.render(); }).catch((e) => { er.textContent = e.message; el.disabled = false; }); }
      case "secret-lock": ui.state.key = null; ui.state.dec = {}; return room.render();
    }
    if (OSW.places && OSW.places.click) OSW.places.click(a, el, ev);
  });
  document.addEventListener("focusin", (e) => { if (e.target.closest("#roomBody") && /TEXTAREA|INPUT/.test(e.target.tagName)) ui.state.typing = true; });
  document.addEventListener("focusout", (e) => {
    if (e.target.closest("#roomBody")) setTimeout(() => { if (!document.activeElement || !document.activeElement.closest("#roomBody")) { ui.state.typing = false; if (ui.state.pendingRender) { ui.state.pendingRender = false; room.render(); } } }, 150);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("#lightbox").hidden) { $("#lightbox").hidden = true; return; }
      if (!$("#sheet").hidden) return ui.closeSheet();
      if (!$("#modal").hidden) return ui.closeModal();
      if (ui.state.room && OSW.app) OSW.app.exitHouse();
    }
  });
  // رسائل مقفلة: نحدّث العدّاد كل نص دقيقة
  setInterval(() => { if (ui.state.room && OSW.HOUSE[ui.state.room].sealed) room.refreshSoon(); }, 30000);
})();
