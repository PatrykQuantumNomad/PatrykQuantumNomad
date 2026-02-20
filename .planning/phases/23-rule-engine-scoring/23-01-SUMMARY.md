---
phase: 23-rule-engine-scoring
plan: 01
subsystem: analysis-engine
tags: [dockerfile-ast, lint-rules, scoring-algorithm, codemirror, nanostores]

# Dependency graph
requires:
  - phase: 22-editor-foundation-technology-validation
    provides: EditorPanel with analyzeRef pattern, CodeMirror with setDiagnostics, dockerfile-ast parser, nanostore atoms
provides:
  - LintRule interface and 15 Tier 1 rules across 4 categories
  - Rule engine (runRuleEngine) that iterates all rules and returns sorted violations
  - Scoring algorithm (computeScore) with category weights and diminishing returns
  - Rule registry with lookup helpers (getRuleById, getRuleSeverity, getRuleCategory)
  - End-to-end analysis pipeline wired into EditorPanel
affects: [23-02-PLAN, phase-24-results-panel, phase-25-content]

# Tech tracking
tech-stack:
  added: []
  patterns: [rule-per-file with LintRule interface, diminishing-returns scoring, analyzeRef pipeline]

key-files:
  created:
    - src/lib/tools/dockerfile-analyzer/engine.ts
    - src/lib/tools/dockerfile-analyzer/scorer.ts
    - src/lib/tools/dockerfile-analyzer/rules/index.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/DL3006-tag-version.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/DL3007-no-latest.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/DL3008-pin-apt-versions.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/DL3020-use-copy-not-add.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/DL3004-no-sudo.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/DL3002-no-root-user.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/DL3061-from-first.ts
    - src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3059-consolidate-runs.ts
    - src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3014-use-apt-y.ts
    - src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3015-no-install-recommends.ts
    - src/lib/tools/dockerfile-analyzer/rules/maintainability/DL4000-no-maintainer.ts
    - src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3025-use-json-cmd.ts
    - src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3000-absolute-workdir.ts
    - src/lib/tools/dockerfile-analyzer/rules/reliability/DL4003-multiple-cmd.ts
    - src/lib/tools/dockerfile-analyzer/rules/reliability/DL4004-multiple-entrypoint.ts
  modified:
    - src/lib/tools/dockerfile-analyzer/types.ts
    - src/components/tools/EditorPanel.tsx

key-decisions:
  - "LintRule.check() accepts Dockerfile AST + rawText, returns RuleViolation[] with 1-based line numbers"
  - "Diminishing returns formula: deduction = baseSeverityPoints / (1 + 0.3 * priorViolationsInCategory)"
  - "Category weights: Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%"
  - "DL3020 skips URLs and archives where ADD is valid; only flags plain file copies"
  - "DL3002 only flags explicit USER root in final stage, not absence of USER instruction"

patterns-established:
  - "One file per rule in category subdirectory, exports named LintRule object"
  - "Every rule has expert-voice explanation, fix with before/after code, and AST-based check function"
  - "Engine sorts violations by line then column; scorer uses diminishing returns per category"
  - "EditorPanel enriches raw violations with rule metadata before storing in nanostore"

requirements-completed: [RULE-01, RULE-04, RULE-05, RULE-06, RULE-07, SCORE-01, SCORE-02, SCORE-03, SCORE-04]

# Metrics
duration: 6min
completed: 2026-02-20
---

# Phase 23 Plan 01: Rule Engine Foundation Summary

**15 Tier 1 lint rules with AST-based detection, category-weighted scorer with diminishing returns, and end-to-end CodeMirror diagnostic pipeline**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-20T18:52:11Z
- **Completed:** 2026-02-20T18:58:21Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments

- Expanded types.ts with 10+ interfaces: LintRule, RuleViolation, RuleFix, ScoreResult, CategoryScore, ScoreDeduction, LintViolation, AnalysisResult
- Implemented 15 Tier 1 critical rules across 4 categories (Security 7, Efficiency 3, Maintainability 3, Reliability 2), each with expert explanations and before/after fix suggestions
- Built scoring algorithm with category weights and diminishing returns formula that prevents score clustering at extremes
- Wired full analysis pipeline into EditorPanel: user clicks Analyze -> dockerfile-ast parses -> 15 rules check -> scorer computes weighted score -> diagnostics appear in CodeMirror gutter -> AnalysisResult with score stored in nanostore
- Build and TypeScript compilation pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create expanded types, rule engine, scorer, and rule registry** - `1e0cbee` (feat)
2. **Task 2: Implement 15 Tier 1 critical rules across 4 categories** - `faac6db` (feat)
3. **Task 3: Wire engine into EditorPanel and verify end-to-end pipeline** - `bd1131d` (feat)

