import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';

/**
 * Collect all network names referenced by any service.
 */
function collectUsedNetworks(services: Map<string, any>): Set<string> {
  const used = new Set<string>();

  for (const [, serviceNode] of services) {
    if (!isMap(serviceNode)) continue;

    for (const item of serviceNode.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) !== 'networks') continue;

      if (isSeq(item.value)) {
        for (const netItem of item.value.items) {
          if (isScalar(netItem)) {
            used.add(String(netItem.value));
          }
        }
      } else if (isMap(item.value)) {
        for (const netItem of item.value.items) {
          if (isPair(netItem) && isScalar(netItem.key)) {
            used.add(String(netItem.key.value));
          }
        }
      }
    }
  }

  return used;
}

export const CVM007: ComposeLintRule = {
  id: 'CV-M007',
  title: 'Orphan network definition',
  severity: 'warning',
  category: 'semantic',
  explanation:
    'A network is defined in the top-level networks section but is not referenced by any ' +
    'service. Orphan network definitions add unnecessary clutter and Docker will create ' +
    'the network even though nothing uses it, wasting resources. Remove unused networks ' +
    'or add them to the appropriate services.',
  fix: {
    description: 'Remove the unused network or add it to a service.',
    beforeCode:
      'services:\n  web:\n    image: nginx\nnetworks:\n  frontend:\n  backend:',
    afterCode:
      'services:\n  web:\n    image: nginx\n    networks:\n      - frontend\nnetworks:\n  frontend:',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const usedNetworks = collectUsedNetworks(ctx.services);

    for (const [netName] of ctx.networks) {
      if (usedNetworks.has(netName)) continue;

      // Find the network key node in the top-level AST for line reporting
      const networkKeyNode = findTopLevelKeyNode(ctx, 'networks', netName);
      const pos = networkKeyNode
        ? getNodeLine(networkKeyNode, ctx.lineCounter)
        : { line: 1, col: 1 };

      violations.push({
        ruleId: 'CV-M007',
        line: pos.line,
        column: pos.col,
        message: `Network '${netName}' is defined but not used by any service.`,
      });
    }

    return violations;
  },
};

/**
 * Find the AST key node for a specific entry within a top-level section.
 */
function findTopLevelKeyNode(
  ctx: ComposeRuleContext,
  section: string,
  entryName: string,
): any {
  const contents = ctx.doc.contents;
  if (!isMap(contents)) return null;

  for (const item of contents.items) {
    if (!isPair(item) || !isScalar(item.key)) continue;
    if (String(item.key.value) !== section) continue;

    if (isMap(item.value)) {
      for (const child of item.value.items) {
        if (isPair(child) && isScalar(child.key) && String(child.key.value) === entryName) {
          return child.key;
        }
      }
    }
    break;
  }

  return null;
}
