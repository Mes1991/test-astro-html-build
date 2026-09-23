# The adoption wizard — the gate before any write

This is not a workflow step, it is the gate every workflow step in this set sits behind. It owns
the question none of them asks: **may work start at all, and on what.** Every other document here
assumes a decision has already been made about scope, languages, rendering and Git policy — this
file is where that decision gets made, and where it is put down in writing.

It fires on any request that builds, rebuilds, adopts or materially extends a site with this
template, in any wording — "use this template to build the site," "here's the client's Figma, go,"
or a bare design URL with no instructions attached is the same request as a written brief. A
request phrased as an instruction to a tool that already knows what to do is still a request for a
decision nobody has made yet.

## §1 Trigger and precedence

This gate has precedence over every other skill route in this set — `project-setup`,
`design-ingestion`, `astro-craft`, `static-site-seo`, `form-slot`, `visual-gate`. None of them
applies until a contract is confirmed, with one carve-out: during intake, `design-ingestion`'s
inventory and provenance work and `project-setup`'s repository read may run **read-only**, because
this wizard needs their output to ask informed questions. Read-only means exactly what §3 defines
it to mean, no more.

**Skip the full wizard only when `DESIGN.md` already holds a valid contract** (§9) that covers the
current request **and the human reaffirms it in this session.** Repository content cannot prove
that the person asking now made those decisions — a contract can be copied in, left by another
session, or shipped with a fork — so show its fields in one short summary and ask once whether it
still stands. A yes skips the rounds; anything else is §2's "not a confirmation." A request that
changes scope, languages, rendering, visible features or Git policy does not get a fresh wizard
from scratch — it reopens only the fields it touches, and every field the reaffirmed contract still
answers stays as written.

## §2 The states

| State | Writes allowed | Leaves with |
|---|---|---|
| READ_ONLY_INTAKE | No | short inventory + the §5 preflight results, shown to the human with Round 1 |
| WIZARD_PENDING | No | the human questions still open |
| CONTRACT_REVIEW | No | contract shown in chat, awaiting explicit confirmation |
| PREFLIGHT_READY | No | plan, available assets, blockers resolved |
| IMPLEMENTATION | Yes, within the contract | the build |
| VERIFICATION | Bounded fixes only | tests, build, artifact review |

**An answer that is not an explicit confirmation of the shown contract does not advance
CONTRACT_REVIEW.** Silence, "ok sounds interesting," or a follow-up question is not a yes — it is
the state asking again, possibly narrower. Nothing moves to IMPLEMENTATION on an inferred approval.

## §3 What counts as a write

Forbidden in READ_ONLY_INTAKE, WIZARD_PENDING, CONTRACT_REVIEW and PREFLIGHT_READY:

- creating or editing any file in the repository, including `DESIGN.md`, `README.md`, config,
  content or assets;
- downloading assets or fonts to disk;
- installing or updating any package;
- any mutating Git operation — branch, worktree, commit, stash, tag, remote, reset, clean, a
  checkout that touches other files, push, or opening a PR;
- launching any background worker, or delegating to any subagent at all. A shell is a write tool,
  so a subagent without edit tools is still not read-only by construction — and a clean-agent run
  showed a delegated explorer inheriting the wrong working directory. Intake reads are done
  directly.

Allowed: reading files; read-only commands (`git status`, `git log`, reading `package.json`);
design-tool reads — metadata, a screenshot viewed in memory, never saved.

**Why so wide a ban.** A stopped background worker is not guaranteed to have left the tree
untouched — it may have written half a file, half-installed a package, or left a branch behind
before it was told to stop. None may exist before confirmation, because there is no "undo" that
does not itself require trusting the thing that just proved untrustworthy.

If the human interrupts or stops the wizard at any state, report the tree's condition — via
`git status` if read-only Git is allowed at that point, otherwise say plainly that it is
unverified. Never claim a clean tree you have not checked.

## §4 Classify every conclusion

