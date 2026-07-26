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
Last run:           2026-07-26 · **PASS** — first run possible at all: this eval needs `graphify`
                    on PATH, which was installed the same day. Run for real on a fresh one-commit
                    repo, 74 tool calls, ~14 minutes — not a plan, actual work.
                    The map is not merely present, it **answers**: 153 nodes / 159 edges committed,
                    `graphify query "where are quote totals calculated"` returned
                    `totalsFor() [apps/web/src/lib/pricing.ts L9]` with cross-package edges, and
                    `graphify path` resolved a call in one hop. The post-commit hook fired on every
                    commit, and the Step 5 portability `sed` proved load-bearing — both installers
                    had written an absolute `C:/Users/…/graphify.EXE` into committed files.
                    Reported not-green plainly rather than rounding up: ONE-COMMAND BOOT and
                    FIXTURE USERS both fail (no deps installed, no seed, so `qa` cannot log in),
                    and four ADR decisions left explicitly open instead of silently defaulted.
Findings fixed:     The run found four real defects in shipped skills, all fixed the same day and
                    none of them findable by reading:
                    (1) the drift check's class `pnpm [a-z:-]+` drops digits, so `pnpm test:e2e`
                    truncated to `test:e` and reported DRIFT on a script that exists — now
                    `[a-z0-9:-]` with pnpm builtins excluded, and covered by a real test that
                    extracts the pattern from the document rather than copying it;
                    (2) `graphify-setup.md` omitted `.gitattributes` from its commit list, so the
                    union-merge driver it registers never reached anyone else — the exact failure
                    the driver exists to prevent;
                    (3) `graphify update .` writes a dated snapshot the documented ignores did not
                    cover, committing a full copy of the map per update day;
                    (4) **a presence-only checklist went fully green on a repo that cannot boot.**
                    The Environment block catches it but sits outside the scripted set, so the
                    checklist now says out loud that presence and boot are two separate results
                    and must be reported as two sentences.
