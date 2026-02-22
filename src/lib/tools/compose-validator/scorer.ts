import type {
  ComposeRuleViolation,
  ComposeCategory,
  ComposeSeverity,
  ComposeScoreDeduction,
  ComposeCategoryScore,
  ComposeScoreResult,
} from './types';
import { allComposeRules } from './rules';
import { schemaRules } from './rules/schema';

/** Category weights summing to 100. */
const CATEGORY_WEIGHTS: Record<ComposeCategory, number> = {
  security: 30,
  semantic: 25,
  'best-practice': 20,
  schema: 15,
  style: 10,
};

/** Per-violation severity base deductions from a category's 100-point baseline. */
const SEVERITY_DEDUCTIONS: Record<ComposeSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

const ALL_CATEGORIES: ComposeCategory[] = [
  'security',
  'semantic',
  'best-practice',
  'schema',
  'style',
];

/**
 * Compute a category-weighted 0-100 score with diminishing returns.
 *
 * Each violation deducts from its category's 100-point baseline. Repeated
 * violations in the same category have diminishing impact via the formula:
 *   points = basePoints / (1 + 0.3 * priorCount)
 *
 * The overall score is a weighted aggregate of per-category scores.
 */
export function computeComposeScore(
  violations: ComposeRuleViolation[],
): ComposeScoreResult {
  // Build rule lookup from both custom rules (44) and schema rules (8)
  const ruleLookup = new Map<
    string,
    { severity: ComposeSeverity; category: ComposeCategory }
  >();

  for (const rule of allComposeRules) {
    ruleLookup.set(rule.id, {
      severity: rule.severity,
      category: rule.category,
    });
  }

  for (const rule of schemaRules) {
    ruleLookup.set(rule.id, {
      severity: rule.severity,
      category: rule.category,
    });
  }

  // Track deductions per category with prior violation count for diminishing returns
  const categoryDeductions: Record<ComposeCategory, ComposeScoreDeduction[]> = {
    security: [],
    semantic: [],
    'best-practice': [],
    schema: [],
    style: [],
  };

  for (const v of violations) {
    const rule = ruleLookup.get(v.ruleId);
    if (!rule) continue;

    const basePoints = SEVERITY_DEDUCTIONS[rule.severity];
    const priorCount = categoryDeductions[rule.category].length;

    // Diminishing returns: each additional violation in a category deducts less
    const points =
      Math.round((basePoints / (1 + 0.3 * priorCount)) * 100) / 100;

    const deduction: ComposeScoreDeduction = {
      ruleId: v.ruleId,
      category: rule.category,
      severity: rule.severity,
      points,
      line: v.line,
    };
    categoryDeductions[rule.category].push(deduction);
  }

  // Compute per-category scores (floor at 0)
  const categories: ComposeCategoryScore[] = ALL_CATEGORIES.map((cat) => {
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
