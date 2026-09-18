# Phase A — deferred findings

Phase A closed with verdict `PASS_WITH_FINDINGS` against base commit `9ee1b0f`.

Finding #7 was resolved rather than accepted, and that resolution **has** since been
independently reviewed by an executable adversarial round that built the site, mutated the
gates and inspected the emitted artifacts. That round also found — and the fix closed — a
hole in the hreflang gates themselves: they accepted an incomplete alternate set. See
findings #8–#10 below for what that final round left open.

Every item below was raised by an independent executable review that built the site and
inspected the emitted HTML. **None of them is a current reproducible defect.** They are
recorded here so a future phase resolves them deliberately instead of rediscovering them.

Each row names the phase that owns the fix. "Owner" is the role that decides, not a person.

| # | Finding | Kind | Severity | Owner | Resolve in |
|---|---------|------|----------|-------|------------|
| 1 | `ASSET_EXTENSIONS` omits `.wasm` and extensionless public files | Future risk | Low | Gate design | Phase C |
| 2 | `isCanonicalForm` cannot detect asset-misclassification on its own | Observation | Low | Gate design | Phase C |
| 3 | Origin hardcoded in a third place the rebrand checklist omits | Future risk | Medium-low | Template contract | Phase B |
| 4 | Regex extractors are attribute-order and quote sensitive | Observation | Low | Gate design | Phase C |
| 5 | `astro build` warns about an `/es` route conflict | Observation | Low | Build config | Phase F |
| 6 | `coming-soon` has no `og:url`; `/es/404/` canonicalises cross-locale | Observation | Low | Standalone pages | Phase F |
| 7 | ~~A slug ending in a real asset extension still misroutes~~ | **Resolved** | — | — | Closed in Phase A |
| 8 | Sitemap discovery lints any root `.xml` carrying a `<urlset>`, with no opt-out | Future risk | Low | Gate design | Phase C |
| 9 | A slug containing a literal percent-escape breaks Astro's router before seo-lint runs | Observation | Low | Content contract | Phase C |
| 10 | hreflang locales are matched by exact equality, so regional variants are rejected | Observation | Low | Gate design | Phase C |

---

## 1 — `ASSET_EXTENSIONS` omits `.wasm` and extensionless public files

`src/lib/seo/url.ts` — the allowlist that decides whether a path is a static asset.

The build emits `dist/draco/draco_decoder.wasm`, `dist/draco/LICENSE` and `dist/_headers`.
None of those extensions or shapes is in the allowlist. If someone later writes
`<a href="/draco/draco_decoder.wasm">`, `internalRouteLinks` will not skip it and
`INTERNAL_LINK_NOT_CANONICAL_FORM` will demand `/draco/draco_decoder.wasm/` and fail the build.

The same shape covers the recorded `/api/download` case: an extensionless internal link to a
non-page route would be wrongly required to carry a trailing slash.

No such link exists today — the full anchor inventory in `dist/` was swept and contains only
page routes. Draco is loaded by JavaScript, not by an anchor.

**Resolve in Phase C**, when the gate surface is reworked. Two candidate approaches: an
allowlist of non-page route prefixes (`/api/`, `/draco/`), or an opt-out attribute the gate
honours. Whichever is chosen must be documented next to the gate, because the failure mode is
a blocked build, not a silent bug.

## 2 — `isCanonicalForm` cannot detect asset-misclassification on its own

`src/lib/seo/sitemap.ts` — `isCanonicalForm` returns `path === withTrailingSlash(path)`, and
`withTrailingSlash` is defined in terms of `isAssetPath`. When `isAssetPath` is wrong, this gate
agrees with it and stays silent.

Demonstrated during review with a `whitepaper.pdf` slug: `CANONICAL_NOT_CANONICAL_FORM` did not
fire. The build still failed, but only because the emitted-output cross-checks
(`LOCALIZED_ROUTE_WITHOUT_ALTERNATES`, `SITEMAP_NON_HTML_ENTRY`) caught it independently.

Defence in depth worked. The point to carry forward: **do not treat `isCanonicalForm` as a
sufficient single gate.** The gates that compare against emitted output are the load-bearing ones.

**Resolve in Phase C**, as a design note at minimum.

## 3 — Origin hardcoded in a third place the rebrand checklist omits

