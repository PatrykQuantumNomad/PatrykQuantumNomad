import { describe, it, expect, beforeAll } from 'vitest';
import { layoutSchema, layoutPositionSchema, layoutMetaSchema } from '../layout-schema';
import type { Layout } from '../layout-schema';
import nodesData from '../../../data/ai-landscape/nodes.json';

// --- Schema unit tests ---

describe('layoutPositionSchema', () => {
  it('validates a correct position', () => {
    const result = layoutPositionSchema.safeParse({ id: 'machine-learning', x: 350.5, y: 400.2 });
    expect(result.success).toBe(true);
  });

  it('rejects position without x', () => {
    const result = layoutPositionSchema.safeParse({ id: 'machine-learning', y: 400 });
    expect(result.success).toBe(false);
  });

  it('rejects position without y', () => {
    const result = layoutPositionSchema.safeParse({ id: 'machine-learning', x: 350 });
    expect(result.success).toBe(false);
  });

  it('rejects position without id', () => {
    const result = layoutPositionSchema.safeParse({ x: 350, y: 400 });
    expect(result.success).toBe(false);
  });
});

describe('layoutMetaSchema', () => {
  it('validates correct meta', () => {
    const result = layoutMetaSchema.safeParse({
      width: 1200,
      height: 900,
      ticks: 300,
      generated: '2026-03-26T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects meta without ticks', () => {
    const result = layoutMetaSchema.safeParse({
      width: 1200,
      height: 900,
      generated: '2026-03-26T00:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('layoutSchema', () => {
  const validLayout: Layout = {
    meta: { width: 1200, height: 900, ticks: 300, generated: '2026-03-26T00:00:00Z' },
    positions: [{ id: 'ai', x: 100, y: 200 }],
  };

  it('validates a well-formed layout', () => {
    const result = layoutSchema.safeParse(validLayout);
    expect(result.success).toBe(true);
  });

  it('rejects layout without positions', () => {
    const result = layoutSchema.safeParse({ meta: validLayout.meta });
    expect(result.success).toBe(false);
  });

  it('rejects layout with empty positions array', () => {
    const result = layoutSchema.safeParse({ ...validLayout, positions: [] });
    expect(result.success).toBe(false);
  });

  it('rejects layout without meta', () => {
    const result = layoutSchema.safeParse({ positions: validLayout.positions });
    expect(result.success).toBe(false);
  });
});

// --- Integration tests against generated layout.json ---

describe('generated layout.json', () => {
  // These tests validate the generated layout.json against the schema
  // They will FAIL until generate-layout.mjs produces the file
  let layoutData: unknown = null;

  beforeAll(async () => {
    try {
      const layoutModule = await import('../../../data/ai-landscape/layout.json');
      layoutData = layoutModule.default ?? layoutModule;
    } catch {
      // File doesn't exist yet - tests will fail as expected in TDD RED
      layoutData = null;
    }
  });

  it('parses successfully through layoutSchema', () => {
    expect(layoutData).not.toBeNull();
    const result = layoutSchema.safeParse(layoutData);
    expect(result.success).toBe(true);
  });

  it('contains exactly 51 positions (one per node)', () => {
    expect(layoutData).not.toBeNull();
    const parsed = layoutSchema.parse(layoutData);
    expect(parsed.positions).toHaveLength(51);
  });

  it('has all positions within viewBox bounds (x: 0-1200, y: 0-900)', () => {
    expect(layoutData).not.toBeNull();
    const parsed = layoutSchema.parse(layoutData);
    for (const pos of parsed.positions) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(1200);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(900);
    }
  });

  it('has a position for every node ID in nodes.json', () => {
    expect(layoutData).not.toBeNull();
    const parsed = layoutSchema.parse(layoutData);
    const positionIds = new Set(parsed.positions.map((p) => p.id));
    for (const node of nodesData) {
      expect(positionIds.has(node.id), `Missing position for node: ${node.id}`).toBe(true);
    }
  });

  it('has correct meta dimensions', () => {
    expect(layoutData).not.toBeNull();
    const parsed = layoutSchema.parse(layoutData);
    expect(parsed.meta.width).toBe(1200);
    expect(parsed.meta.height).toBe(900);
    expect(parsed.meta.ticks).toBe(300);
  });
});
