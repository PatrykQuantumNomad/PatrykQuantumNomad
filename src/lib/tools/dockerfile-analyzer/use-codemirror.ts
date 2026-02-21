import { useRef, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { StreamLanguage } from '@codemirror/language';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { lintGutter } from '@codemirror/lint';
import { editorTheme, oneDarkTheme, a11ySyntaxHighlighting } from './editor-theme';
import { highlightLineField } from './highlight-line';
import {
  editorViewRef,
  resultsStale,
  analysisResult,
} from '../../../stores/dockerfileAnalyzerStore';

interface UseCodeMirrorOptions {
  initialDoc: string;
}

/**
 * React hook that creates and manages a CodeMirror 6 EditorView lifecycle.
 *
 * Key design decisions:
 * - Empty deps array: EditorView is created once, destroyed on unmount.
 *   The onAnalyze callback is NOT in deps to avoid destroying/recreating the
 *   entire editor on every render. Callers should wrap changing callbacks in a ref.
 * - Double cleanup: React useEffect cleanup AND astro:before-swap listener
 *   ensure no orphaned EditorView instances during View Transitions navigation.
 * - lintGutter() included without linter(): enables gutter markers when
 *   setDiagnostics pushes diagnostics on-demand (EDIT-02 requires button-triggered only).
 */
export function useCodeMirror({ initialDoc }: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        basicSetup,
        StreamLanguage.define(dockerFile),
        lintGutter(),
        oneDarkTheme,
        a11ySyntaxHighlighting,
        editorTheme,
        highlightLineField,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': 'Dockerfile editor — paste or type your Dockerfile here',
        }),
        // Detect stale results: set flag when doc changes after analysis
        EditorView.updateListener.of((update) => {
          if (update.docChanged && analysisResult.get() !== null) {
            resultsStale.set(true);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    editorViewRef.set(view);

    // View Transitions safety: destroy on swap even if React cleanup races
    const handleSwap = () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        editorViewRef.set(null);
        viewRef.current = null;
      }
    };
    document.addEventListener('astro:before-swap', handleSwap);

    return () => {
      document.removeEventListener('astro:before-swap', handleSwap);
      view.destroy();
      editorViewRef.set(null);
      viewRef.current = null;
    };
  }, []); // Empty deps: create once, destroy on unmount

  return { containerRef, viewRef };
}
