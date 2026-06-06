# How Adnan builds, and what he has built

## What this is

This is the canonical account of how I build software and what I have shipped. It does two jobs. Read top to bottom, it is an operating manual: an AI agent or a new developer can follow it and work the way I work. Read as a record, it is evidence, and every claim about method below is anchored to something that actually happened in the work, not asserted.

The numbers and examples come from a local analysis of my own history: 12,320 coding sessions across 40 projects, 35 multi-session work-streams, and 1,842 classified decisions. Where an example would name a client, it is abstracted here and held at full fidelity in the private section at the end.

The throughline: almost everything I build moves knowledge across a barrier of language, format, or access, and the durable asset is never the single product. It is the method and the spec-and-skill library that regenerates products fast. So the method is the asset, and this is where it is written down.

## Part 1: How I build

### Spec-first, because the spec is the real work

I refuse to start from a vibe. On one client build the entire approved contract was a single `docs/agents-api.md`, accepted with no redlines, and only then the instruction: "write a proper plan and use subagent-driven development with review gates." A dashboard phase opened with a directive that already named the repo paths, the exact test and build commands, the deploy facts, the gating rules, and the reviewer requirements, before a line existed. When a knowledge product needed an access layer, the rule was "documents must become structurally clear before an MCP or self-describing layer." Schema precedes interface. The payoff is blunt: when the spec is right the code almost writes itself and I mostly approve; when it is vague, more hands just produce more wrong, faster.

### A per-task subagent swarm, with two gates that catch different things

Every task in a plan goes to a fresh agent and clears two separate reviews: spec-compliance first (did it build what was asked, nothing more), then code-quality. The two gates are not redundant, they catch different failures. On one content pipeline, run task by task, the reviews caught a tautological loop-budget test, a cost-field precision mismatch, a streaming test that leaked Unicode, a missing boot-time check for a required secret, and a number serialized as a string. None of those is the same kind of bug, which is the point of having both gates.

### Heavy parallelism, treated as a resource with real ceilings

I run many threads at once: about 5.8 agents open on average, 38 at peak, two or more active 52% of the time, some left open for as long as 13 days. When a single extraction runner hit rate limits I redirected the batch to 11 parallel subagents and got 886 raw records, 833 applied. I also know where it breaks: a 25-way fan-out failed on platform limits and got rebatched to 11 or fewer, and when I learned that subagents cannot spawn their own subagents I pivoted the whole job to a background runner. Concurrency is a tunable resource with hard edges, not free scale.

### Plan, review, ship, with a second model as an outside voice

The cadence is plan to review to ship, and I bring in a second model as an adversarial reviewer so the critique is not just my own tooling agreeing with itself. On one build that outside reviewer flagged, before any code, fields the schema did not contain, a route collision between two dynamic paths, an auth role-claim assumption, and a streaming-backfill bug keyed on the wrong id. I treat ship workflows as a gate, not a rubber stamp: when one revealed that only planning artifacts existed, I chose to build rather than ship the plan. And when a deploy returned 500s, I pasted the actual server logs (a module-not-found on an ESM import) and overrode the model's wrong "transport" diagnosis, because the logs are ground truth and its guess was not.

### Data ontology is the core discipline, not a feature

The signature deliverable is a messy corpus turned into a structured, agent-legible system: typed schemas, entity resolution, controlled vocabularies, and a citation graph where every claim binds to a source. Concretely, on one knowledge product I rejected the embeddings-and-vector-store instinct outright and pointed the work at a markdown plus full-text-search approach; the shipped thing runs no model of its own, it exposes a search core, HTTP endpoints, and an MCP endpoint, and the user brings their own AI. A librarian, not a second model guessing. On another, a universal recursive question schema produced a 6,607-node assessment tree. Authority normalization runs before summarization, and I forbade an "unresolved entity" state, which forced 218 canonical stub pages, zero unresolved entries, and 1,347 resolved cross-references. A standing rule sits under all of it: the model recognizes, cleans, and extracts; Python counts, parses dates, sums, validates, and writes the deterministic output. I once had a Python oracle built just to benchmark a spreadsheet whose own formula was wrong.

### Distrust the reported state, go one level deeper to ground truth

This is the most characteristic move I make, and the decision data shows it: of 1,842 classified decisions, 48% are course-corrections and 17% are catching the agent's bug or wrong assumption. In practice it means I do not trust "done." I ask whether the catalog store actually updated, not just the object storage. I check the deployed site, not the data files. To verify an authenticated app I had a session cookie minted and the real routes curled with a fake API key injected, to confirm the key never appeared in a response, rather than accept a "browser QA passed" claim. Provenance gets the same distrust: a culturally offensive fact-inversion that the normal gate had passed was caught only by tracing the fact through the project's own sources first, and fabricated quotes survived precisely because they lacked an inline source tag. The rule that came out of it: fact-check by tracing through our own provenance before searching the open web.

