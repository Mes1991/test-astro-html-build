import { describe, expect, it } from 'vitest';
import { siteSeo } from '../../lib/seo/defaults';
import {
  alternateProblems,
  declaredAlternates,
  declaredCanonical,
  declaredLang,
  declaredOgUrl,
  isIndexable,
  isSitemapExcluded,
  lintLocaleRoutes,
  lintLocalizedRouteCoverage,
  lintSitemapDiscovery,
  lintSitemapRoutes,
  parseSitemap,
  routeFromDistFile,
  sitemapMarkerState,
  type GeneratedPage,
} from './routes';

const SITE = siteSeo.siteUrl;

/** Minimal page shell — only the bits the route gates read. */
function page(
  route: string,
  opts: { lang: string; canonical?: string; robots?: string; sitemapExcluded?: boolean },
): GeneratedPage {
  const robots = opts.robots ? `<meta name="robots" content="${opts.robots}" />` : '';
  const sitemap = opts.sitemapExcluded ? '<meta name="sitemap" content="exclude" />' : '';
  const canonical = opts.canonical ? `<link rel="canonical" href="${opts.canonical}" />` : '';
  return {
    route,
    html: `<!doctype html><html lang="${opts.lang}"><head>${robots}${sitemap}${canonical}</head><body></body></html>`,
  };
}

describe('routeFromDistFile', () => {
  it('maps directory-format output to its served route', () => {
    expect(routeFromDistFile('index.html')).toBe('/');
    expect(routeFromDistFile('es/index.html')).toBe('/es/');
    expect(routeFromDistFile('es/blog/index.html')).toBe('/es/blog/');
  });

  it('maps a bare .html file to an extensionless route', () => {
    expect(routeFromDistFile('404.html')).toBe('/404');
  });

  it('accepts Windows separators', () => {
    expect(routeFromDistFile('es\\blog\\index.html')).toBe('/es/blog/');
  });
});

describe('page attribute readers', () => {
  it('reads lang and canonical', () => {
    const p = page('/es/', { lang: 'es', canonical: `${SITE}/es/` });
    expect(declaredLang(p.html)).toBe('es');
    expect(declaredCanonical(p.html)).toBe(`${SITE}/es/`);
  });

  it('extracts canonical links with reordered uppercase attributes, single quotes and entities', () => {
    const html = `<LINK HREF='${SITE}/search/?a=1&amp;b=2' REL='CANONICAL'>`;
    expect(declaredCanonical(html)).toBe(`${SITE}/search/?a=1&b=2`);
  });

  it('extracts og:url with reordered uppercase attributes, an unquoted value and entities', () => {
    const html = `<META CONTENT=${SITE}/blog/?a&amp;b PROPERTY=OG:URL>`;
    expect(declaredOgUrl(html)).toBe(`${SITE}/blog/?a&b`);
  });

  it('extracts hreflang alternates across quoting, order and case variants', () => {
    const html =
      `<LINK HREF='${SITE}/services/?a=1&amp;b=2' HREFLANG=EN-us REL=ALTERNATE>` +
      `<link HREF=${SITE}/es/services/ REL='alternate' HREFLANG='es-MX'>`;
    expect(declaredAlternates(html)).toEqual([
      { lang: 'EN-us', href: `${SITE}/services/?a=1&b=2` },
      { lang: 'es-MX', href: `${SITE}/es/services/` },
    ]);
  });

  it('treats a page with no robots meta as indexable', () => {
    expect(isIndexable(page('/x/', { lang: 'en' }).html)).toBe(true);
  });

  it('treats the most restrictive robots value as authoritative', () => {
    const conflicting =
      '<html lang="en"><meta name="robots" content="index, follow"><meta name="robots" content="noindex"></html>';
    expect(isIndexable(conflicting)).toBe(false);
  });

  it('extracts robots directives with reordered uppercase attributes and mixed quoting', () => {
    const html = "<META CONTENT='index, follow' NAME=ROBOTS><meta CONTENT=noindex NAME='robots'>";
    expect(isIndexable(html)).toBe(false);
  });

  it('extracts sitemap exclusions across attribute order, case and quoting variants', () => {
    expect(isSitemapExcluded('<head><meta name="sitemap" content="exclude"></head>')).toBe(true);
    expect(isSitemapExcluded('<head><meta name="sitemap" content="include"></head>')).toBe(false);
  });

  it('ignores sitemap markers in comments and raw-text content', () => {
    expect(
      isSitemapExcluded(
        '<head><!-- <meta name="sitemap" content="exclude"> -->' +
          '<script>const example = `<meta name="sitemap" content="exclude">`;</script></head>',
      ),
    ).toBe(false);
  });
});

