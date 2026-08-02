#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const payload = path.join(root, 'theme', 'heritage');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'heritage-sbom-'));
const outputs = [path.join(temporary, 'first.json'), path.join(temporary, 'second.json')];

function hash(algorithm, value) {
  return crypto.createHash(algorithm).update(value).digest('hex');
}

try {
  for (const output of outputs) {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'generate-sbom.js'), payload, output], {
      encoding: 'utf8'
    });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'SBOM generation failed.');
  }
  const first = fs.readFileSync(outputs[0]);
  const second = fs.readFileSync(outputs[1]);
  if (!first.equals(second)) throw new Error('SPDX SBOM generation is not deterministic.');

  const sbom = JSON.parse(first);
  if (sbom.spdxVersion !== 'SPDX-2.3' || sbom.dataLicense !== 'CC0-1.0') {
    throw new Error('Unexpected SPDX document contract.');
  }
  const ids = new Set();
  const sha1Values = [];
  for (const file of sbom.files) {
    if (!/^\.\/[A-Za-z0-9_.\/-]+$/.test(file.fileName) || file.fileName.includes('/../')) {
      throw new Error(`Unsafe SPDX file name: ${file.fileName}`);
    }
    if (ids.has(file.SPDXID)) throw new Error(`Duplicate SPDX identifier: ${file.SPDXID}`);
    ids.add(file.SPDXID);
    const content = fs.readFileSync(path.join(payload, file.fileName.slice(2)));
    const checksums = Object.fromEntries(file.checksums.map((entry) => [entry.algorithm, entry.checksumValue]));
    if (checksums.SHA1 !== hash('sha1', content) || checksums.SHA256 !== hash('sha256', content)) {
      throw new Error(`Incorrect SPDX checksum: ${file.fileName}`);
    }
    sha1Values.push(checksums.SHA1);
  }
  const diskFiles = [];
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute); else diskFiles.push(absolute);
  });
  walk(payload);
  if (sbom.files.length !== diskFiles.length) throw new Error('SPDX file inventory is incomplete.');
  const expectedCode = hash('sha1', sha1Values.sort().join(''));
  if (sbom.packages[0].packageVerificationCode.packageVerificationCodeValue !== expectedCode) {
    throw new Error('Incorrect SPDX package verification code.');
  }
  const contains = sbom.relationships.filter((entry) => entry.relationshipType === 'CONTAINS');
  if (contains.length !== sbom.files.length || contains.some((entry) => !ids.has(entry.relatedSpdxElement))) {
    throw new Error('SPDX package/file relationships are incomplete.');
  }
  console.log(`HERITAGE SPDX contract passed: ${sbom.files.length} files.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
