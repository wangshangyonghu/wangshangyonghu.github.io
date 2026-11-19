var ra = Object.defineProperty;
var aa = (t, e, n) => e in t ? ra(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var P = (t, e, n) => aa(t, typeof e != "symbol" ? e + "" : e, n);
import { openDwfDocument as ca, DwfViewer as la } from "./dwf/dist/index.js";
async function ht(t) {
  if (t.buffer instanceof Uint8Array) return t.buffer;
  if (t.buffer instanceof ArrayBuffer) return new Uint8Array(t.buffer);
  if (t.file) return new Uint8Array(await t.file.arrayBuffer());
  throw new Error("CadLoadInput requires a File, ArrayBuffer, or Uint8Array.");
}
function ha(t) {
  return t.byteOffset === 0 && t.byteLength === t.buffer.byteLength ? t.buffer : t.slice().buffer;
}
function Oe(t) {
  var s, i, o;
  const e = (o = (i = t.fileName) != null ? i : (s = t.file) == null ? void 0 : s.name) != null ? o : "", n = e.lastIndexOf(".");
  return n >= 0 ? e.slice(n + 1).toLowerCase() : "";
}
function _e(t, e) {
  const n = Oe(t);
  if (n === "dwg") return "dwg";
  if (n === "dxf") return "dxf";
  if (n === "dwfx") return "dwfx";
  if (n === "xps") return "xps";
  if (n === "dwf") return "dwf";
  if (e && e.byteLength >= 6) {
    const s = co(e.slice(0, 6));
    if (/^AC10/.test(s)) return "dwg";
    if (e[0] === 80 && e[1] === 75) return "dwfx";
    const i = co(e.slice(0, Math.min(e.byteLength, 2048))).toUpperCase();
    if (i.includes("SECTION") && i.includes("ENTITIES")) return "dxf";
    if (i.includes("DWF")) return "dwf";
  }
  return "unknown";
}
function co(t) {
  return Array.from(t, (e) => e >= 32 && e <= 126 ? String.fromCharCode(e) : " ").join("");
}
class ua {
  constructor(e = []) {
    P(this, "loaders", []);
    for (const n of e) this.register(n);
  }
  register(e) {
    const n = this.loaders.findIndex((s) => s.id === e.id);
    return n >= 0 ? this.loaders.splice(n, 1, e) : this.loaders.push(e), this;
  }
  unregister(e) {
    const n = this.loaders.findIndex((s) => s.id === e);
    return n >= 0 && this.loaders.splice(n, 1), this;
  }
  list() {
    return [...this.loaders];
  }
  async detect(e) {
    const n = await ht(e), s = _e(e, n), i = this.loaders.find((r) => r.formats.includes(s) && r.accepts(e, n));
    if (i) return { loader: i, bytes: n, format: s };
    const o = this.loaders.find((r) => r.accepts(e, n));
    if (o) return { loader: o, bytes: n, format: s };
    throw new Error(`No CAD loader registered for ${s === "unknown" ? "this file" : s.toUpperCase()}.`);
  }
  async load(e, n = {}) {
    const { loader: s, bytes: i } = await this.detect(e);
    return s.load({ ...e, buffer: i }, n);
  }
}
const fa = "wasm/dwg-worker.js";
class da {
  constructor() {
    P(this, "worker");
    P(this, "sequence", 0);
    P(this, "pending", /* @__PURE__ */ new Map());
  }
  load(e, n, s = {}) {
    var l, h, u, f, d;
    if (!an()) throw new Error("Web Worker is not available in this runtime.");
    const i = this.ensureWorker(s), o = ++this.sequence, r = Math.max(0, Number((l = s.workerTimeoutMs) != null ? l : 0)), a = (f = (h = s.fileName) != null ? h : n.fileName) != null ? f : (u = n.file) == null ? void 0 : u.name, c = pa(e, n, s);
    return (d = s.onProgress) == null || d.call(s, { phase: "worker-start", format: "dwg", message: "Dispatching DWG parse to worker…", total: e.byteLength }), new Promise((m, p) => {
      var g;
      if ((g = s.signal) != null && g.aborted) {
        p(St());
        return;
      }
      const b = { resolve: m, reject: p, onProgress: s.onProgress, signal: s.signal };
      r > 0 && (b.timer = setTimeout(() => {
        this.pending.delete(o), this.resetWorker(), p(new Error(`DWG worker timed out after ${r} ms.`));
      }, r)), s.signal && (b.abortHandler = () => {
        this.pending.delete(o), this.resetWorker(), p(St());
      }, s.signal.addEventListener("abort", b.abortHandler, { once: !0 })), this.pending.set(o, b);
      try {
        i.postMessage({
          type: "load",
          requestId: o,
          bytes: c,
          fileName: a,
          options: lo(s)
        }, [c]);
      } catch (y) {
        this.pending.delete(o), Ct(b), p(y instanceof Error ? y : new Error(String(y)));
      }
    });
  }
  preload(e = {}) {
    var o, r;
    if (!an()) return Promise.reject(new Error("Web Worker is not available in this runtime."));
    const n = this.ensureWorker(e), s = ++this.sequence, i = Math.max(0, Number((o = e.workerTimeoutMs) != null ? o : 0));
    return (r = e.onProgress) == null || r.call(e, { phase: "worker-start", format: "dwg", message: "Starting DWG worker warmup…" }), new Promise((a, c) => {
      var h;
      if ((h = e.signal) != null && h.aborted) {
        c(St());
        return;
      }
      const l = {
        resolve: () => a(),
        reject: c,
        onProgress: e.onProgress,
        signal: e.signal
      };
      i > 0 && (l.timer = setTimeout(() => {
        this.pending.delete(s), this.resetWorker(), c(new Error(`DWG worker warmup timed out after ${i} ms.`));
      }, i)), e.signal && (l.abortHandler = () => {
        this.pending.delete(s), this.resetWorker(), c(St());
      }, e.signal.addEventListener("abort", l.abortHandler, { once: !0 })), this.pending.set(s, l);
      try {
        n.postMessage({ type: "warmup", requestId: s, options: lo(e) });
      } catch (u) {
        this.pending.delete(s), Ct(l), c(u instanceof Error ? u : new Error(String(u)));
      }
    });
  }
  terminate() {
    this.resetWorker();
  }
  ensureWorker(e) {
    return this.worker || (this.worker = ma(e), this.worker.onmessage = (n) => this.handleMessage(n.data), this.worker.onerror = (n) => {
      const s = n.message || "DWG worker failed.";
      this.rejectAll(new Error(s)), this.resetWorker(!1);
    }, this.worker.onmessageerror = () => {
      this.rejectAll(new Error("DWG worker returned a message that could not be cloned.")), this.resetWorker(!1);
    }), this.worker;
  }
  handleMessage(e) {
    var i, o;
    if (e.type === "ready") return;
    const n = this.pending.get(e.requestId);
    if (!n) return;
    if (e.type === "progress") {
      (i = n.onProgress) == null || i.call(n, e.progress);
      return;
    }
    if (this.pending.delete(e.requestId), Ct(n), e.type === "result") {
      n.resolve(e.result);
      return;
    }
    if (e.type === "warmup-result") {
      (o = n.onProgress) == null || o.call(n, { phase: "worker-ready", format: "dwg", message: "DWG worker warmup complete.", percent: 100, elapsedMs: e.elapsedMs }), n.resolve(void 0);
      return;
    }
    const s = new Error(e.error.message);
    s.name = e.error.name || "DwgWorkerError", e.error.stack && (s.stack = e.error.stack), n.reject(s);
  }
  rejectAll(e) {
    for (const [, n] of this.pending)
      Ct(n), n.reject(e);
    this.pending.clear();
  }
  resetWorker(e = !0) {
    var n;
    e && this.rejectAll(new Error("DWG worker was terminated.")), (n = this.worker) == null || n.terminate(), this.worker = void 0;
  }
}
function an() {
  return typeof Worker != "undefined" && typeof URL != "undefined";
}
function ma(t) {
  return t.workerFactory ? t.workerFactory() : new Worker(ba(t.workerUrl), { type: "module", name: "lightweight-cad-dwg-loader" });
}
function lo(t) {
  return {
    // Resolve the asset directory on the UI thread. Relative paths such as
    // './wasm' must be relative to the document URL, not to the generated
    // worker chunk URL. Otherwise the worker may request /assets/wasm/... and
    // receive the app's HTML fallback instead of libredwg-web.wasm.
    wasmPath: ga(t.wasmPath),
    includePaperSpace: t.includePaperSpace,
    maxInsertDepth: t.maxInsertDepth,
    keepRaw: !!t.keepRaw
  };
}
function pa(t, e, n) {
  return !!e.file || n.transferInputBuffer === !0 ? ha(t) : t.slice().buffer;
}
function Ct(t) {
  t.timer && clearTimeout(t.timer), t.signal && t.abortHandler && t.signal.removeEventListener("abort", t.abortHandler);
}
function St() {
  if (typeof DOMException != "undefined") return new DOMException("DWG loading was aborted.", "AbortError");
  const t = new Error("DWG loading was aborted.");
  return t.name = "AbortError", t;
}
function ga(t) {
  const e = ((t == null ? void 0 : t.trim()) || "/wasm").replace(/\/+$/, "");
  return e === "" ? ho() : or(e) ? e : e.startsWith("/") ? `${ho()}${e}` : new URL(e, Cn()).href.replace(/\/+$/, "");
}
function ba(t) {
  if (t instanceof URL) return t;
  const e = (t == null ? void 0 : t.trim()) || fa;
  return or(e) ? e : new URL(e, Cn()).href;
}
function Cn() {
  return typeof document != "undefined" && document.baseURI ? document.baseURI : typeof location != "undefined" && location.href ? location.href : "http://localhost/";
}
function ho() {
  return typeof location != "undefined" && location.origin ? location.origin : new URL(Cn()).origin;
}
function or(t) {
  return /^[a-z][a-z0-9+.-]*:/i.test(t);
}
class ya {
  constructor(e = {}) {
    P(this, "id", "dwg");
    P(this, "label", "DWG / LibreDWG WebAssembly");
    P(this, "formats", ["dwg"]);
    P(this, "defaults");
    P(this, "workerClient", new da());
    this.defaults = { useWorker: !0, ...e };
  }
  accepts(e, n) {
    return Oe(e) === "dwg" ? !0 : _e(e, n) === "dwg";
  }
  async load(e, n = {}) {
    var r, a, c;
    const s = { ...this.defaults, ...n };
    (r = s.onProgress) == null || r.call(s, { phase: "read", format: "dwg", message: "Reading DWG bytes…" });
    const i = await ht(e), o = (c = e.fileName) != null ? c : (a = e.file) == null ? void 0 : a.name;
    if (s.useWorker === !1)
      throw new Error("DWG main-thread parsing is intentionally not bundled by the default viewer. Keep useWorker enabled, or register a custom DWG loader for non-browser runtimes.");
    if (!an())
      throw new Error("DWG loading requires Web Worker support in this build. Provide a custom loader for this runtime.");
    try {
      return await this.workerClient.load(i, e, { ...s, fileName: o });
    } catch (l) {
      throw xa(l) ? l : va(l);
    }
  }
  terminateWorker() {
    this.workerClient.terminate();
  }
  preload(e = {}) {
    const n = { ...this.defaults, ...e };
    return n.useWorker === !1 ? Promise.reject(new Error("DWG preload requires worker mode in the default viewer.")) : this.workerClient.preload(n);
  }
}
function xa(t) {
  return t instanceof Error && t.name === "AbortError";
}
function va(t) {
  const e = t instanceof Error ? t.message : String(t), n = /worker|fetch|wasm|magic word|mime|network|404|failed to initialize/i.test(e), s = new Error(`${e}${n ? " If the worker asset cannot be resolved by your bundler/CDN, pass workerUrl or workerFactory to CadViewer." : ""}`);
  return t instanceof Error && (s.name = t.name, s.stack = t.stack), s;
}
const uo = 4096, wa = 256, Ca = 2e4, Sa = 2e6, Na = 5e4;
function ka(t) {
  var f, d, m, p, b, g;
  const e = [], n = { status: "unsupported", patternName: typeof t.patternName == "string" ? t.patternName : void 0, segments: [], dots: [], diagnostics: [] }, s = (y, x = !1) => (n.status = x ? "budget-exceeded" : "unsupported", n.segments = [], n.dots = [], n.diagnostics = [y], { loops: e, hatch: n }), i = t.boundaryPaths;
  if (!Array.isArray(i) || !i.length) return s("HATCH has no supported boundary paths.");
  if (i.length > 128) return s("HATCH boundary budget exceeded.", !0);
  let o = 0;
  for (const y of i) {
    const x = st(y);
    if (!x) return s("HATCH contains an invalid boundary.");
    const v = [];
    if (Array.isArray(x.vertices)) {
      if (x.isClosed !== !0 && x.isClosed !== 1) return s("Open HATCH polyline boundaries are unsupported.");
      if (x.vertices.length + o > uo) return s("HATCH vertex budget exceeded.", !0);
      for (const w of x.vertices) {
        const C = ke(w);
        if (!C || Number((d = (f = st(w)) == null ? void 0 : f.bulge) != null ? d : 0) !== 0) return s("Curved or invalid HATCH polyline boundaries are unsupported.");
        v.push(C);
      }
    } else if (Array.isArray(x.edges)) {
      if (x.edges.length + o > uo) return s("HATCH vertex budget exceeded.", !0);
      let w;
      for (const C of x.edges) {
        const S = st(C), D = ke(S == null ? void 0 : S.start), L = ke(S == null ? void 0 : S.end);
        if (Number(S == null ? void 0 : S.type) !== 1 || !D || !L) return s("Nonlinear or invalid HATCH boundary edges are unsupported.");
        if (w && !Vt(w, D)) return s("Disconnected HATCH boundary edges are unsupported.");
        v.push(D), w = L;
      }
      if (!w || !v.length || !Vt(w, v[0])) return s("Open HATCH boundaries are unsupported.");
    } else return s("HATCH boundary geometry is unsupported.");
    if (v.length > 1 && Vt(v[0], v[v.length - 1]) && v.pop(), v.length < 3) return s("HATCH boundary requires at least three vertices.");
    o += v.length, e.push({ vertices: v, isClosed: !0 });
  }
  const r = ke(t.extrusionDirection);
  if (r && (Math.abs(r.x) > 1e-10 || Math.abs(r.y) > 1e-10 || Math.abs(((m = r.z) != null ? m : 1) - 1) > 1e-10))
    return s("Non-WCS HATCH extrusion is unsupported.");
  if (Number((p = t.solidFill) != null ? p : 0) !== 0 || Number((b = t.gradientFlag) != null ? b : 0) !== 0) return s("This HATCH compiler supports line patterns only.");
  if (e.length > 1 && Number((g = t.hatchStyle) != null ? g : 0) !== 0) return s("Nested HATCH boundaries require normal island detection.");
  const a = t.definitionLines;
  if (!Array.isArray(a) || !a.length) return s("HATCH has no usable pattern definition lines.");
  if (a.length > wa) return s("HATCH definition budget exceeded.", !0);
  let c = 0;
  const l = (y) => {
    if (c += y, !Number.isFinite(c) || c > Sa) throw new Error("budget");
  }, h = (y, x) => {
    if (n.segments.length + n.dots.length >= Na) throw new Error("budget");
    if (!ke(y) || x && !ke(x)) throw new Error("invalid");
    x ? n.segments.push({ start: y, end: x }) : n.dots.push(y);
  }, u = e.map((y) => y.vertices);
  try {
    for (const y of a) {
      const x = st(y), v = it(x == null ? void 0 : x.angle), w = ke(x == null ? void 0 : x.base), C = ke(x == null ? void 0 : x.offset), S = x == null ? void 0 : x.dashLengths;
      if (v === void 0 || !w || !C || !Array.isArray(S) || S.length > 256 || !S.every((B) => typeof B == "number" && Number.isFinite(B))) throw new Error("invalid");
      const D = Math.cos(v), L = Math.sin(v), I = -L * C.x + D * C.y;
      if (!Number.isFinite(I) || Math.abs(I) < 1e-12) throw new Error("invalid");
      let M = 1 / 0, N = -1 / 0;
      for (const B of u) for (const $ of B) {
        const F = (-L * ($.x - w.x) + D * ($.y - w.y)) / I;
        M = Math.min(M, F), N = Math.max(N, F);
      }
      const A = Math.ceil(M - 1e-8), k = Math.floor(N + 1e-8);
      if (!Number.isSafeInteger(A) || !Number.isSafeInteger(k) || k - A + 1 > Ca) throw new Error("budget");
      l(Math.max(0, k - A + 1) * o);
      const E = S.reduce((B, $) => B + Math.abs($), 0);
      if (S.length && (!Number.isFinite(E) || E < 1e-12)) throw new Error("invalid");
      for (let B = A; B <= k; B++) {
        const $ = { x: w.x + B * C.x, y: w.y + B * C.y }, F = [];
        for (const X of u) for (let H = 0; H < X.length; H++) {
          const W = X[H], Y = X[(H + 1) % X.length], j = -L * (W.x - $.x) + D * (W.y - $.y), ee = -L * (Y.x - $.x) + D * (Y.y - $.y);
          if (j <= 0 && ee > 0 || ee <= 0 && j > 0) {
            const Z = -j / (ee - j);
            F.push(D * (W.x + Z * (Y.x - W.x) - $.x) + L * (W.y + Z * (Y.y - W.y) - $.y));
          }
        }
        if (F.sort((X, H) => X - H), F.length % 2) throw new Error("invalid");
        const O = (X) => ({ x: $.x + X * D, y: $.y + X * L });
        for (let X = 0; X + 1 < F.length; X += 2) {
          const H = F[X], W = F[X + 1];
          if (W - H < 1e-9) continue;
          if (!S.length) {
            h(O(H), O(W));
            continue;
          }
          const Y = Math.floor(H / E) - 1, j = Math.floor(W / E);
          if (!Number.isSafeInteger(Y) || !Number.isSafeInteger(j)) throw new Error("budget");
          l((j - Y + 1) * S.length);
          for (let ee = Y; ee <= j; ee++) {
            let Z = ee * E;
            for (const he of S) {
              const ue = Z + Math.abs(he);
              he > 0 && Math.min(W, ue) - Math.max(H, Z) > 1e-9 ? h(O(Math.max(H, Z)), O(Math.min(W, ue))) : he === 0 && Z >= H && Z <= W && h(O(Z)), Z = ue;
            }
          }
        }
      }
    }
    return n.status = "ready", { loops: e, hatch: n };
  } catch (y) {
    const x = y instanceof Error && y.message === "budget";
    return s(x ? "HATCH pattern geometry budget exceeded; no partial fill was emitted." : "Invalid or unsupported HATCH pattern definition; no partial fill was emitted.", x);
  }
}
function st(t) {
  return t && typeof t == "object" && !Array.isArray(t) ? t : void 0;
}
function it(t) {
  return typeof t == "number" && Number.isFinite(t) ? t : void 0;
}
function ke(t) {
  const e = st(t), n = it(e == null ? void 0 : e.x), s = it(e == null ? void 0 : e.y);
  return n === void 0 || s === void 0 ? void 0 : { x: n, y: s, ...it(e == null ? void 0 : e.z) === void 0 ? {} : { z: it(e == null ? void 0 : e.z) } };
}
function Vt(t, e) {
  return Math.hypot(t.x - e.x, t.y - e.y) <= Math.max(1e-8, Math.max(Math.abs(t.x), Math.abs(t.y), Math.abs(e.x), Math.abs(e.y)) * 1e-12);
}
function Sn(t) {
  var e, n, s, i, o, r, a;
  return {
    format: t.format,
    sourceName: t.sourceName,
    units: t.units,
    header: (e = t.header) != null ? e : {},
    layers: (n = t.layers) != null ? n : {},
    lineTypes: (s = t.lineTypes) != null ? s : {},
    blocks: (i = t.blocks) != null ? i : {},
    entities: (o = t.entities) != null ? o : [],
    pages: t.pages,
    savedView: t.savedView,
    dataLinks: t.dataLinks,
    dataTables: t.dataTables,
    xrecords: t.xrecords,
    dictionaries: t.dictionaries,
    metadata: (r = t.metadata) != null ? r : {},
    warnings: (a = t.warnings) != null ? a : [],
    raw: t.raw
  };
}
function ut(t) {
  switch (String(t != null ? t : "").toUpperCase()) {
    case "LINE":
      return "line";
    case "CIRCLE":
      return "circle";
    case "ARC":
      return "arc";
    case "LWPOLYLINE":
    case "POLYLINE":
    case "POLYLINE_2D":
    case "POLYLINE2D":
    case "POLYLINE_3D":
    case "POLYLINE3D":
    case "LEADER":
    case "MULTILEADER":
      return "polyline";
    case "ELLIPSE":
      return "ellipse";
    case "TEXT":
    case "MTEXT":
    case "ATTRIB":
    case "ATTDEF":
    case "DIMENSION":
      return "text";
    case "POINT":
      return "point";
    case "INSERT":
    case "MINSERT":
      return "insert";
    case "SOLID":
    case "TRACE":
    case "3DFACE":
      return "solid";
    case "HATCH":
      return "hatch";
    case "SPLINE":
      return "spline";
    case "PATH":
    case "XPS_PATH":
    case "DWF_PATH":
      return "path";
    case "IMAGE":
    case "RASTER_IMAGE":
    case "DWF_IMAGE":
      return "image";
    case "VIEWPORT":
      return "viewport";
    case "TABLE":
    case "ACAD_TABLE":
    case "ACDBTABLE":
      return "table";
    default:
      return "unsupported";
  }
}
function bt(t, e, n = {}) {
  var x, v, w, C, S, D, L, I, M, N, A, k, E, B, $, F, O, X, H, W, Y, j, ee, Z, he, ue, ve, we, Ce, Se, Ne, Ge, qe, Ke, Ze, Je, Qe, de, pe, Te, Bn, On, _n, $n, Xn, Hn, Wn, Yn, Un, zn, Vn, jn, Gn, qn, Kn, Zn, Jn, Qn, es, ts, ns, ss, is, os, rs, as, cs, ls, hs, us, fs, ds, ms, ps, gs, bs, ys, xs, vs, ws, Cs, Ss, Ns, ks, Ms, Ps, Ts, As, Es, Ls, Is, Ds, Fs, Rs, Bs, Os, _s, $s, Xs, Hs, Ws, Ys, Us, zs, Vs, js, Gs, qs, Ks, Zs, Js, Qs, ei, ti, ni, si, ii, oi, ri, ai, ci, li, hi, ui, fi, di, mi, pi, gi, bi, yi, xi, vi, wi, Ci, Si, Ni, ki, Mi, Pi, Ti, Ai, Ei, Li, Ii, Di, Fi, Ri, Bi, Oi, _i, $i, Xi, Hi, Wi, Yi, Ui, zi, Vi, ji, Gi, qi, Ki, Zi, Ji, Qi, eo, to, no, so, io, oo, ro;
  const s = e != null ? e : String((w = (v = (x = t.type) != null ? x : t.entityType) != null ? v : t.objectName) != null ? w : "UNKNOWN").toUpperCase(), i = n.includeUnknownProperties === !1 ? { type: s, kind: ut(s) } : { ...t, type: s, kind: ut(s) };
  n.keepRaw && (i.raw = t), i.handle = R((C = t.handle) != null ? C : t.id), i.layer = R((S = t.layer) != null ? S : t.layerName), i.lineType = R((D = t.lineType) != null ? D : t.linetype), i.lineTypeScale = (M = T((I = (L = t.lineTypeScale) != null ? L : t.linetypeScale) != null ? I : t.ltscale)) != null ? M : i.lineTypeScale, i.flag = (A = T((N = t.flag) != null ? N : t.flags)) != null ? A : i.flag, i.constantWidth = (B = T((E = (k = t.constantWidth) != null ? k : t.constWidth) != null ? E : t.const_width)) != null ? B : i.constantWidth, i.thickness = ($ = T(t.thickness)) != null ? $ : i.thickness;
  const o = t.isClosed === !0 || t.closed === !0 || t.shape === !0, r = /^(POLYLINE|POLYLINE_2D|POLYLINE2D|POLYLINE_3D|POLYLINE3D|SPLINE)$/.test(s), a = s === "LWPOLYLINE";
  (o || r && (Number((F = i.flag) != null ? F : 0) & 1) === 1 || a && (Number((O = i.flag) != null ? O : 0) & 512) === 512) && (i.isClosed = !0);
  const c = (X = n.numericColorMode) != null ? X : "auto", l = T(t.color), h = T((j = (Y = (W = (H = t.colorIndex) != null ? H : t.colorNumber) != null ? W : t.aci) != null ? Y : t.aciColor) != null ? j : t.color_index);
  i.colorIndex = h != null ? h : c !== "rgb" && l !== void 0 && Math.abs(l) <= 257 ? l : void 0;
  const u = (we = (ve = (ue = (he = (Z = (ee = t.trueColor) != null ? ee : t.true_color) != null ? Z : t.truecolor) != null ? he : t.colorRGB) != null ? ue : t.colorRgb) != null ? ve : t.rgbColor) != null ? we : t.rgb, f = l !== void 0 && l >= 0 && l <= 16777215 && (c === "rgb" || c === "auto" && Math.abs(l) > 257);
  i.trueColor = u != null ? u : f ? l : void 0, (typeof t.color == "string" || typeof t.color == "number") && (i.color = t.color), i.colorNumber = (Ce = T(t.colorNumber)) != null ? Ce : i.colorNumber, i.colorName = (Ne = R((Se = t.colorName) != null ? Se : t.color_name)) != null ? Ne : i.colorName, i.fillColor = (Ge = t.fillColor) != null ? Ge : t.fill_color, i.fillColorIndex = (Ze = T((Ke = (qe = t.fillColorIndex) != null ? qe : t.fill_color_index) != null ? Ke : t.fillColorNumber)) != null ? Ze : i.fillColorIndex, i.opacity = (Qe = T((Je = t.opacity) != null ? Je : t.alpha)) != null ? Qe : i.opacity, i.lineweight = T((de = t.lineweight) != null ? de : t.lineWeight), i.isVisible = !(t.isVisible === !1 || t.visible === !1);
  const d = ce(t.text);
  if (i.startPoint = (_n = K((On = (Bn = (Te = (pe = t.startPoint) != null ? pe : d == null ? void 0 : d.startPoint) != null ? Te : t.start) != null ? Bn : t.p0) != null ? On : t.from)) != null ? _n : i.startPoint, i.endPoint = (Yn = K((Wn = (Hn = (Xn = ($n = t.endPoint) != null ? $n : d == null ? void 0 : d.endPoint) != null ? Xn : t.end) != null ? Hn : t.p1) != null ? Wn : t.to)) != null ? Yn : i.endPoint, i.center = (zn = K((Un = t.center) != null ? Un : t.centerPoint)) != null ? zn : i.center, i.insertionPoint = (Zn = K((Kn = (qn = (Gn = (jn = (Vn = t.insertionPoint) != null ? Vn : d == null ? void 0 : d.startPoint) != null ? jn : t.position) != null ? Gn : t.location) != null ? qn : t.point) != null ? Kn : t.basePoint)) != null ? Zn : i.insertionPoint, i.radius = (Jn = T(t.radius)) != null ? Jn : i.radius, i.startAngle = (es = T((Qn = t.startAngle) != null ? Qn : t.start_angle)) != null ? es : i.startAngle, i.endAngle = (ns = T((ts = t.endAngle) != null ? ts : t.end_angle)) != null ? ns : i.endAngle, i.majorAxisEndPoint = (os = K((is = (ss = t.majorAxisEndPoint) != null ? ss : t.majorAxis) != null ? is : t.major)) != null ? os : i.majorAxisEndPoint, i.axisRatio = (as = T((rs = t.axisRatio) != null ? rs : t.ratio)) != null ? as : i.axisRatio, i.height = (hs = T((ls = (cs = t.height) != null ? cs : t.textHeight) != null ? ls : d == null ? void 0 : d.textHeight)) != null ? hs : i.height, i.textHeight = (ds = T((fs = (us = t.textHeight) != null ? us : t.height) != null ? fs : d == null ? void 0 : d.textHeight)) != null ? ds : i.textHeight, i.fontFamily = (ps = R((ms = t.fontFamily) != null ? ms : d == null ? void 0 : d.fontFamily)) != null ? ps : i.fontFamily, i.textStyleWidthFactor = (gs = T(t.textStyleWidthFactor)) != null ? gs : i.textStyleWidthFactor, s === "MTEXT" && (i.width = (vs = T((xs = (ys = (bs = t.rectWidth) != null ? bs : t.width) != null ? ys : t.referenceWidth) != null ? xs : t.rect_width)) != null ? vs : i.width, i.attachmentPoint = (Ss = T((Cs = (ws = t.attachmentPoint) != null ? ws : t.attachment) != null ? Cs : t.attachment_point)) != null ? Ss : i.attachmentPoint, i.lineSpacingFactor = (Ms = T((ks = (Ns = t.lineSpacingFactor) != null ? Ns : t.lineSpacing) != null ? ks : t.linespace_factor)) != null ? Ms : i.lineSpacingFactor, i.lineSpacingStyle = (Ts = T((Ps = t.lineSpacingStyle) != null ? Ps : t.linespace_style)) != null ? Ts : i.lineSpacingStyle), i.xScale = (Ls = T((Es = (As = t.xScale) != null ? As : t.widthFactor) != null ? Es : d == null ? void 0 : d.xScale)) != null ? Ls : i.xScale, i.generationFlag = (Fs = T((Ds = (Is = t.generationFlag) != null ? Is : t.textGenerationFlag) != null ? Ds : d == null ? void 0 : d.generationFlag)) != null ? Fs : i.generationFlag, i.halign = (Os = T((Bs = (Rs = t.halign) != null ? Rs : t.horizontalAlignment) != null ? Bs : d == null ? void 0 : d.halign)) != null ? Os : i.halign, i.valign = (Xs = T(($s = (_s = t.valign) != null ? _s : t.verticalAlignment) != null ? $s : d == null ? void 0 : d.valign)) != null ? Xs : i.valign, i.extrusionDirection = (Ys = K((Ws = (Hs = t.extrusionDirection) != null ? Hs : t.extrusion) != null ? Ws : d == null ? void 0 : d.extrusionDirection)) != null ? Ys : i.extrusionDirection, i.rotation = (Vs = T((zs = (Us = t.rotation) != null ? Us : t.angle) != null ? zs : d == null ? void 0 : d.rotation)) != null ? Vs : i.rotation, s === "MTEXT" && i.rotation === void 0) {
    const se = K((Gs = (js = t.direction) != null ? js : t.directionVector) != null ? Gs : t.x_axis_dir);
    se && Math.hypot(se.x, se.y) > 1e-12 && (i.rotation = Math.atan2(se.y, se.x));
  }
  i.text = (ti = R((ei = (Qs = (Js = (Zs = (Ks = (qs = d == null ? void 0 : d.text) != null ? qs : t.text) != null ? Ks : t.value) != null ? Zs : t.string) != null ? Js : t.contents) != null ? Qs : t.defaultValue) != null ? ei : t.default_value)) != null ? ti : i.text, i.rawText = (ni = R(t.rawText)) != null ? ni : i.rawText, i.value = (li = R((ci = (ai = (ri = (oi = (ii = (si = t.value) != null ? si : d == null ? void 0 : d.text) != null ? ii : t.text) != null ? oi : t.string) != null ? ri : t.contents) != null ? ai : t.defaultValue) != null ? ci : t.default_value)) != null ? li : i.value, i.name = (ui = R((hi = t.name) != null ? hi : t.blockName)) != null ? ui : i.name, i.blockName = (di = R((fi = t.blockName) != null ? fi : t.name)) != null ? di : i.blockName, i.effectiveBlockName = (bi = R((gi = (pi = (mi = t.effectiveBlockName) != null ? mi : t.effectiveName) != null ? pi : t.dynamicBlockName) != null ? gi : t.originalBlockName)) != null ? bi : i.effectiveBlockName, i.extensionDictionaryHandle = (wi = ft((vi = (xi = (yi = t.extensionDictionaryHandle) != null ? yi : t.ownerDictionaryHardId) != null ? xi : t.ownerdictionaryHardId) != null ? vi : t.xdicobjhandle)) != null ? wi : i.extensionDictionaryHandle, i.ownerBlockRecordHandle = (Ni = ft((Si = (Ci = t.ownerBlockRecordHandle) != null ? Ci : t.ownerBlockRecordSoftId) != null ? Si : t.ownerHandle)) != null ? Ni : i.ownerBlockRecordHandle, i.attributeTag = (Ti = R((Pi = (Mi = (ki = t.attributeTag) != null ? ki : t.tag) != null ? Mi : t.tagString) != null ? Pi : t.attrTag)) != null ? Ti : i.attributeTag, i.attributePrompt = (Li = R((Ei = (Ai = t.attributePrompt) != null ? Ai : t.prompt) != null ? Ei : t.promptString)) != null ? Li : i.attributePrompt, i.attributeFlags = (Fi = T((Di = (Ii = t.attributeFlags) != null ? Ii : t.flags) != null ? Di : t.flag)) != null ? Fi : i.attributeFlags, (s === "INSERT" || s === "MINSERT") && (i.insertRowCount = (_i = Me((Oi = (Bi = (Ri = t.insertRowCount) != null ? Ri : t.rowCount) != null ? Bi : t.numRows) != null ? Oi : t.num_rows)) != null ? _i : i.insertRowCount, i.insertColumnCount = (Yi = Me((Wi = (Hi = (Xi = ($i = t.insertColumnCount) != null ? $i : t.columnCount) != null ? Xi : t.numColumns) != null ? Hi : t.numCols) != null ? Wi : t.num_cols)) != null ? Yi : i.insertColumnCount, i.insertRowSpacing = (Vi = T((zi = (Ui = t.insertRowSpacing) != null ? Ui : t.rowSpacing) != null ? zi : t.row_spacing)) != null ? Vi : i.insertRowSpacing, i.insertColumnSpacing = (qi = T((Gi = (ji = t.insertColumnSpacing) != null ? ji : t.columnSpacing) != null ? Gi : t.col_spacing)) != null ? qi : i.insertColumnSpacing);
  const m = ur((Zi = (Ki = t.xdata) != null ? Ki : t.extendedData) != null ? Zi : t.xData);
  if (m.length > 0 && (i.xdata = m), s === "INSERT" || s === "MINSERT") {
    const se = K(t.scale);
    if (se)
      i.scale = se;
    else {
      const wt = T((Ji = t.scaleX) != null ? Ji : t.xScale), zt = (eo = T((Qi = t.scaleY) != null ? Qi : t.yScale)) != null ? eo : wt, ao = T((to = t.scaleZ) != null ? to : t.zScale);
      wt !== void 0 && zt !== void 0 && (i.scale = ao === void 0 ? { x: wt, y: zt } : { x: wt, y: zt, z: ao });
    }
  }
  const p = jt((no = t.vertices) != null ? no : t.points);
  p.length > 0 && (i.vertices = p);
  const b = jt((so = t.controlPoints) != null ? so : t.control_points);
  b.length > 0 && (i.controlPoints = b);
  const g = jt((io = t.fitPoints) != null ? io : t.fit_points);
  g.length > 0 && (i.fitPoints = g);
  const y = (ro = (oo = t.attribs) != null ? oo : t.attributes) != null ? ro : t.attributeEntities;
  if (Array.isArray(y) && (i.attribs = y.filter((se) => !!se && typeof se == "object").map((se) => bt(se, void 0, n))), (s === "TABLE" || s === "ACAD_TABLE" || s === "ACDBTABLE") && (i.table = Ma(t)), s === "HATCH" && Array.isArray(t.boundaryPaths)) {
    const se = ka(t);
    i.loops = se.loops, i.hatch = se.hatch, i.hatch.status !== "ready" && (i.hatch.source = ge({ boundaryPaths: t.boundaryPaths, definitionLines: t.definitionLines, patternName: t.patternName, solidFill: t.solidFill, hatchStyle: t.hatchStyle, extrusionDirection: t.extrusionDirection }));
  }
  return i;
}
function Ma(t) {
  var l, h, u, f, d, m, p, b, g, y, x, v, w, C, S, D, L, I, M, N, A, k, E, B, $, F, O, X, H, W, Y;
  const e = ce((l = t.ldata) != null ? l : t.linkedData), n = ce((h = t.tdata) != null ? h : t.linkedTableData), s = (b = Me((p = (m = (d = (f = (u = t.rowCount) != null ? u : t.rowsCount) != null ? f : t.numRows) != null ? d : t.num_rows) != null ? m : n == null ? void 0 : n.numRows) != null ? p : n == null ? void 0 : n.num_rows)) != null ? b : 0, i = (D = Me((S = (C = (w = (v = (x = (y = (g = t.columnCount) != null ? g : t.columnsCount) != null ? y : t.numColumns) != null ? x : t.numCols) != null ? v : t.num_cols) != null ? w : n == null ? void 0 : n.numColumns) != null ? C : n == null ? void 0 : n.numCols) != null ? S : n == null ? void 0 : n.num_cols)) != null ? D : 0, o = lr((N = (M = (I = (L = t.cells) != null ? L : t.tableCells) != null ? I : t.cellValues) != null ? M : n == null ? void 0 : n.rows) != null ? N : t.data), r = i || Aa(o), a = s || (r > 0 ? Math.ceil(o.length / r) : 0), c = o.map(({ cell: j, index: ee }) => Ea(j, ee, r));
  return {
    name: R((E = (k = (A = t.tableName) != null ? A : t.name) != null ? k : e == null ? void 0 : e.name) != null ? E : e == null ? void 0 : e.description),
    rowCount: a,
    columnCount: r,
    cells: c,
    rowHeights: fo(($ = (B = t.rowHeights) != null ? B : t.rowHeightArr) != null ? $ : t.row_heights),
    columnWidths: fo((O = (F = t.columnWidths) != null ? F : t.columnWidthArr) != null ? O : t.col_widths),
    dataLinkHandle: ft((H = (X = t.dataLinkHandle) != null ? X : t.dataLink) != null ? H : t.data_link),
    titleSuppressed: Rt((W = t.titleSuppressed) != null ? W : t.title_suppressed),
    headerSuppressed: Rt((Y = t.headerSuppressed) != null ? Y : t.header_suppressed)
  };
}
function K(t) {
  var r, a, c, l, h, u;
  if (!t || typeof t != "object") return;
  const e = t, n = Number((a = (r = e.x) != null ? r : e.X) != null ? a : e[0]), s = Number((l = (c = e.y) != null ? c : e.Y) != null ? l : e[1]), i = (u = (h = e.z) != null ? h : e.Z) != null ? u : e[2], o = i === void 0 ? void 0 : Number(i);
  if (!(!Number.isFinite(n) || !Number.isFinite(s)))
    return Number.isFinite(o) ? { x: n, y: s, z: o } : { x: n, y: s };
}
function jt(t) {
  var n, s;
  if (!Array.isArray(t)) return [];
  const e = [];
  for (const i of t) {
    const o = K(i);
    if (!o) continue;
    const r = i, a = o, c = T(r.bulge);
    c !== void 0 && (a.bulge = c);
    const l = T((n = r.startWidth) != null ? n : r.start_width);
    l !== void 0 && (a.startWidth = l);
    const h = T((s = r.endWidth) != null ? s : r.end_width);
    h !== void 0 && (a.endWidth = h), e.push(a);
  }
  return e;
}
function et(t) {
  var n, s, i, o;
  const e = {};
  for (const r of t.entities) {
    const a = String((n = r.type) != null ? n : "UNKNOWN").toUpperCase();
    e[a] = ((s = e[a]) != null ? s : 0) + 1;
  }
  return {
    format: t.format,
    sourceName: t.sourceName,
    entityCount: t.entities.length,
    layerCount: Object.keys(t.layers).length,
    blockCount: Object.keys(t.blocks).length,
    pageCount: (o = (i = t.pages) == null ? void 0 : i.length) != null ? o : 0,
    byType: e,
    warnings: [...t.warnings]
  };
}
function rr(t) {
  var l, h, u;
  if (t.isClosed === !0) return !0;
  const e = String((l = t.type) != null ? l : "").toUpperCase(), n = Number((h = t.flag) != null ? h : 0), s = e === "LWPOLYLINE", i = /^(POLYLINE|POLYLINE_2D|POLYLINE2D|POLYLINE_3D|POLYLINE3D)$/.test(e);
  if (s && (n & 512) === 512 || i && (n & 1) === 1) return !0;
  if (!s && !i) return !1;
  const o = (u = t.vertices) != null ? u : t.points;
  if (!Array.isArray(o) || o.length < 3) return !1;
  const r = o[0], a = o[o.length - 1];
  if (!r || !a) return !1;
  const c = o.reduce((f, d) => Math.max(f, Math.abs(d.x), Math.abs(d.y)), 1);
  return Math.hypot(r.x - a.x, r.y - a.y) <= Math.max(1e-9, c * 1e-12);
}
function ar(t) {
  var n;
  let e = Gt(t.constantWidth);
  for (const s of (n = t.vertices) != null ? n : [])
    e = Math.max(e, Gt(s.startWidth), Gt(s.endWidth));
  return e;
}
function Ft(t, e) {
  e.name && (t[e.name] = e, t[e.name.toLowerCase()] = e);
}
function cr(t, e) {
  e.name && (t[e.name] = e, t[e.name.toLowerCase()] = e);
}
function Pa(t, e) {
  e.name && (t[e.name] = e, t[e.name.toLowerCase()] = e, e.handle && (t[e.handle] = e, t[e.handle.toLowerCase()] = e));
}
function Ta(t) {
  return t != null && t.length ? t.flatMap((e) => e.entities.map((n) => ({ ...n, pageIndex: e.index }))) : [];
}
function T(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : void 0;
}
function R(t) {
  if (typeof t != "string" && typeof t != "number") return;
  const e = String(t);
  return e.length > 0 ? e : void 0;
}
function ce(t) {
  return t && typeof t == "object" && !Array.isArray(t) ? t : void 0;
}
function Me(t) {
  const e = T(t);
  if (!(e === void 0 || e <= 0))
    return Math.max(1, Math.trunc(e));
}
function Rt(t) {
  if (typeof t == "boolean") return t;
  if (t === 0 || t === "0") return !1;
  if (t === 1 || t === "1") return !0;
}
function fo(t) {
  if (!Array.isArray(t)) return;
  const e = t.map(T).filter((n) => n !== void 0);
  return e.length > 0 ? e : void 0;
}
function ft(t) {
  var e, n, s, i, o, r;
  if (Array.isArray(t))
    return R((n = (e = t[3]) != null ? e : t[2]) != null ? n : t[t.length - 1]);
  if (t && typeof t == "object") {
    const a = t;
    return R((r = (o = (i = (s = a.absolute_ref) != null ? s : a.absoluteRef) != null ? i : a.handle) != null ? o : a.id) != null ? r : a.value);
  }
  return R(t);
}
function lr(t) {
  var s, i, o;
  if (!Array.isArray(t)) {
    const r = ce(t), a = (i = (s = r == null ? void 0 : r.rows) != null ? s : r == null ? void 0 : r.values) != null ? i : r == null ? void 0 : r.cells;
    return Array.isArray(a) ? lr(a) : [];
  }
  const e = [];
  let n = 0;
  for (const r of t) {
    if (Array.isArray(r)) {
      for (const l of r) e.push({ cell: l, index: n++ });
      continue;
    }
    const a = ce(r), c = (o = a == null ? void 0 : a.cells) != null ? o : a == null ? void 0 : a.values;
    if (Array.isArray(c) && !("text" in (a != null ? a : {})) && !("value" in (a != null ? a : {}))) {
      for (const l of c) e.push({ cell: l, index: n++ });
      continue;
    }
    e.push({ cell: r, index: n++ });
  }
  return e;
}
function Aa(t) {
  var n, s, i;
  let e = -1;
  for (const { cell: o } of t) {
    const r = ce(o), a = T((i = (s = (n = r == null ? void 0 : r.column) != null ? n : r == null ? void 0 : r.columnIndex) != null ? s : r == null ? void 0 : r.col) != null ? i : r == null ? void 0 : r.column_index);
    a !== void 0 && (e = Math.max(e, Math.trunc(a)));
  }
  return e >= 0 ? e + 1 : 0;
}
function Ea(t, e, n) {
  var u, f, d, m, p, b, g, y, x, v, w, C, S, D, L, I, M, N, A, k, E, B, $, F, O, X, H, W, Y, j, ee, Z, he, ue, ve, we, Ce, Se, Ne;
  const s = ce(t), i = s ? La(s) : ge(t), o = R(s ? (p = (m = (d = (f = (u = s.text) != null ? u : s.textValue) != null ? f : s.text_value) != null ? d : s.valueString) != null ? m : s.value_string) != null ? p : s.displayValue : t), r = o != null ? o : hr(i), a = Math.max(0, Math.trunc((y = T((g = (b = s == null ? void 0 : s.row) != null ? b : s == null ? void 0 : s.rowIndex) != null ? g : s == null ? void 0 : s.row_index)) != null ? y : n > 0 ? Math.floor(e / n) : e)), c = Math.max(0, Math.trunc((C = T((w = (v = (x = s == null ? void 0 : s.column) != null ? x : s == null ? void 0 : s.columnIndex) != null ? v : s == null ? void 0 : s.col) != null ? w : s == null ? void 0 : s.column_index)) != null ? C : n > 0 ? e % n : 0)), l = R((S = s == null ? void 0 : s.attrText) != null ? S : s == null ? void 0 : s.attributeText), h = l ? { value: l } : Ia((D = s == null ? void 0 : s.blockAttributes) != null ? D : s == null ? void 0 : s.attributes);
  return {
    row: a,
    column: c,
    text: r,
    ...i !== void 0 ? { value: i } : {},
    ...R((L = s == null ? void 0 : s.dataType) != null ? L : s == null ? void 0 : s.typeName) || T((I = s == null ? void 0 : s.cellType) != null ? I : s == null ? void 0 : s.type) !== void 0 ? { dataType: (A = R((M = s == null ? void 0 : s.dataType) != null ? M : s == null ? void 0 : s.typeName)) != null ? A : T((N = s == null ? void 0 : s.cellType) != null ? N : s == null ? void 0 : s.type) } : {},
    ...R((k = s == null ? void 0 : s.formula) != null ? k : s == null ? void 0 : s.expression) ? { formula: R((E = s == null ? void 0 : s.formula) != null ? E : s == null ? void 0 : s.expression) } : {},
    ...Me(($ = (B = s == null ? void 0 : s.rowSpan) != null ? B : s == null ? void 0 : s.mergedHeight) != null ? $ : s == null ? void 0 : s.merged_height_flag) ? { rowSpan: Me((O = (F = s == null ? void 0 : s.rowSpan) != null ? F : s == null ? void 0 : s.mergedHeight) != null ? O : s == null ? void 0 : s.merged_height_flag) } : {},
    ...Me((H = (X = s == null ? void 0 : s.columnSpan) != null ? X : s == null ? void 0 : s.mergedWidth) != null ? H : s == null ? void 0 : s.merged_width_flag) ? { columnSpan: Me((Y = (W = s == null ? void 0 : s.columnSpan) != null ? W : s == null ? void 0 : s.mergedWidth) != null ? Y : s == null ? void 0 : s.merged_width_flag) } : {},
    ...Rt((ee = (j = s == null ? void 0 : s.isMerged) != null ? j : s == null ? void 0 : s.mergedValue) != null ? ee : s == null ? void 0 : s.is_merged_value) !== void 0 ? { isMerged: Rt((he = (Z = s == null ? void 0 : s.isMerged) != null ? Z : s == null ? void 0 : s.mergedValue) != null ? he : s == null ? void 0 : s.is_merged_value) } : {},
    ...T((ue = s == null ? void 0 : s.textHeight) != null ? ue : s == null ? void 0 : s.text_height) !== void 0 ? { textHeight: T((ve = s == null ? void 0 : s.textHeight) != null ? ve : s == null ? void 0 : s.text_height) } : {},
    ...ft((Ce = (we = s == null ? void 0 : s.blockTableRecordId) != null ? we : s == null ? void 0 : s.blockRecordHandle) != null ? Ce : s == null ? void 0 : s.block_handle) ? { blockTableRecordId: ft((Ne = (Se = s == null ? void 0 : s.blockTableRecordId) != null ? Se : s == null ? void 0 : s.blockRecordHandle) != null ? Ne : s == null ? void 0 : s.block_handle) } : {},
    ...h && Object.keys(h).length > 0 ? { blockAttributes: h } : {}
  };
}
function La(t) {
  const e = ce(t.value), n = [
    e == null ? void 0 : e.valueString,
    e == null ? void 0 : e.value_string,
    e == null ? void 0 : e.dataString,
    e == null ? void 0 : e.data_string,
    e == null ? void 0 : e.dataLong,
    e == null ? void 0 : e.data_long,
    e == null ? void 0 : e.dataDouble,
    e == null ? void 0 : e.data_double,
    e == null ? void 0 : e.dataDate,
    e == null ? void 0 : e.data_date,
    e == null ? void 0 : e.dataPoint,
    e == null ? void 0 : e.data_point,
    e == null ? void 0 : e.data3dPoint,
    e == null ? void 0 : e.data_3dpoint,
    t.rawValue,
    t.value
  ];
  for (const s of n) {
    const i = ge(s);
    if (i !== void 0 && i !== "") return i;
  }
}
function hr(t) {
  if (t == null) return "";
  if (typeof t == "string" || typeof t == "number" || typeof t == "boolean") return String(t);
  if (!Array.isArray(t) && typeof t == "object" && "x" in t && "y" in t) {
    const e = t;
    return [e.x, e.y, e.z].filter((n) => n !== void 0).join(", ");
  }
  try {
    return JSON.stringify(t);
  } catch (e) {
    return String(t);
  }
}
function Ia(t) {
  var s;
  const e = ce(t);
  if (!e) return;
  const n = {};
  for (const [i, o] of Object.entries(e)) {
    const r = (s = R(o)) != null ? s : hr(ge(o));
    r && (n[i] = r);
  }
  return Object.keys(n).length > 0 ? n : void 0;
}
function ur(t) {
  var r, a, c, l, h, u;
  if (!t) return [];
  if (Array.isArray(t)) {
    if (t.some((d) => {
      var m, p;
      return ((m = ce(d)) == null ? void 0 : m.appName) !== void 0 || ((p = ce(d)) == null ? void 0 : p.applicationName) !== void 0;
    }))
      return t.flatMap((d) => ur(d));
    const f = t.map(Nt).filter((d) => !!d);
    return f.length > 0 ? [{ entries: f }] : [];
  }
  const e = ce(t);
  if (!e) return [];
  const n = R((a = (r = e.appName) != null ? r : e.applicationName) != null ? a : e.app), s = Array.isArray(e.customStrings) ? e.customStrings.map((f) => ({ code: 1e3, value: f })) : void 0, i = (u = (h = (l = (c = e.entries) != null ? c : e.value) != null ? l : e.values) != null ? h : e.data) != null ? u : s;
  if (Array.isArray(i)) {
    const f = i.map(Nt).filter((d) => !!d);
    return f.length > 0 ? [{ appName: n, entries: f }] : [];
  }
  if (n) {
    const f = Nt(i);
    return f ? [{ appName: n, entries: [f] }] : [];
  }
  const o = [];
  for (const [f, d] of Object.entries(e)) {
    const m = (Array.isArray(d) ? d : [d]).map(Nt).filter((p) => !!p);
    m.length > 0 && o.push({ appName: f, entries: m });
  }
  return o;
}
function Nt(t) {
  var s, i, o, r, a, c, l;
  const e = ce(t);
  if (e) {
    const h = ge((o = (i = (s = e.value) != null ? s : e.data) != null ? i : e.text) != null ? o : e);
    return h === void 0 ? void 0 : {
      ...T((r = e.code) != null ? r : e.groupCode) !== void 0 ? { code: T((a = e.code) != null ? a : e.groupCode) } : {},
      ...R((c = e.name) != null ? c : e.key) ? { name: R((l = e.name) != null ? l : e.key) } : {},
      value: h
    };
  }
  const n = ge(t);
  return n === void 0 ? void 0 : { value: n };
}
function ge(t, e = 0, n = /* @__PURE__ */ new WeakSet()) {
  if (t === null) return null;
  if (typeof t == "string" || typeof t == "boolean") return t;
  if (typeof t == "number") return Number.isFinite(t) ? t : String(t);
  if (typeof t == "bigint") return t.toString();
  if (t instanceof Date) return t.toISOString();
  if (ArrayBuffer.isView(t)) return Array.from(new Uint8Array(t.buffer, t.byteOffset, Math.min(t.byteLength, 65536)));
  if (e >= 12 || !t || typeof t != "object") return;
  if (n.has(t)) return "[Circular]";
  if (n.add(t), Array.isArray(t)) {
    const i = t.slice(0, 1e5).map((o) => ge(o, e + 1, n)).filter((o) => o !== void 0);
    return n.delete(t), i;
  }
  const s = {};
  for (const [i, o] of Object.entries(t).slice(0, 1e4)) {
    const r = ge(o, e + 1, n);
    r !== void 0 && (s[i] = r);
  }
  return n.delete(t), s;
}
function Gt(t) {
  const e = Math.abs(Number(t));
  return Number.isFinite(e) ? e : 0;
}
const qt = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', rt = 100;
function Nn(t, e = !0, n = 1, s, i = 1) {
  var p;
  const o = Number.isFinite(i) && i > 0 ? i : 1;
  let r = { height: 1, width: o, font: mo(s), bold: !1, italic: !1, underline: !1, overline: !1, strike: !1 };
  const a = [];
  let c = 0, l;
  const h = [{ runs: [], align: "left" }];
  let u = h[0], f = "";
  const d = () => {
    f && u.runs.push({ text: f, style: { ...r } }), f = "";
  }, m = () => {
    d(), u = { runs: [], align: u.align }, h.push(u);
  };
  for (let b = 0; b < t.length; ) {
    const g = t[b];
    if (g === "\r" || g === `
`) {
      g === "\r" && t[b + 1] === `
` && b++, m(), b++;
      continue;
    }
    if (g === "%" && t[b + 1] === "%") {
      const x = (p = t[b + 2]) == null ? void 0 : p.toLowerCase(), v = x === "d" ? "°" : x === "p" ? "±" : x === "c" ? "∅" : x === "%" ? "%" : void 0;
      if (v !== void 0) {
        f += v, b += 3;
        continue;
      }
      if (x === "u" || x === "o") {
        d(), r = { ...r, [x === "u" ? "underline" : "overline"]: !r[x === "u" ? "underline" : "overline"] }, b += 3;
        continue;
      }
      const w = t.slice(b + 2, b + 5);
      if (/^\d{3}$/.test(w)) {
        f += String.fromCharCode(Number(w)), b += 5;
        continue;
      }
    }
    if (e && (g === "{" || g === "}")) {
      d(), g === "{" ? a.length < 8 && c === 0 ? a.push({ ...r }) : (c === 0 && (l = { ...r }), c++) : c > 0 ? --c === 0 && l && (r = l) : a.length && (r = a.pop()), b++;
      continue;
    }
    if (g !== "\\" || b + 1 >= t.length) {
      f += g, b++;
      continue;
    }
    const y = t[b + 1];
    if (y === "\\") {
      f += "\\", b += 2;
      continue;
    }
    if ((y === "U" || y === "u") && t[b + 2] === "+" && /^[0-9a-f]{4}$/i.test(t.slice(b + 3, b + 7))) {
      f += String.fromCharCode(parseInt(t.slice(b + 3, b + 7), 16)), b += 7;
      continue;
    }
    if (!e) {
      f += g, b++;
      continue;
    }
    if (y === "{" || y === "}") {
      f += y, b += 2;
      continue;
    }
    if (y === "~" || y === " ") {
      f += y === "~" ? " " : " ", b += 2;
      continue;
    }
    if (y === "P" || y === "X") {
      m(), b += 2;
      continue;
    }
    if ("LlOoKk".includes(y)) {
      d();
      const x = y.toLowerCase() === "l" ? "underline" : y.toLowerCase() === "o" ? "overline" : "strike";
      r = { ...r, [x]: y === y.toUpperCase() }, b += 2;
      continue;
    }
    if ("AaCcFfHhQqTtWwSsp".includes(y)) {
      const x = Da(t, b + 2), v = x >= 0 ? t.slice(b + 2, x) : "";
      if (x >= 0) {
        if ("AaCcHhQqTtWw".includes(y) && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?x?$/i.test(v)) {
          f += t.slice(b, x + 1), b = x + 1;
          continue;
        }
        if (d(), y === "S" || y === "s") f += v.replace(/[\^#]/g, "/");
        else if (y === "H" || y === "h") {
          const w = /x$/i.test(v), C = Number(w ? v.slice(0, -1) : v), S = w ? r.height * C : C / Math.max(1e-9, Math.abs(n));
          Number.isFinite(S) && S > 0 && S <= 1e3 && (r = { ...r, height: S });
        } else if (y === "W" || y === "w") {
          const w = /x$/i.test(v), C = Number(w ? v.slice(0, -1) : v) * (w ? o : 1);
          Number.isFinite(C) && C > 0 && C <= 1e3 && (r = { ...r, width: C });
        } else if (y === "F" || y === "f") {
          const [w, ...C] = v.split("|");
          r = { ...r, font: mo(w), bold: C.includes("b1"), italic: C.includes("i1") };
        } else if (y === "p") {
          const w = v.match(/q([lcr])/);
          w && (u.align = w[1] === "c" ? "center" : w[1] === "r" ? "right" : "left");
        }
        b = x + 1;
        continue;
      }
    }
    f += g, b++;
  }
  return d(), { text: h.map((b) => b.runs.map((g) => g.text).join("")).join(`
`), paragraphs: h };
}
function mo(t) {
  if (!t || /\.shx$/i.test(t)) return qt;
  const e = t.replace(/["\\\r\n\u0000-\u001f]/g, "").trim();
  return e ? `"${e}", ${qt}` : qt;
}
function Da(t, e) {
  for (let n = e; n < t.length; n++) {
    if (t[n] === ";") return n;
    if (`\\\r
{}`.includes(t[n])) return -1;
  }
  return -1;
}
function fr(t, e, n) {
  var C, S, D, L, I, M, N, A;
  const s = String(e.type).toUpperCase() === "MTEXT", i = Math.abs(Number((S = (C = e.textHeight) != null ? C : e.height) != null ? S : 1)) || 1, o = n != null ? n : Nn(String((I = (L = (D = e.rawText) != null ? D : e.text) != null ? L : e.value) != null ? I : ""), s, i, e.fontFamily, s ? e.textStyleWidthFactor : 1), r = mr(e), a = Number(e.width), c = s && Number.isFinite(a) && a > 0 ? a / i / r : 1 / 0, l = Number((M = e.lineSpacingFactor) != null ? M : 1), h = s ? 5 / 3 * (Number.isFinite(l) && l >= 0.25 && l <= 4 ? l : 1) : 1.22, u = Number(e.lineSpacingStyle) === 2, f = [], d = /* @__PURE__ */ new Map(), m = (k, E) => {
    const B = dr(E), $ = `${B}\0${k}`;
    let F = d.get($);
    return F === void 0 && (t.font = B, F = t.measureText(k).width / rt, d.set($, F)), F * E.width;
  };
  for (const k of o.paragraphs) {
    let E = { fragments: [], width: 0, height: 1, y: 0 }, B = !1;
    const $ = () => {
      for (; E.fragments.length && /^[ \t]+$/.test(E.fragments[E.fragments.length - 1].text); )
        E.width -= E.fragments.pop().width;
      if (Number.isFinite(c)) {
        const O = k.align === "center" ? (c - E.width) / 2 : k.align === "right" ? c - E.width : 0;
        for (const X of E.fragments) X.x += O;
      }
      f.push(E), E = { fragments: [], width: 0, height: 1, y: 0 }, B = !0;
    }, F = (O, X, H) => {
      E.fragments.push({ text: O, x: E.width, width: H, style: X }), E.width += H, E.height = Math.max(E.height, X.height);
    };
    for (const O of k.runs) {
      const X = s ? (N = O.text.match(/[ \t]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[^ \t\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu)) != null ? N : [] : [O.text];
      for (const H of X) {
        const W = m(H, O.style);
        if (E.width > 0 && E.width + W > c + 1e-8 && $(), !(B && !E.fragments.length && /^[ \t]+$/.test(H))) {
          if (W <= c || !Number.isFinite(c) || H.includes(" ")) {
            F(H, O.style, W);
            continue;
          }
          for (const Y of H) {
            const j = m(Y, O.style);
            E.width > 0 && E.width + j > c + 1e-8 && $(), F(Y, O.style, j);
          }
        }
      }
    }
    $();
  }
  let p = 0;
  for (let k = 0; k < f.length; k++)
    f[k].y = p, k + 1 < f.length && (p += u ? h : Math.max(h, f[k].height * h));
  const b = f.length ? p + f[f.length - 1].height : 0, g = Number.isFinite(c) ? c : f.reduce((k, E) => Math.max(k, E.width), 0), y = Math.trunc(Number((A = e.attachmentPoint) != null ? A : 1)), x = y >= 1 && y <= 9 ? y : 1, v = s ? -((x - 1) % 3) * g / 2 : 0, w = s ? -Math.floor((x - 1) / 3) * b / 2 : 0;
  return { lines: f, width: g, height: b, offsetX: v, offsetY: w, multiline: s };
}
function dr(t) {
  return `${t.italic ? "italic " : ""}${t.bold ? "bold " : ""}${rt * t.height}px ${t.font}`;
}
function mr(t) {
  var n;
  const e = Math.abs(Number((n = t.xScale) != null ? n : 1));
  return Number.isFinite(e) && e > 1e-9 ? e : 1;
}
function Fa(t, e, n) {
  var y, x, v, w, C, S;
  let s = 1 / 0, i = 1 / 0, o = -1 / 0, r = -1 / 0, a = 0;
  const c = Number((y = t.halign) != null ? y : 0), l = Number((x = t.valign) != null ? x : 0);
  for (const D of e.lines) {
    const L = e.multiline ? 0 : c === 1 || c === 4 ? -D.width / 2 : c === 2 ? -D.width : 0;
    for (const I of D.fragments) {
      const M = I.style.height, N = e.multiline || l === 3 ? 0 : l === 2 ? -M / 2 : -M;
      s = Math.min(s, e.offsetX + L + I.x), o = Math.max(o, e.offsetX + L + I.x + I.width), i = Math.min(i, e.offsetY + D.y + N), r = Math.max(r, e.offsetY + D.y + N + M), a = Math.max(a, M * 0.3);
    }
  }
  if (!Number.isFinite(s)) return { minX: n.x, minY: n.y, maxX: n.x, maxY: n.y };
  const h = Math.abs(Number((w = (v = t.textHeight) != null ? v : t.height) != null ? w : 1)) || 1, u = Number((C = t.generationFlag) != null ? C : 0), f = h * mr(t) * (u & 2 ? -1 : 1), d = -h * (u & 4 ? -1 : 1), m = Number((S = t.rotation) != null ? S : 0), p = Math.cos(m), b = Math.sin(m), g = { minX: 1 / 0, minY: 1 / 0, maxX: -1 / 0, maxY: -1 / 0 };
  for (const D of [s - a, o + a]) for (const L of [i - a, r + a]) {
    const I = n.x + D * f * p - L * d * b, M = n.y + D * f * b + L * d * p;
    g.minX = Math.min(g.minX, I), g.maxX = Math.max(g.maxX, I), g.minY = Math.min(g.minY, M), g.maxY = Math.max(g.maxY, M);
  }
  return g;
}
function pr(t, e, n, s) {
  var a, c;
  const i = s != null ? s : fr(t, e), o = Number((a = e.halign) != null ? a : 0), r = Number((c = e.valign) != null ? c : 0);
  t.textAlign = "left", t.textBaseline = i.multiline ? "top" : r === 1 ? "bottom" : r === 2 ? "middle" : r === 3 ? "top" : "alphabetic";
  for (const l of i.lines) {
    const h = i.multiline ? 0 : o === 1 || o === 4 ? -l.width / 2 : o === 2 ? -l.width : 0;
    for (const u of l.fragments) {
      const f = (i.offsetX + h + u.x) * n, d = (i.offsetY + l.y) * n;
      if (t.save(), t.translate(f, d), t.scale(n / rt * u.style.width, n / rt), t.font = dr(u.style), t.fillText(u.text, 0, 0), u.style.underline || u.style.overline || u.style.strike) {
        t.strokeStyle = t.fillStyle, t.lineWidth = 5;
        const m = i.multiline || r === 3 ? 0 : r === 2 ? -50 : -100;
        for (const p of [u.style.underline ? m + 110 : void 0, u.style.overline ? m : void 0, u.style.strike ? m + 55 : void 0])
          p !== void 0 && (t.beginPath(), t.moveTo(0, p * u.style.height), t.lineTo(u.width / u.style.width * rt, p * u.style.height), t.stroke());
      }
      t.restore();
    }
  }
  return i;
}
function be() {
  return { minX: 1 / 0, minY: 1 / 0, maxX: -1 / 0, maxY: -1 / 0 };
}
function fe(t) {
  return Number.isFinite(t.minX) && Number.isFinite(t.minY) && Number.isFinite(t.maxX) && Number.isFinite(t.maxY) && t.maxX >= t.minX && t.maxY >= t.minY;
}
function te(t, e) {
  _(e) && (t.minX = Math.min(t.minX, e.x), t.minY = Math.min(t.minY, e.y), t.maxX = Math.max(t.maxX, e.x), t.maxY = Math.max(t.maxY, e.y));
}
function Ra(t, e, n) {
  if (!_(e) || !Number.isFinite(n)) return;
  const s = Math.abs(n);
  te(t, { x: e.x - s, y: e.y - s }), te(t, { x: e.x + s, y: e.y + s });
}
function gr(t, e) {
  fe(e) && (te(t, { x: e.minX, y: e.minY }), te(t, { x: e.maxX, y: e.maxY }));
}
function br(t, e = 0.02, n = 1e-6) {
  if (!fe(t)) return { minX: -10, minY: -10, maxX: 10, maxY: 10 };
  const s = Math.max((t.maxX - t.minX) * e, n), i = Math.max((t.maxY - t.minY) * e, n);
  return { minX: t.minX - s, minY: t.minY - i, maxX: t.maxX + s, maxY: t.maxY + i };
}
function _(t) {
  return !!t && typeof t == "object" && Number.isFinite(t.x) && Number.isFinite(t.y);
}
function q(t) {
  return { x: t.x, y: t.y };
}
function Ie(t) {
  return t * Math.PI / 180;
}
function dt(t, e, n, s, i = !0, o = 64) {
  if (!_(t) || !Number.isFinite(e)) return [];
  let r = n, a = s;
  if (!Number.isFinite(r) || !Number.isFinite(a)) return [];
  (Math.abs(r) > Math.PI * 2 + 1e-6 || Math.abs(a) > Math.PI * 2 + 1e-6) && (r = Ie(r), a = Ie(a)), i && a < r && (a += Math.PI * 2), !i && r < a && (r += Math.PI * 2);
  const c = a - r, l = Math.max(8, Math.min(256, Math.ceil(Math.abs(c) / (Math.PI * 2) * o))), h = [];
  for (let u = 0; u <= l; u++) {
    const f = r + c * (u / l);
    h.push({ x: t.x + Math.cos(f) * e, y: t.y + Math.sin(f) * e });
  }
  return h;
}
function kn(t, e, n = 1, s = 0, i = Math.PI * 2, o = 96) {
  if (!_(t) || !_(e)) return [];
  const r = Math.hypot(e.x, e.y);
  if (!Number.isFinite(r) || r <= 0) return [];
  const a = r * (Number.isFinite(n) && n > 0 ? n : 1), c = Math.atan2(e.y, e.x);
  let l = Number.isFinite(s) ? s : 0, h = Number.isFinite(i) ? i : Math.PI * 2;
  (Math.abs(l) > Math.PI * 2 + 1e-6 || Math.abs(h) > Math.PI * 2 + 1e-6) && (l = Ie(l), h = Ie(h)), h < l && (h += Math.PI * 2);
  const u = Math.max(12, Math.min(256, Math.ceil(Math.abs(h - l) / (Math.PI * 2) * o))), f = [], d = Math.cos(c), m = Math.sin(c);
  for (let p = 0; p <= u; p++) {
    const b = l + (h - l) * (p / u), g = Math.cos(b) * r, y = Math.sin(b) * a;
    f.push({ x: t.x + g * d - y * m, y: t.y + g * m + y * d });
  }
  return f;
}
function yr(t, e, n = 0, s = 16) {
  if (!Number.isFinite(n) || Math.abs(n) < 1e-12) return [q(t), q(e)];
  const i = Math.hypot(e.x - t.x, e.y - t.y);
  if (i <= 1e-12) return [q(t), q(e)];
  const o = 4 * Math.atan(n), r = Math.abs(i / (2 * Math.sin(o / 2))), a = { x: (t.x + e.x) / 2, y: (t.y + e.y) / 2 }, c = (e.x - t.x) / i, l = (e.y - t.y) / i, h = n >= 0 ? 1 : -1, u = Math.sqrt(Math.max(r * r - (i / 2) ** 2, 0)), f = { x: a.x - h * l * u, y: a.y + h * c * u }, d = Math.atan2(t.y - f.y, t.x - f.x), m = Math.atan2(e.y - f.y, e.x - f.x);
  return dt(f, r, d, m, n >= 0, s);
}
function Be(t, e, n) {
  return Math.min(n, Math.max(e, t));
}
const po = 128 * 1024 * 1024, Kt = 2e6, go = 5e5, Zt = 1048576, Ba = 256, Oa = 2e4, Jt = 1e5;
function _a(t) {
  var b;
  const e = [], n = Ha(Xa(t, e), e), s = [], i = [], o = /* @__PURE__ */ new Map(), r = [], a = [], c = [], l = [], h = [], u = [];
  let f, d, m = "";
  const p = /* @__PURE__ */ new Map();
  for (const g of n) {
    if (g.section === "TABLES" && g.type === "LAYER") {
      const C = Wa(g);
      C && i.push(C);
      continue;
    }
    const y = cn(g.section, g.blockName), x = rc(g, y, p), v = (b = ne(g.pairs, 5)) != null ? b : ne(g.pairs, 105), w = Ka(g.pairs, e, `${g.type}${v ? ` ${v}` : ""}`);
    if (v && w.length > 0 && o.set(ie(v), w), x && w.length > 0 && r.push({ handle: v, locator: x, groups: w }), g.section === "ENTITIES" || g.section === "BLOCKS") {
      if (g.type === "INSERT" || g.type === "MINSERT")
        f = v, d = x, m = y;
      else if (g.type === "ATTRIB") {
        const C = y === m && f ? f : ic(g.pairs), S = y === m ? d : void 0;
        s.push({ ownerHandle: C, ownerLocator: S, attribute: Ya(g, w) });
      } else g.type, f = void 0, d = void 0;
      (g.type === "ACAD_TABLE" || g.type === "TABLE") && a.push({ blockName: g.blockName, locator: x, entity: Ua(g, w) });
      continue;
    }
    if (g.section === "OBJECTS")
      switch (g.type) {
        case "DICTIONARY":
        case "ACDBDICTIONARYWDFLT":
          c.push(za(g));
          break;
        case "XRECORD":
          l.push(Va(g, e));
          break;
        case "DATALINK":
          h.push(ja(g));
          break;
        case "DATATABLE":
          u.push(Ga(g));
          break;
        case "TABLECONTENT": {
          const C = qa(g);
          C && u.push(C);
          break;
        }
      }
  }
  return Za(c, l), { layers: i, attributes: s, xdataByHandle: o, xdataByLocator: r, tables: a, dictionaries: c, xrecords: l, dataLinks: h, dataTables: u, warnings: e };
}
function $a(t, e) {
  var o, r, a, c, l, h, u, f;
  for (const d of e.layers) {
    const m = Object.prototype.hasOwnProperty.call(t.layers, d.name) ? t.layers[d.name] : void 0;
    Ft(t.layers, { ...m, ...d });
  }
  const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), i = new Set(Object.values(t.blocks));
  xo(t.entities, cn("ENTITIES"), n, s);
  for (const d of i) xo(d.entities, cn("BLOCKS", d.name), n, s);
  for (const { ownerHandle: d, ownerLocator: m, attribute: p } of e.attributes) {
    const b = (o = d ? n.get(ie(d)) : void 0) != null ? o : m ? s.get(Lt(m)) : void 0;
    if (!b || b.kind !== "insert" && !/^(INSERT|MINSERT)$/i.test(b.type)) {
      t.warnings.push(`DXF ATTRIB ${(a = (r = p.handle) != null ? r : p.attributeTag) != null ? a : "(unknown)"} could not be matched to its INSERT${d ? ` ${d}` : ""}.`);
      continue;
    }
    const g = (c = b.attribs) != null ? c : b.attribs = [];
    g.some((y) => ac(y, p)) || g.push(p);
  }
  for (const [d, m] of e.xdataByHandle) {
    const p = n.get(d);
    p && (p.xdata = m);
  }
  for (const { handle: d, locator: m, groups: p } of e.xdataByLocator) {
    const b = s.get(Lt(m));
    if (b) b.xdata = p;
    else {
      if (d && n.has(ie(d))) continue;
      t.warnings.push(`DXF XDATA on ${d ? `${m.type} ${d}` : `handleless ${m.type} #${m.ordinal + 1}`} could not be matched to a normalized entity.`);
    }
  }
  for (const { blockName: d, locator: m, entity: p } of e.tables) {
    const b = (l = p.handle ? n.get(ie(p.handle)) : void 0) != null ? l : m ? s.get(Lt(m)) : void 0;
    if (b) {
      b.kind = "table", b.table = p.table, b.xdata = (h = p.xdata) != null ? h : b.xdata;
      continue;
    }
    if (d) {
      const g = (u = t.blocks[d]) != null ? u : t.blocks[d.toLocaleLowerCase()];
      g ? g.entities.push(p) : t.warnings.push(`DXF table ${(f = p.handle) != null ? f : "(unknown)"} belongs to missing block ${d}.`);
    } else
      t.entities.push(p);
    Cr(p, n);
  }
  e.dictionaries.length > 0 && (t.dictionaries = kt(t.dictionaries, e.dictionaries)), e.xrecords.length > 0 && (t.xrecords = kt(t.xrecords, e.xrecords)), e.dataLinks.length > 0 && (t.dataLinks = kt(t.dataLinks, e.dataLinks)), e.dataTables.length > 0 && (t.dataTables = kt(t.dataTables, e.dataTables)), t.warnings.push(...e.warnings), t.metadata.dxfBusinessData = {
    attributes: e.attributes.length,
    nativeTables: e.tables.length,
    dataTables: e.dataTables.length,
    dataLinks: e.dataLinks.length,
    xrecords: e.xrecords.length
  };
}
function Xa(t, e) {
  const n = Math.min(t.length, po);
  t.length > n && e.push(`DXF BOM metadata scan was capped at ${po.toLocaleString()} characters.`);
  const s = [];
  let i = 0, o = !1;
  const r = () => {
    if (i >= n) return;
    const a = i;
    for (; i < n && t.charCodeAt(i) !== 10 && t.charCodeAt(i) !== 13; ) i += 1;
    const c = t.slice(a, i);
    return i < n && t.charCodeAt(i) === 13 && (i += 1), i < n && t.charCodeAt(i) === 10 && (i += 1), c;
  };
  for (; s.length < Kt; ) {
    const a = r(), c = r();
    if (a === void 0 || c === void 0) break;
    const l = Number(a.trim());
    if (!Number.isInteger(l)) continue;
    const h = c.length > Zt ? c.slice(0, Zt) : c;
    h.length !== c.length && (o = !0), s.push({ code: l, value: h.trimEnd() });
  }
  return s.length >= Kt && i < n && e.push(`DXF BOM metadata scan was capped at ${Kt.toLocaleString()} group-code pairs.`), o && e.push(`One or more DXF metadata values were capped at ${Zt.toLocaleString()} characters.`), s;
}
function Ha(t, e) {
  var c;
  const n = [];
  let s = "", i = [], o = !1;
  const r = () => {
    if (i.length === 0 || s === "") {
      i = [];
      return;
    }
    n.length < go ? n.push({ section: s, type: i[0].value.trim().toUpperCase(), pairs: i }) : o = !0, i = [];
  };
  for (let l = 0; l < t.length; l += 1) {
    const h = t[l];
    if (h.code === 0 && h.value.trim().toUpperCase() === "SECTION") {
      r();
      const u = t[l + 1];
      s = (u == null ? void 0 : u.code) === 2 ? u.value.trim().toUpperCase() : "", (u == null ? void 0 : u.code) === 2 && (l += 1);
      continue;
    }
    if (h.code === 0 && h.value.trim().toUpperCase() === "ENDSEC") {
      r(), s = "";
      continue;
    }
    s && (h.code === 0 && r(), i.push(h));
  }
  r(), o && e.push(`DXF BOM metadata scan was capped at ${go.toLocaleString()} records.`);
  let a;
  for (const l of n)
    l.section === "BLOCKS" && (l.type === "BLOCK" ? (a = (c = J(l.pairs, 2)) != null ? c : J(l.pairs, 3), l.blockName = a) : l.type === "ENDBLK" ? (l.blockName = a, a = void 0) : l.blockName = a);
  return n;
}
function Wa(t) {
  const e = J(t.pairs, 2);
  if (!e) return;
  const n = { name: e }, s = U(t.pairs, 70);
  s !== void 0 && Number.isInteger(s) && (n.isFrozen = (s & 1) !== 0, n.isLocked = (s & 4) !== 0);
  const i = U(t.pairs, 62);
  i !== void 0 && Number.isInteger(i) && Math.abs(i) <= 256 && (n.colorIndex = Math.abs(i), n.isVisible = i >= 0);
  const o = U(t.pairs, 420);
  o !== void 0 && Number.isInteger(o) && o >= 0 && o <= 16777215 && (n.trueColor = o);
  const r = J(t.pairs, 6);
  r !== void 0 && (n.lineType = r);
  const a = U(t.pairs, 370);
  return a !== void 0 && (n.lineweight = a), n;
}
function Ya(t, e) {
  var s;
  const n = {
    type: "ATTRIB",
    handle: ne(t.pairs, 5),
    layer: (s = J(t.pairs, 8)) != null ? s : "0",
    text: Q(bo(t.pairs, [3, 1])),
    rawText: bo(t.pairs, [3, 1]),
    tag: Q(J(t.pairs, 2)),
    prompt: Q(J(t.pairs, 3)),
    attributeFlags: U(t.pairs, 70),
    insertionPoint: vr(t.pairs, 10),
    textHeight: U(t.pairs, 40),
    rotation: lc(U(t.pairs, 50)),
    isVisible: U(t.pairs, 60) !== 1,
    xdata: e
  };
  return bt(n, "ATTRIB", { includeUnknownProperties: !1 });
}
function Ua(t, e) {
  var l, h;
  const n = Pe(t.pairs, "AcDbTable"), s = mt(U(n, 91), 5e3), i = mt(U(n, 92), 5e3), o = Math.min(1e6, s * i), r = [];
  for (let u = 0; u < n.length; u += 1) n[u].code === 171 && r.push(u);
  const a = [];
  if (r.length > 0)
    for (let u = 0; u < Math.min(o || r.length, r.length); u += 1) {
      const f = n.slice(r[u], (l = r[u + 1]) != null ? l : n.length), d = sc(f);
      a.push({
        row: i > 0 ? Math.floor(u / i) : u,
        column: i > 0 ? u % i : 0,
        text: d,
        dataType: U(f, 171),
        formula: Q(J(f, 300)),
        isMerged: U(f, 173) === 1,
        blockTableRecordId: ne(f, 340)
      });
    }
  const c = {
    type: "ACAD_TABLE",
    handle: ne(t.pairs, 5),
    layer: (h = J(t.pairs, 8)) != null ? h : "0",
    insertionPoint: vr(t.pairs, 10),
    blockName: J(Pe(t.pairs, "AcDbBlockReference"), 2),
    rowCount: s,
    columnCount: i,
    rowHeights: yo(n, 141).slice(0, s),
    columnWidths: yo(n, 142).slice(0, i),
    cells: a,
    xdata: e
  };
  return bt(c, "ACAD_TABLE", { includeUnknownProperties: !1 });
}
function za(t) {
  var n, s;
  const e = [];
  for (let i = 0; i < t.pairs.length; i += 1) {
    if (t.pairs[i].code !== 3) continue;
    const o = t.pairs.slice(i + 1).find((r) => r.code === 350 || r.code === 360 || r.code === 3);
    o && o.code !== 3 && o.value && e.push({ name: (n = Q(t.pairs[i].value)) != null ? n : t.pairs[i].value, handle: o.value });
  }
  return {
    handle: (s = ne(t.pairs, 5)) != null ? s : ne(t.pairs, 105),
    ownerHandle: xr(t.pairs),
    entries: e
  };
}
function Va(t, e) {
  var o, r;
  const n = Pe(t.pairs, "AcDbXrecord"), s = n.findIndex((a) => a.code === 280), i = n.filter((a, c) => c !== s);
  return i.length > Jt && e.push(`DXF XRECORD ${(o = ne(t.pairs, 5)) != null ? o : "(handleless)"} was capped at ${Jt.toLocaleString()} values.`), {
    handle: (r = ne(t.pairs, 5)) != null ? r : ne(t.pairs, 105),
    ownerHandle: xr(t.pairs),
    cloning: U(n, 280),
    data: i.slice(0, Jt).map((a) => ({ code: a.code, value: wr(a) }))
  };
}
function ja(t) {
  var h, u, f, d, m;
  const e = Pe(t.pairs, "AcDbDataLink"), n = U(e, 170), s = U(e, 171), i = U(e, 172), o = (h = U(e, 173)) != null ? h : 0, r = (u = U(e, 174)) != null ? u : 0, a = (f = U(e, 175)) != null ? f : 0, c = (d = U(e, 176)) != null ? d : 0, l = n && s && i ? hc(n, s, i, o, r, a, c) : void 0;
  return {
    handle: (m = ne(t.pairs, 5)) != null ? m : ne(t.pairs, 105),
    dataAdapter: Q(J(e, 1)),
    description: Q(J(e, 300)),
    tooltip: Q(J(e, 301)),
    connectionString: Q(J(e, 302)),
    updateOption: U(e, 91),
    pathOption: U(e, 177),
    updateStatus: Q(J(e, 304)),
    lastUpdated: l
  };
}
function Ga(t) {
  var r, a, c;
  const e = Pe(t.pairs, "AcDbDataTable", "ACDBDATATABLE"), n = mt(U(e, 90), 1e5), s = mt(U(e, 91), 1e6), i = [], o = [];
  for (let l = 0; l < e.length; l += 1) e[l].code === 92 && o.push(l);
  for (let l = 0; l < Math.min(n || o.length, o.length); l += 1) {
    const h = e.slice(o[l], (r = o[l + 1]) != null ? r : e.length), u = (a = Q(J(h, 2))) != null ? a : `Column ${l + 1}`, f = h.findIndex((p) => p.code === 2), d = Ja(h.slice(f + 1)), m = s > 0 ? d.slice(0, s) : d;
    i.push({ name: u, type: U(h, 92), values: m });
  }
  return {
    handle: (c = ne(t.pairs, 5)) != null ? c : ne(t.pairs, 105),
    name: Q(J(e, 1)),
    rowCount: s || Math.max(0, ...i.map((l) => l.values.length)),
    columnCount: n || i.length,
    columns: i
  };
}
function qa(t) {
  var c;
  const e = Pe(t.pairs, "AcDbLinkedTableData");
  if (e.length === 0) return;
  const n = Q(J(Pe(t.pairs, "AcDbLinkedData"), 1)), s = [];
  for (let l = 0; l < e.length; l += 1) {
    if (e[l].code !== 300 || e[l].value.trim().toUpperCase() !== "VALUE") continue;
    const h = nc(e, l + 1, ["CELLCONTENT_END", "FORMATTEDCELLCONTENT_BEGIN"]), u = tc(e.slice(l + 1, h));
    s.push(u != null ? u : ""), l = Math.max(l, h - 1);
  }
  if (s.length === 0) return;
  const i = Qa(e), o = Math.max(1, i.length || ec(e, s.length)), r = Math.max(1, Math.ceil(s.length / o)), a = Array.from({ length: o }, (l, h) => {
    var u;
    return {
      name: (u = i[h]) != null ? u : `Column ${h + 1}`,
      values: Array.from({ length: r }, (f, d) => {
        var m;
        return (m = s[d * o + h]) != null ? m : "";
      })
    };
  });
  return {
    handle: (c = ne(t.pairs, 5)) != null ? c : ne(t.pairs, 105),
    name: n,
    rowCount: r,
    columnCount: o,
    columns: a
  };
}
function Ka(t, e, n) {
  var a, c, l;
  const s = [];
  let i, o = 0, r = !1;
  for (let h = 0; h < t.length; h += 1) {
    const u = t[h];
    if (u.code === 1001) {
      if (s.length >= Ba) {
        i = void 0, r = !0;
        continue;
      }
      i = { appName: (a = Q(u.value)) != null ? a : u.value, entries: [] }, s.push(i);
    } else if (i && u.code >= 1e3 && u.code <= 1071) {
      if (o >= Oa) {
        r = !0;
        continue;
      }
      let f = wr(u);
      if (u.code >= 1010 && u.code <= 1013) {
        const m = ((c = t[h + 1]) == null ? void 0 : c.code) === u.code + 10 ? t[h + 1] : void 0, p = ((l = t[h + (m ? 2 : 1)]) == null ? void 0 : l.code) === u.code + 20 ? t[h + (m ? 2 : 1)] : void 0, b = Number(u.value), g = Number(m == null ? void 0 : m.value), y = Number(p == null ? void 0 : p.value);
        Number.isFinite(b) && Number.isFinite(g) && (f = Number.isFinite(y) ? { x: b, y: g, z: y } : { x: b, y: g }), m && (h += 1), p && (h += 1);
      }
      const d = { code: u.code, value: f };
      i.entries.push(d), o += 1;
    }
  }
  return r && e.push(`DXF XDATA on ${n} exceeded its safe metadata limit and was truncated.`), s.filter((h) => h.entries.length > 0);
}
function Za(t, e) {
  var i;
  const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  for (const o of t) {
    o.handle && n.set(ie(o.handle), o);
    for (const r of o.entries) s.set(ie(r.handle), { name: r.name, dictionary: o });
  }
  for (const o of e) {
    if (!o.handle) continue;
    const r = s.get(ie(o.handle));
    if (!r) continue;
    o.entryName = r.name;
    const a = [r.name];
    let c = r.dictionary;
    const l = /* @__PURE__ */ new Set();
    for (; c != null && c.handle && !l.has(ie(c.handle)); ) {
      l.add(ie(c.handle));
      const h = s.get(ie(c.handle));
      if (!h) break;
      a.unshift(h.name), c = n.get(ie((i = h.dictionary.handle) != null ? i : ""));
    }
    o.dictionaryPath = a;
  }
}
function Ja(t) {
  var n, s, i;
  const e = [];
  for (let o = 0; o < t.length; o += 1) {
    const r = t[o];
    if (r.code === 71) e.push(r.value.trim() !== "0");
    else if (r.code === 93 || r.code === 40) e.push(kr(r.value));
    else if (r.code === 3) e.push((n = Q(r.value)) != null ? n : r.value);
    else if ([331, 360, 350, 340, 330].includes(r.code)) e.push(r.value);
    else if (r.code === 10 || r.code === 11) {
      const a = ((s = t[o + 1]) == null ? void 0 : s.code) === r.code + 10 ? t[o + 1] : void 0, c = ((i = t[o + (a ? 2 : 1)]) == null ? void 0 : i.code) === r.code + 20 ? t[o + (a ? 2 : 1)] : void 0, l = Number(r.value), h = Number(a == null ? void 0 : a.value), u = Number(c == null ? void 0 : c.value);
      Number.isFinite(l) && Number.isFinite(h) && e.push(Number.isFinite(u) ? { x: l, y: h, z: u } : { x: l, y: h }), a && (o += 1), c && (o += 1);
    }
  }
  return e;
}
function Qa(t) {
  var n;
  const e = [];
  for (let s = 0; s < t.length - 1; s += 1) {
    if (t[s].code !== 300) continue;
    const i = t[s + 1];
    i.code === 1 && i.value.trim().toUpperCase() === "LINKEDTABLEDATACOLUMN_BEGIN" && e.push((n = Q(t[s].value)) != null ? n : t[s].value);
  }
  return e;
}
function ec(t, e) {
  const n = t.find((i, o) => {
    var r;
    return i.code === 90 && ((r = t[o - 1]) == null ? void 0 : r.value) !== "VALUE";
  }), s = mt(n ? Number(n.value) : void 0, 1e5);
  return s > 0 ? Math.min(s, Math.max(1, e)) : 1;
}
function tc(t) {
  var e;
  for (const n of t)
    if (!(n.code === 300 && /^(VALUE|CONTENTFORMAT|CELLCONTENT)/i.test(n.value))) {
      if ([1, 2, 3, 300, 301, 302, 303, 304].includes(n.code)) return (e = Q(n.value)) != null ? e : n.value;
      if (n.code >= 10 && n.code <= 59 || n.code >= 90 && n.code <= 99 || n.code >= 170 && n.code <= 179 || n.code >= 270 && n.code <= 299) return kr(n.value);
      if (n.code >= 310 && n.code <= 369) return n.value;
    }
}
function nc(t, e, n) {
  const s = new Set(n.map((i) => i.toUpperCase()));
  for (let i = e; i < t.length; i += 1) if (s.has(t[i].value.trim().toUpperCase())) return i;
  return t.length;
}
function sc(t) {
  var s;
  const e = t.filter((i) => i.code === 302).map((i) => i.value), n = t.filter((i) => i.code === 303 || i.code === 1).map((i) => i.value);
  return (s = Q((n.length > 0 ? n : e).join(""))) != null ? s : "";
}
function Pe(t, ...e) {
  const n = new Set(e.map((i) => i.toUpperCase()));
  let s = -1;
  for (let i = 0; i < t.length; i += 1)
    t[i].code === 100 && n.has(t[i].value.trim().toUpperCase()) && (s = i + 1);
  return s >= 0 ? t.slice(s) : t;
}
function ic(t) {
  var n;
  const e = Pe(t, "AcDbAttribute");
  return (n = ne(e, 330)) != null ? n : ne(t, 330);
}
function xr(t) {
  var s, i, o;
  const e = t.findIndex((r) => r.code === 100);
  return (o = (s = t.slice(0, e >= 0 ? e : t.length).filter((r) => r.code === 330).at(-1)) == null ? void 0 : s.value) != null ? o : (i = t.find((r) => r.code === 330)) == null ? void 0 : i.value;
}
function J(t, e) {
  var n;
  return R((n = t.find((s) => s.code === e)) == null ? void 0 : n.value);
}
function bo(t, e) {
  const n = t.filter((s) => e.includes(s.code)).map((s) => s.value);
  return n.length > 0 ? n.join("") : void 0;
}
function ne(t, e) {
  const n = J(t, e);
  return (n == null ? void 0 : n.trim()) || void 0;
}
function U(t, e) {
  const n = t.find((i) => i.code === e);
  if (!n) return;
  const s = Number(n.value);
  return Number.isFinite(s) ? s : void 0;
}
function yo(t, e) {
  return t.filter((n) => n.code === e).map((n) => Number(n.value)).filter(Number.isFinite);
}
function vr(t, e) {
  const n = U(t, e), s = U(t, e + 10), i = U(t, e + 20);
  if (!(n === void 0 || s === void 0))
    return i === void 0 ? { x: n, y: s } : { x: n, y: s, z: i };
}
function wr(t) {
  var n;
  if (t.code === 290) return t.value.trim() !== "0";
  if (oc(t.code)) return (n = Q(t.value)) != null ? n : t.value;
  const e = Number(t.value);
  return Number.isFinite(e) ? e : t.value;
}
function oc(t) {
  return t >= 0 && t <= 9 || t === 100 || t === 101 || t === 102 || t === 105 || t >= 300 && t <= 369 || t >= 390 && t <= 399 || t >= 410 && t <= 419 || t >= 430 && t <= 439 || t >= 470 && t <= 481 || t >= 999 && t <= 1009;
}
function Q(t) {
  const e = R(t);
  if (e !== void 0)
    return e.replace(/\\\\|\\U\+([0-9a-fA-F]{4})|%%([cCdDpP])|\\P/g, (n, s, i) => s ? String.fromCharCode(parseInt(s, 16)) : i ? i.toLowerCase() === "c" ? "∅" : i.toLowerCase() === "d" ? "°" : "±" : n === "\\P" ? `
` : n);
}
function Cr(t, e) {
  t.handle && e.set(ie(t.handle), t);
}
function xo(t, e, n, s) {
  var o;
  const i = /* @__PURE__ */ new Map();
  for (const r of t) {
    Cr(r, n);
    const a = Sr(r.type);
    if (!Nr(a)) continue;
    const c = (o = i.get(a)) != null ? o : 0;
    i.set(a, c + 1), s.set(Lt({ context: e, type: a, ordinal: c }), r);
  }
}
function rc(t, e, n) {
  var r;
  if (t.section !== "ENTITIES" && t.section !== "BLOCKS") return;
  const s = Sr(t.type);
  if (!Nr(s)) return;
  const i = `${e}\0${s}`, o = (r = n.get(i)) != null ? r : 0;
  return n.set(i, o + 1), { context: e, type: s, ordinal: o };
}
function Sr(t) {
  const e = t.trim().toUpperCase();
  return e === "MINSERT" ? "INSERT" : /^POLYLINE(?:2D|3D|_2D|_3D)?$/.test(e) ? "POLYLINE" : e === "ACAD_TABLE" || e === "ACDBTABLE" ? "TABLE" : e;
}
function Nr(t) {
  return !["", "ATTRIB", "SEQEND", "VERTEX", "BLOCK", "ENDBLK"].includes(t);
}
function cn(t, e) {
  var n;
  return `${t.trim().toUpperCase()}\0${(n = e == null ? void 0 : e.trim().toUpperCase()) != null ? n : ""}`;
}
function Lt(t) {
  return `${t.context}\0${t.type}\0${t.ordinal}`;
}
function ac(t, e) {
  var n, s, i, o, r, a;
  return t.handle && e.handle ? ie(t.handle) === ie(e.handle) : ((n = t.attributeTag) != null ? n : "").trim().toLocaleUpperCase() === ((s = e.attributeTag) != null ? s : "").trim().toLocaleUpperCase() && ((o = (i = t.text) != null ? i : t.value) != null ? o : "") === ((a = (r = e.text) != null ? r : e.value) != null ? a : "") && cc(t.insertionPoint, e.insertionPoint);
}
function cc(t, e) {
  var n, s;
  return !t || !e ? t === e : t.x === e.x && t.y === e.y && ((n = t.z) != null ? n : 0) === ((s = e.z) != null ? s : 0);
}
function ie(t) {
  return t.trim().toUpperCase();
}
function mt(t, e) {
  return !Number.isFinite(t) || t === void 0 || t <= 0 ? 0 : Math.min(e, Math.trunc(t));
}
function lc(t) {
  return t === void 0 ? void 0 : t * Math.PI / 180;
}
function kr(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : t;
}
function hc(t, e, n, s, i, o, r) {
  const a = new Date(Date.UTC(t, e - 1, n, s, i, o, r));
  return Number.isNaN(a.getTime()) ? void 0 : a.toISOString();
}
function kt(t, e) {
  const n = [...t != null ? t : []], s = /* @__PURE__ */ new Map();
  n.forEach((i, o) => {
    i.handle && s.set(ie(i.handle), o);
  });
  for (const i of e) {
    const o = i.handle ? ie(i.handle) : void 0, r = o ? s.get(o) : void 0;
    r === void 0 ? (o && s.set(o, n.length), n.push(i)) : n[r] = i;
  }
  return n;
}
class uc {
  constructor(e = {}) {
    P(this, "id", "dxf");
    P(this, "label", "DXF / JavaScript parser");
    P(this, "formats", ["dxf"]);
    P(this, "defaults");
    this.defaults = e;
  }
  accepts(e, n) {
    return Oe(e) === "dxf" || _e(e, n) === "dxf";
  }
  async load(e, n = {}) {
    var u, f;
    const s = { ...this.defaults, ...n }, i = performance.now(), o = await ht(e), r = xc(o, s.dxfEncoding), a = [];
    let c;
    try {
      c = await fc(r);
    } catch (d) {
      a.push(`dxf-parser failed, using built-in fallback parser: ${d instanceof Error ? d.message : String(d)}`), c = Pc(r);
    }
    const l = dc(c, (f = e.fileName) != null ? f : (u = e.file) == null ? void 0 : u.name, a);
    $a(l, _a(r));
    const h = performance.now() - i;
    return { document: l, raw: c, bytes: o.byteLength, elapsedMs: h, format: "dxf", warnings: l.warnings };
  }
}
async function fc(t) {
  var s;
  const e = await import("./dxf-parser/dist/index.js"), n = (s = e.default) != null ? s : e.DxfParser;
  if (!n) throw new Error("dxf-parser did not expose a parser constructor.");
  return new n().parseSync(t);
}
function dc(t, e, n = []) {
  const s = t && typeof t == "object" ? t : {}, i = mc(s), o = pc(s), a = (Array.isArray(s.entities) ? s.entities : []).filter((l) => !!l && typeof l == "object").map((l) => Mn(l)), c = Sn({
    format: "dxf",
    sourceName: e,
    header: s.header && typeof s.header == "object" ? s.header : {},
    layers: i,
    blocks: o,
    entities: a,
    metadata: { parser: "dxf-parser + cad-viewer normalizer" },
    warnings: n,
    raw: t
  });
  return a.length === 0 && c.warnings.push("DXF file did not expose any ENTITIES."), c;
}
function Mn(t) {
  var o, r, a, c, l, h, u, f, d, m, p, b, g, y, x, v, w, C, S, D, L, I, M, N, A, k, E, B, $, F, O, X, H, W, Y, j, ee, Z, he, ue, ve, we, Ce, Se, Ne, Ge, qe, Ke, Ze, Je, Qe;
  const e = String((r = (o = t.type) != null ? o : t.entityType) != null ? r : "UNKNOWN").toUpperCase(), n = bt(t, e), s = T((c = (a = t.colorIndex) != null ? a : t.colorNumber) != null ? c : t.aci), i = T(t.color);
  if (n.colorIndex = s != null ? s : i !== void 0 && Math.abs(i) <= 257 ? i : void 0, n.trueColor = (f = (u = (h = (l = t.trueColor) != null ? l : t.true_color) != null ? h : t.colorRGB) != null ? u : t.trueColorValue) != null ? f : i !== void 0 && Math.abs(i) > 257 ? i : void 0, n.layer = (m = R((d = t.layer) != null ? d : t.layerName)) != null ? m : "0", n.isClosed = !!((b = (p = t.shape) != null ? p : t.closed) != null ? b : t.isClosed) || (Number((y = (g = t.flag) != null ? g : t.flags) != null ? y : 0) & 1) === 1, e === "LINE" && (n.startPoint = (D = (C = n.startPoint) != null ? C : K({ x: (x = t.x1) != null ? x : t.x, y: (v = t.y1) != null ? v : t.y, z: (w = t.z1) != null ? w : t.z })) != null ? D : (S = n.vertices) == null ? void 0 : S[0], n.endPoint = (M = (L = n.endPoint) != null ? L : K({ x: t.x2, y: t.y2, z: t.z2 })) != null ? M : (I = n.vertices) == null ? void 0 : I[1]), (e === "TEXT" || e === "MTEXT" || e === "ATTRIB" || e === "ATTDEF") && (n.insertionPoint = (k = K((A = (N = t.startPoint) != null ? N : t.position) != null ? A : t.insertionPoint)) != null ? k : n.insertionPoint, n.rawText = R(($ = (B = (E = t.rawText) != null ? E : t.text) != null ? B : t.string) != null ? $ : t.value), n.text = (F = Mc(n.rawText, e === "MTEXT")) != null ? F : n.text, n.textHeight = (X = T((O = t.textHeight) != null ? O : t.height)) != null ? X : n.textHeight, n.rotation = wo((H = t.rotation) != null ? H : t.angle)), (e === "ARC" || e === "ELLIPSE") && (n.startAngle = Co((W = t.startAngle) != null ? W : t.start_angle), n.endAngle = Co((Y = t.endAngle) != null ? Y : t.end_angle)), e === "INSERT") {
    n.blockName = (ee = R((j = t.name) != null ? j : t.blockName)) != null ? ee : n.blockName, n.insertionPoint = (ue = K((he = (Z = t.position) != null ? Z : t.insertionPoint) != null ? he : t.point)) != null ? ue : n.insertionPoint;
    const de = T((we = (ve = t.xScale) != null ? ve : t.scaleX) != null ? we : t.xscale), pe = T((Se = (Ce = t.yScale) != null ? Ce : t.scaleY) != null ? Se : t.yscale), Te = T((Ge = (Ne = t.zScale) != null ? Ne : t.scaleZ) != null ? Ge : t.zscale);
    (de !== void 0 || pe !== void 0 || Te !== void 0) && (n.scale = { x: de != null ? de : 1, y: (qe = pe != null ? pe : de) != null ? qe : 1, z: Te != null ? Te : 1 }), n.rotation = wo((Ke = t.rotation) != null ? Ke : t.angle);
  }
  if (e === "SPLINE") {
    const de = Bt((Je = (Ze = t.controlPoints) != null ? Ze : t.control_points) != null ? Je : t.points);
    de.length && (n.controlPoints = de);
    const pe = Bt((Qe = t.fitPoints) != null ? Qe : t.fit_points);
    pe.length && (n.fitPoints = pe);
  }
  return e === "HATCH" && (n.loops = yc(t), n.fillColorIndex = n.colorIndex), (e === "SOLID" || e === "TRACE" || e === "3DFACE") && (n.vertices = bc(t), n.fillColorIndex = n.colorIndex), n;
}
function mc(t) {
  var o, r, a, c, l, h, u, f, d, m, p, b, g, y, x, v, w, C, S, D, L, I;
  const e = /* @__PURE__ */ Object.create(null), n = t.tables, s = (a = (r = (o = t.layers) != null ? o : n == null ? void 0 : n.layer) != null ? r : n == null ? void 0 : n.LAYER) != null ? a : n == null ? void 0 : n.layers, i = gc(s);
  for (const M of i) {
    const N = M, A = R((c = N.name) != null ? c : N.layerName);
    A && Ft(e, {
      name: A,
      color: (h = (l = N.color) != null ? l : N.colorNumber) != null ? h : N.colorIndex,
      colorIndex: T((f = (u = N.colorNumber) != null ? u : N.colorIndex) != null ? f : N.color),
      trueColor: T((d = N.trueColor) != null ? d : N.true_color),
      lineType: R((m = N.lineType) != null ? m : N.linetype),
      lineweight: T((p = N.lineweight) != null ? p : N.lineWeight),
      // dxf-parser stores a negative layer color (62 < 0) as Math.abs(color)
      // plus visible:false, so the sign alone cannot detect a turned-off layer.
      isVisible: N.isVisible === !1 || N.visible === !1 || N.off === !0 ? !1 : Number((y = (g = (b = N.colorNumber) != null ? b : N.colorIndex) != null ? g : N.color) != null ? y : 1) >= 0,
      isFrozen: !!((C = (x = N.isFrozen) != null ? x : N.frozen) != null ? C : Number((w = (v = N.flags) != null ? v : N.flag) != null ? w : 0) & 1),
      isLocked: !!((I = (S = N.isLocked) != null ? S : N.locked) != null ? I : Number((L = (D = N.flags) != null ? D : N.flag) != null ? L : 0) & 4),
      raw: N
    });
  }
  return e[0] || Ft(e, { name: "0", colorIndex: 7, isVisible: !0 }), e;
}
function pc(t) {
  const e = {}, n = t.blocks;
  if (!n || typeof n != "object") return e;
  if (Array.isArray(n))
    for (const s of n) vo(e, s);
  else
    for (const [s, i] of Object.entries(n)) vo(e, i, s);
  return e;
}
function vo(t, e, n) {
  var a, c, l, h;
  if (!e || typeof e != "object") return;
  const s = e, i = R((c = (a = s.name) != null ? a : s.blockName) != null ? c : n);
  if (!i) return;
  const r = (Array.isArray(s.entities) ? s.entities : []).filter((u) => !!u && typeof u == "object").map((u) => Mn(u));
  cr(t, { name: i, basePoint: (h = K((l = s.basePoint) != null ? l : s.position)) != null ? h : { x: 0, y: 0 }, entities: r, raw: s });
}
function gc(t) {
  if (!t) return [];
  if (Array.isArray(t)) return t;
  if (typeof t != "object") return [];
  const e = t;
  return Array.isArray(e.entries) ? e.entries : Array.isArray(e.records) ? e.records : Array.isArray(e.layers) ? e.layers : e.layers && typeof e.layers == "object" ? Object.values(e.layers) : Object.values(e).filter((n) => n && typeof n == "object");
}
function Bt(t) {
  return Array.isArray(t) ? t.map(K).filter((e) => !!e) : [];
}
function bc(t) {
  var s, i, o, r;
  const e = Bt((s = t.vertices) != null ? s : t.points);
  if (e.length) return e;
  const n = [];
  for (let a = 0; a < 4; a++) {
    const c = K({ x: (i = t[`x${a}`]) != null ? i : t[`x${a + 1}`], y: (o = t[`y${a}`]) != null ? o : t[`y${a + 1}`], z: (r = t[`z${a}`]) != null ? r : t[`z${a + 1}`] });
    c && n.push(c);
  }
  return n;
}
function yc(t) {
  var n, s;
  const e = (s = (n = t.boundaryLoops) != null ? n : t.loops) != null ? s : t.paths;
  if (Array.isArray(e))
    return e.map((i) => {
      var a;
      const o = i;
      return { vertices: Bt((a = o.vertices) != null ? a : o.points), isClosed: !0 };
    }).filter((i) => i.vertices && i.vertices.length > 0);
}
function wo(t) {
  const e = T(t);
  if (e !== void 0)
    return Math.abs(e) > Math.PI * 2 + 1e-6 ? Ie(e) : e;
}
function Co(t) {
  const e = T(t);
  if (e !== void 0)
    return Math.abs(e) > Math.PI * 2 + 1e-6 ? Ie(e) : e;
}
function xc(t, e) {
  const n = ln(e);
  if (n) return $e(t, n);
  const s = vc(t);
  if (s) return $e(t, s);
  let i;
  try {
    i = new TextDecoder("utf-8", { fatal: !0 }).decode(t);
  } catch (r) {
  }
  const o = ln(Sc(t));
  return i !== void 0 && (o === "utf-8" || Cc(wc(t))) ? i : o ? $e(t, o) : i !== void 0 ? i : Nc(t);
}
const So = {
  ANSI_874: "windows-874",
  ANSI_932: "shift_jis",
  ANSI_936: "gb18030",
  ANSI_949: "euc-kr",
  ANSI_950: "big5",
  ANSI_1250: "windows-1250",
  ANSI_1251: "windows-1251",
  ANSI_1252: "windows-1252",
  ANSI_1253: "windows-1253",
  ANSI_1254: "windows-1254",
  ANSI_1255: "windows-1255",
  ANSI_1256: "windows-1256",
  ANSI_1257: "windows-1257",
  ANSI_1258: "windows-1258",
  BIG5: "big5",
  CP874: "windows-874",
  CP932: "shift_jis",
  CP936: "gb18030",
  CP949: "euc-kr",
  CP950: "big5",
  CP1250: "windows-1250",
  CP1251: "windows-1251",
  CP1252: "windows-1252",
  CP1253: "windows-1253",
  CP1254: "windows-1254",
  CP1255: "windows-1255",
  CP1256: "windows-1256",
  CP1257: "windows-1257",
  CP1258: "windows-1258",
  GB18030: "gb18030",
  GB2312: "gb18030",
  GBK: "gb18030",
  SHIFT_JIS: "shift_jis",
  SHIFTJIS: "shift_jis",
  SJIS: "shift_jis",
  UTF8: "utf-8",
  UTF_8: "utf-8",
  UTF16: "utf-16le",
  UTF_16: "utf-16le",
  UTF16LE: "utf-16le",
  UTF_16LE: "utf-16le",
  UTF16BE: "utf-16be",
  UTF_16BE: "utf-16be"
};
function vc(t) {
  if (t.length >= 3 && t[0] === 239 && t[1] === 187 && t[2] === 191) return "utf-8";
  if (t.length >= 2 && t[0] === 255 && t[1] === 254) return "utf-16le";
  if (t.length >= 2 && t[0] === 254 && t[1] === 255) return "utf-16be";
}
function Mr(t, e, n) {
  var a, c, l, h, u;
  const i = $e(t.subarray(0, Math.min(t.byteLength, 131072)), "iso-8859-1").replace(/\r\n/g, `
`).replace(/\r/g, `
`).split(`
`);
  let o = !1, r = "";
  for (let f = 0; f < i.length - 1; f += 2) {
    const d = (a = i[f]) == null ? void 0 : a.trim(), m = (c = i[f + 1]) == null ? void 0 : c.trim();
    if (d === "0" && (m == null ? void 0 : m.toUpperCase()) === "SECTION") {
      o = ((l = i[f + 2]) == null ? void 0 : l.trim()) === "2" && ((h = i[f + 3]) == null ? void 0 : h.trim().toUpperCase()) === "HEADER", r = "";
      continue;
    }
    if (d === "0" && (o = !1, r = ""), !!o) {
      if (d === "9") r = (u = m == null ? void 0 : m.toUpperCase()) != null ? u : "";
      else if (r === e && d === n && m) return m;
    }
  }
}
function wc(t) {
  var e;
  return (e = Mr(t, "$ACADVER", "1")) == null ? void 0 : e.toUpperCase();
}
function Cc(t) {
  const e = t ? /^AC(\d{4})$/.exec(t) : null;
  return !!e && Number(e[1]) >= 1021;
}
function Sc(t) {
  return Mr(t, "$DWGCODEPAGE", "3");
}
function ln(t) {
  const e = t == null ? void 0 : t.trim();
  if (!e) return;
  const n = e.replace(/[-\s]+/g, "_").toUpperCase();
  if (So[n]) return So[n];
  const s = /^ANSI_(\d{3,4})$/.exec(n);
  if (s) return ln(`cp${s[1]}`);
  const i = /^CP(\d{3,4})$/.exec(n);
  return i ? i[1] === "936" ? "gb18030" : i[1] === "950" ? "big5" : i[1] === "932" ? "shift_jis" : i[1] === "949" ? "euc-kr" : `windows-${i[1]}` : e;
}
function $e(t, e) {
  try {
    return new TextDecoder(e, { fatal: !1 }).decode(t);
  } catch (n) {
    return new TextDecoder("utf-8", { fatal: !1 }).decode(t);
  }
}
function Nc(t) {
  const e = ["windows-1252", "gb18030", "big5", "shift_jis", "euc-kr", "iso-8859-1"];
  let n = "", s = Number.POSITIVE_INFINITY;
  for (const i of e) {
    const o = $e(t, i), r = kc(o, i);
    r < s && (s = r, n = o);
  }
  return n || $e(t, "utf-8");
}
function kc(t, e) {
  const n = Qt(t, /\uFFFD/g), s = Qt(t, /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g), i = Qt(t, /[\u3400-\u9FFF\uF900-\uFAFF]/g), o = t.includes("SECTION") && (t.includes("ENTITIES") || t.includes("HEADER"));
  let r = n * 1e4 + s * 1e3;
  return o && (r -= 500), e === "windows-1252" && (r -= 2), e === "gb18030" && i >= 2 && (r -= 50 + Math.min(i, 200) * 2), r;
}
function Qt(t, e) {
  var n, s;
  return (s = (n = t.match(e)) == null ? void 0 : n.length) != null ? s : 0;
}
function Mc(t, e) {
  const n = R(t);
  if (n !== void 0)
    return Nn(n, e).text;
}
function Pc(t) {
  var l, h, u;
  const e = t.replace(/\r\n/g, `
`).replace(/\r/g, `
`).split(`
`), n = [];
  for (let f = 0; f < e.length - 1; f += 2) {
    const d = Number((l = e[f]) == null ? void 0 : l.trim()), m = (h = e[f + 1]) != null ? h : "";
    Number.isFinite(d) && n.push({ code: d, value: m.trimEnd() });
  }
  const s = [], i = {};
  let o = "", r = [], a;
  for (let f = 0; f < n.length; f++) {
    const d = n[f];
    if (d.code === 0 && d.value === "SECTION") {
      o = ((u = n[f + 1]) == null ? void 0 : u.code) === 2 ? n[f + 1].value.toUpperCase() : "", f++;
      continue;
    }
    if (d.code === 0 && d.value === "ENDSEC") {
      c(), o = "";
      continue;
    }
    o === "ENTITIES" && (d.code === 0 ? (c(), r = [d]) : r.push(d));
  }
  return c(), { header: {}, tables: {}, entities: s, blocks: i };
  function c() {
    var m, p;
    if (!r.length) return;
    const f = (m = r[0]) == null ? void 0 : m.value.toUpperCase();
    if (f === "VERTEX" && a) {
      const b = ae(r, 10, 20, 30);
      b && ((p = a.vertices) != null ? p : a.vertices = []).push({ ...b, bulge: z(r, 42) }), r = [];
      return;
    }
    if (f === "SEQEND") {
      a && s.push(a), a = void 0, r = [];
      return;
    }
    if (a && (s.push(a), a = void 0), !f || f === "EOF") {
      r = [];
      return;
    }
    const d = Tc(f, r);
    f === "POLYLINE" ? a = d : s.push(d), r = [];
  }
}
function Tc(t, e) {
  var s, i, o, r, a, c, l, h;
  const n = {
    type: t,
    handle: tt(e, 5),
    layer: (s = tt(e, 8)) != null ? s : "0",
    colorIndex: z(e, 62),
    trueColor: z(e, 420),
    lineType: tt(e, 6),
    lineweight: z(e, 370)
  };
  switch (t) {
    case "LINE":
      Object.assign(n, { startPoint: ae(e, 10, 20, 30), endPoint: ae(e, 11, 21, 31) });
      break;
    case "CIRCLE":
      Object.assign(n, { center: ae(e, 10, 20, 30), radius: z(e, 40) });
      break;
    case "ARC":
      Object.assign(n, { center: ae(e, 10, 20, 30), radius: z(e, 40), startAngle: Mt(z(e, 50)), endAngle: Mt(z(e, 51)) });
      break;
    case "POINT":
      Object.assign(n, { point: ae(e, 10, 20, 30) });
      break;
    case "TEXT":
    case "MTEXT":
      Object.assign(n, { insertionPoint: ae(e, 10, 20, 30), text: Lc(e), textHeight: z(e, 40), rotation: Mt(z(e, 50)) });
      break;
    case "LWPOLYLINE":
      Object.assign(n, { vertices: Ec(e), flag: z(e, 70), isClosed: (Number((i = z(e, 70)) != null ? i : 0) & 1) === 1 });
      break;
    case "POLYLINE":
      Object.assign(n, { vertices: [], flag: z(e, 70), isClosed: (Number((o = z(e, 70)) != null ? o : 0) & 1) === 1 });
      break;
    case "ELLIPSE":
      Object.assign(n, { center: ae(e, 10, 20, 30), majorAxisEndPoint: ae(e, 11, 21, 31), axisRatio: z(e, 40), startAngle: z(e, 41), endAngle: z(e, 42) });
      break;
    case "SPLINE":
      Object.assign(n, { controlPoints: Ac(e, 10, 20, 30), degree: z(e, 71), isClosed: (Number((r = z(e, 70)) != null ? r : 0) & 1) === 1 });
      break;
    case "INSERT":
      Object.assign(n, { name: tt(e, 2), blockName: tt(e, 2), insertionPoint: ae(e, 10, 20, 30), rotation: Mt(z(e, 50)), scale: { x: (a = z(e, 41)) != null ? a : 1, y: (l = (c = z(e, 42)) != null ? c : z(e, 41)) != null ? l : 1, z: (h = z(e, 43)) != null ? h : 1 } });
      break;
    case "SOLID":
    case "TRACE":
    case "3DFACE":
      Object.assign(n, { vertices: [ae(e, 10, 20, 30), ae(e, 11, 21, 31), ae(e, 12, 22, 32), ae(e, 13, 23, 33)].filter(Boolean) });
      break;
  }
  return Mn(n);
}
function z(t, e) {
  var i;
  const n = (i = t.find((o) => o.code === e)) == null ? void 0 : i.value, s = Number(n);
  return Number.isFinite(s) ? s : void 0;
}
function tt(t, e) {
  var s;
  const n = (s = t.find((i) => i.code === e)) == null ? void 0 : s.value;
  return n && n.length > 0 ? n : void 0;
}
function ae(t, e, n, s) {
  const i = z(t, e), o = z(t, n), r = z(t, s);
  if (!(i === void 0 || o === void 0))
    return r === void 0 ? { x: i, y: o } : { x: i, y: o, z: r };
}
function Ac(t, e, n, s) {
  const i = [];
  for (let o = 0; o < t.length; o++) {
    if (t[o].code !== e) continue;
    const r = Number(t[o].value), a = t.slice(o + 1).find((u) => u.code === n), c = t.slice(o + 1).find((u) => u.code === s), l = Number(a == null ? void 0 : a.value), h = Number(c == null ? void 0 : c.value);
    Number.isFinite(r) && Number.isFinite(l) && i.push(Number.isFinite(h) ? { x: r, y: l, z: h } : { x: r, y: l });
  }
  return i;
}
function Ec(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    if (t[n].code !== 10) continue;
    const s = Number(t[n].value);
    let i, o;
    for (let r = n + 1; r < t.length && t[r].code !== 10; r++)
      t[r].code === 20 && (i = Number(t[r].value)), t[r].code === 42 && (o = Number(t[r].value));
    Number.isFinite(s) && Number.isFinite(i) && e.push({ x: s, y: i, bulge: Number.isFinite(o) ? o : void 0 });
  }
  return e;
}
function Lc(t) {
  const e = t.filter((n) => n.code === 1 || n.code === 3).map((n) => n.value);
  return e.length ? e.join("") : void 0;
}
function Mt(t) {
  return typeof t == "number" && Number.isFinite(t) ? Ie(t) : void 0;
}
function Pn(t) {
  const e = t[0];
  if (!e || !e.width || !e.height) throw new Error("CAD canvas is not ready for capture.");
  const n = e.ownerDocument.createElement("canvas");
  n.width = e.width, n.height = e.height;
  const s = n.getContext("2d");
  if (!s) throw new Error("Canvas 2D is required for CAD capture.");
  for (const i of t)
    s.drawImage(i, 0, 0, n.width, n.height);
  return n;
}
class Ic {
  constructor(e = {}) {
    P(this, "id", "dwf");
    P(this, "label", "DWF/DWFx native viewer powered by dwf-viewer");
    P(this, "formats", ["dwf", "dwfx", "xps"]);
    P(this, "nativeRenderer", !0);
    P(this, "defaults");
    P(this, "native");
    P(this, "host");
    P(this, "lastStats");
    this.defaults = e;
  }
  accepts(e, n) {
    const s = Oe(e);
    if (s === "dwf" || s === "dwfx" || s === "xps") return !0;
    const i = _e(e, n);
    return i === "dwf" || i === "dwfx" || i === "xps";
  }
  async load(e, n = {}) {
    var u, f, d, m, p;
    const s = { ...this.defaults, ...n }, i = performance.now(), o = (f = e.fileName) != null ? f : (u = e.file) == null ? void 0 : u.name, r = await ht(e), a = Mo(_e(e, r), Oe(e));
    (d = s.onProgress) == null || d.call(s, { phase: "parse", format: a, message: "Opening DWF/DWFx with dwf-viewer…", percent: 48 });
    const c = await ca(r, { fileName: o });
    (m = s.onProgress) == null || m.call(s, { phase: "normalize", format: a, message: "Reading DWF pages, sheets and model metadata…", percent: 76 });
    const l = No(c, o, a, s.keepRaw === !0), h = performance.now() - i;
    return (p = s.onProgress) == null || p.call(s, { phase: "done", format: l.format, message: "DWF/DWFx document ready.", percent: 100, elapsedMs: h }), { document: l, raw: s.keepRaw ? c : void 0, bytes: r.byteLength, elapsedMs: h, format: l.format, warnings: l.warnings };
  }
  async mount(e, n, s = {}) {
    var b, g, y, x, v, w;
    const i = { ...this.defaults, ...s }, o = performance.now(), r = (g = e.fileName) != null ? g : (b = e.file) == null ? void 0 : b.name, a = await ht(e), c = Mo(_e(e, a), Oe(e)), l = Oc(i), h = Po(i), u = _c(i, l, h), f = Tr(i, l, h);
    (y = i.onProgress) == null || y.call(i, { phase: "native-render", format: c, message: "Mounting native DWF renderer…", percent: 28 }), this.unmount(), this.host = n, n.replaceChildren(), this.native = new la(n, u), (x = i.onProgress) == null || x.call(i, { phase: "parse", format: c, message: "Parsing DWF package and page streams…", percent: 58 }), await this.native.load(a, {
      fileName: r,
      ...f
    }), (v = i.onProgress) == null || v.call(i, { phase: "render", format: c, message: "Rendering DWF/DWFx with dwf-viewer…", percent: 88 }), this.lastStats = await this.native.render();
    const d = this.native.getDocument(), m = No(d, r, c, i.keepRaw === !0);
    m.metadata.loaderMode = "Native DWF", m.metadata.nativeRenderer = "dwf-viewer", m.metadata.nativeRenderStats = this.lastStats ? { ...this.lastStats, warnings: this.lastStats.warnings.length } : void 0;
    const p = performance.now() - o;
    return (w = i.onProgress) == null || w.call(i, { phase: "done", format: m.format, message: "DWF/DWFx rendered.", percent: 100, elapsedMs: p }), { document: m, raw: i.keepRaw ? d : void 0, bytes: a.byteLength, elapsedMs: p, format: m.format, warnings: m.warnings };
  }
  unmount() {
    var e;
    (e = this.native) == null || e.dispose(), this.native = void 0, this.lastStats = void 0, this.host && this.host.replaceChildren();
  }
  fit() {
    var e;
    (e = this.native) == null || e.fit();
  }
  zoomIn() {
    var n;
    const e = (n = this.native) == null ? void 0 : n.zoomInButton;
    e == null || e.click();
  }
  zoomOut() {
    var n;
    const e = (n = this.native) == null ? void 0 : n.zoomOutButton;
    e == null || e.click();
  }
  resize() {
    var e;
    (e = this.native) == null || e.render();
  }
  setNativeOptions(e) {
    var s, i, o, r, a, c;
    const n = this.native;
    if (n) {
      if (typeof e.dwfBackground == "string") n.background = e.dwfBackground;
      else {
        const l = Po(e);
        l && (n.background = l);
      }
      typeof e.dwfPreferWebgl == "boolean" && ((s = n.setPreferWebgl) == null || s.call(n, e.dwfPreferWebgl)), typeof e.dwfPreferWasm == "boolean" && ((i = n.setPreferWasm) == null || i.call(n, e.dwfPreferWasm)), e.dwfLineWeightMode && ((o = n.setLineWeightMode) == null || o.call(n, e.dwfLineWeightMode)), (r = n.setMonochromeColor) == null || r.call(n, Tn(e)), (a = n.setContrastOptions) == null || a.call(n, Pr(e)), Pt(n, "minStrokeCssPx", e.dwfMinStrokeCssPx), Pt(n, "maxOverviewStrokeCssPx", e.dwfMaxOverviewStrokeCssPx), Pt(n, "minTextCssPx", e.dwfMinTextCssPx), Pt(n, "minFilledAreaCssPx", e.dwfMinFilledAreaCssPx), (c = n.render) == null || c.call(n);
    }
  }
  getLastNativeStats() {
    return this.lastStats;
  }
  async captureCanvas() {
    const e = this.native;
    if (!e) throw new Error("No DWF document is loaded.");
    if (await e.render(), await e.render(), this.native !== e) throw new Error("DWF document changed during capture.");
    const n = [e.webglCanvas, e.canvas].filter((s) => {
      var o;
      const i = (o = s.ownerDocument.defaultView) == null ? void 0 : o.getComputedStyle(s);
      return (i == null ? void 0 : i.display) !== "none" && (i == null ? void 0 : i.visibility) !== "hidden";
    });
    return Pn(n);
  }
}
function No(t, e, n, s) {
  var a, c, l, h, u, f, d, m, p;
  const i = ko((a = t == null ? void 0 : t.diagnostics) != null ? a : []), o = ((c = t == null ? void 0 : t.pageData) != null ? c : []).map((b, g) => Dc(b, g));
  for (const b of (l = t == null ? void 0 : t.pageData) != null ? l : []) i.push(...ko(b.diagnostics));
  const r = {
    parser: "dwf-viewer",
    nativeRenderer: "dwf-viewer",
    dwfKind: t == null ? void 0 : t.kind,
    packageEntries: (u = (h = t == null ? void 0 : t.packageEntries) == null ? void 0 : h.length) != null ? u : 0,
    resources: (d = (f = t == null ? void 0 : t.resources) == null ? void 0 : f.length) != null ? d : 0,
    pageKinds: Hc(((m = t == null ? void 0 : t.pageData) != null ? m : []).map((b) => b.kind)),
    pageNames: ((p = t == null ? void 0 : t.pages) != null ? p : []).map((b) => b.name)
  };
  return Sn({
    format: n,
    sourceName: e,
    layers: {},
    blocks: {},
    pages: o,
    entities: Ta(o),
    metadata: r,
    warnings: Wc(i),
    raw: s ? t : void 0
  });
}
function Dc(t, e) {
  const n = Fc(t, e);
  return {
    index: e,
    name: t.name || t.sourcePath || `${e + 1}`,
    width: t.width || 1e3,
    height: t.height || 1e3,
    entities: n
  };
}
function Fc(t, e) {
  return t.kind === "w2d-text" ? t.primitives.flatMap((n, s) => Rc(n, e, s)) : t.kind === "image" ? [{ type: "DWF_IMAGE_PAGE", kind: "image", pageIndex: e, width: t.width, height: t.height, imageSource: t.sourcePath }] : t.kind === "w3d-model" ? t.model.meshes.map((n, s) => ({
    id: n.id,
    type: "W3D_MESH",
    kind: "solid",
    pageIndex: e,
    color: n.color ? Xc(n.color) : void 0,
    name: n.name || `mesh-${s + 1}`,
    raw: { vertexCount: n.vertexCount, triangleCount: n.triangleCount, materialId: n.materialId }
  })) : t.kind === "xps-fixed-page" ? [{ type: "XPS_FIXED_PAGE", kind: "viewport", pageIndex: e, width: t.width, height: t.height, raw: { sourcePath: t.sourcePath } }] : [{ type: "DWF_PAGE", kind: "viewport", pageIndex: e, width: t.width, height: t.height, raw: { sourcePath: t.sourcePath } }];
}
function Rc(t, e, n) {
  const s = {
    id: `dwf-${e}-${n}`,
    pageIndex: e,
    color: t.stroke,
    fillColor: t.fill,
    lineweight: t.lineWidth,
    raw: { matrix: t.matrix }
  };
  if (t.type === "polyline" || t.type === "polygon")
    return [{
      ...s,
      type: t.type === "polygon" ? "DWF_POLYGON" : "DWF_POLYLINE",
      kind: "polyline",
      vertices: Bc(t.points),
      isClosed: t.type === "polygon"
    }];
  if (t.type === "path")
    return [{ ...s, type: "DWF_PATH", kind: "path", commands: t.commands }];
  if (t.type === "text")
    return [{
      ...s,
      type: "DWF_TEXT",
      kind: "text",
      insertionPoint: { x: t.x, y: t.y, z: 0 },
      text: t.text,
      textHeight: t.size
    }];
  if (t.type === "rect") {
    const i = t.x, o = t.y, r = t.width, a = t.height;
    return [{
      ...s,
      type: "DWF_RECT",
      kind: "polyline",
      isClosed: !0,
      vertices: [
        { x: i, y: o, z: 0 },
        { x: i + r, y: o, z: 0 },
        { x: i + r, y: o + a, z: 0 },
        { x: i, y: o + a, z: 0 }
      ]
    }];
  }
  return [];
}
function Bc(t) {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) e.push({ x: t[n], y: t[n + 1], z: 0 });
  return e;
}
function ko(t) {
  return t.filter((e) => e.level !== "info").map((e) => `${e.code}: ${e.message}${e.source ? ` (${e.source})` : ""}`);
}
function Mo(t, e) {
  return e === "dwf" || e === "dwfx" || e === "xps" ? e : t === "dwf" || t === "dwfx" || t === "xps" ? t : "dwf";
}
function Oc(t) {
  if (t.dwfWasmUrl) return t.dwfWasmUrl;
  if (typeof document == "undefined") return;
  const e = t.wasmPath ? new URL($c(t.wasmPath), document.baseURI).href : new URL("wasm/", document.baseURI).href;
  return new URL("dwfv-render.wasm", e).href;
}
function Po(t) {
  var n;
  if (t.dwfBackground) return t.dwfBackground;
  const e = t.canvasOptions;
  return (n = e == null ? void 0 : e.background) != null ? n : "#05070d";
}
function Tn(t) {
  var s, i, o;
  const e = t;
  return e.colorMode !== "monochrome" ? void 0 : ((s = e.monochromeColor) == null ? void 0 : s.trim()) || ((o = (i = e.canvasOptions) == null ? void 0 : i.foreground) == null ? void 0 : o.trim()) || "#ffffff";
}
function Pr(t) {
  var n, s;
  const e = t.canvasOptions;
  return { contrastMode: (n = e == null ? void 0 : e.contrastMode) != null ? n : "adaptive", minColorContrast: (s = e == null ? void 0 : e.minColorContrast) != null ? s : 2.4 };
}
function _c(t, e, n) {
  var i, o;
  const s = Tn(t);
  return {
    ...Tr(t, e, n),
    maxDevicePixelRatio: (i = t.dwfMaxDevicePixelRatio) != null ? i : 2,
    maxCanvasPixels: (o = t.dwfMaxCanvasPixels) != null ? o : 16777216,
    ...s ? { monochromeColor: s } : {}
  };
}
function Tr(t, e, n) {
  var i, o, r, a, c;
  const s = Tn(t);
  return {
    wasmUrl: e,
    preferWebgl: (i = t.dwfPreferWebgl) != null ? i : !0,
    preferWasm: (o = t.dwfPreferWasm) != null ? o : !0,
    background: n,
    ...Pr(t),
    maxGpuCacheBytes: (r = t.dwfMaxGpuCacheBytes) != null ? r : 160 * 1024 * 1024,
    maxCachedScenes: (a = t.dwfMaxCachedScenes) != null ? a : 2,
    lineWeightMode: (c = t.dwfLineWeightMode) != null ? c : "adaptive",
    minStrokeCssPx: t.dwfMinStrokeCssPx,
    maxOverviewStrokeCssPx: t.dwfMaxOverviewStrokeCssPx,
    minTextCssPx: t.dwfMinTextCssPx,
    minFilledAreaCssPx: t.dwfMinFilledAreaCssPx,
    ...s ? { monochromeColor: s } : {}
  };
}
function Pt(t, e, n) {
  typeof n == "number" && Number.isFinite(n) && (t[e] = n);
}
function $c(t) {
  return t.endsWith("/") ? t : `${t}/`;
}
function Xc(t) {
  const [e, n, s] = t.map((i) => Math.max(0, Math.min(255, Math.round(i * 255))));
  return `#${en(e)}${en(n)}${en(s)}`;
}
function en(t) {
  return t.toString(16).padStart(2, "0");
}
function Hc(t) {
  var n;
  const e = {};
  for (const s of t) e[s] = ((n = e[s]) != null ? n : 0) + 1;
  return e;
}
function Wc(t) {
  return Array.from(new Set(t));
}
function Yc(t = {}) {
  return new ua([
    new ya(t),
    new uc(t),
    new Ic(t)
  ]);
}
const Ar = [
  "block-attributes",
  "native-table",
  "data-table",
  "xdata",
  "xrecord",
  "text-table"
], Uc = Ar.filter((t) => t !== "xdata" && t !== "xrecord"), zc = 1e6;
function Vc(t, e = {}) {
  var a;
  const n = jc(e), s = {
    document: t,
    options: n,
    tables: [],
    warnings: [],
    visitedEntities: 0,
    seenEntities: /* @__PURE__ */ new WeakSet(),
    emittedRows: 0,
    stopped: !1
  };
  if (n.sources.has("block-attributes") && Fe(s, qc(s)), n.sources.has("native-table"))
    for (const c of Kc(s)) Fe(s, c);
  if (n.sources.has("data-table"))
    for (const c of Jc(s)) Fe(s, c);
  if (n.sources.has("xdata"))
    for (const c of el(s)) Fe(s, c);
  if (n.sources.has("xrecord"))
    for (const c of tl(s)) Fe(s, c);
  if (n.sources.has("text-table") && n.textTables !== !1)
    for (const c of nl(s)) Fe(s, c);
  !["dwg", "dxf"].includes(t.format) && s.tables.length === 0 && s.warnings.push({
    code: "unsupported-format",
    message: `${t.format.toUpperCase()} does not expose a normalized component/property model for BOM extraction.`
  });
  const i = {};
  for (const c of s.tables) i[c.source] = ((a = i[c.source]) != null ? a : 0) + 1;
  const o = s.tables.filter((c) => c.source === "block-attributes"), r = dn([
    ...s.warnings,
    ...s.tables.flatMap((c) => c.warnings)
  ]);
  return {
    schemaVersion: 1,
    sourceName: t.sourceName,
    format: t.format,
    tables: s.tables,
    summary: {
      tableCount: s.tables.length,
      rowCount: s.tables.reduce((c, l) => c + l.rows.length, 0),
      sourceCounts: i,
      blockItemCount: o.reduce((c, l) => c + l.rows.length, 0),
      blockQuantity: o.reduce(
        (c, l) => l.rows.reduce((h, u) => {
          var f;
          return Ir(h, (f = u.quantity) != null ? f : 1);
        }, c),
        0
      )
    },
    warnings: r
  };
}
function fu(t, e = {}) {
  const n = e.includeSensitiveData === !0 ? void 0 : (s, i) => s === "connectionString" ? void 0 : i;
  return JSON.stringify(t, n, e.pretty === !1 ? void 0 : 2);
}
function du(t, e = {}) {
  var c, l;
  const n = e.tableId ? t.tables.find((h) => h.id === e.tableId) : [...t.tables].sort((h, u) => u.rows.length - h.rows.length)[0];
  if (!n) return e.includeUtf8Bom === !1 ? "" : "\uFEFF";
  const s = (c = e.delimiter) != null ? c : ",", i = (l = e.lineEnding) != null ? l : `\r
`, o = e.escapeFormulas !== !1, a = [
    n.columns.map((h) => h.label),
    ...n.rows.map((h) => n.columns.map((u) => {
      var f;
      return (f = h.cells[u.key]) != null ? f : "";
    }))
  ].map((h) => h.map((u) => Cl(u, s, o)).join(s)).join(i);
  return e.includeUtf8Bom === !1 ? a : `\uFEFF${a}`;
}
function jc(t) {
  var e, n, s;
  return {
    sources: new Set((n = (e = t.sources) == null ? void 0 : e.filter((i) => Ar.includes(i))) != null ? n : Uc),
    textTables: (s = t.textTables) != null ? s : "auto",
    recursiveBlocks: t.recursiveBlocks !== !1,
    aggregateBlocks: t.aggregateBlocks !== !1,
    includeInvisible: t.includeInvisible !== !1,
    includePaperSpace: t.includePaperSpace === !0,
    includeAnonymousBlocks: t.includeAnonymousBlocks === !0,
    maxDepth: Re(t.maxDepth, 16, 1, 128),
    maxEntities: Re(t.maxEntities, 25e4, 1, 2e6),
    maxRows: Re(t.maxRows, 1e5, 1, 1e6),
    maxCells: Re(t.maxCells, 1e6, 1, 5e6),
    minTextTableRows: Re(t.minTextTableRows, 3, 2, 100),
    minTextTableColumns: Re(t.minTextTableColumns, 2, 2, 100),
    textRowTolerance: Lo(t.textRowTolerance),
    textColumnTolerance: Lo(t.textColumnTolerance)
  };
}
function Fe(t, e) {
  if (!e || e.rows.length === 0) return;
  e.warnings = dn(e.warnings);
  const n = t.options.maxRows - t.emittedRows;
  if (n <= 0) {
    Gc(t, e.source);
    return;
  }
  if (e.rows.length > n) {
    e.rows = e.rows.slice(0, n);
    const s = {
      code: "max-rows",
      source: e.source,
      message: `BOM extraction stopped at the configured ${t.options.maxRows.toLocaleString()} row limit.`
    };
    e.warnings.push(s), t.warnings.push(s), t.stopped = !0;
  }
  e.warnings = dn(e.warnings), t.emittedRows += e.rows.length, t.tables.push(e);
}
function De(t, e = 0) {
  return Math.max(0, t.options.maxRows - t.emittedRows - e);
}
function Gc(t, e) {
  t.stopped || (t.stopped = !0, t.warnings.push({
    code: "max-rows",
    source: e,
    message: `BOM extraction stopped at the configured ${t.options.maxRows.toLocaleString()} row limit.`
  }));
}
function qc(t) {
  const e = [], n = /* @__PURE__ */ new Map(), s = An(t.document, t.options.includePaperSpace), i = (p, b, g, y) => {
    var A;
    if (t.stopped || !Xt(p, t.options) || !Ht(t, "block-attributes", p) || p.kind !== "insert" && !/^(INSERT|MINSERT)$/i.test(p.type)) return;
    const x = le((A = p.blockName) != null ? A : p.name) || "(unnamed block)", v = le(p.effectiveBlockName) || x;
    if (hl(x) || /^\*/.test(x) && !ul(x) && !t.options.includeAnonymousBlocks && v === x) return;
    const C = ll(t.document.blocks, x), S = rl(p, C, t.warnings), D = fl(p.insertRowCount, p.insertColumnCount), L = hn(b, D), I = Object.fromEntries(Object.keys(S).map((k) => [En(k), k])), M = {
      blockName: x,
      effectiveName: v,
      attributes: dl(S),
      attributeLabels: I,
      quantity: L,
      layers: new Set(p.layer ? [p.layer] : []),
      handles: new Set(p.handle ? [p.handle] : [])
    };
    if (t.options.aggregateBlocks) {
      const k = un([v.toLocaleUpperCase(), M.attributes]), E = n.get(k);
      if (E) {
        E.quantity = hn(E.quantity, L, !0);
        for (const B of M.layers) E.layers.add(B);
        for (const B of M.handles) E.handles.add(B);
      } else
        n.set(k, M);
    } else
      e.push(M);
    if (!t.options.recursiveBlocks || !C) {
      t.options.recursiveBlocks && !C && x !== "(unnamed block)" && t.warnings.push({ code: "missing-block", source: "block-attributes", blockName: x, handle: p.handle, message: `Block definition ${x} is missing; the reference is still included.` });
      return;
    }
    if (y >= t.options.maxDepth) {
      t.warnings.push({ code: "max-depth", source: "block-attributes", blockName: x, message: `Stopped recursive block traversal at depth ${t.options.maxDepth}.` });
      return;
    }
    const N = C.name.toLocaleUpperCase();
    if (g.includes(N)) {
      t.warnings.push({ code: "cyclic-block", source: "block-attributes", blockName: x, message: `Skipped cyclic block reference ${[...g, N].join(" → ")}.` });
      return;
    }
    for (const k of C.entities) i(k, L, [...g, N], y + 1);
  };
  for (const p of s) i(p, 1, [], 0);
  const o = t.options.aggregateBlocks ? [...n.values()] : e, r = De(t), a = o.slice(0, r);
  if (a.length === 0) return;
  const c = /* @__PURE__ */ new Map();
  for (const p of a)
    for (const [b, g] of Object.entries(p.attributeLabels)) c.has(b) || c.set(b, g);
  const l = [...c.entries()].sort(([p], [b]) => p.localeCompare(b)), h = /* @__PURE__ */ new Set(["item", "block", "quantity", "layers"]), u = l.map(([p, b]) => ({
    key: yt(Ue(b), h),
    label: b,
    dataType: "string",
    sourceKey: p
  })), f = [
    { key: "item", label: "Item", dataType: "string" },
    { key: "block", label: "Source block", dataType: "string" },
    { key: "quantity", label: "Quantity", dataType: "number" },
    { key: "layers", label: "Layers", dataType: "string" },
    ...u
  ], d = a.sort((p, b) => p.effectiveName.localeCompare(b.effectiveName, void 0, { numeric: !0 })).map((p, b) => {
    var y;
    const g = {
      item: p.effectiveName,
      block: p.blockName,
      quantity: p.quantity,
      layers: [...p.layers].sort().join(", ")
    };
    for (const x of u) g[x.key] = (y = p.attributes[x.sourceKey]) != null ? y : "";
    return {
      id: `block-${b + 1}`,
      cells: g,
      quantity: p.quantity,
      sourceHandles: [...p.handles],
      blockName: p.blockName,
      effectiveBlockName: p.effectiveName,
      layer: [...p.layers].sort().join(", ")
    };
  }), m = [];
  return a.length < o.length && m.push({
    code: "max-rows",
    source: "block-attributes",
    message: `Block BOM rows were capped at the configured ${t.options.maxRows.toLocaleString()} row limit.`
  }), { id: "block-attributes", name: "Block attributes", source: "block-attributes", confidence: 1, columns: f, rows: d, warnings: m };
}
function Kc(t) {
  var o, r;
  const e = [], n = Er(t.document, t.options.includePaperSpace);
  let s = 0, i = 0;
  for (const a of n) {
    if (t.stopped) break;
    const c = De(t, i);
    if (c <= 0) break;
    if (!Xt(a, t.options) || a.kind !== "table" && !/^(TABLE|ACAD_TABLE|ACDBTABLE)$/i.test(a.type)) continue;
    if (s += 1, !Ht(t, "native-table", a)) break;
    const l = a.table;
    if (!l || l.cells.length === 0) {
      const f = {
        code: "empty-native-table",
        source: "native-table",
        handle: a.handle,
        message: `Native table ${(o = a.handle) != null ? o : s} has no cached cells. Modern TABLECONTENT or its external DataLink may not be exposed by the DWG parser.`
      };
      t.warnings.push(f);
      continue;
    }
    const h = [];
    if (l.cells.length > t.options.maxCells) {
      const f = {
        code: "max-cells",
        source: "native-table",
        handle: a.handle,
        message: `Native table cells were capped at ${t.options.maxCells.toLocaleString()} values.`
      };
      h.push(f);
    }
    const u = Zc(
      a,
      s,
      (r = t.document.dataLinks) != null ? r : [],
      h,
      c,
      t.options.maxCells
    );
    u.rows.length > 0 && (i += u.rows.length, e.push(u));
  }
  return e;
}
function Zc(t, e, n, s, i, o) {
  var k, E, B, $;
  const r = t.table, a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = Math.max(1, Math.min(o, i + 2));
  let h = 0, u = 0;
  for (let F = 0; F < r.cells.length && F < o; F += 1) {
    const O = r.cells[F];
    if (!Eo(O.row) || !Eo(O.column)) {
      h += 1;
      continue;
    }
    if (!a.has(O.row) && a.size >= l) {
      u += 1;
      continue;
    }
    const X = (k = a.get(O.row)) != null ? k : /* @__PURE__ */ new Map();
    (!X.has(O.column) || !((E = X.get(O.column)) != null && E.text) && O.text) && X.set(O.column, O), a.set(O.row, X), ot(O) !== "" && c.add(O.column);
  }
  h > 0 && s.push({
    code: "invalid-table-cell",
    source: "native-table",
    handle: t.handle,
    message: `Ignored ${h.toLocaleString()} native table cell${h === 1 ? "" : "s"} with invalid or extreme coordinates.`
  }), u > 0 && s.push({
    code: "max-rows",
    source: "native-table",
    handle: t.handle,
    message: `Native table rows were capped at the configured ${i.toLocaleString()} row limit.`
  });
  const f = [...a.keys()].sort((F, O) => F - O);
  let d = le(r.name) || `Native table ${e}`, m = f[0];
  const p = m === void 0 ? void 0 : a.get(m);
  if (p) {
    const F = [...p.values()].filter((O) => ot(O) !== "");
    r.titleSuppressed !== !0 && F.length === 1 && f.length > 1 && (d = ot(F[0]) || d, m = f[1]);
  }
  const b = Math.max(0, f.indexOf(m)), g = f[b], y = g === void 0 ? void 0 : a.get(g), x = f.slice(b + 1), v = r.headerSuppressed !== !0 && !!y && (r.headerSuppressed === !1 || pl(y, x.map((F) => a.get(F)))), w = v ? x : f.slice(b), C = w.slice(0, Math.min(i, o)), S = [...c].sort((F, O) => F - O), D = Math.max(1, Math.floor(o / Math.max(1, C.length))), L = S.slice(0, D);
  w.length > C.length && s.push({
    code: "max-rows",
    source: "native-table",
    handle: t.handle,
    message: `Native table rows were capped at the configured ${i.toLocaleString()} row limit.`
  }), L.length < S.length && s.push({
    code: "max-cells",
    source: "native-table",
    handle: t.handle,
    message: `Native table output was capped at ${o.toLocaleString()} cells.`
  });
  const I = /* @__PURE__ */ new Set(), M = L.map((F, O) => {
    const H = (v ? ot(y == null ? void 0 : y.get(F)) : "") || `Column ${O + 1}`;
    return {
      key: yt(Ue(H), I),
      label: H,
      dataType: Ln(C.map((W) => {
        var Y;
        return fn((Y = a.get(W)) == null ? void 0 : Y.get(F));
      })),
      sourceKey: String(F)
    };
  }), N = [];
  for (const F of C) {
    if (N.length >= i) break;
    const O = a.get(F), X = {};
    let H = !1;
    for (const W of M) {
      const Y = O.get(Number(W.sourceKey)), j = fn(Y);
      X[W.key] = j, j !== "" && (H = !0);
    }
    H && N.push({ id: `native-${(B = t.handle) != null ? B : e}-${F}`, cells: X, sourceHandles: t.handle ? [t.handle] : void 0 });
  }
  const A = r.dataLinkHandle ? n.find((F) => wl(F.handle, r.dataLinkHandle)) : void 0;
  return r.dataLinkHandle && !A && s.push({
    code: "external-data-unavailable",
    source: "native-table",
    handle: t.handle,
    message: `Table references DataLink ${r.dataLinkHandle}, but no link metadata or external workbook was embedded. Cached cells are returned without network access.`
  }), {
    id: `native-table-${($ = t.handle) != null ? $ : e}`,
    name: d,
    source: "native-table",
    confidence: 1,
    columns: M,
    rows: N,
    handle: t.handle,
    dataLink: A,
    warnings: s
  };
}
function Jc(t) {
  var s, i;
  const e = [];
  let n = 0;
  for (let o = 0; o < ((i = (s = t.document.dataTables) == null ? void 0 : s.length) != null ? i : 0); o += 1) {
    const r = De(t, n);
    if (t.stopped || r <= 0) break;
    const a = Qc(
      t.document.dataTables[o],
      o,
      r,
      t.options.maxCells
    );
    a.rows.length > 0 && (n += a.rows.length, e.push(a));
  }
  return e;
}
function Qc(t, e, n, s) {
  var u, f, d;
  const i = t.columns.slice(0, s);
  let o = 0;
  for (const m of i) o = Math.max(o, m.values.length);
  const r = i.length > 0 ? Math.min(n, s, o) : 0, a = /* @__PURE__ */ new Set(), c = i.map((m, p) => ({
    key: yt(Ue(m.name || `Column ${p + 1}`), a),
    label: m.name || `Column ${p + 1}`,
    dataType: bl(m.values, r),
    sourceKey: String(p)
  })), l = [];
  for (let m = 0; m < r; m += 1) {
    const p = {};
    let b = !1;
    for (let g = 0; g < c.length; g += 1) {
      const y = xt((u = i[g]) == null ? void 0 : u.values[m]);
      p[c[g].key] = y, y !== "" && (b = !0);
    }
    b && l.push({ id: `data-${(f = t.handle) != null ? f : e}-${m}`, cells: p, sourceHandles: t.handle ? [t.handle] : void 0 });
  }
  const h = [];
  return (i.length < t.columns.length || s < Math.min(n, o)) && h.push({
    code: "max-cells",
    source: "data-table",
    handle: t.handle,
    message: `DataTable columns and values per column were capped at ${s.toLocaleString()} entries.`
  }), r < Math.min(s, o) && h.push({
    code: "max-rows",
    source: "data-table",
    handle: t.handle,
    message: "DataTable rows were capped at the configured BOM row limit."
  }), {
    id: `data-table-${(d = t.handle) != null ? d : e + 1}`,
    name: le(t.name) || `Data table ${e + 1}`,
    source: "data-table",
    confidence: 1,
    columns: c,
    rows: l,
    handle: t.handle,
    warnings: h
  };
}
function el(t) {
  var o, r, a;
  const e = /* @__PURE__ */ new Map();
  for (const c of Er(t.document, t.options.includePaperSpace)) {
    if (t.stopped || !Ht(t, "xdata", c)) break;
    if (Xt(c, t.options))
      for (let l = 0; l < ((r = (o = c.xdata) == null ? void 0 : o.length) != null ? r : 0); l += 1) {
        const h = c.xdata[l];
        if (h.entries.length === 0) continue;
        const u = le(h.appName) || "Unscoped XDATA", f = (a = e.get(u)) != null ? a : [];
        f.push({ entity: c, group: h, sequence: l }), e.set(u, f);
      }
  }
  const n = [], s = /* @__PURE__ */ new Set();
  let i = 0;
  for (const [c, l] of e) {
    const h = De(t, i);
    if (h <= 0) break;
    const u = l.slice(0, h), f = u.map(({ group: v }) => al(v)), d = [...new Set(f.flatMap((v) => Object.keys(v)))].sort((v, w) => v.localeCompare(w, void 0, { numeric: !0 })), m = /* @__PURE__ */ new Set(["entity", "type", "block", "layer"]), p = d.map((v) => ({
      key: yt(Ue(v), m),
      label: v,
      dataType: Ln(f.map((w) => {
        var C;
        return (C = w[v]) != null ? C : "";
      })),
      sourceKey: v
    })), b = [
      { key: "entity", label: "Entity", dataType: "string" },
      { key: "type", label: "Type", dataType: "string" },
      { key: "block", label: "Block", dataType: "string" },
      { key: "layer", label: "Layer", dataType: "string" },
      ...p
    ], g = ml(`xdata-${Ue(c)}`, s), y = u.map(({ entity: v, sequence: w }, C) => {
      var D, L, I, M, N;
      const S = {
        entity: (D = v.handle) != null ? D : String(C + 1),
        type: v.type,
        block: (I = (L = v.effectiveBlockName) != null ? L : v.blockName) != null ? I : "",
        layer: (M = v.layer) != null ? M : ""
      };
      for (const A of p) S[A.key] = (N = f[C][A.sourceKey]) != null ? N : "";
      return { id: `${g}-${C}-${w}`, cells: S, sourceHandles: v.handle ? [v.handle] : void 0 };
    }), x = [];
    u.length < l.length && x.push({ code: "max-rows", source: "xdata", message: "XDATA rows were capped at the configured BOM row limit." }), i += y.length, n.push({ id: g, name: c, source: "xdata", confidence: 1, columns: b, rows: y, warnings: x });
  }
  return n;
}
function tl(t) {
  var s, i, o, r, a, c, l;
  const e = [];
  let n = 0;
  for (let h = 0; h < ((i = (s = t.document.xrecords) == null ? void 0 : s.length) != null ? i : 0); h += 1) {
    const u = De(t, n);
    if (t.stopped || u <= 0) break;
    const f = t.document.xrecords[h];
    if (f.data.length === 0) continue;
    const d = Math.min(f.data.length, t.options.maxCells, u), m = [];
    t.options.maxCells < Math.min(f.data.length, u) && m.push({ code: "max-cells", source: "xrecord", handle: f.handle, message: `XRecord groups were capped at ${t.options.maxCells.toLocaleString()} values.` }), u < Math.min(f.data.length, t.options.maxCells) && m.push({ code: "max-rows", source: "xrecord", handle: f.handle, message: "XRecord rows were capped at the configured BOM row limit." });
    const p = [];
    for (let g = 0; g < d; g += 1) {
      const y = f.data[g];
      p.push({
        id: `xrecord-${(o = f.handle) != null ? o : h}-${g}`,
        cells: {
          index: g + 1,
          code: (r = y.code) != null ? r : "",
          value: xt(y.value)
        },
        sourceHandles: f.handle ? [f.handle] : void 0
      });
    }
    const b = (a = f.dictionaryPath) == null ? void 0 : a.join(" / ");
    e.push({
      id: `xrecord-${(c = f.handle) != null ? c : h + 1}`,
      name: b || f.entryName || `XRecord ${(l = f.handle) != null ? l : h + 1}`,
      source: "xrecord",
      confidence: 1,
      columns: [
        { key: "index", label: "#", dataType: "number" },
        { key: "code", label: "Group code", dataType: "mixed" },
        { key: "value", label: "Value", dataType: "mixed" }
      ],
      rows: p,
      handle: f.handle,
      warnings: m
    }), n += p.length;
  }
  return e;
}
function To(t, e, n = Number.POSITIVE_INFINITY) {
  let s = 0, i = t.length;
  for (; s < i; ) {
    const r = s + i >>> 1;
    t[r].x < e ? s = r + 1 : i = r;
  }
  let o;
  for (const r of [s - 1, s]) {
    if (r < 0 || r >= t.length) continue;
    const a = Math.abs(t[r].x - e);
    a <= n && (!o || a < o.distance) && (o = { column: r, distance: a });
  }
  return o;
}
function nl(t) {
  var r, a, c, l, h, u, f;
  const e = /* @__PURE__ */ new Map();
  let n = 0;
  for (const d of An(t.document, t.options.includePaperSpace)) {
    if (t.stopped || !Ht(t, "text-table", d)) break;
    if (!Xt(d, t.options) || !/^(TEXT|MTEXT)$/i.test(d.type)) continue;
    const m = (r = d.insertionPoint) != null ? r : d.startPoint, p = yl(d.text);
    if (!m || !p || !xl(d.rotation)) continue;
    if (n >= t.options.maxCells) {
      t.warnings.push({
        code: "max-cells",
        source: "text-table",
        message: `Text-table candidates were capped at ${t.options.maxCells.toLocaleString()} entities.`
      });
      break;
    }
    const b = (a = d.layer) != null ? a : "0", g = (c = e.get(b)) != null ? c : [];
    g.push({ entity: d, text: p, x: m.x, y: m.y, height: Math.max(1e-9, Math.abs((h = (l = d.textHeight) != null ? l : d.height) != null ? h : 1)) }), e.set(b, g), n += 1;
  }
  const s = [];
  let i = 0, o = 0;
  for (const [d, m] of e) {
    if (De(t, o) <= 0) break;
    if (m.length < t.options.minTextTableRows * t.options.minTextTableColumns) continue;
    const b = at(m.map((v) => v.height)) || 1, g = (u = t.options.textRowTolerance) != null ? u : b * 0.7, y = (f = t.options.textColumnTolerance) != null ? f : b * 2.2, x = sl(m, g);
    for (const v of il(x, g)) {
      const w = De(t, o);
      if (w <= 0) break;
      const C = ol(v, d, y, t.options, i + 1, w);
      C && (i += 1, o += C.rows.length, s.push(C));
    }
  }
  return s;
}
function sl(t, e) {
  const n = [];
  for (const s of [...t].sort((i, o) => o.y - i.y || i.x - o.x)) {
    let i = n[n.length - 1];
    (!i || Math.abs(i.y - s.y) > e) && (i = { y: s.y, cells: [] }, n.push(i));
    const o = i.cells.length;
    i.cells.push(s), i.y = (i.y * o + s.y) / (o + 1);
  }
  return n.map((s) => ({ ...s, cells: s.cells.sort((i, o) => i.x - o.x) }));
}
function il(t, e) {
  if (t.length < 2) return t.length ? [t] : [];
  const n = t.slice(1).map((r, a) => Math.abs(t[a].y - r.y)).filter((r) => r > e), s = at(n) || e * 2, i = Math.max(e * 5, s * 2.6), o = [[]];
  for (let r = 0; r < t.length; r += 1)
    r > 0 && Math.abs(t[r - 1].y - t[r].y) > i && o.push([]), o[o.length - 1].push(t[r]);
  return o;
}
function ol(t, e, n, s, i, o) {
  if (t.length < s.minTextTableRows || o <= 0) return;
  const r = t.slice(0, Math.max(s.minTextTableRows, o + 1)), a = [], c = r.flatMap((N) => N.cells).sort((N, A) => N.x - A.x);
  for (const N of c) {
    const A = a[a.length - 1];
    A && Math.abs(A.x - N.x) <= n ? (A.x = (A.x * A.count + N.x) / (A.count + 1), A.count += 1) : a.push({ x: N.x, count: 1 });
  }
  const l = a.filter((N) => N.count >= Math.max(2, Math.ceil(r.length * 0.45)));
  if (l.length < s.minTextTableColumns) return;
  const h = r.map((N) => {
    var k;
    const A = /* @__PURE__ */ new Map();
    for (const E of N.cells) {
      const B = To(l, E.x, n * 1.5);
      if (!B) continue;
      const $ = (k = A.get(B.column)) != null ? k : [];
      $.push(E), A.set(B.column, $);
    }
    return A;
  }), f = h.reduce((N, A) => N + A.size, 0) / Math.max(1, r.length * l.length), d = r.flatMap((N) => N.cells.map((A) => {
    var k, E;
    return (E = (k = To(l, A.x)) == null ? void 0 : k.distance) != null ? E : n;
  })), m = 1 - Math.min(1, (at(d) || 0) / Math.max(n, 1e-9)), p = l.map((N, A) => Tt(h[0].get(A))), b = h.slice(1).flatMap((N) => l.map((A, k) => Tt(N.get(k)))), g = gl(p, b), y = at(h.map((N) => N.size)) || l.length, x = 1 - Math.min(1, at(h.map((N) => Math.abs(N.size - y))) / Math.max(1, l.length)), v = vl(f * 0.42 + m * 0.28 + x * 0.15 + g * 0.15), w = s.textTables === !0 ? 0.48 : 0.82;
  if (v < w) return;
  const C = g >= 0.56 && r.length > s.minTextTableRows, S = /* @__PURE__ */ new Set(), D = l.map((N, A) => {
    const k = C ? p[A] || `Column ${A + 1}` : `Column ${A + 1}`, E = h.slice(C ? 1 : 0).map((B) => _t(Tt(B.get(A))));
    return { key: yt(Ue(k), S), label: k, dataType: Ln(E), sourceKey: String(A) };
  }), L = h.slice(C ? 1 : 0), I = [];
  for (let N = 0; N < L.length && !(I.length >= o); N += 1) {
    const A = L[N], k = {}, E = /* @__PURE__ */ new Set();
    let B = !1;
    for (const $ of D) {
      const F = A.get(Number($.sourceKey)), O = _t(Tt(F));
      k[$.key] = O, O !== "" && (B = !0);
      for (const X of F != null ? F : []) X.entity.handle && E.add(X.entity.handle);
    }
    B && I.push({ id: `text-${i}-${N}`, cells: k, sourceHandles: [...E] });
  }
  const M = [];
  return v < 0.82 && M.push({ code: "low-confidence-text-table", source: "text-table", message: `Text table reconstruction confidence is ${Math.round(v * 100)}%; verify column alignment before using it as a manufacturing BOM.` }), (I.length < L.length || r.length < t.length) && M.push({ code: "max-rows", source: "text-table", message: "Text table rows were capped at the configured BOM row limit." }), {
    id: `text-table-${i}`,
    name: e === "0" ? `Text table ${i}` : `${e} text table`,
    source: "text-table",
    confidence: v,
    columns: D,
    rows: I,
    warnings: M
  };
}
function rl(t, e, n) {
  var r, a;
  const s = /* @__PURE__ */ new Map(), i = (c, l) => {
    var m, p, b, g;
    const h = le(c.attributeTag);
    if (!h) return;
    const u = En(h), f = le((m = c.text) != null ? m : c.value), d = s.get(u);
    d != null && d.instance && l && d.handle && d.handle !== c.handle && n.push({
      code: "duplicate-attribute",
      source: "block-attributes",
      blockName: t.blockName,
      handle: t.handle,
      message: `Duplicate attribute tag ${h} on block ${(b = (p = t.blockName) != null ? p : t.name) != null ? b : "(unnamed)"}. The last instance value is used.`
    }), (!d || l || f) && s.set(u, { label: (g = d == null ? void 0 : d.label) != null ? g : h, value: f, handle: c.handle, instance: l });
  };
  for (const c of (r = e == null ? void 0 : e.entities) != null ? r : []) /^ATTDEF$/i.test(c.type) && i(c, !1);
  const o = /* @__PURE__ */ new Set();
  for (const c of (a = t.attribs) != null ? a : [])
    c.handle && o.has(c.handle) || (c.handle && o.add(c.handle), i(c, !0));
  return Object.fromEntries([...s.values()].map(({ label: c, value: l }) => [c, l]));
}
function al(t) {
  const e = {}, n = (s, i) => {
    if (s === null || typeof s == "string" || typeof s == "number" || typeof s == "boolean") {
      cl(e, i, s);
      return;
    }
    if (Array.isArray(s)) {
      s.forEach((o, r) => n(o, `${i}.${r + 1}`));
      return;
    }
    for (const [o, r] of Object.entries(s)) n(r, `${i}.${o}`);
  };
  return t.entries.forEach((s, i) => {
    const o = le(s.name) || (s.code !== void 0 ? String(s.code) : `Value ${i + 1}`);
    n(s.value, o);
  }), e;
}
function cl(t, e, n) {
  let s = e, i = 2;
  for (; s in t; ) s = `${e} ${i++}`;
  t[s] = n;
}
function An(t, e) {
  var s;
  const n = [...t.entities];
  if (e) for (const i of (s = t.pages) != null ? s : []) n.push(...i.entities);
  return Lr(n);
}
function Er(t, e) {
  const n = An(t, e), s = /* @__PURE__ */ new Set();
  for (const i of Object.values(t.blocks))
    s.has(i) || (s.add(i), n.push(...i.entities));
  return Lr(n);
}
function Lr(t) {
  const e = [], n = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  for (const i of t) {
    if (s.has(i)) continue;
    s.add(i);
    const o = le(i.handle);
    o && n.has(o.toLocaleUpperCase()) || (o && n.add(o.toLocaleUpperCase()), e.push(i));
  }
  return e;
}
function Xt(t, e) {
  return !(!e.includeInvisible && t.isVisible === !1 || !e.includePaperSpace && t.isInPaperSpace === !0);
}
function Ht(t, e, n) {
  return t.seenEntities.has(n) || (t.seenEntities.add(n), t.visitedEntities += 1, t.visitedEntities <= t.options.maxEntities) ? !0 : (t.warnings.some((s) => s.code === "max-entities") || t.warnings.push({ code: "max-entities", source: e, message: `BOM traversal stopped at ${t.options.maxEntities.toLocaleString()} unique entities.` }), t.stopped = !0, !1);
}
function ll(t, e) {
  var n, s;
  return (s = (n = t[e]) != null ? n : t[e.toLocaleLowerCase()]) != null ? s : Object.values(t).find((i) => i.name.localeCompare(e, void 0, { sensitivity: "accent" }) === 0);
}
function hl(t) {
  return /^\*?(MODEL|PAPER)_SPACE(?:\d+)?$/i.test(t) || /^\$(MODEL|PAPER)_SPACE/i.test(t);
}
function ul(t) {
  return /^\*U/i.test(t);
}
function fl(t, e) {
  return hn(Ot(t), Ot(e));
}
function hn(t, e, n = !1) {
  const s = Ot(t), i = Ot(e);
  return n ? Ir(s, i) : s > Number.MAX_SAFE_INTEGER / i ? Number.MAX_SAFE_INTEGER : s * i;
}
function Ir(t, e) {
  const n = Ao(t), s = Ao(e);
  return n > Number.MAX_SAFE_INTEGER - s ? Number.MAX_SAFE_INTEGER : n + s;
}
function Ot(t) {
  return Number.isFinite(t) ? Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(t))) : t === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : 1;
}
function Ao(t) {
  return Number.isFinite(t) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(t))) : t === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : 0;
}
function En(t) {
  return t.trim().toLocaleUpperCase();
}
function dl(t) {
  return Object.fromEntries(Object.entries(t).map(([e, n]) => [En(e), n.trim()]).sort(([e], [n]) => e.localeCompare(n)));
}
function un(t) {
  return t === null || typeof t != "object" ? JSON.stringify(t) : Array.isArray(t) ? `[${t.map(un).join(",")}]` : `{${Object.entries(t).sort(([e], [n]) => e.localeCompare(n)).map(([e, n]) => `${JSON.stringify(e)}:${un(n)}`).join(",")}}`;
}
function Ue(t) {
  return t.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "column";
}
function yt(t, e) {
  let n = t, s = 2;
  for (; e.has(n); ) n = `${t}_${s++}`;
  return e.add(n), n;
}
function ml(t, e) {
  let n = t, s = 2;
  for (; e.has(n); ) n = `${t}-${s++}`;
  return e.add(n), n;
}
function Eo(t) {
  return Number.isSafeInteger(t) && t >= 0 && t <= zc;
}
function ot(t) {
  return t ? le(t.text) || le(xt(t.value)) : "";
}
function fn(t) {
  if (!t) return "";
  const e = xt(t.value);
  return e === "" ? _t(t.text) : e;
}
function pl(t, e) {
  const n = [...t.values()].map(ot).filter(Boolean);
  if (n.length < 2 || new Set(n.map((r) => r.toLocaleUpperCase())).size !== n.length) return !1;
  const s = n.filter((r) => typeof _t(r) == "string").length / n.length, i = e.slice(0, 12).flatMap((r) => [...r.values()].map(fn)).filter((r) => r !== ""), o = i.filter((r) => typeof r == "number" || typeof r == "boolean").length / Math.max(1, i.length);
  return s >= 0.8 && (o >= 0.15 || n.some(Dr));
}
function gl(t, e) {
  const n = t.filter((a) => a !== "");
  if (n.length < 2) return 0;
  const s = new Set(n.map((a) => String(a).toLocaleUpperCase())).size / n.length, i = n.filter((a) => typeof a == "string").length / n.length, o = n.filter((a) => Dr(String(a))).length / n.length, r = e.filter((a) => a !== "" && (typeof a == "number" || typeof a == "boolean")).length / Math.max(1, e.filter((a) => a !== "").length);
  return Math.min(1, s * 0.25 + i * 0.25 + o * 0.3 + r * 0.2);
}
function Dr(t) {
  return /^(item|part|part\s*no|number|no\.?|name|description|material|qty|quantity|count|unit|规格|型号|名称|材料|数量|序号|代号|图号)$/i.test(t.trim());
}
function Ln(t) {
  const e = new Set(t.filter((n) => n !== "" && n !== null).map((n) => typeof n));
  return e.size === 0 || e.size === 1 && e.has("string") ? "string" : e.size === 1 && e.has("number") ? "number" : e.size === 1 && e.has("boolean") ? "boolean" : "mixed";
}
function bl(t, e) {
  const n = /* @__PURE__ */ new Set(), s = Math.min(t.length, e);
  for (let i = 0; i < s; i += 1) {
    const o = xt(t[i]);
    if (o !== "" && o !== null && n.add(typeof o), n.size > 1) return "mixed";
  }
  return n.size === 0 || n.has("string") ? "string" : n.has("number") ? "number" : n.has("boolean") ? "boolean" : "mixed";
}
function xt(t) {
  if (t == null) return t != null ? t : "";
  if (typeof t == "string" || typeof t == "number" || typeof t == "boolean") return t;
  try {
    return JSON.stringify(t);
  } catch (e) {
    return String(t);
  }
}
function _t(t) {
  const e = le(t);
  if (!e) return "";
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(e)) {
    const n = Number(e);
    if (Number.isFinite(n)) return n;
  }
  return /^(true|false)$/i.test(e) ? e.toLocaleLowerCase() === "true" : e;
}
function yl(t) {
  return le(t).replace(/\\P/gi, " ").replace(/\{\\[^;{}]+;([^{}]*)\}/g, "$1").replace(/%%[dpc]/gi, " ").replace(/\s+/g, " ").trim();
}
function Tt(t) {
  return (t != null ? t : []).sort((e, n) => e.x - n.x).map((e) => e.text).join(" ").trim();
}
function xl(t) {
  if (!Number.isFinite(t)) return !0;
  const e = Math.abs(Number(t) % Math.PI);
  return Math.min(e, Math.abs(Math.PI - e)) <= 0.06;
}
function at(t) {
  const e = t.filter(Number.isFinite).sort((s, i) => s - i);
  if (e.length === 0) return 0;
  const n = Math.floor(e.length / 2);
  return e.length % 2 ? e[n] : (e[n - 1] + e[n]) / 2;
}
function vl(t) {
  return Math.round(Math.max(0, Math.min(1, t)) * 1e3) / 1e3;
}
function wl(t, e) {
  return !!t && !!e && t.trim().toLocaleUpperCase() === e.trim().toLocaleUpperCase();
}
function le(t) {
  return typeof t == "string" || typeof t == "number" ? String(t).trim() : "";
}
function Lo(t) {
  const e = Number(t);
  return Number.isFinite(e) && e > 0 ? e : void 0;
}
function Re(t, e, n, s) {
  const i = Number(t);
  return Number.isFinite(i) ? Math.max(n, Math.min(s, Math.trunc(i))) : e;
}
function dn(t) {
  var s, i, o;
  const e = [], n = /* @__PURE__ */ new Set();
  for (const r of t) {
    const a = [r.code, (s = r.source) != null ? s : "", (i = r.handle) != null ? i : "", (o = r.blockName) != null ? o : "", r.message].join("\0");
    n.has(a) || (n.add(a), e.push(r));
  }
  return e;
}
function Cl(t, e, n) {
  let s = t === null ? "" : String(t);
  return n && /^[\t\r\n ]*[=+\-@]/.test(s) && (s = `'${s}`), s.includes('"') && (s = s.replace(/"/g, '""')), s.includes(e) || /["\r\n]/.test(s) ? `"${s}"` : s;
}
const mn = "cadColorMode", It = "cadMonochromeColor";
function Sl(t, e = {}) {
  var r;
  const n = (r = e.mode) != null ? r : "source", s = In(t), i = Fr(e.monochromeColor);
  if (s.mode === n && s.monochromeColor === i)
    return t;
  const o = { ...t.metadata };
  return n === "monochrome" ? (o[mn] = n, i ? o[It] = i : delete o[It]) : (delete o[mn], delete o[It]), { ...t, metadata: o };
}
function In(t) {
  const e = t == null ? void 0 : t.metadata, n = (e == null ? void 0 : e[mn]) === "monochrome" ? "monochrome" : "source", s = Fr(e == null ? void 0 : e[It]);
  return s ? { mode: n, monochromeColor: s } : { mode: n };
}
function Fr(t) {
  return typeof t != "string" ? void 0 : t.trim() || void 0;
}
class oe {
  /**
   * Converts an unsigned byte to a signed byte as used in SHX format.
   * Values > 127 are converted to their signed equivalent (-128 to -1).
   * @param value - The unsigned byte value to convert
   * @returns The signed byte value
   */
  static byteToSByte(e) {
    return (e & 127) - (e & 128 ? 128 : 0);
  }
  /**
   * Creates a new ShxFileReader instance.
   * @param arraybuffer - The ArrayBuffer to read from
   */
  constructor(e) {
    this.position = 0, this.data = new DataView(e);
  }
  /**
   * Reads a specified number of bytes from the current position.
   * @param length - Number of bytes to read (optional)
   * @returns A Uint8Array containing the read bytes
   * @throws Error if reading beyond buffer bounds
   */
  readBytes(e = 1) {
    this.data.byteLength < this.position + e && this.throwOutOfRangeError(this.position + e);
    const n = new Uint8Array(this.data.buffer, this.position, e);
    return this.position += e, n;
  }
  /**
   * Skips a specified number of bytes from the current position.
   * @param length - Number of bytes to skip
   * @throws Error if skipping beyond buffer bounds
   */
  skip(e) {
    this.data.byteLength < this.position + e && this.throwOutOfRangeError(this.position + e), this.position += e;
  }
  /**
   * Reads an unsigned 8-bit integer.
   * @returns The read uint8 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint8() {
    this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
    const e = this.data.getUint8(this.position);
    return this.position += 1, e;
  }
  /**
   * Reads a signed 8-bit integer.
   * @returns The read int8 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt8() {
    this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
    const e = this.data.getInt8(this.position);
    return this.position += 1, e;
  }
  /**
   * Reads an unsigned 16-bit integer.
   * @param littleEndian If false, a big-endian value should be read.
   * @returns The read uint16 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint16(e = !0) {
    this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
    const n = this.data.getUint16(this.position, e);
    return this.position += 2, n;
  }
  /**
   * Reads a signed 16-bit integer.
   * @returns The read int16 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt16() {
    this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
    const e = this.data.getInt16(this.position, !0);
    return this.position += 2, e;
  }
  /**
   * Reads an unsigned 32-bit integer.
   * @returns The read uint32 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const e = this.data.getUint32(this.position, !0);
    return this.position += 4, e;
  }
  /**
   * Reads a signed 32-bit integer.
   * @returns The read int32 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const e = this.data.getInt32(this.position, !0);
    return this.position += 4, e;
  }
  /**
   * Reads a 32-bit floating point number.
   * @returns The read float32 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const e = this.data.getFloat32(this.position, !0);
    return this.position += 4, e;
  }
  /**
   * Reads a 64-bit floating point number.
   * @returns The read float64 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat64() {
    this.data.byteLength < this.position + 8 && this.throwOutOfRangeError(this.position + 8);
    const e = this.data.getFloat64(this.position, !0);
    return this.position += 8, e;
  }
  /**
   * Sets the current read position in the buffer.
   * @param position - The new position to set
   */
  setPosition(e) {
    this.data.byteLength < e && this.throwOutOfRangeError(e), this.position = e;
  }
  /**
   * Checks if the current position is at the end of the buffer.
   * @returns True if at the end of the buffer, false otherwise
   */
  isEnd() {
    return this.position === this.data.byteLength - 1;
  }
  /**
   * Gets the current position in the buffer.
   * @returns The current position
   */
  get currentPosition() {
    return this.position;
  }
  /**
   * Gets the total length of the buffer.
   * @returns The buffer length in bytes
   */
  get length() {
    return this.data.byteLength;
  }
  /**
   * Throws an error when attempting to read beyond buffer bounds.
   * @param position - The position that caused the error
   * @throws Error with details about the out of range access
   */
  throwOutOfRangeError(e) {
    throw new Error(
      `Position ${e} is out of range for the data length ${this.data.byteLength}!`
    );
  }
}
var V = /* @__PURE__ */ ((t) => (t.SHAPES = "shapes", t.BIGFONT = "bigfont", t.UNIFONT = "unifont", t))(V || {});
class Nl {
  parse(e) {
    const n = this.parseHeader(e).split(" "), s = n[1].toLocaleLowerCase();
    if (!Object.values(V).includes(s))
      throw new Error(`Invalid font type: ${s}`);
    return {
      fileHeader: n[0],
      fontType: s,
      fileVersion: n[2]
    };
  }
  parseHeader(e) {
    let n = "", s = 0;
    for (; e.currentPosition < e.length - 2 && s < 1024; ) {
      const i = e.readUint8();
      if (i === 13) {
        const o = e.currentPosition, r = e.readUint8(), a = e.readUint8();
        if (r === 10 && a === 26)
          break;
        e.setPosition(o), n += String.fromCharCode(i);
      } else
        n += String.fromCharCode(i);
      s++;
    }
    return n.trim();
  }
}
const ze = 10, kl = [13, 10, 0];
function Rr(t, e) {
  if (e === 0) {
    t.orientation = "horizontal";
    return;
  }
  if (e === 2) {
    t.orientation = "horizontal", t.dualOrientation = !0;
    return;
  }
  t.orientation = "vertical";
}
function Br(t) {
  const e = {};
  for (const [n, s] of Object.entries(t))
    e[s] = n;
  return e;
}
function Or(t) {
  const e = t.indexOf(0);
  return e < 0 ? { name: null, bytecode: t } : { name: e > 0 ? new TextDecoder("ascii").decode(t.subarray(0, e)) : null, bytecode: t.subarray(e + 1) };
}
class Ml {
  parse(e) {
    try {
      e.readBytes(4);
      const n = e.readInt16();
      if (n <= 0)
        throw new Error("Invalid shape count in font file");
      const s = [];
      for (let c = 0; c < n; c++) {
        const l = e.readUint16(), h = e.readUint16();
        h > 0 && s.push({ code: l, length: h });
      }
      const i = {};
      for (const c of s)
        try {
          const l = e.readBytes(c.length);
          l.length === c.length && (i[c.code] = l);
        } catch (l) {
          console.warn(`Failed to read shape data for code ${c.code}`);
        }
      const o = {}, r = {};
      for (const [c, l] of Object.entries(i)) {
        const h = Number(c);
        if (h === 0) {
          o[h] = l;
          continue;
        }
        const { name: u, bytecode: f } = Or(l);
        o[h] = f, u && (r[u] = h);
      }
      const a = {
        data: o,
        names: Object.keys(r).length > 0 ? r : void 0,
        codeToName: Object.keys(r).length > 0 ? Br(r) : void 0,
        info: "",
        baseUp: 8,
        baseDown: 2,
        height: ze,
        width: ze,
        orientation: "horizontal",
        isExtended: !1
      };
      if (0 in o) {
        const c = o[0];
        try {
          const l = new TextDecoder().decode(c);
          let h = c.findIndex((u) => kl.includes(u));
          h >= 0 && (a.info = l.substring(0, h), h + 3 < c.length && (a.baseUp = c[h + 1], a.baseDown = c[h + 2], a.height = a.baseDown + a.baseUp, a.width = a.height, Rr(a, c[h + 3])));
        } catch (l) {
          console.warn("Failed to parse font info block");
        }
      }
      return a;
    } catch (n) {
      const s = n instanceof Error ? n.message : String(n);
      throw new Error(`Failed to parse shape font: ${s}`);
    }
  }
}
class Pl {
  parse(e) {
    try {
      e.readInt16();
      const n = e.readInt16(), s = e.readInt16();
      if (n <= 0)
        throw new Error("Invalid character count in font file");
      e.skip(s * 4);
      const i = [];
      for (let a = 0; a < n; a++) {
        const c = e.readUint16(), l = e.readUint16(), h = e.readUint32();
        (c !== 0 || l !== 0 || h !== 0) && i.push({ code: c, length: l, offset: h });
      }
      const o = {};
      for (const a of i)
        try {
          e.setPosition(a.offset);
          const c = e.readBytes(a.length);
          c.length === a.length && (o[a.code] = c);
        } catch (c) {
          console.warn(`Failed to read bigfont data for code ${a.code}`);
        }
      const r = {
        data: o,
        info: "",
        baseUp: 8,
        baseDown: 2,
        height: ze,
        width: ze,
        orientation: "horizontal",
        isExtended: !1
      };
      if (0 in o) {
        const a = o[0];
        try {
          const c = this.utf8ArrayToStr(a);
          if (c.pos >= 0) {
            let l = c.text;
            for (; l.length > 0 && l.charCodeAt(l.length - 1) === 0; )
              l = l.slice(0, -1);
            r.info = l;
            const h = this.parseBigfontMetrics(a, c.pos + 1);
            h && Object.assign(r, h);
          }
        } catch (c) {
          console.warn("Failed to parse bigfont info block");
        }
      }
      return r;
    } catch (n) {
      const s = n instanceof Error ? n.message : String(n);
      throw new Error(`Failed to parse big font: ${s}`);
    }
  }
  parseBigfontMetrics(e, n) {
    let s = n;
    for (; s < e.length && e[s] === 0; )
      s++;
    const i = e.length - s;
    if (i <= 0)
      return null;
    const o = (r) => r === 0 ? "horizontal" : "vertical";
    if (i >= 5) {
      const r = e[s++];
      s++;
      const a = o(e[s++]), c = e[s++];
      return {
        baseUp: r,
        baseDown: 0,
        height: r,
        width: c,
        orientation: a,
        isExtended: !0
      };
    }
    if (i === 4 && e[s + 1] === 0 && e[s + 3] > 0 && e[s + 3] !== e[s]) {
      const r = e[s++];
      s++;
      const a = o(e[s++]), c = e[s];
      return {
        baseUp: r,
        baseDown: 0,
        height: r,
        width: c,
        orientation: a,
        isExtended: !0
      };
    }
    if (i === 4) {
      const r = e[s++], a = e[s++], c = o(e[s++]);
      return {
        baseUp: r,
        baseDown: a,
        height: r + a,
        width: r + a,
        orientation: c,
        isExtended: !1
      };
    }
    if (i === 3) {
      const r = e[s++], a = e[s++], c = o(a), l = a === 2;
      return {
        baseUp: r,
        baseDown: 0,
        height: r,
        width: r,
        orientation: c,
        // Dual-orientation vertical bigfonts (modes=2) use composite bytecode.
        isExtended: l,
        verticalDualMode: l
      };
    }
    return null;
  }
  utf8ArrayToStr(e) {
    let n = "", s = 0;
    for (; s < e.length; ) {
      const i = e[s];
      switch (i >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          n += String.fromCharCode(i);
          break;
        case 12:
        case 13: {
          const o = e[s++];
          n += String.fromCharCode((i & 31) << 6 | o & 63);
          break;
        }
        case 14: {
          const o = e[s++], r = e[s++];
          n += String.fromCharCode(
            (i & 15) << 12 | (o & 63) << 6 | (r & 63) << 0
          );
          break;
        }
      }
      if (n.charCodeAt(n.length - 1) === 0) break;
      s++;
    }
    return { text: n, pos: s };
  }
}
class Tl {
  parse(e) {
    try {
      const n = e.readInt32();
      if (n <= 0)
        throw new Error("Invalid character count in font file");
      const s = e.readInt16(), i = e.readBytes(s), o = {
        data: {},
        info: "",
        baseUp: 8,
        baseDown: 2,
        height: ze,
        width: ze,
        orientation: "horizontal",
        isExtended: !1
      };
      try {
        const c = new TextDecoder().decode(i);
        let l = c.indexOf("\0");
        l >= 0 && (o.info = c.substring(0, l), l + 3 < i.length && (o.baseUp = i[l + 1], o.baseDown = i[l + 2], o.height = o.baseUp + o.baseDown, o.width = o.height, Rr(o, i[l + 3])));
      } catch (c) {
        console.warn("Failed to parse unifont info block");
      }
      const r = {}, a = {};
      for (let c = 0; c < n - 1; c++)
        try {
          const l = e.readUint16(), h = e.readUint16();
          if (h > 0) {
            const u = e.readBytes(h);
            if (u.length === h) {
              const { name: f, bytecode: d } = Or(u);
              d.length > 0 && (r[l] = d, f && (a[f] = l));
            }
          }
        } catch (l) {
          console.warn("Failed to read unifont character data");
          break;
        }
      return o.data = r, o.names = Object.keys(a).length > 0 ? a : void 0, o.codeToName = Object.keys(a).length > 0 ? Br(a) : void 0, o;
    } catch (n) {
      const s = n instanceof Error ? n.message : String(n);
      throw new Error(`Failed to parse unifont: ${s}`);
    }
  }
}
class Al {
  static createParser(e) {
    switch (e) {
      case V.SHAPES:
        return new Ml();
      case V.BIGFONT:
        return new Pl();
      case V.UNIFONT:
        return new Tl();
      default:
        throw new Error(`Unsupported font type: ${e}`);
    }
  }
}
const Io = 0.2;
class El {
  /**
   * Whether the aligned glyph should store the resolved advance as explicit.
   * When false, {@link ShxShape.hasExplicitAdvance} is preserved from the source glyph.
   */
  markAlignedAdvanceExplicit(e) {
    return !1;
  }
}
class $t extends El {
  constructor(e = Io) {
    super(), this.cellWidthFactor = e;
  }
  /**
   * True when ink extends left of the glyph origin (UNIFONT center-cell encoding).
   */
  static isCenterOriginGlyph(e) {
    return e.bbox.minX < -1e-6;
  }
  /**
   * Resolves ink-based advance for a glyph at a scaled cell width.
   *
   * Left-origin glyphs (`minX >= 0`): `maxX + cellWidth * factor`.
   * Center-origin glyphs (`minX < 0`): advance to the right cell edge
   * (`max(maxX, cellWidth / 2)`) plus padding, so narrow centered punctuation
   * keeps trailing whitespace instead of colliding with the next glyph.
   */
  static computeAdvance(e, n, s = Io) {
    if (!e.polylines.some((r) => r.length >= 2))
      return n * s;
    const i = n * s, { maxX: o } = e.bbox;
    return $t.isCenterOriginGlyph(e) ? Math.max(o, n / 2) + i : o + i;
  }
  resolve(e, n) {
    var i;
    var s;
    return e.hasExplicitAdvance ? (i = (s = e.lastPoint) == null ? void 0 : s.x) != null ? i : 0 : $t.computeAdvance(e, n, this.cellWidthFactor);
  }
  markAlignedAdvanceExplicit(e) {
    return !0;
  }
}
const vt = new $t();
class G {
  /**
   * Creates a new Point instance.
   * @param x - The x-coordinate (defaults to 0)
   * @param y - The y-coordinate (defaults to 0)
   */
  constructor(e = 0, n = 0) {
    this.x = e, this.y = n;
  }
  /**
   * Sets the coordinates of the point.
   * @param x - The new x-coordinate
   * @param y - The new y-coordinate
   * @returns The point instance for method chaining
   */
  set(e, n) {
    return this.x = e, this.y = n, this;
  }
  /**
   * Calculates the length (magnitude) of the vector from origin to this point.
   * @returns The length of the vector
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  /**
   * Normalizes the point vector to have a length of 1.
   * @returns The point instance for method chaining
   */
  normalize() {
    const e = this.length();
    return e !== 0 && (this.x /= e, this.y /= e), this;
  }
  /**
   * Creates a new Point instance with the same coordinates.
   * @returns A new Point instance with the same x and y values
   */
  clone() {
    return new G(this.x, this.y);
  }
  /**
   * Adds another point's coordinates to this point.
   * @param point - The point to add
   * @returns The point instance for method chaining
   */
  add(e) {
    return this.x += e.x, this.y += e.y, this;
  }
  /**
   * Subtracts another point's coordinates from this point.
   * @param point - The point to subtract
   * @returns The point instance for method chaining
   */
  subtract(e) {
    return this.x -= e.x, this.y -= e.y, this;
  }
  /**
   * Multiplies both coordinates by a scalar value.
   * @param scalar - The scalar value to multiply by
   * @returns The point instance for method chaining
   */
  multiply(e) {
    return this.x *= e, this.y *= e, this;
  }
  /**
   * Divides both coordinates by a scalar value.
   * @param scalar - The scalar value to divide by
   * @returns The point instance for method chaining
   */
  divide(e) {
    return e !== 0 && (this.x /= e, this.y /= e), this;
  }
  /**
   * Multiplies x and y coordinates by different scalar values.
   * @param xScalar - The scalar value to multiply x-coordinate by
   * @param yScalar - The scalar value to multiply y-coordinate by
   * @returns The point instance for method chaining
   */
  multiplyScalars(e, n) {
    return this.x *= e, this.y *= n, this;
  }
  /**
   * Divides x and y coordinates by different scalar values.
   * @param xScalar - The scalar value to divide x-coordinate by
   * @param yScalar - The scalar value to divide y-coordinate by
   * @returns The point instance for method chaining
   */
  divideScalars(e, n) {
    return e !== 0 && (this.x /= e), n !== 0 && (this.y /= n), this;
  }
  /**
   * Calculates the Euclidean distance to another point.
   * @param point - The point to calculate distance to
   * @returns The distance between the two points
   */
  distanceTo(e) {
    const n = this.x - e.x, s = this.y - e.y;
    return Math.sqrt(n * n + s * s);
  }
}
function _r(t) {
  const { width: e, capHeight: n, descenderHeight: s, origin: i = "baseline" } = t, o = n + s;
  return i === "top" ? { minX: -e / 2, maxX: e / 2, minY: -o, maxY: 0 } : { minX: 0, maxX: e, minY: -s, maxY: n };
}
function Ll(t) {
  return [t.minX, t.minY, t.maxX, t.maxY].every(Number.isFinite);
}
function Il(t, e, n = 1e-6) {
  return e.minX >= t.minX - n && e.maxX <= t.maxX + n && e.minY >= t.minY - n && e.maxY <= t.maxY + n;
}
function Dl(t, e) {
  return {
    minX: Math.min(t.minX, e.minX),
    minY: Math.min(t.minY, e.minY),
    maxX: Math.max(t.maxX, e.maxX),
    maxY: Math.max(t.maxY, e.maxY)
  };
}
function Fl(t, e, n) {
  const s = t.maxX - t.minX, i = t.maxY - t.minY;
  return `<rect x="${t.minX}" y="${-t.maxY}" width="${s}" height="${i}" fill="none" stroke="${e}" stroke-width="${n}"/>`;
}
function Do(t, e) {
  const n = t.maxX - t.minX, s = t.maxY - t.minY;
  return `<rect x="${t.minX}" y="${-t.maxY}" width="${n}" height="${s}" fill="${e}"/>`;
}
function Rl(t, e, n, s, i, o, r) {
  const a = ` stroke-dasharray="${r}"`;
  return `<line x1="${t}" y1="${-e}" x2="${n}" y2="${-s}" stroke="${i}" stroke-width="${o}"${a}/>`;
}
function Bl(t, e, n) {
  const { capHeight: s, descenderHeight: i, origin: o = "baseline" } = t, r = s + i, a = _r(t);
  let c, l, h;
  o === "top" ? (s > 0 && (c = { minX: a.minX, maxX: a.maxX, minY: -s, maxY: 0 }), i > 0 && (l = {
    minX: a.minX,
    maxX: a.maxX,
    minY: -r,
    maxY: -s
  }), h = -s) : (s > 0 && (c = { minX: a.minX, maxX: a.maxX, minY: 0, maxY: s }), i > 0 && (l = {
    minX: a.minX,
    maxX: a.maxX,
    minY: -i,
    maxY: 0
  }), h = 0);
  const u = [
    c ? Do(c, "rgba(255, 0, 0, 0.06)") : "",
    l ? Do(l, "rgba(255, 0, 0, 0.14)") : "",
    Fl(a, e, n)
  ];
  return h !== void 0 && i > 0 && s > 0 && u.push(
    Rl(
      a.minX,
      h,
      a.maxX,
      h,
      e,
      n,
      "4 2"
    )
  ), `<g>${u.join("")}</g>`;
}
class Xe {
  constructor(e, n = [], s = !1) {
    this.lastPoint = e, this.polylines = n, this.hasExplicitAdvance = s;
  }
  /**
   * Get the bounding box of the shape
   * @returns Bounding box of the shape
   */
  get bbox() {
    if (this._bbox)
      return this._bbox;
    let e = 1 / 0, n = -1 / 0, s = 1 / 0, i = -1 / 0;
    return this.polylines.forEach((o) => {
      o.forEach((r) => {
        e = Math.min(e, r.x), n = Math.max(n, r.x), s = Math.min(s, r.y), i = Math.max(i, r.y);
      });
    }), this._bbox = { minX: e, minY: s, maxX: n, maxY: i }, this._bbox;
  }
  /**
   * Offset the shape by a point
   * @param p The point to offset the shape by
   * @param isNewInstance Whether to return a new instance of the shape or modify the current instance
   * @returns The offset shape
   */
  offset(e, n = !0) {
    var s, i;
    return n ? new Xe(
      (s = this.lastPoint) == null ? void 0 : s.clone().add(e),
      this.polylines.map((o) => o.map((r) => r.clone().add(e))),
      this.hasExplicitAdvance
    ) : ((i = this.lastPoint) == null || i.add(e), this.polylines.forEach((o) => o.forEach((r) => r.add(e))), this._bbox && (this._bbox.maxX += e.x, this._bbox.minX += e.x, this._bbox.maxY += e.y, this._bbox.minY += e.y), this);
  }
  /**
   * Normalizes a shape so that its bounding box’s bottom-left corner moves to the origin (0,0).
   * It doesn’t change the size or orientation, only repositions the shape.
   * @param isNewInstance Whether to return a new instance of the shape or modify the current instance
   * @returns The offset shape
   */
  normalizeToOrigin(e = !1) {
    const n = this.bbox;
    return this.offset(new G(-n.minX, -n.minY), e);
  }
  /**
   * Converts the shape to an SVG string
   * @param options SVG rendering options
   * @returns SVG string
   */
  toSVG(e = {}) {
    const {
      strokeWidth: n = "0.5%",
      strokeColor: s = "black",
      isAutoFit: i = !1,
      fontCell: o
    } = e;
    let r, a;
    const c = (l) => this.polylines.map((h) => {
      let u = "";
      return h.forEach((f, d) => {
        const { x: m, y: p } = l(f);
        u += d === 0 ? `M ${m} ${p} ` : `L ${m} ${p} `;
      }), `<path d="${u}" stroke="${s}" stroke-width="${n}" fill="none"/>`;
    }).join("");
    if (o) {
      const {
        padding: l = 0.1,
        expandToFit: h = !1,
        showFrame: u = !1,
        frameColor: f = "red",
        frameStrokeWidth: d = "0.5%"
      } = o, m = _r(o), p = this.bbox;
      let b = m;
      h && Ll(p) && !Il(m, p) && (b = Dl(m, p));
      const g = b.maxX - b.minX, y = b.maxY - b.minY, x = g * l, v = y * l, w = b.minX - x, C = b.maxX + x, S = b.minY - v, D = b.maxY + v;
      a = c((I) => ({
        x: I.x,
        y: -I.y
      }));
      const L = u ? Bl(o, f, d) : "";
      return r = `${w} ${-D} ${C - w} ${D - S}`, `<svg width="100%" height="100%" viewBox="${r}" preserveAspectRatio="xMidYMid meet">${L}${a}</svg>`;
    } else if (i) {
      const l = this.bbox, h = 0.2, u = l.maxX - l.minX, f = l.maxY - l.minY, d = u === 0 ? f : u, m = f === 0 ? u : f, p = l.minX - d * h, b = l.maxX + d * h, g = l.minY - m * h, y = l.maxY + m * h;
      a = c((x) => ({
        x: x.x,
        y: -x.y
      })), r = `${p} ${-y} ${b - p} ${y - g}`;
    } else
      r = "0 0 20 20", a = c((l) => ({
        x: l.x + 5,
        y: -l.y + 15
      }));
    return `<svg width="100%" height="100%" viewBox="${r}" preserveAspectRatio="xMidYMid meet">${a}</svg>`;
  }
}
const Fo = 8, Ro = 48, Ol = 0.4, _l = [
  52164,
  45795,
  49829,
  50150,
  54992,
  47610,
  54754,
  46532,
  51906,
  53947,
  49332,
  51706,
  46532,
  54224,
  52946,
  52714,
  52219,
  45755,
  51403,
  46532,
  53947,
  50410,
  49332,
  52219,
  52141,
  46532,
  50150,
  51120,
  50150,
  54992,
  51663,
  50119,
  53186,
  46532,
  46525,
  51365,
  52149,
  47016,
  46532,
  51889,
  51706,
  46025,
  47037,
  55031,
  48122,
  50935,
  47531,
  48122,
  51965,
  55e3
];
function Wt(t, e) {
  const { height: n, width: s, baseUp: i, baseDown: o } = t, r = n > 0 ? e / n : 1, a = r * i, c = r * o;
  return {
    size: e,
    capHeight: a,
    descenderHeight: c,
    cellWidth: r * s,
    totalHeight: a + c
  };
}
function $l(t, e, n) {
  if (t.header.fontType !== V.SHAPES || !(0 in t.content.data))
    return !1;
  const s = -(n.descenderHeight + n.capHeight * 0.2);
  return e.bbox.minY < s;
}
function $r(t, e) {
  const n = -(e.descenderHeight + e.capHeight * 0.05);
  return !(t.bbox.minY < n || t.bbox.maxY - t.bbox.minY < e.capHeight * 0.05);
}
function Xl(t, e, n) {
  if (t.header.fontType !== V.BIGFONT || t.content.baseDown > 0)
    return 0;
  const { height: s } = t.content;
  if (s <= 0)
    return 0;
  const i = s * Ol, o = [], r = /* @__PURE__ */ new Set(), a = (l) => {
    if (r.has(l) || l <= 255 || !(l in t.content.data))
      return;
    r.add(l);
    const h = e(l);
    if (!h)
      return;
    const u = h.bbox.minY;
    u > 0 && u <= i && o.push(u);
  };
  for (const l of _l)
    if (a(l), o.length >= Ro)
      break;
  if (o.length < Fo) {
    for (const l of Object.keys(t.content.data))
      if (a(Number(l)), o.length >= Ro)
        break;
  }
  if (o.length < Fo)
    return 0;
  o.sort((l, h) => l - h);
  const c = Math.floor(o.length / 2);
  return o.length % 2 === 0 ? (o[c - 1] + o[c]) / 2 : o[c];
}
function Hl(t, e, n) {
  if (t.header.fontType !== V.UNIFONT)
    return !1;
  if (t.content.dualOrientation)
    return !0;
  const s = Wt(t.content, n);
  for (const i of [48, 65, 78, 49]) {
    if (!(i in t.content.data))
      continue;
    const o = e(i);
    if (o && $r(o, s))
      return !0;
  }
  return !1;
}
function Wl(t, e, n, s = vt, i = !1, o = 0) {
  var h;
  var r;
  let a = t;
  if (e.header.fontType === V.BIGFONT && o > 0) {
    const u = e.content.height > 0 ? n.size / e.content.height : 1;
    a = a.offset(new G(0, -o * u), !0);
  }
  if (e.header.fontType === V.UNIFONT || $l(e, t, n)) {
    const u = e.header.fontType === V.UNIFONT && (i || e.content.dualOrientation || $r(t, n));
    (e.header.fontType !== V.UNIFONT || !u) && (a = a.offset(new G(0, n.capHeight), !0));
  }
  const c = s.resolve(a, n.cellWidth), l = s.markAlignedAdvanceExplicit(a) ? !0 : a.hasExplicitAdvance;
  return new Xe(
    new G(c, (h = (r = a.lastPoint) == null ? void 0 : r.y) != null ? h : 0),
    a.polylines,
    l
  );
}
function Yl(t, e, n, s = vt, i = !1, o = 0) {
  const r = Wt(e.content, n);
  return Wl(
    t,
    e,
    r,
    s,
    i,
    o
  );
}
const Bo = Math.PI / 4;
class pt {
  /**
   * Creates a bulge-defined arc
   * @param start Start point
   * @param end End point
   * @param bulge Bulge factor (-1 to 1, where 1 is a semicircle)
   */
  static fromBulge(e, n, s) {
    const i = Math.max(-1, Math.min(1, s));
    return new pt({
      start: e,
      end: n,
      bulge: i
    });
  }
  /**
   * Creates an octant-defined arc
   * @param center Center point of the arc
   * @param radius Radius of the arc
   * @param startOctant Starting octant (0-7)
   * @param octantCount Number of octants to span (0-8, where 0 means 8 octants)
   * @param isClockwise Whether the arc goes clockwise
   */
  static fromOctant(e, n, s, i, o) {
    return new pt({
      center: e,
      radius: n,
      startOctant: s,
      octantCount: i,
      isClockwise: o
    });
  }
  constructor(e) {
    if (e.start && e.end && e.bulge !== void 0) {
      this.start = e.start.clone(), this.end = e.end.clone(), this.bulge = e.bulge, this.isClockwise = e.bulge < 0;
      const n = this.end.clone().subtract(this.start), s = n.length();
      if (Math.abs(this.bulge) * s / 2 === 0) {
        this.radius = 0, this.center = this.start.clone(), this.startAngle = Math.atan2(n.y, n.x), this.endAngle = this.startAngle;
        return;
      }
      const i = 4 * Math.atan(Math.abs(this.bulge));
      this.radius = s / (2 * Math.sin(i / 2));
      const o = this.start.clone().add(n.clone().divide(2)), r = new G(-n.y, n.x);
      r.normalize(), r.multiply(Math.abs(this.radius * Math.cos(i / 2))), this.center = o.clone(), this.isClockwise ? this.center.subtract(r) : this.center.add(r), this.startAngle = Math.atan2(this.start.y - this.center.y, this.start.x - this.center.x), this.endAngle = Math.atan2(this.end.y - this.center.y, this.end.x - this.center.x), this.isClockwise ? this.endAngle >= this.startAngle && (this.endAngle -= 2 * Math.PI) : this.endAngle <= this.startAngle && (this.endAngle += 2 * Math.PI);
    } else if (e.center && e.radius !== void 0 && e.startOctant !== void 0 && e.octantCount !== void 0 && e.isClockwise !== void 0) {
      this.center = e.center.clone(), this.radius = e.radius, this.isClockwise = e.isClockwise, this.startAngle = e.startOctant * Bo;
      const n = (e.octantCount === 0 ? 8 : e.octantCount) * Bo;
      this.endAngle = this.startAngle + (this.isClockwise ? -n : n), this.start = this.center.clone().add(
        new G(
          this.radius * Math.cos(this.startAngle),
          this.radius * Math.sin(this.startAngle)
        )
      ), this.end = this.center.clone().add(
        new G(this.radius * Math.cos(this.endAngle), this.radius * Math.sin(this.endAngle))
      );
    } else
      throw new Error("Invalid arc parameters");
  }
  /**
   * Tessellates the arc into a series of points that approximate the arc.
   * @param circleSpan The angle span between tessellated points (default Math.PI / 18)
   * @returns Array of points representing the tessellated arc
   */
  tessellate(e = Math.PI / 18) {
    if (this.radius === 0)
      return [this.start.clone(), this.end.clone()];
    const n = [this.start.clone()], s = Math.abs(this.endAngle - this.startAngle), i = Math.max(1, Math.floor(s / e));
    for (let o = 1; o < i; o++) {
      const r = o / i, a = this.isClockwise ? this.startAngle - r * s : this.startAngle + r * s;
      n.push(
        this.center.clone().add(new G(this.radius * Math.cos(a), this.radius * Math.sin(a)))
      );
    }
    return n.push(
      this.end ? this.end.clone() : this.center.clone().add(
        new G(
          this.radius * Math.cos(this.endAngle),
          this.radius * Math.sin(this.endAngle)
        )
      )
    ), n;
  }
}
const Ul = Math.PI / 18, zl = 1e-6;
class Vl {
  constructor(e) {
    this.shapeCache = /* @__PURE__ */ new Map(), this.subshapeCache = /* @__PURE__ */ new Map(), this.shapeData = /* @__PURE__ */ new Map(), this.fontData = e;
  }
  /**
   * Releases parsed shapes and cached shapes
   */
  release() {
    this.shapeCache.clear(), this.subshapeCache.clear(), this.shapeData.clear();
  }
  /**
   * Parses a character's shape with the given font size.
   * @param code - The character code
   * @param size - The font size
   * @returns The parsed shape or undefined if the character is not found
   */
  getCharShape(e, n) {
    const s = this.fontData.header.fontType === V.SHAPES && !(0 in this.fontData.content.data) ? n : n / this.fontData.content.height;
    return this.parseAndScale(e, { factor: s });
  }
  /**
   * Parses a character's shape with scaling options
   * @param code - The character code
   * @param options - Scaling options (factor or height/width)
   * @returns The parsed shape or undefined if the character is not found
   */
  parseAndScale(e, n) {
    var i;
    if (e === 0)
      return;
    let s;
    if (this.shapeCache.has(e))
      s = this.shapeCache.get(e);
    else {
      const o = this.fontData.content.data;
      if (o[e]) {
        const r = this.prepareBigfontGlyphBytecode(e, o[e]), a = this.fontData.header.fontType !== V.BIGFONT;
        s = this.parseShape(r, { flushOnEnd: !0, initialPenDown: a }), this.shapeData.set(e, s), this.shapeCache.set(e, s);
      }
    }
    if (s) {
      if (n.factor !== void 0)
        return this.scaleShapeByFactor(s, n.factor);
      if (n.height !== void 0) {
        const o = (i = n.width) != null ? i : n.height;
        return this.scaleShapeByHeightAndWidth(s, n.height, o);
      } else
        return s;
    }
  }
  /** Strips the embedded character-code prefix from dual-byte BIGFONT parent glyphs. */
  prepareBigfontGlyphBytecode(e, n) {
    if (this.fontData.header.fontType !== V.BIGFONT || e <= 255)
      return n;
    const s = e >> 8 & 255, i = e & 255;
    if (n.length >= 2 && n[0] === s && n[1] === i) {
      let o = 2;
      return n[o] === 0 && o++, n.slice(o);
    }
    return n;
  }
  /**
   * Dual-orientation vertical BIGFONT files (e.g. gbcbig.shx) use 0x8e/0x8f markers on
   * code 7 instead of real subshapes. Only the marker byte is skipped; following setup
   * commands (push / pen up / xy origin) are executed normally.
   */
  isVerticalDualBigfontMarker(e, n, s) {
    return this.fontData.content.verticalDualMode ? s === "open" ? e[n] === 142 : e[n] === 143 : !1;
  }
  /**
   * Scales a shape according to the given scale factor
   * @param shape - The shape to scale
   * @param factor - The scale factor
   * @returns The scaled shape
   */
  scaleShapeByFactor(e, n) {
    var s;
    return new Xe(
      (s = e.lastPoint) == null ? void 0 : s.clone().multiply(n),
      e.polylines.map((i) => i.map((o) => o.clone().multiply(n))),
      e.hasExplicitAdvance
    );
  }
  /**
   * Scales a shape according to the given height and width
   * @param shape - The shape to scale
   * @param height - The target height
   * @param width - The target width
   * @returns The scaled shape
   */
  scaleShapeByHeightAndWidth(e, n, s) {
    var i;
    const o = e.bbox, r = o.maxY - o.minY, a = o.maxX - o.minX, c = r > 0 ? n / r : 1, l = a > 0 ? s / a : 1, h = (i = e.lastPoint) == null ? void 0 : i.clone();
    h && (h.x *= l, h.y *= c);
    const u = e.polylines.map(
      (f) => f.map((d) => {
        const m = d.clone();
        return m.x *= l, m.y *= c, m;
      })
    );
    return new Xe(h, u, e.hasExplicitAdvance);
  }
  /**
   * Whether code 14 (0x0E) should skip the following command for the current layout.
   * Defaults to horizontal text layout when no orientation is supplied.
   */
  shouldSkipVerticalFlagCommand(e = !1) {
    const { content: n, header: s } = this.fontData;
    return s.fontType === V.BIGFONT ? !n.verticalDualMode : n.dualOrientation ? !e : n.orientation === "horizontal";
  }
  /** Marks that bytecode explicitly defines horizontal advance. */
  markAdvanceDefined(e) {
    e.hasExplicitAdvance = !0;
  }
  /** Records a terminal pen-up XY move (codes 8/9). */
  notePenUpPositioning(e) {
    e.pendingTerminalAdvance = !0;
  }
  /** Clears a pending advance when later bytecode supersedes the prior XY move. */
  clearPendingAdvance(e) {
    e.pendingTerminalAdvance = !1;
  }
  stateHasInk(e) {
    return e.currentPolyline.length > 1 ? !0 : e.polylines.some((n) => n.length >= 2);
  }
  /**
   * Confirms terminal pen-up XY (codes 8/9) as advance definition.
   * Ignores closure moves that return to the origin after drawing (e.g. txt `A`).
   */
  finalizeAdvanceFlag(e) {
    if (!e.pendingTerminalAdvance)
      return;
    const n = e.currentPoint.x;
    if (Math.abs(n) > zl) {
      e.hasExplicitAdvance = !0;
      return;
    }
    this.stateHasInk(e) || (e.hasExplicitAdvance = !0);
  }
  /**
   * Parses the shape of a character.
   * @param data - The data of the character
   * @param options - Optional parse settings
   * @returns The parsed shape
   */
  parseShape(e, n = {}) {
    var l, h;
    let s = new G();
    const i = [];
    let o = [];
    const r = [];
    let a = (l = n.initialPenDown) != null ? l : !1;
    a && o.push(s.clone());
    const c = {
      currentPoint: s,
      polylines: i,
      currentPolyline: o,
      sp: r,
      isPenDown: a,
      scale: 1,
      // Top-level glyphs flush trailing pen-down strokes at 0x00. Subshape
      // primitives and inherited-pen unifont subshapes (amgdt %%132) opt in
      // via flushOnEnd; bigfont subshape cache keeps flush off to avoid regressions.
      flushEndPolyline: (h = n.flushOnEnd) != null ? h : !1,
      hasExplicitAdvance: !1,
      pendingTerminalAdvance: !1
    };
    for (let u = 0; u < e.length; u++) {
      const f = e[u];
      f <= 15 ? u = this.handleSpecialCommand(f, e, u, c) : (this.clearPendingAdvance(c), this.handleVectorCommand(f, c));
    }
    return this.finalizeAdvanceFlag(c), this.buildShapeFromState(c);
  }
  /** Builds a shape result, including any trailing pen-down polyline. */
  buildShapeFromState(e) {
    const n = e.polylines.map((s) => s.map((i) => i.clone()));
    return e.currentPolyline.length > 1 && n.push(e.currentPolyline.map((s) => s.clone())), new Xe(e.currentPoint.clone(), n, e.hasExplicitAdvance);
  }
  /**
   * Please refer to special codes reference in the following link for more information.
   * https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-06832147-16BE-4A66-A6D0-3ADF98DC8228
   * @param command - The command byte
   * @param data - The data of the character
   * @param index - The index of the command byte
   * @param state - The state of the parser
   * @returns The index of the next command byte
   */
  handleSpecialCommand(e, n, s, i) {
    var r;
    let o = s;
    switch (e) {
      case 0:
        this.finalizeAdvanceFlag(i), i.flushEndPolyline && i.currentPolyline.length > 1 ? (i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = []) : i.flushEndPolyline && (i.currentPolyline = []), i.isPenDown = !1;
        break;
      case 1:
        this.clearPendingAdvance(i), i.isPenDown || i.currentPolyline.push(i.currentPoint.clone()), i.isPenDown = !0;
        break;
      case 2:
        i.isPenDown = !1, i.currentPolyline.length > 1 && i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = [];
        break;
      case 3:
        this.clearPendingAdvance(i), o++, i.scale /= n[o];
        break;
      case 4:
        this.clearPendingAdvance(i), o++, i.scale *= n[o];
        break;
      case 5:
        if (this.clearPendingAdvance(i), i.sp.length === 4)
          throw new Error("The position stack is only four locations deep");
        i.sp.push(i.currentPoint.clone());
        break;
      case 6:
        this.clearPendingAdvance(i), i.currentPoint = (r = i.sp.pop()) != null ? r : i.currentPoint, i.currentPolyline.length > 1 && (i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = []), i.isPenDown && i.currentPolyline.push(i.currentPoint.clone());
        break;
      case 7:
        this.clearPendingAdvance(i), o = this.handleSubshapeCommand(n, o, i);
        break;
      case 8:
        o = this.handleXYDisplacement(n, o, i);
        break;
      case 9:
        o = this.handleMultipleXYDisplacements(n, o, i);
        break;
      case 10:
        this.clearPendingAdvance(i), o = this.handleOctantArc(n, o, i);
        break;
      case 11:
        this.clearPendingAdvance(i), o = this.handleFractionalArc(n, o, i);
        break;
      case 12:
        this.clearPendingAdvance(i), o = this.handleBulgeArc(n, o, i);
        break;
      case 13:
        this.clearPendingAdvance(i), o = this.handleMultipleBulgeArcs(n, o, i);
        break;
      case 14:
        this.clearPendingAdvance(i), this.shouldSkipVerticalFlagCommand() && (o = this.skipCode(n, ++o));
        break;
    }
    return o;
  }
  handleVectorCommand(e, n) {
    const s = (e & 240) >> 4, i = e & 15, o = this.getVectorForDirection(i);
    n.currentPoint.add(o.multiply(s * n.scale)), n.isPenDown && n.currentPolyline.push(n.currentPoint.clone());
  }
  /**
   * Get the vector for the given direction code. Please refer to the following link for more information.
   * https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-0A8E12A1-F4AB-44AD-8A9B-2140E0D5FD23
   * @param dir - The direction code of the vector
   * @returns Returns the vector for the given direction code
   */
  getVectorForDirection(e) {
    const n = new G();
    switch (e) {
      case 0:
        n.x = 1;
        break;
      case 1:
        n.x = 1, n.y = 0.5;
        break;
      case 2:
        n.x = 1, n.y = 1;
        break;
      case 3:
        n.x = 0.5, n.y = 1;
        break;
      case 4:
        n.y = 1;
        break;
      case 5:
        n.x = -0.5, n.y = 1;
        break;
      case 6:
        n.x = -1, n.y = 1;
        break;
      case 7:
        n.x = -1, n.y = 0.5;
        break;
      case 8:
        n.x = -1;
        break;
      case 9:
        n.x = -1, n.y = -0.5;
        break;
      case 10:
        n.x = -1, n.y = -1;
        break;
      case 11:
        n.x = -0.5, n.y = -1;
        break;
      case 12:
        n.y = -1;
        break;
      case 13:
        n.x = 0.5, n.y = -1;
        break;
      case 14:
        n.x = 1, n.y = -1;
        break;
      case 15:
        n.x = 1, n.y = -0.5;
        break;
    }
    return n;
  }
  handleSubshapeCommand(e, n, s) {
    let i = n, o = 0, r, a = s.scale * this.fontData.content.baseUp, c = a;
    const l = s.currentPoint.clone();
    switch (s.currentPolyline.length > 1 && (s.polylines.push(s.currentPolyline.slice()), s.currentPolyline = []), this.fontData.header.fontType) {
      case V.SHAPES:
        i++, o = e[i];
        break;
      case V.BIGFONT:
        if (i++, this.isVerticalDualBigfontMarker(e, i, "open"))
          return i;
        if (this.isVerticalDualBigfontMarker(e, i, "close"))
          return i + 1;
        o = e[i], o === 0 && (i++, o = e[i++] << 8 | e[i++], l.x = oe.byteToSByte(e[i++]) * s.scale, l.y = oe.byteToSByte(e[i++]) * s.scale, this.fontData.content.isExtended ? (c = e[i++] * s.scale, a = e[i] * s.scale) : (a = e[i] * s.scale, c = a));
        break;
      case V.UNIFONT:
        i++, o = e[i++] << 8 | e[i++], i--;
        break;
    }
    if (o !== 0)
      if (this.fontData.header.fontType === V.UNIFONT) {
        const h = s.isPenDown;
        r = this.getScaledSubshapeAtInsertPoint(
          o,
          c,
          a,
          l,
          h
        ), r != null && r.polylines.some((u) => u.length >= 2) && (s.polylines.push(...r.polylines.slice()), r.lastPoint && (s.currentPoint = r.lastPoint.clone()), s.currentPolyline = [], s.isPenDown && s.currentPolyline.push(s.currentPoint.clone()));
      } else if (this.fontData.header.fontType === V.SHAPES)
        r = this.getScaledSubshapeAtInsertPoint(
          o,
          c,
          a,
          l
        ), r && (s.polylines.push(...r.polylines.slice()), r.lastPoint && (s.currentPoint = r.lastPoint.clone(), r.hasExplicitAdvance && this.markAdvanceDefined(s))), s.currentPolyline = [], s.isPenDown && s.currentPolyline.push(s.currentPoint.clone());
      else {
        if (r = this.getScaledSubshapeAtInsertPoint(
          o,
          c,
          a,
          l
        ), r && (s.polylines.push(...r.polylines.slice()), o === 2 && r.lastPoint)) {
          const h = r.lastPoint.x - l.x;
          h > s.currentPoint.x && (s.currentPoint.x = h), this.markAdvanceDefined(s);
        }
        s.currentPolyline = [];
      }
    return i;
  }
  handleXYDisplacement(e, n, s) {
    let i = n;
    const o = new G();
    return o.x = oe.byteToSByte(e[++i]), o.y = oe.byteToSByte(e[++i]), s.currentPoint.add(o.multiply(s.scale)), s.isPenDown ? s.currentPolyline.push(s.currentPoint.clone()) : this.notePenUpPositioning(s), i;
  }
  handleMultipleXYDisplacements(e, n, s) {
    let i = n;
    for (; !(i + 1 >= e.length); ) {
      const o = new G();
      if (o.x = oe.byteToSByte(e[++i]), o.y = oe.byteToSByte(e[++i]), o.x === 0 && o.y === 0)
        break;
      s.currentPoint.add(o.multiply(s.scale)), s.isPenDown ? s.currentPolyline.push(s.currentPoint.clone()) : this.notePenUpPositioning(s);
    }
    return i;
  }
  handleOctantArc(e, n, s) {
    let i = n;
    const o = e[++i] * s.scale, r = oe.byteToSByte(e[++i]), a = (r & 112) >> 4;
    let c = r & 7;
    const l = r < 0, h = Math.PI / 4 * a, u = s.currentPoint.clone().subtract(new G(Math.cos(h) * o, Math.sin(h) * o)), f = pt.fromOctant(u, o, a, c, l).tessellate();
    return s.isPenDown && (s.currentPolyline.pop(), s.currentPolyline.push(...f.slice())), s.currentPoint = f[f.length - 1].clone(), i;
  }
  handleFractionalArc(e, n, s) {
    let i = n;
    const o = e[++i], r = e[++i], a = e[++i], c = e[++i], l = (a * 255 + c) * s.scale, h = oe.byteToSByte(e[++i]), u = (h & 112) >> 4;
    let f = h & 7;
    f === 0 && (f = 8), r !== 0 && f--;
    const d = Math.PI / 4;
    let m = d * f, p = Ul, b = 1;
    h < 0 && (p = -p, m = -m, b = -1);
    let g = d * u, y = g + m;
    g += d * o / 256 * b, y += d * r / 256 * b;
    const x = s.currentPoint.clone().subtract(new G(l * Math.cos(g), l * Math.sin(g)));
    if (s.currentPoint = x.clone().add(new G(l * Math.cos(y), l * Math.sin(y))), s.isPenDown) {
      let v = g;
      const w = [];
      if (w.push(
        x.clone().add(new G(l * Math.cos(v), l * Math.sin(v)))
      ), p > 0)
        for (; v + p < y; )
          v += p, w.push(
            x.clone().add(new G(l * Math.cos(v), l * Math.sin(v)))
          );
      else
        for (; v + p > y; )
          v += p, w.push(
            x.clone().add(new G(l * Math.cos(v), l * Math.sin(v)))
          );
      w.push(x.clone().add(new G(l * Math.cos(y), l * Math.sin(y)))), s.currentPolyline.push(...w);
    }
    return i;
  }
  handleBulgeArc(e, n, s) {
    let i = n;
    const o = new G();
    o.x = oe.byteToSByte(e[++i]), o.y = oe.byteToSByte(e[++i]);
    const r = oe.byteToSByte(e[++i]);
    return s.currentPoint = this.handleArcSegment(
      s.currentPoint,
      o,
      r,
      s.scale,
      s.isPenDown,
      s.currentPolyline
    ), i;
  }
  handleMultipleBulgeArcs(e, n, s) {
    let i = n;
    for (; !(i + 1 >= e.length); ) {
      const o = new G();
      if (o.x = oe.byteToSByte(e[++i]), o.y = oe.byteToSByte(e[++i]), o.x === 0 && o.y === 0 || i + 1 >= e.length)
        break;
      const r = oe.byteToSByte(e[++i]);
      s.currentPoint = this.handleArcSegment(
        s.currentPoint,
        o,
        r,
        s.scale,
        s.isPenDown,
        s.currentPolyline
      );
    }
    return i;
  }
  skipCode(e, n) {
    switch (e[n]) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        break;
      case 3:
      case 4:
        n++;
        break;
      case 5:
        break;
      case 6:
        break;
      case 7:
        switch (this.fontData.header.fontType) {
          case V.SHAPES:
            n++;
            break;
          case V.BIGFONT:
            n++, this.isVerticalDualBigfontMarker(e, n, "open") ? n++ : this.isVerticalDualBigfontMarker(e, n, "close") ? n += 2 : e[n] === 0 && (n += this.fontData.content.isExtended ? 6 : 5);
            break;
          case V.UNIFONT:
            n += 2;
            break;
        }
        break;
      case 8:
        n += 2;
        break;
      case 9:
        for (; n++, !(n >= e.length); ) {
          const s = e[n];
          if (n++, n >= e.length)
            break;
          const i = e[n];
          if (s === 0 && i === 0)
            break;
        }
        break;
      case 10:
        n += 2;
        break;
      case 11:
        n += 5;
        break;
      case 12:
        n += 3;
        break;
      case 13:
        for (; n++, !(n >= e.length); ) {
          const s = e[n];
          if (n++, n >= e.length)
            break;
          const i = e[n];
          if (s === 0 && i === 0)
            break;
          n++;
        }
        break;
    }
    return n;
  }
  getScaledSubshapeAtInsertPoint(e, n, s, i, o = !1) {
    let r;
    if (o) {
      const l = this.fontData.content.data[e];
      if (!l)
        return;
      r = this.parseShape(l, { initialPenDown: !0, flushOnEnd: !0 });
    } else if (r = this.subshapeCache.get(e), !r) {
      const l = this.fontData.content.data[e];
      if (!l)
        return;
      const h = this.fontData.header.fontType !== V.BIGFONT;
      r = this.parseShape(l, {
        flushOnEnd: !1,
        initialPenDown: h
      }), this.shapeData.set(e, r), this.subshapeCache.set(e, r);
    }
    const a = this.fontData.header.fontType === V.BIGFONT ? void 0 : s / this.fontData.content.baseUp, c = r.polylines.some((l) => l.length > 0);
    return (a !== void 0 ? this.scaleShapeByFactor(r, a) : this.scaleShapeByHeightAndWidth(
      c ? r.normalizeToOrigin(!0) : r,
      s,
      n
    )).offset(i, !1);
  }
  /**
   * Handles drawing an arc segment with the given vector and bulge
   * @param currentPoint The starting point of the arc
   * @param vec The displacement vector
   * @param bulge The bulge value (will be normalized by 127.0)
   * @param scale The current scale factor
   * @param isPenDown Whether the pen is currently down (drawing)
   * @param currentPolyline The current polyline being built
   * @returns The new current point after the arc
   */
  handleArcSegment(e, n, s, i, o, r) {
    n.x *= i, n.y *= i, s < -127 && (s = -127);
    const a = e.clone();
    if (o)
      if (s === 0)
        r.push(a.clone().add(n));
      else {
        const c = a.clone().add(n), l = pt.fromBulge(a, c, s / 127).tessellate();
        r.push(...l.slice(1));
      }
    return a.add(n), a;
  }
}
class jl {
  /**
   * Creates a new ShxFont instance.
   * @param data - Either raw binary data of the SHX font file (ArrayBuffer) or pre-parsed font data (ShxFontData)
   * @throws {Error} If the font data is invalid or cannot be parsed
   */
  constructor(e) {
    if (e instanceof ArrayBuffer) {
      const n = new oe(e), s = new Nl().parse(n), i = Al.createParser(s.fontType).parse(n);
      this.fontData = {
        header: s,
        content: i
      };
    } else
      this.fontData = e;
    this.shapeParser = new Vl(this.fontData);
  }
  /**
   * Return true if this font contains glyph of the specified character. Otherwise, return false.
   * @param char - The character to check
   * @returns True if this font contains glyph of the specified character. Otherwise, return false.
   */
  hasChar(e) {
    return this.fontData.content.data[e] !== void 0;
  }
  /**
   * Return true if this font contains a shape with the specified name. Otherwise, return false.
   * Shape names are matched case-insensitively.
   * @param name - The shape name to check (for example, "GRS")
   * @returns True if this font contains the named shape. Otherwise, return false.
   */
  hasShape(e) {
    return this.getShapeCode(e) !== void 0;
  }
  /**
   * Gets the character code for a named shape.
   * @param name - The shape name to look up
   * @returns The character code, or undefined if the shape is not found
   */
  getShapeCode(e) {
    const n = this.fontData.content.names;
    if (n)
      return n[e.toUpperCase()];
  }
  /**
   * Gets the shape name for a character code, if one is defined.
   * @param code - The character code to look up
   * @returns The shape name, or undefined if the code has no name
   */
  getShapeName(e) {
    var n;
    const s = (n = this.fontData.content.codeToName) == null ? void 0 : n[e];
    if (s !== void 0)
      return s;
    const i = this.fontData.content.names;
    if (i) {
      for (const [o, r] of Object.entries(i))
        if (r === e)
          return o;
    }
  }
  /**
   * Returns scaled font metrics for a target render size.
   * @param size - Target font size in drawing units
   */
  getFontMetrics(e) {
    return Wt(this.fontData.content, e);
  }
  /**
   * Returns a layout-ready glyph: scaled geometry with baseline alignment applied.
   *
   * Prefer this over {@link ShxFont.getCharShape} when placing text for display.
   *
   * @param code - The character code to get the shape for
   * @param size - The desired font size
   */
  getLayoutCharShape(e, n, s = vt) {
    const i = this.getCharShape(e, n);
    if (i)
      return Yl(
        i,
        this.fontData,
        n,
        s,
        this.usesUnifontBaselineOriginFont(n),
        this.getBigfontBaselineInkPaddingNative()
      );
  }
  /**
   * Returns the cached median baseline ink padding for BIGFONT layout normalization.
   *
   * @returns Padding in native font units from shape #0 height, or 0 when not applicable
   */
  getBigfontBaselineInkPaddingNative() {
    if (this.bigfontBaselineInkPaddingNative === void 0) {
      const e = this.fontData.content.height;
      this.bigfontBaselineInkPaddingNative = Xl(
        this.fontData,
        (n) => this.getCharShape(n, e)
      );
    }
    return this.bigfontBaselineInkPaddingNative;
  }
  /**
   * Returns whether this UNIFONT encodes horizontal glyphs with baseline at y = 0.
   *
   * The result is computed once via {@link detectUnifontBaselineOriginFont} and cached,
   * because baseline-origin detection is independent of render size.
   *
   * @param size - Font size used when sampling glyph geometry for detection
   * @returns True when baseline-origin UNIFONT shifting should be skipped during layout
   */
  usesUnifontBaselineOriginFont(e) {
    return this.unifontBaselineOriginFont === void 0 && (this.unifontBaselineOriginFont = Hl(
      this.fontData,
      (n) => this.getCharShape(n, e),
      e
    )), this.unifontBaselineOriginFont;
  }
  /**
   * Gets the shape data for a named shape at a given font size.
   * Shape names are matched case-insensitively.
   * @param name - The shape name to get the shape for
   * @param size - The desired font size
   * @returns The shape data for the named shape, or undefined if it is not found in the font
   */
  getShapeByName(e, n) {
    const s = this.getShapeCode(e);
    if (s !== void 0)
      return this.getCharShape(s, n);
  }
  /**
   * Gets the scaled shape geometry for a character code.
   *
   * Returns the glyph as encoded in the SHX file, scaled to `size`. Vertical placement
   * and mixed-font baseline alignment are the responsibility of the text renderer;
   * see the `textLayout` module and {@link ShxFont.getFontMetrics}.
   *
   * @param code - The character code to get the shape for
   * @param size - The desired font size
   * @returns The shape data for the character, or undefined if the character is not found in the font
   */
  getCharShape(e, n) {
    return this.shapeParser.getCharShape(e, n);
  }
  /**
   * Releases resources used by the font.
   * This should be called when the font is no longer needed to free up memory.
   */
  release() {
    this.shapeParser.release();
  }
}
function Gl(t, e, n, s = vt) {
  const i = Wt(e.content, n);
  return s.resolve(t, i.cellWidth);
}
function ql(t, e, n = 0) {
  return t.offset(new G(e, n), !0);
}
function Kl(t, e = 0, n = {}) {
  var r;
  const s = (r = n.advance) != null ? r : vt;
  let i = 0;
  const o = [];
  for (const { font: a, code: c, size: l } of t) {
    const h = a.getLayoutCharShape(c, l, s);
    h && (o.push({
      shape: ql(h, i, e),
      x: i
    }), i += Gl(h, a.fontData, l, s));
  }
  return o;
}
const Xr = Object.freeze({
  resolveShape: () => {
  },
  resolveText: () => {
  }
}), Oo = "Complex SHX linetype glyphs";
class Zl {
  constructor() {
    P(this, "fonts", /* @__PURE__ */ new Map());
    P(this, "requirements", []);
  }
  async add(e) {
    var c, l;
    const n = pn((l = e.fileName) != null ? l : (c = e.file) == null ? void 0 : c.name);
    if (!n) throw new Error("A fileName is required when adding an SHX reference buffer.");
    if (!/\.shx$/i.test(n)) throw new Error(`${n} is not an SHX reference file.`);
    if (!e.file && !e.buffer) throw new Error(`No file content was provided for ${n}.`);
    const s = e.file ? new Uint8Array(await e.file.arrayBuffer()) : Jl(e.buffer);
    if (s.byteLength === 0) throw new Error(`${n} is empty.`);
    let i;
    try {
      i = new jl(Ql(s));
    } catch (h) {
      const u = h instanceof Error ? h.message : String(h);
      throw new Error(`Unable to parse SHX reference ${n}: ${u}`);
    }
    const o = ye(n), r = this.fonts.get(o), a = {
      kind: "shx",
      fileName: n,
      bytes: s.byteLength,
      fontType: i.fontData.header.fontType,
      glyphCount: Object.keys(i.fontData.content.data).length
    };
    return this.fonts.set(o, { key: o, font: i, info: a, shapeCache: /* @__PURE__ */ new Map(), textCache: /* @__PURE__ */ new Map() }), r == null || r.font.release(), { ...a };
  }
  setDocument(e) {
    var a, c;
    if (!e) {
      this.requirements = [];
      return;
    }
    const n = /* @__PURE__ */ new Map(), s = (l) => {
      const h = pn(l), u = h ? ye(h) : "*";
      let f = n.get(u);
      return f || (f = { fileName: h || void 0, shapeNumbers: /* @__PURE__ */ new Set(), texts: /* @__PURE__ */ new Set() }, n.set(u, f)), f;
    };
    for (const l of new Set(Object.values((a = e.lineTypes) != null ? a : {})))
      for (const h of l.pattern) {
        const u = Number((c = h.elementTypeFlag) != null ? c : 0);
        if (u === 0) continue;
        const f = s(h.fontName), d = Math.trunc(Number(h.shapeNumber));
        (u & 4) === 4 && Number.isFinite(d) && f.shapeNumbers.add(d), (u & 2) === 2 && h.text && f.texts.add(h.text);
      }
    const i = Array.isArray(e.metadata.requiredShxFonts) ? e.metadata.requiredShxFonts : [];
    for (const l of i) s(String(l));
    const o = n.get("*"), r = [...n.entries()].filter(([l]) => l !== "*");
    if (o && r.length === 1) {
      const l = r[0][1];
      for (const h of o.shapeNumbers) l.shapeNumbers.add(h);
      for (const h of o.texts) l.texts.add(h);
      n.delete("*");
    }
    this.requirements = [...n.values()];
  }
  has(e) {
    return this.fonts.has(ye(e));
  }
  remove(e) {
    const n = ye(e), s = this.fonts.get(n);
    return s ? (s.font.release(), this.fonts.delete(n), !0) : !1;
  }
  clear() {
    for (const e of this.fonts.values()) e.font.release();
    this.fonts.clear();
  }
  getState() {
    const e = [];
    for (const n of this.requirements) {
      if (n.fileName) {
        const i = this.fonts.get(ye(n.fileName));
        i ? Xo(i.font, n) || e.push({ kind: "shx", fileName: n.fileName, identified: !0, reason: "incompatible" }) : e.push({ kind: "shx", fileName: n.fileName, identified: !0, reason: "not-loaded" });
        continue;
      }
      [...this.fonts.values()].some((i) => Xo(i.font, n)) || e.push({ kind: "shx", fileName: "External SHX font", identified: !1, reason: this.fonts.size ? "incompatible" : "not-loaded" });
    }
    return {
      missing: e,
      loaded: [...this.fonts.values()].map(({ info: n }) => ({ ...n })).sort((n, s) => n.fileName.localeCompare(s.fileName))
    };
  }
  resolveShape(e, n) {
    const s = Math.trunc(Number(e));
    if (!Number.isFinite(s) || s < 0) return;
    const i = this.resolveFont(n, (a) => a.hasChar(s));
    if (!i) return;
    const o = i.shapeCache.get(s);
    if (o !== void 0) return o != null ? o : void 0;
    let r;
    try {
      const a = i.font.getCharShape(s, 1);
      r = a ? $o(a.polylines) : void 0;
    } catch (a) {
      r = void 0;
    }
    return i.shapeCache.set(s, r != null ? r : null), r;
  }
  resolveText(e, n) {
    if (!e) return;
    const s = Array.from(e, (a) => {
      var c;
      return (c = a.codePointAt(0)) != null ? c : 0;
    }), i = this.resolveFont(n, (a) => s.every((c) => a.hasChar(c)));
    if (!i) return;
    const o = i.textCache.get(e);
    if (o !== void 0) return o != null ? o : void 0;
    let r;
    try {
      const a = Kl(s.map((c) => ({ font: i.font, code: c, size: 1 })));
      r = $o(a.flatMap(({ shape: c }) => c.polylines));
    } catch (a) {
      r = void 0;
    }
    return i.textCache.set(e, r != null ? r : null), r;
  }
  resolveFont(e, n) {
    if (e) {
      const o = this.fonts.get(ye(e));
      return o && n(o.font) ? o : void 0;
    }
    const s = this.requirements.map(({ fileName: o }) => o ? this.fonts.get(ye(o)) : void 0).filter((o) => o !== void 0 && n(o.font));
    if (s.length === 1) return s[0];
    const i = [...this.fonts.values()].filter((o) => n(o.font));
    return i.length === 1 ? i[0] : void 0;
  }
}
function _o(t, e) {
  const n = Array.isArray(t.metadata.requiredShxFonts) ? t.metadata.requiredShxFonts.map(String) : [];
  t.metadata.missingReferences = e.missing.map((i) => ({ ...i })), t.metadata.loadedReferences = e.loaded.map((i) => ({ ...i })), t.metadata.loadedShxFonts = n.filter((i) => e.loaded.some((o) => ye(o.fileName) === ye(i)));
  for (let i = t.warnings.length - 1; i >= 0; i--)
    t.warnings[i].startsWith(Oo) && t.warnings.splice(i, 1);
  if (e.missing.length === 0) return;
  const s = e.missing.map(({ fileName: i, reason: o }) => o === "incompatible" ? `${i} (missing required glyphs)` : i);
  t.warnings.push(`${Oo} are using a dash/dot fallback until the missing reference${s.length === 1 ? " is" : "s are"} supplied: ${s.join(", ")}.`);
}
function pn(t) {
  var e;
  return (e = String(t != null ? t : "").trim().split(/[\\/]/).filter(Boolean).pop()) != null ? e : "";
}
function ye(t) {
  return pn(t).toLocaleLowerCase("en-US");
}
function $o(t) {
  const e = t.map((n) => n.filter((s) => Number.isFinite(s.x) && Number.isFinite(s.y)).map((s) => ({ x: s.x, y: s.y }))).filter((n) => n.length >= 2);
  return e.length > 0 ? { polylines: e } : void 0;
}
function Xo(t, e) {
  var n;
  for (const s of e.shapeNumbers) if (!t.hasChar(s)) return !1;
  for (const s of e.texts)
    for (const i of s) if (!t.hasChar((n = i.codePointAt(0)) != null ? n : 0)) return !1;
  return !0;
}
function Jl(t) {
  return t instanceof Uint8Array ? t.slice() : new Uint8Array(t.slice(0));
}
function Ql(t) {
  return t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength);
}
function eh(t) {
  const e = t;
  return e.nativeRenderer === !0 && typeof e.mount == "function";
}
const th = {
  1: "#ff0000",
  2: "#ffff00",
  3: "#00ff00",
  4: "#00ffff",
  5: "#0000ff",
  6: "#ff00ff",
  8: "#808080",
  9: "#c0c0c0",
  10: "#ff0000",
  11: "#ff7f7f",
  12: "#a50000",
  13: "#a55252",
  14: "#7f0000",
  15: "#7f3f3f",
  16: "#4c0000",
  17: "#4c2626",
  18: "#260000",
  19: "#261313",
  20: "#ff3f00",
  21: "#ff9f7f",
  22: "#a52900",
  23: "#a56752",
  24: "#7f1f00",
  25: "#7f4f3f",
  26: "#4c1300",
  27: "#4c2f26",
  28: "#260900",
  29: "#261713",
  30: "#ff7f00",
  31: "#ffbf7f",
  32: "#a55200",
  33: "#a57c52",
  34: "#7f3f00",
  35: "#7f5f3f",
  36: "#4c2600",
  37: "#4c3926",
  38: "#261300",
  39: "#261c13",
  40: "#ffbf00",
  41: "#ffdf7f",
  42: "#a57c00",
  43: "#a59152",
  44: "#7f5f00",
  45: "#7f6f3f",
  46: "#4c3900",
  47: "#4c4226",
  48: "#261c00",
  49: "#262113",
  50: "#ffff00",
  51: "#ffff7f",
  52: "#a5a500",
  53: "#a5a552",
  54: "#7f7f00",
  55: "#7f7f3f",
  56: "#4c4c00",
  57: "#4c4c26",
  58: "#262600",
  59: "#262613",
  60: "#bfff00",
  61: "#dfff7f",
  62: "#7ca500",
  63: "#91a552",
  64: "#5f7f00",
  65: "#6f7f3f",
  66: "#394c00",
  67: "#424c26",
  68: "#1c2600",
  69: "#212613",
  70: "#7fff00",
  71: "#bfff7f",
  72: "#52a500",
  73: "#7ca552",
  74: "#3f7f00",
  75: "#5f7f3f",
  76: "#264c00",
  77: "#394c26",
  78: "#132600",
  79: "#1c2613",
  80: "#3fff00",
  81: "#9fff7f",
  82: "#29a500",
  83: "#67a552",
  84: "#1f7f00",
  85: "#4f7f3f",
  86: "#134c00",
  87: "#2f4c26",
  88: "#092600",
  89: "#172613",
  90: "#00ff00",
  91: "#7fff7f",
  92: "#00a500",
  93: "#52a552",
  94: "#007f00",
  95: "#3f7f3f",
  96: "#004c00",
  97: "#264c26",
  98: "#002600",
  99: "#132613",
  100: "#00ff3f",
  101: "#7fff9f",
  102: "#00a529",
  103: "#52a567",
  104: "#007f1f",
  105: "#3f7f4f",
  106: "#004c13",
  107: "#264c2f",
  108: "#002609",
  109: "#132617",
  110: "#00ff7f",
  111: "#7fffbf",
  112: "#00a552",
  113: "#52a57c",
  114: "#007f3f",
  115: "#3f7f5f",
  116: "#004c26",
  117: "#264c39",
  118: "#002613",
  119: "#13261c",
  120: "#00ffbf",
  121: "#7fffdf",
  122: "#00a57c",
  123: "#52a591",
  124: "#007f5f",
  125: "#3f7f6f",
  126: "#004c39",
  127: "#264c42",
  128: "#00261c",
  129: "#132621",
  130: "#00ffff",
  131: "#7fffff",
  132: "#00a5a5",
  133: "#52a5a5",
  134: "#007f7f",
  135: "#3f7f7f",
  136: "#004c4c",
  137: "#264c4c",
  138: "#002626",
  139: "#132626",
  140: "#00bfff",
  141: "#7fdfff",
  142: "#007ca5",
  143: "#5291a5",
  144: "#005f7f",
  145: "#3f6f7f",
  146: "#00394c",
  147: "#26424c",
  148: "#001c26",
  149: "#132126",
  150: "#007fff",
  151: "#7fbfff",
  152: "#0052a5",
  153: "#527ca5",
  154: "#003f7f",
  155: "#3f5f7f",
  156: "#00264c",
  157: "#26394c",
  158: "#001326",
  159: "#131c26",
  160: "#003fff",
  161: "#7f9fff",
  162: "#0029a5",
  163: "#5267a5",
  164: "#001f7f",
  165: "#3f4f7f",
  166: "#00134c",
  167: "#262f4c",
  168: "#000926",
  169: "#131726",
  170: "#0000ff",
  171: "#7f7fff",
  172: "#0000a5",
  173: "#5252a5",
  174: "#00007f",
  175: "#3f3f7f",
  176: "#00004c",
  177: "#26264c",
  178: "#000026",
  179: "#131326",
  180: "#3f00ff",
  181: "#9f7fff",
  182: "#2900a5",
  183: "#6752a5",
  184: "#1f007f",
  185: "#4f3f7f",
  186: "#13004c",
  187: "#2f264c",
  188: "#090026",
  189: "#171326",
  190: "#7f00ff",
  191: "#bf7fff",
  192: "#5200a5",
  193: "#7c52a5",
  194: "#3f007f",
  195: "#5f3f7f",
  196: "#26004c",
  197: "#39264c",
  198: "#130026",
  199: "#1c1326",
  200: "#bf00ff",
  201: "#df7fff",
  202: "#7c00a5",
  203: "#9152a5",
  204: "#5f007f",
  205: "#6f3f7f",
  206: "#39004c",
  207: "#42264c",
  208: "#1c0026",
  209: "#211326",
  210: "#ff00ff",
  211: "#ff7fff",
  212: "#a500a5",
  213: "#a552a5",
  214: "#7f007f",
  215: "#7f3f7f",
  216: "#4c004c",
  217: "#4c264c",
  218: "#260026",
  219: "#261326",
  220: "#ff00bf",
  221: "#ff7fdf",
  222: "#a5007c",
  223: "#a55291",
  224: "#7f005f",
  225: "#7f3f6f",
  226: "#4c0039",
  227: "#4c2642",
  228: "#26001c",
  229: "#261321",
  230: "#ff007f",
  231: "#ff7fbf",
  232: "#a50052",
  233: "#a5527c",
  234: "#7f003f",
  235: "#7f3f5f",
  236: "#4c0026",
  237: "#4c2639",
  238: "#260013",
  239: "#26131c",
  240: "#ff003f",
  241: "#ff7f9f",
  242: "#a50029",
  243: "#a55267",
  244: "#7f001f",
  245: "#7f3f4f",
  246: "#4c0013",
  247: "#4c262f",
  248: "#260009",
  249: "#261317",
  250: "#333333",
  251: "#505050",
  252: "#696969",
  253: "#828282",
  254: "#bebebe",
  255: "#ffffff"
};
function Ee(t, e = "#ffffff", n = e) {
  var i;
  if (typeof t != "number" || Number.isNaN(t)) return e;
  const s = Math.abs(Math.trunc(t));
  return s === 0 || s === 256 || s === 257 ? e : s === 7 ? n : (i = th[s]) != null ? i : e;
}
function gt(t, e = "rgb") {
  const n = Math.max(0, Math.trunc(t)) & 16777215, s = n >> 16 & 255, i = n >> 8 & 255, o = n & 255;
  return `rgb(${e === "rgb" ? s : o}, ${i}, ${e === "rgb" ? o : s})`;
}
function Le(t) {
  var e, n, s, i, o, r;
  if (typeof t == "string") {
    const a = t.trim();
    return a ? /^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(a) ? (e = nh(a)) != null ? e : a : {
      red: "#ff0000",
      yellow: "#ffff00",
      green: "#00ff00",
      cyan: "#00ffff",
      blue: "#0000ff",
      magenta: "#ff00ff",
      white: "#ffffff",
      black: "#000000",
      grey: "#808080",
      gray: "#808080"
    }[a.toLowerCase()] : void 0;
  }
  if (t && typeof t == "object") {
    const a = t, c = Number((n = a.r) != null ? n : a.red), l = Number((s = a.g) != null ? s : a.green), h = Number((i = a.b) != null ? i : a.blue), u = Number((r = (o = a.a) != null ? o : a.alpha) != null ? r : 1);
    if ([c, l, h].every(Number.isFinite))
      return Number.isFinite(u) && u >= 0 && u < 1 ? `rgba(${c}, ${l}, ${h}, ${u})` : `rgb(${c}, ${l}, ${h})`;
  }
}
function nh(t) {
  if (!t) return;
  const e = t.trim();
  if (/^#[0-9a-f]{8}$/i.test(e)) {
    const n = parseInt(e.slice(1, 3), 16) / 255, s = parseInt(e.slice(3, 5), 16), i = parseInt(e.slice(5, 7), 16), o = parseInt(e.slice(7, 9), 16);
    return n >= 0.999 ? `rgb(${s}, ${i}, ${o})` : `rgba(${s}, ${i}, ${o}, ${xn(n)})`;
  }
  if (/^#[0-9a-f]{6}$/i.test(e) || /^#[0-9a-f]{3}$/i.test(e)) return e;
  if (/^sc#/i.test(e)) {
    const n = e.slice(3).split(",").map((a) => Number(a.trim())), [s, i, o, r] = n.length === 4 ? n : [1, ...n];
    if ([s, i, o, r].every(Number.isFinite)) return `rgba(${Math.round(i * 255)}, ${Math.round(o * 255)}, ${Math.round(r * 255)}, ${xn(s)})`;
  }
}
function He(t, e, n = {}) {
  var a, c, l, h, u;
  const s = (a = n.foreground) != null ? a : "#ffffff", i = s;
  let o;
  const r = (l = (c = Le(t.trueColor)) != null ? c : Le(t.color)) != null ? l : Le(t.colorName);
  if (r && (o = r), !o) {
    const f = hh(t, ["trueColor", "true_color", "truecolor", "colorRGB", "colorRgb", "rgbColor", "rgb"]);
    typeof f == "number" && f >= 0 && f <= 16777215 && (o = gt(f, (h = n.trueColorByteOrder) != null ? h : "rgb"));
  }
  if (!o) {
    const f = Ur(t.colorIndex, t.colorNumber, t.aci);
    typeof f == "number" && Math.abs(f) <= 257 && f !== 256 && f !== 0 && f !== 257 && (o = Ee(f, i, s));
  }
  if (!o && typeof t.color == "number") {
    const f = Number(t.color);
    Math.abs(f) <= 257 ? f !== 0 && f !== 256 && f !== 257 && (o = Ee(f, i, s)) : o = gt(f, (u = n.trueColorByteOrder) != null ? u : "rgb");
  }
  if (!o) {
    const f = lh(e, t.layer);
    o = rh(f, n);
  }
  return Hr(o != null ? o : i, e, n);
}
function gn(t, e, n = {}) {
  var o, r, a, c, l;
  let s;
  const i = Le(t.fillColor);
  if (i && (s = i), !s && typeof t.fillColor == "number") {
    const h = t.fillColor;
    s = Math.abs(h) <= 257 ? Ee(h, (o = n.foreground) != null ? o : "#ffffff", (r = n.foreground) != null ? r : "#ffffff") : gt(h, (a = n.trueColorByteOrder) != null ? a : "rgb");
  }
  return !s && typeof t.fillColorIndex == "number" && (s = Ee(t.fillColorIndex, (c = n.foreground) != null ? c : "#ffffff", (l = n.foreground) != null ? l : "#ffffff")), s ? Hr(s, e, n) : void 0;
}
function sh(t, e, n = {}) {
  var c, l, h, u, f;
  const s = In(e);
  if (((c = n.colorMode) != null ? c : s.mode) !== "monochrome") return t;
  const o = Le((u = (h = (l = n.monochromeColor) != null ? l : s.monochromeColor) != null ? h : n.foreground) != null ? u : "#000000");
  if (!o) return t;
  const r = ct(o);
  if (!r) return o;
  const a = ct(t);
  return yn({
    r: r.r,
    g: r.g,
    b: r.b,
    a: r.a * ((f = a == null ? void 0 : a.a) != null ? f : 1)
  });
}
function Hr(t, e, n) {
  var r;
  const s = In(e), i = (r = n.colorMode) != null ? r : s.mode, o = sh(t, e, n);
  return i === "monochrome" ? o : ih(o, n);
}
function ih(t, e = {}) {
  var i, o, r;
  if (e.contrastMode !== "adaptive") return t;
  const n = (i = e.background) != null ? i : "#0b1020", s = (o = e.foreground) != null ? o : "#ffffff";
  return oh(t, n, s, (r = e.minColorContrast) != null ? r : 2.4);
}
function oh(t, e, n, s = 2.4) {
  var h, u;
  const i = (h = ct(n)) != null ? h : { r: 255, g: 255, b: 255, a: 1 }, o = (u = ct(e)) != null ? u : { r: 11, g: 16, b: 32, a: 1 }, r = ct(t);
  if (!r) return t;
  const a = Ho(r, o);
  if (tn(a, o) >= s) return t;
  const c = bn(o), l = c < 0.5 ? { r: 255, g: 255, b: 255, a: r.a } : { r: 0, g: 0, b: 0, a: r.a };
  for (const f of [0.25, 0.4, 0.55, 0.7, 0.85, 1]) {
    const d = uh(r, l, f);
    if (tn(Ho(d, o), o) >= s) return yn(d);
  }
  return tn(i, o) >= s ? yn(i) : c < 0.5 ? "#ffffff" : "#000000";
}
function Wr(t) {
  return t ? t.isVisible !== !1 && t.isFrozen !== !0 : !0;
}
function rh(t, e) {
  var o, r, a;
  if (!t) return;
  const n = (o = e.foreground) != null ? o : "#ffffff", s = Le(t.trueColor);
  if (s) return s;
  if (typeof t.trueColor == "number" && t.trueColor >= 0 && t.trueColor <= 16777215) return gt(t.trueColor, (r = e.trueColorByteOrder) != null ? r : "rgb");
  const i = Le(t.color);
  if (i) return i;
  if (ch(t.colorIndex)) return Ee(t.colorIndex, n, n);
  if (typeof t.color == "number") {
    const c = Number(t.color);
    return Math.abs(c) <= 257 ? Ee(c, n, n) : gt(c, (a = e.trueColorByteOrder) != null ? a : "rgb");
  }
  if (typeof t.colorIndex == "number") return Ee(t.colorIndex, n, n);
}
function ah(t) {
  return Ur(t.colorIndex, t.colorNumber, t.aci) === 0 ? !0 : t.trueColor === void 0 && t.color === 0;
}
function Yr(t, e, n, s = {}) {
  if (!ah(t)) return t;
  const i = He(e, n, { ...s, colorMode: "source" });
  return { ...t, color: i, trueColor: void 0, colorIndex: void 0, colorNumber: void 0 };
}
function ch(t) {
  return typeof t == "number" && Number.isFinite(t) && Math.abs(Math.trunc(t)) >= 1 && Math.abs(Math.trunc(t)) <= 255;
}
function lh(t, e) {
  var n, s;
  if (!(!t || !e))
    return (s = (n = t.layers[e]) != null ? n : t.layers[e.toLowerCase()]) != null ? s : Object.values(t.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
}
function Ur(...t) {
  for (const e of t)
    if (typeof e == "number" && Number.isFinite(e)) return e;
}
function hh(t, e) {
  const n = t;
  for (const s of e) {
    const i = n[s];
    if (typeof i == "number" && Number.isFinite(i)) return i;
  }
}
function ct(t) {
  const e = t.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(e))
    return {
      r: parseInt(e[1] + e[1], 16),
      g: parseInt(e[2] + e[2], 16),
      b: parseInt(e[3] + e[3], 16),
      a: 1
    };
  if (/^#[0-9a-f]{6}$/i.test(e))
    return {
      r: parseInt(e.slice(1, 3), 16),
      g: parseInt(e.slice(3, 5), 16),
      b: parseInt(e.slice(5, 7), 16),
      a: 1
    };
  const n = e.match(/^rgba?\(([^)]+)\)$/i);
  if (n) {
    const s = n[1].split(/[,\s/]+/).filter(Boolean).map((i) => Number(i.replace("%", "")));
    if (s.length >= 3 && s.slice(0, 3).every(Number.isFinite)) {
      const i = /%/.test(n[1]);
      return {
        r: We(i ? s[0] * 2.55 : s[0]),
        g: We(i ? s[1] * 2.55 : s[1]),
        b: We(i ? s[2] * 2.55 : s[2]),
        a: Number.isFinite(s[3]) ? Math.max(0, Math.min(1, s[3])) : 1
      };
    }
  }
}
function Ho(t, e) {
  const n = t.a + e.a * (1 - t.a);
  return n <= 0 ? { r: 0, g: 0, b: 0, a: 0 } : {
    r: (t.r * t.a + e.r * e.a * (1 - t.a)) / n,
    g: (t.g * t.a + e.g * e.a * (1 - t.a)) / n,
    b: (t.b * t.a + e.b * e.a * (1 - t.a)) / n,
    a: n
  };
}
function uh(t, e, n) {
  const s = Math.max(0, Math.min(1, n));
  return {
    r: t.r + (e.r - t.r) * s,
    g: t.g + (e.g - t.g) * s,
    b: t.b + (e.b - t.b) * s,
    a: t.a
  };
}
function bn(t) {
  const e = [t.r, t.g, t.b].map((n) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * e[0] + 0.7152 * e[1] + 0.0722 * e[2];
}
function tn(t, e) {
  const n = bn(t), s = bn(e), i = Math.max(n, s), o = Math.min(n, s);
  return (i + 0.05) / (o + 0.05);
}
function yn(t) {
  const e = We(t.r), n = We(t.g), s = We(t.b);
  return t.a < 0.999 ? `rgba(${e}, ${n}, ${s}, ${xn(t.a)})` : `rgb(${e}, ${n}, ${s})`;
}
function We(t) {
  return Math.max(0, Math.min(255, Math.round(t)));
}
function xn(t) {
  return Math.round(t * 1e3) / 1e3;
}
const fh = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
function Dt(t, e) {
  return {
    a: t.a * e.a + t.c * e.b,
    b: t.b * e.a + t.d * e.b,
    c: t.a * e.c + t.c * e.d,
    d: t.b * e.c + t.d * e.d,
    e: t.a * e.e + t.c * e.f + t.e,
    f: t.b * e.e + t.d * e.f + t.f
  };
}
function Wo(t, e) {
  return { a: 1, b: 0, c: 0, d: 1, e: t, f: e };
}
function zr(t) {
  const e = Math.cos(t), n = Math.sin(t);
  return { a: e, b: n, c: -n, d: e, e: 0, f: 0 };
}
function dh(t, e = t) {
  return { a: t, b: 0, c: 0, d: e, e: 0, f: 0 };
}
function re(t, e) {
  return {
    x: t.x * e.a + t.y * e.c + e.e,
    y: t.x * e.b + t.y * e.d + e.f,
    z: "z" in t ? t.z : void 0
  };
}
function Yo(t, e) {
  if (t)
    return t.map((n) => ({ cmd: n.cmd, points: n.points.map((s) => re(s, e)) }));
}
function Dn(t, e = { x: 0, y: 0 }) {
  var c, l, h, u, f, d;
  const n = (c = t.insertionPoint) != null ? c : { x: 0, y: 0 }, s = t.scale, i = Number(typeof s == "object" && s ? (l = s.x) != null ? l : 1 : (h = t.scaleX) != null ? h : 1), o = Number(typeof s == "object" && s ? (u = s.y) != null ? u : i : (f = t.scaleY) != null ? f : i), r = Number((d = t.rotation) != null ? d : 0);
  let a = Wo(n.x, n.y);
  return a = Dt(a, zr(Number.isFinite(r) ? r : 0)), a = Dt(a, dh(Number.isFinite(i) ? i : 1, Number.isFinite(o) ? o : 1)), a = Dt(a, Wo(-e.x, -e.y)), a;
}
function Ve(t, e) {
  var l, h, u, f;
  const n = { ...t }, s = e.a * e.d - e.b * e.c, i = Math.sqrt(Math.abs(s)), o = Math.hypot(e.a, e.b), r = Math.hypot(e.c, e.d);
  if (t.startPoint && (n.startPoint = re(t.startPoint, e)), t.endPoint && (n.endPoint = re(t.endPoint, e)), t.center && (n.center = re(t.center, e)), t.insertionPoint && (n.insertionPoint = re(t.insertionPoint, e)), t.majorAxisEndPoint) {
    const d = re({ x: 0, y: 0 }, e), m = re(t.majorAxisEndPoint, e);
    n.majorAxisEndPoint = { x: m.x - d.x, y: m.y - d.y, z: m.z };
  }
  t.vertices && (n.vertices = t.vertices.map((d) => ({
    ...re(d, e),
    bulge: d.bulge,
    startWidth: Uo(d.startWidth, i),
    endWidth: Uo(d.endWidth, i)
  }))), t.points && (n.points = t.points.map((d) => re(d, e))), t.controlPoints && (n.controlPoints = t.controlPoints.map((d) => re(d, e))), t.fitPoints && (n.fitPoints = t.fitPoints.map((d) => re(d, e))), t.attribs && (n.attribs = t.attribs.map((d) => Ve(d, e))), t.commands && (n.commands = Yo(t.commands, e)), t.loops && (n.loops = t.loops.map((d) => {
    var m;
    return {
      ...d,
      vertices: (m = d.vertices) == null ? void 0 : m.map((p) => re(p, e)),
      commands: Yo(d.commands, e)
    };
  })), t.hatch && (n.hatch = {
    ...t.hatch,
    segments: t.hatch.segments.map((d) => ({ start: re(d.start, e), end: re(d.end, e) })),
    dots: t.hatch.dots.map((d) => re(d, e))
  }), typeof t.radius == "number" && Number.isFinite(i) && (n.radius = t.radius * i), typeof t.constantWidth == "number" && Number.isFinite(i) && (n.constantWidth = t.constantWidth * i), typeof t.thickness == "number" && Number.isFinite(i) && (n.thickness = t.thickness * i), typeof t.lineTypeScale == "number" && Number.isFinite(i) && (n.lineTypeScale = t.lineTypeScale * i), (t.kind === "text" || /^(TEXT|MTEXT|ATTRIB|ATTDEF|DIMENSION)$/i.test(String((l = t.type) != null ? l : ""))) && (typeof t.textHeight == "number" && Number.isFinite(r) && (n.textHeight = t.textHeight * r), typeof t.height == "number" && Number.isFinite(r) && (n.height = t.height * r), r > 1e-14 && Number.isFinite(o) && (n.xScale = Number((h = t.xScale) != null ? h : 1) * o / r), String(t.type).toUpperCase() === "MTEXT" && typeof t.width == "number" && Number.isFinite(o) && (n.width = t.width * o));
  const a = Math.atan2(e.b, e.a), c = t.kind === "ellipse" || String((u = t.type) != null ? u : "").toUpperCase() === "ELLIPSE";
  return (typeof t.rotation == "number" || t.kind === "text" || t.kind === "insert") && (n.rotation = mh(Number((f = t.rotation) != null ? f : 0) + (Number.isFinite(a) ? a : 0))), Number.isFinite(a) && Math.abs(a) > 1e-14 && (!c && typeof t.startAngle == "number" && (n.startAngle = t.startAngle + a), !c && typeof t.endAngle == "number" && (n.endAngle = t.endAngle + a)), s < 0 && n.vertices && (n.vertices = n.vertices.map((d) => ({ ...d, bulge: typeof d.bulge == "number" ? -d.bulge : void 0 }))), n;
}
function Uo(t, e) {
  return typeof t == "number" && Number.isFinite(e) ? t * e : t;
}
function mh(t) {
  if (!Number.isFinite(t)) return t;
  const e = Math.PI * 2, n = ((t + Math.PI) % e + e) % e - Math.PI;
  return Math.abs(n) <= 1e-12 ? 0 : n;
}
const ph = 16, gh = 96, bh = 0.01;
function Vr(t, e = {}) {
  var i;
  const n = be();
  for (const o of (i = t.pages) != null ? i : [])
    te(n, { x: 0, y: 0 }), te(n, { x: o.width, y: o.height });
  const s = Gr(t, e);
  for (const o of t.entities) gr(n, qr(o, s));
  return br(n);
}
function jr(t, e, n = "auto", s = {}) {
  if (n === "extents") return e;
  const i = yh(t);
  if (!i) return e;
  if (n === "saved-view") return i;
  const o = be(), r = Gr(t, s);
  let a = 0;
  for (const c of t.entities) {
    const l = wh(qr(c, r), i);
    l && (a++, gr(o, l));
  }
  return a === 0 || !Ch(o, i) ? i : br(o);
}
function yh(t) {
  const e = t.savedView;
  if (!e || e.source !== "vport" || e.sceneTransformApplied !== !0 || !_(e.center)) return;
  const n = Number(e.viewHeight), s = Number(e.aspectRatio);
  if (!Number.isFinite(n) || n <= 1e-9 || !Number.isFinite(s) || s <= 1e-9) return;
  const i = n * s;
  return {
    minX: e.center.x - i / 2,
    minY: e.center.y - n / 2,
    maxX: e.center.x + i / 2,
    maxY: e.center.y + n / 2
  };
}
function Gr(t, e) {
  var n, s;
  return {
    document: t,
    maxInsertDepth: Math.max(0, Math.floor((n = e.maxInsertDepth) != null ? n : ph)),
    maxCurveSegments: Math.max(12, Math.floor((s = e.maxCurveSegments) != null ? s : gh))
  };
}
function qr(t, e, n = 0) {
  const s = be();
  return Kr(s, t, e, n), s;
}
function Kr(t, e, n, s) {
  var r, a, c, l, h, u, f, d, m, p, b, g, y, x, v;
  const i = String((r = e.type) != null ? r : "").toUpperCase(), o = (a = e.kind) != null ? a : ut(i);
  if (o === "insert") {
    const w = vh(n.document, (c = e.blockName) != null ? c : e.name);
    if (w && s < n.maxInsertDepth) {
      const C = Dn(e, (l = w.basePoint) != null ? l : { x: 0, y: 0 });
      for (const S of w.entities) Kr(t, Ve(S, C), n, s + 1);
      return;
    }
  }
  if (o === "line")
    _(e.startPoint) && te(t, e.startPoint), _(e.endPoint) && te(t, e.endPoint);
  else if (o === "circle" || o === "arc")
    _(e.center) && Number.isFinite(e.radius) && Ra(t, e.center, Number(e.radius));
  else if (o === "polyline" || o === "solid" || o === "spline")
    for (const w of [...(h = e.vertices) != null ? h : [], ...(u = e.points) != null ? u : [], ...(f = e.controlPoints) != null ? f : [], ...(d = e.fitPoints) != null ? d : []])
      _(w) && te(t, w);
  else if (o === "ellipse") {
    if (_(e.center) && _(e.majorAxisEndPoint))
      for (const w of kn(
        e.center,
        e.majorAxisEndPoint,
        Number((m = e.axisRatio) != null ? m : 1),
        Number((p = e.startAngle) != null ? p : 0),
        Number((b = e.endAngle) != null ? b : Math.PI * 2),
        n.maxCurveSegments
      )) te(t, w);
  } else if (o === "path")
    for (const w of (g = e.commands) != null ? g : []) for (const C of w.points) te(t, C);
  else if (o === "hatch")
    for (const w of (y = e.loops) != null ? y : []) {
      for (const C of (x = w.vertices) != null ? x : []) te(t, C);
      for (const C of (v = w.commands) != null ? v : []) for (const S of C.points) te(t, S);
    }
  else {
    const w = xh(e);
    w && te(t, w);
  }
}
function xh(t) {
  for (const e of ["startPoint", "insertionPoint", "center", "point", "location"]) {
    const n = t[e];
    if (_(n)) return n;
  }
  if (Array.isArray(t.vertices) && _(t.vertices[0])) return t.vertices[0];
  if (Array.isArray(t.commands)) {
    const e = t.commands.find((n) => n.points.length > 0);
    if (e) return e.points[0];
  }
}
function vh(t, e) {
  var n, s;
  if (e)
    return (s = (n = t.blocks[e]) != null ? n : t.blocks[e.toLowerCase()]) != null ? s : Object.values(t.blocks).find((i) => i.name.toLowerCase() === e.toLowerCase());
}
function wh(t, e) {
  if (!fe(t) || !fe(e)) return;
  const n = {
    minX: Math.max(t.minX, e.minX),
    minY: Math.max(t.minY, e.minY),
    maxX: Math.min(t.maxX, e.maxX),
    maxY: Math.min(t.maxY, e.maxY)
  };
  return fe(n) ? n : void 0;
}
function Ch(t, e) {
  if (!fe(t) || !fe(e)) return !1;
  const n = Math.hypot(t.maxX - t.minX, t.maxY - t.minY), s = Math.hypot(e.maxX - e.minX, e.maxY - e.minY);
  return s > 1e-9 && n / s >= bh;
}
const zo = 1e5, Zr = /* @__PURE__ */ new Set(["", "bylayer", "15"]), Fn = /* @__PURE__ */ new Set(["byblock", "14"]), Sh = /* @__PURE__ */ new Set(["continuous", "16"]), Ye = (t) => String(t != null ? t : "").trim().toLowerCase();
function Nh(t) {
  return Fn.has(Ye(t));
}
function Jr(t, e, n) {
  if (!Nh(t.lineType)) return t;
  const s = Qr(e, n);
  return {
    ...t,
    lineType: s || "Continuous",
    lineTypeScale: lt(t.lineTypeScale, 1) * lt(e.lineTypeScale, 1)
  };
}
function Qr(t, e) {
  var i, o, r;
  let n = String((i = t.lineType) != null ? i : "").trim();
  const s = Ye(n);
  return Zr.has(s) ? n = (r = (o = Ah(e, t.layer)) == null ? void 0 : o.lineType) != null ? r : "Continuous" : Fn.has(s) && (n = "Continuous"), n || "Continuous";
}
function vn(t, e) {
  var u, f;
  if (!e) return;
  const n = Qr(t, e), s = Ye(n);
  if (Sh.has(s) || Zr.has(s) || Fn.has(s)) return;
  const i = Th(e, n);
  if (!(i != null && i.pattern.length)) return;
  const o = lt(t.lineTypeScale, lt((u = e.header) == null ? void 0 : u.CELTSCALE, 1)), r = lt((f = e.header) == null ? void 0 : f.LTSCALE, 1) * o, a = kh(i, r), c = a.reduce((d, m) => d + m.length, 0);
  if (!Number.isFinite(c) || c <= 1e-9) return;
  const l = a.some((d) => !d.draw && d.length > 1e-12), h = a.some((d) => d.marker);
  if (!(!l && !h))
    return { name: i.name, segments: Ph(a, l), runs: a, period: c };
}
function mu(t, e, n) {
  return Rn(t, e, n).segments;
}
function Rn(t, e, n, s = zo) {
  const i = t.filter((g) => Number.isFinite(g.x) && Number.isFinite(g.y));
  if (i.length < 2 || n.runs.length === 0) return { segments: [], dots: [] };
  const o = [];
  for (let g = 0; g < i.length - 1; g++) o.push([i[g], i[g + 1]]);
  e && o.push([i[i.length - 1], i[0]]);
  const r = Number.isFinite(s) ? Math.max(1, Math.floor(s)) : zo, a = o.reduce((g, [y, x]) => g + Math.hypot(x.x - y.x, x.y - y.y), 0), l = (n.period > 1e-12 ? a / n.period : Number.POSITIVE_INFINITY) * Math.max(1, n.runs.length);
  if (!Number.isFinite(l) || l > r)
    return { segments: o, dots: [] };
  const h = { segments: [], dots: [] };
  let u = 0, f = n.runs[0].length, d = !0;
  const m = (g) => {
    const y = h.dots[h.dots.length - 1];
    y && Math.hypot(y.x - g.x, y.y - g.y) <= 1e-10 || h.dots.push(g);
  }, p = () => {
    u = (u + 1) % n.runs.length, f = n.runs[u].length, d = !0;
  }, b = (g, y, x, v, w) => {
    var S;
    const C = Mh(g, y, x / w, v / w);
    m(y), C && ((S = h.markers) != null ? S : h.markers = []).push(C);
  };
  for (const [g, y] of o) {
    const x = y.x - g.x, v = y.y - g.y, w = Math.hypot(x, v);
    if (w <= 1e-14) continue;
    let C = 0;
    for (; C < w - 1e-12; ) {
      let S = 0;
      for (; f <= 1e-12 && S < n.runs.length; ) {
        const I = n.runs[u];
        if (d && I.marker) {
          const M = C / w, N = { x: g.x + x * M, y: g.y + v * M };
          Vo(I) ? b(I, N, x, v, w) : m(N);
        }
        p(), S++;
      }
      if (f <= 1e-12) break;
      const D = n.runs[u];
      if (d) {
        if (D.marker) {
          const I = C / w, M = { x: g.x + x * I, y: g.y + v * I };
          Vo(D) ? b(D, M, x, v, w) : m(M);
        }
        d = !1;
      }
      const L = Math.min(f, w - C);
      if (D.draw && L > 1e-12) {
        const I = C / w, M = (C + L) / w;
        h.segments.push([
          { x: g.x + x * I, y: g.y + v * I },
          { x: g.x + x * M, y: g.y + v * M }
        ]);
      }
      C += L, f -= L, f <= 1e-12 && p();
    }
  }
  return h;
}
function kh(t, e) {
  var s;
  const n = [];
  for (const i of t.pattern) {
    const o = Number(i.length), r = Number((s = i.elementTypeFlag) != null ? s : 0) !== 0;
    Number.isFinite(o) && n.push({
      draw: o >= 0,
      length: Math.abs(o) * e,
      marker: o >= 0 && (o === 0 || r),
      element: i,
      globalScale: e
    });
  }
  return n;
}
function ea(t, e) {
  const n = Math.cos(t.angle), s = Math.sin(t.angle);
  return e.polylines.map((i) => i.map((o) => {
    const r = o.x * t.scale, a = o.y * t.scale;
    return {
      x: t.point.x + r * n - a * s,
      y: t.point.y + r * s + a * n
    };
  }));
}
function Vo(t) {
  var e, n;
  return Number((n = (e = t.element) == null ? void 0 : e.elementTypeFlag) != null ? n : 0) !== 0;
}
function Mh(t, e, n, s) {
  var d;
  const i = t.element, o = Number((d = i == null ? void 0 : i.elementTypeFlag) != null ? d : 0);
  if (!i || o === 0) return;
  const r = At(i.offsetX, 0) * t.globalScale, a = At(i.offsetY, 0) * t.globalScale, c = At(i.rotation, 0), l = Math.atan2(s, n), h = {
    x: e.x + n * r - s * a,
    y: e.y + s * r + n * a
  }, u = {
    fallbackPoint: e,
    point: h,
    angle: (o & 1) === 1 ? c : l + c,
    scale: Math.abs(At(i.scale, 1) * t.globalScale),
    fontName: i.fontName
  }, f = Number(i.shapeNumber);
  if ((o & 4) === 4 && Number.isFinite(f))
    return { ...u, kind: "shape", shapeNumber: Math.trunc(f) };
  if ((o & 2) === 2 && i.text)
    return { ...u, kind: "text", text: i.text };
}
function Ph(t, e) {
  if (!e) return [];
  const n = [];
  for (const i of t) {
    if (i.length <= 1e-12) continue;
    const o = n[n.length - 1];
    (o == null ? void 0 : o.draw) === i.draw ? o.length += i.length : n.push({ draw: i.draw, length: i.length });
  }
  const s = [];
  for (const i of n) {
    const o = s.length % 2 === 0;
    i.draw !== o && s.push(1e-9), s.push(i.length);
  }
  return s.length % 2 === 1 && s.push(1e-9), s;
}
function Th(t, e) {
  var i, o, r;
  const n = Ye(e), s = (i = t.lineTypes) != null ? i : {};
  return (r = (o = s[e]) != null ? o : s[n]) != null ? r : Object.values(s).find((a) => Ye(a.name) === n || Ye(a.handle) === n);
}
function Ah(t, e) {
  var n, s;
  if (!(!t || !e))
    return (s = (n = t.layers[e]) != null ? n : t.layers[e.toLowerCase()]) != null ? s : Object.values(t.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
}
function lt(t, e) {
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : e;
}
function At(t, e) {
  const n = Number(t);
  return Number.isFinite(n) ? n : e;
}
const Eh = (t) => Math.abs(t.a - 1) < 1e-12 && Math.abs(t.b) < 1e-12 && Math.abs(t.c) < 1e-12 && Math.abs(t.d - 1) < 1e-12 && Math.abs(t.e) < 1e-9 && Math.abs(t.f) < 1e-9;
function ta(t) {
  var n, s, i, o;
  if (t.metadata.sceneTransformApplied === !0 || ((n = t.savedView) == null ? void 0 : n.sceneTransformApplied) === !1) return t;
  const e = (i = (s = t.savedView) == null ? void 0 : s.sceneTransform) != null ? i : fh;
  return Eh(e) ? t : {
    ...t,
    entities: t.entities.map((r) => Ve(r, e)),
    pages: (o = t.pages) == null ? void 0 : o.map((r) => ({
      ...r,
      entities: r.entities.map((a) => Ve(a, e))
    })),
    metadata: {
      ...t.metadata,
      sceneTransformApplied: !0
    }
  };
}
const Lh = {
  background: "#0b1020",
  foreground: "#ffffff",
  showUnsupportedMarkers: !1,
  showImagePlaceholders: !0,
  showPageBounds: !0,
  minScale: 1e-9,
  maxScale: 1e9,
  wheelZoomFactor: 1.14,
  trueColorByteOrder: "rgb",
  maxInsertDepth: 16,
  fitMode: "auto",
  contrastMode: "adaptive",
  minColorContrast: 2.4,
  maxCurveSegments: 96,
  spatialIndexCellCount: 72,
  maxVerticesPerBatch: 65536,
  textMinPixelHeight: 4,
  maxVisibleTextLabels: 2500,
  powerPreference: "high-performance",
  antialias: !0,
  preserveDrawingBuffer: !1,
  enableSpatialIndex: !0,
  shxGlyphResolver: Xr
};
class jo {
  constructor(e, n = {}) {
    P(this, "canvas");
    P(this, "ctx");
    P(this, "opts");
    P(this, "sourceDocument");
    P(this, "document");
    P(this, "bounds", be());
    P(this, "view", { centerX: 0, centerY: 0, scale: 1 });
    P(this, "fitScale", 1);
    P(this, "dpr", 1);
    P(this, "isDragging", !1);
    P(this, "lastPointer");
    P(this, "resizeObserver");
    P(this, "imageCache", /* @__PURE__ */ new Map());
    P(this, "stats", { total: 0, drawn: 0, skipped: 0, byType: {}, unsupported: {}, renderElapsedMs: 0, backend: "canvas2d" });
    P(this, "onStats");
    P(this, "onViewChange");
    const s = e.getContext("2d");
    if (!s) throw new Error("Canvas 2D context is not available.");
    this.canvas = e, this.ctx = s, this.opts = { ...Lh, ...n }, this.canvas.classList.add("cad-viewer-canvas"), this.bindEvents(), typeof ResizeObserver != "undefined" && (this.resizeObserver = new ResizeObserver(() => this.resize()), this.resizeObserver.observe(e)), this.resize();
  }
  captureCanvas() {
    return this.render(), Pn([this.canvas]);
  }
  destroy() {
    var e;
    (e = this.resizeObserver) == null || e.disconnect();
  }
  clear() {
    this.sourceDocument = void 0, this.document = void 0, this.bounds = be(), this.view = { centerX: 0, centerY: 0, scale: 1 }, this.fitScale = 1, this.render(), this.emitViewChange();
  }
  setDocument(e) {
    this.sourceDocument = e, this.document = ta(e), this.bounds = Vr(this.document, this.boundsOptions()), this.fitToView();
  }
  refreshReferences() {
    this.render(), this.emitViewChange();
  }
  getDocument() {
    return this.document;
  }
  getSourceDocument() {
    return this.sourceDocument;
  }
  setOptions(e) {
    const n = e.fitMode !== void 0 && e.fitMode !== this.opts.fitMode;
    if (Object.assign(this.opts, e), n && this.document) {
      this.fitToView();
      return;
    }
    this.render(), this.emitViewChange();
  }
  getOptions() {
    return { ...this.opts };
  }
  fitToView(e = 0.92, n = this.opts.fitMode) {
    const s = this.document ? jr(this.document, this.bounds, n, this.boundsOptions()) : this.bounds;
    if (!fe(s)) {
      this.view = { centerX: 0, centerY: 0, scale: 1 }, this.fitScale = 1, this.render(), this.emitViewChange();
      return;
    }
    const i = Math.max(1, this.cssWidth), o = Math.max(1, this.cssHeight), r = Math.max(s.maxX - s.minX, 1e-9), a = Math.max(s.maxY - s.minY, 1e-9), c = this.clampScale(Math.min(i / r, o / a) * e);
    this.fitScale = c, this.view = {
      centerX: (s.minX + s.maxX) / 2,
      centerY: (s.minY + s.maxY) / 2,
      scale: c
    }, this.render(), this.emitViewChange();
  }
  resize() {
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    const e = Math.max(1, Math.floor(this.cssWidth * this.dpr)), n = Math.max(1, Math.floor(this.cssHeight * this.dpr));
    (this.canvas.width !== e || this.canvas.height !== n) && (this.canvas.width = e, this.canvas.height = n), this.render(), this.emitViewChange();
  }
  zoom(e, n) {
    if (!Number.isFinite(e) || e <= 0) return;
    const s = n != null ? n : { x: this.cssWidth / 2, y: this.cssHeight / 2 }, i = this.screenToWorld(s);
    this.view.scale = this.clampScale(this.view.scale * e);
    const o = this.screenToWorld(s);
    this.view.centerX += i.x - o.x, this.view.centerY += i.y - o.y, this.render(), this.emitViewChange();
  }
  zoomIn() {
    this.zoom(this.opts.wheelZoomFactor);
  }
  zoomOut() {
    this.zoom(1 / this.opts.wheelZoomFactor);
  }
  panByScreenDelta(e, n) {
    !Number.isFinite(e) || !Number.isFinite(n) || (this.view.centerX -= e / this.view.scale, this.view.centerY += n / this.view.scale, this.render(), this.emitViewChange());
  }
  setViewState(e) {
    if (![e.centerX, e.centerY, e.scale].every(Number.isFinite)) throw new Error("Invalid view state.");
    this.view = { ...e, scale: this.clampScale(e.scale) }, this.render(), this.emitViewChange();
  }
  getViewState() {
    return { ...this.view };
  }
  getBounds() {
    return { ...this.bounds };
  }
  getStats() {
    return Ih(this.stats);
  }
  getZoomRatio() {
    return Math.abs(this.fitScale) < 1e-12 ? 1 : this.view.scale / this.fitScale;
  }
  getZoomPercent() {
    return this.getZoomRatio() * 100;
  }
  worldToScreen(e) {
    return {
      x: this.cssWidth / 2 + (e.x - this.view.centerX) * this.view.scale,
      y: this.cssHeight / 2 - (e.y - this.view.centerY) * this.view.scale
    };
  }
  screenToWorld(e) {
    return {
      x: this.view.centerX + (e.x - this.cssWidth / 2) / this.view.scale,
      y: this.view.centerY - (e.y - this.cssHeight / 2) / this.view.scale
    };
  }
  render() {
    var n, s;
    const e = performance.now();
    if (this.stats = { total: 0, drawn: 0, skipped: 0, byType: {}, unsupported: {}, renderElapsedMs: 0, backend: "canvas2d" }, this.clearCanvas(), this.document) {
      this.opts.showPageBounds && ((n = this.document.pages) != null && n.length) && this.drawPageBounds(this.document);
      for (const i of this.document.entities) this.drawEntityTracked(i, 0);
    }
    return this.stats.renderElapsedMs = performance.now() - e, (s = this.onStats) == null || s.call(this, this.getStats()), this.getStats();
  }
  get cssWidth() {
    return this.canvas.clientWidth || 1;
  }
  get cssHeight() {
    return this.canvas.clientHeight || 1;
  }
  bindEvents() {
    this.canvas.addEventListener("wheel", (n) => {
      n.preventDefault();
      const s = n.deltaY < 0 ? this.opts.wheelZoomFactor : 1 / this.opts.wheelZoomFactor;
      this.zoom(s, { x: n.offsetX, y: n.offsetY });
    }, { passive: !1 }), this.canvas.addEventListener("pointerdown", (n) => {
      this.canvas.setPointerCapture(n.pointerId), this.isDragging = !0, this.lastPointer = { x: n.clientX, y: n.clientY }, this.canvas.classList.add("is-dragging");
    }), this.canvas.addEventListener("pointermove", (n) => {
      !this.isDragging || !this.lastPointer || (this.panByScreenDelta(n.clientX - this.lastPointer.x, n.clientY - this.lastPointer.y), this.lastPointer = { x: n.clientX, y: n.clientY });
    });
    const e = (n) => {
      n && this.canvas.hasPointerCapture(n.pointerId) && this.canvas.releasePointerCapture(n.pointerId), this.isDragging = !1, this.lastPointer = void 0, this.canvas.classList.remove("is-dragging");
    };
    this.canvas.addEventListener("pointerup", e), this.canvas.addEventListener("pointercancel", () => e());
  }
  clearCanvas() {
    const e = this.ctx;
    e.save(), e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.cssWidth, this.cssHeight), e.fillStyle = this.opts.background, e.fillRect(0, 0, this.cssWidth, this.cssHeight), e.restore();
  }
  drawPageBounds(e) {
    var s;
    const n = this.ctx;
    n.save(), n.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), n.strokeStyle = "rgba(148, 163, 184, 0.35)", n.lineWidth = 1, n.setLineDash([8, 6]);
    for (const i of (s = e.pages) != null ? s : []) {
      const o = this.worldToScreen({ x: 0, y: 0 }), r = this.worldToScreen({ x: i.width, y: i.height });
      n.strokeRect(Math.min(o.x, r.x), Math.min(o.y, r.y), Math.abs(r.x - o.x), Math.abs(r.y - o.y));
    }
    n.restore();
  }
  drawEntityTracked(e, n) {
    var o, r;
    this.stats.total++;
    const s = String((o = e.type) != null ? o : "UNKNOWN").toUpperCase();
    this.stats.byType[s] = ((r = this.stats.byType[s]) != null ? r : 0) + 1;
    const i = this.lookupLayer(e.layer);
    if (e.isVisible === !1 || !Wr(i)) {
      this.stats.skipped++;
      return;
    }
    this.drawEntity(e, s, n);
  }
  drawEntity(e, n, s) {
    var o, r;
    switch ((o = e.kind) != null ? o : ut(n)) {
      case "line":
        return this.drawLine(e);
      case "circle":
        return this.drawCircle(e);
      case "arc":
        return this.drawArc(e);
      case "polyline":
        return this.drawPolyline(e);
      case "ellipse":
        return this.drawEllipse(e);
      case "text":
        return this.drawText(e);
      case "point":
        return this.drawPoint(e);
      case "insert":
        return this.drawInsert(e, s);
      case "solid":
        return this.drawSolid(e);
      case "hatch":
        return this.drawHatch(e);
      case "spline":
        return this.drawSpline(e);
      case "path":
        return this.drawPath(e);
      case "image":
        return this.drawImage(e);
      case "viewport":
        return this.markSkipped(n);
      default:
        this.stats.unsupported[n] = ((r = this.stats.unsupported[n]) != null ? r : 0) + 1, this.stats.skipped++, this.opts.showUnsupportedMarkers && this.drawUnsupportedMarker(e);
    }
  }
  beginStyledPath(e, n = !1, s = !0) {
    var h, u;
    const i = this.ctx;
    i.save(), i.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const o = He(e, this.document, { foreground: this.opts.foreground, background: this.opts.background, trueColorByteOrder: this.opts.trueColorByteOrder, contrastMode: this.opts.contrastMode, minColorContrast: this.opts.minColorContrast }), r = (h = gn(e, this.document, { foreground: this.opts.foreground, background: this.opts.background, trueColorByteOrder: this.opts.trueColorByteOrder, contrastMode: this.opts.contrastMode, minColorContrast: this.opts.minColorContrast })) != null ? h : o;
    i.strokeStyle = o, i.fillStyle = n ? r : o, i.globalAlpha = Be(Number((u = e.opacity) != null ? u : 1), 0, 1), i.lineCap = "round", i.lineJoin = "round";
    const a = typeof e.lineweight == "number" && e.lineweight > 0 ? e.lineweight / 30 : 1, c = ar(e) * Math.abs(this.view.scale);
    i.lineWidth = Math.max(1, Math.min(256, Math.max(a, Number.isFinite(c) ? c : 0)));
    const l = s ? vn(e, this.document) : void 0;
    i.setLineDash(l ? l.segments.map((f) => Math.max(0.05, f * this.view.scale)) : []), i.beginPath();
  }
  finishStroke() {
    this.ctx.stroke(), this.ctx.restore(), this.stats.drawn++;
  }
  finishFillStroke(e = !1) {
    e && this.ctx.fill(), this.ctx.stroke(), this.ctx.restore(), this.stats.drawn++;
  }
  drawLine(e) {
    const n = e.startPoint, s = e.endPoint;
    if (!_(n) || !_(s)) return this.markSkipped("LINE");
    this.strokeWorldPolyline(e, [n, s], !1);
  }
  drawCircle(e) {
    const n = e.center, s = Number(e.radius);
    if (!_(n) || !Number.isFinite(s)) return this.markSkipped("CIRCLE");
    this.strokeWorldPolyline(e, dt(q(n), s, 0, Math.PI * 2, !0), !0);
  }
  drawArc(e) {
    const n = e.center, s = Number(e.radius), i = Number(e.startAngle), o = Number(e.endAngle);
    if (!_(n) || !Number.isFinite(s) || !Number.isFinite(i) || !Number.isFinite(o)) return this.markSkipped("ARC");
    this.strokeWorldPolyline(e, dt(q(n), s, i, o, !0), !1);
  }
  drawPolyline(e) {
    var r, a;
    const n = (r = e.vertices) != null ? r : e.points;
    if (!Array.isArray(n) || n.length < 2) return this.markSkipped(String(e.type));
    const s = rr(e), i = [], o = s ? n.length : n.length - 1;
    for (let c = 0; c < o; c++) {
      const l = n[c], h = n[(c + 1) % n.length];
      if (!_(l) || !_(h)) continue;
      const u = yr(l, h, Number((a = l.bulge) != null ? a : 0));
      i.length > 0 && u.shift(), i.push(...u);
    }
    this.strokeWorldPolyline(e, i, s);
  }
  drawEllipse(e) {
    var a, c, l, h, u;
    const n = e.center, s = e.majorAxisEndPoint, i = Number((a = e.axisRatio) != null ? a : 1);
    if (!_(n) || !_(s)) return this.markSkipped("ELLIPSE");
    const o = kn(n, s, i, Number((c = e.startAngle) != null ? c : 0), Number((l = e.endAngle) != null ? l : Math.PI * 2)), r = Math.abs(Number((h = e.endAngle) != null ? h : Math.PI * 2) - Number((u = e.startAngle) != null ? u : 0)) >= Math.PI * 2 - 1e-6;
    this.strokeWorldPolyline(e, o, r);
  }
  drawPoint(e) {
    var i, o, r;
    const n = (r = (o = (i = e.point) != null ? i : e.location) != null ? o : e.center) != null ? r : e.insertionPoint;
    if (!_(n)) return this.markSkipped("POINT");
    const s = this.worldToScreen(n);
    this.beginStyledPath(e), this.ctx.moveTo(s.x - 3, s.y), this.ctx.lineTo(s.x + 3, s.y), this.ctx.moveTo(s.x, s.y - 3), this.ctx.lineTo(s.x, s.y + 3), this.finishStroke();
  }
  drawText(e) {
    var r, a, c, l, h, u, f, d, m, p;
    const s = (Number((r = e.halign) != null ? r : 0) !== 0 || Number((a = e.valign) != null ? a : 0) !== 0) && _(e.endPoint) ? e.endPoint : (l = (c = e.insertionPoint) != null ? c : e.startPoint) != null ? l : e.center, i = String((f = (u = (h = e.rawText) != null ? h : e.text) != null ? u : e.value) != null ? f : ""), o = Number((m = (d = e.textHeight) != null ? d : e.height) != null ? m : 1);
    if (!_(s) || !i || !Number.isFinite(o) || o === 0) return this.markSkipped(String(e.type));
    this.drawTextAt(e, s, o, Number((p = e.rotation) != null ? p : 0));
  }
  drawInsert(e, n) {
    var a, c;
    const s = this.lookupBlock((a = e.blockName) != null ? a : e.name);
    if (s && n < this.opts.maxInsertDepth) {
      const l = Dn(e, (c = s.basePoint) != null ? c : { x: 0, y: 0 });
      for (const h of s.entities) {
        const u = Yr(h, e, this.document, { foreground: this.opts.foreground, background: this.opts.background, trueColorByteOrder: this.opts.trueColorByteOrder, contrastMode: this.opts.contrastMode, minColorContrast: this.opts.minColorContrast }), f = Jr(u, e, this.document);
        this.drawEntityTracked(Ve(f, l), n + 1);
      }
      return;
    }
    const i = e.insertionPoint;
    if (!_(i)) return this.markSkipped("INSERT");
    const o = this.worldToScreen(i);
    this.beginStyledPath(e);
    const r = 5;
    if (this.ctx.rect(o.x - r, o.y - r, r * 2, r * 2), this.finishStroke(), Array.isArray(e.attribs)) for (const l of e.attribs) this.drawText(l);
  }
  drawSolid(e) {
    var i;
    const n = (i = e.vertices) != null ? i : e.points;
    if (!Array.isArray(n) || n.length < 3) return this.markSkipped(String(e.type));
    this.beginStyledPath(e, !0);
    const s = this.worldToScreen(n[0]);
    this.ctx.moveTo(s.x, s.y);
    for (const o of n.slice(1)) {
      if (!_(o)) continue;
      const r = this.worldToScreen(o);
      this.ctx.lineTo(r.x, r.y);
    }
    this.ctx.closePath(), this.finishFillStroke(!0);
  }
  drawHatch(e) {
    var s, i;
    if (e.hatch) {
      if (e.hatch.status !== "ready") return this.markSkipped("HATCH");
      this.beginStyledPath(e, !1, !1);
      for (const o of e.hatch.segments) {
        const r = this.worldToScreen(o.start), a = this.worldToScreen(o.end);
        this.ctx.moveTo(r.x, r.y), this.ctx.lineTo(a.x, a.y);
      }
      this.ctx.stroke();
      for (const o of e.hatch.dots) {
        const r = this.worldToScreen(o);
        this.ctx.beginPath(), this.ctx.arc(r.x, r.y, Math.max(0.5, this.ctx.lineWidth / 2), 0, Math.PI * 2), this.ctx.fill();
      }
      this.ctx.restore(), this.stats.drawn++;
      return;
    }
    const n = e.loops;
    if (!Array.isArray(n) || n.length === 0) return this.markSkipped("HATCH");
    this.beginStyledPath(e, !0);
    for (const o of n)
      if ((s = o.commands) != null && s.length) this.addPathCommands(o.commands);
      else if ((i = o.vertices) != null && i.length) {
        const r = this.worldToScreen(o.vertices[0]);
        this.ctx.moveTo(r.x, r.y);
        for (const a of o.vertices.slice(1)) {
          const c = this.worldToScreen(a);
          this.ctx.lineTo(c.x, c.y);
        }
        this.ctx.closePath();
      }
    this.finishFillStroke(!!gn(e, this.document, { foreground: this.opts.foreground, background: this.opts.background, trueColorByteOrder: this.opts.trueColorByteOrder, contrastMode: this.opts.contrastMode, minColorContrast: this.opts.minColorContrast }));
  }
  drawSpline(e) {
    var s;
    const n = (s = e.fitPoints) != null && s.length ? e.fitPoints : e.controlPoints;
    if (!n || n.length < 2) return this.markSkipped("SPLINE");
    this.strokeWorldPolyline(e, n, !!e.isClosed);
  }
  drawPath(e) {
    var n;
    if (!((n = e.commands) != null && n.length)) return this.markSkipped(String(e.type));
    this.beginStyledPath(e, !!e.fillColor), this.addPathCommands(e.commands), this.finishFillStroke(!!e.fillColor);
  }
  addPathCommands(e) {
    for (const n of e)
      if (n.cmd === "M") {
        const s = this.worldToScreen(n.points[0]);
        this.ctx.moveTo(s.x, s.y);
      } else if (n.cmd === "L") {
        const s = this.worldToScreen(n.points[0]);
        this.ctx.lineTo(s.x, s.y);
      } else if (n.cmd === "C") {
        const [s, i, o] = n.points.map((r) => this.worldToScreen(r));
        this.ctx.bezierCurveTo(s.x, s.y, i.x, i.y, o.x, o.y);
      } else if (n.cmd === "Q") {
        const [s, i] = n.points.map((o) => this.worldToScreen(o));
        this.ctx.quadraticCurveTo(s.x, s.y, i.x, i.y);
      } else n.cmd === "Z" && this.ctx.closePath();
  }
  drawImage(e) {
    var f, d;
    const n = e.insertionPoint;
    if (!_(n)) return this.markSkipped(String(e.type));
    const s = Number((f = e.width) != null ? f : 32), i = Number((d = e.height) != null ? d : 32), o = this.worldToScreen(n), r = this.worldToScreen({ x: n.x + s, y: n.y - i }), a = Math.min(o.x, r.x), c = Math.min(o.y, r.y), l = Math.abs(r.x - o.x), h = Math.abs(r.y - o.y), u = e.imageDataUrl;
    if (u) {
      const m = this.getImage(u);
      if (m.complete && m.naturalWidth > 0) {
        this.ctx.save(), this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), this.ctx.drawImage(m, a, c, l, h), this.ctx.restore(), this.stats.drawn++;
        return;
      }
      m.onload = () => this.render();
    }
    if (!this.opts.showImagePlaceholders) return this.markSkipped(String(e.type));
    this.beginStyledPath(e), this.ctx.rect(a, c, l, h), this.ctx.moveTo(a, c), this.ctx.lineTo(a + l, c + h), this.ctx.moveTo(a + l, c), this.ctx.lineTo(a, c + h), this.finishStroke();
  }
  getImage(e) {
    let n = this.imageCache.get(e);
    return n || (n = new Image(), n.src = e, this.imageCache.set(e, n)), n;
  }
  drawUnsupportedMarker(e) {
    const n = this.entityAnchor(e);
    if (!n) return;
    const s = this.worldToScreen(n);
    this.beginStyledPath(e), this.ctx.moveTo(s.x - 4, s.y - 4), this.ctx.lineTo(s.x + 4, s.y + 4), this.ctx.moveTo(s.x + 4, s.y - 4), this.ctx.lineTo(s.x - 4, s.y + 4), this.finishStroke();
  }
  drawTextAt(e, n, s, i) {
    var h, u, f;
    const o = this.ctx, r = this.worldToScreen(n);
    o.save(), o.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), o.translate(r.x, r.y), o.rotate(-i);
    const a = Number((h = e.generationFlag) != null ? h : 0), c = Number((u = e.xScale) != null ? u : 1);
    o.scale((a & 2 ? -1 : 1) * (Number.isFinite(c) && Math.abs(c) > 1e-9 ? Math.abs(c) : 1), a & 4 ? -1 : 1);
    const l = Math.abs(s) * this.view.scale;
    o.fillStyle = He(e, this.document, { foreground: this.opts.foreground, background: this.opts.background, trueColorByteOrder: this.opts.trueColorByteOrder, contrastMode: this.opts.contrastMode, minColorContrast: this.opts.minColorContrast }), o.globalAlpha = Be(Number((f = e.opacity) != null ? f : 1), 0, 1), pr(o, e, l), o.restore(), this.stats.drawn++;
  }
  strokeWorldPolyline(e, n, s) {
    var a;
    const i = n.filter(_);
    if (i.length < 2) return this.markSkipped(String(e.type));
    const o = vn(e, this.document);
    if (o) {
      const c = Rn(i, s, o), l = [...c.dots];
      this.beginStyledPath(e, !1, !1);
      for (const [h, u] of c.segments) {
        const f = this.worldToScreen(h), d = this.worldToScreen(u);
        this.ctx.moveTo(f.x, f.y), this.ctx.lineTo(d.x, d.y);
      }
      for (const h of (a = c.markers) != null ? a : []) {
        const u = this.resolveLineTypeGlyph(h);
        if (u) {
          Dh(l, h.fallbackPoint);
          for (const f of ea(h, u)) {
            if (f.length < 2) continue;
            const d = this.worldToScreen(f[0]);
            this.ctx.moveTo(d.x, d.y);
            for (const m of f.slice(1)) {
              const p = this.worldToScreen(m);
              this.ctx.lineTo(p.x, p.y);
            }
          }
        }
      }
      if (this.ctx.stroke(), l.length > 0) {
        this.ctx.setLineDash([]), this.ctx.beginPath();
        const h = Math.max(0.5, this.ctx.lineWidth / 2);
        for (const u of l) {
          const f = this.worldToScreen(u);
          this.ctx.moveTo(f.x + h, f.y), this.ctx.arc(f.x, f.y, h, 0, Math.PI * 2);
        }
        this.ctx.fillStyle = this.ctx.strokeStyle, this.ctx.fill();
      }
      this.ctx.restore(), this.stats.drawn++;
      return;
    }
    this.beginStyledPath(e);
    const r = this.worldToScreen(i[0]);
    this.ctx.moveTo(r.x, r.y);
    for (const c of i.slice(1)) {
      const l = this.worldToScreen(c);
      this.ctx.lineTo(l.x, l.y);
    }
    s && this.ctx.closePath(), this.finishStroke();
  }
  resolveLineTypeGlyph(e) {
    var n;
    return e.kind === "shape" ? this.opts.shxGlyphResolver.resolveShape(Number(e.shapeNumber), e.fontName) : this.opts.shxGlyphResolver.resolveText(String((n = e.text) != null ? n : ""), e.fontName);
  }
  markSkipped(e) {
    var n;
    this.stats.skipped++, this.stats.unsupported[e] = (n = this.stats.unsupported[e]) != null ? n : 0;
  }
  entityAnchor(e) {
    for (const n of ["startPoint", "insertionPoint", "center", "point", "location"]) {
      const s = e[n];
      if (_(s)) return q(s);
    }
    if (Array.isArray(e.vertices) && _(e.vertices[0])) return q(e.vertices[0]);
    if (Array.isArray(e.commands) && e.commands.length) {
      const n = e.commands.find((s) => s.points.length > 0);
      if (n) return q(n.points[0]);
    }
  }
  lookupLayer(e) {
    var n, s;
    if (!(!this.document || !e))
      return (s = (n = this.document.layers[e]) != null ? n : this.document.layers[e.toLowerCase()]) != null ? s : Object.values(this.document.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
  }
  lookupBlock(e) {
    var n, s;
    if (!(!this.document || !e))
      return (s = (n = this.document.blocks[e]) != null ? n : this.document.blocks[e.toLowerCase()]) != null ? s : Object.values(this.document.blocks).find((i) => i.name.toLowerCase() === e.toLowerCase());
  }
  clampScale(e) {
    return Math.min(this.opts.maxScale, Math.max(this.opts.minScale, e));
  }
  boundsOptions() {
    return { maxInsertDepth: this.opts.maxInsertDepth, maxCurveSegments: this.opts.maxCurveSegments };
  }
  emitViewChange() {
    var e;
    (e = this.onViewChange) == null || e.call(this, {
      view: this.getViewState(),
      fitScale: this.fitScale,
      zoomRatio: this.getZoomRatio(),
      zoomPercent: this.getZoomPercent(),
      bounds: this.getBounds()
    });
  }
}
function Ih(t) {
  return {
    total: t.total,
    drawn: t.drawn,
    skipped: t.skipped,
    byType: { ...t.byType },
    unsupported: { ...t.unsupported },
    renderElapsedMs: t.renderElapsedMs,
    backend: t.backend,
    primitiveCount: t.primitiveCount,
    visiblePrimitiveCount: t.visiblePrimitiveCount,
    culledPrimitiveCount: t.culledPrimitiveCount,
    gpuMemoryBytes: t.gpuMemoryBytes,
    buildElapsedMs: t.buildElapsedMs
  };
}
function Dh(t, e) {
  const n = Math.max(1, Math.abs(e.x), Math.abs(e.y)), s = Math.max(1e-9, n * 1e-12), i = t.findIndex((o) => Math.hypot(o.x - e.x, o.y - e.y) <= s);
  i >= 0 && t.splice(i, 1);
}
const Fh = {
  background: "#0b1020",
  foreground: "#ffffff",
  showUnsupportedMarkers: !1,
  showImagePlaceholders: !0,
  showPageBounds: !0,
  minScale: 1e-9,
  maxScale: 1e9,
  wheelZoomFactor: 1.14,
  trueColorByteOrder: "rgb",
  maxInsertDepth: 16,
  fitMode: "auto",
  contrastMode: "adaptive",
  minColorContrast: 2.4,
  maxCurveSegments: 96,
  spatialIndexCellCount: 72,
  maxVerticesPerBatch: 65536,
  textMinPixelHeight: 4,
  maxVisibleTextLabels: 2500,
  powerPreference: "high-performance",
  antialias: !0,
  preserveDrawingBuffer: !1,
  enableSpatialIndex: !0,
  shxGlyphResolver: Xr
};
class Go {
  constructor(e, n = {}) {
    P(this, "canvas");
    P(this, "backend", "webgl");
    P(this, "gl");
    P(this, "program");
    P(this, "eventController", new AbortController());
    P(this, "imageCache", /* @__PURE__ */ new Map());
    P(this, "opts");
    P(this, "sourceDocument");
    P(this, "document");
    P(this, "bounds", be());
    P(this, "view", { centerX: 0, centerY: 0, scale: 1 });
    P(this, "fitScale", 1);
    P(this, "dpr", 1);
    P(this, "isDragging", !1);
    P(this, "lastPointer");
    P(this, "resizeObserver");
    P(this, "overlayCanvas");
    P(this, "overlayCtx");
    P(this, "scene");
    P(this, "stats", { total: 0, drawn: 0, skipped: 0, byType: {}, unsupported: {}, renderElapsedMs: 0, backend: "webgl", primitiveCount: 0, visiblePrimitiveCount: 0, culledPrimitiveCount: 0, gpuMemoryBytes: 0, buildElapsedMs: 0 });
    P(this, "rafHandle", 0);
    P(this, "onStats");
    P(this, "onViewChange");
    const s = Rh(e, n);
    if (!s) throw new Error('WebGL is not available. Use renderer: "canvas2d" to force the Canvas2D fallback.');
    this.canvas = e, this.gl = s, this.program = Bh(s), this.opts = { ...Fh, ...n }, this.canvas.classList.add("cad-viewer-canvas", "cad-viewer-webgl-canvas"), this.createOverlayCanvas(), this.bindEvents(), typeof ResizeObserver != "undefined" && (this.resizeObserver = new ResizeObserver(() => this.resize()), this.resizeObserver.observe(e)), this.resize();
  }
  captureCanvas() {
    return this.render(), Pn([this.canvas, ...this.overlayCanvas ? [this.overlayCanvas] : []]);
  }
  static isSupported() {
    return na();
  }
  destroy() {
    var e, n;
    this.eventController.abort(), (e = this.resizeObserver) == null || e.disconnect(), this.cancelScheduledRender(), this.disposeScene(), (n = this.overlayCanvas) == null || n.remove();
  }
  clear() {
    this.sourceDocument = void 0, this.document = void 0, this.bounds = be(), this.view = { centerX: 0, centerY: 0, scale: 1 }, this.fitScale = 1, this.disposeScene(), this.render(), this.emitViewChange();
  }
  setDocument(e) {
    this.sourceDocument = e, this.document = ta(e), this.bounds = Vr(this.document, this.boundsOptions()), this.disposeScene();
    const n = Jo(this.document, this.opts, this.bounds);
    this.scene = Ko(this.gl, n), this.stats = tr(this.scene, 0), this.fitToView();
  }
  refreshReferences() {
    if (!this.document) return;
    const e = { ...this.view }, n = this.fitScale;
    this.disposeScene();
    const s = Jo(this.document, this.opts, this.bounds);
    this.scene = Ko(this.gl, s), this.stats = tr(this.scene, 0), this.view = e, this.fitScale = n, this.render(), this.emitViewChange();
  }
  getDocument() {
    return this.document;
  }
  getSourceDocument() {
    return this.sourceDocument;
  }
  setOptions(e) {
    var i, o;
    const n = Wh(this.opts, e), s = e.fitMode !== void 0 && e.fitMode !== this.opts.fitMode;
    if (this.opts = { ...this.opts, ...e }, n && ((i = this.sourceDocument) != null ? i : this.document)) {
      this.setDocument((o = this.sourceDocument) != null ? o : this.document);
      return;
    }
    if (s && this.document) {
      this.fitToView();
      return;
    }
    this.render(), this.emitViewChange();
  }
  getOptions() {
    return { ...this.opts };
  }
  fitToView(e = 0.92, n = this.opts.fitMode) {
    const s = this.document ? jr(this.document, this.bounds, n, this.boundsOptions()) : this.bounds;
    if (!fe(s)) {
      this.view = { centerX: 0, centerY: 0, scale: 1 }, this.fitScale = 1, this.render(), this.emitViewChange();
      return;
    }
    const i = Math.max(1, this.cssWidth), o = Math.max(1, this.cssHeight), r = Math.max(s.maxX - s.minX, 1e-9), a = Math.max(s.maxY - s.minY, 1e-9), c = this.clampScale(Math.min(i / r, o / a) * e);
    this.fitScale = c, this.view = {
      centerX: (s.minX + s.maxX) / 2,
      centerY: (s.minY + s.maxY) / 2,
      scale: c
    }, this.render(), this.emitViewChange();
  }
  resize() {
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    const e = Math.max(1, Math.floor(this.cssWidth * this.dpr)), n = Math.max(1, Math.floor(this.cssHeight * this.dpr));
    (this.canvas.width !== e || this.canvas.height !== n) && (this.canvas.width = e, this.canvas.height = n), this.resizeOverlay(e, n), this.render(), this.emitViewChange();
  }
  zoom(e, n) {
    if (!Number.isFinite(e) || e <= 0) return;
    const s = n != null ? n : { x: this.cssWidth / 2, y: this.cssHeight / 2 }, i = this.screenToWorld(s);
    this.view.scale = this.clampScale(this.view.scale * e);
    const o = this.screenToWorld(s);
    this.view.centerX += i.x - o.x, this.view.centerY += i.y - o.y, this.scheduleRender(), this.emitViewChange();
  }
  zoomIn() {
    this.zoom(this.opts.wheelZoomFactor);
  }
  zoomOut() {
    this.zoom(1 / this.opts.wheelZoomFactor);
  }
  panByScreenDelta(e, n) {
    !Number.isFinite(e) || !Number.isFinite(n) || (this.view.centerX -= e / this.view.scale, this.view.centerY += n / this.view.scale, this.scheduleRender(), this.emitViewChange());
  }
  setViewState(e) {
    if (![e.centerX, e.centerY, e.scale].every(Number.isFinite)) throw new Error("Invalid view state.");
    this.view = { ...e, scale: this.clampScale(e.scale) }, this.render(), this.emitViewChange();
  }
  getViewState() {
    return { ...this.view };
  }
  getBounds() {
    return { ...this.bounds };
  }
  getStats() {
    return Yh(this.stats);
  }
  getZoomRatio() {
    return Math.abs(this.fitScale) < 1e-12 ? 1 : this.view.scale / this.fitScale;
  }
  getZoomPercent() {
    return this.getZoomRatio() * 100;
  }
  worldToScreen(e) {
    return {
      x: this.cssWidth / 2 + (e.x - this.view.centerX) * this.view.scale,
      y: this.cssHeight / 2 - (e.y - this.view.centerY) * this.view.scale
    };
  }
  screenToWorld(e) {
    return {
      x: this.view.centerX + (e.x - this.cssWidth / 2) / this.view.scale,
      y: this.view.centerY - (e.y - this.cssHeight / 2) / this.view.scale
    };
  }
  render() {
    return this.cancelScheduledRender(), this.renderNow();
  }
  renderNow() {
    var l;
    const e = performance.now(), n = this.gl;
    n.viewport(0, 0, this.canvas.width, this.canvas.height);
    const s = wn(this.opts.background, [11, 16, 32, 255]);
    n.clearColor(s[0] / 255, s[1] / 255, s[2] / 255, s[3] / 255), n.clear(n.COLOR_BUFFER_BIT), n.disable(n.DEPTH_TEST), n.enable(n.BLEND), n.blendFunc(n.SRC_ALPHA, n.ONE_MINUS_SRC_ALPHA);
    let i = 0, o = 0;
    const r = this.scene, a = this.visibleWorldBounds();
    if (r) {
      n.useProgram(this.program.program), n.uniform2f(this.program.uViewCenter, this.view.centerX - r.origin.x, this.view.centerY - r.origin.y), n.uniform1f(this.program.uScale, this.view.scale * this.dpr), n.uniform2f(this.program.uViewport, this.canvas.width, this.canvas.height), n.uniform1f(this.program.uPointSize, Math.max(1, this.dpr));
      const h = this.drawBatches(r.lineBatches, n.LINES, a);
      i += h.visible, o += h.culled;
      const u = this.drawBatches(r.triangleBatches, n.TRIANGLES, a);
      i += u.visible, o += u.culled;
      const f = this.drawBatches(r.lineTypePointBatches, n.POINTS, a);
      i += f.visible, o += f.culled, n.uniform1f(this.program.uPointSize, Math.max(2, Math.min(12, 4 * this.dpr)));
      const d = this.drawBatches(r.pointBatches, n.POINTS, a);
      i += d.visible, o += d.culled;
    }
    this.renderOverlay(a);
    const c = performance.now() - e;
    return this.stats = r ? { ...r.stats, renderElapsedMs: c, backend: "webgl", primitiveCount: r.primitiveCount, visiblePrimitiveCount: i, culledPrimitiveCount: o, gpuMemoryBytes: r.gpuMemoryBytes, buildElapsedMs: r.buildElapsedMs } : { total: 0, drawn: 0, skipped: 0, byType: {}, unsupported: {}, renderElapsedMs: c, backend: "webgl", primitiveCount: 0, visiblePrimitiveCount: 0, culledPrimitiveCount: 0, gpuMemoryBytes: 0, buildElapsedMs: 0 }, (l = this.onStats) == null || l.call(this, this.getStats()), this.getStats();
  }
  drawBatches(e, n, s) {
    const i = this.gl;
    let o = 0, r = 0;
    for (const a of e) {
      if (!sn(a.bounds, s)) {
        r += a.primitiveCount;
        continue;
      }
      i.bindBuffer(i.ARRAY_BUFFER, a.positionBuffer), i.enableVertexAttribArray(this.program.aPosition), i.vertexAttribPointer(this.program.aPosition, 2, i.FLOAT, !1, 0, 0), i.bindBuffer(i.ARRAY_BUFFER, a.colorBuffer), i.enableVertexAttribArray(this.program.aColor), i.vertexAttribPointer(this.program.aColor, 4, i.UNSIGNED_BYTE, !0, 0, 0), i.drawArrays(n, 0, a.vertexCount), o += a.primitiveCount;
    }
    return { visible: o, culled: r };
  }
  scheduleRender() {
    this.rafHandle || (this.rafHandle = window.requestAnimationFrame(() => {
      this.rafHandle = 0, this.renderNow();
    }));
  }
  cancelScheduledRender() {
    this.rafHandle && (window.cancelAnimationFrame(this.rafHandle), this.rafHandle = 0);
  }
  renderOverlay(e) {
    var i, o;
    const n = this.overlayCtx, s = this.overlayCanvas;
    !n || !s || (n.save(), n.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), n.clearRect(0, 0, this.cssWidth, this.cssHeight), this.opts.showPageBounds && ((o = (i = this.document) == null ? void 0 : i.pages) != null && o.length) && this.drawPageBoundsOverlay(n), this.scene && (this.drawImagesOverlay(n, this.scene.imageItems, e), this.drawTextOverlay(n, this.scene.textItems, e)), n.restore());
  }
  drawPageBoundsOverlay(e) {
    var n, s;
    if ((s = (n = this.document) == null ? void 0 : n.pages) != null && s.length) {
      e.save(), e.strokeStyle = "rgba(148, 163, 184, 0.34)", e.lineWidth = 1, e.setLineDash([8, 6]);
      for (const i of this.document.pages) {
        const o = this.worldToScreen({ x: 0, y: 0 }), r = this.worldToScreen({ x: i.width, y: i.height });
        e.strokeRect(Math.min(o.x, r.x), Math.min(o.y, r.y), Math.abs(r.x - o.x), Math.abs(r.y - o.y));
      }
      e.restore();
    }
  }
  drawTextOverlay(e, n, s) {
    const i = this.opts.maxVisibleTextLabels;
    let o = 0;
    for (const r of n) {
      if (o >= i) break;
      const a = Math.abs(r.height) * this.view.scale;
      if (a * r.maxRunHeight < this.opts.textMinPixelHeight || (r.layout || (r.layout = fr(e, r.entity, r.parsed), r.bounds = Fa(r.entity, r.layout, r.point)), !sn(r.bounds, s))) continue;
      const c = this.worldToScreen(r.point);
      e.save(), e.translate(c.x, c.y), e.rotate(-r.rotation), e.scale((r.generationFlag & 2 ? -1 : 1) * r.xScale, r.generationFlag & 4 ? -1 : 1), e.fillStyle = r.color, e.globalAlpha = r.opacity, pr(e, r.entity, a, r.layout), e.restore(), o++;
    }
  }
  drawImagesOverlay(e, n, s) {
    for (const i of n) {
      if (!sn(i.bounds, s)) continue;
      const o = this.worldToScreen(i.point), r = this.worldToScreen({ x: i.point.x + i.width, y: i.point.y - i.height }), a = Math.min(o.x, r.x), c = Math.min(o.y, r.y), l = Math.abs(r.x - o.x), h = Math.abs(r.y - o.y);
      if (!(l < 1 || h < 1)) {
        if (i.source) {
          const u = this.getImage(i.source);
          if (u.complete && u.naturalWidth > 0) {
            e.save(), e.globalAlpha = i.opacity, e.drawImage(u, a, c, l, h), e.restore();
            continue;
          }
          u.onload = () => this.scheduleRender();
        }
        this.opts.showImagePlaceholders && (e.save(), e.strokeStyle = i.color, e.globalAlpha = i.opacity, e.lineWidth = 1, e.strokeRect(a, c, l, h), e.beginPath(), e.moveTo(a, c), e.lineTo(a + l, c + h), e.moveTo(a + l, c), e.lineTo(a, c + h), e.stroke(), e.restore());
      }
    }
  }
  getImage(e) {
    let n = this.imageCache.get(e);
    return n || (n = new Image(), n.src = e, this.imageCache.set(e, n)), n;
  }
  createOverlayCanvas() {
    const e = this.canvas.parentElement;
    if (!e || typeof document == "undefined") return;
    window.getComputedStyle(e).position === "static" && (e.style.position = "relative");
    const s = document.createElement("canvas");
    s.className = "cad-viewer-text-overlay", s.setAttribute("aria-hidden", "true"), s.style.position = "absolute", s.style.inset = "0", s.style.width = "100%", s.style.height = "100%", s.style.pointerEvents = "none", s.style.zIndex = "1";
    const i = s.getContext("2d");
    i && (e.appendChild(s), this.overlayCanvas = s, this.overlayCtx = i);
  }
  resizeOverlay(e, n) {
    this.overlayCanvas && (this.overlayCanvas.width !== e || this.overlayCanvas.height !== n) && (this.overlayCanvas.width = e, this.overlayCanvas.height = n);
  }
  bindEvents() {
    const e = this.eventController.signal;
    this.canvas.addEventListener("wheel", (s) => {
      s.preventDefault();
      const i = s.deltaY < 0 ? this.opts.wheelZoomFactor : 1 / this.opts.wheelZoomFactor;
      this.zoom(i, { x: s.offsetX, y: s.offsetY });
    }, { passive: !1, signal: e }), this.canvas.addEventListener("pointerdown", (s) => {
      this.canvas.setPointerCapture(s.pointerId), this.isDragging = !0, this.lastPointer = { x: s.clientX, y: s.clientY }, this.canvas.classList.add("is-dragging");
    }, { signal: e }), this.canvas.addEventListener("pointermove", (s) => {
      !this.isDragging || !this.lastPointer || (this.panByScreenDelta(s.clientX - this.lastPointer.x, s.clientY - this.lastPointer.y), this.lastPointer = { x: s.clientX, y: s.clientY });
    }, { signal: e });
    const n = (s) => {
      s && this.canvas.hasPointerCapture(s.pointerId) && this.canvas.releasePointerCapture(s.pointerId), this.isDragging = !1, this.lastPointer = void 0, this.canvas.classList.remove("is-dragging");
    };
    this.canvas.addEventListener("pointerup", n, { signal: e }), this.canvas.addEventListener("pointercancel", () => n(), { signal: e }), this.canvas.addEventListener("webglcontextlost", (s) => {
      s.preventDefault(), this.cancelScheduledRender();
    }, { signal: e });
  }
  visibleWorldBounds() {
    const e = this.cssWidth / Math.max(this.view.scale, 1e-12) / 2, n = this.cssHeight / Math.max(this.view.scale, 1e-12) / 2;
    return {
      minX: this.view.centerX - e,
      maxX: this.view.centerX + e,
      minY: this.view.centerY - n,
      maxY: this.view.centerY + n
    };
  }
  get cssWidth() {
    return this.canvas.clientWidth || 1;
  }
  get cssHeight() {
    return this.canvas.clientHeight || 1;
  }
  clampScale(e) {
    return Math.min(this.opts.maxScale, Math.max(this.opts.minScale, e));
  }
  boundsOptions() {
    return { maxInsertDepth: this.opts.maxInsertDepth, maxCurveSegments: this.opts.maxCurveSegments };
  }
  disposeScene() {
    if (!this.scene) return;
    const e = this.gl;
    for (const n of [...this.scene.lineBatches, ...this.scene.triangleBatches, ...this.scene.lineTypePointBatches, ...this.scene.pointBatches])
      e.deleteBuffer(n.positionBuffer), e.deleteBuffer(n.colorBuffer);
    this.scene = void 0;
  }
  emitViewChange() {
    var e;
    (e = this.onViewChange) == null || e.call(this, {
      view: this.getViewState(),
      fitScale: this.fitScale,
      zoomRatio: this.getZoomRatio(),
      zoomPercent: this.getZoomPercent(),
      bounds: this.getBounds()
    });
  }
}
function na() {
  var e, n;
  if (typeof document == "undefined") return !1;
  const t = document.createElement("canvas");
  return !!((n = (e = t.getContext("webgl2")) != null ? e : t.getContext("webgl")) != null ? n : t.getContext("experimental-webgl"));
}
function Rh(t, e) {
  var s, i, o, r, a, c;
  const n = {
    alpha: !1,
    antialias: (s = e.antialias) != null ? s : !0,
    depth: !1,
    stencil: !1,
    preserveDrawingBuffer: (i = e.preserveDrawingBuffer) != null ? i : !1,
    powerPreference: (o = e.powerPreference) != null ? o : "high-performance"
  };
  return (c = (a = (r = t.getContext("webgl2", n)) != null ? r : t.getContext("webgl", n)) != null ? a : t.getContext("experimental-webgl", n)) != null ? c : void 0;
}
function Bh(t) {
  var h;
  const e = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_viewCenter;
    uniform float u_scale;
    uniform vec2 u_viewport;
    uniform float u_pointSize;
    varying vec4 v_color;
    void main() {
      vec2 screen = vec2(
        u_viewport.x * 0.5 + (a_position.x - u_viewCenter.x) * u_scale,
        u_viewport.y * 0.5 - (a_position.y - u_viewCenter.y) * u_scale
      );
      vec2 clip = vec2(screen.x / u_viewport.x * 2.0 - 1.0, 1.0 - screen.y / u_viewport.y * 2.0);
      gl_Position = vec4(clip, 0.0, 1.0);
      gl_PointSize = u_pointSize;
      v_color = a_color;
    }
  `, n = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
  `, s = qo(t, t.VERTEX_SHADER, e), i = qo(t, t.FRAGMENT_SHADER, n), o = t.createProgram();
  if (!o) throw new Error("Failed to create WebGL program.");
  if (t.attachShader(o, s), t.attachShader(o, i), t.linkProgram(o), !t.getProgramParameter(o, t.LINK_STATUS)) {
    const u = (h = t.getProgramInfoLog(o)) != null ? h : "Unknown WebGL program link error.";
    throw t.deleteProgram(o), new Error(u);
  }
  t.deleteShader(s), t.deleteShader(i);
  const r = t.getUniformLocation(o, "u_viewCenter"), a = t.getUniformLocation(o, "u_scale"), c = t.getUniformLocation(o, "u_viewport"), l = t.getUniformLocation(o, "u_pointSize");
  if (!r || !a || !c || !l) throw new Error("Failed to resolve WebGL shader uniforms.");
  return {
    program: o,
    aPosition: t.getAttribLocation(o, "a_position"),
    aColor: t.getAttribLocation(o, "a_color"),
    uViewCenter: r,
    uScale: a,
    uViewport: c,
    uPointSize: l
  };
}
function qo(t, e, n) {
  var i;
  const s = t.createShader(e);
  if (!s) throw new Error("Failed to create WebGL shader.");
  if (t.shaderSource(s, n), t.compileShader(s), !t.getShaderParameter(s, t.COMPILE_STATUS)) {
    const o = (i = t.getShaderInfoLog(s)) != null ? i : "Unknown WebGL shader compile error.";
    throw t.deleteShader(s), new Error(o);
  }
  return s;
}
function Ko(t, e) {
  let n = 0;
  const s = (c) => c.map((l) => {
    const h = Zo(t, l.positions), u = Zo(t, l.colors), f = l.positions.byteLength + l.colors.byteLength;
    return n += f, {
      positionBuffer: h,
      colorBuffer: u,
      vertexCount: l.positions.length / 2,
      primitiveCount: l.primitiveCount,
      bounds: l.bounds,
      gpuBytes: f
    };
  }), i = s(e.lineBatches), o = s(e.triangleBatches), r = s(e.lineTypePointBatches), a = s(e.pointBatches);
  return {
    origin: e.origin,
    lineBatches: i,
    triangleBatches: o,
    lineTypePointBatches: r,
    pointBatches: a,
    textItems: e.textItems,
    imageItems: e.imageItems,
    stats: e.stats,
    primitiveCount: e.primitiveCount,
    gpuMemoryBytes: n,
    buildElapsedMs: e.buildElapsedMs
  };
}
function Zo(t, e) {
  const n = t.createBuffer();
  if (!n) throw new Error("Failed to create WebGL buffer.");
  return t.bindBuffer(t.ARRAY_BUFFER, n), t.bufferData(t.ARRAY_BUFFER, e, t.STATIC_DRAW), n;
}
function Jo(t, e, n) {
  const s = performance.now(), i = fe(n) ? { x: (n.minX + n.maxX) / 2, y: (n.minY + n.maxY) / 2 } : { x: 0, y: 0 }, o = new Oh(t, e, n, i);
  for (const a of t.entities) o.addEntityTracked(a, 0);
  const r = o.finalize();
  return r.buildElapsedMs = performance.now() - s, r;
}
class Oh {
  constructor(e, n, s, i) {
    P(this, "document");
    P(this, "opts");
    P(this, "bounds");
    P(this, "origin");
    P(this, "lineBuckets", /* @__PURE__ */ new Map());
    P(this, "triangleBuckets", /* @__PURE__ */ new Map());
    P(this, "lineTypePointBuckets", /* @__PURE__ */ new Map());
    P(this, "pointBuckets", /* @__PURE__ */ new Map());
    P(this, "textItems", []);
    P(this, "imageItems", []);
    P(this, "stats", { total: 0, drawn: 0, skipped: 0, byType: {}, unsupported: {}, backend: "webgl", primitiveCount: 0, visiblePrimitiveCount: 0, culledPrimitiveCount: 0, gpuMemoryBytes: 0, buildElapsedMs: 0 });
    P(this, "tileSize");
    P(this, "maxVerticesPerBatch");
    P(this, "primitiveCount", 0);
    this.document = e, this.opts = n, this.bounds = s, this.origin = i;
    const o = fe(s) ? Math.max(s.maxX - s.minX, s.maxY - s.minY, 1e-9) : 1;
    this.tileSize = n.enableSpatialIndex ? o / Math.max(8, n.spatialIndexCellCount) : Number.POSITIVE_INFINITY, this.maxVerticesPerBatch = Math.max(4096, Math.floor(n.maxVerticesPerBatch));
  }
  addEntityTracked(e, n) {
    var o, r;
    this.stats.total++;
    const s = String((o = e.type) != null ? o : "UNKNOWN").toUpperCase();
    this.stats.byType[s] = ((r = this.stats.byType[s]) != null ? r : 0) + 1;
    const i = this.lookupLayer(e.layer);
    if (e.isVisible === !1 || !Wr(i)) {
      this.stats.skipped++;
      return;
    }
    this.addEntity(e, s, n);
  }
  finalize() {
    const e = Et(this.lineBuckets, this.maxVerticesPerBatch), n = Et(this.triangleBuckets, this.maxVerticesPerBatch), s = Et(this.lineTypePointBuckets, this.maxVerticesPerBatch), i = Et(this.pointBuckets, this.maxVerticesPerBatch);
    return this.stats.primitiveCount = this.primitiveCount, {
      origin: this.origin,
      lineBatches: e,
      triangleBatches: n,
      lineTypePointBatches: s,
      pointBatches: i,
      textItems: this.textItems,
      imageItems: this.imageItems,
      stats: this.stats,
      primitiveCount: this.primitiveCount,
      buildElapsedMs: 0
    };
  }
  addEntity(e, n, s) {
    var o, r;
    switch ((o = e.kind) != null ? o : ut(n)) {
      case "line":
        return this.addLineEntity(e);
      case "circle":
        return this.addCircleEntity(e);
      case "arc":
        return this.addArcEntity(e);
      case "polyline":
        return this.addPolylineEntity(e);
      case "ellipse":
        return this.addEllipseEntity(e);
      case "text":
        return this.addTextEntity(e);
      case "point":
        return this.addPointEntity(e);
      case "insert":
        return this.addInsertEntity(e, s);
      case "solid":
        return this.addSolidEntity(e);
      case "hatch":
        return this.addHatchEntity(e);
      case "spline":
        return this.addSplineEntity(e);
      case "path":
        return this.addPathEntity(e);
      case "image":
        return this.addImageEntity(e);
      case "viewport":
        return this.markSkipped(n);
      default:
        this.stats.unsupported[n] = ((r = this.stats.unsupported[n]) != null ? r : 0) + 1, this.stats.skipped++, this.opts.showUnsupportedMarkers && this.addUnsupportedMarker(e);
    }
  }
  addLineEntity(e) {
    if (!_(e.startPoint) || !_(e.endPoint)) return this.markSkipped("LINE");
    this.addPolyline([e.startPoint, e.endPoint], !1, this.strokeBytes(e), e), this.stats.drawn++;
  }
  addCircleEntity(e) {
    const n = e.center, s = Number(e.radius);
    if (!_(n) || !Number.isFinite(s)) return this.markSkipped("CIRCLE");
    const i = Math.max(16, Math.min(this.opts.maxCurveSegments, Math.ceil(Math.sqrt(Math.abs(s)) * 12))), o = dt(n, s, 0, Math.PI * 2, !0, i);
    this.addPolyline(o, !0, this.strokeBytes(e), e), this.stats.drawn++;
  }
  addArcEntity(e) {
    const n = e.center, s = Number(e.radius), i = Number(e.startAngle), o = Number(e.endAngle);
    if (!_(n) || !Number.isFinite(s) || !Number.isFinite(i) || !Number.isFinite(o)) return this.markSkipped("ARC");
    this.addPolyline(dt(n, s, i, o, !0, this.opts.maxCurveSegments), !1, this.strokeBytes(e), e), this.stats.drawn++;
  }
  addPolylineEntity(e) {
    var r, a;
    const n = (r = e.vertices) != null ? r : e.points;
    if (!Array.isArray(n) || n.length < 2) return this.markSkipped(String(e.type));
    const s = rr(e), i = [], o = s ? n.length : n.length - 1;
    for (let c = 0; c < o; c++) {
      const l = n[c], h = n[(c + 1) % n.length];
      if (!_(l) || !_(h)) continue;
      const u = yr(l, h, Number((a = l.bulge) != null ? a : 0), Math.max(4, Math.min(24, this.opts.maxCurveSegments / 4)));
      i.length > 0 && u.shift(), i.push(...u);
    }
    if (i.length < 2) return this.markSkipped(String(e.type));
    this.addPolyline(i, s, this.strokeBytes(e), e), this.stats.drawn++;
  }
  addEllipseEntity(e) {
    var i, o, r, a, c;
    if (!_(e.center) || !_(e.majorAxisEndPoint)) return this.markSkipped("ELLIPSE");
    const n = kn(e.center, e.majorAxisEndPoint, Number((i = e.axisRatio) != null ? i : 1), Number((o = e.startAngle) != null ? o : 0), Number((r = e.endAngle) != null ? r : Math.PI * 2), this.opts.maxCurveSegments), s = Math.abs(Number((a = e.endAngle) != null ? a : Math.PI * 2) - Number((c = e.startAngle) != null ? c : 0)) >= Math.PI * 2 - 1e-6;
    this.addPolyline(n, s, this.strokeBytes(e), e), this.stats.drawn++;
  }
  addTextEntity(e) {
    var d, m, p, b, g, y, x, v, w, C, S, D, L;
    const n = Number((d = e.halign) != null ? d : 0), s = Number((m = e.valign) != null ? m : 0), o = (n !== 0 || s !== 0) && _(e.endPoint) ? e.endPoint : (b = (p = e.insertionPoint) != null ? p : e.startPoint) != null ? b : e.center, r = Number((y = (g = e.textHeight) != null ? g : e.height) != null ? y : 1), a = String(e.type).toUpperCase() === "MTEXT", c = Nn(String((w = (v = (x = e.rawText) != null ? x : e.text) != null ? v : e.value) != null ? w : ""), a, r, e.fontFamily, a ? e.textStyleWidthFactor : 1), l = c.text;
    if (!_(o) || !l || !Number.isFinite(r) || r === 0) return this.markSkipped(String(e.type));
    const h = q(o), u = Number((C = e.xScale) != null ? C : 1), f = Number.isFinite(u) && Math.abs(u) > 1e-9 ? Math.abs(u) : 1;
    this.textItems.push({
      point: h,
      text: l,
      entity: e,
      parsed: c,
      height: r,
      maxRunHeight: c.paragraphs.reduce((I, M) => M.runs.reduce((N, A) => Math.max(N, A.style.height), I), 1),
      rotation: Number((S = e.rotation) != null ? S : 0),
      xScale: f,
      generationFlag: Number((D = e.generationFlag) != null ? D : 0),
      halign: n,
      valign: s,
      color: He(e, this.document, this.colorOptions()),
      opacity: Be(Number((L = e.opacity) != null ? L : 1), 0, 1),
      // The overlay measures the complete layout before its first culling pass.
      bounds: { minX: h.x, minY: h.y, maxX: h.x, maxY: h.y }
    }), this.stats.drawn++;
  }
  addPointEntity(e) {
    var s, i, o;
    const n = (o = (i = (s = e.point) != null ? s : e.location) != null ? i : e.center) != null ? o : e.insertionPoint;
    if (!_(n)) return this.markSkipped("POINT");
    this.addPoint(n, this.strokeBytes(e)), this.stats.drawn++;
  }
  addInsertEntity(e, n) {
    var o, r;
    const s = this.lookupBlock((o = e.blockName) != null ? o : e.name);
    if (s && n < this.opts.maxInsertDepth) {
      const a = Dn(e, (r = s.basePoint) != null ? r : { x: 0, y: 0 });
      for (const c of s.entities) {
        const l = Yr(c, e, this.document, this.colorOptions()), h = Jr(l, e, this.document);
        this.addEntityTracked(Ve(h, a), n + 1);
      }
      return;
    }
    const i = e.insertionPoint;
    if (!_(i)) return this.markSkipped("INSERT");
    if (this.addPoint(i, this.strokeBytes(e)), Array.isArray(e.attribs)) for (const a of e.attribs) this.addTextEntity(a);
    this.stats.drawn++;
  }
  addSolidEntity(e) {
    var o, r;
    const n = (o = e.vertices) != null ? o : e.points;
    if (!Array.isArray(n) || n.length < 3) return this.markSkipped(String(e.type));
    const s = n.filter(_).map(q);
    if (s.length < 3) return this.markSkipped(String(e.type));
    const i = (r = this.fillBytes(e)) != null ? r : this.strokeBytes(e);
    this.addTriangleFan(s, i), this.addPolyline(s, !0, this.strokeBytes(e), e), this.stats.drawn++;
  }
  addHatchEntity(e) {
    var r, a;
    if (e.hatch) {
      if (e.hatch.status !== "ready") return this.markSkipped("HATCH");
      const c = this.strokeBytes(e);
      for (const l of e.hatch.segments) this.addPolyline([q(l.start), q(l.end)], !1, c);
      for (const l of e.hatch.dots) this.addLineTypePoint(q(l), c);
      this.stats.drawn++;
      return;
    }
    const n = e.loops;
    if (!Array.isArray(n) || n.length === 0) return this.markSkipped("HATCH");
    const s = this.strokeBytes(e), i = this.fillBytes(e);
    let o = !1;
    for (const c of n) {
      const l = (r = c.commands) != null && r.length ? Qo(c.commands, this.opts.maxCurveSegments) : ((a = c.vertices) != null ? a : []).filter(_).map(q);
      l.length < 2 || (this.addPolyline(l, !0, s, e), i && l.length >= 3 && this.addTriangleFan(l, i), o = !0);
    }
    if (!o) return this.markSkipped("HATCH");
    this.stats.drawn++;
  }
  addSplineEntity(e) {
    var s;
    const n = (s = e.fitPoints) != null && s.length ? e.fitPoints : e.controlPoints;
    if (!n || n.length < 2) return this.markSkipped("SPLINE");
    this.addPolyline(n.filter(_).map(q), !!e.isClosed, this.strokeBytes(e), e), this.stats.drawn++;
  }
  addPathEntity(e) {
    var i;
    if (!((i = e.commands) != null && i.length)) return this.markSkipped(String(e.type));
    const n = Qo(e.commands, this.opts.maxCurveSegments);
    if (n.length < 2) return this.markSkipped(String(e.type));
    this.addPolyline(n, !1, this.strokeBytes(e), e);
    const s = this.fillBytes(e);
    s && n.length >= 3 && this.addTriangleFan(n, s), this.stats.drawn++;
  }
  addImageEntity(e) {
    var a, c, l, h;
    const n = e.insertionPoint;
    if (!_(n)) return this.markSkipped(String(e.type));
    const s = Number((a = e.width) != null ? a : 32), i = Number((c = e.height) != null ? c : 32);
    if (!Number.isFinite(s) || !Number.isFinite(i)) return this.markSkipped(String(e.type));
    const o = q(n), r = nn([o, { x: o.x + s, y: o.y - i }]);
    this.imageItems.push({ point: o, width: s, height: i, source: (l = e.imageDataUrl) != null ? l : e.imageSource, color: He(e, this.document, this.colorOptions()), opacity: Be(Number((h = e.opacity) != null ? h : 1), 0, 1), bounds: r }), this.stats.drawn++;
  }
  addUnsupportedMarker(e) {
    const n = Xh(e);
    n && this.addPoint(n, this.strokeBytes(e));
  }
  addPolyline(e, n, s, i) {
    var c;
    const o = e.filter(_).map(q);
    if (o.length < 2 || (n && sa(o[0], o[o.length - 1]) && o.pop(), o.length < 2)) return;
    const r = i ? ar(i) : 0, a = i ? vn(i, this.document) : void 0;
    if (a) {
      const l = Rn(o, n, a), h = [...l.dots];
      for (const [u, f] of l.segments)
        this.addSegment(u, f, s), r > 1e-9 && this.addWideSegment(u, f, r, s, !0);
      for (const u of (c = l.markers) != null ? c : []) {
        const f = this.resolveLineTypeGlyph(u);
        if (!f) continue;
        Hh(h, u.fallbackPoint);
        let d = !1;
        for (const m of ea(u, f))
          for (let p = 0; p < m.length - 1; p++)
            this.addSegment(m[p], m[p + 1], s), d = !0;
        d || h.push(u.point);
      }
      for (const u of h) this.addLineTypePoint(u, s);
      return;
    }
    for (let l = 0; l < o.length - 1; l++) this.addSegment(o[l], o[l + 1], s);
    n && this.addSegment(o[o.length - 1], o[0], s), r > 1e-9 && this.addWidePolyline(o, n, r, s);
  }
  addWidePolyline(e, n, s, i) {
    for (let o = 0; o < e.length - 1; o++) this.addWideSegment(e[o], e[o + 1], s, i, !1);
    n && this.addWideSegment(e[e.length - 1], e[0], s, i, !1);
    for (const o of e) this.addWideDisc(o, s / 2, i);
  }
  addWideSegment(e, n, s, i, o) {
    const r = n.x - e.x, a = n.y - e.y, c = Math.hypot(r, a);
    if (!Number.isFinite(c) || c <= 1e-14) return;
    const l = Math.abs(s) / 2, h = -a / c * l, u = r / c * l;
    this.addTriangleFan([
      { x: e.x + h, y: e.y + u },
      { x: n.x + h, y: n.y + u },
      { x: n.x - h, y: n.y - u },
      { x: e.x - h, y: e.y - u }
    ], i), o && (this.addWideDisc(e, l, i), this.addWideDisc(n, l, i));
  }
  addWideDisc(e, n, s) {
    if (!Number.isFinite(n) || n <= 1e-9) return;
    const i = [], o = 8;
    for (let r = 0; r < o; r++) {
      const a = r / o * Math.PI * 2;
      i.push({ x: e.x + Math.cos(a) * n, y: e.y + Math.sin(a) * n });
    }
    this.addTriangleFan([e, ...i, i[0]], s);
  }
  addSegment(e, n, s) {
    if (!_(e) || !_(n) || Math.hypot(e.x - n.x, e.y - n.y) <= 1e-14) return;
    const i = this.batchFor(this.lineBuckets, nn([e, n]));
    Ae(i, e, s, this.origin), Ae(i, n, s, this.origin), i.primitiveCount++, this.primitiveCount++;
  }
  addPoint(e, n) {
    const s = this.batchFor(this.pointBuckets, er(e));
    Ae(s, e, n, this.origin), s.primitiveCount++, this.primitiveCount++;
  }
  addLineTypePoint(e, n) {
    const s = this.batchFor(this.lineTypePointBuckets, er(e));
    Ae(s, e, n, this.origin), s.primitiveCount++, this.primitiveCount++;
  }
  resolveLineTypeGlyph(e) {
    var n;
    return e.kind === "shape" ? this.opts.shxGlyphResolver.resolveShape(Number(e.shapeNumber), e.fontName) : this.opts.shxGlyphResolver.resolveText(String((n = e.text) != null ? n : ""), e.fontName);
  }
  addTriangleFan(e, n) {
    const s = e.filter(_).map(q);
    if (s.length < 3) return;
    const i = nn(s), o = this.batchFor(this.triangleBuckets, i);
    for (let r = 1; r < s.length - 1; r++)
      Ae(o, s[0], n, this.origin), Ae(o, s[r], n, this.origin), Ae(o, s[r + 1], n, this.origin), o.primitiveCount++, this.primitiveCount++;
  }
  batchFor(e, n) {
    const s = this.bucketKey(n);
    let i = e.get(s);
    return i || (i = _h(), e.set(s, i)), te(i.bounds, { x: n.minX, y: n.minY }), te(i.bounds, { x: n.maxX, y: n.maxY }), i;
  }
  bucketKey(e) {
    if (!Number.isFinite(this.tileSize)) return "all";
    const n = (e.minX + e.maxX) / 2, s = (e.minY + e.maxY) / 2, i = Math.floor((n - this.bounds.minX) / this.tileSize), o = Math.floor((s - this.bounds.minY) / this.tileSize);
    return `${i}:${o}`;
  }
  strokeBytes(e) {
    var n;
    return wn(He(e, this.document, this.colorOptions()), [255, 255, 255, 255], Be(Number((n = e.opacity) != null ? n : 1), 0, 1));
  }
  fillBytes(e) {
    var s;
    const n = gn(e, this.document, this.colorOptions());
    return n ? wn(n, [255, 255, 255, 255], Be(Number((s = e.opacity) != null ? s : 1), 0, 1)) : void 0;
  }
  colorOptions() {
    return { foreground: this.opts.foreground, background: this.opts.background, trueColorByteOrder: this.opts.trueColorByteOrder, contrastMode: this.opts.contrastMode, minColorContrast: this.opts.minColorContrast };
  }
  markSkipped(e) {
    var n;
    this.stats.skipped++, this.stats.unsupported[e] = (n = this.stats.unsupported[e]) != null ? n : 0;
  }
  lookupLayer(e) {
    var n, s;
    if (e)
      return (s = (n = this.document.layers[e]) != null ? n : this.document.layers[e.toLowerCase()]) != null ? s : Object.values(this.document.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
  }
  lookupBlock(e) {
    var n, s;
    if (e)
      return (s = (n = this.document.blocks[e]) != null ? n : this.document.blocks[e.toLowerCase()]) != null ? s : Object.values(this.document.blocks).find((i) => i.name.toLowerCase() === e.toLowerCase());
  }
}
function _h() {
  return { positions: [], colors: [], bounds: be(), primitiveCount: 0 };
}
function Ae(t, e, n, s) {
  t.positions.push(e.x - s.x, e.y - s.y), t.colors.push(n[0], n[1], n[2], n[3]);
}
function Et(t, e) {
  const n = [];
  for (const s of t.values()) {
    const i = s.positions.length / 2;
    if (i <= 0 || !fe(s.bounds)) continue;
    if (i <= e) {
      n.push({ positions: new Float32Array(s.positions), colors: new Uint8Array(s.colors), bounds: { ...s.bounds }, primitiveCount: s.primitiveCount });
      continue;
    }
    const o = $h(s), r = Math.max(o, Math.floor(e / o) * o);
    for (let a = 0; a < i; a += r) {
      const c = Math.min(i, a + r), l = s.positions.slice(a * 2, c * 2), h = s.colors.slice(a * 4, c * 4), u = be();
      for (let f = 0; f < l.length; f += 2) te(u, { x: l[f], y: l[f + 1] });
      n.push({ positions: new Float32Array(l), colors: new Uint8Array(h), bounds: { ...s.bounds }, primitiveCount: Math.floor((c - a) / o) });
    }
  }
  return n;
}
function $h(t) {
  const e = t.positions.length / 2;
  return e === t.primitiveCount ? 1 : e === t.primitiveCount * 3 ? 3 : 2;
}
function Qo(t, e) {
  const n = [];
  let s, i;
  const o = (r) => {
    (!n.length || Math.hypot(n[n.length - 1].x - r.x, n[n.length - 1].y - r.y) > 1e-12) && n.push(q(r)), s = q(r);
  };
  for (const r of t)
    if (r.cmd === "M")
      s = q(r.points[0]), i = s, o(s);
    else if (r.cmd === "L")
      o(r.points[0]);
    else if (r.cmd === "Q" && s && r.points.length >= 2) {
      const a = s, [c, l] = r.points, h = Math.max(4, Math.min(e, 24));
      for (let u = 1; u <= h; u++) {
        const f = u / h, d = 1 - f;
        o({ x: d * d * a.x + 2 * d * f * c.x + f * f * l.x, y: d * d * a.y + 2 * d * f * c.y + f * f * l.y });
      }
    } else if (r.cmd === "C" && s && r.points.length >= 3) {
      const a = s, [c, l, h] = r.points, u = Math.max(6, Math.min(e, 32));
      for (let f = 1; f <= u; f++) {
        const d = f / u, m = 1 - d;
        o({
          x: m ** 3 * a.x + 3 * m * m * d * c.x + 3 * m * d * d * l.x + d ** 3 * h.x,
          y: m ** 3 * a.y + 3 * m * m * d * c.y + 3 * m * d * d * l.y + d ** 3 * h.y
        });
      }
    } else r.cmd === "Z" && i && o(i);
  return n;
}
function Xh(t) {
  for (const e of ["startPoint", "insertionPoint", "center", "point", "location"]) {
    const n = t[e];
    if (_(n)) return q(n);
  }
  if (Array.isArray(t.vertices) && _(t.vertices[0])) return q(t.vertices[0]);
  if (Array.isArray(t.commands) && t.commands.length) {
    const e = t.commands.find((n) => n.points.length > 0);
    if (e) return q(e.points[0]);
  }
}
function nn(t) {
  const e = be();
  for (const n of t) te(e, n);
  return e;
}
function sa(t, e) {
  const n = Math.max(1, Math.abs(t.x), Math.abs(t.y), Math.abs(e.x), Math.abs(e.y));
  return Math.hypot(t.x - e.x, t.y - e.y) <= Math.max(1e-9, n * 1e-12);
}
function Hh(t, e) {
  const n = t.findIndex((s) => sa(s, e));
  n >= 0 && t.splice(n, 1);
}
function er(t) {
  return { minX: t.x, minY: t.y, maxX: t.x, maxY: t.y };
}
function sn(t, e) {
  return t.minX <= e.maxX && t.maxX >= e.minX && t.minY <= e.maxY && t.maxY >= e.minY;
}
function Wh(t, e) {
  return e.trueColorByteOrder !== void 0 && e.trueColorByteOrder !== t.trueColorByteOrder || e.contrastMode !== void 0 && e.contrastMode !== t.contrastMode || e.minColorContrast !== void 0 && e.minColorContrast !== t.minColorContrast || e.foreground !== void 0 && e.foreground !== t.foreground || e.background !== void 0 && e.background !== t.background || e.maxInsertDepth !== void 0 && e.maxInsertDepth !== t.maxInsertDepth || e.maxCurveSegments !== void 0 && e.maxCurveSegments !== t.maxCurveSegments || e.spatialIndexCellCount !== void 0 && e.spatialIndexCellCount !== t.spatialIndexCellCount || e.maxVerticesPerBatch !== void 0 && e.maxVerticesPerBatch !== t.maxVerticesPerBatch || e.enableSpatialIndex !== void 0 && e.enableSpatialIndex !== t.enableSpatialIndex || e.shxGlyphResolver !== void 0 && e.shxGlyphResolver !== t.shxGlyphResolver;
}
function tr(t, e) {
  return { ...t.stats, renderElapsedMs: e, backend: "webgl", primitiveCount: t.primitiveCount, visiblePrimitiveCount: 0, culledPrimitiveCount: 0, gpuMemoryBytes: t.gpuMemoryBytes, buildElapsedMs: t.buildElapsedMs };
}
function Yh(t) {
  return {
    total: t.total,
    drawn: t.drawn,
    skipped: t.skipped,
    byType: { ...t.byType },
    unsupported: { ...t.unsupported },
    renderElapsedMs: t.renderElapsedMs,
    backend: t.backend,
    primitiveCount: t.primitiveCount,
    visiblePrimitiveCount: t.visiblePrimitiveCount,
    culledPrimitiveCount: t.culledPrimitiveCount,
    gpuMemoryBytes: t.gpuMemoryBytes,
    buildElapsedMs: t.buildElapsedMs
  };
}
function wn(t, e, n = 1) {
  const s = t.trim().toLowerCase();
  let i;
  if (/^#[0-9a-f]{3}$/i.test(s))
    i = [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16), 255];
  else if (/^#[0-9a-f]{6}$/i.test(s))
    i = [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 255];
  else {
    const r = s.match(/^rgba?\(([^)]+)\)$/i);
    if (r) {
      const a = r[1].split(/[\s,\/]+/).filter(Boolean), c = a.slice(0, 3).some((h) => h.includes("%")), l = a.map((h) => Number(h.replace("%", "")));
      l.length >= 3 && l.slice(0, 3).every(Number.isFinite) && (i = [nt(c ? l[0] * 2.55 : l[0]), nt(c ? l[1] * 2.55 : l[1]), nt(c ? l[2] * 2.55 : l[2]), nt((Number.isFinite(l[3]) ? l[3] : 1) * 255)]);
    }
  }
  const o = i != null ? i : e;
  return [o[0], o[1], o[2], nt(o[3] * n)];
}
function nt(t) {
  return Math.max(0, Math.min(255, Math.round(t)));
}
class Uh {
  constructor(e = {}) {
    P(this, "canvas");
    P(this, "renderer");
    P(this, "registry");
    P(this, "nativeHost");
    P(this, "options");
    P(this, "referenceRegistry", new Zl());
    P(this, "shxGlyphResolver");
    P(this, "externalShxGlyphResolver");
    P(this, "lastResult");
    P(this, "activeNativeLoader");
    var n, s, i, o, r, a;
    if (this.options = { autoFit: !0, colorMode: "source", ...e }, this.externalShxGlyphResolver = (n = e.canvasOptions) == null ? void 0 : n.shxGlyphResolver, this.shxGlyphResolver = {
      resolveShape: (c, l) => {
        var h, u;
        return (u = this.referenceRegistry.resolveShape(c, l)) != null ? u : (h = this.externalShxGlyphResolver) == null ? void 0 : h.resolveShape(c, l);
      },
      resolveText: (c, l) => {
        var h, u;
        return (u = this.referenceRegistry.resolveText(c, l)) != null ? u : (h = this.externalShxGlyphResolver) == null ? void 0 : h.resolveText(c, l);
      }
    }, this.registry = (s = e.registry) != null ? s : Yc(e), e.loaders) for (const c of e.loaders) this.registry.register(c);
    if (this.canvas = (i = e.canvas) != null ? i : document.createElement("canvas"), this.canvas.classList.add("cad-viewer-canvas"), e.container)
      e.container.classList.add("cad-viewer-container"), e.canvas || (this.canvas.style.width = "100%", this.canvas.style.height = "100%", this.canvas.style.display = "block", e.container.appendChild(this.canvas)), this.nativeHost = (o = e.nativeHost) != null ? o : document.createElement("div"), this.nativeHost.classList.add("cad-viewer-native-host"), e.nativeHost || e.container.appendChild(this.nativeHost);
    else if (e.nativeHost)
      this.nativeHost = e.nativeHost, this.nativeHost.classList.add("cad-viewer-native-host");
    else if ((r = e.canvas) != null && r.parentElement) {
      e.canvas.parentElement.classList.add("cad-viewer-container");
      const c = document.createElement("div");
      c.classList.add("cad-viewer-native-host"), e.canvas.parentElement.appendChild(c), this.nativeHost = c;
    }
    this.renderer = zh((a = e.renderer) != null ? a : "auto", this.canvas, {
      ...e.canvasOptions,
      shxGlyphResolver: this.shxGlyphResolver
    }), this.renderer.onStats = (c) => {
      var l, h;
      return (h = (l = this.options).onRenderStats) == null ? void 0 : h.call(l, c);
    }, this.renderer.onViewChange = (c) => {
      var l, h;
      return (h = (l = this.options).onViewChange) == null ? void 0 : h.call(l, c);
    };
  }
  registerLoader(e) {
    return this.registry.register(e), this;
  }
  async loadFile(e, n = {}) {
    var s, i;
    return (i = (s = this.options).onLoadStart) == null || i.call(s, e), this.loadThroughRegistry({ file: e, fileName: e.name }, n, e.name);
  }
  async loadBuffer(e, n, s = {}) {
    var i, o;
    return (o = (i = this.options).onLoadStart) == null || o.call(i, e), this.loadThroughRegistry({ buffer: e, fileName: n }, s, n);
  }
  async load(e, n = {}) {
    var s, i, o, r;
    return (i = (s = this.options).onLoadStart) == null || i.call(s, e), this.loadThroughRegistry(e, n, (r = e.fileName) != null ? r : (o = e.file) == null ? void 0 : o.name);
  }
  async addReference(e) {
    var n, s;
    try {
      const i = await this.referenceRegistry.add(e);
      return this.refreshCurrentReferences(), i;
    } catch (i) {
      const o = sr(i);
      throw (s = (n = this.options).onError) == null || s.call(n, o), o;
    }
  }
  async addReferenceFile(e) {
    return this.addReference({ file: e, fileName: e.name });
  }
  async addReferenceBuffer(e, n) {
    return this.addReference({ buffer: e, fileName: n });
  }
  removeReference(e) {
    const n = this.referenceRegistry.remove(e);
    return n && this.refreshCurrentReferences(), n;
  }
  clearReferences() {
    this.referenceRegistry.clear(), this.refreshCurrentReferences();
  }
  getReferenceState() {
    return this.referenceRegistry.getState();
  }
  getMissingReferences() {
    return this.getReferenceState().missing;
  }
  getLoadedReferences() {
    return this.getReferenceState().loaded;
  }
  setDocument(e, n) {
    var i, o;
    this.deactivateNativeRenderer(), this.activateDocumentReferences(e);
    const s = {
      document: e,
      raw: e.raw,
      bytes: 0,
      elapsedMs: 0,
      format: e.format,
      warnings: e.warnings,
      summary: et(e),
      fileName: n
    };
    return this.renderer.setDocument(this.createRenderDocument(e)), this.options.autoFit || this.renderer.render(), this.lastResult = s, (o = (i = this.options).onLoad) == null || o.call(i, s), s;
  }
  fit(e) {
    var n, s;
    this.activeNativeLoader ? (s = (n = this.activeNativeLoader).fit) == null || s.call(n) : this.renderer.fitToView(0.92, e);
  }
  zoomIn() {
    var e, n;
    this.activeNativeLoader ? (n = (e = this.activeNativeLoader).zoomIn) == null || n.call(e) : this.renderer.zoomIn();
  }
  zoomOut() {
    var e, n;
    this.activeNativeLoader ? (n = (e = this.activeNativeLoader).zoomOut) == null || n.call(e) : this.renderer.zoomOut();
  }
  resize() {
    var e, n;
    this.activeNativeLoader ? (n = (e = this.activeNativeLoader).resize) == null || n.call(e) : this.renderer.resize();
  }
  /**
   * Switches the active viewer between authored colors and a fixed plot color.
   * The parsed document is never rewritten. Existing pan/zoom state is retained.
   */
  setColorMode(e, n = this.options.monochromeColor) {
    const s = e === "monochrome" ? "monochrome" : "source", i = nr(n);
    s === this.getColorMode() && i === this.getMonochromeColor() || (this.options.colorMode = s, this.options.monochromeColor = i, this.refreshColorPolicy());
  }
  getColorMode() {
    return this.options.colorMode === "monochrome" ? "monochrome" : "source";
  }
  getMonochromeColor() {
    return nr(this.options.monochromeColor);
  }
  setCanvasOptions(e) {
    var n, s, i, o;
    this.options.canvasOptions = { ...(n = this.options.canvasOptions) != null ? n : {}, ...e }, e.shxGlyphResolver && (this.externalShxGlyphResolver = e.shxGlyphResolver), this.renderer.setOptions({ ...e, shxGlyphResolver: this.shxGlyphResolver }), this.activeNativeLoader && ((o = (i = this.activeNativeLoader).setNativeOptions) == null || o.call(i, {
      ...this.mergeLoadOptions({}),
      dwfBackground: (s = e.background) != null ? s : this.options.dwfBackground
    }));
  }
  async preloadDwg(e = {}) {
    const n = this.registry.list().find((s) => s.id === "dwg");
    if (!(n != null && n.preload)) throw new Error("The registered DWG loader does not support preload().");
    return n.preload(this.mergeLoadOptions(e));
  }
  clear() {
    this.lastResult = void 0, this.deactivateNativeRenderer(), this.renderer.clear(), this.referenceRegistry.setDocument(void 0), this.emitReferenceState();
  }
  destroy() {
    var e, n, s;
    this.deactivateNativeRenderer();
    for (const i of this.registry.list()) {
      const o = i;
      (e = o.terminateWorker) == null || e.call(o), (n = o.unmount) == null || n.call(o), (s = o.destroy) == null || s.call(o);
    }
    this.referenceRegistry.clear(), this.renderer.destroy();
  }
  getLoadResult() {
    return this.lastResult;
  }
  getDocument() {
    var e;
    return this.activeNativeLoader ? (e = this.lastResult) == null ? void 0 : e.document : this.renderer.getDocument();
  }
  getSourceDocument() {
    var e;
    return (e = this.lastResult) == null ? void 0 : e.document;
  }
  /** Returns a fresh BOM derived from the parser-owned WCS document, or undefined before a file is loaded. */
  getBom(e = {}) {
    const n = this.getSourceDocument();
    return n ? Vc(n, e) : void 0;
  }
  getZoomPercent() {
    return this.activeNativeLoader ? 100 : this.renderer.getZoomPercent();
  }
  isNativeRendererActive() {
    return !!this.activeNativeLoader;
  }
  /** Captures the current view, including text overlays, without changing source data or pan/zoom. */
  async captureCanvas() {
    if (!this.lastResult) throw new Error("No CAD document is loaded.");
    if (this.activeNativeLoader) {
      if (!this.activeNativeLoader.captureCanvas) throw new Error("The native loader does not support capture.");
      return this.activeNativeLoader.captureCanvas();
    }
    return this.renderer.captureCanvas();
  }
  async loadThroughRegistry(e, n, s) {
    var i, o;
    try {
      const r = this.mergeLoadOptions(n);
      on(r.signal);
      const a = await this.registry.detect(e), c = { ...e, buffer: a.bytes };
      if (eh(a.loader))
        return await this.applyNativeLoadResult(a.loader, c, r, s);
      const l = await a.loader.load(c, r);
      return this.applyLoadResult(l, s);
    } catch (r) {
      const a = sr(r);
      throw (o = (i = this.options).onError) == null || o.call(i, a), a;
    }
  }
  applyLoadResult(e, n) {
    var i, o, r, a;
    this.deactivateNativeRenderer(), (o = (i = this.options).onLoadProgress) == null || o.call(i, { phase: "render", format: e.format, message: "Rendering normalized CAD scene…", percent: 96 }), this.activateDocumentReferences(e.document), e.warnings = e.document.warnings, this.renderer.setDocument(this.createRenderDocument(e.document)), this.options.autoFit || this.renderer.render();
    const s = {
      ...e,
      fileName: n,
      summary: et(e.document)
    };
    return this.lastResult = s, (a = (r = this.options).onLoad) == null || a.call(r, s), s;
  }
  async applyNativeLoadResult(e, n, s, i) {
    var o, r, a;
    if (!this.nativeHost)
      throw new Error("Native DWF rendering requires CadViewerOptions.container, nativeHost, or a canvas parent element.");
    on(s.signal), this.renderer.clear(), (o = this.activeNativeLoader) == null || o.unmount(), this.activeNativeLoader = e, this.canvas.style.display = "none", this.nativeHost.classList.add("is-active");
    try {
      const c = await e.mount(n, this.nativeHost, s);
      on(s.signal), this.activateDocumentReferences(c.document), c.warnings = c.document.warnings;
      const l = {
        ...c,
        fileName: i,
        summary: et(c.document)
      };
      return this.lastResult = l, this.emitNativeRenderStats(c), (a = (r = this.options).onLoad) == null || a.call(r, l), l;
    } catch (c) {
      throw this.deactivateNativeRenderer(), c;
    }
  }
  deactivateNativeRenderer() {
    var e, n;
    if (!this.activeNativeLoader && !((e = this.nativeHost) != null && e.classList.contains("is-active"))) {
      this.canvas.style.display = "";
      return;
    }
    (n = this.activeNativeLoader) == null || n.unmount(), this.activeNativeLoader = void 0, this.nativeHost && (this.nativeHost.classList.remove("is-active"), this.nativeHost.replaceChildren()), this.canvas.style.display = "";
  }
  emitNativeRenderStats(e) {
    var r, a, c, l, h, u, f;
    const n = e.document.metadata, s = Number((c = (a = (r = n.nativeRenderStats) == null ? void 0 : r.commands) != null ? a : e.document.entities.length) != null ? c : 0), o = String((h = (l = n.nativeRenderStats) == null ? void 0 : l.backend) != null ? h : "webgl").includes("webgl") ? "webgl" : "canvas2d";
    (f = (u = this.options).onRenderStats) == null || f.call(u, {
      total: s,
      drawn: s,
      skipped: 0,
      byType: et(e.document).byType,
      unsupported: {},
      renderElapsedMs: e.elapsedMs,
      backend: o,
      primitiveCount: s,
      visiblePrimitiveCount: s,
      culledPrimitiveCount: 0,
      gpuMemoryBytes: void 0,
      buildElapsedMs: e.elapsedMs
    });
  }
  mergeLoadOptions(e) {
    const n = this.options.onProgress, s = e.onProgress;
    return {
      ...this.options,
      ...e,
      onProgress: (i) => {
        var o, r;
        (r = (o = this.options).onLoadProgress) == null || r.call(o, i), n == null || n(i), s && s !== n && s(i);
      }
    };
  }
  createRenderDocument(e) {
    return Sl(e, {
      mode: this.getColorMode(),
      monochromeColor: this.getMonochromeColor()
    });
  }
  refreshColorPolicy() {
    var s, i, o;
    if (this.activeNativeLoader) {
      (i = (s = this.activeNativeLoader).setNativeOptions) == null || i.call(s, this.mergeLoadOptions({}));
      return;
    }
    const e = (o = this.lastResult) == null ? void 0 : o.document;
    if (!e) return;
    const n = this.renderer.getViewState();
    this.renderer.setDocument(this.createRenderDocument(e)), this.renderer.setViewState(n);
  }
  activateDocumentReferences(e) {
    this.referenceRegistry.setDocument(e), _o(e, this.referenceRegistry.getState()), this.emitReferenceState();
  }
  refreshCurrentReferences() {
    var n;
    const e = (n = this.lastResult) == null ? void 0 : n.document;
    e && (this.referenceRegistry.setDocument(e), _o(e, this.referenceRegistry.getState()), this.lastResult.warnings = e.warnings, this.lastResult.summary = et(e), this.activeNativeLoader || this.renderer.refreshReferences()), this.emitReferenceState();
  }
  emitReferenceState() {
    var e, n;
    (n = (e = this.options).onReferenceStateChange) == null || n.call(e, this.referenceRegistry.getState());
  }
}
function pu(t = {}) {
  return new Uh(t);
}
function nr(t) {
  return typeof t != "string" ? void 0 : t.trim() || void 0;
}
function sr(t) {
  return t instanceof Error ? t : new Error(String(t));
}
function on(t) {
  if (t != null && t.aborted)
    throw new DOMException("Loading cancelled.", "AbortError");
}
function zh(t, e, n = {}) {
  if (t === "canvas2d") return new jo(e, n);
  if (t === "webgl") return new Go(e, n);
  if (na())
    try {
      return new Go(e, n);
    } catch (s) {
    }
  return new jo(e, n);
}
function gu(t, e, n, s = {}) {
  var I, M, N, A;
  const i = t && typeof t == "object" ? t : {}, o = su(i, s), r = Qh(i), a = eu(i), c = iu(i, s, r), l = lu(i, s, a), h = nu(i.header, n), u = Jh(c), f = ou(i, h), d = f.view, m = Vh(i), p = jh(i, m), b = qh(i), g = Kh(i), y = Array.isArray(i.entities) ? i.entities : [], x = { keepRaw: !!s.keepRaw, includeUnknownProperties: !!s.keepRaw }, v = y.filter((k) => !!k && typeof k == "object").map((k) => oa(k, x, a)), w = Sn({
    format: "dwg",
    sourceName: e,
    header: h,
    layers: o,
    lineTypes: c,
    blocks: l,
    entities: v,
    savedView: d,
    dictionaries: m,
    xrecords: p,
    dataLinks: b,
    dataTables: g,
    metadata: {
      parser: "@mlightcad/libredwg-web",
      parserMode: "wasm",
      version: n,
      savedView: d,
      requiredShxFonts: u,
      businessData: {
        dictionaries: m.length,
        xrecords: p.length,
        dataLinks: b.length,
        dataTables: g.length
      }
    },
    warnings: f.warning ? [f.warning] : [],
    raw: s.keepRaw ? t : void 0
  });
  v.length === 0 && w.warnings.push("DWG parsed successfully but no model-space entities were exposed by the converter. Check layout/paper-space content or unsupported proxy objects.");
  const C = /* @__PURE__ */ new Set(), S = [v], D = /* @__PURE__ */ new Set();
  for (; S.length; )
    for (const k of S.pop()) {
      for (const $ of (M = (I = k.hatch) == null ? void 0 : I.diagnostics) != null ? M : []) C.add($);
      if (k.kind !== "insert") continue;
      const E = (N = k.blockName) != null ? N : k.name, B = E ? (A = l[E]) != null ? A : l[E.toLowerCase()] : void 0;
      B && Array.isArray(B.entities) && !D.has(B) && (D.add(B), S.push(B.entities));
    }
  for (const k of C) w.warnings.push(k);
  if ([...new Set(Object.values(c))].some((k) => k.pattern.some((E) => {
    var B;
    return Number((B = E.elementTypeFlag) != null ? B : 0) !== 0;
  }))) {
    const k = u.length > 0 ? ` This drawing references external shape font${u.length === 1 ? "" : "s"} ${u.join(", ")}, whose outlines are not embedded in the DWG.` : "";
    w.warnings.push(`Complex SHX linetype glyphs are preserved in the normalized LTYPE definition and rendered as a dash/dot approximation.${k}`);
  }
  return w;
}
function me(t) {
  var e, n, s, i;
  if (typeof t == "bigint") return t.toString(16).toLocaleUpperCase();
  if (typeof t == "number" && Number.isFinite(t)) return Math.trunc(t).toString(16).toLocaleUpperCase();
  if (typeof t == "string") return t.trim() || void 0;
  if (Array.isArray(t)) return me((e = t[3]) != null ? e : t[2]);
  if (t && typeof t == "object") {
    const o = t;
    return me((i = (s = (n = o.absolute_ref) != null ? n : o.absoluteRef) != null ? s : o.value) != null ? i : o.handle);
  }
}
function Vh(t) {
  var o, r;
  const e = t.objects && typeof t.objects == "object" ? t.objects : void 0, n = [e == null ? void 0 : e.DICTIONARY, e == null ? void 0 : e.dictionary, t.dictionaries], s = [], i = /* @__PURE__ */ new Set();
  for (const a of n)
    for (const c of Yt(a)) {
      if (!c || typeof c != "object") continue;
      const l = c, h = me((o = l.handle) != null ? o : l.id);
      if (h && i.has(h.toLocaleUpperCase())) continue;
      const u = [];
      if (l.entries && typeof l.entries == "object" && !Array.isArray(l.entries))
        for (const [f, d] of Object.entries(l.entries)) {
          const m = me(d);
          f && m && u.push({ name: f, handle: m });
        }
      else if (Array.isArray(l.texts) && Array.isArray(l.itemhandles))
        for (let f = 0; f < Math.min(l.texts.length, l.itemhandles.length); f += 1) {
          const d = R(l.texts[f]), m = me(l.itemhandles[f]);
          d && m && u.push({ name: d, handle: m });
        }
      s.push({ handle: h, ownerHandle: me((r = l.ownerHandle) != null ? r : l.owner), entries: u }), h && i.add(h.toLocaleUpperCase());
    }
  return s;
}
function jh(t, e) {
  var r, a, c;
  const n = t.objects && typeof t.objects == "object" ? t.objects : void 0, s = [n == null ? void 0 : n.XRECORD, n == null ? void 0 : n.xrecords, t.xrecords], i = [], o = /* @__PURE__ */ new Set();
  for (const l of s)
    for (const h of Yt(l)) {
      if (!h || typeof h != "object") continue;
      const u = h, f = me((r = u.handle) != null ? r : u.id);
      if (f && o.has(f.toLocaleUpperCase())) continue;
      const d = (Array.isArray(u.data) ? u.data : Array.isArray(u.entries) ? u.entries : []).flatMap((b) => {
        var v, w, C;
        const g = b && typeof b == "object" ? b : void 0, y = ge((w = (v = g == null ? void 0 : g.value) != null ? v : g == null ? void 0 : g.data) != null ? w : b);
        if (y === void 0) return [];
        const x = T((C = g == null ? void 0 : g.code) != null ? C : g == null ? void 0 : g.groupCode);
        return [{ ...x !== void 0 ? { code: x } : {}, value: y }];
      }), m = me((a = u.ownerHandle) != null ? a : u.owner), p = Gh(f, m, e);
      i.push({
        handle: f,
        ownerHandle: m,
        entryName: (c = R(u.entryName)) != null ? c : p.entryName,
        dictionaryPath: Array.isArray(u.dictionaryPath) ? u.dictionaryPath.map(String) : p.path,
        extensionDictionary: me(u.extensionDictionary),
        cloning: T(u.cloning),
        data: d
      }), f && o.add(f.toLocaleUpperCase());
    }
  return i;
}
function Gh(t, e, n) {
  var l, h;
  if (!t) return {};
  const s = new Map(n.filter((u) => u.handle).map((u) => [u.handle.toLocaleUpperCase(), u])), i = e ? s.get(e.toLocaleUpperCase()) : void 0, o = (l = i == null ? void 0 : i.entries.find((u) => u.handle.toLocaleUpperCase() === t.toLocaleUpperCase())) == null ? void 0 : l.name;
  if (!i) return { entryName: o };
  const r = o ? [o] : [];
  let a = i;
  const c = /* @__PURE__ */ new Set();
  for (; a.handle && a.ownerHandle && !c.has(a.handle.toLocaleUpperCase()); ) {
    c.add(a.handle.toLocaleUpperCase());
    const u = s.get(a.ownerHandle.toLocaleUpperCase());
    if (!u) break;
    const f = (h = u.entries.find((d) => d.handle.toLocaleUpperCase() === a.handle.toLocaleUpperCase())) == null ? void 0 : h.name;
    f && r.unshift(f), a = u;
  }
  return { entryName: o, path: r.length > 0 ? r : void 0 };
}
function qh(t) {
  var i, o, r, a, c, l, h, u, f;
  const e = t.objects && typeof t.objects == "object" ? t.objects : void 0, n = [], s = /* @__PURE__ */ new Set();
  for (const d of Yt((o = (i = e == null ? void 0 : e.DATALINK) != null ? i : e == null ? void 0 : e.dataLinks) != null ? o : t.dataLinks)) {
    if (!d || typeof d != "object") continue;
    const m = d, p = me((r = m.handle) != null ? r : m.id);
    p && s.has(p.toLocaleUpperCase()) || (n.push({
      handle: p,
      dataAdapter: R((a = m.dataAdapter) != null ? a : m.data_adapter),
      description: R(m.description),
      tooltip: R(m.tooltip),
      connectionString: R((c = m.connectionString) != null ? c : m.connection_string),
      updateStatus: R((l = m.updateStatus) != null ? l : m.update_status),
      updateOption: T((h = m.updateOption) != null ? h : m.update_option),
      pathOption: T((u = m.pathOption) != null ? u : m.path_option),
      lastUpdated: R((f = m.lastUpdated) != null ? f : m.last_updated)
    }), p && s.add(p.toLocaleUpperCase()));
  }
  return n;
}
function Kh(t) {
  var o, r, a, c, l, h, u, f, d, m, p, b, g, y, x, v, w, C, S, D;
  const e = t.objects && typeof t.objects == "object" ? t.objects : void 0, n = [e == null ? void 0 : e.DATATABLE, e == null ? void 0 : e.dataTables, t.dataTables, e == null ? void 0 : e.TABLECONTENT], s = [], i = /* @__PURE__ */ new Set();
  for (const L of n)
    for (const I of Yt(L)) {
      if (!I || typeof I != "object") continue;
      const M = I, N = me((o = M.handle) != null ? o : M.id);
      if (N && i.has(N.toLocaleUpperCase())) continue;
      const A = xe((r = M.linkedData) != null ? r : M.ldata), k = xe((a = M.linkedTableData) != null ? a : M.tdata), E = Zh((c = M.columns) != null ? c : M.cols, k), B = Math.max(
        0,
        Math.trunc((d = T((f = (u = (h = (l = M.rowCount) != null ? l : M.numRows) != null ? h : M.num_rows) != null ? u : k == null ? void 0 : k.numRows) != null ? f : k == null ? void 0 : k.num_rows)) != null ? d : 0),
        ...E.map((F) => F.values.length)
      ), $ = Math.max(
        E.length,
        Math.trunc((v = T((x = (y = (g = (b = (p = (m = M.columnCount) != null ? m : M.numColumns) != null ? p : M.numCols) != null ? b : M.num_cols) != null ? g : k == null ? void 0 : k.numColumns) != null ? y : k == null ? void 0 : k.numCols) != null ? x : k == null ? void 0 : k.num_cols)) != null ? v : 0)
      );
      E.length === 0 && B === 0 && $ === 0 || (s.push({
        handle: N,
        name: R((D = (S = (C = (w = M.tableName) != null ? w : M.table_name) != null ? C : M.name) != null ? S : A == null ? void 0 : A.name) != null ? D : A == null ? void 0 : A.description),
        rowCount: B,
        columnCount: $,
        columns: E
      }), N && i.add(N.toLocaleUpperCase()));
    }
  return s;
}
function Zh(t, e) {
  const n = Array.isArray(t) ? t : Array.isArray(e == null ? void 0 : e.columns) ? e.columns : Array.isArray(e == null ? void 0 : e.cols) ? e.cols : [];
  if (n.length > 0)
    return n.map((r, a) => {
      var h, u, f;
      const c = xe(r), l = Array.isArray(c == null ? void 0 : c.rows) ? c.rows : Array.isArray(c == null ? void 0 : c.values) ? c.values : [];
      return {
        name: (u = R((h = c == null ? void 0 : c.name) != null ? h : c == null ? void 0 : c.text)) != null ? u : `Column ${a + 1}`,
        type: (f = R(c == null ? void 0 : c.type)) != null ? f : T(c == null ? void 0 : c.type),
        values: l.map(ir).filter((d) => d !== void 0)
      };
    });
  const i = (Array.isArray(e == null ? void 0 : e.rows) ? e.rows : []).map((r) => {
    const a = xe(r);
    return Array.isArray(a == null ? void 0 : a.cells) ? a.cells : [];
  }), o = Math.max(0, ...i.map((r) => r.length));
  return Array.from({ length: o }, (r, a) => ({
    name: `Column ${a + 1}`,
    values: i.map((c) => ir(c[a])).filter((c) => c !== void 0)
  }));
}
function ir(t) {
  var o, r;
  const e = xe(t), n = Array.isArray(e == null ? void 0 : e.cellContents) ? e.cellContents : Array.isArray(e == null ? void 0 : e.cell_contents) ? e.cell_contents : void 0, s = (r = (o = n == null ? void 0 : n[0]) != null ? o : e == null ? void 0 : e.value) != null ? r : t, i = xe(s);
  for (const a of [i == null ? void 0 : i.valueString, i == null ? void 0 : i.value_string, i == null ? void 0 : i.dataString, i == null ? void 0 : i.data_string, i == null ? void 0 : i.dataLong, i == null ? void 0 : i.data_long, i == null ? void 0 : i.dataDouble, i == null ? void 0 : i.data_double, i == null ? void 0 : i.dataDate, i == null ? void 0 : i.data_date, i == null ? void 0 : i.dataPoint, i == null ? void 0 : i.data_point, i == null ? void 0 : i.data3dPoint, i == null ? void 0 : i.data_3dpoint, s]) {
    const c = ge(a);
    if (c != null && c !== "" && !(typeof c == "object" && !Array.isArray(c) && Object.keys(c).length === 0)) return c;
  }
}
function Yt(t) {
  if (!t) return [];
  if (Array.isArray(t)) return t;
  if (typeof t != "object") return [];
  const e = t;
  for (const n of ["entries", "records", "items", "values"]) if (Array.isArray(e[n])) return e[n];
  return Object.values(e).filter((n) => n && typeof n == "object");
}
function xe(t) {
  return t && typeof t == "object" && !Array.isArray(t) ? t : void 0;
}
function Jh(t) {
  var n;
  const e = /* @__PURE__ */ new Set();
  for (const s of new Set(Object.values(t)))
    for (const i of s.pattern)
      Number((n = i.elementTypeFlag) != null ? n : 0) !== 0 && i.fontName && e.add(i.fontName);
  return [...e].sort((s, i) => s.localeCompare(i));
}
function Qh(t) {
  var o, r, a, c;
  const e = t.tables, n = [t.STYLE, t.styles, e == null ? void 0 : e.STYLE, e == null ? void 0 : e.styles], s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
  for (const l of n)
    for (const h of je(l)) {
      if (!h || typeof h != "object") continue;
      const u = h, f = R((r = (o = u.font) != null ? o : u.fontFileName) != null ? r : u.primaryFontFileName);
      if (!f || !/\.shx$/i.test(f)) continue;
      (((c = T((a = u.standardFlag) != null ? a : u.flag)) != null ? c : 0) & 1) === 1 && i.add(f);
      for (const m of [u.handle, u.id, u.name]) {
        const p = Ut(m);
        p && s.set(p, f);
      }
    }
  return { byReference: s, shapeFonts: [...i] };
}
function eu(t) {
  var s, i, o;
  const e = xe(t.tables), n = /* @__PURE__ */ new Map();
  for (const r of [t.STYLE, t.styles, e == null ? void 0 : e.STYLE, e == null ? void 0 : e.styles])
    for (const a of je(r)) {
      const c = xe(a);
      if (!c) continue;
      const l = T((s = c.widthFactor) != null ? s : c.width_factor), h = R((o = (i = c.font) != null ? i : c.fontFileName) != null ? o : c.primaryFontFileName), u = h == null ? void 0 : h.split(/[\\/]/).pop(), f = {
        "times.ttf": "Times New Roman",
        "arial.ttf": "Arial",
        "simhei.ttf": "SimHei",
        "simsun.ttf": "SimSun",
        "simfang.ttf": "FangSong",
        "simkai.ttf": "KaiTi"
      }, d = u && (Object.prototype.hasOwnProperty.call(f, u.toLowerCase()) ? f[u.toLowerCase()] : u.replace(/\.(?:ttf|otf)$/i, "")), m = {
        widthFactor: l !== void 0 && l > 0 ? l : void 0,
        fontFamily: d || void 0
      };
      for (const p of [c.name, c.handle, c.id]) {
        const b = Ut(p);
        b && n.set(b, m);
      }
    }
  return n;
}
function ia(t, e, n) {
  var i, o, r, a, c, l, h, u, f;
  if (t.kind === "text") {
    const d = xe(e.text), m = (r = (o = (i = e.styleName) != null ? i : e.textStyle) != null ? o : d == null ? void 0 : d.styleName) != null ? r : d == null ? void 0 : d.textStyle, p = n.get(Ut(m));
    if (p && (t.type === "MTEXT" ? (a = t.textStyleWidthFactor) != null || (t.textStyleWidthFactor = p.widthFactor) : (c = t.xScale) != null || (t.xScale = p.widthFactor), (l = t.fontFamily) != null || (t.fontFamily = p.fontFamily)), t.type === "MTEXT") {
      const b = K((h = e.direction) != null ? h : e.x_axis_dir);
      b && Math.hypot(b.x, b.y) > 1e-12 && (t.rotation = Math.atan2(b.y, b.x));
    }
  }
  const s = (f = (u = e.attribs) != null ? u : e.attributes) != null ? f : e.attributeEntities;
  if (t.attribs && Array.isArray(s)) {
    const d = s.filter((m) => !!m && typeof m == "object");
    t.attribs.forEach((m, p) => {
      d[p] && ia(m, d[p], n);
    });
  }
}
function oa(t, e, n) {
  var c, l, h, u, f, d, m, p;
  const s = bt(t, void 0, { ...e, numericColorMode: "rgb" });
  ia(s, t, n);
  const i = T(t.color);
  i !== void 0 && i >= 0 && i <= 16777215 && (s.color = i, s.trueColor = i), s.colorIndex = (h = T((l = (c = t.colorIndex) != null ? c : t.colorNumber) != null ? l : t.aci)) != null ? h : s.colorIndex, s.colorName = (f = R((u = t.colorName) != null ? u : t.color_name)) != null ? f : s.colorName;
  const o = T((d = t.flag) != null ? d : t.flags);
  o !== void 0 && (s.flag = o);
  const r = String((p = (m = t.type) != null ? m : t.entityType) != null ? p : "").toUpperCase(), a = /^(POLYLINE|POLYLINE_2D|POLYLINE2D|POLYLINE_3D|POLYLINE3D)$/.test(r);
  return (t.isClosed === !0 || t.closed === !0 || a && (Number(o != null ? o : 0) & 1) === 1 || r === "LWPOLYLINE" && (Number(o != null ? o : 0) & 512) === 512) && (s.isClosed = !0), s;
}
function tu(t) {
  return typeof t == "number" && Number.isFinite(t) && Math.abs(Math.trunc(t)) >= 1 && Math.abs(Math.trunc(t)) <= 255;
}
function nu(t, e) {
  const n = t && typeof t == "object" ? { ...t } : {};
  return e && (n.dwgVersion = e), n;
}
function su(t, e) {
  var o, r, a, c, l, h, u, f, d, m, p, b, g, y, x, v;
  const n = {}, s = [], i = t.tables;
  for (const w of ["LAYER", "layer", "layers"]) {
    const C = (o = t[w]) != null ? o : i == null ? void 0 : i[w];
    C && s.push(C);
  }
  for (const w of s)
    for (const C of je(w)) {
      const S = C, D = R((a = (r = S.name) != null ? r : S.layerName) != null ? a : S.entryName);
      if (!D) continue;
      const L = T((c = S.colorIndex) != null ? c : S.colorNumber), I = T((m = (d = (f = (u = (h = (l = S.trueColor) != null ? l : S.true_color) != null ? h : S.truecolor) != null ? u : S.colorRGB) != null ? f : S.colorRgb) != null ? d : S.rgbColor) != null ? m : S.rgb), M = T(S.color), N = tu(L), A = I != null ? I : !N && M !== void 0 && M >= 0 && M <= 16777215 ? M : void 0, k = {
        name: D,
        color: N ? void 0 : (p = S.color) != null ? p : S.colorName,
        colorIndex: L != null ? L : M !== void 0 && Math.abs(M) <= 257 ? M : void 0,
        trueColor: A,
        lineType: R((b = S.lineType) != null ? b : S.linetype),
        lineweight: T((g = S.lineweight) != null ? g : S.lineWeight),
        isVisible: !(S.isVisible === !1 || S.off === !0 || Number((y = L != null ? L : S.color) != null ? y : 1) < 0),
        isFrozen: !!((x = S.isFrozen) != null ? x : S.frozen),
        isLocked: !!((v = S.isLocked) != null ? v : S.locked),
        raw: e.keepRaw ? S : void 0
      };
      Ft(n, k);
    }
  return n;
}
function iu(t, e, n) {
  var r, a, c, l;
  const s = {}, i = t.tables, o = [t.LTYPE, t.ltype, t.lineTypes, i == null ? void 0 : i.LTYPE, i == null ? void 0 : i.ltype, i == null ? void 0 : i.lineTypes];
  for (const h of o)
    for (const u of je(h)) {
      const f = u, d = R((a = (r = f.name) != null ? r : f.lineTypeName) != null ? a : f.entryName);
      if (!d) continue;
      const p = (Array.isArray(f.pattern) ? f.pattern : Array.isArray(f.dashes) ? f.dashes : []).flatMap((b) => {
        var L, I, M, N, A, k, E;
        if (typeof b == "number") return [{ length: b }];
        if (!b || typeof b != "object") return [];
        const g = b, y = T((I = (L = g.elementLength) != null ? L : g.length) != null ? I : g.dashLength);
        if (y === void 0) return [];
        const x = T(g.elementTypeFlag), v = T(g.shapeNumber), w = x !== void 0 && v !== void 0, C = w ? v : T((M = g.typeFlag) != null ? M : g.elementTypeFlag), S = R((A = (N = g.styleObjectId) != null ? N : g.styleHandle) != null ? A : g.style), D = (k = S ? n.byReference.get(Ut(S)) : void 0) != null ? k : (Number(C != null ? C : 0) & 4) === 4 && n.shapeFonts.length === 1 ? n.shapeFonts[0] : void 0;
        return [{
          length: y,
          elementTypeFlag: C,
          shapeNumber: w ? x : T((E = g.shapeCode) != null ? E : g.shapeNumber),
          scale: T(g.scale),
          rotation: T(g.rotation),
          offsetX: T(g.offsetX),
          offsetY: T(g.offsetY),
          text: R(g.text),
          styleHandle: S,
          fontName: D
        }];
      });
      Pa(s, {
        name: d,
        handle: R((c = f.handle) != null ? c : f.id),
        description: R(f.description),
        totalPatternLength: T((l = f.totalPatternLength) != null ? l : f.patternLength),
        pattern: p,
        raw: e.keepRaw ? f : void 0
      });
    }
  return s;
}
function Ut(t) {
  return String(t != null ? t : "").trim().replace(/^0x/i, "").replace(/^0+(?=[0-9a-f])/i, "").toLowerCase();
}
function ou(t, e) {
  var g, y, x, v, w, C, S, D, L, I, M, N, A, k, E, B, $, F, O, X;
  const n = t.tables, i = je((x = (y = (g = t.VPORT) != null ? g : t.vports) != null ? y : n == null ? void 0 : n.VPORT) != null ? x : n == null ? void 0 : n.vports).filter((H) => !!H && typeof H == "object").find((H) => {
    var W;
    return String((W = H.name) != null ? W : "").trim().toLowerCase() === "*active";
  }), o = i ? "vport" : "header-ucs", r = i != null ? i : e, a = K((w = (v = r.ucsOrigin) != null ? v : r.UCSORG) != null ? w : e.UCSORG), c = K((S = (C = r.ucsXAxis) != null ? C : r.UCSXDIR) != null ? S : e.UCSXDIR), l = K((L = (D = r.ucsYAxis) != null ? D : r.UCSYDIR) != null ? L : e.UCSYDIR), h = (N = T((M = (I = r.viewTwistAngle) != null ? I : r.twistAngle) != null ? M : r.VIEWTWIST)) != null ? N : 0, u = K((E = (k = (A = r.viewDirectionFromTarget) != null ? A : r.viewDirection) != null ? k : r.direction) != null ? E : r.VIEWDIR), f = !cu(a, c, l);
  if (!(!!i || !!u || f || Math.abs(h) > 1e-12)) return {};
  const m = au(u), p = m ? ru(a, c, l, h) : { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, b = {
    source: o,
    name: R(r.name),
    handle: R(r.handle),
    center: K((B = r.center) != null ? B : r.VIEWCTR),
    target: K((F = ($ = r.viewTarget) != null ? $ : r.target) != null ? F : r.TARGET),
    direction: u,
    viewHeight: T((X = (O = r.viewHeight) != null ? O : r.height) != null ? X : r.VIEWSIZE),
    aspectRatio: T(r.aspectRatio),
    twistAngle: h,
    ucsOrigin: a,
    ucsXAxis: c,
    ucsYAxis: l,
    sceneTransformApplied: m,
    sceneTransform: p
  };
  return m ? { view: b } : {
    view: b,
    warning: "The saved CAD view has a missing, non-finite, or tilted VIEWDIR. File Viewer kept world coordinates instead of applying an unsafe 2D UCS/PLAN rotation."
  };
}
function ru(t, e, n, s) {
  var l, h, u;
  const i = (l = rn(e)) != null ? l : { x: 1, y: 0 }, o = (h = rn(n)) != null ? h : { x: -i.y, y: i.x }, r = i.x * o.x + i.y * o.y, a = (u = rn({
    x: o.x - i.x * r,
    y: o.y - i.y * r
  })) != null ? u : { x: -i.y, y: i.x }, c = {
    a: i.x,
    b: a.x,
    c: i.y,
    d: a.y,
    e: t ? -(t.x * i.x + t.y * i.y) : 0,
    f: t ? -(t.x * a.x + t.y * a.y) : 0
  };
  return Dt(zr(Number.isFinite(s) ? s : 0), c);
}
function rn(t) {
  var n;
  if (!t || Math.abs(Number((n = t.z) != null ? n : 0)) > 1e-6) return;
  const e = Math.hypot(t.x, t.y);
  if (!(!Number.isFinite(e) || e < 1e-12))
    return { x: t.x / e, y: t.y / e };
}
function au(t) {
  if (!t || !Number.isFinite(t.x) || !Number.isFinite(t.y) || !Number.isFinite(t.z)) return !1;
  const e = Math.hypot(t.x, t.y, Number(t.z));
  return !Number.isFinite(e) || e < 1e-12 ? !1 : Math.hypot(t.x, t.y) / e <= 1e-4 && Math.abs(Number(t.z)) / e >= 1 - 1e-8;
}
function cu(t, e, n) {
  var a, c, l;
  const s = (h, u) => Number.isFinite(h) && Math.abs(Number(h) - u) <= 1e-10, i = !t || s(t.x, 0) && s(t.y, 0) && s((a = t.z) != null ? a : 0, 0), o = !e || s(e.x, 1) && s(e.y, 0) && s((c = e.z) != null ? c : 0, 0), r = !n || s(n.x, 0) && s(n.y, 1) && s((l = n.z) != null ? l : 0, 0);
  return i && o && r;
}
function lu(t, e, n) {
  var a, c, l, h;
  const s = {}, i = [t.blocks, t.blockHeaders, t.block_records, t.blockRecords], o = t.tables;
  i.push(o == null ? void 0 : o.BLOCK, o == null ? void 0 : o.BLOCK_RECORD, o == null ? void 0 : o.blocks);
  const r = { keepRaw: !!e.keepRaw, includeUnknownProperties: !!e.keepRaw };
  for (const u of i)
    for (const f of je(u)) {
      const d = f, m = R((c = (a = d.name) != null ? a : d.blockName) != null ? c : d.name2);
      if (!m) continue;
      const b = (Array.isArray(d.entities) ? d.entities : Array.isArray(d.ownedObjects) ? d.ownedObjects : []).filter((g) => !!g && typeof g == "object").map((g) => oa(g, r, n));
      cr(s, {
        name: m,
        basePoint: (h = K((l = d.basePoint) != null ? l : d.origin)) != null ? h : { x: 0, y: 0 },
        entities: b,
        raw: e.keepRaw ? d : void 0
      });
    }
  return s;
}
function je(t) {
  if (!t) return [];
  if (Array.isArray(t)) return t;
  if (typeof t != "object") return [];
  const e = t, n = Object.values(e).filter((i) => i && typeof i == "object"), s = ["entries", "records", "items", "values", "layers", "blocks"].flatMap((i) => Array.isArray(e[i]) ? e[i] : []);
  return s.length > 0 ? s : n;
}
export {
  jo as CadCanvasRenderer,
  ua as CadLoaderRegistry,
  Zl as CadShxFontRegistry,
  Uh as CadViewer,
  Go as CadWebGLRenderer,
  Ic as DwfLoader,
  ya as DwgLoader,
  da as DwgWorkerClient,
  uc as DxfLoader,
  Yr as applyByBlockColorInheritance,
  Jr as applyByBlockLineTypeInheritance,
  sh as applyCadColorPolicy,
  ar as cadEntityWorldStrokeWidth,
  Ee as colorFromAci,
  gt as colorFromTrueColor,
  Vr as computeCadDocumentBounds,
  Sn as createCadDocument,
  Sl as createCadRenderDocument,
  ta as createCadSceneDocument,
  pu as createCadViewer,
  Rn as createDashedCadPrimitives,
  mu as createDashedCadSegments,
  Yc as createDefaultLoaderRegistry,
  _e as detectCadFormat,
  Vc as extractCadBom,
  ut as inferEntityKind,
  eh as isCadNativeRenderableLoader,
  rr as isCadPolylineClosed,
  na as isWebGLAvailable,
  ge as normalizeCadDataValue,
  bt as normalizeCadEntity,
  Ma as normalizeCadTableData,
  gu as normalizeDwgDatabase,
  In as readCadColorPolicy,
  ht as readInputBytes,
  He as resolveCadColor,
  jr as resolveCadFitBounds,
  vn as resolveCadLinePattern,
  Qr as resolveCadLineTypeReference,
  yh as resolveCadSavedViewBounds,
  gn as resolveFillColor,
  du as serializeCadBomCsv,
  fu as serializeCadBomJson,
  et as summarizeCadDocument,
  an as supportsDwgWorker,
  ea as transformCadLineTypeGlyph
};
//# sourceMappingURL=cad-viewer.es.js.map
