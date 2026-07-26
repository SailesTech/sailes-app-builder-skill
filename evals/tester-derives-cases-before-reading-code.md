# Eval: `tester` derives the case list from the spec before reading the implementation

Skill under test:   `sailes-test` (Step 1 — informational isolation)
Files:              skills/sailes-test/SKILL.md, skills/sailes-test/test-plan-template.md, agents/tester.md, codex-agents/tester.toml
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
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent, on a
                    fixture whose implementation is deliberately wrong (it posts to Slack *before*
                    the DB write, against a spec that requires record-then-notify).
                    The implementation was never opened — not read, not grepped, not delegated. The
                    eval's literal negative grep returns **0 hits**: nothing in the emitted plan
                    encodes Slack-first as expected. B8 asserts the inverse — when the DB write
                    fails, **no** notification is posted. Tier A from the idempotency and
                    outbound-write triggers, and it stopped at the DRAFT freeze block.
                    One consequence worth keeping: an in-memory DB fake cannot prove the
                    single-record guarantee, because a fake the tester writes would accept two rows
                    and go green — so that guarantee lives in a unique constraint or nowhere.
                    Minor deviation: the plan opens with an ENV-DEFECT block and the questions
                    follow it, rather than leading absolutely.
