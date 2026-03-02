# Feature Research

**Domain:** Dockerfile lint rule expansion (PG011, PG012)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

For a lint rule flagging missing USER directives, users expect behavior consistent with how other "absence detection" rules work in the existing analyzer (e.g., DL3057 for missing HEALTHCHECK).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **PG011: Flag missing USER in final stage** | Hadolint DL3002 only flags explicit `USER root`, leaving a critical gap: Dockerfiles with NO `USER` instruction silently run as root. Hadolint community requested this as DL3063. Users of any Dockerfile linter expect the tool to catch implicit-root-as-default. | LOW | The existing DL3002 code already scopes to the final stage and filters USER instructions -- PG011 inverts the empty-check branch to flag instead of skip. |
| **PG011: Skip `FROM scratch` images** | `scratch` has no filesystem, no `/etc/passwd`, no shell -- USER cannot work without a multi-stage copy of passwd. Flagging scratch is a false positive. | LOW | Check `getImageName() === 'scratch'` on the last FROM. |
| **PG011: Skip build-stage aliases** | In multi-stage builds, intermediate stages (e.g., `FROM node:22 AS builder`) often run as root intentionally for `apt-get install` / compilation. Only the final runtime stage matters. | LOW | Already handled: scope to instructions after the last FROM, matching DL3002's existing pattern. |
| **PG012: Detect `node:*` base images** | When `FROM node:20-alpine` or `FROM node:22-slim` is used, suggest `platformatic/node-caged` for V8 pointer compression. Users expect the rule to match all official Node.js image variants. | MEDIUM | Must match: `node`, `node:TAG`, `docker.io/library/node:TAG`, and variable tags like `node:${VERSION}`. The From class provides `getImageName()` and `getImageTag()` methods. |
| **PG012: Before/after code examples** | Every existing rule provides `fix.beforeCode` and `fix.afterCode`. Users expect concrete Dockerfile snippets showing what to change. | LOW | `FROM node:22-alpine` -> `FROM platformatic/node-caged:22-alpine` |
| **PG011 + PG012: Rule documentation pages** | The `[code].astro` page auto-generates from `allRules`. Adding rules to the index automatically creates rule doc pages with explanation, fix, severity badge, and related rules. | LOW | No new page code needed -- just export from `rules/index.ts`. |

### Differentiators (Competitive Advantage)

These features go beyond what Hadolint and other linters offer, positioning this analyzer as uniquely valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **PG012: Node-caged memory savings suggestion** | No other Dockerfile linter suggests `platformatic/node-caged` as an optimization. This is a novel, opinionated recommendation that demonstrates deep Node.js expertise -- exactly the kind of insight a "Cloud-Native Software Architect" portfolio tool should showcase. | MEDIUM | The Platformatic blog documents ~50% memory savings with 2-4% avg latency increase. This is a genuine production optimization, not theoretical. |
| **PG011: Expert explanation of implicit root danger** | Hadolint's proposed DL3063 defaults to "ignore" severity. PG011 as a `warning` with a rich explanation (container escape risk, Kubernetes securityContext implications, Pod Security Standards enforcement) goes further than any existing linter. | LOW | Leverage the existing explanation style from DL3002 and PG007 to create a cohesive security narrative across the three USER-related rules. |
| **PG012: Compatibility caveat in explanation** | Mentioning the 4GB heap-per-isolate limit and native addon compatibility (N-API works, legacy V8 API like better-sqlite3 does not) in the explanation prevents users from blindly adopting the suggestion. This nuance builds trust. | LOW | Include in the `explanation` field, not as a separate feature. |
| **PG011: Correct line reporting on last FROM** | When USER is missing, report the violation on the last `FROM` line (where the final stage begins). This mirrors DL3057's pattern for missing HEALTHCHECK and gives users a clear anchor point for the fix location. | LOW | `lastFrom.getRange().start.line + 1` -- identical to DL3057 pattern. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Auto-detect which stage is the "runtime" stage** | In complex multi-stage builds, the final FROM is not always the runtime stage (some Dockerfiles have test/debug stages after runtime). | Requires semantic analysis of the entire build graph to determine which stage is "runtime." The `dockerfile-ast` library has no concept of "target stage" -- that is a `docker build --target` flag at build time, not parseable from the Dockerfile alone. | Scope to the **last** FROM, matching Hadolint's convention. Document that `--target` overrides are not detectable. |
| **PG012: Suggest node-caged for ALL stages** | Users might want memory optimization everywhere. | Builder stages run `npm install`, `npm run build`, then discard. Memory savings in ephemeral build stages are irrelevant. Flagging every `FROM node:*` creates noise. | Only flag the **final stage** FROM that uses a node image. |
| **PG012: Auto-rewrite the FROM line** | Users want one-click fixes. | `platformatic/node-caged` tags may not have exact parity with every official `node:*` variant. Auto-rewrite could introduce a non-existent tag. The tool is a static analyzer, not an editor with write access. | Provide clear before/after examples in the fix. Let the user make the conscious decision. |
| **PG011: Flag ALL stages without USER** | Seems thorough. | Builder stages (`FROM node:22 AS builder`) intentionally run as root for package installation and compilation. Flagging them creates false positives that train users to ignore warnings. | Only flag the final stage, consistent with DL3002 behavior. |
| **PG012: Suggest node-caged for non-Docker Hub node images** | Images like `gcr.io/distroless/nodejs` or `mcr.microsoft.com/node` also run Node.js. | These are fundamentally different images with different base layers, security profiles, and purposes. node-caged is a drop-in for the official `node:*` image only. | Only match image names that resolve to the official Docker Hub `node` image: bare `node`, `library/node`, `docker.io/library/node`. |

