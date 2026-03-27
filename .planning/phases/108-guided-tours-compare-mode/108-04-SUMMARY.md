---
phase: 108-guided-tours-compare-mode
plan: 04
status: complete
started: 2026-03-27T14:50:00.000Z
completed: 2026-03-27T15:05:00.000Z
duration: ~15min
tasks_completed: 2
tasks_total: 2
---

# Plan 108-04: Compare Mode

## What Was Built

Interactive compare mode for the AI landscape graph — users select two concepts for side-by-side comparison with descriptions, ancestry paths, relationships, and cluster color accents.

## Key Files

### Created
- `src/components/ai-landscape/ComparePanel.tsx` — Side-by-side comparison panel with shared ELI5 toggle, cluster accents, ancestry breadcrumbs, grouped relationships (max 3 groups x 3 items), and VS page link for curated pairs

### Modified
- `src/components/ai-landscape/InteractiveGraph.tsx` — Compare mode state (compareMode, compareNode), compare toggle button in toolbar, two-step selection flow, ComparePanel replaces DetailPanel when active, Escape exits compare, mutual exclusivity with tour mode, mobile BottomSheet support

## Decisions

- [Phase 108]: Compare mode is ephemeral (no URL state) — only VS pages get permanent URLs
- [Phase 108]: ComparePanel replaces DetailPanel when both comparison nodes selected (never simultaneous)
- [Phase 108]: Tour and compare modes are mutually exclusive — starting one exits the other
- [Phase 108]: Compare button disabled during active tours for clarity

## Deviations

None.

## Self-Check

- [x] ComparePanel renders side-by-side descriptions, ancestry, relationships
- [x] Compare toggle button works in toolbar
- [x] Two-step selection: first node → hint → second node → panel opens
- [x] Both compared nodes highlighted on graph
- [x] Escape exits compare mode cleanly
- [x] Tour/compare mutual exclusivity enforced
- [x] Mobile layout via BottomSheet
- [x] VS page link shown for curated pairs
- [x] `npx astro build` succeeds
- [x] `npx vitest run` — 46/47 pass (1 pre-existing notebook failure)
- [x] Human visual checkpoint: **APPROVED**

## Self-Check: PASSED
