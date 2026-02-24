import { useState, useMemo } from 'react';
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
import { FullscreenToggle } from './results/FullscreenToggle';
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

interface ResultsPanelProps {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export default function ResultsPanel({ onToggleFullscreen, isFullscreen }: ResultsPanelProps) {
  const result = useStore(analysisResult);
  const analyzing = useStore(isAnalyzing);
  const stale = useStore(resultsStale);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const violationCounts = useMemo(() => {
    if (!result?.violations) return {};
    const counts: Record<string, number> = {};
    for (const v of result.violations) counts[v.category] = (counts[v.category] ?? 0) + 1;
    return counts;
  }, [result]);

  const handleNavigate = (line: number) => {
    const view = editorViewRef.get();
    if (!view) return;
    highlightAndScroll(view, line);
  };

  return (
    <div>
      <div className="flex items-center mb-3 min-h-[40px]">
        <h2 className="text-lg font-heading font-semibold">Results</h2>
        {onToggleFullscreen && (
          <div className="ml-auto">
            <FullscreenToggle isFullscreen={!!isFullscreen} onClick={onToggleFullscreen} />
          </div>
        )}
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt,rgba(0,0,0,0.2))] p-4">
        {analyzing ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--color-text-secondary)]">Analyzing...</p>
          </div>
        ) : result === null || result === undefined ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-[var(--color-text-secondary)]">
              Click <strong>Analyze</strong> to check your Dockerfile
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
                Results may be outdated.
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('tool:reanalyze'))}
                  className="ml-1.5 underline hover:text-amber-300 transition-colors font-medium"
                >
                  Re-analyze
                </button>
              </div>
            )}
            <EmptyState score={result.score.overall} grade={result.score.grade} />
            <ShareActions />
          </div>
        ) : (
          <div className={stale ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {stale && (
              <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-xs mb-3">
                Results may be outdated.
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('tool:reanalyze'))}
                  className="ml-1.5 underline hover:text-amber-300 transition-colors font-medium"
                >
                  Re-analyze
                </button>
              </div>
            )}

            {/* Score + Category breakdown */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
              <ScoreGauge score={result.score.overall} grade={result.score.grade} size={80} />
              <div className="flex-1 w-full">
                <CategoryBreakdown
                  categories={result.score.categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  violationCounts={violationCounts}
                />
              </div>
            </div>

            {/* Violation count summary */}
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {result.violations.length} issue{result.violations.length !== 1 ? 's' : ''} found
              <span className="ml-1 text-xs">
                ({severitySummary(result.violations)})
              </span>
            </p>

            <div className="mb-4">
              <ShareActions />
            </div>

            {/* Search */}
            {result.violations.length > 5 && (
              <div className="mb-3">
                <input
                  id="dockerfile-issue-search"
                  name="dockerfile-issue-search"
                  type="search"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            )}

            {/* Violation list */}
            <ViolationList violations={result.violations} onNavigate={handleNavigate} selectedCategory={selectedCategory} searchQuery={searchQuery} />
          </div>
        )}
      </div>
    </div>
  );
}