describe('sitemapMarkerState', () => {
  it.each([
    ['canonical form', '<head><meta name="sitemap" content="exclude"></head>'],
    ['uppercase attribute names', '<head><META NAME="sitemap" CONTENT="exclude"></head>'],
    ['reversed attribute order', '<head><meta content="exclude" name="sitemap"></head>'],
    ['single quotes', "<head><meta name='sitemap' content='exclude'></head>"],
    ['an entity that decodes to exactly exclude', '<head><meta name="sitemap" content="&#101;xclude"></head>'],
  ])('accepts %s as valid', (_case, html) => {
    expect(sitemapMarkerState(`<html>${html}<body></body></html>`)).toBe('valid');
  });

  it.each([
    ['wrong case in content', '<head><meta name="sitemap" content="Exclude"></head>'],
    ['trailing whitespace in content', '<head><meta name="sitemap" content="exclude "></head>'],
    ['a near-miss value', '<head><meta name="sitemap" content="excluded"></head>'],
    ['an unrelated value', '<head><meta name="sitemap" content="noexclude"></head>'],
    ['an empty content', '<head><meta name="sitemap" content=""></head>'],
    ['a missing content', '<head><meta name="sitemap"></head>'],
    ['wrong case in name', '<head><meta name="Sitemap" content="exclude"></head>'],
    [
      'two identical markers',
      '<head><meta name="sitemap" content="exclude"><meta name="sitemap" content="exclude"></head>',
    ],
    [
      'a contradiction between exclude and include',
      '<head><meta name="sitemap" content="exclude"><meta name="sitemap" content="include"></head>',
    ],
    [
      'a marker placed in the body',
      '<head></head><body><meta name="sitemap" content="exclude"></body>',
    ],
  ])('rejects %s as invalid', (_case, html) => {
    expect(sitemapMarkerState(`<html>${html}</html>`)).toBe('invalid');
  });

  it.each([
    ['no meta at all', '<head></head>'],
    ['a marker only inside a comment', '<head><!-- <meta name="sitemap" content="exclude"> --></head>'],
    ['a marker only inside a script', '<head><script>const html = \'<meta name="sitemap" content="exclude">\';</script></head>'],
  ])('reports %s as none', (_case, html) => {
    expect(sitemapMarkerState(`<html>${html}</html>`)).toBe('none');
  });
});

describe('lintLocaleRoutes', () => {
  it('passes when every indexable page matches the locale in its URL', () => {
    const pages = [
      page('/', { lang: 'en' }),
      page('/es/', { lang: 'es' }),
      page('/es/blog/', { lang: 'es-ES' }),
    ];
    expect(lintLocaleRoutes(pages, new Set(), SITE)).toEqual([]);
  });

  it('flags an indexable i18n fallback page — English content at a Spanish URL', () => {
    // This is the A2 defect, reproduced: with `fallbackType: 'rewrite'`, an
    // English-only page is also emitted at /es/<slug>/ holding English content.
    const findings = lintLocaleRoutes([page('/es/services/', { lang: 'en' })], new Set(), SITE);
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe('LOCALE_CONTENT_MISMATCH');
    expect(findings[0].severity).toBe('fail');
    expect(findings[0].route).toBe('/es/services/');
  });

  it('accepts the same fallback page once it is marked noindex', () => {
    expect(
      lintLocaleRoutes(
        [page('/es/services/', { lang: 'en', robots: 'noindex,follow' })],
        new Set(),
        SITE,
      ),
    ).toEqual([]);
  });

  it('flags an internal link that is not in the canonical URL form', () => {
    const withLink: GeneratedPage = {
      route: '/',
      html: '<html lang="en"><head></head><body><a href="/blog">Blog</a></body></html>',
    };
    const findings = lintLocaleRoutes([withLink], new Set(), SITE);
    expect(findings.map((f) => f.code)).toContain('INTERNAL_LINK_NOT_CANONICAL_FORM');
  });

  it('ignores anchors, assets and external links when checking link form', () => {
    const mixed: GeneratedPage = {
      route: '/',
      html:
        '<html lang="en"><head></head><body>' +
        '<a href="/blog/">ok</a><a href="#services">anchor</a>' +
        '<a href="/favicon.svg">asset</a><a href="https://example.org/x">external</a>' +
        '<a href="mailto:hello@example.com">mail</a>' +
        '</body></html>',
    };
    expect(lintLocaleRoutes([mixed], new Set(), SITE)).toEqual([]);
  });

  it('checks internal links to a file-shaped page route, instead of skipping them', () => {
    // The old extension heuristic skipped this link entirely, so the gate went
    // blind on exactly the page under test.
    const pages: GeneratedPage[] = [
      {
        route: '/',
        html: '<html lang="en"><head></head><body><a href="/blog/whitepaper.pdf">x</a></body></html>',
      },
      page('/blog/whitepaper.pdf/', { lang: 'en' }),
    ];
    const codes = lintLocaleRoutes(pages, new Set(), SITE).map((f) => f.code);
    expect(codes).toContain('INTERNAL_LINK_NOT_CANONICAL_FORM');
  });

  it('accepts the same link once it carries the trailing slash', () => {
    const pages: GeneratedPage[] = [
      {
        route: '/',
        html: '<html lang="en"><head></head><body><a href="/blog/whitepaper.pdf/">x</a></body></html>',
      },
      page('/blog/whitepaper.pdf/', { lang: 'en' }),
    ];
    expect(lintLocaleRoutes(pages, new Set(), SITE).map((f) => f.code)).not.toContain(
      'INTERNAL_LINK_NOT_CANONICAL_FORM',
    );
  });

  it('skips an internal link to a file the build actually emitted', () => {
    const pages: GeneratedPage[] = [
      {
        route: '/',
        html: '<html lang="en"><head></head><body><a href="/docs/whitepaper.pdf">x</a></body></html>',
      },
    ];
    const emittedFiles = new Set(['/docs/whitepaper.pdf']);
    expect(lintLocaleRoutes(pages, emittedFiles, SITE)).toEqual([]);
  });

  it('flags a canonical on a file-shaped page route that is missing its slash', () => {
    const pages: GeneratedPage[] = [
      page('/blog/whitepaper.pdf/', { lang: 'en', canonical: `${SITE}/blog/whitepaper.pdf` }),
    ];
    expect(lintLocaleRoutes(pages, new Set(), SITE).map((f) => f.code)).toContain(
      'CANONICAL_NOT_CANONICAL_FORM',
    );
  });

  it('flags a canonical that is not in the canonical URL form', () => {
    const findings = lintLocaleRoutes(
      [page('/blog/', { lang: 'en', canonical: `${SITE}/blog` })],
      new Set(),
      SITE,
    );
    expect(findings.map((f) => f.code)).toContain('CANONICAL_NOT_CANONICAL_FORM');
  });

  it('flags an og:url that disagrees with the canonical', () => {
    const mismatched: GeneratedPage = {
      route: '/blog/',
      html:
        '<html lang="en"><head>' +
        `<link rel="canonical" href="${SITE}/blog/" />` +
        `<meta property="og:url" content="${SITE}/blog" />` +
        '</head><body></body></html>',
    };
    expect(lintLocaleRoutes([mismatched], new Set(), SITE).map((f) => f.code)).toContain(
      'OG_URL_CANONICAL_MISMATCH',
    );
  });

  it('flags a page with no lang attribute', () => {
    const findings = lintLocaleRoutes(
      [{ route: '/', html: '<html><head></head></html>' }],
      new Set(),
      SITE,
    );
    expect(findings[0].code).toBe('HTML_LANG_MISSING');
  });
});

