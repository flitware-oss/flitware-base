/**
 * Golden wire-protocol tests.
 *
 * Purpose: pin the exact observable HTTP contract of the SDK so that any
 * future change (including the Flitware rebranding) that alters method, URL,
 * headers, query string, body serialization, response parsing or error
 * semantics fails loudly here.
 *
 * These tests MUST pass identically against `pocketbase@0.26.1` and
 * `@flitware/base`. Branding that crosses the client/server boundary is a bug.
 */
import { describe, assert, expect, test, beforeAll, afterAll, afterEach } from "vitest";
import Client from "@/Client";
import { FetchMock } from "../../tests/mocks";

function capturedRequest() {
    let seen: { url: any; config: any } | null = null;
    const original = global.fetch;
    (global as any).fetch = async (url: any, config: any) => {
        seen = { url, config };
        return {
            url,
            status: 200,
            json: async () => ({ ok: true }),
        } as Response;
    };
    return {
        seen: () => seen as unknown as { url: any; config: any },
        restore: () => {
            global.fetch = original;
        },
    };
}

describe("golden: wire protocol", function () {
    const fetchMock = new FetchMock();

    beforeAll(function () {
        fetchMock.init();
    });

    afterAll(function () {
        fetchMock.restore();
    });

    afterEach(function () {
        fetchMock.clearMocks();
    });

    test("auth header carries the RAW token (no Bearer prefix)", async function () {
        fetchMock.on({
            method: "GET",
            url: "http://example.com/api/health",
            replyCode: 200,
            replyBody: { message: "ok" },
            additionalMatcher: (_, config) => {
                return config?.headers?.["Authorization"] === "raw-token-123";
            },
        });

        const client = new Client("http://example.com");
        client.autoCancellation(false);
        client.authStore.save("raw-token-123", null);
        await client.send("/api/health", {});
    });

    test("default headers: Content-Type application/json + Accept-Language en-US", async function () {
        const cap = capturedRequest();
        try {
            const client = new Client("http://example.com/");
            client.autoCancellation(false);
            await client.send("/api/health", {});
            const { url, config } = cap.seen();
            assert.equal(url, "http://example.com/api/health");
            assert.equal(config.method, "GET");
            assert.equal(config.headers["Content-Type"], "application/json");
            assert.equal(config.headers["Accept-Language"], "en-US");
            assert.isUndefined(config.headers["Authorization"]);
        } finally {
            cap.restore();
        }
    });

    test("custom lang is sent as Accept-Language", async function () {
        const cap = capturedRequest();
        try {
            const client = new Client("http://example.com", null, "es-ES");
            client.autoCancellation(false);
            await client.send("/api/health", {});
            assert.equal(cap.seen().config.headers["Accept-Language"], "es-ES");
        } finally {
            cap.restore();
        }
    });

    test("explicit Authorization header is never overwritten", async function () {
        const cap = capturedRequest();
        try {
            const client = new Client("http://example.com");
            client.autoCancellation(false);
            client.authStore.save("store-token", null);
            await client.send("/api/health", {
                headers: { Authorization: "custom-token" },
            } as any);
            assert.equal(cap.seen().config.headers["Authorization"], "custom-token");
        } finally {
            cap.restore();
        }
    });

    test("query serialization: filter/sort/expand/fields/skipTotal", async function () {
        const cap = capturedRequest();
        try {
            const client = new Client("http://example.com");
            client.autoCancellation(false);
            await client.collection("drivers").getList(2, 25, {
                filter: "active = true",
                sort: "-created",
                expand: "fleet",
                fields: "id,name",
                skipTotal: true,
            } as any);
            const url = cap.seen().url as string;
            assert.include(url, "/api/collections/drivers/records?");
            assert.include(url, "page=2");
            assert.include(url, "perPage=25");
            assert.include(url, "filter=" + encodeURIComponent("active = true"));
            assert.include(url, "sort=" + encodeURIComponent("-created"));
            assert.include(url, "expand=" + encodeURIComponent("fleet"));
            assert.include(url, "fields=" + encodeURIComponent("id,name"));
            assert.include(url, "skipTotal=true");
        } finally {
            cap.restore();
        }
    });

    test("auth endpoints keep exact paths", async function () {
        const cap = capturedRequest();
        try {
            const client = new Client("http://example.com");
            client.autoCancellation(false);

            await client
                .collection("users")
                .authWithPassword("a@b.c", "secret")
                .catch(() => {});
            assert.include(cap.seen().url, "/api/collections/users/auth-with-password");
            assert.equal(cap.seen().config.method, "POST");
            assert.deepEqual(JSON.parse(cap.seen().config.body), {
                identity: "a@b.c",
                password: "secret",
            });

            await client.collection("users").authRefresh().catch(() => {});
            assert.include(cap.seen().url, "/api/collections/users/auth-refresh");

            await client.collection("users").requestPasswordReset("a@b.c").catch(() => {});
            assert.include(
                cap.seen().url,
                "/api/collections/users/request-password-reset",
            );
        } finally {
            cap.restore();
        }
    });

    test("filter() quoting and escaping rules", function () {
        const client = new Client("http://example.com");
        assert.equal(
            client.filter("a = {:s} && b = {:n} && c = {:b} && d = {:nil}", {
                s: "o'brien",
                n: 42,
                b: true,
                nil: null,
            }),
            "a = 'o\\'brien' && b = 42 && c = true && d = null",
        );
        const d = new Date("2024-01-02T03:04:05.000Z");
        assert.equal(client.filter("created >= {:d}", { d }), "created >= '2024-01-02 03:04:05.000Z'");
    });

    test("errors: status>=400 becomes ClientResponseError with url/status/response", async function () {
        fetchMock.on({
            method: "GET",
            url: "http://example.com/api/health",
            replyCode: 404,
            replyBody: { code: 404, message: "Not found", data: {} },
        });
        const client = new Client("http://example.com");
        client.autoCancellation(false);
        try {
            await client.send("/api/health", {});
            assert.fail("should have thrown");
        } catch (err: any) {
            assert.equal(err.name, "ClientResponseError 404");
            assert.equal(err.status, 404);
            assert.equal(err.response.message, "Not found");
            assert.equal(err.data.message, "Not found"); // legacy alias
            assert.isFalse(err.isAbort);
        }
    });

    test("auto-cancellation rejects superseded duplicated requests", async function () {
        fetchMock.on({
            method: "GET",
            url: "http://example.com/api/health",
            delay: 5,
            replyCode: 200,
            replyBody: {},
        });
        const client = new Client("http://example.com");
        const requestA = client.send("/api/health", {});
        const requestB = client.send("/api/health", {});
        const requestC = client.send("/api/health", {});
        // only the latest duplicate survives; earlier ones reject
        await expect(requestA).rejects.toThrow();
        await expect(requestB).rejects.toThrow();
        await expect(requestC).resolves.toBeDefined();
    });

    test("file URL shape: api/files/{collection}/{id}/{filename}", function () {
        const client = new Client("http://example.com");
        const url = client.files.getURL(
            { id: "rec1", collectionId: "col1" } as any,
            "photo.png",
            { thumb: "100x100" } as any,
        );
        assert.include(url, "api/files/col1/rec1/photo.png");
        assert.include(url, "thumb=100x100");
    });
});
