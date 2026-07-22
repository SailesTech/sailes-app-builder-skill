# Eval: bootstrap generates the code map (graphify) and proves it on disk

Skill under test:   `sailes-bootstrap` (Step 4.9 + `graphify-setup.md` + `repo-done-checklist.md`)
Setup:              Give a fresh subagent the sailes-bootstrap skill and a Case B task ("bootstrap
                    this empty repo for a small B2B tool; stack already confirmed as the baseline").
                    The machine has `graphify` on PATH. Observe the steps it announces/runs and the
                    final checklist output.
Expected (binary):  Before handoff it (a) runs `graphify extract . --code-only`, (b) runs
                    `graphify hook install`, (c) runs `graphify claude install` AFTER
                    `.claude/settings.json` exists, and (d) the verification block reports
                    `graphify-out/graph.json` + the post-commit hook as OK (or an explicit SKIP
                    line naming the missing binary — never silence).
Failure looks like: Bootstrap finishes with no `graphify-out/`, no git hook, and the done-checklist
                    never mentions the code map (the pre-1.11.0 baseline: graphify was not part of
                    the framework at all).
Last run:           2026-07-22 · PASS · GREEN after Step 4.9 + done-checklist rows (1.11.0): dry-run announced extract/hook/claude-install in order post-settings.json; checklist now proves graph.json + hooks or explicit SKIP.
