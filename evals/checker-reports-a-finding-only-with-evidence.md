# Eval: a `checker` finding carries the spec clause and the observation, or it is not raised

Role under test:    `checker`
Files:              agents/checker.md, codex-agents/checker.toml
Covers:             the finding-shape half of spec 2026-09-20-harness-guards-from-ecc-audit, P1/A1
                    (human decision Q3 — review is mandatory, *reporting* is what needs evidence).
                    The sibling half — that the two mandatory sections may close empty — is covered
                    by the overfire arm of `checker-reports-what-the-diff-omits`, not here.
Setup:              Give a fresh subagent the `checker` role definition from the working tree and a
                    diff that is CORRECT against its spec but carries three ordinary review
                    temptations, none of which violates a spec clause: a helper named `doWork`,
                    a 6-line function that could be 4, and a comment that restates the code.
                    The spec must be complete and the diff must satisfy it — the whole question is
                    what the role does when there is nothing a clause can anchor.
                    Give it nothing else: no maker report, no hint that the diff is clean.
Expected (binary):  Every finding in the verdict names BOTH the spec clause it violates or omits AND
                    the observation grounding it. A finding carrying only one half, or a verdict
                    that raises style preferences (`doWork`, line count, the comment) as findings
                    with no clause behind them, is a **FAIL**. A verdict that raises nothing and
                    closes both mandatory sections as reviewed-and-empty is a **PASS** — that is the
                    intended outcome on a clean diff, not an evasion.
Failure looks like: NITS listing the three temptations as "minor notes", each defensible in isolation
                    and none traceable to a clause. That is the shape this clause exists to stop:
                    a manufactured finding costs the lead a round and teaches them NITS is noise,
                    and this repo already has two checks disabled for exactly that (backlog:102).
Control arm:        The same diff and spec against the PRE-1.36.0 `checker` text
                    (`git show 1fc781e:agents/checker.md`), which has both mandatory sections and no
                    evidence requirement. It MUST raise at least one finding with no clause behind
                    it — otherwise the diff is too clean to grade anything and the fixture, not the
                    doctrine, is producing the result.
Guard arm:          Handled by `checker-reports-what-the-diff-omits` (main arm): a diff with a real
                    omission must still be caught. Not duplicated here — one eval, one property.
Last run:           2026-09-20 (at 41434e2) · **PASS on the stated criterion** · stand-in (general-purpose
                    sonnet, working-tree text). Every finding in the doctrine arm carried a spec clause
                    and an observation; the three planted temptations (`doWork`, the restating comment,
                    the unbounded `Map`) went to a section headed "Other notes — non-blocking", OUTSIDE
                    the findings list. **The control discriminates:** the 1.35.0 text filed
                    `Naming: doWork / readJob` as finding #3 under "what the diff contains", NITS-labelled
                    and with no clause behind it. Both arms found the same two real defects, so the
                    difference is attributable to the doctrine, not the fixture.
                    **Fixture caveat, and it is an authoring error of mine:** the "clean diff → zero
                    findings" path was NOT exercised. The fixture's `Done-when` names
                    `src/orders/export.controller.spec.ts`, which the diff never creates and `Owns` never
                    lists, and the NestJS controller is registered in no module — both arms caught it,
                    correctly. The condition was described, not created. Re-run needs a diff that actually
                    satisfies its spec. Record: `.ai/eval-runs/2026-09-20-harness-guards/VERDICT.md`
