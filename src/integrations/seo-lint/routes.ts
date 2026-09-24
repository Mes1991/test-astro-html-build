import { isAssetPath, publicPath, routePath } from '../../lib/seo/url';
import { localeOfRoute, pathFor } from '../../lib/seo/locale';
import { LOCALES, DEFAULT_LOCALE, type LocaleCode } from '../../lib/seo/types';
import { exactPath, isCanonicalForm, routeKeyForUrl, sitemapPath } from '../../lib/seo/sitemap';
import { langMatches, type Finding } from './lint';
import { parse, parseFragment, type DefaultTreeAdapterTypes } from 'parse5';

/**
 * Route-level SEO gates.
 *
 * `lintHtml` sees one page at a time and cannot answer questions that only
 * exist across the whole build output — which is exactly where Astro's i18n
 * `fallback` bites. With `fallbackType: 'rewrite'`, every page that exists in
 * the default locale but not in `es` is still emitted at `/es/<slug>/`, holding
 * the English content (documented Astro behaviour, not a bug). Left alone that
 * page is indexable, declares `lang="en"` under a Spanish URL, and — unless its
 * path happens to sit in the sitemap `filter` exclusion list — is published as
 * its own `<loc>` while canonicalising somewhere else.
 *
 * These checks run against the real build output, over every generated route.
 *
 * ## Sitemap contract
 *
 * This sitemap publishes **HTML page routes only**. Non-page resources (OG
 * images, API endpoints) are excluded in the `sitemap()` `filter` in
 * `astro.config.mjs`. `SITEMAP_NON_HTML_ENTRY` enforces that contract
 * explicitly, so a feed or PDF added later fails with a message naming the
 * decision to make rather than with a confusing "no page emitted".
 * To publish non-page resources, extend the contract here deliberately —
 * `@astrojs/sitemap` also offers `customPages` and `customSitemaps` for URLs
 * this build does not emit.
 */

/** A page as it was emitted into `dist/`. */
export interface GeneratedPage {
  /** The route as served, e.g. `/`, `/es/`, `/es/blog/`, `/404`. */
  route: string;
  html: string;
}

/** One `<url>` block parsed out of a generated sitemap. */
export interface SitemapEntry {
  loc: string;
  alternates: { lang: string; href: string }[];
}

/** A finding bound to the route it was found on. */
export interface RouteFinding extends Finding {
  route: string;
}

type DocumentNode = DefaultTreeAdapterTypes.Document;
type ParentNode = DefaultTreeAdapterTypes.ParentNode;
type ElementNode = DefaultTreeAdapterTypes.Element;
type Node = DefaultTreeAdapterTypes.Node;

const documentCache = new Map<string, DocumentNode>();
const DOCUMENT_CACHE_LIMIT = 32;

function parsedDocument(html: string): DocumentNode {
  const cached = documentCache.get(html);
  if (cached) {
    documentCache.delete(html);
    documentCache.set(html, cached);
    return cached;
  }

  const document = parse(html);
  documentCache.set(html, document);
  if (documentCache.size > DOCUMENT_CACHE_LIMIT) {
    documentCache.delete(documentCache.keys().next().value!);
  }
  return document;
}

function isElement(node: Node): node is ElementNode {
  return 'tagName' in node;
}

function elementsIn(root: ParentNode): ElementNode[] {
  const elements: ElementNode[] = [];
  const visit = (parent: ParentNode): void => {
    for (const child of parent.childNodes) {
      if (!isElement(child)) continue;
      elements.push(child);
      // parse5 stores a template's contents in a separate DocumentFragment.
      // Its childNodes therefore represent only effective DOM descendants.
      visit(child);
    }
  };
  visit(root);
  return elements;
}

function attributesOf(element: ElementNode): ReadonlyMap<string, string> {
  return new Map(element.attrs.map(({ name, value }) => [name, value]));
}

