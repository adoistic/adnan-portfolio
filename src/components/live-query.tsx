"use client";

import { useId, useState } from "react";

type Hit = {
  text: string;
  work: string;
  workTitle: string;
  author: string;
  chapter: string;
  chapterTitle: string;
  id: string;
  score: number;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; hits: Hit[]; query: string };

export function LiveQuery() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function run() {
    const q = query.trim();
    if (q.length < 1) return;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        setState({
          status: "error",
          message: "the librarian could not answer that. try another query.",
        });
        return;
      }
      const data = (await res.json()) as { hits?: Hit[] };
      setState({ status: "done", hits: data.hits ?? [], query: q });
    } catch {
      setState({
        status: "error",
        message: "the librarian is unreachable. try again.",
      });
    }
  }

  return (
    <div className="rounded-md border border-line bg-surface/40 p-4 md:p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-col gap-2"
      >
        <label
          htmlFor={inputId}
          className="font-mono text-[10px] uppercase tracking-widest text-muted"
        >
          run a query
        </label>
        <div className="flex items-stretch gap-2">
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="freedom of thought"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-sm border border-line bg-bg px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={state.status === "loading" || query.trim().length < 1}
            className="rounded-sm border border-line px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-accent focus:border-accent focus:text-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.status === "loading" ? "…" : "ask"}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-4">
        {state.status === "idle" && (
          <p className="font-mono text-xs text-muted">
            <span className="text-line">// </span>
            type a phrase and press enter. the librarian retrieves real
            passages, with citations.
          </p>
        )}

        {state.status === "loading" && (
          <p className="font-mono text-xs text-muted">
            <span className="text-accent">// </span>retrieving…
          </p>
        )}

        {state.status === "error" && (
          <p className="font-mono text-xs text-metric">
            <span className="text-line">// </span>
            {state.message}
          </p>
        )}

        {state.status === "done" && state.hits.length === 0 && (
          <p className="font-mono text-xs text-muted">
            <span className="text-line">// </span>no passages matched
            &ldquo;{state.query}&rdquo;.
          </p>
        )}

        {state.status === "done" && state.hits.length > 0 && (
          <ul className="space-y-5">
            {state.hits.map((hit, i) => (
              <li
                key={hit.id}
                className={
                  i > 0 ? "border-t border-line pt-5 rise" : "rise"
                }
              >
                <p className="font-serif text-sm leading-relaxed text-ink">
                  {hit.text}
                </p>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
                  — {hit.author}, {hit.workTitle} · {hit.chapterTitle}
                  <span className="text-line"> [src:{hit.id}]</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
