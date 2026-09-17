# STATE.md — session memory for the sailes-app-builder framework repo

Last-commit: 5a1e08e

> Read at session start — it stays under 20 KB, so that is cheap; history lives verbatim in
> `.ai/archive/` and is grepped by area, never read whole. Write before walking away. Facts enter **Verified facts** only with
> evidence; hypotheses stay in **Open failures**.
>
> The `Last-commit:` line above is the convention 1.25.0 introduced for client repos, and this repo
> keeps it too — update it **together with** whatever you change below, or update neither. A file
> whose top and bottom disagree is worse than a stale one, because the reader cannot tell which half
> to believe, and the session hook makes everyone read the top first. Note the hook that compares it
> against `git HEAD` is `hooks-template/session-start.sh`, which ships to *client* repos; here the
> line is a discipline, not an enforced check.

## Verified facts
- Rotated on 2026-09-12 to `.ai/archive/STATE-archive.md` (spec 2026-09-12-token-cost-of-running, P1: this file stays
  under 20 KB). Grep the archive by area keyword before re-deriving a fact. New verified facts go
  here, and rotate out once the file nears the limit again.
- **This machine has no `graphify` and no chrome-devtools MCP** (`command -v graphify` → not found; `claude mcp list`
  shows no chrome-devtools; 2026-09-13). Evals needing either cannot create their condition here (G21, G22).
