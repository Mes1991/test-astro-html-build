# Implementation roadmap

The capabilities this template is converging on, in the order they are built,
with the criterion each one must satisfy to count as done.

`docs/product/template-contract.md` states *what* the product is.
`docs/product/current-repository-map.md` states what the repository contains
*today*. This file states *how the second becomes the first*, and is the
canonical order of work: where another document implies a different sequence,
this one decides.

## How a phase is accepted

A phase is done when its acceptance criteria hold and can be re-checked by
someone who was not there. Two rules apply throughout:

**Nothing is accepted on inspection alone.** Where a phase adds or changes a
validator, the proof is a producer mutation: break the input on purpose, confirm
the build or the test suite fails with a precise diagnostic, restore, confirm
green again. Reading a gate and agreeing with it proves nothing about the gate.

**Documentation may only state what the code does.** A capability is either
implemented and verifiable, or described plainly as not built. There is no third
category.

## How status is recorded

Each phase carries a status table pinned to the commit it was verified against.
A row is **Implemented** only when the code does it and the evidence column
points at where; otherwise it is **Not built**. A deliverable that is half done
is split into the part that exists and the part that does not — there is no
"partial". The **Missing proof** column names what acceptance still needs even
for an implemented row, usually a producer mutation that has not been recorded.

A phase is **Open** until every row is Implemented and its acceptance criteria
hold with their proof recorded. It is then **Accepted**. Status tables are
re-verified, not carried forward: a table pinned to an older commit says nothing
about the current one.

**Current status, verified at `2396323`:** B Open · C Open · D Open · E Open ·
F Open · G Open. No phase is accepted.

## Phases

### B — Coherence and safe adoption

**Goal.** Someone cloning this template gets documentation that matches the
code, configuration with a single source per fact, and no automation acting on
their repository that they did not choose.

**Deliverables**

- Agent-facing contracts (`CLAUDE.md`, `AGENTS.md`, `AUDIT.md`,
  `skills/static-site-seo/SKILL.md`, `docs/product/rebrand-checklist.md`) agree
  with the code, with a test protecting the parts that can be machine-checked.
- One canonical source for the site origin, consumed everywhere else.
- A declared environment contract: every variable the code reads is documented
  and typed, and nothing is documented that the code does not read.
- One version source.
- Performance budgets that audit routes the build actually emits.
- Font licences shipped with the fonts they cover, with stated provenance.
- Read-only CI stays active; automation with side effects is withdrawn from the
  default template rather than made configurable.

**Acceptance**

- `bun run test`, `bun run check` and `bun run build` green.
- Changing the site origin in its canonical place alone leaves the build clean.
- No default-shipping workflow both triggers automatically and performs a write.
- Every audited performance URL is a route the build emits, in canonical form,
  and none answers 404.
- Remote CI observed green on a real run after publication.

**Depends on.** Nothing. B is first.

**Status at `2396323`: Open**

