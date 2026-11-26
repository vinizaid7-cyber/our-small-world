/* مولّد الجزر — الجزء 2: مركبات وسفن ومناطق مشتركة + جزيرتا الأعمال والميناء */
(function () {
  const OSW = window.OSW, D = window.OSW_ISL, C = OSW.city, R = OSW.R, Builder = OSW.Builder, M = OSW.M, PI = Math.PI, hy = Math.hypot, sin = Math.sin, cos = Math.cos;
  const dk = OSW.col.dk, lt = OSW.col.lt, GEN = OSW.islandsGen, H = GEN.helpers;
  const CCOL = ["#c0392b", "#2a6fb5", "#e6b422", "#2a9d8f", "#e07a3a", "#7b4fa3", "#d9d9d4", "#3c8d5a"];

  /* ---------- مجسّمات مركبات وشحن ---------- */
  GEN.truck = (B, o) => { // اتجاه الأمام +z، الطول ~11
    o = o || {}; const cab = o.cab || "#2a6fb5", tr = o.trailer || "#d9d9d4";
    B.box(0, 0.5, 4.3, 2.3, 1.1, 2.2, cab); B.box(0, 1.5, 4.5, 2.2, 1.5, 1.7, cab); B.box(0, 1.75, 5.3, 2.0, 0.9, 0.08, "#27384a"); B.box(0, 0.45, 5.45, 2.3, 0.3, 0.15, "#2b2b30"); [-1, 1].forEach((sd) => B.sphere(sd * 0.85, 0.7, 5.45, 0.18, 0.12, 0.08, "#fff3c0", 5, 0.8));
    B.box(0, 0.7, -0.5, 2.5, 0.3, 8.6, "#3b3f47"); if (o.flat) { B.box(0, 1.0, -0.5, 2.5, 0.2, 8.4, "#6b4a3a"); } else B.box(0, 1.0, -0.6, 2.5, 3.0, 8.2, tr), B.box(0, 3.95, -0.6, 2.6, 0.12, 8.3, dk(tr, 0.15));
    if (o.container) { B.box(0, 1.0, -0.6, 2.5, 2.6, 8.2, o.container); for (let z = -4.2; z < 3.2; z += 0.9) B.box(0, 1.0, z, 2.56, 2.6, 0.08, dk(o.container, 0.18)); }
    [[-1, 4.1], [1, 4.1], [-1, -2.2], [1, -2.2], [-1, -3.5], [1, -3.5]].forEach(([sx, z]) => { B.push(sx * 1.2, 0.5, z, 0, 0, PI / 2); B.cyl(0, -0.15, 0, 0.5, 0.5, 0.35, "#1b1b1f", 8); B.cyl(0, -0.16, 0, 0.25, 0.25, 0.37, "#9aa0a8", 6); B.pop(); });
  };
  GEN.tractor = (B, o) => { o = o || {}; const col = o.col || "#2a9d8f"; B.box(0, 0.7, 0, 1.8, 0.9, 3.0, col); B.box(0, 1.6, -0.5, 1.6, 1.3, 1.5, "#27384a"); B.box(0, 2.9, -0.5, 1.8, 0.14, 1.7, dk(col, 0.1)); [[-0.8, 0.8], [0.8, 0.8], [-0.8, -1.2], [0.8, -1.2]].forEach(([x, z]) => { B.box(x, 2.0, z, 0.1, 0.9, 0.1, "#27384a"); });
    [[-1, -1.0, 0.95], [1, -1.0, 0.95]].forEach(([sx, z, r]) => { B.push(sx * 1.0, r, z, 0, 0, PI / 2); B.cyl(0, -0.2, 0, r, r, 0.5, "#1b1b1f", 10); B.cyl(0, -0.22, 0, r * 0.5, r * 0.5, 0.55, col, 8); B.pop(); }); [-1, 1].forEach((sx) => { B.push(sx * 0.9, 0.55, 1.2, 0, 0, PI / 2); B.cyl(0, -0.15, 0, 0.55, 0.55, 0.35, "#1b1b1f", 8); B.cyl(0, -0.16, 0, 0.26, 0.26, 0.37, col, 6); B.pop(); }); B.cyl(0.5, 1.1, 1.3, 0.1, 0.1, 1.0, "#555", 4); B.box(0, 0.5, 1.7, 1.4, 0.4, 0.3, "#2b2b30"); if (o.plow) B.box(0, 0.3, 2.3, 2.4, 0.5, 0.2, "#c9c4b0"); };
  GEN.forklift = (B) => { B.box(0, 0.45, 0, 1.2, 0.7, 2.0, "#e6b422"); B.box(0, 1.15, -0.3, 1.1, 1.2, 1.1, "#27384a"); B.box(0, 1.2, 1.15, 0.7, 2.2, 0.15, "#555"); B.box(0, 0.15, 1.5, 0.9, 0.12, 0.9, "#555"); [[-0.55, -0.6], [0.55, -0.6], [-0.55, 0.7], [0.55, 0.7]].forEach(([x, z]) => B.cyl(x, 0.3, z, 0.3, 0.3, 0.25, "#1b1b1f", 6)); };
  GEN.container = (B, x, y, z, col, len) => { len = len || 6; B.box(x, y, z, 2.4, 2.5, len, col); B.box(x, y + 2.5, z, 2.5, 0.1, len + 0.05, dk(col, 0.25)); for (let k = -len / 2 + 0.5; k < len / 2; k += 0.6) B.box(x, y + 0.1, z + k, 2.46, 2.3, 0.07, dk(col, 0.14)); B.box(x, y + 1.2, z + len / 2 + 0.03, 2.2, 2.2, 0.06, dk(col, 0.35)); };
  GEN.ship = (B, kind) => { // طول 84 على محور x (المقدمة -x نحو البحر)، عرض 16
    const hull = kind === "tanker" ? "#3a3f4a" : "#2b3a55", deck = "#b5472f";
    B.box(0, -2.2, 0, 70, 3.6, 15, hull); B.box(0, -2.2, 0, 70, 0.6, 15.6, "#c0392b"); B.box(-38, -1.2, 0, 8, 2.6, 11, hull); B.prism(-41, -2.2, 0, 4, 3.4, 11.4, hull); B.box(36, -1.6, 0, 6, 3.2, 14, hull); B.box(0, 1.4, 0, 70, 0.3, 15, deck);
    if (kind === "tanker") { for (let i = 0; i < 6; i++) B.cyl(-26 + i * 10, 1.7, 0, 4.2, 4.2, 1.4, "#9aa0a8", 10); B.box(0, 2.4, 0, 66, 0.3, 0.5, "#e6b422"); }
    else { const rnd = OSW.seeded(55); for (let i = 0; i < 7; i++) for (let j = -2; j <= 2; j++) { const h = 1 + ((rnd() * 3) | 0); for (let k = 0; k < h; k++) GEN.container(B, -28 + i * 8, 1.7 + k * 2.6, j * 2.8, CCOL[(rnd() * CCOL.length) | 0], 6); } }
    B.box(36, 1.7, 0, 9, 9, 12, "#f4f1e8"); B.box(36, 10.7, 0, 10, 0.5, 13, "#d9d9d4"); B.box(36, 11.2, 0, 7, 3, 10, "#27384a"); B.box(36.2, 11.4, 0, 6.6, 2.4, 10.2, "#9fd4f0", 0.3); B.cyl(41, 10, 0, 1.6, 1.4, 6, "#c0392b", 8); B.cyl(41, 16, 0, 1.7, 1.7, 0.6, "#2b2b30", 8); B.cyl(36, 14.2, 0, 0.1, 0.05, 6, "#9aa0a8", 4);
    [-1, 1].forEach((sd) => { for (let x = -34; x < 34; x += 6) B.box(x, 1.7, sd * 7.3, 0.1, 1.0, 0.1, "#cfd3d8"); B.box(0, 2.6, sd * 7.3, 68, 0.08, 0.08, "#cfd3d8"); });
  };
  GEN.crane = (B, h) => { // رافعة سفن (portal) — تمتد بحر باتجاه +z
    const col = "#e07a3a", leg = "#d9d9d4"; [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => B.box(sx * 5.5, 0, sz * 5, 1.1, h * 0.72, 1.1, leg))); [-1, 1].forEach((sx) => B.box(sx * 5.5, h * 0.72, 0, 1.4, 1.4, 12, col)); B.box(0, h * 0.72, -5, 12, 1.4, 1.4, col); B.box(0, h * 0.72, 5, 12, 1.4, 1.4, col);
    B.box(0, h * 0.72 + 1.4, 0, 13, 1.6, 12, "#c9c4b0"); B.box(0, h * 0.72 + 3, -2, 8, 3.4, 5, "#e6b422"); B.box(0, h * 0.72 + 5, 22, 3, 1.6, 52, col); B.box(0, h * 0.72 + 5.1, -16, 3, 1.4, 18, dk(col, 0.1)); B.box(0, h * 0.72 + 6.8, 5, 0.5, 0.5, 40, dk(col, 0.3));
    B.box(0, h * 0.72 + 6.6, 22, 3.6, 2.6, 3.6, "#555"); B.cyl(0, h * 0.72 + 3.5, 22, 0.1, 0.1, 6, "#333", 4); B.box(0, h * 0.72 - 0.8, 22, 2.8, 0.4, 5.6, "#e6b422"); [-5, 5].forEach((sz) => B.box(-6, 1, sz, 0.8, 1.6, 0.8, "#2b2b30")); [-1, 1].forEach((sx) => B.box(sx * 5.5, 0, 0, 1.2, 1, 12.4, "#555"));
  };
  const meshOf = (fn) => { const b = new Builder(); fn(b); return b.build(R.gl); };
  GEN.mesh = (c, fn) => { const m = meshOf(fn); c.meshes.push(m); return m; };

  /* ---------- مناطق مشتركة ---------- */
  const Z = GEN.zones;
  Z.parking = (c, s) => { const B = c.B; B.box(s.x, 0.09, s.z, s.w, 0.03, s.d, "#4a4d55"); for (let x = -s.w / 2 + 2; x <= s.w / 2 - 1; x += 3) { B.box(s.x + x, 0.12, s.z - s.d / 4, 0.14, 0.02, 4.6, "#f1f1ec"); B.box(s.x + x, 0.12, s.z + s.d / 4, 0.14, 0.02, 4.6, "#f1f1ec"); }
    const rnd = c.rnd; for (let x = -s.w / 2 + 3.5; x < s.w / 2 - 2; x += 3) [-1, 1].forEach((sd) => { if (rnd() < 0.55) C.parkedCar(c, s.x + x - 0.5, s.z + sd * s.d / 4, sd > 0 ? PI : 0, C.pick(rnd, C.pal.cars)); }); };
  Z.plaza = (c, s) => { const B = c.B, r = s.r || 30; B.disc(s.x, 0.1, s.z, r, "#d8cfbe", 40); B.disc(s.x, 0.12, s.z, r - 3, "#e9e1d0", 40); for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; B.box(s.x + cos(a) * (r - 1.5), 0.13, s.z + sin(a) * (r - 1.5), 1.5, 0.02, 3, "#b9ae98"); }
    B.cyl(s.x, 0.1, s.z, 9, 9, 0.9, "#b9b2a4", 20); B.cyl(s.x, 1.02, s.z, 8, 8, 0.04, "#7fd3ff", 20, 0.4); B.cyl(s.x, 0.1, s.z, 1.4, 1.1, 5.4, "#cfc7b8", 10); B.cyl(s.x, 5.4, s.z, 3.2, 1.6, 0.6, "#cfc7b8", 12); B.cyl(s.x, 6.0, s.z, 0.12, 0.12, 2.4, "#7fd3ff", 6, 0.6); B.sphere(s.x, 8.6, s.z, 0.6, 0.6, 0.6, "#fff3c0", 7, 1);
    C.circ(c, s.x, s.z, 9.5); for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + 0.2; C.bench(c, s.x + cos(a) * (r - 6), s.z + sin(a) * (r - 6), -a + PI / 2); C.tree(c, s.x + cos(a + 0.4) * (r - 3), s.z + sin(a + 0.4) * (r - 3), 0.8, "round"); }
    c.walkers.push({ cx: s.x, cz: s.z, r: r - 12, n: 5, sp: 0.5 }); };
  Z.containers = (c, s) => { const rnd = c.rnd, B = c.B; B.box(s.x, 0.09, s.z, s.w, 0.03, s.d, "#8a8d92"); const cols = Math.floor(s.w / 14), rows = Math.floor(s.d / 12);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (rnd() < 0.12) continue; const x = s.x - s.w / 2 + 7 + i * 14 + (s.w - cols * 14) / 2, z = s.z - s.d / 2 + 6 + j * 12 + (s.d - rows * 12) / 2, hgt = 1 + ((rnd() * 4) | 0), col = CCOL[(rnd() * CCOL.length) | 0];
      for (let k = 0; k < hgt; k++) [-1.3, 1.3].forEach((dx) => GEN.container(B, x + dx, 0.1 + k * 2.6, z, k % 2 ? dk(col, 0.1) : col, 10)); C.rect(c, x - 2.8, z - 5.2, x + 2.8, z + 5.2); }
    // رافعة ساحة (RTG) متحركة على الريل
    c.anim.push({ mesh: GEN.mesh(c, (b) => { [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => b.box(sx * 6.4, 0, sz * 1.5, 0.7, 9, 0.7, "#e6b422"))); b.box(0, 9, 0, 14.4, 1.2, 4.2, "#e07a3a"); b.box(0, 7.4, 0, 3, 1.6, 3, "#555"); b.box(0, 5.4, 0, 0.2, 2.2, 0.2, "#333"); }), x: s.x, y: 0, z: s.z - s.d / 2 - 6, mode: "slide", axis: "z", amp: s.d / 2 - 4, sp: 0.07 }); };
  Z.truckpark = (c, s) => { const B = c.B, rnd = c.rnd; B.box(s.x, 0.09, s.z, s.w, 0.03, s.d, "#55585f"); const n = Math.floor(s.w / 4.6); for (let i = 0; i <= n; i++) B.box(s.x - s.w / 2 + i * 4.6, 0.12, s.z, 0.14, 0.02, s.d - 2, "#f1f1ec");
    for (let i = 0; i < n; i++) { if (rnd() < 0.35) continue; const x = s.x - s.w / 2 + 2.3 + i * 4.6; c.B.push(x, 0.1, s.z, PI); GEN.truck(c.B, { cab: C.pick(rnd, ["#2a6fb5", "#c0392b", "#2a9d8f", "#e6b422"]), trailer: rnd() < 0.5 ? "#d9d9d4" : "#e9e1d0", container: rnd() < 0.4 ? CCOL[(rnd() * CCOL.length) | 0] : null }); c.B.pop(); C.rect(c, x - 1.4, s.z - 5.5, x + 1.4, s.z + 5.5); } };
  Z.tanks = (c, s) => { const B = c.B, n = 4; B.box(s.x, 0.09, s.z, s.w, 0.03, s.d, "#8a8d92"); for (let i = 0; i < n; i++) { const x = s.x - s.w / 2 + 6 + (i % 2) * 15, z = s.z - s.d / 2 + 7 + ((i / 2) | 0) * 13; B.cyl(x, 0.1, z, 5.4, 5.4, 9, "#e6e8ea", 14); B.sphere(x, 9.1, z, 5.4, 1.6, 5.4, "#d4d8dc", 12, 0, true); B.cyl(x, 0.1, z, 5.5, 5.5, 1.2, "#c0392b", 14); B.box(x + 5.5, 0.1, z, 0.2, 9.4, 1.0, "#555"); C.circ(c, x, z, 5.8); } B.box(s.x, 1.0, s.z + 1.6, s.w - 4, 0.3, 0.3, "#e6b422"); };

  /* ===================== جزيرة الأعمال ===================== */
  GEN.gens.ISL_BUSINESS = (c) => {
    const I = D.islands.ISL_BUSINESS, rnd = c.rnd;
    D.sites.filter((s) => s.isl === I.id).forEach((s) => { if (s.kind === "zone") Z[s.style] && Z[s.style](c, s); else GEN.drawSite(c, s); });
    // أشجار وأحواض زراعية بين المباني
    const plant = (u, v, kind) => C.tree(c, I.c.x + u, I.c.z + v, 0.8 + rnd() * 0.3, kind); for (let u = -130; u <= 130; u += 20) [-10, 10, -56, 56].forEach((v) => { if (hy(u, v) < 34 || (Math.abs(u) < 10)) return; plant(u, v, "round"); });
    // سيارات تمشي على الشارع الرئيسي
    const cars = []; for (let i = 0; i < 5; i++) { const col = C.pal.cars[i % C.pal.cars.length]; c.anim.push({ mesh: GEN.mesh(c, (b) => C.carShape(b, col)), mode: "line", x0: I.c.x - 140, z0: I.c.z + (i % 2 ? 3.2 : -3.2), x1: I.c.x + 140, z1: I.c.z + (i % 2 ? 3.2 : -3.2), sp: 0.012 + i * 0.002, ph: i / 5, rev: i % 2 }); }
    for (let i = 0; i < 3; i++) c.anim.push({ mesh: GEN.mesh(c, (b) => C.carShape(b, C.pal.cars[(i + 3) % 9])), mode: "line", x0: I.c.x + (i % 2 ? 3.2 : -3.2), z0: I.c.z - 140, x1: I.c.x + (i % 2 ? 3.2 : -3.2), z1: I.c.z + 140, sp: 0.01 + i * 0.002, ph: i / 3, rev: i % 2 });
    c.walkers.push({ cx: I.c.x + 58, cz: I.c.z - 6, r: 14, n: 3, sp: 0.55 }, { cx: I.c.x - 58, cz: I.c.z + 8, r: 16, n: 3, sp: 0.5 }, { cx: I.c.x, cz: I.c.z + 76, r: 18, n: 3, sp: 0.6 });
  };

  /* ===================== جزيرة الميناء ===================== */
  GEN.gens.ISL_PORT = (c) => {
    const I = D.islands.ISL_PORT, rnd = c.rnd; GEN.piers(c);
    D.sites.filter((s) => s.isl === I.id).forEach((s) => { if (s.kind === "zone") Z[s.style] && Z[s.style](c, s); else GEN.drawSite(c, s); });
    // سفن على الأرصفة (بتتمايل)
    const kinds = ["container", "tanker", "container"]; [-44, 0, 44].forEach((v, i) => { c.anim.push({ mesh: GEN.mesh(c, (b) => GEN.ship(b, kinds[i])), x: I.c.x - 168, y: 0, z: I.c.z + v, ry: 0, mode: "bob", ph: i * 2 }); C.rect(c, I.c.x - 215, I.c.z + v - 8, I.c.x - 125, I.c.z + v + 8); });
    // رافعات الأرصفة (على الأرصفة 2 و3)
    const craneM = GEN.mesh(c, (b) => GEN.crane(b, 26)); [[-22, 1], [22, -1]].forEach(([v, sg], i) => { const x = I.c.x - 150 - i * 16; c.anim.push({ mesh: craneM, x, y: 0.1, z: I.c.z + v, ry: sg > 0 ? PI : 0, mode: "static" }); C.rect(c, x - 7, I.c.z + v - 6, x + 7, I.c.z + v + 6); });
    // رافعة الحاويات الجسرية (بتتحرك بين الحاويات والرصيف)
    // شاحنات وفوركليفت تتحرك على طرق الميناء
    const truck = (cab, cont) => GEN.mesh(c, (b) => GEN.truck(b, { cab, container: cont })), fork = GEN.mesh(c, (b) => GEN.forklift(b));
    c.anim.push({ mesh: truck("#2a6fb5", "#c0392b"), mode: "line", x0: I.c.x + 120, z0: I.c.z - 70, x1: I.c.x - 98, z1: I.c.z - 70, sp: 0.02, ph: 0, rev: 0, off: 2.4 }, { mesh: truck("#c0392b", "#2a9d8f"), mode: "line", x0: I.c.x - 98, z0: I.c.z - 70, x1: I.c.x + 120, z1: I.c.z - 70, sp: 0.018, ph: 0.4, rev: 0, off: 2.4 }, { mesh: truck("#e6b422", "#7b4fa3"), mode: "line", x0: I.c.x - 98, z0: I.c.z - 110, x1: I.c.x - 98, z1: I.c.z + 100, sp: 0.016, ph: 0.2, rev: 0, off: 2.4 });
    c.anim.push({ mesh: fork, mode: "line", x0: I.c.x - 96, z0: I.c.z - 60, x1: I.c.x - 96, z1: I.c.z + 30, sp: 0.02, ph: 0.1, rev: 1, off: 0 });
    // عمّال بالميناء
    c.walkers.push({ cx: I.c.x - 70, cz: I.c.z + 54, r: 12, n: 3, sp: 0.5, look: "worker" }, { cx: I.c.x + 40, cz: I.c.z + 20, r: 10, n: 3, sp: 0.55, look: "worker" }, { cx: I.c.x, cz: I.c.z + 94, r: 12, n: 3, sp: 0.5 });
    for (let u = -90; u < 130; u += 24) { C.tree(c, I.c.x + u, I.c.z - 114 + rnd() * 6, 0.8, "palm"); }
  };
})();
