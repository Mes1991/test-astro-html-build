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

**Question protocol.** The adoption wizard's Round 2 F row only records that search is wanted
(implement / substitute / disable / remove); its activation is "confirmed separately" through this
skill. Run the seven questions below as their own sequence after the wizard's rounds, never folded
into a wizard round:

- **One question per message.** Each message asks exactly one of the seven, with its own
  recommendation and reason, then STOPS and waits for the human's reply. Each such message is a
  one-question round, so it stays inside the wizard's five-question cap and its one-round-per-message
  rule (wizard §6); the sequence is seven such rounds, not one round of seven.
- **Only the human's reply answers a question.** Do not infer an answer from the request, from
  repository state, or from an earlier answer. When an earlier answer seems to settle a question,
  restate it as the recommendation, ask, and wait; it is confirmed only once the human replies
  (wizard §6: "only the human's own words skip a human decision"). Never write "already confirmed"
  for a question the human has not answered in this session.
- Do not present technically equivalent alternatives without guidance, do not assume locales, and
  do not silently switch exclusions on or off.

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
   the archive when scope is blog, built from `<pagefind-input>`, `<pagefind-filter-dropdown>` and
   `<pagefind-results>` (§4) — name those components in the recommendation. For whole-site scope, recommend a global modal reachable from
   every page: Pagefind documents `<pagefind-modal>` as trapping focus while open and closing on
   Escape, a backdrop click, or its own close button (still browser-tested per §5, not assumed
   from the docs). Recommend a dedicated `/search/` page instead only when the product needs
   shareable or bookmarkable result URLs — a modal's state is not addressable by URL.
4. **Existing listing, search and filters.** "How is each existing system replaced?" See
   **One owner** below — this question is mandatory whenever any exists, and its answer names the
   single owner of the listing, the search input and the filters.
