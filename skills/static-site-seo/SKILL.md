---
name: static-site-seo
description: "Use when building or editing a static HTML site — creating, renaming, deleting or translating a page, changing its head or its structured data, or touching sitemap.xml, robots.txt or llms.txt. Trigger it even for a one-page change. Also use it for why a page is not appearing in search, why a translation cannot be found, why a whole site vanished from results, why an AI answer does not cite the site, which schema type or JSON-LD to write, whether a link is worth having, or adding a second language to an existing site."
---

# Static site SEO

## What this is

A workflow. It tells you what to DO and in what order; four companion contracts tell you what is
CORRECT. **This file deliberately restates none of their rules** — two copies of a rule means one of
them is wrong and nobody knows which.

| Contract | Owns |
|---|---|
| `references/seo-site.md` | the site: root files, URL shape, crawler access, delivery, HTTPS |
| `references/seo-page.md` | one page: `<head>`, body outline, Core Web Vitals, the shape an answer needs |
| `references/seo-schema.md` | all JSON-LD |
| `references/seo-offpage.md` | links, mentions, paid traffic — everything outside the files you upload |

The four contracts above are written stack-neutral, for any static output. **This project is built
with Astro, and the binding below is how the generic rule maps onto this specific repository** — read
it before opening a contract, because it tells you which real file each rule actually governs here.

## The Astro binding

| The contract talks about | In this repository, that is |
|---|---|
| a page's rendered `<head>`/body | a route file under `src/pages/**` (or `src/pages/[locale]/**`), rendered through its layout |
| the `<head>` tags themselves — title, description, canonical, OG, hreflang | `src/components/seo/SEO.astro`, which every page-level layout renders |
| JSON-LD | `src/components/seo/Schema.astro` and `src/components/seo/BreadcrumbsJsonLd.astro`, built from the typed builders in `src/lib/seo/schemas/*.ts` |
| brand defaults — site name, default title/description, social image | `src/lib/seo/defaults.ts` (`siteSeo`) |
| the URL shape, locales and the per-route slug map | `src/lib/seo/locale.ts` (`ROUTE_KEYS`, `localizedSlugs`) — **the single source of truth**; `astro.config.mjs` no longer keeps a second route map of its own, it derives the sitemap's `hreflang` links from this one through `hreflangLinksFor` (`src/lib/seo/sitemap.ts`), so a rename here reaches the pages and the sitemap together |
| `robots.txt`, `sitemap.xml`, the site origin and i18n routing | `astro.config.mjs` — the `site` field, the `i18n` block, and the `sitemap()` integration's `filter`/`serialize` options |
| the SEO check the contracts describe | `src/integrations/seo-lint/` (see below) — the repository's real, working, tested validator, not the tool the contracts describe below |

## The rule, and the real mechanism

**Any pass that adds, removes, renames or translates a page runs `bun run build` before you report
it as done, and reads its output.**

```bash
bun run build
```

That single command does everything the generic contracts ask for, because both pieces are already
wired into this project's `astro.config.mjs`:

- **`sitemap.xml` is regenerated automatically**, by the `@astrojs/sitemap` integration, from
  whatever routes the build actually produced. There is no separate generation step to remember and
  no `tools/seo.mjs build` to run — a renamed or removed page is reflected the moment the build runs
  again.
- **The SEO check runs automatically**, as the `seo-lint` Astro integration (`src/integrations/seo-lint/`),
  against every `.html` file the build wrote to `dist/`. It runs at `astro:build:done`, after the
  sitemap step, so it is checking the same output you are about to upload.

**A non-zero `bun run build` exit is not done.** `seo-lint` throws on any `fail`-severity finding,
which fails the whole build. Fix the findings, or say plainly which one you are leaving and why the
build was allowed to fail. Never report success over a build that did not finish.

`seo-lint`'s findings split into two severities. The two lists below are the complete set of codes
it emits, across `src/integrations/seo-lint/lint.ts` (one page at a time), `index.ts` (the build
output as a whole) and `routes.ts` (routes and the generated sitemap).

**`fail` — throws, and `bun run build` exits non-zero:**

