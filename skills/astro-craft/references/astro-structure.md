# Astro structure — the source-layout contract

## Start here

Astro compiles a project into static HTML. This document says **where the source goes** so that the
compiled result is something a person can still work on six months later.

It exists because the failure it prevents is specific and common: asked for a landing page, a
generative tool produces one file of eight hundred lines. Every section is correct. Nothing is
reusable, nothing is reviewable, and the second page repeats the first by copy and paste. The output
is fine; the source is a dead end.

| This document owns | It does not own |
|---|---|
| which directory a file belongs in, and what may be inside it | what the result looks like — [visual-craft.md](./visual-craft.md) |
| which file owns the `<head>` | what goes inside that head — [seo-page.md](../../static-site-seo/references/seo-page.md) |
| how the build's URL shape is configured | which URLs a site should have — [seo-site.md](../../static-site-seo/references/seo-site.md) |

Rules here are checked against **Astro 7**. Where a rule depends on a version, it says so.

## 1. The output is static HTML, and that is a setting

Three configuration values decide whether you are building a static site at all. Read them in
`astro.config.mjs` before anything else, because every rule below assumes their default.

| Option | Required value | Why |
|---|---|---|
| `output` | `'static'` (the default) | `'server'` renders per request. A site meant to be a directory of files that got an adapter added is no longer one, and nothing about the source will look different. |
| `build.format` | `'directory'` (the default) | Emits `about/index.html`, so the URL is `/about/`. `'file'` emits `about.html` and the URL is `/about.html` — which contradicts the trailing-slash policy [seo-site.md](../../static-site-seo/references/seo-site.md) states, silently, for the whole site at once. |
| adapters | none | An adapter in `integrations` is the usual reason `output` stopped meaning what it says. |

Astro 7 accepts `output: 'static'` and `output: 'server'`. `'hybrid'` no longer exists; a config
still carrying it is from an older major and needs the upgrade guide, not a patch.

**After a build, confirm what shipped.** `dist/` must hold one `.html` file per route. If it holds a
server entry point instead, the site is not static and the rest of this document does not apply:

```bash
astro build
find dist -name '*.html' | head
```

### The two files the build does not produce

`sitemap.xml` and `robots.txt` are not build outputs in Astro. Knowing which tool emits them is an
Astro question and belongs here; **what has to be inside them is [seo-site.md](../../static-site-seo/references/seo-site.md)'s**, and
nothing about their contents is repeated below.

| File | What Astro offers |
|---|---|
| `sitemap.xml` | the official `@astrojs/sitemap` integration. Requires `site` in the config, and emits `sitemap-index.xml` plus numbered `sitemap-0.xml` chunks — an index, not one flat file. |
| `robots.txt` | nothing, in core or in any official integration. It is either a static `public/robots.txt` or an endpoint at `src/pages/robots.txt.ts`. |

**The integration works from routes, not from built HTML, and that is the deciding difference.** It
enumerates static routes and the paths `getStaticPaths()` returns; it never reads the pages it lists.
So it cannot see a `<meta name="robots" content="noindex">` — the mechanism
[seo-page.md](../../static-site-seo/references/seo-page.md) prescribes for keeping a page out of the index — and it will publish that
page in the sitemap anyway, with nothing on the site looking broken. Reproducing the exclusion means
hand-maintaining a `filter()` that restates what the page's own head already says, which is two
sources for one fact and the usual way they drift.

**So: generate the sitemap from `dist/` after the build**, with the script
[seo-site.md](../../static-site-seo/references/seo-site.md) publishes. It reads the artifact rather than inferring from routes, which
is what lets it honour `noindex` without being told, and it is the same tool on projects that are not
Astro.

If a project takes the integration anyway — one line of config is a real argument — then know both
consequences: point the `Sitemap:` line at `sitemap-index.xml` rather than `sitemap.xml`, and expect
the `check` command to report the flat file missing, because that is the shape it verifies.

## 2. Four kinds of file, and what belongs in each

Everything under `src/` is one of four things. Deciding which one a new file is, before writing it,
is most of what this document asks for.

| Directory | Is | May contain | May never contain |
|---|---|---|---|
| `src/pages/` | a route | the data the page needs, and a list of sections | section markup, more than a screen of template |
| `src/layouts/` | a page shape | `<html>`, `<head>`, the page frame, slots | anything specific to one route |
| `src/components/` | one section, or one primitive | markup and scoped style for that one thing | a second unrelated section, route data-fetching |
| `src/content/` | data | Markdown, MDX, JSON, YAML | code |

