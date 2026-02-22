import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

/**
 * Parse a Docker duration string into milliseconds.
 * Supported units: ns, us, ms, s, m, h
 * Examples: "30s", "5m", "1h30m", "500ms"
 */
function parseDuration(durationStr: string): number | null {
  if (!durationStr || typeof durationStr !== 'string') return null;

  const unitMultipliers: Record<string, number> = {
    ns: 0.000001,
    us: 0.001,
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
  };

  const pattern = /(\d+)(ns|us|ms|s|m|h)/g;
  let totalMs = 0;
  let matched = false;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(durationStr)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    totalMs += value * unitMultipliers[unit];
    matched = true;
  }

  return matched ? totalMs : null;
}

export const CVB011: ComposeLintRule = {
  id: 'CV-B011',
  title: 'Healthcheck timeout exceeds interval',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'When a healthcheck timeout is greater than or equal to the interval, a slow healthcheck ' +
    'probe can overlap with the next scheduled probe. This means Docker may start a new health ' +
    'check before the previous one completes, leading to resource waste and misleading health ' +
    'status reports.',
  fix: {
    description:
      'Set the healthcheck timeout to be shorter than the interval',
    beforeCode:
      'services:\n  web:\n    healthcheck:\n      test: ["CMD", "curl", "-f", "http://localhost"]\n      interval: 30s\n      timeout: 60s',
    afterCode:
      'services:\n  web:\n    healthcheck:\n      test: ["CMD", "curl", "-f", "http://localhost"]\n      interval: 30s\n      timeout: 10s',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'healthcheck') continue;
        if (!isMap(item.value)) continue;

        let timeoutStr: string | null = null;
        let intervalStr: string | null = null;
        let timeoutKeyNode: any = null;

        for (const hcItem of item.value.items) {
          if (!isPair(hcItem) || !isScalar(hcItem.key)) continue;

          const key = String(hcItem.key.value);
          if (key === 'timeout' && isScalar(hcItem.value)) {
            timeoutStr = String(hcItem.value.value);
            timeoutKeyNode = hcItem.key;
          }
          if (key === 'interval' && isScalar(hcItem.value)) {
            intervalStr = String(hcItem.value.value);
          }
        }

        // Only compare when both are explicitly set
        if (timeoutStr === null || intervalStr === null) continue;

        const timeoutMs = parseDuration(timeoutStr);
        const intervalMs = parseDuration(intervalStr);

        if (timeoutMs === null || intervalMs === null) continue;

        if (timeoutMs >= intervalMs && timeoutKeyNode) {
          const pos = getNodeLine(timeoutKeyNode, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-B011',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' healthcheck timeout (${timeoutStr}) exceeds interval (${intervalStr}).`,
          });
        }
      }
    }

    return violations;
  },
};