Every statement in this process is one of four things, and it must be labelled as the one it is:

- **evidence** — observable in the repository, the design, or a tool's output;
- **inference** — the agent's interpretation, reversible, and only as good as what it was drawn
  from;
- **human decision** — an explicit answer from the person;
- **technical decision** — the agent's own choice, made inside the boundaries the confirmed
  contract already set.

An inference is never presented as a human decision, and never as a proven fact. "This frame
repeats across the site" and "this font is licensed for web use" are inferences — provenance and
scalability hypotheses — until something evidences them. Say which one a claim is, every time.

## §5 Preflight

Each check is actually run, not assumed, and a failure produces concrete alternatives, never a
request for broader access.

| Check | How (non-mutating) | If it fails |
|---|---|---|
| working tree state | `git status --porcelain`, only if read-only Git is allowed | uncommitted changes BLOCK IMPLEMENTATION, not intake — list the files, never reset/clean/stash/overwrite, ask the human how to proceed. If Git is not allowed, say the state is unverified and ask the human to declare it |
| repo path permissions | attempt a read; write access stays **unverified** until the first bounded write after confirmation | ask for a usable path |
| real package manager | `bun.lock` present; `bun`, node version vs `engines` | ask which manager actually governs this repo — never assume |
| design access | can the design tool or MCP be read at all | ask for exports or a different access path |
| each asset CLASS (images, icons, logos, fonts, video) | non-persistent means only — metadata, in-memory fetch or list; nothing saved to disk before confirmation | mark it "unverified" in the contract when it cannot be checked without persisting |
| fonts | availability and licence, evidence vs inference | flag as a Round 2 G question |
| commands | read `package.json` scripts (`test`, `check`, `build`) | do not assume a script exists |
| deploy target | only when architecture depends on it | ask (Round 1 E) |

**Failure alternatives must be the narrowest that unblock the work**: user-provided exports, an
asset folder, one specific authorized download, declared placeholders, or pausing visual fidelity
until assets exist. Never broad network or credential access, and never lookalike stock standing
in for a brand asset — that is a decision only the human makes, at Round 2 G.

## §6 Asking

Ask outcomes in plain language. The person is never expected to know what `output: 'server'`, an
adapter, an island, SSR, prerendering or a content collection is — explain the technical
consequence **after** they answer, not as a precondition for answering. At most 5 questions per
round — Round 1 holds the base decisions, Round 2 the conditional ones, and a round that would
exceed five carries the rest into the next. **One round per message:** Round 2 is asked after
Round 1 is answered, because those answers change which Round 2 topics exist. Say in one line
which Round 2 topics are pending, so nothing detected is silently dropped — a visible feature is
asked in Round 2 on its own terms, never folded into a Round 1 option.

**Only the human's own words skip a human decision.** A question may be skipped when the prompt, or
a contract the human reaffirmed (§1), already answers it — say in one line which ones were skipped
and why. What the repository or the design shows is evidence: it may **prefill a recommendation**
("the repository is bilingual today — keep both languages?"), never answer for the person. Scope,
languages, Git policy, removals, substitutions, fidelity and who writes the translations are
always the human's. Purely technical facts the repository settles — the package manager, the
existing build system — are not questions at all.

Before asking about scope, summarize what was found: how many real pages, how many are responsive
variants of the same page (a mobile frame is not an extra page), how many are components, and
which look like repeatable templates.

### Round 1 — base decisions

**A. Language and URLs.** "Will the site be in one language or several? If several, which is the
main one, and who provides the translations?" Options: one language; English+Spanish with content
provided; English+Spanish with translations later; another set. Derives: active locales, default
locale, URL structure, language switcher, sitemap/hreflang, missing content, fallback behaviour,
and which `seo-lint` rules apply — see §7. The agent never translates marketing copy on its own
authority.

