# Page SEO — the per-page contract

This is the complete contract for what one HTML page must contain to be indexed correctly and to be
usable as an answer: the `<head>` block, the structure of the body, the markup that decides how fast
the page feels, and the shape the content needs. Hand this file to whatever writes the pages.

**This document does not cover JSON-LD.** Structured data is its own contract,
[seo-schema.md](./seo-schema.md) — it used to live here and no longer does.

The site-level half — `robots.txt`, `sitemap.xml`, redirects and delivery — is
[seo-site.md](./seo-site.md). It defines the canonical origin that every URL in this file quotes, so
read its section 1 first.

## Start here

**What you are producing:** a `<head>` block per page, plus a set of rules about the body. No plugin,
no build step, no configuration. Every signal in this contract is markup in the file.

**Write it in four passes.** Each is useful on its own, so stop when the page is good enough:

1. **Required.** `lang`, charset, viewport, `<title>`, description, canonical (section 1). Without
   these a page is either not indexed well or indexed as a duplicate of another.
2. **Social.** Open Graph and the Twitter card (section 4). This is what a link looks like when
   somebody shares it, and it has nothing to do with ranking.
3. **Body and speed.** The outline, the images, and the handful of attributes that decide the
   Core Web Vitals numbers (sections 5 and 6).
4. **Answer shape.** How the content has to be laid out to be quotable by a search result or an AI
   answer (section 7). This is the only pass that touches the writing.

**Before you write a line, know these three:**

- **Every page needs its OWN title, description and canonical.** A generated site's default failure
  is one skeleton copied across twenty pages with three fields left unchanged. That does not produce
  a weak site — it produces one page (section 9).
- **A wrong canonical is the most destructive single line available here.** Pointing every page's
  canonical at the homepage tells Google that no other page exists. The pages look perfect, load
  fine, and vanish from search (section 3).
- **`noindex` is the only thing that reliably keeps a page out of results.** `robots.txt` cannot do
  it, and a page carrying `noindex` must also be absent from the sitemap (section 8).

## 1. The required head

A complete, correct head. Everything here is either required or worth the two lines it costs:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Reparación de techos en Miami | Acme Roofing</title>
  <meta name="description" content="Reparación e instalación de techos en Miami-Dade. Presupuesto sin cargo en 24 horas y 20 años de garantía por escrito.">
  <link rel="canonical" href="https://example.com/es/reparacion-de-techos/">

  <link rel="alternate" hreflang="en" href="https://example.com/roof-repair/">
  <link rel="alternate" hreflang="es" href="https://example.com/es/reparacion-de-techos/">
  <link rel="alternate" hreflang="x-default" href="https://example.com/roof-repair/">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Acme Roofing">
  <meta property="og:locale" content="es_US">
  <meta property="og:locale:alternate" content="en_US">
  <meta property="og:title" content="Reparación de techos en Miami | Acme Roofing">
  <meta property="og:description" content="Presupuesto sin cargo en 24 horas y 20 años de garantía por escrito.">
  <meta property="og:url" content="https://example.com/es/reparacion-de-techos/">
  <meta property="og:image" content="https://example.com/assets/og/reparacion-de-techos.jpg">
  <meta property="og:image:alt" content="Cuadrilla de Acme instalando tejas en un techo residencial">

  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