describe('lintLocalizedRouteCoverage', () => {
  /** A page declaring an explicit list of hreflang alternates. */
  function withAlternates(route: string, lang: string, alts: string): GeneratedPage {
    return {
      route,
      html: `<!doctype html><html lang="${lang}"><head>${alts}</head><body></body></html>`,
    };
  }

  const goodAlts =
    `<link rel="alternate" hreflang="en" href="${SITE}/services/" />` +
    `<link rel="alternate" hreflang="es" href="${SITE}/es/services/" />`;

  const pair = (alts: string) => [
    withAlternates('/services/', 'en', alts),
    withAlternates('/es/services/', 'es', alts),
  ];

  it('flags a bilingual route that nobody registered and that declares no alternates', () => {
    // The hazard a ROUTE_KEYS-driven test cannot see: generator and validator
    // read the same registry, so they agree on the same omission. This gate is
    // driven by the emitted output instead.
    const findings = lintLocalizedRouteCoverage([
      page('/services/', { lang: 'en' }),
      page('/es/services/', { lang: 'es' }),
    ], SITE);
    expect(findings.map((f) => f.code)).toContain('LOCALIZED_ROUTE_WITHOUT_ALTERNATES');
  });

  it('accepts a bilingual route whose alternates are complete and reciprocal', () => {
    expect(lintLocalizedRouteCoverage(pair(goodAlts), SITE)).toEqual([]);
  });

  it('accepts regional hreflang variants by primary language subtag', () => {
    const alts =
      `<link rel="alternate" hreflang="en-US" href="${SITE}/services/" />` +
      `<link rel="alternate" hreflang="es-mx" href="${SITE}/es/services/" />`;
    expect(lintLocalizedRouteCoverage(pair(alts), SITE)).toEqual([]);
  });

  it('keeps configured regional locales of one language distinct', () => {
    const expected = new Map([['es-ES', '/es/'], ['es-MX', '/mx/']]);
    const emitted = new Set(['/es/', '/mx/']);
    const both = [
      { lang: 'es-ES', href: '/es/' },
      { lang: 'es-mx', href: '/mx/' },
    ];
    expect(alternateProblems(both, expected, emitted)).toEqual([]);
    // One regional alternate must not stand in for its missing sibling.
    expect(alternateProblems([both[0]], expected, emitted)).toEqual(['no hreflang="es-MX"']);
  });

  it('still reports a genuinely missing locale when another locale is regional', () => {
    const alts = `<link rel="alternate" hreflang="en-US" href="${SITE}/services/" />`;
    const findings = lintLocalizedRouteCoverage(pair(alts), SITE);
    expect(findings.map((finding) => finding.code)).toContain(
      'LOCALIZED_ROUTE_WITHOUT_ALTERNATES',
    );
    expect(findings[0].message).toContain('no hreflang="es"');
  });

  it('is not satisfied by an hreflang tag with no href', () => {
    // Counting tags is not evidence of coverage — this used to switch the gate off.
    const alts =
      '<link rel="alternate" hreflang="en" />' + '<link rel="alternate" hreflang="es" />';
    const findings = lintLocalizedRouteCoverage(pair(alts), SITE);
    expect(findings.map((f) => f.code)).toContain('LOCALIZED_ROUTE_WITHOUT_ALTERNATES');
    expect(findings[0].message).toContain('declares no href');
  });

  it('is not satisfied by an hreflang tag with an empty lang', () => {
    const alts = `<link rel="alternate" hreflang="" href="${SITE}/services/" />`;
    expect(lintLocalizedRouteCoverage(pair(alts), SITE).map((f) => f.code)).toContain(
      'LOCALIZED_ROUTE_WITHOUT_ALTERNATES',
    );
  });

  it('is not satisfied when an alternate points at a page the build never emitted', () => {
    const alts =
      `<link rel="alternate" hreflang="en" href="${SITE}/services/" />` +
      `<link rel="alternate" hreflang="es" href="${SITE}/es/servicios/" />`;
    const findings = lintLocalizedRouteCoverage(pair(alts), SITE);
    expect(findings.map((f) => f.code)).toContain('LOCALIZED_ROUTE_WITHOUT_ALTERNATES');
    expect(findings[0].message).toContain('never emitted');
  });

  it('is not satisfied when an alternate points at the wrong emitted page', () => {
    // Reciprocity: the "es" alternate must name the Spanish twin of THIS route.
    const wrong =
      `<link rel="alternate" hreflang="en" href="${SITE}/services/" />` +
      `<link rel="alternate" hreflang="es" href="${SITE}/es/other/" />`;
    const findings = lintLocalizedRouteCoverage([
      ...pair(wrong),
      page('/es/other/', { lang: 'es' }),
      page('/other/', { lang: 'en' }),
    ], SITE);
    const own = findings.filter((f) => f.route === '/services/');
    expect(own).toHaveLength(1);
    expect(own[0].message).toContain('instead of /es/services/');
  });

  it('is not satisfied when only one locale is covered', () => {
    const alts = `<link rel="alternate" hreflang="en" href="${SITE}/services/" />`;
    const findings = lintLocalizedRouteCoverage(pair(alts), SITE);
    expect(findings[0].message).toContain('no hreflang="es"');
  });

  it('rejects a duplicate locale whose first entry is valid and second is broken', () => {
    // Array.find would stop at the good one and never see the broken duplicate.
    const alts =
      goodAlts + `<link rel="alternate" hreflang="es" href="${SITE}/es/wrong/" />`;
    const findings = lintLocalizedRouteCoverage(pair(alts), SITE);
    expect(findings.map((f) => f.code)).toContain('LOCALIZED_ROUTE_WITHOUT_ALTERNATES');
    expect(findings[0].message).toContain('2 hreflang="es" entries');
  });

  it('rejects a duplicate locale whose first entry is broken and second is valid', () => {
    const alts =
      `<link rel="alternate" hreflang="en" href="${SITE}/services/" />` +
      '<link rel="alternate" hreflang="es" href="" />' +
      `<link rel="alternate" hreflang="es" href="${SITE}/es/services/" />`;
    const findings = lintLocalizedRouteCoverage(pair(alts), SITE);
    expect(findings.map((f) => f.code)).toContain('LOCALIZED_ROUTE_WITHOUT_ALTERNATES');
    expect(findings[0].message).toContain('2 hreflang="es" entries');
  });

  it('rejects duplicates even when both entries are identical and correct', () => {
    const alts = goodAlts + `<link rel="alternate" hreflang="en" href="${SITE}/services/" />`;
    expect(lintLocalizedRouteCoverage(pair(alts), SITE).map((f) => f.code)).toContain(
      'LOCALIZED_ROUTE_WITHOUT_ALTERNATES',
    );
  });

  it('does not treat x-default as a duplicate of the default locale', () => {
    const alts = goodAlts + `<link rel="alternate" hreflang="x-default" href="${SITE}/services/" />`;
    expect(lintLocalizedRouteCoverage(pair(alts), SITE)).toEqual([]);
  });

  it('ignores rel="alternate" links that are not hreflang, such as an RSS feed', () => {
    const alts = goodAlts + '<link rel="alternate" type="application/rss+xml" href="/rss.xml" />';
    expect(lintLocalizedRouteCoverage(pair(alts), SITE)).toEqual([]);
  });

  it('rejects registered routes without alternates', () => {
    expect(
      lintLocalizedRouteCoverage(
        [page('/blog/', { lang: 'en' }), page('/es/blog/', { lang: 'es' })],
        SITE,
      ).map((f) => f.code),
    ).toContain('LOCALIZED_ROUTE_WITHOUT_ALTERNATES');
  });

  it('ignores a route that exists in only one locale', () => {
    expect(lintLocalizedRouteCoverage([page('/services/', { lang: 'en' })], SITE)).toEqual([]);
  });

  it('ignores a noindex fallback twin, which is not a real translation', () => {
    expect(
      lintLocalizedRouteCoverage(
        [
          page('/coming-soon/', { lang: 'en' }),
          page('/es/coming-soon/', { lang: 'en', robots: 'noindex,follow' }),
        ],
        SITE,
      ),
    ).toEqual([]);
  });
});

