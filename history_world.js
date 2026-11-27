/* ============================================================
   عالمنا الصغير V14 — القارة التاريخية الشمالية والعالم ثلاثي الأبعاد
   مدينة دار السلام، القلعة الجبلية، القرية الزراعية والناعورة، الميناء القديم،
   الواحة والخان، القوافل المتحركة، المعالم التعاونية، ومواقع التنقيب المنفصلة حسب العصر.
   ============================================================ */
(function () {
  const OSW = window.OSW, PI = Math.PI, hy = Math.hypot;
  const H = (OSW.HIST = OSW.history = OSW.history || {});
  const Builder = OSW.Builder, M = OSW.M, R = OSW.R, dk = OSW.col.dk, lt = OSW.col.lt;
  const W = () => OSW.world, G = () => OSW.game;
  const m1 = new Float32Array(16), m2 = new Float32Array(16);

  /* ---------- 1. الجغرافيا وحدود الملاحة الشمالية (بدون تداخل مع القرية أو المدينة الكبرى) ---------- */
  const ZONES = (H.ZONES = {
    bridge: { id: "bridge", n: "جسر دار السلام الحجري", e: "🌉", ax: 0, az: -158, box: { x0: -7, x1: 7, z0: -182, z1: -58 } },
    city: { id: "city", n: "مدينة دار السلام التاريخية", e: "🕌", ax: 0, az: -196, box: { x0: -148, x1: 148, z0: -388, z1: -178 } },
    farm: { id: "farm", n: "القرية الزراعية والناعورة", e: "🌾", ax: -214, az: -196, box: { x0: -315, x1: -145, z0: -292, z1: -125 } },
    port: { id: "port", n: "الميناء التجاري القديم", e: "⛵", ax: -312, az: -326, box: { x0: -445, x1: -245, z0: -420, z1: -262 } },
    citadel: { id: "citadel", n: "القلعة العسكرية والجبل", e: "🏰", ax: 245, az: -282, box: { x0: 145, x1: 425, z0: -415, z1: -185 } },
    oasis: { id: "oasis", n: "الواحة وخان القوافل", e: "🐪", ax: -62, az: -486, box: { x0: -165, x1: 15, z0: -600, z1: -382 } },
    ruins_anc: { id: "ruins_anc", n: "آثار العصر القديم والمقابر", e: "🏺", ax: 122, az: -498, box: { x0: 15, x1: 230, z0: -610, z1: -385 } },
    ruins_cls: { id: "ruins_cls", n: "الآثار الكلاسيكية الغربية", e: "🏛️", ax: -245, az: -522, box: { x0: -355, x1: -155, z0: -620, z1: -415 } }
  });

  H.inNorth = (x, z) => z < -61.5 && z >= -645 && x >= -460 && x <= 440;
  H.zoneOf = (x, z) => {
    if (!H.inNorth(x, z)) return null;
    for (const k of Object.keys(ZONES)) {
      const b = ZONES[k].box;
      if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) return k;
    }
    if (z <= -375 && z >= -625 && x >= -360 && x <= 235) return "oasis";
    return "north";
  };

  // تصادمات المباني الشمالية الصلبة (مستطيلات ودوائر)
  H.RECTS = [];
  H.CIRCS = [];
  H.collide = (o, r = 0.45) => {
    let hit = false;
    for (let i = 0; i < H.RECTS.length; i++) {
      const b = H.RECTS[i], nx = Math.max(b.x0, Math.min(o.x, b.x1)), nz = Math.max(b.z0, Math.min(o.z, b.z1));
      const dx = o.x - nx, dz = o.z - nz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-6) { const d = Math.sqrt(d2); o.x = nx + (dx / d) * r; o.z = nz + (dz / d) * r; }
        else {
          const dl = Math.abs(o.x - b.x0), dr = Math.abs(b.x1 - o.x), dt = Math.abs(o.z - b.z0), db = Math.abs(b.z1 - o.z);
          const mn = Math.min(dl, dr, dt, db);
          if (mn === dl) o.x = b.x0 - r; else if (mn === dr) o.x = b.x1 + r; else if (mn === dt) o.z = b.z0 - r; else o.z = b.z1 + r;
        }
        hit = true;
      }
    }
    for (let i = 0; i < H.CIRCS.length; i++) {
      const k = H.CIRCS[i], dx = o.x - k.x, dz = o.z - k.z, rr = k.r + r;
      if (dx * dx + dz * dz < rr * rr) {
        const d = hy(dx, dz) || 0.001;
        o.x = k.x + (dx / d) * rr; o.z = k.z + (dz / d) * rr;
        hit = true;
      }
    }
    return hit;
  };
  H.blocked = (x, z) => {
    if (!H.inNorth(x, z)) return false;
    // منع الدخول في حوض الميناء الغربي أو بركة الواحة أو القناة المائية
    if (x < -338 && z < -280 && z > -400) return true;
    if (hy(x + 95, z + 528) < 13) return true;
    return false;
  };

  /* ---------- 2. تغليف الملاحة والسيارات في vehicles.js بدون كسر القرية أو المدينة الكبرى ---------- */
  function hookNavigation() {
    if (!OSW.veh || OSW.veh._histHook) return;
    const V = OSW.veh;
    V._histHook = true;
    const _con = V.constrain, _ped = V.pedOk, _car = V.carOk;
    V.pedOk = (x, z) => (H.inNorth(x, z) ? !H.blocked(x, z) : _ped(x, z));
    V.carOk = (x, z) => {
      if (H.inNorth(x, z)) return !H.blocked(x, z);
      // نسمح بدخول مدخل الجسر الشمالي بين x=-5..5 عند z=-62
      if (Math.abs(x) <= 5.5 && z <= -54 && z >= -64) return true;
      return _car(x, z);
    };
    V.constrain = (o) => {
      if (H.inNorth(o.x, o.z)) {
        let hit = H.collide(o, 0.48);
        const cx = Math.max(-445, Math.min(425, o.x)), cz = Math.max(-625, Math.min(-61.5, o.z));
        if (cx !== o.x || cz !== o.z) { o.x = cx; o.z = cz; hit = true; }
        // عند الجسر (z بين -178 و -62): ممر الجسر بعرض 12م إن لم يكن داخل القرية الزراعية
        if (o.z > -176 && o.z < -62 && o.x > -145 && o.x < 145) {
          if (Math.abs(o.x) > 5.4) { o.x = Math.sign(o.x) * 5.4; hit = true; }
        }
        return hit;
      }
      // إن كان اللاعب عند مدخل الجسر الشمالي في القرية (|x| <= 5.4, z <= -60) نسمح بالعبور شمالاً بدون إرجاعه!
      if (Math.abs(o.x) <= 5.4 && o.z <= -60 && o.z >= -63) return false;
      return _con(o);
    };
  }
  hookNavigation();

  /* ---------- 3. دوال البناء المعمارية والتاريخية ---------- */
  const solidRect = (cx, cz, w, d) => H.RECTS.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
  const solidCirc = (x, z, r) => H.CIRCS.push({ x, z, r });

  function addPalm(B, Bf, x, z, h = 6.2, s = 1) {
    B.cyl(x, 0, z, 0.42 * s, 0.24 * s, h * s, "#7c5234", 7);
    const ty = h * s;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      Bf.push(x + Math.cos(a) * 0.4 * s, ty, z + Math.sin(a) * 0.4 * s, a, 0.45, 0);
      Bf.box(0, 0, 1.45 * s, 0.72 * s, 0.14 * s, 2.9 * s, i % 2 ? "#2f7d44" : "#3b924e");
      Bf.pop();
    }
    solidCirc(x, z, 0.55 * s);
  }

  function addOliveTree(B, Bf, x, z, s = 1) {
    B.cyl(x, 0, z, 0.38 * s, 0.26 * s, 2.4 * s, "#664935", 7);
    Bf.sphere(x, 3.1 * s, z, 1.9 * s, 1.3 * s, 1.9 * s, "#6a8a52", 7);
    Bf.sphere(x + 0.6 * s, 3.4 * s, z - 0.5 * s, 1.3 * s, 1.0 * s, 1.3 * s, "#7b9c60", 6);
    solidCirc(x, z, 0.6 * s);
  }

  function addLamp(B, x, z, h = 4.2, col = "#c98b32") {
    B.cyl(x, 0, z, 0.16, 0.1, h, "#4b382a", 6);
    B.box(x, h, z, 0.5, 0.14, 0.5, "#3a2c20");
    B.sphere(x, h + 0.35, z, 0.28, 0.35, 0.28, col, 6, 0.9);
  }

  function addArchedWall(B, cx, cz, len, dir, gateW = 0) {
    // dir: 'x' يمتد أفقياً، 'z' يمتد عمودياً
    const h = 7.4, t = 2.6, stone = "#d9c29c", trim = "#b89668";
    const seg = (p0, p1) => {
      const l = Math.abs(p1 - p0); if (l < 0.5) return;
      const mid = (p0 + p1) / 2;
      if (dir === "x") {
        B.box(mid, 0, cz, l, h, t, stone);
        B.box(mid, h, cz, l + 0.2, 0.35, t + 0.25, trim);
        for (let k = p0 + 1.5; k <= p1 - 1.5; k += 4) B.box(k, h + 0.35, cz, 1.6, 0.9, t + 0.1, trim);
        solidRect(mid, cz, l, t);
      } else {
        B.box(cx, 0, mid, t, h, l, stone);
        B.box(cx, h, mid, t + 0.25, 0.35, l + 0.2, trim);
        for (let k = p0 + 1.5; k <= p1 - 1.5; k += 4) B.box(cx, h + 0.35, k, t + 0.1, 0.9, 1.6, trim);
        solidRect(cx, mid, t, l);
      }
    };
    const half = len / 2, base = dir === "x" ? cx : cz;
    if (!gateW) { seg(base - half, base + half); return; }
    const gh = gateW / 2;
    seg(base - half, base - gh);
    seg(base + gh, base + half);
    // بوابة أثرية مقوسة + برجين جانبيين
    const gt = t + 1.4;
    [-1, 1].forEach((s) => {
      const gx = dir === "x" ? cx + s * (gh + 1.5) : cx;
      const gz = dir === "x" ? cz : cz + s * (gh + 1.5);
      B.box(gx, 0, gz, 3.6, 10.6, 3.6, "#cdb084");
      B.box(gx, 10.6, gz, 4.0, 0.6, 4.0, trim);
      B.sphere(gx, 11.2, gz, 1.6, 1.3, 1.6, "#1d8a7e", 8, 0, true);
      B.cyl(gx, 12.5, gz, 0.1, 0.06, 0.9, "#e6b94a", 5);
      solidRect(gx, gz, 3.6, 3.6);
    });
    if (dir === "x") {
      B.box(cx, 6.2, cz, gateW + 1.2, 2.8, gt, "#c9aa7c");
      B.box(cx, 9.0, cz, gateW + 1.8, 0.5, gt + 0.4, "#168077");
      B.box(cx, 6.8, cz + gt / 2 + 0.05, 5.2, 1.3, 0.12, "#f4e1b0", 0.35);
    } else {
      B.box(cx, 6.2, cz, gt, 2.8, gateW + 1.2, "#c9aa7c");
      B.box(cx, 9.0, cz, gt + 0.4, 0.5, gateW + 1.8, "#168077");
      B.box(cx + gt / 2 + 0.05, 6.8, cz, 0.12, 1.3, 5.2, "#f4e1b0", 0.35);
    }
  }

  function addArabHouse(B, x, z, w, d, col = "#ead8b6", accent = "#1d8a7e") {
    const h = 4.6;
    B.box(x, 0, z, w, h, d, col);
    B.box(x, h, z, w + 0.4, 0.5, d + 0.4, dk(col, 0.14));
    // مشربية خشبية بارزة على الواجهة
    B.box(x, 2.2, z + d / 2 + 0.35, w * 0.42, 1.7, 0.75, "#6b472b");
    B.box(x, 2.45, z + d / 2 + 0.74, w * 0.36, 1.2, 0.06, "#9c6b42");
    // باب مقوس
    B.box(x, 0, z + d / 2 + 0.06, 2.2, 2.5, 0.14, "#5a3922");
    B.box(x, 2.4, z + d / 2 + 0.08, 2.5, 0.3, 0.18, accent);
    solidRect(x, z, w, d);
  }

  function addTentStall(B, x, z, col, wood = "#6e472a") {
    [-1.8, 1.8].forEach((dx) => [-1.4, 1.4].forEach((dz) => B.cyl(x + dx, 0, z + dz, 0.1, 0.1, 2.9, wood, 6)));
    B.box(x, 2.9, z, 4.2, 0.22, 3.4, col);
    B.box(x, 3.12, z, 3.4, 0.25, 2.6, lt(col, 0.15));
    B.box(x, 0, z + 0.9, 3.4, 0.9, 0.85, "#8d633d");
    solidRect(x, z, 3.9, 3.0);
  }

  /* ---------- 4. بناء مجسمات القارة الشمالية والدواب والآثار المتحركة ---------- */
  let meshes = {
    noria: null,
    dhow: null,
    caravan: null,
    camelMount: null,
    carriageMount: null,
    monuments: {},
    artMini: {},
    digMound: null,
    digGlint: null
  };

  function buildDynamicMeshes() {
    if (meshes.noria) return;
    // 1) عجلة الناعورة المائية الدوارة
    {
      const b = new Builder();
      b.cyl(0, -0.5, 0, 0.35, 0.35, 1.0, "#4b301c", 8);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        b.push(0, 0, 0, 0, 0, a);
        b.box(0, 2.0, 0, 0.22, 4.0, 0.22, "#6e472a");
        b.box(0, 3.95, 0, 1.9, 0.28, 0.85, "#5a3922");
        b.box(0, 4.18, 0, 0.55, 0.45, 0.72, "#a36c3e");
        b.pop();
      }
      meshes.noria = b.build(R.gl);
    }
    // 2) سفينة الداو الشراعية التاريخية في الميناء
    {
      const b = new Builder();
      b.box(0, 0.2, 0, 3.6, 1.3, 10.6, "#6a4227");
      b.box(0, 1.5, 0, 3.9, 0.25, 11.2, "#8c5934");
      b.prism(0, 0.4, 6.2, 3.4, 1.5, 2.8, "#6a4227");
      b.box(0, 1.7, -3.5, 3.4, 1.2, 3.0, "#7c4e2d");
      b.cyl(0, 1.6, 0.6, 0.18, 0.12, 8.2, "#4a2e1b", 8);
      b.push(0, 6.0, 0.6, 0.1, 0, 0.25);
      b.box(0, 0, 0, 0.14, 0.14, 7.6, "#5a3922");
      b.box(0, -1.9, 0, 0.08, 3.8, 6.2, "#f4ecd8");
      b.pop();
      b.box(0, 1.85, 1.6, 1.5, 0.9, 1.5, "#b68036");
      b.box(-0.9, 1.85, -0.4, 1.1, 0.8, 1.2, "#c95a3c");
      meshes.dhow = b.build(R.gl);
    }
    // 3) قافلة الجمال الثلاثية المتحركة على طريق القوافل
    {
      const b = new Builder();
      const addCamel = (oz, s = 1) => {
        b.push(0, 0, oz);
        [[-0.35, 0.65], [0.35, 0.65], [-0.35, -0.65], [0.35, -0.65]].forEach(([x, z]) => b.cyl(x * s, 0, z * s, 0.12 * s, 0.09 * s, 1.15 * s, "#c79a5b", 6));
        b.box(0, 1.15 * s, 0, 0.85 * s, 0.72 * s, 1.85 * s, "#d4a96a");
        b.sphere(0, 2.02 * s, 0, 0.42 * s, 0.48 * s, 0.55 * s, "#c79a5b", 6);
        b.box(0, 1.55 * s, 0, 1.25 * s, 0.45 * s, 0.9 * s, "#9c382c"); // خرج وبضائع ملونة
        b.push(0, 1.4 * s, 1.15 * s, 0, -0.45);
        b.cyl(0, 0, 0, 0.16 * s, 0.13 * s, 0.95 * s, "#d4a96a", 6);
        b.pop();
        b.box(0, 2.25 * s, 1.55 * s, 0.36 * s, 0.32 * s, 0.58 * s, "#d4a96a");
        b.pop();
      };
      addCamel(3.6, 1.0);
      addCamel(0, 0.95);
      addCamel(-3.5, 0.92);
      meshes.caravan = b.build(R.gl);
    }
    // 4) جمل القوافل الشخصي للركوب
    {
      const b = new Builder();
      [[-0.42, 0.58], [0.42, 0.58], [-0.42, -0.62], [0.42, -0.62]].forEach(([x, z]) => b.cyl(x, 0, z, 0.12, 0.09, 0.78, "#c79a5b", 6));
      b.box(0, 0.68, 0, 0.92, 0.58, 1.75, "#d8ad6e");
      b.box(0, 1.24, -0.1, 0.96, 0.22, 0.95, "#a83226"); // سرج قرمزي ومذهب
      b.box(0, 1.28, -0.1, 0.72, 0.1, 0.75, "#e6b94a");
      b.push(0, 1.02, 0.98, 0, -0.4);
      b.cyl(0, 0, 0, 0.16, 0.13, 0.9, "#d8ad6e", 6);
      b.pop();
      b.box(0, 1.75, 1.38, 0.36, 0.3, 0.56, "#d8ad6e");
      b.box(0, 1.78, 1.42, 0.4, 0.12, 0.2, "#9c382c");
      meshes.camelMount = b.build(R.gl);
    }
    // 5) عربة الخيول الملكية للركوب (عربة مكشوفة يجرها جواد في المقدمة)
    {
      const b = new Builder();
      // جسم العربة الملكية حول اللاعب
      b.box(0, 0.22, -0.2, 1.7, 0.14, 1.85, "#5a341b");
      [-0.82, 0.82].forEach((x) => b.box(x, 0.36, -0.2, 0.14, 0.72, 1.8, "#7d4925"));
      b.box(0, 0.36, -1.06, 1.7, 0.78, 0.14, "#7d4925");
      b.box(0, 1.1, -0.2, 1.8, 0.08, 1.9, "#e6b94a");
      [-0.95, 0.95].forEach((x) => {
        b.push(x, 0.46, -0.2, 0, 0, PI / 2);
        b.cyl(0, -0.06, 0, 0.46, 0.46, 0.12, "#4a2c18", 12);
        b.cyl(0, -0.07, 0, 0.22, 0.22, 0.14, "#e6b94a", 8);
        b.pop();
      });
      // أذرع الجر والحصان في المقدمة
      [-0.45, 0.45].forEach((x) => b.box(x, 0.52, 1.35, 0.07, 0.07, 1.6, "#5a341b"));
      [[-0.25, 2.25], [0.25, 2.25], [-0.25, 1.45], [0.25, 1.45]].forEach(([x, z]) => b.cyl(x, 0, z, 0.09, 0.07, 0.86, "#593824", 6));
      b.box(0, 0.78, 1.85, 0.68, 0.56, 1.25, "#6b432b");
      b.push(0, 1.15, 2.45, 0, -0.35);
      b.cyl(0, 0, 0, 0.15, 0.11, 0.72, "#6b432b", 6);
      b.pop();
      b.box(0, 1.72, 2.75, 0.28, 0.26, 0.52, "#593824");
      b.box(0, 1.45, 2.38, 0.12, 0.42, 0.18, "#221814"); // عرف الجواد
      meshes.carriageMount = b.build(R.gl);
    }
    // 6) مجسمات مصغرة ثلاثية الأبعاد للآثار داخل المتحف
    const buildMini = (fn) => { const b = new Builder(); fn(b); return b.build(R.gl); };
    meshes.artMini.tablet = buildMini((b) => { b.box(0, 0.04, 0, 0.65, 0.78, 0.14, "#c9a06a"); b.box(0, 0.45, 0.08, 0.46, 0.1, 0.03, "#7a5328"); b.box(0, 0.26, 0.08, 0.46, 0.08, 0.03, "#7a5328"); });
    meshes.artMini.coin = buildMini((b) => { b.push(0, 0.42, 0, 0, PI / 2); b.cyl(0, -0.06, 0, 0.34, 0.34, 0.12, "#e6b94a", 12, 0.3); b.pop(); });
    meshes.artMini.obelisk = buildMini((b) => { b.cyl(0, 0, 0, 0.24, 0.12, 0.85, "#b89054", 4); b.prism(0, 0.85, 0, 0.2, 0.25, 0.2, "#ffd24d", 0.4); });
    meshes.artMini.crown = buildMini((b) => { b.cyl(0, 0.1, 0, 0.34, 0.38, 0.36, "#f2c144", 10, 0.35); b.sphere(0, 0.34, 0.34, 0.08, 0.1, 0.06, "#1f7ad1", 6, 0.6); });
    meshes.artMini.scroll = buildMini((b) => { b.push(0, 0.34, 0, 0.4, 0, 0.3); b.cyl(0, 0, 0, 0.12, 0.12, 0.7, "#edd8ac", 10); b.cyl(0, -0.02, 0, 0.06, 0.06, 0.82, "#8c5934", 6); b.pop(); });
    meshes.artMini.amphora = buildMini((b) => { b.cyl(0, 0.02, 0, 0.1, 0.28, 0.38, "#c26c47", 10); b.cyl(0, 0.4, 0, 0.28, 0.1, 0.34, "#c26c47", 10); b.cyl(0, 0.74, 0, 0.16, 0.16, 0.08, "#e6b94a", 10); });
    meshes.artMini.mosaic = buildMini((b) => { b.box(0, 0.04, 0, 0.75, 0.65, 0.1, "#e8dec8"); b.box(0, 0.36, 0.06, 0.55, 0.45, 0.04, "#1d8a7e", 0.25); b.box(0, 0.36, 0.09, 0.26, 0.26, 0.03, "#e6b94a", 0.4); });
    meshes.artMini.bust = buildMini((b) => { b.box(0, 0, 0, 0.4, 0.2, 0.3, "#6b5a4e"); b.cyl(0, 0.2, 0, 0.22, 0.18, 0.34, "#c99055", 8); b.sphere(0, 0.68, 0, 0.2, 0.24, 0.2, "#c99055", 8); });
    meshes.artMini.astrolabe = buildMini((b) => { b.push(0, 0.45, 0, 0, PI / 2); b.cyl(0, -0.05, 0, 0.36, 0.36, 0.1, "#d9a238", 12, 0.25); b.pop(); b.sphere(0, 0.45, 0, 0.22, 0.22, 0.22, "#1f7ad1", 6, 0.2); });
    meshes.artMini.lamp = buildMini((b) => { b.cyl(0, 0.02, 0, 0.28, 0.14, 0.24, "#d49b38", 10); b.box(0, 0.26, 0, 0.5, 0.18, 0.24, "#d49b38"); b.sphere(0.28, 0.42, 0, 0.08, 0.12, 0.08, "#ffd24d", 6, 1); });
    meshes.artMini.sword = buildMini((b) => { b.box(0, 0.44, 0, 0.08, 0.75, 0.04, "#cfd8e3", 0.2); b.box(0, 0.18, 0, 0.42, 0.06, 0.08, "#e6b94a"); });
    meshes.artMini.compass = buildMini((b) => { b.cyl(0, 0.15, 0, 0.32, 0.32, 0.2, "#c9963a", 12); b.box(0, 0.38, 0, 0.48, 0.08, 0.08, "#1f7ad1", 0.35); });
    // 7) أكوام التراب الرملية وبريق الكنز المخفي تحت التضاريس
    {
      const b = new Builder();
      b.cyl(0, 0, 0, 1.85, 0.95, 0.36, "#c9a66b", 10);
      b.cyl(0, 0.22, 0, 1.05, 0.36, 0.26, "#b88c52", 8);
      b.box(0.42, 0.2, 0.24, 0.38, 0.18, 0.3, "#8c7258");
      b.box(-0.48, 0.16, -0.32, 0.32, 0.14, 0.26, "#9e8162");
      meshes.digMound = b.build(R.gl);
    }
    {
      const b = new Builder();
      b.box(0, 0.14, 0, 0.76, 0.38, 0.56, "#9c6832");
      b.box(0, 0.34, 0, 0.82, 0.12, 0.62, "#f2c144", 0.45);
      b.sphere(0, 0.58, 0, 0.18, 0.18, 0.18, "#ffe26a", 6, 0.95);
      meshes.digGlint = b.build(R.gl);
    }
  }
  H.miniMesh = (key) => { buildDynamicMeshes(); return meshes.artMini[key] || meshes.artMini.amphora; };

  function buildMonumentStageMesh(id, stage, max) {
    const b = new Builder();
    if (id === "mon_dome") {
      b.cyl(0, 0, 0, 7.6, 7.2, 1.0, "#d8c39d", 12);
      if (stage >= 1) b.cyl(0, 1.0, 0, 5.8, 5.6, 3.6, "#ead9b7", 10);
      if (stage >= 2) for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; b.cyl(Math.cos(a) * 5.2, 1.0, Math.sin(a) * 5.2, 0.45, 0.4, 4.4, "#d9c29c", 8); }
      if (stage >= 3) b.sphere(0, 4.6, 0, 4.6, 4.4, 4.6, "#168077", 12, 0.1, true);
      if (stage >= max) b.cyl(0, 9.0, 0, 0.14, 0.08, 1.8, "#f0c243", 6, 0.5);
    } else if (id === "mon_arch") {
      b.box(0, 0, 0, 13.5, 0.6, 4.4, "#e2dccd");
      if (stage >= 1) [-4.2, 4.2].forEach((x) => b.box(x, 0.6, 0, 3.2, 5.2, 3.4, "#ede8da"));
      if (stage >= 2) b.box(0, 5.8, 0, 12.2, 2.2, 3.8, "#e6dfd0");
      if (stage >= max) { b.box(0, 8.0, 0, 12.8, 0.8, 4.1, "#c96f4b"); b.box(0, 6.9, 1.98, 7.2, 1.1, 0.14, "#e6b94a", 0.35); }
    } else {
      b.cyl(0, 0, 0, 5.6, 5.2, 1.2, "#c8b38c", 10);
      if (stage >= 1) b.cyl(0, 1.2, 0, 4.2, 3.4, 4.8, "#e8dec6", 8);
      if (stage >= 2) b.cyl(0, 6.0, 0, 3.8, 3.6, 1.6, "#4a2559", 8);
      if (stage >= 3) { b.push(0, 9.2, 0, 0, 0.35, 0.25); b.cyl(0, -0.2, 0, 2.4, 2.4, 0.3, "#e6b94a", 16, 0.25); b.pop(); }
      if (stage >= max) b.sphere(0, 9.3, 0, 0.9, 0.9, 0.9, "#2fd3ff", 10, 0.7);
    }
    return b.build(R.gl);
  }
  function getMonumentMesh(id, stage, max) {
    const key = id + ":" + stage;
    if (!meshes.monuments[key]) meshes.monuments[key] = buildMonumentStageMesh(id, stage, max);
    return meshes.monuments[key];
  }

  /* ---------- 5. بناء العالم الشمالي الكامل داخل S.dyn ---------- */
  function buildNorthWorld() {
    const S = OSW.world.S, B = new Builder(), Bf = new Builder();
    H.RECTS.length = 0; H.CIRCS.length = 0;
    const regPOI = (id, x, z, y, act, text, cls, max = 90) => {
      S.poi[act] = { x, z };
      S.acts.push({ act, x, y, z, r: 4.5 });
      S.labels.push({ id: "hl_" + id, text, x, y: y + 2.5, z, cls: cls || "sm tap", act, max });
    };

    // توسيع حدود العالم لتشمل القارة الشمالية بالكامل
    Object.assign(S.bounds, { x0: -470, x1: 450, z0: -640, z1: 120 });

    /* --- أ. الطريق الواصل شمالاً من القرية والجسر الحجري (-62 إلى -180) --- */
    B.box(0, 0.03, -53, 8, 0.05, 18, "#cbb48b");
    B.box(0, 0.08, -120, 12.2, 0.22, 122, "#c6b08a");
    for (let z = -172; z <= -68; z += 14) {
      [-1, 1].forEach((s) => {
        B.box(s * 6.0, 0.08, z, 0.9, 1.35, 12.5, "#b39567");
        addLamp(B, s * 5.6, z, 3.6);
      });
      B.cyl(0, -4.5, z, 1.1, 1.1, 4.5, "#8b7964", 8);
    }
    B.box(0, 0.05, -180, 15, 0.08, 12, "#d4bf97");
    S.labels.push({ id: "hl_sign_n", text: "🏛️ شمالاً: دار السلام والتاريخ", x: -6, y: 4.4, z: -56, cls: "gate tap", act: "hist:atlas", max: 110 });
    S.poi["hist:atlas"] = { x: -4, z: -54 };
    S.acts.push({ act: "hist:atlas", x: -6, y: 1.5, z: -56, r: 3.4 });

    /* --- ب. مدينة دار السلام التاريخية المسورة (-140..140, -380..-180) --- */
    B.box(0, -0.08, -280, 290, 0.14, 210, "#dfd0b0"); // أرضية المدينة الحجرية
    B.box(0, 0.02, -280, 14, 0.04, 200, "#c8ae82");   // الشارع الرئيسي شمال-جنوب
    B.box(0, 0.02, -280, 278, 0.04, 14, "#c8ae82");   // الشارع العريض شرق-غرب
    B.cyl(0, 0.03, -280, 24, 24, 0.05, "#e8d6b2", 24); // ساحة دار السلام الدائرية
    // النافورة التاريخية في قلب الساحة (0, -280)
    B.cyl(0, 0, -280, 4.8, 4.6, 0.95, "#b89668", 8);
    B.cyl(0, 0.15, -280, 4.1, 4.1, 0.85, "#2698a6", 12, 0.25);
    B.cyl(0, 0.2, -280, 1.2, 0.7, 2.5, "#d8c39d", 8);
    B.sphere(0, 2.9, -280, 0.65, 0.65, 0.65, "#f2c144", 8, 0.35);
    solidCirc(0, -280, 4.8);
    regPOI("fountain_h", 0, -274, 1.6, "hist:fountain", "⛲ ساحة دار السلام", "gate tap", 95);

    // الأسوار والـ 4 بوابات الأثرية
    addArchedWall(B, 0, -180, 280, "x", 12); // جنوب (للقرية)
    addArchedWall(B, 0, -380, 280, "x", 12); // شمال (للواحة)
    addArchedWall(B, -140, -280, 200, "z", 12); // غرب (للمزارع والميناء)
    addArchedWall(B, 140, -280, 200, "z", 12); // شرق (للقلعة الجبلية)

    // قصر الحاكم (0, -342)
    B.box(0, 0, -356, 36, 10.5, 22, "#efe0c2");
    B.box(0, 10.5, -356, 37.2, 1.1, 23.2, "#c8964b");
    [-16, 16].forEach((x) => {
      B.box(x, 0, -346, 6.2, 14, 6.2, "#e5d0ab");
      B.sphere(x, 14.5, -346, 2.8, 2.4, 2.8, "#168077", 10, 0.08, true);
      B.cyl(x, 16.9, -346, 0.14, 0.08, 1.6, "#f2c144", 6);
    });
    B.sphere(0, 12.2, -356, 6.2, 5.2, 6.2, "#1d8a7e", 12, 0.08, true);
    B.cyl(0, 17.5, -356, 0.16, 0.08, 2.2, "#ffd24d", 6);
    B.box(0, 0, -344.2, 12, 5.5, 1.8, "#b89054");
    B.box(0, 0, -343.2, 4.2, 3.6, 0.4, "#5a341b");
    solidRect(0, -356, 36, 23);
    regPOI("palace", 0, -340, 2.4, "hist:in:hist_palace", "👑 قصر الحاكم", "gate tap", 120);

    // المسجد التاريخي والمئذنة (38, -238)
    B.box(38, 0, -238, 26, 8.2, 22, "#eee2ca");
    B.sphere(38, 8.2, -238, 6.5, 5.4, 6.5, "#168077", 12, 0.12, true);
    B.cyl(38, 13.7, -238, 0.15, 0.08, 2.0, "#f2c144", 6);
    B.cyl(52, 0, -228, 2.4, 1.9, 20.5, "#dfd0b0", 8);
    B.cyl(52, 15.5, -228, 2.9, 2.9, 0.8, "#1d8a7e", 8);
    B.sphere(52, 20.5, -228, 1.7, 1.9, 1.7, "#168077", 8, 0.1, true);
    B.cyl(52, 22.4, -228, 0.12, 0.06, 1.4, "#f2c144", 6);
    solidRect(38, -238, 26, 22);
    solidCirc(52, -228, 2.6);
    S.labels.push({ id: "hl_mosque", text: "🕌 الجامع الكبير والمئذنة", x: 38, y: 12.5, z: -238, cls: "gate", max: 130 });

    // بيت الحكمة والمكتبة (52, -315)
    B.box(52, 0, -326, 20, 7.6, 16, "#e8d7b6");
    B.sphere(52, 7.6, -326, 5.2, 4.1, 5.2, "#245c8a", 10, 0.12, true);
    B.box(52, 0, -317.8, 3.6, 3.2, 0.4, "#5a341b");
    solidRect(52, -326, 20, 16);
    regPOI("library", 52, -315, 2.0, "hist:in:hist_library", "📚 بيت الحكمة والعصور", "sm tap", 110);

    // المتحف الخاص للآثار (-58, -322)
    B.box(-58, 0, -334, 22, 8.0, 18, "#efe4cd");
    for (let cx = -66; cx <= -50; cx += 4) B.cyl(cx, 0, -323.8, 0.45, 0.38, 5.8, "#f4eedc", 8);
    B.box(-58, 5.8, -323.8, 19, 1.2, 2.2, "#d8c39d");
    B.sphere(-58, 8.0, -334, 5.6, 4.0, 5.6, "#c27d32", 10, 0.12, true);
    solidRect(-58, -334, 22, 18);
    regPOI("museum", -58, -320, 2.2, "hist:in:hist_museum", "🏛️ متحف الآثار الخاص", "gate tap", 115);

    // الحمام العام التاريخي (72, -238) -> نقل قليلاً عن المسجد إلى (76, -246)
    B.box(76, 0, -248, 16, 5.5, 14, "#e6d8be");
    [[-3.2, -2], [3.2, -2], [0, 2.5]].forEach(([dx, dz]) => B.sphere(76 + dx, 5.5, -248 + dz, 2.4, 1.9, 2.4, "#d2a968", 8, 0.08, true));
    solidRect(76, -248, 16, 14);
    regPOI("hammam", 76, -238, 1.8, "hist:in:hist_hammam", "♨️ الحمّام التاريخي", "sm tap", 95);

    // السوق التاريخي وورش الحرف
    B.box(-28, 0, -250, 24, 5.2, 12, "#dfcca8");
    B.box(-28, 5.2, -250, 24.6, 1.8, 12.6, "#8c5934");
    solidRect(-28, -250, 24, 12);
    regPOI("souq", -26, -241, 2.0, "hist:in:hist_souq", "⚖️ السوق التاريخي المسقوف", "sm tap", 110);

    addTentStall(B, -48, -264, "#7b3b2e"); // ورشة الحداد طارق
    B.box(-50.5, 0, -264, 1.8, 2.8, 1.8, "#4b4b52");
    B.sphere(-50.5, 1.2, -263.1, 0.45, 0.45, 0.2, "#ff7a2f", 6, 1);
    regPOI("smith", -48, -260, 1.6, "hist:craft:blacksmith", "⚒️ ورشة الحدادة", "sm tap", 80);

    addTentStall(B, -64, -296, "#1d8a7e"); // مشغل الفخار ياسمين
    regPOI("potter", -64, -292, 1.6, "hist:craft:potter", "🏺 مشغل الفخار", "sm tap", 80);

    addTentStall(B, 32, -252, "#7e3a8a"); // سوق القماش نور
    regPOI("weaver", 32, -248, 1.6, "hist:craft:weaver", "🧶 النسّاج والمجوهرات", "sm tap", 80);

    addTentStall(B, -32, -252, "#c0566b"); // العطار زهرة
    regPOI("perfumer", -32, -248, 1.6, "hist:craft:perfumer", "🌹 العطّارة والأسواق", "sm tap", 80);

    // 4 بيوت عربية بأفنية داخلية للمعيشة التاريخية
    addArabHouse(B, -74, -234, 13, 11);
    addArabHouse(B, -94, -242, 12, 11);
    addArabHouse(B, -82, -326, 12, 10);
    addArabHouse(B, 74, -334, 13, 11);

    // نخيل وإنارة شوارع دار السلام
    [[-16, -200], [16, -200], [-16, -310], [16, -310], [-24, -280], [24, -280]].forEach(([x, z]) => {
      addPalm(B, Bf, x, z, 5.8, 0.9);
      addLamp(B, x + (x < 0 ? 4 : -4), z + 4, 3.8);
    });

    /* --- ج. القرية الزراعية التاريخية والناعورة (-310..-155, -280..-130) --- */
    B.box(-230, -0.1, -206, 170, 0.14, 148, "#b7c77c");
    B.box(-210, 0.02, -280, 120, 0.04, 10, "#cbb286");
    // قناة المياه والناعورة (-192, -196) تبقى جنوب طريق البوابة الغربية (z=-280) ليبقى الطريق سالكاً للميناء
    B.box(-192, 0.02, -194, 6.2, 0.06, 86, "#2892b5", 0.25);
    B.box(-188.6, 0, -194, 0.9, 1.2, 86, "#b9a176");
    B.box(-195.4, 0, -194, 0.9, 1.2, 86, "#b9a176");
    solidRect(-192, -194, 7.6, 86);
    B.box(-192, 0.06, -196, 2.2, 4.8, 2.2, "#9a825c"); // عمود حامل الناعورة
    // حقول زراعية تاريخية شرق وغرب القناة
    for (let r = 0; r < 5; r++) {
      B.box(-258, 0.06, -242 + r * 14, 32, 0.16, 7.5, r % 2 ? "#c7a34f" : "#6c9e47");
      for (let x = -270; x <= -246; x += 6) addOliveTree(B, Bf, x, -242 + r * 14 + 4.5, 0.8);
    }
    // فرن الطابون التاريخي ومعصرة الزيتون
    addArabHouse(B, -228, -198, 10, 9, "#e2caa0", "#b66036");
    B.cyl(-222, 0, -193, 1.5, 1.1, 1.8, "#b36b43", 10);
    solidCirc(-222, -193, 1.6);
    regPOI("baker_v", -226, -190, 1.8, "hist:craft:baker", "🫓 مخبز الطابون التاريخي", "sm tap", 90);
    regPOI("farmer_v", -206, -226, 1.8, "hist:craft:farmer", "🌾 القرية الزراعية والناعورة", "sm tap", 90);

    /* --- د. الميناء التجاري القديم (-440..-248, -420..-265) --- */
    B.box(-298, -0.1, -340, 100, 0.14, 140, "#d7c39c"); // ساحة الميناء الأرضية
    B.box(-385, -0.35, -340, 110, 0.25, 150, "#1d7a9c", 0.18); // بحر الميناء
    [-315, -355].forEach((pz) => {
      B.box(-338, 0.35, pz, 28, 0.7, 5.2, "#7d5233");
      solidRect(-338, pz, 28, 5.2);
    });
    // منارة الميناء الحجرية (-306, -296)
    B.cyl(-306, 0, -296, 3.6, 2.3, 15.5, "#e6d8bd", 10);
    B.cyl(-306, 15.5, -296, 2.7, 2.7, 1.2, "#b86a3a", 10);
    B.sphere(-306, 17.4, -296, 1.2, 1.3, 1.2, "#ffe57a", 8, 1);
    solidCirc(-306, -296, 3.8);
    addArabHouse(B, -284, -356, 14, 12, "#cbb58f", "#246c91"); // مستودع الميناء
    regPOI("port_h", -320, -326, 2.0, "hist:port", "⛵ الميناء التجاري القديم", "gate tap", 115);

    /* --- هـ. الجبل والقلعة العسكرية (148..420, -415..-188) --- */
    B.box(282, -0.08, -300, 268, 0.14, 215, "#b9aa8e"); // سهل صخري شرقي
    B.box(212, 0.02, -280, 130, 0.04, 12, "#9c8d75");   // طريق القلعة من البوابة الشرقية
    // كتل جبلية متدرجة خلف القلعة
    B.box(355, 0, -325, 92, 16, 135, "#877c6d");
    B.box(365, 16, -335, 62, 14, 96, "#7a7062");
    B.box(370, 30, -340, 34, 11, 52, "#6c6358");
    solidRect(355, -325, 92, 135);
    // القلعة العسكرية (285, -308)
    B.box(285, 0, -314, 42, 11, 32, "#9aa0a6");
    [[-19, -15], [19, -15], [-19, 15], [19, 15]].forEach(([dx, dz]) => {
      B.cyl(285 + dx, 0, -314 + dz, 3.8, 3.5, 15.5, "#8a9096", 10);
      B.cyl(285 + dx, 15.5, -314 + dz, 4.1, 4.1, 1.2, "#6b382f", 10);
    });
    B.box(285, 0, -297.5, 6.2, 5.2, 1.2, "#4a2e1b");
    solidRect(285, -314, 44, 34);
    regPOI("citadel", 275, -288, 2.5, "hist:in:hist_citadel", "🏰 القلعة العسكرية", "gate tap", 120);
    // موقع تنقيب مخبأ القلعة (292, -348)
    B.box(292, 0, -348, 7, 1.2, 7, "#6e7278");
    B.box(292, 0.5, -348, 2.4, 2.2, 2.4, "#c9963a", 0.25);
    solidRect(292, -348, 3.2, 3.2);
    regPOI("site_citadel", 292, -348, 2.2, "hist:site:site_citadel_cache", "⛏️ مخبأ أسوار القلعة", "sm tap", 85);

    /* --- و. طريق القوافل والواحة وخان القوافل (-160..20, -610..-382) --- */
    B.box(-80, -0.1, -505, 520, 0.14, 240, "#e6cf9b"); // السهل الصحراوي الشمالي الواسع
    B.box(-35, 0.02, -455, 14, 0.04, 145, "#d2b47c");   // طريق القوافل الرئيسي شمالاً
    // بركة الواحة الفيروزية (-95, -528)
    B.cyl(-95, -0.05, -528, 14, 14, 0.22, "#1996a8", 20, 0.22);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2;
      addPalm(B, Bf, -95 + Math.cos(a) * 16.5, -528 + Math.sin(a) * 16.5, 6.6 + (i % 3), 1.0);
    }
    // خان القوافل (-76, -502)
    B.box(-76, 0, -508, 22, 6.8, 16, "#dcc294");
    B.box(-76, 6.8, -508, 22.8, 0.7, 16.8, "#a67642");
    B.box(-76, 0, -499.6, 4.6, 3.8, 0.6, "#5a341b");
    solidRect(-76, -508, 22, 16);
    regPOI("khan", -76, -496, 2.0, "hist:in:hist_khan", "🐪 خان القوافل", "gate tap", 115);
    regPOI("caravan_p", -56, -494, 1.8, "hist:caravans", "📦 محطة قوافل الجمال", "sm tap", 90);

    /* --- ز. مواقع التنقيب الثلاثة (مفصولة بدقة حسب الطراز التاريخي دون أي خلط) --- */
    // 1) آثار العصر القديم (شرق الواحة: الحجر الرملي والمسلات)
    B.cyl(132, 0, -520, 3.0, 1.2, 16.5, "#d9b06e", 4);
    B.prism(132, 16.5, -520, 2.2, 3.0, 2.2, "#f0c243", 0.35);
    solidRect(132, -520, 4.4, 4.4);
    regPOI("s_obelisk", 132, -512, 2.2, "hist:site:site_ancient_obelisk", "🪨 مسلّة العصر القديم", "sm tap", 100);

    // بوابة المقابر الصخرية
    B.box(175, 0, -566, 14, 6.5, 10, "#cba162");
    B.box(175, 0, -560.6, 3.8, 4.0, 0.6, "#2c2218");
    solidRect(175, -566, 14, 10);
    regPOI("s_tomb", 175, -555, 2.0, "hist:site:site_ancient_tomb", "⚱️ وادي المقابر القديمة", "sm tap", 100);

    // الغرفة الملكية التعاونية (162, -538)
    B.cyl(162, 0, -538, 3.4, 3.2, 0.65, "#9c7540", 8);
    B.box(160.8, 0.65, -538, 0.9, 1.1, 0.9, "#e6b94a", 0.3);
    B.box(163.2, 0.65, -538, 0.9, 1.1, 0.9, "#2fd3ff", 0.3);
    solidCirc(162, -538, 3.5);
    regPOI("coop_tomb", 162, -533, 2.2, "hist:coop_tomb", "🔐 بوابة الكنز المزدوجة (2 لاعبين)", "gate tap", 95);

    // 2) الآثار الكلاسيكية (غرب الواحة: أعمدة الرخام الأيونية والمدرج)
    B.box(-245, 0, -552, 26, 1.2, 16, "#eae4d6");
    for (let x = -255; x <= -235; x += 4) B.cyl(x, 1.2, -558, 0.65, 0.55, 7.2, "#f5f0e6", 10);
    B.box(-245, 8.4, -558, 24, 1.4, 2.4, "#e6dfd0");
    solidRect(-245, -552, 26, 16);
    regPOI("s_odeion", -245, -540, 2.0, "hist:site:site_classical_odeion", "🏛️ المدرج الكلاسيكي الغربي", "sm tap", 105);

    B.cyl(-292, 0, -592, 5.4, 5.4, 1.0, "#dcd5c5", 12);
    B.cyl(-295, 1.0, -592, 0.6, 0.5, 5.0, "#f5f0e6", 8);
    B.cyl(-289, 1.0, -592, 0.6, 0.5, 3.2, "#f5f0e6", 8);
    solidCirc(-292, -592, 5.6);
    regPOI("s_vault", -292, -582, 2.0, "hist:site:site_classical_vault", "🪙 خزانة الميناء الغارقة", "sm tap", 100);

    // 3) مرصد العصر الذهبي الإسلامي (شمال السور: اللازورد والفلك)
    B.cyl(58, 0, -468, 8.2, 7.6, 1.4, "#e6d8be", 10);
    B.cyl(58, 1.4, -468, 5.2, 4.6, 4.8, "#168077", 10);
    B.sphere(58, 6.2, -468, 4.0, 3.6, 4.0, "#245c8a", 10, 0.2, true);
    B.cyl(58, 9.8, -468, 0.12, 0.08, 1.8, "#f2c144", 6, 0.5);
    solidCirc(58, -468, 8.2);
    regPOI("s_astro", 58, -458, 2.2, "hist:site:site_islamic_observatory", "🔭 مرصد النجوم التاريخي", "sm tap", 105);

    /* --- ح. المعالم التعاونية (مواقع التشييد الثلاثة) --- */
    const monSites = {
      mon_dome: { x: 22, z: -292, lx: 22, lz: -283 },
      mon_arch: { x: 0, z: -404, lx: 0, lz: -395 },
      mon_astro: { x: 30, z: -328, lx: 24, lz: -322 }
    };
    (H.MONUMENTS || []).forEach((mn) => {
      const p = monSites[mn.id];
      if (!p) return;
      regPOI("mon_" + mn.id, p.lx, p.lz, 2.2, "hist:monuments", `${mn.e} ${mn.n}`, "sm tap", 105);
    });
    H._monPos = monSites;

    /* --- ط. مواقع الكنوز الأثرية المخفية تحت تضاريس خريطة العالم --- */
    (H.BURIED_SPOTS || []).forEach((sp) => {
      S.poi["hist:digspot:" + sp.id] = { x: sp.x, z: sp.z };
      S.acts.push({ act: "hist:digspot:" + sp.id, x: sp.x, y: 0.4, z: sp.z, r: 2.8 });
      S.labels.push({ id: "hl_spot_" + sp.id, text: `${sp.e} أثر مدفون · ${sp.n}`, x: sp.x, y: 1.55, z: sp.z, cls: "sm tap", act: "hist:digspot:" + sp.id, max: 24 });
    });

    if (S.dyn.histMain) R.free(S.dyn.histMain);
    if (S.dyn.histFol) R.free(S.dyn.histFol);
    S.dyn.histMain = B.build(R.gl);
    S.dyn.histFol = Bf.build(R.gl);
    buildDynamicMeshes();
    S.labels.push({ id: "hl_caravan", text: "🐪 قافلة الحرير", x: caravanPos.x, y: 3.6, z: caravanPos.z, cls: "sm tap", act: "hist:caravans", max: 90, follow: () => [caravanPos.x, 3.6, caravanPos.z] });
  }

  /* ---------- 6. الرسم وتحديث روتين الشخصيات والدواب ---------- */
  let caravanPos = { x: -35, z: -455 };
  H.drawMountFor = (o, kind, t) => {
    if (!o || !kind) return;
    buildDynamicMeshes();
    const mesh = kind === "carriage" ? meshes.carriageMount : meshes.camelMount;
    if (!mesh) return;
    const bob = o.mv > 0.2 ? Math.abs(Math.sin((o.phase || t * 4) * 0.9)) * 0.08 : 0;
    M.trs(o.x, bob, o.z, o.ry || 0, 0, 0, 1, 1, 1, m1);
    R.draw(mesh, m1);
  };

  H.draw = (t) => {
    const w = W(); if (!w || !w.S || !w.S.dyn.histMain) return;
    const S = w.S, me = w.getMe();
    // عدم إهدار الأداء لو اللاعب بعيد جداً في الجنوب (المدينة/الجزيرة الثانية > 380m)
    if (me.z > 280) return;

    R.draw(S.dyn.histMain);
    R.draw(S.dyn.histFol, null, null, 1, 1.6);

    // 1) الناعورة المائية الدوارة في القرية الزراعية
    if (meshes.noria) {
      M.trs(-192, 3.8, -196, 0, 0, t * 0.42, 1, 1, 1, m1);
      R.draw(meshes.noria, m1);
    }
    // 2) سفينة الداو الشراعية تتمايل في الميناء القديم
    if (meshes.dhow) {
      M.trs(-352, Math.sin(t * 1.4) * 0.14, -338, 0.25 + Math.sin(t * 0.7) * 0.03, Math.sin(t * 1.1) * 0.02, 0, 1, 1, 1, m1);
      R.draw(meshes.dhow, m1);
    }
    // 3) قافلة الجمال المتحركة في طريق الصحراء الشمالي
    if (meshes.caravan) {
      const ang = (t * 0.045) % (PI * 2);
      const cx = -15 + Math.cos(ang) * 44, cz = -465 + Math.sin(ang) * 38;
      const ry = Math.atan2(-Math.sin(ang) * 44, Math.cos(ang) * 38);
      caravanPos.x = cx; caravanPos.z = cz;
      S.poi["hist:caravans"] = { x: cx, z: cz + 4 };
      M.trs(cx, Math.abs(Math.sin(t * 4.5)) * 0.08, cz, ry, 0, 0, 1, 1, 1, m1);
      R.draw(meshes.caravan, m1);
    }
    // 4) المعالم التعاونية الثلاثة حسب تقدم البناء
    const hs = G() && G().state ? G().state().hist : null;
    if (hs && H._monPos) {
      (H.MONUMENTS || []).forEach((mn) => {
        const p = H._monPos[mn.id], stg = Math.min(mn.stages, (hs.monuments && hs.monuments[mn.id]) || 0);
        M.trs(p.x, 0, p.z, 0, 0, 0, 1, 1, 1, m1);
        R.draw(getMonumentMesh(mn.id, stg, mn.stages), m1);
      });
    }
    // 5) الدواب المركوبة حالياً (للاعب وللشريك إن وجد في نفس الفضاء)
    if (H.activeMount && !w._int.me.veh) {
      H.drawMountFor(w._int.me, H.activeMount, t);
    }
    if (H.partnerMount && w._int.pa && w._int.pa.vis && !w._int.pa.inside && !w._int.pa.veh) {
      H.drawMountFor(w._int.pa, H.partnerMount, t);
    }
    // 6) الكنوز المدفونة تحت تضاريس العالم وبريق الحفر الجزئي
    if (hs && meshes.digMound && (H.BURIED_SPOTS || []).length) {
      const now = Date.now(), ev = H.activeEvent(now), cd = Math.round(120000 * (ev.digFast || 1));
      H.BURIED_SPOTS.forEach((sp) => {
        if (Math.hypot(sp.x - me.x, sp.z - me.z) > 48) return;
        const st = hs.spots && hs.spots[sp.id];
        if (st && st.coolAt && now - st.coolAt < cd) return;
        const prog = st && st.digs ? Math.min(1, st.digs / sp.depth) : 0;
        const sc = 1 - prog * 0.42;
        M.trs(sp.x, 0, sp.z, 0, 0, 0, sc, sc, sc, m1);
        R.draw(meshes.digMound, m1);
        if (prog > 0 && meshes.digGlint) {
          M.trs(sp.x, 0.08 + prog * 0.16, sp.z, t * 1.4, 0, 0, 0.72 + prog * 0.35, 0.72 + prog * 0.35, 0.72 + prog * 0.35, m1);
          R.draw(meshes.digGlint, m1);
        }
      });
    }
  };

  H.drawShadow = (t) => {
    const w = W(); if (!w || !w.S || !w.S.dyn.histMain) return;
    if (w.getMe().z > 280) return;
    R.draw(w.S.dyn.histMain);
    if (meshes.noria) { M.trs(-192, 3.8, -196, 0, 0, t * 0.42, 1, 1, 1, m1); R.draw(meshes.noria, m1); }
    if (meshes.dhow) { M.trs(-352, 0, -338, 0.25, 0, 0, 1, 1, 1, m1); R.draw(meshes.dhow, m1); }
    if (H.activeMount && !w._int.me.veh) H.drawMountFor(w._int.me, H.activeMount, t);
  };

  /* ---------- 7. روتين الشخصيات التاريخية حسب وقت اليوم + السفر السريع ---------- */
  let npcTimer = 0;
  H.tick = (dt, mode) => {
    if (mode !== "out") return;
    npcTimer += dt;
    if (npcTimer < 1.2) return;
    npcTimer = 0;
    const w = W(); if (!w || !w._int || !w.period) return;
    const phase = w.period(); // morning | noon | evening | night
    const pKey = phase === "dawn" || phase === "morning" ? "morning" : phase === "afternoon" || phase === "noon" ? "noon" : phase === "evening" ? "evening" : "night";
    const npcs = w._int.npc || {};
    (H.NPCS || []).forEach((d) => {
      const o = npcs[d.id], pt = d.schedules && d.schedules[pKey];
      if (!o || !pt) return;
      o.roam = [pt[0], pt[1], pKey === "night" ? 2.5 : 5.5];
    });
  };

  H.travel = async (zoneKey) => {
    const w = W(), ui = OSW.ui, Z = ZONES[zoneKey] || (zoneKey === "village" ? { n: "القرية", e: "🏡", ax: 0, az: 10 } : zoneKey === "bigcity" ? { n: "المدينة الكبرى", e: "🏙️", ax: 270, az: 556 } : null);
    if (!Z) return;
    if (w._int.me.veh) return ui.toast("🚪 انزلوا من السيارة أولاً قبل الانتقال");
    ui.closeModal();
    if (w.mode === "in") await OSW.app.exitInterior();
    if (zoneKey === "bigcity" && OSW.city && OSW.city.preload) OSW.city.preload(Z.ax, Z.az);
    const cur = document.getElementById("curtain");
    cur.classList.add("on");
    OSW.audio && OSW.audio.sfx("door");
    await OSW.sleep(360);
    w.placeMe(Z.ax, Z.az);
    w.resetCam && w.resetCam();
    w.setInputEnabled(true);
    await OSW.sleep(100);
    cur.classList.remove("on");
    ui.toast(`${Z.e} وصلتوا إلى ${Z.n}`, "gold", 2600);
  };

  H.attach = () => {
    hookNavigation();
    if (W() && W().onReady) W().onReady(buildNorthWorld);
  };
  H.attach();
})();
