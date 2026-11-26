# Retention + pacing numbers for a short (SKILL.md steps 3, 4c and 10).
#   python scripts/retention_stats.py out/<name>/final.mp4 --words <name>/voice/words.json --story src/videos/<name>/story.ts \
#          --labels src/videos/<name>/labels_data.ts --payoff "You see, every"
#   python scripts/retention_stats.py <name>/voice/voice.wav --words <name>/voice/words.json      (voice only)
#   python scripts/retention_stats.py x.wav --story src/videos/<name>/story.ts                     (plan only: cuts + holds)
#   python scripts/retention_stats.py --hook "<hook A>" "<hook B>" ...       (hook text only, before any voice; exit 1 on CHECK)
# Without --words it transcribes with faster-whisper small.en. Prints PASS / CHECK per target.
# Calibration (2026-11-19 pacing study, out/refstudy2/PACING_STUDY.md: 4 references R1-R4 vs Atlas 2):
#   articulation first 5 s: R 3.4-4.6 vs 5.1 | overall: R 3.75-4.39 vs 4.53 | words/sentence: R 9.1-15.0 vs 7.6
#   sentences spoken >= 5 w/s: R 0-11 % vs 39 % | sentence-to-sentence pitch spread: R 1.9-3.2 st vs 3.1 (rough: music
#   underneath and whisper sentence splits move it by ~1 st; a loose guard, not a ranking)
#   hard picture cuts (scdet 8): R 1-2 per video vs 23 | label cards: R 0 vs 9
#   camera (camstats.py, 2026-11-21): moving R 60-82 % vs ours 1-20 %; moves R 51-80/min vs ours 0-22
#   (2026-11-18 study) rate 3.36-3.82 w/s, long pauses 0-6/min, bed 4.1-5.9 dB under, payoff 64-81 %, tail <= 0.4 s.
# The numbers support the sync table and the verifier; they never replace them (Atlas 2 passed the old checks and
# still felt rushed).
import sys, re, json, argparse, subprocess, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import skillpaths  # caches + key + library paths
import numpy as np

SR16 = 16000


def audio16(src):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR16), "-f", "f32le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def transcribe(a):
    from faster_whisper import WhisperModel
    m = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(a, word_timestamps=True, language="en")
    return [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words if w.word.strip()]


# ---------------- speech (also used by voice_lines.py) ----------------
def articulation(W, a=0.0, b=1e9):
    """words per second of actual speech (gaps > 0.15 s removed) for words starting in [a, b)"""
    ws = [w for w in W if a <= w["s"] < b]
    if len(ws) < 2:
        return float("nan")
    t = 0.0
    for i, w in enumerate(ws):
        t += w["e"] - w["s"]
        if i + 1 < len(ws):
            g = ws[i + 1]["s"] - w["e"]
            t += g if g <= 0.15 else 0
    return len(ws) / t


def sentences(W):
    out, cur = [], []
    for w in W:
        cur.append(w)
        if re.search(r"[.?!][\"')]*$", w["w"]):
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    return out


# ---------------- hook text (user rule 2026-11-22: the hook never reveals the result or the reason) ----------------
# Outcome / verdict words that gave the story away (Penicillin 2 "...and changed medicine forever", Erysichthon
# "...and still starved to death"). A hit is a CHECK: rewrite with one of the 4 hook patterns (SKILL.md step 2).
SPOILERS = [
    r"\bforever\b", r"\bchanged? (the )?(world|history|medicine|science|everything|war)\b", r"\bsaved?\b",
    r"\bsaving\b", r"\bwon\b", r"\bwins?\b", r"\bnobel\b", r"\bdied\b", r"\bdeath\b", r"\bkilled\b",
    r"\bstarved?\b", r"\bcollapsed?\b", r"\bdestroyed\b", r"\bended (the|a) war\b", r"\bmillions?\b",
    r"\bturned out\b", r"\bwhich is why\b", r"\bthat'?s why\b", r"\bso that\b", r"\bin order to\b",
    r"\band (still|then|ended|became|finally)\b", r"\bfamous\b", r"\bgenius\b", r"\binvented\b", r"\bdiscovered\b",
]
OPENERS = r"^(in \d{3,4}|\d{3,4}|meet |this is |once upon|in (ancient|medieval)|long ago)"
BAIT = r"(you won'?t believe|wait for it|watch (till|until) the end|what happens next|shock)"


