# The form slot — building the page before the form exists

> **Opt-in provider recipe.** This contract describes building a page whose form is produced by a
> third-party form provider. It is an extension, not product core: the template works without it,
> and a project adopts it only when it has chosen a form provider.
>
> **Activation gate.** This contract applies only after the form provider has been explicitly
> activated for the project. A form depicted in a design is not authorization to install a
> provider; the default is absent.

The design has a form on it. Where the adapter's own documentation describes creating a form through
a builder that then hands you an embed snippet, and that snippet does not exist yet, this file is
the contract for that gap.

The gap is not an accident and it is not brief. Creating the form is likely to require a decision the
design cannot answer — where submissions are delivered — and, where the adapter documents that this
setting belongs to whoever owns the inbox rather than whoever builds the page, that decision waits on
them, not on the page. Treating the missing snippet as a blocker stops the site for a reason that has
nothing to do with the site.

Hand this file to whatever builds the page.

## Start here

**What you are producing: three things, in the same sitting, before you ask anybody anything.**

1. A **slot** in the page — the container the embed will drop into, with a non-functional visual
   stand-in inside it so the design can be reviewed.
2. A **definition** beside the page, in whatever shape the adapter documents for creating a form —
   written against [form-schema.md](./form-schema.md).
3. **CSS targeting the adapter's documented classes**, never the stand-in's — written against
   [embed-styling.md](./embed-styling.md).

Deliver all three and identify the remaining integration work from the adapter's documented and
validated workflow, including any missing capabilities or decisions; it is not necessarily one
paste. Deliver the first only and somebody else still has to translate the picture into a form.

**What you are not producing:** a question. Do not open by asking whether the form exists — if it
did, you would have been given the snippet. Do not ask which fields it has; they are in the design.
Do not offer to skip the section. The absence of an embed is the normal starting state of a page,
not an exception that needs handling.

**Delivery settings are a strong candidate for something you genuinely cannot infer** — commonly the
address submissions are sent to and the address they are sent from, where the adapter documents those
as separate settings with no default. Nothing in a design encodes them. Confirm the adapter's actual
settings and their defaults rather than assuming only these two lack one, and ask once, at the end,
after the three deliverables exist — see section 7.

**The mistake that costs the most**, before you write a line: shipping a stand-in that looks like a
working form. Section 3 is about nothing else.

---

## 1. The slot

One container, at the position the design puts the form, with a stable identifier:

```html
<!-- FORM SLOT — replace the children of this element with the embed snippet. -->
<div id="quote-form" data-form-slot="free-quote">
  <!-- stand-in, see section 3 -->
</div>
```

Two attributes, two jobs. `id` is what the page's own links and anchors target, so it survives the
paste. `data-form-slot` names which form belongs here, and it is the string that ties this element
to the schema file in section 5 — on a page with two forms, it is the only thing that says which is
which.

**Do not put the slot inside the card's padding-and-border element and then style the two as one.**
The card is section 2's subject and it stays yours; the slot is a plain container whose entire
purpose is to be emptied and refilled.

**Reserve space when evidence shows that mounting would otherwise shift the page.** Document and
validate initial/server-rendered content, retained stand-in content, mount timing and any layout
reservation already supplied by the host or adapter. Asynchronous construction alone proves neither
an empty interval nor collapse to zero. Measure actual transitions, including handover; if an empty
or undersized slot causes movement, a host `min-height` is one possible mitigation, not proof that
two empty intervals exist. Validate layout stability after mounting and at the relevant widths;
[seo-page.md](../../static-site-seo/references/seo-page.md) section 6 owns the layout-shift goal.

For a confirmed space-reservation need, an example host rule is:

```css
[data-form-slot] { min-height: 30rem; }   /* measured from the stand-in, not guessed */
```

Measure the real form and stand-in at supported widths and states rather than presuming which is
tallest. Keep or adjust the reservation only where measurements show it prevents movement without
unwanted empty space; remove an unnecessary reservation only after validating the actual mount.

## 2. The boundary: the adapter owns the form, the page owns everything around it

This is the section to read twice, because getting it wrong produces work that is thrown away.

