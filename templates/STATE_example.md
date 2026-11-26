# STATE: <name>  (the hand-off between phases; `$STUDIO/<name>/STATE.md`)
Every phase reads this first and rewrites it last. Keep it under ~80 lines: decisions and file paths, not content.

## Idea
<the user's idea, verbatim, + any source they gave>

## Phase status
- [x] A Story + voice   (steps 1-3b)  2026-11-26
- [ ] B Build           (steps 4-7)
- [ ] C Look            (step 9)
- [ ] D Sound + finish  (steps 8, 10-13)

## Decisions so far (one line each)
- hook pattern 1: "<hook line>" (retention_stats --hook PASS, 4.3 w/s)
- payoff line starts "<first words>" at 74 %
- places: lamp room (interior), gallery (night) -> library parts: wall_dressing, sea
- composition ids: LighthouseShort / LighthouseShort2K; FRAMES 2054

## Files
- script: `<name>/SCRIPT.md` (facts + sources, sync table, ledger)   voice: `<name>/voice/{voice.wav,words.json}`
- code: `src/videos/<name>/`   stills: `out/<name>/r1/`   final: `out/<name>/final.mp4`

## Open issues for the next phase
- verifier round 1 item 4 (keeper's hand in the caption band at f1260) not yet fixed

## Next
Phase B: build the shots from the sync table in SCRIPT.md.
