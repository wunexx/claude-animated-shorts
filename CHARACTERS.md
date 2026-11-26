# Character + effect cheat sheet (core `templates/storybook/toon.ts` + `cast.ts`)

Read this instead of toon.ts / cast.ts. Open those files only to add a NEW hat, prop or pose (then add it here too).

## Scale and canvas
- Design canvas 600 x 1000 units, soles at y = 975. `SU = 0.00216` m per unit (1000 units = 2.16 m).
- Look v3 (2026-11-24): an adult (`build: "adult"`, BUILD a 134 / torso 1.02 / legs 0.98) is ~3 head-heights - big
  bean head, short body, stick legs like the reference shorts. Default skin `SKIN` = near-white #faf7f3 (`SKINS[0]`;
  `SKINS[1..3]` = light cream, warm beige, brown) - give a character peach skin only on purpose.
- Old note: before Look v3 an adult was ~3.5 head-heights = ~1.68 m at scale 1. Use `scale` in `front()` for height
  differences (Yasuke 1.16 = 182 vs 157 cm; kids ~0.78-0.85).
- Portrait frame: horizontal FOV ~ 0.56 x the vertical fov (fov 40 -> ~23 deg wide; ~2.3 m wide at 6 m).
- Cards are billboards, but the DRAWING turns (2026-11-21): give a character a world facing and the card shows the
  matching view for the camera: front, 3/4, profile, back-3/4, back. See "Turning" below. A crowd CAN show its back.

## Outfit (fields)
`jacket, pants, boots` (colours, required) - `skin` (default `SKIN` = near-white; `SKINS[0..3]`) - `hat` (below) - `hair` (hair
colour for hair-type hats) - `cap` (hat / ribbon / comb colour) - `dress` (long robe / skirt / kimono / cassock: the
body becomes a bean robe, legs hidden) - `sash` (belt band; obi on a dress) - `belt` (crossed belts) - `buttons`
(colour) - `moustache` (colour) - `rifle`, `spear`, `sword` (+ `scabbard` = sheathed dark scabbard) - `bare` (stripped
to the waist: torso = skin colour, no buttons/collar; set `jacket` to the skin colour) - `crest` (small 5-lobe family
crest on the chest, colour) - `build`: `adult` | `stout` | `kid` - `head` (head-shape seed).
- Any `dress` outfit draws a crossed kimono-style collar (standing and seated) and no buttons.
- `tie` (necktie colour, drawn under a beard) + `badge` (ID badge on a lanyard): office worker gag; `stone` (grey cracks: pair
  with an all-grey outfit for a character turned to stone). (Atlas 2026-11-18)
- **Rule:** in a robed culture give every main character a `dress`; trousers on stick legs read "spindly" next to robes.

