# Phase 78: Scoring, Editor, and Results Panel - Research

**Researched:** 2026-03-04
**Domain:** Category-weighted scoring engine, CodeMirror 6 YAML editor integration, React results panel with inline annotations
**Confidence:** HIGH

## Summary

Phase 78 is the first user-facing phase of the GitHub Actions Workflow Validator. It builds three interconnected systems: (1) a category-weighted scoring engine that computes per-category sub-scores and an overall 0-100 score with letter grade, (2) a CodeMirror 6 YAML editor with syntax highlighting, inline squiggly underlines, gutter severity markers, and keyboard shortcuts, and (3) a tabbed React results panel with an SVG score gauge, category breakdown bars, and an expandable violation list with click-to-navigate.

The project already has proven patterns for all three systems from the Dockerfile Analyzer (Phase 22-27) and K8s Analyzer (Phase 41-47). The scoring engine follows the `computeScore()` pattern from `src/lib/tools/dockerfile-analyzer/scorer.ts` with diminishing-returns deductions. The editor uses the `useCodeMirror` hook pattern with `setDiagnostics` for on-demand (button-triggered) linting. The results panel follows the `K8sResultsPanel.tsx` tabbed pattern with ScoreGauge, CategoryBreakdown, and ViolationList components. The key difference from existing tools is the **two-pass asynchronous architecture**: Pass 1 results display immediately while the WASM Worker runs Pass 2, then results merge seamlessly.

The GHA validator has unique complexity because it must orchestrate: (a) synchronous Pass 1 (schema + 22 custom rules), (b) asynchronous Pass 2 (actionlint WASM via Web Worker), (c) progressive result display (Pass 1 results shown immediately, Pass 2 results merged in), and (d) inline CodeMirror annotations that update when Pass 2 completes. The existing `ghaValidatorStore.ts` already has atoms for WASM state and violations. The existing `engine.ts` already has `runPass1()` and `mergePass2()`. The existing `worker-client.ts` already has the typed Worker wrapper. The implementation needs to wire these together in a React component with the established UI patterns.

