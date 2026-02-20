import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';

/** Effect dispatched to highlight a specific line */
export const highlightLineEffect = StateEffect.define<{ line: number }>({
  map: (val) => ({ line: val.line }),
});

/** Effect dispatched to clear the highlight */
export const clearHighlightEffect = StateEffect.define<null>();

/**
 * StateField that manages the `.cm-highlight-line` decoration.
 * On highlightLineEffect: applies a line decoration at the target line.
 * On clearHighlightEffect: removes all highlight decorations.
 * Maps decorations through document changes.
 */
export const highlightLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    highlights = highlights.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(highlightLineEffect)) {
        const lineStart = tr.state.doc.line(e.value.line).from;
        highlights = Decoration.set([
          Decoration.line({ class: 'cm-highlight-line' }).range(lineStart),
        ]);
      }
      if (e.is(clearHighlightEffect)) {
        highlights = Decoration.none;
      }
    }
    return highlights;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * Scroll to a line, select it, flash-highlight it, and focus the editor.
 * Clamps lineNumber to doc.lines to handle stale results safely.
 * Auto-clears the highlight after 1500ms.
 */
export function highlightAndScroll(
  view: EditorView,
  lineNumber: number,
): void {
  const safeLine = Math.min(lineNumber, view.state.doc.lines);
  const line = view.state.doc.line(safeLine);

  view.dispatch({
    selection: { anchor: line.from, head: line.to },
    effects: [
      EditorView.scrollIntoView(line.from, { y: 'center' }),
      highlightLineEffect.of({ line: safeLine }),
    ],
  });

  view.focus();

  // Auto-clear highlight after 1.5s
  setTimeout(() => {
    view.dispatch({ effects: clearHighlightEffect.of(null) });
  }, 1500);
}
