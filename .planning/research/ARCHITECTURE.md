# Architecture: Dockerfile Analyzer Tool Integration

**Domain:** Interactive browser-based Dockerfile linting and scoring tool
**Researched:** 2026-02-20
**Overall confidence:** HIGH -- based on direct codebase analysis, verified CodeMirror 6 and Astro 5 documentation, and confirmed dockerfile-ast API

---

## Recommended Architecture

The Dockerfile Analyzer is a **single-page client-side tool** at `/tools/dockerfile-analyzer/` that integrates into the existing Astro 5 static site as a React island. The page is a static Astro shell wrapping one large interactive island that contains the CodeMirror editor, rule engine, scorer, and results panel. All processing happens in the browser -- no server, no API calls.

### Why a Single React Island (Not Multiple Islands)

The editor, lint results, and score panel are tightly coupled: every keystroke triggers parse -> lint -> score -> display. Splitting these into separate islands would require cross-island communication via Nanostores for every update, adding latency and complexity to what is fundamentally a single interactive widget. The Beauty Index used multiple small islands because each was independent (filter bar, compare picker, code tabs). The Dockerfile Analyzer is one cohesive tool.

**Use React** because:
1. React 19 + `@astrojs/react` are already installed and configured
2. `@nanostores/react` is already a dependency
3. The site already ships 4 React islands (`HeadScene.tsx`, `LanguageFilter.tsx`, `CodeComparisonTabs.tsx`, `VsComparePicker.tsx`)
4. CodeMirror 6 has well-documented React integration patterns via refs and `useEffect`
5. No additional framework installation needed -- zero new dependencies in `astro.config.mjs`

**Rejected alternative: Vanilla JS island.** CodeMirror 6 is vanilla JS at its core, so a vanilla approach is technically feasible. However, managing the results panel's reactive state (40 diagnostics updating on every keystroke, expandable rule details, severity filtering, score animation) without a framework leads to imperative DOM spaghetti. React's declarative rendering is the right tool here. The existing codebase already pays the React cost -- the marginal bundle addition for this page is near zero since React is already in the shared chunk.

**Rejected alternative: Preact/Svelte/Solid.** Would require installing a new integration (`@astrojs/preact`, etc.) and adding a new framework to the build pipeline. The marginal size savings (Preact ~3kb vs React already loaded) do not justify the maintenance cost of a second UI framework in the codebase.

---

## High-Level Data Flow

```
User pastes/types Dockerfile
        |
        v
CodeMirror EditorView (input)
        |
        | EditorView.updateListener (docChanged)
        v
Parse: dockerfile-ast DockerfileParser.parse(text)
        |
        | Returns: Dockerfile AST (instructions, comments, args)
        v
Lint: RuleEngine.run(ast, rawText)
        |
        | 40 rules, each returns LintResult[]
        v
Score: Scorer.compute(lintResults)
        |
        | Returns: { overall, categories: { security, efficiency, ... } }
        v
Display (two outputs):
  1. CodeMirror Diagnostics (inline markers in editor via setDiagnostics)
  2. React State (results panel: score gauge, rule violations list, suggestions)
```

### Key Design Decision: `linter()` Extension vs `setDiagnostics`

**Use the `linter()` extension from `@codemirror/lint`**, not manual `setDiagnostics` dispatches.

The `linter()` function accepts a callback `(view: EditorView) => Diagnostic[]` that CodeMirror calls automatically on document changes with built-in debouncing. This is simpler and more correct than manually wiring `updateListener` -> debounce -> `setDiagnostics`. The linter callback is the natural place to run the parse -> lint pipeline and return CodeMirror `Diagnostic` objects. The results panel updates are triggered by a parallel Nanostore subscription to the same lint results.

