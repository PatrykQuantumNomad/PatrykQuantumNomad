/**
 * Tests for security rules GA-C001 through GA-C005.
 *
 * Each rule is tested with inline YAML fixtures covering both
 * violation (flags) and clean (no flags) scenarios.
 */

import { describe, it, expect } from 'vitest';
import { parseGhaWorkflow } from '../../parser';
import type { GhaRuleContext, GhaRuleViolation } from '../../types';
import { GAC001 } from '../security/GA-C001-unpinned-action';
import { GAC002 } from '../security/GA-C002-mutable-action-tag';
import { GAC003 } from '../security/GA-C003-overly-permissive-permissions';
import { GAC004 } from '../security/GA-C004-missing-permissions';
import { GAC005 } from '../security/GA-C005-script-injection';

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

// ── GA-C001: Unpinned action version ────────────────────────────────

describe('GA-C001: Unpinned action version', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC001.id).toBe('GA-C001');
    expect(GAC001.title).toBe('Unpinned action version');
    expect(GAC001.severity).toBe('warning');
    expect(GAC001.category).toBe('security');
    expect(GAC001.explanation).toBeTruthy();
    expect(GAC001.fix).toBeDefined();
    expect(GAC001.fix.beforeCode).toBeTruthy();
    expect(GAC001.fix.afterCode).toBeTruthy();
    expect(typeof GAC001.check).toBe('function');
  });

  it('flags actions using semver tag (@v4)', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
    const violations = GAC001.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C001');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
    expect(violations[0].message).toContain('actions/checkout@v4');
  });

  it('flags actions with multi-part semver tag (@v4.0.1)', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4.0.1
`);
    const violations = GAC001.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C001');
  });

  it('does NOT flag actions pinned to full SHA', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
`);
    const violations = GAC001.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag local actions', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: ./local-action
`);
    const violations = GAC001.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag docker actions', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: docker://alpine:3.18
`);
    const violations = GAC001.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-C002: Mutable action tag ─────────────────────────────────────

describe('GA-C002: Mutable action tag', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC002.id).toBe('GA-C002');
    expect(GAC002.title).toBe('Mutable action tag');
    expect(GAC002.severity).toBe('warning');
    expect(GAC002.category).toBe('security');
    expect(typeof GAC002.check).toBe('function');
  });

  it('flags actions using @main', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
`);
    const violations = GAC002.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C002');
    expect(violations[0].message).toContain('main');
  });

  it('flags actions using @master', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: some/action@master
`);
    const violations = GAC002.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('flags actions using @develop', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: some/action@develop
`);
    const violations = GAC002.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('flags actions using @dev', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: some/action@dev
`);
    const violations = GAC002.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('flags actions using @HEAD (case-insensitive)', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: some/action@HEAD
`);
    const violations = GAC002.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('does NOT flag semver tags', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
    const violations = GAC002.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag SHA-pinned actions', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
`);
    const violations = GAC002.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-C003: Overly permissive permissions ──────────────────────────

describe('GA-C003: Overly permissive permissions', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC003.id).toBe('GA-C003');
    expect(GAC003.title).toBe('Overly permissive permissions');
    expect(GAC003.severity).toBe('warning');
    expect(GAC003.category).toBe('security');
    expect(typeof GAC003.check).toBe('function');
  });

  it('flags permissions: write-all', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: write-all
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC003.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C003');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
  });

  it('does NOT flag permissions: read-all', () => {
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
    const violations = GAC003.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag individual scope permissions', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions:
  contents: write
  pull-requests: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC003.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('flags job-level permissions: write-all', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - run: echo hello
`);
    const violations = GAC003.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C003');
  });
});

// ── GA-C004: Missing permissions block ──────────────────────────────

describe('GA-C004: Missing permissions block', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC004.id).toBe('GA-C004');
    expect(GAC004.title).toBe('Missing permissions block');
    expect(GAC004.severity).toBe('info');
    expect(GAC004.category).toBe('security');
    expect(typeof GAC004.check).toBe('function');
  });

  it('flags workflow with no top-level permissions key', () => {
    const ctx = makeContext(`
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC004.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C004');
    expect(violations[0].line).toBe(1);
    expect(violations[0].column).toBe(1);
  });

  it('does NOT flag workflow with permissions key (even if empty)', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: {}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAC004.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag workflow with permissions: read-all', () => {
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
    const violations = GAC004.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-C005: Script injection risk ──────────────────────────────────

describe('GA-C005: Script injection risk', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAC005.id).toBe('GA-C005');
    expect(GAC005.title).toBe('Script injection risk');
    expect(GAC005.severity).toBe('warning');
    expect(GAC005.category).toBe('security');
    expect(typeof GAC005.check).toBe('function');
  });

  it('flags ${{ github.event.issue.title }} in run: block', () => {
    const ctx = makeContext(`
name: Test
on: issues
permissions: read-all
jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$\{{ github.event.issue.title }}"
`);
    const violations = GAC005.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C005');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
    expect(violations[0].message).toContain('github.event.issue.title');
  });

  it('flags multiline run: | blocks with injection', () => {
    const ctx = makeContext(`
name: Test
on: issues
permissions: read-all
jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Processing issue"
          echo "$\{{ github.event.issue.body }}"
          echo "Done"
`);
    const violations = GAC005.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('GA-C005');
  });

  it('flags pull_request title injection', () => {
    const ctx = makeContext(`
name: Test
on: pull_request
permissions: read-all
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$\{{ github.event.pull_request.title }}"
`);
    const violations = GAC005.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('flags github.head_ref injection', () => {
    const ctx = makeContext(`
name: Test
on: pull_request
permissions: read-all
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$\{{ github.head_ref }}"
`);
    const violations = GAC005.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('does NOT flag ${{ secrets.MY_SECRET }}', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$\{{ secrets.MY_SECRET }}"
`);
    const violations = GAC005.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag ${{ github.sha }}', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$\{{ github.sha }}"
`);
    const violations = GAC005.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag safe contexts like github.repository', () => {
    const ctx = makeContext(`
name: Test
on: push
permissions: read-all
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$\{{ github.repository }}"
`);
    const violations = GAC005.check(ctx);
    expect(violations).toHaveLength(0);
  });
});
