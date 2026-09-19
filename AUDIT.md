# AUDIT.md — how to audit this template

This repository is an AI-first Astro static site template. It is published to be
read and exercised by external auditors and by AI coding agents.

This file tells you **what to audit and how to verify it**. It deliberately does
not tell you what previous audits concluded: an audit that starts from someone
else's answers stops being an audit. Derive the state from the code and from the
commands below.

## Objective

Establish, from a clean clone, whether the template's stated contracts match its
actual behaviour. The contracts live in:

| Contract | File |
|---|---|
| Rules an agent must follow in this repository | `CLAUDE.md` |
| How an agent works here, and which skill covers what | `AGENTS.md` |
| The product the template is converging on | `docs/product/template-contract.md` |
| Capability roadmap and acceptance criteria | `docs/product/implementation-roadmap.md` |
| What the repository contains today | `docs/product/current-repository-map.md` |
| The skill distribution contract | `docs/product/agent-ecosystem-contract.md` |
| Rebranding the template | `docs/product/rebrand-checklist.md` |

A gap between a contract and the code is a finding. So is a contract that
describes a capability the repository does not have.

## Surfaces to audit

- **SEO.** `src/lib/seo/`, `src/integrations/seo-lint/`, `astro.config.mjs`.
  `src/lib/seo/locale.ts` (`ROUTE_KEYS`, `localizedSlugs`) is the single route
  map; `astro.config.mjs` derives the sitemap's hreflang links from it through
  `hreflangLinksFor`. Confirm the locale set agrees between `i18n.locales` /
  `defaultLocale` in `astro.config.mjs` and `LOCALES` / `DEFAULT_LOCALE` in
  `src/lib/seo/types.ts` (`CLAUDE.md` rule 3).
- **seo-lint.** `src/integrations/seo-lint/` runs at `astro:build:done` and can
  fail the build. Its complete set of finding codes and severities is published
  in `skills/static-site-seo/SKILL.md` and
  `docs/product/rebrand-checklist.md`, and
  `src/integrations/seo-lint/documented-codes.test.ts` holds those lists to the
  source in both directions. Audit the gates by breaking a producer on purpose
  and confirming the build fails with a precise diagnostic.
- **i18n.** `src/i18n/en.json` and `src/i18n/es.json` must share identical keys;
  only values differ (`CLAUDE.md` rule 4).
- **Accessibility and reduced motion.** The GSAP / Lenis / Three.js islands in
  `src/components/` and `src/layouts/BaseLayout.astro`. Verify
  `prefers-reduced-motion` handling, and keyboard navigation for content and
  essential navigation.
- **Progressive enhancement.** Content and navigation must work with JavaScript
  disabled.
- **Skills.** `skills/` holds the canonical skill library, opened directly at
  `skills/<name>/SKILL.md`. `docs/product/agent-ecosystem-contract.md` states
  the target distribution contract and which parts of it are not built.
- **Build reproducibility.** Green from a clean checkout, with no network access
  beyond dependency installation.
- **Dependency surface.** `package.json` and `bun.lock`, for known-vulnerable or
  unexpected transitive dependencies. `bun.lock` is the only permitted lockfile.
- **Secrets.** No credentials, tokens or personal machine paths anywhere in the
  tree, including examples.

## Commands

Run from a clean checkout, in order:

```bash
bun install --frozen-lockfile
bun run test
bun run check
bun run build
```

Use `bun run test` (vitest), never `bun test` — the latter runs a different
runner against the wrong files. `bun run build` includes the `seo-lint`
integration and can fail the build on an SEO regression.

## Acceptance criteria

| Command | Passing means |
|---|---|
| `bun install --frozen-lockfile` | resolves with no lockfile change |
| `bun run test` | every test passes |
| `bun run check` | 0 errors and 0 warnings |
| `bun run build` | exits 0 and the log ends with `seo-lint: clean` |

Beyond the commands:

- every documented contract is true of the code as it exists;
- a capability the documentation claims is either implemented and verifiable, or
  stated plainly as not built;
- `bun run build` warnings are explained, not ignored.

## Reporting findings

Open an issue on this repository with:

- the affected file(s) and line(s);
- expected versus observed behaviour;
- reproduction steps, including every command run, from a clean checkout;
- severity: informational, minor, major or blocking.

A finding is confirmed only with a source trace, a bounded reproduction and a
stated impact. Anything short of that is a hypothesis; label it as one.

Do not include secrets, credentials or personal machine paths in a report. If
you find one in this repository, report its location as a finding rather than
reproducing the value.
