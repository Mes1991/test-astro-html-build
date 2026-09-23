/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Site environment: 'production' | 'staging' | 'development'. Unset, robots.txt follows the build (production on `astro build`). */
  readonly SITE_ENV?: 'production' | 'staging' | 'development';
  /** 'true' serves the coming-soon holding page for every route (see `src/middleware.ts`). */
  readonly PUBLIC_COMING_SOON?: string;
  /** GA4 measurement ID, e.g. 'G-XXXXXXXXXX'. Only emitted in production builds (`import.meta.env.PROD`). */
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  /** Google Search Console verification token (the meta-tag value). Prod-only. */
  readonly PUBLIC_GSC_VERIFICATION?: string;
  /** Bing Webmaster verification token (the meta-tag value). Prod-only. */
  readonly PUBLIC_BING_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