**Read the adapter's documentation for the exact element it emits, and treat its output as scoped to
the form alone** — no card, no heading, no description, nothing outside the form tag at all, once
the adapter's documentation confirms that fields and the submit row are the entire surface it
builds.

So for a design like a quote card with a heading, a reassurance line, five fields, a button and a
phone number underneath, the ownership splits like this:

| Piece | Owned by |
|---|---|
| The card: background, border, radius, shadow, padding | page |
| The heading — "Get a Free Quote" | page |
| The subheading — "We reply the same day. No obligation." | page |
| The five controls and their labels | **adapter** |
| The submit button and its text | **adapter** |
| The line under the button — "Prefer to talk? Call (201) 893-3198" | page |

**Where the adapter's confirmed output is scoped to fields, their help text and the submit button,
everything else is page HTML.** It goes in the card, around the slot — before it or after it — and it
never enters the embed.

That rule is worth stating positively because the instinct runs the other way: the phone line sits
visually inside the card, below the button, so it reads as part of the form. It is not. It is a
sibling of the slot:

```html
<div class="quote-card">
  <h2>Get a Free Quote</h2>
  <p class="quote-card__lede">We reply the same day. No obligation.</p>

  <div id="quote-form" data-form-slot="free-quote"><!-- … --></div>

  <p class="quote-card__aside">Prefer to talk? Call <a href="tel:+12018933198">(201) 893-3198</a></p>
</div>
```

**This generalises, and it is the answer to "what about the next one".** Disclaimers, privacy lines,
trust badges, response-time promises, a second call-to-action — all of it is page HTML in the card,
where the adapter's documentation confirms it offers no mechanism for injecting arbitrary content
into its markup. Confirm that absence rather than assuming it; where it holds, every case that looks
like it needs one is a case where the content was never part of the form.

Two things may genuinely be inside the form and belong in the schema instead, where the adapter
documents them that way:

- **Text attached to one field** — the field's help text, where the adapter documents rendering it
  between the label and the control.
- **Text between fields** — an `html` field, where the adapter documents supporting one. What markup
  survives, and the shapes of it that silently break a form, are
  [form-schema.md](./form-schema.md)'s rules. Read them there before using one; this file deliberately
  does not repeat them.

If the copy is neither of those, it is the card's.

## 3. The stand-in must not work

The container is not left empty. An empty box cannot be reviewed, and the design is what you were
asked for. So the slot holds a visual stand-in — and that stand-in is built to be inert, on purpose:

- **No `<form>` element.** Use a `<div>`.
- **No `name` attribute on any control.**
- **No `action`, no `method`, no submit handler.**
- **The button is `type="button"`.**
- **Every control carries native `disabled`** — the attribute, not `aria-disabled`.
- **The wrapper carries `inert`.**
- **A comment at the top of the slot** saying what it is and what replaces it.

The last two are one rule with a trap in it. `aria-disabled="true"` announces a control as disabled
and **leaves it focusable**, so pairing it with `aria-hidden` on the wrapper produces the one
combination ARIA explicitly forbids: a control a keyboard user can tab into, inside a subtree a
screen reader has been told to ignore. The visitor lands on a dead input with nothing to explain it.
`inert` is the attribute that means what `aria-hidden` is usually reached for — it removes the
subtree from the accessibility tree **and** from the tab order in one step.

It carries the adapter's own classes, for the reason in section 6 — what you are looking at has to
be what you are styling. Read the adapter's class documentation for the names.

The reason for all of it is one failure and it is expensive. A stand-in that posts nowhere but looks
live is a form that accepts leads and discards them in silence. Nobody sees it happen. It is found
weeks later when someone asks why the campaign produced no enquiries, and by then the traffic that
filled it in is gone and unrecoverable. An obviously-inert stand-in fails visibly and immediately,
which is the cheapest way for it to fail.

A missing form is a problem anyone can see. A form that pretends to work is a problem nobody can.

## 4. Reading the design into fields

The design gives you the field list, their order, their widths and their copy. Two translation rules
live here because they are decisions made while looking at a design, which is a moment
[form-schema.md](./form-schema.md) never sees — by the time that contract is read, the field list
already exists.

