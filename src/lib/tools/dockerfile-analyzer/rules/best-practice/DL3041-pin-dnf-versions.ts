import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3041: LintRule = {
  id: 'DL3041',
  title: 'Pin versions in dnf install',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Without pinned versions, dnf install pulls the latest available package, which ' +
    'varies between builds. Unpinned packages break build reproducibility because two ' +
    'builds from the same Dockerfile may install different versions. Pin packages with ' +
    '- syntax (e.g., httpd-2.4.6) for consistent builds.',
  fix: {
    description: 'Pin package versions with - syntax',
    beforeCode: 'RUN dnf install -y httpd',
    afterCode: 'RUN dnf install -y httpd-2.4.6-99.fc38',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (!/\bdnf\s+install\b/.test(args)) continue;

      // Extract portion after "install"
      const installIdx = args.indexOf('install');
      const afterInstall = args.substring(installIdx + 'install'.length);

      const tokens = afterInstall
        .replaceAll('\\\n', ' ')
        .split(/\s+/)
        .filter((t) => t.length > 0);

      for (const token of tokens) {
        if (token.startsWith('-')) continue;
        if (token === '&&' || token === '||' || token === '|' || token === ';')
          break;
        if (token === 'dnf' || token === 'rpm' || token === 'yum') break;

        // dnf uses name-version format; check for version digits
        if (!/\d/.test(token)) {
          const range = inst.getRange();
          violations.push({
            ruleId: this.id,
            line: range.start.line + 1,
            column: 1,
            message: `Package '${token}' is not version-pinned. Use '${token}-<version>'.`,
          });
        }
      }
    }

    return violations;
  },
};
