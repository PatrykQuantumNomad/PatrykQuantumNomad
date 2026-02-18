import { useState, useEffect } from 'react';
import {
  visibleLanguages,
  initLanguages,
  toggleLanguage,
  selectAll,
  selectNone,
} from '../../stores/languageFilterStore';

interface LanguageInfo {
  id: string;
  name: string;
  tier: string;
}

interface TierMeta {
  label: string;
  color: string;
}

const TIER_ORDER: Record<string, TierMeta> = {
  beautiful: { label: 'Beautiful', color: '#B84A1C' },
  handsome: { label: 'Handsome', color: '#C47F17' },
  practical: { label: 'Practical', color: '#5B8A72' },
  workhorses: { label: 'Workhorses', color: '#8B8FA3' },
};

interface LanguageFilterProps {
  languages: LanguageInfo[];
}

export default function LanguageFilter({ languages }: LanguageFilterProps) {
  // Start with empty set to match server-rendered HTML, then sync from store after hydration
  const [visible, setVisible] = useState(() => new Set<string>());

  useEffect(() => {
    initLanguages(languages.map((l) => l.id));
    const unsub = visibleLanguages.subscribe((val) => setVisible(val));
    return unsub;
  }, [languages]);

  // Sync DOM visibility when selection changes
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-language-id]');
    cards.forEach((card) => {
      const id = card.dataset.languageId!;
      card.style.display = visible.has(id) ? '' : 'none';
    });
  }, [visible]);

  const allIds = languages.map((l) => l.id);
  const allSelected = visible.size === languages.length;
  const noneSelected = visible.size === 0;

  // Group languages by tier
  const grouped = Object.keys(TIER_ORDER).map((tier) => ({
    tier,
    ...TIER_ORDER[tier],
    langs: languages.filter((l) => l.tier === tier),
  }));

  return (
    <div className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Filter languages ({visible.size}/{languages.length})
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => selectAll(allIds)}
            disabled={allSelected}
            className="text-xs px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            All
          </button>
          <button
            onClick={() => selectNone()}
            disabled={noneSelected}
            className="text-xs px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.tier} className="mb-2 last:mb-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider mr-1 shrink-0 w-20"
              style={{ color: group.color }}
            >
              {group.label}
            </span>
            {group.langs.map((lang) => {
              const isActive = visible.has(lang.id);
              return (
                <button
                  key={lang.id}
                  onClick={() => toggleLanguage(lang.id)}
                  className={`
                    text-xs px-2 py-0.5 rounded-full border transition-all
                    ${
                      isActive
                        ? 'border-current font-medium'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-50'
                    }
                  `}
                  style={isActive ? { color: group.color, borderColor: group.color } : undefined}
                  aria-pressed={isActive}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
