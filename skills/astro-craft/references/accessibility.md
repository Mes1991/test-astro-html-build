# Accessibility — the contract for a page a person can actually use

This is what a static HTML page owes the people using it: reachable by keyboard, legible at
ordinary eyesight, announced correctly by a screen reader, and operable by someone whose hands
shake.

Hand this file to whatever writes the markup.

## Start here

**What you are producing:** markup that is correct before any assistive technology is involved.
Almost nothing here is an addition to a page — it is a choice between an element that already
works and one that has to be repaired afterwards.

**The target is WCAG 2.2 Level AA — and that is an engineering choice, not a citation.** Say it
that way, because the instruments that actually bind anyone currently point at **2.1** AA, and a
document implying otherwise invites somebody to treat a checklist as evidence of conformance:

- **EN 301 549 v3.2.1** is the harmonised standard behind the European Accessibility Act, and it
  incorporates **WCAG 2.1 AA** for web content.
- **The Accessibility Act names no version at all.** Directive 2019/882 states functional
  requirements in its Annex I; conformance is *presumed* through the harmonised standard rather
  than described by the directive.
- **The US Department of Justice's ADA Title II rule adopted 2.1 AA.** Private-sector claims settle
  against 2.0 or 2.1 AA far more often than 2.2.

Build to 2.2 regardless, for one reason that costs almost nothing: **2.2 contains 2.1.** It adds
nine criteria and withdraws exactly one — 4.1.1 Parsing, removed as obsolete — so a page meeting
2.2 AA meets 2.1 AA. Nine extra criteria now is cheaper than a re-audit when EN 301 549 **v4.1.1**
moves the harmonised standard to 2.2, which secondary sources as of August 2026 expect to be cited
in the Official Journal around the end of that year. Confirm that date before relying on it; it has
moved before.

**None of this is a compliance claim, and this document cannot be used as one.** See section 10.

AAA is not the goal; it contains criteria that are unreasonable for a general-audience site.

**Three things carry more weight than the rest**, because each one breaks a page for a whole class
of visitor rather than degrading it:

1. **Native element before ARIA.** A `<button>` is focusable, activates on Enter and Space,
   announces its role and is in the tab order. `<div role="button">` has one of those four, and you
   are writing the other three by hand.
2. **Everything reachable and operable by keyboard.** Not "most things". A control a mouse can
   reach and a keyboard cannot is a control some people simply do not have.
3. **Focus has to be visible.** Removing the outline because it looked untidy is the single most
   common accessibility failure on a designed site, and it is invisible to the person who did it.

**What is NOT here, because another contract owns it:**

| Rule | Owner |
|---|---|
| One `<h1>`, heading levels that form an outline, `lang`, `alt`, descriptive link text | [seo-page.md](../../static-site-seo/references/seo-page.md) section 5 |
| What motion is for, and how long it lasts | [visual-craft.md](./visual-craft.md) section 7 |
| Colour choices themselves — how many, and which | [visual-craft.md](./visual-craft.md) section 6 |
| Which CSS and JS features you may write at all | [browser-support.md](./browser-support.md) |

Those overlap this subject and are stated once, there. This file states the accessibility
requirement and links; it does not restate the rule.

---

## 1. The skeleton: landmarks

Every page gets the same five regions, and they are elements rather than classes:

```html
<header>   <!-- site header. One per page, outside <main>. -->
  <nav aria-label="Main">…</nav>
</header>
<main id="main">…</main>          <!-- exactly one, and it holds the page's own content -->
<aside>…</aside>                  <!-- optional: related, not primary -->
<footer>…</footer>                <!-- site footer, outside <main> -->
```

A screen reader user navigates by these regions the way a sighted visitor scans a layout. A page
built from `<div class="header">` and `<div class="content">` has no regions, so that navigation
does not exist and the only way through the page is top to bottom, every time.

**Exactly one `<main>`.** It is what "skip to content" skips to, and what "read the main content"
reads.

**Name a landmark when there is more than one of its kind.** Two `<nav>` elements are
indistinguishable until they carry `aria-label="Main"` and `aria-label="Footer"`. One `<nav>` needs
no label — the label is the region's own name, and "Main navigation navigation" is what a redundant
one produces.

### The skip link

First focusable element in the document, hidden until focused:

```html
<a class="skip" href="#main">Skip to content</a>
```

```css
.skip { position: absolute; left: -9999px; }
.skip:focus { left: 0; top: 0; z-index: 100; }
```

Without it, every keyboard visitor tabs through the entire header and navigation on **every page**
before reaching anything they came for. Use `left: -9999px` rather than `display: none` or
`visibility: hidden`: those two remove the element from the tab order, so the link can never be
focused and never appears.

## 2. Everything works from the keyboard

**Every interactive control must be reachable with Tab and operable with Enter, or Space, or both.**
The way to get this is not to implement it — it is to use the element that already has it:

