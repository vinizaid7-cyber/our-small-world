/* ============================================================
   المدينة الكبرى — الداخل والخدمات (فندق، مطاعم، مول، مستشفى، شرطة، ميناء، مواصلات)
   كل شي هون مربوط بنظام اللعبة الموجود: أحداث (fold) + نوافذ (openers) + مصاري/جوع/نوم
   ============================================================ */
(function () {
  const OSW = window.OSW, C = OSW.city, R = OSW.R, Builder = OSW.Builder, PI = Math.PI, hy = Math.hypot, dk = OSW.col.dk, lt = OSW.col.lt;
  const esc = OSW.esc, W = () => OSW.world, G = () => OSW.game, UI = () => OSW.ui, DB = () => OSW.ui.db;
  const INT = OSW.INT, IX = 700;

  /* ---------- شخصيات ---------- */
  const NPC = (id, name, emoji, look, lines, act) => (OSW.NPC_BY[id] = { id, name, emoji, look, lines, act });
  NPC("ct_recep", "ليلى (الاستقبال)", "🛎️", { gender: "girl", color: "#7a3b3b", hair: "#2a1d12", hairStyle: "ponytail" }, ["أهلاً بكم بفندق الواحة 🏨", "عندنا غرف رومانسية بإطلالة عالمدينة 🌃", "الفطور مجاني الصبح لضيوفنا ☕"], "ct:hotel");
  NPC("ct_waiter", "أبو سامر (النادل)", "🍽️", { gender: "boy", color: "#f4f1e8", hair: "#1b1b1b", hairStyle: "short", apron: "#2b2b35", mustache: true }, ["تفضلوا اقعدوا وأنا بجيبلكم المنيو 📜", "عشاء لشخصين؟ عندنا خصم 15٪ 💕", "الأكل اليوم تحفة! 🍲"], "ct:menu");
  NPC("ct_cashier", "سلمى (المجمّع)", "🛍️", { gender: "girl", color: "#e63946", hair: "#3b2a20", hairStyle: "long" }, ["أهلاً بكم بالمجمّع! 🛍️", "الأزياء، الأثاث، الأليفة… كله هون 😉", "جربوا ساحة الطعام كمان 🌯"], "ct:m:super");
  NPC("ct_doctor", "د. هالة", "🩺", { gender: "girl", color: "#ffffff", hair: "#2b1d14", hairStyle: "ponytail" }, ["سلامتكم! شو في؟ 🩺", "الأكل والنوم الكافي أحسن دواء 💊", "الفحص بياخد دقيقة بس 😊"], "ct:hosp");
  NPC("ct_officer", "الرقيب نبيل", "👮", { gender: "boy", color: "#2b3a55", hair: "#1b1b1b", hairStyle: "cap", cap: "#2b3a55", mustache: true }, ["أي خدمة؟ 👮", "السيارة مركونة غلط؟ بنرجعها للكراج 🚗", "بنساعدكم تلاقوا المفقودات 🔎"], "ct:police");
  NPC("ct_fisher", "أبو يوسف (البحّار)", "⚓", { gender: "boy", color: "#2f6db5", hair: "#d8d8d8", hairStyle: "cap", cap: "#f4f1e8", mustache: true }, ["السمك طازة من البحر! 🐟", "بدفع أحسن سعر بالمدينة 🪙", "جرّبوا الصيد عالممر الخشبي 🎣"], "ct:port");

  /* ---------- بناء الغرف ---------- */
  const WH = 1.15, WT = 0.3;
  function wallBox(B, boxes, x0, z0, x1, z1, col) {
    let cx, cz, w, d; if (x0 === x1) { cx = x0; cz = (z0 + z1) / 2; w = WT; d = Math.abs(z1 - z0); } else { cx = (x0 + x1) / 2; cz = z0; w = Math.abs(x1 - x0); d = WT; }
    if (w < 0.05 || d < 0.05) return; B.box(cx, 0, cz, w, WH, d, col); B.box(cx, WH, cz, w + 0.04, 0.1, d + 0.04, dk(col, 0.2)); boxes.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
  }
  function hall(o) {
    const B = new Builder(), boxes = [], acts = [], labels = [], poi = {}, seats = [], hw = o.hw, hd = o.hd, ox = IX, oz = 0, x0 = ox - hw, x1 = ox + hw, z0 = oz - hd, z1 = oz + hd, g = 1.8;
    B.box(ox, -0.15, oz, hw * 2, 0.15, hd * 2, o.floor);
    for (let i = 0; i < hw; i++) for (let j = 0; j < hd; j++) if ((i + j) % 2 === 0) B.box(x0 + 1 + i * 2, 0, z0 + 1 + j * 2, 2, 0.012, 2, o.floor2);
    const Wl = (a, b, c, d) => wallBox(B, boxes, a, b, c, d, o.wall);
    Wl(x0, z0, x1, z0); Wl(x0, z0, x0, z1); Wl(x1, z0, x1, z1); Wl(x0, z1, ox - g, z1); Wl(ox + g, z1, x1, z1);
    B.box(ox - g - 0.1, 0, z1, 0.3, 3.0, 0.5, "#6b4a3a"); B.box(ox + g + 0.1, 0, z1, 0.3, 3.0, 0.5, "#6b4a3a"); B.box(ox, 2.7, z1, g * 2 + 0.7, 0.4, 0.5, "#6b4a3a"); B.box(ox, 0.02, z1 - 1, 2.6, 0.03, 1.0, o.mat || "#2f8f5b");
    for (let i = -1; i <= 1; i++) { B.cyl(ox + i * hw * 0.5, 2.3, oz - 1, 0.03, 0.03, 0.4, "#555", 4); B.sphere(ox + i * hw * 0.5, 2.25, oz - 1, 0.35, 0.25, 0.35, "#ffe9a8", 6, 1); }
    const I = { id: o.id, B, boxes, acts, labels, poi, seats, ox, oz, x0, x1, z0, z1, hw, hd };
    I.act = (a, x, z, r, px, pz, y) => { acts.push({ act: a, x, y: y == null ? 1.2 : y, z, r }); poi[a] = { x: px, z: pz }; };
    I.lab = (id, text, x, y, z, act) => labels.push({ id, text, x, y, z, cls: "sm tap", act, max: 40, scope: "in" });
    I.solid = (x, z, w, d) => boxes.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
    I.table = (x, z, tid, n = 4, col = "#8d6e63", chair = "#a4452c") => {
      B.cyl(x, 0, z, 0.15, 0.15, 0.8, dk(col, 0.1), 6); B.cyl(x, 0.8, z, 0.95, 0.95, 0.08, lt(col, 0.2), 10); B.cyl(x, 0.88, z, 0.3, 0.25, 0.16, "#ffffff", 8); B.sphere(x, 1.12, z, 0.1, 0.1, 0.1, "#ff7a8a", 5, 0.5); I.solid(x, z, 1.6, 1.6);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * PI * 2 + PI / 4, cx = x + Math.cos(a) * 1.35, cz = z + Math.sin(a) * 1.35, ry = Math.atan2(x - cx, z - cz);
        B.push(cx, 0, cz, ry); B.box(0, 0, 0, 0.7, 0.5, 0.7, chair); B.box(0, 0.5, -0.32, 0.7, 0.7, 0.1, dk(chair, 0.1)); B.pop();
        const si = seats.length; seats.push({ x: cx, z: cz, ry, tid, out: { x: x + Math.cos(a) * 2.5, z: z + Math.sin(a) * 2.5 } });
        I.act("ct:sit:" + si, cx, cz, 0.85, x + Math.cos(a) * 2.2, z + Math.sin(a) * 2.2, 0.6);
      }
    };
    I.plant = (x, z, s = 1) => { B.cyl(x, 0, z, 0.4 * s, 0.32 * s, 0.6, "#8a5a3b", 8); B.sphere(x, 1.0, z, 0.55 * s, 0.7 * s, 0.55 * s, "#3f9a52", 7); I.solid(x, z, 0.9, 0.9); };
    I.sofa = (x, z, w, ry, col) => { B.push(x, 0, z, ry || 0); B.box(0, 0, 0, w, 0.5, 1.0, col); B.box(0, 0.5, -0.4, w, 0.7, 0.25, dk(col, 0.1)); B.box(-w / 2 + 0.12, 0.5, 0, 0.25, 0.4, 1.0, dk(col, 0.1)); B.box(w / 2 - 0.12, 0.5, 0, 0.25, 0.4, 1.0, dk(col, 0.1)); B.pop(); const s = Math.abs(Math.sin(ry || 0)) > 0.5; I.solid(x, z, s ? 1.1 : w, s ? w : 1.1); };
    I.exit = () => { I.act("exit", ox, z1 - 0.3, 2.2, ox, z1 - 2.2); I.lab("exl", "🚪 اطلع", ox, 3.4, z1, "exit"); };
    // كاونتر خدمة (مع فعل)
    I.desk = (x, z, w, col, act, text, signCol) => { B.box(x, 0, z, w, 1.0, 1.4, col); B.box(x, 1.0, z, w + 0.2, 0.12, 1.6, "#d7b98a"); I.solid(x, z, w, 1.5); B.box(x, 2.1, z - 0.7, w, 1.3, 0.1, signCol || col); B.box(x, 2.2, z - 0.64, w - 1, 1.0, 0.05, "#ffe9b0", 0.7); I.act(act, x, z, 3.8, x, z + 2.4, 1.0); I.lab("dl_" + act, text, x, 3.3, z, act); };
    I.fin = (extra) => Object.assign({ id: o.id, mesh: B.build(R.gl), boxes, acts, labels, poi, seats, bounds: { x0, x1, z0, z1 }, spawn: { x: ox, z: z1 - 3 }, exitAt: o.id, env: "warm", camDist: o.cam || 22, camPitch: 1.08, npcs: [] }, extra || {});
    return I;
  }
  const npc = (id, ref, x, z, act, face) => ({ id, ref, x, z, face: face || 0, act });

  /* ===== الفندق: اللوبي ===== */
  const ROOMS = (C.ROOMS = { std: { n: "غرفة عادية", e: "🛏️", price: 40, food: 85, note: "سرير مزدوج وتلفزيون وشرفة" }, fam: { n: "غرفة عائلية", e: "🛌", price: 65, food: 92, note: "غرفة واسعة وفطور أكبر" }, suite: { n: "جناح ملكي", e: "👑", price: 110, food: 100, note: "أفخم جناح بإطلالة بانورامية وفطور ملوكي" } });
  INT.defs.hotel = () => {
    const I = hall({ id: "hotel", hw: 14, hd: 10, floor: "#e9dcc4", floor2: "#dccdb0", wall: "#f3e7cf", mat: "#7a3b3b" }), B = I.B, z0 = I.z0, ox = I.ox;
    I.desk(ox, z0 + 1.2, 12, "#6b4a3a", "ct:hotel", "🛎️ الاستقبال — احجزوا غرفة", "#7a3b3b"); B.box(ox + 3.4, 1.14, z0 + 1.2, 1.0, 0.5, 0.7, "#555"); B.box(ox - 3.4, 1.14, z0 + 1.2, 0.5, 0.45, 0.5, "#e6c36a");
    I.sofa(ox - 9, 2.0, 4, PI / 2, "#a4452c"); I.sofa(ox - 9, 6.0, 3, PI / 2, "#a4452c"); B.cyl(ox - 7.2, 0, 4.0, 0.9, 0.9, 0.5, "#8d6e63", 10); I.solid(ox - 7.2, 4.0, 1.8, 1.8);
    I.plant(I.x0 + 1.4, I.z0 + 1.4); I.plant(I.x1 - 1.4, I.z0 + 1.4); I.plant(I.x1 - 1.4, I.z1 - 1.4); I.plant(I.x0 + 1.4, I.z1 - 1.4);
    const ex = I.x1 - 2.2, ez = 1.0; B.box(ex, 0, ez, 3.0, 3.2, 3.4, "#b9bcc2"); B.box(ex - 1.55, 0.05, ez, 0.1, 2.6, 2.4, "#8aa0b3", 0.3); B.box(ex - 1.6, 2.7, ez, 0.1, 0.4, 1.4, "#ffd23f", 1); I.solid(ex, ez, 3, 3.4);
    I.act("ct:elev", ex - 1.6, ez, 2.2, ex - 3.4, ez, 1.3); I.lab("elv", "🛗 اطلعوا لغرفتكم", ex - 1.6, 3.6, ez, "ct:elev");
    I.exit(); return I.fin({ npcs: [npc("ct_recep_i", "ct_recep", ox, z0 + 2.9, "ct:hotel")] });
  };

  /* ===== الفندق: الغرفة ===== */
  INT.defs.hotel_room = () => {
    const I = hall({ id: "hotel_room", hw: 8, hd: 6.5, floor: "#c9b49a", floor2: "#bda68a", wall: "#f1e6ee", mat: "#7a3b3b", cam: 18 }), B = I.B, ox = I.ox, z0 = I.z0, z1 = I.z1;
    B.box(ox - 3.6, 0, z0 + 2.4, 4.4, 0.55, 3.6, "#6b4a3a"); B.box(ox - 3.6, 0.55, z0 + 2.4, 4.2, 0.35, 3.4, "#f4f1ec"); B.box(ox - 3.6, 0.9, z0 + 3.5, 4.2, 0.12, 1.2, "#c0392b"); B.box(ox - 4.6, 0.9, z0 + 1.2, 1.4, 0.2, 0.9, "#ffffff"); B.box(ox - 2.6, 0.9, z0 + 1.2, 1.4, 0.2, 0.9, "#ffffff"); B.box(ox - 3.6, 0.5, z0 + 0.4, 4.6, 2.0, 0.3, "#5b4030");
    I.solid(ox - 3.6, z0 + 2.4, 4.4, 3.6); B.box(ox - 1.0, 0, z0 + 0.9, 0.7, 0.6, 0.6, "#6b4a3a"); B.sphere(ox - 1.0, 1.0, z0 + 0.9, 0.25, 0.3, 0.25, "#fff2b0", 7, 1);
    I.act("ct:bed", ox - 3.6, z0 + 2.4, 3.2, ox - 3.6, z0 + 5.2, 0.9); I.lab("bdl", "🛏️ نامو هون", ox - 3.6, 2.6, z0 + 2.4, "ct:bed");
    B.box(ox + 3.2, 0, z0 + 0.9, 3.2, 0.5, 0.7, "#6b4a3a"); B.box(ox + 3.2, 0.5, z0 + 0.9, 2.4, 1.4, 0.1, "#15151a"); B.box(ox + 3.2, 0.6, z0 + 0.96, 2.2, 1.2, 0.04, "#8fd0ff", 1); I.solid(ox + 3.2, z0 + 0.9, 3.2, 0.8);
    I.act("scene:movie", ox + 3.2, z0 + 0.9, 2.2, ox + 3.2, z0 + 3.4, 1.1); I.lab("tvl", "📺 فيلم", ox + 3.2, 2.7, z0 + 0.9, "scene:movie");
    B.box(I.x1 - 1.1, 0, 0.5, 1.1, 1.2, 1.4, "#dfe6ec"); B.box(I.x1 - 1.1, 1.2, 0.5, 1.2, 0.1, 1.5, "#8f8f8f"); I.solid(I.x1 - 1.1, 0.5, 1.2, 1.5);
    I.act("ct:minibar", I.x1 - 1.1, 0.5, 1.8, I.x1 - 3.0, 0.5, 1.0); I.lab("mbl", "🥤 ميني بار", I.x1 - 1.1, 2.3, 0.5, "ct:minibar");
    B.box(I.x0 + 1.0, 0, 1.8, 1.0, 2.4, 3.0, "#8a5a3b"); B.box(I.x0 + 1.52, 0.2, 1.8, 0.06, 1.9, 2.4, "#d6efff", 0.5); I.solid(I.x0 + 1.0, 1.8, 1.0, 3.0);
    I.act("mirror", I.x0 + 1.0, 1.8, 1.8, I.x0 + 3.0, 1.8, 1.2); I.lab("wrl", "🪞 جرّبوا لبسكم", I.x0 + 1.0, 2.8, 1.8, "mirror");
    B.box(ox + 3.5, 0, z1 - 0.5, 6.4, 1.1, 0.2, "#9fd4f0", 0.25); B.box(ox + 3.5, 1.1, z1 - 0.5, 6.6, 0.1, 0.3, "#555"); for (let i = 0; i < 8; i++) B.box(ox + 0.5 + i * 0.85, 0, z1 - 0.5, 0.06, 1.1, 0.06, "#777");
    I.act("scene:stars", ox + 3.5, z1 - 1.0, 2.6, ox + 3.5, z1 - 2.8, 1.0); I.lab("stl", "🌃 الإطلالة", ox + 3.5, 2.5, z1 - 0.8, "scene:stars");
    B.box(ox + 0.5, 0.02, 1.5, 3.4, 0.03, 2.6, "#7a3b3b");
    I.act("ct:hexit", ox - 1.0, z1 - 0.4, 2.2, ox - 1.0, z1 - 2.2, 1.2); I.lab("hxl", "🚪 اطلعوا للوبي", ox - 1.0, 3.2, z1, "ct:hexit");
    const r = I.fin({ npcs: [] }); r.spawn = { x: ox - 1.0, z: z1 - 3 }; return r;
  };
  INT.outAt.hotel_room = { x: 270, z: 541 };

  /* ===== المطاعم والمقهى ===== */
  const RESTO = {
    resto_a: { n: "مطعم الديوان", e: "🍲", floor: "#d6b98a", floor2: "#c9a874", wall: "#f4e6cc", chair: "#8a3b2e", mat: "#c9702e" },
    resto_b: { n: "بيت البيتزا", e: "🍕", floor: "#e8d3c4", floor2: "#d9bba8", wall: "#fbe4d8", chair: "#c0392b", mat: "#c0392b" },
    cafe: { n: "مقهى الكورنيش", e: "☕", floor: "#cdb99e", floor2: "#bfa886", wall: "#efe6d2", chair: "#2a7a6f", mat: "#2a7a6f" },
  };
  const MENU = (C.MENU = {
    resto_a: [{ id: "mansaf", n: "منسف", e: "🍲", price: 34, food: 70, drink: 10 }, { id: "maqluba", n: "مقلوبة", e: "🍛", price: 28, food: 62, drink: 8 }, { id: "grill", n: "مشاوي مشكّلة", e: "🍢", price: 32, food: 66, drink: 4 }, { id: "hummus", n: "حمّص وفلافل", e: "🧆", price: 14, food: 36, drink: 0 }, { id: "tea", n: "شاي بالنعنع", e: "🫖", price: 6, food: 0, drink: 30 }],
    resto_b: [{ id: "pizza", n: "بيتزا مارغريتا", e: "🍕", price: 24, food: 58, drink: 0 }, { id: "pasta", n: "باستا", e: "🍝", price: 22, food: 52, drink: 0 }, { id: "burger", n: "برغر", e: "🍔", price: 20, food: 48, drink: 0 }, { id: "salad", n: "سلطة", e: "🥗", price: 12, food: 26, drink: 10 }, { id: "lemon", n: "ليمون بالنعنع", e: "🍹", price: 7, food: 0, drink: 34 }],
    cafe: [{ id: "coffee", n: "قهوة", e: "☕", price: 8, food: 0, drink: 30 }, { id: "kunafa", n: "كنافة", e: "🍯", price: 16, food: 30, drink: 0 }, { id: "waffle", n: "وافل", e: "🧇", price: 15, food: 34, drink: 0 }, { id: "juice", n: "عصير طازج", e: "🧃", price: 9, food: 4, drink: 36 }, { id: "sahlab", n: "سحلب", e: "🥛", price: 11, food: 12, drink: 28 }],
    court: [{ id: "shawarma", n: "شاورما", e: "🌯", price: 14, food: 42, drink: 0 }, { id: "fries", n: "بطاطا مقلية", e: "🍟", price: 9, food: 24, drink: 0 }, { id: "ice", n: "بوظة", e: "🍦", price: 7, food: 8, drink: 14 }, { id: "water", n: "ماء بارد", e: "💧", price: 3, food: 0, drink: 24 }],
    mini: [{ id: "water", n: "ماء", e: "💧", price: 5, food: 0, drink: 24 }, { id: "juice", n: "عصير", e: "🧃", price: 9, food: 3, drink: 30 }, { id: "snack", n: "سناك", e: "🍫", price: 8, food: 16, drink: 0 }],
  });
  Object.keys(RESTO).forEach((id) => {
    INT.defs[id] = () => {
      const T = RESTO[id], I = hall({ id, hw: 12, hd: 9, floor: T.floor, floor2: T.floor2, wall: T.wall, mat: T.mat, cam: 21 }), ox = I.ox, z0 = I.z0;
      I.desk(ox, z0 + 1.0, 9, "#6b4a3a", "ct:menu", `${T.e} ${T.n} — اطلبوا`, T.mat); I.B.box(ox + 3.2, 1.12, z0 + 1.0, 0.8, 0.45, 0.6, "#555");
      let tid = 0; [[-7, 1], [0, 3.6], [7, 1], [-7, 6], [7, 6]].forEach(([dx, dz]) => { if (id === "cafe" && dz > 5) return; I.table(ox + dx, dz, "T" + tid++, 4, "#8d6e63", T.chair); });
      I.plant(I.x0 + 1.2, I.z0 + 1.2); I.plant(I.x1 - 1.2, I.z0 + 1.2); I.plant(I.x1 - 1.2, I.z1 - 1.2);
      I.exit(); return I.fin({ npcs: [npc("ct_waiter_" + id, "ct_waiter", ox, z0 + 2.9, "ct:menu")] });
    };
  });

  /* ===== المجمّع ===== */
  INT.defs.mall = () => {
    const I = hall({ id: "mall", hw: 24, hd: 16, floor: "#e6e0d6", floor2: "#d8d1c4", wall: "#f1ebe0", mat: "#7a3b3b", cam: 30 }), B = I.B, ox = I.ox, z0 = I.z0, x0 = I.x0, x1 = I.x1;
    const shop = (x, name, emoji, col, act) => { const w = 7; B.box(x, 0, z0 + 0.9, w, 2.4, 1.0, dk(col, 0.1)); B.box(x, 2.4, z0 + 0.9, w + 0.4, 0.4, 1.4, col); B.box(x, 2.9, z0 + 0.5, w - 0.4, 1.0, 0.1, col, 0.8); B.box(x, 0, z0 + 3.0, w * 0.6, 1.0, 1.2, "#8d6e63"); B.box(x, 1.0, z0 + 3.0, w * 0.6 + 0.2, 0.12, 1.4, "#e6d3ab"); I.solid(x, z0 + 0.9, w, 1.1); I.solid(x, z0 + 3.0, w * 0.6, 1.3); I.act(act, x, z0 + 3.0, 3.4, x, z0 + 5.6, 1.2); I.lab("sh_" + act, `${emoji} ${name}`, x, 3.8, z0 + 2.4, act); };
    shop(ox - 20, "السوبرماركت", "🛒", "#2f8f5b", "ct:m:super"); shop(ox - 12, "الأزياء", "👗", "#b565b0", "ct:m:fashion"); shop(ox - 4, "الأثاث والديكور", "🛋️", "#a97c50", "ct:m:furn");
    shop(ox + 4, "عالم الأليفة", "🐾", "#4aa3c9", "ct:m:pets"); shop(ox + 12, "الهدايا", "🎁", "#e0556f", "ct:m:gift"); shop(ox + 20, "الخضار والمواد", "🥬", "#6aa84f", "ct:m:ing");
    B.box(ox - 16, 0, I.z1 - 4.5, 8, 1.0, 1.4, "#c9702e"); B.box(ox - 16, 1.0, I.z1 - 4.5, 8.2, 0.12, 1.6, "#e8d4aa"); I.solid(ox - 16, I.z1 - 4.5, 8, 1.5); B.box(ox - 16, 2.4, I.z1 - 5.0, 8, 1.0, 0.1, "#c9702e", 0.8);
    I.act("ct:m:court", ox - 16, I.z1 - 4.5, 3.6, ox - 16, I.z1 - 7.2, 1.0); I.lab("ct_court", "🌯 ساحة الطعام", ox - 16, 3.4, I.z1 - 4.5, "ct:m:court");
    let tid = 0; [[-6, 8], [0, 8], [6, 8], [12, 8]].forEach(([dx, dz]) => I.table(ox + dx, dz, "M" + tid++, 4, "#8d6e63", "#2f8f5b"));
    B.box(ox, 0.02, 0, 40, 0.03, 4, "#c9bfaa"); for (let i = 0; i < 5; i++) { B.cyl(x0 + 6 + i * 9, 0, -2, 0.5, 0.4, 0.5, "#8a5a3b", 8); B.sphere(x0 + 6 + i * 9, 1.1, -2, 0.6, 0.8, 0.6, "#3f9a52", 7); I.solid(x0 + 6 + i * 9, -2, 1.1, 1.1); }
    I.plant(x0 + 1.2, I.z1 - 1.4); I.plant(x1 - 1.2, I.z1 - 1.4); I.exit();
    return I.fin({ npcs: [npc("ct_cashier_i", "ct_cashier", ox - 20, z0 + 2.2, "ct:m:super")] });
  };

  /* ===== المستشفى ===== */
  INT.defs.hospital = () => {
    const I = hall({ id: "hospital", hw: 13, hd: 9, floor: "#e8eef2", floor2: "#dbe4ea", wall: "#f7fafc", mat: "#e63946", cam: 21 }), B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.1, 9, "#cfd6dc", "ct:hosp", "🩺 العيادة — افحصوا وتعالجوا", "#e63946");
    [-9, 9].forEach((dx) => { B.box(ox + dx, 0, 2.6, 2.4, 0.5, 4.2, "#9fc4d8"); B.box(ox + dx, 0.5, 2.6, 2.2, 0.25, 4.0, "#f4f6f8"); B.box(ox + dx, 0.75, 1.0, 1.2, 0.2, 0.7, "#ffffff"); I.solid(ox + dx, 2.6, 2.4, 4.2); });
    for (let i = 0; i < 4; i++) I.sofa(ox - 6 + i * 4, 6.6, 3, PI, "#4a90c2");
    I.plant(I.x0 + 1.2, I.z1 - 1.4); I.plant(I.x1 - 1.2, I.z1 - 1.4);
    I.exit();
    return I.fin({ npcs: [npc("ct_doctor_i", "ct_doctor", ox, z0 + 2.9, "ct:hosp")] });
  };

  /* ===== الشرطة ===== */
  INT.defs.police = () => {
    const I = hall({ id: "police", hw: 11, hd: 8, floor: "#cfd4da", floor2: "#c0c6ce", wall: "#dde4ee", mat: "#2b3a55", cam: 19 }), B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.1, 8, "#34455f", "ct:police", "👮 المكتب — مفقودات وسيارات", "#2b3a55");
    B.box(I.x1 - 0.4, 0, -1, 0.2, 2.6, 5, "#8d9aa8"); for (let i = 0; i < 5; i++) B.box(I.x1 - 0.4, 0, -3.2 + i * 1.1, 0.06, 2.6, 0.06, "#333"); I.solid(I.x1 - 0.6, -1, 0.6, 5);
    B.box(I.x0 + 1.6, 0, 3, 2.8, 0.5, 1.4, "#6b4a3a"); B.box(I.x0 + 1.6, 0.5, 3, 2.6, 0.9, 0.12, "#ffffff"); I.solid(I.x0 + 1.6, 3, 2.8, 1.4);
    I.sofa(I.x0 + 4, I.z1 - 1.2, 3.2, PI, "#556b8a"); I.plant(I.x1 - 1.2, I.z1 - 1.4); I.exit();
    return I.fin({ npcs: [npc("ct_officer_i", "ct_officer", ox, z0 + 2.9, "ct:police")] });
  };

  /* ===== سوق الميناء ===== */
  INT.defs.port = () => {
    const I = hall({ id: "port", hw: 12, hd: 8, floor: "#d9d6cd", floor2: "#c9c5ba", wall: "#e9e4d6", mat: "#2b6b85", cam: 20 }), B = I.B, ox = I.ox, z0 = I.z0;
    I.desk(ox, z0 + 1.1, 9, "#f4f6f8", "ct:port", "⚓ بيع المنتجات بسعر الميناء", "#2b6b85");
    for (let i = 0; i < 6; i++) B.sphere(ox - 3.6 + i * 1.45, 1.2, z0 + 1.2, 0.5, 0.18, 0.2, ["#9fc3d6", "#8fb2c6", "#c0cfda"][i % 3], 6);
    [[-8, 1], [8, 1]].forEach(([dx, dz]) => { B.box(ox + dx, 0, dz, 3, 0.9, 2.2, "#a97c50"); for (let k = 0; k < 4; k++) B.sphere(ox + dx - 0.9 + k * 0.6, 1.05, dz, 0.28, 0.2, 0.28, ["#ff8c42", "#7ac74f", "#ffd23f", "#e63946"][k], 5); I.solid(ox + dx, dz, 3, 2.2); });
    B.cyl(ox - 8, 0, 5.4, 0.8, 0.8, 1.0, "#6b4a30", 8); B.cyl(ox + 8, 0, 5.4, 0.8, 0.8, 1.0, "#6b4a30", 8); I.solid(ox - 8, 5.4, 1.6, 1.6); I.solid(ox + 8, 5.4, 1.6, 1.6); I.exit();
    return I.fin({ npcs: [npc("ct_fisher_i", "ct_fisher", ox, z0 + 2.9, "ct:port")] });
  };

  Object.keys(C.PLACES).forEach((k) => { INT.outAt[k] = { x: C.PLACES[k].front.x, z: C.PLACES[k].front.z }; INT.enterAct[k] = "ct:in:" + k; });

  /* ============ أحداث اللعبة (fold) ============ */
  const NEEDF = 100 / (8 * 3600000), NEEDD = 100 / (5 * 3600000), HOUR = 3600000, SELL_BONUS = 1.15;
  const feed = (S, uid, t, food, drink, floorTo) => {
    const n = S.need[uid] || (S.need[uid] = { food: 100, drink: 100, t, sip: 0 }), dt = Math.max(0, t - n.t);
    n.food = Math.max(0, n.food - dt * NEEDF); n.drink = Math.max(0, n.drink - dt * NEEDD); n.t = Math.max(n.t, t);
    if (floorTo != null) { n.food = Math.max(n.food, floorTo); n.drink = Math.max(n.drink, floorTo); } else { n.food = Math.min(100, n.food + food); n.drink = Math.min(100, n.drink + drink); }
  };
  C.fold = (ty, e, d, t, a, day, S, H) => {
    if (ty === "ct_fare") { if (S.coins >= C.FARE && C.STOPS[d.to]) { S.coins -= C.FARE; H.mark(); } return true; }
    if (ty === "ct_book") {
      const R0 = ROOMS[d.room]; if (!R0) return true; const h = S.hotel; if (h && t < h.until && h.room === d.room) return true; if (S.coins < R0.price) return true;
      S.coins -= R0.price; S.hotel = { room: d.room, t, until: t + 22 * HOUR, by: a, slept: 0 }; H.mark(); return true;
    }
    if (ty === "ct_slept") {
      const h = S.hotel; if (!h || t > h.until + 8 * HOUR || h.slept) return true; h.slept = t; const R0 = ROOMS[h.room];
      Object.keys(S.need).forEach((u) => feed(S, u, t, 0, 0, R0.food)); S.hotelNights = (S.hotelNights || 0) + 1; H.mark(); return true;
    }
    if (ty === "ct_meal") {
      const M0 = MENU[d.r], it = M0 && M0.find((x) => x.id === d.d); if (!it) return true; const two = d.n === 2, cost = two ? Math.round(it.price * 2 * 0.85) : it.price; if (S.coins < cost) return true;
      S.coins -= cost; if (two) Object.keys(S.need).forEach((u) => feed(S, u, t, it.food, it.drink)); else feed(S, a, t, it.food, it.drink);
      S.cityMeals = (S.cityMeals || 0) + (two ? 2 : 1); H.mark(); return true;
    }
    if (ty === "ct_heal") { const cost = d.both ? 45 : 25; if (S.coins < cost) return true; S.coins -= cost; if (d.both) Object.keys(S.need).forEach((u) => feed(S, u, t, 0, 0, 100)); else feed(S, a, t, 0, 0, 100); H.mark(); return true; }
    if (ty === "ct_fee") { const cost = d.k === "car" ? 10 : d.k === "hint" ? 15 : 0; if (cost && S.coins >= cost) { S.coins -= cost; H.mark(); } return true; }
    if (ty === "ct_psell") {
      const p = OSW.game.PRODUCE[d.id], q = d.qty; if (!p || !(q >= 1) || (S.inv[d.id] || 0) < q) return true;
      H.add(d.id, -q); S.coins += Math.floor(p.sell * SELL_BONUS) * q; H.mark(); return true;
    }
    return false;
  };

  /* ============ واجهات النوافذ ============ */
  const coin = () => `<div class="coinbar">🪙 <b>${G().state().coins}</b></div>`;
  const irow = (e, name, sub, btns) => `<div class="irow"><span class="ie">${e}</span><div class="iname"><b>${esc(name)}</b><small>${sub}</small></div><div class="ib">${btns}</div></div>`;
  const meter = (l, v, c) => `<div class="mrow"><span>${l}</span><div class="mbar"><i style="width:${Math.round(v)}%;background:${c}"></i></div><b>${Math.round(v)}</b></div>`;
  const validBooking = () => { const h = G().state().hotel; return h && Date.now() < h.until ? h : null; };
  C.validBooking = validBooking;
  C.partnerAtTable = () => { const w = W()._int, me = w.me, pa = w.pa; if (!me.sit || !pa.vis || !pa.sit || (pa.space || null) !== (OSW.world.interior || null)) return false; return hy(me.sit.tx - pa.x, me.sit.tz - pa.z) < 2.6; };
  const curRest = () => { const i = OSW.world.interior; return MENU[i] && i !== "mini" && i !== "court" ? i : i === "mall" ? "court" : null; };

  function menuUI(rest, title) {
    const items = MENU[rest], s = G().state(), me = W()._int.me, seated = !!me.sit, two = rest !== "mini" && C.partnerAtTable(), n = G().needOf(DB().uid);
    const rows = items.map((it) => {
      const b1 = `<button class="btn sm gold" data-act="g-ct-eat" data-r="${rest}" data-d="${it.id}" data-n="1" ${s.coins < it.price ? "disabled" : ""}>${it.price}🪙</button>`, c2 = Math.round(it.price * 2 * 0.85);
      const b2 = two ? `<button class="btn sm berry" data-act="g-ct-eat" data-r="${rest}" data-d="${it.id}" data-n="2" ${s.coins < c2 ? "disabled" : ""}>💕 لإثنين ${c2}🪙</button>` : "";
      return irow(it.e, it.n, `🍞+${it.food} 💧+${it.drink}`, b1 + b2);
    }).join("");
    const hint = rest === "mini" ? "" : seated ? (two ? `<p class="hint">💕 شريككم قاعد معكم! عشاء الإثنين بخصم 15٪ وبيشبعوا الاثنين</p>` : `<p class="hint">اقعدوا مع شريككم عالطاولة نفسها بتفتح عروض الإثنين 💕</p>`) : `<p class="hint">اضغطوا عالكرسي واقعدوا — وإذا شريككم قعد معكم بتاكلوا سوا 🪑💕</p>`;
    UI().openModal(`<h3>${title}</h3>${coin()}${meter("🍞 شبعك", n.food, "#f4a261")}${meter("💧 ريّك", n.drink, "#4aa3e0")}${hint}<div class="items" style="margin-top:8px">${rows}</div>`);
  }
  function shopWrap(title, tab, shopId) {
    return () => { const G_ = G(), fresh = document.querySelector("#modal").hidden; if (fresh) G_.ui.tab = tab; G_.shopId = shopId; G_.openers.shop(); const h = document.querySelector("#modalCard h3"); if (h) { h.textContent = title; const mul = G_.SHOP_MUL[shopId] || 1; if (mul !== 1) h.insertAdjacentHTML("afterend", `<p class="hint" style="margin:2px 0 6px">🏙️ أسعار المدينة ${mul < 1 ? "أرخص" : "أغلى"} بـ ${Math.round(Math.abs(1 - mul) * 100)}٪</p>`); } };
  }
  C.installUI = () => {
    const OP = G().openers; G().SHOP_MUL.cm = 0.95;
    OP.ct_taxi = () => {
      const z = C.zoneOf(W().getMe().x, W().getMe().z), s = G().state();
      const rows = Object.keys(C.STOPS).map((k) => { const st = C.STOPS[k]; return irow(st.e, st.n, z === k ? "📍 إنتوا هون" : `أجرة ${C.FARE}🪙 · رحلة فورية`, z === k ? "" : `<button class="btn sm gold" data-act="g-ct-go" data-to="${k}" ${s.coins < C.FARE ? "disabled" : ""}>🚕 اركبوا</button>`); }).join("");
      UI().openModal(`<h3>🚕 محطة المواصلات</h3>${coin()}<p class="hint">تاكسي بيوصلكم لأي منطقة بدون سيارة. كل واحد بيدفع أجرته 😉 (وإذا معكم سيارة، الطريق الطويل مفتوح للمدينة 🛣️)</p><div class="items">${rows}</div>`);
    };
    OP.ct_hotel = () => {
      const s = G().state(), h = validBooking();
      const rows = Object.keys(ROOMS).map((k) => { const R0 = ROOMS[k], mine = h && h.room === k; return irow(R0.e, R0.n, `${R0.note} · فطور 🍞${R0.food}`, mine ? `<small>✅ محجوزة</small>` : `<button class="btn sm gold" data-act="g-ct-book" data-k="${k}" ${s.coins < R0.price ? "disabled" : ""}>${R0.price}🪙 / ليلة</button>`); }).join("");
      const left = h ? Math.max(1, Math.ceil((h.until - Date.now()) / HOUR)) : 0;
      UI().openModal(`<h3>🏨 فندق الواحة</h3>${coin()}${h ? `<div class="chk" style="margin:6px 0;justify-content:center">✅ عندكم حجز: ${ROOMS[h.room].n} (باقي ~${left} ساعة)</div><div class="row"><button class="btn berry" data-act="g-ct-up">🛗 اطلعوا للغرفة</button></div>` : `<p class="hint">احجزوا غرفة للإثنين: بتبيتوا فيها وبتصحوا على فطور بيعبّي جوعكم وعطشكم ☕</p>`}<div class="items" style="margin-top:8px">${rows}</div>`);
    };
    OP.ct_bed = () => {
      const h = validBooking(); if (!h) { UI().closeModal(); return UI().toast("🔑 لازم حجز فعّال من الاستقبال"); }
      UI().openModal(`<h3>🛏️ ${ROOMS[h.room].n}</h3><p class="hint">${h.slept ? "استخدمتوا فطور هالحجز 😊 (النوم العادي ببيتكم)" : "نامو للصبح: بتصحوا الساعة ٧:٣٠ على فطور الفندق 🍳"}</p><div class="row"><button class="btn berry" data-act="g-ct-sleep">💤 ${h.slept ? "نامو بس" : "نامو للصبح"}</button></div>`);
    };
    OP.ct_menu = () => { const r = curRest(); if (!r) return UI().closeModal(); const T = RESTO[r] || { e: "🌯", n: "ساحة الطعام" }; menuUI(r, `${T.e} ${T.n}`); };
    OP.ct_minibar = () => menuUI("mini", "🥤 ميني بار (أسعار الفندق)");
    OP.ct_hosp = () => {
      const s = G().state(), n = G().needOf(DB().uid);
      UI().openModal(`<h3>🩺 عيادة مستشفى الشفاء</h3>${coin()}${meter("🍞 شبعك", n.food, "#f4a261")}${meter("💧 ريّك", n.drink, "#4aa3e0")}<p class="hint">الدكتورة بتفحصك وبتعطيك تغذية وسوائل: بيرجع شبعك وريّك 100 وبتمشي بسرعتك الطبيعية.</p><div class="items">${irow("🩺", "فحص وعلاج", "شبع وري 100", `<button class="btn sm gold" data-act="g-ct-heal" data-both="0" ${s.coins < 25 ? "disabled" : ""}>25🪙</button>`)}${irow("💞", "فحص للإثنين", "بتعالج الاثنين", `<button class="btn sm berry" data-act="g-ct-heal" data-both="1" ${s.coins < 45 ? "disabled" : ""}>45🪙</button>`)}</div>`);
    };
    OP.ct_police = () => {
      const s = G().state(), V = OSW.veh, away = V.owned().filter((c) => V.atOf(c) !== "H").length;
      UI().openModal(`<h3>👮 مركز الشرطة</h3>${coin()}<div class="items">${irow("🚗", "استرجاع السيارات", away ? `${away} سيارة برا الكراج — بنرجعها لكراج بيتكم` : "كل سياراتكم بكراج البيت", `<button class="btn sm gold" data-act="g-ct-cars" ${!away || s.coins < 10 ? "disabled" : ""}>10🪙</button>`)}${irow("🔎", "المفقودات والكنوز", "الشرطة بتدلكم على كنز مخبّأ بالقرية لسا ما لقيتوه", `<button class="btn sm alt" data-act="g-ct-hint" ${s.coins < 15 ? "disabled" : ""}>15🪙</button>`)}</div>`);
    };
    OP.ct_port = () => {
      const s = G().state(), P = G().PRODUCE, rows = Object.keys(P).filter((k) => s.inv[k] > 0).map((k) => irow(P[k].e, `${P[k].n} ×${s.inv[k]}`, `سعر الميناء ${Math.floor(P[k].sell * SELL_BONUS)}🪙 (أعلى بـ 15٪)`, `<button class="btn sm gold" data-act="g-ct-psell" data-id="${k}" data-q="1">بيع 1</button><button class="btn sm alt" data-act="g-ct-psell" data-id="${k}" data-q="${s.inv[k]}">الكل</button>`)).join("");
      UI().openModal(`<h3>⚓ سوق الميناء</h3>${coin()}<p class="hint">أبو يوسف بيشتري منتجات المزرعة والسمك بسعر أعلى من القرية 🐟 (وروحوا عالممر الخشبي للصيد 🎣)</p><div class="items">${rows || '<div class="empty">ما عندكم بيض أو حليب أو سمك للبيع. اصطادوا أو اجمعوا من الحظيرة 🥚</div>'}</div>`);
    };
    OP.ct_m_super = shopWrap("🛒 سوبرماركت المجمّع", "food", "cm"); OP.ct_m_pets = shopWrap("🐾 عالم الأليفة", "pets", "cm"); OP.ct_m_gift = shopWrap("🎁 محل الهدايا", "gift", "gs"); OP.ct_m_ing = shopWrap("🥬 الخضار والمواد", "ing", "cm");
    OP.ct_m_furn = () => { if (OP.furnstore) OP.furnstore(); else { G().shopId = "fu"; OP.furniture(); } const h = document.querySelector("#modalCard h3"); if (h) h.textContent = "🛋️ معرض الأثاث"; };
    OP.ct_m_fashion = () => OSW.places.open("boutique");
    OP.ct_m_court = () => menuUI("court", "🌯 ساحة الطعام");
    // قسم المدينة بخريطة القرية
    const mp = OP.map; if (mp) OP.map = () => {
      mp(); const card = document.querySelector("#modalCard"); if (!card) return;
      const btn = (k) => `<button data-act="g-ct-goto" data-p="${k}">${C.PLACES[k].e} ${C.PLACES[k].name}</button>`;
      card.insertAdjacentHTML("beforeend", `<b>🏙️ المدينة الكبرى (تاكسي ${C.FARE}🪙 أو سيارة)</b><div class="seg" style="margin:6px 0 10px;flex-wrap:wrap"><button data-act="g-ct-go" data-to="city">🚕 المحطة بالمدينة</button>${["hotel", "mall", "resto_a", "resto_b", "cafe", "hospital", "police", "port"].map(btn).join("")}</div>`);
    };
  };

  /* ============ الأفعال داخل النوافذ (g-ct-*) ============ */
  C.click = async (a, el) => {
    const ui = UI(), g = G(), busy = async (f) => { try { await f(); } catch (e) { ui.toast("⚠️ " + esc(e.message)); } };
    const poor = (n) => { if (g.state().coins < n) { ui.toast(`ما معك مصاري كفاية 🪙 (بدك ${n})`); return true; } return false; };
    switch (a) {
      case "g-ct-go": return C.travel(el.dataset.to);
      case "g-ct-goto": { const pl = C.PLACES[el.dataset.p], w = W(), me = w.getMe(); ui.closeModal(); if (w.mode !== "out") return ui.toast("اطلعوا من المكان أول 🚪"); if (w._int.me.veh) return ui.toast("🚪 انزلوا من السيارة أول");
        if (C.zoneOf(me.x, me.z) !== "city") { await C.travel("city"); if (C.zoneOf(w.getMe().x, w.getMe().z) !== "city") return; } w.goTo(pl.front.x, pl.front.z); return; }
      case "g-ct-book": { const R0 = ROOMS[el.dataset.k]; if (poor(R0.price)) return; return busy(async () => { await g.do("ct_book", { room: el.dataset.k }); OSW.audio.sfx("coin"); ui.toast(`🔑 ${R0.n} صارت إلكم! اطلعوا من المصعد 🛗`, "gold", 3500); }); }
      case "g-ct-up": ui.closeModal(); return C.toRoom();
      case "g-ct-sleep": ui.closeModal(); return busy(async () => { const first = !(validBooking() || {}).slept; await g.do("ct_slept", {}); await OSW.app.sleep(); if (first) ui.toast("🍳 فطور الفندق: شبعتوا وارتويتوا!", "gold", 3500); });
      case "g-ct-eat": { const it = MENU[el.dataset.r].find((x) => x.id === el.dataset.d), n = +el.dataset.n, c = n === 2 ? Math.round(it.price * 2 * 0.85) : it.price; if (poor(c)) return; return busy(async () => { await g.do("ct_meal", { r: el.dataset.r, d: it.id, n }); OSW.audio.sfx("pop"); ui.hearts(it.e, n === 2 ? 14 : 6); ui.toast(`${it.e} بالهنا والشفا${n === 2 ? " 💕" : ""}`); }); }
      case "g-ct-heal": { const both = el.dataset.both === "1"; if (poor(both ? 45 : 25)) return; return busy(async () => { await g.do("ct_heal", { both }); OSW.audio.sfx("magic"); ui.hearts("💚", 10); ui.toast("🩺 صحتكم تمام! شبع وري 100", "gold", 3000); }); }
      case "g-ct-cars": { if (poor(10)) return; return busy(async () => { await g.do("ct_fee", { k: "car" }); const n = OSW.veh.sendHome(); OSW.audio.sfx("door"); ui.toast(`🚓 رجعنا ${n} سيارة لكراج البيت`, "gold", 3000); }); }
      case "g-ct-hint": { if (poor(15)) return; return busy(async () => { await g.do("ct_fee", { k: "hint" }); ui.closeModal(); ui.toast("🔎 " + C.treasureHint(), "gold", 6500); }); }
      case "g-ct-psell": return busy(async () => { await g.do("ct_psell", { id: el.dataset.id, qty: +el.dataset.q }); OSW.audio.sfx("coin"); ui.toast("🪙 انباعت بسعر الميناء!"); });
    }
  };
  C.treasureHint = () => {
    const found = new Set(UI().my().found || []), list = (OSW.HIDDEN || []).filter((h) => !found.has(h.id));
    if (!list.length) return "لقيتوا كل الكنوز! 🏆";
    const h = list[((Date.now() / 86400000) | 0) % list.length], x = (h.x - 1300) / 21, z = (h.y - 940) / 21, S = OSW.S.pos;
    const names = { home: "بيتكم", fountain: "النافورة", tree: "شجرة العلاقة", plaza: "لوحة الساحة", shop: "بقالة سعدون", flowers: "ورود الحب", farm: "المزرعة", gate: "بوابة القرية", garden: "الحديقة", lighthouse: "المنارة" };
    const best = Object.keys(names).map((k) => [k, hy(S[k].x - x, S[k].z - z)]).sort((p, q) => p[1] - q[1])[0];
    return `كنز ${h.emoji} مخبّأ بالقرية، قريب من ${names[best[0]]} (حوالي ${Math.round(best[1])} متر)`;
  };

  /* ============ الانتقال بين مساحات الفندق + الجلوس ============ */
  const fade = async (fn) => { const w = W(), cur = document.getElementById("curtain"); w.setInputEnabled(false); OSW.audio.sfx("door"); cur.classList.add("on"); await OSW.sleep(330); fn(); OSW.game.sync3d(); await OSW.sleep(80); cur.classList.remove("on"); w.setInputEnabled(true); };
  C.toRoom = () => { if (!validBooking()) return UI().toast("🔑 احجزوا غرفة من الاستقبال أول"); return fade(() => { standUp(); W().leave(); W().enter("hotel_room"); UI().db.track && UI().db.track("in:hotel_room"); }); };
  C.toLobby = () => fade(() => { W().leave(); W().enter("hotel"); });
  function standUp() { const me = W()._int.me; if (!me.sit) return; const s = me.sit; me.sit = null; if (s.out) { me.x = s.out.x; me.z = s.out.z; } }
  C.sitAt = (idx) => {
    const w = W(), I = w._int.curInt(), me = w._int.me, s = I && I.seats && I.seats[idx]; if (!s || (me.sit && me.sit.idx === idx)) return;
    me.sit = { idx, x: s.x, z: s.z, ry: s.ry, tid: s.tid, out: s.out, tx: s.x + Math.sin(s.ry) * 1.35, tz: s.z + Math.cos(s.ry) * 1.35 };
    me.x = s.x; me.z = s.z; me.ry = s.ry; me.vx = me.vz = 0; OSW.audio.sfx("pop");
    if (MENU[w.interior] && w.interior !== "mini") setTimeout(() => OSW.app.goPlace("ct_menu"), 250);
  };
  C.tick = (dt, mode) => {
    const w = W(), me = w._int.me; if (!me.sit) return;
    const k = w._int.keys, j = w._int.joy;
    if (mode !== "in") me.sit = null;
    else if (k.l || k.r || k.u || k.d || hy(j.x, j.y) > 0.3) standUp();
    else { me.x = me.sit.x; me.z = me.sit.z; me.ry = me.sit.ry; me.vx = me.vz = 0; me.mv = 0; }
  };

  /* ============ ربط الأفعال ============ */
  C.onAct = (act) => {
    if (act.indexOf("ct:") !== 0) return false;
    const p = act.split(":"), k = p[1], app = OSW.app, w = W();
    if (k === "in") { app.enterInterior(p[2]); return true; }
    if (k === "sit") { C.sitAt(+p[2]); return true; }
    if (k === "elev") { C.toRoom(); return true; }
    if (k === "hexit") { C.toLobby(); return true; }
    if (k === "fish") { w.setInputEnabled(false); OSW.audio.sfx("pop"); OSW.places.open("fishing"); const pv = UI().onModalClose; UI().onModalClose = () => { pv && pv(); w.setInputEnabled(true); }; return true; }
    if (k === "m") { app.goPlace("ct_m_" + p[2]); return true; }
    const map = { taxi: "ct_taxi", hotel: "ct_hotel", bed: "ct_bed", menu: "ct_menu", minibar: "ct_minibar", hosp: "ct_hosp", matern: "ct_matern", police: "ct_police", port: "ct_port" };
    if (map[k]) app.goPlace(map[k]);
    return true;
  };
  C.start = () => {
    if (C._started) return; C._started = true; C.installUI();
    const w = W(); if (w.onReady) w.onReady(C.reattach); C.buildRoadLabels(); C.buildRoad();
    const hook = () => { const base = w.onAct; if (!base || base._ct) return setTimeout(hook, 50); const f = (act) => (C.onAct(act) ? undefined : base(act)); f._ct = 1; w.onAct = f; };
    setTimeout(hook, 0);
    // طلب "روح للمكان" لمنطقة ثانية بدون مواصلات
    const ap = OSW.app, gp = ap.goPlace; ap.goPlace = (id) => {
      const me = w.getMe(), poi = OSW.S.poi[id];
      if (w.mode === "out" && poi && !String(id).startsWith("ct") && C.zoneOf(poi.x, poi.z) !== C.zoneOf(me.x, me.z) && C.zoneOf(poi.x, poi.z) !== "island" && C.zoneOf(me.x, me.z) !== "island") return UI().toast("🚕 المكان بمنطقة ثانية — استخدموا التاكسي من المحطة أو سيارتكم", "", 3000);
      return gp(id);
    };
  };
  C.hookFold = () => {
    const gc = G().click; G().click = (a, el) => (a.indexOf("g-ct-") === 0 ? C.click(a, el) : gc(a, el));
    const X = OSW.extras; if (!X) return; const fo = X.fold, st = X.start;
    X.fold = (ty, e, d, t, a, day, S, H) => (ty.indexOf("ct_") === 0 ? C.fold(ty, e, d, t, a, day, S, H) : fo(ty, e, d, t, a, day, S, H));
    X.start = function () { const r = st.apply(X, arguments); try { C.start(); } catch (err) { console.error(err); } return r; };
  };
  C.hookFold();
})();
