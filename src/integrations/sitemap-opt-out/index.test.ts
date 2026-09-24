import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { lintSitemapDiscovery, parseSitemap, type GeneratedPage } from '../seo-lint/routes';
import sitemapOptOut, { removeSitemapUrls } from './index';

const SITE = 'https://example.com';

describe('sitemap page-level opt-out', () => {
  it('removes only URL blocks whose loc is excluded', () => {
    const xml =
      '<urlset>' +
      '<url><loc>https://example.com/kept/</loc></url>' +
      '<url><loc>https://example.com/private/</loc><changefreq>weekly</changefreq></url>' +
      '</urlset>';
    expect(removeSitemapUrls(xml, new Set(['https://example.com/private/']))).toBe(
      '<urlset><url><loc>https://example.com/kept/</loc></url></urlset>',
    );
  });

  it('removes a marked page but leaves an unmarked noindex page for the gate to reject', async () => {
    const dist = await mkdtemp(path.join(tmpdir(), 'sitemap-opt-out-'));
    await mkdir(path.join(dist, 'marked'), { recursive: true });
    await mkdir(path.join(dist, 'commented-marker'), { recursive: true });
    await mkdir(path.join(dist, 'unmarked-noindex'), { recursive: true });

    const markedHtml =
      '<html><head><meta name="robots" content="index, follow">' +
      '<meta content="exclude" name="sitemap"></head></html>';
    const unmarkedNoindexHtml =
      '<html><head><meta content="noindex, follow" name="robots"></head></html>';
    const commentedMarkerHtml =
      '<html><head><meta name="robots" content="index, follow">' +
      '<!-- <meta name="sitemap" content="exclude"> --></head></html>';
    await writeFile(path.join(dist, 'marked', 'index.html'), markedHtml);
    await writeFile(path.join(dist, 'commented-marker', 'index.html'), commentedMarkerHtml);
    await writeFile(path.join(dist, 'unmarked-noindex', 'index.html'), unmarkedNoindexHtml);
    await writeFile(
      path.join(dist, 'sitemap-0.xml'),
      '<urlset>' +
        `<url><loc>${SITE}/marked/</loc></url>` +
        `<url><loc>${SITE}/commented-marker/</loc></url>` +
        `<url><loc>${SITE}/unmarked-noindex/</loc></url>` +
        '</urlset>',
    );

    const integration = sitemapOptOut();
    await (integration.hooks['astro:config:done'] as Function)({ config: { site: SITE } });
    await (integration.hooks['astro:build:done'] as Function)({
      dir: pathToFileURL(dist + path.sep),
    });

    const xml = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8');
    expect(xml).not.toContain(`${SITE}/marked/`);
    expect(xml).toContain(`${SITE}/commented-marker/`);
    expect(xml).toContain(`${SITE}/unmarked-noindex/`);

    const pages: GeneratedPage[] = [
      { route: '/marked/', html: markedHtml },
      { route: '/commented-marker/', html: commentedMarkerHtml },
      { route: '/unmarked-noindex/', html: unmarkedNoindexHtml },
    ];
    expect(lintSitemapDiscovery(parseSitemap(xml), pages, SITE)).toEqual([
      expect.objectContaining({
        route: '/unmarked-noindex/',
        code: 'SITEMAP_NOINDEX_PAGE',
      }),
    ]);
  });
});
