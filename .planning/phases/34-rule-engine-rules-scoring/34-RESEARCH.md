# Phase 34: Rule Engine, Rules & Scoring - Research

**Researched:** 2026-02-22
**Domain:** Docker Compose lint rules (semantic, security, best-practice, style), rule engine orchestration, category-weighted scoring with diminishing returns
**Confidence:** HIGH

## Summary

Phase 34 implements 44 custom analysis rules (15 semantic, 14 security, 12 best practice, 3 style), the rule engine that orchestrates their execution, and the scoring engine that produces a category-weighted 0-100 score with letter grade. This is the largest single-phase deliverable in the Docker Compose Validator milestone -- it takes the YAML AST, parsed JSON, and top-level maps from Phase 33's `parseComposeYaml()` and produces a complete analysis result with line-accurate violations and a composite score.

The architecture follows the proven pattern from the existing Dockerfile Analyzer: each rule is a standalone object conforming to the `ComposeLintRule` interface (already defined in `types.ts`), with an `id`, metadata fields, and a `check(ctx: ComposeRuleContext)` method that returns `ComposeRuleViolation[]`. The engine iterates all rules, collects violations, and sorts by line number. The scorer uses the same diminishing-returns formula as `src/lib/tools/dockerfile-analyzer/scorer.ts` but with the Compose-specific category weights: Security 30%, Semantic 25%, Best Practice 20%, Schema 15%, Style 10%. Schema rules (8 from Phase 33) are already implemented as `SchemaRuleMetadata` objects without `check()` methods because ajv drives their detection; they integrate into scoring via the existing `categorizeSchemaErrors()` output.

The most architecturally significant sub-component is the dependency graph builder with cycle detection (SEM-02), which serves dual purpose: it powers the circular `depends_on` semantic rule AND is exported for Phase 36's dependency graph visualization. This graph builder should use Kahn's algorithm (topological sort with in-degree tracking) rather than DFS-based approaches because Kahn's algorithm naturally identifies cycle participants when the sort cannot complete. Port conflict detection (SEM-01, SEM-14) requires parsing Docker Compose short-syntax port strings into structured `{hostIp, hostPort, containerPort, protocol}` tuples and expanding port ranges before comparison.

