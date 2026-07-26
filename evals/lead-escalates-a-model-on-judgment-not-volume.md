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
Last run:           2026-07-26 (re-run, second of the day) · **PASS** — dispatched against the
                    edited doctrine after the alias/effort findings, so this grades the new text.
                    Escalated (A) with the literal parameter `"model": "opus"` — the tier alias,
                    naming that a full ID is rejected — for tenancy plus data model plus an
                    irreversible backfill. Held (B) by **omitting `model` entirely** so the pinned
                    `claude-sonnet-5 · high` stands, with 120 files named as volume and volume
                    named as the misread. Logged the rejected moves too, including keeping (B)'s
                    `checker` on Sonnet rather than dropping to Haiku, because the real risk there
                    is an alias resolving to a *different* module that still typechecks — which a
                    binary Done-when read cannot see.
                    It also refused to staff (A) as spawnable at all: four key decisions the spec
                    never settled (enforcement layer, backfill mapping, migration shape, legitimate
                    cross-tenant paths) go to the human first. And it declined to run the two phases
                    in parallel by default, noting the pipeline's contract-freeze rule does not
                    sequence them — reading the diagram literally would give the right order for
                    the wrong reason.
                    **Found by this run, and fixed the same day:** the Agent tool exposes no
                    `effort` parameter, so "override model/effort per task" was half false.
