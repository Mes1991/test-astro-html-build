# PF-C — Real activation in an adopted site

**This is not a phase of `docs/product/implementation-roadmap.md`.** It does not renumber, edit,
or supersede phases B–G or units C3–C7 there. Closing PF-C does not by itself authorize
installing Pagefind into this template's own base product — see "A different decision" below.

Sibling documents: [`pagefind-roadmap-a.md`](./pagefind-roadmap-a.md) (static search skill,
skill-only — a dependency of this unit) and [`pagefind-roadmap-b.md`](./pagefind-roadmap-b.md)
(clean-agent adoption proof — a dependency of this unit). Source brief: an external document,
*Static Search Capability*, dated 2026-09-24, inspecting `main` at `16d276a73bfaaebcb3475b5f9ae545d23ec0e573`
(main has since moved to `9114ce7`). That brief is not part of this repository; this file, and
its two siblings, are the in-repo source of truth.

## Goal

Activate Pagefind for real on a site that has adopted this template, following the contract
`skills/static-site-search/SKILL.md` (produced by PF-A) states, and prove the activation with the
verification the skill requires — not with file presence alone.

## Depends on

- **PF-A** — the skill must exist and state the architecture, contract questions, and
  verification requirements this unit executes.
- **PF-B** — the clean-agent simulation must have produced a recorded PASS, so the skill itself
  is proven followable before it is used for a real activation.
- **A new, explicit human contract for this specific site.** PF-A's contract questions (scope,
  UI, locales, filters/metadata, existing-filter disposition, exclusion signal, no-JS fallback)
  must be answered for the actual adopted site being activated, separately from anything answered
  during PF-B's disposable-copy simulation. A simulation answer is not a standing authorization
  for a real site.

## A different decision (brief §11, last paragraph)

S1 — and PF-A/PF-B closing it — does not install Pagefind into the template. Promoting Pagefind
from an opt-in capability to preinstalled template behavior is a separate product decision,
outside this unit's scope, and would need its own human contract distinct from the one this unit
uses for a single adopted site's activation.

## Activation scripts shape

From `skills/static-site-search/SKILL.md` §2: one build owner, `pagefind` as a devDependency
(`bun add --dev "pagefind@^1.5.2"`), no `postbuild`, and `audit`/`audit:mobile` routed through
`bun run build` so Lighthouse audits do not bypass the search stage. See the skill for the exact
script block and install command; it is not duplicated here.

## Index definition and UI rules

Summarized by reference — the authoritative text is `skills/static-site-search/SKILL.md` §3
(index definition from emitted HTML: `data-pagefind-body` scope, metadata/filter attributes, the
reserved-filter-key ban, the separate `search` opt-out field) and §4 (Component UI usage,
base-aware bundle/config paths, `fallbackHref` construction, no `force-language`, one search
surface per locale). PF-C does not restate those rules; it executes and verifies them.

## Verification requirements

From `skills/static-site-search/SKILL.md` §5, applied to the real adopted site:

- An expected URL set derived independently of Pagefind's own markers and output — never from
  `data-pagefind-body`, `dist/pagefind/`, or the index itself: for blog scope, published posts (the
  `blog` collection filtered by `!draft`) times the emitted locales, through the repo's canonical
  route helpers (`src/lib/seo/locale.ts`); for whole-site scope, the emitted HTML routes minus an
  explicit exclusion manifest; for selected-routes scope, an explicit, independent route manifest —
  compared bidirectionally against the actual index.
