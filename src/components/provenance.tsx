"use client";

/**
 * Provenance: a small accessible self-citation popover.
 *
 * The site's conceit is that it cites itself (DESIGN.md F3). Each trigger is an
 * inline mono `[src: <label>]` button; revealing it shows a short plain-text
 * explanation of where the figure came from.
 *
 * SECURITY POSTURE (design spec, "Rendering"): both the label and the source
 * are rendered as React TEXT NODES only. There is NO dangerouslySetInnerHTML,
 * no HTML parsing, and nothing clickable inside the popover. Public labels are
 * reader-legible; no internal tool name or client identifier is ever shown.
 *
 * ACCESSIBILITY: all three input modes reveal the source.
 *   - MOUSE: hover over the trigger shows it, leaving hides it.
 *   - KEYBOARD: the trigger is a focusable <button>; focus shows it, blur and
 *     Escape hide it. aria-expanded and aria-describedby are wired to the panel.
 *   - TOUCH: tapping the trigger toggles it (click handler).
 *
 * MOTION: the only entrance effect is a CSS opacity transition, which globals
 * disables entirely under prefers-reduced-motion, so this is reduced-motion safe.
 */

import { useId, useState } from "react";

export function Provenance({
  label,
  source,
}: {
  label: string;
  source: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="cursor-help rounded-xs font-mono text-line underline-offset-2 outline-none hover:text-muted focus-visible:text-muted focus-visible:underline"
      >
        {" "}
        [src: {label}]
      </button>
      <span
        id={panelId}
        role="tooltip"
        aria-hidden={!open}
        style={{ opacity: open ? 1 : 0 }}
        className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 block w-56 rounded-md border border-line bg-surface p-2.5 font-mono text-[11px] normal-case leading-snug tracking-normal text-muted shadow-lg transition-opacity duration-150 ease-out motion-reduce:transition-none"
      >
        {source}
      </span>
    </span>
  );
}
