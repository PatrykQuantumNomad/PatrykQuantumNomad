/**
 * Category-weighted scoring engine for GitHub Actions workflows.
 *
 * Converts an array of GhaUnifiedViolation into a 0-100 overall score with
 * letter grade, per-category sub-scores, and a flat deduction list.
 *
 * Category weights (SCORE-01):
 *   Schema 15% | Security 35% | Semantic 20% | Best Practice 20% | Style 10%
 *
 * The 'actionlint' category (GA-L017 shellcheck, GA-L018 pyflakes, GA-L000
 * fallback) is excluded from scoring entirely -- these rules cannot fire in
 * the browser WASM build.
 *
 * Diminishing returns formula (same as Dockerfile Analyzer):
 *   points = basePoints / (1 + 0.3 * priorCount)
 *
 * Ported from src/lib/tools/dockerfile-analyzer/scorer.ts with GHA-specific
 * category weights. Key simplification: GHA violations already carry severity
 * and category, so no rule lookup map is needed.
 */

import type {
  GhaUnifiedViolation,
  GhaSeverity,
  GhaScoreDeduction,
  GhaCategoryScore,
  GhaScoreResult,
} from './types';

// ── Category weights (SCORE-01) ─────────────────────────────────────

const CATEGORY_WEIGHTS: Record<string, number> = {
  schema: 15,
  security: 35,
  semantic: 20,
  'best-practice': 20,
  style: 10,
};

// ── Severity base deductions ────────────────────────────────────────

const SEVERITY_DEDUCTIONS: Record<GhaSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

// ── Scored categories (excludes 'actionlint') ───────────────────────

const SCORED_CATEGORIES: string[] = [
  'schema',
  'security',
  'semantic',
  'best-practice',
  'style',
];

// ── Main scoring function ───────────────────────────────────────────

/**
 * Compute a category-weighted score from an array of unified violations.
 *
 * @param violations - All violations from the engine (both passes).
 *   Violations with category 'actionlint' are silently skipped.
 * @returns GhaScoreResult with overall score, letter grade, per-category
 *   breakdowns, and a flat deduction list.
 */
export function computeGhaScore(
  violations: GhaUnifiedViolation[],
): GhaScoreResult {
  // Initialize per-category deduction tracking
  const categoryDeductions: Record<string, GhaScoreDeduction[]> = {};
  for (const cat of SCORED_CATEGORIES) {
    categoryDeductions[cat] = [];
  }

  // Process each violation
  for (const v of violations) {
    // Skip actionlint-category violations (0% weight, excluded entirely)
    if (!SCORED_CATEGORIES.includes(v.category)) continue;

    const basePoints = SEVERITY_DEDUCTIONS[v.severity];
    const priorCount = categoryDeductions[v.category].length;

    // Diminishing returns: each additional violation in a category deducts less
    const points =
      Math.round((basePoints / (1 + 0.3 * priorCount)) * 100) / 100;

    categoryDeductions[v.category].push({
      ruleId: v.ruleId,
      category: v.category,
      severity: v.severity,
      points,
      line: v.line,
    });
  }

  // Compute per-category scores (floor at 0)
  const categories: GhaCategoryScore[] = SCORED_CATEGORIES.map((cat) => {
    const deductions = categoryDeductions[cat];
    const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
    return {
      category: cat,
      score: Math.max(0, Math.round((100 - totalDeduction) * 100) / 100),
      weight: CATEGORY_WEIGHTS[cat],
      deductions,
    };
  });

  // Weighted aggregate (SCORE-03)
  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score * (c.weight / 100), 0),
  );

  // Flat deduction list
  const allDeductions = categories.flatMap((c) => c.deductions);

  return {
    overall,
    grade: computeGrade(overall),
    categories,
    deductions: allDeductions,
  };
}

// ── Grade computation (SCORE-02) ────────────────────────────────────

/**
 * Map a numeric 0-100 score to a letter grade.
 *
 * Thresholds: 97+ A+, 93+ A, 90+ A-, 87+ B+, 83+ B, 80+ B-,
 *             77+ C+, 73+ C, 70+ C-, 67+ D+, 63+ D, 60+ D-, <60 F
 */
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
