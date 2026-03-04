/**
 * Tests for schema rule metadata objects GA-S001 through GA-S008.
 *
 * These are no-op metadata rules (same pattern as actionlint metadata)
 * that provide documentation content for per-rule documentation pages.
 */

import { describe, it, expect } from 'vitest';
import { schemaRules } from '../schema/index';

// ── Barrel export ────────────────────────────────────────────────────

describe('schemaRules barrel', () => {
  it('exports exactly 8 rules', () => {
    expect(schemaRules).toHaveLength(8);
  });

  it('each rule has id matching GA-S00[1-8] pattern', () => {
    const ids = schemaRules.map((r) => r.id);
    expect(ids).toEqual([
      'GA-S001', 'GA-S002', 'GA-S003', 'GA-S004',
      'GA-S005', 'GA-S006', 'GA-S007', 'GA-S008',
    ]);
  });

  it('every rule has category === "schema"', () => {
    for (const rule of schemaRules) {
      expect(rule.category).toBe('schema');
    }
  });

  it('every rule has non-empty explanation (> 20 chars)', () => {
    for (const rule of schemaRules) {
      expect(rule.explanation.length).toBeGreaterThan(20);
    }
  });

  it('every rule has fix.description, fix.beforeCode, fix.afterCode (all non-empty)', () => {
    for (const rule of schemaRules) {
      expect(rule.fix.description).toBeTruthy();
      expect(rule.fix.beforeCode).toBeTruthy();
      expect(rule.fix.afterCode).toBeTruthy();
    }
  });

  it('every rule has a no-op check() that returns []', () => {
    for (const rule of schemaRules) {
      expect(typeof rule.check).toBe('function');
      // Call with a minimal mock context
      const result = rule.check({} as never);
      expect(result).toEqual([]);
    }
  });
});

// ── Individual rule metadata ─────────────────────────────────────────

describe('GA-S001: YAML syntax error', () => {
  it('has severity "error" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S001');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('error');
    expect(rule!.title).toBe('YAML syntax error');
  });
});

describe('GA-S002: Unknown property', () => {
  it('has severity "error" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S002');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('error');
    expect(rule!.title).toBe('Unknown property');
  });
});

describe('GA-S003: Type mismatch', () => {
  it('has severity "error" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S003');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('error');
    expect(rule!.title).toBe('Type mismatch');
  });
});

describe('GA-S004: Missing required field', () => {
  it('has severity "error" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S004');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('error');
    expect(rule!.title).toBe('Missing required field');
  });
});

describe('GA-S005: Invalid enum value', () => {
  it('has severity "warning" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S005');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('warning');
    expect(rule!.title).toBe('Invalid enum value');
  });
});

describe('GA-S006: Invalid format', () => {
  it('has severity "warning" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S006');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('warning');
    expect(rule!.title).toBe('Invalid format');
  });
});

describe('GA-S007: Pattern mismatch', () => {
  it('has severity "warning" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S007');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('warning');
    expect(rule!.title).toBe('Pattern mismatch');
  });
});

describe('GA-S008: Invalid structure', () => {
  it('has severity "info" and correct title', () => {
    const rule = schemaRules.find((r) => r.id === 'GA-S008');
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe('info');
    expect(rule!.title).toBe('Invalid structure');
  });
});
