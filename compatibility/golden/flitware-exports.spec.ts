/**
 * Flitware Base entry-point contract.
 *
 * Covers the ONLY intentional public API difference vs `pocketbase@0.26.1`:
 * the root export is consumable as `FlitwareBase` (default + named), with a
 * `PocketBase` named alias easing migration. All three are the same class
 * object with identical behavior.
 */
import { describe, assert, test } from "vitest";
import FlitwareBaseDefault, { FlitwareBase, PocketBase } from "@/index";
import FlitwareBaseDirect from "@/Client";

describe("flitware: entry points", function () {
    test("default, named and alias exports are the same class", function () {
        assert.strictEqual(FlitwareBaseDefault, FlitwareBase);
        assert.strictEqual(FlitwareBaseDirect, FlitwareBase);
        assert.strictEqual(PocketBase, FlitwareBase);
        assert.equal(FlitwareBase.name, "FlitwareBase");
    });

    test("recommended usage works: new FlitwareBase(url)", async function () {
        const pb = new FlitwareBase("https://api.example.com");
        assert.equal(pb.baseURL, "https://api.example.com");
        assert.isFunction(pb.collection);
        assert.isFunction(pb.send);
        assert.isFunction(pb.filter);
        assert.isFunction(pb.autoCancellation);

        // existing application code keeps working with a local `pb` variable
        const drivers = pb.collection("drivers");
        assert.equal(
            (drivers as any).baseCollectionPath,
            "/api/collections/drivers",
        );
    });

    test("migration alias constructs an identical client", function () {
        const a = new PocketBase("https://api.example.com");
        const b = new FlitwareBase("https://api.example.com");
        assert.equal(a.constructor, b.constructor);
        assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
    });
});
