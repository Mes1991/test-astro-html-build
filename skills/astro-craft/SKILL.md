---
name: astro-craft
description: "Use when building or editing an Astro site — creating a page or a section, adding a component, styling anything, choosing how something looks. Trigger it even for a single section, and for splitting an oversized component in a project that already exists. Also use it for why a site looks generic, why the fourth page is a copy of the first, whether something should be a component, whether a component needs client-side JavaScript, where a colour or spacing value should live, whether to use a content collection, or auditing an Astro project that grew without a structure."
---

# Astro craft

## What this is

A workflow. It tells you what to DO and in what order; the companion contracts below tell you what
is CORRECT. **This file deliberately restates none of their rules** — two copies of a rule means one
of them is wrong and nobody knows which.

| Contract | Owns |
|---|---|
| `../project-setup/references/toolchain.md` | what gets installed: runtime and package manager versions, the install-time security posture, how a dependency is admitted |
| `references/astro-structure.md` | where source goes: directories, components, props, islands, collections, build output |
| `references/visual-craft.md` | what the result looks like: dials, scales, typography, layout, colour, motion, bans |
| `references/browser-support.md` | which CSS and JS features you may write at all, and how to reach past the floor |
| `references/accessibility.md` | whether a person can actually use it: landmarks, keyboard, focus, contrast, forms |

Two more overlap the same work and are not duplicated here either. `../static-site-seo/references/seo-page.md` owns the `<head>`,
the document outline and Core Web Vitals; `../static-site-seo/references/seo-site.md` owns the site's URL shape, which the build
configuration has to match. Install those from the same place if the site is going to be found.

**Seven files in total, then** — the five in the table plus those two. The workflow below names
each one at the step where it applies; if a number here ever disagrees with the table, the table is
the one to trust.

## The order, and why it is this order

Every step here is cheap before the one below it and expensive after. That is the whole reason the
order matters: nothing in it is hard, but doing it backwards means redoing work that already looked
finished.

**Before step 0, on a new project.** Arriving at this workflow settles the first project-setup
question — there is a build step. Two others are still open: whether a styling toolkit is installed,
and which languages the site serves. Both change what gets written from the first file onward.
The `project-setup` skill asks all three and states no rule this workflow repeats; if it is
installed, it should have run before this one.

### 0. Pin the toolchain before installing anything

`../project-setup/references/toolchain.md` sections 1 and 3. Node's version, the two pins in `package.json`, and
`pnpm-workspace.yaml` with the release-age delay set explicitly.

**This one is first because it is the only step whose cost is not recoverable.** Every other step here
produces work that can be redone. An install that ran a compromised dependency's script already ran
it, on this machine, with these credentials — and reordering the steps afterwards changes nothing
about that. It is also the step most likely to be skipped, because a project that installs
successfully looks finished.

Whenever a dependency is added later, section 4 of the same contract is the procedure. The install
command is its last step, not its first.

### 1. Decide, before any markup exists

Set the three dials and the scales — sections 2 and 3 of `references/visual-craft.md` — and write them into
`DESIGN.md` at the project root. Then define them once as tokens, in the one global stylesheet
`references/astro-structure.md` section 8 requires.

**Do not skip ahead to the first page.** Styling written before the scales exist produces values that
were never chosen, and every one of them has to be found and replaced later. Values are cheap to
choose now and expensive to unify once four pages use them.

If the project already has a brand — colours, a typeface, a logo — this step is where it gets turned
into scales, not where it gets pasted in. A brand colour is one input to section 6, not the answer to it.

**Settle the browser floor in the same sitting**, and write it into `DESIGN.md` alongside the
scales. `references/browser-support.md` section 7 says where else it goes. This belongs here and not later
because it decides which CSS you are allowed to write, and a stylesheet is far cheaper to author
against a known floor than to audit against one afterwards — every value chosen in step 1 is a
value you may or may not be able to express.

Check the palette against `references/accessibility.md` section 5 while the colours are still on paper. A
contrast failure found now is a different number; found after four pages, it is a repaint.

### 2. Confirm the build is producing what you think

`references/astro-structure.md` section 1. Three values in `astro.config.mjs` decide whether this is a static
site and what shape its URLs take. Read them before writing routes, because changing the URL shape
later changes every canonical on the site and every link into it.

### 3. Build the frame, then the sections

In this order:

1. The layout — one per page shape. It owns the `<head>`; what goes in that head is `../static-site-seo/references/seo-page.md`.
2. The sections, each as its own component, per `references/astro-structure.md` section 3.
3. The page, which imports them and holds no markup of its own.

**The signal to stop and extract:** when the page file passes the line budget in section 3, or when a
piece of markup appears for the third time. Both are mechanical. Neither requires a judgement call,
which is exactly why they are the two to watch — a rule that needs a judgement call is a rule that
gets skipped at the end of a long session.

### 4. Interactivity last, and argued

Build every section with no client-side JavaScript first. Then add a `client:*` directive only where
section 5 of `references/astro-structure.md` says one is warranted, with the comment it requires.

**A `client:*` directive is only for hydrated framework islands.** An ordinary Astro `<script>` tag
is not a framework island and does not need one; it ships as written and runs on the client without
any directive. Do not read this step as "all client JavaScript requires a `client:*`".

