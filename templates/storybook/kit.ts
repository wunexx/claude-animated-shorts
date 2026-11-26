// Look v3 dressing kit (2026-11-25): modelled set dressing so every place reaches the references' density (15-40
// distinct objects per view, real geometry, not boxes). Every builder returns a THREE.Group with its base at y = 0,
// centred on x / z = 0 (place it with .position / .rotation); flames and lamp glass go into the place's glow group
// `gb` (shown at golden / night / interior) with a soft additive halo so bloom reads at phone size.
// Materials: illus.ts textures on twoTone Lambert (lam), glossy hero parts as toon matcaps (metalM / glazeM) with
// ink hulls. Sizes are in metres for an adult ~1.7 m tall.
import * as THREE from "three";
import { lam, GLOW_FIRE, GLOW_WIN } from "./build";
import { rep, ctex } from "./paint";
import { planksT, blocksT, paintedT, metalM, glazeM, inkHull } from "./illus";

const lathe = (pts: [number, number][], seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const M = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
const grp = (...o: THREE.Object3D[]) => { const g = new THREE.Group(); g.add(...o); return g; };

// ---------------- light sources ----------------
const haloT = () => ctex("k_halo", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,210,140,0.9)"); gr.addColorStop(0.25, "rgba(255,170,80,0.45)"); gr.addColorStop(1, "rgba(255,140,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
/** a flame (HDR teardrop, blooms) + a soft additive halo sprite, into the glow group */
export const flame = (gb: THREE.Object3D, x: number, y: number, z: number, s = 1) => {
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.045 * s, 10, 8).scale(1, 1.9, 1), GLOW_FIRE); f.position.set(x, y, z);
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT(), color: new THREE.Color(1.6, 1.3, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  h.position.set(x, y, z); h.scale.set(0.55 * s, 0.55 * s, 1);
  gb.add(f, h);
};
/** a candle (wax + flame) */
export const candle = (gb: THREE.Object3D, h = 0.22, at: THREE.Vector3 = new THREE.Vector3()) => {
  const g = grp(M(new THREE.CylinderGeometry(0.03, 0.034, h, 10), lam("k_wax", () => ({ color: "#f6efe0" })), 0, h / 2, 0));
  g.position.copy(at);
  flame(gb, at.x, at.y + h + 0.05, at.z, 0.8);
  return g;
};
/** a standing candelabra: base, stem, curved arms, n candles (needs world position to place flames) */
export const candelabra = (gb: THREE.Object3D, x: number, z: number, arms = 5, H = 1.9) => {
  const gold = metalM("#d9a030"), g = new THREE.Group();
  g.add(M(lathe([[0, 0], [0.26, 0], [0.26, 0.05], [0.08, 0.12], [0.05, 0.3]]), gold));
  g.add(M(new THREE.CylinderGeometry(0.035, 0.045, H - 0.3, 10), gold, 0, 0.3 + (H - 0.3) / 2, 0));
  for (let i = 0; i < arms; i++) {
    const a = ((i - (arms - 1) / 2) / Math.max(1, arms - 1)) * 0.7, ax = Math.sin(a) * 0.42;
    const arm = M(new THREE.TorusGeometry(0.21, 0.02, 6, 16, Math.PI), gold, ax / 2, H - 0.05, 0); arm.rotation.z = Math.PI; arm.scale.x = Math.abs(ax) / 0.21 + 0.01;
    if (Math.abs(ax) > 0.02) g.add(arm);
    const cup = M(lathe([[0, 0], [0.05, 0], [0.06, 0.04], [0, 0.04]]), gold, ax, H, 0); g.add(cup);
    g.add(candle(gb, 0.2, new THREE.Vector3(ax, H + 0.04, 0)));
  }
  g.position.set(x, 0, z);
  // flames were placed at local coords: shift them to the world position
  for (const o of gb.children.slice(-arms * 2)) { o.position.x += x; o.position.z += z; }
  return g;
};
/** a wall torch: iron bracket + wrapped head + big flame */
export const torch = (gb: THREE.Object3D, x: number, y: number, z: number, out: THREE.Vector3) => {
  const iron = lam("k_iron", () => ({ color: "#3a3640" })), g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(0.08, 0.3, 0.08), iron, 0, 0, 0));
  const stick = M(new THREE.CylinderGeometry(0.035, 0.03, 0.55, 8), lam("k_wood", () => ({ color: "#6a4228" })), 0, 0.2, 0); stick.rotation.x = 0.35; g.add(stick);
  g.add(M(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 8), lam("k_wrap", () => ({ color: "#8a6a4a" })), 0, 0.45, 0.1));
  g.position.set(x, y, z); g.lookAt(x + out.x, y, z + out.z);
  const head = new THREE.Vector3(0, 0.6, 0.12).applyQuaternion(g.quaternion).add(g.position);
  flame(gb, head.x, head.y, head.z, 2.4);
  return g;
};
/** a hanging lantern: frame, glass glow, ring */
export const lantern = (gb: THREE.Object3D, x: number, y: number, z: number) => {
  const iron = metalM("#3a3a44"), g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(0.22, 0.03, 0.22), iron, 0, 0, 0), M(new THREE.ConeGeometry(0.17, 0.14, 4).rotateY(Math.PI / 4), iron, 0, 0.36, 0));
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.add(M(new THREE.BoxGeometry(0.025, 0.3, 0.025), iron, dx * 0.1, 0.16, dz * 0.1));
  g.add(M(new THREE.TorusGeometry(0.05, 0.012, 6, 12), iron, 0, 0.47, 0));
  g.position.set(x, y, z);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.18), GLOW_WIN); glass.position.set(x, y + 0.16, z); gb.add(glass);
  flame(gb, x, y + 0.16, z, 1.6);
  return g;
};

