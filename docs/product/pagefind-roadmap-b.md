# PF-B — Clean-agent adoption proof

**This is not a phase of `docs/product/implementation-roadmap.md`.** It does not renumber, edit,
or supersede phases B–G or units C3–C7 there. Closing PF-B does not by itself authorize any
install or production change beyond the single disposable-copy test implementation this unit
performs and records.

Sibling documents: [`pagefind-roadmap-a.md`](./pagefind-roadmap-a.md) (static search skill,
skill-only — a dependency of this unit) and [`pagefind-roadmap-c.md`](./pagefind-roadmap-c.md)
(real activation in an adopted site, depends on this unit). Source brief: an external document,
*Static Search Capability*, dated 2026-09-24, inspecting `main` at `16d276a73bfaaebcb3475b5f9ae545d23ec0e573`
(main has since moved to `9114ce7`). That brief is not part of this repository; this file, and
its two siblings, are the in-repo source of truth.

## Goal

A skill is not accepted merely because its Markdown looks correct. PF-B runs a simulation in a
disposable copy of the template, handing a clean agent a natural-language request without the
conclusions of the source brief or of PF-A's rationale, and records whether the agent follows the
contract PF-A's skill states.

## Depends on

PF-A. `skills/static-site-search/SKILL.md` must exist, be catalog-eligible, and be reachable by
`site-build`'s routing before this simulation can run — otherwise there is nothing for the clean
agent to load.

## Disposable copy

Run the simulation in a throwaway clone or worktree of the template, never in this working
repository. The copy must include the PF-A diff (the new skill, the updated catalog and routers)
but nothing else specific to this brief or to PF-A's write-up. Discard the copy after the run;
only the record described below is kept.

## Test prompt (verbatim, original Spanish — this is the test input)

> Este blog estático necesita búsqueda dentro del contenido de sus posts. Usa el template y
> agrega esa capacidad.

Do not translate, paraphrase, or annotate this prompt before giving it to the agent under test:
the exact wording is the input, and rephrasing it would test a different prompt.

## Expected behavior before writing

The agent under test must, before any write:

- load `site-build` and then `static-site-search` — not all eight skills;
- detect that a card filter already exists (`BlogArchive.astro`);
- ask about scope, per-locale UI, filters/metadata, the no-JavaScript fallback, and what to do
  with the existing filter;
- explain that real search is tested with build/preview, not with `astro dev`;
- introduce no CMS, backend, GitHub Actions, or environment variables.

## Expected result after authorizing a test implementation

Once the human running the simulation answers the contract questions and authorizes a bounded
test implementation:

- Pagefind is a devDependency, not a runtime dependency;
- `bun run build` runs Astro and Pagefind exactly once;
- the UI uses the Component UI, not legacy `PagefindUI` or React;
- `dist/pagefind/` is not committed and not copied to `public/`;
- EN and ES results are not mixed;
- a non-root `base` works;
- a real query demonstrates the expected URL set bidirectionally, the agreed exclusions, and the
  agreed metadata/filters;
- browser tests demonstrate keyboard navigation, focus, zero-results announcement, and the
  no-JavaScript fallback;
- `bun run test`, `bun run check`, `bun run build`, and `git diff --check` are all green.

## Failure conditions

PF-B is not ready — and PF-A is not closeable through it — if the agent under test does any of
the following: starts installing before asking the contract questions; ends up with two ambiguous
search implementations (the local filter and Pagefind both live and unreconciled); adds
`postbuild` in addition to a chained `build`; or declares success without querying the generated
index.

## Record format for the run

Record each simulation run as a block with these fields, committed under this document or a
linked artifact named here (never left only in a chat transcript):

- **Commit tested** — the PF-A commit/diff state used to build the disposable copy.
- **Agent / runtime** — which agent and runtime executed the simulation.
- **Transcript location** — where the full transcript is kept (path or link); PF-B's record here
  is a summary, not a substitute for the transcript.
- **Observed vs. expected, per bullet** — for every bullet in "Expected behavior before writing"
  and "Expected result after authorizing a test implementation" above, record what was actually
  observed and whether it matches.
- **Result** — PASS or FAIL, with the specific failure condition triggered if FAIL.

## PF-A + PF-B together close S1

Brief §11 lists a clean-agent simulation as one of S1's closing criteria. PF-A's acceptance
(`pagefind-roadmap-a.md`) explicitly excludes that bullet and defers it here. S1 as a whole is not
closed until both PF-A's acceptance list and this unit's recorded PASS run are satisfied.

## Global roadmap guard (mandatory)

Before PF-B is closed, Codex runs a read-only adversarial review confirming the unit — including
whatever the disposable-copy test implementation produced, if its patterns are proposed for reuse
— breaks nothing the global roadmap (`docs/product/implementation-roadmap.md`) has accepted or
tracks — at minimum:

- phase B contracts and the rebrand checklist;
- phase C gates: `seo-lint` route gates, `parse5`-based extraction, hreflang validation,
  sitemap/`noindex` independence and the strict sitemap marker contract, router-safe slugs,
  documented-codes provenance including `UNRESOLVED_FINDING_PROVENANCE`, and i18n key parity;
- the single route map in `src/lib/seo/locale.ts` and its locale sync with `astro.config.mjs`;
- the gates `bun run test`, `bun run check`, `bun run build` (seo-lint clean), and
  `git diff --check`.

Internal search inclusion must never be derived from `noindex`, sitemap, or canonical. The
disposable copy is discarded after the run, so this guard applies to PF-B's own record and to
this repository's PF-A/PF-B documentation, not to the throwaway clone's contents. The review
returns `PASS`, `PASS_WITH_FINDINGS`, or `NEEDS_ATTENTION`, with file:line and a reproduction per
blocker. Findings outside PF-B's scope go to the human, not auto-fixed.

## Status

| Deliverable | Status | Evidence | Missing proof |
|---|---|---|---|
| Disposable copy prepared from a PF-A-complete state | Not built | — | Requires PF-A closed first; record which PF-A commit/diff seeded the copy. |
| Simulation run with the verbatim test prompt | Not built | — | A recorded run following the "Record format for the run" fields above. |
| Pre-write behavior observed and scored | Not built | — | Per-bullet observed-vs-expected record for "Expected behavior before writing". |
| Post-authorization result observed and scored | Not built | — | Per-bullet observed-vs-expected record for "Expected result after authorizing a test implementation". |
| Failure conditions checked | Not built | — | Explicit record that none of the four failure conditions triggered, or which one did. |
| Run marked PASS or FAIL | Not built | — | A single stated verdict tied to the recorded evidence above. |
| Codex adversarial review of the run | Not built | — | Recorded verdict (`PASS` / `PASS_WITH_FINDINGS` / `NEEDS_ATTENTION`) with file/line and repro per finding, if the disposable implementation's patterns are proposed for reuse. |
| Global roadmap guard review | Not built | — | Recorded verdict confirming no phase B/C contract, gate, or route-map invariant is broken. |
