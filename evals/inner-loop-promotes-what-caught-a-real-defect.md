# Eval: the implementer's fast checks stay cheap, and the one that caught a real defect is promoted

Skill under test:   `sailes-implement/SKILL.md` (per-step loop, step 1 — the inner loop and the
                    report duty) / `agents/be-dev.md`, `agents/fe-dev.md` (Report) /
                    `sailes-test/SKILL.md` § Step 4 + `agents/tester.md` (the intake)
Files:              skills/sailes-implement/SKILL.md, agents/be-dev.md, agents/fe-dev.md, skills/sailes-test/SKILL.md, agents/tester.md, skills/sailes-test/test-plan-template.md
Setup:              Hand a fresh subagent (clean context) the `be-dev` role, the implement skill, an
                    approved spec and a shared helper module it is **forbidden to modify**, then a
                    normal implementation brief. Ask for the role's own Report as the deliverable.
                    **The trap:** the helper contains a real, subtle defect —
                    `parseAmount('')` returns `0` rather than `null`, so a blank CSV cell is
                    indistinguishable from a genuine `0,00`. The spec demands blank amounts raise
                    `unparseable_amount`, and its sample batch (a real import, blank cell included)
                    makes the case reachable without naming it. An implementer running a quick check
                    on realistic data hits a fault **in code they did not write and may not fix** —
                    which is exactly the shape a promotion candidate has.
                    **A/B:** arm A = the implement skill and `be-dev` before the inner-loop change;
                    arm B = after.
Expected (binary):  Two conditions, and **both** are required because they fail in opposite
                    directions:
                    (a) arm B's fast checks are described as **disposable and unceremonious** — no
                        behavior IDs, no freeze, no detection proof, not offered as gate evidence;
                    (b) arm B names **exactly the check that caught the real defect**, with the
                        defect as its provenance, and hands it to `tester` rather than adding it to
                        a frozen list itself.
                    **An arm B that promotes everything has built a second suite and FAILS** — that
                    is the failure mode this change is most likely to have, since the cheapest way
                    to satisfy a promotion rule is to promote indiscriminately.
                    **An arm B that promotes nothing has lost the signal and FAILS.**
                    Arm A is expected to fix or work around the helper defect silently, or to report
                    it as a blocker with no test attached — the report has no field for it.
Discriminates on:   what the REPORT contains, not on the implementation. Both arms will likely
                    produce working code; the code is not the artifact under test.
Failure looks like: the structure this change was written against — `sailes-implement` named the
                    implementer's check "scaffolding for the step" and nothing more. Nothing said it
                    should be fast, nothing licensed several of them, and **nothing asked what it
                    caught**. So the one test in the pipeline whose detection power was *earned
                    rather than argued* died with the step, while the frozen list kept growing from
                    mandate. The subtler failure to watch for: an arm B that reports the defect but
                    not the check — the diagnosis survives and the regression test still does not.
Last run:           2026-09-13 (at 6995c93) · **INCONCLUSIVE** · arm B only, rebuilt fixture, stand-in
                    (Sonnet `be-dev`). The arm anticipated `parseAmount('')` → `0` from reading the
                    helper and guarded the empty cell before any check ran, so nothing went red on a
                    real defect and there was nothing to promote ("Promotion candidate: none", test to
                    watch named for `tester`). Fixture defects: the helper defect is visible on a read;
                    `node --test <dir>` fails on Node 26. Record:
                    `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine at `d6e6e01`
                    unless noted; up to `6995c93` doctrine changed only in two sub-teams sentences
                    (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml` (`6995c93`,
                    G28), checked by `git diff`, so the pin is a recorded judgment (G26), not a re-run.

Prior run:           2026-08-30 · PARTIAL-PASS · arm B names the check that caught the defect and its
                    provenance; arm A reports only the diagnosis, under a heading with no check in it.
                    Neither arm built a second ID-bearing suite — the ceremony-doubling risk did not
                    materialise, and arm A is a competent control (both found the defect, A wrote 9
                    checks to B's 8). Two gaps: routing was left to inference — arm B never named
                    `tester` and titled its section something no role would grep — which produced the
                    fixed `Promotion candidate:` label now in the text, **unmeasured, since the arms
                    ran against the pre-label wording**; and criterion (a) was badly written, asking an
                    arm to narrate an absence of ceremony rather than behave without it — both arms
                    behaved, so it discriminated nothing and is retired. Single run per arm, stand-in
                    vehicle (fresh generic subagent + working-tree text). Nothing here measures SPEED:
                    the case for the inner loop is structural, not timed, and a wall-clock A/B is owed.
                    Full record: `.ai/eval-runs/2026-08-30-inner-loop-promotion/VERDICT.md`.
