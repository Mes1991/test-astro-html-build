# Static site SEO — the site-level contract

> **Gap: `tools/seo.mjs` does not exist yet as a standalone file.** The implementation is embedded
> in section 6 of this document and has not been extracted into a tested tool. The commands below
> describe the intended interface, not a file you can run today. Do not claim the tool exists until
> it is extracted and proven; the repository's current SEO lint is a different integration.

This is the complete contract for the site as a whole: the files at its root, the shape of its URLs,
how a crawler moves through it, and what the server has to do with the bytes. Hand this file to
whatever builds the site.

**It assumes nothing about the host.** Every rule here works on a CDN bucket, an `nginx` box, a
managed static platform or shared hosting. Apache and PHP appear only in the appendix at the end,
which is gated behind one specific situation — read the gate before reading the appendix.

Three sibling documents, and none of them repeats a rule stated here:

| You are asking | Read |
|---|---|
| what one page's `<head>` and body need | [seo-page.md](./seo-page.md) |
| what JSON-LD to write | [seo-schema.md](./seo-schema.md) |
| whether a link, a mention or an ad campaign helps | [seo-offpage.md](./seo-offpage.md) |

The per-page document and this one must agree on one thing above all, the exact spelling of every
URL, so read section 1 of this file before writing either.

## Start here

**What you are producing:** two or three ordinary files at the web root.

| File | Path | What it does | Who reads it |
|---|---|---|---|
| `robots.txt` | `/robots.txt` | says what may be crawled, and where the sitemap is | crawlers |
| `sitemap.xml` | `/sitemap.xml` | lists every indexable page and when it changed | crawlers |
| `llms.txt` | `/llms.txt` | optional, and does nothing for Google. Section 2 explains when to bother | some AI tools |

None of these is hosting configuration. They are ordinary files in the same directory as
`index.html`. If they are in the tree you upload, they are live — there is no panel to visit and
nothing to enable.

**Do it in this order.** Each step depends on the one before it:

1. Pick the canonical origin (section 1). Everything downstream quotes it.
2. Write `robots.txt` (section 2). Two lines of content and one absolute URL.
3. Write `sitemap.xml` (section 3), listing only pages that are genuinely indexable.
4. Check the URL inventory and reachability (section 4) — this is where a site accidentally
   publishes URLs nobody decided on.
5. Settle delivery: compression, caching, HTTPS (section 5). Ask the host how; the targets are here.
6. Wire the regenerator (section 6), so the sitemap survives the next page somebody adds.

**Before you write a line, know these three:**

- **The canonical origin is chosen once and then quoted byte for byte.** `https://example.com/about/`
  and `https://example.com/about` are two URLs, and so are the `www` and non-`www` spellings of
  either. Splitting one page across several URLs is the most expensive mistake available here, and
  it is made by inconsistency rather than by ignorance (section 1).
- **`robots.txt` does not hide a page.** `Disallow` stops crawling, not indexing. A disallowed URL
  linked from anywhere else can still appear in results as a bare link with no snippet — and
  because the crawler is not allowed to fetch it, it can never see the `noindex` that would have
  removed it. Hiding a page is `noindex`'s job, which lives in the per-page contract (section 2).
- **A sitemap listing a page that 404s, redirects, or says `noindex` is worse than no sitemap.**
  It is a signed statement that those URLs are your canonical, indexable pages. Contradicting
  yourself in public is the one thing a sitemap can do that plain absence cannot (section 3).

## 1. The canonical origin

Choose, once, and write it down at the top of the project:

- **Scheme:** `https`. Always. On a cPanel account AutoSSL provides the certificate.
- **Host:** `example.com` or `www.example.com`. Either is fine; picking one is not optional.
- **Trailing slash:** decide whether pages live at `/about/` or `/about.html`.

This contract's examples use `https://example.com` with directory-style URLs — `/about/` served
from `about/index.html`. That is the recommended shape on Apache, for one reason: it needs no
rewrite rules. `DirectoryIndex` already serves `about/index.html` for `/about/`, so clean URLs come
free, and on a host you edit over FTP every rewrite rule you avoid is a rule that cannot break.

Whichever you pick, the same string appears in all four of these, identically:

| Where | Example |
|---|---|
| `<loc>` in `sitemap.xml` | `https://example.com/about/` |
| `<link rel="canonical">` on that page | `https://example.com/about/` |
| `og:url` on that page | `https://example.com/about/` |
| every internal link to it | `/about/` or the absolute form |

Internal links may be root-relative (`/about/`), and should be. Relative links (`../about/`) break
the moment a page moves a directory, and Apache's `mod_dir` will 301 `/about` to `/about/` anyway —
which works, but spends a redirect on every visit and every crawl for no reason.

The `Sitemap:` line in `robots.txt` and the `<loc>` values are the two places where an absolute URL
is mandatory, not stylistic. Both are read outside the context of your site.

### Two languages

**One URL per language. Always.** A page that swaps its own text with JavaScript is one URL, so a
crawler indexes one language and the other does not exist — the translation was paid for and cannot
be found. The `lang` attribute can only declare one language too, so a bilingual single page is
lying to screen readers as well.

Three ways to split them, and only one is worth using here:

| Shape | Verdict |
|---|---|
| `example.com/` and `example.com/es/` | **use this** — one origin, no DNS, no rewrites, works on any static host |
| `es.example.com` | avoid — a separate origin needs its own `robots.txt`, its own sitemap and its own Search Console property |
| `example.com/?lang=es` | never — a query parameter on the same document, which is a duplicate rather than a translation |

With the subdirectory shape, the English homepage stays at the root and Spanish lives one level
down. Nothing redirects, and the two trees are ordinary directories of ordinary files.

Pairing the two trees is `hreflang`'s job. It is markup in the `<head>` of both pages, so
**[seo-page.md](./seo-page.md) section 1 owns every rule about it** — reciprocity, self-listing,
`x-default`, and what to do with a page that has no translation. Read it there and do not look for a
second copy here; a rule stated in two contracts is a rule that will disagree with itself.

