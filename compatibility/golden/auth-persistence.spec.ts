/**
 * Golden persistence tests.
 *
 * Pins every byte of SDK-persisted state that must survive the
 * `pocketbase@0.26.1` -> `@flitware/base` upgrade:
 *   - localStorage key `pocketbase_auth` (+ JSON `{token, record}` shape)
 *   - cookie key `pb_auth` (+ JSON `{token, record}` shape, legacy `model` read)
 *   - AsyncAuthStore serialized shape `{token, record}`
 */
import { describe, assert, test, afterEach } from "vitest";
import Client from "@/Client";
import { BaseAuthStore } from "@/stores/BaseAuthStore";
import { LocalAuthStore } from "@/stores/LocalAuthStore";
import { AsyncAuthStore } from "@/stores/AsyncAuthStore";

function installFakeLocalStorage() {
    const bag: Record<string, string> = {};
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

describe("golden: persisted state", function () {
    afterEach(function () {
        (global as any).window = undefined;
    });

    test("LocalAuthStore default key is pocketbase_auth with {token, record} shape", function () {
        const bag = installFakeLocalStorage();
        const store = new LocalAuthStore();
        store.save("tok-1", { id: "u1", collectionName: "users" } as any);

        assert.isDefined(bag["pocketbase_auth"]);
        assert.isUndefined(bag["flitware_auth"]);
        assert.deepEqual(JSON.parse(bag["pocketbase_auth"]), {
            token: "tok-1",
            record: { id: "u1", collectionName: "users" },
        });

        // a fresh store over the same storage sees the same session
        const reopened = new LocalAuthStore();
        assert.equal(reopened.token, "tok-1");
        assert.equal(reopened.record?.id, "u1");

        reopened.clear();
        assert.isUndefined(bag["pocketbase_auth"]);
    });

    test("LocalAuthStore reads legacy persisted `model` property", function () {
        const bag = installFakeLocalStorage();
        bag["pocketbase_auth"] = JSON.stringify({
            token: "tok-legacy",
            model: { id: "u9", collectionName: "users" },
        });
        const store = new LocalAuthStore();
        assert.equal(store.token, "tok-legacy");
        assert.equal(store.record?.id, "u9");
    });

    test("cookie key is pb_auth with {token, record} shape + legacy model read", function () {
        const store = new BaseAuthStore();
        store.save("tok-2", { id: "u2", collectionName: "users" } as any);
        const cookie = store.exportToCookie();
        assert.match(cookie, /^pb_auth=/);
        assert.notMatch(cookie, /flitware_auth/);

        const restored = new BaseAuthStore();
        restored.loadFromCookie(cookie);
        assert.equal(restored.token, "tok-2");
        assert.equal(restored.record?.id, "u2");

        // legacy payloads using `model` instead of `record` still load
        const legacy = new BaseAuthStore();
        legacy.loadFromCookie(
            "pb_auth=" +
                encodeURIComponent(JSON.stringify({ token: "t", model: { id: "m1" } })),
        );
        assert.equal(legacy.record?.id, "m1");
    });

    test("AsyncAuthStore serializes {token, record} and restores initial payload", async function () {
        let saved = "";
        const store = new AsyncAuthStore({
            save: async (v: string) => {
                saved = v;
            },
            initial: JSON.stringify({ token: "tok-3", record: { id: "u3" } }),
        });
        await new Promise((r) => setTimeout(r, 20));
        assert.equal(store.token, "tok-3");
        assert.equal(store.record?.id, "u3");

        store.save("tok-4", { id: "u4" } as any);
        await new Promise((r) => setTimeout(r, 20));
        assert.deepEqual(JSON.parse(saved), { token: "tok-4", record: { id: "u4" } });
    });

    test("Client persists auth responses into the store (authWithPassword)", async function () {
        const original = global.fetch;
        (global as any).fetch = async () => {
            return {
                url: "http://example.com/api/collections/users/auth-with-password",
                status: 200,
                json: async () => ({
                    token: "login-token",
                    record: { id: "u5", collectionName: "users" },
                }),
            } as Response;
        };
        try {
            const client = new Client("http://example.com");
            client.autoCancellation(false);
            const res = await client.collection("users").authWithPassword("a", "b");
            assert.equal(res.token, "login-token");
            assert.equal(client.authStore.token, "login-token");
            assert.equal(client.authStore.record?.id, "u5");
        } finally {
            global.fetch = original;
        }
    });
});
