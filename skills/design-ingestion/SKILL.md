---
name: design-ingestion
description: "Use the moment a design arrives and before any markup is written — a Figma link or node id, a design file, an exported page, a component-library layout, a mockup or a screenshot. Trigger it on 'here is the Figma, build this', 'implement this node', 'pull the tokens out of the design', 'use these assets', or a design URL pasted with no instructions. Also use it for icons that are close but are not the design's, a design that was generated or imported rather than drawn, which of several inputs is authoritative, or a design tool that hands back generated code."
---

# Design ingestion

## What this is

A workflow for the moment a design arrives and the page does not exist. It tells you what to DO and
in what order; two contracts tell you what is CORRECT. **This file restates none of their rules** —
two copies of a rule means one of them is wrong and nobody knows which.

| Contract | Owns |
|---|---|
| `references/design-source.md` | provenance, what to extract, assets, generated code, what a design file does not contain |
| `../astro-craft/references/visual-craft.md` | what the page should look like once the values are in hand |

Save both into the project's `docs/`. A skill pointing at a contract nobody saved is a dead
reference.

**This runs before markup, and that is the whole point.** Everything below is cheap now and
expensive after the fourth page.

## The rule this exists to enforce

**A file that opens in a design tool is not automatically an authored design.** Ask what produced
it before you take a single number out of it.

Everything else here follows from that one question being asked out loud.

## The workflow

Run these in order, per node, before writing markup.

### 1. Establish provenance, and say what you ranked first

Read `references/design-source.md` section 0 and answer its question: **who authored this, and what generated
it.** Then rank the inputs you were handed and state the ranking.

Two outcomes end this step early and both are fine:

- **the answer is unknown and the signals are ambiguous** — ask. One question, and it changes the
  rank of your highest-ranked input;
- **there is a chain and nobody said which link is live** — ask that too. It is the one question
  worth interrupting for, because matching a stale reference produces a clean result for the wrong
  page.

**Write the answer down** with the reason, where the project keeps its settled decisions.

### 2. Extract, one node at a time

Work `references/design-source.md` section 1 in its order: frame identity, then variables, then typography,
then geometry, then colour, then the asset inventory.

**One node per pass.** Two nodes at once produces values attributed to the wrong one, and both sets
look plausible.

If the design arrives over an MCP server, section 4 of that contract says what each call is worth —
in particular that the frame screenshot is a flat image and not a source of numbers, even though it
arrives in the same breath as everything else.

### 3. Export the assets

Every icon and image, from the design's own asset. Not the closest match in an icon library the
project already installs.

**If an asset cannot be obtained, stop and say so.** `references/design-source.md` section 2 is the argument
for why substituting is worse than blocking: a lookalike passes every automated check that exists
and is visible to the client in the first ten seconds.

Count them against the inventory from step 2, so a missing one is a number rather than a discovery.

### 4. Take values, never structure

Any code the design tool produced is an export. Values from it are worth what step 1 established.
**Structure comes from the structure contract for the stack you are on**, whatever the export
looked like.

### 5. Name what the design does not answer

List the states the file never drew — hover, focus, error, empty, loading, long text, missing image,
and every width it was not drawn at. You are going to decide these. Say that you decided them, and
say it in the handover rather than only in a file at the root.

### 6. Record the extraction, then stop

Write down what step 6 of `references/design-source.md` asks for: the node, the frame, its width, the
provenance and how you established it, what you ranked first, and the assets you got and did not
get.

**Then hand over. Do not start the markup in this pass.** What you are handing over is an extraction
with a stated provenance and no claims about a page — and keeping the two apart is what makes the
extraction reusable when the page is rebuilt.

## What this workflow does not prove

- **That the provenance is right.** Section 0's signals are signals. Asking is the reliable move
  and this workflow can only make you ask.
- **That the design is good, or that it is the right node.**
- **That an exported asset is the one the reference shows.** Comparing what you built against the
  reference is a different job and `../visual-gate/references/visual-fidelity.md` owns it.
- **Anything about the built page**, which does not exist yet when this runs.
