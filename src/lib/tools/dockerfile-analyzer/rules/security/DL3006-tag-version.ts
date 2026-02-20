import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3006: LintRule = {
  id: 'DL3006',
  title: 'Always tag the version of an image explicitly',
  severity: 'warning',
  category: 'security',
  explanation:
    'In production, untagged images default to :latest which can change without ' +
    'warning. A deployment that worked yesterday can break today because the base ' +
    'image was updated. Pinning to a specific tag (e.g., node:20-alpine) ensures ' +
    'reproducible builds and predictable behavior across environments.',
  fix: {
    description: 'Pin the base image to a specific version tag or digest',
    beforeCode: 'FROM ubuntu',
    afterCode: 'FROM ubuntu:22.04',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    // Collect all build stage aliases to avoid false positives on stage references
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
      const digest = from.getImageDigest();

      // Skip "FROM scratch" (no tag needed)
      if (imageName === 'scratch') continue;

      // Skip if referencing a build stage alias
      if (imageName && stageAliases.has(imageName.toLowerCase())) continue;

      if (!tag && !digest) {
        const range = from.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `FROM ${imageName ?? 'unknown'} has no version tag. Pin to a specific version.`,
        });
      }
    }

    return violations;
  },
};
