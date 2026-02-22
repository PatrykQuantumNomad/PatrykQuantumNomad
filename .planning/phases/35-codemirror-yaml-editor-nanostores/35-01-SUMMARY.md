---
phase: 35-codemirror-yaml-editor-nanostores
plan: 01
subsystem: ui
tags: [codemirror, yaml, nanostores, react-hooks, docker-compose, editor]

# Dependency graph
requires:
  - phase: 34-rule-engine-rules-scoring
    provides: ComposeAnalysisResult type, rule engine, scorer, all 52 rules
provides:
  - Nanostore atoms for compose validator cross-component state (composeResult, composeAnalyzing, composeEditorViewRef, composeResultsStale)
  - React hook useCodeMirrorYaml with YAML syntax highlighting, dark theme, Mod-Enter shortcut
  - Sample docker-compose.yml with deliberate violations across all 5 rule categories
affects: [35-02-codemirror-yaml-editor-nanostores, 36-compose-validator-ui]

# Tech tracking
tech-stack:
  added: ["@codemirror/lang-yaml"]
  patterns: [analyzeRef pattern for stale-closure-safe callbacks in keymap extensions]

key-files:
  created:
    - src/stores/composeValidatorStore.ts
    - src/lib/tools/compose-validator/use-codemirror-yaml.ts
    - src/lib/tools/compose-validator/sample-compose.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Reuse editor-theme.ts and highlight-line.ts from dockerfile-analyzer instead of duplicating"
  - "Use analyzeRef pattern (useRef + update outside useEffect) for stale-closure-safe Mod-Enter callback"
  - "Place keymap.of() before theme extensions for correct precedence in extension array"

patterns-established:
  - "analyzeRef pattern: hold mutable callback ref updated every render for keymap closures"
  - "Shared editor chrome: compose-validator imports from ../dockerfile-analyzer/ not local copies"

requirements-completed: [EDIT-01, EDIT-03, EDIT-04, EDIT-05, EDIT-08]

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 35 Plan 01: Nanostore Atoms, CodeMirror YAML Hook, and Sample Compose Summary

**Nanostore atoms for compose state, CodeMirror 6 YAML editor hook with Mod-Enter shortcut, and sample compose file triggering all 5 rule categories**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-22T21:15:18Z
- **Completed:** 2026-02-22T21:19:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created 4 nanostore atoms (composeResult, composeAnalyzing, composeEditorViewRef, composeResultsStale) matching the dockerfileAnalyzerStore pattern
- Built useCodeMirrorYaml hook with native YAML Lezer parser, dark theme reuse, Mod-Enter keyboard shortcut, lintGutter, stale-results detection, and View Transitions cleanup
- Authored sample docker-compose.yml with deliberate issues across all 5 rule categories (schema, semantic, security, best-practice, style) with inline rule ID comments

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @codemirror/lang-yaml and create nanostore + sample compose** - `c1838ac` (feat)
2. **Task 2: Create useCodeMirrorYaml hook** - `eb25f28` (feat)

## Files Created/Modified
- `src/stores/composeValidatorStore.ts` - 4 nanostore atoms for compose validator cross-component state
- `src/lib/tools/compose-validator/use-codemirror-yaml.ts` - React hook creating CodeMirror 6 EditorView with YAML lang, dark theme, Mod-Enter shortcut
- `src/lib/tools/compose-validator/sample-compose.ts` - Pre-loaded sample docker-compose.yml with deliberate issues across all 5 rule categories
- `package.json` - Added @codemirror/lang-yaml dependency
- `package-lock.json` - Updated lockfile with @codemirror/lang-yaml and @lezer/yaml

## Decisions Made
- **Reuse editor theme:** Imported editor-theme.ts and highlight-line.ts from `../dockerfile-analyzer/` rather than creating compose-validator copies. Avoids duplication, ensures visual consistency.
- **analyzeRef pattern:** Used `useRef` to hold onAnalyze callback, updated outside useEffect every render. This avoids stale closures in the keymap extension without needing to destroy/recreate the editor on callback changes.
- **keymap placement:** Placed `keymap.of()` before theme extensions in the extension array for correct precedence, ensuring Mod-Enter binds before any theme-level key handlers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect relative import paths for editor-theme and highlight-line**
- **Found during:** Task 2 (useCodeMirrorYaml hook creation)
- **Issue:** Plan specified `../../dockerfile-analyzer/editor-theme` but the correct relative path from `compose-validator/` to `dockerfile-analyzer/` is `../dockerfile-analyzer/` (both are siblings under `src/lib/tools/`)
- **Fix:** Changed import paths from `../../dockerfile-analyzer/` to `../dockerfile-analyzer/`
- **Files modified:** src/lib/tools/compose-validator/use-codemirror-yaml.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors in compose files
- **Committed in:** eb25f28 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor path correction required for TypeScript compilation. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `src/pages/open-graph/*.ts` files (Buffer type incompatibility) -- unrelated to this plan, not addressed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 foundation modules ready for Plan 35-02 (ComposeEditorPanel and ComposeResultsPanel UI components)
- composeValidatorStore atoms provide the state contract between editor and results panels
- useCodeMirrorYaml hook is ready to be mounted in ComposeEditorPanel
- SAMPLE_COMPOSE is ready to be loaded as initial editor content

## Self-Check: PASSED

All files verified present. All commit hashes verified in git log.

---
*Phase: 35-codemirror-yaml-editor-nanostores*
*Completed: 2026-02-22*
