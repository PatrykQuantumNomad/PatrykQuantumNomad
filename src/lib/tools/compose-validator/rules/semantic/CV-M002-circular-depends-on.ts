import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import { buildDependencyGraph, detectCycles } from '../../graph-builder';

export const CVM002: ComposeLintRule = {
  id: 'CV-M002',
  title: 'Circular depends_on chain',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A circular dependency exists between services via their depends_on declarations. ' +
    'Docker Compose cannot determine a valid startup order when services form a cycle ' +
    '(e.g., A depends on B, B depends on C, C depends on A). Compose will reject the ' +
    'file at startup with a "circular dependency" error. Break the cycle by removing ' +
    'one of the depends_on links or restructuring service relationships.',
  fix: {
    description: 'Remove one depends_on link to break the circular chain.',
    beforeCode:
      'services:\n  web:\n    depends_on: [api]\n  api:\n    depends_on: [db]\n  db:\n    depends_on: [web]',
    afterCode:
      'services:\n  web:\n    depends_on: [api]\n  api:\n    depends_on: [db]\n  db:\n    image: postgres',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    const graph = buildDependencyGraph(ctx.services);
    const result = detectCycles(graph);

    if (!result.hasCycle) return violations;

    const cycleSet = new Set(result.cycleParticipants);

    // Report on the depends_on key line for each cycle participant
    for (const name of result.cycleParticipants) {
      const serviceNode = ctx.services.get(name);
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) === 'depends_on') {
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-M002',
            line: pos.line,
            column: pos.col,
            message: `Service '${name}' is part of a circular dependency chain.`,
          });
          break;
        }
      }
    }

    return violations;
  },
};