### Verify by building, then verify by looking

Tests are necessary, not sufficient. I demanded a live-fire run on real inputs that inserted 1,340 real feed signals and exposed problems the unit tests passed clean over: baseline-only output, a ghost editorial layer, sparse citations, missing titles. Verification is also visual: I have rejected generated art by eye (one character looked like a cheap stitched toy, backgrounds came out at the wrong aspect ratio and were regenerated at portrait 896x1200), and required every captured frame to be vision-checked against a per-page spec rather than trusting an agent's "looks fine." TDD is the default underneath: write the failing test, confirm it fails, implement, confirm it passes, commit, one call site at a time.

### Benchmark first, then scale

Before committing to a big batch I prove the method on a small one. A typical arc: sample documents, land the schema as a PR, run a five-document bake-off, review with the strongest model, iterate the prompt across a couple of versions, run a nine-document benchmark, then release the larger wave. The small bake-off is cheap and the full run is not, so the order matters.

### Reverse your own over-engineering when quality regresses

I will undo my own cleverness if the output gets worse. I once adopted a heavy two-phase structured drafter to suppress AI writing tells, watched the prose quality regress anyway, and dropped the structured mode while keeping the useful prompting. The willingness to revert a thing I just built is part of the method, not an exception to it.

### Codify every lesson so it cannot recur

Each correction gets written down where the next session will see it. Transient-error handling became a required rule in the project's `CLAUDE.md`. A one-off fix to start projects with stub deliverable files became a template default. Anti-AI-writing rules live in the conventions file. The loop is: verify hard, cut scope cleanly, then institutionalize the lesson.

### Memory and the skill library are the reusable unit

Context survives across sessions on purpose: a layered memory (global identity, project profile, durable auto-memory, per-repo quirk notes) plus a growing library of specs and skills. I turned one pipeline into a downloadable authoring skill with a self-contained schema doc, pure-stdlib scripts, and single-file outputs, built to run under both the CLI and the web app. Because build cost collapsed, the thing worth keeping is no longer any one product, it is this method plus the library that regenerates them.

### Velocity is a go-to-market weapon

When the build is this fast, speed becomes the strategy. I replaced a clunky file-and-PDF client handoff with a live dashboard, prioritized a working demo deployment with seeded demo data over a finished UI, and made reports owner-verifiable (clickable evidence trails a non-technical owner can audit), so the artifact itself does the selling. For a buyer I get one meeting with, the move is to arrive with a finished, working demo rather than run slow discovery.

### How the work actually decomposes

The discipline lives in the spec and the gates, not in line-by-line babysitting. The recurring shape: front-load a single highly prescriptive prompt (root cause, exact files, test shape, verification commands, the commit message, and a stop condition like "if any step fails, STOP and report BLOCKED"), then delegate execution to fresh subagents under review gates. Commit hygiene is policy, not habit: named-file staging, no blanket `git add -A`, no direct commits to main, a fixed co-author trailer, and leak-guard scripts (one caught internal source paths leaking into a public dashboard and sanitized them to a count).
### Falsafa

Open-source project by Thothica. A philosophical-corpus reading site with a stdio MCP server over the corpus. The design choice is a librarian, not a second model, and no vector database: it retrieves and cites real passages rather than generating plausible ones. 38 works, 2,089 variant entries, 836 chapters, with an audited evaluation set. The cleanest public demonstration of the data-ontology approach.

### MinerU True Copy

A Tauri desktop OCR application, AGPL-3.0, public. A maintained fork of an upstream OCR engine with a vision-model OCR sidecar and an Indic translation path. Described honestly as a fork I maintain: a stack component and shipping evidence, not an original commons project.

### Thothica

The company. It builds AI-native systems that help organizations structure, connect, and operationalize fragmented knowledge so people and AI can work over it together. Origin product: Indic and academic translation. Broader practice: data ontology applied across very different client problems. Studio Whence is its sub-brand for finished creative outputs.
### Aggregates and the decision profile

- History analyzed: 12,320 sessions across 40 projects, about 6.9 GB of transcripts; 7,257 with enough signal to summarize, 35 multi-session work-streams, 847 decision exchanges extracted.
- Intensity: 794 session-hours in a recent 30-day window, about 907 hours over the prior year; net gain of roughly 604,000 lines since 2024; 80% of commits AI-coauthored; a 33-day unbroken streak.
- Parallelism: about 5.8 agents open at once on average, 38 at peak, two or more active 52% of the time.
- Decision profile (1,842 classified): 48% course-corrections, 26% product insight, 17% catching the agent's bug or wrong assumption, 9% choosing among presented options. The heaviest subject clusters are data modeling and corpus integrity, pipeline architecture, and scope sequencing.

These figures come from a local analysis of my own coding sessions and git history.
