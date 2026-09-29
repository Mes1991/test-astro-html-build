# PF-A — Static search skill (skill-only)

**This is not a phase of `docs/product/implementation-roadmap.md`.** It does not renumber,
edit, or supersede phases B–G or units C3–C7 there. Closing PF-A does not by itself authorize
any install or production change — see "What PF-A does not authorize" below.

Sibling documents: [`pagefind-roadmap-b.md`](./pagefind-roadmap-b.md) (clean-agent adoption
proof, depends on this unit) and [`pagefind-roadmap-c.md`](./pagefind-roadmap-c.md) (real
activation in an adopted site, depends on PF-A and PF-B). Source brief: an external document,
*Static Search Capability*, dated 2026-09-24, inspecting `main` at `16d276a73bfaaebcb3475b5f9ae545d23ec0e573`
(main has since moved to `9114ce7`). That brief is not part of this repository; this file, and
its two siblings, are the in-repo source of truth for the PF work it proposes.

## Goal

Add a canonical skill, `static-site-search`, that documents how to add opt-in full-text search
over already-built HTML using Pagefind, without installing Pagefind, without touching
`package.json` or `src/**`, and without activating search in the base template. PF-A is a
documentation/skill unit: it makes the capability discoverable and puts a human contract in
front of any future activation. It is equivalent to the brief's **S1 — Static Search Skill**.

## Executive decision (condensed from brief §1)

Add the skill, but keep Pagefind an **opt-in** capability. When a future adopter confirms they
need full-text search, the skill guides a bounded activation:

1. Astro generates static HTML into `dist/`.
2. Pagefind's official CLI indexes that finished HTML.
3. Pagefind's Component UI queries static files in the browser.
4. No search server, API, database, or environment variable appears.

This is separated from CMS/webhooks/rebuild triggers, hosting/deploy/Actions, external SEO
(`noindex`, canonical, sitemap), private/live/personalized application search, and the existing
phases B–G / units C3–C7. If implemented, it is a standalone unit, **S1**, not a phase renumber.

## Problem boundary (condensed from brief §2)

**In scope:** full-text search over already-generated HTML; a static blog that grows by
successive builds; per-locale indexes keyed on the real `<html lang>`; results carrying title
and URL plus whatever metadata/filters the product agrees to, taken from emitted HTML; sites
served at `/` or under a configured `base`; an accessible UI with no extra framework island.

**Out of scope:** data that must appear before the next build; private, session-gated, or
personalized content; autocomplete against a remote backend; searching inside a CMS before
pages are generated; the webhook that triggers a build.

**Boundary statement:** HTML already generated → reproducible static index → accessible UI.

## Template facts to re-verify at start of unit