**Primary recommendation:** Build 4 plans across 3 waves: (Wave 1) scoring engine + GHA types, (Wave 2) CodeMirror editor panel with two-pass orchestration, (Wave 3) results panel + empty state. Reuse existing shared components (ScoreGauge, highlight-line, editor-theme) from the Dockerfile Analyzer directly.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCORE-01 | Category-weighted scoring: Schema 15%, Security 35%, Semantic 20%, Best Practice 20%, Style 10% | Follow `scorer.ts` pattern from Dockerfile Analyzer. New CATEGORY_WEIGHTS map with 5 GHA categories. The `actionlint` category (GA-L017/L018, unavailable in browser) gets 0% weight and is excluded from scoring. |
| SCORE-02 | Overall 0-100 score with letter grade (A+ through F) using diminishing-returns formula | Reuse identical `computeGrade()` function and diminishing-returns formula from `scorer.ts`: `points = basePoints / (1 + 0.3 * priorCount)`. Already proven in 3 other tools. |
| SCORE-03 | Per-category sub-scores alongside aggregate score | CategoryScore interface with `{ category, score, weight, deductions }` per category. Weighted aggregate: `sum(categoryScore * weight/100)`. Direct port from Dockerfile Analyzer pattern. |
| SCORE-04 | Score gauge component (SVG circular gauge with letter grade) | Reuse existing `ScoreGauge.tsx` from `src/components/tools/results/ScoreGauge.tsx` directly -- it accepts generic `{ score, grade, size }` props. Already shared across Dockerfile and K8s analyzers. |
| UI-01 | CodeMirror 6 YAML editor with syntax highlighting and line numbers | Use `@codemirror/lang-yaml` (^6.1.2, already installed) instead of `StreamLanguage.define(dockerFile)`. Reuse `use-codemirror.ts` hook pattern with YAML language swap. Reuse editor-theme.ts for consistent look. |
| UI-02 | Analyze button triggers validation cycle (Cmd/Ctrl+Enter shortcut) | Follow EditorPanel.tsx button pattern. Add `keymap.of([{ key: 'Mod-Enter', run: () => { analyze(); return true; } }])` to CodeMirror extensions for Cmd/Ctrl+Enter. |
| UI-03 | Pre-loaded sample workflow with deliberate issues across all rule categories | `SAMPLE_GHA_WORKFLOW` in `sample-workflow.ts` already exists with violations from security, best-practice, and style categories. Verified: covers GA-C001, GA-C008, GA-B001, GA-B002, GA-B003, GA-F001, GA-F004. |
| UI-04 | Inline CodeMirror annotations (squiggly underlines + gutter severity markers) | Use `setDiagnostics()` from `@codemirror/lint` (same as Dockerfile Analyzer pattern). Include `lintGutter()` in extensions. Diagnostics update twice: after Pass 1 (immediate) and after Pass 2 merge. Editor-theme.ts already defines `.cm-lintRange-*` and `.cm-lint-marker-*` styles. |
| UI-05 | Tabbed results panel with score gauge, category breakdown, and violation list | Follow K8sResultsPanel.tsx tabbed pattern with Results/Graph tabs (Graph tab placeholder for Phase 79). ScoreGauge, CategoryBreakdown reusable. GHA-specific ViolationList groups by category (requirement UI-07). |
| UI-06 | Click-to-navigate from results panel to corresponding editor line | Reuse `highlightAndScroll()` from `src/lib/tools/dockerfile-analyzer/highlight-line.ts` directly. Already handles line clamping, scroll-into-view, flash highlight, and auto-clear. |
| UI-07 | Violation list grouped by category with expandable details and rule ID links | New GhaViolationList component. Unlike Dockerfile ViolationList (groups by severity), GHA groups by category per requirements. Each item expandable with explanation + before/after code. Rule ID links to `/tools/gha-validator/rules/{code}/` (future Phase 80 pages). |
| UI-08 | Clean workflow empty state ("No issues found" with congratulatory message) | New GhaEmptyState component following EmptyState.tsx pattern. Message: "No issues found" with GHA-specific congratulatory text. Include ScoreGauge showing perfect score. |
| UI-09 | Responsive layout -- stacked on mobile, side-by-side on desktop | Follow DockerfileAnalyzer.tsx grid pattern: `grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6`. Fullscreen toggle on each panel. |
| UI-10 | React island with `client:only="react"` directive | Follow existing Astro page pattern from `tools/dockerfile-analyzer/index.astro`. Single `<GhaValidator client:only="react" />` component that contains both editor and results panels. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @codemirror/lang-yaml | ^6.1.2 | YAML syntax highlighting and language support for CM6 | Already installed; native Lezer-based YAML parser |
| codemirror | ^6.0.2 | CodeMirror 6 basic setup (line numbers, bracket matching, etc.) | Already installed; `basicSetup` bundle |
| @codemirror/lint | (via codemirror) | `setDiagnostics`, `lintGutter` for inline annotations | Already installed; proven in 3 other tool editors |
| @codemirror/view | (via codemirror) | `EditorView`, `keymap` for Cmd+Enter binding | Already installed |
| @codemirror/state | (via codemirror) | `EditorState`, `StateEffect`, `StateField` | Already installed |
| @codemirror/theme-one-dark | ^6.1.3 | Dark theme for editor chrome | Already installed |
| nanostores | ^1.1.0 | State management bridging engine to React UI | Already installed; used for all tools |
| @nanostores/react | ^1.0.0 | React bindings (`useStore`) for nanostores | Already installed |
| react | ^19.2.4 | React 19 for UI components | Already installed |
| yaml | ^2.8.2 | YAML parsing for the engine (already used by parser.ts) | Already installed |
| vitest | ^4.0.18 | Testing for scorer and integration | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @lezer/highlight | (via @codemirror/language) | Syntax highlighting tags | Already installed via codemirror |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing Dockerfile editor-theme.ts | New GHA-specific theme | Unnecessary duplication; existing theme has all needed styles (gutter markers, squiggly underlines, highlight line) |
| New ScoreGauge for GHA | Reuse existing ScoreGauge.tsx | ScoreGauge is already generic (takes score, grade, size). No GHA-specific logic needed. |
| grouping violations by severity (like Dockerfile) | Grouping by category (per UI-07) | Requirements explicitly state "grouped by category" -- different from existing tools but straightforward to implement |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/tools/gha-validator/
    scorer.ts                          # NEW: Category-weighted scoring engine (SCORE-01/02/03)
    types.ts                           # UPDATED: Add GhaScoreResult, GhaCategoryScore, etc.
    engine.ts                          # EXISTING: runPass1(), mergePass2() (no changes)
    parser.ts                          # EXISTING: parseGhaWorkflow() (no changes)
    sample-workflow.ts                 # EXISTING: SAMPLE_GHA_WORKFLOW (no changes)
    worker/
      worker-client.ts                 # EXISTING: createActionlintWorker() (no changes)
      actionlint-worker.ts             # EXISTING: Worker implementation (no changes)
    rules/
      index.ts                         # EXISTING: allGhaRules, getGhaRuleById (no changes)
  stores/
    ghaValidatorStore.ts               # UPDATED: Add analysis result, editor ref, stale flag atoms
  components/tools/
    GhaValidator.tsx                    # NEW: Top-level React island (like DockerfileAnalyzer.tsx)
    GhaEditorPanel.tsx                  # NEW: CodeMirror YAML editor with two-pass orchestration
    GhaResultsPanel.tsx                # NEW: Tabbed results with score, categories, violations
    gha-results/
      GhaViolationList.tsx             # NEW: Category-grouped expandable violation list
      GhaEmptyState.tsx                # NEW: "No issues found" congratulatory state
      GhaCategoryBreakdown.tsx         # NEW: GHA-specific category labels/colors/weights
    results/
      ScoreGauge.tsx                   # EXISTING: Reuse directly (already generic)
      FullscreenToggle.tsx             # EXISTING: Reuse directly
  lib/tools/gha-validator/
    use-codemirror-yaml.ts             # NEW: CodeMirror hook for YAML (based on use-codemirror.ts)
    __tests__/
      scorer.test.ts                   # NEW: Scorer unit tests
