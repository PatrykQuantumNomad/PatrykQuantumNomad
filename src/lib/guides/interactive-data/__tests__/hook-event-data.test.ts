/**
 * Data integrity tests for hook event visualizer data module.
 *
 * Verifies the 18 hook events across 3 categories, edge connectivity,
 * and detail content completeness for the INTV-02 interactive component.
 */
import { describe, it, expect } from 'vitest';
import { rawNodes, rawEdges, detailContent } from '../hook-event-data';

// ---- Category definitions ----

const SESSION_EVENTS = ['SessionStart', 'SessionEnd'];

const LOOP_EVENTS = [
  'UserPromptSubmit',
  'PreToolUse',
  'PermissionRequest',
  'PostToolUse',
  'PostToolUseFailure',
  'Notification',
  'SubagentStart',
  'SubagentStop',
  'Stop',
  'TeammateIdle',
  'TaskCompleted',
  'PreCompact',
];

const STANDALONE_EVENTS = [
  'InstructionsLoaded',
  'ConfigChange',
  'WorktreeCreate',
  'WorktreeRemove',
];

const ALL_EVENTS = [...SESSION_EVENTS, ...LOOP_EVENTS, ...STANDALONE_EVENTS];

describe('hook-event-data', () => {
  describe('rawNodes', () => {
    const eventNodes = rawNodes.filter((n) => n.type === 'event');
    const categoryNodes = rawNodes.filter((n) => n.type === 'category');

    it('has exactly 18 event nodes', () => {
      expect(eventNodes).toHaveLength(18);
    });

    it('has exactly 3 category header nodes', () => {
      expect(categoryNodes).toHaveLength(3);
    });

    it('Session Events category has exactly SessionStart and SessionEnd', () => {
      const sessionEvents = eventNodes.filter(
        (n) => n.data.category === 'session',
      );
      const labels = sessionEvents.map((n) => n.id);
      expect(labels).toHaveLength(SESSION_EVENTS.length);
      for (const name of SESSION_EVENTS) {
        expect(labels).toContain(name);
      }
    });

    it('Loop Events category has exactly the 12 expected events', () => {
      const loopEvents = eventNodes.filter((n) => n.data.category === 'loop');
      const labels = loopEvents.map((n) => n.id);
      expect(labels).toHaveLength(LOOP_EVENTS.length);
      for (const name of LOOP_EVENTS) {
        expect(labels).toContain(name);
      }
    });

    it('Standalone Async Events category has exactly the 4 expected events', () => {
      const standaloneEvents = eventNodes.filter(
        (n) => n.data.category === 'standalone',
      );
      const labels = standaloneEvents.map((n) => n.id);
      expect(labels).toHaveLength(STANDALONE_EVENTS.length);
      for (const name of STANDALONE_EVENTS) {
        expect(labels).toContain(name);
      }
    });

    it('PreToolUse node has canBlock: true', () => {
      const preToolUse = rawNodes.find((n) => n.id === 'PreToolUse');
      expect(preToolUse).toBeDefined();
      expect(preToolUse!.data.canBlock).toBe(true);
    });
  });

  describe('rawEdges', () => {
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
  });

  describe('detailContent', () => {
    it('has an entry for each of the 18 event node IDs', () => {
      for (const eventId of ALL_EVENTS) {
        expect(detailContent).toHaveProperty(eventId);
      }
    });

    it('each entry has title (string)', () => {
      for (const eventId of ALL_EVENTS) {
        const entry = detailContent[eventId];
        expect(typeof entry.title).toBe('string');
        expect(entry.title.length).toBeGreaterThan(0);
      }
    });

    it('each entry has description (string)', () => {
      for (const eventId of ALL_EVENTS) {
        const entry = detailContent[eventId];
        expect(typeof entry.description).toBe('string');
        expect(entry.description.length).toBeGreaterThan(0);
      }
    });

    it('each entry has handlerTypes (array of strings with at least one item)', () => {
      for (const eventId of ALL_EVENTS) {
        const entry = detailContent[eventId];
        expect(Array.isArray(entry.handlerTypes)).toBe(true);
        expect(entry.handlerTypes.length).toBeGreaterThanOrEqual(1);
        for (const ht of entry.handlerTypes) {
          expect(typeof ht).toBe('string');
        }
      }
    });

    it('each entry has configExample (string)', () => {
      for (const eventId of ALL_EVENTS) {
        const entry = detailContent[eventId];
        expect(typeof entry.configExample).toBe('string');
        expect(entry.configExample.length).toBeGreaterThan(0);
      }
    });
  });
});
