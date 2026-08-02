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
Last run:           2026-08-02 (at b6f8b04) · **PASS** · stand-in vehicle (a fresh general-purpose
                    subagent pointed at the WORKING-TREE skill files; grades the TEXT, not the
                    runtime model pin or the tool allow-list). The real-role vehicle was rejected on
                    evidence, not preference: `~/.claude/plugins/marketplaces/sailes` sits at
                    d6b64e2 while local `main` is unpushed at b6f8b04, so the deployed copy still
                    carries the pre-fix `sed -i -E` — a plugin run would have graded the defect
                    instead of the fix. Executed for real, not planned. Fixture: a generated
                    39,376-LOC / 236-file Express 4 + TypeScript + raw-SQL-via-`pg` + Jest repo in
                    the scratchpad, one snapshot commit, clean tree, no AGENTS.md/CLAUDE.md/`.ai/`;
                    pre-flight on a throwaway copy confirmed graphify produces a real report on it
                    (god nodes `many()` 241 edges, `audit()` 122, `logger` 104, `query()` 55).
                    Decisive evidence, all read off disk by the grader rather than from the report:
                    the FIRST thing the run wrote into the repo is the map — `graphify-out/graph.json`
                    and `GRAPH_REPORT.md` at 14:13:58, thirteen minutes before `AGENTS.md` (14:26:55)
                    and twenty-eight before the Step-4.9 commit; the run ledger's
                    `Step 2.0 | running: graphify extract . --code-only` at 14:13:36 precedes its
                    first source read (`Step 2 | reading src/lib/*` at 14:14:13), and the mtimes
                    corroborate the ledger rather than resting on it. The audit that came out is
                    god-node-shaped: AGENTS.md's Critical Rules are `routes → service → repo`,
                    `accountId, actorId` as the first two arguments, and "every mutation writes
                    `audit()` and `publish()`" — the #2 and #10 nodes of the report. Step 4.9 ran in
                    full and is committed: post-commit + post-checkout hooks, `.claude/settings.json`
                    + `.codex/hooks.json`, the `.gitattributes` union-merge driver,
                    `.gitignore`/`.claudeignore` entries, map tracked.
                    **Today's F1 fix (`sed -i -E` → temp-file + `mv` + verification) is GREEN and
                    load-bearing**: the grader's own smoke repo confirms `graphify claude install` /
                    `codex install` really do write `"C:/Users/karol/.local/bin/graphify.EXE
                    hook-guard search"` into both files, and in the adopted repo the committed files
                    read `"graphify hook-guard search"` with the procedure's own verification grep
                    (`"[^"]*/graphify`) matching in neither. Caveat that keeps this honest: this
                    machine runs GNU sed 4.9, so the run proves the new form is correct and
                    non-regressive — it does **not** exercise the BSD/macOS path the fix exists for.
                    Three instrument defects found, reported not fixed: (1) `graphify extract .
                    --code-only` does NOT write `GRAPH_REPORT.md` on graphify 0.9.26 — it prints
                    "next: run `graphify cluster-only …`" — so step 2.0's "Read
                    `graphify-out/GRAPH_REPORT.md`" names a file the step it belongs to never
                    creates; the subject worked around it by running `cluster-only` itself, and the
                    grader reproduced the gap on a clean copy. (2)
                    `hooks-template/guard-protected-paths.sh` lets a repo-RELATIVE
                    `migrations/003_deals.sql` through (exit 0) while the absolute form blocks
                    (exit 2) — grader re-drove both; the pattern requires a leading separator.
                    (3) graphify 0.9.26 drops non-code files with a cache tmp-file ENOENT under
                    concurrent runs — the subject got 3557 nodes / 5058 edges, the grader's
                    identical solo probe 3623 / 5121. Not covered: the repo's own
                    `npm test`/`typecheck`/`lint` never ran (no `node_modules`, install out of
                    scope), so "adoption broke nothing" rests on an empty diff over `src/`,
                    `migrations/`, `tests/`, `scripts/` and CI — docs-only proven, still-green not.
Prior run:          2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins); re-run after feat/archify-docs edits. Planning dry-run: step 2 opens with graphify extract + GRAPH_REPORT god-nodes/communities BEFORE any manual walk; full Step-4.9 wiring correctly deferred to its own later step; graphify 0.9.23 + archify 2.12 verified present on the machine so the real branch (not SKIP) was planned. The new Step 4.10 docs-set appeared in the plan unprompted — the 1.22.0 text landing where nothing tested it.
