# Pitfalls Research

**Domain:** WASM-based GitHub Actions Workflow Validator added to existing Astro 5 portfolio site
**Researched:** 2026-03-04
**Confidence:** HIGH (Go WASM compilation, Vite integration), MEDIUM (actionlint browser API surface, two-pass coordination), MEDIUM (React Flow workflow graph at scale)

## Critical Pitfalls

### Pitfall 1: Go WASM Binary Size Blocks Page Load

**What goes wrong:**
Standard Go `GOOS=js GOARCH=wasm go build` produces a minimum ~2MB binary for trivial programs. Actionlint, with its dependencies on `go-yaml/yaml`, `doublestar`, `go-shellwords`, `robfig/cron`, `goldmark`, and `golang.org/x/sync`, will produce a WASM binary in the 3-8MB range (uncompressed). Users on mobile or slower connections experience a multi-second blank state while the binary downloads. The actionlint playground's own Makefile uses no `-ldflags`, no `wasm-opt`, and no compression -- it ships the raw `go build` output, which means the reference implementation is not optimized for production delivery.

**Why it happens:**
Go embeds the entire runtime (garbage collector, goroutine scheduler, reflect package support) into every WASM binary. Each imported standard library package adds significant overhead -- `fmt` alone costs ~400KB. Actionlint imports `encoding/json`, `regexp`, `sync`, `io`, and the full YAML parser. Unlike Rust/C WASM, Go cannot tree-shake unused runtime components.

**How to avoid:**
1. **Compression is mandatory.** Serve the `.wasm` file with Brotli compression (75-80% reduction) or gzip (70-75% reduction). A 5MB binary becomes ~1.2MB with Brotli. Configure your hosting/CDN to serve `.wasm` with `Content-Encoding: br`.
2. **Apply `wasm-opt` from Binaryen.** Run `wasm-opt --enable-bulk-memory -Oz -o optimized.wasm raw.wasm` after Go compilation. Expect 5-15% additional size reduction.
3. **Use Go build flags.** Compile with `GOOS=js GOARCH=wasm go build -ldflags="-s -w" -trimpath -o actionlint.wasm`. The `-s -w` flags strip symbol table and debug info.
4. **Do NOT attempt TinyGo.** Actionlint uses `reflect`, `encoding/json`, `regexp`, and full `go-yaml` -- all of which rely on reflection. TinyGo's reflection support is incomplete and will fail to compile actionlint. This is a dead-end path.
5. **Lazy-load the WASM.** Do not fetch the binary until the user navigates to the validator tool page. Use `import()` or `fetch()` triggered by route navigation, not a top-level import.
6. **Pre-build, do not compile at deploy time.** The WASM binary should be a checked-in or CI-built artifact in `public/wasm/`, not compiled during `astro build`.

**Warning signs:**
- Lighthouse performance score drops below 90 on the tool page
- Time to Interactive exceeds 3 seconds on throttled connections
- The validator appears unresponsive for several seconds after page load

**Phase to address:** WASM compilation and infrastructure phase (Phase 1). Binary size strategy must be decided before any integration work begins.

---

### Pitfall 2: WASM Execution Blocks the Main Thread

**What goes wrong:**
Go WASM runs synchronously on whichever thread loads it. If loaded on the main thread, the Go runtime initialization (~100-300ms) and every `actionlint.Lint()` call freeze the UI. The CodeMirror editor becomes unresponsive during linting. Large workflow files (500+ lines) may cause visible jank or browser "page unresponsive" warnings. This is amplified by Go's garbage collector, which periodically pauses execution.

**Why it happens:**
WebAssembly is synchronous by design. Go's runtime startup initializes the GC, goroutine scheduler, and memory allocator before any user code runs. The `wasm_exec.js` bridge creates a `Go` instance and calls `go.run()`, which blocks until the Go main function returns or enters a `select{}` wait state. Every subsequent JS-to-Go function call crosses the bridge synchronously.

**How to avoid:**
1. **Run Go WASM in a Web Worker.** This is not optional -- it is required for acceptable UX. The Web Worker pattern:
   - Worker file: `importScripts("wasm_exec.js")`, instantiate Go, `go.run()`, then `postMessage({ action: "ready" })`.
   - Main thread: create Worker, wait for "ready" message, then send lint requests via `postMessage({ action: "lint", payload: yamlContent })`.
   - Worker responds with `postMessage({ action: "result", payload: diagnostics })`.
