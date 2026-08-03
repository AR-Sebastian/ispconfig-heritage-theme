# HERITAGE 1.0.35 release readiness

Status: **RELEASE CANDIDATE — publication gates pending**  
Candidate date: 2026-08-03  
Target: ISPConfig 3.3.1p1

## Verified candidate gates

- Theme version, manifest, release tag, active documentation and cache fingerprints agree on `1.0.35`.
- The complete theme, bundle, SPDX and managed lifecycle validators pass.
- Extended CodeQL analysis passes for GitHub Actions and JavaScript/TypeScript with zero open alerts.
- Same-origin navigation permits only explicit HTTP(S) targets.
- Runtime tab lookup does not interpolate identifiers into CSS selectors.
- Release archives are built from committed Git bytes with UTC timestamps and reproducible metadata.
- Branch protection, CODEOWNERS, Dependabot, secret scanning, push protection, automatic security fixes and private vulnerability reporting are active.
- Release 1.0.34 runtime evidence remains applicable because 1.0.35 changes only the identified navigation/selector security paths and release infrastructure.

## Publication gates

- [ ] Merge the release-candidate pull request with validation and CodeQL green.
- [ ] Rebuild from the clean final merge commit and record candidate hashes.
- [ ] Create and push `v1.0.35` only after the previous gates close.
- [ ] Require successful SLSA provenance and SPDX SBOM attestations.
- [ ] Download the public ZIP, TAR.GZ, checksum manifest and SBOM.
- [ ] Verify public hashes, tagged payload, manager lifecycle, provenance and SPDX predicate.

## Release boundary

HERITAGE 1.0.35 remains theme-only. It modifies no ISPConfig controller,
database, API, provisioning component, permission model or managed server
configuration. ISPConfig's original `default` theme remains the recovery path.
