import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

const INTERACTIVE_COMMANDS = [
  'ssh',
  'vim',
  'shutdown',
  'service',
  'ps',
  'free',
  'top',
  'kill',
  'mount',
  'ifconfig',
  'nano',
  'systemctl',
];

const commandPattern = new RegExp(
  String.raw`\b(${INTERACTIVE_COMMANDS.join('|')})\b`,
);

export const DL3001: LintRule = {
  id: 'DL3001',
  title: 'Avoid using interactive or system commands in RUN',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Commands like ssh, vim, shutdown, service, ps, free, top, kill, and mount are ' +
    'interactive or system-level tools meant for live server administration. In a ' +
    'Dockerfile, they suggest the container is being treated like a VM instead of as ' +
    'an immutable application package. These commands either do not work in a container ' +
    'context or indicate architectural anti-patterns.',
  fix: {
    description:
      'Remove interactive/system commands and use proper container patterns',
    beforeCode: 'RUN service nginx start',
    afterCode: 'CMD ["nginx", "-g", "daemon off;"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      const match = commandPattern.exec(args);
      if (match) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `Avoid using '${match[1]}' in RUN. It suggests the container is used like a VM.`,
        });
      }
    }

    return violations;
  },
};