```

### Pattern 1: Two-Pass Orchestration in Editor Panel
**What:** The GHA editor orchestrates Pass 1 (synchronous) and Pass 2 (async WASM Worker) with progressive result display.
**When to use:** When the analyze button is clicked or Cmd/Ctrl+Enter is pressed.
**Example:**
```typescript
// Based on existing EditorPanel.tsx pattern + existing engine.ts API
import { runPass1, mergePass2 } from '../../lib/tools/gha-validator/engine';
import { allGhaRules } from '../../lib/tools/gha-validator/rules';
import { createActionlintWorker } from '../../lib/tools/gha-validator/worker/worker-client';
import { computeGhaScore } from '../../lib/tools/gha-validator/scorer';
import { setDiagnostics } from '@codemirror/lint';

function analyze(view: EditorView) {
  const yaml = view.state.doc.toString();

  // Pass 1: Immediate (synchronous)
  const pass1 = runPass1(yaml, allGhaRules);
  const pass1Score = computeGhaScore(pass1.violations);
  ghaResult.set({ violations: pass1.violations, score: pass1Score, pass: 1 });
  view.dispatch(setDiagnostics(view.state, toDiagnostics(view, pass1.violations)));

  // Pass 2: Async (WASM Worker)
  const worker = createActionlintWorker({
    onReady: () => worker.analyze(yaml),
    onResult: (errors) => {
      const merged = mergePass2(pass1.violations, errors);
      const mergedScore = computeGhaScore(merged.violations);
      ghaResult.set({ violations: merged.violations, score: mergedScore, pass: 2 });
      view.dispatch(setDiagnostics(view.state, toDiagnostics(view, merged.violations)));
    },
    onError: (msg) => { /* handle error */ },
    onProgress: (p) => { ghaWasmProgress.set(p); },
  });
}
```

### Pattern 2: Violation-to-Diagnostic Conversion
**What:** Convert `GhaUnifiedViolation[]` to CodeMirror `Diagnostic[]` for inline annotations.
**When to use:** Every time violations are updated (after Pass 1 and after Pass 2 merge).
**Example:**
```typescript
// Based on EditorPanel.tsx lines 47-63 pattern
import type { Diagnostic } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import type { GhaUnifiedViolation } from './types';

