import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import seoLint, { checkOgImage404, findSitemaps } from './index';
import { pathToFileURL } from 'node:url';

async function fixtureDist(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'seo-lint-og-'));
  await mkdir(path.join(dir, 'og'), { recursive: true });
  await writeFile(path.join(dir, 'og', 'home.png'), 'png-bytes');
  return dir;
}

describe('checkOgImage404', () => {
  it('fails when og:image points at a missing file in dist/', async () => {
    const dist = await fixtureDist();
    const html =
      '<meta property="og:image" content="https://example.com/og/sobre-nosotros.png">';
    const findings = await checkOgImage404(html, dist);
    expect(findings.some((f) => f.code === 'OG_IMAGE_404' && f.severity === 'fail')).toBe(true);
  });

  it('passes when og:image points at an existing file in dist/', async () => {
    const dist = await fixtureDist();
    const html = '<meta property="og:image" content="https://example.com/og/home.png">';
    const findings = await checkOgImage404(html, dist);
    expect(findings.length).toBe(0);
  });
});


describe('sitemap discovery and configured presence', () => {
  it('discovers a renamed URL-set sitemap, not its index or unrelated XML', async () => {
    const dist = await mkdtemp(path.join(tmpdir(), 'seo-sitemap-'));
    await writeFile(path.join(dist, 'urls-0.xml'), '<urlset><url><loc>https://example.com/</loc></url></urlset>');
    await writeFile(path.join(dist, 'urls-index.xml'), '<sitemapindex></sitemapindex>');
    await writeFile(path.join(dist, 'feed.xml'), '<rss></rss>');
    expect(await findSitemaps(dist)).toEqual([path.join(dist, 'urls-0.xml')]);
  });
  it('fails closed when sitemap integration is configured but has not emitted output', async () => {
    const integration = seoLint();
    const dist = await mkdtemp(path.join(tmpdir(), 'seo-sitemap-missing-'));
    const configHook = integration.hooks['astro:config:done'];
    if (configHook) await (configHook as Function)({config: { integrations: [{ name: '@astrojs/sitemap' }] }});
    const logger = { error() {}, warn() {}, info() {} };
    await expect((integration.hooks['astro:build:done'] as Function)({dir: pathToFileURL(dist + path.sep), logger})).rejects.toThrow('seo-lint: 1 failure');
  });
  it('does not require sitemap output when no sitemap integration is configured', async () => {
    const integration = seoLint();
    const dist = await mkdtemp(path.join(tmpdir(), 'seo-no-sitemap-'));
    const configHook = integration.hooks['astro:config:done'];
    if (configHook) await (configHook as Function)({config: { integrations: [] }});
    const logger = { error() {}, warn() {}, info() {} };
    await expect((integration.hooks['astro:build:done'] as Function)({dir: pathToFileURL(dist + path.sep), logger})).resolves.toBeUndefined();
  });
});
