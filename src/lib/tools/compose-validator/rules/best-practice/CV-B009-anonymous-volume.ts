import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB009: ComposeLintRule = {
  id: 'CV-B009',
  title: 'Anonymous volume usage',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Anonymous volumes are created without a name and receive a random hash identifier. They ' +
    'are harder to manage, back up, and share between containers. Named volumes defined in ' +
    'the top-level volumes section are easier to identify, manage, and persist across ' +
    'container recreations.',
  fix: {
    description:
      'Replace anonymous volumes with named volumes defined in the top-level volumes section',
    beforeCode:
      'services:\n  db:\n    volumes:\n      - /var/lib/postgresql/data',
    afterCode:
      'services:\n  db:\n    volumes:\n      - db-data:/var/lib/postgresql/data\nvolumes:\n  db-data:',
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
          if (isScalar(volItem)) {
            // Short syntax: check for single path with no colon
            const volStr = String(volItem.value);

            // Anonymous volume: a single absolute path with no colon separator
            // e.g., "/data" or "/var/lib/data"
            // NOT a bind mount (./path or ~/path or /host:/container) or named (name:/path)
            if (!volStr.includes(':') && volStr.startsWith('/')) {
              const pos = getNodeLine(volItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-B009',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' uses anonymous volume '${volStr}'. Named volumes are easier to manage and backup.`,
              });
            }
          } else if (isMap(volItem)) {
            // Long syntax: check for type: volume with empty/missing source
            let isVolume = false;
            let hasSource = false;

            for (const vi of volItem.items) {
              if (!isPair(vi) || !isScalar(vi.key)) continue;
              const key = String(vi.key.value);

              if (key === 'type' && isScalar(vi.value) && String(vi.value.value) === 'volume') {
                isVolume = true;
              }
              if (key === 'source' && isScalar(vi.value) && String(vi.value.value) !== '') {
                hasSource = true;
              }
            }

            if (isVolume && !hasSource) {
              // Get target for the message
              let target = 'unknown';
              for (const vi of volItem.items) {
                if (!isPair(vi) || !isScalar(vi.key)) continue;
                if (String(vi.key.value) === 'target' && isScalar(vi.value)) {
                  target = String(vi.value.value);
                }
              }

              const pos = getNodeLine(volItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-B009',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' uses anonymous volume '${target}'. Named volumes are easier to manage and backup.`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
