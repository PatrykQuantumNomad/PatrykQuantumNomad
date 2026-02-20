import type {
  RuleViolation,
  RuleCategory,
  RuleSeverity,
  ScoreDeduction,
  CategoryScore,
  ScoreResult,
} from './types';
import { allRules } from './rules';

const CATEGORY_WEIGHTS: Record<RuleCategory, number> = {
  security: 30,
  efficiency: 25,
  maintainability: 20,
  reliability: 15,
  'best-practice': 10,
};

// Per-violation severity base deductions from a category's 100-point baseline
const SEVERITY_DEDUCTIONS: Record<RuleSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

const ALL_CATEGORIES: RuleCategory[] = [
  'security',
  'efficiency',
  'maintainability',
  'reliability',
  'best-practice',
];

export function computeScore(violations: RuleViolation[]): ScoreResult {
  // Build a rule lookup for severity/category
  const ruleLookup = new Map(allRules.map((r) => [r.id, r]));

  // Track deductions per category with prior violation count for diminishing returns
  const categoryDeductions: Record<RuleCategory, ScoreDeduction[]> = {
    security: [],
    efficiency: [],
    maintainability: [],
    reliability: [],
    'best-practice': [],
  };

  for (const v of violations) {
    const rule = ruleLookup.get(v.ruleId);
    if (!rule) continue;

    const basePoints = SEVERITY_DEDUCTIONS[rule.severity];
    const priorCount = categoryDeductions[rule.category].length;

    // Diminishing returns: each additional violation in a category deducts less
    const points =
      Math.round((basePoints / (1 + 0.3 * priorCount)) * 100) / 100;

    const deduction: ScoreDeduction = {
      ruleId: v.ruleId,
      category: rule.category,
      severity: rule.severity,
      points,
      line: v.line,
    };
    categoryDeductions[rule.category].push(deduction);
  }

  // Compute per-category scores (floor at 0)
  const categories: CategoryScore[] = ALL_CATEGORIES.map((cat) => {
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
