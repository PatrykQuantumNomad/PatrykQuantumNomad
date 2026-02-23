import type { K8sCategoryScore } from '../../../lib/tools/k8s-analyzer/types';

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  reliability: 'Reliability',
  'best-practice': 'Best Practice',
  schema: 'Schema',
  'cross-resource': 'Cross-Resource',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',
  reliability: '#f59e0b',
  'best-practice': '#06b6d4',
  schema: '#3b82f6',
  'cross-resource': '#8b5cf6',
};

function K8sCategoryBar({ cat }: { cat: K8sCategoryScore }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-right text-[var(--color-text-secondary)] truncate">
        {CATEGORY_LABELS[cat.category] ?? cat.category}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${cat.score}%`,
            backgroundColor: CATEGORY_COLORS[cat.category] ?? '#94a3b8',
          }}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs">
        {Math.round(cat.score)}
      </span>
    </div>
  );
}

export function K8sCategoryBreakdown({
  categories,
}: {
  categories: K8sCategoryScore[];
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {categories.map((cat) => (
        <K8sCategoryBar key={cat.category} cat={cat} />
      ))}
    </div>
  );
}
