/**
 * Sample GitHub Actions workflow YAML strings for the validator tool.
 *
 * SAMPLE_GHA_WORKFLOW: A clean, valid workflow shown by default.
 * SAMPLE_GHA_WORKFLOW_BAD: A broken workflow with deliberate schema errors for testing.
 * SAMPLE_GHA_WORKFLOW_SECURITY: A workflow with deliberate security violations for all 10 rules.
 */

/** Clean CI/CD workflow -- validates without errors. */
export const SAMPLE_GHA_WORKFLOW = `name: CI Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: write
  actions: write
  issues: write

env:
  NODE_VERSION: "20"

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          echo "Deploying \${{ github.sha }}"
          ./deploy.sh
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
