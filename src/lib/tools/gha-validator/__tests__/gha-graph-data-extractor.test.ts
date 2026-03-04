import { describe, it, expect } from 'vitest';
import type { GhaUnifiedViolation } from '../types';

// Import will fail until implementation is created
import {
  extractGhaGraphData,
  type GhaGraphNode,
  type GhaGraphEdge,
  type GhaGraphData,
} from '../gha-graph-data-extractor';

// ── GRAPH-01: Three node types ─────────────────────────────────────

describe('GRAPH-01: Three node types', () => {
  it('extracts trigger node from on: string', () => {
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: { steps: [] } } },
      [],
    );
    const trigger = data.nodes.find((n) => n.id === 'trigger-push');
    expect(trigger).toBeDefined();
    expect(trigger!.type).toBe('trigger');
    expect(trigger!.label).toBe('push');
  });

  it('extracts trigger nodes from on: array', () => {
    const data = extractGhaGraphData(
      { on: ['push', 'pull_request'], jobs: { build: { steps: [] } } },
      [],
    );
    const triggers = data.nodes.filter((n) => n.type === 'trigger');
    expect(triggers).toHaveLength(2);
    expect(triggers.map((t) => t.label).sort()).toEqual([
      'pull_request',
      'push',
    ]);
  });

  it('extracts trigger nodes from on: object', () => {
    const data = extractGhaGraphData(
      {
        on: { push: { branches: ['main'] }, workflow_dispatch: {} },
        jobs: { build: { steps: [] } },
      },
      [],
    );
    const triggers = data.nodes.filter((n) => n.type === 'trigger');
    expect(triggers).toHaveLength(2);
    expect(triggers.map((t) => t.label).sort()).toEqual([
      'push',
      'workflow_dispatch',
    ]);
  });

  it('extracts job nodes from jobs: block', () => {
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: { steps: [] }, test: { steps: [] } } },
      [],
    );
    const jobs = data.nodes.filter((n) => n.type === 'job');
    expect(jobs).toHaveLength(2);
    expect(jobs.map((j) => j.label).sort()).toEqual(['build', 'test']);
  });

  it('extracts step nodes with parentJobId and stepIndex', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          build: {
            steps: [{ name: 'Checkout' }, { uses: 'actions/setup-node@v4' }],
          },
        },
      },
      [],
    );
    const steps = data.nodes.filter((n) => n.type === 'step');
    expect(steps).toHaveLength(2);

    const step0 = steps.find((s) => s.stepIndex === 0);
    expect(step0).toBeDefined();
    expect(step0!.id).toBe('step-build-0');
    expect(step0!.label).toBe('Checkout');
    expect(step0!.parentJobId).toBe('job-build');

    const step1 = steps.find((s) => s.stepIndex === 1);
    expect(step1).toBeDefined();
    expect(step1!.id).toBe('step-build-1');
    expect(step1!.label).toBe('actions/setup-node@v4');
    expect(step1!.parentJobId).toBe('job-build');
  });

  it('uses run snippet for step label when name and uses missing', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          build: {
            steps: [{ run: 'echo "Hello world from a long command that exceeds thirty characters"' }],
          },
        },
      },
      [],
    );
    const step = data.nodes.find((n) => n.type === 'step');
    expect(step).toBeDefined();
    expect(step!.label).toBe('echo "Hello world from a long ');
  });

  it('uses fallback label for step with no name, uses, or run', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: { build: { steps: [{ env: { FOO: 'bar' } }] } },
      },
      [],
    );
    const step = data.nodes.find((n) => n.type === 'step');
    expect(step).toBeDefined();
    expect(step!.label).toBe('Step 1');
  });
});

// ── GRAPH-02: Job dependency edges + cycle detection ───────────────

