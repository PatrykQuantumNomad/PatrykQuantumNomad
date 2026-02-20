# Project Research Summary

**Project:** Dockerfile Analyzer Tool
**Domain:** Interactive browser-based Dockerfile linting, scoring, and annotation tool integrated into an existing Astro 5 static portfolio site
**Researched:** 2026-02-20
**Confidence:** HIGH

## Executive Summary

This project adds a browser-based Dockerfile analyzer to an existing Astro 5 static portfolio site (patrykgolabek.dev). The tool is a React island at `/tools/dockerfile-analyzer/` that uses CodeMirror 6 for the editor, `dockerfile-ast` for parsing, and a custom 40-rule engine to produce inline annotations, category scores, and an overall letter grade. All processing is fully client-side — no backend, no API calls, no user data transmitted. The architecture follows the same Astro island pattern already used for the site's 3D head scene and Beauty Index tool: static Astro shell with a `client:only="react"` island for the interactive component.

The recommended approach is well-validated by competitive analysis: NO existing Dockerfile web linter (Hadolint online, fromlatest.io, EaseCloud) provides inline CodeMirror annotations, a category-weighted score, or expert-voice rule explanations. This combination is the differentiated value proposition. The stack is lean — 4 new npm packages (`codemirror`, `@codemirror/legacy-modes`, `@codemirror/theme-one-dark`, `dockerfile-ast`), totaling approximately 192 KB gzipped, loaded only on the tool page. The entire implementation fits within the existing site architecture with zero new frameworks and minimal configuration changes.

The primary risks cluster around three areas: CodeMirror's incompatibility with Astro's SSR (must use `client:only="react"`, not `client:load` or `client:visible`), View Transitions lifecycle management (the CodeMirror EditorView must be explicitly destroyed on `astro:before-swap`), and `dockerfile-ast` bundle compatibility with Vite (must be verified by running an actual build before committing to it). These are all solvable with known patterns, and they must be addressed in Phase 1 before any UI work begins. The scoring algorithm requires careful calibration against real-world Dockerfiles to avoid being gameable or meaningless — this is the highest-risk design decision after the technical foundation is confirmed.

## Key Findings

### Recommended Stack

The site already has all required framework-level dependencies: Astro 5.3, React 19, Tailwind CSS, TypeScript, and Nanostores. Only 4 new packages are needed: `codemirror` (meta-package that pulls in state, view, commands, language, search, autocomplete, and lint modules), `@codemirror/legacy-modes` (provides the Dockerfile syntax mode via `StreamLanguage.define()`), `@codemirror/theme-one-dark` (dark theme), and `dockerfile-ast` (TypeScript Dockerfile parser, browser-safe per source audit). The React integration should use vanilla `useRef`/`useEffect` — NOT `@uiw/react-codemirror`, which adds unnecessary abstraction, known re-render issues, and ~15 KB overhead for a single-instance editor.

`dockerfile-ast` (by rcjsuen, used in the VS Code Docker extension) is the correct parser choice. Its 34-file source has been audited and contains zero Node.js-specific imports. Its two transitive dependencies (`vscode-languageserver-textdocument`, `vscode-languageserver-types`) both have `"browser"` export fields in their `package.json`. Vite resolves these correctly without polyfills. Bundle impact is approximately 35 KB gzipped for the parser, giving a total new client JS of approximately 192 KB gzipped — well within budget, loaded only on `/tools/dockerfile-analyzer/`.

**Core technologies:**
- `codemirror` ^6.0.2: editor with Dockerfile syntax highlighting, inline lint gutter, and dark theme — recommended over Monaco (2.5 MB) and Ace (legacy)
- `@codemirror/legacy-modes` ^6.5.2: Dockerfile syntax mode via `StreamLanguage.define()` — the only available approach since no `@codemirror/lang-dockerfile` exists
- `dockerfile-ast` ^0.7.1: TypeScript Dockerfile parser, browser-safe (source-audited), same AST-based approach as Hadolint
- Nanostores (existing): cross-concern state bridge between the CodeMirror linter callback and the React results panel
- React 19 with `useRef`/`useEffect` (existing): island component using vanilla CodeMirror mounting pattern

