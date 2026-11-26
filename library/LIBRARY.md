# Parts library (cartoon-3d-short)

Reusable scenery, characters, effects and staging helpers built for earlier shorts. **Nothing here is used unless a
short needs it.** The core template (`templates/storybook/`) builds no scenery at all: a place appears only when the
short registers a builder for it in `sets.ts`.

**Look v3 (2026-11-24):** every part below was built for the retired Look v2 and paints its surfaces with the
low-contrast `paint.ts` textures (grassHD, stoneHD, facadeHD, planks...). When you reuse one, swap its large surfaces
for `illus.ts` textures (`planksT, blocksT, damaskT, carpetT, tilesT, tuftedT, bannerT, stripesT`), its hero props for
`metalM` / `glazeM` matcaps, add PointLights to interiors and dress it to 15-40 objects per view
(`references/LOOK_V3.md`). `templates/lookdev/scenes.ts` is a worked example of a hall and a ship deck in Look v3.

## How to use a part (copy only what the story needs)
1. Read this catalogue (not the parts). Pick the parts whose description fits a shot. When nothing fits, write the set
   for this short and add it here afterwards (see "Adding parts").
2. Append each part's file to the END of the target file in the short's folder. `sets/*.ts.txt` and
   `fx/vapour_quilt.ts.txt` go into **build.ts**, below the `library parts appended below this line` marker.
   `characters/*.ts.txt` go into **toon.ts**. `cast/*.ts.txt` go into **cast.ts**, below `// ---- library staging helpers`.
   Use a script: `cat <part> >> build.ts`. Do not read the part into the conversation first; read only its header
   (first ~6 lines).
3. Wire it as the part's header says: usually one line in `sets.ts` (`SETS.<place> = ...`). Add the story constants it
   needs to `story.ts` (e.g. `D0` for the town) and the names to the import lists in `cast.ts`.
4. `npx tsc --noEmit` and fix only what it reports.

Places live far apart in one world (they never see each other): keep the town at the origin, other places at
x = ±3000 / z = ±8000. Every set gets the sight lines of all cameras, so props that block a lens are left out.

