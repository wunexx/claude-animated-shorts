# Look v3 gate (2026-11-24): brightness, colour and detail of a render vs the five reference shorts.
#   python scripts/look_stats.py out/<name>/final.mp4            (a video: 1 frame / 2 s)
#   python scripts/look_stats.py out/<name>/r1                   (a folder of stills: *.jpg / *.png)
#   python scripts/look_stats.py <ref video> --ref               (measure another reference)
# The caption band (y 62-80 %) is masked. Prints PASS / CHECK per line; run it on the round-1 stills (rendered at
# scale 1: half-size stills thin the ink lines) and on the final video. A CHECK on chroma or detail means the picture
# will read "dim and cheap" next to the references, whatever else is right.
# Reference values (5 shorts in library root, measured 2026-11-24 at 180x320, 1 frame / 2 s):
#   jar      lum .38 chroma .24 detail .075 p98 .91 dark .010
#   railroad lum .47 chroma .32 detail .074 p98 .94 dark .008
#   office   lum .58 chroma .27 detail .062 p98 .98 dark .018
#   storm    lum .36 chroma .41 detail .075 p98 1.0 dark .064
#   brain    lum .22 chroma .17 detail .041 p98 .84 dark .216   (a deliberately dark lamp-lit room)
#   ours before Look v3: Liechtenstein lum .21 chroma .14 detail .047; castle lum .51 chroma .16 detail .040
import sys, glob, os, subprocess
import numpy as np

T = {  # target ranges (the four day/mixed refs; a deliberately dark short may sit under lum, never under chroma)
    "lum": (0.33, 0.62, "median frame luma"),
    "chroma": (0.22, 0.48, "mean max-min RGB: colour intensity"),
    "detail": (0.058, 0.11, "mean |laplacian| of luma: texture / line density"),
    "p98": (0.9, 1.0, "98th percentile luma: highlights reach white"),
    "dark": (0.0, 0.08, "share of pixels with luma < .08"),
}


def frames_video(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", "fps=0.5,scale=180:320", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 320, 180, 3).astype(np.float32) / 255


def frames_dir(d):
    from PIL import Image
    fs = sorted(glob.glob(os.path.join(d, "*.jpg")) + glob.glob(os.path.join(d, "*.png")))
    fs = [f for f in fs if "sheet" not in os.path.basename(f)]
    return np.stack([np.asarray(Image.open(f).convert("RGB").resize((180, 320))) for f in fs]).astype(np.float32) / 255


def stats(a):
    keep = np.ones(320, bool); keep[198:256] = False
    a = a[:, keep]
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    mx, mn = a.max(-1), a.min(-1)
    lap = np.abs(4 * lum[:, 1:-1, 1:-1] - lum[:, :-2, 1:-1] - lum[:, 2:, 1:-1] - lum[:, 1:-1, :-2] - lum[:, 1:-1, 2:])
    return {"lum": float(np.median(lum.mean((1, 2)))), "chroma": float((mx - mn).mean()), "detail": float(lap.mean()),
            "p98": float(np.percentile(lum, 98)), "dark": float((lum < 0.08).mean())}


if __name__ == "__main__":
    src = sys.argv[1]
    a = frames_dir(src) if os.path.isdir(src) else frames_video(src)
    s = stats(a)
    print(f"LOOK {src}  ({len(a)} frames)")
    bad = 0
    for k, (lo, hi, what) in T.items():
        ok = lo <= s[k] <= hi
        bad += not ok
        print(f"  {'PASS ' if ok else 'CHECK'} {k:7s} {s[k]:.3f}   target {lo}-{hi}  ({what})")
    sys.exit(1 if bad and "--ref" not in sys.argv else 0)
