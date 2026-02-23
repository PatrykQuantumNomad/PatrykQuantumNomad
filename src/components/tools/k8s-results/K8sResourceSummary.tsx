interface K8sResourceSummaryProps {
  resourceSummary: Map<string, number>;
}

export function K8sResourceSummary({ resourceSummary }: K8sResourceSummaryProps) {
  const entries = Array.from(resourceSummary.entries()).sort(
    ([, a], [, b]) => b - a,
  );

  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
        Resources ({total})
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([kind, count]) => (
          <span
            key={kind}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          >
            {kind}
            <span className="font-mono font-semibold">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
