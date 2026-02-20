# Phase 24: Results Display & Interaction - Research

**Researched:** 2026-02-20
**Domain:** React results UI components for CodeMirror 6 diagnostics visualization, SVG score gauge, category breakdown bars, violation list with click-to-navigate, and nanostore-driven state flow
**Confidence:** HIGH

## Summary

Phase 24 transforms the placeholder `ResultsPanel.tsx` into a rich results display driven by the `AnalysisResult` nanostore populated by Phase 23's rule engine and scorer. The phase has six distinct requirements spanning two concerns: (1) inline editor annotations (RESULT-01 -- squiggly underlines + gutter markers, which are already functionally working from Phase 22/23 setDiagnostics integration but need color customization), and (2) five new React UI components in the results panel (score gauge RESULT-02, category breakdown RESULT-03, violation list RESULT-04, click-to-navigate RESULT-05, empty state RESULT-06).

The data layer is already complete. Phase 23 populates `analysisResult` nanostore with `AnalysisResult` containing: `violations: LintViolation[]` (each with severity, category, title, explanation, fix with before/after code), `score: ScoreResult` (overall 0-100, grade A+ through F, per-category scores with weights), and metadata. The results panel already subscribes to this store via `useStore(analysisResult)`. Phase 24 replaces the "Parse successful" placeholder with actual result visualization.

The critical technical challenge is RESULT-05 (click-to-navigate): the ResultsPanel needs to scroll the CodeMirror editor to a specific line when a violation is clicked. Since EditorPanel and ResultsPanel are sibling components (not parent-child), the EditorView ref must be shared. The cleanest approach is storing the EditorView ref in a nanostore atom, which both siblings can access. EditorPanel sets it after creation; ResultsPanel reads it for `scrollIntoView` dispatch.

**Primary recommendation:** Build the results panel as four composable sub-components (ScoreGauge, CategoryBreakdown, ViolationList, EmptyState) inside the existing ResultsPanel.tsx. Share the EditorView via a nanostore atom for click-to-navigate. Customize lint gutter colors via EditorView.theme overrides in the existing editor-theme.ts.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RESULT-01 | Inline CodeMirror annotations (squiggly underlines + gutter severity markers) | Already functionally working from Phase 22/23. Research provides CSS class names for color customization: `.cm-lintRange-error`, `.cm-lintRange-warning`, `.cm-lintRange-info` for underlines; `.cm-lint-marker-error`, `.cm-lint-marker-warning`, `.cm-lint-marker-info` for gutter icons. Custom colors via EditorView.theme overlay. |
| RESULT-02 | Score gauge component (visual gauge with letter grade) | SVG circle gauge using stroke-dasharray/stroke-dashoffset technique. No external library needed. Pattern documented with code example. Grade color mapping provided. |
| RESULT-03 | Category breakdown panel with sub-scores per dimension | Horizontal bar components reading CategoryScore[] from ScoreResult. 5 bars (Security, Efficiency, Maintainability, Reliability, Best Practice) with percentage width and color-coded fills. |
| RESULT-04 | Violation list grouped by severity with expandable details | Native HTML details/summary elements for expand/collapse (zero JS, accessible by default). Group violations by severity (error, warning, info). Each item shows rule ID, message, line number. Expanded view shows explanation + fix suggestion with before/after code. |
| RESULT-05 | Click-to-navigate from results panel to corresponding editor line | EditorView ref shared via nanostore atom. Click handler dispatches `EditorView.scrollIntoView` + selection change + temporary line highlight decoration. Full pattern documented. |
| RESULT-06 | Clean Dockerfile empty state ("No issues found" with congratulatory message) | Conditional render when violations.length === 0 && parseSuccess. Show checkmark icon, "No issues found" heading, congratulatory subtext, and score gauge (100/A+). |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- NO new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `nanostores` | ^1.1.0 | Share EditorView ref and analysis results between EditorPanel and ResultsPanel | Already installed. Add one new atom for EditorView ref. |
| `@nanostores/react` | ^1.0.0 | React bindings for nanostore subscriptions | Already installed. `useStore()` hook used in ResultsPanel. |
| `@codemirror/view` | 6.39.15 | `EditorView.scrollIntoView()`, `Decoration.line()`, `StateEffect`, `StateField` for click-to-navigate and line highlight | Already installed via `codemirror` meta-package. |
| `@codemirror/state` | 6.5.4 | `StateEffect.define()`, `StateField.define()` for highlight decoration state | Already installed via `codemirror` meta-package. |
| `@codemirror/lint` | 6.9.4 | `setDiagnostics` already used; CSS classes for gutter/underline styling | Already installed. No API changes needed, only CSS customization. |
| `react` | ^19.2.4 | Component rendering | Already installed. |
| `tailwindcss` | ^3.4.19 | Layout and styling for all results components | Already installed. |

