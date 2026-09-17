# Site manifest — one file for a site of many pages

Every other document here is about one page, one form, or one decision. This one is about the
thirty-ninth page — and about the fact that building it as though it were the first is what makes a
batch expensive.

Hand it to whatever is going to build more pages than a person can hold in their head.

## Start here

**The output is one JSON file at the project root.** It holds the routes, what groups them, which
one of each group was approved, where the design came from, which form each page carries, and what
has been verified. Section 6 is a complete example.

**Why a file rather than a habit.** A batch built page-by-page repeats the same decisions with
small unrecorded variations, and there is no moment at which anybody can see the whole. The
specific failures are all the same shape:

- the same section built four slightly different ways, because four passes measured it separately;
- a difference on one page that is either an approved exception or a mistake, and nothing says
  which;
- a shared component corrected for one page, breaking three, discovered by the client;
- five near-identical forms where one would have done, because nobody was looking at the set;
- eleven pages verified, twenty-eight not, and no way to tell them apart.

**None of those is a hard problem. All of them are bookkeeping**, and bookkeeping without a ledger
is memory.

**What this file is not.** It is not a build input, not a router, not a sitemap. Nothing reads it at
runtime and no page is generated from it. It is a record that a human and an agent can both check,
and its only power is that a claim in it can be compared against the site.

## 1. Families, and the one that gets approved

**A family is a set of pages that should be built the same way.** Not pages that look similar —
pages whose differences are content rather than structure.

The whole method is three steps:

1. **Group the routes into families.**
2. **Build ONE page from each family, completely**, through every step the router names, and get it
   approved.
3. **Produce the rest of the family as content plus declared exceptions.**

**Step 2 is the one people skip and it is the one that pays.** Building all of a family at once
means an error is made thirty-nine times before anyone sees it, and the correction is thirty-nine
corrections. Building one first means the same error is made once, and the approval is a real gate
rather than a formality — because the thing being approved is small enough to actually look at.

**Approval is a human's, and it is recorded with a date.** An approval nobody can point at is a
step that was skipped.

### Seeding the families

If the pages came from a component library — a generated set, in the sense of [design-source.md](../../design-ingestion/references/design-source.md)
section 0 — **the families are already there.** Pages built from the same component set group
themselves, and reading that set off the design is far cheaper and far more reliable than opening
thirty-nine pages and deciding which look alike.

**Seed from the component set, then confirm by looking.** The seed is a hypothesis and it is a very
good one; what it cannot see is a page that shares a template and genuinely needs to behave
differently.

If the pages were authored individually there is no seed, and grouping is a judgement made by
looking. Record it either way — the grouping is the load-bearing decision of the whole batch, and
"these four are a family" needs to be a claim somebody can disagree with.

## 2. An exception is a decision, not a difference

**This is the field that makes a batch of thirty-nine reviewable, and it is the one most likely to
be left empty.**

A page that differs from its family's representative is in one of two states, and they are
indistinguishable by looking:

- **an exception** — somebody decided this page differs, here, for this reason;
- **a mistake** — this page came out differently and nobody noticed.

A reviewer facing an undocumented difference has to reconstruct which, for every difference, on
every page. That is the work the whole batch was supposed to avoid.

**So every intentional departure is written down, with its reason**, and anything not written down
is a defect by definition. That rule is only fair because the cost of writing one is a line.

**Never copy a measurement between pages.** If a value is shared it belongs to the family and lives
in the family's own tokens or components; if it is not shared it is an exception and gets a line.
Copying a number from page four into page seventeen creates a third thing — a value that is neither
inherited nor declared, and that survives every future change to the family without being updated.

## 3. Forms: one per unique form, not one per page

**Define a form once per genuinely distinct form, and reuse it across every page that needs it.**
Ten landing pages with the same three fields and the same recipient are one form.

**Reuse when** the fields, the validation and the delivery are equivalent.

