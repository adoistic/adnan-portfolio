import { Section } from "@/components/section";
import { ForceGraph, type GNode, type GLink } from "@/components/force-graph";
import { LiveQuery } from "@/components/live-query";
import { CaseStudies } from "@/components/case-studies";
import { Recognition } from "@/components/recognition";
import { Writing } from "@/components/writing";
import { About } from "@/components/about";
import { Provenance } from "@/components/provenance";

const SRC_SESSION = {
  label: "local session analysis",
  source: "From a local analysis of my own coding sessions.",
};
const SRC_GIT = {
  label: "git history",
  source: "From my git commit history since 2024.",
};

const metrics = [
  { n: "5.8", label: "agents at once", src: SRC_SESSION },
  { n: "38", label: "peak parallel", src: SRC_SESSION },
  { n: "604K", label: "net lines / 2024", src: SRC_GIT },
  { n: "80%", label: "AI-coauthored", src: SRC_GIT },
];

const log = [
  {
    t: "spec-first",
    title: "The spec is the real work.",
    note: "One client build's whole approved contract was a single agents-api.md, accepted with no redlines. When the spec is right the code almost writes itself; when it is vague, more hands just produce more wrong, faster.",
  },
  {
    t: "the swarm",
    title: "A fresh agent per task, two review gates.",
    note: "Spec-compliance first, then code quality. On one pipeline the two gates caught a tautological test, a precision mismatch, a Unicode leak, a missing boot-time secret check, and a number serialized as a string. Different bugs, which is the point.",
  },
  {
    t: "parallelism",
    title: "Concurrency is a resource with hard edges.",
    note: "About 5.8 agents open at once on average, 38 at peak, two or more active 52% of the time. A 25-way fan-out failed on platform limits and got rebatched to 11; one redirect pulled 886 raw records, 833 applied.",
  },
  {
    t: "outside voice",
    title: "Plan, review, ship, with a second model.",
    note: "An adversarial reviewer flagged, before any code, fields the schema lacked, a route collision, a bad auth assumption, and a backfill keyed on the wrong id. When a deploy returned 500s I pasted the real logs and overrode its wrong diagnosis.",
  },
  {
    t: "data ontology",
    title: "The core discipline, not a feature.",
    note: "Messy corpus to typed schemas, entity resolution, and a citation graph. One product runs no model of its own: it exposes search plus an MCP endpoint and the user brings their AI. A standing rule: the model extracts, Python counts and validates.",
  },
  {
    t: "ground truth",
    title: "Distrust the reported state.",
    note: "Of 1,842 classified decisions, 48% were course-corrections and 17% were catching the agent's mistake. I curled the real routes with a fake key injected to confirm it never leaked, rather than accept a passed browser QA.",
  },
  {
    t: "verify",
    title: "Verify by building, then by looking.",
    note: "A live-fire run on 1,340 real feed signals exposed baseline-only output and sparse citations the unit tests passed clean over. I have rejected generated art by eye and regenerated backgrounds at portrait 896x1200.",
  },
  {
    t: "benchmark",
    title: "Prove the method small before scaling.",
    note: "Sample documents, land the schema as a PR, run a five-document bake-off, iterate the prompt, run a nine-document benchmark, then release the larger wave. The bake-off is cheap and the full run is not.",
  },
  {
    t: "reverse",
    title: "Undo your own over-engineering.",
    note: "I adopted a heavy two-phase structured drafter to suppress AI writing tells, watched the prose regress, and dropped the structured mode while keeping the useful prompting. Reverting a thing I just built is part of the method.",
  },
  {
    t: "codify",
    title: "Write down every lesson so it cannot recur.",
    note: "Transient-error handling became a required rule in the project's CLAUDE.md. A one-off stub-file fix became a template default. Verify hard, cut scope cleanly, then institutionalize the lesson.",
  },
  {
    t: "memory",
    title: "The skill library is the reusable unit.",
    note: "Layered memory plus a growing library of specs and skills carries context across sessions. I turned one pipeline into a downloadable authoring skill with a self-contained schema doc and pure-stdlib scripts. The library regenerates products.",
  },
  {
    t: "velocity",
    title: "Speed is a go-to-market weapon.",
    note: "I replaced a clunky file-and-PDF handoff with a live dashboard and seeded demo data, and made reports a non-technical owner can audit by clicking the evidence. For a buyer I get one meeting with, I arrive with a finished working demo.",
  },
  {
    t: "decompose",
    title: "Discipline lives in the spec and the gates.",
    note: "Front-load one prescriptive prompt with the exact files, test shape, verification commands, and a stop condition, then delegate to fresh subagents under review. Commit hygiene is policy: named-file staging, no blanket git add, a leak-guard that once caught internal paths heading into a public dashboard.",
  },
];

