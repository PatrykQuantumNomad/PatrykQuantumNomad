---
phase: 23-rule-engine-scoring
plan: 02
subsystem: tools
tags: [dockerfile, linting, rules, security, efficiency, maintainability, reliability, best-practice, ast]

# Dependency graph
requires:
  - phase: 23-01
    provides: "LintRule interface, types, scorer, 15 Tier 1 rules, allRules registry, sample-dockerfile"
provides:
  - "39-rule Dockerfile analysis engine covering 5 categories across 3 tiers"
  - "Complete allRules registry with PG001-PG005 custom rules"
  - "Sample Dockerfile triggering all 5 categories for calibration"
affects: [24-results-display, 25-export-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PG-prefixed custom rules for Patryk-authored checks (PG001-PG005)"
    - "dockerfile-ast ENV/ARG property API for secret detection"
    - "Copy.getFromFlag() for multi-stage build analysis"
    - "Dockerfile-wide scan patterns (DL3009, DL4001, DL3057) flag once per file"

key-files:
  created:
    - "src/lib/tools/dockerfile-analyzer/rules/security/PG001-secrets-in-env.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/security/PG002-curl-pipe-shell.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/security/PG003-copy-sensitive-files.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3003-use-workdir.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3009-remove-apt-lists.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/efficiency/DL4006-set-pipefail.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3042-pip-no-cache-dir.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3019-use-apk-no-cache.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3045-copy-relative-workdir.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/maintainability/PG004-legacy-env-format.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/maintainability/DL4001-wget-or-curl.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3057-missing-healthcheck.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/reliability/DL3011-valid-port.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/reliability/DL3012-one-healthcheck.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/reliability/DL3024-unique-from-alias.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3027-no-apt-use-apt-get.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3013-pin-pip-versions.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3001-avoid-bash-commands.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3022-copy-from-alias.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3030-yum-y.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3033-pin-yum-versions.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3038-dnf-y.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3041-pin-dnf-versions.ts"
    - "src/lib/tools/dockerfile-analyzer/rules/best-practice/PG005-inconsistent-casing.ts"
  modified:
    - "src/lib/tools/dockerfile-analyzer/rules/index.ts"
    - "src/lib/tools/dockerfile-analyzer/sample-dockerfile.ts"

key-decisions:
  - "PG001 checks ENV property names against secret keywords AND values against known key patterns (OpenAI, GitHub, AWS, DB connection strings)"
  - "PG003 uses regex pattern list for 15 sensitive file patterns (SSH keys, certs, .env, credentials, .aws/, .ssh/)"
  - "DL3045 tracks WORKDIR per build stage using FROM boundaries, not globally"
  - "PG004 uses Property.getAssignmentOperator() === null to detect legacy ENV format"
  - "DL4001 and DL3057 flag once per Dockerfile (not per instruction)"
  - "DL3022 uses Copy.getFromFlag().getValue() to detect numeric stage references"
  - "PG005 determines majority convention (uppercase vs lowercase) then flags deviants"
  - "Added EXPOSE 99999 to sample Dockerfile to trigger DL3011 (reliability category)"

patterns-established:
  - "Dockerfile-wide scan pattern: accumulate state across instructions, flag once (DL3009, DL4001, DL3057)"
  - "Stage-aware rules: track FROM boundaries for per-stage checks (DL3045)"
  - "Property API rules: use getProperties()/getProperty() for ENV/ARG inspection (PG001, PG004)"
  - "Flag API rules: use getFromFlag() for COPY --from analysis (DL3022)"

requirements-completed: [RULE-02, RULE-03]

# Metrics
duration: 8min
completed: 2026-02-20
---

# Phase 23 Plan 02: Remaining Rules and Calibration Summary

**24 rules across 5 categories (PG001-PG005 custom + 19 DL rules) completing the 39-rule Dockerfile analysis engine with sample triggering all categories**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-20T19:04:08Z
- **Completed:** 2026-02-20T19:12:07Z
- **Tasks:** 2
- **Files modified:** 26

## Accomplishments
- Implemented 15 Tier 2 high-value rules (3 security, 5 efficiency, 2 maintainability, 3 reliability, 2 best-practice)
- Implemented 9 Tier 3 rules (2 maintainability, 7 best-practice) completing the full rule set
- 5 custom PG-prefixed rules: PG001 (secrets), PG002 (curl|bash), PG003 (sensitive files), PG004 (legacy ENV), PG005 (inconsistent casing)
- Updated sample Dockerfile with EXPOSE 99999 triggering all 5 categories
- 39 total rules registered in allRules: 10 security, 8 efficiency, 7 maintainability, 5 reliability, 9 best-practice
- Full build and TypeScript compilation pass clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement 15 Tier 2 high-value rules** - `4d0a1aa` (feat)
2. **Task 2: Implement 9 Tier 3 rules, update sample Dockerfile, verify calibration** - `89205c6` (feat)

## Files Created/Modified

### Created (24 rule files)
- `src/lib/tools/dockerfile-analyzer/rules/security/PG001-secrets-in-env.ts` - Secret detection in ENV/ARG via keyword and pattern matching
- `src/lib/tools/dockerfile-analyzer/rules/security/PG002-curl-pipe-shell.ts` - Curl/wget pipe to shell detection
- `src/lib/tools/dockerfile-analyzer/rules/security/PG003-copy-sensitive-files.ts` - COPY/ADD sensitive file detection (15 patterns)
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3003-use-workdir.ts` - cd in RUN detection, suggests WORKDIR
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3009-remove-apt-lists.ts` - apt-get install without list cleanup
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL4006-set-pipefail.ts` - Pipe without SHELL pipefail
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3042-pip-no-cache-dir.ts` - pip install without --no-cache-dir
- `src/lib/tools/dockerfile-analyzer/rules/efficiency/DL3019-use-apk-no-cache.ts` - apk add without --no-cache
- `src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3045-copy-relative-workdir.ts` - COPY relative dest without WORKDIR (stage-aware)
- `src/lib/tools/dockerfile-analyzer/rules/maintainability/PG004-legacy-env-format.ts` - Legacy space-separated ENV format
- `src/lib/tools/dockerfile-analyzer/rules/maintainability/DL4001-wget-or-curl.ts` - Both wget and curl used in same Dockerfile
- `src/lib/tools/dockerfile-analyzer/rules/maintainability/DL3057-missing-healthcheck.ts` - No HEALTHCHECK instruction
- `src/lib/tools/dockerfile-analyzer/rules/reliability/DL3011-valid-port.ts` - EXPOSE with invalid port (0-65535)
- `src/lib/tools/dockerfile-analyzer/rules/reliability/DL3012-one-healthcheck.ts` - Multiple HEALTHCHECK instructions
- `src/lib/tools/dockerfile-analyzer/rules/reliability/DL3024-unique-from-alias.ts` - Duplicate FROM aliases
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3027-no-apt-use-apt-get.ts` - apt vs apt-get detection
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3013-pin-pip-versions.ts` - Unpinned pip packages
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3001-avoid-bash-commands.ts` - Interactive/system commands in RUN
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3022-copy-from-alias.ts` - Numeric COPY --from reference
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3030-yum-y.ts` - yum install without -y
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3033-pin-yum-versions.ts` - Unpinned yum packages
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3038-dnf-y.ts` - dnf install without -y
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/DL3041-pin-dnf-versions.ts` - Unpinned dnf packages
- `src/lib/tools/dockerfile-analyzer/rules/best-practice/PG005-inconsistent-casing.ts` - Mixed instruction casing detection

### Modified (2 files)
- `src/lib/tools/dockerfile-analyzer/rules/index.ts` - Registry expanded from 15 to 39 rules
- `src/lib/tools/dockerfile-analyzer/sample-dockerfile.ts` - Added EXPOSE 99999 for reliability trigger

## Decisions Made
- PG001 checks both ENV and ARG instructions using Property API (getName/getValue)
- PG003 covers 15 sensitive file patterns including .env, SSH keys, certs, AWS/SSH dirs, npm/pypi config
- DL3045 is stage-aware: tracks WORKDIR per build stage using FROM boundaries
- PG004 uses Property.getAssignmentOperator() for clean legacy format detection
- DL4001 and DL3057 use "flag once per Dockerfile" pattern to avoid noise
- DL3022 uses typed Copy.getFromFlag() API instead of raw string parsing
- PG005 determines majority convention (uppercase/lowercase) before flagging outliers
- Added EXPOSE 99999 (not duplicate CMD) to sample for reliability category coverage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 39 rules ready for the results display phase (Phase 24)
- Sample Dockerfile verified to trigger all 5 categories
- Each rule includes expert explanation, severity, category, and before/after fix suggestion
- Rule registry (allRules) provides flat array for iteration by scorer and results panel

## Self-Check: PASSED

- All 24 rule files: FOUND
- Commit 4d0a1aa (Task 1): FOUND
- Commit 89205c6 (Task 2): FOUND
- allRules count: 39
- TypeScript compilation: Clean (only pre-existing open-graph errors)
- npm run build: Success (665 pages)

---
*Phase: 23-rule-engine-scoring*
*Completed: 2026-02-20*
