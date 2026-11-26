// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export type LightName = "day" | "golden" | "night" | "hot" | "space" | "venus" | "under" | "interior";
export const LIGHTS: Record<LightName, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.3, 1.25, 1.17], shade: [0.62, 0.6, 0.66], lift: [0.03, 0.03, 0.035], lambert: 0.8, sideK: 0.8, term: 0.45,
    charTint: [1.0, 0.97, 0.96], charShade: 0.86, charGrad: 0.13, bodyGrad: 0.26, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#1a56c4", hor: "#cfe3fa", skyCurve: [0.0, 0.5, 0.6], fog: "#cfe3fa", fogNear: 60, fogFar: 520, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.78, 0.36], shade: [0.2, 0.15, 0.22], lift: [0.06, 0.04, 0.08], lambert: 0.75, sideK: 0.8, term: 0.3,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
  // moonlit night (La Llorona): cool blue key from a high moon, deep indigo shade, navy sky, fog = horizon blue
  night: {
    az: 60, el: 38,
    lit: [0.48, 0.6, 1.25], shade: [0.2, 0.27, 0.66], lift: [0.04, 0.06, 0.18], lambert: 0.75, sideK: 0.8, term: 0.45,
    charTint: [0.7, 0.64, 1.04], charShade: 0.84, charGrad: 0.14, bodyGrad: 0.3, sideTint: [0.7, 0.72, 1.0],
    blob: [0.4, 0.42, 0.62], actorShadow: false,
    top: "#18298a", hor: "#5a7ae0", skyCurve: [0.0, 0.5, 0.6], fog: "#3f62d0", fogNear: 60, fogFar: 420, sunDisc: "#f4f6ff",
    sunCol: "#c8d6ff", sunI: 2.4, sky: "#6a86e0", ground: "#2a3470", hemiI: 0.7,
    bias: -0.0004, normalBias: 0.02,
  },
  // two-sun noon: white-hot key, warm shade, pale washed-out sky, hazy warm fog
  hot: {
    az: 70, el: 55,
    lit: [1.72, 1.5, 1.1], shade: [0.36, 0.28, 0.3], lift: [0.08, 0.05, 0.05], lambert: 0.8, sideK: 0.8, term: 0.45,
    charTint: [1.0, 0.95, 0.86], charShade: 0.88, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.98, 0.9, 0.86],
    blob: [0.66, 0.58, 0.56], actorShadow: false,
    top: "#7aa2d6", hor: "#f3e3bc", skyCurve: [0.0, 0.5, 0.6], fog: "#e8dcc0", fogNear: 60, fogFar: 460, sunDisc: "#fff6dc",
    sunCol: "#fff1d0", sunI: 3.2, sky: "#fff0d8", ground: "#c49a70", hemiI: 0.6,
    bias: -0.00025, normalBias: 0.015,
  },
  // outer space: hard white key from the far side, near-black shade, black sky
  space: {
    az: -100, el: 8,
    lit: [1.65, 1.52, 1.32], shade: [0.03, 0.025, 0.05], lift: [0.005, 0.005, 0.015], lambert: 0.6, sideK: 0.84, term: 0.25,
    charTint: [1, 1, 1], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [1, 1, 1],
    blob: [0.5, 0.5, 0.6], actorShadow: false,
    top: "#000000", hor: "#03040c", skyCurve: [0.0, 0.5, 0.6], fog: "#03040c", fogNear: 4000, fogFar: 9000, sunDisc: "#fff6e0",
    sunCol: "#fff6e8", sunI: 3.0, sky: "#20243a", ground: "#000000", hemiI: 0.1,
    bias: -0.0004, normalBias: 0.02,
  },
  // the Venus ground: orange murk, no visible sun, warm haze close in
  /** the Underworld (Sisyphus): dark plum-red sky, ember-orange key from low, lava glows carry the frame */
  under: {
    az: 35, el: 30,
    lit: [1.35, 0.66, 0.42], shade: [0.16, 0.07, 0.12], lift: [0.05, 0.015, 0.04], lambert: 0.3, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.8, 0.68], charShade: 0.84, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.7, 0.85],
    blob: [0.5, 0.35, 0.4], actorShadow: false,
    top: "#14060f", hor: "#9a3220", skyCurve: [0.0, 0.5, 0.6], fog: "#5a1c1c", fogNear: 25, fogFar: 170, sunDisc: "#000000",
    sunCol: "#ff9a60", sunI: 2.0, sky: "#a04030", ground: "#3a1418", hemiI: 0.45,
    bias: -0.0004, normalBias: 0.02,
  },
  // interior (Look v3, 2026-11-24): a room lit by its own lamps / candles / windows (add PointLights in the set; the
  // world shader adds them). Dim neutral ambient so the warm pools carry the frame; the sun only through windows.
  interior: {
    az: 60, el: 40,
    lit: [0.95, 0.9, 0.82], shade: [0.4, 0.4, 0.45], lift: [0.015, 0.015, 0.02], lambert: 0.8, sideK: 0.8, term: 0.45,
    charTint: [1.0, 0.9, 0.76], charShade: 0.86, charGrad: 0.16, bodyGrad: 0.3, sideTint: [0.8, 0.78, 0.9],
    blob: [0.55, 0.5, 0.5], actorShadow: false,
    top: "#2a2430", hor: "#4a4048", skyCurve: [0.0, 0.5, 0.6], fog: "#3a3238", fogNear: 40, fogFar: 300, sunDisc: "#000000",
    sunCol: "#ffe2b8", sunI: 1.6, sky: "#b8a8a0", ground: "#5a4a40", hemiI: 0.4,
    bias: -0.0004, normalBias: 0.02,
  },
  venus: {
    az: 40, el: 50,
    lit: [1.5, 0.92, 0.48], shade: [0.42, 0.22, 0.14], lift: [0.1, 0.05, 0.02], lambert: 0.25, sideK: 0.84, term: 0.3,
    charTint: [1.0, 0.8, 0.6], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [1, 0.85, 0.7],
    blob: [0.6, 0.45, 0.4], actorShadow: false,
    top: "#7a3a1e", hor: "#ffb35a", skyCurve: [0.0, 0.5, 0.6], fog: "#e99a52", fogNear: 3, fogFar: 40, sunDisc: "#ffd09a",
    sunCol: "#ffc890", sunI: 2.0, sky: "#ffb070", ground: "#7a3a1e", hemiI: 0.6,
    bias: -0.0004, normalBias: 0.02,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LightName, WorldLook> = {
  interior: {
    sky: { c: ["#4a4048", "#3a3440", "#2a2430", "#201c26", "#18141c"], e: [0, 4, 12, 26, 60] },
    water: { near: "#1a3a5a", mid: "#22486a", far: "#2a5070", crest: "#6a90b0", trough: "#10283a", glint: "#ffe8c0", shade: [0.6, 0.6, 0.7] },
    cloud: { lit: "#6a5a60", mid: "#4a4048", shade: "#2a2430" },
    bounce: [0.03, 0.02, 0.0],
    sat: 0.95,
  },
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#cfe3fa", "#8fbdf0", "#4f93e6", "#2f74d8", "#1a56c4"], e: [0, 4, 12, 24, 55] },
    water: { near: "#3a9ad0", mid: "#4aa6d8", far: "#a9d3ea", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.0,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.0,
  },
  night: {
    sky: { c: ["#6a88e6", "#4a6ad6", "#3352c4", "#243eaa", "#18298a"], e: [0, 4, 12, 26, 60] },
    water: { near: "#1a3aa8", mid: "#2448b8", far: "#4a6ad6", crest: "#8fb0ff", trough: "#10267a", glint: "#e8f0ff", shade: [0.6, 0.66, 0.9] },
    cloud: { lit: "#a8b8f0", mid: "#7088d8", shade: "#4a5ab8" },
    bounce: [0, 0, 0.01],
    sat: 0.6,
  },
  hot: {
    sky: { c: ["#ece0c2", "#d6e0e2", "#a8c8e6", "#7fb0e2", "#5a92d6"], e: [0, 4, 10, 22, 50] },
    water: { near: "#3aa6a0", mid: "#2f8ea8", far: "#9ec2c4", crest: "#b8eee6", trough: "#1d6a80", glint: "#ffffff", shade: [0.6, 0.58, 0.66] },
    cloud: { lit: "#fffaf0", mid: "#f0e6d8", shade: "#d8cbc4" },
    bounce: [0.03, 0.02, 0.0],
    sat: 1.05,
  },
  space: {
    sky: { c: ["#03040c", "#02030a", "#020208", "#010105", "#000000"], e: [0, 4, 10, 22, 50] },
    water: { near: "#000000", mid: "#000000", far: "#000000", crest: "#000000", trough: "#000000", glint: "#000000", shade: [1, 1, 1] },
    cloud: { lit: "#000000", mid: "#000000", shade: "#000000" },
    bounce: [0, 0, 0],
    sat: 1.0,
  },
  under: {
    sky: { c: ["#b2401f", "#7a2620", "#4a1420", "#260a18", "#12050d"], e: [0, 4, 10, 22, 50] },
    water: { near: "#000000", mid: "#000000", far: "#000000", crest: "#000000", trough: "#000000", glint: "#000000", shade: [1, 1, 1] },
    cloud: { lit: "#8a3a2c", mid: "#5a2026", shade: "#2e1020" },
    bounce: [0.05, 0.01, 0.0],
    sat: 1.0,
  },
  venus: {
    sky: { c: ["#ffb35a", "#f7a24c", "#e08440", "#c0642e", "#8a4422"], e: [0, 4, 10, 22, 50] },
    water: { near: "#000000", mid: "#000000", far: "#000000", crest: "#000000", trough: "#000000", glint: "#000000", shade: [1, 1, 1] },
    cloud: { lit: "#ffc27a", mid: "#e89050", shade: "#b0603a" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.05,
  },
};
