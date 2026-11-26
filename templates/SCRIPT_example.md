# "The Bridge That Fell for a Song" — SCRIPT.md format example (curiosity chain; pacing rules of 2026-11-19)
Copy this layout for every new short: facts -> format + viewer's job -> hooks -> script -> open-loop ledger ->
3-second walk -> reveal plan -> sync table (= the picture plan) -> delivery map (lines.json).
Pacing (PACING_STUDY.md): full sentences of ~10-15 words, one new idea each; a brisk hook line (story pace) over one held picture; one
continuous camera per place; the characters act inside held compositions; the voice generated per story beat.

## Facts and sources
Broughton Suspension Bridge, Salford, 12 April 1831; 74 men of the 60th Rifle Corps marching four abreast;
felt the bridge vibrate in time with their steps, found it amusing, some whistled a marching tune and stepped to it;
a badly forged single bolt in a stay-chain snapped; one end fell 16-18 ft into the River Irwell, about 2 ft deep there;
nobody killed, 20 injured; British Army then ordered troops to "break step" on bridges. (Wikipedia, Broughton Suspension Bridge)

## Format
Explainer with a doubted-rule twist. The viewer keeps watching to find out why the best-drilled army in the world
tells its soldiers to walk like tourists.

## Hooks (one per user pattern, SKILL.md step 2; chosen = P4)
Every hook shows a strange act or fact and hides BOTH the reason and the result (`retention_stats.py --hook` on each).
- P1 (confusing act): "A sergeant stopped his whole army on a bridge and made them walk out of step." — good; less
  strange than P4 for someone who does not know drill.
- P2 (act + "But why?"): "The best drilled army in the world crosses bridges like a crowd of tourists. But why?" —
  uses the final image, so the callback loses its punch.
- P3 (act + a stranger reason): "The British Army bans marching on bridges to keep its soldiers dry." — funny, but
  "dry" points at the river and gives away the fall.
- P4 (confusing fact + "The thing is,", chosen): "The British Army has one rule its soldiers must never break on a
  bridge." then line 2 "The thing is, they are not allowed to march in step..." — picture: one held low shot of a sergeant on a
  bridge glaring at a row of boots that shuffle out of step. Hides: what the rule protects against, and the collapse.
  Paid off by the collapse + the swing analogy; the last line calls it back.
- Rejected: "Seventy-four soldiers knocked down an iron bridge just by walking across it." (states the result: the
  viewer has the story at 3 s and leaves).

## Script (~170 words, ~46 s; mean ~12 words per sentence; joins marked BUT / SO / THEN)
1. The British Army has one rule its soldiers must never break on a bridge.
2. The thing is, they are not allowed to march in step, and the reason starts in 1831.
3. Seventy-four riflemen were marching home over a brand new iron bridge, every boot landing at the same moment.
4. BUT halfway across, the whole bridge started bouncing under their feet.
5. SO naturally, the soldiers thought it was hilarious, and somebody started whistling a march.
6. Everyone stomped harder, and the chains began to groan, but nobody wanted to be the one who broke step.
7. THEN a single bolt snapped, and the whole end of the bridge dropped into the river.
8. Luckily, the river was only two feet deep. Unluckily, the river was only two feet deep.
9. You see, every bridge has a rhythm it likes to sway at, a bit like a kid on a swing.
10. Tiny pushes at just the right moment send that swing higher and higher.
11. Seventy-four men marching in step were pushing that bridge like a swing.
12. SO now, the best drilled soldiers in the world cross every bridge like a crowd of tourists.

## Open-loop ledger
| # | question opened | at line | answered at line |
|---|---|---|---|
| Q1 | Why would an army ban marching in step? | 1-2 | 9-11 |
| Q2 | What happened in 1831? | 2 | 7 |
| Q3 | Why is the bridge bouncing, and will they stop? | 4-6 | 7 (no) / 9-11 (why) |
| Q4 | Did anyone die? | 7 | 8 (joke) |

Unfold check (SKILL.md step 2 "Information unfold"): what is known by ~8 s (army, rule, 1831); doubter = the soldiers
laughing it off (5-6); pivot "You see," at line 9 (~72 %); the payoff (line 11) puts the opening bridge back on screen
with a new meaning; the last line leaves the viewer to picture the tourists' shuffle.

## 3-second walk (excerpt)
0-4 s: new = a strange rule (one held shot); open = Q1. 4-8 s: new = "not in step", 1831; open = Q1, Q2.
8-13 s: new = 74 men on a new bridge (one camera move along the column); open = Q1, Q2. ... 42-46 s: new =
soldiers shuffling like tourists; closes Q1 with the callback. End. Never more than one new thing per slice.

## Reveal plan
Hide the WHY, not the WHO: the sergeant and the soldiers are clear from frame 1.
| secret | revealed on | hidden until then by |
|---|---|---|
| that the bridge will fall | "snapped" (line 7) | the camera stays on stomping boots + grins; the bolt only in a held insert in line 6 (plant) |
| why it fell (resonance) | "swing" (line 9) | no wave / vibration diagram before line 9 |
| the river depth joke | "two feet deep" (line 8) | the fall is framed from the bank, the water level unseen |
Labels (at most 2-3): place "SALFORD / England, 1831" on "1831" (line 2); fact "74" on "Seventy-four" (line 3).

