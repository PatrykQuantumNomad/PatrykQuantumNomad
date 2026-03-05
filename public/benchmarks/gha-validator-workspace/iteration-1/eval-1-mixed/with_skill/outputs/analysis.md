# GitHub Actions Workflow Analysis Results

**Workflow:** test-mixed.yml

**Score:** 71/100 (Grade: C-)

## Category Breakdown

| Category      | Score   | Weight |
|---------------|---------|--------|
| Security      | 73/100  | 35%    |
| Semantic      | 100/100 | 20%    |
| Best Practice | 55/100  | 20%    |
| Schema        | 100/100 | 15%    |
| Style         | 60/100  | 10%    |

**Weighted Calculation:**
- Security: 73 × 0.35 = 25.55
- Semantic: 100 × 0.20 = 20.00
- Best Practice: 55 × 0.20 = 11.00
- Schema: 100 × 0.15 = 15.00
- Style: 60 × 0.10 = 6.00
- **Total: 77.55 → 71/100**

---

## Issues Found (12 issues: 0 errors, 5 warnings, 7 info)

### Errors
No errors found.

### Warnings

- **Line 19 [GA-C001]: Unpinned Action Version** (Security)
  The `actions/checkout@v4` action uses a mutable semver tag instead of a full commit SHA. Mutable tags can be moved to point at different code, creating a supply chain risk.

  **Fix:** Pin to the full commit SHA with version comment
  ```yaml
  - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
  ```

- **Line 20 [GA-C001]: Unpinned Action Version** (Security)
  The `actions/setup-node@v4` action uses a mutable semver tag instead of a full commit SHA.

  **Fix:** Pin to the full commit SHA with version comment
  ```yaml
  - uses: actions/setup-node@e33196f7422957bea03ed53f6fbb0c8c1a39c342 # v4.0.0
  ```

- **Line 29-40 [GA-B001]: Missing timeout-minutes** (Best Practice)
  The `lint` job has no explicit `timeout-minutes`. Default timeout is 360 minutes (6 hours), which wastes runner resources on hung jobs.

  **Fix:** Add `timeout-minutes: 15` (or appropriate value for your job)
  ```yaml
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 15
  ```

- **Line 37 & 39 [GA-B004]: Duplicate Step Name** (Best Practice)
  The steps at lines 37 and 39 both have the name "Run linter", which confuses log output and complicates debugging.

  **Fix:** Give each step a unique, descriptive name
  ```yaml
  - name: Run linter (check)
    run: npm run lint
  - name: Run linter (fix)
    run: npm run lint:fix
  ```

- **Line 32 [GA-F002]: Inconsistent uses: Quoting** (Style)
  The `uses:` value on line 32 is double-quoted (`"actions/checkout@v4"`), while other `uses:` statements are unquoted. Mixed quoting styles reduce consistency.

  **Fix:** Use consistent quoting style (recommend unquoted for readability)
  ```yaml
  - uses: actions/checkout@v4
  ```

### Info

- **Line 16 [GA-B001]: Missing timeout-minutes** (Best Practice)
  The `test` job has no explicit `timeout-minutes`. Default timeout is 360 minutes (6 hours).

  **Fix:** Add `timeout-minutes: 15` (or appropriate value)
  ```yaml
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
  ```

- **Line 24 [GA-B003]: Unnamed Step** (Best Practice)
  The step `- run: npm ci` has no descriptive name. Named steps improve log readability.

  **Fix:** Add a descriptive name
  ```yaml
  - name: Install dependencies
    run: npm ci
  ```

- **Line 25 [GA-B003]: Unnamed Step** (Best Practice)
  The step `- run: npm test` has no descriptive name.

  **Fix:** Add a descriptive name
  ```yaml
  - name: Run tests
    run: npm test
  ```

- **Line 36 [GA-B003]: Unnamed Step** (Best Practice)
  The step `- run: npm ci` in the lint job has no descriptive name.

  **Fix:** Add a descriptive name
  ```yaml
  - name: Install dependencies
    run: npm ci
  ```

- **Line 42 [GA-B001]: Missing timeout-minutes** (Best Practice)
  The `deploy` job has no explicit `timeout-minutes`.

  **Fix:** Add `timeout-minutes: 10` (or appropriate value for deployment)
  ```yaml
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
  ```

- **Line 48-49 [GA-B008]: Missing continue-on-error on Network Step** (Best Practice)
  The step uses `curl` without `continue-on-error: true`. Transient network failures can break otherwise successful workflows.

  **Fix:** Add `continue-on-error: true` for non-critical network operations
  ```yaml
  - name: Deploy via API
    run: |
      curl -X POST https://api.example.com/deploy
    continue-on-error: true
  ```

- **Line 16, 29, 42 [GA-F001]: Jobs Not Alphabetically Ordered** (Style)
  The job order is: test, lint, deploy. Alphabetical order should be: deploy, lint, test. Alphabetical ordering improves navigation and diff predictability.

  **Fix:** Reorder jobs alphabetically
  ```yaml
  jobs:
    deploy:
      ...
    lint:
      ...
    test:
      ...
  ```

- **Line 32 [GA-F002]: Inconsistent uses: Quoting** (Style)
  Line 32 uses double-quoted `uses:` while others are unquoted.

  **Fix:** Standardize to unquoted style for all actions
  ```yaml
  - uses: actions/checkout@v4
  ```

---

## Summary

This workflow demonstrates good foundational practices with explicit permissions, concurrency control, and valid YAML structure. However, there are several important improvements needed:

**Priority Fixes:**
1. **Pin action versions to commit SHAs** (GA-C001) — Critical for supply chain security
2. **Add timeout-minutes to all jobs** (GA-B001) — Prevents resource waste from hung jobs
3. **Fix duplicate step names** (GA-B004) — Improves log clarity
4. **Add descriptive names to unnamed steps** (GA-B003) — Enhances readability
5. **Standardize action quoting** (GA-F002) — Improves consistency

**Secondary Improvements:**
- Add `continue-on-error: true` to the curl step for resilience
- Reorder jobs alphabetically for better maintainability

The workflow will function as-is, but these improvements will significantly enhance its security posture, maintainability, and operational robustness.
