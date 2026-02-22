import type { ComposeCategoryScore } from '../../../lib/tools/compose-validator/types';

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  semantic: 'Semantic',
  'best-practice': 'Best Practice',
  schema: 'Schema',
  style: 'Style',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',
  semantic: '#8b5cf6',
  'best-practice': '#06b6d4',
  schema: '#f59e0b',
  style: '#84cc16',
};

function ComposeCategoryBar({ cat }: { cat: ComposeCategoryScore }) {
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

export function ComposeCategoryBreakdown({
  categories,
}: {
  categories: ComposeCategoryScore[];
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {categories.map((cat) => (
        <ComposeCategoryBar key={cat.category} cat={cat} />
      ))}
    </div>
  );
}