### No New Dependencies Required
This phase is pure React component work using existing libraries. No new npm packages needed. The score gauge is built with inline SVG (no charting library), violation list uses native HTML `<details>`/`<summary>` (no accordion library), and category bars use Tailwind width utilities.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline SVG gauge | `react-circular-progressbar` | Adds 8KB dependency for something achievable in ~40 lines of SVG. Not worth the bundle cost. |
| Native `<details>/<summary>` | Custom accordion with useState | `<details>` is accessible by default (keyboard, screen reader), zero JS, browser-native animation. Custom accordion requires ARIA attributes, focus management, and JS state. |
| Nanostore atom for EditorView | React Context | EditorPanel and ResultsPanel are siblings under DockerfileAnalyzer -- Context would work but requires wrapping. Nanostore is simpler: set in one component, read in another, no provider tree. |
| CSS `conic-gradient` gauge | SVG `stroke-dasharray` gauge | Both work. SVG approach is more flexible (can animate, add gradient, show arc instead of full circle), better for accessibility (text elements inside SVG), and is the industry standard pattern. |

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/tools/
    DockerfileAnalyzer.tsx        # Root grid -- UNCHANGED
    EditorPanel.tsx               # MODIFY: store EditorView ref in nanostore
    ResultsPanel.tsx              # REWRITE: compose sub-components
    results/
      ScoreGauge.tsx              # NEW: SVG circular gauge with score + grade
      CategoryBreakdown.tsx       # NEW: 5 horizontal bars for category sub-scores
      ViolationList.tsx           # NEW: grouped violations with expand/collapse
      EmptyState.tsx              # NEW: "No issues found" congratulatory state
  stores/
    dockerfileAnalyzerStore.ts    # MODIFY: add editorView atom
  lib/tools/dockerfile-analyzer/
    editor-theme.ts               # MODIFY: add severity color overrides for gutter markers
    use-codemirror.ts             # MODIFY: add highlight line extension, store view ref
```

### Pattern 1: Nanostore EditorView Ref Sharing
**What:** Store the CodeMirror EditorView instance in a nanostore atom so sibling components can access it.
**When to use:** Click-to-navigate (RESULT-05) needs ResultsPanel to dispatch commands to the editor.
**Example:**
```typescript
// stores/dockerfileAnalyzerStore.ts -- add to existing file
import type { EditorView } from '@codemirror/view';

/** EditorView ref -- set by EditorPanel, read by ResultsPanel for click-to-navigate */
export const editorViewRef = atom<EditorView | null>(null);
```

```typescript
// EditorPanel.tsx -- after EditorView creation
import { editorViewRef } from '../../stores/dockerfileAnalyzerStore';

// Inside useCodeMirror hook or after hook returns:
useEffect(() => {
  if (viewRef.current) {
    editorViewRef.set(viewRef.current);
  }
  return () => { editorViewRef.set(null); };
}, [viewRef.current]);
```

### Pattern 2: Click-to-Navigate with scrollIntoView
**What:** When user clicks a violation in ResultsPanel, scroll editor to that line, select it, and briefly highlight it.
**When to use:** RESULT-05 -- every violation row is clickable.
**Example:**
```typescript
// Source: @codemirror/view EditorView.scrollIntoView API
import { EditorView } from '@codemirror/view';

