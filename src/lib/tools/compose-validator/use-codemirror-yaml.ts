import { useRef, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
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

const STORAGE_KEY = 'compose-editor-content';

interface UseCodeMirrorYamlOptions {
  initialDoc: string;
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
 *   setDiagnostics pushes diagnostics on-demand (EDIT-02 requires button-triggered only).
 * - localStorage persistence: auto-saves editor content on change (debounced 500ms).
 *   Priority: URL hash > localStorage > sample file.
 */
export function useCodeMirrorYaml({ initialDoc }: UseCodeMirrorYamlOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Restore from localStorage if no URL hash was provided
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const doc = saved?.trim() && !window.location.hash ? saved : initialDoc;

    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    const state = EditorState.create({
      doc,
      extensions: [
        basicSetup,
        yaml(),
        lintGutter(),
        oneDarkTheme,
        a11ySyntaxHighlighting,
        editorTheme,
        highlightLineField,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': 'Docker Compose editor — paste or type your docker-compose.yml here',
        }),
        // Detect stale results + persist to localStorage
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (composeResult.get() !== null) {
              composeResultsStale.set(true);
            }
            // Debounced localStorage save
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
              try {
                localStorage.setItem(STORAGE_KEY, update.state.doc.toString());
              } catch { /* quota exceeded — ignore */ }
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
      if (saveTimer) clearTimeout(saveTimer);
      document.removeEventListener('astro:before-swap', handleSwap);
      view.destroy();
      composeEditorViewRef.set(null);
      viewRef.current = null;
    };
  }, []); // Empty deps: create once, destroy on unmount

  return { containerRef, viewRef };
}
