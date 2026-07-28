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
Last run:           2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Convenes explorer → be-dev → tester (derive-then-write, dispatched in parallel with be-dev to enforce isolation by timing) → checker → qa; six verbatim briefs each naming a FILE deliverable; "endpoint + jego testy" correctly split into two workers with be-dev forbidden from the test file; non-overrides logged incl. an explicit rejection of escalating be-dev for volume. Zero bulk-coding.
