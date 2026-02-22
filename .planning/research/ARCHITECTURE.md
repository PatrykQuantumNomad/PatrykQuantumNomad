# Architecture: Docker Compose Validator Integration

**Domain:** Browser-based Docker Compose validation tool integrated into existing Astro 5 portfolio site
**Researched:** 2026-02-22
**Confidence:** HIGH -- based on direct codebase analysis of existing Dockerfile Analyzer (v1.4) architecture, verified yaml/ajv/@xyflow/react APIs via official documentation, and compose-spec JSON Schema inspection

---

## System Overview

```
Existing Site Layer (unchanged core)
  ├── Layout.astro, Header.astro (MODIFY: add nav link), Footer.astro, SEOHead.astro
  ├── Content Collections: blog (glob), languages (file), dbModels (file)
  ├── OG Image Pipeline: Satori + Sharp in src/lib/og-image.ts (MODIFY: add compose OG)
  └── Existing Stores: dockerfileAnalyzerStore.ts (UNCHANGED)

EXISTING Dockerfile Analyzer Layer (UNCHANGED -- parallel, not extended)
  ├── src/lib/tools/dockerfile-analyzer/  (types, engine, scorer, rules, parser, etc.)
  ├── src/components/tools/ (DockerfileAnalyzer.tsx, EditorPanel.tsx, ResultsPanel.tsx)
  ├── src/stores/dockerfileAnalyzerStore.ts
  └── src/pages/tools/dockerfile-analyzer/

NEW: Docker Compose Validator Layer
  ├── Core Lib: src/lib/tools/compose-validator/
  │   ├── types.ts                    (ComposeLintRule interface, violations, score types)
  │   ├── parser.ts                   (yaml parseDocument + LineCounter → AST with ranges)
  │   ├── schema-validator.ts         (ajv + compose-spec schema → schema violations)
  │   ├── engine.ts                   (run all rules against parsed document)
  │   ├── scorer.ts                   (category-weighted scoring, reuse algorithm)
  │   ├── graph-builder.ts            (extract services/depends_on → node/edge arrays)
  │   ├── cycle-detector.ts           (DFS cycle detection on dependency graph)
  │   ├── sample-compose.ts           (pre-loaded sample docker-compose.yml)
  │   ├── url-state.ts                (lz-string encode/decode for shareable URLs)
  │   ├── badge-generator.ts          (SVG badge for compose scores)
  │   ├── editor-theme.ts             (CodeMirror dark theme, shared or imported)
  │   ├── use-codemirror-yaml.ts      (React hook: CM6 + @codemirror/lang-yaml)
  │   └── rules/                      (modular rule files)
  │       ├── index.ts                (rule registry: allComposeRules[])
  │       ├── related.ts              (same-category rule lookup)
  │       ├── schema/                 (rules from JSON Schema validation errors)
  │       ├── security/               (privileged, host networking, secrets in env, caps)
  │       ├── reliability/            (port conflicts, circular deps, orphan resources)
  │       ├── best-practice/          (image pinning, healthchecks, resource limits)
  │       └── maintainability/        (restart policies, read-only root, logging)
  ├── Components: src/components/tools/compose-validator/
  │   ├── ComposeValidator.tsx         (root React island: editor + results + graph)
  │   ├── ComposeEditorPanel.tsx       (CodeMirror YAML editor + Analyze button)
  │   ├── ComposeResultsPanel.tsx      (score gauge + violations + category breakdown)
  │   ├── DependencyGraph.tsx          (React Flow + dagre layout)
  │   └── results/                     (reusable result sub-components)
  │       ├── ComposeScoreGauge.tsx    (SVG circular gauge -- follows ScoreGauge pattern)
  │       ├── ComposeCategoryBreakdown.tsx
  │       ├── ComposeViolationList.tsx
  │       ├── ComposeEmptyState.tsx
  │       └── ComposeShareActions.tsx
  ├── Store: src/stores/composeValidatorStore.ts
  ├── JSON-LD: src/components/ComposeValidatorJsonLd.astro
  ├── Pages: src/pages/tools/compose-validator/
  │   ├── index.astro                  (tool page with React island)
  │   └── rules/[code].astro           (per-rule documentation via getStaticPaths)
  ├── OG Images: src/pages/open-graph/tools/compose-validator.png.ts
  └── Integration Points:
      ├── src/components/Header.astro   (MODIFY: add Compose Validator nav link)
      ├── src/pages/tools/index.astro   (MODIFY: add Compose Validator card)
      ├── src/pages/index.astro         (MODIFY: add homepage callout)
      └── src/lib/og-image.ts           (MODIFY: add compose OG image generator)
```

---

## Question 1: File Structure -- Where Do Components, Rules, Data, and Pages Go?

**Recommendation: Mirror the Dockerfile Analyzer structure exactly, under a parallel `compose-validator/` namespace at every level.**

**Confidence:** HIGH -- this follows the established pattern and keeps tools isolated.

### Directory Mapping

| Layer | Dockerfile Analyzer (existing) | Compose Validator (new) |
|-------|-------------------------------|------------------------|
| Core lib | `src/lib/tools/dockerfile-analyzer/` | `src/lib/tools/compose-validator/` |
| Rules | `src/lib/tools/dockerfile-analyzer/rules/` | `src/lib/tools/compose-validator/rules/` |
| Components | `src/components/tools/{DockerfileAnalyzer,EditorPanel,ResultsPanel}.tsx` | `src/components/tools/compose-validator/{ComposeValidator,ComposeEditorPanel,...}.tsx` |
| Results sub-components | `src/components/tools/results/` | `src/components/tools/compose-validator/results/` |
| Store | `src/stores/dockerfileAnalyzerStore.ts` | `src/stores/composeValidatorStore.ts` |
| Pages | `src/pages/tools/dockerfile-analyzer/` | `src/pages/tools/compose-validator/` |
| Rule doc pages | `src/pages/tools/dockerfile-analyzer/rules/[code].astro` | `src/pages/tools/compose-validator/rules/[code].astro` |
| OG image | `src/pages/open-graph/tools/dockerfile-analyzer.png.ts` | `src/pages/open-graph/tools/compose-validator.png.ts` |

### Why Parallel, Not Shared

The Dockerfile Analyzer and Compose Validator are **structurally similar but domain-different**. They share architectural patterns but not code:

- **Different parsers**: `dockerfile-ast` (Dockerfile AST) vs `yaml` package (YAML Document AST)
- **Different rule input**: Dockerfile AST nodes vs YAML Document nodes + JSON Schema errors
- **Different categories**: While both use category-weighted scoring, the categories differ (compose has no "efficiency" in the Dockerfile sense -- it has "reliability" for port conflicts and circular deps)
- **Different editor modes**: `@codemirror/legacy-modes/mode/dockerfile` vs `@codemirror/lang-yaml`

The scoring algorithm (diminishing returns, category weights, grade computation) is structurally identical but with different category names and weights. Rather than abstracting this into a shared module (which adds coupling for minimal deduplication), copy the algorithm and customize the weights. The two tools evolve independently.

### Result Sub-Components Namespace

The Dockerfile Analyzer puts result sub-components in `src/components/tools/results/`. The Compose Validator should use `src/components/tools/compose-validator/results/` to keep them co-located with the parent component and avoid name collisions with the Dockerfile Analyzer's result components.

### New File Tree

