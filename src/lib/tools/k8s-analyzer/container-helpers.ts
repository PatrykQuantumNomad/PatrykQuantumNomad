/**
 * Container extraction helpers for Kubernetes workload resources.
 *
 * Provides shared utility functions to extract PodSpec and container arrays
 * from any of the 6 supported workload kinds (Pod, Deployment, StatefulSet,
 * DaemonSet, Job, CronJob). Each helper returns JSON Pointer paths alongside
 * the data, enabling downstream rules to resolve AST nodes for accurate
 * line number reporting.
 */

import type { ParsedResource } from './types';

// ── Types ────────────────────────────────────────────────────────────

/** A single container extracted from a workload resource with its JSON Pointer path. */
export interface ContainerSpec {
  container: Record<string, unknown>;
  jsonPath: string;
  containerType: 'container' | 'initContainer';
}

/** The pod-level spec object and its JSON Pointer path within the resource. */
export interface PodSpec {
  podSpec: Record<string, unknown>;
  podSpecPath: string;
}

// ── Constants ────────────────────────────────────────────────────────

/** Map of resource kind -> JSON Pointer path to the PodSpec. */
const POD_SPEC_PATHS: Record<string, string> = {
  Pod: '/spec',
  Deployment: '/spec/template/spec',
  StatefulSet: '/spec/template/spec',
  DaemonSet: '/spec/template/spec',
  Job: '/spec/template/spec',
  CronJob: '/spec/jobTemplate/spec/template/spec',
};

// ── Public API ───────────────────────────────────────────────────────

/**
 * Get the PodSpec object and its JSON Pointer path for a resource.
 * Returns null for resource kinds that don't have a PodSpec (e.g., ConfigMap, Service).
 */
export function getPodSpec(resource: ParsedResource): PodSpec | null {
  const path = POD_SPEC_PATHS[resource.kind];
  if (!path) return null;

  // Navigate the JSON object along the path segments
  const segments = path.split('/').filter((s) => s !== '');
  let current: unknown = resource.json;
  for (const segment of segments) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }

  if (!current || typeof current !== 'object') return null;
  return { podSpec: current as Record<string, unknown>, podSpecPath: path };
}

/**
 * Get all container specs (containers + initContainers) from a resource.
 * Returns an array of ContainerSpec with JSON Pointer paths for AST resolution.
 */
export function getContainerSpecs(resource: ParsedResource): ContainerSpec[] {
  const pod = getPodSpec(resource);
  if (!pod) return [];

  const specs: ContainerSpec[] = [];
  const { podSpec, podSpecPath } = pod;

  // Regular containers
  const containers = podSpec.containers as Record<string, unknown>[] | undefined;
  if (Array.isArray(containers)) {
    for (let i = 0; i < containers.length; i++) {
      specs.push({
        container: containers[i],
        jsonPath: `${podSpecPath}/containers/${i}`,
        containerType: 'container',
      });
    }
  }

  // Init containers
  const initContainers = podSpec.initContainers as Record<string, unknown>[] | undefined;
  if (Array.isArray(initContainers)) {
    for (let i = 0; i < initContainers.length; i++) {
      specs.push({
        container: initContainers[i],
        jsonPath: `${podSpecPath}/initContainers/${i}`,
        containerType: 'initContainer',
      });
    }
  }

  return specs;
}
