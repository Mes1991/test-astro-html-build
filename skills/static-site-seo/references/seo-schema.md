# Structured data — the JSON-LD contract

## Start here

This document owns **every rule about JSON-LD** on a static HTML site: where the block goes, how
entities reference each other, which properties each type needs, and which types are worth writing
at all.

Nothing else in this set repeats these rules. Three boundaries, so you know when you are in the
wrong document:

| You are asking | Read |
|---|---|
| what goes in `<head>`, what the outline must look like | [seo-page.md](./seo-page.md) |
| what `robots.txt` and `sitemap.xml` must contain | [seo-site.md](./seo-site.md) |
| whether a link or a mention helps | [seo-offpage.md](./seo-offpage.md) |

**One thing to understand before you write a single property.** Structured data does not improve
ranking. It changes how a result can be *displayed*, and only for the types a search engine
currently renders. So the value of a block is not "is it correct" — it is "does anything consume
it". A valid type that nothing renders is not a small win. It is unpaid maintenance that will
outlive the person who added it.

## 1. The one rule that voids everything else

**Structured data may only describe content a visitor can actually see on that page.**

Marking up a review nobody can read, a price that is not shown, or a set of questions hidden behind
a `display:none` block is a spam policy violation and can earn a manual action against the whole
site. This holds whether or not anything renders the markup, and it holds for content behind a tab
or an accordion only if the visitor can reach it without leaving the page.

Every other rule in this document is subordinate to this one. If a property would require inventing
content, remove the property — never the visible content.

## 2. Where the block goes

```html
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "…" }
</script>
```

| Rule | Why |
|---|---|
| `<script type="application/ld+json">`, in `<head>` or `<body>` | either is honoured; pick one and be consistent so a reviewer knows where to look |
| It must be **in the HTML the server sends** | a block injected by JavaScript is processed late or not at all, and AI answer engines do not run JavaScript, so JS-injected markup is invisible to them |
| It must be valid JSON | one trailing comma discards the entire block, silently, with no error anywhere |
| Several `<script>` tags are allowed | one type per tag is easier to keep valid than one deeply nested document |
| Every URL is absolute, on the canonical origin | a relative path or the wrong host makes the markup describe a different page |
| Dates are ISO 8601 (`2026-08-05`, or with a time and offset) | any other format is discarded |

The "must be in the sent HTML" rule is the one that bites on a static site least often and costs the
most when it does — it is the reason a build step that appends JSON-LD client-side produces markup
that validates in a browser and does not exist as far as a crawler is concerned.

## 3. Entity linking: `@id` and `@graph`

Two blocks that both mention the business describe **two businesses** unless you say otherwise. `@id`
is how you say otherwise: a stable URI that names one entity, reused everywhere that entity appears.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#org",
      "name": "Acme Roofing",
      "url": "https://example.com/",
      "logo": "https://example.com/assets/logo.png"
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com/",
      "name": "Acme Roofing",
      "publisher": { "@id": "https://example.com/#org" }
    },
    {
      "@type": "WebPage",
      "@id": "https://example.com/reparacion-de-techos/#page",
      "url": "https://example.com/reparacion-de-techos/",
      "isPartOf": { "@id": "https://example.com/#website" },
      "about": { "@id": "https://example.com/#org" }
    }
  ]
}
</script>
```

Rules for `@id`:

- **A fragment URI, not a page URL.** `https://example.com/#org`, not `https://example.com/`. The
  organisation is not the same thing as the home page, and giving them one identifier says it is.
- **Identical, byte for byte, on every page.** `#org` on one page and `#organization` on another
  produces two entities that never merge.
- **Reference, do not repeat.** `{ "@id": "…#org" }` on an inner page instead of restating the whole
  organisation. Two full copies mean two chances to disagree, and they will.

`@graph` is optional. Separate `<script>` tags with cross-references by `@id` behave the same way.
Use `@graph` when the entities on a page genuinely form one connected set; use separate tags when
they do not.

## 4. What to actually write

### The floor, for any site

| Page | Type | Why this one |
|---|---|---|
| Home | `Organization`, or `LocalBusiness` when there is a physical address visitors can go to | the panel that can appear beside a branded result |
| Every page below the home page | `BreadcrumbList` | replaces a raw URL in the result with a readable trail |

