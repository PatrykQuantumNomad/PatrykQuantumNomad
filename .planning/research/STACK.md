# Stack Research

**Domain:** Dockerfile Analyzer rule expansion -- PG011 (missing USER directive) and PG012 (Node.js memory optimization via pointer compression)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Verdict: No New Dependencies Required

Both PG011 and PG012 can be implemented using only the existing `dockerfile-ast@^0.7.1` library and its already-used API surface. Zero new npm packages, zero config changes. This is a pure rule-authoring task.

## Existing API Surface Verification

Every API method needed by PG011 and PG012 is already proven in the codebase by existing rules:

| API Method | Used By | Needed By | Purpose |
|------------|---------|-----------|---------|
| `dockerfile.getFROMs()` | DL3006, DL3007, DL3002, PG006, PG009, PG010 | PG011, PG012 | Get all FROM instructions |
| `dockerfile.getInstructions()` | DL3002, PG007, PG009, PG010, many others | PG011 | Get all instructions to find USER directives |
| `inst.getKeyword()` | Every rule | PG011 | Filter by instruction type (e.g., `'USER'`) |
| `inst.getArgumentsContent()` | DL3002, PG007, many others | PG011 | Get USER argument to check if non-root |
| `inst.getRange()` | Every rule | PG011, PG012 | Get line numbers for violation reporting |
| `from.getImageName()` | DL3006, DL3007, PG006 | PG012 | Get base image name (e.g., `node`) |
| `from.getImageTag()` | DL3006, DL3007, PG006 | PG012 | Get image tag (e.g., `22-slim`) |
| `from.getBuildStage()` | DL3007 | PG011, PG012 | Get build stage alias for multi-stage awareness |

**Verification method:** Confirmed by reading source code of 8 existing rules. All methods are TypeScript-typed via `import type { Dockerfile } from 'dockerfile-ast'`.

## Rule Implementation Details

### PG011: Missing USER Directive (Security)

**Category:** `security` | **Severity:** `warning` | **File:** `rules/security/PG011-missing-user.ts`

**What it detects:** The final build stage has no USER instruction at all, meaning the container runs as root by default. This is distinct from existing rule DL3002, which only flags explicit `USER root` in the final stage.

**API usage pattern:** Identical to DL3002 (already proven):
1. `dockerfile.getFROMs()` to find the last FROM (start of final stage)
2. `dockerfile.getInstructions()` to find USER instructions after the last FROM
3. If zero USER instructions found in final stage, report violation on the last FROM line

**Multi-stage build awareness:** Must only inspect the final build stage. Builder stages commonly omit USER intentionally. The pattern for detecting the final stage boundary is already established in DL3002, PG009, and PG010.

**Known edge cases to handle:**
- `FROM scratch` -- skip; scratch images have no user system, and the binary's UID is typically set by the runner
- Build stage references (`COPY --from=builder`) -- only check the final stage, not intermediate stages
- Single-stage Dockerfiles -- the only stage IS the final stage

**Why this fills a gap:** Hadolint's DL3002 only catches `USER root`. Hadolint issue #1089 (opened 2025-05-06, still open) is a feature request for exactly this rule. Hadolint issue #1025 is the same request. Neither has been implemented in Hadolint as of this writing. PG011 covers the more common and arguably more dangerous case: USER is never set at all, so root is the silent default.

**Relationship to DL3002:** Complementary, not overlapping. DL3002 flags explicit `USER root`. PG011 flags the absence of any USER directive. A Dockerfile can trigger one, both, or neither:
- `USER root` at end --> DL3002 fires, PG011 does NOT fire (USER exists)
- No USER at all --> PG011 fires, DL3002 does NOT fire (no USER to inspect)
- `USER appuser` at end --> Neither fires (correct)

### PG012: Consider Node.js Pointer Compression Image (Efficiency)

**Category:** `efficiency` | **Severity:** `info` | **File:** `rules/efficiency/PG012-node-pointer-compression.ts`

**What it detects:** FROM instructions that use official `node:` base images where the workload could benefit from ~50% memory reduction by switching to `platformatic/node-caged`, which ships Node.js compiled with V8 pointer compression (`--experimental-enable-pointer-compression`).

**API usage pattern:** Identical to DL3007 (already proven):
1. `dockerfile.getFROMs()` to iterate all FROM instructions
2. `from.getImageName()` to check if image is `node` (official Docker Hub image)
3. `from.getImageTag()` to extract version/variant information
4. Report informational suggestion with the equivalent `platformatic/node-caged` tag

**Node.js image name patterns to match:**