```
src/
├── lib/tools/compose-validator/
│   ├── types.ts
│   ├── parser.ts
│   ├── schema-validator.ts
│   ├── engine.ts
│   ├── scorer.ts
│   ├── graph-builder.ts
│   ├── cycle-detector.ts
│   ├── sample-compose.ts
│   ├── url-state.ts
│   ├── badge-generator.ts
│   ├── editor-theme.ts
│   ├── use-codemirror-yaml.ts
│   └── rules/
│       ├── index.ts
│       ├── related.ts
│       ├── schema/
│       │   └── CV-S001-schema-violation.ts
│       ├── security/
│       │   ├── CV-SEC001-privileged-mode.ts
│       │   ├── CV-SEC002-host-networking.ts
│       │   ├── CV-SEC003-secrets-in-env.ts
│       │   ├── CV-SEC004-dangerous-capabilities.ts
│       │   ├── CV-SEC005-host-pid-ipc.ts
│       │   └── CV-SEC006-writable-root.ts
│       ├── reliability/
│       │   ├── CV-REL001-port-conflicts.ts
│       │   ├── CV-REL002-circular-depends.ts
│       │   ├── CV-REL003-orphan-networks.ts
│       │   ├── CV-REL004-orphan-volumes.ts
│       │   ├── CV-REL005-invalid-image-ref.ts
│       │   └── CV-REL006-missing-depends-on.ts
│       ├── best-practice/
│       │   ├── CV-BP001-image-tag-pinning.ts
│       │   ├── CV-BP002-healthcheck-defined.ts
│       │   ├── CV-BP003-resource-limits.ts
│       │   ├── CV-BP004-restart-policy.ts
│       │   ├── CV-BP005-read-only-rootfs.ts
│       │   └── CV-BP006-logging-driver.ts
│       └── maintainability/
│           ├── CV-MNT001-service-naming.ts
│           ├── CV-MNT002-env-file-usage.ts
│           └── CV-MNT003-version-field.ts
├── components/tools/compose-validator/
│   ├── ComposeValidator.tsx
│   ├── ComposeEditorPanel.tsx
│   ├── ComposeResultsPanel.tsx
│   ├── DependencyGraph.tsx
│   └── results/
│       ├── ComposeScoreGauge.tsx
│       ├── ComposeCategoryBreakdown.tsx
│       ├── ComposeViolationList.tsx
│       ├── ComposeEmptyState.tsx
│       └── ComposeShareActions.tsx
├── stores/composeValidatorStore.ts
├── pages/tools/compose-validator/
│   ├── index.astro
│   └── rules/[code].astro
└── pages/open-graph/tools/compose-validator.png.ts
```

---

## Question 2: Rule Architecture -- Can LintRule Interface Be Reused/Extended?

**Recommendation: Create a new `ComposeLintRule` interface that follows the same structural pattern as `LintRule` but with a different `check()` signature accepting YAML Document nodes instead of Dockerfile AST nodes.**

**Confidence:** HIGH

### Why Not Reuse LintRule Directly

The existing `LintRule.check()` signature is:

```typescript
check(
  dockerfile: import('dockerfile-ast').Dockerfile,
  rawText: string,
): RuleViolation[];
```

This is tightly coupled to `dockerfile-ast`. A compose rule needs access to the parsed YAML document, the raw text, and potentially the JSON Schema validation errors. The input types are fundamentally different.

### The New ComposeLintRule Interface

```typescript
// src/lib/tools/compose-validator/types.ts

import type { Document } from 'yaml';

export type ComposeSeverity = 'error' | 'warning' | 'info';

export type ComposeCategory =
  | 'schema'
  | 'security'
  | 'reliability'
  | 'best-practice'
  | 'maintainability';

export interface ComposeRuleFix {
  description: string;
  beforeCode: string;
  afterCode: string;
}

export interface ComposeLintRule {
  id: string;           // CV-SEC001, CV-REL002, etc.
  title: string;
  severity: ComposeSeverity;
  category: ComposeCategory;
  explanation: string;
  fix: ComposeRuleFix;
  check(ctx: ComposeRuleContext): ComposeRuleViolation[];
}

export interface ComposeRuleContext {
  doc: Document;        // yaml parseDocument result with AST nodes
  rawText: string;      // raw YAML string for offset/line lookups
  lineCounter: import('yaml').LineCounter;  // offset → {line, col}
  services: Map<string, any>;  // pre-extracted services map
  networks: Map<string, any>;  // pre-extracted networks map
  volumes: Map<string, any>;   // pre-extracted volumes map
}

export interface ComposeRuleViolation {
  ruleId: string;
  line: number;         // 1-based
  endLine?: number;
  column: number;       // 1-based
  endColumn?: number;
  message: string;
}
```

### Key Design Decision: ComposeRuleContext Object

Instead of passing individual arguments like the Dockerfile Analyzer does (`dockerfile, rawText`), the Compose Validator uses a **context object**. This is because compose rules need access to more data:

1. **`doc`** -- The YAML Document AST for node traversal and range lookups
2. **`rawText`** -- Raw string for calculating line numbers from offsets
3. **`lineCounter`** -- The `yaml` package's LineCounter instance for `offset → {line, col}` conversion
4. **`services`/`networks`/`volumes`** -- Pre-extracted top-level maps, since most rules iterate over services

Pre-extracting these maps in the engine (once) prevents each rule from redundantly traversing the document tree to find the `services:` key.

### Structural Parallel with LintRule

| Property | LintRule (Dockerfile) | ComposeLintRule (Compose) |
|----------|----------------------|--------------------------|
| `id` | `DL3006`, `PG001` | `CV-SEC001`, `CV-REL002` |
| `title` | Same | Same |
| `severity` | `RuleSeverity` | `ComposeSeverity` (identical union type) |
| `category` | 5 categories | 5 categories (different names) |
| `explanation` | Same | Same |
| `fix` | `RuleFix` | `ComposeRuleFix` (identical shape) |
| `check()` | `(Dockerfile, rawText)` | `(ComposeRuleContext)` |

### Rule ID Convention

Use `CV-` prefix (Compose Validator) with category abbreviation and 3-digit number:

- `CV-S001` -- Schema violations (from ajv)
- `CV-SEC001` through `CV-SEC006` -- Security rules
- `CV-REL001` through `CV-REL006` -- Reliability rules
- `CV-BP001` through `CV-BP006` -- Best practice rules
- `CV-MNT001` through `CV-MNT003` -- Maintainability rules

### Score Categories and Weights

```typescript
const COMPOSE_CATEGORY_WEIGHTS: Record<ComposeCategory, number> = {
  schema: 20,          // Structural correctness is foundational
  security: 30,        // Security is highest priority (same rationale as Dockerfile)
  reliability: 25,     // Port conflicts, circular deps, orphan resources
  'best-practice': 15, // Image pinning, healthchecks, resource limits
  maintainability: 10, // Naming, env files, logging
};
```

### Example Rule Implementation

