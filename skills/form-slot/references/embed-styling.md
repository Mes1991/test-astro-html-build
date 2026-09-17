# Embed styling — the adapter's class contract

> **Opt-in provider recipe.** This contract describes styling an embedded form produced by a
> third-party form provider. It is an extension, not product core. The concrete class names are the
> adapter's; this canonical contract defines the obligations the host must satisfy.

This is the contract for styling an embedded form from the outside. Hand this file to whatever
writes the CSS.

## Start here

**The adapter owns the class contract.** The runtime emits a documented set of class names and
attributes; the host styles them. This canonical contract does not fix any concrete class name — it
states what the adapter must document and what the host must do.

**Before you write a line, read the adapter's styling-interface documentation and validate it
against the actual embed.** It must establish which of these surfaces exist, including absence:

- the rendered elements and any grouping or field wrappers, with their actual cardinality;
- the controls and any label, help-text or error surfaces;
- the available state signals and their meaning, whether classes, attributes or another interface;
- the per-type markup and supported styling hooks for the field types the form uses;
- the anti-spam field, if it has one and documents it as inline-styled — leave it as documented,
  whatever that turns out to be.

**What you are producing:** CSS that targets the adapter's documented classes. Where the adapter
documents building the DOM itself, treat that DOM as given: no JavaScript, no markup changes, only
styling it — confirm this scope in the adapter's own documentation rather than assuming it applies
to every case.

**Style the confirmed surfaces in three passes, skipping absent structures and states.** Each pass
is useful on its own, so stop whenever it looks right:

1. **Skeleton.** The form, row and field wrappers — the vertical rhythm and the side-by-side grid.
   This is where a form stops looking broken.
2. **Controls.** Labels, inputs, the submit button, focus rings. Match the host page's own inputs
   here — visitors notice a form that looks foreign more than one that looks plain.
3. **States and specials.** Invalid, errors, submitting, success, then only the types the form
   actually uses.

**Before you write a line, know these three:**

- **The help text's position relative to the control is the adapter's documented DOM order** — it
  may sit above the control, not below it. Read that order and reorder it yourself if the design
  disagrees.
- **Some types put their class on the control wrapper itself**, so a descendant selector matches
  nothing — confirm this per type in the adapter's documented markup rather than assuming a uniform
  shape.
- **Never set `display` on a field wrapper without pairing whatever attribute the adapter documents
  for hiding a field (commonly the `hidden` attribute).** Where conditional logic hides fields that
  way, your `display` beats it — the single most damaging mistake you can make here, because it
  reveals fields the visitor was never meant to see.

**The adapter must document whether it ships styles of its own.** Where it documents that it does
not — building the DOM, adding its classes, and stopping there — every visual decision is yours, and
nothing you write is competing with a default. The adapter must document any exception — for
example, an anti-spam field that is inline-styled off-screen and must stay that way. Confirm this in
the adapter's own documentation before assuming your sheet is starting from a blank slate.

Where the adapter documents scoping everything under the form's own class, a rule written for the
form cannot leak into the rest of the host page — confirm this in its documentation rather than
assuming it. Separately document and validate whether host resets, typography and inherited values
can reach the embed. A form-class selector alone does not establish the reverse boundary: inspect
any isolation mechanism and test the effective cascade. Account only for host rules confirmed to
reach the relevant surfaces; do not assume either isolation or leakage.

**One thing may need to sit outside the form's class: the thank-you box, if the adapter documents
replacing the form on a successful submission.** Where it does, the success element can have no form
ancestor, and any variable or descendant rule hung off that ancestor stops applying at the exact
moment the visitor most needs to see something. Confirm this replacement behaviour in the adapter's
documentation before assuming it.

## 1. What is data, and what is presentation

Read this before you decide where a change goes. Getting the line wrong is not a styling mistake —
it sends someone to re-import a schema when a stylesheet was the answer, or it puts a decision in
CSS that then disagrees with what the provider's builder shows.

| Capability to inventory | Boundary to document and validate |
|---|---|
| field identity, types, validation, choices and conditional behaviour | which are defined by the adapter's definition and which elsewhere, including unsupported capabilities |
| grouping, width, spacing, colour, typography and other visual decisions | whether the definition, host CSS, provider styles or another documented layer controls each decision |

**Inventory every definition-to-presentation coupling, including its absence.** Do not assume that
spacing is absent from the definition or that width is its only structural influence. Document and
validate the actual emitted hooks, supported overrides and precedence before choosing a layer.
Where confirmed hooks allow a host-only layout, that is an option, not a universal capability.

### So which layer does a layout decision go in?

The criterion is not "is it layout". It is this:

> A schema width, where the adapter documents emitting one, is not styling, it is **structure**:
> confirm whether it is the thing that makes the provider's preview show the same layout the live
> page shows. If the decision has to look the same on both sides, it belongs in the schema. If it
> is pure appearance, it belongs in the CSS and the definition is not touched.