function scrollToLine(view: EditorView, lineNumber: number): void {
  // lineNumber is 1-based (matching violation.line)
  const line = view.state.doc.line(lineNumber);
  view.dispatch({
    selection: { anchor: line.from, head: line.to },
    effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
  });
  view.focus();
}
```

### Pattern 3: Temporary Line Highlight Decoration
**What:** Flash-highlight the target line for ~1.5s after click-to-navigate so the user can visually locate it.
**When to use:** After scrollToLine in RESULT-05.
**Example:**
```typescript
// Source: @codemirror/view Decoration.line + StateEffect pattern
import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';

const highlightLineEffect = StateEffect.define<{ line: number }>({
  map: (val, change) => ({ line: val.line }),
});
const clearHighlightEffect = StateEffect.define<null>();

const highlightLineField = StateField.define<DecorationSet>({
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

// Usage: dispatch highlight, then clear after timeout
function highlightAndScroll(view: EditorView, lineNumber: number): void {
  const line = view.state.doc.line(lineNumber);
  view.dispatch({
    selection: { anchor: line.from, head: line.to },
    effects: [
      EditorView.scrollIntoView(line.from, { y: 'center' }),
      highlightLineEffect.of({ line: lineNumber }),
    ],
  });
  view.focus();

  // Auto-clear highlight after 1.5s
  setTimeout(() => {
    view.dispatch({ effects: clearHighlightEffect.of(null) });
  }, 1500);
}
```

```css
/* In editor-theme.ts */
'.cm-highlight-line': {
  backgroundColor: 'rgba(100, 255, 218, 0.15)', /* accent-secondary tint */
  transition: 'background-color 0.3s ease',
}
```

### Pattern 4: SVG Score Gauge
**What:** Circular gauge rendered with SVG `<circle>` using stroke-dasharray/stroke-dashoffset.
**When to use:** RESULT-02 -- prominently displayed at top of results panel.
**Example:**
```typescript
// Source: Standard SVG gauge pattern
interface ScoreGaugeProps {
  score: number;  // 0-100
  grade: string;  // "A+" through "F"
  size?: number;  // px, default 120
}

function ScoreGauge({ score, grade, size = 120 }: ScoreGaugeProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const gradeColor = getGradeColor(grade);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Centered text overlay */}
      <div className="absolute flex flex-col items-center justify-center"
           style={{ width: size, height: size }}>
        <span className="text-2xl font-bold font-heading">{score}</span>
        <span className="text-sm font-semibold" style={{ color: gradeColor }}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e'; // green-500
  if (grade.startsWith('B')) return '#84cc16'; // lime-500
  if (grade.startsWith('C')) return '#eab308'; // yellow-500
  if (grade.startsWith('D')) return '#f97316'; // orange-500
  return '#ef4444'; // red-500 (F)
}
```

### Pattern 5: Category Breakdown Bars
**What:** Five horizontal bars showing per-category scores with colored fills proportional to 0-100 score.
**When to use:** RESULT-03 -- displayed below the score gauge.
**Example:**
```typescript
// Source: Tailwind utility-driven bar visualization
import type { CategoryScore } from '../../lib/tools/dockerfile-analyzer/types';

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  efficiency: 'Efficiency',
  maintainability: 'Maintainability',
  reliability: 'Reliability',
  'best-practice': 'Best Practice',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',      // red-500
  efficiency: '#3b82f6',    // blue-500
  maintainability: '#8b5cf6', // violet-500
  reliability: '#f59e0b',   // amber-500
  'best-practice': '#06b6d4', // cyan-500
};

