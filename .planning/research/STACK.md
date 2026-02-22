# Stack Research: Docker Compose Validator

**Domain:** Browser-based Docker Compose file validation with YAML parsing, JSON Schema validation, semantic analysis, and interactive dependency graph visualization
**Researched:** 2026-02-22
**Confidence:** HIGH

## Existing Stack (DO NOT reinstall -- already validated)

| Technology | Version | Relevance to Docker Compose Validator |
|------------|---------|---------------------------------------|
| Astro | ^5.3.0 | Static pages, tool page routing, MDX rule documentation |
| TypeScript | ^5.9.3 | All validation logic, type-safe rule engine |
| React 19 | ^19.2.4 | Client-side React island (`client:only="react"`) for the validator tool |
| Tailwind CSS | ^3.4.19 | Layout, results display, graph container styling |
| CodeMirror 6 | ^6.0.2 (`codemirror`) | Editor foundation -- already installed with `basicSetup` |
| @codemirror/legacy-modes | ^6.5.2 | Used for Dockerfile syntax (NOT needed for YAML -- see below) |
| @codemirror/theme-one-dark | ^6.1.3 | Editor theme -- reuse directly |
| @codemirror/lint | 6.9.4 (transitive via `codemirror`) | `lintGutter()`, `setDiagnostics()` -- already in use, same pattern applies |
| @codemirror/language | (transitive via `codemirror`) | `StreamLanguage` -- already installed |
| @codemirror/state | (transitive via `codemirror`) | `StateEffect`, `StateField` -- already in use |
| @codemirror/view | (transitive via `codemirror`) | `EditorView`, `Decoration` -- already in use |
| nanostores | ^1.1.0 | Cross-framework state (editor ref, analysis results, stale flag) |
| @nanostores/react | ^1.0.0 | React bindings for nanostores |
| lz-string | ^1.5.0 | URL state compression for shareable compose files |
| satori + sharp | ^0.19.2 / ^0.34.5 | OG image generation for tool page |
| gsap | ^3.14.2 | Animations for results display |

**Existing patterns to reuse directly (zero new code needed):**
- `use-codemirror.ts` hook pattern (create once, destroy on unmount, View Transitions safety)
- `setDiagnostics()` push-based lint pattern (button-triggered, not real-time)
- `highlightLineField` + `highlightAndScroll()` for click-to-line navigation
- `editor-theme.ts` (oneDarkTheme, a11ySyntaxHighlighting, editorTheme)
- Rule engine pattern from `engine.ts` (iterate rules, collect violations, sort by line)
- Types pattern from `types.ts` (RuleViolation, LintViolation, AnalysisResult, ScoreResult)
- Scorer pattern from `scorer.ts` (category-weighted scoring with diminishing returns)
- URL state pattern from `url-state.ts` (lz-string compress/decompress)
- Badge generator pattern from `badge-generator.ts` (SVG-to-PNG export)

---

## New Dependencies Required

### 1. YAML Parsing with Line Numbers: `yaml` (Eemeli Piirainen)

| Property | Value |
|----------|-------|
| **Package** | `yaml` |
| **Version** | 2.8.2 (latest, Feb 2026) |
| **Unpacked size** | 683 KB |
| **Estimated gzip** | ~27 KB (per official docs) |
| **Purpose** | Parse Docker Compose YAML into a document AST with source range tracking |
| **License** | ISC |

**Why `yaml` (Eemeli) and not alternatives:**

| Alternative | Why Not |
|-------------|---------|
| `js-yaml` (4.1.0) | No AST access. Returns plain JS objects -- no source positions, no range tracking. Cannot map validation errors back to line numbers. This is a dealbreaker. |
| `yaml-unist-parser` | Unmaintained. Last published 2021. Small ecosystem. |
| Hand-written parser | YAML is notoriously difficult to parse (9 scalar styles, anchors, flow/block, multi-doc). Not viable. |

**Core API for this project:**

```typescript
import { parseDocument, LineCounter } from 'yaml';

// Parse with line tracking
const lineCounter = new LineCounter();
const doc = parseDocument(composeContent, { lineCounter });

// Access parsed nodes with source ranges
const servicesNode = doc.get('services', true); // true = return Node, not value
const [startOffset, valueEnd, nodeEnd] = servicesNode.range;

// Convert offset to 1-indexed line/col
const { line, col } = lineCounter.linePos(startOffset);
// => { line: 5, col: 1 }

// Get errors from parsing
const errors = doc.errors; // YAMLParseError[] with offset, linePos, message

// Convert to plain JS object for schema validation
const composeObject = doc.toJSON();
```

