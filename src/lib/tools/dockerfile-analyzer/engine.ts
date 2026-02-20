import type { Dockerfile } from 'dockerfile-ast';
import type { RuleViolation } from './types';
import { allRules } from './rules';

export interface EngineResult {
  violations: RuleViolation[];
  rulesRun: number;
  rulesPassed: number;
}

export function runRuleEngine(
  dockerfile: Dockerfile,
  rawText: string,
): EngineResult {
  const violations: RuleViolation[] = [];
  let rulesPassed = 0;

  for (const rule of allRules) {
    const ruleViolations = rule.check(dockerfile, rawText);
    if (ruleViolations.length === 0) {
      rulesPassed++;
    }
    violations.push(...ruleViolations);
  }

  // Sort by line number, then column for consistent output
  violations.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    violations,
    rulesRun: allRules.length,
    rulesPassed,
  };
}
