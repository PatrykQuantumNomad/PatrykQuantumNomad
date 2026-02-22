---
phase: 34-rule-engine-rules-scoring
plan: 02
subsystem: compose-validator
tags: [docker-compose, security, best-practice, linting, yaml-ast, cwe]

# Dependency graph
requires:
  - phase: 33-yaml-parsing-schema-validation-foundation
    provides: "ComposeLintRule interface, ComposeRuleContext type, getNodeLine helper, parseComposeYaml parser"
  - phase: 34-rule-engine-rules-scoring plan 01
    provides: "port-parser.ts with parsePortString for CV-C009"
provides:
  - "14 security rules (CV-C001 through CV-C014) detecting container isolation failures and missing hardening"
  - "12 best practice rules (CV-B001 through CV-B012) detecting common misconfigurations"
  - "securityRules registry array (security/index.ts)"
  - "bestPracticeRules registry array (best-practice/index.ts)"
affects: [34-rule-engine-rules-scoring plan 03, 35-compose-ui-integration, 36-graph-visualization]

# Tech tracking
tech-stack:
  added: []
  patterns: [per-service AST traversal with isMap/isPair/isScalar guards, findServiceNameNode helper for service-level reporting, suffix-based regex for secret detection, duration string parser for healthcheck comparison, top-level doc.contents traversal for file-level rules]

key-files:
  created:
    - src/lib/tools/compose-validator/rules/security/CV-C001-privileged-mode.ts
    - src/lib/tools/compose-validator/rules/security/CV-C002-docker-socket-mount.ts
    - src/lib/tools/compose-validator/rules/security/CV-C003-host-network-mode.ts
    - src/lib/tools/compose-validator/rules/security/CV-C004-host-pid-mode.ts
    - src/lib/tools/compose-validator/rules/security/CV-C005-host-ipc-mode.ts
    - src/lib/tools/compose-validator/rules/security/CV-C006-dangerous-capabilities.ts
    - src/lib/tools/compose-validator/rules/security/CV-C007-default-capabilities-not-dropped.ts
    - src/lib/tools/compose-validator/rules/security/CV-C008-secrets-in-environment.ts
    - src/lib/tools/compose-validator/rules/security/CV-C009-unbound-port-interface.ts
    - src/lib/tools/compose-validator/rules/security/CV-C010-missing-no-new-privileges.ts
    - src/lib/tools/compose-validator/rules/security/CV-C011-writable-filesystem.ts
    - src/lib/tools/compose-validator/rules/security/CV-C012-seccomp-disabled.ts
    - src/lib/tools/compose-validator/rules/security/CV-C013-selinux-disabled.ts
    - src/lib/tools/compose-validator/rules/security/CV-C014-image-latest-no-tag.ts
    - src/lib/tools/compose-validator/rules/security/index.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B001-missing-healthcheck.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B002-no-restart-policy.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B003-no-resource-limits.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B004-image-tag-not-pinned.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B005-no-logging-config.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B006-deprecated-version-field.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B007-missing-project-name.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B008-build-and-image.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B009-anonymous-volume.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B010-no-memory-reservation.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B011-healthcheck-timeout-exceeds-interval.ts
    - src/lib/tools/compose-validator/rules/best-practice/CV-B012-default-network-only.ts
    - src/lib/tools/compose-validator/rules/best-practice/index.ts
  modified: []

key-decisions:
  - "CV-C014 handles registry URLs with port numbers by checking if text after last colon contains slash (registry port vs tag)"
  - "CV-B004 skips 'latest' tag since CV-C014 already covers it, avoiding duplicate violations"
  - "CV-B009 only flags single-path absolute paths (anonymous volumes), not bind mounts or named volumes"
  - "CV-B012 checks for network_mode:host across all services before firing, returns early if any service uses host networking"
  - "SEC-08 uses suffix-based regex anchored with $ and word boundary to avoid false positives on names like PASSWORD_MIN_LENGTH"

