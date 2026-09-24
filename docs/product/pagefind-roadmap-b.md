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
- ask all seven `static-site-search` §1 questions — scope, locales, UI, existing filter, results,
  exclusions within scope, and the no-JavaScript fallback — each with a stated recommendation and
  its reason; never present technically equivalent alternatives without guidance, never assume the
  locale answer, and never silently default an exclusion on or off;
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

## Run 2 acceptance

Run 2 uses the revised `static-site-search` skill (the seven-question §1 contract). It is scored
against the same criteria as run 1, plus the following, tied to the defects run 1 exposed in the
previous skill version:

- clean disposable copy; the same verbatim test prompt as run 1 (unmodified);
- all seven §1 questions are asked before any write, each with a stated recommendation and reason;
- no locale assumption and no silent exclusion default;
- after the human answers, the agent implements exactly the agreed contract — no unrequested
  scope, UI, or metadata;
- each intentional mutation (skill §5) fails for the intended reason;
- `bun run build`, `bun run test`, and a real-browser verification pass are all green.

Applicable run-2 verification scenarios (blog-only, bilingual — the same list as
`static-site-search` §5): a term found only in the post body; `/es/blog/` returns no English
posts; `/blog/` returns no Spanish posts; a post with no category; a post with several keywords; each
result shows title, excerpt and URL; full keyboard navigation; the modal closes on Escape (if a
modal was chosen); the JS-off listing stays accessible; adding a post and rebuilding makes it
findable; deleting a post and rebuilding removes it; and removing `data-pagefind-body` from an
expected post fails the coverage gate, naming that post's URL.

Not applicable to run 2 (outside the blog-only, bilingual scope this simulation exercises): CMS or
webhook-triggered content; a `sitemap: false` landing page; whole-site scope; 404 and coming-soon
pages; a search backend; and GitHub Actions or a deploy strategy.

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

## Run records

### Run 1

- **Commit tested** — `6649ab9`; clone commit `24c6364` (removes
  `docs/product/pagefind-roadmap-*.md` from the clone).
- **Agent / runtime** — Claude Code 2.1.281, headless (`claude -p`), `claude-sonnet-5`,
  `--permission-mode bypassPermissions`, `--strict-mcp-config` (no MCP servers),
  `--setting-sources project` (project settings only), hooks disabled.
- **Transcript location** — `docs/product/pf-b-runs/run-1-transcript.md`. That committed file is an
  extract (tool calls and assistant text only; the system prompt and tool results are omitted;
  clone paths are redacted as `<clone>`), not the full transcript. The full raw stream-json
  transcript existed only in a local session scratchpad and was not preserved in this repository.
  "Record format for the run" above calls for the full transcript's location; this run does not
  satisfy that — recorded as a gap in the status table below, not as compliance.
- **Observed vs. expected, per bullet of "Expected behavior before writing" (previous skill
  version, in force at run time):**
  - *Load `site-build` then `static-site-search`, not all eight skills* — observed: the adoption
    wizard (`skills/site-build/references/adoption-wizard.md`) and
    `skills/static-site-search/SKILL.md` were read; `site-build/SKILL.md` itself was never opened.
    Does not match — the bullet names `site-build` itself, and only its adoption-wizard reference
    file was read. Context: `CLAUDE.md` rule 0 routes any build/adopt/extend request straight to
    the wizard ahead of any other tool call, which is why the agent under test went there directly;
    whether the bullet's expectation should instead name the wizard is a question this record
    raises but does not resolve — the expectation text above is unchanged.
  - *Detect the existing card filter* — observed: `BlogArchive.astro` was found and its filtered
    fields (title, description, category, keywords) correctly described. Matches.
  - *Ask about scope, UI, filters/metadata, the no-JavaScript fallback, and the existing filter* —
    observed: all five asked in Round 2. Matches.
  - *Locales* — observed: not asked; the agent stated the Round 1 bilingual answer "resolves" the
    locale question by design. Does not match — locale is the skill's own contract question, not
    a Round 1 topic already covering it.
  - *Optional per-page exclusion* — observed: not asked; the agent stated exclusion "stays off by
    default unless you say otherwise." Does not match — a silent default, not a confirmed answer.
  - *Explain build/preview vs. `astro dev`* — not reached; the run was stopped after Round 2's
    questions, before this explanation would occur.
  - *No CMS, backend, GitHub Actions, or environment variables* — observed: none introduced.
    Matches.
  - *No writes before authorization* — observed: read-only tools only (`Read`, `Glob`, `Bash`
    limited to `git status --porcelain` / `git log`); clone working tree reported clean after
    both turns. Matches.