| FROM Pattern | `getImageName()` Returns | Match? |
|--------------|--------------------------|--------|
| `FROM node:22` | `node` | YES |
| `FROM node:22-slim` | `node` | YES |
| `FROM node:22-alpine` | `node` | YES |
| `FROM node:22-bookworm` | `node` | YES |
| `FROM node:lts-slim` | `node` | YES |
| `FROM node` (no tag) | `node` | YES |
| `FROM docker.io/library/node:22` | `docker.io/library/node` | YES (check suffix) |
| `FROM gcr.io/distroless/nodejs22` | `gcr.io/distroless/nodejs22` | NO (different image) |
| `FROM python:3.12` | `python` | NO |
| `FROM node:22 AS builder` | `node` | YES (but see note below) |

**Multi-stage build consideration:** Report on ALL node: FROM stages, not just the final stage. Unlike security rules that focus on the final stage, an efficiency suggestion is valuable for any stage -- memory savings apply to both build and runtime containers. However, the message should note that the 4GB heap limit per isolate is a constraint.

**platformatic/node-caged image variants available:**

| Official Node Tag | Equivalent node-caged Tag |
|-------------------|---------------------------|
| `node:25` | `platformatic/node-caged:25` |
| `node:25-slim` | `platformatic/node-caged:25-slim` |
| `node:25-alpine` | `platformatic/node-caged:25-alpine` |
| `node:25-bookworm` | `platformatic/node-caged:25-bookworm` |
| `node:latest` | `platformatic/node-caged:latest` |

**Important constraint:** node-caged is currently built from Node.js v25.x. Users on Node 20 LTS or Node 22 LTS cannot directly use node-caged without upgrading their Node.js version. The rule message should mention the 4GB heap limit per V8 isolate and the Node 25+ requirement.

**Severity rationale:** `info` not `warning` because:
1. This is an optimization suggestion, not a correctness issue
2. The 4GB heap limit may not suit all workloads
3. Switching base images is a significant decision that requires testing
4. Node 25+ is not LTS and may not be suitable for all teams

## Existing Stack (No Changes Needed)

### Core Technologies (Already Installed)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| dockerfile-ast | ^0.7.1 | Dockerfile AST parsing | No change; provides all methods needed |
| Astro | 5.17.1 | Static site generator | No change |
| TypeScript | (via Astro) | Type-safe rule implementation | No change |

### Files to Create (New)

| File | Purpose | Pattern Source |
|------|---------|---------------|
| `src/lib/tools/dockerfile-analyzer/rules/security/PG011-missing-user.ts` | PG011 rule implementation | Follow PG007/DL3002 pattern |
| `src/lib/tools/dockerfile-analyzer/rules/efficiency/PG012-node-pointer-compression.ts` | PG012 rule implementation | Follow DL3007/PG010 pattern |

### Files to Modify (Registration Only)

| File | Change | Type |
|------|--------|------|
| `src/lib/tools/dockerfile-analyzer/rules/index.ts` | Import PG011/PG012, add to `allRules` array | Registration |

### Files that Auto-Update (No Manual Changes)

| File | What Happens | Why |
|------|-------------|-----|
| `src/pages/tools/dockerfile-analyzer/rules/[code].astro` | Generates `/tools/dockerfile-analyzer/rules/pg011/` and `/tools/dockerfile-analyzer/rules/pg012/` pages | Uses `allRules.map()` in `getStaticPaths()` -- new rules automatically get documentation pages |
| Related rules sidebar | PG011 appears alongside other security rules; PG012 alongside other efficiency rules | `getRelatedRules()` in `related.ts` filters by `rule.category` automatically |
| Score engine | PG011 deductions count toward security category (30% weight); PG012 toward efficiency (25% weight) | `scorer.ts` uses `rule.category` from the rule object |
| Badge generator | Rule count updates from `allRules.length` | Dynamic count |

## Installation

```bash
# No installation needed. Zero new dependencies.
```

## Alternatives Considered

| Decision | Chosen | Alternative | Why Not Alternative |
|----------|--------|-------------|---------------------|
| PG011 severity | `warning` | `error` | Missing USER is a serious issue but some base images (e.g., bitnami/) set a non-root USER internally. Warning is appropriate since we cannot inspect the base image's USER. |
| PG011 scope | Final stage only | All stages | Builder stages routinely need root for package installation. Flagging them would generate excessive noise with no security benefit. |
| PG012 severity | `info` | `warning` | This is an optimization opportunity, not a problem. Suggesting image changes as warnings would be too opinionated for a general-purpose linter. |
| PG012 scope | All FROM stages | Final stage only | Memory savings apply everywhere, including build containers in CI. Showing the suggestion on all stages lets users decide. |
| PG012 matching | `getImageName() === 'node'` only | Regex matching for all Node.js-derived images | Cannot reliably detect all Node.js-based images (e.g., custom images with Node.js installed via RUN). Matching only the official `node:` image avoids false positives. |
| New dependency | None | `semver` for version comparison | Overkill. Simple string matching on image name is sufficient. Version constraints can be mentioned in the message text. |

