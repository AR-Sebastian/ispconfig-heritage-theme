# Security

Do not publish credentials, customer data, hostnames or private server information in an issue.

For a suspected security issue, use GitHub's private vulnerability reporting feature for this repository. Include affected versions, impact and reproducible steps. Please allow time for assessment before public disclosure.

## Release verification

Never install an archive after a checksum, payload or provenance mismatch.
Release `v1.0.34` predates artifact attestations and an SPDX asset; verify it
with the published checksums and its exact tagged payload:

```bash
git clone --filter=blob:none https://github.com/AR-Sebastian/ispconfig-heritage-theme.git
cd ispconfig-heritage-theme
bash scripts/verify-published-release.sh 1.0.34
```

Future releases created by the current workflow additionally publish an SPDX
2.3 SBOM and GitHub/Sigstore attestations. The repository verifier downloads
the public assets, pins the release tag and signer workflow, regenerates the
SBOM and verifies both SLSA provenance and the SPDX predicate:

```bash
bash scripts/verify-published-release.sh VERSION --require-attestation --require-sbom
```

The verifier requires `curl`, `git`, `gh`, `node`, `sha256sum`, `tar`, `unzip`
and a GitHub CLI session able to read public attestations. Its accepted signer
is restricted to:

```text
AR-Sebastian/ispconfig-heritage-theme/.github/workflows/release.yml
```

## Sicherheitsprüfung von Releases

Installiere niemals ein Archiv nach einer abweichenden Prüfsumme, Payload oder
Provenienzprüfung. Release `v1.0.34` entstand vor der Einführung von
Artefaktattestierungen und SPDX-Asset; es wird mit den veröffentlichten
Prüfsummen und dem exakten Tag-Payload geprüft:

```bash
git clone --filter=blob:none https://github.com/AR-Sebastian/ispconfig-heritage-theme.git
cd ispconfig-heritage-theme
bash scripts/verify-published-release.sh 1.0.34
```

Künftige Releases aus dem aktuellen Workflow veröffentlichen zusätzlich eine
SPDX-2.3-SBOM und GitHub-/Sigstore-Attestierungen. Der folgende Aufruf lädt die
öffentlichen Assets, bindet Prüfung und Manager an den Release-Tag, erzeugt die
SBOM erneut und prüft SLSA-Provenienz sowie SPDX-Prädikat:

```bash
bash scripts/verify-published-release.sh VERSION --require-attestation --require-sbom
```
