import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3024: LintRule = {
  id: 'DL3024',
  title: 'FROM aliases must be unique',
  severity: 'error',
  category: 'reliability',
  explanation:
    'Duplicate FROM aliases (AS name) cause ambiguity in multi-stage builds. When ' +
    'COPY --from=alias is used, Docker resolves to the LAST stage with that alias, ' +
    'silently ignoring earlier stages. In production, this leads to builds that ' +
    'copy files from the wrong stage, producing incorrect images that may pass tests ' +
    'but fail in deployment. Every build stage alias must be unique.',
  fix: {
    description: 'Give each build stage a unique alias',
    beforeCode:
      'FROM node:20 AS build\n# ...\nFROM node:20 AS build',
    afterCode:
      'FROM node:20 AS build\n# ...\nFROM node:20 AS runtime',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    const seenAliases = new Map<string, number>();

    for (const from of froms) {
      const alias = from.getBuildStage();
      if (!alias) continue;

      const lowerAlias = alias.toLowerCase();

      if (seenAliases.has(lowerAlias)) {
        const range = from.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `Duplicate FROM alias '${alias}'. Each build stage alias must be unique.`,
        });
      } else {
        seenAliases.set(lowerAlias, from.getRange().start.line);
      }
    }

    return violations;
  },
};
