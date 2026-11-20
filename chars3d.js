/* شخصيات القرية: ولد وبنت وسكان وسعدون والحجّي والحجّة */
(function () {
  const OSW = window.OSW, R = OSW.R, Builder = OSW.Builder, M = OSW.M, PI = Math.PI;
  const dk = OSW.col.dk, lt = OSW.col.lt;
  const cache = {};
  const sc1 = new Float32Array(16), sc2 = new Float32Array(16), sc3 = new Float32Array(16);

  function makeChar(look) {
    const key = JSON.stringify(look);
    if (cache[key]) return cache[key];
    const gl = R.gl, skin = look.skin || "#f2c9a0", girl = look.gender === "girl", hairC = look.hair || "#2b1d14";
    const shirt = look.color || "#2F7DE1", pants = look.pants || (girl ? skin : "#34495e");
    const body = new Builder(), legL = new Builder(), legR = new Builder(), armL = new Builder(), armR = new Builder();
    // الجذع حسب الطقم
    const outKey = look.outfit && look.outfit !== "casual" && OSW.CLOTHES[look.outfit] ? look.outfit : null, outf = outKey ? OSW.CLOTHES[outKey] : null, stl = outf ? outf.style : "casual";
    const topC = outf && outf.c1 ? outf.c1 : shirt;
    let pantsC = outf && outf.c2 ? outf.c2 : pants;
    const ROBE = ["dress", "gown", "abaya", "embroid", "king", "bisht"]; if (ROBE.includes(stl)) pantsC = skin;
    const SHOE = { hero: "#d62839", astro: "#9aa3ad", knight: "#6b7480", farmer: "#6b4a30", cowboy: "#6b4a30", ninja: "#14141a", pilot: "#14141a", bisht: "#2b2b2b", king: "#d4af37", pirate: "#2b2b2b" };
    const sleeveC = stl === "dress" || stl === "gown" ? skin : girl && stl === "casual" && !look.elder ? skin : stl === "varsity" ? "#f4f4f6" : stl === "doctor" ? "#ffffff" : stl === "bisht" ? "#2b2b2b" : stl === "king" ? "#b3202e" : stl === "hawaii" ? skin : topC;
    if (stl === "thobe") { body.box(0, 0.62, 0, 0.64, 0.74, 0.4, topC); body.cyl(0, 0.08, 0, 0.5, 0.33, 0.62, topC, 14); }
    else if (stl === "dress") { body.box(0, 0.62, 0, 0.58, 0.62, 0.34, topC); body.cyl(0, 0.32, 0, 0.55, 0.32, 0.5, topC, 12); body.box(0, 0.58, 0, 0.6, 0.07, 0.36, dk(topC, 0.3)); }
    else if (stl === "gown") { body.box(0, 0.62, 0, 0.58, 0.62, 0.34, topC); body.cyl(0, 0.04, 0, 0.7, 0.32, 0.84, topC, 14); body.sphere(0, 0.9, 0.2, 0.09, 0.09, 0.04, "#ffe08a", 5, 0.8); body.box(0, 0.58, 0, 0.6, 0.07, 0.36, "#ffe08a", 0.4); }
    else if (stl === "abaya") { body.box(0, 0.62, 0, 0.6, 0.66, 0.36, topC); body.cyl(0, 0.0, 0, 0.74, 0.34, 0.9, topC, 14); body.cyl(0, 0.0, 0, 0.75, 0.75, 0.07, "#e6b94a", 14); body.box(0, 0.7, 0.19, 0.1, 0.5, 0.02, "#e6b94a"); body.box(0, 0.98, 0.19, 0.36, 0.05, 0.02, "#e6b94a"); }
    else if (stl === "embroid") { body.box(0, 0.62, 0, 0.6, 0.66, 0.36, topC); body.cyl(0, 0.0, 0, 0.74, 0.34, 0.9, topC, 14); [0.12, 0.34, 0.56].forEach((y, i) => body.cyl(0, y, 0, 0.74 - i * 0.11, 0.74 - i * 0.11 + 0.01, 0.07, i % 2 ? "#e6b94a" : "#c8102e", 14)); body.box(0, 0.78, 0.19, 0.4, 0.34, 0.02, "#c8102e"); for (let i = 0; i < 4; i++) body.box(-0.12 + i * 0.08, 0.8, 0.2, 0.04, 0.2, 0.02, i % 2 ? "#e6b94a" : "#1b7a4a"); body.box(0, 1.0, 0.19, 0.44, 0.04, 0.02, "#e6b94a"); }
    else if (stl === "king") { body.box(0, 0.62, 0, 0.66, 0.76, 0.42, topC); body.cyl(0, 0.04, 0, 0.62, 0.36, 0.64, topC, 14); body.cyl(0, 0.04, 0, 0.64, 0.64, 0.1, "#f4f1e8", 14); body.cyl(0, 1.12, 0, 0.42, 0.34, 0.18, "#f4f1e8", 12); body.box(0, 0.6, 0.0, 0.7, 0.08, 0.46, "#d4af37"); for (let i = 0; i < 4; i++) body.sphere(-0.15 + i * 0.1, 0.9, 0.22, 0.03, 0.05, 0.03, "#2b2b2b", 4); }
    else if (stl === "bisht") { body.box(0, 0.62, 0, 0.64, 0.74, 0.4, "#f4f1e8"); body.cyl(0, 0.08, 0, 0.5, 0.33, 0.62, "#f4f1e8", 14); body.box(0, 0.1, -0.24, 0.84, 1.28, 0.06, "#2b2b2b"); [-1, 1].forEach((sd) => { body.box(sd * 0.38, 0.1, 0.0, 0.07, 1.26, 0.46, "#2b2b2b"); body.box(sd * 0.4, 0.1, 0.0, 0.03, 1.26, 0.48, "#d4af37"); }); body.box(0, 1.14, 0, 0.5, 0.08, 0.44, "#d4af37"); }
    else if (stl === "vest") { body.box(0, 0.62, 0, 0.64, 0.74, 0.4, topC); body.cyl(0, 0.08, 0, 0.5, 0.33, 0.62, topC, 14); body.box(-0.2, 0.68, 0.2, 0.2, 0.66, 0.04, "#6b4a30"); body.box(0.2, 0.68, 0.2, 0.2, 0.66, 0.04, "#6b4a30"); for (let i = 0; i < 4; i++) body.sphere(0, 0.5 + i * 0.16, 0.22, 0.03, 0.03, 0.02, "#d4af37", 4, 0.3); }
    else if (stl === "onesie") {
      const an = outf.animal; body.box(0, 0.6, 0, 0.64, 0.76, 0.4, topC); body.cyl(0, 0.3, 0, 0.36, 0.3, 0.4, topC, 8);
      body.sphere(0, 0.58, 0.2, 0.22, 0.28, 0.04, an === "panda" ? "#2b2b2b" : an === "bunny" ? "#fff" : lt(topC, 0.35), 8);
      if (an === "dino") { for (let i = 0; i < 4; i++) body.box(0, 1.0 - i * 0.22, -0.24, 0.1, 0.16, 0.14, "#e8a33d"); body.box(0, 0.3, -0.34, 0.14, 0.14, 0.36, topC); }
      if (an === "panda") body.box(0, 0.62, 0, 0.66, 0.16, 0.42, "#2b2b2b");
    }
    else if (girl && stl === "casual") { body.box(0, 0.62, 0, 0.58, 0.62, 0.34, shirt); body.cyl(0, 0.34, 0, 0.5, 0.32, 0.5, shirt, 10); body.cyl(0, 0.34, 0, 0.51, 0.51, 0.05, dk(shirt, 0.25), 10); }
    else {
      body.box(0, 0.6, 0, 0.62, 0.74, 0.36, topC); body.box(0, 0.56, 0, 0.64, 0.12, 0.38, dk(topC, 0.2));
      if (stl === "hoodie") { body.sphere(0, 1.28, -0.2, 0.27, 0.2, 0.2, topC, 7); body.box(0, 0.55, 0.19, 0.42, 0.2, 0.03, dk(topC, 0.25)); }
      if (stl === "sport") { body.box(-0.32, 0.6, 0, 0.04, 0.72, 0.38, "#fff"); body.box(0.32, 0.6, 0, 0.04, 0.72, 0.38, "#fff"); body.box(0, 0.9, 0.19, 0.14, 0.14, 0.02, "#ffd23f"); }
      if (stl === "jacket") { body.box(0, 0.66, 0.19, 0.24, 0.68, 0.02, "#eee"); body.box(-0.2, 1.24, 0.17, 0.2, 0.1, 0.08, dk(topC, 0.2)); body.box(0.2, 1.24, 0.17, 0.2, 0.1, 0.08, dk(topC, 0.2)); }
      if (stl === "suit") { body.box(0, 0.7, 0.19, 0.22, 0.62, 0.02, "#fff"); body.box(0, 0.8, 0.2, 0.07, 0.46, 0.02, "#c0392b"); body.box(-0.14, 1.0, 0.2, 0.1, 0.2, 0.02, dk(topC, 0.3)); body.box(0.14, 1.0, 0.2, 0.1, 0.2, 0.02, dk(topC, 0.3)); }
      if (stl === "pajama") { for (let i = 0; i < 6; i++) body.sphere(-0.2 + (i % 3) * 0.2, 0.75 + Math.floor(i / 3) * 0.28, 0.19, 0.045, 0.045, 0.02, "#ffe56b", 4, 0.3); }
      if (stl === "overalls") { body.box(0, 0.36, 0.19, 0.44, 0.55, 0.03, pantsC); [-1, 1].forEach((sd) => body.box(sd * 0.15, 0.62, 0.19, 0.06, 0.62, 0.03, pantsC)); [-1, 1].forEach((sd) => body.sphere(sd * 0.15, 0.78, 0.22, 0.03, 0.03, 0.02, "#ffd23f", 4, 0.3)); body.box(0, 0.38, 0.22, 0.2, 0.14, 0.02, dk(pantsC, 0.2)); }
      if (stl === "hawaii") { for (let i = 0; i < 9; i++) body.sphere(-0.2 + (i % 3) * 0.2, 0.4 + Math.floor(i / 3) * 0.24, 0.19, 0.055, 0.055, 0.02, ["#fff", "#ffe56b", "#ff8fb1"][i % 3], 5, 0.2); body.box(0, 0.88, 0.19, 0.12, 0.3, 0.02, "#fff"); }
      if (stl === "varsity") { body.box(0, 0.62, 0.19, 0.04, 0.7, 0.02, "#fff"); body.box(-0.15, 0.95, 0.19, 0.14, 0.14, 0.02, "#fff"); body.box(0, 0.38, 0, 0.66, 0.08, 0.4, "#f4f4f6"); }
      if (stl === "puffer") { for (let i = 0; i < 4; i++) body.box(0, 0.3 + i * 0.2, 0, 0.7, 0.04, 0.44, dk(topC, 0.25)); body.cyl(0, 1.12, 0, 0.27, 0.27, 0.18, dk(topC, 0.1), 10); body.box(0, 0.65, 0.22, 0.04, 0.7, 0.02, "#eee"); }
      if (stl === "poncho") { body.cyl(0, 0.2, 0, 0.62, 0.34, 0.6, topC, 12); [0.3, 0.45].forEach((y, i) => body.cyl(0, y, 0, 0.55 - i * 0.12, 0.56 - i * 0.12, 0.05, i ? "#ffd23f" : "#2a9d8f", 12)); body.cyl(0, 0.78, 0, 0.36, 0.3, 0.3, topC, 10); }
      if (stl === "school") { body.box(0, 0.5, 0.19, 0.5, 0.48, 0.03, pantsC); body.box(0, 0.85, 0.2, 0.06, 0.36, 0.02, "#c0392b"); body.box(0, 1.08, 0.18, 0.2, 0.06, 0.04, "#fff"); }
      if (stl === "chef") { body.box(-0.1, 0.6, 0.19, 0.04, 0.6, 0.02, "#cfd4da"); body.box(0.1, 0.6, 0.19, 0.04, 0.6, 0.02, "#cfd4da"); for (let i = 0; i < 4; i++) { body.sphere(-0.1, 0.4 + i * 0.16, 0.2, 0.025, 0.025, 0.02, "#aab", 4); body.sphere(0.1, 0.4 + i * 0.16, 0.2, 0.025, 0.025, 0.02, "#aab", 4); } body.cyl(0, 1.16, 0, 0.2, 0.2, 0.1, "#d62839", 8); }
      if (stl === "doctor") { body.box(0, 0.28, 0, 0.66, 0.78, 0.4, "#ffffff"); body.box(0, 0.9, 0.2, 0.2, 0.4, 0.02, pantsC); [-1, 1].forEach((sd) => body.box(sd * 0.1, 0.96, 0.21, 0.1, 0.3, 0.02, "#e9eef2")); body.cyl(0, 1.12, 0.02, 0.2, 0.2, 0.05, "#2b2b2b", 10); body.sphere(0.0, 0.84, 0.22, 0.06, 0.06, 0.03, "#8d99a6", 5); body.box(0.2, 0.55, 0.21, 0.12, 0.1, 0.02, "#ddd"); }
      if (stl === "pilot") { body.box(0, 0.6, 0.19, 0.04, 0.7, 0.02, "#d4af37"); [-1, 1].forEach((sd) => { body.box(sd * 0.28, 1.22, 0, 0.18, 0.05, 0.22, "#d4af37"); body.box(sd * 0.28, 1.16, 0, 0.18, 0.04, 0.22, "#d4af37"); }); body.box(0, 0.88, 0.2, 0.07, 0.4, 0.02, "#111"); body.box(-0.2, 0.9, 0.2, 0.12, 0.08, 0.02, "#d4af37"); }
      if (stl === "cowboy") { body.box(-0.19, 0.66, 0.2, 0.22, 0.66, 0.04, "#6b4a30"); body.box(0.19, 0.66, 0.2, 0.22, 0.66, 0.04, "#6b4a30"); body.sphere(-0.2, 0.9, 0.23, 0.07, 0.07, 0.03, "#ffd23f", 5, 0.4); body.box(0, 0.38, 0, 0.66, 0.07, 0.4, "#3b2a1a"); body.sphere(0, 0.38, 0.21, 0.06, 0.05, 0.03, "#ffd23f", 5, 0.4); }
      if (stl === "astro") { body.box(0, 0.75, -0.32, 0.5, 0.7, 0.22, "#d9dee3"); body.box(0, 0.6, 0.2, 0.34, 0.26, 0.03, "#2b3445"); [["#e63946", -0.1], ["#4dabf7", 0], ["#ffd23f", 0.1]].forEach(([c2, x]) => body.box(x, 0.62, 0.22, 0.06, 0.06, 0.02, c2, 0.5)); body.box(-0.22, 0.98, 0.2, 0.14, 0.09, 0.02, "#e63946"); body.cyl(0, 1.16, 0, 0.26, 0.26, 0.14, "#c9d0d7", 10); }
      if (stl === "pirate") { for (let i = 0; i < 4; i++) body.box(0, 0.45 + i * 0.2, 0.19, 0.64, 0.08, 0.02, "#2b2b35"); body.box(0, 0.36, 0, 0.66, 0.12, 0.4, "#c0392b"); body.box(0, 0.52, 0.21, 0.66, 0.07, 0.03, "#3b2a1a"); body.box(0, 0.52, 0.23, 0.1, 0.09, 0.02, "#ffd23f"); }
      if (stl === "knight") { body.box(0, 0.7, 0.2, 0.54, 0.56, 0.1, "#c9d1d9"); body.box(0, 0.7, 0.26, 0.08, 0.56, 0.02, "#8a949f"); [-1, 1].forEach((sd) => body.sphere(sd * 0.36, 1.2, 0, 0.17, 0.12, 0.2, "#c9d1d9", 7)); body.box(0, 0.36, 0, 0.7, 0.1, 0.42, "#6b4a30"); body.sphere(0, 0.38, 0.22, 0.07, 0.07, 0.03, "#ffd23f", 5, 0.3); }
      if (stl === "ninja") { body.box(0, 0.42, 0, 0.66, 0.1, 0.4, "#d62839"); body.box(0, 0.7, 0.19, 0.5, 0.05, 0.02, "#34343f"); body.box(0.36, 0.36, 0.0, 0.1, 0.4, 0.1, "#d62839"); }
      if (stl === "hero") { body.box(0, 0.42, 0, 0.66, 0.1, 0.4, "#ffd23f"); body.box(0, 0.82, 0.19, 0.26, 0.26, 0.03, "#ffd23f", 0.3); body.box(0, 0.86, 0.21, 0.1, 0.18, 0.02, "#d62839"); body.box(0, 0.3, 0, 0.62, 0.16, 0.38, "#d62839"); }
      if (stl === "rain") { body.sphere(0, 1.28, -0.2, 0.28, 0.22, 0.22, topC, 7); body.cyl(0, 0.3, 0, 0.42, 0.34, 0.45, topC, 10); }
    }
    if (look.apron) body.box(0, 0.6, 0.19, 0.5, 0.6, 0.04, look.apron);
    if (look.sash) body.box(0, 0.86, 0.19, 0.64, 0.1, 0.04, look.sash);
    body.box(0, 1.28, 0, 0.16, 0.1, 0.16, skin); // رقبة
    // الرأس
    body.sphere(0, 1.62, 0, 0.32, 0.33, 0.31, skin, 10);
    body.sphere(-0.115, 1.66, 0.28, 0.045, 0.055, 0.03, "#2a2030", 5); body.sphere(0.115, 1.66, 0.28, 0.045, 0.055, 0.03, "#2a2030", 5);
    body.sphere(-0.19, 1.55, 0.25, 0.06, 0.04, 0.03, "#ff9aa8", 5); body.sphere(0.19, 1.55, 0.25, 0.06, 0.04, 0.03, "#ff9aa8", 5);
    body.box(0, 1.5, 0.3, 0.1, 0.022, 0.02, "#7a3b3b"); body.sphere(0, 1.58, 0.31, 0.03, 0.03, 0.03, dk(skin, 0.08), 4);
    if (look.mustache) body.box(0, 1.535, 0.305, 0.2, 0.04, 0.03, look.elder ? "#d8d8d8" : "#2b2b2b");
    const hs = look.hairStyle || (girl ? "long" : "short");
    if (hs === "short") { body.sphere(0, 1.68, -0.03, 0.345, 0.3, 0.34, hairC, 9, 0, true); body.box(0, 1.84, 0.2, 0.46, 0.09, 0.16, hairC); }
    else if (hs === "long") { body.sphere(0, 1.68, -0.03, 0.35, 0.3, 0.34, hairC, 9, 0, true); body.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, hairC); body.box(0, 0.95, -0.22, 0.62, 0.85, 0.12, hairC); body.box(-0.32, 1.2, -0.05, 0.1, 0.6, 0.22, hairC); body.box(0.32, 1.2, -0.05, 0.1, 0.6, 0.22, hairC); }
    else if (hs === "ponytail") { body.sphere(0, 1.68, -0.03, 0.35, 0.3, 0.34, hairC, 9, 0, true); body.box(0, 1.84, 0.2, 0.5, 0.09, 0.16, hairC); body.sphere(0, 1.78, -0.36, 0.14, 0.14, 0.14, hairC, 7); body.cyl(0, 1.2, -0.4, 0.07, 0.11, 0.6, hairC, 6); }
    else if (hs === "hijab") { body.sphere(0, 1.63, -0.03, 0.375, 0.4, 0.37, hairC, 12); body.sphere(0, 1.58, 0.14, 0.255, 0.28, 0.2, skin, 10); body.cyl(0, 1.0, 0, 0.5, 0.3, 0.5, hairC, 12);
      body.sphere(-0.115, 1.66, 0.3, 0.045, 0.055, 0.03, "#2a2030", 5); body.sphere(0.115, 1.66, 0.3, 0.045, 0.055, 0.03, "#2a2030", 5); body.box(0, 1.5, 0.335, 0.1, 0.022, 0.02, "#7a3b3b"); }
    else if (hs === "keffiyeh") { body.sphere(0, 1.7, -0.02, 0.37, 0.3, 0.36, "#f6f3ea", 10, 0, true); body.cyl(0, 1.86, 0, 0.35, 0.35, 0.07, "#1b1b1b", 12); body.box(0, 1.45, -0.28, 0.6, 0.5, 0.1, "#f6f3ea"); }
    else if (hs === "cap") { body.sphere(0, 1.68, -0.03, 0.35, 0.3, 0.34, look.cap || "#2f8f5b", 9, 0, true); body.box(0, 1.8, 0.3, 0.42, 0.05, 0.2, look.cap || "#2f8f5b"); }
    if (stl === "ninja") { body.sphere(0, 1.68, -0.03, 0.36, 0.34, 0.35, "#1c1c24", 10, 0, true); body.box(0, 1.52, 0.04, 0.66, 0.34, 0.6, "#1c1c24"); body.box(0, 1.8, 0.0, 0.7, 0.07, 0.66, "#d62839"); body.box(0, 1.74, 0.31, 0.52, 0.04, 0.04, "#1c1c24"); }
    if (stl === "onesie") { const an = outf.animal, hc = an === "panda" ? "#f4f4f4" : topC; body.sphere(0, 1.7, -0.03, 0.37, 0.33, 0.36, hc, 10, 0, true); body.box(0, 1.84, 0.12, 0.5, 0.08, 0.2, hc);
      if (an === "panda") [-1, 1].forEach((sd) => body.sphere(sd * 0.27, 1.98, -0.02, 0.1, 0.1, 0.08, "#2b2b2b", 6));
      else if (an === "bunny") [-1, 1].forEach((sd) => { body.box(sd * 0.13, 1.95, -0.04, 0.1, 0.55, 0.07, "#fff"); body.box(sd * 0.13, 2.0, -0.01, 0.05, 0.4, 0.03, "#ff9ab8"); });
      else { [-1, 1].forEach((sd) => body.sphere(sd * 0.14, 1.97, 0.1, 0.07, 0.07, 0.07, "#fff", 5)); body.sphere(0, 1.9, -0.28, 0.1, 0.12, 0.1, "#e8a33d", 4); } }
    if (stl === "pirate") { body.box(0, 1.84, 0, 0.7, 0.08, 0.7, "#c0392b"); body.sphere(-0.13, 1.67, 0.31, 0.07, 0.07, 0.03, "#111", 5); body.box(0, 1.75, 0.3, 0.3, 0.015, 0.02, "#111"); }
    if (stl === "knight") { body.sphere(0, 1.68, -0.02, 0.37, 0.36, 0.36, "#aab4bf", 10, 0, true); body.box(0, 1.7, 0.2, 0.48, 0.06, 0.2, "#6b7480"); body.box(0, 1.95, -0.05, 0.05, 0.22, 0.3, "#d62839"); }
    if (stl === "pilot") { body.sphere(0, 1.72, -0.03, 0.36, 0.3, 0.35, "#24344f", 9, 0, true); body.box(0, 1.82, 0.3, 0.42, 0.05, 0.2, "#111"); body.box(0, 1.88, 0.2, 0.1, 0.06, 0.02, "#d4af37"); }
    if (stl === "hero") { body.box(0, 1.68, 0.3, 0.5, 0.14, 0.04, "#d62839"); [-0.12, 0.12].forEach((x) => body.sphere(x, 1.68, 0.33, 0.05, 0.04, 0.02, "#fff", 4)); }
    if (stl === "astro") { body.cyl(0, 1.16, 0, 0.3, 0.3, 0.1, "#c9d0d7", 10); }
    // إكسسوارات
    (look.acc || []).forEach((k) => {
      if (k === "cap") { body.sphere(0, 1.74, -0.02, 0.36, 0.3, 0.35, "#d64545", 9, 0, true); body.box(0, 1.8, 0.31, 0.44, 0.04, 0.22, "#b33636"); }
      else if (k === "shades") { body.box(0, 1.66, 0.3, 0.44, 0.1, 0.05, "#111"); body.box(0, 1.66, 0.28, 0.5, 0.025, 0.04, "#111"); }
      else if (k === "scarf") { body.cyl(0, 1.16, 0, 0.27, 0.25, 0.2, "#e2574c", 10); body.box(0.15, 0.85, 0.2, 0.12, 0.4, 0.04, "#e2574c"); }
      else if (k === "crown") { for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; body.sphere(0.34 * Math.sin(an), 1.9, 0.34 * Math.cos(an), 0.07, 0.07, 0.07, i % 2 ? "#ff8fb1" : "#fff3a0", 5, 0.3); } }
      else if (k === "bow") { body.sphere(-0.1, 1.95, 0.18, 0.1, 0.07, 0.05, "#ff4d6d", 5); body.sphere(0.1, 1.95, 0.18, 0.1, 0.07, 0.05, "#ff4d6d", 5); body.sphere(0, 1.95, 0.2, 0.04, 0.04, 0.04, "#c9184a", 4); }
      else if (k === "straw") { body.cyl(0, 1.84, 0, 0.58, 0.58, 0.04, "#e8cf8a", 14); body.cyl(0, 1.86, 0, 0.3, 0.28, 0.22, "#e8cf8a", 12); body.cyl(0, 1.88, 0, 0.31, 0.31, 0.06, "#d64545", 12); }
      else if (k === "beanie") { body.sphere(0, 1.74, -0.02, 0.36, 0.3, 0.35, "#3a6fb0", 9, 0, true); body.cyl(0, 1.78, 0, 0.36, 0.36, 0.1, "#2a5390", 10); body.sphere(0, 2.04, 0, 0.1, 0.1, 0.1, "#fff", 6); }
      else if (k === "chefhat") { body.cyl(0, 1.84, 0, 0.3, 0.3, 0.16, "#fff", 12); body.sphere(0, 2.1, 0, 0.36, 0.26, 0.36, "#fff", 8); body.sphere(-0.2, 2.02, 0.05, 0.16, 0.14, 0.16, "#fff", 6); body.sphere(0.2, 2.02, 0.05, 0.16, 0.14, 0.16, "#fff", 6); }
      else if (k === "party") { body.cyl(0.04, 1.9, 0, 0.2, 0, 0.56, "#ff6bd6", 8); for (let i = 0; i < 3; i++) body.sphere(0.04 + (i - 1) * 0.05, 1.98 + i * 0.12, 0.12, 0.04, 0.04, 0.04, "#ffe66b", 4); body.sphere(0.04, 2.48, 0, 0.07, 0.07, 0.07, "#4dabf7", 5); }
      else if (k === "cowhat") { body.cyl(0, 1.84, 0, 0.62, 0.62, 0.04, "#a8714a", 14); body.cyl(0, 1.86, 0, 0.3, 0.26, 0.3, "#a8714a", 12); body.cyl(0, 1.9, 0, 0.31, 0.31, 0.06, "#3b2a1a", 12); }
      else if (k === "pirhat") { body.box(0, 1.9, 0, 0.78, 0.2, 0.42, "#1b1b1b"); body.box(0, 2.06, 0, 0.5, 0.14, 0.34, "#1b1b1b"); body.box(0, 1.94, 0.22, 0.12, 0.1, 0.02, "#f4f4f4"); body.box(0, 1.9, 0.22, 0.04, 0.04, 0.02, "#1b1b1b"); }
      else if (k === "goldcrown") { body.cyl(0, 1.86, 0, 0.3, 0.3, 0.14, "#f2c94c", 12, 0.3); for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2; body.box(0.3 * Math.sin(an), 2.0, 0.3 * Math.cos(an), 0.08, 0.2, 0.08, "#f2c94c", 0.3); body.sphere(0.3 * Math.sin(an), 2.22, 0.3 * Math.cos(an), 0.05, 0.05, 0.05, i % 2 ? "#e63946" : "#4dabf7", 4, 0.6); } }
      else if (k === "halo") { body.cyl(0, 2.2, 0, 0.3, 0.3, 0.05, "#ffe066", 14, 1); body.cyl(0, 2.22, 0, 0.22, 0.22, 0.05, "#fffbe0", 14, 1); }
      else if (k === "bunnyears") { [-1, 1].forEach((sd) => { body.box(sd * 0.14, 1.95, -0.02, 0.1, 0.5, 0.06, "#fff"); body.box(sd * 0.14, 2.0, 0.01, 0.05, 0.36, 0.03, "#ff9ab8"); }); }
      else if (k === "kuffiya") { body.sphere(0, 1.72, -0.02, 0.37, 0.3, 0.36, "#f6f3ea", 10, 0, true); for (let i = 0; i < 6; i++) body.box(-0.25 + i * 0.1, 1.84, 0.1, 0.05, 0.05, 0.2, "#c0392b"); body.cyl(0, 1.88, 0, 0.35, 0.35, 0.07, "#1b1b1b", 12); body.box(0, 1.46, -0.28, 0.62, 0.5, 0.1, "#f6f3ea"); body.box(-0.32, 1.5, 0.0, 0.08, 0.4, 0.4, "#f6f3ea"); body.box(0.32, 1.5, 0.0, 0.08, 0.4, 0.4, "#f6f3ea"); }
      else if (k === "phones") { body.box(0, 2.0, 0, 0.68, 0.06, 0.1, "#222"); [-1, 1].forEach((sd) => { body.box(sd * 0.33, 1.84, 0, 0.06, 0.34, 0.1, "#222"); body.sphere(sd * 0.36, 1.66, 0, 0.09, 0.14, 0.14, "#e63946", 6); }); }
      else if (k === "glasses") { [-1, 1].forEach((sd) => { body.box(sd * 0.13, 1.66, 0.3, 0.2, 0.14, 0.03, "#bfe9ff", 0.3); body.box(sd * 0.13, 1.74, 0.31, 0.22, 0.02, 0.03, "#2b2b2b"); body.box(sd * 0.13, 1.58, 0.31, 0.22, 0.02, 0.03, "#2b2b2b"); body.box(sd * 0.24, 1.66, 0.31, 0.02, 0.16, 0.03, "#2b2b2b"); body.box(sd * 0.02, 1.66, 0.31, 0.02, 0.16, 0.03, "#2b2b2b"); }); body.box(0, 1.67, 0.31, 0.08, 0.02, 0.03, "#2b2b2b"); }
      else if (k === "mask") { body.box(0, 1.66, 0.3, 0.52, 0.14, 0.04, "#8e4a94"); body.box(0, 1.66, 0.32, 0.5, 0.03, 0.03, "#ffd23f"); [-1, 1].forEach((sd) => { body.sphere(sd * 0.13, 1.66, 0.33, 0.05, 0.04, 0.02, "#111", 4); body.box(sd * 0.3, 1.78, 0.28, 0.04, 0.3, 0.03, sd > 0 ? "#ff6bd6" : "#4dabf7"); }); }
      else if (k === "bowtie") { body.box(-0.1, 1.2, 0.2, 0.14, 0.12, 0.04, "#c0392b"); body.box(0.1, 1.2, 0.2, 0.14, 0.12, 0.04, "#c0392b"); body.sphere(0, 1.2, 0.21, 0.04, 0.05, 0.04, "#8e1f1f", 4); }
      else if (k === "pearls") { for (let i = 0; i < 10; i++) { const an = (i / 10) * Math.PI * 2; body.sphere(0.2 * Math.sin(an), 1.17, 0.2 * Math.cos(an) * 0.9, 0.04, 0.04, 0.04, "#fdf5ec", 4, 0.3); } body.sphere(0, 1.05, 0.2, 0.06, 0.06, 0.05, "#fdf5ec", 5, 0.3); }
      else if (k === "medal") { body.box(0, 1.0, 0.2, 0.06, 0.4, 0.02, "#e63946"); body.sphere(0, 0.78, 0.21, 0.1, 0.1, 0.03, "#ffd23f", 6, 0.4); }
      else if (k === "backpack") { body.box(0, 0.78, -0.3, 0.46, 0.6, 0.18, "#e07a3a"); body.box(0, 0.66, -0.41, 0.3, 0.24, 0.05, "#c4602a"); [-1, 1].forEach((sd) => body.box(sd * 0.19, 0.95, 0.0, 0.05, 0.5, 0.4, "#b5502a")); }
      else if (k === "cape") { body.box(0, 0.05, -0.23, 0.78, 1.25, 0.05, "#d62839"); body.box(0, 1.2, -0.2, 0.62, 0.1, 0.12, "#a81d2c"); body.sphere(-0.28, 1.15, 0.1, 0.06, 0.06, 0.06, "#ffd23f", 5); body.sphere(0.28, 1.15, 0.1, 0.06, 0.06, 0.06, "#ffd23f", 5); }
      else if (k === "wings") { [-1, 1].forEach((sd) => { body.sphere(sd * 0.42, 1.0, -0.3, 0.07, 0.42, 0.24, "#ffffff", 6, 0.25); body.sphere(sd * 0.6, 0.86, -0.34, 0.06, 0.32, 0.2, "#f2f5ff", 6, 0.2); body.sphere(sd * 0.74, 0.7, -0.36, 0.05, 0.22, 0.14, "#e8eeff", 5, 0.2); }); }
      else if (k === "fairy") { [-1, 1].forEach((sd) => { body.sphere(sd * 0.5, 1.15, -0.3, 0.06, 0.4, 0.3, "#ff8fd8", 6, 0.35); body.sphere(sd * 0.46, 0.7, -0.3, 0.05, 0.26, 0.2, "#b78cff", 6, 0.35); body.sphere(sd * 0.5, 1.15, -0.33, 0.04, 0.16, 0.12, "#fff3a0", 5, 0.4); }); }
      else if (k === "tie") { body.box(0, 0.8, 0.2, 0.08, 0.5, 0.02, "#2a9d8f"); }
    });

    // الأطراف (نقطة الدوران بالأعلى)
    const leg = (b, x) => { b.box(0, -0.62, 0, 0.2, 0.55, 0.2, pantsC); b.box(0, -0.66, 0.05, 0.23, 0.12, 0.32, look.shoe || SHOE[stl] || "#3b2f2f"); };
    leg(legL, 0); leg(legR, 0);
    const arm = (b, cane) => { b.box(0, -0.5, 0, 0.16, 0.5, 0.16, sleeveC); b.sphere(0, -0.56, 0, 0.09, 0.09, 0.09, skin, 6); if (cane) { b.cyl(0.04, -1.5, 0.1, 0.03, 0.03, 1.55, "#7a5236", 5); b.sphere(0.04, 0.05, 0.1, 0.06, 0.05, 0.06, "#7a5236", 5); } };
    arm(armL, false); arm(armR, !!look.cane);
    if (!look.elder && girl) { /* كم قصير للبنت */ }
    const ch = { cane: !!look.cane, body: body.build(gl), legL: legL.build(gl), legR: legR.build(gl), armL: armL.build(gl), armR: armR.build(gl), h: look.hairStyle === "keffiyeh" ? 2.15 : 2.1 };
    return (cache[key] = ch);
  }
  // ظل دائري موحّد
  let shadowMesh;
  function shadow() { if (!shadowMesh) { const b = new Builder(); b.disc(0, 0.12, 0, 1, "#000000", 14); shadowMesh = b.build(R.gl); } return shadowMesh; }

  // يرسم شخصية: x,z,ry,phase(حركة الأرجل),moving(0..1)
  OSW.drawChar = (ch, x, z, ry, phase, moving, t, alpha, tint, scale, y0, pose) => {
    scale = scale || 1; const bob = (moving > 0.05 ? Math.abs(Math.sin(phase)) * 0.07 * moving : Math.sin(t * 2.2) * 0.012) * scale + (y0 || 0);
    M.trs(x, bob, z, ry, 0, 0, scale, scale, scale, sc1);
    R.draw(ch.body, sc1, tint, alpha);
    const sw = Math.sin(phase) * 0.85 * moving, idle = Math.sin(t * 2.2) * 0.04;
    const limb = (mesh, px, py, ang, rz) => { M.trs(px, py, 0, 0, ang, rz || 0, 1, 1, 1, sc2); M.mul(sc1, sc2, sc3); R.draw(mesh, sc3, tint, alpha); };
    limb(ch.legL, -0.17, 0.62, sw); limb(ch.legR, 0.17, 0.62, -sw);
    if (pose && pose.carry) { limb(ch.armL, -0.4, 1.24, -1.25); limb(ch.armR, 0.4, 1.24, -1.25); return; }
    let aL = -sw * 0.9 + idle, aR = ch.cane ? 0 : sw * 0.9 - idle, zL = 0, zR = 0;
    if (pose && pose.hold) { if (pose.hold > 0) { aR = -0.35; zR = 0.95; } else { aL = -0.35; zL = -0.95; } }
    limb(ch.armL, -0.4, 1.24, aL, zL); limb(ch.armR, 0.4, 1.24, aR, zR);
  };
  OSW.drawShadow = (x, z, r) => { M.trs(x, 0, z, 0, 0, 0, r, 1, r, sc1); R.draw(shadow(), sc1, [0, 0, 0], 0.3); };
  OSW.makeChar = makeChar;

  /* ---------- أهل القرية ---------- */
  OSW.NPCS = [
    { id: "saadoun", name: "سعدون", emoji: "🧑‍🍳", look: { gender: "boy", color: "#f4f1e8", hair: "#1b1b1b", hairStyle: "cap", cap: "#2f8f5b", apron: "#2f8f5b", mustache: true }, pos: [-24, 13.2], face: 0, stay: true, act: "shop",
      lines: ["أهلين وسهلين! شو بدك اليوم؟ عندي أطيب خضرة بالقرية 🥬", "والله الطماطم اليوم نار! جرّب وبتشكرني 😎", "أنا ما بسرق… بس بحسب غلط أحياناً 😂", "راتبي ما بكفي حق القهوة! اشتروا كتير يا جماعة ☕", "للحجّي والحجّة عندي خبز طازة وشاي وتمر 🌴"] },
    { id: "abujamil", name: "أبو جميل (بوظة)", emoji: "🍦", isle: 1, look: { gender: "boy", color: "#ffffff", pants: "#3b5ba5", hair: "#333", hairStyle: "cap", cap: "#ff7aa8", apron: "#ff7aa8", mustache: true }, pos: [14, 1170.6], face: -1.05, stay: true,
      lines: ["بوظة فستق وفراولة! جربوا الجديدة 🍦", "الجو حر… البوظة أحلى شي ☀️", "بوظتي بتذوّب القلب قبل ما تذوّب بإيدكم 😄", "بتعرفوا؟ أول مرة أشوف سيارات تيجي هون! 🚗"] },
    { id: "ahmadlife", name: "أحمد المنقذ", emoji: "🏊", isle: 1, look: { gender: "boy", color: "#e63946", pants: "#f4f1e8", hair: "#222", hairStyle: "short" }, pos: [50, 1231], face: 0.74, stay: true,
      lines: ["أنا بحرس الشاطئ، اسبحوا بأمان 🌊", "ممنوع السباحة بعد المغرب… بس ما في سباحة أصلاً 😅", "لو شفتوا حوت قولولي! 🐋", "المنظر من فوق البرج خرافي 😎"] },
    { id: "salem", name: "سالم الصياد", emoji: "🎣", isle: 1, look: { gender: "boy", color: "#5b7a8c", pants: "#3a3a3a", hair: "#999", hairStyle: "cap", cap: "#d4a73a", mustache: true }, pos: [-1.8, 1281], face: 3.14, stay: true,
      lines: ["الصيد صبر يا ولدي… استنوا العوامة 🎣", "اليوم طلعلي ذهبية! بس فلتت 😭", "السمك أطيب لما حدا بيصطاده بإيده 🐟", "فيه صنارة جاهزة عالمرسى، جربوا!"] },
    { id: "reem", name: "ريم", emoji: "🏐", isle: 1, look: { gender: "girl", color: "#ffb347", hair: "#3b2a20", hairStyle: "ponytail", skin: "#f2c9a0" }, pos: [-45, 1195.2], face: 0, stay: true, scale: 0.82,
      lines: ["بنلعب طائرة! تعالوا العبوا معنا 🏐", "حمزة دايماً بيخسر 😂", "أنا بطلة الشاطئ! 🏆", "الكرة عالية… خدوها!"] },
    { id: "hamza", name: "حمزة الصغير", emoji: "🧒", isle: 1, look: { gender: "boy", color: "#2fa86a", pants: "#2f6fb5", hair: "#2a1d12", hairStyle: "short" }, pos: [-45, 1204.8], face: 3.14, stay: true, scale: 0.75,
      lines: ["هي مش غلطتي! الشمس بعيوني ☀️", "المرة الجاي بفوز! 💪", "بدي بوظة بعد المباراة 🍦"] },
    { id: "nada", name: "ندى الرسامة", emoji: "🎨", isle: 1, look: { gender: "girl", color: "#b565b0", hair: "#222", hairStyle: "ponytail", skin: "#efc8a0" }, pos: [-20, 1203], face: 0.6, stay: true,
      lines: ["برسم غروب الجزيرة 🌅", "عندكم غرفة رسم ببيتكم؟ سمعت إنها حلوة! 🎨", "الألوان بتحكي اللي ما بتقدر الكلمات 💜", "ارسموا لي زرافة بتطير! 🦒"] },
    { id: "umnabil", name: "أم نبيل", emoji: "👩‍🦳", isle: 1, speed: 1.4, look: { gender: "girl", color: "#2a9d8f", hair: "#eee", hairStyle: "hijab", skin: "#e6bb94" }, pos: [10, 1140],
      lines: ["جيت أتمشى بالجزيرة، هواها غير! 🌴", "الله يخليكم لبعض يا حبايبي ❤️", "وين الكراسي؟ رجليّ تعبوا 😅", "الطريق إلها طويييل بس يستاهل 🚗"] },
    { id: "jack", name: "جاك السائح", emoji: "📸", isle: 1, speed: 1.7, look: { gender: "boy", color: "#ffd23f", pants: "#e8d9b0", hair: "#8a5a2b", hairStyle: "short", skin: "#f5d3b3" }, pos: [-18, 1160],
      lines: ["Beautiful island! بدي صورة معكم 📸", "هاي أحلى مكان شفته بحياتي!", "وين ألاقي أحسن بوظة؟ 🍦", "شكراً! بحب الأردن ❤️"] },
    { id: "abukhaled", name: "أبو خالد", emoji: "👨‍🌾", home: "v1", look: { gender: "boy", color: "#8a6a3b", pants: "#4a4a4a", hair: "#555", hairStyle: "short", mustache: true }, speed: 1.8,
      lines: ["صباح الخير يا نشامى! الجو حلو اليوم 🌤️", "سمعت إنو المزرعة عندكم بتحمّل طماطم! 🍅", "أنا بدور على قطتي من الصبح… شفتوها؟ 🐈", "أنا بحب أمشي بالساحة قبل المغرب."] },
    { id: "umahmad", name: "أم أحمد", emoji: "👩", home: "v2", look: { gender: "girl", color: "#b04a7a", hair: "#2b1d14", hairStyle: "hijab", skin: "#efc8a0" }, speed: 1.6,
      lines: ["يا ويلي على العشا اليوم! بدي كم حبة بندورة 🍅", "الله يخليكم لبعض، الحب الحلو بيبان 💕", "ابني أحمد مش بيسمع كلامي أبداً 😅", "وين بتروحوا؟ الساحة اليوم حلوة!"] },
    { id: "samer", name: "المعلّم سامر", emoji: "👨‍🏫", home: "v3", look: { gender: "boy", color: "#3b5ba5", pants: "#2c2c3a", hair: "#222", hairStyle: "short" }, speed: 1.9,
      lines: ["العلم نور… والحب نور فوق نور 📚", "كل يوم سؤال جديد بالنافورة، جاوبتوا؟ ⛲", "مين بيعرف عاصمة الأردن؟ عمّان طبعاً! 😄", "الصبر مفتاح الفرج، بس الورد بدو ماي كل يوم 🌹"] },
    { id: "khalasuad", name: "الخالة سعاد", emoji: "🧕", home: "v4", look: { gender: "girl", color: "#2a8f78", hair: "#f0e9d6", hairStyle: "hijab", skin: "#e6bb94" }, speed: 1.5,
      lines: ["يا حبيبي ما في أحلى من ورد الحب! 🌹", "جيت من السوق، الأسعار ولعت يا ناس!", "ربنا يتمم لكم عالخير ويفرّحكم دايماً ✨"] },
    { id: "abuali", name: "أبو علي", emoji: "👮", home: "v5", look: { gender: "boy", color: "#39507a", pants: "#26324a", hair: "#222", hairStyle: "cap", cap: "#26324a", mustache: true }, speed: 1.8,
      lines: ["القرية آمنة والحمدلله… بس اللي بيدوس عالورد بخالفو! 😠", "أنا الشرطي الوحيد هون، يعني أنا المدير 😎", "ممنوع الركض عالساحة… إلا إذا كنتوا تلحقوا بعض 😂", "إنتوا أحلى ثنائي بالقرية، شهادة من الشرطة!"] },
    { id: "fadi", name: "فادي الصغير", emoji: "🧒", home: "v6", look: { gender: "boy", color: "#e5484d", pants: "#2f6fb5", hair: "#3b2a20", hairStyle: "short" }, speed: 2.8, scale: 0.68,
      lines: ["بدي بوظة! 🍦 معكم مصاري؟", "بتعرفوا؟ أنا بسابق أي حدا بالقرية! 🏃", "أنا شفت الكنز المخبّى… بس ما بقول وين 🤫", "ليش الكبار دايماً مشغولين؟"] },
  ];
  OSW.NPC_BY = Object.fromEntries(OSW.NPCS.map((n) => [n.id, n]));
})();