function CategoryBar({ cat }: { cat: CategoryScore }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-right text-[var(--color-text-secondary)] truncate">
        {CATEGORY_LABELS[cat.category]}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${cat.score}%`,
            backgroundColor: CATEGORY_COLORS[cat.category],
          }}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs">
        {Math.round(cat.score)}
      </span>
    </div>
  );
}
```

### Pattern 6: Violation List with Native Details/Summary
**What:** Violations grouped by severity, each expandable to show explanation and fix.
**When to use:** RESULT-04 -- main interactive results list.
**Example:**
```typescript
// Source: Native HTML details/summary for accessibility
import type { LintViolation } from '../../lib/tools/dockerfile-analyzer/types';

function ViolationItem({
  violation,
  onNavigate,
}: {
  violation: LintViolation;
  onNavigate: (line: number) => void;
}) {
  return (
    <details className="group border-b border-white/10 last:border-0">
      <summary className="flex items-center gap-2 py-2 px-3 cursor-pointer
                          hover:bg-white/5 transition-colors list-none">
        <SeverityIcon severity={violation.severity} />
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">
          {violation.ruleId}
        </span>
        <span className="flex-1 text-sm truncate">{violation.message}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(violation.line); }}
          className="text-xs text-[var(--color-accent)] hover:underline"
          title={`Go to line ${violation.line}`}
        >
          L{violation.line}
        </button>
      </summary>
      <div className="px-3 pb-3 text-sm text-[var(--color-text-secondary)]">
        <p className="mb-2">{violation.explanation}</p>
        {violation.fix.beforeCode && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-red-400 text-xs">Before:</span>
              <pre className="bg-black/30 rounded p-2 mt-1 overflow-x-auto">
                {violation.fix.beforeCode}
              </pre>
            </div>
            <div>
              <span className="text-green-400 text-xs">After:</span>
              <pre className="bg-black/30 rounded p-2 mt-1 overflow-x-auto">
                {violation.fix.afterCode}
              </pre>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
```

### Pattern 7: Severity Grouping and Ordering
**What:** Group violations by severity (error first, then warning, then info) with group headers showing count.
**When to use:** RESULT-04 -- organize the violation list.
**Example:**
```typescript
const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };
const SEVERITY_LABELS: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
};

function groupBySeverity(violations: LintViolation[]): Map<string, LintViolation[]> {
  const groups = new Map<string, LintViolation[]>();
  for (const v of violations) {
    const group = groups.get(v.severity) ?? [];
    group.push(v);
    groups.set(v.severity, group);
  }
  // Sort groups by severity order
  return new Map(
    [...groups.entries()].sort(
      ([a], [b]) => (SEVERITY_ORDER[a] ?? 3) - (SEVERITY_ORDER[b] ?? 3)
    )
  );
}
```

### Anti-Patterns to Avoid
- **Importing EditorView directly in ResultsPanel:** Do not try to import or construct an EditorView in the results panel. Access the existing view instance through the nanostore atom. The editor owns its view; the results panel borrows it for navigation.
- **Re-rendering entire results on every keystroke:** The analysis only runs on explicit "Analyze" button click. The nanostore only updates after analysis. Do not subscribe to editor content changes in ResultsPanel.
- **Custom accordion with useState for expand/collapse:** The native HTML `<details>/<summary>` element provides expand/collapse with zero JavaScript, built-in keyboard accessibility (Enter/Space to toggle), and screen reader support. Do not re-implement this.
- **Absolute positioning the score gauge overlay:** Use CSS Grid or flexbox with relative positioning for the gauge text overlay, not absolute positioning relative to the page. The gauge is a self-contained component.
- **Dispatching scrollIntoView without checking view existence:** The EditorView ref in the nanostore may be null if the editor has been destroyed by View Transitions. Always null-check before dispatching.
- **Hardcoding severity colors in multiple places:** Define color mappings once in a shared constant. Both the violation list severity icons and the editor gutter markers should reference the same color scheme.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expand/collapse UI | Custom accordion with useState, ARIA attributes, focus management | Native HTML `<details>/<summary>` | Browser handles accessibility, keyboard navigation, and state. Zero JS. Styleable with CSS. |
| Circular progress gauge | Complex canvas drawing or importing a chart library | Inline SVG with `stroke-dasharray`/`stroke-dashoffset` | ~30 lines of SVG/JSX. No dependency. Animatable with CSS transitions. Well-documented pattern. |
| Editor line scrolling | Custom scroll calculation with offsetTop | `EditorView.scrollIntoView(pos, { y: 'center' })` | CodeMirror handles virtual scrolling, folded regions, and viewport management. |
| Line highlight decoration | Direct DOM manipulation on `.cm-line` elements | `Decoration.line()` with `StateEffect`/`StateField` | CodeMirror's decoration system survives document changes and view updates. Direct DOM changes get overwritten. |
| Severity color icons | Custom SVG per severity | Reusable SeverityIcon component with filled circle (red/amber/blue) | One component, three colors via prop. Consistent everywhere. |
| State sharing between siblings | React Context wrapping DockerfileAnalyzer, or lifting state to parent with callback props | Nanostore `atom<EditorView \| null>` | Already using nanostores for analysisResult. Same pattern. No provider tree needed. |

**Key insight:** Every non-trivial problem in this phase has a zero-dependency solution using browser-native APIs (SVG, `<details>`, CodeMirror built-in effects) or existing libraries already installed (nanostores, @codemirror/view). No new packages are needed.

## Common Pitfalls

### Pitfall 1: EditorView Destroyed by View Transitions Before Click Handler Runs
**What goes wrong:** User analyzes a Dockerfile, navigates away (triggering View Transition), then navigates back. The old EditorView was destroyed, a new one created, but the ResultsPanel still holds a reference to the old view. Dispatching `scrollIntoView` on a destroyed EditorView throws.
**Why it happens:** `astro:before-swap` destroys the EditorView. React re-mounts the component, creating a new view. But the nanostore atom may still hold the old reference during the transition.
**How to avoid:** (1) EditorPanel sets `editorViewRef.set(null)` in its cleanup. (2) The new EditorPanel sets `editorViewRef.set(newView)` on mount. (3) ResultsPanel always null-checks: `const view = editorViewRef.get(); if (!view) return;` before dispatching.
**Warning signs:** Uncaught errors on click-to-navigate after page navigation.

### Pitfall 2: Line Number Out of Range After Editor Content Changes
**What goes wrong:** User analyzes, gets results showing "line 28". Then edits the Dockerfile (deleting lines). Clicks the violation at "line 28" but the document now only has 20 lines. `view.state.doc.line(28)` throws RangeError.
**Why it happens:** Violations are snapshots from the last analysis. The document can change between analysis and click.
**How to avoid:** Clamp line numbers: `const safeLineNum = Math.min(violation.line, view.state.doc.lines);`. Also, show a visual indicator that results are stale after edits (e.g., dim the results panel or show "Results may be outdated -- re-analyze to refresh").
**Warning signs:** RangeError crash when clicking violations after editing.

### Pitfall 3: Lint Gutter Marker Colors Not Matching Design
**What goes wrong:** The default `lintGutter()` renders gutter markers with CodeMirror's built-in SVG icons and colors (pink circle for error, yellow triangle for warning, blue square for info). These may not match the site's design aesthetic.
**Why it happens:** `lintGutter()` applies `cm-lint-marker-error`, `cm-lint-marker-warning`, `cm-lint-marker-info` CSS classes with inline SVG via the `content` CSS property.
**How to avoid:** Override in `EditorView.theme()` within `editor-theme.ts`:
```typescript
'.cm-lint-marker-error': {
  content: svgDataUrl(/* custom red circle SVG */),
},
```
Or simply override colors:
```typescript
'.cm-lint-marker-error': { color: '#ef4444' },
'.cm-lint-marker-warning': { color: '#f59e0b' },
'.cm-lint-marker-info': { color: '#3b82f6' },
```
Note: the gutter markers use `content` property with SVG data URLs, NOT `color`. To change them, you must override the `content` property with a new SVG data URL, or replace them entirely with custom gutter markers.
**Warning signs:** Gutter icons look out of place with the site's color scheme.

### Pitfall 4: Score Gauge SVG Rotation Math Wrong
**What goes wrong:** The SVG gauge arc starts at the 3 o'clock position (SVG default) instead of 12 o'clock. The progress fills clockwise from the wrong starting point.
**Why it happens:** SVG circles start their stroke at 3 o'clock (0 degrees). To start at 12 o'clock, the entire SVG must be rotated -90 degrees.
**How to avoid:** Apply `className="transform -rotate-90"` to the SVG element (Tailwind) or `transform: rotate(-90deg)` in inline style. The text overlay must NOT be rotated -- it sits outside or layered on top of the SVG.
**Warning signs:** Gauge arc starts from the right side instead of the top.

### Pitfall 5: Details/Summary Default Arrow Interferes with Custom Layout
**What goes wrong:** The native `<details>/<summary>` element renders a disclosure triangle (arrow) by default. This conflicts with custom layout where you want a chevron or no arrow.
**Why it happens:** Browsers add a `::marker` pseudo-element to `<summary>`.
**How to avoid:** Add `list-none` Tailwind class to `<summary>` (sets `list-style: none`). On WebKit, also need `summary::-webkit-details-marker { display: none; }`. Add a custom chevron icon that rotates on `[open]` state: `group-open:rotate-90`.
**Warning signs:** Extra arrow icon alongside your custom expand/collapse indicator.

### Pitfall 6: Results Panel Height Overflows on Mobile
**What goes wrong:** With 20+ violations, the results panel becomes extremely tall, pushing the editor off-screen on mobile (stacked layout). Users cannot see both editor and results simultaneously.
**Why it happens:** The violation list has no max-height constraint.
**How to avoid:** Set a max-height with overflow-y-auto on the violation list container. On mobile (stacked), cap at ~400px. On desktop (side-by-side), let it fill the available height with flex-1 and overflow-auto. Use `max-h-[400px] lg:max-h-none lg:flex-1 overflow-y-auto`.
**Warning signs:** Page becomes very long on mobile after analysis with many violations.

## Code Examples

Verified patterns from installed packages and codebase:

### CodeMirror Lint CSS Classes (from @codemirror/lint 6.9.4 source)
```
Inline underlines (squiggly):
  .cm-lintRange                     -- base class on all diagnostic ranges
  .cm-lintRange-error               -- red squiggly (#d11)
  .cm-lintRange-warning             -- orange squiggly
  .cm-lintRange-info                -- gray squiggly (#999)
  .cm-lintRange-hint                -- blue squiggly (#66d)
  .cm-lintRange-active              -- yellow highlight on hover

Gutter markers:
  .cm-lint-marker                   -- base (1em x 1em)
  .cm-lint-marker-error             -- red circle SVG
  .cm-lint-marker-warning           -- yellow triangle SVG
  .cm-lint-marker-info              -- blue square SVG

Tooltip/Panel (not used -- we build our own results panel):
  .cm-diagnostic                    -- base class in lint panel
  .cm-diagnostic-error              -- red left border
  .cm-diagnostic-warning            -- orange left border
  .cm-diagnostic-info               -- gray left border
```

### EditorView.scrollIntoView API (from @codemirror/view 6.39.15)
```typescript
// Signature:
static scrollIntoView(
  pos: number | SelectionRange,
  options?: {
    y?: 'nearest' | 'start' | 'end' | 'center';
    x?: 'nearest' | 'start' | 'end' | 'center';
    yMargin?: number;  // pixels of margin
    xMargin?: number;
  }
): StateEffect<unknown>

// Usage -- scroll to center of viewport:
view.dispatch({
  effects: EditorView.scrollIntoView(linePos, { y: 'center' }),
});
```

### Customizing Gutter Marker Colors in editor-theme.ts
```typescript
// Source: @codemirror/lint source code -- gutter markers use SVG data URLs
// The default markers are set via CSS `content` property with inline SVG.
// To customize, override in EditorView.theme():

function lintMarkerSvg(content: string): string {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${encodeURIComponent(content)}</svg>')`;
}

