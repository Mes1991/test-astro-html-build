# Opt-in workflow recipes

These three workflows are **not active**. They do not live in `.github/workflows/`,
so cloning or generating a project from this template does not install them.
They are kept here as examples for an adopter who explicitly wants the
capability they provide.

This split exists because the default template ships one read-only validation
workflow (`.github/workflows/ci.yml`) and nothing that writes to the
repository, deploys, or calls an external API on an adopter's behalf without
being asked. See `docs/product/implementation-roadmap.md` phase B and
`docs/sessions/remaining-work-master-plan.md` R-40 for the decision record.

To adopt one of these, copy it into `.github/workflows/` under its real name
(drop the `.example` suffix) and review it for your repository before it goes
live — none of them were re-verified after this move.

## `release-please.yml.example` — automated release PRs and auto-merge

Runs `googleapis/release-please-action` on every push to `main`, then
auto-merges the Release PR it opens using `contents: write` /
`pull-requests: write`.

**Known defect (R-34) — fix before adopting.** The auto-merge step selects the
PR to merge by branch-name prefix alone
(`startswith("release-please--")`), with no check on the PR's author or bot
association. Any open PR whose head branch happens to match that prefix gets
squash-merged to `main` unreviewed on the next push. Add an author/bot check
(e.g. `github.actor == 'github-actions[bot]'` or the app's login) before the
`gh pr merge` call.

**Config change required.** The withdrawn `release-please-config.json` used
`"release-type": "simple"`, which tracked the version only in
`.release-please-manifest.json` and left `package.json`'s own `version` field
to drift independently (that drift was R-13). If you re-adopt this workflow,
use `"release-type": "node"` instead — it reads and writes `package.json`
directly, so there is exactly one version source. Recreate
`release-please-config.json` and `.release-please-manifest.json` (seeded from
the current `package.json` version) alongside the workflow; both were deleted
from the active product.

## `cleanup-pages-previews.yml.example` — Cloudflare Pages preview cleanup

Deletes Cloudflare Pages preview deployments for a closed PR's branch, via
the Cloudflare API. Requires `CLOUDFLARE_PAGES_CLEANUP_TOKEN` (secret) and
`CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_PAGES_PROJECT` (vars). Only meaningful
if you deploy through Cloudflare Pages; irrelevant, and undeployable, on any
other host.

## `pr-title-lint.yml.example` — Conventional Commit PR title lint

Lints PR titles against the Conventional Commits types and posts a sticky
comment when a title doesn't conform. Uses `pull-requests: write` to post and
clean up that comment. Only useful if you plan to squash-merge and want the
PR title enforced as the commit message convention (release-please, if also
adopted, parses exactly that).