2. **Show a loading skeleton** in the CodeMirror panel while the worker initializes.
3. **Debounce lint requests.** Do not send every keystroke to the worker. Debounce at 300-500ms so the worker processes stable input, not intermediate typing states.
4. **Do NOT use SharedArrayBuffer** unless you specifically need shared memory. It requires `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers, which break third-party script loading (analytics, fonts, etc.) and are overkill for message-passing communication.

**Warning signs:**
- CodeMirror cursor movement stutters while linting runs
- Browser dev tools show long tasks (>50ms) on the main thread during lint
- Mobile devices become unresponsive when pasting large workflows

**Phase to address:** WASM loading infrastructure phase (Phase 1). The Web Worker architecture must be the foundation, not bolted on later.

---

### Pitfall 3: Actionlint WASM Mode Lacks shellcheck/pyflakes Integration

**What goes wrong:**
Developers assume the WASM build of actionlint provides the same checks as the CLI. It does not. The CLI version optionally shells out to `shellcheck` for `run:` script validation and `pyflakes` for Python script checks. In WASM/browser mode, there are no child processes -- these checks are silently absent. Users paste a workflow with a `run: |` block containing a shell syntax error and the validator reports zero issues, creating a false sense of security. The tool appears broken or incomplete.

**Why it happens:**
Actionlint's WASM playground uses `actionlint.NewLinter(io.Discard, &opts)` with an empty `LinterOptions{}` struct. This means default checks run (YAML structure, expression types, action input validation, cron syntax, etc.), but shellcheck and pyflakes require spawning external processes which is impossible in a browser sandbox. The actionlint API provides no way to inject a JavaScript-based shell linter as a substitute.

**How to avoid:**
1. **Explicitly document which checks run in browser mode** on the tool page. List what works (YAML syntax, expression type checking, action inputs/outputs, workflow structure, cron validation, matrix validation, permissions, reusable workflow inputs) and what does not work (shellcheck integration, pyflakes integration).
2. **Consider a JavaScript shell syntax highlighter** as a partial substitute -- highlight `run:` blocks distinctly to signal they are not deeply analyzed.
3. **Do NOT promise "complete GitHub Actions validation"** in marketing copy. Say "structural and semantic workflow validation" instead.
4. **Map the actionlint error `Kind` field** to your documentation system accurately. The playground Go source shows errors are returned as `{ message, line, column, kind }`. The `kind` field maps to rule categories -- ensure your UI explains what each kind means.

**Warning signs:**
- Users file issues saying "the validator missed an obvious shell error"
- Comparison with CLI actionlint shows different result counts
- The scoring system assigns high scores to workflows with broken shell scripts

**Phase to address:** Actionlint integration phase (Phase 2). Must be addressed when designing the scoring algorithm and documentation system.

---

### Pitfall 4: WASM `application/wasm` MIME Type Not Configured

**What goes wrong:**
`WebAssembly.instantiateStreaming()` requires the response to have `Content-Type: application/wasm`. If the hosting platform, CDN, or Vite dev server does not set this MIME type for `.wasm` files, instantiation fails with a cryptic error: `TypeError: Failed to execute 'compile' on 'WebAssembly': Incorrect response MIME type. Expected 'application/wasm'`. The fallback `WebAssembly.instantiate()` (using `arrayBuffer()`) works but is slower because it cannot stream-compile.

**Why it happens:**
Many hosting providers and static file servers do not include `.wasm` in their default MIME type mappings. Vite's dev server generally handles this correctly via its built-in `vite:wasm` plugin, but production deployments (Netlify, Vercel, Cloudflare Pages, S3+CloudFront) may not.

**How to avoid:**
1. **Place the WASM binary in `public/wasm/actionlint.wasm`** so Astro serves it as a static asset without transformation.
2. **Configure the hosting platform's MIME types.** For Netlify, add to `netlify.toml`:
   ```toml
   [[headers]]
     for = "*.wasm"
     [headers.values]
       Content-Type = "application/wasm"
       Cache-Control = "public, max-age=31536000, immutable"
   ```
3. **Implement a fallback loader** that catches the streaming error and falls back to `arrayBuffer()` + `WebAssembly.instantiate()`:
   ```javascript
   try {
     result = await WebAssembly.instantiateStreaming(fetch(url), imports);
   } catch {
     const bytes = await fetch(url).then(r => r.arrayBuffer());
     result = await WebAssembly.instantiate(bytes, imports);
   }
   ```
4. **Set aggressive caching headers** on the WASM binary. It is immutable (versioned by content hash). `Cache-Control: public, max-age=31536000, immutable` prevents re-downloads.

**Warning signs:**
- WASM loads in dev but fails in production
- Console shows MIME type errors on deployment
- Users on certain CDN edges get failures while others work

**Phase to address:** WASM infrastructure phase (Phase 1). Must be verified in the deployment pipeline before integration work.

---

### Pitfall 5: Vite WASM Plugin Conflicts with Astro's Plugin Pipeline

**What goes wrong:**
Adding `vite-plugin-wasm` (and optionally `vite-plugin-top-level-await`) to Astro's Vite config can conflict with Astro's own internal Vite plugins. Astro 5 manages its plugin ordering internally, and injected plugins may execute at the wrong point in the transform pipeline. Symptoms include: WASM imports failing during build, `esbuild` errors during dependency optimization, or the `.wasm` file being treated as a regular asset and base64-inlined instead of loaded as a WebAssembly module.

**Why it happens:**
Astro wraps Vite and adds its own plugins for island hydration, MDX processing, and asset handling. The `vite-plugin-wasm` plugin needs to intercept `.wasm` imports at a specific point in the pipeline. Plugin ordering in Vite uses `enforce: 'pre'` or `enforce: 'post'`, but Astro's internal plugins may not respect these the way a raw Vite config would. Additionally, `vite-plugin-top-level-await` transforms the output to support top-level `await` in older browsers, which can interfere with Astro's code splitting.

**How to avoid:**
1. **Do NOT use `vite-plugin-wasm` for this project.** Since the WASM binary is loaded in a Web Worker (see Pitfall 2), it does not need Vite's module graph integration. The worker loads the `.wasm` file directly via `fetch()` from the `public/` directory. This completely sidesteps the Vite plugin compatibility issue.
2. **Place `wasm_exec.js` and the `.wasm` binary in `public/wasm/`.** They are static assets, not ES module imports. The Web Worker's `importScripts("wasm_exec.js")` works with files in `public/`.
3. **If you absolutely must import WASM in a Vite module** (not recommended), set `build.target: 'esnext'` in Astro's Vite config to avoid needing `vite-plugin-top-level-await`, and add the WASM module path to `optimizeDeps.exclude` to prevent esbuild from processing it.
4. **Test with `astro build` early.** Dev mode (`astro dev`) uses Vite's dev server which handles WASM differently than the production build (Rollup). A WASM setup that works in dev may fail in production.

**Warning signs:**
- `astro build` fails with esbuild errors referencing `.wasm` files
- WASM binary gets base64-inlined into a JS bundle (massively increasing bundle size)
- Dev mode works but production build fails

**Phase to address:** WASM infrastructure phase (Phase 1). Resolved entirely by choosing the `public/` + Web Worker approach instead of Vite plugin integration.

---

### Pitfall 6: `wasm_exec.js` Version Mismatch with Go Compiler

**What goes wrong:**
The `wasm_exec.js` bridge file must match the exact Go compiler version used to build the WASM binary. Using `wasm_exec.js` from Go 1.22 with a binary compiled by Go 1.23 (or vice versa) causes silent failures or runtime panics in the browser console. The errors appear inside `wasm_exec.js` and give no indication of the version mismatch.

**Why it happens:**
Go's WASM ABI is not stable across versions. The `wasm_exec.js` file provides the JavaScript-side implementation of Go's `syscall/js` package, and the internal calling conventions change between Go releases. Unlike WASI-based WASM (which uses a stable interface), Go's `GOOS=js GOARCH=wasm` target is tightly coupled to the specific runtime version.

**How to avoid:**
1. **Copy `wasm_exec.js` from the exact Go version used to compile.** Run `cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" public/wasm/` immediately after compilation in the same CI step.
2. **Pin the Go version in CI.** Use a `.go-version` file or `go.mod`'s `go` directive to ensure reproducibility.
3. **Version both files together.** If you update Go, recompile the WASM binary AND recopy `wasm_exec.js` in the same commit.
4. **Add a CI check** that verifies the `wasm_exec.js` file matches the current `GOROOT` version.