patterns-established:
  - "findServiceNameNode helper: traverses doc.contents -> services -> serviceName to get the AST key node for service-level reporting"
  - "per-service iteration pattern: for (const [serviceName, serviceNode] of ctx.services) with isMap guard"
  - "top-level key check pattern: traverse ctx.doc.contents.items for file-level rules (BP-06, BP-07, BP-12)"
  - "dual-syntax handling: isScalar for short string syntax, isMap for long object syntax (volumes, ports, environment)"
  - "parseDuration helper in BP-11: regex-based Docker duration parser supporting ns/us/ms/s/m/h units"

requirements-completed: [SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10, SEC-11, SEC-12, SEC-13, SEC-14, BP-01, BP-02, BP-03, BP-04, BP-05, BP-06, BP-07, BP-08, BP-09, BP-10, BP-11, BP-12]

# Metrics
duration: 7min
completed: 2026-02-22
---

# Phase 34 Plan 02: Security & Best Practice Rules Summary

**14 security rules (CV-C001-C014) and 12 best practice rules (CV-B001-B012) with CWE references, suffix-based secret detection, duration parsing, and dual-syntax volume/port handling**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-22T19:05:10Z
- **Completed:** 2026-02-22T19:12:00Z
- **Tasks:** 2
- **Files created:** 28

## Accomplishments
- 14 security rules covering privileged mode, Docker socket mounts, host namespace modes, dangerous capabilities, secrets in env vars, unbound ports, missing hardening (no-new-privileges, read-only FS, seccomp/SELinux), and untagged images
- 12 best practice rules covering missing healthchecks, restart policies, resource limits, logging config, deprecated version field, missing project name, build+image ambiguity, anonymous volumes, memory reservation, healthcheck timeout/interval comparison, and default-network-only detection
- CWE-250 references in CV-C001, CV-C002, and CV-C006 violation messages
- Suffix-based secret detection regex in CV-C008 avoids false positives on names like PASSWORD_MIN_LENGTH or TOKEN_EXPIRY
- CV-C009 handles both short-syntax (via parsePortString from port-parser.ts) and long-syntax port objects
- CV-B011 includes inline duration parser for comparing healthcheck timeout vs interval as millisecond values

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 14 security rules and security/index.ts registry** - `5f66d08` (feat)
2. **Task 2: Create 12 best practice rules and best-practice/index.ts registry** - `d9060da` (feat)

