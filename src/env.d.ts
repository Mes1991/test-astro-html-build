/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Site environment: 'production' | 'staging' | 'development' (defaults to 'development'). */
  readonly SITE_ENV?: 'production' | 'staging' | 'development';
  /** GA4 measurement ID, e.g. 'G-XXXXXXXXXX'. Only used when SITE_ENV === 'production'. */
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  /** Google Search Console verification token (the meta-tag value). Prod-only. */
  readonly PUBLIC_GSC_VERIFICATION?: string;
  /** Bing Webmaster verification token (the meta-tag value). Prod-only. */
  readonly PUBLIC_BING_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