// ---------------- architecture ----------------
/** a column with a moulded base, a shaft and a capital (ring, echinus, square abacus) */
export const column = (H = 5, R = 0.34, base = "#a0a6b0") => {
  const st = lam("k_col" + base, () => ({ map: rep(blocksT(base, 2, 6, "col"), 2, 3) })), st2 = lam("k_colc" + base, () => ({ map: rep(blocksT(base, 1, 1, "cap"), 1, 1) }));
  const g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(R * 2.8, 0.22, R * 2.8), st2, 0, 0.11, 0));
  g.add(M(lathe([[R * 1.25, 0], [R * 1.25, 0.08], [R * 1.05, 0.16], [R, 0.24], [0, 0.24]]), st2, 0, 0.22, 0));
  g.add(M(new THREE.CylinderGeometry(R * 0.94, R, H - 1.0, 20), st, 0, 0.46 + (H - 1.0) / 2, 0));
  const top = H - 0.54;
  g.add(M(new THREE.TorusGeometry(R * 0.98, 0.04, 6, 20).rotateX(Math.PI / 2), st2, 0, top, 0));
  g.add(M(lathe([[0, 0], [R, 0], [R * 1.3, 0.16], [R * 1.45, 0.3], [0, 0.3]]), st2, 0, top, 0));
  g.add(M(new THREE.BoxGeometry(R * 3.2, 0.24, R * 3.2), st2, 0, top + 0.42, 0));
  return g;
};
/** a balustrade: top rail, bottom rail and turned balusters between x0..x1 (along x) */
export const balustrade = (len = 4, H = 0.95, col = "#c9b89a") => {
  const m = lam("k_bal" + col, () => ({ map: rep(blocksT(col, 1, 1, "bal"), 1, 1) })), g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(len, 0.1, 0.24), m, 0, H - 0.05, 0), M(new THREE.BoxGeometry(len, 0.1, 0.22), m, 0, 0.05, 0));
  const n = Math.max(2, Math.round(len / 0.22));
  const bal = lathe([[0.05, 0], [0.07, 0.04], [0.045, 0.14], [0.085, 0.38], [0.04, 0.62], [0.065, H - 0.22], [0, H - 0.2]], 12);
  for (let i = 0; i < n; i++) g.add(M(bal, m, -len / 2 + (i + 0.5) * (len / n), 0.1, 0));
  return g;
};
/** a statue on a plinth: a stylised bust (stone or bronze) */
export const bust = (stone = true) => {
  const m = stone ? glazeM("#c8c4bc") : metalM("#8a6a3a"), g = new THREE.Group();
  const plinth = lam("k_plinth", () => ({ map: rep(blocksT("#8e8a86", 1, 2, "pl"), 1, 1) }));
  g.add(M(new THREE.BoxGeometry(0.6, 1.1, 0.6), plinth, 0, 0.55, 0));
  const b = M(lathe([[0, 0], [0.26, 0], [0.3, 0.12], [0.22, 0.32], [0.1, 0.42], [0.11, 0.5], [0.17, 0.62], [0.17, 0.78], [0.1, 0.88], [0, 0.9]], 24), m, 0, 1.1, 0);
  g.add(b, inkHull(b, 0.012));
  return g;
};
/** a framed picture on a wall (faces +z): gilt frame + a painted landscape / portrait canvas */
export const picture = (w = 0.9, h = 1.2, seed = 1) => {
  const tex = ctex("k_pic" + seed + w + h, 256, 320, (g, r) => {
    const sky = g.createLinearGradient(0, 0, 0, 320); sky.addColorStop(0, ["#7ab0e0", "#e8a070", "#5a6aa8"][seed % 3]); sky.addColorStop(1, "#f4e2b8");
    g.fillStyle = sky; g.fillRect(0, 0, 256, 320);
    for (let i = 0; i < 3; i++) { g.fillStyle = ["#5a8a4a", "#3e6a3a", "#2e4a30"][i]; g.beginPath(); g.moveTo(0, 200 + i * 30); for (let x = 0; x <= 256; x += 32) g.lineTo(x, 180 + i * 34 + Math.sin(x * 0.03 + seed + i) * 18); g.lineTo(256, 320); g.lineTo(0, 320); g.fill(); }
    if (seed % 2) { g.fillStyle = "#3a2a30"; g.beginPath(); g.ellipse(128, 150, 40, 48, 0, 0, 7); g.fill(); g.fillStyle = "#f0d8c0"; g.beginPath(); g.ellipse(128, 120, 26, 30, 0, 0, 7); g.fill(); }
    g.strokeStyle = "#2a1c24"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 314); void r;
  });
  const g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.06), metalM("#c8962a"), 0, 0, 0));
  g.add(M(new THREE.PlaneGeometry(w, h), lam("k_canvas" + seed + w, () => ({ map: tex })), 0, 0, 0.032));
  return g;
};

