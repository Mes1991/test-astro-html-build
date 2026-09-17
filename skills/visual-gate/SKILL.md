---
name: visual-gate
description: "Use when a built page has to be proved against a reference, or when its responsive behaviour has to be checked at all. Trigger it on 'pixel perfect', 'make it match the design', 'this does not look like the mockup', 'compare it against the Figma', 'check it on mobile', 'the layout breaks on a phone', a horizontal scrollbar, or before calling any page finished. Also use it to audit a site built without any of this, to decide whether a remaining difference is a real defect or rasterising noise, or after changing a shared header, footer, button or grid."
---

# Visual gate

## What this is

A workflow for proving a page is the page the design describes, and for checking it at widths
nobody drew. It tells you what to DO and in what order; the contracts tell you what is CORRECT.
**This file restates none of their rules** — two copies of a rule means one of them is wrong and
nobody knows which.

| Contract | Owns |
|---|---|
| `references/visual-fidelity.md` | the loop, the viewport matrix, the harness specification, the evidence layout, what `PASS` means |
| `../astro-craft/references/accessibility.md` | the accessibility category, including the keyboard pass no tool performs |
| `../static-site-seo/references/seo-page.md` | the SEO category, section 10 |
| `../astro-craft/references/browser-support.md` | which CSS the corrections are allowed to be written in |

Save the first two at minimum. A skill pointing at a contract nobody saved is a dead reference.

**This runs after the page is built and before anybody says it is finished.** It applies whatever
built the page.

## The rule this exists to enforce

**You may not claim a page matches anything you did not capture.** Not from the CSS, not from the
class names, not from having been careful.

The second rule follows from the first and is the one that gets broken quietly: **a correction is
not evidence.** Capture again afterwards.

## The workflow

### 0. Build the harness once, per project

Read `references/visual-fidelity.md` section 3 and write the capture code it specifies, in whatever drives a
real browser. It is one script, reused for every route.

**Every requirement in that section is a way a capture can be wrong while looking correct**, so
none of them is optional. The one that produces confident wrong answers is the font proof, and it
has two layers: `document.fonts.ready` also resolves when loading finished by *failing*, and
`document.fonts.check()` returns **true** for a family with no matching rule at all. Section 3.2
says what to do instead and why. Follow it literally rather than from memory — this is the
requirement most likely to be reconstructed as the wrong one.

**A run whose fonts did not load is failed, not diffed.**

### 1. Get the reference

The image the page is being compared against, at a known width, from the source
`../design-ingestion/references/design-source.md` established as authoritative. Save it under `reference/`.

**If there is no reference, say so and go to step 3.** A page with no design still gets the
responsive and accessibility categories, and that is a smaller claim honestly made rather than a
`PASS` implying a comparison nobody could have run.

### 2. Capture and compare at the reference's width

Open the real route, capture it under step 0's conditions, save `current/`, produce `diff/`.

Then **read the geometry, not the picture** — `references/visual-fidelity.md` section 4 gives the order:
section positions, then widths and heights, then wrapping, then assets, then whether the rest is
noise.

**The percentage sorts your work. It does not close it.** Section 4 also says why driving it to
zero makes the page worse.

### 3. Walk the viewport matrix

Every width in `references/visual-fidelity.md` section 2, and its checklist at each: no horizontal scroll,
nothing clipped, the layout genuinely different rather than merely narrower, and **the navigation
captured in both of its states.**

An open mobile menu is a whole screen of layout that no other capture sees, and it is the commonest
place a site ships something nobody looked at.

### 4. Correct, then capture again

Fix what step 2 called a difference rather than noise.

**Then re-run the capture and the diff, and save `final/`.** This step is the one that gets dropped,
and dropping it is how a set of confident corrections becomes a wrong `PASS` — because a `final/`
that is a copy of `current/` is indistinguishable from one taken afterwards.

**If you touched anything shared** — a header, a footer, a button, a grid — re-run this workflow on
at least one page from every group that uses it. Not one page in total. `references/visual-fidelity.md`
section 6 owns that rule.

### 5. Run the other two categories

The accessibility pre-flight, including the keyboard pass, and the `<head>` checklist. Both at this
state of the page, not at the state it was in before step 4.

### 6. Report per category

The route, the reference, the width, the files, the differences found, the corrections made, **the
differences accepted and why**, and one verdict per category from `references/visual-fidelity.md` section 7.

**There is no partial pass.** A category that applies and was not checked makes the route
`NEEDS WORK` — a partial pass is read as a pass by everybody downstream, and the missing category is
never the one they assume.

**Do not record a claim you cannot evidence.** "Compared against the design" written when nothing
was captured is worse than writing nothing, because the next reader stops checking.

## Auditing a site that grew without this

Do not start at page one and work forwards; you will spend the whole budget on the pages that
happen to be first.

1. Capture every route at the widths in the matrix, with no reference and no corrections. One pass,
   cheap, and it needs nothing from anybody.
2. Sort by the section 2 checklist — horizontal scroll first, since one over-wide element scrolls a
   whole page and is invisible on a desktop monitor.
3. Then run the full workflow on the worst, and on one page from each group.

**Report what you did not check.** An audit that names its own edges is usable; one that implies
completeness is worse than none.

## What this workflow does not prove

- **That the page is good.** A faithful implementation of a bad design passes every category.
- **That the reference is the current one.** Comparing against a stale frame produces a clean
  `PASS` for the wrong page and nothing in this loop can see it. `../design-ingestion/references/design-source.md` owns that
  question and it is answered before this runs.
- **Any state you did not capture** — hover, focus, error, empty, loading, signed-in.
- **Anything about behaviour.** A form that renders identically to its design and discards every
  submission passes every category here.