## Hats (`hat`)
`hair` (short hair cap, colour `hair`) - `cap` (peaked cap, colour `cap`) - `braids` - `hairband` - `longhair` -
`bonnet` - `tophat` (felt colour = `cap`, default near-black #2e2a36: give a hero a lighter cap colour, a black top hat is a big dark blob in close-ups; Lighthouse 2026-11-26) - `sombrero` - `chef` - `shako` / `shako_tall` (soldiers) - `topknot` (Japanese chonmage) -
`jhair` (hair tied up in a bun + comb in `cap`) - `kabuto` (samurai helmet, gold crescent, neck guard; bowl colour
`cap`) - `kasa` (wide conical straw hat; paint it dark via `cap` for an ashigaru jingasa) - `cavalier` (1620s wide-brim felt hat
with a gold band and a white/red feather; felt colour `cap`, hair `hair`; Vasa 2026-11-19) - `bicorne` (Napoleonic bicorne worn
sideways with a tricolour cockade; felt `cap`, hair `hair`) / `bicorne_plume` (+ white feather trim: a marshal) (Napoleon 2026-11-20) - `pith` (colonial pith helmet / sun topee: white dome, all-round brim, khaki band; colour `cap`; Rat Tails 2026-11-22) - `slouch` (Australian slouch hat: khaki brim, left side turned up with a rising-sun badge, puggaree band; felt `cap`, hair `hair`; Emu War 2026-11-23).

## Ready outfits
Core: `RIFLEMAN`, `OFFICER`, `soldier(v)`, `townsfolk(v)` (top hats / bonnets), `KID`, `PARENT`, `kidO(v)`.
Library (append to toon.ts first): `twosuns_cast` (seaside folk, baker, fisher, dog), `llorona_cast` (Mexica,
colonial, ghost), `yasuke_cast` (`jfolk(v)` Kyoto folk, `jkid(v)`, `yasukeO(look, night)`, `PRIEST_O` Jesuit,
`NOBU_O`, `AKECHI_O`, `ashigaru(v)`, `servantO(v)`).

## Expressions (`expr`)
`neutral stern grin laugh whistle nervous shock relief relief_open dazed pained smile smile_closed lick weep wail sad
worried sing` ("whistle" = round "oo" mouth: wonder, a shrug face).

## Turning (`FrontOpts.yaw`, `bodyTurn`, cast.ts `face` / `walk`) - 2026-11-21
- `front(out, cam, t, i, o, okey, p, fo, { face })`: `face` = a point to look at ([x, y, z]: the partner, a door, the
  sea) or a world heading in radians (0 = +z, PI/2 = +x). Each frame cast.ts turns it into `yaw` relative to the
  camera (5-deg steps), so a camera orbit turns people on screen by itself. Leave `face` out ONLY for a deliberate
  address to the lens.
- `cheat` (deg): opens people up toward the lens like actors in a two-shot. Default 25 when `face` is a point, 0 for a
  heading; 0 = a true profile / back, ~40 = favour the faces.
- `walk(out, cam, t, i, o, okey, path, fo)`: `path(t)` = feet position at time t (s). Heading from the path, step phase
  from the distance walked (march 0.8 m / stroll 0.55 m per step), keeps the last heading when it stops. Side-on walks
  (60-120 deg) use the planted-foot side walk cycle (not for `dress` outfits or props: those stay turned front views).
- What a yaw draws (toon.ts `bodyTurn` mirrors negative yaw): 0 front - 20-45 3/4 (features slide 0.15 W to the facing
  side on an inner sphere, nose tick from 25 deg, the facing-side eye foreshortens, hair wraps the back of the head,
  torso narrows, near arm crosses in front of the torso, far limbs darken, head tilts toward the facing side) - 90
  profile stance - 105+ back views (no face; hair / hood / long hair / bonnet bow cover the head; buttons, badges,
  cockades, peaks hidden; held props go behind the torso) - 180 straight back.
- Hats: the sideways `bicorne` narrows to its edge in profile; peaks / badges / crests hide from behind. A NEW hat with
  a front-only detail: skip it when `hatBack()`; a new face-side detail: place it with the torso helper `TS(x)`.
- Test any new outfit / hat on a turnaround sheet before using it (0, 20, 40, 60, 80, 100, 130, 160, 180, -40).
  Tool: `templates/scripts/TurnSheet.tsx.txt` (a one-frame Remotion still of 4 outfits x 11 yaws; crop rows with ffmpeg).
- (Dazzle 2026-11-22, the user saw "an eyebrow instead of the second eye") A peaked `cap` turned to ~3/4 (yaw 45-70)
  draws its peak right over the far eye. For a face that must read (hero, hook shot): use `hair` (or no peak), or
  turn them toward the lens (`cheat` ~55-60) so both eyes show. Check any 3/4 hero face in a 2K crop.
- Fixed 2026-11-21 (Penicillin 2, the user saw "artifacts on characters"): the hair hat's hairline sat on the eye line
  (`cut` 0.42 HH -> 0.31), so in 3/4 the facing-side eye slid under the hair; the 3/4 hair wrap now stays behind the
  temple (down to 0.12 b below centre, 0.42 only from 75 deg), the wrapped hair closes along the hairline (no diagonal
  across the face, no "hood" over profile walkers); the hair-part tick shows only on a front view and the nose tick only
  from 62 deg on the contour (inside a 3/4 face both read as scratches); profile cap / shako peaks are short blocks, not
  beaks. Seated (`sit`) + turned can stand a character up on a bench: seat them front-on (no `face`).
- Sharp close-ups: character canvases now go up to 2700 x 4500 below 1.8 m (cast.ts `tier`), and every fx card is drawn
  at the size it fills on screen (world.ts: 1x / 1.5x / 2x / 3x / 4x of cw x ch). A fixed 600 px dish card stretched
  2.5x in a close-up was the "low quality" the user saw.

## Front view: `bodyFront(p, o, FrontOpts)`
`mode`: `stand` | `stroll` | `march` | `sit` | `fall` (lying, legs up: pair with `fxStars`) - `phase` (walk cycle
0..1; ~`(t * 0.9) % 1` for a stroll) - `expr` - `look` (eyes left/right -1..1) - `blink` - `tilt` (upper body lean,
deg) - `headTilt` (deg) - `wave` (0..1: right arm raised and waving; also "reach up") - `facing` (-1/0/1) - `prop`:
- `"icecream"`, `"icecream_drip"`, `"cone"`, `"shako"` (carried)
- `["hammer", k]` / `["katana", k]` (k 0 = raised .. 1 = struck forward; 0.7 + 0.3 sin(...) for a sword fight)
- `["fan", k]` (fanning), `["cloth", k]` (scrubbing rag, k = rub position)
- `"lift"` (both hands above the head: put the lifted fx card ~0.2 m above the hands, not floating)
- `"shrug"` (both palms out at the sides)
- `"point"` (right arm straight out to the side with an index finger: pushing a button / a lens with one finger, pointing at something; turned toward screen-left the card mirrors, so the finger points the way the character faces. Lighthouse 2026-11-26)
- `"hold"` (both hands together in front of the chest, ~1.1 m up at scale 1: put the held object as its own fx card
  at [x, 1.1, z + 0.12]; a dish, flask, journal, syringe. Penicillin 2026-11-19). An object held HIGH: `wave: 1` + the card
  ~0.32 m right of the body at y ~1.64 (the lift pose hides the arms behind the head)
- `wave: 0` used to raise the arm (bodyFront checks `wave !== undefined`); the core `front()` now drops `wave: 0`.
- `["whip", k]` (riding whip / crop with a curling lash, k 0 raised .. 1 swung; Napoleon 2026-11-20)
- `["axe", k]` (big woodcutter axe, k 0 raised .. 1 swung; rest at ~0.3 so the blade clears a crown), `"drumstick"` (hand raised
  beside the face; draw the meat as its own fx card in front of the mouth: a beard hides anything held at the chest),
  `"wheat"`, `"coinbag"`, `"scroll"` (held at the chest)
- `laurel` takes `cap` as the leaf colour (gold = a wheat crown)
- `sit` ignores arm props (arms rest on the knees), except `wave`: a seated character can raise the right hand (a king commanding; Canute 2026-11-20).
- **Reveal plan (2026-11-18):** `sil` 0..1 turns the finished card into a flat dark silhouette (`silCol`, default
  `#160f1c`) that keeps its outline shape: hide who someone is until the reveal word. Animate with the cast.ts helper
  `unveil(t, ts, dur = 0.27)` (1 until 2 f before the word at ts, then 0 over ~8 f, quantised to 1/8):
  `front(out, cam, t, 7, YASUKE, "yasuke", p, { expr: "smile", sil: unveil(t, T.forHim) })`. Works best backlit
  (behind a lit paper screen, against a bright doorway or sky) or small in a crowd. Any custom fx drawing can call
  `silhouette(p, k, col)` (exported from toon.ts) as its last line too.

## Side view: `bodySide(p, o, SideOpts)`
`mode`: `march` | `stand` | `swing` | `push` - `phase`, `stride` (x 0.8 m), `stomp`, `pose`, `hand`, `expr`, `blink`.
The core `front()` helper always draws front views; side views go through `person(...)` with `{ side: true }`.

## Staging helpers (cast.ts)
- `front(out, cam, t, i, outfit, okey, [x, y, z], FrontOpts, { scale?, blob? })` - `i` = unique id (blink timing,
  head shape), `okey` = unique string per outfit (canvas cache key), `y` = the floor height under the feet.
- `lead(t, ts)` = true from 2 frames before word time `ts` (reactions land 0-3 f before the word).
- `setShadowTails([0])` one sun / `[-0.8, 0.8]` two suns.
- Effect card: push `{ key, cw, ch, draw, x, y, z, w, h, flat?, rot?, soft?, see?, glow? }` to `out.fx`
  (key must include every parameter that changes the drawing; quantise animated values: `Math.round(v * 8) / 8`).
  `soft` = see-through, no depth (halos, mist, smoke); `see` = see-through WITH depth (ghosts / main characters);
  `glow` > 1 = blooms (fire, torches); `flat` = lies on the ground; `rot` = rotation in the screen plane.
- `rock(out, x, z, w, h)` (core): a grey rock card, top at y = 0.92 h. Stand a hero on it (`front(..., [x, 0.86 * h, z - 0.2])`)
  or set a small prop on it, to keep both above the caption band. Effect cards take `bg: true` for scenery the band check skips.
- Handy story-side helpers (Yasuke cast.ts, copy if useful): `fx(out, key, cw, ch, draw, p, w, h, opts)`,
  `pop(t, ts)` (0 -> overshoot -> 1 pop-in scale), `crowd(...)` (deterministic crowd in a box with a centre gap),
  `blaze(...)` (fire along a roof), `torch(...)`.

## Effect drawings (`fx*`, canvas size in brackets)
Core: `fxNote` - `fxBurst(t, col)` [500] impact star - `fxSplash(t)` [800] - `fxPuff(t)` [300] dust -
`fxStars(t)` [420x210] dizzy - `fxCreak(t)` [300] strain ticks - `fxRing(t)` [600, flat] - `fxSign` [700x520] -
`fxCloud(seed)` [600x300] - `fxPlank` [320x110] - `fxDrum` [260x240] - `fxGlow(col)` [256, soft] - `fxMist(seed,
col, a)` [512x128, soft] - `fxFlame(t)` [200x300] torch - `fxShadow`, `fxContact`, `fxBlob` (ground shadows).
Library `yasuke_cast`: `fxSpear` [64x512, rotate] - `fxInkPot` [256] - `fxCleanCloth` [256] - `fxDrop` [64x96]
sweat - `fxShine(t)` [128] sparkle - `fxFlake(seed)` [64] snow - `fxBale` [400x240] - `fxGift(kind)` [256] house /
coins / katana on a tray - `fxBlaze(t)` [256x384] big flame - `fxSmoke(seed, a)` [256, soft].
Library `twosuns_cast`: sweat, steam, sunbeam, solar panel, bed + quilts, ice-cream scoop/splat, melting sinker,
heat shimmer, star pair + orbit, window with two suns, storm cloud. `llorona_cast`: wail arcs, pulse, codex page, tub.

## Pen (drawing API for new drawings, design units)
`poly(pts, fill, outline)`, `ell(cx, cy, rx, ry, fill, outline, a0, a1, rotDeg)`, `stroke(pts, w, col)`,
`line(pts, fill, w, ink)`, `arc(cx, cy, rx, ry, a0, a1, w, col)`, `dot(x, y, r, col)`, `band(pts, fill, w, rim, cap)`,
`clip(pts, fn)`, `shadedFill(pts, base, shadow, light, R)`, `gradFill(...)`, `inkRing(pts, w, thick)`; raw canvas `p.g`.
Ink colour `INK` (#241726); colour helpers `mix(a, b, t)`, `mul(c, [r, g, b])`, `shade(c, k)`.
