# HERITAGE 1.0.34 release readiness

Status: **RELEASED — all recorded gates closed**  
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
- The 1.0.34 candidate installs atomically in the Debian 13 multiserver lab and serves the expected HERITAGE CSS/JavaScript asset set.
- Authenticated desktop light, desktop dark and 390-pixel mobile-dark smoke tests confirm the HERITAGE shell, logo, theme switch and responsive navigation without horizontal overflow.
- Runtime testing exposed and repaired two theme-owned defects: an undecorated dashboard server-content wrapper now spans the full grid, and the redundant jQuery donation toggle is ignored when ISPConfig provides no jQuery runtime.
- The theme compatibility markers now match ISPConfig 3.3.1p1's stock internal ABI, `ISPC_APP_VERSION=3.3dev`; the manifest continues to identify the public 3.3.1p1 target.
- Atomic installation normalizes staged directory/file modes to `0755`/`0644`, independent of archive or Windows-transfer metadata.
- A cache-independent corrected-package rerun delivered HTTP 200 assets and rendered Dashboard, User Settings, System Config, Additional PHP, Domain Alias and Mailbox routes without console errors, overflow or retired component classes.
- The complete branch-to-`main` pre-merge audit found no ISPConfig core path, unexpected binary, secret signature or file outside the declared theme/release-tooling boundary.
- The release candidate and checkout-independent follow-up were merged through green pull requests #1 and #2; final `main` merge commit: `19056b9e1ac7b3710b1a296ecaabc7e7f6d46bbe`.
- The release builder now packages the committed Git tree and rejects uncommitted payload changes, eliminating platform-dependent checkout line endings.
- The published UTC build and a downloaded-asset verification agree: ZIP `7c10cba1bdcf3b97963f25b038861d6621b72d1240519b553c0ca26350a89ab1`, TAR.GZ `7506c43c29a033ff0e11d307c049f47d598dd92df13f176048a78ddee6aa48b2`, checksum manifest `3217f33bc1666c760c5cad25437996eb66f47b381632d9529a8f492488f6541a`.
- Post-publication cross-timezone comparison found identical payload bytes but exposed ZIP's local wall-clock metadata. The builder now forces UTC so European and GitHub runners reproduce the same public ZIP hash without rewriting the existing tag.

The detailed, reproducible evidence and the lab limitation are recorded in
[`RUNTIME-SMOKE-1.0.34.md`](RUNTIME-SMOKE-1.0.34.md).

## Open release blockers

- [x] Prove the controller-independent authenticated shell and Admin settings view in an unmodified ISPConfig 3.3.1p1 runtime.
- [x] Define account-scoped HERITAGE with stock pre-login `default` as the supported default; document and verify global HERITAGE login as an explicit operator opt-in that the package never applies automatically.
- [x] Run authenticated 1.0.34 shell smoke tests for light and dark desktop/mobile states in the available Debian 13 lab.
- [x] Confirm the new HERITAGE logo and refreshed asset cache in an authenticated ISPConfig session.
- [x] Repeat the authenticated visual gates with the corrected `3.3dev` compatibility markers and no temporary lab edits.
- [x] Confirm Additional PHP list ordering/priority and the alias-domain source contract in the runtime lab.
- [x] Confirm HERITAGE login controls in desktop/mobile light/dark states; conditional endless-session control correctly remains absent under the stock disabled lab policy.
- [x] Confirm mailbox quota presentation with an isolated 100 MiB synthetic mailbox fixture on desktop/mobile, then restore the pre-fixture VM state.
- [x] Review and merge the release-candidate pull request into `main` with green checks.
- [x] Rebuild from the clean merge commit and compare the final archive hashes.
- [x] Preserve `v1.0.20` as the existing tag-only historical state; do not reconstruct or rewrite a past GitHub Release during the 1.0.34 publication.
- [x] Create and push `v1.0.34` only after all previous blockers are closed.
- [x] Verify the published release body, ZIP, TAR.GZ and `SHA256SUMS.txt` after the tag workflow completes.

## Release boundary

HERITAGE 1.0.34 remains theme-only. It does not modify ISPConfig core files,
controllers, permissions, databases, APIs, provisioning logic or managed server
configuration. ISPConfig's original `default` theme remains the required
recovery path.
