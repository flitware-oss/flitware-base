# Compatibility

> Flitware Base initially preserves behavioral and protocol compatibility with
> PocketBase JavaScript SDK v0.26.1, except for explicitly documented Flitware
> branding/package changes.

## What is preserved

- HTTP wire protocol: methods, paths, endpoints, header names and values,
  query parameters, body serialization (JSON / multipart-form-data), pagination,
  filters, expand, sort, fields, `skipTotal`, request cancellation semantics,
  error parsing and status handling.
- Authentication: raw-token `Authorization` header (no `Bearer` prefix), token
  decode/validity semantics, `authStore` behavior, refresh/reauthenticate flow,
  cookie shape, logout/clear behavior.
- Persisted state: `localStorage` key `pocketbase_auth`, cookie key `pb_auth`,
  `{ token, record }` payload shapes (including legacy `model` reads).
- Realtime: SSE transport, `/api/realtime`, `PB_CONNECT` handshake,
  `{ clientId, subscriptions }` submit, `realtime_<id>` cancel key, topics,
  reconnect/backoff behavior, unsubscribe semantics.
- Runtime error semantics: `ClientResponseError` shape, `isAbort`, `.data`
  alias, `toJSON()`, fallback messages.
- TypeScript surface: signatures, overloads, generics, return types,
  interfaces, options and error types (modulo the renamed root export below).

Any future divergence from the above must be **documented** (`FLITWARE_CHANGES.md`),
**tested** (`compatibility/`), **versioned** (`VERSIONING.md`) and evaluated for
migration impact before shipping.

## Intended differences (exhaustive for this release)

1. Package `pocketbase` → `@flitware/base` (import path change).
2. Root export consumable as `FlitwareBase` (default + named); `PocketBase`
   named alias provided for migration (same class object).
3. `dist/pocketbase.*` → `dist/flitware-base.*`; UMD/IIFE global `PocketBase` →
   `FlitwareBase` (script-tag consumers update the global name).
4. Project metadata/docs branding (repository, description, keywords, README).
5. Additive `package.json` provenance block (`flitwareBase.upstream`).

Everything else — every endpoint, header, key, claim, event name and message
string listed in `COMPATIBILITY_INVENTORY.md` — is unchanged.

## Upgrade guide (`pocketbase@0.26.1` → `@flitware/base`)

```diff
- import PocketBase from "pocketbase";
+ import FlitwareBase from "@flitware/base";

- const pb = new PocketBase(API_URL);
+ const pb = new FlitwareBase(API_URL);
```

No other change required: existing sessions (`pocketbase_auth` /
`pb_auth`), tokens, realtime subscriptions and error handling keep working.
Proven by `compatibility/golden/auth-migration.spec.ts`.

Script-tag users: replace `dist/pocketbase.umd.js` with
`dist/flitware-base.umd.js` and the `PocketBase` global with `FlitwareBase`.
Deep imports `pocketbase/cjs` / `pocketbase/umd` become `@flitware/base/cjs` /
`@flitware/base/umd`.
