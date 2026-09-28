---
name: svg-assets
description: "Use when creating, editing, importing or reviewing an SVG logo, favicon, icon, decorative vector, illustration or diagram, or making an accessibility or image-SEO decision about one. Not for extracting icons from a design source (→ design-ingestion/references/design-source.md, which owns the export-never-approximate rule) and not for general page layout (→ astro-craft)."
---

# SVG assets

## 1. Pick the role, then the row

Every SVG on this template fills exactly one of these roles. The role decides embedding, accessible
name, sizing and contrast — do not mix rules across rows.

| Role | Embedding | Accessible name / alt | Sizing & viewBox | Contrast | Search notes |
|---|---|---|---|---|---|
| Logo | `<img>` (or inline if it needs `currentColor` theming) | Part of a wordmark next to visible brand text → decorative (`alt=""`); standalone → real alt naming the brand | `viewBox` always; explicit width/height; for Organization schema use, Google requires ≥112×112px — `viewBox` units are not pixels, so verify the effective size (see §4) | N/A (brand mark, not a UI signal) | Google Images indexes `<img src>`, not CSS backgrounds; Google Search's favicon list excludes SVG entirely (see §4) |
| Favicon | `<link rel="icon">` | N/A | Square, ≥8×8px, >48×48px recommended | N/A | SVG is not in Google Search's supported favicon formats (§4) — ship a raster fallback |
| Decorative icon | `<img alt="" aria-hidden="true">` or inline `aria-hidden="true" focusable="false"` | None — it adds nothing a screen reader should announce | `viewBox` always; explicit size | N/A (carries no meaning) | Not indexed as content; fine |
| Informative image | `<img>` with real alt, or inline `role="img"` + `aria-label`/`<title>`+`aria-labelledby` | Required — describe what it communicates, not "icon of X" | `viewBox` always; explicit size; surrounding text should reinforce it | 3:1 if it's the only way to understand adjacent content (WCAG 2.2 SC 1.4.11) | Give it real alt text; no stuffing |
| Interactive icon (icon-only button/link) | Inline `<svg aria-hidden="true" focusable="false">` inside the control | The **control** gets the accessible name (`aria-label` or visually-hidden text) — never the svg | `viewBox` always; hit area ≥24×24 CSS px | 3:1 for the glyph against its background (SC 1.4.11) | N/A |

