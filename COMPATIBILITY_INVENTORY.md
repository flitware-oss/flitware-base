# COMPATIBILITY_INVENTORY.md — Flitware Base SDK

> Source of truth: `pocketbase/js-sdk` tag `v0.26.1`
> commit `bf38e1569cf7c1459e3f0964e1937c50bce51ac8` (2025-06-07).
> Every value below was read from that exact tree, not assumed.
> Rule: when in doubt, **DO NOT RENAME**.

Categories:

- `BRANDING` — product identity, safe to change.
- `PACKAGE_METADATA` — npm/project metadata, safe to change (keep upstream attribution in `UPSTREAM.md`).
- `DOCUMENTATION` — human docs/comments; change carefully, never if runtime-observable.
- `PUBLIC_API` — preserve unless explicitly approved.
- `INTERNAL_IMPLEMENTATION` — may change only with zero observable difference.
- `WIRE_PROTOCOL` — **NEVER** change for branding.
- `AUTH_PROTOCOL` — **NEVER** change for branding.
- `PERSISTED_STATE` — **NEVER** change for branding.
- `UPSTREAM_ATTRIBUTION` — **NEVER** remove.

## 1. Package / distribution (changeable)

| Element | Current value | Category | Rename? | Impact / Decision |
| ------- | ------------- | -------- | ------- | ----------------- |
| npm package name | `pocketbase` | PACKAGE_METADATA | **YES** → `@flitware/base` | Explicit migration: single import-line change. Documented. |
| package description | `PocketBase JavaScript SDK` | BRANDING | **YES** → `JavaScript and TypeScript SDK for Flitware Base` | No runtime effect. |
| repository/author/keywords | `pocketbase/js-sdk`, `Gani Georgiev`, `pocketbase*` | PACKAGE_METADATA | **YES** (point to Flitware repo) | Upstream attribution preserved separately in `UPSTREAM.md` + `NOTICE.md`. |
| dist filenames | `dist/pocketbase.{es.mjs,es.js,umd.js,cjs.js,iife.js}` (+ maps + d.ts) | PACKAGE_METADATA | **YES** → `dist/flitware-base.*` | Bundler path change travels with the package rename; `exports`/`main`/`module`/`types` updated consistently. Old deep-import paths (`pocketbase/cjs`) become `@flitware/base/cjs`. Documented breaking surface limited to the renamed package. |
| UMD/IIFE global | `PocketBase` (`window.PocketBase`) | BRANDING | **YES** → `FlitwareBase` | Only affects `<script>`-tag consumers; documented migration note. No wire/persistence effect. |
| root class public name | default-exported `Client`, consumed as `PocketBase` | PUBLIC_API + BRANDING | **YES** → `FlitwareBase` (default + named export), plus `PocketBase` named alias for migration | Only intended public API difference. Internal `Client` default-import bindings keep working. |
| README/docs branding | `PocketBase JavaScript SDK` | DOCUMENTATION | **YES** (rewrite, keep origin section) | No runtime effect. |
| `LICENSE.md` filename | `LICENSE.md` (upstream) | UPSTREAM_ATTRIBUTION | **NO** (keep byte-identical) + add byte-identical `LICENSE` copy | Both shipped in the npm package. |

## 2. Persisted state (DO NOT RENAME)

| Element | Current value | Category | Rename? | Impact / Decision |
| ------- | ------------- | -------- | ------- | ----------------- |
| `LocalAuthStore` default storage key | `pocketbase_auth` (`src/stores/LocalAuthStore.ts`) | PERSISTED_STATE | **NO** | Renaming logs out every existing user on upgrade. Verified: `constructor(storageKey = "pocketbase_auth")`. |
| Cookie key | `pb_auth` (`const defaultCookieKey = "pb_auth"` in `src/stores/BaseAuthStore.ts`) | PERSISTED_STATE | **NO** | SSR/session cookies must survive the SDK swap. `loadFromCookie`/`exportToCookie` default param unchanged. |
| Cookie payload shape | JSON `{ token, record }` (reads legacy `model` as fallback) | PERSISTED_STATE | **NO** | `save(data.token \|\| "", data.record \|\| data.model \|\| null)`. Keep dual read. |
| `AsyncAuthStore` serialized shape | `JSON.stringify({ token, record })`, initial parsed with `record \|\| model` fallback | PERSISTED_STATE | **NO** | React Native persisted sessions must survive. Doc example key `pb_auth` unchanged (docs only). |
| `localStorage` value shape | JSON `{ token, record }` under `pocketbase_auth`; cross-tab `storage` event sync | PERSISTED_STATE | **NO** | Multi-tab session sync depends on identical key + shape. |
| `record` vs `model` | `record` canonical; `model` deprecated getter alias (both stores + `AuthModel` type alias) | PUBLIC_API + PERSISTED_STATE | **NO** | Keep both accessors; keep reading persisted `model`. |

