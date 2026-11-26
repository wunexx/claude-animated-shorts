// Illustrated textures (Look v3, 2026-11-24): the references paint every surface like a cartoon illustration - bold
// saturated base colour, DARK INK LINES on every seam / joint / pattern edge, a lighter highlight line on the top edge
// of each block or plank, soft value variation per piece, and dense repeating patterns (damask, fleur-de-lis, carpet
// borders, diamonds). Flat low-contrast noise (the old paint.ts look) reads as "cheap". All canvases 512-1024 px.
import * as THREE from "three";
import { ctex } from "./paint";

const INKL = "#2a1c24";
type R = () => number;
const shadeHex = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
const line = (g: CanvasRenderingContext2D, pts: number[][], w: number, col = INKL) => {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
};

/** painted wear (Look v3 surface pass, 2026-11-24): soft grime blotches, light scuffs and a few chips, so no surface is a clean flat field. k = amount (0.6 subtle .. 1.4 heavy). Called at the end of the painters. */
export const wear = (g: CanvasRenderingContext2D, r: R, w: number, h: number, k = 1) => {
  for (let i = 0; i < 18 * k; i++) {
    const x = r() * w, y = r() * h, rr = (0.04 + r() * 0.12) * w;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, `rgba(40,25,15,${(0.05 + r() * 0.08) * k})`); gr.addColorStop(1, "rgba(40,25,15,0)");
    g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  }
  // (no bottom-edge band here: textures tile, so it would stripe floors; the world shader adds wall-foot grime)
  g.lineCap = "round";
  for (let i = 0; i < 26 * k; i++) {
    const x = r() * w, y = r() * h, L = (0.01 + r() * 0.04) * w, a = r() * Math.PI;
    g.strokeStyle = r() < 0.5 ? `rgba(255,245,225,${0.12 * k})` : `rgba(30,18,10,${0.16 * k})`; g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
};
/** flat painted surface (hulls, rails, doors, painted wood or metal) with paint chips, streaks and wear */
export const paintedT = (base: string, key = "") => ctex("i_painted" + base + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = shadeHex(base, (r() - 0.5) * 0.12); g.fillRect(0, r() * 512, 512, 2 + r() * 10); }
  // chipped paint: irregular flakes of bare wood, clustered along the top and bottom edges (where things knock it),
  // each with a dark lower lip and a light top edge - not round dots
  for (let i = 0; i < 30; i++) {
    const edge = r() < 0.75, x = r() * 512, y = edge ? (r() < 0.5 ? r() * 70 : 512 - r() * 70) : r() * 512;
    const n = 6 + Math.floor(r() * 5), R0 = 6 + r() * 20, pts: [number, number][] = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, rr = R0 * (0.45 + r() * 0.8); pts.push([x + Math.cos(a) * rr * 1.6, y + Math.sin(a) * rr * 0.8]); }
    g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath();
    g.fillStyle = "#b8895a"; g.fill();
    g.strokeStyle = shadeHex(base, -0.55); g.lineWidth = 2.5; g.stroke();
    g.fillStyle = "rgba(90,55,30,0.35)"; g.fillRect(x - R0, y + R0 * 0.2, R0 * 2, 2);
  }
  wear(g, r, 512, 512, 1.1);
});

