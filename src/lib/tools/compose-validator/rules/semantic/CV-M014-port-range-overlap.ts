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

export const CVM014: ComposeLintRule = {
  id: 'CV-M014',
  title: 'Port range overlap between services',
  severity: 'warning',
  category: 'semantic',
  explanation:
    'Port ranges exported by different services overlap, causing binding conflicts. ' +
    'When one service exports ports 8000-8010 and another exports 8005-8015, ports ' +
    '8005-8010 are bound by both, which fails at startup. This rule specifically catches ' +
    'range-based overlaps (single-port duplicates are caught by CV-M001).',
  fix: {
    description: 'Adjust port ranges so they do not overlap between services.',
    beforeCode:
      'services:\n  web:\n    ports:\n      - "8000-8010:8000-8010"\n  api:\n    ports:\n      - "8005-8015:8005-8015"',
    afterCode:
      'services:\n  web:\n    ports:\n      - "8000-8010:8000-8010"\n  api:\n    ports:\n      - "8011-8021:8011-8021"',
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
            const parsed = parsePortString(String(portItem.value));
            if (parsed && parsed.hostPort !== undefined) {
              const isRange = parsed.hostPortEnd !== undefined && parsed.hostPortEnd !== parsed.hostPort;
              allPorts.push({ service: serviceName, parsed, node: portItem, isRange });
            }
          } else if (isMap(portItem)) {
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

    // Compare ports from DIFFERENT services; M014 handles range overlaps only
    for (let i = 0; i < allPorts.length; i++) {
      for (let j = i + 1; j < allPorts.length; j++) {
        const a = allPorts[i];
        const b = allPorts[j];
        if (a.service === b.service) continue;
        // Only fire when at least one side is a range (single-port handled by CV-M001)
        if (!a.isRange && !b.isRange) continue;

        if (portsConflict(a.parsed, b.parsed)) {
          const pos = getNodeLine(b.node, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-M014',
            line: pos.line,
            column: pos.col,
            message: `Port range in service '${b.service}' overlaps with ports in service '${a.service}'.`,
          });
        }
      }
    }

    return violations;
  },
};
