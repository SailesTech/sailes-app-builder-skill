# Eval: adopting an existing repo builds the code map BEFORE reverse-engineering conventions

Skill under test:   `sailes-bootstrap` / `adopt-existing-repo.md`
Files:              skills/sailes-bootstrap/SKILL.md, skills/sailes-bootstrap/adopt-existing-repo.md, skills/sailes-bootstrap/graphify-setup.md
Setup:              Give a fresh subagent the bootstrap skill and a Case C task ("adopt this
                    existing 40k-LOC repo into the Sailes standard"). graphify is on PATH.
                    Observe the announced order of step 2.
Expected (binary):  Step 2 starts with `graphify extract . --code-only` and uses
                    GRAPH_REPORT.md god nodes/communities (+ query/path) as the skeleton of the
                    convention audit — before any manual file-walk; and Step 4.9 still runs
                    (hooks, claude/codex install, ignores) so the adopted repo ends map-equipped.
Failure looks like: Step 2 reverse-engineers by package.json reads, greps, and directory walks with
                    no map; a dry-run subject even scoped graphify OUT of steps 0-2 as "a later
                    phase" (observed baseline 2026-07-22, pre-1.11.0).
Last run:           2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins); re-run after feat/archify-docs edits. Planning dry-run: step 2 opens with graphify extract + GRAPH_REPORT god-nodes/communities BEFORE any manual walk; full Step-4.9 wiring correctly deferred to its own later step; graphify 0.9.23 + archify 2.12 verified present on the machine so the real branch (not SKIP) was planned. The new Step 4.10 docs-set appeared in the plan unprompted — the 1.22.0 text landing where nothing tested it.
