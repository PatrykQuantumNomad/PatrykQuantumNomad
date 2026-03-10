import { describe, it, expect } from 'vitest';
import { guidePageSchema, guideMetaSchema } from '../schema';

describe('guidePageSchema', () => {
  it('validates a correct guide page object', () => {
    const result = guidePageSchema.safeParse({
      title: 'Builder Pattern',
      description: 'How the app composes itself',
      order: 0,
      slug: 'builder-pattern',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when description, order, and slug are missing', () => {
    const result = guidePageSchema.safeParse({
      title: 'Missing fields',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative order value', () => {
    const result = guidePageSchema.safeParse({
      title: 'Bad order',
      description: 'x',
      order: -1,
      slug: 's',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer order value', () => {
    const result = guidePageSchema.safeParse({
      title: 'Bad order',
      description: 'x',
      order: 1.5,
      slug: 's',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when title is missing', () => {
    const result = guidePageSchema.safeParse({
      description: 'x',
      order: 0,
      slug: 's',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a page with lastVerified date string', () => {
    const result = guidePageSchema.safeParse({
      title: 'Builder Pattern',
      description: 'How the app composes itself',
      order: 0,
      slug: 'builder-pattern',
      lastVerified: '2026-03-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a page without lastVerified (backward compat)', () => {
    const result = guidePageSchema.safeParse({
      title: 'Builder Pattern',
      description: 'How the app composes itself',
      order: 0,
      slug: 'builder-pattern',
    });
    expect(result.success).toBe(true);
  });
});

describe('guideMetaSchema', () => {
  const validMeta = {
    id: 'fastapi-production',
    title: 'FastAPI Production Guide',
    description: 'A deep-dive into every production concern',
    slug: 'fastapi-production',
    templateRepo: 'https://github.com/PatrykQuantumNomad/fastapi-chassis',
    versionTag: 'v1.0.0',
    chapters: [{ slug: 'builder-pattern', title: 'Builder Pattern' }],
  };

  it('validates a correct guide meta object (FastAPI style with templateRepo + versionTag)', () => {
    const result = guideMetaSchema.safeParse(validMeta);
    expect(result.success).toBe(true);
  });

  it('validates guide meta with multiple chapters', () => {
    const result = guideMetaSchema.safeParse({
      ...validMeta,
      chapters: [
        { slug: 'builder-pattern', title: 'Builder Pattern' },
        { slug: 'middleware', title: 'Middleware Stack' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid templateRepo URL when present', () => {
    const result = guideMetaSchema.safeParse({
      ...validMeta,
      templateRepo: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when chapters array is missing', () => {
    const { chapters, ...noChapters } = validMeta;
    const result = guideMetaSchema.safeParse(noChapters);
    expect(result.success).toBe(false);
  });

  it('rejects when id is missing', () => {
    const { id, ...noId } = validMeta;
    const result = guideMetaSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it('rejects when title is missing', () => {
    const { title, ...noTitle } = validMeta;
    const result = guideMetaSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects a chapter with missing slug', () => {
    const result = guideMetaSchema.safeParse({
      ...validMeta,
      chapters: [{ title: 'Builder Pattern' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts meta without templateRepo (optional)', () => {
    const { templateRepo, ...noTemplateRepo } = validMeta;
    const result = guideMetaSchema.safeParse(noTemplateRepo);
    expect(result.success).toBe(true);
  });

  it('accepts meta without versionTag (optional)', () => {
    const { versionTag, ...noVersionTag } = validMeta;
    const result = guideMetaSchema.safeParse(noVersionTag);
    expect(result.success).toBe(true);
  });

  it('accepts meta with accentColor', () => {
    const result = guideMetaSchema.safeParse({
      ...validMeta,
      accentColor: '#D97706',
    });
    expect(result.success).toBe(true);
  });

  it('accepts chapters with optional description', () => {
    const result = guideMetaSchema.safeParse({
      ...validMeta,
      chapters: [
        { slug: 'builder-pattern', title: 'Builder Pattern', description: 'How the app composes itself' },
      ],
    });
    expect(result.success).toBe(true);
  });
});
