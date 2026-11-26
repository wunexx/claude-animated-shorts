# Look v3 test bench (lookdev)

Three test shots that pin the template's look to the five reference shorts: an interior hall lit by candles and
torches, a ship deck in daylight, and the same deck at night. Use it after ANY change to lights / shaders / grade /
ink / textures, and as a worked example of set dressing at reference density. Not a short: never deliver it.

## Wire it (about 5 minutes)
1. Copy `templates/storybook/` to `src/videos/lookdev/` and `templates/lookdev/scenes.ts` beside it.
2. Register `<Composition id="LookDev" ... durationInFrames={LOOK_FRAMES} fps={30} width={1080} height={1920} />` in `src/Root.tsx`
   (`import { BridgeShort as LookShort, BRIDGE_FRAMES as LOOK_FRAMES } from "./videos/lookdev/Bridge";`).
3. `sets.ts`: `import { hallSet, deckSet } from "./scenes";` and `SETS.hall = hallSet as SetBuilder; SETS.deck = deckSet as SetBuilder;`
4. `story.ts`:
   ```ts
   export const TOTAL = 90;
   // SHOTS
   { id: 1, a: 0, b: 30, light: "interior", place: "hall" },
   { id: 2, a: 30, b: 60, light: "day", place: "deck" },
   { id: 3, a: 60, b: 90, light: "night", place: "deck" },
   // DISCS (the moon in frame at night)
   export const DISCS = (id: number, _t: number): Disc[] => (id === 3 ? [{ az: -8, el: 13 }] : []);
   // CAMS (replace the example S1a + CAMS block)
   const CAMS: Record<number, Key[]> = {
     1: [{ f: 0, s: () => ({ pos: [0.9, 1.25, 1.9], look: [-0.1, 1.9, -5], fov: 54 }) }],
     2: [{ f: 30, cut: true, s: () => ({ pos: [3001.2, 1.45, 3.0], look: [2999.9, 1.55, -3], fov: 50 }) }],
     3: [{ f: 60, cut: true, s: () => ({ pos: [3001.2, 1.45, 3.0], look: [2999.9, 1.55, -3], fov: 50 }) }],
   };
   // DOF
   { f: 0, cInf: 10, focus: () => [0.4, 1.5, -1.2] }, { f: 30, cInf: 10, focus: () => [3000.3, 1.5, 0.2] },
   ```
5. `cast.ts`: import `OFFICER, PARENT, KID` from `./toon` and add to the `stage()` switch:
   ```ts
   case 1:
     front(out, cam, t, 1, OFFICER, "off", [0.45, 0, -1.0], { mode: "stand", expr: "stern" }, { face: [-0.6, 1.5, -1.7] });
     front(out, cam, t, 2, PARENT, "par", [-0.7, 0, -1.8], { mode: "stand", expr: "grin" }, { face: [0.45, 1.5, -1.0] });
     break;
   case 2: case 3:
     front(out, cam, t, 3, KID, "kid", [3000.35, 0, 0.25], { mode: "stand", expr: "smile", prop: "cone" }, { face: [2999.4, 1.5, -0.5] });
     front(out, cam, t, 4, OFFICER, "off", [2999.45, 0, -0.6], { mode: "stand", expr: "stern" }, { face: [3000.35, 1.5, 0.25] });
     break;
   ```
6. Render at FULL size (half-size stills thin the ink lines to ~1 px):
   `COMP=LookDev PROPS='{"captions":false}' node scripts/bridge-stills.mjs out/look/x_ 10,40,70 1`
   then `python scripts/look_stats.py out/look` and compare side by side with the reference frames.

Expected (2026-11-25): lum ~.34, chroma ~.35, p98 ~.94, dark ~.04; detail ~.053 (the bench is sparser than a real
set: a dressed short must reach >= .058). Debug views: `PROPS='{"inkDebug":1}'` = ink mask, `2` = world normals.