- **archify here is `2.17.0-dev.1`** (`package.json`, `skill-release.json`), which the floor check reads as "2.17".
- **The harness refuses some subagent `Write`s of report-like files** ("Subagents should return findings as text, not
  write report files"; seen on `findings.md`, `summary.md`, `report.md`, 2026-09-13). Other stand-ins wrote
  `qa-verdict.md`, `tester-report.md` and `verdict.md` without refusal. The trigger is not established (backlog).

- **Workflow tool facts (measured 2026-09-16, `.ai/eval-runs/2026-09-16-workflow-facts/VERDICT.md`):**
  `agent({agentType})` loads the role's frontmatter model; an explicit `model` alias overrides it; no `agentType` →
  session model (Opus). `effort` takes effect (high ≈ 2.7× output of low, n=2+2). Worktree base = default branch
  (`main`), not the lead's branch; worktree is cut from the repo of the lead's cwd at launch; `git reset --hard` is
  blocked non-deterministically by the auto-mode classifier, `git merge --ff-only <sha>` is not; a worktree agent
  cannot `git -C` or `Write` into the main checkout (Bash can); commits are visible in the shared `.git` at once.
  Role `maxTurns` is enforced (F1 stopped at exactly 140).
- **Gate placement (D8):** tester+checker once at the end beat per-phase on cost and time when implementation is
  correct — A $1.37/9.7 min, B $2.61/19.1 min, C $2.53/11.4 min (`.ai/eval-runs/2026-09-16-gate-placement/VERDICT-round1.md`).
  Detection value not measured (round 2 deferred by the owner).
- **Transcript cost must use the LAST `usage` per `message.id`**: the first streamed line carries partial
  `output_tokens`; the research parser that took it understated 4 workflows by ~17% ($34.32 vs $41.28).

## General rules
- Every framework change lands as: proposal spec (root `.ai/specs/`) → human answers Open
  Questions → edits with binary Done-when outputs pasted → evals updated → CHANGELOG entry →
  VERSION bump (all five stamps) → merge to `main`, which IS the deploy — the marketplace plugin
  auto-updates from it, and there is no post-merge install step.
- A measuring instrument gets a fixture for **both** directions: one that must be flagged, and one
  that must not. A defect-only fixture proves detection and says nothing about invention, and an
  instrument that flags correct work is worse than none — the gate gets argued with, then ignored.
- Editing a skill = re-run the `evals/` scenarios naming it; new protected behavior = eval first.
- Experiments that change global behavior stay on a branch until their eval returns a verdict.
  `main` is not a staging area.

## Open failures
- **One open decision in 1.14.0: does `designer` get browser tools?** It has no Bash today, so it
  cannot render its own spec before handoff; the integrity gate runs on whoever builds. Widening
  that role is a human call, left unchanged. See `.ai/specs/2026-07-25-browser-devtools-instrument.md`
  §5 — a three-line edit once answered.
- **Five silent failures in one day**, four of them fixtures: MSYS paths in a hook test; a typo
  that did not exist; a `git checkout -- <path>` that destroyed an uncommitted edit; a CRLF regex
  that no-op'd; backticks in a shell heredoc that ate half a STATE.md rewrite. Plus the
  condensed-context depth eval, which nearly became a conclusion. The pattern is one thing:
  **a step that reports success for a reason other than the one claimed.** Two mitigations are
  now in AGENTS.md (verify a scripted edit landed; `\r?\n` not `\n`); a third is simply to stop
  pushing prose through a shell — use the file-writing tools.
  **Sixth instance, 2026-07-25 (1.14.0):** a probe "fixture-verified" against a defect-only page.
  Every assertion in that claim was true and the instrument still failed every correct page. The
  mitigation is in General rules — both directions, or it is not a fixture.

- Closed entries rotated on 2026-09-12 to `.ai/archive/STATE-archive.md`.

## Lessons learned
- See `.ai/lessons.md` (framework-level lessons; project-level ones live in each client repo).

## Last session
- **2026-09-16 → 17 — spec 1.35.0 „Workflow jako silnik wykonania”, branch `feat/1.35.0-workflow-first`
  (pushed, nothing on `main`).** Resume from `.ai/runs/2026-09-16-workflow-first.md` § „Co zostało”.
  - Done: research (`.ai/eval-runs/2026-09-16-workflow-research/`, with a cost CORRECTION), spec approved with D1–D8 and
    Q1–Q6, pre-implement READY-WITH-FIXES, P0 measured, wave 1 (P1 token-report workflow layout + prefix price table,
    P2 ownership-check `--spec` with waves, P5a agentType guard hook) integrated with gate verdicts, A/B/C gate-placement
    experiment → D8.
  - 2026-09-17: wave 2 re-run and integrated; Q2′ hook (suggest, block only without agentType and model); P2 accepts F<n>;
    P6 done (stamps 1.35.0, CHANGELOG, backlog, docs-delta content); eval P4.7 PASS 3:0; 12 at-risk evals re-run — one real
    regression (Owns column) caught and fixed. **Released 2026-09-17: merged `--no-ff` to `main` (`5a1e08e`) and pushed**
    with the owner's yes; `npm test` exit 0 on `main`. Next: re-run eval P4.7 on the named `team-lead` role now that `main`
    serves the 1.35.0 text; spec B (diagnose/hosting from the Idealny Wzrok feedback).
  - Open next: wave 2 → P5b Human-STOP (hook false-positive rate) → eval P4.7 × 3 → P6 (qa full `npm test`, stamps
    1.35.0, CHANGELOG, docs-delta receipt, superseded spec to `archived/`, backlog, eval-status) → push to `main` only
    with the owner's yes. Then spec B (diagnose/hosting from the same feedback).
- **2026-09-13 late, same session — G29: the owner chose to merge 1.34.0 to `main` now, without F5**, "żeby wszyscy
  mogli pracować na tym i zbierać feedback". F5 and G15 are superseded:
  - the 1.33.x saving will be measured mixed with 1.34.0;
  - `CUTOFF` = `2026-09-13`;
  - CHANGELOG corrected.
  **Merged and pushed:** `origin/main` = `4ede48e` (from `fb69369`). `npm test` exit 0 and 0 `not ok` on the branch and
  on `main`; `eval-status` 49 fresh, 5 stale (G19, G21 ×3, G22). The run log's merge-day entry has the commits.
  **Resume from there**, not from the F5 plan below. Open next:
  - collect feedback from people working on 1.34.0;
  - upgrade `partner-portal-v3` from 1.32.0 straight to 1.34.0 (client-repo work, Upgrade mode);
  - when there are two days of client work on it, run the token comparison against the 09-12 baseline, knowing
    1.33 and 1.34 are mixed;
  - the backlog rows from the P6 sweep, first the harness refusing report-file writes, since it bears on P5's gate-role
    report file. What stays true: the spec is not moved to `implemented/` until its docs-delta receipt
  (blocked by archify 2.17 debt) has been shown to the human.
- 2026-09-13 evening, fourth session: **1.34.0 P6 — done on the branch, blocked on F5** (superseded by G29 above).
  `feat/1.34.0-quality-gates`, nothing pushed, `main` untouched. Evidence is in the spec's `Status:` line, events
  in the run log (§ P6), and every eval verdict in `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`, with fixture caveats
  in its `README.md`. Human decisions G14–G28 are in the spec.
  - **Done in P6:**
    - Eval sweep: 41 intersecting scenarios plus 7 stale outside, ~85 stand-in runs.
      - `eval-status` → 49 FRESH, 5 STALE. The STALE five are the human's exceptions: G19, G21 ×3, G22.
      - `Last run:` lines pinned `(at 6995c93)` with the G26 judgment note (runs read `d6e6e01`).
    - `docs-author` delta `d6e6e01`: CHANGED (architecture.json); receipt blocked by archify 2.17 debt.
    - Two doctrine fixes found by evals, both with checker APPROVE:
      - `a6dccd3` (G23): sub-teams "FILE deliverable" scoped to the P5 split;
      - `6995c93` (G28): a bridge measurement does not close the integrity ENV-DEFECT. Arm B re-run PASS.
    - Five stamps at 1.34.0 and the CHANGELOG 1.34.0 entry.
    - `npm test` → exit 0, 22 suites, 0 `not ok`.
  - **Not PASS, none attributed to a 1.34.0 change (all have backlog rows):**
    - `lead-verifies-status-against-worktree` arm 1 (the `fb69369` control blocks the same way);
    - `gate-refuses-to-close-a-spec-without-docs-delta` arm 2 (criterion predates the 07-29 STOP rule);
    - `diagnose-runs-live-case-before-audit` (b);
    - `inner-loop-promotes-what-caught-a-real-defect` INCONCLUSIVE (fixture defect).
  - **Next, in order:**
    1. **F5.** Upgrade `partner-portal-v3` to 1.33.x (client-repo work, currently stamped 1.32.0), let two days of
       client work run, then compare against `.ai/eval-runs/2026-09-12-token-baseline/` with `tools/token-report.js`
       and save the report under `.ai/eval-runs/`. That is the missing P6 `Done-when` item.
    2. On the merge day: set `CUTOFF` in `tools/contract-probe-check.js` to that date, re-run `npm test`, get the
       human's push approval, merge to `main` (the deploy), `git mv` the spec to `implemented/` with its evidence line.
       Setting `CUTOFF` makes `lead-probes-the-contract-before-dispatch` STALE (it lists the tool in `Files:`). The
       release commit already did the same to `answer-shape…` and `migrate…` through the `AGENTS.md` stamp; those two
       were re-pinned to `4265fc3` on the G26 judgment. Handle the CUTOFF change the same way or re-run that eval.
       Decide which before merging.
    3. If `main` moves before then, re-run `eval-status` against the files it touched before merging.
  - **Lead-side leftovers (scratchpad, not in the repo):** the `p6-evals/` fixture tree and the scripts
    `apply-last-run.js` and `last-run-notes.json`. The archify fixture-builder output is only in the scratchpad; the
    graded record in `.ai/eval-runs/` is what counts.
- **Owed, carried forward:**
  - **From 1.33.0:** the archify 2.17 re-layout of four diagrams (backlog), which unblocks the docs receipt.
  - **Lesson candidates:**
    - checker graded coverage by ID and missed a dropped qualifier (P1, CP17);
    - checker verdicts vary widely across runs of the same diff and share blind spots (P5 A/B);
    - a preserved eval fixture turned out to be the post-run state (P6, promotion) — the keep-list gap is in backlog.

    `lessons.md` is near 40 KB and needs rotating first.
  - **Worktrees are cut from `main`:** every brief orders `git merge --ff-only feat/1.34.0-quality-gates`.
  - Not mine, untouched: the untracked `.ai/specs/2026-09-01-codex-marketplace-auto-update.md` and
    `package-lock.json`.
