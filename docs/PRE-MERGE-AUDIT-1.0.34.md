# HERITAGE 1.0.34 pre-merge audit

Date: 2026-08-02

Base: `e010e09af6b391b090d7770a83c5f3f78ccb9a24` (`origin/main` merge base)

Candidate: `f382c8c99226ef0a97c1d353b112562b1a0c751e`

## Scope result

The branch changes 367 paths. Every path is within the HERITAGE payload,
public documentation, release notes, repository automation or theme-specific
build/validation tooling. No ISPConfig interface controller, server component,
installer source, database schema, API or provisioning path is part of the
diff.

The only binary changes are the four intentional 1.0.33 gallery PNG files.
There is no unexpected large tracked file and the changed-file scan found no
private-key header, embedded API key or password assignment signature.

GitHub reports the pull request mergeable with both validation runs successful.

## Reproducible candidate artifacts

An interrupted local double-build was discarded because its first comparison
point could have been produced by the terminated process. Two subsequent,
fully completed builds produced identical ZIP, TAR.GZ and checksum manifests:

- ZIP: `fcce5674ac92f12c1c937520f8d563a92965d974d1a0da6f1fca143b5f225d26`
- TAR.GZ: `4e83ea55c707893f17811560efc64b33415f45a37bcf5ed70d40e920c2a7de57`
- SHA256SUMS.txt: `3528b18a831522e59d67078539f2b3f45b7fcfe6cc81022887f359b8d0c64f27`

These are candidate-tree hashes, not published-release evidence. The release
gate still requires a clean rebuild from the final merge commit and verification
of every uploaded artifact.

## Historical release decision

`v1.0.20` exists as a Git tag but has no GitHub Release entry. The 1.0.34
workflow will not reconstruct, retag or otherwise rewrite that historical
state. A separate, explicitly approved archival project may document old tags
later without coupling it to this release.
