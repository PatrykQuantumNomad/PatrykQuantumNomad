import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVM005: ComposeLintRule = {
  id: 'CV-M005',
  title: 'Undefined secret reference',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service references a secret that is not defined in the top-level secrets section. ' +
    'Docker Compose requires all secrets used by services to be declared at the top level ' +
    'with either a file path or an external flag. Without a matching top-level declaration, ' +
    'Compose will fail at startup with a "secret not found" error.',
  fix: {
    description: 'Define the referenced secret in the top-level secrets section.',
    beforeCode:
      'services:\n  web:\n    secrets:\n      - db_password\n# No top-level secrets defined',
    afterCode:
      'services:\n  web:\n    secrets:\n      - db_password\nsecrets:\n  db_password:\n    file: ./secrets/db_password.txt',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const definedSecrets = new Set(ctx.secrets.keys());

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'secrets') continue;
        if (!isSeq(item.value)) continue;

        for (const secItem of item.value.items) {
          if (isScalar(secItem)) {
            // Short form: just the secret name
            const secName = String(secItem.value);
            if (!definedSecrets.has(secName)) {
              const pos = getNodeLine(secItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M005',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined secret '${secName}'.`,
              });
            }
          } else if (isMap(secItem)) {
            // Long form: { source: secret_name, target: /path, ... }
            // The effective secret name is source (or item name if no source)
            let secName = '';
            let nameNode: any = null;

            for (const si of secItem.items) {
              if (!isPair(si) || !isScalar(si.key)) continue;
              if (String(si.key.value) === 'source' && isScalar(si.value)) {
                secName = String(si.value.value);
                nameNode = si.value;
              }
            }

            // If no source key, fall back to first key as name
            if (!secName) {
              for (const si of secItem.items) {
                if (isPair(si) && isScalar(si.key)) {
                  // The long form items don't use name as a key; the short form is a scalar
                  // For map entries, look for a name-like pattern
                  break;
                }
              }
            }

            if (secName && !definedSecrets.has(secName)) {
              const pos = getNodeLine(nameNode ?? secItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M005',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined secret '${secName}'.`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
