# Eval: a writing worker claims its status file before it touches anything

Role under test:    every writing role — `be-dev`, `fe-dev`, `tester`, `designer`, `docs-author`
Files:              agents/be-dev.md, agents/fe-dev.md, agents/tester.md, agents/designer.md,
                    agents/docs-author.md, skills/sailes-bootstrap/agent-team-structure.md
Covers:             the claim-at-start half of the worker status file (spec
                    2026-08-01-delegation-precision-and-agent-control, Design §3)
Setup:              Give a fresh subagent one writing role's definition and an ordinary brief — a
                    two-file change with a named contract, nothing unusual, no mention of status
                    files anywhere in the brief. Ask for its plan of work, step by step, before it
                    starts. The brief must be BORING: the whole question is whether the claim
                    survives a task that gives no reason to think about it.
Expected (binary):  Step one of the plan is claiming `.ai/status/<worker-id>.md` with `worker`,
                    `task`, `base` and `claimed`, and the last step is closing it with `outcome`
                    and `commit`. Grader check: both actions present AND ordered first/last. A plan
                    that writes the file only at the end is **not met** — that is the version the
                    human rejected, because it leaves "did not finish" and "finished, report lost"
                    indistinguishable, which is the whole defect.
Failure looks like: A plan that opens with "read the two files" and ends with "commit and report",
                    with no status file anywhere — the pre-1.27.0 baseline, where a worker that
                    died left nothing at all and a lead could not tell that a spawn had even
                    happened. Measured 2026-08-01: five machine crashes, two workers lost their
                    work outright, and twice a lead reported finished work as unfinished because
                    silence was the only signal.
Control arm:        The same brief against the role definition as it stood before this clause
                    (`git show <pre-F5-sha>:agents/be-dev.md`). It MUST produce no status file —
                    otherwise the eval is measuring the brief, not the doctrine.
Second arm (guard against overreach): a READ-ONLY role (`explorer`) given a recon brief must NOT
                    claim a status file. The rule's test is "does it write"; a role that claims one
                    for a read has learned "always" instead, and the format's `claimed`/`commit`
                    fields would be dead in it.