describe('GRAPH-02: Job dependency edges + cycle detection', () => {
  it('creates needs edge from string dependency', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          test: { steps: [] },
          deploy: { needs: 'test', steps: [] },
        },
      },
      [],
    );
    const needsEdges = data.edges.filter((e) => e.edgeType === 'needs');
    expect(needsEdges).toHaveLength(1);
    expect(needsEdges[0].source).toBe('job-test');
    expect(needsEdges[0].target).toBe('job-deploy');
  });

  it('creates needs edges from array dependency', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          test: { steps: [] },
          lint: { steps: [] },
          deploy: { needs: ['test', 'lint'], steps: [] },
        },
      },
      [],
    );
    const needsEdges = data.edges.filter((e) => e.edgeType === 'needs');
    expect(needsEdges).toHaveLength(2);
    const sources = needsEdges.map((e) => e.source).sort();
    expect(sources).toEqual(['job-lint', 'job-test']);
    expect(needsEdges.every((e) => e.target === 'job-deploy')).toBe(true);
  });

  it('detects circular needs dependencies', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          a: { needs: 'b', steps: [] },
          b: { needs: 'a', steps: [] },
        },
      },
      [],
    );
    expect(data.hasCycle).toBe(true);
    const cycleEdges = data.edges.filter((e) => e.isCycle);
    expect(cycleEdges.length).toBeGreaterThan(0);
  });

  it('marks non-cyclic graph as hasCycle false', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          test: { steps: [] },
          deploy: { needs: 'test', steps: [] },
        },
      },
      [],
    );
    expect(data.hasCycle).toBe(false);
    expect(data.edges.every((e) => !e.isCycle)).toBe(true);
  });

  it('detects 3-node cycle', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          a: { needs: 'c', steps: [] },
          b: { needs: 'a', steps: [] },
          c: { needs: 'b', steps: [] },
        },
      },
      [],
    );
    expect(data.hasCycle).toBe(true);
  });
});

// ── GRAPH-03: Trigger-to-job edges ─────────────────────────────────

describe('GRAPH-03: Trigger-to-job edges', () => {
  it('connects triggers to entry-point jobs only', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          test: { steps: [] },
          deploy: { needs: 'test', steps: [] },
        },
      },
      [],
    );
    const triggerEdges = data.edges.filter((e) => e.edgeType === 'trigger');
    expect(triggerEdges).toHaveLength(1);
    expect(triggerEdges[0].source).toBe('trigger-push');
    expect(triggerEdges[0].target).toBe('job-test');
  });

  it('connects multiple triggers to multiple entry-point jobs', () => {
    const data = extractGhaGraphData(
      {
        on: ['push', 'pull_request'],
        jobs: {
          lint: { steps: [] },
          test: { steps: [] },
          deploy: { needs: ['lint', 'test'], steps: [] },
        },
      },
      [],
    );
    const triggerEdges = data.edges.filter((e) => e.edgeType === 'trigger');
    // 2 triggers x 2 entry jobs = 4 edges
    expect(triggerEdges).toHaveLength(4);
  });

  it('does not create trigger edges when no on: block', () => {
    const data = extractGhaGraphData(
      { jobs: { build: { steps: [] } } },
      [],
    );
    const triggerEdges = data.edges.filter((e) => e.edgeType === 'trigger');
    expect(triggerEdges).toHaveLength(0);
    const triggers = data.nodes.filter((n) => n.type === 'trigger');
    expect(triggers).toHaveLength(0);
  });
});

// ── GRAPH-04: Steps as sequential nodes ────────────────────────────

