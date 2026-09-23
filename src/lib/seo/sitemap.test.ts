import { describe, expect, it } from 'vitest';
import { siteSeo } from './defaults';
import { exactPath, hreflangLinksFor, isCanonicalForm, routeKeyForUrl, sitemapPath } from './sitemap';
import { ROUTE_KEYS, pathFor } from './locale';
import { LOCALES } from './types';

const SITE = siteSeo.siteUrl;

describe('sitemapPath', () => {
  it('keeps the trailing slash on a locale root', () => {
    // Regression guard for the sitemap serializer bug: a plain
    // `replace(/\/+$/, '')` turns `/es/` into `/es`, which matches no known
    // route and silently strips that URL's hreflang alternates.
    expect(sitemapPath(`${SITE}/es/`)).toBe('/es/');
  });

  it('keeps the root path as "/"', () => {
    expect(sitemapPath(`${SITE}/`)).toBe('/');
    expect(sitemapPath(SITE)).toBe('/');
  });

  it('normalizes ordinary routes to the canonical trailing-slash form', () => {
    expect(sitemapPath(`${SITE}/blog/`)).toBe('/blog/');
    expect(sitemapPath(`${SITE}/es/blog/`)).toBe('/es/blog/');
  });

  it('collapses repeated slashes', () => {
    expect(sitemapPath(`${SITE}//es//blog//`)).toBe('/es/blog/');
  });
});

describe('exactPath and isCanonicalForm', () => {
  it('preserves repeated slashes — //blog/ is not /blog/', () => {
    // Collapsing here would let the sitemap/canonical gate accept exactly the
    // disagreement it exists to reject.
    expect(exactPath(`${SITE}//blog/`)).toBe('//blog/');
    expect(exactPath(`${SITE}//blog/`)).not.toBe(exactPath(`${SITE}/blog/`));
  });

  it('preserves the exact trailing-slash form', () => {
    expect(exactPath(`${SITE}/blog`)).toBe('/blog');
    expect(exactPath(`${SITE}/blog/`)).toBe('/blog/');
  });

  it('returns the root for the bare origin', () => {
    expect(exactPath(SITE)).toBe('/');
    expect(exactPath(`${SITE}/`)).toBe('/');
  });

  it('rejects a repeated-slash URL as non-canonical', () => {
    expect(isCanonicalForm(`${SITE}//blog/`)).toBe(false);
  });

  it('rejects a slashless route as non-canonical', () => {
    expect(isCanonicalForm(`${SITE}/blog`)).toBe(false);
  });

  it('judges a dotted route slug by route rules, not asset rules', () => {
    expect(isCanonicalForm(`${SITE}/blog/release-v2.0`)).toBe(false);
    expect(isCanonicalForm(`${SITE}/blog/release-v2.0/`)).toBe(true);
  });

  it('accepts the canonical form, including assets and the root', () => {
    expect(isCanonicalForm(`${SITE}/blog/`)).toBe(true);
    expect(isCanonicalForm(`${SITE}/`)).toBe(true);
    expect(isCanonicalForm(`${SITE}/og/home.png`)).toBe(true);
  });
});

describe('routeKeyForUrl', () => {
  it('resolves both homes, with and without a trailing slash', () => {
    expect(routeKeyForUrl(`${SITE}/`)).toBe('home');
    expect(routeKeyForUrl(`${SITE}/es/`)).toBe('home');
    expect(routeKeyForUrl(`${SITE}/es`)).toBe('home');
  });

  it('resolves the blog index in both locales', () => {
    expect(routeKeyForUrl(`${SITE}/blog/`)).toBe('blog');
    expect(routeKeyForUrl(`${SITE}/es/blog/`)).toBe('blog');
  });

  it('returns null for URLs that are not statically known routes', () => {
    expect(routeKeyForUrl(`${SITE}/blog/example-post/`)).toBeNull();
    expect(routeKeyForUrl(`${SITE}/coming-soon/`)).toBeNull();
    expect(routeKeyForUrl(`${SITE}/es/coming-soon/`)).toBeNull();
  });
});

describe('hreflangLinksFor', () => {
  it('gives the Spanish home a full set of alternates', () => {
    // The defect this test exists for: `/es/` was the only known route in the
    // generated sitemap that carried no alternates at all.
    const links = hreflangLinksFor(`${SITE}/es/`);
    expect(links).not.toBeNull();
    expect(links).toEqual([
      { lang: 'en', url: `${SITE}/` },
      { lang: 'es', url: `${SITE}/es/` },
      { lang: 'x-default', url: `${SITE}/` },
    ]);
  });

  it('gives both homes the identical alternate set', () => {
    expect(hreflangLinksFor(`${SITE}/es/`)).toEqual(hreflangLinksFor(`${SITE}/`));
  });

  it('gives both blog indexes the identical alternate set', () => {
    expect(hreflangLinksFor(`${SITE}/es/blog/`)).toEqual(hreflangLinksFor(`${SITE}/blog/`));
  });

  it('returns null for URLs outside the known route map', () => {
    expect(hreflangLinksFor(`${SITE}/og/home.png`)).toBeNull();
  });

  it('covers every route key in every locale — no route may lose its alternates', () => {
    for (const key of ROUTE_KEYS) {
      for (const locale of LOCALES) {
        const url = `${SITE}${pathFor(key, locale)}`;
        const links = hreflangLinksFor(url);
        expect(links, `${key}/${locale} (${url}) has no alternates`).not.toBeNull();
        expect(links!.map((l) => l.lang)).toEqual([...LOCALES, 'x-default']);
      }
    }
  });

  it('emits alternates that are reciprocal across locales', () => {
    for (const key of ROUTE_KEYS) {
      const sets = LOCALES.map((locale) => hreflangLinksFor(`${SITE}${pathFor(key, locale)}`));
      for (const set of sets) expect(set).toEqual(sets[0]);
    }
  });
});
