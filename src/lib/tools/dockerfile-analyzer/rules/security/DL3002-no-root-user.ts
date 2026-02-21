import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3002: LintRule = {
  id: 'DL3002',
  title: 'Last USER should not be root',
  severity: 'warning',
  category: 'security',
  explanation:
    'Running a container as root gives the process full host-level privileges if it ' +
    'escapes the container. A vulnerability in your application could grant an attacker ' +
    'root access to the host, which is why this is one of the most critical security ' +
    'risks in containerized workloads. Always switch to a non-root user after ' +
    'performing root-only setup tasks.',
  fix: {
    description: 'Add a non-root USER instruction at the end of the Dockerfile',
    beforeCode: 'USER root\nCMD ["node", "server.js"]',
    afterCode: 'USER node\nCMD ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    if (froms.length === 0) return violations;

    // Find the last FROM instruction (start of final stage)
    const lastFrom = froms.at(-1);
    if (!lastFrom) return violations;
    const lastFromLine = lastFrom.getRange().start.line;

    // Find USER instructions in the final stage (after the last FROM)
    const allInstructions = dockerfile.getInstructions();
    const userInstructions = allInstructions.filter(
      (inst) =>
        inst.getKeyword() === 'USER' &&
        inst.getRange().start.line > lastFromLine,
    );

    if (userInstructions.length === 0) {
      // No USER instruction in final stage -- do NOT flag (DL3002 only flags explicit USER root)
      return violations;
    }

    // Check the LAST USER instruction in the final stage
    const lastUser = userInstructions.at(-1);
    if (!lastUser) return violations;
    const userArg = lastUser.getArgumentsContent()?.trim();

    if (userArg === 'root' || userArg === '0') {
      const range = lastUser.getRange();
      violations.push({
        ruleId: this.id,
        line: range.start.line + 1,
        column: 1,
        message:
          'Last USER instruction sets root. Switch to a non-root user for security.',
      });
    }

    return violations;
  },
};