<!-- seo-lint-codes:fail -->
- one page, from `lint.ts`: `TITLE_MISSING`, `DESC_MISSING`, `CANONICAL_MISSING`, `H1_MISSING`,
  `H1_MULTIPLE`, `IMG_ALT_MISSING`, `LD_PARSE_ERROR`
- the build output, from `index.ts`: `OG_IMAGE_404`
- routes, from `routes.ts`: `HTML_LANG_MISSING`, `LOCALE_CONTENT_MISMATCH`,
  `CANONICAL_NOT_CANONICAL_FORM`, `OG_URL_CANONICAL_MISMATCH`,
  `INTERNAL_LINK_NOT_CANONICAL_FORM`, `LOCALIZED_ROUTE_WITHOUT_ALTERNATES`
- the generated sitemap, from `routes.ts`: `SITEMAP_URL_NOT_CANONICAL_FORM`,
  `SITEMAP_NON_HTML_ENTRY`, `SITEMAP_ALTERNATES_MISSING`, `SITEMAP_LOC_DANGLING`,
  `SITEMAP_LOC_NOT_CANONICAL`, `SITEMAP_ALTERNATE_DANGLING`
<!-- /seo-lint-codes:fail -->

**`warn` — printed to the build log only; the build still succeeds:**

<!-- seo-lint-codes:warn -->
`TITLE_TOO_SHORT` (<30 chars), `TITLE_TOO_LONG` (>70), `DESC_TOO_SHORT` (<70),
`DESC_TOO_LONG` (>160), `OG_IMAGE_MISSING`, `LD_NO_CONTEXT`, `LD_LANG_MISMATCH`
<!-- /seo-lint-codes:warn -->

**Conditional — the build decides the severity:**

<!-- seo-lint-codes:conditional -->
- `SITEMAP_OUTPUT_MISSING` — `fail` when `@astrojs/sitemap` is configured, as it is in this
  repository, and the build emitted no URL-set sitemap anyway; `warn` on a site that configures
  no sitemap at all, where having none is the correct outcome. The integration reads the
  condition at `astro:config:done`, by looking for the sitemap integration in the resolved
  config, and grades the finding at `astro:build:done`.
<!-- /seo-lint-codes:conditional -->

That one is what stops a wrong integration order from silently switching every other sitemap gate
off: with `seoLint()` placed before `sitemap()`, no sitemap exists yet when the gates run, and
without this code the build would go green having checked nothing.

All three lists are machine-checked: `src/integrations/seo-lint/documented-codes.test.ts` compares
them against the codes the integration really declares, in both directions, and fails `bun run test`
if a code is added, removed or re-graded here or there. It also holds the conditional list to both
of its severities, so a code that stops being conditional cannot quietly stay in this section. The
HTML markers around the three lists are that test's anchors — keep them.

A clean `warn` list is worth reading anyway — nothing forces you to, and that is exactly why it gets
skipped. `OG_IMAGE_MISSING` in particular is silent on every category `seo-lint` cannot see for you:
a page with no social image still builds green.

**`tools/seo.mjs`, mentioned throughout the four generic contracts below, does not exist in this
repository and is not on any implementation plan.** Where a contract shows a `node tools/seo.mjs …`
command, read it as describing a stack-neutral reference implementation for a project with no Astro
integration of its own — never as something to run here. This project's answer to every one of those
commands is `bun run build`, and its own contract for exactly what that checks is the two code lists
above, not the generic script.

Three things that are still easy to get wrong, even with the build doing the regeneration for you:

- **Read the build output, not just its exit code.** A `warn` line does not fail the build and is
  therefore the easiest thing in this workflow to ship past.
- **`sitemap.xml` only lists what `sitemap()`'s `filter` lets through** — check `astro.config.mjs` if
  a page you expect is missing or a page you excluded (`/404`, `/coming-soon`, anything under
  `/og/` or `/api/`) shows up anyway.
- **A locale added to `i18n.locales` in `astro.config.mjs` with no matching entry in
  `src/lib/seo/locale.ts`** no longer builds clean. Astro's `fallback` still emits the new locale's
  pages, and `lintLocalizedRouteCoverage` (`routes.ts`) then sees a route emitted in more than one
  locale whose own head does not declare the complete reciprocal `hreflang` set, so the build fails
  with `LOCALIZED_ROUTE_WITHOUT_ALTERNATES`; a registered route missing its alternates in the
  sitemap fails with `SITEMAP_ALTERNATES_MISSING`. Both route through the same alternate-set
  validator, which checks each declaration's `hreflang` and `href` against the routes the build
  actually emitted — it is not a tag count. Expect `LOCALE_CONTENT_MISMATCH` too, on any fallback
  page left indexable while still carrying the default locale's `lang` and content.