5. **Results.** "What metadata and filters does each result need?" Mandatory minimum: title,
   excerpt, and URL, because a result without its matching excerpt cannot show why it matched; the
   Pagefind search API returns all three for every result (`url`, `excerpt`/`plain_excerpt`,
   `meta.title`, alongside other keys such as `sub_results`). For blog, recommend showing the date
   and category, with category as a Pagefind filter. The URL is the title link's target, not visible
   text; the date is localized to the page's locale and time-zone invariant (§3); a result missing
   date or category still renders; the excerpt starts with body text, never with the post header's
   date/category/reading-time line (§3). The default result template shows the linked title, the
   excerpt and up to three sub-results (Pagefind's `hide-sub-results` defaults to `false`); date and
   category still need a custom template that keeps its ARIA contract. Decide explicitly whether
   sub-results are kept or hidden. `hide-sub-results` is a boolean attribute (presence hides): add
   it when hiding, omit it when keeping — never write `hide-sub-results="false"` — record the choice
   in `DESIGN.md`, and browser-test it, so a result link never carries a `#anchor` unless the human
   chose sub-results.
   Leave images out unless the product asks (`show-images` defaults to `false`). Index `keywords`
   as searchable metadata, not as visible filters: Pagefind searches custom metadata by default,
   while filters suit a small set of exact, selectable values. Keywords are not localized per locale
   (unlike `category`); translating them, turning them into filters, or adding a separate `tags`
   taxonomy is a distinct decision the human must confirm.
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
   recommend the full HTML card listing with working links and no search or filter control at all,
   because every control there needs JavaScript (see **Fallback and no-JS** below). A link fallback
   applies only when the search component visually replaces the content it searches, and its
   destination depends on the confirmed scope.

**One owner for listing, search and filters.** Before asking question 4, inventory what already
exists — for this template, `BlogArchive.astro` renders a card grid, category tabs (`.blog-tab`)
and a local text filter (`#blog-search` over the `data-search` blob). If any listing, search input
or filter exists, STOP and propose, for each one, how it is replaced or unified; never keep two
systems running on your own decision, and never leave one "out of this task's scope". With Pagefind
active the page has exactly one listing, one search input and one set of filters. For
`BlogArchive`, recommend: Pagefind's results become the single listing once it initializes; the
local text filter is removed; the category tabs are removed and category becomes the Pagefind
filter; the HTML card grid remains only as the fallback defined below. Keeping the card grid as the
live listing driven by Pagefind results needs the raw JS API — an option only with the explicit
approval §2 requires.

**Fallback and no-JS.** The HTML card listing stays visible until Pagefind initializes
successfully; only then does the Pagefind-owned listing replace it. If Pagefind fails to load (no
index, `astro dev`, a network error), the card listing stays and no search or filter control is
shown. Without JavaScript, the cards and their links remain; no control that looks functional but
does nothing is visible — no inert tabs, no search icon over an empty input, no empty filter box.
Render such controls hidden (or only inside the Pagefind components) and reveal them from script
after initialization, never in the static HTML.

If these answers already live in a `DESIGN.md` contract the human reaffirms for the session (wizard
§1), do not ask again. Do not activate search merely because a blog or search-looking control
exists.

**Contract summary before authorization.** After the seven replies, and before ANY write, install
or delegation, present the summary and wait for the human's explicit confirmation. It goes inside
the wizard §9 contract fields (the wizard fixes those fields, so do not add new ones), or, when
search reopens an already confirmed contract, in the reopened fields. It must state, besides the
seven answers:

- **First write:** after the Git boundary the confirmed Git policy requires, the first file write
  is the confirmed contract in `DESIGN.md` (wizard §9) — never a task file, never an install.
- **Gate strategy:** the permanent coverage gate of §5 — how the expected set is built, where the
  indexed set is read from, and that `bun run build` fails on any mismatch.
- **Single owner:** which component owns the one listing, the one search input and the one filter
  set (inline blog: `<pagefind-results>` — with `hide-sub-results` when sub-results are hidden —,
  `<pagefind-input>`,
  `<pagefind-filter-dropdown filter="category">`), and what happens to each existing listing,
  search and filter.
- **Subpath status:** root `/` only; a non-root `base` (the `/preview` matrix) is NOT_SUPPORTED
  (§4) and is recorded as such in `DESIGN.md` and in the final report.
- **Lockfile policy:** the only intended `bun.lock` change is the `pagefind` devDependency; any
  other hunk is explained and verified, or reverted; temporary probes leave no trace (§5).
- **Verification route:** `bun run build` / `bun run search:preview`, never `astro dev` (`astro dev`
  has no finished index).

An agent's own "contract confirmed" is not authorization; silence or a follow-up question is not a
yes (adoption wizard §2).

## 2. Preserve the architecture

- Use Bun (`packageManager: "bun@1.2.13"` in `package.json`) and the official `pagefind` CLI or its
  Node API. Do not add `astro-pagefind`, React, Fuse, Algolia or another provider unless the
  confirmed contract requires it.
- Run Pagefind exactly once per build, after Astro has finished writing `dist/` (the default output
  directory; `astro.config.mjs` sets no `outDir`).
- Treat `dist/pagefind/` as generated output. Do not copy it to `public/` or commit it.
- Keep internal search, robots and sitemap independent. `bun run build` already runs `seo-lint`
  (`src/integrations/seo-lint/`); search inclusion must never be derived from `noindex`, sitemap,
  or canonical — different contracts, different signals.
- Use Pagefind Component UI web components (Pagefind ≥ 1.5) as the default. Start with the default
  templates; custom result templates must preserve their ARIA contract. If the Component UI cannot
  fit the existing UI — for example the archive's category tabs or cards — STOP and ask the human
  instead of deciding. Name the options: adapt the design to the Component UI; customize the
  Component UI templates while keeping their ARIA contract; or use the raw Pagefind JS API — the
  last only with explicit approval, and then the agent owns accessibility (live-region
  announcements, focus, keyboard) and must prove it in the browser tests (§5).

`package.json`'s `build` script is `astro build` today, a single stage. Activating Pagefind turns it
into three explicit stages with one build owner — **Astro build → Pagefind index → Pagefind coverage
verification**:

```json
{
  "scripts": {
    "build:astro": "astro build",
    "search:index": "pagefind --site dist",
    "search:verify": "bun scripts/search-coverage.ts",
    "build": "bun run build:astro && bun run search:index && bun run search:verify",
    "search:preview": "bun run build:astro && pagefind --site dist --serve",
    "audit": "bun run build && lhci autorun",
    "audit:mobile": "bun run build && lhci autorun --config=lighthouserc.mobile.json"
  }
}
```

`audit` and `audit:mobile` currently call `astro build` directly, not `bun run build` — if
Pagefind is activated they must be repointed too, or the audits run against an unindexed `dist/`.
Script names are illustrative; the three stages, their order, and `bun run build` as their single
owner are not. Do not add both a chained `build` command and a `postbuild`.

Install with the repo's version policy and Bun, for example `bun add --dev "pagefind@^1.5.2"`. Let
`bun.lock` pin the resolved artifact. After installing, read `git diff bun.lock`: every hunk must be
attributable to `pagefind`. Explain any other hunk (an indirect bump or a new nested copy) in the
commit and the report, and revert it unless the contract accepts it. Never report the lockfile as
"restored" or "unchanged" while `git diff` shows otherwise.

`astro dev` has no finished index. Use `bun run search:preview` for real search testing and do not
report dev-mode 404s for `/pagefind/*` as a production failure.

## 3. The distinction to explain, and the index to define

`BlogArchive.astro`'s current client-side filter searches only the title, description, category
and keywords already rendered into each card (`data-search` blob, built from `fields()`), against
posts already on the page. Pagefind searches the full HTML body of indexed pages. These are not
equivalent, which is why §1 gives the whole job to one owner.

Put `data-pagefind-body` only on the content regions in the confirmed scope. Once one page uses it,
every included page must use it; pages without it are excluded. For blog-only search, mark the
rendered post article, not `BaseLayout`, the header, footer or archive listing. Keep the post
header's visible text (date · category · reading time, title, description) out of the indexed
content so excerpts start with body text: mark that header `data-pagefind-ignore` (its default
mode excludes the element from the index but still processes the filters and metadata inside it;
`data-pagefind-ignore="all"` drops them too — pagefind.app/docs/indexing), or scope
`data-pagefind-body` to the body wrapper and keep the metadata elements inside it. Add
explicit metadata and filters from emitted values:

```astro
<article data-pagefind-body>
  <header data-pagefind-ignore>
    <h1 data-pagefind-meta="title">{title}</h1>
    <!-- Add image, date and filters only when the confirmed contract requires them. -->
    {date && <span hidden data-pagefind-meta={`date:${fmtDate(date)}`}></span>}
    {category && <span data-pagefind-filter="category">{category}</span>}
    {keywords.length > 0 && <span hidden data-pagefind-meta={`keywords:${keywords.join(", ")}`}></span>}
  </header>
  <Content />
</article>
```

Use a separate explicit `search` field only when the product needs per-page opt-out. Never derive
it from `noindex` or `sitemap`. Do not use the reserved filter keys `any`, `all`, `none` or `not`.

**Time-zone invariant dates.** `datePublished` is a calendar date (`z.string()`, ISO 8601), and
`new Date("2024-06-15")` is UTC midnight: formatting it in the build machine's or browser's zone
shifts it a day on any zone behind UTC. Every visible date and every date passed to Pagefind
(metadata, sort keys, a result template that formats client-side) is formatted with an explicit
`timeZone: "UTC"` (or from the date-only string itself). This includes the existing archive cards
(`BlogArchive.astro`'s `dateFormatter` has no `timeZone` today).

## 4. Add UI without a framework island

Use the Pagefind Component UI assets generated in `dist/pagefind/`. Derive paths from Astro's
`BASE_URL` so the component's path logic stays base-aware; this does not by itself verify subpath
deployment. The template supports root deployment only: a non-root `base` (the `/preview` matrix,
both `trailingSlash: "never"` and `"always"`) is NOT_SUPPORTED until `implementation-roadmap.md`
phase F ("Template subpath deployment contract") is Implemented. Record it as NOT_SUPPORTED in
`DESIGN.md` and in the final report — never omit it, never report it as passing, and do not attempt
to fix template subpath support inside a search activation. Verify search at root `/`.

Inline in `BlogArchive` (scope: blog) — the HTML card listing is the fallback (§1), so no
`<noscript>` link is added here:

```astro
---
const rawBase = import.meta.env.BASE_URL;
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const bundle = `${base}pagefind/`;
const categoryLabel = t("blog.search.category", locale); // t(key, locale); key name illustrative
---

<link href={`${bundle}pagefind-component-ui.css`} rel="stylesheet" />
<script is:inline src={`${bundle}pagefind-component-ui.js`} type="module"></script>

<pagefind-config bundle-path={bundle} base-url={base} preload faceted></pagefind-config>
<div data-search-ui hidden>
  <pagefind-input></pagefind-input>
  <pagefind-filter-dropdown filter="category" label={categoryLabel}></pagefind-filter-dropdown>
  <pagefind-results hide-sub-results></pagefind-results>
</div>
<!-- The HTML card grid, visible until Pagefind initializes; then hidden. -->
```

Use the composable building blocks, not the all-in-one `<pagefind-searchbox>`: the searchbox has
no filter support and exposes `show-sub-results` (default `false`), not `hide-sub-results`
(pagefind.app/docs/components/searchbox). `<pagefind-filter-dropdown>` requires `filter` naming the
Pagefind filter key; `hide-sub-results` is a documented `<pagefind-results>` attribute (default
`false`, pagefind.app/docs/components/results), present in this snippet to illustrate the hidden
choice, and omitted when the confirmed contract keeps sub-results (§1 Q5). With Pagefind
active, `<pagefind-results>` is the one listing and the dropdown the one filter set (**One owner**).

The wrapper starts `hidden`, so initialization cannot wait for user focus (by default Pagefind
loads on first interaction, and a hidden input never gets one). `preload` loads the index on page
load; `faceted` makes an empty term return all results (pagefind.app/docs/components/config), which
the "empty query shows all posts" state needs. Hand the listing over with the documented instance
events (pagefind.app/docs/custom-components: `getInstanceManager()` → `getInstance("default")`,
events `results` and `error`, `triggerLoad()`): on the first `results` event for the empty query,
reveal `[data-search-ui]` and hide the card grid; on `error`, or if no results ever arrive, keep the
grid visible and the controls hidden (§1). The docs show the manager imported from
`@pagefind/component-ui`; with the generated bundle, confirm the export in
`dist/pagefind/pagefind-component-ui.js` before relying on it, and raise a misfit (§2) if the
installed components expose no such handshake. Browser-test the initial empty-query state (all
published posts shown by `<pagefind-results>`, grid hidden), a missing-index failure (grid stays,
controls stay hidden), and the sub-results choice with a post that has several matching headings.

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

Do not close on the existence of `dist/pagefind/`.

### Permanent coverage gate

A versioned gate, invoked by `bun run build` as its third stage (§2), that fails the build on any
mismatch. It needs no browser — a browser is for UI behaviour only (below).

- **Expected set** — from the confirmed scope, NEVER from `data-pagefind-body`, `dist/pagefind/`,
  the index or any Pagefind marker (deriving it from them shrinks "expected" and "actual" together,
  and the gate passes for the wrong reason). For blog scope: published posts — the `blog`
  collection's entries without `draft: true` — times the emitted locales, each mapped through
  `postPathFor(slug, locale)` in `src/lib/seo/locale.ts`, the only route map. Either read the
  collection's source frontmatter, or emit a build-time manifest from
  `getCollection("blog", (e) => !e.data.draft)`; any new parser dependency falls under the lockfile
  policy (§2). Whole-site scope: emitted HTML routes minus an explicit exclusion manifest;
  selected-routes scope: an explicit, independent route manifest.
- **Indexed set** — from Pagefind's own artifacts, per language: `dist/pagefind/pagefind-entry.json`
  lists the languages, and each `dist/pagefind/fragment/*.pf_fragment` gunzips to one page's JSON
  (`url`, `meta`, `filters`; strip a leading `pagefind_dcd` signature if present), its language
  given by the fragment's filename prefix. Alternatively the Node API (`createIndex`, then
  `addDirectory`, `writeFiles`) can index and inspect in the same stage — but then it IS the
  single indexing run, never a second one. Do not use `forceLanguage`: it exists, but it collapses
  every page into one language; the gate compares the default split by `<html lang>`. Confirm the
  artifact layout against the installed Pagefind version in the gate's own tests.
- **Comparison** — per language, bidirectional; fail naming every missing and every extra URL, in
  canonical trailing-slash form. Losing `data-pagefind-body` from a page must fail the gate (a
  language or URL disappears from the index while still expected).
- **Tests** — the gate's logic lives in a module with its own vitest tests and small fixtures (a
  few fake fragments and posts: pass, missing, extra, draft, wrong language), under
  `src/**/*.test.ts` so `bun run test` runs them (`vitest.config.ts` includes only that pattern).

