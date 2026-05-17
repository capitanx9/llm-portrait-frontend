# Workflow

How a change moves from idea to `main`.

## Branching

- Long-lived branches: `main` only.
- Everything else is a topic branch off `main`.
- Naming: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`, `refactor/<short-name>`. Keep it short — the branch name should be readable in a PR list, not a thesis.
- One concern per branch. If you find yourself touching three unrelated things, three branches.

## Day-to-day loop

```bash
git checkout main
git pull origin main

git checkout -b feat/my-thing

# edit, edit, edit
make check        # lint + typecheck + tests; the pre-push gate

git add <file>... # never `git add -A` without looking — easy to drag in secrets
git commit -m "..."   # husky runs lint-staged on staged files automatically
git push -u origin feat/my-thing
gh pr create
```

`make check` is what CI runs (plus `make build`). If `make check` is green locally, CI almost always will be too.

## Commit messages

We follow lightweight Conventional Commits:

```
feat: short summary in present tense

Longer body if useful. Wrapped at ~72 chars. Explain the *why*; the
*what* is in the diff. Reference issues by number where applicable.
```

Common prefixes:

- `feat:` — new user-facing capability.
- `fix:` — bug fix.
- `chore:` — infra, tooling, dependencies, docs.
- `refactor:` — code change with no behaviour change.
- `test:` — adding/changing tests only.
- `docs:` — documentation only.

**Do not** put AI-attribution footers on commits (`Co-Authored-By: Claude…`, `Generated with Claude Code`). The user does the merge, the user authors the work.

## Pre-commit hook

`lint-staged` runs on staged files via `.husky/pre-commit`:

- `*.{ts,tsx,js,jsx}` → `prettier --write` + `eslint --fix`
- `*.{json,md,css,html,yml,yaml}` → `prettier --write`

It's sub-second on a typical commit. If the hook ever feels slow, that's a regression — fix it rather than skipping.

When you need to **intentionally** commit unformatted code (e.g. as a checkpoint so the next commit shows only the formatter's diff), use `git commit --no-verify`. This is the exception, not the rule.

## Pull requests

- **Title**: one line, present tense, same prefix as the commit (`feat:`, `chore:`, etc.).
- **Description**: summary, list of changes, test plan. Look at recent merged PRs for the shape.
- **Size**: smaller is better. If it's > ~500 lines net, ask yourself whether it can be split. Reviewers (you) will be quicker and more honest with a 200-line PR.
- **Tests**: if the change is observable, it has a test. Reducer transitions, RTK Query endpoints, page-level rendering — all have first-class testing patterns; see [`testing.md`](testing.md).

## Merge style

- **Squash merge only.** The rulesets enforce it.
- The squash commit message defaults to the PR title + the PR description as body. Edit at merge time if you want a tighter message.
- After merge, delete the branch (GitHub offers the button; you can also `git push origin --delete <branch>` locally).

## Keeping `main` flowing

After your PR merges:

```bash
git checkout main
git pull origin main
git branch -d feat/my-thing   # delete the local branch
```

If you have a follow-up PR that depended on the merged one, rebase onto the new `main` before pushing the follow-up. We do not maintain a stacked-PR workflow.

## Repo permissions

- Secrets (GitHub Actions, AWS, etc.) are added by the repo owner via the UI. We don't run `gh secret set` from scripts.
- Branch protection is on `main` only; topic branches are unprotected.

## Working with the backend

If a frontend change requires a backend change:

1. Open the backend PR first, get it reviewed and merged.
2. Wait for the backend repo to publish a refreshed `schemas/openapi.yaml`.
3. On the frontend, `make gen-api`, commit the regenerated `src/api/schema.ts`, then write the consumer code.
4. Open the frontend PR.

This order keeps the type generator's source of truth ahead of the consumer code, so you never write against a contract that doesn't exist yet.
