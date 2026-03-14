import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createZipFile, buildNotebookZipEntries, type ZipEntry } from '../packager';
import { REQUIREMENTS_TXT } from '../requirements';
import { getCaseStudyConfig } from '../registry/index';
import { STANDARD_SLUGS } from '../templates/standard';

/**
 * Tests for the notebook ZIP packager.
 *
 * Covers:
 * - createZipFile(): ZIP archive creation using archiver
 * - buildNotebookZipEntries(): Assembly of 3 ZIP entries per case study
 */

const TEST_SLUG = 'normal-random-numbers';
const PROJECT_ROOT = process.cwd();

describe('createZipFile', () => {
  let testDir: string;

  beforeAll(() => {
    testDir = join(tmpdir(), `notebook-packager-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('produces a valid ZIP file at the specified path', async () => {
    const outputPath = join(testDir, 'test-basic.zip');
    const entries: ZipEntry[] = [
      { name: 'hello.txt', content: 'Hello, world!\n' },
    ];
    await createZipFile(outputPath, entries);
    expect(existsSync(outputPath)).toBe(true);

    // Check ZIP magic bytes (PK\x03\x04)
    const buf = readFileSync(outputPath);
    expect(buf[0]).toBe(0x50); // P
    expect(buf[1]).toBe(0x4b); // K
  });

  it('contains all provided entries', async () => {
    const outputPath = join(testDir, 'test-entries.zip');
    const entries: ZipEntry[] = [
      { name: 'file1.txt', content: 'Content 1\n' },
      { name: 'file2.txt', content: 'Content 2\n' },
      { name: 'file3.txt', content: 'Content 3\n' },
    ];
    await createZipFile(outputPath, entries);

    // Use Node's built-in extraction to verify entry count
    // We read the ZIP as a buffer and check the central directory
    const buf = readFileSync(outputPath);
    expect(buf.length).toBeGreaterThan(0);

    // Count PK\x01\x02 (central directory file headers) to count entries
    let centralDirCount = 0;
    for (let i = 0; i < buf.length - 3; i++) {
      if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x01 && buf[i + 3] === 0x02) {
        centralDirCount++;
      }
    }
    expect(centralDirCount).toBe(3);
  });

  it('creates parent directories if they do not exist', async () => {
    const outputPath = join(testDir, 'nested', 'deep', 'test-nested.zip');
    const entries: ZipEntry[] = [
      { name: 'data.txt', content: 'nested data\n' },
    ];
    await createZipFile(outputPath, entries);
    expect(existsSync(outputPath)).toBe(true);
  });
});

describe('buildNotebookZipEntries', () => {
  it('returns exactly 3 entries for a valid slug', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    expect(entries).toHaveLength(3);
  });

  it('entry[0] name is {slug}.ipynb', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    expect(entries[0].name).toBe(`${TEST_SLUG}.ipynb`);
  });

  it('entry[0] content is valid JSON with nbformat 4 and nbformat_minor 5', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    const notebook = JSON.parse(entries[0].content!);
    expect(notebook.nbformat).toBe(4);
    expect(notebook.nbformat_minor).toBe(5);
  });

  it('entry[0] content uses 1-space indentation', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    const content = entries[0].content!;
    // With 1-space indent, first nested key line starts with single space
    const lines = content.split('\n');
    // Find first indented line (should start with exactly 1 space)
    const firstIndented = lines.find((l) => l.startsWith(' '));
    expect(firstIndented).toBeDefined();
    expect(firstIndented!.startsWith(' ')).toBe(true);
    // Should NOT start with 2 spaces (that would be 2-space indent)
    // With 1-space indent, top-level keys have 1 space, nested have 2, etc.
    expect(firstIndented!.match(/^( +)/)?.[1].length).toBe(1);
  });

  it('entry[0] content ends with a trailing newline', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    expect(entries[0].content!.endsWith('\n')).toBe(true);
  });

  it('entry[1] name matches the config dataFile', () => {
    const config = getCaseStudyConfig(TEST_SLUG)!;
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    expect(entries[1].name).toBe(config.dataFile);
  });

  it('entry[1] content has no CRLF (LF-only line endings)', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    expect(entries[1].content!).not.toContain('\r\n');
    // Should contain at least some newlines (it is a data file)
    expect(entries[1].content!).toContain('\n');
  });

  it('entry[2] name is requirements.txt', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    expect(entries[2].name).toBe('requirements.txt');
  });

  it('entry[2] content equals REQUIREMENTS_TXT constant', () => {
    const entries = buildNotebookZipEntries(TEST_SLUG, PROJECT_ROOT);
    expect(entries[2].content).toBe(REQUIREMENTS_TXT);
  });

  it('throws for unknown slug', () => {
    expect(() => buildNotebookZipEntries('nonexistent-slug', PROJECT_ROOT)).toThrow();
  });

  it('works for all standard slugs', () => {
    for (const slug of STANDARD_SLUGS) {
      const entries = buildNotebookZipEntries(slug, PROJECT_ROOT);
      expect(entries).toHaveLength(3);
      expect(entries[0].name).toBe(`${slug}.ipynb`);
      expect(entries[2].name).toBe('requirements.txt');
    }
  });
});
