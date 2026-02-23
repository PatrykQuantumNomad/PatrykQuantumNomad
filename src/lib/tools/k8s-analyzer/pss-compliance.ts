/**
 * Pod Security Standards (PSS) compliance computation.
 *
 * Maps security rule IDs to PSS profiles (Baseline / Restricted) and
 * computes a compliance summary from engine violations.
 *
 * PSS profile hierarchy: Restricted inherits ALL Baseline controls.
 * A manifest is Restricted-compliant only if it is also Baseline-compliant.
 *
 * @see https://kubernetes.io/docs/concepts/security/pod-security-standards/
 */

import type { K8sRuleViolation, PssComplianceSummary } from './types';

/** Rule IDs that map to PSS Baseline profile violations. */
export const PSS_BASELINE_RULES = new Set([
  'KA-C001', // privileged container
  'KA-C006', // hostPID
  'KA-C007', // hostIPC
  'KA-C008', // hostNetwork
  'KA-C009', // hostPort
  'KA-C010', // dangerous capabilities
  'KA-C013', // missing seccomp profile
  'KA-C014', // sensitive host path
]);

/** Rule IDs that map to PSS Restricted profile violations. */
export const PSS_RESTRICTED_RULES = new Set([
  'KA-C002', // privilege escalation
  'KA-C003', // runs as root
  'KA-C004', // missing runAsNonRoot
  'KA-C005', // UID 0
  'KA-C011', // capabilities not dropped
]);

/**
 * Compute PSS compliance summary from a list of violations.
 *
 * Restricted inherits Baseline: a manifest must have zero Baseline AND
 * zero Restricted violations to be Restricted-compliant.
 */
export function computePssCompliance(
  violations: K8sRuleViolation[],
): PssComplianceSummary {
  let baselineViolations = 0;
  let restrictedViolations = 0;

  for (const v of violations) {
    if (PSS_BASELINE_RULES.has(v.ruleId)) {
      baselineViolations++;
    } else if (PSS_RESTRICTED_RULES.has(v.ruleId)) {
      restrictedViolations++;
    }
  }

  const totalPssViolations = baselineViolations + restrictedViolations;
  const baselineCompliant = baselineViolations === 0;
  // Restricted inherits Baseline: must pass both
  const restrictedCompliant = baselineCompliant && restrictedViolations === 0;

  return {
    baselineViolations,
    restrictedViolations,
    totalPssViolations,
    baselineCompliant,
    restrictedCompliant,
  };
}
