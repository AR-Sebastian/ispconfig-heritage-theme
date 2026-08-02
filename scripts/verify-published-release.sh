#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="${1:-$(tr -d '[:space:]' < "$root/VERSION")}"
if (($#)); then shift; fi
require_attestation=0
require_sbom=0
while (($#)); do
  case "$1" in
    --require-attestation) require_attestation=1 ;;
    --require-sbom) require_sbom=1 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done
tag="v$version"
base_url="https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/$tag"
zip_name="ispconfig-heritage-theme-$version.zip"
tar_name="ispconfig-heritage-theme-$version.tar.gz"
sbom_name="ispconfig-heritage-theme-$version.spdx.json"
audit="$(mktemp -d)"
trap 'rm -rf "$audit"' EXIT

if ! git -C "$root" rev-parse --verify --quiet "$tag^{commit}" >/dev/null; then
  git -C "$root" fetch --quiet origin "refs/tags/$tag:refs/tags/$tag"
fi
tag_commit="$(git -C "$root" rev-parse --verify "$tag^{commit}")"

for asset in "$zip_name" "$tar_name" SHA256SUMS.txt; do
  curl --fail --location --silent --show-error \
    --retry 5 --retry-all-errors --retry-delay 2 \
    --output "$audit/$asset" "$base_url/$asset"
done
if ((require_sbom)); then
  curl --fail --location --silent --show-error \
    --retry 5 --retry-all-errors --retry-delay 2 \
    --output "$audit/$sbom_name" "$base_url/$sbom_name"
fi

actual_manifest="$(awk 'NF == 2 { print $2 }' "$audit/SHA256SUMS.txt" | LC_ALL=C sort)"
expected_manifest="$(printf '%s\n' "$tar_name" "$zip_name" | LC_ALL=C sort)"
[[ "$actual_manifest" == "$expected_manifest" ]] || {
  echo 'SHA256SUMS.txt does not contain exactly the two expected archives.' >&2
  exit 1
}
verified="$(cd "$audit" && sha256sum --check SHA256SUMS.txt | tee /dev/stderr | grep -c ': OK$')"
[[ "$verified" -eq 2 ]] || {
  echo "Expected two verified release archives, got $verified." >&2
  exit 1
}

if ((require_attestation)); then
  command -v gh >/dev/null || {
    echo 'GitHub CLI is required for provenance verification.' >&2
    exit 1
  }
  for asset in "$zip_name" "$tar_name" SHA256SUMS.txt; do
    gh attestation verify "$audit/$asset" \
      --repo AR-Sebastian/ispconfig-heritage-theme \
      --signer-workflow AR-Sebastian/ispconfig-heritage-theme/.github/workflows/release.yml
  done
  if ((require_sbom)); then
    gh attestation verify "$audit/$sbom_name" \
      --repo AR-Sebastian/ispconfig-heritage-theme \
      --signer-workflow AR-Sebastian/ispconfig-heritage-theme/.github/workflows/release.yml
    for asset in "$zip_name" "$tar_name"; do
      gh attestation verify "$audit/$asset" \
        --repo AR-Sebastian/ispconfig-heritage-theme \
        --signer-workflow AR-Sebastian/ispconfig-heritage-theme/.github/workflows/release.yml \
        --predicate-type https://spdx.dev/Document
    done
  fi
fi

if unzip -Z1 "$audit/$zip_name" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo 'Published ZIP contains an unsafe path.' >&2
  exit 1
fi
if unzip -Z1 "$audit/$zip_name" | grep -Ev '^heritage(/|$)' | grep -q .; then
  echo 'Published ZIP contains an unexpected top-level path.' >&2
  exit 1
fi
if tar -tzf "$audit/$tar_name" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo 'Published TAR.GZ contains an unsafe path.' >&2
  exit 1
fi
if tar -tzf "$audit/$tar_name" | grep -Ev '^heritage(/|$)' | grep -q .; then
  echo 'Published TAR.GZ contains an unexpected top-level path.' >&2
  exit 1
fi

mkdir -p "$audit/from-zip" "$audit/from-tar" "$audit/from-git"
unzip -q "$audit/$zip_name" -d "$audit/from-zip"
tar -xzf "$audit/$tar_name" -C "$audit/from-tar"
[[ -z "$(find "$audit/from-zip" "$audit/from-tar" -type l -print -quit)" ]] || {
  echo 'Published release contains a symbolic link.' >&2
  exit 1
}
git -C "$root" archive --format=tar "$tag_commit:theme" heritage | tar -xf - -C "$audit/from-git"
diff -qr "$audit/from-zip/heritage" "$audit/from-tar/heritage"
diff -qr "$audit/from-git/heritage" "$audit/from-tar/heritage"

if ((require_sbom)); then
  git -C "$root" show "$tag_commit:scripts/generate-sbom.js" > "$audit/generate-sbom.js"
  node "$audit/generate-sbom.js" "$audit/from-tar/heritage" "$audit/expected.spdx.json"
  cmp "$audit/expected.spdx.json" "$audit/$sbom_name"
fi

mkdir -p "$audit/package/theme" "$audit/package/scripts" "$audit/targets" "$audit/backups"
cp -a "$audit/from-tar/heritage" "$audit/package/theme/heritage"
git -C "$root" show "$tag_commit:scripts/manage-theme.sh" > "$audit/package/scripts/manage-theme.sh"
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