- Queries against Pagefind's public browser API recording: per-locale unique terms absent from
  other locales, exact expected/no-unexpected URLs, canonical trailing-slash form at root `/` (a
  non-root `base` is NOT_SUPPORTED by the template until phase F, "Template subpath deployment
  contract," is Implemented, and is not scored here), required metadata/filters, absence of
  header/footer sentinels in snippets, Unicode and diacritics, zero-results handling, and
  post-deletion index cleanup.
- Execution-once proof at two levels: a command-graph gate walking everything reachable from
  `bun run build` (including lifecycle hooks and integrations) confirming Pagefind is reached
  exactly once, and a temporary PATH shim/process-counting wrapper confirming exactly one Pagefind
  process runs during `bun run build`. `bun run search:preview` is checked as a separate,
  legitimate alternative entrypoint that may also call Pagefind once.
- Real-browser tests for keyboard navigation, accessible zero-results announcement, EN and ES
  surfaces, and the agreed no-JS fallback; and focus proof specific to the confirmed UI — if a
  modal was chosen, a focus trap while it is open and focus returned to the trigger that opened it
  on close (Escape, backdrop click, or close button); if inline, focus returned to the search field
  after selecting or closing results; visible focus while navigating results in either case — the
  search API alone cannot prove these.
- Base-path coverage: root `/` is required and verified now; `base: "/preview"` with
  `trailingSlash: "never"` and `trailingSlash: "always"` are NOT_SUPPORTED by the template until
  phase F, "Template subpath deployment contract," is Implemented, and are not scored until then.
- The repository gates run last: `bun run test`, `bun run check`, `bun run build` (seo-lint
  clean), and `git diff --check`, with no fixtures, mutation residue, temporary indexes, or
  generated `dist/` files staged.

## Adversarial mutation matrix (brief §10, translated verbatim)

This matrix belongs to a real Pagefind activation on an adopted site, not to PF-A's skill-only
unit. Each row is a required, restorable mutation test; each becomes a status-table row below,
Not built, with its required result as the missing proof.

| Scenario / mutation | Required result |
|---|---|
| Remove `data-pagefind-body` from an included post | The coverage check names the missing URL. |
| Include a page declared out of scope | Fails, naming the unexpected URL. |
| Change an ES post to `lang="en"` | The ES sentinel term cannot appear in the EN index. |
| Change only `noindex` or `sitemap` | Search presence does not change without a separate `search` decision. |
| Exclude an indexable page from search | It remains in robots/sitemap per its own contract, but does not appear in Pagefind. |
| Delete a post and rebuild | Its URL and unique term disappear; no stale shards remain. |
| Add `postbuild`, an integration, or a hook that re-invokes Pagefind from `bun run build` | The production-graph probe and the process counter both fail; `search:preview` remains a valid alternative entrypoint. |
| Build at root `/` (subpath matrix NOT_SUPPORTED until phase F) | Root required and verified; subpath NOT_SUPPORTED until phase F, "Template subpath deployment contract," is Implemented. Once supported: exercises `BASE_URL` without and with a trailing slash; assets and links join correctly, with no `/previewpagefind/`, no double slashes, and no escape to `/`. |
| Put a unique term only in the header/footer | It does not appear in results or snippets. |
| Remove the title or any metadata declared mandatory | The result-metadata check fails. |
| Search `diseño`, `café`, and `ñ`/Unicode | Returns the correct pages without mojibake. |
| Disable JavaScript | Content and navigation remain accessible through the fallback. |
| Search a nonexistent term | The UI announces zero results and does not retain previous results. |

A check that only greps the HTML does not prove Pagefind indexed that content. Final evidence
must query the generated index through the public API or the Component UI.

## Global roadmap guard (mandatory)

Before PF-C is closed, Codex runs a read-only adversarial review confirming the unit breaks
nothing the global roadmap (`docs/product/implementation-roadmap.md`) has accepted or tracks —
at minimum:

- phase B contracts and the rebrand checklist;
- phase C gates: `seo-lint` route gates, `parse5`-based extraction, hreflang validation,
  sitemap/`noindex` independence and the strict sitemap marker contract, router-safe slugs,
  documented-codes provenance including `UNRESOLVED_FINDING_PROVENANCE`, and i18n key parity;
- the single route map in `src/lib/seo/locale.ts` and its locale sync with `astro.config.mjs`;
- the gates `bun run test`, `bun run check`, `bun run build` (seo-lint clean), and
  `git diff --check`.

Internal search inclusion must never be derived from `noindex`, sitemap, or canonical — this is
the row this unit's own mutation matrix tests directly ("Change only `noindex` or `sitemap`" /
"Exclude an indexable page from search"), and the guard confirms the activation code does not
regress it elsewhere (e.g. sitemap generation, route gates). The review returns `PASS`,
`PASS_WITH_FINDINGS`, or `NEEDS_ATTENTION`, with file:line and a reproduction per blocker.
Findings outside PF-C's scope go to the human, not auto-fixed.

## Status

