import { describe, expect, it } from 'vitest';
import { siteSeo } from './defaults';
import {
  pathFor,
  alternateUrls,
  oppositeLocale,
  ROUTE_KEYS,
  localizedSlugs,
  localeOfRoute,
} from './locale';

const SITE = siteSeo.siteUrl;

describe('pathFor', () => {
  it('returns / for home in English', () => {
    expect(pathFor('home', 'en')).toBe('/');
  });

  it('returns /es/ for home in Spanish', () => {
    expect(pathFor('home', 'es')).toBe('/es/');
  });

  it('keeps "blog" URL slug English in both locales (brand label is in i18n dict)', () => {
    expect(pathFor('blog', 'en')).toBe('/blog/');
    expect(pathFor('blog', 'es')).toBe('/es/blog/');
  });
});

describe('alternateUrls', () => {
  it('returns en/es URLs for blog with shared "blog" slug', () => {
    const urls = alternateUrls('blog');
    expect(urls.en).toBe(`${SITE}/blog/`);
    expect(urls.es).toBe(`${SITE}/es/blog/`);
  });
});

describe('oppositeLocale', () => {
  it('flips en → es', () => {
    expect(oppositeLocale('en')).toBe('es');
  });
  it('flips es → en', () => {
    expect(oppositeLocale('es')).toBe('en');
  });
});

describe('ROUTE_KEYS', () => {
  it('contains only top-level page routes (not home anchors)', () => {
    expect(ROUTE_KEYS).toEqual(['home', 'blog']);
  });
});

describe('localizedSlugs', () => {
  it('has translations for every ROUTE_KEY', () => {
    for (const key of ROUTE_KEYS) {
      expect(localizedSlugs[key].en).toBeDefined();
      expect(localizedSlugs[key].es).toBeDefined();
    }
  });
});

describe('localeOfRoute', () => {
  it('reads the locale from a prefixed path', () => {
    expect(localeOfRoute('/es/')).toBe('es');
    expect(localeOfRoute('/es/blog/')).toBe('es');
  });

  it('treats an unprefixed path as the default locale', () => {
    expect(localeOfRoute('/')).toBe('en');
    expect(localeOfRoute('/blog/')).toBe('en');
  });

  it('does not mistake a slug that merely starts with a locale code', () => {
    expect(localeOfRoute('/espanol/')).toBe('en');
  });
});
