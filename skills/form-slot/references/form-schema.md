# Form schema — internal canonical contract and adapter mapping

> **Opt-in provider recipe.** This document defines the project's internal canonical form contract.
> It is an extension, not product core: the template works without it, and a project adopts it only
> when it has chosen a form provider. External schema formats, keys and error codes remain
> provider-specific; adapters map them to and from the internal canonical format.

This is the contract for authoring a form definition outside the provider's builder. Hand this file
to whatever generates the definition.

## Start here

**Architectural boundary.** This document defines the internal canonical contract; its schema rules
can be normative within the project. Adapters perform the mapping to and from provider formats.
No internal rule proves that a provider has the corresponding capability or uses that format
natively. Adapter capabilities, unsupported mappings and losses must be documented and validated.

**The adapter owns the external mapping.** Provider-facing keys, field-type vocabulary, validation
rule names and import error codes must follow the chosen provider's documented format. The canonical
envelope, conditional grammar and dependency invariant below govern the internal format only;
the capability inventories and authoring steps govern the adapter's external definition.

**Before you write a definition, read the adapter's own schema documentation and validate its
inventory against evidence.** Establish which capabilities exist, including their absence:

- the definition's actual shape, any envelope and the representation of fields;
- any field-type vocabulary and the properties each supported type reads;
- any validation rules, accepted argument representations and exposed diagnostics;
- whether conditional logic exists, and any supported operators and operands;
- whether an import surface exists, its messages and severities, and whether any codes are stable.

**What you are producing:** the definition the adapter documents for this form. Document and
validate its boundary with delivery settings, styling and form identity, including whether each is
inside, outside or unsupported. A fields-only definition is appropriate only when that boundary is
confirmed; do not impose it on every adapter.

**How it is checked:** the adapter must document whether it lints the document through an importer,
and what severities it uses. Where it documents an error/warning model in which errors block the
import and warnings do not, treat that as the model — confirm it rather than assuming it. Where this
file says "rejected", it means the adapter's documented severity for that condition blocks the
import; check the adapter's own table for which severity that actually is.

**The shortest path to a correct document:**

1. Document and validate the adapter's minimum definition and field representation; use its actual
   structure rather than presuming a field list.
2. Satisfy its documented per-field requirements, including identity or type only where required;
   confirm any uniqueness rules rather than inventing a universal minimum.
3. Map the design's labels, required states, hints, layout and validation to supported capabilities;
   record unavailable capabilities rather than emitting guessed keys.

**Mistakes worth checking against the adapter's documentation before you write a line:**

- **A field type may not imply validation.** Where the adapter documents that an email type only
  picks the input widget, only an explicit email rule checks the format — confirm this per type
  (the same question applies to url, number, date and time) rather than assuming type-implies-check.
- **Use each rule's documented argument representation.** Document and validate the accepted forms,
  including rules without arguments or adapters without a separate rule interface. Do not assume
  heterogeneous arguments or an exhaustive object/none/array taxonomy. Establish what happens to
  an invalid representation rather than presuming rejection or silent failure.
- **Do not copy a design's required asterisk into the label where the required flag already renders
  one.** Confirm in the adapter's documentation that the flag renders a marker; where it does, a
  label ending in `*` plus the flag shows two.

## 1. The envelope

The internal canonical envelope contains `version`, `locale` and `rows` (the row/field structure),
with optional blocks for consent, submit label and translations. This is a normative internal shape,
not a requirement that any external provider use these keys or this structure natively.
Adapters map to and from this envelope and must document and validate the actual provider envelope,
including absent elements and mapping losses. Emit only the external shape the adapter documents;
do not invent provider keys.

**The adapter must document where delivery settings live.** Where it documents that recipients, from
address, subject and success behaviour are configured outside the definition, in the provider's
delivery settings, treat the schema as scoped to fields only — confirm this split rather than
assuming every adapter draws it the same way.

