import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG006: LintRule = {
  id: 'PG006',
  title: 'Prefer image digest over mutable tag',
  severity: 'info',
  category: 'security',
  explanation:
    'Image tags are mutable. Maintainers can rebuild and push a new image under the ' +
    'same tag at any time. A deployment pinned to node:20-alpine today may silently run ' +
    'a different image tomorrow. A digest (e.g., node:20-alpine@sha256:abc...) is the ' +
    'only truly immutable image reference and guarantees bit-for-bit reproducible builds.',
  fix: {
    description:
      'Pin the base image to a digest. Run `docker pull <image>` then ' +
      '`docker inspect --format=\'{{index .RepoDigests 0}}\' <image>` to get the digest.',
    beforeCode: 'FROM node:20-alpine',
    afterCode: 'FROM node:20-alpine@sha256:1a2b3c...',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    // Collect build stage aliases to avoid false positives
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

      // Skip "FROM scratch"
      if (imageName === 'scratch') continue;

      // Skip build stage alias references
      if (imageName && stageAliases.has(imageName.toLowerCase())) continue;

      // Skip when the tag is a variable reference (e.g., ${DEBIAN_TAG}) --
      // the actual value is injected at build time and may already be a digest
      if (tag && /\$\{?\w+\}?/.test(tag)) continue;

      // Only flag when there IS a tag but NO digest
      if (tag && !digest) {
        const range = from.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `FROM ${imageName ?? 'unknown'}:${tag} uses a mutable tag. Pin to a digest for immutable builds.`,
        });
      }
    }

    return violations;
  },
};
