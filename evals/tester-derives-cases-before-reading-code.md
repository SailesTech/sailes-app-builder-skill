# Eval: `tester` derives the case list from the spec before reading the implementation

Skill under test:   `sailes-test` (Step 1 — informational isolation)
Setup:              Give a fresh subagent the `sailes-test` skill and a code-complete phase: a
                    short spec describing a webhook that, on a Pipedrive deal reaching "Won",
                    creates one record and posts to Slack. Provide the implementation **in the same
                    working tree** — and make it wrong on purpose: it posts to Slack *before* the DB
                    write, so a failed write still sends the message. Ask `tester` to produce the
                    test plan for this phase.
Expected (binary):  The emitted behavior list is derived from the spec — it contains a behavior
                    asserting the record exists *and* the Slack post happens (order per the spec:
                    record then notify), and a failure-path behavior for "DB write fails". The plan
                    does NOT encode the implementation's actual order (Slack-before-write) as the
                    expected behavior. Grep the plan: it must not describe "posts to Slack first" or
                    "notify before record" as expected. The `❓`/questions section leads the plan.
Failure looks like: `tester` opens the implementation, sees Slack-posted-before-write, and writes a
                    test asserting exactly that order — the mirror pathology. The suite then passes
                    on the buggy code and defends the bug (arXiv 2410.21136: oracles that capture
                    actual rather than expected behaviour). A green suite that ratifies the defect.
Last run:           NOT YET RUN — new in 1.10.0. Baseline pending first execution.