// In editorTheme:
export const editorTheme = EditorView.theme({
  // ... existing overrides ...
  '.cm-lint-marker-error': {
    content: lintMarkerSvg(
      '<circle cx="20" cy="20" r="15" fill="%23ef4444" stroke="%23dc2626" stroke-width="4"/>'
    ),
  },
  '.cm-lint-marker-warning': {
    content: lintMarkerSvg(
      '<path fill="%23f59e0b" stroke="%23d97706" stroke-width="4" stroke-linejoin="round" d="M20 6L37 35L3 35Z"/>'
    ),
  },
  '.cm-lint-marker-info': {
    content: lintMarkerSvg(
      '<rect x="5" y="5" width="30" height="30" rx="4" fill="%233b82f6" stroke="%232563eb" stroke-width="4"/>'
    ),
  },
}, { dark: true });
```

### Nanostore Integration for EditorView Ref
```typescript
// stores/dockerfileAnalyzerStore.ts -- additions to existing file
import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { AnalysisResult } from '../lib/tools/dockerfile-analyzer/types';

export const analysisResult = atom<AnalysisResult | null>(null);
export const isAnalyzing = atom<boolean>(false);

// NEW: EditorView ref for cross-component communication
export const editorViewRef = atom<EditorView | null>(null);
```

### Severity Icon Component
```typescript
function SeverityIcon({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  const colors: Record<string, string> = {
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: colors[severity] }}
      aria-label={severity}
    />
  );
}
```

### Empty State Component
```typescript
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-heading font-semibold mb-1">No Issues Found</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
        This Dockerfile follows best practices. Well done!
      </p>
    </div>
  );
}
```

### Stale Results Indicator
```typescript
// When the editor content changes after analysis, dim the results
// to indicate they may be outdated.
// Use a nanostore flag set by EditorPanel's doc change listener.
export const resultsStale = atom<boolean>(false);

