---
phase: quick-012
plan: 01
subsystem: infra
tags: [npm, security, snyk, dependencies, lodash, svgo]

# Dependency graph
requires: []
provides:
  - Clean npm audit with 0 vulnerabilities
  - Updated dependency tree free of lodash prototype pollution
  - svgo upgraded to 4.0.1 (Billion Laughs DoS fix)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "npm overrides for transitive dependency pinning"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used npm overrides for volar-service-yaml@0.0.70 instead of relying solely on @astrojs/check upgrade, because @astrojs/language-server@2.16.3 pins volar-service-yaml at 0.0.68"

patterns-established:
  - "npm overrides: use overrides field in package.json to force transitive dependency versions when upstream pins vulnerable versions"

requirements-completed: [SEC-FIX-01]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Quick Task 012: Fix Snyk Security Scan Vulnerabilities Summary

**Resolved 6 npm audit vulnerabilities (1 high svgo DoS, 5 moderate lodash prototype pollution) via @astrojs/check upgrade and npm overrides for volar-service-yaml**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T12:09:06Z
- **Completed:** 2026-03-06T12:11:13Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Eliminated all 6 npm audit vulnerabilities (1 high, 5 moderate)
- Upgraded @astrojs/check from ^0.9.2 to ^0.9.6
- Added npm override for volar-service-yaml@0.0.70 which pulls yaml-language-server@1.20.0 (no lodash dependency)
- svgo upgraded from 4.0.0 to 4.0.1 via npm audit fix (fixes Billion Laughs DoS attack vector)
- Full project build verified (1062 pages built successfully)

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade @astrojs/check and run npm audit fix** - `0097335` (fix)

**Plan metadata:** [pending] (docs: complete quick-012 plan)

## Files Created/Modified
- `package.json` - Updated @astrojs/check to ^0.9.6, added overrides for volar-service-yaml@0.0.70
- `package-lock.json` - Resolved dependency tree with 0 vulnerabilities

## Decisions Made
- **Used npm overrides instead of relying solely on version bump:** The plan assumed @astrojs/check@0.9.6 would pull volar-service-yaml@0.0.70, but @astrojs/language-server@2.16.3 pins volar-service-yaml at exactly 0.0.68. The override forces 0.0.70 which depends on yaml-language-server@~1.20.0 (no lodash).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added npm overrides for volar-service-yaml**
- **Found during:** Task 1 (after @astrojs/check upgrade)
- **Issue:** @astrojs/language-server@2.16.3 pins volar-service-yaml at exactly 0.0.68, not a range. Simply upgrading @astrojs/check to ^0.9.6 did not resolve the lodash chain as the plan expected.
- **Fix:** Added `"overrides": { "volar-service-yaml": "0.0.70" }` to package.json. Version 0.0.70 depends on yaml-language-server@~1.20.0 which dropped lodash entirely.
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm audit` reports 0 vulnerabilities, `npm ls lodash` shows empty tree
- **Committed in:** 0097335 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Override was necessary because the upstream dependency pin prevented the planned approach from working. No scope creep -- same end result (0 vulnerabilities) achieved through a more targeted mechanism.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Verification Results
- `npm audit`: found 0 vulnerabilities
- `npm ls lodash`: empty (completely removed from tree)
- `npm ls svgo`: svgo@4.0.1 (upgraded from 4.0.0)
- `npm run build`: 1062 pages built successfully in 32.62s

---
*Quick Task: 012-fix-snyk-security-scan*
*Completed: 2026-03-06*