Working in this order matters more than it sounds: a section built as an island from the start is
almost never converted back, and a page assembled that way is a client-side application that happens
to be in Astro. Built static first, most sections turn out never to need hydrating at all.

### 5. Repeated content becomes a collection

The moment a second entry of the same kind exists — a post, a case study, a team member — it goes
into a content collection with a schema, per `references/astro-structure.md` section 6. Not the fifth. The
second, because the array-inside-a-component that handled the first two is what the next twenty get
appended to.

### 6. Run every pre-flight before saying it is done

`references/astro-structure.md` section 10, `references/visual-craft.md` section 9, and `references/accessibility.md` section 9. All
of them, in the same working session as the change, before reporting the work finished. An unchecked
item is unfinished work, not a note for later.

**The keyboard pass is the one that cannot be delegated to a tool.** Put the mouse down and Tab
through the page you just built: every control reachable, in reading order, visibly focused, and
Escape closing whatever you opened. An automated audit finds between a third and a half of real
barriers, so a green score is a floor rather than a result — and this is the half it misses.

**Then check what you wrote against the floor.** Anything reached for out of habit — `:has()`, a
container query, `color-mix()`, an array method from the last two years — is above it unless
`references/browser-support.md` says otherwise. Nothing in the build will tell you: the CSS ships as written
and the JavaScript compiles and then throws on the visitor's phone.

## Auditing a project that already grew without this

The common case, and the one where the instinct is wrong. A project with eight-hundred-line pages
does not get fixed by rewriting it. It gets fixed in this order, and each step is shippable on its own:

1. **Read, and write down what is already true.** Which values are actually in use for spacing, size,
   radius and colour. Expect a long list with near-duplicates. Do not change anything yet.
2. **Write `DESIGN.md` from that list**, choosing the scales that best fit what exists rather than
   inventing new ones. The goal is the smallest set that covers the current site, because a set that
   fits nothing already built will not be adopted.
3. **Define the tokens, and convert one page.** One. It proves the set is sufficient before it is
   applied forty times.
4. **Extract components from the most-repeated section first**, not from the top of the file. The
   third copy is where the payoff is.
5. **Only then apply the visual rules.** In this order they are edits to a small number of
   components; in the reverse order they are edits to every page, repeatedly.

**What not to do:** a full rewrite in one change. It cannot be reviewed, its regressions cannot be
told apart from its improvements, and it is the change most likely to be abandoned half-done — which
leaves the project with two structures instead of one.

## What this workflow does not prove

Written down because an unlisted gap gets mistaken for a covered one:

- **Nothing here is machine-checked.** Unlike a site whose sitemap can be regenerated and verified,
  every rule in both contracts is read-and-apply. A completed checklist is a claim by whoever ticked
  it.
- **The contracts cannot see the result.** They constrain the decisions, not the outcome. A page that
  satisfies both and still looks wrong is possible, and the answer is a design judgement, not another
  rule.
- **Accessibility is broader than the two rules the visual contract states.** Contrast and
  not-colour-alone are in scope there because they are visual decisions. Keyboard order, focus
  management, labelling and semantics are covered by `references/accessibility.md`, not by the visual
  contract — read that file for them.
- **Astro versions move.** Both contracts name the version they were verified against. A project on a
  newer major needs the upgrade guide, and a rule that no longer applies is a **major** bump on the
  contract, not a local workaround.

## A rule about outside advice

There is a large volume of confident guidance about Astro and about interface design, and much of it
is either version-stale or a matter of taste stated as fact. Two specific traps:

- **Stale API paths.** The content collections configuration file has moved between majors, and older
  answers still name the old path. Prefer the official documentation for the installed version over
  any article, and over recall.

  If the tool you are running in supports MCP servers, Astro publishes one for its own
  documentation, and it is the cheapest way to obey the sentence above:

  | | |
  |---|---|
  | Server | **Astro Docs** |
  | Endpoint | `https://mcp.docs.astro.build/mcp` |
  | Transport | streamable HTTP |
  | Tool | `search_astro_docs` |

  It is remote and free, so there is nothing to install. **It is an aid, not a step** — this
  workflow never depends on it, because not every editor supports MCP and a skill that assumes one
  fails silently in the ones that do not. Where it helps is exactly the trap above: it answers from
  the current documentation rather than from training data, which is what makes a stale
  configuration path show up as a corrected answer instead of a confident wrong one.

  Know its edges before trusting it. It reads documentation and nothing else — it cannot see your
  project, your installed version, or your files, so an answer it gives about "the current way"
  is about the current *docs*, not about the Astro in your `package.json`. Check the installed
  version yourself and keep the rest of this file's rules; the server answers Astro questions,
  it does not decide anything here.

- **Aesthetic advice presented as a rule.** If a suggestion cannot be written as a value in
  `DESIGN.md` or as a checklist item with a factual answer, it is a preference. Preferences are fine —
  record them as decisions rather than adopting them as laws, and note who decided.

When outside advice conflicts with these contracts, the contracts lose to the official documentation
and win against everything else. If a contract turns out to be wrong, fix the contract and bump it;
do not work around it in one project and leave the next reader with the same problem.
