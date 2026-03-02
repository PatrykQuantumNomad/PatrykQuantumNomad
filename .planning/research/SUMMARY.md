# Project Research Summary

**Project:** v1.12 Dockerfile Analyzer Rules Expansion (PG011 + PG012)
**Domain:** Dockerfile lint rule authoring -- static analysis rule expansion for existing Astro-based tool
**Researched:** 2026-03-02
**Confidence:** HIGH

## Executive Summary

This milestone adds two new custom lint rules to the existing Dockerfile Analyzer: PG011 (flag missing USER directive in the final build stage) and PG012 (suggest `platformatic/node-caged` for Node.js pointer compression memory savings). Both rules are pure TypeScript implementations that use only the existing `dockerfile-ast@^0.7.1` API surface -- zero new dependencies are required. The existing plugin-style architecture (self-contained rule modules registered in a flat array) means the integration footprint is minimal: 2 new files, 1 modified file, and 4+ files that auto-adapt without any changes.

PG011 fills a genuine gap that Hadolint's DL3002 leaves open: DL3002 only flags explicit `USER root`, while Dockerfiles with NO USER directive at all silently default to root. Hadolint's community has requested this rule twice (issues #1025, #1089) and it remains unimplemented or default-disabled. PG012 is a novel rule with no equivalent in any existing Dockerfile linter -- it surfaces the `platformatic/node-caged` image as a ~50% memory reduction option for Node.js workloads via V8 pointer compression. Together these rules expand the analyzer from 44 to 46 rules and strengthen two categories: security (14 to 15 rules) and efficiency (8 to 9 rules).

The primary technical risk is PG011/DL3002 rule overlap -- if PG011 fires when `USER root` is present, users see double violations for the same issue. The boundary is clear and well-documented: PG011 fires ONLY when zero USER instructions exist in the final stage; DL3002 handles the explicit `USER root` case. A secondary risk is stale hardcoded rule counts ("39 rules" and "44 rules" in various places across the site). All four research files converge on this being a LOW-complexity, LOW-risk expansion with well-established patterns proven by 44 existing rules.

## Key Findings

### Recommended Stack

No new dependencies. Every API method needed by both rules is already proven in the codebase by 8+ existing rules. The `dockerfile-ast` library provides `getFROMs()`, `getInstructions()`, `getKeyword()`, `getArgumentsContent()`, `getImageName()`, `getImageTag()`, `getBuildStage()`, and `getRange()` -- all verified by direct source inspection.

**Core technologies (no changes):**
- **dockerfile-ast ^0.7.1**: Dockerfile AST parsing -- provides all methods needed, already installed and browser-safe
- **TypeScript (via Astro)**: Type-safe rule implementation via existing `LintRule` interface
- **Astro 5.17.1**: Static site generator -- `[code].astro` auto-generates rule documentation pages via `getStaticPaths()`

**Key stack decision:** No `semver` library needed for PG012. Simple string matching on `getImageName() === 'node'` is sufficient. Version constraints are communicated in the rule message text, not enforced programmatically.

### Expected Features

**Must have (table stakes -- P1):**
- PG011: Flag final stage with no USER instruction (fills DL3002 gap)
- PG011: Skip `FROM scratch` (no user system) and builder stages (root is intentional)
- PG012: Detect `node:*` base images in final stage and suggest `platformatic/node-caged`
- PG012: Match official Docker Hub `node` image only (not custom registries or substrings)
- Both: Register in `rules/index.ts` for automatic engine, scorer, docs integration
- Both: Before/after code examples in `fix` field (consistent with all 44 existing rules)

**Should have (differentiators -- P2):**
- PG011: Expert explanation covering container escape risk, Kubernetes Pod Security Standards, CIS Benchmark 4.1
- PG012: Nuanced explanation mentioning 4GB heap limit, Node 25+ requirement, native addon compatibility
- Update sample Dockerfile or blog posts to reference new rules

**Defer (v2+):**
- PG012 expansion to other runtimes (Deno, Bun)
- Rule severity customization (user overrides)
- Auto-detect runtime stage via build graph analysis (not feasible with static analysis)

### Architecture Approach

The analyzer follows a clean plugin-style architecture where each rule is a self-contained TypeScript module implementing the `LintRule` interface. Registration in the `allRules` array in `rules/index.ts` is the single integration point -- engine, scorer, related rules, and documentation pages all consume this array dynamically. Adding a rule requires exactly 3 touchpoints: create the rule file, add to `allRules`, verify the docs route renders.

**Major components (change surface):**
1. **Rule files** (2 NEW) -- `rules/security/PG011-missing-user-directive.ts` and `rules/efficiency/PG012-node-pointer-compression.ts`
2. **Registry** (1 MODIFY) -- `rules/index.ts` adds 2 imports and 2 array entries
3. **Engine, Scorer, Related, [code].astro** (4 NO CHANGE) -- all auto-adapt from `allRules`

**Key architectural patterns to follow:**
- Self-contained rule module: metadata + `check()` in one exported const
- Final-stage scoping: find last FROM, filter instructions after it (proven by DL3002, PG007, PG009, PG010)
- Registry-driven auto-discovery: `allRules` is the single source of truth

### Critical Pitfalls

1. **PG011/DL3002 rule overlap** -- PG011 must ONLY fire when NO USER instruction exists. If any USER exists (even `USER root`), PG011 stays silent and DL3002 handles it. Test: Dockerfile with `USER root` should trigger DL3002 only, not both.

2. **Multi-stage build false positives** -- Only check the final build stage. Builder stages routinely run as root for `apt-get install` and compilation. Skip `FROM scratch` entirely. Pattern already established in DL3002, PG009, PG010.

3. **PG012 image name matching precision** -- Match `getImageName()` being exactly `node` or `docker.io/library/node`. Do NOT match substrings (`auth-node`), custom registries (`myregistry.com/node`), or non-Node images (`distroless/nodejs`). For info-severity, precision over recall.

4. **Stale hardcoded rule counts** -- The site has rule count references at "39" (v1.4 era) and "44" (current). Adding 2 rules makes 46. Grep for all count references and update in a coordinated pass. Missed counts create SEO inconsistency.

5. **node-caged version limitation** -- PG012 must clearly communicate that `platformatic/node-caged` requires Node 25+ (not LTS). Users on Node 18/20/22 LTS cannot use it. Include this constraint in the rule explanation text.

## Implications for Roadmap

Based on research, this is a compact 3-phase expansion. Both rules can technically be built in parallel since they are independent, but sequential implementation allows validation of the DL3002 boundary before moving to the more nuanced PG012 detection logic.

### Phase 1: PG011 -- Missing USER Directive

**Rationale:** PG011 is the simpler rule (absence detection) but has the most critical boundary condition (DL3002 overlap). Building it first establishes that the overlap is handled correctly before PG012 adds more complexity.

**Delivers:** `PG011-missing-user-directive.ts` rule file, registration in `index.ts`, auto-generated documentation page at `/tools/dockerfile-analyzer/rules/pg011/`.

**Addresses features:** Missing USER detection, `FROM scratch` skip, builder stage skip, final-stage scoping, before/after code examples.

**Avoids pitfalls:** Pitfall 1 (DL3002 overlap -- explicit boundary test), Pitfall 2 (multi-stage false positives -- final stage only).

**Verification checklist:**
- No USER anywhere --> PG011 fires
- `USER root` --> DL3002 fires, PG011 silent
- `USER node` --> Neither fires
- `FROM scratch` + no USER --> PG011 silent
- Multi-stage with USER only in builder --> PG011 fires on final stage

### Phase 2: PG012 -- Node.js Pointer Compression

**Rationale:** PG012 requires more nuanced detection (image name matching) and messaging (version constraints, heap limits). Building it after PG011 means the index.ts registration pattern is already proven.

**Delivers:** `PG012-node-pointer-compression.ts` rule file, registration in `index.ts`, auto-generated documentation page at `/tools/dockerfile-analyzer/rules/pg012/`.

**Addresses features:** Node.js image detection, node-caged suggestion, 4GB heap caveat, Node 25+ requirement in message, before/after code examples.

**Avoids pitfalls:** Pitfall 3 (image name matching -- exact match only), Pitfall 5 (version limitation -- explicit in message).

**Verification checklist:**
- `FROM node:22` --> PG012 fires
- `FROM python:3.12` --> PG012 silent
- `FROM platformatic/node-caged:25` --> PG012 silent
- `FROM myregistry.io/node:22` --> PG012 silent
- `FROM docker.io/library/node:22` --> PG012 fires

### Phase 3: Site-Wide Integration & Count Updates

**Rationale:** Count string updates are mechanical but high-impact for SEO. They should be done as a coordinated pass after both rules are complete, so the final state can be verified with a full build.

**Delivers:** All hardcoded rule counts updated (39/44 to 46), full production build verification, related rules cross-linking confirmed, scoring impact validated.

**Addresses features:** Blog post cross-references, LLMs.txt updates, JSON-LD updates, homepage callout updates.

**Avoids pitfalls:** Pitfall 4 (stale counts -- systematic grep audit).

**Verification checklist:**
- `allRules.length === 46`
- Security rules: 15, Efficiency rules: 9
- Documentation pages render at `/rules/pg011/` and `/rules/pg012/`
- Full `astro build` passes
- No references to "39 rules" or "44 rules" remain in source

### Phase Ordering Rationale

- Phase 1 before Phase 2: PG011 validates the DL3002 boundary and the index.ts registration pattern. PG012 reuses the same pattern with confidence.
- Phase 2 before Phase 3: Both rules must exist before count updates are meaningful. Updating counts to 46 before both rules are registered would be temporarily incorrect.
- Both rules independent: If needed, they CAN be implemented in parallel. The sequential recommendation is for review quality, not dependency.

### Research Flags

Phases with standard patterns (no `/gsd:research-phase` needed):
- **Phase 1:** Detection logic is identical to DL3002 with an inverted check. Pattern proven by 8+ existing rules.
- **Phase 2:** Image name matching via `getImageName()` is proven by DL3006, DL3007, PG006. Node-caged facts are documented in STACK.md.
- **Phase 3:** Mechanical grep-and-replace with defined checklist.

No phases require deeper research. All patterns are established and all API methods are verified.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; all API methods verified by direct source inspection of 8 existing rules |
| Features | HIGH | Feature set fully defined with clear P1/P2 priorities; competitive analysis confirms PG011 fills a real gap, PG012 is genuinely novel |
| Architecture | HIGH | Direct codebase analysis of all affected files; plugin architecture is clean and well-understood; auto-adapt pattern eliminates integration risk |
| Pitfalls | HIGH | All pitfalls identified from direct codebase inspection with concrete prevention strategies; DL3002 boundary documented at source-line level |

**Overall confidence:** HIGH

### Gaps to Address

- **PG012 final-stage-only vs. all-stages scope:** FEATURES.md and ARCHITECTURE.md disagree slightly. FEATURES.md lists "flag all FROM stages" as an anti-feature and recommends final-stage only. ARCHITECTURE.md also scopes to final stage. STACK.md mentions reporting on ALL node: FROM stages. The recommendation is **final stage only** -- builder stage memory is ephemeral and flagging every stage creates noise for multi-stage builds. Resolve during Phase 2 implementation.

- **Sample Dockerfile update:** ARCHITECTURE.md notes the current sample uses `FROM ubuntu:latest` with `USER root`, which cannot trigger PG011 (USER exists) or PG012 (not a node image). Both research files agree to leave the sample unchanged. Users will see these rules on their own Dockerfiles. Consider adding a second sample in a future milestone if usage data warrants it.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `types.ts`, `rules/index.ts`, `engine.ts`, `scorer.ts`, `[code].astro`, `related.ts`, and 8 existing rule implementations (DL3002, DL3006, DL3007, DL3059, PG006, PG007, PG009, PG010)
- `dockerfile-ast` npm package ^0.7.1 -- TypeScript types confirmed via `import type { Dockerfile } from 'dockerfile-ast'`
- [Hadolint issue #1089](https://github.com/hadolint/hadolint/issues/1089) -- Missing USER feature request (open)
- [Hadolint issue #1025](https://github.com/hadolint/hadolint/issues/1025) -- Missing USER feature request (open)
- [Hadolint DL3002 wiki](https://github.com/hadolint/hadolint/wiki/DL3002) -- Confirms DL3002 only flags explicit `USER root`
- [platformatic/node-caged GitHub](https://github.com/platformatic/node-caged) -- V8 pointer compression images, variants, constraints
- [CIS Docker Benchmark V1.6.0 Section 4.1](https://hub.powerpipe.io/mods/turbot/steampipe-mod-docker-compliance/benchmarks/control.cis_v160_4_1) -- USER directive requirement

### Secondary (MEDIUM confidence)
- [Platformatic blog: Halving Node.js Memory](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half) -- ~50% memory savings, 2-4% latency benchmarks
- [Vinta Software: node-caged validation](https://www.vintasoftware.com/lessons-learned/node-caged-can-get-up-to-50-memory-reduction-in-nodejs-with-pointer-compression) -- Independent confirmation of memory savings
- [Snyk Docker Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/) -- Missing USER as top security concern
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) -- Authoritative security guidance

### Tertiary (LOW confidence)
- [Hadolint PR #1032](https://github.com/hadolint/hadolint/pull/1032) -- DL3063 implementation (default: ignore) -- confirms the severity calibration challenge
- Platformatic benchmarks for P99 latency (7% improvement) -- single-source claim, needs independent validation

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*
