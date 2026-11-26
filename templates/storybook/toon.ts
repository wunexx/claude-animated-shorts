// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#faf7f3";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
const SH_FELT: C3 = [0.62, 0.62, 0.7];

export type Build = "adult" | "stout" | "kid";
export type Outfit = {
  jacket: string; pants: string; boots: string; hat?: string | null; belt?: string | null; buttons?: string; rifle?: boolean;
  sash?: string; sword?: boolean; moustache?: string; beard?: string; skin?: string; head?: number; cap?: string; hair?: string; dress?: string;
  build?: Build; spear?: boolean; bare?: boolean; scabbard?: boolean; crest?: string;
  tie?: string; badge?: boolean; // office necktie (colour) + ID badge on a lanyard (Atlas)
  stone?: boolean; // grey cracks over the body (turned to stone)
};
type P2 = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

export const RIFLEMAN: Outfit = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
export const OFFICER: Outfit = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
export const KID: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
export const PARENT: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
export const SKINS = [SKIN, "#f6ece2", "#f0dccb", "#c99067"];

export const soldier = (v = 0, extra: Partial<Outfit> = {}): Outfit => {
  const o: Outfit = { ...RIFLEMAN, skin: SKINS[v % 4] };
  if (v % 4 === 1) o.moustache = "#4a3426";
  if (v % 4 === 3) o.moustache = "#2a201a";
  return { ...o, ...extra };
};

export const townsfolk = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
};

export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  /** filled shape with an ink outline; fill=null draws the outline only */
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  /** thick round-capped limb with an ink rim (effects, rope) */
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    if (ink) { this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * this.ol * 0.9; g.stroke(); }
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
  /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
    g.lineCap = "round";
  }
}

const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed"
  | "pained" | "smile" | "smile_closed" | "lick" | "weep" | "wail" | "sad" | "worried" | "sing";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral";
type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
  weep: { eye: ["squeeze", "squeeze"], brow: [-6, 3], mouth: "wave" },
  wail: { eye: ["squeeze", "squeeze"], brow: [-7, 3], mouth: "O" },
  sad: { eye: ["lid", "lid"], brow: [-6, 3], mouth: "frown" },
  worried: { eye: ["small", "small"], brow: [-4, 3], mouth: "wave" },
  sing: { eye: ["happy", "happy"], brow: [-4, -3], mouth: "O" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK =>
  lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
    default: {
      const s: P2[] = [];
      for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
      p.stroke(s, 2.4 * u);
    }
  }
};

/** open "D" mouth with a white teeth band (+ tongue) */
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
  }
};

/** face v2 (front / 3-4). u = 1 % of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u
 *  down, everything slid toward the facing side. No blush, no catchlights. */
const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false, yaw?: number) => {
  if (yaw !== undefined && yaw > 4) return faceTurn(p, cx, cy, W, expr, yaw, look, lid, brim, skin, moustache, stout);
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, F.mouth, mx, my, u);
  if (moustache) for (const s of [-1, 1])
    taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

/** turned face (yaw 0..180 deg, turned toward screen-right; 2026-11-21). Features sit on an inner sphere of radius
 *  0.62 a (a = half the head width) and turn with it: at 30 deg the mouth has slid 0.15 W (reference 3/4 views:
 *  0.1-0.15 W), at 90 deg the near eye lands at 28u like the profile face. The eye on the facing side foreshortens and
 *  hides past the limb; a nose tick appears from 25 deg; past 105 deg the face is gone (back view, hair covers it). */