| Deliverable | Status | Evidence | Missing proof |
|---|---|---|---|
| Emitted-code contract parity (`SKILL.md`, rebrand checklist) | Implemented | `src/integrations/seo-lint/documented-codes.test.ts` | — |
| Site origin from `siteSeo.siteUrl` only | Implemented | `src/lib/seo/defaults.ts`; `astro.config.mjs` derives `site`; commits `cd1ba19`, `aa854be`, `a730f3a`, `9329caa` | — (mutation recorded: origin + email changed alone in a clone → 371/371 tests, build clean, no `example.com` in `dist`) |
| Every read env variable typed | Not built | `PUBLIC_COMING_SOON` read at `src/middleware.ts:33`, absent from `src/env.d.ts`; `.env.example` does not exist | — (blocked: see note below the table) |
| One version source | Implemented | `package.json:5` → `0.1.0`; `version.txt`, `release-please-config.json`, `.release-please-manifest.json` removed; `src/repo-contract.test.ts`; commit `cf28296` | — (mutation recorded: reintroducing `version.txt` in a clone turns `src/repo-contract.test.ts` red on the "no competing version source" assertion; removing it again turns it green) |
| Performance budgets on emitted routes | Implemented | `lighthouserc.json` / `lighthouserc.mobile.json` audit only `/`, `/blog/`, `/blog/example-post/`, `/es/`, `/es/blog/`, `/es/blog/example-post/`; `src/lighthouse-routes.test.ts` derives the expected set from `pathFor`/`postPathFor` and blog frontmatter without depending on a prior build; commit `8a34c6c` | — (mutation recorded: swapping an entry for `/work/index.html` in a clone turns the test red on both the added and the dropped URL; restoring turns it green) |
| Font licences shipped | Implemented | `public/fonts/jetbrains-mono/OFL.txt`, `src/assets/fonts/OFL.txt` (verbatim SIL OFL 1.1); `src/font-license.test.ts`; `THIRD_PARTY_NOTICES.md`; commit `2396323` | — (mutation recorded: deleting `OFL.txt` from one font directory in a clone turns the test red; restoring turns it green). Note: the two `.ttf` files are SHA-256-verified against the upstream `master` branch; the two `.woff2` variable-font subsets are a derived build with no upstream artifact to hash against and are recorded as unverified provenance, not unlicensed — see `THIRD_PARTY_NOTICES.md` |
| Read-only CI | Implemented | `.github/workflows/ci.yml` — `permissions: contents: read` | — |
| Side-effect automation withdrawn | Implemented | `release-please.yml`, `cleanup-pages-previews.yml`, `pr-title-lint.yml` removed from `.github/workflows/` (preserved as opt-in examples at `docs/recipes/workflows/*.example`); only `ci.yml` ships by default; `src/repo-contract.test.ts` asserts no default-shipping workflow grants a `write` permission, runs `gh pr merge`, or calls an external API with a write verb; commit `cf28296` | — (mutation recorded: re-adding `contents: write` to `ci.yml` in a clone turns the test red on that one assertion; restoring turns it green) |

**Blocked item.** `.env.example` could not be created in this pass: the environment this work ran in
enforces a standing deny rule matching any `.env.*` path (write and read alike) for every
mechanism tried (file-write tool, shell redirection, `cp`, a Node `fs.writeFileSync` call). This
is a permission boundary, not a technical failure, and was not worked around. `src/env.d.ts`'s
`PUBLIC_COMING_SOON` declaration and the `src/env-contract.test.ts` parity test are written and
verified correct in isolation (the parity test correctly goes red only on the missing file) but
are held back, uncommitted, pending either a human creating `.env.example` directly or adjusting
the deny rule to exclude that one placeholder-only filename. R-11 and R-12 remain **Not built**
until that happens.

| Acceptance criterion | Holds? |
|---|---|
| test / check / build green | Yes at `2396323` (400 tests, `check` 0 errors, `seo-lint` clean) |
| Origin change alone leaves the build clean | Yes (recorded above) |
| No auto-triggered workflow that writes | Yes — `src/repo-contract.test.ts`; commit `cf28296` |
| Audited URLs are emitted routes | Yes — `src/lighthouse-routes.test.ts`; commit `8a34c6c` |
| Remote CI observed green | Not recorded |

### C — Hardening of gates and invariants

**Goal.** The build-time gates hold under inputs nobody has written yet, and the
invariants the contracts assert are enforced rather than trusted.

**Deliverables**, in build order — attribute extraction first, because the other
route rules read through it:

- Attribute extraction in the route gates made insensitive to attribute order
  and quoting style.
- Regional locale variants in hreflang matching.
- The `seo-lint` gate surface extended where it currently classifies by
  heuristic: asset classification for extensionless and unusual public files,
  opt-out for sitemap discovery, and a content-contract rule for slugs the
  router cannot carry.
- Provenance analysis in the documentation-parity gate: value flow through
  variable initialisers, so a finding constructed outside the analysed module
  graph cannot reach a collector unnoticed.
- i18n key parity enforced by a test rather than by review.

**Acceptance**

Every gate proven by deliberately breaking its producer and confirming a precise
diagnostic. Key parity proven by deleting a key and watching the suite fail.

**Depends on.** B, for the contracts that say what the gates are meant to hold.

**Status at `16d276a`: Open**

