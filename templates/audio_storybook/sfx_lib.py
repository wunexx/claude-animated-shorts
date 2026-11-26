# Shared sound-effect library for cartoon-3d-short (do not rewrite per short): the Cue class, every synthesized
# effect generator from earlier shorts, and render_cues(). A short's sfx.py only writes its cue list:
#   from sfx_lib import *        (brings Cue, the generators, dsp helpers, G = sfx_gen, T = timeline)
#   def cues(): ...               (list of Cue(t, name, desc, gen, naive_LU, kind="event"|"bed", ...))
#   def render(v_ref, on_event=None): return render_cues(cues(), v_ref, on_event)
# Generators take an rng `r` and return mono (n,) or stereo (2, n) float arrays at dsp.SR.
#   cartoon:  gasp, blip, boing, slide_down (pass f0 < f1 for a slide UP), pant, claws, bark, plop, fan_flaps, paper
#   wet/heat: drip, splat, hiss, sizzle, steps(times)
#   bells:    chime, sparkle, shop_bell
#   impacts:  fwump (soft big landing), thud, crash (door/wood slab falling flat), rumble (far thunder)
#   crowds:   crowd(dur, r, people) murmur, whoas(r, k) group "whoa"
#   metal:    shing (sword drawn / ringing), clash (steel on steel), jingle (coins)
#   beds:     drone (space hum), fire_bed (burning building), wind, scrub (cloth rubbing)
#   body:     munch (bite/chew), growl (stomach), snore
#   rats:     squeak(r, f0, k) chirps, snip (scissors), tear (paper rip), scurry(r, dur) claws (Rat Tails)
#   war:      mg_burst(r, n, rate, dist), jam_clank, engine(dur, r, rpm, rough), buzz(dur, r, flies), emu_boom(r, k),
#             thumps(r, times, base), stamp (Emu War)
#   lighthouse: clock_tick(r, dur, rate) clockwork tick-tock, steam_whistle(r, dur, f) ship's whistle (Lighthouse)
#   storm:    thunder_crack(r, dist) (a strike you see: crack + rip + boom), lightning_zap (cartoon flash sizzle),
#             rain_bed(dur, r, heavy, roof, near) (stereo bed); rumble = far thunder only
# Plus sfx_gen (G.*): creak, rattle, whoosh, wood_crack, timber_tear, splash_big, water_bed, breeze, bird_chirps,
# crickets, babble, whoa, oof(kind: oof/ugh/oh/ow), hurrah, applause, stroll_step, boot, clink, bubbles, ...
import numpy as np
from dsp import (SR, TAU, ns, tt, rng, dbg, lp, hp, bp, peq, pan, st, place, fades, widen, make_ir, convolve_st,
                 momentary_max, integrated, colored, smooth_noise, modal, phase, shape)
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, send=0.12, group=None, cut=None):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.lpf, self.send, self.cut = kind, p, extra, lpf, send, cut
        self.group = group or name
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None



# ---------------------------------------------------------------- generators (Two Suns)
def gasp(r, base=1.0):
    """short sharp inhale (shock): breathy 'hh-uh'"""
    d = 0.35
    n = ns(d)
    t = np.arange(n) / SR
    nz = bp(r.standard_normal(n), 900 * base, 4000 * base, 1)
    env = np.clip(t / 0.02, 0, 1) * np.exp(-t / 0.12)
    return fades(nz * env, 0.002, 0.05)


def blip(r, f0=600, up=1.2, d=0.12):
    """cartoon 'blip'"""
    t = tt(d)
    f = f0 * (1 + up * t / d)
    return fades(np.sin(phase(f)) * np.exp(-t / 0.05), 0.001, 0.02)


def paper(r, dur=0.6):
    n = ns(dur)
    t = np.arange(n) / SR
    env = (0.4 + 0.6 * np.abs(smooth_noise(n, r, 14.0))) * np.sin(np.pi * np.clip(t / dur, 0, 1))
    return fades(bp(r.standard_normal(n), 1500, 8000, 1) * env, 0.005, 0.05)


