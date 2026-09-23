import type { AstroIntegration } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { findSitemaps, resolveDistPath, walkHtml } from '../seo-lint/index';
import { isIndexable, routeFromDistFile } from '../seo-lint/routes';
import { routeUrl } from '../../lib/seo/url';

/** Remove generated `<url>` blocks whose exact loc is explicitly excluded. */
export function removeSitemapUrls(xml: string, excluded: ReadonlySet<string>): string {
  return xml.replace(/\s*<url>[^]*?<\/url>/g, (block) => {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    return loc && excluded.has(loc) ? '' : block;
  });
}

/**
 * Apply page-level noindex declarations to the generated sitemap. This runs
 * after `@astrojs/sitemap` and before seo-lint, so the validator checks the
 * exact XML that will ship.
 */
export default function sitemapOptOut(): AstroIntegration {
  let site: string | undefined;
  return {
    name: 'sitemap-opt-out',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
      },
      'astro:build:done': async ({ dir }) => {
        if (!site) return;
        const distPath = resolveDistPath(dir);
        const excluded = new Set<string>();
        for (const file of await walkHtml(distPath)) {
          if (isIndexable(await readFile(file, 'utf8'))) continue;
          excluded.add(routeUrl(routeFromDistFile(path.relative(distPath, file)), site));
        }
        if (excluded.size === 0) return;

        for (const sitemapFile of await findSitemaps(distPath)) {
          const xml = await readFile(sitemapFile, 'utf8');
          const filtered = removeSitemapUrls(xml, excluded);
          if (filtered !== xml) await writeFile(sitemapFile, filtered, 'utf8');
        }
      },
    },
  };
}
