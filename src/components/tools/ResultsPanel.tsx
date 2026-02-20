import { useStore } from '@nanostores/react';
import { analysisResult, isAnalyzing } from '../../stores/dockerfileAnalyzerStore';

export default function ResultsPanel() {
  const result = useStore(analysisResult);
  const analyzing = useStore(isAnalyzing);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-heading font-semibold mb-3">Results</h2>
      <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt,rgba(0,0,0,0.2))] p-4">
        {analyzing ? (
          <p className="text-[var(--color-text-secondary)]">Analyzing...</p>
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
        ) : result.parseSuccess ? (
          <div>
            <p className="text-green-600 font-medium mb-2">Parse successful</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {result.astNodeCount} instruction{result.astNodeCount !== 1 ? 's' : ''} found
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-4">
              Rule engine coming in Phase 23 -- violations will appear here.
            </p>
          </div>
        ) : (
          <p className="text-red-600">Parse error -- check Dockerfile syntax</p>
        )}
      </div>
    </div>
  );
}
