# Narrator engine (2026-11-23): ElevenLabs API, "engine": "elevenlabs" + "voice_id" + "model" (eleven_v4) + optional
# "settings" {stability, similarity_boost, style}, "seed", "context" (previous/next text, default on), "format".
# Key: env ELEVENLABS_API_KEY or ELEVENLABS_API_KEY= in <library>/.env (skillpaths.py). No [audio tags] in any line (user rule; refused).
# Delivery-map narration (SKILL.md step 3): one clip per story BEAT (2-4 sentences, so the prosody flows as one
# performance; split only for the hook, a punchline, a reveal line or a character line), joined with designed pauses.
#   python scripts/voice_lines.py <name>/voice/lines.json <name>/voice [--no-words]
# lines.json = {"voice": "en-US-AndrewMultilingualNeural", "rate": "+14%", "lines": [{"text", "mood", "pause"?, "voice"?,
#               "rate"?, "pitch"?, "volume"?}, ...]}   (format + example: templates/SCRIPT_example.md)
# 2026-11-19 pacing study: moods change RATE and pauses only (narrator pitch offsets made the read jumpy); sentence
# ends inside a beat keep a natural breath (~0.25 s as whisper measures it); prints the speech checks of retention_stats.py.
# Pauses: the real silence is ~0.1 s longer than planned (soft word tails) and faster-whisper word times add ~0.2 s
# more, so a planned 0.3 s measures ~0.55 s; the targets (and the reference numbers) are in whisper terms.
# Writes: clips/NN.mp3 (cached by text + settings), voice.wav (48 kHz mono 16-bit), words.json ([{i, w, s, e}] from
# faster-whisper small.en, same format as before), lines_timing.json (start/end of every line) and prints the real
# words/s and the long pauses. Silences inside one entry longer than 0.2 s are cut to 0.08 s (edge-tts leaves ~0.4 s at
# full stops); a longer pause goes in "pause" (0.25-0.35 after the hook, before a reveal and before a punchline). Moods are offsets on top of the base rate; per-line fields override.
import sys, os, json, hashlib, subprocess, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import skillpaths  # caches + key + library paths
import numpy as np

SR = 48000
MOODS = {  # rate %, pitch Hz, volume %, default pause after (s, REAL silence: whisper adds ~0.2-0.3 s, so 0.05 measures
           # like the references' ~0.24 s breath). Narrator moods: rate + pause only.
    "neutral":   (0, 0, 0, 0.05),
    "hook":      (20, 0, 0, 0.22),      # brisk: 4.0-4.6 w/s for the hook LINE (was -18, then +8: both ~3.4 w/s, the user
                                        # found Vasa AND Penicillin openings too slow, 2026-11-19; +22 % total = 3.4, +36 % = 4.1).
                                        # Write the hook WITHOUT commas; re-generate until "hook line rate" passes.
    "suspense":  (-8, 0, 0, 0.08),
    "joke":      (0, 0, 0, 0.05),       # the punch in its own entry after a ~0.2 s pause on the setup
    "reveal":    (-10, 0, 0, 0.12),
    "fast":      (8, 0, 0, 0.03),       # lists, chases, rising escalation
    "aside":     (2, 0, -4, 0.05),
    "character": (0, 40, 0, 0.08),      # the narrator pitched up for a quoted line (refs: +5-9 st); or set "voice"
}
PRE = {"reveal": 0.12}  # extra silence BEFORE a reveal when the previous line sets no explicit pause
GAP_MAX, GAP_TO = 0.2, 0.08  # edge-tts leaves ~0.4 s at full stops INSIDE a clip: cut to 0.08 s real (= ~0.25 s in whisper
                             # terms, the references' breath; per line: "keep_gaps")


def pct(v):
    return f"{int(round(v)):+d}%"


def hz(v):
    return f"{int(round(v)):+d}Hz"


def num(s, unit):
    return float(str(s).replace(unit, "")) if s is not None else 0.0