`src/integrations/seo-lint/index.ts` — `const SITE_ORIGIN = 'https://example.com'`.

Pre-existing, but Phase A newly routes the sitemap gates through it. `CLAUDE.md` rule 2 and
`docs/product/rebrand-checklist.md` tell a rebrander to set two places: `siteSeo.siteUrl` in
`src/lib/seo/defaults.ts`, and `site` in `astro.config.mjs`. This is a third.

Failure scenario: a rebrand to `https://acme.com` updates the two documented places and leaves
`SITE_ORIGIN` stale. `sitemapPath` and `exactPath` then stop stripping the origin, every `<loc>`
fails to match an emitted page, and the gates either go noisy or lose meaning.

All three currently read `https://example.com`, so nothing is broken today.

**Resolve in Phase B**, which already owns configuration and version coherence. Preferred fix:
derive `SITE_ORIGIN` from `siteSeo.siteUrl` so there is one source. If it stays separate, the
rebrand checklist and `CLAUDE.md` rule 2 must name it.

## 4 — Regex extractors are attribute-order and quote sensitive

`src/integrations/seo-lint/routes.ts` — `declaredLang`, `declaredCanonical` and `declaredOgUrl`
use a single `.match()` and require a fixed attribute order (`rel="canonical"` immediately before
`href`; `property="og:url"` immediately before `content`) with double quotes.

A component emitting `<link href="…" rel="canonical">` would yield `null`, and the gate would
pass vacuously rather than fail.

This does **not** apply to `isIndexable` or `declaredAlternates`, which correctly use `matchAll`
over every occurrence. Astro emits the expected order and double quotes today.

**Resolve in Phase C.** Either accept it with a documented limitation, or move these extractors to
a real HTML parser.

## 5 — `astro build` warns about an `/es` route conflict

```
[WARN] [build] Could not render `/es` from route `/es/` as it conflicts with higher priority route `/es`.
```

Present on the base commit too, and independently confirmed benign: `dist/es/index.html` is
emitted correctly with `lang="es"`, canonical `https://example.com/es/` and a full reciprocal
alternate set.

**Resolve in Phase F**, as part of the technical checkpoint — either silence it deliberately or
record it as expected output, so it cannot mask a real conflict later.

## 6 — `coming-soon` has no `og:url`; `/es/404/` canonicalises cross-locale

`/coming-soon/` and `/es/coming-soon/` declare a canonical but no `og:url`.
`dist/es/404/index.html` declares `canonical=https://example.com/404/` — the English one.

Both are pre-existing standalone-page behaviour that Phase A did not touch, on `noindex` pages
excluded from the sitemap. `OG_URL_CANONICAL_MISMATCH` correctly only fires when both signals
exist, so neither trips a gate.

**Resolve in Phase F**, with the rest of the standalone-page sweep.

## 7 — RESOLVED — a slug ending in a real asset extension no longer misroutes

**Status: closed in Phase A, and independently reviewed.** The review built real
`slug: whitepaper.pdf` and `slug: diseño-web` posts plus a real emitted PDF asset, and confirmed
on the artifacts that all seven per-page URL signals agree in both locales, that a real asset
keeps its slashless file URL, and that no false `SITEMAP_LOC_DANGLING` is produced.

Originally recorded as accepted residue: a post with `slug: whitepaper.pdf` produced a slashless
canonical against a slashed emitted route, and the build failed with a misleading
`SITEMAP_NON_HTML_ENTRY` that sent the author to the sitemap filter for what was an ordinary
HTML page.

It was not irreducible. The mistake was asking the wrong question — deciding "route or asset?"
from the shape of the last path segment, when the build already knows the answer.

The fix works on two layers:

1. **Callers declare intent.** `routePath` / `routeUrl` in `src/lib/seo/url.ts` normalize a path
   the caller *knows* is a directory route, and never consult `isAssetPath`. Every call site that
   builds a route URL — hreflang alternates, blog post pages, breadcrumb and article schema,
   `canonicalUrl` — now uses them. Asset call sites keep `absoluteUrl`.
