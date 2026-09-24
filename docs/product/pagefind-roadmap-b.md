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

## Run 3 acceptance

Run 3 uses the revised `static-site-search` skill (the PF-B skill fixes). It is scored against
everything in "Run 2 acceptance", plus:

- the contract summary is presented and an explicit human go-ahead is given before the first
  write, and the first write is the confirmed contract in `DESIGN.md`;
- all seven §1 questions are asked individually, each as its own prompt with its own
  recommendation — no question marked answered by inference;
- no unilateral deviation from the skill: a Component UI misfit is raised to the human, not
  decided by the agent;
- the coverage gate exists, derives its expected set from published posts and canonical routes
  (never from Pagefind markers or output), and fails naming the URL under the
  `data-pagefind-body` mutation;
- root `/` is verified; the `/preview` subpath matrix is NOT_SUPPORTED by the template
  (`implementation-roadmap.md` phase F, "Template subpath deployment contract") and outside run
  3's acceptance — it must be recorded as NOT_SUPPORTED, never as PASS;
- the Playwright/Chromium browser scenarios pass at root `/` (the minimum list in
  `static-site-search` §5);
- the temporary browser probe is absent from the final candidate diff;
- `bun run test`, `bun run check`, `bun run build` (seo-lint clean) and `git diff --check` are
  green.

## Record format for the run

Record each simulation run as an auditable extract, committed under this document or a linked
artifact named here (never left only in a chat transcript). The committed record must contain:

- the exact initial prompt given to the agent;
- the seven contract questions as asked, in order;
- the human's answers to each;
- the contract summary presented back to the human;
- the explicit authorization, quoted;
- the moment of the first write (what it was, and what preceded it);
- decisions and deviations from the skill;
- the relevant commands and their observed results;
- the commits created;
- the observed vs. expected result against each acceptance criterion;
- the size and SHA-256 of each original stream-json transcript, kept outside Git during the audit.

**Why an extract, not the raw stream.** The raw stream-json transcript exceeds 500 KB per run, may
include internal instructions the audit should not republish, and buries the evidence in tool-call
noise. The full stream stays outside Git; its size and hash anchor the committed extract to it.

Also record, as before: **Commit tested** — the PF-A commit/diff state used to build the disposable
copy; **Agent / runtime** — which agent and runtime executed the simulation; and **Result** — PASS
or FAIL, with the specific failure condition triggered if FAIL.

## Run records

### Run 1

- **Commit tested** — `6649ab9`; clone commit `24c6364` (removes
  `docs/product/pagefind-roadmap-*.md` from the clone).
- **Agent / runtime** — Claude Code 2.1.281, headless (`claude -p`), `claude-sonnet-5`,
  `--permission-mode bypassPermissions`, `--strict-mcp-config` (no MCP servers),
  `--setting-sources project` (project settings only), hooks disabled.
- **Transcript extract and fingerprints** — `docs/product/pf-b-runs/run-1-transcript.md` is the
  committed auditable extract (tool calls and assistant text only; the system prompt and tool
  results are omitted; clone paths are redacted as `<clone>`). The original raw stream-json
  transcripts are kept outside Git during the audit, fingerprinted here:
  - turn 1 (`phase1`) — 163533 bytes, SHA-256
    `8928bd9013e41ad812f077e105edfda2eeab7172127cc3efa33421c8d263229a`;
  - turn 2 (`phase2`) — 15062 bytes, SHA-256
    `d79860079cf5cbe3803d85cee975a3393573491b502ac12c3f6ae6507b4c38ff`.
  Under the revised "Record format for the run", this record still does not meet the format: run 1
  was stopped before a contract summary was presented or any authorization given, so those required
  items cannot exist. Recorded as a gap in the status table below, not as compliance.
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

### Run 2

- **Commit tested** — `9ca0617` (the revised seven-question `static-site-search` §1 contract);
  clone commit `32bc207` (removes `docs/product/pagefind-roadmap-*.md` and
  `docs/product/pf-b-runs/run-1-transcript.md` from the clone, `bun install` run beforehand, no
  remote). Agent commits on top, in the clone's `pfb-sim` branch: `82eadfe` (Pagefind build
  pipeline) and `58fe708` (indexing markup + UI + tests).
- **Agent / runtime** — same as run 1: Claude Code 2.1.281, headless (`claude -p --model sonnet`,
  `claude-sonnet-5`), `--permission-mode bypassPermissions`, `--strict-mcp-config` (no MCP
  servers), `--setting-sources project`, hooks disabled. Session `2692d2f9-4db5-4fd5-894b-eb2aac4809fa`.
