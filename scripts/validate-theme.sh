#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
theme="$root/theme/heritage"
required=(VERSION LICENSE.md THIRD_PARTY_NOTICES.md README.md \
  theme/heritage/README.md theme/heritage/LICENSE.md \
  theme/heritage/LICENSE_SCOPE.md theme/heritage/THIRD_PARTY_NOTICES.md \
  theme/heritage/theme-manifest.json theme/heritage/ispconfig_version \
  theme/heritage/ISPC_VERSION theme/heritage/templates/main.tpl.htm \
  theme/heritage/templates/main_login.tpl.htm)
for file in "${required[@]}"; do test -f "$root/$file" || { echo "Missing: $file" >&2; exit 1; }; done

node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$theme/theme-manifest.json"
version="$(tr -d '[:space:]' < "$root/VERSION")"
manifest_version="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).version" "$theme/theme-manifest.json")"
manifest_stage="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).stage" "$theme/theme-manifest.json")"
manifest_tag="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).releaseTag" "$theme/theme-manifest.json")"
test "$version" = "$manifest_version"
test "$manifest_stage" = stable
test "$manifest_tag" = "v$version"
test "$(tr -d '[:space:]' < "$theme/ispconfig_version")" = 3.3.1p1
test "$(tr -d '[:space:]' < "$theme/ISPC_VERSION")" = 3.3.1p1

if grep -RIEq 'lorem ipsum|\bTODO\b|\bFIXME\b|themes/workbench/' "$theme"; then
  echo 'Theme contains a forbidden public-release marker.' >&2
  exit 1
fi
while IFS= read -r -d '' file; do node --check "$file"; done < <(find "$theme" -type f -name '*.js' -print0)
bash -n "$root/scripts/manage-theme.sh" "$root/scripts/test-manager.sh" "$root/scripts/build-release.sh"
"$root/scripts/test-manager.sh"
echo 'HERITAGE validation passed.'
