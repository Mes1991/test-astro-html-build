import { siteSeo } from './defaults';

/**
 * Extensions this site serves as static files. An explicit allowlist, not "any
 * dot in the last segment": content slugs legitimately contain dots
 * (`release-v2.0`, `faq-2024.1`), and treating those as assets strips the
 * trailing slash from a real page — so its hreflang and JSON-LD URLs stop
 * matching its own canonical.
 */
const ASSET_EXTENSIONS = new Set([
  'avif', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'webp',
  'css', 'js', 'mjs', 'json', 'map',
  'pdf', 'txt', 'xml',
  'eot', 'otf', 'ttf', 'woff', 'woff2',
  'mp3', 'mp4', 'wav', 'webm',
]);

export function isAssetPath(path: string): boolean {
  const last = path.split('/').filter(Boolean).pop();
  if (last === undefined) return false;
  const extension = last.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return extension !== undefined && ASSET_EXTENSIONS.has(extension);
}

/**
 * Normalize a path to this project's single canonical URL form.
 *
 * The chosen form is directory-style **with a trailing slash**: `/blog/`,
 * `/es/blog/`, with the site root staying `/`. Google treats `/blog` and
 * `/blog/` as distinct URLs and asks you to pick one, link it consistently and
 * publish only that one in the sitemap; the trailing slash is also what Astro's
 * default `build.format: 'directory'` actually emits (`blog/index.html`), so it
 * is the form this build already serves.
 *
 * Asset paths are returned untouched — see `isAssetPath`.
 *
 * Note for deployment: `trailingSlash: 'always'` does not by itself make a host
 * redirect `/blog` to `/blog/` for prerendered pages. Astro leaves that to the
 * host, so the target hosting must be configured to redirect the slashless form.
 */
export function withTrailingSlash(path: string): string {
  if (path === '' || path === '/') return '/';
  if (isAssetPath(path)) return path;
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * Normalize a path that the caller KNOWS is a directory route.
 *
 * Unlike `withTrailingSlash`, this never consults `isAssetPath`. A content slug
 * is free to look like a file name (`whitepaper.pdf`, `release-v2.0`), and the
 * page is still a page — only the caller knows which it is, so the caller says
 * so instead of leaving it to a heuristic over the last path segment.
 */
export function routePath(path: string): string {
  if (path === '' || path === '/') return '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  return collapsed.endsWith('/') ? collapsed : `${collapsed}/`;
}

/** Absolute URL for a path the caller knows is a directory route. */
export function routeUrl(path: string, site: string = siteSeo.siteUrl): string {
  const cleanedSite = site.endsWith('/') ? site.slice(0, -1) : site;
  return new URL(`${cleanedSite}${routePath(path)}`).href;
}

/**
 * Build an absolute URL from a path and an origin. Hardens messy input:
 * collapses repeated slashes and normalizes to the canonical trailing-slash
 * form. Safe to call with paths sourced from MDX/JSON frontmatter where authors
 * may include either or neither.
 */
export function absoluteUrl(path: string, site: string = siteSeo.siteUrl): string {
  const cleanedSite = site.endsWith('/') ? site.slice(0, -1) : site;
  if (!path) return `${cleanedSite}/`;
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  return `${cleanedSite}${withTrailingSlash(collapsed)}`;
}

/**
 * Produce the canonical URL for a request: strip query/fragment, normalize to
 * the canonical trailing-slash form, and return the absolute URL. This is also
 * what feeds `og:url`, so canonical and og:url can never disagree.
 */
export function canonicalUrl(url: URL, site: string = siteSeo.siteUrl): string {
  // `url.pathname` comes from Astro's own routing, so it is already a route by
  // construction — never an asset. Use `routePath`, not the heuristic.
  return routeUrl(url.pathname, site);
}


/** Public path encoding; preserves reserved escapes and never double encodes. */
export function publicPath(path: string): string {
  const url = new URL(`https://path.invalid${path.startsWith('/') ? path : `/${path}`}`);
  return url.pathname + url.search + url.hash;
}
