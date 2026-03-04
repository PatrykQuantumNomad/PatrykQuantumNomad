/**
 * GitHub Actions Workflow Validator -- Editor Panel
 *
 * CodeMirror 6 YAML editor with two-pass analysis orchestration:
 *   Pass 1 (synchronous): Schema validation + custom lint rules -> immediate results
 *   Pass 2 (async WASM):  actionlint Worker -> merged results when ready
 *
 * Key design decisions:
 * - setDiagnostics() for on-demand (button-triggered) linting, NOT linter() auto-trigger
 * - Worker created lazily on first analyze, reused for subsequent calls
 * - Generation counter prevents stale Pass 2 diagnostics from being applied
 * - Pass 1 results displayed immediately without waiting for WASM
 */

import { useRef, useCallback, useEffect } from 'react';
import type { EditorView } from '@codemirror/view';
import { setDiagnostics } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { useCodeMirrorYaml } from '../../lib/tools/gha-validator/use-codemirror-yaml';
import { runPass1, mergePass2 } from '../../lib/tools/gha-validator/engine';
import { allGhaRules } from '../../lib/tools/gha-validator/rules/index';
import { computeGhaScore } from '../../lib/tools/gha-validator/scorer';
import { createActionlintWorker } from '../../lib/tools/gha-validator/worker/worker-client';
import { SAMPLE_GHA_WORKFLOW } from '../../lib/tools/gha-validator/sample-workflow';
import type { GhaUnifiedViolation } from '../../lib/tools/gha-validator/types';
import {
  ghaResult,
  ghaAnalyzing,
  ghaResultsStale,
  ghaWasmProgress,
  ghaWasmError,
  ghaWasmLoading,
} from '../../stores/ghaValidatorStore';
import { FullscreenToggle } from './results/FullscreenToggle';

// ── Types ────────────────────────────────────────────────────────────

interface GhaEditorPanelProps {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Convert GhaUnifiedViolation[] to CodeMirror Diagnostic[] for inline annotations.
 * Clamps line numbers to prevent "Position out of range" crash on stale results.
 * Violations already carry severity -- no rule lookup needed.
 */
function toDiagnostics(
  view: EditorView,
  violations: GhaUnifiedViolation[],
): Diagnostic[] {
  return violations.map((v) => {
    const clampedLine = Math.min(v.line, view.state.doc.lines);
    const line = view.state.doc.line(clampedLine);

    const from = line.from + Math.max(0, (v.column ?? 1) - 1);
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
      severity: v.severity,
      message: `[${v.ruleId}] ${v.message}`,
      source: 'gha-validator',
    };
  });
}

// ── Component ────────────────────────────────────────────────────────

