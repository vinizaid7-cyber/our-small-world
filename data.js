/* طبقة البيانات: وضع تجريبي (عالجهاز) + وضع سحابي (Supabase) بنفس الواجهة */
(function () {
  const OSW = window.OSW;
  const { uuid } = OSW;

  function emitter() {
    const m = {};
    return {
      on(e, f) { (m[e] = m[e] || []).push(f); },
      emit(e, a) { (m[e] || []).forEach((f) => { try { f(a); } catch (err) { console.error(err); } }); },
    };
  }

  function stripMedia(db, row) {
    if (row && row.media) {
      db.mediaCache[row.id] = row.media;
      row = Object.assign({}, row, { media_count: row.media.length });
      delete row.media;
    }
    return row;
  }

  // تطبيق تغيير على الكاش المحلي
  function apply(db, table, type, row, remote) {
    if (table === "kv") {
      if (type === "DELETE") delete db.kv[row.key]; else db.kv[row.key] = row.value;
    } else {
      const list = { entries: db.entries, reactions: db.reactions, reads: db.reads, profiles: db.profiles }[table];
      if (!list) return;
      if (table === "entries" && type !== "DELETE") row = stripMedia(db, row);
      const match = table === "reads"
        ? (r) => r.entry_id === row.entry_id && r.user_id === row.user_id
        : (r) => r.id === row.id;
      const i = list.findIndex(match);
      if (type === "DELETE") { if (i > -1) list.splice(i, 1); }
      else if (i > -1) Object.assign(list[i], row);
      else list.push(row);
      if (table === "profiles") db._setMe();
    }
    db.emit("change", { table, type, row, remote: !!remote });
  }

  function friendly(err) {
    const m = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login/i.test(m)) return "الإيميل أو كلمة السر غلط";
    if (/already registered/i.test(m)) return "هالإيميل مسجّل من قبل، جرّب تسجيل الدخول";
    if (/Password should be/i.test(m)) return "كلمة السر لازم تكون 6 أحرف على الأقل";
    if (/row-level security/i.test(m)) return "هالعالم محجوز للاثنين بس 🔒";
    if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(m)) return "ما قدرت أوصل لخادم Supabase من شبكتك. ممكن يكون محجوب عندكم: جرّب بيانات الموبايل أو VPN، وافتح check.html لتشخيص المشكلة";
    return m;
  }
  OSW.friendly = friendly;

  /* ===================== الوضع السحابي ===================== */
  function cloudDB(cfg) {
    const em = emitter();
    const db = {
      mode: "cloud", profiles: [], entries: [], reactions: [], reads: [], kv: {}, sealed: [],
      presence: {}, mediaCache: {}, me: null, partner: null, uid: null, on: em.on, emit: em.emit,
    };
    let sb, chan;
    const COLS = "id,house,author,title,body,data,unlock_at,private,created_at,updated_at,media_count";
    db._setMe = () => {
      db.me = db.profiles.find((p) => p.id === db.uid) || null;
      db.partner = db.profiles.find((p) => p.id !== db.uid) || null;
    };
    const loadScript = (src) => new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => { s.remove(); rej(new Error("x")); };
      document.head.appendChild(s);
    });
    // بنجرّب نسخة محلية أول (supabase.js جنب index.html)، وبعدين عدة مصادر بديلة
    const LIBS = [
      "supabase.js",
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
      "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js",
      "https://fastly.jsdelivr.net/npm/@supabase/supabase-js@2",
      "https://gcore.jsdelivr.net/npm/@supabase/supabase-js@2",
      "https://testingcf.jsdelivr.net/npm/@supabase/supabase-js@2",
    ];
    async function loadLib() {
      for (const src of LIBS) {
        try { await loadScript(src); if (window.supabase && window.supabase.createClient) return; } catch (e) { /* التالي */ }
      }
      throw new Error("ما قدرت أحمّل مكتبة Supabase من أي مصدر (ممكن مواقع CDN محجوبة عندكم). افتح check.html لتشخيص المشكلة، أو شوف README: «لو المكتبة ما بتتحمّل».");
    }
    async function fetchAll(table, cols) {
      let out = [], from = 0;
      for (;;) {
        const { data, error } = await sb.from(table).select(cols).range(from, from + 999);
        if (error) throw error;
        out = out.concat(data);
        if (data.length < 1000) break;
        from += 1000;
      }
      return out;
    }
    async function loadProfiles() {
      const { data, error } = await sb.from("profiles").select("*");
      if (error) throw error;
      db.profiles = data || [];
      db._setMe();
    }
    async function loadAll() {
      const [entries, reactions, reads, kv] = await Promise.all([
        fetchAll("entries", COLS), fetchAll("reactions", "*"), fetchAll("reads", "*"), fetchAll("kv", "*"),
      ]);
      db.entries = entries; db.reactions = reactions; db.reads = reads;
      db.kv = {}; kv.forEach((r) => (db.kv[r.key] = r.value));
      await db.refreshSealed();
    }
    db.refreshSealed = async () => {
      const { data } = await sb.rpc("sealed_entries");
      db.sealed = data || [];
      db.emit("change", { table: "sealed", type: "SYNC" });
    };
    db.reload = async () => { await loadAll(); db.emit("change", { table: "all", type: "SYNC" }); };

    async function afterAuth(user) {
      db.uid = user.id; db.email = user.email;
      await loadProfiles();
      if (!db.me) return "onboard";
      await loadAll();
      subscribe();
      db.touchSeen();
      return "ready";
    }
    db.touchSeen = () => {
      if (!db.me) return;
      sb.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", db.uid).then(() => {});
    };
    db.start = async () => {
      await loadLib();
      sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
      const { data } = await sb.auth.getSession();
      if (!data.session) return "auth";
      return afterAuth(data.session.user);
    };
    db.signIn = async (email, password) => {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendly(error));
      return afterAuth(data.user);
    };
    db.signUp = async (email, password) => {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw new Error(friendly(error));
      if (!data.session) return "confirm";
      return afterAuth(data.user);
    };
    db.signOut = async () => { await sb.auth.signOut(); location.reload(); };
    db.createProfile = async ({ name, color, hair }) => {
      const { error } = await sb.from("profiles").insert({ id: db.uid, name, color, hair });
      if (error) throw new Error(friendly(error));
      await loadProfiles();
      await loadAll();
      subscribe();
      return "ready";
    };
    db.saveProfile = async (patch) => {
      const { error } = await sb.from("profiles").update(patch).eq("id", db.uid);
      if (error) throw new Error(friendly(error));
      apply(db, "profiles", "UPDATE", Object.assign({ id: db.uid }, patch));
    };

    function subscribe() {
      if (chan) return;
      const handle = (table) => (p) => {
        const type = p.eventType;
        const row = type === "DELETE" ? p.old : p.new;
        if (table === "entries" && type !== "DELETE") {
          // العناصر المقفلة ما بتوصل من الريل-تايم (حماية السيرفر)
        }
        apply(db, table, type, row, true);
      };
      chan = sb.channel("osw-db");
      ["entries", "reactions", "reads", "kv", "profiles"].forEach((t) =>
        chan.on("postgres_changes", { event: "*", schema: "public", table: t }, handle(t)));
      chan.subscribe();
      // حضور (مين موجود هلأ وين)
      db._pres = sb.channel("osw-presence", { config: { presence: { key: db.uid } } });
      db._pres.on("presence", { event: "sync" }, () => {
        const st = db._pres.presenceState();
        db.presence = {};
        Object.keys(st).forEach((k) => (db.presence[k] = st[k][st[k].length - 1]));
        db.emit("presence");
      }).subscribe(async (s) => {
        if (s === "SUBSCRIBED") await db._pres.track({ where: "village", name: db.me.name, t: Date.now() });
      });
      db._mv = sb.channel("osw-move", { config: { broadcast: { self: false } } });
      db._mv.on("broadcast", { event: "pos" }, (m) => db.emit("pos", m.payload)).subscribe((st) => { db._mvOk = st === "SUBSCRIBED"; });
      setInterval(() => db.touchSeen(), 120000);
    }
    db.track = (where) => { if (db._pres) db._pres.track({ where, name: db.me.name, t: Date.now() }); };
    db.sendPos = (p) => { if (db._mvOk && db._mv) db._mv.send({ type: "broadcast", event: "pos", payload: Object.assign({ u: db.uid }, p) }); };

    db.addEntry = async (e) => {
      const row = {
        house: e.house, title: e.title || null, body: e.body || null, data: e.data || {},
        media: e.media || [], unlock_at: e.unlock_at || null, private: !!e.private,
      };
      const { data, error } = await sb.from("entries").insert(row).select(COLS).single();
      if (error) throw new Error(friendly(error));
      if (row.media.length) db.mediaCache[data.id] = row.media;
      apply(db, "entries", "INSERT", data);
      return data;
    };
    db.updateEntry = async (id, patch) => {
      const { data, error } = await sb.from("entries").update(patch).eq("id", id).select(COLS).single();
      if (error) throw new Error(friendly(error));
      if (patch.media) db.mediaCache[id] = patch.media;
      apply(db, "entries", "UPDATE", data);
      return data;
    };
    db.removeEntry = async (id) => {
      const { error } = await sb.from("entries").delete().eq("id", id);
      if (error) throw new Error(friendly(error));
      await sb.from("entries").delete().eq("house", "comment").eq("data->>parent", id);
      db.entries.filter((e) => e.house === "comment" && e.data && e.data.parent === id && e.author === db.uid)
        .forEach((e) => apply(db, "entries", "DELETE", { id: e.id }));
      apply(db, "entries", "DELETE", { id });
    };
    db.getMedia = async (id) => {
      if (db.mediaCache[id]) return db.mediaCache[id];
      const { data } = await sb.from("entries").select("media").eq("id", id).single();
      db.mediaCache[id] = (data && data.media) || [];
      return db.mediaCache[id];
    };
    db.react = async (entryId, emoji) => {
      const ex = db.reactions.find((r) => r.entry_id === entryId && r.author === db.uid && r.emoji === emoji);
      if (ex) {
        apply(db, "reactions", "DELETE", ex);
        await sb.from("reactions").delete().eq("id", ex.id);
      } else {
        const { data, error } = await sb.from("reactions").insert({ entry_id: entryId, emoji }).select("*").single();
        if (error) throw new Error(friendly(error));
        apply(db, "reactions", "INSERT", data);
      }
    };
    db.markRead = async (entryId) => {
      if (db.reads.some((r) => r.entry_id === entryId && r.user_id === db.uid)) return;
      const { data } = await sb.from("reads").insert({ entry_id: entryId }).select("*").single();
      if (data) apply(db, "reads", "INSERT", data);
    };
    db.kvSet = async (key, value) => {
      apply(db, "kv", "UPDATE", { key, value });
      const { error } = await sb.from("kv").upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) console.warn("kv", error);
    };
    return db;
  }

  /* ===================== الوضع التجريبي ===================== */
  function demoDB() {
    const em = emitter();
    const KEY = "osw_demo_v1";
    const empty = () => ({ profiles: [], entries: [], reactions: [], reads: [], kv: {}, uid: null, seen: {} });
    let S;
    try { S = JSON.parse(localStorage.getItem(KEY)) || empty(); } catch (e) { S = empty(); }
    const bc = window.BroadcastChannel ? new BroadcastChannel("osw_demo") : null;
    const db = {
      mode: "demo", profiles: [], entries: [], reactions: [], reads: [], kv: {}, sealed: [],
      presence: {}, mediaCache: {}, me: null, partner: null, uid: null, on: em.on, emit: em.emit,
    };
    const visible = (e) => e.author === db.uid || (!e.private && (!e.unlock_at || new Date(e.unlock_at) <= new Date()));
    const light = (e) => { const r = Object.assign({}, e); delete r.media; r.media_count = (e.media || []).length; return r; };
    // قراءة أحدث نسخة قبل أي تعديل (عشان تابين مفتوحين ما يكتبوا فوق بعض)
    function fresh() {
      try { const L = JSON.parse(localStorage.getItem(KEY)); if (L) S = L; } catch (e) {}
      const u = sessionStorage.getItem("osw_uid"); if (u) S.uid = u;
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(S)); }
      catch (e) { throw new Error("مساحة النسخة التجريبية امتلت. اربط Supabase للتخزين الحقيقي"); }
      bc && bc.postMessage({ t: "reload", from: db.uid });
    }
    db._setMe = () => {
      db.me = db.profiles.find((p) => p.id === db.uid) || null;
      db.partner = db.profiles.find((p) => p.id !== db.uid) || null;
    };
    function refresh(remote) {
      const prev = new Set(db.entries.map((e) => e.id));
      db.uid = S.uid;
      db.profiles = S.profiles.map((p) => Object.assign({}, p, { last_seen: S.seen[p.id] }));
      db._setMe();
      db.entries = S.entries.filter(visible).map(light);
      db.reactions = S.reactions.slice(); db.reads = S.reads.slice(); db.kv = Object.assign({}, S.kv);
      db.sealed = S.entries.filter((e) => e.author !== db.uid && !e.private && e.unlock_at && new Date(e.unlock_at) > new Date())
        .map((e) => ({ id: e.id, house: e.house, author: e.author, unlock_at: e.unlock_at, created_at: e.created_at }));
      S.entries.forEach((e) => { if (e.media && e.media.length) db.mediaCache[e.id] = e.media; });
      db.emit("change", { table: "all", type: "SYNC", remote: !!remote });
      if (remote) db.entries.forEach((e) => { if (!prev.has(e.id) && e.author !== db.uid) db.emit("change", { table: "entries", type: "INSERT", row: e, remote: true, silentUI: true }); });
    }
    db.reload = async () => refresh();
    db.refreshSealed = async () => refresh();
    bc && (bc.onmessage = (m) => {
      if (m.data.t === "reload") { try { S = JSON.parse(localStorage.getItem(KEY)) || S; } catch (e) {} if (S.uid) { const mine = db.uid; S.uid = mine; } refresh(true); }
      if (m.data.t === "mv") { db.emit("pos", m.data); }
      if (m.data.t === "pres") { db.presence[m.data.uid] = { where: m.data.where, name: m.data.name, t: Date.now() }; db.emit("presence"); }
    });
    // الحضور بالنسخة التجريبية: بين تابين مفتوحين
    setInterval(() => {
      const now = Date.now();
      Object.keys(db.presence).forEach((k) => { if (now - db.presence[k].t > 15000 && k !== db.uid) { delete db.presence[k]; db.emit("presence"); } });
      if (db.me && bc) bc.postMessage({ t: "pres", uid: db.uid, where: db._where || "village", name: db.me.name });
    }, 5000);
    db.sendPos = (p) => { if (db.me && bc) bc.postMessage(Object.assign({ t: "mv", u: db.uid }, p)); };
    db.track = (where) => { db._where = where; if (db.me && bc) bc.postMessage({ t: "pres", uid: db.uid, where, name: db.me.name }); };

    db.start = async () => {
      S.uid = sessionStorage.getItem("osw_uid") || null;
      if (S.profiles.length < 2) return "auth";
      if (!S.uid || !S.profiles.some((p) => p.id === S.uid)) return "auth";
      refresh(); S.seen[S.uid] = new Date().toISOString(); return "ready";
    };
    db.demoUsers = () => S.profiles;
    db.demoSetup = (n1, n2) => {
      const mk = (name, color, hair) => ({ id: uuid(), name, color, hair, created_at: new Date().toISOString() });
      S.profiles = [mk(n1, "#2F7DE1", "#2b1d14"), mk(n2, "#D6336C", "#4a2c1a")];
      S.kv["look:" + S.profiles[0].id] = { gender: "boy", hairStyle: "short" }; S.kv["look:" + S.profiles[1].id] = { gender: "girl", hairStyle: "long" };
      S.uid = S.profiles[0].id; sessionStorage.setItem("osw_uid", S.uid); save(); refresh(); return "ready";
    };
    db.demoLogin = (id) => { S.uid = id; sessionStorage.setItem("osw_uid", id); S.seen[id] = new Date().toISOString(); save(); refresh(); return "ready"; };
    db.switchUser = () => { const o = S.profiles.find((p) => p.id !== S.uid); db.demoLogin(o.id); };
    db.signOut = async () => { sessionStorage.removeItem("osw_uid"); S.uid = null; save(); location.reload(); };
    db.saveProfile = async (patch) => { fresh();
      const p = S.profiles.find((x) => x.id === S.uid); Object.assign(p, patch); save();
      apply(db, "profiles", "UPDATE", Object.assign({ id: S.uid }, patch));
    };
    db.addEntry = async (e) => {
      fresh();
      const row = {
        id: uuid(), house: e.house, author: S.uid, title: e.title || null, body: e.body || null, data: e.data || {},
        media: e.media || [], unlock_at: e.unlock_at || null, private: !!e.private,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      S.entries.push(row); save();
      apply(db, "entries", "INSERT", row);
      return light(row);
    };
    db.updateEntry = async (id, patch) => { fresh();
      const row = S.entries.find((x) => x.id === id);
      Object.assign(row, patch, { updated_at: new Date().toISOString() }); save();
      apply(db, "entries", "UPDATE", row);
      return light(row);
    };
    db.removeEntry = async (id) => { fresh();
      S.entries = S.entries.filter((e) => e.id !== id && !(e.house === "comment" && e.data && e.data.parent === id));
      S.reactions = S.reactions.filter((r) => r.entry_id !== id); save();
      db.entries.filter((e) => e.house === "comment" && e.data && e.data.parent === id).forEach((e) => apply(db, "entries", "DELETE", { id: e.id }));
      apply(db, "entries", "DELETE", { id });
    };
    db.getMedia = async (id) => { const r = S.entries.find((e) => e.id === id); return (r && r.media) || []; };
    db.react = async (entryId, emoji) => { fresh();
      const ex = S.reactions.find((r) => r.entry_id === entryId && r.author === S.uid && r.emoji === emoji);
      if (ex) { S.reactions = S.reactions.filter((r) => r !== ex); save(); apply(db, "reactions", "DELETE", ex); }
      else { const row = { id: uuid(), entry_id: entryId, author: S.uid, emoji, created_at: new Date().toISOString() }; S.reactions.push(row); save(); apply(db, "reactions", "INSERT", row); }
    };
    db.markRead = async (entryId) => { fresh();
      if (S.reads.some((r) => r.entry_id === entryId && r.user_id === S.uid)) return;
      const row = { entry_id: entryId, user_id: S.uid, read_at: new Date().toISOString() };
      S.reads.push(row); save(); apply(db, "reads", "INSERT", row);
    };
    db.kvSet = async (key, value) => { fresh(); S.kv[key] = value; save(); apply(db, "kv", "UPDATE", { key, value }); };
    db.touchSeen = () => {};
    return db;
  }

  OSW.createDB = () => {
    const c = window.OSW_CONFIG || {};
    return c.SUPABASE_URL && c.SUPABASE_ANON_KEY ? cloudDB(c) : demoDB();
  };
})();