```typescript
// src/lib/tools/compose-validator/rules/security/CV-SEC001-privileged-mode.ts

import { isMap, isPair, isScalar } from 'yaml';
import type { ComposeLintRule, ComposeRuleViolation, ComposeRuleContext } from '../../types';

export const CVSEC001: ComposeLintRule = {
  id: 'CV-SEC001',
  title: 'Service runs in privileged mode',
  severity: 'error',
  category: 'security',
  explanation:
    'Running a container in privileged mode gives it full access to the host system, ' +
    'including all devices and kernel capabilities. This effectively disables container ' +
    'isolation and is equivalent to running as root on the host. In production, a ' +
    'compromised privileged container means full host compromise.',
  fix: {
    description: 'Remove privileged: true and grant only the specific capabilities needed',
    beforeCode: 'services:\n  app:\n    image: myapp:latest\n    privileged: true',
    afterCode: 'services:\n  app:\n    image: myapp:latest\n    cap_add:\n      - NET_ADMIN  # only what is needed',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [name, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (item.key.value === 'privileged' && isScalar(item.value)) {
          if (item.value.value === true) {
            const pos = ctx.lineCounter.linePos(item.key.range![0]);
            violations.push({
              ruleId: this.id,
              line: pos.line,
              column: pos.col,
              message: `Service '${name}' runs in privileged mode. This disables container isolation.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
```

---

## Question 3: YAML Parsing Pipeline -- How Does yaml Package's AST Integrate with Lint Rules?

**Recommendation: Use `yaml` package's `parseDocument()` with `LineCounter` for AST-with-ranges, then pass the Document through both ajv schema validation and semantic lint rules.**

**Confidence:** HIGH -- verified via official yaml package documentation

### Parsing Pipeline Architecture

```
Raw YAML string (from CodeMirror editor)
    │
    ├─── Step 1: YAML Parse ──────────────────────────────────────────┐
    │    yaml.parseDocument(text, { lineCounter })                     │
    │    Returns: Document with AST nodes (YAMLMap, YAMLSeq, Scalar)  │
    │    Each node has range: [start, value-end, node-end] offsets     │
    │    LineCounter provides: linePos(offset) → { line, col }        │
    │                                                                  │
    ├─── Step 2: JSON Schema Validation ──────────────────────────────┤
    │    doc.toJSON() → plain JS object                                │
    │    ajv.validate(composeSchema, plainObject)                      │
    │    ajv errors include: instancePath, schemaPath, message         │
    │    Map instancePath back to AST node → get range → get line      │
    │                                                                  │
    ├─── Step 3: Semantic Rule Engine ────────────────────────────────┤
    │    Extract services/networks/volumes from doc.contents            │
    │    Build ComposeRuleContext                                       │
    │    Run allComposeRules[].check(ctx)                              │
    │    Each rule traverses AST nodes and uses range for line info     │
    │                                                                  │
    └─── Step 4: Merge + Score ───────────────────────────────────────┘
         Schema violations + semantic violations → unified list
         computeComposeScore(allViolations)
         Set nanostore → trigger React results panel rerender
```

### Key Implementation: parser.ts

```typescript
// src/lib/tools/compose-validator/parser.ts

import { parseDocument, LineCounter } from 'yaml';
import type { Document } from 'yaml';

export interface ComposeParseResult {
  doc: Document;
  lineCounter: LineCounter;
  json: Record<string, unknown> | null;
  parseSuccess: boolean;
  parseErrors: Array<{ line: number; column: number; message: string }>;
}

export function parseComposeYaml(rawText: string): ComposeParseResult {
  const lineCounter = new LineCounter();

  const doc = parseDocument(rawText, {
    lineCounter,
    keepSourceTokens: false,  // We use range, not CST tokens
  });

  // Collect YAML parse errors (syntax issues)
  const parseErrors = doc.errors.map((err) => {
    const pos = err.pos?.[0] != null
      ? lineCounter.linePos(err.pos[0])
      : { line: 1, col: 1 };
    return {
      line: pos.line,
      column: pos.col,
      message: err.message,
    };
  });

  // Convert to plain JS for ajv validation
  let json: Record<string, unknown> | null = null;
  if (doc.errors.length === 0) {
    try {
      json = doc.toJSON() as Record<string, unknown>;
    } catch {
      // toJSON can fail on certain malformed documents
    }
  }

  return {
    doc,
    lineCounter,
    json,
    parseSuccess: doc.errors.length === 0,
    parseErrors,
  };
}
```

### Key Implementation: schema-validator.ts

```typescript
// src/lib/tools/compose-validator/schema-validator.ts

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import composeSchema from './compose-spec-schema.json';
import type { ComposeRuleViolation } from './types';
import type { Document } from 'yaml';
import type { LineCounter } from 'yaml';
import { isMap, isPair, isScalar, isSeq } from 'yaml';

// Initialize ajv once (module-level singleton)
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(composeSchema);

/**
 * Run JSON Schema validation and map errors back to source line numbers
 * using the YAML Document AST's node ranges.
 */
export function validateSchema(
  json: Record<string, unknown>,
  doc: Document,
  lineCounter: LineCounter,
): ComposeRuleViolation[] {
  const valid = validate(json);
  if (valid || !validate.errors) return [];

  return validate.errors.map((err) => {
    // Convert instancePath (e.g., "/services/web/ports/0") to AST node
    const node = resolveInstancePath(doc, err.instancePath);
    const pos = node?.range
      ? lineCounter.linePos(node.range[0])
      : { line: 1, col: 1 };

    return {
      ruleId: 'CV-S001',
      line: pos.line,
      column: pos.col,
      message: `Schema: ${err.instancePath || '/'} ${err.message}`,
    };
  });
}

/**
 * Walk the YAML AST following a JSON Pointer path like "/services/web/ports/0"
 * to find the corresponding AST node (which carries source range info).
 */
