/**
 * Tests for security rules GA-C006 through GA-C010.
 *
 * Each rule is tested with inline YAML fixtures covering both
 * violation (flags) and clean (no flags) scenarios.
 */

import { describe, it, expect } from 'vitest';
import { parseGhaWorkflow } from '../../parser';
import type { GhaRuleContext } from '../../types';
import { GAC006 } from '../security/GA-C006-pull-request-target';
import { GAC007 } from '../security/GA-C007-hardcoded-secrets';
import { GAC008 } from '../security/GA-C008-third-party-no-sha';
import { GAC009 } from '../security/GA-C009-dangerous-token-scopes';
import { GAC010 } from '../security/GA-C010-self-hosted-runner';

/** Build a GhaRuleContext from a raw YAML string. */
function makeContext(yaml: string): GhaRuleContext {
  const result = parseGhaWorkflow(yaml);
  if (!result.json) {
    throw new Error('Failed to parse YAML fixture');
  }
  return {
    doc: result.doc,
    rawText: yaml,
    lineCounter: result.lineCounter,
    json: result.json,
  };
}

// ── GA-C006: pull_request_target without restrictions ────────────────

describe('GA-C006: pull_request_target without restrictions', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC006.id).toBe('GA-C006');
    expect(GAC006.title).toBeTruthy();
    expect(GAC006.severity).toBe('warning');
    expect(GAC006.category).toBe('security');
    expect(GAC006.explanation).toBeTruthy();
    expect(GAC006.fix).toBeDefined();
    expect(GAC006.fix.beforeCode).toBeTruthy();
    expect(GAC006.fix.afterCode).toBeTruthy();
    expect(typeof GAC006.check).toBe('function');
  });

  it('flags on: pull_request_target without filters (map form)', () => {
    const ctx = makeContext(`
name: Test
on:
  pull_request_target:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C006');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
  });

  it('flags on: [pull_request_target] in list form', () => {
    const ctx = makeContext(`
name: Test
on: [pull_request_target]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C006');
  });

  it('does NOT flag pull_request_target with branches filter', () => {
    const ctx = makeContext(`
name: Test
on:
  pull_request_target:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag pull_request_target with paths filter', () => {
    const ctx = makeContext(`
name: Test
on:
  pull_request_target:
    paths: ['src/**']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag pull_request_target with branches-ignore filter', () => {
    const ctx = makeContext(`
name: Test
on:
  pull_request_target:
    branches-ignore: [dependabot/**]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag pull_request_target with paths-ignore filter', () => {
    const ctx = makeContext(`
name: Test
on:
  pull_request_target:
    paths-ignore: ['docs/**']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag on: pull_request (different trigger)', () => {
    const ctx = makeContext(`
name: Test
on:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag on: push', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC006.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-C007: Hardcoded secrets ───────────────────────────────────────

describe('GA-C007: Hardcoded secrets', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC007.id).toBe('GA-C007');
    expect(GAC007.title).toBeTruthy();
    expect(GAC007.severity).toBe('warning');
    expect(GAC007.category).toBe('security');
    expect(GAC007.explanation).toBeTruthy();
    expect(GAC007.fix).toBeDefined();
    expect(typeof GAC007.check).toBe('function');
  });

  it('flags GitHub Personal Access Token (ghp_)', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          TOKEN: ghp_abcdefghijklmnopqrstuvwxyz0123456789
        run: echo deploy
`);
    const violations = GAC007.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C007');
    expect(violations[0].message).toContain('GitHub Personal Access Token');
  });

  it('flags AWS Access Key (AKIA)', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          AWS_KEY: AKIAIOSFODNN7EXAMPLE
        run: echo deploy
`);
    const violations = GAC007.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C007');
    expect(violations[0].message).toContain('AWS Access Key');
  });

  it('flags OpenAI API Key (sk-)', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          OPENAI_KEY: sk-abcdefghijklmnopqrstuvwxyz0123456789012345678901
        run: echo deploy
`);
    const violations = GAC007.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C007');
  });

  it('does NOT flag ${{ secrets.TOKEN }} references', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          TOKEN: \${{ secrets.TOKEN }}
        run: echo deploy
`);
    const violations = GAC007.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag normal string values', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build
        env:
          NODE_ENV: production
          VERSION: "1.2.3"
        run: npm run build
`);
    const violations = GAC007.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-C008: Third-party action without SHA pinning ──────────────────

describe('GA-C008: Third-party action without SHA pinning', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC008.id).toBe('GA-C008');
    expect(GAC008.title).toBeTruthy();
    expect(GAC008.severity).toBe('warning');
    expect(GAC008.category).toBe('security');
    expect(GAC008.explanation).toBeTruthy();
    expect(GAC008.fix).toBeDefined();
    expect(typeof GAC008.check).toBe('function');
  });

  it('flags third-party action with semver tag', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: third-party/action@v2
`);
    const violations = GAC008.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C008');
    expect(violations[0].message).toContain('third-party/action@v2');
  });

  it('flags third-party action with branch ref', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: some-org/tool@main
`);
    const violations = GAC008.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C008');
  });

  it('does NOT flag first-party actions/ actions', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
    const violations = GAC008.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag first-party github/ actions', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: github/codeql-action@v3
`);
    const violations = GAC008.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag third-party action pinned to 40-char SHA', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: third-party/action@abc1234567890abc1234567890abc1234567890a
`);
    const violations = GAC008.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag local actions', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: ./local-action
