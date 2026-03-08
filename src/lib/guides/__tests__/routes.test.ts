import { describe, it, expect } from 'vitest';
import { GUIDE_ROUTES, guidePageUrl, guideLandingUrl } from '../routes';

describe('GUIDE_ROUTES', () => {
  it('has a landing route for fastapi-production', () => {
    expect(GUIDE_ROUTES.landing).toBe('/guides/fastapi-production/');
  });

  it('has a guides base route', () => {
    expect(GUIDE_ROUTES.guides).toBe('/guides/');
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
