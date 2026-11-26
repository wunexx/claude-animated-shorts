// Camera motion blur, ONLY on fast moves (whips, fast fly-throughs, snap zooms). The references' glides (peak
// ~14-16 px/f) carry no blur; their whips (45-93 px/f) are always smeared (reports/motion.md 2.2, 5.4).
// How: every pixel is re-projected from the depth buffer into the camera at shutter open and shutter close
// (camAt at f -/+ shutter/2), and the image is gathered along that screen path. Pans, tilts, rolls, dollies and zooms
// all blur correctly (a push-in streaks radially). A gate measured on the camera alone turns it on: 0 below `lo`
// px/frame of screen motion (at 1080x1920), full from `hi`. Below the gate the shader returns the input untouched.
// Camera-only: things moving WITH the camera also streak during a fast move (fine for a whip, where the reference
// smears everything). Deterministic (fixed taps, no noise), and every pixel size scales with output height / 1920.
import * as THREE from "three";
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";

const frag = /* glsl */ `
uniform mat4 projInv;   // current camera: clip -> view
uniform mat4 camWorld;  // current camera: view -> world
uniform mat4 vpA;       // camera at shutter open: world -> clip
uniform mat4 vpB;       // camera at shutter close
uniform float amount;   // gate 0..1 (0 = pass-through)
uniform float maxPx;    // longest streak, px at 1080x1920
vec2 toUv(mat4 vp, vec3 w) { vec4 c = vp * vec4(w, 1.0); return c.xy / max(c.w, 1e-3) * 0.5 + 0.5; }
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (amount <= 0.0) { outputColor = inputColor; return; }
  vec4 v = projInv * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec3 w = (camWorld * vec4(v.xyz / v.w, 1.0)).xyz;
  vec2 d = (toUv(vpB, w) - toUv(vpA, w)) * amount;
  float L = length(d * resolution), M = maxPx * resolution.y / 1920.0;
  if (L < 0.75) { outputColor = inputColor; return; }
  if (L > M) d *= M / L;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < TAPS; i++) acc += texture2D(inputBuffer, uv + d * ((float(i) + 0.5) / float(TAPS) - 0.5)).rgb;
  outputColor = vec4(acc / float(TAPS), inputColor.a);
}`;

export class MotionBlurEffect extends Effect {
  constructor(taps = 24) {
    super("MotionBlurEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      defines: new Map<string, string>([["TAPS", String(taps)]]),
      uniforms: new Map<string, THREE.Uniform>([
        ["projInv", new THREE.Uniform(new THREE.Matrix4())], ["camWorld", new THREE.Uniform(new THREE.Matrix4())],
        ["vpA", new THREE.Uniform(new THREE.Matrix4())], ["vpB", new THREE.Uniform(new THREE.Matrix4())],
        ["amount", new THREE.Uniform(0)], ["maxPx", new THREE.Uniform(140)],
      ]),
    });
  }
}

type Pose = { pos: [number, number, number]; look: [number, number, number]; fov: number; roll: number };
export type MBlurOpts = { lo: number; hi: number; shutter: number; maxPx: number };

/** same pose code as World.update (world.ts) */
const place = (c: THREE.PerspectiveCamera, p: Pose, aspect: number) => {
  c.position.set(...p.pos); c.up.set(0, 1, 0); c.lookAt(...p.look); c.rotateZ(p.roll);
  c.fov = p.fov; c.aspect = aspect; c.near = 0.2; c.far = 1500; c.updateProjectionMatrix(); c.updateMatrixWorld();
};
const GATE_PTS: [number, number][] = [[0, 0], [-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]];
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

/** Set once per frame after the world is posed: `pose(t)` = camAt(id, t) (fractional frames), `cut(f0, f1)` = a hard
 *  cut key in (f0, f1] (the shutter never straddles a cut), `target` = the look point (gate depth). */
export class CameraBlur {
  readonly effect = new MotionBlurEffect();
  /** last frame's measured camera speed (px/frame at 1080x1920) and gate, for tuning */
  speed = 0; gate = 0;
  private a = new THREE.PerspectiveCamera(); private b = new THREE.PerspectiveCamera();
  private p = new THREE.Vector3(); private q = new THREE.Vector3(); private fwd = new THREE.Vector3();
  private vp = new THREE.Matrix4();
  constructor(private o: MBlurOpts) { this.effect.uniforms.get("maxPx")!.value = o.maxPx; }

  update(cam: THREE.PerspectiveCamera, pose: (t: number) => Pose, f: number, cut: (f0: number, f1: number) => boolean, target: THREE.Vector3) {
    const h = this.o.shutter / 2;
    let t0 = Math.max(0, f - h), t1 = f + h;
    if (cut(t0, f)) t0 = f;
    if (cut(f, t1)) t1 = f;
    this.speed = 0; this.gate = 0;
    if (t1 > t0) {
      place(this.a, pose(t0), cam.aspect); place(this.b, pose(t1), cam.aspect);
      // gate: screen travel of 5 points (centre + corners) at the look distance, in px at 1080x1920, per frame
      cam.getWorldDirection(this.fwd);
      const D = Math.max(0.5, this.p.copy(target).sub(cam.position).dot(this.fwd));
      let m = 0;
      for (const [x, y] of GATE_PTS) {
        this.p.set(x, y, 0.5).unproject(cam).sub(cam.position).normalize();
        this.p.multiplyScalar(D / Math.max(1e-3, this.p.dot(this.fwd))).add(cam.position);
        this.q.copy(this.p).project(this.a); this.p.project(this.b);
        m = Math.max(m, Math.hypot((this.p.x - this.q.x) * 540, (this.p.y - this.q.y) * 960));
      }
      this.speed = m / (t1 - t0);
      // > 600 px/f is a jump, not a move (an unmarked cut): no blur
      this.gate = this.speed > 600 ? 0 : sm((this.speed - this.o.lo) / (this.o.hi - this.o.lo));
    }
    const u = this.effect.uniforms;
    u.get("amount")!.value = this.gate;
    if (this.gate > 0) {
      (u.get("projInv")!.value as THREE.Matrix4).copy(cam.projectionMatrixInverse);
      (u.get("camWorld")!.value as THREE.Matrix4).copy(cam.matrixWorld);
      (u.get("vpA")!.value as THREE.Matrix4).copy(this.vp.multiplyMatrices(this.a.projectionMatrix, this.a.matrixWorldInverse));
      (u.get("vpB")!.value as THREE.Matrix4).copy(this.vp.multiplyMatrices(this.b.projectionMatrix, this.b.matrixWorldInverse));
    }
  }
}
