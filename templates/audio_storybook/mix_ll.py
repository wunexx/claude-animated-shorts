# Final mix of the Yasuke short: voice (gain only, never processed) + original score (ducked -3 dB under speech,
# per-section level automation relative to the voice; retention standard 2026-11-18: bed ~-7 LU under the voice so
# music + SFX sit ~5-6 dB under it in speech gaps, no dead air; check with scripts/retention_stats.py) +
# synthesized SFX stem (events -6 dB under their naive level). Master to -14 LUFS integrated with the template's
# 4x-oversampled look-ahead limiter (<= -1.2 dBTP). Exactly 70.500 s / 48 kHz / stereo / 24-bit.
import os
import time
import json
import numpy as np
from scipy import ndimage
from dsp import SR, ns, dbg, write_wav, integrated, momentary, short_term, lra, true_peak, fades
import timeline as T
from mix import limiter, duck_db, speech_spans, lufs, ffmpeg_ebur, load_voice, cached, log

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
N = ns(T.DUR)
TARGET_LUFS = -14.0               # platform playback level (YouTube / TikTok / Reels ~ -14), 2026-11-21; was -15
MUSIC_TARGET = {"hook": -6.5, "sea": -7.0, "kyoto": -7.0, "hall": -7.5, "lucky": -7.0, "fuss": -7.5, "gifts": -6.5,
                "night": -7.0, "end": -6.5}   # was -9..-10.5 (measured 8.6 dB under in gaps: too thin)
HARD = [T.FLASH]   # level switches that sit in silence or on a hit: no smoothing
# music drop-outs (s): the beat of near-silence right before the main reveal / a punchline (SKILL.md step 8)
DROPS = []          # e.g. [(T.REVEAL - 0.45, T.REVEAL - 0.02)]
DROP_DB, DROP_RAMP = -24.0, 0.04


def drops_db():
    g = np.zeros(N)
    t = np.arange(N) / SR
    for a, b in DROPS:
        up = np.clip((t - a) / DROP_RAMP, 0, 1) * np.clip((b - t) / DROP_RAMP, 0, 1)
        g = np.minimum(g, DROP_DB * up)
    return g


def section_db(m_ducked, v):
    import music
    gains = {}
    for name, a, b in music.SECTIONS:
        seg = slice(ns(a), ns(b))
        Lm = integrated(m_ducked[:, seg])
        Lv = integrated(v[:, seg]) if name != "splat" else integrated(v[:, ns(12.0): ns(15.0)])
        gains[name] = (Lv + MUSIC_TARGET[name] - Lm) if np.isfinite(Lm) and np.isfinite(Lv) else 0.0
    curve = np.zeros(N)
    t = np.arange(N) / SR
    for name, a, b in music.SECTIONS:
        curve[t >= a] = gains[name]
    sm = ndimage.uniform_filter1d(curve, ns(0.4), mode="nearest")
    hard = np.zeros(N, bool)
    for tb in HARD:
        hard[ns(tb - 0.25): ns(tb + 0.25)] = True
    return np.where(hard, curve, sm), gains


def main():
    t0 = time.time()
    words = T.words(os.path.join(ROOT, "voice", "words.json"))
    spans = speech_spans(words)
    v = load_voice()
    v_ref = integrated(v)
    log(f"voice {v_ref:.2f} LUFS, TP {true_peak(v):.2f}")
    import music
    b = music.build()
    m_raw = cached("ya_music_raw", lambda: music.render(b, ref=-20.0)[0])
    m_d = m_raw * dbg(duck_db(spans))[None, :]
    curve, gains = section_db(m_d, v)
    m = m_d * dbg(curve + drops_db())[None, :]
    import sfx
    s_st = cached("ya_sfx", lambda: sfx.render(v_ref)[0])
    mix0 = v + m + s_st
    G = TARGET_LUFS - lufs(mix0)
    for it in range(6):
        y, g3 = limiter(mix0 * dbg(G))
        L = lufs(y)
        log(f"master {it}: {G:+.2f} dB -> {L:.2f} LUFS, TP {true_peak(y):.2f}, GR max {-20 * np.log10(g3.min()):.2f}")
        if abs(L - TARGET_LUFS) < 0.02:
            break
        G += TARGET_LUFS - L
    y = fades(y, 0.0, 0.03)
    assert y.shape == (2, N)
    write_wav(os.path.join(HERE, "mix.wav"), y)
    write_wav(os.path.join(HERE, "stem_voice.wav"), v * dbg(G))
    write_wav(os.path.join(HERE, "stem_music.wav"), m * dbg(G))
    write_wav(os.path.join(HERE, "stem_sfx.wav"), s_st * dbg(G))
    stats = dict(I=lufs(y), TP=true_peak(y), LRA=lra(y), voice=lufs(v * dbg(G)), music=lufs(m * dbg(G)), sfx=lufs(s_st * dbg(G)), G=G)
    log(json.dumps({k: round(float(x), 2) for k, x in stats.items()}))
    log("section gains", {k: round(float(x), 1) for k, x in gains.items()})
    # per-section balance
    rows = []
    for name, a, bb in music.SECTIONS:
        seg = slice(ns(a), ns(bb))
        rows.append(f"| {name} | {a:.2f}-{bb:.2f} | {lufs(v[:, seg] * dbg(G)):.1f} | {lufs(m[:, seg] * dbg(G)):.1f} | {lufs(s_st[:, seg] * dbg(G)):.1f} |")
    eb = ffmpeg_ebur(os.path.join(HERE, "mix.wav"))
    with open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8") as fh:
        fh.write("# Yasuke short - soundtrack cue sheet\n\nAll sound is original: synthesized in numpy/scipy (sfx_gen.py, instruments.py, sfx.py, music.py), mixed by mix_ll.py.\n")
        fh.write("Standard mix (2026-11-18): music bed ~-7 LU under the voice (ducked -3 dB under speech), SFX events -6 dB, voice unchanged; drops " + str(DROPS) + ".\n\n")
        fh.write("## Music map\n\n" + "\n".join(f"- {t:6.2f} s: {d}" for t, d in sorted(b.cues)) + "\n\n")
        fh.write("## SFX cues\n\n")
        for c in sfx.cues():
            fh.write(f"- {c.t:6.2f} s `{c.name}` ({c.kind}, {c.applied:+.1f} LU): {c.desc}\n")
        fh.write("\n## Levels per section (LUFS)\n\n| section | span | voice | music | sfx |\n|---|---|---|---|---|\n" + "\n".join(rows) + "\n\n")
        fh.write("## Loudness\n\n```\n" + json.dumps({k: round(float(x), 2) for k, x in stats.items()}) + "\n" + eb + "\n```\n")
    log(f"done in {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main()
