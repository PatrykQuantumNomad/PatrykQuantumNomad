import { useRef, useEffect } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { StreamLanguage } from '@codemirror/language';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { lintGutter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';
import { editorTheme } from './editor-theme';

interface UseCodeMirrorOptions {
  initialDoc: string;
  onAnalyze: (view: EditorView) => void;
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
export function useCodeMirror({ initialDoc, onAnalyze }: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const analyzeKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: (view) => {
          onAnalyze(view);
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        basicSetup,
        StreamLanguage.define(dockerFile),
        lintGutter(),
        analyzeKeymap,
        oneDark,
        editorTheme,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // View Transitions safety: destroy on swap even if React cleanup races
    const handleSwap = () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
    document.addEventListener('astro:before-swap', handleSwap);

    return () => {
      document.removeEventListener('astro:before-swap', handleSwap);
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Empty deps: create once, destroy on unmount

  return { containerRef, viewRef };
}
