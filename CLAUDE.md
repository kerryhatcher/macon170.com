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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
