/**
 * GHA Graph Data Extractor
 *
 * Parses workflow JSON into typed graph nodes and edges for React Flow
 * visualization. Separates graph data logic from rendering (same pattern
 * as compose-validator/graph-data-extractor.ts).
 *
 * Handles three node types (trigger, job, step), three edge types
 * (trigger, needs, cycle), and per-job violation status mapping.
 *
 * Cycle detection uses Kahn's algorithm (BFS topological sort),
 * ported from compose-validator/graph-builder.ts.
 */

import type { GhaUnifiedViolation } from './types';

// ── Exported types ─────────────────────────────────────────────────

export type GhaNodeType = 'trigger' | 'job' | 'step';
export type GhaViolationStatus = 'error' | 'warning' | 'clean';
export type GhaEdgeType = 'trigger' | 'needs';

export interface GhaGraphNode {
  id: string;
  type: GhaNodeType;
  label: string;
  parentJobId?: string;
  stepIndex?: number;
  violationStatus: GhaViolationStatus;
}

export interface GhaGraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: GhaEdgeType;
  label?: string;
  isCycle?: boolean;
}

export interface GhaGraphData {
  nodes: GhaGraphNode[];
  edges: GhaGraphEdge[];
  hasCycle: boolean;
}

// ── Main extractor ─────────────────────────────────────────────────

/**
 * Extract graph data from parsed workflow JSON and unified violations.
 *
 * @param json - Parsed workflow YAML as plain object
 * @param violations - Unified violations from engine passes
 * @returns Graph data with nodes, edges, and cycle detection result
 */