## 3. Auth protocol (DO NOT RENAME)

| Element | Current value | Category | Rename? | Impact / Decision |
| ------- | ------------- | -------- | ------- | ----------------- |
| `Authorization` header | raw token, **no `Bearer` prefix**: `Authorization: <token>` (`Client.initSendOptions`) | AUTH_PROTOCOL | **NO** | Backend expects the raw value. |
| Header name casing | `Authorization` | AUTH_PROTOCOL | **NO** | Case-insensitive lookup (`getHeader`); sent as `Authorization`. |
| Token parsing | middle JWT segment, base64-decoded payload (`src/tools/jwt.ts`); SDK never verifies signatures — verification is backend-side | AUTH_PROTOCOL | **NO** | `getTokenPayload`/`isTokenExpired` semantics pinned by golden tests. |
| `exp`-less tokens | considered **valid**; empty/unparseable payload considered **expired** | AUTH_PROTOCOL | **NO** | `isValid` behavior pinned. |
| Superuser detection | `payload.type == "auth"` + `record.collectionName == "_superusers"`, fallback `payload.collectionId == "pbc_3142635823"` | AUTH_PROTOCOL | **NO** | Checksum id is backend-issued; never rebrand. |
| `authRefresh` endpoint | `POST /api/collections/{col}/auth-refresh` | WIRE_PROTOCOL | **NO** | |
| Password/OAuth2/OTP endpoints | `auth-with-password`, `auth-with-oauth2`, `auth-with-otp`, `request-password-reset`, `confirm-password-reset`, `request-verification`, `confirm-verification`, `request-email-change`, `confirm-email-change`, `request-otp`, `impersonate/{id}`, `auth-methods` | WIRE_PROTOCOL | **NO** | |
| OAuth2 redirect + realtime topic | `/api/oauth2-redirect`, realtime topic `@oauth2`, `state == clientId` check | WIRE_PROTOCOL | **NO** | |
| `_superusers` / `_externalAuths` collections | literal collection names in code | WIRE_PROTOCOL | **NO** | Includes `admins` deprecated alias → `collection("_superusers")`. |
| Auto-refresh hook (`tools/refresh.ts`) | wraps `beforeSend`, refresh threshold, reauthenticate, swaps stale `Authorization` | AUTH_PROTOCOL + INTERNAL | **NO** | Behavior pinned; untouched. |

## 4. Wire protocol — HTTP (DO NOT RENAME)

