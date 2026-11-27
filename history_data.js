/* ============================================================
   عالمنا الصغير V14 — تحديث التاريخ الحي (البيانات والعصور والآثار والمهن والشخصيات)
   ============================================================ */
(function () {
  const OSW = window.OSW;
  const H = (OSW.HIST = OSW.history = OSW.history || {});
  const PI = Math.PI;

  /* ---------- 1. العصور التاريخية الخمسة (متناسقة معمارياً وثقافياً دون خلط عشوائي) ---------- */
  const ERAS = (H.ERAS = {
    ancient: {
      id: "ancient", n: "العصر القديم", e: "🏺", years: "3000 – 800 ق.م",
      accent: "#d49b38", stone: "#d9b984", roof: "#b88443", music: "ancient",
      arch: "معابد الحجر الرملي والمسلّات والأبراج المربعة",
      transport: "عربات خشبية وقوافل برية مبكرة",
      food: "خبز القمح البدائي، التمر، الشعير، زيت الزيتون",
      crafts: "الفخار، نحت الحجر، التعدين البرونزي",
      lore: "عصر الممالك الأولى حيث ارتفعت المسلات الحجرية ونُقشت ألواح الطين على ضفاف الوديان الخصبة."
    },
    classical: {
      id: "classical", n: "العصر الكلاسيكي", e: "🏛️", years: "800 ق.م – 500 م",
      accent: "#4e89ae", stone: "#e9e3d5", roof: "#c96f4b", music: "classical",
      arch: "أعمدة الرخام الأيونية والمدرجات والساحات العامة",
      transport: "مراكب الشراع المتوسطية والعربات المجرورة بالخيل",
      food: "الزيتون، العنب، التين، الخبز المتبل والأجبان",
      crafts: "الفسيفساء، صك العملات الفضية، صناعة الزجاج",
      lore: "عصر الفلسفة والمدرجات الحجرية والموانئ التجارية التي ربطت سواحل البحار ببعضها."
    },
    islamic: {
      id: "islamic", n: "العصر الذهبي للحضارة الإسلامية", e: "🕌", years: "750 – 1258 م",
      accent: "#168077", stone: "#ead9b7", roof: "#1d8a7e", music: "islamic",
      arch: "الأقواس المدببة والقباب الفيروزية والمشربيات والخان",
      transport: "قوافل الهجن العابرة للصحراء وسفن الداو الشراعية",
      food: "الأرز المتبل، المنسف، الكنافة، القهوة والهيل، العسل",
      crafts: "الإسطرلاب، الخزف المزجج، النسيج الدمشقي، العطور، التوريق",
      lore: "ذروة العلم والعمارة في دار السلام: بيت الحكمة، الأسواق المسقوفة، النواعير، وقوافل الحرير والتوابل."
    },
    medieval: {
      id: "medieval", n: "العصور الوسطى", e: "🏰", years: "1000 – 1450 م",
      accent: "#7b4338", stone: "#9ea2a8", roof: "#6d3a30", music: "medieval",
      arch: "القلاع الحجرية الحصينة والأبراج الدفاعية والأسوار",
      transport: "الخيول المدرعة وعربات الإمداد العسكرية",
      food: "الشوربات الدافئة، الخبز الريفي، اللحوم المشوية",
      crafts: "الحدادة الفولاذية، الدروع، النجارة الثقيلة",
      lore: "عصر القلاع الجبلية وأبراج المراقبة والحدادين الذين صاغوا الفولاذ والأسوار المنيعة."
    },
    renaissance: {
      id: "renaissance", n: "عصر النهضة", e: "🎨", years: "1450 – 1650 م",
      accent: "#9b5de5", stone: "#efe2cc", roof: "#9c4a3c", music: "renaissance",
      arch: "القباب الهندسية المنسجمة والقصور المضاءة والمتاحف",
      transport: "عربات النبلاء المزخرفة والسفن العابرة للمحيطات",
      food: "المعجنات الفاخرة، الحلويات المحشوة، التوابل النادرة",
      crafts: "صياغة المجوهرات، الساعات الفلكية، المخطوطات المصورة",
      lore: "نهضة الفنون والعلوم وحفظ التراث في المتاحف والمكتبات المضيئة بأفكار البنائين والفنانين."
    }
  });
  H.ERA_ORDER = ["ancient", "classical", "islamic", "medieval", "renaissance"];

  /* ---------- تسجيل أزياء العصور الخمسة في الخزانة + الرسم ثلاثي الأبعاد ---------- */
  OSW.OUTFITX = OSW.OUTFITX || {};
  const addOutfit = (id, def, renderFn) => {
    OSW.CLOTHES[id] = def;
    if (OSW.game && OSW.game.CLOTH) OSW.game.CLOTH[id] = def;
    if (OSW.game && OSW.game.ITEM) OSW.game.ITEM["cl_" + id] = Object.assign({ cloth: 1 }, def);
    OSW.OUTFITX[id] = renderFn;
  };
  addOutfit("era_ancient", { n: "رداء العصر القديم", e: "🏺", price: 110, kind: "outfit", style: "era_ancient", c1: "#f0e3c8", c2: "#b68036", cat: "trad", gender: null, speed: 1.02, note: "كتان أبيض بقلادة ذهبية فرعونية" }, (b, o) => {
    b.cyl(0, 0.02, 0, 0.56, 0.34, 0.68, o.topC, 12);
    b.cyl(0, 1.08, 0, 0.38, 0.34, 0.14, "#d4af37", 12);
    b.box(0, 0.52, 0, 0.64, 0.08, 0.4, "#d4af37");
    b.box(0, 0.3, 0.21, 0.16, 0.34, 0.03, "#1f6b7a");
  });
  addOutfit("era_classical", { n: "توجا العصر الكلاسيكي", e: "🏛️", price: 140, kind: "outfit", style: "era_classical", c1: "#f5f1e8", c2: "#8a2b2b", cat: "trad", gender: null, speed: 1.02, note: "رداء كلاسيكي أبيض بوشاح أرجواني" }, (b, o) => {
    b.cyl(0, -0.02, 0, 0.64, 0.35, 0.82, o.topC, 14);
    b.push(0.02, 0.82, 0.12, 0, 0, 0.55); b.box(0, 0, 0, 0.72, 0.13, 0.42, "#8a2b2b"); b.pop();
    b.cyl(0, 1.88, 0, 0.35, 0.35, 0.04, "#5c9e31", 12);
  });
  addOutfit("era_islamic", { n: "عباءة العصر الذهبي", e: "🕌", price: 180, kind: "outfit", style: "era_islamic", c1: "#185e58", c2: "#103d39", cat: "trad", gender: null, speed: 1.04, note: "قفطان أندلسي مطرز بالذهب وعمامة أو تاج" }, (b, o) => {
    b.cyl(0, -0.05, 0, 0.68, 0.36, 0.88, o.topC, 14);
    b.box(0, 0.46, 0.22, 0.1, 0.76, 0.03, "#e6b94a");
    b.box(0, 0.54, 0, 0.66, 0.07, 0.42, "#e6b94a");
    b.cyl(0, 1.84, 0, 0.37, 0.36, 0.16, "#f4eee0", 12);
    b.sphere(0, 1.9, 0.34, 0.04, 0.05, 0.02, "#e6b94a", 5, 0.4);
  });
  addOutfit("era_medieval", { n: "زي فرسان القلعة", e: "🏰", price: 210, kind: "outfit", style: "era_medieval", c1: "#6a3028", c2: "#3b3e46", cat: "trad", gender: null, speed: 1.02, note: "سترة مخملية ودرع خفيف بحزام جلدي" }, (b, o) => {
    b.box(0, 0.62, 0.2, 0.52, 0.52, 0.08, "#9aa3ad");
    b.box(0, 0.2, -0.22, 0.76, 1.05, 0.05, "#6a3028");
    b.box(0, 0.42, 0, 0.68, 0.09, 0.44, "#4b301c");
    b.sphere(0, 0.42, 0.24, 0.05, 0.05, 0.03, "#d4af37", 5);
  });
  addOutfit("era_renaissance", { n: "رداء عصر النهضة", e: "🎨", price: 250, kind: "outfit", style: "era_renaissance", c1: "#4a2559", c2: "#261530", cat: "fancy", gender: null, speed: 1.05, note: "سترة مخملية فاخرة بياقة مطوية وريشة" }, (b, o) => {
    b.cyl(0, 0.0, 0, 0.62, 0.34, 0.78, o.topC, 14);
    b.cyl(0, 1.18, 0, 0.3, 0.32, 0.09, "#f8f5ef", 12);
    b.box(0, 0.66, 0.2, 0.12, 0.62, 0.02, "#e6b94a");
    b.cyl(0, 1.86, 0, 0.39, 0.36, 0.12, "#2f173c", 10);
    b.box(0.24, 2.02, -0.05, 0.04, 0.26, 0.08, "#ff6b6b");
  });

  /* ---------- 2. الدواب والمركبات التاريخية ---------- */
  H.MOUNTS = {
    camel: { id: "camel", n: "جمل القوافل", e: "🐪", price: 140, speed: 1.78, caravanCap: 4, note: "أصيل وصبور على طرق الصحراء والقوافل (+78% سرعة خارج المباني)" },
    carriage: { id: "carriage", n: "عربة الخيول الملكية", e: "🐎", price: 320, speed: 2.08, caravanCap: 8, note: "عربة خشبية مزخرفة يجرها جواد (+108% سرعة وتضاعف هيبة التجول)" }
  };

  /* ---------- 3. المواد الخام والمهن التاريخية العشر (مع سلاسل إنتاج وأسعار متغيرة) ---------- */
  H.MATS = {
    iron_ore: { n: "خام الحديد", e: "🪨", price: 8, era: "medieval" },
    copper: { n: "سبائك النحاس", e: "🥉", price: 7, era: "ancient" },
    cedar_wood: { n: "خشب الأرز", e: "🪵", price: 6, era: "ancient" },
    stone_block: { n: "حجر منقوش", e: "🧱", price: 5, era: "classical" },
    raw_clay: { n: "طين الفخار", e: "🟤", price: 4, era: "ancient" },
    silk_thread: { n: "خيوط الحرير", e: "🧵", price: 11, era: "islamic" },
    wool: { n: "صوف مغزول", e: "🧶", price: 5, era: "medieval" },
    gold_dust: { n: "تبر الذهب", e: "✨", price: 24, era: "renaissance" },
    lapis_gem: { n: "حجر اللازورد", e: "💠", price: 20, era: "islamic" },
    frankincense: { n: "بخور ولبان", e: "🪔", price: 9, era: "islamic" },
    saffron: { n: "زعفران", e: "🌺", price: 12, era: "islamic" },
    rosewater: { n: "ماء ورد دمشقي", e: "🌹", price: 8, era: "islamic" },
    leather: { n: "جلد مدبوغ", e: "🦌", price: 9, era: "medieval" },
    ancient_ink: { n: "حبر وورق البردي", e: "📜", price: 10, era: "classical" }
  };

  H.PROFS = {
    blacksmith: {
      id: "blacksmith", n: "الحداد", e: "⚒️", building: "السوق التاريخي", era: "medieval", desc: "صهر المعادن وصناعة الأدوات والمصابيح النحاسية والحديدية.",
      recipes: [
        { id: "c_lantern", n: "فانوس نحاسي مزخرف", e: "🏮", era: "islamic", price: 32, mats: { copper: 2, iron_ore: 1 }, xp: 12 },
        { id: "c_compass", n: "إبرة بوصلة ملاحية", e: "🧭", era: "islamic", price: 46, mats: { copper: 2, iron_ore: 2 }, xp: 16 },
        { id: "c_anvil_art", n: "تاج بوابة حديدي", e: "⛩️", era: "medieval", price: 62, mats: { iron_ore: 3, stone_block: 1 }, xp: 20 }
      ]
    },
    carpenter: {
      id: "carpenter", n: "النجار", e: "🪚", building: "ورش السوق", era: "islamic", desc: "نحت المشربيات والأثاث التاريخي وصناديق القوافل.",
      recipes: [
        { id: "c_mashrabiya", n: "شباك مشربية منقوش", e: "🪟", era: "islamic", price: 36, mats: { cedar_wood: 3 }, xp: 12 },
        { id: "c_chest", n: "صندوق قوافل مطعّم", e: "🧰", era: "medieval", price: 48, mats: { cedar_wood: 2, copper: 2 }, xp: 16 },
        { id: "c_lute", n: "عود شرقي أصيل", e: "🪕", era: "islamic", price: 68, mats: { cedar_wood: 3, silk_thread: 1 }, xp: 22 }
      ]
    },
    baker: {
      id: "baker", n: "الخباز", e: "🥖", building: "فرن القرية التاريخية", era: "ancient", desc: "خبز الطابون التاريخي والكعك الملكي بالتوابل والقمح.",
      recipes: [
        { id: "c_royal_bread", n: "خبز الطابون بالزعفران", e: "🫓", era: "islamic", price: 24, mats: { saffron: 1, rosewater: 1 }, xp: 10 },
        { id: "c_spice_cake", n: "كعك القوافل بالعسل", e: "🍯", era: "ancient", price: 34, mats: { saffron: 1, frankincense: 1, wool: 1 }, xp: 14 },
        { id: "c_feast_tray", n: "صينية ولائم القصر", e: "🍲", era: "renaissance", price: 58, mats: { saffron: 2, rosewater: 2 }, xp: 18 }
      ]
    },
    potter: {
      id: "potter", n: "صانع الفخار", e: "🏺", building: "مشغل الفخار", era: "ancient", desc: "تشكيل الأباريق الفخارية والخزف المزجج باللازورد.",
      recipes: [
        { id: "c_amphora", n: "جرة زيت أثرية", e: "🏺", era: "classical", price: 26, mats: { raw_clay: 3 }, xp: 10 },
        { id: "c_glazed_vase", n: "مزهرية خزف فيروزية", e: "⚱️", era: "islamic", price: 52, mats: { raw_clay: 2, lapis_gem: 1 }, xp: 18 },
        { id: "c_mosaic_tile", n: "لوحة قيشاني ذهبية", e: "💠", era: "islamic", price: 78, mats: { raw_clay: 2, lapis_gem: 1, gold_dust: 1 }, xp: 24 }
      ]
    },
    weaver: {
      id: "weaver", n: "النساج", e: "🧶", building: "سوق القماش", era: "islamic", desc: "حياكة السجاد الدمشقي والعباءات الملكية والأشرعة.",
      recipes: [
        { id: "c_tapestry", n: "بساط حائط منقوش", e: "🪄", era: "medieval", price: 42, mats: { wool: 3, silk_thread: 1 }, xp: 14 },
        { id: "c_damask_robe", n: "عباءة حرير دمشقية", e: "👘", era: "islamic", price: 72, mats: { silk_thread: 3, gold_dust: 1 }, xp: 22 },
        { id: "c_royal_sail", n: "شراع سفينة مطرز", e: "⛵", era: "classical", price: 54, mats: { wool: 2, silk_thread: 2, cedar_wood: 1 }, xp: 18 }
      ]
    },
    jeweler: {
      id: "jeweler", n: "صانع المجوهرات", e: "💎", building: "جناح الصاغة", era: "renaissance", desc: "صياغة الخواتم المرصعة والتيجان والساعات الفلكية.",
      recipes: [
        { id: "c_lapis_ring", n: "خاتم لازورد وذهب", e: "💍", era: "islamic", price: 86, mats: { gold_dust: 1, lapis_gem: 2 }, xp: 24 },
        { id: "c_sun_medallion", n: "قلادة الشمس الذهبية", e: "🥇", era: "ancient", price: 94, mats: { gold_dust: 2, copper: 2 }, xp: 26 },
        { id: "c_astrolabe_gold", n: "إسطرلاب مذهب", e: "🔭", era: "renaissance", price: 118, mats: { gold_dust: 2, copper: 2, lapis_gem: 1 }, xp: 30 }
      ]
    },
    perfumer: {
      id: "perfumer", n: "العطار", e: "🧴", building: "سوق العطارين", era: "islamic", desc: "تقطير العطور الملكية ومزج البخور والزعفران.",
      recipes: [
        { id: "c_oud_bottle", n: "قارورة عطر العود", e: "🧴", era: "islamic", price: 40, mats: { rosewater: 2, frankincense: 2 }, xp: 14 },
        { id: "c_palace_incense", n: "مبخرة قصر السلطان", e: "🪔", era: "islamic", price: 56, mats: { frankincense: 2, saffron: 1, copper: 1 }, xp: 18 },
        { id: "c_elixir", n: "إكسير الورد والزعفران", e: "🧪", era: "renaissance", price: 64, mats: { rosewater: 2, saffron: 2 }, xp: 20 }
      ]
    },
    armorer: {
      id: "armorer", n: "صانع الأسلحة والأدوات التاريخية", e: "🛡️", building: "القلعة العسكرية", era: "medieval", desc: "صناعة الدروع الاحتفالية والسيوف الدمشقية وأدوات الحرس.",
      recipes: [
        { id: "c_shield", n: "ترس فارس منقوش", e: "🛡️", era: "medieval", price: 66, mats: { iron_ore: 3, leather: 2 }, xp: 20 },
        { id: "c_damascus_sword", n: "سيف دمشقي مزخرف", e: "⚔️", era: "islamic", price: 96, mats: { iron_ore: 3, gold_dust: 1, leather: 1 }, xp: 28 },
        { id: "c_watch_horn", n: "بوق برج المراقبة", e: "📯", era: "medieval", price: 48, mats: { copper: 2, leather: 2 }, xp: 15 }
      ]
    },
    merchant: {
      id: "merchant", n: "التاجر", e: "⚖️", building: "خان القوافل", era: "islamic", desc: "تجهيز رزم التوابل والمخطوطات وتسيير القوافل والسفن.",
      recipes: [
        { id: "c_spice_pack", n: "رزمة توابل وبخور", e: "🎒", era: "islamic", price: 50, mats: { saffron: 2, frankincense: 2, leather: 1 }, xp: 16 },
        { id: "c_scroll_folio", n: "مخطوطة تجارية مذهبة", e: "📜", era: "classical", price: 58, mats: { ancient_ink: 2, gold_dust: 1 }, xp: 18 },
        { id: "c_trade_ledger", n: "سجل الميناء الكبير", e: "📒", era: "renaissance", price: 76, mats: { ancient_ink: 2, leather: 2, silk_thread: 1 }, xp: 22 }
      ]
    },
    farmer: {
      id: "farmer", n: "المزارع التاريخي", e: "🌾", building: "القرية الزراعية والناعورة", era: "ancient", desc: "عصر زيتون التراث وتجفيف القمح وبناء أنظمة الري التقليدية.",
      recipes: [
        { id: "c_olive_oil", n: "جرة زيت زيتون بكر", e: "🫒", era: "classical", price: 32, mats: { raw_clay: 1, rosewater: 1, stone_block: 1 }, xp: 12 },
        { id: "c_noria_gear", n: "ترس خشبي للناعورة", e: "⚙️", era: "islamic", price: 46, mats: { cedar_wood: 3, iron_ore: 1 }, xp: 16 },
        { id: "c_garden_urn", n: "حوض سقاية حجري", e: "⛲", era: "classical", price: 52, mats: { stone_block: 3, raw_clay: 1 }, xp: 17 }
      ]
    }
  };
  H.CRAFT_BY_ID = {};
  Object.values(H.PROFS).forEach((p) => p.recipes.forEach((r) => { r.prof = p.id; H.CRAFT_BY_ID[r.id] = r; }));

  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  H.dayOf = (t) => Math.floor(((t || Date.now()) + 3 * 3600000) / 86400000);
  H.marketMul = (id, day) => {
    const d = day != null ? day : H.dayOf();
    const n = (hash("mkt:" + id + ":" + d) % 1000) / 1000;
    return +(0.78 + n * 0.54).toFixed(2); // بين 0.78x و 1.32x
  };
  H.craftPrice = (id, day) => {
    const r = H.CRAFT_BY_ID[id];
    if (!r) return 0;
    return Math.max(5, Math.round(r.price * H.marketMul(id, day)));
  };

  /* ---------- 4. نظام الآثار والتنقيب والألغاز والمتحف ---------- */
  H.DIG_TOOLS = {
    brush: { id: "brush", n: "فرشاة التنقيب الدقيقة", e: "🖌️", price: 25, uses: 8, note: "ممتازة للمخطوطات والعملات والفسيفساء" },
    pickaxe: { id: "pickaxe", n: "معول أثري", e: "⛏️", price: 55, uses: 10, note: "للحفر في الأنقاض الحجرية والمقابر الصخرية" },
    sieve: { id: "sieve", n: "غربال الرمل الذهبي", e: "🧺", price: 40, uses: 10, note: "يستخرج العملات والأختام الدقيقة من الرمال" },
    astrolabe: { id: "astrolabe", n: "إسطرلاب المواقع", e: "🧭", price: 90, uses: 12, note: "يرفع فرصة العثور على آثار نادرة وأسطورية (+35%)" }
  };

  H.SITES = {
    site_ancient_obelisk: { id: "site_ancient_obelisk", n: "موقع مسلّة الشمس", e: "🪨", era: "ancient", x: 132, z: -512, tool: "pickaxe", puzzle: "pz_obelisk", desc: "أنقاض رملية تعود للعصر القديم تحيط بمسلّة شامخة." },
    site_ancient_tomb: { id: "site_ancient_tomb", n: "وادي المقابر القديمة", e: "⚱️", era: "ancient", x: 175, z: -555, tool: "pickaxe", puzzle: "pz_tomb", desc: "غرف صخرية محفورة تضم أختام الملوك الأوائل." },
    site_classical_odeion: { id: "site_classical_odeion", n: "المدرج الكلاسيكي الغربي", e: "🏛️", era: "classical", x: -245, z: -540, tool: "brush", puzzle: "pz_odeion", desc: "أرضية رخامية وأعمدة أيونية مطمورة جزئياً بالرمال." },
    site_classical_vault: { id: "site_classical_vault", n: "خزانة الميناء الغارقة", e: "🪙", era: "classical", x: -292, z: -582, tool: "sieve", puzzle: "pz_vault", desc: "بقايا مستودع بحري قديم يحوي عملات ومجوهرات متناثرة." },
    site_islamic_observatory: { id: "site_islamic_observatory", n: "مرصد النجوم التاريخي", e: "🔭", era: "islamic", x: 58, z: -458, tool: "astrolabe", puzzle: "pz_observatory", desc: "منصة فلكية مكسوة باللازورد تعود للعصر الذهبي." },
    site_citadel_cache: { id: "site_citadel_cache", n: "مخبأ أسوار القلعة", e: "🏰", era: "medieval", x: 292, z: -348, tool: "pickaxe", puzzle: "pz_citadel", desc: "قبو حجري مخفي قرب برج المراقبة الشرقي في الجبل." }
  };

  const R_LABEL = (H.RARITY = {
    common: { n: "عادي", c: "#6b7280", mul: 1 },
    rare: { n: "نادر", c: "#2563eb", mul: 1.8 },
    epic: { n: "ملحمي", c: "#7c3aed", mul: 2.8 },
    legendary: { n: "أسطوري", c: "#d97706", mul: 4.5 }
  });
  void R_LABEL;

  H.ARTIFACTS = {
    art_clay_seal: { id: "art_clay_seal", n: "ختم طيني ملكي", e: "🏺", era: "ancient", rarity: "common", site: "site_ancient_obelisk", model: "tablet", restoreCoins: 18, restoreMats: { raw_clay: 1 }, income: 5, desc: "لوح طيني خُتم بالكتابة المسمارية لتوثيق قوافل القمح الأولى." },
    art_sun_coin: { id: "art_sun_coin", n: "عملة قرص الشمس", e: "🪙", era: "ancient", rarity: "rare", site: "site_ancient_obelisk", model: "coin", restoreCoins: 28, restoreMats: { copper: 1 }, income: 9, desc: "عملة برونزية قديمة نُقش عليها قرص الشمس وأجنحة النسر." },
    art_mini_obelisk: { id: "art_mini_obelisk", n: "نموذج مسلّة بازلتية", e: "🗿", era: "ancient", rarity: "epic", site: "site_ancient_obelisk", model: "obelisk", restoreCoins: 45, restoreMats: { stone_block: 2 }, income: 16, desc: "مسلّة مصغرة كانت تُوضع في المعابد لتخليد انتصارات البنائين." },
    art_pharaoh_crown: { id: "art_pharaoh_crown", n: "تاج الشمس الفرعوني", e: "👑", era: "ancient", rarity: "legendary", site: "site_ancient_tomb", model: "crown", restoreCoins: 85, restoreMats: { gold_dust: 2, lapis_gem: 1 }, income: 32, desc: "تاج احتفالي مطعّم باللازورد والذهب عُثر عليه في الغرفة الملكية المغلقة." },
    art_scarab_amulet: { id: "art_scarab_amulet", n: "تميمة الجعران اللازوردي", e: "🪲", era: "ancient", rarity: "rare", site: "site_ancient_tomb", model: "mosaic", restoreCoins: 30, restoreMats: { lapis_gem: 1 }, income: 10, desc: "قطعة من الحجر الكريم الأزرق يرمز للبدايات الجديدة." },
    art_papyrus_hymn: { id: "art_papyrus_hymn", n: "بردية نشيد النهر", e: "📜", era: "ancient", rarity: "common", site: "site_ancient_tomb", model: "scroll", restoreCoins: 20, restoreMats: { ancient_ink: 1 }, income: 6, desc: "لفافة بردي محفوظة تحكي طقوس الزراعة ومواسم الفيضان." },
    art_ionic_capital: { id: "art_ionic_capital", n: "تاج عمود رخامي", e: "🏛️", era: "classical", rarity: "common", site: "site_classical_odeion", model: "amphora", restoreCoins: 22, restoreMats: { stone_block: 1 }, income: 6, desc: "جزء منحوت بدقة من أعلى عمود كلاسيكي بزخرفة لولبية." },
    art_mosaic_owl: { id: "art_mosaic_owl", n: "لوحة فسيفساء الحكمة", e: "🦉", era: "classical", rarity: "rare", site: "site_classical_odeion", model: "mosaic", restoreCoins: 36, restoreMats: { stone_block: 1, lapis_gem: 1 }, income: 12, desc: "فسيفساء ملونة بدقة عالية كانت تزين أرضية المسرح الكلاسيكي." },
    art_bronze_bust: { id: "art_bronze_bust", n: "تمثال الفيلسوف البرونزي", e: "🗿", era: "classical", rarity: "epic", site: "site_classical_odeion", model: "bust", restoreCoins: 52, restoreMats: { copper: 2, stone_block: 1 }, income: 18, desc: "نحت برونزي متقن لأحد علماء الهندسة والموسيقى في العصر الكلاسيكي." },
    art_silver_drachma: { id: "art_silver_drachma", n: "كنز الدراخمات الفضية", e: "🪙", era: "classical", rarity: "common", site: "site_classical_vault", model: "coin", restoreCoins: 20, restoreMats: { copper: 1 }, income: 6, desc: "عملات تداولها البحارة والتجار بين الموانئ الشرقية والمتوسطية." },
    art_amphora_sunken: { id: "art_amphora_sunken", n: "جرة الميناء المختومة", e: "🏺", era: "classical", rarity: "rare", site: "site_classical_vault", model: "amphora", restoreCoins: 34, restoreMats: { raw_clay: 2 }, income: 11, desc: "جرة بحرية مدببة القاع كانت مخصصة لحفظ الزيت والبهارات على السفن." },
    art_atlas_globe: { id: "art_atlas_globe", n: "كرة البحارة النحاسية", e: "🌐", era: "classical", rarity: "legendary", site: "site_classical_vault", model: "astrolabe", restoreCoins: 80, restoreMats: { copper: 2, gold_dust: 1 }, income: 30, desc: "أداة ملاحية فلكية نادرة نُقشت عليها خريطة النجوم وممرات البحار." },
    art_aljazari_lamp: { id: "art_aljazari_lamp", n: "مصباح الجزري الهندسي", e: "🪔", era: "islamic", rarity: "rare", site: "site_islamic_observatory", model: "lamp", restoreCoins: 38, restoreMats: { copper: 2 }, income: 12, desc: "مصباح نحاسي ميكانيكي يوازن تدفق الزيت تلقائياً في ليالي العلم." },
    art_astrolabe_brass: { id: "art_astrolabe_brass", n: "إسطرلاب بيت الحكمة", e: "🧭", era: "islamic", rarity: "epic", site: "site_islamic_observatory", model: "astrolabe", restoreCoins: 56, restoreMats: { copper: 2, gold_dust: 1 }, income: 20, desc: "إسطرلاب دقيق بصفائح كواكبية صُنع في العصر الذهبي لقياس ارتفاع النجوم." },
    art_star_manuscript: { id: "art_star_manuscript", n: "مخطوطة الكواكب الثابتة", e: "📖", era: "islamic", rarity: "legendary", site: "site_islamic_observatory", model: "scroll", restoreCoins: 92, restoreMats: { ancient_ink: 2, gold_dust: 1, lapis_gem: 1 }, income: 35, desc: "مخطوطة مذهبة باللازورد تصف الأبراج السماوية والرباعيات الفلكية." },
    art_castle_banner: { id: "art_castle_banner", n: "راية برج الحراسة", e: "🚩", era: "medieval", rarity: "common", site: "site_citadel_cache", model: "tablet", restoreCoins: 22, restoreMats: { wool: 2 }, income: 7, desc: "نسيج صوفي عتيق يحمل شعار حامية الجبل." },
    art_damascus_blade: { id: "art_damascus_blade", n: "نصل فولاذ دمشقي أثري", e: "⚔️", era: "medieval", rarity: "epic", site: "site_citadel_cache", model: "sword", restoreCoins: 60, restoreMats: { iron_ore: 3, leather: 1 }, income: 21, desc: "سيف متموج النصل اشتهر بقوته الفائقة وخطوط الفضة المحفورة عليه." },
    art_renaissance_clock: { id: "art_renaissance_clock", n: "ساعة النهضة الفلكية", e: "🕰️", era: "renaissance", rarity: "legendary", site: "site_citadel_cache", model: "compass", restoreCoins: 98, restoreMats: { gold_dust: 2, copper: 2 }, income: 38, desc: "تحفة ميكانيكية من عصر النهضة تقيس الساعات وأطوار القمر." }
  };

  H.PUZZLES = {
    pz_obelisk: { id: "pz_obelisk", n: "لغز المسلّة القديمة", e: "🗿", site: "site_ancient_obelisk", era: "ancient", q: "أقف بلا صوت وأشير إلى السماء، يقيس ظلي ساعات النهار منذ آلاف السنين. فما أنا؟", opts: ["المسلّة الشمسية", "جسر الميناء", "السيف الدمشقي", "الناعورة"], ans: 0, rewardCoins: 45, rewardArt: "art_mini_obelisk" },
    pz_tomb: { id: "pz_tomb", n: "شيفرة الغرفة الملكية", e: "⚱️", site: "site_ancient_tomb", era: "ancient", q: "رتّب رموز الخلود الحجرية: الشمس (☀️) تسبق الماء (💧)، والماء يسبق السنابل (🌾). أي تسلسل يفتح الباب؟", opts: ["💧 ← ☀️ ← 🌾", "☀️ ← 💧 ← 🌾", "🌾 ← ☀️ ← 💧", "💧 ← 🌾 ← ☀️"], ans: 1, rewardCoins: 65, rewardArt: "art_pharaoh_crown" },
    pz_odeion: { id: "pz_odeion", n: "أحجية المدرج الكلاسيكي", e: "🏛️", site: "site_classical_odeion", era: "classical", q: "طائر ارتبط بمدينة أثينا والحكمة الكلاسيكية وظهر على قطع الفسيفساء والعملات الفضية:", opts: ["البومة", "الصقر", "الجمل", "الدلفين"], ans: 0, rewardCoins: 50, rewardArt: "art_bronze_bust" },
    pz_vault: { id: "pz_vault", n: "لغز قفل الخزانة الغارقة", e: "⚓", site: "site_classical_vault", era: "classical", q: "ما الجرة ذات المقبضين والقاع المدبب التي استُخدمت لنقل الزيت في السفن الكلاسيكية؟", opts: ["الأمفورا", "المشربية", "الإسطرلاب", "المبخرة"], ans: 0, rewardCoins: 55, rewardArt: "art_atlas_globe" },
    pz_observatory: { id: "pz_observatory", n: "لغز القبة الفلكية", e: "🔭", site: "site_islamic_observatory", era: "islamic", q: "آلة دائرية برع علماء العصر الذهبي في تطويرها لتحديد ارتفاع النجوم والاتجاهات:", opts: ["الإسطرلاب", "المنجل", "الناعورة", "الدلو"], ans: 0, rewardCoins: 70, rewardArt: "art_star_manuscript" },
    pz_citadel: { id: "pz_citadel", n: "شيفرة قبو القلعة", e: "🏰", site: "site_citadel_cache", era: "medieval", q: "معدن تميزت به السيوف الأثرية في بلاد الشام بنقوشه المتموجة وصلابته النادرة:", opts: ["الفولاذ الدمشقي", "القصدير", "الطين المحروق", "المرمر"], ans: 0, rewardCoins: 75, rewardArt: "art_renaissance_clock" }
  };

  /* ---------- 5. الشخصيات التاريخية الحية (روتين يومي + منازل + مهن + مهام) ---------- */
  H.NPCS = [
    {
      id: "hn_tariq", name: "المعلّم طارق (الحداد)", emoji: "⚒️", era: "islamic", homeName: "ورشة الحدادة",
      pos: [-48, -264], roam: [-48, -264, 5], speed: 1.4,
      look: { gender: "boy", color: "#5c4033", hair: "#2b1d14", outfit: "era_medieval", apron: "#3b2c26", mustache: true },
      schedules: { morning: [-48, -264], noon: [-48, -264], evening: [-18, -278], night: [-68, -236] },
      lines: ["المطرقة والسندان يغنيان مع الفجر ⚒️", "النحاس والحديد أساس كل حضارة صامدة", "أحضروا لي خام الحديد وسأعلمكم أسرار الصياغة!"],
      quest: { id: "q_tariq", title: "عدة الحداد", desc: "أحضر 3 من خام الحديد لتجهيز مصابيح السوق", needMat: "iron_ore", qty: 3, coins: 48, bonusMat: "copper", bonusQty: 2 },
      act: "hist:craft:blacksmith"
    },
    {
      id: "hn_yasmin", name: "ياسمين (صانعة الفخار)", emoji: "🏺", era: "ancient", homeName: "مشغل الخزف",
      pos: [-64, -296], roam: [-64, -296, 5], speed: 1.35,
      look: { gender: "girl", color: "#1d8a7e", hair: "#2a1d12", hairStyle: "hijab", outfit: "era_islamic" },
      schedules: { morning: [-64, -296], noon: [-64, -296], evening: [-28, -286], night: [-88, -242] },
      lines: ["الطين بين اليدين يحفظ ذاكرة الأرض 🏺", "اللازورد يعطي الخزف لون السماء الصافية", "تستطيعان تشكيل الفخار معاً لزيادة الإنتاج!"],
      quest: { id: "q_yasmin", title: "طين النهر الصافي", desc: "أحضر 4 من طين الفخار لصناعة جرار القافلة", needMat: "raw_clay", qty: 4, coins: 38, bonusMat: "lapis_gem", bonusQty: 1 },
      act: "hist:craft:potter"
    },
    {
      id: "hn_ibrahim", name: "الشيخ إبراهيم (العلّامة)", emoji: "📚", era: "islamic", homeName: "بيت الحكمة",
      pos: [52, -315], roam: [52, -315, 4], speed: 1.15,
      look: { gender: "boy", color: "#185e58", hair: "#e0e0e0", hairStyle: "keffiyeh", outfit: "era_islamic", elder: true, cane: true, mustache: true },
      schedules: { morning: [52, -315], noon: [0, -280], evening: [52, -315], night: [72, -334] },
      lines: ["بيت الحكمة يفتح أبوابه لكل طالب علم ومنقّب 📖", "الألغاز في المواقع الأثرية لا تفتح إلا بالعقل الهادئ", "كل قطعة ترممونها تُنير فصلاً جديداً في متحفكم الخاص!"],
      quest: { id: "q_ibrahim", title: "مخطوطات السماء", desc: "اجمعوا 2 من حبر وورق البردي لبيت الحكمة", needMat: "ancient_ink", qty: 2, coins: 52, bonusMat: "gold_dust", bonusQty: 1 },
      act: "hist:in:hist_library"
    },
    {
      id: "hn_noor", name: "نور الهدى (النسّاجة)", emoji: "🧶", era: "islamic", homeName: "سوق القماش",
      pos: [32, -252], roam: [32, -252, 5], speed: 1.4,
      look: { gender: "girl", color: "#9b5de5", hair: "#3b2a20", hairStyle: "hijab", outfit: "era_renaissance" },
      schedules: { morning: [32, -252], noon: [32, -252], evening: [4, -274], night: [-78, -326] },
      lines: ["خيوط الحرير تصلنا مع القوافل من أقاصي الشرق 🧵", "كل نقشة في السجاد تحكي قصة بيت عتيق"],
      quest: { id: "q_noor", title: "نول الحرير", desc: "وفّر 3 من الصوف المغزول لإكمال بساط القصر", needMat: "wool", qty: 3, coins: 40, bonusMat: "silk_thread", bonusQty: 2 },
      act: "hist:craft:weaver"
    },
    {
      id: "hn_zahra", name: "زهرة (العطّارة)", emoji: "🌹", era: "islamic", homeName: "دكان العطارة",
      pos: [-32, -252], roam: [-32, -252, 5], speed: 1.4,
      look: { gender: "girl", color: "#c0566b", hair: "#2b1d14", hairStyle: "long", outfit: "era_islamic" },
      schedules: { morning: [-32, -252], noon: [-32, -252], evening: [-14, -280], night: [68, -242] },
      lines: ["روائح اللبان والزعفران وماء الورد تملأ السوق 🌺", "القوافل تتسابق على عطر الدار كل صباح!"],
      quest: { id: "q_zahra", title: "قطاف الورد", desc: "أحضر 3 من ماء الورد الدمشقي لتحضير البخور", needMat: "rosewater", qty: 3, coins: 46, bonusMat: "saffron", bonusQty: 1 },
      act: "hist:craft:perfumer"
    },
    {
      id: "hn_mansour", name: "القائد منصور (حارس القلعة)", emoji: "🛡️", era: "medieval", homeName: "القلعة الجبلية",
      pos: [275, -285], roam: [275, -285, 8], speed: 1.6,
      look: { gender: "boy", color: "#6a3028", hair: "#2b1d14", outfit: "era_medieval", mustache: true },
      schedules: { morning: [275, -285], noon: [132, -280], evening: [275, -285], night: [275, -270] },
      lines: ["أسوار دار السلام وأبراج الجبل في أمان تام 🛡️", "احذروا عند التنقيب في قبو القلعة؛ الشيفرات قديمة ودقيقة."],
      quest: { id: "q_mansour", title: "عتاد الحراسة", desc: "أحضر 3 من الجلد المدبوغ لصيانة دروع الحامية", needMat: "leather", qty: 3, coins: 50, bonusMat: "iron_ore", bonusQty: 2 },
      act: "hist:in:hist_citadel"
    },
    {
      id: "hn_sinbad", name: "الربان بحّار (الميناء)", emoji: "⛵", era: "classical", homeName: "الميناء التجاري",
      pos: [-320, -326], roam: [-320, -326, 7], speed: 1.5,
      look: { gender: "boy", color: "#2a6f9f", hair: "#4a3728", outfit: "era_classical", mustache: true },
      schedules: { morning: [-320, -326], noon: [-345, -340], evening: [-310, -310], night: [-295, -305] },
      lines: ["الأشرعة جاهزة للإبحار عبر البحار التجارية ⛵", "الميناء القديم يستقبل البضائع ويعود بأرباح وفيرة!"],
      quest: { id: "q_sinbad", title: "أخشاب السفن", desc: "أحضر 4 من خشب الأرز لإصلاح أشرعة الداو", needMat: "cedar_wood", qty: 4, coins: 54, bonusMat: "lapis_gem", bonusQty: 1 },
      act: "hist:port"
    },
    {
      id: "hn_sulaiman", name: "دليل القوافل سليمان", emoji: "🐪", era: "islamic", homeName: "خان القوافل",
      pos: [-80, -496], roam: [-80, -496, 8], speed: 1.5,
      look: { gender: "boy", color: "#b68036", hair: "#1b1b1b", hairStyle: "keffiyeh", outfit: "era_islamic", mustache: true },
      schedules: { morning: [-80, -496], noon: [0, -388], evening: [-80, -496], night: [-88, -518] },
      lines: ["الواحة وخان القوافل استراحة المسافرين منذ قرون 🐪", "حمّلوا بضائع الحرفيين في قافلة الجمال لربح كبير!"],
      quest: { id: "q_sulaiman", title: "زواد القافلة", desc: "أحضر 2 من البخور واللبان لرحلة الواحة الكبرى", needMat: "frankincense", qty: 2, coins: 44, bonusMat: "gold_dust", bonusQty: 1 },
      act: "hist:in:hist_khan"
    },
    {
      id: "hn_umm_salma", name: "أم سلمى (الخبازة)", emoji: "🫓", era: "ancient", homeName: "قرية المزارع والناعورة",
      pos: [-226, -196], roam: [-226, -196, 6], speed: 1.3,
      look: { gender: "girl", color: "#d49b38", hair: "#d8d8d8", hairStyle: "hijab", outfit: "era_ancient", elder: true },
      schedules: { morning: [-226, -196], noon: [-204, -214], evening: [-226, -196], night: [-236, -184] },
      lines: ["صوت الناعورة يدور ويسقي حقول القمح والزيتون 🌾", "رائحة خبز الطابون الساخن ترحب بكل زائر!"],
      quest: { id: "q_salma", title: "ذهب السنابل", desc: "أحضر 2 من الزعفران لتتبيل خبز المهرجان", needMat: "saffron", qty: 2, coins: 45, bonusMat: "rosewater", bonusQty: 2 },
      act: "hist:craft:baker"
    },
    {
      id: "hn_layth", name: "الأمير ليث (قصر الحاكم)", emoji: "👑", era: "renaissance", homeName: "قصر الحاكم",
      pos: [0, -342], roam: [0, -342, 4], speed: 1.25,
      look: { gender: "boy", color: "#4a2559", hair: "#1b1b1b", outfit: "era_renaissance", acc: ["goldcrown"], mustache: true },
      schedules: { morning: [0, -342], noon: [0, -286], evening: [0, -342], night: [0, -352] },
      lines: ["دار السلام تزدهر بالعلم والحرف والتجارة والآثار 👑", "ساهما معاً في بناء المعالم التاريخية لرفع مجد المدينة!"],
      quest: { id: "q_layth", title: "ترميم الصرح", desc: "قدّم 4 من الحجر المنقوش لصيانة القصر", needMat: "stone_block", qty: 4, coins: 50, bonusMat: "gold_dust", bonusQty: 1 },
      act: "hist:in:hist_palace"
    },
    {
      id: "hn_nadia", name: "نادية (أمينة المتحف)", emoji: "🏛️", era: "renaissance", homeName: "المتحف الخاص",
      pos: [-58, -322], roam: [-58, -322, 4], speed: 1.3,
      look: { gender: "girl", color: "#1d8a7e", hair: "#2b1d14", hairStyle: "bun", outfit: "era_classical" },
      schedules: { morning: [-58, -322], noon: [-58, -322], evening: [10, -295], night: [-58, -322] },
      lines: ["كل أثر تُرممونه وتعرضونه هنا يدرّ دخلاً ثقافياً يومياً 🏛️", "المتحف يعكس رحلتكما المشتركة عبر العصور!"],
      quest: { id: "q_nadia", title: "أدوات الترميم", desc: "وفّري 2 من سبائك النحاس لتجهيز قواعد العرض", needMat: "copper", qty: 2, coins: 42, bonusMat: "ancient_ink", bonusQty: 2 },
      act: "hist:in:hist_museum"
    },
    {
      id: "hn_faris", name: "الرحّالة فارس (المنقّب)", emoji: "🧭", era: "classical", homeName: "مواقع التنقيب",
      pos: [102, -482], roam: [102, -482, 9], speed: 1.55,
      look: { gender: "boy", color: "#a8714a", hair: "#3b2a20", outfit: "era_ancient", acc: ["straw"] },
      schedules: { morning: [102, -482], noon: [132, -512], evening: [58, -458], night: [-80, -496] },
      lines: ["الرمال تخفي تحفاً من ثلاث حضارات متتابعة ⛏️", "تذكري: لكل عصر طرازه؛ لا تخلطي بين المسلة والإسطرلاب!"],
      quest: { id: "q_faris", title: "ذهب الرمال", desc: "أحضرا 1 من تبر الذهب لدعم بعثة التنقيب", needMat: "gold_dust", qty: 1, coins: 65, bonusMat: "lapis_gem", bonusQty: 1 },
      act: "hist:arch"
    }
  ];
  H.NPCS.forEach((n) => {
    OSW.NPCS.push(n);
    OSW.NPC_BY[n.id] = n;
  });

  // شخصيات إضافية داخل المباني التاريخية
  const INPC = (id, name, emoji, look, lines, act) => (OSW.NPC_BY[id] = { id, name, emoji, look, lines, act });
  INPC("hi_palace", "الأمير ليث", "👑", H.NPCS[9].look, H.NPCS[9].lines, "hist:monuments");
  INPC("hi_library", "الشيخ إبراهيم", "📚", H.NPCS[2].look, H.NPCS[2].lines, "hist:eras");
  INPC("hi_museum", "الأمينة نادية", "🏛️", H.NPCS[10].look, H.NPCS[10].lines, "hist:museum");
  INPC("hi_hammam", "المعلّم حسّان (الحمّام)", "♨️", { gender: "boy", color: "#2a9d8f", hair: "#3b2a20", outfit: "era_islamic" }, ["المياه الساخنة والبخار المعطر بالورد تعيد النشاط ♨️", "استرخيا هنا لاستعادة الشبع والحيوية بالكامل!"], "hist:hammam");
  INPC("hi_citadel", "القائد منصور", "🛡️", H.NPCS[5].look, H.NPCS[5].lines, "hist:craft:armorer");
  INPC("hi_khan", "الدليل سليمان", "🐪", H.NPCS[7].look, H.NPCS[7].lines, "hist:caravans");
  INPC("hi_souq", "كبير التجار رشيد", "⚖️", { gender: "boy", color: "#c9702e", hair: "#1b1b1b", hairStyle: "keffiyeh", outfit: "era_islamic", mustache: true }, ["سوق دار السلام ينبض بالحرفيين والعطور والأقمشة!", "كل حرفة هنا تصنع تحفاً تُباع بالقوافل أو الميناء."], "hist:market");

  /* ---------- 6. المعالم التعاونية (للاعبين معاً) والأحداث التاريخية المتزامنة ---------- */
  H.MONUMENTS = [
    { id: "mon_dome", n: "قبة الحكمة الفيروزية", e: "🕌", era: "islamic", stages: 4, stageCoins: 45, rewardCoins: 220, desc: "مشروع معماري مشترك في ساحة دار السلام يمنح +15% لدخل المتحف." },
    { id: "mon_arch", n: "قوس القوافل العظيم", e: "⛩️", era: "classical", stages: 3, stageCoins: 40, rewardCoins: 180, desc: "بوابة نصر كلاسيكية ترفع عوائد القوافل التجارية بنسبة +15%." },
    { id: "mon_astro", n: "برج الإسطرلاب الأعظم", e: "🔭", era: "renaissance", stages: 5, stageCoins: 55, rewardCoins: 280, desc: "مرصد فلكي متطور يضاعف حظ العثور على الآثار الملحمية والأسطورية." }
  ];

  H.COOP_TOMB = { x: 162, z: -538, rewardCoins: 140, rewardArt: "art_pharaoh_crown", windowMs: 35000 };

  H.EVENTS = [
    { id: "ev_market_dawn", n: "فجر السوق العامر", e: "🌅", bonus: "أسعار بيع تحف السوق +15%", craftBonus: 1.15 },
    { id: "ev_silk_caravan", n: "وصول قافلة الحرير", e: "🐪", bonus: "خصم 20% على شراء المواد الخام", matDiscount: 0.8 },
    { id: "ev_olive_harvest", n: "موسم قطاف الزيتون", e: "🫒", bonus: "نقاط خبرة المهن ×2", xpMul: 2 },
    { id: "ev_heritage_night", n: "ليلة التراث والفوانيس", e: "🏮", bonus: "دخل المتحف والمعالم +25%", museumMul: 1.25 },
    { id: "ev_ruins_reveal", n: "انكشاف أنقاض مخبأة", e: "⛏️", bonus: "نصف مدة انتظار التنقيب وفرصة ندرة أعلى", digFast: 0.5 }
  ];
  H.activeEvent = (t) => {
    const slot = Math.floor((t || Date.now()) / (6 * 3600000)); // يتبدل كل 6 ساعات بشكل متطابق تماماً عند اللاعبين
    return H.EVENTS[hash("hev:" + slot) % H.EVENTS.length];
  };
})();
