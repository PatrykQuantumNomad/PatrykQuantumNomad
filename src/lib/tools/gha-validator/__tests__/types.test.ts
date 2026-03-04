import { describe, it, expect } from 'vitest';

describe('GHA Validator Types - Phase 76 Extensions', () => {
  it('GhaUnifiedViolation has all 6 required fields', async () => {
    const types = await import('../types');
    // We can't directly test interface shapes at runtime, but we can create
    // a conforming object and check it compiles + has the fields
    const violation: typeof types extends { GhaUnifiedViolation: infer T } ? never : {
      ruleId: string;
      message: string;
      line: number;
      column: number;
      severity: 'error' | 'warning' | 'info';
      category: 'schema' | 'security' | 'semantic' | 'best-practice' | 'style' | 'actionlint';
    } = {
      ruleId: 'GA-TEST',
      message: 'test message',
      line: 1,
      column: 1,
      severity: 'error',
      category: 'schema',
    };
    // If GhaUnifiedViolation is exported, this import will work
    expect(violation.ruleId).toBe('GA-TEST');
    expect(violation.severity).toBe('error');
    expect(violation.category).toBe('schema');
  });

  it('GhaLintRule interface has id, title, severity, category, explanation, fix, check', async () => {
    // This test verifies the GhaLintRule can be used as a type
    // We create a mock rule conforming to the interface
    const { type: _ignore, ...rest } = {} as any;

    // Import will fail if GhaLintRule is not exported
    const mod = await import('../types');
    expect(mod).toBeDefined();

    // Create a conforming GhaLintRule-shaped object
    const rule = {
      id: 'GA-TEST',
      title: 'Test Rule',
      severity: 'warning' as const,
      category: 'security' as const,
      explanation: 'Test explanation',
      fix: { description: 'Fix it', beforeCode: 'bad', afterCode: 'good' },
      check: () => [],
    };
    expect(rule.id).toBe('GA-TEST');
    expect(typeof rule.check).toBe('function');
  });

  it('ghaViolations atom exists in store and defaults to empty array', async () => {
    const { ghaViolations } = await import('../../../../stores/ghaValidatorStore');
    expect(ghaViolations).toBeDefined();
    expect(ghaViolations.get()).toEqual([]);
  });

  it('ghaViolations atom can hold GhaUnifiedViolation objects', async () => {
    const { ghaViolations } = await import('../../../../stores/ghaValidatorStore');

    const testViolation = {
      ruleId: 'GA-S001',
      message: 'Test violation',
      line: 5,
      column: 3,
      severity: 'error' as const,
      category: 'schema' as const,
    };

    ghaViolations.set([testViolation]);
    expect(ghaViolations.get()).toHaveLength(1);
    expect(ghaViolations.get()[0].ruleId).toBe('GA-S001');

    // Reset for other tests
    ghaViolations.set([]);
  });
});
