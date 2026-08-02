#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="${1:-$(tr -d '[:space:]' < "$root/VERSION")}"
tag="v$version"
base_url="https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/$tag"
zip_name="ispconfig-heritage-theme-$version.zip"
tar_name="ispconfig-heritage-theme-$version.tar.gz"
audit="$(mktemp -d)"
trap 'rm -rf "$audit"' EXIT

for asset in "$zip_name" "$tar_name" SHA256SUMS.txt; do
  curl --fail --location --silent --show-error \
    --output "$audit/$asset" "$base_url/$asset"
done

verified="$(cd "$audit" && sha256sum --check SHA256SUMS.txt | tee /dev/stderr | grep -c ': OK$')"
[[ "$verified" -eq 2 ]] || {
  echo "Expected two verified release archives, got $verified." >&2
  exit 1
}

if unzip -Z1 "$audit/$zip_name" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo 'Published ZIP contains an unsafe path.' >&2
  exit 1
fi
if tar -tzf "$audit/$tar_name" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo 'Published TAR.GZ contains an unsafe path.' >&2
  exit 1
fi

mkdir -p "$audit/from-zip" "$audit/from-tar" "$audit/from-git"
unzip -q "$audit/$zip_name" -d "$audit/from-zip"
tar -xzf "$audit/$tar_name" -C "$audit/from-tar"
git -C "$root" archive --format=tar HEAD:theme heritage | tar -xf - -C "$audit/from-git"
diff -qr "$audit/from-zip/heritage" "$audit/from-tar/heritage"
diff -qr "$audit/from-git/heritage" "$audit/from-tar/heritage"

mkdir -p "$audit/package/theme" "$audit/package/scripts" "$audit/targets" "$audit/backups"
cp -a "$audit/from-tar/heritage" "$audit/package/theme/heritage"
cp "$root/scripts/manage-theme.sh" "$audit/package/scripts/manage-theme.sh"
chmod +x "$audit/package/scripts/manage-theme.sh"
manager="$audit/package/scripts/manage-theme.sh"

"$manager" install --target-root "$audit/targets" --backup-root "$audit/backups"
[[ "$(find "$audit/targets/heritage" -type d ! -perm 0755 | wc -l)" -eq 0 ]]
[[ "$(find "$audit/targets/heritage" -type f ! -perm 0644 | wc -l)" -eq 0 ]]
"$manager" install --target-root "$audit/targets" --backup-root "$audit/backups"
"$manager" rollback --target-root "$audit/targets" --backup-root "$audit/backups"
"$manager" uninstall --target-root "$audit/targets" --backup-root "$audit/backups"
"$manager" rollback --target-root "$audit/targets" --backup-root "$audit/backups"

installed_version="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version" \
  "$audit/targets/heritage/theme-manifest.json")"
[[ "$installed_version" == "$version" ]]

printf 'Published HERITAGE %s release verification passed (%s files).\n' \
  "$version" "$(find "$audit/from-tar/heritage" -type f | wc -l)"
