# Browser support — what you may write once the floor is ratified

> **needs_validation** — This contract proposes Safari 15.5 as a candidate floor and would exclude
> Tailwind 4 at that floor. The repository's product core uses Tailwind 4. No one has validated the
> combination
> (Safari 15.5 + Tailwind 4 + the rest of the stack) against real devices. Do not treat the two as
> compatible or incompatible until a human decision or real test evidence exists. This note records
> the conflict; it does not resolve it.

Every other document in this set decides what the page should be. This one describes which language
you may write in once the candidate floor is ratified — the floor is `needs_validation` until a human
decision or real device evidence exists, and nothing here permits treating Safari 15.5 and Tailwind 4
as compatible.

Hand this file to whatever writes CSS or JavaScript.

## Start here

**The proposed floor (pending validation — see the note at the top):**

| Browser | Minimum |
|---|---|
| **Safari / iOS** | **15.5** |
| **Chrome / Edge** | **102** |
| **Firefox** | **112** |

**Safari is the only one of the three that is a real constraint**, and understanding why is the
whole point of this document. Chrome and Firefox update themselves; a visitor running an old one
is running an abandoned installation, and there are almost none. Safari's version is welded to the
operating system, and the operating system is welded to the hardware. An iPhone 7 or an iPad Air 2
stops at iOS 15 and will never see iOS 16 — those devices are in daily use, and disproportionately
by the older, less technical visitor a local services business most wants to reach.

So the proposed floor is not a guess about "old browsers". It is one specific decision, **pending
validation**: if ratified, this site works on a phone that can no longer be updated.

**Why 15.5 exactly, and not lower.** It is where `inert` landed, and `inert` is required by the
accessibility rules for anything a visitor must not reach. Going below the floor means writing that
behaviour by hand, everywhere, forever. Going below also costs `:focus-visible`, `aspect-ratio` and
flexbox `gap`, each of which has no fallback worth writing.

**What it would cost.** `:has()`, `color-mix()`, container queries, CSS nesting, `@property`, `subgrid`,
`text-wrap: balance` and the `dvh` unit are all above this line. So is **Tailwind 4**, which
requires Chrome 111 and Safari 16.4 — see section 6.

**The one rule, if the floor is ratified:** before using a feature, look up all three floor versions.
If any one is above the line, either do not use it, or put it behind `@supports` with a version that
works without it.

**Changing the floor is a project decision, not a per-file one.** Section 7 says where it is
written down. A page that quietly assumes a different floor from the one declared is the failure
this document exists to prevent, because it does not produce an error — it produces a blank space
on somebody's phone.

---

## 1. The trap: "Baseline" is not the test

This is the mistake to get out of the way first, because it looks like diligence.

A feature is **Baseline Newly available** the day it is interoperable across Safari, Firefox,
Chrome and Edge. It becomes **Baseline Widely available** 30 months later. Both statuses are shown
on MDN and both are tempting to read as "safe".

Neither answers the question this contract asks. As of this writing, *Widely available* means the
feature crossed into interop around **February 2024** — nearly two years above this floor. A
feature can be Widely available, carry a green badge, be recommended everywhere, and render nothing
on an iPhone this contract covers.

**If the floor is ratified, the test is the version numbers, all three of them, against the table above.** Nothing else.

## 2. What the proposed floor would give you, once ratified

**Still `needs_validation`** — this list describes what the proposed floor in section 0 would make
available if it is ratified; none of it is a statement that the floor is settled. Enough to build a
modern site without fighting anything. This is a floor, not a hair shirt:

- **Custom properties**, and therefore the whole token sheet
  [visual-craft.md](./visual-craft.md) asks for.
- **Grid** and **flexbox**, including `gap` in flexbox.
- **`clamp()`, `min()`, `max()`** — fluid type and spacing with no media queries.
- **`:is()` and `:where()`** — the selector grouping that keeps specificity flat.
- **`@layer`** — cascade layers, which is the specificity escape hatch people reach for nesting to
  avoid.
- **`aspect-ratio`** — no more padding-top percentage hacks.
- **`position: sticky`**, `scroll-behavior`, `scroll-padding`.
- **`:focus-visible`** and **`inert`** — the two the accessibility contract depends on.
- **`prefers-reduced-motion`**, interoperable since January 2020.
- **JavaScript through ES2022**: optional chaining, nullish coalescing, top-level `await`,
  `Object.hasOwn`, `Array.prototype.at`, `structuredClone`.

If a design cannot be built with that list, the problem is not the floor.

## 3. Reaching past the floor

**Still `needs_validation`** — the technique below is general practice, independent of where the
floor ends up; it does not make the proposed Safari 15.5 / Tailwind 4 floor in section 0 ratified.
Two ways, and only two.

**`@supports`, with a fallback that stands on its own.** Write the working version first,
unconditionally, then upgrade:

```css
/* Works everywhere at the proposed floor (pending validation — see the note at the top). */
.card { background: #1f2a24; }

/* Better where it exists. Nothing breaks where it does not. */
@supports (background: color-mix(in oklab, black, white)) {
  .card { background: color-mix(in oklab, var(--ink) 92%, var(--accent)); }
}
```

