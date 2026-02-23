import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * Regex to match environment variable names that look like they contain secrets.
 * Matches names ending with common secret suffixes (case-insensitive).
 */
const SECRET_NAME_PATTERN =
  /(PASSWORD|SECRET|TOKEN|API_KEY|APIKEY|AUTH|CREDENTIAL|PRIVATE_KEY)$/i;

/**
 * KA-C018: Secrets in environment variables.
 *
 * CIS Benchmark control. Hardcoding secrets directly in environment variable values
 * exposes them in pod definitions, kubectl output, and etcd storage. Use Kubernetes
 * Secrets with volume mounts or secretKeyRef instead.
 */
export const KAC018: K8sLintRule = {
  id: 'KA-C018',
  title: 'Secrets in environment variables',
  severity: 'warning',
  category: 'security',
  explanation:
    'An environment variable with a secret-looking name has a hardcoded inline value. ' +
    'This exposes secrets in pod definitions, kubectl output, and etcd storage. ' +
    'Use Kubernetes Secrets with volume mounts or valueFrom.secretKeyRef instead. ' +
    'CIS Benchmark recommends not storing secrets as environment variables.',
  fix: {
    description: 'Use valueFrom.secretKeyRef instead of inline values for secrets',
    beforeCode:
      'env:\n  - name: DB_PASSWORD\n    value: "s3cret123"',
    afterCode:
      'env:\n  - name: DB_PASSWORD\n    valueFrom:\n      secretKeyRef:\n        name: db-credentials\n        key: password',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const envList = container.env as Record<string, unknown>[] | undefined;
        if (!Array.isArray(envList)) continue;

        for (let i = 0; i < envList.length; i++) {
          const envVar = envList[i];
          const name = envVar.name as string | undefined;
          if (typeof name !== 'string') continue;

          // Only flag when: (1) name matches secret pattern AND (2) inline value is set (not valueFrom)
          if (SECRET_NAME_PATTERN.test(name) && 'value' in envVar && typeof envVar.value === 'string') {
            const node = resolveInstancePath(
              resource.doc,
              `${jsonPath}/env/${i}/value`,
            );
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            violations.push({
              ruleId: 'KA-C018',
              line,
              column: col,
              message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has hardcoded secret in env var '${name}'. Use secretKeyRef instead.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
