import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

const MUTABLE_TAGS = new Set([
  'latest',
  'stable',
  'edge',
  'lts',
  'beta',
  'alpha',
  'rc',
  'dev',
  'nightly',
  'canary',
  'main',
  'master',
]);

export const CVB004: ComposeLintRule = {
  id: 'CV-B004',
  title: 'Image tag not pinned (mutable tag)',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Mutable tags like latest, stable, edge, and nightly can point to different image versions ' +
    'over time. This means the same Compose file can produce different results on different ' +
    'machines or at different times, making deployments non-reproducible and difficult to debug.',
  fix: {
    description:
      'Pin the image to a specific immutable version tag or SHA256 digest',
    beforeCode: 'services:\n  web:\n    image: nginx:stable',
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

        // Extract tag portion
        const colonIdx = imageStr.lastIndexOf(':');
        if (colonIdx === -1) continue; // No tag at all -- handled by CV-C014

        const tag = imageStr.slice(colonIdx + 1);

        // Skip if tag contains / (it's a registry port, not a tag)
        if (tag.includes('/')) continue;

        // Skip "latest" -- handled by CV-C014
        if (tag === 'latest') continue;

        if (MUTABLE_TAGS.has(tag.toLowerCase())) {
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-B004',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' uses mutable tag '${tag}' which may change unexpectedly.`,
          });
        }
      }
    }

    return violations;
  },
};
