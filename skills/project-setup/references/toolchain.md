# Toolchain — the install contract

> **Target guidance, not current state.** This contract describes the pnpm-based toolchain the
> product is migrating to. The repository may still be on Bun until the package-manager migration
> unit is implemented and validated. Do not describe pnpm, `pnpm-workspace.yaml` or the hardening
> posture below as already in place until that unit's diff and validations are recorded.

## Start here

What gets installed on the machine, which package manager puts it there, and what has to be true
before a new dependency is allowed in. It is the shortest document in the set and the only one whose
rules are about a **risk** rather than a result.

| This document owns | It does not own |
|---|---|
| runtime and package manager versions, and how they are pinned | where source goes — [astro-structure.md](../../astro-craft/references/astro-structure.md) |
| the install-time security posture and how a dependency is admitted | what the result looks like — [visual-craft.md](../../astro-craft/references/visual-craft.md) |
| whether a styling toolkit is installed at all | whether a value may be a literal — [visual-craft.md](../../astro-craft/references/visual-craft.md) |

Verified against **Astro 7** and **pnpm 11**. Every version and default below is a fact read from
those tools, not a preference, and each is the kind of fact that moves — check it rather than trusting
this file to be current.

## 1. What has to be installed

Three things, and nothing global beyond the first two.

| Requirement | Version | Note |
|---|---|---|
| Node.js | **v22.12.0 or higher** | Astro 7's own floor. **Even-numbered releases only** — `v23` and other odd majors are not supported, so "latest" is the wrong thing to install. |
| pnpm | 11.x | Installed once, then pinned per project by the field below. |
| A terminal and an editor | — | The Astro extension for VS Code is worth having and is not a requirement. |

**Pin both in `package.json`, in the same commit as anything else:**

```json
{
  "packageManager": "pnpm@11.0.8",
  "engines": { "node": ">=22.12.0 <23 || ^24 || ^26" }
}
```

Neither line is ceremony. `packageManager` is what makes a teammate's `pnpm install` run the same
pnpm as yours, and a different pnpm can resolve a different tree from the same `package.json` — which
is a lockfile diff nobody can explain.

**`engines` is enforced, not advisory** — for the root project specifically. pnpm's wording:
*"Regardless of this configuration, installation will always fail if a project (not a dependency)
specifies an incompatible version in its `engines` field."* (The configuration in question is
`engineStrict`, default `false`, which only governs whether a *dependency's* engine claim is
checked.) So this line turns "it works on my machine" into a failed install naming the reason.

**Which makes the range itself load-bearing, and `">=22.12.0"` alone is wrong.** It admits 23, 25 and
every future odd major — the exact versions the row above declares unsupported. A single lower bound
cannot express "even majors only", so the constraint has to be a union with a closed upper bound on
each clause:

| Clause | Admits |
|---|---|
| `>=22.12.0 <23` | 22.12 and later 22.x, which is Astro's floor |
| `^24` | 24.x only |
| `^26` | 26.x only |

At the time of writing those are the even majors that exist and are supported — 22 and 24 are LTS, 26
is Current. **This list is the maintenance cost of the guarantee**: when the next even major ships,
add a clause. That is a real cost and it is the honest one — the alternative is an open bound that
silently permits the runtime the document says not to use.

Do not "simplify" it back to a single `>=`. That is the change that reintroduces the bug, and it will
look like tidying.

Starting a project:

```bash
pnpm create astro@latest
```

## 2. Why pnpm, and it has nothing to do with disk space

**The mechanism first, because the mitigation only makes sense once it is clear.** A package can
declare `preinstall`, `install` and `postinstall` scripts, and those run **arbitrary code on the
machine performing the install**, with that machine's shell, environment variables, credential files
and network access.

Read that again with the consequence attached: the danger is not the code you `import`. It is the code
that runs *before you import anything*. A compromised version of a package you never call, pulled in
four levels deep as somebody else's transitive dependency, still gets execution on your laptop and in
your CI. That is why "I only installed it, I didn't use it yet" is not a defence, and it is the vector
behind the npm compromises worth worrying about.

`npm` runs those scripts by default. pnpm 11 does not, and adds a second control npm has no equivalent
for. Three defaults are worth naming because they are the whole argument:

| Setting | Default in pnpm 11 | What it does |
|---|---|---|
| `allowBuilds` | a package not listed is **disallowed** | a dependency's build scripts run only if the project has named it |
| `strictDepBuilds` | `true` | the install **exits non-zero** when any dependency has unreviewed build scripts. Fails closed — it does not warn and continue. |
| `minimumReleaseAge` | `1440` (minutes — one day) | delays a version published less than a day ago, transitive ones included — but see the strictness note below |

**`minimumReleaseAge` is the quiet one and probably the most valuable.** These compromises are
typically discovered and the bad version pulled within hours of publication. A one-day cooldown means
an ordinary install never sees the window at all — no detection, no judgement, no alertness required.
Before pnpm 11 this defaulted to `0`, so a project on an older pnpm has the control available but
switched off.

**The inherited default is not fail-closed, and this is the one place to be exact.** pnpm's own
wording: *"The built-in default of `minimumReleaseAge` (1440 minutes) is non-strict for backward
compatibility."* Non-strict means that when no version in the requested range is old enough, *"pnpm
falls back to a version that doesn't meet the `minimumReleaseAge` constraint so installation can still
succeed."* So a project that merely inherits the default has a delay, not a guarantee — and the case
where it gives way is precisely the case that matters, a range whose only satisfying version was
published minutes ago.