function toDiagnostics(view: EditorView, violations: GhaUnifiedViolation[]): Diagnostic[] {
  return violations.map((v) => {
    const line = view.state.doc.line(Math.min(v.line, view.state.doc.lines));
    return {
      from: line.from + Math.max(0, (v.column ?? 1) - 1),
      to: v.endLine
        ? view.state.doc.line(Math.min(v.endLine, view.state.doc.lines)).to
        : line.to,
      severity: v.severity,
      message: `[${v.ruleId}] ${v.message}`,
      source: 'gha-validator',
    };
  });
}
```

### Pattern 3: Reusing Shared Components
**What:** ScoreGauge, highlightAndScroll, highlightLineField, editorTheme are already generic.
**When to use:** All GHA UI components should import from existing paths -- do NOT duplicate.
**Example:**
```typescript
// ScoreGauge -- already generic, reuse directly
import { ScoreGauge } from './results/ScoreGauge';
<ScoreGauge score={result.score.overall} grade={result.score.grade} size={80} />

// highlightAndScroll -- already generic, reuse directly
import { highlightAndScroll } from '../../lib/tools/dockerfile-analyzer/highlight-line';
const handleNavigate = (line: number) => {
  const view = ghaEditorViewRef.get();
  if (view) highlightAndScroll(view, line);
};

// highlightLineField -- already generic, reuse directly
import { highlightLineField } from '../../lib/tools/dockerfile-analyzer/highlight-line';
// Include in CM6 extensions array

// editorTheme -- already generic, reuse directly
import { editorTheme, oneDarkTheme, a11ySyntaxHighlighting } from
  '../../lib/tools/dockerfile-analyzer/editor-theme';
```

### Pattern 4: Worker Lifecycle Management
**What:** The WASM Worker must be created once and reused for subsequent analyses, not re-created each time.
**When to use:** The GhaEditorPanel must manage Worker lifecycle across multiple analyze clicks.
**Example:**
```typescript
// Create Worker once on first analyze, reuse for subsequent calls
const workerRef = useRef<ReturnType<typeof createActionlintWorker> | null>(null);
const wasmReadyRef = useRef(false);

