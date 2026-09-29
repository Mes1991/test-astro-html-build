---
name: faq-content
description: "Use when writing, editing, translating, removing or auditing an on-page FAQ section — deciding whether a question deserves visible content, adding or removing FAQPage JSON-LD, or checking that FAQ markup still matches what the page shows. Not for choosing a schema type other than FAQPage (→ static-site-seo/references/seo-schema.md) and not for finding which questions to answer in the first place (→ seo-research)."
---

# FAQ content

## 1. Does the question earn its place

A question deserves visible content only when all of these hold:

- it is a real customer/visitor question, evidenced by support tickets, sales conversations,
  Search Console queries, or research (see `seo-research`) — not a guess at what people might ask;
- the page can answer it accurately right now, with facts the business actually has;
- the answer helps a decision on *that* page — not a general fact that belongs elsewhere;
- it is not a keyword variant of a question already answered on the site — one canonical place per
  question, never near-duplicate FAQ blocks on different pages competing for the same query.

If a question fails any of these, do not add it. A thin FAQ is worse than no FAQ: it pads the page
without helping the reader.

## 2. Never invent the answer

Never fabricate a price, a policy, a guarantee, a review or rating, a location, a credential, or any
other claim to business authority. If the fact the answer needs is missing, leave a clearly marked
request for the site owner in the handover — do not fill the gap with something plausible.

## 3. Whether FAQPage JSON-LD is worth adding

`static-site-seo/references/seo-schema.md` owns every rule about JSON-LD types and properties —
read its FAQPage section before writing a block, and do not restate its rules here. Two facts specific
to this decision, current as of 2026-09-28:

- Google's FAQ **rich result** ended on 7 May 2026 (Search updates:
  <https://developers.google.com/search/updates>) — never promise an accordion in results, whether
  you keep existing FAQPage markup or add new markup. `FAQPage` is still a valid Schema.org type and
  keeping it is optional, not deprecated.
- `QAPage` is a different page class — user-submitted answers, the shape of a forum thread
  (<https://developers.google.com/search/docs/appearance/structured-data/qapage>). Never "migrate"
  an editorial FAQ to `QAPage`; it describes a page that does not exist.

## 4. This template's binding

- **Single source per locale:** `src/lib/seo/data/faq.ts` (`FAQ_ENTRIES` / `FAQ_ENTRIES_ES`, read
  through `getFaqEntries(locale)`). The visible list (`src/components/home/FAQ.astro`) and the
  JSON-LD builder (`src/lib/seo/schemas/faqPage.ts` → `buildFaqPage`, emitted through
  `src/components/seo/Schema.astro`) must both read from this same array — never hand-write a second
  copy of a question/answer pair anywhere else. `buildFaqPage` returns `null` on an empty list, which
  is correct: an empty `FAQPage` block is itself an SEO error.
- **en/es key parity** while the site stays bilingual — see `CLAUDE.md` rule 4. Adding a question to
  one locale's array without its translation in the other breaks parity.
- Reuse the existing builders in `src/lib/seo/schemas/*.ts` and `serializeJsonLd`
  (`src/lib/seo/json-ld.ts`) for any other schema this task touches; never hand-roll `JSON.stringify`
  into a `<script>` tag — that is exactly how unescaped content becomes an injection.
- **Visible means reachable without leaving the page, and — per this template's core invariant that
  content works without JavaScript — reachable without JS too.** Known debt: `FAQ.astro` currently
  collapses answers 2..n with `max-height:0; overflow:hidden` (`src/components/home/FAQ.astro`
  lines ~49–56) and opens them only through a JS click handler, so those answers are unreachable with
  JavaScript disabled — that conflicts with the invariant. `scripts/seo-faq-audit.mjs` cannot see this
  (CSS-class hiding is a documented false negative, see its header comment). If you touch this
  component, prefer `<details>`/`<summary>` or another disclosure that is reachable without JS; fixing
  the existing debt is not required by every FAQ edit, but do not add a new instance of the same
  pattern.

## 5. Verification

Run, in order, and report each one's outcome separately:

1. `bun run test`
2. `bun run check`
3. `bun run build` — the `seo-lint` integration fails the build on `LD_PARSE_ERROR`, a missing
   `@context`, or an `inLanguage` mismatch (syntax layer only — see `static-site-seo/SKILL.md`).
4. `node scripts/seo-faq-audit.mjs dist` — a post-build editorial coherence check, **not** a schema
   validator. Its own header comment documents four layers: syntax (owned by seo-lint, not rechecked
   here), shape, content coherence (checked), vocabulary (not validated), Google eligibility (not
   evaluated). It has known false negatives: CSS-class hiding (see §4) and JS-injected JSON-LD, both
   invisible to a static HTML parser. Report its exit code and findings as their own layer, not folded
   into the build result.

Optionally, on one representative published URL: Rich Results Test — only for features it still
supports, FAQPage is not one — and validator.schema.org for vocabulary. Report each as a separate,
named outcome; never imply either one covers what the other doesn't.

## Hand-off / evidence

Report: which page(s) and locale(s) changed; the source for every business claim in a new or edited
answer (or the explicit gap left for the owner); whether FAQPage JSON-LD was added, kept, or removed,
and why; the four verification results above with their individual outcomes; any known-debt item
(§4) touched or left as-is.

## Primary references

- FAQ rich result retirement — <https://developers.google.com/search/updates> (checked 2026-09-28)
- QAPage — <https://developers.google.com/search/docs/appearance/structured-data/qapage> (checked 2026-09-28)
- Structured data policies — <https://developers.google.com/search/docs/appearance/structured-data/sd-policies> (checked 2026-09-28)
- `static-site-seo/references/seo-schema.md` — the JSON-LD contract this skill defers to
