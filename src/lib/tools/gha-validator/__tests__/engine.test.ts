import { describe, it, expect } from 'vitest';
import type {
  GhaRuleViolation,
  GhaUnifiedViolation,
  ActionlintError,
  GhaLintRule,
  GhaRuleContext,
} from '../types';
import { SAMPLE_GHA_WORKFLOW } from '../sample-workflow';

// These imports will fail until engine.ts is created
import {
  toUnified,
  mapActionlintError,
  runPass1,
  mergePass2,
} from '../engine';

describe('toUnified', () => {
  it('converts GhaRuleViolation + severity + category to GhaUnifiedViolation with all 6 fields', () => {
    const violation: GhaRuleViolation = {
      ruleId: 'GA-S002',
      line: 10,
      column: 5,
      message: 'Unknown property found',
      endLine: 10,
      endColumn: 15,
    };

    const unified = toUnified(violation, 'error', 'schema');

    expect(unified.ruleId).toBe('GA-S002');
    expect(unified.message).toBe('Unknown property found');
    expect(unified.line).toBe(10);
    expect(unified.column).toBe(5);
    expect(unified.severity).toBe('error');
    expect(unified.category).toBe('schema');
    expect(unified.endLine).toBe(10);
    expect(unified.endColumn).toBe(15);
  });
});

describe('mapActionlintError', () => {
  it('maps known kind (syntax-check) to GA-L001 with correct severity and category', () => {
    const err: ActionlintError = {
      kind: 'syntax-check',
      message: 'unexpected key "foo"',
      line: 3,
      column: 7,
    };

    const unified = mapActionlintError(err);

    expect(unified.ruleId).toBe('GA-L001');
    expect(unified.severity).toBe('error');
    expect(unified.category).toBe('semantic');
    expect(unified.message).toBe('Syntax error: unexpected key "foo"');
    expect(unified.line).toBe(3);
    expect(unified.column).toBe(7);
  });

  it('maps credentials kind to GA-L011 with security category', () => {
    const err: ActionlintError = {
      kind: 'credentials',
      message: 'password in container config',
      line: 15,
      column: 10,
    };

    const unified = mapActionlintError(err);

    expect(unified.ruleId).toBe('GA-L011');
    expect(unified.severity).toBe('error');
    expect(unified.category).toBe('security');
  });

  it('maps unknown kind to GA-L000 fallback with warning severity', () => {
    const err: ActionlintError = {
      kind: 'some-future-kind',
      message: 'some new check',
      line: 1,
      column: 1,
    };

    const unified = mapActionlintError(err);

    expect(unified.ruleId).toBe('GA-L000');
    expect(unified.severity).toBe('warning');
    expect(unified.category).toBe('actionlint');
  });
});

