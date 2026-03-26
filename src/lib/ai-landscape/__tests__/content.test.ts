import { describe, it, expect } from 'vitest';
import { aiNodeSchema, edgeSchema, clusterSchema } from '../schema';
import nodesData from '../../../data/ai-landscape/nodes.json';
import graphData from '../../../data/ai-landscape/graph.json';

// Type assertions for JSON imports
const nodes = nodesData as Array<Record<string, unknown>>;
const edges = graphData.edges as Array<Record<string, unknown>>;
const clusters = graphData.clusters as Array<Record<string, unknown>>;

// --- Test groups ---

describe('node count and uniqueness', () => {
  it('has between 48 and 55 total nodes', () => {
    expect(nodes.length).toBeGreaterThanOrEqual(48);
    expect(nodes.length).toBeLessThanOrEqual(55);
  });

  it('all IDs are unique', () => {
    const ids = nodes.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all slugs are unique', () => {
    const slugs = nodes.map((n) => n.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('id matches slug for every node', () => {
    nodes.forEach((n) => {
      expect(n.id).toBe(n.slug);
    });
  });
});

describe('content quality - simpleDescription', () => {
  it.each(nodes.map((n) => [n.id, n.simpleDescription]))(
    '%s has at least 90 words in simpleDescription',
    (_id, desc) => {
      const wordCount = (desc as string).split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(90);
    },
  );

  it.each(nodes.map((n) => [n.id, n.simpleDescription]))(
    '%s has at most 200 words in simpleDescription',
    (_id, desc) => {
      const wordCount = (desc as string).split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(200);
    },
  );
});

describe('content quality - technicalDescription', () => {
  it.each(nodes.map((n) => [n.id, n.technicalDescription]))(
    '%s has at least 90 words in technicalDescription',
    (_id, desc) => {
      const wordCount = (desc as string).split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(90);
    },
  );

  it.each(nodes.map((n) => [n.id, n.technicalDescription]))(
    '%s has at most 200 words in technicalDescription',
    (_id, desc) => {
      const wordCount = (desc as string).split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(200);
    },
  );

  it.each(nodes.map((n) => [n.id, n.simpleDescription, n.technicalDescription]))(
    '%s has different simple and technical descriptions',
    (_id, simple, tech) => {
      expect(simple).not.toBe(tech);
    },
  );
});

describe('content quality - whyItMatters', () => {
  it.each(nodes.map((n) => [n.id, n.whyItMatters]))(
    '%s has non-empty whyItMatters',
    (_id, wim) => {
      expect((wim as string).length).toBeGreaterThan(0);
    },
  );

  it.each(nodes.map((n) => [n.id, n.whyItMatters]))(
    '%s has whyItMatters under 60 words',
    (_id, wim) => {
      const wordCount = (wim as string).split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(60);
    },
  );
});

describe('cluster coverage', () => {
  const expectedClusters = ['ai', 'ml', 'nn', 'dl', 'genai', 'levels', 'agentic', 'devtools'];

  it('all expected clusters have at least one node', () => {
    const nodeClusters = new Set(nodes.map((n) => n.cluster));
    expectedClusters.forEach((c) => {
      expect(nodeClusters.has(c)).toBe(true);
    });
  });

  it('graph.json defines all expected clusters', () => {
    const clusterIds = new Set(clusters.map((c) => c.id));
    expectedClusters.forEach((c) => {
      expect(clusterIds.has(c)).toBe(true);
    });
  });
});

describe('examples validation', () => {
  const nodesWithExpectedExamples = [
    'supervised-learning',
    'unsupervised-learning',
    'neural-networks',
    'deep-learning',
    'recurrent-neural-networks',
    'foundation-models',
    'reasoning-models',
    'large-language-models',
    'diffusion-models',
    'agentic-ai',
    'ai-coding-assistants',
  ];

  it.each(nodesWithExpectedExamples)(
    '%s has at least one example',
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      expect(node).toBeDefined();
      expect((node!.examples as unknown[]).length).toBeGreaterThanOrEqual(1);
    },
  );
});

describe('Zod schema validation', () => {
  it('all nodes pass aiNodeSchema safeParse', () => {
    nodes.forEach((n) => {
      const result = aiNodeSchema.safeParse(n);
      if (!result.success) {
        throw new Error(`Node ${n.id} failed validation: ${result.error.message}`);
      }
      expect(result.success).toBe(true);
    });
  });

  it('all edges pass edgeSchema safeParse', () => {
    edges.forEach((e) => {
      const result = edgeSchema.safeParse(e);
      if (!result.success) {
        throw new Error(`Edge ${e.source}->${e.target} failed validation: ${result.error.message}`);
      }
      expect(result.success).toBe(true);
    });
  });

  it('all clusters pass clusterSchema safeParse', () => {
    clusters.forEach((c) => {
      const result = clusterSchema.safeParse(c);
      if (!result.success) {
        throw new Error(`Cluster ${c.id} failed validation: ${result.error.message}`);
      }
      expect(result.success).toBe(true);
    });
  });
});

describe('edge-node referential integrity', () => {
  const nodeIds = new Set(nodes.map((n) => n.id));

  it('all edge sources reference valid node IDs', () => {
    edges.forEach((e) => {
      expect(nodeIds.has(e.source as string)).toBe(true);
    });
  });

  it('all edge targets reference valid node IDs', () => {
    edges.forEach((e) => {
      expect(nodeIds.has(e.target as string)).toBe(true);
    });
  });

  it('no duplicate edges exist', () => {
    const edgeKeys = edges.map((e) => `${e.source}|${e.target}|${e.type}`);
    const uniqueKeys = new Set(edgeKeys);
    expect(uniqueKeys.size).toBe(edgeKeys.length);
  });
});
