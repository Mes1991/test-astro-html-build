# Off-site signals — links, mentions and paid traffic

## Start here

This document owns everything that happens **outside the files you upload**: links pointing at the
site, mentions of the brand elsewhere, paid traffic landing on it, and what to check after a change
ships.

Read this one differently from the others. Every other document in this set states rules a script
can verify against a local directory. **Almost nothing here is checkable that way**, because the
subject is other people's websites. So this document is explicit about which lines are rules and
which are heuristics, and it never pretends a correlation is a mechanism.

Boundaries:

| You are asking | Read |
|---|---|
| how pages inside the site link to each other | [seo-site.md](./seo-site.md) |
| what the link text on a page should say | [seo-page.md](./seo-page.md) |
| what markup an author or organisation needs | [seo-schema.md](./seo-schema.md) |

## 1. What an inbound link is, mechanically

A link from another site is a vote you did not cast. That is the whole reason it counts, and the
whole reason buying one is a policy violation rather than a shortcut.

### The `rel` values, and who sets them

| Value | Meaning | Who writes it |
|---|---|---|
| *(absent)* | an ordinary endorsement | the linking site |
| `rel="nofollow"` | "I am not vouching for this" | the linking site |
| `rel="sponsored"` | paid or compensated placement | **required** on any link you paid for, in any form |
| `rel="ugc"` | user-generated: a comment, a forum post | the linking site's platform |

Two rules that are yours, not theirs:

- **A link you paid for — money, product, or an affiliate arrangement — must carry `sponsored` or
  `nofollow`.** This applies to links you place on other sites, and to outbound links on your own
  pages. Undisclosed paid links are a link-spam violation for both ends.
- **`nofollow` is a hint, not a wall.** It does not guarantee the link is ignored, and it is not a
  way to control which of your own pages get crawled. To keep a page out of the index use the
  `noindex` rule in [seo-page.md](./seo-page.md); to keep a crawler out of a directory use
  `robots.txt` in [seo-site.md](./seo-site.md).

### The anchor text of links you can influence

When you *can* influence the anchor — a directory listing, a partner page, a profile — the shape of
the whole profile matters more than any single link. A natural profile is mostly branded and naked
URLs; a profile that is mostly exact-match keywords is the signature of a paid campaign.

Directional targets, **heuristics rather than thresholds**:

| Anchor kind | Healthy share | Review it above |
|---|---|---|
| Branded (`Acme Roofing`) | 30–50% | — |
| Naked URL (`example.com`) | 15–25% | — |
| Generic (`click here`, `este sitio`) | 10–20% | — |
| Exact-match keyword (`roof repair miami`) | 3–10% | **15%** |
| Partial match | 5–15% | 25% |

Treat the right column as a prompt to look, not a verdict. A site with forty links and eight
exact-match anchors is over the line arithmetically and may be entirely organic.

## 2. Judging a link profile

### What looks wrong

**High risk — act without waiting for a ranking drop:**

- Links from a private blog network: unrelated sites, same hosting fingerprint, same template, all
  linking outward and to each other.
- A single domain contributing 100% exact-match anchors.
- Links from domains that are themselves deindexed or penalised.
- Bulk directory submissions — dozens of listings appearing in one window.
- Link farms: pages carrying thousands of outbound links.
- Sitewide footer or sidebar links across an unrelated site, which is what a paid arrangement looks
  like from the outside.

**Worth a look, usually fine:**

- Links from an unrelated niche. Sometimes a genuine mention.
- Reciprocal links — A links to B, B links to A. Normal between partners; a pattern across dozens of
  domains is not.
- Links from pages under ~100 words.
- One domain contributing more than about a quarter of all inbound links: not toxic, but it means the
  profile has a single point of failure.

Domain-level tells: a heavy skew toward `.xyz` / `.info`, or 80%+ of links from countries the
business does not operate in.

### Disavowing, and why usually not

The disavow file tells Google to ignore specific links. **Reach for it rarely.** Google discounts
most spam automatically, and a disavow file listing domains that were only ever harmless removes
links that were helping. The honest test: *did I or someone paid on my behalf build these?* If yes,
disavow and stop. If they simply appeared, leave them.

There is no version of this that is checkable from the repo. It requires a backlink tool, and the
numbers any two tools report will differ.

## 3. Mentions without links

A mention of the brand — named in a video, a forum thread, an article, a comparison — carries weight
that a raw link does not, and it is the part of off-site work that has changed most.

