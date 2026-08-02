# HERITAGE 1.0.34 runtime smoke evidence

Date: 2026-08-02

Environment: local Debian 13 ISPConfig multiserver lab, master node

Candidate: HERITAGE 1.0.34

## Result

The candidate was installed atomically under
`/usr/local/ispconfig/interface/web/themes/heritage` and selected for the
authenticated administrator. The session loaded exactly one HERITAGE
application stylesheet, the early bootstrap, the before-Chart bundle, Chart.js
and the after-Chart bundle. No retired `wb-*` component class was present in the
authenticated shell.

The following states passed a focused browser smoke:

- 1440 x 1000 desktop light shell;
- desktop dark-theme switch;
- 390 x 844 mobile dark shell and responsive navigation;
- HERITAGE logo and `1.0.34` asset fingerprints;
- no horizontal document overflow in desktop or mobile state;
- full-width dashboard fallback content;
- no new `$ is not defined` error after loading the repaired bundle.

The run discovered two candidate defects. A raw ISPConfig dashboard wrapper was
treated as an implicit grid item and collapsed to the minimum column width.
Also, a legacy donation fragment contained a jQuery-ready handler although the
active shell did not provide jQuery. Both defects were repaired in theme-owned
CSS and JavaScript and the complete theme validator passed afterward.

A later cache-independent install test found that a Windows-to-Linux transfer
could preserve non-traversable directory modes in the staging payload. Apache
then returned 403 for HERITAGE assets. The managed installer now normalizes all
staged directories to `0755` and files to `0644` before the atomic swap; its
lifecycle test asserts both modes.

## Lab limitation and release decision

The pinned ISPConfig 3.3.1p1 archive, commit
`5005589c22794b504cd7e580a86752a93a619917`, installs
`ISPC_APP_VERSION=3.3dev` from its stock `install/tpl/config.inc.php.master`.
ISPConfig compares that internal value literally with a theme's
`ispconfig_version` marker. The earlier `3.3.1p1` marker was therefore a theme
packaging defect, not evidence of a contaminated lab. Both HERITAGE marker
files now carry the required `3.3dev` compatibility ABI while the manifest and
public support target remain 3.3.1p1.

The temporary runtime marker and cache-buster used during discovery were
restored during teardown. Repeat the shell, login, Admin settings and
feature-specific acceptance with the corrected, unmodified package before
release.

## Corrected stock-package rerun

The corrected package was then installed again without marker, template or
ISPConfig core edits. The following cache-independent checks passed from a new
browser origin:

- compatibility marker `3.3dev` matched the installed stock runtime;
- managed installation produced `0755` on the theme root and `0644` on an
  application asset;
- Apache returned HTTP 200 for the uncached early bootstrap;
- authenticated dashboard, User Settings, System Config, Additional PHP
  Versions, Domain Alias and Mailbox routes rendered without console errors;
- all five authenticated routes had zero horizontal overflow and zero retired
  `wb-*` component classes;
- Additional PHP displayed both Debian 13 nodes with its priority column;
- Domain Alias exposed the source/destination columns and Mailbox exposed its
  operational status columns, including their empty states.

The unauthenticated route correctly remained on ISPConfig's `default` theme.
Stock ISPConfig initializes pre-login rendering from `$conf['theme']`, before a
user-specific `app_theme` exists. Testing or deploying the HERITAGE login page
therefore requires an explicit global ISPConfig theme configuration decision.
The package must not silently edit that core configuration.

## Synthetic mailbox quota fixture

A temporary VM snapshot isolated a disabled synthetic mailbox at
`heritage-quota-fixture@invalid.test`. Its delivery and access states were
disabled and its quota was exactly 100 MiB. The authenticated mailbox list
rendered the fixture as one real ISPConfig row. The edit route presented the
quota as `100` with the localized `Quota (0 for unlimited)` label, visible `MB`
unit and `aria-describedby="quota-desc"` association.

At 390 x 844 pixels the quota control remained 305.7 pixels wide inside the
viewport with zero horizontal document overflow. No browser error, warning or
retired `wb-*` component class was present. The VM was restored to its
pre-fixture snapshot afterward, so no synthetic mail object remains.

## Explicit global-login opt-in

A second isolated VM snapshot temporarily changed only the installed
ISPConfig `$conf['theme']` value from `default` to `heritage`, followed by an
Apache reload and a completely renewed anonymous session. ISPConfig then
loaded exactly `heritage-login.bundle.css?ver=1.0.34` and the HERITAGE login
JavaScript bundle.

Desktop light/dark and 390 x 844 mobile-dark states passed with zero horizontal
overflow, console errors, warnings or retired `wb-*` classes. Username and
password controls exposed the correct autocomplete purposes, the username-only
remember option rendered, and the password-manager guidance remained visible.
The form measured 319.1 pixels wide inside the compact viewport.

The lab policy reported `session_timeout=0` and `session_allow_endless=0`, so
ISPConfig correctly omitted its conditional "stay logged in" option. HERITAGE
did not override that security decision. The VM was restored to its pre-test
snapshot, leaving the stock global `default` login configuration intact.

No public gallery image was accepted from this run because the saved browser
profile has every dashboard widget hidden. That state is useful regression
evidence but is not representative release imagery.