**Create a separate one when** any of those changes: different fields, different rules, a different
consent statement, or a different destination. **Write the reason in the manifest.** Six weeks later
"these two are different because the second needs a consent checkbox" is a decision, and two
near-identical forms with no note is an accident nobody dares consolidate.

### Attribution without duplication

The obvious reason to duplicate a form is to know which page it came from. That is not a reason,
because there is a field for it.

Add a `hidden` field carrying the origin — `landing_slug`, `campaign`, whatever the reporting needs
— and have the host page write its value before the visitor submits. [form-schema.md](../../form-slot/references/form-schema.md) section 4
owns the field: the adapter's documented default sets it, the host page may overwrite it, and it is
read at submit time.

**One thing to check, so it is not read as a defect:** the adapter must document how its builder
treats a `hidden` field. Where it documents that `hidden` is outside the builder palette, importing
a schema that uses it may produce a warning rather than an error — the type exists for exactly this,
and the warning is there because a hidden field is also how somebody accidentally ships an unfillable
required field. **Where the adapter documents that the import succeeds, proceed.**
Reading that warning as a rejection is how this strategy gets abandoned in favour of duplicating the
form, which is the outcome it exists to prevent.

**Styling is separate from identity.** Two pages sharing a form and needing it to look different is
a CSS question, not a reason for a second form — the same adapter classes take different styles per
family. [embed-styling.md](../../form-slot/references/embed-styling.md) owns that.

## 4. Verification state, per route

A route is not `done`. It has a verdict per category, because the categories fail separately and a
single word hides which one.

[visual-fidelity.md](../../visual-gate/references/visual-fidelity.md) section 7 owns the categories and what makes each pass. This file only records
them, so that "which pages are actually finished" is a question with an answer.

**Two rules that keep the record honest:**

- **A category that applies and was not checked is not blank, it is `NEEDS WORK`.** Blank reads as
  fine to everyone downstream.
- **Nothing is recorded here that was not actually done.** A manifest of claims nobody made is
  worse than no manifest, because it stops the next person checking.

**When a shared component changes, the routes that used it go back to unverified** — at minimum one
representative per affected family, per [visual-fidelity.md](../../visual-gate/references/visual-fidelity.md) section 6. A verification is a
statement about a version of the page, and the page moved.

## 5. The fields

| Field | Holds |
|---|---|
| `schemaVersion` | this contract's major version, so a reader can tell an old manifest from a new one |
| `project` | the site's name and its production origin |
| `viewports` | the widths every route is checked at — the matrix from [visual-fidelity.md](../../visual-gate/references/visual-fidelity.md) section 2 |
| `designSource` | where the design came from, and its **provenance** per [design-source.md](../../design-ingestion/references/design-source.md) section 0: `authored`, `generated`, `generated-then-edited`, `export`, or `live-page`. Plus which input was ranked first, and why. Optional on a route, where it replaces the top-level block whole |
| `families` | each family's id, what it is, its approved representative route, and the date of that approval |
| `forms` | each unique form: an id, its fields in one sentence, where its schema lives, which provider form it became, and — when there is more than one similar form — why it is separate |
| `routes` | one entry per page: its path, its family, its design node, its assigned form, its declared exceptions, and its verification state |

**`designSource` sits at the top level, and a route may override it.** The top-level one is the
batch's answer and applies to every route that does not say otherwise; a route carrying its own
replaces it **whole**, rather than merging field by field.

Inheritance rather than repetition, and the choice is not cosmetic. A batch is usually uniform, so
requiring the block on all thirty-nine routes would mean thirty-nine copies of one answer — and a
value copied thirty-nine times is a value that gets updated in thirty-eight of them. What has to be
visible is the *exception*, which is the page whose reference came from somewhere else and is
therefore the page most likely to be compared against the wrong thing.

**Replaced whole rather than merged**, because a half-inherited provenance is the worst of both: a
route saying `provenance: "authored"` while silently keeping the batch's `note` about a component
library describes a file that does not exist.

## 6. A complete example

