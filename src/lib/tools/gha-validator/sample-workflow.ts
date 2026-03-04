/**
 * Sample GitHub Actions workflow YAML strings for the validator tool.
 *
 * SAMPLE_GHA_WORKFLOW: Comprehensive sample with deliberate violations from all
 *   rule categories (security, best-practice, style) for demonstrating the validator.
 * SAMPLE_GHA_WORKFLOW_BAD: A broken workflow with deliberate schema errors for testing.
 * SAMPLE_GHA_WORKFLOW_SECURITY: A workflow with deliberate security violations for all 10 rules.
 */

/**
 * Comprehensive sample workflow with deliberate violations from all rule categories.
 *
 * Security violations:
 * - GA-C001: actions/checkout@v4 (unpinned semver tag)
 * - GA-C008: third-party/tool@v2 (third-party without SHA)
 *
 * Best practice violations:
 * - GA-B001: missing timeout-minutes on jobs
 * - GA-B002: missing concurrency group
 * - GA-B003: unnamed run: step
 *
 * Style violations:
 * - GA-F001: jobs not alphabetical (deploy before build)
 * - GA-F004: missing workflow name
 */
export const SAMPLE_GHA_WORKFLOW = `on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: ./deploy.sh

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: third-party/tool@v2
      - name: Install dependencies
        run: npm ci
      - run: npm test
      - name: Build
        run: npm run build
`;

/**
 * Security-focused sample with deliberate violations for all 10 security rules.
 *
 * Violations exercised:
 * - GA-C001: actions/checkout@v4 (unpinned semver tag)
 * - GA-C002: some/action@main (mutable branch ref)
 * - GA-C003: permissions: write-all (overly permissive)
 * - GA-C004: no top-level permissions block (missing permissions)
 * - GA-C005: ${{ github.event.pull_request.title }} in run: (script injection)
 * - GA-C006: on: pull_request_target without restrictions
 * - GA-C007: ghp_... hardcoded secret
 * - GA-C008: third-party/tool@v2 (third-party without SHA)
 * - GA-C009: contents:write + actions:write (dangerous scope combo)
 * - GA-C010: runs-on: self-hosted
 */
export const SAMPLE_GHA_WORKFLOW_SECURITY = `name: Insecure CI

on:
  pull_request_target:

jobs:
  build:
    runs-on: self-hosted
    permissions: write-all
    steps:
      - uses: actions/checkout@v4
      - uses: some/action@main
      - uses: third-party/tool@v2
      - name: Greet PR author
        env:
          TOKEN: ghp_abcdefghijklmnopqrstuvwxyz0123456789
        run: |
          echo "PR: \${{ github.event.pull_request.title }}"

  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: write
      actions: write
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - run: echo "deploy"
`;

/**
 * Broken workflow with deliberate schema errors for testing.
 *
 * Errors exercised:
 * - GA-S002: unknown property 'invalid_event' at on (additionalProperties)
 * - GA-S002: unknown property 'unknownProp' in job 'build'
 * - GA-S002: unknown property 'invalid_step_prop' in step
 * - GA-S002: unknown property 'runs_on' in job 'test' (misspelling)
 * - GA-S004: missing required property 'runs-on' in job 'test'
 */
export const SAMPLE_GHA_WORKFLOW_BAD = `name: Broken CI
on:
  push:
    branches: [main]
  invalid_event: true

jobs:
  build:
    runs-on: ubuntu-latest
    unknownProp: true
    steps:
      - uses: actions/checkout@v4
      - name: Test
        run: npm test
        invalid_step_prop: yes
  test:
    runs_on: ubuntu-latest
    steps:
      - run: echo "test"
`;