| Element | Current value | Category | Rename? | Impact / Decision |
| ------- | ------------- | -------- | ------- | ----------------- |
| Base paths | `/api/collections`, `/api/collections/{col}/records`, `/api/batch`, `/api/health`, `/api/logs*`, `/api/backups*`, `/api/crons`, `/api/settings*`, `/api/files/token`, `/api/realtime`, `/api/oauth2-redirect` | WIRE_PROTOCOL | **NO** | |
| Default headers | `Content-Type: application/json` (skipped for `FormData`), `Accept-Language: <lang>` (default `en-US`) | WIRE_PROTOCOL | **NO** | `lang` constructor param kept. |
| Query params | `page`, `perPage`, `filter`, `sort`, `expand`, `fields`, `skipTotal`, `requestKey`, `$autoCancel`, `$cancelKey`, legacy `params` merge | WIRE_PROTOCOL | **NO** | `normalizeUnknownQueryParams` untouched. |
| Filter builder | `filter('...{:param}...', {...})` quoting/escaping rules | WIRE_PROTOCOL | **NO** | Pinned by tests. |
| Body serialization | JSON stringify; auto `FormData` conversion when file fields present (`@jsonPayload` part for batch) | WIRE_PROTOCOL | **NO** | |
| File URL shape | `api/files/{collection}/{id}/{filename}` + `download`/`thumb` params | WIRE_PROTOCOL | **NO** | `FileService.getURL` kept; deprecated `getUrl` alias kept. |
| Error envelope | HTTP ≥ 400 → `ClientResponseError{ url, status, response, isAbort, originalError, cause }`, alias `.data`, `.toJSON()` | PUBLIC_API | **NO** | Message strings kept verbatim (see §6). |
| Auto-cancellation | `AbortController` per `requestKey` (default `METHOD+path`), `autoCancellation()`, `cancelRequest()`, `cancelAllRequests()` | PUBLIC_API | **NO** | |
| `beforeSend`/`afterSend` hooks + legacy return shape | supported with deprecation warning | PUBLIC_API | **NO** | |

## 5. Realtime (DO NOT RENAME)

| Element | Current value | Category | Rename? | Impact / Decision |
| ------- | ------------- | -------- | ------- | ----------------- |
| Transport | SSE via global `EventSource`, `GET /api/realtime` | WIRE_PROTOCOL | **NO** | Upstream has **no WebSocket**; do not assume/add one. |
| Connect event | `PB_CONNECT`, `clientId = lastEventId` | WIRE_PROTOCOL | **NO** | |
| Submit | `POST /api/realtime` body `{ clientId, subscriptions }`, cancel key `realtime_<clientId>` | WIRE_PROTOCOL | **NO** | |
| Topics | `<collection>/<id|*>` (+ `options=` serialized query/headers suffix), `@oauth2` | WIRE_PROTOCOL | **NO** | |
| Reconnect | 15 s connect timeout, `[200,300,500,1000,1200,1500,2000]` backoff, infinite retries, `onDisconnect` hook | WIRE_PROTOCOL | **NO** | |

## 6. Runtime-observable strings (DO NOT REBRAND)

These read like branding but are observable at runtime (matched in UIs, logs, tests).
Backward compatibility wins over cleaner rebranding — kept verbatim:

- `ClientResponseError` fallback messages (`The request was autocancelled... js-sdk#auto-cancellation`,
  `Failed to connect to the PocketBase server...`, `Something went wrong.`).
- `console.warn` migration hints (`pb.authStore.isAdmin`, `pb.getFileUrl()`, `pb.buildUrl()`,
  `PocketBase: This form of authWithOAuth2() is deprecated...`, legacy option shapes).
- Doc-comment code examples are updated to `FlitwareBase` **only** where they are pure
  documentation (comments are stripped from production builds by terser, `comments: false`).

## 7. Public API surface (preserve; one approved rename)

Keep: `Client` (default export binding name changes, see below), `ClientResponseError`,
`BaseAuthStore`, `LocalAuthStore`, `AsyncAuthStore`, all services
(`collections`, `files`, `logs`, `settings`, `realtime`, `health`, `backups`, `crons`,
`collection()`, `createBatch()`, deprecated `admins`), `SendOptions`/`FileOptions`/`CommonOptions`
types, `RecordModel` + DTOs, `cookieParse`/`cookieSerialize`, `getTokenPayload`/`isTokenExpired`,
`BeforeSendResult`, `AuthRecord`/`AuthModel`, `UnsubscribeFunc`.

Approved renames (BRANDING/PUBLIC_API, explicitly required):

1. Default export consumable as `FlitwareBase` (class renamed `Client` → `FlitwareBase`).
2. Named exports added: `FlitwareBase`, migration alias `PocketBase`.
3. Package `pocketbase` → `@flitware/base`; dist `pocketbase.*` → `flitware-base.*`; UMD global → `FlitwareBase`.

Everything else in `src/index.ts` export list stays identical.
