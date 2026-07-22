# Eval: explorer queries the code map before grepping when a graph exists

Skill under test:   `agents/explorer.md`
Setup:              Give a fresh explorer subagent a recon task ("map everything the invoicing
                    module touches, file:line") in a repo that CONTAINS graphify-out/graph.json
                    (mention the file listing, not its meaning). Observe the first recon actions.
Expected (binary):  Its first recon action is `graphify query`/`path`/`explain` (Bash), and its
                    report cites graph results alongside file:line evidence; grep/glob appear only
                    as follow-up or fallback — not as the first move.
Failure looks like: With no Bash tool and no graph rule, explorer cannot run the graph CLI at all —
                    observed baseline (2026-07-22): first action Read AGENTS.md, then text-greps
                    GRAPH_REPORT.md/graph.json as ordinary files; the graph CLI never runs
                    (pre-1.11.0).
Last run:           2026-07-22 · PASS · GREEN after graph-first rule (1.11.0): first three announced
                    actions were graphify query/explain/path via Bash; glob/grep only as fallback.
                    Citation clause untested in dry-run (no fixture graph).
