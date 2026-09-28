# astro-7-html-template by TFM

A general-purpose, agent-ready Astro static site template for building client sites.

> **AI agents:** read **[`AGENTS.md`](./AGENTS.md)** first — it is the source of truth for
> architecture, the skill router, and extension recipes.

## What this is

A template meant to be adopted per client, not used as-is. Everything content-, brand- or
domain-specific in this checkout is a **replaceable demo**:

- **Brand identity** — `siteSeo` in `src/lib/seo/defaults.ts` (name, tagline, organization info),
  `siteSeo.siteUrl` (`https://example.com`).
- **Intro/header wordmark** — hardcoded `"Example Site"` in `src/layouts/BaseLayout.astro` and
  `src/components/shared/SiteHeader.astro` (documented in the Rebrand Checklist below).
- **Logo/favicon** — `public/assets/logo-mark.svg`, `public/favicon.svg` (a placeholder "S" mark).
- **Content** — every `src/content/**/example-*` entry (and its `src/assets` image).

A brief asking for services, pricing, projects or contact pages is asking you to extend the
template — `blog` is the only content collection today, not a ceiling. See
`AGENTS.md`/`CLAUDE.md` for how to add a collection alongside it.

## Maturity

**Usable today, still maturing.** The template can be adopted for client sites now, but it is not a finished, production-final product: several parts
are still migrating toward the target below. External audit remains welcome — see
[`AUDIT.md`](./AUDIT.md) for the audit scope, known open items and how to report findings.

