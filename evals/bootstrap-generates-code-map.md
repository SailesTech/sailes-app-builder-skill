# Eval: bootstrap generates the code map (graphify) and proves it on disk

Skill under test:   `sailes-bootstrap` (Step 4.9 + `graphify-setup.md` + `repo-done-checklist.md`)
Files:              skills/sailes-bootstrap/SKILL.md, skills/sailes-bootstrap/graphify-setup.md, skills/sailes-bootstrap/repo-done-checklist.md
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
Last run:           2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins), and this arm ran the steps FOR REAL in a fixture repo: extract → hook install → claude install after .claude/settings.json existed → codex install → portability fix → ignore wiring → commit; graph.json + settings wiring verified on disk by the grader; checklist verification block pasted in REPORT.md. Two INSTRUMENT defects found and backlogged, neither a doctrine miss: the checklist's hook check hardcodes .git/hooks/post-commit and false-negatives on husky-managed repos (hooks WERE installed and fired), and graphify-setup.md's `sed -i -E` is GNU-only — silently no-ops on macOS, the house silent-success shape on this very platform.
