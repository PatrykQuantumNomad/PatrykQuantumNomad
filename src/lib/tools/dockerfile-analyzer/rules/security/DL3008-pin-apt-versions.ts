import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3008: LintRule = {
  id: 'DL3008',
  title: 'Pin versions in apt-get install',
  severity: 'warning',
  category: 'security',
  explanation:
    'Without pinned versions, apt-get install pulls the latest available package, ' +
    'which can differ between builds. In production, this means two images built ' +
    'from the same Dockerfile may contain different package versions, leading to ' +
    'inconsistent behavior and hard-to-debug issues. Pin packages with = syntax ' +
    '(e.g., curl=7.88.1-10+deb12u5) for reproducible builds.',
  fix: {
    description: 'Pin package versions with = syntax',
    beforeCode: 'RUN apt-get install -y curl wget',
    afterCode: 'RUN apt-get install -y curl=7.88.1-10+deb12u5 wget=1.21.3-1',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;
      if (!args.includes('apt-get') || !args.includes('install')) continue;

      // Extract the portion after "install"
      const installIdx = args.indexOf('install');
      const afterInstall = args.substring(installIdx + 'install'.length);

      // Split into tokens (handle line continuations)
      const tokens = afterInstall
        .replace(/\\\n/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 0);

      for (const token of tokens) {
        // Skip flags (start with -)
        if (token.startsWith('-')) continue;
        // Skip if it contains = (version pinned)
        if (token.includes('=')) continue;
        // Skip common non-package tokens
        if (token === '&&' || token === '||' || token === '|' || token === ';')
          break;
        // Skip if it looks like another command
        if (
          token === 'apt-get' ||
          token === 'rm' ||
          token === 'apt-cache' ||
          token === 'dpkg'
        )
          break;

        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `Package '${token}' is not version-pinned. Use '${token}=<version>'.`,
        });
      }
    }

    return violations;
  },
};
