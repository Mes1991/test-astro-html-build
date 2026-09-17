import type { Organization, WithContext } from 'schema-dts';
import { siteSeo } from '../defaults';
import { absoluteUrl } from '../url';

/**
 * Build the site-wide Organization schema. Emitted once per page from
 * BaseLayout. TBD values in siteSeo.organization are intentionally surfaced
 * — fix them by editing src/lib/seo/defaults.ts, not here.
 */
export function buildOrganization(): WithContext<Organization> {
  const org = siteSeo.organization;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    legalName: org.legalName,
    url: siteSeo.siteUrl,
    logo: absoluteUrl('/favicon.svg'),
    email: org.email,
    description: siteSeo.defaultDescription,
    foundingDate: org.foundingDate,
    sameAs: [...org.sameAs],
    knowsAbout: [...org.knowsAbout],
    areaServed: { '@type': 'Country', name: 'Worldwide' },
  };
}
