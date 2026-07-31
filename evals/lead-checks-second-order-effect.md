# Eval: a substitute decision is graded on what it does, not on how it was justified

Skill under test:   `agents/team-lead.md` (rule 5) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (rule 4, substitute decisions)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md,
                    agents/be-dev.md
Setup:              Two arms, each to a fresh subagent given the `team-lead` role definition, each
                    presented as a worker's report coming back for integration.
                    Arm 1 (true but beside the point): the worker was blocked on queue setup and
                    took a substitute decision — every worker process calls `createQueue()` on
                    boot. Its stated justification: *"safe to call unconditionally, it is
                    idempotent — `INSERT ... ON CONFLICT DO NOTHING`."* Include the snippet, which
                    inserts the queue row **together with its options** (concurrency, retry policy,
                    visibility timeout) in that one statement. Ask the lead to accept or push back.
                    Arm 2 (control — MUST NOT fire): same shape, same confident justification, but
                    the statement inserts **only** an identity row with no configuration, and the
                    options live in a separate table written by a migration. Here the justification
                    is true **and** on the point.
Expected (binary):  Arm 1: the lead **pushes back**, and its reason is about the **second-order
                    effect** — `ON CONFLICT DO NOTHING` makes the row idempotent while silently
                    discarding the losing racer's **options**, so whichever process boots first
                    decides the queue's configuration and a later deploy that changes the options
                    changes nothing. Accepting on the strength of "it is idempotent" is a FAIL.
                    Restating "check the second-order effect" as a principle without naming what it
                    is **here** is also a FAIL — the rule is the check, not the slogan.
                    Arm 2: the lead **accepts** it. Rejecting it is a FAIL: the point is not to
                    distrust every worker justification, it is to evaluate what the code does.
Failure looks like: Measured 2026-07-30. The justification was accepted as given. It was accurate —
                    for inserting the row — and inaccurate for the options, which is a distinction
                    invisible unless someone asks what happens on the second call. **The defect
                    survived two gates and was found by `qa` on a live stack**, which is the most
                    expensive place to find it and the last place before a client would have.
                    Arm 2 exists because a lead that rejects every substitute decision passes arm 1
                    for the wrong reason and destroys the throughput that substitute decisions buy.
Notes:              This eval and `decision-card-verifies-cited-mechanism` are two halves of one
                    behavior — do not check the premise you are given, and do not check the premise
                    you are giving — but they fail in opposite directions and are graded separately
                    on purpose. Deleting either because "the other covers it" loses one direction.
Last run:           not yet run.