### Expected Features

Competitive analysis of five tools (Hadolint online, fromlatest.io, EaseCloud, DockAdvisor, dockerfilelint) reveals clear unmet gaps. No existing Dockerfile web linter provides inline editor annotations, and only DockAdvisor provides any numerical score. The expert-voice explanation angle — architect-level "why this matters in production Kubernetes clusters" — is available in none of them.

**Must have (table stakes):**
- Syntax-highlighted code editor (CodeMirror 6) — users expect a real editor, not a textarea
- Paste-and-analyze workflow with a clear "Analyze" trigger — every linter follows this pattern
- Severity levels (error/warning/hint) with color coding — red/amber/blue
- Line number association — each finding references the source line in the Dockerfile
- Rule codes (DL-prefixed matching Hadolint, PG-prefixed for custom rules)
- Actionable fix suggestions per rule — "what to do instead" with before/after examples
- Category grouping (Security, Efficiency, Reliability, Maintainability, Best Practice)
- Responsive layout — stacked on mobile, side-by-side on desktop
- Client-side only execution with prominent privacy messaging
- Pre-populated sample Dockerfile with deliberate issues across all categories

**Should have (competitive differentiators):**
- Inline CodeMirror annotations (squiggly underlines + gutter markers) — no competitor does this
- Category-weighted score (0-100) with letter grade (A+ through F) — shareable and memorable
- Category breakdown panel (sub-scores per dimension) — "Security: 95%, Efficiency: 60%"
- Expert-voice explanations per rule — architect perspective on production consequences
- Pre-loaded example Dockerfiles (3-4 scenarios) — lowers first-interaction barrier
- Keyboard shortcuts (Cmd+Enter to analyze, Ctrl+Shift+M for diagnostics panel)
- Dark/light theme matching the site's existing toggle

**Defer (v1.1):**
- Shareable score badge (PNG download)
- URL state encoding for shareable analysis links (lz-string compression into URL hash)

**Defer (v2+):**
- 40 individual rule documentation pages at `/tools/dockerfile-analyzer/rules/[code]` — massive SEO play, fully independent of the tool itself

**Anti-features (explicitly not building):**
- AI-powered analysis — contradicts the human-expertise positioning
- ShellCheck integration — no browser-compatible implementation exists
- Auto-fix — too many edge cases, risks generating broken Dockerfiles
- Real-time as-you-type linting — debounced linting on pause is better UX than constant red squigglies during typing
- CI/CD API endpoint — static site architecture precludes it

### Architecture Approach

The Dockerfile Analyzer is a single React island at `/tools/dockerfile-analyzer/`. The Astro page shell provides static content (title, description, SEO metadata, breadcrumbs) while one `DockerfileAnalyzer.tsx` root component mounts CodeMirror and owns the entire interactive experience. The critical integration point is the CodeMirror `linter()` callback, which performs parse → lint → score in a single pass and outputs BOTH CodeMirror `Diagnostic[]` objects (for inline editor markers) AND a Nanostore update (for the React results panel). This dual-output pattern from a single lint cycle prevents double-parsing and keeps inline annotations and the results panel in sync.

**Major components:**
1. `src/pages/tools/dockerfile-analyzer.astro` — Astro shell: title, SEO metadata, breadcrumbs, `<DockerfileAnalyzer client:only="react" />`
2. `src/components/tools/DockerfileAnalyzer.tsx` — root island; mounts CodeMirror, owns layout (EditorPanel + ResultsPanel)
3. `src/lib/tools/useCodeMirror.ts` — React hook that creates EditorView with basicSetup, Dockerfile language mode, lintGutter, linter extension, and theme
4. `src/lib/tools/dockerfile-analyzer/` — rule engine: `types.ts`, `parser.ts`, `engine.ts`, `scorer.ts`, `dockerfile-linter.ts`, `editor-theme.ts`, and `rules/` organized by category (one file per rule)
5. `src/stores/dockerfileAnalyzerStore.ts` — Nanostore: bridge between CodeMirror linter callback and React ResultsPanel
6. `src/components/tools/ResultsPanel.tsx`, `ScoreGauge.tsx`, `CategoryScores.tsx`, `ViolationList.tsx` — results display components reading from the Nanostore

