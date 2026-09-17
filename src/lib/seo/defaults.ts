import type { LocaleCode } from './types';

/**
 * Site-wide SEO config. Edit this file to update brand-level SEO across the
 * whole site. Per-page overrides happen via the SeoProps passed to <SEO>.
 *
 * TBD values (legalName, email, foundingDate, sameAs, twitterHandle) are
 * placeholders to be filled before production launch. They are surfaced
 * intentionally so they show up in any SEO audit until set.
 */
export const siteSeo = {
  brand: 'Example Site',

  /** Used by <title>: "{title} — Example Site". Empty for the home page. */
  titleTemplate: (pageTitle: string) =>
    pageTitle ? `${pageTitle} — Example Site` : 'Example Site — An agent-ready Astro starter',

  defaultTitle: 'Example Site — An agent-ready Astro starter',
  defaultDescription:
    'An agent-ready, production-ready Astro starter template for building fast, accessible, multilingual websites with a clean design system and built-in SEO tools.',

  /** Build-time generated default OG card; phase 3 owns the generator. */
  defaultOgImage: '/og/default.png',
  defaultOgImageAlt: 'Example Site — An agent-ready Astro starter.',

  /** TBD: confirm handle. Used for twitter:site and twitter:creator. */
  twitterHandle: '@example',

  /** Brand color used for theme-color meta and OG card backgrounds. */
  themeColor: '#1f2937',

  /** Site URL — must match Astro config `site`. */
  siteUrl: 'https://example.com',

  /** OG card tagline (English). */
  tagline: 'Build something great.',

  /** OG card tagline (Spanish). */
  taglineEs: 'Crea algo grande.',

  /** Used by Organization schema. TBDs flagged. */
  organization: {
    name: 'Example Site',
    legalName: 'Example Site', // TBD: confirm legal name
    email: 'hello@example.com', // TBD: confirm public email
    foundingDate: '2024', // TBD: confirm
    /** Social profile URLs. TBD: confirm each. */
    sameAs: [] as string[],
    knowsAbout: [
      'Web design',
      'Web development',
    ],
  },
} as const;

/** Locale → BCP-47 language tag for hreflang and og:locale. */
export const localeTag: Record<LocaleCode, string> = {
  en: 'en-US',
  es: 'es-ES',
};
