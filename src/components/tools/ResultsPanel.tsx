import { useStore } from '@nanostores/react';
import {
  analysisResult,
  isAnalyzing,
  editorViewRef,
  resultsStale,
} from '../../stores/dockerfileAnalyzerStore';
import { ScoreGauge } from './results/ScoreGauge';
import { CategoryBreakdown } from './results/CategoryBreakdown';
import { ViolationList } from './results/ViolationList';
import { EmptyState } from './results/EmptyState';
import { ShareActions } from './results/ShareActions';
import { highlightAndScroll } from '../../lib/tools/dockerfile-analyzer/highlight-line';

function severitySummary(
  violations: { severity: string }[],
): string {
  const counts: Record<string, number> = {};
  for (const v of violations) {
    counts[v.severity] = (counts[v.severity] ?? 0) + 1;
  }
  const parts: string[] = [];
  if (counts.error) parts.push(`${counts.error} error${counts.error !== 1 ? 's' : ''}`);
  if (counts.warning) parts.push(`${counts.warning} warning${counts.warning !== 1 ? 's' : ''}`);
  if (counts.info) parts.push(`${counts.info} info`);
  return parts.join(', ');
}

export default function ResultsPanel() {
  const result = useStore(analysisResult);
  const analyzing = useStore(isAnalyzing);
  const stale = useStore(resultsStale);

  const handleNavigate = (line: number) => {
    const view = editorViewRef.get();
    if (!view) return;
    highlightAndScroll(view, line);
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-heading font-semibold mb-3">Results</h2>
      <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt,rgba(0,0,0,0.2))] p-4 overflow-y-auto">
        {analyzing ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--color-text-secondary)]">Analyzing...</p>
          </div>
        ) : result === null || result === undefined ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-[var(--color-text-secondary)]">
              Click <strong>Analyze</strong> or press{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-xs font-mono">
                Cmd/Ctrl+Enter
              </kbd>{' '}
              to check your Dockerfile
            </p>
          </div>
        ) : !result.parseSuccess ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500 font-medium">
              Parse error -- check Dockerfile syntax
            </p>
          </div>
        ) : result.violations.length === 0 ? (
          <div className={stale ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {stale && (
              <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-xs mb-3">
                Results may be outdated. Re-analyze to refresh.
              </div>
            )}
            <EmptyState score={result.score.overall} grade={result.score.grade} />
            <ShareActions />
          </div>
        ) : (
          <div className={stale ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {stale && (
              <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-xs mb-3">
                Results may be outdated. Re-analyze to refresh.
              </div>
            )}

            {/* Score + Category breakdown */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
              <ScoreGauge score={result.score.overall} grade={result.score.grade} size={100} />
              <div className="flex-1 w-full">
                <CategoryBreakdown categories={result.score.categories} />
              </div>
            </div>

            {/* Violation count summary */}
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {result.violations.length} issue{result.violations.length !== 1 ? 's' : ''} found
              <span className="ml-1 text-xs">
                ({severitySummary(result.violations)})
              </span>
            </p>

            {/* Violation list */}
            <ViolationList violations={result.violations} onNavigate={handleNavigate} />
            <ShareActions />
          </div>
        )}
      </div>
    </div>
  );
}
