/* حياة القرية: أهل القرية بيسوقوا سيارات بشوارع القرية، بيركنوا قدام البيوت، بينزلوا يزوروا، وبيرجعوا يكملوا.
   كمان كنّاس بالشارع وواحد بيركض. كله رسم فقط (ما بيأثر على حالة اللعبة). */
(function () {
  const OSW = window.OSW, L = (OSW.life = {}), PI = Math.PI, hy = Math.hypot, rnd = Math.random;
  const NODES = { A: [-74, 34.5], B: [0, 34.5], C: [74, 34.5], D: [74, 57], E: [0, 57], F: [-74, 57] };
  const NEXT = { A: ["B"], B: ["C", "C", "C", "E"], C: ["D"], D: ["E"], E: ["F"], F: ["A"] };
  const COLS = ["#ff7aa8", "#4dabf7", "#7ac74f", "#ffb347", "#b565b0", "#e5484d", "#2a9d8f"], HAIRS = ["#2a1d12", "#6b4423", "#1b1b1b", "#a0522d", "#8a8a8a"];
  const person = (i, girl) => OSW.makeChar({ gender: girl ? "girl" : "boy", color: COLS[i % COLS.length], hair: HAIRS[i % HAIRS.length], hairStyle: girl ? "ponytail" : "short", pants: "#34495e", scale: 1 });
  const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; };
  // مواقف جنب أبواب بيوت الصف التاني (بالشارع الغربي) — x بيت الجار
  const HOUSES2 = [-57, -38, -20, 20, 38, 57];
  let cars = null, walkers = null, last = 0, me = () => OSW.world._int.me;

  function init() {
    const spec = [["sedan", "#e63946", "A", 0], ["mini", "#ffd23f", "C", 1], ["pickup", "#4dabf7", "E", 2], ["jeep", "#2a9d8f", "F", 3]];
    cars = spec.map(([kind, color, from, i]) => {
      const a = NODES[from], nx = NEXT[from][0], b = NODES[nx];
      return { kind, color, x: a[0], z: a[1], h: Math.atan2(b[0] - a[0], b[1] - a[1]), v: 0, target: nx, st: "drive", timer: 20 + i * 15, bay: null, ch: person(i * 2 + 1, i % 2), actor: null, hold: 0 };
    });
    walkers = [
      { ch: person(9, false), x: -40, z: 37.4, dir: 1, kind: "sweep", w: 0 },
      { ch: person(12, true), x: 60, z: 36.8, dir: -1, kind: "jog", w: 0 },
    ];
  }

  const blocked = (c, others) => {
    const s = Math.sin(c.h), co = Math.cos(c.h), probe = (x, z) => { const dx = x - c.x, dz = z - c.z, f = dx * s + dz * co, sd = Math.abs(dx * co - dz * s); return f > 0.5 && f < 7 && sd < 1.9; };
    const m = me(); if (probe(m.x, m.z)) return "me";
    if (OSW.world && OSW.world.partnerPos) { const p = OSW.world.partnerPos(); if (p && probe(p.x, p.z)) return "pa"; }
    return others.some((o) => o !== c && probe(o.x, o.z)) ? "car" : null;
  };

  function stepCar(c, dt, t) {
    if (c.st === "parked") {
      c.timer -= dt; const a = c.actor;
      if (a) {
        if (a.phase === "out" || a.phase === "back") { const tx = a.phase === "out" ? a.door[0] : c.x, tz = a.phase === "out" ? a.door[1] : c.z + 1.8, dx = tx - a.x, dz = tz - a.z, d = hy(dx, dz); if (d < 0.25) { if (a.phase === "out") { a.phase = "in"; a.t = 6 + rnd() * 10; } else { c.actor = null; c.st = "leave"; c.target = c.afterBay; } } else { a.x += (dx / d) * 1.5 * dt; a.z += (dz / d) * 1.5 * dt; a.ry = Math.atan2(dx, dz); a.ph += dt * 7; } }
        else if (a.phase === "in") { a.t -= dt; if (a.t <= 0) { a.phase = "back"; a.x = a.door[0]; a.z = a.door[1]; } }
      }
      return;
    }
    const tgt = c.st === "pull" ? c.bayPt : c.st === "leave" ? NODES[c.afterBay] : NODES[c.target];
    const T = Array.isArray(tgt) ? tgt : NODES[tgt], dx = T[0] - c.x, dz = T[1] - c.z, d = hy(dx, dz);
    let want = c.st === "pull" ? Math.min(4.5, 1.2 + d * 0.5) : 7.2; if (d < 9 && c.st === "drive") want = Math.min(want, 3.6);
    const bl = blocked(c, cars); if (bl) { want = 0; c.hold += dt; if (c.hold > 2.5 && bl === "me" && OSW.audio && rnd() < 0.02) OSW.audio.sfx("horn"); } else c.hold = 0;
    c.v += (want - c.v) * Math.min(1, dt * (want < c.v ? 4 : 1.6));
    const dh = angDiff(c.h, Math.atan2(dx, dz)); c.h += Math.max(-2.2 * dt, Math.min(2.2 * dt, dh));
    c.x += Math.sin(c.h) * c.v * dt; c.z += Math.cos(c.h) * c.v * dt;
    if (c.st === "pull" && d < 0.9) { c.st = "parked"; c.v = 0; c.h = -PI / 2; c.timer = 18 + rnd() * 25; c.actor = { x: c.x, z: c.z + 1.8, ry: 0, ph: 0, phase: "out", door: c.door, t: 0 }; return; }
    if (d < (c.st === "pull" ? 0.9 : 4.2)) {
      if (c.st === "leave") { c.st = "drive"; c.target = c.afterBay; c.timer = 40 + rnd() * 40; return; }
      const from = c.target, opts = NEXT[from]; c.target = opts[(rnd() * opts.length) | 0];
    }
    c.timer -= dt;
    // قرار الركن: لما يكون ماشي غرباً على الشارع الشمالي بالصف التاني وفي بيت قريب
    if (c.st === "drive" && c.timer <= 0 && c.z > 55.5 && c.z < 58.5 && Math.abs(c.h + PI / 2) < 0.35) {
      const hx = HOUSES2.filter((x) => x < c.x - 12 && x > c.x - 30)[0];
      if (hx !== undefined && !cars.some((o) => o.st !== "drive" && o !== c && Math.abs(o.x - (hx + 5)) < 7)) { c.st = "pull"; c.bayPt = [hx + 5, 59.2]; c.door = [hx, 61.0]; c.afterBay = "F"; }
      else c.timer = 8;
    }
  }

  function stepWalkers(dt) {
    walkers.forEach((w) => {
      const sp = w.kind === "jog" ? 3.4 : 0.9; w.x += w.dir * sp * dt; w.w += dt * (w.kind === "jog" ? 11 : 4);
      if (w.x > 66) w.dir = -1; if (w.x < -66) w.dir = 1;
    });
  }

  L.draw = (t) => {
    const w = OSW.world; if (!w || w.mode !== "out") return; const m = me(); if (m.z > 1000) return; // بس لما نكون بالقرية
    if (!cars) { if (!OSW.makeChar) return; init(); }
    const dt = Math.min(0.08, Math.max(0, t - last)); last = t; if (dt <= 0) return;
    cars.forEach((c) => { stepCar(c, dt, t); OSW.veh.drawNpcCar(c.kind, c.color, c.x, c.z, c.h, t, c.st === "parked" && c.actor ? null : c.ch); });
    cars.forEach((c) => { const a = c.actor; if (a && (a.phase === "out" || a.phase === "back")) OSW.drawChar(c.ch, a.x, a.z, a.ry, a.ph, 1, t, 1, null, 1, 0); });
    stepWalkers(dt);
    walkers.forEach((wk) => { if (hy(wk.x - m.x, wk.z - m.z) < 120) OSW.drawChar(wk.ch, wk.x, wk.z, wk.dir > 0 ? PI / 2 : -PI / 2, wk.w, wk.kind === "jog" ? 1.5 : 0.7, t, 1, null, 1, 0, wk.kind === "sweep" ? { carry: 1 } : undefined); });
  };
})();
