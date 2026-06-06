/**
 * CaseStudies: three abstracted engagements, shown as proof the method holds
 * across domains. Public-safe by construction. No client names, and no
 * sector + geography + corpus-size fingerprint that could re-identify a client.
 * See DESIGN.md "Confidentiality" and content/methodology.md Part 2.
 */

const cases = [
  {
    t: "an agent-callable archive",
    what: "A large, slow legacy archive of primary sources, rebuilt as a fast static library with an AI-extracted metadata layer and an interface an agent can call directly.",
    ontology:
      "structure: typed schemas and authority files over thousands of documents. connect: a thinker-to-work citation graph with verbatim evidence. operationalize: per-document machine-readable siblings and a deferred-tool MCP endpoint.",
    status: "staging live; extraction baking in waves.",
  },
  {
    t: "a source-cited content pipeline",
    what: "A body of source material turned into validated, finished long-form outputs, where every fact carries an inline provenance tag and a verify gate refuses unsourced claims.",
    ontology:
      "structure: a typed content grammar with front-matter and locked entity specs. connect: a per-fact provenance chain binding each claim to a source line. operationalize: deterministic export to multiple finished formats from one validated tree.",
    status: "active; drafts gated, none shipped unverified.",
  },
  {
    t: "a regulatory-intelligence product",
    what: "A stream of official documents watched and read into short, decision-ready briefs, with diffs flagged as the underlying records change.",
    ontology:
      "structure: a domain taxonomy for classifying each document. connect: deadline and obligation extraction tied back to char-level offsets. operationalize: human-and-AI review gates before anything reaches a reader.",
    status: "pre-launch; review gates cleared.",
  },
];

export function CaseStudies() {
  return (
    <ul className="space-y-9">
      {cases.map((c) => (
        <li
          key={c.t}
          className="border-t border-line pt-5 first:border-t-0 first:pt-0"
        >
          <p className="font-mono text-sm uppercase tracking-wider text-ink">
            {c.t}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{c.what}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <span className="font-mono text-xs uppercase tracking-wider text-accent/80">
              ontology core{" "}
            </span>
            {c.ontology}
          </p>
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted">
            {c.status}
          </p>
        </li>
      ))}
    </ul>
  );
}
