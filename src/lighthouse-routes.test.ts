import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES } from './lib/seo/types';
import { pathFor, postPathFor } from './lib/seo/locale';

/**
 * Route-existence check for the Lighthouse budgets (R-01).
 *
 * Derives the canonical route set straight from source — the same route
 * helpers `astro.config.mjs` and the pages use (`pathFor`/`postPathFor`) plus
 * the blog content collection's own frontmatter — so this does not depend on
 * a prior `bun run build`. Both `lighthouserc.json` and
 * `lighthouserc.mobile.json` must audit exactly this set, in the directory
 * build's `.../index.html` form, and nothing else (no 404s, no stale slugs).
 *
 * Deliberately excludes `coming-soon` and `404`: neither is a real,
 * navigable content page (the former is a holding page gated behind an env
 * var, the latter is an error page and both are excluded from the sitemap by
 * `astro.config.mjs`'s own `EXCLUDED` filter), so neither belongs in a
 * performance/SEO budget.
 */

const ROOT_DIR = join(__dirname, '..');
const BLOG_CONTENT_DIR = join(ROOT_DIR, 'src', 'content', 'blog');
const BASE_URL = 'http://localhost:4321';

interface BlogFrontmatter {
  slug: string;
  draft: boolean;
}

function readBlogFrontmatter(): BlogFrontmatter[] {
  const posts: BlogFrontmatter[] = [];
  for (const file of readdirSync(BLOG_CONTENT_DIR)) {
    if (!file.endsWith('.md')) continue;
    const content = readFileSync(join(BLOG_CONTENT_DIR, file), 'utf-8').replace(/\r\n/g, '\n');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) throw new Error(`${file}: no frontmatter block found`);
    const slugMatch = frontmatter[1].match(/^slug:\s*(.+)$/m);
    if (!slugMatch) throw new Error(`${file}: no top-level "slug" field found`);
    const draftMatch = frontmatter[1].match(/^draft:\s*(true|false)$/m);
    posts.push({
      slug: slugMatch[1].trim(),
      draft: draftMatch ? draftMatch[1] === 'true' : false, // schema default is false
    });
  }
  return posts;
}

/** Every canonical, trailing-slash route the build emits, in Lighthouse's `.../index.html` URL form. */
function expectedAuditUrls(): string[] {
  const paths: string[] = [];
  for (const locale of LOCALES) {
    paths.push(pathFor('home', locale));
    paths.push(pathFor('blog', locale));
  }
  for (const post of readBlogFrontmatter()) {
    if (post.draft) continue;
    for (const locale of LOCALES) {
      paths.push(postPathFor(post.slug, locale));
    }
  }
  return paths.map((path) => `${BASE_URL}${path}index.html`).sort();
}

function configUrls(configFile: string): string[] {
  const config = JSON.parse(readFileSync(join(ROOT_DIR, configFile), 'utf-8'));
  const urls: string[] = config.ci.collect.url;
  return [...urls].sort();
}

describe('Lighthouse configs audit only routes the build emits (R-01)', () => {
  it('at least one blog post and both locales are covered by the derivation itself', () => {
    // Guards the derivation against silently deriving an empty/trivial set.
    const urls = expectedAuditUrls();
    expect(urls.length).toBeGreaterThanOrEqual(6); // home + blog index + >=1 post, x2 locales
    expect(urls).toContain(`${BASE_URL}/es/index.html`);
    expect(urls).toContain(`${BASE_URL}/es/blog/index.html`);
  });

  it('lighthouserc.json lists exactly the emitted canonical routes', () => {
    expect(configUrls('lighthouserc.json')).toEqual(expectedAuditUrls());
  });

  it('lighthouserc.mobile.json lists exactly the emitted canonical routes', () => {
    expect(configUrls('lighthouserc.mobile.json')).toEqual(expectedAuditUrls());
  });
});
