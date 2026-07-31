# Troubleshooting and safe recovery

## HERITAGE is missing from the theme selector

Check the installation and version first:

```bash
sudo ./scripts/manage-theme.sh status
test -f /usr/local/ispconfig/interface/web/themes/heritage/ispconfig_version
cat /usr/local/ispconfig/interface/web/themes/heritage/ispconfig_version
```

The expected value is `3.3.1p1`. Other ISPConfig versions are outside the
HERITAGE 1.0.25 release scope.

## The previous theme remains visible

Sign out completely and sign in again, then verify the affected account's
theme selection. Browser cache or an existing ISPConfig session may briefly
retain the previous presentation.

## Styling or assets are missing

Verify the two central files:

```bash
test -f /usr/local/ispconfig/interface/web/themes/heritage/templates/main.tpl.htm
test -f /usr/local/ispconfig/interface/web/themes/heritage/assets/stylesheets/workbench.css
```

Reinstall the signed release if a file is missing. Do not layer files from
different HERITAGE versions.

## Return to the default theme immediately

Set the affected ISPConfig account back to `default`. To remove HERITAGE from
the filesystem afterwards:

```bash
sudo ./scripts/manage-theme.sh uninstall
```

The removed installation remains available as a managed backup. Restore the
latest managed version with:

```bash
sudo ./scripts/manage-theme.sh rollback
```

## Reporting a problem

A useful report includes:

- ISPConfig version and operating system;
- Apache or Nginx;
- role: administrator, reseller, client or mail user;
- affected page and reproducible steps;
- browser and viewport size;
- a screenshot without credentials, customer data or other secrets.

Do not report security issues publicly; follow [SECURITY.md](../SECURITY.md).