**The directional finding**, and it is a correlation from one vendor's dataset rather than a
mechanism anyone has confirmed: brand mentions track AI-answer visibility considerably more closely
than backlink metrics do, with YouTube and Reddit mentions the strongest of the platforms measured
(Ahrefs, December 2025, ~75,000 brands).

Take from that a priority order, not a formula:

1. **Be nameable.** One consistent brand string everywhere. `Acme Roofing`, not `Acme Roofing LLC`
   in one place and `AcmeRoofing` in another.
2. **Be present where answers are assembled** — the places AI answer engines lean on heavily:
   community discussion and video, not press-release wires.
3. **Be verifiable.** An author with a real byline, a real profile, and `sameAs` links in the markup
   (see [seo-schema.md](./seo-schema.md)) is an entity that can be corroborated. One that exists only
   on your own site is not.

What not to conclude: that links stopped mattering, or that a mention can be manufactured at volume.
Both readings end in the spam patterns in section 2.

## 4. Paid traffic, and how it collides with organic

Ads and SEO share exactly one thing: the URL. That is where they break each other.

### Tracking parameters

A campaign URL looks like `https://example.com/servicios/?utm_source=google&utm_medium=cpc&utm_campaign=techos`.
On a static site this is usually harmless, and for one specific reason: the canonical is a hardcoded
tag in the HTML, so every parameter variant of a page already declares the same clean URL. Keep it
that way.

| Rule | Why |
|---|---|
| The canonical on a landing page is the **clean URL**, no parameters | otherwise each campaign mints a duplicate of the page |
| No parameterised URL appears in `sitemap.xml` | the sitemap submits canonical URLs only (rule in [seo-site.md](./seo-site.md)) |
| Never `Disallow: /*?utm` in `robots.txt` | it blocks crawling of a URL that is being advertised, and a blocked landing page cannot be assessed |
| Ads must reach the landing page | `AdsBot-Google` needs its own `robots.txt` group; it does not inherit the `User-agent: *` rules. Blocking it degrades landing-page assessment. The rule is in [seo-site.md](./seo-site.md) §2 |
| An `&` in a URL inside HTML is written `&amp;` | the XML and HTML escaping rules in [seo-page.md](./seo-page.md) apply to campaign URLs too |

### PPC-only landing pages

A page built purely for a campaign — no navigation, one call to action, often a near-duplicate of an
organic page — has to be one thing or the other, decided deliberately:

- **Paid only**: `noindex`, absent from `sitemap.xml`, and not linked from the navigation. It still
  needs to be crawlable for ad assessment, so `noindex` — never a `robots.txt` block.
- **Both**: then it is a real page. It gets its own subject, its own canonical, and it must not
  duplicate an existing page. Two pages competing for one query is the most common self-inflicted
  wound in this whole set.

What you cannot do is leave it indexable *and* duplicated. That is the scenario where a campaign
quietly cannibalises the organic page it was meant to support.

## 5. Verifying, after something ships

Off-site is not verifiable locally, so this section is the deliberate exception: it names external
surfaces rather than a command.

| Check | Where | What a bad answer looks like |
|---|---|---|
| The page is indexed at all | Search Console → URL Inspection | "Excluded", or a Google-chosen canonical that is not the one you declared |
| The sitemap was read | Search Console → Sitemaps | a submitted count far below the file's entry count |
| Clicks and impressions moved | Search Console → Search results | impressions up, clicks flat: the title and description are the suspects, not the ranking |
| AI-answer surfaces are being reached | Search Console → the generative report (impressions only; no clicks or CTR) | zero impressions on pages built for it |
| Traffic arriving from AI assistants | GA4 channel grouping | worth separating; it does not behave like search traffic |

**A Google-chosen canonical that disagrees with yours is the finding worth acting on.** It means the
page said one thing and Google concluded another, and no local check can see it — the local script
verifies the canonical is coherent with the file tree, not that anyone believed it.

## 6. What this contract does not cover

- **Ranking.** Nothing here promises a position. These are the signals; the auction is not ours.
- **Outreach, content marketing, PR.** Getting a mention is a business activity, not a markup rule.
- **Any number a tool reports.** Two backlink tools will disagree on the same domain, sometimes by
  an order of magnitude. Use one consistently and watch its trend rather than its absolute value.
- **Automated verification.** No part of this document is checked by the SEO lint tool, and it cannot
  be — the subject lives on other people's servers.
