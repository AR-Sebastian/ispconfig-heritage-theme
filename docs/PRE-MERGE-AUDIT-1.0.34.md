# HERITAGE 1.0.34 pre-merge audit

Date: 2026-08-02

Base: `e010e09af6b391b090d7770a83c5f3f78ccb9a24` (`origin/main` merge base)

Candidate: `02aa894` (final PR #1 head)

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

## Post-merge reproducibility closure

PR #1 merged as `5fc6931c5299cdeec8623b8cf462832babf8fc98` with a tree identical to its
candidate head. Its first Windows worktree build nevertheless differed from
the pre-merge worktree artifacts. The audit traced this to checkout line
endings: the builder copied worktree bytes and eight text formats were not
covered by the explicit LF attributes.

PR #2 made text normalization comprehensive, marked common media/font formats
binary and changed release packaging to read the committed Git tree. It also
rejects staged or unstaged payload changes. Both GitHub validation jobs passed;
PR #2 merged as `19056b9e1ac7b3710b1a296ecaabc7e7f6d46bbe`.

The committed-tree build before that merge and the clean build from the final
merge commit produced identical artifacts:

- ZIP: `23a189343af2fdae8dc9073c79b5419be179f5e921f733a7bfc3010d42ea5850`
- TAR.GZ: `7506c43c29a033ff0e11d307c049f47d598dd92df13f176048a78ddee6aa48b2`
- SHA256SUMS.txt: `36eb18952d1e3bedd472d97b8e0a66f8f6c88191bc36810ad0517b67302b6c1b`

This closes the clean-merge reproducibility gate. These remain candidate
hashes until the tag workflow publishes the release and every downloaded asset
is verified independently.

## Historical release decision

`v1.0.20` exists as a Git tag but has no GitHub Release entry. The 1.0.34
workflow will not reconstruct, retag or otherwise rewrite that historical
state. A separate, explicitly approved archival project may document old tags
later without coupling it to this release.
