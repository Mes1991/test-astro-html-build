// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import seoLint from './src/integrations/seo-lint/index.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
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

        // hreflang — derived per known route. Drop the dynamic blog posts
        // here; their per-page <link rel="alternate"> tags in HTML cover
        // hreflang, and Google reads either source.
        const ROUTE_MAP = [
          { en: '/', es: '/es/' },
          { en: '/blog', es: '/es/blog' },
        ];
        const SITE = 'https://example.com';
        const path = item.url.replace(SITE, '').replace(/\/+$/, '') || '/';
        const route = ROUTE_MAP.find(
          (r) => r.en === path || r.es === path || `${r.en}/` === path || `${r.es}/` === path,
        );
        if (route) {
          item.links = [
            { lang: 'en', url: `${SITE}${route.en}` },
            { lang: 'es', url: `${SITE}${route.es}` },
            { lang: 'x-default', url: `${SITE}${route.en}` },
          ];
        }

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
    seoLint(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
