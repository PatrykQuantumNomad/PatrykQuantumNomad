# Phase 35: CodeMirror YAML Editor & Nanostores - Research

**Researched:** 2026-02-22
**Domain:** CodeMirror 6, @codemirror/lang-yaml, nanostores, Astro React islands, View Transitions lifecycle
**Confidence:** HIGH

## Summary

Phase 35 connects the Phase 34 compose validation engine to a CodeMirror 6 editor UI. The project already has a nearly identical implementation in the Dockerfile Analyzer (phases 22-27): a React island with `client:only="react"`, CodeMirror 6 editor with dark theme, nanostores for cross-component state, button-triggered analysis, and View Transitions lifecycle cleanup. The compose validator version follows the same architecture with two key differences: (1) YAML syntax highlighting via `@codemirror/lang-yaml` (native Lezer parser) instead of `@codemirror/legacy-modes` StreamLanguage, and (2) a new Cmd/Ctrl+Enter keyboard shortcut (EDIT-04) that the Dockerfile Analyzer lacks.

The validation pipeline is: user content -> `parseComposeYaml()` -> `runComposeEngine()` -> `computeComposeScore()` -> enrich violations with rule metadata -> write `ComposeAnalysisResult` to nanostore -> push `setDiagnostics` to CodeMirror. This mirrors the Dockerfile Analyzer's `EditorPanel.tsx` almost exactly, replacing `DockerfileParser.parse()` + `runRuleEngine()` + `computeScore()` with the compose equivalents.

The existing `editor-theme.ts`, `highlight-line.ts`, and nanostore patterns can be reused directly or with minor adaptation. The sample compose file must contain deliberate issues across all 5 rule categories (schema, semantic, security, best-practice, style) so users see meaningful results on first analysis.

**Primary recommendation:** Follow the Dockerfile Analyzer architecture 1:1 -- create a compose-specific nanostore, EditorPanel, ResultsPanel, and root ComposeValidator component. The only new patterns are `@codemirror/lang-yaml` (replacing legacy-modes) and `keymap.of([{key: "Mod-Enter", run}])` for the keyboard shortcut.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-01 | CodeMirror 6 editor with YAML syntax highlighting via @codemirror/lang-yaml | @codemirror/lang-yaml v6.1.2 exports `yaml()` as a native Lezer-based LanguageSupport -- replaces StreamLanguage pattern from Dockerfile Analyzer |
| EDIT-02 | Analyze button triggers lint cycle (not real-time as-you-type) | Existing pattern: `lintGutter()` without `linter()`, then `setDiagnostics()` on demand -- proven in Dockerfile Analyzer EditorPanel.tsx |
| EDIT-03 | Pre-loaded sample docker-compose.yml with deliberate issues across all 5 rule categories | Must trigger schema (e.g., unknown property), semantic (e.g., undefined network), security (e.g., privileged mode), best-practice (e.g., no healthcheck), and style (e.g., unquoted ports) violations |
| EDIT-04 | Keyboard shortcut (Cmd/Ctrl+Enter) to trigger analysis | CodeMirror `keymap.of([{key: "Mod-Enter", run}])` -- "Mod" maps to Cmd on macOS, Ctrl on Windows/Linux |
| EDIT-05 | Dark-only editor theme matching site aesthetic | Reuse existing `editor-theme.ts` from `src/lib/tools/dockerfile-analyzer/` -- same oneDarkTheme + a11ySyntaxHighlighting + editorTheme layers |
| EDIT-06 | Responsive layout -- stacked on mobile, side-by-side on desktop | Existing pattern: `grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6` in DockerfileAnalyzer.tsx |
| EDIT-07 | React island with client:only="react" directive | Existing pattern: `<DockerfileAnalyzer client:only="react" />` in Astro page |
| EDIT-08 | View Transitions lifecycle -- destroy/recreate EditorView on navigation | Existing pattern: `astro:before-swap` listener in `useCodeMirror` hook + React useEffect cleanup |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @codemirror/lang-yaml | ^6.1.2 | Native YAML syntax highlighting via Lezer parser | Official CodeMirror YAML package; provides `yaml()` LanguageSupport with folding, indentation, and highlighting out of the box |
| codemirror | ^6.0.2 | `basicSetup` bundle (already installed) | Provides line numbers, bracket matching, search, etc. |
| @codemirror/lint | (transitive via codemirror) | `lintGutter()` and `setDiagnostics()` | On-demand lint diagnostics without real-time linter |
| @codemirror/view | (transitive) | `EditorView`, `keymap` for custom keybindings | Core editor view and custom Mod-Enter shortcut |
| @codemirror/state | (transitive) | `EditorState` for editor state management | Core state layer |
| @codemirror/theme-one-dark | ^6.1.3 | Dark theme base (already installed) | Reuse existing oneDarkTheme integration |
| nanostores | ^1.1.0 | Cross-component state atoms (already installed) | `atom()` for analysis result, isAnalyzing, editorViewRef, resultsStale |
| @nanostores/react | ^1.0.0 | `useStore()` hook (already installed) | React binding for nanostore atoms |
| react | ^19.2.4 | UI framework (already installed) | React 19 for client:only islands |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @lezer/highlight | (transitive via @codemirror/lang-yaml) | `tags` for syntax highlighting definitions | Used by editor-theme.ts a11ySyntaxHighlighting |
| yaml | ^2.8.2 | YAML parsing (already installed, used by Phase 33-34) | Backend of compose validation pipeline |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @codemirror/lang-yaml | @codemirror/legacy-modes YAML mode | legacy-modes uses StreamLanguage (older pattern); lang-yaml is native Lezer with better folding/indentation. Requirements explicitly specify lang-yaml. |
| nanostores | zustand / jotai | Nanostores is already the project standard; tiny bundle; used across Dockerfile Analyzer. No reason to switch. |

