import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3007: LintRule = {
  id: 'DL3007',
  title: 'Do not use the :latest tag',
  severity: 'warning',
  category: 'security',
  explanation:
    'The :latest tag is a moving target. In production, an image tagged :latest today ' +
    'may resolve to a completely different image tomorrow after the maintainer pushes ' +
    'an update. This breaks reproducibility -- your staging and production environments ' +
    'may run different code despite identical Dockerfiles. Always pin to a specific ' +
    'version tag (e.g., ubuntu:22.04) or a digest.',
  fix: {
    description: 'Replace :latest with a specific version tag',
    beforeCode: 'FROM ubuntu:latest',
    afterCode: 'FROM ubuntu:22.04',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    // Collect build stage aliases
    const stageAliases = new Set<string>();
    for (const from of froms) {
      const stage = from.getBuildStage();
      if (stage) {
        stageAliases.add(stage.toLowerCase());
      }
    }

    for (const from of froms) {
      const imageName = from.getImageName();
      const tag = from.getImageTag();

      // Skip scratch and stage references
      if (imageName === 'scratch') continue;
      if (imageName && stageAliases.has(imageName.toLowerCase())) continue;

      if (tag === 'latest') {
        const range = from.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: 'Image uses :latest tag. Pin to a specific version.',
        });
      }
    }

    return violations;
  },
};
