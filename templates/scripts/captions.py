# Captions from the voice word timings.
#   python scripts/captions.py <name>/voice/words.json src/videos/<name>/captions_data.ts out/<name>/captions.srt
# words.json = [{"w": "Kyoto", "s": 1.74, "e": 1.94}, ...] (seconds, voice starts at frame 0).
# Writes captions_data.ts (burned-in captions, read by captions.tsx) and an .srt to upload next to the video.
# Groups words into short chunks: <= MAX_WORDS words / <= MAX_CHARS characters, a new chunk after . ! ? : ; and
# after a comma or a pause > GAP s. A chunk stays up until the next one starts (at most HOLD s after its last word).
import json, sys

FPS = 30
MAX_WORDS, MAX_CHARS, GAP, HOLD = 3, 18, 0.35, 0.6


def chunks(words):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        text = " ".join(x["w"] for x in cur)
        end = w["w"].rstrip('"\')]')[-1:] in ".!?:;,"
        brk = (nxt is None or end or len(cur) >= MAX_WORDS or nxt["s"] - w["e"] > GAP
               or len(text) + 1 + len(nxt["w"]) > MAX_CHARS)
        if brk:
            out.append(cur)
            cur = []
    return out


def clean(w):
    # drop trailing commas/periods (captions read cleaner); keep ? ! and inner punctuation
    return w.rstrip(",.;:") or w


def main(src, ts_out, srt_out):
    words = [w for w in json.load(open(src, encoding="utf-8")) if w["w"].strip()]
    groups = chunks(words)
    caps = []
    for k, g in enumerate(groups):
        a = g[0]["s"]
        nxt = groups[k + 1][0]["s"] if k + 1 < len(groups) else None
        b = g[-1]["e"] + HOLD if nxt is None else min(nxt, g[-1]["e"] + HOLD)
        caps.append(dict(a=a, b=max(b, g[-1]["e"]), words=[dict(w=clean(w["w"]), a=w["s"], b=w["e"]) for w in g]))

    fr = lambda t: round(t * FPS)
    lines = ["// GENERATED (captions_data.ts) by scripts/captions.py from words.json: do not edit by hand, re-run the script.",
             "export type CapWord = { w: string; a: number; b: number };",
             "export const CAPTIONS: { a: number; b: number; words: CapWord[] }[] = ["]
    for c in caps:
        ws = ", ".join(f'{{ w: {json.dumps(w["w"])}, a: {fr(w["a"])}, b: {fr(w["b"])} }}' for w in c["words"])
        lines.append(f'  {{ a: {fr(c["a"])}, b: {fr(c["b"])}, words: [{ws}] }},')
    lines.append("];\n")
    open(ts_out, "w", encoding="utf-8").write("\n".join(lines))

    def ts(t):
        ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
        return f"{h:02}:{m:02}:{s:02},{ms:03}"
    with open(srt_out, "w", encoding="utf-8") as fh:
        for n, c in enumerate(caps, 1):
            fh.write(f'{n}\n{ts(c["a"])} --> {ts(c["b"])}\n{" ".join(w["w"] for w in c["words"])}\n\n')
    print(f"{len(caps)} captions, {len(words)} words -> {ts_out}, {srt_out}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("usage: captions.py words.json captions_data.ts captions.srt")
    main(*sys.argv[1:])
