/**
 * Tests for the SSR-safe key-store helpers.
 *
 * Runs under Node 24's built-in test runner with TS type-stripping:
 *   node --test src/lib/key-store.test.ts
 *
 * We stub `globalThis.window` with an in-memory localStorage so the helpers
 * (which guard on `typeof window`) operate against it. A "throwing" stub
 * exercises the private-mode quota path.
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Minimal in-memory Storage stub.
function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    get length() {
      return map.size;
    },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
  } as unknown as Storage;
}

function installWindow(storage: Storage | (() => never)) {
  const win =
    typeof storage === "function"
      ? Object.defineProperty({}, "localStorage", { get: storage })
      : { localStorage: storage };
  (globalThis as { window?: unknown }).window = win;
}

function clearWindow() {
  delete (globalThis as { window?: unknown }).window;
}

// Import AFTER the helpers are defined; they read window lazily per call, so a
// single import is fine across the suite.
const ks = await import("./key-store.ts");

beforeEach(() => {
  installWindow(makeStorage());
});

afterEach(() => {
  clearWindow();
});

test("key round-trips: set then get", () => {
  assert.equal(ks.getKey(), "");
  ks.setKey("sk-or-abc123");
  assert.equal(ks.getKey(), "sk-or-abc123");
});

test("clearKey removes the key", () => {
  ks.setKey("sk-or-xyz");
  assert.equal(ks.getKey(), "sk-or-xyz");
  ks.clearKey();
  assert.equal(ks.getKey(), "");
});

test("setKey with empty / whitespace clears instead of storing", () => {
  ks.setKey("sk-or-real");
  ks.setKey("   ");
  assert.equal(ks.getKey(), "");
});

test("model defaults, round-trips, and ignores empty", () => {
  assert.equal(ks.getModel(), ks.DEFAULT_MODEL);
  ks.setModel("anthropic/claude-3.5-haiku");
  assert.equal(ks.getModel(), "anthropic/claude-3.5-haiku");
  ks.setModel("   ");
  // Unchanged by the empty set.
  assert.equal(ks.getModel(), "anthropic/claude-3.5-haiku");
});

test("SSR-safe: with no window, reads return defaults and writes are no-ops", () => {
  clearWindow();
  assert.equal(ks.getKey(), "");
  assert.equal(ks.getModel(), ks.DEFAULT_MODEL);
  // Must not throw.
  assert.doesNotThrow(() => ks.setKey("sk-or-nope"));
  assert.doesNotThrow(() => ks.setModel("x/y"));
  assert.doesNotThrow(() => ks.clearKey());
});

test("private-mode: a throwing localStorage degrades to no-op, never throws", () => {
  installWindow(() => {
    throw new DOMException("denied", "SecurityError");
  });
  assert.doesNotThrow(() => ks.setKey("sk-or-quota"));
  assert.equal(ks.getKey(), "");
  assert.equal(ks.getModel(), ks.DEFAULT_MODEL);
});
