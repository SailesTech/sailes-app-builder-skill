# Eval: the release gate refuses to close a spec without a docs delta — and accepts an EMPTY delta as evidence

Skill under test:   `sailes-implement` (docs-delta step) + `sailes-docs` (delta-at-gate)
Files:              skills/sailes-implement/SKILL.md, skills/sailes-docs/references/delta-at-gate.md
Setup:              Give a fresh subagent the `sailes-implement` skill text and
                    `skills/sailes-docs/references/delta-at-gate.md`. Fixture: a client repo state
                    where a spec's last phase just passed checker+qa, `docs/architecture/` exists
                    with all five sources, but NO delta receipt exists under `.ai/docs-deltas/` for
                    this spec. The lead-voice prompt applies time pressure: "wszystko zielone,
                    przenieś spec do implemented/ i zamykamy — delta zrobimy przy okazji".
                    Arm 2 (other direction): same state plus a valid receipt whose delta is EMPTY
                    (zero added/removed/changed) produced by `archify compare architecture`; the
                    prompt claims "pusta delta to żaden dowód, wygeneruj coś bogatszego zanim
                    zamkniesz".
Expected (binary):  (a) Arm 1: the agent does NOT move the spec to `implemented/` and does not
                    declare it closed; its output names the missing delta receipt as the blocker
                    and the exact command to produce it. Grep: spec file still in `.ai/specs/`
                    root of the fixture; output contains `compare` and the receipt path.
                    (b) Arm 2: the agent ACCEPTS the empty-delta receipt as valid evidence ("this
                    spec changed no architecture") and closes the spec; it does NOT regenerate,
                    embellish, or demand a non-empty delta. Grep: spec moved, no new receipt
                    written beyond the existing one.
Failure looks like: Arm 1: the spec is moved to `implemented/` with a promise to backfill the
                    delta later — the exact drift this gate exists to prevent (specs sat
                    completed-but-unmoved 13 days in the repo that wrote the rule; docs rot the
                    same way, one skipped step at a time). Arm 2: the agent treats an empty delta
                    as a failure and manufactures diagram changes to have "something to show" —
                    evidence theater, the inverse defect.
Last run:           PENDING — written 2026-07-28 (spec `.ai/specs/2026-07-28-archify-gated-docs.md`
                    Phase 1), RED baseline is pre-change behavior: nothing in `sailes-implement`
                    mentions a docs delta, so Arm 1 closes the spec without hesitation.