Two consequences worth stating outright, because they are what the table is for:

- **A page file is an outline.** Read one aloud and it should sound like the page: hero, features,
  pricing, FAQ, footer. If reading it aloud requires reading markup, a section is inlined that should
  be a component.
- **A layout owns the head, and there is one layout per page SHAPE, not per page.** Three layouts is
  normal. Twelve means they are being used as pages.

## 3. One section, one component

The rule: **every distinct region of a page is its own component**, named after what it is.

A page then reads as its own table of contents:

```astro
---
// src/pages/index.astro
import BaseLayout from '@layouts/BaseLayout.astro';
import Hero from '@components/Hero.astro';
import Features from '@components/Features.astro';
import Pricing from '@components/Pricing.astro';
import Faq from '@components/Faq.astro';

const plans = await getPlans();
---

<BaseLayout title="Plans and pricing" description="What each plan includes, and what it costs.">
  <Hero heading="Pricing that stops at three lines" />
  <Features />
  <Pricing plans={plans} />
  <Faq />
</BaseLayout>
```

**The budget that makes this enforceable:** a file in `src/pages/` holds at most about **60 lines**
of template. Not a style preference — a page longer than that is holding markup, and markup in a
page file cannot be reused by the next page, which is how the second page becomes a copy of the
first.

**When a component earns its own file:** the second copy of a piece of markup is a coincidence. The
third is a component. Do not extract on the first, and do not tolerate the fourth.

## 4. Props are typed, or the component is not reusable

Every component that takes input declares its shape. An untyped prop is a prop whose contract lives
only in the one call site that already exists, which means the second call site guesses.

```astro
---
// src/components/Hero.astro
interface Props {
  heading: string;
  /** Optional: omitted on pages where the heading carries the whole message. */
  sub?: string;
  /** Rendered as the primary action. Omit for a section with no action. */
  action?: { label: string; href: string };
}

const { heading, sub, action } = Astro.props;
---

<section class="hero">
  <h1>{heading}</h1>
  {sub && <p class="hero__sub">{sub}</p>}
  {action && <a class="hero__action" href={action.href}>{action.label}</a>}
</section>
```

Three things this example is doing on purpose:

- **Optional props are optional in the type**, and the template handles their absence. A component
  that renders an empty `<p>` when `sub` is missing produces a blank gap nobody can find in the CSS.
- **The comment says when to omit**, not what the prop is. `heading: string` already says what it is.
- **One `<section>` at the root.** A section component returning two sibling top-level elements
  cannot be laid out by its parent, so the parent starts wrapping it in a `<div>`, and the layout
  logic ends up split across two files.

## 5. Zero JavaScript is the default, and every exception is argued

Astro ships no client JavaScript for a component unless a `client:*` directive asks for it. That
default is the reason to use Astro. Keep it.

| Directive | Use when |
|---|---|
| *(none)* | the component renders once and never changes. **This is most components.** |
| `client:visible` | it is interactive but below the fold — a carousel, a map, an accordion further down |
| `client:idle` | it is interactive, above the fold, and can be a second late |
| `client:load` | a delay would be visible or would lose input — the only case that justifies blocking |
| `client:media="..."` | the interactivity only exists at one breakpoint, such as a mobile-only drawer |
| `client:only="react"` | it cannot render on the server at all. Needs the framework name as its value, because the component never runs during the build and Astro has nothing to infer from. |

**The rule for the ones that hydrate:** a `client:*` directive gets a comment saying what breaks
without it. If that sentence cannot be written, the directive is decoration.

**The failure this prevents:** hydrating a whole page turns Astro into a slower way to ship a React
app. A useful signal is that a page has one island for a menu toggle — which is a `<details>` element
in disguise and should have no JavaScript at all.

`server:defer` turns a component into a server island rendered on demand. It needs a server, so on a
static build it is not an option; reach for it only if the project has already stopped being static,
which is a decision from section 1 and not from here.

## 6. Data lives in a collection with a schema

Content belongs in `src/content/`, declared in **`src/content.config.ts`**, with a Zod schema.

