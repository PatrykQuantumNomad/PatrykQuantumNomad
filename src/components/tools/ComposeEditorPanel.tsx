import { useRef, useCallback, useEffect } from 'react';
import type { EditorView } from '@codemirror/view';
import { setDiagnostics } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { useCodeMirrorYaml } from '../../lib/tools/compose-validator/use-codemirror-yaml';
import { parseComposeYaml } from '../../lib/tools/compose-validator/parser';
import { runComposeEngine } from '../../lib/tools/compose-validator/engine';
import { computeComposeScore } from '../../lib/tools/compose-validator/scorer';
import { getComposeRuleById } from '../../lib/tools/compose-validator/rules';
import { getSchemaRuleById } from '../../lib/tools/compose-validator/rules/schema';
import { SAMPLE_COMPOSE } from '../../lib/tools/compose-validator/sample-compose';
import { decodeFromHash } from '../../lib/tools/compose-validator/url-state';
import {
  composeResult,
  composeAnalyzing,
  composeResultsStale,
} from '../../stores/composeValidatorStore';
import type {
  ComposeLintViolation,
  ComposeRuleFix,
  ComposeSeverity,
  ComposeCategory,
} from '../../lib/tools/compose-validator/types';
import { FullscreenToggle } from './results/FullscreenToggle';

interface ComposeEditorPanelProps {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export default function ComposeEditorPanel({ onToggleFullscreen, isFullscreen }: ComposeEditorPanelProps) {
  const hashContentRef = useRef<string | null>(typeof window !== 'undefined' ? decodeFromHash() : null);
  const analyzeRef = useRef<(view: EditorView) => void>(() => {});

  analyzeRef.current = (view: EditorView) => {
    const content = view.state.doc.toString();
    if (!content.trim()) {
      view.dispatch(setDiagnostics(view.state, []));
      composeResult.set(null);
      return;
    }

    composeResultsStale.set(false);
    composeAnalyzing.set(true);

    try {
      const parseResult = parseComposeYaml(content);
      const { violations } = runComposeEngine(parseResult, content);
      const score = computeComposeScore(violations);

      // Convert violations to CodeMirror Diagnostics
      const diagnostics: Diagnostic[] = violations.map((v) => {
        // CLAMP line numbers to prevent "Position out of range" crash
        const clampedLine = Math.min(v.line, view.state.doc.lines);
        const line = view.state.doc.line(clampedLine);

        // Dual registry lookup: covers all 52 rules (44 custom + 8 schema)
        const composeRule = getComposeRuleById(v.ruleId);
        const schemaRule = getSchemaRuleById(v.ruleId);
        const rule = composeRule ?? schemaRule;

        const severity: Diagnostic['severity'] =
          rule?.severity === 'error'
            ? 'error'
            : rule?.severity === 'warning'
              ? 'warning'
              : 'info';

        const from = line.from + Math.max(0, (v.column - 1));
        let to: number;
        if (v.endLine) {
          const clampedEndLine = Math.min(v.endLine, view.state.doc.lines);
          to = view.state.doc.line(clampedEndLine).to;
        } else {
          to = line.to;
        }

        return {
          from,
          to,
          severity,
          message: `[${v.ruleId}] ${v.message}`,
          source: 'compose-validator',
        };
      });

      view.dispatch(setDiagnostics(view.state, diagnostics));

      // Enrich violations with metadata from dual registry lookup
      const enrichedViolations: ComposeLintViolation[] = violations.map((v) => {
        const composeRule = getComposeRuleById(v.ruleId);
        const schemaRule = getSchemaRuleById(v.ruleId);
        const rule = composeRule ?? schemaRule;

        return {
          ...v,
          severity: (rule?.severity ?? 'info') as ComposeSeverity,
          category: (rule?.category ?? 'schema') as ComposeCategory,
          title: rule?.title ?? v.ruleId,
          explanation: rule?.explanation ?? '',
          fix: rule?.fix ?? ({ description: '', beforeCode: '', afterCode: '' } as ComposeRuleFix),
        };
      });

      composeResult.set({
        violations: enrichedViolations,
        score,
        parseSuccess: parseResult.parseSuccess,
        timestamp: Date.now(),
      });
    } catch {
      // Parse error -- set empty diagnostics and zero-score result
      view.dispatch(setDiagnostics(view.state, []));
      composeResult.set({
        violations: [],
        score: {
          overall: 0,
          grade: 'F',
          categories: [],
          deductions: [],
        },
        parseSuccess: false,
        timestamp: Date.now(),
      });
    }

    composeAnalyzing.set(false);
  };

  const { containerRef, viewRef } = useCodeMirrorYaml({
    initialDoc: hashContentRef.current || SAMPLE_COMPOSE,
  });

  // Auto-analyze when loading from a shared URL hash
  useEffect(() => {
    if (hashContentRef.current && viewRef.current) {
      analyzeRef.current(viewRef.current);
    }
  }, []);

  // Listen for re-analyze requests from the stale results banner
  useEffect(() => {
    const handler = () => {
      if (viewRef.current) analyzeRef.current(viewRef.current);
    };
    document.addEventListener('tool:reanalyze', handler);
    return () => document.removeEventListener('tool:reanalyze', handler);
  }, []);

  const handleButtonClick = useCallback(() => {
    if (viewRef.current) {
      analyzeRef.current(viewRef.current);
    }
  }, [viewRef]);

  const handleClear = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: '' },
    });
    view.dispatch(setDiagnostics(view.state, []));
    composeResult.set(null);
    composeResultsStale.set(false);
    try { localStorage.removeItem('compose-editor-content'); } catch { /* ignore */ }
    view.focus();
  }, [viewRef]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 min-h-[40px]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-heading font-semibold">Editor</h2>
          {onToggleFullscreen && (
            <FullscreenToggle isFullscreen={!!isFullscreen} onClick={onToggleFullscreen} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all
              border border-[var(--color-border)] bg-transparent
              hover:bg-white/5
              active:bg-white/10
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Clear
          </button>
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
      </div>
      <div ref={containerRef} className="rounded-lg" />
    </div>
  );
}
