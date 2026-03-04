/**
 * React hook that creates and manages a CodeMirror 6 EditorView with YAML
 * syntax highlighting for the GitHub Actions Workflow Validator.
 *
 * Ported from src/lib/tools/k8s-analyzer/use-codemirror-k8s.ts with:
 * - yaml() language from @codemirror/lang-yaml
 * - Mod-Enter shortcut for triggering analysis (before basicSetup for precedence)
 * - lintGutter() for gutter severity markers (setDiagnostics-driven, not auto-linter)
 * - localStorage persistence with debounced save
 * - Astro View Transitions cleanup handler
 * - ghaResultsStale detection on document change
 */

import { useRef, useEffect } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { lintGutter } from '@codemirror/lint';
import { editorTheme, oneDarkTheme, a11ySyntaxHighlighting } from '../dockerfile-analyzer/editor-theme';
import { highlightLineField } from '../dockerfile-analyzer/highlight-line';
import {
  ghaEditorViewRef,
  ghaResultsStale,
  ghaResult,
} from '../../../stores/ghaValidatorStore';

const STORAGE_KEY = 'gha-editor-content';

interface UseCodeMirrorYamlOptions {
  initialDoc: string;
  onAnalyze: (view: EditorView) => void;
}

/**
 * React hook that creates and manages a CodeMirror 6 EditorView with YAML
 * syntax highlighting and a dark theme.
 *
 * Key design decisions:
 * - Empty deps array: EditorView is created once, destroyed on unmount.
 * - Double cleanup: React useEffect cleanup AND astro:before-swap listener
 *   ensure no orphaned EditorView instances during View Transitions navigation.
 * - lintGutter() included without linter(): enables gutter markers when
 *   setDiagnostics pushes diagnostics on-demand (button-triggered only).
 * - Mod-Enter keymap placed BEFORE basicSetup for precedence.
 * - localStorage persistence: auto-saves editor content on change (debounced 500ms).
 */
export function useCodeMirrorYaml({ initialDoc, onAnalyze }: UseCodeMirrorYamlOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Stable ref for onAnalyze so the keymap closure always calls latest
  const onAnalyzeRef = useRef(onAnalyze);
  onAnalyzeRef.current = onAnalyze;

  useEffect(() => {
    if (!containerRef.current) return;

    // Restore from localStorage if no URL hash was provided
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const doc = saved?.trim() && !window.location.hash ? saved : initialDoc;

    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    const state = EditorState.create({
      doc,
      extensions: [
        // Mod-Enter analyze shortcut (before basicSetup for precedence)
        keymap.of([
          {
            key: 'Mod-Enter',
            run: (view) => {
              onAnalyzeRef.current(view);
              return true;
            },
          },
        ]),
        basicSetup,
        yaml(),
        lintGutter(),
        oneDarkTheme,
        a11ySyntaxHighlighting,
        editorTheme,
        highlightLineField,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': 'GitHub Actions workflow editor',
        }),
        // Detect stale results + persist to localStorage
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (ghaResult.get() !== null) {
              ghaResultsStale.set(true);
            }
            // Debounced localStorage save
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
              try {
                localStorage.setItem(STORAGE_KEY, update.state.doc.toString());
              } catch { /* quota exceeded -- ignore */ }
            }, 500);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    ghaEditorViewRef.set(view);

    // View Transitions safety: destroy on swap even if React cleanup races
    const handleSwap = () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        ghaEditorViewRef.set(null);
        viewRef.current = null;
      }
    };
    document.addEventListener('astro:before-swap', handleSwap);

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
      document.removeEventListener('astro:before-swap', handleSwap);
      view.destroy();
      ghaEditorViewRef.set(null);
      viewRef.current = null;
    };
  }, []); // Empty deps: create once, destroy on unmount

  return { containerRef, viewRef };
}
