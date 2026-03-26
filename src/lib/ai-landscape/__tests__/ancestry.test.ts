import { describe, it, expect } from 'vitest';
import { buildAncestryChain } from '../ancestry';
import type { AncestryItem } from '../ancestry';
import type { AiNode } from '../schema';
import nodes from '../../../data/ai-landscape/nodes.json';

// Build a Map<slug, AiNode> from real data
const nodesMap = new Map<string, AiNode>(
  (nodes as AiNode[]).map((n) => [n.slug, n]),
);

describe('buildAncestryChain', () => {
  it('returns correct ordered ancestry for a deeply nested concept (transformers)', () => {
    const chain = buildAncestryChain('transformers', nodesMap);

    // transformers -> deep-learning -> neural-networks -> machine-learning -> artificial-intelligence
    // Chain is root-first and does NOT include the node itself
    expect(chain).toHaveLength(4);
    expect(chain[0].slug).toBe('artificial-intelligence');
    expect(chain[1].slug).toBe('machine-learning');
    expect(chain[2].slug).toBe('neural-networks');
    expect(chain[3].slug).toBe('deep-learning');
  });

  it('returns correct ancestry for machine-learning (single ancestor)', () => {
    const chain = buildAncestryChain('machine-learning', nodesMap);

    // machine-learning -> artificial-intelligence (parentId = 'artificial-intelligence')
    expect(chain).toHaveLength(1);
    expect(chain[0].slug).toBe('artificial-intelligence');
    expect(chain[0].name).toBe('Artificial Intelligence (AI)');
    expect(chain[0].cluster).toBe('ai');
  });

  it('returns empty array for top-level concepts (parentId is null)', () => {
    const chain = buildAncestryChain('artificial-intelligence', nodesMap);
    expect(chain).toEqual([]);
  });

  it('returns empty array when slug is not found in the map', () => {
    const chain = buildAncestryChain('nonexistent-concept', nodesMap);
    expect(chain).toEqual([]);
  });

  it('does not include the node itself in the ancestry chain', () => {
    const chain = buildAncestryChain('deep-learning', nodesMap);

    // deep-learning -> neural-networks -> machine-learning -> artificial-intelligence
    expect(chain).toHaveLength(3);
    expect(chain.every((item) => item.slug !== 'deep-learning')).toBe(true);
    expect(chain[0].slug).toBe('artificial-intelligence');
    expect(chain[1].slug).toBe('machine-learning');
    expect(chain[2].slug).toBe('neural-networks');
  });

  it('handles circular parentId gracefully (does not infinite loop)', () => {
    // Create a small map with a circular reference
    const circularMap = new Map<string, AiNode>([
      [
        'node-a',
        {
          id: 'node-a',
          name: 'Node A',
          slug: 'node-a',
          cluster: 'test',
          parentId: 'node-b',
          simpleDescription: 'A'.repeat(50),
          technicalDescription: 'A'.repeat(50),
          whyItMatters: 'test',
          examples: [],
          dotNodeId: 'A',
        },
      ],
      [
        'node-b',
        {
          id: 'node-b',
          name: 'Node B',
          slug: 'node-b',
          cluster: 'test',
          parentId: 'node-a',
          simpleDescription: 'B'.repeat(50),
          technicalDescription: 'B'.repeat(50),
          whyItMatters: 'test',
          examples: [],
          dotNodeId: 'B',
        },
      ],
    ]);

    // Should return a chain without infinite looping
    const chain = buildAncestryChain('node-a', circularMap);
    // node-a's parent is node-b, node-b's parent is node-a (already visited) -> stop
    // Chain should contain only node-b
    expect(chain).toHaveLength(1);
    expect(chain[0].slug).toBe('node-b');
  });

  it('returns AncestryItem objects with slug, name, and cluster fields', () => {
    const chain = buildAncestryChain('transformers', nodesMap);

    for (const item of chain) {
      expect(item).toHaveProperty('slug');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('cluster');
      expect(typeof item.slug).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.cluster).toBe('string');
    }
  });
});
