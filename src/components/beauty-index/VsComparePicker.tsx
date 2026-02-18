import { useState } from 'react';

interface LanguageOption {
  id: string;
  name: string;
}

interface VsComparePickerProps {
  readonly languages: readonly LanguageOption[];
}

export default function VsComparePicker({ languages }: VsComparePickerProps) {
  const [langA, setLangA] = useState('');
  const [langB, setLangB] = useState('');
  const sortedLanguages = [...languages].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  const canCompare = langA && langB && langA !== langB;

  function handleCompare() {
    if (canCompare) {
      window.location.href = `/beauty-index/vs/${langA}-vs-${langB}/`;
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 justify-center">
      <div className="flex flex-col gap-1">
        <label htmlFor="vs-lang-a" className="text-xs text-[var(--color-text-secondary)]">
          Language A
        </label>
        <select
          id="vs-lang-a"
          value={langA}
          onChange={(e) => setLangA(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none transition-colors"
        >
          <option value="">Select...</option>
          {sortedLanguages.map((l) => (
            <option key={l.id} value={l.id} disabled={l.id === langB}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <span className="text-[var(--color-text-secondary)] font-medium pb-2">vs</span>

      <div className="flex flex-col gap-1">
        <label htmlFor="vs-lang-b" className="text-xs text-[var(--color-text-secondary)]">
          Language B
        </label>
        <select
          id="vs-lang-b"
          value={langB}
          onChange={(e) => setLangB(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none transition-colors"
        >
          <option value="">Select...</option>
          {sortedLanguages.map((l) => (
            <option key={l.id} value={l.id} disabled={l.id === langA}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCompare}
        disabled={!canCompare}
        className="rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-default"
        style={{
          backgroundColor: canCompare ? 'var(--color-accent)' : undefined,
          color: canCompare ? '#fff' : undefined,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: canCompare ? 'var(--color-accent)' : 'var(--color-border)',
        }}
      >
        Compare
      </button>
    </div>
  );
}
