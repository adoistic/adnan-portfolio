/**
 * TF-IDF primitives, ported verbatim from Falsafa (MIT,
 * github.com/adoistic/falsafa, apps/mcp/lib/tfidf.ts). Pure, no I/O.
 *
 *   tf = raw count · idf = log(N/df) · weight = tf·idf · cosine over sparse maps
 *
 * Tokenization: lowercase, split on [^a-z'], drop <3 chars + stopwords.
 */

export const MIN_COSINE = 0.05;
export const DEFAULT_TOP_K = 3;

const STOPWORDS = new Set([
  "the", "and", "of", "to", "in", "that", "is", "was", "for",
  "it", "with", "as", "his", "be", "by", "on", "not", "this", "but",
  "are", "from", "or", "have", "an", "they", "which", "one", "you",
  "were", "her", "all", "she", "there", "would", "their", "we", "him",
  "been", "has", "when", "who", "will", "more", "no", "if", "out",
  "do", "what", "so", "up", "into", "your", "about", "just",
  "should", "could", "may", "might", "shall", "must",
  "had", "its", "our", "them", "than", "then", "where", "these", "those",
  "some", "any", "such", "only", "also", "now", "over", "very",
]);

export function tokenize(body: string): string[] {
  const raw = body.toLowerCase().split(/[^a-z']+/);
  const out: string[] = [];
  for (const t of raw) {
    if (t.length < 3) continue;
    if (STOPWORDS.has(t)) continue;
    out.push(t);
  }
  return out;
}

export interface DocVector {
  vector: Map<string, number>;
  norm: number;
}

/** Cosine similarity over sparse maps. Iterates the smaller vector. */
export function cosine(a: DocVector, b: DocVector): number {
  if (a.norm === 0 || b.norm === 0) return 0;
  const [small, large] =
    a.vector.size <= b.vector.size ? [a.vector, b.vector] : [b.vector, a.vector];
  let dot = 0;
  for (const [term, w] of small) {
    const other = large.get(term);
    if (other !== undefined) dot += w * other;
  }
  return dot / (a.norm * b.norm);
}
