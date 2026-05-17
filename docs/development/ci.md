# CI

Every PR and every push to `main` runs the CI workflow. There is no separate CD pipeline yet — that lands in PR-7 (see [`../deployment/s3-cloudfront.md`](../deployment/s3-cloudfront.md)).

## Workflow

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint + types + tests + build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
```

Same combo as `make check` plus a `make build` step. `concurrency` cancels superseded runs on the same ref so pushing twice in quick succession doesn't pile up.

## Node version

CI runs on Node 20. Local developers can use anything from 20+ — we pinned TypeScript at `~5.8.0` specifically because TS 5.6 crashes on Node 23+, and 5.6 was the original plan. See [`tooling.md`](tooling.md).

## Branch protection on `main`

Configured via GitHub Rulesets (`Settings → Rules → Rulesets`):

- Require a PR before merging.
- Require the `Lint + types + tests + build` status check to pass.
- Require linear history (squash-merge only).
- Disallow force pushes.
- Disallow deletions.

The repo is public so these protections are free. On a private repo with the GitHub Free plan, branch protection isn't available, which is why we made the repo public during PR-1.

## What fails CI

| Failure       | Where it happens                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| ESLint error  | `npm run lint`. Warnings don't fail CI but get noisy fast — fix them.                                      |
| Type error    | `npx tsc --noEmit`. The full `tsc -b` runs locally and in `npm run build`; the CI step is `--noEmit` only. |
| Test failure  | `npm test`. Watch the output; the failing assertion and stack trace land in the run log.                   |
| Build failure | `npm run build`. Usually a missing import or a type-only file being executed at runtime.                   |

## What's not in CI yet

- Coverage threshold.
- Bundle-size budget.
- `make gen-api-check` (the openapi-schema staleness guard). It exists as a target; we just haven't wired it as a CI step. If you're about to ship a backend API change, run it locally.
- Visual regression / e2e. Out of scope for this phase.

These are intentional omissions, not oversights — we'll add them when there's a concrete reason to.

## Adding a step

Edit `.github/workflows/ci.yml` and append a new `- run:` line. Prefer `npm run xxx` or `make xxx` over inline scripts so the same thing works locally.