def fan_flaps(r, dur, rate=4.5):
    """paper fan wafting: soft airy swishes"""
    n = ns(dur)
    t = np.arange(n) / SR
    env = np.abs(np.sin(np.pi * rate * t)) ** 3
    return fades(bp(colored(n, r, 0.6), 400, 2500, 1) * env, 0.02, 0.1)


def boing(r, f0=180, up=2.2, d=0.5):
    t = tt(d)
    f = f0 * (1 + up * (t / d) ** 0.7)
    return fades(np.sin(phase(f * (1 + 0.04 * np.sin(TAU * 25 * t)))) * np.exp(-t / 0.25), 0.002, 0.05)


def slide_down(r, d=0.7, f0=1400, f1=380):
    """slide whistle falling (dizzy dog / melting)"""
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d) * (1 + 0.01 * np.sin(TAU * 6 * t))
    y = np.sin(phase(f)) + 0.15 * bp(r.standard_normal(len(t)), 800, 3000, 1)
    return fades(y * np.clip(t / 0.03, 0, 1), 0.01, 0.12)


def drip(r):
    return G.bubbles(0.2, r, 30, 1200, 2600, (0.006, 0.015), rise=(10, 20))[: ns(0.2)]


def splat(r):
    """wet ice-cream splat: low thump + squelchy bubbles"""
    d = 0.5
    t = tt(d)
    thump = np.sin(phase(110 * (1 + 0.6 * np.exp(-t / 0.03)))) * np.exp(-t / 0.07)
    wet = G.bubbles(d, r, 90, 250, 1400, (0.004, 0.012), rise=(2, 6))[: len(t)]
    sq = bp(r.standard_normal(len(t)), 600, 3000, 1) * np.exp(-t / 0.05) * 0.5
    return fades(thump + 0.8 * wet + sq, 0.0, 0.08)


def bark(r, f0=520, d=0.16):
    """small dog yap: a short bright 'rruf' vowel with a breathy onset"""
    n = ns(d)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.exp(-t / 0.03)) * (1 - 0.25 * t / d)
    forms = G.vowel_track(n, [(0, "a"), (d * 0.5, "a"), (d, "U")])
    amp = np.clip(t / 0.008, 0, 1) * np.clip((d - t) / 0.04, 0, 1)
    y = G.vox(f, forms, amp, r, scale=1.5, tilt=0.9, breath=0.4, fmax=6000)
    y += bp(r.standard_normal(n), 1500, 6000, 1) * np.exp(-t / 0.015) * 0.4
    return fades(y, 0.001, 0.02)


def pant(r, dur, rate=4.2):
    """dog panting: quick breathy 'hah-hah'"""
    n = ns(dur)
    t = np.arange(n) / SR
    ph = (t * rate) % 1
    env = np.where(ph < 0.45, np.sin(np.pi * ph / 0.45), 0.0) * (0.6 + 0.4 * (np.floor(t * rate) % 2))
    return fades(bp(colored(n, r, 0.4), 700, 3500, 1) * env, 0.02, 0.1)


def claws(r, dur, rate=11.0):
    """dog claws scrabbling on cobbles"""
    n = ns(dur)
    y = np.zeros(n)
    tm = 0.0
    while tm < dur - 0.03:
        k = ns(tm)
        L = ns(0.01)
        y[k:k + L] += hp(r.standard_normal(L), 2500) * np.exp(-np.arange(L) / SR / 0.0015) * r.uniform(0.4, 1.0)
        tm += r.exponential(1 / rate)
    return y


def hiss(r, dur, f_lo=1500, f_hi=9000, rise=0.4, fall=0.6):
    """steam hiss: bright filtered noise swelling in and out"""
    n = ns(dur)
    t = np.arange(n) / SR
    env = np.clip(t / rise, 0, 1) ** 1.5 * np.clip((dur - t) / fall, 0, 1) * (0.85 + 0.15 * smooth_noise(n, r, 6.0))
    return fades(bp(colored(n, r, 0.2), f_lo, f_hi, 1) * env, 0.01, 0.05)