// In use-codemirror.ts -- listen for doc changes after analysis
EditorView.updateListener.of((update) => {
  if (update.docChanged && analysisResult.get() !== null) {
    resultsStale.set(true);
  }
});

// In ResultsPanel -- apply opacity when stale
const stale = useStore(resultsStale);
// Wrapper div: className={stale ? 'opacity-60' : ''}
// Show banner: "Results may be outdated -- re-analyze to refresh"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single flat violation list | Grouped by severity with expand/collapse | UX standard 2023+ | Users can scan quickly by severity, drill into details on demand |
| Text-only score display | Visual gauge with color-coded arc | Industry standard | Score is immediately scannable without reading numbers |
| Separate editor and results with no connection | Click-to-navigate from results to editor line | IDE-standard UX | Users can verify each finding in context with one click |
| Library-dependent charts (Chart.js, D3) | Inline SVG with CSS transitions | Trend 2024+ | Zero-dependency, smaller bundle, fully customizable |
| Custom JavaScript accordions | Native `<details>/<summary>` | HTML5.1 baseline | Zero JS, accessible by default, widely supported |
| `linter()` auto-lint on keystroke | `setDiagnostics` on-demand with button trigger | Existing design decision | User controls analysis timing; no CPU waste on incomplete edits |

## Open Questions