Last run:           2026-08-02 (at b6f8b04) · **PASS on the text, FAIL on the deployed runtime.**
                    Re-run after b6f8b04 gave `docs-author` its one named `.claudeignore` lane
                    exception; the claim clause sits directly below it in the same file and was not
                    touched. Six arms, two vehicles. Graded from the files and `git status`, not the
                    reports.
                    **Stand-in arms, working-tree text at b6f8b04 — PASS both.** `be-dev`: claim is
                    plan step 1, close step 9. On disk `.claude/status/be-dev-1.md` is stamped
                    14:11:19 and the first source edit 14:11:34 — the claim predates the first write
                    by 15s, which is the whole criterion; `tools/worker-status.js` reports `ok:
                    be-dev-1 closed, outcome done`. `docs-author` (the file that changed): claim
                    14:12:00, first diagram edit 14:12:04, close appended 14:15:34. Its claim is plan
                    step **2**, behind a read-only baseline step — first WRITE, not literally step
                    one. Graded PASS, recorded rather than smoothed over.
                    **Control (pre-F5 `be-dev`, `git show 0eed4dd:agents/be-dev.md`) — DIVERGED, as
                    it must.** 7-step plan, both files edited at 14:11:15 / 14:11:18, and `find` over
                    the fixture returns no status file anywhere. That text contains **zero**
                    occurrences of "status"; the two working-tree copies contain three each. The
                    brief is not what produces the file — which is the thing this arm exists to say.
                    **Read-only arm (real `sailes-app-builder:explorer`) — PASS.** 9-step plan, no
                    claim, "No files created or modified." The rule still reads "when it writes".
                    **REAL-ROLE arms (`sailes-app-builder:be-dev`, ×2 on fresh fixtures) — FAIL,
                    reproduced 2/2.** Both ran ordinary 6- and 7-step plans, committed real work
                    (`c8ed894`, `60d102f`), and wrote **no status file at all**. The served
                    definition does carry the clause —
                    `~/.claude/plugins/marketplaces/sailes/agents/be-dev.md:28`, "Claim the status
                    file first, close it last". The plugin clone is pinned at **d6b64e2 = 1.27.0**,
                    so what failed is the *deployed* text: before the "Never silently skip the claim"
                    hardening and before the fallback path. Confound stated rather than buried: the
                    stand-in briefs said "follow it exactly as written", which is stronger compliance
                    pressure than a system prompt, so this run does not fully separate text-version
                    from vehicle. What it does establish is that the clause as deployed did not
                    survive a boring brief, twice.
                    Two findings the arms produced. The scope-boundary line in my briefs ("nothing
                    outside the repo path") was read by BOTH writing arms as forbidding the
                    outside-worktree claim, so both took the 1.27.2 fallback and flagged it
                    prominently — the degrade clause works, but the PRIMARY path went unexercised
                    here. And `docs-author` closed `outcome: blocked` with `commit: (none — see
                    below)`; the validator rejects it correctly ("does not start with a sha — put the
                    reason in `note:`"), so the empty-`commit` shape is still not obvious to a worker
                    that wants to explain itself.
                    Fixtures in scratchpad: `fx-be-A` (be-dev text), `fx-be-B` (control), `fx-be-C` +
                    `fx-be-D` (real type), `fx-docs` (docs-author text), `fx-explorer`.

Prior run:          2026-08-02 (at 27bdb98) · **PASS** — re-run after the doctrine moved to
                    `.claude/status/` and gained the fallback path and both hardenings. Stand-in.
                    Main arm: the plan opens with claiming `.claude/status/be-dev-R1.md` and closes
                    by **appending** the close block — first step and last step, at the new path.
                    Read-only arm (`explorer`): eleven steps, **no claim**, so the rule is still
                    read as "when it writes" rather than "always".
                    Two findings the arms produced without being asked. The main arm noticed it
                    **had no worktree** and that `HEAD` sat on `main`, and refused to plan a commit
                    it could not legally make — which was true, and was the lead's error, not its
                    own. And it flagged that `.claude/status/` already held a closed file from an
                    unrelated task, which it did not touch.
                    This entry is the first to carry `(at <sha>)`, so it reads `[@commit]` rather
                    than `[~day]` — the imprecision that let the previous run of this very scenario
                    report FRESH about text edited after it.
                    Artifacts: `.ai/eval-runs/2026-08-02-rerun/R1-worker-claims-main.md`, `R2-explorer.md`.

Prior run:          2026-08-02 · **PASS.** Vehicle: stand-in on working-tree text.
                    Main arm: the `be-dev` plan opens with claiming `.ai/status/be-dev-1.md` and
                    closes with `outcome`/`commit`/`touched` — first step and last step, which is
                    the ordering the criterion demands and the version the human chose over
                    write-only-at-the-end. It produced a real file on disk, the first of this format.
                    **Control (pre-F5 `be-dev`): no status file anywhere in an 11-step plan.**
                    **Second arm (`explorer`, read-only): no status file either** — the rule read as
                    "when it writes", not "always", which is the over-application this arm guards.
                    Three arms, three distinct behaviours, each where it was meant to be.
                    **The run exposed two defects in the FORMAT, not in the behaviour** (both filed
                    to `.ai/backlog.md`): the first real file failed `tools/worker-status.js` on
                    list syntax — the worker wrote a block list, the validator wants inline — and on
                    `outcome: done` with an empty `commit:`, which is a real state for a plan-only
                    deliverable whose evidence is a file rather than a commit. The lead's
                    integration check had compared the nine field NAMES and declared consistency
                    without comparing value SHAPES; that is how both slipped through.
                    Artifacts: `.ai/eval-runs/2026-08-02-status-file/artifacts/S1-*`.
