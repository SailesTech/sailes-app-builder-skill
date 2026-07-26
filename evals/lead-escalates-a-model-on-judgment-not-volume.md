# Eval: the lead escalates a worker's model on judgment, not on volume — and logs the reason

Skill under test:   `agents/team-lead.md` (Model routing) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (Model routing)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md
Setup:              Give a fresh subagent the `team-lead` role definition and two approved phases
                    from the same spec, asked about together, with no hint about what is graded:
                    (A) "Faza 3: wprowadzić `organizationId` do 4 tabel i wszystkich zapytań —
                    izolacja tenantów, plus migracja danych istniejących klientów." Small diff,
                    one decision that is wrong-in-one-direction-only.
                    (B) "Faza 4: przenieść 120 komponentów z importów względnych na aliasy `@/` —
                    zmiana mechaniczna, lint wymusza kształt." Large diff, no decision in it.
                    Ask which model each worker runs on and why.
Expected (binary):  (A) escalated to `claude-opus-5` (or the Opus tier named explicitly) with the
                    reason being the tenancy/data-model surface — and the answer says the reason
                    goes in the run log. (B) NOT escalated: stays on the `be-dev`/`fe-dev` default
                    `claude-sonnet-5`, with size named explicitly as an insufficient reason.
                    A FAIL is: escalating (B) because it is large; leaving (A) on the default; or
                    escalating (A) correctly while treating the log entry as optional.
Failure looks like: The pre-1.16.0 baseline had no routing rule at all — the model was welded into
                    each role file with no override path, so the honest baseline answer is "both
                    run on sonnet because that is what `be-dev` says", and the expensive tier was
                    unreachable for exactly the task that needed it. The new failure this eval
                    guards is the opposite one: a lead that reads "you may override" as "override
                    when the task looks hard", where "looks hard" collapses into "is big".
Last run:           2026-07-26 · **PASS** — single run, fresh subagent, 1.16.0 role files.
                    Escalated (A) to `claude-opus-5` naming three triggers at once (tenancy
                    boundary, data-model change, migration parity) and stated that the small diff
                    is *the point*, not a counter-argument. Held (B) on the `claude-sonnet-5`
                    default with size named explicitly as an insufficient reason, answering volume
                    with 2-3 file-disjoint arms. Treated the run-log reason as mandatory.
                    Three things it did beyond the assertion, all worth keeping: a deliberate
                    **downgrade** (Haiku grader for the binary `Done-when`); an escalation of
                    `checker` itself, reasoning that on a tenancy diff the defect is what the diff
                    *omits*, so grading needs the whole access-path map rather than the patch; and
                    the rule that the log must record **non**-overrides too, because "logging only
                    the deviations would leave the volume-misread invisible". Its own formulation
                    of why: "the log has to be able to say the override was wrong, or it is not a
                    record, it is a receipt."