def sizzle(r, dur=1.2):
    """a hot thing in water / molten metal: crackly hiss with fizz pops"""
    n = ns(dur)
    y = hiss(r, dur, 2500, 10000, 0.05, 0.5) * 0.7
    pops = np.zeros(n)
    tm = 0.0
    while tm < dur - 0.02:
        k = ns(tm)
        L = ns(0.006)
        pops[k:k + L] += hp(r.standard_normal(L), 3000) * np.exp(-np.arange(L) / SR / 0.001) * r.uniform(0.2, 1.0)
        tm += r.exponential(1 / 60)
    env = np.clip((dur - np.arange(n) / SR) / (0.6 * dur), 0, 1)
    return fades(y + 0.7 * pops * env, 0.003, 0.05)


def plop(r):
    """a sun sinking into the sea: soft deep 'bloop'"""
    d = 0.6
    t = tt(d)
    f = 220 * (1 - 0.55 * (t / d) ** 0.5)
    return fades(np.sin(phase(f)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6, 0.005, 0.1)


def chime(r, f=1568.0, d=1.4, bright=1.0):
    return modal(d, [(f, 1.0, 0.6), (f * 2.0, 0.5 * bright, 0.4), (f * 2.76, 0.3 * bright, 0.25)], r)


def sparkle(r, n=5, f0=2093.0, gap=0.07):
    out = np.zeros(ns(gap * n + 1.2))
    for k in range(n):
        G._place_mono(out, chime(r, f0 * 2 ** (k * 2 / 12), 0.9, 0.7) * (0.9 - 0.1 * k), k * gap)
    return out


def shop_bell(r):
    """bell over the bakery door: two quick dings"""
    out = np.zeros(ns(1.4))
    G._place_mono(out, chime(r, 2350.0, 1.0), 0.0)
    G._place_mono(out, chime(r, 2350.0, 0.9) * 0.7, 0.12)
    return out


def fwump(r, big=1.0):
    """a big soft quilt landing: low airy thump + cloth swish"""
    d = 1.0
    t = tt(d)
    body = lp(colored(len(t), r, 1.5), 300, 2) * np.exp(-t / 0.18) * 1.2
    sub = np.sin(phase(65 * (1 + 0.4 * np.exp(-t / 0.05)))) * np.exp(-t / 0.2)
    sw = G.whoosh(0.7, r, peak=0.45, f_lo=300, f_hi=1500, tail=0.2)
    y = np.zeros(len(t))
    y[: len(sw)] += 0.6 * sw[: len(t)]
    return fades((body + sub + y) * big, 0.005, 0.2)


def rumble(r, dur=2.8):
    """far thunder / storm clouds piling up"""
    n = ns(dur)
    t = np.arange(n) / SR
    env = np.clip(t / 0.4, 0, 1) * np.exp(-np.maximum(t - 0.4, 0) / 0.9) * (0.7 + 0.3 * smooth_noise(n, r, 4.0))
    return fades(lp(colored(n, r, 2.0), 160, 2) * env * 1.4, 0.05, 0.4)


def drone(dur, r, f=55.0):
    """space: a slow low hum with a breathing filter"""
    n = ns(dur)
    t = np.arange(n) / SR
    y = np.sin(phase(np.full(n, f))) + 0.5 * np.sin(phase(np.full(n, f * 1.5 * 1.003))) + 0.4 * lp(colored(n, r, 1.5), 300, 2)
    return fades(y * (0.7 + 0.3 * np.sin(TAU * 0.15 * t)), 0.8, 1.0)


def steps(r, times, scuff=0.4):
    out = np.zeros(ns(max(times) - min(times) + 0.4))
    for tm in times:
        G._place_mono(out, G.stroll_step(r, scuff), tm - min(times))
    return out


# ---------------------------------------------------------------- generators (Yasuke)
def crash(r, big=1.0):
    """a heavy wooden door slamming flat onto the ground: thump + crack + rattle"""
    d = 1.2
    t = tt(d)
    thump = np.sin(phase(70 * (1 + 0.8 * np.exp(-t / 0.02)))) * np.exp(-t / 0.12) * 1.3
    body = lp(colored(len(t), r, 1.2), 900, 2) * np.exp(-t / 0.08)
    y = thump + body
    cr = G.wood_crack(r)
    y[: len(cr)] += 0.6 * cr[: len(t)]
    rt = G.rattle(0.6, r, 25.0)
    y[ns(0.05): ns(0.05) + len(rt)] += 0.3 * rt[: len(t) - ns(0.05)]
    return fades(y * big, 0.0, 0.2)


def crowd(dur, r, people=14, base=(110, 230), rate=4.6, env=None):
    """a murmuring crowd: many far babblers, stereo"""
    n = ns(dur)
    out = np.zeros((2, n))
    for p in range(people):
        b = r.uniform(*base)
        y = G.babble(dur, r, b, r.uniform(0.95, 1.2), rate=r.uniform(rate * 0.8, rate * 1.2), active=r.uniform(0.6, 0.9))
        out += pan(y[:n] * r.uniform(0.5, 1.0), r.uniform(-0.9, 0.9))
    if env is not None:
        out *= env[None, :]
    return fades(lp(out, 3200, 1), 0.2, 0.3)


def whoas(r, k=6, spread=0.35):
    out = np.zeros((2, ns(spread + 0.8)))
    for i in range(k):
        x = G.whoa(r, base=r.uniform(100, 240))
        place(out, pan(x, r.uniform(-0.8, 0.8)), r.uniform(0, spread))
    return out


def shing(r, f0=2400.0, d=1.1):
    """a katana drawn / ringing: metallic sweep + long modal ring"""
    t = tt(d)
    sweep = bp(r.standard_normal(len(t)), 2500, 9000, 1) * np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.12) * 0.6
    ring = modal(d, [(f0, 1.0, 0.5), (f0 * 2.31, 0.5, 0.3), (f0 * 3.7, 0.3, 0.18)], r) * np.clip((t - 0.05) / 0.02, 0, 1)
    return fades(sweep + ring, 0.002, 0.1)