// Public-safe ontology for the hero graph (thinkers, concepts, projects).
const graphNodes: GNode[] = [
  { id: "hayek", label: "Hayek" },
  { id: "mises", label: "Mises" },
  { id: "smith", label: "Smith" },
  { id: "ghazali", label: "Al-Ghazali" },
  { id: "malebranche", label: "Malebranche" },
  { id: "order", label: "spontaneous order" },
  { id: "knowledge", label: "dispersed knowledge", kind: "metric" },
  { id: "ontology", label: "ontology", kind: "metric" },
  { id: "provenance", label: "provenance" },
  { id: "mcp", label: "MCP" },
  { id: "spec", label: "spec" },
  { id: "agent", label: "agent" },
  { id: "corpus", label: "corpus" },
  { id: "citation", label: "citation" },
  { id: "falsafa", label: "Falsafa", kind: "accent" },
  { id: "thothica", label: "Thothica", kind: "accent" },
];

const graphLinks: GLink[] = [
  { s: "hayek", t: "order" }, { s: "mises", t: "order" }, { s: "smith", t: "order" },
  { s: "order", t: "knowledge" }, { s: "hayek", t: "knowledge" },
  { s: "knowledge", t: "ontology" }, { s: "ontology", t: "provenance" },
  { s: "ontology", t: "mcp" }, { s: "ontology", t: "corpus" },
  { s: "corpus", t: "citation" }, { s: "provenance", t: "citation" },
  { s: "spec", t: "agent" }, { s: "agent", t: "ontology" }, { s: "spec", t: "ontology" },
  { s: "falsafa", t: "mcp" }, { s: "falsafa", t: "corpus" }, { s: "falsafa", t: "ghazali" },
  { s: "ghazali", t: "malebranche" }, { s: "falsafa", t: "citation" },
  { s: "thothica", t: "ontology" }, { s: "thothica", t: "falsafa" }, { s: "thothica", t: "agent" },
];

// Calm static constellation for the mobile tier (no squished force graph).
function StaticConstellation() {
  const nodes = [
    [60, 40], [140, 28], [220, 70], [300, 40], [360, 110],
    [40, 130], [120, 110], [200, 150], [285, 150], [340, 200],
    [80, 210], [170, 220], [250, 215], [120, 280], [220, 285],
  ];
  const links = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 7],
    [6, 7], [7, 8], [8, 9], [5, 10], [6, 11], [7, 11], [8, 12],
    [10, 13], [11, 13], [12, 14], [13, 14], [4, 9],
  ];
  const accent = new Set([7, 3]);
  const metric = new Set([11, 9]);
  return (
    <svg viewBox="0 0 400 320" className="w-full" role="img" aria-label="ontology graph preview">
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#1d222b" strokeWidth="1" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={accent.has(i) || metric.has(i) ? 4.5 : 3}
          fill={accent.has(i) ? "#7fae93" : metric.has(i) ? "#d8a657" : "#3a4250"} />
      ))}
    </svg>
  );
}

