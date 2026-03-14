import { createHash } from 'node:crypto';
import type { MarkdownCell, CodeCell } from './types';

/**
 * Generate a deterministic cell ID from notebook slug and cell index.
 * Uses SHA-256 hash truncated to 8 hex chars (within the 1-64 char limit).
 * Pattern: ^[a-zA-Z0-9]+$
 *
 * Using 8 hex chars = 32 bits = ~4 billion unique IDs.
 * With max ~50 cells per notebook, collision probability is negligible.
 */
export function cellId(slug: string, index: number): string {
  return createHash('sha256')
    .update(`${slug}:${index}`)
    .digest('hex')
    .slice(0, 8);
}

/**
 * Normalize source lines for nbformat: ensure each line except the last
 * ends with \n. Lines that already have \n are not double-terminated.
 * This produces the canonical array-of-strings format for nbformat.
 */
function normalizeSource(lines: string[]): string[] {
  return lines.map((line, i) =>
    i < lines.length - 1
      ? line.endsWith('\n') ? line : line + '\n'
      : line
  );
}

/**
 * Create a markdown cell with deterministic ID and normalized source.
 */
export function markdownCell(
  slug: string,
  index: number,
  source: string[],
): MarkdownCell {
  return {
    id: cellId(slug, index),
    cell_type: 'markdown',
    metadata: {},
    source: normalizeSource(source),
  };
}

/**
 * Create a code cell with deterministic ID, normalized source,
 * empty outputs, and null execution_count.
 */
export function codeCell(
  slug: string,
  index: number,
  source: string[],
): CodeCell {
  return {
    id: cellId(slug, index),
    cell_type: 'code',
    metadata: {},
    source: normalizeSource(source),
    outputs: [],
    execution_count: null,
  };
}