**Warning signs:**
- WASM loads but produces `TypeError` or `RuntimeError` in browser console
- Errors originate from `wasm_exec.js` rather than application code
- Works locally but fails in CI/production (different Go versions)

**Phase to address:** WASM compilation phase (Phase 1). Part of the build pipeline definition.

---

### Pitfall 7: Go WASM Memory Leaks from `syscall/js` Callback Registration

**What goes wrong:**
Go WASM functions registered with `js.Global().Set("functionName", js.FuncOf(fn))` allocate Go-side closures that are never garbage-collected unless explicitly released with `fn.Release()`. If the linting function is re-registered on each invocation (or if intermediate JS values are passed to Go without cleanup), memory usage grows monotonically. After 50-100 lint operations in a single page session, the browser tab consumes hundreds of MB.

**Why it happens:**
Go's WASM GC cannot release memory blocks back to the OS -- this is a documented Go issue (#59061). Additionally, `js.FuncOf` creates a reference that bridges the Go/JS boundary and prevents GC on both sides until explicitly released (#74342). The actionlint playground works around this by registering functions once at startup and reusing them, but a naive re-implementation might create new function references per invocation.

**How to avoid:**
1. **Register Go functions exactly once** during WASM initialization. The actionlint playground pattern (`window.Set("runActionlint", js.FuncOf(runActionlint))`) is correct -- do this once, not per lint call.
2. **Do NOT create new `js.FuncOf` instances per lint request.** Instead, pass data through a global function that receives the YAML string and returns results.
3. **Use the message-passing pattern with the Web Worker** rather than direct function calls. The worker sends results via `postMessage`, which serializes data and avoids cross-boundary reference leaks.
4. **Monitor memory in development.** Use Chrome DevTools Memory tab to take heap snapshots after repeated lint operations. Memory should stabilize, not grow.
5. **Consider periodic worker restart** for long-lived sessions (e.g., after 100 lint operations, terminate and recreate the Web Worker to reclaim all memory).

