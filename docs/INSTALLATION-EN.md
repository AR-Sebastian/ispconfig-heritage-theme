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

## Optional global login theme

Account selection changes the authenticated interface only. ISPConfig renders
the anonymous login from `$conf['theme']`, whose factory value is `default`.
Keep that default unless the operator explicitly approves a globally branded
login. To opt in, back up `/usr/local/ispconfig/interface/lib/config.inc.php`,
set its existing `$conf['theme']` value to `heritage`, reload the interface web
service and start a completely new anonymous session. This configuration is
owned by ISPConfig, may need review after an ISPConfig update and is
intentionally never changed by the HERITAGE installer.

The "stay logged in" control is rendered only when ISPConfig has both a
positive session timeout and endless sessions enabled. HERITAGE does not
weaken those server-side security settings.

## Verified release archive

On Linux, download the TAR.GZ archive and checksum file directly from the
release:

```bash
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.34/ispconfig-heritage-theme-1.0.34.tar.gz
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.34/SHA256SUMS.txt
sha256sum -c --ignore-missing SHA256SUMS.txt
sudo tar -xzf ispconfig-heritage-theme-1.0.34.tar.gz -C /usr/local/ispconfig/interface/web/themes/
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
