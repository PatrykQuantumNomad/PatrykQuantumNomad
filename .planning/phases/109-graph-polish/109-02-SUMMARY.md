---
phase: 109-graph-polish
plan: 02
subsystem: ui
tags: [gsap, react, svg, edge-pulse, animation, a11y]

requires:
  - phase: 109-01
    provides: InteractiveGraph with cluster zoom, selectedNode state
  - phase: 105-interactive-graph-core
    provides: d3-zoom transform group, posMap, containerRef
provides:
  - useEdgePulse custom hook with GSAP strokeDashoffset animation
  - edge pulse overlay lines rendered in InteractiveGraph SVG
affects: [109-03]

tech-stack:
  added: ["@gsap/react"]
  patterns: [useGSAP automatic cleanup, strokeDashoffset traveling dash, prefers-reduced-motion guard]

key-files:
  created:
    - src/components/ai-landscape/useEdgePulse.ts
  modified:
    - src/components/ai-landscape/InteractiveGraph.tsx
    - package.json

key-decisions:
  - "useGSAP from @gsap/react handles cleanup automatically — no manual timeline teardown needed"
  - "Pulse radiates outward from selected node via directional strokeDashoffset animation"
  - "Pulse overlay lines rendered between edges layer and nodes layer for correct z-order"
  - "prefers-reduced-motion: reduce skips animation entirely (decorative, not navigational)"
  - "GSAP only animates strokeDashoffset/opacity — never positional properties (avoids d3-zoom transform conflict)"
  - "Pulse dash is 15% of edge length with power1.inOut easing for smooth visual flow"

patterns-established:
  - "useGSAP hook pattern: dependencies array + scope for automatic cleanup on React strict mode and unmount"
  - "Pulse overlay: separate <g> with pointerEvents=none inside transform group for pan/zoom tracking"

requirements-completed: [GRAPH-10]

duration: 5min
completed: 2026-03-27
---

# Phase 109 Plan 02: GSAP Edge Pulse Animation Summary

**GSAP-animated edge pulse with useEdgePulse hook, automatic cleanup, and reduced motion support**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Installed `@gsap/react` dependency for React-safe GSAP animation lifecycle management
- Created `useEdgePulse` custom hook that animates traveling dash pulses along edges connected to a selected node
- Integrated pulse overlay lines into InteractiveGraph SVG between edges and nodes layers for correct z-order
- Pulses radiate outward from the selected node with directional strokeDashoffset animation
- Animation respects `prefers-reduced-motion` media query (skipped entirely when enabled)
- Automatic cleanup via `useGSAP` on node deselection, node change, or component unmount

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @gsap/react and create useEdgePulse hook** - `c40f256` (feat)
2. **Task 2: Integrate edge pulse overlay into InteractiveGraph** - `5fc5d62` (feat)

## Files Created/Modified
- `src/components/ai-landscape/useEdgePulse.ts` - Custom hook with GSAP strokeDashoffset animation, reduced motion guard, directional pulse logic
- `src/components/ai-landscape/InteractiveGraph.tsx` - Import useEdgePulse, invoke hook, render pulse overlay `<g>` with `<line>` elements
- `package.json` - Added `@gsap/react` dependency

## Decisions Made
- useGSAP handles all cleanup automatically via dependencies array and scope — no manual gsap.killTweensOf() needed
- Pulse direction determined by edge source/target relationship to selected node — outward radiation from selected concept
- Overlay lines use `var(--color-accent)` stroke, strokeWidth 3, strokeLinecap round for premium visual quality
- Dash length is 15% of edge length with infinite repeat and 1.2s duration
- pointerEvents="none" on overlay group prevents pulse lines from intercepting clicks/hovers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Edge pulse animation in place; Plan 03 (mini-map) can proceed independently
- useGSAP pattern established for any future GSAP animations in the graph

---
*Phase: 109-graph-polish*
*Completed: 2026-03-27*
