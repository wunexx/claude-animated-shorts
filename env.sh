# Source before any command of a short (bash or zsh):  . ~/.claude/skills/cartoon-3d-short/env.sh
# Keeps every file this pipeline writes inside two folders: the skill (studio/) and SHORTS_LIBRARY.
if [ -n "${BASH_SOURCE:-}" ]; then _cs_src="${BASH_SOURCE[0]}"; else _cs_src="$(eval 'echo ${(%):-%x}')"; fi
export SKILL_DIR="$(cd "$(dirname "$_cs_src")" && pwd)"; unset _cs_src
if [ -z "${SHORTS_LIBRARY:-}" ]; then . "$SKILL_DIR/paths.env"; fi
export SHORTS_LIBRARY
export STUDIO="$SKILL_DIR/studio"
_c="$STUDIO/.cache"
export REMOTION_TMP="$_c/remotion-tmp" TMPDIR="$_c/tmp" TEMP="$_c/tmp" TMP="$_c/tmp"
export HF_HOME="$_c/huggingface" XDG_CACHE_HOME="$_c" npm_config_cache="$_c/npm" PIP_CACHE_DIR="$_c/pip"
export UV_CACHE_DIR="$_c/uv" UV_PYTHON_INSTALL_DIR="$_c/uv-python" UV_PYTHON_PREFERENCE=only-managed
export PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX="$_c/pycache" MPLCONFIGDIR="$_c/matplotlib"
mkdir -p "$REMOTION_TMP" "$TMPDIR" "$HF_HOME"; unset _c
[ -d "$STUDIO/.venv/bin" ] && export PATH="$STUDIO/.venv/bin:$PATH"
# ElevenLabs key from the library's .env (never print it)
if [ -z "${ELEVENLABS_API_KEY:-}" ] && [ -f "$SHORTS_LIBRARY/.env" ]; then
  export ELEVENLABS_API_KEY="$(sed -n 's/^ELEVENLABS_API_KEY=//p' "$SHORTS_LIBRARY/.env" | head -1 | tr -d '"'"'"' \r')"
fi
[ -d "$SHORTS_LIBRARY" ] || echo "env.sh: SHORTS_LIBRARY not found: $SHORTS_LIBRARY (edit paths.env)" >&2
[ -d "$STUDIO/node_modules" ] || echo "env.sh: studio not set up yet: run  bash \"$SKILL_DIR/setup.sh\"" >&2