## 2. Fields

The adapter must document and validate how fields are represented, which information is required
and which is optional, including whether names or types exist as explicit properties at all. Emit
that representation; do not impose an object shape or a name/type minimum.

**The adapter must document whether a field name doubles as the submission key.** Where it does, it
must be unique across the form, and it must not collide with any name the adapter reserves for its
own use (for example, an anti-spam field) — read the adapter's reserved-name list before assuming
none exists.

**Where the adapter documents that the required flag appends its own marker, do not also write one
into the label.** A design showing "Email address *" would then mean a label of "Email address" plus
the required flag — copying the asterisk in gives you two markers on screen, and the importer may not
detect it; confirm this rendering behaviour before relying on it.

**If the design does not reveal a choice list**, emit your best guess and say so alongside the
definition — the choices are a content decision. An empty list is not necessarily an escape hatch:
the adapter must document how it treats a missing options key versus an empty options list, and
whether either is rejected.

## 3. Field types

The adapter must document its field-type vocabulary: which types render which widget, which require
an options list, which accept a placeholder, and which carry type-specific keys.

For supported types, investigate these boundaries:

- **If the adapter supports a non-visible value carrier, document and validate its full behaviour:**
  initial/default value semantics, whether the host can write it and through which interface, when
  the value is read, and how requirements are enforced. Invisibility or submit-time reading alone
  establishes neither host writability nor whether a missing default prevents submission.
- **A file field may not be delivered.** Whether the selected file is sent, stored or attached is a
  property of the provider. Verify it before relying on it. See [file-fields.md](./file-fields.md).
- **If the adapter supports an HTML/content field, document and validate its purpose and shape:**
  whether it contributes a submitted value, whether it needs an identity and any uniqueness rule,
  and whether and how markup is sanitized before storage or rendering. Do not presume a unique
  name, a content-only role or a server allowlist from the type's existence.

### 3.1 Reply-To

If the adapter supports a Reply-To flag on an email field, it must document it. The generic rules:

- **The adapter must document what an absent flag does.** Where it documents that nothing is
  inferred, leaving it out means the notification carries no Reply-To at all; if replies matter, set
  the flag.
- **The adapter must document whether more than one flagged field is rejected.** Where it does, a
  document with two is rejected.
- **The schema or adapter must declare which field types accept it and its incompatible-type policy:**
  reject, warn, or documented discard. Where it is email-only, that restriction alone does not
  determine how another type is handled. Document and validate the applicable policy, diagnostics
  and effect; no unspecified silent discard is permitted.
- **The adapter must document when the header is set.** Where it is set only when the visitor
  actually answered, a flagged field left empty produces no Reply-To rather than an empty one.

### 3.2 Predefined choice sets

If the adapter offers built-in choice sets, it must document them, including whether a preset is
expanded on import (so a preset that changes later would never rewrite forms already created) and
what happens when both a preset and a hand-written options list are set on one field — do not assume
rejection or a lack of merging without confirming it.

## 4. Validation rules

Where a rule interface exists, document and validate its representation, whether it uses explicit
names or arguments, and how unknown rules are handled. If evidence confirms that an unknown rule is
retained but never evaluated, a typo can disable the intended check; treat that as a conditional
failure example, not a universal rule-engine or importer model.

**Document and validate accepted arguments for each supported rule.** Establish whether argument
representations vary, whether arguments are required and how invalid representations are handled.
Keyed objects, absent arguments and positional arrays are examples only, not a required or exhaustive
taxonomy. Do not assume an importer rejects an invalid representation or that runtime failure is
silent; confirm the actual diagnostic and effect, including when no separate rule interface exists.

Patterns common across providers, to confirm against the adapter's own documented behaviour before
relying on them:

- **A field type does not validate its own format.** Only an explicit rule does — the adapter must
  document this.
- **Some types are bounded without a rule** (for example, phone, rating and date). Read the
  adapter's documentation for which.
