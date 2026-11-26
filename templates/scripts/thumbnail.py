# Social-media thumbnail / cover for a finished short (YouTube Shorts, TikTok, Instagram Reels).
#
# usage: python scripts/thumbnail.py <clean_still.jpg> <out_dir> --title "TWO|SUNS" [--accent 2] [--kicker "TRUE STORY"]
#                                    [--pos top|bottom] [--zoom 1.12 --focus 0.5,0.45]
#   <clean_still.jpg>  a frame of the 2K composition rendered WITHOUT captions and labels (SKILL.md step 12):
#                      PROPS='{"captions":false,"labels":false}' COMP=<Name>Short2K node scripts/bridge-stills.mjs ... 1
#   --title   2-4 words, "|" = line break. Upper-cased.
#   --accent  1-based word numbers drawn in yellow (e.g. "2" or "1,3"); default: the last word.
#   --kicker  optional small tag above the title (<= 16 chars), red pill like the labels' accent.
#   --pos     title band near the top (default) or the bottom of the safe area: put it where it covers no face.
#   --zoom/--focus  punch in on the subject (zoom >= 1, focus = x,y as fractions of the still).
#
# Writes to <out_dir>:
#   thumb_9x16.jpg   1080x1920  cover for Shorts / TikTok / Reels upload (JPEG, < 2 MB for YouTube)
#   thumb_3x4.jpg    1080x1440  Instagram profile-grid crop preview (centre crop of the cover)
#   thumb_1x1.jpg    1080x1080  square (feed / grid on older layouts; centre crop)
#   thumb_check.jpg  the cover with the platform UI zones shaded + phone-grid sizes, for the self-check
#
# Layout rules (all crops keep the title): title block lives inside x 90..930 and y 470..1450 of the 1080x1920 cover,
# which is inside the 1:1 crop (y 420..1500), the 3:4 crop (y 240..1680), clear of the TikTok/Reels right-side buttons
# (x > 940) and the bottom caption/username area (y > 1480) and the top bar (y < 160).
import argparse, os, sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1080, 1920
INK, WHITE, HOT, ACCENT = (36, 23, 38), (255, 250, 240), (255, 216, 74), (232, 85, 61)
FONTS = ["C:/Windows/Fonts/ARLRDBD.TTF", "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf", "C:/Windows/Fonts/ariblk.ttf", "C:/Windows/Fonts/impact.ttf",
         "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf",
         "/System/Library/Fonts/Supplemental/Arial Black.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
SAFE_X0, SAFE_X1, SAFE_TOP, SAFE_BOT = 90, 930, 470, 1450


def font(size):
    for p in FONTS:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size)


def cover(img, zoom, fx, fy):
    """Fill 1080x1920, optionally punched in around (fx, fy)."""
    s = max(W / img.width, H / img.height) * zoom
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    cx, cy = fx * img.width, fy * img.height
    x0 = min(max(cx - W / 2, 0), img.width - W)
    y0 = min(max(cy - H / 2, 0), img.height - H)
    return img.crop((round(x0), round(y0), round(x0) + W, round(y0) + H))


def pop(img):
    """Thumbnails are seen tiny: a little more saturation/contrast, a soft vignette."""
    img = ImageEnhance.Color(img).enhance(1.15)
    img = ImageEnhance.Contrast(img).enhance(1.07)
    vig = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * 0.25, -H * 0.12, W * 1.25, H * 1.12), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(160))
    dark = ImageEnhance.Brightness(img).enhance(0.62)
    return Image.composite(img, dark, vig)


def band(img, y0, y1):
    """Soft dark gradient behind the title so it reads on any picture."""
    a = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(a)
    pad = 140
    for y in range(max(0, y0 - pad), min(H, y1 + pad)):
        t = 1.0 if y0 <= y <= y1 else 1 - min(abs(y - y0), abs(y - y1)) / pad
        d.line([(0, y), (W, y)], fill=int(120 * t * t))
    return Image.composite(Image.new("RGB", (W, H), INK), img, a)


