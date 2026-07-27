## NEVER switch branches in this directory

**Multiple agents and developers work in this working directory at the same time.** Any branch
switch here changes files out from under them and destroys uncommitted work. This is a hard rule,
not a preference.

**Never run any of these in this directory:**

- `git checkout <branch>` / `git checkout -b <branch>`
- `git switch <branch>` / `git switch -c <branch>`
- `git checkout <ref> -- <path>` (silently overwrites another session's file)
- `git reset --hard`, `git stash`, `git clean -fd`, `git rebase`, `git merge` of a divergent branch

**If work needs its own branch, use a separate worktree instead.** A worktree is a second checkout
of the same repo in its own directory, so this directory never moves:

```bash
git worktree add ../macon170-<short-topic> -b <branch-name>
cd ../macon170-<short-topic>        # do all the work here
# when finished and merged:
git worktree remove ../macon170-<short-topic>
```

Claude Code's `EnterWorktree` tool does this for you — prefer it when available.

**Committing on the current branch is fine** — commit early and often, and always stage explicit
paths (`git add <path>`, never `git add -A` / `git add .`) so you never commit another session's
in-progress files. If a task seems to require a branch switch here, stop and ask the human instead.

This is enforced, not just documented: the `PreToolUse` hook `.claude/hooks/no-branch-switch.py`
(wired up in `.claude/settings.json`) denies these commands before they run. Verify it with
`python3 .claude/hooks/no-branch-switch.py --selftest`. Do not weaken or bypass it.

## Commit often, in Conventional Commits format

**Commit often.** Do not batch a session's work into one large commit at the end. Commit each
coherent unit as soon as it works — a page added, a bug fixed, a doc updated. Small commits are
how concurrent work in this shared directory stays reviewable and recoverable, and a long-running
session that never commits is one crash away from losing everything. Every commit should build and
pass tests on its own (`bun run build && bun run test`).

Stage explicit paths (`git add <path>`), never `git add -A` or `git add .` — other sessions have
in-progress files in this directory and they must not ride along in your commit. Separate unrelated
changes into separate commits rather than one mixed one.

**Every commit message follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):**

```
<type>(<optional scope>): <subject>

<optional body — what and why, not how>

<optional footer>
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
- **Subject:** imperative mood ("add", not "added"/"adds"), lowercase start, **no trailing period**.
- **Scope** is optional and names the area touched — `feat(pages):`, `fix(worker):`, `docs(claude):`.
- **Breaking changes:** a `!` before the colon (`feat(api)!:`) and/or a `BREAKING CHANGE:` footer.
- Explain _why_ in the body when the reason is not obvious from the diff. Reference the source you
  verified a fact against when the commit publishes a fact (see the placeholder policy in
  `PRODUCT.md`).

Examples from this repo's history:

```
feat(pages): add den pages, what-is-cub-scouts, and youth protection detail
chore(tooling): consolidate on bun, refresh docs and CI
docs(claude): forbid branch switching in the shared working directory
```

**Writing multi-line messages:** pass a file with `git commit -F <path>`. Do not build the message
with a `$(cat <<'EOF' ...)` command substitution — the commit-message validator sees the literal
shell text as the subject and rejects it.

Conventional Commits is currently enforced by a machine-local Claude Code hook
(`~/.claude/hooks/validate-commit.py`), which means it is **not** enforced for other developers or
for a plain `git commit` outside the agent harness. Follow it regardless; it is the project's
standard, not just this workstation's.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
