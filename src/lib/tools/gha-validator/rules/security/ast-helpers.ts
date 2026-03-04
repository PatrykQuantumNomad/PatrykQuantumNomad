/**
 * Shared AST traversal helpers for GitHub Actions security rules.
 *
 * Provides functions to iterate over `uses:` and `run:` values in workflow
 * YAML ASTs, plus a key-resolution utility for YAML Map nodes.
 *
 * Used by GA-C001, GA-C002, GA-C005, and other security rules that need
 * to inspect specific workflow step properties.
 */

import { isMap, isPair, isScalar, isSeq } from 'yaml';
import type { GhaRuleContext } from '../../types';

/**
 * Resolve a key from a YAML Map node.
 *
 * Returns the value node for the given key, or null if the node is not
 * a Map or the key is not found.
 */
export function resolveKey(node: any, key: string): any {
  if (!isMap(node)) return null;
  for (const pair of node.items) {
    if (isPair(pair) && isScalar(pair.key) && String(pair.key.value) === key) {
      return pair.value;
    }
  }
  return null;
}

/**
 * Iterate over all `uses:` values in the workflow.
 *
 * Traverses: jobs -> [jobName] -> steps -> [n] -> uses
 *
 * Skips `uses:` values starting with `docker://` or `./` (local/docker
 * actions have no version to pin).
 *
 * Callback receives the string value, the AST node (for line resolution),
 * and the job name.
 */
export function forEachUsesNode(
  ctx: GhaRuleContext,
  callback: (usesValue: string, node: any, jobName: string) => void,
): void {
  const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
  if (!isMap(jobsNode)) return;

  for (const jobPair of jobsNode.items) {
    if (!isPair(jobPair) || !isScalar(jobPair.key)) continue;
    const jobName = String(jobPair.key.value);
    const stepsNode = resolveKey(jobPair.value, 'steps');
    if (!isSeq(stepsNode)) continue;

    for (const step of stepsNode.items) {
      if (!isMap(step)) continue;
      for (const stepPair of step.items) {
        if (!isPair(stepPair) || !isScalar(stepPair.key)) continue;
        if (String(stepPair.key.value) === 'uses' && isScalar(stepPair.value)) {
          const usesValue = String(stepPair.value.value);
          // Skip local actions and docker actions
          if (usesValue.startsWith('docker://') || usesValue.startsWith('./')) {
            continue;
          }
          callback(usesValue, stepPair.value, jobName);
        }
      }
    }
  }
}

/**
 * Iterate over all `run:` values in the workflow.
 *
 * Traverses: jobs -> [jobName] -> steps -> [n] -> run
 *
 * Correctly handles multiline `run: |` blocks by reading the full scalar
 * value from the AST node.
 *
 * Callback receives the run string value, the AST node (for line resolution),
 * the job name, and the step index within the job.
 */
export function forEachRunNode(
  ctx: GhaRuleContext,
  callback: (runValue: string, node: any, jobName: string, stepIndex: number) => void,
): void {
  const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
  if (!isMap(jobsNode)) return;

  for (const jobPair of jobsNode.items) {
    if (!isPair(jobPair) || !isScalar(jobPair.key)) continue;
    const jobName = String(jobPair.key.value);
    const stepsNode = resolveKey(jobPair.value, 'steps');
    if (!isSeq(stepsNode)) continue;

    for (let stepIndex = 0; stepIndex < stepsNode.items.length; stepIndex++) {
      const step = stepsNode.items[stepIndex];
      if (!isMap(step)) continue;
      for (const stepPair of step.items) {
        if (!isPair(stepPair) || !isScalar(stepPair.key)) continue;
        if (String(stepPair.key.value) === 'run' && isScalar(stepPair.value)) {
          callback(String(stepPair.value.value), stepPair.value, jobName, stepIndex);
        }
      }
    }
  }
}