**Confidence:** HIGH -- the `linter()` function and `Diagnostic` interface are documented at [codemirror.net/examples/lint/](https://codemirror.net/examples/lint/) and verified in the `@codemirror/lint` 6.9.4 package.

---

## Component Boundaries

### Page Shell: `src/pages/tools/dockerfile-analyzer.astro`

An Astro page that imports the Layout and renders the React island. Minimal static content: page title, SEO metadata, introductory text, and the island mount.

```astro
---
import Layout from '../../layouts/Layout.astro';
import DockerfileAnalyzer from '../../components/tools/DockerfileAnalyzer';
import BreadcrumbJsonLd from '../../components/BreadcrumbJsonLd.astro';
---

<Layout
  title="Dockerfile Analyzer -- Best Practice Linter & Scorer | Patryk Golabek"
  description="Paste your Dockerfile and get instant feedback on security, efficiency, and maintainability. 40+ lint rules with inline annotations and an overall score."
>
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl sm:text-4xl font-heading font-bold mb-2">
      Dockerfile Analyzer
    </h1>
    <p class="text-[var(--color-text-secondary)] mb-8 max-w-2xl">
      Paste your Dockerfile below for instant best-practice analysis.
      40 rules covering security, efficiency, maintainability, and more.
    </p>

    <DockerfileAnalyzer client:load />
  </section>

  <BreadcrumbJsonLd crumbs={[
    { name: "Home", url: Astro.site?.toString() ?? "/" },
    { name: "Tools", url: new URL("/tools/", Astro.site).toString() },
    { name: "Dockerfile Analyzer", url: new URL("/tools/dockerfile-analyzer/", Astro.site).toString() },
  ]} />
</Layout>
```

**Why `client:load` not `client:visible`:** The editor IS the page content. Users navigate here specifically to use the tool. Deferring hydration until scroll would make the editor appear broken (empty textarea with no syntax highlighting) until it enters the viewport. For tool pages, immediate hydration is correct.

### React Island: `src/components/tools/DockerfileAnalyzer.tsx`

The root island component. Manages the overall layout (editor panel + results panel), initializes CodeMirror, and coordinates state flow.

```
DockerfileAnalyzer.tsx
  |
  +-- useCodeMirror hook (creates EditorView, attaches extensions)
  |     |
  |     +-- Dockerfile syntax highlighting (StreamLanguage from legacy-modes)
  |     +-- Custom linter extension (parse -> lint -> Diagnostic[])
  |     +-- Theme extension (matches site's CSS custom properties)
  |     +-- Basic editor extensions (line numbers, bracket matching, etc.)
  |
  +-- <EditorPanel />  (mounts CodeMirror into a div ref)
  |
  +-- <ResultsPanel /> (reads from analysisStore, renders score + violations)
       |
       +-- <ScoreGauge />     (overall score 0-100, circular or bar visual)
       +-- <CategoryScores /> (security, efficiency, maintainability, etc.)
       +-- <ViolationList />  (grouped by severity, expandable details)
```

### Component Breakdown

| Component | Responsibility | State Source | JS Weight (est.) |
|-----------|---------------|-------------|-----------------|
| `DockerfileAnalyzer.tsx` | Root island, layout, CodeMirror init | Local + store | ~2kb own code |
| `useCodeMirror.ts` | Hook: creates EditorView, manages extensions | EditorView ref | ~1kb |
| `EditorPanel.tsx` | Mounts CodeMirror, sample Dockerfile button, clear button | EditorView ref | ~0.5kb |
| `ResultsPanel.tsx` | Reads analysis store, renders score + violations | `analysisStore` | ~2kb |
| `ScoreGauge.tsx` | SVG circular gauge for overall score (0-100) | Props from parent | ~1kb |
| `CategoryScores.tsx` | Bar charts per category (security, efficiency, etc.) | Props from parent | ~1kb |
| `ViolationList.tsx` | Sorted violation cards with severity badges | Props from parent | ~1.5kb |
| CodeMirror packages | Editor, state, lint, language, legacy-modes | N/A | ~75kb gzipped |
| dockerfile-ast | Dockerfile parser | N/A | ~15kb gzipped |

**Total estimated JS for the page:** ~100kb gzipped (dominated by CodeMirror). This is acceptable for a tool page -- users expect tool pages to load heavier than content pages.

---

## State Management Architecture

### Two State Domains

**1. Editor State (owned by CodeMirror)**
CodeMirror manages its own document state, cursor position, selections, undo history, and inline diagnostics. React does NOT control the editor content -- CodeMirror is the source of truth for the document. The React component holds a `ref` to the `EditorView` instance.

**2. Analysis State (owned by Nanostore)**
The parsed analysis results (score, violations, categories) live in a Nanostore atom. This is the bridge between the CodeMirror linter callback and the React results panel.

```typescript
// src/stores/dockerfileAnalyzerStore.ts
import { atom } from 'nanostores';

export interface LintViolation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: string;        // suggested fix text
  docUrl?: string;     // link to docs
  category: RuleCategory;
}

export type RuleCategory =
  | 'security'
  | 'efficiency'
  | 'maintainability'
  | 'correctness'
  | 'style';

export interface AnalysisResult {
  violations: LintViolation[];
  score: number;          // 0-100
  categoryScores: Record<RuleCategory, number>;  // 0-100 each
  instructionCount: number;
  stageCount: number;     // multi-stage build stages
  baseImage: string;      // first FROM image
}

export const analysisResult = atom<AnalysisResult | null>(null);
export const isAnalyzing = atom<boolean>(false);

export function setAnalysis(result: AnalysisResult) {
  analysisResult.set(result);
  isAnalyzing.set(false);
}

export function clearAnalysis() {
  analysisResult.set(null);
}
```

### Data Flow Between CodeMirror and React

The linter callback is the integration point. When CodeMirror's built-in linter runs (on document change, debounced):

```typescript
// Inside the linter extension factory
import { linter, type Diagnostic } from '@codemirror/lint';
import { setAnalysis } from '../../stores/dockerfileAnalyzerStore';

export function dockerfileLinter() {
  return linter((view) => {
    const text = view.state.doc.toString();
    if (!text.trim()) {
      clearAnalysis();
      return [];
    }

    // 1. Parse
    const dockerfile = DockerfileParser.parse(text);

    // 2. Lint (all rules)
    const violations = runAllRules(dockerfile, text);

    // 3. Score
    const score = computeScore(violations);

    // 4. Update Nanostore (triggers React re-render of results panel)
    setAnalysis({
      violations,
      score: score.overall,
      categoryScores: score.categories,
      instructionCount: dockerfile.getInstructions().length,
      stageCount: countStages(dockerfile),
      baseImage: getBaseImage(dockerfile),
    });

    // 5. Return CodeMirror Diagnostics (inline markers in editor)
    return violations.map((v): Diagnostic => ({
      from: view.state.doc.line(v.line).from + (v.column - 1),
      to: v.endLine
        ? view.state.doc.line(v.endLine).from + (v.endColumn ?? v.column) - 1
        : view.state.doc.line(v.line).to,
      severity: v.severity === 'info' ? 'info' : v.severity,
      message: `[${v.ruleId}] ${v.message}`,
      source: 'dockerfile-analyzer',
    }));
  });
}
```

This dual-output pattern is key: one lint run produces BOTH CodeMirror diagnostics (for inline annotations) AND Nanostore updates (for the results panel). No double-parsing, no sync issues.

**Confidence:** HIGH -- this pattern is documented in the CodeMirror lint example. The `linter()` function signature `(view: EditorView) => Diagnostic[]` is stable API. Nanostore `.set()` inside the callback is synchronous and safe.

---

## CodeMirror Integration Details

### Hook: `useCodeMirror.ts`

```typescript
// src/lib/tools/useCodeMirror.ts
import { useRef, useEffect } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { lintGutter } from '@codemirror/lint';
import { dockerfileLinter } from './dockerfile-linter';
import { analyzerTheme } from './editor-theme';

export function useCodeMirror(initialDoc: string = '') {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        basicSetup,
        StreamLanguage.define(dockerFile),
        dockerfileLinter(),
        lintGutter(),
        analyzerTheme,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);  // Mount once, CodeMirror manages its own state

  return { containerRef, viewRef };
}
```

### Dockerfile Syntax Highlighting

**Use `@codemirror/legacy-modes/mode/dockerfile`** via `StreamLanguage.define()`.

The `@codemirror/legacy-modes` package (v6.5.2) includes a ported Dockerfile mode at `mode/dockerfile.js`. This provides keyword highlighting for `FROM`, `RUN`, `COPY`, `ADD`, `ENV`, `ARG`, `EXPOSE`, `CMD`, `ENTRYPOINT`, `WORKDIR`, `USER`, `VOLUME`, `LABEL`, `STANZA`, `HEALTHCHECK`, `SHELL`, and `ONBUILD`. It also highlights comments (`#`), strings, and heredocs.

**Confidence:** HIGH -- verified via `npm pack --dry-run @codemirror/legacy-modes` which confirms the file `mode/dockerfile.cjs` (8.2kb) and `mode/dockerfile.js` (3.8kb) exist in the package.

### Editor Theme

Create a custom theme that matches the site's CSS custom properties:

```typescript
// src/lib/tools/editor-theme.ts
import { EditorView } from '@codemirror/view';

export const analyzerTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: '"Fira Code", monospace',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--color-surface-alt)',
  },
  '.cm-content': {
    caretColor: 'var(--color-accent)',
    padding: '0.75rem 0',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--color-accent)08',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--color-accent)20 !important',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--color-accent)',
  },
  // Lint marker styles
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline var(--color-error, #e53e3e)',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline var(--color-warning, #dd6b20)',
  },
  '.cm-lintRange-info': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline var(--color-info, #3182ce)',
  },
});
```

**Important:** The site already loads Fira Code from Google Fonts (confirmed in `Layout.astro` line 116). The editor inherits the font without additional loading.

---

## Rule Engine Architecture

### Design: Modular Rules with a Registry Pattern

Each rule is a standalone function in its own file. A registry indexes all rules and the engine iterates them. This keeps rules independently testable and easy to add/remove.

### File Structure

```
src/lib/tools/dockerfile-analyzer/
  |
  +-- index.ts                    # Re-exports for clean imports
  +-- parser.ts                   # Wraps dockerfile-ast, normalizes output
  +-- scorer.ts                   # Computes overall + category scores
  +-- engine.ts                   # RuleEngine: runs all rules, collects results
  +-- types.ts                    # Shared types (LintViolation, Rule, RuleCategory, etc.)
  +-- editor-theme.ts             # CodeMirror theme
  +-- dockerfile-linter.ts        # CodeMirror linter() extension factory
  |
  +-- rules/
       +-- index.ts               # Rule registry (imports + exports all rules)
       +-- _template.ts           # Template for creating new rules
       |
       +-- security/
       |    +-- no-root-user.ts
       |    +-- no-add-url.ts
       |    +-- pin-package-versions.ts
       |    +-- no-secrets-in-env.ts
       |    +-- use-copy-not-add.ts
       |    +-- ...
       |
       +-- efficiency/
       |    +-- minimize-layers.ts
       |    +-- use-multi-stage.ts
       |    +-- order-commands-for-cache.ts
       |    +-- combine-run-commands.ts
       |    +-- no-apt-cache.ts
       |    +-- ...
       |
       +-- maintainability/
       |    +-- require-labels.ts
       |    +-- use-specific-base-tag.ts
       |    +-- use-workdir.ts
       |    +-- no-latest-tag.ts
       |    +-- ...
       |
       +-- correctness/
       |    +-- valid-instruction.ts
       |    +-- expose-port-range.ts
       |    +-- cmd-exec-form.ts
       |    +-- entrypoint-exec-form.ts
       |    +-- ...
       |
       +-- style/
            +-- uppercase-instructions.ts
            +-- consistent-line-endings.ts
            +-- sort-packages.ts
            +-- ...
```

### Rule Interface

```typescript
// src/lib/tools/dockerfile-analyzer/types.ts
import type { Dockerfile } from 'dockerfile-ast';

export type RuleSeverity = 'error' | 'warning' | 'info';
export type RuleCategory = 'security' | 'efficiency' | 'maintainability' | 'correctness' | 'style';

export interface RuleMeta {
  id: string;            // e.g., "SEC001"
  name: string;          // e.g., "no-root-user"
  title: string;         // e.g., "Avoid running as root"
  description: string;   // Full explanation
  severity: RuleSeverity;
  category: RuleCategory;
  docUrl?: string;       // Link to external docs/best practices
  fix?: string;          // Suggested fix description
}

export interface LintResult {
  rule: RuleMeta;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;       // Instance-specific message
  fix?: string;          // Instance-specific suggested fix
}

export interface Rule {
  meta: RuleMeta;
  check(dockerfile: Dockerfile, rawText: string): LintResult[];
}
```

### Rule Registry

```typescript
// src/lib/tools/dockerfile-analyzer/rules/index.ts
import type { Rule } from '../types';

// Security rules
import { noRootUser } from './security/no-root-user';
import { noAddUrl } from './security/no-add-url';
// ... 40 imports total

export const allRules: Rule[] = [
  noRootUser,
  noAddUrl,
  // ... all 40 rules
];

export const rulesByCategory = {
  security: allRules.filter(r => r.meta.category === 'security'),
  efficiency: allRules.filter(r => r.meta.category === 'efficiency'),
  maintainability: allRules.filter(r => r.meta.category === 'maintainability'),
  correctness: allRules.filter(r => r.meta.category === 'correctness'),
  style: allRules.filter(r => r.meta.category === 'style'),
};
```

### Example Rule Implementation

```typescript
// src/lib/tools/dockerfile-analyzer/rules/security/no-root-user.ts
import type { Rule, LintResult } from '../../types';
import type { Dockerfile } from 'dockerfile-ast';

export const noRootUser: Rule = {
  meta: {
    id: 'SEC001',
    name: 'no-root-user',
    title: 'Avoid running as root',
    description: 'Containers should not run as root. Use the USER instruction to switch to a non-root user.',
    severity: 'warning',
    category: 'security',
    fix: 'Add USER nonroot before CMD/ENTRYPOINT',
  },

  check(dockerfile: Dockerfile, _rawText: string): LintResult[] {
    const instructions = dockerfile.getInstructions();
    const hasUser = instructions.some(
      (inst) => inst.getKeyword() === 'USER'
    );

    if (!hasUser && instructions.length > 0) {
      // Flag the last instruction (where USER should appear before)
      const lastInst = instructions[instructions.length - 1];
      const range = lastInst.getRange();
      return [{
        rule: this.meta,
        line: range.end.line + 1,
        column: 1,
        message: 'No USER instruction found. Container will run as root.',
        fix: 'Add "USER nonroot" before the final CMD or ENTRYPOINT.',
      }];
    }

    return [];
  },
};
```

### Why Modular Files (Not a Single Rules File)

1. **Testability:** Each rule file can be unit-tested in isolation with a mock Dockerfile AST
2. **Discoverability:** New contributors find rules by browsing `rules/security/` etc.
3. **Tree-shaking:** If rules are ever made optional (user-configurable), bundler can eliminate unused rules
4. **Separation of concerns:** Rule metadata, check logic, and fix suggestions are co-located per rule
5. **Scalability:** Adding rule #41 is "create a file, add to registry" -- not "edit a 2000-line file"

The registry pattern (`rules/index.ts` imports all, exports `allRules[]`) means the engine code never changes when rules are added.

---

## Parser Layer

### `dockerfile-ast` Browser Compatibility

`dockerfile-ast` v0.7.1 depends on:
- `vscode-languageserver-textdocument` v1.0.12 (zero dependencies, pure JS text document model)
- `vscode-languageserver-types` v3.17.5 (zero dependencies, pure TypeScript type definitions)

Neither dependency uses Node.js APIs (no `fs`, `path`, `child_process`, etc.). The library is pure TypeScript that compiles to standard ES modules. It will bundle for the browser via Vite (Astro's bundler) without polyfills.

**Confidence:** MEDIUM -- both dependencies have zero npm dependencies and appear to be pure JS/TS from their package metadata. However, I was unable to directly verify the source code for Node API usage. This should be validated during the first build by confirming `astro build` succeeds without Node polyfill errors.

### Parser Wrapper

```typescript
// src/lib/tools/dockerfile-analyzer/parser.ts
import { DockerfileParser } from 'dockerfile-ast';
import type { Dockerfile } from 'dockerfile-ast';

export interface ParseResult {
  dockerfile: Dockerfile;
  instructionCount: number;
  stageCount: number;
  baseImage: string;
}

export function parseDockerfile(text: string): ParseResult {
  const dockerfile = DockerfileParser.parse(text);
  const instructions = dockerfile.getInstructions();

  const fromInstructions = instructions.filter(
    (i) => i.getKeyword() === 'FROM'
  );

  return {
    dockerfile,
    instructionCount: instructions.length,
    stageCount: Math.max(1, fromInstructions.length),
    baseImage: fromInstructions[0]
      ? fromInstructions[0].getArguments().map(a => a.getValue()).join(' ')
      : 'unknown',
  };
}
```

---

## Scoring Engine

### Scoring Model

The scorer computes a 0-100 overall score from the lint violations. Each rule category has a weight, and violations deduct points based on severity.

```typescript
// src/lib/tools/dockerfile-analyzer/scorer.ts
import type { LintResult, RuleCategory } from './types';

const CATEGORY_WEIGHTS: Record<RuleCategory, number> = {
  security: 30,
  efficiency: 25,
  maintainability: 20,
  correctness: 15,
  style: 10,
};

const SEVERITY_DEDUCTIONS = {
  error: 10,
  warning: 5,
  info: 2,
};

export interface ScoreResult {
  overall: number;
  categories: Record<RuleCategory, number>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export function computeScore(violations: LintResult[]): ScoreResult {
  const categories: Record<RuleCategory, number> = {
    security: 100,
    efficiency: 100,
    maintainability: 100,
    correctness: 100,
    style: 100,
  };

  for (const v of violations) {
    const deduction = SEVERITY_DEDUCTIONS[v.rule.severity];
    categories[v.rule.category] = Math.max(
      0,
      categories[v.rule.category] - deduction
    );
  }

  // Weighted average
  const overall = Object.entries(categories).reduce(
    (sum, [cat, score]) =>
      sum + score * (CATEGORY_WEIGHTS[cat as RuleCategory] / 100),
    0
  );

  const grade =
    overall >= 90 ? 'A' :
    overall >= 80 ? 'B' :
    overall >= 60 ? 'C' :
    overall >= 40 ? 'D' : 'F';

  return {
    overall: Math.round(overall),
    categories,
    grade,
  };
}
```

---

## Results Panel <-> Editor Communication

### Pattern: Nanostore as Message Bus

The linter callback writes to `analysisStore`. The React `ResultsPanel` subscribes via `useStore()`. When a user clicks a violation in the results panel, the panel dispatches a cursor movement to the CodeMirror `EditorView` via the shared ref.

```
Linter callback ---setAnalysis()---> analysisStore ---useStore()---> ResultsPanel
                                                                         |
                                                                    (click violation)
                                                                         |
ResultsPanel ---viewRef.current.dispatch()---> CodeMirror EditorView (scroll to line)
```

### Click-to-Navigate Implementation

```typescript
// Inside ResultsPanel.tsx
function handleViolationClick(violation: LintViolation) {
  const view = viewRef.current;
  if (!view) return;

  const line = view.state.doc.line(violation.line);
  view.dispatch({
    selection: { anchor: line.from + violation.column - 1 },
    effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
  });
  view.focus();
}
```

This is the ONLY place React directly touches the CodeMirror instance. All other communication flows through the Nanostore.

---

## Complete File Manifest

### New Files (create)

| File | Type | Purpose |
|------|------|---------|
| `src/pages/tools/dockerfile-analyzer.astro` | Page | Astro shell with Layout, SEO, breadcrumbs |
| `src/components/tools/DockerfileAnalyzer.tsx` | Component | Root React island |
| `src/components/tools/EditorPanel.tsx` | Component | CodeMirror mount + toolbar |
| `src/components/tools/ResultsPanel.tsx` | Component | Score gauge + violations list |
| `src/components/tools/ScoreGauge.tsx` | Component | SVG circular score gauge |
| `src/components/tools/CategoryScores.tsx` | Component | Per-category score bars |
| `src/components/tools/ViolationList.tsx` | Component | Violations grouped by severity |
| `src/stores/dockerfileAnalyzerStore.ts` | Store | Nanostore for analysis results |
| `src/lib/tools/dockerfile-analyzer/index.ts` | Lib | Re-exports |
| `src/lib/tools/dockerfile-analyzer/types.ts` | Lib | Shared types |
| `src/lib/tools/dockerfile-analyzer/parser.ts` | Lib | dockerfile-ast wrapper |
| `src/lib/tools/dockerfile-analyzer/engine.ts` | Lib | Rule engine (runs all rules) |
| `src/lib/tools/dockerfile-analyzer/scorer.ts` | Lib | Score computation |
| `src/lib/tools/dockerfile-analyzer/dockerfile-linter.ts` | Lib | CodeMirror linter extension |
| `src/lib/tools/dockerfile-analyzer/editor-theme.ts` | Lib | CodeMirror theme |
| `src/lib/tools/dockerfile-analyzer/rules/index.ts` | Lib | Rule registry |
| `src/lib/tools/dockerfile-analyzer/rules/_template.ts` | Lib | Rule template |
| `src/lib/tools/dockerfile-analyzer/rules/security/*.ts` | Lib | ~8 security rules |
| `src/lib/tools/dockerfile-analyzer/rules/efficiency/*.ts` | Lib | ~10 efficiency rules |
| `src/lib/tools/dockerfile-analyzer/rules/maintainability/*.ts` | Lib | ~8 maintainability rules |
| `src/lib/tools/dockerfile-analyzer/rules/correctness/*.ts` | Lib | ~7 correctness rules |
| `src/lib/tools/dockerfile-analyzer/rules/style/*.ts` | Lib | ~7 style rules |
| `src/lib/tools/useCodeMirror.ts` | Hook | React hook for CodeMirror lifecycle |

### Modified Files (edit)

| File | Change | Scope |
|------|--------|-------|
| `src/components/Header.astro` | Add `{ href: '/tools/', label: 'Tools' }` or a dropdown | 1 line (or small refactor if dropdown) |
| `package.json` | Add CodeMirror packages + dockerfile-ast | dependencies section |

### Files NOT Modified

| File | Reason |
|------|--------|
| `astro.config.mjs` | React already configured. No new integrations needed. |
| `src/layouts/Layout.astro` | Already supports all needed SEO props. CSP already allows `'unsafe-inline'` for scripts/styles. |
| `tailwind.config.mjs` | No new theme extensions needed. |
| `src/styles/global.css` | CodeMirror theme is scoped to the editor. |

### New npm Dependencies

```bash
npm install codemirror @codemirror/view @codemirror/state @codemirror/lint \
  @codemirror/language @codemirror/legacy-modes dockerfile-ast
```

| Package | Version | Size (gzipped) | Purpose |
|---------|---------|----------------|---------|
| `codemirror` | 6.0.2 | ~2kb (re-exports) | Meta-package, exports basicSetup |
| `@codemirror/view` | 6.39.15 | ~45kb | EditorView, DOM rendering |
| `@codemirror/state` | 6.5.4 | ~15kb | EditorState, transactions |
| `@codemirror/lint` | 6.9.4 | ~5kb | linter(), Diagnostic, lintGutter |
| `@codemirror/language` | 6.12.1 | ~8kb | StreamLanguage, indentation |
| `@codemirror/legacy-modes` | 6.5.2 | ~3.8kb (dockerfile only) | Dockerfile syntax mode |
| `dockerfile-ast` | 0.7.1 | ~15kb | Dockerfile parser |

**Note:** `@codemirror/view` and `@codemirror/state` are transitive dependencies of `codemirror`, but it is best practice to install them explicitly for direct imports.

---

## Patterns to Follow

### Pattern 1: Astro Shell + React Island (Established)

**What:** Static Astro page wraps a `client:load` React component.
**When:** The page's primary content is interactive.
**Existing precedent:** `HeadSceneWrapper.astro` wraps `HeadScene.tsx` with `client:visible`.

### Pattern 2: Nanostore for Cross-Concern State (Established)

**What:** Nanostore atom defined in `src/stores/`, imported by both lib code and React components.
**When:** State needs to flow between non-React code (linter callback) and React UI (results panel).
**Existing precedent:** `languageFilterStore.ts` bridges `LanguageFilter.tsx` with DOM manipulation.

### Pattern 3: CodeMirror via Ref (Standard CM6 Pattern)

**What:** `useRef<HTMLDivElement>` for mount target, `useRef<EditorView>` for instance. `useEffect` creates and destroys the view.
**When:** Wrapping an imperative DOM library in React.
**Why not `@uiw/react-codemirror`:** Third-party wrapper adds a dependency, limits extension control, and abstracts away the EditorView which we need direct access to for `setDiagnostics` and programmatic cursor control. Direct CodeMirror usage via refs is the recommended pattern for complex integrations.

### Pattern 4: `astro:page-load` Lifecycle (Established)

**What:** Event-based initialization for components using the Astro ClientRouter.
**When:** Any client-side code that needs to re-initialize after navigation.
**Note:** This does NOT apply to React islands -- Astro manages React component lifecycle automatically. The `astro:page-load` pattern is only for vanilla JS in `<script>` tags. The React island re-mounts via Astro's hydration system when navigating to/from the page.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Controlled Editor (React Owns Document State)

**What:** Using React state to hold the editor content and syncing it bidirectionally with CodeMirror.
**Why bad:** CodeMirror's architecture is specifically designed for uncontrolled use. Bidirectional sync causes cursor jumping, undo stack corruption, and performance degradation. Every keystroke would trigger: CM change -> React setState -> React re-render -> CM update -> CM change (loop).
**Instead:** Let CodeMirror own document state. React only reads analysis results from the Nanostore. The only React -> CM communication is programmatic cursor movement on violation click.

### Anti-Pattern 2: Running Rules in a Web Worker

**What:** Moving the parse/lint/score pipeline to a Web Worker for "performance."
**Why bad:** Premature optimization. The `dockerfile-ast` parser is fast (sub-millisecond for typical Dockerfiles). 40 rules iterating over ~10-50 instructions is trivial. Worker communication overhead (serialization + postMessage) would likely exceed the rule execution time. Workers add complexity (serialization boundaries, error handling, build config).
**Instead:** Run everything synchronously in the linter callback. If profiling shows a problem (it won't for Dockerfiles under 500 lines), add `requestIdleCallback` or worker then.

### Anti-Pattern 3: Global CodeMirror Instance

**What:** Storing the EditorView in a Nanostore or global variable.
**Why bad:** EditorView holds DOM references. Storing it in a Nanostore means it persists across Astro page navigations (ClientRouter), causing memory leaks and stale DOM references.
**Instead:** EditorView lives in a React `useRef`, created in `useEffect`, destroyed in cleanup.

### Anti-Pattern 4: Separate Linter + Listener for Results

**What:** Using `linter()` for CodeMirror diagnostics AND `EditorView.updateListener` for the results panel, each independently parsing the Dockerfile.
**Why bad:** Double-parsing on every keystroke. Results panel and inline diagnostics could get out of sync if debounce timings differ.
**Instead:** Single `linter()` callback does parse -> lint -> score. It returns `Diagnostic[]` to CodeMirror AND writes to the Nanostore in one pass.

### Anti-Pattern 5: All Rules in One File

**What:** A single `rules.ts` with 40 rule functions.
**Why bad:** Untestable in isolation (must import everything to test one rule). Difficult to navigate. Merge conflicts when multiple rules are edited. No category organization.
**Instead:** One file per rule, grouped by category in subdirectories, with a registry index.

---

## Build Order (Dependency Graph)

```
Phase 1: Foundation (no dependencies)
  1.1  Install npm packages (codemirror, dockerfile-ast)
  1.2  Create src/lib/tools/dockerfile-analyzer/types.ts (shared types)
  1.3  Create src/stores/dockerfileAnalyzerStore.ts (Nanostore)
  1.4  Create src/lib/tools/dockerfile-analyzer/parser.ts (dockerfile-ast wrapper)
       Verify: `astro build` succeeds, dockerfile-ast bundles for browser

Phase 2: Rule Engine (depends on 1.2, 1.4)
  2.1  Create rules/_template.ts and rules/index.ts (empty registry)
  2.2  Create engine.ts (iterates rules, collects results)
  2.3  Create scorer.ts (computes scores from results)
  2.4  Implement first 5 rules (1 per category) as proof of concept
       Verify: unit-testable -- import rules, pass mock Dockerfile, check results

Phase 3: CodeMirror Integration (depends on Phase 1)
  3.1  Create editor-theme.ts (site-matching theme)
  3.2  Create dockerfile-linter.ts (linter extension factory)
  3.3  Create src/lib/tools/useCodeMirror.ts (React hook)
       Verify: editor renders with syntax highlighting and lint markers

Phase 4: React Components (depends on Phases 2, 3)
  4.1  EditorPanel.tsx (mounts CodeMirror, sample button, clear button)
  4.2  ScoreGauge.tsx (SVG gauge)
  4.3  CategoryScores.tsx (bar charts)
  4.4  ViolationList.tsx (violation cards with click-to-navigate)
  4.5  ResultsPanel.tsx (composes ScoreGauge, CategoryScores, ViolationList)
  4.6  DockerfileAnalyzer.tsx (root island, composes EditorPanel + ResultsPanel)
       Verify: paste Dockerfile -> see inline markers + score + violations

Phase 5: Page Integration (depends on Phase 4)
  5.1  Create src/pages/tools/dockerfile-analyzer.astro (page shell)
  5.2  Add navigation link in Header.astro
  5.3  Add breadcrumb structured data
       Verify: page loads at /tools/dockerfile-analyzer/, full flow works

Phase 6: Complete Rules (depends on Phase 2 proof-of-concept)
  6.1  Implement remaining ~35 rules across all categories
  6.2  Tune scoring weights based on rule coverage
  6.3  Add sample Dockerfiles (good, mediocre, bad) for demo
       Verify: all rules fire correctly, scoring feels right

Phase 7: Polish (depends on all above)
  7.1  Mobile responsive layout (stacked panels on small screens)
  7.2  URL state (encode Dockerfile in URL hash for sharing?)
  7.3  Sample Dockerfile presets (dropdown of common scenarios)
  7.4  Empty state (nice illustration/prompt when no Dockerfile entered)
  7.5  Performance verification on large Dockerfiles (200+ lines)
       Verify: full build passes, Lighthouse audit, mobile testing
```

**Phase ordering rationale:**
- **Types and parser first** because every rule and the linter depend on them.
- **Rule engine before components** because the linter callback (Phase 3.2) needs to call `runAllRules` (Phase 2.2). Building the engine with 5 sample rules proves the architecture before investing in 40 rules.
- **CodeMirror integration in parallel with rule engine** -- the hook and theme don't depend on rules, only on the linter extension which can be stubbed initially.
- **React components after both engine and CM** because they compose both.
- **Complete rules AFTER the proof-of-concept works** -- the most time-consuming phase (writing 40 rules) should not block architecture validation.

---

## Scalability Considerations

| Concern | At 40 rules | At 100 rules | At 200+ rules |
|---------|-------------|-------------|---------------|
| Lint time per keystroke | <5ms | ~10ms | Consider lazy evaluation or chunking |
| Bundle size (rules) | ~30kb | ~75kb | Code-split by category, lazy-load |
| Results panel DOM | 0-40 violations | 0-100 violations | Virtualize the list |
| Rule registry | Flat array | Flat array still fine | Category-based lazy loading |

For the initial 40 rules targeting Dockerfiles (typically 10-100 lines), performance will not be a concern.

---

## Sources

- [CodeMirror 6 Lint Example](https://codemirror.net/examples/lint/) -- `linter()` function, `Diagnostic` interface, `lintGutter()` (HIGH confidence)
- [CodeMirror 6 Language Package Example](https://codemirror.net/examples/lang-package/) -- StreamLanguage vs Lezer, custom language support (HIGH confidence)
- [CodeMirror 6 Reference Manual](https://codemirror.net/docs/ref/) -- EditorView, EditorState, Decoration API (HIGH confidence)
- [@codemirror/legacy-modes npm](https://www.npmjs.com/package/@codemirror/legacy-modes) -- Dockerfile mode confirmed v6.5.2 (HIGH confidence)
- [@codemirror/lint npm](https://www.npmjs.com/package/@codemirror/lint) -- v6.9.4, Diagnostic types (HIGH confidence)
- [dockerfile-ast GitHub](https://github.com/rcjsuen/dockerfile-ast) -- DockerfileParser.parse(), getInstructions(), getKeyword() API (HIGH confidence)
- [dockerfile-ast npm](https://www.npmjs.com/package/dockerfile-ast) -- v0.7.1, dependencies confirmed (HIGH confidence)
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) -- client:load, client:visible directives (HIGH confidence)
- [Nanostores GitHub](https://github.com/nanostores/nanostores) -- atom, subscribe, framework-agnostic state (HIGH confidence)
- [Astro Share State Between Islands](https://docs.astro.build/en/recipes/sharing-state-islands/) -- Nanostore pattern for cross-island communication (HIGH confidence)
- [CodeMirror 6 Document Change Listener](https://discuss.codemirror.net/t/codemirror-6-proper-way-to-listen-for-changes/2395) -- EditorView.updateListener, docChanged (MEDIUM confidence)
- [CodeMirror and React](https://thetrevorharmon.com/blog/codemirror-and-react/) -- ref-based mounting pattern (MEDIUM confidence)
- [CodeMirror 6 Bundle Size Discussion](https://discuss.codemirror.net/t/minimal-setup-because-by-default-v6-is-50kb-compared-to-v5/4514) -- ~75kb gzipped with basicSetup (MEDIUM confidence)
- Existing codebase files examined: `package.json`, `astro.config.mjs`, `src/layouts/Layout.astro`, `src/components/Header.astro`, `src/components/HeadSceneWrapper.astro`, `src/components/HeadScene.tsx`, `src/components/beauty-index/LanguageFilter.tsx`, `src/components/beauty-index/CodeComparisonTabs.tsx`, `src/components/beauty-index/ShareControls.astro`, `src/components/beauty-index/RadarChart.astro`, `src/stores/languageFilterStore.ts`, `src/stores/tabStore.ts`, `src/lib/beauty-index/schema.ts`

---

*Architecture research for: Dockerfile Analyzer Tool Integration*
*Researched: 2026-02-20*
