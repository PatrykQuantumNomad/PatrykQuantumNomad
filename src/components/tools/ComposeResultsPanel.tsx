import { useStore } from '@nanostores/react';
import {
  composeResult,
  composeAnalyzing,
  composeResultsStale,
} from '../../stores/composeValidatorStore';

/**
 * Stub results panel for the Docker Compose Validator.
 * Reads analysis state from nanostores and renders a summary.
 *
 * Phase 36 will add the full ScoreGauge, CategoryBreakdown,
 * ViolationList, and dependency graph tabs.
 */
export default function ComposeResultsPanel() {
  const result = useStore(composeResult);
  const analyzing = useStore(composeAnalyzing);
  const stale = useStore(composeResultsStale);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-3 min-h-[40px]">
        <h2 className="text-lg font-heading font-semibold">Results</h2>
      </div>
      <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt,rgba(0,0,0,0.2))] p-4 overflow-y-auto">
        {analyzing ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--color-text-secondary)] animate-pulse">
              Analyzing...
            </p>
          </div>
        ) : result === null ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--color-text-secondary)]">
              Click <strong>Analyze</strong> to validate your Docker Compose file
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stale && (
              <div className="px-3 py-2 rounded-md bg-yellow-900/30 border border-yellow-700/40 text-yellow-200 text-sm">
                Results may be stale &mdash; click Analyze to refresh
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {result.score.overall}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Score
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--color-accent)]">
                  {result.score.grade}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Grade
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <span>
                {result.violations.length}{' '}
                {result.violations.length === 1 ? 'violation' : 'violations'}
              </span>
              <span>
                {result.parseSuccess ? (
                  <span className="text-green-400">YAML parsed OK</span>
                ) : (
                  <span className="text-red-400">YAML parse errors</span>
                )}
              </span>
            </div>

            {result.score.categories.length > 0 && (
              <div className="space-y-1 text-sm">
                {result.score.categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between text-[var(--color-text-secondary)]"
                  >
                    <span className="capitalize">{cat.category}</span>
                    <span>
                      {cat.score}/100{' '}
                      <span className="text-xs opacity-60">
                        ({cat.weight}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