def clash(r):
    """steel on steel"""
    d = 0.6
    t = tt(d)
    y = modal(d, [(r.uniform(1800, 2600), 1.0, 0.18), (r.uniform(3500, 4800), 0.6, 0.1), (r.uniform(5800, 7200), 0.3, 0.06)], r)
    y += hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.8
    return fades(y, 0.0, 0.05)


def scrub(r, dur, rate=3.2):
    """cloth rubbing on skin: rhythmic soft swishes"""
    n = ns(dur)
    t = np.arange(n) / SR
    env = np.abs(np.sin(np.pi * rate * t)) ** 2
    return fades(bp(colored(n, r, 0.3), 900, 5000, 1) * env, 0.02, 0.1)


def jingle(r, k=9):
    out = np.zeros(ns(0.8))
    for i in range(k):
        G._place_mono(out, G.clink(r, r.uniform(2500, 4800), 0.15), r.uniform(0, 0.35))
    return out


def fire_bed(dur, r, roar=1.0):
    """a burning building: low roar + crackles"""
    n = ns(dur)
    y = lp(colored(n, r, 1.6), 400, 2) * (0.8 + 0.2 * smooth_noise(n, r, 3.0)) * roar
    pops = np.zeros(n)
    tm = 0.0
    while tm < dur - 0.02:
        k = ns(tm)
        L = ns(0.01)
        pops[k:k + L] += bp(r.standard_normal(L), 1200, 7000, 1) * np.exp(-np.arange(L) / SR / 0.0025) * r.uniform(0.2, 1.0)
        tm += r.exponential(1 / 18)
    return y + 0.9 * pops


def thud(r):
    d = 0.4
    t = tt(d)
    return fades(np.sin(phase(90 * (1 + 0.5 * np.exp(-t / 0.02)))) * np.exp(-t / 0.08) + lp(colored(len(t), r, 1.0), 600, 2) * np.exp(-t / 0.05), 0.0, 0.05)


def wind(dur, r, lvl=1.0):
    return G.breeze(dur, r, lvl, gust=0.3, bright=700)



