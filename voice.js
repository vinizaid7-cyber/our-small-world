/* مايك: مكالمة صوتية مباشرة بينك وبين شريكك (WebRTC). الإشارات بتمشي عبر نفس قناة الحركة (Supabase broadcast). */
(function () {
  const OSW = window.OSW, Vc = (OSW.voice = { state: "idle", muted: false });
  const ICE = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" },
    { urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"], username: "openrelayproject", credential: "openrelayproject" }];
  let pc = null, stream = null, audioEl = null, pendingOffer = null, ringT = null, cand = [], an = null, actx = null, speakTimer = null, ready = false;
  const db = () => OSW.ui.db, ui = () => OSW.ui, $ = (id) => document.getElementById(id);
  const partner = () => (db().partner ? db().partner.id : null), pname = () => (ui().partnerName ? ui().partnerName() : "شريكك");
  const send = (p) => { const d = db(); if (d._mv && d._mvOk) d._mv.send({ type: "broadcast", event: "voice", payload: Object.assign({ u: d.uid, to: partner() }, p) }); };

  function paint() {
    const b = $("btnMic"), m = $("btnMute"), bd = $("voiceBadge"); if (!b) return;
    const st = Vc.state; b.textContent = st === "idle" ? "🎙️" : st === "ringing" ? "📞" : st === "incoming" ? "📲" : "📴"; b.classList.toggle("on", st !== "idle");
    b.setAttribute("aria-label", st === "idle" ? "كلّم شريكك" : st === "incoming" ? "جاوب" : "أنهي المكالمة");
    if (m) { m.hidden = st !== "live"; m.textContent = Vc.muted ? "🔇" : "🎤"; }
    if (bd) { bd.hidden = st === "idle"; if (st !== "live") bd.textContent = st === "ringing" ? "📞 عم نرن على " + pname() + "…" : st === "incoming" ? "📲 " + pname() + " بدها تحكيك — اضغط 📲 للرد" : ""; }
  }
  function cleanup(notify) {
    if (notify && Vc.state !== "idle") send({ t: "bye" });
    clearTimeout(ringT); clearInterval(speakTimer); cand = []; pendingOffer = null;
    if (pc) { try { pc.close(); } catch (e) { /* */ } pc = null; }
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (audioEl) { audioEl.srcObject = null; }
    Vc.state = "idle"; Vc.muted = false; paint();
  }
  async function mic() {
    if (stream) return stream;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("المتصفح ما بدعم المايك (لازم رابط https)");
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    return stream;
  }
  function newPc() {
    pc = new RTCPeerConnection({ iceServers: ICE });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => { if (e.candidate) send({ t: "ice", c: e.candidate }); };
    pc.ontrack = (e) => {
      if (!audioEl) { audioEl = document.createElement("audio"); audioEl.autoplay = true; audioEl.playsInline = true; document.body.appendChild(audioEl); }
      audioEl.srcObject = e.streams[0]; audioEl.play().catch(() => {});
      try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const src = actx.createMediaStreamSource(e.streams[0]); an = actx.createAnalyser(); an.fftSize = 256; src.connect(an); } catch (er) { an = null; }
      clearInterval(speakTimer); const buf = new Uint8Array(128);
      speakTimer = setInterval(() => { if (!an) return; an.getByteFrequencyData(buf); const lv = buf.reduce((a, b) => a + b, 0) / buf.length, bd = $("voiceBadge"); if (bd && Vc.state === "live") bd.textContent = lv > 14 ? "🔊 " + pname() + " عم تحكي…" : "🎧 متصلين مع " + pname(); }, 250);
    };
    pc.onconnectionstatechange = () => { const s = pc && pc.connectionState; if (s === "connected") { Vc.state = "live"; clearTimeout(ringT); paint(); ui().toast("🎧 اتصلتوا! احكوا براحتكم"); OSW.audio && OSW.audio.sfx("pop"); } else if (s === "failed" || s === "closed") { if (Vc.state !== "idle") { ui().toast("📴 انقطعت المكالمة"); cleanup(false); } } };
    return pc;
  }
  async function call() {
    try { await mic(); } catch (e) { return ui().toast("🎙️ " + (e.name === "NotAllowedError" ? "لازم تسمح للمايك من إعدادات المتصفح" : e.message)); }
    if (!partner()) { cleanup(false); return ui().toast("ما في شريك مربوط"); }
    Vc.state = "ringing"; paint(); newPc();
    const off = await pc.createOffer(); await pc.setLocalDescription(off); send({ t: "offer", sdp: off });
    ringT = setTimeout(() => { if (Vc.state === "ringing") { ui().toast("📴 " + pname() + " ما ردّت (يمكن مش متصلة)"); cleanup(true); } }, 35000);
  }
  async function answer() {
    const off = pendingOffer; if (!off) return;
    try { await mic(); } catch (e) { cleanup(true); return ui().toast("🎙️ " + (e.name === "NotAllowedError" ? "لازم تسمح للمايك" : e.message)); }
    newPc(); await pc.setRemoteDescription(off); cand.splice(0).forEach((c) => pc.addIceCandidate(c).catch(() => {}));
    const an2 = await pc.createAnswer(); await pc.setLocalDescription(an2); send({ t: "answer", sdp: an2 }); pendingOffer = null; Vc.state = "connecting"; paint();
  }
  async function onMsg(p) {
    const d = db(); if (!p || p.u === d.uid || (p.to && p.to !== d.uid)) return;
    if (p.t === "offer") {
      if (Vc.state === "ringing" && pc) { if (d.uid < p.u) return; try { pc.close(); } catch (e) { /* */ } pc = null; pendingOffer = p.sdp; clearTimeout(ringT); await answer(); return; } // تزامن: نقبل
      if (Vc.state !== "idle") return;
      pendingOffer = p.sdp; Vc.state = "incoming"; paint(); OSW.audio && (OSW.audio.sfx("heart"), setTimeout(() => OSW.audio.sfx("heart"), 700));
      ui().toast("📲 " + pname() + " بدها تحكيك! اضغط زر 📲 للرد", "love", 5000);
      clearTimeout(ringT); ringT = setTimeout(() => { if (Vc.state === "incoming") cleanup(false); }, 40000);
    } else if (p.t === "answer") { if (pc && pc.signalingState === "have-local-offer") { await pc.setRemoteDescription(p.sdp); cand.splice(0).forEach((c) => pc.addIceCandidate(c).catch(() => {})); Vc.state = "connecting"; paint(); } }
    else if (p.t === "ice") { if (pc && pc.remoteDescription) pc.addIceCandidate(p.c).catch(() => {}); else cand.push(p.c); }
    else if (p.t === "bye") { if (Vc.state !== "idle") { ui().toast("📴 " + pname() + " أنهت المكالمة"); cleanup(false); } }
  }
  Vc.tap = async () => {
    try {
      if (Vc.state === "idle") return await call();
      if (Vc.state === "incoming") return await answer();
      cleanup(true);
    } catch (e) { ui().toast("⚠️ " + e.message); cleanup(true); }
  };
  Vc.mute = () => { Vc.muted = !Vc.muted; if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !Vc.muted)); paint(); };

  function init() {
    const bx = document.querySelector(".hud-btns"); if (!bx || $("btnMic")) return;
    const mk = (id, em, lab, fn) => { const b = document.createElement("button"); b.id = id; b.className = "rbtn"; b.setAttribute("aria-label", lab); b.textContent = em; b.onclick = fn; return b; };
    const mute = mk("btnMute", "🎤", "كتم المايك", () => Vc.mute()); mute.hidden = true;
    bx.insertBefore(mute, bx.firstChild); bx.insertBefore(mk("btnMic", "🎙️", "كلّم شريكك", () => Vc.tap()), bx.firstChild);
    const bd = document.createElement("div"); bd.id = "voiceBadge"; bd.hidden = true; document.body.appendChild(bd);
    const wait = setInterval(() => { if (OSW.ui && OSW.ui.db && OSW.ui.db.on && !ready) { ready = true; clearInterval(wait); OSW.ui.db.on("voice", (p) => { onMsg(p).catch((e) => console.warn("voice", e)); }); } }, 800);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
