/**
 * Section: the ledger-margin layout primitive.
 * - md+ : a left rail holds the mono label; content sits in a capped measure column.
 * - mobile: the label collapses inline above the content (no side rail eating width).
 * See DESIGN.md "Layout" and "Responsive".
 */
export function Section({
  label,
  id,
  children,
}: {
  label: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="grid grid-cols-1 gap-y-3 py-12 md:grid-cols-[8rem_1fr] md:gap-x-10 md:py-20">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            {label}
          </div>
          <div className="measure">{children}</div>
        </div>
      </div>
    </section>
  );
}
