# Segment camera moves in a video with camstats' per-frame fit (zoom, roll, tx, ty), and list each move:
# start/end frame, duration, kind (pan/tilt/push/pull + direction), total screen travel, peak speed.
# usage: python moves.py video.mp4 > moves.json
import sys, json, numpy as np, av
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import skillpaths
import camstats as C
from scipy.ndimage import gaussian_filter1d


def series(path):
    c = av.open(path); st = c.streams.video[0]
    prev = None; out = []
    for fr in c.decode(st):
        g = fr.reformat(width=C.W, height=C.H, format="gray").to_ndarray().astype(np.float32)
        if prev is not None: out.append(C.fit(prev, g))
        prev = g
    ok = np.array([o is not None for o in out])
    arr = np.array([o if o is not None else [0, 0, 0, 0] for o in out], float)
    for k in range(4):
        a = arr[:, k]
        if ok.any(): a[~ok] = np.interp(np.where(~ok)[0], np.where(ok)[0], a[ok])
        arr[:, k] = gaussian_filter1d(a, 1.2)
    return arr, ok


def moves(arr, ok, thr=2.0, fps=30):
    z, tx, ty = arr[:, 0] * 734, arr[:, 2] * 2, arr[:, 3] * 2   # px/f at 720x1280
    sp = np.hypot(np.hypot(tx, ty), np.abs(z))
    on = sp >= thr
    res, i, n = [], 0, len(sp)
    while i < n:
        if not on[i]: i += 1; continue
        j = i
        while j < n and on[j]: j += 1
        if j - i >= 4:
            X, Y, Z = tx[i:j].sum(), ty[i:j].sum(), z[i:j].sum()
            kind = []
            if abs(X) > 25: kind.append("pan-left" if X > 0 else "pan-right")   # content moves right = camera pans left
            if abs(Y) > 25: kind.append("tilt-up" if Y > 0 else "tilt-down")
            if abs(Z) > 25: kind.append("push-in" if Z > 0 else "pull-out")
            res.append(dict(a=i, b=j, t=round(i / fps, 2), dur_f=j - i, kind="+".join(kind) or "small",
                            travel_px=round(float(np.hypot(np.hypot(X, Y), abs(Z)))), peak=round(float(sp[i:j].max()), 1),
                            masked=int((~ok[i:j]).sum())))
        i = j
    return res, sp


if __name__ == "__main__":
    arr, ok = series(sys.argv[1])
    res, sp = moves(arr, ok)
    big = [m for m in res if m["travel_px"] >= 60]
    print(json.dumps(dict(file=sys.argv[1], n_moves=len(res), n_big=len(big), per_min_big=round(len(big) / (len(sp) / 30) * 60, 1),
                          moves=res), indent=0))
