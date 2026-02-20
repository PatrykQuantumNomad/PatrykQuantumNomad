import { useRef, useCallback } from 'react';
import type { EditorView } from '@codemirror/view';
import { setDiagnostics } from '@codemirror/lint';
import { useCodeMirror } from '../../lib/tools/dockerfile-analyzer/use-codemirror';
import { parseDockerfile } from '../../lib/tools/dockerfile-analyzer/parser';
import { SAMPLE_DOCKERFILE } from '../../lib/tools/dockerfile-analyzer/sample-dockerfile';
import { analysisResult, isAnalyzing } from '../../stores/dockerfileAnalyzerStore';

export default function EditorPanel() {
  // Wrap analyze in a ref so the keymap callback always calls the latest version
  // without needing to re-create the EditorView.
  const analyzeRef = useRef<(view: EditorView) => void>(() => {});

  analyzeRef.current = (view: EditorView) => {
    const content = view.state.doc.toString();
    if (!content.trim()) {
      view.dispatch(setDiagnostics(view.state, []));
      analysisResult.set(null);
      return;
    }

    isAnalyzing.set(true);

    const result = parseDockerfile(content);

    // Phase 22: no rules yet, so diagnostics are empty.
    // Phase 23 will produce real Diagnostic[] from the rule engine.
    view.dispatch(setDiagnostics(view.state, []));

    analysisResult.set({
      violations: [],
      astNodeCount: result.nodeCount,
      parseSuccess: result.success,
      timestamp: Date.now(),
    });

    isAnalyzing.set(false);
  };

  const { containerRef, viewRef } = useCodeMirror({
    initialDoc: SAMPLE_DOCKERFILE,
    onAnalyze: (view) => analyzeRef.current(view),
  });

  const handleButtonClick = useCallback(() => {
    if (viewRef.current) {
      analyzeRef.current(viewRef.current);
    }
  }, [viewRef]);

  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  const shortcutHint = isMac ? 'Cmd+Enter' : 'Ctrl+Enter';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-heading font-semibold">Editor</h2>
        <button
          onClick={handleButtonClick}
          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all
            bg-[var(--color-accent)] text-white
            hover:brightness-110 hover:shadow-lg
            active:brightness-95
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          Analyze
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-[300px] lg:min-h-[450px] overflow-hidden rounded-lg"
      />
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        {shortcutHint} to analyze
      </p>
    </div>
  );
}
