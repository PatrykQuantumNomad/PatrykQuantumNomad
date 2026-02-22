import {
  parseDocument,
  LineCounter,
  isMap,
  isPair,
  isScalar,
  isSeq,
} from 'yaml';
import type { Document } from 'yaml';
import type { ComposeRuleViolation } from './types';
import { normalizeJsonForValidation } from './interpolation';

/**
 * Result of parsing a Docker Compose YAML string.
 */
export interface ComposeParseResult {
  doc: Document;
  lineCounter: LineCounter;
  json: Record<string, unknown> | null;
  normalizedJson: Record<string, unknown> | null;
  parseSuccess: boolean;
  parseErrors: ComposeRuleViolation[];
  services: Map<string, any>;
  networks: Map<string, any>;
  volumes: Map<string, any>;
  secrets: Map<string, any>;
  configs: Map<string, any>;
}

/**
 * Parse a Docker Compose YAML string into a Document AST with line mapping,
 * raw JSON, interpolation-normalized JSON, and extracted top-level maps.
 *
 * Uses YAML 1.1 mode for merge key (<<) support, which is critical for
 * Docker Compose files that rely on YAML anchors and merge keys.
 */
export function parseComposeYaml(rawText: string): ComposeParseResult {
  const lineCounter = new LineCounter();

  const doc = parseDocument(rawText, {
    version: '1.1',
    merge: true,
    lineCounter,
    prettyErrors: true,
    uniqueKeys: false,
    keepSourceTokens: false,
  });

  // Map YAML syntax errors to CV-S001 violations
  const parseErrors: ComposeRuleViolation[] = doc.errors.map((err) => {
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

    return {
      ruleId: 'CV-S001',
      line,
      column: col,
      message: err.message,
    };
  });

  const parseSuccess = doc.errors.length === 0;

  // Extract raw JSON from AST
  let json: Record<string, unknown> | null = null;
  let normalizedJson: Record<string, unknown> | null = null;

  if (parseSuccess) {
    try {
      const rawJson = doc.toJSON();
      if (rawJson && typeof rawJson === 'object' && !Array.isArray(rawJson)) {
        json = rawJson as Record<string, unknown>;
        normalizedJson = normalizeJsonForValidation(json) as Record<
          string,
          unknown
        >;
      }
    } catch {
      // toJSON() can fail on malformed documents; leave as null
    }
  }

  // Extract top-level maps from AST for rule context
  const services = extractTopLevelMap(doc, 'services');
  const networks = extractTopLevelMap(doc, 'networks');
  const volumes = extractTopLevelMap(doc, 'volumes');
  const secrets = extractTopLevelMap(doc, 'secrets');
  const configs = extractTopLevelMap(doc, 'configs');

  return {
    doc,
    lineCounter,
    json,
    normalizedJson,
    parseSuccess,
    parseErrors,
    services,
    networks,
    volumes,
    secrets,
    configs,
  };
}

/**
 * Walk the Document AST contents (YAMLMap) to find the pair with the given
 * key, then extract its children into a Map. Uses AST-level extraction so
 * rules can access nodes with range info for line-number reporting.
 *
 * Returns an empty Map if the key is not found or the value is not a map.
 */
export function extractTopLevelMap(
  doc: Document,
  key: string,
): Map<string, any> {
  const result = new Map<string, any>();
  const contents = doc.contents;

  if (!isMap(contents)) {
    return result;
  }

  for (const item of contents.items) {
    if (!isPair(item)) continue;

    if (isScalar(item.key) && String(item.key.value) === key) {
      const value = item.value;

      if (isMap(value)) {
        for (const child of value.items) {
          if (isPair(child) && isScalar(child.key)) {
            result.set(String(child.key.value), child.value);
          }
        }
      }

      break;
    }
  }

  return result;
}

/**
 * Walk the YAML AST following a JSON Pointer path (like `/services/web/ports/0`)
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
      const index = parseInt(segment, 10);
      if (isNaN(index) || index < 0 || index >= current.items.length) {
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
