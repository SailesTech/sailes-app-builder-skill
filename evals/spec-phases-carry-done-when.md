# Eval: every spec phase carries a binary Done-when

Skill under test:   `sailes-spec` / `sailes-bootstrap/spec-writing-template.md`
Files:              skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md
Setup:              Give a fresh subagent the spec-writing template (or the local skill it
                    generates) and a realistic 2-phase feature brief (e.g. "CSV export of
                    deals with an async job"). Ask it to write the Phasing & Steps section.
Expected (binary):  Every phase in the output contains a `Done-when` with exact command(s)
                    AND an expected outcome (`grep -c "Done-when"` ≥ phase count; each block
                    names a runnable command, not a quality adjective).
Failure looks like: Phases described as "testable" with qualitative completion ("works
                    correctly", "is polished") and no machine-checkable condition — the
                    recorded RED baseline before the 2026-07-02 adoption.
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent.
                    Every phase and every step carries a binary, machine-checkable `Done-when` —
                    exact command plus expected outcome, 18 of them. Notable ones are genuinely
                    checkable rather than nominally so: migration drift as `db:generate` → "No
                    schema changes" plus an empty `git status --porcelain`; the private-file claim
                    as an unsigned GET asserting 403; the UI gate as a pixel threshold rather than
                    human eyeballing. Split into three phases instead of the brief's expected two,
                    with the reason stated — folding the UI, retry and retention into phase 2 would
                    have forced a phase-level Done-when that was a grab-bag rather than one binary
                    condition. The two smoke scripts are themselves phase deliverables, so the gates
                    are runnable.