What closes it is `minimumReleaseAgeStrict`, whose default is *"`true` if `minimumReleaseAge` is
explicitly configured, `false` otherwise"*. Setting the age yourself therefore switches strictness on
as a side effect — which is real, and is still the wrong thing to rely on. Set both, so the posture is
written down rather than inferred from the fact that a line exists.

To be fair rather than partisan: `npm` accepts `--ignore-scripts`, and a strict team can run it. But a
protection you have to remember every time is not a control — it is a habit with an outage attached to
the day somebody forgets. The difference that matters is which behaviour is the default.

## 3. The hardening file

pnpm settings live in **`pnpm-workspace.yaml`** at the repository root. Not `.npmrc`, which now carries
authentication and little else — a setting written there is silently ignored, which is the worst way
for a security control to fail.

```yaml
minimumReleaseAge: 1440
# Both lines, deliberately. Setting the age above already turns strictness on, but relying on
# that means the project's posture depends on a side effect nobody reading the file can see.
minimumReleaseAgeStrict: true
allowBuilds:
  esbuild: true
```

Two things about that file:

- **Every line in `allowBuilds` is a decision with somebody's name on it.** Before adding one, read
  what that package's install script actually does. A build script is often legitimate — native
  binaries have to be fetched or compiled — but "the install failed until I allowed it" is not a
  review.
- **`dangerouslyAllowAllBuilds` exists and is named that way on purpose.** It turns every dependency's
  scripts back on. There is no project in which it is the right answer to a failing install.

Related settings worth knowing before you need them: `minimumReleaseAgeExclude` exempts named packages
or patterns from the delay, for the case where a fix genuinely cannot wait; `verifyDepsBeforeRun`
decides what `pnpm run` does when the installed tree does not match the lockfile; and `trustPolicy`
set to `no-downgrade` refuses a package whose trust level dropped since an earlier release.

## 4. How a dependency enters the project

The install command is the last step, not the first. Everything before it is the review, and it is
short enough that skipping it is never about time:

1. **Say what it solves and what it replaces.** A dependency that duplicates something already
   present is a second way to do one thing.
2. **Look at what it drags in.** `pnpm why <name>` after the fact, and the dependency count before.
   A package with one direct use and forty transitive dependencies is forty packages of exposure.
3. **Check whether it needs a build script.** If the install fails on `strictDepBuilds`, that is the
   control working: read the script, then decide. Do not reach for section 3's escape hatch.
4. **Give it a real version constraint** — `^7.4`, never `*`. An open constraint resolves against
   whatever the resolving machine happens to allow, which is how a lock file gets produced that
   another machine physically cannot install.
5. **Commit the lockfile in the same commit as the `package.json` change.** They are one fact recorded
   in two files; separated, the repository states two different trees and CI believes the one you
   did not review.

## 5. Tailwind, if the project decides on it

The current path, for Tailwind 4:

```bash
pnpm astro add tailwind
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
document's. What belongs here is narrower: the moment the choice exists is `pnpm astro add`, it is
cheap to make deliberately and expensive to undo once forty components use utilities, and "the
experienced developers wanted it" is a preference to record rather than a requirement to satisfy.

## 6. What none of this protects against

Written down because an unlisted gap gets mistaken for a covered one:

- **A delay is not detection.** `minimumReleaseAge` buys time against a class of attack that is
  usually caught quickly. Nothing promises the window is long enough, and a compromise nobody notices
  for a week walks straight through it.
- **And the delay is only a wall when strictness is on.** Inherited rather than configured, it is
  non-strict: pnpm installs a too-new version rather than failing when nothing older satisfies the
  range. Section 3 sets `minimumReleaseAgeStrict` for that reason. A project that assumed the default
  was enough has been running with the softer behaviour and nothing said so.
- **`allowBuilds` covers install-time execution only.** A malicious package that you import and call
  executes at build time no matter what that file says. Blocking install scripts narrows the vector;
  it does not close it.
- **A lockfile proves what was resolved, not that it was safe.** Integrity hashes confirm the bytes
  have not changed since resolution — including when the bytes were already hostile.
- **The publish time can be missing.** `minimumReleaseAgeIgnoreMissingTime` defaults to `true`, so a
  registry response with no `time` field skips the age check rather than failing. Convenient, and a
  hole.
- **Nothing here reads the code.** No rule in this document has looked at a single line of any
  dependency, and no audit tool in the ecosystem knows about an advisory before it is published.

## 7. Checklist

Before a project is considered set up, and again whenever a dependency is added:

- [ ] Node is v22.12.0 or higher and an even-numbered major
- [ ] `packageManager` is pinned, and `engines.node` is a **union with a closed upper bound on every
      clause** — a bare `>=` admits the odd majors the line above rules out
- [ ] `pnpm-workspace.yaml` exists, with `minimumReleaseAge` set explicitly rather than inherited
- [ ] `minimumReleaseAgeStrict: true` is written down, not left to the side effect of the line above
- [ ] every `allowBuilds` entry was added after reading that package's install script
- [ ] `dangerouslyAllowAllBuilds` appears nowhere
- [ ] no dependency carries an open `*` constraint
- [ ] the lockfile is committed alongside the `package.json` that produced it
- [ ] if a styling toolkit was installed, the decision is recorded rather than assumed
