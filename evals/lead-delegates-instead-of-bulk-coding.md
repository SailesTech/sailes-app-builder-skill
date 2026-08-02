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
Expected (binary):  The source is symmetric — `delegation-threshold.md`: "Either way it is a
                    choice you owe the run log a reason for, in both directions" — so this
                    scenario grades BOTH directions a plan could take, and a plan cannot satisfy
                    one direction by having been right about the other.

                    Delegates (the expected branch for this setup — a route file, a service file
                    and a test file is comfortably above one file's worth): the plan hands the
                    implementation to a `be-dev` worker with a self-contained brief, reserves the
                    lead for planning, integration and the `checker`/`qa` gates, AND states a
                    reason the change clears the threshold. A plan that routes correctly but is
                    silent on why — a bare "I'll hand this to be-dev" — is a FAIL on this
                    scenario: the routing being right does not excuse the missing reason.

                    Goes solo: the lead writes the code itself and gives an explicit reason for
                    that choice (entangled change, or genuinely one file). An unexplained "I'll
                    implement it directly" is a FAIL even when the resulting plan is otherwise
                    correct.

                    These two branches are mutually exclusive by construction — a given plan
                    either hands the three files to a worker or it does not — so nothing in one
                    branch's requirement can stand in for the other's: a delegated plan is graded
                    on the Delegates paragraph alone (Goes-solo's reason has no bearing and cannot
                    substitute for a missing delegation reason), and a solo plan is graded on the
                    Goes-solo paragraph alone (a well-argued solo reason does not also need a
                    delegation-shaped reason, because no delegation happened). There is no plan
                    shape that satisfies both or that needs to.

                    Inverse guard (a separate fixture, not this scenario's setup): given a true
                    one-liner ("popraw literówkę w README"), the same role must NOT spawn a
                    worker — briefing overhead above a trivial diff is waste, and an eval that
                    only rewards delegation would train exactly that waste. Going solo on the
                    one-liner still owes its Goes-solo reason, but a worker spawned on the
                    one-liner is a FAIL regardless of any reason attached to it — the guard is not
                    something a stated reason can talk its way past.
Failure looks like: The pre-1.7.0 RED baseline: "In between (a small, single-surface feature), the
                    lead may do it solo" — a permission the opus-tier lead reliably took, so the
                    expensive tier typed implementation a sonnet worker would have produced for a
                    fraction of the cost. The failure is invisible in the artifact: the work still
                    ships and the gates still pass; only the bill differs.
                    The mirror failure this criterion was reopened to catch (backlog row 29,
                    2026-08-03): a plan that delegates correctly and never says why. Silent
                    delegation reads as a pass today under an asymmetric criterion, and it is the
                    more expensive direction of the same mistake — a worker gets spawned, briefed,
                    reported on and integrated for a call nobody wrote down as owed. Also invisible
                    in the artifact, for the same reason: the work still ships and the gates still
                    pass.
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
                    **Read this before grading against `Last run:` below.** Those entries record
                    what the graded AGENT DID on that date — evidence a run happened, not a
                    restatement of what `Expected (binary)` above requires. The 2026-08-02 entry's
                    "Threshold reasoning stated in both directions, as the source now requires"
                    describes the agent's behavior on that run; it is not the criterion. Reading it
                    as the criterion is exactly what closed backlog row 29 as fixed on 2026-08-03,
                    when `Expected (binary)` at the time still asked for a reason in only one
                    direction (the solo branch). Grade this scenario against `Expected (binary)`,
                    never against a `Last run:` note — however precisely that note happens to echo
                    the doctrine's language.
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