**Installation:**
```bash
npm install @codemirror/lang-yaml
```

Only `@codemirror/lang-yaml` needs to be installed. All other packages (codemirror, @codemirror/theme-one-dark, nanostores, @nanostores/react, yaml, react) are already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── composeValidatorStore.ts          # Nanostore atoms (NEW)
├── lib/tools/compose-validator/
│   ├── use-codemirror-yaml.ts            # React hook for YAML CodeMirror (NEW)
│   ├── sample-compose.ts                 # Pre-loaded sample with deliberate issues (NEW)
│   ├── editor-theme.ts                   # REUSE from dockerfile-analyzer (import path)
│   ├── highlight-line.ts                 # REUSE from dockerfile-analyzer (import path)
│   ├── parser.ts                         # Already exists (Phase 33)
│   ├── engine.ts                         # Already exists (Phase 34)
│   ├── scorer.ts                         # Already exists (Phase 34)
│   └── types.ts                          # Already exists (Phase 33)
├── components/tools/
│   ├── ComposeValidator.tsx              # Root React island (NEW)
│   ├── ComposeEditorPanel.tsx            # Editor + Analyze button + keyboard shortcut (NEW)
│   └── ComposeResultsPanel.tsx           # Results display (NEW -- can reuse sub-components)
└── pages/tools/
    └── compose-validator/
        └── index.astro                   # Astro page with client:only="react" (NEW)
```

### Pattern 1: Nanostore Atoms for Cross-Component State
**What:** Separate store file with `atom()` calls for each piece of shared state
**When to use:** Always -- this is the established project pattern
**Example:**
```typescript
// src/stores/composeValidatorStore.ts
// Source: existing dockerfileAnalyzerStore.ts pattern
import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { ComposeAnalysisResult } from '../lib/tools/compose-validator/types';

/** Current analysis result -- null before first analysis */
export const composeResult = atom<ComposeAnalysisResult | null>(null);

/** Whether analysis is currently running */
export const composeAnalyzing = atom<boolean>(false);

/** EditorView ref -- set by ComposeEditorPanel on mount, read by ComposeResultsPanel */
export const composeEditorViewRef = atom<EditorView | null>(null);

