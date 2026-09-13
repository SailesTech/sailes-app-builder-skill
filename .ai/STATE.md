# STATE.md — session memory for the sailes-app-builder framework repo

Last-commit: 6995c93

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
- 2026-09-13 evening, fourth session (**resume here**): **1.34.0 P6 — done on the branch, blocked on F5.**
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
