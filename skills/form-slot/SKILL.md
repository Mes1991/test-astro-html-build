---
name: form-slot
description: "Use when a page being built contains a form that does not exist in the provider yet, so there is no embed snippet to paste. Trigger it the moment a design, screenshot, mockup or brief shows a form — a quote card, a contact block, a newsletter box, a booking panel — and no embed code was handed over with it. Also use it for restyling an existing embed to match a brand, a form whose submissions are not reaching analytics, which parts of a form card are markup and which come from the embed, turning a design into the form definition the adapter documents, or replacing a stand-in once the form exists."
---

# Form slot

> **Opt-in provider recipe.** This skill and its contracts describe a third-party form provider's
> embed. They are an extension, not product core: the template works without them, and a project
> adopts them only when it has chosen a form provider.
>
> **Activation gate.** This skill applies only after the form provider has been explicitly
> activated for the project. A form depicted in a design is not authorization to install a
> provider; the default is absent.

## What this is

A workflow for the gap between a design that has a form on it and a form that exists. It tells you
what to DO and in what order; three contracts tell you what is CORRECT. **This file restates none of
their rules** — two copies of a rule means one of them is wrong and nobody knows which.

| Contract | Owns |
|---|---|
| `references/form-slot.md` | the gap: the slot, the stand-in, the card/embed boundary, what to hand over |
| `references/form-schema.md` | the adapter-documented form definition: its format, scope and supported capabilities, including their absence |
| `references/embed-styling.md` | the DOM and class contract the adapter emits, and how to style them |
| `references/embed-tracking.md` | what the adapter's runtime may post to the page, once its documentation confirms it does — needed only when the site measures conversions |

These contracts live in the canonical `skills/` source and are referenced from there; do not copy
them into the consuming project's `docs/`. Distribution to an agent's runtime is handled by the
ratified entrypoints (see `../distribution.md`), not by manual duplication.

## The rule this exists to enforce

**Do not stop, and do not open with a question.** The absence of an embed snippet is the normal
starting state of a page with a form on it, not an exception to be escalated. If the snippet
existed, you would have been given it.

Build the page. Produce three artefacts. Ask one question at the end.

## The workflow

Run these in order, in one sitting, before handing anything back.

### 1. Split the design at the boundary

Before writing markup, decide for every element in the form card whether it is page HTML or embed
output. `references/form-slot.md` section 2 has the rule and a worked example.

The short version: the adapter's documented output is scoped to the form itself — read its
documentation for the exact element it emits and confirm nothing else is included, so you know the
card, the heading, the subheading and any line beneath the button are yours to build. Getting this
wrong is what produces markup that has to be torn out later.

### 2. Build the slot with an inert stand-in

A container with a stable `id` and a `data-form-slot` name, holding a visual stand-in that **cannot
submit and cannot be reached** — no `<form>`, no `name` attributes, no handler, native `disabled` on
every control, `inert` on the wrapper. `references/form-slot.md` sections 1 and 3.

Do not skip either half. Both failures are invisible: a stand-in that submits nowhere swallows
leads in silence, and one held back by `aria-disabled` is still in the tab order.

### 3. Write the schema to a file

The form definition that will create the form, at `forms/<slot-name>.<ext>`, written against
`references/form-schema.md` — the file format and extension follow whatever the adapter documents
(JSON is the common case used as the example throughout `form-schema.md`, but the adapter's own
documented format governs). The adapter owns how the schema reaches the provider's builder; this
skill does not fix a UI route or an API. `references/form-slot.md` sections 4 and 5 cover
turning a design into fields, including the two cases a design cannot tell you: placeholder-only
labels, and choice lists you have to guess.

**If the form collects an email address and a reply to the sender is part of the point, and the
adapter's schema documents a way to flag that field for it, mark it as documented** — `form-schema.md`
uses `"replyTo": true` as its example key, but the adapter's own documentation is what decides
whether that key exists and what it is called. `references/form-schema.md` section 3.1 owns the
rule; what belongs here is that this is a decision the design cannot make for you and the provider's
builder will not make on your behalf.
What a reply actually does is the adapter's behaviour, not this skill's. **The adapter must document
and validate its own reply mechanism** — how a field is marked, what an absent mark does, whether a
marked field sets a reply header, and where an unmarked reply goes. Do not assume a header, a
mailbox or a bounce because one runtime behaves that way; nothing is inferred from the field being
named `email`, and no warning may be assumed at import time. A form whose replies genuinely should
go nowhere is a legitimate form.

The test is the brief, not the markup: a contact form, a quote request or a booking panel is one
where somebody will answer the lead, so mark that field. A newsletter signup or an anonymous survey
is not. **The adapter must document whether more than one marked field is rejected and what its
limit is** — do not assume a limit of one.

### 4. Style against the adapter's classes, not against the stand-in

Write the form's CSS now, targeting the classes in `references/embed-styling.md`, and give the stand-in those
same classes so the preview is honest. `references/form-slot.md` section 6 explains what the alternative costs.

**Use a supported global stylesheet path if documentation and validation of the adapter/host pair
show that component-scoped rules cannot reach the real form, and check that they now do.** Runtime
construction alone does not establish this limitation. `references/embed-styling.md` section 2 owns the rule and the per-host table for
confirming this. Where it applies, it matters most at exactly this step, because a scoped stylesheet
still reaches the stand-in — the stand-in is markup your component compiled, and the real form, built
by the adapter's documented runtime, may not carry the same scope attribute. Style it from inside a
component in that case and this step reports success falsely: the preview looks finished, and the
form that replaces it arrives unstyled.

### 5. Hand over, and ask the one question

Name the slot, name the schema file, flag anything you guessed, and ask where submissions are
delivered. The adapter must document which delivery settings have no default and which do —
recipient and from address are the common case, but confirm before assuming they are the only ones
that need an answer; say which settings you are relying on a default for, rather than leaving it
implicit. `references/form-slot.md` section 7.

Say which field you marked for Reply-To, or that you marked none and why. The adapter must document
and validate what happens when no field is marked — whether anything rejects it, whether the form
still publishes, and at what point the consequence of an unmarked field becomes visible. Do not
assume the failure is silent at every stage; confirm the adapter's documented behaviour.

## When the snippet arrives

The adapter must document its mount mechanism. Where it documents that it replaces the slot's
children, do that and delete the stand-in — nothing else changes: not the card, not the surrounding
copy, not the CSS. If the form looks wrong afterwards it is a styling question and
`references/embed-styling.md` owns it; if a field is wrong it is a schema question and
`references/form-schema.md` owns it.

**If the site measures form conversions, open `references/embed-tracking.md` at this point** — and only at this
point, since a site with no analytics needs nothing from it. First require the adapter to document
and validate whether it exposes evidence of a completed submission, what that evidence means and
how it is transported, including when no such signal exists. Use only a confirmed signal matching
the project's conversion definition; do not infer server acceptance from a click or a visible
message. If suitable evidence is unavailable, report measurement as unproven rather than inventing
a transport. `../site-build/references/gtm-injection.md` covers container installation, not the
meaning or availability of a form-conversion signal.
