# Toolchain — the install contract

## Start here

What gets installed on the machine, which package manager puts it there, and what has to be true
before a new dependency is allowed in. It is the shortest document in the set and the only one whose
rules are about a **risk** rather than a result.

| This document owns | It does not own |
|---|---|
| runtime and package manager versions, and how they are pinned | where source goes — [astro-structure.md](../../astro-craft/references/astro-structure.md) |
| the install-time security posture and how a dependency is admitted | what the result looks like — [visual-craft.md](../../astro-craft/references/visual-craft.md) |
| whether a styling toolkit is installed at all | whether a value may be a literal — [visual-craft.md](../../astro-craft/references/visual-craft.md) |

Verified against **Astro 7** and **Bun 1.2.13**, against this project's own `package.json` and
against `bun install --help` and `bun pm --help` run on the installed Bun. Every version and default
below is a fact read from those, not a preference — check it rather than trusting this file to be
current.

**Bun is this project's package manager. There is no pnpm migration, planned or in progress.**
`bun.lock` is the only lockfile this project keeps; it is committed and it is the source of truth for
what actually gets installed.

## 1. What has to be installed

| Requirement | Version | Note |
|---|---|---|
| Node.js | **v22.12.0 or higher** | Astro 7's own floor. Pinned in `package.json`'s `engines.node`. |
| Bun | **1.2.13 or higher** | The package manager and the script runner both. Pinned in `package.json`'s `packageManager` and `engines.bun`. |
| A terminal and an editor | — | The Astro extension for VS Code is worth having and is not a requirement. |

**Both are pinned in `package.json`, as they already are in this project:**

```json
{
  "packageManager": "bun@1.2.13",
  "engines": { "node": ">=22.12.0", "bun": ">=1.2.13" }
}
```

`packageManager` is what makes a teammate's `bun install` run the same Bun as yours. `engines`
documents the floor for anyone reading the manifest; verify on your own machine whether the installed
Bun actually refuses a mismatched Node before relying on that as an enforced gate — this file does not
claim an enforcement behaviour it has not confirmed against the installed tool.

Starting a fresh project (this one already exists, so this is for a new one):

```bash
bun create astro
```

## 2. Bun's install-time security posture — verified, and the genuine advantage

**The mechanism first, because the posture only makes sense once it is clear.** A package can declare
`preinstall`, `install` and `postinstall` scripts, and those run **arbitrary code on the machine
performing the install**, with that machine's shell, environment variables, credential files and
network access.

Read that again with the consequence attached: the danger is not the code you `import`. It is the
code that runs *before you import anything*. A compromised version of a package you never call,
pulled in four levels deep as somebody else's transitive dependency, still gets execution on your
laptop and in your CI.

`npm` runs those scripts by default. **Bun does not, unless the package is listed in
`trustedDependencies`.** Verified directly from `bun install --help`:

```text
--ignore-scripts   Skip lifecycle scripts in the project's package.json (dependency scripts are never run)
--trust            Add to trustedDependencies in the project's package.json and install the package(s)
```

That parenthetical — "dependency scripts are never run" — is Bun's own wording for the default
behaviour, not a flag you have to remember to pass. This is a stronger default than npm's, where every
install runs every script unless you remember `--ignore-scripts` on every single command.

**Bun also ships a curated allowlist of common, legitimate script-running packages** (`esbuild`,
`sharp`, and roughly 360 others as of 1.2.13 — see `bun pm default-trusted`), so tooling that
genuinely needs a postinstall to fetch a prebuilt binary keeps working without every project having to
declare it by hand. This project's `package.json` declares **no `trustedDependencies` of its own**;
running `bun pm untrusted` against the installed tree confirms **0 untrusted dependencies with
scripts** — every dependency that has a script is either script-free or covered by Bun's own default
allowlist, and nothing in this project has been opted in beyond that.

Two commands worth knowing:

- **`bun pm untrusted`** — prints every dependency with a script that Bun did *not* run. Run it after
  any install that added a package with a native or postinstall step; an empty list is not a
  guarantee, it is a fact about the tree as it exists right now.
- **`bun pm trust <name>`** — adds `<name>` to this project's own `trustedDependencies` and runs its
  scripts. Do this deliberately, one package at a time, after reading what the script does — never as
  a reflex to make an install stop complaining.

## 3. What Bun does not give you

**Say this plainly, because pretending otherwise is worse than the gap itself.**

- **No `minimumReleaseAge` equivalent.** pnpm 11 can delay a newly published version by a
  configurable window so that an ordinary install never sees the first hours after a compromised
  publish. Bun has no counterpart flag or setting — a fresh publish is installable the moment it
  resolves, exactly like npm.
- **No `pnpm-workspace.yaml`, and no per-package `allowBuilds`/`strictDepBuilds` surface.** Bun's
  script control is the binary `trustedDependencies` list described above, not a graduated,
  per-package review gate with a strict-fail mode.
- **No `trustPolicy: no-downgrade` equivalent.** Nothing here refuses a package whose trust level
  dropped since an earlier release.

**The mitigation, since the control itself does not exist:**

- **Lockfile review is not optional here — it is the substitute.** `bun.lock` is committed; read the
  diff on any dependency bump before merging it, the way you would read a `minimumReleaseAge` delay if
  Bun had one. A version bumped an hour ago is exactly the case the missing control would have caught.