function hasAncestor(element: ElementNode, tagName: string): boolean {
  let parent = element.parentNode;
  while (parent) {
    if (isElement(parent) && parent.tagName === tagName) return true;
    parent = 'parentNode' in parent ? parent.parentNode : null;
  }
  return false;
}

function documentElements(html: string, tagName?: string): ElementNode[] {
  return elementsIn(parsedDocument(html)).filter((element) => !tagName || element.tagName === tagName);
}

function headElements(html: string, tagName: string): ElementNode[] {
  return documentElements(html, tagName).filter((element) => hasAncestor(element, 'head'));
}

function textContent(node: ParentNode): string {
  let text = '';
  for (const child of node.childNodes) {
    if (child.nodeName === '#text' && 'value' in child) text += child.value;
    else if (isElement(child)) text += textContent(child);
  }
  return text;
}

/**
 * Turn a `dist`-relative file path into the route it is served at.
 * Accepts either path separator, so Windows build output resolves the same way.
 */
export function routeFromDistFile(relPath: string): string {
  const posix = relPath.replace(/\\/g, '/');
  if (posix === 'index.html') return '/';
  if (posix.endsWith('/index.html')) return `/${posix.slice(0, -'index.html'.length)}`;
  return `/${posix.replace(/\.html$/, '')}`;
}

/** The `lang` attribute on `<html>`, or null when absent. */
export function declaredLang(html: string): string | null {
  const root = documentElements(html, 'html')[0];
  return root ? attributesOf(root).get('lang')?.trim() ?? null : null;
}

/** The `href` of `<link rel="canonical">`, or null when absent. */
export function declaredCanonical(html: string): string | null {
  const tag = headElements(html, 'link').find(
    (element) => attributesOf(element).get('rel')?.toLowerCase() === 'canonical',
  );
  return tag ? attributesOf(tag).get('href')?.trim() ?? null : null;
}

/** The `content` of `<meta property="og:url">`, or null when absent. */
export function declaredOgUrl(html: string): string | null {
  const tag = headElements(html, 'meta').find(
    (element) => attributesOf(element).get('property')?.toLowerCase() === 'og:url',
  );
  return tag ? attributesOf(tag).get('content')?.trim() ?? null : null;
}

/**
 * Every site-relative link target in the page body, query and fragment removed.
 * Skips anchors, protocol-relative and absolute URLs, `mailto:` and `tel:`.
 *
 * Classification into "route" and "asset" deliberately does NOT happen here —
 * see `isRouteLink`. This function only reports what the page links to.
 */
export function internalRouteLinks(html: string): string[] {
  const out = new Set<string>();
  for (const element of documentElements(html, 'a')) {
    const href = (attributesOf(element).get('href') ?? '').trim();
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const path = href.split('?')[0].split('#')[0];
    if (path === '') continue;
    out.add(path);
  }
  return [...out];
}

/**
 * Decide whether a link target is a directory route subject to the canonical
 * trailing-slash form.
 *
 * Emitted artifacts decide first, because they are ground truth: a page the
 * build emitted is a route even when its slug looks like a file name
 * (`/blog/whitepaper.pdf/`), and a file the build emitted is a file even when
 * its name does not. Only for a target this build emitted neither way does the
 * extension heuristic apply, and that residual case is recorded as a deferred
 * finding rather than guessed at more cleverly.
 */
export function isRouteLink(
  path: string,
  emittedRoutes: ReadonlySet<string>,
  emittedFiles: ReadonlySet<string>,
): boolean {
  if (new Set([...emittedFiles].map(publicPath)).has(publicPath(path))) return false;
  if (emittedRoutes.has(publicPath(routePath(path)))) return true;
  return !isAssetPath(path);
}

/** One `hreflang` alternate declared in a page's own head. */
export interface PageAlternate {
  lang: string;
  href: string;
}