const faceTurn = (p: Pen, cx: number, cy: number, W: number, expr: Expr, yaw: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false) => {
  if (yaw >= 105) return;
  const u = W / 100, a = W / 2, F = FACE[expr], R = 0.62 * a, y = rad(yaw), sy = Math.sin(y), cyw = Math.cos(y);
  const at = (phi: number) => ({ x: cx + R * Math.sin(phi + y), z: Math.cos(phi + y) });
  const e0 = Math.asin(((F.eye[0] === "shock" ? 12 : 13) * u) / R);
  const lk = look || 0.5 * sy; // turned characters look where they face unless told otherwise
  for (const side of [-1, 1]) {
    const E = at(side * e0);
    if (E.z < 0.12) continue; // past the limb
    const sq = Math.max(0.45, Math.sqrt(Math.max(0, E.z)));
    const kind = eyeKind(F.eye[side > 0 ? 1 : 0], lid);
    const [qx, qy] = p.P(E.x, cy); // squash about the eye's drawn position (after the head tilt)
    p.g.save(); p.g.translate(qx, qy); p.g.scale(sq, 1); p.g.translate(-qx, -qy);
    eye(p, kind, E.x, cy, u, side, lk, skin);
    const [dI, dO] = F.brow, by = cy - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(E.x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [E.x - side * 8.5 * u, by + dI * u], [E.x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
    p.g.restore();
  }
  if (yaw >= 62) { // small nose tick on the contour near profile only (inside a 3/4 face it read as a scratch)
    const nx = cx + 0.97 * a * Math.sin(y), k = Math.min(1, (yaw - 62) / 25);
    p.stroke([[nx - 3 * u * k, cy + 4 * u], [nx + 1.5 * u * k, cy + 9 * u], [nx - 3 * u * k, cy + 10 * u]], 3 * u);
  }
  const M = at(0), mk = 0.62 + 0.38 * Math.max(0, cyw);
  if (M.z > 0.05) mouth(p, F.mouth, M.x, cy + 20 * u, u, mk);
  if (moustache && M.z > 0.05) for (const s of [-1, 1]) {
    const len = (stout ? 19 : 15) * u * (s > 0 ? Math.max(0.35, cyw) : 1);
    taper(p, [M.x + s * 1.5 * u, cy + 12.5 * u], [M.x + s * len, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  }
  if (expr === "nervous") p.ell(cx - 30 * u * sy + 40 * u * cyw, cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

/** profile face (facing screen-right): one eye, brow, nose tick, mouth near the front edge; no skin bump nose, no ear */
const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, moustache?: string, stout = false) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u, 2.5 * u);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

// ---------------- hats ----------------
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
/** the turn of the head being drawn (deg, 0..180; set by bodyFront): hair wraps the back of the head and front-only
 *  hat details (peaks, badges, cockades, crests) hide once the head turns away (> 105) */
let HAT_YAW = 0;
const hatBack = () => HAT_YAW > 105;
/** parts of a hat that sit behind the head (bonnet) */
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.hat === "hood") {
    const col = o.cap ?? "#1c1824", W = 2 * H.a, HH = 2 * H.b;
    const pts: P2[] = [[cx - 0.62 * W, hc + 0.55 * HH], [cx - 0.66 * W, hc - 0.1 * HH], [cx - 0.3 * W, hc - 0.62 * HH], [cx + 0.06 * W, hc - 0.8 * HH],
      [cx + 0.4 * W, hc - 0.55 * HH], [cx + 0.66 * W, hc - 0.1 * HH], [cx + 0.62 * W, hc + 0.55 * HH]];
    p.shadedFill(pts, col, mul(col, SH_FELT), light, 0.66 * W, 0.4);
    p.inkRing(pts, ow * 0.85, thick);
    return;
  }
  if (o.hat === "longhair") {
    const u = H.a / 50, top = hc - H.b * 0.9, bot = hc + H.b * 1.75, hw = H.a * 1.12;
    const pts: P2[] = [[cx - hw * 0.78, top], [cx + hw * 0.78, top], [cx + hw, hc], [cx + hw * 1.04, bot - 10 * u], [cx + hw * 0.7, bot],
      [cx + hw * 0.25, bot - 14 * u], [cx - hw * 0.25, bot - 14 * u], [cx - hw * 0.7, bot], [cx - hw * 1.04, bot - 10 * u], [cx - hw, hc]];
    p.shadedFill(pts, o.hair!, mul(o.hair!, SH_FELT), light, hw, 0.35);
    p.inkRing(pts, ow * 0.85, thick);
    return;
  }
  if (o.hat === "kabuto") { // flared neck guard (shikoro) behind the head
    const W = 2 * H.a, HH = 2 * H.b, yb = hc - H.b + 0.36 * HH, col = mix(o.cap ?? "#2c2a33", "#8a2f2a", 0.45);
    const pts: P2[] = [[cx - 0.5 * W, yb - 0.04 * HH], [cx + 0.5 * W, yb - 0.04 * HH], [cx + 0.7 * W, yb + 0.26 * HH], [cx - 0.7 * W, yb + 0.26 * HH]];
    p.shadedFill(pts, col, mul(col, SH_FELT), light, 0.7 * W, 0.4);
    p.inkRing(pts, ow * 0.85, thick);
    for (let i = 1; i < 3; i++) p.stroke([[cx - (0.5 + 0.067 * i) * W, yb + 0.087 * i * HH], [cx + (0.5 + 0.067 * i) * W, yb + 0.087 * i * HH]], 1.6 * (W / 100), "#e8c45a");
    return;
  }
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};

const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean): void => {
  if (o.hat === "bicorne" || o.hat === "bicorne_plume") { // Napoleonic bicorne worn sideways + tricolour cockade
    hatOn(p, { ...o, hat: "hair", hair: o.hair ?? "#3a2a22" }, hp, H, cx, hc, light, seed, facing, side);
    // worn sideways: seen end-on in profile, so the whole hat narrows about the head as it turns
    const g = p.g, kq = HAT_YAW > 4 ? 0.32 + 0.68 * Math.abs(Math.cos(rad(HAT_YAW))) : 1, [qx, qy] = p.P(cx, hc);
    g.save(); g.translate(qx, qy); g.scale(kq, 1); g.translate(-qx, -qy);
    try { bicorneShape(); } finally { g.restore(); }
    return;
    function bicorneShape() {
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, ow = 3.6 * u, crown = hc - H.b, col = o.cap ?? "#1d1a22";
    const yb = crown + 0.17 * HH, L: P2 = [cx - 0.9 * W, yb - 0.02 * HH], R: P2 = [cx + 0.9 * W, yb - 0.02 * HH];
    const top = curve(L, [cx, crown - 0.4 * HH], R, 18), bot = curve(R, [cx, yb + 0.02 * HH], L, 14);
    const pts = [...top, ...bot.slice(1)];
    if (o.hat === "bicorne_plume") for (let i = 1; i < top.length - 1; i++) p.ell(top[i][0], top[i][1] - 2 * u, 7 * u, 6 * u, "#f7f3ea", 0);
    p.shadedFill(pts, col, mul(col, SH_FELT), light, 0.9 * W, 0.4);
    p.inkRing(pts, ow * 0.85, 0);
    p.stroke(curve([cx - 0.82 * W, yb - 0.06 * HH], [cx, yb - 0.08 * HH], [cx + 0.82 * W, yb - 0.06 * HH], 12), 3 * u, mix(col, "#ffffff", 0.18));
    const kx = cx - 0.36 * W, ky = yb - 0.13 * HH;
    if (hatBack()) return;
    p.ell(kx, ky, 10 * u, 10 * u, "#2a4fa8", 2 * u); p.ell(kx, ky, 6.5 * u, 6.5 * u, "#f7f3ea", 0); p.ell(kx, ky, 3.2 * u, 3.2 * u, "#d0343a", 0);
    p.stroke([[kx, ky - 10 * u], [kx + 3 * u, ky - 24 * u]], 2.4 * u, "#d9a640");
    }
  }
  if (o.hat === "cavalier") { // 1620s wide-brimmed felt hat with a band and a curling feather (Vasa)
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, ow = 3.6 * u, crown = hc - H.b, col = o.cap ?? "#24202a", sx = side ? 6 * u : 0;
    p.ell(cx + sx + 0.42 * W, crown - 0.02 * HH, 0.34 * W, 0.09 * HH, "#f4f1ea", ow * 0.7, 0, 360, -28);
    p.ell(cx + sx + 0.5 * W, crown - 0.07 * HH, 0.2 * W, 0.06 * HH, "#c0353a", ow * 0.6, 0, 360, -40);
    const dome: P2[] = [[cx + sx - 0.36 * W, crown + 0.2 * HH], [cx + sx - 0.33 * W, crown - 0.04 * HH], [cx + sx - 0.16 * W, crown - 0.13 * HH], [cx + sx + 0.16 * W, crown - 0.13 * HH], [cx + sx + 0.33 * W, crown - 0.04 * HH], [cx + sx + 0.36 * W, crown + 0.2 * HH]];
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.4 * W, 0.4); p.inkRing(dome, ow * 0.85, 0);
    p.stroke([[cx + sx - 0.35 * W, crown + 0.12 * HH], [cx + sx + 0.35 * W, crown + 0.12 * HH]], 5 * u, "#d9a640");
    p.ell(cx + sx, crown + 0.21 * HH, 0.74 * W, 0.085 * HH, col, ow * 0.85);
    return;
  }
  if (o.hat === "crown" || o.hat === "laurel" || o.hat === "hood") {
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, ow = 3.6 * u, crown = hc - H.b;
    hatOn(p, { ...o, hat: "hair", hair: o.hat === "hood" ? (o.cap ?? "#1c1824") : (o.hair ?? "#3a2a22") }, hp, H, cx, hc, light, seed, facing, side);
    const sx = side ? 6 * u : 0;
    if (o.hat === "crown") {
      const yb = crown + 0.16 * HH, w = 0.36 * W, h = 0.2 * HH, col = o.cap ?? "#f0c43c";
      const pts: P2[] = [[cx + sx - w, yb], [cx + sx - w, yb - h * 0.55]];
      for (let i = 0; i < 5; i++) { const x0 = cx + sx - w + (2 * w * i) / 4; pts.push([x0 + (i ? -0.1 : 0) * w, yb - h * 0.55]); }
      const spikes: P2[] = [[cx + sx - w, yb]];
      for (let i = 0; i <= 4; i++) { const x = cx + sx - w + (2 * w * i) / 4; spikes.push([x, yb - h]); if (i < 4) spikes.push([x + w / 4, yb - h * 0.5]); }
      spikes.push([cx + sx + w, yb]);
      p.shadedFill(spikes, col, mul(col, [0.75, 0.6, 0.4]), light, w, 0.4);
      p.poly(spikes, null, ow * 0.85);
      for (let i = 0; i <= 4; i++) p.dot(cx + sx - w + (2 * w * i) / 4, yb - h - 2 * u, 3.2 * u, i % 2 ? "#c0353a" : "#3a8fd0");
      p.dot(cx + sx, yb - 0.3 * h, 4 * u, "#c0353a");
    } else if (o.hat === "laurel") {
      const yb = crown + 0.3 * HH;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (Math.PI * i) / 8, x = cx + sx + Math.cos(a) * 0.5 * W, y = yb + Math.sin(a) * 0.12 * HH;
        p.ell(x, y, 7 * u, 3.6 * u, i % 2 ? (o.cap ?? "#5fa34a") : (o.cap ? shade(o.cap, 0.82) : "#4a8a3c"), 1.6 * u, 0, 360, (a * 180) / Math.PI + 60);
      }
    } else { // hood: dark peaked rim framing the face
      const col = o.cap ?? "#1c1824";
      if (!hatBack()) p.arc(cx + sx, hc - 0.05 * HH, 0.56 * W, 0.6 * H.b * 2 * 0.62, 190, 350, 9 * u, col);
    }
    return;
  }
  if (o.hat === "topknot" || o.hat === "jhair") {
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    const u = (2 * H.a) / 100, top = hc - H.b;
    if (o.hat === "topknot") { // chonmage: small folded topknot standing on the crown, tied with a white cord
      p.ell(cx + 2 * u, top - 3 * u, 6.5 * u, 11 * u, o.hair!, 2.2 * u);
      p.stroke([[cx - 4 * u, top + 3 * u], [cx + 8 * u, top + 3 * u]], 2.2 * u, "#f4f1ea");
    } else { // women: hair tied up in a bun with a red comb
      p.ell(cx, top - 9 * u, 24 * u, 14 * u, o.hair!, 2.4 * u);
      p.stroke([[cx - 18 * u, top - 2 * u], [cx + 18 * u, top - 2 * u]], 3.2 * u, o.cap ?? "#c0353a");
    }
    return;
  }
  if (o.hat === "slouch") { // Australian slouch hat: wide khaki felt brim, left side turned up + rising-sun badge, pinched crown, puggaree band (Emu War 2026-11-23)
    hatOn(p, { ...o, hat: "hair", hair: o.hair ?? "#5a3a24" }, hp, H, cx, hc, light, seed, facing, side);
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, ow = 3.6 * u, crown = hc - H.b, col = o.cap ?? "#8c7650", sx = side ? 6 * u : 0;
    const yb = crown + 0.24 * HH, x0 = cx + sx;
    p.ell(x0 - 0.06 * W, yb + 0.02 * HH, 0.8 * W, 0.085 * HH, mul(col, [0.9, 0.9, 0.92]), ow * 0.85);
    const dome: P2[] = [[x0 - 0.4 * W, yb], [x0 - 0.38 * W, yb - 0.22 * HH], [x0 - 0.22 * W, yb - 0.33 * HH], [x0 - 0.04 * W, yb - 0.27 * HH],
      [x0 + 0.12 * W, yb - 0.34 * HH], [x0 + 0.33 * W, yb - 0.24 * HH], [x0 + 0.4 * W, yb]];
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.42 * W, 0.4); p.inkRing(dome, ow * 0.85, 0);
    p.stroke([[x0 - 0.04 * W, yb - 0.26 * HH], [x0 - 0.02 * W, yb - 0.12 * HH]], 1.8 * u, mul(col, SH_FELT));
    p.band([[x0 - 0.4 * W, yb - 0.05 * HH], [x0 + 0.4 * W, yb - 0.05 * HH]], mix(col, "#e8dcc0", 0.35), 0.075 * HH, 1.5 * u);
    if (!hatBack() && !side) { // the turned-up left side of the brim (screen right on a front view) with the badge
      const flap: P2[] = [[x0 + 0.36 * W, yb + 0.04 * HH], [x0 + 0.7 * W, yb + 0.02 * HH], [x0 + 0.62 * W, yb - 0.36 * HH], [x0 + 0.4 * W, yb - 0.26 * HH]];
      p.shadedFill(flap, col, mul(col, SH_FELT), light, 0.4 * W, 0.4); p.inkRing(flap, ow * 0.8, 0);
      const bx = x0 + 0.52 * W, by = yb - 0.13 * HH;
      for (let i = 0; i < 7; i++) { const a = Math.PI + (Math.PI * i) / 6; p.stroke([[bx, by], [bx + Math.cos(a) * 7 * u, by + Math.sin(a) * 7 * u]], 1.6 * u, "#e2c25a"); }
      p.ell(bx, by, 3.5 * u, 3.5 * u, "#e2c25a", 0);
    }
    return;
  }
  if (o.hat === "pith") { // colonial pith helmet (sun topee): white dome, all-round brim, khaki band (Rat Tails 2026-11-22)
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u, col = o.cap ?? "#f1ead8";
    const yb = crown + 0.3 * HH, dome: P2[] = [];
    for (let i = 0; i <= 20; i++) { const a = Math.PI * (i / 20); dome.push([cx - Math.cos(a) * 0.5 * W, yb - Math.sin(a) * 0.5 * HH]); }
    const brim: P2[] = [[cx - 0.74 * W, yb + 0.07 * HH], [cx - 0.5 * W, yb - 0.04 * HH], [cx + 0.5 * W, yb - 0.04 * HH], [cx + 0.74 * W, yb + 0.07 * HH], [cx, yb + 0.13 * HH]];
    p.shadedFill(brim, col, mul(col, SH_FELT), light, 0.74 * W, 0.4); p.poly(brim, null, ow);
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.5 * W, 0.4); p.poly(dome, null, ow);
    p.band([[cx - 0.5 * W, yb - 0.06 * HH], [cx + 0.5 * W, yb - 0.06 * HH]], "#b7a27a", 0.07 * HH, 1.5 * u);
    p.dot(cx, yb - 0.5 * HH, 3.5 * u, mul(col, SH_FELT));
    return;
  }
  if (o.hat === "kabuto" || o.hat === "kasa") {
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
    if (o.hat === "kabuto") { // iron helmet bowl with ribs and a gold crescent crest
      const col = o.cap ?? "#2c2a33", yb = crown + 0.36 * HH, bowl: P2[] = [];
      for (let i = 0; i <= 18; i++) { const a = Math.PI * (i / 18); bowl.push([cx - Math.cos(a) * 0.54 * W, yb - Math.sin(a) * 0.5 * HH]); }
      p.shadedFill(bowl, col, mul(col, SH_FELT), light, 0.54 * W, 0.4);
      p.clip(bowl, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 0.13 * W, yb], [cx + i * 0.05 * W, yb - 0.5 * HH]], 1.4 * u, "#4a4652"); });
      p.poly(bowl, null, ow);
      p.band([[cx - 0.56 * W, yb], [cx + 0.56 * W, yb]], "#8a2f2a", 0.06 * HH, 1.5 * u);
      if (!hatBack()) {
        p.arc(cx, yb - 0.3 * HH, 0.36 * W, 0.34 * HH, 200, 340, 9 * u, INK);
        p.arc(cx, yb - 0.3 * HH, 0.36 * W, 0.34 * HH, 202, 338, 5.5 * u, "#e8c45a");
      }
    } else { // kasa: wide conical straw hat
      const yb = crown + 0.3 * HH, col = o.cap ?? "#d9b36a";
      const cone: P2[] = [[cx - 0.86 * W, yb], [cx, yb - 0.42 * HH], [cx + 0.86 * W, yb], [cx, yb + 0.07 * HH]];
      p.shadedFill(cone, col, mul(col, SH_FELT), light, 0.86 * W, 0.4);
      p.clip(cone, () => { for (let i = -4; i <= 4; i++) p.stroke([[cx, yb - 0.42 * HH], [cx + i * 0.2 * W, yb + 0.05 * HH]], 1.2 * u, "#a8823e"); });
      p.poly(cone, null, ow);
    }
    return;
  }
  if (o.hat === "braids") {
    for (const s of [-1, 1]) { // two braids hanging past the shoulders, ribbon at the end
      const x0 = cx + s * 0.92 * H.a, y0 = hc + 0.1 * H.b, len = 1.5 * H.b, n = 5;
      for (let i = 0; i < n; i++) p.ell(x0 + s * 2 * (i % 2), y0 + (i + 0.5) * (len / n), 0.16 * H.a, len / n * 0.62, o.hair!, 2.2 * (H.a / 50));
      p.ell(x0, y0 + len + 6, 0.2 * H.a, 0.1 * H.a, o.cap ?? "#c0353a", 2 * (H.a / 50));
    }
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    return;
  }
  if (o.hat === "hairband" || o.hat === "longhair") {
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    if (o.hat === "hairband") {
      const yb = hc - H.b + 0.36 * 2 * H.b;
      p.clip(hp, () => p.band([[cx - 2 * H.a, yb], [cx + 2 * H.a, yb]], o.cap ?? "#c0353a", 0.11 * 2 * H.b, 0.025 * H.a));
    }
    return;
  }
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5)); // tilt with the head, +-2 deg extra
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = (a * 180) / Math.PI;
    if (side) {
      p.poly(R([[cx + 34 * u, yb - 2 * u], [cx + 52 * u, yb + 4 * u], [cx + 50 * u, yb + 8 * u], [cx + 32 * u, yb + 7 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else if (hatBack()) {
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // back view: only the tuft, no peak or badge
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg); // peak
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg); // badge plate
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // green tuft
    }
  } else if (o.hat === "cap" || o.hat === "hair") {
    const cut = crown + (o.hat === "cap" ? 0.3 : 0.31) * HH; // hairline above the brows (0.42 put it on the eye line: brows sat on the hair)
    // hair wraps the back of the head: everything behind the projected azimuth 100 deg from the face (turned views),
    // down to the nape; the old profile rule (x < cx - 6u) for side views
    const xb = HAT_YAW > 4 ? cx + H.a * Math.sin(rad(HAT_YAW - 100)) : cx - 6 * u;
    const wrap = o.hat === "hair" && (side || HAT_YAW > 4);
    const keep = (x: number, y: number) => y < cut || (wrap && x < xb && y < hc + (hatBack() ? 0.55 : HAT_YAW >= 75 ? 0.42 : 0.12) * H.b); // shallow wrap at 3/4: hair behind the temple, not over the cheek
    // start the arc at the first kept point after a dropped one, so the kept run is contiguous and the cut closes it
    const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y))
      .map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (wrap) { // turned / side: go up the back edge to the hairline before closing along it (2026-11-21 fix)
      const [lx, ly] = arc[arc.length - 1];
      if (ly > cut + 2 * u) arc.push([lx, cut]);
    }
    if (o.hat === "hair") { // scalloped lower edge
      const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
      for (let i = 1; i < 6; i++) arc.push([x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    if (o.hat === "hair" && !side && HAT_YAW <= 4) {
      const s = facing || 1;
      p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
    }
    if (o.hat === "cap") {
      const deg = (a * 180) / Math.PI;
      if (side) p.poly(R([[cx + 38 * u, cut - 3 * u], [cx + 58 * u, cut + 3 * u], [cx + 56 * u, cut + 7 * u], [cx + 38 * u, cut + 7 * u]]), shade(col, 0.8), ow);
      else if (!hatBack()) {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "sombrero") {
    const yb = crown + 0.3 * HH, col = o.cap ?? "#c9a25a", deg = (a * 180) / Math.PI;
    const dome = R([[cx - 0.3 * W, yb], [cx - 0.26 * W, yb - 0.42 * HH], [cx, yb - 0.56 * HH], [cx + 0.26 * W, yb - 0.42 * HH], [cx + 0.3 * W, yb]]);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.95 * W, 0.11 * HH, col, ow, 0, 360, deg);                      // wide brim
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.3 * W, 0.4);
    p.poly(dome, null, ow);
    p.clip(dome, () => p.band(R([[cx - 0.4 * W, yb - 0.1 * HH], [cx + 0.4 * W, yb - 0.1 * HH]]), "#7a2a26", 0.08 * HH, 0.8 * u));
    p.ell(bx, by, 0.95 * W, 0.11 * HH, null, ow * 0.8, 0, 180, deg);                 // brim front edge over the dome base
  } else if (o.hat === "chef") {
    const yb = crown + 0.26 * HH, col = "#fbf8f0", deg = (a * 180) / Math.PI;
    const band = R([[cx - 0.36 * W, yb], [cx - 0.36 * W, yb - 0.2 * HH], [cx + 0.36 * W, yb - 0.2 * HH], [cx + 0.36 * W, yb]]);
    for (const [dx, dy, r] of [[-0.26, -0.42, 0.24], [0.26, -0.42, 0.24], [0, -0.55, 0.28]] as const) {
      const [px, py] = R([[cx + dx * W, yb + dy * HH]])[0];
      p.ell(px, py, r * W, r * W * 0.92, col, ow, 0, 360, deg);
    }
    p.shadedFill(band, col, mul(col, SH_CLOTH), light, 0.36 * W, 0.4);
    p.poly(band, null, ow);
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    if (hatBack()) { // seen from behind: the bonnet's crown seam + a ribbon bow and its ties at the nape
      p.arc(cx, hc - 0.05 * HH, 0.36 * W, 0.3 * HH, 200, 340, 1.6 * u, shade(BONNET, 0.75));
      const ny = hc + 0.42 * H.b, rc = o.cap ?? "#c0353a";
      for (const s of [-1, 1]) {
        p.poly([[cx, ny], [cx + s * 16 * u, ny - 9 * u], [cx + s * 16 * u, ny + 9 * u]], rc, 2 * u);
        p.poly([[cx + s * 2 * u, ny + 3 * u], [cx + s * 9 * u, ny + 34 * u], [cx + s * 3 * u, ny + 32 * u]], rc, 1.8 * u);
      }
      p.ell(cx, ny, 4.5 * u, 4.5 * u, rc, 2 * u);
      return;
    }
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  }
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
export type Prop = null | "hold" | "icecream" | "icecream_drip" | "cone" | "shako" | "lift" | "shrug" | "clipboard" | "book" | ["bolt", number] | ["hammer", number] | ["fan", number] | ["katana", number] | ["cloth", number] | ["axe", number] | ["whip", number] | "drumstick" | "wheat" | "coinbag" | "scroll";

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 134, torso: 1.02, legs: 0.98, tw: 0.8 },
  stout: { a: 136, torso: 1.06, legs: 0.92, tw: 0.94 },
  kid: { a: 128, torso: 0.78, legs: 0.74, tw: 0.74 },
};

export type FrontOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
  /** turn (deg) relative to the camera: 0 = facing the lens, 90 = profile facing screen-right, 180 = back to the lens,
   *  negative = turned toward screen-left (bodyTurn mirrors the card). Set by cast.ts from the character's world
   *  heading; bodyFront itself draws 0..180. Quantise (cast.ts uses 5 deg steps). 2026-11-21. */
  yaw?: number;
  /** reveal plan: 0 = normal .. 1 = flat silhouette (identity hidden until the reveal word); quantise animated values
   *  (Math.round(k * 8) / 8). `silCol` = the silhouette colour (default deep plum ink). */
  sil?: number; silCol?: string;
};

