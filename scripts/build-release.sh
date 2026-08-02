#!/usr/bin/env bash
set -euo pipefail

# ZIP stores wall-clock timestamps. Keep them independent of the builder's
# local timezone; TAR already records the absolute SOURCE_DATE_EPOCH value.
export TZ=UTC

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(tr -d '[:space:]' < "$root/VERSION")"
dist="$root/dist"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
  echo "VERSION must be semantic x.y.z: $version" >&2
  exit 1
}
manifest="$root/theme/heritage/theme-manifest.json"
manifest_version="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version" "$manifest")"
release_date="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).releaseDate" "$manifest")"
[[ "$manifest_version" == "$version" ]] || {
  echo "Manifest version $manifest_version does not match VERSION $version" >&2
  exit 1
}
source_date_epoch="${SOURCE_DATE_EPOCH:-$(date -u -d "$release_date 00:00:00 UTC" +%s)}"
[[ "$source_date_epoch" =~ ^[0-9]+$ ]] || {
  echo "SOURCE_DATE_EPOCH must be an integer: $source_date_epoch" >&2
  exit 1
}

git -C "$root" diff --quiet -- theme/heritage || {
  echo "Release payload has unstaged changes; commit them before building." >&2
  exit 1
}
git -C "$root" diff --cached --quiet -- theme/heritage || {
  echo "Release payload has staged but uncommitted changes; commit them before building." >&2
  exit 1
}

"$root/scripts/validate-theme.sh"
rm -rf "$dist"
mkdir -p "$dist"
git -C "$root" archive --format=tar HEAD:theme heritage | tar -xf - -C "$stage"
find "$stage/heritage" -type d -exec chmod 0755 {} +
find "$stage/heritage" -type f -exec chmod 0644 {} +
find "$stage/heritage" -exec touch -h -d "@$source_date_epoch" {} +
(
  cd "$stage"
  find heritage -print | LC_ALL=C sort | zip -X -q "$dist/ispconfig-heritage-theme-$version.zip" -@
  tar --sort=name \
    --mtime="@$source_date_epoch" \
    --owner=0 --group=0 --numeric-owner \
    --pax-option=delete=atime,delete=ctime \
    -cf - heritage | gzip -n > "$dist/ispconfig-heritage-theme-$version.tar.gz"
)
(
  cd "$dist"
  sha256sum "ispconfig-heritage-theme-$version.zip" \
    "ispconfig-heritage-theme-$version.tar.gz" > SHA256SUMS.txt
)
echo "HERITAGE $version reproducible release assets created in $dist (SOURCE_DATE_EPOCH=$source_date_epoch)"
