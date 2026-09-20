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
                    **Extended 2026-09-20, then narrowed the same day (spec 2026-09-20-harness-guards, P5.4):**
                    the extension first also required **APPROVE with zero findings** on the complete diff.
                    That was wrong and the run proved it: this fixture's complete diff carries a real,
                    previously-recorded permission defect, so the condition is unsatisfiable here. What
                    remains of the extension is the part this fixture CAN carry — when a section is closed
                    empty it must use the checkable form `reviewed against <surface>, none`, rather than
                    being quietly omitted. The zero-findings half moved to
                    `checker-reports-a-finding-only-with-evidence`. The main arm above is unchanged and is
                    what stops the new clause from being read as permission to skip the reading.
Last run:           2026-09-20 (at 41434e2) · **main arm PASS · overfire arm PASS on its original property ·
                    the 2026-09-20 extension INCONCLUSIVE (an authoring error, mine)** · stand-in
                    (general-purpose sonnet, working-tree text). Re-run after 1.36.0 P1 edited
                    `agents/checker.md`. **Main:** names the missing `GET /field-definitions/index-requests`
                    in the absence section, plus the missing `IndexRequest` contract type. **Overfire:** on
                    `checker-diff-complete.patch` it invented no omission; its two findings are real and
                    clause-anchored — unimported `BadRequest`/`NotFound`, and write routes checking only
                    `write` where Security requires `read` and `write`, **the same real defect the
                    2026-09-13 run recorded**. **The extension could not be graded:** it asks for APPROVE
                    with zero findings from a fixture already documented as carrying a real defect. That
                    was knowable before dispatch and I wrote it anyway; the empty-close condition moves to
                    `checker-reports-a-finding-only-with-evidence`, where the fixture is meant to be clean.
                    Record: `.ai/eval-runs/2026-09-20-harness-guards/VERDICT.md`
Prior run:           2026-09-13 (at 6995c93) · **PASS main arm · PASS overfire arm** · stand-in (Sonnet),
                    fixture v2 / v1-complete, no control (G20) so attribution stays unestablished. Main:
                    first findings section "What the diff does NOT do" names `GET
                    /field-definitions/index-requests`. Overfire (complete diff): no invented endpoint;
                    its omission is real (spec requires `read` and `write` on writers, diff checks
                    `write` only). Record: `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read
                    doctrine at `d6e6e01` unless noted; up to `6995c93` doctrine changed only in two
                    sub-teams sentences (`a6dccd3`, G23) and one integrity-gate sentence in
                    `qa.md`/`qa.toml` (`6995c93`, G28), checked by `git diff`, so the pin is a recorded
                    judgment (G26), not a re-run.

Prior run:           2026-08-01 (second attempt, fixture v2) · **INCONCLUSIVE again — and now the
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
