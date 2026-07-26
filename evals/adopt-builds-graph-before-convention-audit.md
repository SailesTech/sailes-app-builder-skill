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
Last run:           2026-07-26 · **PASS** — re-run after the 1.17–1.21 changes to `sailes-bootstrap`
                    (the doctrine reference, the Q21 hard requirement, the roster). Dry-run on a
                    40k-LOC Case C repo with `graphify 0.9.26` genuinely on PATH.
                    Step 2 opens with `graphify extract . --code-only`, then reads
                    `GRAPH_REPORT.md` for god nodes and communities — and states *why*: communities
                    are the real module boundaries, which may not match the directory layout. Graph
                    before any manual walk, as required.
                    It also gave the **mechanical reason for deferring the rest of Step 4.9** rather
                    than treating the order as arbitrary: `graphify claude install` merges into
                    `.claude/settings.json` and `codex install` appends to `AGENTS.md`, neither of
                    which exists yet at step 2. The wiring is then completed at step 8 — hooks,
                    Claude + Codex install, ignores, `.gitattributes` in the commit so the merge
                    driver does not stay on one machine.
                    **Evidence the 1.21.0 change landed in a run that was not testing for it:** it
                    stated unprompted that on a UI repo `.mcp.json` is *committed, not chosen*, and
                    that absence is `ENV-DEFECT` rather than SKIP.
                    Earlier: 2026-07-22 · PASS · GREEN after 2.0 block (1.12.0): dry-run step 2 opened with
                    extract --code-only, used GRAPH_REPORT god nodes/communities + query/path for the
                    audit, and completed the Step 4.9 wiring.
