"use client";

/**
 * BYOK reasoning panel (OpenRouter-only).
 *
 * The visitor pastes their own OpenRouter key, picks a model, and asks a
 * question. The model is told to answer ONLY from passages returned by a
 * `search_corpus` tool. That tool is answered by our KEYLESS `/api/query`
 * route. The key rides only on the browser-originated request to OpenRouter
 * (inside `streamOpenRouter`); it never touches this site's origin.
 *
 * SECURITY (binding, from the design spec):
 *   - The key is read from key-store and passed ONLY to `streamOpenRouter`.
 *   - `/api/query` requests carry NO key and NO Authorization header.
 *   - The key is NEVER passed to console.* / analytics / any other origin.
 *   - Answer text and retrieved passages render via <SafeText> (inert text
 *     nodes only — no HTML, no links).
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  streamOpenRouter,
  type ChatMessage,
  type ToolDef,
  type ToolCall,
} from "@/lib/openrouter";
import {
  getKey,
  setKey,
  clearKey,
  getModel,
  setModel,
  DEFAULT_MODEL,
} from "@/lib/key-store";
import { SafeText } from "@/components/safe-text";

const MODELS = [
  { id: "openai/gpt-5-mini", label: "openai · gpt-5-mini" },
  { id: "anthropic/claude-3.5-haiku", label: "anthropic · claude-3.5-haiku" },
  { id: "google/gemini-2.0-flash-001", label: "google · gemini-2.0-flash" },
] as const;

const SYSTEM_PROMPT =
  "You answer ONLY from the passages returned by the search_corpus tool. " +
  "Always call search_corpus first. Cite passage ids in brackets like " +
  "[src:<id>]. If nothing relevant is found, say so plainly.";

const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "search_corpus",
      description:
        "Search the bundled philosophy corpus for passages relevant to a " +
        "query. Returns up to a few cited passages with ids.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search phrase.",
          },
        },
        required: ["query"],
      },
    },
  },
];

const MAX_ROUNDS = 10;

type Phase = "idle" | "thinking" | "retrieving" | "done" | "error";

/** A retrieved hit echoed back to the model and shown to the visitor. */
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

