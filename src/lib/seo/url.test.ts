import { describe, expect, it } from 'vitest';
import { absoluteUrl, canonicalUrl, stripTrailingSlash } from './url';

describe('stripTrailingSlash', () => {
  it('removes a single trailing slash', () => {
    expect(stripTrailingSlash('/about/')).toBe('/about');
  });

  it('preserves the root slash', () => {
    expect(stripTrailingSlash('/')).toBe('/');
  });

  it('leaves a path without trailing slash unchanged', () => {
    expect(stripTrailingSlash('/about')).toBe('/about');
  });

  it('preserves the trailing slash on a locale root', () => {
    expect(stripTrailingSlash('/es/')).toBe('/es/');
  });

  it('adds a trailing slash to a bare locale root', () => {
    expect(stripTrailingSlash('/es')).toBe('/es/');
  });
});

describe('absoluteUrl', () => {
  it('joins site origin and path', () => {
    expect(absoluteUrl('/about', 'https://example.com')).toBe('https://example.com/about');
  });

  it('handles trailing slash on site', () => {
    expect(absoluteUrl('/about', 'https://example.com/')).toBe('https://example.com/about');
  });

  it('handles missing leading slash on path', () => {
    expect(absoluteUrl('about', 'https://example.com')).toBe('https://example.com/about');
  });

  it('returns the bare site for empty path', () => {
    expect(absoluteUrl('', 'https://example.com')).toBe('https://example.com/');
  });

  it('joins multi-segment paths', () => {
    expect(absoluteUrl('/work/example-project', 'https://example.com')).toBe(
      'https://example.com/work/example-project',
    );
  });

  it('strips trailing slash on multi-segment paths', () => {
    expect(absoluteUrl('/work/example-project/', 'https://example.com')).toBe(
      'https://example.com/work/example-project',
    );
  });

  it('collapses repeated leading slashes', () => {
    expect(absoluteUrl('//foo', 'https://example.com')).toBe('https://example.com/foo');
  });

  it('preserves a non-default site port', () => {
    expect(absoluteUrl('/about', 'https://example.com:8080')).toBe('https://example.com:8080/about');
  });
});

describe('canonicalUrl', () => {
  it('strips query strings', () => {
    expect(canonicalUrl(new URL('https://example.com/about?utm_source=x'))).toBe('https://example.com/about');
  });

  it('strips fragments', () => {
    expect(canonicalUrl(new URL('https://example.com/about#team'))).toBe('https://example.com/about');
  });

  it('strips both query and fragment together', () => {
    expect(canonicalUrl(new URL('https://example.com/about?utm=x#team'))).toBe(
      'https://example.com/about',
    );
  });

  it('normalizes trailing slash on non-root paths', () => {
    expect(canonicalUrl(new URL('https://example.com/about/'))).toBe('https://example.com/about');
  });

  it('preserves trailing slash on root', () => {
    expect(canonicalUrl(new URL('https://example.com/'))).toBe('https://example.com/');
  });

  it('preserves trailing slash on a locale root', () => {
    expect(canonicalUrl(new URL('https://example.com/es/'))).toBe(
      'https://example.com/es/',
    );
  });

  it('honors an explicit site override', () => {
    expect(canonicalUrl(new URL('https://example.com/about'), 'https://staging.example.com')).toBe(
      'https://staging.example.com/about',
    );
  });

  it('handles deep multi-segment paths with trailing slash', () => {
    expect(canonicalUrl(new URL('https://example.com/work/example-project/'))).toBe(
      'https://example.com/work/example-project',
    );
  });
});
