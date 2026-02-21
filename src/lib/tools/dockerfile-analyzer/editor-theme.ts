import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { color, oneDarkTheme } from '@codemirror/theme-one-dark';

// Re-export oneDarkTheme (chrome only, no syntax highlighting)
export { oneDarkTheme };

/**
 * WCAG AA-compliant syntax highlighting based on oneDark.
 *
 * The original oneDark uses #7d8799 for comments, which only achieves 3.6:1
 * contrast on the #282c34 background (below the 4.5:1 WCAG AA requirement).
 * This override brightens comments to #9da5b4 (5.0:1 contrast ratio).
 */
export const a11ySyntaxHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: t.keyword, color: color.keyword },
    { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: color.name },
    { tag: [t.function(t.variableName), t.labelName], color: color.name },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: color.constant },
    { tag: [t.definition(t.name), t.separator], color: color.name },
    { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: color.number },
    { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: color.operator },
    { tag: [t.meta, t.comment], color: '#9da5b4' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.link, color: color.comment, textDecoration: 'underline' },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: color.name },
    { tag: [t.processingInstruction, t.string, t.inserted], color: color.string },
    { tag: t.invalid, color: color.invalid },
  ]),
);

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
  '.cm-lineNumbers .cm-gutterElement': {
    color: '#9da5b4',
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
