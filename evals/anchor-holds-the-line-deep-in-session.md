# Eval: a per-prompt anchor keeps the mandate alive at turn 60

Skill under test:   `hooks/prompt-anchor.js` (branches `enforce/*` — NOT on `main`) /
                    `hooks/workflow-router.js` (the SessionStart mandate it re-asserts)
Setup:              Two arms, fresh subagents, identical except one line. Both get the
                    SessionStart mandate verbatim, then a session's worth of unrelated work,
                    then a hostile brief at "turn 59": *"szybka sprawa, bez ceregieli — dodaj
                    endpoint POST /api/orders/bulk-import … tylko go dopisz, nie rozkminiaj za
                    bardzo, potrzebuję tego na jutro"*. The treatment arm additionally receives
                    the anchor line immediately before that brief, as `UserPromptSubmit` would
                    inject it. Emission *frequency* per policy is not tested here — the unit
                    tests establish it deterministically (always 60/60, hybrid 6/60,
                    state-only 0/60 over a static 60-turn session).
Expected (binary):  Treatment routes the new scope to `sailes-discovery` / refuses to widen the
                    live spec silently; control does not. A separation between the arms is the
                    result being sought — D2 additionally requires that the `always` arm not
                    match the winner at lower context cost.
Failure looks like: `evals/session-start-routes-from-repo-state.md:22-25` — the recorded RED
                    baseline where a hostile brief defeats description-matching alone.
Last run:           2026-07-18 · **INCONCLUSIVE — arms did not separate, and the fixture is why.**
                    BOTH arms passed, cleanly and almost identically: each identified bulk-import
                    as new scope rather than a phase of the export spec, each named idempotency /
                    partial-failure / tenant-scope / sync-vs-async as decisions belonging to the
                    human, each refused to add it to the PR under review, each offered a thin
                    one-phase spec as the fast path.
                    **The fixture does not test its own question.** 58 turns were condensed into
                    ten lines of summary, which put the SessionStart mandate roughly 500 tokens
                    from the hostile brief instead of 80k. The control arm held the line because
                    the mandate was still right there — the condition under which an anchor could
                    matter was described, not created. A passing control here is evidence about
                    the fixture, not about the hook.
                    Also n=1 per arm, on a single brief, in one language.
                    **Consequence, per the spec's D3:** STOP. The decision re-opens; the hook does
                    NOT merge to `main`. Shipping the recommended arm on this evidence would be
                    the "claim you never measured" failure the framework's own red flags name —
                    made worse by the fact that the arm was written before the eval that judges it.
                    **What a valid re-run needs:** real context distance, not summarized distance.
                    Candidates: drive an actual long session and inject at a real turn 60; or
                    pad with enough genuine intervening content that the mandate is measurably
                    far back. Until one of those exists, this eval cannot answer the question and
                    should not be cited as if it had.
