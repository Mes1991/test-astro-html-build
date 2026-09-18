import { ROUTE_KEYS, pathFor, type RouteKey } from './locale';
import { LOCALES, DEFAULT_LOCALE, type LocaleCode } from './types';
import { siteSeo } from './defaults';
import { absoluteUrl, publicPath, withTrailingSlash } from './url';

/** One `<xhtml:link rel="alternate">` entry for a sitemap URL. */
export interface SitemapAlternate {
  lang: LocaleCode | 'x-default';
  url: string;
}

/**
 * Reduce an absolute (or already relative) URL to the project's canonical path
 * form, so sitemap URLs can be compared against `pathFor()` output.
 *
 * This deliberately reuses `withTrailingSlash` rather than a local
 * `replace(/\/+$/, '')`. A hand-rolled strip turns `/es/` into `/es`, which then
 * matches no known route and silently drops that URL's hreflang alternates.
 *
 * It normalizes *to* the canonical form; it does not erase the difference
 * between the two forms. `/blog` and `/blog/` both normalize to `/blog/`, which
 * is the one URL this site publishes — so a page whose canonical really points
 * somewhere else still compares as different.
 */
export function sitemapPath(url: string, site: string = siteSeo.siteUrl): string {
  const origin = site.endsWith('/') ? site.slice(0, -1) : site;
  const raw = url.startsWith(origin) ? url.slice(origin.length) : url;
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withTrailingSlash(withLeadingSlash.replace(/\/{2,}/g, '/'));
}

/**
 * Reduce a URL to its path **exactly as written** — origin removed and repeated
 * slashes collapsed, but the trailing-slash form left untouched.
 *
 * `sitemapPath` is for answering "which page is this?", where `/blog` and
 * `/blog/` must resolve to the same page. `exactPath` is for answering "is this
 * URL written in the form we publish?", where they must not. Comparing
 * canonical against `<loc>` needs the strict one: normalizing both sides first
 * would make the gate accept the very disagreement it exists to catch.
 */
export function exactPath(url: string, site: string = siteSeo.siteUrl): string {
  const origin = site.endsWith('/') ? site.slice(0, -1) : site;
  const raw = url.startsWith(origin) ? url.slice(origin.length) : url;
  // Deliberately no slash collapsing: `//blog/` and `/blog/` are different
  // public URLs, and collapsing them here would let the sitemap/canonical gate
  // accept a disagreement it is meant to reject.
  return publicPath(raw.startsWith('/') ? raw : `/${raw}`);
}

/**
 * True when a URL is already written in this site's canonical form: no repeated
 * slashes, and directory routes ending in a trailing slash.
 */
export function isCanonicalForm(url: string, site: string = siteSeo.siteUrl): boolean {
  const path = exactPath(url, site);
  if (path.includes('//')) return false;
  return path === withTrailingSlash(path);
}

/**
 * Map a sitemap URL back to the `RouteKey` it belongs to, in any locale.
 * Returns null for URLs that aren't one of the statically known routes
 * (blog posts, OG images, holding pages…).
 */
export function routeKeyForUrl(url: string, site: string = siteSeo.siteUrl): RouteKey | null {
  const path = sitemapPath(url, site);
  for (const key of ROUTE_KEYS) {
    for (const locale of LOCALES) {
      if (withTrailingSlash(pathFor(key, locale)) === path) return key;
    }
  }
  return null;
}

/**
 * Build the hreflang alternates for a sitemap URL, or null when the URL is not
 * a known static route. The URLs are produced with `absoluteUrl`, so sitemap
 * hreflang and the in-page `<link rel="canonical">` always agree on form.
 */
export function hreflangLinksFor(
  url: string,
  site: string = siteSeo.siteUrl,
): SitemapAlternate[] | null {
  const key = routeKeyForUrl(url, site);
  if (!key) return null;

  const links: SitemapAlternate[] = LOCALES.map((locale) => ({
    lang: locale,
    url: absoluteUrl(pathFor(key, locale), site),
  }));
  links.push({ lang: 'x-default', url: absoluteUrl(pathFor(key, DEFAULT_LOCALE), site) });
  return links;
}
