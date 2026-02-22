import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';

/**
 * Collect all secret names referenced by any service.
 */
function collectUsedSecrets(services: Map<string, any>): Set<string> {
  const used = new Set<string>();

  for (const [, serviceNode] of services) {
    if (!isMap(serviceNode)) continue;

    for (const item of serviceNode.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) !== 'secrets') continue;
      if (!isSeq(item.value)) continue;

      for (const secItem of item.value.items) {
        if (isScalar(secItem)) {
          used.add(String(secItem.value));
        } else if (isMap(secItem)) {
          // Long form: check for source key
          for (const si of secItem.items) {
            if (isPair(si) && isScalar(si.key) && String(si.key.value) === 'source' && isScalar(si.value)) {
              used.add(String(si.value.value));
            }
          }
        }
      }
    }
  }

  return used;
}

export const CVM009: ComposeLintRule = {
  id: 'CV-M009',
  title: 'Orphan secret definition',
  severity: 'warning',
  category: 'semantic',
  explanation:
    'A secret is defined in the top-level secrets section but is not referenced by any ' +
    'service. Orphan secret definitions add unnecessary configuration and may indicate ' +
    'a misconfigured service that was supposed to use the secret. Remove unused secrets ' +
    'or add them to the appropriate services.',
  fix: {
    description: 'Remove the unused secret or add it to a service.',
    beforeCode:
      'services:\n  web:\n    image: nginx\nsecrets:\n  db_password:\n    file: ./pass.txt',
    afterCode:
      'services:\n  web:\n    image: nginx\n    secrets:\n      - db_password\nsecrets:\n  db_password:\n    file: ./pass.txt',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const usedSecrets = collectUsedSecrets(ctx.services);

    for (const [secName] of ctx.secrets) {
      if (usedSecrets.has(secName)) continue;

      const secKeyNode = findTopLevelKeyNode(ctx, 'secrets', secName);
      const pos = secKeyNode
        ? getNodeLine(secKeyNode, ctx.lineCounter)
        : { line: 1, col: 1 };

      violations.push({
        ruleId: 'CV-M009',
        line: pos.line,
        column: pos.col,
        message: `Secret '${secName}' is defined but not used by any service.`,
      });
    }

    return violations;
  },
};

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