```

| Element | Rule |
|---|---|
| `lang` on `<html>` | the language the page is actually written in, as a BCP 47 tag |
| `<meta charset>` | `utf-8`, and it must be within the first 1024 bytes — so put it first |
| `<meta name="viewport">` | exactly as above; without it a mobile browser renders a desktop page zoomed out |
| `<title>` | unique per page, roughly 60 characters, subject first and brand last |
| `<meta name="description">` | unique per page, roughly 155 characters |
| `<link rel="canonical">` | absolute, self-referencing, identical to the sitemap entry |
| `<link rel="alternate" hreflang>` | only on a translated page: one per language, plus `x-default`, including this page itself |
| `og:type` | `website` for most pages, `article` for a blog post |
| `og:site_name` | the brand, the same on every page |
| `og:locale` | `language_TERRITORY`, matching `lang` |
| `og:locale:alternate` | only on a translated page: the other languages it exists in |
| `og:title` | may match `<title>` or drop the brand suffix |
| `og:description` | may be shorter than the meta description; it is a card, not a snippet |
| `og:url` | the canonical URL, character for character |
| `og:image` | absolute URL, at least 1200x630, and crawlable |
| `og:image:alt` | describes the image for someone who cannot see the card |
| `twitter:card` | `summary_large_image`, or `summary` if the image is square |
| `<link rel="icon">` | any real file; a missing favicon is a 404 on every page load |

**There is no `<meta name="keywords">` in that list and there should not be.** No major search
engine has used it since 2009. It communicates nothing except that whoever wrote the page was
working from a fifteen-year-old checklist.

**`twitter:title`, `twitter:description` and `twitter:image` are unnecessary.** X falls back to the
Open Graph tags when they are absent. Adding them means four more fields to keep in sync with the
ones above, and out-of-sync duplicates are worse than none.

### Two languages

The example above is the Spanish half of a pair. Its English twin at
`https://example.com/roof-repair/` carries `lang="en"`, `og:locale` of `en_US`,
`og:locale:alternate` of `es_US`, its own canonical — and **the same three `hreflang` lines,
unchanged**.

That repetition is the whole mechanism, so it is worth being precise about it:

| Tag | Describes |
|---|---|
| `lang`, `og:locale`, `<title>`, description, canonical | THIS page — different on each side |
| `hreflang` alternates | the SET — byte-identical on every page in it |
| `og:locale:alternate` | the other languages, so it differs per side |

- **Reciprocity is mandatory.** If one side omits a link, or points at a URL that does not point
  back, the entire set is discarded rather than partially honoured.
- **Every page lists itself** among the alternates. A two-language pair therefore has three lines on
  each page, not two.
- **`x-default`** is where a visitor whose language matches neither should land. Pick one and use the
  same value on both sides.
- **No translation means no `hreflang`.** A page that exists only in Spanish carries none of these
  tags. Pointing at a translation you have not written yet is worse than saying nothing.
- **The language switcher must be a real `<a href>`** to the other URL. A JavaScript toggle is not a
  link, so nothing crawls it and the second tree is reachable only by luck. Do not mark it
  `nofollow`.
- **Never redirect by IP or `Accept-Language`.** Google crawls mostly from the United States, so an
  automatic redirect can make one whole tree unreachable to it. Offer the switch; do not force it.
- **One language per page.** A page with a Spanish body and English headings belongs to neither
  `hreflang` value, and `lang` cannot describe it.

Translate the slug too — `/es/nosotros/`, not `/es/about/`. The URL is read by the same people the
page is written for.

## 2. Titles and descriptions

These are the two fields a generated site gets wrong most often, and they are wrong in the same
way: written once and reused.

### The title

It is the clickable line in the result, the browser tab, and the default text when somebody
bookmarks the page. It carries real ranking weight, which is why the useful words go first.

- **Unique per page.** Two pages with one title are two pages competing to be the same result.
- **About 60 characters.** The real limit is pixel width, around 600px, so a title of wide capitals
  truncates sooner than one of narrow lowercase. Sixty is the working number.
- **Subject first, brand last**, separated by a pipe or a dash. The title in section 1 is the shape;
  `Acme Roofing | Inicio` is the inversion of it, and says nothing about the page.
- **Describe this page**, not the site. `Contacto` is a weak title. The same page titled
  `Contacto y presupuestos en Miami-Dade | Acme Roofing` is findable.
- **No stuffing.** Repeating the keyword three times reads as spam to a person and adds nothing for
  a crawler.

### The description

It does not affect ranking. It affects whether anybody clicks, which is why it should be written as
copy rather than as a summary.

- **About 155 characters.** Front-load the point; the tail gets truncated.
- **Unique per page**, for the same reason as the title.
- **Google rewrites it often** — frequently more than half the time — using text from the page when
  it judges that a better match for the query. Write it anyway: you control the version shown for
  the query you actually want.
