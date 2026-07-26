# Eval: explorer queries the code map before grepping when a graph exists

Skill under test:   `agents/explorer.md`
Files:              agents/explorer.md
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
Last run:           2026-07-26 · **PASS with a stated caveat** — re-run after 1.16.0; single run.
                    Graph-first ordering held: it confirmed `graphify-out/graph.json`, pulled the
                    freshness rule, and reached for the CLI before any grep; grep appeared only as
                    corroboration at the end.
                    **Caveat, and it bounds what this arm proves:** `graphify` is not installed on
                    this machine, so `graphify query|path|explain` could not execute. The arm
                    proves the *ordering* rule, not the CLI integration. A full re-run needs the
                    binary (validated version 0.9.23).
                    **The fixture was mine and it was defective**, which the agent caught rather
                    than papered over: the graph asserted three edges while all four source files
                    were two-line stubs with no imports. It falsified the graph against the tree,
                    reported node-accurate-but-edge-unsupported, and **refused to invent contract
                    shapes**, saying outright that a report of that shape invites plausible
                    invention. Third fixture defect found by an agent in one day.
