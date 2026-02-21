import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3033: LintRule = {
  id: 'DL3033',
  title: 'Pin versions in yum install',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Without pinned versions, yum install pulls the latest available package, which ' +
    'varies between builds. Unpinned packages break build reproducibility because two ' +
    'builds from the same Dockerfile may contain different package versions. Pin ' +
    'packages with - syntax (e.g., httpd-2.4.6) for consistent, reproducible builds.',
  fix: {
    description: 'Pin package versions with - syntax',
    beforeCode: 'RUN yum install -y httpd',
    afterCode: 'RUN yum install -y httpd-2.4.6-99.el7',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (!/\byum\s+install\b/.test(args)) continue;

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
        // Skip non-package tokens
        if (token === 'yum' || token === 'rpm' || token === 'dnf') break;

        // Yum uses name-version format; check if token contains version separator
        // A pinned package looks like httpd-2.4.6 (contains digits after a -)
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
