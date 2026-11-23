#!/bin/bash
# Starts the Next dev server on the port .claude/launch.json expects.
# Resolves the repo root from this script's own location so it works from any
# checkout path, not just the one it was written on.
set -euo pipefail
export PATH="$HOME/.local-tools/node/bin:$PATH"
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec npm run dev -- --port 3000
