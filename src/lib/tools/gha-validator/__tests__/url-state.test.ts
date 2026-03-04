import { describe, it, expect } from 'vitest';
import { encodeGhaState, decodeGhaState, GHA_URL_SOFT_LIMIT, isUrlTooLong } from '../share/url-state';

// ── Roundtrip tests ──────────────────────────────────────────────────

describe('encodeGhaState', () => {
  it('returns a string starting with #gha=', () => {
    const result = encodeGhaState('name: ci');
    expect(result).toMatch(/^#gha=/);
  });

  it('produces compressed output shorter than input for typical YAML', () => {
    const yaml = `name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
`;
    const encoded = encodeGhaState(yaml);
    // The hash prefix '#gha=' adds 5 chars, but compressed payload should
    // still be shorter than raw YAML for a typical workflow
    expect(encoded.length).toBeLessThan(yaml.length);
  });
});

describe('decodeGhaState', () => {
  it('roundtrips single-line YAML', () => {
    const yaml = 'name: my-workflow';
    const hash = encodeGhaState(yaml);
    expect(decodeGhaState(hash)).toBe(yaml);
  });

  it('roundtrips multiline YAML (10+ lines)', () => {
    const yaml = `name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install deps
        run: npm ci
      - name: Test
        run: npm test
`;
    const hash = encodeGhaState(yaml);
    const decoded = decodeGhaState(hash);
    expect(decoded).toBe(yaml);
  });

  it('returns null for hash with wrong prefix', () => {
    expect(decodeGhaState('#other=abc')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(decodeGhaState('')).toBeNull();
  });

  it('returns null for hash with #gha= prefix but empty content', () => {
    // Empty compressed content should decompress to empty string or null;
    // we treat both as null to avoid loading an empty editor
    const result = decodeGhaState('#gha=');
    expect(result).toBeNull();
  });

  it('returns null for garbage compressed data (non-printable output)', () => {
    // lz-string decompresses garbage input into non-printable bytes.
    // decodeGhaState detects this and returns null.
    expect(decodeGhaState('#gha=!!!invalid!!!')).toBeNull();
  });
});

// ── URL length helpers ───────────────────────────────────────────────

describe('GHA_URL_SOFT_LIMIT', () => {
  it('is 6000', () => {
    expect(GHA_URL_SOFT_LIMIT).toBe(6000);
  });
});

describe('isUrlTooLong', () => {
  it('returns false for short hashes', () => {
    expect(isUrlTooLong('#gha=short')).toBe(false);
  });

  it('returns true for hashes exceeding the soft limit', () => {
    const longHash = '#gha=' + 'a'.repeat(GHA_URL_SOFT_LIMIT);
    expect(isUrlTooLong(longHash)).toBe(true);
  });
});
