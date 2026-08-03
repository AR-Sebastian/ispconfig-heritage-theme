# ISPConfig HERITAGE 1.0.36

HERITAGE 1.0.36 is the publishable successor to the reviewed 1.0.35 candidate.
It preserves that candidate's complete runtime, security and visual baseline
while correcting the release pipeline that prevented its SBOM attestation.

## Release integrity correction

- The workflow now verifies its two independent release builds before creating
  the deterministic SPDX 2.3 SBOM.
- The second build therefore cannot remove the SBOM before GitHub attests it.
- Repository validation permanently rejects the previous unsafe step order.
- The failed `v1.0.35` build tag remains immutable and has no GitHub Release.

## Runtime hardening

- Field-search and login navigation accept only same-origin HTTP(S) targets.
- Runtime identifiers are compared as DOM attributes instead of being
  interpolated into CSS selectors.
- Authoritative JavaScript sources and generated bundles pass extended CodeQL
  analysis with no open actionable finding.

## Compatibility

- ISPConfig: `3.3.1p1`
- Internal theme compatibility marker: `3.3dev`
- PHP: 8.1 or newer
- Validated platforms: Ubuntu 22.04/24.04 and Debian 12/13 with Apache or Nginx
- Required recovery path: ISPConfig's original `default` theme remains installed