What belongs to this document is the other half: the same set can also be expressed in
`sitemap.xml`, which is section 3, and the local check verifies the set is coherent, which is
section 7.

## 2. robots.txt

The whole file, for a site that wants to be indexed:

```text
User-agent: *
Disallow:

Sitemap: https://example.com/sitemap.xml
```

That is not a stub. An empty `Disallow:` is the spec's way of saying "nothing is disallowed", and
the `Sitemap:` line is the only part doing real work: it is how a crawler finds the sitemap without
being told, which matters because nothing else on a static site announces it.

`Allow: /` instead of the empty `Disallow:` is understood by Google and Bing and means the same
thing. Do not write both.

### Rules

| Rule | Why |
|---|---|
| Served from the origin root, exactly `/robots.txt` | it is fetched by that URL and no other; a copy in a subdirectory is never read |
| Lowercase filename | the path is case-sensitive on Linux |
| Plain text, `200` status | see the status table below |
| One `Sitemap:` line, absolute URL | a relative path is ignored |
| Applies to one origin only | `www.example.com`, `example.com` and any subdomain each need their own |

The response status matters more than it looks:

| Status | How Google treats it |
|---|---|
| `200` | the rules in the file |
| `404` | allow everything — a missing robots.txt is not an error |
| `5xx` | **disallow everything, temporarily** |

That last row is the reason to check the file actually loads after upload. A server error on
`/robots.txt` is read as "do not crawl this site", and it persists for a while after the server
recovers.

### The four ways this file loses a site

- **`Disallow: /` on a live site.** One character between indexed and invisible. It happens when a
  staging or "coming soon" `robots.txt` is uploaded along with everything else. Read the file after
  every upload that touched it.
- **Blocking `/assets/`, `/css/` or `/js/`.** Google renders the page before judging it. Blocked
  stylesheets and scripts mean it renders an unstyled page and evaluates that. There is no upside
  to blocking them.
- **`Disallow` on a page you meant to `noindex`.** Self-defeating, as described at the top: the
  crawler cannot read the tag it needs to obey. Allow the crawl, use `noindex`, and keep the page
  out of the sitemap.
- **Treating it as access control.** The file is public and lists exactly what you would rather
  people did not look at. Anything that must not be reached needs a password, not a `Disallow`.

### AI crawlers, and the ones you cannot block

The wildcard group above already allows everything, which is almost always what you want. Name a
crawler only when you intend to treat it differently from the rest — and know which category it is
in first, because two of the three cannot be controlled from this file at all.

**Crawlers that fetch pages to answer questions.** Blocking these removes the site from that
product's answers, which is usually the opposite of the goal:

| Token | Belongs to |
|---|---|
| `GPTBot` | OpenAI, including ChatGPT web browsing |
| `OAI-SearchBot` | OpenAI's search features |
| `ClaudeBot` | Anthropic |
| `PerplexityBot` | Perplexity |
| `Google-Extended` | controls use in Gemini and Vertex. It is **not** a crawler — it is an opt-out token, and blocking it does not affect Google Search |

**Crawlers that gather training data.** A legitimate policy choice either way, with no effect on
search or on AI answers: `CCBot` (Common Crawl), `anthropic-ai`, `cohere-ai`, `Bytespider`.

**Fetchers that ignore `robots.txt` by design**, because a person asked for that specific URL:
`ChatGPT-User`, `Google-Agent`, `Google-NotebookLM`. There is no line you can write here that stops
them. If a URL must not be fetched, it needs authentication.

Two more rules worth knowing before you name anything:

- **`AdsBot-Google` does not inherit the `User-agent: *` rules.** It needs its own group. A site
  running Google Ads that blocks it degrades how its landing pages are assessed — see
  [seo-offpage.md](./seo-offpage.md).
- **The most specific matching group wins, and only that one applies.** Adding a group for one
  crawler means the wildcard group no longer applies to it, so a named group with a single `Disallow`
  line silently drops every other rule you wrote for it.

### The other root file: `llms.txt`

A plain-text index of the site at `/llms.txt`, listing its pages with one-line descriptions:

```text
# Acme Roofing
> Roof repair and installation in Miami-Dade.

## Pages
- [Roof repair](https://example.com/roof-repair/): Emergency and scheduled repair.
- [About](https://example.com/about/): Who we are, licences, service area.
```

**Google has said it neither helps nor harms visibility in Google Search.** Some other tools read it.
So the honest position: add it if it is cheap to generate alongside the sitemap, skip it otherwise,
and do not present it to anyone as an SEO improvement. It is not a substitute for `sitemap.xml`, and
nothing in this contract depends on it.

## 3. sitemap.xml

The whole file, for a three-page site:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-08-05</lastmod>
  </url>
  <url>
    <loc>https://example.com/about/</loc>
    <lastmod>2026-07-28</lastmod>
  </url>
  <url>
    <loc>https://example.com/contact/</loc>
    <lastmod>2026-07-28</lastmod>
  </url>
</urlset>
```

### Rules

| Element | Rule |
|---|---|
| `xmlns` on `urlset` | exactly `http://www.sitemaps.org/schemas/sitemap/0.9` — a typo makes the file invalid, and an invalid sitemap is ignored rather than reported |
| `<loc>` | absolute, includes scheme and host, identical to that page's canonical, XML-escaped, under 2048 characters |
| `<lastmod>` | W3C datetime; a plain `YYYY-MM-DD` is valid and enough |
| `<changefreq>` | omit it — Google ignores it |
| `<priority>` | omit it — Google ignores it |
| Encoding | UTF-8, declared |
| Size | up to 50,000 URLs or 50 MB uncompressed, beyond which you need a sitemap index |

**XML-escaped is not a formality.** A `&` inside a URL must be written `&amp;`, and a raw one makes
the document unparseable — which is why the generator in section 6 uses `XMLWriter` rather than
string concatenation. If you write the file by hand, this is the character to check.

**`<lastmod>` has to be honest.** It should be when the page's content last changed, not when the
file was last touched. A sitemap where every date is today's is treated as noise and stops being
used as a signal at all.

