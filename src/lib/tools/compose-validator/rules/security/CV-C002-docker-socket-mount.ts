import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

const DOCKER_SOCKET = /\/var\/run\/docker\.sock/;

export const CVC002: ComposeLintRule = {
  id: 'CV-C002',
  title: 'Docker socket mounted',
  severity: 'error',
  category: 'security',
  explanation:
    'Mounting the Docker socket (/var/run/docker.sock) inside a container grants it ' +
    'root-level control over the host Docker daemon. Any process in the container can ' +
    'create, start, stop, or remove containers, pull images, and effectively gain full ' +
    'host root access. CWE-250: Execution with Unnecessary Privileges.',
  fix: {
    description:
      'Use a Docker API proxy with limited permissions, or avoid socket mounting entirely',
    beforeCode:
      'services:\n  web:\n    volumes:\n      - /var/run/docker.sock:/var/run/docker.sock',
    afterCode:
      'services:\n  web:\n    volumes:\n      - ./app-data:/data',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'volumes') continue;
        if (!isSeq(item.value)) continue;

        for (const volItem of item.value.items) {
          let volumeStr = '';

          if (isScalar(volItem)) {
            // Short syntax: "/var/run/docker.sock:/var/run/docker.sock"
            volumeStr = String(volItem.value);
          } else if (isMap(volItem)) {
            // Long syntax: { type: bind, source: /var/run/docker.sock, target: ... }
            for (const vi of volItem.items) {
              if (
                isPair(vi) &&
                isScalar(vi.key) &&
                String(vi.key.value) === 'source'
              ) {
                volumeStr = isScalar(vi.value) ? String(vi.value.value) : '';
              }
            }
          }

          if (DOCKER_SOCKET.test(volumeStr)) {
            const pos = getNodeLine(volItem, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-C002',
              line: pos.line,
              column: pos.col,
              message: `Service '${serviceName}' mounts the Docker socket. This grants container root-level access to the host Docker daemon (CWE-250).`,
            });
          }
        }
      }
    }

    return violations;
  },
};
