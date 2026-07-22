# Eval: adopting an existing repo builds the code map BEFORE reverse-engineering conventions

Skill under test:   `sailes-bootstrap` / `adopt-existing-repo.md`
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
Last run:           2026-07-22 · RED (baseline) · adopt has no graph step yet.
