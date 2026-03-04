/**
 * Tests for style rules GA-F001 through GA-F004.
 *
 * Each rule is tested with inline YAML fixtures covering both
 * violation (flags) and clean (no flags) scenarios.
 *
 * Also verifies the master registry integration:
 * - allGhaRules has 22 entries (10 security + 8 best practice + 4 style)
 * - allDocumentedGhaRules has 40 entries (22 custom + 18 actionlint metadata)
 * - getGhaRuleById works across all categories
 */

import { describe, it, expect } from 'vitest';
import { parseGhaWorkflow } from '../../parser';
import type { GhaRuleContext } from '../../types';
import { GAF001 } from '../style/GA-F001-jobs-not-alphabetical';
import { GAF002 } from '../style/GA-F002-inconsistent-quoting';
import { GAF003 } from '../style/GA-F003-long-step-name';
import { GAF004 } from '../style/GA-F004-missing-workflow-name';
import { styleRules } from '../style/index';
import { allGhaRules, allDocumentedGhaRules, getGhaRuleById } from '../index';
import { SAMPLE_GHA_WORKFLOW } from '../../sample-workflow';

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

describe('styleRules barrel', () => {
  it('exports 4 rules', () => {
    expect(styleRules).toHaveLength(4);
  });

  it('contains all rule IDs GA-F001 through GA-F004', () => {
    const ids = styleRules.map((r) => r.id);
    expect(ids).toEqual(['GA-F001', 'GA-F002', 'GA-F003', 'GA-F004']);
  });
});

// ── GA-F001: Jobs not alphabetically ordered ──────────────────────────

describe('GA-F001: Jobs not alphabetically ordered', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAF001.id).toBe('GA-F001');
    expect(GAF001.title).toBe('Jobs not alphabetically ordered');
    expect(GAF001.severity).toBe('info');
    expect(GAF001.category).toBe('style');
    expect(GAF001.explanation).toBeTruthy();
    expect(GAF001.fix).toBeDefined();
    expect(typeof GAF001.check).toBe('function');
  });

  it('flags jobs out of alphabetical order (deploy before build)', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo deploy
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo build
`);
    const violations = GAF001.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('GA-F001');
    expect(violations[0].message).toContain('deploy');
    expect(violations[0].message).toContain('build');
    expect(violations[0].line).toBeGreaterThan(0);
    expect(violations[0].column).toBeGreaterThan(0);
  });

  it('does NOT flag jobs in alphabetical order (build, deploy)', () => {
    const ctx = makeContext(`
name: CI
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
    const violations = GAF001.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag single job', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo build
`);
    const violations = GAF001.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('reports only ONE violation even with multiple out-of-order jobs', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  zebra:
    runs-on: ubuntu-latest
    steps:
      - run: echo z
  middle:
    runs-on: ubuntu-latest
    steps:
      - run: echo m
  alpha:
    runs-on: ubuntu-latest
    steps:
      - run: echo a
`);
    const violations = GAF001.check(ctx);
    expect(violations).toHaveLength(1);
  });
});

// ── GA-F002: Inconsistent uses: quoting ───────────────────────────────

describe('GA-F002: Inconsistent uses: quoting', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAF002.id).toBe('GA-F002');
    expect(GAF002.title).toBe('Inconsistent uses: quoting');
    expect(GAF002.severity).toBe('info');
    expect(GAF002.category).toBe('style');
    expect(typeof GAF002.check).toBe('function');
  });

  it('flags mixed plain and single-quoted uses:', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: 'actions/cache@v4'
`);
    const violations = GAF002.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('GA-F002');
    expect(violations[0].message).toContain('single quotes');
    expect(violations[0].message).toContain('no quotes');
  });

  it('does NOT flag all plain uses:', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
`);
    const violations = GAF002.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag single uses: value', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
    const violations = GAF002.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── GA-F003: Step name exceeds 80 characters ──────────────────────────

