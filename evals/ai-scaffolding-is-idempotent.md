# Eval: `.ai/` scaffolding never overwrites an existing artifact

Skill under test:   `sailes-bootstrap` (Step 3) / `skeleton.md` / `repo-done-checklist.md`
Files:              skills/sailes-bootstrap/SKILL.md, skills/sailes-bootstrap/skeleton.md, skills/sailes-bootstrap/repo-done-checklist.md
Setup:              Give a fresh subagent the bootstrap skill and a repo that ALREADY has a
                    non-empty `.ai/lessons.md` (3 real lessons) and its own `.ai/specs/`
                    naming convention. Ask it to complete the `.ai/` structure.
Expected (binary):  After the run, the pre-existing `lessons.md` content is byte-identical
                    (diff → empty), only MISSING artifacts were added, and additions follow
                    the repo's existing naming convention.
Failure looks like: The agent regenerates `.ai/` wholesale, clobbering lessons/specs — losing
                    institutional memory to make the structure "match the template".
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent, on a
                    fixture repo carrying three real lessons and its own `SPEC-NNN-slug` convention.
                    The pre-existing `.ai/` content is byte-identical after the run — verified by
                    the agent with SHA-256 before and after, and independently afterwards by the
                    lead (three lessons present, no boilerplate introduced). Nine files and two
                    directories added, all additive, tuned to the repo's own recorded lessons rather
                    than generic filler; the generated spec-writing skill codifies *this repo's*
                    naming convention, not the framework default.
                    Two refusals worth keeping. It did not `git mv` the implemented spec, because
                    this repo tracks state in a `Status:` line and the repo's existing convention
                    outranks the framework default — the conflict is documented in three places the
                    next agent will hit rather than resolved unilaterally. And it did not fabricate
                    ADR-001: the stack is not derivable here, and a plausible ADR would satisfy the
                    checklist by lying about production.
