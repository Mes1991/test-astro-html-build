import type { WebSite, WithContext } from 'schema-dts';
import { siteSeo, localeTag } from '../defaults';
import type { LocaleCode } from '../types';

/**
 * Site-wide WebSite schema emitted from BaseLayout. The SearchAction slot
 * is included even though there is no on-site search yet — Google ignores
 * unsupported targets, and adding it now means a future /search route
 * Just Works without revisiting this file.
 */
export function buildWebSite(locale: LocaleCode = 'en'): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteSeo.brand,
    url: siteSeo.siteUrl,
    inLanguage: localeTag[locale],
    publisher: { '@type': 'Organization', name: siteSeo.brand },
  };
}
