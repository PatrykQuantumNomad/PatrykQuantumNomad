import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3025: LintRule = {
  id: 'DL3025',
  title: 'Use arguments JSON notation for CMD and ENTRYPOINT',
  severity: 'warning',
  category: 'maintainability',
  explanation:
    'Shell form (CMD command args) wraps the command in /bin/sh -c, which means ' +
    'the process runs as a child of the shell. In production, this prevents proper ' +
    'signal propagation -- SIGTERM sent by Docker to stop a container reaches the ' +
    'shell, not your application, causing ungraceful shutdowns. JSON form ' +
    '(CMD ["command", "args"]) runs the process directly and receives signals correctly.',
  fix: {
    description: 'Convert shell form to JSON array form',
    beforeCode: 'CMD node server.js',
    afterCode: 'CMD ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check CMD instructions
    for (const cmd of dockerfile.getCMDs()) {
      const args = cmd.getArgumentsContent();
      if (!args) continue;

      if (!args.trim().startsWith('[')) {
        const range = cmd.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Use JSON notation for CMD (e.g., CMD ["node", "server.js"]). Shell form prevents proper signal handling.',
        });
      }
    }

    // Check ENTRYPOINT instructions
    for (const ep of dockerfile.getENTRYPOINTs()) {
      const args = ep.getArgumentsContent();
      if (!args) continue;

      if (!args.trim().startsWith('[')) {
        const range = ep.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Use JSON notation for ENTRYPOINT (e.g., ENTRYPOINT ["node", "server.js"]). Shell form prevents proper signal handling.',
        });
      }
    }

    return violations;
  },
};
