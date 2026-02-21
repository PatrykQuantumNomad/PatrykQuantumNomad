import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3057: LintRule = {
  id: 'DL3057',
  title: 'HEALTHCHECK instruction is missing',
  severity: 'info',
  category: 'maintainability',
  explanation:
    'Without a HEALTHCHECK, Docker and orchestrators like Kubernetes have no way to ' +
    'verify that the container is actually functioning correctly. A container can appear ' +
    '"running" while the application inside has crashed, and it will keep serving errors ' +
    'until someone notices and intervenes manually. Adding HEALTHCHECK enables automatic ' +
    'detection and restart of unhealthy containers.',
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
      const lastFrom = froms.at(-1);
      if (lastFrom) {
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