**Key patterns:**
- Each rule is a standalone file implementing `check(dockerfile, rawText): LintResult[]` — independently testable and scalable to 40+ rules without touching engine code
- Scoring uses category weights: Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10% — reflecting production impact hierarchy
- Click-to-navigate from results panel to editor line: `viewRef.current.dispatch()` is the only place React directly touches CodeMirror; all other communication flows through Nanostore
- `client:only="react"` (not `client:load` or `client:visible`) — CodeMirror cannot be server-rendered and must skip SSR entirely

### Critical Pitfalls

1. **CodeMirror requires `client:only="react"`, not `client:load` or `client:visible`** — CodeMirror accesses the DOM immediately on construction; Astro's SSR will crash the build or produce hydration mismatches with any other directive. This is a foundational decision that must precede all other implementation. Prevention: use `client:only="react"` on the island and design a skeleton loading state for the SSR placeholder to prevent layout shift.

2. **View Transitions (ClientRouter) destroy and orphan the CodeMirror instance** — navigating away and back leaves zombie EditorView references that hold stale DOM nodes, resulting in a blank or broken editor. Prevention: listen to `astro:before-swap` and call `view.destroy()` explicitly; optionally persist Dockerfile content to `sessionStorage` before navigation and restore on remount.

3. **`dockerfile-ast` bundle compatibility must be verified before committing to it** — the package's VS Code LSP type dependencies could cause bundle bloat (50-100 KB of unused types) or CJS-to-ESM conversion errors in Vite. Prevention: run a minimal `astro build` immediately after adding the import and inspect with `vite-bundle-visualizer`. Fallback: write a lightweight custom parser (~200 lines) if bundle exceeds 20 KB gzipped.

4. **CodeMirror dark mode requires Compartment reconfiguration, not CSS class cascading** — the site's `.dark` class on `<html>` does not cascade into CodeMirror's CSS-in-JS theming system. Toggling dark mode leaves the editor in its original theme. Prevention: use a `Compartment`-based dynamic theme switch or `codemirror-theme-vars` (by Anthony Fu) to bridge CSS custom properties into CodeMirror's theme.

5. **Scoring algorithm must be calibrated against real Dockerfiles or it becomes gameable and meaningless** — Hadolint deliberately avoids numerical scoring because Dockerfile quality is multidimensional. A score that clusters at 85-100 for most Dockerfiles, or where a trivial fix swings the score by 20 points, destroys user trust. Prevention: test against 50+ real-world Dockerfiles before finalizing weights, always show category sub-scores alongside the aggregate, and make deductions transparent ("Using latest tag: -5 points, Security category").

6. **Lint debounce is mandatory — running 40 rules on every keystroke causes input lag** — at 0.05ms per rule evaluation against 15 instructions, each lint cycle is ~30ms of blocking time, which causes perceptible input lag in longer Dockerfiles. Prevention: set `linter(fn, { delay: 500 })` from day one, parse the AST once per cycle (not once per rule).

## Implications for Roadmap

