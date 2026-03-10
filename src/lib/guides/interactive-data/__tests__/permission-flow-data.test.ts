/**
 * Data integrity tests for the permission flow explorer decision tree.
 *
 * Validates the node/edge/detail-content structure used by
 * PermissionFlowExplorer.tsx (INTV-01).
 */
import { describe, it, expect } from 'vitest';

import {
  rawNodes,
  rawEdges,
  detailContent,
} from '../permission-flow-data';

describe('permission-flow-data', () => {
  // ------ Node structure ------

  describe('rawNodes', () => {
    it('has exactly 8 nodes', () => {
      expect(rawNodes).toHaveLength(8);
    });

    it('contains exactly 1 input node', () => {
      const inputs = rawNodes.filter((n) => n.type === 'input');
      expect(inputs).toHaveLength(1);
      expect(inputs[0].id).toBe('entry');
    });

    it('contains exactly 3 decision nodes', () => {
      const decisions = rawNodes.filter((n) => n.type === 'decision');
      expect(decisions).toHaveLength(3);
      const ids = decisions.map((n) => n.id).sort();
      expect(ids).toEqual(['allow-check', 'ask-check', 'deny-check']);
    });

    it('contains exactly 4 result nodes', () => {
      const results = rawNodes.filter((n) => n.type === 'result');
      expect(results).toHaveLength(4);
      const ids = results.map((n) => n.id).sort();
      expect(ids).toEqual(['allowed', 'blocked', 'default-ask', 'prompt-user']);
    });

    it('decision nodes have correct outcomes', () => {
      const decisions = rawNodes.filter((n) => n.type === 'decision');
      const outcomes = Object.fromEntries(
        decisions.map((n) => [n.id, (n.data as { outcome: string }).outcome]),
      );
      expect(outcomes).toEqual({
        'deny-check': 'deny',
        'ask-check': 'ask',
        'allow-check': 'allow',
      });
    });

    it('all nodes have position {x:0, y:0} (dagre handles layout)', () => {
      for (const node of rawNodes) {
        expect(node.position).toEqual({ x: 0, y: 0 });
      }
    });
  });

  // ------ Edge structure ------

  describe('rawEdges', () => {
    it('has exactly 9 edges', () => {
      expect(rawEdges).toHaveLength(9);
    });

    it('all edge sources reference valid node IDs', () => {
      const nodeIds = new Set(rawNodes.map((n) => n.id));
      for (const edge of rawEdges) {
        expect(nodeIds.has(edge.source)).toBe(true);
      }
    });

    it('all edge targets reference valid node IDs', () => {
      const nodeIds = new Set(rawNodes.map((n) => n.id));
      for (const edge of rawEdges) {
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    });

    it('decision branch edges have Yes/No labels', () => {
      // Edges from decision nodes should have labels
      const decisionIds = new Set(['deny-check', 'ask-check', 'allow-check']);
      const decisionEdges = rawEdges.filter((e) => decisionIds.has(e.source));
      for (const edge of decisionEdges) {
        expect(['Yes', 'No']).toContain(edge.label);
      }
    });
  });

  // ------ Detail content ------

  describe('detailContent', () => {
    it('has entries for all 8 node IDs', () => {
      const nodeIds = rawNodes.map((n) => n.id);
      for (const id of nodeIds) {
        expect(detailContent).toHaveProperty(id);
      }
    });

    it('each entry has title (string), description (string), and details (array)', () => {
      for (const [id, content] of Object.entries(detailContent)) {
        expect(typeof content.title).toBe('string');
        expect(typeof content.description).toBe('string');
        expect(Array.isArray(content.details)).toBe(true);
        // At least 2 detail items per node
        expect(content.details.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('each detail item has key (string) and value (string)', () => {
      for (const [id, content] of Object.entries(detailContent)) {
        for (const detail of content.details) {
          expect(typeof detail.key).toBe('string');
          expect(typeof detail.value).toBe('string');
        }
      }
    });
  });
});
