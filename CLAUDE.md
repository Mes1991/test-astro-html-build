# CLAUDE.md

test-astro-html-build is an **AI-first Astro static site template**. It is meant to be driven by AI
coding agents, not hand-edited by humans.

It is a **bold, blog-only site**: the home page flow is
`SiteHeader → Hero → FAQ → BlogTeaser → Footer`. The blog is the only content type;
there are no project-showcase, pricing, or contact features.

**`AGENTS.md` is the source of truth.** Read it before doing anything — it routes to
the architecture docs, the component catalog, SEO/OG/i18n/motion systems, and
recipes. For rebranding, use [`docs/product/rebrand-checklist.md`](./docs/product/rebrand-checklist.md).

## Must-follow rules

1. **Verify before claiming done:** run **`bun run build`** (includes the seo-lint
   integration — it can fail the build) **and** **`bun run test`** (vitest). Both must
   be green. Use `bun run test`, **not** `bun test` (that runs the wrong runner).
2. **Brand identity** lives in `src/lib/seo/defaults.ts` (`siteSeo`). Also set `site`
   in `astro.config.mjs` to match `siteSeo.siteUrl`.
3. **Keep the route map in sync** between `astro.config.mjs` (sitemap `ROUTE_MAP`) and
   `src/lib/seo/locale.ts` (`localizedSlugs` / `ROUTE_KEYS`).
4. **Preserve i18n key parity:** `src/i18n/en.json` and `es.json` must share identical
   keys; only the values differ.
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