/**
 * Every `hreflang` alternate declared in the page's own head, with its target.
 *
 * Both fields matter: counting tags is not evidence of bilingual coverage. An
 * empty `hreflang`, a missing `href`, or an `href` pointing at the wrong page
 * all look identical to a length check, and would silently switch the coverage
 * gate off. `rel="alternate"` links without an `hreflang` attribute (RSS feeds,
 * stylesheets) are not hreflang alternates and are skipped.
 */
export function declaredAlternates(html: string): PageAlternate[] {
  const out: PageAlternate[] = [];
  for (const element of headElements(html, 'link')) {
    const attributes = attributesOf(element);
    if (attributes.get('rel')?.toLowerCase() !== 'alternate' || !attributes.has('hreflang')) continue;
    out.push({
      lang: attributes.get('hreflang')?.trim() ?? '',
      href: attributes.get('href')?.trim() ?? '',
    });
  }
  return out;
}

/** Validate every declaration, never just a count or the first matching link. */
export function alternateProblems(
  alternates: PageAlternate[],
  expected: ReadonlyMap<string, string>,
  emitted: ReadonlySet<string>,
  site?: string,
): string[] {
  const problems: string[] = [];
  const locales = [...expected.keys()];
  const exact = (tag: string, locale: string) => tag.toLowerCase() === locale.toLowerCase();
  // A regional tag (`es-MX`) covers a bare locale (`es`) only when no configured
  // locale names it exactly, so `es-ES` and `es-MX` stay distinct locales.
  const covers = (tag: string, locale: string) =>
    exact(tag, locale) ||
    (locale !== 'x-default' && !locale.includes('-') && langMatches(tag, locale) &&
      !locales.some((other) => exact(tag, other)));
  for (const alt of alternates) {
    if (!alt.lang) problems.push('alternate declares no hreflang');
    else if (!locales.some((locale) => covers(alt.lang, locale))) {
      problems.push(`unexpected hreflang="${alt.lang}"`);
    }
  }
  for (const [locale, expectedRoute] of expected) {
    const matches = alternates.filter((a) => covers(a.lang, locale));
    if (matches.length === 0) { problems.push(`no hreflang="${locale}"`); continue; }
    if (matches.length > 1) { problems.push(`${matches.length} hreflang="${locale}" entries — exactly one is required`); continue; }
    const alt = matches[0];
    if (!alt.href) { problems.push(`hreflang="${locale}" declares no href`); continue; }
    const target = routePath(exactPath(alt.href, site));
    if (!emitted.has(target)) { problems.push(`hreflang="${locale}" points at ${alt.href}, which the build never emitted`); continue; }
    if (target !== expectedRoute) problems.push(`hreflang="${locale}" points at ${alt.href} instead of ${expectedRoute}`);
  }
  return problems;
}

/**
 * False when any robots meta carries `noindex`. Conflicting robots tags resolve
 * to the most restrictive value, which is how search engines read them too.
 */
export function isIndexable(html: string): boolean {
  const directives = headElements(html, 'meta')
    .map(attributesOf)
    .filter((attributes) => attributes.get('name')?.toLowerCase() === 'robots')
    .map((attributes) => attributes.get('content') ?? '');
  return !directives.some((content) => /\bnoindex\b/i.test(content));
}

/** `sitemapMarkerState`'s three outcomes. */
export type SitemapMarkerState = 'none' | 'valid' | 'invalid';

/**
 * Classify the page's `meta[name="sitemap"]` declaration(s).
 *
 * `meta[name="sitemap"]` is a private, template-internal signal: search
 * engines assign it no meaning of their own. It exists only so that
 * `sitemap-opt-out` (which removes a page from the generated sitemap) and
 * `seo-lint` (which checks that removal actually happened) agree on which
 * pages are intentionally left out of sitemap discovery. Robots/noindex
 * remain the only real indexing directive.
 *
 * A "sitemap declaration" is detected loosely — any `<meta>` whose `name`
 * value trim+lower-cases to `sitemap` — so a typo is caught as `invalid`
 * rather than silently ignored as `none`. Only one shape is `valid`: exactly
 * one such declaration in the whole document, sitting inside `<head>`, whose
 * `name` is exactly `sitemap` and whose `content` is exactly `exclude` once
 * entities are decoded — no trimming, no case folding on either value. The
 * only variation HTML itself normalises away (attribute-name case, attribute
 * order, quote style, an entity that decodes to exactly `exclude`) is
 * tolerated. Everything else that is not `none` — wrong case, a trailing
 * space, `content=""` or a missing `content`, a duplicate, a contradiction
 * (`exclude` alongside `include`), or a declaration outside `<head>` — is
 * `invalid`, and an invalid marker must never activate exclusion.
 */