| Deliverable | Status | Evidence | Missing proof |
|---|---|---|---|
| New human contract answered for the real adopted site | Not built | — | PF-A's seven contract questions (§5) answered and recorded for this specific site, separate from PF-B's simulation answers. |
| One-build-owner scripts installed (`build:astro`, `search:index`, `build`, `search:preview`) | Not built | — | Diff to the adopted site's `package.json`; `pagefind` present as devDependency only. |
| `audit` / `audit:mobile` routed through `bun run build` | Not built | — | Diff confirming both scripts call `bun run build`, not `astro build` directly. |
| Index definition applied (`data-pagefind-body`, metadata, filters, `search` opt-out) | Not built | — | Diff to the templates in the confirmed scope, matching skill §3. |
| Component UI wired (base-aware bundle/config, no `force-language`, per-locale surface) | Not built | — | Diff adding the UI component matching skill §4; per-locale surface confirmed present. |
| Independent expected-URL derivation | Not built | — | The derivation source (route helpers, scope manifest, or exclusion manifest) and a bidirectional compare run. |
| Public API query evidence (per-locale terms, exact URLs, base/trailing-slash, metadata, sentinels, Unicode, zero-results, post-deletion cleanup) | Not built | — | Recorded query results for each bullet under "Verification requirements". |
| Command-graph execution-once gate | Not built | — | Gate output showing Pagefind reached exactly once from `bun run build`. |
| PATH shim / process-counter execution-once proof | Not built | — | Shim output showing exactly one Pagefind process during `bun run build`, restored afterward. |
| `search:preview` alternative-entrypoint check | Not built | — | Confirmation it calls Pagefind once without becoming a second production-build owner. |
| Browser tests (keyboard, focus, zero-results announcement, EN/ES, no-JS fallback) | Not built | — | Recorded browser-test run covering all properties, including UI-specific focus proof: if a modal was chosen, a focus trap while open and focus returned to the trigger on close (Escape, backdrop, close button); if inline, focus returned to the search field after selecting or closing results; visible focus while navigating results in either case. |
| Root deployment verified (subpath matrix NOT_SUPPORTED until phase F) | Not built | — | Root required; one recorded build with verification evidence at root `/`. The `/preview` sub-cases are subpath NOT_SUPPORTED until `implementation-roadmap.md` phase F, "Template subpath deployment contract," is Implemented — never scored as PASS before then. |
| Repository gates green | Not built | — | `bun run test`, `bun run check`, `bun run build` (seo-lint clean), `git diff --check` output, no staged residue. |
| Remove `data-pagefind-body` from an included post | Not built | — | Required result: The coverage check names the missing URL. Mutation run and restore recorded. |
| Include a page declared out of scope | Not built | — | Required result: Fails, naming the unexpected URL. Mutation run and restore recorded. |
| Change an ES post to `lang="en"` | Not built | — | Required result: The ES sentinel term cannot appear in the EN index. Mutation run and restore recorded. |
| Change only `noindex` or `sitemap` | Not built | — | Required result: Search presence does not change without a separate `search` decision. Mutation run and restore recorded. |
| Exclude an indexable page from search | Not built | — | Required result: It remains in robots/sitemap per its own contract, but does not appear in Pagefind. Mutation run and restore recorded. |
| Delete a post and rebuild | Not built | — | Required result: Its URL and unique term disappear; no stale shards remain. Mutation run and restore recorded. |
| Add `postbuild`/integration/hook re-invoking Pagefind | Not built | — | Required result: The production-graph probe and the process counter both fail; `search:preview` remains valid. Mutation run and restore recorded. |
| Build at root `/` (subpath matrix NOT_SUPPORTED until phase F) | Not built | — | Mutation run and restore recorded at root `/`. The `/preview` never/always sub-cases are subpath NOT_SUPPORTED until `implementation-roadmap.md` phase F, "Template subpath deployment contract," is Implemented — never scored as PASS before then. |
| Unique term only in header/footer | Not built | — | Required result: Does not appear in results or snippets. Mutation run and restore recorded. |
| Remove mandatory metadata | Not built | — | Required result: The result-metadata check fails. Mutation run and restore recorded. |
| Search `diseño`, `café`, `ñ`/Unicode | Not built | — | Required result: Returns correct pages without mojibake. Mutation run and restore recorded. |
| Disable JavaScript | Not built | — | Required result: Content and navigation remain accessible through the fallback. Mutation run and restore recorded. |
| Search a nonexistent term | Not built | — | Required result: UI announces zero results, retains none. Mutation run and restore recorded. |
| Codex adversarial review (skill-owned §8 questions, applied to this activation) | Not built | — | Recorded verdict (`PASS` / `PASS_WITH_FINDINGS` / `NEEDS_ATTENTION`) with file/line and repro per finding. |
| Global roadmap guard review | Not built | — | Recorded verdict confirming no phase B/C contract, gate, or route-map invariant is broken. |
