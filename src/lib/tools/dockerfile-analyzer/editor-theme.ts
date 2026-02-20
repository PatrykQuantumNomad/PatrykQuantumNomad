import { EditorView } from '@codemirror/view';

// Custom overrides layered on top of oneDark to match the site's aesthetic.
// oneDark provides syntax token colors; this theme only overrides chrome/layout.
export const editorTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
    borderRadius: '8px',
    border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
  },
  '.cm-content': {
    padding: '12px 0',
  },
  '.cm-gutters': {
    borderRight: '1px solid rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '&.cm-focused': {
    outline: '2px solid var(--color-accent, #64ffda)',
    outlineOffset: '-1px',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
}, { dark: true });
