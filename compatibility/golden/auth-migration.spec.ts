/**
 * Auth migration test (MANDATORY scenario).
 *
 * Simulates the real upgrade path:
 *
 *   pocketbase@0.26.1  ->  login, persist state  ->  swap SDK to
 *   @flitware/base  ->  read existing state  ->  SAME AUTH SESSION
 *
 * It writes state in the ORIGINAL format (raw localStorage payload under
 * `pocketbase_auth` and raw cookie under `pb_auth`, exactly as v0.26.1
 * serializes them) and then boots the CURRENT SDK code on top of that
 * pre-existing state. The session (token, record, validity) must survive.
 *
 * If anyone renames a storage key or changes the payload shape, this fails.
 */
import { describe, assert, test, afterEach } from "vitest";
import Client from "@/Client";
import { BaseAuthStore } from "@/stores/BaseAuthStore";
import { LocalAuthStore } from "@/stores/LocalAuthStore";
import { dummyJWT } from "../../tests/mocks";

function installFakeLocalStorage(prefill: Record<string, string> = {}) {
    const bag: Record<string, string> = { ...prefill };
    (global as any).window = {
        localStorage: {
            getItem: (k: string) => (k in bag ? bag[k] : null),
            setItem: (k: string, v: string) => {
                bag[k] = String(v);
            },
            removeItem: (k: string) => {
                delete bag[k];
            },
        },
    };
    return bag;
}

describe("golden: auth migration pocketbase@0.26.1 -> @flitware/base", function () {
    afterEach(function () {
        (global as any).window = undefined;
    });

    test("localStorage session created by the ORIGINAL sdk is recovered intact", function () {
        // --- phase 1: original SDK persisted this (byte-exact v0.26.1 format) ---
        const validToken = dummyJWT({ id: "user-1", exp: Date.now() / 1000 + 3600 });
        installFakeLocalStorage({
            pocketbase_auth: JSON.stringify({
                token: validToken,
                record: { id: "user-1", collectionName: "users", email: "a@b.c" },
            }),
        });

        // --- phase 2: app upgraded, new SDK boots on the same storage ---
        const client = new Client("https://api.flitware.example");
        assert.equal(client.authStore.token, validToken);
        assert.equal(client.authStore.record?.id, "user-1");
        assert.equal(client.authStore.record?.collectionName, "users");
        assert.isTrue(client.authStore.isValid);
    });

    test("cookie session created by the ORIGINAL sdk is recovered intact", function () {
        // byte-exact v0.26.1 cookie payload under the historical key
        const validToken = dummyJWT({ id: "user-2", exp: Date.now() / 1000 + 3600 });
        const rawCookie =
            "pb_auth=" +
            encodeURIComponent(
                JSON.stringify({
                    token: validToken,
                    record: { id: "user-2", collectionName: "drivers" },
                }),
            ) +
            "; Path=/; HttpOnly";

        const store = new BaseAuthStore();
        store.loadFromCookie(rawCookie);
        assert.equal(store.token, validToken);
        assert.equal(store.record?.id, "user-2");
        assert.isTrue(store.isValid);
    });

    test("no new-brand keys are introduced alongside the historical ones", function () {
        const bag = installFakeLocalStorage();
        const store = new LocalAuthStore();
        store.save("t", { id: "x" } as any);
        assert.deepEqual(Object.keys(bag), ["pocketbase_auth"]);

        const cookie = new BaseAuthStore();
        cookie.save("t", null);
        assert.match(cookie.exportToCookie(), /^pb_auth=/);
    });

    test("logout still clears the historical key (no orphan sessions)", function () {
        const bag = installFakeLocalStorage();
        const client = new Client("https://api.flitware.example");
        client.authStore.save("t", { id: "x" } as any);
        assert.isDefined(bag["pocketbase_auth"]);
        client.authStore.clear();
        assert.isUndefined(bag["pocketbase_auth"]);
        assert.equal(client.authStore.token, "");
        assert.isNull(client.authStore.record);
    });
});
