# Original score for the Yasuke short, composed and synthesized here: a Japanese-flavoured tune in D (yo pentatonic
# D E G A B for the bright parts, the darker in-scale D Eb G A Bb for the night), 96 bpm (beat 0.625 s, bar 2.5 s).
# Plucked koto-like ostinatos, a flute (fife) melody, taiko (low timpani) hits, a deadpan tuba for "Unluckily",
# a music-box snowfall, a triumphant march for the gifts, a dark war-drum night and a lone flute at the end.
import numpy as np
from dsp import SR, ns, rng, pan, place, make_ir, convolve_st, integrated, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 60 / 96
BAR = 4 * Q
F = I.m2f

# our own 8-bar theme: (bar, beat, beats, midi), D yo pentatonic
THEME = [(1, 0, 1, 69), (1, 1, 1, 71), (1, 2, 2, 74), (2, 0, 1, 71), (2, 1, 1, 69), (2, 2, 2, 67),
         (3, 0, 1, 64), (3, 1, 1, 67), (3, 2, 1, 69), (3, 3, 1, 71), (4, 0, 4, 69),
         (5, 0, 1, 74), (5, 1, 1, 76), (5, 2, 2, 74), (6, 0, 1, 71), (6, 1, 1, 69), (6, 2, 1, 67), (6, 3, 1, 69),
         (7, 0, 2, 64), (7, 2, 2, 67), (8, 0, 4, 62)]
CH = {"D": (38, [62, 69, 74]), "G": (43, [62, 67, 71]), "A": (45, [64, 69, 76]), "Em": (40, [64, 67, 71]),
      "Din": (38, [62, 63, 69]), "Gin": (43, [62, 67, 70])}

SECTIONS = [  # (name, start, end) -> level automation in the mix
    ("hook", 0.0, T.FLASH), ("sea", T.FLASH, 16.6), ("kyoto", 16.6, 24.1), ("hall", 24.1, 33.3), ("lucky", 33.3, 38.8),
    ("fuss", 38.8, 45.4), ("gifts", 45.4, 54.7), ("night", 54.7, 63.8), ("end", 63.8, T.DUR),
]

R = rng(1579)


def _r():
    return rng(int(R.integers(1 << 30)))


class Band:
    def __init__(self):
        self.tr, self.send, self.cues = {}, {}, []

    def add(self, name, x, t, p=0.0, g=1.0, send=0.18):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N))
            self.send[name] = send
        place(self.tr[name], pan(x, p) if np.ndim(x) == 1 else x, t, g)


def theme(t0, bars, tempo=1.0, shift=0):
    q = Q * tempo
    out = []
    for (b, beat, d, m) in THEME:
        if b not in bars:
            continue
        k = bars.index(b)
        out.append((t0 + (k * 4 + beat) * q, d * q, m + shift))
    return out


