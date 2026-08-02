'use strict';

const fs = require('fs');
const path = require('path');

const bundleSets = [
  ['theme/heritage/assets/stylesheets', 'heritage-css-bundles.json'],
  ['theme/heritage/assets/javascripts', 'heritage-js-bundles.json']
];

for (const [directory, manifestName] of bundleSets) {
  const manifestPath = path.join(directory, manifestName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  for (const bundle of Object.values(manifest)) {
    let output = `/* Generated from ${manifestName}; edit the modular sources, not this file. */\n`;
    for (const source of bundle.sources) {
      const content = fs.readFileSync(path.join(directory, source), 'utf8')
        .replace(/\r\n/g, '\n')
        .replace(/\s*$/, '');
      output += `\n/* source: ${source} */\n${content}\n`;
    }
    fs.writeFileSync(path.join(directory, bundle.output), output);
  }
}
