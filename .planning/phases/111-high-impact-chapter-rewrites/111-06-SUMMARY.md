---
phase: 111-high-impact-chapter-rewrites
plan: "06"
subsystem: guide-metadata
tags: [guide.json, descriptions, deprecation-sweep, cross-chapter-validation]
dependency_graph:
  requires: ["111-01", "111-02", "111-03", "111-04", "111-05"]
  provides: [updated-guide-json-descriptions, deprecation-clean-chapters]
  affects: [guide-landing-page, og-images, structured-data]
tech_stack:
  added: []
  patterns: [json-metadata-sync, cross-chapter-validation]
key_files:
  created: []
  modified:
    - src/data/guides/claude-code/guide.json
key_decisions:
  - Ch7 and Ch8 guide.json descriptions already updated by 111-03 and 111-04 agents; only Ch3, Ch4, Ch11 needed updates
  - Deprecation sweep found zero issues across all 5 chapters; no fixes required
duration: 3m
completed: 2026-04-12
---

# Phase 111 Plan 06: guide.json Updates and Deprecation Sweep Summary

Updated guide.json chapter descriptions for Ch3, Ch4, and Ch11 to reflect rewritten content (6 permission modes, Auto Mode, managed-settings.d/, Bash hardening), then verified all 5 rewritten chapters are free of deprecated terms and broken cross-references.

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~3 minutes |
| Tasks | 2/2 |
| Files modified | 1 |
| Deprecated terms found | 0 |
| Broken cross-references | 0 |

## Accomplishments

- Updated Ch3 (models-and-costs) guide.json description to mention 6 permission modes, Auto Mode, /effort command, and 1M extended context
- Updated Ch4 (environment) guide.json description to mention managed-settings.d/ policy fragments, --bare mode, and flicker-free rendering
- Updated Ch11 (security) guide.json description to mention Auto Mode governance, 6 permission modes, managed-settings.d/ policies, and Bash hardening
- Confirmed Ch7 and Ch8 descriptions were already updated by wave 1 agents (111-03, 111-04)
- Validated guide.json as valid JSON with all 11 chapter entries intact
- Performed cross-chapter deprecation sweep across all 5 rewritten .mdx files with zero findings:
  - /tag command: not found
  - /vim command: not found
  - ANTHROPIC_SMALL_FAST_MODEL: not found
  - Old hook decision/reason top-level fields: not found
  - "18 lifecycle events" references: not found
  - "5 permission modes" references: not found
  - Thinking summaries as default: not found
  - Forward hyperlinks to non-existent chapters (plugins, agent-sdk, computer-use): not found
- Verified all cross-references between chapters use valid slugs
- Confirmed event count (26) and permission mode count (6/six) are consistent across all chapters

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update guide.json chapter descriptions | bb3b800 | src/data/guides/claude-code/guide.json |
| 2 | Cross-chapter deprecation sweep | (no changes needed) | (verified 5 .mdx files, all clean) |

## Files Created/Modified

### Modified
- `src/data/guides/claude-code/guide.json` -- Updated descriptions for Ch3, Ch4, Ch11

### Verified (no changes needed)
- `src/data/guides/claude-code/pages/models-and-costs.mdx`
- `src/data/guides/claude-code/pages/environment.mdx`
- `src/data/guides/claude-code/pages/custom-skills.mdx`
- `src/data/guides/claude-code/pages/hooks.mdx`
- `src/data/guides/claude-code/pages/security.mdx`

## Decisions Made

1. Ch7 and Ch8 descriptions were already correctly updated by 111-03 and 111-04 wave 1 agents, so only Ch3, Ch4, and Ch11 needed guide.json description changes
2. Deprecation sweep confirmed all 5 chapters are clean with zero fixes needed -- wave 1 agents did thorough work

## Deviations from Plan

None - plan executed exactly as written.

## Follow-up Items (Out of Scope)

- Update permission-flow-data.ts and permission-model.ts SVG for "auto" mode (flagged by 111-01 agent, not in scope for 111-06)

## Phase 111 Completion

This is the final plan (6 of 6) in Phase 111: High-Impact Chapter Rewrites. All plans are now complete:

| Plan | Name | Status |
|------|------|--------|
| 111-01 | Ch3 Models & Costs rewrite | Complete |
| 111-02 | Ch4 Environment rewrite | Complete |
| 111-03 | Ch7 Skills rewrite | Complete |
| 111-04 | Ch8 Hooks rewrite | Complete |
| 111-05 | Ch11 Security rewrite | Complete |
| 111-06 | guide.json updates + deprecation sweep | Complete |

Phase 111 success criteria met:
1. Ch3 documents 1M Opus context, restructured effort levels, /effort command, and 6 permission modes including Auto Mode
2. Ch4 documents managed-settings.d/ directory, --bare flag, NO_FLICKER, and new env vars
3. Ch7 documents paths frontmatter, lifecycle/compaction behavior, and Plugins relationship
4. Ch8 documents all 26 hook events, conditional if field, PermissionDenied event, and defer behavior
5. Ch11 documents Auto Mode governance, all 6 permission modes, Bash hardening, and protected paths
6. All guide.json descriptions synced and all chapters verified deprecation-free

## Next Phase Readiness

Phase 112 (New Chapters) can proceed. All cross-references from new chapters to updated Ch7/Ch8/Ch11 content will resolve correctly.
