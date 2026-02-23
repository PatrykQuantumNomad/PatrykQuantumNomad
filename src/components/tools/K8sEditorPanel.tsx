import { useRef, useCallback, useEffect } from 'react';
import type { EditorView } from '@codemirror/view';
import { setDiagnostics } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { useCodeMirrorK8s } from '../../lib/tools/k8s-analyzer/use-codemirror-k8s';
import { runK8sEngine } from '../../lib/tools/k8s-analyzer/engine';
import { computeK8sScore } from '../../lib/tools/k8s-analyzer/scorer';
import { getK8sRuleById } from '../../lib/tools/k8s-analyzer/rules';
import { SCHEMA_RULE_METADATA } from '../../lib/tools/k8s-analyzer/diagnostic-rules';
import { SAMPLE_K8S_MANIFEST } from '../../lib/tools/k8s-analyzer/sample-manifest';
import { decodeFromHash } from '../../lib/tools/k8s-analyzer/url-state';
import {
  k8sResult,
  k8sAnalyzing,
  k8sResultsStale,
} from '../../stores/k8sAnalyzerStore';
import type {
  K8sLintViolation,
  K8sRuleFix,
  K8sSeverity,
  K8sCategory,
} from '../../lib/tools/k8s-analyzer/types';

export default function K8sEditorPanel() {
  const hashContentRef = useRef<string | null>(typeof window !== 'undefined' ? decodeFromHash() : null);
  const analyzeRef = useRef<(view: EditorView) => void>(() => {});

  analyzeRef.current = async (view: EditorView) => {
    const content = view.state.doc.toString();
    if (!content.trim()) {
      view.dispatch(setDiagnostics(view.state, []));
      k8sResult.set(null);
      return;
    }

    k8sResultsStale.set(false);
    k8sAnalyzing.set(true);

    try {
      // Yield to event loop so React paints "Analyzing..." state
      await new Promise(resolve => setTimeout(resolve, 0));

      // K8s engine is async (unlike Compose) — MUST await
      const engineResult = await runK8sEngine(content);
      const score = computeK8sScore(engineResult.violations);

      // Convert violations to CodeMirror Diagnostics
      const diagnostics: Diagnostic[] = engineResult.violations.map((v) => {
        // Clamp line numbers to prevent "Position out of range" crash
        const clampedLine = Math.min(v.line, view.state.doc.lines);
        const line = view.state.doc.line(clampedLine);

        // Dual lookup — check lint rules AND schema rule metadata
        const lintRule = getK8sRuleById(v.ruleId);
        const schemaMeta = SCHEMA_RULE_METADATA[v.ruleId];
        const rule = lintRule ?? schemaMeta;

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
          source: 'k8s-analyzer',
        };
      });

      view.dispatch(setDiagnostics(view.state, diagnostics));

      // Enrich violations with metadata from dual rule lookup
      const enrichedViolations: K8sLintViolation[] = engineResult.violations.map((v) => {
        const lintRule = getK8sRuleById(v.ruleId);
        const schemaMeta = SCHEMA_RULE_METADATA[v.ruleId];
        const rule = lintRule ?? schemaMeta;

        // Find which resource this violation belongs to
        const resource = engineResult.resources.find(r => {
          const endLine = v.endLine ?? v.line;
          const nextResource = engineResult.resources.find(nr => nr.startLine > r.startLine);
          const resourceEndLine = nextResource ? nextResource.startLine - 1 : Infinity;
          return v.line >= r.startLine && endLine <= resourceEndLine;
        });

        return {
          ...v,
          severity: (rule?.severity ?? 'info') as K8sSeverity,
          category: (rule?.category ?? 'schema') as K8sCategory,
          title: rule?.title ?? v.ruleId,
          explanation: rule?.explanation ?? '',
          fix: rule?.fix ?? ({ description: '', beforeCode: '', afterCode: '' } as K8sRuleFix),
          resourceName: resource?.name,
          resourceKind: resource?.kind,
        };
      });

      k8sResult.set({
        violations: enrichedViolations,
        score,
        resources: engineResult.resources,
        resourceSummary: engineResult.resourceSummary,
        pssCompliance: engineResult.pssCompliance,
        parseSuccess: true,
        timestamp: Date.now(),
      });
    } catch {
      // Parse error — set empty diagnostics and zero-score result
      view.dispatch(setDiagnostics(view.state, []));
      k8sResult.set({
        violations: [],
        score: {
          overall: 0,
          grade: 'F',
          categories: [],
          deductions: [],
        },
        resources: [],
        resourceSummary: new Map(),
        parseSuccess: false,
        timestamp: Date.now(),
      });
    }

    k8sAnalyzing.set(false);
  };

  const { containerRef, viewRef } = useCodeMirrorK8s({
    initialDoc: hashContentRef.current || SAMPLE_K8S_MANIFEST,
    onAnalyze: () => {
      if (viewRef.current) analyzeRef.current(viewRef.current);
    },
  });

  // Auto-analyze when loading from a shared URL hash
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

  const handleClear = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: '' },
    });
    view.dispatch(setDiagnostics(view.state, []));
    k8sResult.set(null);
    k8sResultsStale.set(false);
    view.focus();
  }, [viewRef]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 min-h-[40px]">
        <h2 className="text-lg font-heading font-semibold">Editor</h2>
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
      <div
        ref={containerRef}
        className="flex-1 min-h-[300px] lg:min-h-[450px] overflow-hidden rounded-lg"
      />
    </div>
  );
}