**Key capabilities used:**
- `parseDocument()` -- returns a `Document` with full AST, not just a JS object
- `LineCounter` -- passed as parse option, auto-populated during parse
- `lineCounter.linePos(offset)` -- binary search, returns 1-indexed `{ line, col }`
- Node `.range` property -- `[startOffset, valueEnd, nodeEnd]` on every AST node
- `doc.toJSON()` -- converts to plain object for Ajv schema validation
- `doc.errors` / `doc.warnings` -- parse errors with positions

**Integration with existing CodeMirror pattern:**
The Dockerfile Analyzer uses `dockerfile-ast` which provides line numbers via its own AST. The `yaml` package provides the equivalent via `LineCounter` + node ranges. The violation mapping pattern is identical -- rule checks receive the document + lineCounter, return `RuleViolation[]` with line/column.

**Confidence:** HIGH -- verified API via official docs at eemeli.org/yaml, GitHub repo, and npm registry.

---

### 2. CodeMirror YAML Language Support: `@codemirror/lang-yaml`

| Property | Value |
|----------|-------|
| **Package** | `@codemirror/lang-yaml` |
| **Version** | 6.1.2 (latest) |
| **Unpacked size** | 15 KB |
| **Estimated gzip** | ~4 KB |
| **Purpose** | YAML syntax highlighting and indentation in CodeMirror 6 |
| **License** | MIT |

**Why this is needed (not the legacy-modes approach):**

The Dockerfile Analyzer uses `@codemirror/legacy-modes` + `StreamLanguage.define(dockerFile)` because there is no Lezer-based Dockerfile parser. For YAML, a proper Lezer-based parser exists as `@codemirror/lang-yaml`, providing:

- Full Lezer syntax tree (not just token coloring)
- Proper indentation support (critical for YAML)
- YAML-aware folding
- Better highlighting fidelity

**Usage in `use-codemirror.ts` (Compose Validator version):**

```typescript
import { yaml } from '@codemirror/lang-yaml';

// Replace: StreamLanguage.define(dockerFile)
// With:    yaml()
const state = EditorState.create({
  doc: initialDoc,
  extensions: [
    basicSetup,
    yaml(),              // <-- Lezer-based YAML support
    lintGutter(),        // Same pattern as Dockerfile Analyzer
    oneDarkTheme,
    a11ySyntaxHighlighting,
    editorTheme,
    highlightLineField,  // Reuse from Dockerfile Analyzer
    EditorView.lineWrapping,
    // ... same update listener pattern
  ],
});
```

**Confidence:** HIGH -- verified via official CodeMirror GitHub repo and npm registry.

---

### 3. JSON Schema Validation: `ajv` + `ajv-formats`

| Property | `ajv` | `ajv-formats` |
|----------|-------|---------------|
| **Package** | `ajv` | `ajv-formats` |
| **Version** | 8.18.0 (latest) | 3.0.1 (latest) |
| **Unpacked size** | 1,034 KB | 57 KB |
| **Estimated gzip** | ~110 KB | ~12 KB |
| **Purpose** | Validate compose YAML against compose-spec JSON Schema | Add format validators (uri, email, date-time) |
| **License** | MIT | MIT |

**Why Ajv and not alternatives:**

| Alternative | Why Not |
|-------------|---------|
| `jsonschema` | 5-10x slower. No code generation. No tree-shaking. |
| `zod` (runtime) | Would require hand-translating the compose-spec JSON Schema into Zod. The compose-spec publishes JSON Schema, not Zod schemas. Ajv consumes JSON Schema natively. |
| `joi` | Server-focused. No JSON Schema support. Would require hand-translating. |
| Custom validation only | Misses the 80% of structural validation the schema handles for free. |

**compose-spec JSON Schema details:**

| Property | Value |
|----------|-------|
| **URL** | `https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json` |
| **Raw URL** | `https://raw.githubusercontent.com/compose-spec/compose-spec/main/schema/compose-spec.json` |
| **JSON Schema draft** | Draft-07 (`$schema: "https://json-schema.org/draft-07/schema"`) |
| **Top-level properties validated** | `version` (deprecated), `name`, `include`, `services`, `models`, `networks`, `volumes`, `secrets`, `configs` |
| **Coverage** | Comprehensive structural validation: service config (build, deploy, networking, resources, healthchecks, lifecycle), volumes, networks, secrets, configs, GPU/device allocation, resource limits |

