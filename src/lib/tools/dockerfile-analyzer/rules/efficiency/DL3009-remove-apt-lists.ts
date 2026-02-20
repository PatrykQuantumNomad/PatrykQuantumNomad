import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3009: LintRule = {
  id: 'DL3009',
  title: 'Delete the apt-get lists after installing',
  severity: 'info',
  category: 'efficiency',
  explanation:
    'After apt-get update && apt-get install, the package lists in /var/lib/apt/lists/ ' +
    'remain in the image layer, adding 20-40 MB of unnecessary data. In production, ' +
    'this inflates image size and slows container downloads. Always remove apt lists ' +
    'in the same RUN instruction to keep the layer lean.',
  fix: {
    description: 'Add rm -rf /var/lib/apt/lists/* in the same RUN instruction',
    beforeCode:
      'RUN apt-get update && apt-get install -y curl',
    afterCode:
      'RUN apt-get update && apt-get install -y curl \\\n' +
      '    && rm -rf /var/lib/apt/lists/*',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    // Check all RUN instructions for apt-get install
    let hasAptInstall = false;
    let hasAptListCleanup = false;
    let firstInstallInst: typeof instructions[0] | null = null;

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (/apt-get\s+install/.test(args)) {
        if (!hasAptInstall) {
          hasAptInstall = true;
          firstInstallInst = inst;
        }
      }

      if (/rm\s+-rf?\s+\/var\/lib\/apt\/lists/.test(args)) {
        hasAptListCleanup = true;
      }
    }

    // Flag once per Dockerfile if install exists without cleanup
    if (hasAptInstall && !hasAptListCleanup && firstInstallInst) {
      const range = firstInstallInst.getRange();
      violations.push({
        ruleId: this.id,
        line: range.start.line + 1,
        column: 1,
        message:
          'apt-get install without cleaning apt lists. Add rm -rf /var/lib/apt/lists/*.',
      });
    }

    return violations;
  },
};