describe('GA-F003: Step name exceeds 80 characters', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAF003.id).toBe('GA-F003');
    expect(GAF003.title).toBe('Step name exceeds 80 characters');
    expect(GAF003.severity).toBe('info');
    expect(GAF003.category).toBe('style');
    expect(typeof GAF003.check).toBe('function');
  });

  it('flags step name with 81+ characters', () => {
    const longName = 'A'.repeat(81);
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: ${longName}
        run: echo test
`);
    const violations = GAF003.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('GA-F003');
    expect(violations[0].message).toContain('81');
    expect(violations[0].message).toContain('80');
    expect(violations[0].line).toBeGreaterThan(0);
  });

  it('does NOT flag step name with exactly 80 characters', () => {
    const exactName = 'B'.repeat(80);
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: ${exactName}
        run: echo test
`);
    const violations = GAF003.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does NOT flag step without name', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAF003.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('flags multiple long names', () => {
    const longName1 = 'C'.repeat(90);
    const longName2 = 'D'.repeat(100);
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: ${longName1}
        run: echo a
      - name: ${longName2}
        run: echo b
`);
    const violations = GAF003.check(ctx);
    expect(violations).toHaveLength(2);
  });
});

// ── GA-F004: Missing workflow name ────────────────────────────────────

describe('GA-F004: Missing workflow name', () => {
  it('implements GhaLintRule interface', () => {
    expect(GAF004.id).toBe('GA-F004');
    expect(GAF004.title).toBe('Missing workflow name');
    expect(GAF004.severity).toBe('info');
    expect(GAF004.category).toBe('style');
    expect(typeof GAF004.check).toBe('function');
  });

  it('flags workflow without name: key', () => {
    const ctx = makeContext(`
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAF004.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('GA-F004');
    expect(violations[0].line).toBe(1);
    expect(violations[0].column).toBe(1);
    expect(violations[0].message).toContain('name:');
  });

  it('does NOT flag workflow with name: CI', () => {
    const ctx = makeContext(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hello
`);
    const violations = GAF004.check(ctx);
    expect(violations).toHaveLength(0);
  });
});

// ── Master registry integration ───────────────────────────────────────

describe('Master registry integration', () => {
  it('allGhaRules has 22 custom rules', () => {
    expect(allGhaRules).toHaveLength(22);
  });

  it('allDocumentedGhaRules has 40 documented rules', () => {
    expect(allDocumentedGhaRules).toHaveLength(40);
  });

  it('getGhaRuleById finds security rule', () => {
    const rule = getGhaRuleById('GA-C001');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('security');
  });

  it('getGhaRuleById finds best-practice rule', () => {
    const rule = getGhaRuleById('GA-B001');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('best-practice');
  });

  it('getGhaRuleById finds style rule', () => {
    const rule = getGhaRuleById('GA-F001');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('style');
  });

  it('getGhaRuleById finds actionlint metadata rule', () => {
    const rule = getGhaRuleById('GA-L001');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('semantic');
  });

  it('getGhaRuleById returns undefined for unknown ID', () => {
    expect(getGhaRuleById('GA-X999')).toBeUndefined();
  });
});

// ── Comprehensive sample workflow ─────────────────────────────────────

describe('Comprehensive sample workflow (SAMPLE_GHA_WORKFLOW)', () => {
  it('is valid YAML that parses successfully', () => {
    const result = parseGhaWorkflow(SAMPLE_GHA_WORKFLOW);
    expect(result.parseSuccess).toBe(true);
    expect(result.json).toBeDefined();
  });

  it('triggers at least one violation from each custom rule category', () => {
    const result = parseGhaWorkflow(SAMPLE_GHA_WORKFLOW);
    if (!result.json) throw new Error('Parse failed');

    const ctx: GhaRuleContext = {
      doc: result.doc,
      rawText: SAMPLE_GHA_WORKFLOW,
      lineCounter: result.lineCounter,
      json: result.json,
    };

    const violations = allGhaRules.flatMap((r) => r.check(ctx));
    const categories = new Set(
      violations.map((v) => {
        const rule = getGhaRuleById(v.ruleId);
        return rule?.category;
      }),
    );

    // The comprehensive sample should trigger security, best-practice, and style rules
    expect(categories.has('security')).toBe(true);
    expect(categories.has('best-practice')).toBe(true);
    expect(categories.has('style')).toBe(true);
  });
});