function analyzeSitemapMarker(html: string): { state: SitemapMarkerState; reason?: string } {
  const isDeclaration = (attributes: ReadonlyMap<string, string>): boolean =>
    (attributes.get('name') ?? '').trim().toLowerCase() === 'sitemap';

  const wholeDocument = documentElements(html, 'meta')
    .map((element) => ({ element, attributes: attributesOf(element) }))
    .filter(({ attributes }) => isDeclaration(attributes));
  if (wholeDocument.length === 0) return { state: 'none' };

  const inHead = wholeDocument.filter(({ element }) => hasAncestor(element, 'head'));

  if (wholeDocument.length > 1) {
    return {
      state: 'invalid',
      reason:
        inHead.length === wholeDocument.length
          ? `${wholeDocument.length} sitemap declarations found — exactly one is allowed`
          : `${wholeDocument.length} sitemap declarations found, at least one outside <head>`,
    };
  }
  if (inHead.length !== 1) {
    return { state: 'invalid', reason: 'the declaration sits outside <head>' };
  }

  const { attributes } = inHead[0];
  if (attributes.get('name') !== 'sitemap' || attributes.get('content') !== 'exclude') {
    return {
      state: 'invalid',
      reason:
        `name="${attributes.get('name') ?? ''}" content="${attributes.get('content') ?? ''}" ` +
        'is not the exact required form',
    };
  }
  return { state: 'valid' };
}

/** `'none' | 'valid' | 'invalid'` — see `analyzeSitemapMarker` for the exact rule. */
export function sitemapMarkerState(html: string): SitemapMarkerState {
  return analyzeSitemapMarker(html).state;
}

/** True when the page head declares a valid sitemap exclusion marker. */
export function isSitemapExcluded(html: string): boolean {
  return sitemapMarkerState(html) === 'valid';
}

/** Parse the `<url>` entries — loc plus hreflang alternates — out of a sitemap. */
export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const fragment = parseFragment(xml);
  for (const url of elementsIn(fragment).filter((element) => element.tagName === 'url')) {
    const descendants = elementsIn(url);
    const loc = descendants.find((element) => element.tagName === 'loc');
    const locValue = loc ? textContent(loc).trim() : '';
    if (!locValue) continue;
    const alternates = descendants
      .filter((element) => element.tagName === 'xhtml:link')
      .flatMap((element) => {
        const attributes = attributesOf(element);
        return attributes.has('hreflang')
          ? [{
              lang: attributes.get('hreflang')?.trim() ?? '',
              href: attributes.get('href')?.trim() ?? '',
            }]
          : [];
      });
    entries.push({ loc: locValue, alternates });
  }
  return entries;
}

/** Strip the locale prefix from a route, so the same page across locales groups together. */
function localeAgnosticKey(route: string): string {
  const normalized = publicPath(routePath(route));
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (normalized === `/${locale}/`) return '/';
    if (normalized.startsWith(`/${locale}/`)) return `/${normalized.slice(locale.length + 2)}`;
  }
  return normalized;
}

/**
 * Page-level gates that need the route, not just the HTML:
 *  - an indexable route must be written in the language its URL advertises
 *    (the gate that catches an i18n fallback page shipped as-is);
 *  - a canonical must be published in this site's canonical URL form;
 *  - `og:url` must agree with the canonical.
 */