`role="img"` + `aria-label`, and `<title>` referenced by `aria-labelledby`, are WAI-ARIA authoring
patterns (<https://www.w3.org/WAI/tutorials/images/>) — not something Google's documentation states;
don't cite Google for accessible-name mechanics.

## 2. Rules that apply across every row

- **`viewBox` always**, plus an explicit width/height or CSS size — never rely on intrinsic SVG size.
- **`currentColor`** for any icon that should follow the surrounding text/theme color.
- **Unique `id`s** when the same inline SVG is repeated on a page (gradients, clip-paths, `<use>`
  targets) — colliding ids make later instances reference the first one's definition.
- Contrast for non-text graphics needed to understand content: **3:1**, WCAG 2.2 SC 1.4.11. This
  skill states where it applies (the table above); it does not restate the criterion or its
  measurement method — see `astro-craft/references/accessibility.md` §5 for that.
- Never `set:html` an SVG that has not been through §3's review.

## 3. Third-party or previously-unreviewed SVG is untrusted input

Before it lands in `public/` or `src/`:

1. Record provenance and licence. **No licence → do not ship it.**
2. Run `node scripts/svg-audit.mjs <file>` — it catches `SVG_NO_VIEWBOX`, `SVG_SCRIPT`,
   `SVG_EVENT_HANDLER`, `SVG_EXTERNAL_REF`, `SVG_FOREIGN_OBJECT`, `SVG_STYLE_IMPORT`, `SVG_DOCTYPE_ENTITY` (an `ENTITY`
   declaration or a DOCTYPE internal subset — an XXE/entity-expansion vector) and
   `SVG_JAVASCRIPT_URL` as errors (exit 1), and warns on `SVG_DOCTYPE` (a removable public-DOCTYPE
   boilerplate many editors export) and `SVG_EMBEDDED_RASTER`. It does **not** check licence,
   contrast, or accessible name — those are this skill's job, not the script's (see its own header
   comment).
3. Remove anything the audit flags as an error by hand before it ships: scripts, event handler
   attributes, external references, `foreignObject`, DOCTYPE/ENTITY declarations, unneeded metadata.

## 4. Two known gaps in this template — review, don't silently "fix"

- **Favicon is SVG-only.** `BaseLayout.astro` line 21 emits only
  `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`. Google Search's supported favicon
  formats are BMP, GIF, ICO, PNG, JPEG, PPM and TIFF — **SVG is not listed**
  (<https://developers.google.com/search/docs/appearance/favicon-in-search>, checked 2026-09-28).
  Browsers do use the SVG — keep it — but add a raster fallback (PNG or ICO, square, ≥48px) alongside
  it for Google Search. Do not remove the SVG link to "fix" this.
- **Organization logo is the favicon.** `src/lib/seo/schemas/organization.ts` line 18 sets `logo` to
  `/favicon.svg`. Google's Organization guidance requires the logo to be at least 112×112px, crawlable
  and indexable, in a format Google Images supports, and legible on a pure white background
  (<https://developers.google.com/search/docs/appearance/structured-data/organization>, checked
  2026-09-28). Keep three facts apart:
  - **SVG is an accepted format.** Google Images lists BMP, GIF, JPEG, PNG, WebP, SVG and AVIF
    (<https://developers.google.com/search/docs/appearance/google-images>, checked 2026-09-28), so the
    format alone is not the gap.
  - **`viewBox` is not a pixel size.** `viewBox="0 0 64 64"` sets the internal coordinate system and
    aspect ratio; a vector scales to any output size. Never read "64" as "64px, below 112px".
  - **The effective size Google uses is unverified.** The guidance states a pixel minimum without saying
    how it measures a vector, and `/favicon.svg` has no `width`/`height`. Do not claim it passes or
    fails the 112px rule; if it matters, check it (Rich Results Test, or ship a ≥112×112px raster).
  The real gap is fitness, not format: the file is a placeholder favicon, not a brand logo, and it draws
  its letter with `<text>` in a system font, so its rendering depends on the rasterizer. Flag it as a
  rebrand-time gap — supply a real logo — rather than changing it without a real asset to put there.

Representative correct usage already in this template: `public/assets/logo-mark.svg` as a decorative
`<img alt="" aria-hidden="true">` in `SiteHeader.astro` (line 42) and `BlogTeaser.astro` (~line 127) —
decorative is correct there *only* because the wordmark text next to it names the brand; verify that
still holds before copying the pattern elsewhere. Inline icons in `404.astro`, `NextRead.astro` and
`BlogArchive.astro` use `aria-hidden` + `currentColor` correctly. `public/masks/*.svg` carry a
removable public DOCTYPE that `svg-audit.mjs` reports as a warning, not an error.

## 5. Astro 7.1.3 fact

SVG-as-component import has been stable since Astro 5.7 but is **not used** in this repository today
— stay with `<img>`/inline `<svg>` unless a task explicitly introduces the component pattern. Accepted
props on an imported SVG component are native `svg` attributes; there is **no dedicated `title` prop**
(verified against Astro's docs, 2026-09-28). Don't invent one.

## Hand-off / evidence

Report: role chosen per asset (table in §1) and why; provenance/licence for any third-party SVG;
`node scripts/svg-audit.mjs` output (errors and warnings, by file); whether either known gap in §4 was
touched, and if not, that it was left as a recorded gap rather than silently ignored; `bun run test`
and `bun run build` results.

## Primary references

- Google favicon formats — <https://developers.google.com/search/docs/appearance/favicon-in-search> (checked 2026-09-28)
- Google Organization logo — <https://developers.google.com/search/docs/appearance/structured-data/organization> (checked 2026-09-28)
- Google Images — <https://developers.google.com/search/docs/appearance/google-images> (checked 2026-09-28)
- W3C WAI images tutorial — <https://www.w3.org/WAI/tutorials/images/> (checked 2026-09-28)
- `design-ingestion/references/design-source.md` §2 — asset export rules (owned there, not restated here)
- `astro-craft/references/accessibility.md` — contrast, focus and keyboard rules (owned there, not restated here)