## Feature Dependencies

```
PG011 (missing USER)
    depends on ──> existing DL3002 pattern (final-stage scoping logic)
    depends on ──> existing PG007 pattern (USER instruction detection)
    enhances ──> DL3002 (fills the "no USER at all" gap)
    enhances ──> PG007 (PG007 checks UID/GID quality, PG011 checks USER existence)

PG012 (node-caged suggestion)
    depends on ──> existing PG006 pattern (FROM instruction iteration, image name parsing)
    depends on ──> From.getImageName() / From.getImageTag() API from dockerfile-ast
    independent of ──> PG011 (no dependency between the two new rules)

Both rules
    depend on ──> rules/index.ts (must be added to allRules array)
    depend on ──> rules/related.ts (auto-generates related rules by category)
    enhance ──> scorer.ts (more rules = more granular scoring, no changes needed)
    enhance ──> [code].astro (auto-generates documentation pages, no changes needed)
```

### Dependency Notes

- **PG011 depends on DL3002 pattern:** The final-stage scoping logic (find last FROM, filter instructions after it) is already proven in DL3002. PG011 should reuse the same approach for consistency.
- **PG012 depends on PG006 pattern:** PG006 already iterates `getFROMs()`, checks `getImageName()`, skips `scratch`, and skips build-stage aliases. PG012 needs the same iteration with a different check (image name match instead of digest check).
- **PG011 enhances DL3002 + PG007:** Together, the three rules form a complete USER security story: PG011 checks presence, DL3002 checks the value is not root, PG007 checks UID/GID quality.
- **Both rules are independent:** PG011 and PG012 have zero dependencies on each other and can be implemented in any order or in parallel.

## MVP Definition

### Launch With (v1)

Since this is a subsequent milestone adding 2 rules to an existing 44-rule analyzer, "MVP" means both rules are complete and consistent with existing patterns.

- [ ] **PG011 rule file** (`rules/security/PG011-require-user.ts`) -- Flag final stage with no USER instruction
- [ ] **PG011 edge cases** -- Skip `FROM scratch`, skip build-stage alias references in final FROM
- [ ] **PG012 rule file** (`rules/efficiency/PG012-node-caged.ts` or `rules/best-practice/PG012-node-caged.ts`) -- Flag `node:*` in final stage FROM
- [ ] **PG012 image name matching** -- Match `node`, `library/node`, `docker.io/library/node`; skip variable-only image names
- [ ] **Register both in `rules/index.ts`** -- Add to `allRules` array in correct category sections
- [ ] **Rule documentation** -- Automatic via `[code].astro` static paths; no new code needed
- [ ] **Related rules** -- Automatic via `related.ts` category matching; no new code needed

### Add After Validation (v1.x)

