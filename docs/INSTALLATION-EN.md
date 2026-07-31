# Installation

## Requirements

- ISPConfig `3.3.1p1`
- PHP 8.1 or newer
- shell access with permission to manage ISPConfig's theme directory
- ISPConfig's `default` theme installed as the recovery path

## Recommended repository installation

```bash
git clone https://github.com/AR-Sebastian/ispconfig-heritage-theme.git
cd ispconfig-heritage-theme
sudo ./scripts/manage-theme.sh install
```

Select HERITAGE for one test account first and sign in again.

## Signed release archive

On Linux, download the TAR.GZ archive and checksum file directly from the
release:

```bash
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.15/ispconfig-heritage-theme-1.0.15.tar.gz
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.15/SHA256SUMS.txt
sha256sum -c --ignore-missing SHA256SUMS.txt
sudo tar -xzf ispconfig-heritage-theme-1.0.15.tar.gz -C /usr/local/ispconfig/interface/web/themes/
```

Verification must report the archive as `OK`. Do not install after a checksum
warning or mismatch. The archive creates
`/usr/local/ispconfig/interface/web/themes/heritage`.

## Status and recovery

```bash
sudo ./scripts/manage-theme.sh status
sudo ./scripts/manage-theme.sh rollback
```

If necessary, set the affected account back to `default`. Never remove or
overwrite ISPConfig's original default theme.

See [troubleshooting and safe recovery](TROUBLESHOOTING-EN.md) for detailed recovery steps.