function resolveInstancePath(doc: Document, path: string): any {
  if (!path || path === '/') return doc.contents;

  const segments = path.split('/').filter(Boolean);
  let current: any = doc.contents;

  for (const segment of segments) {
    if (isMap(current)) {
      const pair = current.items.find(
        (item: any) => isPair(item) && isScalar(item.key) && String(item.key.value) === segment
      );
      if (pair && isPair(pair)) {
        current = pair.value;
      } else {
        return null;  // Path segment not found in AST
      }
    } else if (isSeq(current)) {
      const index = parseInt(segment, 10);
      if (!isNaN(index) && current.items[index]) {
        current = current.items[index];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  return current;
}
```

### Why This Pipeline Design

1. **LineCounter is created once in parser.ts** and passed through to all consumers. Creating it per-rule would waste cycles.

2. **JSON Schema validation runs on `doc.toJSON()`** (plain JS object) because ajv expects plain objects, not YAML AST nodes. But error locations are mapped BACK to AST nodes via `resolveInstancePath()` so we get accurate line numbers.

3. **Semantic rules get the raw Document** (not the plain JS) because they need to traverse nodes and read ranges. The `ComposeRuleContext` pre-extracts common structures (services, networks, volumes maps) to avoid each rule doing redundant document traversal.

4. **Parse errors are reported separately from schema/lint violations** because YAML syntax errors prevent further analysis. If the document fails to parse, show parse errors only -- do not run schema validation or lint rules on broken YAML.

### Mapping ajv Errors to Line Numbers

The key challenge is that ajv reports errors with `instancePath` (a JSON Pointer like `/services/web/ports/0`) but no line numbers. The `resolveInstancePath()` function walks the YAML AST following the JSON Pointer path to find the corresponding AST node, then uses its `range` property with `lineCounter.linePos()` to get the 1-based line number.

This approach is reliable because:
- The `yaml` package's `Document` preserves full AST structure with ranges
- JSON Pointer paths from ajv map directly to YAML map keys and sequence indices
- The `isMap`, `isPair`, `isScalar`, `isSeq` type guards from the `yaml` package provide safe navigation

### Compose Schema Bundling Strategy

**Recommendation: Bundle the compose-spec JSON Schema at build time as a static JSON import.**

```typescript
// During build: fetch and save to src/lib/tools/compose-validator/compose-spec-schema.json
// In code: import composeSchema from './compose-spec-schema.json';
```

The schema (~100KB JSON) is small enough to bundle. Fetching at runtime would add latency and a network dependency for what should be a fully offline tool. Pin to a specific commit SHA from the compose-spec repo for reproducibility.

**Version strategy:** Pin to the latest stable compose-spec schema. Include a comment in the JSON file with the source URL and date. When Docker Compose spec updates (infrequently), update the bundled schema in a new milestone.

---

## Question 4: React Flow Integration -- Dependency Graph as a React Island

**Recommendation: The DependencyGraph is a separate React component rendered inside the same `client:only="react"` island as the editor and results panel. Use `@xyflow/react` with `@dagrejs/dagre` for automatic layout.**

**Confidence:** HIGH -- React Flow v12 is the standard for React-based graph visualization

### Component Architecture

```
ComposeValidator.tsx (root React island, client:only="react")
  │
  ├── ComposeEditorPanel.tsx (CodeMirror YAML editor)
  │
  ├── Tab bar: [Results | Dependency Graph]  ← toggle between panels
  │
  ├── ComposeResultsPanel.tsx (when Results tab active)
  │   ├── ComposeScoreGauge.tsx
  │   ├── ComposeCategoryBreakdown.tsx
  │   ├── ComposeViolationList.tsx
  │   └── ComposeShareActions.tsx
  │
  └── DependencyGraph.tsx (when Graph tab active)
      ├── @xyflow/react ReactFlow component
      ├── Custom ServiceNode component
      └── dagre layout computed from graph-builder output
```

### Layout Strategy: Three-Panel with Tab Toggle

The Dockerfile Analyzer uses a simple two-panel layout (editor | results). The Compose Validator adds a third panel (dependency graph) which creates a space problem on desktop.

**Solution: Tab-toggle between Results and Graph panels.**

```
Desktop Layout:
┌─────────────────────┬──────────────────────┐
│                     │  [Results] [Graph]    │
│    YAML Editor      │                      │
│    (CodeMirror)     │  Results panel       │
│                     │  OR                  │
│                     │  Dependency Graph    │
│                     │                      │
└─────────────────────┴──────────────────────┘

Mobile Layout:
┌─────────────────────────────────────────────┐
│    YAML Editor (CodeMirror)                  │
├─────────────────────────────────────────────┤
│  [Results] [Graph]                           │
├─────────────────────────────────────────────┤
│    Results panel OR Dependency Graph         │
└─────────────────────────────────────────────┘
```

### DependencyGraph.tsx Implementation Pattern

```typescript
// src/components/tools/compose-validator/DependencyGraph.tsx

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';

interface ServiceGraphData {
  nodes: Array<{ id: string; hasHealthcheck: boolean; hasCycle: boolean }>;
  edges: Array<{ source: string; target: string; condition?: string }>;
  cycles: string[][];  // arrays of service names forming cycles
}

interface Props {
  graphData: ServiceGraphData | null;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

function layoutGraph(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      sourcePosition: direction === 'TB' ? 'bottom' : 'right',
      targetPosition: direction === 'TB' ? 'top' : 'left',
    };
  });
}

export function DependencyGraph({ graphData }: Props) {
  // Convert graphData to React Flow nodes/edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!graphData) return { initialNodes: [], initialEdges: [] };

    const cycleNodeIds = new Set(graphData.cycles.flat());

    const rfNodes: Node[] = graphData.nodes.map((n) => ({
      id: n.id,
      data: {
        label: n.id,
        hasHealthcheck: n.hasHealthcheck,
        inCycle: cycleNodeIds.has(n.id),
      },
      position: { x: 0, y: 0 },  // dagre will set this
      type: 'serviceNode',
    }));

    const rfEdges: Edge[] = graphData.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      label: e.condition || '',
      animated: cycleNodeIds.has(e.source) && cycleNodeIds.has(e.target),
      style: {
        stroke: cycleNodeIds.has(e.source) && cycleNodeIds.has(e.target)
          ? '#ef4444'  // red for cycle edges
          : '#94a3b8',
      },
    }));

    const layouted = layoutGraph(rfNodes, rfEdges);
    return { initialNodes: layouted, initialEdges: rfEdges };
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
        Run analysis to see the service dependency graph
      </div>
    );
  }

  return (
    <div className="h-full min-h-[400px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodeTypes={{ serviceNode: ServiceNode }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

### graph-builder.ts -- Extracting the Dependency Graph

```typescript
// src/lib/tools/compose-validator/graph-builder.ts

import { isMap, isPair, isScalar, isSeq } from 'yaml';
import type { Document } from 'yaml';

export interface ServiceGraphData {
  nodes: Array<{
    id: string;
    hasHealthcheck: boolean;
    hasCycle: boolean;
  }>;
  edges: Array<{
    source: string;
    target: string;
    condition?: string;  // service_healthy, service_started, service_completed_successfully
  }>;
  cycles: string[][];
}

export function buildServiceGraph(doc: Document): ServiceGraphData {
  const contents = doc.contents;
  if (!isMap(contents)) return { nodes: [], edges: [], cycles: [] };

  // Find services map
  const servicesPair = contents.items.find(
    (item) => isPair(item) && isScalar(item.key) && item.key.value === 'services'
  );
  if (!servicesPair || !isPair(servicesPair) || !isMap(servicesPair.value)) {
    return { nodes: [], edges: [], cycles: [] };
  }

  const servicesMap = servicesPair.value;
  const nodes: ServiceGraphData['nodes'] = [];
  const edges: ServiceGraphData['edges'] = [];
  const adjacency = new Map<string, string[]>();

  for (const item of servicesMap.items) {
    if (!isPair(item) || !isScalar(item.key)) continue;
    const serviceName = String(item.key.value);
    const serviceConfig = item.value;

    // Check for healthcheck
    let hasHealthcheck = false;
    if (isMap(serviceConfig)) {
      hasHealthcheck = serviceConfig.items.some(
        (p) => isPair(p) && isScalar(p.key) && p.key.value === 'healthcheck'
      );
    }

    nodes.push({ id: serviceName, hasHealthcheck, hasCycle: false });
    adjacency.set(serviceName, []);

    // Extract depends_on edges
    if (isMap(serviceConfig)) {
      const dependsPair = serviceConfig.items.find(
        (p) => isPair(p) && isScalar(p.key) && p.key.value === 'depends_on'
      );
      if (dependsPair && isPair(dependsPair)) {
        const deps = dependsPair.value;
        if (isSeq(deps)) {
          // Short form: depends_on: [db, redis]
          for (const depItem of deps.items) {
            if (isScalar(depItem)) {
              const target = String(depItem.value);
              edges.push({ source: serviceName, target });
              adjacency.get(serviceName)!.push(target);
            }
          }
        } else if (isMap(deps)) {
          // Long form: depends_on: { db: { condition: service_healthy } }
          for (const depPair of deps.items) {
            if (isPair(depPair) && isScalar(depPair.key)) {
              const target = String(depPair.key.value);
              let condition: string | undefined;
              if (isMap(depPair.value)) {
                const condPair = depPair.value.items.find(
                  (p) => isPair(p) && isScalar(p.key) && p.key.value === 'condition'
                );
                if (condPair && isPair(condPair) && isScalar(condPair.value)) {
                  condition = String(condPair.value.value);
                }
              }
              edges.push({ source: serviceName, target, condition });
              adjacency.get(serviceName)!.push(target);
            }
          }
        }
      }
    }
  }

  // Detect cycles
  const cycles = detectCycles(adjacency);
  const cycleNodes = new Set(cycles.flat());
  for (const node of nodes) {
    node.hasCycle = cycleNodes.has(node.id);
  }

  return { nodes, edges, cycles };
}
```

### Why React Flow Fits the Existing Architecture

1. **Already using React islands.** The site uses `client:only="react"` for the Dockerfile Analyzer. React Flow is a React library, so it fits naturally inside the same island pattern.

2. **No SSR conflict.** React Flow requires DOM access. Since the Compose Validator uses `client:only="react"` (same as Dockerfile Analyzer), there is no SSR/hydration issue.

3. **View Transitions compatibility.** The same destroy/recreate pattern from `use-codemirror.ts` (listening for `astro:before-swap`) applies to React Flow. When the user navigates away, the React island unmounts, and React Flow cleans up via React's normal unmount lifecycle.

4. **Bundle size consideration.** `@xyflow/react` + `@dagrejs/dagre` adds approximately 100-150KB gzipped to the page bundle. This is acceptable because it only loads on the compose-validator page (code-split by Astro's island architecture). It does not affect any other page's bundle.

---

## Question 5: State Management -- Nanostores for Editor, Results, and Graph Sync

**Recommendation: Create `composeValidatorStore.ts` following the exact same pattern as `dockerfileAnalyzerStore.ts`, with two additional atoms for the dependency graph data and the active tab.**

**Confidence:** HIGH

### Store Design

```typescript
// src/stores/composeValidatorStore.ts

import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { ComposeAnalysisResult } from '../lib/tools/compose-validator/types';
import type { ServiceGraphData } from '../lib/tools/compose-validator/graph-builder';

/** Current analysis result -- null before first analysis */
export const composeAnalysisResult = atom<ComposeAnalysisResult | null>(null);

/** Whether analysis is currently running */
export const composeIsAnalyzing = atom<boolean>(false);

/** EditorView ref -- set by ComposeEditorPanel on mount */
export const composeEditorViewRef = atom<EditorView | null>(null);

/** Whether results are stale (doc changed after last analysis) */
export const composeResultsStale = atom<boolean>(false);

/** Dependency graph data -- extracted during analysis */
export const composeGraphData = atom<ServiceGraphData | null>(null);

/** Active right-panel tab: 'results' or 'graph' */
export const composeActiveTab = atom<'results' | 'graph'>('results');
```

### Data Flow Diagram

```
User types YAML in CodeMirror
    │
    │  EditorView.updateListener
    v
composeResultsStale.set(true)  (if previous analysis exists)

User clicks "Analyze" button
    │
    v
composeIsAnalyzing.set(true)
composeResultsStale.set(false)
    │
    ├─── parseComposeYaml(rawText)
    │    └── Returns { doc, lineCounter, json, parseSuccess, parseErrors }
    │
    ├─── validateSchema(json, doc, lineCounter)
    │    └── Returns ComposeRuleViolation[] (schema category)
    │
    ├─── runComposeRuleEngine(doc, lineCounter, rawText)
    │    └── Returns ComposeRuleViolation[] (semantic rules)
    │
    ├─── buildServiceGraph(doc)
    │    └── Returns ServiceGraphData (nodes, edges, cycles)
    │
    ├─── computeComposeScore(allViolations)
    │    └── Returns ComposeScoreResult
    │
    ├─── setDiagnostics(editorState, diagnostics)
    │    └── CodeMirror inline annotations
    │
    ├─── composeAnalysisResult.set(enrichedResult)
    │    └── Triggers ComposeResultsPanel rerender
    │
    └─── composeGraphData.set(graphData)
         └── Triggers DependencyGraph rerender (if graph tab active)

composeIsAnalyzing.set(false)
```

### Why Separate Stores (Not Shared with Dockerfile Analyzer)

The Dockerfile Analyzer and Compose Validator never coexist on the same page. They are separate routes (`/tools/dockerfile-analyzer/` and `/tools/compose-validator/`). Sharing a store would create unnecessary coupling and require conditional types.

Each store is tiny (6 atoms = ~200 bytes of nanostore code). The cost of duplication is negligible. The benefit is complete isolation -- changes to one tool's state never affect the other.

### Tab State for Results vs Graph Toggle

The `composeActiveTab` atom drives which right-panel content is visible. This is a simple `'results' | 'graph'` toggle. Using a nanostore atom (rather than React `useState`) ensures the tab state persists if the component remounts during View Transitions.

---

## Question 6: Schema Loading -- Bundle at Build Time

**Recommendation: Fetch the compose-spec JSON Schema during project setup, save it as a static JSON file in the lib directory, and import it directly.**

**Confidence:** HIGH

### Bundling Approach

```
At development time (one-time setup):
  curl -o src/lib/tools/compose-validator/compose-spec-schema.json \
    https://raw.githubusercontent.com/compose-spec/compose-spec/main/schema/compose-spec.json

In code:
  import composeSchema from './compose-spec-schema.json';
  const validate = ajv.compile(composeSchema);
```

### Why Bundle, Not Fetch at Runtime

| Approach | Pros | Cons |
|----------|------|------|
| **Bundle (recommended)** | Zero latency, works offline, no CORS, predictable | ~100KB added to compose page bundle, manual updates |
| Fetch at runtime | Always latest, smaller initial bundle | Requires network, CORS issues, loading state, no offline |
| Fetch at build time | Fresh per build, auto-updates | Requires network at build, CI flakiness if GitHub is down |

For a "100% client-side, your code never leaves your browser" tool, bundling is the only approach that maintains the privacy/offline promise established by the Dockerfile Analyzer.

### Versioning Strategy

1. **Pin to a specific commit SHA** in a comment at the top of the JSON file:
   ```json
   // Source: https://github.com/compose-spec/compose-spec/blob/[SHA]/schema/compose-spec.json
   // Fetched: 2026-02-22
   ```

2. **The compose-spec schema changes infrequently** (major updates perhaps 1-2 times per year). When updates happen, fetch the new schema and update the bundled file in a future milestone.

3. **ajv compiles the schema to a validation function on first use** (module-level singleton). This compilation happens once when the page loads. For the ~100KB compose schema, this takes <50ms on modern hardware.

### ajv Configuration

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  allErrors: true,    // Report all errors, not just the first
  strict: false,      // Compose schema uses some non-standard keywords
  verbose: true,      // Include schema and parentSchema in errors (for better messages)
});
addFormats(ajv);      // Adds format validators: uri, email, date-time, etc.
```

`ajv-formats` is needed because the compose-spec schema uses format validators like `"format": "duration"`. Without it, ajv would skip format validation or throw in strict mode.

### Bundle Size Impact

| Package | Approx. Gzipped Size | Purpose |
|---------|---------------------|---------|
| `yaml` | ~30KB | YAML parsing with AST and ranges |
| `ajv` | ~35KB | JSON Schema validation engine |
| `ajv-formats` | ~5KB | Format validators (uri, duration, etc.) |
| `compose-spec-schema.json` | ~25KB (gzipped) | The schema itself |
| `@xyflow/react` | ~80KB | Graph visualization |
| `@dagrejs/dagre` | ~15KB | Directed graph layout |
| `@codemirror/lang-yaml` | ~5KB | YAML syntax highlighting |
| **Total new dependencies** | **~195KB gzipped** | |

For comparison, the Dockerfile Analyzer's client bundle is approximately 120KB gzipped (CodeMirror core + dockerfile-ast + lz-string + React). The Compose Validator will be larger (~315KB total) due to React Flow and the schema, but this is within acceptable bounds for a feature-rich developer tool. The bundle only loads on the `/tools/compose-validator/` page.

---

## Question 7: Suggested Build Order Considering Dependencies

### Phase 1: YAML Parsing Foundation
*No dependencies on other new code. This is the critical-path foundation.*

1. **`src/lib/tools/compose-validator/types.ts`** -- ComposeLintRule interface, violation types, score types, ComposeRuleContext
2. **`src/lib/tools/compose-validator/parser.ts`** -- YAML parseDocument with LineCounter
3. **`src/lib/tools/compose-validator/compose-spec-schema.json`** -- Fetch and bundle compose-spec schema
4. **`src/lib/tools/compose-validator/schema-validator.ts`** -- ajv validation + instancePath-to-line-number mapping

**Verification gate:** Unit-test: parse sample compose YAML, validate against schema, get violations with correct line numbers.

**Why first:** Everything else depends on being able to parse YAML and validate it. The schema-validator is the most novel piece (mapping ajv errors to AST line numbers) and should be proven early.

### Phase 2: Semantic Rule Engine + Scoring
*Depends on: Phase 1 (types, parser)*

5. **`src/lib/tools/compose-validator/rules/`** -- All rule files (schema, security, reliability, best-practice, maintainability)
6. **`src/lib/tools/compose-validator/rules/index.ts`** -- Rule registry (allComposeRules array)
7. **`src/lib/tools/compose-validator/rules/related.ts`** -- Same-category rule lookup
8. **`src/lib/tools/compose-validator/engine.ts`** -- Run all rules, merge with schema violations
9. **`src/lib/tools/compose-validator/scorer.ts`** -- Category-weighted scoring (copy + customize from Dockerfile Analyzer)
10. **`src/lib/tools/compose-validator/graph-builder.ts`** -- Extract dependency graph from parsed doc
11. **`src/lib/tools/compose-validator/cycle-detector.ts`** -- DFS cycle detection

**Verification gate:** Feed sample compose file through engine, get scored violations. Graph builder returns correct nodes/edges. Cycle detector finds cycles in circular depends_on.

**Why second:** Rules and scoring are the core value proposition. Building these before the UI ensures the logic is correct before adding visual complexity.

### Phase 3: CodeMirror YAML Editor + Store
*Depends on: Phase 1 (parser), Phase 2 (engine, scorer)*

12. **`src/lib/tools/compose-validator/editor-theme.ts`** -- Dark theme (reuse or import from Dockerfile Analyzer)
13. **`src/lib/tools/compose-validator/use-codemirror-yaml.ts`** -- React hook with @codemirror/lang-yaml
14. **`src/lib/tools/compose-validator/sample-compose.ts`** -- Pre-loaded sample docker-compose.yml
15. **`src/stores/composeValidatorStore.ts`** -- Nanostores for analysis result, graph data, tab state
16. **`src/components/tools/compose-validator/ComposeEditorPanel.tsx`** -- Editor + Analyze button

**Verification gate:** Editor renders YAML with syntax highlighting. Analyze button triggers parse + validate + rule engine. Results written to nanostore.

**Why third:** The editor is the input surface. It depends on the parser and engine being ready, but the results panel depends on the store being populated -- so editor comes before results panel.

### Phase 4: Results Panel + Dependency Graph
*Depends on: Phase 3 (store populated by editor)*

17. **`src/components/tools/compose-validator/results/ComposeScoreGauge.tsx`**
18. **`src/components/tools/compose-validator/results/ComposeCategoryBreakdown.tsx`**
19. **`src/components/tools/compose-validator/results/ComposeViolationList.tsx`**
20. **`src/components/tools/compose-validator/results/ComposeEmptyState.tsx`**
21. **`src/components/tools/compose-validator/results/ComposeShareActions.tsx`**
22. **`src/components/tools/compose-validator/ComposeResultsPanel.tsx`** -- Assembles result sub-components
23. **`src/components/tools/compose-validator/DependencyGraph.tsx`** -- React Flow + dagre
24. **`src/components/tools/compose-validator/ComposeValidator.tsx`** -- Root island: editor + tab bar + results/graph

**Verification gate:** Full analysis cycle works end-to-end. Score gauge renders. Violations show with click-to-navigate. Graph shows service nodes with dependency edges. Cycles highlighted in red.

**Why fourth:** UI visualization is output-side. It reads from nanostores populated by earlier phases. Building it after ensures the data layer is solid.

### Phase 5: Shareability + Badge
*Depends on: Phase 4 (full analysis working)*

25. **`src/lib/tools/compose-validator/url-state.ts`** -- lz-string compression for shareable URLs
26. **`src/lib/tools/compose-validator/badge-generator.ts`** -- SVG badge generation + PNG download

**Verification gate:** Share URL encodes/decodes compose YAML correctly. Badge downloads as PNG with correct score and categories.

### Phase 6: Rule Documentation Pages
*Depends on: Phase 2 (all rules defined in registry)*

27. **`src/pages/tools/compose-validator/rules/[code].astro`** -- Per-rule documentation pages via getStaticPaths from allComposeRules

**Verification gate:** All rule pages generate with correct content. Breadcrumbs work. Back-links to tool page work.

### Phase 7: Tool Page + Site Integration
*Depends on: Phase 4 (React island working), Phase 6 (rule pages exist for linking)*

28. **`src/pages/tools/compose-validator/index.astro`** -- Tool page hosting the React island
29. **`src/components/ComposeValidatorJsonLd.astro`** -- SoftwareApplication structured data
30. **`src/components/Header.astro`** -- Add Compose Validator nav link (MODIFY)
31. **`src/pages/tools/index.astro`** -- Add Compose Validator card (MODIFY)
32. **`src/pages/index.astro`** -- Add homepage callout (MODIFY)

**Verification gate:** Tool page renders. Header shows Compose Validator link. Tools index shows card. Homepage has callout.

### Phase 8: OG Images + Blog Post + Final Polish
*Depends on: Phase 7 (pages exist for OG image routes)*

33. **`src/pages/open-graph/tools/compose-validator.png.ts`** -- OG image generation
34. **`src/lib/og-image.ts`** -- Add generateComposeValidatorOgImage() (MODIFY)
35. **Companion blog post** -- MDX in `src/data/blog/`
36. **Lighthouse audit, accessibility review, SEO verification**

**Verification gate:** OG image generates. Blog post cross-links to tool. All pages pass Lighthouse 90+. Sitemap includes all new pages.

### Dependency Graph of Phases

```
Phase 1: YAML Parsing + Schema Validation
    │
    └──── Phase 2: Semantic Rules + Scoring + Graph Builder
              │
              ├──── Phase 3: CodeMirror Editor + Store
              │         │
              │         └──── Phase 4: Results Panel + Dependency Graph
              │                   │
              │                   └──── Phase 5: Shareability + Badge
              │
              └──── Phase 6: Rule Documentation Pages
                        │
                        └──── Phase 7: Tool Page + Site Integration
                                  │
                                  └──── Phase 8: OG Images + Blog + Polish
