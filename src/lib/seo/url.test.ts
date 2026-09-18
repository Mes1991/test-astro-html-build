import { describe, expect, it } from 'vitest';
import { absoluteUrl, canonicalUrl, routePath, routeUrl, withTrailingSlash } from './url';

describe('withTrailingSlash', () => {
  it('adds a trailing slash to a directory route', () => {
    expect(withTrailingSlash('/about')).toBe('/about/');
  });

  it('leaves an already-normalized route unchanged', () => {
    expect(withTrailingSlash('/about/')).toBe('/about/');
  });

  it('keeps the root as "/"', () => {
    expect(withTrailingSlash('/')).toBe('/');
    expect(withTrailingSlash('')).toBe('/');
  });

  it('normalizes a bare locale root', () => {
    expect(withTrailingSlash('/es')).toBe('/es/');
    expect(withTrailingSlash('/es/')).toBe('/es/');
  });

  it('normalizes deep routes', () => {
    expect(withTrailingSlash('/es/blog/example-post')).toBe('/es/blog/example-post/');
  });

  it('treats a route slug containing a dot as a route, not an asset', () => {
    // `release-v2.0` is ordinary content-author input (`slug: z.string()`).
    // Classifying it as an asset strips its trailing slash, and the page then
    // ships a slashed canonical alongside slashless hreflang and JSON-LD URLs.
    expect(withTrailingSlash('/blog/release-v2.0')).toBe('/blog/release-v2.0/');
    expect(withTrailingSlash('/blog/faq-2024.1')).toBe('/blog/faq-2024.1/');
    expect(withTrailingSlash('/es/blog/release-v2.0')).toBe('/es/blog/release-v2.0/');
    expect(absoluteUrl('/blog/release-v2.0', 'https://example.com')).toBe(
      'https://example.com/blog/release-v2.0/',
    );
  });

  it('never adds a trailing slash to an asset path', () => {
    // A slash here would break every OG image and the favicon.
    expect(withTrailingSlash('/og/home.png')).toBe('/og/home.png');
    expect(withTrailingSlash('/favicon.svg')).toBe('/favicon.svg');
    expect(withTrailingSlash('/og/es/blog/example-post.png')).toBe('/og/es/blog/example-post.png');
  });
});

describe('routePath and routeUrl', () => {
  it('never consults the asset heuristic — a file-shaped slug is still a route', () => {
    // A content slug may legitimately look like a file name. Only the caller
    // knows whether a path is a route, so the caller says so.
    expect(routePath('/blog/whitepaper.pdf')).toBe('/blog/whitepaper.pdf/');
    expect(routePath('/es/blog/whitepaper.pdf')).toBe('/es/blog/whitepaper.pdf/');
    expect(routeUrl('/blog/whitepaper.pdf', 'https://example.com')).toBe(
      'https://example.com/blog/whitepaper.pdf/',
    );
  });

  it('is idempotent and keeps the root', () => {
    expect(routePath('/blog/whitepaper.pdf/')).toBe('/blog/whitepaper.pdf/');
    expect(routePath('/')).toBe('/');
    expect(routePath('')).toBe('/');
  });

  it('collapses repeated slashes', () => {
    expect(routePath('//blog//whitepaper.pdf')).toBe('/blog/whitepaper.pdf/');
  });
});

describe('absoluteUrl', () => {
  it('joins site origin and path in canonical form', () => {
    expect(absoluteUrl('/about', 'https://example.com')).toBe('https://example.com/about/');
  });

  it('handles a trailing slash on the site origin', () => {
    expect(absoluteUrl('/about', 'https://example.com/')).toBe('https://example.com/about/');
  });

  it('handles a missing leading slash on the path', () => {
    expect(absoluteUrl('about', 'https://example.com')).toBe('https://example.com/about/');
  });

  it('returns the bare site for an empty path', () => {
    expect(absoluteUrl('', 'https://example.com')).toBe('https://example.com/');
  });

  it('joins multi-segment paths', () => {
    expect(absoluteUrl('/work/example-project', 'https://example.com')).toBe(
      'https://example.com/work/example-project/',
    );
  });

  it('is idempotent on an already-canonical path', () => {
    expect(absoluteUrl('/work/example-project/', 'https://example.com')).toBe(
      'https://example.com/work/example-project/',
    );
  });

  it('collapses repeated leading slashes', () => {
    expect(absoluteUrl('//foo', 'https://example.com')).toBe('https://example.com/foo/');
  });

  it('preserves a non-default site port', () => {
    expect(absoluteUrl('/about', 'https://example.com:8080')).toBe(
      'https://example.com:8080/about/',
    );
  });

  it('leaves asset URLs slashless', () => {
    expect(absoluteUrl('/og/default.png', 'https://example.com')).toBe(
      'https://example.com/og/default.png',
    );
  });
});

describe('canonicalUrl', () => {
  it('strips query strings', () => {
    expect(canonicalUrl(new URL('https://example.com/about?utm_source=x'))).toBe(
      'https://example.com/about/',
    );
  });

  it('strips fragments', () => {
    expect(canonicalUrl(new URL('https://example.com/about#team'))).toBe(
      'https://example.com/about/',
    );
  });

  it('strips both query and fragment together', () => {
    expect(canonicalUrl(new URL('https://example.com/about?utm=x#team'))).toBe(
      'https://example.com/about/',
    );
  });

  it('normalizes a slashless path to the canonical form', () => {
    expect(canonicalUrl(new URL('https://example.com/about'))).toBe('https://example.com/about/');
  });

  it('preserves the root', () => {
    expect(canonicalUrl(new URL('https://example.com/'))).toBe('https://example.com/');
  });

  it('preserves a locale root', () => {
    expect(canonicalUrl(new URL('https://example.com/es/'))).toBe('https://example.com/es/');
  });

  it('honors an explicit site override', () => {
    expect(canonicalUrl(new URL('https://example.com/about'), 'https://staging.example.com')).toBe(
      'https://staging.example.com/about/',
    );
  });

  it('handles deep multi-segment paths', () => {
    expect(canonicalUrl(new URL('https://example.com/work/example-project/'))).toBe(
      'https://example.com/work/example-project/',
    );
  });
});


describe('Unicode public URL encoding', () => {
  it('emits the same encoded URL from raw and already encoded route paths', () => {
    expect(routeUrl('/blog/dise\u00f1o-web/')).toBe('https://example.com/blog/dise%C3%B1o-web/');
    expect(routeUrl('/blog/dise%C3%B1o-web/')).toBe('https://example.com/blog/dise%C3%B1o-web/');
  });
});


describe('public encoding preserves existing escapes', () => {
  it('does not decode a reserved encoded separator or encode percent twice', () => {
    expect(routeUrl('/blog/a%2Fb/')).toBe('https://example.com/blog/a%2Fb/');
  });
});