`LocalBusiness` implies an address, a phone number and hours. If any of those does not exist, use
`Organization` — an implied address that is not there is worse than no markup.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Reparación de techos", "item": "https://example.com/reparacion-de-techos/" }
  ]
}
</script>
```

The trail must match the visible breadcrumb and the URL path. A `BreadcrumbList` describing a
hierarchy the site does not have is the visible-content rule again.

### Required properties, by type

Only the types below are worth adding to a static site without checking eligibility first. **Bold is
required** — a missing required property means the block produces nothing, not a degraded result.

| Type | Required | Worth adding |
|---|---|---|
| `Organization` | **`name`**, **`url`** | `logo`, `sameAs` (one URL per official profile), `contactPoint` with `telephone` + `contactType` |
| `LocalBusiness` | **`name`**, **`address`** (`streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry`), **`telephone`** | `openingHoursSpecification`, `geo` (`latitude`, `longitude`), `priceRange`, `image` |
| `BreadcrumbList` | **`itemListElement`** with `position` + `name` + `item` | nothing |
| `WebSite` | **`url`**, **`name`** | `publisher` by `@id`, `inLanguage` |
| `Article` / `BlogPosting` | **`headline`**, **`author`** (a `Person` or `Organization` with a `name`), **`datePublished`** | `dateModified`, `image`, `publisher`, `description` |
| `Person` (an author) | **`name`** | `url`, `jobTitle`, `sameAs` to profiles that establish the person exists |
| `Service` | **`name`**, **`provider`** by `@id` | `areaServed`, `serviceType` |
| `VideoObject` | **`name`**, **`description`**, **`thumbnailUrl`**, **`uploadDate`** | `duration`, `contentUrl` |
| `Event` | **`name`**, **`startDate`**, **`location`** | `endDate`, `offers`, `eventStatus` |

`headline` over 110 characters is truncated. `dateModified` earlier than `datePublished` invalidates
the block rather than being ignored.

### Types not to write

| Type | Status |
|---|---|
| `HowTo` | rich result removed on desktop in September 2023; the documentation is gone. Nothing renders it. |
| `FAQPage` | the **rich result** ended 7 May 2026, and the Search Console report and Rich Results Test support followed in June 2026. See below — this one is widely misreported. |
| `SpecialAnnouncement`, `ClaimReview`, `EstimatedSalary`, `VehicleListing`, `Book` actions | retired in the June 2025 cleanup |

**On `FAQPage`, specifically, because the wrong version of this is circulating.** The schema.org
*type* was not deprecated and is still valid. Existing markup can stay; unused structured data does
not harm a page. What ended is the visible FAQ rich result. Two conclusions follow:

- **Do not add `FAQPage` expecting an accordion in the results.** It will not appear.
- **Do not "migrate" `FAQPage` to `QAPage`.** They model different things: `QAPage` is a single
  question with user-contributed answers, the shape of a forum thread. Applying it to an editorial
  FAQ section is incorrect markup that describes a page that does not exist. Some tooling recommends
  this swap. It is wrong.

If you keep or add `FAQPage` for a consumer other than Google Search, the visible-content rule in
section 1 still binds: the questions and answers must be on the page and reachable.

## 5. Products and commerce

Only relevant when the page sells something. Everything here is `Product` and its `Offer`; the URL
and canonical rules for variants and filters live in [seo-site.md](./seo-site.md), because they are
decisions about which URLs exist rather than about markup.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Membrana asfáltica 4mm",
  "image": ["https://example.com/assets/products/membrana-4mm.jpg"],
  "sku": "MEM-4MM",
  "brand": { "@type": "Brand", "name": "Acme" },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/productos/membrana-4mm/",
    "price": "29.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

| Rule | Detail |
|---|---|
| **`name`**, **`image`**, **`offers`** are required | `image` is an array with at least one absolute URL |
| Inside `offers`: **`url`**, **`price`**, **`priceCurrency`**, **`availability`** | `Offer`, not `AggregateOffer`, for a page selling one purchasable thing |
| `price` is a bare number string | `"29.99"`. Not `"$29.99"`, not `"29,99"`, not a number with a currency symbol anywhere in it |
| `priceCurrency` is an ISO 4217 code | `USD`, `EUR`, `ARS` |
| `availability` is a full schema.org URL | `https://schema.org/InStock`, `.../OutOfStock`, `.../PreOrder`, `.../Discontinued`. The bare word `InStock` is invalid |
| `brand.name`, if `brand` is present, must be real | an empty string or `"N/A"` invalidates the block |
| `priceValidUntil`, if present, is ISO 8601 | a date in the past reads as an expired offer |
| `aggregateRating` requires **both** `ratingValue` and `reviewCount` | one without the other is discarded |
| `sku`, `gtin13`, `mpn` | not required, and they are what lets a listing be matched to the same product elsewhere |
| `shippingDetails`, `hasMerchantReturnPolicy` | not required, and they are the two most common reasons a merchant listing is downgraded |

**An out-of-stock product keeps its page and its markup.** Change `availability`, do not delete the
page or `noindex` it — the URL has links and history, and a 404 discards both. A product that is
gone for good gets `https://schema.org/Discontinued` and, when there is a successor, a `301` to it
(rule in [seo-site.md](./seo-site.md)).

**Price and availability must be in the HTML the server sends.** This is the JavaScript rule from
section 2, and commerce is where it hurts: a price injected client-side is processed late enough that
a wrong price can be shown against your listing.

## 6. Validating

Two free tools, both accepting a pasted URL or a pasted block:

- **Rich Results Test** — tells you what Google can render from it. The useful answer.
- **validator.schema.org** — tells you whether the vocabulary is correct. Broader, and it does not
  claim anything about display.

Read the result carefully: *valid* and *eligible* are different verdicts. A block can be perfectly
valid schema.org and eligible for nothing.

**Structured data that does not validate is not partially applied — it is ignored.** There is no
degraded mode. This is why the trailing comma in section 2 is called out: it is the single most
common way a block that looks right does nothing at all.

## 7. What this contract does not cover

- **Whether the content is worth marking up.** This document makes markup correct. It cannot make a
  thin page into a good one.
- **Types beyond the tables above.** The vocabulary is enormous and what search engines render
  shrinks about as often as it grows. Before adding a type not listed here, check its current
  eligibility — and if nothing renders it, do not add it.
- **Automated verification.** The SEO lint tool described in [seo-site.md](./seo-site.md) validates
  that JSON-LD blocks parse as JSON. It does not check properties per type, and it cannot see the
  page to judge the visible-content rule. (See the gap note in that file: `tools/seo.mjs` is not yet
  a standalone file.)
