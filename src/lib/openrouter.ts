/**
 * Dependency-free OpenRouter streaming client (browser-side, BYOK).
 *
 * Modeled on Falsafa's BYOK island posture (request shape, HTTP-Referer +
 * X-Title headers, streaming, tool-calls) but hand-rolled with zero
 * dependencies: only platform `fetch`, `ReadableStream`, and `TextDecoder`.
 *
 * Security contract (from the portfolio design spec, "Security"):
 *   - The visitor's OpenRouter key rides ONLY on the browser-originated
 *     request to https://openrouter.ai/api/v1. It never touches this site's
 *     own origin.
 *   - The key, the Authorization header, and the request config are NEVER
 *     logged (no console.*), never sent to analytics, never surfaced in any
 *     error. Only the provider's own error text is surfaced.
 *   - The key is used in exactly one place: the Authorization header of the
 *     fetch below. Nowhere else in this module.
 *
 * Streaming only. The caller owns the agentic loop: it runs the tools the
 * model requests and feeds results back as new `tool`-role messages, then
 * calls `streamOpenRouter` again. The caller should cap that loop at roughly
 * 10 rounds so a misbehaving model can't spin forever; this module emits one
 * stream per call and has no loop of its own.
 *
 * This generator NEVER throws. Every failure path (non-ok HTTP, fetch
 * rejection, abort) is yielded as a `{ type: "error" }` event followed by a
 * clean return.
 */

// Placeholder identity headers. OpenRouter best practice: identify the
// calling app so requests aren't deprioritized. No PII, just the brand.
const HTTP_REFERER = "https://adnanabbasi.com";
const X_TITLE = "Adnan Abbasi";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * An assistant tool-call entry, as it must be echoed back to OpenRouter in the
 * assistant message that requested the tool. The follow-up `tool`-role message
 * references this by `tool_call_id`.
 */
export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/** OpenAI-compatible chat message. */
export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  /**
   * Present only on an assistant message that requested tool calls. Carried
   * back verbatim in the next request so the model sees its own tool turn.
   * Erasable optional field; does not change streaming behavior.
   */
  tool_calls?: ToolCall[];
};

/** OpenAI function-tool definition (the shape OpenRouter accepts in `tools`). */
export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

/** Events yielded by the stream. The caller switches on `type`. */
export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; id: string; name: string; arguments: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type StreamArgs = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

// Internal accumulator for a single streamed tool call. OpenRouter sends the
// id and name early, then streams the JSON `arguments` string in fragments
// keyed by `index`.
type ToolCallAccumulator = {
  id: string;
  name: string;
  arguments: string;
};

/**
 * Stream a single OpenRouter chat completion.
 *
 * Yields text deltas, completed tool calls, a terminal `done`, or an `error`.
 * Always returns cleanly; never throws.
 */
export async function* streamOpenRouter(
  args: StreamArgs,
): AsyncGenerator<StreamEvent, void, void> {
  const doFetch = args.fetchImpl ?? fetch;

  let res: Response;
  try {
    res = await doFetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        // The key lives here and ONLY here.
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": HTTP_REFERER,
        "X-Title": X_TITLE,
      },
      body: JSON.stringify({
        model: args.model,
        messages: args.messages,
        ...(args.tools && args.tools.length > 0 ? { tools: args.tools } : {}),
        stream: true,
      }),
      signal: args.signal,
    });
  } catch (err) {
    // Network failure or abort. Surface a safe message only — never the
    // request config (which carries the Authorization header).
    yield { type: "error", message: errorMessage(err) };
    return;
  }

  if (!res.ok) {
    // Surface the provider's own error body, not our headers/key.
    let body = "";
    try {
      body = await res.text();
    } catch {
      /* body unreadable; fall through to status-only message */
    }
    const message = body.trim().length > 0
      ? body.trim()
      : `OpenRouter returned HTTP ${res.status}`;
    yield { type: "error", message };
    return;
  }

  if (!res.body) {
    yield { type: "error", message: "OpenRouter returned no response body" };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // tool_calls accumulate by index across many deltas.
  const toolCalls = new Map<number, ToolCallAccumulator>();
  const emittedToolIndices = new Set<number>();

  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err) {
        // Mid-stream read failure or abort.
        yield { type: "error", message: errorMessage(err) };
        return;
      }

      if (chunk.done) break;

      buffer += decoder.decode(chunk.value, { stream: true });

      // Process complete lines; keep any trailing partial line in `buffer`.
      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);

        if (line.length === 0) continue; // blank line between SSE events
        if (line.startsWith(":")) continue; // SSE comment / keepalive

        if (!line.startsWith("data:")) continue; // ignore non-data fields

        const data = line.slice("data:".length).trim();
        if (data.length === 0) continue;

        // Terminal sentinel. NEVER JSON.parse this.
        if (data === "[DONE]") {
          yield* flushToolCalls(toolCalls, emittedToolIndices);
          yield { type: "done" };
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          // A malformed chunk should not kill the stream; skip it.
          continue;
        }

        yield* handleChunk(parsed, toolCalls, emittedToolIndices);
      }
    }

    // Stream ended without an explicit [DONE]. Flush anything pending and
    // close out cleanly.
    yield* flushToolCalls(toolCalls, emittedToolIndices);
    yield { type: "done" };
  } catch (err) {
    // Defensive catch-all: nothing above is expected to throw, but the
    // generator must never throw out. Yield and return.
    yield { type: "error", message: errorMessage(err) };
  }
}