export function lintLocaleRoutes(
  pages: GeneratedPage[],
  emittedFiles: ReadonlySet<string> = new Set(),
  site?: string,
): RouteFinding[] {
  const findings: RouteFinding[] = [];
  const emittedRoutes = new Set(pages.map((p) => publicPath(routePath(p.route))));

  for (const page of pages) {
    const canonical = declaredCanonical(page.html);
    const canonicalIsEmittedRoute =
      canonical !== null && emittedRoutes.has(routePath(exactPath(canonical, site)));
    const canonicalWrongForm = canonicalIsEmittedRoute
      ? exactPath(canonical!, site) !== routePath(exactPath(canonical!, site))
      : canonical !== null && !isCanonicalForm(canonical, site);
    if (canonical && canonicalWrongForm) {
      findings.push({
        route: page.route,
        code: 'CANONICAL_NOT_CANONICAL_FORM',
        severity: 'fail',
        message: `Canonical ${canonical} is not in this site's canonical URL form (directory routes end in a trailing slash).`,
      });
    }

    const ogUrl = declaredOgUrl(page.html);
    if (canonical && ogUrl && exactPath(ogUrl, site) !== exactPath(canonical, site)) {
      findings.push({
        route: page.route,
        code: 'OG_URL_CANONICAL_MISMATCH',
        severity: 'fail',
        message: `og:url is ${ogUrl} but the canonical is ${canonical}.`,
      });
    }

    // Google asks for the chosen URL form to be linked consistently, not just
    // declared. Three components used to build post links by hand and emitted
    // the slashless form while the canonical used the other one.
    for (const href of internalRouteLinks(page.html)) {
      if (!isRouteLink(href, emittedRoutes, emittedFiles)) continue;
      if (href !== routePath(href)) {
        findings.push({
          route: page.route,
          code: 'INTERNAL_LINK_NOT_CANONICAL_FORM',
          severity: 'fail',
          message: `Internal link to ${href} is not in this site's canonical URL form (expected ${routePath(href)}).`,
        });
      }
    }

    if (!isIndexable(page.html)) continue;

    const expected = localeOfRoute(page.route);
    const declared = declaredLang(page.html);
    if (!declared) {
      findings.push({
        route: page.route,
        code: 'HTML_LANG_MISSING',
        severity: 'fail',
        message: 'No lang attribute on <html>.',
      });
      continue;
    }
    if (!langMatches(declared, expected)) {
      findings.push({
        route: page.route,
        code: 'LOCALE_CONTENT_MISMATCH',
        severity: 'fail',
        message:
          `Indexable page declares lang="${declared}" but its URL is in the "${expected}" locale. ` +
          'An i18n fallback page must either be translated or marked noindex.',
      });
    }
  }

  return findings;
}

/**
 * A route emitted as a real translation in more than one locale must advertise
 * its complete reciprocal hreflang set in its own head. A registry entry is
 * producer input, not proof that the emitted HTML contains correct alternates.
 *
 * This is deliberately driven by the emitted output rather than by `ROUTE_KEYS`,
 * because a test that only walks the registry cannot catch a page someone forgot
 * to register: the generator and the validator would agree on the same omission.
 */