/** Whether results are stale (doc changed after last analysis) */
export const composeResultsStale = atom<boolean>(false);
```

### Pattern 2: useCodeMirror Hook with YAML + Keyboard Shortcut
**What:** React hook that creates/destroys EditorView, handles View Transitions cleanup
**When to use:** In the ComposeEditorPanel component
**Example:**
```typescript
// src/lib/tools/compose-validator/use-codemirror-yaml.ts
// Source: existing use-codemirror.ts + @codemirror/lang-yaml docs
import { useRef, useEffect } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { yaml } from '@codemirror/lang-yaml';  // <-- Native Lezer, NOT StreamLanguage
import { lintGutter } from '@codemirror/lint';
import { editorTheme, oneDarkTheme, a11ySyntaxHighlighting } from '../dockerfile-analyzer/editor-theme';
import { highlightLineField } from '../dockerfile-analyzer/highlight-line';
import {
  composeEditorViewRef,
  composeResultsStale,
  composeResult,
} from '../../../stores/composeValidatorStore';

interface UseCodeMirrorYamlOptions {
  initialDoc: string;
  onAnalyze: () => void;  // Callback for Mod-Enter
}

export function useCodeMirrorYaml({ initialDoc, onAnalyze }: UseCodeMirrorYamlOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const analyzeRef = useRef(onAnalyze);
  analyzeRef.current = onAnalyze;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        basicSetup,
        yaml(),  // Native Lezer YAML -- replaces StreamLanguage.define(dockerFile)
        lintGutter(),
        // Custom keybinding BEFORE theme extensions for proper precedence
        keymap.of([{
          key: 'Mod-Enter',
          run: () => { analyzeRef.current(); return true; },
        }]),
        oneDarkTheme,
        a11ySyntaxHighlighting,
        editorTheme,
        highlightLineField,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': 'Docker Compose editor -- paste or type your docker-compose.yml here',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && composeResult.get() !== null) {
            composeResultsStale.set(true);
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
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
      document.removeEventListener('astro:before-swap', handleSwap);
      view.destroy();
      composeEditorViewRef.set(null);
      viewRef.current = null;
    };
  }, []);

  return { containerRef, viewRef };
}
```

### Pattern 3: Root React Island with Responsive Grid
**What:** Top-level component composed of EditorPanel + ResultsPanel in a responsive grid
**When to use:** As the `client:only="react"` entry point in the Astro page
**Example:**
```typescript
// src/components/tools/ComposeValidator.tsx
// Source: existing DockerfileAnalyzer.tsx pattern
import ComposeEditorPanel from './ComposeEditorPanel';
import ComposeResultsPanel from './ComposeResultsPanel';

export default function ComposeValidator() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <div className="min-h-[350px] lg:min-h-[500px]">
        <ComposeEditorPanel />
      </div>
      <div className="min-h-[200px] lg:min-h-[500px]">
        <ComposeResultsPanel />
      </div>
    </div>
  );
}
```

### Pattern 4: Astro Page with client:only="react"
**What:** Astro page that hosts the React island with no SSR
**When to use:** For the compose validator tool page
**Example:**
```astro
---
// src/pages/tools/compose-validator/index.astro
// Source: existing dockerfile-analyzer/index.astro pattern
import Layout from '../../../layouts/Layout.astro';
import ComposeValidator from '../../../components/tools/ComposeValidator';
---
<Layout title="Docker Compose Validator | Patryk Golabek" description="...">
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <h1 class="text-3xl sm:text-4xl font-heading font-bold mb-2">
      Docker Compose Validator
    </h1>
    <p class="text-[var(--color-text-secondary)] mb-8">
      Paste your docker-compose.yml below and click <strong>Analyze</strong>.
      100% client-side, your code never leaves your browser.
    </p>
    <ComposeValidator client:only="react" />
  </section>
