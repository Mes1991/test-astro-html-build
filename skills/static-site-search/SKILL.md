---
name: static-site-search
description: "Use when adding, changing, removing or debugging internal full-text search in this Astro static template, including Pagefind indexing, search UI, indexed scope, metadata, filters, locales, subpath hosting, or stale results. Also use when deciding whether the existing blog-card filter is sufficient. Do not use for search-engine SEO, CMS synchronization, private/live application search, or a backend search API."
---

# Static site search

> **Opt-in extension.** This skill documents how to add full-text search over already-built HTML
> using Pagefind. The template ships without it: no dependency, no build step, no UI. A project
> adopts it only after the contract in step 1 is confirmed.
>
> **Activation gate.** The existence of a blog, or of a search-looking control, is not
> authorization to install anything. Confirm the contract below before any write.

## 1. Confirm the contract

Before writing, obtain or read the confirmed answers for:

- scope: blog, whole site, or selected routes;
- UI: inline, dedicated page, or modal;
- locales: separate indexes by `<html lang>` and one search surface per locale — a single
  multilingual index is a different contract, out of scope for this skill;
- filters and required result metadata; title and URL are the minimum, other fields are opt-in;
- whether the existing `BlogArchive.astro` card filter (see §3 below) is replaced or retained;
- optional per-page search exclusion, independent of `noindex` and sitemap;
- fallback label and navigable destination when JavaScript is unavailable.

If these answers already live in a `DESIGN.md` reaffirmed for the session, do not ask again. Do
not activate search merely because a blog or search-looking control exists.

## 2. Preserve the architecture

- Use Bun (`packageManager: "bun@1.2.13"` in `package.json`) and the official `pagefind` CLI. Do
  not add `astro-pagefind`, React, Fuse, Algolia or another provider unless the confirmed contract
  requires it.
- Run Pagefind exactly once, after Astro has finished writing `dist/` (the default output
  directory; `astro.config.mjs` sets no `outDir`).
- Treat `dist/pagefind/` as generated output. Do not copy it to `public/` or commit it.
- Keep internal search, robots and sitemap independent. `bun run build` already runs `seo-lint`
  (`src/integrations/seo-lint/`); search inclusion must never be derived from `noindex`, sitemap,
  or canonical — different contracts, different signals.
- Use Pagefind Component UI web components (Pagefind ≥ 1.5). Start with the default templates;
  custom result templates must preserve their ARIA contract.

`package.json`'s `build` script is `astro build` today, a single stage. Activating Pagefind means
splitting it into an explicit second stage, with one build owner:

```json
{
  "scripts": {
    "build:astro": "astro build",
    "search:index": "pagefind --site dist",
    "build": "bun run build:astro && bun run search:index",
    "search:preview": "bun run build:astro && pagefind --site dist --serve",
    "audit": "bun run build && lhci autorun",
    "audit:mobile": "bun run build && lhci autorun --config=lighthouserc.mobile.json"
  }
}
```

`audit` and `audit:mobile` currently call `astro build` directly, not `bun run build` — if
Pagefind is activated they must be repointed too, or the audits run against an unindexed `dist/`.

Install with the repo's version policy and Bun, for example `bun add --dev "pagefind@^1.5.2"`. Let
`bun.lock` pin the resolved artifact. Do not add both a chained `build` command and a `postbuild`.

`astro dev` has no finished index. Use `bun run search:preview` for real search testing and do not
report dev-mode 404s for `/pagefind/*` as a production failure.

## 3. The distinction to explain, and the index to define

`BlogArchive.astro`'s current client-side filter searches only the title, description, category
and keywords already rendered into each card (`data-search` blob, built from `fields()`), against
posts already on the page. Pagefind searches the full HTML body of indexed pages. These are not
equivalent, and the contract in step 1 must say which one owns which job — coexistence without a
decision means two ambiguous searches.

Put `data-pagefind-body` only on the content regions in the confirmed scope. Once one page uses it,
every included page must use it; pages without it are excluded. For blog-only search, mark the
rendered post article, not `BaseLayout`, the header, footer or archive listing. Add explicit
metadata and filters from visible emitted values:

```astro
<article data-pagefind-body>
  <h1 data-pagefind-meta="title">{title}</h1>
  <!-- Add image, date and filters only when the confirmed contract requires them. -->
  {image && <img
    src={image.src}
    alt={imageAlt}
    data-pagefind-meta="image[src], image_alt[alt]"
  />}
  {category && <span data-pagefind-filter="category">{category}</span>}
  {tags?.map((tag) => <span data-pagefind-filter="tag">{tag}</span>)}
  <Content />
</article>
```

Use a separate explicit `search` field only when the product needs per-page opt-out. Never derive
it from `noindex` or `sitemap`. Do not use the reserved filter keys `any`, `all`, `none` or `not`.

## 4. Add UI without a framework island

Use the Pagefind Component UI assets generated in `dist/pagefind/`. Derive paths from Astro's
`BASE_URL` so the component works whether the site is served at root or under a configured `base`:

```astro
---
interface Props {
  fallbackHref: string;
  fallbackLabel: string;
}

const rawBase = import.meta.env.BASE_URL;
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const bundle = `${base}pagefind/`;
const { fallbackHref, fallbackLabel } = Astro.props;
---

<link href={`${bundle}pagefind-component-ui.css`} rel="stylesheet" />
<script is:inline src={`${bundle}pagefind-component-ui.js`} type="module"></script>

<pagefind-config bundle-path={bundle} base-url={base}></pagefind-config>
<pagefind-searchbox></pagefind-searchbox>
<noscript><a href={fallbackHref}>{fallbackLabel}</a></noscript>
```

Pass a canonical, base-aware `fallbackHref`; do not build it by raw string concatenation. Place the
stylesheet and script through the page's existing head slot when possible, and place
`<pagefind-config>` before the UI components.

Rely on `<html lang>` for language selection — `BaseLayout.astro` already emits `<html lang={lang}>`
per locale — and do not set `force-language`. Confirm each generated locale page has the correct
`lang` and a search surface in that same locale; a lone English `/search/` is not proof Spanish
search works.

## 5. Verify the real capability

Do not close on the existence of `dist/pagefind/`. Before indexing, derive the expected URL set
from a source independent of Pagefind markers and output (published content entries × emitted
locales, using `src/lib/seo/locale.ts`, for blog-only search; an explicit manifest for other
scopes). Compare expected and actual URLs bidirectionally.

Then query the generated index through Pagefind's public browser API and record evidence for: one
unique term per included locale absent from the other; exact expected URLs and no unexpected URL;
canonical trailing-slash form and a non-root `base`; title/URL plus only the contract's declared
metadata and filters; header/footer sentinel absent from snippets; Unicode and diacritics; zero
results; deleting a post and rebuilding removes its term and URL; Pagefind executes exactly once.

Prove single ownership: walk the command graph reachable from `bun run build` (including lifecycle
hooks and integrations) and confirm it reaches Pagefind exactly once; a PATH shim/counting wrapper
must observe exactly one Pagefind process during the same run. Repeat for `bun run search:preview`,
an alternative entrypoint that may call Pagefind once without becoming a second production-build
owner. Restore the shim after the test.

Separately, use a real browser on the Component UI to verify keyboard navigation, focus, accessible
zero-results announcement, each locale's surface, and the agreed no-JS fallback — the search API
alone cannot prove these. Test base handling at root, then under a configured `base` with
`trailingSlash: 'never'` and again with `'always'` (this repo's `astro.config.mjs` currently sets
`trailingSlash: 'always'`).

Mutate before accepting: remove `data-pagefind-body` from an expected page, break one emitted
`html lang`, break the bundle/base path, add a second Pagefind owner. Each mutation must fail for
the intended reason and be restored.

Run the repository gates last:

```bash
bun run test
bun run check
bun run build
git diff --check
```

Confirm no fixtures, mutation residue, temporary indexes or generated `dist/` files are staged.
