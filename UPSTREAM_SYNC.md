# Upstream sync

PocketBase (`pocketbase/js-sdk`) is a **technical reference upstream**, not a
runtime dependency and not the driver of Flitware Base releases.

## Remote

```bash
git remote add upstream https://github.com/pocketbase/js-sdk.git
```

(already configured in this repository) plus all upstream tags fetched, and the
full upstream history preserved via merge `--allow-unrelated-histories`.

## Flow

```text
PocketBase upstream
        │
        ▼
new tag/release
        │
        ▼
git fetch upstream --tags
        │
        ▼
diff new tag against our recorded baseline
(UPSTREAM.md: version + commit SHA)
        │
        ▼
review changes file by file against
COMPATIBILITY_INVENTORY.md categories
        │
   ┌────┴────┐
   ▼         ▼
relevant   irrelevant
(branding-  (document
safe fix,    as reviewed,
protocol     no action)
bugfix)
   │
   ▼
port/cherry-pick onto a feature branch
(`git cherry-pick` works: history preserved)
   │
   ▼
run FULL suite: upstream tests + compatibility/golden
+ typecheck + build + npm pack inspection
   │
   ▼
update UPSTREAM.md baseline, FLITWARE_CHANGES.md,
VERSIONING.md (baseline bump resets the
-flitware.N counter, e.g. 0.26.2-flitware.0)
   │
   ▼
Flitware Base release
```

## Rules

- Never merge upstream blindly: every upstream diff hunk touching
  `WIRE_PROTOCOL`, `AUTH_PROTOCOL` or `PERSISTED_STATE` needs the approval
  dossier (upstream behavior, Flitware requirement, proposed change,
  compatibility + migration impact, required tests).
- Branding-only or internal upstream changes that don't alter observable
  behavior may be ported directly, still with full test runs.
- Upstream never dictates our release timing or numbering; see `VERSIONING.md`.
- If an upstream release fixes a security issue affecting us, expedite the
  review and ship a `FUNCTIONAL`/`SECURITY` release with migration notes.