**What the compose-spec schema validates (use Ajv for this):**
- Structure: correct property names, types, nesting
- Enum values: restart policies, network driver options, volume types
- Required fields within definitions
- Pattern validation on certain string fields
- Type checking (string vs number vs boolean vs array vs object)

**What the compose-spec schema does NOT validate (need custom rules for this):**
- **Cross-reference integrity**: `depends_on` referencing non-existent services
- **Port conflict detection**: Two services binding the same host port
- **Circular dependency detection**: A -> B -> C -> A in `depends_on`
- **Image reference validity**: Malformed image:tag references
- **Volume mount conflicts**: Overlapping mount paths
- **Network reference integrity**: Services referencing undefined networks
- **Environment variable patterns**: Secrets in env vars, missing variable files
- **Healthcheck completeness**: `depends_on` with `condition: service_healthy` but no healthcheck defined on target

**Ajv configuration for this project:**

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import composeSchema from './compose-spec.json';

const ajv = new Ajv({
  allErrors: true,      // Don't stop at first error -- collect all
  verbose: true,        // Include schema and parent schema in errors
  strict: false,        // compose-spec uses some features that trigger strict warnings
});

addFormats(ajv);        // Required: compose-spec uses "uri" format

const validate = ajv.compile(composeSchema);

// Validate
const composeObject = doc.toJSON();
const valid = validate(composeObject);

if (!valid) {
  // validate.errors is ErrorObject[]
  // Each error has: instancePath, keyword, message, params, schemaPath
  for (const error of validate.errors) {
    // Map instancePath (e.g., "/services/web/ports/0") back to YAML line number
    // using the yaml Document AST + LineCounter
  }
}
```

**Bundle size optimization -- pre-compiled validation (RECOMMENDED for production):**

Ajv supports generating standalone validation functions at build time via `ajv-cli`. This eliminates the Ajv runtime from the browser bundle entirely:

```bash
# Build step: generate standalone validator
npx ajv compile -s compose-spec.json -o validate-compose.js --spec=draft7

# The generated validate-compose.js is a self-contained function
# No Ajv runtime needed in the browser
```

This reduces the client bundle from ~110 KB (Ajv runtime) to ~15-30 KB (generated validation code only). **Recommendation: Start with runtime Ajv for development velocity, optimize to standalone compilation for production if bundle size is a concern.**

**Error path to YAML line mapping strategy:**

Ajv errors include `instancePath` (JSON Pointer, e.g., `/services/web/ports/0`). To map this to a YAML line number:

1. Parse the JSON Pointer path segments: `["services", "web", "ports", "0"]`
2. Walk the `yaml` Document AST node-by-node using `.get(key, true)` to get each intermediate node
3. Get the final node's `.range[0]` offset
4. Convert to line/col via `lineCounter.linePos(offset)`

This is the key integration point between `yaml` (parsing) and `ajv` (validation).

**Confidence:** HIGH -- Ajv is the de facto standard for JSON Schema validation in JavaScript. compose-spec schema verified at Draft-07. API verified via official docs.

---

### 4. Interactive Dependency Graph: `@xyflow/react` (React Flow 12)

| Property | Value |
|----------|-------|
| **Package** | `@xyflow/react` |
| **Version** | 12.10.1 (latest) |
| **Unpacked size** | 1,188 KB |
| **Estimated gzip** | ~90-100 KB (based on React Flow docs stating ~40KB core + deps) |
| **Purpose** | Interactive node-based graph for Docker Compose service dependencies |
| **License** | MIT |

**Why React Flow and not alternatives:**

| Alternative | Why Not |
|-------------|---------|
| D3.js force layout | Requires building all graph interaction (zoom, pan, drag, selection) from scratch. React Flow provides this out of the box. D3 is 290 KB for a lower-level API. |
| vis.js / vis-network | Not React-native. Requires wrapper. Heavier bundle. Less active maintenance. |
| Cytoscape.js | Canvas-based, not DOM-based. Harder to style with Tailwind. Not React-native. |
| JointJS | Commercial license for full features. Overkill for dependency graph. |
| Mermaid.js | Static rendering only. No interactive pan/zoom/click. Not suitable for tool integration. |
| Custom SVG | Would need to implement zoom, pan, drag, minimap, edge routing. Months of work for what React Flow provides in an afternoon. |

**What React Flow provides out of the box:**
- Pan, zoom, drag nodes
- Minimap component
- Controls component (zoom in/out/fit)
- Custom node and edge rendering (React components)
- Animated edges
- Click/hover event handlers on nodes and edges
- Background grid/dots component
- Fits naturally in existing React island architecture

**Integration with existing React island architecture:**

React Flow is a React component library. The Docker Compose Validator already uses React islands (`client:only="react"`). The dependency graph becomes a React component within the same island, receiving graph data from nanostores:

```typescript
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom node component for service nodes
function ServiceNode({ data }) {
  return (
    <div className="px-3 py-2 rounded border bg-gray-800 text-white">
      <div className="font-bold">{data.label}</div>
      <div className="text-xs text-gray-400">{data.image}</div>
    </div>
  );
}
```

**React Flow does NOT include layout algorithms.** Nodes must be positioned. This is where a layout engine is needed (see dagre below).

**Confidence:** HIGH -- React Flow is the standard for React graph UIs. 25K+ GitHub stars, active maintenance, MIT licensed. Verified via official docs and npm.

---

### 5. Graph Layout Engine: `@dagrejs/dagre`

| Property | Value |
|----------|-------|
| **Package** | `@dagrejs/dagre` |
| **Version** | 2.0.4 (latest, actively maintained fork) |
| **Unpacked size** | 830 KB |
| **Estimated gzip** | ~30-40 KB (React Flow docs cite ~40 KB for dagre) |
| **Purpose** | Automatic hierarchical layout for dependency graph nodes |
| **License** | MIT |

**Why dagre over elkjs:**

| Criterion | `@dagrejs/dagre` | `elkjs` |
|-----------|-------------------|---------|
| **Bundle size (gzip)** | ~30-40 KB | ~1.4 MB (Java transpiled to JS) |
| **API complexity** | Simple, synchronous | Complex, asynchronous, hundreds of options |
| **Layout quality** | Good for hierarchical/tree layouts | Superior for complex graphs with edge routing |
| **Setup effort** | Drop-in, minimal config | Extensive configuration required |
| **Our use case fit** | Docker Compose `depends_on` is a simple directed tree/forest | Would be using 1% of elkjs capabilities |

Docker Compose dependency graphs are typically small (5-30 services) and tree-shaped (a service depends on 1-3 others). Dagre handles this perfectly. Elkjs's 1.4 MB bundle is unjustifiable for a simple hierarchical layout.

**Usage with React Flow:**

```typescript
import dagre from '@dagrejs/dagre';

