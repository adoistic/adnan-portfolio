/**
 * Tests for the dependency-free OpenRouter streaming client.
 *
 * Runs under Node 24's built-in test runner with TS type-stripping:
 *   node --test src/lib/openrouter.test.ts
 *
 * No transpiler, no new deps. Erasable-only TS (no enums, no parameter
 * properties) so Node's type-stripping can run it directly.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { streamOpenRouter } from "./openrouter.ts";
import type { StreamEvent } from "./openrouter.ts";

/**
 * Build a fetch impl that returns a streaming Response whose body replays the
 * given SSE lines (each is sent verbatim, newline-terminated).
 */
function fakeFetch(sseLines: string[]): typeof fetch {
  const fn = async (): Promise<Response> => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        for (const line of sseLines) {
          controller.enqueue(enc.encode(line + "\n"));
        }
        controller.close();
      },
    });
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };
  return fn as unknown as typeof fetch;
}

async function collect(
  gen: AsyncGenerator<StreamEvent, void, void>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const ev of gen) events.push(ev);
  return events;
}

test("text deltas concatenate and a done event fires; [DONE] never throws", async () => {
  const sse = [
    `data: ${JSON.stringify({ choices: [{ delta: { content: "Hello, " } }] })}`,
    `data: ${JSON.stringify({ choices: [{ delta: { content: "world." } }] })}`,
    "data: [DONE]",
  ];

  const events = await collect(
    streamOpenRouter({
      apiKey: "sk-test-key",
      model: "openai/gpt-5-mini",
      messages: [{ role: "user", content: "hi" }],
      fetchImpl: fakeFetch(sse),
    }),
  );

  const text = events
    .filter((e): e is Extract<StreamEvent, { type: "text" }> => e.type === "text")
    .map((e) => e.text)
    .join("");

  assert.equal(text, "Hello, world.");

  const doneCount = events.filter((e) => e.type === "done").length;
  assert.equal(doneCount, 1, "exactly one done event");

  // [DONE] must never be JSON-parsed into an error.
  const errors = events.filter((e) => e.type === "error");
  assert.equal(errors.length, 0, "no error events");
});

test("tool_call delta fragments assemble into one tool_call event", async () => {
  const sse = [
    `data: ${JSON.stringify({
      choices: [
        {
          delta: {
            tool_calls: [
              {
                index: 0,
                id: "call_abc123",
                function: { name: "search_corpus", arguments: '{"que' },
              },
            ],
          },
        },
      ],
    })}`,
    `data: ${JSON.stringify({
      choices: [
        {
          delta: {
            tool_calls: [
              { index: 0, function: { arguments: 'ry":"hayek"}' } },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
    })}`,
    "data: [DONE]",
  ];

  const events = await collect(
    streamOpenRouter({
      apiKey: "sk-test-key",
      model: "openai/gpt-5-mini",
      messages: [{ role: "user", content: "search" }],
      tools: [
        {
          type: "function",
          function: { name: "search_corpus", description: "search" },
        },
      ],
      fetchImpl: fakeFetch(sse),
    }),
  );

  const toolCalls = events.filter(
    (e): e is Extract<StreamEvent, { type: "tool_call" }> =>
      e.type === "tool_call",
  );

  assert.equal(toolCalls.length, 1, "exactly one tool_call event");
  assert.equal(toolCalls[0].id, "call_abc123");
  assert.equal(toolCalls[0].name, "search_corpus");
  assert.equal(toolCalls[0].arguments, '{"query":"hayek"}');

  assert.equal(events.filter((e) => e.type === "done").length, 1);
  assert.equal(events.filter((e) => e.type === "error").length, 0);
});
