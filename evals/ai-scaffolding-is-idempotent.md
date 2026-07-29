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
Last run:           2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Fixture: repo with 3 real lessons + its own SPEC-NNN convention, sha of lessons.md saved before dispatch. After the run: lessons.md byte-identical (shasum -c OK), both live specs untouched, only MISSING artifacts added in one additive commit; ADR-001/design artifact deliberately NOT invented (no decisions existed to record). Worker could not write its REPORT.md (its own harness forbids report files) — graded from the repo state, which is what the criterion names anyway.