function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 60 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x - 100, y: pos.y - 30 } };
  });
}
```

**Confidence:** HIGH -- dagre is the React Flow-recommended layout engine for hierarchical graphs. Verified via React Flow layouting docs.

---

### 6. Graph Data Structures and Analysis: `graphology` + `graphology-dag`

| Property | `graphology` | `graphology-dag` |
|----------|-------------|-----------------|
| **Package** | `graphology` | `graphology-dag` |
| **Version** | 0.26.0 | 0.4.1 |
| **Unpacked size** | 2,730 KB (includes multiple build targets) | 16 KB |
| **Estimated gzip** | ~15-20 KB (ESM build only) | ~2 KB |
| **Purpose** | Directed graph data structure | Cycle detection + topological sort |
| **License** | MIT | MIT |

**Why graphology for graph analysis (separate from React Flow for rendering):**

React Flow handles rendering and interaction. Graphology handles the graph analysis logic:

- **Cycle detection**: `hasCycle(graph)` -- returns boolean. Critical for validating `depends_on` chains.
- **Topological sort**: `topologicalSort(graph)` -- returns startup order. Shows users the correct `docker compose up` sequence.
- **Topological generations**: `topologicalGenerations(graph)` -- returns parallelizable groups. Shows which services can start simultaneously.
- **Will create cycle**: `willCreateCycle(graph, source, target)` -- used if building interactive graph editing.

**Why not implement cycle detection manually:**
While DFS-based cycle detection is straightforward (~30 lines), graphology provides:
1. A proper Graph data structure (not ad-hoc adjacency lists)
2. Tested edge cases (disconnected components, self-loops, multi-edge)
3. Topological generations (which services start in parallel) -- non-trivial to implement correctly for disconnected DAG forests
4. The graph object can be built once and queried multiple ways

**Usage pattern:**

```typescript
import Graph from 'graphology';
import { hasCycle, topologicalSort, topologicalGenerations } from 'graphology-dag';

