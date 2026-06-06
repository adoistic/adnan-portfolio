/**
 * The librarian: keyless TF-IDF search over the bundled Falsafa subset.
 * Returns real cited passages, no LLM, no API key, no hallucination.
 * (An optional "reason over these" layer uses the visitor's own
 * OpenRouter key, mirroring Falsafa's BYOK island. That lives elsewhere.)
 */
import raw from "@/data/falsafa-corpus.json";
import { tokenize, cosine, type DocVector, MIN_COSINE, DEFAULT_TOP_K } from "./tfidf";

export type Passage = {
  id: string;
  work: string;
  workTitle: string;
  author: string;
  chapter: string;
  chapterTitle: string;
  text: string;
};

export type CorpusWork = {
  slug: string;
  title: string;
  author: string;
  language: string;
  era: string;
};

const passages = (raw as { passages: Passage[] }).passages;
export const works = (raw as { works: CorpusWork[] }).works;
export const passageCount = passages.length;

// Build the IDF space once over the corpus, then a sparse vector per passage.
const tokenLists = passages.map((p) => tokenize(p.text));
const N = passages.length;
const df = new Map<string, number>();
for (const toks of tokenLists) {
  const seen = new Set<string>();
  for (const t of toks) {
    if (seen.has(t)) continue;
    seen.add(t);
    df.set(t, (df.get(t) ?? 0) + 1);
  }
}
const idf = new Map<string, number>();
for (const [t, d] of df) {
  const v = Math.log(N / d);
  if (v > 0) idf.set(t, v);
}

function vectorize(tokens: string[]): DocVector {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const vector = new Map<string, number>();
  let sumSq = 0;
  for (const [term, count] of tf) {
    const i = idf.get(term);
    if (!i) continue;
    const w = count * i;
    vector.set(term, w);
    sumSq += w * w;
  }
  return { vector, norm: Math.sqrt(sumSq) };
}

const docVectors = tokenLists.map(vectorize);

export type Hit = { passage: Passage; score: number };

export function search(query: string, k = DEFAULT_TOP_K): Hit[] {
  const q = vectorize(tokenize(query));
  if (q.norm === 0) return [];
  const hits: Hit[] = [];
  for (let i = 0; i < passages.length; i++) {
    const s = cosine(q, docVectors[i]);
    if (s >= MIN_COSINE) hits.push({ passage: passages[i], score: s });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, k);
}
