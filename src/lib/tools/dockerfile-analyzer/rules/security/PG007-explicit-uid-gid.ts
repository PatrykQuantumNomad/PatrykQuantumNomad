import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG007: LintRule = {
  id: 'PG007',
  title: 'Use explicit UID/GID for container users',
  severity: 'warning',
  category: 'security',
  explanation:
    'When useradd is called without -u (or --uid), the system auto-assigns the next available ' +
    'UID. Similarly, groupadd without -g (or --gid) auto-assigns the next GID. These IDs are ' +
    'non-deterministic. They depend on the order of package installations and other system ' +
    'users created earlier in the build. Rebuild the image after a base image update and the UID ' +
    'may change, breaking file ownership on persistent volumes. In Kubernetes, a mismatch between ' +
    'the image UID and securityContext.runAsUser causes permission errors at startup. Use explicit ' +
    'IDs above 10000 to avoid collisions with host system users and Linux reserved ranges.',
  fix: {
    description:
      'Specify explicit UID and GID using -u/-g flags. Use values above 10000 to avoid conflicts with system and host users.',
    beforeCode: 'RUN groupadd appgroup\nRUN useradd appuser',
    afterCode:
      'ARG uid=10001\nARG gid=10001\nRUN groupadd -g ${gid} appgroup && \\\n' +
      '    useradd -u ${uid} -g appgroup -s /bin/false appuser\nUSER appuser',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Collapse backslash-newline continuations into a single line
      const normalized = args.replace(/\\\n/g, ' ');

      // Split chained commands to analyze each independently
      const commands = normalized.split(/&&|\|\||[;|]/);

      for (const cmd of commands) {
        const trimmed = cmd.trim();

        // useradd without -u / --uid
        if (
          /\buseradd\b/.test(trimmed) &&
          !/\s-u[\s=]/.test(trimmed) &&
          !/\s--uid[\s=]/.test(trimmed)
        ) {
          const range = inst.getRange();
          violations.push({
            ruleId: this.id,
            line: range.start.line + 1,
            column: 1,
            message:
              'useradd without explicit UID (-u/--uid). Specify a fixed UID (e.g. 10001) for deterministic builds.',
          });
        }

        // groupadd without -g / --gid
        if (
          /\bgroupadd\b/.test(trimmed) &&
          !/\s-g[\s=]/.test(trimmed) &&
          !/\s--gid[\s=]/.test(trimmed)
        ) {
          const range = inst.getRange();
          violations.push({
            ruleId: this.id,
            line: range.start.line + 1,
            column: 1,
            message:
              'groupadd without explicit GID (-g/--gid). Specify a fixed GID (e.g. 10001) for deterministic builds.',
          });
        }
      }
    }

    return violations;
  },
};
