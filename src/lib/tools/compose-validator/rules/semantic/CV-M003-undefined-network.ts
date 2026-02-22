import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVM003: ComposeLintRule = {
  id: 'CV-M003',
  title: 'Undefined network reference',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service references a network that is not defined in the top-level networks section. ' +
    'Docker Compose will fail to start with an error when a service references an undefined ' +
    'network. Either add the network to the top-level networks section or fix the network ' +
    'name in the service definition. The implicit "default" network does not need to be declared.',
  fix: {
    description: 'Define the referenced network in the top-level networks section.',
    beforeCode:
      'services:\n  web:\n    networks:\n      - backend\n# No top-level networks defined',
    afterCode:
      'services:\n  web:\n    networks:\n      - backend\nnetworks:\n  backend:',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const definedNetworks = new Set(ctx.networks.keys());

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'networks') continue;

        // networks can be YAMLSeq (list of names) or YAMLMap (names as keys)
        if (isSeq(item.value)) {
          for (const netItem of item.value.items) {
            if (!isScalar(netItem)) continue;
            const netName = String(netItem.value);
            if (netName !== 'default' && !definedNetworks.has(netName)) {
              const pos = getNodeLine(netItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M003',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined network '${netName}'.`,
              });
            }
          }
        } else if (isMap(item.value)) {
          for (const netItem of item.value.items) {
            if (!isPair(netItem) || !isScalar(netItem.key)) continue;
            const netName = String(netItem.key.value);
            if (netName !== 'default' && !definedNetworks.has(netName)) {
              const pos = getNodeLine(netItem.key, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M003',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined network '${netName}'.`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
