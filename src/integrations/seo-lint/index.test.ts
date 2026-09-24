import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import seoLint, { checkOgImage404, findSitemaps, walkAssets } from './index';
import { pathToFileURL } from 'node:url';

const DEFAULT_ORIGIN = 'https://example.com';
const REBRANDED_ORIGIN = 'https://client.test';

const logger = { error() {}, warn() {}, info() {} };

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
    const findings = await checkOgImage404(html, dist, DEFAULT_ORIGIN);
    expect(findings.some((f) => f.code === 'OG_IMAGE_404' && f.severity === 'fail')).toBe(true);
  });

  it('passes when og:image points at an existing file in dist/', async () => {
    const dist = await fixtureDist();
    const html = '<meta property="og:image" content="https://example.com/og/home.png">';
    const findings = await checkOgImage404(html, dist, DEFAULT_ORIGIN);
    expect(findings.length).toBe(0);
  });
});

describe('walkAssets', () => {
  it('includes extensionless emitted files in the asset inventory', async () => {
    const dist = await mkdtemp(path.join(tmpdir(), 'seo-assets-'));
    await mkdir(path.join(dist, 'downloads'), { recursive: true });
    await writeFile(path.join(dist, 'downloads', 'NOTICE'), 'asset');

    expect(await walkAssets(dist)).toEqual(['/downloads/NOTICE']);
  });
});

async function rebrandFixture(ogImage = `${REBRANDED_ORIGIN}/og/home.png`): Promise<string> {
  const dist = await mkdtemp(path.join(tmpdir(), 'seo-rebrand-'));
  await mkdir(path.join(dist, 'fixture'), { recursive: true });
  await mkdir(path.join(dist, 'og'), { recursive: true });
  await writeFile(path.join(dist, 'og', 'home.png'), 'png-bytes');
  await writeFile(
    path.join(dist, 'fixture', 'index.html'),
    `<!doctype html><html lang="en"><head>` +
      `<title>A sufficiently descriptive fixture page title</title>` +
      `<meta name="description" content="A sufficiently descriptive fixture page description used to keep the SEO fixture free of warnings." />` +
      `<link rel="canonical" href="${REBRANDED_ORIGIN}/fixture/" />` +
      `<meta property="og:url" content="${REBRANDED_ORIGIN}/fixture/" />` +
      `<meta property="og:image" content="${ogImage}" />` +
      `</head><body><h1>Fixture</h1></body></html>`,
  );
  await writeFile(
    path.join(dist, 'sitemap-0.xml'),
    `<urlset><url><loc>${REBRANDED_ORIGIN}/fixture/</loc></url></urlset>`,
  );
  return dist;
}

async function configure(integration: ReturnType<typeof seoLint>, site?: string): Promise<void> {
  const configHook = integration.hooks['astro:config:done'];
  if (configHook) {
    await (configHook as Function)({
      config: { site, integrations: [{ name: '@astrojs/sitemap' }] },
    });
  }
}

describe('resolved site origin', () => {
  it('accepts a rebranded build and uses config.site for sitemap and OG checks', async () => {
    const integration = seoLint({ expectedOrigin: REBRANDED_ORIGIN });
    const dist = await rebrandFixture();
    await configure(integration, REBRANDED_ORIGIN);

    await expect(
      (integration.hooks['astro:build:done'] as Function)({
        dir: pathToFileURL(dist + path.sep),
        logger,
      }),
    ).resolves.toBeUndefined();
  });

  it('keeps the OG image gate active after a rebrand', async () => {
    const integration = seoLint({ expectedOrigin: REBRANDED_ORIGIN });
    const dist = await rebrandFixture(`${REBRANDED_ORIGIN}/og/missing.png`);
    const errors: string[] = [];
    const recordingLogger = { ...logger, error(message: string) { errors.push(message); } };
    await configure(integration, REBRANDED_ORIGIN);

    await expect(
      (integration.hooks['astro:build:done'] as Function)({
        dir: pathToFileURL(dist + path.sep),
        logger: recordingLogger,
      }),
    ).rejects.toThrow('seo-lint: 1 failure');
    expect(errors).toContainEqual(expect.stringContaining('[OG_IMAGE_404]'));
  });

  it('rejects a config.site origin that differs from the canonical source', async () => {
    const integration = seoLint({ expectedOrigin: REBRANDED_ORIGIN });

    await expect(configure(integration, DEFAULT_ORIGIN)).rejects.toThrow(
      /seo-lint:.*https:\/\/example\.com.*https:\/\/client\.test/,
    );
  });

  it('rejects a missing config.site', async () => {
    await expect(configure(seoLint({ expectedOrigin: DEFAULT_ORIGIN }))).rejects.toThrow(
      /seo-lint:.*site.*required/i,
    );
  });

  it.each([
    'https://example.com/subpath',
    'https://example.com/?preview=true',
    'https://example.com/#preview',
  ])('rejects config.site that is not a bare origin: %s', async (site) => {
    await expect(
      configure(seoLint({ expectedOrigin: DEFAULT_ORIGIN }), site),
    ).rejects.toThrow(/seo-lint:.*bare origin/i);
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
    const integration = seoLint({ expectedOrigin: DEFAULT_ORIGIN });
    const dist = await mkdtemp(path.join(tmpdir(), 'seo-sitemap-missing-'));
    const configHook = integration.hooks['astro:config:done'];
    if (configHook) await (configHook as Function)({config: { site: DEFAULT_ORIGIN, integrations: [{ name: '@astrojs/sitemap' }] }});
    await expect((integration.hooks['astro:build:done'] as Function)({dir: pathToFileURL(dist + path.sep), logger})).rejects.toThrow('seo-lint: 1 failure');
  });
  it('does not require sitemap output when no sitemap integration is configured', async () => {
    const integration = seoLint({ expectedOrigin: DEFAULT_ORIGIN });
    const dist = await mkdtemp(path.join(tmpdir(), 'seo-no-sitemap-'));
    const configHook = integration.hooks['astro:config:done'];
    if (configHook) await (configHook as Function)({config: { site: DEFAULT_ORIGIN, integrations: [] }});
    await expect((integration.hooks['astro:build:done'] as Function)({dir: pathToFileURL(dist + path.sep), logger})).resolves.toBeUndefined();
  });
});