### Two languages in the sitemap

A bilingual site may declare its pairings here as well as in each page's `<head>`. It is optional —
the `<head>` alone is enough — and it is worth doing because it is generated, so it cannot drift the
way twenty hand-written head blocks can.

It needs a second namespace on `urlset`, and every URL in a set repeats the complete set:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-08-05</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/"/>
  </url>
  <url>
    <loc>https://example.com/es/</loc>
    <lastmod>2026-08-05</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/"/>
  </url>
</urlset>
```

Note what that repetition means: the two `<url>` blocks carry an **identical** set of
`<xhtml:link>` children. That is the reciprocity rule owned by
[seo-page.md](./seo-page.md), expressed in one file instead of two. Omitting a link from one side discards the set.

Do not mix the two declarations unevenly. Either the sitemap carries the full sets for every
translated page, or it carries none and the `<head>` tags do the work alone. A sitemap that pairs
half the site contradicts the half it left out.

### What must never appear in it

The sitemap is a claim that these URLs are canonical and indexable. Each of the following
contradicts that claim:

| Do not list | Because |
|---|---|
| The 404 page | it is not a page, it is a status |
| A URL that redirects | the destination is the canonical one; list that instead |
| Any page carrying `noindex` | you are asking for it to be indexed and not indexed at once |
| Thank-you and confirmation pages | they are `noindex` by rule (see [seo-page.md](./seo-page.md)) |
| A page whose canonical points elsewhere | the page itself disowns the URL you are submitting |
| Partials and includes | fragments are not pages, even when they are `.html` |
| Any URL that only accepts `POST` | a form action or an API path is not a page a visitor can land on |

## 4. Link architecture and the URL inventory

The sitemap in section 3 says which pages exist. This section is about the other half of the same
question: whether a crawler can *reach* them, and whether the site has quietly minted URLs nobody
decided to publish.

### Reachability

- **Every page is reachable by following real `<a href>` links from the home page.** A page that is
  only in the sitemap is an orphan: it may be crawled, and it has no context, no anchor text, and no
  place in the site. The sitemap is a hint, not a substitute for navigation.
- **Keep important pages within about three clicks of the home page.** Depth is a rough proxy for
  how important the site itself says a page is.
- **Navigation is markup, not script.** A menu built by JavaScript on click is not a set of links.
  This is the same failure as the language switcher in section 1, with the whole site behind it
  instead of one translation.

### URLs the site created without deciding to

A static site usually has one file per URL, which is its great advantage. Two things break that:

| Source | What happens | Fix |
|---|---|---|
| Query parameters (`?utm_source=…`, `?ref=…`) | one page answers at unlimited URLs | the canonical is the clean URL, hardcoded in the page. Parameter URLs never enter `sitemap.xml` |
| Filter or facet links (`?color=red&size=l`) | combinatorial explosion, all of it thin | link facets as parameters and let each canonicalise to the unfiltered page. Do not give a facet its own file unless somebody would search for it |
| Paginated lists (`/blog/page/2/`) | pages 2..n competing with page 1 | each page self-canonicalises. `rel="next"`/`rel="prev"` are no longer used by Google and are not needed |
| Both spellings answering (`/about` and `/about/`, or `/about.html`) | two URLs, one page, signals split | pick one shape in section 1 and make the other redirect. Never let both return `200` |

**A facet worth its own file is one somebody searches for.** "Red running shoes" plausibly is;
"red, size 11, under $80, in stock" is not. The test is search demand, not whether the combination
is technically expressible.

**Never block parameter URLs in `robots.txt` to solve this.** A blocked URL cannot be crawled, so
its canonical is never read, so the duplicate is never resolved — the tag you wrote is invisible.
Canonicals solve duplication; `robots.txt` only hides it.

Paid-campaign URLs are the most common parameter case and have one extra constraint of their own,
in [seo-offpage.md](./seo-offpage.md).

## 5. Delivery and transport

Everything so far is a file's contents. This section is about what the server does with it, which
decides two of the three Core Web Vitals and one way to lose a site outright.

**How to apply this section depends on the host, and it is not this document's job to know yours.**
Compression and cache headers are configured somewhere on every platform — a CDN dashboard, a
`_headers` file, an `nginx` block, `.htaccess`. The rules below are the outcome to aim for. The
Apache spelling of them is in the appendix, because Apache is one host among several and this
contract does not assume it.

### The outcome to aim for

| Concern | Target | Why it matters here |
|---|---|---|
| Compression | gzip or brotli on HTML, CSS, JS, SVG | the single largest reduction in bytes on the wire, and it is off by default more often than people expect |
| Static asset caching | a long `Cache-Control: max-age` on fingerprinted assets | repeat visits stop re-downloading; only works if the filename changes when the file does |
| HTML caching | short or revalidated | a long cache on HTML means an edit does not reach visitors |
| TTFB | under ~0.8 s | it is the floor under LCP: nothing paints before the first byte arrives |
| HTTP status | `200` for real pages, a real `404` for missing ones | a missing page answering `200` with an error message is a "soft 404" — it gets indexed and competes with real content |

Images are usually the biggest win available and they are a file decision, not a server one: serve
the size actually displayed, in a modern format. The attributes that go with them are in
[seo-page.md](./seo-page.md).

### HTTPS, and what happens without it

- **HTTPS on every URL, with HTTP redirecting to it once.** Not a ranking bonus so much as the
  absence of a penalty: a browser warning on a form page ends the visit.
- **One redirect hop.** `http://www` → `https://` → final wastes a hop on every visit; redirect
  straight to the canonical origin from section 1.
- **No mixed content.** One `http://` image or script on an `https://` page triggers a browser
  warning or a blocked request. This is the most common leftover after a migration, and it does not
  announce itself in a page that "looks fine".
- **HSTS once you are certain.** It tells browsers to refuse plain HTTP for this host for a stated
  period. It is also **hard to undo** — a browser that cached the header will not talk HTTP to the
  host until it expires. Start with a short `max-age`, and do not add `preload` until the site has
  been fully HTTPS for a while.