| Doing this | Not this |
|---|---|
| `<button type="button">` | `<div onclick>` |
| `<a href="…">` | `<span onclick>` with a router call |
| `<input type="checkbox">` | a styled `<div>` with a tick glyph |
| `<details><summary>` | a hand-built accordion |
| `<dialog>` | a `<div>` with `position: fixed` |

A `<div>` with a click handler is invisible to Tab, silent to a screen reader, and does nothing on
Enter. Fixing it takes `tabindex="0"`, `role="button"`, a keydown handler for Enter **and** Space,
and `aria-pressed` if it toggles — four things to write, four things to get wrong, replacing an
element that needed none of them.

**Never use a positive `tabindex`.** `tabindex="1"` does not mean "first"; it means "before every
element that has no tabindex at all", which reorders the entire document from that point. Only two
values are ever correct: `0` (put this in the natural order) and `-1` (focusable by script only,
not by Tab).

**Tab order follows DOM order.** Reordering visually with `order`, `grid-area` or
`flex-direction: row-reverse` does not move focus, so a visitor tabs in one sequence and reads in
another. If the visual order matters, change the DOM.

**Anything that opens must close with Escape**, and focus must return to whatever opened it. A
dialog that traps focus without an escape route is worse than one that never trapped it — the
visitor is stuck on the page with no way back.

## 3. Focus has to be visible, and not covered

**Never write `outline: none` without replacing it in the same rule.** This is the failure that
looks like tidiness:

