import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-B012: Duplicate environment variable keys.
 *
 * When a container's env array contains duplicate name fields, the later
 * value silently overrides the earlier one. This is almost always a
 * copy-paste error and can cause subtle runtime bugs.
 */
export const KAB012: K8sLintRule = {
  id: 'KA-B012',
  title: 'Duplicate environment variable keys',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The container has duplicate environment variable names. When duplicate names exist, ' +
    'the later value silently overrides the earlier one. This is almost always a copy-paste ' +
    'error and can cause subtle runtime bugs that are difficult to diagnose.',
  fix: {
    description: 'Remove duplicate env var entries or rename them',
    beforeCode:
      'env:\n  - name: DB_HOST\n    value: primary.db\n  - name: DB_HOST\n    value: replica.db',
    afterCode:
      'env:\n  - name: DB_HOST\n    value: primary.db\n  - name: DB_REPLICA_HOST\n    value: replica.db',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const envList = container.env as Record<string, unknown>[] | undefined;
        if (!Array.isArray(envList) || envList.length < 2) continue;

        const seen = new Map<string, number>(); // name -> first index
        for (let i = 0; i < envList.length; i++) {
          const name = envList[i].name as string | undefined;
          if (typeof name !== 'string') continue;

          if (seen.has(name)) {
            const node = resolveInstancePath(
              resource.doc,
              `${jsonPath}/env/${i}/name`,
            );
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            violations.push({
              ruleId: 'KA-B012',
              line,
              column: col,
              message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has duplicate env var '${name}'. The later value overrides the earlier one.`,
            });
          } else {
            seen.set(name, i);
          }
        }
      }
    }

    return violations;
  },
};
