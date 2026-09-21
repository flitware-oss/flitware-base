/**
 * Golden JWT/token tests.
 *
 * Documents the REAL token contract of v0.26.1 (read from
 * `src/tools/jwt.ts` + `src/stores/BaseAuthStore.ts` + `Client.send`):
 *
 * - The SDK NEVER creates, signs, or verifies tokens. It only base64-decodes
 *   the middle JWT segment to read claims (`exp`, `type`, `collectionId`).
 * - Tokens travel as the RAW `Authorization` header value (no `Bearer`).
 * - `isValid` == NOT expired; tokens WITHOUT `exp` are valid; empty or
 *   unparseable tokens are expired.
 * - A token valid before the SDK swap stays valid after it.
 */
import { describe, assert, test } from "vitest";
import { getTokenPayload, isTokenExpired } from "@/tools/jwt";
import { BaseAuthStore } from "@/stores/BaseAuthStore";
import { dummyJWT } from "../../tests/mocks";

describe("golden: jwt / token contract", function () {
    test("payload decoding reads real claims, tolerates garbage", function () {
        const token = dummyJWT({ id: "u1", type: "auth", exp: 9999999999 });
        assert.equal(getTokenPayload(token).id, "u1");
        assert.deepEqual(getTokenPayload(""), {});
        assert.deepEqual(getTokenPayload("not.a.token"), {});
        assert.deepEqual(getTokenPayload("a.b.c"), {}); // invalid base64 payload
    });

    test("expiration semantics", function () {
        const future = Date.now() / 1000 + 3600;
        const past = Date.now() / 1000 - 3600;
        assert.isFalse(isTokenExpired(dummyJWT({ exp: future })));
        assert.isTrue(isTokenExpired(dummyJWT({ exp: past })));
        // no exp claim -> valid (loosely)
        assert.isFalse(isTokenExpired(dummyJWT({ id: "x" })));
        // empty/unparseable -> expired
        assert.isTrue(isTokenExpired(""));
        assert.isTrue(isTokenExpired("garbage"));
        // threshold shifts the boundary
        assert.isTrue(isTokenExpired(dummyJWT({ exp: future }), 7200));
    });

    test("isValid mirrors expiration; pre-existing tokens stay valid", function () {
        const store = new BaseAuthStore();
        // token minted BEFORE the sdk swap
        store.save(dummyJWT({ id: "u1", exp: Date.now() / 1000 + 600 }), {
            id: "u1",
        } as any);
        assert.isTrue(store.isValid);
        store.save(dummyJWT({ id: "u1", exp: Date.now() / 1000 - 600 }), {
            id: "u1",
        } as any);
        assert.isFalse(store.isValid);
    });

    test("superuser detection (incl. collectionId checksum fallback)", function () {
        const store = new BaseAuthStore();
        store.save(dummyJWT({ type: "auth", collectionId: "pbc_3142635823" }), null);
        assert.isTrue(store.isSuperuser);

        store.save(dummyJWT({ type: "auth" }), {
            collectionName: "_superusers",
        } as any);
        assert.isTrue(store.isSuperuser);

        store.save(dummyJWT({ type: "auth" }), {
            collectionName: "users",
        } as any);
        assert.isFalse(store.isSuperuser);
    });
});
