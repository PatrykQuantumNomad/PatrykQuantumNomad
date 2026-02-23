import type { SchemaRuleMetadata } from '../../types';

export const CVS006: SchemaRuleMetadata = {
  id: 'CV-S006',
  title: 'Invalid Duration Format',
  severity: 'warning',
  category: 'schema',
  explanation:
    'Healthcheck fields (interval, timeout, start_period, start_interval) and stop_grace_period ' +
    'accept Docker duration format: a sequence of decimal numbers with unit suffixes such as "us" ' +
    '(microseconds), "ms" (milliseconds), "s" (seconds), "m" (minutes), "h" (hours). Examples: ' +
    '"30s", "5m", "1h30m", "2h30m15s". ISO 8601 durations (e.g., "PT30S") are also accepted. ' +
    'A common mistake is using a bare integer without a unit suffix (e.g., 30 instead of "30s"), ' +
    'or adding a space between the number and unit (e.g., "30 s" instead of "30s").',
  fix: {
    description: 'Use Docker duration format with unit suffix (s, m, h).',
    beforeCode: 'healthcheck:\n  interval: 30',
    afterCode: 'healthcheck:\n  interval: 30s',
  },
};