```

---

## Component Boundaries Summary

### New Files (~45 files)

| File | Type | Purpose |
|------|------|---------|
| `src/lib/tools/compose-validator/types.ts` | TypeScript | ComposeLintRule interface, violation/score types |
| `src/lib/tools/compose-validator/parser.ts` | TypeScript | YAML parseDocument with LineCounter |
| `src/lib/tools/compose-validator/compose-spec-schema.json` | JSON | Bundled compose-spec schema |
| `src/lib/tools/compose-validator/schema-validator.ts` | TypeScript | ajv validation + line number mapping |
| `src/lib/tools/compose-validator/engine.ts` | TypeScript | Run all rules against parsed document |
| `src/lib/tools/compose-validator/scorer.ts` | TypeScript | Category-weighted scoring algorithm |
| `src/lib/tools/compose-validator/graph-builder.ts` | TypeScript | Extract service dependency graph from AST |
| `src/lib/tools/compose-validator/cycle-detector.ts` | TypeScript | DFS cycle detection in dependency graph |
| `src/lib/tools/compose-validator/sample-compose.ts` | TypeScript | Pre-loaded sample docker-compose.yml |
| `src/lib/tools/compose-validator/url-state.ts` | TypeScript | lz-string encode/decode for shareable URLs |
| `src/lib/tools/compose-validator/badge-generator.ts` | TypeScript | SVG badge generation + PNG download |
| `src/lib/tools/compose-validator/editor-theme.ts` | TypeScript | CodeMirror dark theme |
| `src/lib/tools/compose-validator/use-codemirror-yaml.ts` | TypeScript | React hook for CM6 + YAML mode |
| `src/lib/tools/compose-validator/rules/index.ts` | TypeScript | Rule registry (allComposeRules) |
| `src/lib/tools/compose-validator/rules/related.ts` | TypeScript | Same-category rule lookup |
| `src/lib/tools/compose-validator/rules/schema/*.ts` | TypeScript | ~1 schema violation adapter rule |
| `src/lib/tools/compose-validator/rules/security/*.ts` | TypeScript | ~6 security rules |
| `src/lib/tools/compose-validator/rules/reliability/*.ts` | TypeScript | ~6 reliability rules |
| `src/lib/tools/compose-validator/rules/best-practice/*.ts` | TypeScript | ~6 best practice rules |
| `src/lib/tools/compose-validator/rules/maintainability/*.ts` | TypeScript | ~3 maintainability rules |
| `src/stores/composeValidatorStore.ts` | TypeScript | Nanostores for compose validator state |
| `src/components/tools/compose-validator/ComposeValidator.tsx` | React | Root island component |
| `src/components/tools/compose-validator/ComposeEditorPanel.tsx` | React | CodeMirror YAML editor panel |
| `src/components/tools/compose-validator/ComposeResultsPanel.tsx` | React | Score + violations display |
| `src/components/tools/compose-validator/DependencyGraph.tsx` | React | React Flow graph visualization |
| `src/components/tools/compose-validator/results/*.tsx` | React | ~5 result sub-components |
| `src/components/ComposeValidatorJsonLd.astro` | Astro | SoftwareApplication JSON-LD |
| `src/pages/tools/compose-validator/index.astro` | Astro Page | Tool page |
| `src/pages/tools/compose-validator/rules/[code].astro` | Astro Page | Rule documentation pages |
| `src/pages/open-graph/tools/compose-validator.png.ts` | API Route | OG image generation |

### Modified Files (~5 files)

| File | Change | Scope |
|------|--------|-------|
| `src/components/Header.astro` | Add Compose Validator nav link | ~5 lines |
| `src/pages/tools/index.astro` | Add Compose Validator card | ~30 lines |
| `src/pages/index.astro` | Add homepage callout | ~15 lines |
| `src/lib/og-image.ts` | Add `generateComposeValidatorOgImage()` | ~80 lines |
| `package.json` | Add yaml, ajv, ajv-formats, @xyflow/react, @dagrejs/dagre, @codemirror/lang-yaml | 6 new dependencies |

### Unchanged Existing Files

| File | Why Unchanged |
|------|---------------|
| `src/lib/tools/dockerfile-analyzer/*` | Completely separate tool, no shared code |
| `src/stores/dockerfileAnalyzerStore.ts` | Independent store for independent tool |
| `src/components/tools/DockerfileAnalyzer.tsx` | Not modified or extended |
| `src/components/tools/EditorPanel.tsx` | Not shared -- compose has its own editor panel |
| `src/components/tools/ResultsPanel.tsx` | Not shared -- compose has its own results panel |
| `src/components/tools/results/*` | Not shared -- compose has its own result sub-components |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shared Rule Interface Across Tools

**What people do:** Create a generic `BaseLintRule<T>` interface that both Dockerfile and Compose rules extend, with `T` being the parsed document type.

**Why it is wrong:** The two tools have fundamentally different check signatures, different category systems, and different rule contexts. A shared generic interface adds TypeScript complexity (conditional types, generic constraints) without reducing code duplication -- the actual check logic is always tool-specific.

**Do this instead:** Keep `LintRule` and `ComposeLintRule` as completely independent interfaces. They look similar because they solve similar problems, but they are not the same type.

### Anti-Pattern 2: Shared Scoring Module

**What people do:** Extract the scoring algorithm into a shared `src/lib/tools/shared/scorer.ts` that both tools import.

**Why it is wrong:** The category names, category weights, and severity deduction values are different between tools. A shared scorer would need to accept these as parameters, making the API more complex than simply having two independent 100-line files. Additionally, if one tool's scoring formula evolves (e.g., adding a bonus for healthchecks), the shared module becomes a change-risk for both tools.

**Do this instead:** Copy the scoring algorithm and customize the category weights and names. Two independent files (~100 lines each) are easier to maintain than one shared module with parameterized configuration.

### Anti-Pattern 3: Rendering React Flow Alongside CodeMirror (Not Tab-Toggled)

**What people do:** Show the dependency graph permanently visible alongside the editor and results panel, creating a three-column layout.

**Why it is wrong:** Three columns do not fit on standard desktops (1280-1440px). On mobile, three stacked panels create an absurdly long page. The graph is a secondary visualization that users consult occasionally, not a primary workspace.

**Do this instead:** Use a tab toggle between Results and Graph on the right panel. Both share the same space. The editor is always visible. Tab state is stored in a nanostore so it persists across view transitions.

### Anti-Pattern 4: Runtime Schema Fetching

**What people do:** Fetch the compose-spec JSON Schema from GitHub's raw content CDN at runtime when the page loads.

**Why it is wrong:** Adds 100-200ms network latency to first analysis. Fails when offline. Introduces a CORS dependency. Contradicts the "100% client-side, your code never leaves your browser" promise.

**Do this instead:** Bundle the schema as a static JSON import. It is ~100KB uncompressed (~25KB gzipped) -- smaller than most images on the page.

### Anti-Pattern 5: Parsing YAML with yaml.parse() Instead of yaml.parseDocument()

**What people do:** Use `yaml.parse(text)` which returns a plain JavaScript object, then try to find line numbers from the plain object.

**Why it is wrong:** `yaml.parse()` discards all AST information including node ranges. You cannot get line numbers from a plain object. You would need to re-parse with `parseDocument()` anyway to map violations to source lines.

**Do this instead:** Always use `parseDocument()` to get the Document AST with node ranges. Call `doc.toJSON()` only when you need a plain object (for ajv schema validation).

---

## Data Flow

### Full Analysis Cycle

```
User pastes/types YAML in CodeMirror
    │
    │  [Click "Analyze" or Cmd+Enter]
    v
ComposeEditorPanel.tsx
    │
    ├── Get raw text from EditorView
    │
    ├── parseComposeYaml(rawText)
    │   ├── Creates LineCounter
    │   ├── Calls parseDocument(rawText, { lineCounter })
    │   ├── Checks for YAML parse errors
    │   └── Calls doc.toJSON() for plain JS object
    │
    ├── [If parse fails: show parse errors, stop]
    │
    ├── validateSchema(json, doc, lineCounter)
    │   ├── ajv.validate(composeSchema, json)
    │   ├── For each ajv error:
    │   │   ├── resolveInstancePath(doc, error.instancePath)
    │   │   └── lineCounter.linePos(node.range[0]) → {line, col}
    │   └── Returns ComposeRuleViolation[] with category 'schema'
    │
    ├── Build ComposeRuleContext { doc, rawText, lineCounter, services, networks, volumes }
    │
    ├── runComposeRuleEngine(ctx)
    │   ├── For each rule in allComposeRules:
    │   │   └── rule.check(ctx) → ComposeRuleViolation[]
    │   └── Returns merged violations sorted by line
    │
    ├── buildServiceGraph(doc)
    │   ├── Extract service names and depends_on edges
    │   ├── detectCycles(adjacency)
    │   └── Returns ServiceGraphData { nodes, edges, cycles }
    │
    ├── computeComposeScore(allViolations)
    │   └── Returns ComposeScoreResult { overall, grade, categories }
    │
    ├── Convert violations → CodeMirror Diagnostics
    │   └── setDiagnostics(editorState, diagnostics)
    │
    ├── composeAnalysisResult.set(enrichedResult)
    │   └── ComposeResultsPanel rerenders via useStore()
    │
    └── composeGraphData.set(graphData)
        └── DependencyGraph rerenders via useStore()
```

### State Flow Between Components

```
                    composeValidatorStore.ts
                    ┌───────────────────────────┐
                    │ composeAnalysisResult      │◄──── ComposeEditorPanel writes
                    │ composeIsAnalyzing         │◄──── ComposeEditorPanel writes
                    │ composeEditorViewRef       │◄──── ComposeEditorPanel writes
                    │ composeResultsStale        │◄──── CM updateListener writes
                    │ composeGraphData           │◄──── ComposeEditorPanel writes
                    │ composeActiveTab           │◄──── Tab bar writes
                    └─────────┬─────────────────┘
                              │ useStore() reads
                              v
              ┌───────────────┼───────────────┐
              │               │               │
    ComposeResultsPanel  DependencyGraph  ComposeEditorPanel
    (reads analysis     (reads graphData) (reads editorViewRef
     result, stale)                        for click-to-navigate)
```

---

## Scalability Considerations

These are not traditional scaling concerns (users/traffic) since this is a static site with client-side tools. The scaling concerns are about **content growth and maintainability**.

| Concern | Current Scale | Growth Path |
|---------|--------------|-------------|
| Rule count | ~22 rules at launch | Can grow to 50+ without architecture changes (one file per rule, flat array registry) |
| Rule categories | 5 categories | Adding a category requires: add to type union, add to category weights, add to scorer -- ~10 lines total |
| Bundle size | ~315KB gzipped | React Flow is the largest chunk. If it grows beyond 400KB, consider lazy-loading the graph tab |
| Schema updates | Pinned at launch | Manual update process: fetch new schema JSON, test, commit |
| Page count | ~25 rule pages + tool page | Each new rule adds one documentation page automatically via getStaticPaths |

### Lazy Loading the Dependency Graph (Future Optimization)

If the bundle becomes too large, the DependencyGraph component can be lazy-loaded:

```typescript
import { lazy, Suspense } from 'react';

const DependencyGraph = lazy(() => import('./DependencyGraph'));

// In ComposeValidator.tsx:
{activeTab === 'graph' && (
  <Suspense fallback={<div>Loading graph...</div>}>
    <DependencyGraph graphData={graphData} />
  </Suspense>
)}
```

This defers loading `@xyflow/react` + `@dagrejs/dagre` (~95KB gzipped) until the user actually clicks the Graph tab. Worth implementing if Lighthouse performance scores drop below 90 on the compose-validator page.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| ComposeEditorPanel ↔ ComposeResultsPanel | Nanostore atoms | Same pattern as Dockerfile Analyzer |
| ComposeEditorPanel ↔ DependencyGraph | Nanostore atom (composeGraphData) | Graph data written during analysis |
| Schema validator ↔ YAML parser | Function call (parser output → schema validator input) | Both in same lib directory |
| Rule engine ↔ Rules | Array iteration (allComposeRules[].check(ctx)) | Same pattern as Dockerfile Analyzer |
| Tool page ↔ React island | `client:only="react"` directive | Same pattern as Dockerfile Analyzer |
| Rule doc pages ↔ Rule registry | getStaticPaths reads allComposeRules | Same pattern as Dockerfile Analyzer |

### Shared Resources (Read-Only)

| Resource | Used By Compose Validator | How |
|----------|--------------------------|-----|
| `Layout.astro` | Tool page and rule doc pages | Standard Astro layout wrapping |
| `BreadcrumbJsonLd.astro` | Tool page and rule doc pages | Existing component, new crumb data |
| `lz-string` | URL state compression | Already installed, no new dependency |
| Satori + Sharp | OG image generation | Existing pipeline, new generator function |

---

## Sources

- yaml package documentation: [https://eemeli.org/yaml/](https://eemeli.org/yaml/) -- parseDocument, LineCounter, AST traversal, visit API
- yaml package GitHub: [https://github.com/eemeli/yaml](https://github.com/eemeli/yaml)
- ajv documentation: [https://ajv.js.org/](https://ajv.js.org/) -- standalone validation, browser environments, allErrors mode
- ajv standalone validation: [https://ajv.js.org/standalone.html](https://ajv.js.org/standalone.html)
- compose-spec JSON Schema: [https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json](https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json) -- JSON Schema draft-07, ~100KB
- @xyflow/react (React Flow v12): [https://reactflow.dev/](https://reactflow.dev/) -- dagre layout example, migration guide
- dagre layout example: [https://reactflow.dev/examples/layout/dagre](https://reactflow.dev/examples/layout/dagre)
- React Flow v12 migration: [https://reactflow.dev/learn/troubleshooting/migrate-to-v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) -- node.measured for layout dimensions
- @codemirror/lang-yaml: [https://github.com/codemirror/lang-yaml](https://github.com/codemirror/lang-yaml) -- Lezer-based YAML language support for CM6
- Existing codebase: `src/lib/tools/dockerfile-analyzer/types.ts` -- LintRule interface pattern
- Existing codebase: `src/lib/tools/dockerfile-analyzer/engine.ts` -- Rule engine iteration pattern
- Existing codebase: `src/lib/tools/dockerfile-analyzer/scorer.ts` -- Scoring algorithm with diminishing returns
- Existing codebase: `src/stores/dockerfileAnalyzerStore.ts` -- Nanostore pattern for tool state
- Existing codebase: `src/components/tools/DockerfileAnalyzer.tsx` -- React island root component pattern
- Existing codebase: `src/components/tools/EditorPanel.tsx` -- CodeMirror + analysis trigger pattern
- Existing codebase: `src/pages/tools/dockerfile-analyzer/rules/[code].astro` -- getStaticPaths rule doc pattern

---
*Architecture research for: Docker Compose Validator integration into existing Astro 5 portfolio site*
*Researched: 2026-02-22*
