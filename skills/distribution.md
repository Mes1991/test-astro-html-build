# Distribution — how the skills reach an agent

This document describes how the canonical skills under `skills/` are materialized for the agents
that consume them. It replaces the per-agent installation guides that shipped with the imported
packs: those described extraction, global configuration, network approval and auto-discovery
specific to one agent, and none of that survives here.

## The model

- **`skills/` is the single authored source.** Every skill and contract is written once, here.
- **Adapters are generated copies, not symlinks.** A consumer's directory is materialized from
  `skills/` by a script, and is excluded from Git. It is never edited by hand.
- **The canonical source is the only thing a human edits.** A change made in a generated adapter
  is overwritten on the next run.

The full contract for this model — the ratified decisions, the acceptance matrix and the known
risks — is `docs/product/agent-ecosystem-contract.md`.

## Setup

```text
node scripts/agent-setup.mjs <target>
```

`<target>` is one of `codex`, `claude`, `opencode`, or `all`. The script copies the canonical
skills into the consumer's expected location and records what it wrote.

- `codex` and `opencode` materialize into `.agents/skills/`.
- `claude` materializes into `.claude/skills/`.
- `all` runs every target. It is an advanced mode: it writes into every consumer's directory at
  once, so use it deliberately rather than by default.

The script is the entrypoint. It does not fetch anything over the network, does not install
packages, and does not discover skills from a remote source. Everything it needs is in the
repository.

## Check

```text
node scripts/agent-check.mjs
```

`agent-check` verifies that each generated adapter matches the canonical source by hash. It reports
drift rather than fixing it; re-run `agent-setup` to regenerate.

## What is out of scope

- **No network access.** Setup and check read the local repository only.
- **No global configuration.** The script does not edit `~/.codex`, `~/.claude`, or any other
  machine-level file.
- **No auto-discovery.** A consumer is told where its skills are; nothing scans the filesystem for
  them.
- **The Orca orchestrator is not part of this contract.** Its profiles are personal machine
  configuration, not a template consumer, and are excluded from the distribution model.

## Status

The scripts `scripts/agent-setup.mjs` and `scripts/agent-check.mjs` are the ratified entrypoints.
Their implementation is a separate unit from the vendorization of the skill content; until that
unit is implemented and validated, the commands above describe the intended interface rather than
files that exist today. Do not claim they exist until their diff and validations are recorded.
