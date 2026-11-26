// usage: node scripts/bridge-stills.mjs <outPrefix> <frame,frame,...> [scale]  (bundles once, GPU via ANGLE, jpeg)
// BRIDGE_ENTRY=src/sandboxes/<name>/index.tsx renders a sandbox copy instead of the main project entry.
import fs from "node:fs";
// Every Remotion bundle copies public/ into the temp dir: keep it inside the skill (studio/.cache/remotion-tmp)
import { fileURLToPath } from "node:url";
const SKILL = fileURLToPath(new URL("../..", import.meta.url));  // real path: templates/scripts -> skill
process.env.REMOTION_TMP ??= `${SKILL}studio/.cache/remotion-tmp`;
fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = process.env.REMOTION_TMP;
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
// studio/scripts is a link to templates/scripts: load packages from the project in the current folder ($STUDIO)
const req = createRequire(path.join(process.cwd(), "package.json"));
const { bundle } = await import(pathToFileURL(req.resolve("@remotion/bundler")).href);
const { renderStill, selectComposition } = await import(pathToFileURL(req.resolve("@remotion/renderer")).href);
const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.BROWSER_EXECUTABLE || undefined;  // default: Remotion's own headless shell (in node_modules)
const chromiumOptions = { gl: process.env.REMOTION_GL || "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.BRIDGE_ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
const inputProps = JSON.parse(process.env.PROPS || "{}");
const composition = await selectComposition({ serveUrl, inputProps, id: process.env.COMP || "LloronaShort", browserExecutable, chromiumOptions });
// PROPS='{"band":true}' draws the caption band and collects the "[band]" warnings from world.ts into one summary at the end
const BAND = new Set();
const onBrowserLog = (l) => {
  if (l.text.startsWith("[band]")) { BAND.add(l.text.slice(7)); return; }
  if (process.env.DEBUG || l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300));
};
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, inputProps, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 180000, onBrowserLog, logLevel: "error" });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
if (inputProps.band) {
  console.log("");
  console.log(BAND.size ? `CAPTION BAND: ${BAND.size} frame(s) with faces/props in y 1280-1520 (fix before the look sheet):` : "CAPTION BAND: clear");
  for (const b of [...BAND].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))) console.log("  " + b);
}
