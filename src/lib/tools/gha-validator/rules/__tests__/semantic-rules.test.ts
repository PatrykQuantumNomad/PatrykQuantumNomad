/**
 * Tests for actionlint metadata rules GA-L001 through GA-L018.
 *
 * Verifies that all 18 rules have complete metadata fields,
 * sequential IDs, WASM unavailability documentation for GA-L017/L018,
 * no-op check() methods, and correct title lookup.
 */

import { describe, it, expect } from 'vitest';
import { parseGhaWorkflow } from '../../parser';
import type { GhaRuleContext } from '../../types';
import { actionlintMetaRules, getActionlintRuleTitle } from '../semantic';

/** Build a minimal GhaRuleContext for no-op check() calls. */
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

const MINIMAL_WORKFLOW = `name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4`;

const ctx = makeContext(MINIMAL_WORKFLOW);

describe('Actionlint metadata rules (GA-L001 through GA-L018)', () => {
  it('exports exactly 18 rules', () => {
    expect(actionlintMetaRules).toHaveLength(18);
  });

  it('all 18 rules have required metadata fields', () => {
    for (const rule of actionlintMetaRules) {
      expect(rule.id).toMatch(/^GA-L\d{3}$/);
      expect(rule.title).toBeTruthy();
      expect(rule.explanation).toBeTruthy();
      expect(rule.fix).toBeDefined();
      expect(rule.fix.description).toBeTruthy();
      expect(rule.fix.beforeCode).toBeTruthy();
      expect(rule.fix.afterCode).toBeTruthy();
      expect(['error', 'warning']).toContain(rule.severity);
      expect(['semantic', 'security', 'best-practice', 'actionlint']).toContain(
        rule.category,
      );
    }
  });

  it('rule IDs are sequential GA-L001 through GA-L018', () => {
    const ids = actionlintMetaRules.map((r) => r.id);
    for (let i = 1; i <= 18; i++) {
      expect(ids).toContain(`GA-L${String(i).padStart(3, '0')}`);
    }
  });

  it('GA-L015 (deprecated-commands) has best-practice category', () => {
    const rule = actionlintMetaRules.find((r) => r.id === 'GA-L015');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('best-practice');
    expect(rule!.severity).toBe('warning');
  });

  it('GA-L016 (if-cond) has semantic category', () => {
    const rule = actionlintMetaRules.find((r) => r.id === 'GA-L016');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('semantic');
    expect(rule!.severity).toBe('warning');
  });

  it('GA-L017 (shellcheck) explanation mentions WASM unavailability', () => {
    const rule = actionlintMetaRules.find((r) => r.id === 'GA-L017');
    expect(rule).toBeDefined();
    expect(rule!.explanation).toMatch(/wasm|browser|cli/i);
  });

  it('GA-L018 (pyflakes) explanation mentions WASM unavailability', () => {
    const rule = actionlintMetaRules.find((r) => r.id === 'GA-L018');
    expect(rule).toBeDefined();
    expect(rule!.explanation).toMatch(/wasm|browser|cli/i);
  });

  it('check() returns empty array for all metadata rules (no-op)', () => {
    for (const rule of actionlintMetaRules) {
      const violations = rule.check(ctx);
      expect(violations).toEqual([]);
    }
  });

  it('getActionlintRuleTitle returns correct title for each rule', () => {
    for (const rule of actionlintMetaRules) {
      expect(getActionlintRuleTitle(rule.id)).toBe(rule.title);
    }
  });

  it('getActionlintRuleTitle returns undefined for unknown ID', () => {
    expect(getActionlintRuleTitle('GA-X999')).toBeUndefined();
  });

  it('GA-L011 (credentials) has security category', () => {
    const rule = actionlintMetaRules.find((r) => r.id === 'GA-L011');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('security');
  });

  it('GA-L013 (permissions) has security category', () => {
    const rule = actionlintMetaRules.find((r) => r.id === 'GA-L013');
    expect(rule).toBeDefined();
    expect(rule!.category).toBe('security');
  });

  it('all rules have distinct IDs', () => {
    const ids = actionlintMetaRules.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(18);
  });
});