- **Mind the quoting.** It lives inside an HTML attribute, so a raw `"` ends the attribute early
  and silently truncates the description. Use `&quot;` or rephrase.

## 3. The canonical

One line, and the most dangerous one in this contract:

```html
<link rel="canonical" href="https://example.com/reparacion-de-techos/">
```

| Rule | Why |
|---|---|
| Absolute, with scheme and host | a relative canonical is resolved against the current URL, which defeats the purpose |
| Self-referencing on every page | it states which of several possible spellings is the real one |
| Identical to that page's `<loc>` in the sitemap | disagreement makes both files individually plausible and jointly wrong |
| Identical to `og:url` | they describe the same thing and drift apart when copied |
| Never pointing at a page that itself canonicalises elsewhere | a chain is resolved unpredictably |
| Never combined with `noindex` on the same URL | one says index this spelling, the other says index nothing |

**The failure to fear.** A page skeleton is copied to make the next page, and the canonical is not
updated. Do that across a twenty-page site and every page declares the homepage as its real URL, so
nineteen pages are dropped as duplicates of it. Nothing looks broken: the pages render, the links
work, the sitemap lists them, the HTML validates. They are simply not in the index, and the reason
is one attribute that was correct on the page it was copied from.

The trailing slash is part of this. `https://example.com/about/` and `https://example.com/about` are
different strings, so a canonical using one and a sitemap using the other is a mismatch even though
both URLs serve the same page. Pick the form defined in [seo-site.md](./seo-site.md) and never vary
it.

## 4. Social cards

Open Graph controls the preview when a link is pasted into WhatsApp, Facebook, LinkedIn, Slack or
iMessage. It has no effect on ranking whatsoever, and it is the most visible part of this contract
to a client, so it is worth getting right.

- **`og:image` must be absolute and crawlable.** A root-relative path is not resolved by most
  scrapers, and an image sitting under a path blocked in `robots.txt` cannot be fetched. At least
  1200x630 for a wide card; under about 8 MB.
- **One image per page beats one image for the site.** A shared card makes every link look like the
  homepage.
- **`og:url` is the canonical URL.** When it disagrees with the canonical, shares accumulate against
  a URL you did not choose.
- **Caches are sticky.** Facebook and LinkedIn cache the card the first time a URL is shared.
  Changing the tags does not change the preview until the cache is refreshed through their debugger
  tools, so the tags should be correct before the link is circulated.

## 5. The body

Markup that is structure, not decoration.

- **Exactly one `<h1>` per page**, and it describes the page's subject. Not the brand, not a
  tagline, not the navigation.
- **Heading levels form an outline and must not skip.** `h2` under `h1`, `h3` under `h2`. A heading
  chosen because it looked the right size is a broken outline — size belongs to CSS.
- **`lang` must match the content.** A Spanish page declaring `lang="en"` gets mispronounced by
  screen readers, offered a pointless translation, and hyphenated by the wrong rules.
- **`alt` describes the image**, or is empty for a purely decorative one. `alt=""` is a correct,
  deliberate answer; a missing `alt` is not.
- **Link text says where the link goes.** `Ver nuestros presupuestos` rather than `clic aquí`.
- **One page, one subject.** Two subjects on one page compete with each other; split them.

The other image attributes — `width`, `height`, `loading`, `fetchpriority` — are in section 6. They
look like markup hygiene and they are actually the three Core Web Vitals numbers, so they are
documented once, where the metric they move is explained.

## 6. Performance, as markup

Core Web Vitals are three field measurements taken from real visitors, at the **75th percentile** —
meaning three quarters of visits must be under the threshold, so an average is not the number being
judged.

| Metric | What it measures | Target |
|---|---|---|
| **LCP** — Largest Contentful Paint | when the biggest thing in the viewport finished painting | ≤ 2.5 s |
| **INP** — Interaction to Next Paint | how long the page takes to respond to a tap or click | ≤ 200 ms |
| **CLS** — Cumulative Layout Shift | how much the layout jumps while loading | ≤ 0.1 |

