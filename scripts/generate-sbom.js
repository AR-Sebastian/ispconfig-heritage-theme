#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const payload = path.resolve(process.argv[2] || 'theme/heritage');
const output = path.resolve(process.argv[3] || 'dist/ispconfig-heritage-theme.spdx.json');
const manifest = JSON.parse(fs.readFileSync(path.join(payload, 'theme-manifest.json'), 'utf8'));
const version = manifest.version;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link is not allowed in SBOM payload: ${absolute}`);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function digest(algorithm, value) {
  return crypto.createHash(algorithm).update(value).digest('hex');
}

const sourceFiles = walk(payload).sort((a, b) => a.localeCompare(b, 'en'));
const files = sourceFiles.map((absolute, index) => {
  const content = fs.readFileSync(absolute);
  return {
    fileName: `./${path.relative(payload, absolute).split(path.sep).join('/')}`,
    SPDXID: `SPDXRef-File-${String(index + 1).padStart(4, '0')}`,
    checksums: [
      { algorithm: 'SHA1', checksumValue: digest('sha1', content) },
      { algorithm: 'SHA256', checksumValue: digest('sha256', content) }
    ],
    licenseConcluded: 'NOASSERTION',
    copyrightText: 'NOASSERTION'
  };
});
const verificationInput = files.map((file) => file.checksums[0].checksumValue).sort().join('');
const packageVerificationCode = digest('sha1', verificationInput);
const namespaceDigest = digest('sha256', files.map((file) => `${file.fileName}:${file.checksums[1].checksumValue}`).join('\n'));
const packageId = 'SPDXRef-Package-HERITAGE';
const document = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: `ispconfig-heritage-theme-${version}`,
  documentNamespace: `https://github.com/AR-Sebastian/ispconfig-heritage-theme/spdx/v${version}/${namespaceDigest}`,
  creationInfo: {
    created: `${manifest.releaseDate}T00:00:00Z`,
    creators: ['Tool: ispconfig-heritage-theme/scripts/generate-sbom.js']
  },
  packages: [{
    name: 'ispconfig-heritage-theme',
    SPDXID: packageId,
    versionInfo: version,
    downloadLocation: `https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/tag/v${version}`,
    filesAnalyzed: true,
    packageVerificationCode: { packageVerificationCodeValue: packageVerificationCode },
    licenseConcluded: 'NOASSERTION',
    licenseDeclared: 'NOASSERTION',
    copyrightText: 'NOASSERTION'
  }],
  files,
  relationships: [
    { spdxElementId: 'SPDXRef-DOCUMENT', relationshipType: 'DESCRIBES', relatedSpdxElement: packageId },
    ...files.map((file) => ({ spdxElementId: packageId, relationshipType: 'CONTAINS', relatedSpdxElement: file.SPDXID }))
  ]
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(`SPDX 2.3 SBOM created for HERITAGE ${version}: ${files.length} files.`);
