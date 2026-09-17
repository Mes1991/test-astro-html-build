# Skills — the canonical catalog

This directory is the single authored source for the project's workflow skills and their
contracts. Everything here is written to be read by an agent and by a person.

**How to use it.** When a task matches a row below, read that file before writing code, not after:
the rules in these are not reconstructable from the code that follows them. A skill triggers on its
own from its description; this index is the floor for when one does not fire.

## The seven skills

| Skill | Canonical path | Use when |
|---|---|---|
| `site-build` | [`site-build/SKILL.md`](./site-build/SKILL.md) | The order every other workflow runs in, and which input wins when they disagree. |
| `project-setup` | [`project-setup/SKILL.md`](./project-setup/SKILL.md) | The questions to settle before any markup: build step, styling toolkit, languages. |
| `astro-craft` | [`astro-craft/SKILL.md`](./astro-craft/SKILL.md) | Building or editing an Astro page, section, component or style. |
| `design-ingestion` | [`design-ingestion/SKILL.md`](./design-ingestion/SKILL.md) | A design arrives — Figma, export, screenshot, mockup — before any markup. |
| `form-slot` | [`form-slot/SKILL.md`](./form-slot/SKILL.md) | A page has a form that does not exist in the provider's builder yet. |
| `static-site-seo` | [`static-site-seo/SKILL.md`](./static-site-seo/SKILL.md) | Creating, renaming, translating or removing a page, or touching its head or structured data. |
| `visual-gate` | [`visual-gate/SKILL.md`](./visual-gate/SKILL.md) | Proving a built page against a reference, or checking it at every width. |

## The contracts

Each contract is owned by exactly one skill. Read the one that owns what you are about to touch.

| Contract | Canonical path | When |
|---|---|---|
| `toolchain.md` | [`project-setup/references/toolchain.md`](./project-setup/references/toolchain.md) | What to install, and why pnpm rather than npm. The install-time security posture. |
| `astro-structure.md` | [`astro-craft/references/astro-structure.md`](./astro-craft/references/astro-structure.md) | Where source goes so the built site stays workable. For whatever writes the components. |
| `visual-craft.md` | [`astro-craft/references/visual-craft.md`](./astro-craft/references/visual-craft.md) | The decisions that stop a page looking generated. Dials, closed scales, hard bans. |
| `browser-support.md` | [`astro-craft/references/browser-support.md`](./astro-craft/references/browser-support.md) | The floor: which CSS and JS features you may write, and how to reach past it. |
| `accessibility.md` | [`astro-craft/references/accessibility.md`](./astro-craft/references/accessibility.md) | WCAG 2.2 AA for a static page: landmarks, keyboard, focus, contrast, forms. |
| `design-source.md` | [`design-ingestion/references/design-source.md`](./design-ingestion/references/design-source.md) | Where the values come from: provenance, what to extract, and why an icon is never approximated. |
| `form-slot.md` | [`form-slot/references/form-slot.md`](./form-slot/references/form-slot.md) | Building a page whose form does not exist yet. What is markup and what is embed. |
| `form-schema.md` | [`form-slot/references/form-schema.md`](./form-slot/references/form-schema.md) | The JSON that builds a form. Hand this to whatever generates the definition. |
| `embed-styling.md` | [`form-slot/references/embed-styling.md`](./form-slot/references/embed-styling.md) | The DOM and classes the embed emits. Hand this to whatever writes the CSS. |
| `embed-tracking.md` | [`form-slot/references/embed-tracking.md`](./form-slot/references/embed-tracking.md) | What a tag manager can observe: the network calls, the messages, the safe hooks. |
| `file-fields.md` | [`form-slot/references/file-fields.md`](./form-slot/references/file-fields.md) | Why a file field validates but never arrives, and what to use instead for now. |
| `site-manifest.md` | [`site-build/references/site-manifest.md`](./site-build/references/site-manifest.md) | One file for a site of many pages: families, exceptions, forms and what is verified. |
| `gtm-injection.md` | [`site-build/references/gtm-injection.md`](./site-build/references/gtm-injection.md) | Installing a container without breaking it. Every failure here is silent. |
| `seo-site.md` | [`static-site-seo/references/seo-site.md`](./static-site-seo/references/seo-site.md) | Root files, URL shape, crawler access and delivery. For whatever builds the site. |
| `seo-page.md` | [`static-site-seo/references/seo-page.md`](./static-site-seo/references/seo-page.md) | One page: head, structure, Core Web Vitals, and the shape an answer needs. |
| `seo-schema.md` | [`static-site-seo/references/seo-schema.md`](./static-site-seo/references/seo-schema.md) | All the JSON-LD, and which types are still worth writing at all. |
| `seo-offpage.md` | [`static-site-seo/references/seo-offpage.md`](./static-site-seo/references/seo-offpage.md) | Links, brand mentions and paid traffic — the part that is not in your files. |
| `visual-fidelity.md` | [`visual-gate/references/visual-fidelity.md`](./visual-gate/references/visual-fidelity.md) | Proving the page matches: the viewport matrix, the capture harness, the evidence, and what PASS means. |

## Two things these documents rely on

The pack is versioned as a unit through releases and Git history, not through per-document headers.
And none of them restates another: if a rule seems missing from one, it belongs to a different row.

## Distribution

How these files reach an agent's runtime — the generated adapters, the setup and check commands —
is documented separately in [`distribution.md`](./distribution.md). This index deliberately does
not repeat it, so that it stays independent of any one agent.
