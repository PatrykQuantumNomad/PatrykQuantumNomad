import { useState, lazy, Suspense } from 'react';
import { useStore } from '@nanostores/react';
import {
  composeResult,
  composeAnalyzing,
  composeResultsStale,
  composeEditorViewRef,
} from '../../stores/composeValidatorStore';
import { ScoreGauge } from './results/ScoreGauge';
import { ComposeCategoryBreakdown } from './compose-results/ComposeCategoryBreakdown';
import { ComposeViolationList } from './compose-results/ComposeViolationList';
import { ComposeEmptyState } from './compose-results/ComposeEmptyState';
import { GraphSkeleton } from './compose-results/GraphSkeleton';
import { ComposeShareActions } from './compose-results/ComposeShareActions';
import { highlightAndScroll } from '../../lib/tools/dockerfile-analyzer/highlight-line';

const LazyDependencyGraph = lazy(() => import('./compose-results/DependencyGraph'));

type ResultTab = 'violations' | 'graph';

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

export default function ComposeResultsPanel() {
  const [activeTab, setActiveTab] = useState<ResultTab>('violations');
  const result = useStore(composeResult);
  const analyzing = useStore(composeAnalyzing);
  const stale = useStore(composeResultsStale);

  const handleNavigate = (line: number) => {
    const view = composeEditorViewRef.get();
    if (!view) return;
    highlightAndScroll(view, line);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] mb-3 min-h-[40px]">
        <button
          onClick={() => setActiveTab('violations')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'violations'
              ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-text-primary)]'
              : 'border-b-2 border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Violations
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'graph'
              ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-text-primary)]'
              : 'border-b-2 border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Dependency Graph
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt,rgba(0,0,0,0.2))] p-4 overflow-y-auto">
        {activeTab === 'violations' ? (
          /* Violations tab content */
          analyzing ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[var(--color-text-secondary)] animate-pulse">
                Analyzing...
              </p>
            </div>
          ) : result === null ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-[var(--color-text-secondary)]">
                Click <strong>Analyze</strong> to validate your Docker Compose file
              </p>
            </div>
          ) : !result.parseSuccess ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500 font-medium">
                YAML parse error -- check your syntax
              </p>
            </div>
          ) : result.violations.length === 0 ? (
            <div className={stale ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              {stale && (
                <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-xs mb-3">
                  Results may be outdated. Re-analyze to refresh.
                </div>
              )}
              <ComposeEmptyState score={result.score.overall} grade={result.score.grade} />
              <ComposeShareActions />
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
                  <ComposeCategoryBreakdown categories={result.score.categories} />
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
              <ComposeViolationList violations={result.violations} onNavigate={handleNavigate} />
              <ComposeShareActions />
            </div>
          )
        ) : (
          /* Graph tab content */
          result === null ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-[var(--color-text-secondary)]">
                Run analysis first to see the dependency graph
              </p>
            </div>
          ) : (
            <Suspense fallback={<GraphSkeleton />}>
              <LazyDependencyGraph
                result={result}
                yamlContent={composeEditorViewRef.get()?.state.doc.toString() ?? ''}
              />
            </Suspense>
          )
        )}
      </div>
    </div>
  );
}
