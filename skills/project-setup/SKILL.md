---
name: project-setup
description: "Use at the START of building any web page or site — a landing page, a homepage, a marketing site, a one-pager, a static site — and especially from a design: a mockup, a Figma file, a canvas, a screenshot. Ask its questions BEFORE any markup: whether the project has a build step, whether a styling toolkit is installed, which languages it serves. Trigger it even when the request says only 'build the HTML' or 'code this design', and even for a single page. Also use it for why a page became one enormous file, or whether an existing plain-HTML project should move to a build tool."
---

# Project setup

> **Adoption gate.** When the request builds, rebuilds or adopts a site, this skill runs only
> inside or after `../site-build/references/adoption-wizard.md`. Its questions are asked in that
> wizard's Round 1, not separately; after confirmation it consumes the contract fields and asks
> only what the contract left unresolved. Before confirmation it may only read the repository.

## What this is

Three questions, asked before any markup exists, plus the criterion for answering each one
yourself when the request already settles it.

It states no rule of its own beyond the ones in "The no-build branch" and "Reporting" below.
Everything else it does is route: each question ends by naming the contract that owns the answer,
and that contract is where the rule lives. Two copies of a rule means one of them is wrong and
nobody knows which.

**Why this exists as its own file.** These three decisions belonged to no document. Every other
contract in the set assumes one of them has already been made, and they assume it in opposite
directions — one opens with "a site built with Astro or plain HTML" as though both were equally
fine, another describes a project structure that only exists with a build step, a third opens by
saying there is no build step at all. A reader following any of them individually is following a
decision nobody made deliberately.

## The three questions

Answer each from the request when the request answers it. Ask when it does not. **Do not infer
from the word the person happened to use for the output** — "make me the HTML" describes what
they want to end up with, not how it should be produced, and treating it as an answer to question
1 is exactly the mistake this file exists to prevent.

**Read the repository before you answer any of them.** A project that already exists has answered
some of these, and its answer wins — not because it is better, but because a second answer is not
a setup decision. Two build systems, two styling vocabularies or two language schemes in one
repository is a **migration**: something to propose and have approved, never something to arrive
at by working through a checklist. Look for a `package.json` and what it depends on, a bundler or
framework config, a stylesheet or utility vocabulary already in use, and the `lang` of any page
already shipped.

That check comes first because these three questions were written for a project with nothing in
it, and the most common real request — "add a landing page" — arrives inside an application that
has been running for two years.

### 1. Is there a build step?

Rows are in precedence order — the first one that matches is the answer.

| The situation | Answer |
|---|---|
| the repository already has a build system | **already answered.** Use the one that is there, and go to question 2. If that system is Astro, the Astro contracts below still apply |
| a new project: one page, no section repeated, no content that will grow | no build — write HTML by hand |
| a new project: two or more pages, or any section that appears on more than one of them, or content that will keep being added | a build step |

**Otherwise, ask.** Phrase it as what it costs, not as a technology preference: with no build
step, a second page is a copy of the first and every later edit happens twice; with one, there is
a toolchain to install and a project structure to learn before the first line of markup.

**An existing build system is authoritative, and the top row is not a formality.** Standing up a
second one beside it — an Astro install next to a Next, Nuxt, Vite, Rails or Laravel application —
gives one repository two toolchains, two dev servers and two output directories, and that is easy
to start and expensive to undo. Note that the page-count row would otherwise reach this conclusion
on its own: any application that has been running for a while has more than two pages, so the
table answers itself and the migration happens without anyone deciding on one. If a different
build step genuinely seems right for what is being asked, **say so and propose it as a migration**.
Do not perform one as a side effect of setting up a page.

The answer decides which contract owns the rest of the structure. **On a new project** where the
answer is a build step, that is `../astro-craft/references/astro-structure.md` and the `astro-craft` skill. Where the project
already has a build system, the structure is whatever that system prescribes, and neither of those
documents applies — **unless the existing system is Astro itself**, in which case
`../astro-craft/references/astro-structure.md` and the `astro-craft` skill are exactly the contracts that govern it. No build
step means this file's next section is the only structural rule the project has.

**One page is a real answer, not a lesser one.** A single landing page with no repetition is
genuinely better hand-written: no install, no toolchain to keep current, nothing to break between
now and the next edit. The failure is not choosing it — it is choosing it silently and then
building four pages that way. **Scope boundary:** this product is specifically an Astro static
template. When the target project is test-astro-html-build itself, the Astro build is already authoritative and
this branch does not apply; the hand-written branch is for a genuinely separate, non-Astro
one-pager.

