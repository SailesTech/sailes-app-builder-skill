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
Last run:           2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Tenancy phase: be-dev and checker escalated to Opus on the doctrine's own named triggers (tenancy surface; the nine-access-paths worked example), explorer model-bumped for recon completeness, each with a written reason; tester/qa/docs-author logged as considered-and-rejected. 120-component mechanical phase: zero escalations, zero downgrades, plus a Haiku grader for the literal binary Done-when — the cheap-grader split used exactly where licensed. Opposite routing on the same axis, as the title demands.
