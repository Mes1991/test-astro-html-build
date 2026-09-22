import type { AstroIntegration } from 'astro';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteSeo } from '../../lib/seo/defaults';
import { lintHtml, type Finding } from './lint';
import {
  lintLocaleRoutes,
  lintLocalizedRouteCoverage,
  lintSitemapRoutes,
  parseSitemap,
  routeFromDistFile,
  type GeneratedPage,
} from './routes';

/** True if the file exists at `full`. */
async function fileExists(full: string): Promise<boolean> {
  try {
    const s = await stat(full);
    return s.isFile();
  } catch {
    return false;
  }
}

/**
 * For each og:image whose URL points at our origin, verify the file actually
 * exists in the build output. Catches OG manifest/page-slug mismatches that
 * the pure linter can't see. Exported for tests.
 */
export async function checkOgImage404(
  html: string,
  distPath: string,
  origin: string,
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (!ogMatch) return findings;
  const url = ogMatch[1];
  let assetPath: string | null = null;
  if (url.startsWith(`${origin}/`)) {
    assetPath = url.slice(origin.length);
  } else if (url.startsWith('/')) {
    assetPath = url;
  }
  if (!assetPath) return findings;
  // Strip query/fragment if any.
  assetPath = assetPath.split('?')[0].split('#')[0];
  const full = path.join(distPath, assetPath.replace(/^\//, ''));
  if (!(await fileExists(full))) {
    findings.push({
      code: 'OG_IMAGE_404',
      severity: 'fail',
      message: `og:image points at ${url}, but ${assetPath} is missing in dist/.`,
    });
  }
  return findings;
}

interface PageReport {
  page: string;
  findings: Finding[];
}

/**
 * Convert the build-output directory URL that Astro hands to `astro:build:done`
 * into a real filesystem path.
 *
 * `URL.pathname` must never be used for this: it stays percent-encoded (so any
 * path containing a space resolves to a non-existent `%20` directory) and on
 * Windows it keeps a leading slash in front of the drive letter (`/C:/...`).
 * `fileURLToPath` is the standard Node API that handles both, on every platform.
 *
 * Exported for tests.
 */
export function resolveDistPath(dir: URL): string {
  return fileURLToPath(dir);
}

/** Recursively collect every `.html` file under `dir`. Exported for tests. */
export async function walkHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkHtml(full)));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Every non-HTML file the build emitted, as the path it is served at
 * (`/og/home.png`, `/draco/draco_decoder.wasm`). This is what lets the route
 * gates classify a link or a sitemap entry by what actually exists rather than
 * by guessing from the last path segment. Exported for tests.
 */
export async function walkAssets(dir: string, root: string = dir): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkAssets(full, root)));
    } else if (e.isFile() && !e.name.endsWith('.html')) {
      out.push(`/${path.relative(root, full).split(path.sep).join('/')}`);
    }
  }
  return out;
}

/**
 * Collect the URL-set sitemaps `@astrojs/sitemap` wrote at the root of `dist`.
 * The index file only points at these, so it carries no `<url>` entries itself.
 * Exported for tests.
 */
export async function findSitemaps(distPath: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(distPath, { withFileTypes: true })) {
    if (!e.isFile() || !e.name.endsWith('.xml')) continue;
    // Discover by emitted URL-set content, not a configurable filenameBase.
    if (/<urlset\b/.test(await readFile(path.join(distPath, e.name), 'utf8'))) {
      out.push(path.join(distPath, e.name));
    }
  }
  return out.sort();
}

export interface SeoLintOptions {
  /** Throw on `fail`-severity findings. Defaults to true. */
  failOnError?: boolean;
  /** Canonical source used only to detect config divergence. Defaults to siteSeo.siteUrl. */
  expectedOrigin?: string;
}

