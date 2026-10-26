# Report — P3 (bootstrap: REVIEW.md template, dead pointers, Upgrade, PR template)

Branch `feat/review-md-p3`, base `3e43672`. Commit: the single `feat(bootstrap): REVIEW.md i szablon PR (P3)` commit on this branch (hash in the handback message; a report cannot embed the hash of the commit that contains it).

## Files touched
NEW `skills/sailes-bootstrap/review-md-template.md`, NEW `skills/sailes-bootstrap/pr-template.md`; edited `skeleton.md`, `SKILL.md` (bootstrap), `agents-md-template.md`, `agentic-first-principles.md`, `adopt-existing-repo.md`, `skills/sailes-implement/SKILL.md`. No generated `<!-- BEGIN -->` block touched (only `BEGIN` hit was prose in skeleton.md).

## Done-when (all run in the worktree)
| Command | Output |
|---|---|
| `ls skills/sailes-bootstrap/review-md-template.md skills/sailes-bootstrap/pr-template.md` | both listed, exit 0 |
| `grep -c -E 'What Important means here\|Cap the nits\|Do not report\|Always check' …/review-md-template.md` | 4 |
| `grep -c 'REVIEW.md' …/skeleton.md` / `grep -c 'review-md-template' …/SKILL.md` | 1 / 2 |
| `git grep -c '\.ai/skills/code-review' -- skills` | no output (exit 1) |
| `grep -c 'code-review checklist' skills/sailes-implement/SKILL.md` | 0 |
| `grep -c 'REVIEW.md' …/adopt-existing-repo.md` | 5 |
| `grep -c -E 'Testing\|Risk\|How to revert' …/pr-template.md` | 3 |
| `node skills/sailes-bootstrap/repo-done-checklist.test.js` | "all tests passed", exit 0 |
| `node tools/sync-blocks.js --check` | "all blocks in sync", exit 0 |
| `npm test` | "all passing", exit 0 |
| `git diff --check` | clean, exit 0 |

## Notes / deviations
- Repo-wide `git grep -c 'code-review'` still hits `db-compendium.md` (unrelated, per spec).
- Upgrade mode: REVIEW.md + PR-template proposal added as named exception (d) after (c); adoption table row 14; presence loop added to the audit script.
- "mock/probe pair" fill-in worded as "every mocked external boundary has a paired probe against the real one" (framework term: Contract-/Deployed-probe).
- Header prose of the template deliberately avoids the four section-title phrases so `grep -c` counts only the headings (4).

## Full final text of review-md-template.md fenced block
````markdown
# Review instructions

## What Important means here

Reserve Important for findings that would break behavior the spec promises, leak data, or block a
rollback: incorrect logic, a removed guard or permission check, a caller broken by a changed
signature or return shape, unscoped database queries, PII in logs or error messages, migrations
that are not backward compatible, and a change to a frozen contract without a spec. Style, naming
and refactoring suggestions are Nit at most. A defect that was already in the code before this diff
is Pre-existing, never Important.

## Cap the nits

Report at most five Nits per review.

## Do not report

- Anything the toolchain already enforces: lint, formatting, type errors, no-`any`, design tokens,
  import direction
- Generated files, lockfiles, and `graphify-out/`
- Test-only code that intentionally violates production rules

## Always check

- Database queries are scoped to the caller's tenant (delete if the project is single-tenant)
- Log lines and error messages do not include email addresses, user IDs, or request bodies
- Every behavior change has a test that fails before it and passes after
- <add one bullet per active module: see the fill-in table in the header>

## Evidence

A claim about behavior needs a `file:line` citation in the source, not an inference from a name.
Quote the rule you are applying when the finding rests on this file or on `AGENTS.md`.

## Summary

Start with the number of findings by severity. Say plainly "nothing to fix" when there is nothing.
````
