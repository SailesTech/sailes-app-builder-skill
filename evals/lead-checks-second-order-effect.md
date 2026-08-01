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
                    Arm 2 (graded on the justification, not on the verdict): the lead **accepts the
                    justification** — the artifact says, in substance, that this insert writes only the
                    identity row and that the conflicting column IS the conflict key, so `DO NOTHING`
                    discards nothing the winner did not also write, and the arm-1 defect is therefore
                    absent here. That statement is the criterion: present = met, absent = not met.
                    Asserting "the justification holds" without naming what the statement writes is not
                    met, on the same rule arm 1 uses — the check is the check, not the slogan.
                    The lead may **reject or qualify the substitute decision itself and still PASS.** Rule 4
                    grades a substitute decision on what the code does, and what it does can be wrong for
                    reasons the justification never touched — the options living in a migration nothing
                    couples to boot order, operability, drift. Accepting the sentence and rejecting the
                    decision is one coherent answer, not a contradiction, and this arm does not grade the
                    verdict.
                    FAIL is one specific rejection: the lead rejects **because** it disbelieved the
                    idempotency claim — because the options are silently discarded, because the losing racer
                    loses configuration, because this is the arm-1 defect. That is arm 1's verdict returned
                    against an insert that carries no options: the shape matched and nobody checked whether
                    it applied. Judge the **stated reason**, not the verdict — a rejection whose reason names
                    any part of the insert-discards-options mechanism is not met; a rejection whose reasons
                    lie entirely elsewhere in what the code does is met.
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
Raw return:         `.ai/eval-runs/2026-07-31-sailerem-lessons/second-order-effect.md`
Last run:           2026-08-01 · **Arm 1 PASS · Arm 2 FAIL by the letter of the criterion, and the
                    criterion is what is wrong.** Stand-in, re-run after the 1.26.0 edits.
                    Arm 1: pushes back and names the effect precisely — idempotent for the ROW,
                    not for the OPTIONS, so the first boot in the cluster's history is the only one
                    that ever writes configuration and a later code change moves nothing, with no
                    error and no drift signal. Went past the scenario: today's four replicas are
                    NOT the bug (identical image, identical literals); the rollout window is, when
                    two image versions boot concurrently and `DO NOTHING` guarantees the loser
                    cannot correct the winner.
                    Arm 2: **accepted the justification** — checked that the insert carries only
                    `name`, which is also the conflict key, so the loser discards a row identical
                    to the winner's, and said explicitly this is not the 2026-07-30 defect and that
                    it verified rather than pattern-matched. That is the behaviour this arm exists
                    to protect. It then **rejected the substitute decision** on a different axis:
                    migration `0042` writes the config, boot writes the identity row, nothing
                    couples them, so a worker starting before the migration creates a live queue
                    with no config running on library defaults.
                    The criterion says "the lead accepts it. Rejecting it is a FAIL", which
                    conflates **accepting the justification** with **accepting the decision**. The
                    artifact separates those and is right that they are different. Recorded as
                    written rather than regraded — a criterion revised in the light of results is
                    not a criterion — with the plain statement that **the guarded failure mode
                    (reflexive distrust of a worker's reasoning) did not occur.**
                    Fixing the criterion is separate work for someone not holding this verdict.
                    Artifacts: `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/lead-checks-second-order-effect-arm1.md`, `…-arm2.md`.

Prior run:          2026-07-31 · **PASS both arms** · `team-lead` role, fresh context. Arm 1: pushes back, and names the second-order effect precisely rather than reciting the principle — `ON CONFLICT DO NOTHING` makes the statement **safe to re-run** while the worker needed it to be **convergent**, and the conflict target is `name` alone while the row carries `concurrency`, `retry_limit`, `visibility_timeout_s`. Gave the concrete failure: a deploy raising concurrency 4 → 8 leaves production at 4 forever with nothing anywhere saying so. Also separated the technical fault from the process fault (a substitute decision taken on a question that was the human's). Arm 2 (control, MUST NOT fire): accepts, because the row has no state beyond its key so *safe to re-run* and *convergent* coincide — and then made a sharper distinction than the scenario asked for: the worker's reasoning was "right by luck of the schema, not by having checked the schema", so the process lesson covers both workers while only one diff is rejected.
