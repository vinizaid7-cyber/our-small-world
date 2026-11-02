/* أصوات القرية: مولّدة بالكود (بدون ملفات صوت) */
(function () {
  const OSW = window.OSW;
  let ctx, master, wet, timer, night = 0;
  let enabled = localStorage.getItem("osw_sound") === "1";
  const PENT = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      const d = ctx.createDelay(1); d.delayTime.value = 0.34;
      const fb = ctx.createGain(); fb.gain.value = 0.38;
      wet = ctx.createGain(); wet.gain.value = 0.5;
      wet.connect(d); d.connect(fb); fb.connect(d); d.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }
  function tone(f, dur = 0.5, type = "sine", vol = 0.15, at = 0, toWet = true) {
    if (!ensure()) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); if (toWet) g.connect(wet);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur = 0.3, vol = 0.1, freq = 800, at = 0) {
    if (!ensure()) return;
    const t = ctx.currentTime + at;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const SFX = {
    step: () => noise(0.05, 0.035, 700),
    pop: () => tone(520 + Math.random() * 80, 0.12, "triangle", 0.12, 0, false),
    door: () => { noise(0.5, 0.12, 500); tone(110, 0.5, "sawtooth", 0.05, 0, false); tone(165, 0.3, "triangle", 0.06, 0.25); },
    ding: () => { tone(880, 0.5, "sine", 0.14); tone(1318, 0.7, "sine", 0.1, 0.12); },
    page: () => noise(0.18, 0.08, 2500),
    coin: () => { tone(1200, 0.12, "square", 0.05, 0, false); tone(1600, 0.35, "square", 0.05, 0.08); },
    heart: () => { tone(660, 0.18, "sine", 0.12); tone(880, 0.3, "sine", 0.12, 0.1); },
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.55, "triangle", 0.13, i * 0.13)),
    magic: () => [880, 1109, 1319, 1760].forEach((f, i) => tone(f, 0.4, "sine", 0.08, i * 0.07)),
  };
  function ambientTick() {
    if (!enabled) return;
    const n = PENT[Math.floor(Math.random() * PENT.length)];
    tone(n / (Math.random() < 0.3 ? 2 : 1), 2.2, "sine", 0.05);
    if (night < 0.5 && Math.random() < 0.25) { // عصافير
      const b = 2200 + Math.random() * 900;
      [0, 0.09, 0.2].forEach((a, i) => tone(b + i * 150, 0.07, "sine", 0.03, a, false));
    } else if (night >= 0.5 && Math.random() < 0.35) { // صرصور
      [0, 0.07, 0.14].forEach((a) => tone(4300, 0.04, "square", 0.012, a, false));
    }
    timer = setTimeout(ambientTick, 1300 + Math.random() * 2600);
  }
  OSW.audio = {
    get enabled() { return enabled; },
    set(on) {
      enabled = !!on; localStorage.setItem("osw_sound", on ? "1" : "0");
      clearTimeout(timer);
      if (on) { ensure(); ambientTick(); }
    },
    toggle() { this.set(!enabled); return enabled; },
    sfx(name) { if (enabled && SFX[name]) SFX[name](); },
    setNight(d) { night = d; },
    resumeIfEnabled() { if (enabled) { ensure(); clearTimeout(timer); ambientTick(); } },
  };
})();
