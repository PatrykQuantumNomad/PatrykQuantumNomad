import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { WELL_KNOWN_SERVICES } from './well-known-resources';

/**
 * KA-X002: Ingress references a Service not defined in the manifest.
 *
 * An Ingress backend that points to a non-existent Service will fail at
 * runtime with 503 errors. Checks both spec.rules paths and spec.defaultBackend.
 */
export const KAX002: K8sLintRule = {
  id: 'KA-X002',
  title: 'Ingress references undefined Service',
  severity: 'warning',
  category: 'cross-resource',
  explanation:
    'An Ingress backend must reference a Service that exists in the same namespace. ' +
    'If the Service is missing, the Ingress controller will return 503 Service Unavailable ' +
    'for all matching requests.',
  fix: {
    description: 'Add the missing Service to the manifest or correct the service name',
    beforeCode:
      'apiVersion: networking.k8s.io/v1\nkind: Ingress\nspec:\n  rules:\n    - http:\n        paths:\n          - backend:\n              service:\n                name: missing-svc',
    afterCode:
      'apiVersion: networking.k8s.io/v1\nkind: Ingress\nspec:\n  rules:\n    - http:\n        paths:\n          - backend:\n              service:\n                name: my-svc\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: my-svc',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Ingress') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      // Check spec.rules[*].http.paths[*].backend.service.name
      const rules = spec.rules as Record<string, unknown>[] | undefined;
      if (Array.isArray(rules)) {
        for (let ri = 0; ri < rules.length; ri++) {
          const http = rules[ri].http as Record<string, unknown> | undefined;
          const paths = http?.paths as Record<string, unknown>[] | undefined;
          if (!Array.isArray(paths)) continue;

          for (let pi = 0; pi < paths.length; pi++) {
            const backend = paths[pi].backend as Record<string, unknown> | undefined;
            const service = backend?.service as Record<string, unknown> | undefined;
            const serviceName = service?.name as string | undefined;

            if (!serviceName || WELL_KNOWN_SERVICES.has(serviceName)) continue;

            if (!ctx.registry.getByName('Service', resource.namespace, serviceName)) {
              const jsonPath = `/spec/rules/${ri}/http/paths/${pi}/backend/service/name`;
              const node = resolveInstancePath(resource.doc, jsonPath);
              const { line, col } = getNodeLine(node, ctx.lineCounter);
              violations.push({
                ruleId: 'KA-X002',
                line,
                column: col,
                message: `Ingress '${resource.name}' references Service '${serviceName}' which is not defined in the manifest (namespace '${resource.namespace}').`,
              });
            }
          }
        }
      }

      // Check spec.defaultBackend.service.name
      const defaultBackend = spec.defaultBackend as Record<string, unknown> | undefined;
      const defaultService = defaultBackend?.service as Record<string, unknown> | undefined;
      const defaultServiceName = defaultService?.name as string | undefined;

      if (defaultServiceName && !WELL_KNOWN_SERVICES.has(defaultServiceName)) {
        if (!ctx.registry.getByName('Service', resource.namespace, defaultServiceName)) {
          const node = resolveInstancePath(resource.doc, '/spec/defaultBackend/service/name');
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-X002',
            line,
            column: col,
            message: `Ingress '${resource.name}' defaultBackend references Service '${defaultServiceName}' which is not defined in the manifest (namespace '${resource.namespace}').`,
          });
        }
      }
    }

    return violations;
  },
};