## Scenery sets (`sets/`, append to build.ts)
| part | what it looks like | register | needs | size |
|---|---|---|---|---|
| `town.ts.txt` | River town: river along x (water y 0), cobbled quays at z = ±30..36.5 (top `D0` = 6), embankment walls, a 3-pier stone bridge at x = 0, rows of gabled painted houses on both banks, church with twin towers and dome, hills, cartoon trees, quay lamps (glow at dusk and night) | `SETS.town = townSet;` | story `D0`, `smooth` | 266 lines |
| `harbour.ts.txt` | Harbour dressing for the town: fishing boats on the river, triangle bunting along both quays (fairy bulbs), striped bakery awning, quay bench, crates and lobster pots | `SETS.town = both(townSet, (c) => { buildHarbour(c.root, c.rays, c.glow, { boats, baker, bench }); });` | town set | 81 |
| `mexico_dressing.ts.txt` | Mexican dressing: papel picado strings with bulbs, cacti, agave, clay pots, reeds at the waterline, cypress. `dressTown` for the town, `dressLake` for the lake city | call inside the town / lake builder | town or lake_city | 107 |
| `lake_city.ts.txt` + `lake.ts` | Aztec lake city: island with canals, 4-tier twin-shrine temple, white flat-roofed houses, causeway, chinampas, torch glows; `buildShips` = Spanish brigantines | see header | story `LX`, `ISLE`; copy `lake.ts` beside build.ts | 149 |
| `sea.ts.txt` | Open sea to the horizon, wooden pier with posts and rails along +z, red/white striped lighthouse on rocks (lamp glows golden/night), far green island | `SETS.sea = seaSet(PIER);` | — | 36 |
| `room.ts.txt` | Small bedroom open toward the lens: striped wallpaper with dots, plank floor, skirting, bedside table (bed/window are fx cards) | `SETS.room = (c) => { buildRoom(c.root, [BX, 0, 0]); return { indoor: true }; };` | — | 26 |
| `bathroom.ts.txt` | Small tiled bathroom (blue-ring tiles, checker floor) open toward the lens | like room | — | 32 |
| `space.ts.txt` | A banded planet (Venus texture, slow spin) with an orange atmosphere glow; use light `space` (black sky, stars) | `SETS.space = spaceSet(SP(0, 0, 0), 30);` | light `space` | 39 |
| `japan.ts.txt` | Sengoku Japan: Kyoto machiya street + roofed gate whose doors fall (DOOR per shot) + 3-storey Nanban-ji with a cross; audience hall with tatami, dais and gold screen; harbour jetty + black Portuguese ship with red-cross sails; Honno-ji temple with hipped roof, earth walls, banners, fire glows | `SETS.kyoto = (c) => kyotoSet(c)` (+ hall / sea / temple) | story `HX`, `SX`, `TZ`, `GATE_Z`, `DOOR` | ~330 |
| `greece.ts.txt` | Greek myth: Tartarus ember-rock hill (slope along +x, lava channels, jagged peaks) with a lit 3D boulder posed per shot; Corinth marble terrace, colonnade, throne, balustrade over the sea, cypresses; a sunny cliff with a red-glowing cave mouth; Olympus cloud-puff floor with broken columns; a 1940s café front at night | `SETS.tartarus = (c) => tartarusSet(c) as SetHooks;` (+ palace / cave / olympus / cafe) | story `hillY`, `ROCK_R`, `rockAt`; light `under` | ~230 |
| `erysichthon.ts.txt` | Sacred grove: one giant 3D oak (bark, roots, branches, leaf crowns) that swaps to a ringed stump per shot, tree ring, cypresses, wheat fields, far hills, stone altar; `hallSet`: banquet table (cloth, red runner, shown per shot), throne-back panel, two bronze braziers that glow at golden/night | `SETS.grove = (c) => groveSet(c) as SetHooks;` + `SETS.palace = (c) => both(palaceSet, hallSet as SetBuilder)(c)` | greece part first (cypress, U01); story `oakStands`, `PX`, `TW`, `TZ0`, `TZ1`, `TY`, `TABLE_SHOTS` | 98 |
| `atlas.ts.txt` | Edge of the world: grassy plateau ending in a cliff, a sea of cloud to the horizon with far peaks, cypresses; Ovid's night mountain (rock peaks, summit for a giant card); museum room (marble floor, red wall, columns, plinth); dim clinic wall with an X-ray lightbox frame | `SETS.edge = (c) => edgeSet(c);` (+ mountain / museum / clinic) | greece part first (cone, cypress, cliffRock); `grassHD`, `cobbleHD` import | 67 |
| `vasa.ts.txt` | 17th-century warship (Vasa 1628): lofted hull with tumblehome, stern castle + gilded blue transom with lions, two rows of gun ports with hinged red lids + guns, 3 masts, yards, set/furled sails that billow per frame, Swedish ensign, rigging, salvage cables, wreck mode; harbour jetty; `seabedSet` (x -3000 murky blue, mud, fog), `museumHall` (z 8000 hall, galleries, warm lights, cradle), `diagramSet` (blueprint backdrop). `poseShip(sh, ShipPose)` per frame | `SETS.harbour = harbourSet` (+ seabed / museum / diagram) | town + harbour parts first; story `shipPose(id,t)`, `ShipPose`, `shipPt`, `D0`; cast `hullHalf`, `PORT_XS` | ~300 |
| `lab.ts.txt` | `labRoom` 1920s-40s lab / lecture room open toward +z (pale or tiled or panelled walls, window with a painted London / Oxford / beach view, bench with papers + books, shelves of bottles, sink); `hospitalSet` beach field-hospital tent with a door onto sand + sea and a cot (z 8000); `microSet` microscopic agar world with a glowing backdrop (z -8000); `gardenSet` lawn, soil bed, fence, bushes (x 3000 z 8000) | see header | — | ~190 |
| `alien_ground.ts.txt` | Hot rocky alien/Venus plain: cracked orange-brown ground, scattered stones, far mesas in orange haze | `SETS.venus = (c) => { buildVenus(c.root, VS(0, 0, 0)); return {}; };` | light `venus` | 25 |
| `napoleon.ts.txt` | French countryside meadow (`meadowSet(X, road)`: lawn, rolling hills, tree lines, far chateau with slate roofs, rail fence, flowers; road = dirt road along x) + modern city dog park (`dogParkSet(X)`: lawn, green fence, bench, lamps, far apartment blocks) | `SETS.meadow = meadowSet(0); SETS.dogpark = dogParkSet(3000);` | `grassHD` import | 75 |
| `canute.ts.txt` | `beachSet`: an English beach c. 1030 - sand sloping up from the sea (STORY.SLOPE), dunes, chalk cliffs, green downs, striped royal pavilion, pennants, a beached longship with a striped sail; the WATER LEVEL follows `STORY.tideAt(id, t)` every frame (rising tide / surges); old props hide in shot 4 (modern beach); a pale daytime moon at `STORY.SKYMOON`. `spaceSet`: Earth seen from above the north pole (flat-lit, radius 8) with a see-through ocean bulge stretching toward the moon (`STORY.bulgeAt`), spinning (`STORY.spinAt`) with a red pin, and the moon at `STORY.MOON` | `SETS.beach = (c) => beachSet(c) as SetHooks; SETS.space = (c) => spaceSet(c) as SetHooks;` | story `SLOPE`, `tideAt`, `SKYMOON`, `SKYCAM`, `MOON_R`, `SPX`, `MOON`, `bulgeAt`, `spinAt`; `grassHD` import | ~150 |