**Warning signs:**
- Browser tab memory usage grows over time without page navigation
- Performance degrades after many lint operations in a single session
- Chrome DevTools shows detached DOM nodes or retained JS-Go bridge references

**Phase to address:** WASM integration phase (Phase 2). Memory management patterns must be established when building the worker-to-main-thread communication layer.

---

### Pitfall 8: Two-Pass Linting Engine Produces Duplicate or Conflicting Diagnostics

**What goes wrong:**
The validator uses two passes: Pass 1 (JavaScript-based schema validation using the SchemaStore JSON Schema via ajv) and Pass 2 (actionlint WASM for semantic analysis). Both passes can flag the same issue differently. Example: a `uses:` field with an invalid action reference. Schema validation says "does not match pattern" while actionlint says "action not found." The user sees two diagnostics for the same line with different messages, different severity levels, and different wording. The scoring system double-penalizes the issue.

**Why it happens:**
Schema validation (structural) and semantic analysis (behavioral) have overlapping domains. The GitHub workflow JSON schema validates field types, required fields, and enum values. Actionlint validates the same things plus deeper semantics (expression types, action inputs, matrix expansion). There is no coordination between the two pass outputs.

**How to avoid:**
1. **Define clear pass boundaries.** Pass 1 (schema) handles: YAML syntax errors, missing required fields (`on`, `jobs`), invalid field types, unknown top-level keys. Pass 2 (actionlint) handles: expression type errors, action input validation, permissions, cron syntax, matrix/strategy semantics.
2. **Deduplicate by line+column.** After both passes complete, merge diagnostics. If two diagnostics share the same line (within +/- 1 line tolerance), keep the more specific one (usually actionlint) and discard the schema validation diagnostic.
3. **If Pass 1 finds YAML syntax errors, skip Pass 2 entirely.** actionlint cannot parse malformed YAML and will produce unhelpful errors. Only run the WASM pass on syntactically valid YAML.
4. **Tag diagnostics with their source** (`schema` vs `actionlint`) so the scoring system can weight them differently or avoid double-counting.
5. **Test with the same 20 sample workflows through both passes independently** and compare outputs to map the overlap.

**Warning signs:**
- Same line has two diagnostics with different messages about the same issue
- Scoring produces values outside expected ranges due to double-counting
- Users report "the validator contradicts itself"

**Phase to address:** Two-pass engine coordination phase (Phase 2-3). Must be designed when the scoring algorithm is built, not retroactively.

---

### Pitfall 9: React Flow Graph Performance Collapses with Complex Workflows

**What goes wrong:**
GitHub Actions workflows with matrix strategies, reusable workflow calls, and many jobs can generate 50-200 nodes in the dependency graph. React Flow re-renders all nodes when any node's state changes (dragging, hovering, selection). Without memoization, the graph becomes visually laggy at ~30 nodes and unusable at ~100 nodes. Edge animations compound the problem.

