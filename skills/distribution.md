# Distribution — how the skills reach an agent

This document describes how the canonical skills under `skills/` reach the agents that consume
them, today and in a planned future state. It replaces the per-agent installation guides that
shipped with the imported packs: those described extraction, global configuration, network approval
and auto-discovery specific to one agent, and none of that survives here.

**Current state and future state are two different sections below, on purpose.** Do not read one
into the other — the commands under "Future: the generator" do not exist as files yet, and claiming
otherwise is exactly the mistake this document was rewritten to stop making.

## Current mechanism: read by path

**Today, in a clean clone of this repository, there is no generator and no per-agent adapter
directory.** An agent reaches a skill by reading `skills/<name>/SKILL.md` directly, at its canonical
path in this repository — the same path [`README.md`](./README.md) lists for every skill. This is
not a fallback for a mechanism that is temporarily unavailable; it is the current, only mechanism.

- **`skills/` is the single authored source.** Every skill and contract is written once, here, and
  nothing else in this repository is meant to be a second copy of it.
- **Nothing here fetches, generates, or installs anything.** Opening a file at its canonical path
  needs no script, no network access, and no setup step.

The full contract for the model this pack is moving toward — the ratified decisions, the acceptance
matrix and the known risks — is `docs/product/agent-ecosystem-contract.md`.

## Future: the generator

**`scripts/agent-setup.mjs` and `scripts/agent-check.mjs` do not exist in this repository.** They are
a planned future unit, not files you can run today, and the paragraphs below describe the *intended*
interface so that whoever builds it has a target — not an instruction to run something that is not
there. Do not tell anyone these commands work; check `scripts/` yourself before relying on this
section, since it is the kind of gap that gets closed without every document being updated the same
day.

The intended shape, once built:

```text
node scripts/agent-setup.mjs <target>
```

`<target>` would be one of `codex`, `claude`, `opencode`, or `all`, copying the canonical skills into
each consumer's expected location:

- `codex` and `opencode` would materialize into `.agents/skills/`.
- `claude` would materialize into `.claude/skills/`.
- `all` would run every target at once — an advanced mode, to be used deliberately rather than by
  default once it exists.

```text
node scripts/agent-check.mjs
```

`agent-check` would verify that each generated adapter matches the canonical source by hash, and
report drift rather than fix it; re-running `agent-setup` would regenerate it.

**Neither generated adapter directory — `.claude/skills/` or `.agents/skills/` — exists in this
repository today**, and neither is a current operational requirement. Nothing in this project depends
on them being present; the by-path mechanism above works without them.

## What stays out of scope, in either state

- **No network access.** Reading a file by path today, and the planned setup/check scripts
  tomorrow, only ever touch the local repository.
- **No global configuration.** Nothing in this distribution model edits `~/.codex`, `~/.claude`, or
  any other machine-level file, in the current mechanism or the planned one. An agent's own personal
  or machine-wide configuration is that agent's own concern, not something this pack writes to.
- **No auto-discovery.** A consumer is told where its skills are — today, by this catalog's paths;
  tomorrow, by the generated adapter location — and nothing scans the filesystem for them on its own.