/** wooden planks running along u: warm base, dark gaps, grain streaks, knots, nail dots, staggered ends */
export const planksT = (base = "#c8874a", rows = 6, key = "") => ctex("i_planks" + base + rows + key, 1024, 1024, (g, r) => {
  const h = 1024 / rows;
  for (let i = 0; i < rows; i++) {
    const y = i * h;
    for (let x0 = -((i * 397) % 600); x0 < 1024; ) {
      const L = 380 + r() * 420, k = (r() - 0.5) * 0.18;
      g.fillStyle = shadeHex(base, k); g.fillRect(x0, y, L, h);
      // grain: long soft streaks
      for (let s = 0; s < 14; s++) {
        const yy = y + 6 + r() * (h - 12);
        g.strokeStyle = `rgba(70,32,12,${0.22 + r() * 0.26})`; g.lineWidth = 1.5 + r() * 2.5;
        g.beginPath(); g.moveTo(x0, yy); g.bezierCurveTo(x0 + L * 0.3, yy + (r() - 0.5) * 10, x0 + L * 0.6, yy + (r() - 0.5) * 10, x0 + L, yy + (r() - 0.5) * 6); g.stroke();
      }
      if (r() < 0.5) { const kx = x0 + 40 + r() * (L - 80), ky = y + h * (0.3 + r() * 0.4); g.fillStyle = "rgba(90,45,20,0.45)"; g.beginPath(); g.ellipse(kx, ky, 10 + r() * 8, 5 + r() * 3, 0, 0, 7); g.fill(); }
      // highlight along the top edge, ink seams
      g.fillStyle = "rgba(255,235,200,0.35)"; g.fillRect(x0, y + 3, L, 4);
      line(g, [[x0, y], [x0, y + h]], 5);
      for (const ny of [y + h * 0.25, y + h * 0.75]) { g.fillStyle = INKL; g.beginPath(); g.arc(x0 + 14, ny, 3.2, 0, 7); g.fill(); }
      x0 += L;
    }
    line(g, [[0, y], [1024, y]], 6);
  }
  wear(g, r, g.canvas.width, g.canvas.height, 0.8);
});

/** stone / cinder blocks: per-block value variation, dark mortar, top-left highlight, a few cracks and chips */
export const blocksT = (base = "#9aa0a8", cols = 4, rows = 8, key = "") => ctex("i_blocks" + base + cols + rows + key, 1024, 1024, (g, r) => {
  const bw = 1024 / cols, bh = 1024 / rows;
  g.fillStyle = shadeHex(base, -0.35); g.fillRect(0, 0, 1024, 1024);
  for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
    const x = i * bw + (j % 2 ? bw / 2 : 0), y = j * bh, k = (r() - 0.5) * 0.2;
    g.fillStyle = shadeHex(base, k); g.fillRect(x + 4, y + 4, bw - 8, bh - 8);
    g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(x + 4, y + 4, bw - 8, 5); g.fillRect(x + 4, y + 4, 5, bh - 8);
    g.fillStyle = "rgba(0,0,0,0.14)"; g.fillRect(x + 4, y + bh - 10, bw - 8, 6);
    for (let s = 0; s < 14; s++) { g.fillStyle = r() < 0.3 ? `rgba(255,255,255,${0.06 + r() * 0.08})` : `rgba(0,0,0,${0.06 + r() * 0.1})`; g.beginPath(); g.ellipse(x + r() * bw, y + r() * bh, 6 + r() * 16, 4 + r() * 8, r() * 3, 0, 7); g.fill(); }
    if (r() < 0.12) { const cx = x + bw * (0.2 + r() * 0.5), cy = y + 8; line(g, [[cx, cy], [cx + 8, cy + bh * 0.3], [cx - 4, cy + bh * 0.55]], 2.5); }
    line(g, [[x + 3, y + 3], [x + bw - 3, y + 3], [x + bw - 3, y + bh - 3], [x + 3, y + bh - 3], [x + 3, y + 3]], 4.5);
  }
  wear(g, r, g.canvas.width, g.canvas.height, 0.8);
});

/** damask / fleur-de-lis wallpaper: saturated base, a darker diamond lattice and gold fleurs at the crossings */
export const damaskT = (base = "#b8282c", motif = "#e8b84a", key = "") => ctex("i_damask" + base + motif + key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = shadeHex(base, -0.3); g.lineWidth = 6;
  for (let k = -512; k < 1024; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 512, 512); g.stroke(); g.beginPath(); g.moveTo(k + 512, 0); g.lineTo(k, 512); g.stroke(); }
  const fleur = (x: number, y: number, s: number) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = motif; g.strokeStyle = shadeHex(motif, -0.55); g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, -26); g.bezierCurveTo(10, -14, 8, -2, 0, 8); g.bezierCurveTo(-8, -2, -10, -14, 0, -26); g.fill(); g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 3, 0); g.bezierCurveTo(sx * 22, -18, sx * 26, 4, sx * 12, 10); g.bezierCurveTo(sx * 10, 4, sx * 8, 2, sx * 3, 4); g.fill(); g.stroke(); }
    g.fillRect(-12, 8, 24, 5); g.strokeRect(-12, 8, 24, 5);
    g.beginPath(); g.moveTo(-5, 13); g.lineTo(0, 24); g.lineTo(5, 13); g.fill(); g.stroke();
    g.restore();
  };
  for (let y = 0; y <= 512; y += 128) for (let x = 0; x <= 512; x += 128) fleur(x, y, 1.0);
  for (let y = 64; y < 512; y += 128) for (let x = 64; x < 512; x += 128) { g.fillStyle = shadeHex(motif, -0.2); g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
});

