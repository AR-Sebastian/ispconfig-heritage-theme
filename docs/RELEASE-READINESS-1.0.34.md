# HERITAGE 1.0.34 release readiness

Status: **NO-GO until every open gate below is closed**  
Candidate date: 2026-08-02  
Target: ISPConfig 3.3.1p1

## Verified candidate gates

- `VERSION`, theme manifest, tag target and public active documentation agree on `1.0.34`.
- CSS and JavaScript bundles match their ordered authoritative sources.
- Public branding, PWA metadata and SVG accessibility titles identify ISPConfig HERITAGE.
- Application and login assets use the exact `1.0.34` cache fingerprint.
- All 243 theme template overrides exist in the ISPConfig 3.3.1p1 baseline.
- No template value or branding endpoint depends on the modified Workbench controllers; shell defaults and assets are theme-owned.
- Theme-owned DOM attributes, events, identifiers, runtime symbols, component classes and CSS variables use the HERITAGE namespace.
- Retired browser preferences have explicit one-time migrations; remaining legacy literals are validator-whitelisted compatibility reads only.
- The complete template set uses the same `hg-*` component contract; no transitional `.wb-*` or `--wb-*` styling layer remains.
- JavaScript syntax, asset graph, payload budgets and UI contracts pass.
- Managed installation, update, rollback, uninstall and restore pass.
- ZIP and TAR.GZ builds are bit-for-bit reproducible and traversal-checked.
- SHA-256 verification passes for both release archives.
- Public Markdown links and active release instructions pass validation.
- GitHub Actions dependencies are commit-pinned and release notes are mandatory.

## Open release blockers

- [ ] Prove the controller-independent shell, login and Admin settings view in an authenticated, unmodified ISPConfig 3.3.1p1 runtime.
- [ ] Run authenticated 1.0.34 visual smoke tests for light and dark desktop/mobile states.
- [ ] Confirm the new HERITAGE logo and refreshed asset cache in a real ISPConfig session.
- [ ] Confirm login session controls, additional-PHP sorting, alias-domain source and mailbox quota presentation in the runtime lab.
- [ ] Review and merge the release-candidate pull request into `main` with green checks.
- [ ] Rebuild from the clean merge commit and compare the final archive hashes.
- [ ] Decide whether the existing `v1.0.20` tag requires a reconstructed GitHub Release entry; no historical publication is changed automatically.
- [ ] Create and push `v1.0.34` only after all previous blockers are closed.
- [ ] Verify the published release body, ZIP, TAR.GZ and `SHA256SUMS.txt` after the tag workflow completes.

## Release boundary

HERITAGE 1.0.34 remains theme-only. It does not modify ISPConfig core files,
controllers, permissions, databases, APIs, provisioning logic or managed server
configuration. ISPConfig's original `default` theme remains the required
recovery path.
