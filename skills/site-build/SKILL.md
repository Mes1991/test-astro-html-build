---
name: site-build
description: "Use at the START of any request to build, rebuild or extend a website — 'build me a landing page', 'here is the Figma, make the site', 'add a contact page'. Owns the order the other workflows run in, and which input wins when a design file, an exported page and a screenshot disagree. Also use it for what to do first, many pages from one design file, a build stalled between workflows, an existing repository with its own build system, a Tag Manager container to install, or a finished site missing search engine, tracking or form work."
---

# Site build

## What this is

The router. Every other document in this set is deep and narrow: it answers its own subject
completely and says nothing about when it runs. That is the right shape for each of them and it
leaves exactly two questions with no owner, which is what this file is for:

1. **What order do the workflows run in**, and which ones apply at all.
2. **Which input wins** when a design file, an exported page and a screenshot disagree.

**It states no other rule.** Everything below names the document that owns the answer and stops.
If you find yourself reading a value, a threshold or a selector here, that is a bug in this file —
two copies of a rule means one of them is wrong and nobody knows which.

**The split with `astro-craft`, stated once so it does not have to be inferred:** this file owns the
build **sequence** — the order the skills in this set run in, which one owns which phase, and which
input wins when they disagree. `astro-craft` owns Astro **implementation** detail — pages, layouts,
components, styles, islands, and the order those are built in *within* the step this file calls
"build layout, then sections, then pages." Neither restates the other's ordering, and neither tells
you to read the other's full reference set — this file names the specific `astro-craft` steps that
apply at each point (see the table below), and `astro-craft` never mentions this file's ordering at
all. If a rule about Astro implementation order shows up here, or a rule about cross-skill sequencing
shows up there, that is the bug to report.

### A contract's headings are not the contract

This is the one instruction in this file about how to read the others, and it is here because
skipping it produced a shipped page in which every visible defect was covered by a rule that had
been written down and not read.

The contracts are long — the schema one alone is larger than every skill in this set combined —
so listing their headings is a cheap way to feel oriented, and it is the specific way this goes
wrong. **A heading tells you a section exists. It never tells you the rule inside it, and it never
warns you.** "The envelope" does not list the keys. "Traps" does not say which. A rule that breaks
silently is, by definition, one you will not go back for.

So before each step below, open the sections that step names and **read them, not their titles**.
The steps name sections rather than whole documents for exactly this reason: it is a small,
bounded read every time, and there is no step here that requires an 80-kilobyte file end to end.

## 1. What wins when the inputs disagree

You are usually handed more than one thing, and they never agree exactly. Rank them **before**
starting, and say out loud which one you ranked first — a precedence chosen silently is
indistinguishable from one that was never chosen.

**Rank by provenance, not by format.** A file's authority comes from somebody having made
decisions in it, and layers, variables and components are structure rather than decisions — which
is why the second row below exists and why it is the one that costs money.

| Input | Trust it for | Do not trust it for |
|---|---|---|
| An **authored** design file — somebody made the decisions in it | exact values: colour, type scale, spacing, states, component boundaries | anything it does not contain — an empty state it never drew is not a decision it made |
| A design file **generated and then imported** — a component library, a template | what the result should look like, the section inventory and order, and the copy | any value, because nobody chose one. Its variables are the library's defaults |
| An exported or scraped HTML page, or code a design tool generated | what the result should look like, and the copy | its markup or its class names, ever |
| A flat image — screenshot, JPG, PDF, or a frame screenshot from a design tool | proportion, hierarchy, mood | any number read off it, all of which are measured from a render at an unknown zoom |
| A written brief | intent, audience, what the page is for | anything it does not mention, which is most things |

**Row two is invisible at a glance and it is common.** A file produced by a component library and
opened in a design tool has real layers, real variables, real components and real auto-layout — it
passes every test anyone applies before deciding to trust it, and the values in it were chosen by a
library, for nobody's brand. `../design-ingestion/references/design-source.md` section 0 owns the question, the signals that
answer it, and the case where a generated file was later edited by hand.

**And do not assume the design file is the final truth.** When there is a chain — a generator, then
a design tool, then code — which one is live is a fact about the project. Get it stated; the same
section owns that too.

**Four rules follow, and they are the whole section:**

- **Values come from the highest-ranked input that actually contains them**, in the order above.
  Not from an average, and not from whichever one you opened last.