/** carpet: deep base, a patterned field of diamonds, a bordered edge band (use with a 1 x n repeat along a runner) */
export const carpetT = (base = "#1f3a8a", trim = "#b8282c", gold = "#e8b84a", key = "") => ctex("i_carpet" + base + trim + key, 512, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 1024);
  // border bands left / right
  for (const x of [0, 512 - 70]) {
    g.fillStyle = trim; g.fillRect(x, 0, 70, 1024);
    g.fillStyle = gold; for (let y = 0; y < 1024; y += 64) { g.beginPath(); g.moveTo(x + 35, y + 8); g.lineTo(x + 58, y + 32); g.lineTo(x + 35, y + 56); g.lineTo(x + 12, y + 32); g.closePath(); g.fill(); }
    line(g, [[x + 4, 0], [x + 4, 1024]], 5); line(g, [[x + 66, 0], [x + 66, 1024]], 5);
  }
  // field: big diamonds with an inner motif
  for (let y = 0; y < 1024; y += 256) {
    const cx = 256, cy = y + 128;
    g.fillStyle = shadeHex(base, 0.12); g.beginPath(); g.moveTo(cx, cy - 110); g.lineTo(cx + 140, cy); g.lineTo(cx, cy + 110); g.lineTo(cx - 140, cy); g.closePath(); g.fill();
    g.strokeStyle = gold; g.lineWidth = 8; g.stroke();
    g.fillStyle = trim; g.beginPath(); g.moveTo(cx, cy - 46); g.lineTo(cx + 58, cy); g.lineTo(cx, cy + 46); g.lineTo(cx - 58, cy); g.closePath(); g.fill();
    g.strokeStyle = INKL; g.lineWidth = 4; g.stroke();
    g.fillStyle = gold; g.beginPath(); g.arc(cx, cy, 12, 0, 7); g.fill();
  }
  wear(g, r, 512, 1024, 0.7); // seeded: textures must be identical in every render process
});

/** ceramic / glazed tiles (floors, office walls): square grid with dark grout and a glossy top-left catch */
export const tilesT = (base = "#7cc47a", n = 4, key = "") => ctex("i_tiles" + base + n + key, 512, 512, (g, r) => {
  const s = 512 / n;
  g.fillStyle = shadeHex(base, -0.45); g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = i * s, y = j * s;
    g.fillStyle = shadeHex(base, (r() - 0.5) * 0.12); g.fillRect(x + 4, y + 4, s - 8, s - 8);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x + 8, y + 8, s * 0.5, 6);
    line(g, [[x + 3, y + 3], [x + s - 3, y + 3], [x + s - 3, y + s - 3], [x + 3, y + s - 3], [x + 3, y + 3]], 3.5);
  }
  wear(g, r, g.canvas.width, g.canvas.height, 0.8);
});

/** soft painted sky clouds are in world.ts; this is a painted backdrop strip (distant hills / town silhouettes) */
export const stripesT = (a: string, b: string, n = 8, key = "") => ctex("i_stripes" + a + b + n + key, 256, 256, (g) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, (i * 256) / n, 256, 256 / n + 1); }
});

/** environment map for glossy / metal hero props (gold dragons, brass, glazed jars): a bright studio cube built from
 *  canvases (three PMREM-converts a CubeTexture used as envMap on Standard/Physical materials by itself) */
