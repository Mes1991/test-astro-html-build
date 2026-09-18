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
| the URL shape, locales and the per-route slug map | `src/lib/seo/locale.ts` (`ROUTE_KEYS`, `localizedSlugs`) — **and it must stay in sync with the sitemap `ROUTE_MAP` in `astro.config.mjs`**; the two are one fact recorded in two files, and a rename that updates only one produces a page whose own `<link rel="alternate">` tags disagree with what the sitemap submits |
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

`seo-lint`'s findings split into two severities — read `src/integrations/seo-lint/lint.ts` yourself
before relying on this table if either the linter or the project has moved since this was written:

| Severity | Effect | Codes |
|---|---|---|
| **`fail`** | throws, and `bun run build` exits non-zero | `TITLE_MISSING`, `DESC_MISSING`, `CANONICAL_MISSING`, `H1_MISSING`, `H1_MULTIPLE`, `IMG_ALT_MISSING`, `LD_PARSE_ERROR`, `OG_IMAGE_404` |
| **`warn`** | printed to the build log only; the build still succeeds | `TITLE_TOO_SHORT` (<30 chars), `TITLE_TOO_LONG` (>70), `DESC_TOO_SHORT` (<70), `DESC_TOO_LONG` (>160), `OG_IMAGE_MISSING`, `LD_NO_CONTEXT`, `LD_LANG_MISMATCH` |

A clean `warn` list is worth reading anyway — nothing forces you to, and that is exactly why it gets
skipped. `OG_IMAGE_MISSING` in particular is silent on every category `seo-lint` cannot see for you:
a page with no social image still builds green.

**`tools/seo.mjs`, mentioned throughout the four generic contracts below, does not exist in this
repository and is not on any implementation plan.** Where a contract shows a `node tools/seo.mjs …`
command, read it as describing a stack-neutral reference implementation for a project with no Astro
integration of its own — never as something to run here. This project's answer to every one of those
commands is `bun run build`, and its own contract for exactly what that checks is the table above,
not the generic script.

Three things that are still easy to get wrong, even with the build doing the regeneration for you:

- **Read the build output, not just its exit code.** A `warn` line does not fail the build and is
  therefore the easiest thing in this workflow to ship past.
- **`sitemap.xml` only lists what `sitemap()`'s `filter` lets through** — check `astro.config.mjs` if
  a page you expect is missing or a page you excluded (`/404`, `/coming-soon`, anything under
  `/og/` or `/api/`) shows up anyway.
- **A locale added to `i18n.locales` in `astro.config.mjs` with no matching entry in
  `src/lib/seo/locale.ts`** produces pages that build and lint clean but carry no `hreflang`
  alternate for the new locale — `seo-lint` cannot see this, because it checks one page at a time and
  this is a cross-page consistency rule.

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

The FAIL/WARN table above is the complete list of what actually runs in this repository. It is
narrower than the generic contracts' own `check` description — `references/seo-site.md` and
`references/seo-schema.md` describe a `check` that also catches a page missing from the sitemap, a
sitemap entry with no file behind it, a `noindex` page listed anyway, a broken `hreflang` set, and a
`robots.txt` with no `Sitemap:` line. **`seo-lint` does none of that.** It reads one built HTML file
at a time; it has no notion of the sitemap, `robots.txt`, or any other page, so it cannot cross-check
one page's canonical against another page's, or the sitemap against the file tree. Those checks
remain read-and-apply here: look at `sitemap.xml` and `robots.txt` yourself when a page is added,
renamed or removed, using `references/seo-site.md` §3–4 as the checklist.

**It says nothing about most of what the contracts cover.** It cannot see Core Web Vitals, judge
whether a passage is quotable, validate a schema type's properties beyond parsing as JSON, or know
anything about a link on somebody else's site. Those are read-and-apply, not check-and-fix. A green
`bun run build` means the tree is coherent on the axes in the table above — the floor, not the goal.

## When a contract is missing something

Say so instead of inventing a rule. The contracts are versioned and published by the team that
maintains them; a rule you invent here is a rule the next person cannot find. If the gap is real,
report it with the release or commit you are working from.

The same applies to advice from anywhere else, and it is worth being blunt about: much of what
circulates about AI search and structured data is out of date or simply wrong. **If a rule is not in
one of these four files, do not apply it silently.** Name it, say where it came from, and let somebody
decide.
