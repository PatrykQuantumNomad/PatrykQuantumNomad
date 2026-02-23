/**
 * Multi-document YAML parser for Kubernetes manifests.
 *
 * Splits multi-document YAML (with --- separators) into individual documents
 * with accurate line tracking via a shared LineCounter. Each document gets
 * apiVersion, kind, metadata name/namespace/labels extracted for downstream
 * GVK identification and validation.
 *
 * Follows the compose-validator parser.ts pattern but uses parseAllDocuments
 * for multi-document support instead of parseDocument.
 */

import {
  parseAllDocuments,
  LineCounter,
  isMap,
  isPair,
  isScalar,
  isSeq,
} from 'yaml';
import type { Document, Node } from 'yaml';
import type { ParsedDocument, K8sParseResult, K8sRuleViolation } from './types';

// ── Public API ──────────────────────────────────────────────────────

/**
 * Parse a multi-document YAML string into individual documents with metadata.
 *
 * Uses a shared LineCounter so line numbers are relative to the full input,
 * not per-document. Handles:
 * - Single and multi-document YAML (--- separators)
 * - Trailing --- (produces empty documents, flagged as KA-S010 downstream)
 * - YAML syntax errors mapped to KA-S001 violations
 * - Safe toJSON extraction (catches errors from malformed documents)
 */
export function parseK8sYaml(rawText: string): K8sParseResult {
  const lineCounter = new LineCounter();
  const docs = parseAllDocuments(rawText, { lineCounter });
  const parseErrors: K8sRuleViolation[] = [];
  const documents: ParsedDocument[] = [];

  for (const doc of docs) {
    // Map YAML syntax errors to KA-S001 violations
    for (const err of doc.errors) {
      let line = 1;
      let col = 1;

      if (err.pos && Array.isArray(err.pos) && err.pos.length >= 1) {
        try {
          const pos = lineCounter.linePos(err.pos[0]);
          line = pos.line;
          col = pos.col;
        } catch {
          // linePos can throw on invalid offsets; keep defaults
        }
      }

      parseErrors.push({
        ruleId: 'KA-S001',
        line,
        column: col,
        message: err.message,
      });
    }

    // Safe JSON extraction
    const json = safeToJSON(doc);

    // Calculate start line from document contents range
    let startLine = 1;
    if (doc.contents?.range) {
      try {
        startLine = lineCounter.linePos(doc.contents.range[0]).line;
      } catch {
        // Keep default startLine = 1
      }
    }

    // Extract metadata fields
    const apiVersion = (json?.apiVersion as string) ?? null;
    const kind = (json?.kind as string) ?? null;
    const metadata = json?.metadata as Record<string, unknown> | undefined;
    const name = (metadata?.name as string) ?? null;
    const namespace = (metadata?.namespace as string) ?? null;
    const labels = (metadata?.labels as Record<string, string>) ?? {};

    // Determine if document is empty
    const isEmpty =
      json === null ||
      json === undefined ||
      (typeof json === 'object' && Object.keys(json).length === 0);

    documents.push({
      doc,
      json: json as Record<string, unknown> | null,
      apiVersion,
      kind,
      name,
      namespace,
      labels,
      startLine,
      isEmpty,
    });
  }

  return { documents, lineCounter, parseErrors };
}

// ── AST Navigation ──────────────────────────────────────────────────

/**
 * Walk the YAML AST following a JSON Pointer path (like `/spec/template/spec/containers/0`)
 * to find the corresponding AST node. Used to recover line numbers from ajv
 * validation errors that report JSON Pointer instance paths.
 *
 * Returns the AST node at the path, or null if the path cannot be followed.
 */
export function resolveInstancePath(doc: Document, instancePath: string): Node | null {
  const segments = instancePath.split('/').filter((s) => s !== '');

  let current: unknown = doc.contents;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return null;
    }

    if (isMap(current)) {
      let found = false;
      for (const item of current.items) {
        if (isPair(item) && isScalar(item.key) && String(item.key.value) === segment) {
          current = item.value;
          found = true;
          break;
        }
      }
      if (!found) {
        return null;
      }
    } else if (isSeq(current)) {
      const index = Number.parseInt(segment, 10);
      if (Number.isNaN(index) || index < 0 || index >= current.items.length) {
        return null;
      }
      current = current.items[index];
    } else {
      return null;
    }
  }

  return current as Node | null;
}

/**
 * Safe line-number extraction from an AST node. Guards against undefined
 * `range` (yaml issue #573) and invalid offsets.
 *
 * Returns 1-based line and column. Falls back to { line: 1, col: 1 }
 * if the range is unavailable or invalid.
 */
export function getNodeLine(
  node: Node | null,
  lineCounter: LineCounter,
): { line: number; col: number } {
  try {
    const n = node as { range?: [number, number, number] | null } | null;
    if (
      n?.range &&
      Array.isArray(n.range) &&
      n.range.length >= 1
    ) {
      return lineCounter.linePos(n.range[0]);
    }
  } catch {
    // linePos can throw on invalid offsets; fall through to default
  }

  return { line: 1, col: 1 };
}

// ── Internal Helpers ────────────────────────────────────────────────

/**
 * Safely convert a YAML Document to a plain JS object.
 * Returns null if the document is empty or toJSON() throws.
 */
function safeToJSON(doc: Document): Record<string, unknown> | null {
  try {
    const result = doc.toJSON();
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return result as Record<string, unknown>;
    }
    return null;
  } catch {
    // toJSON() can fail on malformed documents; return null
    return null;
  }
}