INP replaced FID in March 2024 and FID was removed from Chrome's field tooling that September. If
you are reading advice that optimises for FID, it is at least two years stale.

**On a static HTML site, two of these three are usually already fine.** There is no framework
hydrating, so INP is rarely the problem. LCP and CLS are, and both are decided by markup:

| Do this | Against | Why |
|---|---|---|
| `width` and `height` on **every** `<img>` | CLS | the browser reserves the box before the bytes arrive. Without it the text below moves when the image lands, and that movement is the metric |
| `fetchpriority="high"` on the hero image | LCP | it is usually the largest element; without the hint the browser discovers it late and queues it behind the stylesheet |
| `loading="lazy"` below the fold, **never on the hero** | LCP | deferring the largest element delays the exact paint being measured |
| `<link rel="preload">` for a font used above the fold | LCP | a webfont discovered inside a stylesheet starts downloading after the CSS parses |
| `font-display: swap` on every `@font-face` | LCP | the default hides text until the font loads, so the largest text block paints late. `swap` shows a fallback immediately |
| Explicit dimensions on embeds and ad slots | CLS | anything injected into the flow with no reserved box shifts everything under it |
| Nothing inserted above existing content after load | CLS | a cookie banner or notice pushed in at the top is the single largest shift most sites have |

Two more that belong to the file rather than the server:

- **Keep the important content and the JSON-LD inside the first ~2 MB of HTML.** Crawlers stop
  fetching a document well before an unbounded one ends, and base64-inlined images are the usual way
  a page gets there without anyone noticing.
- **Do not defeat the Back button.** Trapping history with `pushState` / `replaceState` so a visitor
  cannot leave is treated as a spam practice, not a UX choice.

Compression, cache headers and TTFB are the server's half of the same subject and live in
[seo-site.md](./seo-site.md).

### Typefaces served by somebody else

The `preload` row above assumes the font file is yours. When the typeface comes from a third-party
host — Google Fonts being the usual one — three things change. This section owns that decision
because fonts already live here; [toolchain.md](../../project-setup/references/toolchain.md) owns the security posture for
*installing* a dependency, and a request the visitor's own browser makes at runtime is a different
question with different costs.

- **`preload` usually cannot be used at all.** The stylesheet those services return points at font
  files whose URLs rotate, so a `<link rel="preload">` written today names a file that will not be
  requested tomorrow: it downloads a second copy of something nothing uses and warms no cache. The
  working substitute is `<link rel="preconnect">` to the font host plus `&display=swap` on the
  stylesheet URL — the handshake happens early and text stays visible. **Write down that you did
  this.** It is a deviation from the row above, and the next reader needs to know it was chosen
  rather than missed.
- **It puts a DNS lookup and a TLS handshake on the critical path**, to a host the browser had no
  other reason to contact. `preconnect` moves that cost earlier; it cannot remove it. Self-hosting
  the two or three weights actually in use does remove it, and is usually a smaller download than
  the variable font the service returns.
- **Every visitor's IP address is disclosed to that host.** In 2022 a German regional court
  (LG München I, 3 O 17493/20) held that loading Google Fonts from Google's servers this way passed
  the visitor's IP address on without consent, and awarded damages. It is a first-instance decision
  and not EU-wide precedent — but it produced a wave of demand letters, and the mechanism it turned
  on is not in dispute: the request is made by the visitor's browser, so the third party sees the
  address. Whether that matters to a given project is a question for whoever owns its privacy
  policy. The point here is that it is not a purely technical choice, so it should not be made by
  reflex while writing the `<head>`.

**Self-hosting is what this contract recommends**, on the two performance grounds above. Reach for
a third-party host deliberately, and record why.

### Mobile, which is the version being judged

