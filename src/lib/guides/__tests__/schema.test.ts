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

  it('validates a correct guide meta object', () => {
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

  it('rejects an invalid templateRepo URL', () => {
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
});
