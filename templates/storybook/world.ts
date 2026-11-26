// The world as one three.js scene: sky dome, light rig, sun / moon discs, stars, sky clouds, the shared water shader,
// and the cast. NO scenery is built here: every place a shot uses is built by its builder in sets.ts (parts from the
// skill's library, or written for the short). update(id, f, camera) poses everything for shot `id` at frame f.
import * as THREE from "three";
import { tintMatcaps } from "./illus";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, V, Kit, Ray, kitClone, GLOW_WIN, GLOW_FIRE, setSight, setGlowBatch } from "./build";
import { ctex, waterNear, waterFar, cloudHD } from "./paint";
import { SETS, SetHooks } from "./sets";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, untone } from "./shade";
import { NOINK } from "./ink";
import { CARD_K } from "./cardshade";
import { BAND, bandOn } from "./captions";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, FOREGROUND, ShotDef, DISCS, SUN_SHOT } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lily_large", "lantern", "cart", "stall-red",
  "stall-green", "stall-bench", "banner-red", "banner-green", "windmill", "canoe"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

/** sun disc (solid, soft rim) and the flat golden halo (lighting.md 6 / depth.md 6.4: r50 13-26 % of the frame width) */
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
// shot 12: the park is ringed by trees and houses, so a low sun ahead-right puts the whole lawn in their shadow

