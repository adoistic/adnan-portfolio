import { search, type Hit } from "@/lib/librarian";

// The corpus is an in-memory JS index built at module load, so this route
// must run on the Node.js runtime (not the Edge runtime).
export const runtime = "nodejs";

// k is fixed server-side. The client cannot raise it.
const TOP_K = 3;
const MAX_QUERY_LEN = 200;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Malformed / non-JSON body -> client error, never a 500.
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawQuery = (body as { query?: unknown } | null)?.query;
  if (typeof rawQuery !== "string") {
    return Response.json({ error: "Missing 'query' string." }, { status: 400 });
  }

  const query = rawQuery.trim();
  if (query.length < 1 || query.length > MAX_QUERY_LEN) {
    return Response.json(
      { error: `'query' must be 1..${MAX_QUERY_LEN} characters after trimming.` },
      { status: 400 },
    );
  }

  const results = search(query, TOP_K);
  const hits = results.map(({ passage, score }: Hit) => ({
    text: passage.text,
    work: passage.work,
    workTitle: passage.workTitle,
    author: passage.author,
    chapter: passage.chapter,
    chapterTitle: passage.chapterTitle,
    id: passage.id,
    score,
  }));

  return Response.json({ hits });
}