describe('parseSitemap', () => {
  it('extracts locs and their hreflang alternates', () => {
    const xml =
      '<urlset>' +
      `<url><loc>${SITE}/</loc>` +
      `<xhtml:link rel="alternate" hreflang="en" href="${SITE}/"/>` +
      `<xhtml:link rel="alternate" hreflang="es" href="${SITE}/es/"/>` +
      '</url>' +
      `<url><loc>${SITE}/blog/example-post/</loc></url>` +
      '</urlset>';
    const entries = parseSitemap(xml);
    expect(entries).toHaveLength(2);
    expect(entries[0].alternates).toEqual([
      { lang: 'en', href: `${SITE}/` },
      { lang: 'es', href: `${SITE}/es/` },
    ]);
    expect(entries[1].alternates).toEqual([]);
  });

  it('extracts sitemap values across order, quoting, case and entity variants', () => {
    const xml =
      `<URL><LOC>${SITE}/search/?a=1&amp;b=2</LOC>` +
      `<XHTML:LINK HREF='${SITE}/?a=1&amp;b=2' HREFLANG=EN REL=ALTERNATE/>` +
      `<xhtml:link HREF=${SITE}/es/ REL='alternate' HREFLANG='es-MX'/>` +
      '</URL>';
    expect(parseSitemap(xml)).toEqual([
      {
        loc: `${SITE}/search/?a=1&b=2`,
        alternates: [
          { lang: 'EN', href: `${SITE}/?a=1&b=2` },
          { lang: 'es-MX', href: `${SITE}/es/` },
        ],
      },
    ]);
  });
});