export function extractGhaGraphData(
  json: Record<string, unknown>,
  violations: GhaUnifiedViolation[],
): GhaGraphData {
  const nodes: GhaGraphNode[] = [];
  const edges: GhaGraphEdge[] = [];

  // 1. Parse on: block -> trigger nodes
  const triggerNames = parseTriggerEvents(json.on);
  for (const name of triggerNames) {
    nodes.push({
      id: `trigger-${name}`,
      type: 'trigger',
      label: name,
      violationStatus: 'clean',
    });
  }

  // 2. Parse jobs: block -> job nodes, step nodes, needs edges
  const jobs = json.jobs as Record<string, any> | undefined;
  if (!jobs || typeof jobs !== 'object') {
    return { nodes, edges, hasCycle: false };
  }

  // Build job dependency map for cycle detection
  const jobDepsMap = new Map<string, string[]>();

  for (const [jobKey, jobDef] of Object.entries(jobs)) {
    if (!jobDef || typeof jobDef !== 'object') continue;

    const jobId = `job-${jobKey}`;

    // Compute violation status for this job
    const status = computeJobViolationStatus(jobKey, violations);

    nodes.push({
      id: jobId,
      type: 'job',
      label: jobKey,
      violationStatus: status,
    });

    // Parse needs: dependencies
    const needs = parseNeeds(jobDef.needs);
    jobDepsMap.set(jobKey, needs);

    for (const dep of needs) {
      edges.push({
        id: `edge-${dep}-${jobKey}`,
        source: `job-${dep}`,
        target: jobId,
        edgeType: 'needs',
      });
    }

    // Parse steps: array -> step nodes
    if (Array.isArray(jobDef.steps)) {
      for (let i = 0; i < jobDef.steps.length; i++) {
        const step = jobDef.steps[i];
        const label = resolveStepLabel(step, i);
        nodes.push({
          id: `step-${jobKey}-${i}`,
          type: 'step',
          label,
          parentJobId: jobId,
          stepIndex: i,
          violationStatus: 'clean',
        });
      }
    }
  }

  // 3. Connect triggers to entry-point jobs (jobs with no needs:)
  const entryPointJobs = Array.from(jobDepsMap.entries())
    .filter(([, deps]) => deps.length === 0)
    .map(([jobKey]) => jobKey);

  for (const triggerName of triggerNames) {
    for (const jobKey of entryPointJobs) {
      edges.push({
        id: `edge-trigger-${triggerName}-${jobKey}`,
        source: `trigger-${triggerName}`,
        target: `job-${jobKey}`,
        edgeType: 'trigger',
      });
    }
  }

  // 4. Cycle detection
  const cycleResult = detectJobCycles(jobDepsMap);

  if (cycleResult.hasCycle) {
    const cycleSet = new Set(cycleResult.cycleParticipants);
    // Mark needs edges between cycle participants
    for (const edge of edges) {
      if (edge.edgeType === 'needs') {
        const sourceJob = edge.source.replace('job-', '');
        const targetJob = edge.target.replace('job-', '');
        if (cycleSet.has(sourceJob) && cycleSet.has(targetJob)) {
          edge.isCycle = true;
        }
      }
    }
  }

  return {
    nodes,
    edges,
    hasCycle: cycleResult.hasCycle,
  };
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Parse the on: block into an array of trigger event names.
 * Handles string ('push'), array (['push', 'pull_request']),
 * and object ({ push: { branches: ['main'] } }) forms.
 */
function parseTriggerEvents(on: unknown): string[] {
  if (!on) return [];
  if (typeof on === 'string') return [on];
  if (Array.isArray(on)) return on.map(String);
  if (typeof on === 'object') return Object.keys(on as object);
  return [];
}

/**
 * Parse needs: field into an array of job keys.
 * Handles string ('test') and array (['test', 'lint']) forms.
 */
function parseNeeds(needs: unknown): string[] {
  if (!needs) return [];
  if (typeof needs === 'string') return [needs];
  if (Array.isArray(needs)) return needs.map(String);
  return [];
}

/**
 * Resolve a human-readable label for a step.
 * Priority: step.name > step.uses > step.run (first 30 chars) > 'Step {i+1}'
 */
function resolveStepLabel(step: any, index: number): string {
  if (!step || typeof step !== 'object') return `Step ${index + 1}`;
  if (typeof step.name === 'string') return step.name;
  if (typeof step.uses === 'string') return step.uses;
  if (typeof step.run === 'string') return step.run.slice(0, 30);
  return `Step ${index + 1}`;
}

/**
 * Compute the violation status for a job based on unified violations.
 *
 * Matches violations to jobs by checking if the violation message
 * contains the job key as a substring (e.g., "build: uses latest tag").
 *
 * Only error and warning severities affect status. Info is treated as clean.
 */
function computeJobViolationStatus(
  jobKey: string,
  violations: GhaUnifiedViolation[],
): GhaViolationStatus {
  let hasError = false;
  let hasWarning = false;

  for (const v of violations) {
    // Match violations that reference this job key in the message
    if (!v.message.includes(`${jobKey}:`)) continue;

    if (v.severity === 'error') hasError = true;
    if (v.severity === 'warning') hasWarning = true;
  }

  if (hasError) return 'error';
  if (hasWarning) return 'warning';
  return 'clean';
}

/**
 * Detect cycles in job dependency graph using Kahn's algorithm.
 * Ported from compose-validator/graph-builder.ts detectCycles().
 *
 * @param jobDeps - Map of jobKey -> array of job keys it depends on (needs:)
 * @returns Cycle detection result with participants list
 */
function detectJobCycles(
  jobDeps: Map<string, string[]>,
): { hasCycle: boolean; cycleParticipants: string[] } {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize all jobs
  for (const jobKey of jobDeps.keys()) {
    inDegree.set(jobKey, 0);
    adjacency.set(jobKey, []);
  }

  // Build adjacency: dependency -> dependent (edge direction: from -> to)
  for (const [jobKey, deps] of jobDeps) {
    for (const dep of deps) {
      if (!adjacency.has(dep)) continue; // Skip unknown deps
      adjacency.get(dep)!.push(jobKey);
      inDegree.set(jobKey, (inDegree.get(jobKey) ?? 0) + 1);
    }
  }

  // BFS from nodes with in-degree 0
  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // Nodes not in sorted order are cycle participants
  const sortedSet = new Set(sorted);
  const cycleParticipants = Array.from(jobDeps.keys()).filter(
    (k) => !sortedSet.has(k),
  );

  return {
    hasCycle: cycleParticipants.length > 0,
    cycleParticipants,
  };
}