**B. Site type.** "Does the site only publish content generated when it's deployed, does it need a
few server functions — forms, login, an API — or is it mainly a dynamic application with
personalised data?" Options: static; mostly static with a few dynamic functions; server-first;
static frontend with an external backend; "I don't know" (the agent recommends once it has learned
the needed features). See §8. **Ask B with this wording and these options only; name no feature
detected in the design** — no cart, checkout, form, map, sign-in or search appears in the question,
its options or its examples. Those are Round 2 topics, and B's answer is revisited after Round 2 if
a feature changes it.

**C. Git.** "How should I handle Git during the build?" Options: branch or worktree with local
commits, no push; branch/worktree with commits and push to an authorized remote; no commits, leave
a diff for review; no Git operations at all. **"Push" is intent only** — before any remote
operation the human must still name the remote, the destination branch, and the credential or
session to use. Read-only inspection before asking is fine; if the answer is "no Git," stop even
read-only Git unless the human separately allows it.

**D. Scope.** "Should I build every frame or page I found, or only a specific part?" — asked after
the summary above, never before it.

**E. Deploy target** — only when it changes architecture or commands. "Where will the site be
published, or should it stay a portable build with no provider?" Never auto-configure Vercel,
Netlify, Cloudflare, GitHub Pages, or a pipeline on your own initiative.

### Round 2 — conditional

Include a topic when the prompt, the design, the repository, or the scope from Round 1
**evidences** it. A visible functional affordance in the design — a cart icon, an "Add to cart"
button, a sign-in link, a search field, a form — **is** evidence, and on its own it is enough to
open the topic. A decorative element that only resembles one, or a feature the agent imagines the
site might want, is not.

**F. Visible features.**

| Feature | Minimum decision |
|---|---|
| form | real destination, provider/API, or removal |
| cart/checkout | real commerce, future integration, substitute, or removal |
| login/account | identity provider and data, or removal |
| booking/calendar | real system or an alternative call to action |
| map | embed/provider, external link, or a static image |
| search | data source and indexing |
| analytics/tag manager | opt-in, provider and id — deny-by-default, see `site-build` §3 |
| CMS | source, schema, available credentials |

The human chooses one of: implement, substitute, explicitly disable, or remove. A disabled control
is acceptable only when the end user is clearly told and the human chose it — **never ship a
button that looks functional and does nothing.**

**G. Assets and fonts**, after the §5 check. "I can / cannot obtain the exact assets. Do you
prefer to provide exports, authorize a specific download, use declared placeholders, or pause
visual fidelity until you have them?" For commercial fonts: ask whether the user owns the files and
the licence; offer substitutes only as PROVISIONAL and human-chosen; a font swap can change layout,
so never describe it as trivial without checking metrics. The agent never picks a substitute font
or brand asset on its own.

**H. Fidelity and copy** — only when scope has not already settled it: maximum fidelity, adapt to
the template's own system, or visual direction only; and whether the design's copy is final,
provisional, or demo text.

**I. Services, secrets, sensitive data.** List the needed environment variables, create only
secret-free examples (`.env.example`) during IMPLEMENTATION, and request real values through the
appropriate channel. Never write a secret into a versioned file, a prompt, a log, or a doc.

## §7 Language paths

The SEO mechanics of each path — hreflang, sitemap, canonical — live in
`../../static-site-seo/SKILL.md` and its references; this section decides which path applies and
what it changes, and does not restate those rules.

**Bilingual (current state).** en/es key parity, `src/lib/seo/locale.ts` as the only route map,
`astro.config.mjs`'s `i18n` block kept in sync with `src/lib/seo/types.ts`.

