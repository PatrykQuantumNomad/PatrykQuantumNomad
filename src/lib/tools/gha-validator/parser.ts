import {
  parseDocument,
  LineCounter,
  isMap,
  isPair,
  isScalar,
  isSeq,
} from 'yaml';
import type { Document } from 'yaml';
import type { GhaRuleViolation } from './types';

/**
 * Result of parsing a GitHub Actions workflow YAML string.
 */
export interface GhaParseResult {
  doc: Document;
  lineCounter: LineCounter;
  json: Record<string, unknown> | null;
  parseSuccess: boolean;
  parseErrors: GhaRuleViolation[];
}

/**
 * Parse a GitHub Actions workflow YAML string into a Document AST with line
 * mapping, raw JSON, and any YAML syntax errors mapped to GA-S001 violations.
 *
 * Uses default YAML 1.2 mode (no merge keys or YAML 1.1 features).
 */
export function parseGhaWorkflow(rawText: string): GhaParseResult {
  const lineCounter = new LineCounter();

  const doc = parseDocument(rawText, {
    lineCounter,
    prettyErrors: true,
    uniqueKeys: false,
    keepSourceTokens: false,
  });

  // Map YAML syntax errors to GA-S001 violations
  const parseErrors: GhaRuleViolation[] = doc.errors.map((err) => {
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
    return { ruleId: 'GA-S001', line, column: col, message: err.message };
  });

  const parseSuccess = doc.errors.length === 0;

  let json: Record<string, unknown> | null = null;
  if (parseSuccess) {
    try {
      const rawJson = doc.toJSON();
      if (rawJson && typeof rawJson === 'object' && !Array.isArray(rawJson)) {
        json = rawJson as Record<string, unknown>;
      }
    } catch {
      // toJSON() can fail on malformed documents; leave as null
    }
  }

  return { doc, lineCounter, json, parseSuccess, parseErrors };
}

// ── AST utilities ───────────────────────────────────────────────────

/**
 * Walk the YAML AST following a JSON Pointer path (like `/jobs/build/steps/0`)
 * to find the corresponding AST node. Used to recover line numbers from ajv
 * validation errors that report JSON Pointer instance paths.
 *
 * Returns the AST node at the path, or null if the path cannot be followed.
 */
export function resolveInstancePath(doc: Document, path: string): any {
  const segments = path.split('/').filter((s) => s !== '');

  let current: any = doc.contents;

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

  return current;
}

/**
 * Safe line-number extraction from an AST node. Guards against undefined
 * `range` (yaml issue #573) and invalid offsets.
 *
 * Returns 1-based line and column. Falls back to { line: 1, col: 1 }
 * if the range is unavailable or invalid.
 */
export function getNodeLine(
  node: any,
  lineCounter: LineCounter,
): { line: number; col: number } {
  try {
    if (
      node?.range &&
      Array.isArray(node.range) &&
      node.range.length >= 1
    ) {
      return lineCounter.linePos(node.range[0]);
    }
  } catch {
    // linePos can throw on invalid offsets; fall through to default
  }

  return { line: 1, col: 1 };
}
