import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG011: LintRule = {
  id: 'PG011',
  title: 'Add a USER directive to avoid running as root',
  severity: 'warning',
  category: 'security',
  explanation:
    'When a Dockerfile has no USER instruction, the container runs as root (UID 0) by default. ' +
    'This means every process inside the container has full administrative privileges. If an ' +
    'attacker exploits a vulnerability in your application, they gain root access -- and in the ' +
    'event of a container escape, they become root on the host. The CIS Docker Benchmark (Section ' +
    '4.1) and Kubernetes Pod Security Standards both require non-root containers. Most container ' +
    'orchestrators can enforce this at admission time, causing rootless-unaware images to fail ' +
    'deployment entirely. Unlike USER root (caught by DL3002), a missing USER directive is ' +
    'invisible -- there is no line to flag, making it easy to overlook during code review.',
  fix: {
    description:
      'Add a non-root USER instruction after completing root-only setup tasks. ' +
      'Create a dedicated application user with explicit UID/GID for deterministic builds.',
    beforeCode:
      'FROM node:22-bookworm-slim\n' +
      'WORKDIR /app\n' +
      'COPY . .\n' +
      'CMD ["node", "server.js"]',
    afterCode:
      'FROM node:22-bookworm-slim\n' +
      'RUN groupadd -g 10001 appgroup && \\\n' +
      '    useradd -u 10001 -g appgroup -s /bin/false appuser\n' +
      'WORKDIR /app\n' +
      'COPY --chown=appuser:appgroup . .\n' +
      'USER appuser\n' +
      'CMD ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    if (froms.length === 0) return violations;

    // Find the last FROM instruction (start of final stage)
    const lastFrom = froms.at(-1);
    if (!lastFrom) return violations;

    // Skip FROM scratch -- no user system exists
    const imageName = lastFrom.getImageName();
    if (imageName === 'scratch') return violations;

    const lastFromLine = lastFrom.getRange().start.line;

    // Find USER instructions in the final stage (after the last FROM)
    const userInstructions = dockerfile.getInstructions().filter(
      (inst) =>
        inst.getKeyword() === 'USER' &&
        inst.getRange().start.line > lastFromLine,
    );

    // If ANY USER instruction exists, defer to DL3002 (which handles USER root/0)
    if (userInstructions.length > 0) return violations;

    // No USER directive in final stage -- flag on the FROM line
    const range = lastFrom.getRange();
    violations.push({
      ruleId: this.id,
      line: range.start.line + 1,
      column: 1,
      message:
        'No USER directive in the final stage. The container will run as root. ' +
        'Add a USER instruction to switch to a non-root user.',
    });

    return violations;
  },
};
