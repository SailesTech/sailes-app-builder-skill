import sys
# usage: build-checker.py <worktree> <tip-sha> <label> <out>
wt, tip, label, out = sys.argv[1:5]
d = sys.argv[0].rsplit('/',1)[0]
b = open(d + '/p4-checker-brief.md').read()
def rep(old, new):
    global b
    if b.count(old) != 1:
        raise SystemExit(f'pattern count {b.count(old)} != 1: {old[:70]!r}')
    b = b.replace(old, new)
rep('/home/charlie/Work/Internal/sailes-app-builder-skill/.claude/worktrees/agent-aca1acd19b701a36d', wt)
rep('git diff 738be36..77df5c6', f'git diff 738be36..{tip}')
rep("that is the maker's narrative and is excluded from your inputs.",
    "that is the maker's narrative and is excluded from your inputs. For the same reason do not read commit messages (`git log`, `git show` without `--format=` restricted to the diff).")
rep('/tmp/claude-1000/-home-charlie-Work-Internal-sailes-app-builder-skill/ff6d0c42-10f1-4b02-abc4-ee62e73461a3/scratchpad/p4-checker-verdict.md',
    f'{d}/verdict-checker-{label}.md')
rep('- The spec: its P4 section', "- The spec as it stood at `738be36` — read it only via `git show 738be36:.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`; the copy in the shared checkout is later and is NOT your input: its P4 section")
open(out, 'w').write(b); print('ok', out)