```json
{
  "schemaVersion": 1,
  "project": { "name": "Example Clinics", "origin": "https://example.com" },
  "viewports": [375, 768, 1440],
  "designSource": {
    "kind": "design-file",
    "provenance": "generated-then-edited",
    "note": "Component-library pages imported, then the hero and palette were reworked by hand. Edited parts are decisions; untouched sections are library defaults.",
    "rankedFirst": "design-file",
    "rankedFirstBecause": "It is the only input carrying the reworked palette. Copy comes from the brief."
  },
  "families": [
    {
      "id": "service-landing",
      "what": "One service, one form, three proof sections",
      "representative": "/services/knee-surgery",
      "approvedOn": "2026-09-01",
      "approvedBy": "client"
    },
    {
      "id": "location",
      "what": "One clinic: address, hours, map, contact form",
      "representative": "/locations/madrid",
      "approvedOn": null,
      "approvedBy": null
    }
  ],
  "forms": [
    {
      "id": "service-enquiry",
      "fields": "name, email, phone, message, landing_slug (hidden)",
      "schema": "forms/service-enquiry.json",
      "providerForm": "Service enquiry",
      "separateBecause": null
    },
    {
      "id": "location-callback",
      "fields": "name, phone, preferred_time, consent, landing_slug (hidden)",
      "schema": "forms/location-callback.json",
      "providerForm": "Location callback",
      "separateBecause": "Carries a consent checkbox the enquiry form does not, and goes to the clinic rather than to central intake."
    }
  ],
  "routes": [
    {
      "path": "/services/knee-surgery",
      "family": "service-landing",
      "isRepresentative": true,
      "designNode": "Services / Knee surgery",
      "form": "service-enquiry",
      "exceptions": [],
      "verified": {
        "structure": "PASS",
        "geometry": "PASS",
        "typography": "PASS",
        "assets": "PASS",
        "referenceViewport": "PASS",
        "responsive": "PASS",
        "accessibility": "PASS",
        "seo": "PASS"
      }
    },
    {
      "path": "/services/hip-replacement",
      "family": "service-landing",
      "isRepresentative": false,
      "designNode": "Services / Hip replacement",
      "designSource": {
        "kind": "flat-image",
        "provenance": "export",
        "note": "The Figma frame for this page was never finished. Reference is a PNG the client sent, so no value is measured off it.",
        "rankedFirst": "written-brief",
        "rankedFirstBecause": "A render at an unknown zoom cannot settle spacing. Structure follows the approved representative; the image only settles section order."
      },
      "form": "service-enquiry",
      "exceptions": [
        {
          "what": "Two proof sections instead of three",
          "why": "No third testimonial exists yet. Agreed with the client on 2026-09-01; revisit when copy arrives."
        }
      ],
      "verified": {
        "structure": "PASS",
        "geometry": "PASS",
        "typography": "PASS",
        "assets": "PASS",
        "referenceViewport": "PASS",
        "responsive": "NEEDS WORK",
        "accessibility": "NEEDS WORK",
        "seo": "PASS"
      }
    }
  ]
}
```

**Read the second route rather than the first.** It is the one carrying every field that earns its
place: a `designSource` of its own, because its reference is a flat image while the batch's is a
design file; a difference that is approved and dated rather than mysterious; and two categories that
are honestly not done.

**A manifest where every route looks like the first one is a manifest nobody is using.** The first
route is what a page looks like when everything went as planned, and nothing in this contract exists
for that page.

## 7. What this document cannot do

- **It cannot tell you the families are right.** Grouping is a judgement. A wrong grouping produces
  a representative that does not represent, and every page in the family inherits the error.
- **It cannot tell you a recorded verdict is true.** Nothing validates this file against the site.
  It is a ledger, and a ledger is only worth what the person writing it is.
- **It does not build anything.** No page is generated from it and nothing reads it at runtime.
- **It cannot see a route that is missing from it.** A page nobody added is a page with no family,
  no verification and no form — and the manifest looks complete.
- **It says nothing about whether the pages are good.** It records that they were built the same
  way and checked.
