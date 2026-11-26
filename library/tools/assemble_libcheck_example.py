"""Rebuild Two Suns from the new core (src/videos/_kit) + library parts only, into src/videos/_libcheck, exactly the
way a new short would use the library. Its stills must match out/twosuns/v2."""
import pathlib, shutil
ROOT = pathlib.Path(__file__).resolve().parents[2] / "studio"  # the Remotion project inside the skill
KIT, OUT, TS = ROOT / "src/videos/_kit", ROOT / "src/videos/_libcheck", ROOT / "src/videos/twosuns"
LIB = ROOT / "twosuns/_lib/library"
if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(KIT, OUT)

def append(dst, *parts):
    p = OUT / dst
    p.write_text(p.read_text(encoding="utf-8") + "".join("\n" + (LIB / x).read_text(encoding="utf-8") for x in parts), encoding="utf-8")

def rep(dst, a, b):
    p = OUT / dst
    s = p.read_text(encoding="utf-8")
    assert a in s, (dst, a[:80])
    p.write_text(s.replace(a, b, 1), encoding="utf-8")

# 1. story: the short's own
shutil.copy(TS / "story.ts", OUT / "story.ts")
# 2. sets this short needs
append("build.ts", "sets/town.ts.txt", "sets/harbour.ts.txt", "sets/sea.ts.txt", "sets/room.ts.txt", "sets/space.ts.txt", "sets/alien_ground.ts.txt", "fx/vapour_quilt.ts.txt")
rep("sets.ts", "export const SETS: Record<string, SetBuilder> = {\n  // register this short's places here\n};", '''import { townSet, buildHarbour, seaSet, quiltSet, buildRoom, spaceSet, buildVenus } from "./build";
import { BOATS, BAKER, BENCH, PIER, LID_C, LID_Y, BX, VENUS, VENUS_R, SINKER } from "./story";
export const SETS: Record<string, SetBuilder> = {
  town: both(townSet, (c) => { buildHarbour(c.root, c.rays, c.glow, { boats: BOATS, baker: BAKER, bench: BENCH }); }),
  sea: both(seaSet(PIER), quiltSet({ shot: 9, center: LID_C, y: LID_Y, layers: [[0, 36.5], [2.6, 39.3]] })),
  room: (c) => { buildRoom(c.root, [BX, 0, 0]); return { indoor: true }; },
  space: spaceSet(VENUS, VENUS_R),
  venus: (c) => { buildVenus(c.root, SINKER); return {}; },
};''')
# 3. characters + fx drawings
append("toon.ts", "characters/twosuns_cast.ts.txt")
# 4. staging: library helpers + the short's own stage() switch
C = (OUT / "cast.ts").read_text(encoding="utf-8")
helpers = (LIB / "cast/twosuns_helpers.ts.txt").read_text(encoding="utf-8")
own = (TS / "cast.ts").read_text(encoding="utf-8")
own = own[own.index("export const stage = (id: number, t: number, cam: CamInfo): Stage => {"):]
own = own.replace("  TWO = id !== 14;\n", "  setShadowTails(id !== 14 ? [-0.8, 0.8] : [0]);\n")
C = C.replace("// ---- library staging helpers (paste library/cast/*.ts.txt here when a short needs them) ----",
              "// ---- library staging helpers (paste library/cast/*.ts.txt here when a short needs them) ----\n" + helpers)
C = C[:C.index("export const stage = (id: number, t: number, cam: CamInfo): Stage => {")] + own
C = C.replace("  // + the drawings of the library characters / fx this short appended to toon.ts",
              "  seaFolk, BAKER_O, FISHER_O, sunKid, dog, DogOpts, fxOrbit, fxSweat, fxSteam, fxBeam, fxPanel, fxBed, fxScoop, fxSplat, fxSinker, fxHeat, fxStar, fxWindow, fxCloudBank,")
C = C.replace('import { FPS, SHOTS, V3, smooth, clamp01 } from "./story";',
              'import { FPS, SHOTS, V3, smooth, clamp01, D0, L, SP, BAKER, GROUP3, DOG3, KID4, BOAT5, PIER, NIGHT7, PANELS, BENCH, BED, SINKER, DOG14 } from "./story";')
(OUT / "cast.ts").write_text(C, encoding="utf-8")
print("assembled")