```css
/* Wrong. The page still works with a mouse, which is why nobody notices. */
:focus { outline: none; }

/* Right: keyboard focus is loud, a mouse click is not. */
:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

`:focus-visible` is the whole reason the shortcut above was ever tempting. It applies when the
browser judges the focus should be indicated — keyboard, generally — and not on a mouse click. So
the ring appears for the people who need it and stays out of the way for everyone else. It needs no
fallback at the support floor.

**The indicator needs 3:1 contrast against what is behind it**, or it is decoration. A grey ring on
a grey button is the same as no ring.

**Do not let anything cover the focused element** — WCAG 2.2 **SC 2.4.11 Focus Not Obscured
(Minimum)**, Level AA. A sticky header is how this happens: the visitor tabs down, the focused
control scrolls under the bar, and the ring is behind it. `scroll-padding-top` on the scrolling
element, matching the header's height, fixes it in one line.

## 4. Targets big enough to hit

**24 × 24 CSS pixels minimum for anything clickable** — WCAG 2.2 **SC 2.5.8 Target Size
(Minimum)**, Level AA. The target is the hit area, not the ink: a 16-pixel icon inside a button
with padding passes; the same icon as a bare link does not.

This is a motor-control criterion, not a phone one. It is the difference between a form someone
with a tremor can complete and one they abandon.

Two shapes that fail it in practice: icon-only buttons sized to their glyph, and footer link lists
so tightly leaded that each link's box is under 24 pixels tall. The exceptions the criterion allows
— inline links in a sentence, targets spaced far enough apart, sizes the browser controls — cover
most of what looks like a violation and is not.

**Anything achievable by dragging needs a single-pointer alternative** — **SC 2.5.7 Dragging
Movements**, Level AA. A carousel that only swipes needs buttons.

## 5. Contrast

| Content | Minimum | Criterion |
|---|---|---|
| Body text | **4.5:1** | SC 1.4.3, AA |
| Large text — 24px, or 18.66px bold | **3:1** | SC 1.4.3, AA |
| UI component boundaries, icons carrying meaning, focus indicators | **3:1** | SC 1.4.11, AA |

Measured against the actual background. Text on a photograph is measured against the darkest and
lightest pixels it crosses, which is why a hero headline needs a scrim rather than a hope.

**Placeholder text is text.** The grey that ships by default in every browser is around 2.8:1 and
fails. If a placeholder carries meaning, it needs the same 4.5:1 as anything else — and see section
6, because it should not be carrying meaning at all.

**Colour may never be the only signal** — SC 1.4.1, Level A. A red border on an invalid field says
nothing to the eight percent of men who cannot see it. Add the word.

Which colours a project has is [visual-craft.md](./visual-craft.md) section 6's decision. This is the
floor every one of those choices has to clear.

## 6. Forms

A form is where an inaccessible page stops being inconvenient and starts costing the business
money, because the visitor cannot complete the one action the page exists for.

**Every control has a `<label>` bound to it**, by `for`/`id` or by wrapping:

```html
<label for="phone">Phone</label>
<input id="phone" name="phone" type="tel" autocomplete="tel">
```

**A placeholder is not a label.** It disappears the moment someone types, taking the only
description of the field with it — and it is unreadable before that at the default contrast. A
design showing only grey text inside each box still gets a real label; hide it visually if the
design requires, using the same off-screen technique as the skip link. Never `display: none`, which
takes it from the screen reader too.

**Type and `autocomplete` are accessibility features**, not conveniences. `type="tel"` gives a
phone keypad; `autocomplete="tel"` lets a browser fill it. SC 1.3.5 (Identify Input Purpose, AA)
asks for the autocomplete token on fields collecting the visitor's own information, and it is the
difference between a two-tap form and a two-minute one for someone typing with a stylus.

**Errors are identified in words, next to the field** — SC 3.3.1, Level A. Bind the message with
`aria-describedby`, mark the field `aria-invalid="true"`, and put the text where the field is, not
in a summary at the top that the visitor has already scrolled past.

**Do not ask for the same information twice** — SC 3.3.7 Redundant Entry, Level A, new in 2.2.
Re-typing an address already given in the same session is a barrier for anyone with a memory or
motor impairment, and an abandonment for everyone else.

## 7. Motion

**Honour `prefers-reduced-motion`.** It is a system setting, it has been available across browsers
since January 2020, and a visitor who has turned it on has usually done so because motion makes
them ill:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

A near-zero duration rather than `none`: transitions that fire a `transitionend` handler still
fire, so nothing that depended on the event silently stops working.

**Nothing that moves for more than five seconds may be unstoppable** — SC 2.2.2, Level A. An
auto-advancing carousel needs a pause control, or it needs to not auto-advance.

What motion is FOR, and how long it should last when it is allowed, belong to
[visual-craft.md](./visual-craft.md) section 7.

## 8. ARIA, and why you will rarely need it

**The first rule of ARIA is not to use it.** Every attribute here is a promise that you have
implemented a behaviour the browser would have given you, and a wrong ARIA attribute is worse than
none — it overrides what the browser correctly reported.

The handful worth knowing, because they solve problems native HTML does not:

| Attribute | For |
|---|---|
| `aria-label` | naming a landmark or an icon-only control that has no visible text |
| `aria-describedby` | binding a hint or an error message to the control it belongs to |
| `aria-current="page"` | the current item in a navigation list |
| `aria-expanded` | a control that shows and hides something — on the control, not on the panel |
| `aria-live="polite"` | a region announcing a change the visitor did not trigger directly |
| `inert` | a subtree that is neither focusable nor reachable, in one attribute |

Two traps worth naming:

- **`aria-hidden="true"` does not remove anything from the tab order.** A focusable control inside
  an `aria-hidden` subtree can still be tabbed to and is then announced as nothing at all — the one
  combination the specification forbids outright. `inert` is what people reach for `aria-hidden` to
  do: it removes the subtree from the accessibility tree **and** from focus, together.
- **`role` on an element that already has one** replaces it. `<button role="link">` is a button that
  claims to be a link and behaves like neither.

## 9. Checking it

Two of these are automated and one is not, and the third finds more than the other two together.

1. **A browser audit** — Lighthouse's accessibility category, or axe DevTools. It catches contrast,
   missing labels, missing `alt`, broken ARIA references. Fast, and it is a floor: an automated pass
   detects roughly a third to a half of real barriers, and a perfect score means nothing about the
   other half.
2. **The keyboard**, on every page, before calling it done. Put the mouse down. Tab from the top:
   can you reach every control, in the order you read them, seeing where you are at every step? Can
   you close what you opened with Escape? Anything that fails this is a barrier, whatever the audit
   said.
3. **Zoom to 200%** and read the page — SC 1.4.4, Level AA. Fixed pixel heights and text in images
   fail here and nowhere else.

**Do not validate HTML for accessibility reasons.** SC 4.1.1 Parsing was **removed** in WCAG 2.2 —
it is obsolete, not merely deprecated, because browsers recover from the errors it described. Advice
telling you to run a validator for a11y conformance predates that and is wrong.

## 10. What this document cannot do

- **It cannot tell you the page is usable.** Every rule here is mechanical. A page can satisfy all
  of them and still be incomprehensible, and no criterion catches a label that is technically bound
  and semantically meaningless.
- **It is not a legal opinion, and satisfying it is not conformance.** This file covers a static
  content page. An obligation — the European Accessibility Act, a national implementation, ADA
  Title II or III, a procurement clause — attaches to a *product or service*, is scoped by rules
  this document does not cover, and is assessed against the standard version that jurisdiction
  actually cites, which as of now is generally WCAG 2.1 AA rather than 2.2. Whether a specific site
  meets a specific obligation is a question for someone qualified to answer it. Every ticked box
  here is engineering evidence, not a conformance statement.
- **Nothing here is enforced by a script.** Set two of these documents has no checker and never
  will. A ticked checklist is a claim by whoever ticked it.
- **It covers a static content site.** Rich widgets — a combobox, a tree, a data grid — have
  authoring patterns of their own that this file does not reproduce. If you are building one, you
  are past what this document covers.
