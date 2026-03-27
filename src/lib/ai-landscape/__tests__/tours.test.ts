import { describe, it, expect } from 'vitest';
import { TOURS } from '../tours';
import nodesData from '../../../data/ai-landscape/nodes.json';

// Build a Set of valid node slugs from the dataset
const nodes = nodesData as Array<Record<string, unknown>>;
const validSlugs = new Set(nodes.map((n) => n.slug as string));

describe('TOURS array', () => {
  it('has exactly 3 entries', () => {
    expect(TOURS).toHaveLength(3);
  });

  it('each tour has a non-empty id, title, and description', () => {
    TOURS.forEach((tour) => {
      expect(tour.id).toBeTruthy();
      expect(tour.title).toBeTruthy();
      expect(tour.description).toBeTruthy();
    });
  });

  it('each tour has at least 5 steps', () => {
    TOURS.forEach((tour) => {
      expect(tour.steps.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('all tour step nodeIds exist in the dataset', () => {
    TOURS.forEach((tour) => {
      tour.steps.forEach((step) => {
        expect(
          validSlugs.has(step.nodeId),
          `Tour "${tour.title}" references unknown nodeId "${step.nodeId}"`,
        ).toBe(true);
      });
    });
  });

  it('no duplicate nodeIds within a single tour', () => {
    TOURS.forEach((tour) => {
      const nodeIds = tour.steps.map((s) => s.nodeId);
      const uniqueIds = new Set(nodeIds);
      expect(
        uniqueIds.size,
        `Tour "${tour.title}" has duplicate nodeIds`,
      ).toBe(nodeIds.length);
    });
  });

  it('each step has a non-empty narrative', () => {
    TOURS.forEach((tour) => {
      tour.steps.forEach((step) => {
        expect(
          step.narrative.length,
          `Tour "${tour.title}" step "${step.nodeId}" has empty narrative`,
        ).toBeGreaterThan(0);
      });
    });
  });
});
