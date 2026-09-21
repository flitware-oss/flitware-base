/**
 * Golden realtime-protocol tests.
 *
 * Pins the REAL v0.26.1 realtime mechanism (SSE via global `EventSource`,
 * NOT WebSocket):
 *   - connect:  `GET /api/realtime`, `PB_CONNECT` event, `clientId = lastEventId`
 *   - submit:   `POST /api/realtime` `{ clientId, subscriptions }`
 *   - cancel:   requestKey `realtime_<clientId>`
 *   - topics:   `<collection>/<id|*>`
 *   - teardown: unsubscribe-all closes the SSE connection
 */
import { describe, assert, expect, test, beforeAll, afterAll, afterEach } from "vitest";
import Client from "@/Client";
import { FetchMock } from "../../tests/mocks";

type Listener = (e: any) => void;

class FakeEventSource {
    static instances: FakeEventSource[] = [];
    url: string;
    closed = false;
    listeners: Record<string, Listener[]> = {};
    onerror: ((e: any) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        FakeEventSource.instances.push(this);
    }
    addEventListener(type: string, cb: Listener) {
        (this.listeners[type] ||= []).push(cb);
    }
    removeEventListener(type: string, cb: Listener) {
        this.listeners[type] = (this.listeners[type] || []).filter((l) => l !== cb);
    }
    emit(type: string, event: any) {
        for (const cb of this.listeners[type] || []) cb(event);
    }
    close() {
        this.closed = true;
    }
}

describe("golden: realtime protocol", function () {
    const fetchMock = new FetchMock();

    beforeAll(function () {
        fetchMock.init();
        (global as any).EventSource = FakeEventSource;
    });

    afterAll(function () {
        fetchMock.restore();
        delete (global as any).EventSource;
    });

    afterEach(function () {
        fetchMock.clearMocks();
        FakeEventSource.instances = [];
    });

    async function connectClient(client: Client, clientId = "client-1") {
        fetchMock.on({
            method: "POST",
            url: client.buildURL("/api/realtime"),
            replyCode: 204,
            replyBody: {},
        });
        const p = client.realtime.subscribe("drivers/*", () => {});
        // simulate the server PB_CONNECT handshake
        FakeEventSource.instances[0].emit("PB_CONNECT", {
            lastEventId: clientId,
            data: "{}",
        });
        const unsub = await p;
        assert.isTrue(client.realtime.isConnected);
        assert.equal(client.realtime.clientId, clientId);
        return unsub;
    }

    test("connect uses SSE GET /api/realtime + PB_CONNECT handshake", async function () {
        const client = new Client("http://example.com");
        client.autoCancellation(false);
        const unsub = await connectClient(client);
        assert.equal(FakeEventSource.instances.length, 1);
        assert.equal(
            FakeEventSource.instances[0].url,
            "http://example.com/api/realtime",
        );
        await unsub();
    });

    test("submit posts {clientId, subscriptions} with realtime_<id> cancel key", async function () {
        const client = new Client("http://example.com");
        let seenBody: any = null;
        let seenKey: any = undefined;
        fetchMock.on({
            method: "POST",
            url: client.buildURL("/api/realtime"),
            replyCode: 204,
            replyBody: {},
            additionalMatcher: (_url, config) => {
                seenBody = JSON.parse(config?.body);
                seenKey = (config as any)?.requestKey;
                return true;
            },
        });
        // NOTE: a single capturing mock (no competing mocks) so the submit
        // request is guaranteed to reach additionalMatcher.
        const p = client.realtime.subscribe("drivers/*", () => {});
        FakeEventSource.instances[0].emit("PB_CONNECT", {
            lastEventId: "abc",
            data: "{}",
        });
        const unsub = await p;
        assert.deepEqual(seenBody, { clientId: "abc", subscriptions: ["drivers/*"] });
        assert.equal((client.realtime as any).getSubscriptionsCancelKey(), "realtime_abc");
        assert.isUndefined(seenKey); // requestKey is client-internal: consumed as cancel key, never sent
        await unsub();
    });

    test("collection.subscribe prefixes the collection name", async function () {
        const client = new Client("http://example.com");
        client.autoCancellation(false);
        fetchMock.on({
            method: "POST",
            url: client.buildURL("/api/realtime"),
            replyCode: 204,
            replyBody: {},
        });
        const p = client.collection("fleet").subscribe("veh-1", () => {});
        FakeEventSource.instances[0].emit("PB_CONNECT", {
            lastEventId: "c1",
            data: "{}",
        });
        const unsub = await p;
        assert.deepEqual((client.realtime as any).lastSentSubscriptions, [
            "fleet/veh-1",
        ]);
        await unsub();
    });

    test("unsubscribe-all disconnects and closes the SSE connection", async function () {
        const client = new Client("http://example.com");
        client.autoCancellation(false);
        await connectClient(client);
        await client.realtime.unsubscribe();
        assert.isFalse(client.realtime.isConnected);
        assert.isTrue(FakeEventSource.instances[0].closed);
        assert.equal(client.realtime.clientId, "");
    });

    test("empty topic is rejected", async function () {
        const client = new Client("http://example.com");
        await expect(client.realtime.subscribe("", () => {})).rejects.toThrow(
            "topic must be set.",
        );
    });
});
