#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
theme="$root/theme/heritage"
required=(VERSION LICENSE.md THIRD_PARTY_NOTICES.md README.md \
  theme/heritage/README.md theme/heritage/LICENSE.md \
  theme/heritage/LICENSE_SCOPE.md theme/heritage/THIRD_PARTY_NOTICES.md \
  theme/heritage/theme-manifest.json theme/heritage/ispconfig_version \
  theme/heritage/ISPC_VERSION theme/heritage/templates/main.tpl.htm \
  theme/heritage/templates/main_login.tpl.htm \
  theme/heritage/assets/stylesheets/heritage-css-bundles.json \
  theme/heritage/assets/javascripts/heritage-js-bundles.json)
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

node - "$theme" <<'NODE'
const fs = require('fs');
const path = require('path');
const theme = process.argv[2];
const textExtensions = new Set(['.css', '.htm', '.html', '.js', '.json', '.md', '.xml', '.webmanifest', '.svg', '.php']);
const walk = directory => fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const themeFiles = walk(theme);
const corpus = themeFiles.filter(file => textExtensions.has(path.extname(file).toLowerCase()))
  .map(file => fs.readFileSync(file, 'utf8')).join('\n');
const assets = walk(path.join(theme, 'assets'));
const unused = assets.filter(file => !corpus.includes(path.basename(file)));
if (unused.length) throw new Error(`Unreferenced assets: ${unused.map(file => path.relative(theme, file)).join(', ')}`);
const total = assets.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const authored = assets.filter(file => !/\.bundle\.(?:css|js)$/.test(file));
const largest = authored.map(file => ({file, size: fs.statSync(file).size})).sort((a, b) => b.size - a.size)[0];
if (total > 3600000) throw new Error(`Asset payload exceeds 3.6 MB source and bundle budget: ${total}`);
if (largest.size > 225000) throw new Error(`Authored asset exceeds 225 KB: ${path.basename(largest.file)} (${largest.size})`);
const styles = path.join(theme, 'assets', 'stylesheets');
const tableAuthority = fs.readFileSync(path.join(styles, 'heritage-tables.css'), 'utf8');
for (const contract of ['inline-size: 100%', ':has(.wb-row-actions > :nth-child(3))', 'justify-content: flex-end', '.hg-record-identity']) {
  if (!tableAuthority.includes(contract)) throw new Error(`Table geometry contract is missing: ${contract}`);
}
const accessibilityAuthority = fs.readFileSync(path.join(styles, 'heritage-accessibility.css'), 'utf8');
if (!accessibilityAuthority.includes("h1[data-workbench-page-focus='true']:focus-visible")) {
  throw new Error('Programmatic page-heading focus contract is missing.');
}
const bundles = JSON.parse(fs.readFileSync(path.join(styles, 'heritage-css-bundles.json'), 'utf8'));
for (const bundle of Object.values(bundles)) {
  const output = fs.readFileSync(path.join(styles, bundle.output), 'utf8').replace(/\r\n/g, '\n');
  let cursor = -1;
  for (const source of bundle.sources) {
    const header = `/* source: ${source} */`;
    const index = output.indexOf(header, cursor + 1);
    if (index <= cursor) throw new Error(`Missing or unordered CSS source in ${bundle.output}: ${source}`);
    const content = fs.readFileSync(path.join(styles, source), 'utf8').replace(/\r\n/g, '\n').trim();
    if (!output.includes(content)) throw new Error(`Stale CSS source in ${bundle.output}: ${source}`);
    cursor = index;
  }
}
const scriptsDirectory = path.join(theme, 'assets', 'javascripts');
const runtime = fs.readFileSync(path.join(scriptsDirectory, 'heritage-runtime.js'), 'utf8');
for (const contract of ['contentObserver.disconnect()', 'window.setTimeout(enhanceObservedContent, 24)', 'observeContent();']) {
  if (!runtime.includes(contract)) throw new Error(`Runtime observer stability contract is missing: ${contract}`);
}
for (const contract of ['identityText', 'identityLabel', "identitySummary.className = 'hg-record-identity'"]) {
  if (!runtime.includes(contract)) throw new Error(`Mobile record identity contract is missing: ${contract}`);
}
const scriptBundles = JSON.parse(fs.readFileSync(path.join(scriptsDirectory, 'heritage-js-bundles.json'), 'utf8'));
for (const bundle of Object.values(scriptBundles)) {
  const output = fs.readFileSync(path.join(scriptsDirectory, bundle.output), 'utf8').replace(/\r\n/g, '\n');
  let cursor = -1;
  for (const source of bundle.sources) {
    const header = `/* source: ${source} */`;
    const index = output.indexOf(header, cursor + 1);
    if (index <= cursor) throw new Error(`Missing or unordered JavaScript source in ${bundle.output}: ${source}`);
    const content = fs.readFileSync(path.join(scriptsDirectory, source), 'utf8').replace(/\r\n/g, '\n').trim();
    if (!output.includes(content)) throw new Error(`Stale JavaScript source in ${bundle.output}: ${source}`);
    cursor = index;
  }
}
const bundleBudgets = {
  'heritage-app-before-chart.bundle.js': 600000,
  'heritage-app-after-chart.bundle.js': 75000,
  'heritage-login.bundle.js': 75000
};
for (const [file, budget] of Object.entries(bundleBudgets)) {
  const size = fs.statSync(path.join(scriptsDirectory, file)).size;
  if (size > budget) throw new Error(`${file} exceeds its ${budget}-byte budget: ${size}`);
}
for (const shellName of ['main.tpl.htm', 'main_login.tpl.htm']) {
  const markup = fs.readFileSync(path.join(theme, 'templates', shellName), 'utf8');
  const references = [...markup.matchAll(/(?:src|href)=["']([^"']*themes\/heritage\/assets\/[^"']+)["']/g)].map(match => match[1]);
  const uncached = references.filter(reference => !/\?ver=\d+$/.test(reference));
  if (uncached.length) throw new Error(`${shellName} has unversioned assets: ${uncached.join(', ')}`);
  const normalized = references.map(reference => reference.replace(/^\.\.\//, '').replace(/\?ver=\d+$/, ''));
  const duplicates = normalized.filter((reference, index) => normalized.indexOf(reference) !== index && !reference.endsWith('/images/ispconfig-workbench-favicon.svg'));
  if (duplicates.length) throw new Error(`${shellName} loads assets twice: ${[...new Set(duplicates)].join(', ')}`);
  const stylesheets = [...markup.matchAll(/<link[^>]+heritage-(?:app|login)\.bundle\.css\?ver=\d+[^>]*>/g)];
  if (stylesheets.length !== 1) throw new Error(`${shellName} must load exactly one CSS bundle.`);
  const scripts = [...markup.matchAll(/<script\s+([^>]*\s)?src=["'][^"']+["'][^>]*>/g)].map(match => match[0]);
  const nonDeferred = scripts.filter(script => !script.includes('workbench-early.js') && !/(^|\s)defer(\s|=|>)/.test(script));
  if (nonDeferred.length) throw new Error(`${shellName} has parser-blocking runtime scripts: ${nonDeferred.join(', ')}`);
  const themeScripts = scripts.filter(script => script.includes('themes/heritage/assets/javascripts/'));
  const expected = shellName === 'main.tpl.htm' ? 3 : 2;
  if (themeScripts.length !== expected) throw new Error(`${shellName} must expose exactly ${expected} theme runtime scripts.`);
}
const main = fs.readFileSync(path.join(theme, 'templates', 'main.tpl.htm'), 'utf8');
const head = main.slice(0, main.toLowerCase().indexOf('</head>'));
const blocking = [...head.matchAll(/<script[^>]+src=["']([^"']*themes\/heritage\/assets\/[^"']+)["']/g)].map(match => match[1]);
if (blocking.length !== 1 || !/workbench-early\.js\?ver=\d+$/.test(blocking[0])) {
  throw new Error('Only workbench-early.js may block authenticated-shell parsing.');
}
console.log(`HERITAGE asset graph passed: ${assets.length} files, ${total} bytes.`);
NODE

bash -n "$root/scripts/manage-theme.sh" "$root/scripts/test-manager.sh" "$root/scripts/build-release.sh"
"$root/scripts/test-manager.sh"
echo 'HERITAGE validation passed.'
