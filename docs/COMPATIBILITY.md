# Compatibility and validation scope

HERITAGE 1.0.34 targets ISPConfig 3.3.1p1 and PHP 8.1 or newer.

ISPConfig 3.3.1p1 exposes the internal theme compatibility ABI as
`ISPC_APP_VERSION=3.3dev`. The package therefore carries `3.3dev` in both
version-marker files while its manifest and documented release target remain
3.3.1p1. This is required by ISPConfig's stock theme selector and does not
expand compatibility to arbitrary development builds.

Validated platform combinations:

- Ubuntu 22.04: Apache and Nginx
- Ubuntu 24.04: Apache and Nginx
- Debian 12: Apache and Nginx
- Debian 13: Apache and Nginx

Administrator, reseller, client and mail-user shells were tested. The package
changes presentation only and does not replace ISPConfig routes, permissions,
database writes, APIs or server-side provisioning.

The original `default` theme is a required fallback and must remain installed.

Before authentication, ISPConfig renders the theme configured globally in
`$conf['theme']`; the factory value is `default`. Selecting HERITAGE for an
account affects its authenticated session but not the pre-login screen. A
HERITAGE-branded login therefore requires an explicit operator-owned global
configuration change outside this presentation-only package.
