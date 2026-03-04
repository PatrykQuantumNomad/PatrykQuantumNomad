# Architecture Research

**Domain:** GitHub Actions Workflow Validator (WASM-based browser tool)
**Researched:** 2026-03-04
**Confidence:** HIGH (verified against actionlint source, Vite docs, existing codebase patterns)

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Astro Page Layer                                    │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │  GhaValidatorPage.astro    │  │  /tools/gha-validator/rules/[code]    │ │
│  │  (client:only="react")     │  │  (getStaticPaths, build-time)         │ │
│  └────────────┬───────────────┘  └────────────────────────────────────────┘ │
├───────────────┼─────────────────────────────────────────────────────────────┤
│               │              React Island Layer                             │
│  ┌────────────▼───────────────┐  ┌────────────────────────────────────────┐ │
│  │  GhaValidator.tsx          │  │  GhaResultsPanel.tsx                   │ │
│  │  (EditorPanel + Results)   │  │  (Score, Categories, Violations,      │ │
│  │                            │  │   Graph tab with React Flow)           │ │
│  └────────────┬───────────────┘  └────────────┬───────────────────────────┘ │
├───────────────┼───────────────────────────────┼─────────────────────────────┤
│               │              Nanostore Bridge                               │
│  ┌────────────▼───────────────────────────────▼───────────────────────────┐ │
│  │  ghaValidatorStore.ts (atom<GhaAnalysisResult | null>)                │ │
│  │  ghaAnalyzing, ghaEditorViewRef, ghaResultsStale                      │ │
│  └────────────┬───────────────────────────────────────────────────────────┘ │
├───────────────┼─────────────────────────────────────────────────────────────┤
│               │              Engine Layer (Main Thread)                     │
│  ┌────────────▼───────────────┐  ┌────────────────────────────────────────┐ │
│  │  engine.ts                 │  │  scorer.ts                             │ │
│  │  (Two-pass orchestrator)   │  │  (Category-weighted scoring)           │ │
│  │  Pass 1: Schema (ajv)     │  │                                        │ │
│  │  Pass 2: WASM (Worker)    │  │  graph-data-extractor.ts               │ │
│  └──────┬──────────┬─────────┘  │  (triggers -> jobs -> steps)           │ │
│         │          │             └────────────────────────────────────────┘ │
├─────────┼──────────┼────────────────────────────────────────────────────────┤
│         │          │             Worker Layer                                │
│  ┌──────▼──────┐  ┌▼─────────────────────────────────────────────────────┐ │
│  │ ajv schema  │  │  actionlint.worker.ts                                │ │
│  │ validator   │  │  ┌─────────────────────────────────────────────────┐  │ │
│  │ (sync,      │  │  │  wasm_exec.js (Go runtime bridge)              │  │ │
│  │  main       │  │  │  actionlint.wasm (Go-compiled WASM binary)     │  │ │
│  │  thread)    │  │  │  window.runActionlint -> postMessage results   │  │ │
│  └─────────────┘  │  └─────────────────────────────────────────────────┘  │ │
│                    └──────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Build Pipeline Layer                                │
│  ┌──────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  Pre-built actionlint.wasm           │  │  public/wasm/ static assets │ │
│  │  (downloaded from actionlint         │  │  served by Astro/Vite       │ │
│  │   playground deployment)             │  │  No Vite WASM plugin needed │ │
│  └──────────────────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New vs Modified | Integration Point |
|-----------|----------------|-----------------|-------------------|
| `GhaValidator.tsx` | Top-level React island, layout (EditorPanel + ResultsPanel) | NEW | `client:only="react"` on Astro page |
| `GhaEditorPanel.tsx` | CodeMirror 6 YAML editor, Analyze button, keyboard shortcut | NEW (follows K8sEditorPanel pattern) | Nanostore bridge |
| `use-codemirror-gha.ts` | CodeMirror hook with YAML lang, localStorage, stale detection | NEW (follows use-codemirror-k8s.ts pattern) | Editor theme reuse |
| `GhaResultsPanel.tsx` | Tabbed results (Score, Categories, Violations, Graph) | NEW (follows K8sResultsPanel pattern) | Nanostore bridge |
| `ghaValidatorStore.ts` | Nanostores atoms for result, analyzing, editorViewRef, stale | NEW (follows k8sAnalyzerStore.ts pattern) | Cross-component state |
| `engine.ts` | Two-pass orchestrator: schema pass + WASM pass, merge results | NEW (novel two-pass pattern) | Called from EditorPanel |
| `schema-validator.ts` | ajv with SchemaStore github-workflow.json schema | NEW (follows compose schema-validator.ts) | Pass 1 of engine |
| `actionlint.worker.ts` | Web Worker loading wasm_exec.js + actionlint.wasm | NEW (first Worker in codebase) | Pass 2 of engine |
| `actionlint-bridge.ts` | Promise wrapper around Worker postMessage/onmessage | NEW | Engine calls this |
| `scorer.ts` | Category-weighted scoring with diminishing returns | NEW (reuses formula from existing tools) | Engine output |
| `graph-data-extractor.ts` | Parse workflow YAML into trigger/job/step graph | NEW (different graph model than K8s/Compose) | Results Graph tab |
| `rules/index.ts` | Rule metadata registry mapping actionlint kinds to docs | NEW | Rule pages + scoring |
| `badge-generator.ts` | SVG score badge for PNG download | NEW (follows existing pattern exactly) | Results panel |
| `url-state.ts` | lz-string encoding with `#gha=` prefix | NEW (follows existing pattern) | Shareable URLs |
| `sample-workflow.ts` | Pre-loaded sample with deliberate issues | NEW | Editor default content |
| `astro.config.mjs` | No changes needed for WASM (static asset approach) | UNCHANGED | N/A |
| Rule doc pages `[code].astro` | getStaticPaths for per-rule SEO pages | NEW (follows K8s pattern) | Site integration |
| Editor theme (`editor-theme.ts`) | Shared dark theme, syntax highlighting, gutter markers | EXISTING (no changes) | Import reuse |
| `highlight-line.ts` | Click-to-navigate line highlight field | EXISTING (no changes) | Import reuse |