- **Touch targets at least 48×48 px, with ~8 px between them.** Two adjacent links a thumb cannot
  separate is a real failure, not a nitpick. This is Google's mobile guidance and it is stricter
  than the legal floor: [accessibility.md](../../astro-craft/references/accessibility.md) section 4 owns the minimum, **24 × 24** per WCAG 2.2
  SC 2.5.8. They do not conflict — 24 is what you may not go below, 48 is what this document asks
  for on top of it. Meet 48 and both are satisfied.
- **16 px base font.** Smaller and the browser may offer to zoom, which reflows the page.
- **No interstitial covering the content on arrival.** A full-page overlay, a consent wall that
  redirects, or a dialog that cannot be dismissed all count.
- **The mobile page carries the same content, title, description, robots meta and markup as the
  desktop one.** Mobile is the version that gets indexed, so anything only in the desktop variant
  effectively does not exist.
- **Key content is visible on load,** not behind a tab or a "read more". Content a visitor has to
  act to reveal is less likely to be treated as the page's answer.

## 7. Content shape: getting a passage used

A result is no longer only a link. The same page can be quoted in an AI answer, pulled into a
snippet, or summarised — and what decides whether that happens is **structure**, which is why it is
in this contract rather than in a style guide.

**Everything in this section is a heuristic.** No script verifies it, and nobody outside the search
engines knows the selection logic. What follows is the shape that is consistently observed to get
quoted; treat it as craft, not as a rule you can check off.

### The shape

- **Answer in the first 40–60 words of a section.** Lead with the answer, then explain. A conclusion
  at the bottom of a section is a conclusion nobody extracted.
- **Make each answer self-contained**, roughly 130–170 words. A passage that only makes sense after
  the two paragraphs above it cannot be lifted, so it will not be.
- **Open a definition with the noun.** "A membrane roof is…" rather than "When it comes to membrane
  roofs, there are several things to consider."
- **Question-shaped `h2` and `h3`,** matching how somebody would actually ask. This is also just a
  better outline.
- **2–4 sentences per paragraph.** A wall of text has no extractable unit inside it.
- **Tables for comparisons, ordered lists for procedures.** A comparison written as prose is a
  comparison nothing can parse.
- **Specific, attributed facts.** A number with a source is quotable; "many experts agree" is not.

### What makes a page ineligible regardless of shape

- **Content that only exists after JavaScript runs.** AI answer engines do not execute JavaScript.
  Whatever the page needs to be understood for has to be in the HTML the server sends — the same rule
  that governs JSON-LD in [seo-schema.md](./seo-schema.md), with a wider blast radius.
- **No visible date.** A page with no publication or update date is hard to trust and appears to be
  discounted for freshness. Show both when they differ, and make them true.
- **No identifiable author** on anything making claims. A byline that resolves to a real person with
  a profile elsewhere is a different signal from an unsigned page.

### What not to conclude from this

Two things get overclaimed and both waste effort:

- **`llms.txt` is not a ranking lever.** It is a site-level file, covered in
  [seo-site.md](./seo-site.md), and Google has said plainly it neither helps nor harms visibility in
  Search. Add it because a non-Google consumer may use it, not because it does anything here.
- **Rewriting a thin page into this shape does not make it a good answer.** Structure makes a good
  answer findable. It does not manufacture one, and a well-structured page with nothing to say is
  still a page with nothing to say.

## 8. Keeping a page out of the index

```html
<meta name="robots" content="noindex, follow">
```

`follow` keeps the links on the page working as links; `noindex` keeps the page itself out of
results. That combination is what you want for a page that exists for people who were sent to it,
not for people searching.

**Pages that must carry it:**

| Page | Why |
|---|---|
| Thank-you and confirmation pages | they make no sense out of context and cannibalise the page that leads to them |
| Internal search results | infinite, low value, and generated on demand |
| Print or duplicate variants | the same content at a second URL |
| A staging or preview copy on the live host | it competes with the real site |

**Three rules that come with it:**

1. **The page must stay crawlable.** A `noindex` on a URL that is also `Disallow`ed in `robots.txt`
   is never read, so the page can remain indexed indefinitely. Allow the crawl.
