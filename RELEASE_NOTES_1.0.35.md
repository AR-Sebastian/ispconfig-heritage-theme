# ISPConfig HERITAGE 1.0.35

HERITAGE 1.0.35 is a security, supply-chain and release-governance maintenance
release for the standalone ISPConfig 3.3.1p1 theme.

## Runtime hardening

- Field-search and login navigation accept only same-origin HTTP(S) targets.
- Runtime identifiers are compared as DOM attributes instead of being
  interpolated into CSS selectors.
- Repeated field-search count placeholders are replaced consistently.
- Authoritative JavaScript sources and generated bundles pass extended CodeQL
  analysis with no open actionable finding.

## Release integrity

- ZIP and TAR.GZ artifacts are built from the committed Git tree with normalized
  UTC timestamps, modes, ownership, ordering and compression metadata.
- The release workflow rebuilds and compares artifacts before publication, then
  downloads and verifies the public assets again.
- GitHub/Sigstore attestations bind every published asset to the pinned release
  workflow and its SLSA provenance.
- A deterministic SPDX 2.3 SBOM inventories all theme files and is regenerated
  from the tagged payload during public verification.

## Repository security

- CodeQL default setup analyzes GitHub Actions and JavaScript/TypeScript with the
  extended query suite.
- Branch protection requires an up-to-date validation check and resolved review
  conversations while preventing force pushes and deletion of `main`.
- CODEOWNERS, Dependabot updates, secret scanning, push protection, automatic
  security fixes and private vulnerability reporting are enabled.

## Compatibility

- ISPConfig: `3.3.1p1`
- Internal theme compatibility marker: `3.3dev`
- PHP: 8.1 or newer
- Validated platforms: Ubuntu 22.04/24.04 and Debian 12/13 with Apache or Nginx
- Required recovery path: ISPConfig's original `default` theme remains installed