# ---------------------------------------------------------------- generators (Emu War)
def mg_burst(r, n=8, rate=10.0, dist=0.0):
    """a 1930s machine-gun burst (Lewis gun): n sharp shots at ~rate/s, each a crack + low thump + mechanism clack"""
    gap = 1.0 / rate
    out = np.zeros(ns(n * gap + 0.5))
    for k in range(n):
        d = 0.18
        t = np.arange(ns(d)) / SR
        crack = hp(r.standard_normal(ns(d)), 900) * np.exp(-t / (0.006 + 0.01 * dist))
        thump = np.sin(TAU * (90 + 40 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.04)
        clack = bp(r.standard_normal(ns(d)), 2500, 6000) * np.exp(-np.maximum(t - 0.03, 0) / 0.004) * (t > 0.03)
        x = 0.9 * crack + 0.7 * thump + 0.25 * clack
        if dist:
            x = lp(x, 6000 - 4000 * dist)
        a = ns(k * gap + r.uniform(-0.006, 0.006))
        a = max(a, 0)
        out[a:a + len(x)] += x[: len(out) - a] * (0.85 + 0.15 * r.random())
    return fades(out, 0.001, 0.08)


def jam_clank(r):
    """the gun jams: a dry metallic clack, a stuck bolt rattle, then nothing"""
    d = 0.6
    t = np.arange(ns(d)) / SR
    clank = sum(np.sin(TAU * f * t) * np.exp(-t / tau) * g for f, tau, g in [(1240, 0.05, 1.0), (1830, 0.04, 0.7), (2990, 0.03, 0.5), (4310, 0.02, 0.3)])
    click = hp(r.standard_normal(ns(d)), 2000) * np.exp(-t / 0.003)
    rat = np.zeros(ns(d))
    for k in range(4):
        a = ns(0.12 + 0.06 * k)
        tt_ = np.arange(ns(0.05)) / SR
        rat[a:a + len(tt_)] += 0.35 * (0.7 ** k) * bp(r.standard_normal(len(tt_)), 1500, 5000) * np.exp(-tt_ / 0.008)
    return fades(0.6 * clank + 0.5 * click + rat, 0.0005, 0.05)


def engine(dur, r, rpm=1.0, rough=1.0):
    """an old truck engine idling / driving: low firing pulses + exhaust rasp; rpm 0.6 idle .. 1.6 revving (scalar or array)"""
    n = ns(dur)
    rp = np.broadcast_to(np.asarray(rpm, float), (n,)) if np.ndim(rpm) == 0 else np.interp(np.linspace(0, 1, n), np.linspace(0, 1, len(rpm)), rpm)
    f = 28.0 * rp
    ph = np.cumsum(f) / SR
    pulse = (np.sin(TAU * ph) > 0.6).astype(float)
    pulse = lp(pulse, 260)
    rasp = bp(r.standard_normal(n), 120, 900) * (0.4 + 0.6 * pulse) * rough
    hum = np.sin(TAU * ph * 0.5) * 0.5 + np.sin(TAU * ph * 2.0) * 0.2
    return fades(0.8 * pulse + 0.35 * rasp + 0.3 * hum, 0.2, 0.3)


def buzz(dur, r, flies=3):
    """flies buzzing around: wandering pitch ~180-260 Hz sawtooth-ish with amplitude swoops"""
    n = ns(dur)
    out = np.zeros(n)
    for k in range(flies):
        f = 190 + 50 * r.random() + 25 * smooth_noise(n, r, 3.0)
        ph = np.cumsum(f) / SR
        saw = 2 * (ph % 1) - 1
        amp = 0.4 + 0.6 * np.abs(smooth_noise(n, r, 1.5))
        out += bp(saw, 300, 4000) * amp
    return fades(out / flies, 0.05, 0.1)


def emu_boom(r, k=3):
    """an emu's low drumming grunt: k throaty 'oomp' pulses ~60-80 Hz"""
    out = np.zeros(ns(0.22 * k + 0.4))
    for i in range(k):
        d = 0.26
        t = np.arange(ns(d)) / SR
        f = 68 + 8 * r.random()
        x = np.sin(TAU * f * t + 0.6 * np.sin(TAU * f * 2 * t)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
        x += 0.25 * lp(r.standard_normal(len(t)), 300) * np.exp(-t / 0.08)
        a = ns(i * 0.22)
        out[a:a + len(x)] += x
    return fades(out, 0.005, 0.05)


def thumps(r, times, base=0.0, heavy=0.8):
    """running footfalls (big bird feet on dirt): soft low thumps at the given times (relative to the cue)"""
    end = (max(times) if times else 0) + 0.3
    out = np.zeros(ns(end))
    for tk in times:
        d = 0.12
        t = np.arange(ns(d)) / SR
        x = np.sin(TAU * (80 + 30 * r.random()) * t) * np.exp(-t / 0.03) * heavy + 0.3 * bp(r.standard_normal(len(t)), 300, 2500) * np.exp(-t / 0.015)
        a = ns(tk - base)
        out[a:a + len(x)] += x[: len(out) - a] * (0.7 + 0.3 * r.random())
    return fades(out, 0.001, 0.05)


def stamp(r):
    """a rubber stamp slammed on a desk: a woody thock with a paper slap"""
    d = 0.3
    t = np.arange(ns(d)) / SR
    thock = np.sin(TAU * 180 * t) * np.exp(-t / 0.03) + 0.5 * np.sin(TAU * 410 * t) * np.exp(-t / 0.02)
    slap = bp(r.standard_normal(ns(d)), 800, 5000) * np.exp(-t / 0.01)
    return fades(thock + 0.7 * slap, 0.0005, 0.05)


# ---------------------------------------------------------------- generators (Lighthouse, 2026-11-26)
def clock_tick(r, dur, rate=4.0, f0=3100.0, tock=0.82, level=1.0):
    """clockwork ticking: alternating tick / tock clinks at `rate` per second with a faint gear purr underneath"""
    n = ns(dur)
    y = np.zeros(n)
    k = 0
    t = 0.02
    while t < dur - 0.15:
        c = G.clink(r, f0 * (1.0 if k % 2 == 0 else tock), dur=0.09, bright=0.7)
        a = ns(t)
        m = min(len(c), n - a)
        y[a:a + m] += c[:m] * (0.9 if k % 2 == 0 else 0.7)
        t += 1.0 / rate * r.uniform(0.97, 1.03)
        k += 1
    y += 0.05 * bp(r.standard_normal(n), 200, 900, 1) * (0.6 + 0.4 * smooth_noise(n, r, 6.0))
    return fades(level * y, 0.01, 0.05)


def steam_whistle(r, dur=1.4, f=330.0):
    """a steamship's whistle: a breathy chord (root, fourth, sixth) with a pitch scoop and a steam hiss"""
    t = tt(dur)
    env = np.clip(t / 0.12, 0, 1) * np.clip((dur - t) / 0.35, 0, 1)
    scoop = 1.0 - 0.06 * np.exp(-t / 0.08)
    y = np.zeros(len(t))
    for m, g in ((1.0, 1.0), (1.335, 0.7), (1.68, 0.5)):
        ph = phase(f * m * scoop * (1 + 0.004 * np.sin(TAU * 5.5 * t)))
        y += g * (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph))
    y = lp(y, 2600, 2) * env
    y += 0.35 * bp(r.standard_normal(len(t)), 1500, 7000, 1) * env
    return fades(0.4 * y, 0.01, 0.1)


def render_cues(C, v_ref, on_event=None):
    """render a cue list into the stereo SFX stem: events at naive + SFX_DB LU under the voice, beds integrated"""
    out = np.zeros((2, N))
    send = np.zeros(N)
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        tgt = v_ref + c.applied
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = momentary_max(x) - v_ref if c.kind == "event" else integrated(x) - v_ref
        t0 = c.t - anchor
        place(out, x, t0)
        if on_event:
            on_event(c, x, t0)
        if c.send > 0:
            G._place_mono(send, c.send * x.mean(0), t0)
    hall = make_ir(1.6, 77, pre=0.02, hf=1.3, early=[(0.09, 0.4, -0.5), (0.17, 0.3, 0.6)])
    out += 0.5 * convolve_st(send, hall)
    out = hp(out, 25, 2)
    end = ns(T.DUR - 0.12)
    out[:, end:] *= np.linspace(1, 0, N - end)[None, :] ** 2
    return out, C



# ---------------------------------------------------------------- generators (Erysichthon)
def munch(r, big=1.0):
    """one cartoon bite/chew: a crunchy noise burst over a soft low thump"""
    d = 0.16
    n = ns(d)
    t = np.arange(n) / SR
    crunch = bp(r.standard_normal(n), 900, 5000, 1) * (np.abs(smooth_noise(n, r, 180.0)) ** 1.5) * np.exp(-t / 0.05)
    thump = np.sin(TAU * (140 - 60 * t / d) * t) * np.exp(-t / 0.04)
    return fades(big * (0.8 * crunch / (np.abs(crunch).max() + 1e-9) + 0.5 * thump), 0.002, 0.03)


def growl(r, dur=0.9, f0=70.0):
    """stomach growl: a low wobbling gurgle with bubbly flutter"""
    n = ns(dur)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.25 * np.sin(TAU * 1.3 * t) + 0.15 * smooth_noise(n, r, 6.0))
    x = np.sin(phase(f)) + 0.5 * np.sin(phase(2.03 * f)) + 0.25 * np.sin(phase(3.1 * f))
    am = 0.55 + 0.45 * np.abs(smooth_noise(n, r, 22.0))
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    gur = lp(r.standard_normal(n), 400, 2) * np.abs(smooth_noise(n, r, 30.0)) * 0.6
    return fades((x * am + gur) * env, 0.02, 0.1)


