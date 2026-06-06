<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# adnan-portfolio

Adnan Abbasi's method-led personal site. Next.js 15 + TypeScript + Tailwind + shadcn/ui.

## Design system

Read `DESIGN.md` before any visual or UI decision. Fonts, color, spacing, layout, motion, the responsive tier ladder, and the signature interactions are defined there. Do not deviate without explicit approval. In any QA pass, flag code that does not match DESIGN.md.

North star: a visitor should leave thinking "this person builds at a level I can't fathom," reached through understatement and shown evidence, never claims.

## Confidentiality (this repo is PUBLIC)

Hard rules, no exceptions:
- Site content comes from `content/methodology.md` (the allowlist-filtered public draft). NEVER import or paste the full-fidelity methodology core, the analysis corpus, or any off-limits identifier list into this repo.
- Client engagements appear only as abstracted case studies. No real client name ships without Adnan's explicit per-client permission.
- Certain confidential and stealth projects are strictly off-limits and never appear here in any form. Adnan maintains the list privately, outside this repo; if unsure whether something is off-limits, ask before writing it.
- Before committing, scan staged content for client names and re-identifying descriptions.

## Responsive

Every viewport is a designed tier, never a shrunk desktop. See the responsive section in DESIGN.md. Ladder: 2560 / 1440 / 1024 / 768 / 480 / 375 / 320.

## Stack notes

- App Router. A server route proxies Falsafa's search for the live cited-query feature; the API key stays server-side and never reaches the client bundle.
- Knowledge-graph hero via a force-directed lib; command palette via cmdk.