function GraphCard() {
  return (
    <div
      id="graph"
      tabIndex={-1}
      aria-label="knowledge graph"
      className="scroll-mt-20 rounded-md border border-line bg-surface/40 p-4 outline-none focus-visible:ring-1 focus-visible:ring-accent"
    >
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted">
        <span>knowledge graph</span>
        <span className="text-line">[g] to explore</span>
      </div>
      <div className="hidden lg:block">
        <ForceGraph nodes={graphNodes} links={graphLinks} />
      </div>
      <div className="lg:hidden">
        <StaticConstellation />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-dvh overflow-x-clip">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-5 pt-16 pb-12 md:px-8 md:pt-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16">
          <div className="rise">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              adnan abbasi · thothica
            </p>
            <h1 className="hero-line measure mt-5 font-mono text-ink">
              I write specs. The agents do the rest.
            </h1>
            <p className="measure mt-5 font-serif text-lg leading-relaxed text-muted md:text-xl">
              AI-native systems that turn fragmented knowledge into something
              people and machines can both reason over.
            </p>

            <dl className="mt-9 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.label}>
                  <dd className="tnum font-mono text-3xl leading-none text-metric md:text-4xl">
                    {m.n}
                  </dd>
                  <dt className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                    {m.label}
                    <Provenance label={m.src.label} source={m.src.source} />
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="rise">
            <GraphCard />
          </div>
        </div>
      </section>

      {/* How I build: the spine, from content/methodology.md Part 1 */}
      <Section id="how-i-build" label="how i build">
        <ul className="space-y-7">
          {log.map((e) => (
            <li key={e.t} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[8rem_1fr] sm:gap-5">
              <span className="font-mono text-xs uppercase tracking-wider text-accent/80 sm:pt-0.5">
                {e.t}
              </span>
              <div>
                <p className="font-mono text-sm text-ink">{e.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Hinge */}
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
        <p className="font-mono text-sm text-muted">
          <span className="text-accent">// </span>the method is the product.
        </p>
      </div>

      {/* The method, applied: abstracted engagements, public-safe */}
      <Section id="method-applied" label="the method, applied">
        <p className="font-serif text-base leading-relaxed text-muted">
          the same method, across very different problems. client names withheld;
          the work is described by its class and its ontology move.
        </p>
        <div className="mt-7">
          <CaseStudies />
        </div>
      </Section>

      {/* Falsafa: the method demonstrating itself, live */}
      <Section id="falsafa" label="falsafa">
        <p className="font-serif text-base leading-relaxed text-muted">
          a real query against a corpus of world philosophy. the librarian
          retrieves and cites; no model, no key, no hallucination.
        </p>
        <div className="mt-6">
          <LiveQuery />
        </div>
      </Section>

      {/* Recognition: external filters passed, as a mono ledger */}
      <Section id="recognition" label="recognition">
        <Recognition />
      </Section>

      {/* Writing: serif prose, understated */}
      <Section id="writing" label="writing">
        <Writing />
      </Section>

      {/* About: humanities-to-AI path, the Hayek frame */}
      <Section id="about" label="about">
        <About />
      </Section>

      {/* Contact */}
      <Section id="contact" label="contact">
        <ul className="space-y-3 font-mono text-sm">
          <li className="grid grid-cols-1 gap-1 sm:grid-cols-[6rem_1fr] sm:gap-5">
            <span className="text-xs uppercase tracking-wider text-muted">
              email
            </span>
            <a
              href="mailto:adnan@thothica.com"
              className="text-ink underline-offset-4 hover:text-accent hover:underline"
            >
              adnan@thothica.com
            </a>
          </li>
          <li className="grid grid-cols-1 gap-1 sm:grid-cols-[6rem_1fr] sm:gap-5">
            <span className="text-xs uppercase tracking-wider text-muted">
              github
            </span>
            <a
              href="https://github.com/adoistic"
              className="text-ink underline-offset-4 hover:text-accent hover:underline"
            >
              github.com/adoistic
            </a>
          </li>
        </ul>
      </Section>
    </main>
  );
}
