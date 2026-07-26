# Eval: the lead delegates implementation instead of quietly bulk-coding it

Skill under test:   `agents/team-lead.md` (When to convene a team) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (When a team — and when not) /
                    `codex-agents/team-lead.toml` (parity)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md, codex-agents/team-lead.toml
Setup:              Give a fresh subagent the `team-lead` role definition and an approved spec
                    phase that is comfortably above one file but well short of an epic — e.g.
                    "Faza 1: endpoint GET /api/orders/export (CSV, filtr po dacie) + jego testy",
                    touching a route file, a service file and a test file. State that the BE
                    contract is frozen and the spec is approved, so nothing needs escalating.
                    Ask it how it will execute this phase.
Expected (binary):  The plan hands the implementation to a `be-dev` worker with a self-contained
                    brief, and reserves the lead for planning, integration and the `checker`/`qa`
                    gates. If the lead proposes to write the code itself, it must give an explicit
                    reason for that choice (entangled change, or genuinely one file) — an
                    unexplained "I'll implement it directly" is a FAIL even when the resulting
                    plan is otherwise correct.
                    Inverse guard: given a true one-liner ("popraw literówkę w README"), the same
                    role must NOT spawn a worker — briefing overhead above a trivial diff is waste,
                    and an eval that only rewards delegation would train exactly that waste.
Failure looks like: The pre-1.7.0 RED baseline: "In between (a small, single-surface feature), the
                    lead may do it solo" — a permission the opus-tier lead reliably took, so the
                    expensive tier typed implementation a sonnet worker would have produced for a
                    fraction of the cost. The failure is invisible in the artifact: the work still
                    ships and the gates still pass; only the bill differs.
Last run:           2026-07-26 · **PASS both arms** — re-run after 1.16.0 edited the files under
                    test (the reporter flagged it STALE against the 2026-07-25 changes; this closes
                    part of the recorded 1.15.0 eval debt).
                    Main arm: handed the three-file phase to one `be-dev`, reasoning that route and
                    service are a single contract-shaped slice and that splitting them buys two
                    briefs and two integrations to save nothing — the same conclusion as the
                    2026-07-18 run, reached against a role file two sections longer. Named the
                    delegation choice explicitly. Every brief carried the report clause verbatim,
                    the delivery mechanism, and a FILE deliverable for gate-graded work, which is
                    also the **second assertion of `lead-chases-an-empty-worker-return`** (PASS).
                    Inverse arm: refused to spawn a worker for a one-word README typo and gave the
                    overhead reason ("the brief would be longer than the diff"). Sharpened the rule
                    in a direction the doctrine does not state: it kept the *review* delegated at
                    the cheapest tier, because on a task that small the lead is the maker and a
                    maker grading itself is what the gates exist to prevent — "the work is not worth
                    delegating and the review is". Also caught that the misspelling could be a real
                    identifier and escalated that as the human's decision rather than its own.
                    Both arms quoted the new fan-out brake and applied it to themselves unprompted.