**Primary recommendation:** Implement each rule as a separate file exporting a `ComposeLintRule` object with a `check(ctx)` method. Organize into `rules/semantic/`, `rules/security/`, `rules/best-practice/`, `rules/style/` subdirectories mirroring the Dockerfile Analyzer pattern. Build a shared `graph-builder.ts` for dependency analysis and export it for Phase 36. Build a shared `port-parser.ts` for port string parsing used by SEM-01 and SEM-14. Use the existing `scorer.ts` pattern from the Dockerfile Analyzer with Compose-specific weights.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEM-01 | CV-M001 -- Duplicate exported host ports between services | Port parser utility, host port collision detection across services |
| SEM-02 | CV-M002 -- Circular depends_on detection via topological sort | Graph builder with Kahn's algorithm, cycle participant identification |
| SEM-03 | CV-M003 -- Undefined network reference | Cross-reference service networks against top-level networks map |
| SEM-04 | CV-M004 -- Undefined volume reference | Cross-reference service volumes against top-level volumes map |
| SEM-05 | CV-M005 -- Undefined secret reference | Cross-reference service secrets against top-level secrets map |
| SEM-06 | CV-M006 -- Undefined config reference | Cross-reference service configs against top-level configs map |
| SEM-07 | CV-M007 -- Orphan network definition | Reverse cross-reference: top-level networks not referenced by any service |
| SEM-08 | CV-M008 -- Orphan volume definition | Reverse cross-reference: top-level volumes not referenced by any service |
| SEM-09 | CV-M009 -- Orphan secret definition | Reverse cross-reference: top-level secrets not referenced by any service |
| SEM-10 | CV-M010 -- depends_on service_healthy without healthcheck | Cross-service inspection: target service lacks healthcheck when depender uses condition: service_healthy |
| SEM-11 | CV-M011 -- Self-referencing dependency | Service depends_on itself |
| SEM-12 | CV-M012 -- Dependency on undefined service | depends_on references service not in services map |
| SEM-13 | CV-M013 -- Duplicate container names | container_name collision across services |
| SEM-14 | CV-M014 -- Port range overlap between services | Port range expansion + overlap detection using parsed port tuples |
| SEM-15 | CV-M015 -- Invalid image reference format | Regex validation of image string against OCI/Docker reference spec |
| SEC-01 | CV-C001 -- Privileged mode enabled (CWE-250) | Check `privileged: true` in service config |
| SEC-02 | CV-C002 -- Docker socket mounted (CWE-250) | Detect `/var/run/docker.sock` in volume mounts |
| SEC-03 | CV-C003 -- Host network mode | Check `network_mode: host` |
| SEC-04 | CV-C004 -- Host PID mode | Check `pid: host` |
| SEC-05 | CV-C005 -- Host IPC mode | Check `ipc: host` |
| SEC-06 | CV-C006 -- Dangerous capabilities (SYS_ADMIN, NET_ADMIN, ALL) | Inspect `cap_add` array for dangerous entries |
| SEC-07 | CV-C007 -- Default capabilities not dropped | Check for absence of `cap_drop: [ALL]` |
| SEC-08 | CV-C008 -- Secrets in environment variables | Regex patterns for PASSWORD, API_KEY, TOKEN, SECRET in env var names/values |
| SEC-09 | CV-C009 -- Unbound port interface | Port string without explicit host IP binding (missing 127.0.0.1: prefix) |
| SEC-10 | CV-C010 -- Missing no-new-privileges | Check security_opt for `no-new-privileges` |
| SEC-11 | CV-C011 -- Writable filesystem | Check for absence of `read_only: true` |
| SEC-12 | CV-C012 -- Seccomp disabled | Detect `seccomp:unconfined` in security_opt |
| SEC-13 | CV-C013 -- SELinux disabled | Detect `label:disable` in security_opt |
| SEC-14 | CV-C014 -- Image uses latest/no tag | Check image reference for missing tag or `:latest` |
| BP-01 | CV-B001 -- Missing healthcheck | Check for absence of healthcheck key |
| BP-02 | CV-B002 -- No restart policy | Check for absence of restart key |
| BP-03 | CV-B003 -- No resource limits | Check for absence of deploy.resources.limits |
| BP-04 | CV-B004 -- Image tag not pinned (mutable tags) | Check for mutable tags like latest, stable, edge, lts |
| BP-05 | CV-B005 -- No logging configuration | Check for absence of logging key |
| BP-06 | CV-B006 -- Deprecated version field | Check for top-level version key |
| BP-07 | CV-B007 -- Missing project name | Check for absence of top-level name key |
| BP-08 | CV-B008 -- Both build and image specified | Check for simultaneous build + image keys |
| BP-09 | CV-B009 -- Anonymous volume usage | Detect single-path volume entries (no source:target) |
| BP-10 | CV-B010 -- No memory reservation alongside limits | Check deploy.resources.limits.memory exists but deploy.resources.reservations.memory absent |
| BP-11 | CV-B011 -- Healthcheck timeout exceeds interval | Compare healthcheck timeout vs interval durations |
| BP-12 | CV-B012 -- Default network only | Check for absence of top-level networks definition |
| STYLE-01 | CV-F001 -- Services not alphabetically ordered | Compare service key order against sorted order |
| STYLE-02 | CV-F002 -- Ports not quoted (YAML base-60 risk) | AST inspection for unquoted port scalars |
| STYLE-03 | CV-F003 -- Inconsistent quoting in port values | Detect mixed quoted/unquoted ports within same service |
| SCORE-01 | Category-weighted scoring | Security 30%, Semantic 25%, Best Practice 20%, Schema 15%, Style 10% |
| SCORE-02 | Overall 0-100 score with letter grade | computeGrade function with A+ through F thresholds |
| SCORE-03 | Per-category sub-scores | CategoryScore[] with score, weight, deductions per category |
| SCORE-04 | Diminishing returns formula | `basePoints / (1 + 0.3 * priorCount)` matching Dockerfile Analyzer |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `yaml` (Eemeli) | 2.8.x | AST traversal for rule checks -- `isMap`, `isPair`, `isScalar`, `isSeq` type guards, `range` property for line numbers | Already installed (Phase 33). All semantic/security/style rules traverse the YAML AST to find violations and report line-accurate positions. |
| `ajv` | 8.18.x | Schema validation (Phase 33) -- schema rule violations feed into the scoring engine | Already installed (Phase 33). Schema category (15% weight) violations come from `categorizeSchemaErrors()`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | -- | No additional libraries needed | All 44 rules are implemented as pure TypeScript functions using the yaml AST APIs already available. Port parsing, image reference validation, graph building, and cycle detection are all small enough to hand-roll correctly. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled port parser | `docker-compose-port-parse` npm | No maintained npm package exists for this. The port format is well-documented and the parser is ~50 lines. |
| Hand-rolled cycle detection (Kahn's) | `graphlib` / `@dagrejs/graphlib` | Graphlib adds ~20KB for a 30-line algorithm. Kahn's topological sort is trivial to implement and test. The graph builder is also needed in a specific shape for Phase 36's React Flow integration. |
| Hand-rolled image reference regex | `@swimlane/docker-reference` | Package is 6+ years old, last published 2019. A simplified regex covering the common cases (registry/repo:tag@digest) is sufficient for a linter -- we flag obviously invalid references, not enforce OCI spec compliance. |

**Installation:**
```bash
# No new packages needed -- yaml and ajv already installed from Phase 33
```

## Architecture Patterns

### Recommended Project Structure

```
src/lib/tools/compose-validator/
├── types.ts                       # (Phase 33) ComposeLintRule, ComposeRuleContext, etc.
├── parser.ts                      # (Phase 33) parseComposeYaml, resolveInstancePath, getNodeLine
├── interpolation.ts               # (Phase 33) normalizeInterpolation, normalizeJsonForValidation
├── schema-validator.ts            # (Phase 33) validateComposeSchema, categorizeSchemaErrors
├── compose-spec-schema.json       # (Phase 33) bundled compose-spec schema
├── engine.ts                      # NEW: Rule engine -- runs all rules, collects violations
├── scorer.ts                      # NEW: Scoring engine -- category-weighted 0-100 score
├── port-parser.ts                 # NEW: Parse port strings into structured tuples
├── graph-builder.ts               # NEW: Build dependency graph + cycle detection (Kahn's)
├── rules/
│   ├── schema/                    # (Phase 33) 8 schema rules (SchemaRuleMetadata, no check())
│   │   ├── CV-S001-invalid-yaml-syntax.ts
│   │   ├── ... (CV-S002 through CV-S008)
│   │   └── index.ts
│   ├── semantic/                  # NEW: 15 semantic rules
│   │   ├── CV-M001-duplicate-ports.ts
│   │   ├── CV-M002-circular-depends-on.ts
│   │   ├── CV-M003-undefined-network.ts
│   │   ├── CV-M004-undefined-volume.ts
│   │   ├── CV-M005-undefined-secret.ts
│   │   ├── CV-M006-undefined-config.ts
│   │   ├── CV-M007-orphan-network.ts
│   │   ├── CV-M008-orphan-volume.ts
│   │   ├── CV-M009-orphan-secret.ts
│   │   ├── CV-M010-depends-on-healthy-no-healthcheck.ts
│   │   ├── CV-M011-self-referencing-dependency.ts
│   │   ├── CV-M012-undefined-service-dependency.ts
│   │   ├── CV-M013-duplicate-container-names.ts
│   │   ├── CV-M014-port-range-overlap.ts
│   │   ├── CV-M015-invalid-image-reference.ts
│   │   └── index.ts
│   ├── security/                  # NEW: 14 security rules
│   │   ├── CV-C001-privileged-mode.ts
│   │   ├── CV-C002-docker-socket-mount.ts
│   │   ├── CV-C003-host-network-mode.ts
│   │   ├── CV-C004-host-pid-mode.ts
│   │   ├── CV-C005-host-ipc-mode.ts
│   │   ├── CV-C006-dangerous-capabilities.ts
│   │   ├── CV-C007-default-capabilities-not-dropped.ts
│   │   ├── CV-C008-secrets-in-environment.ts
│   │   ├── CV-C009-unbound-port-interface.ts
│   │   ├── CV-C010-missing-no-new-privileges.ts
│   │   ├── CV-C011-writable-filesystem.ts
│   │   ├── CV-C012-seccomp-disabled.ts
│   │   ├── CV-C013-selinux-disabled.ts
│   │   ├── CV-C014-image-latest-no-tag.ts
│   │   └── index.ts
│   ├── best-practice/             # NEW: 12 best practice rules
│   │   ├── CV-B001-missing-healthcheck.ts
│   │   ├── CV-B002-no-restart-policy.ts
│   │   ├── CV-B003-no-resource-limits.ts
│   │   ├── CV-B004-image-tag-not-pinned.ts
│   │   ├── CV-B005-no-logging-config.ts
│   │   ├── CV-B006-deprecated-version-field.ts
│   │   ├── CV-B007-missing-project-name.ts
│   │   ├── CV-B008-build-and-image.ts
│   │   ├── CV-B009-anonymous-volume.ts
│   │   ├── CV-B010-no-memory-reservation.ts
│   │   ├── CV-B011-healthcheck-timeout-exceeds-interval.ts
│   │   ├── CV-B012-default-network-only.ts
│   │   └── index.ts
│   ├── style/                     # NEW: 3 style rules
│   │   ├── CV-F001-services-not-alphabetical.ts
│   │   ├── CV-F002-ports-not-quoted.ts
│   │   ├── CV-F003-inconsistent-port-quoting.ts
│   │   └── index.ts
│   └── index.ts                   # NEW: Master registry combining all rule arrays
```

### Pattern 1: ComposeLintRule with check() Method

**What:** Each non-schema rule implements the `ComposeLintRule` interface with a `check(ctx: ComposeRuleContext)` method that inspects the YAML AST and returns violations with line numbers.

**When to use:** Every semantic, security, best-practice, and style rule (44 total minus 8 schema = 36 rules with check methods).

**Example:**
```typescript
// Source: Existing pattern from src/lib/tools/dockerfile-analyzer/rules/security/PG001-secrets-in-env.ts
import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVM003: ComposeLintRule = {
  id: 'CV-M003',
  title: 'Undefined network reference',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service references a network that is not defined in the top-level networks section. ' +
    'Docker Compose will fail to start with an error when a service references an undefined ' +
    'network. Either add the network to the top-level networks section or fix the network ' +
    'name in the service definition.',
  fix: {
    description: 'Define the referenced network in the top-level networks section',
    beforeCode:
      'services:\n  web:\n    networks:\n      - backend\n# No top-level networks defined',
    afterCode:
      'services:\n  web:\n    networks:\n      - backend\nnetworks:\n  backend:',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const definedNetworks = new Set(ctx.networks.keys());

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'networks') continue;

        // networks can be a sequence of strings or a map
        const networksNode = item.value;
        // ... traverse and check each referenced network name
        // ... report violation with getNodeLine(node, ctx.lineCounter)
      }
    }

    return violations;
  },
};
```

### Pattern 2: Graph Builder with Cycle Detection (Kahn's Algorithm)

**What:** Build a directed adjacency graph from service `depends_on` relationships, then detect cycles using Kahn's topological sort. Export the graph structure for Phase 36's dependency visualization.

**When to use:** SEM-02 (circular depends_on) and Phase 36 (graph visualization).

**Example:**
```typescript
// src/lib/tools/compose-validator/graph-builder.ts

export interface ServiceNode {
  name: string;
  dependsOn: string[];
}

export interface DependencyEdge {
  from: string;      // dependent service
  to: string;        // dependency (depended-upon service)
  condition?: string; // service_started | service_healthy | service_completed_successfully
}

export interface DependencyGraph {
  nodes: ServiceNode[];
  edges: DependencyEdge[];
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycleParticipants: string[]; // services involved in cycles
  topologicalOrder: string[];  // valid order (partial if cycles exist)
}

/**
 * Build a dependency graph from service depends_on declarations.
 * Exported for use by SEM-02 rule and Phase 36 graph visualization.
 */
export function buildDependencyGraph(
  services: Map<string, any>,
): DependencyGraph {
  const nodes: ServiceNode[] = [];
  const edges: DependencyEdge[] = [];

  for (const [name, serviceNode] of services) {
    const dependsOn = extractDependsOn(serviceNode);
    nodes.push({ name, dependsOn: dependsOn.map(d => d.to) });
    edges.push(...dependsOn.map(d => ({ ...d, from: name })));
  }

  return { nodes, edges };
}

/**
 * Detect cycles using Kahn's algorithm (BFS topological sort).
 * Returns cycle participants when the sort cannot complete.
 */
export function detectCycles(graph: DependencyGraph): CycleDetectionResult {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  for (const node of graph.nodes) {
    inDegree.set(node.name, 0);
    adjacency.set(node.name, []);
  }

  // Build adjacency + count in-degrees
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.from)) continue;
    if (!inDegree.has(edge.to)) continue;
    adjacency.get(edge.from)!.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  // Kahn's: start with nodes having in-degree 0
  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // Nodes not in topological order are cycle participants
  const allNodes = new Set(graph.nodes.map(n => n.name));
  const sorted = new Set(topologicalOrder);
  const cycleParticipants = [...allNodes].filter(n => !sorted.has(n));

  return {
    hasCycle: cycleParticipants.length > 0,
    cycleParticipants,
    topologicalOrder,
  };
}
```

**Confidence:** HIGH -- Kahn's algorithm is a well-established textbook algorithm for topological sorting with cycle detection. The graph structure exports cleanly for Phase 36's React Flow nodes/edges.

### Pattern 3: Port String Parser

**What:** Parse Docker Compose short-syntax port strings into structured tuples for conflict and overlap detection.

**When to use:** SEM-01 (duplicate ports), SEM-14 (port range overlap), SEC-09 (unbound port interface), STYLE-02 (unquoted ports), STYLE-03 (inconsistent quoting).

**Example:**
```typescript
// src/lib/tools/compose-validator/port-parser.ts

export interface ParsedPort {
  hostIp?: string;       // e.g., "127.0.0.1" (undefined = 0.0.0.0)
  hostPort?: number;     // single port
  hostPortEnd?: number;  // end of range (for "8000-8010:8000-8010")
  containerPort: number;
  containerPortEnd?: number;
  protocol: 'tcp' | 'udp';
}

/**
 * Parse a Docker Compose short-syntax port string.
 *
 * Supported formats:
 *   "80"                    -> container port only
 *   "8080:80"               -> host:container
 *   "127.0.0.1:8080:80"     -> ip:host:container
 *   "8080:80/udp"           -> with protocol
 *   "8000-8010:8000-8010"   -> port range
 *   "127.0.0.1::80"         -> ip with ephemeral host port
 *
 * Source: https://docs.docker.com/reference/compose-file/services/#ports
 */
export function parsePortString(port: string): ParsedPort | null {
  // Strip protocol suffix
  let protocol: 'tcp' | 'udp' = 'tcp';
  let portStr = port;
  if (portStr.endsWith('/udp')) {
    protocol = 'udp';
    portStr = portStr.slice(0, -4);
  } else if (portStr.endsWith('/tcp')) {
    portStr = portStr.slice(0, -4);
  }

  const parts = portStr.split(':');

  // ... parse based on number of colon-separated parts
  // Handle: "80", "8080:80", "127.0.0.1:8080:80", ranges "8000-8010:8000-8010"
  // Return null for unparseable strings
}

/**
 * Expand a port range into individual port numbers.
 * "8000-8005" -> [8000, 8001, 8002, 8003, 8004, 8005]
 */
export function expandPortRange(start: number, end?: number): number[] {
  if (end === undefined || end === start) return [start];
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

/**
 * Check if two port entries conflict (same host port + protocol + IP).
 */
export function portsConflict(a: ParsedPort, b: ParsedPort): boolean {
  if (a.protocol !== b.protocol) return false;
  // Same IP (or both unbound)
  const sameIp = (a.hostIp ?? '0.0.0.0') === (b.hostIp ?? '0.0.0.0');
  if (!sameIp) return false;
  // Check port overlap
  const aRange = expandPortRange(a.hostPort ?? 0, a.hostPortEnd);
  const bRange = new Set(expandPortRange(b.hostPort ?? 0, b.hostPortEnd));
  return aRange.some(p => bRange.has(p));
}
```

**Confidence:** HIGH -- Port format documented at https://docs.docker.com/reference/compose-file/services/#ports. Three colon-separated components with optional IP, optional range, optional protocol.

### Pattern 4: Rule Engine Orchestration

**What:** Iterate all registered rules against the parsed context, collect violations, merge with schema violations, and sort by line number.

**When to use:** The central orchestration point that ties parsing, schema validation, custom rules, and scoring together.

**Example:**
```typescript
// src/lib/tools/compose-validator/engine.ts
import type { ComposeRuleContext, ComposeRuleViolation, ComposeLintRule } from './types';
import type { ComposeParseResult } from './parser';
import { allComposeRules } from './rules';
import { validateComposeSchema, categorizeSchemaErrors } from './schema-validator';

export interface ComposeEngineResult {
  violations: ComposeRuleViolation[];
  rulesRun: number;
  rulesPassed: number;
}

export function runComposeEngine(parseResult: ComposeParseResult, rawText: string): ComposeEngineResult {
  const violations: ComposeRuleViolation[] = [];

  // 1. Include parse errors (CV-S001)
  violations.push(...parseResult.parseErrors);

  // 2. Run schema validation if parse succeeded
  if (parseResult.normalizedJson) {
    const schemaErrors = validateComposeSchema(parseResult.normalizedJson);
    const schemaViolations = categorizeSchemaErrors(
      schemaErrors,
      parseResult.doc,
      parseResult.lineCounter,
    );
    violations.push(...schemaViolations);
  }

  // 3. Run custom rules if JSON is available
  let rulesPassed = 0;
  if (parseResult.json) {
    const ctx: ComposeRuleContext = {
      doc: parseResult.doc,
      rawText,
      lineCounter: parseResult.lineCounter,
      json: parseResult.json,
      services: parseResult.services,
      networks: parseResult.networks,
      volumes: parseResult.volumes,
      secrets: parseResult.secrets,
      configs: parseResult.configs,
    };

    for (const rule of allComposeRules) {
      const ruleViolations = rule.check(ctx);
      if (ruleViolations.length === 0) {
        rulesPassed++;
      }
      violations.push(...ruleViolations);
    }
  }

  // Sort by line, then column
  violations.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    violations,
    rulesRun: allComposeRules.length + 8, // +8 schema rules
    rulesPassed,
  };
}
```

### Pattern 5: Category-Weighted Scoring with Diminishing Returns

**What:** Compute a 0-100 score using the same formula as the Dockerfile Analyzer scorer, adapted for Compose categories and weights.

**When to use:** After rule engine produces all violations.

**Example:**
```typescript
// src/lib/tools/compose-validator/scorer.ts
// Source: Mirrors src/lib/tools/dockerfile-analyzer/scorer.ts pattern exactly
import type {
  ComposeRuleViolation,
  ComposeCategory,
  ComposeSeverity,
  ComposeScoreDeduction,
  ComposeCategoryScore,
  ComposeScoreResult,
} from './types';
import { allComposeRules } from './rules';
import { schemaRules } from './rules/schema';

const CATEGORY_WEIGHTS: Record<ComposeCategory, number> = {
  security: 30,
  semantic: 25,
  'best-practice': 20,
  schema: 15,
  style: 10,
};

const SEVERITY_DEDUCTIONS: Record<ComposeSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

const ALL_CATEGORIES: ComposeCategory[] = [
  'security',
  'semantic',
  'best-practice',
  'schema',
  'style',
];

export function computeComposeScore(violations: ComposeRuleViolation[]): ComposeScoreResult {
  // Build rule lookup from both custom rules and schema rules
  const ruleLookup = new Map<string, { severity: ComposeSeverity; category: ComposeCategory }>();
  for (const rule of allComposeRules) {
    ruleLookup.set(rule.id, { severity: rule.severity, category: rule.category });
  }
  for (const rule of schemaRules) {
    ruleLookup.set(rule.id, { severity: rule.severity, category: rule.category });
  }

  // Track deductions per category
  const categoryDeductions: Record<ComposeCategory, ComposeScoreDeduction[]> = {
    security: [],
    semantic: [],
    'best-practice': [],
    schema: [],
    style: [],
  };

  for (const v of violations) {
    const rule = ruleLookup.get(v.ruleId);
    if (!rule) continue;

    const basePoints = SEVERITY_DEDUCTIONS[rule.severity];
    const priorCount = categoryDeductions[rule.category].length;
    // Diminishing returns: each additional violation deducts less
    const points = Math.round((basePoints / (1 + 0.3 * priorCount)) * 100) / 100;

    categoryDeductions[rule.category].push({
      ruleId: v.ruleId,
      category: rule.category,
      severity: rule.severity,
      points,
      line: v.line,
    });
  }

  // Per-category scores (floor at 0)
  const categories: ComposeCategoryScore[] = ALL_CATEGORIES.map((cat) => {
    const deductions = categoryDeductions[cat];
    const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
    return {
      category: cat,
      score: Math.max(0, Math.round((100 - totalDeduction) * 100) / 100),
      weight: CATEGORY_WEIGHTS[cat],
      deductions,
    };
  });

  // Weighted aggregate
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

**Confidence:** HIGH -- directly mirrors the proven `scorer.ts` from the Dockerfile Analyzer, with category names and weights changed to match the Compose Validator requirements (SCORE-01 through SCORE-04).

### Pattern 6: AST Traversal Helpers for Rule Checks

**What:** Common patterns for traversing the YAML AST within rule `check()` methods. Rules need to find specific keys within service definitions, extract scalar values, and resolve line numbers.

**Example:**
```typescript
// Common pattern used across many rules:
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type { ComposeRuleContext, ComposeRuleViolation } from '../../types';

/**
 * Iterate services and find a specific key within each service's AST node.
 * Returns the key node and value node for further inspection.
 */
function findServiceKey(
  ctx: ComposeRuleContext,
  keyName: string,
  callback: (serviceName: string, keyNode: any, valueNode: any) => void,
): void {
  for (const [serviceName, serviceNode] of ctx.services) {
    if (!isMap(serviceNode)) continue;
    for (const item of serviceNode.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) === keyName) {
        callback(serviceName, item.key, item.value);
      }
    }
  }
}

