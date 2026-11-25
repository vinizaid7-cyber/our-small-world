/* ============================================================
   التوصيل — العالم المرئي: شاحنة مسطّحة بعجلات تدور، مقود، رامبات، سيارة/جرار محمّل،
   سائق وعمال بيفكوا الأربطة وبينزلوا الحمولة، علامات وأقماع. كلها مبنية من حالة الشحنة الحقيقية.
   ============================================================ */
(function () {
  const OSW = window.OSW, D = OSW.deliv; if (!D) return;
  const PI = Math.PI, hy = Math.hypot, sin = Math.sin, cos = Math.cos, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const Builder = OSW.Builder, M = OSW.M, R = OSW.R;
  const G = () => OSW.game, V = () => OSW.veh;
  const cache = {}, m1 = new Float32Array(16), m2 = new Float32Array(16), m3 = new Float32Array(16);
  const mk = (fn) => { const b = new Builder(); fn(b); return b.build(R.gl); };
  const memo = (k, fn) => cache[k] || (cache[k] = mk(fn));

  /* ---------- المجسّمات ---------- */
  const truckMesh = (col, brake) => memo("truck:" + col + ":" + (brake ? 1 : 0), (b) => {
    b.box(0, 0.55, 0, 2.3, 0.4, 9.2, "#3a3d45");                                    // الشاسيه
    b.box(0, 1.0, -1.55, 2.5, 0.25, 6.3, "#7a5a3a"); for (let z = -4.4; z < 1.4; z += 1.2) b.box(0, 1.25, z, 2.5, 0.03, 0.08, "#5d4429"); // سطح الشحن
    b.box(1.27, 1.0, -1.55, 0.12, 0.45, 6.3, "#9aa0aa"); b.box(-1.27, 1.0, -1.55, 0.12, 0.45, 6.3, "#9aa0aa");  // حواف
    b.box(0, 1.0, 1.7, 2.5, 1.2, 0.14, "#9aa0aa");                                  // حاجز خلف الكابينة
    b.box(0, 0.95, 3.5, 2.4, 2.2, 2.3, col); b.box(0, 3.0, 3.5, 2.2, 0.2, 2.1, col);               // الكابينة
    b.box(0, 1.85, 4.66, 2.0, 0.95, 0.05, "#bfe6ff"); b.box(1.21, 1.85, 3.5, 0.05, 0.85, 1.3, "#bfe6ff"); b.box(-1.21, 1.85, 3.5, 0.05, 0.85, 1.3, "#bfe6ff");
    b.box(0, 1.0, 4.68, 2.1, 0.6, 0.05, "#20242c"); b.box(0, 0.62, 4.72, 2.4, 0.22, 0.25, "#cfd3da");  // شبك + مصد
    b.box(-0.8, 1.2, 4.7, 0.42, 0.26, 0.06, "#fff7c2", 1); b.box(0.8, 1.2, 4.7, 0.42, 0.26, 0.06, "#fff7c2", 1); // الأضواء الأمامية
    b.box(-0.9, 0.9, -4.64, 0.34, 0.2, 0.06, brake ? "#ff2a2a" : "#7a1010", brake ? 1 : 0); b.box(0.9, 0.9, -4.64, 0.34, 0.2, 0.06, brake ? "#ff2a2a" : "#7a1010", brake ? 1 : 0); // أضواء الفرامل
    b.box(1.24, 1.3, 3.5, 0.03, 0.5, 1.7, "#ffffff"); b.box(-1.24, 1.3, 3.5, 0.03, 0.5, 1.7, "#ffffff");  // شريط الشركة
    b.box(1.44, 1.35, 4.4, 0.18, 0.5, 0.1, "#20242c"); b.box(-1.44, 1.35, 4.4, 0.18, 0.5, 0.1, "#20242c"); // مرايا
    b.cyl(1.0, 1.0, 2.0, 0.09, 0.09, 2.3, "#8a8f98", 6);                          // عادم
    [[1.0, 3.2], [-1.0, 3.2], [1.0, -1.4], [-1.0, -1.4], [1.0, -3.1], [-1.0, -3.1]].forEach(([x, z]) => b.box(x * 1.0, 0.95, z, 0.9, 0.08, 1.5, "#2c2f36")); // رفارف
  });
  const wheelMesh = () => memo("wheel", (b) => {
    b.push(0, 0, 0, 0, 0, PI / 2); b.cyl(0, -0.2, 0, 0.55, 0.55, 0.4, "#202226", 12, 0, true); b.cyl(0, -0.22, 0, 0.32, 0.32, 0.44, "#cfd3da", 10, 0, true);
    b.box(0, -0.23, 0, 0.5, 0.46, 0.09, "#6b7280"); b.box(0, -0.23, 0, 0.09, 0.46, 0.5, "#6b7280"); b.pop();
  });
  const rampMesh = () => memo("ramp", (b) => { b.box(0, -0.05, -1.6, 2.1, 0.1, 3.2, "#8d949e"); b.box(1.0, 0, -1.6, 0.08, 0.14, 3.2, "#6b7280"); b.box(-1.0, 0, -1.6, 0.08, 0.14, 3.2, "#6b7280"); for (let z = -0.3; z > -3.1; z -= 0.45) b.box(0, 0, z, 2.0, 0.02, 0.06, "#555b66"); });
  const beaconMesh = () => memo("beacon", (b) => { b.box(0, 3.2, 3.5, 0.34, 0.2, 0.34, "#ffb703", 1); });
  const coneMesh = () => memo("cone", (b) => { b.box(0, 0, 0, 0.6, 0.06, 0.6, "#2b2d38"); b.cyl(0, 0.06, 0, 0.24, 0.05, 0.72, "#ff7a1a", 8); b.cyl(0, 0.38, 0, 0.17, 0.14, 0.1, "#ffffff", 8); });
  const padMesh = () => memo("pad", (b) => {
    b.box(0, 0.045, 0, 5.4, 0.03, 12.5, "#3a3d45"); for (let z = -5.6; z < 5.7; z += 1.6) { b.box(-2.55, 0.07, z, 0.3, 0.02, 0.8, "#ffd23f"); b.box(2.55, 0.07, z, 0.3, 0.02, 0.8, "#ffd23f"); }
  });
  const crateMesh = () => memo("crates", (b) => { for (let i = 0; i < 6; i++) { const x = (i % 3 - 1) * 0.85, z = Math.floor(i / 3) * 0.9 - 0.4; b.box(x, 0, z, 0.78, 0.7, 0.78, "#c9a06a"); b.box(x, 0.7, z, 0.82, 0.06, 0.82, "#a97c50"); } });
  const strapMesh = (w, h) => memo("strap:" + w + ":" + h, (b) => { b.box(0, h, 0, w + 0.16, 0.07, 0.14, "#ffb703"); b.box(w / 2 + 0.07, 0, 0, 0.05, h + 0.05, 0.14, "#ffb703"); b.box(-w / 2 - 0.07, 0, 0, 0.05, h + 0.05, 0.14, "#ffb703"); });

  /* ---------- العمال ---------- */
  let wk = null;
  const workers = () => {
    if (wk) return wk;
    try {
      const looks = [{ gender: "boy", color: "#ffb703", hair: "#2a1d12", hairStyle: "short", skin: "#c68642", cap: "#ffb703" }, { gender: "boy", color: "#ff7a1a", hair: "#4a3322", hairStyle: "short", skin: "#e0ac84", cap: "#ff7a1a" }, { gender: "boy", color: "#ffd23f", hair: "#111111", hairStyle: "short", skin: "#a86b3c", cap: "#ffd23f" }];
      wk = looks.map((l) => OSW.makeChar(l));
    } catch (e) { wk = []; console.warn("[deliv] workers", e); }
    return wk;
  };
  const lerp = (a, b, f) => a + (b - a) * f, ease = (f) => f * f * (3 - 2 * f), angDiff = (a, b) => { let d = (b - a) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; };
  const ck = (u, a, b) => clamp((u - a) / (b - a), 0, 1);

  /* ---------- مكان الركنة لحمولة بموقف ---------- */
  const slotFor = (o) => {
    try {
      const Vv = V(), at = o.dest, base = Vv.owned().filter((c) => c.deliv !== o.id), virt = { id: o.id, car: o.item.car, color: o.item.color, at, cargo: [], deliv: o.id };
      if (o.done) { const real = Vv.owned().find((c) => c.id === o.id); if (real) return Vv.slot(real); }
      const orig = Vv.owned; Vv.owned = () => base.concat([virt]); let s; try { s = Vv.slot(virt); } finally { Vv.owned = orig; } return s;
    } catch (e) { const L = V().LOTS[o.dest] || V().LOTS.H; return { x: L.x, z: L.z, h: L.h }; }
  };

  /* ---------- رسم شحنة ---------- */
  const toW = (px, pz, h, lx, lz) => [px + lx * cos(h) + lz * sin(h), pz - lx * sin(h) + lz * cos(h)];
  function drawTruck(o, x, z, h, st, t, spin, brake, u) {
    const P = D.PROV[o.prov], gl = R.gl; if (!gl) return;
    M.trs(x, 0, z, h, 0, 0, 1, 1, 1, m1); R.draw(truckMesh(P.col, brake), m1);
    const wm = wheelMesh(); const steer = clamp(st.steer || 0, -0.5, 0.5);
    [[1.15, 3.2, 1], [-1.15, 3.2, 1], [1.15, -1.4, 0], [-1.15, -1.4, 0], [1.15, -3.1, 0], [-1.15, -3.1, 0]].forEach(([lx, lz, fr]) => { M.trs(lx, 0.55, lz, fr ? steer : 0, spin, 0, 1, 1, 1, m2); M.mul(m1, m2, m3); R.draw(wm, m3); });
    if (st.code === "arrived" || st.code === "unloading") { if (Math.floor(t * 3) % 2) { R.draw(beaconMesh(), m1); } }
    // رامب
    const ramp = u == null ? 0 : u < 0.1 ? 0 : u < 0.25 ? (u - 0.1) / 0.15 : u < 0.9 ? 1 : 1 - (u - 0.9) / 0.1, rampLowered = ramp;
    M.trs(0, 1.25, -4.6, 0, lerp(PI / 2, -0.4, ease(rampLowered)), 0, 1, 1, 1, m2); M.mul(m1, m2, m3); R.draw(rampMesh(), m3);
  }
  function drawCargo(o, x, z, h, st, u, S) {
    // الحمولة على الشاحنة أو أثناء التنزيل
    const kind = o.item.kind || "car", it = o.item, len = D.CARGO[kind].len(it), sc = Math.min(1, 5.6 / len);
    let mesh = null; try { mesh = kind === "car" ? V().mesh(it.car, it.color) : crateMesh(); } catch (e) { return; }
    const strapsOn = u == null || u < 0.35;
    if (u == null || u < 0.45) {
      M.trs(0, 1.27, -1.5, PI, 0, 0, sc, sc, sc, m2); M.trs(x, 0, z, h, 0, 0, 1, 1, 1, m1); M.mul(m1, m2, m3); R.draw(mesh, m3);
      if (strapsOn) { const C = (V().CARS[it.car] || {}).shape || {}, w = (C.W || 1.9) * sc, hh = ((C.roof || 1.5) + 0.05) * sc; [-1, 1].forEach((k) => { M.trs(0, 1.27, -1.5 + k * len * 0.22 * sc, 0, 0, 0, 1, 1, 1, m2); M.mul(m1, m2, m3); R.draw(strapMesh(Math.round(w * 10) / 10, Math.round(hh * 10) / 10), m3); }); }
      return;
    }
    const sl = slotFor(o), E = toW(x, z, h, 0, -10.5);
    if (u < 0.62) {
      const f = ease((u - 0.45) / 0.17), lz = lerp(-1.5, -10.5, f), y = lz > -4.6 ? 1.27 : Math.max(0, 1.27 * (1 - (-4.6 - lz) / 3.3)), p = toW(x, z, h, 0, lz);
      M.trs(p[0], y, p[1], h + PI, 0, 0, sc, sc, sc, m2); R.draw(mesh, m2); return;
    }
    const f = ease(clamp((u - 0.62) / 0.3, 0, 1)), hh = (h + PI) + angDiff(h + PI, sl.h) * f, s2 = lerp(sc, 1, f);
    M.trs(lerp(E[0], sl.x, f), 0, lerp(E[1], sl.z, f), hh, 0, 0, s2, s2, s2, m2); R.draw(mesh, m2);
  }
  function drawWorkers(x, z, h, u, t) {
    const ws = workers(); if (!ws.length || u == null) return;
    const pts = [
      // سائق: من باب السائق للخلف ثم للحمولة
      (uu) => uu < 0.02 ? null : uu < 0.2 ? [lerp(-1.4, -2.2, ck(uu, 0.02, 0.2)), lerp(3.4, -6, ck(uu, 0.02, 0.2)), 1] : uu < 0.35 ? [-2.2, lerp(-6, -3.5, ck(uu, 0.2, 0.35)), 1] : uu < 0.62 ? [-2.0, lerp(-3.5, -6.5 - 2 * ck(uu, 0.45, 0.62), ck(uu, 0.35, 0.45)), ck(uu, 0.35, 0.45) < 1 || uu > 0.45 ? 1 : 0] : [-2.6, -9, 0],
      (uu) => uu < 0.1 ? null : uu < 0.27 ? [lerp(1.4, 2.2, ck(uu, 0.1, 0.27)), lerp(3.4, -6, ck(uu, 0.1, 0.27)), 1] : uu < 0.36 ? [2.2, lerp(-6, -3.5, ck(uu, 0.27, 0.36)), 1] : uu < 0.62 ? [2.1, lerp(-3.5, -7.5, ck(uu, 0.4, 0.62)), 1] : [2.6, -9, 0],
      (uu) => uu < 0.14 ? null : uu < 0.3 ? [lerp(1.0, 0.8, ck(uu, 0.14, 0.3)), lerp(3.4, -6.5, ck(uu, 0.14, 0.3)), 1] : uu < 0.9 ? [0.8, -6.8, 0] : [0.8, -6.8, 0],
    ];
    pts.forEach((fn, i) => {
      const r = fn(u); if (!r || !ws[i]) return; const p = toW(x, z, h, r[0], r[1]), face = r[2] ? h + (r[1] < 0 ? PI : 0) + (r[0] > 0 ? 0.4 : -0.4) : h + PI;
      try { OSW.drawChar(ws[i], p[0], p[1], face, t * 6 + i, r[2], t, 1, null, 0.9, 0, null); OSW.drawShadow && OSW.drawShadow(p[0], p[1], 0.5); } catch (e) { /* */ }
    });
  }

  /* ---------- الحلقة الرئيسية ---------- */
  D.draw = (t) => {
    try {
      if (!R.gl) return; const S = G().state(), now = Date.now(), ex = R.eye[0], ez = R.eye[2], SS = S.ship; if (!SS) return;
      Object.values(SS.orders).forEach((o) => {
        if (o.cancelled) return; const st = D.stateAt(o, now), A = (D._anim[o.id] = D._anim[o.id] || { h: null });
        let x = st.x, z = st.z, h = st.h, vis = st.vis, spin = 0, brake = !st.moving, u = null, departing = false;
        if (o.done || now >= o.plan.T.unl1) {
          const dt = (now - o.plan.T.unl1) / 1000; if (dt >= 0 && dt < 9 && o.done) { const d = dt < 4 ? 0.6 * dt * dt : 9.6 + 7 * (dt - 4); const pk = D.park(D.route(o.sup, o.dest)); x = pk.x + sin(pk.h) * d; z = pk.z + cos(pk.h) * d; h = pk.h; vis = true; departing = true; spin = d / 0.55; brake = dt < 0.6; u = 1; } else if (o.done) return;
        }
        if (!vis || hy(x - ex, z - ez) > 330) return;
        if (st.code === "unloading" || st.code === "arrived") u = st.code === "arrived" ? 0 : st.u;
        if (!departing) spin = st.s / 0.55;
        st.steer = A.h == null ? 0 : angDiff(A.h, h) * 7; A.h = h;
        const Rr = D.route(o.sup, o.dest), near = st.s > Rr.len - 90 || u != null || departing, pk = D.park(Rr);
        if (near && (!o.done || departing)) { M.trs(pk.x, 0, pk.z, pk.h, 0, 0, 1, 1, 1, m1); R.draw(padMesh(), m1); if (u != null || departing) [[-1.9, -7], [1.9, -7], [-1.9, 7.5], [1.9, 7.5]].forEach(([lx, lz]) => { const p = toW(pk.x, pk.z, pk.h, lx, lz); M.trs(p[0], 0, p[1], 0, 0, 0, 1, 1, 1, m2); R.draw(coneMesh(), m2); }); }
        drawTruck(o, x, z, h, st, t, spin, brake, u);
        if (!o.done) drawCargo(o, x, z, h, st, u, S);
        if (!departing) drawWorkers(x, z, h, u, t);
        R.blend(true); try { const a = toW(x, z, h, 0, 2), b2 = toW(x, z, h, 0, -2); OSW.drawShadow(a[0], a[1], 2.1); OSW.drawShadow(b2[0], b2[1], 2.1); } catch (e) { /* */ } R.blend(false);
      });
    } catch (e) { if (!D._derr) { D._derr = 1; console.error("[deliv] draw", e); } }
  };
})();
