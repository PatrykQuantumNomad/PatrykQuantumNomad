# Stack Research: Dockerfile Analyzer Tool

**Domain:** Interactive browser-based Dockerfile analysis tool for static Astro 5 portfolio site
**Researched:** 2026-02-20
**Confidence:** HIGH

## Existing Stack (DO NOT reinstall)

Already present in `package.json` -- validated and working:

| Technology | Version | Role in Dockerfile Analyzer |
|------------|---------|----------------------------|
| Astro | ^5.3.0 | Static page at `/tools/dockerfile-analyzer`, island hydration |
| React 19 | ^19.2.4 | Interactive editor island via `@astrojs/react` |
| Tailwind CSS | ^3.4.19 | Editor wrapper, results panel, responsive layout |
| TypeScript | ^5.9.3 | Rule engine types, CodeMirror extension types, AST types |
| Nanostores | ^1.1.0 | Shared state between editor island and results panel |
| @nanostores/react | ^1.0.0 | React bindings for nanostores |

## Recommended Additions

### 1. CodeMirror 6 Core -- Code Editor

CodeMirror 6 is highly modular. DO NOT install the `codemirror` meta-package blindly -- it pulls in `@codemirror/autocomplete`, `@codemirror/search`, and `@codemirror/lint` as dependencies, all of which we actually need. For our use case (an editor with Dockerfile highlighting, lint gutter, and line numbers), the `codemirror` meta-package is the right entry point.

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `codemirror` | `^6.0.2` | Meta-package: re-exports `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/search`, `@codemirror/autocomplete`, `@codemirror/lint` | ~135 KB gzipped with basicSetup; ~75 KB gzipped with minimalSetup |
| `@codemirror/legacy-modes` | `^6.5.2` | Dockerfile syntax mode via `StreamLanguage.define()` | ~2 KB (only the dockerfile mode file is bundled, tree-shaking drops all other modes) |
| `@codemirror/lint` | `^6.9.4` | Custom linter integration for Dockerfile rules, `lintGutter()` | Included via `codemirror` meta-package |
| `@codemirror/theme-one-dark` | `^6.1.3` | Dark theme for the editor (matches portfolio dark mode) | ~3 KB gzipped |

**Why these specific packages:**

- **`codemirror` meta-package over individual `@codemirror/*` packages:** The meta-package ensures compatible versions across all core modules. Individual package installation risks version mismatches between `@codemirror/state`, `@codemirror/view`, etc. The `codemirror` package exports `minimalSetup` and `basicSetup` -- we use `basicSetup` because it includes line numbers, bracket matching, and fold gutter, all of which are expected in a Dockerfile editor.
- **`@codemirror/legacy-modes` for Dockerfile syntax:** There is NO `@codemirror/lang-dockerfile` package. Dockerfile support exists only as a legacy mode ported from CodeMirror 5. The integration pattern is `StreamLanguage.define(dockerfile)` where `dockerfile` is imported from `@codemirror/legacy-modes/mode/dockerfile`. This is the official, documented approach.
- **`@codemirror/lint` for inline diagnostics:** Already included in the `codemirror` meta-package. Provides `linter()` function that accepts a `LintSource` -- a function that receives the `EditorView` and returns `Diagnostic[]`. Each diagnostic has `from`, `to` (character positions), `severity` ("error" | "warning" | "info"), and `message`. The `lintGutter()` extension adds gutter markers. This is exactly what we need to display Dockerfile analysis results inline.
- **`@codemirror/theme-one-dark` for dark mode:** The portfolio site has dark mode. CodeMirror requires explicit theme extensions -- it does not inherit page CSS. `one-dark` is the official dark theme. For light mode, CodeMirror's default (no theme extension) is a clean light theme. We switch themes dynamically using `EditorView.theme()` compartments.

**CodeMirror 6 architecture note:** CodeMirror 6 uses its own internal CSS-in-JS system. It does NOT require a separate CSS file import. Styles are injected into the DOM automatically when the editor mounts. This plays nicely with Astro islands -- the editor is self-contained.

