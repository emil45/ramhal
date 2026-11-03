#!/bin/sh
# Turns the owner's phone photos into storefront-ready book pictures.
#
#   scripts/book-photos/process.sh <folder of .HEIC photos> <manifest> <output folder>
#
# The manifest is the tab-separated file a one-off script attaches to books
# (scripts/one-off/TASK-57-book-photos.manifest): its first column names the
# photo, its fourth the output file. macOS only — the cut-out uses Vision.
# Needs Python 3 with Pillow and NumPy.
set -eu

[ "$#" -eq 3 ] || { echo "usage: process.sh <photo folder> <manifest> <output folder>" >&2; exit 2; }
photos=$1
manifest=$2
output=$3
here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

swiftc -O "$here/cutout.swift" -o "$work/cutout"
mkdir -p "$output"

grep -v '^#' "$manifest" | while IFS="$(printf '\t')" read -r photo _ _ stem; do
  "$work/cutout" "$photos/$photo.HEIC" "$work/$photo.png"
  python3 -I "$here/compose.py" "$work/$photo.png" "$output/$stem.webp"
  rm "$work/$photo.png"
  echo "$photo -> $stem.webp"
done
