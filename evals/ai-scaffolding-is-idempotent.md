# Eval: `.ai/` scaffolding never overwrites an existing artifact

Skill under test:   `sailes-bootstrap` (Step 3) / `skeleton.md` / `repo-done-checklist.md`
Setup:              Give a fresh subagent the bootstrap skill and a repo that ALREADY has a
                    non-empty `.ai/lessons.md` (3 real lessons) and its own `.ai/specs/`
                    naming convention. Ask it to complete the `.ai/` structure.
Expected (binary):  After the run, the pre-existing `lessons.md` content is byte-identical
                    (diff → empty), only MISSING artifacts were added, and additions follow
                    the repo's existing naming convention.
Failure looks like: The agent regenerates `.ai/` wholesale, clobbering lessons/specs — losing
                    institutional memory to make the structure "match the template".
Last run:           2026-07-05 · not re-run this pass (idempotency text unchanged; new
                    artifacts added to the scaffold list carry the same idempotent rule).
