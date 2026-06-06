import { Section } from "@/components/section";
import { ForceGraph, type GNode, type GLink } from "@/components/force-graph";

const metrics = [
  { n: "5.8", label: "agents at once", src: "paxel" },
  { n: "38", label: "peak parallel", src: "paxel" },
  { n: "604K", label: "net lines / 2024", src: "git" },
  { n: "80%", label: "AI-coauthored", src: "git" },
];

const log = [
  {
    t: "spec-first",
    title: "The spec is the real work.",
    note: "A loose idea becomes a dated spec, then a bite-sized plan. When the spec is right the code is boring; when it is vague, more hands just produce more wrong, faster.",
  },
  {
    t: "the swarm",
    title: "A fresh agent per task, two review gates.",
    note: "Spec-compliance first, then code quality. The gates catch different failures, so I run several threads at once, about 5.8 on average.",
  },
  {
    t: "ground truth",
    title: "Distrust the reported state.",
    note: "Of 1,842 classified decisions, 48% were course-corrections and 17% were catching the agent's mistake. I check the system of record, not the claim.",
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
    <div className="rounded-md border border-line bg-surface/40 p-4">
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
    <main className="min-h-dvh">
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
                    <span className="text-line"> [src:{m.src}]</span>
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

      {/* Hinge */}
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
        <p className="font-mono text-sm text-muted">
          <span className="text-accent">// </span>the method is the product.
        </p>
      </div>

      {/* How I build (skeleton — wired to content later) */}
      <Section label="how i build">
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
    </main>
  );
}
