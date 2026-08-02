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

## Lab limitation and release decision

The saved lab snapshot is documented as ISPConfig 3.3.1p1, but both installed
core configuration files define `ISPC_APP_VERSION` as `3.3dev`. HERITAGE's
unaltered `ispconfig_version` marker correctly targets `3.3.1p1`, so ISPConfig
rejects it in that inconsistent snapshot. For this visual smoke only, the
installed lab copy of the marker was temporarily set to the exact runtime value
and the template asset query was temporarily cache-busted. Neither adjustment
exists in the repository candidate, and both are restored during teardown.

Consequently, this run proves installation, asset delivery and focused shell
behaviour in the available Debian 13 lab. It does **not** close the release gate
for an authenticated, unmodified ISPConfig 3.3.1p1 runtime. Rebuild or repair
the lab from a verified 3.3.1p1 source and repeat shell, login, Admin settings
and feature-specific acceptance before release.

No public gallery image was accepted from this run because the saved browser
profile has every dashboard widget hidden. That state is useful regression
evidence but is not representative release imagery.
