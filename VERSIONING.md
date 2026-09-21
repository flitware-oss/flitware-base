# Versioning

## Decision

Flitware Base starts with **Strategy A**:

- Current version: `0.26.1-flitware.0`
- The version string itself encodes the upstream baseline (`0.26.1`) plus a
  Flitware patch counter (`.flitware.0`, `.1`, …).
- Machine-readable provenance is additionally embedded in `package.json`
  (`flitwareBase.upstream`: project, url, version, commit) and in `UPSTREAM.md`.
- The independent `Flitware Base 1.0.0` numbering is reserved for the first
  release carrying **intentional functional divergence** from upstream.

## Analysis

### Strategy A — `0.26.1-flitware.0`, `0.26.1-flitware.1`, …

Pros:

- Absolute at-a-glance traceability: the version IS the baseline.
- Semver-valid prerelease segment; no collision with `pocketbase` versions
  because the package name (`@flitware/base`) is a different namespace.
- Honest signal: this release is "upstream + ownership", not new behavior.
- Clean upgrade path to `1.0.0` later (normal semver major bump).

Cons:

- Looks unusual; tooling that sorts versions places `0.26.1-flitware.0`
  below `0.26.1` (irrelevant across different package names).
- If upstream releases `0.26.2` with a fix we port, the next Flitware version
  becomes `0.26.2-flitware.0` — the Flitware counter resets per baseline,
  which must be documented at that time (see `UPSTREAM_SYNC.md`).

### Strategy B — `0.1.0`, `0.1.1`, …, `1.0.0` now

Pros:

- Cleaner, product-like numbering from day one.

Cons:

- Severs the version↔upstream link; traceability would rely solely on
  metadata files that humans rarely read.
- `0.x`/`1.0.0` would falsely imply an independent, reviewed API surface
  while the code is (by design) still byte-equivalent to upstream behavior.
- Starting at `1.0.0` now would burn the "first independent release" signal.

### Why A now, 1.0.0 later

The first Flitware Base release must be, fundamentally,
`PocketBase JS SDK v0.26.1 + ownership + branding, compatibility preserved`.
Strategy A states that in the version itself. When Flitware ships its first
deliberate, documented, tested behavioral change, that release becomes
`1.0.0` with migration notes — the numbering change itself communicates
"independent evolution has begun".

## Rules

- Never silently change the version scheme; any future scheme change is a
  documented decision in this file + `FLITWARE_CHANGES.md` + release notes.
- Every release records: upstream baseline (version + SHA), Flitware changes
  (all in `FLITWARE_CHANGES.md`), test results, and `npm pack` inspection.
- No functional change may ship without a version bump and changelog entry.