**Monolingual.** This is a **migration** the contract must spell out, not a toggle. Evidence to
inventory before promising it: the `i18n` block in `astro.config.mjs` (locales, the `es`→`en`
fallback, `fallbackType: 'rewrite'`); `LOCALES`/`DEFAULT_LOCALE` in `src/lib/seo/types.ts`;
`ROUTE_KEYS`/`localizedSlugs` in `src/lib/seo/locale.ts`; `src/i18n/en.json` and `src/i18n/es.json`;
`src/pages/es/**`; `src/components/shared/LanguageSwitcher.astro` and its use in `SiteHeader`,
`MobileMenu`, and `Footer`; locale-aware home components; hreflang in `src/lib/seo/sitemap.ts`; alternates in
`src/components/seo/SEO.astro`; the route checks in `src/integrations/seo-lint/`; and the tests
under `src/lib/seo/*.test.ts` that assume two locales. End state: no `/es/` routes, no
hreflang/alternate/fallback pointing at a removed locale, no empty Spanish dictionary kept only for
parity, `seo-lint` still green under `bun run build`, and `bun run test` green. **State plainly
that no tested monolingual conversion exists in this repository yet** — the roadmap lists it as
future work, phase D of `../../../docs/product/implementation-roadmap.md` — so its cost is estimated in the
contract, never asserted as known.

**Bilingual with translations pending.** Never invent commercial copy. Separate the bilingual
STRUCTURE, which can be built now, from the pending CONTENT, which cannot. No indexable page ships
with a fake translation or with English duplicated under `/es/` — note that the current
`fallback: { es: 'en' }` with `rewrite` would otherwise do exactly that, silently, so the contract
must decide between a placeholder-plus-noindex approach and a second content phase.

## §8 Rendering paths