</Layout>
```

### Pattern 5: EditorPanel Analysis Pipeline
**What:** The analyze function that wires parser -> engine -> scorer -> nanostore -> diagnostics
**When to use:** In ComposeEditorPanel on button click or Mod-Enter
**Example:**
```typescript
// Inside ComposeEditorPanel.tsx analyzeRef.current callback
// Source: existing EditorPanel.tsx pattern adapted for compose pipeline
import { parseComposeYaml } from '../../lib/tools/compose-validator/parser';
import { runComposeEngine } from '../../lib/tools/compose-validator/engine';
import { computeComposeScore } from '../../lib/tools/compose-validator/scorer';
import { getComposeRuleById } from '../../lib/tools/compose-validator/rules';
import { getSchemaRuleById } from '../../lib/tools/compose-validator/rules/schema';
import { setDiagnostics } from '@codemirror/lint';

const content = view.state.doc.toString();
const parseResult = parseComposeYaml(content);
const { violations, rulesRun } = runComposeEngine(parseResult, content);
const score = computeComposeScore(violations);

// Convert to CodeMirror Diagnostics
const diagnostics = violations.map((v) => {
  const rule = getComposeRuleById(v.ruleId) ?? getSchemaRuleById(v.ruleId);
  const severity = rule?.severity === 'error' ? 'error'
    : rule?.severity === 'warning' ? 'warning' : 'info';
  const line = view.state.doc.line(v.line);
  return {
    from: line.from + (v.column - 1),
    to: v.endLine ? view.state.doc.line(v.endLine).to : line.to,
    severity,
    message: `[${v.ruleId}] ${v.message}`,
    source: 'compose-validator',
  };
});
view.dispatch(setDiagnostics(view.state, diagnostics));

