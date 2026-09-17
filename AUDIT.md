# AUDIT.md — external audit guide

Status: **work in progress**. This snapshot is published specifically to be
readable by external auditors and AI coding agents, not as a finished,
production-final release. Treat every finding against the transitional state
documented in `AGENTS.md` → "Estado transitorio", not against an assumed
finished product.

## Recommended audit scope

- **SEO**: `src/lib/seo/`, `src/integrations/seo-lint/`, `astro.config.mjs`
  (sitemap `ROUTE_MAP`), `src/lib/seo/locale.ts` (`localizedSlugs`/`ROUTE_KEYS`).
  Confirm these two route maps stay in sync (see `CLAUDE.md` rule 3).
- **i18n**: `src/i18n/en.json` and `src/i18n/es.json` must share identical keys
  (values only differ) — see `CLAUDE.md` rule 4.
- **Accessibility / reduced motion**: GSAP/Lenis/Three.js islands in
  `src/components/`, `src/layouts/BaseLayout.astro`; verify
  `prefers-reduced-motion` handling and keyboard navigation for content and
  essential navigation.
- **Build reproducibility**: `bun install`, `bun run build`, `bun run test`
  must be green from a clean checkout (no network access required beyond
  dependency installation).
- **Skills architecture**: `skills/` (canonical) vs. the per-agent adapters
  described in `docs/product/agent-ecosystem-contract.md`
  (`.agents/skills/`, `.claude/skills/`) — both adapters are generated and
  gitignored; they are intentionally absent from this snapshot.
- **Dependency surface**: `package.json` / `bun.lock` for known-vulnerable or
  unexpected transitive dependencies.

## Canonical skills / adapter architecture

`skills/` is the single source of truth for the AI-agent skill library.
`docs/product/agent-ecosystem-contract.md` documents the ratified distribution
contract: Codex and OpenCode read `.agents/skills/`, Claude reads
`.claude/skills/`, both are generated copies (never hand-edited, never a
second source of truth), and Orca-style personal orchestration tooling is
explicitly out of the template contract. `scripts/agent-setup.mjs` /
`scripts/agent-check.mjs` (the sync/verification scripts) are **not yet
implemented** — this is a known, documented gap, not an oversight.

## Reporting findings

Open an issue on this repository with:

- the affected file(s) and line(s);
- expected vs. observed behavior;
- reproduction steps (command(s) run, from a clean checkout);
- severity (informational / minor / major / blocking).

Do not include secrets, credentials, or personal machine paths in a report —
if you find one in this repository, report it as a finding rather than
reproducing the value verbatim.

## Real status: known open items

- **Package manager migration (Bun → pnpm)**: not started in this snapshot;
  `bun.lock` and `bun run *` scripts are still authoritative. See `AGENTS.md`
  → "Estado transitorio".
- **`src/site.config.ts` single-source site configuration**: not implemented
  yet; site configuration is currently split across
  `src/lib/seo/defaults.ts` and `astro.config.mjs`.
- **Monolingual-by-default / i18n as an opt-in extension**: not implemented
  yet; en/es are both currently mandatory with key parity.
- **Legacy visual stack (GSAP, Lenis, React, Three.js) as opt-in**: currently
  wired into the core (`BaseLayout.astro`, 404, coming-soon), not yet
  extractable.
- **Skill distribution mechanism** (`scripts/agent-setup.mjs`,
  `scripts/agent-check.mjs`): documented and ratified, not yet implemented —
  see `docs/product/agent-ecosystem-contract.md` → "Estado de implementación".
- **`tools/seo.mjs`**: referenced by the `static-site-seo` skill contract as a
  standalone SEO validation tool; this file does not exist in the repository
  yet (tracked as gap `tools-seo-mjs` in `skills/registry.yaml` — note that
  file itself is excluded from this public snapshot because it still contains
  local machine paths; the gap is reproduced here for visibility).
- **License**: no `LICENSE` file exists yet. This is a pending decision, not
  an omission — treat the repository as all-rights-reserved until one is
  added.

## Reproducible commands

Run from a clean checkout, in order:

```
bun install
bun run build
bun run test
```

`bun run build` includes the `seo-lint` build integration and can fail the
build on SEO regressions. Use `bun run test` (vitest), not `bun test`.
