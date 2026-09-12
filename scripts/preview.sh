#!/usr/bin/env bash
# Author: Codex app agent — 2026-09-12
set -euo pipefail
cd "$(dirname "$0")/.."
exec python3 -m http.server 5503 --bind 127.0.0.1