def tts(text, voice, rate, pitch, volume, out):
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        return
    text = text.replace("...", ",").replace("…", ",")
    if rate in ("+0%", "-0%"):
        rate = "+1%"  # avoid an exact +0% (it failed repeatedly on 2026-11-19)
    cmd = [sys.executable, "-m", "edge_tts", "--voice", voice, f"--rate={rate}", f"--pitch={pitch}", f"--volume={volume}",
           "--text", text, "--write-media", out]
    import time
    for k in range(5):  # the service throttles in bursts (NoAudioReceived): back off 2, 4, 8, 16 s
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 1000:
            return
        time.sleep(2 ** (k + 1))
    raise SystemExit(f"edge-tts failed for: {text}\n{r.stderr[-400:]}")


EL_API = "https://api.elevenlabs.io/v1"


def el_key():
    """ElevenLabs API key: env ELEVENLABS_API_KEY, else <library>/.env (never print it)"""
    return skillpaths.elevenlabs_key()


def el_request(method, path, body=None, query="", accept="application/json"):
    """stdlib HTTP call to the ElevenLabs API; returns (status, bytes)"""
    import urllib.request, urllib.error
    req = urllib.request.Request(EL_API + path + query, method=method,
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={"xi-api-key": el_key(), "Content-Type": "application/json", "Accept": accept})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def tts_eleven(text, voice_id, model, settings, out, fmt="mp3_44100_128", seed=None, prev=None, nxt=None):
    """ElevenLabs text-to-speech (2026-11-23: the user switched from Kokoro to ElevenLabs, voice "Josh", model
    eleven_v4). previous_text / next_text carry the prosody across beats; if the model rejects them, retry without.
    Cached like the other clips, so a re-run only pays for changed lines."""
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        return
    import time
    body = {"text": text, "model_id": model, "voice_settings": settings}
    if seed is not None:
        body["seed"] = int(seed)
    if prev:
        body["previous_text"] = prev
    if nxt:
        body["next_text"] = nxt
    for k in range(5):
        st, data = el_request("POST", f"/text-to-speech/{voice_id}", body, f"?output_format={fmt}", "audio/mpeg")
        if st == 200 and len(data) > 1000:
            open(out, "wb").write(data)
            return
        msg = data[:400].decode("utf-8", "replace")
        if st == 400 and ("previous_text" in body or "next_text" in body) and "text" in msg:
            print("  (model refused previous/next text: retrying without)")
            body.pop("previous_text", None); body.pop("next_text", None)
            continue
        if st in (429, 500, 502, 503, 504):
            time.sleep(2 ** (k + 1)); continue
        raise SystemExit(f"ElevenLabs {st} for: {text[:60]}...\n{msg}")
    raise SystemExit(f"ElevenLabs kept failing for: {text[:60]}...")


def atempo(y, k):
    """pitch-preserving speed change (ffmpeg atempo). eleven_v4 IGNORES the API speed setting (tested 2026-11-23:
    speed 0.8 and 1.2 gave 4.87 / 4.94 s for the same line), so pace is set here after the download."""
    if abs(k - 1) < 1e-3:
        return y
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af",
                        f"atempo={k}", "-f", "f32le", "-"], input=y.astype(np.float32).tobytes(), capture_output=True)
    return np.frombuffer(p.stdout, np.float32).copy()


