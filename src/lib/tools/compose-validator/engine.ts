import type { ComposeRuleContext, ComposeRuleViolation } from './types';
import type { ComposeParseResult } from './parser';
import { allComposeRules } from './rules';
import { validateComposeSchema, categorizeSchemaErrors } from './schema-validator';

/** Result from the compose rule engine. */
export interface ComposeEngineResult {
  violations: ComposeRuleViolation[];
  rulesRun: number;
  rulesPassed: number;
}

/**
 * Run the full Compose validation pipeline:
 * 1. Collect parse errors (CV-S001) from the parser result
 * 2. Run JSON Schema validation (CV-S002 through CV-S008)
 * 3. Run all 44 custom lint rules (semantic, security, best-practice, style)
 *
 * Returns violations sorted by line then column, plus rule execution stats.
 */
export function runComposeEngine(
  parseResult: ComposeParseResult,
  rawText: string,
): ComposeEngineResult {
  const violations: ComposeRuleViolation[] = [...parseResult.parseErrors];
  let rulesPassed = 0;

  // Schema validation (requires normalised JSON from interpolation pass)
  if (parseResult.normalizedJson) {
    const schemaErrors = validateComposeSchema(parseResult.normalizedJson);
    const schemaViolations = categorizeSchemaErrors(
      schemaErrors,
      parseResult.doc,
      parseResult.lineCounter,
    );
    violations.push(...schemaViolations);
  }

  // Custom lint rules (require parsed JSON for context)
  if (parseResult.json) {
    const ctx: ComposeRuleContext = {
      doc: parseResult.doc,
      rawText,
      lineCounter: parseResult.lineCounter,
      json: parseResult.json,
      services: parseResult.services,
      networks: parseResult.networks,
      volumes: parseResult.volumes,
      secrets: parseResult.secrets,
      configs: parseResult.configs,
    };

    for (const rule of allComposeRules) {
      const ruleViolations = rule.check(ctx);
      if (ruleViolations.length === 0) {
        rulesPassed++;
      }
      violations.push(...ruleViolations);
    }
  }

  // Sort by line, then column for consistent output
  violations.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    violations,
    rulesRun: allComposeRules.length + 8, // 44 custom + 8 schema rules
    rulesPassed,
  };
}