describe('lintSitemapRoutes', () => {
  const pages = [
    page('/', { lang: 'en', canonical: `${SITE}/` }),
    page('/es/', { lang: 'es', canonical: `${SITE}/es/` }),
    page('/blog/', { lang: 'en', canonical: `${SITE}/blog/` }),
    page('/es/blog/', { lang: 'es', canonical: `${SITE}/es/blog/` }),
  ];

  const alternates = [
    { lang: 'en', href: `${SITE}/` },
    { lang: 'es', href: `${SITE}/es/` },
    { lang: 'x-default', href: `${SITE}/` },
  ];

  it('passes a well-formed sitemap', () => {
    const entries = [
      { loc: `${SITE}/`, alternates },
      { loc: `${SITE}/es/`, alternates },
    ];
    expect(lintSitemapRoutes(entries, pages, SITE)).toEqual([]);
  });

  it('accepts an indexable unmarked page included in the sitemap', () => {
    expect(
      lintSitemapDiscovery(
        [{ loc: `${SITE}/blog/`, alternates: [] }],
        [pages[2]],
        SITE,
      ),
    ).toEqual([]);
  });

  it('accepts an indexable sitemap exclusion that is absent from the sitemap', () => {
    const excluded = page('/campaign/', {
      lang: 'en',
      canonical: `${SITE}/campaign/`,
      robots: 'index, follow',
      sitemapExcluded: true,
    });
    expect(isIndexable(excluded.html)).toBe(true);
    expect(lintSitemapDiscovery([], [excluded], SITE)).toEqual([]);
  });

  it('flags an absent indexable page whose only sitemap marker is commented out', () => {
    const html =
      '<html lang="en"><head><meta name="robots" content="index, follow">' +
      '<!-- <meta name="sitemap" content="exclude"> --></head><body></body></html>';
    expect(isSitemapExcluded(html)).toBe(false);
    expect(lintSitemapDiscovery([], [{ route: '/commented-marker/', html }], SITE)).toEqual([
      expect.objectContaining({
        route: '/commented-marker/',
        code: 'SITEMAP_PAGE_MISSING',
      }),
    ]);
  });

  it('accepts a noindex sitemap exclusion that is absent from the sitemap', () => {
    const optedOut = page('/private/', {
      lang: 'en',
      canonical: `${SITE}/private/`,
      robots: 'noindex, nofollow',
      sitemapExcluded: true,
    });
    expect(lintSitemapDiscovery([], [optedOut], SITE)).toEqual([]);
  });

  it('flags an indexable page missing from the sitemap', () => {
    const findings = lintSitemapDiscovery([], [pages[2]], SITE);
    expect(findings).toContainEqual(expect.objectContaining({
      route: '/blog/',
      code: 'SITEMAP_PAGE_MISSING',
      message: expect.stringContaining('Include the page in the sitemap or declare sitemap: false'),
    }));
  });

  it('flags a noindex page that remains in the sitemap', () => {
    const noindex = page('/private/', {
      lang: 'en',
      canonical: `${SITE}/private/`,
      robots: 'noindex, nofollow',
    });
    const findings = lintSitemapDiscovery(
      [{ loc: `${SITE}/private/`, alternates: [] }],
      [noindex],
      SITE,
    );
    expect(findings).toContainEqual(expect.objectContaining({
      route: '/private/',
      code: 'SITEMAP_NOINDEX_PAGE',
      message: expect.stringContaining('declares noindex'),
    }));
  });

  it('flags a sitemap exclusion that remains in the sitemap', () => {
    const excluded = page('/campaign/', {
      lang: 'en',
      canonical: `${SITE}/campaign/`,
      robots: 'index, follow',
      sitemapExcluded: true,
    });
    const findings = lintSitemapDiscovery(
      [{ loc: `${SITE}/campaign/`, alternates: [] }],
      [excluded],
      SITE,
    );
    expect(findings).toContainEqual(expect.objectContaining({
      route: '/campaign/',
      code: 'SITEMAP_OPTED_OUT_PAGE',
      message: expect.stringContaining('declares sitemap exclusion'),
    }));
  });

  it('flags an invalid marker without downgrading it to page-missing', () => {
    const html =
      '<html lang="en"><head><meta name="robots" content="index, follow">' +
      '<meta name="sitemap" content="Exclude"></head><body></body></html>';
    const findings = lintSitemapDiscovery([], [{ route: '/invalid-marker/', html }], SITE);
    expect(findings).toEqual([
      expect.objectContaining({ route: '/invalid-marker/', code: 'SITEMAP_MARKER_INVALID' }),
    ]);
  });

  it('flags an invalid marker on a listed noindex page as exactly two findings', () => {
    const html =
      '<html lang="en"><head><meta name="robots" content="noindex, follow">' +
      '<meta name="sitemap" content="exclude"><meta name="sitemap" content="include">' +
      '</head><body></body></html>';
    const findings = lintSitemapDiscovery(
      [{ loc: `${SITE}/contradiction/`, alternates: [] }],
      [{ route: '/contradiction/', html }],
      SITE,
    );
    expect(findings.map((f) => f.code).sort()).toEqual([
      'SITEMAP_MARKER_INVALID',
      'SITEMAP_NOINDEX_PAGE',
    ]);
  });

  it('flags both opt-out and noindex findings for a valid marker on a listed noindex page', () => {
    const optedOutNoindex = page('/double-violation/', {
      lang: 'en',
      canonical: `${SITE}/double-violation/`,
      robots: 'noindex, nofollow',
      sitemapExcluded: true,
    });
    const findings = lintSitemapDiscovery(
      [{ loc: `${SITE}/double-violation/`, alternates: [] }],
      [optedOutNoindex],
      SITE,
    );
    expect(findings.map((f) => f.code).sort()).toEqual([
      'SITEMAP_NOINDEX_PAGE',
      'SITEMAP_OPTED_OUT_PAGE',
    ]);
  });

  it('flags a known static route published without alternates — the A1 defect', () => {
    const entries = [
      { loc: `${SITE}/`, alternates },
      { loc: `${SITE}/es/`, alternates: [] },
    ];
    const findings = lintSitemapRoutes(entries, pages, SITE);
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe('SITEMAP_ALTERNATES_MISSING');
    expect(findings[0].route).toBe('/es/');
  });

  it('ignores a dynamic route published without alternates', () => {
    // Blog posts carry hreflang in their HTML instead; that is a documented
    // decision, not a defect.
    const withPost = [...pages, page('/blog/example-post/', { lang: 'en', canonical: `${SITE}/blog/example-post/` })];
    const entries = [{ loc: `${SITE}/blog/example-post/`, alternates: [] }];
    expect(lintSitemapRoutes(entries, withPost, SITE)).toEqual([]);
  });

  it('flags a trailing-slash-only difference between loc and canonical', () => {
    // `/blog` and `/blog/` are distinct URLs. Google asks that the sitemap and
    // the canonical name the same one, so this gate must not normalize the
    // difference away — an earlier version did, and accepted exactly the
    // disagreement it exists to reject.
    const slashless = [page('/blog/', { lang: 'en', canonical: `${SITE}/blog` })];
    const entries = [{ loc: `${SITE}/blog/`, alternates }];
    const codes = lintSitemapRoutes(entries, slashless, SITE).map((f) => f.code);
    expect(codes).toContain('SITEMAP_LOC_NOT_CANONICAL');
  });

  it('accepts a loc and canonical that agree exactly', () => {
    const entries = [{ loc: `${SITE}/blog/`, alternates }];
    expect(
      lintSitemapRoutes(entries, pages, SITE).filter((f) => f.code === 'SITEMAP_LOC_NOT_CANONICAL'),
    ).toEqual([]);
  });

  it('flags a sitemap URL that is not in the canonical form', () => {
    const entries = [{ loc: `${SITE}/blog`, alternates }];
    expect(lintSitemapRoutes(entries, pages, SITE).map((f) => f.code)).toContain(
      'SITEMAP_URL_NOT_CANONICAL_FORM',
    );
  });

  it('flags a repeated-slash loc against the page canonical', () => {
    // //blog/ and /blog/ are different public URLs. The comparison must stay
    // byte-exact on both sides, not merely trailing-slash aware.
    const entries = [{ loc: `${SITE}//blog/`, alternates }];
    const codes = lintSitemapRoutes(entries, pages, SITE).map((f) => f.code);
    expect(codes).toContain('SITEMAP_LOC_NOT_CANONICAL');
    expect(codes).toContain('SITEMAP_URL_NOT_CANONICAL_FORM');
  });

  it('treats an emitted page whose slug looks like a file as an HTML route', () => {
    // `whitepaper.pdf` is a content slug, and the build emitted a page at it.
    // Emitted artifacts decide, not the shape of the last path segment.
    const withPdfSlug = [
      ...pages,
      page('/blog/whitepaper.pdf/', { lang: 'en', canonical: `${SITE}/blog/whitepaper.pdf/` }),
    ];
    const entries = [{ loc: `${SITE}/blog/whitepaper.pdf/`, alternates: [] }];
    const codes = lintSitemapRoutes(entries, withPdfSlug, SITE, new Set()).map((f) => f.code);
    expect(codes).not.toContain('SITEMAP_NON_HTML_ENTRY');
    expect(codes).not.toContain('SITEMAP_URL_NOT_CANONICAL_FORM');
    expect(codes).not.toContain('SITEMAP_LOC_DANGLING');
  });

  it('flags the same file-shaped page route when it is published slashless', () => {
    const withPdfSlug = [
      ...pages,
      page('/blog/whitepaper.pdf/', { lang: 'en', canonical: `${SITE}/blog/whitepaper.pdf/` }),
    ];
    const entries = [{ loc: `${SITE}/blog/whitepaper.pdf`, alternates: [] }];
    const codes = lintSitemapRoutes(entries, withPdfSlug, SITE, new Set()).map((f) => f.code);
    expect(codes).toContain('SITEMAP_URL_NOT_CANONICAL_FORM');
    expect(codes).not.toContain('SITEMAP_NON_HTML_ENTRY');
  });

  it('treats a real emitted file as a non-HTML entry', () => {
    // Same shape, opposite ground truth: the build emitted a file here, not a page.
    const emittedFiles = new Set(['/docs/whitepaper.pdf']);
    const entries = [{ loc: `${SITE}/docs/whitepaper.pdf`, alternates: [] }];
    const codes = lintSitemapRoutes(entries, pages, SITE, emittedFiles).map((f) => f.code);
    expect(codes).toContain('SITEMAP_NON_HTML_ENTRY');
    expect(codes).not.toContain('SITEMAP_LOC_DANGLING');
  });

  it('does not mistake a dotted route slug for a non-HTML entry', () => {
    // Misdiagnosing this sent the author to the sitemap filter for what is an
    // ordinary HTML page with a dot in its slug.
    const withDotted = [
      ...pages,
      page('/blog/release-v2.0/', { lang: 'en', canonical: `${SITE}/blog/release-v2.0/` }),
    ];
    const entries = [{ loc: `${SITE}/blog/release-v2.0/`, alternates: [] }];
    const codes = lintSitemapRoutes(entries, withDotted, SITE).map((f) => f.code);
    expect(codes).not.toContain('SITEMAP_NON_HTML_ENTRY');
    expect(codes).not.toContain('SITEMAP_LOC_DANGLING');
  });

  it('flags a slashless dotted route slug as non-canonical, not as an asset', () => {
    const withDotted = [
      ...pages,
      page('/blog/release-v2.0/', { lang: 'en', canonical: `${SITE}/blog/release-v2.0/` }),
    ];
    const entries = [{ loc: `${SITE}/blog/release-v2.0`, alternates: [] }];
    const codes = lintSitemapRoutes(entries, withDotted, SITE).map((f) => f.code);
    expect(codes).toContain('SITEMAP_URL_NOT_CANONICAL_FORM');
    expect(codes).not.toContain('SITEMAP_NON_HTML_ENTRY');
  });

  it('flags a non-HTML sitemap entry against the HTML-only contract', () => {
    // A feed the build really emitted must be an explicit decision, not a
    // confusing dead-link report. This is the finding that names the contract.
    const emittedFiles = new Set(['/rss.xml']);
    const entries = [{ loc: `${SITE}/rss.xml`, alternates: [] }];
    const codes = lintSitemapRoutes(entries, pages, SITE, emittedFiles).map((f) => f.code);
    expect(codes).toContain('SITEMAP_NON_HTML_ENTRY');
    expect(codes).not.toContain('SITEMAP_LOC_DANGLING');
  });

  it('reports a file-shaped loc the build emitted neither way as dangling', () => {
    // Without ground truth the honest answer is "this points at nothing",
    // not "this is a feed" — the extension alone cannot tell them apart.
    const entries = [{ loc: `${SITE}/rss.xml`, alternates: [] }];
    const codes = lintSitemapRoutes(entries, pages, SITE, new Set()).map((f) => f.code);
    expect(codes).toContain('SITEMAP_LOC_DANGLING');
  });

  it('flags a published loc whose page canonicalises elsewhere', () => {
    // The sitemap half of the A2 defect: /es/services/ is published as its own
    // loc while the page itself points search engines at /services.
    const withTwin = [...pages, page('/es/services/', { lang: 'en', canonical: `${SITE}/services` })];
    const entries = [{ loc: `${SITE}/es/services/`, alternates: [] }];
    const findings = lintSitemapRoutes(entries, withTwin, SITE);
    expect(findings.map((f) => f.code)).toContain('SITEMAP_LOC_NOT_CANONICAL');
  });

  it('flags a loc pointing at a route the build never emitted', () => {
    // A stale dynamic URL left in the sitemap advertises a 404. It resolves to
    // no route key, so the alternates gate stays silent, and it has no emitted
    // page, so the canonical gate has nothing to compare — without its own
    // membership check it slips through entirely.
    const entries = [{ loc: `${SITE}/blog/deleted-post/`, alternates: [] }];
    const findings = lintSitemapRoutes(entries, pages, SITE);
    expect(findings.map((f) => f.code)).toContain('SITEMAP_LOC_DANGLING');
  });

  it('does not flag a loc that has an emitted page', () => {
    const entries = [{ loc: `${SITE}/blog/`, alternates }];
    expect(lintSitemapRoutes(entries, pages, SITE).map((f) => f.code)).not.toContain(
      'SITEMAP_LOC_DANGLING',
    );
  });

  it('flags an alternate pointing at a route the build never emitted', () => {
    const entries = [
      {
        loc: `${SITE}/`,
        alternates: [...alternates, { lang: 'fr', href: `${SITE}/fr/` }],
      },
    ];
    const findings = lintSitemapRoutes(entries, pages, SITE);
    expect(findings.map((f) => f.code)).toContain('SITEMAP_ALTERNATE_DANGLING');
  });
});

