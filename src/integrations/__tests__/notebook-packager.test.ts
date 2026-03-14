import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import notebookPackager from '../notebook-packager';

describe('notebookPackager integration', () => {
  it('returns an object with name "notebook-packager"', () => {
    const integration = notebookPackager();
    expect(integration.name).toBe('notebook-packager');
  });

  it('has an astro:build:done hook', () => {
    const integration = notebookPackager();
    expect(integration.hooks).toHaveProperty('astro:build:done');
  });

  it('astro:build:done hook is a function', () => {
    const integration = notebookPackager();
    expect(typeof integration.hooks['astro:build:done']).toBe('function');
  });

  it('follows AstroIntegration shape (name + hooks only)', () => {
    const integration = notebookPackager();
    const keys = Object.keys(integration);
    expect(keys).toContain('name');
    expect(keys).toContain('hooks');
  });
});

describe('astro.config.mjs registration', () => {
  it('imports and registers notebookPackager', () => {
    const configPath = join(process.cwd(), 'astro.config.mjs');
    const configContent = readFileSync(configPath, 'utf-8');

    // Verify import exists
    expect(configContent).toContain('notebookPackager');

    // Verify it's called in integrations array
    expect(configContent).toMatch(/notebookPackager\(\)/);
  });
});
