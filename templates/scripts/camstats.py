# Camera-motion stats (SKILL.md step 4 "Keep the camera moving", checked in step 10 by retention_stats.py).
#   python scripts/camstats.py out/<name>/final.mp4 [more.mp4 ...]      -> one JSON line per video
# Method = references/reports/motion.md section 1: 9-tile sub-pixel phase-correlation similarity fit at 360x640 (tile
# bands 3-29 %, 29-56 %, 80-97 % of the height: captions excluded), Gaussian sigma 1.2 f, speed = translation (+) zoom
# x 734 px in 720x1280 px, classes hold < 0.3, drift < 2, move >= 2 px/f, moves = local speed peaks >= 6 px/f.
# Frames whose tile fit fails (cuts, heavy animation) are masked.
# Calibration 2026-11-21 (4 references in out/atlas2/reference1-4.mp4 vs our finals):
#   frames moving R 60-82 % | median speed R 3.0-5.0 px/f | moves R 51-80/min | median move peak R 10.5-15.8 px/f
#   ours (Vasa, Napoleon, Atlas 2, Yasuke, Penicillin, Erysichthon): moving 1-20 %, median 0.2-0.6, moves 0-22/min.
import sys, json, numpy as np, av
from scipy.ndimage import gaussian_filter1d
from scipy.signal import find_peaks

W, H = 360, 640
BANDS = [(0.03, 0.29), (0.29, 0.56), (0.80, 0.97)]
TILES = []
for y0, y1 in BANDS:
    for c in range(3):
        TILES.append((int(y0 * H), int(y1 * H), c * W // 3, (c + 1) * W // 3))

def win(h, w): return np.outer(np.hanning(h), np.hanning(w))
WINS = {(t[1] - t[0], t[3] - t[2]): win(t[1] - t[0], t[3] - t[2]) for t in TILES}

def pc(a, b):
    """shift of b relative to a (dx, dy), peak strength"""
    A = np.fft.fft2(a); B = np.fft.fft2(b)
    R = B * np.conj(A); R /= np.abs(R) + 1e-9
    r = np.fft.ifft2(R).real
    iy, ix = np.unravel_index(np.argmax(r), r.shape)
    h, w = r.shape
    def sub(m, c, p):
        d = m - 2 * c + p
        return 0.0 if abs(d) < 1e-12 else 0.5 * (m - p) / d
    dy = iy + sub(r[(iy - 1) % h, ix], r[iy, ix], r[(iy + 1) % h, ix])
    dx = ix + sub(r[iy, (ix - 1) % w], r[iy, ix], r[iy, (ix + 1) % w])
    if dy > h / 2: dy -= h
    if dx > w / 2: dx -= w
    return dx, dy, r[iy, ix]

def fit(prev, cur):
    P, D, S = [], [], []
    for y0, y1, x0, x1 in TILES:
        a = prev[y0:y1, x0:x1]; b = cur[y0:y1, x0:x1]
        wn = WINS[(y1 - y0, x1 - x0)]
        dx, dy, s = pc((a - a.mean()) * wn, (b - b.mean()) * wn)
        P.append(((x0 + x1) / 2 - W / 2, (y0 + y1) / 2 - H / 2)); D.append((dx, dy)); S.append(s)
    P = np.array(P); D = np.array(D); S = np.array(S)
    keep = S > 0.08
    if keep.sum() < 5: return None
    for _ in range(2):
        p, d = P[keep], D[keep]
        # d = a*p + b*perp(p) + t   (a = zoom-1, b = roll)
        A = np.zeros((2 * len(p), 4)); y = d.reshape(-1)
        A[0::2, 0] = p[:, 0]; A[0::2, 1] = -p[:, 1]; A[0::2, 2] = 1
        A[1::2, 0] = p[:, 1]; A[1::2, 1] = p[:, 0];  A[1::2, 3] = 1
        x, *_ = np.linalg.lstsq(A, y, rcond=None)
        res = np.hypot(*(A @ x - y).reshape(-1, 2).T)
        thr = max(1.0, 2.5 * np.median(res))
        nk = keep.copy(); idx = np.where(keep)[0]; nk[idx[res > thr]] = False
        if nk.sum() < 5 or (nk == keep).all(): break
        keep = nk
    if np.median(res) > 2.0: return None
    return x  # zoom-1, roll, tx, ty  (px at 360x640)

def run(path):
    c = av.open(path); st = c.streams.video[0]
    fps = float(st.average_rate)
    prev = None; out = []
    for fr in c.decode(st):
        g = fr.reformat(width=W, height=H, format="gray").to_ndarray().astype(np.float32)
        if prev is not None:
            out.append(fit(prev, g))
        prev = g
    n = len(out)
    ok = np.array([o is not None for o in out])
    z = np.array([o[0] if o is not None else 0 for o in out]); tx = np.array([o[2] if o is not None else 0 for o in out]); ty = np.array([o[3] if o is not None else 0 for o in out])
    # fill masked with neighbours before smoothing, then mask again
    for arr in (z, tx, ty):
        arr[~ok] = np.interp(np.where(~ok)[0], np.where(ok)[0], arr[ok]) if ok.any() else 0
        arr[:] = gaussian_filter1d(arr, 1.2)
    t = np.hypot(tx, ty) * 2.0            # 360x640 -> 720x1280 px
    sp = np.hypot(t, np.abs(z) * 734)
    v = sp[ok]
    pk, _ = find_peaks(np.where(ok, sp, 0), height=6, distance=6)
    dur = n / fps
    # big moves (2026-11-21, refstudy3): continuous runs >= 2 px/f lasting >= 4 f with >= 60 px of travel. References:
    # 21-28 per min, median travel 280-440 px, median length 35-54 f. Short accent nudges (~90 px) are not moves.
    on = sp >= 2.0; big = []; i = 0
    while i < n:
        if not on[i]: i += 1; continue
        j = i
        while j < n and on[j]: j += 1
        trav = float(np.hypot(np.hypot((tx[i:j] * 2).sum(), (ty[i:j] * 2).sum()), abs((z[i:j] * 734).sum())))
        if j - i >= 4 and trav >= 60: big.append((j - i, trav))
        i = j
    bigd = dict(big_per_min=round(len(big) / dur * 60, 1), big_travel_med=round(float(np.median([b[1] for b in big])), 0) if big else 0,
                big_dur_med=round(float(np.median([b[0] for b in big])), 0) if big else 0)
    return dict(**bigd, file=path, sec=round(dur, 1), masked=int((~ok).sum()),
                hold=round(100 * np.mean(v < 0.3), 1), drift=round(100 * np.mean((v >= 0.3) & (v < 2)), 1),
                move=round(100 * np.mean(v >= 2), 1), median=round(float(np.median(v)), 1), p90=round(float(np.percentile(v, 90)), 1),
                moves_per_min=round(len(pk) / dur * 60, 1), peak_med=round(float(np.median(sp[pk])), 1) if len(pk) else 0,
                fast_frames=int(((sp >= 24) & ok).sum()))

if __name__ == "__main__":
    for p in sys.argv[1:]:
        print(json.dumps(run(p)), flush=True)