## Recommended Project Structure

```
src/
├── lib/tools/gha-validator/
│   ├── engine.ts                    # Two-pass orchestrator
│   ├── schema-validator.ts          # ajv + SchemaStore schema (Pass 1)
│   ├── actionlint-bridge.ts         # Worker message wrapper (Pass 2)
│   ├── actionlint.worker.ts         # Web Worker (loads wasm_exec.js + .wasm)
│   ├── types.ts                     # All TypeScript interfaces
│   ├── scorer.ts                    # Category-weighted scoring
│   ├── graph-data-extractor.ts      # Workflow graph: triggers -> jobs -> steps
│   ├── sample-workflow.ts           # Pre-loaded sample YAML
│   ├── badge-generator.ts           # SVG score badge -> PNG
│   ├── url-state.ts                 # lz-string #gha= encoding
│   ├── use-codemirror-gha.ts        # CodeMirror 6 React hook
│   └── rules/
│       ├── index.ts                 # allGhaRules + allDocumentedGhaRules
│       ├── related.ts               # Related rule mappings
│       ├── rule-metadata.ts         # Actionlint kind -> rule doc metadata
│       ├── schema/                  # Schema rule metadata (ajv-driven)
│       │   └── index.ts
│       └── actionlint/              # Actionlint rule metadata (WASM-driven)
│           └── index.ts
├── components/tools/
│   ├── GhaValidator.tsx             # Top-level layout component
│   ├── GhaEditorPanel.tsx           # CodeMirror editor + Analyze button
│   └── gha-results/
│       ├── GhaResultsPanel.tsx      # Tabbed results container
│       ├── GhaCategoryBreakdown.tsx  # Per-category scores
│       ├── GhaViolationList.tsx      # Grouped violations
│       ├── GhaEmptyState.tsx         # Clean workflow state
│       ├── GhaShareActions.tsx       # Share/download actions
│       ├── GhaPromptGenerator.tsx    # AI prompt export
│       ├── GhaWorkflowGraph.tsx      # React Flow workflow DAG
│       ├── GhaJobNode.tsx            # Custom React Flow node (job)
│       ├── GhaTriggerNode.tsx        # Custom React Flow node (trigger)
│       ├── GhaStepNode.tsx           # Custom React Flow node (step)
│       └── GhaGraphSkeleton.tsx      # Loading skeleton
├── stores/
│   └── ghaValidatorStore.ts         # Nanostores atoms
├── pages/tools/gha-validator/
│   ├── index.astro                  # Main tool page
│   └── rules/
│       └── [code].astro             # Per-rule documentation pages
└── public/wasm/
    ├── actionlint.wasm              # Pre-built Go WASM binary (~2.5 MB)
    └── wasm_exec.js                 # Go runtime bridge (~18 KB)
```

### Structure Rationale

- **`src/lib/tools/gha-validator/`:** Follows the exact pattern of `compose-validator/` and `k8s-analyzer/` -- engine, scorer, types, rules, URL state, badge generator, and CodeMirror hook all co-located.
- **`src/components/tools/gha-results/`:** Follows the `k8s-results/` pattern with dedicated subcomponents per result tab section.
- **`public/wasm/`:** Static assets served as-is by Astro/Vite. The WASM binary and wasm_exec.js are fetched at runtime by the Web Worker, not bundled through Vite's module system. This avoids plugin complexity entirely.

## Architectural Patterns

### Pattern 1: Two-Pass Validation Engine

**What:** The engine runs validation in two sequential passes. Pass 1 (schema validation via ajv) runs synchronously on the main thread. Pass 2 (actionlint WASM) runs asynchronously in a Web Worker. Results from both passes are merged, deduplicated, and scored.

