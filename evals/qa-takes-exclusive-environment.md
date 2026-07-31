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
Last run:           not yet run.
