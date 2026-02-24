import type { CategoryScore } from '../../../lib/tools/dockerfile-analyzer/types';

interface CategoryBreakdownProps {
  categories: CategoryScore[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  violationCounts?: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  efficiency: 'Efficiency',
  maintainability: 'Maintainability',
  reliability: 'Reliability',
  'best-practice': 'Best Practice',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',
  efficiency: '#3b82f6',
  maintainability: '#8b5cf6',
  reliability: '#f59e0b',
  'best-practice': '#06b6d4',
};

function CategoryBar({
  cat,
  isSelected,
  isClickable,
  onClick,
  count,
}: {
  cat: CategoryScore;
  isSelected: boolean;
  isClickable: boolean;
  onClick?: () => void;
  count?: number;
}) {
  return (
    <div
      className={`flex items-center gap-3 text-sm rounded px-1 -mx-1 transition-all ${
        isClickable ? 'cursor-pointer hover:bg-white/5' : ''
      } ${isSelected ? 'ring-1 ring-[var(--color-accent)] bg-white/5' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
    >
      <span className="w-24 text-right text-[var(--color-text-secondary)] truncate text-xs">
        {CATEGORY_LABELS[cat.category] ?? cat.category}
      </span>
      {count !== undefined && count > 0 && (
        <span
          className="text-[10px] font-mono font-semibold min-w-[18px] text-center rounded-full px-1 py-0.5 leading-none"
          style={{ backgroundColor: `${CATEGORY_COLORS[cat.category] ?? '#94a3b8'}30`, color: CATEGORY_COLORS[cat.category] ?? '#94a3b8' }}
        >
          {count}
        </span>
      )}
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
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

export function CategoryBreakdown({
  categories,
  selectedCategory,
  onSelectCategory,
  violationCounts,
}: CategoryBreakdownProps) {
  if (categories.length === 0) return null;

  const isClickable = !!onSelectCategory;

  return (
    <div className="flex flex-col gap-1.5">
      {categories.map((cat) => (
        <CategoryBar
          key={cat.category}
          cat={cat}
          isSelected={selectedCategory === cat.category}
          isClickable={isClickable}
          onClick={isClickable ? () => {
            onSelectCategory!(selectedCategory === cat.category ? null : cat.category);
          } : undefined}
          count={violationCounts?.[cat.category]}
        />
      ))}
    </div>
  );
}
