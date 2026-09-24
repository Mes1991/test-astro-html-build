// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import seoLint from './src/integrations/seo-lint/index.ts';
import sitemapOptOut from './src/integrations/sitemap-opt-out/index.ts';
import { siteSeo } from './src/lib/seo/defaults.ts';
import { hreflangLinksFor } from './src/lib/seo/sitemap.ts';

const homeUrl = new URL('/', siteSeo.siteUrl).href;

// https://astro.build/config
export default defineConfig({
  site: siteSeo.siteUrl,
  /* Canonical public URL form: directory routes always end in a trailing slash
     (`/blog/`, `/es/blog/`), the root stays `/`. Google treats `/blog` and
     `/blog/` as distinct URLs and asks for one to be chosen, linked
     consistently and published alone in the sitemap.

     Deployment note: this does NOT make a host redirect `/blog` to `/blog/` for
     prerendered pages — Astro leaves that to the host. Configure that redirect
     on the target hosting. */
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
      fallbackType: 'rewrite',
    },
    fallback: { es: 'en' },
  },
  integrations: [
    sitemap({
      filter: (page) => {
        if (page.includes('/og/') || page.includes('/api/')) return false;
        // Drop error pages. Holding pages opt out through their HTML marker.
        const EXCLUDED = ['/404'];
        if (EXCLUDED.some((p) => page.includes(p))) return false;
        return true;
      },
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        // Priorities
        if (item.url === homeUrl) {
          item.priority = 1.0;
          item.changefreq = 'monthly';
        }

        // hreflang — derived from the single source of truth in
        // `src/lib/seo/locale.ts` rather than a second route map maintained by
        // hand here. Dynamic blog posts resolve to null and are skipped; their
        // per-page <link rel="alternate"> tags in HTML cover hreflang, and
        // Google reads either source.
        const links = hreflangLinksFor(item.url);
        if (links) item.links = links;

        return item;
      },
    }),
    partytown({
      config: {
        forward: ['dataLayer.push', 'gtag'],
        debug: false,
      },
    }),
    react(),
    // Must run after sitemap(): removes pages with an explicit sitemap marker.
    sitemapOptOut(),
    // Must run after sitemapOptOut(): its build-done hook validates final XML.
    seoLint(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
