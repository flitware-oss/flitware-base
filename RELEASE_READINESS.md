# Release readiness — `@flitware/base@0.26.1-flitware.0`

Verdict scale (only): `PASS | FAIL | NOT APPLICABLE | NOT TESTED`.
`NOT TESTED` is never reported as `PASS`.

## Provenance

| Item | Value |
| ---- | ----- |
| FLITWARE BASE VERSION | `0.26.1-flitware.0` |
| SDK COMMIT | `72223cb` (+ this release-validation change) |
| UPSTREAM VERSION | `pocketbase/js-sdk v0.26.1` |
| UPSTREAM COMMIT | `bf38e1569cf7c1459e3f0964e1937c50bce51ac8` |

## Test evidence

| Item | Result | Evidence |
| ---- | ------ | -------- |
| UNIT TESTS | PASS | 178/178 (`npx vitest run`): 141 upstream untouched + 37 golden |
| GOLDEN TESTS | PASS | 37/37: wire, persistence, migration, api-surface, realtime, jwt, exports |
| CONTRACT TESTS | PASS | Upstream suites (CRUD/auth/errors/cancellation/hooks) + golden pins; realtime via `EventSource` fake (no live socket in sandbox) |
| CONSUMER TYPECHECK | PASS | Real app `tsc --noEmit` clean with `pocketbase@0.26.1`; migrated-usage harness `tsc` clean against the real `.tgz` (all 85-file usage patterns); app-with-swap NOT TESTED (read-only app dir) |
| CONSUMER BUILD | PASS | esbuild production bundle of migrated usage (37 KB, tree-shaken, zero `pocketbase` runtime import); real-app `npm run build` with swap NOT TESTED |

## Functional evidence (live backend `https://api.flitware.com`)

| Item | Result | Evidence |
| ---- | ------ | -------- |
| AUTH MIGRATION (existing session survives) | NOT TESTED (live) | Golden migration test PASS on byte-exact simulated state. Live login blocked at the backend Turnstile gate (see Blockers); boundary parity proven: both SDKs receive the identical 403 envelope for the identical request |
| COLLECTIONS | PASS (parity) / NOT TESTED (live authed CRUD) | 7/7 artifact parity (list/getOne/create/update/delete paths+bodies+envelopes identical) |
| FILES | PASS (parity) / NOT TESTED (live upload) | `getURL` shape parity; upload needs session |
| REALTIME | PASS (parity) / NOT TESTED (live socket) | Submit `{clientId, subscriptions}`, `realtime_<id>` cancel key, `PB_CONNECT` flow parity; sandbox blocks listen sockets |
| CUSTOM REQUESTS | PASS | `pb.send` method/body/signal parity incl. app's `manageUsers` pattern |

## Network parity

| Item | Result | Evidence |
| ---- | ------ | -------- |
| NETWORK PARITY | PASS | Live response bytes IDENTICAL via proxy egress: `GET /api/health` → same 200 body (`API is healthy.`); `POST users/auth-with-password` → same 403 envelope; `POST users/request-otp` → same 404 envelope. Plus 7/7 artifact scenarios (requests + parsed data + error envelopes identical). Secrets normalized before comparison; none stored. |

## Integration surface (real app `flitware-app`)

| Item | Result | Evidence |
| ---- | ------ | -------- |
| DEEP IMPORTS | PASS | No `pocketbase/...` deep imports in `src`, `tests`, `index.html`, `build.js` |
| UMD USAGE | PASS | No `window.PocketBase`/script-tag usage; intentional `FlitwareBase` global affects nothing |

## Package, license, security

| Item | Result | Evidence |
| ---- | ------ | -------- |
| NPM PACKAGE | PASS | `flitware-base-0.26.1-flitware.0.tgz` inspected: name/version/exports/main/module/types/react-native/license/repo/homepage/bugs correct; `dependencies: null`; no `pocketbase` import in dist; bundle keeps only intentional `pocketbase_auth`/doc-URL strings |
| LICENSE | PASS | Tarball contains `LICENSE` + `LICENSE.md` (byte-identical), `NOTICE.md`, `UPSTREAM.md`; `package.json: MIT`; upstream attribution intact |
| SECURITY | PASS | Secret scan clean; no creds/tokens committed; no behavior change to auth/cookies/storage/requests |

## TypeScript baseline (FASE 10)

`scripts/check-tsc-baseline.sh` + `scripts/tsc-known-errors.txt` (4 known
upstream errors, line/col-insensitive). Verified green on baseline and RED on
an injected regression (negative control, reverted). CI uses the script.

## Blockers (must clear before `npm publish`)

1. Live authenticated validation (login → session → reload → authRefresh →
   logout). Attempted with provided E2E credentials: the Flitware backend
   answers `403 "Security verification is required."` (Turnstile/bot gate,
   consistent with the app's `buildTurnstileHeaders` flow) — identically for
   both SDKs, so this is a backend policy boundary, not an SDK divergence.
   Needs either a Turnstile-exempt test path/hook or a human-driven login
   whose persisted state is then reloaded under `@flitware/base`.
2. Real-app production build with the 2-line SDK swap applied
   (`src/infrastructure/pocketbase/pocketbase.service.ts` + package dep).

## Live observations (backend, not SDK issues)

- `POST /api/collections/users/request-otp` → `404 "Not Found."` on the
  Flitware backend (identical for both SDKs): historical backend difference
  vs upstream PocketBase, no SDK action. The app's OTP flow presumably targets
  a different route/wrapper — out of scope for this SDK release.
- No secret was written to disk, logs, fixtures or commits during live
  probing (env-only credentials, redacted comparisons).

## Warnings

- Sandbox limits (no listen sockets, node egress restricted, read-only
  consumer dir) forced shim-based instead of live-socket/live-response parity.
- `env.json` exposes only `https://api.flitware.com` (prod) for both
  environments — no staging URL found; live tests must wait for one.
- npm session unauthenticated; `@flitware` scope ownership + `access public`
  must be confirmed at publish time.

## Recommendation

**DO NOT PUBLISH yet.** All runnable evidence passes and protocol/auth/
persistence differences remain NONE, but the two blockers above are genuine
`NOT TESTED`, not `PASS`. After clearing them (expected: import-line-only
migration, sessions preserved), `@flitware/base@0.26.1-flitware.0` is cleared
for first publication. DO NOT run `npm publish` without owner approval.