**Why it happens:**
React Flow stores nodes and edges as arrays in state. Any mutation to any node (position, selection, hover state) triggers a new array reference, which re-renders every component that depends on `useNodes()` or `useEdges()`. Complex custom nodes with badges, icons, and status indicators make each re-render expensive. Dagre layout recalculation on every data change adds further CPU cost.

**How to avoid:**
1. **Memoize all custom node components with `React.memo()`.** This is not optional -- it is the single most impactful optimization.
2. **Memoize all props passed to `<ReactFlow>`** with `useCallback` and `useMemo`. This includes `onNodesChange`, `onEdgesChange`, `defaultEdgeOptions`, and `nodeTypes`.
3. **Define `nodeTypes` and `edgeTypes` objects OUTSIDE the component** (module-level constants), not inside the render function.
4. **Disable edge animations** for graphs with >20 edges. Animated edges cause continuous re-renders via CSS/SVG animation frames.
5. **Compute dagre layout only when graph structure changes** (jobs added/removed), not on every render. Cache the layout result and only recompute when the node/edge count changes.
6. **Collapse matrix strategy nodes by default.** A `strategy.matrix` with 3 axes and 4 values each produces 64 combinations. Show a single "matrix" node that expands on click rather than rendering 64 individual nodes.
7. **Use `useStore` selectors** to access specific node properties rather than subscribing to the entire nodes array.

**Warning signs:**
- Frame rate drops below 30 FPS when dragging nodes
- React DevTools Profiler shows `<ReactFlow>` re-rendering on every mouse move
- Browser becomes unresponsive when pasting a workflow with 10+ jobs and matrix strategies

**Phase to address:** Graph visualization phase (Phase 3). Performance patterns must be built in from the start, not optimized later.

---

### Pitfall 10: Astro Island Hydration Mismatch with WASM-Dependent Components

**What goes wrong:**
The validator UI (CodeMirror editor + React Flow graph + results panel) must be a React island with `client:only="react"` because none of these components can server-render (they depend on browser APIs, DOM, and WASM). Using `client:load` or `client:visible` instead causes hydration errors because Astro attempts to SSR the component, encounters `window is not defined` or `WebAssembly is not defined`, and produces mismatched HTML. The error manifests as `An error occurred during hydration. The server HTML was replaced with client content in <astro-island>`.

**Why it happens:**
Astro's SSR renders components on the server by default with `client:load` and `client:visible`, then hydrates on the client. Components that reference browser-only APIs (`window`, `document`, `WebAssembly`, `Worker`, `fetch` for local resources) crash during SSR. The `client:only` directive skips SSR entirely but means no HTML is rendered at build time -- the component slot is empty until JavaScript loads.

**How to avoid:**
1. **Use `client:only="react"` for the entire validator component.** This is the correct directive for browser-only components. Accept that it renders nothing during SSR.
2. **Provide a meaningful loading skeleton** in the Astro page template (outside the island) that shows a placeholder editor/graph area. This prevents layout shift and gives users immediate visual feedback.
3. **Do NOT wrap WASM initialization in `typeof window !== 'undefined'` checks** inside the component. This is a code smell that indicates `client:load` is being used incorrectly. Use `client:only` and eliminate the conditional entirely.
4. **Separate static content from interactive content.** The tool's documentation, scoring explanation, and rule reference can be Astro components (SSR-friendly). Only the editor/graph/results panel needs to be a React island.
5. **Existing tools in the portfolio likely use `client:only` already.** Follow the same pattern. Do not introduce a different hydration strategy for this tool.

**Warning signs:**
- Hydration error messages in browser console
- Content flash or layout shift when the island loads
- SEO tools report empty content blocks