/** darken everything already drawn on this card to a flat silhouette (source-atop keeps the cut-out shape) */
export const silhouette = (p: Pen, k: number, col = "#160f1c") => {
  if (!(k > 0)) return;
  const g = p.g;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.globalAlpha = Math.min(1, k);
  g.fillStyle = col;
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  g.restore();
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

/** a small family crest (five-lobed, like the Oda mokko) */
const crestAt = (p: Pen, x: number, y: number, r: number, col: string) => {
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; p.ell(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.42, col, r * 0.12, 0, 360, (a * 180) / Math.PI); }
  p.dot(x, y, r * 0.22, INK);
};
export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave,
    light = DEF_LIGHT, seed = 1 } = opts;
  // ---- turn (2026-11-21): yaw 0..180 toward screen-right. Outlines keep their shape (narrower torso), surface details
  // (buttons, belts, face) slide round the body, limbs swing in toward the centre line, the near arm comes in front
  // of the torso, the far leg darkens. Legacy `facing` still works when yaw is unset.
  const turned = opts.yaw !== undefined && opts.yaw > 4, Y = turned ? clamp(opts.yaw!, 0, 180) : 0;
  const yr = rad(Y), sy = Math.sin(yr), cyw = Math.cos(yr), back = Y > 105;
  const facing = turned ? (Y < 172 ? 1 : 0) : (opts.facing ?? 0);
  const m = !turned ? 1 : cyw >= 0 ? Math.max(cyw, 0.3) : Math.min(cyw, -0.3); // limb x squeeze about the centre line
  HAT_YAW = turned ? Y : 0;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H0 = headBlob(seed, Bd.a, facing), H = turned ? { ...H0, rot: H0.rot + rad(7 * sy * Math.max(0, cyw) + 3 * sy) } : H0;
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const hx0 = 300 + (turned ? 4 * u * sy : 0);
  const LX = (x: number) => 300 + (x - 300) * m;
  /** toe stroke for a foot at (fx, fy): outward in front, forward (screen-right) as the body turns */
  const toe = (side: number, fx: number, fy: number, len = 13): [P2, P2] => {
    if (!turned) return [[fx - side * 3 * u, fy], [fx + side * len * u, fy + 0.5 * u]];
    const dx = side * len * u * cyw * 0.8 + (len + 3) * u * sy;
    return [[fx - 3 * u * Math.sign(dx || side), fy], [fx + dx, fy + 0.5 * u]];
  };
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  // body bob 5 % (march) / 3 % (stroll) of the height, lowest at contact (phase 0 and 0.5)
  const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 3.6 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = o.bare ? mul(skin, [0.92, 0.9, 0.9]) : mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;
  /** near / far shading of a limb on `side` (-1 = screen-left in the front view): the far one darkens as the body turns */
  const farOf = (side: number) => turned && -side * sy < -0.3;
  const legOf = (side: number) => (farOf(side) ? mix(o.pants, INK, 0.72) : legCol);
  const bootOf = (side: number) => (farOf(side) && footCol !== INK ? shade(footCol, 0.82) : footCol);
  const LP = (q: P2): P2 => [LX(q[0]), q[1]];
  // ---- legs + feet (not rotated); far leg first ----
  p.rot = null;
  const legOrder = turned && sy > 0.3 ? [1, -1] : [-1, 1];
  if (mode === "sit") {
    for (const side of legOrder) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH], f: P2 = [300 + side * 44 * u, sole - 8 * u];
      p.stroke(curve(LP(h), LP(k), LP(f)), legW, legOf(side));
      const [a, b] = turned ? toe(side, LX(f[0]), f[1], 12) : [[f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u]] as [P2, P2];
      footStroke(p, a, b, footW, bootOf(side));
    }
  } else if (mode === "fall") {
    const legs: [P2, P2, P2][] = [
      [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
      [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]],
    ];
    legs.forEach(([h, k, f], i) => {
      p.stroke(curve(LP(h), LP(k), LP(f)), legW, legCol);
      footStroke(p, LP(f), [LX(f[0]) + (i ? 14 : -14) * u * m, f[1] + (i ? -6 : 4) * u], footW, footCol);
    });
  } else if (o.dress) {
    for (const side of legOrder) {
      const fx = LX(300 + side * 12 * u), fy = sole - 4 * u;
      p.stroke([[fx, sole - 0.4 * HH], [fx + side * u * m, fy]], legW, legOf(side));
      const [a, b] = toe(side, fx, fy, 12);
      footStroke(p, a, b, footW, bootOf(side));
    }
  } else {
    const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
    for (const side of legOrder) {
      const ph = side < 0 ? 0 : 0.5;
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      // turned walkers also stride: the lifted foot swings forward (screen-right) a little
      const fwd = turned ? sy * 0.35 * L * Math.sin(two * (phase + ph)) : 0;
      const hx = LX(300 + side * 15 * u), fx = LX(300 + side * 22 * u) + fwd, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * m * (1.5 * u + up * 0.16) + 0.3 * up * sy, (hipY + fy) / 2 - up * 0.08];
      p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legOf(side));
      const [a, b] = toe(side, fx, fy);
      footStroke(p, a, b, footW, bootOf(side));
    }
  }
  // ---- upper body: rotates about the hips (tilt + a small weight-shift sway on every step) ----
  const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const dress = !!o.dress && mode !== "sit" && mode !== "fall";
  const T: Blob = { a: (((Bd.tw / 2) * W) / 1.06) * (1 - 0.25 * Math.abs(sy)), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: turned ? 0.07 * sy : 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + (turned ? 3 * u * sy : 3 * u * facing), tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  /** a point on the FRONT of the torso (x in the front view) carried round the turn; z < 0 = on the back, hidden */
  const TS = (x: number) => { const ph = Math.asin(clamp((x - tcx) / T.a, -1, 1)); return turned ? tcx + T.a * Math.sin(ph + yr) : x; };
  const showFront = !turned || cyw > 0.08;
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // rifle at the order: butt by the right hip, held by the hanging right hand, muzzle past the crown
  const R0: P2 = [300 + 47 * u, torsoBot + 0.12 * HH], R1: P2 = [300 + 64 * u, crown - 0.32 * HH];
  const rifle = (!!o.rifle || !!o.spear) && (mode === "march" || mode === "stand" || mode === "stroll");
  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  if (mode === "sit") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  if (mode === "sit" && wave !== undefined) { // sit + wave: right hand raised (a seated king commanding; Canute 2026-11-20)
    const S = sh(1);
    arms[1] = { pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false };
  }
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else {
    arms.push({ pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw), front: false });
    if (rifle) {
      const G = lerp2(R0, R1, 0.1);
      arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
    } else if (wave !== undefined) {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false });
    } else if (prop === "drumstick") { // held up beside the face, clear of a beard
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.2 * T.a + 12 * u, S[1] + 0.12 * HH], [tcx + 1.05 * T.a + 10 * u, S[1] - 0.28 * HH]], front: true });
    } else if (prop === "icecream" || prop === "icecream_drip" || prop === "cone" || prop === "book" || prop === "wheat" || prop === "coinbag" || prop === "scroll") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 8 * u, S[1] + 0.3 * HH], [tcx + 0.62 * T.a, S[1] - 0.02 * HH]], front: true });
    } else if (Array.isArray(prop) && prop[0] === "fan") {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      arms.push({ pts: [S, [tcx + 1.15 * T.a + 8 * u, S[1] + 0.18 * HH], [tcx + 0.9 * T.a + 4 * u + 8 * u * k, S[1] - 0.22 * HH]], front: true });
    } else if (Array.isArray(prop)) {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
      const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else arms.push({ pts: hang(1, sw), front: false });
  }
  if (prop === "clipboard") { // held in the right hand, the board out beside the body (not across the chest)
    const S = sh(1);
    arms[1] = { pts: [S, [tcx + (1.15 * T.a + 12 * u), S[1] + 0.35 * HH], [tcx + (1.05 * T.a + 6 * u), S[1] + 0.62 * HH]], front: true };
  }
  if (prop === "hold") { // both hands together in front of the chest (an object drawn as its own fx card in front)
    arms.length = 0;
    for (const side of [-1, 1]) { const S = sh(side); arms.push({ pts: [S, [tcx + side * (1.12 * T.a + 6 * u), S[1] + 0.34 * HH], [tcx + side * 0.3 * T.a, S[1] + 0.2 * HH]], front: true }); }
  }
  if (prop === "lift" || prop === "shrug") {
    arms.length = 0;
    for (const side of [-1, 1]) {
      const S = sh(side);
      arms.push(prop === "lift"
        ? { pts: [S, [tcx + side * (1.15 * T.a + 8 * u), S[1] - 0.35 * HH], [tcx + side * (0.7 * T.a), S[1] - 0.95 * HH]], front: false }
        : { pts: [S, [tcx + side * (1.25 * T.a + 10 * u), S[1] + 0.32 * HH], [tcx + side * (1.7 * T.a + 22 * u), S[1] - 0.12 * HH]], front: false });
    }
  }
  // turned: arms swing in toward the centre line (mirrored in back views); the near arm (screen-left when turned
  // right) comes in front of the torso, the far arm stays behind and darkens
  const armSide = new Map<Arm, number>(), propArm = new Set(arms.filter((a) => a.front)); // only these hold the prop
  arms.forEach((a, i) => armSide.set(a, arms.length === 2 ? (i ? 1 : -1) : Math.sign(a.pts[0][0] - tcx) || 1));
  if (turned) for (const a of arms) {
    a.pts = a.pts.map(([x, y]) => [tcx + (x - tcx) * m, y] as P2) as [P2, P2, P2];
    if (-armSide.get(a)! * sy > 0.35) a.front = true;
  }
  const MX = (q: P2): P2 => (turned ? [tcx + (q[0] - tcx) * m, q[1]] : q);
  const drawArm = (a: Arm) => {
    const far = turned && -armSide.get(a)! * sy < -0.35;
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, far ? mix(armCol, INK, 0.35) : armCol); p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
  };
  // behind the body: rifle, sword, arms
  if (rifle && o.spear) {
    const r0 = MX(R0), r1 = MX(R1), tip: P2 = [r1[0] + 2 * u, r1[1] - 0.1 * HH];
    p.band([r0, r1], "#8a5a34", 4 * u, 1.4 * u, "round");
    p.poly([[r1[0] - 7 * u, r1[1] + 4 * u], [tip[0], tip[1] - 22 * u], [r1[0] + 9 * u, r1[1] + 4 * u]], "#2a2633", 2 * u);
  } else if (rifle) {
    const r0 = MX(R0), r1 = MX(R1);
    p.band([r0, r1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(r0, r1, 0.6), r1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.sword && mode !== "sit") {
    const s0f: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
    const s1f: P2 = o.scabbard ? [s0f[0] - Math.cos(rad(18)) * 0.95 * HH, s0f[1] + Math.sin(rad(18)) * 0.95 * HH] : [s0f[0] - Math.sin(rad(25)) * 0.8 * HH, s0f[1] + Math.cos(rad(25)) * 0.8 * HH];
    const s0 = MX(s0f), s1 = MX(s1f);
    p.band([s0, s1], o.scabbard ? "#2a2028" : "#c9ccd2", o.scabbard ? 4.2 * u : 3 * u, 1.2 * u, "round");
    if (o.scabbard) p.band([s0, MX([s0f[0] + Math.cos(rad(18)) * 0.28 * HH, s0f[1] - Math.sin(rad(18)) * 0.28 * HH])], "#b8a07a", 3.6 * u, 1.2 * u, "round");
  }
  for (const a of arms) if (!a.front) drawArm(a);
  if (back) frontArms();
  // torso / dress: shaded fill -> clothing clipped to it -> thick-thin ink ring. Turned: front details ride round the
  // body with TS() and vanish on the back (showFront)
  const TP = (x: number, y: number): P2 => [TS(x), y];
  const collar = (cx0: number) => {
    p.band([TP(cx0 - 16 * u, chin - 0.02 * HH), TP(cx0 + 10 * u, chin + 0.36 * HH)], mix(o.jacket, "#f4f1ea", 0.75), 4.5 * u, 1.2 * u);
    p.band([TP(cx0 + 16 * u, chin - 0.02 * HH), TP(cx0 - 4 * u, chin + 0.26 * HH)], mix(o.jacket, "#f4f1ea", 0.75), 4.5 * u, 1.2 * u);
  };
  if (dress) {
    const dcx = turned ? tcx : 300;
    const D: Blob = { a: 0.5 * W * 0.98 * (1 - 0.2 * Math.abs(sy)), b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: turned ? 0.05 * sy : 0.03 * facing, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(dcx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, o.dress!, mul(o.dress!, SH_CLOTH), light);
    p.inkRing(dp, ow, thick);
    const Sw: Blob = { a: 0.37 * W * (1 - 0.2 * Math.abs(sy)), b: 0.3 * HH, nTop: 2.2, nBot: 2.4, egg: 0.1, asym: 0, rot: 0, noise: 0.006, seed: seed + 8 };
    const sp = blobPts(dcx, chin + 0.12 * HH, Sw);
    p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    if (!o.bare && showFront) p.clip(sp, () => collar(tcx)); // crossed kimono collar
    p.inkRing(sp, ow * 0.9, thick);
    if (o.sash) p.clip(dp, () => p.band([[dcx - W, chin + 0.42 * HH], [dcx + W, chin + 0.42 * HH]], o.sash!, 0.11 * HH, 1.6 * u));
    if (o.crest && showFront) crestAt(p, TS(tcx + 0.22 * W), chin + 0.22 * HH, 8 * u, o.crest);
  } else {
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.belt) {
        for (const s of [-1, 1]) p.band([TP(tcx - s * 0.75 * T.a, chin - 0.05 * HH), TP(tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH)], o.belt!, 5.5 * u, 1.8 * u);
        const xc = TS(tcx + 0.025 * T.a), yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
        if (showFront) p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
      }
      if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      if (!o.bare && !o.dress && showFront) for (let i = 0; i < 4; i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        const bx = turned ? TS(tcx) : tcx + 2 * u * facing;
        p.dot(bx, y, 2.2 * u + 0.8 * u, INK); p.dot(bx, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.dress && !o.bare && showFront) p.clip(tp, () => collar(tcx)); // seated kimono: the same crossed collar as standing
    if (o.crest && showFront) crestAt(p, TS(tcx + 0.5 * T.a), chin + 0.3 * HH, 8 * u, o.crest);
    if (o.bare && showFront) { p.arc(TS(tcx - 0.3 * T.a), chin + 0.3 * HH, 0.28 * T.a * Math.max(0.5, cyw), 0.1 * HH, 20, 160, 1.6 * u, mul(skin, [0.6, 0.55, 0.55])); p.arc(TS(tcx + 0.3 * T.a), chin + 0.3 * HH, 0.28 * T.a * Math.max(0.5, cyw), 0.1 * HH, 20, 160, 1.6 * u, mul(skin, [0.6, 0.55, 0.55])); p.dot(TS(tcx), torsoBot - 0.3 * HH, 1.8 * u, mul(skin, [0.55, 0.5, 0.5])); }
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
  }
  // in front of the body: hands holding props (a back view draws them first, so the torso hides what is held at the chest)
  function frontArms() { for (const a of arms) if (a.front) {
    drawArm(a);
    if (!propArm.has(a)) continue; // a near arm turned to the front holds nothing
    const [hx, hy] = a.pts[2];
    if (prop === "clipboard" || prop === "book") {
      if (prop === "clipboard") {
        const u0 = u, hxo = hx; { const u = u0 * 1.4, hx = hxo + 28 * u;
        p.poly([[hx - 26 * u, hy - 44 * u], [hx + 22 * u, hy - 44 * u], [hx + 22 * u, hy + 22 * u], [hx - 26 * u, hy + 22 * u]], "#9a6a3c", 2.6 * u);
        p.poly([[hx - 21 * u, hy - 38 * u], [hx + 17 * u, hy - 38 * u], [hx + 17 * u, hy + 17 * u], [hx - 21 * u, hy + 17 * u]], "#f6f2e6", 1.4 * u);
        for (let i = 0; i < 4; i++) p.stroke([[hx - 16 * u, hy - 26 * u + i * 10 * u], [hx + 11 * u - (i % 2) * 8 * u, hy - 26 * u + i * 10 * u]], 1.6 * u, "#8a8fa0");
        p.poly([[hx - 9 * u, hy - 49 * u], [hx + 5 * u, hy - 49 * u], [hx + 5 * u, hy - 40 * u], [hx - 9 * u, hy - 40 * u]], "#c9ccd2", 1.8 * u);
        p.stroke([[hx - 14 * u, hy - 30 * u], [hx - 11 * u, hy - 27 * u], [hx - 6 * u, hy - 33 * u]], 1.8 * u, "#c0353a"); }
      } else {
        p.poly([[hx - 30 * u, hy - 30 * u], [hx, hy - 24 * u], [hx, hy + 14 * u], [hx - 30 * u, hy + 8 * u]], "#f4efe0", 2.2 * u);
        p.poly([[hx, hy - 24 * u], [hx + 30 * u, hy - 30 * u], [hx + 30 * u, hy + 8 * u], [hx, hy + 14 * u]], "#f4efe0", 2.2 * u);
        for (let i = 0; i < 3; i++) { p.stroke([[hx - 25 * u, hy - 18 * u + i * 9 * u], [hx - 5 * u, hy - 14 * u + i * 9 * u]], 1.3 * u, "#9a96a6"); p.stroke([[hx + 5 * u, hy - 14 * u + i * 9 * u], [hx + 25 * u, hy - 18 * u + i * 9 * u]], 1.3 * u, "#9a96a6"); }
      }
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "bolt") {
      const ang = rad(-20 + 60 * clamp(prop[1], 0, 1)), Rh = (pts: P2[]) => rotPts(pts.map(([x, y]) => [hx + (x - hx) * 2.2, hy + (y - hy) * 2.2] as P2), ang, hx, hy);
      p.poly(Rh([[hx - 4 * u, hy + 18 * u], [hx + 10 * u, hy - 30 * u], [hx - 2 * u, hy - 30 * u], [hx + 14 * u, hy - 80 * u], [hx - 12 * u, hy - 26 * u], [hx + 1 * u, hy - 26 * u], [hx - 14 * u, hy + 18 * u]]), "#ffe066", 2.4 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "icecream" || prop === "icecream_drip" || prop === "cone") {
      const k2 = 2.2;
      p.poly([[hx - 8 * k2 * u, hy - 12 * k2 * u], [hx + 8 * k2 * u, hy - 12 * k2 * u], [hx, hy + 7 * u]], "#e0a35a", 2.4 * u);
      for (const o of [-1, 1]) p.stroke([[hx - 6 * k2 * u, hy - (8 + 3 * o) * k2 * u], [hx + 4 * k2 * u, hy - (1 + 3 * o) * k2 * u]], 1.4 * u, "#a8723a");
      if (prop !== "cone") {
        p.ell(hx, hy - 19 * k2 * u, 11 * k2 * u, 10 * k2 * u, "#f7c6d9", 2.8 * u);
        p.ell(hx - 4 * k2 * u, hy - 23 * k2 * u, 3.5 * k2 * u, 2.5 * k2 * u, "#fde3ee", 0);
        if (prop === "icecream_drip") for (const [dx, l] of [[-7, 14], [1, 20], [7, 10]]) {
          p.line([[hx + dx * k2 * u, hy - 14 * k2 * u], [hx + dx * k2 * u, hy - (14 - l) * k2 * u]], "#f7c6d9", 3.2 * k2 * u, false);
          p.dot(hx + dx * k2 * u, hy - (14 - l) * k2 * u, 2.4 * k2 * u, "#f7c6d9");
        }
      }
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "fan") {
      const ang = rad(-35 + 70 * clamp(prop[1], 0, 1)), Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      const fp: P2[] = [[hx, hy]];
      for (let i = 0; i <= 10; i++) { const a = rad(-150 + 120 * (i / 10)); fp.push([hx + Math.cos(a) * 34 * u, hy + Math.sin(a) * 34 * u]); }
      p.poly(Rh(fp), "#f2c230", 2 * u);
      for (let i = 1; i < 6; i++) { const a = rad(-150 + 120 * (i / 6)); p.stroke(Rh([[hx, hy], [hx + Math.cos(a) * 33 * u, hy + Math.sin(a) * 33 * u]]), 1.3 * u, "#c0453a"); }
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "katana") {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1)), Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 14 * u], [hx, hy - 6 * u]]), "#2a2028", 5 * u, 1.5 * u, "round");
      p.band(Rh([[hx - 7 * u, hy - 7 * u], [hx + 7 * u, hy - 7 * u]]), "#b8a07a", 3 * u, 1 * u, "round");
      p.poly(Rh([[hx - 3 * u, hy - 9 * u], [hx + 3 * u, hy - 9 * u], [hx + 6 * u, hy - 140 * u], [hx - 1 * u, hy - 158 * u], [hx - 3 * u, hy - 140 * u]]), "#e8ecf2", 2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "cloth") {
      const k = clamp(prop[1], 0, 1), cx2 = hx + 6 * u - 10 * u * k, cy2 = hy + 4 * u;
      p.dot(hx, hy, 5.5 * u);
      p.poly([[cx2 - 20 * u, cy2 - 14 * u], [cx2 - 2 * u, cy2 - 19 * u], [cx2 + 21 * u, cy2 - 12 * u], [cx2 + 16 * u, cy2 + 8 * u], [cx2 + 22 * u, cy2 + 22 * u], [cx2 - 4 * u, cy2 + 17 * u], [cx2 - 19 * u, cy2 + 21 * u], [cx2 - 15 * u, cy2 + 2 * u]], "#efe9da", 2 * u);
      p.stroke([[cx2 - 12 * u, cy2 - 8 * u], [cx2 + 4 * u, cy2 + 10 * u]], 1.4 * u, "#c9c0aa");
      p.stroke([[cx2 + 2 * u, cy2 - 12 * u], [cx2 + 14 * u, cy2 + 4 * u]], 1.4 * u, "#c9c0aa");
    } else if (Array.isArray(prop) && prop[0] === "axe") {
      // big woodcutter's axe: k 0 = raised over the shoulder .. 1 = swung forward (drawn 2x for phone size)
      const ang = rad(-75 + 120 * clamp(prop[1], 0, 1)), S = 1.9;
      const Rh = (pts: P2[]) => rotPts(pts.map(([x, y]) => [hx + (x - hx) * S, hy + (y - hy) * S] as P2), ang, hx, hy);
      p.band(Rh([[hx, hy + 14 * u], [hx, hy - 62 * u]]), "#9a6a3c", 5.5 * u, 1.6 * u, "round");
      p.poly(Rh([[hx - 3 * u, hy - 50 * u], [hx + 24 * u, hy - 64 * u], [hx + 28 * u, hy - 44 * u], [hx + 22 * u, hy - 30 * u], [hx - 3 * u, hy - 40 * u]]), "#b9c0c8", 2.2 * u);
      p.stroke(Rh([[hx + 26 * u, hy - 62 * u], [hx + 30 * u, hy - 44 * u], [hx + 24 * u, hy - 32 * u]]), 1.6 * u, "#eef2f6");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "drumstick") {
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "wheat") {
      p.band([[hx, hy + 30 * u], [hx + 4 * u, hy - 90 * u]], "#c99a3a", 3.2 * u, 1 * u, "round");
      for (const dx of [-14, 0, 14]) {
        p.stroke([[hx, hy - 40 * u], [hx + dx * u, hy - 92 * u]], 2.2 * u, "#a87a2a");
        for (let k = 0; k < 5; k++) p.ell(hx + dx * u + (k % 2 ? 4 : -4) * u, hy - 96 * u - k * 9 * u, 4.5 * u, 7 * u, "#f0c24a", 1.4 * u, 0, 360, k % 2 ? 25 : -25);
      }
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "coinbag") {
      p.ell(hx, hy + 22 * u, 22 * u, 20 * u, "#a8743e", 2.4 * u);
      p.poly([[hx - 8 * u, hy + 4 * u], [hx + 8 * u, hy + 4 * u], [hx + 12 * u, hy - 6 * u], [hx - 12 * u, hy - 6 * u]], "#a8743e", 2 * u);
      p.stroke([[hx - 9 * u, hy + 4 * u], [hx + 9 * u, hy + 4 * u]], 3 * u, "#6a4424");
      p.ell(hx, hy + 24 * u, 7 * u, 7 * u, "#f0c43c", 1.6 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "scroll") {
      p.poly([[hx - 6 * u, hy - 78 * u], [hx + 62 * u, hy - 72 * u], [hx + 62 * u, hy + 14 * u], [hx - 6 * u, hy + 8 * u]], "#f4ead2", 2.4 * u);
      for (let i = 0; i < 5; i++) p.stroke([[hx + 6 * u, hy - 62 * u + i * 13 * u], [hx + 52 * u, hy - 59 * u + i * 13 * u]], 1.8 * u, "#9a8a70");
      p.ell(hx - 6 * u, hy - 32 * u, 7 * u, 44 * u, "#d8c8a4", 2.4 * u);
      p.stroke([[hx + 40 * u, hy + 8 * u], [hx + 36 * u, hy + 30 * u]], 3 * u, "#c0353a"); p.stroke([[hx + 46 * u, hy + 8 * u], [hx + 50 * u, hy + 28 * u]], 3 * u, "#c0353a");
      p.ell(hx + 43 * u, hy + 6 * u, 11 * u, 11 * u, "#c0353a", 2.4 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "whip") { // riding whip: a thin crop + a curling lash
      const ang = rad(-80 + 120 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 8 * u], [hx, hy - 80 * u]]), "#5a3a24", 6 * u, 1.8 * u, "round");
      const lk = clamp(prop[1], 0, 1), sw = 1 - 2 * lk;
      p.stroke(Rh(curve([hx, hy - 80 * u], [hx + 30 * u * sw, hy - 108 * u], [hx + 12 * u * sw, hy - 138 * u], 10)), 4 * u, INK);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop)) {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  };
  if (!back) frontArms();
  if (prop === "shako") { // carried by the left hand
    const [hx, hy] = arms[0].pts[2];
    p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
    p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  // ---- head: rotates with the body, plus its own tilt about the chin ----
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  const hside = turned && Y >= 65 && Y <= 115; // profile-style hat details (peak to the side)
  hatBehind(p, o, H, hx0, hc, light, thick, ow, hside);
  const hp = blobPts(hx0, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx0, hc, light, seed, facing, hside);
  // back view: hoods, long hair and bonnets cover the back of the head
  if (back && (o.hat === "hood" || o.hat === "longhair" || o.hat === "bonnet")) hatBehind(p, o, H, hx0, hc, light, thick, ow, false);
  if (o.beard && !back) {
    const fx = turned ? hx0 + 0.62 * H.a * sy : 300 + 7 * u * facing, bq = turned ? 0.55 + 0.45 * Math.max(0, cyw) : 1;
    const bpts0: P2[] = [[fx - 46 * u, hc + 2 * u], [fx - 30 * u, hc + 18 * u], [fx - 12 * u, hc + 28 * u], [fx + 12 * u, hc + 28 * u], [fx + 30 * u, hc + 18 * u], [fx + 46 * u, hc + 2 * u],
      [fx + 44 * u, hc + 40 * u], [fx + 26 * u, hc + 62 * u], [fx + 10 * u, hc + 70 * u], [fx, hc + 80 * u], [fx - 10 * u, hc + 70 * u], [fx - 26 * u, hc + 62 * u], [fx - 44 * u, hc + 40 * u]];
    const bpts = bpts0.map(([x, y]) => [fx + (x - fx) * bq, y] as P2);
    p.shadedFill(bpts, o.beard, mul(o.beard, SH_FELT), light, H.a, 0.35);
    p.inkRing(bpts, ow * 0.8, thick);
    p.stroke([[fx - 8 * u, hc + 50 * u], [fx - 4 * u, hc + 64 * u]], 1.4 * u, mul(o.beard, [0.7, 0.7, 0.7]));
    p.stroke([[fx + 10 * u, hc + 46 * u], [fx + 6 * u, hc + 60 * u]], 1.4 * u, mul(o.beard, [0.7, 0.7, 0.7]));
  }
  if ((o.tie || o.badge) && showFront) { // office necktie under the beard + ID badge on a lanyard (drawn over the torso)
    const ty = o.beard ? hc + 74 * u : chin + 0.02 * HH, tb = chin + 0.66 * HH;
    const g = p.g, ox = turned ? TS(tcx) - 300 : 0, q = turned ? Math.max(0.45, cyw) : 1; // slide round the turn, narrow
    const [qx, qy] = p.P(300 + ox, chin);
    g.save(); g.translate(qx, qy); g.scale(q, 1); g.translate(-qx, -qy); g.translate(ox, 0);
    if (o.badge) {
      const bx = 300 + 0.2 * W, by = chin + 0.4 * HH;
      p.stroke([[300 - 0.16 * W, chin + 0.02 * HH], [bx - 9 * u, by - 12 * u]], 1.8 * u, "#2f5fb0");
      p.stroke([[300 + 0.16 * W, chin + 0.02 * HH], [bx + 9 * u, by - 12 * u]], 1.8 * u, "#2f5fb0");
      p.poly([[bx - 15 * u, by - 12 * u], [bx + 15 * u, by - 12 * u], [bx + 15 * u, by + 26 * u], [bx - 15 * u, by + 26 * u]], "#f8f6ee", 2 * u);
      p.poly([[bx - 15 * u, by - 12 * u], [bx + 15 * u, by - 12 * u], [bx + 15 * u, by - 3 * u], [bx - 15 * u, by - 3 * u]], "#2f5fb0", 0);
      p.ell(bx, by + 7 * u, 6 * u, 6 * u, "#d8c0a0", 1.2 * u);
      p.stroke([[bx - 10 * u, by + 19 * u], [bx + 10 * u, by + 19 * u]], 2 * u, "#7a8090");
    }
    if (o.tie) {
      p.poly([[300 - 9 * u, ty], [300 + 9 * u, ty], [300 + 6 * u, ty + 13 * u], [300 - 6 * u, ty + 13 * u]], o.tie, 2.2 * u);
      p.poly([[300 - 6 * u, ty + 13 * u], [300 + 6 * u, ty + 13 * u], [300 + 15 * u, tb - 14 * u], [300, tb], [300 - 15 * u, tb - 14 * u]], o.tie, 2.4 * u);
      p.stroke([[300 - 8 * u, ty + 34 * u], [300 + 9 * u, ty + 26 * u]], 2.2 * u, mul(o.tie, [0.7, 0.7, 0.7]));
      p.stroke([[300 - 11 * u, ty + 62 * u], [300 + 12 * u, ty + 54 * u]], 2.2 * u, mul(o.tie, [0.7, 0.7, 0.7]));
    }
    g.restore();
  }
  if (o.stone) { // cracks over the turned-to-stone body
    const C = "#4a4652";
    p.stroke([[300 - 0.3 * W, chin + 0.2 * HH], [300 - 0.1 * W, chin + 0.5 * HH], [300 - 0.22 * W, chin + 0.9 * HH]], 2.4 * u, C);
    p.stroke([[300 + 0.25 * W, chin + 0.35 * HH], [300 + 0.05 * W, chin + 0.7 * HH], [300 + 0.2 * W, chin + 1.3 * HH]], 2.4 * u, C);
    p.stroke([[300 - 0.05 * W, hc - 0.6 * H.b], [300 + 0.12 * W, hc - 0.2 * H.b]], 2 * u, C);
  }
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "hairband" && o.hat !== "longhair" && o.hat !== "braids" && o.hat !== "topknot" && o.hat !== "jhair";
  faceFront(p, hx0, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout", turned ? Y : undefined);
  p.rot = null;
  HAT_YAW = 0;
  silhouette(p, opts.sil ?? 0, opts.silCol);
};

/** Any facing (2026-11-21): `opts.yaw` in degrees relative to the camera (-180..180; 0 = facing the lens, +90 =
 *  profile facing screen-right, 180 = back to the lens). Negative yaw mirrors the drawing (and the light) so
 *  bodyFront / bodySide only ever draw toward screen-right. Walkers (march / stroll) between 60 and 120 deg use the
 *  side view's planted-foot walk cycle; everything else is the turned front view (3/4, profile stance, back). */
export const bodyTurn = (p: Pen, o: Outfit, opts: FrontOpts) => {
  if (opts.yaw === undefined) return bodyFront(p, o, opts); // legacy: front view with the old `facing`
  let yaw = ((((opts.yaw ?? 0) + 180) % 360) + 360) % 360 - 180;
  const mir = yaw < 0, g = p.g;
  yaw = Math.abs(yaw);
  const light = opts.light ?? DEF_LIGHT;
  if (mir) { g.save(); g.translate(600, 0); g.scale(-1, 1); }
  const L = mir ? Math.PI - light : light;
  const walk = opts.mode === "march" || opts.mode === "stroll";
  // (robes / dresses stay on the turned front view: the side walk cycle draws trousers)
  if (walk && yaw >= 60 && yaw <= 120 && !opts.prop && opts.wave === undefined && !o.dress) {
    bodySide(p, o, { phase: opts.phase, expr: opts.expr, mode: "march", blink: opts.blink, light: L, seed: opts.seed,
      // stride = metres per step / 0.8, foreshortened by how side-on the walk is (cast.ts walk(): march 0.8, stroll 0.55)
      stomp: opts.mode === "stroll" ? 0.45 : 1, stride: (opts.mode === "stroll" ? 0.69 : 1) * Math.sin(rad(yaw)) });
    silhouette(p, opts.sil ?? 0, opts.silCol);
  } else bodyFront(p, o, { ...opts, yaw, light: L, facing: 0 });
  if (mir) g.restore();
};

export type SideOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push"; blink?: boolean | number; stomp?: number; pose?: number;
  /** step length as a multiple of 0.8 m (370 units): matches 1.6 m/s at 2 steps/s; scale by the view's foreshortening */
  stride?: number; light?: number; seed?: number;
  /** push mode: where the hands land at pose 1, in final canvas units (e.g. the swing kid's back) */
  hand?: [number, number];
};