describe('lintSitemapDiscovery — representative routes', () => {
  it.each([
    ['/', { lang: 'en' }],
    ['/es/', { lang: 'es' }],
  ])('a normal static page %s produces no findings listed, and SITEMAP_PAGE_MISSING absent', (route, opts) => {
    const p = page(route, { ...opts, robots: 'index, follow' });
    expect(lintSitemapDiscovery([{ loc: `${SITE}${route}`, alternates: [] }], [p], SITE)).toEqual([]);
    expect(lintSitemapDiscovery([], [p], SITE).map((f) => f.code)).toEqual(['SITEMAP_PAGE_MISSING']);
  });

  it.each([
    ['/blog/example-post/', { lang: 'en' }],
    ['/es/blog/example-post/', { lang: 'es' }],
  ])('a dynamic blog-post-shaped route %s with a valid marker produces no findings absent', (route, opts) => {
    const p = page(route, { ...opts, robots: 'index, follow', sitemapExcluded: true });
    expect(lintSitemapDiscovery([], [p], SITE)).toEqual([]);
  });

  it.each([
    // coming-soon.astro hardcodes lang="en" regardless of the locale prefix.
    ['/coming-soon/', { lang: 'en' }],
    ['/es/coming-soon/', { lang: 'en' }],
  ])('a coming-soon-shaped route %s: no findings absent, both findings listed', (route, opts) => {
    const p = page(route, { ...opts, robots: 'noindex,follow', sitemapExcluded: true });
    expect(lintSitemapDiscovery([], [p], SITE)).toEqual([]);
    const findings = lintSitemapDiscovery([{ loc: `${SITE}${route}`, alternates: [] }], [p], SITE);
    expect(findings.map((f) => f.code).sort()).toEqual([
      'SITEMAP_NOINDEX_PAGE',
      'SITEMAP_OPTED_OUT_PAGE',
    ]);
  });
});


