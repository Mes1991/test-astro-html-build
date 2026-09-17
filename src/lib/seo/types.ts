import type { Thing, WithContext } from 'schema-dts';

/** Supported page locales. Single source of truth — Astro i18n config will mirror this in Phase 4. */
export const LOCALES = ['en', 'es'] as const;
export type LocaleCode = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: LocaleCode = 'en';

/** OG/Twitter image. Always include alt — empty string is a fail. */
export interface OgImageInput {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/** og:type values we use. */
export type OgType = 'website' | 'article' | 'profile';

/**
 * SEO props accepted by <SEO> (defined in Phase 2) and BaseLayout (passthrough).
 *
 * Contract note: `description` is required here, but `BaseLayout`'s Props type
 * makes it optional (Partial<SeoProps> & { title }) and falls back to
 * `siteSeo.defaultDescription` when omitted. The Phase 2 <SEO> component must
 * mirror that fallback so callers can pass either a string or omit the prop
 * entirely. Don't change `description` here to optional without updating the
 * <SEO> component to require its own non-empty fallback.
 */
export interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  image?: OgImageInput;
  type?: OgType;
  locale?: LocaleCode;
  alternates?: Partial<Record<LocaleCode, string>>;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  schema?: WithContext<Thing> | WithContext<Thing>[];
}

/** Single breadcrumb entry. `url` is the absolute URL. */
export interface BreadcrumbInput {
  name: string;
  url: string;
}
