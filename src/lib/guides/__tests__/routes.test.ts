import { describe, it, expect } from 'vitest';
import { GUIDE_ROUTES, guidePageUrl, guideLandingUrl } from '../routes';

describe('GUIDE_ROUTES', () => {
  it('has a guides base route', () => {
    expect(GUIDE_ROUTES.guides).toBe('/guides/');
  });

  it('does not have a landing property', () => {
    expect('landing' in GUIDE_ROUTES).toBe(false);
  });
});

describe('guidePageUrl', () => {
  it('returns correct URL for builder-pattern chapter', () => {
    expect(guidePageUrl('fastapi-production', 'builder-pattern')).toBe(
      '/guides/fastapi-production/builder-pattern/',
    );
  });

  it('returns correct URL for middleware chapter', () => {
    expect(guidePageUrl('fastapi-production', 'middleware')).toBe(
      '/guides/fastapi-production/middleware/',
    );
  });

  it('returns URL with trailing slash', () => {
    const url = guidePageUrl('fastapi-production', 'authentication');
    expect(url.endsWith('/')).toBe(true);
  });

  it('works with arbitrary guide and chapter slugs', () => {
    expect(guidePageUrl('nextjs-guide', 'routing')).toBe(
      '/guides/nextjs-guide/routing/',
    );
  });
});

describe('guideLandingUrl', () => {
  it('returns correct URL for fastapi-production', () => {
    expect(guideLandingUrl('fastapi-production')).toBe(
      '/guides/fastapi-production/',
    );
  });

  it('returns URL with trailing slash', () => {
    const url = guideLandingUrl('some-guide');
    expect(url.endsWith('/')).toBe(true);
  });
});
