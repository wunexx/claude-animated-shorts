# Per-frame style metrics at 2 fps, frames scaled to 360x640, captions band (y 70-86 %) masked out.
# usage: python scripts/style_stats.py name=video.mp4 ...
import sys, subprocess, numpy as np
W, H = 360, 640
def frames(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps=2,scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32) / 255
def stats(F):
    keep = np.ones(H, bool); keep[int(.70 * H):int(.86 * H)] = False
    F = F[:, keep]
    L = F @ np.array([.2126, .7152, .0722], np.float32)
    mx, mn = F.max(-1), F.min(-1)
    sat = (mx - mn) / (mx + 1e-4)
    gx = np.abs(np.diff(L, axis=2))[:, :-1, :]; gy = np.abs(np.diff(L, axis=1))[:, :, :-1]
    g = np.hypot(gx, gy)
    out = {
        "luma median": np.median(L, axis=(1, 2)),
        "dark share <.08 (ink/shadow)": (L < .08).mean((1, 2)),
        "saturation mean": sat.mean((1, 2)),
        "edge density (grad>.08)": (g > .08).mean((1, 2)),
        "fine detail (grad .02-.08)": ((g > .02) & (g <= .08)).mean((1, 2)),
        "hard black lines (L<.06 & grad>.15)": ((L[:, :-1, :-1] < .06) & (g > .15)).mean((1, 2)),
        "luma contrast p95-p5": np.percentile(L, 95, axis=(1, 2)) - np.percentile(L, 5, axis=(1, 2)),
    }
    q = (F * 15).astype(int); codes = q[..., 0] * 256 + q[..., 1] * 16 + q[..., 2]
    out["distinct colours (16-level)"] = np.array([len(np.unique(c)) for c in codes])
    return out
res = {}
for a in sys.argv[1:]:
    n, p = a.split("=", 1)
    res[n] = stats(frames(p))
    res[n]["_n"] = len(next(iter(res[n].values())))
keys = [k for k in next(iter(res.values())) if k != "_n"]
print("metric".ljust(38) + "".join(n.rjust(12) for n in res))
print("frames".ljust(38) + "".join(str(res[n]["_n"]).rjust(12) for n in res))
for k in keys:
    print(k.ljust(38) + "".join(f"{np.median(res[n][k]):12.3f}" for n in res))
