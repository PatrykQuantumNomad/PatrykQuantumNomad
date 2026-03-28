---
gsd_state_version: 1.0
milestone: v1.18
milestone_name: AI Landscape Explorer
status: complete
stopped_at: Phase 110 verified
last_updated: "2026-03-28T00:30:00.000Z"
last_activity: 2026-03-28
progress:
  total_phases: 9
  completed_phases: 9
  total_plans: 25
  completed_plans: 25
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.18 AI Landscape Explorer — MILESTONE COMPLETE. All 9 phases (102-110) verified.

## Current Position

Phase: 110 (Site Integration)
Plan: 4 of 4 in phase 110
Status: Phase complete — verified and approved
Last activity: 2026-03-27

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 235 (across 17 milestones)
- v1.18 plans completed: 12

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 through v1.17 | 1-101 | 231 | 831 | 2026-02-11 to 2026-03-15 |
| **v1.18 AI Landscape Explorer** | **102-110** | **TBD** | **40** | **In progress** |
| Phase 102 P02 | 7min | 2 tasks | 1 files |
| Phase 102 P03 | 9min | 2 tasks | 2 files |
| Phase 103 P01 | 2min | 2 tasks | 5 files |
| Phase 103 P03 | 4min | 2 tasks | 2 files |
| Phase 103 P02 | 3min | 2 tasks | 3 files |
| Phase 104 P01 | 35min | 2 tasks | 7 files |
| Phase 105 P01 | 31min | 2 tasks | 4 files |
| Phase 105 P02 | 19min | 3 tasks | 2 files |
| Phase 106 P01 | 3min | 2 tasks | 3 files |
| Phase 106 P02 | 5min | 2 tasks | 2 files |
| Phase 107 P01 | 2min | 2 tasks | 3 files |
| Phase 107 P02 | 10min | 2 tasks | 1 files |
| Phase 108 P01 | 2min | 2 tasks | 5 files |
| Phase 108 P03 | 6min | 1 tasks | 3 files |
| Phase 108 P02 | 6min | 2 tasks | 4 files |
| Phase 110 P02 | 3min | 2 tasks | 3 files |
| Phase 110 P03 | 4min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Research recommends build-time force pre-computation over runtime simulation (user decision pending before Phase 105)
- Content tiering strategy: research recommends full content for top ~20 concepts, noindex the rest until written
- D3 micro-module imports only (never umbrella d3 package) — bundle isolation critical
- client:only="react" for graph island (never client:visible) — prevents SSR crash
- Edge type enum: 10 categories (hierarchy, includes, enables, example, relates, progression, characterizes, aspires, applies, standardizes)
- Two-file data split: nodes.json (file() loader content collection) + graph.json (clusters/edges, direct import)
- [Phase 102]: 27 nodes authored for AI/ML/NN/DL clusters with two-tier content (simple + technical) and whyItMatters
- [Phase 102]: Complete 51-node AI landscape dataset: GenAI (12 nodes with LLM/RAG/hallucination focus), Levels (ANI/ACI/AGI/ASI), Agentic (6 characteristics), DevTools (1), MCP (1)
- [Phase 102]: 380-test content quality suite validates all nodes for word counts, schema compliance, cluster coverage, and edge-node referential integrity
- [Phase 103]: Tests use real nodes.json data (not mocks) for ancestry chain validation — caught plan's incorrect 3-ancestor expectation for transformers (actual: 4)
- [Phase 103]: AI landscape OG images use cluster darkColor for accent bar gradient and decorative block instead of site-wide orange
- [Phase 103]: nodesMap passed as Record<string, {name, slug}> to components (not full AiNode) for lightweight props
- [Phase 104]: Headless d3-force simulation (300 ticks) with cluster centroid forceX/forceY for spatial grouping
- [Phase 104]: CSS class-based cluster coloring (.ai-cluster-{id}) with html.dark overrides for dark mode
- [Phase 104]: SVG builder uses CSS vars (--color-text-primary, --color-border) for theme integration
- [Phase 104]: Root nodes (parentId null) get r=24, child nodes r=18 for visual hierarchy
- [Phase 105]: d3-zoom + React integration: zoom behavior in useRef, transform state applied to single wrapping <g> for O(1) diff per frame
- [Phase 105]: Modifier key guard: d3-zoom .filter() rejects unmodified wheel, native listener shows auto-hiding overlay hint
- [Phase 105]: Embedded SVG CSS via dangerouslySetInnerHTML for cluster coloring and html.dark overrides inside React-rendered SVG
- [Phase 106]: ELI5 toggle defaults to simple (isSimple=true) for accessibility-first approach
- [Phase 106]: groupRelationshipsByType uses directional hierarchy detection: target=Part of, source=Includes
- [Phase 106]: DetailPanel is pure presentational — no positioning or open/close state; Plan 02 wrapper handles layout
- [Phase 107]: Dead-end fallback: nearestNeighborInDirection returns best-scored neighbor in any direction when no neighbor within 90 degrees
- [Phase 107]: URL sync uses history.replaceState (not pushState) to avoid polluting browser history
- [Phase 107]: zoomToNode uses viewBox dimensions (meta.width/2) not pixel getBoundingClientRect for correct transform at scale=2 — Viewport-relative math required for d3-zoom programmatic transitions
- [Phase 108]: Tour data stored in TypeScript (not JSON) for interface co-location and narrative strings
- [Phase 108]: 12 curated comparison pairs (not all 1,275 permutations) with canonical alphabetical slug ordering
- [Phase 108]: No parseComparisonSlug function -- slug parsing ambiguous with hyphenated concept names; curated array for lookups
- [Phase 108]: Dark background (#0a0a0f) for VS OG images to differentiate from light-bg concept OG images
- [Phase 108]: VS page relationship groups capped to 3 groups x 4 items per column to prevent overflow
- [Phase 108]: TourBar replaces SearchBar during active tour to reduce visual clutter and prevent conflicting navigation
- [Phase 108]: prevTourActive useRef pattern detects tour exit without firing handleClosePanel on initial mount
- [Phase 109]: getClusterBounds enforces minimum 200 SVG unit bounding box to prevent extreme zoom on single-node clusters (nn)
- [Phase 109]: Cluster zoom scale clamped to [0.5, 3] — tighter than zoom extent [0.3, 4] — consistent with viewBox-relative math pattern from zoomToNode
- [Phase 109]: Interactive cluster legend inside React island is separate from static GraphLegend.astro (preserved for SEO/noscript)
- [Phase 109]: Dark mode color dots use dual-span pattern (dark:hidden / hidden dark:inline-block) matching GraphLegend.astro
- [Phase 109]: useGSAP from @gsap/react handles animation cleanup automatically — no manual timeline teardown needed
- [Phase 109]: Pulse radiates outward from selected node via directional strokeDashoffset animation (15% dash length, 1.2s, power1.inOut)
- [Phase 109]: Pulse overlay rendered between edges and nodes layers with pointerEvents=none for correct z-order
- [Phase 109]: prefers-reduced-motion: reduce skips edge pulse entirely (decorative animation)
- [Phase 109]: MiniMap is read-only (no click-to-pan) with aria-hidden=true — visual orientation aid, not interactive
- [Phase 109]: Viewport rectangle derived from d3-zoom transform inversion: viewX = -transform.x / transform.k
- [Phase 109]: Mini-map uses React.memo and nodeClusterMap useMemo for efficient rendering during frequent transform updates
- [Phase 110]: AI Landscape nav link placed after Blog, before Beauty Index — alphabetical among content sections (11 total nav items)
- [Phase 110]: Sitemap /ai-landscape/ added to existing beauty-index/db-compass/eda condition (monthly, priority 0.5) — no separate block
- [Phase 110]: Homepage card uses inline SVG node-graph motif (8 circles, 10 edges, cluster darkColors at 70% opacity) via frontmatter IIFE + set:html
- [Phase 110]: Companion blog post targets non-technical audience with 1721 words, 16 concept page cross-links, 4 VS comparison links
- [Phase 110]: Blog post uses node slug /ai-landscape/autonomy/ (not /autonomy-levels/) — verified from nodes.json
- [Phase 110]: Landing OG image uses light background (#faf8f5) with 5-cluster gradient accent bar; centered layout with cluster name pills (not two-column)
- [Phase 110]: LLMs.txt compact cluster listing: count + first 3 node names; llms-full.txt: tours + per-concept simple/technical(200ch)/whyItMatters + all 12 comparisons

### Pending Todos

None.

### Blockers/Concerns

- Content authoring for ~80 nodes is the longest-pole constraint — not engineering, but writing
- Build-time vs runtime simulation decision must be resolved before Phase 105 planning
- Dark mode cluster colors defined in graph.json (9 clusters with light/dark hex pairs)
- Hub page (/guides/) uses Tailwind dynamic class interpolation for accentColor — tech debt from v1.16
- Beauty Index OG image "Cannot find module renderers.mjs" error (pre-existing)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |
| 012 | Fix Snyk security scan vulnerabilities (npm audit + W007 secret redaction) | 2026-03-06 | ddf902c | [012-fix-snyk-security-scan-issue-on-gha-vali](./quick/012-fix-snyk-security-scan-issue-on-gha-vali/) |

## Session Continuity

Last session: 2026-03-27T18:50:11.463Z
Stopped at: Completed 108-02-PLAN.md
Resume file: None
Next: `/gsd:plan-phase 105` (Interactive Graph Core)