/**
 * Get a scalar string value from a service's AST node for a given key.
 * Returns null if the key doesn't exist or isn't a scalar.
 */
function getServiceScalarValue(
  serviceNode: any,
  keyName: string,
): { value: string; node: any } | null {
  if (!isMap(serviceNode)) return null;
  for (const item of serviceNode.items) {
    if (!isPair(item) || !isScalar(item.key)) continue;
    if (String(item.key.value) === keyName && isScalar(item.value)) {
      return { value: String(item.value.value), node: item.value };
    }
  }
  return null;
}
```

### Anti-Patterns to Avoid

- **Using `ctx.json` instead of AST traversal for line numbers:** The JSON object from `doc.toJSON()` has no line information. Rules must traverse the YAML AST (`ctx.doc.contents` via `isMap`/`isPair`/`isScalar`) to get line numbers from `node.range`. Using JSON for detection logic is acceptable, but the violation's `line` must come from the AST.

- **Accessing the JSON for style rules:** Style rules (STYLE-01 through STYLE-03) must work with the raw YAML AST or `rawText`, not the JSON. The JSON object loses key ordering (JS objects preserve insertion order but `toJSON()` may not respect YAML ordering), quoting information, and formatting details.

- **Forgetting to handle both short and long syntax for depends_on, ports, volumes, secrets, configs:** Docker Compose allows both `depends_on: [redis, db]` (sequence of strings) and `depends_on: { redis: { condition: service_healthy } }` (map with conditions). Rules must handle both forms.

- **Not guarding against undefined/null nodes:** YAML nodes can be null (key with no value, like `networks:`). Always check `isMap(node)` / `isSeq(node)` / `isScalar(node)` before accessing `.items` or `.value`.

- **Reporting violations on the service key instead of the specific property:** A violation about `privileged: true` should report the line of the `privileged` key, not the line of the service name. Users need to see the exact line to fix.

- **Creating separate rules for short/long port syntax:** Port parsing belongs in `port-parser.ts` and the rule's `check()` method uses the parser. Do not create separate rules for `"8080:80"` vs `{ target: 80, published: 8080 }`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML AST traversal | Custom YAML walker | `yaml` package `isMap`/`isPair`/`isScalar`/`isSeq` type guards | Already available from Phase 33. These type guards handle all YAML node types correctly including anchors, aliases, and flow collections. |
| Line number extraction | Custom line counter | `getNodeLine()` from `parser.ts` | Already built in Phase 33 with range-undefined guard (yaml issue #573). |
| Schema validation | Custom structural checks | `ajv` + `categorizeSchemaErrors()` from Phase 33 | 8 schema rules already implemented. Schema category feeds into scoring. |
| JSON Schema format validation | Custom duration/URI validators | `ajv-formats` from Phase 33 | Already installed and configured with the ajv singleton. |

**Key insight:** Phase 34 builds ON TOP of Phase 33's foundation. The YAML parsing, AST helpers, and schema validation are already done. Phase 34's job is writing 36 rule `check()` methods (each ~30-80 lines), the engine orchestrator (~40 lines), the scorer (~60 lines), plus two shared utilities (port-parser ~80 lines, graph-builder ~80 lines). No new dependencies are needed.

## Common Pitfalls

### Pitfall 1: Short vs Long Syntax for depends_on

**What goes wrong:** Rules that inspect `depends_on` (SEM-02, SEM-10, SEM-11, SEM-12) only handle one syntax form and miss violations in the other.
**Why it happens:** Docker Compose allows `depends_on: [redis]` (YAMLSeq of scalars) and `depends_on: { redis: { condition: service_healthy } }` (YAMLMap with nested maps). The two forms produce completely different AST structures.
**How to avoid:** Write a `extractDependsOn(serviceNode)` helper that handles both forms and returns a normalized `{ service: string, condition?: string }[]` array. Use this helper in all depends_on-related rules.
**Warning signs:** Tests only use short form `depends_on: [a, b]`. SEM-10 (service_healthy without healthcheck) appears to work but misses long-form depends_on with `condition: service_healthy`.

### Pitfall 2: Port Parsing Edge Cases

**What goes wrong:** Port parser fails on ranges (`8000-8010:8000-8010`), IP-bound ports (`127.0.0.1:8080:80`), or ephemeral host ports (`127.0.0.1::80`). Port conflict detection misses range overlaps.
**Why it happens:** Docker Compose port syntax has 6+ variations. The colon-count heuristic (1 colon = host:container, 2 colons = ip:host:container) doesn't account for the empty-host-port case (`::80`).
**How to avoid:** Implement the port parser with explicit handling for each format. Test with all documented port formats from https://docs.docker.com/reference/compose-file/services/#ports. For range overlap, expand ranges into sets and check intersection.
**Warning signs:** SEM-01 reports "duplicate port" for ports on different IPs. SEM-14 misses overlapping ranges. SEC-09 (unbound interface) fires on `127.0.0.1:8080:80` which is already bound.

### Pitfall 3: Long-Syntax Ports Are Objects, Not Strings

**What goes wrong:** Port rules (SEM-01, SEM-14, SEC-09, STYLE-02, STYLE-03) only check string port entries and silently skip long-syntax object entries like `{ target: 80, published: 8080, host_ip: "127.0.0.1" }`.
**Why it happens:** The port parser only handles strings. Long-syntax ports are YAMLMaps with target/published/host_ip/protocol keys.
**How to avoid:** The port parser should accept both strings and objects. When a port entry is a YAMLMap (long syntax), extract `target`, `published`, `host_ip`, `protocol` directly from the map items. Style rules (STYLE-02, STYLE-03) only apply to short-syntax string ports since long-syntax ports don't have quoting issues.
**Warning signs:** Services using long-syntax ports are skipped entirely by conflict detection.

### Pitfall 4: Volumes Can Be Short Syntax, Long Syntax, or Named

**What goes wrong:** Volume-related rules (SEM-04, SEM-08, BP-09) fail to distinguish between named volumes (defined in top-level `volumes:`), bind mounts (`./data:/app/data`), anonymous volumes (`/app/data`), and long-syntax volume objects.
**Why it happens:** Docker Compose volumes have three forms: (1) anonymous `"/data"`, (2) named/bind `"myvolume:/data"` or `"./host:/container"`, (3) long syntax `{ type: volume, source: myvolume, target: /data }`. Named volumes reference top-level definitions; bind mounts and anonymous volumes do not.
**How to avoid:** For SEM-04 (undefined volume reference), only flag named volumes that reference non-existent top-level entries. Bind mounts (starting with `.`, `/`, or `~`) are not top-level volume references. For BP-09 (anonymous volumes), detect single-path entries with no `:` separator.
**Warning signs:** SEM-04 fires false positives on bind mounts like `"./data:/app/data"` because `"./data"` is not in the top-level volumes map.

### Pitfall 5: YAML Sexagesimal (Base-60) Port Interpretation

**What goes wrong:** STYLE-02 (ports not quoted) needs to detect when port values are unquoted scalars that could be misinterpreted as base-60 numbers by YAML 1.1. The challenge is that by the time the YAML is parsed, unquoted `3:30` has already been interpreted as base-60 integer 210.
**Why it happens:** YAML 1.1 interprets unquoted `mm:ss` patterns as sexagesimal numbers. The `yaml` package with `version: '1.1'` applies this conversion during parsing.
**How to avoid:** For STYLE-02, check the AST node's `type` property. If a port scalar has `type: 'PLAIN'` (unquoted) and contains a colon, it is at risk of sexagesimal interpretation. If it has `type: 'QUOTE_DOUBLE'` or `type: 'QUOTE_SINGLE'`, it is properly quoted. Use `isScalar(node)` and check `node.type` for quote style.
**Warning signs:** STYLE-02 cannot detect the problem because the parsed value is already the wrong number. The rule needs to inspect the scalar's `type` property, not its `value`.

### Pitfall 6: Secrets Detection False Positives

**What goes wrong:** SEC-08 (secrets in environment variables) flags benign variables like `PASSWORD_MIN_LENGTH=8` or `TOKEN_EXPIRY=3600` because the variable name matches the pattern.
**Why it happens:** Regex patterns like `/PASSWORD/i` are too broad. The existing Dockerfile Analyzer PG001 rule uses the same approach and has the same limitation.
**How to avoid:** Use a suffix-based pattern that checks the variable name ends with the secret keyword, or the variable is an exact match. For example, `DB_PASSWORD` should trigger but `PASSWORD_MIN_LENGTH` should not. Pattern: `/(?:_|^)(PASSWORD|PASSWD|SECRET|API_KEY|TOKEN|AUTH|PRIVATE_KEY|CREDENTIALS?)$/i` for names. For values, check for known secret formats (AWS keys `AKIA...`, bearer tokens, connection strings with passwords).
**Warning signs:** Running against real-world Compose files produces dozens of false positives on non-secret configuration variables.

### Pitfall 7: Schema Rules Have No check() Method

**What goes wrong:** The engine tries to call `rule.check()` on schema rules and crashes because `SchemaRuleMetadata` has no `check` method.
**Why it happens:** Schema rules (CV-S001 through CV-S008) use the `SchemaRuleMetadata` interface (no `check()`). They are driven by ajv, not by the rule engine. The master `rules/index.ts` must NOT include schema rules in the `allComposeRules` array.
**How to avoid:** The `allComposeRules` array in `rules/index.ts` contains only `ComposeLintRule` objects (with `check()`). Schema violations are added separately in `engine.ts` via `categorizeSchemaErrors()`. The scorer needs both, so it imports `schemaRules` separately for the rule lookup.
**Warning signs:** TypeScript type error: `Property 'check' does not exist on type 'SchemaRuleMetadata'`.

### Pitfall 8: Docker Compose Implicit Default Network

**What goes wrong:** BP-12 (default network only) fires on files that use `network_mode: host` or have no networking configuration at all. A file with `network_mode: host` doesn't need custom networks.
**Why it happens:** Not all services need custom network isolation. Services with `network_mode: host` bypass Docker networking entirely.
**How to avoid:** BP-12 should only fire when there are multiple services AND no top-level `networks:` definition AND no service uses `network_mode: host`. A single-service compose file doesn't benefit from custom networks.
**Warning signs:** False positive on single-service compose files or files where all services use `network_mode: host`.

## Code Examples

Verified patterns from official sources and the existing codebase:

### Security Rule: Privileged Mode Detection (CV-C001)
```typescript
// Pattern: Simple boolean check on service key
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';