**Phase to address:** UI shell phase (Phase 2). The island boundary must be defined before building the interactive components.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Ship uncompressed WASM binary | Simpler build pipeline | 3-5x larger downloads, poor mobile experience | Never -- Brotli/gzip is trivial to configure |
| Run WASM on main thread (no Web Worker) | Simpler code, no message passing | UI freezes on every lint, unusable on mobile | Never -- Web Worker is mandatory |
| Skip `wasm-opt` post-processing | Faster CI builds | 5-15% larger binary than necessary | MVP only; add wasm-opt before public launch |
| Hardcode actionlint version | No build complexity | Miss security fixes, new GitHub Actions features | MVP only; add version pinning + update CI job |
| Parse YAML twice (JS schema pass + Go YAML parse) | Simpler architecture | Redundant parsing overhead, ~50ms wasted per lint | Acceptable -- correctness over performance at this scale |
| Inline dagre layout calculation in render | Works for small graphs | Re-layouts on every React render, O(n^2) behavior | Never -- compute layout once, cache result |
| Skip diagnostic deduplication | Both passes report independently | Double diagnostics confuse users, inflate scores | Never -- deduplication is core to two-pass design |
| Use `client:load` instead of `client:only` | SSR produces placeholder HTML | Hydration errors crash the island on every page load | Never for WASM-dependent components |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Go WASM + Web Worker | Loading `wasm_exec.js` via ES module `import` in the worker | Use `importScripts("wasm_exec.js")` -- `wasm_exec.js` is not an ES module; it sets globals on `self` |
| CodeMirror + WASM linter | Calling WASM lint synchronously from CodeMirror's linter extension | Return a `Promise` from the lint source function; send a message to the worker and resolve when the worker responds |
| React Flow + Astro island | Importing React Flow at the top level of an Astro page | Import React Flow only inside the `client:only` React component; it requires `window` |
| actionlint output + CodeMirror diagnostics | Using actionlint's 1-based line/column directly | CodeMirror uses 0-based line positions via `view.state.doc.line(n).from + column`; convert line from 1-based to match |
| Schema validation (ajv) + YAML | Validating raw YAML string with ajv | Parse YAML to JSON first (via `yaml` npm package), then validate the JSON object against the workflow schema |
| WASM binary + Astro build | Importing `.wasm` as a Vite module | Place in `public/wasm/` and `fetch()` at runtime; Vite module imports cause build complications |
| Dagre layout + React Flow custom nodes | Assuming dagre knows node dimensions | Dagre requires explicit width/height per node; custom nodes must declare dimensions or use `onNodesChange` to measure after render |
| Scoring engine + actionlint kinds | Assuming all actionlint `kind` values are documented | Extract actual kind values from the playground source (`encodeErrorAsMap`) or run actionlint locally with `{{json .}}` format |
| `wasm_exec.js` + Vite dev server | Vite rewrites `importScripts()` paths in workers | Use absolute paths (`/wasm/wasm_exec.js`) or configure Vite's `worker.format` to not transform classic workers |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| WASM binary on first paint critical path | Page load Time to Interactive >3s | Lazy-load WASM only when user navigates to tool page | Always -- even with compression, 1MB+ downloads are noticeable |
| Go GC pauses during lint | Intermittent 20-50ms freezes in worker thread results | Accept this as inherent to Go WASM; keep workflow size reasonable; debounce to reduce lint frequency | Workflows >1000 lines |
| Dagre relayout on every keystroke | Graph flickers, node positions reset constantly | Recalculate layout only when job/step structure changes, not on content edits | Workflows with >10 jobs |
| React Flow rendering all nodes on any change | FPS drops below 30, visible jank | `React.memo()` all custom nodes, use `useStore` selectors | >30 nodes visible simultaneously |
| CodeMirror re-creating extensions on state change | Editor cursor jumps, selection lost | Memoize extensions array, use `useCallback` for lint source | Always -- this is a common React + CodeMirror pitfall |
| Parsing YAML on main thread for schema validation | UI blocks during parse of large files | Parse YAML in the same Web Worker or a second worker | Workflows >500 lines |
| Fetching GitHub Actions schema on every lint | Network latency added to every lint cycle | Bundle the schema JSON or cache in IndexedDB/memory after first fetch | Always |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Executing user-provided YAML expressions (${{ }}) | XSS via expression injection if any expression evaluation is implemented | Never evaluate expressions -- only parse and validate syntax structurally |
| Sending workflow content to a server for validation | Leaking potentially sensitive workflow secrets/token patterns | All processing runs in-browser via WASM; never transmit workflow content |
| Loading WASM from a CDN without SRI | Supply chain attack could replace the WASM binary | Use Subresource Integrity (SRI) hash on the WASM `fetch()` or self-host exclusively |
| Using `eval()` or `Function()` to parse YAML expressions | Arbitrary code execution | Use a proper parser (regex pattern matching or AST) for `${{ }}` expression validation |
| Exposing the Go WASM runtime's `globalThis` functions | Other scripts on the page could call the linting function with crafted input | Scope all Go-exported functions inside the Web Worker; they are inaccessible from the main thread |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state while WASM downloads | User sees empty editor, thinks tool is broken | Show a skeleton with "Loading validator engine..." progress indicator |
| Lint results appear after 2+ second delay | User types, waits, then suddenly sees red squiggles | Show a subtle "Analyzing..." indicator in the status bar while the worker processes |
| Graph resets zoom/pan on every edit | User carefully zooms into a section, then it snaps back | Preserve viewport transform between graph updates; only reset on explicit "Reset View" action |
| Error count badge changes rapidly during typing | Distracting flickering numbers | Debounce the count update with a 500ms delay after lint completes |
| No explanation for why shellcheck issues are not caught | User knows their `run:` script has errors, validator misses them | Show a dismissible info banner: "Shell script analysis is not available in browser mode" |
| Scoring without context | User sees "72/100" with no understanding of what's wrong | Each score deduction must link to the specific diagnostic that caused it |
| Graph shows internal GitHub Actions concepts unfamiliar to beginners | "What is a matrix node?" | Include hover tooltips on graph nodes explaining the GitHub Actions concept |
| Editor does not support YAML folding/sections | Hard to navigate large workflow files | Enable CodeMirror's foldGutter extension for YAML |

