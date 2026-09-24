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
> Adding search to a site built on this template is an adoption request under `CLAUDE.md` rule 0:
> open `skills/site-build/references/adoption-wizard.md` first, and delegate to no subagent — not
> even read-only reconnaissance — until the contract is confirmed; read what you need directly.

## 1. Confirm the contract

Before writing, ask these seven questions explicitly — do not infer answers from the request or
from repository state — and state a recommendation with its reason for each one. Do not present
technically equivalent alternatives without guidance, do not assume locales, and do not silently
switch exclusions on or off.

1. **Scope.** "Does search cover the blog, the whole site, or specific routes?" Recommend blog
   when the request comes from the post archive — the narrowest scope matching the request, so
   nothing gets indexed the product never asked to search.
2. **Locales.** "Should search exist in every active locale, or only some?" Recommend one search
   surface per locale with same-language results, because Pagefind loads the index matching
   `<html lang>` and searches only same-language pages. For this template: `/blog/` searches
   English only, `/es/blog/` Spanish only; translate the placeholder, empty state and labels.
   Never assume the answer from the site's current locale set.
3. **UI.** "Inline, dedicated page, or global modal?" When the request carries a design source
   (Figma, screenshots, `DESIGN.md`), derive the recommendation from where it places search and
   cite that frame; the defaults below apply only when no design shows search. Recommend inline in
   the archive when scope is blog — the card listing already renders there. For whole-site
   scope, recommend a global modal reachable from every page: Pagefind documents
   `<pagefind-modal>` as trapping focus while open and closing on Escape, a backdrop click, or its
   own close button (still browser-tested per §4/§5, not assumed from the docs). Recommend a
   dedicated `/search/` page instead only when the product needs shareable or bookmarkable result
   URLs — a modal's state is not addressable by URL.
4. **Existing filter.** "Is the `BlogArchive.astro` filter kept, replaced, or integrated with
   Pagefind?" For `BlogArchive`, recommend replacing the local text search with Pagefind — one
   field, one result source — because leaving both live risks two fields returning different
   results for the same query. The HTML card listing stays as the initial state and the no-JS
   fallback; an empty query shows every post.
5. **Results.** "What metadata and filters does each result need?" Mandatory minimum: title,
   excerpt, and URL, because a result without its matching excerpt cannot show why it matched; the
   Pagefind search API returns all three for every result (`url`, `excerpt`/`plain_excerpt`,
   `meta.title`, alongside other keys such as `sub_results`). For blog, recommend showing the date
   and category, with category as a Pagefind filter. The URL is the title link's target, not visible
   text; the date is localized to the page's locale; a result missing date or category still
   renders. The default result template shows only the linked title and excerpt, so date and
   category need a custom template that keeps its ARIA contract. Leave images out unless the product
   asks (`show-images` defaults to `false`). Index `keywords` as searchable metadata, not as visible
   filters: Pagefind searches custom metadata by default, while filters suit a small set of exact,
   selectable values. Keywords are not localized per locale (unlike `category`); translating them,
   turning them into filters, or adding a separate `tags` taxonomy is a distinct decision the human
   must confirm.
6. **Exclusions within scope.** "Within the confirmed routes, is there content that must not
   appear?" For blog-only scope, recommend no extra exclusion, because indexing already follows
   `data-pagefind-body` alone: pages without the mark are excluded by that mark alone. Do not
   raise 404 or coming-soon pages for a blog-only scope — they are outside that scope, not an
   exclusion inside it. Keep the contracts separate: `draft: true` controls publication (the
   route is never generated), `data-pagefind-body` controls which published HTML Pagefind reads,
   and `noindex`, sitemap and canonical never change internal search. Pagefind does not read
   frontmatter — only emitted HTML — so prove the draft filter rather than trust it. Add no
   manual lists or heuristic exclusions; a real exclusion needs its own explicit contract.
7. **No-JavaScript fallback.** "What remains available without JavaScript?" For `BlogArchive`,
   recommend keeping the full HTML card listing visible, because it already exists and needs no
   new fallback page. A link fallback applies only when the search component visually replaces
   the listing, and its destination depends on the confirmed scope.

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
  {keywords.length > 0 && <span hidden data-pagefind-meta={`keywords:${keywords.join(", ")}`}></span>}
  <Content />
</article>
```

Use a separate explicit `search` field only when the product needs per-page opt-out. Never derive
it from `noindex` or `sitemap`. Do not use the reserved filter keys `any`, `all`, `none` or `not`.

## 4. Add UI without a framework island

Use the Pagefind Component UI assets generated in `dist/pagefind/`. Derive paths from Astro's
`BASE_URL` so the component works whether the site is served at root or under a configured `base`:

Inline in `BlogArchive` (scope: blog) — the card listing (§1 Q7) is already the no-JS fallback, so
no `<noscript>` link is added here:

```astro
---
const rawBase = import.meta.env.BASE_URL;
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const bundle = `${base}pagefind/`;
---

<link href={`${bundle}pagefind-component-ui.css`} rel="stylesheet" />
<script is:inline src={`${bundle}pagefind-component-ui.js`} type="module"></script>

<pagefind-config bundle-path={bundle} base-url={base}></pagefind-config>
<pagefind-searchbox></pagefind-searchbox>
```

A replacement page or modal trigger — one that visually replaces the content it searches — needs
the `<noscript>` link, with a canonical, base-aware `fallbackHref` matching the confirmed scope,
never built by raw string concatenation:

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

Place the stylesheet and script through the page's existing head slot when possible, and place
`<pagefind-config>` before the UI components.

If the confirmed UI is a global modal, `<pagefind-modal>` is documented to open over the page
content, trap focus while open, and close on Escape, a backdrop click, or its own close button —
verify this in a real browser per §5, not from the documentation alone.

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

For a blog-only bilingual activation, additionally verify: a term that only appears in the post body
(not in any card metadata) is found; `/es/blog/` returns no English posts; `/blog/` returns no
Spanish posts; a post with no category still appears; a term that only appears in a post's keywords
finds it, with no keyword filter shown; each result shows title, excerpt, date and category, links
to the correct URL without printing it, highlights the match in the excerpt, localizes the date in
English and Spanish, and still renders with a long title or with no category; full keyboard
navigation reaches and activates a result; if a modal was chosen, it closes on Escape; with
JavaScript disabled the full card listing stays accessible; a temporary `draft: true` post has no
route in `dist/` and its unique term is absent from the index, and both appear once it is published
and rebuilt (then remove the fixture completely); adding a post and rebuilding makes it findable;
deleting a post and rebuilding removes it; and removing `data-pagefind-body` from a post expected in
scope fails the coverage gate, naming that post's URL.

Run the repository gates last:

```bash
bun run test
bun run check
bun run build
git diff --check
```

Confirm no fixtures, mutation residue, temporary indexes or generated `dist/` files are staged.
