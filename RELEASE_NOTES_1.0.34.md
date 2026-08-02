# ISPConfig HERITAGE 1.0.34

HERITAGE 1.0.34 is a focused consistency and release-integrity update for the
standalone ISPConfig 3.3.1p1 theme.

## Presentation consistency

- Public logo artwork, accessible SVG titles, PWA metadata and the theme display
  name consistently identify ISPConfig HERITAGE.
- Application, login, image and manifest assets use the complete theme version
  as one cache fingerprint, preventing mixed old and current presentation layers.
- The technical theme ID remains unchanged for installed-theme and update-path
  compatibility.

## Interface contracts

- The stay-signed-in option follows ISPConfig's session-timeout contract.
- Additional-PHP sort priority and alias-domain source labels target their
  actual form controls.
- Mailbox quota progress bars expose a valid numeric `aria-valuenow` value.

## Release integrity

- Validation protects public branding, cache fingerprints and the repaired UI
  contracts.
- ZIP and TAR.GZ artifacts normalize order, timestamps, modes, ownership and
  compression metadata for reproducible output.
- The tag workflow rebuilds artifacts twice, compares SHA-256 hashes, verifies
  `SHA256SUMS.txt` and rejects unsafe archive paths before publication.

## Compatibility

- ISPConfig: `3.3.1p1`
- PHP: 8.1 or newer
- Validated platforms: Ubuntu 22.04/24.04 and Debian 12/13 with Apache or Nginx
- Required recovery path: ISPConfig's original `default` theme remains installed

