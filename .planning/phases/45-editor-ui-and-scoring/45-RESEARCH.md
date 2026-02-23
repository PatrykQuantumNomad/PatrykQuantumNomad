# Phase 45: Editor UI & Scoring - Research

**Researched:** 2026-02-23
**Domain:** React/CodeMirror 6 editor UI, scoring engine, URL state, Astro React islands
**Confidence:** HIGH

## Summary

Phase 45 builds the browser-based K8s manifest analyzer UI. The codebase already contains two complete reference implementations: the Dockerfile Analyzer (v1.4) and the Docker Compose Validator (v1.6), both using identical architectural patterns -- CodeMirror 6 editor, React islands via `client:only="react"`, nanostores for state bridging, lz-string URL hash sharing, SVG badge generation, and View Transitions lifecycle management.

The K8s analyzer engine (`src/lib/tools/k8s-analyzer/engine.ts`) is fully built with 67 rules (10 schema + 20 security + 12 reliability + 12 best-practice + 8 cross-resource + 5 RBAC). It is **async** (unlike the Dockerfile/Compose engines) because `validateResource()` dynamically imports the 982KB compiled ajv module. The engine returns `K8sEngineResult` with violations, resources, resource summary, rules run/passed, and PSS compliance data. Types are defined in `src/lib/tools/k8s-analyzer/types.ts`, including `K8sAnalysisResult` for the nanostore shape.

The primary challenge is adapting established patterns to the K8s-specific requirements: (1) async engine invocation, (2) K8s-specific 5-category scoring weights (Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%), (3) multi-document YAML with resource summary panel, (4) PSS compliance display, (5) `#k8s=` URL hash prefix, and (6) tabbed Results | Graph panel.

