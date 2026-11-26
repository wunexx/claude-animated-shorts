---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill".
---

# Cartoon 3D story short (three.js + Remotion)

## Folders: exactly two, on every machine and every agent (user rule 2026-11-26; read first)
Everything this skill creates, installs, caches or renders lives in ONE of two folders. Nothing else on the
computer is written: no project in ~/, no ~/bridge-short, no files in /tmp or the system temp, no global npm / pip
installs, no model caches in ~/.cache, no notes in an agent's own memory folder.
| folder | what is in it |
|---|---|
| **SKILL** = this skill's folder (`$SKILL_DIR`) | the rules, templates, library parts, references (git) **plus `studio/`** (git-ignored): the Remotion project (`package.json`, `node_modules`, `src/`, `public/`), `scripts` (a link to `templates/scripts`), `.venv` (Python), `<name>/voice`, `<name>/audio`, `out/<name>/` work files, and `.cache/` (Remotion bundles, temp files, whisper models, npm / pip caches) |
| **LIBRARY** = the output folder (`$SHORTS_LIBRARY`, set in `paths.env`, the skill's only machine-specific line) | `<name>/` per finished short: `final.mp4`, `captions.srt`, `SCRIPT.md`, `POST.md`, `thumb_9x16.jpg`, `thumb_3x4.jpg`, `thumb_1x1.jpg`; `.env` with `ELEVENLABS_API_KEY`; channel art; the private reference videos (study only, never publish or upload) |
- **Every shell command of a short starts with** `. "$HOME/.claude/skills/cartoon-3d-short/env.sh" && cd "$STUDIO"`
  (one chained command, because an agent's shell may not keep state between calls). env.sh sets `SKILL_DIR`,
  `STUDIO`, `SHORTS_LIBRARY`, points TMPDIR / TEMP / REMOTION_TMP / HF_HOME / npm / pip caches into
  `studio/.cache`, puts `studio/.venv/bin` first on PATH and loads the ElevenLabs key from `$SHORTS_LIBRARY/.env`.
  The Python scripts also import `skillpaths.py`, so they keep these rules even if env.sh was skipped.
- **First run on a machine:** `bash "$HOME/.claude/skills/cartoon-3d-short/setup.sh"` (builds `studio/`: npm
  packages at the pinned versions, the venv, the script link). Check `paths.env` points at the user's library; if
  that folder does not exist, ask the user where it is and edit `paths.env`, never create a library elsewhere.
- setup.sh ends with a smoke still (one box, `templates/project/smoke.tsx` -> `studio/.cache/smoke_15.jpg`); if it
  fails, the machine is not ready: fix that before any short. Proven on macOS arm64 2026-11-26 (`--gl angle` works).
- Python is 3.12 in `studio/.venv` on every machine (setup.sh: uv's own Python in `.cache/uv-python`; Homebrew's 3.15
  could not build `av`). Run scripts with `python` AFTER env.sh (it puts the venv first), never the system python3.
- In this file, `<project>`, "the project" and "the ready project" all mean `$STUDIO`. Commands are written relative
  to it (`scripts/...`, `src/videos/<name>/`, `out/<name>/`, `<name>/voice/`).
- **The ElevenLabs key** is read only from `$SHORTS_LIBRARY/.env` (or the env var). Never print, copy, log or commit it.
- **Lessons and user rules go into this skill** (SKILL.md, templates, library), never only into an agent's memory:
  the skill must behave the same whichever agent runs it.
- A user change of style, pacing, voice, look or pipeline is written into SKILL.md (and the templates it names) in
  the same turn, with the date, so every later short and every agent follows it.

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- It was made before the two-folder rule; its code lives on as `templates/storybook/` (composition `BridgeShort`,
  1080x1920, 30 fps).
- Style research: `references/`.

The style reference is a channel studied privately (`references/`: STYLE_BIBLE.md, reports/*.md, frames/).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

User rules that apply (details in the step named):
- Deliver with every video: word-timed captions + `captions.srt` (3b), a 9:16 / 3:4 / 1:1 thumbnail (11), `POST.md` (12).
- Labels LIGHT: <= 2-3 cards, only for what the picture cannot show; prefer in-world signs (4b).
- Retention first: a curiosity-driven story, not a lesson; every sentence, visual, sound and scene earns its place
  (2, 2c, 8, 10; the retention study behind these rules was not kept: the rules below are its result).
- Deliberate, not rushed: time to hear, see and understand each sentence; full sentences, ONE continuous voice
  performance, one continuous camera per place, a sync table (2-4c; distilled from a pacing study not kept). Atlas 2
  (23 cuts, fragments, 5 w/s) passed the old checks and still felt overwhelming: fast is not engaging.
- The hook LINE is brisk (4.0-4.8 w/s, a hard check), never slow: the user found it slow on Vasa AND Penicillin (3).
- The hook NEVER reveals the outcome or the explanation (2, "Hook patterns"): the user would not keep watching
  Penicillin 2 ("...and changed medicine forever" = the whole video in one line, 2026-11-22). Use one of the 4
  user-approved hook patterns; `hook_text_rows` in retention_stats.py flags outcome words before any voice is made.
- English only. Jokes are researched real facts; characters may paraphrase the sources, never invent a fact or outcome.
- Mix: voice unchanged, music + SFX ~5-6 dB under the voice in gaps, SFX hits on actions (8).
- Final export: native 1440x2560 composition (`--scale 1.3333` fails in Remotion 4.0.5xx) (10).
- Opus max verifies every check (9). Save after every step. "Just do it" once the script is approved.
- Never test-render a template: the first render of a new short is a still of its OWN shots. A setup smoke test uses
  a throwaway scene (one box in a ThreeCanvas).

## Fast start (read first: keeps a short to ~1/3 of the usage the La Llorona short took)
- **One short per session.** Start every new short in a fresh conversation; never stack a second short onto a long one
  (every step re-reads the whole conversation, so a long session makes each later step several times more expensive).
- **Ready project: `$STUDIO` (= `<skill>/studio`)** (Remotion entry `src/index.ts`, `src/Root.tsx`). Do not scaffold or
  `npm install` by hand; if `studio/node_modules` exists, go; if not, run `setup.sh` (it pins these). Working versions: react/react-dom 18.3, @react-three/fiber 8.18,
  @react-three/postprocessing 2.19, postprocessing 6.39, three 0.170, remotion + @remotion/{cli,bundler,renderer,three}
  4.0.544. Never upgrade to React 19 / R3F 9 / react-postprocessing 3: the EffectComposer then renders blank frames.
  On a new machine: `bash setup.sh` (npm packages above with `--legacy-peer-deps` into studio/node_modules, and a
  `studio/.venv` with scipy numpy pillow av faster-whisper). Never install globally (no `npm -g`, no system pip).
- **ALWAYS start from the skill's own templates** (they hold every fix and Look v3; older versions live only in the
  skill's git history):
  - code: `templates/storybook/` -> copy to `src/videos/<name>/`. This is the CORE only (2026-11-24): Look v3 (illus.ts textures + glossy matcaps, point lights, interior preset), the
    eight light presets (incl. `interior`), sky / sun-moon discs / stars / clouds / water shader, the character kit, generic fx, post, paper
    grain, native 2K canvas. It builds **no scenery**: a place exists only when the short registers it in `sets.ts`.
  - parts: `library/` (catalogue `library/LIBRARY.md`): ready sets (river town, harbour dressing, Mexican dressing,
    Aztec lake city, open sea + pier + lighthouse, bedroom, bathroom, planet in space, alien/Venus ground), characters
    (dog, ghost, baker, seaside and colonial townsfolk...), effect drawings and staging helpers from earlier shorts.
    **Use a part only when the story needs it**; never add the town (or any set) by default.
  - audio: `templates/audio_storybook/` -> copy to `$STUDIO/<name>/audio/` (a complete working example: the Yasuke
    short). Rewrite timeline.py (beat times), sfx.py (ONLY the cue list: `from sfx_lib import *`), music.py (score +
    SECTIONS) and the `MUSIC_TARGET` / `HARD` / title lines of mix_ll.py; run `python mix_ll.py`. sfx_lib.py holds the
    Cue class, every effect generator from earlier shorts (catalogue in its header) and the renderer: read its header
    only, never another short's audio files. A new generic generator goes into sfx_lib.py AND the template copy.
    dsp, instruments, sfx_gen, mix are shared helpers, do not edit.
  - scripts: `$STUDIO/scripts` is a LINK to `templates/scripts/` (made by setup.sh): run them in place, never copy
    them, so a fix to a script IS the template fix (stills, sheet, shots_table, short_qa, look_stats (Look v3 gate), style_stats, sbs_sheet,
    captions, thumbnail, voice_lines (delivery-map voice), retention_stats (pacing / bed / payoff / camera numbers),
    camstats (camera motion, used by retention_stats)).
  - project files: `templates/project/` (package.json, tsconfig.json, src/index.ts, src/Root.tsx); setup.sh copies them.
  Register `<Name>Short` (1080x1920, stills) + `<Name>Short2K` (1440x2560, final) in `src/Root.tsx`.
- **Every fix goes into the template too.** When a short's code gets a fix that should hold for future videos (a bug,
  a look rule, a pipeline step), copy the changed file(s) back into `templates/storybook/` (or audio_storybook /
  scripts) in the same turn and note it in this file. A fix that lives only in the project folder is lost next time.
- **Every reusable new part goes into the library.** When a short builds a set, character, effect or staging helper
  that another story could use, save it as `library/<kind>/<name>.ts.txt` with the 4-line header and add one row to
  `library/LIBRARY.md` before delivering ("Adding parts" in LIBRARY.md). Story-only code stays in the short.
- **Pick parts before writing scenery (saves most of the code-writing time).** After the script is approved, read
  `library/LIBRARY.md` once and map every planned place / character / effect to a part, or to "new". Append chosen
  parts with `cat <part> >> <file>` (read only their 4-line headers, never the whole part), wire them in `sets.ts`,
  and write only what is new. Two Suns spent ~12 of its working minutes writing sets that now exist as parts.
- **Characters: read `CHARACTERS.md`** (outfit fields, hats, props, poses, expressions, fx drawings with canvas sizes,
  staging helpers, Pen API) instead of toon.ts / cast.ts. Open toon.ts only to add a new hat/prop/pose, then add it
  to CHARACTERS.md too.
- **Read only what you change.** Do not read the template files in full (~4,000 lines). What changes per story:
  `story.ts` (a skeleton: rewrite all of it - shots with a `place` each, positions, cameras, DOF, `DISCS` for suns /
  moons in frame), `sets.ts` (register one builder per place: library parts or the short's own), `cast.ts` (only the
  `stage()` switch at the end + pasted library helpers), `toon.ts` (append library characters / new drawings at the end;
  `Grep` for `bodyFront`, `fx*`), `build.ts` (append library sets / new builders below the marker). `world.ts` needs no
  edit for a normal short (places come from sets.ts; per-place per-frame logic goes in a set's `update` hook).
  `lights.ts` only for a new light. Never touch ink.ts, lensblur.ts, shade.ts, cardshade.ts, paint.ts, grade.ts
  presets unless a verifier fix names them.
- **Patch with a Python script file** (Write it into `$STUDIO/.cache/tmp/`, then run it), never Python heredocs
  containing backticks: some shells (Git Bash) reject them ("unexpected EOF"), so this works on every machine.
- **Batch the look checks** (see step 9): one full set of stills, one fix batch, one re-check, then the final render.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
   - **Every fact gets a searched source (user rule 2026-11-23).** Search the web for EVERY fact the script, labels,
     thumbnail or POST.md states: names, dates, numbers, quotes, events, causes and the analogy's claim. Never write
     one from memory, however well known. In SCRIPT.md, put the source (title + URL) next to each fact, not in one
     list at the end. A fact no source supports is cut or rewritten to what the sources say, and the user is told.
     A fact added later (a rewrite, a new line, a post caption) gets its own search before it is used.
     (Dazzle: "hundreds of ships every month" was written from memory; checked afterwards it held, but the user asked
     for this rule.)
2. **Script: a curiosity chain** (~3.6 real words/s, 55-70 s; 35-45 s also works; ~200-230 words for 60 s). Format: `templates/SCRIPT_example.md`.
   The video is a continuous discovery, never a straight explanation. Structure:
   - **Hook** (ONE sentence, 8-16 words, NO commas, then a ~0.3 s breath; pattern 2 adds "But why?", pattern 4's
     "The thing is," sentence is beat 2). Text check first: `python scripts/retention_stats.py --hook "<line>"`;
     voice_lines.py refuses a failing hook (`--force-hook` only with the user's OK). Speed is a HARD check: 4.0-4.8 w/s as one
     line (`hook line rate` in voice_lines.py / retention_stats.py; the user found ~3.4 w/s hooks slow on Vasa AND
     Penicillin). Mood `hook` = +20 % on the base; if it still measures < 4.0, re-generate that entry with a per-line
     `"rate"` (+36 % gave Penicillin 4.1) BEFORE timing any picture. The line is an intriguing
     situation whose explanation is WITHHELD. The viewer must be able to phrase the question ("why would anyone do
     that?") and the line must not answer it. A concrete picture, not an abstract claim: frame 1 shows the protagonist,
     face readable, DOING the strange thing, and that composition holds for the whole hook sentence (R2: "He sawed gaps
     into a railroad every 39 feet." = one held shot of him sawing, 3.2 s). Hide the why, never the who.
   - **Hook patterns (user rule 2026-11-22: use ONE of these four; every hook shows a strange act or fact and holds
     back BOTH the reason AND the result):**
     1. **Someone did something confusing** (default). An act the viewer understands at once but cannot explain, with
        no reason and no result given. "He found mould on his dirty dishes and started growing more of it on purpose."
     2. **Confusing act + "But why?"** Pattern 1, then the narrator asks the viewer's question out loud as a separate
        2-word tag (after it ends a sentence). "An army cook sealed dinner in glass jars and boiled them for hours. But why?" Use it when
        the act alone might read as plain fact rather than a mystery. The hook-rate check measures only the first sentence.
     3. **Someone did something + a reason that confuses even more** (at the end of the line). The "because" makes it
        stranger, never clearer. "A captain fed his sailors rotten cabbage to keep them healthy." / "Doctors put live
        maggots into open wounds to clean them." (Examples, not ready facts: check every hook against the sources.)
     4. **Confusing fact + "The thing is," / "You know," + an entertaining explanation.** A fact that sounds
        impossible, then the next sentence starts the story with a pivot word and a funny or human detail, NOT the
        mechanism. "The most important medicine ever found grew in a dish nobody bothered to wash. The thing is, the
        man who owned it was famous for being messy." The pivot sentence is beat 2, not the hook (no rate check on it).
     **Never in a hook:** the outcome ("...and changed medicine forever", "...and still starved to death", "...and
     won a Nobel Prize", "...saved millions", "...ended the war"), the mechanism or its name, the twist, the payoff
     image, a superlative verdict on history ("changed the world"), or a name/year/place opener. Test: cover the last
     30 % of the script; if the hook tells you what is in it, rewrite. Test 2: could the viewer stop at 3 s feeling they
     know the story? Then it reveals too much. Draft one hook per pattern (2b) and keep the best.
   - **Context** (done by ~10 s): only what the viewer needs to follow. Names, years and places come here or later,
     and only if they matter.
   - **Development:** stakes + an obstacle or a doubter (someone mocks, refuses, forbids, laughs).
   - **Escalation:** 2-3 beats, each bigger, each giving a NEW fact, event or status change.
   - **Climax:** the most surprising event or revelation.
   - **Payoff:** the explanation / reveal that answers the hook, at 60-90 % of the runtime, aim ~75 %. The 10 refs with
     transcripts pivot at 60-89 % (mean 75.5 %, 7 of 10 inside 65-85 %): Brain 60 %, Storm oil 67, Gambling 68,
     Crash 71, Spear 74, Lottery 76, Pink 81, Job 82, Burglar 88, Railroad 89. The pivot is usually "You see," or a
     spoken question ("So how does this keep happening?"). Railroad's early "You see" only sets up the story; its real
     turn is "Rail touching rail.".
     Show the mechanism working first, name it in one line, one everyday analogy right there ("Ever blown on a bowl of soup?").
   - **Information unfold (from a 12-reference study, 2026-11-22; the study file was not kept):** the viewer learns WHAT is
     happening fast and WHY late. Between hook and payoff:
     - **Answer "what" quickly, keep "why" for the end.** By ~10 s the viewer knows who, where and what is at stake;
       the reason behind the hook act stays closed until the pivot. Every beat in between deepens the mystery instead
       of shrinking it.
     - **A doubter says the viewer's objection out loud** in the first third (the officer laughs, the boss turns
       purple, the captain mocks "making soup"). It tells the viewer their doubt is expected and raises the stakes.
     - **Eliminate the easy explanations, one beat each.** Each escalation tests and removes an obvious explanation
       (a warning sign doubles the crashes; even the careful sheriff crashes; then he hits the stump). When the real
       answer arrives, it is the only one left.
     - **Escalate with numbers the ear can track:** times, distances, counts ("At 15 minutes... At 20...", "a coin in
       May, a sheet of paper by July"). Rising numbers sound like a countdown.
     - **Plant the explanation early as a joke or insult.** The analogy that explains the payoff is first heard as
       colour (the captain's "soup" insult returns as the soup analogy). It pays off twice.
     - **Take the comfort away once.** Give the viewer something reassuring (a happy colleague, a careful driver, the
       guard who seems fine), then remove it shortly before the pivot.
     - **Hold back the technical term** until the viewer has felt the thing it names (describe the half-asleep state,
       THEN say "hypnagogia").
     - **The reveal returns to the opening image and changes its meaning** (the gaps, the oil, the couch, the dish).
       Plan the hook shot and the payoff shot together in the sync table.
     - **The last line answers motive in one beat or leaves one consequence to infer** ("...and the buyer is him.";
       "...right as a train rolls onto it."). Never explain the consequence the viewer can work out.
   - **Picture unfold (frame study of all 12 refs, 2026-11-22 (per-frame CSVs not kept), frame-to-
     frame change at 90x160, lined up with the word timings. Flash clusters from lightning, muzzle flashes or a
     blinking sign were not counted as cuts):**
     - **Frame 1 is a picture, never a fade:** opening brightness 56-138 of 255 in all 12, and the hook shot is
       already moving (mean change 5-21 in 11 of 12; even Pink's near-still hook has the roller moving).
     - **First cut: one of two styles, never a cut sequence inside the hook.** (a) One continuous opening shot of
       14-35 s, i.e. the whole first situation (Spear 19 s, Burglar 21, Pink 35, Storm oil 21, Second draw 14, Brain
       29); (b) a single cut ON the hook's turn word, right as the hook sentence ends (Gambling "yet" 2.0 s, Job "but"
       2.2 s, Railroad "You see" 3.7 s, Lottery "won a million" 2.9 s). Default to (a); use (b) only for a
       contradiction hook (pattern 4) or a "But why?" tag (pattern 2), cutting on "yet / but / the thing is / But why?".
     - **Few real cuts, spent on the turns:** 2-6 per video. They land on the story's turning words, not on new
       sentences: the question ("which one is real?"), a time jump ("Then summer comes"), the escalation count ("At 15
       minutes"), the twist ("he'd sold them that house"), the explanation word ("impossible to fire",
       "hypnagogia"), the final mechanism shot ("He slides the tokens through"). The escalation middle usually stays
       in one place with a moving camera. Mark in the sync table which turn each cut serves; a cut serving no turn
       becomes a camera move.
     - **Big moves 14-30 per minute (median ~23), camera changing in 35-72 % of frames** (median ~53): confirms the
       camera-chain targets in step 4 (18-32 big moves/min).
     - **The biggest visual moment sits at the climax, not the hook:** in 6 of 10 the largest frame change of the
       whole video falls at 60-90 % (Spear 62 %, Crash 60, Pink 60, Railroad 68, Brain 73, Burglar 90), on the reveal
       or the twist. Save the biggest move, flash or scale change (KICK) for the payoff; the hook catches with
       strangeness, not spectacle.
     - **It ends on the last word:** the video ends 0.02-0.41 s after the last spoken word in all 10 measured (median
       0.2 s). No hold, no logo, no music tail: the final image is on screen while the last word lands, then the cut
       to the end.
   - **Final image:** a callback, ironic reversal or the doubters getting the consequence. The video ends within
     ~0.5 s of the last word (refs 0.02-0.41 s): no moral, no summary, no "follow for more", no coda after the payoff unless it IS the twist.
   - **Open-loop ledger** (a table in SCRIPT.md): question opened (line) -> answered (line). From 3 s to the payoff at
     least one question is always open; whenever one is answered, the same or the next line opens another ("Weeks
     later, a ball fell, but nothing happened.").
   - **BUT / SO test:** consecutive beats join with BUT (a turn) or SO (a consequence), never only "and then". Rewrite
     or cut every "and then" join.
   - **Storyteller voice:** full, flowing sentences (mean 10-15 words, median >= 10; the references 9-15), each one a
     complete thought with ONE new idea, second person where it fits ("Imagine your boss walks you..."), rhetorical
     asides ("Sounds like the worst nap ever."); short quoted character lines carry conflict and humour. A fragment
     ("Rail touching rail.", "Forever.") is a deliberate punch, at most ~1 per 15 s; never chains of fragments
     ("His job? Holding up the sky. Forever. But not the Earth. The sky." = five ideas in 3 s, Atlas 2).
   - **Information pace:** one new concept every ~4-5 s; the first 15 s stay in ONE situation with <= 3 new things
     (who, the strange act, the stakes). A tangent (a statue, a backstory war) is one clause said over the main scene,
     not its own place, or it is cut. Nothing appears on screen that the narration has not reached.
   - **Modern bridge:** one modern comparison / office / phone / job joke where the topic invites it (Sisyphus's
     "9-to-5 job" and Atlas's "shift cover" were our strongest hooks); never forced.
   - **Formula tics are tools, not slots:** "Luckily ... / Unluckily ..." (four shorts in a row used it), "Meet X",
     "In <year>, ..." only when they are clearly the best line. Never open with a name, a year or a place.
   - Never describe on screen what the viewer already sees. Cut exposition, repetition and any beat that only restates.
   - Example (Atlas, rewritten 2026-11-19): "Atlas had one job: hold up the whole sky, forever." over one held low
     shot of him straining under the starry sky, face clearly visible (~3.3 s), then "So when a stranger offered to take
     it for a minute, he should have been suspicious." as the camera pulls back and Heracles walks in (one move, ~4 s).
     Anti-examples: Atlas 2's hook (a cushion for 1.3 s, then black silhouettes for 4 s: unreadable at the moment the
     viewer decides to stay), Erysichthon's ("...and still starved to death": it spoils the ending) and Penicillin 2's
     ("He went on holiday without washing his dishes and changed medicine forever.": the result is in the hook, so
     the user had no reason to stay; pattern 1 instead: "He came back from holiday to a mouldy dish and refused to
     throw it away.").
2b. **Story craft checks** (distilled 2026-11-17 from the user's engagement study; the study file was not kept). The curiosity chain above is the default; these sharpen it:
   - **Pick the viewer's job first.** Finish "The viewer keeps watching to ___" before writing. Formats: explainer
     (understand a surprising result: the default), legend (learn a rule, then anticipate it biting), mystery (judge
     two accounts with fair evidence), underdog (watch someone low gain a chance), anomaly (a normal pattern breaks,
     find its rule). Pick the one the topic fits; never force a villain, a ghost or a binary choice.
   - **Draft 4 hooks, one per user pattern** (step 2 "Hook patterns": confusing act / + "But why?" / + a stranger
     reason / confusing fact + "The thing is,") and the 10 s after each; for each the spoken line with the exact
     picture change AND what the picture hides. Check each: can the viewer phrase the question? does the line NOT
     answer it AND NOT state the result? is it a concrete picture? does the ending pay it off exactly? Run
     `python scripts/retention_stats.py --hook "<line>"` on each (outcome words, openers, length). Keep the best;
     list the others in SCRIPT.md with the reason each lost.
     Banned: generic bait ("you won't believe", "what happens next will shock you", "wait for it", "watch till the end").
     The first image already carries information (no slow fade-in).
   - **Every beat changes something:** new fact, action, status or consequence. Restating the premise is cut first.
   - **Plant -> payoff.** Every object or detail that solves or reveals something is shown clearly earlier; every
     planted thing pays off (Llorona-style: one prop doing several jobs). Callback endings reuse a planted detail.
   - **Demonstrate -> name -> use:** show the rule/mechanism, name it briefly, then show a result that depends on it.
   - **Pictures carry information** (pairs with the labels, step 4b): counts and rows of objects for quantities,
     height/grouping for rank, two spaces side by side for a contrast, a map for "where", a cutaway for "inside".
     A count/clock/indicator keeps one meaning and correct values from first to last appearance.
   - **Ending matches the promise:** answer the opening question. No sequel votes, no generic "comment below".
   - **Facts stay exact:** approximate vs exact numbers, suspicion vs proof; a label never states more than the
     research supports.
   - **3-second walk** (before showing the script to the user): for every ~3 s slice write "what is new" and "what
     question is open". A slice with neither is rewritten or cut. A slice with MORE than one new thing is a warning:
     spread it out (the viewer needs time to see what the words refer to).
   - **Pre-render story check** (with the step 9 sheet): opening stills read at phone size without notes; the first
     10 s add information; every setup has a payoff and every reveal a setup.
2c. **Reveal plan** (in SCRIPT.md, with the picture plan): the visuals never answer a question before the words do.
   - Hide the WHY, not the WHO (2026-11-19). The protagonist is visible and readable from frame 1; what is hidden is
     the reason, the mechanism, the outcome. Silhouettes / off-frame are for a genuine mystery character (the ghost,
     the unseen enemy, the stranger whose identity IS the twist), never for the hero of the hook, and never longer than
     the one sentence that withholds them. A picture the viewer cannot parse is confusion, not curiosity.
   - For every secret in the open-loop ledger: the reveal word, and how the picture hides it until then: silhouette
     (`FrontOpts.sil` + `unveil(t, ts)` in cast.ts: a flat dark card that turns into the full card over ~8 f on the
     word), backlight, side / back framing, out of focus (DOF on the subject), behind a door / screen / foreground prop,
     off-frame with only the reaction, a shadow on a wall, an extreme close-up of a detail (a hand, a boot, a ball in a jaw).
   - Visual suspense: hold on the reaction or the hiding place a beat before the reveal; reveal with a camera move
     (pull back, rack focus, a door opening), not only a cut.
   - Environmental storytelling: let a set change tell a plot point without narration (a cleared desk, an empty
     chair, a crack in the jar, fewer coins on the table).
   - Labels obey the reveal: a name tag pops ON the reveal word, never on the first appearance of a hidden character;
     a fact callout never appears before the narration says it; the opening place card only if it does not answer the hook.
   - Per shot, note what the viewer is allowed to know; a still that shows more is a bug (checked in step 9).
3. **Voice.** Record or generate `voice.wav`, then make its word timings `words.json` (any speech-to-text with word times).
   - Put them in the project folder: `<project>/<name>/voice/` (voice.wav, words.json).
   - Hand-fix the word timings. Everything is timed to words.json.
   - **Delivery map** (`<name>/voice/lines.json`, written with the script; format in `templates/SCRIPT_example.md`):
     the narrator is ONE engaging storyteller giving one continuous performance, not a string of separate readings.
     One entry per story BEAT (2-4 sentences in one TTS call, so the prosody flows across sentences: Atlas 2's 21
     one-line clips sounded like separate readings); split a beat only for the hook,
     a punchline, a reveal line or a character line. Entry: `{"text", "mood", "pause"?, "voice"?, "rate"?, "pitch"?,
     "volume"?}`. Moods are RATE + pause only (no narrator pitch offsets, presets in `voice_lines.py`): `hook`
     (+20 %, no commas: 4.0-4.8 w/s for the hook line, a hard check; NOT slow), `neutral` (story), `suspense` (slower), `reveal` (slower, ~0.4 s before it), `joke`
     (the punch in its own entry after a ~0.3 s beat), `fast` (lists, chases, rising escalation), `aside`,
     `character` (a quoted line: the narrator's voice pitched up for the character, like the references' +5-9
     semitones, default +40Hz; or set `voice` for one fixed character voice; pick one approach per short with a
     2-line A/B before the full voice).
   - Pace by section: hook brisk (never the slowest line), story ~3.8-4.3 words per second of speech, lists / chases may run faster, reveal and
     punch lines slower. Emphasis comes from slowing down and from pauses, not from pitch jumps.
   - Pauses: inside a beat the sentence ends are cut to 0.08 s real (= the references' ~0.25 s breath as whisper measures it); a planned
     `pause` of 0.2-0.25 s (REAL silence; whisper measures it ~0.2-0.3 s longer) only after the hook, before a reveal
     and before a punchline (~4-6 per minute).
   - Targets (voice_lines.py prints them): hook line 4.0-4.8 w/s and articulation rate (words per second of actual
     speech) 4.0-4.8 in the first 5 s, 3.6-4.4 overall (references 3.4-4.6 / 3.75-4.39; Atlas 2 4.95 / 4.40); average
     rate 3.3-3.9 w/s; <= 20 % of sentences spoken at >= 5 w/s (references 0-11 %, Atlas 2 39 %); <= 8 pauses > 0.35 s
     per minute.
   - Generate: `python scripts/voice_lines.py <name>/voice/lines.json <name>/voice` (one ElevenLabs call per entry,
     cached in clips/ so a re-run only pays for changed lines; trims each clip's silence, joins with the planned pauses,
     writes voice.wav 48 kHz mono, words.json from faster-whisper, and prints words/s + long pauses). Listen to the
     result before captions; re-tune moods/pauses in lines.json and re-run.
   - **Narrator (2026-11-23): ElevenLabs API (Starter plan), voice "Alex - Young American Male" (upbeat, confident,
     "great for YouTube, shorts"), model `eleven_v4`, fetched automatically by voice_lines.py: no manual step.** The
     user disliked edge-tts (robotic), Kokoro Liam and the local Qwen3-TTS / Chatterbox voices (all deleted), tried
     Josh - Teacher for Kids (too slow, ~2.9 w/s), then picked Alex. Their "youtube voices" collection in My Voices
     also holds Josh `nzFihrBIvB34imQBuxub` and Tyler `rPMkKgdwgIwqv4fXgR6N` (untested). lines.json header (copy it):
     `"engine": "elevenlabs", "voice_id": "yl2ZDV1MzN4HbQJbMihG", "model": "eleven_v4", "tempo": 1.17`, and give
     the hook entry `"tempo": 1.45` (+ optional `"settings": {"stability": 0.5, "similarity_boost": 0.75, "style":
     0.0}`, `"seed"`, `"format"` (default mp3_44100_128), `"context": false`).
     - **eleven_v4 IGNORES the API `speed`** (tested: 0.8 and 1.2 gave the same length). Pace is set after the download
       by a pitch-kept speed-up: clip tempo = `"tempo"` x the mood's rate (hook +20 % -> 1.44, reveal -10 % -> 1.08);
       a per-line `"tempo"` overrides. Alex's own pace ~3.46 w/s articulation (Josh 3.11). Emu War test, Alex at
       tempo 1.17 (hook 1.40): hook 3.94, average 3.68, articulation 3.97 overall / 3.80 first 5 s, 5 long pauses/min;
       the hook `"tempo": 1.45` (and line 2 ~1.25 if the first-5-s check fails) lifts the opening to the target.
     - The voices pause long at commas / full stops: ElevenLabs silences over 0.25 s are cut to 0.14 s inside a clip.
     - previous_text / next_text (the neighbouring entries) are sent so the prosody flows across beats; voice_lines.py
       retries without them if the model refuses. Clips are cached by text + settings, so a re-run is free.
     - **No [audio tags] in the script, ever (user rule 2026-11-23): voice_lines.py refuses them.**
     - Credits: Starter = ~37.5k characters a month (a 60 s short ~1.3k per full take). `python scripts/el_voices.py
       usage` before and after; re-generate only the entries that need it.
   - Fallback without API access (free plan): `scripts/el_website.py prep <lines.json>` writes website_script.txt
     for the user to paste on elevenlabs.io; `el_website.py import <download> <name>/voice --tempo 1.2 --hook-tempo
     1.15` makes voice.wav + words.json + the checks. Per-beat moods / pauses do not apply there.
   - Key: `ELEVENLABS_API_KEY=` in `$SHORTS_LIBRARY/.env`, which the USER keeps (env.sh / skillpaths.py read it;
     never type, print, copy or commit the key). Voices: `python scripts/el_voices.py mine Alex` (voice_id),
     `library <search>`, `add <owner> <voice_id> <name>`, `say <voice_id> "<text>"` (one test clip), `usage` (credits).
   - Keep a 1-3 word tag in the SAME entry as its sentence ("...let them go. But why?"): a 2-word TTS call comes out
     clipped (Kokoro's "But" lasted 0.06 s; untested on ElevenLabs, keep the rule). Whisper merges "hit, which" across
     the hook boundary and adds quote marks round quoted lines: fix words.json first.
     Old engine: edge-tts `en-US-AndrewMultilingualNeural` at `--rate=+14%` (used when lines.json has no "engine").
   - edge-tts notes: its Python `WordBoundary` mode returns "NoAudioReceived", so word times come from faster-whisper
     (`small.en`, `word_timestamps=True`), passing a 16 kHz float32 numpy array (a file path hits a PyAV
     `metadata_errors` error). No "..." in any text (NoAudioReceived; write "," instead). NoAudioReceived also comes in
     bursts after many quick requests: voice_lines.py retries 5x with a 2-16 s backoff; reword an entry only if it
     keeps failing.
   - (Atlas 2) Whisper misheard "No breaks" twice at the quick joke rate ("buttocks", "bedocks"): when a short word
     keeps coming back wrong, reword it ("No days off.") rather than only fixing words.json; a word whisper cannot
     hear is unclear to viewers too. Comma-heavy lines in `reveal` mood add 2 long pauses each: use `joke` / fewer commas.
3b. **Captions** (after words.json is hand-fixed, and again whenever it changes):
   `python scripts/captions.py <name>/voice/words.json src/videos/<name>/captions_data.ts out/<name>/captions.srt`.
   - Writes `captions_data.ts` (burned in by `captions.tsx`, drawn last in Bridge.tsx above the grain) and an .srt.
   - Chunks of <= 3 words / 18 chars, breaking at punctuation and pauses; the spoken word turns yellow; white bold
     type with the plum character ink outline, top at y 1300/1920 (lower third, clear of the platform UI).
   - Check the spelling in the captions (whisper writes numbers/names its own way): fix words.json, re-run the script.
   - Captions for an already-finished video (no 3D re-render): copy `captions.tsx` into a caption-only composition
     that takes the CAPTIONS array as a prop, render it transparent (`--codec=prores --prores-profile=4444
     --pixel-format=yuva444p10le --image-format=png`), then `ffmpeg -i final.mp4 -i caps.mov -filter_complex
     "[0:v][1:v]overlay=0:0:format=auto,format=yuvj420p" -map 0:a -c:a copy -c:v libx264 -crf 14 -preset slow`.
   - captions.tsx fade keys scale with chunk length (fixed 2026-11-17: a 5-frame chunk crashed with "inputRange must be
     strictly monotonically increasing"); keep that fix if you edit the file.
   - Look-check stills and verifier sheets: render WITHOUT captions (`PROPS='{"captions":false}'`) so the verifier
     judges the picture. Keep characters' faces and key action out of the caption band (y ~1280-1520 at 1080x1920).
4. **Shot plan** in `story.ts`: copy `templates/storybook/` to `src/videos/<name>/`, register `<Name>Short` + `<Name>Short2K` in `src/Root.tsx` (component `BridgeShort` from that folder's Bridge.tsx).
   - Map each place to a library set or a new set (see "Pick parts before writing scenery"), then rewrite story.ts,
     sets.ts and cast.ts `stage()` for the new story BEFORE the first render.
   - `SHOTS`: id, a/b frames, light (day/golden/night/hot/space/venus), `place` (a key of `SETS`).
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook (-1 = none; usually none now: a flash is a cut).
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
   - **Hold, move, act; don't cut (2026-11-19, replaces "a new picture every ~2 s").** The references have 0-2 hard
     cuts per video; Atlas 2 had 23 and 45 camera keys (1.3 s each) and felt overwhelming.
     - One continuous camera per place. Hard cuts (a new `SHOTS` entry or `cut: true`) only at a real jump in place or
       time, <= 4-6 per minute; a time jump in the same place is a dissolve (day to night on the same hill).
     - One composition per sentence, held for the sentence (typically 2.5-4.5 s); a second composition only when the
       sentence names a second thing. Median composition hold >= 2.5 s; nothing under 1.2 s except a deliberate punch.
     - **Camera = a chain of subjects, every move has a destination (2026-11-21, user: "you can't just move the camera
       an inch and call it camera movement"; study out/refstudy3/STUDY.md).** Measured on the references
       (`scripts/moves.py`): 21-28 big moves per minute, each 35-55 f, travelling 280-440 px (40-60 % of the frame),
       60-70 % compound (pan + tilt + push together). Each move TAKES THE EYE from one subject to the next one the
       narration names and lands on its word: push from the boss into the FIRE button on "impossible", tilt up to the
       scared face on "fired", pull out to the whole office on "in Japan", push into the phone until its screen fills
       the frame (an insert reached by a move), glide from the jar to the dragon head down to the frog's mouth, crane
       up over the courtyard on "biggest in the world". Between moves the camera drifts (moving 60-82 % of frames).
       - Write the sync table with a "camera goes to" column: one framing per named subject (face / object / wide),
         and the purpose of the move into it (connect, reveal, scale, insert, reaction, follow).
       - Build them with `beat(at, dur, pos, look, fov)` / `open0(...)` (template story.ts): a 30-55 f compound move
         landing 2 f before word time `at`, then a slow push + sideways drift. `side: 0` when the lens must not drift
         into a near prop. About one beat per sentence noun, ~20-30 per minute, plus the cuts.
       - Space them like the references: a beat every ~2-3 s (median >= 2.0 s between landings, <= 3 closer than
         1.2 s). Two nouns 1 s apart get ONE framing that holds both, not two moves (Penicillin 2 v2 had 16 beats
         under 1.2 s apart: busy in places although the per-minute count matched).
       - Inserts are reached by a move (push in until the object fills the frame), and the object there is a 3D hero
         prop (step 5), not a stretched card.
       - Do NOT use small word nudges (`accent` / `accOn` / `holdOn`, 2026-11-21 morning): 0.1-0.3 m wiggles with no
         destination read as jitter, and chasing camstats' old "moves/min" count with them made it worse.
       - Targets (step 10, `retention_stats.py`): big moves 18-32/min, median travel >= 250 px, median length 28-60 f.
         Measure on a proxy rendered WITHOUT the paper grain (paper is off by default since Look v3), see step 10: the
         static grain is identical every frame, so on flat walls camstats locks onto it and reads 0 px/f during real
         moves (Penicillin 2: 14.5/min with grain, 29/min on the proxy). Whips stay rare (the only moves over the
         24 px/f motion-blur gate).
     - Between compositions the camera TRAVELS on screen: follow a walk, fly along the set, pull back to reveal, rise
       to the sky; the move is timed to the sentence and arrives on the key word (R1: the camera follows the boss
       walking you to the tiny room word by word; R3: one move inside the jar reaches pendulum / rod / jaw / ball on
       each word). Glides of 24-60 f, not 8-12 f whips.
     - **Motion blur is automatic and only on fast moves** (2026-11-21, `motionblur.ts`, after the DOF): per-pixel
       camera blur over a 180° shutter (camAt at f -/+ 0.25), gated by camera speed: off below `MBLUR.lo` 24 px/f
       (at 1080x1920; normal glides peak ~14-16, so they stay sharp), full from `hi` 48. It never crosses a `cut: true`
       key. So a deliberate whip pan (<= 1 per video, 7-25 f, 45-93 px/f like the references) is now allowed and
       smears. Camera-only: a character moving with the camera streaks too during a fast move. Off for an A/B still:
       `PROPS='{"post":{"mblur":false}}'`.
     - The characters carry the change: every held composition has acting on the words (walk, gesture, point,
       expression change, sweat, steam, a prop handed over). R4 holds one two-shot for ~13 s across five sentences
       while the captain and the cook act. Faces big: in dialogue and reaction shots the face is >= ~12-15 % of the
       frame height; wides only to show a place or a crowd, briefly.
     - Inserts only when the sentence names an object, held >= 1.5 s, reached by a camera move when possible. A
       mechanism gets one cutaway / diagram, explored by one continuous move.
   - **Turn the cast: nobody stands flat to the lens (2026-11-21, user: "very flat, characters always face camera").**
     Characters are still flat ink cards, but their drawing now turns with a world facing (CHARACTERS.md "Turning"):
     - Every `front()` gets `{ face }`: the person / thing they attend to, or a heading. Two people talking face each
       other (default cheat 25 deg toward the lens: 3/4 views); a crowd faces the speaker; a listener turns to a new
       speaker ON the word (switch `face` 0-3 f before it). Facing the lens is a CHOICE (a direct address to the
       viewer, the hook), not the default. Walkers use `walk()` (path, so they show profile / 3/4 / back).
     - Over-the-shoulder for every exchange of 2+ lines: the camera ~1.5-2.5 m behind one character's shoulder (seen
       back-3/4, big, at a frame edge, often in lens blur) looking at the other's 3/4 face. Cut or orbit to the reverse
       for the answer.
     - Let the camera ORBIT people (20-70 deg over a sentence): they turn on screen and the world parallaxes behind
       them, the strongest "this is 3D" cue. Arrivals / departures walk toward or away from the lens (front / back).
     - Stage in depth, not in a row: one character near and one far, diagonals into the frame, a foreground figure or
       prop at the edge; never 3+ people on one line parallel to the lens.
     - Target per video: >= 60 % of character appearances turned (|yaw| >= 20), >= 2 over-the-shoulder setups, >= 1
       back view, >= 1 orbit around a character. Check on the step 9 contact sheet.
   - **Shot mix:** at least three angle types across the video (low, high, over-shoulder, top-down), a reaction face on
     every turn (expression changes on the word), visual comedy as a contrast in one frame (the calm cook vs the
     screaming captain), an exaggerated reaction, an object that answers back.
   - **Every composition has a purpose**, written as a comment on its `CAMS` key: the sentence it illustrates + new
     info / reaction / reveal / joke / mechanism. A composition without one is cut.
   - **Caption-band defaults (plan them in the first shot list, Atlas 2026-11-18):** faces and hero props stay above
     y 1280/1920. Aim each camera's look point ~0.4 m BELOW "centre the subject" (faces land ~55-62 % down the frame;
     a held overhead object may crop at the top). Small props go on a `rock()` (core cast.ts helper) or are held high,
     never on the ground in a medium shot. Stand a hero who must share a frame with a crowd below on a `rock()`.
     Scenery cards (trees, rocks, backdrops) get `bg: true` so the band check skips them.
4b. **Labels** (`labels_data.ts`, drawn by `labels.tsx` under the captions): plan them with the shots, timed to words.
   - Reveal plan first (2c): no label may answer an open question before the narration does.
   - LIGHT (2026-11-19): at most 2-3 cards per video (the references use none; Atlas 2 had 9 on top of the captions).
     Only for a number, name, date or source the picture cannot show and the viewer benefits from reading; prefer an
     in-world sign (a plaque, a scroll, a door sign, a calendar) that is part of the picture.
   - Never during a sentence that already brings a new picture; one card on screen at a time; pop 0-3 f before the
     word, hold >= 60 f.
   - Kinds: `place` card at a real jump in time/place ("KYOTO" / "Japan, 1581", never at the hook), `name` tag for the
     one key character whose name matters (on the word that names them), `fact` for one key number ("74").
   - Short text only: title <= 14 chars, sub <= 28 chars. Never cover a face or the caption band (y ~1280-1520).
   - Frame shots with room for their label (e.g. the character a little low/off-centre when a name tag pops).
   - Look-check stills keep labels ON (they are part of the composition); the verifier checks they cover nothing.
4c. **Sync table** (in SCRIPT.md, written with the shot plan, checked against words.json before the first stills):
   one row per sentence: start-end time | the words | the composition (place, framing, which characters) | the
   action and the WORD it lands on | the camera move to the next row. Rules: the key noun of a sentence is on screen
   0-3 f before its word and stays until the next key noun; a reaction lands on its word; nothing appears before the
   narration reaches it; consecutive rows in one place connect by a camera move, not a cut. The table is the shot plan:
   story.ts `CAMS` keys and cast.ts timings are written from it.
5. **World** (Look v3 first: `references/LOOK_V3.md` sections 3-5; textures from `illus.ts`, hero props `metalM` /
   `glazeM`, a PointLight per lamp in interiors, 15-40 dressing objects per view, a ceiling on every room).
   - **3D hero props + dressed sets (2026-11-21, references study):** the references keep characters flat but MODEL the
     story's key objects (gold dragons, a bronze jar, sculpted frogs, a FIRE button box with screws and a glowing dome)
     with smooth shading and highlights, and give every set illustrated texture (fabric patterns, brick, ceiling tiles,
     carpet). Flat-colour boxes made our close-ups look empty and low budget.
     - Every object the narration names and the camera pushes into is a 3D prop (three.js geometry with a glossy
       `illus.ts` matcap: `metalM` / `glazeM`; Look v3 - they stay glossy under every light). Example: `library/props/lab_props3d.ts.txt` (petri dish
       with agar, colonies, growing mould and spreading clear zone; dish stacks; flask with liquid, label, dust).
       Pose props per shot from the set's `update` hook with a state function in story.ts shared with cast.ts.
     - Give glossy/emissive-tinted materials to small props so the two-tone shade does not grey them out (agar went grey
       until it got an emissive). A held 3D prop sits at the visible hand (raised hand = `wave: 1`; seen from behind,
       `lift` hides the hands) and toward the camera by 0.1-0.15 m.
     - Every interior gets 2-4 painted details at eye level (`library/sets/wall_dressing.ts.txt`: charts, notice boards,
       clocks, portraits, posters, wood grain) plus glossy bottles / shelves, so a close-up background has something to read.
     - Wider lenses (50-58 deg) for room reveals and crane moves; a near object in the foreground (a head, a stack,
       a chair back) for depth.
   - `sets.ts`: `SETS[place] = (c) => hooks` - builds that place (into `c.root`, glows into `c.glow`, water via
     `c.water(geo)`), returns hooks `{clouds, streak, indoor, fog, update}`; `both(a, b)` stacks parts in one place.
     Only places some shot uses are built. Keep places far apart (x = +-3000, z = +-8000).
   - `lights.ts`: LIGHTS plus the LOOK sky/water/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: core helpers (materials, Batch, sight-line culling of anything blocking a camera, vegetation, Kenney
     props) + the library sets / new builders appended below the marker.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, sun/moon discs, stars, clouds, water shader, per-frame posing, light
     sun frozen per shot and camera-relative. Calls the sets; no scenery of its own.
6. **Characters.**
   - `toon.ts`: the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
     `setShadowTails([-0.8, 0.8])` in `stage()` = two shadows per character (two light sources).
   - `cardshade.ts`: cards lit by the scene light, no emissive.
7. **Post** (`Bridge.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`).
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound** (copy `templates/audio_storybook/`: timeline.py, sfx.py (cue list only), music.py to rewrite, mix_ll.py targets to adjust; sfx_lib.py, mix.py, sfx_gen.py, instruments.py, dsp.py shared).
   - Event table → synthesized SFX plus an original score ducked under the voice.
   - **No dead air:** music + SFX in speech gaps ~5-6 dB under the voice (`MUSIC_TARGET` ~-7 LU per section in
     mix_ll.py; was -10, which measured 8-9 dB under). Check with `retention_stats.py` (step 10).
   - **Sound marks the story:** a soft whoosh only on real cuts and big camera flights (not on every composition: Atlas
     2's ~42 whooshes added to the busyness), foley for every noun that gets its own picture
     (clang, splash, tick, creak), a 0.3-0.5 s music drop-out right before the main reveal (`DROPS = [(t0, t1)]` in
     mix_ll.py), a sting on the payoff, the music ending on the final image (no tail after the last word + ~0.5 s; refs 0.02-0.41 s).
   - Comedy timing: a beat of near-silence (music dipped) before a punchline, a small comic sfx on it.
   - Weather: `rain_bed(dur, r, heavy, roof, near)` as a bed for a rainy scene (roof > 0 indoors);
     `thunder_crack(r, dist)` cued on the FLASH frame for a strike you see (dist 0 overhead .. 1 far), optionally
     `lightning_zap` 0-2 f before it for a cartoon bolt; `rumble` only for an unseen, far-off storm (2026-11-21).
   - **Loudness: master at -14 LUFS integrated, true peak <= -1.0 dBTP** (YouTube / TikTok / Reels playback level;
     `TARGET_LUFS` in mix.py / mix_ll.py, limiter ceiling -1.2). Shorts up to Canute were -15 (1 dB quieter than
     the feed). short_qa.py prints the measured value next to the target.
   - Output: mix.wav (48 kHz, exact length), stems and cues.md.
   - Lock the picture's time constants before the sound is made. Any later timing change means re-running the sound.
9. **Look checks.** Run `node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`.
   - **Look v3 gate first:** render 4-6 representative stills at SCALE 1 (half-size stills thin the world ink to
     ~1 px), run `python scripts/look_stats.py out/<name>/look` and put one still beside a reference frame of the same
     kind (`references/LOOK_V3.md`). Fix every CHECK (chroma / detail / p98) before the contact-sheet rounds.
   - **Band pass first (text only, no images viewed):** render the round-1 frame list once with
     `PROPS='{"captions":false,"band":true}'`. The script ends with a `CAPTION BAND:` summary listing every frame where a
     character face or a solid prop card sits in y 1280-1520 (`f1260 shot 12: prop basket y=1210-1382`). Fix every line
     and re-run until it says `CAPTION BAND: clear`, THEN build the contact sheet from those stills (they carry the pink
     band guide, so the verifier sees the band too). Atlas spent verifier rounds 2 and 3 on exactly this.
   - Set `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx` to render a sandbox copy.
   - Make side-by-sides against reference frames with `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
   - Send them to an Opus max verifier: 1-3 images, a ≤200-word verdict.
   - Budget: round 1 = one still per camera key for the whole film, viewed as ONE contact sheet
     (`python scripts/sheet.py out/<name>/r1 x_ sheet.jpg 6`), never single full-size stills one by one. Fix everything
     it shows in one patch, re-render only the changed frames as one sheet, then send the verifier ONE set of sheets.
     Apply its fixes in one batch, then render the final. Each image viewed stays in the conversation for good.
   - **Self-check before every re-verify** (Yasuke: two verifier passes + a 2K re-render were spent on half-done
     fixes). After a fix batch, view the re-rendered sheet yourself and tick each verifier item against its frame:
     fixed / not fixed. Fix the "not fixed" ones again first; send the verifier only a sheet where every item visibly
     passes. The Opus max verifier still checks every round; it just stops seeing problems you could have caught.
   - **Leak check (reveal plan):** the verifier brief lists each secret with its reveal frame; for the stills before
     it, "can you tell who/what X is yet?" must be NO, and for the reveal still YES. Also: "is the hero readable in
     frame 1?", "does each still show what its sentence says (the sync table)?", "is the key object big at phone
     size?", "are the characters acting, not just standing?", "is anything on screen before the narration reaches it?".
   - **Motion check (stills cannot show it; Napoleon 2026-11-20, the user caught both after delivery):** for every
     shot where the narration says someone moves (runs, flees, drives off, walks in), render a strip of 6-8 frames across
     that shot (`ffmpeg ... select='between(n,a,b)*not(mod(n,k))',tile=8x1`) and check the character's POSITION changes
     against the set, not only the walk cycle: a walk/run cycle at a fixed spot (or a camera locked on the runner) reads
     as running on the spot. Let the camera follow at ~55-70 % of the speed, keep the legs clear of crowds/swarms.
   - **See-through check:** a character placed BEHIND a card with a cut-out (carriage window, doorway, window frame)
     shows every part that the card does not cover: legs under a coach body, between wheels. Draw such a character as
     a clipped fx bust (bodyFront into a 2x canvas with `g.rect(...); g.clip()` above the hidden line), never a full card.
   - The verifier brief always asks: "does any character show body parts through gaps / under vehicles?" and gets the
     motion strips as a second image.
   - **2K close-up check (Canute 2026-11-20, the user caught a card edge through the king's face after delivery):** the
     contact sheets are ~270x480 per still, too small to show a 10-20 px strip. For every composition where a face is
     >= ~30 % of the frame width, render ONE 2K still (`COMP=<Name>Short2K`, scale 0.5) and view a face crop
     (`ffmpeg -i still.jpg -vf crop=...`); check edges of cards BEHIND the head (thrones, doors, signs), hair/hat cut
     lines, beard corners and anything poking past the head outline. Big faces (the pacing rules) magnify every overlap.
   - **Continuity pass before the final render:** walk the shots in story order and list what each character
     wears and holds and the state of key objects (door up/down, gift given or not, sword drawn, day/night). Anything
     that appears before the story gives it (Yasuke's sword before the gift) is a bug: fix it before rendering 2K.
10. **Final render.**
    - `. "$HOME/.claude/skills/cartoon-3d-short/env.sh" && cd "$STUDIO" && npx remotion render src/index.ts <Name>Short2K out/<name>/video.mp4 --codec h264 --crf 16 --gl angle`
      (native 1440x2560 composition; the ThreeCanvas takes its size from `useVideoConfig()`). ~5 min for 70 s.
    - Before QA, write the shot table: `python scripts/shots_table.py src/videos/<name>/story.ts <name>`.
    - Mux with `-map 0:v:0 -map 1:a:0` (Remotion writes a silent audio track).
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Retention numbers: `python scripts/retention_stats.py out/<name>/final.mp4 --words <name>/voice/words.json
      --story src/videos/<name>/story.ts --payoff "<first words of the payoff line>"` (also run it on voice.wav right
      after step 3, and on the story.ts before the first stills; add `--labels src/videos/<name>/labels_data.ts`).
      Targets: 3.3-3.9 words/s; articulation <= 4.8 w/s in the first 5 s (aim ~4.2) and 3.6-4.4 overall; words per
      sentence mean >= 9 (aim 10-15); <= 20 % of sentences at >= 5 w/s; sentence-to-sentence pitch spread <= 3.5 st (a
      rough guard); <= 8 pauses > 0.35 s per minute; hard cuts <= 6 per minute (story.ts plan and the video); median
      beat spacing median >= 2.0 s with <= 3 under 1.2 s; camera big moves 18-32/min, median travel >= 250 px, median
      length 28-60 f, moving >= 55 % of frames (camstats.py, run inside retention_stats on a video); <= 3 label
      cards; bed in gaps 4-7 dB under the voice; payoff at 60-90 % (aim ~75); <= 0.6 s after the last word.
      Camera numbers come from a grain-free proxy: `npx remotion render src/index.ts <Name>Short out/<name>/camproxy.mp4
      --scale 0.5 --crf 20 --gl angle --props '{"captions":false,"labels":false,"paper":false}'` then
      `python scripts/camstats.py out/<name>/camproxy.mp4` (or retention_stats on it). If big moves are few or short,
      add beats on the sentence nouns (purposeful moves), never nudges. The 4 references pass every speech and picture check; Atlas 2 fails
      first-5-s articulation, sentence length, fast sentences, cuts (23 vs 1-2), holds (median 1.27 s) and labels (9).
      It prints PASS / CHECK per line; fix every CHECK or note why it stays. Numbers support the sync table and the
      verifier, they never replace them: Atlas 2 passed the old checks and still felt rushed.
    - Look gate on the final: `python scripts/look_stats.py out/<name>/final.mp4` (all PASS, or a stated reason).
    - Fix anything it finds, then run a deep Opus audit.
    - Spot-check 3 frames of the final for captions in sync with the voice and not covering a face, and every
      label's frame for spelling, facts and overlap.
11. **Thumbnail** (after the final mp4 passes QA; ~2 min). One simple cover image for YouTube Shorts / TikTok /
    Instagram Reels: one strong story frame + 2-4 big words.
    - **Pick the frame** from the shot table: the key character's face (clear expression) WITH the story's key object,
      bright light preferred over night, no crossfade. Never a frame from final.mp4 (captions and labels are burned in).
    - **Render it clean at 2K:** `COMP=<Name>Short2K PROPS='{"captions":false,"labels":false}' node scripts/bridge-stills.mjs out/<name>/thumb/still_ <frame> 1`
      (bridge-stills writes jpeg q88; fine as a source).
    - **Title:** 2-4 words that tease the promise without repeating the hook line word for word ("74 MEN|1 BRIDGE",
      "PUSH IT|FOREVER"); `|` = line break, the accent word turns yellow. Optional `--kicker` tag (<= 16 chars):
      "TRUE STORY", "GREEK MYTH", "JAPAN, 1581". English, spelling and facts as exact as the labels.
    - **Compose:** `python scripts/thumbnail.py out/<name>/thumb/still_<frame>.jpg out/<name>/thumb --title "..." [--accent 2]
      [--kicker "..."] [--pos top|bottom] [--zoom 1.15 --focus 0.5,0.45]`. Writes thumb_9x16.jpg (1080x1920, < 2 MB),
      thumb_3x4.jpg (Instagram grid crop), thumb_1x1.jpg and thumb_check.jpg. It boosts colour a little, adds a
      vignette and a soft dark band behind the title, fits the title inside the area every platform shows (x 90-930,
      y 470-1450: inside the 1:1 and 3:4 crops, clear of the right-side buttons and the bottom username/caption area).
    - **Self-check `thumb_check.jpg`** (one image): the title covers no face and not the key object (else `--pos`
      the other way or `--zoom/--focus`), reads in the 110 px-wide copy, nothing important in the shaded UI zones,
      the subject still in the 1:1 crop (cyan lines). One re-run at most; no verifier pass needed for the thumbnail.
12. **Post text** (`out/<name>/POST.md`, ~1 min, no script needed): copy the format of `templates/POST_example.md`
    and rewrite every line for the new story.
    - `# <Video name>` (the short's title), then length + files, then one section each for YouTube Shorts (title
      <= 100 chars, aim 40-60, key words first, `#shorts`; 1-3 sentence description), TikTok (caption whose first
      125 chars carry the hook) and Instagram Reels (2-line caption).
    - Each platform gets 3-5 hashtags, broad -> specific (topic, place/era, `#animation`/`#animatedshorts`).
      0-2 emoji, no emoji walls, no "comment below" filler.
    - The text leads with the story's surprising fact or question, the same promise as the video's hook and
      thumbnail. It never promises more than the video pays off and never spoils the callback twist.
    - Facts, numbers, names and spellings match SCRIPT.md exactly. Keep the same certainty: "legend says" stays
      "legend says". Never name the style-reference channel.
    - Notes: the hook line, "sources: top of SCRIPT.md", and the thumbnail's source frame number (for platforms that
      only let you pick a frame as the cover).
13. **Deliver into the library.** Copy `final.mp4` (the muxed 1440x2560 file), `captions.srt`, `SCRIPT.md`,
    `POST.md`, `thumb_9x16.jpg`, `thumb_3x4.jpg`, `thumb_1x1.jpg` into `$SHORTS_LIBRARY/<name>/` (exactly these
    names; the folder name is the short's short id, e.g. `garde`). Then SendUserFile them from there. Write the
    lessons of the short into this SKILL.md / templates / library (not an agent memory). When the user confirms the
    short is done, ask before deleting its big work files (`$STUDIO/out/<name>/` renders, `.cache/remotion-tmp`). Upload hint for the user: TikTok and Instagram take the image as the cover ("Edit cover" -> upload);
    where a platform only lets you pick a frame of the video, choose the thumbnail's source frame.

## Look v3: bright, saturated, dense, glossy (2026-11-24, from the five reference shorts; in `templates/storybook/`)
The user rejected the Liechtenstein and castle-toilet shorts as "dim and bad looking, not good enough". Look v2 (dark
nights, no world ink, paper grain, pastel) is RETIRED. Full study with numbers: `references/LOOK_V3.md`. Test bench:
`templates/lookdev/` (README: three shots - lamp-lit hall, sunny deck, blue night deck - that the template reproduces
pixel for pixel). Every new short starts from these rules; none of them is optional.
- **Gate:** `python scripts/look_stats.py <stills dir or video>` on the round-1 stills (rendered at SCALE 1) and on the
  final: lum .33-.62, chroma >= .22, detail >= .058, p98 >= .90, dark <= .08. The rejected shorts had chroma .14-.16
  and detail .040-.047. A CHECK on chroma or detail blocks the final render.
- **Characters** (`toon.ts`): near-white skin (`SKIN #faf7f3`; peach only on purpose), big heads (~1/3 of the height:
  BUILD adult a 134, torso 1.02, legs 0.98), bold dark outline, simple flat outfit blocks with one or two strong
  details. Place them BIG: faces 15-35 % of the frame width in dialogue. They take the light (warm indoors, lavender-
  blue at night: cardshade tint, `CARD_K` night settings in world.ts).
- **World ink ON** (`ink.ts`): #120e16, strength 1.0, 5 -> 2.2 px, creases .55. Judge it on FULL-SIZE stills only.
- **Surfaces** (`illus.ts`): illustrated textures with ink seams, highlight edges and dense patterns: `planksT,
  blocksT, damaskT, carpetT, tilesT, tuftedT, roseT, bannerT, stripesT`. Large surfaces deep / slightly muted, accents
  fully saturated. Old library sets use the low-contrast `paint.ts` textures: swap them for `illus.ts` ones.
- **Hero props glossy** (`illus.ts metalM(color)` gold / brass / copper / iron, `glazeM(color)` ceramic / glass):
  painted toon-ramp matcaps (flat bands + one sharp highlight), tinted per light every frame (`tintMatcaps`), each with
  an ink outline shell `inkHull(mesh, 0.012-0.05)` beside it. Every named object the camera pushes into is one.
- **Light presets** (`lights.ts`): `day` (warm key, light neutral shade .62/.60/.66 - a bluer shade turns reds
  magenta - deep blue sky #1a56c4 -> #cfe3fa, cyan sea), `interior` (NEW: dim ambient, the room lit by PointLights
  that the world shader now adds - `shade.ts`; add one warm `PointLight` (#ffb45a) per candle / torch / lamp / window,
  intensity ~4-6, distance 3-5.5, decay 2 - SHORT reach, so each makes a local pool; long-reach lamps flood the room
  evenly and it reads flat; heavier vignette `GRADE_INTERIOR`), `night` (BRIGHT blue: sky #18298a -> #6a88e6, a
  moon in frame via `DISCS`, lavender faces, warm windows as accents; median luma ~.3), `golden` (sunset).
- **Dressing kit** (`kit.ts`, core): modelled set dressing, each a Group with its base at y 0 - `column` (base,
  shaft, capital), `balustrade`, `bust` on a plinth, `picture` (gilt frame + painted canvas), `bookshelf`, `feastTable`
  (runner, goblets, plates), `crate`, `barrel`, `sack`, `ropeCoil`, `plant`, `rope(a, b)` rigging, and light sources
  that put their flame / glass + a bloom halo in the place's glow group: `flame`, `candle`, `candelabra`, `torch`,
  `lantern`. Build every place from these first; write new props only for the story's own objects (and add reusable
  ones to kit.ts). The `glow` group shows at golden / night / interior / under (world.ts).
- **Density:** 15-40 distinct dressing objects in view in every set (candles, banners, curtains, carpets, crates,
  barrels, ropes, lamps, plants, clocks, posters, signs); no bare walls or empty floors; a ceiling on every interior;
  readable in-world signs carry story text. Build a dressing kit per place (and add it to the library).
- **Surface pass (built in, nothing to call):** contact AO from the ink pass's world depth / normals (`ink.ts`
  aoRadius 1.3 m, aoGain 6, aoStrength .85: corners, joins, under props), world-space tone variation +-15 % and a
  grime band at wall feet (`shade.ts surfVar`), painted wear in every `illus.ts` texture (`wear()`), and `paintedT(base)`
  chipped paint for hulls / rails / doors. Never leave a large surface as one clean flat colour. Debug the AO with
  `PROPS='{"inkDebug":3}'`. Textures must stay seeded (`ctex`'s `r`, never Math.random): every render process must
  paint identical textures.
- **Post:** bloom .9 / threshold .85 on every emissive (candles, bulbs, moon, windows); grade sat 1.05-1.1, day
  vignette .1, interior .34; paper grain OFF (`PROPS paper:true` only on purpose); DOF on every close / medium shot.
- **Camera:** characters big, lens at chest height or low, foreground objects near the lens in blur, inserts that fill
  the frame with one glossy hero prop, spectacular wides (crane over a city, a castle in its valley, a ship in a wave).

## Look targets still in force (camera, depth, animation)
- **Depth:** DOF on ~1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes; wides stay sharp.
  Fog = horizon colour. Film grain OFF (it quadruples the file size).
- **Camera:** hard cuts only on real jumps; otherwise smootherstep glides; every hold pushes in 0.15-0.35 %/f (0.6 %/f
  on punch words); rolls of 4-5 deg (in RADIANS in story.ts: 0.07); no hand-held float; impact shakes flip sign every
  frame and decay over 7 f.
- **Characters:** stick limbs ~0.055 head width, ink-dot hands, bean head h/w ~0.93, walk bob 3-7 %, lean 1-7 deg,
  blinks every 0.5-2.3 s (4 f). Golden rim light inner only (never an offset outer copy).

## Look-match loop (how the first look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting, outlines, grade), each writing numbers, not adjectives, to `references/reports/<topic>.md`. Shared brief: `compare/CONTEXT.md`. Reports are the source of truth for every agent after.
2. **Sandboxes, one owner per file.** Copy the project folder to `src/videos/<name>_{cam,world,mat,char,post}` with entries `src/sandboxes/<n>/index.tsx` (same `index.tsx` as main, only the import path changed). Ownership used for the bridge:
   - cam: story.ts (camera keys, cuts, kicks, DOF table, foreground props)
   - world: world.ts, lights.ts, shade.ts, grade.ts (sun, sky, fog, river, colour, grade)
   - mat: paint.ts, build.ts (painted textures, buildings, props)
   - char: toon.ts, cast.ts, cardshade.ts (character drawing, posing, card lighting, fx cards)
   - post: ink.ts, Bridge.tsx, lensblur.ts (outline pass, composer, lens blur, bloom)
   Agents only edit their own files in their own sandbox and render stills with `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<name>/<n>/x_ <frames> 0.5`.
3. **Merge** with `python scripts/bridge_merge.py [cam,world,mat,char,post]` (backs main up to `backup/bridge_<time>/`, copies owned files only). Then `npx tsc --noEmit` (filter to the project folder), then **re-sync every sandbox from main** (`cp -f src/videos/<name>/* src/videos/<name>_<n>/`) before the next round.
4. **Verify** with a fresh Opus max agent: side-by-side sheets (`python scripts/sbs_sheet.py out.jpg --ours a b --ref r1 r2`), score each area out of 10 (colour day / golden, lighting, ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the file owner and resume that owner's agent with SendMessage (keeps its context). Bridge scores: round 1 5/3/4/5/4/7/4/6 → round 2 5/4/5/6/4/7/6/6 → round 3 see notes.
5. Contracts between owners live in exported constants (e.g. `NOINK` layer from ink.ts, `dofAt`/`FOREGROUND` from story.ts, `LIGHTS`/`LOOK` from lights.ts). Changing a contract means telling every owner that reads it.

## Gotchas
- `scripts/bridge-stills.mjs` in the ready project renders composition `$COMP` (default `LloronaShort`): set
  `COMP=<Name>Short` for a new short. `PROPS='{"post":{...}}'` passes A/B toggles; `DEBUG=1` prints every browser log.
- Sight-line culling removes every house a camera ray passes through, from ANY shot in the same place: a low camera
  aimed across rooftops empties that street for every other shot too. Aim low cameras at points above the roofs.
- A see-through card that does not write depth (`soft`) gets the depth of whatever is BEHIND it, so the lens blur
  smears it like background: a main character (the ghost) must use the depth-writing see-through material
  (`see: true` in FxPlace / `Fx.see`). `soft` is only for halos, mist, rings and other effects meant to be soft.
  When a second character stands behind the focused one at the end beat, focus between them with low blur.
- `<primitive dispose={null}>` overwrites the object's `dispose` with null: guard any cleanup call (`dispose?.()`).
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` into `remotion-webpack-bundle-*` in the temp folder and never deletes
  it (60+ GB filled a drive during the bridge passes; a render died with ENOSPC). env.sh / bridge-stills.mjs put it in
  `$STUDIO/.cache/remotion-tmp`, never the system temp. It still fills (~500 folders / 110 GB after 4 bridge rounds):
  when nothing is rendering, ask the user, then delete its `remotion-webpack-bundle-*` and
  `puppeteer_dev_chrome_profile-*` folders. `du -sh "$STUDIO/.cache"` shows the size.
- In JS strings use forward slashes in paths, never backslashes (`\r` becomes a carriage return).
- `--gl angle` is the GL backend for renders and stills (bridge-stills: env `REMOTION_GL` overrides it). If a machine
  renders black or fails on it, try `--gl swangle` once and write the result for that OS here.
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- Sub-agents may not be able to write files: ask them for a ≤150-word final message and save it yourself to `out/<name>/<n>/REPORT.md`.
- (2026-11-26) `studio/scripts` is a link into the skill, and Node resolves imports from a script's REAL path:
  a .mjs script that imports a project package must load it with `createRequire(path.join(process.cwd(),
  "package.json"))` like bridge-stills.mjs does, and be run from `$STUDIO`.
- (2026-11-26) `tsc` is clean on the core template (TypeScript 7.0.2). EffectComposer takes no `null` children: pass
  optional passes as a filtered array (Bridge.tsx). Keep `tsc` at zero errors so "fix only what tsc reports" means
  the short's own code.
- Sub-agents get the same folder rule: put "source env.sh, work only in $STUDIO and $SHORTS_LIBRARY" in every brief.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

- timeline.py needs a `SHOTS` dict `{id: (a, b, light, place)}` (mix.py builds its report from it).
- The picture is portrait: the HORIZONTAL field of view is only ~0.56 x the vertical one (fov 40 -> ~23 deg wide). Size
  big subjects (a planet, a bed card, a group) by the horizontal FOV, or they get cut at both sides.
- A low camera on the town quay (|z| ~ 29-30.5) sits right behind the quay cope/parapet (`D0 .. D0+0.75` at |z| 30-30.5):
  the stone fills the bottom of the frame. Keep low lenses at |z| >= 30.7 (on the quay) or above D0 + 1.2.
- Billboard characters sitting on a bench must stand in FRONT of the seat box (z + 0.3), or the seat edge cuts their body.
- Extra sun/moon discs: Two Suns added camera-relative discs per shot (`DISCS` in its story.ts, posed in world.ts from
  the current camera's horizontal forward). Do NOT base disc positions on the shot's MEAN forward: a shot with a cut to a
  different direction puts the sun off-screen.

- (Yasuke, 2026-11-17) Billboard cards always face the lens, so a crowd "pushing a door" faces the camera: frame such
  beats from the side with the crowd split left/right (gap in the middle) so the door/subject stays visible.
- (Yasuke) A character in trousers on stick legs reads "spindly" next to robed (`dress`) characters: give every main
  character of a robed culture a `dress` too. Seated `dress` characters now keep the same collar (core toon.ts).
- (Yasuke) Dark skin at night goes near-black under the `night` preset: use a slightly lighter skin tone for night shots.
- (Yasuke) A late shot that needs different light than its neighbour (e.g. a front-lit end shot inside a golden ending):
  split it into its own shot id and set `SUN_SHOT[id] = { az: 160, el: 32 }` (az 180 = sun behind the camera).

- (Sisyphus, 2026-11-17) Camera `roll` in story.ts is in RADIANS (cam.rotateZ): a "4 deg roll" is 0.07, never 4.
- (Sisyphus) New in the core: light `under` (Underworld: plum-red sky, ember key, set glows shown), Outfit `beard`, hats
  `crown` / `laurel` / `hood`, props `clipboard` / `book` / `["bolt", k]` (drawn 2.2x), shrug palms now at shoulder
  height, label `big` (scale factor, for an end card). A real 3D prop moved per shot (the boulder) lives in its set's
  `update` hook, posed from a story.ts function; turn its marked side to the lens per shot (yaw + small spin).
- (Sisyphus) Short format: 35-45 s works with the same pipeline (11 shots, ~135 words); the verifier asked for larger
  hero props at phone size (clipboard, bolt, sweat drops) and two-shots for punchlines: plan them big from the start.

- (Sisyphus, user caught it after delivery) A set that keeps a moving object in a MODULE-LEVEL variable breaks in the
  final render: every crossfade builds a second world, the variable points at the newest copy, and the object vanishes
  from every later shot. Single-frame stills never show it. Keep per-world objects in the builder's own closure. And
  before delivering, scan the FINAL mp4 (every 20th frame as one tile sheet, ffmpeg select + tile) for missing props.
- (Sisyphus) A held prop drawn across the chest reads as "inside the character": hold boards/books out beside the body.

- (Erysichthon, 2026-11-18) Characters behind a table hide their hands (held props: see CHARACTERS.md).
- (Erysichthon) A see-through spirit: draw the body with `bodyFront`, then `destination-in` fill rgba(0,0,0,0.6) on the card
  canvas (whole-card opacity without overlap seams), `see: true`. Keep its glow off red props: the glow turns blood orange.
- (Erysichthon) A gauge/counter must move ONE way to tell its rule (the verifier read a dip as "falling"). Blood = solid deep-red
  teardrops + one wavy trickle; a notch = dark V with a pale rim (a pale wedge with a tail reads as a flag).

- (Atlas, 2026-11-18) The caption band rule bites at every camera: faces AND hero props must sit above y ~1280/1920.
  Now tooled: band defaults in step 4, the `band: true` pass in step 9 (BAND constant + BandGuide in captions.tsx,
  bandCheck in world.ts, summary in bridge-stills.mjs), core `rock()` + `fxRock`, FxPlace `bg` flag.
- (Atlas) Fact-label titles over ~10 characters overflow the card ("TITANOMACHY", "APOLLODORUS"): keep fact titles <= 10.
- (Atlas) A held overhead object = the `lift` pose + an fx card centred at `1.66 * scale + r * 0.9` above the feet (it rests
  on hands and head). New core outfit fields `tie`, `badge`, `stone`; parts library/sets/atlas.ts.txt + characters/atlas_cast.ts.txt.

- (Atlas 2, 2026-11-18: first short made with the retention rules; voice 3.75 w/s, 5 pauses/min, 1.32 s per camera key,
  bed 4.4 dB under, payoff 63 %: every retention_stats line PASS; the user then found it rushed and
  overwhelming: 23 cuts, fragment sentences, a 5 w/s opening. Those checks measured speed, not clarity: see the
  2026-11-19 pacing rules.) No white flash: `FLASH_AT = -1`.
- (Atlas 2) Silhouette a HELD fx card with its holder: draw it with `silhouette(pp, k)` after the drawing (toon.ts export)
  and put `k` in the fx key (`ball|sky|${k}`); `unveil(t, ts)` gives k. A silhouetted (mystery) character walking off should
  walk AWAY from the lens (z decreasing) so it stays in frame; reuse the same lit framing for the callback.
- (Atlas 2) A "follow" camera on a character walking away hides him behind the set's own props (rock, tree): the static
  callback framing read better. Verifier rounds: 1 full sheet + 1 re-check + one self-checked mini-batch.

- (Vasa, 2026-11-19) A long subject (a 40 m ship) in a portrait frame: view it from the bow/stern quarter so it is
  foreshortened, never broadside. Crowds, a second character or a held prop must sit inside the narrow lens cone
  (horizontal FOV ~0.56 x fov): place them from the camera (distance d along the view, lateral <= 0.2 d), not on a grid.
  A camera "on" a moving/rolling object = positions from the object's transform (story.ts `shipPt`) + roll = -object roll.
  New core hat `cavalier`; parts library/sets/vasa.ts.txt (warship, jetty, seabed, museum, diagram) + characters/vasa_cast.ts.txt.
  Underwater = `day` light + far fog + a soft blue tint card 0.6 m in front of the lens (night light was too dark).

- (Penicillin, 2026-11-19) Interior sets: build walls >= 4.5 m tall (sky showed above a 3.2 m wall in high wides). Portrait
  framing crops anyone ~0.7 m off the look axis at 4 m: put two-shot subjects within +-0.5 m of the camera x. A per-beat
  close-up of each half of a pair (two mouse cages) reads far better than one wide. New core prop `hold`; parts
  library/sets/lab.ts.txt + characters/penicillin_cast.ts.txt.

- (Napoleon, 2026-11-20) Cards always face the lens, so a crowd of small animals "running at" someone is shot from the
  side they run AWAY from: use a back view (`fxRabbit` pose `back`) for animals moving away from the lens and a front view
  for those coming toward it (pick the pose per frame from velocity vs the camera; library `napoleon_cast`). Keep a swarm
  BESIDE / BEHIND the hero, never between him and the lens (their faces land in the caption band). A row of props reads
  as a row only from its end (receding), never face-on. A held object needs >= ~15 % of the frame width (verifier: the
  treaty, whips and coin bag were too small); motion arcs (`fxSwish`) make a swing read. A plant can sit small and soft
  in another sentence's shot (the farmer's cart behind the cage doors). A vehicle leaving: the camera follows at ~55 %
  of its speed so it visibly drives off. New core: hats `bicorne` / `bicorne_plume`, prop `["whip", k]`, bigger `scroll`
  with a red seal. Parts: library/sets/napoleon.ts.txt (meadow, road, dog park) + characters/napoleon_cast.ts.txt.

- (Canute, 2026-11-20) A moving water level (rising tide, surge): call `c.water(geo)` and take the mesh it adds
  (`c.root.children[n]` with n = the child count just before) and set its `position.y` in the set's `update` hook from a
  story.ts function (library `canute` beachSet). A sea-side camera must stand IN the water close to the shoreline, or the
  sea never reaches the frame: raise the opening water level so the shoreline sits ~0.5 m from the subject.
- (Canute) Portrait two-shots of a hero + a group: put the camera on the axis through a GAP in the group (two cards
  never sit side by side in a 22-degree-wide frame from the side); a low lens (y ~0.8) keeps a near hero's crown above
  far heads. A jump/leap reads from a high camera (y ~3.8) so the landing feet clear the props in front.
- (Canute) A diagram sphere in space: flat (MeshBasic) colours read better than lit ones; show a stretched ocean bulge
  as an OPAQUE shell placed behind the planet (only the stretched ends show), never a see-through shell over it. Core
  `sit` + `wave` = a seated character with a raised hand.

- (Canute, user caught it after delivery) A prop card standing BEHIND a character (throne back, door frame, sign,
  window) must not have an edge at face height: beside the head that edge reads as a strip sticking out of the face,
  and lined up with a hair or hat edge it slices the face. Make the backdrop prop rise above the head (or end below
  the shoulders). Check every close-up (head >= ~30 % of the frame width) at 2K for edges crossing the head.
  Effect cards (`out.fx`) fully face the camera (they pitch with it) while characters only yaw: under a low camera
  looking up, a tall fx card's top leans TOWARD the lens and can pass in front of a character standing 0.1 m in front
  of it (the throne hid the king's crown spikes). Keep a tall backdrop fx card >= 0.4 m behind the character.
- (Penicillin 2, 2026-11-21, first short with turned cast + word accents) camstats under-reads our interiors: flat painted
  walls and big character cards break its tile tracking (frames "masked" or ~0 px/f during real moves). The final measured
  21 moves/min (26 % moving) while the camera path had ~37 pan/tilt accents/min + pushes. What helped / hurt: accents
  back to back (19 f every 0.65 s) MERGED into one drift and measured fewer moves; use short glides (14 f) with still gaps
  (>= 0.85 s apart); make the lateral part a pan (`accentPan`, `holdOn` uses it), since a truck barely moves the far wall.
  Accents that truck/push toward a near prop carry the lens into it (the dish stack): give such shots pans/tilts only.
  Add textured walls (tiles, posters, shelves) to interiors if the camera numbers must pass.
- (Penicillin 2, 2026-11-21, the user caught it) A wide effect card on a wall (blackboard, calendar, sign) was cut
  diagonally: fx cards turn to face the camera, so under a camera looking up / down the card tilts and its corner goes
  behind the wall. Hang such cards with FxPlace `wall: <yaw>` (fixed facing, 0 = +z) 1-2 cm in front of the wall
  face; keep camera-facing cards for free-standing props only.
- (Rat Tails, 2026-11-22) Small animals as the heroes (rats): draw them big (the verifier called 0.36 m rat cards "specks";
  ~0.5 m side-run cards read at phone size), use the side run cycle whenever the motion is within ~60 deg of across the view
  (cast.ts `rat`, test |cos| < 0.86) and keep them on raised surfaces (a stall, shop counters, a toilet seat) so they stay
  above the caption band. Text on a side wall (a tally board) must be a PORTRAIT card: a landscape board in a narrow tunnel
  cannot be framed whole. A dark interior under the `night` preset stays near-black: use `golden` + warm PointLights
  (intensity ~25, distance 9) every ~3.5 m. A held-object action (pull a weed) must land >= 0.5 s before the next camera
  move starts, or it happens inside the blur. retention_stats counts the commented example lines in labels_data.ts as cards.
- (Emu War, 2026-11-23) Write SCRIPT.md and go straight on: the user does not want to approve scripts. Beats whose
  landings sit < ~1.3 s apart OVERLAP (the next move starts before the last lands: the rabbits insert showed only road):
  check `landing(n+1) - dur(n+1) > landing(n)`. A camera that tracks a moving vehicle (truck chase) carries the cast with
  it, so the camera-only motion blur ghosts them: set `MBLUR.lo` high for such a short. A gun mounted on a vehicle must
  sit above the cab roof or the lens ahead never sees it. Hook with a tall animal + a person in portrait: depth-stack from
  a low lens (y ~0.95), the animal towering at the frame edge near the lens, the person low in the gap; a foreground
  animal seen from behind is a brown blob. retention_stats' first-5-s articulation reads low when words.json merges
  "20" + ",000" into one token (voice_lines measured 4.00 before the merge). New: core `slouch` hat; sfx_lib mg_burst,
  jam_clank, engine, buzz, emu_boom, thumps, stamp; parts sets/emuwar, characters/emuwar_cast, cast/emuwar_helpers.
  (User caught after delivery) A flock that "runs away" straight from the lens only shrinks into a clump (back views,
  9 m/s): make it flee ACROSS the view (side run cycles, dust), pause, then react; keep the herders inside the lens cone.
  Medals / badges on a chest: ~1.2 m up (upper chest, wearer's left = screen right on a front view), only ~0.08 m in front
  of the body card; 1.27 m + 0.17 m toward the lens put them on the collar in close-ups.
## Readability traps the verifier caught (check every new prop/shot for these)
- **The story's key object must be clearly visible in every shot that is about it** (Sisyphus shipped with the boulder
  he pushes not visible). Give every verifier brief a list of "must see" objects per shot and ask it to confirm each.
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.
