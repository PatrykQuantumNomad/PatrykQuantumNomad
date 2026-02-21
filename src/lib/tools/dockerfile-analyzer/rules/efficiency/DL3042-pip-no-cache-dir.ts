import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3042: LintRule = {
  id: 'DL3042',
  title: 'Avoid use of cache directory with pip',
  severity: 'warning',
  category: 'efficiency',
  explanation:
    'By default, pip caches downloaded packages in ~/.cache/pip to speed up future ' +
    'installs. Inside a Docker build, this cache is never reused but it remains in ' +
    'the image layer, wasting 50-200 MB depending on the packages. That is dead ' +
    'weight that bloats your image and slows down every container pull. Use ' +
    '--no-cache-dir to skip caching.',
  fix: {
    description: 'Add --no-cache-dir to pip install',
    beforeCode: 'RUN pip install flask requests',
    afterCode: 'RUN pip install --no-cache-dir flask requests',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Match pip install or pip3 install
      if (!/\bpip3?\s+install\b/.test(args)) continue;

      // Check for --no-cache-dir
      if (!args.includes('--no-cache-dir')) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'pip install without --no-cache-dir. Add --no-cache-dir to reduce image size.',
        });
      }
    }

    return violations;
  },
};