The order matters and it is the part people invert. A fallback written **after** the enhancement,
or inside `@supports not (…)`, means every browser parses both and the older one gets whichever
rule the cascade happens to hand it. Fallback first, always — this ordering rule holds regardless of
where the floor ends up.

**Or: do not use it.** This is the answer more often than it looks. `:has()` usually means a class
the markup could have carried; `color-mix()` usually means one more token in the sheet; a container
query usually means the component was placed in too many different widths to begin with.

**What would never be acceptable once a floor is ratified:** using a feature above it and hoping. A
visitor at that floor would not get a degraded version — they would get an unstyled block, a
transparent element, or a script that throws on the first line and takes the rest of the page's
behaviour with it. Until ratification, treat any feature above current cross-browser interop as
unverified for this project, not merely "above the floor".

**General CSS platform behaviour, not evidence of this project's compatibility or floor:**
`@supports` does not test selectors the way it tests properties — `@supports selector(:has(a))` is
the form, and it is itself newer than some of what it tests, per current MDN/caniuse data at the time
you check. Verify current support for `@supports selector()` itself before relying on it, and prefer
restructuring the markup where that check is inconvenient.

## 4. What the build does, and what it does not

The most expensive misunderstanding in this document. Three different things, three different
answers:

**General build-tooling behaviour, not evidence of this project's compatibility or floor — inspect
your actual configuration and toolchain before relying on any row:**

| | Compiled for you? |
|---|---|
| **JavaScript syntax** — `?.`, `??`, class fields, top-level `await` | Typically **yes**, down to whatever target your configuration actually declares — confirm the configured target rather than assuming one |
| **JavaScript APIs** — `Object.groupBy`, `Promise.withResolvers`, `Array.prototype.toSorted` | Typically **no** polyfill by default — confirm your toolchain's actual polyfill behaviour rather than assuming none exists |
| **CSS** | Depends entirely on configuration — inspect it rather than assuming a default |

So a build that reports success proves nothing about the floor on its own. `Object.groupBy` is valid
syntax everywhere — where your toolchain does not polyfill it, it is a method that does not exist at
runtime, and confirming that is a validation step, not an assumption.

**Set the target explicitly.** A default is a decision somebody else made about somebody else's
audience. Declare the floor once, in `package.json`, where the CSS tooling reads it too. The
example below is the floor this contract proposes, **pending validation of the Safari 15.5 /
Tailwind 4 conflict** (see the note at the top and section 6); do not treat it as ratified until
that validation exists:

```json
"browserslist": ["safari >= 15.5", "ios_saf >= 15.5", "chrome >= 102", "firefox >= 112"]
```

**General Browserslist tool behaviour, not evidence of this project's compatibility or floor —
verify each claim against your own installed version and query before relying on it:**
`ios_saf` is documented as a separate browser to `safari` in Browserslist's own data, and leaving it
out is a documented mistake to avoid. `safari` is documented as covering desktop Safari only, so a
query naming just `safari` is documented as resolving to zero iOS entries. Confirm `browserslist` is
actually resolvable as a transitive dependency in your project, then run
`bunx browserslist "<your query>"` and read the actual output for your project: if no `ios_saf` line
appears, confirm whether your floor is doing the job it was written for. Where `browserslist` is not
resolvable locally, `bunx` is documented as fetching it for the one run, but running it still depends
on your having permission and connectivity to fetch packages — do not assume that silently. Not
npm's `npx` — [toolchain.md](../../project-setup/references/toolchain.md) section 2 owns why this
stack runs package binaries through Bun's own tooling rather than npm's.

**Android Chrome query behaviour is `needs_validation` against the installed Browserslist version
and dataset, not evidence of this project's compatibility or floor.** Inspect the available
`and_chr` versions and actual resolution of the proposed query before deciding whether it can express
the ratified minimum; do not assume a single-current-version model or exclude a floor entry on that
basis. Separately validate any audience auto-update assumption before relying on it. Query evidence
and audience evidence answer different questions, and neither ratifies the pending floor.

Where a floor is ratified and your toolchain configuration is validated, set the JavaScript target to
match it in the build configuration — the same number in both places, not one derived from the other
by assumption. [toolchain.md](../../project-setup/references/toolchain.md) owns how they are wired
for the current toolchain; confirm that wiring rather than assuming it is already correct.

## 5. JavaScript, and how little of it there should be

**Still `needs_validation`** — "the floor" in this section is the proposed, unratified floor from
section 0; nothing below states that Safari 15.5 / Tailwind 4 compatibility is resolved.

A static site's JavaScript budget is small enough that most of this never comes up — which is the
best compatibility strategy available and the reason it is worth saying here.

**Above the proposed floor (pending validation)**, so not without a guard: `Array.prototype.toSorted`,
`toReversed` and `with`; `Object.groupBy`; `Promise.withResolvers`; the RegExp `v` flag; `URL.parse`.