export default function GhaEditorPanel({
  onToggleFullscreen,
  isFullscreen,
}: GhaEditorPanelProps) {
  // Worker lifecycle refs -- created once, reused for subsequent analyses
  const workerRef = useRef<ReturnType<typeof createActionlintWorker> | null>(null);
  const wasmReadyRef = useRef(false);

  // Generation counter to detect stale Pass 2 results
  const generationRef = useRef(0);
  // The generation that was active when the current Worker.analyze() was called
  const workerGenerationRef = useRef(0);
  // Store Pass 1 violations for merging with Pass 2 results
  const pass1ViolationsRef = useRef<GhaUnifiedViolation[]>([]);
  // Store the current EditorView for Pass 2 callback
  const viewForPass2Ref = useRef<EditorView | null>(null);

  // Stable ref for analyze function so hook keymap closure always calls latest
  const analyzeRef = useRef<(view: EditorView) => void>(() => {});

  analyzeRef.current = (view: EditorView) => {
    const yaml = view.state.doc.toString();

    // Empty document -- clear everything
    if (!yaml.trim()) {
      view.dispatch(setDiagnostics(view.state, []));
      ghaResult.set(null);
      ghaAnalyzing.set(false);
      return;
    }

    ghaResultsStale.set(false);
    ghaAnalyzing.set(true);

    // Increment generation counter for staleness detection
    const currentGeneration = ++generationRef.current;

    // ── Pass 1 (synchronous) ──────────────────────────────────────
    const pass1 = runPass1(yaml, allGhaRules);
    const pass1Score = computeGhaScore(pass1.violations);

    ghaResult.set({
      violations: pass1.violations,
      score: pass1Score,
      pass: 1,
    });

    view.dispatch(
      setDiagnostics(view.state, toDiagnostics(view, pass1.violations)),
    );

    // Pass 1 complete -- UI is responsive
    ghaAnalyzing.set(false);

    // Store Pass 1 violations and view for Pass 2 merge callback
    pass1ViolationsRef.current = pass1.violations;
    viewForPass2Ref.current = view;
    workerGenerationRef.current = currentGeneration;

    // ── Pass 2 (async WASM Worker) ────────────────────────────────
    if (!workerRef.current) {
      // First analyze: create Worker, wait for ready
      ghaWasmLoading.set(true);
      workerRef.current = createActionlintWorker({
        onReady: () => {
          wasmReadyRef.current = true;
          ghaWasmLoading.set(false);
          // Run analysis with the yaml that was current when Worker was created
          workerRef.current!.analyze(yaml);
        },
        onResult: (errors) => {
          // Check generation via ref -- discard if user has triggered a new analysis
          const gen = workerGenerationRef.current;
          if (generationRef.current !== gen) return;

          const merged = mergePass2(pass1ViolationsRef.current, errors);
          const mergedScore = computeGhaScore(merged.violations);

          ghaResult.set({
            violations: merged.violations,
            score: mergedScore,
            pass: 2,
          });

          // Update CM diagnostics only if editor still exists and generation matches
          const currentView = viewForPass2Ref.current;
          if (currentView && generationRef.current === gen) {
            currentView.dispatch(
              setDiagnostics(
                currentView.state,
                toDiagnostics(currentView, merged.violations),
              ),
            );
          }
        },
        onError: (msg) => {
          ghaWasmError.set(msg);
          ghaWasmLoading.set(false);
        },
        onProgress: (progress) => {
          ghaWasmProgress.set(progress);
        },
      });
    } else if (wasmReadyRef.current) {
      // Subsequent: Worker already ready, just send
      // Refs are already updated above (pass1ViolationsRef, workerGenerationRef, viewForPass2Ref)
      workerRef.current.analyze(yaml);
    }
    // else: Worker is loading, will analyze when onReady fires
  };

  const handleAnalyze = useCallback((view: EditorView) => {
    analyzeRef.current(view);
  }, []);

  const { containerRef, viewRef } = useCodeMirrorYaml({
    initialDoc: SAMPLE_GHA_WORKFLOW,
    onAnalyze: handleAnalyze,
  });

  // Listen for re-analyze requests from the stale results banner
  useEffect(() => {
    const handler = () => {
      if (viewRef.current) analyzeRef.current(viewRef.current);
    };
    document.addEventListener('tool:reanalyze', handler);
    return () => document.removeEventListener('tool:reanalyze', handler);
  }, []);

  // Cleanup Worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        wasmReadyRef.current = false;
      }
    };
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
    ghaResult.set(null);
    ghaResultsStale.set(false);
    try {
      localStorage.removeItem('gha-editor-content');
    } catch {
      /* ignore */
    }
    view.focus();
  }, [viewRef]);

  // Detect platform for shortcut hint
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const shortcutHint = isMac ? 'Cmd+Enter' : 'Ctrl+Enter';

  return (
    <div>
      <div className="flex items-center justify-between mb-3 min-h-[40px]">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg font-heading font-semibold">Editor</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Paste or edit your GitHub Actions workflow YAML
            </p>
          </div>
          {onToggleFullscreen && (
            <FullscreenToggle
              isFullscreen={!!isFullscreen}
              onClick={onToggleFullscreen}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-[var(--color-text-secondary)]">
            {shortcutHint}
          </span>
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
