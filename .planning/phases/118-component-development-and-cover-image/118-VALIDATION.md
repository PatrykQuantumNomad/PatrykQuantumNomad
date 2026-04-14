# Phase 118: Component Development and Cover Image - Validation

**Created:** 2026-04-14
**Source:** 118-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

## Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | StatHighlight renders stat, label, source | build verification | `test -f src/components/blog/StatHighlight.astro && npx astro build` (type-checks + component compilation) | N/A -- Astro components verified via build |
| COMP-02 | TermDefinition renders term, pronunciation, slot | build verification | `test -f src/components/blog/TermDefinition.astro && npx astro build` | N/A -- Astro components verified via build |
| INTG-04 | Cover SVG exists at correct path with valid structure | smoke | `test -f public/images/dark-code-cover.svg && grep -q 'viewBox="0 0 1200 630"' public/images/dark-code-cover.svg && grep -q 'DARK CODE' public/images/dark-code-cover.svg` | N/A -- file existence check |

## Sampling Rate

- **Per task commit:** `npx astro build` (verifies components compile and SVG is accessible)
- **Per wave merge:** `npx vitest run && npx astro build`
- **Phase gate:** Full build green + visual inspection of components in dev server

## Wave 0 Gaps

None -- these are static Astro components and an SVG file. The existing build pipeline validates component compilation. No new test files are needed for this phase. Visual validation requires human inspection in the dev server.

## Structural Checks

### COMP-01: StatHighlight.astro

| Check | Command | Expected |
|-------|---------|----------|
| File exists | `test -f src/components/blog/StatHighlight.astro` | Exit 0 |
| Has not-prose | `grep -q 'not-prose' src/components/blog/StatHighlight.astro` | Exit 0 |
| Has Props interface | `grep -q 'interface Props' src/components/blog/StatHighlight.astro` | Exit 0 |
| No hardcoded hex in classes | `grep -c '#[0-9a-fA-F]\{3,6\}' src/components/blog/StatHighlight.astro` | 0 matches |
| No style block | `grep -c '<style' src/components/blog/StatHighlight.astro` | 0 matches |
| No script block | `grep -c '<script' src/components/blog/StatHighlight.astro` | 0 matches |

### COMP-02: TermDefinition.astro

| Check | Command | Expected |
|-------|---------|----------|
| File exists | `test -f src/components/blog/TermDefinition.astro` | Exit 0 |
| Has not-prose | `grep -q 'not-prose' src/components/blog/TermDefinition.astro` | Exit 0 |
| Has Props interface | `grep -q 'interface Props' src/components/blog/TermDefinition.astro` | Exit 0 |
| Uses h3 not h2 | `grep -q '<h3' src/components/blog/TermDefinition.astro` | Exit 0 |
| No hardcoded hex in classes | `grep -c '#[0-9a-fA-F]\{3,6\}' src/components/blog/TermDefinition.astro` | 0 matches |
| No style block | `grep -c '<style' src/components/blog/TermDefinition.astro` | 0 matches |
| No script block | `grep -c '<script' src/components/blog/TermDefinition.astro` | 0 matches |

### INTG-04: dark-code-cover.svg

| Check | Command | Expected |
|-------|---------|----------|
| File exists | `test -f public/images/dark-code-cover.svg` | Exit 0 |
| Correct viewBox | `grep -q 'viewBox="0 0 1200 630"' public/images/dark-code-cover.svg` | Exit 0 |
| Has title text | `grep -q 'DARK CODE' public/images/dark-code-cover.svg` | Exit 0 |
| Has attribution | `grep -q 'patrykgolabek.dev' public/images/dark-code-cover.svg` | Exit 0 |
| Valid XML | `xmllint --noout public/images/dark-code-cover.svg 2>&1` | Exit 0 |
