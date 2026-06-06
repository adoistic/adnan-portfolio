/**
 * Tests for the pure parse model behind <SafeText>.
 *
 * Runs under Node 24's built-in test runner with TS type-stripping:
 *   node --test src/components/safe-text.test.ts
 *
 * The render model is intentionally a pure function (`parseSafeText`) so the
 * security guarantees can be asserted without a DOM or React renderer.
 *
 * The non-negotiable guarantee (design spec, "Rendering"): the model emits ONLY
 * `text` and inert `src` segments. There is no link/element kind, so a
 * `<script>` tag or a `javascript:` href can only ever appear as literal text.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSafeText, type Segment } from "./safe-text-model.ts";

function flat(input: string): Segment[] {
  return parseSafeText(input).lines.flat();
}

function textOf(segs: Segment[]): string {
  return segs.map((s) => (s.kind === "text" ? s.value : `[src:${s.id}]`)).join("");
}

test("only text and src segment kinds are ever produced", () => {
  const samples = [
    "<script>alert(1)</script>",
    "[x](javascript:alert(1))",
    "see [src:hayek-3] and [src:popper-1]",
    "<a href=\"javascript:alert(1)\">click</a>",
    "data:text/html,<script>alert(1)</script>",
    "onerror=alert(1)",
    "plain words\nsecond line",
  ];
  for (const s of samples) {
    for (const seg of flat(s)) {
      assert.ok(
        seg.kind === "text" || seg.kind === "src",
        `unexpected segment kind for ${JSON.stringify(s)}: ${seg.kind}`,
      );
      // No segment carries an href / url / link field of any kind.
      assert.ok(
        !("href" in seg) && !("url" in seg),
        "segment must not carry any link target",
      );
    }
  }
});

test("<script> renders as literal text, never an element", () => {
  const segs = flat("<script>alert(1)</script>");
  // The whole thing is one literal text segment.
  assert.equal(segs.length, 1);
  assert.equal(segs[0].kind, "text");
  assert.equal(textOf(segs), "<script>alert(1)</script>");
});

test("[x](javascript:...) markdown-link syntax is inert literal text", () => {
  const input = "[x](javascript:alert(1))";
  const segs = flat(input);
  // No `src` token is matched (no [src:...]); it is pure text.
  assert.ok(segs.every((s) => s.kind === "text"));
  assert.equal(textOf(segs), input);
  // Sanity: the dangerous scheme survived only as text, not as a target.
  assert.ok(textOf(segs).includes("javascript:"));
});

test("[src:id] tokens become inert src segments with text on both sides", () => {
  const segs = flat("before [src:abc-1] after");
  assert.deepEqual(segs, [
    { kind: "text", value: "before " },
    { kind: "src", id: "abc-1" },
    { kind: "text", value: " after" },
  ]);
});

test("a src id cannot smuggle a closing bracket / markup", () => {
  // The id stops at the first ']', so '<script>' after it stays literal text.
  const segs = flat("[src:ok]<script>");
  assert.deepEqual(segs, [
    { kind: "src", id: "ok" },
    { kind: "text", value: "<script>" },
  ]);
});

test("newlines split into separate lines", () => {
  const model = parseSafeText("line one\nline two");
  assert.equal(model.lines.length, 2);
  assert.equal(textOf(model.lines[0]), "line one");
  assert.equal(textOf(model.lines[1]), "line two");
});

test("round-trips arbitrary text without loss (minus src tokens)", () => {
  const input = "a <b> & \"c\" 'd' \\e/ — f";
  assert.equal(textOf(flat(input)), input);
});
