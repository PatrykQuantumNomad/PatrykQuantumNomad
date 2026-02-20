# Pitfalls Research: Dockerfile Analyzer Tool

**Domain:** Adding a browser-based Dockerfile editor with linting, scoring, and inline annotations to an existing Astro 5 static portfolio site
**Researched:** 2026-02-20
**Confidence:** HIGH (verified against CodeMirror 6 docs, Astro docs, codebase analysis, dockerfile-ast source inspection, community issue trackers, and bundle size analysis)

**Context:** This is a SUBSEQUENT milestone pitfalls document. The site (patrykgolabek.dev) is a live Astro 5 static site with Lighthouse 90+ scores, GSAP animations, a React Three Fiber 3D hero scene, Expressive Code for syntax highlighting, Satori-based OG image generation, dark/light theme toggle, strict Content Security Policy, and ClientRouter (View Transitions). This is the FIRST major client-side interactive tool being added to the site -- approximately 350KB of new JavaScript (CodeMirror 6 ~300KB + dockerfile-ast ~50KB) entering what has been a predominantly static site.

---

## Critical Pitfalls

### Pitfall 1: CodeMirror 6 Requires `client:only` -- Not `client:visible` -- and SSR Will Break the Build

**What goes wrong:**
CodeMirror 6 depends entirely on browser APIs: DOM manipulation, MutationObserver, requestAnimationFrame, layout queries, and contenteditable. It cannot be server-rendered. If you use `client:visible` or `client:load` on a React/Preact wrapper component containing CodeMirror, Astro will attempt to server-render the component during the static build. This causes either:

1. A build-time crash with "document is not defined" or "window is not defined" errors
2. A hydration mismatch where the server-rendered placeholder HTML does not match the client-rendered CodeMirror DOM, causing React to throw warnings and potentially fail to hydrate

The site currently uses `client:visible` for the Three.js 3D head scene (`HeadSceneWrapper.astro`), but Three.js has server-safe imports. CodeMirror does not. The EditorView constructor immediately accesses the DOM.

**Why it happens:**
Developers assume `client:visible` (lazy hydration) is always better than `client:only` (skip SSR entirely). For most components this is true. But CodeMirror is architecturally incompatible with SSR -- it creates its DOM structure imperatively, not declaratively. There is no meaningful HTML to server-render as a placeholder.

**How to avoid:**
1. **Use `client:only="react"` (or `client:only="preact"`)** for the CodeMirror editor island. This tells Astro to skip server rendering entirely and mount the component client-side only. The SSR output will be an empty placeholder div.
2. **Design a meaningful loading state** to render in place of the editor during the SSR placeholder phase. A skeleton with the right dimensions prevents Cumulative Layout Shift (CLS) when the editor mounts. Use a `<div>` with matching height, a subtle border, and "Loading editor..." text.
3. **Do NOT dynamically import CodeMirror inside a `client:visible` component** as a workaround. While this avoids the build crash, it creates a double-loading scenario: Astro loads the wrapper, then the wrapper loads CodeMirror. Use `client:only` for a clean single load.
4. **Test the build pipeline early.** Run `astro build` after adding the first CodeMirror import to catch SSR issues before building the full feature.

**Warning signs:**
- Build errors containing "document is not defined" or "ReferenceError: window is not defined"
- Hydration mismatch warnings in the browser console
- CodeMirror editor appears briefly, then disappears during hydration
- Empty white space where the editor should be after navigation

**Phase to address:**
Phase 1: Editor integration scaffolding. The `client:only` decision must be made BEFORE writing any CodeMirror code. This is a foundational architectural choice.

---

### Pitfall 2: ~350KB of Client JS Tanks Lighthouse Performance Unless Aggressively Lazy-Loaded

**What goes wrong:**
The site currently loads GSAP (~26KB gzip), Lenis (~4KB), Three.js (~150KB gzip via the 3D head scene), and React (~45KB gzip). Adding CodeMirror 6 (~75KB gzip minimal, ~120KB with linting+syntax+search extensions) plus dockerfile-ast (~15KB gzip) plus the custom rule engine pushes the total page JavaScript well past comfortable thresholds. If the editor loads eagerly, Total Blocking Time (TBT) -- which determines 30% of the Lighthouse Performance score -- will spike.

Critical numbers:
- TBT > 200ms = Lighthouse starts penalizing
- TBT > 600ms = Lighthouse "poor" rating
- CodeMirror initialization (parsing extensions, building DOM, setting up MutationObserver) takes 50-150ms on desktop, 200-400ms on low-end mobile
- This is ON TOP OF existing Three.js/GSAP initialization

The Dockerfile Analyzer page will be the heaviest page on the site by far. If it loads eagerly alongside the global animation scripts, it will be the first page to break the Lighthouse 90+ threshold.

**Why it happens:**
CodeMirror 6's modular architecture is both its strength and its trap. The `basicSetup` convenience package pulls in 15+ extensions including search, autocomplete, bracket matching, and history -- most of which are needed for a good editor experience. Developers import `basicSetup` to get started quickly, not realizing it bundles far more than a minimal Dockerfile editor needs.

**How to avoid:**
1. **Use `minimalSetup` instead of `basicSetup`** and add only the extensions you actually need. For a Dockerfile linting tool, you need: syntax highlighting, line numbers, lint gutter, fold gutter (maybe), and the lint panel. You do NOT need: search/replace, autocomplete, bracket matching (Dockerfiles barely use brackets), or multi-cursor.
2. **Dynamically import CodeMirror** via the `client:only` directive (which already defers loading until page render). Combined with the fact that this is a dedicated `/tools/dockerfile-analyzer` page (not the homepage), the JS only loads when users navigate to this specific page.
3. **Set a page-specific performance budget.** The Dockerfile Analyzer page has a different budget than the homepage. Target: Lighthouse Performance 85+ (not 90+) for this interactive tool page. Document this exception.
4. **Split the editor initialization** into phases: mount the editor view first (fast), then add linting extension after a 100ms delay using `requestIdleCallback` or `setTimeout`. This prevents the lint engine from adding to the initial TBT.
5. **Measure with `?lighthouse=true` query parameter** during development to easily toggle Lighthouse-focused testing.

