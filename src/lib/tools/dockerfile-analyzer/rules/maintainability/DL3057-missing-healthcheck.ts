import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3057: LintRule = {
  id: 'DL3057',
  title: 'HEALTHCHECK instruction is missing',
  severity: 'info',
  category: 'maintainability',
  explanation:
    'Without a HEALTHCHECK, Docker and orchestrators (Kubernetes, Docker Swarm) have no ' +
    'way to verify the container is functioning correctly. In production, a container ' +
    'without HEALTHCHECK can appear "running" while the application inside has crashed, ' +
    'leading to serving errors until manual intervention. Adding HEALTHCHECK enables ' +
    'automatic detection and restart of unhealthy containers.',
  fix: {
    description: 'Add a HEALTHCHECK instruction to verify the app is running',
    beforeCode: 'CMD ["node", "server.js"]',
    afterCode:
      'HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\\n' +
      '  CMD curl -f http://localhost:8080/health || exit 1\n' +
      'CMD ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const healthchecks = dockerfile.getHEALTHCHECKs();

    if (healthchecks.length === 0) {
      // Flag on the last FROM instruction's line, or line 1 if no FROM
      const froms = dockerfile.getFROMs();
      let flagLine = 1;
      if (froms.length > 0) {
        const lastFrom = froms[froms.length - 1];
        flagLine = lastFrom.getRange().start.line + 1;
      }

      violations.push({
        ruleId: this.id,
        line: flagLine,
        column: 1,
        message:
          'No HEALTHCHECK instruction found. Add one to enable container health monitoring.',
      });
    }

    return violations;
  },
};
