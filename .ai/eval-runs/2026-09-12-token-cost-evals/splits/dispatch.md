# Dispatch — spec `2026-09-10-env-cleanup`, 2026-09-12

## What goes out now: one brief, Faza 1 only

The owner's "wszystkie cztery fazy" is still today's plan, but it is not one dispatch:

- **Four phases, four tasks.** Each phase has its own `Done-when`, and a task is one phase with one
  `Done-when`. Bundling "four small phases" into one brief is exactly the 431-turn / 135M-token
  run measured on 2026-09-12.
- **None of them can run in parallel.** I read that off file ownership, not phase order. All four
  phases write `apps/api/src/config/env.ts`, and F2, F3 and F4 all write `env.spec.ts`. The
  single-file escape ("take the file away from both and integrate it yourself") doesn't apply:
  `env.ts` is the whole of every phase, so taking it away leaves nothing to delegate. F2 must also
  land before F3, because F3's test depends on the variable F2 renames.
  ```yaml
  ownership:
    F1:
      - apps/api/src/config/env.ts
      - apps/api/.env.example
    F2:
      - apps/api/src/config/env.ts
      - apps/api/.env.example
      - apps/api/src/config/env.spec.ts
    F3:
      - apps/api/src/config/env.ts
      - apps/api/src/config/env.spec.ts
    F4:
      - apps/api/src/config/env.ts
      - apps/api/src/config/env.spec.ts
  ```
- **A closed phase ends my turn.** Once F1's gates close (be-dev → tester, with the human freezing
  the case list → checker → qa), I write `.ai/STATE.md` with F2 and its brief under Last session,
  then ask the owner for `/clear` and "kontynuuj". That `/clear` request goes out together with the
  tester case-list freeze, so it doesn't add a second stop. F2 is then briefed from a fresh
  context. At ~300 turns, briefing F2–F4 from this context is the expensive mistake the handoff
  rule exists to prevent. So F2, F3 and F4 are **not** written or sent from here.
- **Who writes F1.** It is a few lines in two files, so it sits near the delegation threshold. I
  delegate anyway, and the run log gets the reason: every tool call I make re-bills a ~300-turn
  context, while a fresh Sonnet worker does the same edit and test run for a fraction of that.
  I keep integration and the gates.
- **Gates for F1.** `checker` runs, because removing schema keys can change startup validation.
  `qa` runs too, not `n/a`: whether the API boots with a given env is observable behavior.

Lead pre-flight, done before this dispatch and not part of the brief:
- Grep `.ai/lessons.md` and `.ai/archive/` for `env|config|SMTP|zod`.
- Branch `feat/env-cleanup` off the default branch.
- Set the spec to `Status: in-progress`.
- Open run log `.ai/runs/2026-09-12-env-cleanup.md`, containing the ownership matrix above.
- Commit all of the above.
- Run `git rev-parse --show-toplevel` and confirm it is this repo before the `isolation: worktree` spawn.

---

## Brief 1 — Faza 1: remove the dead `LEGACY_SMTP_*` variables

**Receiver:** `sailes-app-builder:be-dev`, `isolation: worktree`, scoped subagent. `model` is
omitted, so the pin `claude-sonnet-5` stays; the run log records it as the default. **Runs alone:
nothing in parallel with it. The next brief, F2, is written only after F1's gates close and the
owner has run `/clear`.**

