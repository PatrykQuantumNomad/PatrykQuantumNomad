---
phase: 108-guided-tours-compare-mode
verified: 2026-03-27T15:05:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 108: Guided Tours & Compare Mode Verification Report

**Phase Goal:** Non-technical users can follow curated learning paths through the landscape, and curious users can compare concepts side by side
**Verified:** 2026-03-27T15:05:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | At least 3 guided learning paths exist ("The Big Picture", "How ChatGPT Works", "What is Agentic AI") that step through a curated sequence of nodes | VERIFIED | `src/lib/ai-landscape/tours.ts` exports TOURS array with exactly 3 tours; titles match exactly; 7, 10, and 9 steps respectively; all 26 nodeIds validated against 51-node dataset by 16 passing tests |
| 2 | Tour UI shows a progress indicator, next/previous controls, and highlights the current node plus connections | VERIFIED | `TourBar.tsx` renders "Step {n+1} of {totalSteps}" progress text, disabled Prev on step 0, and Next/Finish toggle; `useTour.ts` computes `highlightNodeIds` set containing current + adjacent step nodes; `InteractiveGraph.tsx` feeds this set into `highlightedNodeIds` state driving existing dim-to-0.2 opacity logic |
| 3 | Selecting two concepts activates a side-by-side comparison view showing both descriptions, relationships, and ancestry paths | VERIFIED | `ComparePanel.tsx` renders two `ConceptColumn` sections each with simpleDescription/technicalDescription toggle, `buildAncestryChain` breadcrumb trail, and `groupRelationshipsByType` relationship groups; `InteractiveGraph.tsx` shows ComparePanel in place of DetailPanel when `compareMode && selectedNode && compareNode` |
| 4 | Popular comparisons have dedicated VS pages at /ai-landscape/vs/[slug1]-vs-[slug2] with structured data and OG images | VERIFIED | `src/pages/ai-landscape/vs/[slug].astro` generates 12 static pages via `getStaticPaths` over POPULAR_COMPARISONS; each page includes FAQPage JSON-LD inline, two DefinedTermJsonLd components, BreadcrumbJsonLd, and OG image via `vsOgImageUrl()`; `src/pages/open-graph/ai-landscape/vs/[slug].png.ts` generates 12 PNG images via `generateAiLandscapeVsOgImage` |

**Score:** 4/4 truths verified

---

### Required Artifacts (All Plans)

#### Plan 01 -- Data Layer

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/ai-landscape/tours.ts` | Tour/TourStep interfaces and TOURS array (3 tours) | VERIFIED | 6,208 bytes; exports `Tour`, `TourStep`, `TOURS`; 3 tours with 7/10/9 steps; all narratives non-empty |
| `src/lib/ai-landscape/comparisons.ts` | ComparisonPair, POPULAR_COMPARISONS (12 pairs), comparisonSlug helper | VERIFIED | 6,007 bytes; exports all three; 12 pairs with canonical alphabetical ordering; comparisonSlug sorts inputs before joining |
| `src/lib/ai-landscape/routes.ts` | vsPageUrl and vsOgImageUrl helpers added | VERIFIED | 1,123 bytes; exports `vsPageUrl()` returning `/ai-landscape/vs/${slug}/` and `vsOgImageUrl()` returning `/open-graph/ai-landscape/vs/${slug}.png` |
| `src/lib/ai-landscape/__tests__/tours.test.ts` | Tour data validation tests | VERIFIED | 6 tests: entry count, id/title/description presence, minimum 5 steps, nodeId dataset validation, no duplicates, non-empty narratives -- all pass |
| `src/lib/ai-landscape/__tests__/comparisons.test.ts` | Comparison data validation tests | VERIFIED | 10 tests: entry count, concept slug dataset validation, alphabetical ordering, no duplicate slugs, non-empty question/summary, comparisonSlug ordering, vsPageUrl/vsOgImageUrl output -- all pass |

#### Plan 02 -- Tour UI

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ai-landscape/useTour.ts` | Tour state machine hook with start/next/prev/exit | VERIFIED | 2,536 bytes; exports `useTour` returning activeTour, currentStep, isActive, start, next, prev, exit, currentNodeId, narrative, highlightNodeIds; uses useState + useMemo + useCallback |
| `src/components/ai-landscape/TourSelector.tsx` | Tour picker showing 3 tour cards | VERIFIED | 1,317 bytes; maps TOURS to styled button cards showing title, description, step count; calls onStartTour on click |
| `src/components/ai-landscape/TourBar.tsx` | Progress bar with narrative, prev/next/exit controls | VERIFIED | 2,947 bytes; renders exit button, tour title, "Step X of Y" indicator, narrative text, disabled Prev on step 0, Next/Finish toggle on last step |
| `src/components/ai-landscape/InteractiveGraph.tsx` | Tour mode integration | VERIFIED | Imports useTour, TourSelector, TourBar; useEffect drives selectedNode/highlightedNodeIds/zoomToNode on step change; prevTourActive ref calls handleClosePanel on tour exit; keyboard override at top of handleGraphKeyDown; node clicks return early when tour.isActive; TourBar rendered conditionally above SVG; TourSelector shown only when !tour.isActive && !selectedNode && !compareMode |

