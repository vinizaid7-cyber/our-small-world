/* ============================================================
   عالمنا الصغير — بيانات الجزر الست (الحساب 2: العالم والتصميم)
   مصدر الحقيقة الوحيد للمعرفات والإحداثيات. ما فيه أي اعتماد على المحرك:
   - المتصفح: window.OSW_ISL
   - Node: require("./islands_data.js")  (بيستعمله tools/gen_integration.js و tests/islands/test_data.js)
   قاعدة: المعرفات (id) ثابتة. ما بتتغيّر بعد التسليم إلا بالتنسيق مع الحساب الثاني.
   كل الإحداثيات (x,z) إحداثيات عالم حقيقية (متر). الاتجاهات f: 0=+z ، 1=+x ، 2=-z ، 3=-x
   ============================================================ */
(function (root) {
  const PI = Math.PI, hy = Math.hypot;
  const D = { v: 1, islands: {}, order: [], sites: [], points: [], parcels: [], roads: [], bridges: [], interiors: {}, legacy: [] };

  /* ---------- الجزر ---------- */
  const ISL = (id, o) => { D.islands[id] = Object.assign({ id, sites: [], pts: [], ext: [] }, o); D.order.push(id); };
  ISL("ISL_BUSINESS", { n: "جزيرة الاستثمار والأعمال", e: "💼", c: { x: -420, z: 230 }, r: 150, built: true, scene: "ISL_BUSINESS (islands_gen2.js)", note: "أبراج ومقر الشركة والبورصة والبنك ومركز المؤتمرات" });
  ISL("ISL_PORT", { n: "جزيرة الميناء والنقل", e: "⚓", c: { x: -440, z: 1110 }, r: 150, built: true, scene: "ISL_PORT (islands_gen2.js)", note: "أرصفة وسفن ورافعات وساحة حاويات ومستودعات ومحطة عبّارة" });
  ISL("ISL_AGRI", { n: "الجزيرة الزراعية العملاقة", e: "🌾", c: { x: -480, z: 670 }, r: 270, built: true, scene: "ISL_AGRI (islands_gen3.js)", note: "36 قطعة زراعية جاهزة + مناطق توسّع + بيوت زجاجية وحظائر وساحة معدات" });
  ISL("ISL_INDUSTRY", { n: "جزيرة الصناعة والمصانع", e: "🏭", c: { x: 360, z: 130 }, r: 170, built: true, scene: "ISL_INDUSTRY (islands_gen3.js)", note: "6 مصانع بتصاميم مختلفة + محطة طاقة ومستودعات ومرأب شاحنات" });
  ISL("ISL_CITY", { n: "جزيرة المدينة والخدمات", e: "🏙️", c: { x: 270, z: 600 }, r: 200, built: false, legacy: true, scene: "city.js / city_blocks.js / city_int.js (موجودة من V11 — ما انلمست)", note: "المدينة الكبرى 5×5 بلوك: فندق، مجمّع، مستشفى، شرطة، مطاعم، ميناء السوق" });
  ISL("ISL_LIFE", { n: "جزيرة الحياة والترفيه والتعليم", e: "🎡", c: { x: 700, z: 600 }, r: 170, built: true, scene: "ISL_LIFE (islands_gen3.js)", note: "مدرسة وجامعة ومكتبة وسينما وملاهي ودولاب هوائي وملعب وحديقة وشاطئ" });

  /* ---------- أدوات ---------- */
  const wp = (id, u, v) => { const c = D.islands[id].c; return { x: +(c.x + u).toFixed(2), z: +(c.z + v).toFixed(2) }; };
  const DIR = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const doorOf = (x, z, w, d, f) => { const h = f % 2 ? w / 2 : d / 2, dx = DIR[f][0], dz = DIR[f][1]; return { door: { x: +(x + dx * h).toFixed(2), z: +(z + dz * h).toFixed(2) }, front: { x: +(x + dx * (h + 7)).toFixed(2), z: +(z + dz * (h + 7)).toFixed(2) } }; };
  const SITE = (isl, id, kind, style, n, e, u, v, w, d, h, f, o) => {
    const p = wp(isl, u, v), s = Object.assign({ id, isl, kind, style, n, e, x: p.x, z: p.z, w, d, h, f, solid: kind !== "zone", enter: null, pts: [] }, doorOf(p.x, p.z, w, d, f), o || {});
    D.sites.push(s); D.islands[isl].sites.push(id); return s;
  };
  const PT = (isl, id, kind, n, u, v, r, site) => { const p = wp(isl, u, v); D.points.push({ id, isl, kind, n, x: p.x, z: p.z, r: r || 3, site: site || null }); D.islands[isl].pts.push(id); return p; };
  const ROAD = (isl, id, w, pts) => D.roads.push({ id, isl, w, pts: pts.map(([u, v]) => { const p = wp(isl, u, v); return [p.x, p.z]; }) });
  const ZONE = (isl, id, style, n, e, u, v, w, d, o) => SITE(isl, id, "zone", style, n, e, u, v, w, d, 0, 0, o);
  const chord = (isl, v) => Math.sqrt(Math.max(0, D.islands[isl].r * D.islands[isl].r - v * v));

  /* ---------- الجسور ---------- */
  // الجسر بيربط الطريق الطويل (x=0) أو ممر المدينة بالجزيرة. dir: -1 غرب، +1 شرق
  const BR = (id, isl, z, xa, dir, w, note) => {
    const I = D.islands[isl], dz = z - I.c.z, edge = I.c.x - dir * Math.sqrt(I.r * I.r - dz * dz), xb = edge + dir * 3;
    D.bridges.push({ id, isl, z, xa, xb: +xb.toFixed(2), w: w || 10, dir, x0: Math.min(xa, xb), x1: Math.max(xa, xb), note });
    I.bridge = id; return { x: +edge.toFixed(2), z };
  };
  const brB = BR("BRG_BUSINESS", "ISL_BUSINESS", 230, -3, -1, 10, "يتفرّع من الطريق الطويل عند z=230");
  const brP = BR("BRG_PORT", "ISL_PORT", 1040, -3, -1, 10, "يتفرّع من الطريق الطويل عند z=1040 (شمال الجزيرة الثانية)");
  const brA = BR("BRG_AGRI", "ISL_AGRI", 670, -3, -1, 10, "يتفرّع من الطريق الطويل عند z=670");
  const brI = BR("BRG_INDUSTRY", "ISL_INDUSTRY", 150, 3, 1, 10, "يتفرّع من الطريق الطويل عند z=150 شرقاً");
  const brL = BR("BRG_LIFE", "ISL_LIFE", 600, 504, 1, 8, "امتداد الممر الخشبي لمدينة (طرف المرسى x≈508) نحو جزيرة الحياة");

  /* ---------- نقاط دخول/خروج لكل جزيرة (بوابة الجسر) ---------- */
  const gate = (isl, id, ex, f) => {
    const I = D.islands[isl], s = Math.sign(I.c.x - ex.x) || 1;
    PT(isl, id + "_ENTRY", "entry", "بوابة دخول " + I.n, ex.x - I.c.x + s * 20, ex.z - I.c.z, 4);
    PT(isl, id + "_EXIT", "exit", "بوابة خروج " + I.n, ex.x - I.c.x + s * 8, ex.z - I.c.z, 4);
    I.arrive = wp(isl, ex.x - I.c.x + s * 24, ex.z - I.c.z + 6);
  };
  gate("ISL_BUSINESS", "BIZ_GATE", brB); gate("ISL_PORT", "PORT_GATE", brP); gate("ISL_AGRI", "AGRI_GATE", brA); gate("ISL_INDUSTRY", "IND_GATE", brI); gate("ISL_LIFE", "LIFE_GATE", brL);

  /* ==================== 1) الأعمال ==================== */
  const B = "ISL_BUSINESS";
  ROAD(B, "BIZ_R_EW", 14, [[-150, 0], [150, 0]]); ROAD(B, "BIZ_R_NS", 14, [[0, -150], [0, 150]]);
  ROAD(B, "BIZ_R_N2", 10, [[-140, -60], [140, -60]]); ROAD(B, "BIZ_R_S2", 10, [[-140, 62], [140, 62]]);
  SITE(B, "BIZ_HQ", "hq", "stepped", "مبنى الشركة (المقر الرئيسي)", "🏢", 58, -34, 34, 28, 42, 0, { enter: "isl_hq", wall: "#e8e2d4", glass: "#5f93b8" });
  SITE(B, "BIZ_EXCH", "exchange", "classic", "البورصة", "📈", 108, -34, 30, 24, 18, 0, { wall: "#efe6d2" });
  SITE(B, "BIZ_BANK", "bank", "classic", "البنك المركزي", "🏦", -58, -34, 30, 26, 20, 0, { wall: "#e4dccb" });
  SITE(B, "BIZ_OFF4", "office", "slab", "مكاتب الاستثمار الشرقية", "🏬", -108, -34, 28, 26, 30, 0, { wall: "#d9cfc6", glass: "#6aa3c9" });
  SITE(B, "BIZ_TWR1", "tower", "glass", "برج الاستثمار الأول", "🏙️", 28, -84, 24, 24, 70, 0, { wall: "#cfd6dc", glass: "#5f93b8" });
  SITE(B, "BIZ_TWR2", "tower", "round", "برج الاستثمار الثاني", "🏙️", -28, -84, 24, 24, 58, 0, { wall: "#e9dfcf", glass: "#7fb6d6" });
  SITE(B, "BIZ_CONF", "conference", "hall", "مركز المؤتمرات", "🎤", 58, 36, 40, 28, 16, 2, { wall: "#e6d8c3" });
  SITE(B, "BIZ_OFF1", "office", "slab", "مكاتب الشركات 1", "🏬", -58, 36, 30, 26, 34, 2, { wall: "#efe3d3", glass: "#8cc0dc" });
  SITE(B, "BIZ_OFF2", "office", "slab", "مكاتب الشركات 2", "🏬", 108, 36, 26, 24, 30, 2, { wall: "#d9cfc6", glass: "#6aa3c9" });
  SITE(B, "BIZ_OFF3", "office", "slab", "مكاتب الشركات 3", "🏬", -108, 40, 28, 24, 26, 2, { wall: "#f0e6d8", glass: "#5f93b8" });
  SITE(B, "BIZ_TWR3", "tower", "stepped", "برج الأعمال الثالث", "🏙️", 28, 92, 24, 24, 52, 2, { wall: "#dcd2c0", glass: "#6aa3c9" });
  SITE(B, "BIZ_TWR4", "tower", "twin", "البرجان التوأم", "🏙️", -28, 92, 24, 24, 46, 2, { wall: "#cfd6dc", glass: "#7fb6d6" });
  SITE(B, "BIZ_LOUNGE", "lounge", "classic", "صالة المستثمرين", "🥂", 80, 90, 28, 22, 12, 2, { wall: "#f2d8b8" });
  ZONE(B, "BIZ_PARK", "parking", "موقف السيارات", "🅿️", -76, -88, 44, 22);
  ZONE(B, "BIZ_PLAZA", "plaza", "ساحة الأعمال المركزية", "⛲", 0, 0, 68, 68, { r: 34 });
  PT(B, "BIZ_HQ_IN", "entry", "مدخل مقر الشركة", 58, -34 + 14 + 3, 3, "BIZ_HQ");
  PT(B, "BIZ_CARGO", "handover", "نقطة تسليم مستندات/معدات مكتبية", 28, -2, 4);

  /* ==================== 2) الميناء ==================== */
  const P = "ISL_PORT";
  ROAD(P, "PORT_R_ENTRY", 12, [[133, -70], [-98, -70]]); ROAD(P, "PORT_R_QUAY", 12, [[-98, -120], [-98, 110]]); ROAD(P, "PORT_R_MID", 12, [[-98, 40], [100, 40]]);
  const pierV = [-66, -22, 22, 66];
  pierV.forEach((v, i) => { D.islands[P].ext.push({ id: "PORT_PIER_" + (i + 1), x0: -215, x1: -100, v0: v - 8, v1: v + 8, kind: "pier" }); });
  [-44, 0, 44].forEach((v, i) => { const p = wp(P, -168, v); D.points.push({ id: "PORT_BERTH_" + (i + 1), isl: P, kind: "berth", n: "رصيف سفينة " + (i + 1), x: p.x, z: p.z, r: 9, site: null }); D.islands[P].pts.push("PORT_BERTH_" + (i + 1)); });
  SITE(P, "PORT_WH1", "warehouse", "shed", "المستودع الأول", "🏭", 40, -90, 56, 22, 14, 0, { enter: "isl_warehouse", wall: "#b9c2c9", roof: "#4a6076" });
  SITE(P, "PORT_WH2", "warehouse", "shed", "المستودع الثاني", "🏭", 40, -46, 56, 26, 14, 2, { wall: "#c9c2b6", roof: "#7a4a3a" });
  SITE(P, "PORT_TERM", "terminal", "tower", "مبنى إدارة الميناء", "🏢", 70, 0, 30, 22, 28, 2, { wall: "#e4e8ec", glass: "#5f93b8" });
  SITE(P, "PORT_CUST", "customs", "slab", "مبنى الجمارك", "🛃", 20, 4, 20, 16, 10, 2, { wall: "#d9cfc6", glass: "#6aa3c9" });
  SITE(P, "PORT_FERRY", "ferry", "hall", "محطة العبّارة والركّاب", "⛴️", 0, 106, 40, 20, 12, 2, { wall: "#e6eef2" });
  SITE(P, "PORT_LIGHT", "lighthouse", "lighthouse", "منارة الميناء", "🗼", -20, -134, 8, 8, 30, 0, {});
  ZONE(P, "PORT_YARD", "containers", "ساحة الحاويات", "📦", -55, -13, 70, 88);
  ZONE(P, "PORT_TRUCKS", "truckpark", "موقف الشاحنات", "🚛", 45, 80, 60, 30);
  ZONE(P, "PORT_TANKS", "tanks", "خزانات الوقود", "🛢️", 96, 70, 36, 28);
  PT(P, "PORT_LOAD_1", "load", "تحميل: رصيف المستودع الأول", 40, -90 + 11 + 5, 4, "PORT_WH1");
  PT(P, "PORT_UNLOAD_1", "unload", "تفريغ: رصيف المستودع الأول", 20, -90 + 11 + 5, 4, "PORT_WH1");
  PT(P, "PORT_LOAD_2", "load", "تحميل: رصيف المستودع الثاني", 40, -46 - 13 - 5, 4, "PORT_WH2");
  PT(P, "PORT_UNLOAD_2", "unload", "تفريغ: رصيف المستودع الثاني", 58, -46 - 13 - 5, 4, "PORT_WH2");
  PT(P, "PORT_LOAD_YARD", "load", "تحميل: ساحة الحاويات (رافعة)", -98 + 8, -13, 4, "PORT_YARD");
  PT(P, "PORT_UNLOAD_SHIP", "unload", "تفريغ: السفينة ← الرصيف 2", -130, -22, 5);
  PT(P, "PORT_HANDOVER", "handover", "نقطة تسليم المعدات (الميناء)", 20, 28, 4);
  PT(P, "PORT_PAX", "entry", "رصيف الركّاب", 0, 94, 4, "PORT_FERRY");

  /* ==================== 3) الزراعة ==================== */
  const A = "ISL_AGRI";
  ROAD(A, "AGRI_R_EW", 10, [[-270, 0], [250, 0]]); ROAD(A, "AGRI_R_NS", 10, [[0, -250], [0, 250]]);
  ROAD(A, "AGRI_R_WEST", 8, [[-158, -150], [-158, 170]]);
  // 36 قطعة: 4 أرباع × 3×3، كل قطعة 44×34 (دور 46×36)
  const CROPS = ["wheat", "tomato", "cucumber", "carrot", "corn", "sunflower", "wheat", "lemon", "strawberry", "olive"];
  let pn = 0;
  [[1, -1], [-1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], q) => {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const u = sx * (12 + i * 46 + 23), v = sz * (12 + j * 36 + 18), c = wp(A, u, v), id = "FARM_P" + String(++pn).padStart(2, "0");
      D.parcels.push({ id, isl: A, q: ["NE", "NW", "SW", "SE"][q], x: c.x, z: c.z, x0: +(c.x - 22).toFixed(2), x1: +(c.x + 22).toFixed(2), z0: +(c.z - 17).toFixed(2), z1: +(c.z + 17).toFixed(2), crop: CROPS[(pn * 7) % CROPS.length], status: "leasable", area: 44 * 34 });
    }
  });
  SITE(A, "AGRI_HQ", "office", "farmhq", "مقر المزرعة الكبير", "🏡", -196, -50, 30, 24, 10, 1, { wall: "#f0e6d8", roof: "#a4452c" });
  SITE(A, "AGRI_BARN1", "barn", "barn", "الحظيرة الكبرى", "🏚️", -200, 40, 34, 24, 12, 1, { wall: "#a4452c", roof: "#6b3a2a" });
  SITE(A, "AGRI_SILO", "silo", "silos", "صوامع الحبوب", "🌾", -198, -102, 26, 26, 22, 1, {});
  SITE(A, "AGRI_PENS", "pens", "pens", "حظائر الماشية والأغنام", "🐄", 190, -80, 40, 56, 4, 3, {});
  SITE(A, "AGRI_COOP", "coop", "barn", "مداجن الدجاج", "🐔", 190, 32, 28, 18, 8, 3, { wall: "#e9dfcf", roof: "#7a5236" });
  SITE(A, "AGRI_MILL", "mill", "windmill", "طاحونة الهواء", "🌬️", 200, 80, 14, 14, 22, 3, {});
  [-150, -110, -70, -30, 30, 70, 110].forEach((u, i) => SITE(A, "AGRI_GH" + (i + 1), "greenhouse", "glasshouse", "بيت زجاجي " + (i + 1), "🪟", u, -170, 34, 16, 6, 0, {}));
  ZONE(A, "AGRI_YARD", "yard", "ساحة المعدات والتسليم", "🚜", -196, 100, 44, 34);
  ZONE(A, "AGRI_ORCH", "orchard", "بستان الزيتون", "🫒", -90, 175, 110, 56);
  ZONE(A, "AGRI_POND", "pond", "بركة الري الرئيسية", "💧", 60, 172, 46, 36, { r: 20 });
  PT(A, "AGRI_EQ_1", "handover", "نقطة تسليم معدات: جرّارات", -208, 94, 4, "AGRI_YARD");
  PT(A, "AGRI_EQ_2", "handover", "نقطة تسليم معدات: حصّادات", -196, 108, 4, "AGRI_YARD");
  PT(A, "AGRI_EQ_3", "handover", "نقطة تسليم معدات: ري وأدوات", -184, 94, 4, "AGRI_YARD");
  PT(A, "AGRI_LOAD_1", "load", "تحميل المحاصيل: الصوامع", -176, -102, 5, "AGRI_SILO");
  PT(A, "AGRI_LOAD_2", "load", "تحميل: الحظيرة الكبرى", -176, 40, 5, "AGRI_BARN1");
  PT(A, "AGRI_UNLOAD_1", "unload", "تفريغ: مقر المزرعة", -174, -50, 5, "AGRI_HQ");
  PT(A, "AGRI_UNLOAD_2", "unload", "تفريغ: مركز الطاحونة", 184, 80, 5, "AGRI_MILL");
  // مناطق توسّع: بنفحص كل مرشّح ما يتقاطع مع شي ومحتوى داخل الجزيرة
  (function expansions() {
    const I = D.islands[A], R = I.r - 14, boxes = D.sites.filter((s) => s.isl === A && s.kind !== "zone" || s.id === "AGRI_ORCH" || s.id === "AGRI_POND" || s.id === "AGRI_YARD").map((s) => [s.x - s.w / 2 - 4, s.z - s.d / 2 - 4, s.x + s.w / 2 + 4, s.z + s.d / 2 + 4]).concat(D.parcels.map((p) => [p.x0 - 4, p.z0 - 4, p.x1 + 4, p.z1 + 4]));
    D.roads.filter((r) => r.isl === A).forEach((r) => { for (let i = 0; i < r.pts.length - 1; i++) { const [a, b] = r.pts[i], [c2, d2] = r.pts[i + 1]; boxes.push([Math.min(a, c2) - r.w / 2 - 2, Math.min(b, d2) - r.w / 2 - 2, Math.max(a, c2) + r.w / 2 + 2, Math.max(b, d2) + r.w / 2 + 2]); } });
    let k = 0;
    [[80, 50], [64, 40]].forEach(([W, H]) => {
      for (let v = -240; v <= 200 && k < 10; v += 8) for (let u = -250; u <= 230 && k < 10; u += 8) {
        const c = wp(A, u + W / 2, v + H / 2), x0 = c.x - W / 2, x1 = c.x + W / 2, z0 = c.z - H / 2, z1 = c.z + H / 2;
        if ([[x0, z0], [x1, z0], [x0, z1], [x1, z1]].some(([x, z]) => hy(x - I.c.x, z - I.c.z) > R)) continue;
        if (boxes.some((b) => x0 < b[2] && x1 > b[0] && z0 < b[3] && z1 > b[1])) continue;
        const id = "FARM_EXP" + String(++k).padStart(2, "0"); boxes.push([x0 - 4, z0 - 4, x1 + 4, z1 + 4]);
        D.parcels.push({ id, isl: A, q: "EXP", x: +c.x.toFixed(2), z: +c.z.toFixed(2), x0, x1, z0, z1, crop: null, status: "expansion", area: W * H });
      }
    });
  })();

  /* ==================== 4) الصناعة ==================== */
  const N = "ISL_INDUSTRY";
  ROAD(N, "IND_R_MAIN", 12, [[-169, 20], [150, 20]]); ROAD(N, "IND_R_N", 10, [[-140, -62], [140, -62]]); ROAD(N, "IND_R_S", 10, [[-140, 108], [140, 108]]);
  ROAD(N, "IND_R_NS1", 10, [[-42, -140], [-42, 140]]); ROAD(N, "IND_R_NS2", 10, [[48, -140], [48, 140]]);
  SITE(N, "IND_F1", "factory", "sawtooth", "مصنع النسيج", "🧵", -84, -92, 62, 40, 12, 0, { wall: "#c9b79a", roof: "#8a5a3b" });
  SITE(N, "IND_F2", "factory", "food", "مصنع الأغذية", "🥫", 2, -92, 60, 40, 14, 0, { enter: "isl_factory", wall: "#e9ecef", roof: "#3a7d5c" });
  SITE(N, "IND_F3", "factory", "steel", "مصنع الصلب", "🔥", 90, -92, 56, 40, 18, 0, { wall: "#8d8a85", roof: "#4a4d55" });
  SITE(N, "IND_F4", "factory", "chemical", "مصنع الكيماويات", "⚗️", -92, 72, 70, 44, 12, 2, { wall: "#d9d4c4", roof: "#5a6a7a" });
  SITE(N, "IND_F5", "factory", "assembly", "مصنع التجميع الكبير", "🏗️", 2, 72, 72, 46, 16, 2, { enter: "isl_factory", wall: "#cfd6dc", roof: "#2b3a55" });
  SITE(N, "IND_F6", "factory", "packaging", "مصنع التغليف", "📦", 100, 72, 60, 40, 12, 2, { wall: "#e6d8c3", roof: "#a4452c" });
  SITE(N, "IND_PWR", "power", "power", "محطة الطاقة", "⚡", 110, -24, 44, 36, 14, 2, {});
  SITE(N, "IND_WH1", "warehouse", "shed", "مستودع المواد الخام", "🏭", -112, -22, 44, 26, 12, 0, { wall: "#b9c2c9", roof: "#4a6076" });
  SITE(N, "IND_WH2", "warehouse", "shed", "مستودع المنتجات", "🏭", -66, -22, 32, 26, 12, 0, { wall: "#c9c2b6", roof: "#7a4a3a" });
  SITE(N, "IND_DEPOT", "depot", "shed", "مرأب الشاحنات", "🚛", 12, -26, 50, 28, 10, 0, { wall: "#d9cfc6", roof: "#6b4a3a" });
  SITE(N, "IND_CANTEEN", "canteen", "slab", "مطعم العمّال", "🍽️", -140, 56, 22, 20, 8, 1, { wall: "#f2d8b8", glass: "#8cc0dc" });
  SITE(N, "IND_TOWER", "watertower", "watertower", "خزّان المياه", "🗼", -150, -38, 10, 10, 24, 0, {});
  ZONE(N, "IND_TRUCKS", "truckpark", "ساحة انتظار الشاحنات", "🚛", 124, 40, 50, 24);
  ["F1", "F2", "F3"].forEach((k) => { const s = D.sites.find((x) => x.id === "IND_" + k), p = wp(N, s.x - D.islands[N].c.x, s.z - D.islands[N].c.z + s.d / 2 + 5); PT(N, "IND_" + k + "_LOAD", "load", "تحميل: " + s.n, s.x - D.islands[N].c.x - 12, s.z - D.islands[N].c.z + s.d / 2 + 6, 4, s.id); PT(N, "IND_" + k + "_UNLOAD", "unload", "تفريغ مواد: " + s.n, s.x - D.islands[N].c.x + 12, s.z - D.islands[N].c.z + s.d / 2 + 6, 4, s.id); });
  ["F4", "F5", "F6"].forEach((k) => { const s = D.sites.find((x) => x.id === "IND_" + k), c = D.islands[N].c; PT(N, "IND_" + k + "_LOAD", "load", "تحميل: " + s.n, s.x - c.x - 12, s.z - c.z - s.d / 2 - 6, 4, s.id); PT(N, "IND_" + k + "_UNLOAD", "unload", "تفريغ مواد: " + s.n, s.x - c.x + 12, s.z - c.z - s.d / 2 - 6, 4, s.id); });
  PT(N, "IND_HANDOVER", "handover", "نقطة تسليم المعدات (المصانع)", 12, 4, 4);

  /* ==================== 6) الحياة والترفيه والتعليم ==================== */
  const L = "ISL_LIFE";
  ROAD(L, "LIFE_R_EW", 12, [[-170, 0], [150, 0]]); ROAD(L, "LIFE_R_NS", 10, [[-60, -150], [-60, 150]]); ROAD(L, "LIFE_R_N", 10, [[-60, -78], [130, -78]]); ROAD(L, "LIFE_R_S", 10, [[-60, 64], [140, 64]]);
  SITE(L, "LIFE_SCHOOL", "school", "school", "المدرسة", "🏫", -105, -45, 54, 32, 12, 0, { enter: "isl_school", wall: "#f0e0b8", roof: "#a4452c" });
  SITE(L, "LIFE_UNI_A", "university", "classic", "الجامعة — كلية العلوم", "🎓", 0, -118, 40, 26, 20, 0, { wall: "#e6d8c3" });
  SITE(L, "LIFE_UNI_B", "university", "slab", "الجامعة — كلية الهندسة", "🎓", 52, -118, 34, 26, 24, 0, { wall: "#d9cfc6", glass: "#6aa3c9" });
  SITE(L, "LIFE_LIB", "library", "classic", "المكتبة العامة", "📚", -100, -108, 28, 22, 14, 0, { wall: "#efe6d2" });
  SITE(L, "LIFE_CINEMA", "cinema", "cinema", "السينما", "🎬", 20, -45, 40, 30, 16, 0, { enter: "isl_cinema", wall: "#2b3a55" });
  SITE(L, "LIFE_REST1", "restaurant", "slab", "مطعم الواحة", "🍽️", -102, 30, 24, 20, 9, 2, { wall: "#f2d8b8", glass: "#8cc0dc" });
  SITE(L, "LIFE_REST2", "restaurant", "slab", "مقهى الشاطئ", "☕", -76, 30, 20, 20, 8, 2, { wall: "#e8c9a0", glass: "#8cc0dc" });
  SITE(L, "LIFE_SHOPS", "shops", "slab", "سوق المحلات", "🛍️", -100, 98, 48, 20, 10, 2, { wall: "#efe0b0", glass: "#8cc0dc" });
  SITE(L, "LIFE_STADIUM", "stadium", "stadium", "الملعب الرياضي", "🏟️", 70, 100, 56, 44, 14, 2, {});
  SITE(L, "LIFE_COURTS", "sports", "courts", "ملاعب كرة السلة والتنس", "🏀", 10, 100, 36, 28, 3, 2, {});
  SITE(L, "LIFE_FERRIS", "ride", "ferris", "الدولاب الهوائي", "🎡", 112, -40, 46, 14, 44, 2, {});
  SITE(L, "LIFE_CAROUSEL", "ride", "carousel", "الدوّارة", "🎠", 70, 30, 18, 18, 9, 2, {});
  SITE(L, "LIFE_COASTER", "ride", "coaster", "القطار الهوائي", "🎢", 132, 38, 36, 36, 20, 2, {});
  ZONE(L, "LIFE_PARK", "park", "الحديقة العامة والبحيرة", "🌳", -20, 32, 70, 44, { r: 14 });
  ZONE(L, "LIFE_PLAY", "playground", "ملعب الأطفال", "🛝", -30, 100, 30, 24);
  ZONE(L, "LIFE_BEACH", "beach", "الشاطئ والمظلّات", "🏖️", -140, 40, 16, 40);
  PT(L, "LIFE_SCHOOL_IN", "entry", "مدخل المدرسة", -105, -45 + 16 + 3, 3, "LIFE_SCHOOL");
  PT(L, "LIFE_CINEMA_IN", "entry", "مدخل السينما", 20, -45 + 15 + 3, 3, "LIFE_CINEMA");

  /* ---------- مباني داخلية (معرفات المشاهد الداخلية) ---------- */
  D.interiors = {
    isl_hq: { n: "مقر الشركة (استقبال + 3 غرف اجتماعات + مكتب المدير)", site: "BIZ_HQ", outAt: null },
    isl_factory: { n: "مصنع: خط إنتاج + غرفة تحكّم", site: "IND_F5", outAt: null },
    isl_warehouse: { n: "مستودع الميناء: رفوف وطبليات", site: "PORT_WH1", outAt: null },
    isl_school: { n: "المدرسة: 3 فصول + ساحة", site: "LIFE_SCHOOL", outAt: null },
    isl_cinema: { n: "السينما: صالة + شاشة", site: "LIFE_CINEMA", outAt: null },
  };
  // IND_F2 وIND_F5 بيشاركوا نفس المشهد الداخلي isl_factory (نسختين من نفس القاعة)؛ outAt بيتحدّد من مبنى الدخول الأخير المستخدم
  D.sites.forEach((s) => { if (s.enter) D.interiors[s.enter].sites = (D.interiors[s.enter].sites || []).concat(s.id); });

  /* ---------- مواقع قديمة (V11) مسجّلة للتكامل، ما انلمست ---------- */
  D.legacy = [
    { id: "ISL_CITY", n: "المدينة الكبرى", src: "city.js", geo: "x 70..470، z 400..800 (5×5 بلوك، 80م للبلوك)", gate: "فرع الطريق z=560 من x=0 إلى x=60 (بوابة المدينة)", note: "ما انبنت من جديد. أماكنها بـ OSW.city.PLACES: hotel, mall, hospital, police, resto_a, resto_b, cafe, port" },
    { id: "LEGACY_VILLAGE", n: "القرية والبيت", src: "scene_world.js / interior.js", geo: "x -112..112، z -62..98", note: "نقطة البداية. ما انلمست" },
    { id: "LEGACY_ISLAND2", n: "الجزيرة الثانية (سوق/مطعم/ميناء التصدير)", src: "logi.js / agri3d.js / scene_extra.js", geo: "مركز (0,1180) نصف قطر 130؛ ميناء التصدير x 34..94، z 1242..1306", note: "ما انلمست. بتبقى موجودة بجانب جزيرة الميناء الجديدة" },
    { id: "LEGACY_ROAD", n: "الطريق الطويل", src: "vehicles.js", geo: "x=0، z 72..1092، عرض 10", note: "كل الجسور الجديدة بتتفرّع منه" },
  ];

  /* ---------- أدوات استعلام مشتركة ---------- */
  D.site = (id) => D.sites.find((s) => s.id === id);
  D.point = (id) => D.points.find((p) => p.id === id);
  D.island = (id) => D.islands[id];
  D.islandAt = (x, z) => { for (const id of D.order) { const I = D.islands[id]; if (I.legacy) continue; if (hy(x - I.c.x, z - I.c.z) <= I.r + 1) return id; } return null; };
  root.OSW_ISL = D; if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
