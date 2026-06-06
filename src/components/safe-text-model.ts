/**
 * Pure parse model behind <SafeText>. No React, no DOM — directly unit-testable.
 *
 * SECURITY POSTURE (design spec, "Rendering"): this produces a model of TEXT
 * and inert `src` segments ONLY. There is no link/element kind, so a `<script>`
 * tag or a `javascript:`/`data:` href can only ever surface as literal text.
 * The only inert transforms are:
 *   - newline -> a new line in the model (a line break at render time)
 *   - `[src:<id>]` citation tokens -> an inert `src` segment
 */

/** One inline token within a line. */
export type Segment =
  | { kind: "text"; value: string }
  | { kind: "src"; id: string };

/** A render model: lines, each a list of inline segments. */
export type SafeModel = { lines: Segment[][] };

// Matches a citation token like [src:hayek-3]. The id is any run of characters
// that is not a closing bracket, so it can never smuggle in markup boundaries.
const SRC_RE = /\[src:([^\]]*)\]/g;

/**
 * Parse a raw string into the inert render model. PURE.
 *
 * Guarantees asserted by tests:
 *   - The output contains ONLY `text` and `src` segments.
 *   - No segment is ever a link, an element, or carries an href.
 *   - Arbitrary input (including `<script>...</script>` and
 *     `[x](javascript:...)`) is preserved as literal `text` (aside from
 *     `[src:]` tokens, which become inert `src` segments).
 */
export function parseSafeText(input: string): SafeModel {
  const rawLines = input.split("\n");
  const lines: Segment[][] = rawLines.map(parseLine);
  return { lines };
}

function parseLine(line: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  SRC_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SRC_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: line.slice(lastIndex, match.index) });
    }
    segments.push({ kind: "src", id: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    segments.push({ kind: "text", value: line.slice(lastIndex) });
  }

  // An empty line yields a single empty text segment so a blank line still
  // produces vertical space at render time.
  if (segments.length === 0) {
    segments.push({ kind: "text", value: "" });
  }

  return segments;
}
