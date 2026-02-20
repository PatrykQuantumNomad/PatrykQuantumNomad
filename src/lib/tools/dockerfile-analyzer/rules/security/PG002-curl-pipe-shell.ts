import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG002: LintRule = {
  id: 'PG002',
  title: 'Avoid piping remote scripts to shell',
  severity: 'error',
  category: 'security',
  explanation:
    'Piping curl or wget output directly to a shell (sh, bash, zsh) executes remote ' +
    'code without any verification. In production, this is a supply-chain attack vector ' +
    '-- if the remote server is compromised or performs a MITM attack, arbitrary code ' +
    'runs in your build with full root privileges. Instead, download the script first, ' +
    'verify its checksum, then execute it.',
  fix: {
    description:
      'Download the script first, verify its checksum, then execute it',
    beforeCode: 'RUN curl -sSL https://example.com/install.sh | bash',
    afterCode:
      'RUN curl -sSL -o /tmp/install.sh https://example.com/install.sh \\\n' +
      '    && echo "expected_sha256  /tmp/install.sh" | sha256sum -c - \\\n' +
      '    && bash /tmp/install.sh \\\n' +
      '    && rm /tmp/install.sh',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    const pipeToShellPattern =
      /\b(?:curl|wget)\b.*\|\s*(?:sh|bash|zsh|dash)\b/;

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (pipeToShellPattern.test(args)) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Piping remote content to shell. Download, verify checksum, then execute.',
        });
      }
    }

    return violations;
  },
};