**Warning signs:**
- `import { basicSetup } from 'codemirror'` in any file (should be `minimalSetup` with selective additions)
- Lighthouse Performance score below 85 on the Dockerfile Analyzer page
- TBT exceeds 300ms on the Dockerfile Analyzer page
- The editor page loads noticeably slower than other pages on 4G throttle

**Phase to address:**
Phase 1: Editor integration. Bundle size decisions are architectural -- wrong choices here require rearchitecting later.

---

### Pitfall 3: View Transitions (ClientRouter) Destroy and Fail to Recreate the CodeMirror Instance

**What goes wrong:**
The site uses Astro's `<ClientRouter />` for smooth page-to-page navigation. When navigating away from and back to the Dockerfile Analyzer page, the ClientRouter replaces the page DOM. This destroys the CodeMirror editor's DOM elements, but the JavaScript EditorView instance -- with its MutationObserver, event listeners, and internal state -- may survive in memory as a zombie reference. When the user navigates back, Astro creates fresh DOM but the orphaned EditorView still references the old (now removed) DOM nodes. Result: the editor is blank, broken, or throws errors.

Specific failure scenarios:
1. **Navigate away, navigate back:** Editor is blank. The `client:only` component remounts, but if the framework (React/Preact) tries to reuse the old component tree, the EditorView's DOM root is gone.
2. **Browser back button:** View Transitions replay the cached page, but the editor island does not re-execute its initialization script because Astro considers it already loaded.
3. **Unsaved user content is lost:** The user types a Dockerfile, navigates away, presses back -- their content is gone. This is expected for a stateless tool, but feels like a bug to users.

The site's existing `astro:before-swap` cleanup (in `Layout.astro`) calls `gsap.killTweensOf('*')` and destroys Lenis. It does NOT know about CodeMirror instances.

**Why it happens:**
Astro's ClientRouter performs a soft DOM swap, not a full page reload. For static content this works perfectly. For stateful client-side components like code editors, the gap between "DOM was replaced" and "component was properly unmounted" creates zombie state. The `astro:page-load` event fires after the swap, but `client:only` components may or may not re-initialize depending on framework behavior and caching.

**How to avoid:**
1. **Explicitly destroy the EditorView on `astro:before-swap`.** In the editor component, listen for this event and call `view.destroy()` to release all resources:
   ```javascript
   document.addEventListener('astro:before-swap', () => {
     if (editorView) {
       editorView.destroy();
       editorView = null;
     }
   });
   ```
2. **Re-initialize the editor on `astro:page-load`.** After the swap completes, the `client:only` component should remount cleanly. Verify this works by testing the full navigation cycle.
3. **Consider `transition:persist` with extreme caution.** While Astro's `transition:persist` directive can keep an island alive across navigations, it has known issues with React hooks not triggering re-renders after persist (GitHub issue #13287). For CodeMirror, persistence adds complexity around document state. It is simpler and safer to destroy and recreate.
4. **Optionally persist the Dockerfile content to `sessionStorage`** before navigation, and restore it on remount. This gives users the UX benefit of content persistence without the complexity of keeping the editor alive across transitions.
5. **Test the full navigation matrix:** Home -> Analyzer -> Back -> Forward -> Analyzer (direct URL). Each path exercises different ClientRouter code paths.

**Warning signs:**
- Editor is blank after pressing the browser Back button
- Console errors: "Cannot read properties of null" referencing CodeMirror DOM elements
- Memory leaks: navigating to/from the Analyzer page repeatedly causes increasing memory usage (orphaned EditorView instances)
- Lint annotations appear on wrong lines after navigation

**Phase to address:**
Phase 1: Editor integration. The view transition lifecycle hooks must be part of the editor component from day one, not bolted on later.

---

### Pitfall 4: dockerfile-ast Depends on VS Code Language Server Types -- Bundle May Balloon or Break

**What goes wrong:**
The `dockerfile-ast` npm package has two runtime dependencies:
- `vscode-languageserver-textdocument` (^1.0.8)
- `vscode-languageserver-types` (^3.17.3)

These are pure TypeScript type/interface packages from Microsoft's VS Code ecosystem. While they do NOT use Node.js built-in modules (no `fs`, `path`, `child_process`), they were designed for VS Code extensions, not browser applications. Potential issues:

