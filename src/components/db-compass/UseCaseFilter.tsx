import { useState, useEffect } from 'react';
import {
  activeCategories,
  initCategories,
  toggleCategory,
  selectAllCategories,
  selectNoCategories,
} from '../../stores/compassFilterStore';
import {
  USE_CASE_CATEGORIES,
  modelCategories,
} from '../../lib/db-compass/use-case-categories';

interface UseCaseFilterProps {
  models: { id: string; name: string; useCases: string[] }[];
}

export default function UseCaseFilter({ models }: UseCaseFilterProps) {
  const allCategoryIds = USE_CASE_CATEGORIES.map((c) => c.id);

  // Start with empty set to match server-rendered HTML, then sync from store after hydration
  const [active, setActive] = useState(() => new Set<string>());

  useEffect(() => {
    initCategories(allCategoryIds);
    const unsub = activeCategories.subscribe((val) => setActive(val));
    return unsub;
  }, []);

  // Sync DOM visibility when active categories change
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-model-id]');
    const allActive = active.size === allCategoryIds.length;

    cards.forEach((card) => {
      if (allActive) {
        card.style.display = '';
        return;
      }
      const useCasesAttr = card.getAttribute('data-use-cases') || '';
      const cardUseCases = useCasesAttr.split(',');
      const cardCategories = modelCategories(cardUseCases);
      const isVisible = cardCategories.some((catId) => active.has(catId));
      card.style.display = isVisible ? '' : 'none';
    });
  }, [active]);

  const allSelected = active.size === allCategoryIds.length;
  const noneSelected = active.size === 0;

  // Count visible models for display
  const visibleCount = models.filter((m) => {
    if (allSelected) return true;
    const cats = modelCategories(m.useCases);
    return cats.some((catId) => active.has(catId));
  }).length;

  return (
    <div className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Filter by use case ({visibleCount}/{models.length})
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => selectAllCategories(allCategoryIds)}
            disabled={allSelected}
            className="text-xs px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-40 disabled:cursor-default transition-colors cursor-pointer"
          >
            All
          </button>
          <button
            onClick={() => selectNoCategories()}
            disabled={noneSelected}
            className="text-xs px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-40 disabled:cursor-default transition-colors cursor-pointer"
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {USE_CASE_CATEGORIES.map((cat) => {
          const isActive = active.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
              }`}
              aria-pressed={isActive}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