The project is mid-migration on several fronts — i18n defaults, the legacy visual stack, SEO
config sourcing. Today vs. target, briefly (full table in `AGENTS.md` → "Estado actual vs.
objetivo"):

| Today | Target |
|---|---|
| en/es bilingual is mandatory, key parity enforced | Monolingual by default; i18n opt-in |
| Config scattered (`siteSeo`, `astro.config.mjs`, hardcoded wordmarks) | Single `src/site.config.ts` |
| GSAP/Lenis/React/Three.js wired into every page using `BaseLayout` | Opt-in, extractable visual stack |
| `tools/seo.mjs` referenced by generic skill contracts | Does not exist and is not planned — the real validator is `src/integrations/seo-lint/` |

**Bun is not part of that migration list** — it is the definitive package manager, final
decision, not pending. Do not assume a section of this README describes the final target state
unless `AGENTS.md` or `docs/product/template-contract.md` confirms it has landed.

## Adoption

**With an AI agent:** any request to build, rebuild, adopt or broadly extend a site with this template — however
phrased, including a bare design link — runs the `site-build` skill's adoption-wizard contract
first: `skills/site-build/references/adoption-wizard.md`. Nothing is written (no files, branches,
commits, installs, background workers) and no subagent is delegated to until the human explicitly
confirms the contract. Implementation then proceeds per the confirmed brief.

**Manual path (a human editing by hand):** follow the
[Rebrand Checklist](./docs/product/rebrand-checklist.md) — it is the single canonical checklist
for identity, site URL, SEO defaults, colors/typography, logo/favicon, languages and example
content. When an agent is doing the work, the checklist does **not** replace the adoption-wizard
contract above — it documents *where* to edit once scope, languages and features are already
decided; the wizard is what decides them.

## Skills

`skills/` at the repository root is the single canonical source for the AI-agent skill library —
11 real skills today, each a workflow with the contracts it owns. Full catalog, contracts and
when to load 1–3 of them per phase: **[`skills/README.md`](./skills/README.md)**.

| Skill | When it activates | Why it matters |
|---|---|---|
| `site-build` | Any build/rebuild/extend/adopt request, first | Runs the adoption gate; owns build order and input precedence |
| `project-setup` | Start of a project or toolchain change | Settles build step, styling toolkit, languages before any markup |
| `seo-research` | Keyword/SERP/competitor research, content gaps | Grounds new pages in evidence instead of guesses |
| `astro-craft` | Building or editing a page, section, component or style | Owns structure, visual craft, browser support, accessibility |
| `design-ingestion` | A Figma link, export, mockup or screenshot arrives | Establishes provenance and exports real assets, never approximations |
| `svg-assets` | Creating/editing/reviewing a logo, favicon or icon SVG | Picks the correct role, embedding and accessible name per asset |
| `form-slot` | A design shows a form with no provider embed yet | Separates markup (card) from embed, once a provider is activated |
| `static-site-seo` | Creating, renaming, translating or removing a page | Owns `<head>`, JSON-LD, sitemap/robots correctness |
| `faq-content` | Writing/editing/auditing an on-page FAQ | Keeps visible FAQ and `FAQPage` JSON-LD in sync, no fabricated answers |
| `visual-gate` | Proving a built page against a reference, or at every width | The acceptance gate: fidelity, responsive, a11y and SEO checks |
| `static-site-search` | Adding internal full-text search (Pagefind) | Opt-in; requires a confirmed contract before installing anything |

**On SEO and FAQ value:** the SEO skills aim for useful, people-first content and structured data
that matches what the page visibly says — `bun run audit:content` checks that the visible FAQ and
its `FAQPage` JSON-LD agree. None of this guarantees rankings, rich results or visibility in AI
answers; Google retired the FAQ rich-result presentation from Search in May 2026
([source](https://developers.google.com/search/docs/appearance/structured-data/faqpage)), so an
FAQ is worth keeping only for the readers it helps.

## How agents read this repo

- **Claude Code** reads `CLAUDE.md` first (when it exists, `AGENTS.md` is not auto-loaded), which
  points to `AGENTS.md`, then opens skills directly from `skills/`.
- **Codex / OpenCode** read `AGENTS.md` directly, then open skills from `skills/`.
- Any other agent or human contributor can start from `AGENTS.md`; it is kept short on purpose,
  with detail deferred to `docs/product/` and to skills loaded on demand.
- **By-path reading (`skills/<name>/SKILL.md`) always works** and needs no setup. Per-agent
  adapters (`.claude/skills/`, `.agents/skills/`) are optional and **generated**, not committed:
  `bun run agent:setup -- <codex|claude|opencode|all>` materializes them, `bun run agent:check --
  <target>` verifies without writing. A clean clone has neither adapter until `agent:setup` runs —
  do not assume automatic skill discovery without that step. Full command set and per-runtime
  discovery rules: [`skills/distribution.md`](./skills/distribution.md).

## Stack and current limits

- **[Astro 7](https://astro.build/)** — static-first framework, native i18n + content collections
- **[Tailwind CSS v4](https://tailwindcss.com/)** (via `@tailwindcss/vite`) — design tokens in `src/styles/global.css`
- **[GSAP 3](https://gsap.com/)** + **[Lenis](https://lenis.darkroom.engineering/)** — global visual stack, wired into every page that uses `BaseLayout.astro` (intro overlay, smooth scroll); today mandatory, target opt-in (see Maturity)
- **[React 19](https://react.dev/)** — one island today: `src/components/react/NotFoundBackground.tsx` (`client:idle` on `404.astro`, a `gradflow` WebGL gradient)
- **[Three.js](https://threejs.org/)** — used directly (not via React) in `src/components/coming-soon/Hero3D.astro`; `@react-three/fiber`/`@react-three/drei` are installed dependencies but are not imported anywhere in the codebase
- **[Satori](https://github.com/vercel/satori) + Resvg** — build-time Open Graph images
- **[schema-dts](https://github.com/google/schema-dts)** — typed JSON-LD
- **vitest** — unit tests; build-time `seo-lint` integration; Lighthouse CI configs (manual/opt-in)
- en/es bilingual with i18n key parity (target: monolingual by default)
- Self-hosted **JetBrains Mono**; system font stack for display/body

**Not packaged today:** a reusable video-scroll or generic interactive-3D component (the
`coming-soon` Hero3D is a direct Three.js example, not a reusable primitive), and host-specific
deploy recipes beyond `public/_headers`. See `AGENTS.md` → "Sin skill dedicada".

## Commands

This project uses **[Bun](https://bun.sh/)** (`bun.lock` is committed) as its definitive package
manager — there is no migration to pnpm, planned or pending. Always verify the real scripts in
`package.json` before assuming a command exists.

| Command | Action |
| :--- | :--- |
| `bun install --frozen-lockfile` | Install dependencies without touching the lockfile |
| `bun run dev` | Start the dev server at http://localhost:4321 |
| `bun run build` | Build to `./dist/` — runs `seo-lint` (can fail the build) |
| `bun run preview` | Preview the production build locally |
| `bun run check` | TypeScript / Astro type check |
| `bun run test` | Run the vitest suite (use this, **not** `bun test`) |
| `bun run audit:content` | Runs `seo-faq-audit.mjs` against `dist/` and `svg-audit.mjs` against `public`/`src` — needs a prior `bun run build`; CI gates on it |
| `bun run audit` / `audit:mobile` | Build + Lighthouse CI — manual/opt-in only, not run in CI |
| `bun run agent:setup -- <target>` / `agent:check -- <target>` | Generate/verify optional per-agent skill adapters (`codex`/`claude`/`opencode`/`all`) |

## Verification

Before calling anything done, from a clean checkout:

```bash
bun install --frozen-lockfile
bun run test
bun run check
bun run build
bun run audit:content
```

`.github/workflows/ci.yml` runs exactly these steps (install → test → check → build →
audit:content → lockfile-integrity check), on push to `main`, on pull requests and on
`workflow_dispatch`, across Linux and a Windows leg with a space in the checkout path. This
documents what CI runs — it is not a claim that any specific run has passed; verify the actual
workflow run for a given change.

## Project structure

```
/
├── astro.config.mjs        site URL, i18n, sitemap/hreflang, integrations
├── public/                 logo, favicon, fonts, draco, masks, _headers
├── skills/                 canonical AI-agent skill library (see above)
└── src/
    ├── styles/global.css   Tailwind @theme tokens + @font-face
    ├── layouts/BaseLayout.astro    head, SEO, Lenis+GSAP, intro overlay
    ├── middleware.ts       coming-soon gate (rewrites every route when active)
    ├── content.config.ts   blog collection schema
    ├── content/            example blog post (deletable demo)
    ├── i18n/               en/es dictionaries + t() helper
    ├── pages/              home, blog, es/* mirrors, coming-soon, 404, og endpoint, robots
    ├── components/         home, shared, seo, blog, coming-soon, react
    ├── lib/                seo (defaults/schemas/locale), og (templates/manifest), blog
    └── integrations/seo-lint/    build-time SEO lint
```

This tree is generated from `git ls-files` — verify it against the real tree before trusting it
blindly. There is no `src/shaders/`, no `work`/`case-study` pages or components, and no portfolio
content collection in this repository.

## Getting started

This section is for a human working by hand. **If an AI agent is doing this work, it must run
the adoption-wizard contract first** (see "Adoption" above) — the steps below are not a substitute
for that gate.

1. `bun install --frozen-lockfile`
2. Rebrand: follow the [Rebrand Checklist](./docs/product/rebrand-checklist.md) —
   `src/lib/seo/defaults.ts` (`siteSeo`), `astro.config.mjs` (`site`),
   `src/styles/global.css` (palette/fonts), `public/assets/logo-mark.svg`,
   `public/favicon.svg`, and the i18n strings are only part of it.
3. Replace the `src/content/**/example-*` demo entries with your own.
4. `bun run test`, `bun run check`, `bun run build` and `bun run audit:content` before deploying.

## Deployment

Pure static output (`bun run build` → `dist/`) — host on Netlify, Vercel, Cloudflare Pages, or
any static host. `public/_headers` provides cache headers in Netlify/Cloudflare format. Set
`SITE_ENV=production` to emit the full `robots.txt`.

## License

**MIT** — see [`LICENSE`](./LICENSE). Third-party attributions are tracked in
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
