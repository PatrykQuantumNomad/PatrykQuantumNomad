import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3019: LintRule = {
  id: 'DL3019',
  title: 'Use the --no-cache switch for apk add',
  severity: 'info',
  category: 'efficiency',
  explanation:
    'Without --no-cache, apk stores a local package index in /var/cache/apk/ that ' +
    'adds unnecessary size to Alpine-based images. In production, Alpine images are ' +
    'chosen specifically for their small size (5 MB base), so leaving the apk cache ' +
    'undermines that advantage. Use --no-cache to avoid storing the index entirely.',
  fix: {
    description: 'Add --no-cache to apk add',
    beforeCode: 'RUN apk update && apk add curl',
    afterCode: 'RUN apk add --no-cache curl',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (!/\bapk\s+add\b/.test(args)) continue;

      if (!args.includes('--no-cache')) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'apk add without --no-cache. Add --no-cache to reduce image size.',
        });
      }
    }

    return violations;
  },
};
