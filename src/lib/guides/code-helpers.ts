/**
 * Helper utilities for guide code snippet components.
 *
 * Builds GitHub blob URLs that link code excerpts back to the tagged
 * source file in the template repository.
 */

interface LineRange {
  startLine: number;
  endLine?: number;
}

/**
 * Construct a GitHub blob URL pointing to a specific file (and optional
 * line range) within a tagged repository.
 *
 * @param templateRepo - Base GitHub repository URL (e.g. "https://github.com/Org/repo")
 * @param versionTag   - Git tag or branch name (e.g. "v1.0.0")
 * @param filePath     - Path to the file relative to the repository root
 * @param lines        - Optional line range to highlight
 * @returns            Full GitHub blob URL with optional #L fragment
 */
export function buildGitHubFileUrl(
  templateRepo: string,
  versionTag: string,
  filePath: string,
  lines?: LineRange,
): string {
  const repo = templateRepo.replace(/\/+$/, '');
  const path = filePath.replace(/^\/+/, '');

  let url = `${repo}/blob/${versionTag}/${path}`;

  if (lines) {
    url += lines.endLine != null
      ? `#L${lines.startLine}-L${lines.endLine}`
      : `#L${lines.startLine}`;
  }

  return url;
}
