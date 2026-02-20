import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3012: LintRule = {
  id: 'DL3012',
  title: 'Multiple HEALTHCHECK instructions',
  severity: 'error',
  category: 'reliability',
  explanation:
    'Only the last HEALTHCHECK instruction takes effect. Multiple HEALTHCHECK ' +
    'instructions are always a mistake -- the earlier ones are silently overridden. ' +
    'In production, this causes confusion when health checks do not behave as expected ' +
    'because the intended check was overridden by a later one. Keep a single ' +
    'HEALTHCHECK per Dockerfile.',
  fix: {
    description:
      'Remove duplicate HEALTHCHECK instructions, keep only the final one',
    beforeCode:
      'HEALTHCHECK CMD curl http://localhost/\nHEALTHCHECK CMD curl http://localhost/health',
    afterCode: 'HEALTHCHECK CMD curl http://localhost/health',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const healthchecks = dockerfile.getHEALTHCHECKs();

    if (healthchecks.length > 1) {
      // Flag all HEALTHCHECK instructions after the first one
      for (let i = 1; i < healthchecks.length; i++) {
        const range = healthchecks[i].getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Multiple HEALTHCHECK instructions. Only the last one takes effect.',
        });
      }
    }

    return violations;
  },
};