1. **Stale results UX after editing**
   - What we know: After analysis, the user may edit the Dockerfile. Results become stale (line numbers may not match).
   - What's unclear: Whether to dim results, show a banner, auto-clear results, or just leave them.
   - Recommendation: Dim results with opacity and show a subtle "Re-analyze to refresh" message. Do NOT auto-clear (user may want to reference results while editing). Do NOT auto-re-analyze (violates EDIT-02 on-demand principle).

2. **Score gauge animation on first load**
   - What we know: CSS transition on `stroke-dashoffset` will animate the gauge filling when the value changes from 0 to the score.
   - What's unclear: Whether the initial animation should happen or if the gauge should appear "pre-filled."
   - Recommendation: Animate from 0 to score on first analysis. Use `transition: stroke-dashoffset 0.6s ease` for smooth fill. Subsequent re-analyses animate from old score to new score naturally.

3. **Mobile layout for results sub-components**
   - What we know: On mobile, editor and results stack vertically. Results panel needs to show score gauge, categories, and violations in a scrollable area.
   - What's unclear: Optimal ordering of sub-components on mobile.
   - Recommendation: Score gauge (compact) at top, category bars below, then violation list. Keep gauge small on mobile (80px instead of 120px). Use responsive sizing: `size={isMobile ? 80 : 120}` or Tailwind responsive classes.