```markdown
You are `be-dev` on team `env-cleanup`, under `team-lead`.
You are in your own worktree, on the branch the harness created for you. Do not switch branches.
Never commit to a shared branch and never push. **Commit your finished work HERE.** That commit
is your declaration that the task is done, and the lead integrates your whole branch. No commit
means not finished. Checkpoint commits start with `WIP:`. Your final commit has no `WIP:` prefix,
and its message references spec `2026-09-10-env-cleanup` Faza 1.

Task:        Spec `.ai/specs/2026-09-10-env-cleanup.md`, **Faza 1 only**. Phases 2–4 are
             other tasks, and you do not start them, even where the change looks adjacent.

Base:        Read it with `git log --oneline -3`; do not recall it. Expected: `7c41e2a`, or the
             lead's pre-flight commit on top of it. Proof: the file
             `.ai/runs/2026-09-12-env-cleanup.md` exists, and the spec's status line reads
             `Status: in-progress`. Both exist only after pre-flight. If either is missing, your
             worktree is stale: fast-forward BEFORE starting and report that you did. If the base
             was correct, report that too. Silence reads as "did not check".

Goal:        `LEGACY_SMTP_HOST`, `LEGACY_SMTP_PORT` and `LEGACY_SMTP_USER` no longer exist in
             the API's env schema or in its example env file. Nothing else about config changes.

Files:       - `apps/api/src/config/env.ts`: remove the three keys from the zod schema.
               Forced by Done-when `grep -rn LEGACY_SMTP apps/api` → empty.
             - `apps/api/.env.example`: remove the three lines, plus any comment that exists
               only for them. Forced by the same grep (grep -r includes dotfiles).
             No other path is in scope. If the grep hits a file not on this list, do not edit it.
             Stop and report it: the phase's premise was "no hits outside these two files".

Before you edit — two checks, report both results either way:
             1. `grep -rn LEGACY_SMTP .` from the repo root, excluding `node_modules` and `.git`.
                The spec only checked `apps/`. A hit in deploy/CI/infra config (docker-compose,
                `.github/`, Railway or other hosting config, scripts) means a deployed environment
                still sets these variables. Report the hit; do not edit it.
             2. Read how the schema treats unknown keys: `.strict()`, `.passthrough()`, or the
                zod default, which strips them. If it is **strict**, removing the keys makes
                any environment that still sets `LEGACY_SMTP_*` fail validation at startup. That
                is a deployment decision, not a cleanup. STOP, write it in your report, and
                wait for the lead. Do not change the schema's strictness to work around it.

Contract:    The type inferred from the schema (the exported env/config type) loses three keys.
             There is no other change to its shape. Nothing in `apps/api` may reference the removed
             keys; the typecheck and the grep are the proof. `DB_URL`, `SENTRY_DSN`, `PORT`
             and every other key keep their current validation exactly.

Constraints: Minimal diff: deletions only, with no reformatting or reordering of the surrounding
             schema. No new dependencies. No destructive git commands, and never
             `git checkout <branch> -- <path>`.

Forbidden:   - `apps/api/src/config/env.spec.ts`. Faza 1 has no test change; F2–F4 own that file.
             - Any change to `DB_URL`/`DATABASE_URL`, `SENTRY_DSN` or `PORT` handling (F2–F4).
             - `apps/web/**` (spec non-goal), secret managers (spec non-goal).
             - Any real env file: `.env`, `.env.local`, `.env.test`, `.env.production`, and so on.
               Only `.env.example` is in scope.
             - Deploy/CI/infra config, even if check 1 finds hits there.
             - Lockfiles, `package.json`.
             - Pushing, or committing to any branch but your own.
             If you find you must cross one of these, report it; do not do it.

Reference:   The existing structure of `env.ts` itself. This is a deletion, not new code.

Blocked:     Stuck for more than one round on something that is NOT a key decision → make a
             substitute decision, mark it in the code with a comment, and report it as a
             deviation. A strict schema (check 2), a hit outside the two files, or anything that
             changes what a deployed environment must set is NOT substitutable. Stop and
             escalate.

Status:      Your FIRST action: claim `.claude/status/<worker-id>.md` in the main tree (via Bash).
             `worker-id` is the id the harness assigned you, never one you pick. The claim block
             holds `worker`, `task: "env-cleanup F1 — remove LEGACY_SMTP_*"`, `base` sha,
             `claimed` (the two paths above) and `opened`. Your LAST action: APPEND `closed`,
             `outcome` (done | blocked | policy-refusal), `commit` and `touched`. Never rewrite
             the claim block. If the main-tree write fails, write
             `<worktreePath>/.claude/status/<worker-id>.md` instead and say so at the top of
             your report.

Checkpoint:  Progress goes to disk as you go: the report file below, plus `WIP:` commits. Your
             in-memory state does not survive your process.

Verification: two levels. Do not merge them.
             **Inner loop**, as often as you like: `yarn test apps/api/src/config` (~4 s).
             Nothing wider.
             **Once, before the declaration commit**, paste each command and its output:
               - `grep -rn LEGACY_SMTP apps/api` → must be empty  (Done-when)
               - `yarn test apps/api/src/config` → green          (Done-when)
               - the api typecheck script from `apps/api/package.json`, if one exists. Name
                 the exact command. It catches any consumer of the removed keys.
               - full `yarn test` (~6 min), ONE run. If it is red, record whether the failures
                 are yours or were already failing on the base.
             This phase has no e2e requirement. Behavior proof on the running app is `qa`'s job,
             not yours.
             If the worktree has no `node_modules`, run one `yarn install` first and report it.
             Do not re-run it.

Report:      `<worktreePath>/.ai/reports/2026-09-12-env-cleanup-F1-be-dev.md`. **Do NOT commit
             this file.** Stage only the two source paths by name, never `git add -A`, because the
             reviewer receives your diff and must not receive your narrative.
             Create the report with your FIRST change and append as you go. It must hold:
             the base-check result; pre-edit checks 1 and 2 with their output; a per-file diff
             summary; each verification command with its output; blockers and deviations. If
             a check went red on a real defect, add a line `Promotion candidate:` naming it.
             This report IS the deliverable, not a summary for a human or a status line. If you
             did not finish, say so plainly and list what you did and did not establish. No
             report file means the task is not done. Never return empty.

Delivery:    You are a scoped subagent: your final message returns to the lead automatically,
             so just end with it. Make that final message the report path, the declaration
             commit sha and `outcome`. The file is the deliverable; the message only points to it.
```
