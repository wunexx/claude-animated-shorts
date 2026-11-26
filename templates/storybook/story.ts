// SKELETON timeline: rewrite all of it for each short. Shots are timed to the narration's word onsets (words.json);
// camera grammar: continuous slow push-ins, smootherstep glides, cuts on big reframes, 7-frame flip kicks on impacts.
// Each shot names a `place`; register a builder for every place in sets.ts (nothing is built otherwise). Keep
// places far apart (e.g. x = +-3000, z = +-8000) so they never see each other. Library sets may need extra exports
// here (town: D0; lake city: LX, ISLE): see library/LIBRARY.md.
export const FPS = 30;
export const TOTAL = 90;
export type V3 = [number, number, number];

/** voice re-take (2026-11-26): when a re-generated line moves the later words by n frames, insert those frames into the
 *  PICTURE instead of re-timing every key: [frame a, n] stretches picture frames a-36 .. a over a-36 .. a+n (a gentle
 *  slow-down before a cut at a), and every later frame shows picture frame f - n. Captions / labels / audio stay in real
 *  time (re-run captions.py; shift label frames after a by n). Bridge.tsx renders picFrame(f). */
export const RETIME: [number, number][] = [];
export const picFrame = (f: number) => {
  let p = f;
  for (const [a, n] of RETIME) {
    if (f >= a + n) p -= n;
    else if (f >= a - 36) p = a - 36 + ((f - (a - 36)) * 36) / (36 + n);
  }
  return p;
};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const T = (f: number) => f / FPS;

// ---------------- shots ----------------
export type Light = "day" | "golden" | "night" | "hot" | "space" | "venus" | "under" | "interior";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: string };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: TOTAL, light: "day", place: "stage" },
];
/** crossfades (frames) at place / time changes; a white 4-frame flash after the hook (-1 = none) */
export const XFADE: Record<number, number> = {};
export const FLASH_AT = -100;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- sun / moon discs in the sky ----------------
/** visible discs per shot at time t (s): az = degrees from the CURRENT camera's horizontal forward toward screen
 *  right, el = elevation (deg). Up to 3. Empty = the default (night: a moon from the light; day: none in frame). */
