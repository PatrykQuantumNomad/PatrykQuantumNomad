import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB008: ComposeLintRule = {
  id: 'CV-B008',
  title: 'Both build and image specified',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'When a service specifies both "build" and "image", Docker Compose builds the image from ' +
    'the Dockerfile and tags it with the "image" name. While this is valid, it can cause ' +
    'confusion. Developers may expect "image" to pull a pre-built image, not realize a ' +
    'local build occurs, or accidentally push locally-built images to a registry.',
  fix: {
    description:
      'Use either build (for local builds) or image (for pre-built images), not both, unless intentionally tagging build output',
    beforeCode:
      'services:\n  web:\n    build: .\n    image: myapp:latest',
    afterCode: 'services:\n  web:\n    build: .',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasBuild = false;
      let hasImage = false;
      let buildKeyNode: any = null;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;

        const keyName = String(item.key.value);
        if (keyName === 'build') {
          hasBuild = true;
          buildKeyNode = item.key;
        }
        if (keyName === 'image') {
          hasImage = true;
        }
      }

      if (hasBuild && hasImage && buildKeyNode) {
        const pos = getNodeLine(buildKeyNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-B008',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' specifies both 'build' and 'image'. The image tag will be applied to the built image, which may cause confusion.`,
        });
      }
    }

    return violations;
  },
};