### 2. Hand-written CSS, or a styling toolkit?

Answer from the request if it names one, or if the project already has one installed. Otherwise
ask, because the answer changes the first line of every file after it and is close to
irreversible once a site's markup is written against a utility vocabulary.

**Whether a toolkit may be installed at all is `references/toolchain.md`'s**, not this file's — it owns the
admission procedure for every dependency and the reasons behind it. Ask the question here, then
follow that document. Do not install anything before reading it.

If the answer to question 1 was "no build step", note that most toolkits assume one. A toolkit
without a build step means a CDN script or a pre-built stylesheet, which is a different decision
with different costs — surface it rather than quietly picking one.

### 3. Which languages?

English only, Spanish only, both, or another set. Ask whenever the request does not say. A site
built monolingual and translated later is not a translation job; it is a re-plan of its URLs.
**The language paths themselves — bilingual, a monolingual migration, or bilingual with
translations pending — are owned by `../site-build/references/adoption-wizard.md` §7**; this
question only surfaces which path applies.

This decides the `lang` attribute, whether `hreflang` annotations are needed, and whether
`sitemap.xml` carries `xhtml:link` blocks. **All three of those rules belong to `../static-site-seo/references/seo-site.md` and
`../static-site-seo/references/seo-page.md`** — this file asks the question and points at them, and states none of the rules
itself.

## The no-build branch

When the answer to question 1 is "no build step", this file owns the structural rule, because
nothing else does. A project with a build step gets its line budget and its extraction signal
from `../astro-craft/references/astro-structure.md`; a hand-written project had neither, and the result is the failure that
whole document opens by describing — one enormous file where every section is correct and nothing
is reusable.

Three signals, all mechanical. That is deliberate: a rule that needs a judgement call is a rule
that gets skipped at the end of a long session, which is precisely when it is needed.

- **The stylesheet is its own file, from the first line.** Not a `<style>` block that grows. A
  page carrying its entire stylesheet inline cannot share one rule with the page built next week,
  and by the time that matters the block is a thousand lines and nobody wants to touch it.
- **A second page means stopping and re-asking question 1.** Not after the fourth. The second,
  because the second page is where the copying starts and the decision is still cheap.
- **Markup past roughly 300 lines in one page means the same.** Excluding the stylesheet, which
  is now a separate file — that is what makes the count mean anything. It is a signal to
  re-examine the answer, not a cap to trim to.

**Record the answers.** When this skill runs under the adoption wizard, the three answers are
fields of the adoption contract (`../site-build/references/adoption-wizard.md` §9), not a separate
`DESIGN.md` block. Outside that flow — a genuinely separate, non-Astro one-pager with no adoption
in play — write the three, with their reasons, into `DESIGN.md` at the project root next to
whatever the visual and browser-floor decisions were. A decision nobody wrote down gets re-made
differently by the next person, and neither of them knows the other decided.

## Reporting

Whatever the answers were, this holds when the work is reported: **what a tool proved and what
you concluded by reading go in separate paragraphs, always.**

- What a command proved: name the command, and say what its output was.
- What you checked by reading: say so, and say how much of how much — "28 of 28 images carry an
  `alt`", not "all images carry an `alt`".

Two sentences side by side, one quoting an exit code and the next listing four properties, read
as one claim with one source. The reader credits the tool for both, and cannot tell which half to
re-check. This costs nothing to get right and is invisible when it is wrong: the four claims may
well be true, and nobody learns whether they were verified or lucky.

## What this does not do

Written down because an unlisted gap gets mistaken for a covered one:

- **It only applies if it fired.** A skill loads when the model judges its description to match.
  The description above is written against the words people actually use — landing page, site,
  homepage, design, mockup, HTML — rather than against a technology name, because a skill whose
  trigger is the name of the tool cannot fire on a request that has not chosen the tool yet. That
  is the failure this file was written after. It is still a judgement, and it is still not a
  guarantee: if your tool has a file it reads on every request, name this one in it.
- **It owns no rule about the result.** The three answers constrain how the project is put
  together, not whether the page is any good. The visual, accessibility, browser-support and SEO
  contracts own that, and none of them is checked by anything here.
- **Nothing here is machine-checked.** Every item is read-and-apply. A completed set of answers is
  a claim by whoever answered them.