/** every lens position of the film looking at its subject: centre, sides and top of frame (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private discs: THREE.Sprite[] = []; private halos: THREE.Sprite[] = [];
  private fwdCache = new Map<number, [number, number]>();
  /** the places this short built (only those some shot uses), their hooks and glow groups */
  private places = new Map<string, { hooks: SetHooks; glow: THREE.Group }>();
  private stars: THREE.Points;
  private streak: THREE.Mesh;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<string, THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    // the two suns: extra discs + halos (index 0 and 1), posed per frame from story.ts DISCS
    for (let i = 0; i < 3; i++) {
      const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true, transparent: true, blending: THREE.AdditiveBlending }));
      d.renderOrder = -0.5; h.renderOrder = 5;
      for (const m of [d, h]) { m.frustumCulled = false; m.layers.set(NOINK); m.visible = false; R.add(m); }
      this.discs.push(d); this.halos.push(h);
    }
    // stars: fixed points on the upper sky, drawn at night only
    const sp: number[] = [], sr = (k: number) => { const x = Math.sin(k * 91.7) * 43758.5453; return x - Math.floor(x); };
    for (let i = 0; i < 900; i++) {
      const a = sr(i) * Math.PI * 2, el = Math.asin(0.08 + 0.92 * sr(i + 999));
      sp.push(Math.cos(a) * Math.cos(el) * 1000, Math.sin(el) * 1000, Math.sin(a) * Math.cos(el) * 1000);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(1.3, 1.35, 1.5), size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
    this.stars.frustumCulled = false; this.stars.layers.set(NOINK); this.stars.renderOrder = -0.8;
    R.add(this.stars);
    // moonlight path on the water: a long soft additive strip pointing from the lens toward the moon
    this.streak = new THREE.Mesh(new THREE.PlaneGeometry(9, 170), new THREE.MeshBasicMaterial({ map: streakTex(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false, color: new THREE.Color(0.55, 0.65, 1.0) }));
    this.streak.layers.set(NOINK); this.streak.renderOrder = 2; this.streak.frustumCulled = false; R.add(this.streak);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = Object.fromEntries((Object.keys(LOOK) as (keyof typeof LOOK)[]).map((n) => [n, [0, 1, 2, 3].map((k) => cloudHD(k, LOOK[n].cloud))]));
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- water: one shader for every water surface a set adds (c.water(geo)) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "river1";
    const water = (g: THREE.BufferGeometry) => { const wm = new THREE.Mesh(g, waterM); wm.receiveShadow = true; R.add(wm); };

    // ---- the places: build ONLY those a shot uses, each from its sets.ts builder ----
    const rays = sightLines();
    for (const name of new Set(SHOTS.map((s) => s.place))) {
      const glow = new THREE.Group(), gb = new Batch();
      setSight(rays); setGlowBatch(gb);
      const hooks = SETS[name]?.({ root: R, kit, rays, glow, water }) ?? {};
      setGlowBatch(null); setSight([]);
      gb.build(glow, false);
      glow.visible = false; R.add(glow);
      this.places.set(name, { hooks, glow });
    }

    // near framing plants: built once, outside the sight-line test, toggled per frame
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    this.fwdCache.set(id, [fx, fz]);
    const az = THREE.MathUtils.degToRad(SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fwd = new THREE.Vector3();
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], night = s.light === "night";
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    tintMatcaps(night ? [L.charTint[0] * 0.62, L.charTint[1] * 0.78, L.charTint[2]] : L.charTint);
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    CARD_K.uGain.value = night ? 0.9 : 1.03;
    CARD_K.uNorm.value = night ? 0.0 : 0.7; CARD_K.uTintK.value = night ? 1.0 : 0.55; // night: really blue + darker (Look v3)
    // ---- sky, fog, sun / moon, stars, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    const P = this.places.get(s.place)?.hooks ?? {};
    if (P.fog) [this.fog.near, this.fog.far] = P.fog(s.light, this.fog.near, this.fog.far);
    if (P.indoor) { this.fog.near = 200; this.fog.far = 900; }
    scene.fog = this.fog; scene.background = null;
    const ds = P.indoor ? [] : DISCS(id, t), showSun = night && !P.indoor && ds.length === 0;
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    // extra suns / moons of this shot (story.ts DISCS): az / el relative to the CURRENT camera's horizontal forward
    const fl = Math.hypot(c.look[0] - c.pos[0], c.look[2] - c.pos[2]) || 1, fw = [(c.look[0] - c.pos[0]) / fl, (c.look[2] - c.pos[2]) / fl];
    for (let i = 0; i < this.discs.length; i++) {
      const d = this.discs[i], h = this.halos[i], q = ds[i];
      d.visible = h.visible = !!q && q.el > -4;
      if (!q || !d.visible) continue;
      const az = THREE.MathUtils.degToRad(q.az), el = THREE.MathUtils.degToRad(q.el);
      const hx = fw[0] * Math.cos(az) - fw[1] * Math.sin(az), hz = fw[1] * Math.cos(az) + fw[0] * Math.sin(az);
      const dir = V(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el));
      const gold = s.light === "golden" || s.light === "venus";
      if (night) { // a moon
        d.position.copy(cam.position).addScaledVector(dir, 900); d.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.5)));
        (d.material as THREE.SpriteMaterial).color.setRGB(2.4, 2.6, 3.0); h.position.copy(d.position); h.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(9)));
        (h.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(0.35);
        continue;
      }
      d.position.copy(cam.position).addScaledVector(dir, 900);
      d.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(gold ? 3.2 : 3.0)));
      (d.material as THREE.SpriteMaterial).color.copy(gold ? new THREE.Color(2.6, 1.15, 0.3) : new THREE.Color(2.3, 1.75, 0.45));
      h.position.copy(d.position); h.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(gold ? 22 : 11)));
      (h.material as THREE.SpriteMaterial).color.set(gold ? "#ffb060" : "#ffcf60").multiplyScalar(gold ? 1.0 : 0.55);
    }
    if (showSun) {
      const moonDir = night ? V(sunDir.x, Math.max(sunDir.y, 0.42), sunDir.z).normalize() : sunDir;
      this.sunDisc.position.copy(cam.position).addScaledVector(moonDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(night ? 1.5 : 1.7)));
      (this.sunDisc.material as THREE.SpriteMaterial).color.copy(night ? new THREE.Color(2.4, 2.6, 3.0) : new THREE.Color(6.0, 4.4, 2.4));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(night ? 9 : 24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(night ? 0.35 : 1.3);
    }
    this.stars.visible = night || s.light === "space"; this.stars.position.copy(cam.position);
    (this.stars.material as THREE.PointsMaterial).size = s.light === "space" ? 3.0 : 2.2;
    this.streak.visible = night && !!P.streak;
    if (this.streak.visible) {
      const md = V(sunDir.x, 0, sunDir.z).normalize(), wy = 0.03;
      this.streak.position.set(cam.position.x + md.x * 90, wy, cam.position.z + md.z * 90);
      this.streak.rotation.set(-Math.PI / 2, 0, Math.atan2(md.x, md.z));
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60, w = 130 + (i % 4) * 30;
      m.position.set(cam.position.x + Math.cos(a) * d, 120 + (i % 4) * 38, cam.position.z + Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
      mat.opacity = night ? 0.55 : 1;
      m.visible = !!P.clouds && !P.indoor;
    }
    // ---- water ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ---- per-shot scenery ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    for (const [name, pl] of this.places) {
      pl.glow.visible = name === s.place && (s.light === "golden" || s.light === "under" || s.light === "interior" || night);
      pl.hooks.update?.({ id, t, light: s.light, active: name === s.place, cam });
    }
    const gk = night || s.light === "under" ? 1 : 0.55;
    GLOW_WIN.color.setRGB(2.8 * gk, 1.65 * gk, 0.6 * gk); GLOW_FIRE.color.setRGB(3.6 * gk + 0.6, 1.8 * gk + 0.3, 0.5);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0), up = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 1);
    const st = stage(id, t, { pos: cam.position, right, up });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    if (bandOn()) bandCheck(f, id, cam, st);
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      // draw the card at the resolution it fills on screen (2560-px-tall final): a close-up dish / flask was a fixed
      // ~600 px canvas stretched 2-2.5x (soft, low quality); steps 1 / 1.5 / 2 / 3 / 4 keep the cache small
      const dist = Math.max(0.05, this.v.set(p.x, p.y, p.z).sub(cam.position).dot(this.fwd.set(0, 0, -1).applyQuaternion(cam.quaternion)));
      const need = (p.h / (2 * dist * Math.tan(((cam as THREE.PerspectiveCamera).fov * Math.PI) / 360))) * 2560 / p.ch;
      const fk = need <= 1.1 ? 1 : need <= 1.6 ? 1.5 : need <= 2.2 ? 2 : need <= 3.2 ? 3 : 4;
      e.r = this.pool.req(p.key, Math.round(p.cw * fk), Math.round(p.ch * fk), fk, p.draw);
      e.use(!!p.soft, !!p.see);
      e.mat.color.setScalar(p.glow ?? 1); e.soft.color.setScalar(p.glow ?? 1); e.see.color.setScalar(p.glow ?? 1);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.wall !== undefined) e.mesh.rotation.set(0, p.wall, p.rot ?? 0); // hung on a wall: fixed facing (a camera-facing card tilts into the wall and gets cut)
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}