- **Transcript extract and fingerprints** — `docs/product/pf-b-runs/run-2-transcript.md` is the
  committed auditable extract (top-level tool calls and assistant text only; the system prompt,
  tool results and subagent internals are omitted; clone paths are redacted as `<clone>`). The
  original raw stream-json transcripts are kept outside Git during the audit, fingerprinted here:
  - turn 1 — 152782 bytes, SHA-256
    `037fe56abbcbfa4b1f966cdf3b63a05bb3a256f1d26007ed94079fcad5ea6c03`;
  - turn 2 — 6699 bytes, SHA-256
    `d6f5de60086254484f120c86452da8a2c81d8373eefaf85333046fe8a2b5c24e`;
  - turn 3 — 7782 bytes, SHA-256
    `3e4ebce919485508b1e783dc83de6a0b3db5badf58d3087679769529d63fc6b6`;
  - turn 4 — 6753 bytes, SHA-256
    `84ad2dc6f5136ed570ba13c4f9d5971d4fe2e9ddd2a7010127f600f313a36611`;
  - turn 5 — 10275 bytes, SHA-256
    `6b7ddce47c7c03c07505c81448127386ce4c085c19ae529f5874bc563660f4ea`;
  - turn 6 — 6851 bytes, SHA-256
    `6927e6df4e929d55e2e3b30cda1f4200970f0b5370ef8c3fab55355b54efe4b6`;
  - turn 7 — 649825 bytes, SHA-256
    `f337f10337819bcc22042b418316e36390b00ca6ba74580dee919d17764e6d0a`;
  - turn 8 — 696649 bytes, SHA-256
    `67e27207e6c77469bfe051ec44d7bee28f25c5a4e86b2ce9be631380330c7f7a`.
  Under the revised "Record format for the run", this record still does not meet the format: run 2
  never received an explicit authorization, so that required item cannot exist. Recorded as a gap in
  the status table below, not as compliance.
- **Harness note (Turn 8)** — the background subagent the orchestrator delegated for T2 (marking
  blog post pages) was terminated mid-task when its host session ended; it left an uncommitted
  but complete diff. A harness-level notification told the orchestrator session this had happened
  and instructed it to finish T2–T4 and verification in the foreground rather than relying on
  background work — which is what the rest of Turn 7's continuation did. This is a runtime/harness
  characteristic (background agents do not outlive a terminated host session), not an agent
  decision; recorded here because it shaped how T2–T5 were executed (inspected and kept, then
  continued in-session) and because "no background work survives this session" is itself a fact
  worth preserving for anyone re-running PF-B.

**Observed vs. expected, per bullet of "Expected behavior before writing" (revised skill
version, in force at run time):**

- *Load `site-build` then `static-site-search`, not all eight skills* — observed: only
  `skills/static-site-search/SKILL.md` was read directly (`Bash`: list skill contents; `Read`:
  the file itself). `skills/site-build/SKILL.md` was never opened, and — unlike run 1 —
  `skills/site-build/references/adoption-wizard.md` was **not** opened either. Does not match,
  and on the adoption-wizard point it regresses run 1. Additionally, in the same turn the agent
  launched a background `Agent` ("Map search-relevant repo context") to gather repo context
  (locale set, `BlogArchive.astro`'s existing filter, absence of `pagefind`) **before** the
  contract's first question was answered — a read-only delegation, but `CLAUDE.md` rule 0 is
  explicit that "no delegation to any subagent — a shell is a write tool, so no subagent is
  read-only by construction — until the human confirms the adoption contract." This is a real,
  observed rule violation, not a formatting nitpick: the assistant's own message ("Mientras reúno
  contexto del repo en segundo plano, empiezo con la primera pregunta...") shows it happening
  concurrently with, not after, the first question. **This exact defect is what skill commit
  `25136c8` ("fix(skills): route search activation through the adoption gate without delegation")
  fixes** — its commit message names this PF-B run 2 finding directly: "PF-B run 2 showed an
  agent skipping the adoption wizard and delegating read-only reconnaissance before the contract
  was confirmed, which `CLAUDE.md` rule 0 forbids." The fix is committed after the commit this run
  tested (`9ca0617`), so it postdates and does not change this run's observed result.
- *Detect the existing card filter* — observed: correctly detected and reported
  (`BlogArchive.astro` with a local filter, bilingual `en`/`es`, no `pagefind` installed),
  surfaced via the same pre-confirmation background `Agent` call above. Matches on content; the
  channel it came through is the defect just recorded.
- *Ask all seven `static-site-search` §1 questions, each with a stated recommendation and its
  reason* — observed: **six** of the seven questions were asked as standalone prompts, each with
  the agent's own "Mi recomendación: …" and a reason grounded in repo evidence (Q1 scope — Turn 1;
  Q2 locales — Turn 2; Q3 UI — Turn 3; Q4 existing filter — Turn 4; Q5 results — Turn 5; Q6
  exclusions — Turn 6). Question 7 (no-JavaScript fallback) was never asked as its own prompt: in
  Turn 5 the human's answer to Q4 volunteered, unprompted, "El listado HTML completo de
  BlogArchive.astro como estado inicial y fallback sin JavaScript," and the assistant's reply
  states "Eso también responde la pregunta 7 (fallback sin JS = listado completo de BlogArchive,
  ya confirmado)" instead of asking Q7 with its own recommendation. The skill's only stated
  exception to "ask these seven questions explicitly" is a `DESIGN.md` reaffirmed for the session,
  which does not apply here. This is a narrower defect than run 1's locale assumption (there the
  model assumed with zero human input; here the human did explicitly state the answer, just
  attached to a different question), but it is still not "asked... with a stated recommendation
  and its reason" for Q7, and the agent's own "Contrato confirmado (7/7)" claim in Turn 7 counts a
  question that was never separately posed. Partial match: 6/7 questions individually asked and
  recommended; Q7 inferred and merely acknowledged.