**When to use:** When combining a fast structural validator (JSON Schema) with a deep semantic analyzer (actionlint WASM) that has different performance characteristics.

**Trade-offs:**
- PRO: Schema validation provides instant feedback even if WASM is still loading
- PRO: WASM runs off-thread, no UI jank during deep analysis
- PRO: Schema errors (missing required fields, wrong types) caught before WASM sees garbage
- CON: Must deduplicate overlapping findings between schema and actionlint
- CON: Two passes means slightly more total work, but Worker parallelism amortizes this

**Example:**

```typescript
// engine.ts
export async function runGhaEngine(rawText: string): Promise<GhaEngineResult> {
  const violations: GhaRuleViolation[] = [];

  // Pass 1: Schema validation (synchronous, main thread)
  const parseResult = parseWorkflowYaml(rawText);
  if (parseResult.parseErrors.length > 0) {
    violations.push(...parseResult.parseErrors);
  }
  if (parseResult.json) {
    const schemaViolations = validateWorkflowSchema(parseResult.json);
    const mapped = mapSchemaErrors(
      schemaViolations, parseResult.doc, parseResult.lineCounter
    );
    violations.push(...mapped);
  }

  // Pass 2: actionlint WASM (async, Web Worker)
  const wasmViolations = await runActionlintWasm(rawText);
  violations.push(...wasmViolations);

  // Deduplicate: prefer actionlint finding when both report same line+issue
  const deduped = deduplicateViolations(violations);
  deduped.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    violations: deduped,
    rulesRun: TOTAL_RULES,
    rulesPassed: TOTAL_RULES - new Set(deduped.map(v => v.ruleId)).size,
  };
}
```

### Pattern 2: Web Worker WASM Bridge

**What:** Go WASM cannot run on the main thread without blocking -- the Go runtime's `go.run()` call is blocking. A Web Worker isolates the Go runtime entirely. The bridge wraps the Worker postMessage/onmessage protocol in a Promise-based API.

**When to use:** Any Go-compiled WASM in a browser application where UI responsiveness matters.

**Trade-offs:**
- PRO: Zero UI jank during WASM execution
- PRO: Worker lifecycle is independent of React component lifecycle
- PRO: Can show a loading spinner while WASM initializes (~2-3 seconds first load)
- CON: Cannot share memory with main thread (structured clone overhead)
- CON: Worker initialization has one-time cost (fetch WASM binary, instantiate Go runtime)
- CON: Must handle Worker not-yet-ready state gracefully

**Example:**

```typescript
// actionlint-bridge.ts
let worker: Worker | null = null;
let ready = false;
let pendingResolve: ((errors: ActionlintError[]) => void) | null = null;

export function initActionlintWorker(): Promise<void> {
  return new Promise((resolve) => {
    worker = new Worker(
      new URL('./actionlint.worker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = ({ data }) => {
      if (data.action === 'ready') {
        ready = true;
        resolve();
      } else if (data.action === 'result') {
        pendingResolve?.(data.payload);
        pendingResolve = null;
      }
    };
  });
}

export function runActionlint(source: string): Promise<ActionlintError[]> {
  return new Promise((resolve) => {
    if (!worker || !ready) {
      resolve([]); // Graceful fallback if Worker not ready
      return;
    }
    pendingResolve = resolve;
    worker.postMessage({ action: 'lint', payload: source });
  });
}
```

```typescript
// actionlint.worker.ts
// Classic worker approach for Go WASM compatibility
importScripts('/wasm/wasm_exec.js');

declare const Go: any;
const go = new Go();

// Global callbacks that Go WASM will invoke
(self as any).onCheckCompleted = (errors: any[]) => {
  self.postMessage({ action: 'result', payload: errors });
};
(self as any).showError = (msg: string) => {
  self.postMessage({ action: 'error', payload: msg });
};
(self as any).getYamlSource = () => currentSource;
(self as any).dismissLoading = () => {};

let currentSource = '';

WebAssembly.instantiateStreaming(fetch('/wasm/actionlint.wasm'), go.importObject)
  .then((result) => {
    go.run(result.instance);
    self.postMessage({ action: 'ready' });
  });

self.onmessage = ({ data }) => {
  if (data.action === 'lint') {
    currentSource = data.payload;
    (self as any).runActionlint(data.payload);
  }
};
```

### Pattern 3: Workflow Graph Data Model (Triggers -> Jobs -> Steps)

**What:** Unlike the K8s and Compose graph models (which show resource relationships), the GitHub Actions graph shows execution flow: event triggers connect to jobs, jobs have dependency edges (needs), and each job contains ordered steps. This is a fundamentally different DAG structure.

**When to use:** Visualizing GitHub Actions workflow execution topology.

