import { describe, it, expect } from 'vitest';
import {
  aiNodeSchema,
  edgeSchema,
  clusterSchema,
  exampleSchema,
  getNodeRelationships,
} from '../schema';
import type { Edge } from '../schema';

// --- Shared test fixtures ---

const validNode = {
  id: 'large-language-models',
  name: 'Large Language Models (LLM)',
  slug: 'large-language-models',
  cluster: 'genai',
  parentId: null,
  simpleDescription:
    'Large language models are AI systems trained on massive amounts of text data that can understand and generate human-like language. They power tools like ChatGPT and Claude.',
  technicalDescription:
    'LLMs are autoregressive transformer-based models trained via self-supervised learning on internet-scale text corpora. They use attention mechanisms to model long-range dependencies and are fine-tuned with RLHF for instruction following.',
  whyItMatters:
    'This is the technology behind ChatGPT, Claude, and Gemini.',
  examples: [
    { name: 'GPT-4o', description: 'OpenAI flagship multimodal model' },
    { name: 'Claude', description: 'Anthropic conversational AI assistant' },
  ],
  dotNodeId: 'LLM',
};

const validEdge = {
  source: 'machine-learning',
  target: 'artificial-intelligence',
  label: 'subset of',
  type: 'hierarchy' as const,
};

const validCluster = {
  id: 'genai',
  name: 'Generative AI (GenAI)',
  color: '#ffcdd2',
  darkColor: '#c62828',
  parentClusterId: 'dl',
};

// --- Tests ---

describe('exampleSchema', () => {
  it('validates a correct example', () => {
    const result = exampleSchema.safeParse({
      name: 'GPT-4o',
      description: 'OpenAI flagship multimodal model',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when name is missing', () => {
    const result = exampleSchema.safeParse({
      description: 'Some description',
    });
    expect(result.success).toBe(false);
  });
});

describe('aiNodeSchema', () => {
  it('validates a correct node with examples', () => {
    const result = aiNodeSchema.safeParse(validNode);
    expect(result.success).toBe(true);
  });

  it('validates a node without examples (defaults to empty array)', () => {
    const { examples, ...nodeWithoutExamples } = validNode;
    const result = aiNodeSchema.safeParse(nodeWithoutExamples);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.examples).toEqual([]);
    }
  });

  it('rejects when required fields are missing', () => {
    const result = aiNodeSchema.safeParse({
      id: 'some-node',
      name: 'Some Node',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when simpleDescription is too short', () => {
    const result = aiNodeSchema.safeParse({
      ...validNode,
      simpleDescription: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when technicalDescription is too short', () => {
    const result = aiNodeSchema.safeParse({
      ...validNode,
      technicalDescription: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null parentId for top-level nodes', () => {
    const result = aiNodeSchema.safeParse({
      ...validNode,
      parentId: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a non-null parentId', () => {
    const result = aiNodeSchema.safeParse({
      ...validNode,
      parentId: 'deep-learning',
    });
    expect(result.success).toBe(true);
  });
});

describe('edgeSchema', () => {
  it('validates a correct edge', () => {
    const result = edgeSchema.safeParse(validEdge);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid edge type', () => {
    const result = edgeSchema.safeParse({
      ...validEdge,
      type: 'invalid-type',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when required fields are missing', () => {
    const result = edgeSchema.safeParse({
      source: 'machine-learning',
    });
    expect(result.success).toBe(false);
  });

  it('validates all supported edge types', () => {
    const types = [
      'hierarchy', 'includes', 'enables', 'example', 'relates',
      'progression', 'characterizes', 'aspires', 'applies', 'standardizes',
    ];
    types.forEach((type) => {
      const result = edgeSchema.safeParse({ ...validEdge, type });
      expect(result.success).toBe(true);
    });
  });
});

describe('clusterSchema', () => {
  it('validates a cluster with a parent', () => {
    const result = clusterSchema.safeParse(validCluster);
    expect(result.success).toBe(true);
  });

  it('validates a top-level cluster with null parentClusterId', () => {
    const result = clusterSchema.safeParse({
      ...validCluster,
      parentClusterId: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when required fields are missing', () => {
    const result = clusterSchema.safeParse({
      id: 'genai',
    });
    expect(result.success).toBe(false);
  });
});

describe('getNodeRelationships', () => {
  const edges: Edge[] = [
    { source: 'machine-learning', target: 'artificial-intelligence', label: 'subset of', type: 'hierarchy' },
    { source: 'deep-learning', target: 'machine-learning', label: 'subset of', type: 'hierarchy' },
    { source: 'machine-learning', target: 'supervised-learning', label: 'types', type: 'includes' },
    { source: 'reinforcement-learning', target: 'machine-learning', label: 'informs', type: 'relates' },
    { source: 'machine-learning', target: 'agentic-ai', label: 'enables', type: 'enables' },
  ];

  it('returns correct parents (edges where node is target)', () => {
    const result = getNodeRelationships('machine-learning', edges);
    expect(result.parents).toHaveLength(2);
    expect(result.parents.map((e) => e.source)).toContain('deep-learning');
    expect(result.parents.map((e) => e.source)).toContain('reinforcement-learning');
  });

  it('returns correct children (edges where node is source)', () => {
    const result = getNodeRelationships('machine-learning', edges);
    expect(result.children).toHaveLength(3);
    expect(result.children.map((e) => e.target)).toContain('artificial-intelligence');
    expect(result.children.map((e) => e.target)).toContain('supervised-learning');
    expect(result.children.map((e) => e.target)).toContain('agentic-ai');
  });

  it('returns related edges (excluding hierarchy and includes)', () => {
    const result = getNodeRelationships('machine-learning', edges);
    expect(result.related).toHaveLength(2);
    expect(result.related.map((e) => e.type)).toContain('relates');
    expect(result.related.map((e) => e.type)).toContain('enables');
  });

  it('returns empty arrays for an unconnected node', () => {
    const result = getNodeRelationships('unknown-node', edges);
    expect(result.parents).toHaveLength(0);
    expect(result.children).toHaveLength(0);
    expect(result.related).toHaveLength(0);
  });
});