export const CVC001: ComposeLintRule = {
  id: 'CV-C001',
  title: 'Privileged mode enabled',
  severity: 'error',
  category: 'security',
  explanation:
    'Running a container in privileged mode grants it all Linux kernel capabilities and ' +
    'access to host devices. This effectively disables container isolation and allows the ' +
    'container to do almost anything the host can do. An attacker who compromises a privileged ' +
    'container gains full root access to the host system. CWE-250: Execution with Unnecessary ' +
    'Privileges.',
  fix: {
    description: 'Remove privileged: true and use specific capabilities via cap_add instead',
    beforeCode: 'services:\n  web:\n    privileged: true',
    afterCode: 'services:\n  web:\n    cap_add:\n      - NET_BIND_SERVICE',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'privileged') continue;

        if (isScalar(item.value) && item.value.value === true) {
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-C001',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' runs in privileged mode. This disables container isolation and grants full host access (CWE-250).`,
          });
        }
      }
    }

    return violations;
  },
};
```

### Security Rule: Docker Socket Mount Detection (CV-C002)
```typescript
// Pattern: Volume mount string matching
check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
  const violations: ComposeRuleViolation[] = [];
  const DOCKER_SOCKET = /\/var\/run\/docker\.sock/;

  for (const [serviceName, serviceNode] of ctx.services) {
    if (!isMap(serviceNode)) continue;

    for (const item of serviceNode.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) !== 'volumes') continue;
      if (!isSeq(item.value)) continue;

      for (const volItem of item.value.items) {
        let volumeStr = '';
        if (isScalar(volItem)) {
          volumeStr = String(volItem.value);
        } else if (isMap(volItem)) {
          // Long syntax: check 'source' key
          for (const vi of volItem.items) {
            if (isPair(vi) && isScalar(vi.key) && String(vi.key.value) === 'source') {
              volumeStr = isScalar(vi.value) ? String(vi.value.value) : '';
            }
          }
        }

        if (DOCKER_SOCKET.test(volumeStr)) {
          const pos = getNodeLine(volItem, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-C002',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' mounts the Docker socket. This grants container root-level access to the host Docker daemon (CWE-250).`,
          });
        }
      }
    }
  }

  return violations;
}
```

### Semantic Rule: Undefined Resource Reference Pattern (CV-M003/M004/M005/M006)
```typescript
// Pattern: Cross-reference service references against top-level definitions
// This pattern works for networks, volumes, secrets, and configs with minor variations.