- **Structure never comes from an export.** An exported page is a render, not a source. Its
  markup is the output of a tool optimising for something other than being read, and copying it
  imports a dead end that looks like a head start. Structure comes from the structure contract for
  the stack you are on, whatever the input looked like.
- **Say what you inferred.** Everything a flat image cannot carry — hover states, focus rings,
  error states, the empty state, what happens at 375 pixels — is a guess. Guessing is fine.
  Guessing silently is what gets shipped and never revisited.
- **Never record a claim you cannot evidence.** "Follows the supplied design" in a notes file, or
  "reviewed the screenshots" in a handover, is a statement of fact about work you did, and writing
  it when you did not do it is worse than omitting it: the reader stops checking. If you looked at
  a design, name what you took from it — the accent colour, the section order, the field list. If
  you did not, say that instead. This costs nothing when the work was done and is the only thing
  standing between a reviewer and a page that was never compared to anything.

When two inputs of the same rank disagree, stop and ask. That is the one question worth
interrupting for, because it is the only one where both answers are defensible and only one is
what they wanted.

## 2. The order

Each step is cheap before the one below it and expensive after. Nothing here is difficult; doing
it out of order means redoing work that already looked finished.

| # | Step | Owned by | Skip when |
|---|---|---|---|
| 0 | Rank the inputs, provenance first | section 1 above | you were handed exactly one thing |
| 1 | Settle build step, styling toolkit, languages | the `project-setup` skill | never |
| 2 | Pin the toolchain before installing anything | `../project-setup/references/toolchain.md` sections 1 and 3 | there is no build step, or the repository already has one — it came with its own |
| 3 | Decide the URL shape and the site-wide files | `../static-site-seo/references/seo-site.md` §1–7 | never — see section 3 |
| 4 | Extract values and assets from the design | the `design-ingestion` skill | there is no design source, only a brief |
| 5 | Set the dials, scales and browser floor into `DESIGN.md` | the `astro-craft` skill, step 1 | never; it is stack-independent |
| 6 | Build layout, then sections, then pages | the `astro-craft` skill, steps 2–4 | **the project is not being built with Astro** — see below |
| 7 | Head, outline and Core Web Vitals, per page | `../static-site-seo/references/seo-page.md` §1–6, then §9–10 | never — see section 3 |
| 8 | Any form on any page, **only after explicit activation** | the `form-slot` skill | no page has a form, or the form provider has not been explicitly activated |
| 9 | Prove the page against its reference, at every width | the `visual-gate` skill | never — with no reference it still owns the responsive and accessibility categories |
| 10 | Structured data, then off-site signals | the `static-site-seo` skill | never — see section 3 |
| 11 | Tag Manager container, if there is one | `references/gtm-injection.md` | the decision in section 3 was no |

**Step 1 comes before step 0 is acted on, not before it is done.** Rank the inputs while reading
the brief; you cannot choose a stack from a screenshot.

**Step 3 sits above the markup deliberately.** The URL shape is a build configuration value, and
changing it later changes every canonical on the site and every link into it. It is the cheapest
decision on this list today and one of the most expensive in a month.

**Step 4 is above step 5 because the dials come out of the design.** Setting a type scale and then
extracting the design's own is how a project acquires two scales, one of which is nobody's. When
there is no design source, step 5 is where the scales get chosen instead — and that is a decision
to name rather than a default to arrive at.

**Step 8 is not last.** A form card is a page section, so it is built with the other sections — the
part that waits is the embed snippet, and that workflow is explicitly built to not wait for it.
Discovering a form at the end is how a page ships with a stand-in still in it.

**Step 9 is not a review, it is a gate, and it runs on every page.** Every other step in this list
ends by handing work on; this one ends by looking at what was built, with evidence. It is placed
after the form because a form card is part of the page being proved — and it is before the
structured-data step because correcting geometry can move the content those steps describe.

**Step 6 is the only stack-specific step in this list, and the `project-setup` skill decides whether
it runs — not this file, and not the presence of a build step.** That question has three answers
and only one of them is step 6:

| What step 1 found | What owns the structure | Step 6 |
|---|---|---|
| A new project that needs a build step | `../astro-craft/references/astro-structure.md`, via the `astro-craft` skill | run it |
| A repository that **already has a build system** — Next, Nuxt, Vite, Remix, Rails, Laravel, anything **other than Astro** | whatever that system prescribes. Neither `../astro-craft/references/astro-structure.md` nor the Astro skill applies | **skip it** |
| A repository that **already uses Astro** | `../astro-craft/references/astro-structure.md`, via the `astro-craft` skill — an existing Astro build does not exempt it | run it |
| A new project with no build step | nothing in this set | skip it |

**The middle row is the one that does damage, and it is the common case.** "Add a landing page"
usually arrives inside an application that has been running for years, and that application has a
build step — so a gate written as *"skip when there is no build step"* lets it straight through
into an Astro workflow. What follows is an Astro install beside the existing one: two toolchains,
two dev servers, two output directories, in a repository nobody agreed to migrate.
Question 1 of the `project-setup` skill states this rule and owns it. This row exists to point at it,
because the router is where the mistake gets made.

**An existing Astro build is not this row.** The exclusion is for a *different* build system; when
the repository is already Astro, the Astro contracts are the ones that govern it and step 6 runs.

**If a different build step genuinely seems right, propose it as a migration and stop.** A
migration is a thing to have approved, never a thing to arrive at by working down a checklist.

**Rows two and three are not failures, and neither leaves you without instructions.** Steps 3, 4,
5, 7, 8, 9, 10 and 11 all still apply and none of them mentions a framework. What is missing is only the
file layout: this set owns Astro's and nothing else's. Say that plainly rather than inventing a
convention and leaving the next person unable to tell whether it was chosen or defaulted into.

## 3. The three that never fire on their own

This is the failure this file exists for. Each of these is real work that a reasonable request
never mentions, so nothing triggers it, and its absence looks exactly like completion.

- **Search engines.** "Build me a site" does not say SEO, and a site with no `<head>`, no
  canonical and no `sitemap.xml` renders perfectly. Steps 3, 7 and 10 are not optional extras
  awaiting a request; they are part of delivering a site. Do them and say you did.
- **Tracking.** `references/gtm-injection.md` is a contract with no skill in front of it, which means
  **nothing will ever activate it by inference.** If you do not ask, no container is installed and
  no one finds out until the first month with no data. Ask at step 1, once: is there a Tag Manager
  container, and what is its id. A no is a fine answer and it is a recorded one.
- **Forms.** A form on a design is a form, not a picture of one. The `form-slot` skill covers the
  case where no embed snippet exists yet — which is the normal case, not an exception — and the
  cost of missing it is a page that looks live and silently discards every lead.

**Analytics, tag managers, remote forms and third-party submission are opt-in and
deny-by-default.** The site's essential behaviour must work without them, without mandatory
JavaScript and without unsolicited network traffic. A form depicted in a design, or a page that
would benefit from measurement, is **not** authorization to activate a provider: activation is an
explicit decision recorded in `DESIGN.md`, and until it is made the default is absent.

**Record all three answers in `DESIGN.md`** beside the project-setup answers, with the date. Not
because the file is important, but because "we decided no tracking" and "nobody asked" are
indistinguishable six weeks later, and only one of them is a decision.

## 4. The closing pass

Every workflow in this set ends by handing work over. **None of them ends by looking at what it
built**, and that is the gap this section closes — not a missing rule anywhere, a missing look.

Run these before you hand anything back. Each takes under a minute, each has caught a real defect
that shipped, and not one of them is a judgement call.

**When there is a design source, step 9 already did the hard half of this** — the `visual-gate`
skill compares with evidence rather than by eye, and its verdict is per category. This list is what
remains: the things no capture shows, plus the whole of it when there was no design to compare
against.

| Check | If it fails, the answer is in |
|---|---|
| Open the design beside the built page. Does every section in the design have a counterpart, and does every section built have a source? | the `visual-gate` skill when there is a reference; otherwise section 1 — and if the answer is "no", say so rather than adjusting the design in your head |
| Load the page and look at the form with nothing typed into it. Is anything visible that should not be — an empty box, a coloured band, a stray border under a field? | `../form-slot/references/embed-styling.md` sections 5 and 9 |
| Import the schema through the adapter's documented mechanism. Does it import with no errors? *(only when the form provider is activated)* | `../form-slot/references/form-schema.md` section 10 |
| Has a real submission been sent and received? **A clean import proves the schema, and nothing else.** *(only when the form provider is activated)* | `../form-slot/references/form-slot.md`, the acceptance table |
| View the page source and read the `<head>` against the checklist. | `../static-site-seo/references/seo-page.md` section 10 |
| Tab through the page from the address bar. Is the focus ring visible on every stop, and does the first tab reach a skip link? | `../astro-craft/references/accessibility.md` sections 2 and 3 |
| Are the three project-setup answers, the browser floor and the tracking answer all written in `DESIGN.md`? | the `project-setup` skill, and section 3 above |

