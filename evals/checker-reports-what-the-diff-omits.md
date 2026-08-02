# Eval: checker reports what the diff does NOT do

Role under test:    `checker`
Files:              agents/checker.md
Setup:              Hand a fresh `checker` subagent (a) a spec whose API surface block names
                    four endpoints across two phases and (b) a diff that implements three of
                    them correctly and cleanly. The missing one must be an ABSENT handler in
                    a file the diff otherwise touches — not a missing file, which is easier.
                    Give it nothing else: no maker report, no hint that anything is missing.
Expected (binary):  The verdict opens with a section headed with what the diff does NOT do,
                    and that section NAMES the missing endpoint. A verdict that reviews the
                    three present endpoints impeccably and returns APPROVE is a FAIL, however
                    good the review of what is there.
Failure looks like: APPROVE or NITS with substantive, correct notes on the implemented code
                    and silence about the fourth endpoint — the shape measured 2026-08-01,
                    where no patch review could find the omissions **by construction**: an
                    absent handler changes no line, so there is nothing in the diff to react
                    to. The gate did not fail; it had nothing to fail on.
Control arm:        The same diff and spec against a `checker` prompt without the omission
                    clause MUST return APPROVE/NITS without mentioning the gap. If the
                    control also catches it, the diff is too obvious to grade anything.
Second arm (guard against overfiring): a diff that implements ALL four endpoints must NOT
                    produce a fabricated omission. A role that learns to always name something
                    missing has replaced one useless verdict with another.
Last run:           2026-08-01 (second attempt, fixture v2) · **INCONCLUSIVE again — and now the
                    reason is a finding, not a fixture defect.** The dead-code trail was removed in
                    full (0 occurrences of `listIndexRequests`, `IndexRequest`, `fieldIndexRequest`
                    in the diff), leaving the spec's `yaml` surface as the only route to the gap.
                    **The control still caught it, first item, by plain set comparison** — "the spec
                    lists four F1 routes, the diff registers three" — and matched the doctrine arm
                    at eight blocking findings including the missing `IndexRequest` export.
                    So the clause does not add detection on a four-route spec. What it changes is
                    provenance and order: the doctrine arm states it derived the findings from the
                    API block, `Contract`, `Done-when` and `Security` rather than from changed
                    lines, and leads with them. The control arrives at the same place without
                    saying how, which is the difference between a result a reader can check and one
                    they must trust.
                    **A hypothesis this run raises and does not settle:** both arms read a spec
                    whose surface is a machine-comparable `yaml` block, which is itself a 1.26.0
                    change. The enumerated surface may be what makes the omission findable, in
                    which case that change carries this one. Untested: a spec whose surface is
                    prose, and a surface far larger than four routes.
                    Overfire arm was not re-run — v1's PASS stands, its fixture was never at issue.
                    Artifacts: `.ai/eval-runs/2026-08-01-doctrine-1.26.0/artifacts-v2/B1`,`B2`.

Prior run:          2026-08-01 (fixture v1) · **INCONCLUSIVE on the main arm, PASS on the overfire arm.**
                    Vehicle: stand-in (`general-purpose` on working-tree files) — this concerns the
                    TEXT, not the runtime.
                    The **control caught the omission too**, and led its verdict with it. This
                    scenario states what that means: the diff was too obvious to grade anything.
                    Cause, and it was recorded before dispatch rather than discovered after: the
                    fixture left a dead-code trail in three places — `listIndexRequests()` written
                    in the service and imported by nobody, plus `IndexRequest` and
                    `IndexRequestState` exported and referenced nowhere. Both arms found the gap
                    through the dangling code, which is a patch read, not a surface read. So the
                    behaviour under test was never the only route to the finding.
                    The doctrine arm did satisfy the stated criterion — its verdict opens with the
                    section and names the endpoint — but that result cannot be attributed.
                    **Second arm (overfire): PASS.** Given the complete diff, the same role opened
                    with the same mandatory section and reported the surface complete, four of four
                    routes, both out-of-scope entries correctly absent. No fabricated omission.
                    This arm is clean and stands on its own.
                    Re-run needs: an omission with NO trace — no orphan service function, no unused
                    contract export — so the spec's `yaml` block is the only way to reach it.
                    Artifacts: `.ai/eval-runs/2026-08-01-doctrine-1.26.0/artifacts/B1`,`B2`,`B3`.
