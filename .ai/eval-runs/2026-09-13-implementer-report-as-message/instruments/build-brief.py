import sys
# usage: build-brief.py <role-file> <report-clause-file|-> <label> <out>
role, clause, label, out = sys.argv[1:5]
b = open(sys.argv[0].rsplit('/',1)[0] + '/p4-be-dev-brief.md').read()
def rep(old, new):
    global b
    if b.count(old) != 1:
        raise SystemExit(f'pattern count {b.count(old)} != 1: {old[:60]!r}')
    b = b.replace(old, new)
rep("Run `git merge --ff-only feat/1.34.0-quality-gates` before any edit; HEAD must then be `738be36`.",
    "Run `git merge --ff-only 738be36` before any edit; HEAD must then be `738be36`.")
rep("Then claim `.claude/status/be-dev-P4-quality-gates.md` before the first edit (a file named `be-dev-P4-<hash>.md` from another spec already exists — do not touch it).",
    f"Then claim `.claude/status/be-dev-P5ab-{label}.md` before the first edit (other `be-dev-*` files there belong to other runs — do not touch them).")
if clause != '-':
    rep('Touch only the files above plus your report and status file.', 'Touch only the files above plus your status file.')
    start = b.index('## Report clause (mandatory)'); end = b.index('## Goal')
    b = b[:start] + open(clause).read().rstrip('\n') + '\n\n' + b[end:]
pre = ("You are running as the `be-dev` role. Its definition, verbatim, is between the markers below; follow it as your role definition.\n\n"
       "<role-definition>\n" + open(role).read().rstrip('\n') + "\n</role-definition>\n\n"
       "Work only inside your own worktree. Outside it you write only your status file, and you do not read other worktrees, other branches, or the shared checkout.\n\n---\n\n")
open(out, 'w').write(pre + b)
print('ok', out, len(pre + b))