export function lintLocalizedRouteCoverage(pages: GeneratedPage[], site?: string): RouteFinding[] {
  const emitted = new Set(pages.map((p) => publicPath(routePath(p.route))));

  const groups = new Map<string, GeneratedPage[]>();
  for (const page of pages) {
    if (!isIndexable(page.html)) continue;
    const key = localeAgnosticKey(page.route);
    groups.set(key, [...(groups.get(key) ?? []), page]);
  }

  const findings: RouteFinding[] = [];
  for (const [, members] of groups) {
    const routeByLocale = new Map<LocaleCode, string>();
    for (const m of members) routeByLocale.set(localeOfRoute(m.route), publicPath(routePath(m.route)));
    if (routeByLocale.size < 2) continue;

    for (const page of members) {
      const expected = new Map<string, string>(routeByLocale);
      // Registered routes and emitted bilingual pages require the same full set.
      const alternates = declaredAlternates(page.html);
      if (routeKeyForUrl(page.route, site) || alternates.some((a) => a.lang === 'x-default')) {
        expected.set('x-default', routeByLocale.get(DEFAULT_LOCALE)!);
      }
      const problems = alternateProblems(alternates, expected, emitted, site);

      if (problems.length > 0) {
        findings.push({
          route: page.route,
          code: 'LOCALIZED_ROUTE_WITHOUT_ALTERNATES',
          severity: 'fail',
          message:
            `Route is emitted in ${routeByLocale.size} locales but its hreflang alternates do not ` +
            `cover them reciprocally: ${problems.join('; ')}. ` +
            'Register it in ROUTE_KEYS (src/lib/seo/locale.ts) or pass complete alternates to <SEO>.',
        });
      }
    }
  }
  return findings;
}

/**
 * Sitemap-level gates, checked against the real generated sitemap:
 *  - every published URL must be written in this site's canonical form;
 *  - an entry must be an HTML page route (see the sitemap contract above);
 *  - a known static route must not lose its hreflang alternates;
 *  - a published `<loc>` must resolve to a page the build actually emitted;
 *  - a published `<loc>` must not canonicalise to a different URL;
 *  - an alternate must not point at a route the build never emitted.
 */
export function lintSitemapRoutes(
  entries: SitemapEntry[],
  pages: GeneratedPage[],
  site: string,
  emittedFiles: ReadonlySet<string> = new Set(),
): RouteFinding[] {
  const findings: RouteFinding[] = [];
  const byPath = new Map(pages.map((p) => [publicPath(routePath(p.route)), p]));
  const filePaths = new Set([...emittedFiles].map(publicPath));
  const emittedRoutes = new Set(byPath.keys());

  for (const entry of entries) {
    const path = sitemapPath(entry.loc, site);
    const exact = exactPath(entry.loc, site);

    // Classify against what the build actually emitted, not against the shape
    // of the last path segment. A content slug may look like a file name
    // (`whitepaper.pdf`) and still be an HTML page; only the output can say.
    const pagePath = routePath(exact);
    const isEmittedPage = byPath.has(pagePath);
    const isEmittedFile = filePaths.has(exact);

    for (const url of [entry.loc, ...entry.alternates.map((a) => a.href)]) {
      const urlPath = exactPath(url, site);
      const expected = byPath.has(routePath(urlPath)) ? routePath(urlPath) : null;
      const wrongForm = expected !== null ? urlPath !== expected : !isCanonicalForm(url, site);
      if (wrongForm) {
        findings.push({
          route: path,
          code: 'SITEMAP_URL_NOT_CANONICAL_FORM',
          severity: 'fail',
          message: `${url} is not in this site's canonical URL form (directory routes end in a trailing slash).`,
        });
      }
    }

    // The sitemap contract is HTML page routes only. Naming the violation is
    // what keeps a real feed or PDF from looking like a stale dead link — and
    // keeps an HTML page with a file-shaped slug from being blamed as one.
    if (!isEmittedPage && isEmittedFile) {
      findings.push({
        route: path,
        code: 'SITEMAP_NON_HTML_ENTRY',
        severity: 'fail',
        message:
          `${entry.loc} is a file the build emitted, not an HTML page route. This sitemap ` +
          'publishes page routes only — exclude it in the sitemap() filter, or extend the ' +
          'contract deliberately.',
      });
      continue;
    }

    const key = routeKeyForUrl(entry.loc, site);
    if (key) {
      const expected = new Map<string, string>(LOCALES.map((locale) => [locale, publicPath(routePath(pathFor(key, locale)))]));
      expected.set('x-default', publicPath(routePath(pathFor(key, DEFAULT_LOCALE))));
      const problems = alternateProblems(entry.alternates, expected, emittedRoutes, site);
      if (problems.length > 0) findings.push({
        route: path,
        code: 'SITEMAP_ALTERNATES_MISSING',
        severity: 'fail',
        message: `Known static route has an invalid hreflang set: ${problems.join('; ')}.`,
      });
    }

    const page = byPath.get(pagePath);
    if (!page) {
      // Without this the entry escapes every other gate: a dynamic route needs
      // no alternates, and a missing page leaves the canonical check with
      // nothing to compare. The sitemap would keep advertising a 404.
      findings.push({
        route: path,
        code: 'SITEMAP_LOC_DANGLING',
        severity: 'fail',
        message: 'Published in the sitemap, but the build emitted no page at this route.',
      });
    }

    // Strict comparison on purpose: Google asks that the URL published in the
    // sitemap and the one declared as canonical be the same URL, and `/blog`
    // and `/blog/` are not the same URL.
    const canonical = page ? declaredCanonical(page.html) : null;
    // A loc missing only its terminal slash already has a precise form finding.
    // Other disagreements still reach the canonical comparison.
    const terminalSlashOnly = canonical !== null && `${exact}/` === exactPath(canonical, site);
    if (canonical && exactPath(canonical, site) !== exact && !terminalSlashOnly) {
      findings.push({
        route: path,
        code: 'SITEMAP_LOC_NOT_CANONICAL',
        severity: 'fail',
        message: `Published in the sitemap as ${entry.loc} but the page canonicalises to ${canonical}.`,
      });
    }

    for (const alt of entry.alternates) {
      if (!byPath.has(routePath(exactPath(alt.href, site)))) {
        findings.push({
          route: path,
          code: 'SITEMAP_ALTERNATE_DANGLING',
          severity: 'fail',
          message: `hreflang="${alt.lang}" points at ${alt.href}, which the build never emitted.`,
        });
      }
    }
  }

  return findings;
}