describe('runPass1', () => {
  it('returns empty violations for a valid workflow', () => {
    const result = runPass1(SAMPLE_GHA_WORKFLOW);

    expect(result.violations).toEqual([]);
    expect(result.pass).toBe(1);
  });

  it('returns GA-S001 violations for invalid YAML syntax', () => {
    const badYaml = `name: Test
on: push
jobs:
  build:
    - this is invalid yaml mapping
    runs-on: ubuntu-latest`;

    const result = runPass1(badYaml);

    expect(result.violations.length).toBeGreaterThan(0);
    // Parse errors should have severity 'error' and category 'schema'
    const parseViolations = result.violations.filter(v => v.ruleId === 'GA-S001');
    expect(parseViolations.length).toBeGreaterThan(0);
    for (const v of parseViolations) {
      expect(v.severity).toBe('error');
      expect(v.category).toBe('schema');
    }
    expect(result.pass).toBe(1);
  });

  it('returns violations with severity and category for schema errors', () => {
    const schemaErrorYaml = `name: Test
on:
  push:
    branches: [main]
  invalid_event: true
jobs:
  build:
    runs-on: ubuntu-latest
    unknownProp: true
    steps:
      - uses: actions/checkout@v4`;

    const result = runPass1(schemaErrorYaml);

    expect(result.violations.length).toBeGreaterThan(0);
    for (const v of result.violations) {
      expect(v).toHaveProperty('ruleId');
      expect(v).toHaveProperty('message');
      expect(v).toHaveProperty('line');
      expect(v).toHaveProperty('column');
      expect(v).toHaveProperty('severity');
      expect(v).toHaveProperty('category');
    }
    expect(result.pass).toBe(1);
  });

  it('passes GhaRuleContext to custom rule check() and includes violations', () => {
    const validYaml = `name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4`;

    const mockRule: GhaLintRule = {
      id: 'GA-TEST',
      title: 'Test Rule',
      severity: 'warning',
      category: 'security',
      explanation: 'Test',
      fix: { description: 'Fix', beforeCode: 'bad', afterCode: 'good' },
      check(ctx: GhaRuleContext): GhaRuleViolation[] {
        // Verify context has all required fields
        expect(ctx.doc).toBeDefined();
        expect(ctx.rawText).toBe(validYaml);
        expect(ctx.lineCounter).toBeDefined();
        expect(ctx.json).toBeDefined();

        return [{
          ruleId: 'GA-TEST',
          line: 3,
          column: 1,
          message: 'Test violation found',
        }];
      },
    };

    const result = runPass1(validYaml, [mockRule]);

    const testViolations = result.violations.filter(v => v.ruleId === 'GA-TEST');
    expect(testViolations).toHaveLength(1);
    expect(testViolations[0].severity).toBe('warning');
    expect(testViolations[0].category).toBe('security');
    expect(testViolations[0].message).toBe('Test violation found');
  });

  it('returns synchronously (does not return a Promise)', () => {
    const result = runPass1(SAMPLE_GHA_WORKFLOW);

    // If it returned a Promise, it would not have .violations directly
    expect(result).not.toBeInstanceOf(Promise);
    expect(result.violations).toBeDefined();
    expect(result.pass).toBe(1);
  });

  it('works with empty custom rules array', () => {
    const result = runPass1(SAMPLE_GHA_WORKFLOW, []);

    expect(result.violations).toEqual([]);
    expect(result.pass).toBe(1);
  });

  it('counts rules passed correctly', () => {
    const validYaml = `name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4`;

    const passingRule: GhaLintRule = {
      id: 'GA-PASS',
      title: 'Passing Rule',
      severity: 'warning',
      category: 'security',
      explanation: 'Test',
      fix: { description: 'Fix', beforeCode: 'bad', afterCode: 'good' },
      check: () => [],
    };

    const failingRule: GhaLintRule = {
      id: 'GA-FAIL',
      title: 'Failing Rule',
      severity: 'error',
      category: 'semantic',
      explanation: 'Test',
      fix: { description: 'Fix', beforeCode: 'bad', afterCode: 'good' },
      check: () => [{
        ruleId: 'GA-FAIL',
        line: 1,
        column: 1,
        message: 'Failed',
      }],
    };

    const result = runPass1(validYaml, [passingRule, failingRule]);

    expect(result.rulesPassed).toBe(1);
  });
});

