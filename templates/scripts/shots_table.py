# usage: python scripts/shots_table.py src/videos/<name>/story.ts <name>  -> out/<name>/shots.json for short_qa.py
import json, re
src = open(__import__("sys").argv[1], encoding="utf-8").read()
total = int(re.search(r"TOTAL = (\d+)", src).group(1))
shots = [{"id": int(i), "a": int(a), "b": int(b) if b != "TOTAL" else total} for i, a, b in re.findall(r"\{ id: (\d+), a: (\d+), b: (\w+),", src)]
xf = {int(k): int(v) for k, v in re.findall(r"(\d+): (\d+)", re.search(r"XFADE[^=]*= \{([^}]*)\}", src).group(1))}
flash = int(re.search(r"FLASH_AT = (-?\d+)", src).group(1))
xfade = [[s["a"] - xf[s["id"]] // 2, s["a"] + xf[s["id"]] // 2] for s in shots if s["id"] in xf]
cuts = [[int(f), int(f)] for f in re.findall(r"\{ f: (\d+), cut: true", src)]
m = re.search(r"KICK_T = \{([^}]*)\}", src)
if m:  # old format: named kick times
    kv = [float(v) for _, v in re.findall(r"(\w+): ([\d.]+)", m.group(1))]
else:  # storybook template: const KICKS: [number, number][] = [[t, gain], ...]
    km = re.search(r"const KICKS[^=]*= \[(.*?)\];", src)
    kv = [float(t) for t, _ in re.findall(r"\[([\d.]+), ([\d.]+)\]", km.group(1))] if km else []
kicks = [[round(v * 30), round(v * 30) + 8] for v in kv]
json.dump({"shots": shots, "xfade": xfade, "flash": [flash, flash + 4], "planned": cuts + kicks}, open("out/" + __import__("sys").argv[2] + "/shots.json", "w"), indent=1)
print(len(shots), "shots", xfade, flash, [c[0] for c in cuts], kicks)