## What NOT to Do

| Avoid | Why | Do Instead |
|-------|-----|------------|
| Adding any new npm packages | Every API method needed already exists in `dockerfile-ast` | Use existing `getImageName()`, `getImageTag()`, `getInstructions()`, `getKeyword()` |
| Modifying `types.ts` | The `LintRule` interface already supports everything both rules need | Implement rules conforming to existing interface |
| Modifying `engine.ts` | Rules auto-run when registered in `allRules` | Just add to `rules/index.ts` |
| Modifying `scorer.ts` | Scoring already handles all categories and severities | Category/severity on the rule object is sufficient |
| Modifying `[code].astro` | Documentation pages are auto-generated from rule metadata via `getStaticPaths()` | Just ensure rule has complete `title`, `explanation`, `fix` fields |
| Trying to detect non-official Node.js images for PG012 | Cannot reliably determine if a custom image contains Node.js | Only match `node` as the image name from `getImageName()` |
| Making PG011 check intermediate build stages | Builder stages need root for `apt-get install` etc. | Only check the final stage (same pattern as DL3002, PG009, PG010) |
| Adding `semver` or any version parsing library | Image tag parsing for PG012 does not need semver comparison | Use string matching; mention Node 25+ requirement in message text |

## Version Compatibility

| Package | Version | PG011/PG012 Support | Notes |
|---------|---------|---------------------|-------|
| dockerfile-ast@0.7.1 | ^0.7.1 | Full support | All methods (`getFROMs`, `getInstructions`, `getImageName`, `getImageTag`, `getBuildStage`, `getKeyword`, `getArgumentsContent`, `getRange`) available and proven by 44 existing rules |
| TypeScript | (via Astro) | Full support | All rule types imported from `../../types` as usual |
| Astro@5.17.1 | 5.17.1 | Full support | `getStaticPaths()` in `[code].astro` auto-generates new rule pages |

## platformatic/node-caged Reference Data (for PG012 rule content)

These facts should be embedded in the PG012 rule's `explanation` and `fix` fields:

| Claim | Source | Confidence |
|-------|--------|------------|
| ~50% memory reduction for pointer-heavy workloads | Platformatic blog, multiple independent sources | HIGH |
| 2-4% average latency increase | Platformatic benchmarks | MEDIUM |
| 7% improvement in P99 latency | Platformatic benchmarks | MEDIUM |
| 4GB heap limit per V8 isolate | GitHub README, multiple sources | HIGH |
| Worker threads each get their own 4GB limit | GitHub README | HIGH |
| Available variants: bookworm, slim, alpine | Docker Hub, GitHub README | HIGH |
| Built from Node.js v25.x branch | GitHub README | HIGH |
| Uses `--experimental-enable-pointer-compression` V8 flag | GitHub README | HIGH |
| Multi-arch: linux/amd64 and linux/arm64 | GitHub README | HIGH |

## Sources

- **Existing codebase:** Direct inspection of `types.ts`, `rules/index.ts`, `engine.ts`, `scorer.ts`, `[code].astro`, `related.ts`, and 8 existing rule implementations (DL3002, DL3006, DL3007, DL3059, PG006, PG007, PG009, PG010) -- confirmed all API methods and patterns needed
- **dockerfile-ast:** npm package ^0.7.1 already installed, TypeScript types confirmed via `import type { Dockerfile } from 'dockerfile-ast'`
- [platformatic/node-caged GitHub](https://github.com/platformatic/node-caged) -- V8 pointer compression Docker images, variants, constraints
- [platformatic/node-caged Docker Hub](https://hub.docker.com/r/platformatic/node-caged) -- Available image tags and multi-arch support
- [Platformatic blog: Halving Node.js Memory Usage](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half) -- Benchmark results, memory savings data
- [Hadolint issue #1089: Warn if Dockerfile omits USER](https://github.com/hadolint/hadolint/issues/1089) -- Confirms this gap exists in Hadolint (not implemented)
- [Hadolint issue #1025: USER must be specified](https://github.com/hadolint/hadolint/issues/1025) -- Additional confirmation of the missing USER gap
- [Hadolint DL3002 wiki](https://github.com/hadolint/hadolint/wiki/DL3002) -- Confirms DL3002 only flags explicit `USER root`, not missing USER
- [Hadolint issue #328](https://github.com/hadolint/hadolint/issues/328) -- Confirms DL3002 passes when default user is root (no USER directive)
- [Snyk Docker Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/) -- Missing USER as a top security concern
- [Docker Official Best Practices](https://docs.docker.com/build/building/best-practices/) -- USER directive guidance

---
*Stack research for: Dockerfile Analyzer PG011 + PG012 rule expansion*
*Researched: 2026-03-02*