def hook_text_rows(text):
    """[(name, value, ok, target)] for a hook line BEFORE any voice: outcome words, openers, bait, length, commas.
    Pattern 2's 'But why?' tag and pattern 4's 'The thing is,' sentence are allowed after the first sentence."""
    first = re.split(r"(?<=[.?!])\s+", text.strip())[0]
    low = first.lower()
    hits = [m.group(0) for p in SPOILERS for m in [re.search(p, low)] if m]
    n = len(re.findall(r"[A-Za-z0-9']+", first))
    tag = text.strip()[len(first):].strip()
    R = [("hook: no result / reason words", ", ".join(hits) or "none", not hits,
          "none: the hook hides the outcome AND the why (Penicillin 2 'changed medicine forever' = no reason to stay)"),
         ("hook: no name/year/place opener", "ok" if not re.search(OPENERS, low) else first.split()[0], not re.search(OPENERS, low), "starts on the act or the fact"),
         ("hook: no generic bait", "ok" if not re.search(BAIT, text.lower()) else "bait", not re.search(BAIT, text.lower()), "no 'you won't believe' etc."),
         ("hook: first sentence length", f"{n} words", 8 <= n <= 16, "8-16 words, one picture"),
         ("hook: commas in first sentence", f"{first.count(',')}", first.count(",") == 0, "0 (a comma adds a ~0.4 s pause)")]
    if tag:
        ok = bool(re.match(r"^(but why\?|the thing is,|you know,)", tag.lower()))
        R.append(("hook: follow-up tag", tag[:40], ok, "'But why?' (P2) or a 'The thing is,' / 'You know,' sentence (P4) in beat 2"))
    return R


def speech_rows(W):
    """[(name, value text, ok, target)] for the speech-only checks"""
    R = []
    span = W[-1]["e"] - W[0]["s"]
    rate = len(W) / span
    R.append(("average speaking rate", f"{rate:.2f} w/s ({len(W)} words)", 3.3 <= rate <= 3.9, "3.3-3.9"))
    a5, aa = articulation(W, 0, 5), articulation(W)
    R.append(("articulation, first 5 s", f"{a5:.2f} w/s of speech", 4.0 <= a5 <= 4.8, "4.0-4.8, aim ~4.2 (refs 3.4-4.6; user 2026-11-19 TWICE: a ~3.4-3.5 hook felt slow)"))
    # the hook line on its own (first sentence): words / (last word end - first word start), and no pause inside it
    H = sentences(W)[0]
    hr = len(H) / max(0.1, H[-1]["e"] - H[0]["s"])
    R.append(("hook line rate", f"{hr:.2f} w/s ({len(H)} words)", 4.0 <= hr <= 4.8, "4.0-4.8 (Penicillin 3.4 at +22 % = too slow; +36 % gave 4.1)"))
    hg = max([H[i + 1]["s"] - H[i]["e"] for i in range(len(H) - 1)] or [0.0])
    R.append(("longest gap inside the hook", f"{hg:.2f} s", hg <= 0.3, "<= 0.3 s (no comma in the hook line: it adds a ~0.4 s pause)"))
    R.append(("articulation, overall", f"{aa:.2f} w/s of speech", 3.6 <= aa <= 4.4, "3.6-4.4"))
    S = sentences(W)
    wps = np.mean([len(s) for s in S])
    R.append(("words per sentence", f"{wps:.1f} mean ({len(S)} sentences)", wps >= 9, ">= 9, aim 10-15 (refs 9.1-15)"))
    fast = [s for s in S if len(s) >= 2 and len(s) / max(0.1, s[-1]["e"] - s[0]["s"]) >= 5.0]
    share = len(fast) / max(1, len(S)) * 100
    R.append(("sentences spoken >= 5 w/s", f"{len(fast)} = {share:.0f} %", share <= 20, "<= 20 % (refs 0-11)"))
    long = [(round(float(W[i]["e"]), 2), round(float(W[i + 1]["s"] - W[i]["e"]), 2)) for i in range(len(W) - 1) if W[i + 1]["s"] - W[i]["e"] > 0.35]
    pm = len(long) / (span / 60)
    R.append(("long pauses (> 0.35 s)", f"{len(long)} = {pm:.1f}/min", pm <= 8, "<= 8/min, at hook/reveal/punch"))
    return R, long, fast


