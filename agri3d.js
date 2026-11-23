/* ============================================================
   الشركة الزراعية — العالم المرئي: المقر، المخزن، ساحة الآلات، المصانع، الميناء،
   أنظمة الري، الجرارات، العمال، السفينة. كله بيتغيّر حسب حالة الشركة الحقيقية.
   محمي بـ try/catch حتى ما يوقف اللعبة لو صار أي خطأ.
   ============================================================ */
(function () {
  const OSW = window.OSW, A = OSW.agri; if (!A) return;
  const PI = Math.PI, hy = Math.hypot, sin = Math.sin, cos = Math.cos;
  const Builder = OSW.Builder, M = OSW.M, R = OSW.R;
  const G = () => OSW.game, W = () => OSW.world, V = () => OSW.veh;
  const POS = A.POS, PLANTS = A.PLANTS, FIELDS = A.FIELDS, GOODS = A.GOODS;
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const GCOL = (A.GCOL = { flour: "#f5f0e6", bread: "#d9a066", butter: "#ffe27a", cheese: "#f5c542", jam: "#c2185b", grapejuice: "#7b3fa0", lemonade: "#f5e663", wmjuice: "#ff4d6d" });

  /* ---------- مواقف السيارات الجديدة + منع الأشجار فوق الميناء ---------- */
  try {
    if (V() && V().LOTS) { V().LOTS.CO = POS.lotCO; V().LOTS.PT = POS.lotPT; }
    const L = OSW.logi; if (L && L.islandBlocked && !L._agri) { const ob = L.islandBlocked; L.islandBlocked = (x, z) => ob(x, z) || (x > 34 && x < 94 && z > 1242 && z < 1306); L._agri = 1; }
  } catch (e) { console.error("agri3d.init", e); }

  /* ---------- أدوات بناء ---------- */
  const rectCol = (col, x0, x1, z0, z1, r = 0.6, st = 1.6) => { for (let x = x0; x <= x1 + 0.01; x += st) { col(x, z0, r); col(x, z1, r); } for (let z = z0; z <= z1 + 0.01; z += st) { col(x0, z, r); col(x1, z, r); } };
  const mk = (fn) => { const b = new Builder(); fn(b); return b.build(R.gl); };
  const win = (b, x, y, z, w, h, e) => { b.box(x, y, z, w, h, 0.14, "#9bd1f0", e || 0); b.box(x, y - 0.06, z, w + 0.2, 0.08, 0.2, "#6b7280"); };

  /* =====================================================================
     البناء الثابت (قرية): المقر + ساحة الآلات + مخزن الشركة + مواقف + الطرق + بلاطات المصانع
     ===================================================================== */
  A.build = (c) => {
    try {
      const { B, S, reg, label, col } = c, an = (OSW.logi && OSW.logi.anchors) || [];
      // طرق
      B.strip([[-108, 79.5], [-40, 79.5]], 4, 0.11, "#b8a98a"); B.strip([[44, 79.5], [110, 79.5]], 4, 0.11, "#b8a98a");
      B.strip([[-74, 57], [-74, 79.5]], 3.6, 0.11, "#b8a98a"); B.strip([[74, 57], [74, 79.5]], 3.6, 0.11, "#b8a98a");
      // المقر
      const H = POS.hq, hx = H.x, z0 = H.z - H.d / 2, z1 = H.z + H.d / 2;
      B.box(hx, 0.03, H.z, H.w + 3, 0.1, H.d + 5, "#b9b0a2");
      B.box(hx, 0.12, H.z, H.w, 3.4, H.d, "#f2efe6"); B.box(hx, 3.52, H.z, H.w, 3.2, H.d, "#e3ebf4"); B.box(hx, 6.72, H.z, H.w + 1.2, 0.4, H.d + 1.2, "#3d5a80"); B.box(hx, 7.12, H.z, H.w - 2, 0.5, H.d - 2, "#2f4a6b");
      B.box(hx, 7.6, z0 + 0.2, 10, 1.6, 0.3, "#2f7d46"); // لوحة السطح
      for (let x = hx - 10.5; x <= hx + 10.6; x += 3.5) win(B, x, 4.2, z0 - 0.04, 2, 1.7, 0.15);
      A.OFFICES.forEach((o, i) => {
        const cl = ["#2f7d46", "#6a994e", "#4a7fb5", "#b5651d", "#9b5de5", "#e07a1f"][i];
        B.box(o.x, 0.12, z0 - 0.08, 1.7, 2.6, 0.2, "#4a5f7d"); B.box(o.x, 2.85, z0 - 0.1, 3.4, 0.55, 0.14, cl); B.box(o.x, 3.45, z0 - 0.6, 3.4, 0.1, 1.4, "#c9c2b4");
        reg("co:hq:" + o.id, o.x, 1.4, z0 - 0.3, 1.9, o.x, z0 - 2.2); label("cohq_" + o.id, o.e + " " + o.n, o.x, 4.3, z0 - 0.8, { act: "co:hq:" + o.id, cls: "sm", max: 34 });
      });
      label("cohq_main", "🏢 مقر الشركة الزراعية", hx, 9.2, z0 - 0.5, { act: "co:hq:ov", max: 140 });
      B.box(hx - 14.2, 0.05, z0 - 2.4, 0.3, 0.9, 2.8, "#8d6e63"); // مقعد
      rectCol(col, hx - H.w / 2, hx + H.w / 2, z0, z1, 0.7, 1.6); an.push([hx, H.z, 17]);
      // ساحة الآلات
      const D = POS.depot, dz0 = D.z - D.d / 2, dz1 = D.z + D.d / 2;
      B.box(D.x, 0.04, D.z, D.w + 1.5, 0.08, D.d + 1.5, "#8f8f8f"); B.box(D.x, 0.1, dz1 - 0.15, D.w, 3.6, 0.3, "#c9b79c");
      [-1, 1].forEach((s) => { B.box(D.x + s * (D.w / 2 - 0.15), 0.1, D.z, 0.3, 3.6, D.d, "#c9b79c"); B.box(D.x + s * (D.w / 2 - 0.2), 0.1, dz0 + 0.2, 0.4, 3.8, 0.4, "#8a6a4a"); });
      B.box(D.x, 3.7, D.z, D.w + 1, 0.3, D.d + 1, "#9a3b2e"); B.box(D.x, 4.0, D.z, D.w + 0.6, 0.12, D.d + 0.6, "#7d2e24");
      label("codepot", "🚜 ساحة الآلات", D.x, 5.4, dz0, { act: "co:depot", cls: "sm", max: 60 }); reg("co:depot", D.x, 1.5, D.z, 5, D.x, dz0 - 2.5);
      rectCol(col, D.x - D.w / 2, D.x + D.w / 2, dz0, dz1, 0.5, 2); an.push([D.x, D.z, 9]);
      // مخزن الشركة
      const Wh = POS.wh, wz0 = Wh.z - Wh.d / 2, wz1 = Wh.z + Wh.d / 2;
      B.box(Wh.x, 0.03, Wh.z - 2, Wh.w + 3, 0.1, Wh.d + 8, "#a8a29a");
      B.box(Wh.x, 0.12, Wh.z, Wh.w, 4.6, Wh.d, "#d9d2c0"); B.box(Wh.x, 4.72, Wh.z, Wh.w + 1, 0.4, Wh.d + 1, "#6b7a8f"); B.box(Wh.x, 5.1, Wh.z, Wh.w - 1, 0.3, Wh.d - 1, "#586577");
      B.box(Wh.x, 0.12, wz0 - 0.08, 5.2, 3.6, 0.2, "#b0b8c4"); for (let i = 1; i < 8; i++) B.box(Wh.x, 0.12 + i * 0.45, wz0 - 0.2, 5.2, 0.05, 0.05, "#7b8594");
      B.box(Wh.x + 4.5, 5.5, Wh.z, 2.4, 1.1, 2.4, "#cfd8dc"); B.cyl(Wh.x + 4.5, 6.6, Wh.z, 0.6, 0.6, 0.3, "#90a4ae", 8);
      B.box(Wh.x, 0.12, wz0 - 0.1, 0.3, 0.1, 0.1, "#fff");
      reg("co:wh", Wh.x, 1.8, wz0 - 0.2, 4.2, Wh.x, wz0 - 6); label("cowh", "🏬 مخزن الشركة", Wh.x, 6.4, wz0 - 0.4, { act: "co:wh", max: 90 });
      rectCol(col, Wh.x - Wh.w / 2, Wh.x + Wh.w / 2, wz0, wz1, 0.6, 1.6); an.push([Wh.x, Wh.z, 11]);
      // موقف الشركة
      const Lo = POS.lotCO; B.box(Lo.cx, 0.05, Lo.cz + 4, 7, 0.08, 18, "#4a4f57"); for (let i = 0; i < 6; i++) B.box(Lo.cx - 3.2, 0.1, Lo.cz - 3.5 + i * 3.2, 0.1, 0.03, 2.4, "#f4f1e8");
      label("colotco", "🅿️ موقف الشركة", Lo.cx, 2.6, Lo.cz - 5, { cls: "sm", max: 30 }); an.push([Lo.cx, Lo.cz + 4, 9]);
      // أراضي المصانع (بلاطات + تفاعل). المباني نفسها بترسم ديناميكي حسب حالة البناء
      Object.keys(PLANTS).forEach((id) => {
        const p = PLANTS[id]; B.box(p.x, 0.03, p.z, p.w + 3, 0.1, p.d + 4, "#a8a29a");
        reg("co:plant:" + id, p.x, 2.2, p.z - p.d / 2, 4.5, p.x, p.z - 7.5); rectCol(col, p.x - p.w / 2, p.x + p.w / 2, p.z - p.d / 2, p.z + p.d / 2, 0.6, 1.8); an.push([p.x, p.z, 10]);
      });
    } catch (e) { console.error("agri.build", e); }
  };

  /* =====================================================================
     البناء الثابت (الجزيرة): ميناء التصدير
     ===================================================================== */
  A.buildIsland = (c) => {
    try {
      const { B, S, reg, label, col } = c, P = POS.port;
      B.box(62, 0.03, 1266, 50, 0.1, 40, "#a8a29a"); B.box(62, 0.05, 1294, 52, 0.45, 20, "#8d8f94"); // ساحة + رصيف
      for (let x = 40; x <= 84; x += 4) B.cyl(x, 0.45, 1303.5, 0.28, 0.28, 0.5, "#37474f", 6);
      B.strip([[62, 1236], [62, 1290]], 5, 0.11, "#4a4f57");
      // مكتب الميناء
      B.box(P.x, 0.12, P.z, P.w, 3.6, P.d, "#f1ece0"); B.box(P.x, 3.72, P.z, P.w + 1, 0.35, P.d + 1, "#1f5f8b"); B.box(P.x, 4.07, P.z, P.w - 1, 0.5, P.d - 1, "#17496b");
      B.box(P.x, 0.12, P.z + P.d / 2 + 0.08, 1.8, 2.5, 0.2, "#4a5f7d"); [-3, 3].forEach((dx) => win(B, P.x + dx, 1.4, P.z + P.d / 2 + 0.05, 1.8, 1.5));
      B.box(P.x - 3, 4.6, P.z, 0.15, 3, 0.15, "#bbb"); B.box(P.x - 2.4, 7.2, P.z, 1.2, 0.8, 0.05, "#e63946");
      reg("co:port", P.x, 1.8, P.z + P.d / 2, 4.2, P.x, P.z + P.d / 2 + 3); label("coport", "🚢 ميناء التصدير", P.x, 6.0, P.z + P.d / 2, { act: "co:port", max: 150 });
      rectCol(col, P.x - P.w / 2, P.x + P.w / 2, P.z - P.d / 2, P.z + P.d / 2, 0.6, 1.8);
      // رافعة الميناء
      [1286, 1301].forEach((z) => { B.box(76, 0.45, z, 1, 14, 1, "#e07a1f"); B.box(76.0, 8, z, 1.4, 0.4, 1.4, "#c9651a"); });
      B.box(76, 14.4, 1297.5, 1.6, 1.3, 36, "#e07a1f"); B.box(76, 15.7, 1297.5, 1.0, 0.2, 36, "#b85d14"); B.box(76, 12.2, 1312, 0.3, 2.2, 0.3, "#37474f"); B.box(76, 11.6, 1312, 2.4, 0.6, 2.2, "#ffd23f");
      col(76, 1286, 0.9); col(76, 1301, 0.9);
      [[40, 1246], [84, 1246], [40, 1276], [84, 1276]].forEach(([x, z]) => { B.cyl(x, 0, z, 0.1, 0.08, 3.6, "#4a3d38", 6); B.sphere(x, 3.8, z, 0.34, 0.4, 0.34, "#ffe7a0", 7, 1); });
      B.box(62, 0.12, 1240, 6, 0.04, 0.4, "#f4f4f4");
      label("colotpt", "🅿️ موقف الميناء", POS.lotPT.cx, 2.6, POS.lotPT.cz - 5, { cls: "sm", max: 40 });
    } catch (e) { console.error("agri.buildIsland", e); }
  };

  /* =====================================================================
     مجسّمات ديناميكية (بتنبني مرة وحدة وبتنرسم حسب الحالة)
     ===================================================================== */
  const cache = {};
  const memo = (k, fn) => cache[k] || (cache[k] = mk(fn));
  const palletMesh = (col) => memo("pal" + col, (b) => { b.box(0, 0, 0, 1.0, 0.12, 0.8, "#9c7a4e"); b.box(0, 0.12, 0, 0.9, 0.62, 0.7, col); b.box(0, 0.74, 0, 0.5, 0.05, 0.4, "#ffffff"); });
  const contMesh = (col) => memo("cont" + col, (b) => { b.box(0, 0, 0, 2.6, 1.4, 1.2, col); for (let i = -5; i <= 5; i++) b.box(i * 0.24, 0, 0.62, 0.05, 1.4, 0.02, "#00000033".slice(0, 7)); b.box(0, 1.4, 0, 2.6, 0.06, 1.2, "#e5e5e5"); });
  const smokeMesh = () => memo("smoke", (b) => b.sphere(0, 0, 0, 0.6, 0.6, 0.6, "#ffffff", 6));
  const beaconMesh = () => memo("beacon", (b) => { b.sphere(0, 0, 0, 0.45, 0.8, 0.45, "#ff2d2d", 6, 1); b.box(0, -1.6, 0, 0.06, 1.2, 0.06, "#b71c1c"); });
  const waterMesh = () => memo("water", (b) => b.sphere(0, 0, 0, 0.5, 0.5, 0.5, "#7fd3ff", 6, 0.3));
  const SMOKE = { mill: [-3, 6.2, 1], bakery: [-4, 10.9, 3], dairy: [-3, 6.2, 0], juice: [-4, 6.2, 0] };

  function plantMesh(id, built, lv) {
    const p = PLANTS[id], w = p.w, d = p.d;
    return memo(`pl|${id}|${built}|${lv}`, (b) => {
      b.push(p.x, 0, p.z, 0);
      if (!built) {
        b.box(0, 0.12, 0, w, 0.1, d, "#8d8f94");
        for (let x = -w / 2; x <= w / 2 + 0.01; x += 2) { b.box(x, 0, -d / 2, 0.14, 1.3, 0.14, "#8a6a4a"); b.box(x, 0, d / 2, 0.14, 1.3, 0.14, "#8a6a4a"); b.box(x, 1.0, -d / 2, 2, 0.1, 0.05, "#ff8c1a"); b.box(x, 0.6, d / 2, 2, 0.1, 0.05, "#ff8c1a"); }
        b.sphere(w / 2 - 2, 0.4, d / 2 - 2, 1.7, 0.9, 1.4, "#d8c28a", 6); b.box(-w / 2 + 2, 0.2, d / 2 - 2, 3, 0.3, 0.7, "#c9a06a"); b.box(-w / 2 + 2, 0.5, d / 2 - 2, 3, 0.3, 0.7, "#b98d5e");
        b.box(-w / 2 + 1, 0.12, 0, 0.5, 8, 0.5, "#ffd23f"); b.box(0, 8.0, 0, w - 2, 0.4, 0.4, "#ffd23f"); b.box(w / 2 - 2, 4.5, 0, 0.06, 3.5, 0.06, "#555");
        b.box(0, 0.12, -d / 2 - 0.5, 0.18, 2.4, 0.18, "#fff"); b.box(0, 1.5, -d / 2 - 0.5, 3.4, 1.2, 0.12, "#e63946"); b.box(0, 1.9, -d / 2 - 0.58, 2.6, 0.12, 0.04, "#ffffff");
      } else {
        const sh = (c, k) => c;
        b.box(0, 0.12, 0, w + 2, 0.08, d + 2, "#9a958b");
        b.box(0, 0.2, 0, w, 4.6, d, p.wall); b.box(0, 4.8, 0, w + 0.8, 0.4, d + 0.8, p.roof); b.box(0, 5.2, 0, w - 1, 0.3, d - 1, sh(p.roof));
        b.box(0, 0.2, -d / 2 - 0.08, 2.2, 2.6, 0.2, "#4a5f7d"); [-w / 2 + 2.2, w / 2 - 2.2].forEach((x) => win(b, x, 1.7, -d / 2 - 0.04, 1.9, 1.4, 0.3));
        win(b, -w / 2 + 2.2, 3.4, -d / 2 - 0.04, 1.9, 0.9, 0.3); win(b, w / 2 - 2.2, 3.4, -d / 2 - 0.04, 1.9, 0.9, 0.3);
        if (id === "mill") { b.cyl(w / 2 - 1.6, 0.2, d / 2 - 2, 2.0, 2.0, 9.5, "#cfd4da", 12); b.cyl(w / 2 - 1.6, 9.7, d / 2 - 2, 2.1, 0.1, 1.8, "#8a9099", 12); b.box(w / 2 - 1.6, 0.2, d / 2 - 4.3, 0.3, 8, 0.1, "#8d6e63"); b.box(-2, 6.0, -d / 2 - 0.3, 0.3, 3.4, 0.15, "#8d6e63"); b.box(-2, 7.5, -d / 2 - 0.3, 3.4, 0.3, 0.15, "#8d6e63"); b.sphere(-2, 7.6, -d / 2 - 0.35, 0.35, 0.35, 0.2, "#ffd23f", 6); for (let i = 0; i < 4; i++) b.box(-w / 2 + 1.5 + i * 1.1, 0.2, d / 2 + 0.7, 0.9, 0.7, 0.8, "#e9c46a"); }
        if (id === "bakery") { b.box(-w / 2 + 2, 5.2, d / 2 - 2, 1.4, 5.8, 1.4, "#9a5a44"); b.box(-w / 2 + 2, 11.0, d / 2 - 2, 1.8, 0.3, 1.8, "#6e3f30"); for (let i = 0; i < 5; i++) b.sphere(-3 + i * 1.5, 5.9, -d / 2 + 1, 0.8, 0.35, 0.35, "#d9a066", 6); b.box(w / 2 - 0.2, 0.2, 0, 0.1, 1.5, 3.2, "#fffdf6"); }
        if (id === "dairy") { [[w / 2 - 1.6, -1.5], [w / 2 - 1.6, 1.5]].forEach(([x, z]) => { b.cyl(x, 0.2, z, 1.4, 1.4, 6, "#d7dde3", 12); b.sphere(x, 6.2, z, 1.4, 0.7, 1.4, "#c3cbd3", 10); b.cyl(x, 2.0, z, 1.45, 1.45, 0.5, "#4a7fb5", 12); }); b.box(w / 2 - 3.4, 3.0, 0, 0.4, 0.4, 4, "#90a4ae"); b.box(-3, 5.2, 0, 2, 1.0, 2, "#cfd8dc"); }
        if (id === "juice") { ["#e07a1f", "#c2185b", "#7b3fa0"].forEach((cc, i) => { b.cyl(-4 + i * 3.4, 0.2, d / 2 + 1.6, 1.3, 1.3, 4 + i * 0.5, cc, 10); b.sphere(-4 + i * 3.4, 4.2 + i * 0.5, d / 2 + 1.6, 1.3, 0.6, 1.3, cc, 8); }); b.box(0, 0.2, -d / 2 - 1.6, w - 3, 0.35, 0.9, "#607d8b"); for (let i = 0; i < 8; i++) b.sphere(-w / 2 + 2.4 + i * 1.4, 0.8, -d / 2 - 1.6, 0.2, 0.32, 0.2, ["#e07a1f", "#c2185b", "#7b3fa0", "#f5e663"][i % 4], 5); }
        if (lv >= 2) { b.box(w / 2 + 2.2, 0.2, -d / 2 + 2.5, 3.4, 3.2, 4, p.wall); b.box(w / 2 + 2.2, 3.4, -d / 2 + 2.5, 3.8, 0.3, 4.4, p.roof); }
        if (lv >= 3) { for (let i = 0; i < 3; i++) b.box(-w / 2 + 2.5 + i * 2.6, 5.6, 0.5, 2.2, 0.08, 3, "#1f3a5f"); b.box(0, 5.5, d / 2 - 0.6, 0.1, 3.4, 0.1, "#ddd"); b.box(0.6, 8.2, d / 2 - 0.6, 1.4, 0.8, 0.05, "#2f7d46"); }
      }
      b.pop();
    });
  }
  function irrMesh(f, lv) {
    const OP = OSW.EX.plotPos;
    return memo(`irr|${f.id}|${lv}`, (b) => {
      const pts = f.plots.map((i) => OP(i)), rows = {}; pts.forEach((p) => (rows[p.z] = rows[p.z] || []).push(p)); A._heads = A._heads || {}; const heads = (A._heads[f.id] = []);
      Object.keys(rows).forEach((zk) => {
        const row = rows[zk].sort((a, c) => a.x - c.x), z = +zk, x0 = row[0].x - 2.4, x1 = row[row.length - 1].x + 2.4;
        b.box((x0 + x1) / 2, 0.14, z + 2.45, x1 - x0, 0.1, 0.12, "#2b7bb9");
        for (let i = 0; i < row.length - 1; i++) { const x = (row[i].x + row[i + 1].x) / 2; heads.push({ x, z }); b.cyl(x, 0.12, z, 0.07, 0.07, 0.7, "#37474f", 5); b.sphere(x, 0.85, z, 0.2, 0.12, 0.2, "#2b7bb9", 6); b.box(x, 0.14, (z + z + 2.45) / 2, 0.1, 0.1, 2.45, "#2b7bb9"); }
        if (lv >= 2) row.forEach((p) => { for (let k = -1; k <= 1; k++) b.box(p.x + k * 1.2, 0.5, p.z, 0.06, 0.06, 4.0, "#101820"); });
      });
      const pm = f.pump; b.box(pm.x, 0.04, pm.z, 3.6, 0.08, 3.6, "#a8a29a"); b.box(pm.x, 0.12, pm.z, 2.0, 1.8, 1.6, "#cfd8dc"); b.box(pm.x, 1.92, pm.z, 2.4, 0.2, 2.0, "#4a7fb5");
      b.cyl(pm.x + 1.7, 0.12, pm.z - 0.8, 0.9, 0.9, 2.4, "#4a90c2", 10); b.sphere(pm.x + 1.7, 2.5, pm.z - 0.8, 0.9, 0.4, 0.9, "#3a7fb2", 8); if (lv >= 2) { b.cyl(pm.x + 1.7, 0.12, pm.z + 0.9, 0.9, 0.9, 2.4, "#4a90c2", 10); b.box(pm.x, 0.5, pm.z + 2.1, 0.3, 0.3, 1.2, "#2b7bb9"); }
      const gx = pm.x < f.cx ? f.cx - f.hw - 1 : f.cx + f.hw + 1; b.box((pm.x + gx) / 2, 0.14, pm.z, Math.abs(gx - pm.x), 0.14, 0.18, "#2b7bb9");
    });
  }
  const tractorMesh = () => memo("tractor", (b) => {
    b.box(0, 0.45, 0, 1.5, 0.9, 2.4, "#3a9d4f"); b.box(0, 0.8, 0.95, 1.3, 0.75, 1.3, "#2f8442"); b.box(0, 1.35, -0.5, 1.4, 1.25, 1.3, "#dff0f7"); b.box(0, 2.6, -0.5, 1.6, 0.14, 1.5, "#2f8442"); [-0.62, 0.62].forEach((x) => b.box(x, 1.4, -0.5, 0.1, 1.2, 0.1, "#2f8442"));
    b.cyl(0.4, 1.5, 1.1, 0.07, 0.07, 1.0, "#444", 6); b.box(0, 0.25, 1.75, 1.2, 0.35, 0.18, "#555"); b.sphere(-0.45, 0.9, 1.62, 0.16, 0.16, 0.1, "#fff7c2", 5, 1); b.sphere(0.45, 0.9, 1.62, 0.16, 0.16, 0.1, "#fff7c2", 5, 1);
    [[-0.55, 0.62, -0.7, 0.62, 0.34], [0.85, 0.62, -0.7, 0.62, 0.34], [-0.7, 0.4, 0.95, 0.4, 0.24], [0.95, 0.4, 0.95, 0.4, 0.24]].forEach(([x, y, z, r, wd]) => { b.push(x, y, z, 0, 0, PI / 2); b.cyl(0, 0, 0, r, r, wd, "#2b2b2b", 10); b.cyl(0, wd - 0.02, 0, r * 0.45, r * 0.45, 0.06, "#f2c230", 8); b.pop(); });
    b.box(0, 0.4, -1.45, 1.4, 0.2, 0.4, "#555");
  });
  const shipMesh = () => memo("ship", (b) => {
    b.box(0, 0, 0, 34, 2.6, 7.6, "#37474f"); b.box(0, 0, 0, 34.2, 0.7, 7.7, "#c0392b"); b.sphere(17, 1.3, 0, 3.4, 1.3, 3.8, "#37474f", 8); b.box(0, 2.6, 0, 32, 0.2, 7, "#8d6e63");
    b.box(-11, 2.8, 0, 5.5, 4.2, 6.2, "#f1ece0"); b.box(-11, 7.0, 0, 6.2, 0.4, 6.8, "#1f5f8b"); [-1, 1].forEach((s) => b.box(-8.2, 4.4, s * 1.8, 0.1, 1.2, 1.4, "#9bd1f0")); b.box(-11, 7.4, 0, 3, 1.6, 4, "#f1ece0"); b.cyl(-13, 7.4, 0, 0.9, 0.9, 2.8, "#e63946", 8); b.box(-13, 9.4, 0, 1.9, 0.3, 1.9, "#222");
    b.box(15, 2.8, 0, 0.1, 5, 0.1, "#ddd"); b.box(15.5, 7.4, 0, 1.4, 0.6, 0.04, "#2a9d8f");
  });
  A.mkChar = (look) => (OSW.makeChar ? OSW.makeChar(look) : null);
  const chars = {};
  const ROLECOL = { farmer: "#8fbf4d", driver: "#f2a33a", factory: "#4a7fb5", mechanic: "#e63946" };
  function charOf(w) { return chars[w.id] || (chars[w.id] = OSW.makeChar({ gender: w.girl ? "girl" : "boy", color: ROLECOL[w.role], hair: ["#2a1d12", "#6b4423", "#1b1b1b", "#a0522d"][hash(w.id) % 4], hairStyle: w.girl ? "ponytail" : "short", pants: "#34495e", scale: 1 })); }

  /* ---------- حركة الجرارات والعمال ---------- */
  A.tractorState = (c, tr, idx, t) => {
    const f = tr.field && A.fieldById(tr.field);
    if (!f) { const D = POS.depot; return { x: D.x + (idx % 2 ? 2.4 : -2.4), z: D.z - 0.6 + Math.floor(idx / 2) * 2.4, h: PI, working: false }; }
    const dr = A.workersOn(c, "driver", tr.id).length > 0;
    if (tr.broken || !dr) return { x: f.park.x + 1.6 * (idx % 2), z: f.park.z + 1.8 * Math.floor(idx / 2), h: PI / 2, working: false };
    const L = 2 * (f.hw * 1.7) + 2 * (f.hd * 1.7), u = ((t * 2.6 + idx * L * 0.5) % L) / L, ax = f.hw * 0.85, az = f.hd * 0.85, W_ = 2 * ax, H_ = 2 * az, s = u * (2 * W_ + 2 * H_);
    let x, z, h; if (s < W_) { x = f.cx - ax + s; z = f.cz - az; h = PI / 2; } else if (s < W_ + H_) { x = f.cx + ax; z = f.cz - az + (s - W_); h = 0; } else if (s < 2 * W_ + H_) { x = f.cx + ax - (s - W_ - H_); z = f.cz + az; h = -PI / 2; } else { x = f.cx - ax; z = f.cz + az - (s - 2 * W_ - H_); h = PI; }
    return { x, z, h, working: true };
  };
  A.workerState = (S, c, w, idx, t) => {
    const seed = (hash(w.id) % 100) / 10, lobby = { x: POS.hq.x - 8 + (idx % 8) * 2.3, z: POS.hq.z - 7.4, ry: PI, mv: 0 };
    if (!w.to || w.strike || w.sick) return lobby;
    if (w.role === "farmer") { const f = A.fieldById(w.to); if (!f) return lobby; const a = 0.31 * t + seed, b2 = 0.17 * t + seed * 1.7, x = f.cx + f.hw * 0.7 * sin(a), z = f.cz + f.hd * 0.7 * sin(b2); return { x, z, ry: Math.atan2(f.hw * 0.7 * 0.31 * cos(a), f.hd * 0.7 * 0.17 * cos(b2)), mv: 1 }; }
    if (w.role === "driver") { const i = c.tr.findIndex((x) => x.id === w.to); if (i < 0) return lobby; const ts = A.tractorState(c, c.tr[i], i, t); return ts.working ? { x: ts.x, z: ts.z, ry: ts.h, mv: 0, y0: 1.15, pose: { sit: 1 } } : { x: ts.x - 1.8, z: ts.z, ry: PI / 2, mv: 0 }; }
    if (w.role === "factory") { const p = PLANTS[w.to]; if (!p) return lobby; const k = c.w.filter((x) => x.role === "factory" && x.to === w.to).findIndex((x) => x.id === w.id); return { x: p.x - 3 + k * 3 + 1.6 * sin(0.45 * t + seed), z: p.z - p.d / 2 - 2.2, ry: cos(0.45 * t + seed) > 0 ? PI / 2 : -PI / 2, mv: 1 }; }
    const D = POS.depot; return { x: D.x + 5 * sin(0.3 * t + seed), z: D.z - D.d / 2 - 3, ry: cos(0.3 * t + seed) > 0 ? PI / 2 : -PI / 2, mv: 1 };
  };

  /* =====================================================================
     الرسم كل إطار
     ===================================================================== */
  const mm = new Float32Array(16), m2 = new Float32Array(16);
  const near = (o, x, z, r) => hy(o.x - x, o.z - z) < r;
  function drawPallets(items, x0, z0, dx, perRow, rowDz, max, y0) {
    items.slice(0, max).forEach((col, i) => { M.trs(x0 + (i % perRow) * dx, y0 || 0.12, z0 + Math.floor(i / perRow) * rowDz, 0, 0, 0, 1, 1, 1, mm); R.draw(palletMesh(col), mm); });
  }
  function drawVillage(t, S, c, me, now) {
    // مصانع
    Object.keys(PLANTS).forEach((id) => {
      const p = PLANTS[id]; if (!near(me, p.x, p.z, 150)) return; const pl = c.on ? c.pl[id] : null, built = !!(pl && pl.built), lv = pl ? pl.lv : 1;
      R.draw(plantMesh(id, built, lv), null, pl && pl.broken ? [1, 0.62, 0.6] : null);
      if (built && pl.job && !pl.broken) { const sp = SMOKE[id]; R.blend(true); for (let i = 0; i < 4; i++) { const age = (t * 0.35 + i * 0.25) % 1; M.trs(p.x + sp[0] + age * 1.4, sp[1] + age * 5, p.z + sp[2], 0, 0, 0, 0.7 + age * 1.6, 0.7 + age * 1.6, 0.7 + age * 1.6, mm); R.draw(smokeMesh(), mm, [0.86, 0.86, 0.88], 0.55 * (1 - age)); } R.blend(false); }
    });
    // مخزن الشركة: بضاعة جاهزة + طبليات مجهّزة للشحن قدّام المبنى
    if (c.on && near(me, POS.wh.x, POS.wh.z, 120)) {
      const items = []; Object.keys(c.goods).forEach((k) => { const n = Math.min(8, Math.ceil(c.goods[k] / 8)); for (let i = 0; i < n; i++) items.push(GCOL[k] || "#bbb"); });
      drawPallets(items, POS.wh.x - 6.3, POS.wh.z - POS.wh.d / 2 - 2.4, 1.15, 12, 1.3, 24);
      const pk = []; Object.keys(c.pack).forEach((cid) => { const k = c.acc[cid]; for (let i = 0; i < c.pack[cid]; i++) pk.push(GCOL[k ? k.item : "bread"] || "#bbb"); });
      drawPallets(pk, POS.wh.x - 6.3, POS.wh.z - POS.wh.d / 2 - 4.6, 1.3, 11, 1.2, 22);
    }
    if (!c.on) return;
    // الأراضي: ري + مضخة
    FIELDS.forEach((f) => {
      if (!near(me, f.cx, f.cz, 160)) return; const lv = c.irr[f.id] || 0; if (!lv || !(S.lands && S.lands[f.id]) && f.id !== "f0") return;
      const dry = !!c.dry[f.id]; R.draw(irrMesh(f, lv), null, dry ? [1, 0.7, 0.55] : null);
      if (!dry && A._heads && A._heads[f.id]) { R.blend(true); A._heads[f.id].forEach((h, i) => { for (let k = 0; k < 3; k++) { const ph = (t * 1.6 + i * 0.37 + k * 0.33) % 1; M.trs(h.x + (k - 1) * 0.8 * ph, 0.9 + sin(ph * PI) * 1.1, h.z + (k % 2 ? 0.6 : -0.6) * ph, 0, 0, 0, 0.3, 0.3, 0.3, mm); R.draw(waterMesh(), mm, null, 0.5 * (1 - ph * 0.6)); } }); R.blend(false); }
    });
    // جرارات
    c.tr.forEach((tr, i) => {
      const st = A.tractorState(c, tr, i, t); if (!near(me, st.x, st.z, 160)) return;
      M.trs(st.x, 0, st.z, st.h, 0, 0, 1, 1, 1, mm); R.draw(tractorMesh(), mm, tr.broken ? [1, 0.7, 0.65] : null);
      if (tr.broken) { R.blend(true); for (let k = 0; k < 3; k++) { const age = (t * 0.5 + k / 3) % 1; M.trs(st.x + 0.3, 1.9 + age * 2.4, st.z + 1.0, 0, 0, 0, 0.4 + age, 0.4 + age, 0.4 + age, mm); R.draw(smokeMesh(), mm, [0.3, 0.3, 0.3], 0.6 * (1 - age)); } R.blend(false); }
    });
    // عمال
    if (OSW.drawChar && OSW.makeChar) c.w.forEach((w, i) => {
      const s = A.workerState(S, c, w, i, t); if (!near(me, s.x, s.z, 130)) return;
      OSW.drawChar(charOf(w), s.x, s.z, s.ry, t * 6 + i * 2, s.mv, t, 1, w.sick ? [1, 0.85, 0.85] : null, 1, s.y0 || 0, s.pose || (w.role === "farmer" && s.mv ? { carry: 1 } : undefined));
    });
    // إنذارات المشاكل: منارة حمراء فوق الموقع
    A.activeIssues(S).forEach((is) => { const l = A.issueLoc(S, is, Date.now()); if (!near(me, l.x, l.z, 200)) return; const bob = sin(t * 3) * 0.25; R.blend(true); M.trs(l.x, 6.6 + bob, l.z, t * 1.5, 0, 0, 1, 1, 1, mm); R.draw(beaconMesh(), mm, null, 0.9); R.blend(false); });
  }
  function drawPort(t, S, c, me, now) {
    if (!near(me, POS.ship.x, POS.ship.z, 220)) return;
    // السفينة: راسية، أو بتبحر بعد الشحن وبترجع سفينة جديدة
    const since = c && c.shipT ? now - c.shipT : 1e9; let sx = POS.ship.x, sz = POS.ship.z, show = true, load = true;
    if (since < 60000) { const u = since / 60000; sz += u * u * 160; } else if (since < 240000) show = false; else if (since < 300000) { const u = (since - 240000) / 60000; sz += (1 - u) * (1 - u) * 160; load = false; }
    if (show) {
      const bob = sin(t * 1.3) * 0.12; M.trs(sx, -0.2 + bob, sz, 0, sin(t * 0.9) * 0.02, 0, 1, 1, 1, mm); R.draw(shipMesh(), mm);
      const cols = since < 60000 ? ["#e63946", "#2a9d8f", "#ffd23f", "#4dabf7", "#9b5de5", "#ff8c42", "#e63946", "#2a9d8f"] : ["#4dabf7", "#ffd23f", "#2a9d8f"];
      if (load) cols.forEach((col, i) => { M.trs(sx + 2 + (i % 4) * 2.8 - 3, 2.8 + Math.floor(i / 4) * 1.4 - 0.2 + bob, sz + (i % 2 ? 1.6 : -1.6), 0, 0, 0, 1, 1, 1, m2); R.draw(contMesh(col), m2); });
    }
    // طبليات الميناء (بالساحة)
    if (c && c.on) { const items = []; Object.keys(c.dock).forEach((cid) => { const k = c.acc[cid]; for (let i = 0; i < c.dock[cid]; i++) items.push(GCOL[k ? k.item : "bread"] || "#bbb"); }); items.slice(0, 30).forEach((col, i) => { M.trs(70 + (i % 6) * 1.3, 0.12 + Math.floor(i / 18) * 0.85, 1272 + Math.floor((i % 18) / 6) * 1.3, 0, 0, 0, 1, 1, 1, mm); R.draw(palletMesh(col), mm); }); }
  }
  A.draw = (t) => {
    try {
      const w = W(); if (!w || w.mode !== "out" || !R.gl) return; const me = w._int.me; const S = G().state(), c = S.co || { on: false, pl: {}, tr: [], w: [], irr: {}, dry: {}, goods: {}, pack: {}, dock: {}, acc: {} };
      if (me.z > 1000) drawPort(t, S, c, me, Date.now()); else drawVillage(t, S, c, me, Date.now());
    } catch (e) { if (!A._derr) { A._derr = 1; console.error("agri.draw", e); } }
  };

  /* ---------- طبليات فوق السيارات (بنلفّ دالة رسم الكراتين الموجودة) ---------- */
  try {
    const L = OSW.logi; if (L && L.drawCar && !L._agriCar) {
      const od = L.drawCar, slot = (kind, i, n) => { const D = V().CARS[kind], Pp = D.shape, hl = Pp.len / 2, lift = Pp.lift || 0;
        if (Pp.bed) { const k = i % 6, row = Math.floor(k / 2), cl = k % 2, layer = Math.floor(i / 6); return { x: cl ? 0.42 : -0.42, y: 0.42 + lift + layer * 0.45, z: -hl + 0.5 + row * 0.62 }; }
        const rows = Math.ceil(n / 2), cf = hl - Pp.hood, cb = -hl + Pp.trunk, cz = (cf + cb) / 2, row = Math.floor(i / 2), cl = i % 2, y = Pp.open ? Pp.y1 - 0.08 + lift : Math.max(Pp.roof, Pp.y1 + 0.78) + 0.05 + lift; return { x: cl ? 0.4 : -0.4, y, z: cz + (row - (rows - 1) / 2) * 0.56 }; };
      L.drawCar = (car, x, z, h) => {
        od(car, x, z, h);
        try { const pal = car.pal; if (!pal || !pal.length || !V().CARS[car.car]) return; const base = (car.crates || []).length, n = base + pal.length, s = sin(h), co = cos(h);
          pal.forEach((p, j) => { const sl = slot(car.car, base + j, n); M.trs(x + sl.x * co + sl.z * s, sl.y, z - sl.x * s + sl.z * co, h, 0, 0, 0.58, 0.58, 0.58, mm); R.draw(palletMesh(GCOL[p.item] || "#bbb"), mm); }); } catch (e) { /* */ }
      };
      L._agriCar = 1;
    }
  } catch (e) { console.error("agri3d.car", e); }
})();
