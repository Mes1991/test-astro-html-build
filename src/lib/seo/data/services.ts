/**
 * Source of truth for the agency's service offerings. Used by the Service
 * JSON-LD schema helpers (buildService / buildAllServices).
 */
export interface ServiceCatalogEntry {
  name: string;
  slug: string;
  description: string;
  serviceType: string;
}

export const SERVICES_CATALOG: readonly ServiceCatalogEntry[] = [
  {
    name: 'Web Design',
    slug: 'web-design',
    description: 'Thoughtful, user-centred design systems and interfaces built to communicate clearly and convert reliably.',
    serviceType: 'Web design',
  },
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Custom websites built from scratch on modern frameworks — performant, accessible, and ready to scale.',
    serviceType: 'Website development',
  },
  {
    name: 'Branding',
    slug: 'branding',
    description: 'Identity systems, logo design, and visual language that give your organisation a consistent and memorable presence.',
    serviceType: 'Brand identity design',
  },
  {
    name: 'SEO',
    slug: 'seo',
    description: 'Technical SEO, on-page optimisation, and content strategy that improve search visibility and drive qualified traffic.',
    serviceType: 'Search engine optimization',
  },
] as const;
