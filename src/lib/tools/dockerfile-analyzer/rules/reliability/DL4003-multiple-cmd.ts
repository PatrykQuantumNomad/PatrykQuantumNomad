import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL4003: LintRule = {
  id: 'DL4003',
  title: 'Multiple CMD instructions found',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'Only the last CMD instruction takes effect. Multiple CMD instructions in a ' +
    'stage are almost always a mistake because the earlier ones are silently ignored. ' +
    'This leads to confusion when developers expect a specific CMD to run but Docker ' +
    'quietly uses only the last one. Keep a single CMD per stage.',
  fix: {
    description: 'Remove duplicate CMD instructions, keep only the final one',
    beforeCode: 'CMD ["echo", "first"]\nCMD ["echo", "second"]',
    afterCode: 'CMD ["echo", "second"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    if (froms.length === 0) return violations;

    // Find the last FROM instruction (start of final stage)
    const lastFrom = froms[froms.length - 1];
    const lastFromLine = lastFrom.getRange().start.line;

    // Find CMD instructions in the final stage
    const cmds = dockerfile
      .getCMDs()
      .filter((cmd) => cmd.getRange().start.line > lastFromLine);

    // If more than 1 CMD in final stage, flag all but the last
    if (cmds.length > 1) {
      for (let i = 0; i < cmds.length - 1; i++) {
        const range = cmds[i].getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Multiple CMD instructions found. Only the last one takes effect.',
        });
      }
    }

    return violations;
  },
};