describe('GRAPH-04: Steps as sequential nodes', () => {
  it('assigns sequential stepIndex values', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          build: {
            steps: [
              { name: 'Checkout' },
              { name: 'Install' },
              { name: 'Build' },
            ],
          },
        },
      },
      [],
    );
    const steps = data.nodes
      .filter((n) => n.type === 'step')
      .sort((a, b) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0));
    expect(steps).toHaveLength(3);
    expect(steps[0].stepIndex).toBe(0);
    expect(steps[1].stepIndex).toBe(1);
    expect(steps[2].stepIndex).toBe(2);
  });

  it('creates steps for multiple jobs independently', () => {
    const data = extractGhaGraphData(
      {
        on: 'push',
        jobs: {
          build: { steps: [{ name: 'A' }] },
          test: { steps: [{ name: 'B' }, { name: 'C' }] },
        },
      },
      [],
    );
    const buildSteps = data.nodes.filter(
      (n) => n.type === 'step' && n.parentJobId === 'job-build',
    );
    const testSteps = data.nodes.filter(
      (n) => n.type === 'step' && n.parentJobId === 'job-test',
    );
    expect(buildSteps).toHaveLength(1);
    expect(testSteps).toHaveLength(2);
  });

  it('handles job with empty steps array', () => {
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: { steps: [] } } },
      [],
    );
    const steps = data.nodes.filter((n) => n.type === 'step');
    expect(steps).toHaveLength(0);
    const jobs = data.nodes.filter((n) => n.type === 'job');
    expect(jobs).toHaveLength(1);
  });
});

// ── GRAPH-05: Violation status ─────────────────────────────────────

describe('GRAPH-05: Violation status', () => {
  it('sets error status when job has error-severity violation', () => {
    const violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-C001',
        message: 'build: uses latest tag',
        line: 10,
        column: 1,
        severity: 'error',
        category: 'security',
      },
    ];
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: { steps: [] } } },
      violations,
    );
    const buildJob = data.nodes.find((n) => n.id === 'job-build');
    expect(buildJob!.violationStatus).toBe('error');
  });

  it('sets warning status when job has warning but no error', () => {
    const violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-B001',
        message: 'build: missing timeout',
        line: 10,
        column: 1,
        severity: 'warning',
        category: 'best-practice',
      },
    ];
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: { steps: [] } } },
      violations,
    );
    const buildJob = data.nodes.find((n) => n.id === 'job-build');
    expect(buildJob!.violationStatus).toBe('warning');
  });

  it('sets clean status when job has no violations', () => {
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: { steps: [] } } },
      [],
    );
    const buildJob = data.nodes.find((n) => n.id === 'job-build');
    expect(buildJob!.violationStatus).toBe('clean');
  });

  it('error takes priority over warning', () => {
    const violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-B001',
        message: 'deploy: missing timeout',
        line: 10,
        column: 1,
        severity: 'warning',
        category: 'best-practice',
      },
      {
        ruleId: 'GA-C001',
        message: 'deploy: uses latest tag',
        line: 12,
        column: 1,
        severity: 'error',
        category: 'security',
      },
    ];
    const data = extractGhaGraphData(
      { on: 'push', jobs: { deploy: { steps: [] } } },
      violations,
    );
    const deployJob = data.nodes.find((n) => n.id === 'job-deploy');
    expect(deployJob!.violationStatus).toBe('error');
  });

  it('info-only violations result in clean status', () => {
    const violations: GhaUnifiedViolation[] = [
      {
        ruleId: 'GA-C004',
        message: 'build: missing permissions',
        line: 10,
        column: 1,
        severity: 'info',
        category: 'security',
      },
    ];
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: { steps: [] } } },
      violations,
    );
    const buildJob = data.nodes.find((n) => n.id === 'job-build');
    expect(buildJob!.violationStatus).toBe('clean');
  });
});

// ── Edge cases ─────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('returns empty data when jobs block is missing', () => {
    const data = extractGhaGraphData({}, []);
    expect(data.nodes).toEqual([]);
    expect(data.edges).toEqual([]);
    expect(data.hasCycle).toBe(false);
  });

  it('handles empty jobs block with only triggers', () => {
    const data = extractGhaGraphData({ on: 'push', jobs: {} }, []);
    const triggers = data.nodes.filter((n) => n.type === 'trigger');
    expect(triggers).toHaveLength(1);
    const jobs = data.nodes.filter((n) => n.type === 'job');
    expect(jobs).toHaveLength(0);
  });

  it('handles null/undefined inputs gracefully', () => {
    const data = extractGhaGraphData(
      { on: 'push', jobs: { build: null } } as any,
      [],
    );
    // Should not throw, may or may not produce nodes for null job
    expect(data).toBeDefined();
    expect(data.hasCycle).toBe(false);
  });
});