### Phase 1: Foundation and Technology Validation
**Rationale:** The highest-risk decisions — `client:only` directive, `dockerfile-ast` bundle compatibility, View Transitions lifecycle, and CSP compatibility — must be validated before any UI work. Building the rule engine on top of a parser that turns out incompatible with Vite would require scrapping the parsing layer. This phase is a go/no-go gate.
**Delivers:** Confirmed technology choices, working editor scaffold with no rules yet, `astro build` passes without errors, navigation to/from the page works without console errors or orphaned instances.
**Addresses:** T1 (paste-and-analyze workflow skeleton), T2 (syntax highlighting via legacy-modes), T9 (client-side architecture enforced)
**Avoids:** Pitfalls 1 (SSR crash), 3 (View Transitions lifecycle), 4 (dockerfile-ast bundle bloat), 11 (CSP style injection)
**Research flag:** SKIP deeper research — all decisions are documented in STACK.md and PITFALLS.md with known solutions and verified sources.

### Phase 2: Editor Styling, Accessibility, and Mobile Layout
**Rationale:** Styling and accessibility decisions are architectural — they shape every subsequent component. The dark mode Compartment pattern and mobile layout decision (full CodeMirror vs simplified textarea fallback) must be made before building the results panel, which must fit within the chosen container geometry.
**Delivers:** Themed editor matching site dark/light mode, accessible editor (ARIA labels, Tab focus mode, Skip link before editor), responsive layout (desktop side-by-side, mobile stacked or simplified).
**Addresses:** T8 (responsive layout), D10 (theme matching site toggle)
**Avoids:** Pitfalls 5 (dark mode visual mismatch), 7 (WCAG keyboard trap violation), 9 (broken mobile experience)
**Research flag:** SKIP — Compartment theme switching is a documented CodeMirror pattern; `codemirror-theme-vars` is a drop-in alternative; Tab focus mode escape is in CodeMirror's official accessibility example.

### Phase 3: Rule Engine and Scoring
**Rationale:** The rule engine is the core product logic. Building it before the results display UI means display components receive real data from day one. Scoring weight calibration (requiring testing against 50+ Dockerfiles) must happen in this phase — retrofitting weights after the UI is built creates unnecessary churn.
**Delivers:** 40 rules organized by category (one file per rule), working `linter()` extension producing CodeMirror Diagnostics and Nanostore updates in one pass, category-weighted scorer with letter grade output, debounced pipeline at 300-500ms.
**Addresses:** T3-T7 (severity levels, line numbers, rule codes, fix suggestions, category grouping), D1 (inline annotations — comes "free" from linter output once Diagnostics are returned), D2 (scoring algorithm), D3 (category breakdown data)
**Avoids:** Pitfalls 6 (gameable or meaningless scoring), 8 (lint performance input lag)
**Research flag:** NEEDS attention on scoring calibration. The weight values (30/25/20/15/10) are a research-informed starting point, not a validated formula. Plan a calibration task with real-world Dockerfiles as part of this phase before finalizing the scoring UI.

### Phase 4: Results Display Components
**Rationale:** Results panel components are shaped by the real data structures from Phase 3. Building display after the data layer ensures components receive accurate output rather than mock interfaces that may diverge from the actual rule engine output.
**Delivers:** ScoreGauge (SVG circular gauge), CategoryScores (horizontal bar charts), ViolationList (severity-sorted cards with click-to-navigate), ResultsPanel (composition), pre-loaded example Dockerfiles, empty state.
**Addresses:** D2 (score display with letter grade), D3 (category breakdown panel), D4 (expert-voice explanations — content authoring per rule), D6 (example Dockerfiles), D8 (keyboard shortcut hints), T10 (pre-populated sample)
**Avoids:** Pitfall 10 (information overload — established hierarchy: gutter = severity indicator, inline underlines = location marker, panel = comprehensive detail; inline underlines only for error/warning, not hint)
**Research flag:** SKIP — component structure and information hierarchy are fully specified in ARCHITECTURE.md and PITFALLS.md.

