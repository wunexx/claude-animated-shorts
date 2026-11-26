# ElevenLabs WEBSITE workflow (2026-11-23: the free plan cannot use Voice Library voices such as Josh through the API,
# so the user generates the narration on elevenlabs.io and downloads it; this script does everything around that).
#   python scripts/el_website.py prep <name>/voice/lines.json
#       checks the hook text and the no-[tags] rule, writes <name>/voice/website_script.txt: ONE paste for the whole
#       narration, one paragraph per story beat (a blank line = ElevenLabs' natural paragraph pause), plus the count.
#   python scripts/el_website.py import <downloaded .mp3/.wav> <name>/voice [--hook-tempo 1.1] [--max-gap 0.45]
#       48 kHz mono voice.wav (ends trimmed, silences longer than --max-gap cut down to it), optional pitch-kept speed-up
#       of the hook sentence only (when the hook line rate reads < 4.0 w/s), words.json via faster-whisper, speech checks.
#       The original download is kept as voice_download.<ext>. Re-run import as often as needed (no credits).
import sys, os, re, json, shutil, argparse, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice_lines as V
from retention_stats import hook_text_rows, speech_rows

SETTINGS_NOTE = ("On elevenlabs.io -> Text to Speech: voice 'Alex - Young American Male', model Eleven v4, default "
                 "settings (speed 1.0). Paste the whole text in one go, generate, listen, download, then run import.")


def prep(lines):
    cfg = json.load(open(lines, encoding="utf-8"))
    L = cfg["lines"]
    tagged = [x["text"] for x in L if re.search(r"\[[^\]]+\]", x["text"])]
    if tagged:
        raise SystemExit("remove the [tags] (user rule): " + " | ".join(tagged))
    hook = next((x["text"] for x in L if x.get("mood") == "hook"), L[0]["text"])
    for name, val, ok, target in hook_text_rows(hook):
        print(f"{'PASS ' if ok else 'CHECK'} {name:<34} {val:<28} target {target}")
    text = "\n\n".join(x["text"].replace("...", ",").strip() for x in L)
    out = os.path.join(os.path.dirname(lines), "website_script.txt")
    open(out, "w", encoding="utf-8").write(text + "\n")
    print(f"\nwrote {out}: {len(text)} characters, {len(text.split())} words, {len(L)} paragraphs")
    print(SETTINGS_NOTE)


def wav48(y):
    pk = np.abs(y).max()
    y = y / pk * 0.89 if pk > 0 else y
    return (np.clip(y, -1, 1) * 32767).astype("<i2")


def write_wav(path, y):
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(V.SR); w.writeframes(wav48(y).tobytes())


def tempo(y, k):
    """pitch-preserving speed change through ffmpeg atempo"""
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(V.SR), "-ac", "1", "-i", "-",
                        "-af", f"atempo={k}", "-f", "f32le", "-"], input=y.astype(np.float32).tobytes(), capture_output=True)
    return np.frombuffer(p.stdout, np.float32).copy()


def imp(src, outdir, hook_tempo, max_gap, all_tempo=0.0):
    os.makedirs(outdir, exist_ok=True)
    ext = os.path.splitext(src)[1].lower() or ".mp3"
    keep = os.path.join(outdir, "voice_download" + ext)
    if os.path.abspath(src) != os.path.abspath(keep):
        shutil.copyfile(src, keep)
    y = V.trim(V.decode(keep))
    y = V.squeeze(y, gmax=max_gap, gto=max_gap)
    if all_tempo and abs(all_tempo - 1) > 1e-3:
        y = tempo(y, all_tempo)
        print(f"whole take sped up x{all_tempo} (pitch kept)")
    if hook_tempo and abs(hook_tempo - 1) > 1e-3:
        W = V.whisper_words(y)
        end = next((w["e"] for w in W if w["w"].rstrip().endswith((".", "?", "!"))), None)
        if end is None:
            raise SystemExit("could not find the end of the hook sentence")
        nxt = next((w["s"] for w in W if w["s"] > end), end + 0.2)
        cut = int((end + min(0.08, (nxt - end) / 2)) * V.SR)
        y = np.concatenate([tempo(y[:cut], hook_tempo), y[cut:]])
        print(f"hook sentence (0-{end:.2f} s) sped up x{hook_tempo}")
    wav = os.path.join(outdir, "voice.wav")
    write_wav(wav, y)
    print(f"voice.wav {len(y) / V.SR:.2f} s")
    W = V.whisper_words(y)
    json.dump(W, open(os.path.join(outdir, "words.json"), "w", encoding="utf-8"))
    R, long, fast = speech_rows(W)
    print(f"words.json {len(W)} words")
    for name, val, ok, target in R:
        print(f"{'PASS ' if ok else 'CHECK'} {name:<28} {val:<32} target {target}")
    if long:
        print("long pauses at:", long)
    if fast:
        print("sentences >= 5 w/s:", " | ".join(" ".join(w["w"] for w in s_) for s_ in fast))
    print("heard:", " ".join(w["w"] for w in W))
    print("Hand-check words.json spelling (numbers, names) before captions.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["prep", "import"])
    ap.add_argument("a")
    ap.add_argument("b", nargs="?")
    ap.add_argument("--hook-tempo", type=float, default=0.0)
    ap.add_argument("--max-gap", type=float, default=0.3)
    ap.add_argument("--tempo", type=float, default=0.0, help="pitch-kept speed-up of the whole take (Josh reads ~2.9 w/s)")
    x = ap.parse_args()
    if x.cmd == "prep":
        prep(x.a)
    else:
        imp(x.a, x.b, x.hook_tempo, x.max_gap, x.tempo)