/** two-bone leg, knee bending forward (+x) */
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};

/** hip height of the seated kid in `swing` mode (design units); swingKid seats the torso bottom on the plank */
const SWING_HIP = 733;

/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */
export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H: Blob = { ...headBlob(seed, Bd.a, 1), asym: 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
  const thick = thickAngle(light), ow = 3.6 * u;
  const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
  const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
  type LegS = { ank: P2; pitch: number; near: boolean };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: S / 2 - S * s, h: 0, stance: true, s }; }
      const s = (c - 0.5) / 0.5; // swing: cycloid in world space, so the foot leaves and lands at zero ground speed
      return { x: -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near });
    lean = 4 + 3 * Math.cos(2 * two * phase); // 7 deg at contact, 1 deg at passing
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near });
    }
  } else {
    legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
  }
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip: P2 = [300, hipY];
  p.rot = null;
  for (const L of legs) {
    const knee = mode === "swing" ? ([300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2) : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    p.stroke([hp0, knee, L.ank], 5.8 * u, L.near ? nearCol : farCol);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
      7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
  }
  // ---- upper body leans about the hip ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const T: Blob = { a: (o.build === "stout" ? 0.36 : 0.31) * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.5, egg: 0.1, asym: 0.06,
    rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (mode === "swing") { near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]]; far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]]; }
  else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      // target is in final canvas units; the arm is drawn inside the lean rotation, so undo it
      const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (rifle) { near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0]; far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0); }
  else { near = swingArm(rad(-30) * nearFwd); far = mode === "march" ? swingArm(rad(30) * nearFwd) : null; }
  if (far) { p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm); p.dot(far[2][0], far[2][1], 5.5 * u); }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (!o.dress) for (let i = 0; i < 3; i++) { const y = chin + 0.16 * HH + i * 0.24 * HH; p.dot(tcx + 0.8 * T.a, y, 3 * u, INK); p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7)); }
  });
  p.inkRing(tp, ow, thick);
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol); p.dot(near[2][0], near[2][1], 5.5 * u);
  // ---- head ----
  const hx = 300 + 4 * u;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  if (o.beard) {
    const bpts: P2[] = [[hx - 18 * u, hc + 4 * u], [hx + 6 * u, hc + 14 * u], [hx + 24 * u, hc + 27 * u], [hx + 40 * u, hc + 26 * u], [hx + 42 * u, hc + 46 * u],
      [hx + 30 * u, hc + 66 * u], [hx + 16 * u, hc + 78 * u], [hx + 4 * u, hc + 62 * u], [hx - 16 * u, hc + 44 * u]];
    p.shadedFill(bpts, o.beard, mul(o.beard, SH_FELT), light, H.a, 0.35);
    p.inkRing(bpts, ow * 0.8, thick);
  }
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "hairband" && o.hat !== "longhair" && o.hat !== "braids" && o.hat !== "topknot" && o.hat !== "jhair";
  faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
  p.rot = null;
};

