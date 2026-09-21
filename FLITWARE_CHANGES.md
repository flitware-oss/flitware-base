# Flitware changes vs upstream v0.26.1

Upstream: `pocketbase/js-sdk@v0.26.1` (`bf38e1569cf7c1459e3f0964e1937c50bce51ac8`).
Categories: `BRANDING | PACKAGING | DOCUMENTATION | COMPATIBILITY | FUNCTIONAL | SECURITY`.

This release contains **only** `BRANDING`, `PACKAGING`, `DOCUMENTATION` and
`COMPATIBILITY` (tests). **No `FUNCTIONAL` or `SECURITY` behavioral change.**

## BRANDING

- `src/Client.ts`: `export default class Client` → `export default class FlitwareBase`;
  fluent return types (`autoCancellation`, `cancelRequest`, `cancelAllRequests`)
  updated to the renamed class (same object, no behavior change).
- `src/index.ts`: local binding `Client` → `FlitwareBase`; added named exports
  `FlitwareBase` and migration alias `PocketBase` (same class object).
  All `export *` lines unchanged.
- Class docblock + `baseURL` docblock reworded to Flitware Base (with explicit
  "originally derived from PocketBase" note); usage examples
  `new PocketBase(...)` → `new FlitwareBase(...)` in `src/Client.ts`.
- `src/stores/AsyncAuthStore.ts` doc example: import from `@flitware/base`,
  `new FlitwareBase(...)`. The example storage key `pb_auth` is illustrative
  only (users choose their own key) and was left as-is.
- `rollup.config.mjs` comments "the PocketBase client" → "the Flitware Base
  client" (4 lines); upstream issue-link comments kept.

## PACKAGING

- `package.json`: `name` → `@flitware/base`, `version` → `0.26.1-flitware.0`
  (see `VERSIONING.md`), `description`, `author` (Flitware), `repository`,
  `homepage`, `bugs`, keywords (flitware-first, pocketbase kept for
  discoverability), `exports`/`main`/`module`/`react-native`/`types` →
  `dist/flitware-base.*`, added `flitwareBase.upstream` provenance block.
  Scripts, prettier config and devDependencies byte-identical to upstream.
- `rollup.config.mjs`: outputs `dist/pocketbase.*` → `dist/flitware-base.*`;
  UMD/CJS/IIFE `name: 'PocketBase'` → `'FlitwareBase'`.
- `dist/`: rebuilt; old `dist/pocketbase.*` artifacts replaced by
  `dist/flitware-base.*` (same 5 bundles + maps + d.ts).
- `.npmignore`: added `compatibility/` (mirrors upstream `tests/` exclusion;
  repo tests don't ship in the npm artifact).
- `.gitignore`: union of the initial Flitware template and upstream's, minus
  the bare `dist` entry so built bundles stay tracked per upstream release
  practice.
- `LICENSE`: byte-identical copy of upstream `LICENSE.md` (kept as `LICENSE.md`
  too); both ship in the npm package.

## DOCUMENTATION

- `README.md`: rewritten for Flitware Base (install `npm install @flitware/base`,
  `new FlitwareBase(...)`) with a `Project origin` section (no hidden provenance).
- New: `NOTICE.md`, `UPSTREAM.md`, `VERSIONING.md`, `COMPATIBILITY.md`,
  `COMPATIBILITY_INVENTORY.md`, `UPSTREAM_SYNC.md`, this file.
- `tsconfig.json`: `include` extended with `./compatibility` (new test dir only).

## COMPATIBILITY (tests — no product behavior change)

- New `compatibility/golden/` suite (37 tests): wire-protocol, auth-persistence,
  auth-migration (proves existing sessions survive the SDK swap), api-surface,
  realtime-protocol, jwt-compat, flitware-exports.
- Upstream `tests/` (141 tests): untouched, all passing.

## Explicitly NOT changed (see COMPATIBILITY_INVENTORY.md)

Storage keys (`pocketbase_auth`, `pb_auth`), payload shapes (`{token, record}`
+ legacy `model` reads), `Authorization` raw-token header, all `/api/*`
endpoints, realtime transport/events/keys, JWT decode/expiry semantics,
superuser detection (incl. `pbc_3142635823`), error message strings,
`console.warn` migration hints, historical comments referencing PocketBase
versions/issues/docs, and every other public class, method, type and overload.

## Protocol / auth / persistence differences

`NONE` — by design. Any future non-`NONE` requires the approval dossier
(upstream behavior, requirement, proposed change, compatibility + migration
impact, required tests) before implementation.

## Build-tooling fix (PACKAGING, no product change)

- `package.json` `overrides`: `browserslist-generator@^3.0.0` (transitive via
  `rollup-plugin-ts@3.4.5`, which declares `^2.1.0`).
- Cause: `browserslist-generator@2.3.0` ESM uses the removed
  `import ... assert { type: 'json' }` syntax; Node ≥22 rejects it, breaking
  `npm run build` at config-load time (CI runs Node 22).
- v3 keeps the exact functions `rollup-plugin-ts` consumes
  (`getAppropriateEcmaVersionForBrowserslist`, `normalizeBrowserslist`,
  `browsersWithSupportForEcmaVersion`); rebuilt `dist/` is byte-identical on
  Node 20 and Node 22 and identical to the previous build output.
- Zero runtime effect (the package has no runtime dependencies).