4. **Highlight line extension registration**
   - What we know: The `highlightLineField` StateField must be registered as an extension when the EditorView is created (in `use-codemirror.ts`).
   - What's unclear: Whether to define it in `use-codemirror.ts` or a separate file.
   - Recommendation: Define in a new file `highlight-line.ts` alongside `editor-theme.ts` and export the extension + the `highlightAndScroll` function. Import the extension in `use-codemirror.ts` and the function in `ResultsPanel.tsx`.

## Sources

### Primary (HIGH confidence)
- `@codemirror/lint` v6.9.4 -- TypeScript definitions (`node_modules/@codemirror/lint/dist/index.d.ts`) and source code (`index.js`) for Diagnostic interface, setDiagnostics API, CSS class names (cm-lintRange-*, cm-lint-marker-*), lintGutter SVG data URLs
- `@codemirror/view` v6.39.15 -- TypeScript definitions for `EditorView.scrollIntoView` signature, `Decoration.line`, `StateEffect`, `StateField` for decoration management
- `@codemirror/state` v6.5.4 -- TypeScript definitions for `StateEffect.define`, `StateField.define`
- Existing codebase: `EditorPanel.tsx`, `ResultsPanel.tsx`, `DockerfileAnalyzer.tsx`, `use-codemirror.ts`, `editor-theme.ts`, `dockerfileAnalyzerStore.ts`, `types.ts` -- all read directly
- Phase 22 RESEARCH.md and Phase 23 RESEARCH.md -- architecture decisions, nanostore bridge pattern, setDiagnostics pattern

### Secondary (MEDIUM confidence)
- [CodeMirror Decoration Examples](https://codemirror.net/examples/decoration/) -- Decoration.line pattern with StateEffect/StateField
- [CodeMirror Lint Examples](https://codemirror.net/examples/lint/) -- setDiagnostics usage
- [CodeMirror Discuss: Highlight Line Function](https://discuss.codemirror.net/t/highlight-line-function/4627) -- community patterns for line highlighting
- [CodeMirror Discuss: Scroll to Line](https://discuss.codemirror.net/t/how-to-scroll-textarea-programmatically/6091) -- scrollIntoView usage patterns
- [Can I Use: conic-gradient](https://caniuse.com/css-conic-gradients) -- 92/100 browser compatibility score (confirmed for gauge approach decision)
- [SVG Gauge Component Guide](https://www.fullstack.com/labs/resources/blog/creating-an-svg-gauge-component-from-scratch) -- stroke-dasharray/strokeDashoffset technique
- [LogRocket: SVG Circular Progress](https://blog.logrocket.com/build-svg-circular-progress-component-react-hooks/) -- React hooks implementation pattern
- [Nanostores GitHub](https://github.com/nanostores/nanostores) -- atom API for EditorView ref sharing
- [Astro: Share State Between Islands](https://docs.astro.build/en/recipes/sharing-state-islands/) -- nanostore pattern for Astro islands

### Tertiary (LOW confidence)
- Mobile layout recommendations -- based on general UX best practices, not tested in this specific codebase. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all APIs verified from installed type definitions
- RESULT-01 (inline annotations): HIGH -- already working; CSS class names verified from lint source code
- RESULT-02 (score gauge): HIGH -- SVG stroke-dasharray is a well-documented, standard technique
- RESULT-03 (category breakdown): HIGH -- straightforward Tailwind bar components reading from existing data structure
- RESULT-04 (violation list): HIGH -- native `<details>/<summary>` with existing LintViolation data
- RESULT-05 (click-to-navigate): HIGH -- EditorView.scrollIntoView API verified from type definitions; Decoration.line pattern verified from official examples
- RESULT-06 (empty state): HIGH -- simple conditional render, zero technical risk
- Architecture (nanostore EditorView sharing): HIGH -- same pattern already used for analysisResult
- Pitfalls: MEDIUM -- stale results UX and mobile layout are design decisions that need validation

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days -- all APIs are stable, no fast-moving dependencies)