function buildDependencyGraph(services: Record<string, any>) {
  const graph = new Graph({ type: 'directed' });

  // Add service nodes
  for (const [name, config] of Object.entries(services)) {
    graph.addNode(name, { image: config.image, ports: config.ports });
  }

  // Add dependency edges
  for (const [name, config] of Object.entries(services)) {
    if (config.depends_on) {
      const deps = Array.isArray(config.depends_on)
        ? config.depends_on
        : Object.keys(config.depends_on);
      for (const dep of deps) {
        if (graph.hasNode(dep)) {
          graph.addEdge(name, dep);
        }
        // else: report "depends_on references non-existent service"
      }
    }
  }

  return graph;
}

// Analysis
const cycles = hasCycle(graph);          // boolean
const order = topologicalSort(graph);    // string[] (startup order)
const gens = topologicalGenerations(graph); // string[][] (parallel groups)
```

**Converting graphology graph to React Flow nodes/edges:**

```typescript
function toReactFlowElements(graph: Graph) {
  const nodes = graph.mapNodes((key, attrs) => ({
    id: key,
    data: { label: key, ...attrs },
    position: { x: 0, y: 0 }, // dagre will set these
  }));

  const edges = graph.mapEdges((key, attrs, source, target) => ({
    id: key,
    source,
    target,
    animated: true,
  }));

  return { nodes, edges };
}
```

**Confidence:** HIGH -- graphology is the standard graph analysis library for JavaScript. Verified API via official docs at graphology.github.io.

---

## New Dependencies Summary

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Estimated Gzip |
|------------|---------|---------|-----------------|----------------|
| `yaml` | 2.8.2 | YAML parsing with line/col tracking | Only YAML parser with full AST + source ranges. `js-yaml` lacks this. | ~27 KB |
| `@codemirror/lang-yaml` | 6.1.2 | CodeMirror YAML syntax highlighting | Lezer-based (proper parser), not legacy stream mode. Better than `@codemirror/legacy-modes` for YAML. | ~4 KB |
| `ajv` | 8.18.0 | JSON Schema validation of compose files | Fastest JSON Schema validator. Supports Draft-07 (compose-spec format). allErrors mode for complete diagnostics. | ~110 KB |
| `ajv-formats` | 3.0.1 | Format validators (uri, etc.) for Ajv | compose-spec schema uses `"format": "uri"` which requires this plugin. | ~12 KB |
| `@xyflow/react` | 12.10.1 | Interactive dependency graph visualization | Standard React graph library. Pan/zoom/drag/minimap built-in. Fits React island architecture. | ~90-100 KB |
| `@dagrejs/dagre` | 2.0.4 | Hierarchical graph auto-layout | Simple, fast, synchronous. 30x smaller than elkjs. Perfect for small compose graphs. | ~30-40 KB |
| `graphology` | 0.26.0 | Graph data structure | Proper directed graph with query API. Foundation for all graph analysis. | ~15-20 KB |
| `graphology-dag` | 0.4.1 | Cycle detection + topological sort | `hasCycle()`, `topologicalSort()`, `topologicalGenerations()` -- all needed for compose validation. | ~2 KB |

### Total New Bundle Impact

| Category | Estimated Gzip | Notes |
|----------|---------------|-------|
| YAML parsing (`yaml`) | ~27 KB | Always loaded -- core to the tool |
| CodeMirror YAML (`@codemirror/lang-yaml`) | ~4 KB | Always loaded -- editor extension |
| Schema validation (`ajv` + `ajv-formats`) | ~122 KB | Can be reduced to ~20 KB with pre-compiled standalone validation |
| Graph visualization (`@xyflow/react`) | ~90-100 KB | Lazy-loadable -- only when graph tab is active |
| Graph layout (`@dagrejs/dagre`) | ~30-40 KB | Lazy-loadable -- only when graph tab is active |
| Graph analysis (`graphology` + `graphology-dag`) | ~17-22 KB | Always loaded -- needed for cycle detection rules |
| **TOTAL (all loaded eagerly)** | **~290-315 KB gzip** | |
| **TOTAL (with lazy graph loading)** | **~170-175 KB gzip** (eager) + **~120-140 KB** (lazy) | Recommended approach |
| **TOTAL (with pre-compiled Ajv)** | **~70-75 KB gzip** (eager) + **~120-140 KB** (lazy) | Optimal production setup |

**Context:** The existing Dockerfile Analyzer client bundle is ~192 KB. The Compose Validator adds significant capability (schema validation + graph visualization) while staying in a reasonable range, especially with lazy loading and Ajv pre-compilation.

---

## Packages NOT Needed (already in stack or unnecessary)

| Package | Why NOT Needed |
|---------|---------------|
| `@codemirror/lint` | Already a transitive dependency via `codemirror`. Already imported and used. |
| `@codemirror/language` | Already a transitive dependency via `codemirror`. |
| `@codemirror/state` | Already a transitive dependency via `codemirror`. |
| `@codemirror/view` | Already a transitive dependency via `codemirror`. |
| `@codemirror/legacy-modes` | NOT needed for YAML. Use `@codemirror/lang-yaml` instead. Legacy modes are for languages without Lezer parsers. |
| `dockerfile-ast` | Not relevant. Compose files are YAML, not Dockerfiles. |
| `js-yaml` | Replaced by `yaml` (Eemeli). Lacks AST access and source position tracking. |
| `elkjs` | Replaced by `@dagrejs/dagre`. elkjs is 1.4 MB gzipped -- unjustifiable for simple hierarchical layouts. |
| `d3` / `d3-force` / `d3-hierarchy` | Replaced by `@xyflow/react` + `@dagrejs/dagre`. D3 requires building all interaction from scratch. |
| `cytoscape` | Canvas-based, not React-native. Harder to integrate with React island architecture. |
| `docker-compose-config-parser` | Abandoned package (last updated 2019). Use `yaml` + custom parsing instead. |
| `compose-spec-schema` (npm) | Third-party wrapper around the compose-spec schema. Use the official schema directly from the compose-spec GitHub repo. |

---

## Installation

```bash
# Core: YAML parsing + CodeMirror YAML support
npm install yaml @codemirror/lang-yaml

