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
test "$(tr -d '[:space:]' < "$theme/ispconfig_version")" = 3.3dev
test "$(tr -d '[:space:]' < "$theme/ISPC_VERSION")" = 3.3dev

if grep -RIEq 'lorem ipsum|\bTODO\b|\bFIXME\b|themes/workbench/' "$theme"; then
  echo 'Theme contains a forbidden public-release marker.' >&2
  exit 1
fi
if grep -RIEq 'WP-[0-9]+|ispconfig-workbench-(logo|favicon)' "$theme/templates" "$theme/assets"; then
  echo 'Theme contains an internal work-package marker or obsolete public asset name.' >&2
  exit 1
fi
if find "$theme/assets/stylesheets" -maxdepth 1 -type f -name 'workbench*.css' -print -quit | grep -q .; then
  echo 'Theme contains a stylesheet in the obsolete Workbench filename namespace.' >&2
  exit 1
fi
if find "$theme/assets/javascripts" -maxdepth 1 -type f -name 'workbench-*.js' -print -quit | grep -q .; then
  echo 'Theme contains a script in the obsolete Workbench filename namespace.' >&2
  exit 1
fi
if grep -RIEq 'window\.workbench[A-Za-z0-9_]*' "$theme/assets/javascripts"; then
  echo 'Theme contains a global runtime symbol in the obsolete Workbench namespace.' >&2
  exit 1
fi
if grep -RIEq 'data-workbench-' "$theme/templates" "$theme/assets/stylesheets" "$theme/assets/javascripts"; then
  echo 'Theme contains a DOM contract in the obsolete Workbench namespace.' >&2
  exit 1
fi
if grep -RIEq 'data-wb-' "$theme/templates" "$theme/assets/stylesheets" "$theme/assets/javascripts"; then
  echo 'Theme contains a DOM contract in the retired abbreviated namespace.' >&2
  exit 1
fi
if grep -RIEq "tmpl_var[[:space:]]+name=['\"]workbench_" "$theme/templates"; then
  echo 'Theme contains a template value that requires a non-stock Workbench controller.' >&2
  exit 1
fi
if grep -RIEq 'custom_logo_action\.php|heritage-branding\.js|data-wb-branding-editor' "$theme/templates" "$theme/assets/javascripts"; then
  echo 'Theme contains the retired controller-dependent branding editor.' >&2
  exit 1
fi
if grep -RIEq 'wb-branding-manager|wb-form-profile--branding' "$theme/assets/stylesheets"; then
  echo 'Theme contains styling for the retired controller-dependent branding editor.' >&2
  exit 1
fi
if grep -RIEq "['\"]workbench:[a-z-]+" "$theme/assets/javascripts"; then
  echo 'Theme contains a custom event in the obsolete Workbench namespace.' >&2
  exit 1
fi
if grep -RIEq "dataset(\.|\[['\"])workbench" "$theme/assets/javascripts"; then
  echo 'Theme contains a dataset property in the obsolete Workbench namespace.' >&2
  exit 1
fi
if grep -RIEq 'dataset\.wb[A-Z]' "$theme/assets/javascripts"; then
  echo 'Theme contains a dataset property in the retired abbreviated namespace.' >&2
  exit 1
fi
if grep -RIEq 'workbench-(content-messages|mobile-navigation|mobile-secondary-navigation|mobile-secondary-group-|secondary-group-|tab-list-|native-tooltip|global-search-results|global-search-option-|donation-details-|language-probe)|workbenchTabChangeDialog' "$theme/templates" "$theme/assets/stylesheets" "$theme/assets/javascripts" --exclude='*.bundle.*'; then
  echo 'Theme contains a retired Workbench-owned DOM identifier.' >&2
  exit 1
fi
if grep -RIEq '\b_?workbench[A-Z][A-Za-z0-9_]*' "$theme/assets/javascripts" --exclude='*.bundle.*'; then
  echo 'Theme contains an internal JavaScript symbol in the retired Workbench namespace.' >&2
  exit 1
fi
if grep -RIEq '(^|[^A-Za-z0-9_])wb-' "$theme/templates" "$theme/assets/stylesheets" "$theme/assets/javascripts" --exclude='*.bundle.*'; then
  echo 'Theme contains a component class or design token in the retired WB namespace.' >&2
  exit 1
fi
while IFS= read -r -d '' file; do node --check "$file"; done < <(find "$theme" -type f -name '*.js' -print0)

