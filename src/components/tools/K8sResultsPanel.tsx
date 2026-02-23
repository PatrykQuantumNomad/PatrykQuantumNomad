import { useState, lazy, Suspense } from 'react';
import { useStore } from '@nanostores/react';
import {
  k8sResult,
  k8sAnalyzing,
  k8sResultsStale,
  k8sEditorViewRef,
} from '../../stores/k8sAnalyzerStore';
import { ScoreGauge } from './results/ScoreGauge';
import { K8sCategoryBreakdown } from './k8s-results/K8sCategoryBreakdown';
import { K8sViolationList } from './k8s-results/K8sViolationList';
import { K8sEmptyState } from './k8s-results/K8sEmptyState';
import { K8sShareActions } from './k8s-results/K8sShareActions';
import { K8sResourceSummary } from './k8s-results/K8sResourceSummary';
import { K8sPssCompliance } from './k8s-results/K8sPssCompliance';
import { highlightAndScroll } from '../../lib/tools/dockerfile-analyzer/highlight-line';
import { K8sGraphSkeleton } from './k8s-results/K8sGraphSkeleton';

const LazyK8sResourceGraph = lazy(() => import('./k8s-results/K8sResourceGraph'));

type ResultTab = 'results' | 'graph';

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

export default function K8sResultsPanel() {
  const [activeTab, setActiveTab] = useState<ResultTab>('results');
  const result = useStore(k8sResult);
  const analyzing = useStore(k8sAnalyzing);
  const stale = useStore(k8sResultsStale);

  const handleNavigate = (line: number) => {
    const view = k8sEditorViewRef.get();
    if (!view) return;
    highlightAndScroll(view, line);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] mb-3 min-h-[40px]">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'results'
              ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-text-primary)]'
              : 'border-b-2 border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Results
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'graph'
              ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-text-primary)]'
              : 'border-b-2 border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Graph
        </button>
      </div>

      {/* Tab content */}
      <div className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt,rgba(0,0,0,0.2))] p-4 ${activeTab === 'results' ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'}`}>
        {activeTab === 'results' ? (
          /* Results tab content */
          analyzing ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[var(--color-text-secondary)] animate-pulse">
                Analyzing...
              </p>
            </div>
          ) : result === null ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-[var(--color-text-secondary)]">
                Click <strong>Analyze</strong> to validate your Kubernetes manifests
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
              <K8sEmptyState score={result.score.overall} grade={result.score.grade} />
              <K8sShareActions />
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
                  <K8sCategoryBreakdown categories={result.score.categories} />
                </div>
              </div>

              {/* Resource summary */}
              <div className="mb-3">
                <K8sResourceSummary resourceSummary={result.resourceSummary} />
              </div>

              {/* PSS compliance */}
              {result.pssCompliance && (
                <div className="mb-3">
                  <K8sPssCompliance pssCompliance={result.pssCompliance} />
                </div>
              )}

              {/* Violation count summary */}
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                {result.violations.length} issue{result.violations.length !== 1 ? 's' : ''} found
                <span className="ml-1 text-xs">
                  ({severitySummary(result.violations)})
                </span>
              </p>

              {/* Violation list */}
              <K8sViolationList violations={result.violations} onNavigate={handleNavigate} />
              <K8sShareActions />
            </div>
          )
        ) : (
          /* Graph tab content */
          result === null ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-[var(--color-text-secondary)]">
                Run analysis first to see the resource graph
              </p>
            </div>
          ) : !result.parseSuccess ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-[var(--color-text-secondary)]">
                Fix YAML parse errors to see the resource graph
              </p>
            </div>
          ) : (
            <Suspense fallback={<K8sGraphSkeleton />}>
              <LazyK8sResourceGraph result={result} />
            </Suspense>
          )
        )}
      </div>
    </div>
  );
}