def layout(lines, accent):
    """Largest size where every line fits the safe width and the block fits ~40 % of the safe height."""
    max_w, max_h = SAFE_X1 - SAFE_X0, (SAFE_BOT - SAFE_TOP) * 0.40
    for size in range(260, 60, -4):
        f = font(size)
        stroke = max(8, size // 11)  # outline both sides + drop shadow count toward the width
        ws = [f.getlength(l) + 2.9 * stroke for l in lines]
        lh = size * 1.02
        if max(ws) <= max_w and lh * len(lines) <= max_h:
            return f, size, lh
    return font(64), 64, 66


def draw_title(img, words_by_line, accent, pos, kicker):
    lines = [" ".join(w) for w in words_by_line]
    f, size, lh = layout(lines, accent)
    kf = font(max(40, int(size * 0.32)))
    kh = (kf.size * 1.6 + 24) if kicker else 0
    block = kh + lh * len(lines)
    y = SAFE_TOP + 20 if pos == "top" else SAFE_BOT - 20 - block
    img = band(img, int(y - 20), int(y + block + 10))
    d = ImageDraw.Draw(img)
    stroke = max(8, size // 11)
    if kicker:
        tw = kf.getbbox(kicker)[2]
        px, py = (W - tw) / 2 - 28, y
        d.rounded_rectangle((px, py, px + tw + 56, py + kf.size * 1.6), radius=18, fill=ACCENT, outline=INK, width=6)
        d.text((W / 2, py + kf.size * 0.8), kicker, font=kf, fill=WHITE, anchor="mm", stroke_width=4, stroke_fill=INK)
        y += kh
    n = 0
    for words in words_by_line:
        # measure the whole line, then draw word by word so accent words can change colour
        line = " ".join(words)
        lw = f.getlength(line)
        x = (W - lw) / 2
        cy = y + lh / 2
        for i, w in enumerate(words):
            n += 1
            col = HOT if n in accent else WHITE
            # drop shadow, then outlined word
            d.text((x + stroke * 0.9, cy + stroke * 1.1), w, font=f, fill=INK, anchor="lm", stroke_width=stroke, stroke_fill=INK)
            d.text((x, cy), w, font=f, fill=col, anchor="lm", stroke_width=stroke, stroke_fill=INK)
            x += f.getlength(w + " ")
        y += lh
    return img


def check_sheet(cov, out):
    """Cover with UI zones shaded, plus the 1:1 / 3:4 crop lines and phone-grid-size copies."""
    c = cov.copy().convert("RGBA")
    o = Image.new("RGBA", c.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(o)
    for box in [(0, 0, W, 160), (0, 1480, W, H), (940, 700, W, 1480)]:
        d.rectangle(box, fill=(255, 0, 80, 70))
    for y in (420, 1500):
        d.line([(0, y), (W, y)], fill=(0, 255, 255, 200), width=4)
    for y in (240, 1680):
        d.line([(0, y), (W, y)], fill=(255, 255, 0, 200), width=4)
    c = Image.alpha_composite(c, o).convert("RGB")
    sheet = Image.new("RGB", (W + 40 + 360, H), (30, 30, 30))
    sheet.paste(c, (0, 0))
    x = W + 40
    for wpx in (240, 160, 110):  # grid tiles / search results seen on a phone
        t = cov.resize((wpx, round(wpx * H / W)), Image.LANCZOS)
        sheet.paste(t, (x, 40 if wpx == 240 else (520 if wpx == 160 else 820)))
    sheet.save(out, quality=88)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("still"); ap.add_argument("out_dir")
    ap.add_argument("--title", required=True); ap.add_argument("--accent", default="")
    ap.add_argument("--kicker", default=""); ap.add_argument("--pos", choices=["top", "bottom"], default="top")
    ap.add_argument("--zoom", type=float, default=1.0); ap.add_argument("--focus", default="0.5,0.45")
    a = ap.parse_args()
    words_by_line = [l.split() for l in a.title.upper().split("|") if l.strip()]
    total = sum(len(w) for w in words_by_line)
    if total > 5:
        print(f"warning: {total} words; thumbnails read best with 2-4", file=sys.stderr)
    accent = {int(x) for x in a.accent.split(",") if x.strip()} or {total}
    fx, fy = (float(v) for v in a.focus.split(","))
    os.makedirs(a.out_dir, exist_ok=True)

    img = Image.open(a.still).convert("RGB")
    cov = draw_title(pop(cover(img, max(1.0, a.zoom), fx, fy)), words_by_line, accent, a.pos, a.kicker.upper())
    p = os.path.join(a.out_dir, "thumb_9x16.jpg")
    for q in (92, 88, 82, 75):  # YouTube rejects thumbnails over 2 MB
        cov.save(p, quality=q, optimize=True)
        if os.path.getsize(p) < 1_900_000:
            break
    cov.crop((0, 240, W, 1680)).save(os.path.join(a.out_dir, "thumb_3x4.jpg"), quality=90, optimize=True)
    cov.crop((0, 420, W, 1500)).save(os.path.join(a.out_dir, "thumb_1x1.jpg"), quality=90, optimize=True)
    check_sheet(cov, os.path.join(a.out_dir, "thumb_check.jpg"))
    print("wrote", p, f"({os.path.getsize(p) // 1024} KB) + thumb_3x4.jpg, thumb_1x1.jpg, thumb_check.jpg")


if __name__ == "__main__":
    main()
