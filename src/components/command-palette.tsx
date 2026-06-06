"use client";

/**
 * CommandPalette: a dependency-free, keyboard-first navigator.
 *
 * Open: Cmd-K / Ctrl-K, or "/" (when not typing in a field), or the corner chip.
 * Navigate: ArrowUp / ArrowDown (wrapping), Enter activates, Esc closes.
 * The modal traps focus while open and restores focus to the prior element on close.
 * "g" (when not typing and the palette is closed) is the graph navigator: it
 * scrolls the hero knowledge-graph card into view and focuses it.
 *
 * Reduced-motion aware. Tokens only (surface, line, ink, muted, accent).
 * See DESIGN.md "Command palette" and the spec F4.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

type Item = {
  id: string;
  label: string;
  hint: string;
  target: string;
  focus?: boolean;
};

const ITEMS: Item[] = [
  { id: "how-i-build", label: "how i build", hint: "section", target: "how-i-build" },
  { id: "method-applied", label: "the method, applied", hint: "section", target: "method-applied" },
  { id: "falsafa", label: "falsafa", hint: "section", target: "falsafa" },
  { id: "recognition", label: "recognition", hint: "section", target: "recognition" },
  { id: "writing", label: "writing", hint: "section", target: "writing" },
  { id: "about", label: "about", hint: "section", target: "about" },
  { id: "contact", label: "contact", hint: "section", target: "contact" },
  { id: "graph", label: "open the graph", hint: "action", target: "graph", focus: true },
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

function goToTarget(targetId: string, focus: boolean) {
  const node = document.getElementById(targetId);
  if (!node) return;
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  node.scrollIntoView({ behavior, block: "start" });
  if (focus) {
    // Defer the focus so it does not fight the smooth scroll.
    window.setTimeout(() => node.focus({ preventScroll: true }), 0);
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((it) => it.label.toLowerCase().includes(q));
  }, [query]);

  // Keep the highlighted index in range as results change.
  useEffect(() => {
    setActive((a) => (results.length === 0 ? 0 : Math.min(a, results.length - 1)));
  }, [results.length]);

  const close = useCallback(() => {
    setOpen(false);
    const el = restoreRef.current;
    restoreRef.current = null;
    if (el && typeof el.focus === "function") {
      el.focus();
    }
  }, []);

  const openPalette = useCallback(() => {
    if (open) return;
    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setActive(0);
    setOpen(true);
  }, [open]);

  const activate = useCallback(
    (item: Item | undefined) => {
      if (!item) return;
      setOpen(false);
      restoreRef.current = null;
      goToTarget(item.target, Boolean(item.focus));
    },
    []
  );

  // Global hotkeys: open (Cmd/Ctrl-K, "/") and the "g" graph navigator.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key;
      const meta = e.metaKey || e.ctrlKey;

      if (meta && (key === "k" || key === "K")) {
        e.preventDefault();
        if (open) {
          close();
        } else {
          openPalette();
        }
        return;
      }

      if (open) return;

      if (isTypingTarget(e.target)) return;

      if (key === "/") {
        e.preventDefault();
        openPalette();
        return;
      }

      if (key === "g" || key === "G") {
        e.preventDefault();
        goToTarget("graph", true);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, openPalette, close]);

  // Focus the input when the palette opens.
  useEffect(() => {
    if (open) {
      // Defer so the input is mounted.
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // In-dialog keyboard handling: navigation, activation, close, focus trap.
  const onDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (results.length === 0) return;
        setActive((a) => (a + 1) % results.length);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (results.length === 0) return;
        setActive((a) => (a - 1 + results.length) % results.length);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        activate(results[active]);
        return;
      }

      if (e.key === "Tab") {
        // Trap focus inside the dialog. Only the input is tabbable, so keep it there.
        e.preventDefault();
        inputRef.current?.focus();
      }
    },
    [results, active, activate, close]
  );

  return (
    <>
      {/* Understated corner chip. Subtle on small screens, full on sm+. */}
      <button
        type="button"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-label="Open command palette"
        className="fixed bottom-4 right-4 z-40 rounded-md border border-line bg-surface/80 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted backdrop-blur transition-colors hover:border-accent hover:text-accent sm:text-[11px]"
      >
        <span className="hidden sm:inline">Cmd-K</span>
        <span className="sm:hidden" aria-hidden="true">
          K
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[18vh]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" aria-hidden="true" />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={onDialogKeyDown}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-md border border-line bg-surface shadow-2xl"
          >
            <div className="border-b border-line px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                placeholder="jump to a section, or open the graph"
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-transparent font-mono text-sm text-ink placeholder:text-muted/70 focus:outline-none"
              />
            </div>

            <ul id={listId} role="listbox" aria-label="destinations" className="max-h-72 overflow-y-auto py-1">
              {results.length === 0 ? (
                <li className="px-3 py-3 font-mono text-xs text-muted">no matches</li>
              ) : (
                results.map((it, i) => {
                  const isActive = i === active;
                  return (
                    <li
                      key={it.id}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        activate(it);
                      }}
                      className={
                        "flex cursor-pointer items-center justify-between px-3 py-2 font-mono text-sm " +
                        (isActive ? "bg-line/60 text-ink" : "text-muted")
                      }
                    >
                      <span>{it.label}</span>
                      <span
                        className={
                          "text-[10px] uppercase tracking-widest " +
                          (it.hint === "action" ? "text-accent" : "text-muted/70")
                        }
                      >
                        {it.hint}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted/70">
              <span>up / down to move</span>
              <span>enter to go, esc to close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
