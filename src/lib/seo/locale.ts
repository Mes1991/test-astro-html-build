import type { LocaleCode } from './types';
import { LOCALES, DEFAULT_LOCALE } from './types';
import { routeUrl } from './url';

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

/**
 * Build the absolute path (with leading slash) for a route in a locale, in the
 * project's canonical trailing-slash form. This feeds internal links as well as
 * hreflang, so navigation and canonical URLs cannot drift apart.
 */
export function pathFor(route: RouteKey, locale: LocaleCode): string {
  const slug = localizedSlugs[route][locale];
  const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  if (route === 'home') return `${localePrefix}/`;
  return `${localePrefix}/${slug}/`;
}

/**
 * Build the path for a dynamic blog post, in the canonical trailing-slash form.
 *
 * Lives here rather than in each component so navigation links, canonicals and
 * the sitemap cannot drift into different URL forms for the same page — which
 * is precisely what Google asks you to avoid.
 */
export function postPathFor(slug: string, locale: LocaleCode): string {
  const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return `${localePrefix}/blog/${slug}/`;
}

/** Build absolute hreflang URLs for every locale + x-default for a route. */
export function alternateUrls(route: RouteKey): Record<LocaleCode | 'x-default', string> {
  const out = {} as Record<LocaleCode | 'x-default', string>;
  for (const locale of LOCALES) {
    out[locale] = routeUrl(pathFor(route, locale));
  }
  out['x-default'] = routeUrl(pathFor(route, DEFAULT_LOCALE));
  return out;
}

/** Helper for the language switcher UI. */
export function oppositeLocale(current: LocaleCode): LocaleCode {
  return current === 'en' ? 'es' : 'en';
}

/**
 * The locale a URL path advertises through its prefix. Unprefixed paths are the
 * default locale, because `prefixDefaultLocale` is false. Use this — not the
 * page's own hardcoded `lang` — whenever a page needs to know which locale it
 * is currently being served as: with `i18n.fallback`, one source file can be
 * emitted under several locale prefixes.
 */
export function localeOfRoute(pathname: string): LocaleCode {
  const segment = pathname.replace(/^\/+/, '').split('/')[0];
  return LOCALES.find((l) => l === segment) ?? DEFAULT_LOCALE;
}

/**
 * Best-effort: given a pathname, infer the RouteKey. Used by <SEO> when no
 * explicit alternates are passed. Returns null if the path doesn't match a
 * known static route — today that means blog posts, whose dynamic routes
 * (`src/pages/blog/[slug].astro`, `src/pages/es/blog/[slug].astro`) pass their
 * alternates explicitly instead.
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
