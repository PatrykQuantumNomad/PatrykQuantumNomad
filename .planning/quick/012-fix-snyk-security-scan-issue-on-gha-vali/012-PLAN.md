---
phase: quick-012
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
autonomous: true
requirements: [SEC-FIX-01]
must_haves:
  truths:
    - "npm audit reports 0 high-severity vulnerabilities"
    - "npm audit reports 0 moderate-severity vulnerabilities (lodash resolved)"
    - "Project builds successfully after dependency updates"
  artifacts:
    - path: "package.json"
      provides: "Updated @astrojs/check dependency"
      contains: "@astrojs/check"
    - path: "package-lock.json"
      provides: "Resolved dependency tree with no vulnerable packages"
  key_links:
    - from: "package.json"
      to: "package-lock.json"
      via: "npm install resolution"
      pattern: "svgo.*4\\.0\\.[1-9]|yaml-language-server.*1\\.20"
---

<objective>
Fix npm dependency security vulnerabilities flagged by Snyk/skills.sh scan on the GHA Validator skill's parent project.

Purpose: Resolve 5 known vulnerabilities (1 high, 4 moderate) in npm dependency tree to pass Snyk security scanning.
Output: Clean npm audit with updated package.json and package-lock.json.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@package.json

Two vulnerability chains found by `npm audit`:

1. **HIGH - svgo 4.0.0** (GHSA-xpqw-6gx7-v673): DoS through entity expansion in DOCTYPE (Billion Laughs attack).
   Chain: `astro -> svgo@4.0.0`
   Fix: `npm audit fix` upgrades svgo 4.0.0 -> 4.0.1 and sax 1.4.4 -> 1.5.0

2. **MODERATE (x4) - lodash 4.17.21** (GHSA-xxjr-mmjv-4gpg): Prototype Pollution in `_.unset` and `_.omit`.
   Chain: `@astrojs/check@0.9.2 -> @astrojs/language-server -> volar-service-yaml@0.0.68 -> yaml-language-server@1.19.2 -> lodash@4.17.21`
   Fix: Upgrade `@astrojs/check` from ^0.9.2 to ^0.9.6. This pulls volar-service-yaml@0.0.70 which depends on yaml-language-server@~1.20.0, which dropped the lodash dependency entirely.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Upgrade @astrojs/check and run npm audit fix</name>
  <files>package.json, package-lock.json</files>
  <action>
    Step 1: Update @astrojs/check version in package.json from "^0.9.2" to "^0.9.6" to resolve the lodash prototype pollution vulnerability chain. The newer version pulls volar-service-yaml@0.0.70 -> yaml-language-server@1.20.0 which dropped the lodash dependency entirely.

    Step 2: Run `npm install` to update the lock file with the new @astrojs/check version.

    Step 3: Run `npm audit fix` to upgrade svgo from 4.0.0 to 4.0.1 (fixes the high-severity Billion Laughs DoS via GHSA-xpqw-6gx7-v673) and sax from 1.4.4 to 1.5.0.

    Step 4: Run `npm audit` to confirm 0 vulnerabilities remain.

    Step 5: Run `npm run build` to verify the project still builds correctly with the updated dependencies.

    IMPORTANT: Do NOT use `npm audit fix --force` as it can introduce breaking major version changes. The standard `npm audit fix` is sufficient here.
  </action>
  <verify>
    <automated>cd /Users/patrykattc/work/git/PatrykQuantumNomad && npm audit 2>&1 | grep -E "^(found |0 vulnerabilities)" && npm run build</automated>
  </verify>
  <done>npm audit reports 0 vulnerabilities. Project builds without errors. package.json shows @astrojs/check at ^0.9.6. package-lock.json reflects svgo >=4.0.1 and no lodash in the dependency tree.</done>
</task>

</tasks>

<verification>
- `npm audit` exits with code 0 (no vulnerabilities)
- `npm run build` completes successfully
- `npm ls lodash` shows no results or shows lodash is gone from the tree
- `npm ls svgo` shows version >= 4.0.1
</verification>

<success_criteria>
- Zero npm audit vulnerabilities (0 high, 0 moderate, 0 low)
- Project builds and functions identically to before the fix
- Only package.json and package-lock.json are modified
</success_criteria>

<output>
After completion, create `.planning/quick/012-fix-snyk-security-scan-issue-on-gha-vali/012-SUMMARY.md`
</output>
