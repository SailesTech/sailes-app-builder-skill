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
Last run:           2026-08-01 · **PASS** — re-run after the 1.26.0 edits to `sailes-spec`.
                    Seven phases, each with a binary `Done-when` of exact commands plus expected
                    results, an "app state after" line, and migration numbers handed out up front
                    with the collision-at-merge reason stated. Genuinely checkable rather than
                    nominally so: the streaming requirement gets `node --max-old-space-size=256`,
                    because a buffered implementation passes every functional assertion; the
                    private-download claim is 404-not-403 on another admin's job; the sweeper's
                    index is asserted with `explain`.
                    It also pulled in both 1.26.0 additions without being asked — the route-set
                    equality check (citing the recorded failure where "every route file is
                    imported" passes while handlers are missing) and the allowed-files table where
                    every path names the clause forcing it.
                    Honest caveat it raised itself: the section depends on five answered Open
                    Questions (storage backend, URL TTL, cross-admin download, CSV encoding, retry
                    budget) and says so rather than deciding them silently — if those answers are
                    not in the Decisions Ledger, phases 3–5 are not ready as written.
                    Artifact: `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/spec-phases-done-when.md`.

Prior run:          2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent.
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
