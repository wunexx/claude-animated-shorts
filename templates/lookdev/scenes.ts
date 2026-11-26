// Look v3 test scenes (lookdev only): an illustrated great hall (patterns, gold, glazed jar, window light) and a ship
// deck at sea (planks, painted hull, sky, water) used to tune lights / shaders / grade against the five references.
import * as THREE from "three";
import { Batch, V, lam, boxGeo, quad, GLOW_WIN, GLOW_FIRE } from "./build";
import { rep } from "./paint";
import { planksT, blocksT, damaskT, carpetT, stripesT, tilesT, tuftedT, roseT, bannerT, metalM, glazeM, inkHull, paintedT } from "./illus";
import type { SetHooks } from "./sets";
import { column, balustrade, candelabra, torch, bust, picture, feastTable, plant, crate, barrel, sack, ropeCoil, lantern, rope } from "./kit";

const lathe = (pts: [number, number][], seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };

export const hallSet = (c: { root: THREE.Object3D; glow: THREE.Group }): SetHooks => {
  const b = new Batch(), gb = new Batch();
  const W = 12, D = 12, H = 9;
  const stone = lam("ld_stone", () => ({ map: rep(blocksT("#8a909c", 4, 8), 5, 4) }));
  const stone2 = lam("ld_stone2", () => ({ map: rep(blocksT("#9aa0aa", 2, 4, "p"), 1, 3) }));
  const gold = metalM("#e0a628"), red = lam("ld_curtain", () => ({ color: "#8a2a2e" }));
  // floor: stone flags + a long carpet runner with borders up to the dais
  b.add(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2).translate(0, 0, -D / 2 + 3), lam("ld_flags", () => ({ map: rep(blocksT("#76747a", 3, 3, "f"), 6, 6) })));
  b.add(new THREE.PlaneGeometry(2.6, D).rotateX(-Math.PI / 2).translate(0, 0.01, -D / 2 + 3), lam("ld_carpet", () => ({ map: rep(carpetT("#26397e", "#a8222a", "#d8a840"), 1, 4) })));
  // back wall: stone with an arcade of three arches, damask panels inside the arches
  b.add(new THREE.PlaneGeometry(W, H).translate(0, H / 2, -9), stone);
  const dam = lam("ld_damask", () => ({ map: rep(damaskT("#82262a", "#d0a440"), 3, 4) }));
  for (const x of [-3.8, 0, 3.8]) {
    if (x === 0) b.add(new THREE.PlaneGeometry(2.8, 5.2).translate(x, 2.6, -8.98), dam);
    else { // side arches: tall leaded windows pouring daylight
      gb.add(new THREE.PlaneGeometry(1.4, 3.4).translate(x, 3.0, -8.97), new THREE.MeshBasicMaterial({ map: rep(tilesT("#9fc8f0", 4, "win"), 1, 2), color: new THREE.Color(1.5, 1.5, 1.6), fog: false }));
    }
    b.add(new THREE.TorusGeometry(1.55, 0.22, 8, 24, Math.PI).translate(x, 5.2, -8.85), stone2);
  }
  for (const x of [-5.7, -1.9, 1.9, 5.7]) {
    b.add(new THREE.CylinderGeometry(0.32, 0.36, 5.4, 18).translate(x, 2.7, -8.7), stone2);
    b.add(boxGeo(V(x - 0.48, 5.3, -9), V(x + 0.48, 5.65, -8.3)), stone);
    b.add(boxGeo(V(x - 0.48, 0, -9), V(x + 0.48, 0.3, -8.3)), stone);
  }
  // a cornice and a rose window above the arcade
  b.add(boxGeo(V(-W / 2, 6.6, -9), V(W / 2, 6.85, -8.6)), stone2);
  b.add(new THREE.TorusGeometry(1.2, 0.16, 8, 40).translate(0, 7.9, -8.9), stone2);
  gb.add(new THREE.CircleGeometry(1.2, 40).translate(0, 7.9, -8.96), new THREE.MeshBasicMaterial({ map: roseT(), color: new THREE.Color(1.6, 1.6, 1.6), fog: false }));
  // throne on a stepped dais: gold frame, tufted red back with a crest, red curtains + gold pelmet behind
  b.add(boxGeo(V(-2.2, 0, -8.6), V(2.2, 0.25, -6.6)), lam("ld_step1", () => ({ map: rep(carpetT("#8a1c24", "#1f3a8a", "#e8b84a", "d"), 2, 1) })));
  b.add(boxGeo(V(-1.6, 0.25, -8.6), V(1.6, 0.5, -7.2)), lam("ld_step1", () => ({ map: rep(carpetT("#8a1c24", "#1f3a8a", "#e8b84a", "d"), 2, 1) })));
  b.add(boxGeo(V(-0.75, 0.5, -8.45), V(0.75, 3.4, -8.2)), lam("ld_tuft", () => ({ map: rep(tuftedT("#9a2a30"), 1, 2) })));
  for (const x of [-0.85, 0.85]) b.add(new THREE.CylinderGeometry(0.09, 0.09, 3.3, 10).translate(x, 2.05, -8.2), lam("ld_goldL", () => ({ color: "#e0a628" })));
  b.add(new THREE.ConeGeometry(0.95, 0.9, 4).rotateY(Math.PI / 4).scale(1, 1, 0.25).translate(0, 3.85, -8.3), lam("ld_goldL", () => ({ color: "#e0a628" })));
  b.add(boxGeo(V(-0.9, 0.5, -8.2), V(0.9, 1.05, -7.5)), lam("ld_tuft", () => ({ map: rep(tuftedT("#9a2a30"), 1, 2) })));
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) b.add(new THREE.CylinderGeometry(0.14, 0.18, 4.6, 10).translate(sx * (1.3 + k * 0.22), 3.0, -8.7 + (k % 2) * 0.06), red);
  b.add(boxGeo(V(-2.5, 5.2, -8.95), V(2.5, 5.6, -8.6)), lam("ld_pelmet", () => ({ color: "#e0a628" })));
  // banners hanging from the outer pillars
  const ban = lam("ld_banner", () => ({ map: bannerT(), transparent: true, alphaTest: 0.5 }));
  for (const x of [-5.7, 5.7]) b.add(new THREE.PlaneGeometry(1.0, 2.5).translate(x, 3.6, -8.3), ban);
  // side walls: stone, torch brackets with fire glows, wood wainscot
  for (const sx of [-1, 1]) {
    b.add(new THREE.PlaneGeometry(D, H).rotateY(-sx * Math.PI / 2).translate(sx * W / 2, H / 2, -3), stone);
    b.add(new THREE.PlaneGeometry(D, 1.4).rotateY(-sx * Math.PI / 2).translate(sx * (W / 2 - 0.01), 0.7, -3), lam("ld_wains", () => ({ map: rep(planksT("#7a3e22", 2, "v"), 6, 1) })));
    for (const z of [-6.5, -2.5]) {
      b.add(boxGeo(V(sx * W / 2 - sx * 0.25 - 0.06, 2.6, z - 0.06), V(sx * W / 2 - sx * 0.25 + 0.06, 3.0, z + 0.06)), lam("ld_iron", () => ({ color: "#3a3640" })));
      gb.add(new THREE.SphereGeometry(0.16, 10, 8).scale(1, 1.6, 1).translate(sx * (W / 2 - 0.25), 3.25, z), GLOW_FIRE);
    }
  }
  // candelabras either side of the dais: stand + arms + candles + flames
  const wax = lam("ld_wax", () => ({ color: "#f6efe0" }));
  for (const x of [-2.6, 2.6]) {
    const st = new THREE.Group();
    st.add(mesh(new THREE.CylinderGeometry(0.05, 0.22, 1.9, 12), gold, 0, 0.95, 0));
    st.add(mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 24, Math.PI).rotateX(Math.PI).rotateY(Math.PI / 2), gold, 0, 1.95, 0));
    for (const dz of [-0.32, 0, 0.32]) {
      st.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), wax, 0, 2.05 + (dz ? 0 : 0.15), dz));
      gb.add(new THREE.SphereGeometry(0.045, 8, 6).scale(1, 1.8, 1).translate(x, 2.27 + (dz ? 0 : 0.15), -6.9 + dz), GLOW_FIRE);
    }
    st.rotation.y = Math.PI / 2; st.position.set(x, 0, -6.9); c.root.add(st);
  }
  // a ring chandelier with candles
  c.root.add(mesh(new THREE.TorusGeometry(1.1, 0.05, 6, 40).rotateX(Math.PI / 2), gold, 0, 6.2, -4.5));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, x = Math.cos(a) * 1.1, z = -4.5 + Math.sin(a) * 1.1;
    c.root.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), wax, x, 6.32, z)); gb.add(new THREE.SphereGeometry(0.04, 8, 6).scale(1, 1.8, 1).translate(x, 6.48, z), GLOW_FIRE); }
  // ceiling with dark timber beams (blocks the sun: the hall is lit by its own fires)
  b.add(new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2).translate(0, H, -3), lam("ld_ceil", () => ({ map: rep(planksT("#8a6448", 6, "c"), 2, 2) })));
  for (let z = -8; z <= 2; z += 2) b.add(boxGeo(V(-W / 2, H - 0.45, z - 0.18), V(W / 2, H, z + 0.18)), lam("ld_beam", () => ({ color: "#6a4a32" })));
  // warm light sources: candelabras, torches, the chandelier (Look v3: point lights light the world)
  const warm = (x: number, y: number, z: number, I: number, d: number) => { const L = new THREE.PointLight("#ffb45a", I * 1.1, d * 0.55, 2); L.position.set(x, y, z); c.root.add(L); };
  warm(-2.6, 2.4, -6.6, 5, 7); warm(2.6, 2.4, -6.6, 5, 7);
  for (const sx of [-1, 1]) for (const z of [-6.5, -2.5]) warm(sx * (W / 2 - 0.6), 3.3, z, 4, 6);
  warm(0, 6.0, -4.5, 5, 10);
  b.build(c.root); gb.build(c.glow);
  // hero props: a glazed grey jar and a gold vase with a ball finial (glossy matcaps)
  const jar = mesh(lathe([[0, 0], [0.55, 0], [0.62, 0.1], [0.64, 1.0], [0.6, 1.3], [0.42, 1.48], [0.2, 1.55], [0.22, 1.7], [0.08, 1.82], [0, 1.85]]), glazeM("#9aa3b2"), 1.6, 0, -2.6);
  const vase = mesh(lathe([[0, 0], [0.22, 0], [0.26, 0.08], [0.18, 0.3], [0.3, 0.6], [0.28, 0.85], [0.12, 1.0], [0.16, 1.12], [0, 1.15]]), metalM("#e0a628"), -1.7, 0, -2.2);
  const ball = mesh(new THREE.SphereGeometry(0.12, 24, 16), metalM("#e0a628"), -1.7, 1.25, -2.2);
  c.root.add(jar, vase, ball, inkHull(jar, 0.02), inkHull(vase, 0.015), inkHull(ball, 0.01));
  // ---- Look v3 density pass (kit.ts): the references show 15-40 dressing objects per view ----
  const K = c.root, G = c.glow;
  for (const sx of [-1, 1]) {
    const col = column(6.4, 0.36); col.position.set(sx * 4.3, 0, -4.8); K.add(col);
    const bal = balustrade(1.5); bal.position.set(sx * 1.45, 0.25, -6.45); K.add(bal);
    K.add(candelabra(G, sx * 4.9, -1.6, 5, 1.8));
    for (const z of [-6.5, -2.5]) K.add(torch(G, sx * (W / 2 - 0.1), 2.5, z, new THREE.Vector3(-sx, 0, 0)));
    const bs = bust(sx < 0); bs.position.set(sx * 4.9, 0, -7.6); K.add(bs);
    const pic = picture(1.0, 1.3, sx > 0 ? 1 : 2); pic.position.set(sx * (W / 2 - 0.04), 3.6, -4.6); pic.rotation.y = -sx * Math.PI / 2; K.add(pic);
    const pl = plant(1.3); pl.position.set(sx * 2.4, 0.25, -7.2); K.add(pl);
  }
  const tbl = feastTable(2.6); tbl.position.set(-3.7, 0, -2.6); tbl.rotation.y = Math.PI / 2; K.add(tbl);
  for (const [x, z, s] of [[4.5, -0.6, 0.75], [4.9, 0.3, 0.65], [4.55, -0.3, 0.55]] as const) { const cr = crate(s); cr.position.set(x, x === 4.55 ? 0.75 : 0, z); K.add(cr); }
  for (const [x, z] of [[3.9, 0.4], [4.1, 1.0]] as const) { const sk = sack(1); sk.position.set(x, 0, z); K.add(sk); }
  return { indoor: true };
};