check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
  const violations: ComposeRuleViolation[] = [];
  const definedNetworks = new Set(ctx.networks.keys());

  for (const [serviceName, serviceNode] of ctx.services) {
    if (!isMap(serviceNode)) continue;

    for (const item of serviceNode.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) !== 'networks') continue;

      // networks can be YAMLSeq (list of names) or YAMLMap (names as keys)
      if (isSeq(item.value)) {
        for (const netItem of item.value.items) {
          if (!isScalar(netItem)) continue;
          const netName = String(netItem.value);
          if (!definedNetworks.has(netName) && netName !== 'default') {
            const pos = getNodeLine(netItem, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-M003',
              line: pos.line,
              column: pos.col,
              message: `Service '${serviceName}' references undefined network '${netName}'.`,
            });
          }
        }
      } else if (isMap(item.value)) {
        for (const netItem of item.value.items) {
          if (!isPair(netItem) || !isScalar(netItem.key)) continue;
          const netName = String(netItem.key.value);
          if (!definedNetworks.has(netName) && netName !== 'default') {
            const pos = getNodeLine(netItem.key, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-M003',
              line: pos.line,
              column: pos.col,
              message: `Service '${serviceName}' references undefined network '${netName}'.`,
            });
          }
        }
      }
    }
  }

  return violations;
}
```

### Style Rule: Ports Not Quoted (CV-F002)
```typescript
// Pattern: AST scalar type inspection for quoting style
// Source: yaml package docs -- Scalar nodes have a `type` property:
//   'PLAIN' (unquoted), 'QUOTE_DOUBLE' ("), 'QUOTE_SINGLE' (')