### Minimum adversarial acceptance

Execute each mutation against the real build, report the observed output, and restore it
byte-for-byte (prove it: `git status --short` and `git diff` empty for the touched files, or matching
SHA-256):

| Mutation | Required result |
|---|---|
| Remove `data-pagefind-body` from an EN post | `bun run build` fails naming `/blog/<slug>/` |
| Remove it from an ES post | Fails naming `/es/blog/<slug>/` |
| Add a published post | Appears in the expected set with no gate edit; build passes once indexed |
| Mark that post `draft: true` | Leaves the expected set, the route and the index |
| Inject an extra URL into the index (e.g. `data-pagefind-body` on a non-post page) | Fails naming that URL |
| Build and browse under another time zone (e.g. `TZ=America/Mexico_City`, browser `timezoneId`) | Every visible date unchanged |
| JavaScript on | Exactly one listing, one search input and one filter set |
| JavaScript off | Cards and links present; no fake controls (no inert tabs, no search icon) |

Also mutate: break one emitted `html lang`, break the bundle/base path, add a second Pagefind
owner — each must fail for the intended reason and be restored.

### Single ownership

Walk the command graph reachable from `bun run build` (including lifecycle hooks and integrations)
and confirm it reaches Pagefind indexing exactly once; a PATH shim/counting wrapper must observe
exactly one Pagefind process during the same run. Repeat for `bun run search:preview`, an
alternative entrypoint that may call Pagefind once without becoming a second production-build
owner. Restore the shim after the test.

