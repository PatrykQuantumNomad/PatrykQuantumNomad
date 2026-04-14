---
phase: 119-content-authoring
plan: 02
subsystem: content
tags: [mdx, astro, blog-post, dark-code, framework, defense-strategies, cross-links]

requires:
  - phase: 119-content-authoring
    provides: dark-code.mdx with Act 1 (~1437 words), validated GFM footnotes, 8 footnote definitions
provides:
  - Act 2 with The Dark Code Spectrum 5-dimension framework table (~1084 words)
  - Act 3 with ownership, refactoring, and supply chain defense strategies (~964 words)
  - 7 new footnote definitions (sources #5, #45, #28, #46, #11, #9, #40)
  - Internal cross-links to kubernetes-manifest-best-practices and github-actions-best-practices
affects: [119-03-PLAN, 120-site-integration, 121-build-verification]

tech-stack:
  added: []
  patterns: [markdown-table-as-framework-artifact, internal-cross-link-in-prose]

key-files:
  created: []
  modified: [src/data/blog/dark-code.mdx]

key-decisions:
  - "Reused existing footnote numbers for sources already cited in Act 1 (e.g., [^2] for GitClear 2025, [^6] for Anthropic RCT) to avoid duplicate definitions"
  - "Placed Death by a Thousand Arrows cross-link in Act 2 (framework section) rather than Act 1 for better thematic alignment with compounding choices"

patterns-established:
  - "Framework table pattern: top-level markdown table with dimension name, description, indicator, and severity signal columns"
  - "Internal cross-link pattern: natural inline references woven into analytical prose, not 'see also' blocks"

requirements-completed: [CONT-02, CONT-04, CONT-07, CONT-08, INTG-07]

duration: 5min
completed: 2026-04-14
---

# Phase 119 Plan 02: Acts 2-3 Dark Code Spectrum Framework and Defense Strategies Summary

**Dark Code Spectrum 5-dimension framework table with interconnection analysis, plus 3-section defense argument with ownership, refactoring, and supply chain strategies and 3 internal cross-links**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-14T16:29:35Z
- **Completed:** 2026-04-14T16:35:02Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Wrote Act 2 (~1084 words) with the Dark Code Spectrum framework table containing 5 named dimensions (Clone Density, Ownership Vacuum, Comprehension Decay, Refactoring Deficit, Vulnerability Surface) with descriptions, indicators, and empirically-sourced severity signals
- Wrote Act 3 (~964 words) with 3 defense sections: ownership as first-line defense, deliberate refactoring vs AI quick-fixes, and supply chain as external dark code
- Woven 3 internal cross-links naturally into prose: Death by a Thousand Arrows (Act 2), Kubernetes Manifest Best Practices (Act 3.1), GitHub Actions Best Practices (Act 3.2)
- Added 7 new footnote definitions for sources #5, #45, #28, #46, #11, #9, #40 -- all URLs copy-pasted from sources.md
- Cumulative essay word count: ~3574 words (Acts 1+2+3), on track for ~4500 total after Act 4

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Act 2 -- The Dark Code Spectrum framework** - `7d01ad2` (feat)
2. **Task 2: Write Act 3 -- Defense strategies with cross-links** - `ccd522a` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/data/blog/dark-code.mdx` - Added Act 2 (2 sections: framework table + feedback loop) and Act 3 (3 sections: ownership, refactoring, supply chain) with 15 total footnote definitions

## Decisions Made
- **Footnote reuse strategy:** Reused existing footnote numbers for sources already defined in Act 1 (e.g., [^2] for GitClear 2025, [^3] for Empirical Analysis, [^5] for Mondoo, [^6] for Anthropic RCT) rather than creating duplicate definitions. New footnotes [^9]-[^15] assigned to new sources only.
- **Cross-link placement:** Death by a Thousand Arrows placed in Act 2 Section 2.1 (discussing how small choices compound into systemic problems at the framework level) rather than Act 1 as originally suggested in the outline. The thematic alignment is stronger in the framework context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - both tasks executed cleanly, builds passed on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- dark-code.mdx is ready for Act 4 (closing argument, ~800 words) in Plan 119-03
- 15 footnote definitions at end of file provide the pattern for any additional citations in Act 4
- All internal cross-links for Acts 2-3 are complete; Act 4 may include Claude Code Guide cross-link
- Cumulative word count (~3574) leaves room for Act 4's ~800 word budget to reach the ~4500 target

## Self-Check: PASSED

- [x] src/data/blog/dark-code.mdx exists
- [x] 119-02-SUMMARY.md exists
- [x] Commit 7d01ad2 found (Task 1)
- [x] Commit ccd522a found (Task 2)

---
*Phase: 119-content-authoring*
*Completed: 2026-04-14*
