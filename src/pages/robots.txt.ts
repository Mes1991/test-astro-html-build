import type { APIRoute } from 'astro';
import { siteSeo } from '../lib/seo/defaults';

const PROD_ROBOTS = `# Example Site — production
User-agent: *
Allow: /
Disallow: /og/
Disallow: /api/

# AI crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${siteSeo.siteUrl}/sitemap-index.xml
`;

const STAGING_ROBOTS = `# Example Site — non-production environment
User-agent: *
Disallow: /
`;

export const GET: APIRoute = () => {
  const env = import.meta.env.SITE_ENV ?? (import.meta.env.PROD ? 'production' : 'development');
  const body = env === 'production' ? PROD_ROBOTS : STAGING_ROBOTS;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