export type Disc = { az: number; el: number };
export const DISCS = (_id: number, _t: number): Disc[] => [];
/** per-shot lighting sun (camera-relative az / el), when the light preset's own is not wanted */
export const SUN_SHOT: Record<number, { az?: number; el?: number }> = {};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; ease?: (u: number) => number; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), (k.ease ?? glide)((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0 (subject grows ~rate per frame); `punch` raises it for the first n frames (8 f soft edges) */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** Accent moves INSIDE a held composition (2026-11-21: the references glide ~65 % of the time, 51-80 moves/min, each
 *  ~20-26 f with a 10-16 px/f peak; ours sat still 80-99 %). Each accent [f0, right, up, push, dur?] is a smootherstep
 *  glide that stays where it lands: right / up truck + pedestal the camera AND its look point (metres, camera axes),
 *  push moves toward the look point (fraction of the distance, e.g. 0.12; negative pulls back). Land each one on a key
 *  word, ~1 per second; vary direction. Size for a ~13 px/f peak at 1080x1920 over 23 f: ~170 px of screen travel,
 *  i.e. right/up ~ 0.16 x look distance x tan(fov/2), or push ~0.15-0.2. They are not CAMS keys (no new composition). */
export type Accent = [number, number, number, number, number?];
export const accent = (s: Shot, f: number, acc: Accent[]): Shot => {
  let pos = s.pos, look = s.look;
  for (const [f0, r, u, p, dur = 23] of acc) {
    const k = glide((f - f0) / dur);
    if (k <= 0) continue;
    const d: V3 = [look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]];
    const L = Math.hypot(...d) || 1, fw: V3 = [d[0] / L, d[1] / L, d[2] / L];
    const h = Math.hypot(fw[0], fw[2]) || 1, rt: V3 = [-fw[2] / h, 0, fw[0] / h];
    const up: V3 = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
    const off: V3 = [0, 1, 2].map((i) => (rt[i] * r + up[i] * u) * k) as V3;
    pos = add(add(pos, off), fw.map((v) => v * L * p * k) as V3); look = add(look, off);
  }
  return { ...s, pos, look };
};

/** accents landing on word ONSETS (s) inside [t0, t1): >= gap s apart (~1/s), cycling truck / pedestal / push, sized for
 *  ~170 px of screen travel at look distance L and fov. Pass the onsets of words.json (scripts write words_data.ts:
 *  `export const ONSETS = [...]`). Penicillin 2 (2026-11-21): this gave ~1 move/s without hand-timing every accent. */
export const accOn = (onsets: number[], t0: number, t1: number, L: number, fov = 40, start = 0, gap = 0.85): Accent[] => {
  const m = 0.16 * L * Math.tan((fov * Math.PI) / 360), out: Accent[] = [];
  const pat: [number, number, number][] = [[m, 0, 0], [0, 0.7 * m, 0], [0, 0, 0.14], [-m, 0, 0], [0, -0.7 * m, 0], [0, 0, -0.14]];
  let last = -9, i = start;
  for (const w of onsets) {
    if (w < t0 + 0.4 || w >= t1 - 0.2 || w - last < gap) continue;
    const [r, u, k] = pat[i++ % pat.length];
    out.push([Math.round(w * FPS) - 10, r, u, k, 14]); last = w; // short, with still gaps: back-to-back glides merge into one drift
  }
  return out;
};
/** accent() with the lateral / vertical part as a PAN / TILT (look moves, lens stays): the whole background slides,
 *  so camstats sees it (a truck at ~3 m barely moves the far wall). Pushes stay dollies. */
export const accentPan = (s: Shot, f: number, A: Accent[]): Shot => {
  let pos = s.pos, look = s.look;
  for (const [f0, r, u, p, dur = 23] of A) {
    const k = glide((f - f0) / dur);
    if (k <= 0) continue;
    const d: V3 = [look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]];
    const L = Math.hypot(...d) || 1, fw: V3 = [d[0] / L, d[1] / L, d[2] / L];
    const h = Math.hypot(fw[0], fw[2]) || 1, rt: V3 = [-fw[2] / h, 0, fw[0] / h];
    look = add(look, [rt[0] * r * k, u * k, rt[2] * r * k]);
    pos = add(pos, fw.map((v) => v * L * p * k) as V3);
  }
  return { ...s, pos, look };
};
/** a held composition: dolly toward look (push rate from frame f0) + word accents until t1 (s). NOTE: push-in and the
 *  accents' pushes compound over a long hold (0.004/f for 4 s = 0.6x the distance): frame it WIDER than the end
 *  framing you want, and check the last frame of each hold. */
export const holdOn = (onsets: number[], pos: V3, look: V3, f0: number, rate: number, t1: number, fov = 40, start = 0, rest: Partial<Cam> = {}) => {
  const A = accOn(onsets, f0 / FPS, t1, Math.hypot(pos[0] - look[0], pos[1] - look[1], pos[2] - look[2]), fov, start);
  return (f: number) => accentPan(dolly(pos, look, pushK(f, f0, rate), { fov, ...rest }), f, A);
};
/** orbit round centre c (radius r, lens height y), angle in degrees (0 = the +z side) from a0 to a1 over [f0, f1] */
export const orbit = (c: V3, r: number, y: number, a0: number, a1: number, f0: number, f1: number, look: V3, fov = 40) => (f: number): Shot => {
  const a = ((a0 + (a1 - a0) * glide((f - f0) / (f1 - f0))) * Math.PI) / 180;
  return { pos: [c[0] + r * Math.sin(a), y, c[2] + r * Math.cos(a)], look, fov };
};

// ======== CAMERA = a chain of subjects (2026-11-21, replaces word accents; out/refstudy3/STUDY.md) ========
// The references move 21-28 times a minute; each move is 35-55 f, travels 280-440 px (40-60 % of the frame), is
// compound (pan + tilt + push) and TAKES THE EYE from one subject to the next one the narration names, landing on the
// word. Between moves the camera drifts. So: one `beat` per named subject (a CAMS key), written from the sync table.
// Accent nudges (accent / accOn / holdOn above) are deprecated: motion with no destination reads as jitter.
let DRIFT_SIGN = 1;
const driftOf = (pos: V3, look: V3, f: number, f1: number, side: number) => {
  const k = Math.max(0, f - f1), dx = look[0] - pos[0], dz = look[2] - pos[2], n = Math.hypot(dx, dz) || 1;
  const r: V3 = [(-dz / n) * side * 0.004 * k, 0.0008 * k, (dx / n) * side * 0.004 * k];
  return { pos: add(pos, r), look: add(look, r) };
};
/** a beat: framing reached by a compound move of `dur` frames (30-55) that lands 2 f before word time `at` (s), then a
 *  slow push + sideways drift until the next beat (side 0 = push only: use it when the lens must not drift into a prop) */