**Primary recommendation:** Follow the Compose Validator pattern exactly (it's the most recent and has tabs + YAML), adapting store names, category weights, hash prefix, and adding the resource summary panel and PSS compliance badge. Use async `runK8sEngine()` with a `setTimeout(0)` yield before calling it to keep the UI responsive during the ~980KB dynamic import.

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `codemirror` | ^6.0.2 | Editor core | Already used by both existing tools |
| `@codemirror/lang-yaml` | ^6.1.2 | YAML syntax highlighting | Already used by Compose Validator |
| `@codemirror/theme-one-dark` | ^6.1.3 | Dark editor theme | Already used, re-exported via `editor-theme.ts` |
| `@codemirror/lint` | (via codemirror) | Diagnostics, gutter markers | Already used for inline annotations |
| `nanostores` | ^1.1.0 | Cross-component state | Already used for all tool stores |
| `@nanostores/react` | ^1.0.0 | React bindings for nanostores | Already used via `useStore()` |
| `lz-string` | ^1.5.0 | URL hash compression | Already used for `#dockerfile=` and `#compose=` |
| `react` | ^19.2.4 | UI components | Already installed and configured |
| `yaml` | ^2.8.2 | YAML parsing | Already used by K8s parser |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@codemirror/legacy-modes` | ^6.5.2 | Legacy language modes | Not needed -- YAML uses `@codemirror/lang-yaml` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CodeMirror 6 | Monaco Editor | Monaco is heavier (~5MB vs ~300KB), not justified since CM6 already in bundle |
| nanostores | zustand/jotai | Different state pattern; nanostores already universal in this codebase |
| lz-string | pako/fflate | lz-string is already installed, produces URL-safe output natively |

**Installation:**
```bash
# No new packages needed -- all dependencies already in package.json
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── stores/
│   └── k8sAnalyzerStore.ts              # NEW: nanostore atoms (matches dockerfile/compose pattern)
├── lib/tools/k8s-analyzer/
│   ├── engine.ts                         # EXISTS: async K8s engine (Phase 41-44)
│   ├── types.ts                          # EXISTS: K8sAnalysisResult, K8sScoreResult, etc.
│   ├── parser.ts                         # EXISTS: multi-doc YAML parser
│   ├── sample-manifest.ts               # EXISTS: pre-loaded sample
│   ├── scorer.ts                         # NEW: K8s-specific category-weighted scorer
│   ├── use-codemirror-k8s.ts            # NEW: CodeMirror hook (fork of compose use-codemirror-yaml.ts)
│   ├── url-state.ts                      # NEW: #k8s= hash encode/decode
│   ├── badge-generator.ts               # NEW: SVG badge with K8s categories
│   └── rules/                            # EXISTS: all 67 rules from Phases 42-44
├── components/tools/
│   ├── K8sAnalyzer.tsx                   # NEW: root React island (editor + results grid)
│   ├── K8sEditorPanel.tsx                # NEW: CodeMirror editor + Analyze button
│   ├── K8sResultsPanel.tsx               # NEW: tabbed results panel (Results | Graph)
│   └── k8s-results/
│       ├── K8sCategoryBreakdown.tsx      # NEW: 5-category bar chart
│       ├── K8sViolationList.tsx          # NEW: severity-grouped violations
│       ├── K8sEmptyState.tsx             # NEW: congratulatory empty state
│       ├── K8sShareActions.tsx           # NEW: badge download + 3-tier share
│       ├── K8sResourceSummary.tsx        # NEW: parsed resource types & counts
│       ├── K8sPromptGenerator.tsx        # NEW: AI fix prompt generation
│       └── K8sPssCompliance.tsx          # NEW: PSS compliance badge (optional)
└── pages/tools/
    └── k8s-analyzer/
        └── index.astro                   # NEW: Astro page with client:only="react"
```

### Pattern 1: Nanostore Bridge (EditorView <-> React)

**What:** Share the CodeMirror EditorView instance across React components via a nanostore atom, avoiding prop drilling.
**When to use:** Always -- this is the established pattern for all 3 tools.
**Source:** `src/stores/dockerfileAnalyzerStore.ts`, `src/stores/composeValidatorStore.ts`

```typescript
// src/stores/k8sAnalyzerStore.ts
import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { K8sAnalysisResult } from '../lib/tools/k8s-analyzer/types';

export const k8sResult = atom<K8sAnalysisResult | null>(null);
export const k8sAnalyzing = atom<boolean>(false);
export const k8sEditorViewRef = atom<EditorView | null>(null);
export const k8sResultsStale = atom<boolean>(false);
```

### Pattern 2: Async Engine Invocation

**What:** The K8s engine is async (unlike Dockerfile/Compose), because schema validators are dynamically imported. The EditorPanel must await the result.
**When to use:** Only for K8s -- this is the first async engine in the codebase.
**Key difference from Compose Validator:** `runK8sEngine()` returns `Promise<K8sEngineResult>`, not a synchronous result.

```typescript
// In K8sEditorPanel.tsx analyze function:
analyzeRef.current = async (view: EditorView) => {
  const content = view.state.doc.toString();
  if (!content.trim()) { /* clear state */ return; }

  k8sResultsStale.set(false);
  k8sAnalyzing.set(true);

  try {
    // Yield to render the "Analyzing..." state before heavy work
    await new Promise(resolve => setTimeout(resolve, 0));
    const engineResult = await runK8sEngine(content);
    const score = computeK8sScore(engineResult.violations);
    // ... convert violations to diagnostics, set nanostore ...
  } catch {
    // ... error handling ...
  }

  k8sAnalyzing.set(false);
};
```

### Pattern 3: View Transitions Lifecycle

**What:** The `astro:before-swap` event listener destroys the EditorView before View Transitions navigation to prevent orphaned DOM references.
**When to use:** Always -- this is critical for Astro sites with `<ClientRouter />`.
**Source:** `src/lib/tools/compose-validator/use-codemirror-yaml.ts` lines 76-84

```typescript
// Double cleanup pattern:
const handleSwap = () => {
  if (viewRef.current) {
    viewRef.current.destroy();
    k8sEditorViewRef.set(null);
    viewRef.current = null;
  }
};
document.addEventListener('astro:before-swap', handleSwap);

return () => {
  document.removeEventListener('astro:before-swap', handleSwap);
  view.destroy();
  k8sEditorViewRef.set(null);
  viewRef.current = null;
};
```

### Pattern 4: Tabbed Results Panel

**What:** The Compose Validator uses a `ResultTab = 'violations' | 'graph'` union type with border-b-2 active tab styling. The K8s analyzer will use `'results' | 'graph'`.
**When to use:** When the results panel has multiple views.
**Source:** `src/components/tools/ComposeResultsPanel.tsx` lines 19-71

### Pattern 5: 3-Tier Share Fallback

**What:** Web Share API > Clipboard API > prompt() fallback chain for sharing URLs.
**When to use:** For the share button.
**Source:** `src/components/tools/compose-results/ComposeShareActions.tsx` lines 52-79

### Pattern 6: On-Demand Diagnostics (Not Real-Time)

**What:** `lintGutter()` is included without `linter()` -- diagnostics are pushed via `setDiagnostics()` only on button click / Cmd+Enter, not on every keystroke.
**When to use:** Always for analyzer tools (UI-03 requires on-demand analysis).
**Source:** `src/lib/tools/compose-validator/use-codemirror-yaml.ts` lines 49-50

### Anti-Patterns to Avoid

- **Don't put EditorView in React state:** Use a ref + nanostore atom. EditorView is a mutable imperative object, not suitable for React state.
- **Don't pass EditorView as props:** Use the nanostore bridge. The ResultsPanel needs it for click-to-navigate but should read from `k8sEditorViewRef.get()`.
- **Don't create separate CodeMirror hook from scratch:** Fork the existing `use-codemirror-yaml.ts` and adapt store references. The lifecycle management is battle-tested.
- **Don't inline the scorer in the editor panel:** Keep it as a separate `scorer.ts` module, matching Dockerfile/Compose patterns.
- **Don't use `client:load` or `client:visible`:** The tool pages use `client:only="react"` exclusively for React islands. This is a hard requirement (UI-12).
- **Don't add `onAnalyze` to the useEffect deps array:** This is called out explicitly in the existing hooks' documentation. It would recreate the entire editor on every render.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML syntax highlighting | Custom tokenizer | `@codemirror/lang-yaml` | Already battle-tested and in deps |
| URL compression | Custom base64 encoding | `lz-string` compressToEncodedURIComponent | URL-safe, handles Unicode, already in deps |
| Editor dark theme | Custom CSS variables | `editor-theme.ts` + `oneDarkTheme` | Already built with WCAG AA compliance |
| Inline squiggly underlines | Custom decorations | `setDiagnostics()` from `@codemirror/lint` | Built into CodeMirror, proven pattern |
| Gutter severity markers | Custom gutter extension | `lintGutter()` from `@codemirror/lint` | Works with `setDiagnostics()` automatically |
| Click-to-navigate highlight | Custom scroll logic | `highlightAndScroll()` from `highlight-line.ts` | Already built and shared between tools |
| Score gauge SVG | Canvas/chart library | Inline SVG with strokeDasharray | Already built as `ScoreGauge` component |
| Badge rasterization | Server-side rendering | Canvas API + toBlob() | Already built as `downloadBadgePng()` |
| Diminishing returns scoring | Simple deduction sum | Formula: `basePoints / (1 + 0.3 * priorCount)` | Proven formula used by both existing scorers |

**Key insight:** 90%+ of this phase is adapting existing patterns with K8s-specific parameters. The only truly new components are the Resource Summary panel and the K8s-specific scorer.

## Common Pitfalls

### Pitfall 1: Forgetting Async Engine

**What goes wrong:** Calling `runK8sEngine()` without `await`, getting a Promise object instead of the result.
**Why it happens:** Both existing engines (Dockerfile, Compose) are synchronous. The K8s engine is the first async one due to dynamic schema imports.
**How to avoid:** The `analyzeRef.current` function MUST be `async` and MUST `await runK8sEngine()`.
**Warning signs:** Score shows 0, no violations despite obvious issues, or `[object Promise]` in output.

### Pitfall 2: Blocking UI During Analysis

**What goes wrong:** The "Analyzing..." state never renders because the async engine starts immediately in the same microtask.
**Why it happens:** Setting `k8sAnalyzing.set(true)` and then immediately calling `await runK8sEngine()` doesn't give React time to re-render.
**How to avoid:** Insert `await new Promise(resolve => setTimeout(resolve, 0))` between setting the analyzing state and starting the engine. This yields to the event loop so React can paint.
**Warning signs:** The analyze button appears to freeze, no spinner/loading state visible.

### Pitfall 3: EditorView Not Destroyed on Navigation

**What goes wrong:** Orphaned EditorView instances after View Transitions navigation cause memory leaks and stale DOM references.
**Why it happens:** React cleanup races with Astro's view transition swap.
**How to avoid:** Always register BOTH the React useEffect cleanup AND the `astro:before-swap` listener, exactly as the existing hooks do.
**Warning signs:** Console errors about accessing destroyed views after navigating away and back.

### Pitfall 4: Line Number Clamping

**What goes wrong:** `Position out of range` error when converting violations to CodeMirror diagnostics.
**Why it happens:** The K8s engine returns line numbers from a multi-document parser. If the user edits the document between analysis runs, line numbers can exceed the current document length.
**How to avoid:** Always clamp: `Math.min(v.line, view.state.doc.lines)`. The Compose Validator already does this (line 48 of ComposeEditorPanel.tsx).
**Warning signs:** Uncaught exception during `setDiagnostics()`.

### Pitfall 5: Wrong Category Weights for Scoring

**What goes wrong:** K8s scores look wrong because Dockerfile/Compose weights were used.
**Why it happens:** Copy-pasting the scorer from the wrong tool.
**How to avoid:** K8s uses: Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10% (SCORE-01).
**Warning signs:** RBAC rules not contributing 35% to security score.

### Pitfall 6: RBAC Rules Category

**What goes wrong:** RBAC violations scored under wrong category, not contributing to Security 35%.
**Why it happens:** RBAC rules might be mapped to a separate 'rbac' category instead of 'security'.
**How to avoid:** Phase 44 decision: all RBAC rules use `category: 'security'` (SCORE-04). The scorer just needs to handle 5 categories, not 6.
**Warning signs:** PSS compliance and RBAC don't affect the security score.

### Pitfall 7: resourceSummary is a Map (Not a Plain Object)

**What goes wrong:** The `resourceSummary` from the engine is a `Map<string, number>`. React rendering requires iteration via `Array.from()` or `Map.entries()`.
**Why it happens:** JavaScript Maps aren't JSON-serializable and can't be used directly in JSX.
**How to avoid:** Convert to array for rendering: `Array.from(result.resourceSummary.entries())`.
**Warning signs:** Empty resource summary panel, or `[object Map]` rendered.

### Pitfall 8: Missing Schema Rule Metadata Lookup

**What goes wrong:** Schema violations (KA-S001 through KA-S010) have no title/explanation in the results panel.
**Why it happens:** `getK8sRuleById()` only looks up lint rules (allK8sRules), not schema rules. Schema rules use `SchemaRuleMetadata` from `diagnostic-rules.ts`.
**How to avoid:** Create a dual-lookup function that checks both `getK8sRuleById()` AND `SCHEMA_RULE_METADATA[id]`, similar to how ComposeEditorPanel uses both `getComposeRuleById()` and `getSchemaRuleById()`.
**Warning signs:** Schema violations showing raw rule IDs instead of human-readable titles.

## Code Examples

### K8s Scorer (Category Weights per SCORE-01)

```typescript
// src/lib/tools/k8s-analyzer/scorer.ts
// Source: Adapted from src/lib/tools/compose-validator/scorer.ts with K8s-specific weights

import type {
  K8sRuleViolation,
  K8sCategory,
  K8sSeverity,
  K8sScoreDeduction,
  K8sCategoryScore,
  K8sScoreResult,
} from './types';
import { allK8sRules } from './rules';
import { SCHEMA_RULE_METADATA } from './diagnostic-rules';

// SCORE-01: Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%
const CATEGORY_WEIGHTS: Record<K8sCategory, number> = {
  'security': 35,
  'reliability': 20,
  'best-practice': 20,
  'schema': 15,
  'cross-resource': 10,
};

const SEVERITY_DEDUCTIONS: Record<K8sSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

const ALL_CATEGORIES: K8sCategory[] = [
  'security',
  'reliability',
  'best-practice',
  'schema',
  'cross-resource',
];

export function computeK8sScore(violations: K8sRuleViolation[]): K8sScoreResult {
  // Build rule lookup from both lint rules (57) and schema rules (10)
  const ruleLookup = new Map<string, { severity: K8sSeverity; category: K8sCategory }>();

  for (const rule of allK8sRules) {
    ruleLookup.set(rule.id, { severity: rule.severity, category: rule.category });
  }
  for (const [id, meta] of Object.entries(SCHEMA_RULE_METADATA)) {
    ruleLookup.set(id, { severity: meta.severity, category: meta.category });
  }

  // Diminishing returns scoring (same formula as existing tools)
  const categoryDeductions: Record<K8sCategory, K8sScoreDeduction[]> = {
    'security': [],
    'reliability': [],
    'best-practice': [],
    'schema': [],
    'cross-resource': [],
  };

  for (const v of violations) {
    const rule = ruleLookup.get(v.ruleId);
    if (!rule) continue;
    const basePoints = SEVERITY_DEDUCTIONS[rule.severity];
    const priorCount = categoryDeductions[rule.category].length;
    const points = Math.round((basePoints / (1 + 0.3 * priorCount)) * 100) / 100;
    categoryDeductions[rule.category].push({
      ruleId: v.ruleId,
      category: rule.category,
      severity: rule.severity,
      points,
      line: v.line,
    });
  }

  const categories: K8sCategoryScore[] = ALL_CATEGORIES.map((cat) => {
    const deductions = categoryDeductions[cat];
    const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
    return {
      category: cat,
      score: Math.max(0, Math.round((100 - totalDeduction) * 100) / 100),
      weight: CATEGORY_WEIGHTS[cat],
      deductions,
    };
  });

  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score * (c.weight / 100), 0),
  );

  return {
    overall,
    grade: computeGrade(overall),
    categories,
    deductions: categories.flatMap((c) => c.deductions),
  };
}

