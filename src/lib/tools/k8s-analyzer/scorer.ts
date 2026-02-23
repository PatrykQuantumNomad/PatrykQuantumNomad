import type {
  K8sRuleViolation,
  K8sCategory,
  K8sSeverity,
  K8sScoreDeduction,
  K8sCategoryScore,
  K8sScoreResult,
} from './types';
import { allK8sRules } from './rules';
import { SCHEMA_RULE_METADATA } from './diagnostic-rules';

/** Category weights summing to 100 (SCORE-01). */
const CATEGORY_WEIGHTS: Record<K8sCategory, number> = {
  security: 35,
  reliability: 20,
  'best-practice': 20,
  schema: 15,
  'cross-resource': 10,
};

/** Per-violation severity base deductions from a category's 100-point baseline. */
const SEVERITY_DEDUCTIONS: Record<K8sSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

const ALL_CATEGORIES: K8sCategory[] = [
  'security',
  'reliability',
  'best-practice',
  'schema',
  'cross-resource',
];

/**
 * Compute a category-weighted 0-100 score with diminishing returns.
 *
 * Each violation deducts from its category's 100-point baseline. Repeated
 * violations in the same category have diminishing impact via the formula:
 *   points = basePoints / (1 + 0.3 * priorCount)
 *
 * The overall score is a weighted aggregate of per-category scores.
 *
 * Dual rule lookup: 57 lint rules from allK8sRules + 10 schema rules from
 * SCHEMA_RULE_METADATA. Schema rules use metadata objects (no check method),
 * so we iterate Object.entries() instead of importing a rule array.
 */
export function computeK8sScore(
  violations: K8sRuleViolation[],
): K8sScoreResult {
  // Build dual rule lookup from lint rules (57) and schema rules (10)
  const ruleLookup = new Map<
    string,
    { severity: K8sSeverity; category: K8sCategory }
  >();

  for (const rule of allK8sRules) {
    ruleLookup.set(rule.id, {
      severity: rule.severity,
      category: rule.category,
    });
  }

  for (const [id, meta] of Object.entries(SCHEMA_RULE_METADATA)) {
    ruleLookup.set(id, {
      severity: meta.severity,
      category: meta.category,
    });
  }

  // Track deductions per category with prior violation count for diminishing returns
  const categoryDeductions: Record<K8sCategory, K8sScoreDeduction[]> = {
    security: [],
    reliability: [],
    'best-practice': [],
    schema: [],
    'cross-resource': [],
  };

  for (const v of violations) {
    const rule = ruleLookup.get(v.ruleId);
    if (!rule) continue;

    const basePoints = SEVERITY_DEDUCTIONS[rule.severity];
    const priorCount = categoryDeductions[rule.category].length;

    // Diminishing returns: each additional violation in a category deducts less
    const points =
      Math.round((basePoints / (1 + 0.3 * priorCount)) * 100) / 100;

    const deduction: K8sScoreDeduction = {
      ruleId: v.ruleId,
      category: rule.category,
      severity: rule.severity,
      points,
      line: v.line,
    };
    categoryDeductions[rule.category].push(deduction);
  }

  // Compute per-category scores (floor at 0)
  const categories: K8sCategoryScore[] = ALL_CATEGORIES.map((cat) => {
    const deductions = categoryDeductions[cat];
    const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
    return {
      category: cat,
      score: Math.max(0, Math.round((100 - totalDeduction) * 100) / 100),
      weight: CATEGORY_WEIGHTS[cat],
      deductions,
    };
  });

  // Weighted aggregate
  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score * (c.weight / 100), 0),
  );

  const allDeductions = categories.flatMap((c) => c.deductions);

  return {
    overall,
    grade: computeGrade(overall),
    categories,
    deductions: allDeductions,
  };
}

function computeGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}