function analyze(view: EditorView) {
  // Pass 1 always runs immediately
  const pass1 = runPass1(yaml, allGhaRules);
  // ...display pass1 results...

  if (!workerRef.current) {
    // First time: create Worker, wait for ready
    workerRef.current = createActionlintWorker({
      onReady: () => {
        wasmReadyRef.current = true;
        workerRef.current!.analyze(yaml);
      },
      onResult: (errors) => { /* merge results */ },
      onError, onProgress,
    });
  } else if (wasmReadyRef.current) {
    // Subsequent: Worker already ready, just send
    workerRef.current.analyze(yaml);
  }
  // else: Worker is loading, will analyze when ready
}
```

### Anti-Patterns to Avoid
- **Creating new Worker per analyze click:** Workers are expensive to create. The existing `createActionlintWorker` pattern creates a single Worker instance. Store in a ref and reuse it.
- **Blocking on WASM before showing results:** The entire point of the two-pass architecture is that Pass 1 results display immediately. Never `await` WASM before updating the UI.
- **Duplicating ScoreGauge/editor-theme/highlight-line:** These are already generic shared components. Import from existing paths, do NOT copy-paste into `gha-results/`.
- **Using `linter()` instead of `setDiagnostics()`:** The `linter()` function creates auto-triggered linting. Requirements specify button-triggered only (UI-02). Use `setDiagnostics()` for on-demand diagnostic pushing.
- **Forgetting to update diagnostics after Pass 2:** When Pass 2 results merge in, both the nanostore AND the CodeMirror diagnostics must be updated. Missing the CM dispatch leaves the editor out of sync with the results panel.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG circular score gauge | Custom SVG gauge component | Existing `ScoreGauge.tsx` | Already handles animated numbers, grade colors, accessibility, responsive sizing |
| Line highlight + scroll | Custom scroll/highlight logic | Existing `highlightAndScroll()` | Already handles line clamping, centering, flash highlight, auto-clear after 1.5s |
| Editor chrome theme | New theme for GHA editor | Existing `editor-theme.ts` | Already has gutter markers, squiggly underlines, highlight line, dark mode, WCAG AA compliance |
| Diminishing returns scoring | Custom scoring algorithm | Port `scorer.ts` formula | `points = basePoints / (1 + 0.3 * priorCount)` is proven across 3 tools |
| WASM Worker communication | Custom postMessage protocol | Existing `worker-client.ts` | Already has typed message protocol, error handling, progress reporting |
| State management | React Context or Redux | Existing nanostores atoms | Project-wide pattern; bridging engine to React UI without coupling |

**Key insight:** Phase 78 is primarily an **integration and UI layer**. All foundational infrastructure (engine, worker, parser, rules, rule registry, WASM binary, store atoms) was built in Phases 75-77. The scoring engine is the only genuinely new algorithm, and it is a straightforward port of the Dockerfile Analyzer's proven formula.

## Common Pitfalls

### Pitfall 1: Race Condition Between Pass 1 and Pass 2 Diagnostics
**What goes wrong:** User clicks Analyze, Pass 1 diagnostics appear. Then Pass 2 completes and calls `setDiagnostics` -- but the user has edited the document between Pass 1 and Pass 2 completion. The diagnostics reference stale line positions.
**Why it happens:** WASM loading takes 1-3 seconds. User can type during that time.
**How to avoid:** Track a "generation" counter. Increment on each analyze click. When Pass 2 completes, check if generation matches. If user has edited since analyze, mark results stale (like existing `resultsStale` pattern) instead of pushing stale diagnostics.
**Warning signs:** Squiggly underlines appearing on wrong lines after editing.

### Pitfall 2: Worker Not Ready on First Analyze
**What goes wrong:** User clicks Analyze immediately. Worker is still downloading WASM binary. Pass 2 silently fails or produces no results.
**Why it happens:** WASM binary is ~9.4MB (~3MB gzipped). First load takes 1-3 seconds even on fast connections.
**How to avoid:** Use the existing `ghaWasmLoading` / `ghaWasmReady` / `ghaWasmProgress` atoms to show a progress indicator while WASM loads. Queue the analyze request and execute when `onReady` fires. The Worker lifecycle pattern (Pattern 4 above) handles this.
**Warning signs:** First analysis shows only Pass 1 results with no actionlint findings.

### Pitfall 3: Category Weight Mismatch with GhaCategory Type
**What goes wrong:** The `GhaCategory` type includes `'actionlint'` (for GA-L017 shellcheck, GA-L018 pyflakes). But SCORE-01 only specifies 5 categories. Scorer crashes or produces wrong weights.
**Why it happens:** GA-L017 and GA-L018 are unavailable in browser WASM and will never fire. But the fallback mapping (GA-L000 for unknown kinds) also uses `'actionlint'` category.
**How to avoid:** The scorer should handle `'actionlint'` category violations by mapping them to `'semantic'` for scoring purposes, or simply excluding them from deductions (they have 0% weight). Document this mapping clearly.
**Warning signs:** Score doesn't sum to correct weighted total; unknown violations crash the scorer.

### Pitfall 4: CodeMirror Extensions Order Matters
**What goes wrong:** `lintGutter()` must be in extensions for gutter markers to appear. `keymap.of(...)` for Mod-Enter must come before `basicSetup` to ensure it takes precedence.
**Why it happens:** CodeMirror 6 uses a precedence system for extensions. Later extensions can override earlier ones for keymaps.
**How to avoid:** Follow the exact extension order from the existing `use-codemirror.ts`: custom keymap first, then basicSetup, then language, then lintGutter, then themes, then highlightLineField, then updateListener.
**Warning signs:** Cmd+Enter doesn't trigger analyze; gutter markers don't appear; themes don't apply.

### Pitfall 5: Astro View Transitions Destroy CodeMirror
**What goes wrong:** Navigating away and back creates orphaned EditorView instances or crashes.
**Why it happens:** Astro view transitions swap DOM without running React cleanup.
**How to avoid:** The existing `use-codemirror.ts` already handles this with `document.addEventListener('astro:before-swap', handleSwap)`. The new `use-codemirror-yaml.ts` must replicate this pattern exactly.
**Warning signs:** Multiple editor instances after navigation; "Failed to execute 'removeChild'" errors.

### Pitfall 6: Forgetting to Enrich Violations for Results Panel
**What goes wrong:** The results panel needs violation metadata (title, explanation, fix) for expandable details. But `GhaUnifiedViolation` only has `ruleId`, `message`, `line`, `column`, `severity`, `category`.
**Why it happens:** The engine returns minimal violation objects. Metadata is in the rule registry.
**How to avoid:** After scoring, enrich violations by looking up rule metadata via `getGhaRuleById(v.ruleId)`. This creates an enriched type (like `LintViolation` in Dockerfile Analyzer) with title, explanation, and fix fields. Actionlint Pass 2 violations (GA-L*) can be enriched from `actionlintMetaRules`.
**Warning signs:** Expandable violation details show blank/undefined; rule ID links don't render.

## Code Examples

### Scoring Engine (SCORE-01, SCORE-02, SCORE-03)
```typescript
// Based on src/lib/tools/dockerfile-analyzer/scorer.ts (proven pattern)
import type { GhaUnifiedViolation, GhaCategory, GhaSeverity } from './types';