2. **Gates classify by emitted artifacts.** `walkAssets` in `src/integrations/seo-lint/index.ts`
   collects every non-HTML file the build emitted, and `lintLocaleRoutes` / `lintSitemapRoutes` /
   `isRouteLink` decide from the emitted page set and file set. A page the build emitted is a
   route even when its slug looks like a file; a file the build emitted is a file.

The sitemap's HTML-only contract is unchanged, and `SITEMAP_NON_HTML_ENTRY` now fires only for a
file the build actually emitted. A loc the build emitted neither way is reported as
`SITEMAP_LOC_DANGLING`, which is the honest answer when there is no ground truth.

Verified end to end: with a real post at `slug: whitepaper.pdf`, canonical, `og:url`, all three
hreflang and the JSON-LD URLs are the identical trailing-slash URL in both locales, and
`seo-lint` is clean. Real assets remain slashless — swept across all emitted HTML. Reverting
`routePath` to the heuristic fails 5 tests.

The residual heuristic survives in exactly one place: a link target the build emitted *neither*
as a page *nor* as a file. That case is finding #1, which stays open.

## 8 — sitemap discovery lints any root `.xml` carrying a `<urlset>`, with no opt-out

`src/integrations/seo-lint/index.ts` — `findSitemaps` reads every `.xml` at the root of `dist`
and keeps the ones whose content contains `<urlset`. That is deliberate: discovery by filename
(`sitemap-N.xml`) let a renamed output — `filenameBase` on `sitemap()` — silently bypass every
`SITEMAP_*` gate, which was the more dangerous failure.

The cost is a wider net. Reproduced during review: writing `public/extra-urls.xml` with a
`<urlset>` whose `<loc>` is `/blog/ghost-route/` fails the build with `SITEMAP_LOC_DANGLING`
attributed to `extra-urls.xml`. A site that deliberately publishes a second, hand-maintained
URL set — external URLs, or routes served by a separately deployed app — has no way to exclude
it from the gates.

The failure is loud rather than silent, which is the right direction, so this is a usability
limit and not a defect.

**Resolve in Phase C**, alongside the rest of the gate surface. The obvious shape is an
explicit opt-out (a configured ignore list on `seoLint()`), not a return to filename matching.

## 9 — a slug containing a literal percent-escape breaks Astro's router

Reproduced during review with a post at `slug: dise%C3%B1o-2`. The build fails inside Astro's
own routing, before any seo-lint code runs:

```
[ERROR] [build] Caught error rendering /blog/dise%C3%B1o-2/:
NoMatchingStaticPathFound: A `getStaticPaths()` route pattern was matched, but no matching
static path was found for requested path `/blog/diseño-2/`.
```

Astro decodes the requested path before matching it against the raw frontmatter slug that
`getStaticPaths()` returned, so the two never meet. This is Astro behaviour on a percent sign in
a slug, not a seo-lint gate and not something Phase A introduced — no Phase A code participates.
An ordinary non-ASCII slug (`diseño-web`) works correctly and is covered by finding #7.

**Resolve in Phase C** as a content-contract note: state that a slug must be written as literal
characters, never pre-encoded. A cheap guard would be a content-schema refinement rejecting `%`
in `slug`.

## 10 — hreflang locales are matched by exact equality, so regional variants are rejected

`src/integrations/seo-lint/routes.ts` — `alternateProblems` selects a locale's declarations with
`alternates.filter((a) => a.lang === locale)`. It replaced a looser prefix match.

Consequence: a declaration like `hreflang="en-GB"` is reported twice — once as an unexpected
hreflang, once as the missing `en` — and fails the build. The site declares only `en`, `es` and
`x-default` today, so nothing trips it.

Exact equality is the safe direction: it cannot let a wrong or duplicate declaration pass, which
is the mistake this gate exists to catch. It is recorded only so that adding a regional locale
is understood as a gate change, not just a content change.

**Resolve in Phase C**, if and when a regional locale is introduced.

---

## Explicitly out of scope for every phase above

**Host-level `/blog` → `/blog/` redirect.** `trailingSlash: 'always'` does not make a host
redirect the slashless form for prerendered pages; Astro leaves that to the host. This is a
deployment responsibility and cannot be verified from this repository, which has no deployment
target (`site` is the placeholder `https://example.com`). Documented in `src/lib/seo/url.ts` and
`astro.config.mjs`. Whoever deploys must configure it.
