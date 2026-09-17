# Visual craft — the anti-default contract

## Start here

A generated interface is recognisable on sight, and not because any single choice in it is wrong.
It is recognisable because **nothing in it was chosen**. Asked for a landing page with no further
instruction, any capable generator produces the statistical middle of everything it has seen:

- a centered hero, one heading, one subheading, two buttons
- three equal cards below it, each an icon, a title and two lines
- one accent colour, applied to every interactive thing indiscriminately
- the same corner radius on every element on the page
- a soft shadow under every card
- the same vertical padding on every section
- a violet-to-blue gradient somewhere

Every item on that list is defensible in isolation. All of them together is what "generic" means, and
a reader recognises it in under a second — which is the whole problem, because it is read as *nobody
worked on this* long before anything on the page is evaluated.

This document does not supply taste. It removes the defaults, and it forces the decisions the
defaults were standing in for.

| This document owns | It does not own |
|---|---|
| the visual decisions, and the requirement that they be written down | where the code lives — [astro-structure.md](./astro-structure.md) |
| type scale, spacing, colour, radii, motion | font loading and Core Web Vitals — [seo-page.md](../../static-site-seo/references/seo-page.md) |
| what the page looks like | the document outline and heading semantics — [seo-page.md](../../static-site-seo/references/seo-page.md) |

## 1. The one rule everything else follows from

**A default is not a decision.**

Every value on a page — each size, each space, each radius, each duration — is either a value someone
chose and recorded, or a value that arrived because it was the first thing that came out. The second
kind is what makes a page look generated, and there is no way to tell the two apart by looking at the
result. Which is why the requirement is not "make good choices". It is:

> Before any styling is written, the decisions in sections 2 and 3 exist in a file at the project
> root named `DESIGN.md`, in the repository, committed.

Not documentation for its own sake. It is what makes page four match page one, and what lets the next
person — or the next session — extend the design instead of averaging it back toward the middle.

## 2. Three dials, set before anything is styled

Set these first, in `DESIGN.md`, as three lines. They are the difference between a brief and a shrug,
and they are what a generator has to be told because it will otherwise pick the middle of each.

**`VARIANCE` — how far the layout departs from a symmetric grid.**

| | Means |
|---|---|
| 1 | Symmetric, predictable. Equal columns, centered headings. Correct for documentation, dashboards, anything read repeatedly. |
| 2 | Mostly symmetric, one deliberate break per page. |
| 3 | Asymmetric by default: unequal splits, offset images, sections that do not share an alignment. |
| 4 | Editorial. Overlap, elements crossing grid lines, text set against the expected margin. |
| 5 | The layout is the subject. Justified only when the site's job is to be looked at. |

**`DENSITY` — how much sits in a given area.**

| | Means |
|---|---|
| 1 | Generous. One idea per screen, large type, wide margins. A product with one thing to say. |
| 2 | Comfortable marketing default. |
| 3 | Informational. Tables, specifications, comparison — reading, not scanning. |
| 4 | Dense by requirement: an application interface where scrolling costs the user something. |
| 5 | Terminal-grade. Only when the audience is expert and daily. |

**`MOTION` — how much moves.**

| | Means |
|---|---|
| 0 | Nothing animates except what the browser does natively. Always a valid answer. |
| 1 | State only: hover, focus, open, close. |
| 2 | State, plus one entrance per section, once. |
| 3 | Motion carries meaning — sequenced entrances, scroll-linked transitions. Needs a reason in writing. |

Three integers. Written down, they constrain every later choice; unwritten, every later choice
resets to the middle.

## 3. Decide the scales once, and never use a value outside them

A scale is a closed set. Its value is not that the numbers are beautiful — it is that a value **not
in the set is immediately identifiable as a mistake**, by a person or by a review. Open-ended values
are how a page ends up with `padding: 22px` next to `padding: 24px`.

| Scale | The decision | The limit |
|---|---|---|
| Type | one ratio, and the steps it generates | 6 steps. A seventh means two of them are doing the same job. |
| Spacing | one base unit, and its multiples | 7 values. Nothing between them, ever. |
| Radius | the values, plural at most two | 2. One for controls, one for containers — or one for everything. |
| Shadow | the values | 2. One resting, one raised. A third is a lighting model nobody is maintaining. |
| Colour | one neutral ramp, one accent | see section 6 |
| Border width | one value | 1. A second weight is a decision that pays for nothing. |