const CATEGORY_WEIGHTS: Record<string, number> = {
  schema: 15,
  security: 35,
  semantic: 20,
  'best-practice': 20,
  style: 10,
};

const SEVERITY_DEDUCTIONS: Record<GhaSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

// 'actionlint' category violations (GA-L017/L018, GA-L000 fallback) are
// excluded from scoring since they cannot fire in the browser WASM build.
const SCORED_CATEGORIES: string[] = [
  'schema', 'security', 'semantic', 'best-practice', 'style',
];

export function computeGhaScore(violations: GhaUnifiedViolation[]): GhaScoreResult {
  const categoryDeductions: Record<string, GhaScoreDeduction[]> = {};
  for (const cat of SCORED_CATEGORIES) categoryDeductions[cat] = [];

  for (const v of violations) {
    if (!SCORED_CATEGORIES.includes(v.category)) continue; // skip 'actionlint'
    const basePoints = SEVERITY_DEDUCTIONS[v.severity];
    const priorCount = categoryDeductions[v.category].length;
    const points = Math.round((basePoints / (1 + 0.3 * priorCount)) * 100) / 100;
    categoryDeductions[v.category].push({
      ruleId: v.ruleId, category: v.category, severity: v.severity,
      points, line: v.line,
    });
  }

  const categories = SCORED_CATEGORIES.map((cat) => ({
    category: cat,
    score: Math.max(0, Math.round((100 - categoryDeductions[cat].reduce(
      (sum, d) => sum + d.points, 0)) * 100) / 100),
    weight: CATEGORY_WEIGHTS[cat],
    deductions: categoryDeductions[cat],
  }));

  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score * (c.weight / 100), 0),
  );

  return { overall, grade: computeGrade(overall), categories, deductions: categories.flatMap(c => c.deductions) };
}
```

### CodeMirror YAML Hook (UI-01, UI-02)
```typescript
// Based on src/lib/tools/dockerfile-analyzer/use-codemirror.ts
import { yaml } from '@codemirror/lang-yaml';
import { keymap, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { lintGutter } from '@codemirror/lint';
import { editorTheme, oneDarkTheme, a11ySyntaxHighlighting } from
  '../dockerfile-analyzer/editor-theme';
import { highlightLineField } from '../dockerfile-analyzer/highlight-line';

export function useCodeMirrorYaml({ initialDoc, onAnalyze }: Options) {
  // ...same useRef/useEffect pattern as existing hook...
  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      // Mod-Enter analyze shortcut (before basicSetup for precedence)
      keymap.of([{
        key: 'Mod-Enter',
        run: (view) => { onAnalyze(view); return true; },
      }]),
      basicSetup,
      yaml(),                    // <-- YAML language (not dockerfile)
      lintGutter(),
      oneDarkTheme,
      a11ySyntaxHighlighting,
      editorTheme,
      highlightLineField,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        'aria-label': 'GitHub Actions workflow editor',
      }),
      // Stale results detection + localStorage persistence
      EditorView.updateListener.of((update) => { /* same as existing */ }),
    ],
  });
  // ...same EditorView creation, swap handler, cleanup...
}
```

### GHA Nanostore (Updated)
```typescript
// Extending existing src/stores/ghaValidatorStore.ts
import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { GhaUnifiedViolation } from '../lib/tools/gha-validator/types';