def pitch_spread(au, W):
    """sentence-to-sentence spread (sd, semitones) of the narrator's median pitch; rough with music underneath"""
    from scipy.signal import butter, sosfiltfilt
    x = sosfiltfilt(butter(4, [70, 900], btype="band", fs=SR16, output="sos"), au)
    med = []
    for s in sentences(W):
        seg = x[int(s[0]["s"] * SR16):int(s[-1]["e"] * SR16)]
        f0 = []
        n, hop = 640, 160
        for i in range(0, len(seg) - n, hop):
            f = seg[i:i + n] * np.hanning(n)
            if np.sqrt(np.mean(f * f)) < 0.01:
                continue
            ac = np.correlate(f, f, "full")[n - 1:]
            lo, hi = SR16 // 400, SR16 // 75
            k = lo + np.argmax(ac[lo:hi])
            if ac[k] > 0.45 * ac[0]:
                f0.append(SR16 / k)
        if len(f0) > 10:
            med.append(np.median(f0))
    if len(med) < 3:
        return float("nan")
    med = np.array(med)
    return float((12 * np.log2(med / np.median(med))).std())


# ---------------- picture ----------------
def video_cuts(src, thr=8):
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", src, "-vf", f"scale=180:320,scdet=threshold={thr}:sc_pass=0", "-an", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    return [float(x) for x in re.findall(r"lavfi\.scd\.time: ([\d.]+)", r)]


def plan(story):
    """hard cuts, dissolves and composition holds (s) from story.ts SHOTS / XFADE / CAMS"""
    src = open(story, encoding="utf-8").read()
    fps = int(re.search(r"FPS = (\d+)", src).group(1))
    total = int(re.search(r"TOTAL = (\d+)", src).group(1))
    shots = [(int(i), int(a)) for i, a in re.findall(r"\{ id: (\d+), a: (\d+),", src)]
    xm = re.search(r"XFADE[^=]*= \{([^}]*)\}", src)
    xf = {int(k) for k, _ in re.findall(r"(\d+): (\d+)", xm.group(1))} if xm else set()
    cm = re.search(r"const CAMS[^=]*= \{(.*?)\n\};", src, re.S)
    keys, cutkeys = [], 0
    for m in re.finditer(r"\{ f: (\d+)([^}]*?)(cut: true)?", cm.group(1) if cm else ""):
        keys.append(int(m.group(1)))
    # subject-chain keys (2026-11-21): open0(<frame>, ...) and beat(<word time s>, <dur>, ...) land at at*fps - 2
    wm = re.search(r"export const W = \{(.*?)\};", src, re.S)
    W = {k: float(v) for k, v in re.findall(r"(\w+): ([\d.]+)", wm.group(1))} if wm else {}
    body = cm.group(1) if cm else ""
    keys += [int(x) for x in re.findall(r"open0\((\d+)", body)]
    for expr in re.findall(r"beat\(([^,]+),", body):
        e = re.sub(r"W\.(\w+)", lambda q: str(W.get(q.group(1), "nan")), expr)
        try:
            if re.fullmatch(r"[\d.\s+\-*/()nan]+", e): keys.append(int(round(eval(e) * fps)) - 2)
        except Exception:
            pass
    cutkeys = len(re.findall(r"\{ f: \d+, cut: true", cm.group(1) if cm else ""))
    hard = sum(1 for i, a in shots if a > 0 and i not in xf) + cutkeys
    dis = sum(1 for i, a in shots if a > 0 and i in xf)
    ks = sorted(set(keys))
    holds = np.diff(ks + [total]) / fps
    return total / fps, hard, dis, holds