- **Observed vs. expected, per bullet of "Expected result after authorizing a test
  implementation"** — the human stopped the run after Round 2's questions, before authorizing a
  test implementation, specifically to fix the skill contract, so every bullet below is recorded
  individually as not reached:
  - *Pagefind is a devDependency, not a runtime dependency* — Not reached — run stopped by the
    human before Round 2 answers.
  - *`bun run build` runs Astro and Pagefind exactly once* — Not reached — run stopped by the
    human before Round 2 answers.
  - *the UI uses the Component UI, not legacy `PagefindUI` or React* — Not reached — run stopped
    by the human before Round 2 answers.
  - *`dist/pagefind/` is not committed and not copied to `public/`* — Not reached — run stopped by
    the human before Round 2 answers.
  - *EN and ES results are not mixed* — Not reached — run stopped by the human before Round 2
    answers.
  - *a non-root `base` works* — Not reached — run stopped by the human before Round 2 answers.
  - *a real query demonstrates the expected URL set bidirectionally, the agreed exclusions, and
    the agreed metadata/filters* — Not reached — run stopped by the human before Round 2 answers.
  - *browser tests demonstrate keyboard navigation, focus, zero-results announcement, and the
    no-JavaScript fallback* — Not reached — run stopped by the human before Round 2 answers.
  - *`bun run test`, `bun run check`, `bun run build`, and `git diff --check` are all green* — Not
    reached — run stopped by the human before Round 2 answers.
- **Result: FAIL** — skill defect, not an agent failure. The agent under test correctly followed
  the `static-site-search` §1 contract as it existed at run time; that contract was itself
  incomplete (locales assumed instead of asked, exclusion silently defaulted off, no stated
  recommendation per question, and a title+URL result minimum that undersold the search API's
  actual return shape). Run 1 is evidence of the *previous* skill version's behavior only — it
  must not be reinterpreted as evidence for or against the revised seven-question contract now in
  `skills/static-site-search/SKILL.md`. A new run against that revised contract is required (see
  "Run 2 acceptance").

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
| Disposable copy prepared from a PF-A-complete state (run 1) | Implemented | Clone of `6649ab9` with `docs/product/pagefind-roadmap-*.md` removed, clone commit `24c6364`, `bun install` run, no remote — "Run records → Run 1" above | — |
| Disposable copy prepared from a PF-A-complete state (run 2, revised skill) | Not built | — | Requires a fresh clone seeded after the seven-question `static-site-search` §1 revision landed. |
| Simulation run with the verbatim test prompt (run 1) | Implemented | Turns 1–2 executed against the verbatim prompt, clone working tree clean afterwards — "Run records → Run 1" above | — |
| Full transcript preserved per "Record format for the run" (run 1) | Not built | `docs/product/pf-b-runs/run-1-transcript.md` is an extract only (tool calls and assistant text; system prompt and tool results omitted; clone paths redacted) | The full raw stream-json transcript was kept only in a local session scratchpad and was not preserved in this repository. |
| Simulation run with the verbatim test prompt (run 2) | Not built | — | A recorded run following "Record format for the run" against the revised skill; see "Run 2 acceptance". |
| Pre-write behavior observed and scored (run 1) | Implemented | Per-bullet record in "Run records → Run 1" above | — |
| Pre-write behavior observed and scored (run 2) | Not built | — | Per-bullet observed-vs-expected record against the revised seven-question contract. |
| Post-authorization result observed and scored | Not built | — | Run 1 was stopped before authorization (see "Run records → Run 1"); requires a run that reaches "Expected result after authorizing a test implementation". |
| Failure conditions checked, pre-write portion (starts installing before asking) | Implemented | Run 1: no install occurred; the run was stopped at Round 2's questions, before any write | — |
| Failure conditions checked, post-authorization portion (dual ambiguous search, `postbuild` added, success declared without querying the index) | Not built | — | Not reachable in run 1, which never authorized implementation; requires a completed run. |
| Run marked PASS or FAIL (run 1) | Implemented | Run 1: FAIL — skill defect (contract questions incomplete: locales assumed, exclusion silent, no recommendations, title+URL minimum), not an agent failure — "Run records → Run 1" above | Scoped to the previous skill version only; not evidence for or against the revised contract. |
| Run marked PASS or FAIL (run 2) | Not built | — | Requires a completed run 2 against the revised skill; see "Run 2 acceptance". |
| Codex adversarial review of the run | Not built | — | Recorded verdict (`PASS` / `PASS_WITH_FINDINGS` / `NEEDS_ATTENTION`) with file/line and repro per finding, if the disposable implementation's patterns are proposed for reuse. |
| Global roadmap guard review | Not built | — | Recorded verdict confirming no phase B/C contract, gate, or route-map invariant is broken. |
