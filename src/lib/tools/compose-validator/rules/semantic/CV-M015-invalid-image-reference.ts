import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';

/**
 * Simplified OCI image reference regex.
 *
 * Matches: registry/repo:tag, repo:tag, repo@sha256:..., multi-level paths.
 * Intentionally simplified -- catches obviously invalid references (spaces,
 * uppercase repo names, invalid characters) without enforcing every OCI rule.
 *
 * Components:
 *   - Name: lowercase alphanumeric, dots, dashes, slashes, underscores
 *   - Tag: alphanumeric, dots, dashes, underscores (after colon)
 *   - Digest: @sha256:<64 hex chars>
 */
const IMAGE_REFERENCE_REGEX =
  /^[a-z0-9]([a-z0-9._\/-]*[a-z0-9])?(:[a-zA-Z0-9_.-]+)?(@sha256:[a-fA-F0-9]{64})?$/;

export const CVM015: ComposeLintRule = {
  id: 'CV-M015',
  title: 'Invalid image reference format',
  severity: 'warning',
  category: 'semantic',
  explanation:
    'The image reference does not match the expected Docker image format. Valid references ' +
    'consist of a lowercase repository name (optionally prefixed with a registry hostname), ' +
    'an optional tag after a colon, and an optional digest after @sha256:. Common issues ' +
    'include uppercase characters in the repository name, spaces, or special characters ' +
    'that Docker cannot resolve. Services without an image key (using build instead) are ' +
    'not checked.',
  fix: {
    description: 'Use a valid Docker image reference format.',
    beforeCode:
      'services:\n  web:\n    image: My App:Latest',
    afterCode:
      'services:\n  web:\n    image: myapp:latest',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'image') continue;
        if (!isScalar(item.value)) continue;

        const imageRef = String(item.value.value);
        if (!imageRef) continue; // Empty image, skip

        if (!IMAGE_REFERENCE_REGEX.test(imageRef)) {
          const pos = getNodeLine(item.value, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-M015',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' has invalid image reference '${imageRef}'.`,
          });
        }
      }
    }

    return violations;
  },
};
