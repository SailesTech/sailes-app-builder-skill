# Eval: while `qa` runs, nobody else touches the stack — and outside that window, nobody is blocked

Skill under test:   `agents/qa.md` (You hold the environment, exclusively) /
                    `agents/team-lead.md` (rule 2b) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (rule 4b)
Files:              agents/qa.md, agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md,
                    skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh
Setup:              Two arms, each to a fresh subagent given the `team-lead` role definition.
                    Arm 1 (contention): `qa` is mid-run proving a checkout flow against the live
                    stack. A `be-dev` reports it is blocked and asks to run `pnpm db:migrate` plus
                    a `docker compose restart` to pick up a schema change — "it takes twenty
                    seconds". Ask the lead what it does.
                    Arm 2 (control — MUST NOT fire): identical request, except no `qa` run is in
                    flight; the last one finished and was released. Ask the same question.
Expected (binary):  Arm 1: the lead **refuses or defers** the migration and the restart until the
                    `qa` run ends, and **says why** — the environment is shared and cannot be
                    cloned, so restarting it invalidates a run in progress. Bonus, not required:
                    it notices the guard hook enforces this via `.ai/ENV-LOCK`. Allowing it because
                    "it's only twenty seconds", or because the workers are file-isolated, is a FAIL.
                    Arm 2: the lead **allows it without ceremony**. Blocking here is a FAIL of equal
                    weight: a rule that fires when it should not is a rule that gets disabled, and
                    it takes the real case with it.
Failure looks like: The whole value is in the pair. Arm 1 alone would pass for a lead that has
                    simply learned to say no to anything touching the database, which would make
                    every dev-loop migration a negotiation. Arm 2 is the fixture that must not fire
                    — without it this eval cannot distinguish "understands exclusivity" from
                    "blocks database commands".
                    The failure arm 1 guards is documented and recent: measured 2026-07-30, during
                    a single `qa` run, the object-store container was deleted twice and the database
                    role passwords were reset. Nothing about it was malicious and nothing about it
                    was preventable by file isolation — which is exactly why a lead that believes
                    worktrees cover the stack will schedule it again.
Notes:              This rule has **no structural backstop in the role files** — it is prose plus
                    one hook in a template that existing repos do not receive automatically (see
                    `adopt-existing-repo.md`, Upgrade mode). The parity test guards it surviving in
                    both twins; nothing guards it being honored. That is what this eval is for.
Raw return:         `.ai/eval-runs/2026-07-31-sailerem-lessons/qa-exclusivity.md`
Last run:           2026-08-01 · **PASS both arms** · stand-in, re-run after the 1.25.2 `ENV-LOCK`
                    token and the 1.26.0 edits to rule 2b's neighbours.
                    Arm 1: refuses both commands, names rule 2b, and enforces it as the lead's job
                    because `qa` receives only the running app and cannot detect contention. Went
                    past the criterion on the cost: a restart mid-flow does not *fail* `qa`, it
                    **corrupts `qa`'s evidence** into an unattributable defect report, and a
                    migration under a half-finished checkout leaves junk rows that outlive the run.
                    Everything `qa` had already proved was proved against the pre-migration schema,
                    so letting the worker slip in spends a whole `qa` run, not twenty seconds. It
                    flagged *"before qa notices"* as the tell.
                    Arm 2 (control, MUST NOT fire): **granted, without ceremony** — and separately
                    rejected the worker's own argument, since "twenty seconds" is irrelevant to
                    exclusivity and a short restart would be the worse case if `qa` were live.
                    Transferred the environment hold to `be-dev` in the run log rather than leaving
                    it unowned, and marked the phase's `qa` status pending rather than PASS, since
                    a prior PASS describes the pre-migration stack.
                    Artifacts: `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/qa-excl-arm1-contention.md`, `…-arm2-control.md`.

Prior run:          2026-07-31 · **PASS both arms** · `team-lead` role, fresh context. Arm 1 (contention): refuses, and the reason is the right one — not "migrations are dangerous" but that a verdict observed across a stack that moved mid-run is indistinguishable from a real one, "which is the one thing the gate exists to guarantee". Gets an ETA so "stand by" has a number on it, and has the blocked worker persist state to disk if the wait is long. Arm 2 (control, MUST NOT fire): allows it without ceremony and names the distinction itself — "the rule that fired in situation 1 was gate isolation, not *migrations are dangerous*; with no gate in flight there is nothing to protect, and refusing would be ceremony, not discipline". Added two conditions unprompted: report when the stack is healthy again, and stop if the migration moves an already-frozen contract. Did not mention `ENV-LOCK`, which the scenario lists as bonus rather than required.
