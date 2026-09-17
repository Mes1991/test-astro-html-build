---
name: static-site-seo
description: "Use when building or editing a static HTML site — creating, renaming, deleting or translating a page, changing its head or its structured data, or touching sitemap.xml, robots.txt or llms.txt. Trigger it even for a one-page change. Also use it for why a page is not appearing in search, why a translation cannot be found, why a whole site vanished from results, why an AI answer does not cite the site, which schema type or JSON-LD to write, whether a link is worth having, or adding a second language to an existing site."
---

# Static site SEO

## What this is

A workflow. It tells you what to DO and in what order; four companion contracts tell you what is
CORRECT. **This file deliberately restates none of their rules** — two copies of a rule means one of
them is wrong and nobody knows which.

| Contract | Owns |
|---|---|
| `references/seo-site.md` | the site: root files, URL shape, crawler access, delivery, HTTPS |
| `references/seo-page.md` | one page: `<head>`, body outline, Core Web Vitals, the shape an answer needs |
| `references/seo-schema.md` | all JSON-LD |
| `references/seo-offpage.md` | links, mentions, paid traffic — everything outside the files you upload |

## The rule

**Any pass that adds, removes, renames or translates an `.html` file regenerates `sitemap.xml` and
runs the check, in the same pass, before you report it as done.**

```text
node tools/seo.mjs build ./site https://example.com
node tools/seo.mjs check ./site https://example.com
```

> **Gap: `tools/seo.mjs` does not exist yet as a standalone file.** The implementation is embedded
> in `references/seo-site.md` and has not been extracted into a tested tool. The commands above
> describe the intended interface, not a file you can run today. Do not claim the tool exists until
> it is extracted and proven; the repository's current SEO lint is a different integration.

`check` exits non-zero and names every finding. **A non-zero exit is not done.** Fix the findings, or
say plainly which one you are leaving and why. Never report success over a red check.

Three things that are easy to get wrong:

- **Generate locally, never on the server.** Local generation asks nothing of the host, so it works
  the same on shared hosting, on a VPS with no PHP, and on a bucket behind a CDN.
- **Run `check` against the real project directory** you just edited, not a sample. It reads the local
  tree, which is the point: it checks what is about to be uploaded. It cannot see the live site, so a
  file that failed to upload is invisible to it.
- **Regenerate after a rename, not only after an addition.** A renamed page leaves a sitemap entry
  pointing at nothing, which is a worse signal than a missing entry.

## Which contract to open

Do not read all four. Open the one that owns what you are about to touch:

| You are about to | Open |
|---|---|
| write or edit a page's `<head>` | `references/seo-page.md` §1–4 |
| write body content, headings, images | `references/seo-page.md` §5–7 |
| make a page load faster | `references/seo-page.md` §6, then `references/seo-site.md` §5 |
| add or change JSON-LD | `references/seo-schema.md` |
| add, rename or delete a page | `references/seo-site.md` §3, then run the rule above |
| add a second language | `references/seo-site.md` §1 and `references/seo-page.md` §1, both, before writing anything |
| touch `robots.txt` or crawler access | `references/seo-site.md` §2 |
| decide whether a filter or parameter gets its own URL | `references/seo-site.md` §4 |
| set up hosting, HTTPS, caching | `references/seo-site.md` §5 |
| judge a link, or set up an ad campaign's landing page | `references/seo-offpage.md` |
| replace a PHP site with static files in the same root | `references/seo-site.md` appendix — and only then |

**The appendix in `references/seo-site.md` is gated.** Do not read it, and do not ask anyone to create an
`.htaccess` file, unless the developer has confirmed the site is replacing a PHP application in the
same document root. On every other host that material is noise, and following it invents a
requirement the host does not have.

## What `check` catches, and what it cannot

It reports a page missing from the sitemap, a sitemap entry with no file behind it, a missing title,
description or canonical, a canonical that disagrees with where the file is actually served, a
duplicated title or description, a `noindex` page listed anyway, a broken `hreflang` set, a raw `&`,
and a `robots.txt` with no `Sitemap:` line.

The canonical mismatch is the reason this runs locally at all. Any generator that derives URLs from
file paths never reads the canonical, so a page whose canonical points elsewhere looks perfectly
correct to it — and the sitemap ends up submitting a URL the page itself disowns.

**It says nothing about most of what the contracts cover.** It cannot see Core Web Vitals, judge
whether a passage is quotable, validate a schema type's properties, or know anything about a link on
somebody else's site. Those are read-and-apply, not check-and-fix. A green `check` means the tree is
coherent — the floor, not the goal.

## When a contract is missing something

Say so instead of inventing a rule. The contracts are versioned and published by the team that
maintains them; a rule you invent here is a rule the next person cannot find. If the gap is real,
report it with the release or commit you are working from.

The same applies to advice from anywhere else, and it is worth being blunt about: much of what
circulates about AI search and structured data is out of date or simply wrong. **If a rule is not in
one of these four files, do not apply it silently.** Name it, say where it came from, and let somebody
decide.
