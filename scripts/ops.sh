#!/bin/sh
# Runs a command with everything in .env exported, which the platform CLIs (neon, vercel) need and
# a plain shell does not have. Nothing has to be exported in a shell profile.
#   scripts/ops.sh neon projects list --org-id <id>
set -eu
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "No .env: copy .env.example and fill it in." >&2; exit 1; }
set -a
. ./.env
set +a
exec "$@"
