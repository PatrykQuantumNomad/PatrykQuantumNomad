import { useState, useEffect } from 'react';
import { activeCategory, setCategory } from '../../stores/categoryFilterStore';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'graphical', label: 'Graphical' },
  { id: 'quantitative', label: 'Quantitative' },
  { id: 'distributions', label: 'Distributions' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'reference', label: 'Reference' },
] as const;

export default function CategoryFilter() {
  const [active, setActive] = useState<string>('all');

  // Subscribe to store
  useEffect(() => {
    const unsub = activeCategory.subscribe((val) => setActive(val));
    return unsub;
  }, []);

  // Toggle DOM visibility when active category changes
  useEffect(() => {
    // Toggle individual cards
    const cards = document.querySelectorAll<HTMLElement>('[data-category]');
    cards.forEach((el) => {
      // Skip section elements (handled separately)
      if (el.tagName === 'SECTION') return;
      const cat = el.dataset.category!;
      el.style.display =
        active === 'all' || cat === active ? '' : 'none';
    });

    // Toggle section-level visibility
    const sections = document.querySelectorAll<HTMLElement>('section[data-category]');
    sections.forEach((section) => {
      const cat = section.dataset.category!;
      section.style.display =
        active === 'all' || cat === active ? '' : 'none';
    });
  }, [active]);

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.id)}
          aria-pressed={active === cat.id}
          className={`px-4 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${
            active === cat.id
              ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-medium'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
