# Eval: the risk tier shortens the case list without costing fault detection

Skill under test:   `sailes-test/SKILL.md` (§ Step 5 — the tier table's **Case list** column and the
                    straddle-pair rule) / `agents/tester.md` (step 5) /
                    `skills/sailes-test/test-plan-template.md` (tier blockquote)
Files:              skills/sailes-test/SKILL.md, skills/sailes-test/test-plan-template.md, agents/tester.md, skills/sailes-test/references/techniques.md
Setup:              Hand a fresh subagent (clean context, nothing about this eval) the `sailes-test`
                    skill with its two references, an approved spec, and the finished
                    implementation, and ask for the test suite. Zero-dependency `node:test` so the
                    suite is runnable and scoreable.
                    The fixture must contain a **cross-product** — several fields, each with named
                    numeric edges. A fixture without one cannot exercise this rule at all; see the
                    null result in the verdict.
                    **A/B:** arm A = `sailes-test` before the Case-list column; arm B = after.
                    **Then score both suites with fault injection**, not by counting lines:
                    `scratchpad/faultab2/run-mutants.js` applies eight single-line faults, each
                    breaking one numbered spec clause, and reports kills. Four of the eight are
                    off-by-one edge mutants — the class the straddle pair exists for.
Expected (binary):  Arm B produces **fewer cases than arm A and kills the same number of faults.**
                    Both halves are required. A smaller suite that kills fewer is a FAIL and the rule
                    does not ship: the human's constraint on this whole change was "zachował zalety
                    testowania", and volume alone cannot tell a leaner suite from a weaker one.
                    A LARGER arm B is also a FAIL, and is not hypothetical — see below.
Failure looks like: **Measured, in this eval's own first run.** The rule's first wording told tier B
                    to walk "every boundary the spec actually names, **in full**" — six values per
                    edge. Arm B came back at **70 cases against arm A's 58**, a 21% increase, at
                    identical 8/8 detection. A doctrine change that read persuasively as a cut
                    produced growth, and only fault injection against real model output showed it.
                    The corrected rule (straddle pair: last accepted value, first rejected one)
                    scored 42 cases at 8/8.
                    The subtler failure to watch for: an arm B that reaches a short list by dropping
                    the **invalid** partitions. That is not a shorter list, it is an untested
                    feature, and the skill says so in the paragraph under the table. Read the case
                    list before reading its length.
Last run:           2026-08-30 · PASS · arm B 42 cases / 388 lines vs arm A 58 / 497 — **−28% cases,
                    −22% lines, detection unchanged at 8/8** — single run per arm, stand-in vehicle
                    (fresh generic subagent + working-tree text; grades the TEXT, not runtime pins).
                    The first wording FAILED at 70 cases and was corrected inside the same run. A
                    second fixture with no cross-product returned NULL and is recorded as a fixture
                    defect rather than a finding. Detection is measured against eight spec-derived
                    faults only; faults outside that set are unmeasured. Full record:
                    `.ai/eval-runs/2026-08-30-test-volume-vs-detection/VERDICT.md`.