- [ ] **Update sample Dockerfile** -- Add a scenario that triggers PG011 and/or PG012 in the default sample so new visitors see the rules in action
- [ ] **Blog post update** -- Reference PG011 and PG012 in the existing `dockerfile-best-practices.mdx` blog post for SEO
- [ ] **PG012 variant tag mapping** -- If platformatic/node-caged adds more variants, update the before/after examples to cover slim/alpine/bookworm

### Future Consideration (v2+)

- [ ] **PG012 expansion to other runtimes** -- If pointer-compression images emerge for Deno or Bun, add similar suggestions
- [ ] **PG011 Kubernetes Pod Security Standards integration** -- Link to PSS restricted profile requirements in the explanation
- [ ] **Rule severity customization** -- Allow users to override severity per rule (e.g., upgrade PG011 from warning to error for strict environments)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| PG011: Missing USER detection | HIGH | LOW | P1 |
| PG011: Skip scratch/alias edge cases | HIGH | LOW | P1 |
| PG012: Node-caged suggestion | MEDIUM | MEDIUM | P1 |
| PG012: Image name matching logic | MEDIUM | MEDIUM | P1 |
| Register both in index.ts | HIGH | LOW | P1 |
| Update sample Dockerfile | LOW | LOW | P2 |
| Blog post cross-reference | LOW | LOW | P2 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Hadolint | Dockle | Trivy | Our Approach (PG011/PG012) |
|---------|----------|--------|-------|---------------------------|
| Flag explicit `USER root` | DL3002 (warning) | CIS-DI-0001 | Dockerfile misconfiguration | DL3002 (already have) |
| Flag missing USER entirely | DL3063 (ignore by default, in PR) | CIS-DI-0001 (checks both) | Not implemented | **PG011 (warning)** -- enabled by default, not hidden behind config |
| Suggest alternative base image | Not implemented | Not implemented | Not implemented | **PG012 (info)** -- novel rule, no competitor offers this |
| Memory optimization suggestions | Not implemented | Not implemented | Not implemented | **PG012** -- unique differentiator for Node.js-focused analysis |
| Expert explanations with fix examples | Terse one-line messages | Brief descriptions | Brief descriptions | Rich multi-paragraph explanations with before/after code blocks |

### Key Competitive Insights

1. **Hadolint's DL3063 defaults to "ignore"** -- They added it but disabled it by default, likely due to false-positive concerns in multi-stage builds. Our PG011 avoids this by scoping strictly to the final stage and skipping scratch, making `warning` severity safe as default.

2. **No linter suggests node-caged** -- PG012 is genuinely novel. Dockerfile linters focus on correctness and security, not runtime optimization. This positions the analyzer as going beyond "lint" into "optimization advisor."

3. **Dockle's CIS-DI-0001** is the closest competitor to PG011, as it checks both explicit root and missing USER. However, Dockle analyzes built images (not Dockerfiles), so it operates at a different layer.

## Edge Cases Summary

### PG011 Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|-------------------|-----------|
| No USER instruction anywhere | Flag on last FROM line | Implicit root is the security risk |
| `USER root` in final stage | Do NOT flag (DL3002 handles this) | Avoid double-flagging; DL3002 owns explicit root |
| `USER node` in final stage | Do NOT flag | Non-root user is set correctly |
| `FROM scratch` as final stage | Do NOT flag | scratch has no passwd; USER requires multi-stage setup that is too complex to prescribe |
| `FROM builder` (alias) as final stage | Do NOT flag | Alias references inherit from their source stage; cannot determine USER from alias alone |
| Multi-stage with USER only in builder | Flag on last FROM | Builder's USER does not carry into runtime stage |
| `USER ${APP_USER}` (variable) | Do NOT flag | A USER instruction exists; variable may resolve to non-root at build time |
| Single-stage Dockerfile, no USER | Flag on FROM line | Most common case; highest impact |
| `FROM node:22` with USER in ONBUILD | Flag | ONBUILD USER only fires in child images, not in this image |