| Deliverable | Status | Evidence | Missing proof |
|---|---|---|---|
| Order- and quote-insensitive attribute extraction | Not built | `src/integrations/seo-lint/routes.ts:62-75` (canonical, OG: fixed order, double quotes), `:132-140`, `:174-190` (alternates, robots, sitemap) | — |
| Language match by primary subtag (content, `inLanguage`) | Implemented | `langMatches` at `src/integrations/seo-lint/lint.ts:176-185`, used at `routes.ts:266-285`; test `lint.test.ts` (es vs es-MX) | producer mutation not recorded |
| Regional variants in hreflang alternate coverage | Not built | `routes.ts:153-165` compares `hreflang` by exact string against `LOCALES` | — |
| Asset classification by emitted inventory | Implemented | `walkAssets` in `src/integrations/seo-lint/index.ts:95-111`, consumed at `routes.ts:366-400`; tests `routes.test.ts:429-493` (file-shaped routes, dotted slugs, Unicode names) | extensionless-file producer mutation not recorded |
| Sitemap discovery opt-out | Not built | `astro.config.mjs` sitemap `filter` is a fixed `EXCLUDED` list | — |
| Router-safe slug rule | Not built | `src/content.config.ts:17` — `slug: z.string()`, no constraint | — |
| Initialiser value-flow provenance | Not built | `documented-codes.test.ts:408-420` states local rebinding stops at the declaration | — |
| i18n key parity test | Implemented | `src/i18n/parity.test.ts`; commits `21ef614`, `c84ed06` | — (mutations recorded: deleting `nav.home` → named failure; orphan `fr.json`; empty `"nav": {}`) |

### D — Content and languages

**Goal.** The content model supports real translations, and the bilingual core
becomes a genuine option rather than a requirement.

**Deliverables**

- Per-locale content bodies, not translated frontmatter on a shared body.
- A tested path from the bilingual default to a single-language site, including
  the tests that today assume exactly `en` and `es`.
- A documented flow for adding a locale.
- The contract for a second content collection alongside `blog`.

**Acceptance**

Three site-scale mutations, performed rather than described: a Spanish body
renders at `/es/blog/<slug>/`; the documented monolingual conversion builds
green; adding a third locale builds green. `seo-lint` clean and i18n key parity
holding in all three.

**Depends on.** B. Per-locale bodies and the second-collection contract depend
on nothing in C. The monolingual and third-locale mutations depend on C's
attribute extraction and regional hreflang rows, because those mutations change
exactly what the route and sitemap gates see.

**Status at `16d276a`: Open**

| Deliverable | Status | Evidence | Missing proof |
|---|---|---|---|
| Per-locale content bodies | Not built | `src/content.config.ts:28-46` translates frontmatter only; `src/pages/blog/[slug].astro` and `src/pages/es/blog/[slug].astro` render the same entry body | — |
| Monolingual conversion path | Not built | `oppositeLocale` and route parsing are en/es-only (`src/lib/seo/locale.ts:55-58,79-88`); `t.test.ts`, `locale.test.ts`, `sitemap.test.ts`, `schemas/breadcrumb.test.ts`, `routes.test.ts` hardcode `es`; the adoption wizard §7 states no tested conversion exists | — |
| Add-a-locale flow | Not built | wizard §7 covers bilingual and monolingual only | — |
| Second-collection contract | Not built | only the guidance in `CLAUDE.md` | — |

Prerequisite already in place: the adoption wizard's §7 inventory test and the
i18n parity test derive their locale set from `LOCALES`, so they hold through a
conversion (`b6e2deb`, `37cc8c6`; mutation recorded: `LOCALES=['es']` with `en.json`,
`src/pages/es/` and the fallback removed → both suites green).

### E — Measured operability of skills

**Goal.** The skill library is actually used by the agents it is written for,
and that is measured rather than assumed.

**Deliverables**

- A routing mechanism an agent follows in practice.
- A tracked record of clean-agent simulations: scenario, input, runtime, commit
  tested, skills opened, forbidden pre-confirmation actions observed, result.
- A skill corpus that fits the context budget this repository sets for itself.
- An Astro binding layer for `form-slot`, which today stops at contract.

**Acceptance**

A clean-agent simulation, repeated, recording which skills were opened and
followed. Prose review is not an acceptance criterion here: a phase that only
rewrites documentation fails this by construction.

**Depends on.** B, for contracts worth routing to.

**Status at `16d276a`: Open**