def db(x):
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9) if len(x) else float("nan")


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == "--hook":  # text-only hook check, no media: --hook "<line>" ["<line>" ...]
        bad = 0
        for h in sys.argv[2:]:
            print(f"HOOK  {h}")
            for n, v, ok, t in hook_text_rows(h):
                bad += not ok
                print(f"  {'PASS ' if ok else 'CHECK'} {n:<34} {v:<28} target {t}")
        sys.exit(1 if bad else 0)
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--words")
    ap.add_argument("--payoff", help="first words of the payoff / explanation line")
    ap.add_argument("--story", help="src/videos/<name>/story.ts: planned cuts and composition holds")
    ap.add_argument("--labels", help="src/videos/<name>/labels_data.ts: label cards")
    ap.add_argument("--camera-only", action="store_true", help="only the camera rows (for a silent grain-free proxy: --props {paper:false})")
    a = ap.parse_args()
    if a.camera_only:
        sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
        import camstats
        cs = camstats.run(a.src)
        out = [("camera big moves (>= 60 px)", f"{cs['big_per_min']}/min", 18 <= cs["big_per_min"] <= 32, "18-32/min (refs 21-28)"),
               ("big move travel (median)", f"{cs['big_travel_med']:.0f} px", cs["big_travel_med"] >= 250, ">= 250 px at 720x1280 (refs 278-441)"),
               ("big move length (median)", f"{cs['big_dur_med']:.0f} f", 28 <= cs["big_dur_med"] <= 60, "28-60 f (refs 35-54)"),
               ("camera moving (>= 2 px/f)", f"{cs['move']} %", cs["move"] >= 55, ">= 55 % (refs 60-82)"),
               ("camera move peak (median)", f"{cs['peak_med']} px/f", 8 <= cs["peak_med"] <= 18, "8-18 px/f (refs 10.5-15.8)")]
        print(f"{a.src}: camera only (grain-free proxy)")
        for n, v, ok, t in out: print(f"{'PASS ' if ok else 'CHECK'} {n:<28} {v:<32} target {t}")
        return
    au = audio16(a.src)
    dur = len(au) / SR16
    W = json.load(open(a.words, encoding="utf-8")) if a.words else transcribe(au)
    W = [w if isinstance(w, dict) else {"s": w[0], "e": w[1], "w": w[2]} for w in W]
    W = [w for w in W if w["w"].strip()]
    rows = []

    def row(name, val, ok, target):
        rows.append(f"{'PASS ' if ok else 'CHECK'} {name:<28} {val:<32} target {target}")

    R, long, fast = speech_rows(W)
    for r in R:
        row(*r)
    ps = pitch_spread(au, W)
    row("pitch spread between sentences", f"{ps:.2f} st", ps <= 3.5, "<= 3.5 st (refs 1.9-3.2; rough)")
    is_video = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=codec_type",
                               "-of", "csv=p=0", a.src], capture_output=True, text=True).stdout.strip() != ""
    if is_video:
        c = video_cuts(a.src)
        pm = len(c) / (dur / 60)
        row("hard picture cuts (video)", f"{len(c)} = {pm:.1f}/min", pm <= 6, "<= 6/min (refs 1-2 per video)")
        sp = np.concatenate([au[int(w["s"] * SR16):int(w["e"] * SR16)] for w in W])
        gp = [au[int(W[i]["e"] * SR16) + 800:int(W[i + 1]["s"] * SR16) - 800] for i in range(len(W) - 1)
              if W[i + 1]["s"] - W[i]["e"] > 0.25]
        gp = [g for g in gp if len(g) > 400]
        if gp:
            under = db(sp) - db(np.concatenate(gp))
            row("bed under voice in gaps", f"{under:.1f} dB ({len(gp)} gaps)", 4 <= under <= 7, "4-7 dB")
        else:
            row("bed under voice in gaps", "no gaps > 0.25 s", True, "4-7 dB")
        # camera motion (camstats.py, 2026-11-21): the references keep the camera gliding ~65 % of the time
        sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
        import camstats
        cs = camstats.run(a.src)
        row("camera moving (>= 2 px/f)", f"{cs['move']} % (hold {cs['hold']} %)", cs["move"] >= 55, ">= 55 % (refs 60-82)")
        row("camera median speed", f"{cs['median']} px/f", 2.5 <= cs["median"] <= 5.5, "2.5-5.5 px/f (refs 3.0-5.0)")
        # purposeful moves (2026-11-21): count big subject-to-subject moves, not speed bumps (accent nudges gamed the old count)
        row("camera big moves (>= 60 px)", f"{cs['big_per_min']}/min", 18 <= cs["big_per_min"] <= 32, "18-32/min (refs 21-28)")
        row("big move travel (median)", f"{cs['big_travel_med']:.0f} px", cs["big_travel_med"] >= 250, ">= 250 px at 720x1280 (refs 278-441)")
        row("big move length (median)", f"{cs['big_dur_med']:.0f} f", 28 <= cs["big_dur_med"] <= 60, "28-60 f (refs 35-54)")
        row("camera move peak (median)", f"{cs['peak_med']} px/f", 8 <= cs["peak_med"] <= 18, "8-18 px/f, gentle (refs 10.5-15.8)")
    if a.story:
        pdur, hard, dis, holds = plan(a.story)
        pm = (hard + dis) / (pdur / 60)
        row("planned cuts + dissolves", f"{hard} cuts + {dis} dissolves = {pm:.1f}/min", pm <= 6, "<= 6/min, only real place/time jumps")
        med, short = float(np.median(holds)), int((holds < 1.2).sum())
        row("beat spacing (CAMS keys)", f"median {med:.2f} s, {short} under 1.2 s ({len(holds)} keys)", med >= 2.0 and short <= 3, "median >= 2.0 s, <= 3 under 1.2 s (refs: a big move every ~2.1-2.9 s)")
    if a.labels:
        n = len(re.findall(r"kind:", open(a.labels, encoding="utf-8").read()))
        row("label cards", f"{n}", n <= 3, "<= 3 (refs 0; prefer in-world signs)")
    if a.payoff:
        toks = [t.lower().strip(",.!?;:'\"") for t in a.payoff.split()]
        ws = [w["w"].lower().strip(",.!?;:'\"") for w in W]
        hit = next((i for i in range(len(ws)) if ws[i:i + len(toks)] == toks), None)
        if hit is None:
            row("payoff position", f"'{a.payoff}' not found", False, "60-90 %, aim ~75")
        else:
            p = W[hit]["s"] / dur * 100
            row("payoff position", f"{p:.0f} % ({W[hit]['s']:.1f} s)", 60 <= p <= 90, "60-90 %, aim ~75 (10 refs 60-89, mean 75.5; 2026-11-22)")
    tail = dur - W[-1]["e"]
    row("after the last word", f"{tail:.2f} s", tail <= 0.6 or not is_video, "<= 0.6 s (12-ref frame study: 0.02-0.41, median 0.2; 2026-11-22)")
    first = W[0]["s"]
    row("first word", f"{first:.2f} s", first <= 0.3, "<= 0.3 s")
    print(f"{a.src}: {dur:.1f} s")
    print("\n".join(rows))
    if long:
        print("long pauses at:", long)
    if fast:
        print("sentences >= 5 w/s:", " | ".join(" ".join(w["w"] for w in s) for s in fast))


if __name__ == "__main__":
    main()