// Enrich violations and write to nanostore
const enriched = violations.map((v) => {
  const rule = getComposeRuleById(v.ruleId) ?? getSchemaRuleById(v.ruleId);
  return {
    ...v,
    severity: rule?.severity ?? 'info',
    category: rule?.category ?? 'schema',
    title: rule?.title ?? v.ruleId,
    explanation: rule?.explanation ?? '',
    fix: rule?.fix ?? { description: '', beforeCode: '', afterCode: '' },
  };
});
composeResult.set({ violations: enriched, score, parseSuccess: parseResult.parseSuccess, timestamp: Date.now() });
```

### Anti-Patterns to Avoid
- **Do NOT use `linter()` for real-time linting:** EDIT-02 explicitly requires button-triggered only. Use `lintGutter()` without `linter()` and push via `setDiagnostics()`.
- **Do NOT create a new editor-theme.ts:** Reuse the existing one from `src/lib/tools/dockerfile-analyzer/editor-theme.ts`. The theme is not Dockerfile-specific -- it is site-wide.
- **Do NOT put EditorView in React state:** Store it in a `useRef`, not `useState`. EditorView is not serializable and should not trigger re-renders.
- **Do NOT skip the `astro:before-swap` cleanup:** Without it, navigating away with View Transitions leaves an orphaned EditorView that leaks memory.
- **Do NOT put the analyze callback in useEffect deps:** The existing pattern uses a `ref` wrapper to avoid recreating the editor on every render.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML syntax highlighting | Custom token parser | `@codemirror/lang-yaml` `yaml()` | Native Lezer parser handles all YAML edge cases (anchors, merge keys, multi-line strings, flow mappings) |
| Dark editor theme | New theme from scratch | Import existing `editor-theme.ts` from dockerfile-analyzer | WCAG AA-compliant theme already built and tested |
| Click-to-navigate line highlighting | Custom decoration logic | Import existing `highlight-line.ts` from dockerfile-analyzer | StateField + effects pattern already proven |
| Cross-platform keyboard shortcut detection | Manual keyCode/metaKey checking | CodeMirror `keymap.of([{key: "Mod-Enter"}])` | "Mod" automatically maps to Cmd on macOS, Ctrl on Windows/Linux |
| Nanostore atoms | Custom event bus or context | `nanostores` `atom()` + `@nanostores/react` `useStore()` | Already the project standard; 265 bytes |
| YAML parsing + validation pipeline | Custom YAML linting | `parseComposeYaml()` -> `runComposeEngine()` -> `computeComposeScore()` from Phase 33-34 | 52 rules, schema validation, scoring already implemented |

**Key insight:** 90% of this phase is wiring together existing patterns from the Dockerfile Analyzer and the Phase 33-34 compose validation engine. The only genuinely new code is: (1) the `yaml()` language extension swap, (2) the `keymap.of` for Mod-Enter, and (3) the sample compose file with deliberate issues.

## Common Pitfalls

### Pitfall 1: Editor Theme Import Paths
**What goes wrong:** Creating a duplicate editor-theme.ts in the compose-validator directory instead of importing the existing one.
**Why it happens:** Developers see the Dockerfile Analyzer structure and copy rather than import.
**How to avoid:** Import from `../../dockerfile-analyzer/editor-theme` -- the theme is tool-agnostic.
**Warning signs:** A second `editor-theme.ts` file appearing in the compose-validator directory.

### Pitfall 2: Stale analyzeRef After Re-render
**What goes wrong:** The analyze callback captures stale closure state because it is in useEffect deps, causing the editor to be destroyed and recreated.
**Why it happens:** Putting the analyze callback directly in the useEffect dependencies array.
**How to avoid:** Use a `useRef` to hold the analyze callback (the `analyzeRef` pattern from the existing EditorPanel.tsx). Update `analyzeRef.current` on every render, but keep the useEffect deps array empty.
**Warning signs:** Editor flickering or losing content on every button click.

### Pitfall 3: Missing Schema Rule Lookup in Enrichment
**What goes wrong:** Violations from schema rules (CV-S001 through CV-S008) are not enriched because `getComposeRuleById()` only searches the 44 custom rules, not the 8 schema rules.
**Why it happens:** Schema rules use `SchemaRuleMetadata` (no `check()` method) and live in a separate registry.
**How to avoid:** Look up rules from both registries: `getComposeRuleById(id) ?? getSchemaRuleById(id)`.
**Warning signs:** Schema violations showing with default severity/category instead of their correct metadata.

### Pitfall 4: Diagnostic `from`/`to` Out of Range
**What goes wrong:** `setDiagnostics` crashes with "Position out of range" when a violation reports a line number beyond the editor's document length.
**Why it happens:** The sample compose file may be shorter than expected, or a rule reports a line from an earlier document state.
**How to avoid:** Clamp line numbers: `Math.min(v.line, view.state.doc.lines)`. The existing Dockerfile Analyzer's `highlightAndScroll` already does this clamping.
**Warning signs:** Console errors about invalid positions after analysis.

### Pitfall 5: keymap.of Precedence
**What goes wrong:** The Mod-Enter keybinding is swallowed by basicSetup's default keybindings before reaching the custom handler.
**Why it happens:** basicSetup includes default keymaps that might intercept Enter combinations.
**How to avoid:** Place the custom `keymap.of()` extension BEFORE `basicSetup` in the extensions array, or at least before other keymaps. Keymaps earlier in the array take precedence.
**Warning signs:** Pressing Cmd/Ctrl+Enter does nothing or inserts a newline.

### Pitfall 6: View Transitions Leaving Orphaned EditorView
**What goes wrong:** Navigating away from the compose validator page via View Transitions leaves the EditorView in memory because React cleanup runs after the DOM swap.
**Why it happens:** Astro's View Transitions replace the DOM before React's useEffect cleanup fires.
**How to avoid:** Add both the `astro:before-swap` event listener AND the useEffect cleanup return. The existing `use-codemirror.ts` pattern does both -- follow it exactly.
**Warning signs:** Memory leaks visible in DevTools, or stale nanostore values on return navigation.

### Pitfall 7: Sample Compose File Missing Rule Categories
**What goes wrong:** The sample file only triggers violations from 2-3 categories instead of all 5, making the initial user experience less impressive.
**Why it happens:** Forgetting to include issues from less obvious categories like style (unquoted ports) or schema (unknown properties).
**How to avoid:** Validate the sample file through the engine during development and verify violations span all 5 categories: schema, semantic, security, best-practice, style.
**Warning signs:** The category breakdown in the results panel shows 0% deductions for some categories.

## Code Examples

### Installing the New Dependency
```bash
npm install @codemirror/lang-yaml
```

### yaml() vs StreamLanguage (Key Difference from Dockerfile Analyzer)
```typescript
// Dockerfile Analyzer (OLD pattern -- DO NOT use for compose validator):
import { StreamLanguage } from '@codemirror/language';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
// ...
extensions: [StreamLanguage.define(dockerFile), ...]

