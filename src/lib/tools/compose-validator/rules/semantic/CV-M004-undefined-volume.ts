import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';

/**
 * Check if a volume source string is a bind mount (starts with ., /, ~, or contains $).
 * Bind mounts are host paths, not named volumes, and do not need top-level declarations.
 */
function isBindMount(source: string): boolean {
  return (
    source.startsWith('.') ||
    source.startsWith('/') ||
    source.startsWith('~') ||
    source.includes('$')
  );
}

export const CVM004: ComposeLintRule = {
  id: 'CV-M004',
  title: 'Undefined volume reference',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service references a named volume that is not defined in the top-level volumes section. ' +
    'Docker Compose will fail at startup when a service mounts a named volume that does not ' +
    'exist in the top-level declaration. Bind mounts (paths starting with ./, /, or ~) and ' +
    'anonymous volumes (single container path) do not require top-level declarations. Only ' +
    'named volumes (source:target where source is a plain name) must be declared.',
  fix: {
    description: 'Define the referenced volume in the top-level volumes section.',
    beforeCode:
      'services:\n  db:\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n# No top-level volumes defined',
    afterCode:
      'services:\n  db:\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const definedVolumes = new Set(ctx.volumes.keys());

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'volumes') continue;
        if (!isSeq(item.value)) continue;

        for (const volItem of item.value.items) {
          if (isScalar(volItem)) {
            // Short syntax: "source:target[:mode]" or "/container/path" (anonymous)
            const volStr = String(volItem.value);
            const colonIdx = volStr.indexOf(':');
            if (colonIdx === -1) continue; // Anonymous volume, no source check needed

            const source = volStr.slice(0, colonIdx);
            if (isBindMount(source)) continue; // Bind mount, not a named volume
            if (source === '') continue; // Empty source

            if (!definedVolumes.has(source)) {
              const pos = getNodeLine(volItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M004',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined volume '${source}'.`,
              });
            }
          } else if (isMap(volItem)) {
            // Long syntax: { type: volume, source: myvolume, target: /data }
            let volType = '';
            let source = '';
            let sourceNode: any = null;

            for (const vi of volItem.items) {
              if (!isPair(vi) || !isScalar(vi.key)) continue;
              const key = String(vi.key.value);
              if (key === 'type' && isScalar(vi.value)) {
                volType = String(vi.value.value);
              }
              if (key === 'source' && isScalar(vi.value)) {
                source = String(vi.value.value);
                sourceNode = vi.value;
              }
            }

            // Only 'volume' type references need top-level declarations
            if (volType === 'volume' && source && !definedVolumes.has(source)) {
              const pos = getNodeLine(sourceNode ?? volItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M004',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined volume '${source}'.`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
