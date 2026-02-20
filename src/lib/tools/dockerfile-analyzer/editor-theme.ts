import { EditorView } from '@codemirror/view';

// Generate SVG data URLs for custom gutter marker icons
function lintMarkerSvg(content: string): string {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${encodeURIComponent(content)}</svg>')`;
}

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

  // Severity-colored gutter markers (red circle, amber triangle, blue square)
  '.cm-lint-marker-error': {
    content: lintMarkerSvg(
      '<circle cx="20" cy="20" r="15" fill="%23ef4444" stroke="%23dc2626" stroke-width="4"/>',
    ),
  },
  '.cm-lint-marker-warning': {
    content: lintMarkerSvg(
      '<path fill="%23f59e0b" stroke="%23d97706" stroke-width="4" stroke-linejoin="round" d="M20 6L37 35L3 35Z"/>',
    ),
  },
  '.cm-lint-marker-info': {
    content: lintMarkerSvg(
      '<rect x="5" y="5" width="30" height="30" rx="4" fill="%233b82f6" stroke="%232563eb" stroke-width="4"/>',
    ),
  },

  // Severity-colored squiggly underlines
  '.cm-lintRange-error': {
    textDecoration: 'underline wavy #ef4444',
  },
  '.cm-lintRange-warning': {
    textDecoration: 'underline wavy #f59e0b',
  },
  '.cm-lintRange-info': {
    textDecoration: 'underline wavy #3b82f6',
  },

  // Click-to-navigate flash highlight (accent-secondary tint)
  '.cm-highlight-line': {
    backgroundColor: 'rgba(100, 255, 218, 0.15)',
  },
}, { dark: true });
