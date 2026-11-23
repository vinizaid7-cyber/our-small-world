/* الخزانة الموسّعة (V11): تسريحات شعر، أحذية، شنط، أطقم جديدة، وإطلالات محفوظة.
   بتتحمّل بعد content.js وgame.js. شكلها بيترسم عن طريق hooks صغيرة بـ chars3d.js (HAIRX / SHOEX / ACCX / OUTFITX). */
(function () {
  const OSW = window.OSW, G = OSW.game, esc = OSW.esc, PI = Math.PI;
  const CL = OSW.CLOTHES, ITEM = G.ITEM;
  const add = (k, v) => { CL[k] = v; ITEM["cl_" + k] = Object.assign({ cloth: 1 }, v); };

  /* ---- تسريحات الشعر ---- */
  OSW.PALETTES.styles.push(["bob", "كاريه"], ["curly", "مجعّد"], ["bun", "كعكة"], ["braid", "ضفيرة"], ["afro", "أفرو"], ["spiky", "شوكي"], ["mohawk", "موهوك"], ["wavy", "موجي طويل"], ["buzz", "حليق خفيف"]);
  const dome = (b, c, r) => b.sphere(0, 1.68, -0.03, 0.35 * (r || 1), 0.3 * (r || 1), 0.34 * (r || 1), c, 9, 0, true);
  OSW.HAIRX = {
    bob: (b, c) => { dome(b, c); b.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, c); b.box(0, 1.5, -0.2, 0.72, 0.55, 0.16, c); [-1, 1].forEach((s) => b.box(s * 0.36, 1.48, 0, 0.1, 0.5, 0.4, c)); },
    curly: (b, c) => { dome(b, c, 1.05); for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; b.sphere(Math.sin(a) * 0.36, 1.62 + (i % 3) * 0.08, Math.cos(a) * 0.3 - 0.05, 0.1, 0.1, 0.1, c, 5); } b.box(0, 1.84, 0.2, 0.5, 0.09, 0.14, c); },
    bun: (b, c) => { dome(b, c); b.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, c); b.sphere(0, 2.05, -0.05, 0.17, 0.17, 0.17, c, 7); b.cyl(0, 1.95, -0.05, 0.1, 0.1, 0.04, "#ff8fb1", 6); },
    braid: (b, c) => { dome(b, c); b.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, c); for (let i = 0; i < 6; i++) b.sphere(0, 1.55 - i * 0.2, -0.32 - i * 0.02, 0.1 - i * 0.008, 0.11, 0.09, c, 5); b.sphere(0, 0.4, -0.46, 0.06, 0.06, 0.06, "#ff8fb1", 4); },
    afro: (b, c) => { b.sphere(0, 1.76, -0.03, 0.52, 0.46, 0.5, c, 10, 0, true); b.sphere(0, 1.7, -0.1, 0.5, 0.4, 0.4, c, 9); },
    spiky: (b, c) => { dome(b, c); for (let i = 0; i < 7; i++) { const a = (i / 7) * PI * 2; b.cyl(Math.sin(a) * 0.2, 1.88, Math.cos(a) * 0.2 - 0.03, 0.07, 0.0, 0.28, c, 4); } b.cyl(0, 1.92, 0, 0.08, 0.0, 0.34, c, 4); },
    mohawk: (b, c) => { b.sphere(0, 1.68, -0.03, 0.34, 0.29, 0.33, c, 8, 0, true); for (let i = 0; i < 6; i++) b.box(0, 1.9 - Math.abs(i - 2.5) * 0.02, 0.2 - i * 0.1, 0.07, 0.3 - Math.abs(i - 2.5) * 0.03, 0.1, "#e63946"); },
    wavy: (b, c) => { dome(b, c); b.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, c); b.box(0, 0.95, -0.22, 0.64, 0.85, 0.12, c); [-1, 1].forEach((s) => { for (let i = 0; i < 4; i++) b.sphere(s * (0.34 + (i % 2) * 0.04), 1.5 - i * 0.2, -0.02, 0.09, 0.12, 0.1, c, 5); }); },
    buzz: (b, c) => b.sphere(0, 1.68, -0.03, 0.34, 0.285, 0.33, c, 9, 0, true),
  };

  /* ---- أحذية (slot: feet) ---- */
  const sh = (id, n, e, price, fn, note) => { add(id, { n, e, price, kind: "acc", slot: "feet", speed: id === "shoe_sport" ? 1.04 : 1, note: note || "", cat: "shoes" }); OSW.SHOEX = OSW.SHOEX || {}; OSW.SHOEX[id] = fn; };
  sh("shoe_sneak", "سنيكرز", "👟", 55, (b) => { b.box(0, -0.66, 0.05, 0.23, 0.12, 0.34, "#f4f4f6"); b.box(0, -0.68, 0.06, 0.24, 0.04, 0.35, "#2b6fd6"); b.box(0, -0.58, -0.02, 0.2, 0.04, 0.12, "#e63946"); });
  sh("shoe_boots", "بوت جلد", "🥾", 75, (b) => { b.box(0, -0.66, 0.05, 0.24, 0.12, 0.34, "#5a3a22"); b.box(0, -0.54, -0.02, 0.23, 0.18, 0.22, "#6b4528"); b.box(0, -0.68, 0.0, 0.25, 0.03, 0.3, "#2b1a10"); });
  sh("shoe_sandal", "صندل صيفي", "🩴", 35, (b) => { b.box(0, -0.67, 0.05, 0.22, 0.04, 0.34, "#c9a066"); b.box(0, -0.62, 0.12, 0.22, 0.04, 0.05, "#8a5a3b"); b.box(0, -0.62, -0.02, 0.22, 0.04, 0.05, "#8a5a3b"); });
  sh("shoe_heels", "كعب عالي", "👠", 85, (b) => { b.box(0, -0.62, 0.1, 0.2, 0.06, 0.28, "#d62839"); b.box(0, -0.7, -0.08, 0.06, 0.1, 0.06, "#d62839"); b.box(0, -0.66, 0.08, 0.16, 0.04, 0.2, "#a81d2c"); }, "للبنات");
  sh("shoe_loaf", "حذاء رسمي", "👞", 70, (b) => { b.box(0, -0.66, 0.05, 0.23, 0.1, 0.34, "#1c1c20"); b.box(0, -0.58, 0.14, 0.2, 0.03, 0.1, "#3d3d46"); });
  sh("shoe_slip", "خفّ بيت", "🧸", 30, (b) => { b.sphere(0, -0.62, 0.06, 0.15, 0.09, 0.22, "#ffb3c7", 6); b.sphere(0, -0.58, 0.14, 0.1, 0.05, 0.08, "#fff", 5); });
  sh("shoe_flip", "شبشب بحر", "🩴", 20, (b) => { b.box(0, -0.67, 0.05, 0.22, 0.035, 0.34, "#2ec4b6"); b.box(0, -0.64, 0.13, 0.04, 0.05, 0.12, "#ffd23f"); });
  sh("shoe_sport", "حذاء رياضي برق", "⚡", 120, (b) => { b.box(0, -0.66, 0.05, 0.24, 0.12, 0.36, "#ffd23f"); b.box(0, -0.68, 0.05, 0.25, 0.04, 0.37, "#111"); b.box(0, -0.58, 0.02, 0.1, 0.04, 0.2, "#e63946"); }, "+4% سرعة");
  sh("shoe_rain", "جزمة مطر", "🌧️", 45, (b) => { b.box(0, -0.66, 0.05, 0.25, 0.12, 0.34, "#ffd23f"); b.box(0, -0.5, -0.02, 0.24, 0.26, 0.22, "#f2c200"); b.box(0, -0.38, 0.0, 0.26, 0.03, 0.24, "#c99d00"); });
  OSW.SHOEX_LIST = Object.keys(OSW.SHOEX);

  /* ---- شنط (slot: bag) ---- */
  const bag = (id, n, e, price, fn) => { add(id, { n, e, price, kind: "acc", slot: "bag", speed: 1, cat: "bags" }); OSW.ACCX = OSW.ACCX || {}; OSW.ACCX[id] = fn; };
  bag("bag_tote", "شنطة قماش", "👜", 30, (b) => { b.box(0.36, 0.28, 0.02, 0.1, 0.34, 0.3, "#e9c46a"); b.box(0.36, 0.62, 0.02, 0.04, 0.3, 0.04, "#8a5a3b"); b.box(0.36, 0.5, 0.18, 0.08, 0.1, 0.02, "#e63946"); });
  bag("bag_msg", "شنطة كتف", "💼", 50, (b) => { b.box(0.3, 0.3, 0.14, 0.12, 0.28, 0.3, "#6b4528"); for (let i = 0; i < 6; i++) b.box(-0.2 + i * 0.1, 1.06 - i * 0.14, 0.2, 0.05, 0.1, 0.03, "#4a2f1f"); });
  bag("bag_hand", "شنطة يد أنيقة", "👛", 90, (b) => { b.box(0.46, 0.28, 0.1, 0.2, 0.2, 0.1, "#d62839"); b.box(0.46, 0.48, 0.1, 0.16, 0.02, 0.02, "#d4af37"); b.box(0.46, 0.5, 0.1, 0.02, 0.1, 0.02, "#d4af37"); });
  bag("bag_duffel", "شنطة سفر", "🧳", 70, (b) => { b.box(0, 0.38, -0.3, 0.56, 0.3, 0.22, "#2a6f9f"); b.box(0, 0.54, -0.3, 0.5, 0.04, 0.2, "#1d4f73"); b.box(0.18, 0.66, -0.12, 0.04, 0.3, 0.04, "#333"); });
  bag("bag_mini", "باكباك صغير", "🎒", 45, (b) => { b.box(0, 0.8, -0.28, 0.34, 0.4, 0.14, "#2a9d8f"); b.box(0, 0.72, -0.37, 0.2, 0.14, 0.04, "#1f7a70"); [-1, 1].forEach((s) => b.box(s * 0.14, 0.9, 0.0, 0.04, 0.3, 0.38, "#1f7a70")); });
  bag("bag_laptop", "شنطة لابتوب", "💻", 80, (b) => { b.box(-0.34, 0.34, 0.06, 0.1, 0.4, 0.36, "#3d3d46"); b.box(-0.34, 0.7, 0.06, 0.04, 0.34, 0.04, "#222"); b.box(-0.39, 0.46, 0.06, 0.02, 0.12, 0.2, "#74c0fc", 0.6); });
  bag("bag_basket", "سلة قش", "🧺", 40, (b) => { b.cyl(0.44, 0.26, 0.1, 0.14, 0.17, 0.2, "#c9a66b", 8); b.box(0.44, 0.42, 0.1, 0.02, 0.26, 0.3, "#a07a3f"); b.sphere(0.44, 0.46, 0.1, 0.1, 0.06, 0.1, "#e63946", 5); });
  bag("bag_sling", "شنطة خصر", "🩳", 35, (b) => { b.box(0, 0.4, 0.22, 0.3, 0.14, 0.1, "#ff7a3d"); b.box(0, 0.4, 0.0, 0.66, 0.05, 0.42, "#cf5c20"); });

  /* ---- أطقم جديدة (شكل مختلف فعلياً) ---- */
  OSW.OUTFITX = {};
  const out = (id, n, e, price, c1, c2, cat, gender, fn, note) => { add(id, { n, e, price, kind: "outfit", style: id, c1, c2, cat, gender, speed: 1, note: note || "" }); OSW.OUTFITX[id] = fn; };
  out("blazer", "بدلة سموكن", "🤵", 160, "#23283a", "#1b1f2e", "fancy", "boy", (b) => { b.box(0, 0.66, 0.19, 0.18, 0.68, 0.02, "#fff"); [-1, 1].forEach((s) => b.box(s * 0.16, 0.9, 0.2, 0.12, 0.34, 0.03, "#111")); b.box(0, 0.92, 0.22, 0.14, 0.05, 0.03, "#d62839"); });
  out("trench", "معطف طويل", "🧥", 140, "#b08d57", "#3d3d46", "daily", null, (b, o) => { b.cyl(0, 0.0, 0, 0.5, 0.42, 0.72, o.topC, 12); b.box(0, 0.58, 0.2, 0.04, 0.64, 0.03, "#6b4a30"); b.box(0, 0.5, 0.0, 0.66, 0.06, 0.42, "#6b4a30"); [-1, 1].forEach((s) => b.box(s * 0.2, 1.12, 0.17, 0.18, 0.1, 0.08, "#8d6d3d")); });
  out("denim", "جاكيت جينز", "👖", 90, "#4a7ab8", "#2f4f82", "daily", null, (b) => { b.box(0, 0.66, 0.19, 0.04, 0.66, 0.02, "#e9ecef"); [-1, 1].forEach((s) => { b.box(s * 0.18, 0.84, 0.2, 0.16, 0.14, 0.03, "#2f4f82"); b.sphere(s * 0.18, 0.84, 0.22, 0.02, 0.02, 0.02, "#ffd23f", 4); }); });
  out("track", "ترينغ رياضي", "🏃", 80, "#2a9d8f", "#264653", "daily", null, (b) => { [-1, 1].forEach((s) => b.box(s * 0.32, 0.6, 0, 0.04, 0.7, 0.4, "#fff")); b.box(0, 0.9, 0.19, 0.3, 0.05, 0.02, "#fff"); }, "+3% سرعة");
  CL.track.speed = 1.03; ITEM.cl_track.speed = 1.03;
  out("sundress", "فستان صيفي", "👗", 100, "#ff9ab8", "#ffd1dc", "daily", "girl", (b, o) => { b.cyl(0, 0.0, 0, 0.62, 0.34, 0.55, o.topC, 14); for (let i = 0; i < 7; i++) { const a = (i / 7) * PI * 2; b.sphere(Math.sin(a) * 0.4, 0.22, Math.cos(a) * 0.4, 0.05, 0.05, 0.03, "#fff", 4); } b.box(0, 0.56, 0, 0.6, 0.06, 0.36, "#fff"); });
  out("evening", "فستان سهرة", "💃", 260, "#4b1d6a", "#2b0f3d", "fancy", "girl", (b, o) => { b.cyl(0, -0.1, 0, 0.7, 0.3, 0.9, o.topC, 14); for (let i = 0; i < 10; i++) b.sphere(Math.sin(i * 1.3) * 0.3, 0.1 + (i % 5) * 0.14, 0.3 - (i % 3) * 0.05, 0.03, 0.03, 0.02, "#ffe08a", 4, 0.8); b.box(0, 0.56, 0, 0.6, 0.06, 0.36, "#ffe08a"); });
  out("kaftan", "قفطان مطرّز", "🪭", 200, "#1f7a70", "#14524b", "trad", "girl", (b, o) => { b.cyl(0, -0.05, 0, 0.7, 0.36, 0.85, o.topC, 14); b.box(0, 0.4, 0.3, 0.1, 0.7, 0.02, "#e9c46a"); [0.1, 0.3, 0.5].forEach((y, i) => b.cyl(0, y - 0.05, 0, 0.62 - i * 0.1, 0.62 - i * 0.1, 0.04, "#e9c46a", 14)); });
  out("hiking", "لبس رحلات", "🥾", 110, "#6a994e", "#3b5b2f", "work", null, (b) => { [-1, 1].forEach((s) => b.box(s * 0.16, 0.7, 0.2, 0.05, 0.5, 0.02, "#e9c46a")); b.box(0, 0.5, 0.19, 0.2, 0.2, 0.03, "#3b5b2f"); b.box(0, 0.4, 0, 0.66, 0.06, 0.42, "#e76f51"); }, "+2% سرعة");
  CL.hiking.speed = 1.02; ITEM.cl_hiking.speed = 1.02;
  out("lab", "معطف مخبر", "🥼", 95, "#f4f4f6", "#2f3a4a", "work", null, (b) => { b.box(0, 0.22, 0, 0.66, 0.8, 0.4, "#fff"); b.box(0, 0.66, 0.2, 0.04, 0.7, 0.02, "#d0d4d9"); b.box(-0.2, 0.7, 0.21, 0.12, 0.1, 0.02, "#74c0fc"); b.cyl(0.2, 0.7, 0.22, 0.015, 0.015, 0.14, "#e63946", 4); });
  out("jersey", "قميص منتخب", "⚽", 70, "#c1121f", "#111", "fun", null, (b) => { b.box(0, 0.7, 0.19, 0.3, 0.06, 0.02, "#fff"); b.box(0, 0.9, 0.19, 0.14, 0.14, 0.02, "#fff"); b.box(0, 0.6, -0.19, 0.3, 0.3, 0.02, "#fff"); });

  /* ---- hooks في chars3d (بتنضاف تلقائياً إذا لسا ما انضافت) ---- */

  /* ---- إطلالات محفوظة + تسريحات ---- */
  const db = () => OSW.ui.db, ui = () => OSW.ui;
  const myLook = () => Object.assign({}, db().kv["look:" + db().uid]);
  G.openers.looks = () => {
    const s = G.state(), k = myLook(), lk = OSW.app.lookOf(db().uid), list = k.outfits || [], gender = lk.gender, owned = (c) => c === "casual" || (s.inv["cl_" + c] || 0) >= 1;
    const styles = OSW.PALETTES.styles.filter(([id]) => !(gender === "boy" && (id === "hijab" || id === "bun")) && !(gender === "girl" && (id === "keffiyeh" || id === "mohawk")));
    const row = (o, i) => `<div class="irow"><span class="ie">${(CL[o.outfit] || CL.casual).e}</span><div class="iname"><b>${esc(o.name)}</b><small>${esc((CL[o.outfit] || CL.casual).n)} · ${(o.acc || []).filter((a) => CL[a]).map((a) => CL[a].e).join("") || "بدون إكسسوار"} · ${esc((OSW.PALETTES.styles.find((x) => x[0] === o.hairStyle) || ["", "—"])[1])}</small></div><div class="ib"><button class="btn sm gold" data-act="g-look-wear" data-i="${i}">البس</button><button class="btn sm alt" data-act="g-look-del" data-i="${i}">🗑️</button></div></div>`;
    ui().openModal(`<h3>👗 الإطلالات والتسريحات</h3><p class="hint">احفظوا إطلالتكم الحالية (الطقم + الإكسسوارات + الحذاء والشنطة + الشعر) وبدّلوا بضغطة وحدة. الأغراض لازم تكون مشتراة من محل الأناقة 🛍️</p>
      <b>💇 تسريحة الشعر</b><div class="seg" style="flex-wrap:wrap;margin:6px 0 10px">${styles.map(([id, n]) => `<button class="${lk.hairStyle === id ? "on" : ""}" data-act="g-look-hair" data-k="${id}">${n}</button>`).join("")}</div>
      <b>💾 احفظ الإطلالة الحالية</b><div class="row" style="gap:6px;margin:6px 0 10px"><input class="in" id="lookName" maxlength="18" placeholder="اسم الإطلالة (مثلاً: سهرة)" style="flex:1"><button class="btn sm gold" data-act="g-look-save">حفظ</button></div>
      <b>⭐ إطلالاتي (${list.length}/12)</b><div class="items" style="margin:6px 0">${list.map(row).join("") || '<div class="empty">ما في إطلالات محفوظة بعد</div>'}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn alt sm" data-act="g-look-go" data-k="boutique">👗 محل الأناقة</button><button class="btn alt sm" data-act="g-look-go" data-k="wardrobe">🚪 الخزانة</button></div>`);
    void owned;
  };
  const base = G.click;
  G.click = (a, el) => {
    if (a.indexOf("g-look-") !== 0) return base(a, el);
    const d = el.dataset, busy = async (f) => { try { await f(); } catch (e) { ui().toast("⚠️ " + esc(e.message)); } }, s = G.state();
    if (a === "g-look-go") { ui().closeModal(); return OSW.app.goPlace(d.k); }
    return busy(async () => {
      const k = myLook(), list = (k.outfits || []).slice();
      if (a === "g-look-hair") { k.hairStyle = d.k; await db().kvSet("look:" + db().uid, k); }
      else if (a === "g-look-save") { const n = (document.getElementById("lookName") || {}).value.trim() || "إطلالة " + (list.length + 1); if (list.length >= 12) return ui().toast("12 إطلالة حد أقصى"); list.push({ name: n.slice(0, 18), outfit: k.outfit || "casual", acc: (k.acc || []).slice(), hairStyle: k.hairStyle || (k.gender === "girl" ? "long" : "short") }); k.outfits = list; await db().kvSet("look:" + db().uid, k); ui().toast("💾 انحفظت الإطلالة"); }
      else if (a === "g-look-del") { list.splice(+d.i, 1); k.outfits = list; await db().kvSet("look:" + db().uid, k); }
      else if (a === "g-look-wear") { const o = list[+d.i]; if (!o) return; const has = (c) => c === "casual" || (s.inv["cl_" + c] || 0) >= 1; k.outfit = has(o.outfit) ? o.outfit : "casual"; k.acc = (o.acc || []).filter((x) => CL[x] && has(x)); k.hairStyle = o.hairStyle; await db().kvSet("look:" + db().uid, k); OSW.audio.sfx("magic"); ui().hearts("✨", 8); }
      OSW.app.refreshAvatars(); G.sync3d(); OSW.places.refresh();
    });
  };
})();