# Core: JSON Schema validation
npm install ajv ajv-formats

# Core: Graph visualization + layout + analysis
npm install @xyflow/react @dagrejs/dagre graphology graphology-dag
```

No new dev dependencies needed. TypeScript types are included in all packages (they all ship with `.d.ts` files or are written in TypeScript).

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|------------------------|
| `yaml` (Eemeli) 2.x | `js-yaml` 4.x | If you only need to parse YAML to a JS object and do NOT need source line numbers. `js-yaml` is simpler but lacks the AST API that makes line-number mapping possible. |
| `ajv` 8 (runtime) | `ajv` 8 + standalone compilation | Use standalone compilation for production optimization. Eliminates Ajv runtime (~110 KB) from bundle, replacing it with ~15-30 KB of generated validation code. Requires a build step. |
| `@xyflow/react` 12 | Custom SVG graph | If the dependency graph is extremely simple (3-5 nodes, no interaction needed) and bundle size is critical. A static SVG graph can be rendered in ~50 lines. But loses all interactivity. |
| `@dagrejs/dagre` 2 | `elkjs` 0.11 | If graphs become very complex (50+ services, subgraphs, edge routing required). elkjs provides superior layout quality at 35x the bundle cost (~1.4 MB gzip). |
| `graphology` + `graphology-dag` | Manual DFS implementation | If only cycle detection is needed and topological generations are not. A manual DFS cycle detector is ~30 lines. But you lose the proper Graph data structure and `topologicalGenerations()`. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `js-yaml` | No AST. No source positions. Returns plain objects. Cannot map validation errors to YAML line numbers -- the core feature of this tool. | `yaml` (Eemeli) 2.x with `parseDocument()` + `LineCounter` |
| `elkjs` | 1.4 MB gzipped. Java-to-JS transpilation. Hundreds of config options. Massive overkill for Docker Compose graphs which are typically 5-30 nodes in a simple hierarchy. | `@dagrejs/dagre` 2.x -- 30-40 KB, simple API, synchronous |
| `reactflow` (old package name) | Deprecated. The `reactflow` npm package redirects to `@xyflow/react`. V12 moved to the `@xyflow` scope. | `@xyflow/react` 12.x |
| `dagre` (original) | Unmaintained since 2015. No TypeScript types. Known bugs unfixed. | `@dagrejs/dagre` 2.x -- actively maintained fork with TS types |
| `mermaid` | Static rendering only. No interactive graph. Cannot click nodes, cannot pan/zoom programmatically, cannot highlight services on hover. | `@xyflow/react` for interactive graph |
| `ajv-pack` (archived) | Deprecated predecessor to Ajv standalone mode. Use `ajv` 8's built-in standalone code generation instead. | `ajv` 8.x with `standalone` option |

---

## compose-spec Schema: Coverage Analysis

The compose-spec JSON Schema (`compose-spec.json`) uses JSON Schema Draft-07 and covers the following:

### Validated by Schema (use Ajv):
- Top-level structure: `services`, `networks`, `volumes`, `secrets`, `configs`, `name`, `include`
- Service properties: `image`, `build`, `command`, `entrypoint`, `environment`, `env_file`, `ports`, `volumes`, `depends_on`, `networks`, `restart`, `healthcheck`, `deploy`, `labels`, `logging`, `security_opt`, `cap_add`, `cap_drop`, `privileged`, `user`, `working_dir`, `stdin_open`, `tty`, `hostname`, `domainname`, `dns`, `extra_hosts`, `tmpfs`, `sysctls`, `ulimits`, `devices`, `group_add`, `ipc`, `pid`, `shm_size`, `stop_grace_period`, `stop_signal`, `oom_score_adj`, `mem_limit`, `memswap_limit`, `cpus`, `cpu_shares`
- Volume definitions: `driver`, `driver_opts`, `external`, `labels`, `name`
- Network definitions: `driver`, `driver_opts`, `external`, `internal`, `attachable`, `labels`, `ipam`, `name`
- Deploy configuration: `replicas`, `resources`, `restart_policy`, `placement`, `update_config`, `rollback_config`
- Healthcheck: `test`, `interval`, `timeout`, `retries`, `start_period`, `start_interval`
- Build configuration: `context`, `dockerfile`, `args`, `labels`, `cache_from`, `target`, `shm_size`
- Port definitions: short syntax and long syntax
- Enum values: `restart` policies, network modes

### NOT Validated by Schema (need custom semantic rules):

| Semantic Check | Category | Complexity |
|---------------|----------|------------|
| `depends_on` references existing service | Cross-reference | Low |
| No circular dependencies in `depends_on` | Graph analysis | Medium (use graphology) |
| `depends_on` with `condition: service_healthy` requires healthcheck on target | Cross-reference | Low |
| Port conflicts (two services bind same host port) | Conflict detection | Medium |
| Volume mount path conflicts | Conflict detection | Medium |
| Network references exist in top-level `networks` | Cross-reference | Low |
| Volume references exist in top-level `volumes` | Cross-reference | Low |
| Secret references exist in top-level `secrets` | Cross-reference | Low |
| Config references exist in top-level `configs` | Cross-reference | Low |
| Image reference format validity | Pattern matching | Low |
| Environment variable best practices (no secrets in plain env) | Pattern matching | Low |
| Build context path validation | Pattern matching | Low |
| Deprecated features (e.g., `version` field, `links`) | Deprecation detection | Low |
| Missing healthcheck when using deploy restart policy | Cross-reference | Low |
| Conflicting service names with network/volume names | Naming analysis | Low |

**Strategy:** Use Ajv for the ~80% structural validation the schema handles, then run custom rules (following the existing rule engine pattern) for the ~20% semantic validation.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `yaml` 2.8.2 | Node 14+, all modern browsers | Pure ESM and CJS dual-published. No native dependencies. |
| `@codemirror/lang-yaml` 6.1.2 | `codemirror` 6.x, `@lezer/common` | Must match the CodeMirror 6 version range already installed. Uses `@lezer/yaml` internally. |
| `ajv` 8.18.0 | JSON Schema Draft-07 (compose-spec) | Must set `strict: false` for compose-spec schema compatibility. |
| `ajv-formats` 3.0.1 | `ajv` 8.x only | v3 is for Ajv 8. Do not use ajv-formats 2.x (that is for Ajv 6). |
| `@xyflow/react` 12.10.1 | React 17+ (uses React 19 fine) | Requires `@xyflow/react/dist/style.css` import for base styles. |
| `@dagrejs/dagre` 2.0.4 | Standalone, no React dependency | Pure graph layout. Returns coordinates consumed by React Flow. |
| `graphology` 0.26.0 | Standalone | Core graph data structure. No framework dependency. |
| `graphology-dag` 0.4.1 | `graphology` 0.26.x | Peer dependency on graphology. Must match major version. |

---

## Stack Patterns for Integration

### Pattern 1: Dual-Parser Architecture (YAML AST + JSON Schema)

Parse YAML twice conceptually:
1. `yaml.parseDocument()` -- produces AST with source ranges (for line mapping)
2. `doc.toJSON()` -- produces plain object (for Ajv schema validation)

Both happen from a single parse. The Document is the source of truth for line numbers. The JSON object is the input for Ajv.

### Pattern 2: Lazy-Loaded Graph Tab

The graph visualization (`@xyflow/react` + `@dagrejs/dagre`) should be code-split and loaded only when the user activates the dependency graph tab. This keeps the initial page load at ~170 KB instead of ~290 KB.

```typescript
// Lazy import in React component
const GraphPanel = React.lazy(() => import('./GraphPanel'));

