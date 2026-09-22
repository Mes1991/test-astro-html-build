# CLAUDE.md

test-astro-html-build is an **AI-first Astro static site template**. It is meant to be driven by AI
coding agents, not hand-edited by humans.

**Current state** — the template ships blog-only: the home page flow is
`SiteHeader → Hero → FAQ → BlogTeaser → Footer`, and `blog` is the only content
collection defined in `src/content.config.ts`.

That is a description of what exists, **not a restriction on what you may build**.
A brief asking for services, projects, pricing or contact pages is asking you to
extend the template, which is what it is for. Add a content collection as a
structural sibling of `blog`, keep en/es key parity, and keep the route map in
`astro.config.mjs` in sync with `src/lib/seo/locale.ts` (rules 3 and 4 below).

**`AGENTS.md` is the source of truth.** Read it before doing anything — it routes to
the architecture docs, the component catalog, SEO/OG/i18n/motion systems, and
recipes. For rebranding, use [`docs/product/rebrand-checklist.md`](./docs/product/rebrand-checklist.md).

## Must-follow rules

0. **Adoption gate first:** any request to build, rebuild or adopt a site with this template —
   however it is phrased, including a bare design link — runs
   `skills/site-build/references/adoption-wizard.md` before anything else — read it before any
   other tool call or delegation. No write of any kind (files, DESIGN.md, assets, installs,
   branches, commits, background workers) and no delegation to any subagent — a shell is a write
   tool, so no subagent is read-only by construction; intake reads are done directly — until the
   human confirms the adoption contract.
1. **Verify before claiming done:** run **`bun run build`** (includes the seo-lint
   integration — it can fail the build) **and** **`bun run test`** (vitest). Both must
   be green. Use `bun run test`, **not** `bun test` (that runs the wrong runner).
2. **Brand identity** lives in `src/lib/seo/defaults.ts` (`siteSeo`); Astro config `site`
   derives from `siteSeo.siteUrl`.
3. **`src/lib/seo/locale.ts` (`ROUTE_KEYS` / `localizedSlugs`) is the only route map** —
   `astro.config.mjs` derives the sitemap's hreflang links from it via `hreflangLinksFor`,
   so add or rename a top-level route there and nowhere else. What still has to be kept in
   sync by hand is the locale set: `i18n.locales` / `defaultLocale` in `astro.config.mjs`
   must match `LOCALES` / `DEFAULT_LOCALE` in `src/lib/seo/types.ts`. That locale sync holds
   while the site keeps more than one locale; a confirmed monolingual contract settles it through
   the migration in `skills/site-build/references/adoption-wizard.md` §7.
4. **Preserve i18n key parity:** `src/i18n/en.json` and `es.json` must share identical
   keys; only the values differ — while the site is bilingual.
5. **`src/content/**/example-*`** files (and their `src/assets` images) are deletable
   demos — remove them for a real site.

## Agent skills

`skills/` is the canonical source — it holds the 7 real skills that exist today.
**A clean agent opens a skill directly by its canonical path,
`skills/<name>/SKILL.md`.** That is the operative mechanism today; there is no
automatic distributor yet.

Future work (not implemented — see `docs/product/agent-ecosystem-contract.md`
→ "Estado de implementación"): `node scripts/agent-setup.mjs
<codex|claude|opencode|all>` would materialize per-agent adapters, with Claude
reading its own copy from `.claude/skills/` (generated, gitignored — never
edit it by hand). `skills/registry.yaml` does not exist yet either; never
describe it or the setup/check scripts as already working.
