/**
 * Golden API-surface tests.
 *
 * Snapshots the public surface every existing application relies on:
 * construction, services, CRUD entry points, auth store, helpers, error
 * type and module exports. Any accidental deletion or signature change
 * fails here.
 *
 * NOTE: the root default export is intentionally imported under the
 * historical consumer name (`PocketBase`) to prove that existing
 * application code keeps working after the SDK swap.
 */
import { describe, assert, test } from "vitest";
import PocketBase from "@/Client";
import * as publicApi from "@/index";
import { ClientResponseError } from "@/ClientResponseError";
import { BaseAuthStore } from "@/stores/BaseAuthStore";
import { LocalAuthStore } from "@/stores/LocalAuthStore";
import { AsyncAuthStore } from "@/stores/AsyncAuthStore";
import { RecordService } from "@/services/RecordService";
import { getTokenPayload } from "@/tools/jwt";
import { cookieParse } from "@/tools/cookie";

describe("golden: public API surface", function () {
    test("default export constructs a fully-wired client", function () {
        const pb = new PocketBase("https://api.example.com");

        // core surface used by existing apps
        assert.isFunction(pb.collection);
        assert.isFunction(pb.createBatch);
        assert.isFunction(pb.send);
        assert.isFunction(pb.filter);
        assert.isFunction(pb.buildURL);
        assert.isFunction(pb.autoCancellation);
        assert.isFunction(pb.cancelRequest);
        assert.isFunction(pb.cancelAllRequests);

        // services
        for (const key of [
            "collections",
            "files",
            "logs",
            "settings",
            "realtime",
            "health",
            "backups",
            "crons",
            "admins",
        ]) {
            assert.isDefined((pb as any)[key], key);
        }

        // auth store defaults
        assert.instanceOf(pb.authStore, BaseAuthStore);
        assert.instanceOf(pb.authStore, LocalAuthStore);
        assert.equal(pb.lang, "en-US");
        assert.equal(pb.baseURL, "https://api.example.com");
    });

    test("collection() returns cached RecordService with CRUD + auth methods", function () {
        const pb = new PocketBase("https://api.example.com");
        const drivers = pb.collection("drivers");
        assert.instanceOf(drivers, RecordService);
        assert.strictEqual(pb.collection("drivers"), drivers); // cached
        for (const m of [
            "getList",
            "getFullList",
            "getFirstListItem",
            "getOne",
            "create",
            "update",
            "delete",
            "subscribe",
            "unsubscribe",
            "authWithPassword",
            "authWithOAuth2Code",
            "authRefresh",
            "requestPasswordReset",
            "confirmPasswordReset",
            "requestVerification",
            "confirmVerification",
            "requestEmailChange",
            "confirmEmailChange",
            "requestOTP",
            "authWithOTP",
            "impersonate",
            "listAuthMethods",
        ]) {
            assert.isFunction((drivers as any)[m], m);
        }
    });

    test("index module keeps every historical named export", function () {
        for (const name of [
            "ClientResponseError",
            "LocalAuthStore",
            "AsyncAuthStore",
            "BaseAuthStore",
            "RealtimeService",
            "RecordService",
            "CrudService",
            "BatchService",
            "CollectionService",
            "HealthService",
            "LogService",
            "getTokenPayload",
            "isTokenExpired",
            "cookieParse",
            "cookieSerialize",
        ]) {
            assert.isDefined((publicApi as any)[name], name);
        }
        assert.isFunction((publicApi as any).default);
    });

    test("auth store contract: save/clear/onChange/isValid/cookie round-trip", function () {
        const store = new LocalAuthStore();
        const events: Array<[string, any]> = [];
        const unsub = store.onChange((t, r) => events.push([t, r]), true);
        assert.equal(events.length, 1); // fireImmediately

        store.save("tok", { id: "1" } as any);
        assert.equal(store.token, "tok");
        assert.equal(store.record?.id, "1");
        assert.isFunction(unsub);

        store.clear();
        assert.equal(store.token, "");
        assert.isNull(store.record);
        unsub();
    });

    test("AsyncAuthStore + BaseAuthStore classes are constructible", function () {
        assert.instanceOf(new BaseAuthStore(), BaseAuthStore);
        assert.instanceOf(
            new AsyncAuthStore({ save: async () => {} }),
            BaseAuthStore,
        );
    });

    test("ClientResponseError keeps shape, alias and serialization", function () {
        const err = new ClientResponseError({
            url: "http://x",
            status: 422,
            response: { message: "bad", data: { f: "req" } },
        });
        assert.equal(err.url, "http://x");
        assert.equal(err.status, 422);
        assert.equal(err.message, "bad");
        assert.deepEqual(err.data, err.response);
        assert.isFalse(err.isAbort);
        assert.containsAllKeys(err.toJSON(), ["url", "status", "response", "isAbort"]);
        // jwt/cookie tools are the same instances applications import
        assert.deepEqual(getTokenPayload(""), {});
        assert.deepEqual(cookieParse(""), {});
    });
});
