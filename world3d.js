/* عالم ثلاثي الأبعاد: الكاميرا، الحركة، السماء، الطقس، النصوص الطافية */
(function () {
  const OSW = window.OSW, R = OSW.R, S = OSW.S, M = OSW.M, Builder = OSW.Builder;
  const { clamp, seeded } = OSW, PI = Math.PI, hy = Math.hypot;
  const W = (OSW.world = { noGL: false, onAct: null, onMove: null });
  const $ = (s) => document.querySelector(s);

  const st = { hour: 12, night: 0, season: "summer", paused: false, input: true, t: 0, last: 0, wmode: localStorage.getItem("osw_weather") || "auto", hourOverride: null, timeOffset: parseFloat(sessionStorage.getItem("osw_toff") || "0") || 0 };
  const me = { speedMul: 1, sprint: false, vx: 0, vz: 0, x: 0, z: 38, ry: PI, phase: 0, mv: 0, ch: null, name: "", target: null, act: null, res: null, stuck: 0, prog: 0, px: 0, pz: 0, side: 0, follow: false, lastSent: 0, sentX: 0, sentZ: 0 };
  const pa = { x: -4, z: -7, ry: 0.5, phase: 0, mv: 0, ch: null, name: "", tx: -4, tz: -7, vis: false, sleep: false, inside: null, ghost: 0 };
  const cam = { yaw: 0, pitch: 0.5, dist: 26, tx: 0, ty: 1.4, tz: 36, follow: true, anim: null, saved: null };
  const keys = { l: 0, r: 0, u: 0, d: 0, sprint: 0 }, joy = { x: 0, y: 0, on: false };
  let ctx = {}, labelsEl, tapMark = null, together = 0, holding = false;
  const meshes = {};
  const carry = { me: [], partner: [] }, bagState = { n: 0 }, cartS = { colors: [], prev: [], lastT: 0, anim: null, home: { x: -18.5, z: -12.6 } }, crateCache = {};
  let mode = "out", curInt = null, floorHandler = null, selFurn = null, crowd = null;
  const inNpcs = [], furn = { list: [], boxes: [], acts: [] };
  const curSpace = () => (mode === "in" && curInt ? curInt.id : null);
  const animals = {}, acarry = { me: [], partner: [] }, ANS = { cow: { sp: 0.75, sc: 1.1, r: 1.0, graze: 1.1, sleep: 0.75 }, sheep: { sp: 0.85, sc: 1.05, r: 0.8, graze: 1.0, sleep: 0.65 }, chicken: { sp: 1.5, sc: 1.4, r: 0.4, graze: 0.8, sleep: 0.55 } };
  const AP = {}, pets3 = {}, petMesh = {}, am1 = new Float32Array(16), am2 = new Float32Array(16), am3 = new Float32Array(16);
  let animT = 0;
  /* حيوانات المزرعة: حالات (وقفة، مشي، رعي/نقر، تلفّت، نوم بالليل) + سرعة سلسة + ما بيتداخلوا */
  function stepAnimals(dt) {
    animT += dt;
    const PN = OSW.EX.PENS, night = st.night > 0.6, list = Object.values(animals);
    list.forEach((a) => {
      const R2 = PN[a.kind], A = ANS[a.kind], hungry = a.fed === false;
      if (a.st === undefined) { a.st = "idle"; a.timer = Math.random() * 3; a.v = 0; a.pitch = 0; a.hyaw = 0; a.pt = 0; a.yt = 0; a.ph0 = Math.random() * 6; }
      a.timer -= dt;
      if (night && a.st !== "sleep") { a.st = "sleep"; a.tx = null; }
      if (!night && a.st === "sleep") { a.st = "idle"; a.timer = 1 + Math.random() * 3; }
      let want = 0;
      if (a.st === "walk") {
        if (a.tx == null) { a.tx = clamp(a.x + (Math.random() - 0.5) * 9, R2.x0 + 1.2, R2.x1 - 1.2); a.tz = clamp(a.z + (Math.random() - 0.5) * 7, R2.z0 + 1.5, R2.z1 - 1.5); }
        const dx = a.tx - a.x, dz = a.tz - a.z, d = hy(dx, dz);
        if (d < 0.4) { a.st = "idle"; a.tx = null; a.timer = 1 + Math.random() * 4; }
        else {
          const da = angDiff(a.ry, Math.atan2(dx, dz)); a.ry += da * Math.min(1, dt * (a.kind === "chicken" ? 7 : 3.2));
          want = A.sp * (hungry ? 0.55 : 1) * Math.max(0, 1 - Math.abs(da) / 1.1) * (a.kind === "chicken" ? 0.65 + 0.35 * Math.abs(Math.sin(animT * 3 + a.ph0)) : 1);
          a.pt = hungry ? 0.35 : 0.05; a.yt = 0;
        }
      } else if (a.st === "graze") {
        a.yt = 0; a.pt = a.kind === "chicken" ? 0.45 + 0.7 * Math.max(0, Math.sin(animT * 8 + a.ph0)) : A.graze + Math.sin(animT * 4 + a.ph0) * 0.06;
        if (a.timer <= 0) { a.st = "idle"; a.timer = 1 + Math.random() * 3; }
      } else if (a.st === "look") {
        a.pt = 0.02; a.yt = Math.sin(animT * 0.9 + a.ph0) * 0.7; if (a.timer <= 0) { a.st = "idle"; a.timer = 1 + Math.random() * 3; }
      } else if (a.st === "sleep") { a.pt = A.sleep; a.yt = 0.25; }
      else {
        a.pt = hungry ? 0.4 : 0.03 + Math.sin(animT * 0.6 + a.ph0) * 0.03; a.yt = Math.sin(animT * 0.4 + a.ph0) * 0.15;
        if (a.timer <= 0) { const r = Math.random(); if (r < 0.45) { a.st = "walk"; a.tx = null; } else if (r < 0.85) { a.st = "graze"; a.timer = 3 + Math.random() * 5; } else { a.st = "look"; a.timer = 2 + Math.random() * 2; } }
      }
      a.v += (want - a.v) * Math.min(1, dt * 4);
      if (a.v > 0.02) { a.x += Math.sin(a.ry) * a.v * dt; a.z += Math.cos(a.ry) * a.v * dt; a.phase += dt * (2.2 + a.v * 5); }
      a.mv = a.v > 0.1 ? 1 : 0;
      a.pitch += (a.pt - a.pitch) * Math.min(1, dt * 5); a.hyaw += (a.yt - a.hyaw) * Math.min(1, dt * 3);
    });
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const p = list[i], q = list[j]; if (p.kind !== q.kind) continue;
      const dx = q.x - p.x, dz = q.z - p.z, d = hy(dx, dz) || 0.001, md = (ANS[p.kind].r * p.size + ANS[q.kind].r * q.size) * 0.85;
      if (d < md) { const k = (md - d) / 2 / d; p.x -= dx * k; p.z -= dz * k; q.x += dx * k; q.z += dz * k; }
    }
    list.forEach((a) => { const R2 = PN[a.kind]; a.x = clamp(a.x, R2.x0 + 0.9, R2.x1 - 0.9); a.z = clamp(a.z, R2.z0 + 1.0, R2.z1 - 1.0); });
  }
  function part(mesh, p, rx, ry, rz, s) { M.trs(p[0], p[1], p[2], ry || 0, rx || 0, rz || 0, s || 1, s || 1, s || 1, am2); M.mul(am1, am2, am3); R.draw(mesh, am3); }
  function drawAnimal(a, t) {
    const A = ANS[a.kind], P = AP[a.kind]; if (!P || a.st === undefined) return;
    const sc = A.sc * a.size, baby = 1 + (1 - a.size) * 0.7, breathe = Math.sin(t * (a.st === "sleep" ? 1.3 : 1.9) + a.ph0) * 0.01, bob = a.v > 0.05 ? Math.abs(Math.sin(a.phase * 0.5)) * 0.04 * sc : 0;
    M.trs(a.x, bob, a.z, a.ry, 0, 0, sc, sc * (1 + breathe), sc, am1); R.draw(P.body, am1);
    part(P.head, P.neck, a.pitch, a.hyaw, 0, baby);
    const sw = Math.min(1, a.v / A.sp) * (a.kind === "chicken" ? 0.9 : 0.65);
    P.legs.forEach((p, i) => part(P.leg, p, Math.sin(a.phase + P.gait[i]) * sw));
    if (P.tail) part(P.tail, P.tailP, Math.sin(t * 2 + a.ph0) * 0.1 + (a.v > 0.1 ? Math.sin(a.phase * 2) * 0.12 : 0), 0, Math.sin(t * 1.3 + a.ph0) * 0.1);
  }

  /* الحيوانات الأليفة اللي بتشتروها: بتمشي وراكم بالقرية */
  const PETK = { dog: { sp: 4.2, r: 0.5 }, cat: { sp: 3.2, r: 0.4 }, rabbit: { sp: 3.4, r: 0.35 }, duck: { sp: 2.4, r: 0.35 } };
  const PCOL = { dog: ["#c58a4a", "#f0e0bd", "#5a4331", "#d6d6d6"], cat: ["#e0a050", "#8d949c", "#2f2f35", "#f4f1ea"], rabbit: ["#f4f1ea", "#c9b79c", "#9aa0a8"], duck: ["#ffe066", "#ffffff", "#c9a05a"] };
  function petParts(kind, vi) {
    const key = kind + vi; if (petMesh[key]) return petMesh[key];
    const c = PCOL[kind][vi % PCOL[kind].length], mk = (fn) => { const b = new Builder(); fn(b); return b.build(R.gl); }, E = "#1b1b1f", P = {};
    if (kind === "dog") {
      P.body = mk((b) => { b.box(0, 0.3, 0, 0.36, 0.34, 0.8, c); b.box(0, 0.28, 0.1, 0.38, 0.12, 0.4, "#fff3df"); });
      P.neck = [0, 0.7, 0.42]; P.head = mk((b) => { b.box(0, -0.12, 0.1, 0.28, 0.3, 0.3, c); b.box(0, -0.12, 0.34, 0.17, 0.14, 0.2, "#f0e0bd"); b.sphere(0, -0.02, 0.45, 0.04, 0.035, 0.03, E, 4); [-1, 1].forEach((s) => { b.box(s * 0.17, -0.02, 0.08, 0.06, 0.24, 0.13, "#3b2a1a"); b.sphere(s * 0.08, 0.1, 0.27, 0.03, 0.03, 0.02, E, 4); }); });
      P.leg = mk((b) => { b.box(0, -0.3, 0, 0.1, 0.3, 0.1, c); b.box(0, -0.3, 0.02, 0.11, 0.05, 0.14, "#fff3df"); }); P.legs = [[-0.12, 0.3, 0.28], [0.12, 0.3, 0.28], [-0.12, 0.3, -0.28], [0.12, 0.3, -0.28]]; P.gait = [0, PI, PI, 0];
      P.tail = mk((b) => b.box(0, 0.0, -0.12, 0.07, 0.07, 0.3, c)); P.tailP = [0, 0.55, -0.4];
    } else if (kind === "cat") {
      P.body = mk((b) => b.box(0, 0.27, 0, 0.3, 0.28, 0.62, c));
      P.neck = [0, 0.5, 0.3]; P.head = mk((b) => { b.sphere(0, 0.05, 0.1, 0.18, 0.17, 0.16, c, 7); [-1, 1].forEach((s) => { b.box(s * 0.1, 0.17, 0.06, 0.07, 0.13, 0.05, c); b.sphere(s * 0.07, 0.08, 0.24, 0.03, 0.035, 0.02, "#7be07b", 4); }); b.sphere(0, 0.02, 0.26, 0.03, 0.02, 0.02, "#f2a0b0", 4); });
      P.leg = mk((b) => b.box(0, -0.27, 0, 0.09, 0.27, 0.09, c)); P.legs = [[-0.1, 0.27, 0.22], [0.1, 0.27, 0.22], [-0.1, 0.27, -0.22], [0.1, 0.27, -0.22]]; P.gait = [0, PI, PI, 0];
      P.tail = mk((b) => b.box(0, 0.22, -0.02, 0.07, 0.5, 0.07, c)); P.tailP = [0, 0.4, -0.32];
    } else if (kind === "rabbit") {
      P.body = mk((b) => { b.sphere(0, 0.28, 0.02, 0.2, 0.2, 0.26, c, 7); b.sphere(0, 0.26, -0.14, 0.22, 0.22, 0.2, c, 7); b.sphere(0, 0.3, -0.34, 0.08, 0.08, 0.08, "#fff", 5); [-1, 1].forEach((s) => b.box(s * 0.1, 0, 0.22, 0.07, 0.07, 0.14, c)); });
      P.neck = [0, 0.46, 0.2]; P.head = mk((b) => { b.sphere(0, 0.04, 0.1, 0.14, 0.14, 0.15, c, 7); [-1, 1].forEach((s) => { b.box(s * 0.06, 0.12, 0.03, 0.05, 0.32, 0.04, c); b.box(s * 0.06, 0.15, 0.06, 0.025, 0.24, 0.01, "#f2b8c6"); b.sphere(s * 0.09, 0.08, 0.2, 0.025, 0.03, 0.02, E, 4); }); b.sphere(0, 0.03, 0.25, 0.03, 0.025, 0.02, "#f2a0b0", 4); });
      P.legs = []; P.gait = [];
    } else {
      P.body = mk((b) => { b.sphere(0, 0.28, 0, 0.22, 0.2, 0.3, c, 7); b.box(0, 0.36, -0.3, 0.12, 0.1, 0.12, c); [-1, 1].forEach((s) => b.sphere(s * 0.2, 0.3, 0, 0.03, 0.12, 0.2, "#e8c040", 4)); });
      P.neck = [0, 0.44, 0.2]; P.head = mk((b) => { b.sphere(0, 0.12, 0.06, 0.12, 0.12, 0.12, c, 6); b.box(0, 0.06, 0.16, 0.1, 0.04, 0.13, "#ff9f1c"); [-1, 1].forEach((s) => b.sphere(s * 0.07, 0.16, 0.12, 0.02, 0.02, 0.02, E, 4)); });
      P.leg = mk((b) => { b.box(0, -0.1, 0, 0.03, 0.1, 0.03, "#ff9f1c"); b.box(0, -0.1, 0.04, 0.1, 0.02, 0.1, "#ff9f1c"); }); P.legs = [[-0.08, 0.1, 0], [0.08, 0.1, 0]]; P.gait = [0, PI];
    }
    return (petMesh[key] = P);
  }
  function stepPets(dt) {
    Object.values(pets3).forEach((o) => {
      const K = PETK[o.kind]; let ox = 0, oz = 0, active = false, want = 0;
      if (o.mode === "stay" || o.mode === "home") { const hp = S.poi.home || { x: 0, z: -7 }, hx = o.mode === "stay" && o.hx != null ? o.hx : hp.x + 3, hz = o.mode === "stay" && o.hz != null ? o.hz : hp.z + 2, dh = hy(hx - o.x, hz - o.z); if (dh > 60) { o.x = hx; o.z = hz; o.tx = null; } else if (dh > 3.4) { o.chase = true; o.tx = hx; o.tz = hz; o.run = dh > 10; } else { if (o.chase) { o.chase = false; o.tx = null; o.wait = 1; } if (o.tx == null && o.wait <= 0) { const aa = Math.random() * 6.28, rr = 0.4 + Math.random() * 1.8; o.tx = hx + Math.cos(aa) * rr; o.tz = hz + Math.sin(aa) * rr; o.run = false; o.wait = 3 + Math.random() * 6; } } }
      else if (o.owner === "me") { if (mode === "out") { ox = me.x; oz = me.z; active = true; } }
      else if (pa.vis && !pa.inside && !pa.sleep && (pa.space || null) === null) { ox = pa.x; oz = pa.z; active = true; }
      o.wait -= dt;
      if (active) {
        const d = hy(ox - o.x, oz - o.z);
        if (d > 36) { o.x = ox - 2.5; o.z = oz - 2.5; o.tx = null; o.chase = false; }
        else if (d > 3.6) { o.chase = true; o.tx = ox; o.tz = oz; o.run = d > 8; }
        else if (o.chase && d > 1.9) { o.tx = ox; o.tz = oz; }
        else { if (o.chase) { o.chase = false; o.tx = null; o.wait = 1; } if (o.tx == null && o.wait <= 0) { const a = Math.random() * 6.28, r = 1.4 + Math.random() * 2.2; o.tx = ox + Math.cos(a) * r; o.tz = oz + Math.sin(a) * r; o.run = false; o.wait = 2 + Math.random() * 4; } }
      }
      if (o.tx != null) {
        const dx = o.tx - o.x, dz = o.tz - o.z, d = hy(dx, dz);
        if (d < 0.35) o.tx = null;
        else { const da = angDiff(o.ry, Math.atan2(dx, dz)); o.ry += da * Math.min(1, dt * 9); want = K.sp * (o.run ? 1.6 : 0.7) * Math.max(0.2, 1 - Math.abs(da) / 1.3); }
      }
      o.v += (want - o.v) * Math.min(1, dt * 6);
      if (o.v > 0.03) { o.x += Math.sin(o.ry) * o.v * dt; o.z += Math.cos(o.ry) * o.v * dt; o.phase += dt * (3 + o.v * 3.2); collide(o, K.r * 0.6); }
      o.mv = o.v > 0.15 ? 1 : 0;
      const sniff = o.mv ? 0.05 : 0.05 + Math.max(0, Math.sin(animT * 0.7 + o.ph0)) * 0.5 * (o.kind === "dog" || o.kind === "cat" ? 1 : 0.6);
      o.pitch += (sniff - o.pitch) * Math.min(1, dt * 4);
    });
  }
  function drawPet(o, t) {
    const P = petParts(o.kind, o.vi), sc = o.sc;
    const hop = o.kind === "rabbit" ? (o.mv ? Math.abs(Math.sin(o.phase * 0.5)) * 0.3 : 0) : o.mv ? Math.abs(Math.sin(o.phase)) * 0.04 : 0, rock = o.kind === "duck" && o.mv ? Math.sin(o.phase) * 0.2 : 0;
    M.trs(o.x, hop, o.z, o.ry, 0, rock, sc, sc, sc, am1); R.draw(P.body, am1);
    part(P.head, P.neck, o.pitch, 0, 0, 1);
    const sw = Math.min(1, o.v / PETK[o.kind].sp) * 0.7; P.legs.forEach((p, i) => part(P.leg, p, Math.sin(o.phase + P.gait[i]) * sw));
    if (P.tail) { if (o.kind === "dog") part(P.tail, P.tailP, -0.7, Math.sin(t * (o.mv || o.chase ? 16 : 5) + o.ph0) * 0.6, 0, 1); else part(P.tail, P.tailP, -0.5 + Math.sin(t * 1.5 + o.ph0) * 0.15, 0, 0, 1); }
  }
  const pet = { x: 4, z: 6, ry: 0, phase: 0, mv: 0, tx: 4, tz: 6, wait: 1 };
  function stepPet(dt) {
    if (pet.tx == null) { pet.wait -= dt; pet.mv *= 0.9; if (pet.wait <= 0) { const a = Math.random() * 6.28, r = 3 + Math.random() * 7; pet.tx = Math.cos(a) * r; pet.tz = 3 + Math.sin(a) * r * 0.7; } return; }
    const dx = pet.tx - pet.x, dz = pet.tz - pet.z, d = hy(dx, dz);
    if (d < 0.3) { pet.tx = null; pet.wait = 2 + Math.random() * 6; return; }
    const sp = 2.2; pet.x += (dx / d) * sp * dt; pet.z += (dz / d) * sp * dt; pet.ry += angDiff(pet.ry, Math.atan2(dx, dz)) * Math.min(1, dt * 8); pet.phase += dt * 14; pet.mv = 1; collide(pet, 0.25);
  }

  /* ---------- السماء والضوء ---------- */
  const hex = (h) => { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const mixh = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const SKY = [[0, "#0d1033", "#26286b"], [5, "#1b1f55", "#6a4b8f"], [6.6, "#6f8fd8", "#ffb38a"], [9, "#5aa9ee", "#bfe4ff"], [13, "#3f9bea", "#a9dcff"], [17, "#5a8fd8", "#ffc48d"], [18.7, "#48407f", "#f08a6b"], [20.2, "#1d2058", "#3d3477"], [24, "#0d1033", "#26286b"]];
  function skyAt(h) { let i = 0; while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++; const a = SKY[i], b = SKY[i + 1], t = clamp((h - a[0]) / (b[0] - a[0]), 0, 1); return [mixh(a[1], b[1], t), mixh(a[2], b[2], t)]; }
  function nightFactor(h) { if (h < 5 || h >= 21) return 1; if (h < 7) return 1 - (h - 5) / 2; if (h < 17.5) return 0; if (h < 20) return ((h - 17.5) / 2.5) * 0.9; return 0.9 + (h - 20) * 0.1; }
  const seasonOf = (m) => (m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn");
  function updateSky() {
    const d = new Date(), q = new URLSearchParams(location.search);
    const h = (((st.hourOverride != null ? st.hourOverride : q.get("hour") != null ? parseFloat(q.get("hour")) : d.getHours() + d.getMinutes() / 60) + (st.timeOffset || 0)) % 24 + 24) % 24;
    const [top, bot] = skyAt(h), root = document.documentElement.style;
    root.setProperty("--sky-top", top); root.setProperty("--sky-bot", bot);
    st.hour = h; st.night = nightFactor(h); root.setProperty("--night", st.night.toFixed(3));
    OSW.audio && OSW.audio.setNight(st.night);
    const sun = $("#sun"), moon = $("#moon"), pos = (el, t, vis) => { el.style.left = 8 + t * 84 + "%"; el.style.top = 62 - Math.sin(clamp(t, 0, 1) * PI) * 52 + "%"; el.style.opacity = vis; };
    pos(sun, clamp((h - 6) / 12, -0.2, 1.2), h > 5.3 && h < 19 ? 1 - st.night * 0.9 : 0);
    pos(moon, clamp((h >= 18 ? h - 18 : h + 6) / 12, -0.2, 1.2), h >= 18 || h < 6.5 ? Math.max(st.night, 0.2) : 0);
    $("#stars").style.opacity = st.night;
    const season = q.get("season") || seasonOf(d.getMonth());
    if (season !== st.season) { st.season = season; if (S.ready) rebuildStatic(); }
    document.documentElement.dataset.season = season;
    return { night: st.night, season, hour: h };
  }
  const period = (h) => (h < 5 ? "night" : h < 11 ? "morning" : h < 16 ? "noon" : h < 20 ? "evening" : "night");
  function envNow() {
    if (mode === "in") return { sunDir: [0.25, -0.9, 0.35], sunCol: [0.38, 0.34, 0.28], ambTop: [0.93, 0.9, 0.86], ambBot: [0.74, 0.7, 0.66], night: 0.35 + 0.3 * st.night, fogN: 250, fogF: 520, time: st.t };
    const h = st.hour, n = st.night, a = (PI * (h - 6)) / 12;
    let sd = h >= 6 && h <= 18 ? [-Math.cos(a) * 0.8, -Math.max(0.28, Math.sin(a)), -0.42] : [0.35, -0.8, 0.35];
    const l = hy(sd[0], sd[1], sd[2]); sd = sd.map((v) => v / l);
    const low = clamp(1 - Math.abs(Math.sin(a)) * 1.6, 0, 1) * (1 - n), mixv = (A, B, t) => A.map((v, i) => v + (B[i] - v) * t);
    const dayCol = mixv([0.85, 0.8, 0.68], [1.0, 0.62, 0.42], low);
    return {
      sunDir: sd, sunCol: mixv(dayCol, [0.1, 0.12, 0.26], n).map((v, i) => v * (1 - n * 0.2)),
      ambTop: mixv(mixv([0.62, 0.68, 0.8], [0.8, 0.62, 0.55], low), [0.16, 0.19, 0.38], n), ambBot: mixv(mixv([0.46, 0.5, 0.4], [0.55, 0.45, 0.35], low), [0.08, 0.09, 0.18], n),
      night: n, fogN: 95, fogF: 235, time: st.t,
    };
  }

  /* ---------- طقس 2D فوق المشهد ---------- */
  const fx = { cv: null, c: null, parts: [], type: "none", w: 0, h: 0 };
  function fxType() {
    const m = new URLSearchParams(location.search).get("weather") || st.wmode;
    if (m === "clear") return "none"; if (m === "rain" || m === "snow") { st.storm = false; return m; }
    return autoWx();
  }
  // طقس تلقائي: نفس الطقس عند الاثنين (مبني على الوقت مش على عشوائية الجهاز)
  function hash01(n) { let x = n | 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
  function autoWx() {
    const b = Math.floor((Date.now() + 3 * 3600000) / (3 * 3600000)), r = hash01(b * 7919 + 13), s = st.season; st.storm = false;
    if (s === "winter") { if (r < 0.28) { st.storm = r < 0.07; return "rain"; } return r < 0.4 ? "snow" : "none"; }
    if (s === "autumn") { if (r < 0.2) { st.storm = r < 0.04; return "rain"; } return "leaves"; }
    if (s === "spring") return r < 0.16 ? "rain" : "petals";
    return "none";
  }
  function spawn(type, init) {
    const w = fx.w, h = fx.h, r = Math.random, p = { x: r() * w, y: init ? r() * h : -20, t: type, a: r() * 6.28 };
    if (type === "rain") { p.vy = 15 + r() * 8; p.vx = -2; p.l = 12 + r() * 10; } else if (type === "snow") { p.vy = 0.8 + r() * 1.4; p.vx = 0; p.r = 1.5 + r() * 3; }
    else if (type === "leaves") { p.vy = 0.9 + r() * 1.1; p.vx = 0.6 + r() * 0.8; p.r = 4 + r() * 3; p.c = r() < 0.5 ? "#d98a2b" : "#c2562b"; } else { p.vy = 0.8 + r() * 0.9; p.vx = 0.5 + r() * 0.7; p.r = 3 + r() * 2.5; p.c = "#ffc2dc"; }
    return p;
  }
  function fxFrame() {
    const { c, w, h } = fx; c.clearRect(0, 0, w, h);
    const want = fxType(); if (want !== fx.type) { fx.type = want; fx.parts = []; }
    const N = ({ rain: st.storm ? 220 : 120, snow: 80, leaves: 22, petals: 26, none: 0 })[fx.type] * (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.3 : 1);
    while (fx.parts.length < N) fx.parts.push(spawn(fx.type, true)); fx.parts.length = Math.min(fx.parts.length, Math.ceil(N));
    fx.parts.forEach((p, i) => {
      p.a += 0.03;
      if (p.t === "rain") { p.x += p.vx; p.y += p.vy; c.strokeStyle = "rgba(190,215,255,.55)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.vx, p.y + p.l); c.stroke(); }
      else if (p.t === "snow") { p.x += Math.sin(p.a) * 0.6; p.y += p.vy; c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.28); c.fill(); }
      else { p.x += p.vx + Math.sin(p.a) * 0.7; p.y += p.vy; c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = p.c; c.beginPath(); c.ellipse(0, 0, p.r * 1.5, p.r, 0, 0, 6.28); c.fill(); c.restore(); }
      if (p.y > h + 20 || p.x > w + 30 || p.x < -30) fx.parts[i] = spawn(fx.type, false);
    });
  }

  /* ---------- النصوص الطافية (أسماء البيوت وغيرها) ---------- */
  const labs = [];
  function mkLabel(def) {
    const el = document.createElement("div");
    el.className = "l3 " + (def.cls || "") + (def.act ? " tap" : "");
    el.innerHTML = `<span class="lt">${def.text}</span>${def.badge ? '<i class="bd" hidden></i>' : ""}`;
    if (def.act) el.dataset.act = def.act;
    el.style.display = "none"; labelsEl.appendChild(el);
    const l = Object.assign({}, def, { el, shown: false }); labs.push(l); return l;
  }
  function clearStaticLabels() { for (let i = labs.length - 1; i >= 0; i--) if (!labs[i].dynamic) { labs[i].el.remove(); labs.splice(i, 1); } }
  function updateLabels() {
    const e = R.eye, W2 = innerWidth, H2 = innerHeight;
    for (const l of labs) {
      let hide = l.hidden;
      const scp = l.scope || "out"; if (scp !== "both" && (scp === "in") !== (mode === "in")) hide = true;
      let x = l.x, y = l.y, z = l.z;
      if (l.follow) { const p = l.follow(); if (!p) hide = true; else { x = p[0]; y = p[1]; z = p[2]; } }
      let sc = 1, op = 1, px = 0, py = 0;
      if (!hide) {
        const d = hy(x - e[0], y - e[1], z - e[2]);
        if (d > l.max) hide = true;
        else { const p = R.project(x, y, z); if (p.w <= 0 || p.x < -80 || p.x > W2 + 80 || p.y < -40 || p.y > H2 + 60) hide = true; else { px = p.x; py = p.y; sc = clamp(30 / d, 0.62, 1.12); op = d > l.max * 0.78 ? clamp((l.max - d) / (l.max * 0.22), 0, 1) : 1; } }
      }
      if (hide) { if (l.shown) { l.el.style.display = "none"; l.shown = false; } continue; }
      if (!l.shown) { l.el.style.display = ""; l.shown = true; }
      l.el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-100%) scale(${sc.toFixed(3)})`;
      l.el.style.opacity = op.toFixed(2);
    }
  }

  /* ---------- مجسّمات ديناميكية ثابتة الشكل ---------- */
  function buildMeshes() {
    const gl = R.gl, mk = (fn) => { const b = new Builder(); fn(b); return b.build(gl); };
    meshes.drop = mk((b) => b.sphere(0, 0, 0, 0.13, 0.13, 0.13, "#cfeeff", 5, 0.3));
    meshes.puff = mk((b) => b.sphere(0, 0, 0, 0.5, 0.5, 0.5, "#ffffff", 6));
    meshes.beam = mk((b) => { b.push(0, 0, 0, 0, 0, -PI / 2); b.cyl(0, 0, 0, 0.3, 6, 40, "#fff2b0", 10); b.pop(); b.push(0, 0, 0, 0, 0, PI / 2); b.cyl(0, 0, 0, 0.3, 6, 40, "#fff2b0", 10); b.pop(); });
    meshes.cloud = mk((b) => { [[0, 0, 0, 3.2, 1.7], [-3, -0.3, 0.5, 2.3, 1.3], [3.2, -0.2, -0.3, 2.5, 1.4], [0.6, 0.8, 0.2, 2.2, 1.4]].forEach(([x, y, z, rx, ry]) => b.sphere(x, y, z, rx, ry, rx * 0.8, "#ffffff", 8)); });
    meshes.bird = mk((b) => { b.sphere(0, 0, 0, 0.35, 0.25, 0.6, "#3a3a4a", 6); b.push(0, 0, 0, 0, 0, 0.5); b.box(0.5, 0, 0, 1.0, 0.04, 0.5, "#3a3a4a"); b.pop(); b.push(0, 0, 0, 0, 0, -0.5); b.box(-0.5, 0, 0, 1.0, 0.04, 0.5, "#3a3a4a"); b.pop(); });
    meshes.ring = mk((bb) => { bb.cyl(0, 0.12, 0, 1.0, 1.0, 0.02, "#ffffff", 20); bb.cyl(0, 0.13, 0, 0.8, 0.8, 0.03, "#000000", 20); });
    meshes.link = mk((b) => b.box(0, 0, 0, 0.08, 0.08, 1, "#ff7aa8", 0.9));
    meshes.bag = mk((b) => { b.box(0, 0, 0, 0.34, 0.42, 0.18, "#f7d6ec"); b.box(0, 0.42, 0, 0.22, 0.05, 0.03, "#8e4a94"); b.box(-0.1, 0.4, 0, 0.03, 0.18, 0.03, "#8e4a94"); b.box(0.1, 0.4, 0, 0.03, 0.18, 0.03, "#8e4a94"); b.box(0, 0.12, 0.1, 0.18, 0.18, 0.02, "#ff7aa8"); });
    meshes.cat = mk((b) => { b.box(0, 0.28, 0, 0.34, 0.3, 0.7, "#e0a050"); b.sphere(0, 0.62, 0.42, 0.2, 0.19, 0.18, "#e0a050", 7); b.box(-0.12, 0.76, 0.42, 0.07, 0.14, 0.05, "#e0a050"); b.box(0.12, 0.76, 0.42, 0.07, 0.14, 0.05, "#e0a050"); b.sphere(-0.07, 0.65, 0.58, 0.03, 0.03, 0.02, "#222", 4); b.sphere(0.07, 0.65, 0.58, 0.03, 0.03, 0.02, "#222", 4); [[-0.12, 0.3], [0.12, 0.3], [-0.12, -0.3], [0.12, -0.3]].forEach(([x, z]) => b.box(x, 0, z, 0.1, 0.18, 0.1, "#c98a3d")); b.push(0, 0.4, -0.38, 0, -0.9); b.box(0, 0, 0, 0.08, 0.5, 0.08, "#e0a050"); b.pop(); });
    meshes.gull = mk((b) => { b.sphere(0, 0, 0, 0.14, 0.12, 0.32, "#fafafa", 6); b.sphere(0, 0.02, 0.3, 0.09, 0.09, 0.1, "#fafafa", 5); b.box(0, 0, 0.4, 0.04, 0.03, 0.1, "#f4a300"); [-1, 1].forEach((sd) => { b.push(sd * 0.1, 0.03, 0, 0, 0, sd * 0.25); b.box(sd * 0.45, 0, 0, 0.9, 0.025, 0.28, "#f4f4f4"); b.box(sd * 0.85, 0.01, -0.05, 0.3, 0.02, 0.2, "#4a4a55"); b.pop(); }); });
    meshes.boat = mk((b) => { b.box(0, -0.2, 0, 1.6, 0.6, 4.2, "#f4f1e8"); b.box(0, 0.35, 0, 1.4, 0.12, 3.6, "#c0392b"); b.box(0, 0.4, 0.6, 1.0, 0.5, 1.2, "#ffd98a"); b.cyl(0, 0.4, -0.4, 0.06, 0.06, 4.2, "#7a5236", 5); b.prism(0, 1.0, -0.4, 0.06, 2.8, 2.2, "#ffffff"); b.prism(0, 1.0, -1.7, 0.06, 2.0, 1.2, "#e63946"); });
    meshes.crab = mk((b) => { b.sphere(0, 0.12, 0, 0.2, 0.1, 0.14, "#e5533d", 6); [-1, 1].forEach((sd) => { b.sphere(sd * 0.3, 0.14, 0.12, 0.09, 0.07, 0.07, "#e5533d", 4); for (let i = 0; i < 3; i++) b.box(sd * 0.28, 0.05, -0.06 + i * 0.07, 0.2, 0.025, 0.025, "#c0392b"); }); b.sphere(-0.07, 0.24, 0.1, 0.03, 0.03, 0.03, "#111", 3); b.sphere(0.07, 0.24, 0.1, 0.03, 0.03, 0.03, "#111", 3); });
    meshes.ball = mk((b) => { b.sphere(0, 0, 0, 0.3, 0.3, 0.3, "#ffffff", 8); b.box(0, 0, 0, 0.62, 0.08, 0.62, "#ffd23f"); b.box(0, 0, 0, 0.08, 0.62, 0.62, "#4dabf7"); });
    meshes.cow = mk((b) => {
      const W = "#f4f1ea", K = "#2b2b2b";
      b.box(0, 0.7, 0, 0.95, 0.8, 1.7, W); b.box(0.48, 1.0, 0.25, 0.04, 0.38, 0.45, K); b.box(-0.48, 1.1, -0.35, 0.04, 0.4, 0.5, K); b.box(0.2, 1.5, -0.3, 0.45, 0.04, 0.5, K); b.box(-0.25, 1.5, 0.35, 0.35, 0.04, 0.35, K);
      [[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]].forEach(([x, z]) => { b.box(x, 0.1, z, 0.2, 0.62, 0.2, "#e8e2d6"); b.box(x, 0, z, 0.22, 0.12, 0.22, "#333"); });
      b.box(0, 1.1, 1.05, 0.55, 0.55, 0.55, W); b.box(0, 1.08, 1.34, 0.42, 0.26, 0.12, "#f2b8b0"); b.sphere(-0.12, 1.3, 1.31, 0.04, 0.04, 0.03, "#222", 4); b.sphere(0.12, 1.3, 1.31, 0.04, 0.04, 0.03, "#222", 4);
      [-1, 1].forEach((s2) => { b.box(s2 * 0.33, 1.45, 1.0, 0.2, 0.1, 0.16, K); b.box(s2 * 0.2, 1.62, 1.0, 0.07, 0.2, 0.07, "#e8d9a8"); });
      b.box(0, 0.5, -0.88, 0.08, 0.8, 0.08, K); b.sphere(0, 0.5, -0.88, 0.1, 0.12, 0.1, K, 4); b.sphere(0, 0.64, -0.35, 0.2, 0.14, 0.2, "#f2b8b0", 5);
    });
    meshes.sheep = mk((b) => {
      const W = "#f7f2e6", K = "#3a3a3a";
      b.sphere(0, 0.78, 0, 0.55, 0.45, 0.72, W, 8); [[-0.3, 1.05, 0.2], [0.3, 1.05, -0.2], [0, 1.1, 0.4], [-0.3, 0.95, -0.4], [0.35, 0.95, 0.35]].forEach(([x, y, z]) => b.sphere(x, y, z, 0.3, 0.26, 0.3, W, 6));
      [[-0.25, -0.4], [0.25, -0.4], [-0.25, 0.4], [0.25, 0.4]].forEach(([x, z]) => b.box(x, 0, z, 0.12, 0.5, 0.12, K));
      b.sphere(0, 0.98, 0.78, 0.2, 0.22, 0.22, K, 6); b.sphere(0, 1.2, 0.74, 0.22, 0.12, 0.2, W, 5); [-1, 1].forEach((s2) => { b.box(s2 * 0.24, 1.0, 0.72, 0.18, 0.08, 0.12, K); b.sphere(s2 * 0.08, 1.02, 0.97, 0.03, 0.03, 0.02, "#fff", 4); });
      b.sphere(0, 0.85, -0.74, 0.12, 0.12, 0.12, W, 5);
    });
    meshes.chicken = mk((b) => {
      b.sphere(0, 0.36, 0, 0.22, 0.2, 0.28, "#fff6e5", 6); b.push(0, 0.5, -0.26, 0, 0.6); b.box(0, 0, 0, 0.1, 0.3, 0.1, "#e9d8b8"); b.pop(); b.sphere(0, 0.64, 0.2, 0.1, 0.1, 0.1, "#fff6e5", 5);
      b.box(0, 0.72, 0.2, 0.04, 0.09, 0.12, "#d62828"); b.box(0, 0.6, 0.31, 0.05, 0.04, 0.09, "#f4a300"); b.box(0, 0.54, 0.29, 0.03, 0.06, 0.03, "#d62828"); [-1, 1].forEach((s2) => { b.box(s2 * 0.07, 0, 0, 0.03, 0.2, 0.03, "#f4a300"); b.sphere(s2 * 0.2, 0.38, 0, 0.04, 0.15, 0.2, "#efe3c8", 4); b.sphere(s2 * 0.06, 0.67, 0.28, 0.02, 0.02, 0.02, "#222", 3); });
    });
    /* أجزاء الحيوانات (رأس، أرجل، ذيل) عشان تتحرك بشكل حقيقي */
    {
      const W = "#f4f1ea", K = "#2b2b2b", PK = "#f2b8b0", E = "#1b1b1f";
      AP.cow = { neck: [0, 1.3, 0.75], legs: [[-0.3, 0.72, 0.55], [0.3, 0.72, 0.55], [-0.3, 0.72, -0.55], [0.3, 0.72, -0.55]], gait: [0, PI, PI, 0], tailP: [0, 1.45, -0.82] };
      AP.cow.body = mk((b) => {
        b.box(0, 0.7, 0, 0.95, 0.8, 1.6, W); b.sphere(0, 1.15, 0.4, 0.5, 0.42, 0.55, W, 7); b.sphere(0, 1.15, -0.5, 0.5, 0.4, 0.5, W, 7);
        b.box(0.49, 0.95, 0.2, 0.05, 0.4, 0.5, K); b.box(-0.49, 1.05, -0.4, 0.05, 0.42, 0.5, K); b.box(0.2, 1.5, -0.3, 0.45, 0.05, 0.5, K); b.box(-0.25, 1.52, 0.4, 0.35, 0.05, 0.35, K); b.box(0.49, 1.1, -0.6, 0.05, 0.3, 0.3, K);
        b.sphere(0, 0.62, -0.35, 0.2, 0.14, 0.2, PK, 5); [-1, 1].forEach((sx) => b.box(sx * 0.07, 0.5, -0.35, 0.04, 0.1, 0.04, PK));
      });
      AP.cow.head = mk((b) => {
        b.box(0, -0.28, 0, 0.42, 0.6, 0.5, W); b.box(0, -0.05, 0.4, 0.5, 0.5, 0.5, W); b.box(0, 0.44, 0.42, 0.3, 0.03, 0.3, K); b.box(0, -0.12, 0.72, 0.44, 0.3, 0.16, PK);
        [-1, 1].forEach((s) => { b.sphere(s * 0.1, 0.0, 0.81, 0.03, 0.03, 0.02, E, 4); b.sphere(s * 0.22, 0.12, 0.5, 0.045, 0.045, 0.03, E, 4); b.box(s * 0.36, 0.14, 0.32, 0.2, 0.09, 0.15, K); b.box(s * 0.2, 0.42, 0.38, 0.07, 0.18, 0.07, "#e8d9a8"); });
      });
      AP.cow.leg = mk((b) => { b.box(0, -0.34, 0, 0.22, 0.34, 0.24, W); b.box(0, -0.62, 0, 0.16, 0.3, 0.16, "#e8e2d6"); b.box(0, -0.72, 0, 0.2, 0.12, 0.2, "#333"); });
      AP.cow.tail = mk((b) => { b.box(0, -0.75, 0, 0.07, 0.78, 0.07, K); b.sphere(0, -0.8, 0, 0.1, 0.14, 0.1, K, 4); });
      const SW = "#f7f2e6";
      AP.sheep = { neck: [0, 1.05, 0.65], legs: [[-0.25, 0.55, 0.4], [0.25, 0.55, 0.4], [-0.25, 0.55, -0.4], [0.25, 0.55, -0.4]], gait: [0, PI, PI, 0] };
      AP.sheep.body = mk((b) => { b.sphere(0, 0.85, 0, 0.55, 0.5, 0.72, SW, 8); [[-0.3, 1.1, 0.2], [0.3, 1.1, -0.2], [0, 1.15, 0.4], [-0.3, 1.0, -0.4], [0.35, 1.0, 0.35]].forEach(([x, y, z]) => b.sphere(x, y, z, 0.3, 0.26, 0.3, SW, 6)); b.sphere(0, 0.9, -0.74, 0.14, 0.14, 0.14, SW, 5); });
      AP.sheep.head = mk((b) => { b.sphere(0, -0.05, 0.05, 0.22, 0.2, 0.22, SW, 5); b.sphere(0, 0.0, 0.3, 0.2, 0.22, 0.26, "#3a3a3a", 6); b.sphere(0, 0.2, 0.2, 0.22, 0.12, 0.2, SW, 5); b.sphere(0, -0.05, 0.55, 0.05, 0.04, 0.04, "#555", 4); [-1, 1].forEach((s) => { b.box(s * 0.26, 0.05, 0.2, 0.2, 0.07, 0.1, "#3a3a3a"); b.sphere(s * 0.09, 0.07, 0.5, 0.03, 0.03, 0.02, "#fff", 4); }); });
      AP.sheep.leg = mk((b) => { b.box(0, -0.55, 0, 0.12, 0.55, 0.12, "#3a3a3a"); b.box(0, -0.55, 0, 0.14, 0.06, 0.14, "#222"); });
      AP.chicken = { neck: [0, 0.5, 0.22], legs: [[-0.07, 0.22, 0], [0.07, 0.22, 0]], gait: [0, PI] };
      AP.chicken.body = mk((b) => { b.sphere(0, 0.36, 0, 0.22, 0.2, 0.28, "#fff6e5", 6); b.push(0, 0.5, -0.26, 0, 0.6); b.box(0, 0, 0, 0.1, 0.3, 0.1, "#e9d8b8"); b.pop(); [-1, 1].forEach((s) => b.sphere(s * 0.2, 0.38, 0, 0.04, 0.15, 0.2, "#efe3c8", 4)); });
      AP.chicken.head = mk((b) => { b.box(0, -0.1, 0, 0.08, 0.2, 0.08, "#fff6e5"); b.sphere(0, 0.1, 0.05, 0.1, 0.1, 0.1, "#fff6e5", 5); b.box(0, 0.19, 0.05, 0.04, 0.09, 0.12, "#d62828"); b.box(0, 0.06, 0.16, 0.05, 0.04, 0.09, "#f4a300"); b.box(0, 0.0, 0.13, 0.03, 0.06, 0.03, "#d62828"); [-1, 1].forEach((s) => b.sphere(s * 0.06, 0.12, 0.12, 0.02, 0.02, 0.02, E, 3)); });
      AP.chicken.leg = mk((b) => { b.box(0, -0.22, 0, 0.03, 0.22, 0.03, "#f4a300"); b.box(0, -0.22, 0.04, 0.09, 0.02, 0.1, "#f4a300"); });
    }
    meshes.fly = mk((b) => { b.sphere(0, 0, 0, 0.06, 0.06, 0.06, "#fff7a0", 4, 1); });
    meshes.bf = mk((b) => { b.box(-0.18, 0, 0, 0.34, 0.03, 0.3, "#ff9ad5"); b.box(0.18, 0, 0, 0.34, 0.03, 0.3, "#ffd36e"); });
    meshes.blades = mk((b) => { for (let i = 0; i < 4; i++) { b.push(0, 0, 0, 0, 0, (i * PI) / 2); b.box(0, 0.3, 0, 0.5, 3.6, 0.12, "#f4ead2"); b.box(0.45, 1.2, 0, 0.5, 2.0, 0.1, "#c24a3a"); b.pop(); } b.sphere(0, 0, 0, 0.5, 0.5, 0.5, "#6b4a30", 6); });
    meshes.train = mk((b) => {
      b.box(0, 0.5, 0, 3.6, 1.7, 1.9, "#d64545"); b.cyl(-1.4, 0.7, 0, 0.7, 0.7, 2.4, "#2b2b3a", 10); b.cyl(-1.4, 3.0, 0, 0.3, 0.2, 0.9, "#222", 8); b.box(1.2, 2.2, 0, 1.5, 0.15, 2.1, "#2b2b3a"); b.box(1.2, 1.5, -0.95, 1.1, 0.8, 0.06, "#cfeaff", 0.5);
      [-1.2, 0.0, 1.2].forEach((x) => [-1, 1].forEach((s) => { b.push(x, 0.45, s * 1.0, 0, PI / 2); b.cyl(0, 0, 0, 0.45, 0.45, 0.12, "#333", 10); b.pop(); }));
      [5, 9].forEach((o, k) => { b.box(o, 0.5, 0, 3.4, 1.7, 1.9, k ? "#3a7bd5" : "#f2a33a"); b.box(o, 2.2, 0, 3.5, 0.15, 2.0, "#2b2b3a"); for (let i = -1; i <= 1; i++) b.box(o + i * 1.0, 1.1, 0.96, 0.7, 0.7, 0.05, "#ffe9a8", 1); b.box(o - 1.9, 0.9, 0, 0.5, 0.15, 0.15, "#555"); });
    });
  }

  /* ---------- شخصياتي والشريك ---------- */
  const lookKey = (l) => ({ gender: l.gender || "boy", color: l.color, hair: l.hairColor || l.hair, hairStyle: l.hairStyle, skin: l.skin, outfit: l.outfit, acc: l.acc, pants: l.pants, elder: l.elder, cane: l.cane, mustache: l.mustache, cap: l.cap, apron: l.apron, scale: l.scale, shoe: l.shoe });
  function setLook(who, look, name) {
    const o = who === "me" ? me : pa, c = OSW.makeChar(lookKey(look)); o.ch = c; o.name = name || o.name;
    const tag = labs.find((l) => l.dynamic === who);
    if (tag) tag.el.querySelector(".lt").textContent = o.name;
  }
  function remote(p) {
    if ((p.s || null) !== (pa.space || null)) { pa.space = p.s || null; pa.x = p.x; pa.z = p.z; }
    pa.veh = p.v || null; pa.hold = !!p.h; pa.tx = p.x; pa.tz = p.z; pa.ry = p.ry != null ? p.ry : pa.ry; pa.vis = true; pa.sleep = false; pa.remoteMv = p.mv ? 1 : 0; pa.lastMsg = performance.now();
  }

  /* ---------- الحركة والتصادم ---------- */
  const B_ = S.bounds;
  function collide(o, r) {
    if (mode === "in" && curInt) {
      const boxes = curInt.boxes.concat(furn.boxes);
      for (const b of boxes) {
        const l = b.x0 - r, rr = b.x1 + r, t = b.z0 - r, bo = b.z1 + r;
        if (o.x > l && o.x < rr && o.z > t && o.z < bo) { const dl = o.x - l, dr = rr - o.x, dt2 = o.z - t, db = bo - o.z, m = Math.min(dl, dr, dt2, db); if (m === dl) o.x = l; else if (m === dr) o.x = rr; else if (m === dt2) o.z = t; else o.z = bo; }
      }
      const b = curInt.bounds; o.x = clamp(o.x, b.x0 + r, b.x1 - r); o.z = clamp(o.z, b.z0 + r, b.z1 - r); return;
    }
    const pushRect = (b) => { const l = b.x0 - r, rr = b.x1 + r, tp = b.z0 - r, bo = b.z1 + r; if (o.x > l && o.x < rr && o.z > tp && o.z < bo) { const dl = o.x - l, dr = rr - o.x, dt2 = o.z - tp, db = bo - o.z, m = Math.min(dl, dr, dt2, db); if (m === dl) o.x = l; else if (m === dr) o.x = rr; else if (m === dt2) o.z = tp; else o.z = bo; } };
    for (let i = 0; i < S.rects.length; i++) pushRect(S.rects[i]);
    if (S.dynRects.home) pushRect(S.dynRects.home);
    for (const c of S.colliders) { const dx = o.x - c.x, dz = o.z - c.z, rr = c.r + r; if (dx * dx + dz * dz < rr * rr) { const d = hy(dx, dz) || 0.001; o.x = c.x + (dx / d) * rr; o.z = c.z + (dz / d) * rr; } }
    OSW.veh.constrain(o);
  }
  const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; };
  function sendMe(moving, sp) {
    const now = performance.now();
    if (W.onMove && now - me.lastSent > 160 && (moving || hy(me.x - me.sentX, me.z - me.sentZ) > 0.01 || now - me.lastSent > 2500)) {
      me.lastSent = now; me.sentX = me.x; me.sentZ = me.z; W.onMove({ x: +me.x.toFixed(2), z: +me.z.toFixed(2), ry: +me.ry.toFixed(2), mv: moving || sp > 0.3 ? 1 : 0, h: holding ? 1 : 0, s: curInt ? curInt.id : null, v: OSW.veh.pack() });
    }
  }
  function stepMe(dt) {
    let dx = 0, dz = 0, speed = 5.4, manual = false;
    const vi = OSW.veh.me ? OSW.veh.input : null, ix = joy.x + keys.r - keys.l + (vi ? vi.x : 0), iy = joy.y + keys.d - keys.u + (vi ? vi.y : 0), mag = hy(ix, iy);
    if (me.veh) { OSW.veh.step(dt, st.input ? ix : 0, st.input ? iy : 0); holding = false; sendMe(true, 1); return; }
    if (st.input && mag > 0.14) {
      manual = true; const m = Math.min(1, mag), fx_ = -Math.sin(cam.yaw), fz_ = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
      dx = (fx_ * -iy + rx * ix) / mag; dz = (fz_ * -iy + rz * ix) / mag; speed *= m;
      if (me.target || me.follow) cancelAuto();
    } else if (me.follow && pa.vis) {
      const ox = pa.x - me.x, oz = pa.z - me.z, d = hy(ox, oz);
      if (d > 2.0) { dx = ox / d; dz = oz / d; speed = d > 6 ? 6.4 : 4.6; }
    } else if (me.target) {
      if (me._rt !== me.target) { me._rt = me.target; me.route = mode === "out" ? buildRoute(me, me.target) : []; me.ri = 0; }
      while (me.ri < me.route.length && hy(me.route[me.ri][0] - me.x, me.route[me.ri][1] - me.z) < 1.3) me.ri++;
      const fin = me.ri >= me.route.length, wp = fin ? me.target : { x: me.route[me.ri][0], z: me.route[me.ri][1] };
      const ox = wp.x - me.x, oz = wp.z - me.z, d = hy(ox, oz);
      if (fin && d < 0.55) arrive();
      else if (!fin && d < 0.55) me.ri++;
      else {
        dx = ox / d; dz = oz / d;
        if (me.side) { const sx = -dz, sz = dx; dx = dx * 0.35 + sx * me.side * 0.9; dz = dz * 0.35 + sz * me.side * 0.9; const l = hy(dx, dz); dx /= l; dz /= l; me.side *= 0.995; }
        me.prog += dt; me.stuck += dt;
        if (hy(me.x - me.px, me.z - me.pz) > 0.35) { me.px = me.x; me.pz = me.z; me.stuck = 0; me.side = 0; }
        else if (me.stuck > 0.9 && !me.side) me.side = Math.random() < 0.5 ? 1 : -1;
        if (me.stuck > 3.5 && !fin) { me.ri++; me.stuck = 0; me.side = 0; }
        else if (me.prog > 14 + me.route.length * 6 || me.stuck > 3.5) { me.x = me.target.x; me.z = me.target.z; arrive(); }
      }
    }
    const moving = dx || dz, mul = (me.speedMul || 1) * (me.sprint || keys.sprint ? 1.55 : 1), kk = Math.min(1, dt * (moving ? 9 : 13));
    me.vx += (dx * speed * mul - me.vx) * kk; me.vz += (dz * speed * mul - me.vz) * kk;
    const sp = hy(me.vx, me.vz);
    if (sp > 0.06) {
      me.x += me.vx * dt; me.z += me.vz * dt; collide(me, 0.45);
      if (moving) me.ry += angDiff(me.ry, Math.atan2(dx, dz)) * Math.min(1, dt * 14);
      me.phase += sp * dt * 2.1; me.mv += (clamp(sp / 5.4, 0, 1.5) - me.mv) * Math.min(1, dt * 10);
      if (Math.floor(me.phase / PI) !== me._sp) { me._sp = Math.floor(me.phase / PI); OSW.audio && OSW.audio.sfx("step"); }
    } else me.mv += (0 - me.mv) * Math.min(1, dt * 10);
    holding = !!(me.follow && pa.vis && !pa.inside && !pa.sleep && (pa.space || null) === curSpace() && hy(me.x - pa.x, me.z - pa.z) < 3.2);
    sendMe(moving, sp);
  }
  /* مسار مشي تلقائي: لا يخترق سور المزرعة، بيمرّ من البوابة وباب الحظيرة */
  const inFarm = (x, z) => { const F = OSW.EX.FARM; return x > F.x0 && x < F.x1 && z > F.z0 && z < F.z1; };
  const inPens = (x, z) => x > -56 && x < -34 && z > -29 && z < -17;
  function buildRoute(f, t) {
    const F = OSW.EX.FARM, gx = F.gateX, gz = F.z1, route = [], fi = inFarm(f.x, f.z), ti = inFarm(t.x, t.z), pf = inPens(f.x, f.z), pt = inPens(t.x, t.z);
    const gO = [gx, gz + 3.2], gI = [gx, gz - 3.2], pO = [-31.5, -21], pI = [-36.5, -21];
    if (pf && !pt) route.push(pI, pO);
    if (fi && !ti) route.push(gI, gO);
    if (!fi && ti) route.push(gO, gI);
    if (!pf && pt) route.push(pO, pI);
    return route;
  }
  function arrive() {
    const act = me.act, res = me.res; me.target = null; me.act = null; me.res = null; me.side = 0; me.stuck = 0; me.prog = 0;
    if (tapMark) tapMark.life = 0.4;
    if (res) res(); if (act && W.onAct) W.onAct(act);
  }
  function cancelAuto() { me.target = null; me.act = null; me.follow = false; if (me.res) { const r = me.res; me.res = null; r(); } }
  function goTo(x, z, act, res) {
    cancelAuto(); me.target = { x, z }; me.act = act || null; me.res = res || null; me.prog = 0; me.stuck = 0; me.px = me.x; me.pz = me.z; me.side = 0;
    tapMark = { x, z, life: 1.6 };
  }

  /* ---------- أهل القرية ---------- */
  const npc = {};
  function createNpc(n) {
    const homeP = n.home ? S.poi[n.home] : null, pos = n.pos || [homeP.x, homeP.z];
    const o = (npc[n.id] = { def: n, x: pos[0], z: pos[1], ry: n.face || 0, phase: Math.random() * 6, mv: 0, ch: OSW.makeChar(lookKey(n.look)), wait: 1 + Math.random() * 4, tx: null, tz: null, route: [], stuck: 0, mood: "", mark: "", sc: n.look.scale || n.scale || 1, dance: false, over: null });
    const nm = mkLabel({ id: "npc_" + n.id, text: n.name, x: 0, y: 0, z: 0, cls: "tag np", max: 34, dynamic: n.id, follow: () => [o.x, 2.7 * o.sc, o.z] });
    const em = mkLabel({ id: "npcm_" + n.id, text: "", x: 0, y: 0, z: 0, cls: "mood", max: 28, dynamic: "m" + n.id, follow: () => (o.mood || o.mark ? [o.x, 3.35 * o.sc, o.z] : null) });
    o.moodEl = em; o.nameEl = nm; return o;
  }
  function initNpcs() { OSW.NPCS.forEach(createNpc); }
  const SPOTS = () => [[0, 58], [-12, 46], [12, 46], [-44, 12], [30, 36], [-30, 36], [0, 7.5], [6, 6], [-6, 6.5], [8, -3], [-8, -4], [0, -6], [-24, 15.8], [24, 15.8], [15, 3.4], [-15, 5.2], [0, 22], [-28, 8], [28, 8]];
  const ISLE_SPOTS = [[0, 1170], [-14, 1160], [14, 1160], [-22, 1135], [22, 1135], [0, 1140], [-40, 1180], [40, 1180], [0, 1200], [-25, 1215], [25, 1215], [-18, 1118], [16, 1122], [-30, 1160], [30, 1170], [0, 1225]];
  const kidState = {};
  function pickDest(o) {
    if (o.def.roam) { const r = o.def.roam, a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * r[2]; return [r[0] + Math.cos(a) * rr, r[1] + Math.sin(a) * rr]; }
    if (o.def.isle) { const p = ISLE_SPOTS[(Math.random() * ISLE_SPOTS.length) | 0]; return [p[0] + (Math.random() - 0.5) * 3, p[1] + (Math.random() - 0.5) * 3]; }
    const home = S.poi[o.def.home], r = Math.random();
    if (crowd && r < 0.85) return [crowd.x + (Math.random() - 0.5) * 6, crowd.z + (Math.random() - 0.5) * 4];
    if (r < 0.28) return [home.x, home.z]; const s = SPOTS(); const p = s[(Math.random() * s.length) | 0]; return [p[0] + (Math.random() - 0.5) * 2, p[1] + (Math.random() - 0.5) * 2];
  }
  function stepNpc(o, dt) {
    const d = o.def;
    if (o.over) {
      const dx0 = o.over.x - o.x, dz0 = o.over.z - o.z, dd = hy(dx0, dz0);
      if (dd < 2.4 || (o.over.t0 && performance.now() - o.over.t0 > 45000)) { const cb = o.over.cb; o.over = null; o.mv = 0; if (cb) cb(); return; }
      const sp0 = 3.0; o.x += (dx0 / dd) * sp0 * dt; o.z += (dz0 / dd) * sp0 * dt; collide(o, 0.4); o.ry += angDiff(o.ry, Math.atan2(dx0, dz0)) * Math.min(1, dt * 8); o.phase += sp0 * dt * 2.4; o.mv += (1 - o.mv) * Math.min(1, dt * 8); return;
    }
    if (d.stay) {
      const dm = hy(me.x - o.x, me.z - o.z); if (dm < 9) { const want = Math.atan2(me.x - o.x, me.z - o.z); o.ry += angDiff(o.ry, want) * Math.min(1, dt * 4); } else o.ry += angDiff(o.ry, d.face || 0) * Math.min(1, dt * 2);
      o.mv = 0; return;
    }
    if (o.tx == null) { o.wait -= dt; o.mv += (0 - o.mv) * Math.min(1, dt * 8); if (o.wait <= 0) { const dest = pickDest(o); o.route = []; const south = (z) => z > 31; if (south(o.z) && !south(dest[1])) o.route.push([o.x * 0.3, 34.5], [0, 33], [0, 27]); else if (!south(o.z) && south(dest[1])) o.route.push([0, 27], [0, 33], [dest[0] * 0.5, 34.5]); o.route.push(dest); const n = o.route.shift(); o.tx = n[0]; o.tz = n[1]; o.stuck = 0; } return; }
    const dx = o.tx - o.x, dz = o.tz - o.z, dist = hy(dx, dz);
    if (dist < 0.6) { if (o.route.length) { const n = o.route.shift(); o.tx = n[0]; o.tz = n[1]; } else { o.tx = null; o.wait = 3 + Math.random() * 7; } return; }
    const sp = d.speed || 1.8, ox = o.x, oz = o.z; o.x += (dx / dist) * sp * dt; o.z += (dz / dist) * sp * dt; collide(o, 0.4);
    if (hy(o.x - ox, o.z - oz) < sp * dt * 0.3) { o.stuck += dt; if (o.stuck > 2.5) { o.tx = null; o.wait = 0.2; o.route = []; } } else o.stuck = 0;
    o.ry += angDiff(o.ry, Math.atan2(dx, dz)) * Math.min(1, dt * 8); o.phase += sp * dt * 2.4; o.mv += (1 - o.mv) * Math.min(1, dt * 8);
  }

  /* ---------- الكاميرا ---------- */
  function camStep(dt) {
    if (me.veh && !cam.anim) { OSW.veh.camStep(cam, dt); return; }
    if (cam.anim) {
      const a = cam.anim, t = clamp((performance.now() - a.t0) / a.ms, 0, 1), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      ["pitch", "dist", "tx", "ty", "tz"].forEach((k) => (cam[k] = a.f[k] + (a.to[k] - a.f[k]) * e)); cam.yaw = a.f.yaw + angDiff(a.f.yaw, a.to.yaw) * e;
      if (t >= 1) { const r = a.res; cam.anim = null; if (r) r(); }
    } else if (cam.follow) {
      const k = 1 - Math.exp(-dt * 7); cam.tx += (me.x - cam.tx) * k; cam.tz += (me.z - cam.tz) * k; cam.ty += (1.5 - cam.ty) * k;
    }
  }
  function tweenCam(to, ms) {
    return new Promise((res) => { if (cam.anim && cam.anim.res) cam.anim.res(); cam.anim = { f: { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, tx: cam.tx, ty: cam.ty, tz: cam.tz }, to: Object.assign({ yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, tx: cam.tx, ty: cam.ty, tz: cam.tz }, to), t0: performance.now(), ms, res }; });
  }

  /* ---------- الرسم ---------- */
  function crateMesh(c) {
    if (crateCache[c]) return crateCache[c];
    const b = new Builder(); b.box(0, 0, 0, 0.66, 0.36, 0.5, "#c9a06a"); b.box(0, 0.05, 0.26, 0.6, 0.04, 0.02, "#a97c50"); b.sphere(-0.15, 0.36, 0, 0.17, 0.12, 0.17, c, 5); b.sphere(0.15, 0.36, 0.02, 0.17, 0.12, 0.17, c, 5); b.sphere(0, 0.4, -0.08, 0.15, 0.11, 0.15, c, 5);
    return (crateCache[c] = b.build(R.gl));
  }
  function drawCarried(o, colors, bags) {
    for (let i = 0; i < colors.length; i++) { M.trs(o.x, 0, o.z, o.ry, 0, 0, 1, 1, 1, m1); M.trs(0, 0.82 + i * 0.4, 0.66, 0, 0, 0, 1, 1, 1, m2); M.mul(m1, m2, m2); R.draw(crateMesh(colors[i]), m2); }
    for (let i = 0; i < (bags || 0); i++) { M.trs(o.x, 0, o.z, o.ry, 0, 0, 1, 1, 1, m1); M.trs(-0.52 - i * 0.12, 0.28, 0.12 + i * 0.1, 0.2, 0, 0, 1, 1, 1, m2); M.mul(m1, m2, m2); R.draw(meshes.bag, m2); }
  }
  const CART_PATH = [[-18.5, -12.6], [-28, -7], [-34, 2], [-33, 12], [-28, 17], [-26, 17.4]];
  function drawCart(t) {
    const D = S.dyn, a = cartS.anim;
    if (!a) { if (D.cart) { M.trs(cartS.home.x, 0, cartS.home.z, -0.5, 0, 0, 1, 1, 1, m1); R.draw(D.cart, m1); } return; }
    const el = (performance.now() - a.t0) / 1000, tot = 16;
    if (el >= tot) { cartS.anim = null; return; }
    const f = el < 8 ? el / 8 : 1 - (el - 8) / 8, seg = f * (CART_PATH.length - 1), i = Math.min(CART_PATH.length - 2, Math.floor(seg)), u = seg - i;
    const A = CART_PATH[i], Bp = CART_PATH[i + 1], x = A[0] + (Bp[0] - A[0]) * u, z = A[1] + (Bp[1] - A[1]) * u, hd = Math.atan2(Bp[0] - A[0], Bp[1] - A[1]) + (el < 8 ? 0 : PI) + PI / 2;
    M.trs(x, 0, z, hd, 0, 0, 1, 1, 1, m1); R.draw(el < 8 ? D.cartTravel : D.cartEmpty, m1);
  }
  const m1 = new Float32Array(16), m2 = new Float32Array(16);
  function applyFurn() {
    const B = new Builder(); furn.boxes.length = 0; furn.acts.length = 0;
    furn.list.forEach((f) => {
      const F = OSW.FURN[f.item]; if (!F) return;
      const r = OSW.furnRect(f.item, f.x, f.z, f.rot), rad = Math.max(r.w, r.d) / 2 + 0.3;
      if (selFurn === f.id) B.cyl(f.x, 0.02, f.z, rad, rad, 0.01, "#ffe066", 18, 0.9);
      B.push(f.x, 0, f.z, f.rot * PI / 2); F.build(B); B.pop();
      if (!F.flat) furn.boxes.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 });
      furn.acts.push({ act: "furn:" + f.id, x: f.x, y: F.flat ? 0.1 : 0.7, z: f.z, r: F.flat ? 0.9 : rad });
    });
    if (S.dyn.furn) R.free(S.dyn.furn); S.dyn.furn = B.build(R.gl);
  }
  function drawIsle(t) {
    const IX = 0, IZ = 1180;
    if (hy(cam.tx - IX, cam.tz - IZ) > 420 && !me.veh) return;
    for (let k = 0; k < 7; k++) { const a = t * (0.22 + (k % 3) * 0.03) + k * 0.9, r = 26 + (k % 4) * 9, y = 16 + (k % 3) * 3 + Math.sin(t * 0.7 + k) * 1.2, x = IX + Math.cos(a) * r, z = IZ + Math.sin(a) * r, fl = 0.7 + Math.sin(t * 9 + k * 2) * 0.35; M.trs(x, y, z, Math.atan2(-Math.sin(a), Math.cos(a)), 0, Math.sin(a * 2) * 0.25, 1.4, fl, 1.4, m1); R.draw(meshes.gull, m1); }
    for (let k = 0; k < 3; k++) { const a = t * 0.025 + k * 2.1, r = 122 + k * 11, x = IX + Math.cos(a) * r, z = IZ + Math.sin(a) * r; M.trs(x, -0.1 + Math.sin(t * 1.3 + k) * 0.08, z, Math.atan2(-Math.sin(a), Math.cos(a)), 0, Math.sin(t * 1.1 + k) * 0.06, 1.3, 1.3, 1.3, m1); R.draw(meshes.boat, m1); }
    for (let k = 0; k < 6; k++) { const a0 = 0.6 + k * 0.95, a = a0 + Math.sin(t * 0.3 + k * 1.7) * 0.18, r = 84 - (k % 3) * 2.2; M.trs(IX + Math.sin(a) * r, 0.05, IZ + Math.cos(a) * r, a + Math.PI / 2 + Math.cos(t * 0.3 + k * 1.7) * 0.4, 0, 0, 1.2, 1.2, 1.2, m1); R.draw(meshes.crab, m1); }
    const ph = (t * 0.45) % 2, u = ph < 1 ? ph : 2 - ph; M.trs(-45, 0.9 + Math.sin(u * Math.PI) * 2.6, 1195 + 10 * u, t * 3, 0, 0, 1, 1, 1, m1); R.draw(meshes.ball, m1);
  }
  function drawAnimalsCarried(o, kinds) {
    kinds.forEach((k, i) => { const sc = ANS[k].sc * 0.5; M.trs(o.x, 0, o.z, o.ry, 0, 0, 1, 1, 1, m1); M.trs(i ? 0.3 : -0.3, 1.0, 0.72, 0, 0, 0, sc, sc, sc, m2); M.mul(m1, m2, m2); R.draw(meshes[k], m2); });
  }
  function drawPeople(t) {
    const same = (pa.space || null) === curSpace();
    const dxp = pa.x - me.x, dzp = pa.z - me.z, sideMe = Math.cos(me.ry) * dxp - Math.sin(me.ry) * dzp, sideP = Math.cos(pa.ry) * -dxp - Math.sin(pa.ry) * -dzp;
    const showLink = same && pa.vis && !pa.inside && !pa.sleep && (holding || (pa.hold && hy(dxp, dzp) < 4));
    if (pa.ch && pa.vis && !pa.inside && same && !pa.veh) { OSW.drawChar(pa.ch, pa.x, pa.z, pa.ry, pa.phase, pa.mv, t, pa.sleep ? 0.55 : 1, null, 1, 0, carry.partner.length ? { carry: true } : showLink ? { hold: sideP >= 0 ? 1 : -1 } : null); drawCarried(pa, carry.partner, null); drawAnimalsCarried(pa, acarry.partner); }
    if (me.ch && !me.veh) { OSW.drawChar(me.ch, me.x, me.z, me.ry, me.phase, me.mv, t, 1, null, 1, 0, carry.me.length ? { carry: true } : showLink ? { hold: sideMe >= 0 ? 1 : -1 } : null); drawCarried(me, carry.me, bagState.n); drawAnimalsCarried(me, acarry.me); }
    if (showLink) { const mx = (me.x + pa.x) / 2, mz = (me.z + pa.z) / 2, len = Math.max(0.4, hy(dxp, dzp) - 0.9); M.trs(mx, 1.0, mz, Math.atan2(dxp, dzp), 0, 0, 1, 1, len, m1); R.draw(meshes.link, m1); }
  }
  /* ---------- الأولاد جوا البيت: صالون بالنهار، وبالليل (أو بأمرك) نايمين بغرفتهم ---------- */
  let kidsIn = [], kidIn3 = {}, kidsInSig = ""; const kidInCache = {};
  const KCOLS = ["#ff7aa8", "#4dabf7", "#7ac74f", "#ffb347", "#b565b0", "#e5484d"], KHAIRS = ["#2a1d12", "#6b4423", "#1b1b1b", "#a0522d"];
  function kidChar(k) {
    const key = k.id + k.stage + k.g; if (kidInCache[key]) return kidInCache[key];
    let h = 0; for (const ch of String(k.id)) h += ch.charCodeAt(0); const girl = k.g === "girl";
    return (kidInCache[key] = OSW.makeChar({ gender: k.g, color: KCOLS[h % KCOLS.length], hair: KHAIRS[h % KHAIRS.length], hairStyle: girl ? "ponytail" : "short", pants: girl ? undefined : "#2f6fb5", scale: 1 }));
  }
  function drawKidsIn(t) {
    kidIn3 = {}; if (!kidsIn.length) return;
    const H = OSW.HOME, kr = H.byId.kidsroom, lv = H.byId.living; if (!kr || !lv) return;
    const beds = furn.list.filter((f) => (f.item === "bed1" || f.item === "bed2") && f.x > kr.x0 && f.x < kr.x1 && f.z > kr.z0 && f.z < kr.z1).sort((a, b) => a.x - b.x);
    let si = 0, wi = 0;
    kidsIn.forEach((k) => {
      const sc = k.stage === "baby" ? 0.42 : k.stage === "teen" ? 0.86 : 0.66; let p;
      if (k.sleeping) {
        const b = beds[si];
        if (b) { const ry = (b.rot || 0) * PI / 2; p = { x: b.x + Math.sin(ry) * 0.45, z: b.z + Math.cos(ry) * 0.45, ry, y0: 0.74 + 0.27 * sc, lie: true }; }
        else p = { x: kr.cx - 3.5 + si * 1.8, z: kr.cz + 2.4, ry: 0, y0: 0.03 + 0.27 * sc, lie: true };
        si++;
      } else {
        const a = wi++ * 2.1 + 1, ph = t * 0.25 + a, pz = t * 0.19 + a * 1.3;
        p = { x: lv.cx + Math.sin(ph) * 3.8, z: lv.cz - 2.6 + Math.cos(pz) * 0.9, y0: 0, mv: 0.7, ry: Math.atan2(Math.cos(ph) * 0.95, -Math.sin(pz) * 0.17) };
      }
      OSW.drawChar(kidChar(k), p.x, p.z, p.ry, t * 5 + wi, p.mv || 0, t, 1, null, sc, p.y0, p.lie ? { lie: true } : null);
      kidIn3[k.id] = { x: p.x, z: p.z, y: p.lie ? 1.2 : 0.66 * 1.9 + 0.2 };
    });
  }
  function refreshKidLabels() {
    for (let i = labs.length - 1; i >= 0; i--) if (labs[i].kin) { labs[i].el.remove(); labs.splice(i, 1); }
    if (!(mode === "in" && curInt && curInt.id === "home")) return;
    kidsIn.forEach((k) => { const l = mkLabel({ id: "kin_" + k.id, text: (k.sleeping ? "💤 " : "") + k.name, cls: "tag np", max: 36, scope: "in", dynamic: "int", x: 0, y: 0, z: 0, follow: () => (kidIn3[k.id] ? [kidIn3[k.id].x, kidIn3[k.id].y, kidIn3[k.id].z] : null) }); if (l) l.kin = 1; });
  }
  function drawInside(t) {
    const D = S.dyn; R.draw(curInt.mesh); if (D.furn) R.draw(D.furn);
    inNpcs.forEach((o) => OSW.drawChar(o.ch, o.x, o.z, o.ry, 0, 0, t, 1, null, 1));
    if (curInt.id === "home") { let ii = 0; Object.values(pets3).forEach((o) => { if (o.mode !== "home") return; const sp = curInt.spawn, q = { x: sp.x - 3.5 + (ii % 5) * 1.7, z: sp.z + 1.4 + Math.floor(ii / 5) * 1.5, ry: o.ry, phase: o.phase + t * 0.2, v: 0, mv: 0, pitch: 0.05, kind: o.kind, vi: o.vi, sc: o.sc, ph0: o.ph0, id: o.id }; ii++; drawPet(q, t); }); drawKidsIn(t); }
    drawPeople(t);
    R.blend(true); inNpcs.forEach((o) => OSW.drawShadow(o.x, o.z, 0.6)); if ((pa.space || null) === curSpace() && pa.vis) OSW.drawShadow(pa.x, pa.z, 0.62); OSW.drawShadow(me.x, me.z, 0.62);
    if (tapMark && tapMark.life > 0) { const b = tapMark; M.trs(b.x, 0.05, b.z, 0, 0, 0, 0.8 + (1.6 - b.life) * 0.25, 1, 0.8 + (1.6 - b.life) * 0.25, m1); R.draw(meshes.ring, m1, [1, 0.9, 0.4], Math.max(0, Math.min(1, b.life)) * 0.6); }
    R.blend(false);
  }
  function drawScene() {
    const cp = Math.cos(cam.pitch), eye = [cam.tx + Math.sin(cam.yaw) * cp * cam.dist, cam.ty + Math.sin(cam.pitch) * cam.dist, cam.tz + Math.cos(cam.yaw) * cp * cam.dist];
    if (!cam.fp && eye[1] < 2.2) eye[1] = 2.2;
    R.near = cam.fp ? 0.12 : 0.8;
    const env = envNow(); R.begin(eye, [cam.tx, cam.ty, cam.tz], OSW.veh.fov(R.aspect < 1 ? 1.08 : 0.92), env);
    const t = st.t, D = S.dyn;
    if (mode === "in") { drawInside(t); return; }
    R.draw(D.main); R.draw(D.foliage, null, null, 1, 1.6);
    ["tree", "board", "home", "farm", "flowers", "wedding"].forEach((k) => D[k] && R.draw(D[k], null, null, 1, k === "flowers" ? 1.2 : 0));
    // نافورة: قطرات
    for (let i = 0; i < 14; i++) { const ph = (t * 0.8 + i / 14) % 1, a = i * 2.4, rr = ph * 2.6, y = 4.0 + Math.sin(ph * PI) * 1.7 - ph * 2.6; M.trs(Math.cos(a) * rr, y, Math.sin(a) * rr, 0, 0, 0, 1, 1, 1, m1); R.draw(meshes.drop, m1); }
    // دخان المداخن
    [[2.4, 8.2, -15.2]].forEach((c, k) => { for (let i = 0; i < 3; i++) { const ph = (t * 0.25 + i / 3 + k * 0.3) % 1; M.trs(c[0] + ph * 1.4, c[1] + ph * 3, c[2], 0, 0, 0, 0.3 + ph * 0.7, 0.3 + ph * 0.7, 0.3 + ph * 0.7, m1); R.draw(meshes.puff, m1, [1, 1, 1], (1 - ph) * 0.45); } });
    // طاحونة وقطار وغيوم وطيور
    M.trs(OSW.EX.WINDMILL.x, 8.4, OSW.EX.WINDMILL.z + 2.4, 0, 0, t * 0.7, 1, 1, 1, m1); R.draw(meshes.blades, m1);
    const ph = (Math.sin(t * 0.12) + 1) / 2; M.trs(36 + ph * 22, 0.2, 7.9, 0, 0, 0, 1, 1, 1, m1); R.draw(meshes.train, m1);
    for (let i = 0; i < 6; i++) { const x = ((t * (1.2 + i * 0.25) + i * 52) % 280) - 120; M.trs(x, 38 + (i % 3) * 5, -50 + i * 18, 0, 0, 0, 1.4 + (i % 2) * 0.5, 1, 1.4, m1); R.draw(meshes.cloud, m1, [1, 1, 1], 0.92 - st.night * 0.55); }
    if (st.night < 0.6) for (let i = 0; i < 4; i++) { const a = t * 0.18 + i * 1.6, rr = 34 + i * 7; M.trs(Math.cos(a) * rr, 22 + i * 2, Math.sin(a) * rr * 0.7 + 8, -a, 0, Math.sin(t * 6 + i) * 0.35, 1, 1, 1, m1); R.draw(meshes.bird, m1); }
    for (let i = 0; i < 6; i++) { const cx = i < 3 ? S.pos.flowers.x : S.pos.farm.x, cz = i < 3 ? S.pos.flowers.z : S.pos.farm.z, a = t * (0.6 + i * 0.1) + i * 2; M.trs(cx + Math.cos(a) * (3 + i % 3), 1.2 + Math.sin(a * 2) * 0.4, cz + Math.sin(a * 1.3) * 4, a, 0, Math.sin(t * 14 + i) * 0.6, 1, 1, 1, m1); R.draw(meshes.bf, m1); }
    if (st.night > 0.5) for (let i = 0; i < 22; i++) { const a = t * 0.3 + i * 1.7; M.trs(-40 + ((i * 37) % 80) + Math.cos(a) * 2, 0.9 + Math.sin(a * 1.4) * 0.5, -20 + ((i * 53) % 70) + Math.sin(a) * 2, 0, 0, 0, 1, 1, 1, m1); R.draw(meshes.fly, m1); }
    // عربة المزرعة (وبتتحرك لما الاثنين يسحبوها)
    drawCart(t);
    OSW.veh.drawAll(t); drawIsle(t); if (OSW.logi) OSW.logi.draw(t);
    // شخصيات
    OSW.NPCS.forEach((d) => { const o = npc[d.id]; if (o) OSW.drawChar(o.ch, o.x, o.z, o.ry, o.phase, o.mv, t, 1, null, o.sc, o.dance ? Math.abs(Math.sin(t * 5 + o.phase)) * 0.16 : 0); });
    Object.values(animals).forEach((a) => drawAnimal(a, t)); Object.values(pets3).forEach((o) => drawPet(o, t));
    M.trs(pet.x, Math.abs(Math.sin(pet.phase)) * 0.08 * pet.mv, pet.z, pet.ry, 0, 0, 1.3, 1.3, 1.3, m1); R.draw(meshes.cat, m1);
    drawPeople(t);
    // ظلال مسقطة حقيقية للمباني والأشجار والشخصيات
    if (OSW.shadowsOn === true) {
      let L = env.sunDir.slice(); if (L[1] > -0.38) L[1] = -0.38; const ll = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ll, L[1] / ll, L[2] / ll];
      R.shadow(true, L, 0.34 - 0.14 * st.night);
      R.draw(D.main); R.draw(D.foliage, null, null, 1, 1.6);
      ["tree", "home", "flowers"].forEach((k) => D[k] && R.draw(D[k], null, null, 1, 0));
      OSW.NPCS.forEach((d) => { const o = npc[d.id]; if (o) OSW.drawChar(o.ch, o.x, o.z, o.ry, o.phase, o.mv, t, 1, null, o.sc, 0); });
      Object.values(animals).forEach((a) => drawAnimal(a, t)); Object.values(pets3).forEach((o) => drawPet(o, t));
      drawPeople(t); drawCart(t); OSW.veh.drawAll(t, true); if (OSW.life) OSW.life.draw(t);
      R.shadow(false);
    }
    // شفّاف: ظلال + شعاع المنارة + علامة اللمس
    R.blend(true);
    R.draw(D.shadow, null, [0, 0, 0], 0.2);
    Object.values(animals).forEach((a) => OSW.drawShadow(a.x, a.z, ANS[a.kind].r * a.size * 0.9)); Object.values(pets3).forEach((o) => OSW.drawShadow(o.x, o.z, 0.45 * o.sc));
    OSW.NPCS.forEach((d) => { const o = npc[d.id]; if (o) OSW.drawShadow(o.x, o.z, 0.6 * o.sc); }); OSW.drawShadow(pet.x, pet.z, 0.5);
    if (pa.vis && !pa.inside) OSW.drawShadow(pa.x, pa.z, 0.62); OSW.drawShadow(me.x, me.z, 0.62);
    if (W.lit && st.night > 0.35) { M.trs(75, 12.1, -2, t * 0.9, 0, 0, 1, 1, 1, m1); R.draw(meshes.beam, m1, [1, 1, 1], 0.2 * st.night); }
    if (tapMark && tapMark.life > 0) { const b = tapMark; M.trs(b.x, 0.2, b.z, 0, 0, 0, 0.8 + (1.6 - b.life) * 0.25, 1, 0.8 + (1.6 - b.life) * 0.25, m1); R.draw(meshes.ring || (meshes.ring = (() => { const bb = new Builder(); bb.cyl(0, 0.12, 0, 1.0, 1.0, 0.02, "#ffffff", 20); bb.cyl(0, 0.13, 0, 0.8, 0.8, 0.03, "#000000", 20); return bb.build(R.gl); })()), m1, [1, 0.9, 0.4], clamp(b.life, 0, 1) * 0.6); }
    R.blend(false);
  }

  /* ---------- الحلقة الرئيسية ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    if (st.paused || document.hidden || !S.ready) { st.last = now; return; }
    const dt = Math.min(0.05, (now - (st.last || now)) / 1000); st.last = now; st.t += dt;
    stepMe(dt); if (mode === "out") { stepPet(dt); stepAnimals(dt); stepPets(dt); OSW.NPCS.forEach((d) => npc[d.id] && stepNpc(npc[d.id], dt)); } else inNpcs.forEach((o) => { const dm = hy(me.x - o.x, me.z - o.z); o.ry += angDiff(o.ry, dm < 8 ? Math.atan2(me.x - o.x, me.z - o.z) : 0) * Math.min(1, dt * 4); });
    // الشريك: تنعيم الحركة
    if (pa.vis) { const k = 1 - Math.exp(-dt * 9), ox = pa.x, oz = pa.z; pa.x += (pa.tx - pa.x) * k; pa.z += (pa.tz - pa.z) * k; const sp = hy(pa.x - ox, pa.z - oz) / Math.max(dt, 0.001); pa.mv += ((sp > 0.6 ? 1 : 0) - pa.mv) * Math.min(1, dt * 8); if (sp > 0.6) { pa.ry += angDiff(pa.ry, Math.atan2(pa.tx - pa.x, pa.tz - pa.z)) * Math.min(1, dt * 10); pa.phase += sp * dt * 2.1; } }
    // مشي سوا: وقت قريب من بعض
    if (pa.vis && !pa.sleep && !pa.inside && hy(me.x - pa.x, me.z - pa.z) < 4.2) { together += dt; if (together > 45 && W.onTogether) { together = 0; W.onTogether(); } } else together = Math.max(0, together - dt * 0.5);
    if (tapMark && tapMark.life > 0) tapMark.life -= dt;
    camStep(dt); drawScene(); updateLabels(); fxFrame();
    if (W._snapCb) { const cb = W._snapCb; W._snapCb = null; cb(); }
  }

  /* ---------- مدخلات اللمس والماوس ---------- */
  function pick(px, py) {
    const ray = R.ray(px, py); let best = null, bt = 1e9;
    const acts = mode === "in" ? curInt.acts.concat(furn.acts) : S.acts;
    acts.forEach((a) => { const t = R.hitSphere(ray, a.x, a.y, a.z, a.r); if (t > 0 && t < bt) { bt = t; best = a.act; } });
    if (mode === "out") {
      OSW.NPCS.forEach((d) => { const o = npc[d.id]; const t = o && R.hitSphere(ray, o.x, 1.0 * o.sc, o.z, 1.35 * o.sc); if (t > 0 && t < bt) { bt = t; best = d.act || "npc:" + d.id; } });
      if (!me.veh) OSW.veh.owned().forEach((c) => { const s = OSW.veh.slot(c), t = R.hitSphere(ray, s.x, 0.9, s.z, 2.3); if (t > 0 && t - 6 < bt) { bt = t - 6; best = "car:" + c.id; } });
      Object.values(animals).forEach((a) => { const t = R.hitSphere(ray, a.x, 0.7, a.z, 0.9 + a.size * 0.5); if (t > 0 && t < bt) { bt = t; best = "pens"; } });
      { const t = R.hitSphere(ray, pet.x, 0.5, pet.z, 1.0); if (t > 0 && t < bt) { bt = t; best = "pet"; } }
      Object.values(pets3).forEach((o) => { const t = R.hitSphere(ray, o.x, 0.4, o.z, 0.8); if (t > 0 && t < bt) { bt = t; best = "mypet:" + o.id; } });
    } else inNpcs.forEach((o) => { const t = R.hitSphere(ray, o.x, 1.0, o.z, 1.4); if (t > 0 && t < bt) { bt = t; best = o.act || "npc:" + o.id; } });
    if (pa.vis && !pa.inside && (pa.space || null) === curSpace()) { const t = R.hitSphere(ray, pa.x, 1.0, pa.z, 1.4); if (t > 0 && t < bt) { bt = t; best = "partner"; } }
    if (mode === "in" && curInt && curInt.id === "home") Object.keys(kidIn3).forEach((id) => { const o = kidIn3[id], t = R.hitSphere(ray, o.x, 0.9, o.z, 1.1); if (t > 0 && t < bt) { bt = t; best = "family"; } });
    if (best) return { act: best };
    const g = R.hitGround(ray); return g ? { ground: g } : null;
  }
  function tapAct(act) {
    if (me.veh) return;
    if (!st.input || !W.onAct) return;
    if (act === "partner") { W.onAct("partner"); return; }
    if (act === "pet") { W.onAct("pet"); return; }
    if (act.startsWith("mypet:")) { W.onAct(act); return; }
    if (act.startsWith("furn:")) { W.onAct(act); return; }
    let poi = mode === "in" ? curInt.poi[act] : S.poi[act];
    if (!poi && act.startsWith("npc:")) { const o = npc[act.slice(4)]; if (o) poi = { x: o.x, z: o.z + 2.2 }; }
    if (!poi && act.startsWith("hidden:")) { const h = OSW.HIDDEN.find((x) => x.id === act.slice(7)); if (h) poi = { x: (h.x - 1300) / 21 + 1.2, z: (h.y - 940) / 21 + 1.2 }; }
    if (poi) goTo(poi.x, poi.z, act); else W.onAct(act);
  }
  function bindInput() {
    const el = $("#world"), ptr = new Map();
    let moved = 0, t0 = 0, last = 0;
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest && e.target.closest(".l3.tap")) return;
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 1) { moved = 0; t0 = performance.now(); } if (ptr.size === 2) { const [a, b] = [...ptr.values()]; last = hy(a.x - b.x, a.y - b.y); moved = 99; }
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    el.addEventListener("pointermove", (e) => {
      const p = ptr.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (ptr.size === 1) { moved += Math.abs(dx) + Math.abs(dy); if (moved > 9 && st.input && !cam.anim && me.veh && OSW.veh.lookDrag(dx, dy)) { el.classList.add("dragging"); } else if (moved > 9 && st.input && !cam.anim) { cam.yaw -= dx * 0.0062; cam.pitch = clamp(cam.pitch + dy * 0.004, 0.3, 1.2); el.classList.add("dragging"); } p.x = e.clientX; p.y = e.clientY; }
      else if (ptr.size === 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...ptr.values()], d = hy(a.x - b.x, a.y - b.y); if (last && st.input) cam.dist = clamp(cam.dist * (last / d), 7, 36); last = d; }
    });
    const up = (e) => {
      if (!ptr.has(e.pointerId)) return; const was = ptr.size; ptr.delete(e.pointerId); el.classList.remove("dragging"); last = 0;
      if (was === 1 && moved <= 9 && performance.now() - t0 < 600 && st.input) {
        if (floorHandler) { const g0 = R.hitGround(R.ray(e.clientX, e.clientY)); if (g0) floorHandler(g0[0], g0[1]); return; }
        const r = pick(e.clientX, e.clientY); if (!r) return;
        if (r.act) tapAct(r.act);
        else { const g = r.ground, bb = mode === "in" ? curInt.bounds : B_; goTo(clamp(g[0], bb.x0, bb.x1), clamp(g[1], bb.z0, bb.z1)); }
      }
    };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", (e) => { if (!st.input) return; e.preventDefault(); cam.dist = clamp(cam.dist * (e.deltaY > 0 ? 1.1 : 0.9), 7, 36); }, { passive: false });
    labelsEl.addEventListener("click", (e) => { const l = e.target.closest(".l3.tap"); if (l && st.input) tapAct(l.dataset.act); });
    const kmap = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r", ArrowUp: "u", w: "u", W: "u", ArrowDown: "d", s: "d", S: "d" };
    const typing = () => { const a = document.activeElement; return a && /INPUT|TEXTAREA|SELECT/.test(a.tagName); };
    addEventListener("keydown", (e) => { if (e.key === "Shift") keys.sprint = 1; if (typing() || !st.input) return; const k = kmap[e.key]; if (k) { keys[k] = 1; e.preventDefault(); } });
    addEventListener("keyup", (e) => { if (e.key === "Shift") keys.sprint = 0; const k = kmap[e.key]; if (k) keys[k] = 0; });
    addEventListener("blur", () => { keys.l = keys.r = keys.u = keys.d = 0; });
    // عصا الحركة
    const jb = $("#joy"), jk = $("#joyKnob"); let jid = null;
    const jset = (e) => { const r = jb.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy; const m = hy(dx, dy), max = r.width / 2 - 8; if (m > max) { dx = (dx / m) * max; dy = (dy / m) * max; } joy.x = dx / max; joy.y = dy / max; jk.style.transform = `translate(${dx}px,${dy}px)`; };
    jb.addEventListener("pointerdown", (e) => { jid = e.pointerId; try { jb.setPointerCapture(jid); } catch (_) {} joy.on = true; jset(e); e.preventDefault(); });
    jb.addEventListener("pointermove", (e) => { if (e.pointerId === jid) jset(e); });
    const jend = (e) => { if (e.pointerId !== jid) return; jid = null; joy.x = joy.y = 0; joy.on = false; jk.style.transform = ""; };
    jb.addEventListener("pointerup", jend); jb.addEventListener("pointercancel", jend);
    addEventListener("resize", () => { if (R.gl) R.resize(); const c = fx.cv; if (c) { fx.w = c.width = innerWidth; fx.h = c.height = innerHeight; } });
  }

  /* ---------- بناء/إعادة بناء ---------- */
  function rebuildStatic() {
    clearStaticLabels(); S.build(st.season); (W._after || []).forEach((f) => f());
    S.labels.forEach((d) => { const l = mkLabel(d); if (d.hid) l.hid = d.hid; });
    W._restoreHidden && W._restoreHidden();
  }

  /* ---------- الواجهة العامة ---------- */
  Object.assign(W, {
    cam, me, pa, st, S,
    init() {
      const cv = $("#gl"); labelsEl = $("#labels");
      cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); st.paused = true; });
      cv.addEventListener("webglcontextrestored", () => location.reload());
      let ok = false; try { ok = R.init(cv); } catch (e) { console.error(e); }
      if (!ok) { W.noGL = true; return false; }
      R.resize(); buildMeshes();
      fx.cv = $("#fx"); fx.c = fx.cv.getContext("2d"); fx.w = fx.cv.width = innerWidth; fx.h = fx.cv.height = innerHeight;
      updateSky(); setInterval(updateSky, 60000);
      rebuildStatic(); initNpcs(); bindInput();
      S.rebuildTree(0); S.rebuildBoard(0); S.rebuildHome({ wall: "#FFF1D6", roof: "#E5484D", door: "#8a3b3b" }); S.rebuildFarm([]); S.rebuildFlowers(0, false, false); S.rebuildCart([], "cart"); S.rebuildCart([], "cartEmpty"); S.rebuildCart([], "cartTravel");
      mkLabel({ id: "home", text: "💞 بيتنا", x: S.pos.home.x, y: 9.4, z: S.pos.home.z, act: "home", max: 80, cls: "home", dynamic: "home" });
      ["me", "partner"].forEach((w) => mkLabel({ id: "tag_" + w, text: "", x: 0, y: 0, z: 0, cls: "tag " + w, max: 70, dynamic: w, scope: "both", follow: () => { const o = w === "me" ? me : pa; if (!o.ch || (w === "partner" && (!pa.vis || pa.inside || (pa.space || null) !== curSpace()))) return null; return [o.x, 2.55, o.z]; } }));
      mkLabel({ id: "holdh", text: "💞", x: 0, y: 0, z: 0, cls: "mood", max: 60, dynamic: "holdh", scope: "both", follow: () => (holding && pa.vis ? [(me.x + pa.x) / 2, 2.9, (me.z + pa.z) / 2] : null) });
      mkLabel({ id: "zz", text: "💤", x: 0, y: 0, z: 0, cls: "mood", max: 40, dynamic: "zz", follow: () => (pa.vis && pa.sleep && !pa.inside ? [pa.x, 3.0, pa.z] : null) });
      mkLabel({ id: "inside", text: "", x: 0, y: 0, z: 0, cls: "inside", max: 70, dynamic: "inside", follow: () => { if (!pa.inside || !S.pos[pa.inside.replace("house:", "")]) return null; const p = S.pos[pa.inside.replace("house:", "")]; return [p.x, 6.4, p.z + 3]; } });
      requestAnimationFrame(frame); return true;
    },
    onReady(f) { (W._after = W._after || []).push(f); },
    resize() { R.resize(); },
    pause(v) { st.paused = !!v; },
    // لقطة من العالم (بتنلتقط بنفس الإطار عشان الصورة ما تطلع فاضية)
    snapshot() { return new Promise((res) => { W._snapCb = () => { try {
      const gl = R.canvas, k = Math.min(1, 800 / gl.width), w = Math.round(gl.width * k), h = Math.round(gl.height * k), cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const c = cv.getContext("2d"), n = st.night, mx = (a, b) => Math.round(a + (b - a) * n), g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgb(${mx(110, 16)},${mx(180, 18)},${mx(240, 55)})`); g.addColorStop(1, `rgb(${mx(220, 40)},${mx(238, 40)},${mx(255, 95)})`);
      c.fillStyle = g; c.fillRect(0, 0, w, h); c.drawImage(gl, 0, 0, w, h); if (fx.cv) c.drawImage(fx.cv, 0, 0, w, h);
      c.font = "bold " + Math.round(h * 0.035) + "px sans-serif"; c.fillStyle = "rgba(255,255,255,.85)"; c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 4; c.textAlign = "left"; c.fillText("Our Small World", 12, h - 12);
      res(cv.toDataURL("image/jpeg", 0.72)); } catch (e) { res(null); } }; }); },
    setInputEnabled(v) { st.input = v; if (!v) { joy.x = joy.y = 0; keys.l = keys.r = keys.u = keys.d = 0; } },
    updateSky, period,
    setHour(h) { st.hourOverride = h; return updateSky(); },
    setWeather(m) { st.wmode = m; localStorage.setItem("osw_weather", m); }, 
    poi: (a) => S.poi[/^[a-z]+:/.test(a) || S.poi[a] ? a : "house:" + a],
    get _int() { return { me, pa, cam, S, keys, joy, collide, cancelAuto, goTo, meshes, acarry, setInput: (v) => { st.input = v; } }; },
    setLook, remote,
    spawnMe(x, z) { me.x = x; me.z = z; cam.tx = x; cam.tz = z; },
    placeMe(x, z) { me.x = x; me.z = z; },
    goTo, tapAct, cancelAuto,
    walkToPOI(a) { return new Promise((res) => { const P2 = mode === "in" ? curInt.poi : S.poi; const p = P2[/^[a-z0-9]+$/.test(a) && !P2[a] ? "house:" + a : a]; if (!p) return res(); if (hy(me.x - p.x, me.z - p.z) < 1.2) return res(); goTo(p.x, p.z, null, res); }); },
    followPartner(v) { if (v) cancelAuto(); me.follow = !!v; },
    get following() { return me.follow; },
    focusOn(a, ms = 900) {
      const k = /^[a-z0-9]+$/.test(a) && !S.poi[a] ? "house:" + a : a, ac = S.acts.find((x) => x.act === k); if (!ac) return Promise.resolve();
      cam.saved = { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist }; cam.follow = false;
      return tweenCam({ yaw: 0, pitch: 0.34, dist: k.startsWith("house:") ? 10 : 12, tx: ac.x, ty: 2.2, tz: ac.z + 1 }, ms);
    },
    releaseFocus(ms = 800) { cam.follow = true; const s = cam.saved || { yaw: 0, pitch: 0.5, dist: 17 }; return tweenCam({ yaw: s.yaw, pitch: s.pitch, dist: s.dist, tx: me.x, ty: 1.5, tz: me.z }, ms); },
    intro() { cam.follow = true; cam.yaw = 0; cam.pitch = 0.42; cam.dist = 30; cam.tx = me.x; cam.tz = me.z; return tweenCam({ pitch: 0.55, dist: 17 }, 3200); },
    zoomBy(f) { cam.dist = clamp(cam.dist / f, 7, 36); },
    resetCam() { cam.follow = true; return tweenCam({ yaw: 0, pitch: 0.55, dist: 17, tx: me.x, ty: 1.5, tz: me.z }, 600); },
    setBadges(map) { labs.forEach((l) => { if (!l.badge) return; const n = map[l.badge] || 0, b = l.el.querySelector(".bd"); if (b) { b.hidden = !n; b.textContent = n > 9 ? "9+" : n; } }); },
    setTree(total) { S.rebuildTree(total); }, setBoard(n) { S.rebuildBoard(n); },
    updateHome(cfg, names) { S.rebuildHome(cfg); const l = labs.find((x) => x.id === "home"); if (l) l.el.querySelector(".lt").textContent = "💞 " + names; },
    setLighthouse(v) { W.lit = !!v; },
    setHiddenFound(set) { W._found = set; W._restoreHidden = () => labs.forEach((l) => { if (l.hid) l.hidden = set.has(l.hid); }); W._restoreHidden(); },
    setFarm(plots) { S.rebuildFarm(plots); }, setFlowers(a, b, c) { S.rebuildFlowers(a, b, c); },
    setNpcMood(id, mood, mark) { const o = npc[id]; if (!o) return; o.mood = mood || ""; o.mark = mark || ""; o.moodEl.el.querySelector(".lt").textContent = (o.mark || "") + (o.mood || ""); },
    say(id, text, ms = 5000) {
      const o = id === "me" ? me : id === "partner" ? pa : id === "pet" ? pet : id.startsWith("pet:") ? pets3[id.slice(4)] : npc[id]; if (!o) return;
      const old = labs.findIndex((l) => l.dynamic === "say_" + id); if (old > -1) { labs[old].el.remove(); labs.splice(old, 1); }
      const sc = (o.sc || 1), l = mkLabel({ id: "say_" + id, text, x: 0, y: 0, z: 0, cls: "say", max: 60, scope: "both", dynamic: "say_" + id, follow: () => [o.x, 3.6 * sc + 0.4, o.z] });
      setTimeout(() => { const i = labs.indexOf(l); if (i > -1) { l.el.remove(); labs.splice(i, 1); } }, ms);
    },
    setPartnerState(s) { // {inside:'house:..'|null, sleeping:bool, visible:bool}
      if ("inside" in s) { pa.inside = s.inside; const l = labs.find((x) => x.dynamic === "inside"); if (l) l.el.querySelector(".lt").textContent = s.inside ? `💕 ${pa.name} جوّا` : ""; }
      if ("sleeping" in s) { pa.sleep = s.sleeping; if (s.sleeping) { pa.x = pa.tx = 3.6; pa.z = pa.tz = -8.4; pa.ry = -0.6; pa.vis = true; pa.mv = 0; } }
      if ("visible" in s) pa.vis = s.visible;
    },
    partnerDist() { return pa.vis && (pa.space || null) === curSpace() ? hy(me.x - pa.x, me.z - pa.z) : 1e9; },
    getMe: () => ({ x: me.x, z: me.z }),
    setPlayerLabelsHidden(v) { labs.forEach((l) => { if (l.dynamic === "me" || l.dynamic === "partner") l.hidden = v; }); },
    setAnimals(list) {
      const seen = new Set(); const PN = OSW.EX.PENS;
      list.forEach((a) => { seen.add(a.id); let o = animals[a.id]; if (!o) { const R2 = PN[a.kind]; o = animals[a.id] = { kind: a.kind, x: R2.x0 + 1.5 + Math.random() * (R2.x1 - R2.x0 - 3), z: R2.z0 + 2 + Math.random() * (R2.z1 - R2.z0 - 4), ry: Math.random() * 6.28, phase: Math.random() * 6, mv: 0, wait: Math.random() * 3, tx: null, tz: null, size: a.size }; } o.size = a.size; o.fed = a.fed !== false; });
      Object.keys(animals).forEach((k) => { if (!seen.has(k)) delete animals[k]; });
    },
    setAnimalCarry(w, kinds) { acarry[w] = kinds || []; },
    setPets(list) {
      const seen = new Set();
      list.forEach((p) => {
        seen.add(p.id); let o = pets3[p.id];
        if (!o) {
          const base = p.owner === "me" ? me : pa, out = p.owner === "me" ? mode === "out" : (pa.vis && !pa.inside), hp_ = S.poi.home || { x: 0, z: -7 };
          let vi = 0; for (const ch of String(p.id)) vi += ch.charCodeAt(0);
          o = pets3[p.id] = { id: p.id, kind: p.kind, owner: p.owner, vi: vi % 4, x: (out ? base.x : hp_.x) - 1.5, z: (out ? base.z : hp_.z) - 1.5, ry: Math.random() * 6.28, phase: Math.random() * 6, v: 0, mv: 0, pitch: 0, wait: 1, tx: null, tz: null, ph0: Math.random() * 6, sc: p.kind === "dog" ? 1.15 : 1.0 };
        }
        o.owner = p.owner; o.mode = p.mode || "follow"; o.hx = p.hx; o.hz = p.hz; o.nm = p.label || "";
        if (o.nm && !o.lab) { const oo = o; o.lab = mkLabel({ id: "petl_" + p.id, text: o.nm, x: 0, y: 0, z: 0, cls: "tag np", max: 28, dynamic: "petl" + p.id, follow: () => (mode === "out" && pets3[oo.id] ? [oo.x, 1.3, oo.z] : null) }); o.labT = o.nm; }
        else if (o.lab && o.labT !== o.nm) { const t2 = o.lab.el.querySelector(".lt"); if (t2) t2.textContent = o.nm; o.labT = o.nm; o.lab.hidden = !o.nm; }
      });
      Object.keys(pets3).forEach((k) => { if (!seen.has(k)) { for (let i = labs.length - 1; i >= 0; i--) if (labs[i].dynamic === "petl" + k) { labs[i].el.remove(); labs.splice(i, 1); } delete pets3[k]; } });
    },
    petsPos: () => Object.values(pets3).map((o) => ({ id: o.id, x: o.x, z: o.z, name: o.nm ? o.nm.replace(/^\S+\s/, "") : "" })),
    setLandLabels(list) { for (let i = labs.length - 1; i >= 0; i--) if (labs[i].dynamic === "landl") { labs[i].el.remove(); labs.splice(i, 1); } list.forEach((d) => mkLabel({ id: "landl_" + d.id, text: d.text, x: d.x, y: 4.6, z: d.z, cls: "tag", max: 95, act: d.act, dynamic: "landl" })); },
    setCarry(w, colors) { carry[w] = colors || []; },
    setBags(n) { bagState.n = n || 0; },
    setSpeedMul(m) { me.speedMul = m; },
    setSprint(v) { me.sprint = !!v; },
    setCart(colors, last) {
      const prev = cartS.colors; cartS.colors = colors || [];
      if (last && last.t !== cartS.lastT) {
        const fresh = cartS.lastT !== 0 && Date.now() - last.t < 20000; cartS.lastT = last.t;
        if (fresh) { S.rebuildCart(prev.length ? prev : Array(last.n || 1).fill("#e63946"), "cartTravel"); cartS.anim = { t0: performance.now() }; }
      }
      if (!last && cartS.lastT === 0) cartS.lastT = -1;
      S.rebuildCart(cartS.colors, "cart");
    },
    distTo: (x, z) => hy(me.x - x, me.z - z),
    petPos: () => ({ x: pet.x, z: pet.z }),
    npcPos: (id) => (npc[id] ? { x: npc[id].x, z: npc[id].z } : null),
    openDoor() {}, closeDoors() {},
    enter(id) {
      const I = OSW.INT.get(id); cancelAuto(); curInt = I; mode = "in"; me.x = I.spawn.x; me.z = I.spawn.z; me.vx = me.vz = 0; me.ry = PI; cam.tx = me.x; cam.tz = me.z; cam.ty = 1.2; cam.yaw = 0; cam.pitch = I.camPitch; cam.dist = I.camDist; cam.follow = true; cam.anim = null; me.follow = false;
      I.labels.forEach((d) => mkLabel(Object.assign({ dynamic: "int" }, d)));
      inNpcs.length = 0; I.npcs.forEach((n) => { const def = OSW.NPC_BY[n.ref]; const o = { id: n.id, def, x: n.x, z: n.z, ry: n.face || 0, ch: OSW.makeChar(lookKey(def.look)), act: n.act }; inNpcs.push(o); mkLabel({ id: "in_" + n.id, text: def.name, cls: "tag np", max: 34, scope: "in", dynamic: "int", x: 0, y: 0, z: 0, follow: () => [o.x, 2.7, o.z] }); });
      document.documentElement.classList.add("inside"); if (id === "home") { applyFurn(); refreshKidLabels(); }
    },
    leave() {
      for (let i = labs.length - 1; i >= 0; i--) if (labs[i].dynamic === "int") { labs[i].el.remove(); labs.splice(i, 1); }
      const out = OSW.INT.outAt[curInt.id]; mode = "out"; inNpcs.length = 0; document.documentElement.classList.remove("inside"); curInt = null; floorHandler = null;
      me.x = out.x; me.z = out.z; me.vx = me.vz = 0; cam.tx = me.x; cam.tz = me.z; cam.yaw = 0; cam.pitch = 0.55; cam.dist = 17; cam.follow = true; cam.anim = null;
    },
    setFurniture(list) { furn.list = list || []; if (mode === "in" && curInt.id === "home") applyFurn(); },
    selectFurn(id) { selFurn = id; if (mode === "in" && curInt.id === "home") applyFurn(); },
    setFloorHandler(f) { floorHandler = f; },
    sleepTo(h) { const d = new Date(), real = d.getHours() + d.getMinutes() / 60; st.timeOffset = (((h - real) % 24) + 24) % 24; sessionStorage.setItem("osw_toff", String(st.timeOffset)); return updateSky(); },
    resetTime() { st.timeOffset = 0; sessionStorage.removeItem("osw_toff"); return updateSky(); },
    setPartnerSpace(sp) { pa.space = sp || null; },
    addNpc(def) { if (!npc[def.id]) { OSW.NPCS.push(def); OSW.NPC_BY[def.id] = def; createNpc(def); } return npc[def.id]; },
    setKidsIn(list) { const sig = (list || []).map((k) => k.id + k.stage + (k.sleeping ? "s" : "i")).join(","), ch = sig !== kidsInSig; kidsInSig = sig; kidsIn = list || []; if (ch && mode === "in" && curInt && curInt.id === "home") refreshKidLabels(); },
    setKids(list) {
      const want = {}; list.forEach((k) => (want[k.id] = k));
      Object.keys(kidState).forEach((id) => { const k = want[id], c = kidState[id]; if (!k || c.at !== k.at || c.stage !== k.stage || c.name !== k.name || c.g !== k.g) { W.removeNpc("kid_" + id); delete kidState[id]; } });
      const cols = ["#ff7aa8", "#4dabf7", "#7ac74f", "#ffb347", "#b565b0", "#e5484d"], hairs = ["#2a1d12", "#6b4423", "#1b1b1b", "#a0522d"];
      list.forEach((k) => {
        if (kidState[k.id]) return;
        let h = 0; for (const ch of String(k.id)) h += ch.charCodeAt(0);
        const girl = k.g === "girl", baby = k.stage === "baby", teen = k.stage === "teen", sch = k.at === "school", roam = k.roam || (sch ? [0, 1216, 6.5] : [6, -4.5, baby ? 1.6 : 3.8]);
        const look = { gender: k.g, color: cols[h % cols.length], hair: hairs[h % hairs.length], hairStyle: girl ? "ponytail" : "short", scale: baby ? 0.42 : teen ? 0.86 : 0.66 };
        if (!girl) look.pants = "#2f6fb5"; if (sch && !baby) look.outfit = "school";
        W.addNpc({ id: "kid_" + k.id, name: (baby ? "👶 " : sch ? "🎒 " : "") + k.name, emoji: "🧒", look, pos: [roam[0] + (h % 5) * 0.4, roam[1]], face: 0, roam, speed: baby ? 1.0 : 1.7, act: "family", lines: ["🎈"], roamKid: 1 });
        kidState[k.id] = { at: k.at, stage: k.stage, name: k.name, g: k.g };
      });
    },
    removeNpc(id) { const i = OSW.NPCS.findIndex((n) => n.id === id); if (i > -1) OSW.NPCS.splice(i, 1); delete npc[id]; for (let k = labs.length - 1; k >= 0; k--) if (labs[k].dynamic === id || labs[k].dynamic === "m" + id) { labs[k].el.remove(); labs.splice(k, 1); } },
    npcGoto(id, x, z, cb) { const o = npc[id]; if (!o) return false; o.tx = null; o.route = []; o.over = { x, z, cb, t0: performance.now() }; return true; },
    npcProps(id, props) { const o = npc[id]; if (o) Object.assign(o, props); },
    npcSetPos(id, x, z, ry) { const o = npc[id]; if (o) { o.x = x; o.z = z; if (ry != null) o.ry = ry; } },
    setCrowd(x, z) { crowd = x == null ? null : { x, z }; },
    setWedding(on) { S.rebuildWedding(!!on); },
    focusFor() { return []; },
  });
  Object.defineProperties(W, { inputOn: { get: () => st.input }, paused: { get: () => st.paused }, storm: { get: () => !!st.storm }, wxType: { get: () => fx.type }, night: { get: () => st.night }, season: { get: () => st.season }, weather: { get: () => st.wmode }, holding: { get: () => holding }, mode: { get: () => mode }, interior: { get: () => (curInt ? curInt.id : null) }, timeOffset: { get: () => st.timeOffset } });
  OSW.POI = S.poi;
})();
