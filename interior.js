/* الأماكن من جوّا: بيتنا (5 غرف بس)، الدكان، محل الأناقة */
(function () {
  const OSW = window.OSW, R = OSW.R, Builder = OSW.Builder, PI = Math.PI, dk = OSW.col.dk, lt = OSW.col.lt;
  /* البيت: شبكة 3×2 — فوق: النوم | الذكريات | المطبخ — تحت: الصالون (عريض) | الشرفة */
  const HOME = (OSW.HOME = { ox: 411, oz: 0, cols: 5, rows: 2, rw: 11, rd: 9, wh: 1.15, wt: 0.3, door: 3.2 });
  const X0 = HOME.ox - (HOME.cols * HOME.rw) / 2, X1 = X0 + HOME.cols * HOME.rw, Z0 = HOME.oz - (HOME.rows * HOME.rd) / 2, Z1 = Z0 + HOME.rows * HOME.rd;
  const gx = (c) => X0 + c * HOME.rw, gz = (r) => Z0 + r * HOME.rd;
  const DEF = [
    { id: "bedroom", n: "غرفة النوم", e: "🛏️", c0: 0, c1: 1, r0: 0, r1: 1, wall: "#e4d3f3", floor: "#c4aedb", tile: "#d3c1e5" },
    { id: "memories", n: "غرفة الذكريات", e: "📷", c0: 1, c1: 2, r0: 0, r1: 1, wall: "#fbd3e2", floor: "#e5aec3", tile: "#efc3d4" },
    { id: "kitchen", n: "المطبخ", e: "🍳", c0: 2, c1: 3, r0: 0, r1: 1, wall: "#f5e8c8", floor: "#dccaa0", tile: "#e8d9b6" },
    { id: "living", n: "الصالون", e: "🛋️", c0: 0, c1: 2, r0: 1, r1: 2, wall: "#fbe0c0", floor: "#d2a875", tile: "#dcb685" },
    { id: "balcony", n: "الشرفة", e: "🌿", c0: 2, c1: 3, r0: 1, r1: 2, wall: "#d2eec9", floor: "#9fc592", tile: "#afd2a2" },
    { id: "draw", n: "غرفة تحدي الرسم", e: "🎨", c0: 3, c1: 4, r0: 0, r1: 1, wall: "#ffe1b8", floor: "#f0c78f", tile: "#f7d6a5" },
    { id: "dressing", n: "غرفة الأزياء", e: "👗", c0: 3, c1: 4, r0: 1, r1: 2, wall: "#f3d6f5", floor: "#c9a6d6", tile: "#d8b8e3" },
    { id: "kidsroom", n: "غرفة الأولاد", e: "🧸", c0: 4, c1: 5, r0: 0, r1: 1, wall: "#cfe8ff", floor: "#9cc7ee", tile: "#b3d6f5" },
    { id: "playroom", n: "غرفة اللعب", e: "🎈", c0: 4, c1: 5, r0: 1, r1: 2, wall: "#d9f5d0", floor: "#a8d89a", tile: "#bde6b0" },
  ];
  const rooms = (HOME.rooms = DEF.map((d) => { const x0 = gx(d.c0), x1 = gx(d.c1), z0 = gz(d.r0), z1 = gz(d.r1); return { id: d.id, name: d.n, emoji: d.e, wall: d.wall, floor: d.floor, tile: d.tile, x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, keep: [] }; }));
  HOME.byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
  HOME.bounds = { x0: X0, x1: X1, z0: Z0, z1: Z1 };
  const living = HOME.byId.living, bedroom = HOME.byId.bedroom, kitchen = HOME.byId.kitchen, kidsroom = HOME.byId.kidsroom, playroom = HOME.byId.playroom;
  HOME.exitDoor = { x: gx(1), z: Z1 };
  const doors = (HOME.doors = []);
  const dv = (x, z) => doors.push({ x, z, v: true }), dh = (x, z) => doors.push({ x, z, v: false });
  dv(gx(1), gz(0) + HOME.rd / 2); dv(gx(2), gz(0) + HOME.rd / 2); dv(gx(2), gz(1) + HOME.rd / 2); dv(gx(3), gz(0) + HOME.rd / 2); dv(gx(3), gz(1) + HOME.rd / 2); dh(gx(3) + HOME.rw / 2, gz(1));
  dv(gx(4), gz(0) + HOME.rd / 2); dv(gx(4), gz(1) + HOME.rd / 2); dh(gx(4) + HOME.rw / 2, gz(1));
  dh(gx(0) + HOME.rw / 2, gz(1)); dh(gx(1) + HOME.rw / 2, gz(1)); dh(gx(2) + HOME.rw / 2, gz(1));
  doors.push({ x: HOME.exitDoor.x, z: HOME.exitDoor.z, v: false, exit: true });
  HOME.roomAt = (x, z) => rooms.find((r) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1);
  const ov = (a, b, m = 0) => a.x0 < b.x1 - m && a.x1 > b.x0 + m && a.z0 < b.z1 - m && a.z1 > b.z0 + m;
  HOME.valid = (item, x, z, rot, others, ignoreId) => {
    const f = OSW.FURN[item]; if (!f) return false; const r = OSW.furnRect(item, x, z, rot), room = HOME.roomAt(x, z); if (!room) return false;
    if (r.x0 < room.x0 + 0.55 || r.x1 > room.x1 - 0.55 || r.z0 < room.z0 + 0.55 || r.z1 > room.z1 - 0.55) return false;
    for (const k of room.keep) if (ov(r, k)) return false;
    for (const d of doors) { const nx = Math.max(r.x0, Math.min(d.x, r.x1)), nz = Math.max(r.z0, Math.min(d.z, r.z1)); if (Math.hypot(nx - d.x, nz - d.z) < 2.2) return false; }
    for (const o of others) { if (o.id === ignoreId) continue; const g = OSW.FURN[o.item]; if (!g) continue; if (f.flat && g.flat) { if (ov(r, OSW.furnRect(o.item, o.x, o.z, o.rot))) return false; continue; } if (f.flat || g.flat) continue; if (ov(r, OSW.furnRect(o.item, o.x, o.z, o.rot), 0.04)) return false; }
    return true;
  };
  HOME.defaults = [
    { id: "def:bed", item: "bed2", x: bedroom.cx - 2.6, z: bedroom.cz + 1.0, rot: 0 },
    { id: "def:ns", item: "nstand", x: bedroom.cx - 0.9, z: bedroom.cz + 0.2, rot: 0 },
    { id: "def:sofa", item: "sofa3", x: living.cx, z: living.cz + 1.5, rot: 2 },
    { id: "def:rug", item: "rugS", x: living.cx, z: living.cz - 0.4, rot: 0 },
    { id: "def:ct", item: "ctable", x: living.cx, z: living.cz - 0.4, rot: 0 },
    { id: "def:plant", item: "plantL", x: living.x1 - 1.4, z: living.z0 + 1.3, rot: 0 },
    { id: "def:dt", item: "dtable", x: kitchen.cx - 0.8, z: kitchen.cz + 1.3, rot: 0 },
    // غرفة الأولاد: 4 تخوت + لعب
    { id: "def:kb1", item: "bed1", x: kidsroom.cx - 4.0, z: kidsroom.z0 + 2.1, rot: 0 },
    { id: "def:kb2", item: "bed1", x: kidsroom.cx - 1.3, z: kidsroom.z0 + 2.1, rot: 0 },
    { id: "def:kb3", item: "bed1", x: kidsroom.cx + 1.4, z: kidsroom.z0 + 2.1, rot: 0 },
    { id: "def:kb4", item: "bed1", x: kidsroom.cx + 4.1, z: kidsroom.z0 + 2.1, rot: 0 },
    { id: "def:krug", item: "rugR", x: kidsroom.cx, z: kidsroom.cz + 1.6, rot: 0 },
    { id: "def:kted", item: "teddy", x: kidsroom.cx - 3.6, z: kidsroom.cz + 2.8, rot: 0 },
    { id: "def:kballoon", item: "balloons", x: kidsroom.cx + 3.8, z: kidsroom.cz + 2.9, rot: 0 },
    // غرفة اللعب
    { id: "def:prug", item: "rugS", x: playroom.cx, z: playroom.cz, rot: 0 },
    { id: "def:pbag1", item: "beanbag", x: playroom.cx - 3.6, z: playroom.cz + 1.6, rot: 0 },
    { id: "def:pbag2", item: "beanbag", x: playroom.cx + 3.6, z: playroom.cz + 1.6, rot: 0 },
    { id: "def:pshelf", item: "bookshelf", x: playroom.cx, z: playroom.z0 + 1.0, rot: 0 },
  ];

  const INT = (OSW.INT = { cache: {}, defs: {} });
  function wallBox(B, boxes, x0, z0, x1, z1, col) {
    const t = HOME.wt, h = HOME.wh; let cx, cz, w, d;
    if (x0 === x1) { cx = x0; cz = (z0 + z1) / 2; w = t; d = Math.abs(z1 - z0); } else { cx = (x0 + x1) / 2; cz = z0; w = Math.abs(x1 - x0); d = t; }
    if (w < 0.05 || d < 0.05) return; B.box(cx, 0, cz, w, h, d, col || "#efe4d2"); B.box(cx, h, cz, w + 0.04, 0.1, d + 0.04, "#b7a58a"); boxes.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
  }
  /* جدار مستقيم مع فتحات أبواب (gaps = مراكز الأبواب) */
  function wallLine(B, boxes, x0, z0, x1, z1, gaps, col) {
    const horiz = z0 === z1, a = horiz ? x0 : z0, b = horiz ? x1 : z1, hg = HOME.door / 2; let cur = a;
    const seg = (p, q) => { if (q - p < 0.05) return; if (horiz) wallBox(B, boxes, p, z0, q, z0, col); else wallBox(B, boxes, x0, p, x0, q, col); };
    gaps.slice().sort((p, q) => p - q).forEach((m) => { seg(cur, m - hg); cur = m + hg; }); seg(cur, b);
    gaps.forEach((m) => { if (horiz) B.box(m, 0.01, z0, HOME.door, 0.02, 0.9, "#b08968"); else B.box(x0, 0.01, m, 0.9, 0.02, HOME.door, "#b08968"); });
  }
  /* رف على الحيط (صور أو أغاني) */
  function shelf(B, x, z, w, kind) {
    B.box(x, 0, z - 0.28, w, 2.1, 0.1, "#5d4037"); B.box(x - w / 2 + 0.05, 0, z, 0.1, 2.1, 0.7, "#8d6e63"); B.box(x + w / 2 - 0.05, 0, z, 0.1, 2.1, 0.7, "#8d6e63");
    [0, 0.7, 1.4, 2.05].forEach((y) => B.box(x, y, z, w, 0.08, 0.7, "#a97c50"));
    const fr = ["#ff7aa8", "#ffd23f", "#4dabf7", "#7ac74f", "#9b5de5", "#ff8c42"];
    [0.1, 0.8, 1.5].forEach((y, lv) => {
      for (let k = 0; k < 4; k++) {
        const px = x - w / 2 + 0.5 + k * ((w - 1.0) / 3);
        if (kind === "photos") { B.box(px, y, z + 0.18, 0.5, 0.56, 0.07, fr[(k + lv) % 6]); B.box(px, y + 0.07, z + 0.23, 0.38, 0.42, 0.05, lt(fr[(k + lv + 2) % 6], 0.5)); }
        else { B.box(px, y, z + 0.02, 0.07, 0.56, 0.56, "#222"); B.box(px + 0.04, y + 0.18, z + 0.02, 0.02, 0.2, 0.2, fr[(k + lv) % 6]); B.box(px - 0.3 + (lv ? 0 : 0.0), y, z + 0.28, 0.2, 0.05, 0.05, "#888"); }
      }
    });
    if (kind === "songs") { B.box(x, 2.18, z, 0.9, 0.4, 0.5, "#333"); B.sphere(x - 0.2, 2.38, z + 0.26, 0.14, 0.14, 0.05, "#ff7aa8", 6, 1); B.sphere(x + 0.2, 2.38, z + 0.26, 0.14, 0.14, 0.05, "#7bdff2", 6, 1); }
    else B.sphere(x, 2.45, z, 0.28, 0.28, 0.28, "#ff4d6d", 6, 1);
  }
  const keepAt = (room, x0, z0, x1, z1) => room.keep.push({ x0, z0, x1, z1 });
  function build_home() {
    const B = new Builder(), boxes = [], acts = [], labels = [], poi = {};
    const act = (a, x, y, z, r, px, pz) => { acts.push({ act: a, x, y, z, r }); poi[a] = { x: px, z: pz }; };
    rooms.forEach((r) => {
      const w = r.x1 - r.x0, d = r.z1 - r.z0;
      B.box(r.cx, -0.15, r.cz, w, 0.15, d, r.floor);
      for (let i = 0; i < Math.floor(w); i++) for (let j = 0; j < Math.floor(d); j++) if ((i + j) % 2 === 0) B.box(r.x0 + 0.5 + i * (w / Math.floor(w)) + (w / Math.floor(w) - 1) / 2, 0, r.z0 + 0.5 + j * (d / Math.floor(d)) + (d / Math.floor(d) - 1) / 2, w / Math.floor(w), 0.012, d / Math.floor(d), r.tile);
      B.box(r.cx, 0, r.z0 + 0.35, w - 0.2, 1.0, 0.1, r.wall); B.box(r.cx, 1.0, r.z0 + 0.35, w - 0.2, 0.06, 0.14, lt(r.wall, 0.3));
      labels.push({ id: "rn_" + r.id, text: `${r.emoji} ${r.name}`, x: r.cx, y: 2.8, z: r.cz - 0.2, cls: "sm", max: 36, scope: "in" });
    });
    const eg = HOME.exitDoor, hg = HOME.door / 2, OUT = "#e0cfb2";
    wallBox(B, boxes, X0, Z0, X1, Z0, OUT); wallBox(B, boxes, X0, Z0, X0, Z1, OUT); wallBox(B, boxes, X1, Z0, X1, Z1, OUT);
    wallBox(B, boxes, X0, Z1, eg.x - hg, Z1, OUT); wallBox(B, boxes, eg.x + hg, Z1, X1, Z1, OUT);
    wallLine(B, boxes, gx(1), gz(0), gx(1), gz(1), [gz(0) + HOME.rd / 2]);
    wallLine(B, boxes, gx(2), gz(0), gx(2), gz(2), [gz(0) + HOME.rd / 2, gz(1) + HOME.rd / 2]);
    wallLine(B, boxes, gx(3), gz(0), gx(3), gz(2), [gz(0) + HOME.rd / 2, gz(1) + HOME.rd / 2]);
    wallLine(B, boxes, gx(4), gz(0), gx(4), gz(2), [gz(0) + HOME.rd / 2, gz(1) + HOME.rd / 2]);
    wallLine(B, boxes, X0, gz(1), X1, gz(1), [gx(0) + HOME.rw / 2, gx(1) + HOME.rw / 2, gx(2) + HOME.rw / 2, gx(3) + HOME.rw / 2, gx(4) + HOME.rw / 2]);
    B.box(eg.x - hg - 0.1, 0, eg.z, 0.3, 2.6, 0.5, "#8d6e63"); B.box(eg.x + hg + 0.1, 0, eg.z, 0.3, 2.6, 0.5, "#8d6e63"); B.box(eg.x, 2.4, eg.z, HOME.door + 0.7, 0.35, 0.5, "#8d6e63"); B.box(eg.x, 0.02, eg.z - 1.1, 2.4, 0.03, 1.0, "#c0584c");
    B.sphere(eg.x, 2.75, eg.z, 0.2, 0.2, 0.2, "#ffe7a0", 6, 1);
    act("exit", eg.x, 1.2, eg.z - 0.3, 2.4, eg.x, eg.z - 2.0);
    labels.push({ id: "exitl", text: "🚪 اطلع للقرية", x: eg.x, y: 3.4, z: eg.z, cls: "sm tap", act: "exit", max: 40, scope: "in" });

    /* --- غرفة النوم: رف الصور + رف الأغاني + لمبة القمر --- */
    const bd = bedroom;
    [["photos", bd.cx - 3.2, "🖼️ رف الصور"], ["songs", bd.cx + 3.2, "🎵 رف الأغاني"]].forEach(([id, sx, txt]) => {
      const sz = bd.z0 + 0.8; shelf(B, sx, sz, 2.8, id); boxes.push({ x0: sx - 1.4, x1: sx + 1.4, z0: sz - 0.4, z1: sz + 0.4 });
      act("console:" + id, sx, 1.1, sz, 1.9, sx, sz + 2.4); labels.push({ id: "con_" + id, text: txt, x: sx, y: 3.0, z: sz + 0.2, cls: "sm tap", act: "console:" + id, max: 26, scope: "in" });
      keepAt(bd, sx - 1.7, bd.z0, sx + 1.7, sz + 1.9);
    });
    B.cyl(bd.cx, 0, bd.z0 + 1.0, 0.4, 0.4, 0.8, "#8d6e63", 8); B.cyl(bd.cx, 0.8, bd.z0 + 1.0, 0.5, 0.5, 0.06, "#d7b98a", 8); B.sphere(bd.cx, 1.35, bd.z0 + 1.0, 0.42, 0.42, 0.42, "#fff2b0", 10, 1);
    boxes.push({ x0: bd.cx - 0.5, x1: bd.cx + 0.5, z0: bd.z0 + 0.5, z1: bd.z0 + 1.5 });
    act("scene:goodnight", bd.cx, 1.1, bd.z0 + 1.0, 1.4, bd.cx, bd.z0 + 2.8); labels.push({ id: "sc_goodnight", text: "🌙", x: bd.cx, y: 2.6, z: bd.z0 + 1.0, cls: "sm tap", act: "scene:goodnight", max: 26, scope: "in" });
    keepAt(bd, bd.cx - 1.0, bd.z0, bd.cx + 1.0, bd.z0 + 2.0);

    /* --- غرفة الذكريات: ألبوم الذكريات + كاميرا سيلفي --- */
    const me = HOME.byId.memories;
    B.disc(me.cx, 0.02, me.cz + 0.8, 2.6, "#f4b6cd", 24); B.disc(me.cx, 0.03, me.cz + 0.8, 1.9, "#f9d3e1", 24);
    B.cyl(me.cx, 0, me.z0 + 1.6, 0.95, 1.05, 0.95, "#8d6e63", 10); B.cyl(me.cx, 0.95, me.z0 + 1.6, 1.15, 1.15, 0.08, "#d7b98a", 10);
    B.box(me.cx, 1.03, me.z0 + 1.6, 1.5, 0.16, 1.0, "#b83a6b"); B.box(me.cx, 1.19, me.z0 + 1.6, 1.36, 0.05, 0.86, "#fff6ea"); B.sphere(me.cx, 1.55, me.z0 + 1.6, 0.26, 0.24, 0.12, "#ff4d6d", 8, 1);
    boxes.push({ x0: me.cx - 1.1, x1: me.cx + 1.1, z0: me.z0 + 0.5, z1: me.z0 + 2.7 });
    act("console:memories", me.cx, 1.2, me.z0 + 1.6, 2.0, me.cx, me.z0 + 3.9); labels.push({ id: "con_memories", text: "📷 ألبوم الذكريات", x: me.cx, y: 3.0, z: me.z0 + 1.6, cls: "sm tap", act: "console:memories", max: 26, scope: "in" });
    keepAt(me, me.cx - 1.6, me.z0, me.cx + 1.6, me.z0 + 3.2);
    const tx = me.x0 + 1.7, tz = me.z1 - 1.9;
    [[-0.3, -0.2], [0.3, -0.2], [0, 0.35]].forEach(([dx, dz]) => B.cyl(tx + dx, 0, tz + dz, 0.04, 0.04, 1.2, "#555", 4)); B.box(tx, 1.2, tz, 0.6, 0.4, 0.4, "#2b2b30"); B.sphere(tx, 1.4, tz + 0.22, 0.14, 0.14, 0.08, "#8fd0ff", 6, 1);
    boxes.push({ x0: tx - 0.5, x1: tx + 0.5, z0: tz - 0.5, z1: tz + 0.6 });
    act("scene:selfie", tx, 1.2, tz, 1.5, tx + 1.8, tz); labels.push({ id: "sc_selfie", text: "📸 سيلفي", x: tx, y: 2.5, z: tz, cls: "sm tap", act: "scene:selfie", max: 26, scope: "in" });
    keepAt(me, tx - 1.0, tz - 1.0, tx + 1.0, tz + 1.0);

    /* --- المطبخ: كاونتر + ثلاجة + بوتاجاز --- */
    const k = kitchen, kz = k.z0 + 0.75;
    B.box(k.x0 + 1.2, 0, kz, 1.1, 2.0, 0.9, "#e8eef2"); B.box(k.x0 + 1.2, 1.2, kz + 0.47, 0.06, 0.3, 0.04, "#999");
    for (let i = 0; i < 6; i++) { const px = k.x0 + 2.5 + i * 1.3, st = i === 3; B.box(px, 0, kz, 1.3, 0.95, 0.8, st ? "#555" : "#d9c9a3"); B.box(px, 0.95, kz, 1.34, 0.1, 0.9, st ? "#333" : "#8f8f8f");
      if (st) { [[-0.3, -0.15], [0.3, -0.15], [-0.3, 0.2], [0.3, 0.2]].forEach(([dx, dz]) => B.cyl(px + dx, 1.05, kz + dz, 0.2, 0.2, 0.03, "#ff7a3d", 8)); B.cyl(px, 1.06, kz, 0.28, 0.25, 0.32, "#9a9a9a", 8); B.sphere(px, 1.62, kz, 0.2, 0.28, 0.2, "#ffffff", 6, 0.5); } else if (i === 1) B.cyl(px, 1.05, kz, 0.35, 0.3, 0.05, "#cfd3d8", 8); }
    const sx = k.x0 + 2.5 + 3 * 1.3; boxes.push({ x0: k.x0 + 0.5, x1: k.x1 - 0.5, z0: k.z0, z1: k.z0 + 1.3 });
    act("scene:cook", sx, 1.1, kz, 2.2, sx, kz + 2.6); labels.push({ id: "sc_cook", text: "🍳 اطبخوا سوا", x: sx, y: 2.5, z: kz + 0.3, cls: "sm tap", act: "scene:cook", max: 26, scope: "in" });
    keepAt(k, k.x0, k.z0, k.x1, k.z0 + 1.9);

    /* --- الصالون: شاشة أفلام + صندوق البريد --- */
    const lv = living, tvx = lv.cx, tvz = lv.z0 + 0.8;
    B.box(tvx, 0, tvz, 3.6, 0.55, 0.8, "#6b4a3a"); B.box(tvx, 0.55, tvz, 2.4, 1.5, 0.12, "#15151a"); B.box(tvx, 0.65, tvz + 0.08, 2.2, 1.3, 0.04, "#8fd0ff", 1);
    boxes.push({ x0: tvx - 1.8, x1: tvx + 1.8, z0: lv.z0 + 0.3, z1: lv.z0 + 1.3 });
    act("scene:movie", tvx, 1.2, tvz, 2.2, tvx, tvz + 3.0); labels.push({ id: "sc_movie", text: "📺 سهرة فيلم", x: tvx, y: 2.9, z: tvz + 0.2, cls: "sm tap", act: "scene:movie", max: 26, scope: "in" });
    keepAt(lv, tvx - 2.1, lv.z0, tvx + 2.1, lv.z0 + 1.9);
    const mx = lv.cx + 4.4, mz = lv.z1 - 1.3;
    B.cyl(mx, 0, mz, 0.1, 0.1, 1.1, "#555", 6); B.box(mx, 1.1, mz, 0.9, 0.55, 0.55, "#e5484d"); B.box(mx, 1.65, mz, 0.95, 0.08, 0.6, "#b3262b"); B.sphere(mx, 1.4, mz + 0.3, 0.14, 0.14, 0.05, "#fff", 6, 1);
    boxes.push({ x0: mx - 0.5, x1: mx + 0.5, z0: mz - 0.4, z1: mz + 0.4 });
    act("console:letters", mx, 1.3, mz, 1.6, mx, mz - 1.6); labels.push({ id: "con_letters", text: "📮 البريد", x: mx, y: 2.7, z: mz, cls: "sm tap", act: "console:letters", max: 26, scope: "in" });
    keepAt(lv, mx - 1.0, mz - 1.8, mx + 1.0, mz + 0.8);

    /* --- الشرفة: تلسكوب + نجمة الأحلام + نباتات --- */
    const bl = HOME.byId.balcony;
    for (let i = 0; i < 4; i++) { const px = bl.x0 + 1.6 + i * 2.5; B.box(px, 0, bl.z1 - 0.7, 1.8, 0.45, 0.6, "#8a5a3b"); B.sphere(px, 0.8, bl.z1 - 0.7, 0.55, 0.45, 0.5, "#4fa860", 6); B.sphere(px + 0.2, 1.0, bl.z1 - 0.65, 0.2, 0.2, 0.2, ["#ff7aa8", "#ffd23f"][i % 2], 5, 0.4); }
    boxes.push({ x0: bl.x0 + 0.6, x1: bl.x1 - 0.5, z0: bl.z1 - 1.1, z1: bl.z1 });
    const tx2 = bl.x1 - 1.8, tz2 = bl.z0 + 1.6;
    [[-0.3, -0.2], [0.3, -0.2], [0, 0.35]].forEach(([dx, dz]) => B.cyl(tx2 + dx, 0, tz2 + dz, 0.04, 0.04, 1.1, "#555", 4)); B.box(tx2, 1.15, tz2, 0.28, 0.28, 1.1, "#2a9d8f"); B.sphere(tx2, 1.15, tz2 + 0.58, 0.18, 0.18, 0.06, "#8fd0ff", 6, 1);
    boxes.push({ x0: tx2 - 0.5, x1: tx2 + 0.5, z0: tz2 - 0.5, z1: tz2 + 0.6 });
    act("scene:stars", tx2, 1.2, tz2, 1.6, tx2 - 1.8, tz2 + 0.8); labels.push({ id: "sc_stars", text: "🔭 نجوم الليل", x: tx2, y: 2.6, z: tz2, cls: "sm tap", act: "scene:stars", max: 26, scope: "in" });
    keepAt(bl, tx2 - 1.2, tz2 - 1.0, tx2 + 1.0, tz2 + 1.2);
    const dx2 = bl.x0 + 1.8, dz2 = bl.z0 + 1.7;
    B.cyl(dx2, 0, dz2, 0.08, 0.08, 1.6, "#6b4a3a", 6); B.sphere(dx2, 1.95, dz2, 0.42, 0.42, 0.42, "#ffe066", 8, 1); B.sphere(dx2, 1.95, dz2, 0.2, 0.2, 0.2, "#fff6c2", 6, 1);
    boxes.push({ x0: dx2 - 0.4, x1: dx2 + 0.4, z0: dz2 - 0.4, z1: dz2 + 0.4 });
    act("console:dreams", dx2, 1.8, dz2, 1.6, dx2 + 0.6, dz2 + 2.2); labels.push({ id: "con_dreams", text: "🌠 نجمة الأحلام", x: dx2, y: 3.0, z: dz2, cls: "sm tap", act: "console:dreams", max: 26, scope: "in" });
    keepAt(bl, dx2 - 1.2, dz2 - 1.0, dx2 + 1.2, dz2 + 1.4);

    /* --- غرفة تحدي الرسم: لوحتين + طاولة ألوان + نرد التحدي --- */
    const dr = HOME.byId.draw, bz = dr.z0 + 1.5;
    [[-2.9, "#4dabf7", "🖌️ لوحة ١"], [2.9, "#ff7aa8", "🖌️ لوحة ٢"]].forEach(([dx, fc, txt], i) => {
      const bx = dr.cx + dx;
      [-1.6, 1.6].forEach((l) => B.box(bx + l, 0, bz + 0.5, 0.14, 2.2, 0.14, "#8d6e63")); B.box(bx, 0.5, bz + 0.6, 3.4, 0.14, 0.5, "#8d6e63");
      B.box(bx, 0.7, bz, 3.4, 2.5, 0.2, fc); B.box(bx, 0.85, bz + 0.12, 3.0, 2.2, 0.06, "#fffdf6", 0.35);
      [["#ff6b6b", -1.0, 1.9, 0.9], ["#ffd23f", 0.2, 1.4, 1.1], ["#4dabf7", 0.9, 2.2, 0.7], ["#7ac74f", -0.4, 1.0, 1.3]].forEach(([c2, ox, oy, w]) => B.box(bx + ox, oy, bz + 0.17, w, 0.18, 0.03, c2));
      B.sphere(bx + (i ? 1.0 : -1.0), 2.9, bz + 0.2, 0.22, 0.22, 0.1, fc, 6, 1);
      boxes.push({ x0: bx - 1.8, x1: bx + 1.8, z0: bz - 0.3, z1: bz + 0.9 });
      labels.push({ id: "drl" + i, text: txt, x: bx, y: 3.6, z: bz + 0.3, cls: "sm tap", act: "draw", max: 24, scope: "in" });
    });
    B.cyl(dr.cx, 0, dr.cz + 0.6, 1.2, 1.2, 0.8, "#8d6e63", 12); B.cyl(dr.cx, 0.8, dr.cz + 0.6, 1.35, 1.35, 0.08, "#d7b98a", 12);
    ["#ff6b6b", "#ffd23f", "#4dabf7", "#7ac74f", "#9b5de5"].forEach((c2, i) => { const a = (i / 5) * PI * 2; B.cyl(dr.cx + Math.cos(a) * 0.75, 0.88, dr.cz + 0.6 + Math.sin(a) * 0.75, 0.16, 0.14, 0.3, c2, 7); B.cyl(dr.cx + Math.cos(a) * 0.75, 1.18, dr.cz + 0.6 + Math.sin(a) * 0.75, 0.16, 0.16, 0.03, lt(c2, 0.4), 7); });
    B.box(dr.cx, 0.9, dr.cz + 0.6, 0.12, 0.7, 0.12, "#7a5236"); B.sphere(dr.cx, 1.65, dr.cz + 0.6, 0.18, 0.18, 0.18, "#ff4d6d", 6, 1);
    boxes.push({ x0: dr.cx - 1.4, x1: dr.cx + 1.4, z0: dr.cz - 0.8, z1: dr.cz + 2.0 });
    const dx3 = dr.x1 - 1.4, dz3 = dr.cz + 0.6; B.box(dx3, 0, dz3, 1.1, 1.1, 1.1, "#fff7e6"); B.box(dx3, 1.1, dz3, 1.1, 0.1, 1.1, "#ff7aa8"); [[-0.3, -0.3], [0.3, 0.3], [0, 0]].forEach(([a, b]) => B.sphere(dx3 + a, 1.25, dz3 + b, 0.1, 0.05, 0.1, "#222", 5)); [[0.56, 0], [0.56, 0.3]].forEach(([a, b]) => B.sphere(dx3 + a, 0.55, dz3 + b, 0.1, 0.1, 0.05, "#222", 5));
    boxes.push({ x0: dx3 - 0.6, x1: dx3 + 0.6, z0: dz3 - 0.6, z1: dz3 + 0.6 });
    act("draw", dr.cx, 1.3, dr.cz + 0.6, 2.2, dr.cx, dr.cz + 3.6); labels.push({ id: "drt", text: "🎲 تحدي الرسم", x: dr.cx, y: 2.8, z: dr.cz + 0.6, cls: "sm tap", act: "draw", max: 26, scope: "in" });
    act("draw", dx3, 1.2, dz3, 1.6, dx3 - 2.0, dz3);
    for (let i = 0; i < 7; i++) { B.sphere(dr.cx - 4.5 + i * 1.5, 0.02, dr.z1 - 1.2 + (i % 2) * 0.5, 0.5 + (i % 3) * 0.15, 0.02, 0.4, ["#ff6b6b", "#ffd23f", "#4dabf7", "#7ac74f", "#9b5de5"][i % 5], 6); }
    B.box(dr.cx, 2.2, dr.z1 - 0.5, 8, 0.05, 0.05, "#666"); [[-3, "#ff8fb1"], [-1, "#8fd3ff"], [1, "#ffe066"], [3, "#b6f0a0"]].forEach(([x, c2]) => { B.box(dr.cx + x, 1.2, dr.z1 - 0.52, 1.2, 1.0, 0.04, c2); B.box(dr.cx + x, 2.12, dr.z1 - 0.52, 0.06, 0.1, 0.06, "#444"); });
    keepAt(dr, dr.x0, dr.z0, dr.x1, dr.z0 + 3.2); keepAt(dr, dr.cx - 1.8, dr.cz - 0.9, dr.cx + 1.8, dr.cz + 2.2); keepAt(dr, dx3 - 0.9, dz3 - 0.9, dr.x1, dz3 + 0.9);

    /* --- غرفة الأزياء: خزانة + مرآة + ستاند ملابس --- */
    const dsr = HOME.byId.dressing, wz = dsr.z1 - 0.9;
    B.box(dsr.cx - 3.6, 0, wz, 3.2, 2.5, 0.9, "#8a5a3b"); [-1.0, 0.0, 1.0].forEach((dx) => { B.box(dsr.cx - 3.6 + dx, 0.15, wz - 0.48, 0.95, 2.2, 0.05, "#a97c50"); B.sphere(dsr.cx - 3.6 + dx + 0.35, 1.2, wz - 0.52, 0.05, 0.05, 0.04, "#ffd36e", 4); });
    boxes.push({ x0: dsr.cx - 5.3, x1: dsr.cx - 1.9, z0: wz - 0.5, z1: wz + 0.5 });
    B.box(dsr.cx + 3.0, 0, dsr.z0 + 0.55, 2.6, 2.6, 0.18, "#8e4a94"); B.box(dsr.cx + 3.0, 0.15, dsr.z0 + 0.66, 2.3, 2.3, 0.06, "#d6efff", 0.55); B.box(dsr.cx + 3.0, 0.0, dsr.z0 + 0.7, 2.6, 0.12, 0.7, "#8e4a94");
    boxes.push({ x0: dsr.cx + 1.6, x1: dsr.cx + 4.4, z0: dsr.z0 + 0.3, z1: dsr.z0 + 1.0 });
    act("mirror", dsr.cx + 3.0, 1.3, dsr.z0 + 0.8, 1.9, dsr.cx + 3.0, dsr.z0 + 3.2); labels.push({ id: "dsm", text: "🪞 جرّب لبسك", x: dsr.cx + 3.0, y: 3.2, z: dsr.z0 + 0.8, cls: "sm tap", act: "mirror", max: 26, scope: "in" });
    act("mirror", dsr.cx - 3.6, 1.3, wz, 2.2, dsr.cx - 3.6, wz - 2.4); labels.push({ id: "dsw", text: "👗 الخزانة", x: dsr.cx - 3.6, y: 3.0, z: wz, cls: "sm tap", act: "mirror", max: 26, scope: "in" });
    B.box(dsr.cx + 0.2, 0, dsr.cz + 1.2, 0.08, 1.9, 0.08, "#777"); B.box(dsr.cx + 0.2, 0, dsr.cz + 1.2 - 1.2, 0.08, 1.9, 0.08, "#777"); B.box(dsr.cx + 0.2, 1.9, dsr.cz + 0.0, 0.06, 0.06, 1.3, "#777"); ["#ff7aa8", "#6d3fb3", "#2a9d8f", "#ffd23f", "#4dabf7", "#e63946"].forEach((c2, i) => B.box(dsr.cx + 0.2, 0.9, dsr.cz - 0.5 + i * 0.22, 0.1, 1.0, 0.16, c2));
    boxes.push({ x0: dsr.cx - 0.2, x1: dsr.cx + 0.6, z0: dsr.cz - 0.8, z1: dsr.cz + 1.4 });
    B.disc(dsr.cx - 1.2, 0.02, dsr.cz + 1.2, 2.0, "#e9d0f0", 20);
    keepAt(dsr, dsr.cx + 1.4, dsr.z0, dsr.x1, dsr.z0 + 3.0); keepAt(dsr, dsr.x0, wz - 1.0, dsr.cx - 1.9, dsr.z1); keepAt(dsr, dsr.cx - 0.3, dsr.cz - 1.0, dsr.cx + 0.8, dsr.cz + 1.6);

    return { id: "home", mesh: B.build(R.gl), boxes, acts, labels, poi, bounds: HOME.bounds, spawn: { x: eg.x, z: eg.z - 3.0 }, exitAt: "home", env: "warm", camDist: 29, camPitch: 1.22, npcs: [] };
  }

  const SH = { ox: 500, oz: 0, hw: 10, hd: 8 };
  function shopBase(B, boxes, theme) {
    const x0 = SH.ox - SH.hw, x1 = SH.ox + SH.hw, z0 = SH.oz - SH.hd, z1 = SH.oz + SH.hd, g = 1.8;
    B.box(SH.ox, -0.15, SH.oz, SH.hw * 2, 0.15, SH.hd * 2, theme.floor);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) B.box(x0 + 1 + i * 2, 0, z0 + 1 + j * 2, 2, 0.012, 2, theme.floor2);
    const W = (a, b, c, d) => wallBox(B, boxes, a, b, c, d, theme.wall);
    W(x0, z0, x1, z0); W(x0, z0, x0, z1); W(x1, z0, x1, z1); W(x0, z1, SH.ox - g, z1); W(SH.ox + g, z1, x1, z1);
    B.box(SH.ox - g - 0.1, 0, z1, 0.3, 3.0, 0.5, "#6b4a3a"); B.box(SH.ox + g + 0.1, 0, z1, 0.3, 3.0, 0.5, "#6b4a3a"); B.box(SH.ox, 2.7, z1, g * 2 + 0.7, 0.4, 0.5, "#6b4a3a"); B.box(SH.ox, 0.02, z1 - 1, 2.6, 0.03, 1.0, "#2f8f5b");
    [-6, -2, 2, 6].forEach((dx) => B.box(SH.ox + dx, 1.3, z0 + 0.25, 2.0, 1.1, 0.06, "#ffe9a8", 1));
    [-5, 0, 5].forEach((dx) => { B.cyl(SH.ox + dx, 2.3, SH.oz - 1, 0.03, 0.03, 0.4, "#555", 4); B.sphere(SH.ox + dx, 2.3, SH.oz - 1, 0.35, 0.25, 0.35, "#ffe9a8", 6, 1); });
    return { x0, x1, z0, z1 };
  }
  function build_shop() {
    const B = new Builder(), boxes = [], acts = [], labels = [], poi = {};
    const b = shopBase(B, boxes, { floor: "#c9a06a", floor2: "#b8905a", wall: "#f4ead2" });
    const colors = ["#e63946", "#ffd23f", "#2a9d8f", "#ff8c42", "#7ac74f", "#9b5de5", "#4dabf7", "#ff6b9d"];
    for (let i = 0; i < 6; i++) { const x = SH.ox - 7.5 + i * 3; B.box(x, 0, b.z0 + 0.9, 2.6, 2.2, 0.8, "#8d6e63"); [0.45, 1.1, 1.75].forEach((y, k) => { for (let m = 0; m < 5; m++) B.box(x - 1 + m * 0.5, y, b.z0 + 1.0, 0.36, 0.4, 0.5, colors[(m + k + i) % 8]); }); }
    boxes.push({ x0: b.x0 + 0.5, x1: b.x1 - 0.5, z0: b.z0, z1: b.z0 + 1.5 });
    acts.push({ act: "shelf:food", x: SH.ox, y: 1.2, z: b.z0 + 1, r: 8 }); poi["shelf:food"] = { x: SH.ox, z: b.z0 + 3.3 };
    [-1, 1].forEach((s) => { for (let i = 0; i < 3; i++) { const z = SH.oz - 3 + i * 2.6; B.box(SH.ox + s * 9.0, 0, z, 0.8, 2.0, 2.2, "#8d6e63"); [0.45, 1.1, 1.7].forEach((y, k) => { for (let m = 0; m < 4; m++) B.box(SH.ox + s * 8.9, y, z - 0.8 + m * 0.5, 0.5, 0.4, 0.36, colors[(m + k + i + 2) % 8]); }); } boxes.push({ x0: s > 0 ? b.x1 - 1.6 : b.x0, x1: s > 0 ? b.x1 : b.x0 + 1.6, z0: -4.6, z1: 3.2 }); });
    B.box(SH.ox, 0, 1.2, 7.2, 1.0, 1.4, "#a97c50"); B.box(SH.ox, 1.0, 1.2, 7.4, 0.12, 1.6, "#d7b98a"); B.box(SH.ox + 2.4, 1.12, 1.2, 0.8, 0.5, 0.6, "#555"); B.box(SH.ox + 2.4, 1.4, 1.4, 0.5, 0.25, 0.04, "#8fd0ff", 1);
    B.box(SH.ox - 2.2, 1.12, 1.1, 0.7, 0.12, 0.5, "#cfd3d8"); B.cyl(SH.ox - 2.2, 1.24, 1.1, 0.25, 0.25, 0.05, "#aaa", 8); B.sphere(SH.ox - 2.2, 1.55, 1.1, 0.2, 0.2, 0.05, "#e63946", 5);
    boxes.push({ x0: SH.ox - 3.8, x1: SH.ox + 3.8, z0: 0.4, z1: 2.1 });
    acts.push({ act: "counter", x: SH.ox, y: 1.2, z: 1.2, r: 3.4 }); poi.counter = { x: SH.ox, z: 3.6 };
    [[-6.5, 3.8, "#e63946"], [-4.9, 4.4, "#ffd23f"], [5.0, 4.0, "#7ac74f"], [6.6, 4.6, "#ff8c42"]].forEach(([x, z, c]) => { B.box(SH.ox + x, 0, z, 1.3, 0.6, 1.0, "#a97c50"); for (let k = 0; k < 6; k++) B.sphere(SH.ox + x - 0.4 + (k % 3) * 0.4, 0.68, z - 0.25 + Math.floor(k / 3) * 0.5, 0.17, 0.15, 0.17, c, 5); boxes.push({ x0: SH.ox + x - 0.65, x1: SH.ox + x + 0.65, z0: z - 0.5, z1: z + 0.5 }); });
    B.sphere(SH.ox - 8.2, 0.5, 4.8, 0.6, 0.5, 0.5, "#d9c9a3", 6); B.sphere(SH.ox - 7.4, 0.4, 5.4, 0.5, 0.45, 0.5, "#cdbb90", 6);
    labels.push({ id: "shl", text: "🏪 بقالة سعدون", x: SH.ox, y: 3.6, z: 0, cls: "", max: 60, scope: "in" }, { id: "shx", text: "🚪 اطلع", x: SH.ox, y: 3.4, z: b.z1, cls: "sm tap", act: "exit", max: 40, scope: "in" });
    acts.push({ act: "exit", x: SH.ox, y: 1.2, z: b.z1 - 0.3, r: 2.2 }); poi.exit = { x: SH.ox, z: b.z1 - 2.2 };
    return { id: "shop", mesh: B.build(R.gl), boxes, acts, labels, poi, bounds: { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }, spawn: { x: SH.ox, z: b.z1 - 3 }, exitAt: "shop", env: "warm", camDist: 20, camPitch: 0.95,
      npcs: [{ id: "saadoun_in", ref: "saadoun", x: SH.ox, z: -0.2, face: 0, act: "counter" }] };
  }
  function build_boutique() {
    const B = new Builder(), boxes = [], acts = [], labels = [], poi = {};
    const b = shopBase(B, boxes, { floor: "#e8d3e4", floor2: "#dcc2d6", wall: "#fbe6f3" });
    const cols = ["#ff7aa8", "#6d3fb3", "#2b3a55", "#ffd23f", "#2a9d8f", "#e63946", "#8fb8ff", "#f4f1e8"];
    for (let i = 0; i < 4; i++) { const x = SH.ox - 7 + i * 4.6; B.box(x, 1.7, b.z0 + 1.2, 3.2, 0.06, 0.06, "#8d8d8d"); B.box(x - 1.5, 0, b.z0 + 1.2, 0.06, 1.7, 0.06, "#8d8d8d"); B.box(x + 1.5, 0, b.z0 + 1.2, 0.06, 1.7, 0.06, "#8d8d8d"); for (let k = 0; k < 8; k++) B.box(x - 1.35 + k * 0.38, 0.5, b.z0 + 1.2, 0.26, 1.2, 0.12, cols[(k + i) % 8]); }
    boxes.push({ x0: b.x0 + 0.5, x1: b.x1 - 0.5, z0: b.z0, z1: b.z0 + 1.8 });
    acts.push({ act: "rack", x: SH.ox, y: 1.0, z: b.z0 + 1.2, r: 8 }); poi.rack = { x: SH.ox, z: b.z0 + 3.4 };
    [[-6, 0, "#ff7aa8"], [6, 0, "#2b3a55"], [-3, -2.4, "#6d3fb3"], [3, -2.4, "#ffd23f"]].forEach(([x, z, c]) => { B.cyl(SH.ox + x, 0, z, 0.55, 0.3, 1.25, c, 8); B.box(SH.ox + x, 1.25, z, 0.5, 0.6, 0.3, c); B.sphere(SH.ox + x, 2.1, z, 0.22, 0.26, 0.22, "#f2d9c8", 7); B.cyl(SH.ox + x, 0, z, 0.55, 0.55, 0.05, "#444", 8); boxes.push({ x0: SH.ox + x - 0.6, x1: SH.ox + x + 0.6, z0: z - 0.6, z1: z + 0.6 }); });
    B.box(SH.ox + 7.8, 0, 3.2, 0.2, 2.4, 2.2, "#8a5a3b"); B.box(SH.ox + 7.7, 0.1, 3.2, 0.06, 2.2, 2.0, "#d6efff", 0.4); boxes.push({ x0: SH.ox + 7.5, x1: b.x1, z0: 2.0, z1: 4.4 });
    B.box(SH.ox, 0, 1.2, 6.0, 1.0, 1.3, "#b565b0"); B.box(SH.ox, 1.0, 1.2, 6.2, 0.12, 1.5, "#f2d6ea"); B.box(SH.ox + 1.8, 1.12, 1.2, 0.7, 0.45, 0.5, "#555"); B.box(SH.ox + 1.8, 1.35, 1.4, 0.45, 0.22, 0.04, "#8fd0ff", 1); boxes.push({ x0: SH.ox - 3.1, x1: SH.ox + 3.1, z0: 0.4, z1: 2.0 });
    acts.push({ act: "counter", x: SH.ox, y: 1.2, z: 1.2, r: 3.2 }); poi.counter = { x: SH.ox, z: 3.6 };
    acts.push({ act: "mirror", x: SH.ox + 7.7, y: 1.2, z: 3.2, r: 1.6 }); poi.mirror = { x: SH.ox + 5.6, z: 3.2 };
    labels.push({ id: "bl", text: "👗 محل الأناقة", x: SH.ox, y: 3.6, z: 0, cls: "", max: 60, scope: "in" }, { id: "bx", text: "🚪 اطلع", x: SH.ox, y: 3.4, z: b.z1, cls: "sm tap", act: "exit", max: 40, scope: "in" });
    acts.push({ act: "exit", x: SH.ox, y: 1.2, z: b.z1 - 0.3, r: 2.2 }); poi.exit = { x: SH.ox, z: b.z1 - 2.2 };
    return { id: "boutique", mesh: B.build(R.gl), boxes, acts, labels, poi, bounds: { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }, spawn: { x: SH.ox, z: b.z1 - 3 }, exitAt: "boutique", env: "warm", camDist: 20, camPitch: 0.95,
      npcs: [{ id: "nawal", ref: "nawal", x: SH.ox, z: -0.1, face: 0, act: "counter" }] };
  }
  function build_butcher() {
    const B = new Builder(), boxes = [], acts = [], labels = [], poi = {};
    const b = shopBase(B, boxes, { floor: "#e9e1d2", floor2: "#d6cdb9", wall: "#f7efe2" });
    B.box(SH.ox, 0, b.z0 + 0.6, SH.hw * 2 - 1, 0.3, 0.8, "#b9b3a6"); B.box(SH.ox, 3.3, b.z0 + 0.8, SH.hw * 2 - 2, 0.1, 0.1, "#777");
    for (let i = 0; i < 9; i++) { const x = SH.ox - 8 + i * 2; B.cyl(x, 1.4, b.z0 + 0.8, 0.03, 0.03, 1.9, "#777", 4); B.sphere(x, 1.9, b.z0 + 0.8, 0.28, 0.6, 0.22, i % 2 ? "#d9534f" : "#c0392b", 7); B.box(x - 0.18, 1.5, b.z0 + 0.75, 0.36, 0.05, 0.05, "#f1d9c6"); }
    boxes.push({ x0: b.x0 + 0.5, x1: b.x1 - 0.5, z0: b.z0, z1: b.z0 + 1.4 });
    B.box(SH.ox, 0, 1.2, 7.4, 1.0, 1.5, "#fff"); B.box(SH.ox, 1.0, 1.2, 7.6, 0.12, 1.7, "#c9c2b4"); B.box(SH.ox, 1.12, 1.5, 7.0, 0.7, 0.9, "#bfe9ff", 0.35);
    [[-3, "#e57373"], [-1.6, "#d9534f"], [-0.2, "#f1b8a8"], [1.2, "#c0392b"], [2.6, "#e57373"]].forEach(([x, cc]) => { B.box(SH.ox + x, 1.14, 1.5, 1.0, 0.18, 0.6, "#fff"); B.sphere(SH.ox + x, 1.4, 1.5, 0.42, 0.2, 0.26, cc, 6); });
    B.box(SH.ox - 3.0, 1.12, 0.6, 0.8, 0.5, 0.6, "#8a5a3b"); B.box(SH.ox + 3.2, 1.12, 0.7, 0.7, 0.14, 0.5, "#555"); B.box(SH.ox + 3.2, 1.26, 0.7, 0.5, 0.2, 0.04, "#8fd0ff", 0.6);
    boxes.push({ x0: SH.ox - 3.9, x1: SH.ox + 3.9, z0: 0.3, z1: 2.1 });
    acts.push({ act: "counter", x: SH.ox, y: 1.2, z: 1.2, r: 3.4 }); poi.counter = { x: SH.ox, z: 3.6 };
    [[-7.5, 3.0], [7.5, 3.4]].forEach(([x, z], i) => { B.box(SH.ox + x, 0, z, 1.4, 0.9, 1.0, "#a97c50"); B.box(SH.ox + x, 0.9, z, 1.2, 0.08, 0.9, "#e8d9b0"); });
    B.box(SH.ox + 8.6, 0, -2.5, 1.2, 2.6, 2.2, "#dfe6ec"); B.box(SH.ox + 8.0, 1.2, -2.5, 0.06, 0.3, 0.3, "#999");
    labels.push({ id: "bul", text: "🥩 ملحمة أبو سليمان", x: SH.ox, y: 3.6, z: 0, cls: "", max: 60, scope: "in" }, { id: "bux", text: "🚪 اطلع", x: SH.ox, y: 3.4, z: b.z1, cls: "sm tap", act: "exit", max: 40, scope: "in" });
    acts.push({ act: "exit", x: SH.ox, y: 1.2, z: b.z1 - 0.3, r: 2.2 }); poi.exit = { x: SH.ox, z: b.z1 - 2.2 };
    return { id: "butcher", mesh: B.build(R.gl), boxes, acts, labels, poi, bounds: { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }, spawn: { x: SH.ox, z: b.z1 - 3 }, exitAt: "butchershop", env: "warm", camDist: 20, camPitch: 0.95,
      npcs: [{ id: "abu_in", ref: "abusulaiman", x: SH.ox, z: -0.2, face: 0, act: "counter" }] };
  }
  function build_dealer() {
    const B = new Builder(), boxes = [], acts = [], labels = [], poi = {};
    const b = shopBase(B, boxes, { floor: "#d7dbe0", floor2: "#c6cbd2", wall: "#f1f3f7" });
    const cols = ["#e63946", "#4dabf7", "#ffd23f", "#2a9d8f", "#9b5de5"];
    [[-6, 0], [-2, 1], [2, 2], [6, 3]].forEach(([dx, k]) => { const x = SH.ox + dx, z = b.z0 + 2.6; B.cyl(x, 0, z, 1.9, 1.9, 0.3, "#8e8e96", 12); B.box(x, 0.3, z, 1.9, 0.5, 3.4, cols[k]); B.box(x, 0.8, z - 0.3, 1.5, 0.55, 1.7, "#bfe9ff", 0.4); B.box(x, 0.84, z - 0.3, 1.58, 0.06, 1.8, cols[k]); [[-0.9, -1.2], [0.9, -1.2], [-0.9, 1.2], [0.9, 1.2]].forEach(([wx, wz]) => B.box(x + wx, 0, z + wz, 0.26, 0.6, 0.6, "#222")); });
    boxes.push({ x0: b.x0 + 0.5, x1: b.x1 - 0.5, z0: b.z0, z1: b.z0 + 4.8 });
    B.box(SH.ox, 0, 1.6, 6.4, 1.0, 1.3, "#2b3a55"); B.box(SH.ox, 1.0, 1.6, 6.6, 0.12, 1.5, "#d7dbe0"); B.box(SH.ox + 2.0, 1.12, 1.6, 0.8, 0.45, 0.5, "#555"); B.box(SH.ox + 2.0, 1.35, 1.8, 0.5, 0.22, 0.04, "#8fd0ff", 1);
    boxes.push({ x0: SH.ox - 3.3, x1: SH.ox + 3.3, z0: 0.8, z1: 2.4 });
    acts.push({ act: "counter", x: SH.ox, y: 1.2, z: 1.6, r: 3.4 }); poi.counter = { x: SH.ox, z: 4.0 };
    acts.push({ act: "counter", x: SH.ox, y: 1.2, z: b.z0 + 2.6, r: 9 });
    labels.push({ id: "dll", text: "🚗 معرض السيارات", x: SH.ox, y: 3.6, z: 0, cls: "", max: 60, scope: "in" }, { id: "dlx", text: "🚪 اطلع", x: SH.ox, y: 3.4, z: b.z1, cls: "sm tap", act: "exit", max: 40, scope: "in" });
    acts.push({ act: "exit", x: SH.ox, y: 1.2, z: b.z1 - 0.3, r: 2.2 }); poi.exit = { x: SH.ox, z: b.z1 - 2.2 };
    return { id: "dealer", mesh: B.build(R.gl), boxes, acts, labels, poi, bounds: { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }, spawn: { x: SH.ox, z: b.z1 - 3 }, exitAt: "dealer", env: "warm", camDist: 20, camPitch: 0.95,
      npcs: [{ id: "karim_in", ref: "karim", x: SH.ox, z: 0.2, face: 0, act: "counter" }] };
  }
  INT.defs = { home: build_home, shop: build_shop, boutique: build_boutique, butcher: build_butcher, dealer: build_dealer };
  INT.get = (id) => INT.cache[id] || (INT.cache[id] = INT.defs[id]());
  INT.outAt = { home: { x: 0, z: -6.4 }, shop: { x: -24, z: 15.6 }, boutique: { x: OSW.EX.BOUTIQUE.x + Math.sin(OSW.EX.BOUTIQUE.ry) * 6.6, z: OSW.EX.BOUTIQUE.z + Math.cos(OSW.EX.BOUTIQUE.ry) * 6.6 }, butcher: { x: OSW.EX.BUTCHER.x + Math.sin(OSW.EX.BUTCHER.ry) * 7, z: OSW.EX.BUTCHER.z + Math.cos(OSW.EX.BUTCHER.ry) * 7 }, dealer: { x: OSW.EX.DEALER.x + Math.sin(OSW.EX.DEALER.ry) * 7.2, z: OSW.EX.DEALER.z + Math.cos(OSW.EX.DEALER.ry) * 7.2 } };
  INT.enterAct = { home: "home", shop: "shop", boutique: "boutique", butcher: "butchershop", dealer: "dealer" };
  OSW.NPC_BY.abusulaiman = { id: "abusulaiman", name: "أبو سليمان الجزّار", emoji: "🧔", look: { gender: "boy", color: "#f4f1e8", hair: "#1b1b1b", hairStyle: "cap", cap: "#f4f1e8", apron: "#b3263e", mustache: true }, act: "counter", lines: ["الخروف البلدي أحلى شي! جيبوا خرفانكم 🐑", "اللحمة الطازة كل يوم عندي 🥩", "ما بشتري الصغار… استنوا يكبروا 😄", "منسف اليوم؟ عندي اللحمة 🍲"] };
  OSW.NPC_BY.karim = { id: "karim", name: "أبو كريم", emoji: "🧑‍💼", look: { gender: "boy", color: "#2b3a55", hair: "#2a1d12", hairStyle: "short", tie: "#c0392b" }, act: "counter", lines: ["كل سيارة بتسع اثنين، إنت وحبيبتك 🚗❤️", "البكم بيشيل 6 خرفان مرة وحدة 🛻", "السبورت أسرع شي على الطريق الطويل 🏎️", "الطريق للجزيرة طويل… جهزوا الأغاني 🎶"] };

  OSW.NPC_BY.nawal = { id: "nawal", name: "نوال", emoji: "👩‍🎨", look: { gender: "girl", color: "#b565b0", hair: "#3b2a20", hairStyle: "ponytail", skin: "#f2c9a0" }, act: "counter",
    lines: ["أهلين فيكم! شو بتدوروا؟ عندي أحلى الأطقم 👗", "البدلة الرسمية للمناسبات بس… بتتقل عالمشي 😅", "الجري بلبس رياضي أسرع بكتير! 🏃", "جرّبوا قدام المرآة 🪞"] };
})();