**Trade-offs:**
- PRO: Shows the actual execution order users care about
- PRO: Highlights `needs` dependency chains and parallelism opportunities
- PRO: Step-level detail shows action usage and script blocks
- CON: Large workflows with many steps produce dense graphs
- CON: Matrix strategy creates conceptual parallelism not easily shown in a flat DAG

**Example:**

```typescript
// graph-data-extractor.ts
export type GhaNodeType = 'trigger' | 'job' | 'step';

export interface GhaGraphNode {
  id: string;
  type: GhaNodeType;
  label: string;
  metadata: {
    // Trigger: event name, filters
    // Job: runs-on, matrix, if condition
    // Step: uses/run, name, id
    [key: string]: unknown;
  };
}

export interface GhaGraphEdge {
  sourceId: string;
  targetId: string;
  edgeType: 'triggers' | 'needs' | 'contains';
  label?: string;
}

export interface GhaGraphData {
  nodes: GhaGraphNode[];
  edges: GhaGraphEdge[];
}

export function extractWorkflowGraph(
  json: Record<string, unknown>
): GhaGraphData {
  const nodes: GhaGraphNode[] = [];
  const edges: GhaGraphEdge[] = [];

  // 1. Create trigger nodes from 'on' field
  const on = json.on as Record<string, unknown> | string | string[];
  const triggerEvents = normalizeTriggers(on);
  for (const event of triggerEvents) {
    nodes.push({
      id: `trigger:${event}`,
      type: 'trigger',
      label: event,
      metadata: {},
    });
  }

  // 2. Create job nodes + needs edges
  const jobs = json.jobs as Record<string, unknown>;
  for (const [jobId, jobDef] of Object.entries(jobs)) {
    const job = jobDef as Record<string, unknown>;
    nodes.push({
      id: `job:${jobId}`,
      type: 'job',
      label: (job.name as string) || jobId,
      metadata: { runsOn: job['runs-on'], condition: job.if },
    });

    // Trigger -> job edges (jobs with no `needs` are triggered directly)
    const needs = job.needs as string | string[] | undefined;
    if (!needs) {
      for (const event of triggerEvents) {
        edges.push({
          sourceId: `trigger:${event}`,
          targetId: `job:${jobId}`,
          edgeType: 'triggers',
        });
      }
    } else {
      const needsList = Array.isArray(needs) ? needs : [needs];
      for (const dep of needsList) {
        edges.push({
          sourceId: `job:${dep}`,
          targetId: `job:${jobId}`,
          edgeType: 'needs',
          label: 'needs',
        });
      }
    }

    // 3. Create step nodes within each job
    const steps = job.steps as Record<string, unknown>[] | undefined;
    if (Array.isArray(steps)) {
      let prevStepId: string | null = null;
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepId = `step:${jobId}:${i}`;
        nodes.push({
          id: stepId,
          type: 'step',
          label: (step.name as string)
            || (step.uses as string)
            || `Step ${i + 1}`,
          metadata: {
            uses: step.uses,
            run: step.run ? '(script)' : undefined,
            stepIndex: i,
          },
        });

        if (i === 0) {
          edges.push({
            sourceId: `job:${jobId}`,
            targetId: stepId,
            edgeType: 'contains',
          });
        }
        if (prevStepId) {
          edges.push({
            sourceId: prevStepId,
            targetId: stepId,
            edgeType: 'contains',
          });
        }
        prevStepId = stepId;
      }
    }
  }

  return { nodes, edges };
}
```

### Pattern 4: Static WASM Asset Loading (No Vite Plugin)

**What:** Instead of using `vite-plugin-wasm` and `vite-plugin-top-level-await`, serve the WASM binary and wasm_exec.js as static assets from `public/wasm/`. The Web Worker fetches them via `fetch()` at runtime. This avoids Vite plugin complexity and works perfectly with Astro's static output mode.

**When to use:** When WASM is loaded in a Web Worker (not imported as an ES module in application code), and the project uses static site generation.

**Trade-offs:**
- PRO: Zero Vite plugin configuration -- no `vite-plugin-wasm`, no `vite-plugin-top-level-await`
- PRO: Static assets are cache-friendly (immutable hashing via manual versioned filenames)
- PRO: Works with any Vite version without plugin compatibility concerns
- PRO: Simpler mental model -- Worker is self-contained
- CON: No Vite-managed content hashing on the WASM binary (use manual versioning)
- CON: WASM binary must be committed to repo or downloaded in CI

**Rationale for this approach over vite-plugin-wasm:** The actionlint WASM binary is loaded by a Web Worker, not imported as an ES module in application code. The Worker uses `importScripts()` + `fetch()` to load Go's runtime bridge and the WASM binary. vite-plugin-wasm is designed for ES module WASM imports, which is not how Go WASM works (Go uses its own `wasm_exec.js` bridge, not standard ES WASM imports). Serving from `public/` is the correct architectural choice.

## Data Flow

### Analysis Request Flow

