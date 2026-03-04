/**
 * Sample GitHub Actions workflow YAML strings for the validator tool.
 *
 * SAMPLE_GHA_WORKFLOW: A clean, valid workflow shown by default.
 * SAMPLE_GHA_WORKFLOW_BAD: A broken workflow with deliberate schema errors for testing.
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
