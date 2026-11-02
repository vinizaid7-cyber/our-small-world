/* أدوات مساعدة عامة */
(function () {
  const OSW = (window.OSW = window.OSW || {});
  OSW.$ = (s, r = document) => r.querySelector(s);
  OSW.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  OSW.esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  OSW.nl2br = (s) => OSW.esc(s).replace(/\n/g, "<br>");
  OSW.uuid = () =>
    window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  OSW.rand = (a) => a[Math.floor(Math.random() * a.length)];
  OSW.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  OSW.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // مولّد أرقام عشوائية ثابت (عشان الزينة ما تتغير كل مرة)
  OSW.seeded = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  OSW.plural = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`);

  OSW.timeAgo = (ts) => {
    const d = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
    if (d < 45) return "هلأ";
    const m = Math.round(d / 60);
    if (m < 60) return "قبل " + OSW.plural(m, "دقيقة", "دقيقتين", "دقايق", "دقيقة");
    const h = Math.round(m / 60);
    if (h < 24) return "قبل " + OSW.plural(h, "ساعة", "ساعتين", "ساعات", "ساعة");
    const dd = Math.round(h / 24);
    if (dd < 30) return "قبل " + OSW.plural(dd, "يوم", "يومين", "أيام", "يوم");
    const mo = Math.round(dd / 30);
    if (mo < 12) return "قبل " + OSW.plural(mo, "شهر", "شهرين", "شهور", "شهر");
    const y = Math.round(dd / 365);
    return "قبل " + OSW.plural(y, "سنة", "سنتين", "سنين", "سنة");
  };

  OSW.fmtDate = (d, opts) =>
    new Date(d).toLocaleDateString("ar-JO-u-nu-latn", opts || { year: "numeric", month: "long", day: "numeric" });
  OSW.fmtDateTime = (d) =>
    new Date(d).toLocaleString("ar-JO-u-nu-latn", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  OSW.todayKey = (d = new Date()) => {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  };
  OSW.daysBetween = (a, b = new Date()) => {
    const A = new Date(a), B = new Date(b);
    A.setHours(0, 0, 0, 0); B.setHours(0, 0, 0, 0);
    return Math.round((B - A) / 86400000);
  };
  // وقت متبقي بشكل مقروء
  OSW.countdown = (ts) => {
    let s = Math.max(0, Math.floor((new Date(ts).getTime() - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60);
    if (d >= 2) return OSW.plural(d, "يوم", "يومين", "أيام", "يوم");
    if (d === 1) return `يوم و${OSW.plural(h, "ساعة", "ساعتين", "ساعات", "ساعة")}`;
    if (h >= 1) return `${OSW.plural(h, "ساعة", "ساعتين", "ساعات", "ساعة")} و${OSW.plural(m, "دقيقة", "دقيقتين", "دقايق", "دقيقة")}`;
    return OSW.plural(Math.max(m, 1), "دقيقة", "دقيقتين", "دقايق", "دقيقة");
  };

  // ضغط الصور قبل الحفظ (بدون خدمات تخزين خارجية)
  OSW.compressImage = (file, max = 1000, q = 0.72) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width: w, height: h } = img;
        const k = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("الصورة ما انفتحت")); };
      img.src = url;
    });

  OSW.tpl = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ""));
})();
