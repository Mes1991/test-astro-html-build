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

  it('never removes a page whose marker is invalid, whatever the shape of the mistake', async () => {
    const dist = await mkdtemp(path.join(tmpdir(), 'sitemap-opt-out-invalid-'));
    await mkdir(path.join(dist, 'wrong-case'), { recursive: true });
    await mkdir(path.join(dist, 'duplicate'), { recursive: true });

    const wrongCaseHtml =
      '<html><head><meta name="robots" content="index, follow">' +
      '<meta name="sitemap" content="Exclude"></head></html>';
    const duplicateHtml =
      '<html><head><meta name="robots" content="index, follow">' +
      '<meta name="sitemap" content="exclude"><meta name="sitemap" content="exclude">' +
      '</head></html>';
    await writeFile(path.join(dist, 'wrong-case', 'index.html'), wrongCaseHtml);
    await writeFile(path.join(dist, 'duplicate', 'index.html'), duplicateHtml);
    await writeFile(
      path.join(dist, 'sitemap-0.xml'),
      '<urlset>' +
        `<url><loc>${SITE}/wrong-case/</loc></url>` +
        `<url><loc>${SITE}/duplicate/</loc></url>` +
        '</urlset>',
    );

    const integration = sitemapOptOut();
    await (integration.hooks['astro:config:done'] as Function)({ config: { site: SITE } });
    await (integration.hooks['astro:build:done'] as Function)({
      dir: pathToFileURL(dist + path.sep),
    });

    const xml = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8');
    expect(xml).toContain(`${SITE}/wrong-case/`);
    expect(xml).toContain(`${SITE}/duplicate/`);

    const pages: GeneratedPage[] = [
      { route: '/wrong-case/', html: wrongCaseHtml },
      { route: '/duplicate/', html: duplicateHtml },
    ];
    expect(
      lintSitemapDiscovery(parseSitemap(xml), pages, SITE).map((f) => f.code),
    ).toEqual(['SITEMAP_MARKER_INVALID', 'SITEMAP_MARKER_INVALID']);
  });

  it('keeps a URL whose only sitemap marker is inside nested templates', async () => {
    const dist = await mkdtemp(path.join(tmpdir(), 'sitemap-opt-out-nested-template-'));
    await mkdir(path.join(dist, 'nested-template'), { recursive: true });
    const html =
      '<html><head><template><template></template>' +
      '<meta name="sitemap" content="exclude"></template></head><body></body></html>';
    await writeFile(path.join(dist, 'nested-template', 'index.html'), html);
    await writeFile(
      path.join(dist, 'sitemap-0.xml'),
      `<urlset><url><loc>${SITE}/nested-template/</loc></url></urlset>`,
    );

    const integration = sitemapOptOut();
    await (integration.hooks['astro:config:done'] as Function)({ config: { site: SITE } });
    await (integration.hooks['astro:build:done'] as Function)({
      dir: pathToFileURL(dist + path.sep),
    });

    const xml = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8');
    expect(xml).toContain(`${SITE}/nested-template/`);
    expect(lintSitemapDiscovery(parseSitemap(xml), [{ route: '/nested-template/', html }], SITE))
      .toEqual([]);
  });
});