Main has moved from `16d276a` (brief's inspection commit) to `9114ce7`. Re-verify every row
before writing, not from this table:

| Fact (as inspected 2026-09-24) | Consequence for the skill |
|---|---|
| Bun is the declared package manager (`bun@1.2.13`) | Use `bun add --dev`, `bun run`, and the existing lockfile; never introduce npm/pnpm. |
| `build` is `astro build` | If activated, Pagefind becomes an explicit second stage of the same `bun run build`. |
| `audit` and `audit:mobile` call `astro build` directly | If Pagefind is activated they must call `bun run build`, or the audits bypass the search stage. |
| Astro emits to `dist/` | Pagefind's only input is `dist/`, after Astro. |
| The blog has EN and ES routes and `BaseLayout.astro` emits `<html lang={lang}>` | Pagefind can split indexes by locale without `force-language`. |
| `BlogArchive.astro` already has a field that filters pre-rendered cards | Before adding Pagefind, decide whether that filter is replaced, kept as a local filter, or moved to another UI. Two ambiguous searches must not coexist. |
| The build already runs `seo-lint` | Search must not reuse `noindex`, sitemap, or canonical as an inclusion signal — different contracts. |
| Skills live at `skills/<name>/SKILL.md` and are opened by path | The new skill must enter the catalog and the documentary routers; creating a folder alone is not enough. |
| The catalog currently declares exactly seven skills | Adding an eighth requires updating every "7 skills" claim in the same change. |

### The distinction the UI must explain

`BlogArchive.astro`'s current filter only searches the title, description, category, and
keywords of cards already on the page. Pagefind searches the full HTML body of indexed pages.
These are not equivalent:

| Need | Correct tool |
|---|---|
| Filter the cards already visible | The current local filter |
| Search the full body of posts or pages | Pagefind |
| Private, live, or personalized data | A search backend — outside this skill |

## Sources (brief §4)

**Primary:**

- [Pagefind — Getting Started](https://pagefind.app/docs/)
- [Pagefind — Installing and running](https://pagefind.app/docs/installation/)
- [Pagefind — Running Pagefind](https://pagefind.app/docs/running-pagefind/)
- [Pagefind — Indexing](https://pagefind.app/docs/indexing/)
- [Pagefind — Multilingual search](https://pagefind.app/docs/multilingual/)
- [Pagefind — Metadata](https://pagefind.app/docs/metadata/)
- [Pagefind — Filters](https://pagefind.app/docs/filtering/)
- [Pagefind — Component System](https://pagefind.app/docs/components/)
- [Pagefind — Component configuration](https://pagefind.app/docs/components/config/)
- [Pagefind — Browser search configuration](https://pagefind.app/docs/search-config/)
- [Bun — `bun add`](https://bun.com/docs/pm/cli/add)

The consulted official documentation identifies version `1.5.2`, introduces the Component UI,
and confirms four rules this skill must protect: Pagefind runs after the static build and writes
its bundle into the output; once `data-pagefind-body` appears on any page, pages without it are
excluded from the index; languages are detected from `<html lang>` and indexed separately;
`base-url` and `bundle-path` are required when the site can live under a subpath.

**Community skills/recipes reviewed:**

- [Incluud — Astro Agent Skills](https://github.com/incluud/astro-agent-skills): its modular,
  portable, official-first, minimal-JS approach is kept as a design influence.
- [Publishing Astro Websites Agentic Skill](https://github.com/SpillwaveSolutions/publishing-astro-websites-agentic-skill):
  MIT-licensed, has a useful section distinguishing Pagefind from an in-memory filter, but is
  not copied. Its recipe runs Pagefind in `build` and again in `postbuild`, and uses the legacy
  `PagefindUI` — both rejected here.
- [astro-pagefind](https://github.com/shishkin/astro-pagefind): its own docs say the legacy
  component is in maintenance mode and point to the Component UI introduced in Pagefind 1.5. For
  this template, the official CLI is enough and avoids a second integration and a second build
  owner.

**Authoring rule:** extract principles, do not copy large blocks. The skill stays short, cites
current official sources, names one owner of indexing, adds no extra JS framework, requires
human decisions before any install, and requires verification against the generated index, not
just the source code.

## Human contract questions (brief §5)

The existence of a blog, or of a search-looking icon, does not authorize installing anything.
`site-build` already detects "search" as a visible Round 2 feature; `static-site-search` must
receive these confirmed answers before writing:

1. **Scope:** posts only, whole site, or selected routes.
2. **Interface:** an inline field in the blog, a dedicated `/search/` page, or a modal.
3. **Locales and surfaces:** indexes split by each page's `lang`, and one search surface per
   locale. A single multilingual index is out of scope for this skill and needs a separate
   contract.
4. **Filters and metadata:** none, or an explicit list; `title` and URL are the minimum — image,
   alt text, date, category, and tags are required only if the product agrees to them.
5. **Existing search:** replace the local archive filter, keep it under another purpose/name, or
   remove it.
6. **Exclusion:** if per-page opt-out is needed, use a dedicated `search` signal — never infer it
   from `noindex` or sitemap.
7. **No-JavaScript fallback:** text and a navigable route matching the chosen scope; never assume
   `/blog/` by default.

If these answers already live in a `DESIGN.md` reaffirmed for the session, do not ask again.

## Skill draft for `skills/static-site-search/SKILL.md`

The block below is the proposed skill, verbatim from the source brief, ready to be refined
against the current worktree and copied into `skills/static-site-search/SKILL.md`. It is a draft
carried by this document; PF-A does not itself create that file.

````markdown
---
name: static-site-search
description: "Use when adding, changing, removing or debugging internal full-text search in this Astro static template, including Pagefind indexing, search UI, indexed scope, metadata, filters, locales, subpath hosting, or stale results. Also use when deciding whether an existing blog-card filter is sufficient. Do not use for search-engine SEO, CMS synchronization, private/live application search, or a backend search API."
---

# Static site search

Add search only after the adoption contract confirms it. This capability indexes the built HTML; it does not add a search server.

## 1. Confirm the contract

Before writing, obtain or read the confirmed answers for:

- scope: blog, whole site, or selected routes;
- UI: inline, dedicated page, or modal;
- locales: separate indexes by `<html lang>` and one search surface per locale;
- filters and required result metadata; title and URL are the minimum, other fields are opt-in;
- whether the existing `BlogArchive.astro` card filter is replaced or retained;
- optional per-page search exclusion, independent of `noindex` and sitemap.
- fallback label and navigable destination when JavaScript is unavailable.

Do not activate search merely because a blog or search-looking control exists.

## 2. Preserve the architecture

- Use Bun and the official `pagefind` CLI. Do not add `astro-pagefind`, React, Fuse, Algolia or another provider unless the confirmed contract requires it.
- Run Pagefind exactly once, after Astro has finished writing `dist/`.
- Treat `dist/pagefind/` as generated output. Do not copy it to `public/` or commit it.
- Keep internal search, robots and sitemap independent. A page may be indexable by search engines yet excluded from internal search, or the reverse, by explicit decision.
- Use Pagefind Component UI web components. Start with the default templates; custom result templates must preserve their ARIA contract.

When activating against this package, prefer one build owner:

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

Install with the repo's version policy and Bun, for example `bun add --dev "pagefind@^1.5.2"`. Let `bun.lock` pin the resolved artifact. Do not add both a chained `build` command and `postbuild`.

`astro dev` has no finished index. Use `bun run search:preview` for real search testing and do not report dev-mode 404s for `/pagefind/*` as a production failure.

## 3. Define the index from emitted HTML

Put `data-pagefind-body` only on the content regions in the confirmed scope. Once one page uses it, every included page must use it; pages without it are excluded.

For blog-only search, mark the rendered post article, not `BaseLayout`, the header, footer or archive listing. Add explicit metadata and filters from visible emitted values:

```astro
<article data-pagefind-body>
  <h1 data-pagefind-meta="title">{title}</h1>
  <!-- Add image, date and filters only when the confirmed contract requires them. -->
  {image && <img
    src={image.src}
    alt={imageAlt}
    data-pagefind-meta="image[src], image_alt[alt]"
  />}
  {datePublished && <time datetime={datePublished} data-pagefind-meta="date[datetime]">
    {formattedDate}
  </time>}
  {category && <span data-pagefind-filter="category">{category}</span>}
  {tags?.map((tag) => <span data-pagefind-filter="tag">{tag}</span>)}
  <Content />
</article>
```

Use a separate explicit `search` field only when the product needs per-page opt-out. Never derive it from `noindex` or `sitemap`.

Do not use the reserved filter keys `any`, `all`, `none` or `not`.

## 4. Add UI without a framework island

Use the Pagefind 1.5 Component UI assets generated in `dist/pagefind/`. Derive paths from Astro's base:

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

Pass a canonical, base-aware `fallbackHref`; do not construct it by raw string concatenation in this component. Place the stylesheet and module script through the page's existing head slot when possible, and place `<pagefind-config>` before the UI components. A dedicated results page may compose `pagefind-input`, `pagefind-summary` and `pagefind-results` instead.

Rely on `<html lang>` for language selection; do not set `force-language`. Confirm that each generated locale page has the correct `lang` and a search surface in that same locale. For the current bilingual template, a lone English `/search/` cannot serve as proof that Spanish search works.

## 5. Verify the real capability

Do not close on the existence of `dist/pagefind/`. Before indexing, derive the expected URL set from a source independent of Pagefind markers and output:

- blog-only: published content entries × emitted locales, using the repo's canonical route helpers;
- selected routes: an explicit search-scope manifest;
- whole site: emitted HTML routes minus an explicit search-exclusion manifest.

Never derive the expected set from `data-pagefind-body`, `dist/pagefind/` or the search index. Compare expected and actual URLs bidirectionally.

Then query the generated index through Pagefind's public browser API and record evidence for:

- one unique term from each included locale, absent from the other locale;
- exact expected URLs and no unexpected URL;
- canonical trailing-slash form and a non-root Astro `base`;
- title and URL, plus only the metadata and filters declared required by the contract;
- header/footer sentinel absent from snippets;
- Unicode and diacritics;
- zero results;
- deleting a post and rebuilding removes its unique term and URL;
- Pagefind executes exactly once.

Prove ownership per entrypoint at two levels. A gate walks the command graph reachable from `bun run build`, including lifecycle hooks and Astro integrations; that graph must reach Pagefind exactly once. A temporary PATH shim/counting wrapper must also observe exactly one Pagefind process during `bun run build`. Repeat for `bun run search:preview`, which is an alternative entrypoint and may call Pagefind once without becoming a second owner of the production build. A `postbuild`, integration or hook additionally reachable from `bun run build` is a failure. Restore the shim after the test.

Separately, use a real browser on the Component UI to verify keyboard navigation, focus, accessible zero-results announcement, EN and ES surfaces, and the agreed no-JS fallback. The search API alone cannot prove these UI properties. Test base handling with root `/`, then `base: "/preview"` + `trailingSlash: "never"` (so `BASE_URL` has no final slash), and `base: "/preview"` + `trailingSlash: "always"` (so it does).

Mutate before accepting: remove `data-pagefind-body` from an expected page, break one emitted `html lang`, break the bundle/base path, and add a second Pagefind owner. Each mutation must fail for the intended reason and be restored.

Run the repository gates last:

```bash
bun run test
bun run check
bun run build
git diff --check
```

Confirm no fixtures, mutation residue, temporary indexes or generated `dist/` files are staged.
````

## Authorized and unauthorized files (brief §7)

PF-A is a documentation/operative unit. Its goal is to introduce the skill and make it
discoverable, not to activate Pagefind in the base product.

### Authorized

- `skills/static-site-search/SKILL.md` — new; the draft above, refined against the current
  worktree.
- `skills/README.md` — catalog updated to eight skills.
- `AGENTS.md` — minimal search-routing entry and transitory "eight skills" state.
- `CLAUDE.md` — remove any skill count/claim that becomes stale.
- `skills/site-build/SKILL.md` — insert the opt-in step after content is built and before the
  visual-close step.
- `skills/site-build/references/adoption-wizard.md` — make the "search" row point at the new
  skill; do not duplicate its contract.
- `docs/product/template-contract.md` — record `static-site-search` as an opt-in extension, not
  core.
- `docs/product/agent-ecosystem-contract.md` — update the real skill inventory.
- `docs/product/current-repository-map.md` — only if it enumerates the catalog or describes
  current search as a global capability.

### Not authorized in PF-A

- `package.json` and `bun.lock`;
- `src/**` and `astro.config.mjs`;
- workflows and deployment;
- environment variables;
- CMS, remote loaders, and webhooks;
- prior findings or phases, except broken references directly caused by moving from seven to
  eight skills.

### Anti-drift rule

Before closing, search for every count/catalog claim:

```bash
rg -n "seven skills|7 skills|all seven|The seven|las 7|7 reales" \
  AGENTS.md CLAUDE.md skills docs
```

Do not create a second document that claims to be the canonical catalog.

## Claude + Codex orchestration (brief §8)

### Claude — lead and editor

1. Confirm HEAD, a clean tree, and the applicable rules.
2. Read this document, `AGENTS.md`, `skills/README.md`, `site-build`, and the adoption wizard.
3. Implement only PF-A, only in the authorized files.
4. Keep the skill short: roughly 120–180 lines; do not move this whole brief into it.
5. Run the documentary checks and prepare a self-contained diff.

### Codex — adversarial review, no concurrent writing

Reviews after Claude finishes. Does not edit at the same time.

Mandatory questions:

1. Can an agent activate Pagefind without having confirmed scope, UI, locales, and coexistence
   with the current filter?
2. Does the graph reachable from `bun run build` execute Pagefind zero times, or more than once?
   Does `search:preview` execute it once as an alternative entrypoint, without contaminating the
   production build?
3. Could `audit` stay green without having built the index?
4. Does the skill confuse internal search with `noindex` or sitemap?
5. Does route composition work at root and with `base: '/preview'` under
   `trailingSlash: 'never'` and `'always'`, without escaping the subpath or losing a slash?
6. Does the documentation still claim seven skills exist?
7. Does the skill require testing the real index, or does it accept file presence alone?
8. Was Pagefind accidentally introduced into the base runtime during a unit that was meant to be
   skill-only?

Codex delivers `PASS`, `PASS_WITH_FINDINGS`, or `NEEDS_ATTENTION`, with file/line and a concrete
reproduction for each blocker. Claude does not auto-fix findings outside PF-A's scope; it reports
them for a human decision.

## Global roadmap guard (mandatory)

Before PF-A is closed, Codex runs a read-only adversarial review confirming the unit breaks
nothing the global roadmap (`docs/product/implementation-roadmap.md`) has accepted or tracks —
at minimum:

- phase B contracts and the rebrand checklist;
- phase C gates: `seo-lint` route gates, `parse5`-based extraction, hreflang validation,
  sitemap/`noindex` independence and the strict sitemap marker contract, router-safe slugs,
  documented-codes provenance including `UNRESOLVED_FINDING_PROVENANCE`, and i18n key parity;
- the single route map in `src/lib/seo/locale.ts` and its locale sync with `astro.config.mjs`;
- the gates `bun run test`, `bun run check`, `bun run build` (seo-lint clean), and
  `git diff --check`.

Internal search inclusion must never be derived from `noindex`, sitemap, or canonical — PF-A is a
documentation-only unit and introduces no code, but the review still confirms no authored file
implies otherwise. The review returns `PASS`, `PASS_WITH_FINDINGS`, or `NEEDS_ATTENTION`, with
file:line and a reproduction per blocker. Findings outside PF-A's scope go to the human, not
auto-fixed.

## Acceptance (brief §11, minus the clean-agent simulation — see PF-B)

PF-A can close when:

- a single, short, canonical `static-site-search` skill exists;
- the real routers and catalogs find the eighth skill;
- the skill does not install or activate Pagefind by itself;
- the human contract precedes any write/install;
- the existing local filter is treated explicitly;
- the build has a single conceptual owner of indexing (documented, not yet built);
- i18n, `base`, independent SEO, and index verification are covered by the skill's text;
- an independent adversarial review finds no blocking bypass;
- the diff contains only authorized documentation/skill files and is ready for human review.

The clean-agent simulation bullet from brief §11 is not part of PF-A's acceptance; it is PF-B's
subject (see `pagefind-roadmap-b.md`).

## Status

| Deliverable | Status | Evidence | Missing proof |
|---|---|---|---|
| `skills/static-site-search/SKILL.md` created and catalog-eligible | Implemented | `skills/static-site-search/SKILL.md` (174 lines), commit `214f759`; §1 contract revised to seven explicit, recommendation-backed questions after PF-B run 1 exposed it as incomplete (assumed locales, silent exclusion default, no recommendations, title+URL minimum) — see `docs/product/pagefind-roadmap-b.md` "Run records → Run 1"; revised in `c8d52f3` | — |
| `skills/README.md` updated to eight skills | Implemented | catalog row and count, `214f759` | — |
| `AGENTS.md` search-routing entry and transitory eight-skills state | Implemented | router row and counts, `214f759` | — |
| `CLAUDE.md` stale-count cleanup | Implemented | "8 real skills", `214f759` | — |
| `skills/site-build/SKILL.md` opt-in step inserted | Implemented | step 8.5 between `form-slot` (8) and `visual-gate` (9), activation-gated, `214f759`; later steps not renumbered because prose cites them by number | — |
| `skills/site-build/references/adoption-wizard.md` search row updated | Implemented | Round 2 search row points at the skill (`214f759`); §1 precedence list and §10 post-confirmation order include `static-site-search` (`fa4094d`, from the adversarial review) | — |
| `docs/product/template-contract.md` records search as opt-in extension | Implemented | extension bullet and catalog row (`214f759`); last stale "catálogo de 7" fixed (`fa4094d`) | — |
| `docs/product/agent-ecosystem-contract.md` inventory updated | Implemented | eight-skill inventory, `214f759` | — |
| `docs/product/current-repository-map.md` catalog/search description updated (if applicable) | Implemented | Not applicable: the file neither enumerates the catalog nor mentions search (`rg -i search` has no hits); left unchanged | — |
| Anti-drift `rg` sweep clean | Implemented | remaining hits are historical session docs (`docs/sessions/*`, unrelated "seven signals" or dated evidence) and this spec | — |
| Codex adversarial review (brief §8 questions) | Implemented | Review of `f915df8..214f759`: `NEEDS_ATTENTION`, 8 questions answered with no activation bypass, single Pagefind owner in the documented graph, base joining correct at root and `/preview` under both trailing-slash modes, no runtime change; two majors (wizard §1/§10 omitted the skill; `template-contract.md:65` said seven) fixed in `fa4094d`; targeted re-review: `PASS_WITH_FINDINGS`, only finding a dirty working tree during the review | — |
| Global roadmap guard review | Implemented | Both reviews: phase C gates, i18n parity, route map and locale sync intact; `git diff --name-only f915df8..fa4094d -- package.json bun.lock astro.config.mjs src` empty; `bun run test` 506/506, `bun run check` 0 errors, `bun run build` with seo-lint clean (10 pages) | — |
