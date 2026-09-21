# Flitware Base

Flitware Base is the JavaScript/TypeScript SDK for the Flitware platform.

## Installation

```bash
npm install @flitware/base
```

## Usage

```ts
import FlitwareBase from "@flitware/base";

const fb = new FlitwareBase("https://api.example.com");

// auth
await fb.collection("users").authWithPassword("email@example.com", "secret");

// records
await fb.collection("drivers").getList(1, 20);
await fb.collection("fleet").getOne("RECORD_ID");

// realtime
await fb.collection("drivers").subscribe("*", (e) => console.log(e));

// files
const url = fb.files.getURL(record, "photo.png");

// custom requests, filters, cancellation, hooks
await fb.send("/api/health", { method: "GET" });
fb.filter("name ~ {:q}", { q: "express" });
fb.autoCancellation(false);
```

Named imports are also available, including a migration alias identical to the
default export:

```ts
import { FlitwareBase, PocketBase } from "@flitware/base";
```

### Migrating from `pocketbase@0.26.1`

```diff
- import PocketBase from "pocketbase";
+ import FlitwareBase from "@flitware/base";

- const fb = new PocketBase(API_URL);
+ const fb = new FlitwareBase(API_URL);
```

That is the whole migration: existing sessions, tokens, realtime subscriptions
and error handling keep working with zero further changes. See
`COMPATIBILITY.md` for the full compatibility promise and
`compatibility/golden/auth-migration.spec.ts` for the executable proof.

Script-tag users: load `dist/flitware-base.umd.js` (global `FlitwareBase`)
instead of `dist/pocketbase.umd.js` (global `PocketBase`).

## API reference

This SDK preserves the `PocketBase JS SDK v0.26.1` API surface (one intentional
rename: the root export is `FlitwareBase`). Highlights:

- `fb.collection(name)` — CRUD + auth (`authWithPassword`, `authWithOAuth2Code`,
  `authRefresh`, OTP, password reset, verification, email change, impersonate).
- `fb.authStore` — `token`, `record`, `isValid`, `isSuperuser`, `save`, `clear`,
  `loadFromCookie`, `exportToCookie`, `onChange`; `LocalAuthStore` (default),
  `AsyncAuthStore` (React Native / custom async persistence).
- `fb.send`, `fb.filter`, `fb.buildURL`, `fb.beforeSend` / `fb.afterSend`,
  `fb.autoCancellation` / `fb.cancelRequest` / `fb.cancelAllRequests`,
  `fb.createBatch`.
- Services: `collections`, `files`, `logs`, `settings`, `realtime`, `health`,
  `backups`, `crons`.
- Errors: `ClientResponseError` (`url`, `status`, `response`/`data`, `isAbort`).

## Project origin

Flitware Base was originally derived from PocketBase JavaScript SDK v0.26.1.

Flitware maintains this project independently. It is not the official
PocketBase SDK.

See UPSTREAM.md, NOTICE.md and LICENSE for attribution and licensing information.