let ENV: THREE.CubeTexture | null = null;
export const envCube = () => {
  if (ENV) return ENV;
  const face = (i: number) => {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
    if (i === 2) { g.fillStyle = "#fff6e6"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(64, 64, 30, 0, 7); g.fill(); }
    else if (i === 3) { g.fillStyle = "#3a2c26"; g.fillRect(0, 0, 128, 128); }
    else { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#fffaf0"); gr.addColorStop(0.45, "#9fb6e0"); gr.addColorStop(0.55, "#6a5a50"); gr.addColorStop(1, "#2a201c"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      if (i === 0) { g.fillStyle = "rgba(255,250,230,0.95)"; g.fillRect(30, 18, 50, 30); } }
    return c;
  };
  ENV = new THREE.CubeTexture([0, 1, 2, 3, 4, 5].map(face));
  ENV.colorSpace = THREE.SRGBColorSpace; ENV.needsUpdate = true;
  return ENV;
};
/** painted matcap sphere: the references' hero props (gold dragons, brass, glazed jars, copper pots) read as glossy
 *  cartoon materials - a saturated body colour, a dark core shadow toward the lower right, a crisp white highlight top
 *  left, a coloured rim light along the lower edge. A matcap bakes exactly that and looks the same from every angle. */
export const matcapT = (base: string, kind: "metal" | "glaze" = "metal") => ctex("i_matcap" + base + kind, 256, 256, (g) => {
  const c = 128, R = 126;
  const body = g.createRadialGradient(c - 30, c - 34, 8, c + 10, c + 12, R);
  // toon ramp (Look v3 round 3: smooth gradients read as plastic CG): flat bands with short soft steps between them
  if (kind === "metal") { body.addColorStop(0, shadeHex(base, 0.6)); body.addColorStop(0.3, shadeHex(base, 0.55)); body.addColorStop(0.34, shadeHex(base, 0.1)); body.addColorStop(0.66, shadeHex(base, 0.05)); body.addColorStop(0.71, shadeHex(base, -0.5)); body.addColorStop(1, shadeHex(base, -0.62)); }
  else { body.addColorStop(0, shadeHex(base, 0.28)); body.addColorStop(0.42, shadeHex(base, 0.22)); body.addColorStop(0.47, base); body.addColorStop(0.74, base); body.addColorStop(0.79, shadeHex(base, -0.32)); body.addColorStop(1, shadeHex(base, -0.4)); }
  g.fillStyle = body; g.beginPath(); g.arc(c, c, R, 0, 7); g.fill();
  // horizon band (metals reflect a bright sky / dark ground split)
  if (kind === "metal") { g.fillStyle = "rgba(255,250,220,0.28)"; g.beginPath(); g.ellipse(c, c - 8, R * 0.95, R * 0.18, 0, 0, 7); g.fill(); }
  // rim light along the lower right
  const rim = g.createRadialGradient(c, c, R * 0.7, c, c, R);
  rim.addColorStop(0, "rgba(255,255,255,0)"); rim.addColorStop(1, kind === "metal" ? "rgba(255,230,170,0.55)" : "rgba(220,235,255,0.45)");
  g.save(); g.beginPath(); g.arc(c, c, R, -0.2, 1.9); g.lineTo(c, c); g.clip(); g.fillStyle = rim; g.fillRect(0, 0, 256, 256); g.restore();
  // crisp highlight, top left
  g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(c - 42, c - 48, 20, 11, -0.6, 0, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(c - 12, c - 64, 5, 0, 7); g.fill();
});
/** glossy metal (gold, brass, copper, iron) and glazed ceramic for hero props (matcap: no lighting needed) */
const MATCAPS = new Set<THREE.MeshMatcapMaterial>();
const mc = (t: THREE.Texture) => { const m = new THREE.MeshMatcapMaterial({ matcap: t }); MATCAPS.add(m); return m; };
export const metalM = (color: string) => mc(matcapT(color, "metal"));
export const glazeM = (color: string) => mc(matcapT(color, "glaze"));
/** matcaps ignore scene lights: world.ts tints them with the light's character tint every frame (night = blue) */
export const tintMatcaps = (c: [number, number, number]) => { for (const m of MATCAPS) m.color.setRGB(c[0], c[1], c[2]); };

/** tufted upholstery (throne backs, sofas, carriage seats): diamond quilting with button dots and a soft sheen */
export const tuftedT = (base = "#b8202a", key = "") => ctex("i_tufted" + base + key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  const s = 64;
  for (let y = -s; y <= 512 + s; y += s) for (let x = -s; x <= 512 + s; x += s) {
    const ox = (Math.round(y / s) % 2) * (s / 2);
    const gr = g.createRadialGradient(x + ox, y, 4, x + ox, y, s * 0.7);
    gr.addColorStop(0, shadeHex(base, 0.22)); gr.addColorStop(1, shadeHex(base, -0.28));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x + ox, y - s / 2); g.lineTo(x + ox + s / 2, y); g.lineTo(x + ox, y + s / 2); g.lineTo(x + ox - s / 2, y); g.closePath(); g.fill();
    g.strokeStyle = shadeHex(base, -0.5); g.lineWidth = 2.5; g.stroke();
    g.fillStyle = "#e8b84a"; g.beginPath(); g.arc(x + ox, y - s / 2, 4, 0, 7); g.fill();
  }
});
/** stained glass rose window: radial petals of saturated glass with lead lines (use with an emissive / glow material) */
export const roseT = () => ctex("i_rose", 512, 512, (g) => {
  const c = 256, cols = ["#3a5aa8", "#d8a440", "#4a6ab8", "#c89040", "#2e4a8a"]; // blue / amber like real glass
  g.fillStyle = "#1a1424"; g.fillRect(0, 0, 512, 512);
  for (let ring = 3; ring >= 0; ring--) {
    const R = 60 + ring * 60, n = 6 + ring * 4;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      g.fillStyle = cols[(i + ring) % cols.length];
      g.beginPath(); g.moveTo(c, c); g.arc(c, c, R, a0, a1); g.closePath(); g.fill();
      g.strokeStyle = "#1a1424"; g.lineWidth = 6; g.stroke();
    }
  }
  g.fillStyle = "#f4e8c0"; g.beginPath(); g.arc(c, c, 36, 0, 7); g.fill(); g.strokeStyle = "#1a1424"; g.lineWidth = 6; g.stroke();
  g.strokeStyle = "#5a5060"; g.lineWidth = 18; g.beginPath(); g.arc(c, c, 246, 0, 7); g.stroke();
});
/** heraldic banner: saturated field, gold border + tassel points, a simple emblem (lion-ish shield + crown) */
export const bannerT = (field = "#b8202a", key = "") => ctex("i_banner" + field + key, 256, 640, (g) => {
  g.fillStyle = field; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 0); g.lineTo(256, 560); g.lineTo(128, 640); g.lineTo(0, 560); g.closePath(); g.fill();
  g.strokeStyle = "#e8b84a"; g.lineWidth = 14; g.stroke();
  g.strokeStyle = INKL; g.lineWidth = 4; g.stroke();
  g.fillStyle = "#e8b84a"; g.beginPath(); g.moveTo(68, 200); g.lineTo(188, 200); g.lineTo(188, 320); g.quadraticCurveTo(128, 400, 68, 320); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = field; g.beginPath(); g.moveTo(90, 230); g.lineTo(166, 230); g.lineTo(166, 310); g.quadraticCurveTo(128, 360, 90, 310); g.closePath(); g.fill();
  g.fillStyle = "#e8b84a"; g.beginPath(); g.moveTo(86, 170); g.lineTo(98, 130); g.lineTo(114, 160); g.lineTo(128, 120); g.lineTo(142, 160); g.lineTo(158, 130); g.lineTo(170, 170); g.closePath(); g.fill(); g.stroke();
  for (let y = 40; y < 540; y += 40) { g.fillStyle = shadeHex(field, -0.18); g.fillRect(20, y, 216, 3); }
});

/** inverted-hull ink outline for a hero prop (Look v3 round 3): a back-face shell pushed out along the normals, drawn
 *  in near-black, so glossy props get the same bold line as the characters at every distance. w = shell thickness in
 *  metres (0.012-0.02 for hand props, 0.03-0.05 for big set pieces). Returns the shell; add it beside the mesh. */
export const inkHull = (m: THREE.Mesh, w = 0.015) => {
  const mat = new THREE.MeshBasicMaterial({ color: "#1a1410", side: THREE.BackSide });
  mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
 transformed += normalize( normal ) * ${w.toFixed(4)};`); };
  mat.customProgramCacheKey = () => "inkHull" + w.toFixed(4);
  const h = new THREE.Mesh(m.geometry, mat);
  h.position.copy(m.position); h.rotation.copy(m.rotation); h.scale.copy(m.scale);
  return h;
};
