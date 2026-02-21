import type { LintViolation, RuleSeverity } from '../../../lib/tools/dockerfile-analyzer/types';

interface ViolationListProps {
  violations: LintViolation[];
  onNavigate: (line: number) => void;
}

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };
const SEVERITY_LABELS: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
};
const SEVERITY_COLORS: Record<string, string> = {
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};
const SEVERITY_BORDER_COLORS: Record<string, string> = {
  error: 'border-red-500',
  warning: 'border-amber-500',
  info: 'border-blue-500',
};

function SeverityIcon({ severity }: { severity: RuleSeverity }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: SEVERITY_COLORS[severity] }}
      aria-label={severity}
    />
  );
}

function groupBySeverity(
  violations: LintViolation[],
): [string, LintViolation[]][] {
  const groups = new Map<string, LintViolation[]>();
  for (const v of violations) {
    const group = groups.get(v.severity) ?? [];
    group.push(v);
    groups.set(v.severity, group);
  }
  return [...groups.entries()].sort(
    ([a], [b]) => (SEVERITY_ORDER[a] ?? 3) - (SEVERITY_ORDER[b] ?? 3),
  );
}

function ViolationItem({
  violation,
  onNavigate,
}: {
  violation: LintViolation;
  onNavigate: (line: number) => void;
}) {
  return (
    <details className="group border-b border-white/10 last:border-0">
      <summary className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-white/5 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <span className="transition-transform duration-200 text-[var(--color-text-secondary)] text-xs group-open:rotate-90">
          &#9654;
        </span>
        <SeverityIcon severity={violation.severity} />
        <a
          href={`/tools/dockerfile-analyzer/rules/${violation.ruleId.toLowerCase()}/`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-[var(--color-accent)] hover:underline"
        >
          {violation.ruleId}
        </a>
        <span className="flex-1 text-sm truncate">{violation.message}</span>
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
      </summary>
      <div className="px-3 pb-3 text-sm text-[var(--color-text-secondary)]">
        <p className="mb-2">{violation.explanation}</p>
        {violation.fix.beforeCode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-red-400 text-xs">Before:</span>
              <pre className="bg-black/30 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                {violation.fix.beforeCode}
              </pre>
            </div>
            <div>
              <span className="text-green-400 text-xs">After:</span>
              <pre className="bg-black/30 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                {violation.fix.afterCode}
              </pre>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

export function ViolationList({ violations, onNavigate }: ViolationListProps) {
  const groups = groupBySeverity(violations);

  return (
    <div className="max-h-[400px] lg:max-h-none overflow-y-auto">
      {groups.map(([severity, items]) => (
        <div key={severity} className="mb-3 last:mb-0">
          <h4
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 border-l-2 ${SEVERITY_BORDER_COLORS[severity] ?? 'border-gray-500'} mb-1`}
            style={{ color: SEVERITY_COLORS[severity] }}
          >
            {SEVERITY_LABELS[severity] ?? severity} ({items.length})
          </h4>
          {items.map((v, i) => (
            <ViolationItem
              key={`${v.ruleId}-${v.line}-${i}`}
              violation={v}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
