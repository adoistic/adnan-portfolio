/**
 * One-time prep: extract a curated, diverse subset of the Falsafa corpus
 * (MIT, github.com/adoistic/falsafa) into a single bundled JSON the
 * portfolio ships. The live query searches this with a ported TF-IDF
 * librarian, keyless. Re-run only when refreshing the subset.
 *
 *   node scripts/prepare-falsafa-corpus.mjs [path-to-falsafa-repo]
 *
 * Output: src/data/falsafa-corpus.json
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FALSAFA = process.argv[2] || "/Users/siraj/falsafa";
const CORPUS = join(FALSAFA, "corpus");
const OUT = join(__dirname, "..", "src", "data", "falsafa-corpus.json");

const PER_WORK = 90;       // cap paragraphs per work to keep the bundle lean
const MIN_LEN = 40;        // skip trivially short fragments

// Curated descriptive slug prefixes (hash suffix resolved from the manifest).
const PICKS = [
  "charles-comte-traite-de-legislation-vol-i",
  "charles-dunoyer-nouveau-traite-deconomie-vol-i",
  "johann-gottlieb-fichte-zuruckforderung-der-denkfreiheit",
  "unknown-manusmrti",
  "unknown-naradasmrti",
  "allama-iqbal-bang-e-dara-part-1",
  "cynewulf-elene",
  "cynewulf-juliana",
  "unknown-san-hyan-kamahayanikan",
  "unknown-old-english-elegies",
];

const manifest = JSON.parse(readFileSync(join(CORPUS, "manifest.json"), "utf8"));
const bySlug = new Map(manifest.works.map((w) => [w.slug, w]));

function resolveSlug(prefix) {
  for (const w of manifest.works) {
    if (w.slug === prefix || w.slug.startsWith(prefix + "-")) return w.slug;
  }
  return null;
}

const works = [];
const passages = [];

for (const prefix of PICKS) {
  const slug = resolveSlug(prefix);
  if (!slug) { console.warn("no match:", prefix); continue; }
  const w = bySlug.get(slug);
  const chaptersDir = join(CORPUS, "works", slug, "chapters");
  if (!existsSync(chaptersDir)) { console.warn("no chapters:", slug); continue; }
  works.push({ slug, title: w.title, author: w.author, language: w.language, era: w.era });

  let count = 0;
  const chapters = readdirSync(chaptersDir).sort();
  for (const ch of chapters) {
    if (count >= PER_WORK) break;
    const chDir = join(chaptersDir, ch);
    const metaPath = join(chDir, "meta.json");
    const parPath = join(chDir, "translation.paragraphs.json");
    if (!existsSync(metaPath) || !existsSync(parPath)) continue;
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    const pars = JSON.parse(readFileSync(parPath, "utf8"));
    for (const p of pars) {
      if (count >= PER_WORK) break;
      const text = (p.text || "").replace(/\s+/g, " ").trim();
      if (text.length < MIN_LEN) continue;
      passages.push({
        id: `${slug}/${meta.chapter_slug}/${p.id}`,
        work: slug,
        workTitle: w.title,
        author: w.author,
        chapter: meta.chapter_slug,
        chapterTitle: meta.chapter_title,
        text,
      });
      count++;
    }
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    { source: "Falsafa corpus (MIT) — curated subset", generated: "static", works, passages },
    null,
    0,
  ),
);
const bytes = readFileSync(OUT).length;
console.log(`wrote ${OUT}`);
console.log(`works: ${works.length}  passages: ${passages.length}  size: ${(bytes / 1024).toFixed(0)} KB`);