/**
 * Reverse sitemap discovery gates. Sitemap inclusion and indexability are
 * independent: a valid marker permits omission, while noindex pages must
 * never be published in the sitemap. An invalid marker never permits
 * omission — it is reported on its own terms instead of being treated as
 * either present or absent.
 */
export function lintSitemapDiscovery(
  entries: SitemapEntry[],
  pages: GeneratedPage[],
  site: string,
): RouteFinding[] {
  const findings: RouteFinding[] = [];
  const sitemapPaths = new Set(entries.map((entry) => routePath(exactPath(entry.loc, site))));

  for (const page of pages) {
    const published = sitemapPaths.has(publicPath(routePath(page.route)));
    const indexable = isIndexable(page.html);
    const marker = analyzeSitemapMarker(page.html);

    if (marker.state === 'invalid') {
      findings.push({
        route: page.route,
        code: 'SITEMAP_MARKER_INVALID',
        severity: 'fail',
        message:
          `Sitemap exclusion marker is invalid${marker.reason ? ` (${marker.reason})` : ''}. ` +
          'The only recognised form is <meta name="sitemap" content="exclude"> inside <head>.',
      });
    }
    if (marker.state === 'valid' && published) {
      findings.push({
        route: page.route,
        code: 'SITEMAP_OPTED_OUT_PAGE',
        severity: 'fail',
        message: 'Page declares sitemap exclusion but is still published in the sitemap.',
      });
    }
    if (!indexable && published) {
      findings.push({
        route: page.route,
        code: 'SITEMAP_NOINDEX_PAGE',
        severity: 'fail',
        message: 'Page declares noindex but is still published in the sitemap.',
      });
    }
    if (indexable && marker.state === 'none' && !published) {
      findings.push({
        route: page.route,
        code: 'SITEMAP_PAGE_MISSING',
        severity: 'fail',
        message:
          'Indexable page is missing from the generated sitemap. Include the page in the ' +
          'sitemap or declare sitemap: false.',
      });
    }
  }

  return findings;
}