## Effects as scenery (`fx/`, append to build.ts)
| part | what | register |
|---|---|---|
| `vapour_quilt.ts.txt` | Big soft pastel patchwork quilt sheets that slide in from the horizon over a place ("a blanket of vapour / clouds") | `both(seaSet(PIER), quiltSet({ shot, center, y, layers: [[dy, t0], ...] }))` |

## Characters and effect drawings (`characters/`, append to toon.ts)
| part | contents |
|---|---|
| `twosuns_cast.ts.txt` | seaside townsfolk `seaFolk(v)`, `BAKER_O` (chef hat), `FISHER_O`, `sunKid(v)`, **the dog** `dog(p, {mode: run/stand/sit/flat, face: alert/happy/dizzy/pant/worried, phase, wag})`. Effect drawings: `fxSweat`, `fxSteam`, `fxBeam` (sunbeam), `fxPanel` (happy solar panel), `fxBed` (sleeper + n puffy quilts), `fxScoop`/`fxSplat` (ice cream), `fxSinker` (lead sinker melting, m 0..1), `fxHeat` (shimmer), `fxStar`, `fxOrbit`, `fxWindow` (two suns outside), `fxCloudBank` (storm cloud) |
| `yasuke_cast.ts.txt` | Sengoku Japan: `jfolk(v)`, `jkid(v)`, `yasukeO(look, night)`, `PRIEST_O`, `NOBU_O` (crest), `AKECHI_O` (kabuto), `ashigaru(v)`, `servantO(v)`; fx `fxInkPot`, `fxSpear`, `fxCleanCloth`, `fxDrop`, `fxShine`, `fxFlake`, `fxBale`, `fxGift`, `fxBlaze`, `fxSmoke` |
| `sisyphus_cast.ts.txt` | `fxBoulder` (tally marks), `fxClock` (stone time clock), `fxWings`, `fxChains` (+ padlock), `fxScythe`, `fxDrip`, `fxZap` (lightning), `fxExit` (EXIT sign) |
| `erysichthon_cast.ts.txt` | feast + myth drawings: `fxFood(kind)` (roast, grapes, bread, jug, pomegranates, empty plate, cheese), `fxDrumstick`, `fxWreath`, `fxTablet` (votive), `fxCut` (axe notch), `fxBlood` + `fxTrickle`, `fxPlan` (building plan on easel), `fxGauge` (HUNGER dial), `fxLog`, `fxScroll(n)` (list struck through), `fxChest(k)` + `fxCoin`, `fxBird` (pink dove), `fxCrownPlate`, `fxSapling`, `fxZzz`, `fxHand` (big palm), `fxCurse` (plum puff) |
| `atlas_cast.ts.txt` | `fxSkyBall(kind)` (earth / starry celestial globe / marble / stone, held overhead with the `lift` pose), `fxRedX`, `fxAppleTree(n)` golden apples, `fxBasket(n)`, `fxClub`, `fxCushion`, `fxEmptyPurse` (moth), `fxWallClock(k)`, `fxLadder` (missing rungs), `fxSpark`, `fxXray(hi)` head + spine X-ray with glowing C1 |
| `vasa_cast.ts.txt` | 1620s cast: `ADMIRAL_O` (cavalier hat), `KING_O` (crown, buff coat, blue sash), `sailorO(v)`, `folkO(v)`, `BARMAID_O`, `WAITER_O`, modern `visitorO(v)`; fx `fxLetter(hurry)`, `fxTray`, `fxDrinks(k)` (mugs flying), `fxWorm(sick)` (shipworm), `fxSection` (ship cross-section: guns, ballast, weight marker, tilt), `fxWind`, `fxBubbles`, `fxPlaque` (VASA 1628), `fxRay`, `fxSmoke` (gun smoke), `fxPour` (water into a port). Needs the core `cavalier` hat |
| `penicillin_cast.ts.txt` | 1920s-40s scientists `FLEMING_SUIT/COAT`, `FLOREY_O`, `CHAIN_O`, `scholarO(v)` (suits, ties, moustaches), `SOLDIER_44`, `MEDIC_O`; fx petri dish stack + dish with mould and clear ring, flask (label, dims, dust), cobweb, 0-likes bubble, calendar, chalkboard, journal, mouse cage (sick / dead / alive mice, tag), syringe, crate, mould + bacterium characters (brick wall, crack), drop, pop, guardian plant, weed, medal, sparkle, zzz, microscope. Needs the core `hold` prop |
| `llorona_cast.ts.txt` | Mexica fisherman/guard/priest outfits, `aztec(v)`, colonial `towny(v)` (sombreros, braids), `MUM_O`, **the ghost** `ghost(p, {expr, arms})` (see-through gown, veil, hollow eyes: draw as Fx with `see: true`), `fxWail` (sob arcs), `fxPulse`, `fxCodex` (amate page), `fxTub` |
| `napoleon_cast.ts.txt` | 1807 court: `NAPO_O`/`NAPO_GUN` (grey coat, sideways bicorne), `BERTHIER_O` (plumed bicorne), `huntO(v)`, `ladyO(v)`, `LACKEY_O`, `FARMER_O`, `MODERN_O`; **rabbits** `fxRabbit(p, sit/hop/beg/climb/back, colour, ph, flip, look)`, `fxCage(open)`, `fxCart`, `fxCarriage(ph)` (horses, coachman, window cut out for a card behind), `fxThought` (carrot bubble). Swarm / climbers / chase staging in the Napoleon short's cast.ts. Needs core `bicorne` + `["whip", k]` |
| `canute_cast.ts.txt` | c. 1030 court: `canuteO(bare)` (crown, ginger beard, red robe), `courtierO(v)` robes, modern `BEACH_O`; fx `fxThrone`, `fxWave(k)` (curling wave with foam band), `fxSpray(k)` (water splash, round drops), `fxCrossCrown` (crown hung on a wooden cross), `fxNewspaper` (headline + cartoon panel), `fxDeckchair`, `fxUmbrella`, `fxClockBits(ring)` (alarm-clock bells/legs around a moon), `fxSweatDrop`. Core `sit` + `wave` = seated, hand raised |

