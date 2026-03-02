import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG012: LintRule = {
  id: 'PG012',
  title: 'Consider pointer compression for Node.js images',
  severity: 'info',
  category: 'efficiency',
  explanation:
    'V8 pointer compression shrinks every internal pointer from 64 bits to 32 bits. Since ' +
    'tagged values (mostly pointers) make up roughly 70% of all heap memory, this single ' +
    'change can reduce memory usage by approximately 50% for pointer-heavy Node.js workloads ' +
    '-- with no code changes required. The platformatic/node-caged Docker image ships Node.js ' +
    'built with the --experimental-enable-pointer-compression flag enabled, making pointer ' +
    'compression available as a one-line Dockerfile swap. This optimization requires Node.js ' +
    '25 or later (which includes the V8 IsolateGroups feature that removes the old process-wide ' +
    '4GB heap limit). Each V8 isolate (main thread or worker) is still limited to 4GB of ' +
    'compressed heap, but native allocations and Buffers do not count against this limit. ' +
    'N-API addons are compatible; however, addons using the older V8 native addon API may not ' +
    'work. Production benchmarks on AWS EKS show 50% memory reduction with only 2-4% average ' +
    'latency overhead and a 7% improvement in P99 latency.',
  fix: {
    description:
      'Replace the official Node.js base image with platformatic/node-caged, which ships ' +
      'Node.js 25+ built with V8 pointer compression enabled. This is a drop-in replacement ' +
      'for most workloads. Verify your application does not require more than 4GB of heap per ' +
      'isolate and does not rely on non-N-API native addons.',
    beforeCode:
      'FROM node:22-bookworm-slim\n' +
      'WORKDIR /app\n' +
      'COPY . .\n' +
      'CMD ["node", "server.js"]',
    afterCode:
      'FROM platformatic/node-caged:25-slim\n' +
      'WORKDIR /app\n' +
      'COPY . .\n' +
      'CMD ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    if (froms.length === 0) return violations;

    // Collect all build stage aliases
    const stageAliases = new Set<string>();
    for (const from of froms) {
      const stage = from.getBuildStage();
      if (stage) stageAliases.add(stage.toLowerCase());
    }

    // Only check the final stage
    const lastFrom = froms.at(-1);
    if (!lastFrom) return violations;

    const imageName = lastFrom.getImageName();
    if (!imageName) return violations;

    // Skip build stage alias references
    if (stageAliases.has(imageName.toLowerCase())) return violations;

    // Skip scratch
    if (imageName === 'scratch') return violations;

    // Check if this is an official Docker Hub node image
    const registry = lastFrom.getRegistry();
    const isDockerHub = registry === null || registry === 'docker.io';
    const isNodeImage = imageName === 'node' || imageName === 'library/node';

    if (!isDockerHub || !isNodeImage) return violations;

    // Official node image in final stage -- suggest pointer compression
    const range = lastFrom.getRange();
    violations.push({
      ruleId: this.id,
      line: range.start.line + 1,
      column: 1,
      message:
        'Consider using platformatic/node-caged for V8 pointer compression. ' +
        'Node.js 25+ with pointer compression can reduce memory usage by ~50%.',
    });

    return violations;
  },
};
