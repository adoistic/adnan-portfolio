/**
 * Recognition: a mono ledger list of external filters passed. Public-safe
 * facts only. No prose, no adjectives; the entries are the evidence.
 * See DESIGN.md content architecture item 6.
 */

const items = [
  {
    label: "grant",
    what: "Mercatus Emergent Ventures, $20,000",
    year: "2025",
  },
  {
    label: "winner",
    what: "MSME Idea Hackathon 5.0, Rs 12.75 lakh, Ministry of MSME, Government of India",
    year: "2026",
  },
  {
    label: "award",
    what: "Cobden-Bright Award",
    year: "",
  },
  {
    label: "published",
    what: 'Philosophy Now, Issue 173, "The Prayer The Machine Cannot Pray"',
    year: "2026",
  },
];

export function Recognition() {
  return (
    <ul className="space-y-5">
      {items.map((it) => (
        <li
          key={it.what}
          className="grid grid-cols-1 gap-1 sm:grid-cols-[6rem_1fr_auto] sm:items-baseline sm:gap-5"
        >
          <span className="font-mono text-xs uppercase tracking-wider text-accent/80">
            {it.label}
          </span>
          <span className="font-mono text-sm text-ink">{it.what}</span>
          <span className="font-mono text-xs tracking-wider text-metric tnum">
            {it.year}
          </span>
        </li>
      ))}
    </ul>
  );
}