check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
  const violations: ComposeRuleViolation[] = [];

  for (const [serviceName, serviceNode] of ctx.services) {
    if (!isMap(serviceNode)) continue;

    for (const item of serviceNode.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) !== 'ports') continue;
      if (!isSeq(item.value)) continue;

      for (const portItem of item.value.items) {
        if (!isScalar(portItem)) continue; // Skip long-syntax objects

        // Check if the scalar is unquoted (PLAIN) and contains a colon
        const portStr = String(portItem.value);
        const nodeType = (portItem as any).type;

        if (nodeType === 'PLAIN' && portStr.includes(':')) {
          const pos = getNodeLine(portItem, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-F002',
            line: pos.line,
            column: pos.col,
            message: `Port '${portStr}' in service '${serviceName}' is not quoted. Unquoted port values with colons risk YAML base-60 (sexagesimal) interpretation.`,
          });
        }
      }
    }
  }

  return violations;
}
```

### Best Practice Rule: Deprecated Version Field (CV-B006)
```typescript
// Pattern: Top-level key detection (not per-service)
check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
  const violations: ComposeRuleViolation[] = [];
  const { doc, lineCounter } = ctx;

  if (!isMap(doc.contents)) return violations;

  for (const item of doc.contents.items) {
    if (!isPair(item) || !isScalar(item.key)) continue;
    if (String(item.key.value) === 'version') {
      const pos = getNodeLine(item.key, lineCounter);
      violations.push({
        ruleId: 'CV-B006',
        line: pos.line,
        column: pos.col,
        message: 'The top-level "version" field is deprecated. Docker Compose no longer requires it and ignores it in modern versions.',
      });
    }
  }

  return violations;
}
```

### Master Rule Registry
```typescript
// src/lib/tools/compose-validator/rules/index.ts
import type { ComposeLintRule } from '../types';