Recorded as tokens in one stylesheet, which [astro-structure.md](./astro-structure.md) requires be the
only place these values appear:

```css
:root {
  /* Type: 1.25 ratio from 1rem. Six steps, no more. */
  --text-xs: 0.8rem;
  --text-sm: 0.9rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.953rem;
  --text-2xl: 3.052rem;

  /* Spacing: 4px base. Seven values. Nothing in between. */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Two radii, two shadows, one border. */
  --radius-control: 6px;
  --radius-container: 14px;
  --shadow-rest: 0 1px 2px rgb(20 35 28 / 0.06);
  --shadow-raised: 0 8px 24px rgb(20 35 28 / 0.12);
  --border: 1px;
}
```

Note the jump between `--text-lg` and `--text-xl`. That gap is deliberate and it is the single most
useful thing on this list: a type scale with evenly spaced steps produces a page where nothing is
clearly a heading, so everything gets bolded to compensate. **Hierarchy comes from the gaps, not
from the weights.**

## 4. Typography, where a generic page announces itself first

- **Measure: 60 to 75 characters.** Set it with `max-width: 65ch` on the text container, not with a
  pixel width that changes meaning at every font size. A full-window paragraph is the most common
  single defect on a generated page, and it makes body text physically harder to read.
- **Line height moves inversely to size.** Body copy 1.5 to 1.7; a large heading 1.05 to 1.2. One
  line-height applied to everything leaves headings looking spaced apart and body text cramped.
- **One weight jump.** Pick two weights — a text weight and a strong weight — and use only those.
  Three or more weights is what a page reaches for when its type scale has no gaps, so fix section 3
  instead.
- **Negative letter-spacing on display sizes only**, roughly `-0.02em` above 2rem. At body size it
  reduces legibility for no gain, and applying one tracking value globally is a tell.
- **At most two families**, and a real fallback stack. One family is a perfectly good answer.
- **Loading and layout stability are not this document's.** `font-display`, preloading and the
  layout-shift consequences belong to [seo-page.md](../../static-site-seo/references/seo-page.md), and are a requirement there, not a
  refinement.

## 5. Layout: earn the symmetry

Three equal columns is the mean. It is not banned — at `VARIANCE 1` it is the right answer — but at
2 and above it has to be the choice rather than the fallback.

What to reach for instead, all of which survive a narrow viewport by collapsing to one column:

| Instead of | Try |
|---|---|
| three equal cards | an unequal split, `2fr 1fr`, with the primary item carrying more content |
| a grid of identical tiles | one item spanning two tracks, the rest single — the span states which matters |
| every section centered | alternate the alignment; let one section start at the text margin instead of the page margin |
| the same padding on every section | vary the vertical rhythm — a dense section next to an open one is what creates pace |
| a full-bleed image band | an image that breaks one grid line, so the layout acknowledges it |

**The hard limit:** at most **one** full-width centered-text section per page. A page where every
section is centered has no structure, only a sequence, and the reader has nothing to navigate by.

## 6. Colour

- **One accent, doing one job.** The accent means "this is the action". The moment it also marks
  headings, icons, borders and active states, it means nothing, and the actual action stops being
  findable.
- **Do not use a brand colour at its raw mid-tone and call it done.** A usable accent needs at least
  a resting value, a hover value and a text-on-accent value that clears contrast. Three values, chosen.
- **Neutrals are a decision too.** Pure grey is the default that reads as unfinished. Tint the ramp
  toward the accent's hue, even slightly, and the page reads as one design instead of a coloured thing
  on a grey thing.
- **Contrast is a requirement, and the numbers belong to [accessibility.md](./accessibility.md).** So
  does the rule that colour may never be the only signal. Both are stated there, once, as the
  criteria they are. What this document adds is that no `VARIANCE` level relaxes either: a palette
  that fails them is not a bolder choice, it is a broken one, and the dial does not reach that far.
- **Test both schemes, or commit to one.** A `prefers-color-scheme` block that was never opened in
  the dark is worse than no dark scheme at all.

## 7. Motion has a job or it does not exist

Three jobs are legitimate. Anything else is decoration that costs battery and attention:

1. **Response to input** — the element acknowledges a hover, focus, press or drag.
2. **Continuity** — something appears, moves or leaves, and the motion says where it came from or
   went, so the reader does not have to re-find the page.
