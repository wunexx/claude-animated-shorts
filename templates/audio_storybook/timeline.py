# TEMPLATE (example from the Yasuke short: rewrite per short). Picture timeline of "The Legend of the Black Samurai" (Yasuke), mirrored read-only from src/videos/yasuke/story.ts +
# cast.ts so every sound lands on its frame. Times in seconds (frame / 30).
FPS = 30
TOTAL = 2115
DUR = TOTAL / FPS            # 70.5 s
fr = lambda f: f / FPS

FLASH = fr(133)
# id: (first frame, end frame, light, place)
SHOTS = {
    1: (0, 135, "day", "kyoto"), 2: (135, 372, "day", "sea"), 3: (372, 498, "day", "sea"), 4: (498, 660, "day", "kyoto"),
    5: (660, 723, "day", "kyoto"), 6: (723, 828, "day", "hall"), 7: (828, 999, "day", "hall"), 8: (999, 1164, "day", "hall"),
    9: (1164, 1269, "day", "kyoto"), 10: (1269, 1362, "day", "kyoto"), 11: (1362, 1482, "day", "hall"), 12: (1482, 1641, "day", "hall"),
    13: (1641, 1716, "night", "temple"), 14: (1716, 1761, "night", "temple"), 15: (1761, 1830, "night", "temple"),
    16: (1830, 1914, "night", "temple"), 17: (1914, TOTAL, "golden", "kyoto"),
}
# hard cuts (real place/time jumps only) -> soft whooshes; big camera flights (centre frame, length in frames, >= 30 f)
CUTS = [256, 372, 498, 660, 723, 828, 999, 1164, 1269, 1362, 1440, 1482, 1548, 1604, 1641, 1716, 1761, 1830, 1914, 1966]
GLIDES = [(111, 30), (313, 30), (475, 26), (615, 30), (814, 28), (945, 30), (1112, 24), (1810, 20)]
# story beats (s)
DOOR1, DOOR1_LAND = 1.9, 2.24
ONE_MAN = 3.52
DOCKS = 7.12
WALK0 = fr(256)
BODYGUARD = 10.02
SIX = 15.68
WORD, SHOVE, CLIMB, HURT = 18.56, 19.48, 20.26, 21.12
DOOR2, DOOR2_LAND = 23.1, 23.45
NOBUNAGA = 27.02
TRICK, INK = 29.3, 29.84
STRIPPED, SCRUB0 = 31.28, 32.25
NOTHING = 33.55
UNLUCKILY = 34.6
SHINE = 37.2
FUSS = 38.82
AFRICAN = 41.34
SNOW = 42.3
TOUCH = 44.28
DELIGHTED = 46.1
TEN = 48.38
NAME, HOUSE, MONEY, SWORD, SIDE = 50.98, 51.76, 52.46, 52.94, 53.45
NIGHT = fr(1641)
BETRAYS = 56.7
BURNS = 57.6
FIGHT0, CAPTURED = 58.7, 60.26
SHRUG, SPARE = 61.3, 63.08
GOLD = fr(1914)
VANISH = 64.15
DOOR_END = fr(1966)


def shot_t(i):
    a, b = SHOTS[i][:2]
    return fr(a), fr(b)


def words(path):
    import json
    return json.load(open(path, encoding="utf-8"))
