/* الأماكن من جوّا: بيتنا بالغرف، الدكان، محل الأناقة (والشرطة والمحكمة لاحقاً) */
(function () {
  const OSW = window.OSW, R = OSW.R, Builder = OSW.Builder, PI = Math.PI, dk = OSW.col.dk, lt = OSW.col.lt;
  const HOME = (OSW.HOME = { ox: 400, oz: 0, cols: 5, rows: 4, rw: 12, rd: 10, wh: 1.7, wt: 0.4, door: 3.4 });
  const LAYOUT = [["songs", "photos", "memories", "first", "moments"], ["letters", "dreams", "because", "cafe", "station"], ["fights", "secrets", "kitchen", "bedroom", "stories"], ["laugh", "quotes", "living", "library", "balcony"]];
  const EXTRA = { kitchen: { n: "المطبخ", e: "🍳", wall: "#f3e9d2", roof: "#c9783a" }, bedroom: { n: "غرفة النوم", e: "🛏️", wall: "#e8d9f5", roof: "#7a4fa8" }, living: { n: "الصالون", e: "🛋️", wall: "#fbe9d0", roof: "#b5651d" }, balcony: { n: "الشرفة", e: "🌿", wall: "#d6f0d0", roof: "#4a8f4a" } };
  const rooms = (HOME.rooms = []);
  LAYOUT.forEach((row, r) => row.forEach((id, c) => {
    const x0 = HOME.ox + (c - HOME.cols / 2) * HOME.rw, z0 = HOME.oz + (r - HOME.rows / 2) * HOME.rd, h = OSW.HOUSE[id], ex = EXTRA[id];
    rooms.push({ id, col: c, row: r, x0, x1: x0 + HOME.rw, z0, z1: z0 + HOME.rd, cx: x0 + HOME.rw / 2, cz: z0 + HOME.rd / 2, name: ex ? ex.n : "غرفة " + h.name.replace("بيت ", ""), emoji: ex ? ex.e : h.emoji, wall: ex ? ex.wall : h.wall, accent: ex ? ex.roof : h.roof, house: !ex });
  }));
  HOME.byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
  HOME.bounds = { x0: HOME.ox - 30, x1: HOME.ox + 30, z0: HOME.oz - 20, z1: HOME.oz + 20 };
  const doors = (HOME.doors = []);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) doors.push({ x: HOME.ox + (c + 1 - HOME.cols / 2) * HOME.rw, z: HOME.oz + (r - HOME.rows / 2) * HOME.rd + HOME.rd / 2, v: true });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) doors.push({ x: HOME.ox + (c - HOME.cols / 2) * HOME.rw + HOME.rw / 2, z: HOME.oz + (r + 1 - HOME.rows / 2) * HOME.rd, v: false });
  const living = HOME.byId.living; HOME.exitDoor = { x: living.cx, z: living.z1 };
  doors.push({ x: HOME.exitDoor.x, z: HOME.exitDoor.z, v: false, exit: true });
  HOME.roomAt = (x, z) => rooms.find((r) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1);
  const ov = (a, b, m = 0) => a.x0 < b.x1 - m && a.x1 > b.x0 + m && a.z0 < b.z1 - m && a.z1 > b.z0 + m;
  HOME.valid = (item, x, z, rot, others, ignoreId) => {
    const f = OSW.FURN[item]; if (!f) return false; const r = OSW.furnRect(item, x, z, rot), room = HOME.roomAt(x, z); if (!room) return false;
    if (r.x0 < room.x0 + 0.55 || r.x1 > room.x1 - 0.55 || r.z0 < room.z0 + 0.55 || r.z1 > room.z1 - 0.55) return false;
    if (room.house && ov(r, { x0: room.cx - 1.1, x1: room.cx + 1.1, z0: room.z0, z1: room.z0 + 2.3 })) return false;
    for (const d of doors) { const nx = Math.max(r.x0, Math.min(d.x, r.x1)), nz = Math.max(r.z0, Math.min(d.z, r.z1)); if (Math.hypot(nx - d.x, nz - d.z) < 2.2) return false; }
    for (const o of others) { if (o.id === ignoreId) continue; const g = OSW.FURN[o.item]; if (!g) continue; if (f.flat && g.flat) { if (ov(r, OSW.furnRect(o.item, o.x, o.z, o.rot))) return false; continue; } if (f.flat || g.flat) continue; if (ov(r, OSW.furnRect(o.item, o.x, o.z, o.rot), 0.04)) return false; }
    return true;
  };
  HOME.defaults = [
    { id: "def:bed", item: "bed2", x: HOME.byId.bedroom.cx - 3.2, z: HOME.byId.bedroom.cz + 0.2, rot: 0 },
    { id: "def:ns", item: "nstand", x: HOME.byId.bedroom.cx - 0.9, z: HOME.byId.bedroom.cz - 0.6, rot: 0 },
    { id: "def:sofa", item: "sofa3", x: living.cx - 3.6, z: living.cz - 1.2, rot: 0 },
    { id: "def:rug", item: "rugS", x: living.cx - 0.6, z: living.cz + 0.6, rot: 0 },
    { id: "def:ct", item: "ctable", x: living.cx - 0.6, z: living.cz + 0.6, rot: 0 },
    { id: "def:plant", item: "plantL", x: living.cx + 4.7, z: living.z0 + 1.3, rot: 0 },
  ];

  const INT = (OSW.INT = { cache: {}, defs: {} });
  function wallBox(B, boxes, x0, z0, x1, z1, col) {
    const t = HOME.wt, h = HOME.wh; let cx, cz, w, d;
    if (x0 === x1) { cx = x0; cz = (z0 + z1) / 2; w = t; d = Math.abs(z1 - z0); } else { cx = (x0 + x1) / 2; cz = z0; w = Math.abs(x1 - x0); d = t; }
    if (w < 0.05 || d < 0.05) return; B.box(cx, 0, cz, w, h, d, col || "#efe4d2"); B.box(cx, h, cz, w + 0.04, 0.12, d + 0.04, "#b7a58a"); boxes.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
  }
  function build_home() {
    const B = new Builder(), boxes = [], acts = [], labels = [], poi = {};
    rooms.forEach((r) => {
      B.box(r.cx, -0.15, r.cz, HOME.rw, 0.15, HOME.rd, lt(r.wall, 0.45));
      for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0) B.box(r.x0 + 1 + i * 2, 0, r.z0 + 1 + j * 2, 2, 0.012, 2, lt(r.wall, 0.62));
      B.box(r.cx, 0, r.z0 + 0.35, HOME.rw - 0.2, 1.0, 0.1, r.wall); B.box(r.cx, 1.0, r.z0 + 0.35, HOME.rw - 0.2, 0.06, 0.14, lt(r.accent, 0.25));
      if (r.house) {
        B.box(r.cx, 0, r.z0 + 1.35, 1.2, 0.8, 1.2, dk(r.accent, 0.15)); B.box(r.cx, 0.8, r.z0 + 1.35, 1.4, 0.1, 1.4, lt(r.accent, 0.3)); B.sphere(r.cx, 1.35, r.z0 + 1.35, 0.3, 0.3, 0.3, r.accent, 8, 1);
        const act = "console:" + r.id; acts.push({ act, x: r.cx, y: 1.1, z: r.z0 + 1.35, r: 1.5 }); poi[act] = { x: r.cx, z: r.z0 + 3.4 };
        boxes.push({ x0: r.cx - 0.6, x1: r.cx + 0.6, z0: r.z0 + 0.75, z1: r.z0 + 1.95 });
        labels.push({ id: "con_" + r.id, text: `${r.emoji} افتح`, x: r.cx, y: 2.5, z: r.z0 + 1.35, cls: "sm tap", act, max: 26, scope: "in" });
      }
      labels.push({ id: "rn_" + r.id, text: `${r.emoji} ${r.name}`, x: r.cx, y: 3.2, z: r.cz - 1.6, cls: "sm", max: 36, scope: "in" });
    });
    const g = HOME.door / 2, b = HOME.bounds, Z0 = b.z0, Z1 = b.z1, X0 = b.x0, X1 = b.x1;
    wallBox(B, boxes, X0, Z0, X1, Z0, "#e4d5bd"); wallBox(B, boxes, X0, Z0, X0, Z1, "#e4d5bd"); wallBox(B, boxes, X1, Z0, X1, Z1, "#e4d5bd");
    wallBox(B, boxes, X0, Z1, HOME.exitDoor.x - g, Z1, "#e4d5bd"); wallBox(B, boxes, HOME.exitDoor.x + g, Z1, X1, Z1, "#e4d5bd");
    for (let c = 1; c < 5; c++) { const x = HOME.ox + (c - HOME.cols / 2) * HOME.rw; for (let r = 0; r < 4; r++) { const z0 = HOME.oz + (r - 2) * HOME.rd, m = z0 + HOME.rd / 2; wallBox(B, boxes, x, z0, x, m - g); wallBox(B, boxes, x, m + g, x, z0 + HOME.rd); B.box(x, 0.01, m, 0.9, 0.02, HOME.door, "#b08968"); } }
    for (let r = 1; r < 4; r++) { const z = HOME.oz + (r - 2) * HOME.rd; for (let c = 0; c < 5; c++) { const x0 = HOME.ox + (c - 2.5) * HOME.rw, m = x0 + HOME.rw / 2; wallBox(B, boxes, x0, z, m - g, z); wallBox(B, boxes, m + g, z, x0 + HOME.rw, z); B.box(m, 0.01, z, HOME.door, 0.02, 0.9, "#b08968"); } }
    const ex = HOME.exitDoor; B.box(ex.x - g - 0.1, 0, ex.z, 0.3, 3.0, 0.5, "#8d6e63"); B.box(ex.x + g + 0.1, 0, ex.z, 0.3, 3.0, 0.5, "#8d6e63"); B.box(ex.x, 2.7, ex.z, HOME.door + 0.7, 0.4, 0.5, "#8d6e63"); B.box(ex.x, 0.02, ex.z - 1.1, 2.4, 0.03, 1.0, "#c0584c");
    B.sphere(ex.x, 3.0, ex.z, 0.2, 0.2, 0.2, "#ffe7a0", 6, 1);
    acts.push({ act: "exit", x: ex.x, y: 1.2, z: ex.z - 0.3, r: 2.4 }); poi.exit = { x: ex.x, z: ex.z - 2.0 };
    labels.push({ id: "exitl", text: "🚪 اطلع للقرية", x: ex.x, y: 3.7, z: ex.z, cls: "sm tap", act: "exit", max: 40, scope: "in" });
    return { id: "home", mesh: B.build(R.gl), boxes, acts, labels, poi, bounds: HOME.bounds, spawn: { x: ex.x, z: ex.z - 3.0 }, exitAt: "home", env: "warm", camDist: 23, camPitch: 1.12, npcs: [] };
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
  INT.defs = { home: build_home, shop: build_shop, boutique: build_boutique };
  INT.get = (id) => INT.cache[id] || (INT.cache[id] = INT.defs[id]());
  INT.outAt = { home: { x: 0, z: -6.4 }, shop: { x: -24, z: 15.6 }, boutique: { x: -40, z: 37.2 } };
  INT.enterAct = { home: "home", shop: "shop", boutique: "boutique" };

  OSW.NPC_BY.nawal = { id: "nawal", name: "نوال", emoji: "👩‍🎨", look: { gender: "girl", color: "#b565b0", hair: "#3b2a20", hairStyle: "ponytail", skin: "#f2c9a0" }, act: "counter",
    lines: ["أهلين فيكم! شو بتدوروا؟ عندي أحلى الأطقم 👗", "البدلة الرسمية للمناسبات بس… بتتقل عالمشي 😅", "الجري بلبس رياضي أسرع بكتير! 🏃", "جرّبوا قدام المرآة 🪞"] };
})();
