/* المدينة الكبرى — الأحياء والمباني (كل دالة بتبني بلوك 80×80) */
(function () {
  const OSW = window.OSW, C = OSW.city, PI = Math.PI, dk = OSW.col.dk, lt = OSW.col.lt, gen = C.gen;
  const rr = (rnd, a, b) => a + rnd() * (b - a);

  // مبنى وظيفي: باب + فعل دخول + لافتة + نقطة وقوف
  function enterable(c, id, ry, doorCol) {
    const p = C.PLACES[id];
    C.door(c, p.door.x, p.door.z, ry, 3.6, doorCol);
    C.act(c, "ct:in:" + id, p.door.x, 1.6, p.door.z, 3.4, p.front.x, p.front.z);
    C.label(c, "ctl_" + id, `${p.e} ${p.name}`, p.door.x, 9, p.door.z, { act: "ct:in:" + id, max: 95 });
    OSW.INT.outAt[id] = { x: p.front.x, z: p.front.z }; OSW.INT.enterAct[id] = "ct:in:" + id;
  }
  C.enterable = enterable;

  /* ===== سكني: عمارات وفلل ===== */
  gen.res = (c) => {
    const rnd = c.rnd, B = c.B;
    if ((c.bx + c.bz) % 2 === 0) { // عمارات 2×2
      [[-16, -16], [16, -16], [-16, 16], [16, 16]].forEach(([dx, dz], i) => {
        const h = rr(rnd, 16, 32), w = 22 + ((rnd() * 4) | 0), d = 18 + ((rnd() * 4) | 0), x = c.cx + dx, z = c.cz + dz;
        C.tower(c, x, z, w, d, h, { wall: C.pick(rnd, C.pal.warm.concat(C.pal.wall)), seg: 5.5, lit: 0.3 });
        for (let f = 1; f < Math.floor(h / 3.4); f += 2) B.box(x, 3.2 + f * 3.0, z + d / 2 + 0.6, w * 0.7, 0.14, 1.2, "#b9b4aa");  // شرفات
        C.door(c, x, z + d / 2 + 0.1, 0, 2.6, "#5b4636");
      });
    } else { // فلل بحدائق
      [[-18, -17], [18, -17], [-18, 17], [18, 17]].forEach(([dx, dz]) => {
        const x = c.cx + dx, z = c.cz + dz, w = 13, d = 11, wall = C.pick(rnd, C.pal.warm);
        B.box(c.cx + dx, 0.15, z, 24, 0.04, 22, "#79c785");
        B.box(x, 0.15, z, w, 6, d, wall); B.prism(x, 6.15, z, w + 1.2, 3.2, d + 1.2, C.pick(rnd, ["#a4452c", "#6b8e5a", "#7a3b69", "#2f5d9a"]));
        B.box(x - 3, 2.0, z + d / 2 + 0.03, 2.6, 2.2, 0.08, "#9fd4f0", 0.3); B.box(x + 3, 2.0, z + d / 2 + 0.03, 2.6, 2.2, 0.08, "#9fd4f0", 0.3); B.box(x, 0.15, z + d / 2 + 0.05, 1.6, 2.6, 0.1, "#6b4a3a");
        C.rect(c, x - w / 2, z - d / 2, x + w / 2, z + d / 2);
        C.tree(c, x + 9, z + 7, 0.9); C.tree(c, x - 9, z - 7, 0.8);
        if (rnd() < 0.7) C.parkedCar(c, x + 8.4, z - 2, PI / 2, C.pick(rnd, C.pal.cars));
      });
    }
  };

  /* ===== أعمال: أبراج ===== */
  gen.com = (c) => {
    const rnd = c.rnd;
    [[-17, -17, 24, 20, 60], [17, -15, 22, 22, 44], [-15, 18, 26, 20, 36], [18, 18, 22, 22, 72]].forEach(([dx, dz, w, d, h]) => C.tower(c, c.cx + dx, c.cz + dz, w, d, h + rnd() * 8, { wall: C.pick(rnd, ["#aab7c4", "#b9c3cc", "#9fb0c0", "#c6cdd4"]), glass: C.pick(rnd, C.pal.glass), seg: 9, lit: 0.45, roof: "#6e7882" }));
    C.tree(c, c.cx, c.cz, 1.1, "round"); C.bench(c, c.cx - 3, c.cz + 1, 0); C.bench(c, c.cx + 3, c.cz + 1, 0);
  };

  /* ===== صناعي ===== */
  gen.ind = (c) => {
    const rnd = c.rnd, B = c.B;
    [[-17, -17], [17, -17]].forEach(([dx, dz]) => { const x = c.cx + dx, z = c.cz + dz; B.box(x, 0.15, z, 28, 8, 24, C.pick(rnd, ["#b7c0c9", "#c7beb0", "#a9b4a6"])); B.prism(x, 8.15, z, 29, 4, 25, "#7d8791"); for (let i = 0; i < 4; i++) B.box(x - 10 + i * 6.6, 0.15, z + 12.05, 5, 4.4, 0.1, "#4b5560"); C.rect(c, x - 14, z - 12, x + 14, z + 12); });
    for (let i = 0; i < 3; i++) { const x = c.cx - 22 + i * 8, z = c.cz + 22; B.cyl(x, 0.15, z, 3, 3, 10, "#d9dde1", 12); B.cyl(x, 10.15, z, 3, 0.2, 2, "#c4cad0", 12); C.circ(c, x, z, 3.2); }
    B.cyl(c.cx + 24, 0.15, c.cz + 20, 1.6, 1.2, 26, "#b86a52", 10); for (let i = 0; i < 4; i++) B.cyl(c.cx + 24, 8 + i * 6, c.cz + 20, 1.35 - i * 0.07, 1.3 - i * 0.07, 1.5, i % 2 ? "#f4f4f4" : "#d8402f", 10); C.circ(c, c.cx + 24, c.cz + 20, 1.8);
    for (let i = 0; i < 6; i++) { const x = c.cx - 6 + (i % 3) * 7, z = c.cz + 4 + ((i / 3) | 0) * 3.4; B.box(x, 0.15, z, 6, 2.6, 2.6, C.pick(rnd, ["#d9534f", "#2f6db5", "#e6a23c", "#3a9d6f"])); } C.rect(c, c.cx - 10, c.cz + 2, c.cx + 12, c.cz + 9);
  };

  /* ===== حديقة عامة: بحيرة، ممرات، جناح ===== */
  gen.park = (c) => {
    const rnd = c.rnd, B = c.B;
    B.disc(c.cx - 10, 0.2, c.cz - 6, 15, "#d6c79c", 24); B.disc(c.cx - 10, 0.24, c.cz - 6, 13.4, "#4aa3e0", 24); B.disc(c.cx - 10, 0.27, c.cz - 6, 9, "#63b6ee", 24);
    c.circs.push(...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ x: c.cx - 10 + Math.cos((i / 8) * PI * 2) * 12, z: c.cz - 6 + Math.sin((i / 8) * PI * 2) * 12, r: 3.4 })));
    B.strip([[c.ox + 10, c.cz + 14], [c.cx, c.cz + 14], [c.cx + 22, c.cz], [c.cx + 22, c.oz + 10]], 3.4, 0.22, "#e3d3ad"); B.strip([[c.cx, c.oz + 70], [c.cx, c.cz + 14]], 3.4, 0.22, "#e3d3ad");
    const px = c.cx + 20, pz = c.cz + 8; // جناح
    B.cyl(px, 0.2, pz, 6.5, 6.5, 0.4, "#e6dcc4", 12); [0, 1, 2, 3, 4, 5].forEach((i) => B.cyl(px + Math.cos(i / 6 * PI * 2) * 5.4, 0.4, pz + Math.sin(i / 6 * PI * 2) * 5.4, 0.22, 0.22, 3.6, "#f4efe4", 6)); B.cyl(px, 4.0, pz, 6.9, 0.3, 1.8, "#a4452c", 12);
    for (let i = 0; i < 4; i++) C.bench(c, px + (i < 2 ? -3.4 : 3.4), pz + (i % 2 ? 1.6 : -1.6), PI / 2);
    C.rect(c, px - 6.4, pz - 6.4, px + 6.4, pz + 6.4);
    for (let i = 0; i < 18; i++) { const x = c.ox + 12 + rnd() * 56, z = c.oz + 12 + rnd() * 56; if (Math.hypot(x - (c.cx - 10), z - (c.cz - 6)) < 17 || Math.hypot(x - px, z - pz) < 9) continue; C.tree(c, x, z, rr(rnd, 0.9, 1.4)); }
    for (let i = 0; i < 24; i++) c.F.sphere(c.ox + 12 + rnd() * 56, 0.3, c.oz + 12 + rnd() * 56, 0.3, 0.2, 0.3, ["#ff8fb1", "#ffd34e", "#fff", "#c9a6ff"][i % 4], 5);
  };

  /* ===== كورنيش سياحي: ممشى وملاهي بسيطة ===== */
  gen.tour = (c) => {
    const rnd = c.rnd, B = c.B;
    B.box(c.cx, 0.2, c.oz + 14, 64, 0.06, 7, "#e8d9b8");
    for (let i = 0; i < 6; i++) { const x = c.ox + 14 + i * 10.4; C.bench(c, x, c.oz + 18, 0); C.tree(c, x + 5, c.oz + 12, 0.8, "palm"); }
    // عجلة الملاهي (ثابتة بالشكل) + قاعدة
    const wx = c.cx + 4, wz = c.cz + 8, wr = 13, wy = 15; [-1, 1].forEach((s) => { B.push(wx + s * 4, 0.15, wz, 0, 0, s * 0.28); B.box(0, 0, 0, 0.9, wy, 0.9, "#8892a0"); B.pop(); });
    B.box(wx, wy - 0.7, wz, 1.6, 1.6, 4, "#5b6573"); for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, x = wx + Math.cos(a) * wr, y = wy + Math.sin(a) * wr; B.push(wx, wy, wz, 0, 0, a); B.box(wr / 2, 0, 0, wr, 0.18, 0.18, "#d8e0ea"); B.pop(); B.box(x, y - 1.3, wz, 1.3, 1.2, 1.2, ["#e63946", "#ffd23f", "#4dabf7", "#7ac74f"][i % 4]); }
    B.cyl(wx, wy, wz, 0.4, 0.4, 0.3, "#333", 8); C.rect(c, wx - 6, wz - 2, wx + 6, wz + 2);
    // أكشاك
    [[-24, 16], [-12, 24]].forEach(([dx, dz], i) => { const x = c.cx + dx, z = c.cz + dz; B.box(x, 0.15, z, 5, 3, 3.4, i ? "#f0a07a" : "#7fc4d9"); B.box(x, 3.15, z, 6, 0.3, 4.4, i ? "#d94f3d" : "#2b6b85"); C.rect(c, x - 2.6, z - 1.8, x + 2.6, z + 1.8); });
    for (let i = 0; i < 8; i++) C.tree(c, c.ox + 14 + rnd() * 52, c.oz + 40 + rnd() * 30, 1, "palm");
  };

  /* ===== شاطئ ===== */
  gen.beach = (c) => {
    const rnd = c.rnd, B = c.B;
    B.box(c.cx, 0.2, c.cz + 14, 80, 0.05, 50, "#f0e2b4"); B.box(c.ox + 70, 0.0, c.cz, 14, 0.05, 80, "#79c6ee");
    for (let i = 0; i < 7; i++) { const x = c.ox + 14 + i * 8.6, z = c.oz + 26 + (i % 3) * 8; B.cyl(x, 0.2, z, 0.06, 0.06, 2.6, "#eee", 5); B.cyl(x, 2.3, z, 1.7, 0, 0.8, ["#e63946", "#ffd23f", "#2a9d8f", "#ff8c42", "#9b5de5", "#4dabf7", "#ff7aa8"][i], 8); B.box(x + 1.4, 0.2, z, 0.9, 0.12, 2, "#f4f4f4"); C.circ(c, x, z, 0.4); }
    [[-22, 30], [10, 34]].forEach(([dx, dz]) => { const x = c.cx + dx, z = c.cz + dz; B.box(x, 0.2, z, 4, 2.6, 4, "#f4f1e8"); B.prism(x, 2.8, z, 4.6, 1.6, 4.6, "#c0392b"); C.rect(c, x - 2, z - 2, x + 2, z + 2); });
    for (let i = 0; i < 9; i++) C.tree(c, c.ox + 12 + rnd() * 50, c.oz + 12 + rnd() * 12, 1, "palm");
  };

  /* ===== ميناء (أرصفة، حاويات، رافعات، سفينة) ===== */
  function dock(c, withShip) {
    const rnd = c.rnd, B = c.B, ex = c.ox + 80;
    B.box(ex - 3, -0.2, c.cz, 6, 0.5, 80, "#7f7d78"); B.box(ex - 1, 0.1, c.cz, 1.4, 0.7, 80, "#c9c3b4");
    for (let z = c.oz + 8; z < c.oz + 80; z += 12) { B.cyl(ex - 1.2, 0.2, z, 0.3, 0.3, 0.6, "#2b2b30", 6); C.circ(c, ex - 1.2, z, 0.3); }
    for (let i = 0; i < 8; i++) { const x = c.ox + 16 + (i % 4) * 7, z = c.oz + 18 + ((i / 4) | 0) * 3.2, col = C.pick(rnd, ["#d9534f", "#2f6db5", "#e6a23c", "#3a9d6f", "#8e5ac8"]); B.box(x, 0.15, z, 6, 2.6, 2.6, col); if (rnd() < 0.6) B.box(x, 2.75, z, 6, 2.6, 2.6, C.pick(rnd, ["#d9534f", "#2f6db5", "#e6a23c"])); }
    C.rect(c, c.ox + 12, c.oz + 15, c.ox + 42, c.oz + 26);
    // رافعة
    const cx = ex - 12, cz = c.oz + 52; [[-3, -2], [3, -2], [-3, 2], [3, 2]].forEach(([a, b]) => B.box(cx + a, 0.15, cz + b, 0.5, 14, 0.5, "#d8402f")); B.box(cx, 14, cz, 8, 1, 6, "#d8402f"); B.box(cx + 8, 14.6, cz, 22, 0.9, 1.4, "#e6e0d6"); C.rect(c, cx - 4, cz - 3, cx + 4, cz + 3);
    if (withShip) { const sx = ex + 14, sz = c.cz - 5; B.box(sx, -0.8, sz, 14, 5, 54, "#2b3a55"); B.box(sx, 3.8, sz, 14.4, 0.6, 54.4, "#e6e0d6"); B.box(sx, 4.4, sz + 18, 9, 7, 9, "#f4f1e8"); B.box(sx, 11.4, sz + 18, 7, 2.4, 6, "#ffffff"); B.cyl(sx, 13.8, sz + 18, 1.0, 1.0, 3, "#d8402f", 8); for (let i = 0; i < 5; i++) B.box(sx + (i % 2 ? 2 : -2), 4.4, sz - 18 + i * 6, 4.4, 2.6, 4, ["#d9534f", "#2f6db5", "#e6a23c", "#3a9d6f", "#8e5ac8"][i]); }
  }
  gen.port = (c) => { dock(c, c.bz === 3); if (c.bz === 4) { c.B.box(c.ox + 30, 0.15, c.oz + 22, 30, 7, 20, "#b7c0c9"); c.B.prism(c.ox + 30, 7.15, c.oz + 22, 31, 3, 21, "#7d8791"); C.rect(c, c.ox + 15, c.oz + 12, c.ox + 45, c.oz + 32); } };
  gen.pmkt = (c) => {
    const B = c.B; dock(c, false);
    const p = C.PLACES.port, x = 418, z = 600;   // سوق الميناء: باب غرب
    B.box(x, 0.15, z, 26, 6.5, 22, "#e9dcc0"); B.prism(x, 6.65, z, 27, 3.4, 23, "#2b6b85"); B.box(x - 13.05, 3.2, z, 0.2, 2.6, 18, "#9fd4f0", 0.3);
    for (let i = 0; i < 6; i++) B.box(x - 13.6, 3.0, z - 8 + i * 3.2, 1.0, 0.15, 2.8, i % 2 ? "#ffffff" : "#2b6b85");
    C.rect(c, x - 13, z - 11, x + 13, z + 11); enterable(c, "port", -PI / 2, "#2b6b85");
    // الممر الخشبي بالبحر
    const pr = C.PIER; B.box((pr.x0 + pr.x1) / 2, -0.15, pr.z, pr.x1 - pr.x0, 0.5, pr.w, "#a97c50"); for (let xx = pr.x0 + 2; xx < pr.x1; xx += 6) { B.cyl(xx, -3, pr.z - 3.6, 0.3, 0.3, 3, "#6b4a30", 5); B.cyl(xx, -3, pr.z + 3.6, 0.3, 0.3, 3, "#6b4a30", 5); }
    [-1, 1].forEach((sd) => B.box((pr.x0 + pr.x1) / 2, 0.3, pr.z + sd * (pr.w / 2 - 0.1), pr.x1 - pr.x0, 0.12, 0.12, "#6b4a30"));
    C.act(c, "ct:fish", pr.x1 - 4, 1.2, pr.z, 4.5, pr.x1 - 5, pr.z); C.label(c, "ctl_fish", "🎣 صيد السمك", pr.x1 - 4, 4, pr.z, { act: "ct:fish", max: 90, cls: "sm" });
  };

  /* ===== ميدان المدينة + محطة المواصلات ===== */
  gen.plaza = (c) => {
    const B = c.B, cx = c.cx, cz = c.cz;
    B.disc(cx, 0.2, cz, 30, "#d9ccaa", 36); B.disc(cx, 0.22, cz, 27, "#ebe0c2", 36);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; B.disc(cx + Math.cos(a) * 24, 0.24, cz + Math.sin(a) * 24, 0.6, "#cdbb90", 6); }
    B.cyl(cx, 0.2, cz, 7.4, 7.4, 1.0, "#9aa7b8", 24); B.cyl(cx, 1.0, cz, 6.8, 6.8, 0.1, "#63b6ee", 24); B.cyl(cx, 0.2, cz, 0.9, 0.7, 4.6, "#a3b3c4", 10); B.cyl(cx, 4.4, cz, 2.6, 0.9, 0.4, "#93a6ba", 14); B.sphere(cx, 5.2, cz, 0.7, 0.8, 0.7, "#bfe6ff", 8); C.circ(c, cx, cz, 7.6);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + 0.2; C.bench(c, cx + Math.cos(a) * 14, cz + Math.sin(a) * 14, -a + PI / 2); C.tree(c, cx + Math.cos(a + 0.4) * 21, cz + Math.sin(a + 0.4) * 21, 0.9, i % 2 ? "palm" : "round"); }
    // محطة مواصلات (تاكسي/باص): بتشتغل فعلياً
    const sx = 262, sz = 580; B.box(sx, 0.2, sz, 9, 0.2, 4.4, "#cfc7b8"); [[-4.2, -1.8], [4.2, -1.8], [-4.2, 1.8], [4.2, 1.8]].forEach(([a, b]) => B.box(sx + a, 0.2, sz + b, 0.2, 3.2, 0.2, "#3b4452")); B.box(sx, 3.4, sz, 10, 0.3, 5, "#2b6b85"); B.box(sx, 0.9, sz - 2.0, 8, 1.6, 0.1, "#9fd4f0", 0.3); B.box(sx, 0.5, sz - 1.4, 7, 0.14, 0.6, "#a97c50");
    C.sign(c, sx, 4.4, sz + 2.4, 6, 1.3, "#ffd23f"); C.rect(c, sx - 4.6, sz - 2.4, sx + 4.6, sz + 2.4);
    C.act(c, "ct:taxi", sx, 1.4, sz, 5, sx, sz + 4.2); C.label(c, "ctl_taxi", "🚕 المواصلات", sx, 6.2, sz, { act: "ct:taxi", max: 95 });
    // قاعدة تمثال
    B.box(cx, 0.2, cz + 18, 3, 1.2, 3, "#bdb7aa"); B.cyl(cx, 1.4, cz + 18, 0.6, 0.4, 3.6, "#8c7a5a", 8); B.sphere(cx, 5.2, cz + 18, 0.6, 0.6, 0.6, "#8c7a5a", 7); C.circ(c, cx, cz + 18, 1.8);
  };

  /* ===== فندق الواحة ===== */
  gen.hotel = (c) => {
    const B = c.B, rnd = c.rnd, x = 270, z = 520, w = 36, d = 26, h = 52;
    C.tower(c, x, z, w, d, h, { wall: "#efe3cc", glass: "#8cc0dc", seg: 6, lit: 0.5, roof: "#9c7a4f", flat: true });
    B.box(x, h + 0.35, z, w - 6, 3, d - 6, "#d6c3a0"); C.sign(c, x, h + 3.8, z + d / 2 - 2.4, 22, 3.2, "#ffd98a"); B.cyl(x + 10, h + 0.35, z - 4, 1.2, 1.2, 2, "#8aa0b3", 8);
    B.box(x, 0.15, z + d / 2 + 5, 24, 0.12, 9, "#bfb7a6"); B.box(x - 12, 0.15, z + d / 2 + 6, 1.0, 6, 1.0, "#d6c3a0"); B.box(x + 12, 0.15, z + d / 2 + 6, 1.0, 6, 1.0, "#d6c3a0"); B.box(x, 6, z + d / 2 + 6, 26, 0.5, 11, "#9c7a4f");
    enterable(c, "hotel", 0, "#3b2f2f");
    C.tree(c, x - 20, z + d / 2 + 8, 1.1, "palm"); C.tree(c, x + 20, z + d / 2 + 8, 1.1, "palm"); C.tree(c, x - 22, z - 10, 1.2); C.tree(c, x + 22, z - 10, 1.2);
    B.disc(x, 0.22, z + d / 2 + 14, 4.6, "#d6c3a0", 16); B.disc(x, 0.5, z + d / 2 + 14, 3.2, "#63b6ee", 16); C.circ(c, x, z + d / 2 + 14, 4.2);
  };

  /* ===== شارع المطاعم ===== */
  gen.food = (c) => {
    const B = c.B, rnd = c.rnd, z = 518, d = 20, list = [["resto_a", 331, "#c9702e", "#f1d9b0"], ["resto_b", 352, "#c0392b", "#f6e4cc"], ["cafe", 373, "#2a7a6f", "#efe6d2"]];
    list.forEach(([id, x, awn, wall]) => {
      C.tower(c, x, z, 18, d, 9, { wall, floors: 2, base: 0.4, seg: 6, lit: 0.6, glass: "#8cc0dc", roof: "#8a5a3b", flat: true });
      B.box(x, 0.15, z + d / 2 + 0.2, 17, 3.4, 0.1, "#9fd4f0", 0.5);
      for (let i = 0; i < 6; i++) { B.push(x - 7.5 + i * 3, 3.6, z + d / 2 + 1.2, 0, -0.45); B.box(0, 0, 0, 2.9, 0.1, 2.6, i % 2 ? "#ffffff" : awn); B.pop(); }
      C.sign(c, x, 7.2, z + d / 2 + 0.6, 12, 1.8, awn); enterable(c, id, 0, awn);
      [[-5, 8], [5, 8]].forEach(([dx, dz]) => { const tx = x + dx, tz = z + d / 2 + dz; B.cyl(tx, 0.15, tz, 0.7, 0.7, 0.8, "#8d6e63", 8); B.cyl(tx, 0.95, tz, 0.8, 0.8, 0.06, "#d7b98a", 8); for (let k = 0; k < 2; k++) B.box(tx + (k ? 1.3 : -1.3), 0.15, tz, 0.5, 0.5, 0.5, awn); C.circ(c, tx, tz, 1.4); });
    });
    for (let i = 0; i < 5; i++) C.tree(c, c.ox + 14 + i * 14, c.oz + 58, 0.8, "palm");
    B.box(c.cx, 0.2, c.oz + 62, 60, 0.05, 9, "#e3d3ad");
  };

  /* ===== مجمّع التسوق ===== */
  gen.mall = (c) => {
    const B = c.B, x = 183, z = 600, w = 46, d = 44, h = 20;
    B.box(x, 0.15, z, w, h, d, "#e8dfd0"); B.box(x, 0.15, z, w + 0.6, 4, d + 0.6, "#c9c0ae");
    C.ribbons(c, x, z, w, d, 4, 4, 4, { glass: "#8cc0dc", seg: 7, lit: 0.55, slab: "#d8cfbf" });
    B.box(x, h + 0.15, z, w + 1, 0.5, d + 1, "#8d8a85"); B.box(x + 8, h + 0.65, z, 18, 3, 14, "#b9bcc2"); B.cyl(x - 12, h + 0.65, z + 8, 1.6, 1.6, 2, "#8aa0b3", 8);
    B.box(x + w / 2 - 1.2, 0.15, z, 3.6, 8, 18, "#9fd4f0", 0.35); B.box(x + w / 2 + 0.6, 8, z, 6, 0.6, 20, "#c0392b"); C.sign(c, x + w / 2 + 0.2, 10.4, z, 14, 2.4, "#ff9aa8", PI / 2);
    C.rect(c, x - w / 2, z - d / 2, x + w / 2, z + d / 2); enterable(c, "mall", PI / 2, "#7a3b3b");
    for (let i = 0; i < 4; i++) { C.tree(c, 217, 566 + i * 22, 0.8, "palm"); }
    C.bench(c, 214, 580, PI / 2); C.bench(c, 214, 620, PI / 2);
  };

  /* ===== مستشفى ===== */
  gen.hosp = (c) => {
    const B = c.B, x = 348, z = 600, w = 36, d = 30, h = 26;
    C.tower(c, x, z, w, d, h, { wall: "#f4f6f8", glass: "#9ecbe3", seg: 6, lit: 0.4, roof: "#cfd6dc", flat: true });
    B.box(x, h + 0.35, z, 0.9, 5, 5, "#e63946", 1); B.box(x, h + 0.35, z, 5, 5, 0.9, "#e63946", 1); B.box(x - 10, h + 0.35, z - 6, 8, 0.1, 8, "#f0f0f0"); // سقف مروحية
    B.box(x - w / 2 - 6, 0.15, z, 12, 0.5, 14, "#e6e8ea"); B.box(x - w / 2 - 6, 4.0, z, 13, 0.4, 15, "#e63946");
    [-1, 1].forEach((s) => B.box(x - w / 2 - 11, 0.15, z + s * 6, 0.5, 4, 0.5, "#cfd6dc"));
    enterable(c, "hospital", -PI / 2, "#e63946"); C.sign(c, x - w / 2 - 0.5, 18, z, 14, 2.6, "#e63946", -PI / 2);
    // إسعاف
    c.B.push(x - w / 2 - 8, 0.15, z + 20, PI / 2); B.box(0, 0.4, 0, 2.2, 1.9, 5.4, "#f4f6f8"); B.box(0, 1.3, 2.2, 2.0, 0.9, 0.9, "#27384a"); B.box(0, 2.0, 0, 2.0, 0.2, 0.4, "#e63946", 0.6); [[-1.1, 1.8], [1.1, 1.8], [-1.1, -1.8], [1.1, -1.8]].forEach(([a, b]) => B.cyl(a, 0.15, b, 0.4, 0.4, 0.3, "#222", 8)); c.B.pop(); C.rect(c, x - w / 2 - 10, z + 17, x - w / 2 - 6, z + 23);
    for (let i = 0; i < 4; i++) C.tree(c, x - 6 + i * 8, z + 22, 0.9, "cyp");
  };

  /* ===== مركز الشرطة ===== */
  gen.police = (c) => {
    const B = c.B, x = 270, z = 669, w = 30, d = 22, h = 14;
    C.tower(c, x, z, w, d, h, { wall: "#cfd8e6", glass: "#6aa3c9", seg: 6, lit: 0.4, roof: "#34455f", flat: true, floors: 3 });
    B.box(x, h + 0.35, z, w - 4, 1.2, d - 4, "#34455f"); B.sphere(x + 11, h + 2.4, z, 0.5, 0.4, 0.5, "#3a7bff", 6, 1); B.sphere(x + 12, h + 2.4, z, 0.5, 0.4, 0.5, "#ff3b3b", 6, 1);
    enterable(c, "police", PI, "#34455f"); C.sign(c, x, 10.2, z - d / 2 - 0.5, 14, 2.2, "#4d8bff", PI);
    // سيارتين شرطة
    [[-14, -12], [14, -12]].forEach(([dx, dz], i) => { c.B.push(x + dx, 0.15, z + dz, i ? PI / 2 : -PI / 2); C.carShape(B, "#f4f6f8"); B.box(0, 1.35, -0.2, 1.4, 0.16, 0.5, "#3a7bff", 1); c.B.pop(); C.rect(c, x + dx - 2.2, z + dz - 1.2, x + dx + 2.2, z + dz + 1.2); });
    C.tree(c, x - 20, z - 12, 1); C.tree(c, x + 20, z - 12, 1);
  };

  /* ===== مواقف عامة ===== */
  function lot(c, key) {
    const B = c.B, rnd = c.rnd, L = C.LOT_DEFS[key], side = L.h < 0 ? 1 : -1;
    B.box(c.cx, 0.12, c.cz, 62, 0.04, 62, "#5a5d64");
    for (let i = 0; i <= 10; i++) { const z = L.z - 1.55 + i * 3.1; B.box(L.x + side * 0.0, 0.17, z, 6.4, 0.02, 0.14, "#f4f4f4"); B.box(L.x + side * 11, 0.17, z, 6.4, 0.02, 0.14, "#f4f4f4"); }
    for (let i = 0; i < 7; i++) if (rnd() < 0.8) C.parkedCar(c, L.x + side * 11, L.z + i * 3.1, side > 0 ? PI / 2 : -PI / 2, C.pick(rnd, C.pal.cars));
    B.box(c.cx, 0.2, c.oz + 14, 30, 0.02, 0.3, "#f1e27a");
    B.cyl(c.cx - 22, 0.15, c.oz + 14, 0.12, 0.12, 3.6, "#444", 6); B.box(c.cx - 22, 3.6, c.oz + 14, 1.8, 1.8, 0.2, "#2b6bd8"); C.label(c, "ctl_lot" + key, "🅿️ موقف عام", c.cx - 22, 6, c.oz + 14, { max: 80, cls: "sm" });
    for (let i = 0; i < 6; i++) C.tree(c, c.ox + 14 + i * 10.5, c.oz + 70, 0.8, "round");
  }
  gen.lotC1 = (c) => lot(c, "C1"); gen.lotC2 = (c) => lot(c, "C2");
})();
