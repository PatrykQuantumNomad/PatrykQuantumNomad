/**
 * Async K8s manifest analysis engine — the single entry point for running
 * the full validation pipeline.
 *
 * Orchestrates: parse multi-document YAML -> per-document validation
 * (empty check, missing fields, GVK identification, deprecation, schema
 * validation, metadata checks) -> resource registry build -> sorted violations.
 *
 * Follows the compose-validator engine.ts pattern but is async (schema
 * validators are dynamically imported) and handles multiple YAML documents.
 */

import type {
  K8sEngineResult,
  K8sRuleViolation,
  K8sRuleContext,
  ParsedDocument,
} from './types';
import { parseK8sYaml } from './parser';
import {
  getResourceType,
  getDeprecation,
  findNearMatch,
} from './gvk-registry';
import { ResourceRegistry } from './resource-registry';
import { validateResource } from './schema-validator';
import { checkMetadata } from './diagnostic-rules';
import { allK8sRules } from './rules';
import { computePssCompliance } from './pss-compliance';

// ── Public API ──────────────────────────────────────────────────────

/**
 * Run the full async K8s manifest analysis pipeline.
 *
 * @param rawText - Multi-document YAML string (with --- separators)
 * @returns Engine result with violations, parsed resources, summary, and stats
 */
export async function runK8sEngine(
  rawText: string,
): Promise<K8sEngineResult> {
  // Track which rules produced violations (for rulesPassed calculation)
  const rulesTriggered = new Set<string>();

  // ── Step 1: Parse multi-document YAML ───────────────────────────
  const parseResult = parseK8sYaml(rawText);
  const violations: K8sRuleViolation[] = [...parseResult.parseErrors];

  // Track KA-S001 if any parse errors exist
  for (const err of parseResult.parseErrors) {
    rulesTriggered.add(err.ruleId);
  }

  // ── Step 2: Process each parsed document ────────────────────────
  for (const doc of parseResult.documents) {
    // (a) KA-S010: Empty document check
    if (doc.isEmpty) {
      const violation: K8sRuleViolation = {
        ruleId: 'KA-S010',
        line: doc.startLine,
        column: 1,
        message:
          'Empty document in multi-document YAML (likely a trailing \'---\' separator).',
      };
      violations.push(violation);
      rulesTriggered.add('KA-S010');
      continue;
    }

    // (b) KA-S002: Missing apiVersion
    if (!doc.apiVersion) {
      const suggestion = findCaseInsensitiveKey(doc, 'apiVersion');
      const message = suggestion
        ? `Missing required field 'apiVersion'. Did you mean '${suggestion}'?`
        : "Missing required field 'apiVersion'.";
      violations.push({
        ruleId: 'KA-S002',
        line: doc.startLine,
        column: 1,
        message,
      });
      rulesTriggered.add('KA-S002');
      continue;
    }

    // (c) KA-S003: Missing kind
    if (!doc.kind) {
      const suggestion = findCaseInsensitiveKey(doc, 'kind');
      const message = suggestion
        ? `Missing required field 'kind'. Did you mean '${suggestion}'?`
        : "Missing required field 'kind'.";
      violations.push({
        ruleId: 'KA-S003',
        line: doc.startLine,
        column: 1,
        message,
      });
      rulesTriggered.add('KA-S003');
      continue;
    }

    // (d) KA-S004 / KA-S006: Unknown or deprecated GVK
    const resourceType = getResourceType(doc.apiVersion, doc.kind);
    if (!resourceType) {
      // Check if it's a deprecated API version first
      const deprecation = getDeprecation(doc.apiVersion, doc.kind);
      if (deprecation) {
        // KA-S006: Deprecated — emit warning only, NOT KA-S004
        violations.push({
          ruleId: 'KA-S006',
          line: doc.startLine,
          column: 1,
          message: deprecation.message,
        });
        rulesTriggered.add('KA-S006');
      } else {
        // KA-S004: Unknown — check for near-match suggestion
        const nearMatch = findNearMatch(doc.apiVersion, doc.kind);
        const message = nearMatch
          ? `Unknown apiVersion/kind combination '${doc.apiVersion}/${doc.kind}'. Did you mean '${nearMatch.apiVersion}/${nearMatch.kind}'?`
          : `Unknown apiVersion/kind combination '${doc.apiVersion}/${doc.kind}'.`;
        violations.push({
          ruleId: 'KA-S004',
          line: doc.startLine,
          column: 1,
          message,
        });
        rulesTriggered.add('KA-S004');
      }
      // Skip schema validation and metadata checks for unrecognized resources
      continue;
    }

    // Check deprecation even for known resources (a resource could be
    // both in the GVK registry AND deprecated — though currently the
    // GVK registry only contains current stable APIs, so this is
    // future-proofing).
    const deprecation = getDeprecation(doc.apiVersion, doc.kind);
    if (deprecation) {
      violations.push({
        ruleId: 'KA-S006',
        line: doc.startLine,
        column: 1,
        message: deprecation.message,
      });
      rulesTriggered.add('KA-S006');
    }

    // (e) KA-S005: Schema validation
    const schemaViolations = await validateResource(
      resourceType,
      doc,
      parseResult.lineCounter,
    );
    violations.push(...schemaViolations);
    for (const v of schemaViolations) {
      rulesTriggered.add(v.ruleId);
    }

    // (f) KA-S007/S008/S009: Metadata checks
    const metadataViolations = checkMetadata(doc, parseResult.lineCounter);
    violations.push(...metadataViolations);
    for (const v of metadataViolations) {
      rulesTriggered.add(v.ruleId);
    }
  }

  // ── Step 3: Build resource registry ─────────────────────────────
  const registry = ResourceRegistry.buildFromDocuments(
    parseResult.documents,
  );
  const resourceSummary = registry.getSummary();

  // ── Step 3.5: Run lint rules (security, reliability, best practice) ──
  const ruleCtx: K8sRuleContext = {
    resources: registry.getAll(),
    registry,
    lineCounter: parseResult.lineCounter,
    rawText,
  };

  for (const rule of allK8sRules) {
    const ruleViolations = rule.check(ruleCtx);
    violations.push(...ruleViolations);
    for (const v of ruleViolations) {
      rulesTriggered.add(v.ruleId);
    }
  }

  // ── Step 4: Sort and return ─────────────────────────────────────
  violations.sort((a, b) => a.line - b.line || a.column - b.column);

  // Total rules = 10 schema rules + N lint rules
  const totalRules = 10 + allK8sRules.length;
  const rulesPassed = totalRules - rulesTriggered.size;

  return {
    violations,
    resources: registry.getAll(),
    resourceSummary,
    rulesRun: totalRules,
    rulesPassed,
    pssCompliance: computePssCompliance(violations),
  };
}

// ── Internal Helpers ──────────────────────────────────────────────

/**
 * Look for a case-insensitive near-match of a field name in the document's
 * JSON keys. Used to generate helpful "Did you mean?" suggestions when
 * apiVersion or kind is missing (Pitfall 6 in research).
 *
 * Returns the actual key the user typed (e.g., 'apiversion') if it
 * case-insensitively matches the target, or null if not found.
 */
function findCaseInsensitiveKey(
  doc: ParsedDocument,
  targetKey: string,
): string | null {
  if (!doc.json) return null;
  const targetLower = targetKey.toLowerCase();
  for (const key of Object.keys(doc.json)) {
    if (key.toLowerCase() === targetLower && key !== targetKey) {
      return key;
    }
  }
  return null;
}