- *Never present technically equivalent alternatives without guidance, never assume the locale
  answer, never silently default an exclusion on or off* — observed: Q2 (locales) and Q6
  (exclusions) were both asked explicitly, each with the agent's own recommendation and reasoning,
  and the human's explicit confirmation was obtained for both before any write. Matches — this is
  the specific defect run 1 exposed in the previous skill version, and it does not recur here.
- *Explain that real search is tested with build/preview, not with `astro dev`* — observed: not
  found anywhere in the transcript (searched for "preview" and "astro dev"; zero matches). The
  agent never states this to the human before writing. Does not match. This text already exists
  in the skill at the tested commit (`9ca0617`, §2: "`astro dev` has no finished index. Use
  `bun run search:preview` for real search testing…"), so this is an agent execution gap, not a
  missing skill instruction — none of the five post-run-2 skill commits touch this text either, so
  the gap remains open in the skill's current form as well (nothing forces the agent to surface it
  to the human specifically).
- *Introduce no CMS, backend, GitHub Actions, or environment variables* — observed: none
  introduced. Matches.
- *No writes before authorization* — observed: the first write,
  `odd/tasks/blog-pagefind-search.md`, happens in Turn 7 right after the agent itself declared
  "Contrato confirmado (7/7)"; no explicit authorization was ever given (see the classification
  below), and the Turn 1 delegation is also barred by `CLAUDE.md` rule 0. Does not match.
- **Additional observation, not a named bullet above but explicitly asked for in this
  verification's brief:** no contract summary was presented back to the human before
  implementation began, and no explicit go-ahead ("¿procedo?" / "authorized to implement?") was
  requested. Turn 7's assistant message reads "Contrato confirmado (7/7). Creé
  `odd/tasks/blog-pagefind-search.md` con el plan. Empiezo T1," moving directly from the seventh
  answer into task-file creation, a dependency install, and a commit, with no consolidated
  restatement of the seven confirmed answers and no pause for a final "go" signal distinct from
  answering the individual questions.

**Classification: this is a full `CLAUDE.md` rule 0 / adoption-contract violation, not a missing
summary.** `skills/site-build/references/adoption-wizard.md` requires a contract displayed in
chat with explicit confirmation before any write (§2 `CONTRACT_REVIEW`, ~33-46), forbids moving
to `IMPLEMENTATION` on an inferred approval (~44-46), and requires the confirmed contract's first
file write to be the `## Adoption contract` section in `DESIGN.md` (§9, ~287-295) — never a task
file. `CLAUDE.md` rule 0 (~22-28) forbids delegating to any subagent, including read-only
reconnaissance, before that confirmation. Run 2 breached all four at once: it never opened the
wizard, launched a background `Agent` for repo reconnaissance in Turn 1 before the first question
was even answered (`run-2-transcript.md` ~26-36), never displayed a contract summary or asked
for an explicit go-ahead, and its first file write was `odd/tasks/blog-pagefind-search.md`
(`run-2-transcript.md` ~183-201), not `DESIGN.md`. Skill commit `25136c8` fixes the
wizard-skip-and-pre-confirmation-delegation half of this violation; the contract-summary,
explicit-go-ahead, and `DESIGN.md`-first requirements are still not stated anywhere in
`skills/static-site-search/SKILL.md` (see "Still unaddressed" under "Findings for the skill"
below).

**Observed vs. expected, per bullet of "Expected result after authorizing a test
implementation"** — verified independently in the disposable clone at `58fe708`, not merely
read off the agent's self-report:

- *Pagefind is a devDependency, not a runtime dependency* — confirmed: `package.json`
  `devDependencies.pagefind: "^1.5.2"`; not listed under `dependencies`. Matches.