node - "$theme" "$version" <<'NODE'
const fs = require('fs');
const path = require('path');
const theme = process.argv[2];
const releaseVersion = process.argv[3];
const projectRoot = path.resolve(theme, '..', '..');
const textExtensions = new Set(['.css', '.htm', '.html', '.js', '.json', '.md', '.xml', '.webmanifest', '.svg', '.php']);
const walk = directory => fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory() && ['.git', 'dist'].includes(entry.name)) return [];
  return entry.isDirectory() ? walk(target) : [target];
});
const themeFiles = walk(theme);

const publicReleaseContracts = new Map([
  ['README.md', [
    `### Version ${releaseVersion}`,
    `HERITAGE ${releaseVersion} herunterladen`,
    `Download HERITAGE ${releaseVersion}`,
    `--branch v${releaseVersion}`
  ]],
  ['docs/INSTALLATION-DE.md', [
    `releases/download/v${releaseVersion}/ispconfig-heritage-theme-${releaseVersion}.tar.gz`,
    `sudo tar -xzf ispconfig-heritage-theme-${releaseVersion}.tar.gz`
  ]],
  ['docs/INSTALLATION-EN.md', [
    `releases/download/v${releaseVersion}/ispconfig-heritage-theme-${releaseVersion}.tar.gz`,
    `sudo tar -xzf ispconfig-heritage-theme-${releaseVersion}.tar.gz`
  ]],
  ['docs/COMPATIBILITY.md', [`HERITAGE ${releaseVersion} targets ISPConfig 3.3.1p1`]],
  ['docs/TROUBLESHOOTING-DE.md', [`Freigabe von HERITAGE ${releaseVersion}`]],
  ['docs/TROUBLESHOOTING-EN.md', [`HERITAGE ${releaseVersion} release scope`]],
  ['CHANGELOG.md', [`## ${releaseVersion} –`]],
  [`RELEASE_NOTES_${releaseVersion}.md`, [`# ISPConfig HERITAGE ${releaseVersion}`]]
]);
for (const [relative, contracts] of publicReleaseContracts) {
  const target = path.join(projectRoot, relative);
  if (!fs.existsSync(target)) throw new Error(`Missing public release document: ${relative}`);
  const content = fs.readFileSync(target, 'utf8');
  for (const contract of contracts) {
    if (!content.includes(contract)) throw new Error(`Stale public release contract in ${relative}: ${contract}`);
  }
}
for (const relative of ['README.md', 'docs/INSTALLATION-DE.md', 'docs/INSTALLATION-EN.md']) {
  const content = fs.readFileSync(path.join(projectRoot, relative), 'utf8');
  if (/signed release|signiertes release/i.test(content)) {
    throw new Error(`${relative} claims an artifact signature that the release workflow does not create.`);
  }
}

for (const relative of ['.github/workflows/validate.yml', '.github/workflows/release.yml']) {
  const workflow = fs.readFileSync(path.join(projectRoot, relative), 'utf8');
  if (/uses:\s*[^\s@]+@v\d+/i.test(workflow)) {
    throw new Error(`${relative} contains a mutable major-version action reference.`);
  }
}
const releaseWorkflow = fs.readFileSync(path.join(projectRoot, '.github', 'workflows', 'release.yml'), 'utf8');
for (const contract of [
  'body_path: dist/RELEASE_NOTES.md',
  'fail_on_unmatched_files: true',
  'diff -u /tmp/heritage-first-build.sha256 /tmp/heritage-second-build.sha256',
  'cp "RELEASE_NOTES_$version.md" dist/RELEASE_NOTES.md',
  'node scripts/generate-sbom.js',
  'name: Attest release SBOM',
  '--require-attestation --require-sbom'
]) {
  if (!releaseWorkflow.includes(contract)) throw new Error(`Release workflow contract is missing: ${contract}`);
}
if (releaseWorkflow.indexOf('name: Build SPDX SBOM') < releaseWorkflow.indexOf('name: Verify reproducible release assets')) {
  throw new Error('SPDX SBOM must be generated after the second release build replaces dist/.');
}
if (!/name: Verify published assets\s+env:\s+GH_TOKEN: \$\{\{ github\.token \}\}/.test(releaseWorkflow)) {
  throw new Error('Public release attestation verification must receive the scoped GitHub token.');
}

