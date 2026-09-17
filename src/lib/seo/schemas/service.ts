import type { Service, WithContext } from 'schema-dts';
import { siteSeo } from '../defaults';
import { SERVICES_CATALOG, type ServiceCatalogEntry } from '../data/services';

/** Single Service schema. Provider points to the site-wide Organization. */
export function buildService(item: ServiceCatalogEntry): WithContext<Service> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: item.name,
    description: item.description,
    serviceType: item.serviceType,
    provider: {
      '@type': 'Organization',
      name: siteSeo.brand,
      url: siteSeo.siteUrl,
    },
    areaServed: { '@type': 'Country', name: 'Worldwide' },
  };
}

/** Convenience: build all services from the catalog. */
export function buildAllServices(): WithContext<Service>[] {
  return SERVICES_CATALOG.map(buildService);
}
