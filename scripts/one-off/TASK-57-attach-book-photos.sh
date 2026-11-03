#!/bin/sh
# Attaches every photo of TASK-57-book-photos.manifest to its book, one process
# per photo (see TASK-57-attach-book-photo.ts for why and for the environment).
#
#   scripts/one-off/TASK-57-attach-book-photos.sh <folder with the processed .webp files>
set -eu

[ "$#" -eq 1 ] || { echo "usage: TASK-57-attach-book-photos.sh <folder>" >&2; exit 2; }
folder=$1
here=$(cd "$(dirname "$0")" && pwd)

grep -v '^#' "$here/TASK-57-book-photos.manifest" | while IFS="$(printf '\t')" read -r _ urlSlug role stem; do
  npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 "$here/TASK-57-attach-book-photo.ts" "$urlSlug" "$folder/$stem.webp" "$role"
done
