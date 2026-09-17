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
Last run:           2026-09-17 (at 287be78) · **PASS** · stand-in (general-purpose sonnet, working-tree text), grader haiku. Record: `.ai/eval-runs/2026-09-17-p6-evals/VERDICT.md`
Prior run:           2026-09-13 (at 6995c93) · **PASS** · stand-in (Opus). (A) `be-dev` and `checker` to
                    `opus` on tenancy/data-model/omission, each with a run-log line; (B) all defaults,
                    Opus rejected with "120 files is a lot of work but no judgment". Record:
                    `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine at `d6e6e01`
                    unless noted; up to `6995c93` doctrine changed only in two sub-teams sentences
                    (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml` (`6995c93`,
                    G28), checked by `git diff`, so the pin is a recorded judgment (G26), not a re-run.

Prior run:           2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Tenancy phase: be-dev and checker escalated to Opus on the doctrine's own named triggers (tenancy surface; the nine-access-paths worked example), explorer model-bumped for recon completeness, each with a written reason; tester/qa/docs-author logged as considered-and-rejected. 120-component mechanical phase: zero escalations, zero downgrades, plus a Haiku grader for the literal binary Done-when — the cheap-grader split used exactly where licensed. Opposite routing on the same axis, as the title demands.
