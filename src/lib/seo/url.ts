import { siteSeo } from './defaults';
import { LOCALES } from './types';

const LOCALE_ROOT_REGEX = new RegExp(`^/(${LOCALES.join('|')})/?$`, 'i');

/**
 * Strip a single trailing slash, but never the root slash, and never the
 * trailing slash on locale roots like `/es/`. Locale roots normalize to the
 * "with slash" form so canonical/hreflang/sitemap stay consistent with the
 * actual served path.
 */
export function stripTrailingSlash(path: string): string {
  if (path === '/') return path;
  if (LOCALE_ROOT_REGEX.test(path)) return path.endsWith('/') ? path : `${path}/`;
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Build an absolute URL from a path and an origin. Hardens messy input:
 * collapses repeated leading slashes and strips trailing slashes (except
 * for the root path, which always returns "/"). Safe to call with paths
 * sourced from MDX/JSON frontmatter where authors may include either or
 * neither of those.
 */
export function absoluteUrl(path: string, site: string = siteSeo.siteUrl): string {
  const cleanedSite = site.endsWith('/') ? site.slice(0, -1) : site;
  if (!path) return `${cleanedSite}/`;
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  const normalized = stripTrailingSlash(collapsed);
  return `${cleanedSite}${normalized === '' ? '/' : normalized}`;
}

/**
 * Produce the canonical URL for a request: strip query/fragment, normalize
 * trailing slash on non-root paths, and return the absolute URL.
 */
export function canonicalUrl(url: URL, site: string = siteSeo.siteUrl): string {
  const path = stripTrailingSlash(url.pathname);
  return absoluteUrl(path, site);
}