#### Plan 03 -- VS Pages

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/pages/ai-landscape/vs/[slug].astro` | VS page template generating 12 static pages | VERIFIED | 11,664 bytes; getStaticPaths filters POPULAR_COMPARISONS against nodesMap; passes node1, node2, cluster data, ancestry chains, relationship groups as props; Layout wrapper with title/description/ogImage; FAQPage JSON-LD inline; two DefinedTermJsonLd + BreadcrumbJsonLd |
| `src/pages/open-graph/ai-landscape/vs/[slug].png.ts` | OG image endpoint for 12 VS pages | VERIFIED | 2,082 bytes; getStaticPaths uses same POPULAR_COMPARISONS filter; GET handler calls generateAiLandscapeVsOgImage with node1/node2 names and cluster dark colors; returns Response with image/png + immutable cache headers |
| `src/lib/og-image.ts (generateAiLandscapeVsOgImage)` | VS OG image function for split-layout images | VERIFIED | Function at line 3479; produces 1200x630 dark (#0a0a0f) image with cluster-gradient top accent bar, split left/right concept panels, "VS" center divider, site URL footer; uses satori + sharp pattern matching existing OgImage functions |

#### Plan 04 -- Compare Mode

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ai-landscape/ComparePanel.tsx` | Side-by-side comparison panel | VERIFIED | 7,836 bytes; exports ComparePanel; shared ELI5 toggle (Simple/Technical); two-column grid with ConceptColumn sub-component; ancestry breadcrumbs via buildAncestryChain; relationship groups via groupRelationshipsByType (capped 3 groups x 3 items); VS page link shown conditionally for curated pairs via POPULAR_COMPARISONS.some() lookup |
| `src/components/ai-landscape/InteractiveGraph.tsx` | Compare mode state and ComparePanel rendering | VERIFIED | compareMode and compareNode state added; Compare/Cancel Compare toggle button in toolbar; two-step selection flow with hint bar; ComparePanel replaces DetailPanel when both nodes selected (never simultaneous); Escape exits compare mode; tour.start exits compare; compare button disabled during tours; mobile BottomSheet support |

---

### Key Link Verification

#### Plan 01 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `tours.ts` | `nodes.json` | tour step nodeIds match node slugs | VERIFIED | All 26 step nodeIds validated by tours.test.ts; 16/16 tests pass including "all tour step nodeIds exist in the dataset" |
| `comparisons.ts` | `nodes.json` | comparison concept slugs match node slugs | VERIFIED | All 24 concept slug references (12 pairs x 2) validated by comparisons.test.ts |

#### Plan 02 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useTour.ts` | `tours.ts` | `import { Tour, TOURS } from '../../lib/ai-landscape/tours'` | VERIFIED | Line 2-3 of useTour.ts |
| `InteractiveGraph.tsx` | `useTour.ts` | `useTour` hook drives selectedNode, highlightedNodeIds, zoomToNode | VERIFIED | Line 89: `const tour = useTour()`; useEffect at line 213 drives all state from tour.currentNodeId; keyboard handler checks `tour.isActive` at line 332 |
| `InteractiveGraph.tsx` | `TourBar.tsx` | TourBar rendered conditionally when tour active | VERIFIED | Line 447-459: `{tour.isActive && tour.activeTour && (<div className="mb-3"><TourBar .../>)}` |
| `InteractiveGraph.tsx` | `TourSelector.tsx` | TourSelector rendered when idle | VERIFIED | Line 493-497: `{!tour.isActive && !selectedNode && !compareMode && (<div className="mb-3"><TourSelector onStartTour={tour.start} />)}` |

