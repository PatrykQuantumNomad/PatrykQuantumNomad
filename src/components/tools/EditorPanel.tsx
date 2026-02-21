import '../../lib/tools/dockerfile-analyzer/buffer-polyfill';
import { useRef, useCallback, useEffect } from 'react';
import type { EditorView } from '@codemirror/view';
import { setDiagnostics } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { DockerfileParser } from 'dockerfile-ast';
import { useCodeMirror } from '../../lib/tools/dockerfile-analyzer/use-codemirror';
import { runRuleEngine } from '../../lib/tools/dockerfile-analyzer/engine';
import { computeScore } from '../../lib/tools/dockerfile-analyzer/scorer';
import { getRuleById } from '../../lib/tools/dockerfile-analyzer/rules';
import { SAMPLE_DOCKERFILE } from '../../lib/tools/dockerfile-analyzer/sample-dockerfile';
import { decodeFromHash } from '../../lib/tools/dockerfile-analyzer/url-state';
import { analysisResult, isAnalyzing, resultsStale } from '../../stores/dockerfileAnalyzerStore';

export default function EditorPanel() {
  // Decode shared Dockerfile from URL hash (synchronous, before editor creation)
  const hashContentRef = useRef<string | null>(
    typeof window !== 'undefined' ? decodeFromHash() : null,
  );
  const initialDoc = hashContentRef.current || SAMPLE_DOCKERFILE;

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

    resultsStale.set(false);
    isAnalyzing.set(true);

    try {
      const ast = DockerfileParser.parse(content);
      const { violations, rulesRun } = runRuleEngine(ast, content);
      const score = computeScore(violations);

      // Convert violations to CodeMirror Diagnostics
      const diagnostics: Diagnostic[] = violations.map((v) => {
        const line = view.state.doc.line(v.line);
        const rule = getRuleById(v.ruleId);
        const severity =
          rule?.severity === 'error'
            ? 'error'
            : rule?.severity === 'warning'
              ? 'warning'
              : 'info';
        return {
          from: line.from + (v.column - 1),
          to: v.endLine ? view.state.doc.line(v.endLine).to : line.to,
          severity,
          message: `[${v.ruleId}] ${v.message}`,
          source: 'dockerfile-analyzer',
        };
      });

      view.dispatch(setDiagnostics(view.state, diagnostics));

      // Enrich violations with rule metadata for nanostore
      const enrichedViolations = violations.map((v) => {
        const rule = getRuleById(v.ruleId);
        return {
          ...v,
          severity: rule?.severity ?? ('info' as const),
          category: rule?.category ?? ('best-practice' as const),
          title: rule?.title ?? v.ruleId,
          explanation: rule?.explanation ?? '',
          fix: rule?.fix ?? { description: '', beforeCode: '', afterCode: '' },
        };
      });

      analysisResult.set({
        violations: enrichedViolations,
        score,
        astNodeCount: ast.getInstructions().length,
        parseSuccess: true,
        timestamp: Date.now(),
      });
    } catch {
      // Parse error -- set empty result with zero score
      view.dispatch(setDiagnostics(view.state, []));
      analysisResult.set({
        violations: [],
        score: {
          overall: 0,
          grade: 'F',
          categories: [],
          deductions: [],
        },
        astNodeCount: 0,
        parseSuccess: false,
        timestamp: Date.now(),
      });
    }

    isAnalyzing.set(false);
  };

  const { containerRef, viewRef } = useCodeMirror({
    initialDoc,
    onAnalyze: (view) => analyzeRef.current(view),
  });

  // Auto-trigger analysis when loading from a shared URL hash
  useEffect(() => {
    if (hashContentRef.current && viewRef.current) {
      analyzeRef.current(viewRef.current);
    }
  }, []);

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
