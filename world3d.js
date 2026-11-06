/* عالم ثلاثي الأبعاد: الكاميرا، الحركة، السماء، الطقس، النصوص الطافية */
(function () {
  const OSW = window.OSW, R = OSW.R, S = OSW.S, M = OSW.M, Builder = OSW.Builder;
  const { clamp, seeded } = OSW, PI = Math.PI, hy = Math.hypot;
  const W = (OSW.world = { noGL: false, onAct: null, onMove: null });
  const $ = (s) => document.querySelector(s);

  const st = { hour: 12, night: 0, season: "summer", paused: false, input: true, t: 0, last: 0, wmode: localStorage.getItem("osw_weather") || "auto", hourOverride: null };
  const me = { speedMul: 1, sprint: false, vx: 0, vz: 0, x: 0, z: 38, ry: PI, phase: 0, mv: 0, ch: null, name: "", target: null, act: null, res: null, stuck: 0, prog: 0, px: 0, pz: 0, side: 0, follow: false, lastSent: 0, sentX: 0, sentZ: 0 };
  const pa = { x: -4, z: -7, ry: 0.5, phase: 0, mv: 0, ch: null, name: "", tx: -4, tz: -7, vis: false, sleep: false, inside: null, ghost: 0 };
  const cam = { yaw: 0, pitch: 0.5, dist: 26, tx: 0, ty: 1.4, tz: 36, follow: true, anim: null, saved: null };
  const keys = { l: 0, r: 0, u: 0, d: 0, sprint: 0 }, joy = { x: 0, y: 0, on: false };
  let ctx = {}, labelsEl, tapMark = null, together = 0, holding = false;
  const meshes = {};
  const carry = { me: [], partner: [] }, bagState = { n: 0 }, cartS = { colors: [], prev: [], lastT: 0, anim: null, home: { x: -62, z: 22 } }, crateCache = {};
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
    const h = st.hourOverride != null ? st.hourOverride : q.get("hour") != null ? parseFloat(q.get("hour")) : d.getHours() + d.getMinutes() / 60;
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
    if (m === "clear") return "none"; if (m === "rain" || m === "snow") return m;
    if (st.season === "winter") return "snow"; if (st.season === "autumn") return "leaves"; if (st.season === "spring") return "petals";
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
    const N = ({ rain: 120, snow: 80, leaves: 22, petals: 26, none: 0 })[fx.type] * (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.3 : 1);
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
    meshes.link = mk((b) => b.box(0, 0, 0, 0.08, 0.08, 1, "#ff7aa8", 0.9));
    meshes.bag = mk((b) => { b.box(0, 0, 0, 0.34, 0.42, 0.18, "#f7d6ec"); b.box(0, 0.42, 0, 0.22, 0.05, 0.03, "#8e4a94"); b.box(-0.1, 0.4, 0, 0.03, 0.18, 0.03, "#8e4a94"); b.box(0.1, 0.4, 0, 0.03, 0.18, 0.03, "#8e4a94"); b.box(0, 0.12, 0.1, 0.18, 0.18, 0.02, "#ff7aa8"); });
    meshes.cat = mk((b) => { b.box(0, 0.28, 0, 0.34, 0.3, 0.7, "#e0a050"); b.sphere(0, 0.62, 0.42, 0.2, 0.19, 0.18, "#e0a050", 7); b.box(-0.12, 0.76, 0.42, 0.07, 0.14, 0.05, "#e0a050"); b.box(0.12, 0.76, 0.42, 0.07, 0.14, 0.05, "#e0a050"); b.sphere(-0.07, 0.65, 0.58, 0.03, 0.03, 0.02, "#222", 4); b.sphere(0.07, 0.65, 0.58, 0.03, 0.03, 0.02, "#222", 4); [[-0.12, 0.3], [0.12, 0.3], [-0.12, -0.3], [0.12, -0.3]].forEach(([x, z]) => b.box(x, 0, z, 0.1, 0.18, 0.1, "#c98a3d")); b.push(0, 0.4, -0.38, 0, -0.9); b.box(0, 0, 0, 0.08, 0.5, 0.08, "#e0a050"); b.pop(); });
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
  const lookKey = (l) => ({ gender: l.gender || "boy", color: l.color, hair: l.hairColor || l.hair, hairStyle: l.hairStyle, skin: l.skin });
  function setLook(who, look, name) {
    const o = who === "me" ? me : pa, c = OSW.makeChar(lookKey(look)); o.ch = c; o.name = name || o.name;
    const tag = labs.find((l) => l.dynamic === who);
    if (tag) tag.el.querySelector(".lt").textContent = o.name;
  }
  function remote(p) {
    pa.hold = !!p.h; pa.tx = p.x; pa.tz = p.z; pa.ry = p.ry != null ? p.ry : pa.ry; pa.vis = true; pa.sleep = false; pa.remoteMv = p.mv ? 1 : 0; pa.lastMsg = performance.now();
  }

  /* ---------- الحركة والتصادم ---------- */
  const B_ = S.bounds;
  function collide(o, r) {
    for (const c of S.colliders) { const dx = o.x - c.x, dz = o.z - c.z, rr = c.r + r; if (dx * dx + dz * dz < rr * rr) { const d = hy(dx, dz) || 0.001; o.x = c.x + (dx / d) * rr; o.z = c.z + (dz / d) * rr; } }
    o.x = clamp(o.x, B_.x0, B_.x1); o.z = clamp(o.z, B_.z0, B_.z1);
  }
  const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; };
  function stepMe(dt) {
    let dx = 0, dz = 0, speed = 5.4, manual = false;
    const ix = joy.x + keys.r - keys.l, iy = joy.y + keys.d - keys.u, mag = hy(ix, iy);
    if (st.input && mag > 0.14) {
      manual = true; const m = Math.min(1, mag), fx_ = -Math.sin(cam.yaw), fz_ = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
      dx = (fx_ * -iy + rx * ix) / mag; dz = (fz_ * -iy + rz * ix) / mag; speed *= m;
      if (me.target || me.follow) cancelAuto();
    } else if (me.follow && pa.vis) {
      const ox = pa.x - me.x, oz = pa.z - me.z, d = hy(ox, oz);
      if (d > 2.0) { dx = ox / d; dz = oz / d; speed = d > 6 ? 6.4 : 4.6; }
    } else if (me.target) {
      const ox = me.target.x - me.x, oz = me.target.z - me.z, d = hy(ox, oz);
      if (d < 0.55) arrive();
      else {
        dx = ox / d; dz = oz / d;
        if (me.side) { const sx = -dz, sz = dx; dx = dx * 0.35 + sx * me.side * 0.9; dz = dz * 0.35 + sz * me.side * 0.9; const l = hy(dx, dz); dx /= l; dz /= l; me.side *= 0.995; }
        me.prog += dt; me.stuck += dt;
        if (hy(me.x - me.px, me.z - me.pz) > 0.35) { me.px = me.x; me.pz = me.z; me.stuck = 0; me.side = 0; }
        else if (me.stuck > 0.9 && !me.side) me.side = Math.random() < 0.5 ? 1 : -1;
        if (me.prog > 14 || me.stuck > 3.5) { me.x = me.target.x; me.z = me.target.z; arrive(); }
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
    holding = !!(me.follow && pa.vis && !pa.inside && !pa.sleep && hy(me.x - pa.x, me.z - pa.z) < 3.2);
    // إرسال الموقع للشريك (6 مرات بالثانية)
    const now = performance.now();
    if (W.onMove && now - me.lastSent > 160 && (moving || hy(me.x - me.sentX, me.z - me.sentZ) > 0.01 || now - me.lastSent > 2500)) {
      me.lastSent = now; me.sentX = me.x; me.sentZ = me.z; W.onMove({ x: +me.x.toFixed(2), z: +me.z.toFixed(2), ry: +me.ry.toFixed(2), mv: moving || sp > 0.3 ? 1 : 0, h: holding ? 1 : 0 });
    }
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
  function initNpcs() {
    OSW.NPCS.forEach((n) => {
      const homeP = n.home ? S.poi[n.home] : null, pos = n.pos || [homeP.x, homeP.z];
      const o = (npc[n.id] = { def: n, x: pos[0], z: pos[1], ry: n.face || 0, phase: Math.random() * 6, mv: 0, ch: OSW.makeChar(lookKey(n.look)), wait: 1 + Math.random() * 4, tx: null, tz: null, route: [], stuck: 0, mood: "", mark: "", sc: n.look.scale || n.scale || 1 });
      const nm = mkLabel({ id: "npc_" + n.id, text: n.name, x: 0, y: 0, z: 0, cls: "tag np", max: 34, dynamic: n.id, follow: () => [o.x, 2.7 * o.sc, o.z] });
      const em = mkLabel({ id: "npcm_" + n.id, text: "", x: 0, y: 0, z: 0, cls: "mood", max: 28, dynamic: "m" + n.id, follow: () => (o.mood || o.mark ? [o.x, 3.35 * o.sc, o.z] : null) });
      o.moodEl = em; o.nameEl = nm;
    });
  }
  const SPOTS = () => [[0, 7.5], [6, 6], [-6, 6.5], [8, -3], [-8, -4], [0, -6], [-24, 15.8], [24, 15.8], [15, 3.4], [-15, 5.2], [0, 22], [-28, 8], [28, 8]];
  function pickDest(o) {
    const home = S.poi[o.def.home], r = Math.random();
    if (r < 0.28) return [home.x, home.z]; const s = SPOTS(); const p = s[(Math.random() * s.length) | 0]; return [p[0] + (Math.random() - 0.5) * 2, p[1] + (Math.random() - 0.5) * 2];
  }
  function stepNpc(o, dt) {
    const d = o.def;
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
  const CART_PATH = [[-62, 22], [-48, 20.5], [-34, 18.5], [-26, 17.4]];
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
  function drawScene() {
    const cp = Math.cos(cam.pitch), eye = [cam.tx + Math.sin(cam.yaw) * cp * cam.dist, cam.ty + Math.sin(cam.pitch) * cam.dist, cam.tz + Math.cos(cam.yaw) * cp * cam.dist];
    if (eye[1] < 2.2) eye[1] = 2.2;
    const env = envNow(); R.begin(eye, [cam.tx, cam.ty, cam.tz], R.aspect < 1 ? 1.08 : 0.92, env);
    const t = st.t, D = S.dyn;
    R.draw(D.main); R.draw(D.foliage, null, null, 1, 1.6);
    ["tree", "board", "home", "farm", "flowers"].forEach((k) => D[k] && R.draw(D[k], null, null, 1, k === "flowers" ? 1.2 : 0));
    // نافورة: قطرات
    for (let i = 0; i < 14; i++) { const ph = (t * 0.8 + i / 14) % 1, a = i * 2.4, rr = ph * 2.6, y = 4.0 + Math.sin(ph * PI) * 1.7 - ph * 2.6; M.trs(Math.cos(a) * rr, y, Math.sin(a) * rr, 0, 0, 0, 1, 1, 1, m1); R.draw(meshes.drop, m1); }
    // دخان المداخن
    [[2.4, 8.2, -15.2], [-21.9, 0, 0]].slice(0, 1).concat([[S.pos.memories.x + 2.1, 8.6, S.pos.memories.z - 1.2], [S.pos.hajji.x - 2.4, 6, S.pos.hajji.z - 1.2]]).forEach((c, k) => { for (let i = 0; i < 3; i++) { const ph = (t * 0.25 + i / 3 + k * 0.3) % 1; M.trs(c[0] + ph * 1.4, c[1] + ph * 3, c[2], 0, 0, 0, 0.3 + ph * 0.7, 0.3 + ph * 0.7, 0.3 + ph * 0.7, m1); R.draw(meshes.puff, m1, [1, 1, 1], (1 - ph) * 0.45); } });
    // طاحونة وقطار وغيوم وطيور
    M.trs(-56, 8.4, 49.2, 0, 0, t * 0.7, 1, 1, 1, m1); R.draw(meshes.blades, m1);
    const ph = (Math.sin(t * 0.12) + 1) / 2; M.trs(36 + ph * 22, 0.2, 7.9, 0, 0, 0, 1, 1, 1, m1); R.draw(meshes.train, m1);
    for (let i = 0; i < 6; i++) { const x = ((t * (1.2 + i * 0.25) + i * 52) % 280) - 120; M.trs(x, 38 + (i % 3) * 5, -50 + i * 18, 0, 0, 0, 1.4 + (i % 2) * 0.5, 1, 1.4, m1); R.draw(meshes.cloud, m1, [1, 1, 1], 0.92 - st.night * 0.55); }
    if (st.night < 0.6) for (let i = 0; i < 4; i++) { const a = t * 0.18 + i * 1.6, rr = 34 + i * 7; M.trs(Math.cos(a) * rr, 22 + i * 2, Math.sin(a) * rr * 0.7 + 8, -a, 0, Math.sin(t * 6 + i) * 0.35, 1, 1, 1, m1); R.draw(meshes.bird, m1); }
    for (let i = 0; i < 6; i++) { const cx = i < 3 ? S.pos.flowers.x : S.pos.farm.x, cz = i < 3 ? S.pos.flowers.z : S.pos.farm.z, a = t * (0.6 + i * 0.1) + i * 2; M.trs(cx + Math.cos(a) * (3 + i % 3), 1.2 + Math.sin(a * 2) * 0.4, cz + Math.sin(a * 1.3) * 4, a, 0, Math.sin(t * 14 + i) * 0.6, 1, 1, 1, m1); R.draw(meshes.bf, m1); }
    if (st.night > 0.5) for (let i = 0; i < 22; i++) { const a = t * 0.3 + i * 1.7; M.trs(-40 + ((i * 37) % 80) + Math.cos(a) * 2, 0.9 + Math.sin(a * 1.4) * 0.5, -20 + ((i * 53) % 70) + Math.sin(a) * 2, 0, 0, 0, 1, 1, 1, m1); R.draw(meshes.fly, m1); }
    // عربة المزرعة (وبتتحرك لما الاثنين يسحبوها)
    drawCart(t);
    // شخصيات
    OSW.NPCS.forEach((d) => { const o = npc[d.id]; if (o) OSW.drawChar(o.ch, o.x, o.z, o.ry, o.phase, o.mv, t, 1, null, o.sc); });
    M.trs(pet.x, Math.abs(Math.sin(pet.phase)) * 0.08 * pet.mv, pet.z, pet.ry, 0, 0, 1.3, 1.3, 1.3, m1); R.draw(meshes.cat, m1);
    const dxp = pa.x - me.x, dzp = pa.z - me.z, sideMe = Math.cos(me.ry) * dxp - Math.sin(me.ry) * dzp, sideP = Math.cos(pa.ry) * -dxp - Math.sin(pa.ry) * -dzp;
    const showLink = pa.vis && !pa.inside && !pa.sleep && (holding || (pa.hold && hy(dxp, dzp) < 4));
    if (pa.ch && pa.vis && !pa.inside) { OSW.drawChar(pa.ch, pa.x, pa.z, pa.ry, pa.phase, pa.mv, t, pa.sleep ? 0.55 : 1, null, 1, 0, carry.partner.length ? { carry: true } : showLink ? { hold: sideP >= 0 ? 1 : -1 } : null); drawCarried(pa, carry.partner, null); }
    if (me.ch) { OSW.drawChar(me.ch, me.x, me.z, me.ry, me.phase, me.mv, t, 1, null, 1, 0, carry.me.length ? { carry: true } : showLink ? { hold: sideMe >= 0 ? 1 : -1 } : null); drawCarried(me, carry.me, bagState.n); }
    if (showLink) { const mx = (me.x + pa.x) / 2, mz = (me.z + pa.z) / 2, len = Math.max(0.4, hy(dxp, dzp) - 0.9); M.trs(mx, 1.0, mz, Math.atan2(dxp, dzp), 0, 0, 1, 1, len, m1); R.draw(meshes.link, m1); }
    // شفّاف: ظلال + شعاع المنارة + علامة اللمس
    R.blend(true);
    R.draw(D.shadow, null, [0, 0, 0], 0.26);
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
    stepMe(dt); stepPet(dt); OSW.NPCS.forEach((d) => npc[d.id] && stepNpc(npc[d.id], dt));
    // الشريك: تنعيم الحركة
    if (pa.vis) { const k = 1 - Math.exp(-dt * 9), ox = pa.x, oz = pa.z; pa.x += (pa.tx - pa.x) * k; pa.z += (pa.tz - pa.z) * k; const sp = hy(pa.x - ox, pa.z - oz) / Math.max(dt, 0.001); pa.mv += ((sp > 0.6 ? 1 : 0) - pa.mv) * Math.min(1, dt * 8); if (sp > 0.6) { pa.ry += angDiff(pa.ry, Math.atan2(pa.tx - pa.x, pa.tz - pa.z)) * Math.min(1, dt * 10); pa.phase += sp * dt * 2.1; } }
    // مشي سوا: وقت قريب من بعض
    if (pa.vis && !pa.sleep && !pa.inside && hy(me.x - pa.x, me.z - pa.z) < 4.2) { together += dt; if (together > 45 && W.onTogether) { together = 0; W.onTogether(); } } else together = Math.max(0, together - dt * 0.5);
    if (tapMark && tapMark.life > 0) tapMark.life -= dt;
    camStep(dt); drawScene(); updateLabels(); fxFrame();
  }

  /* ---------- مدخلات اللمس والماوس ---------- */
  function pick(px, py) {
    const ray = R.ray(px, py); let best = null, bt = 1e9;
    S.acts.forEach((a) => { const t = R.hitSphere(ray, a.x, a.y, a.z, a.r); if (t > 0 && t < bt) { bt = t; best = a.act; } });
    OSW.NPCS.forEach((d) => { const o = npc[d.id]; const t = o && R.hitSphere(ray, o.x, 1.0 * o.sc, o.z, 1.35 * o.sc); if (t > 0 && t < bt) { bt = t; best = d.act || "npc:" + d.id; } });
    { const t = R.hitSphere(ray, pet.x, 0.5, pet.z, 1.0); if (t > 0 && t < bt) { bt = t; best = "pet"; } }
    if (pa.vis && !pa.inside) { const t = R.hitSphere(ray, pa.x, 1.0, pa.z, 1.4); if (t > 0 && t < bt) { bt = t; best = "partner"; } }
    if (best) return { act: best };
    const g = R.hitGround(ray); return g ? { ground: g } : null;
  }
  function tapAct(act) {
    if (!st.input || !W.onAct) return;
    if (act === "partner") { W.onAct("partner"); return; }
    if (act === "pet") { W.onAct("pet"); return; }
    let poi = S.poi[act];
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
      if (ptr.size === 1) { moved += Math.abs(dx) + Math.abs(dy); if (moved > 9 && st.input && !cam.anim) { cam.yaw -= dx * 0.0062; cam.pitch = clamp(cam.pitch + dy * 0.004, 0.3, 1.2); el.classList.add("dragging"); } p.x = e.clientX; p.y = e.clientY; }
      else if (ptr.size === 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...ptr.values()], d = hy(a.x - b.x, a.y - b.y); if (last && st.input) cam.dist = clamp(cam.dist * (last / d), 7, 36); last = d; }
    });
    const up = (e) => {
      if (!ptr.has(e.pointerId)) return; const was = ptr.size; ptr.delete(e.pointerId); el.classList.remove("dragging"); last = 0;
      if (was === 1 && moved <= 9 && performance.now() - t0 < 600 && st.input) {
        const r = pick(e.clientX, e.clientY); if (!r) return;
        if (r.act) tapAct(r.act);
        else { const g = r.ground; goTo(clamp(g[0], B_.x0, B_.x1), clamp(g[1], B_.z0, B_.z1)); }
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
      ["me", "partner"].forEach((w) => mkLabel({ id: "tag_" + w, text: "", x: 0, y: 0, z: 0, cls: "tag " + w, max: 70, dynamic: w, follow: () => { const o = w === "me" ? me : pa; if (!o.ch || (w === "partner" && (!pa.vis || pa.inside))) return null; return [o.x, 2.55, o.z]; } }));
      mkLabel({ id: "holdh", text: "💞", x: 0, y: 0, z: 0, cls: "mood", max: 60, dynamic: "holdh", follow: () => (holding && pa.vis ? [(me.x + pa.x) / 2, 2.9, (me.z + pa.z) / 2] : null) });
      mkLabel({ id: "zz", text: "💤", x: 0, y: 0, z: 0, cls: "mood", max: 40, dynamic: "zz", follow: () => (pa.vis && pa.sleep && !pa.inside ? [pa.x, 3.0, pa.z] : null) });
      mkLabel({ id: "inside", text: "", x: 0, y: 0, z: 0, cls: "inside", max: 70, dynamic: "inside", follow: () => { if (!pa.inside || !S.pos[pa.inside.replace("house:", "")]) return null; const p = S.pos[pa.inside.replace("house:", "")]; return [p.x, 6.4, p.z + 3]; } });
      requestAnimationFrame(frame); return true;
    },
    onReady(f) { (W._after = W._after || []).push(f); },
    resize() { R.resize(); },
    pause(v) { st.paused = !!v; },
    setInputEnabled(v) { st.input = v; if (!v) { joy.x = joy.y = 0; keys.l = keys.r = keys.u = keys.d = 0; } },
    updateSky, period,
    setHour(h) { st.hourOverride = h; return updateSky(); },
    setWeather(m) { st.wmode = m; localStorage.setItem("osw_weather", m); }, 
    poi: (a) => S.poi[/^[a-z]+:/.test(a) || S.poi[a] ? a : "house:" + a],
    setLook, remote,
    spawnMe(x, z) { me.x = x; me.z = z; cam.tx = x; cam.tz = z; },
    placeMe(x, z) { me.x = x; me.z = z; },
    goTo, tapAct, cancelAuto,
    walkToPOI(a) { return new Promise((res) => { const p = S.poi[/^[a-z0-9]+$/.test(a) && !S.poi[a] ? "house:" + a : a]; if (!p) return res(); if (hy(me.x - p.x, me.z - p.z) < 1.2) return res(); goTo(p.x, p.z, null, res); }); },
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
      const o = id === "me" ? me : id === "partner" ? pa : id === "pet" ? pet : npc[id]; if (!o) return;
      const old = labs.findIndex((l) => l.dynamic === "say_" + id); if (old > -1) { labs[old].el.remove(); labs.splice(old, 1); }
      const sc = (o.sc || 1), l = mkLabel({ id: "say_" + id, text, x: 0, y: 0, z: 0, cls: "say", max: 60, dynamic: "say_" + id, follow: () => [o.x, 3.6 * sc + 0.4, o.z] });
      setTimeout(() => { const i = labs.indexOf(l); if (i > -1) { l.el.remove(); labs.splice(i, 1); } }, ms);
    },
    setPartnerState(s) { // {inside:'house:..'|null, sleeping:bool, visible:bool}
      if ("inside" in s) { pa.inside = s.inside; const l = labs.find((x) => x.dynamic === "inside"); if (l) l.el.querySelector(".lt").textContent = s.inside ? `💕 ${pa.name} جوّا` : ""; }
      if ("sleeping" in s) { pa.sleep = s.sleeping; if (s.sleeping) { pa.x = pa.tx = 3.6; pa.z = pa.tz = -8.4; pa.ry = -0.6; pa.vis = true; pa.mv = 0; } }
      if ("visible" in s) pa.vis = s.visible;
    },
    partnerDist() { return pa.vis ? hy(me.x - pa.x, me.z - pa.z) : 1e9; },
    getMe: () => ({ x: me.x, z: me.z }),
    setPlayerLabelsHidden(v) { labs.forEach((l) => { if (l.dynamic === "me" || l.dynamic === "partner") l.hidden = v; }); },
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
    focusFor() { return []; },
  });
  Object.defineProperties(W, { night: { get: () => st.night }, season: { get: () => st.season }, weather: { get: () => st.wmode }, holding: { get: () => holding } });
  OSW.POI = S.poi;
})();