// In render:
<Suspense fallback={<GraphSkeleton />}>
  {activeTab === 'graph' && <GraphPanel graph={dependencyGraph} />}
</Suspense>
```

### Pattern 3: compose-spec Schema Bundling

The compose-spec JSON Schema (~50 KB) should be imported as a static JSON module, not fetched at runtime:

```typescript
// Import at build time -- Vite/Astro handles JSON imports
import composeSchema from '../data/compose-spec.json';
```

Astro/Vite will include this in the bundle. Since it compresses well (repetitive JSON), the gzip overhead is ~8-10 KB.

### Pattern 4: Rule Engine Extension

The existing Dockerfile Analyzer rule engine pattern (`LintRule` interface with `check()` method returning `RuleViolation[]`) maps directly to compose validation rules. The compose validator version needs:

```typescript
// Compose-specific rule interface (extends existing pattern)
export interface ComposeRule {
  id: string;
  title: string;
  severity: RuleSeverity;
  category: RuleCategory;
  explanation: string;
  fix: RuleFix;
  check(
    doc: import('yaml').Document,      // YAML AST for line tracking
    compose: ComposeFile,               // Typed JS object from toJSON()
    lineCounter: import('yaml').LineCounter,
    graph?: import('graphology').default, // For graph-aware rules
  ): RuleViolation[];
}
```

---

## Sources

- [yaml (Eemeli) official docs](https://eemeli.org/yaml/) -- parseDocument API, LineCounter API, range tracking (HIGH confidence)
- [yaml GitHub repo](https://github.com/eemeli/yaml) -- parsing docs, options reference (HIGH confidence)
- [yaml parsing docs](https://github.com/eemeli/yaml/blob/main/docs/07_parsing_yaml.md) -- LineCounter integration details (HIGH confidence)
- [@codemirror/lang-yaml GitHub](https://github.com/codemirror/lang-yaml) -- Lezer-based YAML language support (HIGH confidence)
- [Ajv official docs](https://ajv.js.org/) -- JSON Schema validation, allErrors, standalone mode (HIGH confidence)
- [Ajv standalone validation](https://ajv.js.org/standalone.html) -- pre-compiled validation for bundle optimization (HIGH confidence)
- [Ajv formats](https://ajv.js.org/packages/ajv-formats.html) -- format validators for Ajv 8 (HIGH confidence)
- [compose-spec JSON Schema](https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json) -- Draft-07 schema, verified properties and coverage (HIGH confidence)
- [compose-spec specification](https://github.com/compose-spec/compose-spec/blob/main/spec.md) -- full compose spec reference (HIGH confidence)
- [React Flow layouting overview](https://reactflow.dev/learn/layouting/layouting) -- dagre (~40KB), elkjs (~1.4MB), d3-hierarchy comparison (HIGH confidence)
- [React Flow dagre example](https://reactflow.dev/examples/layout/dagre) -- integration pattern (HIGH confidence)
- [xyflow/xyflow GitHub](https://github.com/xyflow/xyflow) -- React Flow 12, MIT license (HIGH confidence)
- [graphology-dag docs](https://graphology.github.io/standard-library/dag.html) -- hasCycle, topologicalSort, topologicalGenerations API (HIGH confidence)
- [graphology standard library](https://graphology.github.io/standard-library/) -- full module list (HIGH confidence)
- [CodeMirror lint example](https://codemirror.net/examples/lint/) -- custom lint source integration (HIGH confidence)
- npm registry -- all version numbers verified via `npm view [pkg] version` (HIGH confidence)

---
*Stack research for: Docker Compose Validator*
*Researched: 2026-02-22*
*Key finding: 8 new packages needed. Core parsing: `yaml` (27 KB gzip) for YAML AST with line numbers + `@codemirror/lang-yaml` (4 KB) for editor syntax. Validation: `ajv` + `ajv-formats` (122 KB, reducible to ~20 KB with pre-compilation) for compose-spec Draft-07 schema validation. Graph: `@xyflow/react` (90-100 KB) + `@dagrejs/dagre` (30-40 KB) for interactive dependency visualization, lazy-loadable. Analysis: `graphology` + `graphology-dag` (17-22 KB) for cycle detection and topological sort. Total eager bundle: ~170 KB with lazy graph loading. The compose-spec schema covers ~80% of structural validation; custom rules (following existing engine pattern) handle semantic checks like circular deps, port conflicts, and cross-references.*
