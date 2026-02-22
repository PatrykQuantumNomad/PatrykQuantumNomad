import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import { parsePortString } from '../../port-parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC009: ComposeLintRule = {
  id: 'CV-C009',
  title: 'Unbound port interface',
  severity: 'warning',
  category: 'security',
  explanation:
    'When a port mapping does not specify a host IP address, Docker binds it to all network ' +
    'interfaces (0.0.0.0). This means the port is accessible from any network the host is ' +
    'connected to, including public-facing interfaces. For services that should only be ' +
    'accessible locally, bind to 127.0.0.1 explicitly.',
  fix: {
    description:
      'Bind to 127.0.0.1 for local-only access or a specific interface IP',
    beforeCode: 'services:\n  web:\n    ports:\n      - "8080:80"',
    afterCode: 'services:\n  web:\n    ports:\n      - "127.0.0.1:8080:80"',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'ports') continue;
        if (!isSeq(item.value)) continue;

        for (const portItem of item.value.items) {
          if (isScalar(portItem)) {
            // Short syntax string port
            const portStr = String(portItem.value);
            const parsed = parsePortString(portStr);

            if (parsed && parsed.hostPort !== undefined && parsed.hostIp === undefined) {
              const pos = getNodeLine(portItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-C009',
                line: pos.line,
                column: pos.col,
                message: `Port '${portStr}' in service '${serviceName}' binds to all interfaces (0.0.0.0). Bind to 127.0.0.1 for local-only access.`,
              });
            }
          } else if (isMap(portItem)) {
            // Long syntax: check for missing host_ip when published is set
            let hasPublished = false;
            let hasHostIp = false;
            let publishedVal = '';

            for (const pi of portItem.items) {
              if (!isPair(pi) || !isScalar(pi.key)) continue;
              const key = String(pi.key.value);
              if (key === 'published' && isScalar(pi.value) && pi.value.value != null) {
                hasPublished = true;
                publishedVal = String(pi.value.value);
              }
              if (key === 'host_ip' && isScalar(pi.value) && String(pi.value.value) !== '') {
                hasHostIp = true;
              }
            }

            if (hasPublished && !hasHostIp) {
              const pos = getNodeLine(portItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-C009',
                line: pos.line,
                column: pos.col,
                message: `Port '${publishedVal}' in service '${serviceName}' binds to all interfaces (0.0.0.0). Bind to 127.0.0.1 for local-only access.`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