### Browser behaviour

Proven in a real browser — Playwright with Chromium — never from the search API alone, at root `/`
(`bun run search:preview`). When the project has no browser tooling, run a temporary probe from a
scratch directory outside the repository with its own `package.json`, so the repository's
`package.json` and `bun.lock` are never touched. If a probe did touch the repository, remove it
completely, then prove the final diff holds only what an adopter would ship: `git status --short`
lists no probe file, and `git diff bun.lock` holds only the §2 `pagefind` hunks. Report any ignored
residue (for example under `node_modules/`) rather than claiming a clean tree.

Minimum scenarios, both locales: a term only in a post body is found, with a highlighted excerpt
that starts with body text, not header text; `/blog/` shows no Spanish results and `/es/blog/` no
English; several heading matches render as one result, with no `#anchor` link (unless sub-results
were chosen); category works as the only filter; a keyword-only term finds its post, with no
keyword filter shown; a result shows linked title, excerpt, localized date and category, and still
renders with a long title or no category; an empty query shows every published post; zero results
are announced; visible focus while navigating results; full keyboard navigation reaches and
activates a result; for a modal, focus is trapped while open, it closes on Escape, a backdrop click
or its close button, and focus returns to its trigger; for inline, focus returns to the search field
after selecting or closing results; the card grid is visible before initialization and when
Pagefind fails; the JS-on and JS-off rows above; adding, drafting and deleting a post each change
results after a rebuild (then remove the fixture completely).

### Report and repository gates

The final report states: the gate's observed output for every acceptance row; `/preview`
NOT_SUPPORTED (matching `DESIGN.md`); the `bun.lock` diff and its explanation; which claims are
evidence and which are inference — attribute each limitation to the component that has it (the
browser runtime `pagefind.js` has no language override; the Node API has `forceLanguage`).

Run the repository gates last:

```bash
bun run test
bun run check
bun run build
git diff --check
```

Confirm no fixtures, mutation residue, temporary indexes, probe files or generated `dist/` files are
staged.