export default function seoLint(options: SeoLintOptions = {}): AstroIntegration {
  const failOnError = options.failOnError ?? true;
  const expectedOrigin = options.expectedOrigin ?? siteSeo.siteUrl;
  let sitemapExpected = false;
  let siteOrigin: string | undefined;
  return {
    name: 'seo-lint',
    hooks: {
      'astro:config:done': ({ config }) => {
        const configuredSite = config.site?.trim();
        if (!configuredSite) {
          throw new Error(
            'seo-lint: Astro config `site` is required for canonical, sitemap, and OG URLs.',
          );
        }

        let configuredUrl: URL;
        try {
          configuredUrl = new URL(configuredSite);
        } catch {
          throw new Error(
            `seo-lint: Astro config \`site\` must be a valid bare origin; received "${configuredSite}".`,
          );
        }
        if (configuredUrl.pathname !== '/' || configuredUrl.search || configuredUrl.hash) {
          throw new Error(
            `seo-lint: Astro config \`site\` must be a bare origin without a path, query, or hash; received "${configuredSite}".`,
          );
        }

        let expectedUrl: URL;
        try {
          expectedUrl = new URL(expectedOrigin);
        } catch {
          throw new Error(`seo-lint: siteSeo.siteUrl must be a valid URL; received "${expectedOrigin}".`);
        }
        if (configuredUrl.origin !== expectedUrl.origin) {
          throw new Error(
            `seo-lint: Astro config \`site\` origin "${configuredUrl.origin}" differs from siteSeo.siteUrl origin "${expectedUrl.origin}".`,
          );
        }

        siteOrigin = configuredUrl.origin;
        sitemapExpected = config.integrations.some((integration) => integration.name === '@astrojs/sitemap');
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!siteOrigin) {
          throw new Error(
            'seo-lint: Astro config `site` is required for canonical, sitemap, and OG URLs.',
          );
        }
        const distPath = resolveDistPath(dir);
        const htmlFiles = await walkHtml(distPath);
        const emittedFiles = new Set(await walkAssets(distPath));

        const reports: PageReport[] = [];
        const pages: GeneratedPage[] = [];
        for (const file of htmlFiles) {
          const html = await readFile(file, 'utf8');
          const rel = path.relative(distPath, file);
          pages.push({ route: routeFromDistFile(rel), html });
          const findings = lintHtml(html);
          findings.push(...(await checkOgImage404(html, distPath, siteOrigin)));
          if (findings.length > 0) {
            reports.push({ page: rel, findings });
          }
        }

        // Route-level gates: these need the whole build output, not one page.
        for (const f of [
          ...lintLocaleRoutes(pages, emittedFiles, siteOrigin),
          ...lintLocalizedRouteCoverage(pages, siteOrigin),
        ]) {
          reports.push({ page: f.route, findings: [f] });
        }
        const sitemapFiles = await findSitemaps(distPath);
        // A sitemap-free site is legitimate. When configured, however, missing
        // output (including wrong hook order) must not silently bypass gates.
        if (sitemapFiles.length === 0) reports.push({ page: 'sitemap', findings: [{
          code: 'SITEMAP_OUTPUT_MISSING',
          severity: sitemapExpected ? 'fail' : 'warn',
          message: sitemapExpected
            ? '@astrojs/sitemap is configured but no URL-set sitemap was emitted. Place seoLint() after sitemap() and check sitemap generation.'
            : 'No URL-set sitemap emitted; sitemap integration is not configured.',
        }] });
        for (const sitemapFile of sitemapFiles) {
          const entries = parseSitemap(await readFile(sitemapFile, 'utf8'));
          for (const f of lintSitemapRoutes(entries, pages, siteOrigin, emittedFiles)) {
            reports.push({ page: `${path.relative(distPath, sitemapFile)} → ${f.route}`, findings: [f] });
          }
        }

        let failCount = 0;
        let warnCount = 0;

        for (const report of reports) {
          for (const f of report.findings) {
            const tag = f.severity === 'fail' ? '✗' : '⚠';
            const msg = `${tag} [${f.code}] ${report.page}: ${f.message}`;
            if (f.severity === 'fail') {
              failCount++;
              logger.error(msg);
            } else {
              warnCount++;
              logger.warn(msg);
            }
          }
        }

        if (failCount > 0) {
          const summary = `seo-lint: ${failCount} failure(s), ${warnCount} warning(s) across ${htmlFiles.length} pages.`;
          if (failOnError) {
            throw new Error(summary);
          } else {
            logger.error(summary);
          }
        } else if (warnCount > 0) {
          logger.warn(`seo-lint: ${warnCount} warning(s) across ${htmlFiles.length} pages.`);
        } else {
          logger.info(`seo-lint: clean (${htmlFiles.length} pages checked).`);
        }
      },
    },
  };
}
