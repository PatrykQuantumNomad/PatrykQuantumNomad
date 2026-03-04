import { useState, useCallback } from 'react';
import type { GhaUnifiedViolation, GhaSeverity } from '../../../lib/tools/gha-validator/types';
import { getGhaRuleById } from '../../../lib/tools/gha-validator/rules/index';

interface GhaViolationListProps {
  violations: GhaUnifiedViolation[];
  onNavigate: (line: number) => void;
  selectedCategory?: string | null;
  searchQuery?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const CATEGORY_ORDER: Record<string, number> = {
  schema: 0,
  security: 1,
  semantic: 2,
  'best-practice': 3,
  style: 4,
  actionlint: 5,
};

const CATEGORY_LABELS: Record<string, string> = {
  schema: 'Schema',
  security: 'Security',
  semantic: 'Semantic',
  'best-practice': 'Best Practice',
  style: 'Style',
  actionlint: 'Actionlint',
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  schema: 'border-indigo-500',
  security: 'border-red-500',
  semantic: 'border-amber-500',
  'best-practice': 'border-emerald-500',
  style: 'border-purple-500',
  actionlint: 'border-gray-500',
};

const CATEGORY_HEADING_COLORS: Record<string, string> = {
  schema: '#6366f1',
  security: '#ef4444',
  semantic: '#f59e0b',
  'best-practice': '#10b981',
  style: '#8b5cf6',
  actionlint: '#94a3b8',
};

function SeverityIcon({ severity }: { severity: GhaSeverity }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: SEVERITY_COLORS[severity] }}
      aria-label={severity}
    />
  );
}

function groupByCategory(
  violations: GhaUnifiedViolation[],
): [string, GhaUnifiedViolation[]][] {
  const groups = new Map<string, GhaUnifiedViolation[]>();
  for (const v of violations) {
    const group = groups.get(v.category) ?? [];
    group.push(v);
    groups.set(v.category, group);
  }
  return [...groups.entries()].sort(
    ([a], [b]) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99),
  );
}

function GhaViolationItem({
  violation,
  onNavigate,
  isOpen,
  onToggle,
}: {
  violation: GhaUnifiedViolation;
  onNavigate: (line: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const rule = isOpen ? getGhaRuleById(violation.ruleId) : undefined;

  return (
    <div className="border-b border-white/10 last:border-0">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-white/5 transition-colors select-none"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span className={`transition-transform duration-200 text-[var(--color-text-secondary)] text-xs ${isOpen ? 'rotate-90' : ''}`}>
          &#9654;
        </span>
        <SeverityIcon severity={violation.severity} />
        <a
          href={`/tools/gha-validator/rules/${violation.ruleId.toLowerCase()}/`}
          className="font-mono text-xs text-[var(--color-accent)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {violation.ruleId}
        </a>
        <span className="flex-1 text-sm truncate">
          {violation.message}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(violation.line);
          }}
          className="text-xs text-[var(--color-accent)] hover:underline flex-shrink-0"
          title={`Go to line ${violation.line}`}
        >
          L{violation.line}
        </button>
      </div>
      {isOpen && (
        <div className="px-3 pb-3 text-sm text-[var(--color-text-secondary)]">
          {rule ? (
            <>
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">{rule.title}</p>
              <p className="mb-2">{rule.explanation}</p>
              {rule.fix.description && (
                <p className="mb-2 text-xs italic">{rule.fix.description}</p>
              )}
              {rule.fix.beforeCode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-red-400 text-xs">Before:</span>
                    <pre className="bg-black/30 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                      <code>{rule.fix.beforeCode}</code>
                    </pre>
                  </div>
                  <div>
                    <span className="text-green-400 text-xs">After:</span>
                    <pre className="bg-black/30 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                      <code>{rule.fix.afterCode}</code>
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>{violation.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function GhaViolationList({
  violations,
  onNavigate,
  selectedCategory,
  searchQuery,
}: GhaViolationListProps) {
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  let filtered = violations;
  if (selectedCategory) {
    filtered = filtered.filter((v) => v.category === selectedCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.ruleId.toLowerCase().includes(q) ||
        v.message.toLowerCase().includes(q),
    );
  }

  const groups = groupByCategory(filtered);
  const totalFiltered = filtered.length;

  const makeKey = (v: GhaUnifiedViolation, i: number) => `${v.ruleId}-${v.line}-${i}`;
  const isItemOpen = (key: string) => allExpanded || expandedSet.has(key);

  const toggleItem = useCallback((key: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setAllExpanded(false);
  }, []);

  const handleExpandAll = () => {
    if (allExpanded) {
      setAllExpanded(false);
      setExpandedSet(new Set());
    } else {
      setAllExpanded(true);
    }
  };

  return (
    <div className="max-h-[400px] lg:max-h-none overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-1.5 mb-1">
        {selectedCategory || searchQuery ? (
          <span className="text-xs text-[var(--color-text-secondary)]">
            Showing {totalFiltered} of {violations.length} issues
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleExpandAll}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
          title={allExpanded ? 'Collapse all' : 'Expand all'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {allExpanded ? (
              <>
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </>
            ) : (
              <>
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </>
            )}
          </svg>
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {totalFiltered === 0 && (selectedCategory || searchQuery) && (
        <p className="text-sm text-[var(--color-text-secondary)] px-3 py-4 text-center">
          No matching issues found.
        </p>
      )}

      {groups.map(([category, items]) => (
        <div key={category} className="mb-3 last:mb-0">
          <h4
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 border-l-2 ${CATEGORY_BORDER_COLORS[category] ?? 'border-gray-500'} mb-1`}
            style={{ color: CATEGORY_HEADING_COLORS[category] }}
          >
            {CATEGORY_LABELS[category] ?? category} ({items.length})
          </h4>
          {items.map((v, i) => {
            const key = makeKey(v, i);
            return (
              <GhaViolationItem
                key={key}
                violation={v}
                onNavigate={onNavigate}
                isOpen={isItemOpen(key)}
                onToggle={() => toggleItem(key)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
