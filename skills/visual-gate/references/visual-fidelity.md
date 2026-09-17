# Visual fidelity — proving the page matches the design

Every other document in this set decides what the page should be. [design-source.md](../../design-ingestion/references/design-source.md) says where the
values come from. This one is the only one that asks whether the page you built is actually the one
those values describe — and it exists because that question has, until now, been answered by
looking.

Hand this file to whatever is going to claim a page is finished.

## Start here

**You are producing four things per route, per viewport, and a verdict per category.** Not a
percentage. Not "looks right". The verdict is `PASS` or `NEEDS WORK`, and section 7 says what makes
each category pass.

**The reason this document exists** is that reading the CSS is not verification and never was. A
page whose classes are correct, whose tokens came from the design, and whose review said "matches"
can still be wrong in every way that a person notices first: a container eight pixels narrower, a
heading wrapping after the wrong word, an icon that is a lookalike from an icon library, a font
that never loaded and is being rendered in the fallback. Every one of those survives a code review.
None of them survives a screenshot placed beside the reference.

**And it is not enough to look at the screenshot either.** Two renders that look the same to you
can differ by a section's height in a way that compounds down the page, and two that look different
can be identical except for antialiasing. So the loop is: capture both, compare the images, and
then measure the DOM — because the image tells you *that* something moved and only the DOM tells
you *what*.

**Three things this document does not do.** It names no library — the capture harness is yours to
write and section 3 is its specification. It does not tell you what the page should look like;
that is the design and [design-source.md](../../design-ingestion/references/design-source.md) says which one wins. And it cannot tell you a page is
good. A page can match its reference exactly and be a bad page.

## 1. The loop

Six steps, in this order, per route. It is the order that matters: every step after the first is
worthless if the step before it was skipped.

| # | Step | Produced |
|---|---|---|
| 1 | Capture the reference at a known width | `reference/` |
| 2 | Open the real route in a real browser at that same width | — |
| 3 | Capture it, under the conditions in section 3 | `current/` |
| 4 | Compare the images, then read the geometry | `diff/`, the geometry file |
| 5 | Correct what section 4 says is a difference rather than noise | — |
| 6 | Capture again and compare again | `final/` |

**Step 6 is not optional and is the one that gets dropped.** A correction is a claim about a
change; a capture after it is the only evidence the change did what you said. The commonest way
this loop produces a wrong `PASS` is a set of corrections applied confidently, and a `final/` that
is a copy of `current/` because nobody re-ran it.

**Repeat 4–6 until what remains is noise or is written down as accepted.** Not until the number
reaches zero — it never will, and section 4 explains why chasing it is how you end up making the
page worse to satisfy a rasteriser.

## 2. The viewport matrix

[browser-support.md](../../astro-craft/references/browser-support.md) decides which CSS you may write. It says nothing about how the page looks on a
small screen, deliberately and in its own section 8 — a page can be perfectly compatible and
unusable at 375 pixels. This is where that half is owned.

**Four widths minimum, and every one of them is a capture:**

| Width | Why this one |
|---|---|
| **375** | The narrow floor. Not the narrowest phone in the world; the narrowest anyone still designs for, and the width where a layout either reflows or breaks |
| **768** | Tablet portrait, and the width where a two-column grid has to decide what it is |
| **1440** | Desktop, and the width most references are drawn at |
| **The reference's own width** | Whatever the design was drawn at, when it is not one of the above. This is the only width where a difference is unambiguous, because it is the only one the reference makes a claim about |

**The other three are not comparisons, they are inspections.** A reference drawn at 1440 says
nothing about 375, so there is nothing to diff — what you are checking there is the list below,
and every item on it is a yes or a no.

At every width:

- [ ] **No horizontal scroll.** `document.documentElement.scrollWidth` is not greater than the
      viewport width. This one check catches more shipped defects than any other in this document,
      because a single over-wide element scrolls the entire page and looks like nothing on a
      desktop monitor.
- [ ] **Nothing is clipped or overlapping.** Text is not cut off, and two elements are not sitting
      on top of each other.
- [ ] **The layout is different rather than merely narrower.** A desktop grid squeezed to 375 is
      not a mobile layout; it is a desktop layout that fits.
- [ ] **The navigation works in both of its states.** Open it and capture it open. A mobile menu is
      a whole screen of layout that no other capture ever sees, and it is the single most common
      place a site ships something nobody looked at.

**What "reflows" means is not this document's call.** [visual-craft.md](../../astro-craft/references/visual-craft.md) owns how a page should look
and [accessibility.md](../../astro-craft/references/accessibility.md) owns whether it can be used. This section owns only that you looked, at
these widths, and wrote down what you saw.

## 3. The harness, and what it must guarantee

You are going to write this yourself, in whatever drives a real browser. **This section is the
specification it has to satisfy.** Not a suggestion: every requirement here is a way a capture can
be wrong while looking correct, and a capture that is wrong is worse than no capture, because the
diff it produces is then evidence for a conclusion nobody can trust.