2. **The page must be absent from `sitemap.xml`.** Listing it asks for indexing and forbidding it in
   the same breath. See section 3 of [seo-site.md](./seo-site.md).
3. **Keep the spelling conventional.** Write it exactly as above. The sitemap regenerator in
   [seo-site.md](./seo-site.md) detects `noindex` with a regular expression over the raw HTML; an
   exotic spelling, or a directive sent as an `X-Robots-Tag` header instead, means the page gets
   listed in the sitemap anyway.

## 9. Traps

Ordered by how much traffic they cost, worst first. Every one of them leaves a page that renders
perfectly.

1. **The homepage canonical copied onto every page.** The whole site collapses into one result
   (section 3).
2. **`noindex` left in from a template or a staging copy.** The single most common cause of "the
   site disappeared from Google". Grep for it before every upload.
3. **One title and one description reused across the site.** Twenty pages, one identity, and no
   page is the best answer to anything (section 2).
4. **A trailing-slash mismatch** between canonical, `<loc>` and internal links. Two URLs, one page,
   half the signals each.
5. **`og:url` and `og:image` left over from the page that was copied.** Every share advertises the
   wrong page.
6. **`lang="en"` on a Spanish page.** Free to fix, and it affects translation, hyphenation and
   screen readers.
7. **`FAQPage` markup for an FAQ that is not on the page.** A spam violation, not a shortcut — and
   since 7 May 2026 it does not buy an accordion for anyone. See
   [seo-schema.md](./seo-schema.md), which also explains why the widely repeated fix, swapping it for
   `QAPage`, is wrong.
8. **`loading="lazy"` on the hero image.** Deliberately delaying the metric being measured
   (section 6).
9. **Headings chosen by size.** `h4` because it looked right destroys the outline the page is read
   through.
10. **A description that puts the point after 160 characters.** Written, paid for, truncated away.

### On a bilingual site, three more

- **One page that swaps language with JavaScript.** One URL, one indexed language, and a translation
  nobody can reach. This is the mistake the whole of section 1's language subsection exists to
  prevent.
- **`hreflang` that is not reciprocal.** Add the tags to the English pages, forget the Spanish ones,
  and the result is not half-working — the set is discarded and you are back to two unrelated pages.
- **A redirect by IP or `Accept-Language`.** It looks like a courtesy and it can hide an entire
  language tree from a crawler that always arrives from the wrong country.

## 10. Per-page checklist

Run this on every page before upload. It is short on purpose:

| Check | Pass condition |
|---|---|
| `lang` | matches the page's language |
| `<title>` | unique across the site, about 60 characters, subject first |
| `<meta name="description">` | unique across the site, about 155 characters |
| `<link rel="canonical">` | absolute, points at THIS page, matches the sitemap entry |
| `og:url` | identical to the canonical |
| `og:image` | absolute URL, loads in a browser, at least 1200x630 |
| `<h1>` | exactly one, describes the page |
| Heading levels | no skipped level |
| Images | every one has `alt`, `width` and `height`; the hero is not lazy and carries `fetchpriority="high"` |
| Fonts | any font used above the fold is preloaded and declares `font-display: swap` |
| Nothing shifts | no banner, notice or third-party widget is inserted above existing content after load |
| Touch targets | at least 48x48 px, with space between adjacent ones — above the 24x24 WCAG floor [accessibility.md](../../astro-craft/references/accessibility.md) owns |
| Answers | each section leads with its answer, in a block that makes sense lifted out |
| Dates | a visible publication date, and an update date when it differs |
| No JS dependency | title, description, canonical, robots meta and content are all in the served HTML |
| JSON-LD | present per [seo-schema.md](./seo-schema.md), and describing only what is visible |
| `noindex` | present only if intended, and then absent from the sitemap |
| Sitemap | this page's URL is listed, once, in the form used by its canonical |
| `hreflang` | on a translated page: the full set, identical to its twin's, including itself and `x-default` |
| `og:locale:alternate` | on a translated page: names the other language |
| Language switcher | a real link to the twin's URL, not a script |
