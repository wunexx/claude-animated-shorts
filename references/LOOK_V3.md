# Look v3: the visual target (study of the five reference shorts, 2026-11-24)

Private study only (the five videos live in the user's `library/` root: jar / railroad / office / storm oil / brain).
Never upload, publish or send them; never copy their characters, shots or stories. This file records the VISUAL
rules they share, in numbers where possible, so the template can be pinned to them. It replaces Look v2 (2026-11-16),
whose "dark night, no black world ink, paper grain" rules came from a different, folklore-style reference set and
produced the dim, cheap-looking Liechtenstein and castle-toilet shorts the user rejected.

## 1. The overall impression
Bright, saturated, glossy and DENSE. Every frame looks like a finished animated feature still: a richly dressed 3D set,
lit by a clear key light plus local lamps, with bold cartoon characters (white bean heads, thick dark outlines) placed
big in the frame. Nothing is empty, flat grey or dim. Even "night" is a bright saturated blue picture.

Measured (180x320 per frame, 1 frame / 2 s, caption band masked; `scripts/look_stats.py`):
| short | lum | chroma | detail | p98 | dark |
|---|---|---|---|---|---|
| jar (palace, gold, night garden) | .38 | .24 | .075 | .91 | .010 |
| railroad (desert canyon, sun) | .47 | .32 | .074 | .94 | .008 |
| office (tiled office, lamps) | .58 | .27 | .062 | .98 | .018 |
| storm oil (ship, sea storm) | .36 | .41 | .075 | 1.0 | .064 |
| brain (lamp-lit studio, dark by design) | .22 | .17 | .041 | .84 | .216 |
| OURS Liechtenstein (rejected) | .21 | .14 | .047 | .88 | .153 |
| OURS castle toilets (rejected) | .51 | .16 | .040 | .86 | .009 |
| Look v3 test bench (template, sparse sets) | .35 | .41 | .050 | .94 | .063 |
Gate: lum .33-.62, chroma .22-.48, detail >= .058, p98 >= .90, dark <= .08 (a deliberately dark short may miss lum,
never chroma). Chroma and detail are where the rejected shorts failed hardest (half the chroma, ~60 % of the detail).

## 2. Characters
- **White heads.** Skin is near-white (#faf7f3) on almost every character, with a soft cool-grey gradient on the shade
  side and, on some, a faint pink blush. Peach skin is the exception, not the default.
- **Big heads, short bodies.** Head ~1/3 of the total height (bean head wider than the body); torso a rounded bean
  ~1 head tall; thin stick legs ~1 head; dot hands. (Template BUILD: adult a 134, torso 1.02, legs 0.98.)
- **Bold outline**: one dark warm-black line, ~2.5-3.5 % of the head width, the same weight on head, body and limbs.
- **Faces** low on the head: heavy brows, dash / dot / ring eyes, small mouths; expression carries every joke
  (sweat drop, steam puffs, purple angry face, grit teeth).
- **Outfits** are simple flat colour blocks with ONE or two strong details (gold buttons, a striped cap, red trim,
  a chef hat, braid on a collar), slightly shaded top-to-bottom.
- They are LIT: warm in lamplight, lavender-blue at night, darker in cast shadow, with a contact shadow on the floor.
- In frame they are BIG: heads typically 15-35 % of the frame width in dialogue; two-shots at hip height; wides only
  for places and crowds (a wide still has hundreds of tiny figures when it shows an army).

## 3. World modelling
- Real 3D sets with chunky, bevel-free cartoon geometry, but a LOT of it: columns with capitals, arches, beams,
  railings with balusters, steps, door frames, window mullions, shelves, rails with bolts, rocks and gravel as meshes.
- **Hero props are smooth glossy 3D models** (gold dragons, a grey glazed jar, copper pots, brass portholes, a green
  glass bottle, steel balls): saturated body colour, a crisp white highlight, a dark core shadow, a rim light. The
  template does this with toon-ramp matcaps (`illus.ts metalM / glazeM`: flat bands, one sharp highlight - smooth
  gradients read as plastic CG) plus an inverted-hull ink outline (`inkHull(mesh, w)`), so props carry the same bold
  line as the characters.
- **Density**: every set has 15-40 distinct dressing objects in view (candles, banners, curtains, carpets, crates,
  barrels, ropes, lamps, plants, clocks, posters, signage). Empty walls and empty floors do not exist.
- **In-world text**: signs, posters, newspapers, door labels, calendars, phone screens carry readable story text
  ("CAREER DEVELOPMENT ROOM", "FIRST LINE IN GETS IT ALL!", "NOV FRI 11"); prefer them to label cards.

## 4. Surfaces (textures)
Illustrated, not photographic and not flat: a saturated base colour, DARK INK LINES on every seam / joint / pattern
edge, a lighter highlight line on the top edge of blocks and planks, per-piece value variation, and dense repeating
patterns (damask, fleur-de-lis, diamond carpets with borders, quilted upholstery, tile grids, wood grain with knots
and nail dots). The template's `illus.ts` paints these (`planksT, blocksT, damaskT, carpetT, tilesT, tuftedT, roseT,
bannerT, stripesT`). Large surfaces use deep, slightly muted bases (navy carpet, crimson wallpaper, warm grey stone);
full saturation is saved for accents (gold trim, a red button, a teal rail cap). The old `paint.ts` textures are low
contrast: replace them in library sets you reuse.

## 5. Light
- **Day**: a clear warm key from the side / three-quarter back, light blue-neutral shade (shade ~0.6 x lit, NOT blue
  enough to turn reds magenta), deep saturated blue sky (#1a56c4 at the top to #cfe3fa at the horizon) with big soft
  white cartoon clouds, cyan sea.
- **Interior** (new preset): lit by its own sources. A dim neutral ambient (shade ~.42) and warm PointLights at every
  candle / torch / lamp / window (the world shader now adds them: `shade.ts`), so light pools fall off into darker
  corners; a heavier vignette (`GRADE_INTERIOR`). Lamps need a SHORT reach (distance 3-5.5 m, decay 2, intensity ~4-6):
  with 6-10 m reach the pools overlap and the room goes evenly bright (the reviewer scored that 4.5/10).
- **Night** is BRIGHT and blue and RELIT, not tinted: world saturation .6 (warm albedo goes cool), glossy props tinted
  harder, a cool moonlight rim on character edges (cardshade), warm colour kept for emissive accents only; sky #18298a top to #6a88e6 horizon, a big glowing moon in frame, stars, lavender-white
  faces, blue-shifted outfits, warm windows / lamps as accents. Not black: median luma ~.3-.35.
- **Sunset**: orange-pink gradient sky, sun disc in frame, long warm light.
- Bloom on every emissive (candles, bulbs, moon, sun, windows): intensity .9, threshold .92.
- Shadows are soft-edged and cast by everything (characters too).

## 6. Lines (ink)
Most shots ink the 3D world with a bold near-black line on silhouettes and creases (`ink.ts`: #120e16, strength 1.0,
5 px near / 2.2 px far at 1080x1920, creases .55; the references' lines are ~4-6 px at 1080). Check ink on FULL-SIZE stills: half-size stills show ~1 px lines.

## 7. Camera and composition
- Characters big; camera at chest height or low, often slightly upward; foreground objects near the lens (a pot rim,
  a railing, a column) in lens blur.
- Strong depth of field on every close and medium shot (background clearly soft), sharp wides.
- Inserts fill the frame with one hero object (a clock, a phone, a bowl of broth, a mechanism) reached by a push-in.
- Cutaways / mechanism views are lit beautifully (glowing bulbs, gold metal), not diagrams.
- Wides are spectacular: crane shots over a city or army, a castle in a valley, a ship in a storm wave.
- Effects are painterly and bright: god rays, rain streaks, smoke, sparks, splash spray, water wakes.

## 8. Grade
Saturation x1.05-1.1 on top of saturated albedo, gentle S-curve, highlights reaching white (p98 >= .9), light
vignette by day (.1), heavier indoors (.34). No paper-grain overlay (it greyed the picture; `PROPS paper:true`
brings it back only if a story wants it).

## 9. Verification log (independent Opus reviewer, test bench vs reference frames, look only)
Old look 3.5/10 -> Look v3 round 1 5.5 -> round 2 (ink 5 px, interior ambient cut, night relit) 5.5 -> round 3 (short
lamp reach: warm pools) 6.0 -> round 4 (toon matcaps + ink hulls on props, moon in frame) 6.5 -> round 5 (surface pass: contact AO, tone
variation, wall grime, painted wear) 6.5 'too faint to read' -> round 6: the surface pass pushed ~2x (AO .85 over 1.3 m,
tone +-15 %, grime .24, bigger paint chips, reds ~20 % less saturated) 6.5-7 (hall 7) -> round 7: paint chips as
irregular bare-wood flakes clustered along edges (round 6 read them as polka dots). Remaining gaps named by the
reviewer: SURFACE RICHNESS - contact ambient occlusion (corners, under objects), painted grime / wear and colour
variation on every large surface (no clean flat fields: a plain red rail, a plain pot, bare walls); set dressing and
modelling density (capitals, balusters, rigging, statues); night faces still not fully lavender; loud flat accent
colours (pot #c8783a, not pure orange). The surface pass (AO + grime + wear) is now built in; what remains is per-short work: modelling and dressing density. The test bench is deliberately sparse; a real short must dress its sets to reach
detail >= .058 (`look_stats.py`).

Round 7 (2026-11-25, dressing kit `kit.ts`, glows fixed in the interior preset, lavender night faces): 7/10 overall
(hall 7, day deck 6.5, night 7). The reviewer's last note was FRAMING: wide cameras make characters tiny and rooms
read empty; shoot close and low (subject ~50 % of the frame) with blurred foreground props. The bench cameras are back
to close / low; every short must frame that way too (SKILL.md step 4 + Look v3 camera rule).