`);
    const violations = GAC008.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag docker actions', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: docker://alpine:3.18
`);
    const violations = GAC008.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-C009: Dangerous token scope combinations ──────────────────────

describe('GA-C009: Dangerous token scope combinations', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC009.id).toBe('GA-C009');
    expect(GAC009.title).toBeTruthy();
    expect(GAC009.severity).toBe('warning');
    expect(GAC009.category).toBe('security');
    expect(GAC009.explanation).toBeTruthy();
    expect(GAC009.fix).toBeDefined();
    expect(typeof GAC009.check).toBe('function');
  });

  it('flags contents:write + actions:write combination', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions:
  contents: write
  actions: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC009.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C009');
    expect(violations[0].message).toContain('contents');
    expect(violations[0].message).toContain('actions');
  });

  it('flags packages:write + contents:write combination', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions:
  packages: write
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC009.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C009');
  });

  it('flags id-token:write + another write scope', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions:
  id-token: write
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC009.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C009');
  });

  it('flags dangerous combos at job level', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      actions: write
    steps:
      - run: echo hello
`);
    const violations = GAC009.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C009');
  });

  it('does NOT flag individual write permissions alone', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC009.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag read-only permissions', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions:
  contents: read
  actions: read
  packages: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC009.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-C010: Self-hosted runner ──────────────────────────────────────

describe('GA-C010: Self-hosted runner', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC010.id).toBe('GA-C010');
    expect(GAC010.title).toBeTruthy();
    expect(GAC010.severity).toBe('info');
    expect(GAC010.category).toBe('security');
    expect(GAC010.explanation).toBeTruthy();
    expect(GAC010.fix).toBeDefined();
    expect(typeof GAC010.check).toBe('function');
  });

  it('flags runs-on: self-hosted (scalar)', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: self-hosted
    steps:
      - run: echo hello
`);
    const violations = GAC010.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C010');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
  });

  it('flags runs-on: [self-hosted, linux] (array)', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: [self-hosted, linux]
    steps:
      - run: echo hello
`);
    const violations = GAC010.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C010');
  });

  it('does NOT flag runs-on: ubuntu-latest', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC010.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag runs-on: [ubuntu-latest, macos-latest] (no self-hosted)', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: [ubuntu-latest]
    steps:
      - run: echo hello
`);
    const violations = GAC010.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('flags self-hosted in multiple jobs', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: self-hosted
    steps:
      - run: echo build
  test:
    runs-on: self-hosted
    steps:
      - run: echo test
`);
    const violations = GAC010.check(ctx);
    expect(violations.length).toBe(2);
    expect(violations[0].ruleId).toBe('GA-C010');
    expect(violations[1].ruleId).toBe('GA-C010');
  });
});
