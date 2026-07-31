#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(tr -d '[:space:]' < "$root/VERSION")"
dist="$root/dist"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

"$root/scripts/validate-theme.sh"
rm -rf "$dist"
mkdir -p "$dist"
cp -a "$root/theme/heritage" "$stage/heritage"
(
  cd "$stage"
  zip -q -r "$dist/ispconfig-heritage-theme-$version.zip" heritage
  tar -czf "$dist/ispconfig-heritage-theme-$version.tar.gz" heritage
)
(
  cd "$dist"
  sha256sum "ispconfig-heritage-theme-$version.zip" \
    "ispconfig-heritage-theme-$version.tar.gz" > SHA256SUMS.txt
)
echo "HERITAGE release assets created in $dist"
