/* شات بينكم: رسائل فورية + بالونة فوق راس الشخصية */
(function () {
  const OSW = window.OSW, { esc, nl2br, timeAgo } = OSW;
  const C = (OSW.chat = { open: false });
  let db, ui, W;
  const EMO = ["❤️", "😂", "👋", "🥺", "😘", "🔥", "🤗", "😴"];
  C.init = (d, u, w) => {
    db = d; ui = u; W = w;
    document.getElementById("chatForm").onsubmit = (e) => { e.preventDefault(); C.send(document.getElementById("chatIn").value); };
    document.getElementById("chatClose").onclick = () => C.close();
    document.getElementById("chatEmo").innerHTML = EMO.map((e) => `<button type="button" data-e="${e}">${e}</button>`).join("");
    document.getElementById("chatEmo").onclick = (ev) => { const b = ev.target.closest("[data-e]"); if (b) C.send(b.dataset.e); };
    C.badge();
  };
  const msgs = () => db.entries.filter((e) => e.house === "chat").sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(-80);
  C.unread = () => { const seen = ui.my().chatSeen || 0; return msgs().filter((m) => m.author !== db.uid && new Date(m.created_at).getTime() > seen).length; };
  C.badge = () => { const n = C.open ? 0 : C.unread(), b = document.getElementById("chatBadge"); if (b) { b.textContent = n > 9 ? "9+" : n; b.hidden = !n; } };
  C.render = () => {
    const box = document.getElementById("chatList"), list = msgs();
    box.innerHTML = list.map((m) => { const mine = m.author === db.uid, p = ui.prof(m.author); return `<div class="cmsg ${mine ? "me" : ""}"><small style="color:${esc(p.color)}">${esc(p.name)} · ${timeAgo(m.created_at)}</small><div>${nl2br(m.body)}</div></div>`; }).join("") || `<div class="empty" style="padding:14px">ابدأوا الحكي! 💬</div>`;
    box.scrollTop = box.scrollHeight;
  };
  C.toggle = () => (C.open ? C.close() : C.show());
  C.show = () => { C.open = true; document.getElementById("chat").hidden = false; C.render(); ui.saveMy({ chatSeen: Date.now() }); C.badge(); setTimeout(() => document.getElementById("chatIn").focus(), 60); };
  C.close = () => { C.open = false; document.getElementById("chat").hidden = true; document.getElementById("chatIn").blur(); C.badge(); };
  C.send = async (txt) => {
    txt = (txt || "").trim(); if (!txt) return; const inp = document.getElementById("chatIn"); inp.value = "";
    try { await db.addEntry({ house: "chat", body: txt.slice(0, 400) }); W.say("me", txt.length > 60 ? txt.slice(0, 60) + "…" : txt, 5000); OSW.audio.sfx("pop"); C.render(); } catch (e) { ui.toast("⚠️ " + esc(e.message)); }
  };
  C.incoming = (row) => {
    const txt = row.body || ""; W.say("partner", txt.length > 60 ? txt.slice(0, 60) + "…" : txt, 6000);
    if (C.open) { C.render(); ui.saveMy({ chatSeen: Date.now() }); } else { OSW.audio.sfx("ding"); ui.toast(`💬 ${esc(ui.prof(row.author).name)}: ${esc(txt.slice(0, 40))}`, "love", 3500); C.badge(); }
  };
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && !C.open && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") && OSW.app && OSW.app.state().ready && document.getElementById("modal").hidden && document.getElementById("room").hidden) { e.preventDefault(); C.show(); } });
})();