### 3.1 The capture must be deterministic

Two runs of the same unchanged page must produce the same bytes. If they do not, every diff you
produce includes an unknown amount of your own noise, and section 4's judgement becomes impossible.

- [ ] **Viewport width AND height are set explicitly**, and the device pixel ratio is pinned. A
      default of 1 is fine; what is not fine is leaving it to whatever the machine has, because
      then the reference and the capture are at different scales and every measurement is off by a
      constant nobody notices.
- [ ] **Animations, transitions and the text caret are disabled.** A page with a fade-in has no
      settled state to capture, and a capture taken at an arbitrary moment during one is not
      reproducible. Inject a stylesheet that zeroes durations and delays and hides the caret.
- [ ] **Anything genuinely dynamic is masked or frozen** — a carousel on a timer, a live counter,
      a date. These will differ on every run, and a diff that always shows the same three regions
      is a diff people stop reading.

### 3.2 The page must actually be finished

This is the one that produces confident wrong answers, because a half-loaded page screenshots
perfectly well.

- [ ] **Wait for the network and the document to settle**, not for a fixed number of milliseconds.
      A sleep is a guess that is too long on your machine and too short on the runner.
- [ ] **Wait for `document.fonts.ready`.** Necessary and nowhere near sufficient: it resolves when
      font loading has *finished*, including when it finished by failing. A face that 404s, or that
      was declared at a weight the file does not contain, leaves the page rendering in a fallback —
      at a different width, with different line breaks — and it looks like a design decision.
- [ ] **Then prove each expected face individually with `document.fonts.load()`**, at the weights
      and styles the page uses, and **require a non-empty result whose every `FontFace` reports
      `status === "loaded"`.**

      ```js
      const faces = await document.fonts.load('700 16px "Inter"', 'Ag');

      if (faces.length === 0) throw new Error('no @font-face matches 700 Inter');
      if (faces.some((face) => face.status !== 'loaded')) throw new Error('Inter 700 did not load');
      ```

      **Do not use `document.fonts.check()` for this**, which is the trap inside the trap and the
      reason this bullet is long. `check()` answers "can this be painted without loading anything
      else", and for a family with **no matching `@font-face` rule at all** the answer is *yes* —
      the browser will paint it in a fallback and nothing further needs loading, so `check()`
      returns `true`. A misspelled family name and a stylesheet that never shipped both pass it.
      It is at its most confident precisely where the font is most absent. `load()` returns the
      matched faces, so an empty array is the missing rule saying so.

      **A capture whose fonts did not load is not evidence of anything.** Fail the run rather than
      diffing it.
- [ ] **Wait for images to decode**, not merely to load: `decode()` on each, or the equivalent. A
      decoded image is one that will paint; a loaded one may still be a blank box at the moment the
      shutter opens.
- [ ] **Scroll the page once, top to bottom, before capturing** if anything is lazy-loaded, then
      return to the top. Otherwise the full-page capture holds placeholders below the fold.

### 3.3 Full-page or viewport, decided once

- **Viewport-sized** captures for comparing against a reference frame, which is a fixed height.
- **Full-page** captures for the record, and for finding what is below the fold.

Whichever you choose, use the same one on both sides of every diff. Comparing a full-page capture
against a viewport-height reference produces a diff that is one hundred percent different and means
nothing.

### 3.4 The geometry file

The image says something moved. This says what.

For each of the page's structural elements — header, hero, each section, the cards inside a grid,
each image, the calls to action, the footer — record from the live DOM:

| From | What |
|---|---|
| `getBoundingClientRect()` | `x`, `y`, `width`, `height` |
| `getComputedStyle()` | `font-family`, `font-size`, `font-weight`, `line-height`, `padding`, `margin`, `gap`, `border-radius`, `color`, `background-color`, `object-fit`, `object-position` |
| `document.fonts` | which faces are loaded, at which weights |

Write it as JSON, one file per route and viewport, with a stable key order.

**Stable key order is not tidiness.** These files are compared against each other — before a
correction and after it, and one route's family against another's — and a serialiser that emits
keys in insertion order turns every comparison into noise. The same reasoning applies to rounding:
pick a precision and use it, because a browser will hand you `319.9999998` and a diff of that
against `320` is a difference nobody should ever be asked to read.

## 4. Reading a diff without lying to yourself

**A percentage is not a verdict.** It is a way to sort the routes you have not looked at yet.

Some difference is unavoidable, and none of it is your layout:

- the reference and the browser antialias text differently, so every glyph edge differs;
- images are rasterised and compressed differently by the two;
- an exported asset is not byte-identical to the one the browser draws;
- subpixel positioning differs by fractions that no CSS change can close.

**So chasing the number down is not rigour, it is the opposite.** Past a point, the only way to
reduce it is to stop matching the design and start matching the rasteriser — nudging a margin by a
pixel, forcing a font size that is not in the scale. That is a page made worse to satisfy a
measurement, and it is unwindable because nobody records why the odd value is there.

