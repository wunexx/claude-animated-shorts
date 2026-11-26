# Sound effects + ambience beds of the Yasuke short as a cue list timed to the picture (timeline.py). Generators,
# the Cue class and the renderer live in the shared sfx_lib.py: only this file is written per short.
# User's standard mix: each EVENT has a naive level (LU relative to the voice, as max momentary loudness) and is placed
# SFX_DB = -6 dB under it; ambience BEDS (integrated) are not reduced.
from sfx_lib import *  # noqa: F401,F403  Cue, generators, dsp helpers, G (sfx_gen), T (timeline)


# ---------------------------------------------------------------- cue list
def cues():
    C = []
    R = rng(1581)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append
    sh = T.shot_t

    def bed(a, b, name, desc, fn, lvl):
        dur = b - a + 0.6
        add(Cue(a - 0.3, name, desc, lambda fn=fn, dur=dur: (fades(st(fn(dur)), 0.3, 0.3), 0.0), lvl, kind="bed", send=0.0))

    town = lambda d: 0.6 * G.breeze(d, rr(), 0.5) + 0.5 * st(G.bird_chirps(d, rr(), 0.4, "sparrow"))
    harbour = lambda d: G.breeze(d, rr(), 0.7) + 0.8 * G.water_bed(d, rr(), 0.35, 0.6)
    room = lambda d: 0.3 * G.breeze(d, rr(), 0.2, bright=300) + 0.2 * st(G.bird_chirps(d, rr(), 0.15, "sparrow"))
    night = lambda d: 0.5 * widen(G.crickets(d, rr(), 3), rr(), 9, 0.9) + 0.3 * G.breeze(d, rr(), 0.5, bright=600)
    # ---- beds
    bed(0.0, sh(1)[1], "kyoto_hook", "Kyoto street: breeze, sparrows", town, -27)
    add(Cue(0.0, "crowd_hook", "the crowd at the gate murmurs and pushes", lambda: (crowd(4.4, rr(), 16), 0.0), -19, kind="bed", send=0.05))
    bed(sh(2)[0], sh(3)[1], "harbour", "Kyushu harbour: lapping water, sea breeze", harbour, -23)
    bed(sh(4)[0], sh(5)[1], "kyoto_day", "Kyoto by day: breeze, birds", town, -27)
    env = np.clip((np.arange(ns(7.6)) / SR - 1.5) / 3.0, 0.25, 1.0)
    add(Cue(sh(4)[0] - 0.2, "crowd_grow", "the crowd grows louder as word spreads", lambda: (crowd(7.6, rr(), 22, env=env), 0.0), -18, kind="bed", send=0.05))
    bed(sh(6)[0], sh(8)[1], "hall", "the audience hall: quiet room, birds outside", room, -30)
    bed(sh(9)[0], sh(9)[1], "kyoto_stare", "street of staring faces: hushed murmur", town, -27)
    add(Cue(sh(9)[0], "crowd_hush", "a hushed, curious murmur", lambda: (crowd(3.6, rr(), 12, rate=3.4), 0.0), -24, kind="bed", send=0.05))
    bed(sh(10)[0], sh(10)[1], "snow_hush", "the hush of falling snow: soft air", lambda d: 0.5 * G.breeze(d, rr(), 0.3, bright=500), -31)
    bed(sh(11)[0], sh(12)[1], "hall2", "the hall again", room, -30)
    bed(sh(13)[0], sh(16)[1], "night", "night: crickets, breeze", night, -28)
    add(Cue(T.BURNS - 0.4, "fire", "the temple burns: roar and crackle", lambda: (st(fire_bed(T.DUR - (T.BURNS - 0.4) - 7.0, rr())), 0.0), -20, kind="bed", send=0.1))
    bed(sh(17)[0], T.DUR, "golden", "golden street: soft breeze, a far bird", lambda d: 0.7 * G.breeze(d, rr(), 0.5) + 0.3 * st(G.bird_chirps(d, rr(), 0.2, "blackbird")), -27)

    # ---- transitions
    for f in T.CUTS:
        add(Cue(T.fr(f), "cut_whoosh", f"soft whoosh on the cut at f{f}", lambda: (G.whoosh(0.5, rr(), peak=0.3, tail=0.12), 0.3), -18, send=0.05))
    # 2026-11-19 pacing study: whooshes only on real cuts (T.CUTS = place/time jumps) and BIG camera flights (T.GLIDES:
    # list only moves that travel somewhere, >= ~30 f). Not on every composition: Atlas 2's ~42 whooshes added busyness.
    for fc, L in T.GLIDES:
        if L < 30:
            continue
        add(Cue(T.fr(fc), "glide_whoosh", f"whoosh centred on the camera flight at f{fc}", lambda L=L: (G.whoosh(L / 30 + 0.3, rr(), peak=L / 60, tail=0.3), L / 60), -18))
    add(Cue(T.FLASH, "flash", "white flash: bright shimmer whoosh", lambda: (G.whoosh(0.9, rr(), peak=0.12, f_lo=1500, f_hi=6000, tail=0.3, air=0.4), 0.12), -12))

    # ---- hook: the door gives way
    add(Cue(T.DOOR1 - 0.5, "door_strain1", "the gate strains under the crowd", lambda: (G.creak(0.7, rr(), rate0=70, rate1=130, scale=0.7), 0.0), -13))
    add(Cue(T.DOOR1_LAND, "door_crash1", "the door slams flat", lambda: (crash(rr()), 0.0), -6, send=0.2))
    add(Cue(T.DOOR1_LAND + 0.15, "crowd_whoa1", "the crowd: whoa!", lambda: (whoas(rr(), 7), 0.0), -12))
    add(Cue(T.ONE_MAN - 0.05, "reveal", "the tall man revealed: a soft bright chime", lambda: (chime(rr(), 1318.5, 1.4), 0.0), -15, send=0.3))

    # ---- harbour
    add(Cue(T.DOCKS - 0.3, "ship_creak", "the ship's timbers creak as it docks", lambda: (G.creak(1.2, rr(), rate0=40, rate1=70, scale=1.4), 0.0), -15, p=0.3))
    add(Cue(T.DOCKS, "rope_thump", "mooring: a rope thrown onto the jetty", lambda: (thud(rr()), 0.0), -15, p=0.2))
    add(Cue(T.WALK0 + 0.2, "steps_jetty", "footsteps on the jetty planks", lambda: (steps(rr(), [T.WALK0 + 0.2 + 0.55 * k for k in range(7)]), 0.0), -18))
    add(Cue(T.BODYGUARD + 0.3, "gasp_porters", "the porters gasp", lambda: (gasp(rr()) + 0.6 * gasp(rr(), 1.2), 0.0), -15))
    add(Cue(T.SIX - 0.35, "slide_up", "'nearly six feet': a slide whistle up", lambda: (slide_down(rr(), 0.6, 420, 1500), 0.0), -14))

    # ---- Kyoto crowd
    add(Cue(T.WORD, "pops", "heads pop up on the roofs", lambda: (np.concatenate([blip(rr(), 500 + 60 * k) for k in range(4)]), 0.0), -16))
    for k in range(4):
        add(Cue(T.SHOVE + 0.18 * k, "oof_shove", "shoving: oofs", lambda: (G.oof(rr(), "oof"), 0.0), -15, p=0.5 * (k % 2 * 2 - 1), group="oof_shove"))
    add(Cue(T.CLIMB + 0.1, "climb", "climbers scramble onto the roofs: tiles clatter", lambda: (st(G.rattle(1.0, rr(), 22.0)), 0.0), -17))
    add(Cue(T.HURT, "hurt_thud", "someone falls: thud", lambda: (thud(rr()), 0.0), -10, p=-0.3))
    add(Cue(T.HURT + 0.05, "hurt_ow", "...ow", lambda: (G.oof(rr(), "ow"), 0.0), -13, p=-0.3))
    add(Cue(T.HURT + 0.3, "dizzy", "dizzy stars twinkle", lambda: (sparkle(rr(), 4, 2637.0, 0.09), 0.0), -18, p=-0.3))
    add(Cue(T.DOOR2 - 0.6, "door_strain2", "the mission door strains", lambda: (G.creak(0.8, rr(), rate0=60, rate1=150, scale=0.8), 0.0), -12))
    add(Cue(T.DOOR2_LAND, "door_crash2", "the door gives way: crash", lambda: (crash(rr(), 1.1), 0.0), -5, send=0.2))
    add(Cue(T.DOOR2_LAND + 0.15, "crowd_whoa2", "the crowd tumbles in: whoa", lambda: (whoas(rr(), 8), 0.0), -11))

    # ---- the hall: the ink test
    add(Cue(T.INK - 0.03, "ink_pop", "the ink pot pops up", lambda: (blip(rr(), 380, 0.8), 0.0), -14))
    add(Cue(T.STRIPPED, "cloth", "the shirt comes off: cloth swish", lambda: (G.whoosh(0.4, rr(), peak=0.12, f_lo=600, f_hi=4000, tail=0.15), 0.12), -15))
    add(Cue(T.SCRUB0, "scrub1", "the servants scrub", lambda: (st(scrub(rr(), T.UNLUCKILY - T.SCRUB0 - 1.0, 3.0)), 0.0), -16))
    add(Cue(T.NOTHING + 0.05, "nothing", "'nothing comes off': the clean cloth, a blank little ding", lambda: (chime(rr(), 1046.5, 0.8, 0.5), 0.0), -14))
    add(Cue(T.UNLUCKILY, "scrub2", "harder: frantic scrubbing", lambda: (st(scrub(rr(), T.SHINE - T.UNLUCKILY + 0.6, 5.5)), 0.0), -14))
    add(Cue(T.UNLUCKILY + 0.6, "pant_srv", "the servants puff and pant", lambda: (pant(rr(), 2.0, 3.0), 0.0), -18, p=-0.2))
    add(Cue(T.SHINE, "shine", "the skin shines: sparkles", lambda: (sparkle(rr(), 5, 2093.0, 0.12), 0.0), -12, send=0.35))

    # ---- why the fuss / snow
    add(Cue(T.AFRICAN, "ooh", "the crowd: ooh", lambda: (whoas(rr(), 6, 0.25), 0.0), -16))
    add(Cue(T.TOUCH, "snow_touch", "a flake on a fingertip: tiny chime", lambda: (chime(rr(), 2637.0, 1.2, 0.6), 0.0), -14, send=0.4))

    # ---- strength of ten, the gifts
    add(Cue(T.DELIGHTED, "laugh", "Nobunaga laughs", lambda: (np.concatenate([G.oof(rr(), "oh", base=150) for _ in range(3)]), 0.0), -15))
    add(Cue(T.TEN - 0.3, "lift_whoosh", "the rice bale swings up", lambda: (G.whoosh(0.6, rr(), peak=0.3, f_lo=200, f_hi=1500, tail=0.15), 0.3), -12))
    add(Cue(T.TEN, "lift_hit", "...and is held high: a heavy thump", lambda: (fwump(rr(), 1.0), 0.0), -10))
    add(Cue(T.TEN + 0.1, "whoa_srv", "the servants: whoa", lambda: (whoas(rr(), 3, 0.2), 0.0), -14))
    for tb, nm in [(T.HOUSE, "gift_house"), (T.MONEY, "gift_coins"), (T.SWORD, "gift_sword")]:
        add(Cue(tb, nm + "_pop", "a gift pops onto its tray", lambda: (sparkle(rr(), 2, 1760.0, 0.06), 0.0), -15, send=0.3))
    add(Cue(T.MONEY + 0.05, "coins", "a string of coins jingles", lambda: (jingle(rr()), 0.0), -13))
    add(Cue(T.SWORD + 0.05, "sword_ring", "the sword rings", lambda: (shing(rr(), 2600.0, 0.9), 0.0), -14, send=0.3))

    # ---- the betrayal at Honno-ji
    add(Cue(T.BETRAYS - 0.1, "draw", "Akechi draws his sword", lambda: (shing(rr(), 2200.0, 1.3), 0.0), -10, send=0.3))
    add(Cue(T.BURNS - 0.2, "fire_whoosh", "flames leap up the roof", lambda: (st(G.whoosh(1.4, rr(), peak=0.5, f_lo=150, f_hi=1500, tail=0.4)), 0.0), -10))
    for k in range(4):
        add(Cue(T.FIGHT0 + 0.15 + 0.38 * k, "clash", "steel on steel", lambda: (clash(rr()), 0.0), -12, p=0.3 * (k % 2 * 2 - 1), group="clash"))
    add(Cue(T.CAPTURED, "drop", "the sword drops to the gravel", lambda: (st(G.rattle(0.4, rr(), 30.0)) + 0.0, 0.0), -14))
    add(Cue(T.CAPTURED + 0.05, "spears", "spears close in", lambda: (st(G.whoosh(0.4, rr(), peak=0.1, f_lo=1500, f_hi=6000, tail=0.1)), 0.1), -16))
    add(Cue(T.SHRUG, "shrug", "the shrug: a cloth rustle", lambda: (G.whoosh(0.3, rr(), peak=0.1, f_lo=800, f_hi=4000, tail=0.1), 0.1), -18))

    # ---- vanishes
    add(Cue(T.VANISH - 0.2, "gust", "a gust of petals sweeps him away", lambda: (st(G.whoosh(1.6, rr(), peak=0.55, f_lo=300, f_hi=3000, tail=0.6, air=0.6)), 0.55), -11, send=0.3))
    add(Cue(T.VANISH + 0.3, "vanish_chime", "soft falling chime", lambda: (sparkle(rr(), 4, 2637.0, 0.14)[::-1], 0.0), -16, send=0.5))
    add(Cue(T.DOOR_END + 0.2, "door_creak_end", "the fallen door creaks in the wind", lambda: (G.creak(0.6, rr(), rate0=50, rate1=80, scale=0.6), 0.0), -20))
    return C


def render(v_ref, on_event=None):
    return render_cues(cues(), v_ref, on_event)