**Say what you decided without being asked.** Several questions in this workflow are answered from
a table rather than by asking — whether there is a build step is the usual one, and for a
single-page request it always resolves the same way. That is correct behaviour and it is still a
decision the person who asked for the work never made. Name it in the handover, with its reason
and its reversal cost: *"one page, so no build step and hand-written CSS; if more pages are coming,
now is when that changes cheaply."* A decision recorded in `DESIGN.md` and absent from the handover
is a decision the client learns about by reading the output.

**The submission row is the one that gets waved through, and it is the most expensive.** Import,
preview, publish, a verified origin, the snippet on the page, a submission accepted, an email
received, a reply reaching the visitor and a tracked conversion are **nine different proofs**, and
each one has failed on its own with all the others green. `../form-slot/references/form-slot.md` sets them out as a table
because none substitutes for another — and the retrospective that produced this version had a
workflow ending at "the JSON imported and the form rendered", which proves the first two.

**Two of these fail in the direction that looks like success**, which is why they are checks rather
than trust. A form with an empty error box under every field renders, scores well, and passes every
automated check there is. A page built from a brief instead of the design attached to it is
often a perfectly good page. Neither announces itself.

## 5. Many pages from one design

Everything above is written for one page. Run it thirty-nine times and it produces thirty-nine
pieces of work that were each correct and that nobody can review as a set — which is the failure
this section exists for, and the only one in this file that is about cost rather than correctness.

**The order for a batch**, which is the order above with three things inserted and one moved:

| # | Step | Owned by |
|---|---|---|
| 1 | Rank the inputs and establish provenance | section 1, and `../design-ingestion/references/design-source.md` section 0 |
| 2 | Settle build step, styling toolkit, languages | the `project-setup` skill |
| 3 | Inventory the routes and group them into families | `references/site-manifest.md` |
| 4 | Build ONE page per family, all the way through steps 3–11 above | this file |
| 5 | Get each representative approved, by a person, with a date | `references/site-manifest.md` |
| 6 | Produce the rest of each family as content plus **declared** exceptions | `references/site-manifest.md` |
| 7 | One unit per unique form, reused across the pages that need it | the `form-slot` skill |
| 8 | Close SEO and run the gate over every route | the `static-site-seo` and `visual-gate` skills |

**Step 3 is after step 2, not before it.** Whether the pages can be produced as content at all
depends on there being a build step and a content collection, which is question 1 of the
`project-setup` skill. An inventory taken before that is an inventory of pages you may have to
build by hand.

**Step 5 is the gate the whole method rests on, and it is the one that feels skippable.** Building
a whole family before anyone looks means an error is made once and shipped n times, and the
correction is n corrections. Approving one small page is a real gate precisely because it is small
enough to actually look at.

**Families can be seeded rather than discovered.** If the pages came out of a component library —
the generated row of section 1 — they are already grouped by the component set they were built
from, and reading that off the design is faster and more reliable than opening thirty-nine pages
and deciding which look alike. **Seed, then confirm by looking**: the seed is a very good
hypothesis, and what it cannot see is a page that shares a template and genuinely needs to behave
differently.

**A difference that is not declared is a defect.** `references/site-manifest.md` owns that rule and the fields
that record it. The reason it belongs here too is that it decides how step 6 is done: a page
produced with an undeclared variation costs a reviewer the work the whole batch was meant to save.

**Never copy a measurement from one page to another.** A shared value belongs to the family and
lives in its tokens or its components; a value that is not shared is an exception and gets a line.
A number copied from page four into page seventeen is neither, and it survives every future change
to the family without being updated.

**One more thing changes at this scale, and it is in section 4:** after touching anything shared,
the gate re-runs on one representative from **every** family that uses it — not one page in total.