export function Byok() {
  const keyInputId = useId();
  const modelId = useId();
  const questionId = useId();

  const [keyValue, setKeyValue] = useState("");
  const [model, setModelState] = useState<string>(DEFAULT_MODEL);
  const [question, setQuestion] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [answer, setAnswer] = useState("");
  const [passages, setPassages] = useState<Hit[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  // Hydrate from the store after mount (SSR-safe: getKey/getModel are inert on
  // the server, so we read them only client-side).
  useEffect(() => {
    setKeyValue(getKey());
    setModelState(getModel());
  }, []);

  const busy = phase === "thinking" || phase === "retrieving";
  const canAsk = keyValue.trim().length > 0 && question.trim().length > 0 && !busy;

  const onKeyChange = (v: string) => {
    setKeyValue(v);
    setKey(v);
  };

  const onModelChange = (v: string) => {
    setModelState(v);
    setModel(v);
  };

  const forgetKey = () => {
    clearKey();
    setKeyValue("");
  };

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const ask = useCallback(async () => {
    const q = question.trim();
    const apiKey = getKey();
    if (q.length === 0 || apiKey.length === 0) return;

    // Fresh run state.
    setAnswer("");
    setPassages([]);
    setErrorMsg("");
    setPhase("thinking");

    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: q },
    ];

    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        if (signal.aborted) {
          setPhase("done");
          return;
        }

        // Accumulators for THIS round's assistant turn.
        let assistantText = "";
        const toolCalls: ToolCall[] = [];
        let sawError = false;

        const stream = streamOpenRouter({
          apiKey, // key passed ONLY here.
          model: getModel(),
          messages,
          tools: TOOLS,
          signal,
        });

        setPhase("thinking");

        let streamDone = false;
        for await (const ev of stream) {
          if (ev.type === "text") {
            assistantText += ev.text;
            setAnswer((prev) => prev + ev.text);
          } else if (ev.type === "tool_call") {
            toolCalls.push({
              id: ev.id || `call_${round}_${toolCalls.length}`,
              type: "function",
              function: { name: ev.name, arguments: ev.arguments },
            });
          } else if (ev.type === "error") {
            setErrorMsg(ev.message);
            setPhase("error");
            sawError = true;
            break;
          } else if (ev.type === "done") {
            streamDone = true;
          }
        }

        if (sawError) return; // failure path: end cleanly, never hang.
        void streamDone;

        // Record the assistant turn (with any tool calls it requested).
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: assistantText,
        };
        if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls;
        messages.push(assistantMsg);

        // No tool calls -> the model gave its final answer.
        if (toolCalls.length === 0) {
          setPhase("done");
          return;
        }

        // Run each requested tool and feed the result back.
        setPhase("retrieving");
        for (const call of toolCalls) {
          if (signal.aborted) {
            setPhase("done");
            return;
          }
          if (call.function.name !== "search_corpus") {
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              name: call.function.name,
              content: JSON.stringify({ error: "unknown tool" }),
            });
            continue;
          }

          let toolQuery = "";
          try {
            const parsed = JSON.parse(call.function.arguments || "{}");
            toolQuery =
              typeof parsed?.query === "string" ? parsed.query : "";
          } catch {
            toolQuery = "";
          }

          let hits: Hit[] = [];
          try {
            // KEYLESS request to our own origin: no key, no Authorization.
            const res = await fetch("/api/query", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ query: toolQuery }),
              signal,
            });
            if (!res.ok) {
              setErrorMsg(
                "the librarian could not answer that. try another question.",
              );
              setPhase("error");
              return; // failure path: end cleanly.
            }
            const data = (await res.json()) as { hits?: Hit[] };
            hits = data.hits ?? [];
          } catch (err) {
            if (signal.aborted) {
              setPhase("done");
              return;
            }
            setErrorMsg("the librarian is unreachable. try again.");
            setPhase("error");
            void err;
            return; // failure path: end cleanly.
          }

          setPassages((prev) => mergeHits(prev, hits));
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name: "search_corpus",
            content: JSON.stringify(hits),
          });
        }
        // Loop continues for the model's next turn.
      }

      // Round cap reached without a final answer.
      setPhase("done");
    } catch (err) {
      // Defensive: the generator never throws, but the loop must not hang.
      if (signal.aborted) {
        setPhase("done");
        return;
      }
      setErrorMsg("something went wrong. try again.");
      setPhase("error");
      void err;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [question]);

  return (
    <div className="mt-4 rounded-md border border-line bg-surface/40 p-4 md:p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        reason with your own key
      </p>

      {/* Key + model row */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor={keyInputId}
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            openrouter key
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id={keyInputId}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={keyValue}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder="sk-or-…"
              className="min-w-0 flex-1 rounded-sm border border-line bg-bg px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={forgetKey}
              disabled={keyValue.length === 0}
              className="whitespace-nowrap rounded-sm border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-accent focus:border-accent focus:text-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              forget key
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 sm:w-56">
          <label
            htmlFor={modelId}
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            model
          </label>
          <select
            id={modelId}
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="rounded-sm border border-line bg-bg px-3 py-2 font-mono text-sm text-ink focus:border-accent focus:outline-none"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canAsk) ask();
        }}
        className="mt-3 flex flex-col gap-1"
      >
        <label
          htmlFor={questionId}
          className="font-mono text-[10px] uppercase tracking-widest text-muted"
        >
          ask a question
        </label>
        <div className="flex items-stretch gap-2">
          <input
            id={questionId}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="what does this corpus say about liberty?"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-sm border border-line bg-bg px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-sm border border-line px-3 py-2 font-mono text-xs uppercase tracking-widest text-metric transition-colors hover:border-metric focus:border-metric focus:outline-none"
            >
              stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canAsk}
              className="rounded-sm border border-line px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-accent focus:border-accent focus:text-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              ask
            </button>
          )}
        </div>
      </form>

      {/* Output */}
      <div aria-live="polite" className="mt-4 space-y-4">
        {phase === "idle" && (
          <p className="font-mono text-xs text-muted">
            <span className="text-line">// </span>
            the model answers only from retrieved passages, with citations.
          </p>
        )}

        {phase === "thinking" && (
          <p className="font-mono text-xs text-muted">
            <span className="text-accent">// </span>thinking…
          </p>
        )}

        {phase === "retrieving" && (
          <p className="font-mono text-xs text-muted">
            <span className="text-accent">// </span>retrieving…
          </p>
        )}

        {phase === "error" && (
          <p
            role="alert"
            className="font-mono text-xs text-metric"
          >
            <span className="text-line">// </span>
            <SafeText text={errorMsg} />
          </p>
        )}

        {answer.length > 0 && (
          <div className="font-serif text-sm leading-relaxed text-ink">
            <SafeText text={answer} />
          </div>
        )}

        {passages.length > 0 && (
          <div className="space-y-3 border-t border-line pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              retrieved
            </p>
            <ul className="space-y-4">
              {passages.map((hit) => (
                <li key={hit.id}>
                  <p className="font-serif text-sm leading-relaxed text-ink">
                    <SafeText text={hit.text} />
                  </p>
                  <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
                    {hit.author}, {hit.workTitle} · {hit.chapterTitle}{" "}
                    <span className="text-line">[src:{hit.id}]</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** Merge new hits into the running set, de-duplicating by id, preserving order. */
function mergeHits(prev: Hit[], next: Hit[]): Hit[] {
  const seen = new Set(prev.map((h) => h.id));
  const merged = [...prev];
  for (const h of next) {
    if (!seen.has(h.id)) {
      seen.add(h.id);
      merged.push(h);
    }
  }
  return merged;
}