/**
 * Process one parsed SSE JSON chunk, yielding text and (when a tool call
 * completes) tool_call events.
 */
function* handleChunk(
  parsed: unknown,
  toolCalls: Map<number, ToolCallAccumulator>,
  emitted: Set<number>,
): Generator<StreamEvent, void, void> {
  const choice = firstChoice(parsed);
  if (!choice) return;

  const delta = isRecord(choice.delta) ? choice.delta : undefined;
  if (!delta) {
    // Could still carry a finish_reason with tool-call completion implied;
    // any pending tool calls flush on finish_reason below.
  }

  // Text delta.
  if (delta && typeof delta.content === "string" && delta.content.length > 0) {
    yield { type: "text", text: delta.content };
  }

  // Tool-call fragments.
  if (delta && Array.isArray(delta.tool_calls)) {
    for (const frag of delta.tool_calls) {
      if (!isRecord(frag)) continue;
      const index = typeof frag.index === "number" ? frag.index : 0;
      const acc =
        toolCalls.get(index) ?? { id: "", name: "", arguments: "" };

      if (typeof frag.id === "string" && frag.id.length > 0) acc.id = frag.id;

      const fn = isRecord(frag.function) ? frag.function : undefined;
      if (fn) {
        if (typeof fn.name === "string" && fn.name.length > 0) {
          acc.name = fn.name;
        }
        if (typeof fn.arguments === "string") {
          acc.arguments += fn.arguments;
        }
      }

      toolCalls.set(index, acc);
    }
  }

  // A finish_reason of "tool_calls" (or "stop") means the assistant turn is
  // done; emit any complete tool calls now.
  const finishReason = typeof choice.finish_reason === "string"
    ? choice.finish_reason
    : undefined;
  if (finishReason) {
    yield* flushToolCalls(toolCalls, emitted);
  }
}

/**
 * Emit every accumulated tool call that has a name, exactly once each.
 */
function* flushToolCalls(
  toolCalls: Map<number, ToolCallAccumulator>,
  emitted: Set<number>,
): Generator<StreamEvent, void, void> {
  for (const [index, acc] of toolCalls) {
    if (emitted.has(index)) continue;
    if (acc.name.length === 0) continue; // incomplete; nothing to run
    emitted.add(index);
    yield {
      type: "tool_call",
      id: acc.id,
      name: acc.name,
      arguments: acc.arguments,
    };
  }
}

type Choice = {
  delta?: unknown;
  finish_reason?: unknown;
};

function firstChoice(parsed: unknown): Choice | undefined {
  if (!isRecord(parsed)) return undefined;
  const choices = parsed.choices;
  if (!Array.isArray(choices) || choices.length === 0) return undefined;
  const first = choices[0];
  return isRecord(first) ? (first as Choice) : undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Produce a safe, human-readable message from an unknown thrown value.
 * Deliberately narrow: returns only the error's own message/string, never
 * the request config or anything that could carry the key.
 */
function errorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Request aborted";
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown streaming error";
}