### The failure that costs everything

**A compromised site is deindexed, and it is the fastest way to lose all organic traffic at once.**
Injected spam pages, a redirect that only fires for visitors arriving from search, or a cloaked page
that serves different content to a crawler all get the site flagged, and recovery requires a review
after cleanup rather than a re-upload.

A static site is a small target — there is no database and no admin login — which is exactly why the
remaining vectors are worth naming:

1. **Leftover server-side software.** An abandoned CMS still on the account is unpatched software in
   a public directory, whether or not anything links to it. Delete it; do not cover it.
2. **Stale credentials.** FTP and control-panel passwords that outlive the person who used them.
3. **Third-party scripts.** Every external script on the page can change what the page does, at any
   time, without a deploy. Include the ones you need and know why each is there.

Two headers worth setting once, applied wherever your host applies headers:
`X-Content-Type-Options: nosniff` and a `Referrer-Policy` such as `strict-origin-when-cross-origin`.
A Content-Security-Policy is more valuable and more work; do not add one you have not tested, because
a policy that blocks your own stylesheet is a broken site.

**Check for a flag before assuming a ranking problem.** Search Console reports security issues and
manual actions in their own sections. A site that lost all its traffic in one day did not lose it to
an algorithm.

## 6. Keeping the sitemap current

> **Gap: `tools/seo.mjs` is not yet a standalone file.** The script below is the intended
> implementation, embedded here pending extraction into a tested tool. Until it is extracted, the
> `node tools/seo.mjs …` commands in this section describe an interface that does not exist as a
> file. Do not claim the tool exists; the repository's current SEO lint is a different integration.

The sitemap is the only file that knows about pages other than itself, which makes it the only file
that goes stale on its own. Three mechanisms stop that, in the order you should reach for them.

### 1. Generate it locally, in the authoring pass

**This is the mechanism. The other two are a floor under it and a fallback below it.**

Whoever builds the site is the build step, and `sitemap.xml` is one of its outputs — no different
from the pages themselves. So:

**Any pass that adds, removes or renames an `.html` file regenerates `sitemap.xml` in the same pass,
and uploads it with the pages.**

Not afterwards, not as a follow-up task. A sitemap regenerated "later" is a sitemap regenerated
never, and the failure is silent: the new page is simply absent, indistinguishable from a page that
was never meant to be indexed.

Local generation is first because **it asks nothing of the host**. No PHP, no cron, no shell, no
write permission on the document root. A cPanel account, a VPS serving files from nginx with no
PHP-FPM at all, a static bucket behind a CDN — identical. Anything that depends on the server
having a runtime stops working the day a site is hosted somewhere slightly different, and that day
arrives without warning.

Save the script below as `tools/seo.mjs` in the project that holds the site, then:

```text
node tools/seo.mjs build ./site https://example.com
```

#### The script

No dependencies, no install step, no config file required — Node and its standard library. Copy it
verbatim: the skill that drives it and the guards in the repo that publishes this contract both
assume this exact behaviour.

```js
#!/usr/bin/env node

/**
 * Generates and verifies the site-level SEO files of a static site, locally.
 *
 * WHY LOCALLY: this contract and its page-level counterpart are written for hosts with
 * no build step -- a cPanel account, a VPS serving files from nginx with no PHP-FPM, a bucket
 * behind a CDN. Anything that needs a runtime on the server stops working the day a site is
 * hosted somewhere slightly different. This needs Node and nothing else, and it runs on the tree
 * before it is uploaded, where a mistake is still free.
 *
 * It also closes the one gap no server-side regenerator can: a page whose canonical disagrees
 * with the URL the sitemap submits for it. A generator that derives URLs from file paths never
 * reads the canonical, so both files look correct in isolation.
 *
 * Usage:
 *   node seo.mjs build <dir> [origin]    write sitemap.xml, and robots.txt if absent
 *   node seo.mjs check <dir> [origin]    report drift; exit 1 if anything is wrong
 *
 * `origin` may instead live in <dir>/seo.json, together with any skip-list overrides:
 *   { "origin": "https://example.com", "skipDirs": [...], "skipFiles": [...] }
 *
 * HTML is read with regular expressions, not parsed. That is a deliberate trade -- no
 * dependencies, and the fields it reads (`lang`, title, description, canonical, robots, hreflang,
 * og:url) are single-line tags in every page these contracts describe. A page that hides one of
 * them behind unusual markup reads as missing, which errs toward reporting rather than passing.
 */

import { readdirSync, readFileSync, existsSync, writeFileSync, renameSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Directories whose HTML is not pages. */
export const SKIP_DIRS = [
    'assets',
    'css',
    'js',
    'img',
    'images',
    'fonts',
    'media',
    'cgi-bin',
    'partials',
    'includes',
    'node_modules',
    '.git',
    '.well-known',
];

/** Files that are HTML but not indexable pages. */
export const SKIP_FILES = ['404.html', '403.html', '410.html', '500.html', 'thank-you.html', 'gracias.html'];

const SITEMAP = 'sitemap.xml';
const ROBOTS = 'robots.txt';

/* ------------------------------------------------------------------ reading */

export function loadConfig(dir) {
    const file = join(dir, 'seo.json');
    const config = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};

    return {
        origin: config.origin ?? null,
        skipDirs: config.skipDirs ?? SKIP_DIRS,
        skipFiles: config.skipFiles ?? SKIP_FILES,
    };
}

function walk(dir, config, base = dir, found = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!config.skipDirs.includes(entry.name)) {
                walk(full, config, base, found);
            }

            continue;
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
            found.push(full);
        }
    }

    return found;
}

const attribute = (html, pattern) => html.match(pattern)?.[1]?.trim() ?? null;

/**
 * The URL a file is served at. `about/index.html` is served as `/about/`, which is why the
 * trailing slash is not a style choice: it is what the server actually answers.
 */
export function urlFor(origin, rel) {
    return `${origin}/${rel.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1')}`;
}