def decode(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def trim(x, db=-42.0, keep=0.02):
    """cut leading/trailing silence (edge-tts pads ~0.1-0.6 s), keep a short natural tail"""
    win = int(0.01 * SR)
    n = len(x) // win
    if n == 0:
        return x
    e = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(1) + 1e-12)
    thr = e.max() * 10 ** (db / 20)
    on = np.where(e > thr)[0]
    if not len(on):
        return x
    a = max(0, on[0] * win - int(keep * SR))
    b = min(len(x), (on[-1] + 1) * win + int(keep * 1.5 * SR))
    y = x[a:b].copy()
    f = int(0.004 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def squeeze(x, db=-40.0, gmax=None, gto=None):
    """shorten silent runs inside a clip longer than GAP_MAX to GAP_TO"""
    gmax = GAP_MAX if gmax is None else gmax
    gto = GAP_TO if gto is None else gto
    win = int(0.01 * SR)
    n = len(x) // win
    if n < 3:
        return x
    e = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(1) + 1e-12)
    quiet = e < e.max() * 10 ** (db / 20)
    out, i, a = [], 0, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * win > gmax * SR and i > 0 and j < n:
                keep = int(gto * SR) // 2
                out.append(x[a: i * win + keep]); a = j * win - keep
            i = j
        else:
            i += 1
    out.append(x[a:])
    return np.concatenate(out)


