import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

/**
 * Suffix-based pattern to match environment variable names that likely contain secrets.
 * Matches names that END with one of the secret keywords (after an underscore or as the
 * full name). This avoids false positives on names like PASSWORD_MIN_LENGTH or TOKEN_EXPIRY.
 */
const SECRET_SUFFIX_PATTERN =
  /(?:_|^)(PASSWORD|PASSWD|SECRET|API_KEY|TOKEN|AUTH_TOKEN|ACCESS_KEY|SECRET_KEY|PRIVATE_KEY|CREDENTIALS|DB_PASS)$/i;

export const CVC008: ComposeLintRule = {
  id: 'CV-C008',
  title: 'Secrets in environment variables',
  severity: 'warning',
  category: 'security',
  explanation:
    'Storing secrets such as passwords, API keys, and tokens directly in environment ' +
    'variables within a Compose file exposes them in version control, process listings, ' +
    'container inspection output, and log files. Docker secrets or external .env files ' +
    '(excluded from version control) provide more secure alternatives.',
  fix: {
    description:
      'Use Docker secrets or .env files (excluded from version control) instead of inline values',
    beforeCode:
      'services:\n  web:\n    environment:\n      DB_PASSWORD: supersecret',
    afterCode:
      'services:\n  web:\n    secrets:\n      - db_password\nsecrets:\n  db_password:\n    file: ./secrets/db_password.txt',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'environment') continue;

        if (isMap(item.value)) {
          // Map form: environment: { KEY: value }
          for (const envItem of item.value.items) {
            if (!isPair(envItem) || !isScalar(envItem.key)) continue;
            const envName = String(envItem.key.value);

            if (SECRET_SUFFIX_PATTERN.test(envName)) {
              const pos = getNodeLine(envItem.key, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-C008',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' may contain secrets in environment variable '${envName}'. Use Docker secrets or .env files instead.`,
              });
            }
          }
        } else if (isSeq(item.value)) {
          // List form: environment: ["KEY=value"]
          for (const envItem of item.value.items) {
            if (!isScalar(envItem)) continue;
            const envStr = String(envItem.value);
            const eqIdx = envStr.indexOf('=');
            const envName = eqIdx !== -1 ? envStr.slice(0, eqIdx) : envStr;

            if (SECRET_SUFFIX_PATTERN.test(envName)) {
              const pos = getNodeLine(envItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-C008',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' may contain secrets in environment variable '${envName}'. Use Docker secrets or .env files instead.`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
