import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';

/**
 * Check if a volume source string is a bind mount (not a named volume).
 */
function isBindMount(source: string): boolean {
  return (
    source.startsWith('.') ||
    source.startsWith('/') ||
    source.startsWith('~') ||
    source.includes('$')
  );
}

/**
 * Collect all named volume references from services (skip bind mounts).
 */
function collectUsedVolumes(services: Map<string, any>): Set<string> {
  const used = new Set<string>();

  for (const [, serviceNode] of services) {
    if (!isMap(serviceNode)) continue;

    for (const item of serviceNode.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) !== 'volumes') continue;
      if (!isSeq(item.value)) continue;

      for (const volItem of item.value.items) {
        if (isScalar(volItem)) {
          const volStr = String(volItem.value);
          const colonIdx = volStr.indexOf(':');
          if (colonIdx === -1) continue; // Anonymous volume
          const source = volStr.slice(0, colonIdx);
          if (!isBindMount(source) && source !== '') {
            used.add(source);
          }
        } else if (isMap(volItem)) {
          let volType = '';
          let source = '';
          for (const vi of volItem.items) {
            if (!isPair(vi) || !isScalar(vi.key)) continue;
            const key = String(vi.key.value);
            if (key === 'type' && isScalar(vi.value)) volType = String(vi.value.value);
            if (key === 'source' && isScalar(vi.value)) source = String(vi.value.value);
          }
          if (volType === 'volume' && source) {
            used.add(source);
          }
        }
      }
    }
  }

  return used;
}

export const CVM008: ComposeLintRule = {
  id: 'CV-M008',
  title: 'Orphan volume definition',
  severity: 'warning',
  category: 'semantic',
  explanation:
    'A volume is defined in the top-level volumes section but is not referenced by any ' +
    'service. Orphan volume definitions cause Docker to create empty volumes that consume ' +
    'disk space and add clutter. Remove unused volumes or mount them in the appropriate services.',
  fix: {
    description: 'Remove the unused volume or mount it in a service.',
    beforeCode:
      'services:\n  db:\n    image: postgres\nvolumes:\n  pgdata:\n  cache:',
    afterCode:
      'services:\n  db:\n    image: postgres\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const usedVolumes = collectUsedVolumes(ctx.services);

    for (const [volName] of ctx.volumes) {
      if (usedVolumes.has(volName)) continue;

      const volKeyNode = findTopLevelKeyNode(ctx, 'volumes', volName);
      const pos = volKeyNode
        ? getNodeLine(volKeyNode, ctx.lineCounter)
        : { line: 1, col: 1 };

      violations.push({
        ruleId: 'CV-M008',
        line: pos.line,
        column: pos.col,
        message: `Volume '${volName}' is defined but not used by any service.`,
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
