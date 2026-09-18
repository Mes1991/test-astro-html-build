import type { AstroIntegration } from 'astro';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintHtml, type Finding } from './lint';

const SITE_ORIGIN = 'https://example.com';

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
export async function checkOgImage404(html: string, distPath: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (!ogMatch) return findings;
  const url = ogMatch[1];
  let assetPath: string | null = null;
  if (url.startsWith(`${SITE_ORIGIN}/`)) {
    assetPath = url.slice(SITE_ORIGIN.length);
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

export interface SeoLintOptions {
  /** Throw on `fail`-severity findings. Defaults to true. */
  failOnError?: boolean;
}

export default function seoLint(options: SeoLintOptions = {}): AstroIntegration {
  const failOnError = options.failOnError ?? true;
  return {
    name: 'seo-lint',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distPath = resolveDistPath(dir);
        const htmlFiles = await walkHtml(distPath);

        const reports: PageReport[] = [];
        for (const file of htmlFiles) {
          const html = await readFile(file, 'utf8');
          const findings = lintHtml(html);
          findings.push(...(await checkOgImage404(html, distPath)));
          if (findings.length > 0) {
            reports.push({ page: path.relative(distPath, file), findings });
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