- **A keyed argument is typically expected to be an actual number**, with the key left out rather
  than set to null to mean "no upper bound" — the adapter must document how it reads a null, since
  providers differ on this.
- **A maximum of zero is commonly rejected** on length and count rules, as a dead field that nothing
  can satisfy — confirm this against the adapter's documented behaviour rather than assuming it.
- **Do not nest one quantifier inside another** in a regex. Match time can double with every
  character the visitor types — where the adapter documents that the regex runs client-side on
  blur, this cost lands in the visitor's browser the moment they leave the field; confirm where and
  when it runs before assuming that timing.
- **The adapter must document where a regex runs.** Where it runs on the server only, a complaint
  appears after submitting rather than on blur.

### 4.1 Error codes

The adapter must document the machine codes its surfaces can report, and what each one means.
**Match on the code, never on the message** where the adapter documents that a code exists —
messages are localised and get reworded. Validate that inventory against the adapter's own evidence
before relying on it; do not assume a code exists because a failure was visible.

### 4.2 What a submitted value may be

The adapter must document and validate accepted submitted values and the actual enforcement model,
including whether checks depend on field type, configured rules, payload contents or another
documented input. Establish where and when each check applies, any exceptions and absent checks;
do not infer type-only enforcement or guarantees on every form. List membership and size ceilings
are capabilities to investigate, not universally enforced constraints.

### 4.3 Publishing is stricter than saving

The adapter must document whether it distinguishes saving from publishing, and if so, whether saving
stays more permissive than publishing. Where it documents that a draft must always be saveable while
publishing asks a harder question, a fail-open condition in a schema — an enum whose options match
nothing, a regex that never compiles, a condition watching a field that no longer exists — can be the
right call at submit time and the wrong thing to discover after publishing. The adapter must document
which conditions are errors only when the form's resulting status is published.

## 5. Conditional logic

**Internal canonical grammar:** a condition is a relationship between two fields, and both must
exist in the canonical document. This is the boundary of the project's grammar, not a universal
provider or runtime limit. Adapters must document and validate how supported external conditions
map to it and report unsupported mappings or losses.

The adapter must document what happens when a condition names a field the document does not contain
— confirm whether it is rejected or silently ignored rather than assuming either. This external
diagnostic does not replace the canonical requirement that both referenced fields exist.

**Internal canonical dependency/security invariant:** no condition may read a disabled field's value
when that value is excluded from submission. This is a normative restriction on canonical
dependencies, not an inference about an external evaluator's access to retained values. Adapters
must document and validate their mapping to this invariant, including unsupported mappings or losses;
it establishes no provider/runtime behaviour by itself.

The adapter must document its condition operators and their payloads, and its documented behaviour
governs the following:

- **The adapter must document whether a hidden field is validated and submitted.** Where it
  documents that it is not, requiring a field that a condition hides will not block the submission.
- **The adapter must document and validate whether a disabled field's value is submitted and whether
  conditions can read it**, including the evaluator's location and value source. Submission
  omission alone does not establish external unreadability; map the documented behaviour to the
  internal canonical dependency invariant above.
- **The adapter must document what an unreadable condition does to the field it targets.** Where it
  documents that the field is left visible and enabled, a malformed rule that hid a field would be a
  way to drop a required field out of the form entirely.
- **The adapter must document whether one unreadable condition makes its whole group unreadable**,
  or whether the rest can still be evaluated independently.

### 5.1 Disabling instead of hiding

Document and validate whether the adapter supports conditional disabling and, if so, its operators,
operands, control behaviour, visibility, validation and submitted-value handling. Do not infer that
these match hiding, or that the field remains on screen. Prefer disabling for **discoverability**
only when evidence confirms that the supported behaviour meets that goal; otherwise report the
limitation. Section 5's inventory also applies to the actual disabling interface.

## 6. Layout