## Staging helpers (`cast/`, paste into cast.ts)
| part | contents |
|---|---|
| `twosuns_helpers.ts.txt` | `dogAt` (dog card + shadow), `sweat` (drops by a head), `steam` (rising columns over an area), `heat` (shimmer), `star`/`starField` (star pairs with orbit rings), `beams` (sunbeams from a camera-relative sun) |
| `llorona_helpers.ts.txt` | `ghostAt` (glowing see-through ghost + water rings + halo), `wail`, `arrive` (a sound reaching a listener), `flame` (torch); story examples: running kids, roof heads popping up, a sound-bending diagram (`pulses`, `coldMist`), bathroom singing |

## Already in the core (no library needed)
- **Lights** (`lights.ts`): `day`, `golden`, `night` (Look v2), `hot` (two-sun noon, warm haze), `space` (black sky,
  stars, hard key), `venus` (orange murk), `under` (Underworld: plum-red sky, ember key, glows on).
- **Sky:** sun/moon discs anywhere in frame per shot (`story.ts DISCS`, up to 3, camera-relative), the moon at night,
  stars, painted cloud ring (`clouds: true` in a set), moon path on water (`streak: true`).
- **Shadows:** `setShadowTails([-0.8, 0.8])` in `stage()` gives every standing card two shadow tails (two suns).
- **Characters** (`toon.ts`): `bodyFront`/`bodySide` with 19 expressions, hats (`cap`, `hair`, `braids`, `hairband`,
  `longhair`, `sombrero`, `tophat`, `bonnet`, `shako`, `shako_tall`, `chef`, `topknot`, `jhair`, `kabuto`, `kasa`, `cavalier` (1620s wide-brim felt hat + feather)), outfit flags
  `bare` (stripped to the waist), `scabbard`, `crest`, props (`icecream`, `icecream_drip`, `cone`, `shako`, `lift`, `shrug`,
  `["hammer", k]`, `["fan", k]`, `["katana", k]`, `["cloth", k]`), outfits `soldier`, `townsfolk`, `KID`, `PARENT`, `kidO`, and
  `swingKid`.