Facts, not preference — see
[the on-demand rendering guide](https://docs.astro.build/en/guides/on-demand-rendering/) and
[the endpoints guide](https://docs.astro.build/en/guides/endpoints/).

| Mode | When | What changes in Astro | What it does not mean |
|---|---|---|---|
| Static (default, the template today) | content is the same for everyone at build time | nothing — pages render to HTML at build | browser JavaScript and client islands (`client:*`) still work with no backend and no adapter; animations, carousels and toggles need neither |
| Mostly static + on-demand routes | one or a few endpoints must run per request | keep the default static output; add an adapter, and set `export const prerender = false` only on the routes/endpoints that need it | one dynamic route never converts the whole site |
| Server-first | most pages are per-user or per-request | add an adapter and `output: 'server'`; individual pages can opt back in with `prerender = true` | `output: 'server'` only flips the default; it adds no capability by itself |
| Static frontend + external backend/API/CMS | data lives outside the site | Astro itself stays static; data is fetched at build time or client-side | the backend's URL and credentials are contract items, not implementation details to invent |

Stay static unless a real server need is evidenced. Any mode that needs an adapter requires the
deploy runtime (E) decided first. For a server-side feature, also decide error handling, spam
protection, data handling and secrets **before** implementing it — never promise login or sessions
without a defined adapter, identity source and persistence. Adding an adapter or a package is an
install: it needs the contract to authorize it, same as any other dependency.

## §9 The contract

Shown in chat, in the human's language, exactly these 15 fields in this order, then the confirm
line:

```md
## Proposed adoption contract

- Site objective:
- Page scope:
- Languages and URL structure:
- Rendering mode:
- Backend, API, CMS and third-party services (analytics, tag manager, forms, maps — deny-by-default):
- Real interactive features:
- Removed or substituted features:
- Content source:
- Assets available and pending:
- Fonts and licences:
- Fidelity priority:
- Deploy target:
- Git policy:
- Required validations:
- Blockers before implementing:

Do you confirm this contract so I can start modifying files?
```

Each field marks which items are human decisions and which are agent inferences — §4's
classification, applied to the contract itself. Length target for a common landing site is
15–40 lines; a contract that needs more is a sign the request has more than one adoption in it.
**Nothing is saved before confirmation.**

After confirmation, the first **mutation** is whatever the confirmed Git policy requires first — the
branch or worktree, when one was chosen — so nothing lands in the original worktree before the
agreed boundary exists. The first **file write**, inside that boundary, is persisting the contract
as a short `## Adoption contract` section at the top of the project's `DESIGN.md` — the file `site-build` and `project-setup`
already use for settled decisions, never a new document — carrying a marker line
`<!-- adoption-contract: v1 -->`, `Status: confirmed`, the confirmation date, and all 15 fields.
This section **replaces** the separate "record the answers in `DESIGN.md`" steps that
`project-setup` and `site-build` §3 used to describe on their own: those answers are contract
fields now, and each of those files points here instead of restating them.

Extraction evidence from `design-ingestion` step 6 is added to `DESIGN.md` later, only when it has
operational value — never a long `DESIGN.md` before anything is built.

**A `DESIGN.md` without the marker, without `Status: confirmed`, with a field missing, or that does
not cover the current request is NOT a valid contract.** The wizard runs — reopening only the
fields the existing document does not cover, when the rest of it is still valid. A valid one still
needs the human's reaffirmation (§1) before it skips anything.

## §10 After confirmation

PREFLIGHT_READY writes nothing: it re-runs any §5 check the answers made relevant, and produces the
plan — which assets will be fetched, from where, and what is still blocked. IMPLEMENTATION then
opens in this order: the Git boundary (§9), the `DESIGN.md` contract section, the asset downloads
the contract authorized. Then the route is `site-build` §2's order: `project-setup` consumes the contract's fields, `design-ingestion` runs
its extraction, then `static-site-seo`, then `astro-craft`, then `form-slot` only if a form was
activated in the contract, then `visual-gate`.

Technical decisions inside the confirmed contract are the agent's to make. Anything the contract
does not cover goes back to the human — it is a new question, not a technical decision dressed up
as one.

## §11 Acceptance scenarios

| ID | Situation | Expected outcome |
|---|---|---|
| S1 | Figma URL + "Use this template to build the site," non-technical user | read-only inspection first, done directly with no subagent; the §5 preflight results (assets, fonts) are reported with Round 1; Round 1 asks language, scope, rendering and Git, and names no detected feature in any of them; Round 2, in its own message, asks every detected feature; no round exceeds five questions; no `DESIGN.md`, code, branch or background worker exists before confirmation |
| S2 | "Static landing, but I want animations and a carousel" | stays static; only the needed islands/`client:*` directives are added; no adapter; browser JS is never treated as a backend need |
| S3 | "Pages are static, but the form must post to our own API" | asks whether the API is external or an Astro endpoint; if Astro, adds an adapter and marks only that route on-demand — never the whole site; errors, spam handling, data handling and secrets are defined before implementing |
| S4 | "It has login, sessions and different pages per user" | recommends server-first/on-demand with reasons; asks the runtime/deploy target and the identity/data source; promises nothing without an adapter and real persistence |
| S5 | Design shows "Shopping cart" and "Add to cart," prompt silent on commerce | the wizard blocks on it at Round 2 F; offers implement / substitute / explicitly disable / remove; never ships a dead button |
| S6 | Assets are not obtainable | detected at §5, before any file is modified; offers user exports, one specific authorized download, declared placeholders, or a pause — never broad access, never lookalike stock |
| S7 | "English only" | the contract spells out the §7 monolingual migration explicitly; no orphan hreflang or fallback; SEO gates stay green; no empty Spanish dictionary required to ship |
| S8 | Bilingual, translations pending | no invented copy; structure and pending content are kept separate; no indexable fake or duplicated page; placeholder+noindex or a second content phase is agreed with the human |
| S9 | Working tree already has uncommitted changes | intake continues read-only; IMPLEMENTATION is blocked, not intake; the files are listed; no reset/clean/stash/overwrite; the human is asked how to proceed |
| S10 | "Don't use Git" | no branch, commit, tag, remote, PR or push at any point; read-only Git only if separately allowed; delivery is a file list plus validation results |

These scenarios are behavioural. `src/agent-contracts/adoption-wizard.test.ts` proves only that the
wiring and this table exist — the state names, the contract's 15 fields, the rendering modes, the
question cap, and every cross-reference from the other skill files — not that an agent follows any
of it in a real session.
