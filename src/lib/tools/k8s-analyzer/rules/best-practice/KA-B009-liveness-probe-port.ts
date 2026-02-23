import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * Extract the port from a probe object (httpGet.port or tcpSocket.port).
 * Returns null if the probe uses exec (no port) or no port is specified.
 */
function getProbePort(probe: Record<string, unknown>): number | string | null {
  const httpGet = probe.httpGet as Record<string, unknown> | undefined;
  if (httpGet?.port !== undefined) return httpGet.port as number | string;
  const tcpSocket = probe.tcpSocket as Record<string, unknown> | undefined;
  if (tcpSocket?.port !== undefined) return tcpSocket.port as number | string;
  return null;
}

/**
 * Build a Set of declared container ports for O(1) lookup.
 * Includes both numeric containerPort values AND string name values
 * to support named port references in probes.
 */
function getDeclaredPorts(container: Record<string, unknown>): Set<number | string> {
  const ports = container.ports as Record<string, unknown>[] | undefined;
  if (!Array.isArray(ports)) return new Set();
  const declared = new Set<number | string>();
  for (const p of ports) {
    if (p.containerPort !== undefined) declared.add(p.containerPort as number);
    if (p.name !== undefined) declared.add(p.name as string);
  }
  return declared;
}

/**
 * KA-B009: Liveness probe port not in container ports.
 *
 * When a liveness probe references a port that is not declared in the
 * container's ports array, the probe may fail to connect. This usually
 * indicates a misconfiguration (typo, wrong port number, or forgotten
 * port declaration).
 */
export const KAB009: K8sLintRule = {
  id: 'KA-B009',
  title: 'Liveness probe port not in container ports',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The liveness probe references a port that is not declared in the container ports array. ' +
    'This may indicate a misconfiguration where the probe points to the wrong port or the ' +
    'container port declaration is missing. The probe may fail to connect, causing unnecessary restarts.',
  fix: {
    description: 'Ensure the liveness probe port matches a declared container port',
    beforeCode:
      'containers:\n  - name: app\n    ports:\n      - containerPort: 8080\n    livenessProbe:\n      httpGet:\n        port: 9090',
    afterCode:
      'containers:\n  - name: app\n    ports:\n      - containerPort: 8080\n    livenessProbe:\n      httpGet:\n        port: 8080',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath, containerType } of containerSpecs) {
        // Only check regular containers, not initContainers
        if (containerType !== 'container') continue;

        const livenessProbe = container.livenessProbe as Record<string, unknown> | undefined;
        if (!livenessProbe) continue;

        const probePort = getProbePort(livenessProbe);
        if (probePort === null) continue; // exec probe or no port specified

        // If container has no ports array, skip (no false positive)
        const ports = container.ports as Record<string, unknown>[] | undefined;
        if (!Array.isArray(ports)) continue;

        const declaredPorts = getDeclaredPorts(container);
        if (!declaredPorts.has(probePort)) {
          const node = resolveInstancePath(
            resource.doc,
            `${jsonPath}/livenessProbe`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-B009',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has a liveness probe on port ${probePort} which is not in the declared container ports.`,
          });
        }
      }
    }

    return violations;
  },
};
