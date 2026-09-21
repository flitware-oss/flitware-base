# Release checklist — `@flitware/base@0.26.1-flitware.0`

Reproducible gate before `npm publish`. Evidence for each item lives in
`RELEASE_READINESS.md`. Check an item only when its evidence reads PASS.

## SDK verification

- [x] Upstream baseline verified (`v0.26.1` / `bf38e1569…`, tree byte-identical)
- [x] Upstream tests pass (141/141, untouched)
- [x] Golden tests pass (37/37, incl. auth-migration proof)
- [x] Contract tests pass (covered by upstream suites + golden api-surface/wire/jwt/realtime)
- [x] TypeScript baseline verified (`scripts/check-tsc-baseline.sh`: 4 known, 0 new)
- [x] Build passes (5 bundles + maps + d.ts)
- [x] npm pack passes (`flitware-base-0.26.1-flitware.0.tgz`)
- [x] Tarball inspected (files, exports, no src/tests/compat, no secrets)
- [x] No secrets (scan clean; no tokens/keys/endpoints committed)
- [x] License included (`LICENSE` + `LICENSE.md`, byte-identical to upstream)
- [x] NOTICE included (tarball + repo)
- [x] UPSTREAM included (tarball + repo)

## Real-application validation (`flitware-app`, `pocketbase@0.26.1`, 85 files)

- [x] Consumer usage inventoried (imports/instantiation/auth/collections/realtime/files/send/filter/SSR/types; single `new PocketBase(APP_CONFIG.apiUri)` point)
- [x] Real app compiles today (`tsc --noEmit` clean with `pocketbase@0.26.1`)
- [x] Migrated usage compiles against the real `.tgz` (`tsc` clean, all app patterns incl. `RecordModel`/`ListOptions`/`RecordAuthResponse`/`OTPResponse`/`AuthProviderInfo`/`ClientResponseError`, `beforeSend` hook, deprecated `authStore.model`)
- [x] Migrated usage production-bundles (esbuild, tree-shaken, no `pocketbase` runtime import)
- [ ] Real Flitware production build passes **with the swap applied** — NOT TESTED (app dir is read-only for this agent; needs owner to apply the 2-line migration and run `npm run build`)
- [ ] Existing auth session survives migration (live) — NOT TESTED (backend Turnstile gate blocks automated login identically for both SDKs; needs exempt test path or human-driven login)
- [ ] Login works (live) — NOT TESTED (Turnstile gate: identical 403 boundary parity for both SDKs)
- [ ] Auth refresh works (live) — NOT TESTED (needs session)
- [ ] Logout works (live) — NOT TESTED (needs session)
- [x] Collections work (request/response parity 7/7 through real artifacts; live authenticated CRUD NOT TESTED)
- [x] Filters work (parity: filter/sort/expand/fields/skipTotal fingerprints identical)
- [x] Pagination works (parity: page/perPage/skipTotal identical)
- [x] Files work if applicable (`getURL` shape parity; live upload NOT TESTED)
- [x] Realtime works if applicable (submit-body/cancel-key/handshake parity; live socket NOT TESTED — sandbox blocks listen sockets and node egress)
- [x] Custom requests work if applicable (`pb.send` method/body/signal parity)
- [x] No unexpected deep imports (none detected in `src`, `tests`, `index.html`, `build.js`)
- [x] UMD compatibility evaluated (no `window.PocketBase`/script-tag usage; intentional global rename affects nothing)
- [x] No PocketBase runtime dependency (`dependencies: null`; dist has no `pocketbase` import; `npm ls --omit=dev` empty)
- [x] Package metadata verified (name/version/exports/main/module/types/react-native/license/repo/homepage/bugs)
- [x] npm scope/package availability verified (`@flitware/base` 404 = free; org auth + `access public` still required at publish time)