**A placeholder is not a label.** A design showing only grey text inside each box is showing you a
placeholder-only form, which is a real accessibility failure: the text vanishes the moment the
visitor types, taking with it the only remaining description of the field. Emit a label anyway, using
whatever key the adapter's schema documents for it, set the same string as the placeholder if the
adapter documents one, and hide the label visually in your CSS. The design is preserved exactly; the
form remains usable by a screen reader and by anyone who has already started typing.

**Guess the choice lists, and say that you guessed.** A `select` in a design shows its placeholder and
none of its options. Take the options from the site's own content — the services section, the product
list, whatever the page already commits to — write them out in whatever shape the adapter's schema
documents for a choice field, and flag them in your handover as the one part of the schema that is a
content decision rather than an observation.

## 5. The schema is a deliverable, not a draft

Write it to a file beside the page, named after the slot, using the adapter's documented and
validated format and extension. If that format is JSON, an example is:

```text
forms/free-quote.json      ← data-form-slot="free-quote"
```

**The adapter owns the import mechanism.** How the definition reaches the provider's builder — a file
import, a UI paste, an API call — is whatever the adapter documents; this contract does not fix one.
The deliverable must be complete against the documented definition contract. Document and validate
whether linting or another acceptance check exists and what it establishes; run only supported,
authorized checks. If no linter exists, record that absence and the available evidence rather than
inventing a lint requirement. A completed definition does not imply completed integration.

Note what the schema is unlikely to carry, where the adapter documents keeping delivery separate:
recipients, the from address, the subject line, the success behaviour. Confirm where those settings
actually live rather than assuming they are absent from the schema. Section 7 covers which of them you
have to ask about and which arrive with a default.

## 6. Write the CSS against the adapter's classes from the first line

The form's CSS targets the classes the adapter emits. It is written now, against
[embed-styling.md](./embed-styling.md), before the embed exists — and the stand-in in section 3
**borrows those same classes** so that what you are looking at is what you are styling.

This is the rule that saves or wastes the most work, and — where the adapter documents replacing the
stand-in with markup carrying its own classes rather than the stand-in's — it has two outcomes:

- Style the stand-in's own classes, and on the day the snippet lands every one of those selectors
  stops matching. The form arrives unstyled, in front of whoever is reviewing it, and the work is
  done twice.
- Style the adapter's documented classes, and the paste is invisible. The stand-in is deleted, the
  real form takes its place, and it already looks like the design.

The card's own styling is separate and stays yours either way — it is outside the form, and where the
adapter documents its mount as scoped to the slot's children, nothing it does touches the card.

## 7. Handover, and the one question

With the three deliverables in place, say what is outstanding, in this order:

1. **The slot is live and the page is complete.** Name the file and the `data-form-slot` value.
2. **The definition is ready**, through whatever mechanism the adapter documents for reaching its
   builder.
3. **The options in the choice fields are a guess**, taken from the site's own copy — confirm or
   replace.
4. **One question: where do submissions go?** The adapter must document which delivery settings
   exist, where they live, and which have no default — commonly a recipient address and a from
   address, but confirm this rather than assuming only these two, and ask about whichever ones the
   adapter documents as undefaulted.

The adapter must also document which settings block publishing and which arrive with a default;
confirm that inventory rather than assuming a fixed split, including for a redirect-on-success mode
that would need a URL nothing can guess.

Say what you found rather than leaving it implicit. "These settings have defaults; review them if
they matter" is a sentence that takes a second to write and saves the reader discovering the settings
have more in them than the question you asked about.

Then, when the form has been created and its snippet exists: follow the adapter's documented mount
mechanism — commonly replacing the slot's **children** — delete the stand-in, and change nothing
else. Preserve the card, heading, phone line and CSS. **Retain or adjust the slot's space reservation
according to section 1's validated mount and layout measurements**, not a presumed empty interval.
If something looks wrong after the paste, it is a styling question
and [embed-styling.md](./embed-styling.md) owns it; if a field is missing or misbehaving, it is a
schema question and [form-schema.md](./form-schema.md) owns it.

## 8. One form, many pages

Everything above is written for one page. When the same form appears on ten landings, the reflex is
ten forms — and it is wrong in a way that only becomes expensive later, when a field has to change
in ten places and one of them gets missed.

