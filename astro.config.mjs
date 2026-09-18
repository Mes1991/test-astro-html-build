// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import seoLint from './src/integrations/seo-lint/index.ts';
import { hreflangLinksFor } from './src/lib/seo/sitemap.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
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
        // Drop error and holding pages — these don't belong in sitemaps.
        const EXCLUDED = ['/404', '/coming-soon'];
        if (EXCLUDED.some((p) => page.includes(p))) return false;
        return true;
      },
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        // Priorities
        if (item.url === 'https://example.com/') {
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
    // Must run after sitemap(): its build-done hook validates emitted XML.
    seoLint(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
