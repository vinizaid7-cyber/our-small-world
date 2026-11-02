/* محرّك رسوم WebGL صغير (بدون مكتبات خارجية) */
(function () {
  const OSW = window.OSW;
  const hypot = Math.hypot, sin = Math.sin, cos = Math.cos, PI = Math.PI;

  /* ---------- مصفوفات 4x4 (column-major) ---------- */
  const T = new Float32Array(16), T2 = new Float32Array(16), T3 = new Float32Array(16);
  const M = (OSW.M = {
    ident(o) { o = o || new Float32Array(16); o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; },
    mul(a, b, o) {
      o = o || new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; T[c * 4 + r] = s; }
      o.set(T); return o;
    },
    rotY(a, o) { o = M.ident(o); const c = cos(a), s = sin(a); o[0] = c; o[8] = s; o[2] = -s; o[10] = c; return o; },
    rotX(a, o) { o = M.ident(o); const c = cos(a), s = sin(a); o[5] = c; o[9] = -s; o[6] = s; o[10] = c; return o; },
    rotZ(a, o) { o = M.ident(o); const c = cos(a), s = sin(a); o[0] = c; o[4] = -s; o[1] = s; o[5] = c; return o; },
    // T * Ry * Rx * Rz * S
    trs(x, y, z, ry, rx, rz, sx, sy, sz, o) {
      o = o || new Float32Array(16);
      M.rotY(ry || 0, T2);
      if (rx) { M.rotX(rx, T3); M.mul(T2, T3, T2); }
      if (rz) { M.rotZ(rz, T3); M.mul(T2, T3, T2); }
      o.set(T2);
      sx = sx == null ? 1 : sx; sy = sy == null ? sx : sy; sz = sz == null ? sx : sz;
      o[0] *= sx; o[1] *= sx; o[2] *= sx; o[4] *= sy; o[5] *= sy; o[6] *= sy; o[8] *= sz; o[9] *= sz; o[10] *= sz;
      o[12] = x; o[13] = y; o[14] = z; return o;
    },
    perspective(fov, asp, n, f, o) {
      o = o || new Float32Array(16); o.fill(0); const t = 1 / Math.tan(fov / 2);
      o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = (2 * f * n) / (n - f); return o;
    },
    lookAt(e, c, o) {
      o = o || new Float32Array(16);
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
      let xx = zz, xy = 0, xz = -zx; l = hypot(xx, xz) || 1; xx /= l; xz /= l;           // up = (0,1,0) → x = up × z
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0; o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0; o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
      o[12] = -(xx * e[0] + xy * e[1] + xz * e[2]); o[13] = -(yx * e[0] + yy * e[1] + yz * e[2]); o[14] = -(zx * e[0] + zy * e[1] + zz * e[2]); o[15] = 1;
      return o;
    },
    invert(m, o) {
      o = o || new Float32Array(16);
      const a = m, b = new Float32Array(16);
      const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
      let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!d) return null; d = 1 / d;
      b[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d; b[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d; b[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d; b[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d;
      b[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d; b[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d; b[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d; b[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d;
      b[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d; b[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d; b[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d; b[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d;
      b[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d; b[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d; b[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d; b[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d;
      o.set(b); return o;
    },
    pt(m, x, y, z) {
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w, w];
    },
  });

  /* ---------- ألوان ---------- */
  const cc = {};
  const rgb = (c) => {
    if (Array.isArray(c)) return c;
    if (cc[c]) return cc[c];
    let h = c.replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const v = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255);
    return (cc[c] = v);
  };
  const mixc = (a, b, t) => { const A = rgb(a), B = rgb(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
  OSW.col = { rgb, mix: mixc, dk: (c, t) => mixc(c, "#000000", t), lt: (c, t) => mixc(c, "#ffffff", t) };

  /* ---------- بنّاء المجسّمات ---------- */
  function normalMat(m) {
    const a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10];
    const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C || 1;
    return [A / det, (c * h - b * i) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, (c * d - a * f) / det, C / det, (b * g - a * h) / det, (a * e - b * d) / det];
  }
  class Builder {
    constructor() { this.a = []; this.st = []; this.m = M.ident(); this.nm = [1, 0, 0, 0, 1, 0, 0, 0, 1]; }
    push(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy, sz) {
      this.st.push([this.m, this.nm]);
      const l = M.trs(x, y, z, ry, rx, rz, sx, sy, sz);
      this.m = M.mul(this.m, l, new Float32Array(16)); this.nm = normalMat(this.m); return this;
    }
    pop() { const s = this.st.pop(); this.m = s[0]; this.nm = s[1]; return this; }
    _v(p, n, c, e) {
      const m = this.m, q = this.nm, x = p[0], y = p[1], z = p[2];
      let nx = q[0] * n[0] + q[3] * n[1] + q[6] * n[2], ny = q[1] * n[0] + q[4] * n[1] + q[7] * n[2], nz = q[2] * n[0] + q[5] * n[1] + q[8] * n[2];
      const l = hypot(nx, ny, nz) || 1;
      this.a.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14], nx / l, ny / l, nz / l, c[0], c[1], c[2], e);
    }
    tri(p0, p1, p2, n0, n1, n2, c, e) { this._v(p0, n0, c, e); this._v(p1, n1, c, e); this._v(p2, n2, c, e); }
    quad(p0, p1, p2, p3, n, c, e) { this.tri(p0, p1, p2, n, n, n, c, e); this.tri(p0, p2, p3, n, n, n, c, e); }
    box(x, y, z, w, h, d, col, e = 0) {
      const c = rgb(col), X = w / 2, Z = d / 2, y1 = y + h;
      const A = [x - X, y, z + Z], B = [x + X, y, z + Z], C = [x + X, y1, z + Z], D = [x - X, y1, z + Z];
      const E = [x - X, y, z - Z], F = [x + X, y, z - Z], G = [x + X, y1, z - Z], H = [x - X, y1, z - Z];
      this.quad(A, B, C, D, [0, 0, 1], c, e); this.quad(F, E, H, G, [0, 0, -1], c, e);
      this.quad(B, F, G, C, [1, 0, 0], c, e); this.quad(E, A, D, H, [-1, 0, 0], c, e);
      this.quad(D, C, G, H, [0, 1, 0], c, e); this.quad(E, F, B, A, [0, -1, 0], c, e);
      return this;
    }
    cyl(x, y, z, r0, r1, h, col, seg = 10, e = 0, capB = false, arc) {
      const c = rgb(col), a0 = arc ? arc[0] : 0, da = ((arc ? arc[1] : PI * 2) - a0) / seg, sl = (r0 - r1) / (h || 1);
      for (let i = 0; i < seg; i++) {
        const t0 = a0 + i * da, t1 = t0 + da, c0 = cos(t0), s0 = sin(t0), c1 = cos(t1), s1 = sin(t1);
        const b0 = [x + r0 * c0, y, z + r0 * s0], b1 = [x + r0 * c1, y, z + r0 * s1], t0p = [x + r1 * c0, y + h, z + r1 * s0], t1p = [x + r1 * c1, y + h, z + r1 * s1];
        const n0 = [c0, sl, s0], n1 = [c1, sl, s1];
        this.tri(b0, b1, t1p, n0, n1, n1, c, e); this.tri(b0, t1p, t0p, n0, n1, n0, c, e);
        if (r1 > 0.001) this.tri([x, y + h, z], t1p, t0p, [0, 1, 0], [0, 1, 0], [0, 1, 0], c, e);
        if (capB && r0 > 0.001) this.tri([x, y, z], b0, b1, [0, -1, 0], [0, -1, 0], [0, -1, 0], c, e);
      }
      return this;
    }
    sphere(x, y, z, rx, ry, rz, col, seg = 8, e = 0, hemi = false) {
      const c = rgb(col), rings = Math.max(3, Math.round(seg * 0.7)), maxp = hemi ? PI / 2 : PI;
      const P = (i, j) => { const ph = (i / rings) * maxp, th = (j / seg) * PI * 2, sp = sin(ph); return [[x + rx * sp * cos(th), y + ry * cos(ph), z + rz * sp * sin(th)], [sp * cos(th) / rx, cos(ph) / ry, sp * sin(th) / rz]]; };
      for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
        const a = P(i, j), b = P(i + 1, j), d = P(i, j + 1), f = P(i + 1, j + 1);
        this.tri(a[0], b[0], f[0], a[1], b[1], f[1], c, e); this.tri(a[0], f[0], d[0], a[1], f[1], d[1], c, e);
      }
      return this;
    }
    // سقف مثلّث (ريدج على محور z)
    prism(x, y, z, w, h, d, col, e = 0) {
      const c = rgb(col), X = w / 2, Z = d / 2, L = [x - X, y, z - Z], L2 = [x - X, y, z + Z], R = [x + X, y, z - Z], R2 = [x + X, y, z + Z], T0 = [x, y + h, z - Z], T1 = [x, y + h, z + Z];
      const nl = [-h, X, 0], nr = [h, X, 0];
      this.quad(L, T0, T1, L2, nl, c, e); this.quad(R2, T1, T0, R, nr, c, e);
      this.tri(L2, R2, T1, [0, 0, 1], [0, 0, 1], [0, 0, 1], c, e); this.tri(R, L, T0, [0, 0, -1], [0, 0, -1], [0, 0, -1], c, e);
      return this;
    }
    disc(x, y, z, r, col, seg = 20, e = 0) {
      const c = rgb(col);
      for (let i = 0; i < seg; i++) { const a = (i / seg) * PI * 2, b = ((i + 1) / seg) * PI * 2; this.tri([x, y, z], [x + r * cos(b), y, z + r * sin(b)], [x + r * cos(a), y, z + r * sin(a)], [0, 1, 0], [0, 1, 0], [0, 1, 0], c, e); }
      return this;
    }
    // شريط مسطّح بعرض ثابت على طول نقاط
    strip(pts, width, y, col) {
      const c = rgb(col), hw = width / 2;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], dx = x1 - x0, dz = z1 - z0, l = hypot(dx, dz) || 1, nx = (-dz / l) * hw, nz = (dx / l) * hw;
        this.quad([x0 + nx, y, z0 + nz], [x1 + nx, y, z1 + nz], [x1 - nx, y, z1 - nz], [x0 - nx, y, z0 - nz], [0, 1, 0], c, 0);
        this.disc(x1, y, z1, hw, col, 10);
      }
      this.disc(pts[0][0], y, pts[0][1], hw, col, 10);
      return this;
    }
    build(gl) {
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.a), gl.STATIC_DRAW);
      return { buf, n: this.a.length / 10, gl };
    }
  }
  OSW.Builder = Builder;

  /* ---------- الرسّام ---------- */
  const VS = `attribute vec3 aPos;attribute vec3 aNor;attribute vec3 aCol;attribute float aEm;
uniform mat4 uVP;uniform mat4 uModel;uniform vec3 uSunDir;uniform vec3 uSunCol;uniform vec3 uAmbTop;uniform vec3 uAmbBot;uniform vec3 uCam;
uniform float uNight;uniform float uFogN;uniform float uFogF;uniform vec4 uTint;uniform float uSway;uniform float uTime;
varying vec3 vCol;varying float vFog;
void main(){
  vec4 wp=uModel*vec4(aPos,1.0);
  wp.x+=sin(uTime*1.3+wp.z*0.4)*uSway*max(aPos.y,0.0)*0.02;
  vec3 n=normalize(mat3(uModel[0].xyz,uModel[1].xyz,uModel[2].xyz)*aNor);
  float d=max(dot(n,-uSunDir),0.0);
  vec3 amb=mix(uAmbBot,uAmbTop,n.y*0.5+0.5);
  vec3 base=aCol*uTint.rgb;
  vec3 lit=base*(amb+uSunCol*d);
  vCol=mix(lit,base*1.6,aEm*uNight);
  float dist=length(wp.xyz-uCam);
  vFog=clamp((dist-uFogN)/(uFogF-uFogN),0.0,1.0);
  gl_Position=uVP*wp;
}`;
  const FS = `precision mediump float;varying vec3 vCol;varying float vFog;uniform float uAlpha;
void main(){float a=(1.0-vFog)*uAlpha;gl_FragColor=vec4(vCol*a,a);}`;

  const R = (OSW.R = { gl: null, canvas: null, vp: new Float32Array(16), ivp: new Float32Array(16), eye: [0, 0, 0], u: {}, drawn: 0 });
  const mdl = new Float32Array(16);
  R.init = (canvas) => {
    let gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, powerPreference: "high-performance" }) || canvas.getContext("experimental-webgl");
    if (!gl) return false;
    R.gl = gl; R.canvas = canvas;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(p, 0, "aPos"); gl.bindAttribLocation(p, 1, "aNor"); gl.bindAttribLocation(p, 2, "aCol"); gl.bindAttribLocation(p, 3, "aEm");
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p); R.prog = p;
    ["uVP", "uModel", "uSunDir", "uSunCol", "uAmbTop", "uAmbBot", "uCam", "uNight", "uFogN", "uFogF", "uTint", "uSway", "uTime", "uAlpha"].forEach((n) => (R.u[n] = gl.getUniformLocation(p, n)));
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.clearColor(0, 0, 0, 0);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
    return true;
  };
  R.resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.6 : 2);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (R.canvas.width !== w || R.canvas.height !== h) { R.canvas.width = w; R.canvas.height = h; }
    R.gl.viewport(0, 0, w, h); R.aspect = w / h;
  };
  // env: {sunDir,sunCol,ambTop,ambBot,night,fogN,fogF,time}
  R.begin = (eye, target, fov, env) => {
    const gl = R.gl, u = R.u;
    const proj = M.perspective(fov, R.aspect, 0.8, 520), view = M.lookAt(eye, target);
    M.mul(proj, view, R.vp); M.invert(R.vp, R.ivp); R.eye = eye;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u.uVP, false, R.vp); gl.uniform3fv(u.uSunDir, env.sunDir); gl.uniform3fv(u.uSunCol, env.sunCol);
    gl.uniform3fv(u.uAmbTop, env.ambTop); gl.uniform3fv(u.uAmbBot, env.ambBot); gl.uniform3fv(u.uCam, eye);
    gl.uniform1f(u.uNight, env.night); gl.uniform1f(u.uFogN, env.fogN); gl.uniform1f(u.uFogF, env.fogF); gl.uniform1f(u.uTime, env.time);
    gl.disable(gl.BLEND); R.drawn = 0;
  };
  R.blend = (on) => { const gl = R.gl; if (on) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); } else { gl.disable(gl.BLEND); gl.depthMask(true); } };
  // model: مصفوفة جاهزة أو null (هوية)
  R.draw = (mesh, model, tint, alpha, sway) => {
    if (!mesh || !mesh.n) return;
    const gl = R.gl, u = R.u;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 40, 24); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 40, 36);
    gl.uniformMatrix4fv(u.uModel, false, model || M.ident(mdl));
    const t = tint || [1, 1, 1]; gl.uniform4f(u.uTint, t[0], t[1], t[2], 1);
    gl.uniform1f(u.uAlpha, alpha == null ? 1 : alpha); gl.uniform1f(u.uSway, sway || 0);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.n); R.drawn++;
  };
  R.free = (mesh) => { if (mesh && mesh.buf) mesh.gl.deleteBuffer(mesh.buf); };
  // شعاع من نقطة على الشاشة (إحداثيات CSS)
  R.ray = (px, py) => {
    const nx = (px / innerWidth) * 2 - 1, ny = 1 - (py / innerHeight) * 2;
    const a = M.pt(R.ivp, nx, ny, -1), b = M.pt(R.ivp, nx, ny, 1);
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = hypot(d[0], d[1], d[2]);
    return { o: a, d: [d[0] / l, d[1] / l, d[2] / l] };
  };
  R.project = (x, y, z) => {
    const p = M.pt(R.vp, x, y, z);
    return { x: (p[0] * 0.5 + 0.5) * innerWidth, y: (0.5 - p[1] * 0.5) * innerHeight, w: p[3], z: p[2] };
  };
  // تقاطع شعاع مع كرة
  R.hitSphere = (ray, cx, cy, cz, r) => {
    const ox = ray.o[0] - cx, oy = ray.o[1] - cy, oz = ray.o[2] - cz;
    const b = ox * ray.d[0] + oy * ray.d[1] + oz * ray.d[2], c = ox * ox + oy * oy + oz * oz - r * r, disc = b * b - c;
    if (disc < 0) return -1; const t = -b - Math.sqrt(disc); return t > 0 ? t : -1;
  };
  R.hitGround = (ray, y = 0) => { if (Math.abs(ray.d[1]) < 1e-5) return null; const t = (y - ray.o[1]) / ray.d[1]; return t > 0 ? [ray.o[0] + ray.d[0] * t, ray.o[2] + ray.d[2] * t] : null; };
})();
