/* ============================================================
   عالمنا الصغير — نواة الجزر الست (الحساب 2: العالم والتصميم)
   - تحميل/تحرير الجزيرة حسب القرب (مثل بلوكات المدينة)
   - حركة المشاة والسيارات (جسور + جزر + أرصفة) عبر تغليف OSW.veh
   - أفعال (acts) وتسميات وأماكن (poi) لكل منشأة
   - واجهة للحساب الثاني: OSW.islands.* (انظر WORLD_INTEGRATION.md)
   ما فيها أي اقتصاد/شراء/بيع/أصدقاء/لعب جماعي.
   ============================================================ */
(function () {
  const OSW = window.OSW, D = window.OSW_ISL, GEN = OSW.islandsGen, C = OSW.city, R = OSW.R, M = OSW.M, V = OSW.veh, PI = Math.PI, hy = Math.hypot;
  const W = () => OSW.world, UI = () => OSW.ui, G = () => OSW.game, esc = OSW.esc || ((s) => s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const I = (OSW.islands = { D, loaded: {}, ready: false, handlers: [], events: [] });

  /* ---------- استعلامات (واجهة الحساب الثاني) ---------- */
  I.island = (id) => D.islands[id]; I.site = D.site; I.point = D.point;
  I.sites = (isl, kind) => D.sites.filter((s) => (!isl || s.isl === isl) && (!kind || s.kind === kind));
  I.points = (isl, kind) => D.points.filter((p) => (!isl || p.isl === isl) && (!kind || p.kind === kind));
  I.parcels = (isl, status) => D.parcels.filter((p) => (!isl || p.isl === isl) && (!status || p.status === status));
  I.parcelAt = (x, z) => D.parcels.find((p) => x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) || null;
  I.siteAt = (x, z) => D.sites.find((s) => s.solid && Math.abs(x - s.x) <= s.w / 2 && Math.abs(z - s.z) <= s.d / 2) || null;
  I.nearestPoint = (x, z, kind) => I.points(null, kind).sort((a, b) => hy(a.x - x, a.z - z) - hy(b.x - x, b.z - z))[0] || null;
  I.islandAt = (x, z) => D.islandAt(x, z) || (C && C.inCity(x, z, 6) ? "ISL_CITY" : null);
  I.on = (fn) => { I.handlers.push(fn); return () => { const i = I.handlers.indexOf(fn); if (i > -1) I.handlers.splice(i, 1); }; };
  const emit = (type, data) => { const e = Object.assign({ type, t: Date.now() }, data); I.events.push(e); if (I.events.length > 50) I.events.shift(); return I.handlers.some((h) => { try { return h(e) === true; } catch (err) { console.error(err); return false; } }); };

  /* ---------- مناطق الحركة ---------- */
  const brRect = (b) => (b.dir < 0 ? { x0: b.x0, x1: b.xa - 4, z0: b.z - b.w / 2 + 0.9, z1: b.z + b.w / 2 - 0.9 } : { x0: b.id === "BRG_LIFE" ? b.xa : b.xa + 4, x1: b.x1, z0: b.z - b.w / 2 + 0.9, z1: b.z + b.w / 2 - 0.9 });
  const carRect = (b) => ({ x0: b.id === "BRG_LIFE" ? 466 : b.x0, x1: b.x1, z0: b.z - b.w / 2 + 0.9, z1: b.z + b.w / 2 - 0.9 });
  const inR = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
  const extRects = (isl) => (isl.ext || []).map((e) => ({ x0: isl.c.x + e.x0 + 1, x1: isl.c.x + e.x1, z0: isl.c.z + e.v0 + 1, z1: isl.c.z + e.v1 - 1 }));
  const walkable = (isl, x, z) => hy(x - isl.c.x, z - isl.c.z) < isl.r - 2.5 || extRects(isl).some((r) => inR(r, x, z));
  const inStrip = (b, x, z) => x >= Math.min(b.x0, b.xa) - 8 && x <= Math.max(b.x1, b.xa) + 8 && Math.abs(z - b.z) < b.w / 2 + 6;
  const nearZone = (x, z) => { // الجزيرة اللي النقطة ماشية عليها فعلاً أول، بعدين الجسر، بعدين أقرب جزيرة (عشان نرجّع اللي طلع لبرّا)
    const isls = D.order.map((id) => D.islands[id]).filter((i) => !i.legacy);
    for (const isl of isls) if (walkable(isl, x, z)) return { isl, b: D.bridges.find((g) => g.isl === isl.id && inStrip(g, x, z)) };
    for (const b of D.bridges) if (inStrip(b, x, z)) return { b };
    let best = null, bd = 40;
    for (const isl of isls) { const d = Math.min(hy(x - isl.c.x, z - isl.c.z) - isl.r, ...extRects(isl).map((r) => Math.max(0, r.x0 - x, x - r.x1) + Math.max(0, r.z0 - z, z - r.z1))); if (d < bd) { bd = d; best = isl; } }
    return best ? { isl: best } : null;
  };
  I.collide = (o, r) => {
    const zn = nearZone(o.x, o.z); if (!zn) return false;
    if (zn.b && !zn.isl) { const rc = brRect(zn.b); o.x = clamp(o.x, rc.x0, rc.x1); o.z = clamp(o.z, rc.z0, rc.z1); return true; }
    const isl = zn.isl, c = I.loaded[isl.id];
    if (zn.b) { const rc = brRect(zn.b); if (inR({ x0: rc.x0, x1: rc.x1, z0: rc.z0, z1: rc.z1 }, o.x, o.z) || (Math.abs(o.z - zn.b.z) < zn.b.w / 2 && !walkable(isl, o.x, o.z))) { o.x = clamp(o.x, rc.x0, rc.x1); o.z = clamp(o.z, rc.z0, rc.z1); return true; } }
    if (c) {
      for (const b of c.rects) { const l = b.x0 - r, rr = b.x1 + r, t = b.z0 - r, bo = b.z1 + r; if (o.x > l && o.x < rr && o.z > t && o.z < bo) { const dl = o.x - l, dr = rr - o.x, dt = o.z - t, db = bo - o.z, m = Math.min(dl, dr, dt, db); if (m === dl) o.x = l; else if (m === dr) o.x = rr; else if (m === dt) o.z = t; else o.z = bo; } }
      for (const k of c.circs) { const dx = o.x - k.x, dz = o.z - k.z, rr = k.r + r; if (dx * dx + dz * dz < rr * rr) { const d = hy(dx, dz) || 0.001; o.x = k.x + (dx / d) * rr; o.z = k.z + (dz / d) * rr; } }
    }
    if (!walkable(isl, o.x, o.z)) { // أقرب نقطة مسموحة: حدّ الدائرة أو رصيف
      let best = null, bd = 1e9; const a = Math.atan2(o.z - isl.c.z, o.x - isl.c.x), p0 = { x: isl.c.x + Math.cos(a) * (isl.r - 3), z: isl.c.z + Math.sin(a) * (isl.r - 3) }; best = p0; bd = hy(o.x - p0.x, o.z - p0.z);
      extRects(isl).forEach((e) => { const p = { x: clamp(o.x, e.x0, e.x1), z: clamp(o.z, e.z0, e.z1) }, d = hy(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; best = p; } });
      o.x = best.x; o.z = best.z;
    }
    return true;
  };
  I.carBlocked = (x, z) => {
    for (const id of D.order) { const isl = D.islands[id]; if (isl.legacy) continue; const c = I.loaded[id]; if (!c || hy(x - isl.c.x, z - isl.c.z) > isl.r) continue;
      for (const b of c.rects) if (x > b.x0 - 1.3 && x < b.x1 + 1.3 && z > b.z0 - 1.3 && z < b.z1 + 1.3) return true;
      for (const k of c.circs) if ((x - k.x) ** 2 + (z - k.z) ** 2 < (k.r + 1.2) ** 2) return true; }
    return false;
  };
  I.install = () => {
    const _con = V.constrain, _carOk = V.carOk, _pedOk = V.pedOk;
    V.constrain = (o) => (I.collide(o, 0.45) ? false : _con(o));
    V.pedOk = (x, z) => D.bridges.some((b) => inR(brRect(b), x, z)) || D.order.some((id) => { const s = D.islands[id]; return !s.legacy && walkable(s, x, z); }) || _pedOk(x, z);
    V.carOk = (x, z) => {
      if (D.bridges.some((b) => inR(carRect(b), x, z))) return true;
      for (const id of D.order) { const s = D.islands[id]; if (s.legacy) continue; if (hy(x - s.c.x, z - s.c.z) < s.r - 2) return !I.carBlocked(x, z); }
      return _carOk(x, z);
    };
    I.ready = true;
  };

  /* ---------- تحميل/تحرير الجزر ---------- */
  const LOAD = () => (C && C.low ? 260 : 360), UNLOAD = () => LOAD() + 140;
  const distTo = (me, isl) => Math.max(0, hy(me.x - isl.c.x, me.z - isl.c.z) - isl.r);
  I.build = (id) => {
    const c = GEN.newCtx(id); GEN.ground(c); GEN.gens[id](c); GEN.fill && GEN.fill(c);
    c.mesh = c.B.build(R.gl); c.fol = c.F.a.length ? c.F.build(R.gl) : null; c.B = c.F = null; c.born = performance.now();
    const S = OSW.S, w = W(); c.acts.forEach((a) => S.acts.push(a)); Object.assign(S.poi, c.pois); c.labels.forEach((l) => w.addLabel(Object.assign({ dynamic: "is:" + id }, l)));
    D.points.filter((p) => p.isl === id).forEach((p) => { S.poi["is:pt:" + p.id] = { x: p.x, z: p.z }; });
    return c;
  };
  I.free = (id) => { const c = I.loaded[id]; if (!c) return; const S = OSW.S; c.acts.forEach((a) => { const i = S.acts.indexOf(a); if (i > -1) S.acts.splice(i, 1); }); Object.keys(c.pois).forEach((k) => delete S.poi[k]); D.points.filter((p) => p.isl === id).forEach((p) => delete S.poi["is:pt:" + p.id]); W().dropLabels("is:" + id); if (c.mesh) R.free(c.mesh); if (c.fol) R.free(c.fol); c.meshes.forEach((m) => R.free(m)); delete I.loaded[id]; };
  I.update = (me, max = 1) => {
    let n = 0; D.order.forEach((id) => { const isl = D.islands[id]; if (isl.legacy || !GEN.gens[id]) return; const d = distTo(me, isl); if (!I.loaded[id] && d < LOAD() && n < max) { I.loaded[id] = I.build(id); n++; } else if (I.loaded[id] && d > UNLOAD()) I.free(id); });
    return n;
  };
  I.preload = (x, z) => { for (let i = 0; i < 6; i++) if (!I.update({ x, z }, 2)) break; };
  I.reattach = () => Object.values(I.loaded).forEach((c) => { c.acts.forEach((a) => { if (OSW.S.acts.indexOf(a) < 0) OSW.S.acts.push(a); }); Object.assign(OSW.S.poi, c.pois); });

  /* ---------- الرسم ---------- */
  const mA = new Float32Array(16); let pedChars = null, lastT = 0, bridgeBuilt = false;
  const LOOKS = [{ gender: "boy", color: "#2f7de1", hair: "#2b1d14" }, { gender: "girl", color: "#e63946", hair: "#3b2a20", hairStyle: "long" }, { gender: "boy", color: "#2a9d8f", hair: "#5a3a22" }, { gender: "girl", color: "#9b5de5", hair: "#1b1b1b", hairStyle: "ponytail" }, { gender: "boy", color: "#f4a261", hair: "#1b1b1b", hairStyle: "cap", cap: "#2b3a55" }, { gender: "girl", color: "#4dabf7", hair: "#2a1d12", hairStyle: "long" }];
  const WORKER = [{ gender: "boy", color: "#f2a900", hair: "#2a1d12", hairStyle: "cap", cap: "#f2a900" }, { gender: "boy", color: "#e07a3a", hair: "#1b1b1b", hairStyle: "cap", cap: "#f4f1e8" }, { gender: "girl", color: "#f2a900", hair: "#2a1d12", hairStyle: "ponytail" }];
  const lk = (l) => ({ gender: l.gender, color: l.color, hair: l.hair, hairStyle: l.hairStyle, cap: l.cap });
  const animPos = (a, t, out) => {
    if (a.mode === "static") return M.trs(a.x, a.y || 0, a.z, a.ry || 0, 0, 0, 1, 1, 1, out);
    if (a.mode === "bob") return M.trs(a.x, Math.sin(t * 0.9 + a.ph) * 0.18, a.z, a.ry || 0, Math.sin(t * 0.7 + a.ph) * 0.012, Math.sin(t * 0.5 + a.ph) * 0.01, 1, 1, 1, out);
    if (a.mode === "slide") { const o = Math.sin(t * a.sp * PI * 2) * a.amp; return M.trs(a.x, a.y, a.z + (a.axis === "z" ? o : 0), a.ry || 0, 0, 0, 1, 1, 1, out); }
    if (a.mode === "line") { const L = hy(a.x1 - a.x0, a.z1 - a.z0), s = (((t * a.sp + a.ph) % 1) + 1) % 1, u = s < 0.5 ? s * 2 : 2 - s * 2, dir = s < 0.5 ? 1 : -1, ux = (a.x1 - a.x0) / L, uz = (a.z1 - a.z0) / L, off = (a.off == null ? 3.2 : a.off) * dir;
      return M.trs(a.x0 + ux * L * u + uz * off * -1, 0.1, a.z0 + uz * L * u + ux * off, Math.atan2(ux * dir, uz * dir), 0, 0, 1, 1, 1, out); }
    if (a.mode === "orbit") { const an = a.a0 + t * a.sp; return M.trs(a.x + Math.cos(an) * a.r, a.y + Math.sin(an) * a.r, a.z, 0, 0, 0, 1, 1, 1, out); }
    if (a.mode === "track") { const N = a.pts.length, f = ((t * a.sp) % 1) * N, i = Math.floor(f) % N, k = f - Math.floor(f), p = a.pts[i], q = a.pts[(i + 1) % N], dx = q[0] - p[0], dz = q[2] - p[2];
      return M.trs(p[0] + dx * k, p[1] + (q[1] - p[1]) * k + 0.25, p[2] + dz * k, Math.atan2(dx, dz), -Math.atan2(q[1] - p[1], Math.hypot(dx, dz)), 0, 1, 1, 1, out); }
    if (a.mode === "spin") return M.trs(a.x, a.y, a.z, a.ry || 0, 0, t * a.sp, 1, 1, 1, out);
    if (a.mode === "spiny") return M.trs(a.x, a.y, a.z, t * a.sp, 0, 0, 1, 1, 1, out);
    return M.trs(a.x, a.y || 0, a.z, a.ry || 0, 0, 0, 1, 1, 1, out);
  };
  I.draw = (t) => {
    if (!I.ready) return; const me = W().getMe(), dt = Math.min(0.05, t - lastT || 0.016); lastT = t;
    I.update(me, 1);
    if (!bridgeBuilt && R.gl) { GEN.buildBridges(); bridgeBuilt = true; I.bridgeLabels(); }
    if (GEN.bridgeMesh && me.x > -120 + -330 && me.x < 760 && me.z > -60 && me.z < 1300) R.draw(GEN.bridgeMesh);
    const list = Object.values(I.loaded); if (!list.length) return;
    list.forEach((c) => { R.draw(c.mesh); if (c.fol) R.draw(c.fol, null, null, 1, 1.4);
      c.anim.forEach((a) => { const p = a.mode === "line" || a.mode === "track" ? null : { x: a.x, z: a.z }; if (p && (Math.abs(p.x - me.x) > 280 || Math.abs(p.z - me.z) > 280)) return; if (a.mode === "track" && (Math.abs(a.pts[0][0] - me.x) > 280 || Math.abs(a.pts[0][2] - me.z) > 280)) return; if (a.mode === "line" && (Math.abs((a.x0 + a.x1) / 2 - me.x) > 330 || Math.abs((a.z0 + a.z1) / 2 - me.z) > 330)) return; animPos(a, t, mA); R.draw(a.mesh, mA); }); });
    if (!pedChars) { pedChars = { n: LOOKS.map((l) => OSW.makeChar(lk(l))), w: WORKER.map((l) => OSW.makeChar(lk(l))) }; }
    const shadows = [];
    list.forEach((c) => c.walkers.forEach((w, wi) => { if (Math.abs(w.cx - me.x) > 150 || Math.abs(w.cz - me.z) > 150) return; const n = C && C.low ? Math.min(2, w.n) : w.n, set = w.look === "worker" ? pedChars.w : pedChars.n;
      for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2 + wi * 1.3 + t * (w.sp / w.r) * (i % 2 ? -1 : 1), s = i % 2 ? -1 : 1, x = w.cx + Math.cos(a) * w.r, z = w.cz + Math.sin(a) * w.r, ry = Math.atan2(-Math.sin(a) * s, Math.cos(a) * s); OSW.drawChar(set[(i + wi) % set.length], x, z, ry, t * 6 + i, 1, t, 1, null, 1, 0); shadows.push([x, z]); } }));
    if (shadows.length) { R.blend(true); shadows.forEach(([x, z]) => OSW.drawShadow(x, z, 0.55)); R.blend(false); }
  };
  I.bridgeLabels = () => D.bridges.forEach((b) => { if (b.gate) W().addLabel({ id: "isg_" + b.id, text: b.gate.text, x: b.gate.x, y: b.gate.y, z: b.gate.z, cls: "gate", max: 140, dynamic: "is:road" }); });

  /* ---------- أفعال المنشآت ---------- */
  I.info = (s) => {
    const I2 = D.islands[s.isl], pts = D.points.filter((p) => p.site === s.id);
    UI().openModal(`<h3>${s.e} ${esc(s.n)}</h3><p class="hint">${I2.e} ${esc(I2.n)} · المعرّف <code>${s.id}</code> · نوع: ${s.kind}</p>
      <div class="items"><div class="chk">📍 الإحداثيات (${s.x}, ${s.z}) · الباب (${s.door.x}, ${s.door.z})</div>${pts.map((p) => `<div class="chk">🔹 ${esc(p.n)} <code>${p.id}</code></div>`).join("")}
      <div class="chk">🔧 المنشأة جاهزة لاستقبال أنظمة الحساب الثاني (شراء/إنتاج/توصيل). ما في أي وظيفة اقتصادية مفعّلة هون بعد.</div></div>`);
  };
  I.onAct = (a) => {
    if (a.indexOf("is:") !== 0) return false; const p = a.split(":"), k = p[1];
    if (k === "site") { const s = D.site(p[2]); if (!s) return true; if (!emit("site", { id: s.id, site: s })) I.info(s); return true; }
    if (k === "in") { const s = D.site(p[2]); if (!s) return true; emit("enter", { id: s.id, interior: s.enter }); OSW.INT.outAt[s.enter] = { x: s.front.x, z: s.front.z }; OSW.INT.enterAct[s.enter] = a; I._cur = s.id; OSW.app.enterInterior(s.enter); return true; }
    if (k === "parcel") { const pc = D.parcels.find((q) => q.id === p[2]); if (pc && !emit("parcel", { id: pc.id, parcel: pc })) UI().openModal(`<h3>🌱 ${pc.id}</h3><p class="hint">${pc.status === "expansion" ? "منطقة توسّع فاضية للمزرعة" : "قطعة زراعية جاهزة"} · المساحة ${pc.area} م² · الربع ${pc.q}${pc.crop ? " · محصول العرض: " + pc.crop : ""}</p><div class="chk">📐 الحدود: x ${pc.x0.toFixed(0)}..${pc.x1.toFixed(0)} · z ${pc.z0.toFixed(0)}..${pc.z1.toFixed(0)}</div><div class="chk">🔧 جاهزة لنظام الزراعة/الإيجار (الحساب الثاني). لا يوجد منطق اقتصادي هون.</div>`); return true; }
    if (k === "pt") { const pt = D.point(p[2]); if (pt) emit("point", { id: pt.id, point: pt }); return true; }
    return true;
  };

  /* ---------- تنقّل سريع بين الجزر (تجهيز للاستكشاف — مجاني، بدون اقتصاد) ---------- */
  const DEST = () => [{ id: "village", n: "القرية والبيت", e: "🏡" }].concat(D.order.map((id) => ({ id, n: D.islands[id].n, e: D.islands[id].e }))).concat([{ id: "isle2", n: "الجزيرة الثانية (سوق/ميناء تصدير)", e: "🏝️" }]);
  I.travel = async (id) => {
    const w = W(), ui = UI(); if (w.mode !== "out") return ui.toast("اطلعوا من المكان أول 🚪"); if (w._int.me.veh) return ui.toast("🚪 انزلوا من السيارة أول");
    let to; if (id === "village") to = C.STOPS.village; else if (id === "isle2") to = C.STOPS.island; else if (id === "ISL_CITY") to = C.STOPS.city; else to = D.islands[id].arrive;
    ui.closeModal(); const cur = document.getElementById("curtain"); cur.classList.add("on"); await OSW.sleep(420);
    const x = to.ax != null ? to.ax : to.x, z = to.az != null ? to.az : to.z; if (id === "ISL_CITY") C.preload(x, z); else I.preload(x, z);
    w.placeMe(x, z); w.resetCam && w.resetCam(); w.setInputEnabled(true); await OSW.sleep(120); cur.classList.remove("on"); emit("travel", { to: id });
    ui.toast(`${(DEST().find((d) => d.id === id) || {}).e || "📍"} وصلتوا`, "gold", 2200);
  };
  I.openMap = () => {
    const rows = DEST().map((d) => `<div class="irow"><span class="ie">${d.e}</span><div class="iname"><b>${esc(d.n)}</b><small>${d.id.startsWith("ISL_") ? d.id : ""}</small></div><div class="ib"><button class="btn sm gold" data-act="g-is-go" data-to="${d.id}">اذهبوا</button></div></div>`).join("");
    UI().openModal(`<h3>🗺️ الجزر الست</h3><p class="hint">تنقّل سريع للاستكشاف (مجاني). بالسيارة: الجسور بتتفرّع من الطريق الطويل، وجزيرة الحياة بتبدأ من طرف مرسى المدينة.</p><div class="items">${rows}</div>`);
  };
  I.start = () => {
    if (I._started) return; I._started = true; const w = W();
    if (w.onReady) w.onReady(I.reattach);
    const hook = () => { const base = w.onAct; if (!base || base._is) return setTimeout(hook, 50); const f = (a) => (I.onAct(a) ? undefined : base(a)); f._is = 1; w.onAct = f; }; setTimeout(hook, 0);
    const gc = G().click; G().click = (a, el) => { if (a === "g-is-go") return I.travel(el.dataset.to); return gc(a, el); };
    const bx = document.querySelector(".hud-btns"); if (bx && !document.getElementById("btnIsl")) { const b = document.createElement("button"); b.id = "btnIsl"; b.className = "rbtn"; b.setAttribute("aria-label", "الجزر"); b.textContent = "🏝️"; b.onclick = () => I.openMap(); bx.insertBefore(b, bx.firstChild); }
  };
  I.install();
  const X = OSW.extras; if (X) { const st = X.start; X.start = function () { const r = st.apply(X, arguments); try { I.start(); } catch (e) { console.error(e); } return r; }; }
})();
