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

## Release archive

Verify `SHA256SUMS.txt` before extraction:

```bash
sha256sum -c SHA256SUMS.txt
```

The selected archive must create `heritage` below
`/usr/local/ispconfig/interface/web/themes/`.

## Status and recovery

```bash
sudo ./scripts/manage-theme.sh status
sudo ./scripts/manage-theme.sh rollback
```

If necessary, set the affected account back to `default`. Never remove or
overwrite ISPConfig's original default theme.
