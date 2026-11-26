"""The two folders this pipeline may write to, for every script (works even when env.sh was not sourced).
SKILL   = the skill folder (this file is templates/scripts/skillpaths.py; studio/scripts links here)
STUDIO  = SKILL/studio: the Remotion project, per-short work files, caches, venv (git-ignored)
LIBRARY = the output folder (paths.env / env SHORTS_LIBRARY): one folder per finished short + .env with the key
Importing it also points every cache (whisper models, temp files, bytecode) into STUDIO/.cache."""
import os, pathlib, re

SKILL = pathlib.Path(__file__).resolve().parents[2]
STUDIO = SKILL / "studio"
CACHE = STUDIO / ".cache"


def _env_file(p):
    out = {}
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$", line)
            if m and not line.lstrip().startswith("#"):
                out[m.group(1)] = m.group(2).strip().strip("'\"")
    return out


LIBRARY = pathlib.Path(os.path.expandvars(os.path.expanduser(
    os.environ.get("SHORTS_LIBRARY") or _env_file(SKILL / "paths.env").get("SHORTS_LIBRARY", ""))))

for k, v in {"HF_HOME": CACHE / "huggingface", "XDG_CACHE_HOME": CACHE, "TMPDIR": CACHE / "tmp",
             "TEMP": CACHE / "tmp", "TMP": CACHE / "tmp", "PYTHONPYCACHEPREFIX": CACHE / "pycache",
             "MPLCONFIGDIR": CACHE / "matplotlib", "REMOTION_TMP": CACHE / "remotion-tmp"}.items():
    os.environ.setdefault(k, str(v))
    if k in ("HF_HOME", "TMPDIR", "REMOTION_TMP"):
        pathlib.Path(os.environ[k]).mkdir(parents=True, exist_ok=True)
import tempfile; tempfile.tempdir = os.environ["TMPDIR"]


def elevenlabs_key():
    """env ELEVENLABS_API_KEY, else ELEVENLABS_API_KEY= in LIBRARY/.env. Never print or copy it."""
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip() or _env_file(LIBRARY / ".env").get("ELEVENLABS_API_KEY", "")
    if not k:
        raise SystemExit(f"no ElevenLabs key: add ELEVENLABS_API_KEY=... to {LIBRARY / '.env'}")
    return k


def deliver_dir(name):
    """LIBRARY/<name>/ : where the finished short's files go (step 13)."""
    d = LIBRARY / name
    d.mkdir(parents=True, exist_ok=True)
    return d