### Phase 5: Page Integration and SEO
**Rationale:** Integration work (Header navigation link, page routing, breadcrumbs, SEO metadata) is a thin final layer once the island works. Doing it last ensures the page title, meta description, and structured data reflect the actual finished tool, not a placeholder.
**Delivers:** Live page at `/tools/dockerfile-analyzer/`, Header navigation entry, BreadcrumbJsonLd, SEO head with description and OG metadata, sitemap auto-inclusion, Lighthouse audit pass.
**Addresses:** T9 (prominent "analyzed in your browser" client-side messaging), full Lighthouse performance and accessibility audits
**Avoids:** Performance regressions from over-eager JS loading; Lighthouse accessibility regression from missing ARIA or focus management
**Research flag:** SKIP — existing site infrastructure (SEOHead, BreadcrumbJsonLd, sitemap integration) is directly reusable per FEATURES.md existing infrastructure analysis.

### Phase 6: Shareability and Rule Documentation Pages
**Rationale:** Shareability features (URL state, score badge) and rule documentation pages are fully independent of the core tool and can ship after launch without blocking it. Rule documentation pages represent the largest SEO opportunity — 40 indexable URLs targeting long-tail DevOps queries like "dockerfile pin base image version" or "hadolint DL3006 explained" — but require significant content authoring effort that does not block Phase 1-5 delivery.
**Delivers:** Shareable score badge (PNG download), URL state encoding of Dockerfile content into URL hash, 40 rule documentation pages at `/tools/dockerfile-analyzer/rules/[code]`.
**Addresses:** D5 (shareable score badge), D9 (URL state for sharing), D7 (rule documentation pages — massive SEO play)
**Research flag:** NEEDS research on URL state encoding approach: `lz-string` vs `URLSearchParams` vs hash-based encoding. Need to verify URL length limits (2048 chars max for broad compatibility) and encoding round-trip fidelity for multi-line Dockerfiles with special characters.

### Phase Ordering Rationale

- Technology validation comes first because `dockerfile-ast` browser compatibility is a go/no-go gate — discovering it fails in Phase 3 would require rewriting the parsing layer.
- Styling and accessibility before results panel because the mobile layout decision (CodeMirror vs textarea fallback) determines the container geometry the results panel must fit within.
- Rule engine before display components because display components must be shaped by real data structures, not assumptions. The linter callback's dual-output pattern (Diagnostics + Nanostore update) is the integration point between Phase 3 and Phase 4.
- Page integration after the tool works so SEO metadata reflects the actual finished product.
- Shareability and SEO content last because they depend on a stable URL structure and finalized rule set.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Rule Engine):** Scoring weight calibration requires testing against real-world Dockerfiles. The 30/25/20/15/10 weight split is a research-informed starting point, not a validated formula. Plan a calibration task with 50+ Dockerfiles as part of this phase.
- **Phase 6 (Shareability):** `lz-string` vs native URL compression for encoding Dockerfiles into URL hashes. Need to verify URL length limits and encoding round-trip fidelity before committing to an approach.

Phases with well-documented patterns (skip research):
- **Phase 1:** `client:only="react"` directive, View Transitions lifecycle hooks, CSP verification — all documented in official Astro and CodeMirror sources with confirmed solutions in PITFALLS.md.
- **Phase 2:** Compartment-based theme switching is a documented CodeMirror pattern; Tab focus mode is in CodeMirror's accessibility example.
- **Phase 4:** Component structure is fully specified in ARCHITECTURE.md with TypeScript interfaces and data flow diagrams.
- **Phase 5:** Existing site infrastructure (SEOHead, BreadcrumbJsonLd, sitemap) is directly reusable with zero configuration changes per FEATURES.md existing infrastructure table.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 4 new packages verified via npm registry, source audits, and official docs. `dockerfile-ast` browser safety confirmed by 34-file source audit. Bundle sizes calculated from verified gzip benchmarks. One MEDIUM item: actual Vite bundle output needs build-time confirmation. |
| Features | HIGH | Competitive analysis covers all 5 major Dockerfile linting tools. Feature gaps (no inline annotations, no category scoring, no expert explanations) are confirmed unimplemented by competitors. Scoring algorithm approaches modeled on Pylint, DockAdvisor, and SonarQube with clear rationale. |
| Architecture | HIGH | Component structure, data flow, and rule engine patterns are fully specified with TypeScript interfaces. The dual-output linter callback pattern is documented in official CodeMirror examples. Nanostore-as-message-bus pattern is established in the existing codebase. |
| Pitfalls | HIGH | 11 pitfalls identified with specific prevention strategies, warning signs, phase mapping, and recovery costs. All critical pitfalls sourced from official CodeMirror forum, Astro issue tracker, and direct codebase analysis. |