describe('Phase A alternate set regressions', () => {
  const urls = [{ lang: 'en', href: `${SITE}/blog/` }, { lang: 'es', href: `${SITE}/es/blog/` }, { lang: 'x-default', href: `${SITE}/blog/` }];
  const pages = [page('/blog/', { lang: 'en', canonical: `${SITE}/blog/` }), page('/es/blog/', { lang: 'es', canonical: `${SITE}/es/blog/` })];
  const htmlPages = (alternates: typeof urls) => pages.map((p) => ({ ...p, html: p.html.replace('</head>', alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}" />`).join('') + '</head>') }));
  it('accepts a complete registered HTML set', () => { expect(lintLocalizedRouteCoverage(htmlPages(urls), SITE)).toEqual([]); });
  const cases = [
    ['missing es', urls.filter((a) => a.lang !== 'es')],
    ['duplicate es valid first', [...urls, urls[1]]],
    ['duplicate es broken first', [{ lang: 'es', href: '' }, ...urls]],
    ['empty href', urls.map((a) => a.lang === 'es' ? { ...a, href: '' } : a)],
    ['empty lang', [...urls, { lang: '', href: `${SITE}/es/blog/` }]],
    ['wrong emitted target', urls.map((a) => a.lang === 'es' ? { ...a, href: `${SITE}/blog/` } : a)],
    ['dangling target', urls.map((a) => a.lang === 'es' ? { ...a, href: `${SITE}/es/missing/` } : a)],
    ['missing x-default', urls.filter((a) => a.lang !== 'x-default')],
    ['wrong x-default', urls.map((a) => a.lang === 'x-default' ? { ...a, href: `${SITE}/es/blog/` } : a)],
  ] as const;
  it.each(cases)('rejects registered HTML %s', (_, alts) => { expect(lintLocalizedRouteCoverage(htmlPages([...alts]), SITE).map((f) => f.code)).toContain('LOCALIZED_ROUTE_WITHOUT_ALTERNATES'); });
  it.each(cases)('rejects registered sitemap %s', (_, alts) => { expect(lintSitemapRoutes([{ loc: `${SITE}/blog/`, alternates: [...alts] }], pages, SITE).map((f) => f.code)).toContain('SITEMAP_ALTERNATES_MISSING'); });
  it('preserves empty sitemap attributes for set validation', () => { expect(parseSitemap(`<url><loc>${SITE}/blog/</loc><xhtml:link hreflang="" href=""/></url>`)[0].alternates).toEqual([{lang: '', href: ''}]); });
});

describe('Phase A emitted path regressions', () => {
  it('resolves an encoded sitemap URL against a raw Unicode filesystem route', () => {
    const p = page('/blog/dise\u00f1o-web/', { lang: 'en', canonical: `${SITE}/blog/dise%C3%B1o-web/` });
    expect(lintSitemapRoutes([{loc: `${SITE}/blog/dise%C3%B1o-web/`, alternates: []}], [p], SITE)).toEqual([]);
  });
  it('reports slashless file-shaped loc form without a false dangling diagnosis', () => {
    const p = page('/blog/whitepaper.pdf/', { lang: 'en', canonical: `${SITE}/blog/whitepaper.pdf/` });
    const codes = lintSitemapRoutes([{loc: `${SITE}/blog/whitepaper.pdf`, alternates: []}], [p], SITE).map((f) => f.code);
    expect(codes).toEqual(['SITEMAP_URL_NOT_CANONICAL_FORM']);
  });
  it('reaches canonical comparison for file-shaped routes', () => {
    const p = page('/blog/whitepaper.pdf/', { lang: 'en', canonical: `${SITE}/blog/different.pdf/` });
    expect(lintSitemapRoutes([{loc: `${SITE}/blog/whitepaper.pdf`, alternates: []}], [p], SITE).map((f) => f.code)).toContain('SITEMAP_LOC_NOT_CANONICAL');
  });
});


describe('Unicode resource membership', () => {
  it('recognizes a percent-encoded real asset from its raw emitted filename', () => {
    const findings = lintSitemapRoutes([{loc: `${SITE}/reports/dise%C3%B1o.pdf`, alternates: []}], [], SITE, new Set(['/reports/dise\u00f1o.pdf']));
    expect(findings.map((f) => f.code)).toEqual(['SITEMAP_NON_HTML_ENTRY']);
  });
  it('recognizes a slashless encoded file-shaped page link as a route', () => {
    const p = page('/blog/dise\u00f1o.pdf/', {lang: 'en'});
    p.html += '<a href="/blog/dise%C3%B1o.pdf">Read</a>';
    expect(lintLocaleRoutes([p], new Set(), SITE).map((f) => f.code)).toContain('INTERNAL_LINK_NOT_CANONICAL_FORM');
  });
});