export const deckSet = (c: { root: THREE.Object3D; glow: THREE.Group; water: (g: THREE.BufferGeometry) => void }): SetHooks => {
  const X = 3000, b = new Batch();
  c.water(new THREE.PlaneGeometry(1200, 1200).rotateX(-Math.PI / 2).translate(X, -1.2, -300));
  b.add(new THREE.PlaneGeometry(8, 14).rotateX(-Math.PI / 2).translate(X, 0, -3), lam("ld_deck", () => ({ map: rep(planksT("#c58a4c", 6, "d"), 2, 3) })));
  // hull rail: red band with a white stripe and a dark green cap
  for (const sx of [-1, 1]) {
    b.add(boxGeo(V(X + sx * 4 - 0.12, -1.2, -10), V(X + sx * 4 + 0.12, 0.9, 4)), lam("ld_hullR", () => ({ map: rep(paintedT("#b03434"), 4, 1) })));
    b.add(boxGeo(V(X + sx * 4 - 0.13, 0.45, -10), V(X + sx * 4 + 0.13, 0.62, 4)), lam("ld_hullW", () => ({ map: rep(paintedT("#f4efe2", "w"), 6, 1) })));
    b.add(boxGeo(V(X + sx * 4 - 0.2, 0.9, -10), V(X + sx * 4 + 0.2, 1.02, 4)), lam("ld_cap", () => ({ color: "#1e5a4a" })));
  }
  b.add(boxGeo(V(X - 4, -1.2, -10.1), V(X + 4, 1.0, -9.9)), lam("ld_hullR", () => ({ map: rep(paintedT("#b03434"), 4, 1) })));
  b.build(c.root);
  const mast = mesh(new THREE.CylinderGeometry(0.22, 0.26, 16, 20), lam("ld_mast", () => ({ map: rep(planksT("#b07a44", 3, "m"), 1, 4) })), X - 1.4, 8, -4.5);
  const band = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.15, 20), metalM("#3a3a40"), X - 1.4, 2.0, -4.5);
  const pot = mesh(lathe([[0, 0], [0.32, 0], [0.36, 0.04], [0.36, 0.42], [0.4, 0.45], [0, 0.45]]), metalM("#c8783a"), X + 1.2, 1.02, 0.6);
  // deck dressing: barrels with iron hoops, a rope coil, a cannon, a lantern post, a far ship + islands
  const barrelM = lam("ld_barrel", () => ({ map: rep(planksT("#9a5a2e", 8, "b"), 2, 1) }));
  for (const [bx, bz] of [[X + 3.1, -5.5], [X + 2.5, -6.3], [X + 3.2, -6.6]] as const) {
    const g = lathe([[0, 0], [0.34, 0], [0.42, 0.45], [0.34, 0.9], [0, 0.9]], 24);
    c.root.add(mesh(g, barrelM, bx, 0, bz));
    for (const hy of [0.12, 0.78]) c.root.add(mesh(new THREE.TorusGeometry(0.37, 0.025, 6, 24).rotateX(Math.PI / 2), metalM("#4a4a52"), bx, hy, bz));
  }
  for (let k = 0; k < 4; k++) c.root.add(mesh(new THREE.TorusGeometry(0.34 - k * 0.07, 0.045, 8, 28).rotateX(Math.PI / 2), lam("ld_rope", () => ({ color: "#d8b878" })), X - 2.6, 0.05 + k * 0.07, -1.2));
  const cannon = new THREE.Group();
  cannon.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.6, 20).rotateX(Math.PI / 2), metalM("#3a3a44"), 0, 0.55, 0));
  cannon.add(mesh(new THREE.BoxGeometry(0.7, 0.35, 0.9), lam("ld_carriage", () => ({ color: "#8a4a26" })), 0, 0.2, 0.2));
  cannon.position.set(X + 3.2, 0, -2.4); cannon.rotation.y = -Math.PI / 2; c.root.add(cannon);
  const ship = new THREE.Group();
  ship.add(mesh(new THREE.BoxGeometry(16, 3, 4), lam("ld_ship", () => ({ color: "#6a2a26" })), 0, 0, 0));
  for (const mx of [-4, 3]) { ship.add(mesh(new THREE.CylinderGeometry(0.2, 0.25, 16, 8), lam("ld_mast2", () => ({ color: "#5a3a26" })), mx, 8, 0)); ship.add(mesh(new THREE.PlaneGeometry(6, 7), lam("ld_sail", () => ({ map: rep(stripesT("#f4efe2", "#c8262a", 6), 1, 1) })), mx, 9, 0.3)); }
  ship.position.set(X + 60, 0, -170); c.root.add(ship);
  // a foreground barrel right by the lens (lens blur: depth like the references)
  c.root.add(mesh(lathe([[0, 0], [0.34, 0], [0.42, 0.45], [0.34, 0.9], [0, 0.9]], 24), barrelM, X + 1.15, 0.0, 2.3));
  // a far island
  const isl = mesh(new THREE.ConeGeometry(30, 34, 9), lam("ld_isl", () => ({ color: "#6a8ab0" })), X - 60, 4, -220);
  c.root.add(mast, band, pot, isl, inkHull(pot, 0.015), inkHull(mast, 0.02));
  // ---- Look v3 density pass (kit.ts) ----
  const K = c.root, top = new THREE.Vector3(X - 1.4, 14.5, -4.5);
  for (const [rx, rz] of [[X - 3.85, -8], [X - 3.85, -6.5], [X - 3.85, -2.5], [X + 3.85, -8], [X + 3.85, -6], [X + 3.85, -2]] as const) K.add(rope(top, new THREE.Vector3(rx, 1.0, rz)));
  for (let k = 0; k < 6; k++) K.add(rope(new THREE.Vector3(X - 3.85, 1.0 + k * 0.5, -8), new THREE.Vector3(X - 3.85, 1.0 + k * 0.5, -2.5), 0.012));
  for (const [x, y, z, s] of [[X - 3.0, 0, -6.4, 0.8], [X - 3.0, 0, -5.5, 0.7], [X - 3.0, 0.8, -6.2, 0.6]] as const) { const cr = crate(s); cr.position.set(x, y, z); K.add(cr); }
  for (const [x, z] of [[X - 2.2, -6.6], [X - 2.4, -5.6], [X - 1.9, -6.0]] as const) { const sk = sack(0.9); sk.position.set(x, 0, z); K.add(sk); }
  const rc = ropeCoil(0.3); rc.position.set(X + 0.6, 0, -6.8); K.add(rc);
  const br = barrel(); br.position.set(X + 3.3, 0, -4.4); K.add(br);
  K.add(lantern(c.glow, X - 1.1, 2.4, -4.2));
  const iron = metalM("#2e2e36");
  for (const [dx, dy, dz] of [[0, 0, 0], [0.2, 0, 0], [0.1, 0, 0.17], [0.1, 0.16, 0.06]] as const) K.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), iron, X + 2.4 + dx, 0.1 + dy, -3.2 + dz));
  K.add(mesh(lathe([[0, 0], [0.16, 0], [0.2, 0.3], [0.21, 0.32], [0, 0.32]], 18), lam("ld_bucket", () => ({ map: rep(planksT("#8a5a32", 6, "bk"), 2, 1) })), X + 0.3, 0, -1.6));
  return { clouds: true };
};