/** broken horizontal glints, densest in the middle of the strip, fading at both ends */
const streakTex = () => ctex("moonStreak", 128, 1024, (g) => {
  g.clearRect(0, 0, 128, 1024);
  for (let i = 0; i < 260; i++) {
    const y = (i * 97.3) % 1024, w = 10 + ((i * 37) % 70), x = 64 - w / 2 + (((i * 53) % 40) - 20) * (1 - Math.sin((y / 1024) * Math.PI));
    const a = Math.sin((y / 1024) * Math.PI) ** 1.5 * (0.35 + 0.65 * ((i * 29) % 10) / 10);
    g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.fillRect(x, y, w, 2 + (i % 3));
  }
});


const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);           // slow river along +x
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

// ---------------- caption-band check (look-check stills with inputProps { band: true }) ----------------
/** Logs "[band] f<frame> shot <id>: <who> y=<px>" (1080x1920 px) for every character face and every solid prop card
 *  that sits in the caption band BAND. Faces = head centre ~1.44 m x scale above the feet (adult card). Props = the
 *  card's vertical span on screen; reported when >= 30 % of it overlaps the band. Soft / flat / `bg` (scenery) / backdrop-sized cards
 *  (taller than 600 px on screen) are skipped. Fix every line before rendering the look sheet. */
const BV = new THREE.Vector3();
const scrY = (cam: THREE.Camera, x: number, y: number, z: number) => { BV.set(x, y, z).project(cam); return BV.z < 1 && Math.abs(BV.x) <= 1.05 ? (1 - (BV.y + 1) / 2) * 1920 : NaN; };
const bandCheck = (f: number, id: number, cam: THREE.Camera, st: { places: { key: string; x: number; y: number; z: number; scale?: number }[]; fx: { key: string; x: number; y: number; z: number; w: number; h: number; soft?: boolean; flat?: boolean; bg?: boolean }[] }) => {
  const [b0, b1] = BAND, hits: string[] = [];
  for (const p of st.places) {
    const sc = p.scale ?? 1;
    if (sc < 0.3 && p.key.startsWith("F|") === false) continue;
    const y = scrY(cam, p.x, p.y + 1.44 * sc, p.z);
    if (y >= b0 && y <= b1) hits.push(`face ${p.key.split("|")[1] ?? p.key} y=${Math.round(y)}`);
  }
  for (const e of st.fx) {
    if (e.soft || e.flat || e.bg) continue;
    const yt = scrY(cam, e.x, e.y + e.h / 2, e.z), yb = scrY(cam, e.x, e.y - e.h / 2, e.z);
    if (!isFinite(yt) || !isFinite(yb) || yb - yt > 600 || yb - yt < 8) continue;
    const ov = Math.max(0, Math.min(yb, b1) - Math.max(yt, b0)) / (yb - yt);
    if (ov >= 0.3) hits.push(`prop ${e.key.split("|")[0]} y=${Math.round(yt)}-${Math.round(yb)}`);
  }
  if (hits.length) console.warn(`[band] f${f} shot ${id}: ${hits.join("; ")}`);
};
