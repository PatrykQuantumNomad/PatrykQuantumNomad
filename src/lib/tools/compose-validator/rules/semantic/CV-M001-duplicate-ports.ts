import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import { parsePortString, parseLongSyntaxPort, portsConflict } from '../../port-parser';
import type { ParsedPort } from '../../port-parser';

interface PortEntry {
  service: string;
  parsed: ParsedPort;
  node: any;
  isRange: boolean;
}

export const CVM001: ComposeLintRule = {
  id: 'CV-M001',
  title: 'Duplicate exported host ports',
  severity: 'error',
  category: 'semantic',
  explanation:
    'Two or more services export the same host port, which causes a port binding conflict ' +
    'when Docker Compose starts the stack. Only one container can bind a given host port on ' +
    'the same IP address and protocol at a time. Docker Compose will fail at startup with ' +
    '"Bind for 0.0.0.0:PORT failed: port is already allocated". This rule detects single-port ' +
    'duplicates; range overlaps are caught by CV-M014.',
  fix: {
    description: 'Assign unique host ports to each service or bind to different IP addresses.',
    beforeCode:
      'services:\n  web:\n    ports:\n      - "8080:80"\n  api:\n    ports:\n      - "8080:3000"',
    afterCode:
      'services:\n  web:\n    ports:\n      - "8080:80"\n  api:\n    ports:\n      - "8081:3000"',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const allPorts: PortEntry[] = [];

    // Collect all port entries across all services
    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'ports') continue;
        if (!isSeq(item.value)) continue;

        for (const portItem of item.value.items) {
          if (isScalar(portItem)) {
            // Short syntax: "8080:80"
            const parsed = parsePortString(String(portItem.value));
            if (parsed && parsed.hostPort !== undefined) {
              const isRange = parsed.hostPortEnd !== undefined && parsed.hostPortEnd !== parsed.hostPort;
              allPorts.push({ service: serviceName, parsed, node: portItem, isRange });
            }
          } else if (isMap(portItem)) {
            // Long syntax: { target: 80, published: 8080 }
            const obj: Record<string, any> = {};
            for (const pi of portItem.items) {
              if (isPair(pi) && isScalar(pi.key) && isScalar(pi.value)) {
                obj[String(pi.key.value)] = pi.value.value;
              }
            }
            const parsed = parseLongSyntaxPort(obj);
            if (parsed && parsed.hostPort !== undefined) {
              const isRange = parsed.hostPortEnd !== undefined && parsed.hostPortEnd !== parsed.hostPort;
              allPorts.push({ service: serviceName, parsed, node: portItem, isRange });
            }
          }
        }
      }
    }

    // Compare ports from DIFFERENT services -- M001 handles single-port conflicts only
    for (let i = 0; i < allPorts.length; i++) {
      for (let j = i + 1; j < allPorts.length; j++) {
        const a = allPorts[i];
        const b = allPorts[j];
        if (a.service === b.service) continue;
        if (a.isRange || b.isRange) continue; // Range overlaps handled by CV-M014

        if (portsConflict(a.parsed, b.parsed)) {
          const pos = getNodeLine(b.node, ctx.lineCounter);
          const portLabel = b.parsed.hostPort;
          violations.push({
            ruleId: 'CV-M001',
            line: pos.line,
            column: pos.col,
            message: `Port ${portLabel} in service '${b.service}' conflicts with service '${a.service}'.`,
          });
        }
      }
    }

    return violations;
  },
};
