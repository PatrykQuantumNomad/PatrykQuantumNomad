import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG005: LintRule = {
  id: 'PG005',
  title: 'Inconsistent instruction casing',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Docker instructions are case-insensitive, but mixing uppercase and lowercase ' +
    '(e.g., FROM with run) creates an inconsistent, messy appearance. The Docker ' +
    'documentation and community convention is to use UPPERCASE for all instructions. ' +
    'Inconsistent casing makes the Dockerfile harder to scan and signals to reviewers ' +
    'that the file may not have been carefully maintained.',
  fix: {
    description: 'Use consistent uppercase for all Dockerfile instructions',
    beforeCode: 'FROM node:20\nrun npm install\nCOPY . .',
    afterCode: 'FROM node:20\nRUN npm install\nCOPY . .',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    if (instructions.length === 0) return violations;

    // Count uppercase vs lowercase instructions
    let upperCount = 0;
    let lowerCount = 0;

    for (const inst of instructions) {
      const raw = inst.getInstruction();
      if (raw === raw.toUpperCase()) {
        upperCount++;
      } else if (raw === raw.toLowerCase()) {
        lowerCount++;
      } else {
        // Mixed case counts as neither
        lowerCount++; // Treat mixed as deviating from uppercase convention
      }
    }

    // If all instructions are the same case, no violation
    if (upperCount === 0 || lowerCount === 0) return violations;

    // Determine majority convention
    const convention = upperCount >= lowerCount ? 'uppercase' : 'lowercase';

    for (const inst of instructions) {
      const raw = inst.getInstruction();
      const isUpper = raw === raw.toUpperCase();
      const isLower = raw === raw.toLowerCase();

      const matchesConvention =
        (convention === 'uppercase' && isUpper) ||
        (convention === 'lowercase' && isLower);

      if (!matchesConvention) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `Instruction '${raw}' uses inconsistent casing. Use ${convention} to match the rest of the file.`,
        });
      }
    }

    return violations;
  },
};