#### Plan 03 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `[slug].astro` | `comparisons.ts` | `import POPULAR_COMPARISONS` for getStaticPaths | VERIFIED | Line 11 of [slug].astro; POPULAR_COMPARISONS used in getStaticPaths filter and map |
| `[slug].astro` | `ancestry.ts` | buildAncestryChain for each concept | VERIFIED | Line 12 import; lines 53-54 call buildAncestryChain for both concepts |
| `[slug].png.ts` | `og-image.ts` | generateAiLandscapeVsOgImage for PNG generation | VERIFIED | Line 3 import; line 46-53: GET handler calls generateAiLandscapeVsOgImage and returns Response |

#### Plan 04 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ComparePanel.tsx` | `schema.ts` | groupRelationshipsByType for both concepts | VERIFIED | Line 3 import; lines 36-37 call groupRelationshipsByType for node1.id and node2.id |
| `ComparePanel.tsx` | `ancestry.ts` | buildAncestryChain for both concepts | VERIFIED | Line 4 import; lines 34-35 call buildAncestryChain for node1.slug and node2.slug |
| `InteractiveGraph.tsx` | `ComparePanel.tsx` | ComparePanel rendered in place of DetailPanel | VERIFIED | Lines 745-756 (desktop); lines 772-783 (mobile BottomSheet); mutually exclusive with DetailPanel via condition `!(compareMode && compareNode)` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `TourSelector.tsx` | `TOURS` | Static import from tours.ts | Yes -- 3 fully-populated tour objects | VERIFIED |
| `TourBar.tsx` | `tour`, `currentStep`, `narrative` | Props from InteractiveGraph via useTour | Yes -- narrative is activeTour.steps[currentStep].narrative | VERIFIED |
| `ComparePanel.tsx` | `ancestry1/2`, `groups1/2` | `buildAncestryChain` + `groupRelationshipsByType` computed from edges/nodeMap props | Yes -- same functions used by DetailPanel in production | VERIFIED |
| `[slug].astro` (VS pages) | `node1`, `node2`, `pair` | `getStaticPaths` from getCollection('aiLandscape') + POPULAR_COMPARISONS | Yes -- Astro content collection queries real content; 12 pairs all validated against nodesMap | VERIFIED |
| `[slug].png.ts` (VS OG images) | `node1`, `node2`, cluster colors | Props from getStaticPaths + graphData.clusters | Yes -- getCollection + nodesMap lookup; cluster colors from graph.json | VERIFIED |

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| 16 tour + comparison tests pass | `npx vitest run src/lib/ai-landscape/__tests__/tours.test.ts src/lib/ai-landscape/__tests__/comparisons.test.ts` | 16/16 tests pass in 140ms | PASS |
| Full test suite passes (no regressions) | `npx vitest run` | 1226/1236 tests pass; 10 failures in `committed-notebooks.test.ts` are pre-existing EDA kernel naming mismatch (pre-dates phase 108) | PASS (regressions: none from phase 108) |
| Commit history confirms all 6 phase deliverables | `git log --oneline` | 3ee911a (data layer), 5e4d63a (tests), 80f4af0 (tour UI), e8fa792 (InteractiveGraph tour), a66a2d3 (VS pages), a7abf63 (compare mode) | PASS |
| Tour title names match spec exactly | Grep for required titles in tours.ts | "The Big Picture", "How ChatGPT Works", "What is Agentic AI" all present at lines 16, 51, 98 | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NAV-03 | 108-01, 108-02 | At least 3 guided learning paths with curated node sequences | SATISFIED | 3 tours in TOURS array; minimum-5-steps test enforced per NAV-03; all nodeIds validated |
| NAV-04 | 108-02 | Tour UI shows progress, narrative, next/prev/exit controls; highlights current and adjacent tour nodes | SATISFIED | TourBar renders "Step X of Y", narrative text, Prev (disabled when first), Next/Finish; highlightNodeIds set contains current + prev + next step nodes |
| SEO-07 | 108-04 | Interactive compare mode: select two concepts, side-by-side panel with descriptions, relationships, ancestry | SATISFIED | ComparePanel renders two ConceptColumns with descriptions (ELI5 toggle), buildAncestryChain breadcrumbs, groupRelationshipsByType groups; VS page link shown for curated pairs |
| SEO-08 | 108-01, 108-03 | Dedicated VS pages at /ai-landscape/vs/[slug]/ with structured data and OG images | SATISFIED | 12 static pages generated; FAQPage + 2x DefinedTerm + BreadcrumbList JSON-LD; branded 1200x630 OG images from generateAiLandscapeVsOgImage |