def snore(r, dur=1.8):
    """one long snore in and a soft whistle out"""
    n = ns(dur)
    t = np.arange(n) / SR
    k = np.clip(t / (dur * 0.55), 0, 1)
    rasp = bp(r.standard_normal(n), 120, 900, 1) * (0.6 + 0.4 * np.sin(TAU * 32 * t)) * np.sin(np.pi * k) * (t < dur * 0.55)
    tail = np.clip((t - dur * 0.6) / (dur * 0.4), 0, 1)
    whistle = np.sin(phase(900 - 300 * tail)) * np.sin(np.pi * tail) * 0.25 * (tail > 0)
    return fades(rasp + whistle, 0.02, 0.05)



# ---------------------------------------------------------------- generators (storm kit, 2026-11-21)
def _drops(n, r, rate, lo, hi, tau, amp_sd=0.6):
    """random drop clicks: an impulse train (rate/s, log-normal amplitudes) through a decaying band-passed kernel"""
    from scipy.signal import fftconvolve
    k = int(r.poisson(rate * n / SR))
    imp = np.zeros(n)
    np.add.at(imp, r.integers(0, n, k), r.lognormal(0.0, amp_sd, k))
    L = ns(tau * 6)
    ker = bp(r.standard_normal(L), lo, hi, 1) * np.exp(-np.arange(L) / SR / tau)
    return fftconvolve(imp, ker)[:n]


