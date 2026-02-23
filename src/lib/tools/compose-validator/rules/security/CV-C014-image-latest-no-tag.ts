import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC014: ComposeLintRule = {
  id: 'CV-C014',
  title: 'Image uses latest or no tag',
  severity: 'warning',
  category: 'security',
  explanation:
    'Using an image without a specific version tag (or with the :latest tag) means the ' +
    'container image can change between pulls without any configuration change. This makes ' +
    'deployments non-reproducible and can introduce security vulnerabilities or breaking ' +
    'changes unexpectedly. Supply chain attacks can target the :latest tag.',
  fix: {
    description: 'Pin the image to a specific version tag or SHA256 digest',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode: 'services:\n  web:\n    image: nginx:1.25.3-alpine',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'image') continue;
        if (!isScalar(item.value)) continue;

        const imageStr = String(item.value.value);

        // Skip images pinned by digest
        if (imageStr.includes('@sha256:')) continue;

        // Check for missing tag or :latest
        const colonIdx = imageStr.lastIndexOf(':');

        if (colonIdx === -1) {
          // No colon at all, no tag specified
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-C014',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' uses image '${imageStr}' without a specific version tag.`,
          });
        } else {
          // Has a colon, check if the tag portion is "latest"
          // Handle registry URLs with port: registry.example.com:5000/repo:latest
          // Only consider the part after the last colon as the tag if it doesn't contain /
          const afterColon = imageStr.slice(colonIdx + 1);
          if (!afterColon.includes('/') && afterColon === 'latest') {
            const pos = getNodeLine(item.key, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-C014',
              line: pos.line,
              column: pos.col,
              message: `Service '${serviceName}' uses image '${imageStr}' without a specific version tag.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