---

### Anti-Patterns Found

No anti-patterns found in any phase 108 file. Scan results:
- No TODO/FIXME/HACK/PLACEHOLDER comments in any created file
- No empty implementations (return null, return {}, return [])
- No hardcoded stub returns in API routes
- No disconnected props at call sites (TourBar receives real narrative from useTour; ComparePanel receives real node data)
- All "initial state = []" values are overwritten by useTour/useMemo computed values before render

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | -- | -- | -- | -- |

---

### Human Verification Required

The following behaviors require manual testing against a running dev server, as they cannot be verified programmatically:

#### 1. Tour Animation and Graph Zoom

**Test:** Start "The Big Picture" tour and click Next 3 times
**Expected:** Graph animates (750ms transition) to center and zoom to each tour step node; node gets selection ring; adjacent tour step nodes remain at full opacity while others dim to 0.2
**Why human:** d3-zoom animation and SVG opacity requires visual inspection; cannot be asserted by file-system checks

#### 2. Keyboard Navigation During Tour

**Test:** Start any tour; press ArrowRight, ArrowLeft, Escape
**Expected:** ArrowRight advances one step (Next); ArrowLeft goes back (Prev); Escape exits tour and returns to normal graph interaction with all nodes at full opacity
**Why human:** Keyboard event dispatch and DOM state changes require browser environment

#### 3. Compare Mode Two-Step Selection Flow

**Test:** Click Compare button, click one node, then click a second different node
**Expected:** After first click -- hint bar shows "Click another node to compare with [node1 name]"; after second click -- ComparePanel opens with side-by-side columns, both node rings highlighted on graph, DetailPanel is absent
**Why human:** Two-click interaction sequence and conditional rendering require visual inspection

#### 4. VS Page Link from ComparePanel for Curated Pairs

**Test:** In compare mode, select "Deep Learning" and "Machine Learning" (a curated pair)
**Expected:** ComparePanel shows "View full comparison page" link at bottom; clicking it navigates to /ai-landscape/vs/deep-learning-vs-machine-learning/
**Why human:** Requires knowing which pairs are curated and verifying the link appears and navigates correctly

#### 5. VS Page JSON-LD Structured Data

**Test:** Visit /ai-landscape/vs/deep-learning-vs-machine-learning/ in browser; inspect page source
**Expected:** Page source contains FAQPage JSON-LD block, two DefinedTerm blocks, and BreadcrumbList block; OG image meta tag points to /open-graph/ai-landscape/vs/deep-learning-vs-machine-learning.png
**Why human:** Requires browser to render the Astro page and inspect source; OG image validity requires visual check

#### 6. Tour/Compare Mutual Exclusivity

**Test:** Activate compare mode, then start a tour; then exit tour and verify compare mode is off
**Expected:** Starting a tour dismisses compare state (compareMode=false, compareNode=null); after exiting the tour, compare mode remains off
**Why human:** State transition sequence requires interactive browser session

---

### Gaps Summary

No gaps. All 4 observable truths are verified. All 10 artifacts from the 4 plans exist, are substantive (no stubs), and are wired into the rendering tree. All 11 key links are confirmed present. 16 unit tests pass validating data integrity. No anti-patterns detected. 10 pre-existing test failures are in `committed-notebooks.test.ts` and predate phase 108 entirely (documented in plan 02, 03, and 04 summaries).

The phase goal is fully achieved: non-technical users can follow curated tours through the landscape, and curious users can compare concepts side by side.

---

_Verified: 2026-03-27T15:05:00Z_
_Verifier: Claude (gsd-verifier)_
