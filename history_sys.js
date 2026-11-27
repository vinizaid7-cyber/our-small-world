/* ============================================================
   عالمنا الصغير V14 — أنظمة التاريخ والحرف والتنقيب والاقتصاد والتعاون
   - تطبيق حتمي كامل للأحداث (H.fold) متزامن 100% بين اللاعبين
   - ربط الدواب بالسرعة والمظهر
   - معالجة التفاعلات ثلاثية الأبعاد (H.act)
   ============================================================ */
(function () {
  const OSW = window.OSW;
  const H = (OSW.HIST = OSW.history = OSW.history || {});
  const G = () => OSW.game, UI = () => OSW.ui, DB = () => OSW.ui.db, W = () => OSW.world;

  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  H.ensureState = (S) => {
    if (!S.hist) {
      S.hist = {
        era: "islamic",
        mats: { raw_clay: 2, cedar_wood: 2, stone_block: 2 },
        crafts: {},
        profXp: {},
        tools: {},
        digAt: {},
        rawArt: {},
        restoredArt: {},
        exhibited: [],
        puzzles: {},
        museumClaimDay: null,
        quests: {},
        affinity: {},
        caravans: [],
        voyages: [],
        mounts: {},
        mountOn: {},
        monuments: {},
        coopTomb: { pulls: {}, done: false },
        hammamAt: {},
        spots: {},
        rarityStats: { common: 0, rare: 0, epic: 0, legendary: 0 }
      };
    }
    if (!S.hist.spots) S.hist.spots = {};
    if (!S.hist.rarityStats) S.hist.rarityStats = { common: 0, rare: 0, epic: 0, legendary: 0 };
    return S.hist;
  };

  /* ---------- قطع أثرية مخفية تحت تضاريس خريطة العالم + نظام الندرة ---------- */
  H.BURIED_SPOTS = [
    { id: "bs_vil_north", n: "تلال شمال القرية", e: "🪨", era: "ancient", site: "site_ancient_obelisk", x: 26, z: -42, depth: 2, tool: "brush", hint: "مدفون تحت الرمال شمال بيت القرية" },
    { id: "bs_vil_coast", n: "شاطئ القرية الغربي", e: "🐚", era: "classical", site: "site_classical_vault", x: -62, z: 54, depth: 2, tool: "sieve", hint: "قرب الساحل الغربي للقرية الرئيسية" },
    { id: "bs_bridge_bank", n: "ضفة الجسر الحجري", e: "🏺", era: "islamic", site: "site_islamic_observatory", x: 16, z: -56, depth: 2, tool: "sieve", hint: "عند ضفة النهر قرب مدخل الجسر الحجري" },
    { id: "bs_city_gardens", n: "حدائق دار السلام العتيقة", e: "🪔", era: "islamic", site: "site_islamic_observatory", x: -108, z: -210, depth: 2, tool: "brush", hint: "تحت تربة الحدائق جنوب غرب دار السلام" },
    { id: "bs_city_east", n: "أطراف السور الشرقي", e: "⚔️", era: "medieval", site: "site_citadel_cache", x: 108, z: -320, depth: 2, tool: "pickaxe", hint: "بمحاذاة السور الداخلي الشرقي" },
    { id: "bs_farm_hill", n: "تلة القرية الزراعية", e: "🌾", era: "ancient", site: "site_ancient_obelisk", x: -258, z: -162, depth: 2, tool: "pickaxe", hint: "تحت حقول الزيتون والناعورة" },
    { id: "bs_port_dune", n: "كثبان الميناء القديم", e: "🪙", era: "classical", site: "site_classical_vault", x: -284, z: -392, depth: 3, tool: "sieve", hint: "تحت الكثبان الرملية جنوب الميناء" },
    { id: "bs_citadel_slope", n: "سفح جبل القلعة", e: "🛡️", era: "medieval", site: "site_citadel_cache", x: 240, z: -225, depth: 3, tool: "pickaxe", hint: "تحت الصخور عند مدخل الجبل" },
    { id: "bs_oasis_palms", n: "رمال واحة النخيل", e: "📜", era: "islamic", site: "site_islamic_observatory", x: -128, z: -545, depth: 3, tool: "astrolabe", hint: "غرب بركة الواحة بين النخيل" },
    { id: "bs_obelisk_sand", n: "رمال مسلّة الشمس", e: "🪨", era: "ancient", site: "site_ancient_obelisk", x: 156, z: -492, depth: 3, tool: "pickaxe", hint: "مدفون عميقاً شرق المسلّة الفرعونية" },
    { id: "bs_tomb_ridge", n: "حافة وادي المقابر", e: "👑", era: "ancient", site: "site_ancient_tomb", x: 195, z: -578, depth: 3, tool: "astrolabe", hint: "كنز مدفون خلف بوابة المقابر الصخرية" },
    { id: "bs_odeion_marble", n: "تحت رخام المدرج الغربي", e: "🏛️", era: "classical", site: "site_classical_odeion", x: -275, z: -520, depth: 3, tool: "brush", hint: "أعمدة وأرضيات فسيفساء مطمورة بالرمال" }
  ];
  H.SPOT_BY_ID = {};
  H.BURIED_SPOTS.forEach((s) => { H.SPOT_BY_ID[s.id] = s; });

  H.rarityOdds = (toolId, hs, ev) => {
    const astro = toolId === "astrolabe" ? 1 : 0;
    const sieve = toolId === "sieve" ? 1 : 0;
    const pick = toolId === "pickaxe" ? 1 : 0;
    const mon = (hs && hs.monuments && hs.monuments.mon_astro >= 5) ? 1 : 0;
    const evt = ev && ev.digFast ? 1 : 0;
    const leg = 5 + astro * 8 + mon * 9 + evt * 4;
    const epic = 13 + astro * 10 + pick * 4 + mon * 10 + evt * 5;
    const rare = 30 + astro * 6 + sieve * 10 + evt * 6;
    const common = Math.max(8, 100 - leg - epic - rare);
    return { common, rare, epic, legendary: leg };
  };

  H.rollArtifactByRarity = (seed, era, siteId, toolId, hs, ev) => {
    const odds = H.rarityOdds(toolId, hs, ev);
    const total = odds.common + odds.rare + odds.epic + odds.legendary;
    const r = hash(seed) % total;
    let tier = "common";
    if (r < odds.legendary) tier = "legendary";
    else if (r < odds.legendary + odds.epic) tier = "epic";
    else if (r < odds.legendary + odds.epic + odds.rare) tier = "rare";

    const all = Object.values(H.ARTIFACTS || {});
    let cand = all.filter((x) => x.rarity === tier && (!siteId || x.site === siteId));
    if (!cand.length) cand = all.filter((x) => x.rarity === tier && (!era || x.era === era));
    if (!cand.length) cand = all.filter((x) => x.rarity === tier);
    if (!cand.length) cand = all.filter((x) => x.site === siteId);
    if (!cand.length) cand = all;
    return cand[hash(seed + ":pick") % cand.length];
  };

  H.getEquippedTool = (hs) => {
    const pref = localStorage.getItem("osw_dig_tool");
    if (pref && hs && (hs.tools[pref] || 0) > 0) return pref;
    const order = ["astrolabe", "pickaxe", "sieve", "brush"];
    return order.find((k) => hs && (hs.tools[k] || 0) > 0) || pref || "brush";
  };
  H.equipTool = (id) => {
    if (H.DIG_TOOLS[id]) localStorage.setItem("osw_dig_tool", id);
  };
  H.probeTerrain = (x, z, hs, now = Date.now()) => {
    const ev = H.activeEvent(now), cd = Math.round(120000 * (ev.digFast || 1));
    let best = null, bd = 1e9;
    H.BURIED_SPOTS.forEach((sp) => {
      const st = (hs && hs.spots && hs.spots[sp.id]) || { digs: 0, coolAt: 0 };
      const ready = !st.coolAt || now - st.coolAt >= cd;
      const d = Math.hypot(sp.x - x, sp.z - z);
      if (ready && d < bd) { bd = d; best = { spot: sp, dist: d, state: st }; }
    });
    return best;
  };

  H.profLevel = (xp) => 1 + Math.floor((xp || 0) / 80);

  H.fold = (ty, e, d, t, a, day, S, H2) => {
    if (String(ty).indexOf("hist_") !== 0) return false;
    const hs = H.ensureState(S), ev = H.activeEvent(t);
    const mark = () => H2 && H2.mark && H2.mark();

    if (ty === "hist_era") {
      if (H.ERAS[d.era]) { hs.era = d.era; mark(); }
      return true;
    }

    if (ty === "hist_buy_mat") {
      const m = H.MATS[d.id]; if (!m) return true;
      const qty = Math.max(1, Math.min(25, Math.floor(+d.qty || 1)));
      const unit = Math.max(1, Math.round(m.price * (ev.matDiscount || 1)));
      const cost = unit * qty;
      if (S.coins < cost) return true;
      S.coins -= cost;
      hs.mats[d.id] = (hs.mats[d.id] || 0) + qty;
      mark();
      return true;
    }

    if (ty === "hist_craft") {
      const r = H.CRAFT_BY_ID[d.id]; if (!r) return true;
      for (const mk of Object.keys(r.mats)) {
        if ((hs.mats[mk] || 0) < r.mats[mk]) return true;
      }
      for (const mk of Object.keys(r.mats)) hs.mats[mk] -= r.mats[mk];
      hs.crafts[d.id] = (hs.crafts[d.id] || 0) + 1;
      const xpGain = Math.round(r.xp * (ev.xpMul || 1) * (d.coop ? 1.25 : 1));
      hs.profXp[r.prof] = (hs.profXp[r.prof] || 0) + xpGain;
      mark();
      return true;
    }

    if (ty === "hist_sellcraft") {
      const r = H.CRAFT_BY_ID[d.id]; if (!r) return true;
      const have = hs.crafts[d.id] || 0;
      const qty = Math.max(1, Math.min(have, Math.floor(+d.qty || 1)));
      if (have < qty || qty <= 0) return true;
      const lvl = H.profLevel(hs.profXp[r.prof] || 0);
      const lvlMul = 1 + Math.min(0.35, (lvl - 1) * 0.05);
      const unit = Math.round(H.craftPrice(d.id, day) * lvlMul * (ev.craftBonus || 1));
      hs.crafts[d.id] -= qty;
      S.coins += unit * qty;
      mark();
      return true;
    }

    if (ty === "hist_caravan") {
      const cap = 4 + (hs.mounts.carriage ? 8 : hs.mounts.camel ? 4 : 0);
      const req = Array.isArray(d.items) ? d.items : [];
      let totalQ = 0, baseVal = 0;
      const cargo = [];
      for (const it of req) {
        const r = H.CRAFT_BY_ID[it.id], q = Math.max(0, Math.floor(+it.qty || 0));
        if (!r || q <= 0 || totalQ + q > cap || (hs.crafts[it.id] || 0) < q) return true;
        totalQ += q;
        baseVal += H.craftPrice(it.id, day) * q;
        cargo.push({ id: it.id, qty: q });
      }
      if (!cargo.length) return true;
      for (const it of cargo) hs.crafts[it.id] -= it.qty;
      const archBonus = (hs.monuments.mon_arch || 0) >= 3 ? 1.15 : 1;
      const payout = Math.round(baseVal * 1.45 * archBonus);
      hs.caravans.push({ id: e.id, by: a, cargo, payout, start: t, end: t + 180000, done: false });
      mark();
      return true;
    }

    if (ty === "hist_caravan_claim") {
      const c = hs.caravans.find((x) => x.id === d.id);
      if (!c || c.done || t < c.end) return true;
      c.done = true;
      S.coins += c.payout;
      mark();
      return true;
    }

    if (ty === "hist_voyage") {
      const mode = d.mode === "craft" ? "craft" : "charter";
      let payout = 74, label = "شحنة الميناء البحرية";
      if (mode === "craft") {
        const r = H.CRAFT_BY_ID[d.item];
        if (!r || (hs.crafts[d.item] || 0) < 1) return true;
        hs.crafts[d.item] -= 1;
        payout = Math.round(H.craftPrice(d.item, day) * 1.65);
        label = r.e + " " + r.n;
      } else {
        if (S.coins < 45) return true;
        S.coins -= 45;
      }
      const rarePool = ["lapis_gem", "gold_dust", "silk_thread", "saffron", "ancient_ink"];
      const bonusMat = rarePool[hash(e.id + ":sea") % rarePool.length];
      hs.voyages.push({ id: e.id, by: a, label, payout, bonusMat, start: t, end: t + 240000, done: false });
      mark();
      return true;
    }

    if (ty === "hist_voyage_claim") {
      const v = hs.voyages.find((x) => x.id === d.id);
      if (!v || v.done || t < v.end) return true;
      v.done = true;
      S.coins += v.payout;
      hs.mats[v.bonusMat] = (hs.mats[v.bonusMat] || 0) + 1;
      mark();
      return true;
    }

    if (ty === "hist_dig_tool") {
      const tl = H.DIG_TOOLS[d.id]; if (!tl || S.coins < tl.price) return true;
      S.coins -= tl.price;
      hs.tools[d.id] = (hs.tools[d.id] || 0) + tl.uses;
      mark();
      return true;
    }

    if (ty === "hist_dig") {
      const site = H.SITES[d.site]; if (!site) return true;
      const toolId = hs.tools[d.tool] > 0 ? d.tool : hs.tools[site.tool] > 0 ? site.tool : null;
      if (!toolId) return true;
      const cd = Math.round(60000 * (ev.digFast || 1));
      if (hs.digAt[d.site] && t - hs.digAt[d.site] < cd) return true;

      hs.tools[toolId] -= 1;
      hs.digAt[d.site] = t;

      const picked = H.rollArtifactByRarity(e.id + ":site:" + d.site, site.era, d.site, toolId, hs, ev);
      if (picked) {
        hs.rawArt[picked.id] = (hs.rawArt[picked.id] || 0) + 1;
        hs.rarityStats[picked.rarity] = (hs.rarityStats[picked.rarity] || 0) + 1;
      }
      const findMats = ["raw_clay", "stone_block", "copper", "ancient_ink", "gold_dust"];
      const fm = findMats[hash(e.id + ":mat") % findMats.length];
      hs.mats[fm] = (hs.mats[fm] || 0) + 1;
      mark();
      return true;
    }

    if (ty === "hist_dig_spot") {
      const sp = H.SPOT_BY_ID[d.spot]; if (!sp) return true;
      const cd = Math.round(120000 * (ev.digFast || 1));
      const st = (hs.spots[sp.id] = hs.spots[sp.id] || { digs: 0, coolAt: 0, lastArt: null });
      if (st.coolAt && t - st.coolAt < cd) return true;

      const toolId = hs.tools[d.tool] > 0 ? d.tool : hs.tools[sp.tool] > 0 ? sp.tool : ["astrolabe", "pickaxe", "sieve", "brush"].find((k) => (hs.tools[k] || 0) > 0);
      if (!toolId) return true;
      if (st.digs === 0) hs.tools[toolId] -= 1;

      const step = toolId === "pickaxe" || toolId === "astrolabe" ? 2 : 1;
      st.digs += step;
      if (st.digs >= sp.depth) {
        st.digs = 0;
        st.coolAt = t;
        const picked = H.rollArtifactByRarity(e.id + ":spot:" + sp.id, sp.era, sp.site, toolId, hs, ev);
        if (picked) {
          st.lastArt = picked.id;
          hs.rawArt[picked.id] = (hs.rawArt[picked.id] || 0) + 1;
          hs.rarityStats[picked.rarity] = (hs.rarityStats[picked.rarity] || 0) + 1;
        }
        const findMats = ["raw_clay", "stone_block", "copper", "ancient_ink", "gold_dust", "lapis_gem"];
        const fm = findMats[hash(e.id + ":smat") % findMats.length];
        hs.mats[fm] = (hs.mats[fm] || 0) + 1;
      }
      mark();
      return true;
    }

    if (ty === "hist_puzzle") {
      const pz = H.PUZZLES[d.id]; if (!pz || hs.puzzles[d.id] || +d.ans !== pz.ans) return true;
      hs.puzzles[d.id] = { by: a, t };
      S.coins += pz.rewardCoins;
      if (pz.rewardArt) hs.rawArt[pz.rewardArt] = (hs.rawArt[pz.rewardArt] || 0) + 1;
      mark();
      return true;
    }

    if (ty === "hist_restore") {
      const art = H.ARTIFACTS[d.id]; if (!art || (hs.rawArt[d.id] || 0) < 1) return true;
      if (S.coins < art.restoreCoins) return true;
      for (const mk of Object.keys(art.restoreMats || {})) {
        if ((hs.mats[mk] || 0) < art.restoreMats[mk]) return true;
      }
      S.coins -= art.restoreCoins;
      for (const mk of Object.keys(art.restoreMats || {})) hs.mats[mk] -= art.restoreMats[mk];
      hs.rawArt[d.id] -= 1;
      hs.restoredArt[d.id] = (hs.restoredArt[d.id] || 0) + 1;
      mark();
      return true;
    }

    if (ty === "hist_exhibit") {
      const art = H.ARTIFACTS[d.id]; if (!art) return true;
      const idx = hs.exhibited.indexOf(d.id);
      if (idx >= 0) {
        hs.exhibited.splice(idx, 1);
      } else {
        if ((hs.restoredArt[d.id] || 0) < 1 || hs.exhibited.length >= 12) return true;
        hs.exhibited.push(d.id);
      }
      mark();
      return true;
    }

    if (ty === "hist_museum_claim") {
      if (hs.museumClaimDay === day || !hs.exhibited.length) return true;
      const inc = H.museumIncome(hs, t);
      if (inc <= 0) return true;
      hs.museumClaimDay = day;
      S.coins += inc;
      mark();
      return true;
    }

    if (ty === "hist_quest") {
      const npc = H.NPCS.find((n) => n.quest && n.quest.id === d.id);
      if (!npc || hs.quests[d.id]) return true;
      const q = npc.quest;
      if ((hs.mats[q.needMat] || 0) < q.qty) return true;
      hs.mats[q.needMat] -= q.qty;
      hs.quests[d.id] = { by: a, t };
      S.coins += q.coins;
      if (q.bonusMat) hs.mats[q.bonusMat] = (hs.mats[q.bonusMat] || 0) + (q.bonusQty || 1);
      hs.affinity[npc.id] = (hs.affinity[npc.id] || 0) + 25;
      mark();
      return true;
    }

    if (ty === "hist_mount_buy") {
      const mt = H.MOUNTS[d.id]; if (!mt || hs.mounts[d.id] || S.coins < mt.price) return true;
      S.coins -= mt.price;
      hs.mounts[d.id] = true;
      hs.mountOn[a] = d.id;
      mark();
      return true;
    }

    if (ty === "hist_mount_toggle") {
      hs.mountOn[a] = d.id && hs.mounts[d.id] ? d.id : null;
      mark();
      return true;
    }

    if (ty === "hist_monument") {
      const mn = H.MONUMENTS.find((x) => x.id === d.id); if (!mn) return true;
      const stg = hs.monuments[mn.id] || 0;
      if (stg >= mn.stages) return true;
      if (S.coins < mn.stageCoins || (hs.mats.stone_block || 0) < 3 || (hs.mats.cedar_wood || 0) < 2) return true;
      S.coins -= mn.stageCoins;
      hs.mats.stone_block -= 3;
      hs.mats.cedar_wood -= 2;
      hs.monuments[mn.id] = stg + 1;
      S.coins += 12;
      if (stg + 1 >= mn.stages) S.coins += mn.rewardCoins;
      mark();
      return true;
    }

    if (ty === "hist_coop_tomb") {
      if (hs.coopTomb.done) return true;
      hs.coopTomb.pulls[a] = t;
      const other = Object.keys(hs.coopTomb.pulls).find((u) => u !== a && Math.abs(t - hs.coopTomb.pulls[u]) <= H.COOP_TOMB.windowMs);
      if (other) {
        hs.coopTomb.done = true;
        S.coins += H.COOP_TOMB.rewardCoins;
        hs.rawArt[H.COOP_TOMB.rewardArt] = (hs.rawArt[H.COOP_TOMB.rewardArt] || 0) + 1;
      }
      mark();
      return true;
    }

    if (ty === "hist_hammam") {
      const both = !!d.both, cost = both ? 35 : 20;
      if (S.coins < cost) return true;
      if (hs.hammamAt[a] && t - hs.hammamAt[a] < 45000) return true;
      S.coins -= cost;
      hs.hammamAt[a] = t;
      const fill = (u) => { S.need[u] = { food: 100, drink: 100, t, sip: t }; };
      fill(a);
      if (both) {
        const pid = Object.keys(S.need || {}).find((u) => u !== a);
        if (pid) fill(pid);
      }
      mark();
      return true;
    }

    return false;
  };

  H.museumIncome = (hs, t) => {
    if (!hs || !hs.exhibited || !hs.exhibited.length) return 0;
    const ev = H.activeEvent(t);
    const domeMul = (hs.monuments && hs.monuments.mon_dome >= 4) ? 1.15 : 1;
    const base = hs.exhibited.reduce((sum, id) => sum + (H.ARTIFACTS[id] ? H.ARTIFACTS[id].income : 0), 0);
    return Math.round(base * (ev.museumMul || 1) * domeMul);
  };

  /* ---------- ربط سرعة الدواب باللعبة بدون كسر المركبات ---------- */
  function hookSpeed() {
    const g = G();
    if (!g || !g.speedMul || g._histSpeed) return;
    g._histSpeed = true;
    const orig = g.speedMul;
    g.speedMul = () => {
      let m = orig();
      if (!(OSW.veh && OSW.veh.me) && H.activeMount && H.MOUNTS[H.activeMount]) {
        m *= H.MOUNTS[H.activeMount].speed;
      }
      return m;
    };
  }
  hookSpeed();

  H.badgeCount = () => {
    const g = G(), db = DB();
    if (!g || !db || !db.me) return 0;
    const s = g.state(), hs = H.ensureState(s), now = Date.now(), day = H.dayOf(now);
    let n = 0;
    n += (hs.caravans || []).filter((c) => !c.done && now >= c.end).length;
    n += (hs.voyages || []).filter((v) => !v.done && now >= v.end).length;
    if ((hs.exhibited || []).length > 0 && hs.museumClaimDay !== day) n += 1;
    n += Object.keys(hs.rawArt || {}).filter((k) => hs.rawArt[k] > 0 && !(hs.restoredArt[k] > 0)).length;
    return n;
  };

  let lastEra = null;
  H.sync3d = (s) => {
    hookSpeed();
    if (H.ensureMapHook) H.ensureMapHook();
    const db = DB(); if (!db || !db.me || !s) return;
    const hs = H.ensureState(s);
    const w = W();
    const inNorth = !!(w && w.S && w.S.ready && H.inNorth && H.inNorth(w.getMe().x, w.getMe().z));
    if (w && w.mode === "out" && !(OSW.veh && OSW.veh.me)) {
      H.activeMount = hs.mountOn[db.uid] || null;
      H.partnerMount = db.partner ? (hs.mountOn[db.partner.id] || null) : null;
    } else {
      H.activeMount = null;
      H.partnerMount = null;
    }
    const eraMusic = inNorth ? (H.ERAS[hs.era] ? H.ERAS[hs.era].music : "islamic") : null;
    if (eraMusic !== lastEra) {
      lastEra = eraMusic;
      OSW.audio && OSW.audio.setEra && OSW.audio.setEra(eraMusic);
    }
    const hb = document.getElementById("histBadge");
    if (hb) {
      const bc = H.badgeCount();
      hb.textContent = bc;
      hb.hidden = !bc;
    }
  };

  /* ---------- معالجة النقر والتفاعل ثلاثي الأبعاد (hist:*) ---------- */
  H.act = (v) => {
    const p = String(v || "").split(":"), k = p[0], arg = p[1];
    const ap = OSW.app;
    if (k === "in" && ap && ap.enterInterior) return ap.enterInterior(arg);
    if (k === "craft") { H.openProf = arg || "blacksmith"; return ap.goPlace("hist_crafts"); }
    if (k === "site") { H.openSite = arg; return ap.goPlace("hist_arch"); }
    if (k === "atlas") return ap.goPlace("hist_atlas");
    if (k === "eras") return ap.goPlace("hist_eras");
    if (k === "market") return ap.goPlace("hist_market");
    if (k === "arch") return ap.goPlace("hist_arch");
    if (k === "museum") return ap.goPlace("hist_museum");
    if (k === "monuments") return ap.goPlace("hist_monuments");
    if (k === "puzzles") return ap.goPlace("hist_puzzles");
    if (k === "caravans") return ap.goPlace("hist_caravans");
    if (k === "port") return ap.goPlace("hist_caravans");
    if (k === "hammam") return ap.goPlace("hist_hammam");
    if (k === "fountain") {
      OSW.audio && OSW.audio.sfx("heart");
      UI().hearts("⛲", 8);
      return UI().toast("⛲ استرحتم عند نافورة دار السلام! استمتعوا بأجواء المدينة التاريخية.", "gold", 3000);
    }
    if (k === "coop_tomb") return ap.goPlace("hist_coop_tomb");
    if (k === "digspot") return H.digTerrainSpot(arg);
    return ap.goPlace("hist_atlas");
  };

  /* ---------- التفاعل المباشر مع تضاريس العالم للحفر ---------- */
  H.digTerrainSpot = async (spotId) => {
    const sp = H.SPOT_BY_ID[spotId];
    const g = G(), ui = UI();
    if (!sp || !g || !ui) return;
    const hs = H.ensureState(g.state()), now = Date.now(), ev = H.activeEvent(now);
    const cd = Math.round(120000 * (ev.digFast || 1));
    const st = (hs.spots[sp.id] = hs.spots[sp.id] || { digs: 0, coolAt: 0 });
    if (st.coolAt && now - st.coolAt < cd) {
      const left = Math.ceil((cd - (now - st.coolAt)) / 1000);
      return ui.toast(`⏳ الرمال تعيد تغطية «${sp.n}» خلال ${left}ث`, "", 2500);
    }
    const toolId = H.getEquippedTool(hs);
    if (!hs.tools[toolId] || hs.tools[toolId] <= 0) {
      OSW.audio && OSW.audio.sfx("pop");
      ui.toast(`🧰 تحتاج أداة تنقيب أولاً! اشتريها من نافذة الآثار.`, "gold", 3000);
      return OSW.app && OSW.app.goPlace("hist_arch");
    }
    try {
      const prevRaw = Object.assign({}, hs.rawArt);
      await g.do("hist_dig_spot", { spot: sp.id, tool: toolId });
      const nextHs = H.ensureState(g.state());
      const nextSt = nextHs.spots[sp.id] || { digs: 0 };
      const found = Object.keys(nextHs.rawArt).find((k) => (nextHs.rawArt[k] || 0) > (prevRaw[k] || 0));
      if (found) {
        const art = H.ARTIFACTS[found], rar = H.RARITY[art.rarity];
        OSW.audio && OSW.audio.sfx("magic");
        ui.hearts(art.e, art.rarity === "legendary" ? 18 : 10);
        ui.toast(`🎉 [${rar.n}] استخرجتم من التضاريس: ${art.e} ${art.n}! رمّموه بالمتحف 🏛️`, "gold", 4500);
      } else {
        OSW.audio && OSW.audio.sfx("dig");
        ui.toast(`⛏️ حفر ${sp.n} (${nextSt.digs}/${sp.depth}) — اقتربتم من الأثر المدفون!`, "", 2000);
      }
    } catch (e) {
      ui.toast("⚠️ " + OSW.esc(e.message));
    }
  };
})();
