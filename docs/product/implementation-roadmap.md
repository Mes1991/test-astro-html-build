# Implementation roadmap

The capabilities this template is converging on, in the order they are built,
with the criterion each one must satisfy to count as done.

`docs/product/template-contract.md` states *what* the product is.
`docs/product/current-repository-map.md` states what the repository contains
*today*. This file states *how the second becomes the first*, and is the
canonical order of work: where another document implies a different sequence,
this one decides.

## How a phase is accepted

A phase is done when its acceptance criteria hold and can be re-checked by
someone who was not there. Two rules apply throughout:

**Nothing is accepted on inspection alone.** Where a phase adds or changes a
validator, the proof is a producer mutation: break the input on purpose, confirm
the build or the test suite fails with a precise diagnostic, restore, confirm
green again. Reading a gate and agreeing with it proves nothing about the gate.

**Documentation may only state what the code does.** A capability is either
implemented and verifiable, or described plainly as not built. There is no third
category.

## Phases

### B — Coherence and safe adoption

**Goal.** Someone cloning this template gets documentation that matches the
code, configuration with a single source per fact, and no automation acting on
their repository that they did not choose.

**Deliverables**

- Agent-facing contracts (`CLAUDE.md`, `AGENTS.md`, `AUDIT.md`,
  `skills/static-site-seo/SKILL.md`, `docs/product/rebrand-checklist.md`) agree
  with the code, with a test protecting the parts that can be machine-checked.
- One canonical source for the site origin, consumed everywhere else.
- A declared environment contract: every variable the code reads is documented
  and typed, and nothing is documented that the code does not read.
- One version source.
- Performance budgets that audit routes the build actually emits.
- Font licences shipped with the fonts they cover, with stated provenance.
- Read-only CI stays active; automation with side effects is withdrawn from the
  default template rather than made configurable.

**Acceptance**

- `bun run test`, `bun run check` and `bun run build` green.
- Changing the site origin in its canonical place alone leaves the build clean.
- No default-shipping workflow both triggers automatically and performs a write.
- Every audited performance URL is a route the build emits, in canonical form,
  and none answers 404.
- Remote CI observed green on a real run after publication.

**Depends on.** Nothing. B is first.

### C — Hardening of gates and invariants

**Goal.** The build-time gates hold under inputs nobody has written yet, and the
invariants the contracts assert are enforced rather than trusted.

**Deliverables**

- The `seo-lint` gate surface extended where it currently classifies by
  heuristic: asset classification for extensionless and unusual public files,
  opt-out for sitemap discovery, regional locale variants in hreflang matching,
  and a content-contract rule for slugs the router cannot carry.
- Attribute extraction in the route gates made insensitive to attribute order
  and quoting style.
- Provenance analysis in the documentation-parity gate: value flow through
  variable initialisers, so a finding constructed outside the analysed module
  graph cannot reach a collector unnoticed.
- i18n key parity enforced by a test rather than by review.

**Acceptance**

Every gate proven by deliberately breaking its producer and confirming a precise
diagnostic. Key parity proven by deleting a key and watching the suite fail.

**Depends on.** B, for the contracts that say what the gates are meant to hold.

### D — Content and languages

**Goal.** The content model supports real translations, and the bilingual core
becomes a genuine option rather than a requirement.

**Deliverables**

- Per-locale content bodies, not translated frontmatter on a shared body.
- A tested path from the bilingual default to a single-language site.
- A documented flow for adding a locale.
- The contract for a second content collection alongside `blog`.

**Acceptance**

Three site-scale mutations, performed rather than described: a Spanish body
renders at `/es/blog/<slug>/`; the documented monolingual conversion builds
green; adding a third locale builds green. `seo-lint` clean and i18n key parity
holding in all three.

**Depends on.** C, because each of these changes what the route and sitemap
gates see.

### E — Measured operability of skills

**Goal.** The skill library is actually used by the agents it is written for,
and that is measured rather than assumed.

**Deliverables**

- A routing mechanism an agent follows in practice.
- A skill corpus that fits the context budget this repository sets for itself.
- An Astro binding layer for `form-slot`, which today stops at contract.

**Acceptance**

A clean-agent simulation, repeated, recording which skills were opened and
followed. Prose review is not an acceptance criterion here: a phase that only
rewrites documentation fails this by construction.

**Depends on.** B, for contracts worth routing to.

### F — Deployment, workflows and supply chain

**Goal.** What ships is pinned, hardened and explained, and the build emits
nothing unexplained.

**Deliverables**

- Actions pinned by commit rather than by mutable tag.
- The active CI tests the Node version `engines` declares, asserted against it
  rather than hardcoded twice.
- Security headers in `public/_headers`.
- Standalone pages (`404`, `coming-soon`) brought into the head contract.
- Build warnings triaged: each one silenced deliberately or fixed.
- Pre-1.0 single-maintainer dependencies re-evaluated.
- Per-provider deployment recipes, including the host-level redirect
  `trailingSlash: 'always'` cannot perform for prerendered pages.

**Acceptance**

`bun run build` green with every warning explicitly accounted for. Workflow and
supply-chain changes human-reviewed. Optional workflows live outside
`.github/workflows/` or trigger only on `workflow_dispatch`.

**Depends on.** B, which decides which workflows exist at all.

### G — Adoption contract

**Goal.** The published description of the template matches what it actually
does, so someone adopting it can predict what they are getting.

**Deliverables**

- A capability matrix: what the template does, what is opt-in, what is not
  built.
- A migration profile for dynamic or backend-backed use, described as a
  profile rather than as a verified capability.
- `README.md`, `AGENTS.md` and the template contract rewritten against the
  matrix.

**Acceptance**

Every row of the matrix mechanically checkable against the repository. A row
claiming "opt-in" must correspond to a workflow that does not trigger
automatically. A row claiming a capability must correspond to a command that
demonstrates it.

**Depends on.** B through F, all of them. **G is last, and that is not a
preference.** A capability matrix written before the phases that establish the
capabilities is a document describing intentions, which is the failure this
roadmap exists to prevent.

## Not scheduled

Capability that is deliberately unbuilt, recorded so it is not mistaken for an
oversight:

- **Automatic skill distribution.** `skills/` is canonical and is opened
  directly by path. The generator that would materialise per-agent adapters
  (`.agents/skills/`, `.claude/skills/`) is specified in
  `docs/product/agent-ecosystem-contract.md` and does not exist. Until it does,
  that contract describes a target, not a mechanism.
- **A release automation recipe.** The template ships no automated release.
  Whoever wants one adopts it deliberately.

These have no phase because they have no committed date. Moving one into a phase
is a product decision, not a scheduling detail.