## "Looks Done But Isn't" Checklist

- [ ] **WASM loading:** Loads with Brotli compression AND correct MIME type in production -- verify with `curl -H "Accept-Encoding: br" -I` against production URL
- [ ] **Web Worker:** WASM runs in worker, not main thread -- verify by checking Chrome DevTools Performance tab shows no long tasks on main thread during lint
- [ ] **`wasm_exec.js` version:** Matches Go compiler version used to build the binary -- verify by comparing `wasm_exec.js` header comment with `go version` output
- [ ] **Diagnostic line mapping:** actionlint 1-based lines correctly convert to CodeMirror positions -- verify by clicking a diagnostic and confirming cursor lands on the right line/column
- [ ] **Two-pass deduplication:** No duplicate diagnostics for the same issue from schema validation and actionlint -- verify with a workflow that triggers overlapping rules
- [ ] **Memory stability:** 50 consecutive lint operations do not increase memory beyond 2x baseline -- verify with Chrome DevTools Memory tab
- [ ] **Schema validation handles `${{ }}` expressions:** ajv does not reject valid expression syntax in `if:`, `env:`, and `with:` fields -- verify with workflows using expressions in various positions
- [ ] **Graph handles matrix strategy:** Matrix strategies show collapsed by default, not 64 individual nodes -- verify with a 3-axis matrix workflow
- [ ] **Mobile experience:** Tool is usable on tablet/phone -- verify CodeMirror is touchable, graph is pan/zoomable, diagnostics are readable
- [ ] **SEO:** Tool page has proper meta tags, JSON-LD, and renders meaningful content (not just an empty island) -- verify with Google's Rich Results Test
- [ ] **Offline capability:** After first load, WASM binary is cached -- verify by loading tool, going offline, and reloading

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| WASM on main thread (no worker) | MEDIUM | Refactor to Web Worker + message passing. All WASM interaction code must move. ~2-3 day refactor. |
| No diagnostic deduplication | LOW | Add a dedup step in the result merger. ~0.5 day fix but requires retesting all scoring. |
| React Flow performance collapse | MEDIUM | Add `React.memo()` to all custom nodes, extract `nodeTypes` to module scope, memoize callbacks. ~1-2 days. |
| `wasm_exec.js` version mismatch | LOW | Recompile WASM and recopy `wasm_exec.js` from correct Go version. ~1 hour if build pipeline is set up. |
| Hydration errors from wrong directive | LOW | Change `client:load` to `client:only="react"`. ~15 minutes. May require layout skeleton adjustments. |
| Binary size too large (no compression) | LOW | Add Brotli/gzip configuration to hosting platform. ~30 minutes. |
| Go WASM memory leak | HIGH | Requires rewriting the JS-Go bridge to avoid per-call `js.FuncOf` allocation. May require worker restart logic. ~2-3 days. |
| Schema + actionlint conflicting diagnostics | MEDIUM | Implement priority-based merge with source tagging. Requires audit of all overlapping rule pairs. ~1-2 days. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: WASM binary size | Phase 1 (WASM compilation) | `ls -la` shows compressed binary <1.5MB; Lighthouse performance >90 |
| P2: Main thread blocking | Phase 1 (WASM infrastructure) | Chrome DevTools shows zero long tasks on main thread during lint |
| P3: Missing shellcheck/pyflakes | Phase 2 (Actionlint integration) | Tool documentation explicitly lists supported vs unsupported checks |
| P4: MIME type misconfiguration | Phase 1 (Deployment config) | `curl -I production-url/wasm/actionlint.wasm` shows `Content-Type: application/wasm` |
| P5: Vite plugin conflicts | Phase 1 (Architecture decision) | No `vite-plugin-wasm` in `package.json`; WASM loaded via `public/` + `fetch()` |
| P6: `wasm_exec.js` version mismatch | Phase 1 (Build pipeline) | CI script copies `wasm_exec.js` from `GOROOT` in same step as WASM compilation |
| P7: Go WASM memory leaks | Phase 2 (Worker integration) | Memory profiling after 50 lint cycles shows <2x baseline memory |
| P8: Two-pass diagnostic conflicts | Phase 3 (Scoring/results) | 20 test workflows produce zero duplicate diagnostics across passes |
| P9: React Flow performance | Phase 3 (Graph visualization) | 50-node graph maintains >30 FPS during drag operations |
| P10: Astro hydration mismatch | Phase 2 (UI shell) | Zero hydration errors in browser console; `client:only="react"` used for all WASM-dependent components |

