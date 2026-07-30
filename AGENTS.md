# macon170.com agent guidance

This is the public Astro site and Cloudflare Worker for Pack 170. Follow the
workspace guidance in `../AGENTS.md` as well as this project's `README.md`,
`PRODUCT.md`, and `CONTRIBUTING.md`.

## Worktrees

Place Git worktrees in the workspace-level `../worktrees/` directory, not in
this project directory. For example, from the workspace root:

```bash
git -C macon170.com worktree add ../worktrees/<branch-name> <branch-name>
```

## Commits

Commit focused, validated changes often. Use Conventional Commit messages in
the form `type(optional-scope): description`, such as
`docs(agents): add worktree guidance`. Use `feat` for new features and `fix`
for bug fixes; indicate breaking changes with `!` before the colon or an
uppercase `BREAKING CHANGE:` footer.

After installing dependencies in a fresh checkout, run `pre-commit install`.
Confirm it has installed the configured `pre-commit`, `commit-msg`, and
`pre-push` hooks before making commits or pushes.