For each proposed definition or CSS change, document and validate the update path and when it takes
effect. Establish whether it needs re-import, an in-place edit, publication, a host deploy or another
supported operation, including when no such operation exists. The existence of an import mechanism
does not establish that every later edit uses it, nor that a CSS change affects only the host.

### Do not use both layers at once

Where the adapter documents that a field's width declaration turns its row into a grid, writing your
own `grid-template-columns` on that row overrides it, and the form now has two layout systems on one
element with the winner decided by selector order — confirm the adapter's actual layout mechanism
before assuming this conflict applies. Pick a layer.

## 2. Where the sheet has to be loaded

**Choose loading scope from the actual adapter/host pair, not construction timing alone.** Document
and validate the rendered markup, any isolation boundary, the host's compiled selectors or class
mapping, and the hooks the adapter preserves. Runtime construction does not by itself establish
missing scope attributes, missing build-visible markup or a particular framework's styling model.

Compare selector matching on the stand-in and the real embed. If evidence shows that scoped rules
match only the stand-in, use a documented global loading path or supported escape hatch and validate
it on the real embed. If component-local styling works with the confirmed interface, do not rule it
out. A finished stand-in is not proof that the eventual embed receives the same rules.

Where evidence establishes a global loading need, document and validate the supported host loading
path. These are examples to check against the actual configuration, not universal framework rules:

| Host | Where the sheet goes |
|---|---|
| Astro | consider a layout/page CSS import or a documented global style escape; validate emitted selectors |
| Vue, Svelte, CSS Modules | consider a plain stylesheet or a supported global escape; validate the actual scoping/class-mapping mechanism |
| Next, Nuxt, SvelteKit | consider an app-level stylesheet or another supported global path; validate routing and loading rules |
| Plain HTML | consider `<link rel="stylesheet">`; validate loading and reach through the embed boundary |

**Target only documented and validated styling hooks.** For scoped styles, generated class names or
utility-based authoring, inspect the actual emitted CSS, available build inputs and adapter output.
Document whether each approach can reach the required surfaces, including supported configuration
or its absence. Do not infer incompatibility from runtime construction, or infer that a class on a
host ancestor does or does not affect descendants without checking the resulting rules.

## 3. The DOM

The adapter must document and validate its actual rendered structure: which elements and groupings
exist, their cardinality and relationships, and differences by field type. Record absent structures
as absent; do not assume one form, one row per definition row or one wrapper per field.

**Choose styling hooks by a documented stability contract.** Inventory any ids, classes, attributes
or other hooks, their purpose and lifetime across renders, updates and page instances. Validate the
claimed stability before relying on a hook; neither label-binding ids nor data attributes imply a
particular lifetime or styling guarantee. If no supported stable hook exists, report that limitation.

## 4. State

The adapter must document and validate which state signals exist, their representation and meaning,
including absent signals. Submitting, invalid, disabled, conditional and success are states to
investigate, not required classes or attributes. Section 5 governs motion for confirmed surfaces.

**Where the adapter documents disabling the submit button for the whole request, that in-flight
state is the one visitors complain about most.** On a slow connection a form with no in-flight
styling reads as a button that did nothing. Give it something — a spinner, a dimmed label,
`cursor: progress`.

**Where the adapter documents a redirect path on success, the thank-you box may appear there too**,
for the instant before the new page paints. Style it even on a form that redirects; it is not dead
code.

## 5. Animating state

First require the adapter to document and validate each relevant state surface's lifecycle: whether
it is retained, updated, hidden, replaced or newly inserted, and whether any container is cleared.
Record absent error or success surfaces as absent. Construction of a new node does not establish
that a list or mount was emptied. Choose motion only for confirmed surfaces; the following are
conditional CSS options, each `needs_validation` with the actual lifecycle and supported browsers:

| What | Mechanism | Why |
|---|---|---|
| A retained control with a confirmed style change | consider `transition` | validate that the before/after styles and state update provide the intended transition |
| A confirmed newly inserted message surface | consider `@keyframes` + `animation` | validate insertion-time motion; do not presume an errors list, clearing operation or universal transition failure |
| A confirmed success surface | choose from its documented lifecycle | validate motion for retention, replacement or insertion as actually observed; do not presume a newly emptied container |

Verify the intended motion on the real state update, not just the initial render. If the selected
technique has no observed effect, revise it against the confirmed lifecycle rather than inferring a
missing API or a container-clearing operation.

**The `prefers-reduced-motion` block is required, not a nicety.** A visitor who has asked their
operating system for less motion has usually done so for a reason that a form error — the moment
they are already frustrated — is the worst time to ignore. Ship the block even if you later remove
the motion: it guards whatever the next person adds without asking.

