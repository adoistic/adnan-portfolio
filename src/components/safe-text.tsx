/**
 * Dependency-free, text-only renderer for model output and corpus passages.
 *
 * SECURITY POSTURE (design spec, "Rendering"): this produces React TEXT NODES
 * only. There is NO `dangerouslySetInnerHTML`, no markdown library, no HTML
 * parsing, and nothing clickable. The only transforms are inert:
 *   - newline -> a line break between text blocks
 *   - `[src:<id>]` citation tokens -> an INERT styled <span> (NOT a link)
 *
 * Because no HTML and no links are ever emitted, `<script>` tags,
 * `javascript:`/`data:` hrefs, and event-handler attributes are structurally
 * impossible to execute. They render as literal visible text. This is stronger
 * than escaping: there is no element that could carry them.
 *
 * The parsing lives in `safe-text-model.ts` as the pure `parseSafeText` so it
 * is unit-testable without a DOM (Node's TS type-stripping can run a `.ts`
 * file but not a `.tsx` one).
 */
import { Fragment, type ReactElement } from "react";
import { parseSafeText } from "./safe-text-model";

export { parseSafeText } from "./safe-text-model";
export type { Segment, SafeModel } from "./safe-text-model";

/**
 * Render a string as inert text nodes. The only non-text output is an inert
 * <span> for each `[src:id]` citation and a <br/> between lines — neither is
 * clickable or carries any URL.
 */
export function SafeText({ text }: { text: string }): ReactElement {
  const { lines } = parseSafeText(text);
  return (
    <>
      {lines.map((segments, lineIdx) => (
        <Fragment key={lineIdx}>
          {lineIdx > 0 && <br />}
          {segments.map((seg, segIdx) =>
            seg.kind === "src" ? (
              <span key={segIdx} className="text-line">
                [src:{seg.id}]
              </span>
            ) : (
              <Fragment key={segIdx}>{seg.value}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}