**What you actually read, in this order:**

1. **Do the sections start at the same `y`?** This is the first question because it is the one that
   compounds: a hero eight pixels too tall pushes everything below it, and the diff lights up the
   whole page for one cause.
2. **Do the main widths and heights match?** Containers, cards, images. From the geometry file, not
   from the picture.
3. **Does the text wrap in the same places?** Different wrapping is almost never a wrapping bug —
   it is a width, a font size, or a font that did not load, and it is the loudest available signal
   that one of those is wrong.
4. **Are the assets the right assets?** An icon that is a lookalike, an image with a different crop
   or `object-position`. [design-source.md](../../design-ingestion/references/design-source.md) section 4 owns this rule; here it is a thing to check.
5. **Is what remains rasterising noise?** If yes, say so, and say it where somebody can disagree
   with you.

**Write down the differences you accepted.** An accepted difference and an unnoticed one look
identical six weeks later, and only one of them is a decision. If the route is part of a batch with
a manifest, that is where it goes.

## 5. Evidence

One directory per project, and the layout is fixed so that a person who has never seen your project
can find the fourth file.

```text
.visual-audit/
  reference/<route>@<width>.png
  current/<route>@<width>.png
  diff/<route>@<width>.png
  final/<route>@<width>.png
  geometry/<route>@<width>.json
```

**Why four images and not two.** `reference` and `final` alone say the page matches. They do not
say it was ever different, which means they do not say the work happened — and a `final` that is
simply the first capture, taken before any correction, is indistinguishable from one taken after.
`current` and `diff` are what make the middle of the loop auditable.

**This directory is not build output and it is not a cache.** It is the record that the page was
checked. Decide deliberately whether it is committed: committing it makes a diff reviewable in a
pull request and makes the repository large, and both of those are true. What is not defensible is
deleting it and keeping the `PASS`.

## 6. Shared components

Most of a site's pages share a header, a footer, buttons and a grid. So a correction that fixes one
page is a change to every page that uses it, and the fix can be worse than the defect on a page you
did not open.

**The rule:**

- if the difference is specific to one page, correct it in that page's own markup;
- if the difference is global and the reference confirms it in more than one place, correct the
  shared component;
- **after touching anything shared, re-run this loop on at least one page from every group that
  uses it** — not one page in total, one per group.

**"Every group" needs a definition, and this document does not own it.** When the site is a batch
built from a manifest, the groups are its families and the pages to re-run are its representatives.
When it is not, you are choosing them by hand and should say which you chose.

## 7. What `PASS` means

`PASS` is claimed per category, and the categories are separate because they fail separately and
because a single word hides which one failed.

| Category | Passes when |
|---|---|
| **Structure** | Every section in the reference has a counterpart, every section built has a source, and they are in the same order |
| **Geometry** | The main widths, heights and starting positions match, or a difference is written down as accepted |
| **Typography** | The declared faces actually loaded at the weights used, and the text wraps where the reference wraps |
| **Assets** | Icons and images come from the design rather than from a lookalike, at the same crop |
| **Reference viewport** | The comparison at the reference's own width has been made and what remains is noise |
| **Responsive** | Section 2's checklist passes at every width in the matrix, nav open and closed |
| **Accessibility** | The pre-flight in [accessibility.md](../../astro-craft/references/accessibility.md) was run at this state of the page, including the keyboard pass |
| **SEO** | The checklist in [seo-page.md](../../static-site-seo/references/seo-page.md) section 10 was run against the built page |

**A category that does not apply is skipped and said out loud.** A category that applies and was
not checked makes the whole route `NEEDS WORK`. There is no partial pass, and the reason is
specific: a partial pass is read as a pass by everybody downstream, and the missing category is
never the one they assume.

**What you report per route:** the route, the reference it was compared against, its width, the
files under `.visual-audit/`, the differences found, the corrections made, the differences
accepted, and one verdict per category.

**Do not record a claim you cannot evidence.** "Compared against the design" in a handover, written
when nothing was captured, is worse than writing nothing, because the next reader stops checking.

## 8. What this document cannot do

- **It cannot tell you the page is good.** It compares a page to a reference. A faithful
  implementation of a bad design passes every category here.
- **It cannot tell you the reference is the right one.** Which input wins is decided before any of
  this runs, and [design-source.md](../../design-ingestion/references/design-source.md) owns it. Comparing against a stale frame produces a clean
  `PASS` for the wrong page, and nothing in this loop can see it.
- **It cannot see a state you did not capture.** Hover, focus, error, empty, loading, logged-in.
  Each is a screen, and this document only knows about the ones you opened.
- **It says nothing about behaviour.** A form that renders identically to its design and discards
  every submission passes every category in section 7.
- **It cannot make the noise floor zero**, and section 4 is the argument for why trying is a defect
  rather than diligence.