// Compose Validator (NEW pattern):
import { yaml } from '@codemirror/lang-yaml';
// ...
extensions: [yaml(), ...]  // Native Lezer parser, includes folding + indentation
```

### Custom Keyboard Shortcut
```typescript
// Source: CodeMirror docs - https://codemirror.net/examples/config/
import { keymap } from '@codemirror/view';

keymap.of([{
  key: 'Mod-Enter',  // Cmd on macOS, Ctrl on Windows/Linux
  run: (view) => {
    analyzeRef.current();
    return true;  // Return true to indicate the key was handled
  },
}])
```

### Compose Validation Pipeline (Full Flow)
```typescript
// Source: Phase 34 engine.ts + Phase 33 parser.ts
import { parseComposeYaml } from './parser';
import { runComposeEngine } from './engine';
import { computeComposeScore } from './scorer';

const rawText = view.state.doc.toString();
const parseResult = parseComposeYaml(rawText);
const { violations, rulesRun } = runComposeEngine(parseResult, rawText);
const score = computeComposeScore(violations);
```

### Sample Compose File Structure (Deliberate Issues)
```typescript
// src/lib/tools/compose-validator/sample-compose.ts
// Must trigger violations across ALL 5 rule categories
export const SAMPLE_COMPOSE = `# Docker Compose file with common issues -- paste yours to analyze!

version: "3.8"                          # CV-B006: deprecated version field
                                        # CV-B007: missing project name
servces:                                # CV-S002: unknown top-level property (typo)
  web:
    image: nginx:latest                 # CV-C014: image uses latest tag
                                        # CV-B004: mutable tag
    ports:
      - 8080:80                         # CV-F002: port not quoted
      - "8443:443"                      # (correct, for contrast)
    privileged: true                    # CV-C001: privileged mode (CWE-250)
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # CV-C002: Docker socket
    environment:
      DB_PASSWORD: supersecret123       # CV-C008: secret in env var
    depends_on:
      - api
    networks:
      - frontend
      - nonexistent                     # CV-M003: undefined network reference

  api:
    image: myapp
    ports:
      - 8080:3000                       # CV-M001: duplicate host port 8080
    depends_on:
      - worker
    network_mode: host                  # CV-C003: host network mode

  worker:
    image: myapp:v1.2.3
    depends_on:
      - api                             # CV-M002: circular dependency (api->worker->api)

networks:
  frontend:
    driver: bridge
  backend:                              # CV-M007: orphan network (never referenced)
    driver: bridge

volumes:
  data:                                 # CV-M008: orphan volume (never referenced)
    driver: local
`;
// Expected: violations from schema, semantic, security, best-practice, style
```

### Nanostore Atom Pattern
```typescript
// Source: existing dockerfileAnalyzerStore.ts
import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { ComposeAnalysisResult } from '../lib/tools/compose-validator/types';

export const composeResult = atom<ComposeAnalysisResult | null>(null);
export const composeAnalyzing = atom<boolean>(false);
export const composeEditorViewRef = atom<EditorView | null>(null);
export const composeResultsStale = atom<boolean>(false);
```

### ResultsPanel useStore Pattern
```typescript
// Source: existing ResultsPanel.tsx
import { useStore } from '@nanostores/react';
import { composeResult, composeAnalyzing, composeResultsStale } from '../../stores/composeValidatorStore';