## Sources

### Primary (HIGH confidence)
- [actionlint GitHub repository](https://github.com/rhysd/actionlint) -- playground source code, Makefile, main.go, Go dependencies (go.mod)
- [actionlint playground main.go](https://github.com/rhysd/actionlint/blob/main/playground/main.go) -- WASM function registration pattern (`window.Set("runActionlint", js.FuncOf(runActionlint))`)
- [actionlint playground Makefile](https://github.com/rhysd/actionlint/blob/main/playground/Makefile) -- build process: `GOOS=js GOARCH=wasm go build -o main.wasm`, no wasm-opt, no compression
- [Go Wiki: WebAssembly](https://go.dev/wiki/WebAssembly) -- minimum 2MB binary size, `wasm_exec.js` requirements
- [Go issue #59061: wasm does not return memory to OS](https://github.com/golang/go/issues/59061) -- confirmed memory leak behavior
- [Go issue #74342: JS pointer to Go-Wasm causes memory leak](https://github.com/golang/go/issues/74342) -- `syscall/js` bridge memory leak
- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance) -- memoization requirements, re-render triggers
- [vite-plugin-wasm npm](https://www.npmjs.com/package/vite-plugin-wasm) -- plugin configuration, top-level-await requirement, worker.plugins note

### Secondary (MEDIUM confidence)
- [Eli Bendersky: Go WebAssembly notes](https://eli.thegreenplace.net/2024/notes-on-running-go-in-the-browser-with-webassembly/) -- ~2.5MB binary sizes, TinyGo 75% reduction but reflection limitations
- [Digital Flapjack: Go WASM in Web Workers](https://digitalflapjack.com/blog/go-wasm-workers/) -- Worker initialization pattern, `importScripts("wasm_exec.js")`, readiness signaling
- [Minimizing Go WASM Binary Size](https://dev.bitolog.com/minimizing-go-webassembly-binary-size/) -- fmt costs 400KB, TinyGo reduces 2MB to 86KB, gzip reduces 2MB to 500KB
- [Boot.dev: Go WASM Web Workers](https://blog.boot.dev/golang/running-go-in-the-browser-wasm-web-workers/) -- Worker communication patterns
- [TinyGo language support](https://tinygo.org/docs/reference/lang-support/) -- incomplete reflection, syscall limitations
- [GitHub workflow JSON schema](https://json.schemastore.org/github-workflow.json) -- SchemaStore schema for workflow validation
- [@actions/workflow-parser npm](https://www.npmjs.com/package/@actions/workflow-parser) -- GitHub's own TypeScript workflow parser
- [actionlint usage docs](https://github.com/rhysd/actionlint/blob/main/docs/usage.md) -- Error struct fields: message, filepath, line, column, kind (1-based)
- [Astro template directives](https://docs.astro.build/en/reference/directives-reference/) -- `client:only` skips SSR entirely
- [React Flow dagre example](https://reactflow.dev/examples/layout/dagre) -- dagre requires explicit node dimensions

### Tertiary (LOW confidence)
- [Gist: Minimizing Go WASM multi-pronged approach](https://gist.github.com/paralin/57b0b6a03da3f38709c76480dce1be45) -- community optimization techniques
- [Go issue #27462: WASM OOM on mobile](https://github.com/golang/go/issues/27462) -- mobile devices may OOM on large WASM binaries
- [Fermyon: TinyGo WASM optimization](https://www.fermyon.com/blog/optimizing-tinygo-wasm) -- `-no-debug` removes 2/3 of binary size

---
*Pitfalls research for: WASM-based GitHub Actions Workflow Validator on Astro 5*
*Researched: 2026-03-04*
