/**
 * Tests for best practice rules GA-B001 through GA-B008.
 *
 * Each rule is tested with inline YAML fixtures covering both
 * violation (flags) and clean (no flags) scenarios.
 */

import { describe, it, expect } from 'vitest';
import { parseGhaWorkflow } from '../../parser';
import type { GhaRuleContext } from '../../types';
import { GAB001 } from '../best-practice/GA-B001-missing-timeout';
import { GAB002 } from '../best-practice/GA-B002-missing-concurrency';
import { GAB003 } from '../best-practice/GA-B003-unnamed-step';
import { GAB004 } from '../best-practice/GA-B004-duplicate-step-name';
import { GAB005 } from '../best-practice/GA-B005-empty-env';
import { GAB006 } from '../best-practice/GA-B006-missing-conditional';
import { GAB007 } from '../best-practice/GA-B007-outdated-action';
import { GAB008 } from '../best-practice/GA-B008-missing-continue-on-error';
import { bestPracticeRules } from '../best-practice/index';

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

// ── Barrel export ────────────────────────────────────────────────────

describe('bestPracticeRules barrel', () => {
  it('exports 8 rules', () => {
    expect(bestPracticeRules).toHaveLength(8);
  });

  it('contains all rule IDs GA-B001 through GA-B008', () => {
    const ids = bestPracticeRules.map((r) => r.id);
    expect(ids).toEqual([
      'GA-B001',
      'GA-B002',
      'GA-B003',
      'GA-B004',
      'GA-B005',
      'GA-B006',
      'GA-B007',
      'GA-B008',
    ]);
  });
});

// ── GA-B001: Missing timeout-minutes ─────────────────────────────────

describe('GA-B001: Missing timeout-minutes', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB001.id).toBe('GA-B001');
    expect(GAB001.title).toBe('Missing timeout-minutes');
    expect(GAB001.severity).toBe('warning');
    expect(GAB001.category).toBe('best-practice');
    expect(GAB001.explanation).toBeTruthy();
    expect(GAB001.fix).toBeDefined();
    expect(typeof GAB001.check).toBe('function');
  });

  it('flags job without timeout-minutes', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAB001.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B001');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
    expect(violations[0].message).toContain('build');
    expect(violations[0].message).toContain('360');
  });

  it('does NOT flag job with timeout-minutes', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - run: echo hello
`);
    const violations = GAB001.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('flags multiple jobs without timeout', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo build
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo deploy
`);
    const violations = GAB001.check(ctx);
    expect(violations).toHaveLength(2);
  });
});

// ── GA-B002: Missing concurrency group ───────────────────────────────