def whisper_words(y48):
    from scipy.signal import resample_poly
    from faster_whisper import WhisperModel
    a16 = resample_poly(y48, 1, 3).astype(np.float32)
    m = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(a16, word_timestamps=True, language="en")
    out = []
    for s in segs:
        for w in s.words:
            t = w.word.strip()
            if t:
                out.append({"i": len(out), "w": t, "s": round(w.start, 2), "e": round(w.end, 2)})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lines")
    ap.add_argument("outdir")
    ap.add_argument("--no-words", action="store_true")
    ap.add_argument("--force-hook", action="store_true", help="voice a hook that fails the text check (user-approved only)")
    a = ap.parse_args()
    cfg = json.load(open(a.lines, encoding="utf-8"))
    # hook text check BEFORE any voice (user rule 2026-11-22: never reveal the result or the reason in the hook)
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from retention_stats import hook_text_rows
    hook = next((L["text"] for L in cfg["lines"] if L.get("mood") == "hook"), None)
    if hook:
        HR = hook_text_rows(hook)
        for name, val, ok, target in HR:
            print(f"{'PASS ' if ok else 'CHECK'} {name:<34} {val:<28} target {target}")
        if not all(ok for *_, ok, _t in HR) and not a.force_hook:
            raise SystemExit("hook text CHECK: rewrite it with a hook pattern (SKILL.md step 2) or pass --force-hook")
    base_v, base_r = cfg.get("voice", "en-US-AndrewMultilingualNeural"), num(cfg.get("rate", "+14%"), "%")
    base_p, base_vol = num(cfg.get("pitch", "+0Hz"), "Hz"), num(cfg.get("volume", "+0%"), "%")
    engine = cfg.get("engine", "edge")  # "elevenlabs" (default for new shorts) or "edge" (old edge-tts)
    base_speed = float(cfg.get("speed", 1.0))
    if engine == "kokoro":
        raise SystemExit("Kokoro was removed on 2026-11-23 (the user disliked it): use \"engine\": \"elevenlabs\"")
    if engine == "elevenlabs":
        import re
        tagged = [L["text"] for L in cfg["lines"] if re.search(r"\[[^\]]+\]", L["text"])]
        if tagged:  # user rule 2026-11-23: never put [audio tags] in the script
            raise SystemExit("remove the [tags] from: " + " | ".join(tagged))
        el_voice, el_model = cfg["voice_id"], cfg.get("model", "eleven_v4")
        el_set = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True,
                  **cfg.get("settings", {})}
    os.makedirs(os.path.join(a.outdir, "clips"), exist_ok=True)
    parts, timing, t = [], [], 0.0
    prev_pause = None
    for k, L in enumerate(cfg["lines"]):
        mood = L.get("mood", "neutral")
        if mood not in MOODS:
            raise SystemExit(f"line {k}: unknown mood {mood!r} (known: {', '.join(MOODS)})")
        dr, dp, dv, dpause = MOODS[mood]
        voice = L.get("voice", base_v)
        rate = L.get("rate", pct(base_r + dr))
        pitch = L.get("pitch", hz(base_p + dp))
        vol = L.get("volume", pct(base_vol + dv))
        if engine == "elevenlabs":
            # moods scale the API speed (1.0 = the voice's own pace; the API accepts about 0.7-1.2)
            speed = float(L.get("speed", round(base_speed * (1 + dr / 100), 3)))
            speed = max(0.7, min(1.2, speed))
            st = {**el_set, **L.get("settings", {}), "speed": speed}
            ctx = cfg.get("context", True)
            prev = " ".join(x["text"] for x in cfg["lines"][max(0, k - 2):k]) if ctx and k else None
            nxt = cfg["lines"][k + 1]["text"] if ctx and k + 1 < len(cfg["lines"]) else None
            seed = L.get("seed", cfg.get("seed"))
            h = hashlib.md5(json.dumps([L["text"], el_voice, el_model, st, seed, prev, nxt]).encode()).hexdigest()[:8]
            clip = os.path.join(a.outdir, "clips", f"{k:02d}_{h}.mp3")
            tts_eleven(L["text"], el_voice, el_model, st, clip, cfg.get("format", "mp3_44100_128"), seed, prev, nxt)
        else:
            h = hashlib.md5(json.dumps([L["text"], voice, rate, pitch, vol]).encode()).hexdigest()[:8]
            clip = os.path.join(a.outdir, "clips", f"{k:02d}_{h}.mp3")
            tts(L["text"], voice, rate, pitch, vol, clip)
        y = trim(decode(clip))
        if engine == "elevenlabs":
            # post speed-up, pitch kept: "tempo" (whole narration) x the mood's rate (hook +20 %); per-line "tempo" wins
            y = atempo(y, float(L.get("tempo", float(cfg.get("tempo", 1.0)) * (1 + dr / 100))))
        if not L.get("keep_gaps"):
            # Josh pauses long at commas and full stops: silences over 0.25 s become 0.14 s (natural breath kept)
            y = squeeze(y, gmax=0.25, gto=0.14) if engine == "elevenlabs" else squeeze(y)
        if prev_pause is not None and "pause" not in cfg["lines"][k - 1] and mood in PRE:
            pre = PRE[mood]
            parts.append(np.zeros(int(pre * SR), np.float32)); t += pre
        timing.append({"i": k, "mood": mood, "s": round(t, 3), "e": round(t + len(y) / SR, 3), "text": L["text"]})
        parts.append(y); t += len(y) / SR
        pause = float(L.get("pause", dpause))
        if k < len(cfg["lines"]) - 1:
            parts.append(np.zeros(int(pause * SR), np.float32)); t += pause
        prev_pause = pause
    y = np.concatenate(parts)
    pk = np.abs(y).max()
    if pk > 0:
        y = y / pk * 0.89  # -1 dBFS peak; the mix sets the real level
    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2")
    wav = os.path.join(a.outdir, "voice.wav")
    import wave
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    json.dump(timing, open(os.path.join(a.outdir, "lines_timing.json"), "w", encoding="utf-8"), indent=1)
    dur = len(y) / SR
    print(f"voice.wav {dur:.2f} s, {len(cfg['lines'])} lines")
    if a.no_words:
        return
    words = whisper_words(y)
    json.dump(words, open(os.path.join(a.outdir, "words.json"), "w", encoding="utf-8"))
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from retention_stats import speech_rows
    R, long, fast = speech_rows(words)
    print(f"words.json {len(words)} words")
    for name, val, ok, target in R:
        print(f"{'PASS ' if ok else 'CHECK'} {name:<28} {val:<32} target {target}")
    if long:
        print("long pauses at:", long)
    if fast:
        print("sentences >= 5 w/s:", " | ".join(" ".join(w["w"] for w in s_) for s_ in fast))
    print("Hand-check words.json spelling (numbers, names) before captions.")


if __name__ == "__main__":
    main()
