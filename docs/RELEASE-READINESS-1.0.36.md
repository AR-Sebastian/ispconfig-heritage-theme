# HERITAGE 1.0.36 release readiness

Status: **RELEASED — public payload and attestations verified**  
Release date: 2026-08-03  
Target: ISPConfig 3.3.1p1

## Verified candidate gates

- Theme version, manifest, release tag, active documentation and cache fingerprints agree on `1.0.36`.
- The complete theme, bundle, SPDX and managed lifecycle validators pass.
- Extended CodeQL analysis passes for GitHub Actions and JavaScript/TypeScript with zero open alerts.
- Release archives are built twice from committed Git bytes with normalized, reproducible metadata.
- The deterministic SPDX SBOM is created only after the second build and before both attestations.
- A validation contract prevents regression to the failed 1.0.35 workflow order.
- The `v1.0.35` tag is retained unchanged as an unpublished failed build.

## Closed publication gates

- [x] Release-candidate PR 16 merged with validation and CodeQL green.
- [x] Clean merge commit `d18f3334d599a78912d5769a79be678f974013af` rebuilt with candidate-identical hashes.
- [x] Immutable annotated tag `v1.0.36` created from the verified merge commit.
- [x] SLSA provenance and SPDX SBOM attestations created successfully.
- [x] Public ZIP, TAR.GZ, checksum manifest and SBOM downloaded.
- [x] Public hashes, tagged payload, manager lifecycle, provenance and SPDX predicate verified.

## Published evidence

- Release: <https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/tag/v1.0.36>
- TAR.GZ SHA-256: `c6bd8d580a8e31d681f9584dbe840db56417169f6765029fa2fb0dcdf9f9be9b`
- ZIP SHA-256: `eec47a67c5dc2ee9532a87e968863a69dddb7080aa02bc7e3def0ca7be09de9c`
- `SHA256SUMS.txt` SHA-256: `826cf6ae1f4080eb2a8f18b339f5940ccbb47599b8ab767c9c12892eab6cb790`
- SPDX SBOM SHA-256: `39e7ccf4f84a1f2cda952b57132d3b8761d2527d4ba723354e33766f6c9568da`

## Workflow incident closure

Release run `30846150776` built, reproduced, attested and published every asset,
then reported failure only because its final GitHub CLI verification process did
not receive `GH_TOKEN`. Public checksums and all three artifact attestations were
independently verified after download. PR 17 added the workflow-scoped token and
a permanent validation contract; no release asset or tag was rewritten.

## Release boundary

HERITAGE 1.0.36 remains theme-only. It modifies no ISPConfig controller,
database, API, provisioning component, permission model or managed server
configuration. ISPConfig's original `default` theme remains the recovery path.