describe('GA-B002: Missing concurrency group', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB002.id).toBe('GA-B002');
    expect(GAB002.title).toBe('Missing concurrency group');
    expect(GAB002.severity).toBe('info');
    expect(GAB002.category).toBe('best-practice');
    expect(typeof GAB002.check).toBe('function');
  });

  it('flags workflow without concurrency', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAB002.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B002');
    expect(violations[0].line).toBe(1);
    expect(violations[0].column).toBe(1);
  });

  it('does NOT flag workflow with concurrency group', () => {
    const ctx = makeContext(`
name: CI
on: push
concurrency:
  group: ci-${'${{ github.ref }}'}
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAB002.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-B003: Unnamed step ────────────────────────────────────────────

describe('GA-B003: Unnamed step', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB003.id).toBe('GA-B003');
    expect(GAB003.title).toBe('Unnamed step');
    expect(GAB003.severity).toBe('info');
    expect(GAB003.category).toBe('best-practice');
    expect(typeof GAB003.check).toBe('function');
  });

  it('flags run: step without name', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`);
    const violations = GAB003.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B003');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
  });

  it('does NOT flag run: step with name', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: npm test
`);
    const violations = GAB003.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag uses: step without name', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
    const violations = GAB003.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-B004: Duplicate step name ─────────────────────────────────────

describe('GA-B004: Duplicate step name', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB004.id).toBe('GA-B004');
    expect(GAB004.title).toBe('Duplicate step name');
    expect(GAB004.severity).toBe('warning');
    expect(GAB004.category).toBe('best-practice');
    expect(typeof GAB004.check).toBe('function');
  });

  it('flags duplicate step names in same job', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: npm test
      - name: Run tests
        run: npm run e2e
`);
    const violations = GAB004.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B004');
    expect(violations[0].message).toContain('Run tests');
    expect(violations[0].message).toContain('build');
  });

  it('does NOT flag uniquely named steps', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run e2e
`);
    const violations = GAB004.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-B005: Empty env block ─────────────────────────────────────────

describe('GA-B005: Empty env block', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB005.id).toBe('GA-B005');
    expect(GAB005.title).toBe('Empty env block');
    expect(GAB005.severity).toBe('info');
    expect(GAB005.category).toBe('best-practice');
    expect(typeof GAB005.check).toBe('function');
  });

  it('flags empty env: {} at workflow level', () => {
    const ctx = makeContext(`
name: Test
on: push
env: {}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAB005.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B005');
    expect(violations[0].line).toBeGreaterThan(0);
  });

  it('flags empty env at job level', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    env: {}
    steps:
      - run: echo hello
`);
    const violations = GAB005.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B005');
  });

  it('flags empty env at step level', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
        env: {}
`);
    const violations = GAB005.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B005');
  });

  it('does NOT flag env with variables', () => {
    const ctx = makeContext(`
name: Test
on: push
env:
  NODE_ENV: test
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAB005.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-B006: Missing conditional on PR workflow ──────────────────────

describe('GA-B006: Missing conditional on PR workflow', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB006.id).toBe('GA-B006');
    expect(GAB006.title).toBe('Missing conditional on PR workflow');
    expect(GAB006.severity).toBe('info');
    expect(GAB006.category).toBe('best-practice');
    expect(typeof GAB006.check).toBe('function');
  });

  it('flags job without if: in PR-only workflow with 2+ jobs', () => {
    const ctx = makeContext(`
name: PR Check
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo deploy
`);
    const violations = GAB006.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B006');
    expect(violations[0].message).toContain("'if:'");
  });

  it('does NOT flag PR-only workflow with single job', () => {
    const ctx = makeContext(`
name: PR Check
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint
`);
    const violations = GAB006.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag push-triggered workflow', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo deploy
`);
    const violations = GAB006.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag jobs that have if: conditional', () => {
    const ctx = makeContext(`
name: PR Check
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    steps:
      - run: npm run lint
  deploy:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    steps:
      - run: echo deploy
`);
    const violations = GAB006.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-B007: Outdated action version ─────────────────────────────────

describe('GA-B007: Outdated action version', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB007.id).toBe('GA-B007');
    expect(GAB007.title).toBe('Outdated action version');
    expect(GAB007.severity).toBe('info');
    expect(GAB007.category).toBe('best-practice');
    expect(typeof GAB007.check).toBe('function');
  });

  it('flags actions/checkout@v2 (2+ behind v4)', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
`);
    const violations = GAB007.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B007');
    expect(violations[0].message).toContain('v4');
  });

  it('does NOT flag actions/checkout@v4 (current)', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
    const violations = GAB007.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag actions/checkout@v3 (only 1 behind)', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
`);
    const violations = GAB007.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag unknown custom action', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: some/custom-action@v1
`);
    const violations = GAB007.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('flags setup-node@v2 (2+ behind v4)', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v2
`);
    const violations = GAB007.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('v4');
  });
});

// ── GA-B008: Missing continue-on-error on network step ───────────────

describe('GA-B008: Missing continue-on-error on network step', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAB008.id).toBe('GA-B008');
    expect(GAB008.title).toBe('Missing continue-on-error on network step');
    expect(GAB008.severity).toBe('info');
    expect(GAB008.category).toBe('best-practice');
    expect(typeof GAB008.check).toBe('function');
  });

  it('flags curl without continue-on-error', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://api.example.com
`);
    const violations = GAB008.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B008');
    expect(violations[0].message).toContain('curl');
  });

  it('flags wget without continue-on-error', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: wget https://example.com/file.tar.gz
`);
    const violations = GAB008.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B008');
  });

  it('flags gh api without continue-on-error', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: gh api repos/owner/repo
`);
    const violations = GAB008.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-B008');
  });

  it('does NOT flag curl with continue-on-error', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://api.example.com
        continue-on-error: true
`);
    const violations = GAB008.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag step without network calls', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAB008.check(ctx);
    expect(violations).toHaveLength(0);
  });
});