/** ease of the beat moves: "quintic" (glide, peak 1.88x the mean speed) or "cubic" (smoothstep, peak 1.5x) or "trap" (trapezoid, peak 1.33x): use cubic / trap
 *  when retention_stats says "camera move peak" > 18 px/f and the moves cannot get longer (Lighthouse 2026-11-26) */
export const BEAT_EASE = "quintic" as "quintic" | "cubic" | "trap";
/** trapezoid speed profile: accelerate over the first quarter, cruise, decelerate over the last quarter (peak 1.33x) */
export const trapEase = (u: number, a = 0.25) => { const x = clamp01(u), k = 1 / (1 - a);
  return x < a ? (k * x * x) / (2 * a) : x > 1 - a ? 1 - (k * (1 - x) * (1 - x)) / (2 * a) : k * (x - a / 2); };
const beatEase = (u: number) => (BEAT_EASE === "cubic" ? smooth(u) : BEAT_EASE === "trap" ? trapEase(u) : glide(u));
export const beat = (at: number, dur: number, pos: V3, look: V3, fov = 44, push = 0.0035, side?: number): Key => {
  const f1 = Math.round(at * FPS) - 2, sd = side ?? (DRIFT_SIGN = -DRIFT_SIGN);
  return { f: f1 - dur, dur, ease: beatEase, s: (f) => { const q = driftOf(pos, look, f, f1, sd); return dolly(q.pos, q.look, pushK(f, f1, push), { fov }); } };
};
/** the opening framing of a shot (after a cut), drifting from its first frame */
export const open0 = (f0: number, pos: V3, look: V3, fov = 44, push = 0.0035, side?: number): Key => {
  const sd = side ?? (DRIFT_SIGN = -DRIFT_SIGN);
  return { f: f0, s: (f) => { const q = driftOf(pos, look, f, f0, sd); return dolly(q.pos, q.look, pushK(f, f0, push), { fov }); } };
};
// example:  1: [open0(0, [0, 1.6, 6], [0, 1.2, 0], 44), beat(2.4, 40, [1.2, 1.3, 2], [0.5, 1.0, 0], 40), ...]

// portrait frame: the HORIZONTAL field of view is ~0.56 x fov - size wide subjects by it
// a held composition: steady push-in + accent glides on the key words (example frames; re-time to words.json)
const S1a = (f: number) => accent(zoom([0, 2, 10], [0, 4, -60], 40, pushK(f, 0, 0.004)), f, [[20, 1.2, 0, 0], [50, 0, 0.6, 0.1]]);
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
};

// impact kicks: image offset flips sign every frame, decays over 7 f (seconds, gain)
const KICKS: [number, number][] = [];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const Ln = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * Ln * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};
/** a hard cut key of shot `id` in (f0, f1]: the motion-blur shutter never straddles it */
export const cutIn = (id: number, f0: number, f1: number) => (CAMS[id] ?? []).some((k) => k.cut && k.f > f0 && k.f <= f1);

// ---------------- motion blur (motionblur.ts) ----------------
/** camera motion blur on FAST moves only: off below `lo` px/frame of screen motion (at 1080x1920; normal glides peak
 *  ~14-16 px/f, so they stay sharp), full from `hi`; shutter = fraction of a frame (0.5 = 180 deg); maxPx caps a streak. */
export const MBLUR = { lo: 24, hi: 48, shutter: 0.5, maxPx: 140 };

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  // a fade without its own focus keeps the previous focus until it ends (else focus jumped to the look target: a blur pop)
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};

/** near framing props (Kenney kit clones), visible a <= f < b inside their own shot */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
