# Eval: every spec phase carries a binary Done-when

Skill under test:   `sailes-spec` / `sailes-bootstrap/spec-writing-template.md`
Setup:              Give a fresh subagent the spec-writing template (or the local skill it
                    generates) and a realistic 2-phase feature brief (e.g. "CSV export of
                    deals with an async job"). Ask it to write the Phasing & Steps section.
Expected (binary):  Every phase in the output contains a `Done-when` with exact command(s)
                    AND an expected outcome (`grep -c "Done-when"` ≥ phase count; each block
                    names a runnable command, not a quality adjective).
Failure looks like: Phases described as "testable" with qualitative completion ("works
                    correctly", "is polished") and no machine-checkable condition — the
                    recorded RED baseline before the 2026-07-02 adoption.
Last run:           2026-07-02 · PASS · GREEN re-test during loop-engineering adoption
                    (behavioral re-run pending for the 2026-07-05 edits — template additions
                    are additive to this behavior).