/** rope + seat + seated kid on a 700 x 2300 canvas; the pivot is design (350, 20); kid drawn at 0.92 scale */
export const swingKid = (p: Pen, o: Outfit, kick: number, expr: Expr, light = DEF_LIGHT, blink: number = 0) => {
  const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
  // two ropes from the pivot to the ends of a wide plank, the kid framed between them: a single rope behind the kid
  // ended at the cap and read as a hanging. Far rope behind the kid, near rope drawn over (clear of the face).
  const seat = rope + 18, x0 = 150, x1 = 550;
  p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
  p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
  const g = p.g;
  g.save();
  g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
  g.scale(k, k);
  bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
  g.restore();
  p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
};

// ---------------- effects ----------------
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
  else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};

/** spark / impact star on a 500 x 500 canvas; t in 0..1 */
export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad((i * 360) / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)],
      [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};

/** water splash crown on an 800 x 800 canvas; t in 0..1 */
export const fxSplash = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff", deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + (660 * i) / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};

/** dust puff on a 300 x 300 canvas; t in 0..1 */
export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};

/** circling stars on a 420 x 210 canvas */
export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: P2[] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90); pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};

/** three jittering strain ticks on a 300 x 300 canvas */
export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
      [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};

/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */
export const fxRing = (p: Pen, t: number) => {
  // thin light water rings (white crest, pale blue trailing rings), thinning as they spread
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath(); g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa"; g.lineWidth = 9 * (1 - u) + 3; g.stroke();
  }
};