**Define one form per genuinely distinct form.** Reuse it when the fields, the validation and the
delivery are equivalent. Create a separate one when any of those changes — different fields,
different rules, a different consent statement, a different destination — and **write down why**,
because two near-identical forms with no note is an accident nobody later dares consolidate.

### The attribution field

Page attribution can be a reason people duplicate forms. Before deciding, document and validate
whether the adapter supports origin attribution, including its absence and any limits on reuse.
Do not assume that an attribution field exists or that page-specific origin can be supplied.

If a hidden field is a documented option, validate default semantics, host writability and its
supported interface, read timing and submitted-value handling before using it for an origin such as
`landing_slug` or `campaign`. [form-schema.md](./form-schema.md) sections 3 and 4 govern that inventory.
Use another mechanism only if documented and validated; if attribution is unavailable, report the
constraint rather than guaranteeing reuse preserves it.

**Validate the extension rather than assuming its outcome.** The adapter must document how it treats
this use of a hidden field — as fully supported, as producing a warning, or as rejected — and whether
any warning blocks the definition; do not assume a warning exists or that it is non-blocking. Where a
warning does exist, it may exist because a hidden field is also how somebody accidentally ships a
required field nobody can fill in, without being a statement that this use is wrong — but confirm that
reading against the adapter's own documentation rather than assuming it. Treating an unconfirmed
warning as a refusal is precisely how a team ends up with ten copies of one form.

### Styling is not identity

Two pages sharing a form and needing it to look different is a CSS question. The same adapter
classes take different styles per page or per group of pages, and section 6 already says the CSS is
written against those classes rather than against the markup. A second form is not how you get a
second look.

## 9. Proving it works, which import does not

**A clean import proves the schema. It proves nothing else**, and this is the row that gets waved
through, because the moment the schema turns green feels like the end of the work.

**Activation gate.** These stages apply only once the form provider has been explicitly activated
for the project (opt-in, deny-by-default). A form depicted in a design is not authorization to
install a provider, and a site with no provider activated has no stages to run here.

Select applicable proofs from the brief and the adapter's documented, validated capabilities,
including absence. These are proof categories, not a fixed nine-stage provider workflow. Record a
category as not applicable when it is neither supported nor required; if the brief requires an
unsupported outcome, report a gap rather than claiming success. **No applicable proof substitutes
for another.**

| Stage | What proves it |
|---|---|
| **Definition acceptance** | Document and validate the supported creation/acceptance mechanism, any diagnostics and what acceptance proves, including absence of an importer; obtain evidence through that actual path |
| **Rendering** | Use a documented preview if available, otherwise an authorized real integration; validate expected fields and applicable states rather than presuming a separate preview interface |
| **Publish** | Where the adapter documents a publish gate, its documented requirements are met and the form's status reflects it — confirm this gate exists before treating it as a stage |
| **Origin** | Where the adapter documents a domain-verification requirement, it is met, and the definition actually loads on the page rather than being refused — confirm this mechanism before relying on it |
| **Live** | Validate the documented mount path, preservation of host content and observed layout stability; retain a space reservation only where section 1's measurements justify it |
| **Submit** | Document and validate what constitutes a completed submission and what evidence establishes it, including whether server acceptance exists and can be observed; verify the required outcome through that path, not a presumed browser validation pass |
| **Notification** *(when supported and required)* | Document and validate whether notifications exist, their transport, destination and observable delivery evidence; verify the actual required destination without presuming email or a mailbox |
| **Replies** *(when supported and required)* | Document and validate whether replies exist and how they are addressed, including absent-address behaviour, diagnostics and any undeliverability/bounce semantics; where email Reply-To is the supported path, verify the required reply actually reaches its intended recipient |
| **Tracking** *(only when measurement is activated)* | Document and validate available completion signals, their meaning and transport, including absence. Observe a supported signal matching the project's conversion definition; do not infer server acceptance from a click or visible message. If no suitable signal exists, report measurement as unproven. [embed-tracking.md](./embed-tracking.md) governs a confirmed tracking interface |

For every applicable category, document and validate failure diagnostics, including silence, rather
than inferring success from the absence of an error. Notification, reply and tracking capabilities
are independent; proof of one establishes none of the others. **Tracking is skipped, not failed,
when measurement was never activated.** Unsupported but required outcomes remain explicit gaps.
