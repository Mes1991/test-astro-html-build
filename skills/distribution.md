# Distribution — how the skills reach an agent

This document describes how the canonical skills under `skills/` reach the agents that consume
them. It replaces the per-agent installation guides that shipped with the imported packs: those
described extraction, global configuration, network approval and auto-discovery specific to one
agent, and none of that survives here.

## By-path reading: the mechanism that always works

**In any checkout of this repository, an agent can reach a skill by reading `skills/<name>/SKILL.md`
directly**, at its canonical path — the same path [`README.md`](./README.md) lists for every skill.
This needs no script, no network access, and no setup step, and it keeps working whether or not the
generated adapters below have been materialized.

- **`skills/` is the single authored source.** Every skill and contract is written once, here, and
  nothing else in this repository is meant to be a second copy of it.
- Nothing about reading a file by path fetches, generates, or installs anything.

## Optional generated adapters

`scripts/agent-setup.mjs` and `scripts/agent-check.mjs` exist and implement the model ratified in
`docs/product/agent-ecosystem-contract.md`. They are optional: nothing in this project requires the
adapter directories they produce to be present, and the by-path mechanism above works with or without
them.

```text
node scripts/agent-setup.mjs <codex|claude|opencode|all>
# or: bun run agent:setup -- <codex|claude|opencode|all>
```

`<target>` copies every skill marked `installed: true` in `skills/registry.yaml` from its canonical
`skills/<name>/` source into that target's destination, byte for byte:

| Target | Destination |
|---|---|
| `codex` | `.agents/skills/` |
| `opencode` | `.agents/skills/` |
| `claude` | `.claude/skills/` |
| `all` | both of the above |

Each destination gets a `.agent-skills-manifest.json`, recording a content hash per skill it
materialized. That manifest is what lets the scripts tell "a skill this generator manages, now
stale" apart from "a directory that was already there for some other reason" — it never overwrites or
deletes an unmanaged, pre-existing same-name directory (`UNMANAGED_COLLISION`, reported not touched),
and it never deletes an `ADDITIONAL` entry (present in the destination, absent from the registry).

```text
node scripts/agent-check.mjs [codex|claude|opencode|all]   # target defaults to all
# or: bun run agent:check
```

Read-only. It reports, per destination and never mixing the categories: **MISSING** (registered and
`installed: true`, absent from the destination), **OUTDATED** (present, but its hash no longer matches
`skills/`), **ADDITIONAL** (present in the destination, not in the registry), and
**UNMANAGED_COLLISION** (present, `installed: true`, but not recorded in that destination's manifest —
so `agent-setup` will not touch it either). Exit code is `0` only when every checked destination is
exactly in sync; re-run `agent-setup` to fix a real discrepancy, never `agent-check` itself, which
writes nothing.

**`all` prints a warning before materializing anything.** Running every target at once means a
multi-agent runtime can discover both `.agents/skills/` and `.claude/skills/` in the same pass — this
matters concretely for OpenCode, which (per its own discovery rule in the table below) reads
`.claude/skills` **and** `.agents/skills` itself. Observed locally (OpenCode 1.18.32, 2026-09-28): with
both adapters present it lists each name once, so the risk is not duplication but shadowing — a stale
copy in one directory can win over the current one in the other, and `agent-check` only tells you
which destination drifted. Isolate skill discovery per agent runtime before relying on `all`.

## Per-runtime discovery

| Runtime | Reads | Notes |
|---|---|---|
| Codex | `.agents/skills/<name>/SKILL.md`, walked from cwd up to the repo root | Implicit (by description) or explicit `$skill`. <https://developers.openai.com/codex/skills> (checked 2026-09-28) |
| Claude Code | `.claude/skills/<name>/SKILL.md` | Description decides when to apply (description + `when_to_use` capped at 1,536 chars). Picked up in-session; a brand-new top-level skills directory created mid-session may need `/reload-skills` or a restart. <https://code.claude.com/docs/en/skills> (checked 2026-09-28) |
| OpenCode | `.opencode/skills`, `.claude/skills`, `.agents/skills` (plus its own global locations), walked up to the git worktree root | Reads **both** generated adapters when both exist (one copy per name observed) — the reason `all` warns above. Name must match `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤64 chars, matching the directory; description 1–1024 chars; loaded through its own `skill` tool. <https://opencode.ai/docs/skills/> (checked 2026-09-28) |

## Clean checkout / cloud environment

**The adapter directories are gitignored.** A fresh clone or a fresh cloud checkout has neither
`.agents/skills/` nor `.claude/skills/` until something runs `agent-setup`. If a runtime in that
environment is expected to discover skills automatically rather than by path, materialize them first —
for example, from a Codex cloud environment setup script, a Claude Code `SessionStart` hook, or by
running the command manually at the start of a session:

```text
node scripts/agent-setup.mjs <target>
```

**Timing matters.** Observed locally with Claude Code 2.1.283 (2026-09-28, disposable clean clone): a
`SessionStart` hook running `node scripts/agent-setup.mjs claude` completed with exit 0, but the
skills it created were **not** in that same session's skill list — the agent fell back to reading
`skills/<name>/SKILL.md` by path, which still picked the right skill. The next session in the same
checkout listed all of them. So generate the adapter in an environment setup step that runs *before*
the agent session starts, or accept that the first session works by path only. No hook ships in this
repository.

**Cloud verification of this bootstrap step is PENDING** (not run): the observations above come from
local clean clones, not from a Codex cloud environment or Claude Code on the web. Treat "the adapter
exists and is discovered in a cloud sandbox" as unverified until it has actually been exercised there.

## What stays out of scope

- **No network access.** Reading a file by path, and running `agent-setup`/`agent-check`, only ever
  touch the local repository.
- **No global configuration.** Neither script writes to `~/.codex`, `~/.claude`, or any other
  machine-level location. An agent's own personal or machine-wide configuration is that agent's own
  concern, not something this pack writes to.
- **The scripts themselves never scan outside the repository, and reach out over no network.** What
  is *not* true any more is "no auto-discovery" as a blanket statement: each runtime in the table
  above does auto-discover its own adapter directory once it exists — that discovery is the runtime's
  behavior, not something `agent-setup`/`agent-check` implement or control.
