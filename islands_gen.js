/* ============================================================
   عالمنا الصغير — مولّد الجزر الست (الحساب 2: العالم والتصميم)
   بيقرأ islands_data.js (المعرفات والإحداثيات) وبيبني الهندسة بنفس أدوات المدينة (OSW.city.*):
   ground / roads / buildings / zones / animated / interiors.
   كل جزيرة بتتبني لما تقرّب منها (islands.js) وبتتحرر لما تبعد.
   ============================================================ */
(function () {
  const OSW = window.OSW, D = window.OSW_ISL, C = OSW.city, R = OSW.R, Builder = OSW.Builder, M = OSW.M, PI = Math.PI, hy = Math.hypot, sin = Math.sin, cos = Math.cos;
  const dk = OSW.col.dk, lt = OSW.col.lt;
  const GEN = (OSW.islandsGen = { gens: {}, styles: {}, zones: {} });
  const RY = [0, PI / 2, PI, -PI / 2];
  const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const PAL = {
    ISL_BUSINESS: { sand: "#e3d6ae", ground: "#cfcabd", ground2: "#a9c98b", rock: "#8c8576" },
    ISL_PORT: { sand: "#d8d0b8", ground: "#a7a7a3", ground2: "#8f9494", rock: "#7d7f82" },
    ISL_AGRI: { sand: "#dfd09c", ground: "#8fbf6a", ground2: "#7fb35a", rock: "#8a7a58" },
    ISL_INDUSTRY: { sand: "#cbbf9c", ground: "#9b9b94", ground2: "#7d8a74", rock: "#6f6e68" },
    ISL_LIFE: { sand: "#f0dfae", ground: "#8fcf72", ground2: "#a3dc85", rock: "#8c8576" },
  };

  /* ---------- سياق البناء (نفس شكل سياق المدينة عشان نستعمل C.tower/C.tree/C.lamp/C.door/...) ---------- */
  GEN.newCtx = (id) => ({ id, isl: D.islands[id], B: new Builder(), F: new Builder(), rnd: OSW.seeded(7000 + hash(id)), rects: [], circs: [], acts: [], pois: {}, labels: [], anim: [], walkers: [], meshes: [] });
  const solidRect = (c, s, m = 0.3) => C.rect(c, s.x - s.w / 2 - m, s.z - s.d / 2 - m, s.x + s.w / 2 + m, s.z + s.d / 2 + m);
  // نرسم بإطار محلي: +z = اتجاه الواجهة. W = العرض الموازي للواجهة، Dp = العمق
  const local = (c, s, fn) => { const odd = s.f % 2, W = odd ? s.d : s.w, Dp = odd ? s.w : s.d; c.B.push(s.x, 0, s.z, RY[s.f]); fn(W, Dp); c.B.pop(); };
  const roofGear = (c, W, D2, H) => { const B = c.B, rnd = c.rnd, k = 1 + ((rnd() * 3) | 0); for (let i = 0; i < k; i++) B.box((rnd() - 0.5) * W * 0.5, H + 0.35, (rnd() - 0.5) * D2 * 0.5, 1.8 + rnd() * 1.6, 1 + rnd() * 0.8, 1.6 + rnd(), "#b9bcc2"); if (rnd() < 0.5) B.cyl(W * 0.25, H + 0.35, -D2 * 0.2, 1.2, 1.2, 1.8, "#8aa0b3", 8); };
  const shell = (c, W, Dp, H, o) => {
    const B = c.B, wall = o.wall || "#d9cfc6", base = o.base == null ? 3.2 : o.base, floors = o.floors || Math.max(1, Math.round((H - base) / 3.4)), fh = (H - base) / floors;
    B.box(0, 0, 0, W, H, Dp, wall); if (base) B.box(0, 0, 0, W + 0.5, base, Dp + 0.5, dk(wall, 0.18));
    C.ribbons(c, 0, 0, W, Dp, base, floors, fh, { glass: o.glass || "#6aa3c9", slab: lt(wall, 0.1), seg: o.seg || 8, lit: o.lit });
    B.box(0, H, 0, W + 0.5, 0.35, Dp + 0.5, o.roof || "#8d8a85"); if (!o.flat) roofGear(c, W, Dp, H);
  };
  const doorAt = (c, s, Dp, w) => C.door(c, 0, Dp / 2, 0, w || 3.4, s.doorCol);
  const column = (B, x, z, h, r, col) => { B.cyl(x, 0.3, z, r * 1.15, r * 1.15, 0.3, dk(col, 0.1), 8); B.cyl(x, 0.6, z, r, r * 0.9, h - 1, col, 8); B.box(x, h - 0.4, z, r * 2.6, 0.4, r * 2.6, lt(col, 0.1)); };
  const act = (c, s) => { const a = s.enter ? "is:in:" + s.id : "is:site:" + s.id; C.act(c, a, s.door.x, 1.6, s.door.z, 3.6, s.front.x, s.front.z); return a; };
  const label = (c, s, y) => C.label(c, "isl_" + s.id, `${s.e} ${s.n}`, s.door.x + (s.f % 2 ? 0 : 0), y || Math.min(s.h + 4, 40), s.door.z, { act: s.enter ? "is:in:" + s.id : "is:site:" + s.id, max: 95 });

  /* ===================== الأرض والطرق ===================== */
  GEN.ground = (c) => {
    const I = c.isl, B = c.B, P = PAL[I.id], { x: cx, z: cz } = I.c, r = I.r, seg = r > 200 ? 84 : 60;
    B.cyl(cx, -8, cz, r + 12, r + 1.5, 7.95, P.rock, seg); B.cyl(cx, -0.9, cz, r + 1.5, r + 1.4, 0.85, dk(P.rock, 0.12), seg);
    B.disc(cx, 0.015, cz, r, P.sand, seg); B.disc(cx, 0.045, cz, r - 7, P.ground, seg);
    if (I.id !== "ISL_PORT" && I.id !== "ISL_INDUSTRY") B.disc(cx, 0.055, cz, r - 14, P.ground2, seg);
    // حجارة صخرية على الشاطئ
    const rnd = c.rnd; for (let i = 0; i < Math.floor(r / 5); i++) { const a = rnd() * PI * 2, rr = r - 1 + rnd() * 3; B.sphere(cx + cos(a) * rr, 0.1, cz + sin(a) * rr, 1 + rnd() * 1.6, 0.8 + rnd(), 1 + rnd() * 1.6, dk(P.rock, rnd() * 0.15), 5); }
    // شارات الطرق
    D.roads.filter((rd) => rd.isl === I.id).forEach((rd) => {
      B.strip(rd.pts, rd.w, 0.1, "#3b3f47");
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [x0, z0] = rd.pts[i], [x1, z1] = rd.pts[i + 1], L = hy(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, nx = -uz, nz = ux, n = Math.floor(L / 8);
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n * L; B.box(x0 + ux * t, 0.13, z0 + uz * t, Math.abs(ux) > 0.5 ? 3 : 0.22, 0.02, Math.abs(ux) > 0.5 ? 0.22 : 3, "#e9e4c8"); }
        [-1, 1].forEach((sd) => B.strip([[x0 + nx * sd * (rd.w / 2 - 0.6), z0 + nz * sd * (rd.w / 2 - 0.6)], [x1 + nx * sd * (rd.w / 2 - 0.6), z1 + nz * sd * (rd.w / 2 - 0.6)]], 0.18, 0.12, "#f1f1ec"));
        // أعمدة إنارة وأشجار على الجانبين
        if (I.id !== "ISL_AGRI") for (let t = 10; t < L - 6; t += 26) { const sd = ((t / 26) | 0) % 2 ? 1 : -1, px = x0 + ux * t + nx * sd * (rd.w / 2 + 1.4), pz = z0 + uz * t + nz * sd * (rd.w / 2 + 1.4); if (hy(px - cx, pz - cz) < r - 8) C.lamp(c, px, pz, Math.atan2(-nx * sd, -nz * sd)); }
      }
    });
  };
  // مجسّم دائم للجسور والأرصفة (خفيف): بيتبني مرة وحدة
  GEN.buildBridges = () => {
    const B = new Builder();
    D.bridges.forEach((b) => {
      const len = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2, z = b.z, w = b.w, wood = b.id === "BRG_LIFE";
      B.box(cx, -0.85, z, len, 0.95, w + 1.2, wood ? "#8d6a45" : "#6e6f78"); B.box(cx, 0.1, z, len, 0.04, w, wood ? "#a97c50" : "#3b3f47");
      if (wood) for (let x = b.x0 + 1; x < b.x1; x += 1.6) B.box(x, 0.13, z, 0.1, 0.02, w, "#8d6a45"); else { for (let x = b.x0 + 4; x < b.x1; x += 8) B.box(x, 0.13, z, 3, 0.02, 0.22, "#e9e4c8"); [-1, 1].forEach((sd) => B.box(cx, 0.13, z + sd * (w / 2 - 0.6), len, 0.02, 0.18, "#f1f1ec")); }
      [-1, 1].forEach((sd) => { B.box(cx, 0.95, z + sd * (w / 2 + 0.5), len, 0.12, 0.12, "#c9ccd2"); for (let x = b.x0 + 2; x < b.x1; x += 7) B.box(x, 0.1, z + sd * (w / 2 + 0.5), 0.16, 0.9, 0.16, "#9aa0a8"); });
      for (let x = b.x0 + 10; x < b.x1 - 6; x += 14) { B.cyl(x, -9, z, 1.1, 0.9, 8.3, "#8a8a92", 8); B.box(x, -1.1, z, 1.6, 0.4, w + 0.8, "#7b7b84"); }
      for (let x = b.x0 + 18, i = 0; x < b.x1 - 8; x += 36, i++) { const sd = i % 2 ? 1 : -1; B.cyl(x, 0.1, z + sd * (w / 2 + 0.5), 0.1, 0.08, 4.4, "#4a3d38", 6); B.box(x, 4.4, z + sd * (w / 2 - 0.3), 0.12, 0.1, 1.6, "#4a3d38"); B.sphere(x, 4.45, z + sd * (w / 2 - 1), 0.28, 0.2, 0.28, "#ffe9a8", 5, 1); }
      // قوس اسم الجزيرة عند طرف الجسر
      const I = D.islands[b.isl], gx = b.dir < 0 ? b.x0 + 14 : b.x1 - 14;
      [-1, 1].forEach((sd) => { B.box(gx, 0.1, z + sd * (w / 2 + 1.4), 1, 7, 1, "#b6b2aa"); B.box(gx, 7.1, z + sd * (w / 2 + 1.4), 1.4, 0.4, 1.4, "#8d8478"); });
      B.box(gx, 7.3, z, 1.2, 1.8, w + 3.8, "#2b3a55"); B.box(gx + (b.dir < 0 ? -0.7 : 0.7), 7.35, z, 0.1, 1.5, w + 2.6, "#ffd98a", 0.8);
      b.gate = { x: gx, y: 10.6, z, text: `${I.e} ${I.n}` };
    });
    GEN.bridgeMesh = B.build(R.gl); return GEN.bridgeMesh;
  };
  // أرصفة الميناء (ممرات خشبية/خرسانية فوق البحر)
  GEN.piers = (c) => {
    const I = c.isl, B = c.B; (I.ext || []).forEach((e) => {
      const x0 = I.c.x + e.x0, x1 = I.c.x + e.x1, z0 = I.c.z + e.v0, z1 = I.c.z + e.v1, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      B.box(cx, -1.2, cz, x1 - x0, 1.35, z1 - z0, "#8e9097"); B.box(cx, 0.1, cz, x1 - x0, 0.04, z1 - z0, "#a9acb2");
      for (let x = x0 + 6; x < x1 - 8; x += 12) B.box(x, 0.12, cz, 0.3, 0.02, z1 - z0 - 1, "#e9e4c8", 0);
      [z0 + 0.4, z1 - 0.4].forEach((z) => { B.box(cx, 0.1, z, x1 - x0, 0.5, 0.5, "#e6b422"); for (let x = x0 + 4; x < x1 - 2; x += 10) { B.cyl(x, 0.1, z - (z < cz ? 0.9 : -0.9), 0.35, 0.3, 0.5, "#2b2b30", 6); } });
      for (let x = x0 + 8; x < x1 - 6; x += 14) { B.cyl(x, -9, z0 + 1.2, 0.6, 0.6, 8, "#6e6f78", 6); B.cyl(x, -9, z1 - 1.2, 0.6, 0.6, 8, "#6e6f78", 6); }
    });
  };

  /* ===================== أنماط المباني ===================== */
  const S = GEN.styles;
  // — أعمال —
  S.stepped = (c, s) => { local(c, s, (W, Dp) => { const B = c.B, H = s.h, tiers = [[W, Dp, H * 0.5, 0], [W * 0.78, Dp * 0.78, H * 0.28, H * 0.5], [W * 0.5, Dp * 0.5, H * 0.22, H * 0.78]];
    tiers.forEach(([w, d, hh, y0], i) => { const n = Math.max(1, Math.round(hh / 3.6)); B.box(0, y0, 0, w, hh, d, s.wall); C.ribbons(c, 0, 0, w, d, y0 + (i ? 0.3 : 3), i ? n : Math.max(1, n - 1), (hh - (i ? 0.3 : 3)) / (i ? n : Math.max(1, n - 1)), { glass: s.glass, slab: lt(s.wall, 0.1), seg: 7, lit: 0.4 }); B.box(0, y0 + hh, 0, w + 0.5, 0.35, d + 0.5, "#8d8a85"); });
    B.box(0, 0, 0, W + 0.6, 3, Dp + 0.6, dk(s.wall, 0.18)); B.cyl(0, H, 0, 0.2, 0.1, 12, "#9aa0a8", 5); B.sphere(0, H + 12, 0, 0.35, 0.35, 0.35, "#ff3b3b", 5, 1);
    B.box(0, 0.1, Dp / 2 + 5, 14, 0.3, 8, "#bdb7a8"); B.box(0, 3.6, Dp / 2 + 5, 14, 0.3, 8, "#e6e0d6"); [-6, 6].forEach((x) => B.cyl(x, 0.1, Dp / 2 + 8.5, 0.35, 0.35, 3.5, "#cfc7b8", 8)); doorAt(c, s, Dp, 5); }); solidRect(c, s); };
  S.glass = (c, s) => { local(c, s, (W, Dp) => { const B = c.B; shell(c, W, Dp, s.h, { wall: s.wall, glass: s.glass, seg: 6, lit: 0.45, base: 4 }); B.box(0, s.h + 0.35, 0, W * 0.6, 4, Dp * 0.6, dk(s.wall, 0.2)); B.cyl(0, s.h + 4.3, 0, 0.3, 0.1, 14, "#9aa0a8", 5); B.sphere(0, s.h + 18.3, 0, 0.4, 0.4, 0.4, "#ff3b3b", 5, 1); B.box(0, s.h - 1.5, 0, W + 0.9, 0.5, Dp + 0.9, "#ffd98a", 0.7); doorAt(c, s, Dp, 4.4); }); solidRect(c, s); };
  S.round = (c, s) => { const B = c.B, r = s.w / 2, n = Math.max(3, Math.round((s.h - 3) / 3.4)), fh = (s.h - 3) / n; B.cyl(s.x, 0, s.z, r + 0.6, r + 0.6, 3, dk(s.wall, 0.18), 18); B.cyl(s.x, 3, s.z, r, r, s.h - 3, s.wall, 18);
    for (let i = 0; i < n; i++) { B.cyl(s.x, 3 + i * fh + fh * 0.22, s.z, r + 0.07, r + 0.07, fh * 0.55, s.glass, 18, c.rnd() < 0.3 ? 0.5 : 0); B.cyl(s.x, 3 + (i + 1) * fh - 0.2, s.z, r + 0.25, r + 0.25, 0.3, lt(s.wall, 0.15), 18); }
    B.cyl(s.x, s.h, s.z, r + 0.4, r + 0.4, 0.4, "#8d8a85", 18); B.sphere(s.x, s.h + 0.3, s.z, r * 0.8, 3, r * 0.8, "#8fb8d4", 12, 0.2, true); B.cyl(s.x, s.h + 3, s.z, 0.15, 0.08, 9, "#9aa0a8", 5);
    C.circ(c, s.x, s.z, r + 1); local(c, s, (W, Dp) => doorAt(c, s, s.d, 3.6)); };
  S.twin = (c, s) => { const sp = s.w * 0.3; [-1, 1].forEach((sd, i) => { const x = s.x + sd * s.w * 0.27, w = s.w * 0.42, hh = s.h * (i ? 1 : 0.88); c.B.box(x, 0, s.z, w, hh, s.d, s.wall); C.ribbons(c, x, s.z, w, s.d, 3, Math.round((hh - 3) / 3.4), (hh - 3) / Math.round((hh - 3) / 3.4), { glass: s.glass, slab: lt(s.wall, 0.1), seg: 6, lit: 0.4 }); c.B.box(x, hh, s.z, w + 0.4, 0.4, s.d + 0.4, "#8d8a85"); c.B.cyl(x, hh, s.z, 0.12, 0.08, 7, "#9aa0a8", 5); });
    c.B.box(s.x, s.h * 0.62, s.z, s.w * 0.34, 3.2, s.d * 0.5, lt(s.wall, 0.12)); c.B.box(s.x, s.h * 0.62 + 1.1, s.z, s.w * 0.34 + 0.1, 1.2, s.d * 0.5 + 0.1, s.glass); c.B.box(s.x, 0, s.z, s.w + 0.6, 3, s.d + 0.6, dk(s.wall, 0.18)); solidRect(c, s); local(c, s, (W, Dp) => doorAt(c, s, Dp, 4)); };
  S.slab = (c, s) => { local(c, s, (W, Dp) => { shell(c, W, Dp, s.h, { wall: s.wall, glass: s.glass, seg: 8, lit: 0.3 }); c.B.box(0, s.h * 0.45, Dp / 2 + 0.06, W * 0.7, 0.5, 0.1, s.glass === "#6aa3c9" ? "#e63946" : "#2a9d8f", 0.5); doorAt(c, s, Dp); }); solidRect(c, s); };
  S.classic = (c, s) => { local(c, s, (W, Dp) => { const B = c.B, H = s.h; B.box(0, 0, 0, W, H, Dp, s.wall); B.box(0, 0, 0, W + 1, 1.2, Dp + 1, dk(s.wall, 0.12)); B.box(0, H, 0, W + 1, 0.8, Dp + 1, lt(s.wall, 0.08));
    const n = Math.max(4, Math.floor(W / 4)); for (let i = 0; i < n; i++) column(B, -W / 2 + 2 + i * ((W - 4) / (n - 1)), Dp / 2 + 2.2, H - 1.2, 0.7, "#f4efe6"); B.box(0, 0.1, Dp / 2 + 2.2, W - 1, 0.4, 4.2, "#d9d2c3"); B.box(0, H - 1.0, Dp / 2 + 2.2, W - 0.5, 0.9, 4.6, lt(s.wall, 0.15)); B.prism(0, H - 0.1, Dp / 2 + 2.2, W - 0.4, 3.2, 4.6, lt(s.wall, 0.2)); B.sphere(0, H + 0.7, 0, W * 0.2, 4.2, Dp * 0.2, "#9fb8c6", 12, 0.1, true);
    [-1, 1].forEach((sd) => { for (let k = 0; k < Math.floor((Dp - 4) / 5); k++) B.box(sd * (W / 2 + 0.03), 2.2, -Dp / 2 + 4 + k * 5, 0.08, H - 5, 2, "#9fd4f0", 0.2); }); C.door(c, 0, Dp / 2, 0, 4); }); solidRect(c, s); };
  S.hall = (c, s) => { local(c, s, (W, Dp) => { const B = c.B, H = s.h; B.box(0, 0, 0, W, H * 0.78, Dp, s.wall); B.sphere(0, H * 0.78, 0, W * 0.5, H * 0.35, Dp * 0.5, lt(s.wall, 0.1), 14, 0, true); for (let i = 0; i < 6; i++) B.box(-W * 0.4 + i * W * 0.16, 2, Dp / 2 + 0.05, W * 0.1, H * 0.5, 0.1, "#9fd4f0", 0.3); B.box(0, 0.05, Dp / 2 + 2, W * 0.9, 0.3, 4, "#cfc7b8"); B.box(0, H * 0.7, Dp / 2 + 2, W * 0.7, 0.4, 4, "#8d8478"); [-1, 1].forEach((sd) => B.cyl(sd * W * 0.32, 0.3, Dp / 2 + 3.6, 0.3, 0.3, H * 0.7, "#cfc7b8", 6)); doorAt(c, s, Dp, 6); }); solidRect(c, s); };
  S.lighthouse = (c, s) => { const B = c.B; B.cyl(s.x, 0, s.z, 3.8, 3.6, 2, "#8d8478", 10); B.cyl(s.x, 2, s.z, 3.2, 1.9, 22, "#f4f1e8", 12); for (let i = 0; i < 3; i++) B.cyl(s.x, 4 + i * 6.4, s.z, 2.9 - i * 0.45, 2.6 - i * 0.45, 2.6, "#d62839", 12); B.cyl(s.x, 24, s.z, 2.4, 2.4, 0.5, "#2b2b30", 12); B.cyl(s.x, 24.5, s.z, 1.5, 1.5, 2.6, "#ffe9a8", 10, 1); B.cyl(s.x, 27.1, s.z, 2.2, 0.2, 2.2, "#c0392b", 10); C.circ(c, s.x, s.z, 4); };
  // — ميناء —
  S.shed = (c, s) => { local(c, s, (W, Dp) => { const B = c.B, H = s.h; B.box(0, 0, 0, W, H, Dp, s.wall); B.box(0, 0, 0, W + 0.4, 1.2, Dp + 0.4, dk(s.wall, 0.2)); for (let x = -W / 2 + 1.5; x < W / 2; x += 2.4) B.box(x, H * 0.55, 0, 0.18, H * 0.45, Dp + 0.2, dk(s.wall, 0.1));
    B.prism(0, H, 0, W + 0.8, 3.6, Dp + 0.8, s.roof || "#4a6076"); const nd = Math.max(2, Math.floor(W / 14)); for (let i = 0; i < nd; i++) { const x = -W / 2 + (i + 0.5) * (W / nd); B.box(x, 0.3, Dp / 2 + 0.06, 6.2, 5.2, 0.12, "#d6d9dd"); for (let k = 0; k < 6; k++) B.box(x, 0.6 + k * 0.8, Dp / 2 + 0.14, 6.0, 0.08, 0.04, "#9aa0a8"); B.box(x, 0.0, Dp / 2 + 1.6, 7.4, 1.0, 3.2, "#8f9494"); B.box(x, 5.8, Dp / 2 + 0.1, 6.6, 0.5, 0.3, "#e6b422"); }
    B.box(W / 2 - 3, 2, -Dp / 2 - 0.1, 2.5, 3.2, 0.2, "#556"); if (s.kind === "warehouse") { B.box(0, H * 0.6, Dp / 2 + 0.1, W * 0.5, 1.6, 0.12, "#e6e0d6"); } }); solidRect(c, s);
    const ch = c.cars; (s.pts || []).forEach(() => {}); };
  S.tower = (c, s) => { local(c, s, (W, Dp) => { shell(c, W, Dp, s.h, { wall: s.wall, glass: s.glass, seg: 7, lit: 0.4 }); const B = c.B; B.cyl(W * 0.2, s.h + 0.35, 0, 1.6, 1.6, 6, "#e6e8ea", 10); B.cyl(W * 0.2, s.h + 6.35, 0, 2.2, 0.2, 1.6, "#d62839", 10); B.box(0, s.h - 2, 0, W + 0.8, 0.5, Dp + 0.8, "#ffd98a", 0.6); doorAt(c, s, Dp, 4.4); }); solidRect(c, s); };

  GEN.drawSite = (c, s) => { const fn = S[s.style]; if (!fn) return; s.doorCol = s.doorCol || "#6b4a3a"; fn(c, s); if (!["round", "twin", "lighthouse"].includes(s.style) || s.style === "round" || s.style === "twin") { } if (s.kind !== "zone" && s.style !== "lighthouse" && s.style !== "watertower" && s.style !== "silos" && s.style !== "windmill" && s.style !== "glasshouse") { act(c, s); label(c, s); } else { act(c, s); label(c, s, s.h + 3); } };
  GEN.helpers = { local, shell, solidRect, column, roofGear, doorAt, hash, PAL, RY };
})();