def thunder_crack(r, dist=0.0, dur=4.5):
    """a lightning strike you SEE: sharp crack + tearing crackle + rolling boom. dist 0 = right overhead (bright,
    loud crack), 1 = a few km away (dull, crack mostly gone: use rumble() for far-off storms). Anchor = the flash."""
    n = ns(dur)
    t = np.arange(n) / SR
    bright = 9000 - 7000 * dist
    crack = hp(r.standard_normal(n), 300, 2) * np.exp(-t / 0.012) * 2.2 * (1 - 0.8 * dist)
    rate = 900 * np.exp(-t / 0.18)                                            # the "rip": dense clicks thinning out
    rip = (r.random(n) < rate / SR) * r.lognormal(0, 0.5, n)
    rip = bp(lp(rip, bright, 2), 250, bright, 1) * np.exp(-t / 0.35) * 3.0 * (1 - 0.6 * dist)
    swell = np.clip(t / 0.25, 0, 1) * np.exp(-np.maximum(t - 0.25, 0) / (1.1 + 0.6 * dist))
    roll = 0.65 + 0.35 * smooth_noise(n, r, 2.5)
    boom = lp(colored(n, r, 2.0), 140 + 120 * (1 - dist), 2) * swell * roll * 2.0
    sub = np.sin(phase(42 * (1 + 0.6 * np.exp(-t / 0.15)))) * swell * 0.7
    y = lp(crack + rip, bright, 2) + boom + sub
    return fades(widen(y, r, 13.0, 0.6), 0.0005, 0.6)