**Confidence:** HIGH -- verified via [npm registry](https://registry.npmjs.org/codemirror/latest), [@codemirror/legacy-modes README](https://github.com/codemirror/legacy-modes/blob/main/README.md), [CodeMirror bundling docs](https://codemirror.net/examples/bundle/), [CodeMirror lint example](https://codemirror.net/examples/lint/).

### 2. React Integration -- Vanilla useRef/useEffect (NOT a wrapper library)

| Decision | Rationale |
|----------|-----------|
| Use vanilla CodeMirror + `useRef`/`useEffect` | NOT `@uiw/react-codemirror` |

**Why NOT `@uiw/react-codemirror`:**

1. **Unnecessary abstraction overhead.** `@uiw/react-codemirror` adds `@babel/runtime`, `@uiw/codemirror-extensions-basic-setup` (their own fork of basicSetup), and `@codemirror/theme-one-dark` as hard dependencies. While `@babel/runtime` is already in our tree, the wrapper adds ~15 KB of its own code for features we do not need (controlled mode, onChange handler that converts between React state and CodeMirror state).
2. **Re-render performance concern.** The wrapper has known re-render issues documented in community discussions. Our use case is simple: the editor is a single instance, mounted once, never unmounted during page lifecycle. The vanilla approach avoids React reconciliation overhead entirely.
3. **We need direct access to `EditorView`.** The Dockerfile analyzer must read the document from CodeMirror, pass it to `dockerfile-ast`, and then push diagnostics back via `linter()`. This requires direct `EditorView` access. With `@uiw/react-codemirror`, you get this via a ref callback, but the indirection adds complexity without benefit.
4. **The existing codebase pattern supports this.** The `CodeComparisonTabs.tsx` component already uses `useRef`, `useEffect`, and direct DOM manipulation. A vanilla CodeMirror island follows the same pattern.

**Vanilla React integration pattern (what to implement):**

```typescript
import { useRef, useEffect } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { dockerfile } from '@codemirror/legacy-modes/mode/dockerfile';
import { linter, lintGutter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';

function DockerfileEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: '# Paste your Dockerfile here\nFROM ubuntu:latest\n',
        extensions: [
          basicSetup,
          StreamLanguage.define(dockerfile),
          lintGutter(),
          linter(dockerfileLinter),  // custom linter function
          oneDark,                    // or conditionally based on theme
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => view.destroy();
  }, []);

  return <div ref={containerRef} />;
}
```

**Confidence:** HIGH -- this is the pattern recommended by [CodeMirror's own documentation](https://codemirror.net/docs/guide/) and used by major projects like CodePen's CM6 integration.

### 3. dockerfile-ast -- Dockerfile Parsing

| Property | Value |
|----------|-------|
| **Package** | `dockerfile-ast` |
| **Version** | `^0.7.1` (latest, published August 2024) |
| **Purpose** | Parse Dockerfile text into an AST with typed instruction nodes |
| **Bundle impact** | ~35 KB gzipped (239 KB unpacked, includes 74 compiled JS files) |

**Why dockerfile-ast:**

- **TypeScript-first.** Written in TypeScript with full type definitions shipped. Exports `DockerfileParser.parse(content: string): Dockerfile` which returns a fully typed AST.
- **Browser-safe. Verified.** I audited all 34 source files -- zero imports of `fs`, `path`, `os`, `child_process`, or any Node.js-specific module. The only dependencies are `vscode-languageserver-textdocument` and `vscode-languageserver-types`, both of which have explicit `"browser"` export fields in their `package.json` pointing to ESM bundles. Vite will resolve these correctly.
- **Rich AST for rule implementation.** The AST exposes `getInstructions()` returning typed objects for each Dockerfile instruction (FROM, RUN, COPY, etc.) with line ranges, arguments, flags, and heredoc support. Each instruction knows its `Keyword` type, making rule implementation straightforward.
- **Same AST approach as Hadolint.** Hadolint (the industry-standard Dockerfile linter, written in Haskell) also parses into an AST and runs rules against it. Our TypeScript rule engine follows the same architectural pattern, just in the browser.

**Key API surface for our rule engine:**

```typescript
import { DockerfileParser } from 'dockerfile-ast';

const dockerfile = DockerfileParser.parse(editorContent);

// Iterate instructions
for (const instruction of dockerfile.getInstructions()) {
  const keyword = instruction.getKeyword();     // "FROM", "RUN", etc.
  const range = instruction.getRange();          // { start: {line, character}, end: {line, character} }
  const args = instruction.getArguments();       // Argument[] with ranges
  // Apply rules...
}

// Access specific instruction types
const froms = dockerfile.getFROMs();             // From[] with image name, tag, digest
const runs = dockerfile.getRUNs();               // ... (not available, iterate and filter)
const envs = dockerfile.getENVs();               // Env[] with key-value pairs
```

**Dependency chain concern -- `vscode-languageserver-types`:**

This package (`^3.17.3`) defines LSP types like `Range`, `Position`, `TextDocumentIdentifier`. It is ~50 KB unpacked but has ZERO dependencies of its own. It will not pull in VS Code or any server-side code. The `"browser"` export field routes to `./lib/esm/main.js`. No polyfills needed.

**Confidence:** HIGH -- verified via [npm registry](https://registry.npmjs.org/dockerfile-ast/latest), [GitHub source audit](https://github.com/rcjsuen/dockerfile-ast), [vscode-languageserver-textdocument exports](https://registry.npmjs.org/vscode-languageserver-textdocument/latest) showing `"browser": "./lib/esm/main.js"`.

## Architecture Integration: Astro Island Strategy

### Which client directive to use: `client:idle`

| Directive | What It Does | Why NOT for Us |
|-----------|-------------|----------------|
| `client:load` | Hydrates immediately on page load | Overkill. The editor is the main content but the user needs to read the intro text first. Saves ~200ms of main-thread blocking on mobile. |
| `client:visible` | Hydrates when scrolled into viewport | Risky. If the editor IS above the fold (which it will be on desktop), `client:visible` fires immediately anyway, adding IntersectionObserver overhead. On mobile where it might be below fold, we want it ready by the time the user scrolls -- `client:idle` achieves this. |
| **`client:idle`** | **Hydrates once browser is idle (requestIdleCallback)** | **Correct choice.** Lets the static shell (page title, description, example templates) render instantly, then hydrates the editor + parser during idle time. The user reads the intro while the ~350 KB of JS loads. On fast connections this is imperceptible. On slow connections it prevents blocking the initial paint. |
| `client:only="react"` | Renders only on client, no SSR | Viable but loses the static HTML shell. With `client:idle`, Astro renders a placeholder div server-side, and the editor materializes during idle. With `client:only`, there is a visible flash of nothing. |

**Pattern for the page:**

```astro
---
// src/pages/tools/dockerfile-analyzer.astro
import Layout from '../../layouts/Layout.astro';
import DockerfileAnalyzer from '../../components/tools/DockerfileAnalyzer';
---

<Layout title="Dockerfile Analyzer" description="...">
  <!-- Static content: title, description, methodology -->
  <section class="...">
    <h1>Dockerfile Analyzer</h1>
    <p>Paste your Dockerfile to get instant best-practice analysis...</p>
  </section>

  <!-- Interactive island: editor + results panel -->
  <DockerfileAnalyzer client:idle />

  <!-- Static content: rules explanation, methodology, SEO content -->
  <section class="...">
    <h2>Rules</h2>
    ...
  </section>
</Layout>
```

### State Management: Nanostores (existing)

The analyzer needs shared state between:
1. The CodeMirror editor (document content)
2. The analysis results panel (diagnostics)
3. Optional: template selector (loads example Dockerfiles)

Use the **existing nanostores pattern** from `src/stores/tabStore.ts` and `src/stores/languageFilterStore.ts`:

```typescript
// src/stores/dockerfileStore.ts
import { atom, computed } from 'nanostores';

export const dockerfileContent = atom<string>('');
export const analysisResults = atom<Diagnostic[]>([]);
export const isAnalyzing = atom<boolean>(false);
export const selectedTemplate = atom<string | null>(null);
```

**Confidence:** HIGH -- follows established codebase patterns.

## Bundle Size Analysis

### Total New Client JS Estimate

| Component | Gzipped Size | Notes |
|-----------|-------------|-------|
| CodeMirror core (basicSetup) | ~135 KB | state, view, commands, language, search, autocomplete, lint |
| @codemirror/legacy-modes (dockerfile only) | ~2 KB | Tree-shaking drops all other 100+ modes |
| @codemirror/theme-one-dark | ~3 KB | Conditional: only loaded in dark mode |
| dockerfile-ast + deps | ~35 KB | vscode-languageserver-textdocument + types |
| Custom rule engine | ~15 KB | Estimate for 20-30 rules with descriptions |
| React island overhead | ~2 KB | useRef/useEffect wrapper, minimal |
| **Total** | **~192 KB gzipped** | **Loaded only on /tools/dockerfile-analyzer** |

This is well under the 350 KB budget mentioned in the project context. The actual total is ~192 KB gzipped, not 350 KB.

### Bundling Considerations for Astro/Vite

**No custom Vite configuration needed.** Astro's default Vite config handles this correctly because:

1. **Island isolation.** The `client:idle` directive creates a separate entry point for the analyzer island. Vite automatically code-splits this into its own chunk(s). Other pages pay ZERO cost.
2. **Tree-shaking.** `@codemirror/legacy-modes` exports each mode as a separate file (`mode/dockerfile.js`). Vite/Rollup's tree-shaking will include only the dockerfile mode, not the 100+ other modes.
3. **Vendor chunk splitting.** Vite automatically splits `node_modules` imports into vendor chunks. CodeMirror packages will land in a shared vendor chunk if they are used by multiple islands (unlikely in our case -- only one page uses CodeMirror).
4. **No SSR complications.** `dockerfile-ast`'s dependencies (`vscode-languageserver-textdocument`, `vscode-languageserver-types`) have `"browser"` export conditions. Vite resolves these during build. No `ssr.noExternal` config needed because the analyzer component runs client-only.

**Optional optimization (NOT required for MVP):**

If Lighthouse audits show the ~192 KB chunk blocking LCP on mobile, split CodeMirror into a lazy chunk:

```typescript
// Lazy-load CodeMirror only when user clicks "Open Editor"
const loadEditor = async () => {
  const { EditorView, basicSetup } = await import('codemirror');
  const { StreamLanguage } = await import('@codemirror/language');
  const { dockerfile } = await import('@codemirror/legacy-modes/mode/dockerfile');
  // ... initialize
};
```

This is a performance escape hatch, not the default approach. `client:idle` already defers loading until the browser is idle.

## Installation

```bash
# CodeMirror 6 (editor + syntax + linting + theme)
npm install codemirror@^6.0.2 @codemirror/legacy-modes@^6.5.2 @codemirror/theme-one-dark@^6.1.3

# Dockerfile parser (browser-compatible)
npm install dockerfile-ast@^0.7.1
```

**Total new packages: 4 direct dependencies**
**Transitive dependencies added: ~7 (`@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/search`, `@codemirror/autocomplete`, `@codemirror/lint` -- all pulled by `codemirror` meta-package, plus `vscode-languageserver-textdocument`, `vscode-languageserver-types` pulled by `dockerfile-ast`)**
**No dev dependencies needed** (types are included in all packages)

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Editor | CodeMirror 6 (vanilla) | Monaco Editor | Monaco is ~2.5 MB, designed for full IDE experiences. Overkill for a single-file Dockerfile editor. Also difficult to bundle -- requires worker files and has SSR complications. |
| Editor | CodeMirror 6 (vanilla) | Prism.js + textarea | No real editing experience. No line numbers, no bracket matching, no gutter. We need inline diagnostics which Prism cannot do. |
| Editor | CodeMirror 6 (vanilla) | Ace Editor | Legacy. CodeMirror 6 is the modern standard with better tree-shaking and modular architecture. |
| React wrapper | Vanilla useRef/useEffect | @uiw/react-codemirror | Adds ~15 KB wrapper code, @babel/runtime dependency, known re-render issues. Our use case is a single editor instance mounted once -- wrapper provides no benefit. |
| React wrapper | Vanilla useRef/useEffect | @codemirror-toolkit/react | Lighter (1.5 KB) but still an unnecessary abstraction for a single-instance editor. |
| Dockerfile parser | dockerfile-ast | Custom regex parser | Would miss edge cases: multi-line RUN with `\`, heredoc syntax, escape directives, variable resolution. dockerfile-ast handles all of these correctly. |
| Dockerfile parser | dockerfile-ast | dockerfilelint (npm) | Last published 2019, 4 years abandoned. Uses Node.js `fs` module. Not browser-compatible. |
| Dockerfile parser | dockerfile-ast | hadolint (WASM) | Hadolint is Haskell. WASM compilation would be ~5 MB. Not viable for a client-side tool on a portfolio site. |
| Dockerfile rules | Custom TypeScript rules | hadolint-wasm | See above. Also, custom rules allow portfolio-specific explanations and educational content. |
| Client directive | client:idle | client:load | Blocks initial paint with ~192 KB. No benefit since user reads intro text first. |
| Client directive | client:idle | client:visible | If editor is above fold (desktop), fires immediately with IntersectionObserver overhead. If below fold (mobile), client:idle fires sooner during scroll. |
| State management | Nanostores (existing) | React Context / useState | Would work but Nanostores is already in the project and provides cross-island state sharing if we later split the analyzer into multiple islands. |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Monaco Editor** | 2.5 MB bundle, worker file complexity, SSR issues | CodeMirror 6 (~135 KB gzipped) |
| **@uiw/react-codemirror** | Unnecessary abstraction for single-instance editor, re-render overhead | Vanilla `useRef`/`useEffect` pattern |
| **`codemirror` basicSetup import without lint** | `basicSetup` does NOT include lint -- `lintGutter()` and `linter()` must be added explicitly to extensions | Import `lintGutter` and `linter` from `@codemirror/lint` (already available via `codemirror` dep) |
| **dockerfilelint (npm)** | Abandoned (2019), uses Node.js `fs`, not browser-compatible | `dockerfile-ast` + custom rules |
| **hadolint WASM** | ~5 MB WASM binary, impractical for portfolio site | `dockerfile-ast` + custom rules implementing hadolint-inspired DL rule subset |
| **Any CSS framework for the editor** | CodeMirror 6 has built-in CSS-in-JS | Use `EditorView.theme()` for customization |
| **Separate Dockerfile language server** | LSP is for IDE integrations, not browser tools | Direct `dockerfile-ast` parsing in the client |
| **Web Workers for parsing** | dockerfile-ast parses a typical Dockerfile in <5ms. Worker overhead (serialization/deserialization, message passing) would ADD latency | Direct main-thread parsing with `requestIdleCallback` debounce |

## Version Compatibility Matrix

| Package | Version | Compatible With | Verified |
|---------|---------|-----------------|----------|
| codemirror | ^6.0.2 | All @codemirror/* ^6.x packages (meta-package pins compatible ranges) | npm registry, exports field |
| @codemirror/legacy-modes | ^6.5.2 | @codemirror/language ^6.0.0 (peer dep) | npm registry |
| @codemirror/theme-one-dark | ^6.1.3 | @codemirror/view ^6.0.0, @codemirror/language ^6.0.0 | npm registry |
| dockerfile-ast | ^0.7.1 | Browser (ESM via Vite), no Node.js APIs used | Source audit of all 34 .ts files |
| vscode-languageserver-textdocument | ^1.0.8 (transitive) | Browser: `"browser": "./lib/esm/main.js"` in package.json exports | npm registry exports field |
| vscode-languageserver-types | ^3.17.3 (transitive) | Browser: `"browser": "./lib/esm/main.js"` in package.json exports | npm registry exports field |
| React 19 | ^19.2.4 (existing) | CodeMirror 6 (no React dependency -- vanilla DOM) | N/A, CodeMirror is framework-agnostic |
| Astro 5 | ^5.3.0 (existing) | client:idle directive, island architecture | Astro docs |

## Dockerfile Syntax Highlighting Setup

Since there is no `@codemirror/lang-dockerfile`, the setup uses the legacy mode bridge:

```typescript
import { StreamLanguage } from '@codemirror/language';
import { dockerfile } from '@codemirror/legacy-modes/mode/dockerfile';

// Use as a CodeMirror extension:
const dockerfileLanguage = StreamLanguage.define(dockerfile);
```

The `StreamLanguage.define()` adapter converts the CodeMirror 5 stream parser into a CodeMirror 6 Language extension. This provides:
- Keyword highlighting (FROM, RUN, COPY, ENV, etc.)
- Comment highlighting (lines starting with `#`)
- String highlighting (quoted arguments)
- Variable highlighting (`$VAR` and `${VAR}`)

It does NOT provide:
- Full Lezer tree parsing (no AST from the highlighter -- we use `dockerfile-ast` for that)
- Semantic analysis
- Folding (no `foldService` -- acceptable for Dockerfiles which are typically <100 lines)

## Custom Linter Integration Pattern

The CodeMirror `linter()` API bridges our rule engine to inline diagnostics:

```typescript
import { linter, Diagnostic } from '@codemirror/lint';
import { DockerfileParser } from 'dockerfile-ast';
import { analyzeDockerfile } from './rules'; // our custom rule engine

const dockerfileLinter = linter((view) => {
  const content = view.state.doc.toString();
  const ast = DockerfileParser.parse(content);
  const issues = analyzeDockerfile(ast);

  // Convert our rule engine output to CodeMirror Diagnostics
  return issues.map((issue) => ({
    from: view.state.doc.line(issue.line + 1).from + issue.startChar,
    to: view.state.doc.line(issue.line + 1).from + issue.endChar,
    severity: issue.severity, // "error" | "warning" | "info"
    message: issue.message,
  }));
});
```

Key detail: CodeMirror `Diagnostic.from` and `Diagnostic.to` are **character offsets from the start of the document**, not line/column pairs. The `view.state.doc.line(n)` method provides the `.from` offset of a given line number (1-based). The `dockerfile-ast` range uses 0-based line numbers, so add 1 when calling `view.state.doc.line()`.

## Sources

- [npm registry: codemirror@6.0.2](https://registry.npmjs.org/codemirror/latest) -- dependencies verified (HIGH confidence)
- [npm registry: @codemirror/legacy-modes@6.5.2](https://registry.npmjs.org/@codemirror/legacy-modes/latest) -- dockerfile mode available (HIGH confidence)
- [npm registry: dockerfile-ast@0.7.1](https://registry.npmjs.org/dockerfile-ast/latest) -- dependencies and version verified (HIGH confidence)
- [npm registry: vscode-languageserver-textdocument](https://registry.npmjs.org/vscode-languageserver-textdocument/latest) -- browser export field verified (HIGH confidence)
- [npm registry: vscode-languageserver-types](https://registry.npmjs.org/vscode-languageserver-types/latest) -- browser export field verified (HIGH confidence)
- [CodeMirror legacy-modes README](https://github.com/codemirror/legacy-modes/blob/main/README.md) -- StreamLanguage.define() pattern (HIGH confidence)
- [CodeMirror legacy-modes /mode directory](https://github.com/codemirror/legacy-modes/tree/main/mode) -- dockerfile mode exists in list of 207 modes (HIGH confidence)
- [CodeMirror bundling docs](https://codemirror.net/examples/bundle/) -- bundle size benchmarks: ~135 KB gzipped with basicSetup (HIGH confidence)
- [CodeMirror lint example](https://codemirror.net/examples/lint/) -- custom linter API, Diagnostic interface (HIGH confidence)
- [CodeMirror styling example](https://codemirror.net/examples/styling/) -- EditorView.theme(), dark mode via {dark: true} (HIGH confidence)
- [GitHub source: rcjsuen/dockerfile-ast](https://github.com/rcjsuen/dockerfile-ast) -- all 34 source files audited for Node.js imports, zero found (HIGH confidence)
- [Astro islands architecture docs](https://docs.astro.build/en/concepts/islands/) -- client:idle directive behavior (HIGH confidence)
- [Astro directives reference](https://docs.astro.build/en/reference/directives-reference/) -- client:idle uses requestIdleCallback (HIGH confidence)
- [Hadolint GitHub](https://github.com/hadolint/hadolint) -- DL rule categories for rule engine inspiration (HIGH confidence)
- Existing codebase: `package.json`, `astro.config.mjs`, `src/stores/tabStore.ts`, `src/components/beauty-index/CodeComparisonTabs.tsx` -- island patterns and nanostores usage (HIGH confidence)

---
*Stack research for: Dockerfile Analyzer Tool*
*Researched: 2026-02-20*
*Key finding: 4 new packages (codemirror, @codemirror/legacy-modes, @codemirror/theme-one-dark, dockerfile-ast). ~192 KB gzipped client-side, loaded only on /tools/dockerfile-analyzer via client:idle. No React wrapper needed -- vanilla useRef/useEffect. dockerfile-ast is browser-safe (verified by source audit). Dockerfile syntax via legacy mode StreamLanguage bridge.*