def koto(b, t0, t1, chords, vel=0.5, step=None, until=None):
    """plucked koto ostinato: root, fifth, octave, fifth in eighths over each chord (one chord per bar)"""
    step = step or Q / 2
    t, k = t0, 0
    while t < t1 and (until is None or t < until):
        c = chords[int((t - t0) // BAR) % len(chords)]
        root, tri = CH[c]
        m = [tri[0], tri[1], tri[2], tri[1]][k % 4]
        b.add("koto", I.pluck(F(m), vel * (1.0 if k % 4 == 0 else 0.75), _r(), dur=0.9, bright=0.85, pos=0.12), t, 0.25 - 0.5 * (k % 2))
        t += step
        k += 1


def taiko(b, t, vel=0.8, m=36, dur=1.6, p=0.0):
    b.add("taiko", I.timpani(F(m), vel, _r(), dur=dur), t, p)


def flute(b, notes, vel=0.6, p=-0.1):
    for (t, d, m) in notes:
        b.add("flute", I.fife(F(m), d * 0.95, vel, _r(), rel=0.12), t, p, send=0.3)


def build():
    b = Band()
    # ============ HOOK 0 - 4.4: rumbling taiko and a nervous koto tremolo, a big hit on the crash
    t = 0.1
    while t < T.DOOR1_LAND - 0.1:
        taiko(b, t, 0.35 + 0.4 * t / 2.2, 38, 0.6)
        t += 0.3 if t < 1.2 else 0.17
    for k in range(int(2.0 / 0.11)):
        b.add("koto", I.pluck(F([62, 63][k % 2] + 12), 0.25 + 0.02 * k, _r(), dur=0.3, bright=0.9), 0.1 + k * 0.11, 0.2)
    taiko(b, T.DOOR1_LAND, 1.0, 33, 2.4)
    b.add("cymbal", I.cymbal(0.5, _r(), dur=2.0), T.DOOR1_LAND, 0.0)
    b.add("glock", I.glock(F(81), 0.4, _r()), T.ONE_MAN, 0.2)
    b.cues.append((0.0, "hook: taiko rumble accelerating, koto tremolo, a big taiko + cymbal hit on the crash"))
    # ============ SEA 4.4 - 16.6: the arrival: koto ostinato, our theme on the flute; slide up on 'six feet'
    t0 = T.FLASH + 0.15
    koto(b, t0, 16.4, ["D", "G", "A", "D"], 0.45)
    b.add("pad", I.pad([F(50), F(57), F(62), F(69)], 12.0, 0.35, _r(), att=1.5, rel=1.0, warm=900), t0)
    flute(b, [n for n in theme(t0 + BAR, [1, 2, 3, 4]) if n[0] < 15.2])
    taiko(b, T.DOCKS, 0.5, 38, 1.2)
    b.add("glock", I.glock(F(86), 0.45, _r()), T.SIX + 0.25, 0.2)
    b.cues.append((t0, "the black ship: koto ostinato in D yo, the theme on flute, a taiko thump as it docks"))
    # ============ KYOTO 16.6 - 24.1: busy street: koto in sixteenths, taiko on every beat, building to the crash
    koto(b, 16.7, T.DOOR2_LAND - 0.05, ["D", "Em", "G", "A"], 0.4, step=Q / 4)
    t, k = 16.7, 0
    while t < T.DOOR2_LAND - 0.1:
        taiko(b, t, 0.35 + 0.35 * (t - 16.7) / 6.7, 38 if k % 2 else 36, 0.7)
        t += Q if t < 21 else Q / 2
        k += 1
    taiko(b, T.DOOR2_LAND, 1.0, 33, 2.4)
    b.add("cymbal", I.cymbal(0.55, _r(), dur=2.0), T.DOOR2_LAND, 0.0)
    b.cues.append((16.7, "Kyoto: koto runs in sixteenths, taiko on every beat doubling up, crash on the door"))
    # ============ HALL 24.1 - 33.3: the warlord: low in-scale pad, sparse koto, a deep taiko on his name
    b.add("pad", I.pad([F(38), F(50), F(51), F(57)], 9.0, 0.45, _r(), att=1.2, rel=1.0, warm=600), 24.2)
    for k, m in enumerate([62, 63, 67, 69, 70, 69, 67, 63]):
        b.add("koto", I.pluck(F(m), 0.45, _r(), dur=1.4, bright=0.7), 24.4 + k * Q * 1.5, 0.2)
    taiko(b, T.NOBUNAGA, 1.0, 31, 2.6)
    b.add("brass", I.brass(F(38), 1.4, 0.5, _r(), kind="soft", rel=0.6), T.TRICK, 0.0)
    for k, m in enumerate([74, 75, 74, 70]):
        b.add("koto", I.pluck(F(m), 0.4, _r(), dur=0.5, bright=0.9), T.INK + k * 0.12, -0.2)
    t = T.SCRUB0
    while t < 33.2:
        b.add("koto", I.pluck(F(50 if int((t - T.SCRUB0) / (Q / 2)) % 2 else 57), 0.4, _r(), dur=0.3, bright=0.6), t, 0.0)
        t += Q / 2
    b.cues.append((24.2, "the hall: dark in-scale pad and koto, deep taiko on 'Oda Nobunaga', a scrubbing pizz pulse"))
    # ============ LUCKY 33.3 - 38.8: 'Luckily' a bright koto lick; 'Unluckily' a deadpan tuba; a glock run as he shines
    for k, m in enumerate([74, 76, 79, 81]):
        b.add("koto", I.pluck(F(m), 0.45, _r(), dur=0.8, bright=0.9), 33.4 + k * 0.1, 0.2)
    for k, m in enumerate([50, 49, 48, 47]):
        b.add("tuba", I.brass(F(m - 12), 0.3 if k < 3 else 0.9, 0.55, _r(), kind="tuba", fall=(-0.8 if k == 3 else 0)), T.UNLUCKILY + 0.05 + 0.34 * k, 0.0)
    t = T.UNLUCKILY + 1.5
    while t < 38.6:
        b.add("koto", I.pluck(F(50 if int((t - 34) / (Q / 4)) % 2 else 57), 0.4, _r(), dur=0.25, bright=0.6), t, 0.0)
        t += Q / 4
    for i, m in enumerate([74, 76, 79, 81, 83, 86, 88]):
        b.add("glock", I.glock(F(m), 0.4, _r()), T.SHINE + i * 0.09, 0.3)
    b.cues.append((33.4, "'Luckily': a bright koto lick; 'Unluckily': deadpan tuba, frantic koto; a glock run on the shine"))
    # ============ FUSS 38.8 - 45.4: gentle theme on koto; the snow: music box falling notes
    for (t, d, m) in theme(38.95, [5, 6], tempo=1.0):
        b.add("koto", I.pluck(F(m), 0.5, _r(), dur=1.4, bright=0.7), t, 0.1)
    b.add("pad", I.pad([F(43), F(55), F(62), F(67)], 3.4, 0.35, _r(), att=0.8, rel=0.8, warm=800), 38.9)
    for k, m in enumerate([88, 86, 83, 81, 79, 76, 74, 79, 81, 86]):
        b.add("mbox", I.musicbox(F(m), 0.45, _r()), T.SNOW + 0.1 + k * 0.28, 0.2 - 0.04 * k)
    b.add("pad", I.pad([F(50), F(62), F(66), F(69)], 3.1, 0.3, _r(), att=0.6, rel=0.8, warm=1500), T.SNOW)
    b.add("glock", I.glock(F(93), 0.45, _r()), T.TOUCH, 0.3)
    b.cues.append((38.95, "why the fuss: the theme on koto; snow: a falling music-box line, a glock on the touch"))
    # ============ GIFTS 45.4 - 54.7: triumphant: taiko march, the theme on flute, glock on each gift
    koto(b, 45.5, 54.5, ["D", "G", "A", "D"], 0.45)
    t, k = 45.5, 0
    while t < 54.5:
        taiko(b, t, 0.55 if k % 4 == 0 else 0.35, 36 if k % 2 == 0 else 38, 0.8)
        t += Q
        k += 1
    flute(b, [n for n in theme(45.5 + BAR * 0.0, [1, 2, 5, 6]) if n[0] < 54.3], 0.7)
    taiko(b, T.TEN, 1.0, 31, 2.0)
    for tb in (T.NAME, T.HOUSE, T.MONEY, T.SWORD):
        b.add("glock", I.glock(F(86), 0.45, _r()), tb, 0.25)
    b.cues.append((45.5, "the gifts: taiko march, our theme on flute, a big taiko on 'ten', glocks on each gift"))
    # ============ NIGHT 54.7 - 63.8: dark in-scale pad, war drums, low brass on 'betrays', cymbal swell into the fire
    b.add("pad", I.pad([F(38), F(50), F(51), F(57)], 9.0, 0.5, _r(), att=0.8, rel=1.2, warm=500), 54.8)
    t, k = 54.8, 0
    while t < 61.0:
        taiko(b, t, 0.45 + 0.3 * (t - 54.8) / 6.2, 33 if k % 3 == 0 else 36, 0.8)
        t += Q if k % 3 != 2 else Q / 2
        k += 1
    b.add("brass", I.brass(F(38), 1.6, 0.8, _r(), kind="soft", rel=0.8), T.BETRAYS, 0.0)
    b.add("brass", I.brass(F(39), 1.6, 0.6, _r(), kind="soft", rel=0.8), T.BETRAYS + 0.05, 0.0)
    b.add("cymbal", I.cymbal(0.5, _r(), dur=1.6)[::-1], T.BURNS - 1.55, 0.0)
    taiko(b, T.BURNS, 1.0, 31, 2.4)
    taiko(b, T.CAPTURED, 0.9, 31, 2.4)
    for k, m in enumerate([63, 62]):
        b.add("koto", I.pluck(F(m), 0.5, _r(), dur=1.6, bright=0.6), T.SHRUG + k * 0.5, 0.0)
    b.add("pad", I.pad([F(43), F(55), F(62), F(67)], 2.0, 0.3, _r(), att=0.4, rel=0.8, warm=900), T.SPARE)
    b.cues.append((54.8, "night: dark in-scale pad, war taiko, low brass on 'betrays', reverse cymbal into the fire"))
    # ============ END 63.8 - 70.5: a lone flute plays the theme's last bars; a final koto chord
    flute(b, theme(64.0, [7, 8], tempo=1.1), 0.6, p=0.0)
    b.add("pad", I.pad([F(50), F(57), F(62), F(66)], 6.2, 0.35, _r(), att=1.0, rel=1.2, warm=900), 64.0)
    for m in (38, 50, 57, 62, 69, 74):
        b.add("koto", I.pluck(F(m), 0.55, _r(), dur=2.4, bright=0.7), 64.0 + 2 * BAR * 1.1 + 0.03 * (m % 5), 0.0)
    b.add("glock", I.glock(F(86), 0.35, _r()), 68.9, 0.2)
    b.cues.append((64.0, "ending: a lone flute on the theme's last bars, a final open koto chord"))
    end = np.ones(N)
    a = ns(T.DUR - 0.8)
    end[a:] = np.linspace(1, 0, N - a) ** 1.5
    for k in b.tr:
        b.tr[k] *= end[None, :]
    return b


TARGET = {"flute": 0.0, "koto": -3.0, "taiko": -2.0, "pad": -7.0, "glock": -6.0, "mbox": -3.0, "tuba": -2.0,
          "brass": -4.0, "cymbal": -9.0}


def render(b, ref=-20.0):
    hall = make_ir(1.8, 7, pre=0.02, hf=1.3)
    dry = np.zeros((2, N))
    wet = np.zeros(N)
    levels = {}
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        L = integrated(x)
        g = 10 ** ((ref + TARGET.get(k, -6) - L) / 20)
        levels[k] = (round(L, 1), round(ref + TARGET.get(k, -6), 1))
        x = x * g
        b.tr[k] = x
        dry += x
        wet += b.send[k] * x.mean(0)
    out = dry + 0.8 * convolve_st(wet, hall)
    out = hp(out, 30, 2)
    return out, levels