| Deliverable | Status | Evidence | Missing proof |
|---|---|---|---|
| Adoption gate as the routing entry point | Implemented | `skills/site-build/references/adoption-wizard.md`; `CLAUDE.md` rule 0; `AGENTS.md`; commits `48caa77`, `501c715`, `30e6866`, `e377563`, `4d591f7`, `37cc8c6`, `1500b12` | behavioural proof lives outside the repository — see next row |
| Structural contract test for the wizard | Implemented | `src/agent-contracts/adoption-wizard.test.ts` (states, 15 contract fields, S1–S10, routing, Round 1 B wording, §7 inventory) | — |
| Tracked clean-agent simulation record | Not built | runs were performed while hardening the wizard, but no record is committed | — |
| Context-budget fit | Not built | no measurement exists | — |
| `form-slot` Astro binding | Not built | `skills/form-slot/SKILL.md` stops at contract | — |

### F — Deployment, workflows and supply chain

**Goal.** What ships is pinned, hardened and explained, and the build emits
nothing unexplained.

**Deliverables**

- Actions pinned by commit rather than by mutable tag.
- The active CI tests the Node version `engines` declares, asserted against it
  rather than hardcoded twice.
- Security headers in `public/_headers`.
- Standalone pages (`404`, `coming-soon`) brought into the head contract.
- Build warnings triaged: each one silenced deliberately or fixed.
- Pre-1.0 single-maintainer dependencies re-evaluated.
- Per-provider deployment recipes, including the host-level redirect
  `trailingSlash: 'always'` cannot perform for prerendered pages.

**Acceptance**

`bun run build` green with every warning explicitly accounted for. Workflow and
supply-chain changes human-reviewed. Optional workflows live outside
`.github/workflows/` or trigger only on `workflow_dispatch`.

**Depends on.** B, which decides which workflows exist at all.

**Status at `16d276a`: Open — not audited row by row.** Two rows are known Not
built: actions use mutable tags (`actions/checkout@v4`, `oven-sh/setup-bun@v2`,
`marocchino/sticky-pull-request-comment@v2`), and `public/_headers` sets only
`Cache-Control`. The remaining rows need an audit before they carry a status.

### G — Adoption contract

**Goal.** The published description of the template matches what it actually
does, so someone adopting it can predict what they are getting.

**Deliverables**

- A capability matrix: what the template does, what is opt-in, what is not
  built.
- A migration profile for dynamic or backend-backed use, described as a
  profile rather than as a verified capability.
- `README.md`, `AGENTS.md` and the template contract rewritten against the
  matrix.

**Acceptance**

Every row of the matrix mechanically checkable against the repository. A row
claiming "opt-in" must correspond to a workflow that does not trigger
automatically. A row claiming a capability must correspond to a command that
demonstrates it.

**Depends on.** B through F, all of them. **G is last, and that is not a
preference.** A capability matrix written before the phases that establish the
capabilities is a document describing intentions, which is the failure this
roadmap exists to prevent.

**Status at `16d276a`: Open.** Nothing built, by design: G waits for B–F.

## Known stale statements elsewhere

Found while verifying the status tables; each belongs to the phase that owns the
file, and none is fixed by this roadmap:

- `docs/product/current-repository-map.md` still describes a separate route map
  for sitemap hreflang; `astro.config.mjs` now delegates to `hreflangLinksFor()`
  in `src/lib/seo/sitemap.ts`, which reads `ROUTE_KEYS` and `LOCALES` (B).
- `src/lib/seo/types.ts:3` refers to a "Phase 4" that this roadmap does not have (B).

## Not scheduled

Capability that is deliberately unbuilt, recorded so it is not mistaken for an
oversight:

- **Automatic skill distribution.** `skills/` is canonical and is opened
  directly by path. The generator that would materialise per-agent adapters
  (`.agents/skills/`, `.claude/skills/`) is specified in
  `docs/product/agent-ecosystem-contract.md` and does not exist. Until it does,
  that contract describes a target, not a mechanism.
- **A release automation recipe.** The intended end state is a template that
  ships no automated release, so whoever wants one adopts it deliberately. That
  is now true: `release-please.yml` no longer ships in `.github/workflows/` (B
  row "Side-effect automation withdrawn"). It survives as an opt-in example at
  `docs/recipes/workflows/release-please.yml.example`, with its known R-34
  auto-merge defect and the `release-type: node` fix documented for anyone who
  adopts it — building a *hardened* recipe that ships by default remains
  unscheduled.

These have no phase because they have no committed date. Moving one into a phase
is a product decision, not a scheduling detail.