- *`bun run build` runs Astro and Pagefind exactly once* — confirmed: `package.json`'s `build`
  script is `"bun run build:astro && bun run search:index"` (`build:astro` → `astro build`;
  `search:index` → `pagefind --site dist`), no `postbuild` script, and no Astro integration or
  config hook references `pagefind` (checked `astro.config.mjs` and every `src/**/*.{ts,mjs,js}`
  file). A live rebuild (`bun run build`, this verification's own run) shows exactly one "Running
  Pagefind v1.5.2" invocation, occurring after `[build] Complete!`. Matches.
- *The UI uses the Component UI, not legacy `PagefindUI` or React* — does not match. The
  implementation in `src/components/blog/BlogArchive.astro` dynamically imports raw
  `pagefind.js` (line 277: `` import(/* @vite-ignore */ `${bundlePath}pagefind.js`) ``) and drives
  it with `pagefind.init()` / `pagefind.search(term, { filters })` (line 339) inside a hand-rolled
  `<script>` block with custom result rendering — not `<pagefind-config>`/`<pagefind-searchbox>`
  Component UI web components as `skills/static-site-search/SKILL.md` §2/§4 direct, and also not
  legacy `PagefindUI` or React (so it isn't the failure mode the bullet names by name, but it is
  the deviation the bullet exists to prevent). The agent self-disclosed this as a deliberate
  choice made **without asking the human**, both in its final chat summary ("Usé la API JS cruda
  de Pagefind en vez del Component UI que sugiere la skill… porque las pestañas de categoría
  existentes y el diseño de tarjeta personalizado eran difíciles de lograr contra el renderizado
  interno del Component UI") and in `odd/tasks/blog-pagefind-search.md`'s "Deviation from the
  skill doc — disclosed" section. The reasoning given is plausible (existing category tabs and a
  bespoke card layout are hard to reconcile with the Component UI's shadow-DOM result rendering),
  but it is still an unrequested technical substitution the confirmed contract never covered — the
  human agreed to "reemplazar el filtro textual local por Pagefind" and to specific result fields,
  not to a specific client-side integration mechanism.
- *`dist/pagefind/` is not committed and not copied to `public/`* — confirmed: `dist/` is listed
  in `.gitignore` (`.gitignore:5`); `git ls-files | grep -i "^dist"` returns nothing; `public/`
  contains no `pagefind` files; the only tracked file whose path contains "pagefind" is
  `odd/tasks/blog-pagefind-search.md` itself. Matches.
- *EN and ES results are not mixed* — confirmed at the index-data level, not confirmed in a real
  browser. `bun run build` reports "Discovered 2 languages: en, es" / "Indexed 2 pages"; the two
  post-detail pages carry the correct, distinct `<html lang="en">` / `<html lang="es">`; and
  `dist/pagefind/` contains fully separate per-language artifacts
  (`index/en_*.pf_index`/`index/es_*.pf_index`, `fragment/en_*.pf_fragment`/`fragment/es_*.pf_fragment`,
  `filter/en_*.pf_filter`/`filter/es_*.pf_filter`, `wasm.en.pagefind`/`wasm.es.pagefind`).
  Decompressing the two fragment files directly (`zlib.gunzipSync`, bypassing the search API
  entirely) shows `en_1c37e05.pf_fragment` → `{"url":"/blog/example-post/", "content":"…Example
  Blog Post…"}` and `es_3a3c6f2.pf_fragment` → `{"url":"/es/blog/example-post/",
  "content":"…Entrada de blog de ejemplo…"}` — the underlying per-language content is genuinely
  separate. Runtime language selection reads `document.querySelector("html")?.getAttribute("lang")`
  (`dist/pagefind/pagefind-worker.js`), matching the skill's stated mechanism and this template's
  existing `<html lang>` emission, unchanged by this feature. What could **not** be proven, by
  either the agent or this verification, is the actual in-browser behavior: Pagefind's JS API has
  no documented `language`/`forceLanguage` search option to force a specific language index from
  a script (confirmed independently by inspecting `pagefind.js`'s `search()` signature — it reads
  `this.loadedLanguage`, set only from `document.querySelector("html")`'s `lang` attribute at
  `init()` time — and this matches the agent's own disclosed finding: "confirmed empirically that
  neither `forceLanguage` nor `language` are accepted runtime options on pagefind@1.5.2's browser
  module"). A Node harness with no DOM cannot exercise this path, so "`/es/blog/` returns no
  English posts" was checked only by proxy (separate index files, correct `<html lang>` per page,
  worker source reading that attribute), never by loading the actual page. Recorded as
  index-level-confirmed, browser-level-unconfirmed — the same status the agent itself recorded.
- *A non-root `base` works* — not met. `astro.config.mjs` sets no `base` (root deployment only),
  and no test — by the agent or by this verification — configures a non-root `base` and rebuilds
  against it. Neither `odd/tasks/blog-pagefind-search.md` nor the transcript mentions base-path
  testing at all; it is absent even from the agent's own "Disclosed gap" section, unlike the
  browser-test gap it did disclose. Recorded as untested, not merely unconfirmed.
- *A real query demonstrates the expected URL set bidirectionally, the agreed exclusions, and the
  agreed metadata/filters* — partially matches. Independently reproduced and confirmed in this
  verification: `bun run test` 522/522 (`src/lib/blog/search-result-format.test.ts`'s 16 cases,
  covering null-safe date/category/keyword formatting exactly as described); category filtering is
  exact-match, not substring (`mod.search(null, {filters:{category:"General"}})` → 1 hit;
  `"Genera"` → 0; `"general"` → 0); excerpt highlighting survives into the rendered HTML (a search
  for `"Lorem"` returns an excerpt containing literal `<mark>Lorem</mark>`); `keywords` is
  searchable metadata and not a visible filter (`data-pagefind-filter` appears only on `category`
  in both `[slug].astro` files: EN line 82, ES line 87; keywords render as
  `data-pagefind-meta="keywords"` only, EN line 91 / ES line 96); the draft-exclusion contract
  (`draft: true` → no route, no indexed word; published → both present; fixture then fully
  removed) is corroborated by the clean `git status`/`git diff` at `58fe708`, with no residual
  fixture file. What the agreed contract in skill §5 also requires — deriving the expected URL set
  independently of Pagefind's own output and comparing it bidirectionally, plus the mutation
  "remove `data-pagefind-body` from an expected page… must fail for the intended reason" — was
  **not** performed by the agent (absent from `odd/tasks/blog-pagefind-search.md`'s T5 write-up,
  which lists only the draft fixture, the category filter, the keyword search and the excerpt
  highlight). This verification performed that specific mutation independently: removed
  `data-pagefind-body` from `src/pages/blog/[slug].astro`'s `<article>` (line 78), ran
  `bun run test` (522/522, unaffected — no test exercises this), then `bun run build` (exit 0,
  `[seo-lint] seo-lint: clean (10 pages checked)`, and Pagefind's own output silently changed from
  "Discovered 2 languages… Indexed 2 pages" to "Discovered 1 language: es… Indexed 1 page," with
  **no error, no failed gate, and no URL named anywhere in the build output**). The mutation was
  then reverted and a rebuild confirmed the original 2-language/2-page state, with `git status`
  and `git diff --check` clean afterward in the clone. This is a concrete, reproduced finding:
  there is no automated coverage gate in this project that fails, or names a URL, when
  `data-pagefind-body` is silently dropped from an expected page — only a human reading Pagefind's
  page/language counts in build output would notice anything changed, and nothing identifies which
  page. Does not match the "fails for the intended reason, naming that post's URL" bar the skill
  and the Run 2 acceptance list both set.
- *Browser tests demonstrate keyboard navigation, focus, zero-results announcement, and the
  no-JavaScript fallback* — not met. The agent disclosed this directly ("No hay
  Playwright/Puppeteer en este repo — no pude verificar en navegador real…"). This verification
  has no browser-automation tool available either, so it could not independently supply what the
  agent could not. Recorded as Not met, consistent with the agent's own disclosure, not as a new
  finding.
- *`bun run test`, `bun run check`, `bun run build`, and `git diff --check` are all green* —
  confirmed independently at `58fe708`: `bun run test` → 25 files / 522 tests passed; `bun run
  check` → "0 errors" (pre-existing, unrelated `z.string()`-deprecation hints only, matching the
  agent's own "0 errores" claim); `bun run build` → exit 0, `seo-lint: clean (10 pages checked)`,
  single Pagefind invocation; `git diff --check` → clean; `git status --short` → clean working
  tree. Matches.

**Contract fidelity vs. the human's answers (Turns 2–7)** — verified directly against the code at
`58fe708`:

- One search field, one result source, local text filter removed — confirmed: a single
  `#blog-search` input in `BlogArchive.astro`; the prior `data-search` substring-match blob and
  its script are gone; every result comes from `pagefind.search()`.
- Empty query shows all posts — confirmed: `apply()`'s `if (query === "" && activeCategory ===
  "")` branch calls `showGrid()`, restoring the static card grid.
- HTML listing as initial state and no-JS fallback — confirmed: the card grid renders
  server-side and is visible by default; only the (initially empty) `#blog-results` list carries
  `style="display:none"` up front; no `<noscript>` element was added, consistent with the human's
  and the skill's "already the fallback, no new fallback needed" instruction.
- Date localized per locale — confirmed: both `BlogArchive.astro`'s `dateFormatter` and
  `search-result-format.ts`'s `formatResultDate` use `Intl.DateTimeFormat` keyed on `en-US`/
  `es-MX`; tests assert `"September 24, 2026"` vs. `"24 de septiembre de 2026"` for the same ISO
  instant.
- Missing date/category renders without breaking — confirmed: `formatResultDate` and
  `formatResultCategory` return `null` rather than throwing on missing/invalid input (tested
  explicitly, including an "unparsable string, never 'Invalid Date'" case), and the result
  template only appends a metadata line when at least one of date/category is present.
- Draft fixture proof, then fully removed — confirmed by the task-doc narrative (create
  `draft: true` fixture → route absent, unique word absent from `dist/` → flip to published,
  rebuild → route and word present → remove fixture, rebuild) and by the clean `git status`/
  `git diff` at `58fe708` showing no residual fixture file.

**Failure conditions (roadmap-b) — checked directly: one triggered, three not triggered in their
literal form (one of those three with a caveat):**

- *Starts installing before asking the contract questions* — **triggered**: `bun add --dev
  pagefind` (Turn 7, `run-2-transcript.md` ~198) runs only after the agent announces "Contrato
  confirmado (7/7)," but question 7 (no-JS fallback) was never asked as its own question — it was
  inferred from the human's Q4 answer (`run-2-transcript.md` ~116-118) and only acknowledged, not
  asked. Installation therefore starts before all seven contract questions are actually asked,
  regardless of the agent's own "7/7" claim.
- *Ends up with two ambiguous search implementations* — not triggered: the local filter was fully
  removed, not left coexisting.
- *Adds `postbuild` in addition to a chained `build`* — not triggered: a single chained
  `build:astro && search:index` script, no `postbuild` key in `package.json`.
- *Declares success without querying the generated index* — not triggered in its literal form
  (the agent did query the live index for the keyword-metadata, category-filter and excerpt-
  highlight behaviors, and this verification reproduced those queries independently), but the
  final "Verificado" summary does not disclose that the two index queries skill §5 and the Run 2
  acceptance list specifically require — the bidirectional expected-URL-set comparison and the
  `data-pagefind-body`-removal mutation — were never run. This is a narrower, real gap adjacent to
  the named failure condition rather than the condition itself.

**Result: FAIL** — against "Run 2 acceptance," scored criterion by criterion:

1. Clean disposable copy; the same verbatim test prompt as run 1 (unmodified) — **Met.**
2. All seven §1 questions asked before any write, each with a stated recommendation and reason —
   **Not fully met.** Six of seven were asked as standalone, recommendation-bearing prompts;
   question 7 (no-JavaScript fallback) was inferred from the human's own volunteered answer to
   question 4 and only acknowledged, never separately asked or independently recommended by the
   agent.
3. No locale assumption and no silent exclusion default — **Met.** This is the specific defect
   run 1 exposed in the previous skill version, and it does not recur.
4. After the human answers, the agent implements exactly the agreed contract — no unrequested
   scope, UI, or metadata — **Not met.** The Component UI vs. raw JS API substitution is an
   unrequested technical deviation the confirmed contract never covered, made and disclosed only
   after the fact, not asked about beforehand.
5. Each intentional mutation (skill §5) fails for the intended reason — **Not met.** Only the
   draft-exclusion mutation was performed (and it does behave correctly). The other §5-listed
   mutations — remove `data-pagefind-body` from an expected page, break one emitted `html lang`,
   break the bundle/base path, add a second Pagefind owner — were not performed by the agent. This
   verification performed the `data-pagefind-body` removal independently and found it does **not**
   fail for the intended reason: `bun run build` stays green (exit 0, seo-lint clean) and silently
   drops the affected language/page from the index with no error and no named URL.
6. `bun run build`, `bun run test`, and a real-browser verification pass are all green — **Not
   met.** Build and test are independently confirmed green; no real-browser verification pass
   exists (disclosed by the agent, unavailable to this verification too).

Three of six Run 2 acceptance criteria are unmet (criteria 2 is partially unmet, 4 and 5 are
unmet, 6 is unmet); one (3) resolves the exact defect run 1 exposed. **Overall: FAIL.** This is a
mix of skill-contract defects already fixed downstream (the pre-confirmation delegation and
missing-adoption-wizard read, addressed by `25136c8`) and defects the current skill text still
does not address (see "Findings for the skill" below).

**Findings for the skill (not verdict inputs)** — read against
`git log -p 9ca0617..1075459 -- skills/static-site-search/SKILL.md` (`25136c8`, `1afcbf4`,
`33942ec`, `7caf676`, `1075459`, all committed after the commit this run tested):

- **Already addressed downstream.** `25136c8` ("route search activation through the adoption gate
  without delegation") adds, directly to the skill's activation-gate paragraph, "Adding search to
  a site built on this template is an adoption request under `CLAUDE.md` rule 0: open
  `skills/site-build/references/adoption-wizard.md` first, and delegate to no subagent — not even
  read-only reconnaissance — until the contract is confirmed." Its commit message names this exact
  PF-B run 2 finding. `33942ec` and `7caf676` also tighten §1 Q5's keyword-as-metadata (not
  filter) guidance and add explicit result-template scenarios (missing category, long title,
  highlighted excerpt, localized date) that match what this run's implementation already got
  right by following the human's explicit instructions rather than the (at-the-time weaker) skill
  default. `1075459` codifies the draft/`data-pagefind-body`/`noindex` three-contracts-separate
  rule the human stated verbatim in Turn 7, matching what the agent implemented.
- **Addressed by this revision (PF-B skill fixes)** — new instructions added to
  `skills/static-site-search/SKILL.md`, without changing run 1's or run 2's recorded verdicts:
  - **Contract summary, explicit go-ahead, `DESIGN.md` first (§1).** After the seven answers and
    before any write, install or delegation, present a summary of all seven answers and wait for
    explicit human confirmation; an agent's own "contract confirmed" is not authorization, and the
    first file write is the confirmed contract in `DESIGN.md` (adoption wizard §2/§9).
  - **Every question asked individually (§1).** Ask each of the seven as its own prompt with its own
    recommendation; when an earlier answer seems to settle one, restate it and ask for
    confirmation; never mark a question answered by inference.
  - **Build/preview vs. `astro dev` (§1).** Before implementing, the agent must state to the human
    that Pagefind is verified through `bun run build` / `bun run search:preview`, not `astro dev`
    (which has no finished index) — closing the gap this record previously listed as unaddressed.
  - **Component UI stop (§2).** The Component UI stays the default; if it cannot fit the existing
    UI, stop and ask the human, naming the options — adapt the design, customize the templates
    keeping their ARIA contract, or use the raw JS API only with explicit approval and
    agent-owned, browser-proven accessibility.
  - **Scope-specific coverage gate (§5).** A test or build gate must derive the expected URL set
    from the confirmed scope — published posts times emitted locales for blog scope, emitted HTML
    routes minus an exclusion manifest for whole-site scope, or an explicit independent route
    manifest for selected routes — never from `data-pagefind-body`, `dist/pagefind/` or the index,
    compare bidirectionally, and fail naming each missing or unexpected URL under the
    `data-pagefind-body` mutation.
  - **Real-browser fallback and focus scenarios (§5).** Browser behavior is proven with Playwright
    + Chromium, or a temporary probe that never enters the candidate diff when the repo has no
    browser tooling; the minimum browser scenarios now explicitly include visible focus while
    navigating results, a focus trap while the modal is open (if a modal was chosen), and focus
    returned to the trigger or search field on close, alongside the existing zero-results
    announcement.

- **Base-path matrix — verified as a pre-existing template failure, not a skill gap.** The
  orchestrator reproduced this on 2026-09-24 in a disposable clone of the template (PF-B run 2
  state, only `astro.config.mjs` changed, then restored): `base: '/preview'` makes `bun run build`
  exit 1 under both `trailingSlash: 'never'` and `'always'`. `seo-lint` reports `OG_IMAGE_404`
  (e.g. `og:image` `https://example.com/og/preview/blog.png`, and
  `https://example.com/preview/_astro/example-post.<hash>.png` missing in `dist/`, both modes);
  `INTERNAL_LINK_NOT_CANONICAL_FORM` under `'never'` (e.g. internal links to `/es/preview/blog`,
  `/preview/blog`, `/preview/404`, `/es/preview/404` — locale prefix and base joined in the wrong
  order, wrong slash form); `LOCALIZED_ROUTE_WITHOUT_ALTERNATES` under `'always'` for `/`, `/es/`,
  `/blog/`, `/es/blog/` (no hreflang en/es/x-default at all). The cause is the template, not
  Pagefind — no Pagefind involvement is needed to reproduce it. This is tracked as
  `implementation-roadmap.md` phase F, "Template subpath deployment contract" (Not built); the
  skill (§5) now states root-only support and marks the `/preview` matrix NOT_SUPPORTED until that
  deliverable is Implemented, rather than treating this as a skill defect fixed here.

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
| Disposable copy prepared from a PF-A-complete state (run 2, revised skill) | Implemented | Clone of `9ca0617` with `docs/product/pagefind-roadmap-*.md` and `docs/product/pf-b-runs/run-1-transcript.md` removed, clone commit `32bc207`, `bun install` run, no remote — "Run records → Run 2" above | — |
| Simulation run with the verbatim test prompt (run 1) | Implemented | Turns 1–2 executed against the verbatim prompt, clone working tree clean afterwards — "Run records → Run 1" above | — |
| Auditable extract recorded per "Record format for the run" (run 1) | Not built | `docs/product/pf-b-runs/run-1-transcript.md` is the committed extract; the original raw stream-json transcripts are fingerprinted in "Run records → Run 1" (turn 1: 163533 bytes; turn 2: 15062 bytes) | Run 1 was stopped before a contract summary or any authorization, so the record cannot contain those required items; the revised format is not met. |
| Simulation run with the verbatim test prompt (run 2) | Implemented | Turns 1–8 (session `2692d2f9-4db5-4fd5-894b-eb2aac4809fa`) executed against the verbatim prompt through to a completed, committed implementation (`82eadfe`, `58fe708`) — "Run records → Run 2" above | — |
| Auditable extract recorded per "Record format for the run" (run 2) | Not built | `docs/product/pf-b-runs/run-2-transcript.md` is the committed extract; the original raw stream-json transcripts are fingerprinted in "Run records → Run 2" (turns 1–8) | Run 2 never received an explicit authorization, so the record cannot contain that required item; the revised format is not met. |
| Pre-write behavior observed and scored (run 1) | Implemented | Per-bullet record in "Run records → Run 1" above | — |
| Pre-write behavior observed and scored (run 2) | Implemented | Per-bullet record in "Run records → Run 2" above — several bullets scored as not matching (pre-confirmation subagent delegation, adoption wizard unread, question 7 never separately asked, build/preview-vs-`astro dev` never explained) | — |
| Post-authorization result observed and scored (run 1) | Not built | — | Run 1 was stopped before authorization (see "Run records → Run 1"); requires a run that reaches "Expected result after authorizing a test implementation". |
| Post-authorization result observed and scored (run 2) | Implemented | Per-bullet record in "Run records → Run 2" above, each bullet independently re-verified in the clone (not read off the agent's self-report alone) — several bullets scored as not matching or untested (Component UI vs. raw JS API, non-root `base`, bidirectional expected-URL-set comparison, browser tests) | — |
| Failure conditions checked, pre-write portion (starts installing before asking) | Implemented | Run 1: no install occurred, run stopped at Round 2's questions before any write. Run 2: **triggered** — `bun add --dev pagefind` starts only after the agent announces "Contrato confirmado (7/7)" in Turn 7, but question 7 was never asked as its own question (only inferred from the Q4 answer), so installation begins before all seven questions are actually asked — "Run records → Run 2" above | — |
| Failure conditions checked, post-authorization portion (dual ambiguous search, `postbuild` added) | Implemented | Run 2: local filter fully removed (no dual search engines); single chained `build:astro && search:index` script, no `postbuild` key — independently confirmed in `package.json` and `BlogArchive.astro` at `58fe708`, "Run records → Run 2" above | — |
| Failure conditions checked, post-authorization portion (success declared without querying the index) | Implemented | Run 2: the literal condition was not triggered — the agent did query the live index for several behaviors, independently reproduced — but its closing summary omits two index queries skill §5 requires (bidirectional expected-URL-set comparison, `data-pagefind-body`-removal mutation); this verification performed the latter independently and found no automated gate catches it — "Run records → Run 2" above | A repeatable, machine-checked coverage gate for `data-pagefind-body` does not exist in this template; §5's verification remains a manual, one-off step. |
| Run marked PASS or FAIL (run 1) | Implemented | Run 1: FAIL — skill defect (contract questions incomplete: locales assumed, exclusion silent, no recommendations, title+URL minimum), not an agent failure — "Run records → Run 1" above | Scoped to the previous skill version only; not evidence for or against the revised contract. |
| Run marked PASS or FAIL (run 2) | Implemented | Run 2: FAIL against "Run 2 acceptance" — three of six criteria unmet or partially unmet (question 7 not separately asked; Component UI substituted without asking; only the draft mutation performed, and the `data-pagefind-body`-removal mutation this verification ran independently does not fail for the intended reason; no real-browser verification pass) — "Run records → Run 2" above | — |
| Codex adversarial review of the run | Implemented | Runs 1–2 records and the skill revisions reviewed across `6649ab9..796a2cd`: `NEEDS_ATTENTION` rounds fixed in `f6e1ffc`, `0fcc95d`, `9ca0617`, `026b511`, `4059657`, `796a2cd`; final targeted check `PASS`. Applies to the recorded runs; a future PASS run needs its own review | — |
| Global roadmap guard review | Implemented | Every review confirmed `git diff --name-only 6649ab9..796a2cd -- package.json bun.lock astro.config.mjs src` empty, i18n parity 38/38 keys, locale sync and route map intact; orchestrator gates at `85ad52f`: `bun run test` 506/506, `bun run check` 0 errors, `bun run build` with seo-lint clean (10 pages) | — |
| Disposable copy prepared from a PF-A-complete state (run 3, PF-B-fixed skill) | Not built | — | Run 3 has not been executed; requires a disposable copy built from the PF-B skill-fix state. |
| Simulation run with the verbatim test prompt (run 3) | Not built | — | Run 3 has not been executed. |
| Pre-write behavior observed and scored (run 3) | Not built | — | Run 3 has not been executed; must satisfy "Run 3 acceptance". |
| Post-authorization result observed and scored (run 3) | Not built | — | Run 3 has not been executed; must satisfy "Run 3 acceptance". |
| Auditable extract recorded per "Record format for the run" (run 3) | Not built | — | Run 3 has not been executed; the record must meet the revised format, including the contract summary and explicit authorization. |
| Run marked PASS or FAIL (run 3) | Not built | — | Run 3 has not been executed; must satisfy "Run 3 acceptance". |
