/* routines.js — جدول يومي لأهل القرية + نظام زوّار (حساب 1)
   ملف مستقل: ما بيعدّل أي ملف قائم. بيستعمل فقط دوال OSW.world الموجودة:
   addNpc / removeNpc / npcGoto / npcPos / poi / setNpcMood.
   الواجهة: OSW.routines.visit({...}) — شوف ACCOUNT1-integration.md */
(function () {
  "use strict";
  const OSW = (window.OSW = window.OSW || {});
  const R = (OSW.routines = { enabled: true, visitors: {}, version: 1 });

  /* ---------- الوقت (نفس معادلة world3d: الساعة الحقيقية + الإزاحة، أو ?hour=) ---------- */
  function hourNow() {
    const q = new URLSearchParams(location.search).get("hour");
    const W = OSW.world || {};
    const d = new Date();
    const base = q != null && q !== "" ? parseFloat(q) : d.getHours() + d.getMinutes() / 60;
    return ((((base + (W.timeOffset || 0)) % 24) + 24) % 24);
  }
  /* الفترات: ليل (بالبيت) / صباح (عند الدكان) / نهار (تجوّل حرّ) / مساء (الساحة) */
  function phaseOf(h) {
    if (h >= 21 || h < 5.5) return "night";
    if (h < 8.5) return "morning";
    if (h < 16.5) return "day";
    return "evening";
  }
  R.phaseOf = phaseOf; R.hourNow = hourNow;

  /* ---------- مسار بنقاط وسيطة (نفس منطق الشمال/الجنوب بـ stepNpc) ---------- */
  const south = (z) => z > 31;
  function viaPoints(from, to) {
    const pad = OSW.deliv && OSW.deliv.activePad && OSW.deliv.activePad();
    let dest = to;
    if (pad && Math.hypot(to.x - pad.x, to.z - pad.z) < 4.5) dest = { x: to.x + (to.x >= pad.x ? 3.5 : -3.5), z: to.z + 2.5 };
    if (south(from.z) && !south(dest.z)) return [{ x: from.x * 0.3, z: 34.5 }, { x: 0, z: 33 }, { x: 0, z: 27 }, dest];
    if (!south(from.z) && south(dest.z)) return [{ x: 0, z: 27 }, { x: 0, z: 33 }, { x: dest.x * 0.5, z: 34.5 }, dest];
    return [dest];
  }
  /* كل مرحلة: ننتظر وصول world3d (مسافة < 2.4) أو "شبه وصول" إذا علقت الشخصية بعائق قرب الهدف
     (ثابتة ~2.5 ثانية وعلى بعد < 4.5) — بدل ما نستنى مهلة الـ45 ثانية. */
  function goVia(id, to, done) {
    const W = OSW.world; if (!W || !W.npcPos) return false;
    const p = W.npcPos(id); if (!p) return false;
    const pts = viaPoints(p, to);
    const step = () => {
      const n = pts.shift(); if (!n) { if (done) done(); return; }
      let fin = false, lx = null, lz = null, still = 0;
      const next = (ok) => { if (fin) return; fin = true; clearInterval(iv); if (ok === false) { if (done) done(false); } else step(); };
      const iv = setInterval(() => {
        const q = W.npcPos(id); if (!q) return next(false);
        const d = Math.hypot(n.x - q.x, n.z - q.z), moved = lx == null ? 9 : Math.hypot(q.x - lx, q.z - lz);
        lx = q.x; lz = q.z; still = moved < 0.15 ? still + 0.5 : 0;
        if (still >= 2.5 && d < 4.5) { W.npcProps(id, { over: null, mv: 0 }); next(); }
      }, 500);
      if (!W.npcGoto(id, n.x, n.z, () => next())) next(false);
    };
    step(); return true;
  }
  R.goVia = goVia;

  /* ---------- جدول سكّان القرية ---------- */
  const st = {}; // id -> {phase, token}
  const poiOf = (k, fb) => { try { const p = OSW.world.poi(k); return p && p.x != null ? p : fb; } catch (e) { return fb; } };
  function residents() {
    return (OSW.NPCS || []).filter((n) => n.home && !n.isle && !n.roam && !n.noRoutine && !n.id.startsWith("vis_"));
  }
  function target(def, phase, idx) {
    const a = idx * 2.399, r = 1.6 + (idx % 4) * 0.9;           // توزيع حلزوني ما يتكدّسوا بنفس النقطة
    if (phase === "night") { const h = poiOf(def.home, null); return h ? { x: h.x + Math.cos(a) * 1.2, z: h.z + 1.5 } : null; }
    if (phase === "morning") { return { x: -24 + Math.cos(a) * r, z: 17.5 + Math.abs(Math.sin(a)) * r * 0.6 }; }
    if (phase === "evening") { const pl = poiOf("plaza", { x: 0, z: 58 }); return { x: pl.x + Math.cos(a) * (r + 2), z: pl.z + 4 + Math.sin(a) * r }; }
    return null;
  }
  const MOOD = { night: "😴", morning: "☕", evening: "🌇", day: "" };

  function tick() {
    if (!R.enabled || !OSW.world || !OSW.world.npcPos) return;
    const phase = phaseOf(hourNow());
    residents().forEach((def, i) => {
      const s = st[def.id] || (st[def.id] = { phase: null, tok: 0 });
      if (s.phase === phase) return;
      if (!OSW.world.npcPos(def.id)) return;                      // لسا ما انخلق — نعيد المحاولة
      s.phase = phase; const tok = ++s.tok; def.stay = false;
      const dest = target(def, phase, i);
      if (!dest) { OSW.world.setNpcMood && OSW.world.setNpcMood(def.id, "", ""); return; }  // نهار: يرجع للتجوّل الافتراضي
      // تأخير عشوائي حتى ما يتحركوا كلهم بنفس اللحظة
      setTimeout(() => {
        if (s.tok !== tok) return;
        goVia(def.id, dest, () => { if (s.tok !== tok) return; def.stay = true; OSW.world.setNpcMood && OSW.world.setNpcMood(def.id, MOOD[phase], ""); });
      }, 500 + Math.random() * 8000);
    });
  }

  /* ---------- الزوّار: واجهة للأنظمة الثانية ---------- */
  /* opts: {id?, name, emoji?, look?, lines?, from:[x,z], to:[x,z], stayMs?, mood?, speed?,
            onArrive?(id), onLeave?(id)}  — يرجّع id أو null */
  const DEF_LOOK = { gender: "boy", color: "#455a64", pants: "#2b2b2b", hair: "#222", hairStyle: "short" };
  let seq = 0;
  R.visit = function (o) {
    const W = OSW.world; if (!W || !W.addNpc || !o || !o.to) return null;
    const id = o.id || "vis_" + Date.now().toString(36) + "_" + ++seq;
    if (R.visitors[id]) return null;
    const from = o.from || [0, 80];
    const def = { id, name: o.name || "زائر", emoji: o.emoji || "🧳", look: o.look || DEF_LOOK, pos: [from[0], from[1]], roam: [o.to[0], o.to[1], 2], speed: o.speed || 2.0, lines: o.lines || ["مرحبا! عندي موعد هون 😊"], noRoutine: true };
    W.addNpc(def); R.visitors[id] = def;
    const toP = { x: o.to[0], z: o.to[1] };
    const leave = () => {
      def.stay = false; W.setNpcMood && W.setNpcMood(id, "", "");
      goVia(id, { x: from[0], z: from[1] }, () => { W.removeNpc(id); delete R.visitors[id]; if (o.onLeave) o.onLeave(id); });
    };
    const ok = goVia(id, toP, () => {
      def.stay = true; W.setNpcMood && W.setNpcMood(id, o.mood || "🤝", "");
      if (o.onArrive) o.onArrive(id);
      setTimeout(leave, o.stayMs != null ? o.stayMs : 60000);
    });
    if (!ok) { W.removeNpc(id); delete R.visitors[id]; return null; }
    return id;
  };
  R.dismiss = function (id) { const d = R.visitors[id]; if (!d) return false; d.stay = false; OSW.world.removeNpc(id); delete R.visitors[id]; return true; };

  setInterval(tick, 3000);
  OSW.routines.tick = tick;
})();