Field width/grid is optional presentation metadata in the internal canonical schema, not a required
provider capability or a fixed structure/styling boundary. Each adapter must declare whether it can
represent or transform the hint, or ignore it with a diagnostic, and document and validate any loss.
Establish whether external width/grid controls exist, their actual control layer and, where supported,
their breakpoint behaviour before using them — see [embed-styling.md](./embed-styling.md) section 1.

## 7. Consent

If the adapter supports a form-level consent line, it must document it, including:

- **Whether it travels as its own boolean rather than as a field** — where it does, the rendered
  input has no name and never appears in the field list.
- **What a form with no consent line sends**, and whether that lets the server tell "never asked"
  apart from "asked and refused".
- **Where a required consent is enforced.** Where the adapter documents server-side enforcement, an
  embed-side check as well tells the visitor before the round trip; do not assume the embed check
  alone is sufficient.

## 8. Translations

Document and validate whether the adapter supports a translation overlay and its actual scope:
which text, structure or other properties it may change, which it preserves and what is unsupported.
Do not infer a text-only operation from overlay existence. For a supported overlay, also establish:

- **The adapter must document what a name that matches nothing in the document does.** Where it
  documents that entries pointing at fields or option values that do not exist are dropped on
  import with a warning, confirm that before assuming it is always the outcome.
- **The adapter must document how it renders a success message** — for example, some set it with
  `textContent`, which holds no HTML and collapses a newline to a space. Confirm the adapter's
  documented behaviour before assuming markup or line breaks survive.
- **The adapter must document the severity of a key the overlay does not read** — do not assume it
  is a warning rather than an error, or that it is dropped only on the first save, without
  confirming that behaviour.

## 9. CSS classes the embed emits

The adapter must document the set of classes it emits and must document — with evidence — whether it
ships styles of its own; do not assume the answer is "no" before that evidence confirms it. Where it
ships none, you style those classes yourself.
For anything beyond the class names — the DOM tree,
the per-type markup, the state classes and the traps that silently break a form — read
[embed-styling.md](./embed-styling.md). That file is the one to hand to whatever writes the CSS.

## 10. From schema to a working embed

1. **Create the draft** through the adapter's documented import mechanism, whatever that mechanism
   turns out to be. Confirm how errors are surfaced and what unlocks the import.
2. **Check it** by running the real runtime against your fields.
3. **Fill in delivery**, wherever the adapter documents recipients, from address, subject, success
   mode and success message living. Confirm whether a draft saves without them and whether
   publishing requires them, rather than assuming that split.
4. **Publish**, if the adapter documents a draft/published status gate — confirm a draft is not
   served until published rather than assuming it.
5. **Verify the domain**, if the adapter documents restricting submissions to a verified domain of
   the owning company — confirm this requirement exists before relying on it.
6. **Embed**, using whatever mechanism the adapter documents for handing you the embed — a snippet
   from its embed UI is one possible shape, not a guaranteed one.

Steps 4 and 5 are the ones that catch people out. Importing the schema gets you a correct form; it
does not get you a live one.

### 10.1 Editing an existing form as a schema

If the adapter can export a form back to its schema, it must document the round-trip, including:

- **Whether replace is one undo step** — confirm whether nothing reaches the server until you save.
- **Whether what comes out is normalised rather than the bytes that went in** — where the export
  emits the adapter's canonical shape, confirm whether it drops any property the contract does not
  define for that field type.
- **Whether a preset survives the trip** — do not assume it is expanded into real options on import
  with the id discarded without confirming that behaviour.

## 11. Every message the importer can produce

The adapter must document whether each check carries a stable code. Where it does, the sentence
shown beside it is written for a person reading the import panel and may get reworded, while the
code is the part meant not to — match on the code where the adapter documents that it is stable.

The adapter must document its complete message inventory — including which severities exist and
what each one does — and confirm, with evidence, that this inventory and the importer's own code
list agree, rather than assuming they are kept in sync.