```
[User clicks Analyze / Cmd+Enter]
    |
[GhaEditorPanel] -> reads editor content
    |
[ghaAnalyzing.set(true)] <- nanostore
    |
[engine.runGhaEngine(rawText)]
    |
    +---> [Pass 1: parseWorkflowYaml + validateWorkflowSchema]
    |        (synchronous, main thread, ~5ms)
    |        Returns: schema violations with line/column
    |
    +---> [Pass 2: actionlintBridge.runActionlint(rawText)]
             (async, Web Worker, ~50-200ms)
             Worker.postMessage -> Go WASM -> onCheckCompleted -> postMessage
             Returns: ActionlintError[] with kind/line/column/message
    |
[Merge + deduplicate violations]
    |
[scorer.computeScore(violations)]
    |
[extractWorkflowGraph(parsedJson)]
    |
[ghaResult.set({ violations, score, graph, ... })] <- nanostore
    |
[GhaResultsPanel re-renders] <- subscribes to nanostore
    |
[setDiagnostics on EditorView] <- inline annotations
```

### WASM Worker Lifecycle

```
[First Analyze click]
    |
[initActionlintWorker()]
    |
[Worker created] -> importScripts('wasm_exec.js')
    |
[WebAssembly.instantiateStreaming(fetch('actionlint.wasm'))]
    |
[go.run(instance)] -> Go runtime starts
    |
[Worker.postMessage({ action: 'ready' })]
    |
[ready = true] -> subsequent lint requests processed instantly
    |
[Worker persists for page lifetime] -> no re-initialization cost
```

### State Management

```
[ghaValidatorStore.ts]
    |
    +-- ghaResult: atom<GhaAnalysisResult | null>
    |       | (subscribe)
    |   [GhaResultsPanel] <-> [GhaCategoryBreakdown]
    |                     <-> [GhaViolationList]
    |                     <-> [GhaWorkflowGraph]
    |
    +-- ghaAnalyzing: atom<boolean>
    |       | (subscribe)
    |   [GhaEditorPanel] -> disables button, shows spinner
    |   [GhaResultsPanel] -> shows analyzing state
    |
    +-- ghaEditorViewRef: atom<EditorView | null>
    |       | (subscribe)
    |   [GhaViolationList] -> click-to-navigate to line
    |
    +-- ghaResultsStale: atom<boolean>
            | (subscribe)
        [GhaResultsPanel] -> "Results outdated" badge
```

### Key Data Flows

1. **Schema validation flow:** Raw YAML string -> `yaml` library parse -> JSON object -> ajv validate against SchemaStore github-workflow.json -> map ajv errors to `GhaRuleViolation[]` with line numbers via LineCounter
2. **WASM validation flow:** Raw YAML string -> Worker.postMessage -> Go's `actionlint.Lint()` -> `onCheckCompleted(errors)` -> Worker.postMessage back -> map `ActionlintError[]` to `GhaRuleViolation[]`
3. **Graph extraction flow:** Parsed JSON object -> extract `on` triggers -> extract `jobs` with `needs` -> extract `steps` per job -> build `GhaGraphData` nodes/edges -> React Flow renders with dagre layout
4. **Score computation flow:** Merged violations -> map each to `GhaCategory` -> apply category weights -> diminishing returns formula per category -> 0-100 score + letter grade

## Critical Integration Details

### WASM Binary Acquisition Strategy