**Animating a container's height from `0` to `auto` `needs_validation` against this project's
ratified browser floor.** Some techniques for it need CSS features newer than what an unratified or
conservative floor allows a public form to serve. Until that floor is ratified with real evidence,
treat height animation on the errors list as unproven and animate the message element instead: the
container reflows around it and the result reads the same. If your project holds the HTML Utils set,
[browser-support.md](../../astro-craft/references/browser-support.md) owns the floor and the
reasoning behind it — read it for whatever the current ratified or pending floor actually is before
deciding.

## 6. Dark mode and tokens

The adapter's ready-made sheets may expose tokens; a hand-written sheet inherits nothing. Implement
`@media (prefers-color-scheme: dark)` yourself if the host page needs it.

## 7. Traps

- **Never set `display` on a field wrapper without handling whatever attribute or mechanism the
  adapter documents for hiding a field (commonly the `hidden` attribute).** Where conditional logic
  hides a field that way, any author `display` value beats it. Pair it.
- **Leave the anti-spam field alone.** Where the adapter documents one, it is typically positioned
  off-screen with inline styles, and a rule like `form input { position: static }` can drag it back
  into view where a visitor fills it in. The adapter must document what it does with a filled
  anti-spam field — confirm whether that produces a silent rejection before assuming it does.
- **Where the adapter documents a hidden-type field, confirm it stays `display: none`** in its own
  markup. Without that rule it would claim a grid track and show its help text — verify this is
  actually how the adapter renders that type before relying on it.
- **The adapter must document whether the file input is visually hidden inside its label.** Where it
  documents that it is, the styled dropzone is what the visitor sees, and un-hiding it gives you two
  controls. Where it documents otherwise, this trap does not apply — confirm before assuming it does.
- **Where the adapter documents a disabled field as deliberately staying on screen, never hide it.**
  A locked field visible that way tells the visitor the field exists and, by what it sits next to,
  what unlocks it. Signal the state — opacity, a muted label, `cursor: not-allowed` — and leave it
  visible; confirm this is the adapter's documented behaviour before assuming every disabled field
  works this way.
- **Choose message and success motion from the confirmed lifecycle, not a presumed transition
  failure.** For newly inserted surfaces, insertion-time animation is an option, `needs_validation`
  against the actual CSS and browsers; do not infer that every transition is impossible — section 5.
- **Where the adapter documents emptying the mount container and appending the thank-you box on its
  own, the success box may not be inside the form** by the time it exists. A descendant selector
  like `form .success` matches nothing in that case, and **custom properties declared on the form do
  not reach it** — declare your tokens somewhere both can read them, such as `:root`. Confirm this
  mount/replace behaviour in the adapter's documentation before relying on it.

## 8. A minimal sheet that looks intentional

### The rules a sheet written from scratch cannot omit

Where the adapter ships ready-made sheets, they typically carry defensive rules that have nothing to
do with how the form looks, and taking the from-scratch route drops all of them at once, silently.
Confirm which of these apply to your adapter's actual DOM and state model before treating this as a
fixed checklist; these are not styling. Whatever else your sheet does, check these:

| Rule | Without it |
|---|---|
| hide the empty errors list | every field carries a visible empty box from the moment the page loads |
| hide a field wrapper when the hidden attribute is set — required whenever you set `display` on it | conditional logic stops hiding anything, and fields the visitor was never meant to see are on screen |
| declare tokens where the success box can read them — `:root`, or a selector covering both | the thank-you box renders unstyled, at the one moment the visitor is looking straight at it |
| hide the empty file list, on a form with a file field | the same empty-box problem under the dropzone, before anything is picked |

The first is the one that fails on load, with nothing typed and nothing clicked — which is also why
nobody looks for it, where your adapter's DOM produces that empty box.

### Adorning a field with an icon

Check the adapter's documented schema for an icon key before assuming one exists — per section 1, if
there is none, this is presentation and it is yours. Two ways to write it are commonly wrong, and
both fail quietly:

- **`input::before` renders nothing.** An `<input>` is a replaced element and browsers do not paint
  generated content on one — this is general CSS guidance, `needs_validation` for the selected
  control and browsers, not proof of an adapter hook. Document and validate whether the adapter
  exposes a suitable adornment surface, including when no wrapper or supported hook exists.
- **A blanket wrapper rule can leak into composite types.** Where the adapter documents rating and
  address types using the control wrapper itself **as** the widget, a blanket rule drops your glyph
  inside the group. Confirm each type's documented markup and narrow the rule accordingly.

If a confirmed hook supports host-positioned adornments, validate its containing block and choose
positioning accordingly; a relatively positioned wrapper is only one possible arrangement. If an
icon font is used, validate font loading and visibility through the confirmed styling boundary;
follow section 2 only where its global-loading branch applies.

Then style the composite types only if the form uses them.