// Same grade scale as existing tools
function computeGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}
```

### K8s URL State (#k8s= prefix per SHARE-02)

```typescript
// src/lib/tools/k8s-analyzer/url-state.ts
// Source: Adapted from src/lib/tools/compose-validator/url-state.ts

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

const HASH_PREFIX = '#k8s=';

export function encodeToHash(content: string): string {
  return `${HASH_PREFIX}${compressToEncodedURIComponent(content)}`;
}

export function decodeFromHash(): string | null {
  const hash = globalThis.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const compressed = hash.slice(HASH_PREFIX.length);
  if (!compressed) return null;
  try {
    return decompressFromEncodedURIComponent(compressed);
  } catch {
    return null;
  }
}

export function buildShareUrl(content: string): string {
  const base = globalThis.location.origin + globalThis.location.pathname;
  return `${base}${encodeToHash(content)}`;
}

export function isUrlSafeLength(content: string): { safe: boolean; length: number } {
  const url = buildShareUrl(content);
  return { safe: url.length <= 2000, length: url.length };
}
```

### Resource Summary Panel (UI-16, new component)

```typescript
// src/components/tools/k8s-results/K8sResourceSummary.tsx

interface K8sResourceSummaryProps {
  resourceSummary: Map<string, number>;
}

export function K8sResourceSummary({ resourceSummary }: K8sResourceSummaryProps) {
  const entries = Array.from(resourceSummary.entries()).sort(
    ([, a], [, b]) => b - a, // Sort by count descending
  );

  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
        Resources ({total})
      </h4>
      <div className="flex flex-wrap gap-2">
        {entries.map(([kind, count]) => (
          <span
            key={kind}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          >
            {kind}
            <span className="font-mono text-[var(--color-text-secondary)]">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
```

### Keyboard Shortcut (Cmd/Ctrl+Enter per UI-04)

```typescript
// Inside useCodeMirrorK8s hook extensions array:
import { keymap } from '@codemirror/view';

// Add before other extensions:
keymap.of([{
  key: 'Mod-Enter',
  run: () => {
    analyzeRef.current();
    return true;
  },
}]),
```

Note: The Compose Validator's `use-codemirror-yaml.ts` accepts `onAnalyze` callback for this purpose. The K8s hook should follow the same pattern.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sync engine | Async engine with dynamic imports | Phase 41 (K8s) | Must await engine result, yield for UI paint |
| 4-5 categories (Dockerfile/Compose) | 5 K8s categories (SCORE-01) | Phase 45 | Different weights than prior tools |
| Single-document YAML | Multi-document YAML | Phase 41 (K8s parser) | Resource summary panel shows all docs |
| No PSS compliance | PSS compliance (Phase 42) | Phase 42 | Optional PSS badge in results |
| `#dockerfile=` / `#compose=` hash | `#k8s=` hash (SHARE-02) | Phase 45 | Different hash prefix |

**Deprecated/outdated:**
- None -- all CodeMirror 6, nanostores, and Astro patterns are current. No breaking changes needed.

## Specific Implementation Notes

### Scoring Categories and Colors

Per SCORE-01, the K8s analyzer uses 5 categories. Suggested color mapping (consistent with existing tools):

| Category | Weight | Color | Hex |
|----------|--------|-------|-----|
| Security | 35% | Red | #ef4444 |
| Reliability | 20% | Amber | #f59e0b |
| Best Practice | 20% | Cyan | #06b6d4 |
| Schema | 15% | Blue | #3b82f6 |
| Cross-Resource | 10% | Purple | #8b5cf6 |

### Reusable vs. K8s-Specific Components

Components that can be **reused directly** from existing tools:
- `ScoreGauge` -- already generic (takes `score` and `grade` props)
- `highlightAndScroll()` -- already shared between Dockerfile and Compose tools
- `editorTheme`, `oneDarkTheme`, `a11ySyntaxHighlighting` -- already shared
- `highlightLineField` -- already shared

Components that need **K8s-specific forks** (different categories/types):
- `K8sCategoryBreakdown` -- different category labels and colors
- `K8sViolationList` -- different rule URL pattern (`/tools/k8s-analyzer/rules/[code]/`)
- `K8sShareActions` -- different hash prefix, different badge title
- `K8sBadgeGenerator` -- different category labels, colors, and URL
- `K8sEmptyState` -- different congratulatory message

### Keyboard Shortcut Note

The Dockerfile Analyzer does NOT have a Cmd/Ctrl+Enter shortcut (it relies solely on the button). The Compose Validator hook accepts `onAnalyze` but also doesn't wire up the keymap in the hook itself. For UI-04, the K8s CodeMirror hook should include `keymap.of([{ key: 'Mod-Enter', run: ... }])` in the extensions array.

### Tabbed Results Panel (UI-15)

The Compose Validator implements tabs as `'violations' | 'graph'`. For K8s, the tabs should be `'results' | 'graph'` per UI-15. The "Graph" tab is specified but the requirements don't detail what it shows. Given the phase description mentions "Results | Graph" tabs, this likely means a future resource relationship graph (similar to Compose dependency graph). For Phase 45, the Graph tab can show a placeholder or the resource summary in a visual layout.

### K8s Multi-Document YAML and Resource Summary (UI-16)

The K8s engine already returns `resourceSummary: Map<string, number>` from `registry.getSummary()`. This maps kind names to counts (e.g., `Deployment -> 3, Service -> 2`). The ResourceSummary component should display this above the violations list.

### Astro Page Routing

The page will be at `/tools/k8s-analyzer/` following the pattern:
- `/tools/dockerfile-analyzer/` -> DockerfileAnalyzer
- `/tools/compose-validator/` -> ComposeValidator
- `/tools/k8s-analyzer/` -> K8sAnalyzer

### Existing Engine Rule Count

Total rules: 67 (10 schema + 57 lint)
- Schema: KA-S001 through KA-S010 (in `diagnostic-rules.ts`)
- Security: 20 rules (KA-C001-C020)
- Reliability: 12 rules (KA-R001-R012)
- Best Practice: 12 rules (KA-B001-B012)
- Cross-Resource: 8 rules (KA-X001-X008)
- RBAC: 5 rules (KA-A001-A005), category='security' per Phase 44 decision

Total rules for scoring = 10 (schema) + 57 (lint) = 67.
The engine already computes `totalRules = 10 + allK8sRules.length` (currently 67).

## Open Questions

1. **Graph Tab Content (UI-15)**
   - What we know: The requirements say "Results | Graph" tabs. The Compose Validator has a dependency graph.
   - What's unclear: What does the K8s "Graph" tab show? Resource relationships? A visual representation of the manifests?
   - Recommendation: For Phase 45, implement the Graph tab with a resource summary visualization or placeholder. A full resource relationship graph (similar to Compose dependency graph using @xyflow/react) could be added later.

2. **Rule Documentation Pages**
   - What we know: Dockerfile and Compose tools have `/rules/[code].astro` pages for individual rule documentation.
   - What's unclear: Are K8s rule documentation pages part of Phase 45 or a later phase?
   - Recommendation: Wire the violation list links to `/tools/k8s-analyzer/rules/{code}/`, but defer creating the actual rule pages to a follow-up phase. The links won't break -- they'll just 404 until the pages exist.

3. **PSS Compliance Display**
   - What we know: Engine returns `pssCompliance: PssComplianceSummary` with baseline/restricted compliance booleans.
   - What's unclear: Should this be displayed prominently in the results panel? It's not explicitly in the Phase 45 requirements.
   - Recommendation: Include a small PSS compliance badge in the results panel (Baseline/Restricted compliance indicators). It's already computed by the engine and adds value for K8s security professionals.

4. **Tools Index Page Update**
   - What we know: `/tools/index.astro` lists Dockerfile Analyzer and Compose Validator.
   - What's unclear: Whether to add the K8s Analyzer card to this page as part of Phase 45.
   - Recommendation: Add it -- it's a small change and maintains consistency with existing tools.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- All patterns verified by reading the actual source code:
  - `src/stores/dockerfileAnalyzerStore.ts` -- nanostore pattern
  - `src/stores/composeValidatorStore.ts` -- nanostore pattern (latest version)
  - `src/lib/tools/dockerfile-analyzer/use-codemirror.ts` -- CodeMirror lifecycle
  - `src/lib/tools/compose-validator/use-codemirror-yaml.ts` -- YAML CodeMirror lifecycle (latest version)
  - `src/lib/tools/dockerfile-analyzer/editor-theme.ts` -- shared editor theme
  - `src/lib/tools/dockerfile-analyzer/highlight-line.ts` -- shared click-to-navigate
  - `src/lib/tools/dockerfile-analyzer/scorer.ts` -- scoring pattern (Dockerfile)
  - `src/lib/tools/compose-validator/scorer.ts` -- scoring pattern (Compose, latest version)
  - `src/lib/tools/dockerfile-analyzer/url-state.ts` -- URL hash pattern
  - `src/lib/tools/compose-validator/url-state.ts` -- URL hash pattern (latest version)
  - `src/lib/tools/dockerfile-analyzer/badge-generator.ts` -- badge SVG + PNG rasterization
  - `src/components/tools/DockerfileAnalyzer.tsx` -- root React island pattern
  - `src/components/tools/ComposeValidator.tsx` -- root React island pattern (latest version)
  - `src/components/tools/EditorPanel.tsx` -- editor panel pattern
  - `src/components/tools/ComposeEditorPanel.tsx` -- YAML editor panel (latest version)
  - `src/components/tools/ResultsPanel.tsx` -- results panel pattern
  - `src/components/tools/ComposeResultsPanel.tsx` -- tabbed results panel (latest version)
  - `src/components/tools/results/ScoreGauge.tsx` -- reusable score gauge
  - `src/components/tools/results/ShareActions.tsx` -- share pattern (Dockerfile)
  - `src/components/tools/compose-results/ComposeShareActions.tsx` -- 3-tier share (latest)
  - `src/lib/tools/k8s-analyzer/engine.ts` -- async K8s engine (Phase 41-44)
  - `src/lib/tools/k8s-analyzer/types.ts` -- all K8s types including K8sAnalysisResult
  - `src/lib/tools/k8s-analyzer/parser.ts` -- multi-doc YAML parser
  - `src/lib/tools/k8s-analyzer/sample-manifest.ts` -- sample K8s YAML
  - `src/lib/tools/k8s-analyzer/rules/index.ts` -- 57 lint rules + allDocumentedK8sRules
  - `src/lib/tools/k8s-analyzer/diagnostic-rules.ts` -- SCHEMA_RULE_METADATA
  - `src/lib/tools/k8s-analyzer/pss-compliance.ts` -- PSS compliance computation
  - `src/lib/tools/k8s-analyzer/resource-registry.ts` -- resource registry with getSummary()
  - `src/pages/tools/dockerfile-analyzer/index.astro` -- Astro page pattern
  - `src/pages/tools/compose-validator/index.astro` -- Astro page pattern (latest version)
  - `src/layouts/Layout.astro` -- ClientRouter, View Transitions setup
  - `package.json` -- all dependencies already installed

### Secondary (MEDIUM confidence)
- None needed -- all findings verified from codebase source code

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used by existing tools
- Architecture: HIGH -- three reference implementations in the same codebase provide exact patterns
- Pitfalls: HIGH -- pitfalls derived from actual code reading (async engine, line clamping, Map iteration)

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (90 days -- stable patterns, no external dependencies changing)
