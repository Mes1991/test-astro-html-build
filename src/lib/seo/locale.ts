import type { LocaleCode } from './types';
import { LOCALES, DEFAULT_LOCALE } from './types';
import { absoluteUrl } from './url';

/**
 * Site-level routes. Sections that live as anchors on the home page
 * (services, process, packages, contact) are NOT routes — they're
 * `/#services` etc. Only top-level pages live here.
 */
export const ROUTE_KEYS = ['home', 'blog'] as const;
export type RouteKey = (typeof ROUTE_KEYS)[number];

/** Per-route, per-locale URL slug fragments (no leading slash). 'home' uses ''. */
export const localizedSlugs: Record<RouteKey, Record<LocaleCode, string>> = {
  home: { en: '', es: '' },
  /* "blog" stays in the URL across locales; the display label
     is in the i18n dictionaries. */
  blog: { en: 'blog', es: 'blog' },
};

/** Build the absolute path (with leading slash) for a route in a locale. */
export function pathFor(route: RouteKey, locale: LocaleCode): string {
  const slug = localizedSlugs[route][locale];
  const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  if (route === 'home') return `${localePrefix}/`;
  return `${localePrefix}/${slug}`;
}

/** Build absolute hreflang URLs for every locale + x-default for a route. */
export function alternateUrls(route: RouteKey): Record<LocaleCode | 'x-default', string> {
  const out = {} as Record<LocaleCode | 'x-default', string>;
  for (const locale of LOCALES) {
    out[locale] = absoluteUrl(pathFor(route, locale));
  }
  out['x-default'] = absoluteUrl(pathFor(route, DEFAULT_LOCALE));
  return out;
}

/** Helper for the language switcher UI. */
export function oppositeLocale(current: LocaleCode): LocaleCode {
  return current === 'en' ? 'es' : 'en';
}

/**
 * Best-effort: given a pathname, infer the RouteKey. Used by <SEO> when no
 * explicit alternates are passed. Returns null if the path doesn't match
 * a known static route (e.g. case study pages, which pass alternates explicitly).
 */
export function routeKeyFromPath(pathname: string): RouteKey | null {
  // strip leading /es/, leading slash, trailing slash
  const stripped = pathname
    .replace(/^\/(en|es)(\/|$)/, '/')
    .replace(/^\/+|\/+$/g, '');
  if (stripped === '') return 'home';
  for (const key of ROUTE_KEYS) {
    if (key === 'home') continue;
    if (stripped === localizedSlugs[key].en || stripped === localizedSlugs[key].es) return key;
  }
  return null;
}