## Files Created/Modified
- `src/lib/tools/compose-validator/rules/security/CV-C001-privileged-mode.ts` - Detects privileged: true (CWE-250)
- `src/lib/tools/compose-validator/rules/security/CV-C002-docker-socket-mount.ts` - Detects Docker socket volume mounts (short + long syntax)
- `src/lib/tools/compose-validator/rules/security/CV-C003-host-network-mode.ts` - Detects network_mode: host
- `src/lib/tools/compose-validator/rules/security/CV-C004-host-pid-mode.ts` - Detects pid: host
- `src/lib/tools/compose-validator/rules/security/CV-C005-host-ipc-mode.ts` - Detects ipc: host
- `src/lib/tools/compose-validator/rules/security/CV-C006-dangerous-capabilities.ts` - Detects dangerous cap_add entries (CWE-250)
- `src/lib/tools/compose-validator/rules/security/CV-C007-default-capabilities-not-dropped.ts` - Detects missing cap_drop: [ALL]
- `src/lib/tools/compose-validator/rules/security/CV-C008-secrets-in-environment.ts` - Suffix-based secret detection in env vars
- `src/lib/tools/compose-validator/rules/security/CV-C009-unbound-port-interface.ts` - Detects ports bound to 0.0.0.0
- `src/lib/tools/compose-validator/rules/security/CV-C010-missing-no-new-privileges.ts` - Detects missing no-new-privileges
- `src/lib/tools/compose-validator/rules/security/CV-C011-writable-filesystem.ts` - Detects missing read_only: true
- `src/lib/tools/compose-validator/rules/security/CV-C012-seccomp-disabled.ts` - Detects seccomp:unconfined
- `src/lib/tools/compose-validator/rules/security/CV-C013-selinux-disabled.ts` - Detects label:disable
- `src/lib/tools/compose-validator/rules/security/CV-C014-image-latest-no-tag.ts` - Detects missing/latest image tags
- `src/lib/tools/compose-validator/rules/security/index.ts` - Exports securityRules array (14 rules)
- `src/lib/tools/compose-validator/rules/best-practice/CV-B001-missing-healthcheck.ts` - Detects missing healthcheck
- `src/lib/tools/compose-validator/rules/best-practice/CV-B002-no-restart-policy.ts` - Detects missing restart policy
- `src/lib/tools/compose-validator/rules/best-practice/CV-B003-no-resource-limits.ts` - Detects missing deploy.resources.limits
- `src/lib/tools/compose-validator/rules/best-practice/CV-B004-image-tag-not-pinned.ts` - Detects mutable tags (stable, edge, etc.)
- `src/lib/tools/compose-validator/rules/best-practice/CV-B005-no-logging-config.ts` - Detects missing logging configuration
- `src/lib/tools/compose-validator/rules/best-practice/CV-B006-deprecated-version-field.ts` - Detects top-level version field
- `src/lib/tools/compose-validator/rules/best-practice/CV-B007-missing-project-name.ts` - Detects missing top-level name field
- `src/lib/tools/compose-validator/rules/best-practice/CV-B008-build-and-image.ts` - Detects build + image ambiguity
- `src/lib/tools/compose-validator/rules/best-practice/CV-B009-anonymous-volume.ts` - Detects anonymous volumes (short + long syntax)
- `src/lib/tools/compose-validator/rules/best-practice/CV-B010-no-memory-reservation.ts` - Detects limits without reservations
- `src/lib/tools/compose-validator/rules/best-practice/CV-B011-healthcheck-timeout-exceeds-interval.ts` - Duration-aware timeout comparison
- `src/lib/tools/compose-validator/rules/best-practice/CV-B012-default-network-only.ts` - Detects default-only networking
- `src/lib/tools/compose-validator/rules/best-practice/index.ts` - Exports bestPracticeRules array (12 rules)

## Decisions Made
- CV-C014 handles registry URLs with port numbers (e.g., registry.example.com:5000/repo:latest) by checking if text after last colon contains a slash, distinguishing registry ports from image tags
- CV-B004 explicitly skips the "latest" tag since CV-C014 already handles it, preventing duplicate violations for the same image
- CV-B009 only flags truly anonymous volumes (single absolute path starting with /) -- bind mounts (./path or /host:/container) and named volumes (name:/path) are not flagged
- CV-B012 returns early without violations if any service uses network_mode: host, since host networking bypasses Docker networking entirely
- CV-C008 uses a suffix-anchored regex pattern (/(?:_|^)(PASSWORD|...)$/i) to match only environment variable names that end with secret keywords, avoiding false positives on configuration variables

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Security (14) and best practice (12) rule registries ready for integration into the rule engine (Plan 03)
- securityRules and bestPracticeRules arrays can be combined with semantic and style rules in the master rules/index.ts
- All rules conform to the ComposeLintRule interface with check(ctx) methods returning ComposeRuleViolation[]
- Scoring engine (Plan 03) can look up rule metadata (severity, category) from these registries

## Self-Check: PASSED

- All 28 created files verified present on disk
- Commit 5f66d08 (security rules) verified in git log
- Commit d9060da (best practice rules) verified in git log
- Astro build succeeds with 0 TypeScript errors

---
*Phase: 34-rule-engine-rules-scoring*
*Completed: 2026-02-22*