### PG012 Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|-------------------|-----------|
| `FROM node:22-alpine` | Flag with suggestion | Standard node image, eligible for node-caged |
| `FROM node:22-alpine AS builder` (not final) | Do NOT flag | Only flag the final stage; builder memory is ephemeral |
| `FROM node` (no tag) | Flag with suggestion | Still an official node image |
| `FROM node:${VERSION}` | Flag with suggestion, note variable tag | The base image IS node; the tag is unknown but suggestion is still valid |
| `FROM platformatic/node-caged:22` | Do NOT flag | Already using node-caged |
| `FROM myregistry.io/node:22` | Do NOT flag | Custom registry node images may be customized; only match official `node` |
| `FROM docker.io/library/node:22` | Flag | This is the fully-qualified official node image |
| `FROM gcr.io/distroless/nodejs22` | Do NOT flag | Different image entirely, not a drop-in replacement candidate |
| `FROM node:22` in non-final stage only | Do NOT flag | Only the final stage matters for runtime memory |
| `FROM scratch` with COPY from node stage | Do NOT flag | Final image is scratch, not node |

## Severity and Category Recommendations

### PG011: Require USER instruction

- **Category:** `security` -- Aligns with DL3002 and PG007 (all three form the USER security chain)
- **Severity:** `warning` -- Not `error` because some base images (e.g., bitnami) set non-root USER in their base layer. Not `info` because running as root is a genuine security risk that most users should fix.
- **Rationale for warning over info:** Hadolint defaults their equivalent (DL3063) to "ignore", which means nobody sees it. The whole point of PG011 is to close the DL3002 gap where missing USER goes completely undetected. `warning` ensures visibility without blocking.

### PG012: Suggest node-caged

- **Category:** `efficiency` -- This is a memory optimization, not a security or correctness issue. The `efficiency` category (weight: 25%) is appropriate because it aligns with other resource-optimization rules.
- **Severity:** `info` -- This is an optimization suggestion, not a problem. The Dockerfile is valid without node-caged. Using `info` (3-point deduction per the scorer) keeps the score impact minimal while still surfacing the recommendation.
- **Rationale for info over warning:** node-caged has real limitations (4GB heap cap, native addon compatibility). Treating this as `warning` would imply the user is doing something wrong, when in fact they are doing something that could be better.

## API Notes (dockerfile-ast)

Key finding: `dockerfile-ast` does NOT provide a `getUSERs()` method (unlike `getFROMs()`, `getCMDs()`, `getENTRYPOINTs()`, `getHEALTHCHECKs()`). USER instructions must be found via:

```typescript
const userInstructions = dockerfile.getInstructions().filter(
  (inst) => inst.getKeyword() === 'USER'
);
```

This is already the pattern used by DL3002. The `From` class provides: `getImageName()`, `getImageTag()`, `getImageDigest()`, `getBuildStage()`, `getRegistry()` -- all needed for PG012's image matching.

## Sources

- [Hadolint issue #1089: Warn if Dockerfile omits USER instruction](https://github.com/hadolint/hadolint/issues/1089) -- Feature request for missing USER detection
- [Hadolint PR #1032: Adding rule DL3062/DL3063](https://github.com/hadolint/hadolint/pull/1032) -- Implementation of missing USER rule (default: ignore)
- [Platformatic node-caged GitHub](https://github.com/platformatic/node-caged) -- V8 pointer compression Docker images
- [Platformatic blog: We Cut Node.js Memory in Half](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half) -- Technical details on memory savings
- [node-caged memory reduction (Vinta Software)](https://www.vintasoftware.com/lessons-learned/node-caged-can-get-up-to-50-memory-reduction-in-nodejs-with-pointer-compression) -- Independent validation of ~50% savings
- [Matteo Collina on V8 IsolateGroups](https://x.com/matteocollina/status/2023805916961800301) -- Technical background on V8 pointer compression in Node.js
- [Snyk: Docker Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/) -- Industry standard for USER directive requirement
- [Sysdig: Dockerfile Best Practices](https://sysdig.com/blog/dockerfile-best-practices/) -- USER instruction as security baseline
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) -- Authoritative security guidance
- [Non-privileged containers from scratch](https://medium.com/@lizrice/non-privileged-containers-based-on-the-scratch-image-a80105d6d341) -- Edge case: USER in scratch images
- [dockerfile-ast npm](https://www.npmjs.com/package/dockerfile-ast) -- Parser library API reference
- [dockerfile-ast GitHub](https://github.com/rcjsuen/dockerfile-ast) -- TypeScript type definitions for API methods
- [Docker Hub: node official image](https://hub.docker.com/_/node/) -- Official Node.js image tag variants

---
*Feature research for: Dockerfile Analyzer rule expansion (PG011 + PG012)*
*Researched: 2026-03-02*