## Sync table (the picture plan: one row per sentence; times from words.json)
| # | time | composition (place, framing, who) | action on its word | move to the next row |
|---|---|---|---|---|
| 1 | 0.0-3.6 | bridge deck, low, sergeant + a row of boots | the boots shuffle out of step on "break" | hold, slow creep |
| 2 | 3.9-7.6 | same deck, the camera rises over the sergeant to the town | sky warms to 1831 golden light on "1831" (dissolve) | rise -> follow the column |
| 3 | 7.9-12.3 | along the marching column, side-on | boots land together on "same moment" | glide along the column |
| 4 | 12.5-15.2 | under the deck, low | the planks bounce on "bouncing" | hold |
| 5 | 15.4-19.6 | two-shot of grinning soldiers | one laughs on "hilarious", one whistles on "whistling" | pan to the chains |
| 6 | 19.8-24.6 | chains and the bolt (insert, held 2 s), soldiers behind | the chain groans on "groan" | push in on the bolt |
| 7 | 24.8-28.6 | the bolt -> pull back to the whole bridge (one move) | crack on "snapped", the deck drops on "dropped" (KICK) | pull back to the bank |
| 8 | 28.9-33.4 | bank, soldiers sitting in knee-deep water | dazed faces on "Luckily", the deadpan look on "Unluckily" | cut (place jump) |
| 9-10 | 33.7-39.8 | park: a kid on a swing (two ropes), parent pushing | small push on "pushes", the swing rises on "higher" | hold |
| 11 | 40.0-43.4 | dissolve back to the bridge, the column as a swing | the deck sways with the step on "swing" | glide to the present day |
| 12 | 43.6-47.2 | modern soldiers tiptoeing out of step, sergeant nodding | the nod on "tourists" | end within 1.5 s |
Hard cuts: 1 (to the park); dissolves: 2. Median hold ~3.8 s.
Turn served by each cut / dissolve (SKILL.md step 2 "Picture unfold"): dissolve row 2 = time jump to 1831; cut row 9 =
the explanation ("You see"); dissolve row 11 = the payoff back on the bridge. Opening: style (a), one continuous shot
until the time jump. Biggest visual moment (the deck drop, KICK) at row 7 (~60 %), not in the hook. Video ends <= 0.6 s
after "tourists".

## Delivery map (`voice/lines.json`, generated by `scripts/voice_lines.py`; one entry per story beat)
```json
{
  "engine": "elevenlabs", "voice_id": "yl2ZDV1MzN4HbQJbMihG", "model": "eleven_v4", "tempo": 1.17,
  "lines": [
    {"text": "The British Army has one rule its soldiers must never break on a bridge.", "mood": "hook", "tempo": 1.45},
    {"text": "The thing is, they are not allowed to march in step, and the reason starts in eighteen thirty-one. Seventy-four riflemen were marching home over a brand new iron bridge, every boot landing at the same moment.", "mood": "neutral"},
    {"text": "But halfway across, the whole bridge started bouncing under their feet.", "mood": "suspense"},
    {"text": "So naturally, the soldiers thought it was hilarious, and somebody started whistling a march. Everyone stomped harder, and the chains began to groan, but nobody wanted to be the one who broke step.", "mood": "fast", "pause": 0.22},
    {"text": "Then a single bolt snapped, and the whole end of the bridge dropped into the river.", "mood": "reveal", "pause": 0.22},
    {"text": "Luckily, the river was only two feet deep.", "mood": "neutral", "pause": 0.22},
    {"text": "Unluckily, the river was only two feet deep.", "mood": "joke", "pause": 0.22},
    {"text": "You see, every bridge has a rhythm it likes to sway at, a bit like a kid on a swing. Tiny pushes at just the right moment send that swing higher and higher.", "mood": "neutral"},
    {"text": "Seventy-four men marching in step were pushing that bridge like a swing.", "mood": "reveal"},
    {"text": "So now, the best drilled soldiers in the world cross every bridge like a crowd of tourists.", "mood": "joke"}
  ]
}
```
`pause` = seconds of REAL silence after the entry (mood default 0.03-0.12; whisper measures every silence ~0.2-0.3 s
longer, so 0.05 sounds like the references' quarter-second breath). Sentence ends inside an entry are cut to 0.08 s.
Long pauses (0.2-0.25 real) only after the hook, before a reveal and before a punchline: about 4-6 per minute. A quoted
character line: `{"text": "You're wrecking my railroad!", "mood": "character"}` (ElevenLabs ignores the mood's pitch;
for a distinct character give the entry its own `"settings"`). eleven_v4 ignores the API speed, so moods scale a
pitch-kept post speed-up: `"tempo"` x mood (at tempo 1.17: suspense 1.08, reveal 1.05, fast 1.26; the hook gets its own "tempo": 1.45); a
per-line `"tempo"` overrides. NO [audio tags] in any text (user
rule 2026-11-23; voice_lines.py refuses them).


## Sync table with the camera chain (2026-11-21)
Add a "camera goes to" column: the subject the camera MOVES to on that row's key word, its framing and the purpose of
the move (connect / reveal / scale / insert / reaction / follow). Each row becomes one `beat(at, dur, pos, look, fov)`
in story.ts; ~2-3 s apart; inserts are reached by a push onto a 3D hero prop.

| # | time | words | composition | action on its word | camera goes to (purpose) |
|---|---|---|---|---|---|
| 2 | 3.3-9.3 | "...glass dishes full of germs..." | LAB bench | the stack, then a germ dish | swing right + push onto the stack on "dishes" (connect); tilt down into the dish on "germs" (insert) |