/** text-free sign on a 700 x 520 canvas: "no marching in step on the bridge". A bridge (deck + arch + piers), four
 *  identical pairs of marching legs in the same stride (in step), a bold red X over all of it. */
export const fxSign = (p: Pen) => {
  const g = p.g, RED = "#d42f2f";
  p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
  p.poly(rrect(14, 14, 686, 506, 40), null, 14);
  // bridge: deck, stone arch underneath, two piers
  p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
  g.beginPath(); g.moveTo(112, 470); g.quadraticCurveTo(350, 300, 588, 470);
  g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = "round"; g.stroke();
  for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
  // four identical soldiers' legs mid-stride: same leg forward on every one = in step
  for (const x of [150, 278, 406, 534]) {
    p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);                  // coat hem
    p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);           // front leg
    p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);           // back leg
    p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);                          // boots point forward
    p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
  }
  // big red X
  for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]] as [[number, number], [number, number]][]) {
    p.stroke([a, b], 58, "#ffffff");
    p.stroke([a, b], 42, RED);
  }
};

/** soft cartoon cloud on a 600 x 300 canvas */
export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + ((seed * 37) % 20) - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};

/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */
export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 256);
  g.save(); g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08)); lg.addColorStop(0.55, mix(col, WHITE, 0.3)); lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(40, 205); g.bezierCurveTo(36, 120, 46, 50, 64, 30); g.bezierCurveTo(82, 50, 92, 120, 88, 205); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.restore();
};