- **Generic fx drawings:** `fxNote`, `fxBurst`, `fxSplash`, `fxPuff`, `fxStars`, `fxCreak`, `fxRing`, `fxSign`,
  `fxCloud`, `fxPlank`, `fxDrum`, `fxGlow`, `fxMist`, `fxFlame`.
- **Build helpers** (`build.ts`): `lam`, `quad`, `tri`, `boxGeo`, `flatQuad`, `Batch`, `Strand`, cartoon vegetation via
  `prop`, `kitClone`, `GLOW_WIN`/`GLOW_FIRE`, `canoeGeo`/`addCanoe`. Painted textures are in `paint.ts`: `facadeHD`,
  `roofHD`, `stoneHD`, `grassHD`, `cobbleHD`, `cloudHD`, `brick`, `planks`, ...

## Adding parts (after every short)
When a short builds a set, character or effect that another story could use, save it here in the same turn as the
delivery:
1. Copy the code block into a new `<kind>/<name>.ts.txt`. Start it with the 4-line header: what it is, where to append
   it, the registration line, what it needs, and the short it came from.
2. Replace story constants with `STORY.<name>` (the core's namespace import of story.ts), or take them as parameters.
3. Add one row to this catalogue.
4. Prove it: rebuild the short from the core plus the library and compare stills (mean pixel difference 0). See
   `scripts/` in the Two Suns project: `assemble_libcheck.py`.

| `props/lab_props3d.ts.txt` | 3D hero props: glass petri dish (agar, colonies, growing mould, spreading clear zone), dish stacks, Erlenmeyer flask with liquid + label + dust; `phong()` two-tone Phong for glossy 3D props. The pattern for any story's key object: model it, don't stretch a card (Penicillin 2) | Penicillin 2 sets.ts `labProps` | — | ~110 |
| `sets/wall_dressing.ts.txt` | `wallArt` charts, cork notice boards, clocks, framed portraits, posters + `woodTex` wood grain, for interiors that otherwise read as flat colour | Penicillin 2 sets.ts | — | ~80 |
| `sets/dazzle.ts.txt` | 1917 steamer (grey / dazzle / half-painted / false-bow schemes, swappable per frame), dockyard quay with barber's shop + spinning barber's pole, paint roller, sub periscope, Dazzle Section studio (model on turntable, painted sea backdrop, brass periscope); periscope-view mask overlay in Dazzle Bridge.tsx | Dazzle sets.ts dockSet / seaSet / studioSet | story `TABLE`, `SCOPE` | ~330 |
| `characters/dazzle_cast.ts.txt` | WWI Royal Navy cast: dock painters, navy lieutenant, stout officers, King George V (beard, sash); fx sketch of a striped ship, heading/guess arrows (solid / dashed), aim ring, dashed aim line, torpedo wake, question mark, speed lines | append to toon.ts | — | ~75 |
| `sets/hanoi.ts.txt` | Hanoi 1902: old-quarter street (tube houses, awnings, counters, French villa, manhole, stall), brick sewer tunnel with lamps + point lights, colonial bounty veranda + garden, rat farm (bamboo pens, hut, paddies), 3D toilet with high cistern | rattails sets.ts | story constants (header) | ~260 |
| `characters/rattails_cast.ts.txt` | Hanoi folk, French colonial officials (pith helmet), inspector, lady, kid, farmer; rats (run / sit / hang, tail length, babies), tail, scissors, rat basket, AVIS 1 CENT poster (tearable), portrait tally slate, nest with pups, weed, holed cent coin, tail heap, stick | append to toon.ts | core pith hat | ~230 |
| `sets/emuwar.ts.txt` | WA wheat-belt farm 1932 (wheat stalks, ridge, red dirt road, wire fence with a broken gap, homestead + verandah + tank, mailbox, dam with reeds), 1930s office; 3D Lewis gun, 1930s army truck with gun post, wheat-sack pile | Emu War sets.ts wheatSet | story constants (header) | ~260 |
| `characters/emuwar_cast.ts.txt` | 1932 Australian gunners / major (slouch hat), veteran farmers, minister; emu (side run/stand/peck/lookout, front, back), feathers, letters (ask/APPROVED/NO stamps), fly, mallet, medal, WA map | append to toon.ts | core slouch hat | ~200 |
| `cast/emuwar_helpers.ts.txt` | emu facing/turning + run paths + dust, rabbit hops | paste into cast.ts | card/qz/lerp3/mirrored | ~40 |
