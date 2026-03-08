import { describe, it, expect } from 'vitest';
import { buildGitHubFileUrl } from '../code-helpers';

describe('buildGitHubFileUrl', () => {
  it('constructs a basic blob URL from repo, tag, and file path', () => {
    expect(
      buildGitHubFileUrl('https://github.com/Org/repo', 'v1.0.0', 'src/main.py'),
    ).toBe('https://github.com/Org/repo/blob/v1.0.0/src/main.py');
  });

  it('strips a leading slash from filePath', () => {
    expect(
      buildGitHubFileUrl('https://github.com/Org/repo', 'v1.0.0', '/src/main.py'),
    ).toBe('https://github.com/Org/repo/blob/v1.0.0/src/main.py');
  });

  it('strips a trailing slash from templateRepo', () => {
    expect(
      buildGitHubFileUrl('https://github.com/Org/repo/', 'v1.0.0', 'src/main.py'),
    ).toBe('https://github.com/Org/repo/blob/v1.0.0/src/main.py');
  });

  it('appends a line range fragment when startLine and endLine are provided', () => {
    expect(
      buildGitHubFileUrl('https://github.com/Org/repo', 'v1.0.0', 'src/main.py', {
        startLine: 10,
        endLine: 25,
      }),
    ).toBe('https://github.com/Org/repo/blob/v1.0.0/src/main.py#L10-L25');
  });

  it('appends a single line fragment when only startLine is provided', () => {
    expect(
      buildGitHubFileUrl('https://github.com/Org/repo', 'v1.0.0', 'src/main.py', {
        startLine: 42,
      }),
    ).toBe('https://github.com/Org/repo/blob/v1.0.0/src/main.py#L42');
  });
});
