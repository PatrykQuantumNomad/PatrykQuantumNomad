import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3013: LintRule = {
  id: 'DL3013',
  title: 'Pin versions in pip install',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Without pinned versions, pip install pulls the latest package, which can differ ' +
    'between builds. In production, an unpinned `pip install flask` today may install ' +
    'Flask 3.0 but tomorrow Flask 3.1 with breaking changes. This violates build ' +
    'reproducibility and can cause production outages. Pin with == syntax and use a ' +
    'requirements.txt for complex dependency trees.',
  fix: {
    description: 'Pin package versions with == syntax',
    beforeCode: 'RUN pip install flask requests',
    afterCode: 'RUN pip install flask==3.0.0 requests==2.31.0',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Match pip install or pip3 install
      const pipMatch = args.match(/\bpip3?\s+install\b/);
      if (!pipMatch) continue;

      // Extract the portion after "pip install"
      const afterInstall = args.substring(
        pipMatch.index! + pipMatch[0].length,
      );

      // Split into tokens (handle line continuations)
      const tokens = afterInstall
        .replace(/\\\n/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 0);

      let skipNext = false;
      for (const token of tokens) {
        // Skip flags and their arguments
        if (skipNext) {
          skipNext = false;
          continue;
        }
        if (token.startsWith('-')) {
          // -r requires a filename argument, -e requires a path, etc.
          if (
            token === '-r' ||
            token === '-e' ||
            token === '-c' ||
            token === '-f' ||
            token === '-i' ||
            token === '--requirement' ||
            token === '--editable' ||
            token === '--constraint' ||
            token === '--find-links' ||
            token === '--index-url' ||
            token === '--extra-index-url' ||
            token === '--trusted-host'
          ) {
            skipNext = true;
          }
          continue;
        }

        // Stop at shell operators
        if (token === '&&' || token === '||' || token === ';' || token === '|')
          break;

        // Skip paths (. or ./path or /path) and requirements files
        if (token === '.' || token.startsWith('./') || token.startsWith('/'))
          continue;

        // Skip URLs
        if (/^https?:\/\//.test(token)) continue;

        // Skip if version-pinned (==, >=, <=, ~=, !=)
        if (/[=!<>~]=/.test(token)) continue;

        // Skip editable installs marker
        if (token.startsWith('git+')) continue;

        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `Package '${token}' is not version-pinned. Use '${token}==<version>'.`,
        });
      }
    }

    return violations;
  },
};