// Import category index files
import { semanticRules } from './semantic';
import { securityRules } from './security';
import { bestPracticeRules } from './best-practice';
import { styleRules } from './style';
// NOTE: Schema rules are NOT included here -- they use SchemaRuleMetadata (no check method)
// Schema violations are generated by categorizeSchemaErrors() in schema-validator.ts

/** All custom lint rules with check() methods. 36 total (15 + 14 + 12 + 3 - 8 schema). */
export const allComposeRules: ComposeLintRule[] = [
  ...semanticRules,
  ...securityRules,
  ...bestPracticeRules,
  ...styleRules,
];

/** Look up a rule by ID. Returns undefined if not found. */
export function getComposeRuleById(id: string): ComposeLintRule | undefined {
  return allComposeRules.find((r) => r.id === id);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No Docker Compose linters | `dclint` (zavoloklom/docker-compose-linter) with ~15 rules | 2024 | Validates our rule selection against community tooling |
| Manual port conflict detection | Structured port parsing + set intersection | N/A | Our SEM-01/SEM-14 handle ranges and IP binding, which dclint's rule does not |
| DFS-based cycle detection | Kahn's algorithm (BFS topological sort) | N/A | Naturally identifies ALL cycle participants, not just one cycle path |
| Flat severity scoring | Category-weighted scoring with diminishing returns | Dockerfile Analyzer v1.5 | Prevents score from bottoming out on many minor issues in one category |

**Deprecated/outdated:**
- Docker Compose `version` field: Deprecated since Docker Compose V2. The `version` field is now ignored. BP-06 detects its presence.
- `links` directive: Replaced by `depends_on` + user-defined networks. Not flagged by our rules since it still works.

## Open Questions

1. **Image reference validation depth for SEM-15**
   - What we know: Docker image references follow the distribution/reference spec with domain, path components, tag, and digest. The full regex is complex (200+ characters).
   - What's unclear: How strict should the validation be? Should we validate against the full OCI spec or use a simplified pattern that catches obviously invalid references (spaces, uppercase repo names, etc.)?
   - Recommendation: Use a simplified regex that catches common errors: `^[a-z0-9]([a-z0-9._/-]*[a-z0-9])?(:[a-zA-Z0-9_.-]+)?(@sha256:[a-fA-F0-9]{64})?$`. This catches spaces, starting with dash, invalid characters, but does not enforce every OCI rule. Better to have a few false negatives than false positives on valid references. Set severity to `warning` not `error`.

2. **Scalar type property name in yaml package**
   - What we know: YAML scalar nodes have a `type` property indicating quote style. Used by STYLE-02 and STYLE-03.
   - What's unclear: The exact property name and values. Is it `node.type` or `node.style`? Are values `'PLAIN'`, `'QUOTE_DOUBLE'`, `'QUOTE_SINGLE'`, `'BLOCK_LITERAL'`, `'BLOCK_FOLDED'`?
   - Recommendation: Verify during implementation by inspecting a parsed scalar node. The yaml docs reference `Scalar.type` with values including `PLAIN`, `QUOTE_DOUBLE`, `QUOTE_SINGLE`. If the property name is wrong, fall back to checking the raw YAML text at the node's offset position.

3. **BP-09 anonymous volume vs named volume detection**
   - What we know: An anonymous volume is a single path with no colon separator (e.g., `/data`). A named volume has a source:target format (e.g., `myvolume:/data`).
   - What's unclear: Should bind mounts (`./host:/container` or `/absolute/path:/container`) also be flagged? They are not "anonymous" but they are not managed by Docker volume driver either.
   - Recommendation: Only flag truly anonymous volumes (single path, no colon). Bind mounts are a legitimate pattern. The rule description says "anonymous volume usage" which specifically means Docker creates an unnamed volume, not bind mounts.

4. **Duration parsing for BP-11 (healthcheck timeout exceeds interval)**
   - What we know: Docker Compose durations can be `30s`, `5m`, `1h30m`, etc. BP-11 needs to compare `timeout` vs `interval` numerically.
   - What's unclear: Whether to hand-roll a duration parser or use a library.
   - Recommendation: Hand-roll a simple parser: `/(\d+)(h|m|s|ms|us|ns)/g` with multipliers. Docker duration format is well-documented and has finite forms. The parser is ~20 lines. No npm package needed.

## Sources

### Primary (HIGH confidence)
- [Docker Compose Services Reference](https://docs.docker.com/reference/compose-file/services/) -- ports syntax (short/long), depends_on (short/long with conditions), network_mode, pid, ipc, privileged, cap_add/cap_drop, security_opt, read_only, volumes (short/long), environment, secrets, configs, healthcheck, restart, build, image, container_name, logging
- [Docker Compose Deploy Reference](https://docs.docker.com/reference/compose-file/deploy/) -- deploy.resources.limits (cpus, memory, pids), deploy.resources.reservations
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) -- CWE references for security rules, privileged mode risks, capability management, no-new-privileges, Docker socket risks, host namespace modes
- Existing codebase: `src/lib/tools/dockerfile-analyzer/scorer.ts` -- Diminishing returns formula `basePoints / (1 + 0.3 * priorCount)`, grade thresholds, category weight pattern
- Existing codebase: `src/lib/tools/dockerfile-analyzer/engine.ts` -- Rule engine orchestration pattern (iterate rules, collect violations, sort by line)
- Existing codebase: `src/lib/tools/dockerfile-analyzer/rules/` -- Rule file structure pattern (const export, LintRule interface, check method)
- Existing codebase: `src/lib/tools/compose-validator/types.ts` -- ComposeLintRule, ComposeRuleContext, ComposeRuleViolation interfaces (Phase 33)
- Existing codebase: `src/lib/tools/compose-validator/parser.ts` -- parseComposeYaml, extractTopLevelMap, resolveInstancePath, getNodeLine (Phase 33)
- Existing codebase: `src/lib/tools/compose-validator/schema-validator.ts` -- categorizeSchemaErrors, validateComposeSchema (Phase 33)
- Existing codebase: `src/lib/tools/compose-validator/rules/schema/` -- SchemaRuleMetadata pattern, schema rules registry (Phase 33)

### Secondary (MEDIUM confidence)
- [zavoloklom/docker-compose-linter](https://github.com/zavoloklom/docker-compose-linter) -- Community linter with ~15 rules. Validates our rule selection (no-duplicate-exported-ports, no-build-and-image, no-version-field, require-quotes-in-ports, services-alphabetical-order, service-image-require-explicit-tag, no-unbound-port-interfaces all align with our rules).
- [Docker Compose Issue #7239](https://github.com/docker/compose/issues/7239) -- Confirms Docker Compose rejects circular depends_on at startup. Our SEM-02 catches this at lint time.
- [Steve Edson: Always Quote Docker Compose Port Numbers](https://steveedson.co.uk/docker/quoting-port-numbers/) -- YAML 1.1 sexagesimal (base-60) interpretation of unquoted port values. Validates STYLE-02.
- [distribution/reference regexp.go](https://github.com/distribution/reference/blob/main/regexp.go) -- Canonical Docker image reference regex. Used to inform SEM-15 validation pattern.

### Tertiary (LOW confidence)
- Image reference regex simplification: The simplified regex recommended for SEM-15 needs validation against real-world Compose files. It may have false negatives on unusual but valid references.
- YAML scalar `type` property: Needs runtime verification that `isScalar(node) && node.type === 'PLAIN'` correctly identifies unquoted scalars. Training data suggests this is correct but it should be confirmed during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed; all functionality builds on Phase 33's yaml + ajv foundation plus pure TypeScript rule implementations
- Architecture: HIGH -- directly mirrors the proven Dockerfile Analyzer pattern (engine.ts, scorer.ts, rules/index.ts). Graph builder uses textbook Kahn's algorithm. Port parser follows documented Docker Compose format.
- Pitfalls: HIGH -- pitfalls derived from Docker Compose spec documentation, existing community linter patterns, and YAML 1.1 specification behavior. Each pitfall is tied to a specific rule and has a concrete avoidance strategy.

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable domain, Docker Compose spec changes infrequently)