1. **Unexpected bundle size:** `vscode-languageserver-types` contains the entire Language Server Protocol type definitions (hundreds of interfaces for capabilities like document symbols, code actions, folding ranges, completion items). Most of this is dead code for a Dockerfile parser. If the bundler does not tree-shake effectively, you ship 50-100KB of unused type infrastructure.
2. **Module format mismatches:** These packages may use CommonJS (`require`), which Vite (Astro's bundler) must transform. While Vite handles CJS-to-ESM conversion, edge cases with re-exports can cause "named export not found" errors.
3. **The `TextDocument` dependency is structural:** `dockerfile-ast` uses `TextDocument` from `vscode-languageserver-textdocument` to represent file content. You must create a `TextDocument` to use the parser. This means you cannot just import the parser standalone -- you must also import the text document factory.

**Why it happens:**
`dockerfile-ast` was written by the author of the Docker VS Code extension (Remy Suen) specifically for that extension's language server. It is a mature, well-tested parser, but its API surface assumes VS Code extension contexts where `vscode-languageserver-*` packages are already available.

**How to avoid:**
1. **Verify browser bundling works before committing to dockerfile-ast.** Create a minimal test: import `DockerfileParser.parse()` in a Vite project, build it, and check the output bundle size. If it bundles cleanly at <20KB gzip with tree shaking, proceed. If not, evaluate alternatives.
2. **Alternative: Write a lightweight Dockerfile parser.** Dockerfiles have a simple line-oriented grammar (INSTRUCTION arguments, with continuation lines via `\`). A 200-line parser handling FROM, RUN, COPY, EXPOSE, ENV, ARG, LABEL, WORKDIR, ENTRYPOINT, CMD, HEALTHCHECK, USER, and comments covers 95% of real-world Dockerfiles. This eliminates the VS Code dependency entirely.
3. **If using dockerfile-ast, verify tree shaking.** After building, inspect the output bundle with `npx vite-bundle-visualizer` or `source-map-explorer`. If `vscode-languageserver-types` contributes >10KB gzip, the tree shaking failed and a custom parser is warranted.
4. **If using dockerfile-ast, create a thin wrapper** that accepts raw strings (not `TextDocument` objects) and internally creates the `TextDocument`. This isolates the VS Code dependency from the rest of the application.

**Warning signs:**
- Bundle size for the Analyzer page exceeds 200KB gzip
- Build warnings about "Could not resolve" or "Missing export" from vscode-languageserver-* packages
- Runtime error: `TextDocument is not a constructor` or similar
- `vite-bundle-visualizer` shows large chunks of unused LSP type definitions

**Phase to address:**
Phase 1: Technology validation. Test the dockerfile-ast import in a minimal Vite build BEFORE integrating it into the Astro site. This is a go/no-go gate.

---

### Pitfall 5: CodeMirror Dark Mode Requires Compartment Reconfiguration -- CSS Classes Alone Will Not Work

**What goes wrong:**
The site toggles dark mode by adding/removing a `.dark` class on `<html>` (via `ThemeToggle.astro`). This works for CSS-variable-based components. But CodeMirror 6 has its own theming system that is orthogonal to CSS classes on ancestor elements. CodeMirror themes are JavaScript extensions that inject scoped CSS via `EditorView.theme()`. Simply adding `.dark` to `<html>` does NOT change CodeMirror's syntax highlighting colors.

The result: the user toggles dark mode, the page background and text change, but the code editor remains in light mode (or vice versa). The visual mismatch makes the editor look broken -- light editor on dark page, or dark editor on light page.

Worse: the site's current dark mode is partially implemented (the toggle exists, localStorage persistence works, but no CSS custom properties for `.dark` are defined in `global.css`). This means the editor's dark mode implementation must work with a partially complete system.

**Why it happens:**
CodeMirror's CSS-in-JS theming is intentionally isolated from the page's CSS to prevent style conflicts. This is a good architectural decision for a library, but it means theme switching requires CodeMirror-specific code. Developers assume adding a CSS class to a parent element will cascade into the editor -- it does not.

**How to avoid:**
1. **Use `codemirror-theme-vars` by Anthony Fu** to bridge CodeMirror themes to CSS custom properties. This library defines CodeMirror theme colors as CSS variables (`--cm-background`, `--cm-foreground`, `--cm-keyword`, etc.) that you can override in `:root` and `.dark` selectors. This integrates CodeMirror into the site's existing theming approach.
2. **Alternative: Use a Compartment for dynamic theme switching.** Create two themes (light and dark), wrap them in a `Compartment`, and dispatch a reconfigure effect when the theme toggle fires:
   ```javascript
   import { Compartment } from '@codemirror/state';
   const themeConfig = new Compartment();
   // On toggle:
   view.dispatch({
     effects: themeConfig.reconfigure(isDark ? darkTheme : lightTheme)
   });
   ```
3. **Listen for the theme toggle event.** The existing `ThemeToggle.astro` dispatches no custom event -- it only toggles the CSS class and writes to localStorage. Add a `MutationObserver` on `document.documentElement` watching for class attribute changes, or dispatch a custom `theme-change` event from the toggle.
4. **Define the dark editor palette using the site's Tropical Sunset color system.** Map `--color-surface` to `--cm-background`, `--color-text-primary` to `--cm-foreground`, and `--color-accent` to `--cm-keyword`. This keeps visual consistency.

**Warning signs:**
- Editor background color does not match the page background after theme toggle
- Syntax highlighting colors are unreadable against the page background
- Two distinct visual "zones" on the page -- one themed, one not
- Users toggle dark mode and the editor flashes or re-renders entirely

**Phase to address:**
Phase 2: Editor theming and styling. Must be completed BEFORE the editor is considered "done" -- theme mismatch is immediately visible to users.

---

### Pitfall 6: Scoring Algorithm Becomes Gameable, Opaque, or Meaningless Without Careful Weighting Design

**What goes wrong:**
A Dockerfile scoring algorithm with 40 rules must assign weights and calculate a composite score. Common failure modes:

1. **Gaming:** Users discover that adding a single `HEALTHCHECK` instruction jumps their score from 60 to 85, so they add a meaningless `HEALTHCHECK CMD true` to game the score. The tool rewards form over substance.
2. **Meaningless perfect scores:** If most rules check for things that competent developers already do (like using specific base image tags), the majority of reasonable Dockerfiles score 95-100 and the tool provides no actionable feedback. The score has no discriminating power.
3. **Inconsistent weighting:** If "pin apt-get package versions" (a minor best practice) and "do not run as root" (a critical security issue) both carry 2 points, the scoring sends wrong signals about relative importance.
4. **Cliff effects:** A Dockerfile with `RUN apt-get update && apt-get install` (combined) scores 10 points higher than one with separate `RUN apt-get update` and `RUN apt-get install` lines, even though the combined form is only marginally better. The score difference is disproportionate to the actual impact.
5. **Category blindness:** A Dockerfile could score 95/100 by acing all "efficiency" and "formatting" rules while having critical security vulnerabilities (running as root, using `latest` tag, copying secrets). The aggregate score hides category-level failures.

Hadolint, the industry-standard Dockerfile linter, deliberately avoids numerical scoring -- it reports issues by severity (error/warning/info/style) without aggregating them into a single number. This is intentional: Dockerfile quality is multidimensional and a single score oversimplifies it.

**Why it happens:**
Scoring algorithms are easy to build and hard to calibrate. The initial implementation feels satisfying (numbers go up/down based on changes), but without extensive testing against real-world Dockerfiles of varying quality, the weights are arbitrary. The developer calibrates against 5-10 test Dockerfiles and ships, then discovers the scoring breaks down for the other 90% of real Dockerfiles.

**How to avoid:**
1. **Show category sub-scores, not just the aggregate.** Display: Security: 8/10, Efficiency: 6/10, Maintainability: 9/10, Best Practices: 7/10. This prevents a high aggregate from hiding a critical security failure.
2. **Weight security rules at 3-5x compared to style rules.** A "do not run as root" violation (security) should drop the score dramatically, while "use LABEL for metadata" (style) should be a minor ding.
3. **Use severity tiers aligned with Hadolint's model:** Error (blocks deploy) > Warning (should fix) > Info (nice to have) > Style (cosmetic). Map each tier to a scoring impact: Error = -10pts, Warning = -5pts, Info = -2pts, Style = -1pt.
4. **Test against 50+ real-world Dockerfiles** from GitHub before finalizing weights. Include: minimal Alpine images, multi-stage builds, development containers, CI images, and deliberately bad Dockerfiles. The score distribution should form a meaningful curve, not cluster at 90+.
5. **Make the scoring formula transparent.** Show users exactly which rules contributed to their score and by how much. Opaque scores breed distrust. Display: "Using latest tag: -5 points (Security)" next to each finding.
6. **Validate against Hadolint output.** For the same Dockerfile, your tool's "severe" findings should align with Hadolint's errors/warnings. If they diverge, your weighting is likely wrong.

**Warning signs:**
- Most test Dockerfiles score 85-100 (insufficient discrimination)
- A known-bad Dockerfile (running as root, using latest, no healthcheck) scores above 70
- Adding a trivial fix changes the score by 20+ points
- Users report that the score "does not match" their Dockerfile quality

**Phase to address:**
Phase 3: Rule engine and scoring design. The weight calibration must happen BEFORE the UI shows scores. Ship the lint results first, add scoring after calibration.

---

## Moderate Pitfalls

### Pitfall 7: CodeMirror Keyboard Trap Violates WCAG 2.1.2 -- Tab Key Does Not Leave the Editor

**What goes wrong:**
When users press Tab inside CodeMirror, it inserts an indent character (if `indentWithTab` is enabled) instead of moving focus to the next focusable element. This creates a "keyboard trap" -- users who rely on keyboard navigation cannot leave the editor without knowing the escape hatch (press Escape, then Tab). WCAG 2.1.2 ("No Keyboard Trap") requires that keyboard focus can always be moved away from any component using standard keyboard interactions.

CodeMirror 6 is aware of this and deliberately does NOT bind Tab by default. But most CodeMirror integration tutorials include `indentWithTab` from `@codemirror/commands` because Dockerfile content needs indentation. The moment you add `indentWithTab`, you create the trap.

The existing site has strong accessibility patterns: skip links, ARIA labels, `prefers-reduced-motion` fallbacks, `focus-visible` outlines. Adding a keyboard trap would be a significant regression.

**Why it happens:**
Developers add `indentWithTab` because Dockerfile editing feels wrong without Tab indentation. They test with a mouse and never discover the keyboard trap because they click out of the editor.

**How to avoid:**
1. **Add visible instructions near the editor:** "Press Escape then Tab to leave the editor" or "Ctrl+M to toggle tab focus mode." This is the WCAG-recommended approach for complex widgets that intentionally capture Tab.
2. **Implement a visual indicator for Tab Focus Mode.** When the user presses Escape or Ctrl+M, show a subtle notification: "Tab key now moves focus. Press Ctrl+M to re-enable indentation." CodeMirror exposes `toggleTabFocusMode` for this.
3. **Add `aria-label` to the editor.** CodeMirror creates an internal `<div role="textbox" aria-multiline="true">` but does not propagate `aria-label` from the wrapper. Use the `EditorView.contentAttributes` facet to add it:
   ```javascript
   EditorView.contentAttributes.of({
     'aria-label': 'Dockerfile editor. Press Escape then Tab to leave.',
     'aria-describedby': 'editor-instructions'
   })
   ```
4. **Provide a "Skip editor" link before the editor** in the DOM, similar to the site's existing "Skip to main content" link. This gives keyboard users an immediate escape route.
5. **Test with keyboard-only navigation.** Tab into the editor, type content, then Tab out. Verify focus moves to the next element (Analyze button or results panel).

**Warning signs:**
- Lighthouse Accessibility audit flags "Keyboard trap" or "No accessible name on textbox"
- Users cannot Tab out of the editor to reach the "Analyze" button
- Screen readers announce the editor as "textbox" without a descriptive label
- `axe DevTools` reports WCAG 2.1.2 violation

**Phase to address:**
Phase 2: Editor UX and accessibility. The Tab escape mechanism and ARIA labels must be part of the editor component, not an afterthought.

---

### Pitfall 8: Lint Annotations Re-Run on Every Keystroke and Freeze the Editor

**What goes wrong:**
CodeMirror's `@codemirror/lint` package calls the linter function on document changes. If the linter runs 40 rules against every instruction on every keystroke, the lint computation can take 10-50ms per run. At 60+ WPM typing speed, that is a lint call every 100-200ms. If the lint computation exceeds the typing interval, the editor stutters because the main thread is blocked by lint processing while trying to handle input events.

For a 50-line Dockerfile with 15 instructions and 40 rules, that is 600 rule evaluations per lint run. Each rule may traverse the AST, check string patterns, or evaluate conditions. At 0.05ms per rule evaluation, that is 30ms of blocking time -- enough to cause perceptible input lag.

**Why it happens:**
Developers test with short Dockerfiles (5-10 lines) where lint completes in <5ms. The performance issue only surfaces with longer, realistic Dockerfiles (40-100 lines) or when the user pastes a large Dockerfile from a production project.

**How to avoid:**
1. **Use CodeMirror's built-in lint debouncing.** The `linter()` function accepts a `delay` option (milliseconds to wait after changes before re-running). Set it to 300-500ms:
   ```javascript
   linter(dockerfileLinter, { delay: 500 })
   ```
   This ensures linting only runs when the user pauses typing, not on every keystroke.
2. **Parse the Dockerfile once, run rules against the cached AST.** Do not re-parse with `DockerfileParser.parse()` for each rule. Parse once per lint cycle, then pass the parsed result to all 40 rules.
3. **Cache lint results for unchanged lines.** If lines 1-20 are unchanged and only line 21 was edited, rules that only depend on line 21's instruction do not need to re-evaluate lines 1-20. Implement incremental linting for line-scoped rules.
4. **Profile with Chrome DevTools Performance tab.** Record a typing session and look for long tasks in the flame chart caused by the linting function. Target: lint computation should never exceed 16ms (one frame at 60fps).
5. **Consider running the lint in a Web Worker** if it consistently exceeds 16ms. CodeMirror supports async linters that return a Promise. Parse the Dockerfile and run rules in a Worker, then return diagnostics to the main thread.

**Warning signs:**
- Input lag when typing in Dockerfiles longer than 30 lines
- Chrome DevTools shows "Long Task" entries during typing, attributed to the lint function
- Users report the editor feels "sluggish" compared to a plain textarea
- Lint results flicker rapidly during typing (insufficient debounce)

**Phase to address:**
Phase 3: Rule engine implementation. Set up the debounced linting pipeline architecture BEFORE writing individual rules.

---

### Pitfall 9: Mobile Experience Is Terrible Without Explicit Design -- CodeMirror on Touch Is Fragile

**What goes wrong:**
CodeMirror 6 has documented issues with mobile browsers:

1. **iOS Safari:** Touch to set cursor position does not always work. Selection drag handles may be missing. The virtual keyboard covers half the screen, making the editor feel cramped.
2. **Android Chrome:** Aggressive scrolling when the caret reaches the viewport edge (scrolls 5+ lines instead of 1). Keyboard flicker when backspacing near widgets/decorations.
3. **Small screens:** A Dockerfile editor with line numbers, lint gutter, and a results panel side-by-side simply does not fit on a 375px-wide screen. If forced into a single-column layout, the results panel pushes below the fold, and users cannot see their code and the lint results simultaneously.
4. **Touch targets:** Lint gutter markers (the icons showing warnings/errors next to line numbers) are typically 16x16px -- far below the 44x44px minimum for touch targets.

The site targets recruiter and developer discovery. Recruiters often browse portfolios on phones. A broken mobile editor creates a worse impression than no editor at all.

**Why it happens:**
Code editors are fundamentally desktop tools. The CodeMirror team acknowledges mobile support is a work in progress. Developers test on desktop and assume the responsive layout handles mobile. It does not -- code editing on mobile requires deliberate UX decisions.

**How to avoid:**
1. **Design a mobile-specific experience that is NOT a full editor.** On screens below 768px, show a simplified interface: a `<textarea>` for pasting Dockerfiles (not CodeMirror), with results shown in an expandable panel below. The textarea is lightweight, accessible, and works on all devices.
2. **Alternatively, make the editor read-only on mobile** with a pre-loaded example Dockerfile. The user sees the lint results and score for the example, with a "Try on desktop for full editing" message.
3. **If using CodeMirror on mobile, configure it for touch:** Increase gutter marker sizes to 44px tap targets, disable line wrapping (use horizontal scroll), set a minimum editor height of 300px, and add a "Scroll to results" button below the editor.
4. **Test on real devices.** Simulator testing does not catch touch selection issues, keyboard behavior, or scroll jank. Test on an iPhone (Safari) and an Android device (Chrome) with a 20+ line Dockerfile.
5. **Use the `@media (pointer: coarse)` query** (already used in the site's global CSS for cursor effects) to detect touch devices and apply mobile-specific overrides.

**Warning signs:**
- Editor is unusable on iPhone (cannot place cursor, cannot select text)
- Virtual keyboard covers the editor content and there is no scroll
- Lint gutter markers are too small to tap accurately
- Results panel is pushed off-screen on mobile and users cannot find it

**Phase to address:**
Phase 2: Editor layout and responsive design. Make the mobile decision BEFORE building the results panel layout.

---

### Pitfall 10: Inline Lint Annotations + Results Panel + Gutter Markers Create Information Overload

**What goes wrong:**
Showing lint feedback in three places simultaneously -- inline squiggly underlines in the editor, gutter icons next to line numbers, AND a separate results panel below the editor -- overwhelms users and creates visual noise. For a 30-line Dockerfile with 12 lint findings, the editor becomes a sea of red/yellow markers. Users cannot distinguish critical issues from minor style suggestions because everything screams for attention equally.

Additionally, CodeMirror's `lintGutter` shows only an icon per line. If a single line has 3 different lint findings (e.g., `RUN apt-get install -y curl wget` triggers: "pin package versions," "combine with update," and "consider using --no-install-recommends"), only one gutter icon appears. Users click the gutter icon, see one finding, and miss the other two unless they also check the panel.

**Why it happens:**
Developers build each feedback mechanism independently (gutter, inline, panel) because CodeMirror supports all three and they each seem useful. Without a unified information hierarchy, all three fight for attention.

**How to avoid:**
1. **Establish a clear information hierarchy:**
   - **Gutter markers** = quick severity indicator (red/yellow/blue dot). Click to jump to the detail in the panel.
   - **Inline underlines** = contextual location marker. Hover for a tooltip with the rule message.
   - **Results panel** = comprehensive list with rule explanations, fix suggestions, and links to best practices.
2. **Show inline underlines only for error/warning severity.** Do not underline info/style findings -- show them only in the panel. This reduces visual noise.
3. **Sort the results panel by severity** (errors first, then warnings, then info). Include the line number so users can cross-reference.
4. **Limit simultaneous inline annotations** to avoid overwhelming the view. If a Dockerfile has 20+ findings, show the top 10 most severe inline and collapse the rest to "and 10 more findings in the results panel."
5. **Use color coding consistently** across all three mechanisms: red = error, yellow/orange = warning, blue = info, gray = style. Match the site's existing color system (use `--color-accent` for errors, `--color-accent-secondary` for info).

**Warning signs:**
- The editor looks "angry" with red marks everywhere, even for a reasonable Dockerfile
- Users cannot distinguish critical issues from style suggestions
- Users click a gutter marker expecting to see all findings for that line, but only see one
- The results panel shows issues users cannot find in the editor (or vice versa)

**Phase to address:**
Phase 4: Lint result display and UX. Design the information hierarchy BEFORE implementing the display mechanisms.

---

### Pitfall 11: CSP Meta Tag May Block CodeMirror's Internal Style Injection

**What goes wrong:**
The site has a strict Content Security Policy via meta tag:
```
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

CodeMirror 6 injects styles dynamically via JavaScript (its CSS-in-JS theming system creates `<style>` elements at runtime). While the current CSP allows `'unsafe-inline'` for styles (which covers dynamically injected `<style>` tags), there are edge cases:

1. If the CSP is ever tightened to use nonce-based style policies (removing `'unsafe-inline'`), CodeMirror's style injection will break silently -- the editor renders but with no syntax highlighting colors, no gutter styling, and broken layout.
2. CodeMirror creates blob URLs for certain operations. The CSP has `worker-src 'self' blob:` and `connect-src 'self' ... blob:`, but if CodeMirror's internal operations hit other CSP restrictions, failures are silent (no visible error, just missing styles).

**Why it happens:**
CSP violations for styles are not thrown as JavaScript errors -- they only appear as console warnings. The editor appears to "work" but looks visually broken. Developers testing without checking the console miss these failures entirely.

**How to avoid:**
1. **The current CSP already allows `style-src 'unsafe-inline'`**, so CodeMirror's style injection will work. Document this dependency: "CodeMirror requires `style-src 'unsafe-inline'` -- do not remove this directive."
2. **After integrating CodeMirror, check the browser console** for any CSP violation warnings. Filter by "Content-Security-Policy" in the console.
3. **If the CSP is ever tightened, use CodeMirror's static CSS extraction** approach: pre-build the theme CSS at build time and include it as a static `<link>` stylesheet instead of relying on runtime injection.
4. **Test with a stricter CSP in development** (temporarily remove `'unsafe-inline'` from `style-src`) to see what breaks. This reveals all dynamic style dependencies proactively.

**Warning signs:**
- Editor renders but has no syntax highlighting (all text is same color)
- Editor gutter and line numbers are missing or unstyled
- Console shows "Refused to apply inline style because it violates the following Content Security Policy directive"
- Editor layout is broken (no proper padding, backgrounds, or borders)

**Phase to address:**
Phase 1: Editor integration. Verify CSP compatibility as part of the initial "does it work in our site?" check.

---

## Technical Debt Patterns

Shortcuts that seem reasonable during the Dockerfile Analyzer build but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `basicSetup` instead of selective extensions | Quick setup, feature-complete editor | 40-60KB extra gzipped JS for unused features (search, autocomplete, bracket matching) | Never -- use `minimalSetup` + selective imports |
| Hardcoding Dockerfile rules as string checks instead of AST-based | Faster to write initial rules | Cannot handle multi-line RUN commands, continuation lines, or build arguments; false positives on comments | Only for prototype/proof-of-concept; rewrite against AST before shipping |
| Using `dockerfile-ast` without testing browser bundle first | Proven parser, skip writing your own | May ship 50-100KB of unused VS Code LSP types; CJS-to-ESM conversion may break | Test bundle first; if bundle is clean (<20KB gzip), use it |
| Skipping mobile design ("it is a developer tool") | Faster to ship desktop-only | Recruiters browse on phones; broken mobile = negative impression; tool feels unfinished | MVP only -- add mobile experience before announcing |
| Single aggregate score without category breakdown | Simpler UI, one number to show | Score is gameable, opaque, and meaningless for multidimensional quality; users distrust it | Never -- always show category sub-scores alongside aggregate |
| No lint debounce (relying on CodeMirror default) | Immediate feedback feels responsive | Input lag on Dockerfiles > 30 lines; 40 rules x 15 instructions = 600 evaluations per keystroke | Never -- set explicit 300-500ms debounce from the start |
| Inline `<script>` for the editor initialization | Works, avoids module setup | Cannot tree-shake, cannot import CodeMirror modules properly, breaks the Astro build pipeline | Never -- use proper island component |

## Integration Gotchas

Common mistakes when connecting the Dockerfile Analyzer to existing site infrastructure.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| CodeMirror + Astro SSR | Using `client:visible` or `client:load` | Use `client:only="react"` to skip SSR entirely |
| CodeMirror + View Transitions | Not destroying EditorView on navigation | Listen to `astro:before-swap`, call `view.destroy()`, re-init on `astro:page-load` |
| CodeMirror + Dark Mode Toggle | Assuming CSS class on `<html>` cascades into editor | Use `Compartment` for runtime theme switching OR `codemirror-theme-vars` for CSS variable integration |
| CodeMirror + Site Fonts (Fira Code) | Assuming CodeMirror uses the page's font-family | Explicitly configure CodeMirror's `fontFamily` via `EditorView.theme()` to use Fira Code |
| dockerfile-ast + Vite bundler | Importing without testing CJS-to-ESM conversion | Create a minimal Vite test build first; verify tree shaking and bundle size |
| Lint engine + CodeMirror diagnostics | Running all 40 rules synchronously on every change | Use debounced linting (delay: 300-500ms), parse AST once per cycle, pass to all rules |
| GSAP animations + CodeMirror page | `cleanupAnimations()` kills tweens but not the editor | Add CodeMirror-specific cleanup to the `astro:before-swap` handler |
| CSP + CodeMirror CSS-in-JS | Assuming styles will work without checking | Verify `style-src 'unsafe-inline'` is present; check console for CSP violations |
| Scoring UI + Existing design system | Using colors not from the site's Tropical Sunset palette | Map severity colors to existing CSS custom properties: `--color-accent` for errors, `--color-accent-secondary` for info |

## Performance Traps

Patterns that work in development but fail on real devices or under Lighthouse audit.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| CodeMirror `basicSetup` import | Editor works perfectly | Use `minimalSetup` + selective extensions; measure bundle with `vite-bundle-visualizer` | Lighthouse audit; bundle analysis shows 120KB+ gzip for editor page |
| Lint runs on every keystroke without debounce | Fast for 5-line Dockerfiles | Set `linter(fn, { delay: 500 })` explicitly | Dockerfiles > 30 lines; users pasting large files |
| Eager CodeMirror initialization | Editor appears instantly | Use `client:only` which already defers; split init phases with `requestIdleCallback` | Pages with both 3D head scene AND editor; TBT > 300ms |
| All lint rules as synchronous main-thread work | Lint completes fast for 10 rules | Profile with 40 rules against 50-line Dockerfile; use Web Worker if >16ms | Production rule set with 40 rules; realistic Dockerfiles |
| CodeMirror creates DOM on mount, triggers layout thrashing | Invisible in fast desktop dev | Wrap editor mount in `requestAnimationFrame`; set explicit dimensions before mount | Low-end mobile devices; Lighthouse lab environment |

## Security Mistakes

Domain-specific security issues for a Dockerfile analysis tool.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Executing or evaluating user-provided Dockerfile content | Users paste malicious content that could exploit XSS if rendered as HTML | Treat ALL Dockerfile content as plain text; never use `innerHTML` with user content; CodeMirror handles this correctly by default |
| Displaying lint messages with user-controlled content unsanitized | If a lint rule message includes Dockerfile content (e.g., "Invalid instruction: `<script>alert(1)</script>`"), the message could execute as HTML | Escape all user-derived content in lint messages; use `textContent` not `innerHTML` for the results panel |
| Sharing analysis results via URL parameters | Dockerfile content in URL could contain sensitive information (API keys, registry credentials); URL may be logged by proxies/analytics | Do NOT put Dockerfile content in URLs; use client-side only processing; add a warning "Never paste Dockerfiles containing secrets" |
| Storing Dockerfile content in localStorage for persistence | Users may paste Dockerfiles containing credentials; localStorage persists beyond the session | If using sessionStorage/localStorage for content persistence, add a clear warning; prefer sessionStorage over localStorage (session-scoped) |

## UX Pitfalls

Common user experience mistakes when building browser-based linting tools.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Editor opens empty with no guidance | Users stare at a blank editor, unsure what to do | Pre-load a sample Dockerfile with intentional lint issues; show "Paste your Dockerfile or edit this example" |
| Results appear only after clicking "Analyze" | Friction; users expect real-time feedback from a modern tool | Use CodeMirror's live linting (debounced) -- results update as users type |
| Score shown without explanation | Users see "72/100" but do not understand what to fix | Show the score breakdown by category with expandable rule explanations |
| Lint errors reference line numbers but editor has no line numbers | Users cannot find the issue in their Dockerfile | Enable line numbers in CodeMirror (part of `minimalSetup`); clicking a result should scroll to and highlight the line |
| "Analyze" button looks like a form submit | Users worry their Dockerfile will be sent to a server | Add prominent "100% client-side - your code never leaves your browser" messaging |
| Results panel is far below the editor | Users edit, then scroll down to see results, then scroll back up to edit | Use a side-by-side layout on desktop (editor left, results right) or a sticky/pinned results panel |
| No way to copy improved Dockerfile | Users fix issues but have no easy way to get the fixed content | Add a "Copy to clipboard" button on the editor |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Editor mounts and works:** But verify it works after a View Transition (navigate away and back). Check that `view.destroy()` fires on `astro:before-swap` and the editor reinitializes on return.
- [ ] **Dark mode toggles the editor theme:** But verify syntax highlighting colors are readable in BOTH modes. Check that the gutter, active line, and selection colors also switch.
- [ ] **Lint results appear:** But verify they update live as the user types (not just on button click). Check that the debounce delay (300-500ms) is set and lint does not run on every keystroke.
- [ ] **Score displays correctly:** But verify the scoring formula is transparent (users can see which rules contributed). Check that category sub-scores are shown. Test against 10+ real Dockerfiles of varying quality.
- [ ] **Editor has line numbers:** But verify clicking a result in the panel scrolls to and highlights the corresponding line in the editor.
- [ ] **Editor is keyboard accessible:** But verify Tab focus mode works (Escape then Tab exits the editor). Check `aria-label` on the editor element. Test with VoiceOver.
- [ ] **Works on desktop Chrome:** But test in Safari (different contenteditable behavior), Firefox, and on an actual iPhone and Android device.
- [ ] **Lighthouse Performance 85+:** But run Lighthouse on the Analyzer page AFTER navigating to it via View Transition (not direct URL load). View Transition scripts add overhead.
- [ ] **CSP allows CodeMirror styles:** But check the browser console for ANY CSP warnings, not just visible breakage.
- [ ] **Example Dockerfile loads correctly:** But verify the example has at least 3-5 intentional issues of different severities so users see how the tool works.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SSR build crash from CodeMirror (P1) | LOW | Switch from `client:visible` to `client:only` -- one line change in the Astro template |
| Bundle size tanks Lighthouse (P2) | MEDIUM | Replace `basicSetup` with `minimalSetup` + selective imports; requires auditing all extension imports |
| View Transitions break editor (P3) | MEDIUM | Add lifecycle event listeners (`astro:before-swap`, `astro:page-load`); requires understanding CodeMirror's destroy/create cycle |
| dockerfile-ast bundle bloat (P4) | HIGH if discovered late | Replace with custom parser (200-400 lines); requires rewriting the parsing layer |
| Dark mode mismatch (P5) | LOW-MEDIUM | Add `Compartment`-based theme switching or integrate `codemirror-theme-vars`; 50-100 lines of code |
| Score gaming/meaninglessness (P6) | HIGH | Requires re-calibrating all 40 rule weights against real-world Dockerfiles; may need scoring formula redesign |
| Keyboard trap (P7) | LOW | Add `aria-label`, visible escape instructions, and Tab focus mode toggle; 20-30 lines of code |
| Lint performance on long files (P8) | MEDIUM | Add debounce delay, AST caching, potentially Web Worker; requires pipeline refactoring |
| Broken mobile experience (P9) | MEDIUM-HIGH | Redesign mobile layout as simplified textarea + results; architectural change |
| Information overload in lint display (P10) | LOW | Adjust severity thresholds for inline display; sort panel by severity; CSS changes + minor logic |
| CSP blocks CodeMirror styles (P11) | LOW | Verify `style-src 'unsafe-inline'` is present (it is); document the dependency |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SSR crash -- `client:only` required (P1) | Phase 1: Editor scaffolding | `astro build` completes without errors; editor mounts on page load |
| Bundle size impact (P2) | Phase 1: Editor scaffolding | `vite-bundle-visualizer` shows editor page <200KB gzip; Lighthouse Performance 85+ |
| View Transitions break editor (P3) | Phase 1: Editor scaffolding | Navigate Home -> Analyzer -> Home -> Analyzer; editor works each time; no console errors |
| dockerfile-ast browser compatibility (P4) | Phase 1: Technology validation | Minimal Vite test build confirms bundle <20KB gzip for parser; no CJS conversion errors |
| Dark mode theme mismatch (P5) | Phase 2: Editor styling | Toggle dark mode with editor visible; syntax highlighting colors change; no visual mismatch |
| Scoring algorithm design (P6) | Phase 3: Rule engine | Test 50+ real Dockerfiles; score distribution has meaningful range (30-95); security issues visibly drop score |
| Keyboard trap accessibility (P7) | Phase 2: Editor accessibility | Escape+Tab exits editor; `aria-label` present; Lighthouse Accessibility 90+ |
| Lint performance (P8) | Phase 3: Rule engine | Type in a 50-line Dockerfile; no input lag; Chrome DevTools shows no long tasks during typing |
| Mobile experience (P9) | Phase 2: Responsive design | Open Analyzer on iPhone Safari; editor or fallback loads; results are visible and scrollable |
| Information overload (P10) | Phase 4: Results display | Show editor to 3 people; ask "what is the most important issue?" -- they identify it within 5 seconds |
| CSP compatibility (P11) | Phase 1: Editor scaffolding | Zero CSP warnings in browser console on the Analyzer page |

## Sources

- [CodeMirror 6 System Guide -- Destroy/Cleanup](https://codemirror.net/docs/guide/) (HIGH confidence -- official docs)
- [CodeMirror 6 Tab Handling and Accessibility](https://codemirror.net/examples/tab/) (HIGH confidence -- official docs)
- [CodeMirror 6 Lint Example](https://codemirror.net/examples/lint/) (HIGH confidence -- official docs)
- [CodeMirror 6 Bundling Example](https://codemirror.net/examples/bundle/) (HIGH confidence -- official docs)
- [CodeMirror 6 Styling and Theming](https://codemirror.net/examples/styling/) (HIGH confidence -- official docs)
- [CodeMirror 6 Dynamic Dark/Light Mode Discussion](https://discuss.codemirror.net/t/dynamic-light-mode-dark-mode-how/4709) (HIGH confidence -- official forum)
- [CodeMirror 6 Minimal Setup Discussion](https://discuss.codemirror.net/t/minimal-setup-because-by-default-v6-is-50kb-compared-to-v5/4514) (HIGH confidence -- official forum)
- [CodeMirror 6 Mobile Touch Issues](https://discuss.codemirror.net/t/touch-on-ios-iphone-not-working-in-codemirror-6/3345) (HIGH confidence -- official forum)
- [CodeMirror 6 iOS Selection Handles Missing](https://discuss.codemirror.net/t/ios-safari-missing-selection-drag-handles/9679) (HIGH confidence -- official forum)
- [CodeMirror 6 Mobile Scrolling Issues](https://discuss.codemirror.net/t/mobile-keyboard-scrolling-too-aggressive-scrolls-5-lines-instead-of-1-when-caret-reaches-viewport-edge/9492) (HIGH confidence -- official forum)
- [CodeMirror 6 Accessibility -- Screen Reader Survey](https://discuss.codemirror.net/t/code-editor-screen-reader-accessiblity-survey/1790) (MEDIUM confidence -- community)
- [CodeMirror 6 ARIA Label Propagation Issue](https://discuss.codemirror.net/t/aria-label-from-our-textarea-not-propagating-to-cm-textarea/4344) (HIGH confidence -- official forum)
- [CodeMirror 6 Accessibility Textbox Label Violation](https://discuss.codemirror.net/t/accessibility-violation-form-control-with-textbox-role-has-no-associated-label/7378) (HIGH confidence -- official forum)
- [CodeMirror 6 Bundle Size Issue #760](https://github.com/codemirror/dev/issues/760) (HIGH confidence -- official GitHub)
- [codemirror-theme-vars -- CSS Variable Theming](https://github.com/antfu/codemirror-theme-vars) (HIGH confidence -- well-maintained library)
- [dockerfile-ast GitHub Repository](https://github.com/rcjsuen/dockerfile-ast) (HIGH confidence -- source code inspection)
- [dockerfile-ast package.json Dependencies](https://github.com/rcjsuen/dockerfile-ast/blob/master/package.json) (HIGH confidence -- direct source)
- [vscode-languageserver-textdocument npm](https://www.npmjs.com/package/vscode-languageserver-textdocument) (HIGH confidence -- official package)
- [Hadolint -- Dockerfile Linter](https://github.com/hadolint/hadolint) (HIGH confidence -- industry standard)
- [Astro View Transitions Documentation](https://docs.astro.build/en/guides/view-transitions/) (HIGH confidence -- official docs)
- [Astro Template Directives -- client:only](https://docs.astro.build/en/reference/directives-reference/) (HIGH confidence -- official docs)
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) (HIGH confidence -- official docs)
- [Astro transition:persist for React State](https://astropatterns.dev/p/react-love/view-transitions-and-react-state) (MEDIUM confidence -- community patterns)
- [Astro transition:persist React Re-render Bug #13287](https://github.com/withastro/astro/issues/13287) (HIGH confidence -- official issue tracker)
- [Sourcegraph Monaco to CodeMirror Migration -- Bundle Savings](https://sourcegraph.com/blog/migrating-monaco-codemirror) (HIGH confidence -- engineering blog)
- [Chrome Lighthouse -- Total Blocking Time](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time) (HIGH confidence -- official docs)
- [Chrome Lighthouse -- Reduce JavaScript Execution Time](https://developer.chrome.com/docs/lighthouse/performance/bootup-time) (HIGH confidence -- official docs)
- Codebase analysis: `astro.config.mjs`, `Layout.astro`, `global.css`, `ThemeToggle.astro`, `animation-lifecycle.ts`, `tabStore.ts`, CSP meta tag (HIGH confidence -- direct code inspection)

---
*Pitfalls research for: Dockerfile Analyzer Tool -- adding CodeMirror 6 + dockerfile-ast linting tool to existing Astro 5 static portfolio site*
*Researched: 2026-02-20*
