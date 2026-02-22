import { useRef, useEffect } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { lintGutter } from '@codemirror/lint';
import { editorTheme, oneDarkTheme, a11ySyntaxHighlighting } from '../dockerfile-analyzer/editor-theme';
import { highlightLineField } from '../dockerfile-analyzer/highlight-line';
import {
  composeEditorViewRef,
  composeResultsStale,
  composeResult,
} from '../../../stores/composeValidatorStore';

interface UseCodeMirrorYamlOptions {
  initialDoc: string;
  onAnalyze: () => void;
}

/**
 * React hook that creates and manages a CodeMirror 6 EditorView with YAML
 * syntax highlighting, a dark theme, and a Mod-Enter keyboard shortcut.
 *
 * Key design decisions:
 * - Empty deps array: EditorView is created once, destroyed on unmount.
 *   The onAnalyze callback is held in analyzeRef to avoid stale closures
 *   without recreating the editor on every render.
 * - Double cleanup: React useEffect cleanup AND astro:before-swap listener
 *   ensure no orphaned EditorView instances during View Transitions navigation.
 * - lintGutter() included without linter(): enables gutter markers when
 *   setDiagnostics pushes diagnostics on-demand (EDIT-02 requires button-triggered only).
 * - keymap.of() placed before theme extensions for correct precedence.
 */
export function useCodeMirrorYaml({ initialDoc, onAnalyze }: UseCodeMirrorYamlOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const analyzeRef = useRef<() => void>(onAnalyze);

  // Keep analyzeRef current to avoid stale closures in keymap
  analyzeRef.current = onAnalyze;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        basicSetup,
        yaml(),
        lintGutter(),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              analyzeRef.current();
              return true;
            },
          },
        ]),
        oneDarkTheme,
        a11ySyntaxHighlighting,
        editorTheme,
        highlightLineField,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': 'Docker Compose editor — paste or type your docker-compose.yml here',
        }),
        // Detect stale results: set flag when doc changes after analysis
        EditorView.updateListener.of((update) => {
          if (update.docChanged && composeResult.get() !== null) {
            composeResultsStale.set(true);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    composeEditorViewRef.set(view);

    // View Transitions safety: destroy on swap even if React cleanup races
    const handleSwap = () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        composeEditorViewRef.set(null);
        viewRef.current = null;
      }
    };
    document.addEventListener('astro:before-swap', handleSwap);

    return () => {
      document.removeEventListener('astro:before-swap', handleSwap);
      view.destroy();
      composeEditorViewRef.set(null);
      viewRef.current = null;
    };
  }, []); // Empty deps: create once, destroy on unmount

  return { containerRef, viewRef };
}
