---
name: seo-research
description: "Use for keyword research, search-intent mapping, content-gap analysis, SERP or competitor research, topic prioritization, or deciding which questions a page should answer — before writing or restructuring pages. Not for internal on-site search (→ static-site-search) and not for implementing head tags or JSON-LD once the page map exists (→ static-site-seo)."
---

# SEO research

## 1. Required inputs

Before any research: market (country), language, the offer, the audience, the conversion goal, and
the existing URLs. If the brief doesn't give these, ask the site owner or record them as an explicit
assumption — never guess silently. Research each locale separately: a translated page is a hypothesis
about that market, not equivalent demand to the source locale.

## 2. Evidence tiers — rank findings by where they came from

From strongest to weakest, and label every finding with its tier:

1. **Search Console** — only with the owner's granted access. Record the property, date range,
   country, device and query/page dimensions used
   (<https://developers.google.com/search/docs/monitor-debug/search-console-start>).
2. **Google Trends** — a *relative* index, 0–100, scaled per geography and time range
   (<https://developers.google.com/search/docs/monitor-debug/trends-start>;
   <https://support.google.com/trends/answer/4365533>). Record query, geography, period, category.
   **Never convert a Trends index into a monthly search-volume number** — the same interest score in
   two markets does not mean the same volume, and Trends explicitly divides each point by that
   geography/period's total searches. Analyze markets separately.
3. **Public SERP observations** — record the actual date, query, country/language setting, result URL
   and page type. Results vary by location and signed-in user; a single snapshot is evidence of what
   you saw, not a stable ranking.
4. **Assumption** — explicitly labeled as such, with the reasoning.

Never state a search volume, keyword difficulty, ranking position, or CPC without naming the tool and
the date the number came from. If a third-party tool supplied a figure, name the tool, the date, and
label it an estimate — never present it as a measured fact.

## 3. Competitor labeling

Distinguish, for every competitor recorded:

- **Commercial competitor** — sells the same offer to the same audience.
- **SERP competitor** — any page competing for the query regardless of business model (a publisher,
  a directory, a forum thread). Both are useful; conflating them misreads the market.

## 4. Consolidate, don't fragment

Group keyword variants into one page per primary intent. Prefer updating an existing page that
already matches the intent over creating a near-duplicate new page — two pages targeting the same
intent compete with each other in the same results.

## 5. No speculative machine-readable files

Do not propose "for AI" files, markup, or a Markdown mirror of a page without a demonstrated need.
Google's own guidance: *"You don't need to create new machine readable files, AI text files, markup,
or Markdown to appear in Google Search"*, and an `llms.txt` *"will neither harm nor help … as Google
Search ignores them"*
(<https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>, updated 2026-07-10,
checked 2026-09-28). If a stakeholder asks for one anyway, quote this guidance back rather than
building it silently.

## 6. Output

One table:

`topic | intent | evidence (source + date) | observed competitors (URL, commercial/SERP) | existing URL | action | confidence`

Plus an explicit **Unknowns** list. If no live search access or Search Console is available for this
task, label the entire table a hypothesis rather than presenting it as researched.

## 7. External research/catalog skills

Do not install a third-party "SEO catalog" skill on the strength of its popularity. If proposing one,
record: the official repository, a pinned revision (never `main`), its licence, its maintenance
activity, whether it runs executable code, and what permissions it would need. Prefer this procedure
over adopting an unvetted one.

## Hand-off / evidence

The output table and Unknowns list go to two places: `static-site-seo` for the routes/head decisions
the page map implies, and `faq-content` for which questions belong in an on-page FAQ (not every
research finding becomes a FAQ entry — `faq-content` §1 decides that). Note explicitly which findings
are hypothesis-only versus evidenced, and at what tier.

## Primary references

- Search Console — <https://developers.google.com/search/docs/monitor-debug/search-console-start> (checked 2026-09-28)
- Google Trends — <https://developers.google.com/search/docs/monitor-debug/trends-start> (checked 2026-09-28)
- Trends FAQ (scaling) — <https://support.google.com/trends/answer/4365533> (checked 2026-09-28)
- AI optimization guide — <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide> (checked 2026-09-28)
- Helpful content — <https://developers.google.com/search/docs/fundamentals/creating-helpful-content> (checked 2026-09-28)
