import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVM006: ComposeLintRule = {
  id: 'CV-M006',
  title: 'Undefined config reference',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service references a config that is not defined in the top-level configs section. ' +
    'Docker Compose requires all configs used by services to be declared at the top level ' +
    'with either a file path, content, or an external flag. Without a matching top-level ' +
    'declaration, Compose will fail at startup with a "config not found" error.',
  fix: {
    description: 'Define the referenced config in the top-level configs section.',
    beforeCode:
      'services:\n  web:\n    configs:\n      - nginx_conf\n# No top-level configs defined',
    afterCode:
      'services:\n  web:\n    configs:\n      - nginx_conf\nconfigs:\n  nginx_conf:\n    file: ./nginx.conf',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const definedConfigs = new Set(ctx.configs.keys());

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'configs') continue;
        if (!isSeq(item.value)) continue;

        for (const cfgItem of item.value.items) {
          if (isScalar(cfgItem)) {
            // Short form: just the config name
            const cfgName = String(cfgItem.value);
            if (!definedConfigs.has(cfgName)) {
              const pos = getNodeLine(cfgItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M006',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined config '${cfgName}'.`,
              });
            }
          } else if (isMap(cfgItem)) {
            // Long form: { source: config_name, target: /path, ... }
            let cfgName = '';
            let nameNode: any = null;

            for (const ci of cfgItem.items) {
              if (!isPair(ci) || !isScalar(ci.key)) continue;
              if (String(ci.key.value) === 'source' && isScalar(ci.value)) {
                cfgName = String(ci.value.value);
                nameNode = ci.value;
              }
            }

            if (cfgName && !definedConfigs.has(cfgName)) {
              const pos = getNodeLine(nameNode ?? cfgItem, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M006',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' references undefined config '${cfgName}'.`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