**General JavaScript practice, not a validated fact about this project's compatibility or floor:
feature-detect, do not version-detect.** `if (typeof x.toSorted === 'function')` checks what the
current runtime actually offers. Reading the user agent string is a guess that browsers actively lie about, and it is wrong the day
a new version ships.

**As a general goal, not a proven compatibility guarantee for this project, anything that decorates
rather than delivers goes behind a capability check**, so its absence
costs a nicety and not the page. Whether an uncaught throw in one listener actually takes down every
listener registered after it depends on how the runtime dispatches that event — this is a claim
about JavaScript's event-listener model in general, not a validated fact about this project's own
code, and `needs_validation` against your own handlers before relying on it, including for the one
that opens the mobile menu.

**A third-party script is outside every rule in this document.** An analytics tag, a chat widget or
a maps `<iframe>` is somebody else's code, compiled to somebody else's target, changing without
notice. It cannot be held to this floor. `defer` or `async` keep it from blocking the parse in
`<head>`, but non-blocking loading is not the same as isolation — a script's own runtime failure can
still reach the page depending on how it is written and executed, so treat containment as
`needs_validation` for whatever third-party scripts this project actually loads, and never make one a
dependency of anything the page needs in order to work.

**A documented exception some tag managers require, not a universal rule or a ratification of any
floor:** a tag manager's inline bootstrap. Where the chosen provider's own documentation requires an
inline, non-deferred snippet in `<head>` — because deferring it would drop `dataLayer` pushes made
before it runs — follow that provider's documented mechanism, and
[gtm-injection.md](../../site-build/references/gtm-injection.md) owns that rule and the reasoning for
this project's chosen provider. Confirm the provider's own documentation states this requirement
rather than assuming it applies by default; a vendor telling you their tag must be synchronous in
`<head>` is describing their own documented mechanism, not a rule this document establishes.

## 6. Tailwind

[toolchain.md](../../project-setup/references/toolchain.md) section 5 owns whether a project installs it. One fact belongs here, because it is a
compatibility fact that bears on the unresolved floor conflict:

**Tailwind 4 requires Chrome 111, Safari 16.4 and Firefox 128.** It is built on `@property`,
`color-mix()` and cascade layers, and its own documentation offers no fallback path — the guidance
is to avoid the utilities whose features are unsupported, which at this floor is a large and
unpredictable share of them.

So: **if the Safari 15.5 floor is ratified, Tailwind 4 would not be available at it.** A project
that wants Tailwind 4 would be choosing a Safari 16.4 floor, which is a legitimate decision to make
deliberately in section 7 and a serious one to make by accident. Tailwind 3 predates the
requirement and remains an option. **None of this is settled**: the repository's product core uses
Tailwind 4 while this contract proposes Safari 15.5, and the conflict is unresolved until a human
decision or real device evidence exists.

> **needs_validation** — The repository's product core uses Tailwind 4 while this contract's floor
> is Safari 15.5. The conflict is unresolved: neither side is ratified by implication, and no real
> device test has been recorded. See the note at the top of this file.

Hand-written CSS with custom properties, which is what
[astro-structure.md](./astro-structure.md) section 8 and [visual-craft.md](./visual-craft.md) already
describe, has no floor of its own beyond the features you choose to use.

## 7. Declaring a different floor

The floor above is this contract's proposed default, not a law and not yet ratified for this
product. Raising it is reasonable when a project knows its audience — an internal tool, a
developer-facing product, a market where iOS share is negligible.

When a project changes it, it changes in **three places, together**, and nowhere else:

1. `browserslist` in `package.json`.
2. The build target in the build configuration.
3. A line in the project's `DESIGN.md`, in prose, saying what the floor is and **why** — because
   the number alone does not tell the next person whether it was chosen or inherited.

A floor raised in the build configuration but not written down is the same as no floor: the next
person writes `:has()`, the build accepts it, and nothing says whether that was allowed.

**If the floor is ratified, lowering it below the table above is not supported by this set.** Beneath
Safari 15.5 the accessibility contract's requirements stop being expressible, and at that point two
documents disagree with each other.

## 8. What this document cannot do

- **The version table is a snapshot.** Support only ever improves, so it goes stale in the safe
  direction — but a feature listed here as unavailable may have become available since. Verify
  against MDN or caniuse rather than trusting this file's list to be current.
- **Nothing here is checked.** `browserslist` governs the tools that read it and nothing else. No
  script in this set will tell you a stylesheet reaches past the floor.
- **It cannot see the visitor.** Whether iOS 15 is one percent of a given site's traffic or eight
  is an analytics question, and it is the question that should actually set the floor. This
  document proposes a defensible default for a site that has no traffic yet, pending validation.
- **It says nothing about how the page looks on a small screen.** Support and responsiveness are
  different subjects; a page can be perfectly compatible and unusable at 375 pixels.
  **`../../visual-gate/references/visual-fidelity.md` section 2 owns that half** — the widths to check, the horizontal-scroll
  test, and the navigation in both of its states. This line used to end at the semicolon, which
  correctly separated the two subjects and left the second one belonging to nobody.
