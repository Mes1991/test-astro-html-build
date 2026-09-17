# test-astro-html-build

A domain-neutral, agent-ready Astro static site template.

> **AI agents:** read **[`AGENTS.md`](./AGENTS.md)** — it is the source of truth for the
> architecture, rebrand checklist, component catalog, and extension recipes.

## Status: work in progress, open for audit

This is a **template in active development**, not a finished, production-final
product. It is published here specifically to be reviewed by external auditors and
AI coding agents. See **[`AUDIT.md`](./AUDIT.md)** for the recommended audit scope,
known open items, and how to report findings.

The project is mid-migration on several fronts (package manager, i18n defaults,
skills distribution — see `AGENTS.md` → "Estado transitorio" for the authoritative
list). Do not assume a section of this README describes the final target state
unless `AGENTS.md`/`docs/product/template-contract.md` confirm it has landed.

## Canonical skills

`skills/` at the repository root is the **single canonical source** for the
AI-agent skill library (build recipes, SEO/toolchain/accessibility contracts, and
more). It is not a prompt — it is a consultable catalog: `AGENTS.md` → "Router de
skills" tells an agent which one to load per situation, and `skills/registry.yaml`
holds the full metadata (triggers, referenced contracts, status).

Per-agent adapters (`.agents/skills/` for Codex/OpenCode, `.claude/skills/` for
Claude) are **generated, gitignored copies** of `skills/` — never a second source
of truth. See `docs/product/agent-ecosystem-contract.md` for the full contract.

## Which agents/tools can consume this repo

- **Claude Code** — reads `CLAUDE.md` and materialized skills under `.claude/skills/`.
- **Codex / OpenCode** — read `AGENTS.md` and materialized skills under `.agents/skills/`.
- Any other agent or human contributor can start from `AGENTS.md` directly; it is
  kept short on purpose, with details deferred to `docs/product/` and to skills
  loaded on demand.

## Stack

- **[Astro 6](https://astro.build/)** — static-first framework, native i18n + content collections
- **[Tailwind CSS v4](https://tailwindcss.com/)** (via `@tailwindcss/vite`) — design tokens in `src/styles/global.css`
- **[GSAP 3](https://gsap.com/)** — timelines, `SplitText`, `CustomEase`, `ScrollTrigger`
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scroll, driven by the GSAP ticker
- **[React 19](https://react.dev/) + [Three.js](https://threejs.org/) / R3F** — WebGL islands
- **[Satori](https://github.com/vercel/satori) + Resvg** — build-time Open Graph images
- **[schema-dts](https://github.com/google/schema-dts)** — typed JSON-LD
- **vitest** — unit tests; build-time `seo-lint` integration; Lighthouse CI configs
- Self-hosted **JetBrains Mono**; system font stack for display/body

## Commands

This project currently uses **[Bun](https://bun.sh/)** (`bun.lock` is committed).
A migration to pnpm is planned but not yet complete — always verify the real
scripts in `package.json` before assuming a command exists.

| Command | Action |
| :--- | :--- |
| `bun install` | Install dependencies |
| `bun dev` | Start the dev server at http://localhost:4321 |
| `bun run build` | Build to `./dist/` — runs `seo-lint` (can fail the build) |
| `bun run preview` | Preview the production build locally |
| `bun run test` | Run the vitest suite (use this, **not** `bun test`) |
| `bun run audit` / `audit:mobile` | Build + Lighthouse CI |
| `bun astro check` | TypeScript / Astro type check |

## Project structure

```
/
├── astro.config.mjs        site URL, i18n, sitemap/hreflang, integrations
├── public/                 logo, favicon, fonts, draco, masks, _headers
├── skills/                 canonical AI-agent skill library (see above)
└── src/
    ├── styles/global.css   Tailwind @theme tokens + @font-face
    ├── layouts/BaseLayout.astro    head, SEO, Lenis+GSAP, intro overlay
    ├── content.config.ts   blog + portfolio collections
    ├── content/            example blog post + portfolio entries (deletable demos)
    ├── i18n/               en/es dictionaries + t() helper
    ├── pages/              home, blog, work, es/* mirrors, og endpoint, robots
    ├── components/         home, shared, seo, blog, work, case-study, coming-soon, react
    ├── lib/                seo (defaults/schemas/locale), og (templates/manifest), blog
    ├── integrations/seo-lint/    build-time SEO lint
    └── shaders/            GLSL for the WebGL image plane
```

## Getting started

1. `bun install`
2. Rebrand: edit `src/lib/seo/defaults.ts` (`siteSeo`), `astro.config.mjs` (`site`),
   `src/styles/global.css` (palette/fonts), `public/assets/logo-mark.svg`,
   `public/favicon.svg`, and the i18n strings. See the Rebrand Checklist in
   [`AGENTS.md`](./AGENTS.md).
3. Replace the `src/content/**/example-*` demo entries with your own.
4. `bun run build` and `bun run test` before deploying.

## Deployment

Pure static output (`bun run build` → `dist/`) — host on Netlify, Vercel, Cloudflare
Pages, or any static host. `public/_headers` provides cache headers in
Netlify/Cloudflare format. Set `SITE_ENV=production` to emit the full `robots.txt`.

## License

No license has been chosen yet for this repository. Treat it as **all rights
reserved** until a `LICENSE` file is added — see `AUDIT.md` for this pending
decision.