export default function ComposeResultsPanel() {
  const result = useStore(composeResult);
  const analyzing = useStore(composeAnalyzing);
  const stale = useStore(composeResultsStale);
  // ... render logic mirrors Dockerfile Analyzer ResultsPanel
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@codemirror/legacy-modes` StreamLanguage for YAML | `@codemirror/lang-yaml` native Lezer parser | Available since CodeMirror 6 lang-yaml v6.0.0 | Better folding, indentation, and tree-sitter-like parsing |
| Separate `linter()` function for real-time linting | `lintGutter()` + `setDiagnostics()` for on-demand | Always available in @codemirror/lint | Appropriate for button-triggered analysis (EDIT-02) |

**Deprecated/outdated:**
- CodeMirror 5 API: This project uses CodeMirror 6 exclusively
- `StreamLanguage.define()` for YAML: While it works, `@codemirror/lang-yaml` is the modern replacement with native tree parsing

## Open Questions

1. **Should the editor-theme.ts be moved to a shared location?**
   - What we know: Both tools import from `src/lib/tools/dockerfile-analyzer/editor-theme.ts`. The theme is not Dockerfile-specific.
   - What's unclear: Whether to extract to a shared utils directory or keep importing cross-tool.
   - Recommendation: Import from the existing location for now. Refactoring to `src/lib/shared/editor-theme.ts` can be a follow-up. This avoids scope creep in Phase 35.

2. **Should the ComposeResultsPanel reuse sub-components from the Dockerfile Analyzer?**
   - What we know: The Dockerfile Analyzer has ScoreGauge, CategoryBreakdown, ViolationList, EmptyState components. The compose validator's results panel will need similar UI.
   - What's unclear: Whether the existing components are generic enough or Dockerfile-specific.
   - Recommendation: Reuse ScoreGauge and EmptyState directly (they accept score/grade props). CategoryBreakdown and ViolationList may need type adjustments for `ComposeCategory` vs `RuleCategory`. Create compose-specific wrappers if types differ.

3. **Should the sample compose file be YAML or a TypeScript template literal?**
   - What we know: The Dockerfile Analyzer uses a TypeScript template literal in `sample-dockerfile.ts`.
   - What's unclear: Whether a .yml file or a .ts export is more maintainable.
   - Recommendation: Follow the existing pattern -- use a TypeScript template literal export in `sample-compose.ts`. This avoids build-time file loading complexity and is consistent.

## Sources

### Primary (HIGH confidence)
- **Existing codebase**: `src/lib/tools/dockerfile-analyzer/` -- editor-theme.ts, use-codemirror.ts, highlight-line.ts, sample-dockerfile.ts, EditorPanel.tsx, ResultsPanel.tsx, DockerfileAnalyzer.tsx
- **Existing codebase**: `src/stores/dockerfileAnalyzerStore.ts` -- nanostore atom pattern
- **Existing codebase**: `src/lib/tools/compose-validator/` -- parser.ts, engine.ts, scorer.ts, types.ts, rules/index.ts, schema-validator.ts (Phase 33-34 output)
- **Existing codebase**: `src/pages/tools/dockerfile-analyzer/index.astro` -- Astro page with client:only="react"
- [GitHub: codemirror/lang-yaml](https://github.com/codemirror/lang-yaml) -- YAML language support, v6.1.2, exports yaml(), yamlLanguage, yamlFrontmatter()
- [CodeMirror Configuration Example](https://codemirror.net/examples/config/) -- keymap.of() API for custom keybindings

### Secondary (MEDIUM confidence)
- [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) -- lifecycle events (astro:before-swap) for cleanup
- [nanostores/nanostores GitHub](https://github.com/nanostores/nanostores) -- atom() API, 265 bytes bundle size
- [nanostores/react GitHub](https://github.com/nanostores/react) -- useStore() hook

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Only 1 new package (`@codemirror/lang-yaml`); all others already installed and proven
- Architecture: HIGH -- Follows existing Dockerfile Analyzer patterns 1:1; codebase inspected directly
- Pitfalls: HIGH -- Derived from actual codebase patterns and CodeMirror documentation; all verified

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable ecosystem, no fast-moving dependencies)
