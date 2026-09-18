# test-astro-html-build

A domain-neutral, agent-ready Astro static site template.

> **AI agents:** read **[`AGENTS.md`](./AGENTS.md)** — it is the source of truth for the
> architecture, component catalog, and extension recipes. For rebranding, use the
> **[Rebrand Checklist](./docs/product/rebrand-checklist.md)**.

## Status: work in progress, open for audit

This is a **template in active development**, not a finished, production-final
product. It is published here specifically to be reviewed by external auditors and
AI coding agents. See **[`AUDIT.md`](./AUDIT.md)** for the recommended audit scope,
known open items, and how to report findings.

The project is mid-migration on several fronts (i18n defaults, the legacy visual
stack, skills distribution — see `AGENTS.md` → "Estado transitorio" for the
authoritative list). The package manager is **not** part of that list: Bun is the
definitive package manager, not a migration in progress. Do not assume a section
of this README describes the final target state unless
`AGENTS.md`/`docs/product/template-contract.md` confirm it has landed.

## Canonical skills

`skills/` at the repository root is the **single canonical source** for the
AI-agent skill library (build recipes, SEO/toolchain/accessibility contracts, and
more) — it holds 7 real skills today. It is not a prompt — it is a consultable
catalog: `AGENTS.md` → "Router de skills" tells an agent which one to load per
situation. **A clean agent opens a skill directly by its canonical path,
`skills/<name>/SKILL.md`** — this is the operative mechanism today; there is no
`skills/registry.yaml` and no automatic distributor yet.

Per-agent adapters (`.agents/skills/` for Codex/OpenCode, `.claude/skills/` for
Claude) are **future work**, not a current mechanism: `docs/product/agent-ecosystem-contract.md`
documents the target (generated, gitignored copies of `skills/`, never a second
source of truth), but the distribution scripts don't exist yet.

## Which agents/tools can consume this repo

- **Claude Code** — reads `CLAUDE.md`, then opens skills directly from `skills/`.
- **Codex / OpenCode** — read `AGENTS.md`, then open skills directly from `skills/`.
- Any other agent or human contributor can start from `AGENTS.md` directly; it is
  kept short on purpose, with details deferred to `docs/product/` and to skills
  loaded on demand.
- Per-agent adapters (`.claude/skills/`, `.agents/skills/`) are future work — see
  "Canonical skills" above.

## Stack

- **[Astro 7](https://astro.build/)** — static-first framework, native i18n + content collections
- **[Tailwind CSS v4](https://tailwindcss.com/)** (via `@tailwindcss/vite`) — design tokens in `src/styles/global.css`
- **[GSAP 3](https://gsap.com/)** — timelines, `SplitText`, `CustomEase`, `ScrollTrigger`
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scroll, driven by the GSAP ticker
- **[React 19](https://react.dev/) + [Three.js](https://threejs.org/) / R3F** — WebGL islands
- **[Satori](https://github.com/vercel/satori) + Resvg** — build-time Open Graph images
- **[schema-dts](https://github.com/google/schema-dts)** — typed JSON-LD
- **vitest** — unit tests; build-time `seo-lint` integration; Lighthouse CI configs
- Self-hosted **JetBrains Mono**; system font stack for display/body

## Commands

This project uses **[Bun](https://bun.sh/)** (`bun.lock` is committed) as its
definitive package manager — there is no migration to pnpm, planned or pending.
Always verify the real scripts in `package.json` before assuming a command exists.

| Command | Action |
| :--- | :--- |
| `bun install --frozen-lockfile` | Install dependencies without touching the lockfile |
| `bun run dev` | Start the dev server at http://localhost:4321 |
| `bun run build` | Build to `./dist/` — runs `seo-lint` (can fail the build) |
| `bun run preview` | Preview the production build locally |
| `bun run check` | TypeScript / Astro type check |
| `bun run test` | Run the vitest suite (use this, **not** `bun test`) |
| `bun run audit` / `audit:mobile` | Build + Lighthouse CI |

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

This tree is generated from `git ls-files` — verify it against the real tree before
trusting it blindly. There is no `src/shaders/`, no `work`/`case-study` pages or
components, and no portfolio content collection in this repository.

## Getting started

1. `bun install`
2. Rebrand: follow the **[Rebrand Checklist](./docs/product/rebrand-checklist.md)** —
   `src/lib/seo/defaults.ts` (`siteSeo`), `astro.config.mjs` (`site`),
   `src/styles/global.css` (palette/fonts), `public/assets/logo-mark.svg`,
   `public/favicon.svg`, and the i18n strings are only part of it.
3. Replace the `src/content/**/example-*` demo entries with your own.
4. `bun run build` and `bun run test` before deploying.

## Deployment

Pure static output (`bun run build` → `dist/`) — host on Netlify, Vercel, Cloudflare
Pages, or any static host. `public/_headers` provides cache headers in
Netlify/Cloudflare format. Set `SITE_ENV=production` to emit the full `robots.txt`.

## License

**MIT** — see [`LICENSE`](./LICENSE). Third-party attributions are tracked in
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