// ---------------- props ----------------
/** a wooden crate with darker frame boards on every edge */
export const crate = (s = 0.7) => {
  const wood = lam("k_crate", () => ({ map: rep(planksT("#b07a44", 5, "cr"), 1, 1) })), dark = lam("k_crateF", () => ({ map: rep(planksT("#7a4e2a", 2, "crf"), 1, 1) }));
  const g = grp(M(new THREE.BoxGeometry(s, s, s), wood, 0, s / 2, 0));
  const t = s * 0.12;
  for (const y of [t / 2, s - t / 2]) for (const [dx, dz, lx, lz] of [[0, s / 2, s, t], [0, -s / 2, s, t], [s / 2, 0, t, s], [-s / 2, 0, t, s]] as const)
    g.add(M(new THREE.BoxGeometry(lx + 0.01, t, lz + 0.01), dark, dx, y, dz));
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(M(new THREE.BoxGeometry(t, s, t), dark, (dx * s) / 2, s / 2, (dz * s) / 2));
  return g;
};
/** a barrel with two iron hoops */
export const barrel = (h = 0.95) => {
  const g = grp(M(lathe([[0, 0], [0.34, 0], [0.42, h / 2], [0.34, h], [0, h]], 24), lam("k_barrel", () => ({ map: rep(planksT("#9a5a2e", 8, "br"), 2, 1) }))));
  for (const hy of [0.14, h - 0.14]) g.add(M(new THREE.TorusGeometry(0.375, 0.025, 6, 24).rotateX(Math.PI / 2), metalM("#4a4a52"), 0, hy, 0));
  return g;
};
/** a sack (squashed sphere + tied neck) */
export const sack = (s = 1, col = "#c8a878") => {
  const m = lam("k_sack" + col, () => ({ map: rep(paintedT(col, "sk"), 1, 1) }));
  return grp(M(new THREE.SphereGeometry(0.3 * s, 16, 12).scale(1, 1.15, 0.9), m, 0, 0.32 * s, 0), M(new THREE.CylinderGeometry(0.06 * s, 0.1 * s, 0.14 * s, 8), m, 0, 0.7 * s, 0));
};
/** a coil of rope (stacked tori) */
export const ropeCoil = (r = 0.34) => {
  const m = lam("k_rope", () => ({ color: "#d4b27a" })), g = new THREE.Group();
  for (let k = 0; k < 4; k++) g.add(M(new THREE.TorusGeometry(r - k * 0.065, 0.045, 8, 28).rotateX(Math.PI / 2), m, 0, 0.05 + k * 0.075, 0));
  return g;
};
/** a potted plant: glazed pot + leafy balls */
export const plant = (s = 1, potCol = "#b8603a") => {
  const g = grp(M(lathe([[0, 0], [0.18, 0], [0.24, 0.3], [0.27, 0.34], [0, 0.34]], 20).scale(s, s, s), glazeM(potCol)));
  const leaf = lam("k_leaf", () => ({ color: "#3f8a3a" })), leaf2 = lam("k_leaf2", () => ({ color: "#5aa84a" }));
  for (let i = 0; i < 7; i++) { const a = i * 2.4, rr = i ? 0.17 : 0; g.add(M(new THREE.SphereGeometry((0.16 + (i % 3) * 0.03) * s, 10, 8), i % 2 ? leaf : leaf2, Math.cos(a) * rr * s, (0.48 + (i % 3) * 0.1) * s, Math.sin(a) * rr * s)); }
  return g;
};
/** a bookshelf (faces +z) packed with coloured book spines */
export const bookshelf = (w = 1.4, h = 2.0, seed = 3) => {
  const wood = lam("k_shelf", () => ({ map: rep(planksT("#7a4a2a", 3, "sh"), 1, 1) })), g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(w, h, 0.05), wood, 0, h / 2, -0.17));
  for (const sx of [-1, 1]) g.add(M(new THREE.BoxGeometry(0.06, h, 0.36), wood, (sx * w) / 2, h / 2, 0));
  const cols = ["#b8282c", "#2a5a9a", "#3a8a4a", "#d8a840", "#6a3a8a", "#e8e0d0", "#2a2a30"];
  let k = seed;
  for (let s = 0; s < 4; s++) {
    const y = 0.05 + s * (h / 4);
    g.add(M(new THREE.BoxGeometry(w, 0.05, 0.36), wood, 0, y, 0));
    for (let x = -w / 2 + 0.06; x < w / 2 - 0.08; ) {
      const bw = 0.04 + ((k * 37) % 5) * 0.012, bh = h / 4 - 0.12 - ((k * 13) % 4) * 0.03;
      g.add(M(new THREE.BoxGeometry(bw, bh, 0.26), lam("k_book" + (k % 7), () => ({ color: cols[k % 7] })), x + bw / 2, y + 0.025 + bh / 2, 0));
      x += bw + 0.005; k++;
    }
  }
  return g;
};
/** a table with a cloth runner and a few glossy goblets / plates on it */
export const feastTable = (L = 2.4) => {
  const wood = lam("k_table", () => ({ map: rep(planksT("#8a5430", 4, "tb"), 2, 1) })), g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(L, 0.08, 0.9), wood, 0, 0.78, 0));
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(M(new THREE.BoxGeometry(0.08, 0.76, 0.08), wood, dx * (L / 2 - 0.1), 0.38, dz * 0.36));
  g.add(M(new THREE.BoxGeometry(L * 0.9, 0.01, 0.4), lam("k_runner", () => ({ color: "#a8222a" })), 0, 0.825, 0));
  const gold = metalM("#d9a030");
  for (let i = 0; i < 4; i++) {
    const x = -L / 2 + 0.35 + i * ((L - 0.7) / 3);
    const gob = M(lathe([[0, 0], [0.06, 0], [0.012, 0.03], [0.012, 0.1], [0.05, 0.13], [0.055, 0.2], [0, 0.2]], 16), gold, x, 0.83, 0.25);
    g.add(gob, M(new THREE.CylinderGeometry(0.14, 0.12, 0.02, 20), glazeM("#e8e4dc"), x + 0.2, 0.84, -0.18));
  }
  return g;
};
/** rigging line between two world points (a thin dark rope) */
export const rope = (a: THREE.Vector3, b: THREE.Vector3, r = 0.018) => {
  const d = b.clone().sub(a), L = d.length();
  const m = M(new THREE.CylinderGeometry(r, r, L, 5), lam("k_rig", () => ({ color: "#5a4632" })));
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
};