## Files Created/Modified

- `src/lib/tools/dockerfile-analyzer/types.ts` - Expanded type system with LintRule, RuleViolation, ScoreResult, LintViolation, AnalysisResult interfaces
- `src/lib/tools/dockerfile-analyzer/engine.ts` - Rule engine runner: iterates allRules, sorts violations by line/column
- `src/lib/tools/dockerfile-analyzer/scorer.ts` - Scoring algorithm with category weights, diminishing returns, letter grades A+ through F
- `src/lib/tools/dockerfile-analyzer/rules/index.ts` - Rule registry: allRules array, getRuleById, getRuleSeverity, getRuleCategory helpers
- `src/lib/tools/dockerfile-analyzer/rules/security/DL3006-tag-version.ts` - Warns on untagged FROM images (skips scratch and stage aliases)
- `src/lib/tools/dockerfile-analyzer/rules/security/DL3007-no-latest.ts` - Warns on :latest tag usage
- `src/lib/tools/dockerfile-analyzer/rules/security/DL3008-pin-apt-versions.ts` - Warns on unversioned apt-get packages
- `src/lib/tools/dockerfile-analyzer/rules/security/DL3020-use-copy-not-add.ts` - Errors on ADD for plain file copies (skips URLs/archives)
- `src/lib/tools/dockerfile-analyzer/rules/security/DL3004-no-sudo.ts` - Errors on sudo usage in RUN instructions
- `src/lib/tools/dockerfile-analyzer/rules/security/DL3002-no-root-user.ts` - Warns on explicit USER root in final stage
- `src/lib/tools/dockerfile-analyzer/rules/security/DL3061-from-first.ts` - Errors when first non-ARG instruction is not FROM
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3059-consolidate-runs.ts` - Info on consecutive RUN instructions
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3014-use-apt-y.ts` - Warns on apt-get install without -y
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3015-no-install-recommends.ts` - Info on missing --no-install-recommends
- `src/lib/tools/dockerfile-analyzer/rules/maintainability/DL4000-no-maintainer.ts` - Errors on deprecated MAINTAINER instruction
- `src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3025-use-json-cmd.ts` - Warns on shell form CMD/ENTRYPOINT
- `src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3000-absolute-workdir.ts` - Errors on relative WORKDIR paths
- `src/lib/tools/dockerfile-analyzer/rules/reliability/DL4003-multiple-cmd.ts` - Warns on multiple CMD in final stage
- `src/lib/tools/dockerfile-analyzer/rules/reliability/DL4004-multiple-entrypoint.ts` - Errors on multiple ENTRYPOINT in final stage
- `src/components/tools/EditorPanel.tsx` - Replaced placeholder pipeline with real rule engine + scorer + diagnostic dispatch

## Decisions Made

- **LintRule interface design:** check() takes Dockerfile AST + rawText, returns RuleViolation[] with 1-based line numbers (AST is 0-based, conversion done in rules)
- **Diminishing returns formula:** `deduction = baseSeverityPoints / (1 + 0.3 * priorViolationsInCategory)` prevents category scores from clustering at 0 for categories with many violations
- **DL3020 skip logic:** ADD is valid for URLs (http/https) and tar archives (.tar/.tgz/.tar.gz), only flags plain file copies
- **DL3002 conservative approach:** Only flags explicit `USER root` or `USER 0` in final stage; absence of USER instruction is not flagged (that is a separate concern)
- **DL3025 detection via getArgumentsContent():** Used string check for `[` prefix rather than JSONInstruction.getOpeningBracket() to avoid casting typed instruction objects

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Rule engine foundation is complete with 15 Tier 1 rules and full scoring pipeline
- Plan 23-02 can add Tier 2 and Tier 3 rules following the established one-file-per-rule pattern
- Phase 24 (results panel) has AnalysisResult with score, per-category breakdowns, and enriched violations ready for UI display
- The sample Dockerfile triggers violations across security, efficiency, and maintainability categories

## Self-Check: PASSED

All 21 files verified present. All 3 task commits verified in git log.

---
*Phase: 23-rule-engine-scoring*
*Completed: 2026-02-20*