const markdownFiles = walk(projectRoot).filter(file => path.extname(file).toLowerCase() === '.md' && !file.includes(`${path.sep}.git${path.sep}`));
for (const markdownFile of markdownFiles) {
  const markdown = fs.readFileSync(markdownFile, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let reference = match[1].trim().replace(/^<|>$/g, '').split('#', 1)[0];
    if (!reference || /^(?:https?:|mailto:)/i.test(reference)) continue;
    reference = decodeURIComponent(reference);
    const target = path.resolve(path.dirname(markdownFile), reference);
    if (!fs.existsSync(target)) {
      throw new Error(`Broken local Markdown link in ${path.relative(projectRoot, markdownFile)}: ${match[1]}`);
    }
  }
}
const corpus = themeFiles.filter(file => textExtensions.has(path.extname(file).toLowerCase()))
  .map(file => fs.readFileSync(file, 'utf8')).join('\n');
const assets = walk(path.join(theme, 'assets'));

const manifest = JSON.parse(fs.readFileSync(path.join(theme, 'theme-manifest.json'), 'utf8'));
const webManifest = JSON.parse(fs.readFileSync(path.join(theme, 'assets', 'favicon', 'site.webmanifest'), 'utf8'));
if (manifest.name !== 'ISPConfig HERITAGE') throw new Error(`Unexpected public theme name: ${manifest.name}`);
if (webManifest.name !== 'ISPConfig HERITAGE' || webManifest.short_name !== 'HERITAGE') {
  throw new Error('PWA branding must identify ISPConfig HERITAGE consistently.');
}
for (const logo of ['ispconfig-heritage-logo.svg', 'ispconfig-heritage-logo-dark.svg', 'ispconfig-heritage-favicon.svg']) {
  const artwork = fs.readFileSync(path.join(theme, 'assets', 'images', logo), 'utf8');
  if (!artwork.includes('<title id="title">ISPConfig HERITAGE</title>')) {
    throw new Error(`Accessible HERITAGE title is missing from ${logo}.`);
  }
  if (/Heritage Glass|>WORKBENCH</i.test(artwork)) throw new Error(`Visible legacy branding remains in ${logo}.`);
}
const unused = assets.filter(file => !corpus.includes(path.basename(file)));
if (unused.length) throw new Error(`Unreferenced assets: ${unused.map(file => path.relative(theme, file)).join(', ')}`);
const total = assets.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const authored = assets.filter(file => !/\.bundle\.(?:css|js)$/.test(file));
const largest = authored.map(file => ({file, size: fs.statSync(file).size})).sort((a, b) => b.size - a.size)[0];
if (total > 3600000) throw new Error(`Asset payload exceeds 3.6 MB source and bundle budget: ${total}`);
if (largest.size > 225000) throw new Error(`Authored asset exceeds 225 KB: ${path.basename(largest.file)} (${largest.size})`);
const styles = path.join(theme, 'assets', 'stylesheets');
const tableAuthority = fs.readFileSync(path.join(styles, 'heritage-tables.css'), 'utf8');
for (const contract of ['inline-size: 100%', ':has(.hg-row-actions > :nth-child(3))', 'justify-content: flex-end', '.hg-record-identity']) {
  if (!tableAuthority.includes(contract)) throw new Error(`Table geometry contract is missing: ${contract}`);
}
const accessibilityAuthority = fs.readFileSync(path.join(styles, 'heritage-accessibility.css'), 'utf8');
if (!accessibilityAuthority.includes("h1[data-heritage-page-focus='true']:focus-visible")) {
  throw new Error('Programmatic page-heading focus contract is missing.');
}
if (!accessibilityAuthority.includes("#pageContent:is([data-heritage-page-focus='true']")) {
  throw new Error('Programmatic page-container focus contract is missing.');
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
const compatibilityWorkbenchLiterals = [
  'ispconfig-workbench.dashboard.layout.v7',
  'ispconfig-workbench-theme',
  'ispconfig-workbench-login-username',
  'ispconfig-workbench-login-stay',
  'WORKBENCH_RELOAD:',
  "workbench: 'Workbench'"
];
for (const file of walk(path.join(theme, 'assets')).filter(file => !file.includes('.bundle.'))) {
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  let authored = fs.readFileSync(file, 'utf8');
  for (const literal of compatibilityWorkbenchLiterals) authored = authored.split(literal).join('');
  if (/workbench/i.test(authored)) throw new Error(`Unapproved Workbench-era terminology remains in ${path.relative(theme, file)}.`);
}
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
  const uncached = references.filter(reference => !/\?ver=[0-9]+(?:\.[0-9]+){2}$/.test(reference));
  if (uncached.length) throw new Error(`${shellName} has unversioned assets: ${uncached.join(', ')}`);
  const stale = references.filter(reference => reference.slice(reference.lastIndexOf('?ver=') + 5) !== releaseVersion);
  if (stale.length) throw new Error(`${shellName} has assets outside release ${releaseVersion}: ${stale.join(', ')}`);
  const normalized = references.map(reference => reference.replace(/^\.\.\//, '').replace(/\?ver=[0-9]+(?:\.[0-9]+){2}$/, ''));
  const duplicates = normalized.filter((reference, index) => normalized.indexOf(reference) !== index && !reference.endsWith('/images/ispconfig-heritage-favicon.svg'));
  if (duplicates.length) throw new Error(`${shellName} loads assets twice: ${[...new Set(duplicates)].join(', ')}`);
  const stylesheets = [...markup.matchAll(/<link[^>]+heritage-(?:app|login)\.bundle\.css\?ver=[0-9]+(?:\.[0-9]+){2}[^>]*>/g)];
  if (stylesheets.length !== 1) throw new Error(`${shellName} must load exactly one CSS bundle.`);
  const scripts = [...markup.matchAll(/<script\s+([^>]*\s)?src=["'][^"']+["'][^>]*>/g)].map(match => match[0]);
  const nonDeferred = scripts.filter(script => !script.includes('heritage-early.js') && !/(^|\s)defer(\s|=|>)/.test(script));
  if (nonDeferred.length) throw new Error(`${shellName} has parser-blocking runtime scripts: ${nonDeferred.join(', ')}`);
  const themeScripts = scripts.filter(script => script.includes('themes/heritage/assets/javascripts/'));
  const expected = shellName === 'main.tpl.htm' ? 3 : 2;
  if (themeScripts.length !== expected) throw new Error(`${shellName} must expose exactly ${expected} theme runtime scripts.`);
}
const main = fs.readFileSync(path.join(theme, 'templates', 'main.tpl.htm'), 'utf8');
const head = main.slice(0, main.toLowerCase().indexOf('</head>'));
const blocking = [...head.matchAll(/<script[^>]+src=["']([^"']*themes\/heritage\/assets\/[^"']+)["']/g)].map(match => match[1]);
if (blocking.length !== 1 || !/heritage-early\.js\?ver=[0-9]+(?:\.[0-9]+){2}$/.test(blocking[0])) {
  throw new Error('Only heritage-early.js may block authenticated-shell parsing.');
}

const login = fs.readFileSync(path.join(theme, 'templates', 'login', 'index.htm'), 'utf8');
const timeoutGuard = login.indexOf('<tmpl_if name="session_timeout" op=">" value="0">');
const endlessControl = login.indexOf('<tmpl_if name="session_allow_endless" value="y">');
if (timeoutGuard < 0 || endlessControl < timeoutGuard) {
  throw new Error('Stay-signed-in control is missing its ISPConfig session-timeout guard.');
}
const phpSort = fs.readFileSync(path.join(theme, 'templates', 'admin', 'server_php_sort_edit.htm'), 'utf8');
if (!phpSort.includes('<label for="sortprio">')) throw new Error('PHP sort-priority label contract is missing.');
const aliasDomain = fs.readFileSync(path.join(theme, 'templates', 'mail', 'mail_aliasdomain_edit.htm'), 'utf8');
if (!aliasDomain.includes('<label for="source">')) throw new Error('Alias-domain source label contract is missing.');
const mailQuota = fs.readFileSync(path.join(theme, 'templates', 'mail', 'user_quota_stats_list.htm'), 'utf8');
if (!mailQuota.includes('aria-valuenow="{tmpl_var name="percentage_sort"}"')) {
  throw new Error('Mailbox quota numeric ARIA contract is missing.');
}
console.log(`HERITAGE asset graph passed: ${assets.length} files, ${total} bytes.`);
NODE

bash -n "$root/scripts/manage-theme.sh" "$root/scripts/test-manager.sh" "$root/scripts/build-release.sh" "$root/scripts/verify-published-release.sh"
node "$root/scripts/validate-sbom.js"
"$root/scripts/test-manager.sh"
echo 'HERITAGE validation passed.'
