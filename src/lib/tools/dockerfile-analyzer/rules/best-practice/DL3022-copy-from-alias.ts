import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3022: LintRule = {
  id: 'DL3022',
  title: 'COPY --from should reference a named build stage',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Using numeric references in COPY --from=0 is fragile. If build stages are ' +
    'reordered, added, or removed, the numeric index silently points to the wrong ' +
    'stage. In production, this causes builds that appear correct but copy files ' +
    'from the wrong stage, leading to subtle runtime bugs. Named aliases (AS builder) ' +
    'make multi-stage builds self-documenting and refactor-safe.',
  fix: {
    description:
      'Use a named alias instead of a numeric stage reference',
    beforeCode: 'COPY --from=0 /app/build /usr/share/nginx/html',
    afterCode: 'COPY --from=builder /app/build /usr/share/nginx/html',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const copies = dockerfile.getCOPYs();

    for (const copy of copies) {
      const fromFlag = copy.getFromFlag();
      if (!fromFlag) continue;

      const fromValue = fromFlag.getValue();
      if (fromValue === null) continue;

      // Check if the --from value is a numeric string
      if (/^\d+$/.test(fromValue.trim())) {
        const range = copy.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `COPY --from=${fromValue} uses a numeric index. Use a named alias instead.`,
        });
      }
    }

    return violations;
  },
};