The path matters: older majors kept this at `src/content/config.ts`, and that is the single most
common stale instruction about Astro. In Astro 7 the file sits at the root of `src/`, collections
declare a `loader`, and Zod is imported from `astro/zod`:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
```

**Why a schema and not an array in a component.** The schema fails the BUILD when an entry is
missing a field. An array of objects inside a component fails at render, on one page, as a blank
element — and only if somebody looks at that page. A required `description` that a schema enforces is
also the description [seo-page.md](../../static-site-seo/references/seo-page.md) requires on every page, so the guard is worth more
than the typing it costs.

**Not everything is a collection.** Three navigation links are a typed constant in one file, not a
content collection. The line: content is a collection when entries are added over time by someone who
is not editing components.

## 7. Naming

| Thing | Rule |
|---|---|
| Component file | `PascalCase.astro`, and the filename IS the component name |
| Section component | named for what it IS — `Pricing.astro`, `Faq.astro` |
| Never | named for how it looks — `GreenBox.astro`, `ThreeCards.astro`, `Section2.astro` |
| Primitive | named for its role — `Button.astro`, `Card.astro`, `Prose.astro` |
| Route file | lowercase, hyphenated, matching the URL — `pages/case-studies.astro` |
| Import alias | configured in `tsconfig.json`, so a move does not rewrite `../../..` chains |

The "never" row is the one that gets broken. `ThreeCards.astro` is a name that dies the day the
design uses four, and renaming it means touching every page that imports it — so nobody renames it,
and the codebase now describes a layout that no longer exists.

## 8. Styles

- **Component styles are scoped**, which is Astro's default for a `<style>` block. Keep them there:
  a section's spacing belongs beside its markup.
- **Tokens live in exactly one global stylesheet**, imported once by the layout. Every value from
  section 3 of [visual-craft.md](./visual-craft.md) is defined there and referenced everywhere else.
- **A literal token value inside a component is a bug**, not a shortcut. `padding: 24px` in a
  component when the scale defines `--space-6: 24px` is a value that will not move when the scale
  does, and it will be the one section that looks wrong after a redesign.
- **Scoped styles do not reach into a child component.** Style the child in the child, or pass a
  prop. Reaching in with `:global()` from a parent is how one section starts changing another.
- **Scoping covers the markup the component renders, and stops there.** Astro scopes a `<style>`
  block by stamping an attribute onto the elements it compiles. Elements a third-party script
  creates at runtime — a widget, a map, a payment field, anything mounted into a container after
  the page loads — did not exist when that attribute was handed out, so a scoped rule compiles to
  a selector that can never match them. **Style that DOM from a global stylesheet**, keyed off
  whatever container it mounts into, and keep the component's own `<style>` for the component's own
  markup. The integration's documentation owns which selectors to write; this rule is only about
  which file they go in.

**Why that last one is stated rather than left to be discovered:** it fails while looking like it
worked. A placeholder written into the template to stand in for the third-party content is real
markup, so it gets the attribute and picks up the scoped rules — it renders styled, the page looks
finished, and the actual content arrives unstyled in the same slot. Nothing throws. The most common
version is a form or a widget that was signed off against its own mock.

## 9. Traps

Each of these produces working output on the first page and a mess by the fourth.

- **Frontmatter runs at build time, once.** `new Date()` in a component bakes the build date into the
  HTML. It is not wrong, it is just frozen — and on a static site nothing will ever update it.
- **`client:only` without a framework name renders nothing.** The value is required, and the
  component silently does not appear rather than erroring the way a missing import would.
- **`set:html` does not sanitize.** Anything reaching it from a collection or an API is inserted as
  markup. Sanitize before, or use a slot.
- **A `<slot>` with no name takes everything.** Named slots need `<slot name="x">` in the component
  and `slot="x"` on the child; a typo in either silently drops the content into the default slot.
- **Two components with the same filename in different directories** compile fine and are impossible
  to tell apart in an import list. The filename is the name — keep it unique across the project.
- **A page that imports nothing from `src/components/`** is either genuinely trivial or is holding
  its sections inline. Check which.

## 10. Checklist

Before calling a page done:

- [ ] `output` is `'static'`, `build.format` is `'directory'`, no adapter
- [ ] the page file is under ~60 lines and reads as an outline of the page
- [ ] every section is a component named for what it is
- [ ] every component taking input declares `interface Props`
- [ ] every `client:*` directive has a comment saying what breaks without it, and there is no
      directive on a component that only needs `<details>`
- [ ] repeated content is a collection in `src/content.config.ts` with a schema
- [ ] no literal spacing, colour or radius value inside a component
- [ ] `dist/` holds one `.html` file per route