## Which contract to open

Do not read all four. Open the one that owns what you are about to touch:

| You are about to | Open |
|---|---|
| write or edit a page's `<head>` | `references/seo-page.md` §1–4 |
| write body content, headings, images | `references/seo-page.md` §5–7 |
| make a page load faster | `references/seo-page.md` §6, then `references/seo-site.md` §5 |
| add or change JSON-LD | `references/seo-schema.md` |
| add, rename or delete a page | `references/seo-site.md` §3, then run the rule above |
| add a second language | `references/seo-site.md` §1 and `references/seo-page.md` §1, both, before writing anything |
| touch `robots.txt` or crawler access | `references/seo-site.md` §2 |
| decide whether a filter or parameter gets its own URL | `references/seo-site.md` §4 |
| set up hosting, HTTPS, caching | `references/seo-site.md` §5 |
| judge a link, or set up an ad campaign's landing page | `references/seo-offpage.md` |
| replace a PHP site with static files in the same root | `references/seo-site.md` appendix — and only then |

**The appendix in `references/seo-site.md` is gated.** Do not read it, and do not ask anyone to create an
`.htaccess` file, unless the developer has confirmed the site is replacing a PHP application in the
same document root. On every other host that material is noise, and following it invents a
requirement the host does not have.

## What `seo-lint` catches, and what it cannot

The two code lists above are the complete list of what actually runs in this repository. Compare them
against the generic contracts' own `check` description — `references/seo-site.md` and
`references/seo-schema.md` describe a `check` that also catches a page missing from the sitemap, a
sitemap entry with no file behind it, a `noindex` page listed anyway, a broken `hreflang` set, and a
`robots.txt` with no `Sitemap:` line.

**`seo-lint` does most of that.** It runs in three layers: `lint.ts` reads one built HTML file at a
time, and `index.ts` and `routes.ts` then run over the whole `dist/` tree — every emitted page,
every emitted non-HTML file, and the sitemap XML the build just wrote. So it does cross-check a
sitemap `<loc>` against the page set (`SITEMAP_LOC_DANGLING`) and against the emitted file tree
(`SITEMAP_NON_HTML_ENTRY`), it does compare a published `<loc>` with that page's own canonical
(`SITEMAP_LOC_NOT_CANONICAL`), and it does validate complete reciprocal `hreflang` sets across
pages and in the sitemap.

Three of those it still does not do. **`robots.txt` is never read** — nothing checks for a
`Sitemap:` line or for crawler access, so that one stays read-and-apply, using
`references/seo-site.md` §2 as the checklist. **A page missing from the sitemap is not caught
either**: the sitemap gates walk the sitemap's entries and check each one against the build output,
never the other way round, so an emitted page the `filter` silently dropped raises nothing — check
`sitemap.xml` yourself when you add a page. And a `noindex` page published in the sitemap anyway is
not flagged as such; the locale and alternate gates deliberately skip non-indexable pages, and the
`filter` in `astro.config.mjs` is what keeps `/404` and `/coming-soon` out.

**It says nothing about most of what the contracts cover.** It cannot see Core Web Vitals, judge
whether a passage is quotable, validate a schema type's properties beyond parsing as JSON, or know
anything about a link on somebody else's site. Those are read-and-apply, not check-and-fix. A green
`bun run build` means the tree is coherent on the axes in the code lists above — the floor, not the
goal.

## When a contract is missing something

Say so instead of inventing a rule. The contracts are versioned and published by the team that
maintains them; a rule you invent here is a rule the next person cannot find. If the gap is real,
report it with the release or commit you are working from.

The same applies to advice from anywhere else, and it is worth being blunt about: much of what
circulates about AI search and structured data is out of date or simply wrong. **If a rule is not in
one of these four files, do not apply it silently.** Name it, say where it came from, and let somebody
decide.
