# usage: python scripts/sheet.py <dir> <prefix> <out.jpg> [cols]  -> contact sheet of <prefix><frame>.jpg sorted by frame
import sys, glob, os, re
from PIL import Image, ImageDraw
d, pre, out = sys.argv[1], sys.argv[2], sys.argv[3]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 5
fs = sorted(glob.glob(os.path.join(d, pre + "*.jpg")), key=lambda n: int(re.findall(r"(\d+)\.jpg$", n)[0]))
w, h = 270, 480
S = Image.new("RGB", (w * cols, h * ((len(fs) + cols - 1) // cols)), "black")
for i, n in enumerate(fs):
    im = Image.open(n).resize((w, h)); ImageDraw.Draw(im).text((6, 6), re.findall(r"(\d+)\.jpg$", n)[0], fill="yellow")
    S.paste(im, ((i % cols) * w, (i // cols) * h))
S.save(out, quality=85)
print(len(fs), "frames ->", out)