/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */
export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** floating wooden plank, side-on, on a 320 x 110 canvas */
export const fxPlank = (p: Pen) => {
  p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
  p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
  p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
  p.dot(36, 54, 5, INK); p.dot(284, 54, 5, INK);
};

/** floating marching drum (no text) on a 260 x 240 canvas: white shell, red hoops, ink zig-zag cord */
export const fxDrum = (p: Pen) => {
  p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
  p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
  p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
  p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
  p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};

/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */
export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  // soft contact shadow: flat core, then a long smooth (roughly gaussian) fall-off to white = no change
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};


export const kidO = (v: number): Outfit => ({
  jacket: ["#f08a2c", "#2f9e8f", "#e2453c", "#f2c230"][v % 4], pants: ["#3b5b9a", "#5a3b2a", "#3b3f52", "#3b5b9a"][v % 4], boots: "#f4f1ea",
  hat: v === 1 ? "braids" : v % 2 ? "hair" : "cap", hair: "#2a1d18", cap: ["#e2453c", "#3f6fb5", "#2f7f7a", "#c0353a"][v % 4], skin: ["#d39a6a", "#c48a5c", "#e0ae80", "#b97a4e"][v % 4], build: "kid",
});

/** closed smooth outline through the points (midpoint quadratic smoothing) */
const curveClose = (pts: P2[]): P2[] => {
  const out: P2[] = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + 2) % n];
    const m1: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m2: P2 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
    for (let k = 0; k < 6; k++) { const t = k / 6, s2 = 1 - t; out.push([s2 * s2 * m1[0] + 2 * s2 * t * b[0] + t * t * m2[0], s2 * s2 * m1[1] + 2 * s2 * t * b[1] + t * t * m2[1]]); }
  }
  return out;
};
/** soft glow on a 256 x 256 canvas, see-through */
export const fxGlow = (p: Pen, col = "190,215,255") => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${col},0.55)`); gr.addColorStop(0.45, `rgba(${col},0.22)`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
/** low drifting mist bank on a 512 x 128 canvas, see-through */
export const fxMist = (p: Pen, seed: number, col = "175,200,240", a = 0.5) => {
  const g = p.g;
  for (let i = 0; i < 9; i++) {
    const x = 40 + ((i * 61 + seed * 37) % 430), y = 70 + ((i * 17 + seed * 11) % 24), r = 30 + ((i * 29 + seed) % 26);
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.6);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.55, 0, 0, Math.PI * 2); g.fill();
  }
};
/** torch flame on a 200 x 300 canvas; t = flicker phase 0..1 */
export const fxFlame = (p: Pen, t: number) => {
  const s = Math.sin(t * Math.PI * 2), c = Math.cos(t * Math.PI * 4);
  const outer: P2[] = [[100 + 14 * s, 30], [150 + 6 * c, 150], [140, 240], [100, 275], [60, 240], [50 - 6 * c, 150]];
  p.poly(curveClose(outer), "#ff8a2a", 0);
  const inner: P2[] = [[100 + 10 * s, 110], [128, 190], [118, 250], [100, 262], [82, 250], [72, 190]];
  p.poly(curveClose(inner), "#ffe07a", 0);
};

/** a plain grey rock [600] (core; the rock() staging helper in cast.ts draws it) */
export const fxRock = (p: Pen) => {
  const pts: P2[] = [];
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2, r = 268 * (1 + 0.035 * Math.sin(a * 3 + 1) + 0.025 * Math.sin(a * 5 + 2)); pts.push([300 + Math.cos(a) * r, 300 + Math.sin(a) * r * 0.8]); }
  p.shadedFill(pts, "#9a8f86", "#5a4f5a", -Math.PI * 0.75, 268, 0.5);
  p.clip(pts, () => { p.ell(220, 210, 60, 34, "#aca196", 0); p.stroke([[130, 330], [200, 350], [240, 400]], 6, "#4a4048"); p.stroke([[400, 170], [370, 230], [420, 270]], 6, "#4a4048"); });
  p.inkRing(pts, 9, 1);
};
