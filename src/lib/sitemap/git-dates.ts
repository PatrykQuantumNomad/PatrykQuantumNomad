import { execSync } from 'node:child_process';

/**
 * In-memory cache for repeated lookups of the same path within a single build.
 * Keyed by repo-relative path; values are normalized ISO-8601 strings or
 * `undefined` when the path is untracked or git is unavailable.
 */
const cache = new Map<string, string | undefined>();

/**
 * Return the committer-ISO-8601 date of the most recent commit that touched
 * `relativePath` (relative to repo root), normalized to UTC with trailing 'Z'.
 *
 * Determinism: committer dates are immutable per commit. Two builds on the
 * same commit return the same value. Cached per process.
 *
 * Caveats:
 * - On shallow clones (CI default fetch-depth: 1) the query may return empty
 *   for files whose last-touching commit is outside the shallow window. In
 *   that case this returns undefined — the caller must decide to fall back
 *   or fail. Prefer frontmatter/JSON/registry sources and treat git log as
 *   a last-resort fallback.
 * - Do NOT pass absolute paths — git expects a repo-relative path.
 */
export function gitLogDate(relativePath: string): string | undefined {
  if (cache.has(relativePath)) return cache.get(relativePath);
  let result: string | undefined;
  try {
    const out = execSync(
      `git log -1 --format=%cI -- "${relativePath}"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (out) {
      result = new Date(out).toISOString();
    }
  } catch {
    result = undefined;
  }
  cache.set(relativePath, result);
  return result;
}
