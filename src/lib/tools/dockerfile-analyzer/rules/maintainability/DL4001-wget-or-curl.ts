import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL4001: LintRule = {
  id: 'DL4001',
  title: 'Either use wget or curl but not both',
  severity: 'warning',
  category: 'maintainability',
  explanation:
    'Installing both wget and curl in the same image adds unnecessary size since they ' +
    'serve the same purpose: downloading files via HTTP. Having two tools for the same ' +
    'job increases the attack surface and creates inconsistency in how files are fetched. ' +
    'Pick one and use it consistently throughout your Dockerfile.',
  fix: {
    description:
      'Standardize on either curl or wget throughout the Dockerfile',
    beforeCode:
      'RUN curl -o file1.txt https://example.com/file1\n' +
      'RUN wget https://example.com/file2',
    afterCode:
      'RUN curl -o file1.txt https://example.com/file1\n' +
      'RUN curl -o file2.txt https://example.com/file2',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    let hasCurl = false;
    let hasWget = false;
    let secondToolInst: typeof instructions[0] | null = null;

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      const usesCurl = /\bcurl\b/.test(args);
      const usesWget = /\bwget\b/.test(args);

      if (usesCurl) hasCurl = true;
      if (usesWget) hasWget = true;

      // Track the first instruction where both are detected
      if (hasCurl && hasWget && !secondToolInst) {
        secondToolInst = inst;
      }
    }

    // Flag once per Dockerfile
    if (hasCurl && hasWget && secondToolInst) {
      const range = secondToolInst.getRange();
      violations.push({
        ruleId: this.id,
        line: range.start.line + 1,
        column: 1,
        message:
          'Both curl and wget are used. Pick one tool for consistency.',
      });
    }

    return violations;
  },
};
