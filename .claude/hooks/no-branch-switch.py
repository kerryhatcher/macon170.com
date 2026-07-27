#!/usr/bin/env python3
"""Block git commands that rewrite the working tree in this shared directory.

Multiple agents and developers work in this working directory at the same time, so a branch
switch or a hard reset here changes files out from under an in-flight session and destroys
uncommitted work. See the "NEVER switch branches in this directory" rule in CLAUDE.md.

Used as a Claude Code PreToolUse hook on Bash. Reads the hook payload on stdin and emits a
`permissionDecision: deny` for a banned command; stays silent for everything else.

Self-check: python3 .claude/hooks/no-branch-switch.py --selftest
"""

import json
import re
import shlex
import sys

# ponytail: splitting on shell operators, not a real shell parser. A command crafted to hide
# `git checkout` from this (inside a quoted string, an eval, a script file) gets through — this
# stops the accident, not a determined caller. CLAUDE.md carries the actual rule.
SEGMENT_SPLIT = re.compile(r'&&|\|\||[;|\n]')
# Global git options that consume the following token, so it is not mistaken for the subcommand.
GLOBAL_OPTS_WITH_VALUE = {'-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path'}


def git_subcommand(segment: str) -> tuple[str, list[str]] | None:
    """Split a shell segment into (git subcommand, its args), or None if it is not a git call."""
    try:
        tokens = shlex.split(segment)
    except ValueError:  # unbalanced quotes
        return None
    if tokens and tokens[0] == 'sudo':
        tokens = tokens[1:]
    if not tokens or tokens[0] != 'git':
        return None
    rest = tokens[1:]
    while rest and rest[0].startswith('-'):
        opt = rest.pop(0)
        if opt in GLOBAL_OPTS_WITH_VALUE and rest:
            rest.pop(0)
    if not rest:
        return None
    return rest[0], rest[1:]

WORKTREE_HINT = (
    'If this work needs its own branch, create a worktree instead — it never moves this directory:\n'
    '  git worktree add ../macon170-<topic> -b <branch>\n'
    '  cd ../macon170-<topic>   # do the work there\n'
    "Claude Code's EnterWorktree tool does this for you. If you believe a switch here is genuinely "
    'required, stop and ask the human to run it themselves.'
)


def check(command: str) -> str | None:
    """Return a denial reason for a banned command, or None if it is allowed."""
    for segment in SEGMENT_SPLIT.split(command):
        call = git_subcommand(segment.strip())
        if not call:
            continue
        sub, args = call

        if sub in ('checkout', 'switch'):
            return (
                f'`git {sub}` is forbidden in this directory: it changes tracked files out from under '
                f'other agents and developers working here concurrently, losing their uncommitted work.'
            )
        if sub == 'restore':
            return '`git restore` is forbidden here: it overwrites working-tree files another session may be editing.'
        if sub == 'reset' and any(a in ('--hard', '--merge', '--keep') for a in args):
            return '`git reset --hard` (and --merge/--keep) is forbidden here: it discards the shared working tree.'
        if sub == 'stash' and (not args or args[0] not in ('list', 'show')):
            return '`git stash` is forbidden here: it removes other sessions\' uncommitted changes from the working tree.'
        if sub == 'clean' and any(a.startswith('--force') or re.match(r'^-[a-eg-z]*f', a) for a in args):
            return '`git clean -f` is forbidden here: it deletes untracked files other sessions may be creating.'
    return None


def selftest() -> None:
    blocked = [
        'git checkout main',
        'git checkout -b feature/x',
        'git switch -c topic',
        'git checkout HEAD~1 -- src/data/pack.ts',
        'git checkout .',
        'git -C . checkout main',
        'sudo git switch main',
        'git reset --hard origin/main',
        'git stash',
        'git stash pop',
        'git clean -fd',
        'git clean --force',
        'bun run build && git checkout main',
        'git add -A; git switch other',
        'git restore src/pages/index.astro',
    ]
    allowed = [
        'git status',
        'git commit -m "x"',
        'git worktree add ../macon170-topic -b topic',
        'git worktree remove ../macon170-topic',
        'git branch new-thing',
        'git branch --show-current',
        'git merge --ff-only topic',
        'git reset --soft HEAD~1',
        'git reset HEAD~1',
        'git stash list',
        'git clean -n',
        'git log --oneline -5',
        'git diff --cached',
        'echo "git checkout main is banned"',  # ponytail: known gap, quoted text is not parsed
        'bun run test',
    ]
    for cmd in blocked:
        assert check(cmd) is not None, f'should have blocked: {cmd}'
    for cmd in allowed:
        assert check(cmd) is None, f'should have allowed: {cmd}'
    print(f'ok: {len(blocked)} blocked, {len(allowed)} allowed')


def main() -> None:
    if '--selftest' in sys.argv:
        selftest()
        return
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return  # malformed payload: stay out of the way rather than blocking real work
    command = (payload.get('tool_input') or payload).get('command') or ''
    reason = check(command)
    if reason:
        print(
            json.dumps(
                {
                    'hookSpecificOutput': {
                        'hookEventName': 'PreToolUse',
                        'permissionDecision': 'deny',
                        'permissionDecisionReason': f'{reason}\n\n{WORKTREE_HINT}',
                    }
                }
            )
        )


if __name__ == '__main__':
    main()
