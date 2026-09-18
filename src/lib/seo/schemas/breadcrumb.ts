import type { BreadcrumbList, ListItem, WithContext } from 'schema-dts';
import type { BreadcrumbInput, LocaleCode } from '../types';
import { DEFAULT_LOCALE, LOCALES } from '../types';
import { routeUrl } from '../url';
import { t } from '../../../i18n/t';

/** schema.org BreadcrumbList. Returns null for empty input — callers should not emit. */
export function buildBreadcrumbList(
  crumbs: BreadcrumbInput[],
): WithContext<BreadcrumbList> | null {
  if (crumbs.length === 0) return null;
  const itemListElement: ListItem[] = crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

function humanize(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

const NON_DEFAULT_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

/**
 * Derive crumbs from a URL pathname. Always begins with the locale-translated
 * "Home" label. Each segment becomes a crumb with the cumulative path as URL
 * and a humanized name.
 *
 * Locale-prefixed paths (e.g. `/es/sobre-nosotros`) skip the locale segment
 * for crumb derivation but preserve it in each crumb's URL so the breadcrumb
 * trail points at the correct locale's pages.
 *
 * Override the last crumb's name at the call site if you need the page's
 * real title (e.g. case study name) instead of the humanized slug.
 */
export function breadcrumbsFromPath(
  pathname: string,
  locale: LocaleCode = DEFAULT_LOCALE,
): BreadcrumbInput[] {
  const segments = pathname.split('/').filter(Boolean);

  // If the URL begins with a known non-default locale prefix, drop it from
  // crumb derivation (so we don't humanize "Es" as a crumb) but remember it
  // for URL prefixing.
  let urlLocalePrefix = '';
  if (segments.length > 0 && (NON_DEFAULT_LOCALES as readonly string[]).includes(segments[0])) {
    urlLocalePrefix = `/${segments[0]}`;
    segments.shift();
  }

  const homeUrl = routeUrl(`${urlLocalePrefix}/`);
  const home: BreadcrumbInput = { name: t('nav.home', locale), url: homeUrl };
  if (segments.length === 0) return [home];

  const crumbs: BreadcrumbInput[] = [home];
  let cumulative = urlLocalePrefix;
  for (const seg of segments) {
    cumulative += `/${seg}`;
    crumbs.push({ name: humanize(seg), url: routeUrl(cumulative) });
  }
  return crumbs;
}
