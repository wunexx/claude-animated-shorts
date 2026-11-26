#!/usr/bin/env bash
# Builds studio/ (the Remotion project + Python venv) INSIDE the skill folder. Safe to re-run.
# Writes nothing outside the skill: caches and temp files go to studio/.cache (env.sh).
set -euo pipefail
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/env.sh" 2>/dev/null || true
T="$SKILL_DIR/templates/project"
mkdir -p "$STUDIO/src/videos" "$STUDIO/public" "$STUDIO/out"
cd "$STUDIO"
[ -f package.json ]   || cp "$T/package.json" package.json
[ -f tsconfig.json ]  || cp "$T/tsconfig.json" tsconfig.json
[ -f src/index.ts ]   || cp "$T/index.ts" src/index.ts
if [ ! -f src/Root.tsx ]; then cat > src/Root.tsx <<'TSX'
import React from "react";
import { Composition } from "remotion";
// Register each short here (SKILL.md step 4): <Name>Short 1080x1920 (stills) + <Name>Short2K 1440x2560 (final), e.g.
// import { BridgeShort, BRIDGE_FRAMES } from "./videos/<name>/Bridge";
// <Composition id="<Name>Short" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
export const RemotionRoot: React.FC = () => <></>;
TSX
fi
ln -sfn ../templates/scripts scripts          # run the template scripts in place: a fix there is the template fix
command -v node >/dev/null && command -v ffmpeg >/dev/null && command -v python3 >/dev/null \
  || { echo "setup: needs node, ffmpeg and python3 on PATH" >&2; exit 1; }
npm install --no-audit --no-fund --legacy-peer-deps
npx remotion browser ensure                    # Remotion's headless browser, kept inside node_modules
# Python 3.12 for every machine (the system python may be too new for av / faster-whisper wheels: 3.15 failed).
PY_DEPS="scipy numpy pillow av faster-whisper"
if [ -x .venv/bin/python ] && ! .venv/bin/python -c 'import sys; assert sys.version_info[:2] == (3, 12)' 2>/dev/null; then rm -rf .venv; fi
if command -v uv >/dev/null; then                 # preferred: uv puts its own Python 3.12 into studio/.cache/uv-python
  [ -x .venv/bin/python ] || uv venv --python 3.12 .venv
  uv pip install --python .venv/bin/python $PY_DEPS
else
  PYB="$(command -v python3.12 || command -v python3.11 || true)"
  [ -n "$PYB" ] || { echo "setup: needs uv (brew install uv) or python3.12 on PATH" >&2; exit 1; }
  [ -x .venv/bin/python ] || "$PYB" -m venv .venv
  .venv/bin/python -m pip install -q --upgrade pip && .venv/bin/python -m pip install -q $PY_DEPS
fi
# smoke test: one box in a ThreeCanvas (never a template), proves bundler + headless browser + WebGL work here
mkdir -p src/_smoke && cp "$T/smoke.tsx" src/_smoke/index.tsx
BRIDGE_ENTRY=src/_smoke/index.tsx COMP=Smoke node scripts/bridge-stills.mjs "$STUDIO/.cache/smoke_" 15 1
[ -s "$STUDIO/.cache/smoke_15.jpg" ] && echo "smoke still OK: $STUDIO/.cache/smoke_15.jpg" || { echo "smoke still FAILED" >&2; exit 1; }
echo "studio ready: $STUDIO"
echo "library: $SHORTS_LIBRARY $( [ -d "$SHORTS_LIBRARY" ] && echo '(found)' || echo '(MISSING: edit paths.env)')"
