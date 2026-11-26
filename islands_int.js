/* ============================================================
   عالمنا الصغير — داخليات الجزر (الحساب 2: العالم والتصميم)
   مقر الشركة، مصنع، مستودع، مدرسة، سينما. بتستعمل نفس قاعة المدينة (C.hall) وأنظمة الجلوس/الخروج.
   ============================================================ */
(function () {
  const OSW = window.OSW, C = OSW.city, INT = OSW.INT, D = window.OSW_ISL, PI = Math.PI, dk = OSW.col.dk, lt = OSW.col.lt, hall = C.hall, npc = C.intNpc;
  const NPC = (id, name, emoji, look, lines, act) => (OSW.NPC_BY[id] = { id, name, emoji, look, lines, act });
  NPC("isl_recep", "رنا (استقبال الشركة)", "🛎️", { gender: "girl", color: "#2b3a55", hair: "#2a1d12", hairStyle: "ponytail" }, ["أهلاً بكم بمقر الشركة 🏢", "غرف الاجتماعات جاهزة، والمدير بمكتبه ☕", "هون بتتابعوا استثماراتكم وصفقاتكم 📈"], "is:site:BIZ_HQ");
  NPC("isl_foreman", "أبو سالم (مشرف الخط)", "👷", { gender: "boy", color: "#f2a900", hair: "#2a1d12", hairStyle: "cap", cap: "#f2a900" }, ["خط الإنتاج شغّال ⚙️", "الخوذة أول شي، السلامة قبل كل شي 🦺", "المواد الخام بتوصل من الميناء والمزارع 🚛"], "is:site:IND_F5");
  NPC("isl_keeper", "أبو عمر (أمين المستودع)", "📦", { gender: "boy", color: "#6b4a3a", hair: "#3b2a20", hairStyle: "cap", cap: "#2b3a55" }, ["هاي الرفوف جاهزة لاستقبال البضائع 📦", "الشاحنات بتحمّل من الرصيف الخلفي 🚚", "كل طبلية إلها رقم ومكان 🔢"], "is:site:PORT_WH1");
  NPC("isl_teacher", "الأستاذة هدى", "👩‍🏫", { gender: "girl", color: "#9b5de5", hair: "#2a1d12", hairStyle: "long" }, ["أهلاً بكم بالمدرسة 🏫", "اليوم عندنا درس عن الزراعة والبحار 🌊", "العلم نور ✨"], "is:site:LIFE_SCHOOL");
  NPC("isl_cashier", "سلمى (شباك التذاكر)", "🎟️", { gender: "girl", color: "#e63946", hair: "#1b1b1b", hairStyle: "ponytail" }, ["أهلاً بكم بالسينما 🎬", "الفيلم هلأ بصالة ١ 🍿", "اختاروا أحلى كرسي!"], "is:site:LIFE_CINEMA");
  const glassWall = (B, I, x, z, w, d) => { B.box(x, 0, z, w, 2.6, d, "#cfeaf4", 0.12); B.box(x, 2.6, z, w + 0.05, 0.08, d + 0.05, "#9aa0a8"); I.solid(x, z, w, d); };
  const desk = (B, I, x, z, w, col, ry) => { B.push(x, 0, z, ry || 0); B.box(0, 0, 0, w, 0.85, 1.2, col); B.box(0, 0.85, 0, w + 0.1, 0.07, 1.3, lt(col, 0.25)); B.box(0, 0.93, -0.1, 0.7, 0.45, 0.06, "#222"); B.box(0, 0.93, -0.1, 0.62, 0.38, 0.07, "#4dabf7", 0.7); B.pop(); I.solid(x, z, Math.abs(Math.sin(ry || 0)) > 0.5 ? 1.2 : w, Math.abs(Math.sin(ry || 0)) > 0.5 ? w : 1.2); };
  const chair = (B, x, z, ry, col) => { B.push(x, 0, z, ry || 0); B.box(0, 0.45, 0, 0.6, 0.12, 0.6, col || "#2b3a55"); B.box(0, 0.57, -0.28, 0.6, 0.7, 0.1, col || "#2b3a55"); B.cyl(0, 0, 0, 0.06, 0.06, 0.45, "#555", 4); B.pop(); };
  const shelf = (B, I, x, z, w, ry) => { B.push(x, 0, z, ry || 0); B.box(0, 0, 0, w, 2.2, 0.5, "#6b4a3a"); for (let k = 0; k < 4; k++) { B.box(0, 0.2 + k * 0.5, 0.05, w - 0.1, 0.05, 0.5, "#8d6a45"); for (let i = -w / 2 + 0.4; i < w / 2 - 0.3; i += 0.45) B.box(i, 0.25 + k * 0.5, 0.05, 0.3, 0.38, 0.35, ["#a4452c", "#2a6fb5", "#e6b422", "#3c8d5a"][(k + Math.floor(i * 3)) & 3]); } B.pop(); I.solid(x, z, w, 0.6); };
  const rack = (B, I, x, z, w, rnd) => { B.box(x, 0, z, w, 0.15, 1.6, "#555"); [-w / 2 + 0.1, w / 2 - 0.1].forEach((dx) => { B.box(x + dx, 0, z - 0.7, 0.12, 5.2, 0.12, "#2a6fb5"); B.box(x + dx, 0, z + 0.7, 0.12, 5.2, 0.12, "#2a6fb5"); }); for (let k = 0; k < 3; k++) { B.box(x, 0.8 + k * 1.5, z, w, 0.1, 1.6, "#e07a3a"); for (let i = -w / 2 + 0.8; i < w / 2 - 0.5; i += 1.3) if (rnd() < 0.8) { B.box(x + i, 0.9 + k * 1.5, z, 1.0, 0.1, 1.1, "#a07a4a"); B.box(x + i, 1.0 + k * 1.5, z, 0.95, 0.9, 1.0, ["#c9a46a", "#b8935a", "#d9b57a", "#e9e1d0"][(rnd() * 4) | 0]); } } I.solid(x, z, w, 1.8); };

  /* ===== مقر الشركة ===== */
  INT.defs.isl_hq = () => {
    const I = hall({ id: "isl_hq", hw: 17, hd: 11, floor: "#d9d4cb", floor2: "#cbc5ba", wall: "#f1ece0", mat: "#2b3a55", cam: 24 }), B = I.B, ox = I.ox, z0 = I.z0, x0 = I.x0, x1 = I.x1, z1 = I.z1;
    I.desk(ox - 4, z0 + 1.3, 9, "#2b3a55", "is:site:BIZ_HQ", "🛎️ الاستقبال — مقر الشركة", "#2b3a55"); B.box(ox - 4, 2.1, z0 + 0.6, 6, 1.4, 0.1, "#2b3a55"); B.box(ox - 4, 2.3, z0 + 0.65, 5, 1, 0.05, "#ffd98a", 0.8);
    I.sofa(x0 + 3, z0 + 4.5, 4, PI / 2, "#6b7a99"); I.sofa(x0 + 3, z0 + 8, 3, PI / 2, "#6b7a99"); B.cyl(x0 + 5, 0, z0 + 6.2, 0.9, 0.9, 0.45, "#8d6e63", 10); I.solid(x0 + 5, z0 + 6.2, 1.8, 1.8);
    // 3 غرف اجتماعات زجاجية على الجهة اليمنى
    [0, 1, 2].forEach((k) => { const cz = z0 + 3.6 + k * 5.6, cx = x1 - 4.2; B.box(cx, -0.01, cz, 7.6, 0.03, 5, ["#c9d6e8", "#e8d6c9", "#d6e8c9"][k]); glassWall(B, I, cx - 3.8, cz, 0.12, 5); glassWall(B, I, cx, cz - 2.5, 7.6, 0.12); if (k === 2) glassWall(B, I, cx, cz + 2.5, 7.6, 0.12);
      B.box(cx + 0.4, 0, cz, 4.2, 0.8, 1.6, "#6b4a3a"); B.box(cx + 0.4, 0.8, cz, 4.3, 0.06, 1.7, "#a98462"); I.solid(cx + 0.4, cz, 4.3, 1.7); for (let i = -1; i <= 1; i++) { chair(B, cx + 0.4 + i * 1.3, cz - 1.3, 0); chair(B, cx + 0.4 + i * 1.3, cz + 1.3, PI); } B.box(x1 - 0.2, 1.0, cz, 0.08, 1.5, 2.6, "#111827"); B.box(x1 - 0.26, 1.0, cz, 0.05, 1.4, 2.5, "#4dabf7", 0.7); I.lab("mt" + k, `🗓️ غرفة اجتماعات ${k + 1}`, cx - 3.8, 3.4, cz, "is:site:BIZ_HQ"); });
    // مكتب المدير (يسار الخلف)
    const ox2 = ox - 11, oz2 = z0 + 3.2; glassWall(B, I, ox2 + 3.2, oz2 + 1.5, 0.12, 6); glassWall(B, I, ox2 - 0.2, oz2 + 4.5, 6.8, 0.12); desk(B, I, ox2, oz2 - 0.8, 3.2, "#5a3a22"); chair(B, ox2, oz2 - 2.1, 0, "#7a3b3b"); chair(B, ox2 - 1, oz2 + 1.4, PI, "#6b7a99"); chair(B, ox2 + 1, oz2 + 1.4, PI, "#6b7a99"); shelf(B, I, ox2 - 2.6, z0 + 0.5, 3, 0); I.plant(ox2 + 2.5, z0 + 1.2);
    // مكاتب مفتوحة
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { desk(B, I, ox - 8 + i * 3.6, 2 + j * 3, 2.2, "#c9b49a"); chair(B, ox - 8 + i * 3.6, 3.1 + j * 3, PI, "#2b3a55"); }
    [[x0 + 1.4, z1 - 1.4], [x1 - 1.4, z1 - 1.4]].forEach(([x, z]) => I.plant(x, z)); I.exit();
    return I.fin({ npcs: [npc("isl_recep_i", "isl_recep", ox - 4, z0 + 2.9, "is:site:BIZ_HQ")] });
  };
  /* ===== مصنع: خط إنتاج ===== */
  INT.defs.isl_factory = () => {
    const I = hall({ id: "isl_factory", hw: 21, hd: 13, floor: "#9a9b9f", floor2: "#8f9094", wall: "#d6d9dd", mat: "#e6b422", cam: 28 }), B = I.B, ox = I.ox, z0 = I.z0, x0 = I.x0, x1 = I.x1, z1 = I.z1, rnd = OSW.seeded(91);
    for (let k = 0; k < 3; k++) { const z = z0 + 4 + k * 4.4; B.box(ox - 2, 0, z, 30, 0.9, 1.4, "#3b3f47"); B.box(ox - 2, 0.9, z, 30.1, 0.08, 1.5, "#555"); for (let x = ox - 16.5; x < ox + 12.5; x += 0.6) B.box(x, 0.98, z, 0.25, 0.05, 1.3, "#2b2b30"); for (let x = ox - 15; x < ox + 11; x += 3.4) B.box(x, 1.0, z, 1.0 + rnd() * 0.5, 0.7 + rnd() * 0.5, 0.9, ["#c9a46a", "#d9b57a", "#4dabf7", "#e07a3a"][(k + Math.floor(x)) & 3]); I.solid(ox - 2, z, 30, 1.5);
      for (let m = 0; m < 4; m++) { const x = ox - 12 + m * 7.5; B.box(x, 0, z - 1.5, 2, 2.6, 1.2, k % 2 ? "#2a6fb5" : "#e07a3a"); B.box(x, 2.6, z - 1.5, 2.2, 0.15, 1.4, "#555"); B.box(x, 2.8, z - 1.5, 0.15, 0.15, 0.15, "#ff3b3b", 1); B.push(x, 1.0, z + 0.2, 0.1 * m); B.box(0, 0, 0, 0.35, 2.2, 0.35, "#e6b422"); B.box(0, 2.0, 0.7, 0.3, 0.3, 1.6, "#e6b422"); B.cyl(0, 1.85, 1.5, 0.22, 0.22, 0.4, "#555", 6); B.pop(); I.solid(x, z - 1.5, 2.2, 1.4); } }
    B.box(x1 - 4, 0, z0 + 3.4, 7, 2.6, 6, "#e6e8ea"); B.box(x1 - 4, 0.9, z0 + 6.45, 7, 1.4, 0.1, "#9fd4f0", 0.25); I.solid(x1 - 4, z0 + 3.4, 7, 6); desk(B, I, x1 - 5, z0 + 2, 3, "#555"); B.box(x1 - 4, 2.6, z0 + 3.4, 7.3, 0.2, 6.3, "#2b3a55"); I.act("is:site:IND_F5", x1 - 4, z0 + 6.6, 2.6, x1 - 4, z0 + 8, 1.2); I.lab("ctl", "🖥️ غرفة التحكّم", x1 - 4, 3.6, z0 + 6.4, "is:site:IND_F5");
    for (let i = 0; i < 6; i++) B.box(x0 + 2 + i * 2.5, 0.01, z1 - 3.5, 0.6, 0.015, 6.5, i % 2 ? "#e6b422" : "#2b2b30"); for (let i = 0; i < 4; i++) { B.box(x0 + 3 + i * 1.4, 0, z1 - 2.2, 1.2, 0.15, 1.2, "#a07a4a"); for (let k = 0; k < 1 + i % 3; k++) B.box(x0 + 3 + i * 1.4, 0.15 + k * 0.7, z1 - 2.2, 1.0, 0.7, 1.0, "#c9a46a"); } I.solid(x0 + 5.2, z1 - 2.2, 6, 1.4);
    B.push(x0 + 3, 0, 4, 0.6); B.box(0, 0.45, 0, 1.2, 0.7, 2.0, "#e6b422"); B.box(0, 1.15, -0.3, 1.1, 1.2, 1.1, "#27384a"); B.box(0, 1.2, 1.15, 0.7, 2.2, 0.15, "#555"); B.pop(); I.solid(x0 + 3, 4, 2, 2.4);
    [[x0 + 1.4, z0 + 1.4], [x0 + 1.4, z1 - 1.4]].forEach(([x, z]) => I.plant(x, z)); [-14, 0, 14].forEach((dx) => { B.cyl(ox + dx, 6.6, 0, 0.05, 0.05, 0.4, "#555", 4); }); I.exit();
    return I.fin({ npcs: [npc("isl_foreman_i", "isl_foreman", x1 - 9, z0 + 8.5, "is:site:IND_F5")] });
  };
  /* ===== مستودع الميناء ===== */
  INT.defs.isl_warehouse = () => {
    const I = hall({ id: "isl_warehouse", hw: 21, hd: 13, floor: "#a9a49a", floor2: "#9d988e", wall: "#c9ced3", mat: "#2a6fb5", cam: 28 }), B = I.B, ox = I.ox, z0 = I.z0, x0 = I.x0, x1 = I.x1, z1 = I.z1, rnd = OSW.seeded(33);
    for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 4; c2++) rack(B, I, x0 + 6 + c2 * 8.5, z0 + 4 + r * 4.6, 7, rnd);
    for (let i = 0; i < 3; i++) { B.box(x1 - 2.4, 0, z0 + 3 + i * 4, 0.3, 5, 3.4, "#d6d9dd"); for (let k = 0; k < 6; k++) B.box(x1 - 2.25, 0.4 + k * 0.7, z0 + 3 + i * 4, 0.1, 0.08, 3.3, "#9aa0a8"); B.box(x1 - 1.4, 0, z0 + 3 + i * 4, 2.6, 1.0, 3.6, "#8f9494"); }
    [[0, 0], [1.4, 0.2], [0, 1.4]].forEach(([a, b]) => { B.box(ox + 6 + a, 0, 6.5 + b, 1.2, 0.15, 1.2, "#a07a4a"); B.box(ox + 6 + a, 0.15, 6.5 + b, 1.0, 1.1, 1.0, "#c9a46a"); }); I.solid(ox + 6.7, 7, 3, 3);
    B.push(ox - 10, 0, 6.5, -0.4); B.box(0, 0.45, 0, 1.2, 0.7, 2.0, "#e6b422"); B.box(0, 1.15, -0.3, 1.1, 1.2, 1.1, "#27384a"); B.box(0, 1.2, 1.15, 0.7, 2.2, 0.15, "#555"); B.box(0, 0.15, 1.6, 0.9, 0.12, 1.0, "#555"); B.pop(); I.solid(ox - 10, 6.5, 2.2, 2.6);
    glassWall(B, I, x0 + 3.5, z1 - 2.8, 6, 0.12); glassWall(B, I, x0 + 6.5, z1 - 1.2, 0.12, 3.2); desk(B, I, x0 + 3, z1 - 1.3, 3, "#5a3a22"); I.act("is:site:PORT_WH1", x0 + 3, z1 - 1.3, 3, x0 + 3, z1 - 3.4, 1.1); I.lab("whd", "📋 مكتب المستودع", x0 + 3, 3.4, z1 - 1.3, "is:site:PORT_WH1");
    [[x0 + 1.4, z0 + 1.4]].forEach(([x, z]) => I.plant(x, z)); I.exit();
    return I.fin({ npcs: [npc("isl_keeper_i", "isl_keeper", x0 + 5, z1 - 4.3, "is:site:PORT_WH1")] });
  };
  /* ===== المدرسة ===== */
  INT.defs.isl_school = () => {
    const I = hall({ id: "isl_school", hw: 18, hd: 11, floor: "#e6d7b0", floor2: "#dccb9e", wall: "#fbf1d4", mat: "#a4452c", cam: 24 }), B = I.B, ox = I.ox, z0 = I.z0, x0 = I.x0, x1 = I.x1, z1 = I.z1;
    [0, 1, 2].forEach((k) => { const cx = x0 + 6.2 + k * 11.6, cz = z0 + 4.6; glassWall(B, I, cx + 5.8, cz, 0.12, 9.2); B.box(cx, 0.9, z0 + 0.15, 7, 2, 0.1, "#2f4f3a"); B.box(cx, 0.85, z0 + 0.2, 7.2, 0.12, 0.12, "#a98462"); B.box(cx, 2.1, z0 + 0.25, 3, 0.4, 0.05, "#fff");
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = cx - 2.4 + i * 2.4, z = cz - 0.4 + j * 2.1; B.box(x, 0, z, 1.2, 0.75, 0.8, "#c9a46a"); B.box(x, 0.75, z, 1.3, 0.06, 0.9, "#a98462"); I.solid(x, z, 1.2, 0.8); chair(B, x, z + 0.8, PI, "#2a6fb5"); }
      desk(B, I, cx, cz - 2.6, 2.6, "#8d6a45"); I.lab("cl" + k, `📚 فصل ${k + 1}`, cx, 3.6, cz - 3, "is:site:LIFE_SCHOOL"); });
    B.box(ox, 0.01, 5.8, 34, 0.02, 0.2, "#a4452c"); [[x0 + 2, 7], [x1 - 2, 7]].forEach(([x, z]) => { B.box(x, 0, z, 1.0, 1.9, 0.7, "#2a6fb5"); I.solid(x, z, 1, 0.7); }); [[x0 + 1.4, z1 - 1.4], [x1 - 1.4, z1 - 1.4]].forEach(([x, z]) => I.plant(x, z));
    I.act("is:site:LIFE_SCHOOL", ox, z0 + 8.4, 3, ox, z0 + 10, 1.2); I.exit();
    return I.fin({ npcs: [npc("isl_teacher_i", "isl_teacher", x0 + 6.2, z0 + 2.6, "is:site:LIFE_SCHOOL", PI)] });
  };
  /* ===== السينما ===== */
  INT.defs.isl_cinema = () => {
    const I = hall({ id: "isl_cinema", hw: 15, hd: 12, floor: "#4a2b3a", floor2: "#3f2432", wall: "#2b1d2e", mat: "#e63946", cam: 25 }), B = I.B, ox = I.ox, z0 = I.z0, x0 = I.x0, x1 = I.x1, z1 = I.z1;
    B.box(ox, 1.2, z0 + 0.2, 20, 7.5, 0.2, "#111"); B.box(ox, 1.4, z0 + 0.32, 18.5, 6.6, 0.06, "#7fd3ff", 0.85); B.box(ox, 0, z0 + 1, 20, 0.3, 1.4, "#3b1f2b");
    for (let r = 0; r < 5; r++) for (let c2 = -4; c2 <= 4; c2++) { if (c2 === 0) continue; const x = ox + c2 * 2.2 + (c2 > 0 ? -0.5 : 0.5), z = z0 + 6 + r * 2.1, y = r * 0.18; B.push(x, y, z, PI); B.box(0, 0, 0, 1.4, 0.5, 1.2, "#c0392b"); B.box(0, 0.5, -0.5, 1.4, 1.0, 0.2, "#a8321f"); B.box(-0.65, 0.5, 0, 0.12, 0.35, 1.0, "#7a1f12"); B.box(0.65, 0.5, 0, 0.12, 0.35, 1.0, "#7a1f12"); B.pop(); const si = I.seats.length; I.seats.push({ x, z: z + 0.1, ry: PI, tid: "cn", out: { x, z: z + 1.6 } }); I.act("ct:sit:" + si, x, z, 0.9, x, z + 1.5, 0.6); }
    I.desk(x1 - 4.6, z1 - 3, 6, "#a8321f", "is:site:LIFE_CINEMA", "🍿 شباك التذاكر والفشار", "#e63946"); B.box(x1 - 4.6, 1.15, z1 - 3, 1.1, 0.8, 0.8, "#ffe9a8"); for (let i = 0; i < 3; i++) { B.box(x0 + 2 + i * 2.4, 0, z1 - 1.4, 1.6, 2.6, 0.12, ["#e63946", "#4dabf7", "#f4a261"][i]); B.box(x0 + 2 + i * 2.4, 0.2, z1 - 1.3, 1.4, 2.2, 0.05, "#f4f1e8"); }
    [[x0 + 1.4, z0 + 1.4], [x1 - 1.4, z0 + 1.4]].forEach(([x, z]) => I.plant(x, z)); I.exit();
    return I.fin({ npcs: [npc("isl_cashier_i", "isl_cashier", x1 - 4.6, z1 - 4.7, "is:site:LIFE_CINEMA", PI)] });
  };
  // أماكن الخروج الافتراضية (بتتعدّل لحظة الدخول حسب المبنى)
  Object.keys(D.interiors).forEach((k) => { const s = D.site(D.interiors[k].site); INT.outAt[k] = { x: s.front.x, z: s.front.z }; INT.enterAct[k] = "is:in:" + s.id; });
})();
