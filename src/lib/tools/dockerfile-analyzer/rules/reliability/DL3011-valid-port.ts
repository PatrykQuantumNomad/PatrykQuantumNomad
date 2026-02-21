import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3011: LintRule = {
  id: 'DL3011',
  title: 'Valid UNIX ports range from 0 to 65535',
  severity: 'error',
  category: 'reliability',
  explanation:
    'EXPOSE with an invalid port number (outside 0-65535) is silently accepted by ' +
    'Docker but has no effect. This is almost always a typo or misconfiguration that ' +
    'wastes debugging time when the expected port is not accessible. Valid TCP/UDP ' +
    'ports range from 0 to 65535.',
  fix: {
    description: 'Use a valid port number between 0 and 65535',
    beforeCode: 'EXPOSE 99999',
    afterCode: 'EXPOSE 8080',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'EXPOSE') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // EXPOSE can have multiple ports: EXPOSE 80 443 8080/tcp
      const tokens = args.trim().split(/\s+/);

      for (const token of tokens) {
        // Skip variable references (e.g., $PORT, ${PORT}) -- resolved at build time
        if (/\$\{?\w+\}?/.test(token)) continue;

        // Handle port/protocol format (e.g., 8080/tcp)
        const portStr = token.split('/')[0];
        const port = Number.parseInt(portStr, 10);

        if (Number.isNaN(port) || port < 0 || port > 65535) {
          const range = inst.getRange();
          violations.push({
            ruleId: this.id,
            line: range.start.line + 1,
            column: 1,
            message: `Invalid port '${token}'. Valid ports range from 0 to 65535.`,
          });
        }
      }
    }

    return violations;
  },
};