export function readPage(file, origin, base) {
    const html = readFileSync(file, 'utf8');
    const rel = relative(base, file).replace(/\\/g, '/');

    const alternates = [...html.matchAll(/<link[^>]+rel=["']alternate["'][^>]*>/gi)]
        .map((tag) => ({
            hreflang: attribute(tag[0], /hreflang=["']([^"']+)["']/i),
            href: attribute(tag[0], /href=["']([^"']+)["']/i),
        }))
        .filter((link) => link.hreflang && link.href);

    return {
        file,
        rel,
        url: urlFor(origin, rel),
        lastmod: new Date(statSync(file).mtime).toISOString().slice(0, 10),
        lang: attribute(html, /<html[^>]*\slang=["']([^"']+)["']/i),
        title: attribute(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
        description: attribute(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i),
        canonical: attribute(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i),
        ogUrl: attribute(html, /<meta[^>]+property=["']og:url["'][^>]*content=["']([^"']*)["']/i),
        // `none` is shorthand for noindex,nofollow, and is the one other spelling worth honouring.
        noindex: /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*(noindex|none)/i.test(html),
        alternates,
    };
}

export function collect(dir, origin) {
    const config = loadConfig(dir);
    const resolved = origin ?? config.origin;

    if (!resolved) {
        throw new Error(`no origin given and none in ${join(dir, 'seo.json')}`);
    }
    if (!/^https:\/\/[^/]+$/.test(resolved)) {
        throw new Error(`origin must be "https://host" with no path or trailing slash, got "${resolved}"`);
    }

    const pages = walk(dir, config)
        .filter((file) => !config.skipFiles.includes(basename(file)))
        .map((file) => readPage(file, resolved, dir))
        .sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));

    return { origin: resolved, config, pages };
}

/* ------------------------------------------------------------------ writing */

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildSitemap(pages) {
    const listed = pages.filter((page) => !page.noindex);
    const translated = listed.some((page) => page.alternates.length > 0);

    const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
    lines.push(
        translated
            ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
            : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );

    for (const page of listed) {
        lines.push('  <url>');
        lines.push(`    <loc>${escape(page.url)}</loc>`);
        lines.push(`    <lastmod>${page.lastmod}</lastmod>`);

        for (const link of page.alternates) {
            lines.push(`    <xhtml:link rel="alternate" hreflang="${escape(link.hreflang)}" href="${escape(link.href)}"/>`);
        }

        lines.push('  </url>');
    }

    lines.push('</urlset>');

    return `${lines.join('\n')}\n`;
}

export function buildRobots(origin) {
    return `User-agent: *\nDisallow:\n\nSitemap: ${origin}/${SITEMAP}\n`;
}

/** Write then rename, so nothing reads a half-written file. */
function writeAtomic(target, contents) {
    writeFileSync(`${target}.tmp`, contents);
    renameSync(`${target}.tmp`, target);
}

export function build(dir, origin) {
    const { origin: resolved, pages } = collect(dir, origin);
    const written = [];

    writeAtomic(join(dir, SITEMAP), buildSitemap(pages));
    written.push(SITEMAP);

    if (!existsSync(join(dir, ROBOTS))) {
        writeAtomic(join(dir, ROBOTS), buildRobots(resolved));
        written.push(ROBOTS);
    }

    return { written, pages: pages.filter((page) => !page.noindex).length, excluded: pages.filter((page) => page.noindex).length };
}

/* ----------------------------------------------------------------- checking */

const ENTITY = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/;

/**
 * Every finding the contract's section 7 promises. Each is a real defect, not a style note, so
 * there are no warnings here -- anything reported fails the check.
 */
export function check(dir, origin) {
    const { origin: resolved, pages } = collect(dir, origin);
    const findings = [];
    const report = (code, where, message) => findings.push({ code, where, message });

    const sitemapPath = join(dir, SITEMAP);
    const robotsPath = join(dir, ROBOTS);

    if (!existsSync(sitemapPath)) {
        report('sitemap-missing', SITEMAP, `no ${SITEMAP}; run "build" first`);

        return { origin: resolved, pages, findings };
    }

    const raw = readFileSync(sitemapPath, 'utf8');
    const locs = [...raw.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);

    if (ENTITY.test(raw)) {
        report('sitemap-raw-ampersand', SITEMAP, 'a raw "&" makes the sitemap unparseable, and an unparseable sitemap is discarded');
    }

    if (!existsSync(robotsPath)) {
        report('robots-missing', ROBOTS, `no ${ROBOTS}; run "build" first`);
    } else if (!new RegExp(`^Sitemap: ${resolved}/${SITEMAP}$`, 'm').test(readFileSync(robotsPath, 'utf8'))) {
        report('robots-no-sitemap', ROBOTS, `should contain "Sitemap: ${resolved}/${SITEMAP}"`);
    }

    const indexable = pages.filter((page) => !page.noindex);
    const byUrl = new Map(pages.map((page) => [page.url, page]));
    const seen = { title: new Map(), description: new Map() };

    for (const loc of locs) {
        const page = byUrl.get(loc);

        if (!page) {
            report('sitemap-entry-missing-file', SITEMAP, `lists ${loc}, which no file in the tree serves`);
        } else if (page.noindex) {
            report('noindex-in-sitemap', page.rel, `${loc} carries noindex and must not be listed`);
        }
    }

    for (const page of indexable) {
        if (!locs.includes(page.url)) {
            report('page-not-in-sitemap', page.rel, `${page.url} is indexable but absent from ${SITEMAP}`);
        }

        for (const field of ['title', 'description', 'canonical']) {
            if (!page[field]) {
                report(`missing-${field}`, page.rel, `no ${field}`);
            }
        }

        if (page.canonical && page.canonical !== page.url) {
            report('canonical-mismatch', page.rel, `canonical is ${page.canonical} but the file is served at ${page.url}`);
        }

        if (page.ogUrl && page.canonical && page.ogUrl !== page.canonical) {
            report('og-url-mismatch', page.rel, `og:url is ${page.ogUrl} but the canonical is ${page.canonical}`);
        }

        for (const field of ['title', 'description']) {
            const value = page[field];
            if (!value) continue;

            const first = seen[field].get(value);
            if (first) {
                report(`duplicate-${field}`, page.rel, `same ${field} as ${first}`);
            } else {
                seen[field].set(value, page.rel);
            }
        }
    }

    findings.push(...checkHreflang(indexable, byUrl));

    return { origin: resolved, pages, findings };
}

/** The set a page declares, as a comparable string. */
const setOf = (page) =>
    page.alternates
        .map((link) => `${link.hreflang}|${link.href}`)
        .sort()
        .join(' ');

/**
 * A set that is not reciprocal is DISCARDED, not degraded, so a one-sided set is worth as much as
 * no set at all -- while looking, in the page that has it, exactly like a working one.
 *
 * Reciprocity is tested as MAPPING EQUALITY, which is how the contract states it: the alternates
 * are identical on every page in the set. Testing instead that the twin merely mentions this URL
 * somewhere is not enough -- an `x-default` pointing back at the English page would satisfy it
 * while the `en` pairing itself is still missing, which is exactly the shape a half-finished
 * translation takes.
 */
export function checkHreflang(pages, byUrl) {
    const findings = [];
    const report = (code, where, message) => findings.push({ code, where, message });

    for (const page of pages) {
        if (page.alternates.length === 0) continue;

        const hrefs = page.alternates.map((link) => link.href);

        if (!hrefs.includes(page.url)) {
            report('hreflang-no-self', page.rel, `does not list itself (${page.url}) among its alternates`);
        }

        if (!page.alternates.some((link) => link.hreflang === 'x-default')) {
            report('hreflang-no-x-default', page.rel, 'no x-default alternate');
        }

        // The set is discarded as a whole, so it is one finding per page however many
        // alternates disagree. Repeating it per link buries the other findings.
        let reported = false;

        for (const link of page.alternates) {
            if (link.href === page.url) continue;

            const twin = byUrl.get(link.href);

            if (!twin) {
                report('hreflang-dead-target', page.rel, `points at ${link.href}, which no file in the tree serves`);

                continue;
            }

            if (setOf(twin) !== setOf(page) && !reported) {
                reported = true;
                report(
                    'hreflang-not-reciprocal',
                    page.rel,
                    `declares a different set from ${twin.rel}, so the whole set is discarded rather than half honoured`
                );
            }
        }
    }

    return findings;
}

/* --------------------------------------------------------------------- cli */

function main(argv) {
    const [command, dir, origin] = argv;

    if (!command || !dir || !['build', 'check'].includes(command)) {
        process.stderr.write('usage: node seo.mjs <build|check> <dir> [origin]\n');

        return 2;
    }

    if (!existsSync(dir)) {
        process.stderr.write(`no such directory: ${dir}\n`);

        return 2;
    }

    try {
        return execute(command, dir, origin);
    } catch (error) {
        // A misconfigured origin or an unreadable tree is a usage problem, and whoever
        // reads this output is usually an agent. One line beats a stack trace.
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);

        return 2;
    }
}

function execute(command, dir, origin) {
    if (command === 'build') {
        const { written, pages, excluded } = build(dir, origin);
        process.stdout.write(`wrote ${written.join(', ')} — ${pages} pages listed, ${excluded} excluded\n`);

        return 0;
    }

    const { findings, pages } = check(dir, origin);

    if (findings.length === 0) {
        process.stdout.write(`ok — ${pages.length} pages, no findings\n`);

        return 0;
    }

    for (const finding of findings) {
        process.stdout.write(`${finding.where}: ${finding.message} [${finding.code}]\n`);
    }

    process.stdout.write(`\n${findings.length} finding(s)\n`);

    return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    process.exit(main(process.argv.slice(2)));
}

export { main };
```

### 2. Verify before upload

Generating is easy. **Remembering to generate is the part that fails**, and it fails quietly, so the
rule above is worth nothing without something that checks it:

```text
node tools/seo.mjs check ./site https://example.com
```

It exits non-zero and names what is wrong. What it catches is listed in section 7 — including the
one thing no server-side script can see, a page whose canonical disagrees with the URL the sitemap
submits for it.

Run it before every upload. A rule nothing enforces is a preference.

### 3. Editing the files by hand, when there is nothing else

A host with no PHP and an author with no Node — someone maintaining the site through a file manager
or an FTP client and nothing else. This mode works, and it **will** drift. Say so out loud to
whoever is going to maintain it, rather than discovering it together in six months.

The minimum discipline, and it is a real minimum:

1. **Keep the sitemap flat and short.** Every page at the top level, no nesting, alphabetical. A
   file you can read in one screen is a file whose missing line you can see.
2. **Edit `sitemap.xml` in the same sitting as the page.** Open both, or neither. The gap between
   "upload the page" and "update the sitemap" is where the entry is lost, and it is measured in
   minutes, not days.
3. **Update `<lastmod>` on the page you touched, and nothing else.** Rewriting every date to today
   is how the field stops being believed.
4. **Escape the ampersand.** `&` becomes `&amp;` or the file stops parsing and the whole sitemap is
   discarded. This is the single most likely hand-editing failure.
5. **Open `sitemap.xml` in a browser after saving.** A parse error is displayed immediately. Ten
   seconds, and it catches rule 4.
6. **Re-read the exclusion list** in section 3 before adding a line. A hand-maintained sitemap
   accumulates thank-you pages.

`robots.txt` is different and needs none of this: it does not list pages, so once it is correct it
stays correct. Write it once, check it loads, leave it alone.

## 7. Verifying it

Two halves: what a script can check on the local copy before it goes up, and what only a person can
check afterwards. Do the first on every upload and the second once.

### What `seo.mjs check` catches

Run against the local site directory, so a problem is found while it is still free to fix:

| Finding | Why it matters |
|---|---|
| A page not listed in the sitemap | the failure this whole section exists to prevent |
| A sitemap entry with no file behind it | a renamed or deleted page still being submitted |
| A page with no `<title>`, description or canonical | the three required fields, per [seo-page.md](./seo-page.md) |
| A canonical that disagrees with the URL the sitemap submits | the two files each look fine alone; only a cross-check sees it |
| A title or description reused on another page | the default failure of a generated site |
| A `noindex` page listed in the sitemap | asking for indexing and forbidding it at once |
| An `hreflang` set that is not reciprocal | the whole set is discarded, silently |
| A `<loc>` in the wrong trailing-slash form | two URLs for one page |
| A raw `&` in the sitemap | the file does not parse, and is discarded without a word |

That fourth row is worth naming: it is the gap a server-side regenerator cannot close. The PHP cron
derives URLs from file paths and never reads the canonical, so it will happily submit a URL the page
itself disowns. Only a check that reads both sees it.

### What stays manual

Once, after the first upload:

| Check | How |
|---|---|
| `robots.txt` loads and reads right | open `https://example.com/robots.txt` |
| `sitemap.xml` parses | open it in a browser — a parse error is displayed, not hidden |
| `/` serves the page you expect | open the site in a private window |
| A missing URL returns 404, not 500 or 200 | open `https://example.com/definitely-not-a-page` |
| The `www` and non-`www` forms agree | open both; one must redirect to the other |
| The sitemap is registered | Search Console → Sitemaps → submit `/sitemap.xml`, once |
| Every `<loc>` is live | click through them; the list is short enough |

Search Console verification and sitemap submission are one-time manual steps. There is no way to
automate them from a static site, and nothing in this repo does it for you.

## 8. What this contract does not cover

Written down because an unlisted gap gets mistaken for a covered one.

- **Nothing validates any of this against the client's server.** The guards in this repo check that
  this document is internally consistent, that the PHP above runs, and that `seo.mjs` reports what
  section 7 says it reports. None of them can see the host, the uploaded files, or whether the cron
  ever ran.
- **`seo.mjs check` reads the local copy, not the site.** A file that failed to upload, a permission
  problem, or a stale sitemap already live on the host are all invisible to it. It proves the tree
  you are about to send is coherent, which is a different claim from the site being correct.
- **Steps 1 and 2 of section 6 are the whole mechanism on most hosts.** The appendix cron is an
  extra floor for one kind of host and most sites will never have it, so a page uploaded by somebody
  who ran neither step is absent from the sitemap until the next person runs the check. That is a
  process gap, not a software one, and it cannot be closed from here.
- **The regenerator matches `noindex` with a regex, not a parser.** An unusual spelling, a
  `robots` directive split across attributes, or a `X-Robots-Tag` HTTP header will not be detected,
  and the page will be listed. Keep the tag conventional (see [seo-page.md](./seo-page.md)).
- **The PHP regenerator never reads a canonical.** It derives URLs from file paths, so when a page's
  canonical disagrees it submits a URL the page itself disowns and both files look fine in isolation.
  `seo.mjs check` closes this locally; the cron cannot.
- **A page you forgot to upload is simply absent.** Neither the generator nor the sitemap can know a
  page was supposed to exist.
- **Image, video and news sitemaps are out of scope**, as are sitemap indexes for sites over 50,000
  URLs. `hreflang` is covered (sections 1 and 3); a third language works the same way and needs no
  change here.
- **Content rendered by JavaScript is out of scope.** This contract assumes the HTML in the file is
  the HTML a crawler sees. Anything a script injects after load is outside every rule here and
  contributes nothing to what gets indexed — and AI answer engines do not run JavaScript at all, so
  the cost is higher than it used to be.
- **Links and mentions from other sites are covered elsewhere**, in
  [seo-offpage.md](./seo-offpage.md). They were listed here as out of scope until 1.3.
- **Nothing here checks the delivery targets in section 5.** Compression, cache headers and TTFB are
  properties of a running server, and `seo.mjs check` reads a directory. Measure them against the
  live site with any field-data tool.
- **The FTP upload is not atomic.** During an upload the site can be briefly inconsistent — a new
  `sitemap.xml` referring to pages that have not landed yet. Upload pages before the sitemap.

## Appendix — Apache and PHP hosts

> **Skip this appendix unless the developer has told you the site is replacing a PHP application in
> the same document root** — a WordPress or similar install being swapped for static files on the
> same account, at the same web root.
>
> If you do not have that confirmation, you do not need anything below. Nothing in sections 1 to 8
> requires Apache, `.htaccess`, or PHP, and a static site can be served from a CDN bucket, an
> `nginx` host, or a platform with no configuration files at all. **Do not ask a developer to create
> an `.htaccess` file to satisfy this contract.** Ask which host it is, and if the answer is not
> "Apache, replacing PHP in the same root", stop here.

Why the gate exists: this material was written for one migration and is genuinely load-bearing for
it. Applied anywhere else it is noise at best, and at worst it invents a requirement — an
`.htaccess` on a host that ignores it, or a PHP cron on a host with no PHP.

### A.1 Which file answers a URL

Everything in this subsection goes in `.htaccess` at the web root. A complete, working file for a
static site on cPanel:

```apache
DirectoryIndex index.html index.php

RewriteEngine On

# One spelling of the host. Pick one and redirect the other; this example
# canonicalises to the non-www form.
RewriteCond %{HTTP_HOST} ^www\.example\.com$ [NC]
RewriteRule ^(.*)$ https://example.com/$1 [R=301,L]

# The WordPress sitemap URL, which is already in Google's index.
RewriteRule ^sitemap_index\.xml$ /sitemap.xml [R=301,L]

ErrorDocument 404 /404.html
```

Notes on each part:

- **`DirectoryIndex` is first for a reason** (A.2).
- **The host redirect goes before the path redirect**, so the common case is a single hop. A request
  for `www.example.com/sitemap_index.xml` takes two, which is unavoidable without merging the rules
  and not worth optimising.
- **Force HTTPS through cPanel, not here.** Domains → **Force HTTPS Redirect** does it at the
  server level, correctly, without the redirect loop a hand-written `%{HTTPS}` rule produces behind
  a proxy. Use the toggle.
- **`ErrorDocument 404 /404.html` must return a real 404.** Apache preserves the status when the
  target is a local path like this. What breaks it is a `RewriteRule` that rewrites unknown paths to
  `404.html` with a `200` — the soft 404 named in section 5.
- **Do not add a rule that strips `.html`** unless you commit to it in every link, every canonical
  and every `<loc>`. Otherwise both spellings answer and you have doubled the site, which is the
  last row of the table in section 4.

Compression and cache headers can also go here, and section 5 states the outcome they should
produce. Set them wherever this host actually reads them.

### A.2 Replacing a PHP application in the same root

This is the situation the appendix exists for, and the failures are specific.

**`index.html` does not automatically win.** Which file answers `/` is decided by `DirectoryIndex`,
and cPanel's default list includes `index.php`. Dropping an `index.html` next to a WordPress
install leaves the outcome to server configuration you did not write. So:

1. **Delete the WordPress files.** Do not cover them. `index.php`, `wp-admin/`, `wp-includes/`,
   `wp-content/`, `wp-config.php`, `xmlrpc.php`. An abandoned WordPress is also an unpatched one
   sitting in a public directory — the first vector named in section 5.
2. **Replace `.htaccess`, do not append to it.** WordPress installs a block that routes every
   unknown path to `index.php`. With `index.php` gone, that block turns every 404 into a server
   error. Yoast's sitemap is also served through it — `sitemap_index.xml` is not a file, it is a
   rewrite — so deleting WordPress without touching `.htaccess` makes the URL Google already knows
   return a `500` rather than a `404`.
3. **Set `DirectoryIndex` explicitly** anyway, as in A.1. It costs one line and removes the
   question.
4. **Redirect the URLs Google already has.** The old permalinks and `sitemap_index.xml` are in the
   index and will be requested for months. Every one that has an equivalent new page gets a `301`
   to it. The rest are allowed to 404 — that is the correct answer for a page that no longer
   exists, and it is how they leave the index.

The pages Google knows about are listed in Search Console under Pages, and in the old
`sitemap_index.xml` if you can still fetch it. Capture that list **before** deleting anything.

### A.3 The PHP cron, only if the host runs PHP

Discipline decays, so put a floor under it **when the host allows one**. On a cPanel account a Cron
Job can rescan the document root and rewrite the sitemap from what is actually there, which covers
the case where somebody uploaded a page by hand and skipped both steps above.

**If the host has no PHP, skip this entirely.** Nothing is lost — it was never the primary
mechanism, and steps 1 and 2 are complete without it. Do not treat its absence as a gap to work
around with a shell script; treat it as a reason to be stricter about step 2.

Place it **outside** the web root — in the account home, not `public_html` — so it cannot be
fetched over HTTP:

```php
<?php

/**
 * Rewrites sitemap.xml from the HTML actually present in the web root.
 * Run from a cPanel Cron Job. Idempotent: safe to run hourly or daily.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

$root = '/home/USER/public_html';
$base = 'https://example.com';
$skipDirs = ['assets', 'css', 'js', 'img', 'fonts', 'cgi-bin', 'partials'];
$skipFiles = ['404.html', '410.html', 'thank-you.html'];

$urls = [];
$tree = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
);

foreach ($tree as $file) {
    if (! $file->isFile() || strtolower($file->getExtension()) !== 'html') {
        continue;
    }

    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
    $segments = explode('/', $relative);
    $directories = array_slice($segments, 0, -1);

    // Every directory on the path, not just the first: a nested docs/partials/ is as much
    // a partial as a top-level one, and seo.mjs excludes it either way.
    if (array_intersect($directories, $skipDirs) !== [] || in_array(basename($relative), $skipFiles, true)) {
        continue;
    }

    // A page that asks not to be indexed does not belong in the sitemap.
    $html = (string) file_get_contents($file->getPathname());
    if (preg_match('/<meta[^>]+name=["\']robots["\'][^>]*content=["\'][^"\']*(noindex|none)/i', $html)) {
        continue;
    }

    // about/index.html is served as /about/, so that is the URL to publish.
    $path = preg_replace('#(^|/)index\.html$#', '$1', $relative);

    $urls[$base.'/'.$path] = gmdate('Y-m-d', $file->getMTime());
}

ksort($urls);

$xml = new XMLWriter();
$xml->openMemory();
$xml->setIndent(true);
$xml->startDocument('1.0', 'UTF-8');
$xml->startElement('urlset');
$xml->writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

foreach ($urls as $loc => $lastmod) {
    $xml->startElement('url');
    $xml->writeElement('loc', $loc);
    $xml->writeElement('lastmod', $lastmod);
    $xml->endElement();
}

$xml->endElement();
$xml->endDocument();

// Write then rename, so a crawler never reads a half-written sitemap.
$target = $root.'/sitemap.xml';
file_put_contents($target.'.tmp', $xml->outputMemory());
rename($target.'.tmp', $target);
```

Four details in there that are not decoration:

- **`XMLWriter`, not string concatenation.** It escapes `&` and `<` for you. Hand-built XML is how
  a sitemap becomes unparseable.
- **Write to `.tmp` then `rename`.** `rename` is atomic on the same filesystem, so a crawler
  fetching the file mid-run gets the old sitemap rather than half of the new one.
- **`ksort`** makes the output stable, so an unchanged site produces a byte-identical file and the
  diff is meaningful.
- **`gmdate` from `filemtime`** is the best `<lastmod>` available without a content store. It is
  honest about upload time, which is close enough, and it is why re-uploading an unchanged file has
  a cost.

The cron entry, in cPanel → **Cron Jobs**, once a day:

```text
/opt/cpanel/ea-php83/root/usr/bin/php -q /home/USER/sitemap-build.php
```

Confirm the interpreter path against cPanel → **MultiPHP Manager**, which shows the version the
account is actually on. `ea-php83` is a guess until you have read it, and a wrong path fails
silently unless the cron is set to email its output — set it to.

The script needs write permission on the web root. It has that by default when it runs as the
account owner, which is how cPanel crons run.