- **`bun install --frozen-lockfile` in CI, always.** It refuses to resolve a new tree that disagrees
  with the committed lockfile, which is the closest thing to a floor Bun offers: nobody's local
  install can silently drift the tree that ships.
- **Dependency count discipline.** With no age delay and no per-package build gate, the cheapest
  remaining control is not adding the dependency in the first place. `bun pm ls --all` prints the full
  resolved tree; look at what a new package drags in before adding it, the same way section 4 asks you
  to.

## 4. How a dependency enters the project

The install command is the last step, not the first. Everything before it is the review, and it is
short enough that skipping it is never about time:

1. **Say what it solves and what it replaces.** A dependency that duplicates something already
   present is a second way to do one thing.
2. **Look at what it drags in.** `bun pm ls --all` after the fact, and the dependency count before. A
   package with one direct use and forty transitive dependencies is forty packages of exposure —
   forty packages section 3's mitigations now have to cover, since Bun cannot delay or gate them for
   you.
3. **Check whether it needs a script.** After installing, run `bun pm untrusted`. If the new package
   shows up there, its script did not run; read the script before deciding whether to `bun pm trust`
   it. Do not reach for `--trust` as a reflex to make the warning go away.
4. **Give it a real version constraint** — `^7.4`, never `*`. An open constraint resolves against
   whatever the resolving machine happens to allow, which is how a lockfile gets produced that another
   machine physically cannot reproduce.
5. **Commit `bun.lock` in the same commit as the `package.json` change.** They are one fact recorded
   in two files; separated, the repository states two different trees and CI believes the one you did
   not review.

Commands, for reference:

```bash
bun install --frozen-lockfile  # CI and any clean checkout — never resolves a drifted tree
bun add <name>                 # add a runtime dependency
bun add -d <name>               # add a dev dependency
bunx astro add <integration>    # wire an Astro integration (see section 5 for Tailwind specifically)
```

## 5. Tailwind, if the project decides on it

The current path, for Tailwind 4 — and this project already has it installed this way:

```bash
bunx astro add tailwind
```

That wires the `@tailwindcss/vite` plugin. Then `@import "tailwindcss";` goes in a stylesheet —
conventionally `src/styles/global.css` — and the layout imports that file.

**`@astrojs/tailwind` is deprecated and is not the route for a new project.** It existed for Tailwind
3. A project still carrying it is on the old path and needs the migration, not a version bump.

**Check the browser floor before running that command at all.** Tailwind 4 is built on CSS features
that raise it, and by enough that it disqualifies the tool on a project supporting older devices —
the numbers, and what they exclude, are in [browser-support.md](../../astro-craft/references/browser-support.md) section 6. That
is a compatibility decision wearing the costume of an install step, which is exactly how it gets
made without being made.

**Now the part that matters more than the command.** Installing Tailwind is a decision, and on this
kind of project it is usually made by reflex rather than decided. When a project arrives with a design
system already in it — a stylesheet of tokens and named component classes — a utility framework
invites every section to be styled inline instead, which leaves the project with **two styling systems
side by side**: the one it was given and the one that got installed. The second one always wins,
because it is closer to the markup being written.

Whether a value may be a literal at all is [visual-craft.md](../../astro-craft/references/visual-craft.md)'s rule, not this
document's. What belongs here is narrower: the moment the choice exists is `bunx astro add`, it is
cheap to make deliberately and expensive to undo once forty components use utilities, and "the
experienced developers wanted it" is a preference to record rather than a requirement to satisfy.

## 6. What none of this protects against

Written down because an unlisted gap gets mistaken for a covered one:

- **There is no age-based delay of any kind.** Section 3 already says this, and it is worth repeating
  here next to the rest of the list: a compromise published minutes ago is installable now, and
  nothing in this toolchain buys time against it. Lockfile review is a human doing the job a delay
  would have automated.
- **The trusted-dependencies allowlist covers install-time execution only.** A malicious package that
  you import and call executes at build time no matter what `trustedDependencies` says. Blocking
  install scripts narrows the vector; it does not close it.
- **A lockfile proves what was resolved, not that it was safe.** Integrity hashes confirm the bytes
  have not changed since resolution — including when the bytes were already hostile.
- **Bun's default-trusted list is Bun's, not this project's.** It changes with the Bun version you
  have installed, not with a decision anyone on this project made. `bun pm default-trusted` shows the
  list for whatever Bun you are actually running.
- **Nothing here reads the code.** No rule in this document has looked at a single line of any
  dependency, and no audit tool in the ecosystem knows about an advisory before it is published.

## 7. Checklist

Before a project is considered set up, and again whenever a dependency is added:

- [ ] Node is v22.12.0 or higher
- [ ] `packageManager` is pinned to the Bun version in use, and `engines` names both floors
- [ ] `bun.lock` exists and is committed
- [ ] CI installs with `--frozen-lockfile`
- [ ] `bun pm untrusted` was run after the last dependency change, and its output was read, not just
      glanced at
- [ ] `bun pm trust` was used deliberately, package by package, never as a reflex
- [ ] no dependency carries an open `*` constraint
- [ ] the lockfile is committed alongside the `package.json` that produced it
- [ ] if a styling toolkit was installed, the decision is recorded rather than assumed