def lightning_zap(r, dur=0.4):
    """the flash itself, cartoon-electric: a short buzzing sizzle with sparks (put it 0-2 f before thunder_crack
    when the bolt is on screen; skip it for a realistic storm)"""
    n = ns(dur)
    t = np.arange(n) / SR
    f = 110 * (1 + 0.05 * smooth_noise(n, r, 30.0))
    buzz = sum(np.sign(np.sin(phase(f * k))) / k for k in (1, 2, 3, 5))
    buzz = bp(buzz, 300, 6000, 1) * (0.5 + 0.5 * np.abs(smooth_noise(n, r, 40.0)))
    sparks = _drops(n, r, 260, 2500, 11000, 0.0008, 0.8)
    env = np.clip(t / 0.01, 0, 1) * np.exp(-t / 0.13)
    return fades((0.6 * buzz / (np.abs(buzz).max() + 1e-9) + sparks / (np.abs(sparks).max() + 1e-9)) * env, 0.001, 0.05)


def rain_bed(dur, r, heavy=1.0, roof=0.0, near=1.0):
    """rain bed (stereo, independent L/R): soft hiss + fine drops + a few big close drops. heavy 0.3 drizzle ..
    1 steady .. 2 downpour; roof 0..1 adds drumming on a tile / wooden roof (indoor scenes); near 0..1 = close
    splashes. Loop-free, so make it as long as the scene; add thunder_crack / rumble events on top."""
    n = ns(dur)
    out = np.zeros((2, n))
    for ch in range(2):
        hiss = bp(colored(n, r, 0.6), 500, 9000, 2) * (0.85 + 0.15 * smooth_noise(n, r, 0.3)) * 0.35 * heavy ** 0.7
        fine = _drops(n, r, 420 * heavy, 2500, 10000, 0.0015, 0.5) * 0.045
        big = _drops(n, r, 18 * heavy * near, 500, 4500, 0.006, 0.7) * 0.12 * near
        tap = _drops(n, r, 70 * heavy, 900, 3200, 0.004, 0.6) * 0.09 * roof
        out[ch] = hiss + fine + big + tap
    out /= np.abs(out).max() + 1e-9
    return fades(out, 1.0, 1.5)


# ---------------------------------------------------------------- generators (Rat Tails, 2026-11-22)
def squeak(r, f0=3000.0, k=2, d=0.07, gap=0.05):
    """rat / mouse squeak: k short pitch-bent chirps"""
    out = np.zeros(ns(k * (d + gap) + 0.05))
    for i in range(k):
        t = tt(d)
        f = f0 * (1 + 0.25 * np.sin(np.pi * t / d)) * (1 + 0.08 * r.standard_normal())
        x = np.sin(phase(f)) * np.sin(np.pi * t / d) ** 0.6
        a = ns(i * (d + gap))
        out[a:a + len(x)] += x * (0.8 + 0.2 * r.random())
    return fades(out, 0.002, 0.02)


def snip(r):
    """scissors snip: a bright metal scrape into a sharp click"""
    n = ns(0.12)
    t = np.arange(n) / SR
    scrape = bp(r.standard_normal(n), 3000, 9000, 1) * np.exp(-t / 0.03) * 0.5
    click = np.zeros(n)
    c = ns(0.06)
    click[c:c + ns(0.01)] = bp(r.standard_normal(ns(0.01)), 2000, 10000, 1) * np.exp(-np.arange(ns(0.01)) / (0.002 * SR))
    return fades(scrape + 1.6 * click, 0.001, 0.02)


def tear(r, dur=0.45):
    """paper / poster ripping: crackly band noise with a rising rip"""
    n = ns(dur)
    t = np.arange(n) / SR
    crack = (r.random(n) < 0.02 + 0.06 * t / dur) * r.standard_normal(n)
    x = bp(r.standard_normal(n), 1200, 7000, 1) * (0.3 + 0.7 * np.abs(smooth_noise(n, r, 30.0))) + 1.5 * hp(crack, 2000, 1)
    return fades(x * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.5, 0.005, 0.05)


def scurry(r, dur, rate=14.0):
    """tiny claws pattering on wood / stone"""
    return claws(r, dur, rate)
