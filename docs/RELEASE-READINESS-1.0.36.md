# HERITAGE 1.0.36 release readiness

Status: **RELEASE CANDIDATE — publication gates pending**  
Candidate date: 2026-08-03  
Target: ISPConfig 3.3.1p1

## Verified candidate gates

- Theme version, manifest, release tag, active documentation and cache fingerprints agree on `1.0.36`.
- The complete theme, bundle, SPDX and managed lifecycle validators pass.
- Extended CodeQL analysis passes for GitHub Actions and JavaScript/TypeScript with zero open alerts.
- Release archives are built twice from committed Git bytes with normalized, reproducible metadata.
- The deterministic SPDX SBOM is created only after the second build and before both attestations.
- A validation contract prevents regression to the failed 1.0.35 workflow order.
- The `v1.0.35` tag is retained unchanged as an unpublished failed build.

## Publication gates

- [ ] Merge the release-candidate pull request with validation and CodeQL green.
- [ ] Rebuild from the clean final merge commit and confirm candidate hashes.
- [ ] Create and push `v1.0.36` only after the previous gates close.
- [ ] Require successful SLSA provenance and SPDX SBOM attestations.
- [ ] Download the public ZIP, TAR.GZ, checksum manifest and SBOM.
- [ ] Verify public hashes, tagged payload, manager lifecycle, provenance and SPDX predicate.

## Release boundary

HERITAGE 1.0.36 remains theme-only. It modifies no ISPConfig controller,
database, API, provisioning component, permission model or managed server
configuration. ISPConfig's original `default` theme remains the recovery path.
