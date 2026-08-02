# Eval: a phase's Done-when covers that phase's own allowed-files list

Skill under test:   `sailes-spec` / `sailes-bootstrap/spec-writing-template.md`
Files:              skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md,
                    skills/sailes-bootstrap/agent-team-structure.md
Covers:             the spec's Done-when coverage clause · the worker brief's `Files:` line
Setup:              Give a fresh subagent the spec-writing skill and a brief whose surface is
                    deliberately WIDER than its obvious verification — e.g. "custom field
                    definitions: list them, create them, and expose a catalogue the form
                    renders from". Ask it to write Phasing & Steps, including each phase's
                    allowed-files list. Do not mention this eval's subject.
Expected (binary):  For every phase, each path on the allowed-files list is traceable to a
                    `Done-when` clause that forces it to exist — either stated inline, or the
                    phase explicitly marks a path as touched-but-not-produced with a reason.
                    Grader check: take each phase's file list, and for every path ask "which
                    Done-when clause fails if this file is never written?" A path with no
                    answer, and no stated reason, is a FAIL.
Failure looks like: A phase that may touch a route file, a handler and a schema, whose
                    `Done-when` runs the suite and greps one endpoint — so the write half of
                    the resource is on the list, is nobody's requirement, and ships absent
                    with every gate green. This is the recorded 2026-08-01 case: three such
                    gaps in one milestone, including its entire read surface, each one green
                    through `checker` because `checker` grades the diff against the phase's
                    scope and the phase's scope IS its `Done-when`.
Control arm:        Run the same brief against a spec-writing prompt with the coverage clause
                    removed. It MUST produce at least one uncovered path — otherwise the eval
                    is measuring the brief's narrowness, not the doctrine.
Last run:           2026-08-01 (second attempt, fixture v2) · **PASS.** Vehicle: stand-in.
                    Widening the brief from 7 mapped files to 15, across eight deliverables, was
                    what made the scenario able to measure anything — see the first attempt below.
                    **The discrimination, one phase, same milestone in both arms.** The catalog
                    phase's allowed-files list:
                      control — `field-catalog.ts`, `field-definition.ts`, `stage-requirement.ts`,
                                `contracts/field.ts`
                      doctrine — `field-catalog.ts` → D6.1, D6.2 · `contracts/field.ts` → D6.1
                    No `Done-when` clause of the control's fails if `field-definition.ts` and
                    `stage-requirement.ts` are never touched — the catalog response composes inside
                    the route. Two allowed, unforced paths: the exact shape that cost three gaps on
                    2026-08-01. The doctrine arm did not list them, having nothing to justify them
                    with, and every path it did list names its clause.
                    The control was not careless — it wrote its own coverage check. But that check
                    asserts all fifteen files are **claimed by a phase**, not that each is
                    **forced by a clause**. Claimed-not-forced is precisely the weaker test the
                    incident passed, and a competent control reaching for it unprompted is the
                    strongest argument in this scenario's file.
                    Artifacts: `.ai/eval-runs/2026-08-01-doctrine-1.26.0/artifacts-v2/A1`,`A2`.

Prior run:          2026-08-01 (fixture v1) · **INCONCLUSIVE.** Vehicle: stand-in (`general-purpose`
                    on working-tree files) — the TEXT, not the runtime.
                    The control produced **no uncovered path**: five phases, and in every one each
                    allowed file is forced by a `Done-when` clause. The scenario's own control
                    condition says this measures the brief's narrowness rather than the doctrine,
                    and it is right — the brief hands over an explicit seven-file map, so keeping
                    the two lists aligned is nearly free. The 2026-08-01 incident had seven phases
                    and a surface nobody walked end to end.
                    One difference IS in the artifacts and is worth separating from the outcome:
                    the doctrine arm emitted a per-phase **`File | Forced by` table**, five of
                    them, naming the clause behind every path. The control emitted none. Coverage
                    came out identical; **auditability did not** — one artifact lets a reader check
                    that the walk happened, the other requires trusting that it did. That is a real
                    product difference and this fixture does not measure whether it prevents
                    anything, so it is recorded as an observation, not a result.
                    Re-run needs: a brief with a wider surface than its file map, enough phases that
                    the walk is not free, and at least one path that is genuinely surplus.
                    Artifacts: `.ai/eval-runs/2026-08-01-doctrine-1.26.0/artifacts/A1`,`A2`.