**Overall confidence:** HIGH

### Gaps to Address

- **dockerfile-ast Vite bundling:** Classified MEDIUM confidence because actual browser bundle output needs build-time confirmation. Mitigate by running `astro build` with the import as the first task in Phase 1 — a 30-minute validation that eliminates the risk before any other work.
- **Scoring weight calibration:** Initial weights (Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%) are educated guesses. Treat Phase 3 weights as a starting hypothesis; calibrate with a real-world Dockerfile test suite before shipping.
- **Dark mode implementation completeness:** PITFALLS.md notes the site's dark mode is partially implemented — the toggle exists but no CSS custom properties for `.dark` are defined in `global.css`. The Compartment-based CodeMirror theme switching depends on the mechanism the site uses to signal theme changes. Verify during Phase 2.
- **Mobile experience decision:** PITFALLS.md identifies two viable approaches (full CodeMirror on mobile vs simplified textarea fallback). This decision must be made in Phase 2 before building the results panel layout, as the choice affects the container geometry.

## Sources

### Primary (HIGH confidence)
- [CodeMirror 6 official docs and examples](https://codemirror.net/docs/) — lint API, Diagnostic interface, styling, theming, accessibility (Tab handling), bundle size benchmarks
- [CodeMirror 6 official forum](https://discuss.codemirror.net) — dark mode switching (Compartment pattern), mobile touch issues, bundle size, ARIA label propagation
- [npm registry: codemirror, @codemirror/legacy-modes, @codemirror/theme-one-dark, dockerfile-ast](https://registry.npmjs.org) — versions, dependency trees, package.json exports fields
- [dockerfile-ast GitHub source (rcjsuen)](https://github.com/rcjsuen/dockerfile-ast) — all 34 source files audited for Node.js imports; zero found
- [Astro official docs](https://docs.astro.build) — islands architecture, client directives reference, View Transitions, Nanostore state-sharing recipe
- [Hadolint GitHub](https://github.com/hadolint/hadolint) — DL rule codes, rule categories, severity model (industry standard)
- [Docker official best practices](https://docs.docker.com/build/building/best-practices/) — authoritative source for rule definitions
- Existing codebase — `package.json`, `astro.config.mjs`, `Layout.astro`, `Header.astro`, `ThemeToggle.astro`, `global.css`, `languageFilterStore.ts`, `tabStore.ts`, `CodeComparisonTabs.tsx`

### Secondary (MEDIUM confidence)
- [fromlatest.io](https://www.fromlatest.io/), [EaseCloud Dockerfile Linter](https://www.easecloud.io/tools/docker/dockerfile-linter/), [DockAdvisor GitHub](https://github.com/deckrun/dockadvisor) — competitor UX patterns, feature gap analysis
- [codemirror-theme-vars by Anthony Fu](https://github.com/antfu/codemirror-theme-vars) — CSS variable bridge approach for CodeMirror dark mode theming
- [Astro transition:persist React re-render bug #13287](https://github.com/withastro/astro/issues/13287) — informs the lifecycle management approach (destroy/recreate over persist)
- [Pylint scoring formula](https://docs.pylint.org/en/1.6.0/faq.html), [SonarQube metrics](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition) — scoring algorithm design references

### Tertiary (LOW confidence)
- Community estimate of CodeMirror bundle size ~75kb gzipped with basicSetup — actual measurement required during Phase 1; official benchmarks cite ~135kb with full basicSetup

---
*Research completed: 2026-02-20*
*Ready for roadmap: yes*