3. **Entrance, once** — a section arrives on first view. Once, on first view, and never again on the
   same visit.

| | Value |
|---|---|
| Input response | 100–150ms, `ease-out` |
| Continuity, entering | 200–300ms, `ease-out` |
| Continuity, leaving | 150–200ms, `ease-in` |
| Anything above 400ms | needs a written reason |

**Animate `transform` and `opacity`.** Animating `width`, `height`, `top`, `left` or `margin` forces
layout on every frame; the animation stutters on exactly the devices that can least afford it.

**Reduced motion is a hard requirement**, not a courtesy. Omitting it causes real symptoms — nausea,
disorientation — in real readers. The block to ship, and why it uses a near-zero duration rather
than `none`, is section 7 of [accessibility.md](./accessibility.md). It is not repeated here: this document had its own
copy until it was removed, and the two had already drifted a line apart.

The one thing this document adds is when it applies here.
At `MOTION 0` this block is still correct to ship: it costs nothing when there is no motion to
suppress, and it guards whatever the next person adds without asking.

## 8. The bans

These are not matters of taste. Each is a specific pattern that identifies a page as unconsidered.

**Layout and style:**

- The full set from the top of this document appearing together on one page.
- A violet-to-blue gradient, on anything. It is the single most recognisable marker of a generated
  interface, and the same is true of any gradient chosen because a flat colour felt insufficient.
- The same radius on every element, and a shadow on every container.
- Icons that are emoji characters. Either a real icon set or no icons.
- Frosted-glass panels used as a default surface treatment rather than because something is above
  something else.
- Repeating one card shape — icon, title, two lines — three times as the answer to "explain the
  features".

**Copy shipped on the page:**

- **Em dashes as a rhythm device.** In generated marketing copy they cluster at a rate no human
  writer produces, and readers now recognise it. Use a comma, a colon, or a full stop. (Technical
  prose, including this document, is a different genre with a different convention — the ban is on
  the copy the page ships, where it is a tell.)
- The vocabulary that survives no editing: *seamlessly*, *elevate*, *unlock*, *empower*,
  *in today's fast-paced*, *we believe that*, *the future of*.
- Three adjectives where one would do. *Fast, simple and powerful* says nothing three times.
- A heading that is a category rather than a claim. "Our Features" is a label; "Three lines of CSS,
  no build step" is a heading.

**Placeholders that reached production:**

- Lorem ipsum, "Company Name", "Your text here" — any of them shipped is the loudest possible signal
  that nobody read the page before publishing.
- Hotlinked stock photography, and a row of stock portraits presented as a team or as testimonials.

## 9. Pre-flight

Before calling a page done. Each of these has a factual answer or the work is not finished — "it
looks good" is not an answer to any of them:

- [ ] `DESIGN.md` exists and states `VARIANCE`, `DENSITY` and `MOTION` as integers
- [ ] every size, space, radius, shadow and colour on the page is a token from section 3
- [ ] the type scale has visible gaps, and hierarchy survives with all weights set to normal
- [ ] no text container is wider than about 75 characters
- [ ] at most one full-width centered-text section
- [ ] the accent colour marks actions and nothing else
- [ ] body text clears 4.5:1, and every control boundary clears 3:1
- [ ] no state is communicated by colour alone
- [ ] every animation has one of the three jobs from section 7, and the reduced-motion block is present
- [ ] nothing from section 8 is on the page
- [ ] the page was opened at 375px wide, and the layout is different rather than merely narrower —
      **this is the floor, not the check**: [visual-fidelity.md](../../visual-gate/references/visual-fidelity.md) section 2 owns the full matrix,
      including the horizontal-scroll test and the navigation opened

## 10. What this document cannot do

It cannot give a page taste, and it will not turn a weak idea into a good design. What it does is
narrower and worth being honest about: it removes the choices that get made by default, so what
remains has to be decided by someone.

Two consequences follow, and both matter:

- **A page can satisfy every rule here and still be bad.** Nothing in a checklist produces a good
  idea.
- **A page can break a rule here deliberately and be excellent.** The requirement was never
  conformity — it is that the departure was chosen, and written in `DESIGN.md` so the next page knows
  about it. A rule broken on purpose and recorded is design. The same rule broken because nobody
  looked is the thing this document exists to stop.