// Existing atoms (from Phase 75):
export const ghaWasmReady = atom<boolean>(false);
export const ghaWasmProgress = atom<{ received: number; total: number } | null>(null);
export const ghaWasmError = atom<string | null>(null);
export const ghaWasmLoading = atom<boolean>(false);
export const ghaViolations = atom<GhaUnifiedViolation[]>([]);

// NEW atoms for Phase 78:
export const ghaResult = atom<GhaAnalysisResult | null>(null);
export const ghaAnalyzing = atom<boolean>(false);
export const ghaEditorViewRef = atom<EditorView | null>(null);
export const ghaResultsStale = atom<boolean>(false);
```

### Tabbed Results Panel (UI-05)
```typescript
// Based on src/components/tools/K8sResultsPanel.tsx tab pattern
type GhaResultTab = 'results' | 'graph'; // 'graph' placeholder for Phase 79

export default function GhaResultsPanel() {
  const [activeTab, setActiveTab] = useState<GhaResultTab>('results');
  const result = useStore(ghaResult);
  // ... tab bar with Results and Graph buttons ...
  // ... Results tab: ScoreGauge + GhaCategoryBreakdown + GhaViolationList ...
  // ... Graph tab: placeholder for Phase 79 ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `linter()` auto-triggered | `setDiagnostics()` on-demand | CodeMirror 6 design | Button-triggered analysis (not real-time); matches requirement UI-02 |
| `StreamLanguage.define(dockerFile)` | `yaml()` from `@codemirror/lang-yaml` | Already in project | Native Lezer parser for YAML; better performance and accuracy than legacy mode |
| Single-pass validation | Two-pass (sync + async WASM) | Phases 75-76 design | Progressive result display; Pass 1 instant, Pass 2 asynchronous |
| Severity-grouped violations | Category-grouped violations | Phase 78 requirement (UI-07) | Different from Dockerfile/K8s pattern but required by spec |

**Deprecated/outdated:**
- None relevant. All CodeMirror 6, React 19, nanostores patterns in use are current.

## Open Questions

1. **Worker reuse vs. creation per session**
   - What we know: The existing `createActionlintWorker` creates a new Worker each call. For single-analyze tools this is fine.
   - What's unclear: Should the GHA editor create the Worker eagerly (on component mount) to warm up WASM, or lazily (on first analyze click)?
   - Recommendation: Lazy creation on first analyze click. This avoids downloading 9.4MB WASM binary for users who never click Analyze. Once created, reuse for subsequent analyses. Show WASM progress indicator on first analyze.

2. **Graph tab placeholder behavior**
   - What we know: UI-05 requires tabs. Phase 79 adds the workflow graph. Phase 78 needs the tab infrastructure.
   - What's unclear: What should the Graph tab show before Phase 79?
   - Recommendation: Show "Coming soon" placeholder text in the Graph tab. This establishes the tab infrastructure that Phase 79 will populate.

3. **WASM progress indicator placement**
   - What we know: WASM binary is ~9.4MB, takes 1-3s on fast connections. Progress atoms already exist in store.
   - What's unclear: Should progress show in the editor panel, results panel, or both?
   - Recommendation: Show a small progress bar below the Analyze button in the editor panel (like existing WASM-04 requirement). Results panel shows "Pass 1 complete, running deep analysis..." text during WASM loading.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts` |
| Full suite command | `npx vitest run src/lib/tools/gha-validator/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | Category weights: Schema 15%, Security 35%, Semantic 20%, BP 20%, Style 10% | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x` | Wave 0 |
| SCORE-02 | Overall 0-100 with letter grade using diminishing returns | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x` | Wave 0 |
| SCORE-03 | Per-category sub-scores alongside aggregate | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x` | Wave 0 |
| SCORE-04 | SVG score gauge component | manual-only | Visual inspection of rendered gauge | N/A |
| UI-01 | CodeMirror YAML editor with syntax highlighting | manual-only | Visual inspection in browser | N/A |
| UI-02 | Analyze button + Cmd/Ctrl+Enter shortcut | manual-only | Click button and press shortcut | N/A |
| UI-03 | Pre-loaded sample workflow | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/integration.test.ts -x` | Wave 0 |
| UI-04 | Inline annotations (squiggly + gutter markers) | manual-only | Visual inspection after analysis | N/A |
| UI-05 | Tabbed results panel | manual-only | Visual inspection of tabs | N/A |
| UI-06 | Click-to-navigate from results to editor line | manual-only | Click violation line number | N/A |
| UI-07 | Category-grouped violation list with expandable details | manual-only | Visual inspection | N/A |
| UI-08 | Empty state for clean workflow | manual-only | Test with clean workflow | N/A |
| UI-09 | Responsive layout | manual-only | Resize browser window | N/A |
| UI-10 | React island with client:only | manual-only | `npm run build` + verify SSR exclusion | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x`
- **Per wave merge:** `npx vitest run src/lib/tools/gha-validator/`
- **Phase gate:** Full suite green + manual visual verification of all UI requirements

### Wave 0 Gaps
- [ ] `src/lib/tools/gha-validator/__tests__/scorer.test.ts` -- covers SCORE-01, SCORE-02, SCORE-03
- [ ] `src/lib/tools/gha-validator/__tests__/integration.test.ts` -- covers UI-03 (sample workflow triggers all categories)

## Sources

### Primary (HIGH confidence)
- **Existing codebase** (all patterns verified by reading source files):
  - `src/lib/tools/dockerfile-analyzer/scorer.ts` -- scoring algorithm pattern
  - `src/lib/tools/dockerfile-analyzer/use-codemirror.ts` -- CM6 hook pattern
  - `src/lib/tools/dockerfile-analyzer/editor-theme.ts` -- theme with lint styles
  - `src/lib/tools/dockerfile-analyzer/highlight-line.ts` -- click-to-navigate
  - `src/components/tools/EditorPanel.tsx` -- editor panel pattern
  - `src/components/tools/ResultsPanel.tsx` -- results panel pattern
  - `src/components/tools/K8sResultsPanel.tsx` -- tabbed results pattern
  - `src/components/tools/results/ScoreGauge.tsx` -- reusable gauge
  - `src/components/tools/results/ViolationList.tsx` -- expandable violation list
  - `src/components/tools/results/EmptyState.tsx` -- empty state pattern
  - `src/components/tools/DockerfileAnalyzer.tsx` -- React island wrapper
  - `src/stores/dockerfileAnalyzerStore.ts` -- nanostore pattern
  - `src/stores/ghaValidatorStore.ts` -- existing GHA store atoms
  - `src/lib/tools/gha-validator/engine.ts` -- two-pass engine
  - `src/lib/tools/gha-validator/worker/worker-client.ts` -- Worker client
  - `src/lib/tools/gha-validator/types.ts` -- GHA types
  - `src/lib/tools/gha-validator/rules/index.ts` -- rule registry
  - `src/lib/tools/gha-validator/sample-workflow.ts` -- sample workflows
- [@codemirror/lang-yaml](https://github.com/codemirror/lang-yaml) -- YAML language support (v6.1.2, already installed)
- [CodeMirror Lint Example](https://codemirror.net/examples/lint/) -- setDiagnostics, lintGutter API
- [CodeMirror Reference](https://codemirror.net/docs/ref/) -- keymap.of, Mod-Enter binding

### Secondary (MEDIUM confidence)
- [CodeMirror keymap discussion](https://discuss.codemirror.net/t/setting-a-keymap-for-windows-and-mac/6015) -- Mod-Enter maps to Cmd on Mac, Ctrl on Windows

### Tertiary (LOW confidence)
- None. All findings verified against existing codebase patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and used in 3+ other tools in this project
- Architecture: HIGH -- All patterns directly port from existing Dockerfile/K8s Analyzer implementations verified by reading source
- Pitfalls: HIGH -- Identified from direct experience with the codebase's two-pass architecture and CM6 patterns
- Scoring algorithm: HIGH -- Direct port of proven `scorer.ts` formula with different category weights

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable; all dependencies are already locked in package.json)
