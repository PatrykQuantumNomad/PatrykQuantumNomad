/**
 * Tests for getRelatedGhaRules() function.
 *
 * Mirrors the compose-validator related rules pattern:
 * filter same category, sort by severity, slice to limit.
 */

import { describe, it, expect } from 'vitest';
import { getRelatedGhaRules } from '../related';
import { allDocumentedGhaRules, getGhaRuleById } from '../index';

describe('getRelatedGhaRules', () => {
  it('returns same-category (security) rules for GA-C001, excluding GA-C001', () => {
    const related = getRelatedGhaRules('GA-C001');
    expect(related.length).toBeGreaterThan(0);
    // All results should be in the same category as GA-C001
    const sourceRule = getGhaRuleById('GA-C001');
    expect(sourceRule).toBeDefined();
    for (const r of related) {
      expect(r.category).toBe(sourceRule!.category);
    }
    // Should not include self
    const ids = related.map((r) => r.id);
    expect(ids).not.toContain('GA-C001');
  });

  it('results sorted by severity (error first, then warning, then info)', () => {
    const related = getRelatedGhaRules('GA-C001');
    const severityOrder = { error: 0, warning: 1, info: 2 } as const;
    for (let i = 1; i < related.length; i++) {
      const prev = severityOrder[related[i - 1].severity];
      const curr = severityOrder[related[i].severity];
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('default limit is 5 rules', () => {
    // Security category has many rules (10 custom + 2 actionlint = 12 total)
    // so default limit should cap at 5
    const related = getRelatedGhaRules('GA-C001');
    expect(related.length).toBeLessThanOrEqual(5);
  });

  it('respects custom limit (2)', () => {
    const related = getRelatedGhaRules('GA-C001', 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array for unknown ID', () => {
    const related = getRelatedGhaRules('GA-X999');
    expect(related).toEqual([]);
  });

  it('returns other schema rules for a schema rule', () => {
    const related = getRelatedGhaRules('GA-S001');
    expect(related.length).toBeGreaterThan(0);
    for (const r of related) {
      expect(r.category).toBe('schema');
    }
    const ids = related.map((r) => r.id);
    expect(ids).not.toContain('GA-S001');
  });
});
