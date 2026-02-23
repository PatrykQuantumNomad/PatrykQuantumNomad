import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * Parse an image string and return the tag portion.
 * Returns null if the image uses a digest reference (@sha256:...) -- digest pins are fine.
 * Returns 'latest' if no tag is specified (implicit latest).
 * Returns the tag string otherwise.
 */
function getImageTag(image: string): string | null {
  // If image uses a digest reference, tag is irrelevant (pinned)
  if (image.includes('@')) return null;

  // Split on '/' to separate registry from image name
  // e.g., "registry.example.com:5000/myapp:1.0" -> ["registry.example.com:5000", "myapp:1.0"]
  const parts = image.split('/');
  const lastPart = parts[parts.length - 1]; // e.g., "myapp:1.0" or "myapp"

  const colonIndex = lastPart.indexOf(':');
  if (colonIndex === -1) {
    return 'latest'; // no tag means implicit :latest
  }

  return lastPart.substring(colonIndex + 1);
}

/**
 * KA-R009: Image uses latest or no tag.
 *
 * Using the 'latest' tag (or no tag at all) makes deployments
 * non-reproducible and prevents reliable rollbacks.
 */
export const KAR009: K8sLintRule = {
  id: 'KA-R009',
  title: 'Image uses latest or no tag',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The container image uses the "latest" tag or has no tag specified (which ' +
    'defaults to "latest"). This makes deployments non-reproducible because the ' +
    'actual image version can change between pulls. It also prevents reliable ' +
    'rollbacks since there is no specific version to roll back to.',
  fix: {
    description: 'Pin the image to a specific version tag or digest',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:latest',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.2.3',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const image = container.image as string | undefined;
        if (!image) continue;

        const tag = getImageTag(image);
        if (tag === 'latest' || tag === '') {
          const node = resolveInstancePath(
            resource.doc,
            `${jsonPath}/image`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-R009',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' uses image '${image}' with ${tag === '' ? 'empty' : 'latest'} tag.`,
          });
        }
      }
    }

    return violations;
  },
};
