# Run log — 2026-08-02 · delegation spec, 1.27.0 → 1.27.2

Goal: implement `.ai/specs/2026-08-01-delegation-precision-and-agent-control.md`, then repair
everything using it exposed. Released 1.27.0, 1.27.1, 1.27.2 on `release/1.27.1`; `main` was at
1.27.0 for most of the day.

## Workers — status files folded in at acceptance

The status-file mechanism shipped mid-day, so early workers predate it. Every row below is
reconciled against the branch, not against the worker's own account.

| Worker | Task | Outcome | Commit | Base | Discrepancies |
|---|---|---|---|---|---|
| F2 `be-dev` | brief-closure check + test | done | `e0d6ac3` | stale `5a1d2f8` → ff | none |
| F3 `be-dev` | ownership-check + test | done | `1dc0cf2` | stale `5a1d2f8` → ff | none |
| F4 `be-dev` | worker-status format + tool + test | done | `1fe731f` | stale `5a1d2f8` → ff | none |
| F5 `be-dev` | status-file doctrine, both twins | done | `09ebbf9` | stale `main` → reset | none |
| F7 sub-team | re-cut two colliding eval fixtures | done | `8fa8f62` | stale `5a1d2f8` → ff | disclosed contamination: grep printed a verdict block |
| D1 `be-dev` | `.claude/status/` move + 2 format fixes | done | `21143ac` | stale `d6b64e2` → ff | none |
| D2 `be-dev` | `.claude/status/` doctrine | done | `0d856c3` | stale `d6b64e2` → ff | **declaration carried 6 of 16 files** — see below |
| N1 `be-dev` | fallback doctrine | done | `10a1f3f` | stale `main` → reset | none |
| N2 `be-dev` | `--sweep` walks worktrees | done | `d41a57f` | stale `d6b64e2` → ff | merge conflict; resolution dropped D1's parser — see below |
| Z1 `be-dev` | sha-pinned eval freshness | done | `7121cb4` | stale `d6b64e2` → ff | status file rejected by its own validator (outcome/commit shape) |
| Z3 `be-dev` | lessons.md, **fallback path exercise** | done | `c1aa190` | `d6b64e2` | claimed in worktree by design; nearly wrote a block list |
| Z2 | docs-delta fixture + arm | **incomplete → resumed** | — | — | process died before dispatch; fixture survived intact |
| docs-delta arm | the GREEN run | done | — | — | ran `docs-author` without worktree, reported not buried |

Eval arms (not workers, no status files): 13 for the 1.26.0 scenarios, 9 for the status-file
scenarios, 7 for the re-run. All recorded in the scenarios' own `Last run:` lines.

## What the run cost that the diffs do not show

**Every single worker got a worktree cut from a stale base** — `5a1d2f8` or `d6b64e2`, never the
branch tip. Eleven for eleven. All of them checked `merge-base`, fast-forwarded and reported
**before** working, because the brief clause added in 1.26.0 told them to. The harness defect is
unchanged and systematic; the cost is now zero because the check is in every brief.

**Three defects came from agents doing something else.** A control arm found the status file would
be invisible from the main tree. A diagnosis of a retired eval found four recovery commits about to
be pruned by `gc`. A worker noticed the lead had been committing to `main` for eighteen commits.

**Two of the lead's own mistakes, both recorded in `.ai/lessons.md`:** `git checkout` destroyed an
uncommitted fix while reverting a mutation, and a merge-conflict resolution silently dropped D1's
block-list parser — verified with a symbol count that checked two other things and declared
consistency, which is lesson #2 of that same morning, repeated within hours. It surfaced from
`--sweep` on two live workers' files, not from a test.

**D2's declaration carried 6 of its 16 changed files** and `cherry-pick` reported success. That
produced the branch-not-commit rule, and R3 applied it unprompted three hours later in an eval that
does not grade it.

## Status files: all accounted for and removed

`be-dev-R1`, `be-dev-Z1` (main tree) and `be-dev-Z3` (worktree fallback) were the only three ever
written. All three are folded into the table above and deleted, per Design §3b — deletion only
together with this entry.
