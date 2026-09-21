# Upstream

Flitware Base SDK is derived from the PocketBase JavaScript SDK.

- Upstream project: https://github.com/pocketbase/js-sdk
- Upstream version: `v0.26.1`
- Upstream commit: `bf38e1569cf7c1459e3f0964e1937c50bce51ac8`
- Upstream commit date: 2025-06-07 (`bumped package version`)
- Upstream tag ref: `refs/tags/v0.26.1`
- Original license: MIT (`LICENSE.md`, copyright `Gani Georgiev`, `2022 - present`)
- Tracked remote in this repository: `upstream` → `https://github.com/pocketbase/js-sdk.git`
  (all upstream tags fetched; full history preserved via merge
  `--allow-unrelated-histories`, so `git log`, `git diff` and `git cherry-pick`
  keep working against upstream).

## Baseline verification (unmodified upstream tree)

Recorded before any Flitware modification:

- `npm install`: OK (note: this environment required `npm --cache <tmpdir>`
  because the default `~/.npm` directory was not writable; unrelated to the code).
- Tests (`npx vitest run`): **16 files, 141 tests, all passed**.
- Typecheck (`npx tsc --noEmit`): 4 pre-existing errors, untouched by Flitware:
  - `node_modules/vite/.../index.d.ts`: `rollup/parseAst` types unresolvable under
    `moduleResolution: node` (dependency/config issue, build unaffected).
  - `tests/services/BatchService.spec.ts` (3×): `Property 'keys' does not exist
    on type 'FormData'` (DOM/Node lib mismatch in specs; build unaffected).
- Build (`npm run build`, rollup): OK, all 5 bundles produced
  (pre-existing circular-dependency warning `Client ↔ RecordService`, as upstream).

## Upstream layout at v0.26.1 (for reference)

- `src/Client.ts` — default-exported `Client` (HTTP, auth header injection,
  auto-cancellation, hooks, `filter()`, `collection()`, batch factory).
- `src/ClientResponseError.ts` — normalized error envelope.
- `src/services/` — Backup, Base, Batch, Collection, Cron, Crud, File, Health,
  Log, Realtime (SSE), Record (auth incl. password/OAuth2/OTP/impersonate), Settings.
- `src/stores/` — Base (`pb_auth` cookie), Local (`pocketbase_auth` key),
  Async (external async persistence).
- `src/tools/` — cookie, dtos, formdata, jwt (decode-only), legacy, options, refresh.
- `tests/` — vitest suite with `FetchMock` (no live server required).
- Packaging: rollup → `dist/pocketbase.{es.mjs,es.js,umd.js,cjs.js,iife.js}` + d.ts;
  `exports`/`main`/`module`/`react-native`/`types` all wired to `dist/`.
- `package.json` scripts: `format`, `build`, `dev`, `test` (`vitest`),
  `prepublishOnly`. No `typecheck` script upstream (run `npx tsc --noEmit`).

Flitware Base is independently maintained by Flitware.
See `NOTICE.md` for attribution and `FLITWARE_CHANGES.md` for every divergence.
