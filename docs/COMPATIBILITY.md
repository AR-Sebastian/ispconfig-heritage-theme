# Compatibility and validation scope

HERITAGE 1.0.28 targets ISPConfig 3.3.1p1 and PHP 8.1 or newer.

Validated platform combinations:

- Ubuntu 22.04: Apache and Nginx
- Ubuntu 24.04: Apache and Nginx
- Debian 12: Apache and Nginx
- Debian 13: Apache and Nginx

Administrator, reseller, client and mail-user shells were tested. The package
changes presentation only and does not replace ISPConfig routes, permissions,
database writes, APIs or server-side provisioning.

The original `default` theme is a required fallback and must remain installed.