describe('mergePass2', () => {
  it('deduplicates: Pass 1 violation at same position takes precedence', () => {
    const pass1Violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-C005',
        message: 'Script injection risk in run block',
        line: 5,
        column: 3,
        severity: 'warning',
        category: 'security',
      },
    ];

    const actionlintErrors: ActionlintError[] = [
      {
        kind: 'expression',
        message: 'expression injection detected',
        line: 5,
        column: 3,
      },
    ];

    const result = mergePass2(pass1Violations, actionlintErrors);

    // Only the Pass 1 violation should remain at (5, 3)
    const atPosition = result.violations.filter(v => v.line === 5 && v.column === 3);
    expect(atPosition).toHaveLength(1);
    expect(atPosition[0].ruleId).toBe('GA-C005');
    expect(result.pass).toBe(2);
  });

  it('keeps violations from both passes at different positions', () => {
    const pass1Violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-S002',
        message: 'Unknown property',
        line: 3,
        column: 5,
        severity: 'error',
        category: 'schema',
      },
    ];

    const actionlintErrors: ActionlintError[] = [
      {
        kind: 'job-needs',
        message: 'job "deploy" needs non-existent job',
        line: 10,
        column: 1,
      },
    ];

    const result = mergePass2(pass1Violations, actionlintErrors);

    expect(result.violations).toHaveLength(2);
    expect(result.violations[0].ruleId).toBe('GA-S002');
    expect(result.violations[1].ruleId).toBe('GA-L003');
  });

  it('sorts output by line then column', () => {
    const pass1Violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-C001',
        message: 'Unpinned action',
        line: 20,
        column: 5,
        severity: 'warning',
        category: 'security',
      },
    ];

    const actionlintErrors: ActionlintError[] = [
      {
        kind: 'syntax-check',
        message: 'syntax error',
        line: 5,
        column: 1,
      },
      {
        kind: 'expression',
        message: 'expression error',
        line: 10,
        column: 3,
      },
    ];

    const result = mergePass2(pass1Violations, actionlintErrors);

    expect(result.violations).toHaveLength(3);
    // Should be sorted: line 5, line 10, line 20
    expect(result.violations[0].line).toBe(5);
    expect(result.violations[1].line).toBe(10);
    expect(result.violations[2].line).toBe(20);
    expect(result.pass).toBe(2);
  });

  it('handles empty pass1 violations with actionlint errors', () => {
    const actionlintErrors: ActionlintError[] = [
      {
        kind: 'runner-label',
        message: 'unknown runner label',
        line: 8,
        column: 14,
      },
    ];

    const result = mergePass2([], actionlintErrors);

    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].ruleId).toBe('GA-L008');
  });

  it('handles empty actionlint errors with pass1 violations', () => {
    const pass1Violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-S002',
        message: 'Unknown property',
        line: 3,
        column: 5,
        severity: 'error',
        category: 'schema',
      },
    ];

    const result = mergePass2(pass1Violations, []);

    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].ruleId).toBe('GA-S002');
  });
});

describe('All unified violations have required fields', () => {
  it('every violation from runPass1 has ruleId, message, line, column, severity, category', () => {
    const schemaErrorYaml = `name: Test
on:
  push:
    branches: [main]
  invalid_event: true
jobs:
  build:
    runs-on: ubuntu-latest
    unknownProp: true
    steps:
      - uses: actions/checkout@v4`;

    const result = runPass1(schemaErrorYaml);

    for (const v of result.violations) {
      expect(v).toHaveProperty('ruleId');
      expect(typeof v.ruleId).toBe('string');
      expect(v).toHaveProperty('message');
      expect(typeof v.message).toBe('string');
      expect(v).toHaveProperty('line');
      expect(typeof v.line).toBe('number');
      expect(v).toHaveProperty('column');
      expect(typeof v.column).toBe('number');
      expect(v).toHaveProperty('severity');
      expect(['error', 'warning', 'info']).toContain(v.severity);
      expect(v).toHaveProperty('category');
      expect(['schema', 'security', 'semantic', 'best-practice', 'style', 'actionlint']).toContain(v.category);
    }
  });

  it('every violation from mergePass2 has required fields', () => {
    const pass1: GhaUnifiedViolation[] = [
      { ruleId: 'GA-S002', message: 'test', line: 1, column: 1, severity: 'error', category: 'schema' },
    ];
    const errors: ActionlintError[] = [
      { kind: 'expression', message: 'expr error', line: 5, column: 3 },
    ];

    const result = mergePass2(pass1, errors);

    for (const v of result.violations) {
      expect(v).toHaveProperty('ruleId');
      expect(v).toHaveProperty('message');
      expect(v).toHaveProperty('line');
      expect(v).toHaveProperty('column');
      expect(v).toHaveProperty('severity');
      expect(v).toHaveProperty('category');
    }
  });
});