The actionlint playground (https://rhysd.github.io/actionlint/) already ships a pre-built WASM binary compiled with `GOOS=js GOARCH=wasm go build` and optimized with `wasm-opt -O --enable-bulk-memory`.

**Recommended approach:** Download the pre-built actionlint WASM binary and wasm_exec.js from the actionlint playground deployment. This avoids requiring Go and Binaryen in the build environment.

**Expected sizes:**
- `actionlint.wasm`: ~2.5 MB uncompressed (standard Go WASM includes full runtime). After wasm-opt, expect ~2.0-2.2 MB. GitHub Pages serves with gzip compression, so effective download is ~800 KB-1 MB.
- `wasm_exec.js`: ~18 KB (Go runtime JavaScript bridge from `$GOROOT/misc/wasm/wasm_exec.js`)

**Alternative (if custom build needed):**

```bash
# Requires Go toolchain + Binaryen
GOOS=js GOARCH=wasm go build -o public/wasm/actionlint.wasm ./path/to/main.go
wasm-opt -O -o public/wasm/actionlint.wasm public/wasm/actionlint.wasm --enable-bulk-memory
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" public/wasm/wasm_exec.js
```

**Confidence: HIGH** -- Verified against actionlint's own playground Makefile and deploy.bash at github.com/rhysd/actionlint/playground/.

### Actionlint WASM Interface

The Go WASM bridge (from `playground/main.go`) works as follows:

1. Go registers `window.runActionlint` via `js.FuncOf()` and `syscall/js`
2. JavaScript calls `window.runActionlint(yamlSource)` with the YAML string
3. Go runs `actionlint.Lint()` on the source
4. Go calls `window.onCheckCompleted(errors)` with results
5. Each error is a JS object: `{ message: string, line: number, column: number, kind: string }`

**The `kind` field** is the rule name that found the error. Complete list of kinds from actionlint source:

| actionlint `kind` | Description | WASM Available |
|-------------------|-------------|----------------|
| `syntax-check` | YAML/workflow syntax errors | Yes |
| `expression` | Expression type safety, injection detection | Yes |
| `events` | Event configuration validity | Yes |
| `job-needs` | Job dependency graph validation | Yes |
| `matrix` | Matrix configuration validity | Yes |
| `glob` | Branch/path filter pattern validation | Yes |
| `runner-label` | Valid runner label validation | Yes |
| `action` | Action version and input validation | Yes |
| `shell-name` | Shell name validation | Yes |
| `id` | Step/job ID uniqueness | Yes |
| `credentials` | Hardcoded credential detection | Yes |
| `env-var` | Environment variable naming | Yes |
| `permissions` | Permission scope validation | Yes |
| `workflow-call` | Reusable workflow syntax | Yes |
| `shellcheck` | Shell script quality | NO (requires external binary) |
| `pyflakes` | Python script quality | NO (requires external binary) |

**Important:** `shellcheck` and `pyflakes` kinds will NOT appear in WASM mode because the browser has no access to these external tools. This is confirmed by the actionlint playground behavior.

### Actionlint Kind to Scoring Category Mapping

| actionlint `kind` | Scoring Category | Rationale |
|-------------------|------------------|-----------|
| `syntax-check` | schema | Structural YAML/workflow syntax |
| `expression` | correctness | Expression type safety and injection |
| `events` | correctness | Event configuration validity |
| `job-needs` | correctness | Job dependency graph validity |
| `matrix` | correctness | Matrix configuration validity |
| `glob` | correctness | Branch/path filter patterns |
| `runner-label` | best-practice | Valid runner selection |
| `action` | best-practice | Action version and input validity |
| `shell-name` | correctness | Shell name validation |
| `id` | correctness | ID uniqueness |
| `credentials` | security | Hardcoded credential detection |
| `env-var` | best-practice | Environment variable naming |
| `permissions` | security | Permission scope validation |
| `workflow-call` | correctness | Reusable workflow syntax |

### Schema Rule Mapping for Pass 1 (ajv)

The SchemaStore github-workflow.json schema (JSON Schema draft-07, ~100 KB) catches structural issues that are validated before actionlint runs:

| Schema Error | Rule Code | Category |
|-------------|-----------|----------|
| YAML parse error | GA-S001 | schema |
| Missing required `on` field | GA-S002 | schema |
| Missing required `jobs` field | GA-S003 | schema |
| Unknown top-level property | GA-S004 | schema |
| Invalid event type | GA-S005 | schema |
| Invalid job property | GA-S006 | schema |
| Invalid step property | GA-S007 | schema |
| Invalid permission value | GA-S008 | schema |

### Deduplication Strategy

Both passes may flag the same issue. Deduplication rules:

1. **Same line + overlapping message:** Keep the actionlint finding (richer context, includes `kind`)
2. **Schema-only finding:** Keep (actionlint may not catch structural issues it assumes are valid YAML)
3. **Actionlint-only finding:** Keep (semantic checks beyond schema capability)
4. **Collision heuristic:** Match on `(line, column)` pair. If both passes report on the same position, prefer the actionlint finding and discard the schema finding.

### WASM Loading Strategy for Performance

The WASM binary is large (~2.5 MB uncompressed). Loading strategy matters for UX:

1. **Lazy initialization:** Do NOT load WASM on page load. Initialize the Worker only when the user first clicks "Analyze."
2. **Show loading state:** Display "Loading analyzer..." spinner during first-time WASM initialization (~2-3 seconds).
3. **Keep Worker alive:** After initialization, the Worker persists for the page lifetime. Subsequent analyses are near-instant (~50-200ms).
4. **Graceful degradation:** If WASM fails to load (old browser, network error), fall back to schema-only validation with a notification banner: "Deep analysis unavailable -- showing structural validation only."
5. **Pass 1 is instant:** Schema validation runs synchronously on the main thread regardless of WASM state. Users see schema results immediately, then WASM results merge when ready.

### No Astro/Vite Configuration Changes Required

```
// astro.config.mjs -- NO changes needed for WASM loading
//
// The WASM binary lives in public/wasm/ and is served as a static asset.
// The Web Worker fetches it via fetch(), bypassing Vite's module system.
// No vite-plugin-wasm or vite-plugin-top-level-await required.
```

The only Vite interaction is Worker bundling. Since the Worker is created with `new Worker(new URL('./actionlint.worker.ts', import.meta.url))`, Vite automatically bundles it as a separate chunk. This is built-in Vite functionality requiring no configuration.

**However:** If the Worker uses `importScripts()` (classic worker), it must NOT be a module worker. The `type: 'module'` option would prevent `importScripts()` from working. Use the classic worker pattern:

```typescript
// Option A: Classic worker (recommended for Go WASM)
const worker = new Worker(
  new URL('./actionlint.worker.ts', import.meta.url)
);
// Do NOT pass { type: 'module' } -- importScripts is classic-only
```

### React Flow Graph Architecture

The workflow graph is structurally different from the K8s and Compose graphs:

| Aspect | Compose Graph | K8s Graph | GHA Workflow Graph |
|--------|--------------|-----------|-------------------|
| Node types | Service | 6 K8s resource kinds | 3: trigger, job, step |
| Edge types | depends_on + condition | 9 relationship types | 3: triggers, needs, contains |
| Layout direction | Top-to-bottom (dagre) | Top-to-bottom (dagre) | Top-to-bottom (dagre rankdir=TB) |
| Phantom nodes | No | Yes (unresolved refs) | No |
| Cycle detection | Yes (compose allows cycles) | No | No (needs is acyclic by GitHub spec) |
| Node content | Service name + image | Kind + name + namespace | Type-specific metadata |

**Custom React Flow node components:**

- `GhaTriggerNode`: Event icon + event name (push, pull_request, schedule, etc.). Colored differently from jobs (e.g., blue/cyan accent).
- `GhaJobNode`: Job name + runs-on label + optional `if` condition badge. Primary node type, largest visual weight.
- `GhaStepNode`: Step name + uses/run indicator + step index. Smaller than job nodes, visually subordinate.

**Layout:** Use dagre with `rankdir: 'TB'` (top-to-bottom). Triggers at top, jobs in middle, steps at bottom. Steps are visually grouped within their parent job by proximity (dagre natural clustering via edge weights, not explicit subgraphs).

**Lazy loading:** React Flow lazy-loaded via `React.lazy()` matching the existing Compose/K8s pattern (222 KB separate chunk, loads only on Graph tab click).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Small workflows (1-3 jobs) | Default view shows all steps expanded in graph |
| Medium workflows (4-10 jobs) | Collapse step details by default, expand on click |
| Large workflows (10+ jobs, 50+ steps) | Default to job-level-only graph, expand steps on demand |

### Scaling Priorities

1. **First bottleneck:** WASM initialization time (~2-3 seconds). Mitigate with lazy loading + loading state UI. After first init, subsequent analyses are instant.
2. **Second bottleneck:** Very large workflow files (1000+ lines). WASM analysis time scales linearly. Show a progress indicator for files > 500 lines.
3. **Graph rendering:** React Flow handles hundreds of nodes well. Dagre layout may slow at 200+ nodes. For workflows that large, default to job-level-only view.

## Anti-Patterns

### Anti-Pattern 1: Importing WASM via Vite Plugin

**What people do:** Add `vite-plugin-wasm` and try to `import` the actionlint WASM binary as an ES module.
**Why it's wrong:** Go WASM does not export standard ES module functions. It uses `syscall/js` to register callbacks on the `window` object via `wasm_exec.js`. The bridge expects the traditional `WebAssembly.instantiateStreaming` pattern, not ES module imports.
**Do this instead:** Serve `actionlint.wasm` and `wasm_exec.js` as static assets from `public/wasm/`. Load them in a Web Worker using `importScripts()` + `fetch()`.

### Anti-Pattern 2: Running Go WASM on the Main Thread

**What people do:** Load `wasm_exec.js` and the WASM binary directly in the main thread, calling `go.run()` synchronously.
**Why it's wrong:** `go.run()` is blocking -- it starts the Go runtime event loop and does not return until the Go program exits. This freezes the UI for the entire lifetime of the Go program.
**Do this instead:** Run Go WASM exclusively in a Web Worker. Communicate via `postMessage`/`onmessage`.

### Anti-Pattern 3: Reinitializing Worker on Every Analysis

**What people do:** Create a new Worker, load WASM, run analysis, terminate Worker -- for every Analyze click.
**Why it's wrong:** WASM initialization costs 2-3 seconds. Doing this on every analysis creates unacceptable latency.
**Do this instead:** Initialize the Worker once (lazy, on first use). Keep it alive for the page lifetime. Subsequent analyses reuse the initialized Worker.

### Anti-Pattern 4: Merging Schema and WASM Results Without Deduplication

**What people do:** Concatenate violations from both passes without checking for overlaps.
**Why it's wrong:** Both passes may flag the same issue (e.g., unknown event type), resulting in duplicate violations that inflate the issue count and distort the score.
**Do this instead:** Deduplicate on `(line, column)` pairs, preferring the actionlint finding when both passes report at the same position.

### Anti-Pattern 5: Using Module Workers with importScripts

**What people do:** Create the Worker with `{ type: 'module' }` but also use `importScripts()` to load `wasm_exec.js`.
**Why it's wrong:** `importScripts()` is not available in module workers. It is a classic worker API only.
**Do this instead:** Use a classic worker (no `type: 'module'`) for the Go WASM bridge, since `wasm_exec.js` requires `importScripts()`. Vite will still bundle it correctly.

## Integration Points

### Existing Components Reused (No Modification)

| Component | Reuse Pattern |
|-----------|---------------|
| `editor-theme.ts` | Import `editorTheme`, `oneDarkTheme`, `a11ySyntaxHighlighting` |
| `highlight-line.ts` | Import `highlightLineField` for click-to-navigate |
| `ScoreGauge.tsx` | Import directly (generic score display component) |
| `FullscreenToggle.tsx` | Import directly (generic toggle button) |
| `@codemirror/lang-yaml` | Already installed for Compose/K8s tools |
| `yaml` (eemeli) | Already installed for YAML parsing |
| `ajv` + `ajv-formats` | Already installed for JSON Schema validation |
| `@xyflow/react` + `@dagrejs/dagre` | Already installed for graph visualization |
| `lz-string` | Already installed for URL state encoding |
| `nanostores` | Already installed for cross-component state |

### New Dependencies Required

| Dependency | Purpose | Size Impact |
|------------|---------|-------------|
| `actionlint.wasm` | Pre-built Go WASM binary | ~2.5 MB in `public/` (gzipped ~800 KB-1 MB download) |
| `wasm_exec.js` | Go runtime bridge | ~18 KB in `public/` |

**No new npm packages required.** The entire WASM integration uses browser-native Web Worker and WebAssembly APIs. All other dependencies (CodeMirror, yaml, ajv, React Flow, nanostores, lz-string) are already installed.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Astro page <-> React island | `client:only="react"` directive | Same pattern as K8s/Compose/Dockerfile tools |
| React components <-> Engine | Nanostore atoms | Same pattern as existing tools |
| Engine (main thread) <-> WASM Worker | `postMessage`/`onmessage` via bridge | NEW: first Worker in codebase |
| Engine <-> Schema validator | Direct function call (synchronous) | Same pattern as Compose schema-validator |
| Results panel <-> Graph tab | React.lazy for WorkflowGraph | Same pattern as K8s/Compose graph lazy loading |

## Build Order Recommendations

Based on dependency analysis, the recommended build order is:

1. **WASM infrastructure first:** Download pre-built WASM binary, create Worker, verify it loads and returns results. This is the highest-risk component and should be proven early.
2. **Two-pass engine:** Schema validator (reuses ajv patterns), WASM bridge integration, deduplication logic.
3. **Scoring and rules metadata:** Category mapping, scoring weights, rule documentation data.
4. **UI components:** CodeMirror editor, results panel, following established patterns exactly.
5. **Workflow graph:** React Flow visualization with custom nodes, separate from the core validation pipeline.
6. **Rule documentation pages:** getStaticPaths, per-rule pages, related rules.
7. **Site integration:** Header nav, homepage callout, tools page, JSON-LD, OG image, blog post.

## Sources

- [actionlint GitHub repository](https://github.com/rhysd/actionlint) -- playground source, WASM build process, error structure
- [actionlint playground](https://rhysd.github.io/actionlint/) -- live WASM implementation reference
- [actionlint playground main.go](https://pkg.go.dev/github.com/rhysd/actionlint/playground) -- Go WASM bridge source
- [actionlint checks documentation](https://github.com/rhysd/actionlint/blob/main/docs/checks.md) -- complete rule kind list
- [Go Wiki: WebAssembly](https://go.dev/wiki/WebAssembly) -- Go WASM compilation reference
- [Notes on running Go in the browser with WebAssembly](https://eli.thegreenplace.net/2024/notes-on-running-go-in-the-browser-with-webassembly/) -- binary size data (~2.5 MiB), best practices
- [Using Go with Wasm and Web Workers](https://digitalflapjack.com/blog/go-wasm-workers/) -- Worker + Go WASM pattern with postMessage
- [Vite Features: Web Workers](https://vite.dev/guide/features#web-workers) -- Worker bundling in Vite
- [Vite Features: WebAssembly](https://vite.dev/guide/features#webassembly) -- Native WASM support limitations, ?init pattern
- [vite-plugin-wasm](https://github.com/Menci/vite-plugin-wasm) -- Why NOT needed for Go WASM (ES module pattern incompatible with Go bridge)
- [SchemaStore github-workflow.json](https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-workflow.json) -- JSON Schema draft-07 for workflow validation
- [Binaryen wasm-opt](https://github.com/WebAssembly/binaryen) -- WASM binary optimization (10-20% size reduction)
- [Go WASM in Web Worker with React](https://medium.com/@booimangang/how-i-ran-go-wasm-in-a-web-worker-with-next-js-without-freezing-the-browser-100bffa8630c) -- React + Worker + Go WASM pattern

---
*Architecture research for: GitHub Actions Workflow Validator (v1.13)*
*Researched: 2026-03-04*
