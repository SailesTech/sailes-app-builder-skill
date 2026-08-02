# Eval: the lead delegates implementation instead of quietly bulk-coding it

Skill under test:   `skills/sailes-bootstrap/delegation-threshold.md` (the single source), as
                    stamped into `agents/team-lead.md` (When to convene a team) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (When a team — and when not) /
                    `codex-agents/team-lead.toml` (parity)
Files:              skills/sailes-bootstrap/delegation-threshold.md, agents/team-lead.md,
                    skills/sailes-bootstrap/agent-team-structure.md, codex-agents/team-lead.toml
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
Notes:              The threshold this measures lives in exactly one place —
                    `skills/sailes-bootstrap/delegation-threshold.md`, stamped into the three files
                    above by `tools/sync-blocks.js`. Grade against that text, not against whichever
                    copy the subagent happened to be handed.
                    This eval decides **who writes**. Whether a worker that does get spawned carries
                    `isolation: worktree` is the other axis, graded by
                    `lead-gives-every-writer-a-worktree` — whose arm 1 was re-cut on 2026-08-01 for
                    exactly this reason: it used to demand a spawned, worktree-carrying worker for a
                    three-line one-file change, which the inverse guard above forbids. A fixture
                    below this threshold cannot also serve as a fixture for isolation; keep the two
                    apart.
Last run:           2026-08-02 (at 27bdb98) · **PASS** — main arm re-run after the threshold moved
                    into its single source and was stamped into three files. Stand-in.
                    Delegates: `explorer` read-only, `be-dev` on the two source files, `tester` on
                    the test file with `be-dev` explicitly barred from it — the only way the
                    tester's informational barrier can break without leaving a trace in the diff.
                    Threshold reasoning stated in both directions, as the source now requires.
                    Gates scaled rather than assumed: `checker` yes, `qa` **yes, not `n/a`**, since
                    a CSV download is observable. One conditional override, with a judgment-shaped
                    trigger — `checker` to opus only if `explorer` confirms tenancy scoping, because
                    the defect then becomes what the diff omits.
                    It also raised a question the frozen contract did not settle — whether the date
                    filter's `to` bound is inclusive and in whose timezone — and routed it to the
                    human rather than letting a worker pick, which is the right read of "frozen
                    contract" meaning frozen *shape*, not every semantic in it.
                    The inverse guard was not re-run; the threshold's text changed location, not
                    meaning, and the guard's subject is unchanged. Judgment, recorded as one.
                    Artifact: `.ai/eval-runs/2026-08-02-rerun/R7-delegates.md`.

Prior run:          2026-08-01 · **PASS both arms** · stand-in, re-run after the 1.26.0 edits.
                    Main arm: `be-dev` writes route + service, `tester` writes the suite with the
                    implementation unread and dispatched concurrently so the barrier is physical
                    rather than promised, lead touches none of the three files. Delegation recorded
                    as an owed decision, `checker` escalated to opus with a judgment-shaped reason
                    (the feared defect is an omitted tenant filter, not an incorrect line) and the
                    four non-overrides logged as defaults.
                    Inverse guard (one-line README typo): **no worker spawned**, cost named,
                    solo call recorded in the run log with its reason. Also declined a scripted
                    regex in favour of a literal `Edit`, citing the repo's own `String.replace()`
                    silent-no-op and CRLF/LF history.
                    Both arms pulled in 1.26.0 material unprompted — the stale-base check written
                    into the brief, and the metadata-only observation ladder as the silent-worker
                    path — without disturbing what this scenario grades.
                    **Doctrine defect surfaced by the inverse arm, not by this scenario:**
                    `agents/team-lead.md` line 13 ("go solo … and even then still run the `checker`
                    review gate and `qa` behavior proof") contradicts line 17 (below about a file's
                    worth of change the overhead exceeds the saving) on exactly a two-character
                    docs diff. The arm resolved toward skipping both, named it as a judgment rather
                    than a fact, and handed it to the human. Filed to `.ai/backlog.md`.

Prior run:          2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Convenes explorer → be-dev → tester (derive-then-write, dispatched in parallel with be-dev to enforce isolation by timing) → checker → qa; six verbatim briefs each naming a FILE deliverable; "endpoint + jego testy" correctly split into two workers with be-dev forbidden from the test file; non-overrides logged incl. an explicit rejection of escalating be-dev for volume. Zero bulk-coding.
