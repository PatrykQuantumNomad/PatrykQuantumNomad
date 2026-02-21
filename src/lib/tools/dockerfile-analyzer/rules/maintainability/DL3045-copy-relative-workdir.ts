import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3045: LintRule = {
  id: 'DL3045',
  title: 'COPY to a relative destination without WORKDIR set',
  severity: 'warning',
  category: 'maintainability',
  explanation:
    'When COPY uses a relative destination (e.g., COPY . app/) and no WORKDIR has been ' +
    'set in the current build stage, the destination resolves relative to the filesystem ' +
    'root (/). This is usually unintentional and makes the Dockerfile fragile because ' +
    'the behavior depends on the base image default WORKDIR. Files end up in unexpected ' +
    'locations and builds break in confusing ways. Set WORKDIR before using relative paths.',
  fix: {
    description: 'Set WORKDIR before COPY with relative destination',
    beforeCode: 'FROM node:20\nCOPY . app/',
    afterCode: 'FROM node:20\nWORKDIR /app\nCOPY . .',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();
    const allInstructions = dockerfile.getInstructions();

    // For each COPY instruction, check if the destination is relative
    // and no WORKDIR exists before it in the current stage
    for (const inst of allInstructions) {
      if (inst.getKeyword() !== 'COPY') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Parse tokens, skipping flags
      const tokens = args
        .replaceAll('\\\n', ' ')
        .split(/\s+/)
        .filter((t) => t.length > 0 && !t.startsWith('--'));

      if (tokens.length < 2) continue;

      // Last token is the destination
      const dest = tokens.at(-1);
      if (!dest) continue;

      // Only flag relative destinations (not starting with / or $)
      if (dest.startsWith('/') || dest.startsWith('$')) continue;

      const instLine = inst.getRange().start.line;

      // Find which stage this COPY belongs to
      let stageStart = 0;
      for (const from of froms) {
        const fromLine = from.getRange().start.line;
        if (fromLine <= instLine) {
          stageStart = fromLine;
        }
      }

      // Check if any WORKDIR exists between stage start and this COPY
      let hasWorkdir = false;
      for (const other of allInstructions) {
        if (other.getKeyword() !== 'WORKDIR') continue;
        const otherLine = other.getRange().start.line;
        if (otherLine >= stageStart && otherLine < instLine) {
          hasWorkdir = true;
          break;
        }
      }

      if (!hasWorkdir) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `COPY to relative path '${dest}' without prior WORKDIR. Set WORKDIR first.`,
        });
      }
    }

    return violations;
  },
};
