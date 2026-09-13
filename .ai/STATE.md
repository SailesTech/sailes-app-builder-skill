# STATE.md — session memory for the sailes-app-builder framework repo

Last-commit: d2303e8

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
- 2026-09-13 night, third session (**resume here**): **1.34.0 P5 — gate decided, closure in progress** on
  `feat/1.34.0-quality-gates` (HEAD `d2303e8`). Nothing pushed; `main` untouched (F5). Events are in the run log;
  P5.3 evidence is in `.ai/eval-runs/2026-09-13-implementer-report-as-message/` (`VERDICT.md`, `DESIGN.md`,
  `ledger.md`, `checker/FINDINGS.md`).
  - **Done in P5:**
    - P5.1–P5.2 merged (`fd4c72d`). `be-dev`/`fe-dev` report as a message: fixed fields, at most 40 lines.
      The narrative goes in the commit and the declaration in `.claude/status/`. The report file from the
      first change is only for `checker`/`qa`/`tester`. checker: APPROVE.
    - P5.3 A/B ran per G4/G5: 3 full runs and 1 interrupted per arm, stand-ins on Sonnet.
      - Empty returns: A 0/3, B 0/3. Unrecoverable interrupted runs: A 1/1, B 1/1. Both lacked the
        verification state.
      - The release condition does not block, but it is a tie on a small sample.
      - Arm B checkpointed less: B2 and B3 had 0 WIP commits, and B4 had no commit at the stop.
      - The checker metric is dominated by reviewer variance. There was a checker v1 instrument defect
        (the brief read the later spec), corrected, and v1 runs are not graded.
    - G8 (`d2303e8`): `checker.md` "You never" no longer contradicts the named read-only exception. Every
      run, the real P4 and every v2 checker had missed it.
    - G9: patches `returns/A4-uncommitted.patch` and `B4-uncommitted.patch` saved (still untracked, commit
      them at closure). 10 A/B and old worktrees removed; the 8 A/B branches stay.
  - **In flight when written:**
    - `checker` on G8 (`fd4c72d..d2303e8`).
    - `be-dev` on G6+G7, status `.claude/status/be-dev-P5-G6G7.md`, base `d2303e8`:
      - G6: a WIP commit after each step, its body naming the verification commands run so far;
      - G7: parity concepts (a) message ≤40 lines, (b) file only for gate roles on `team-lead`,
        (c) the G6 rule.
  - **Remaining for P5, in order:**
    1. Checker on G6/G7.
    2. One interrupted pair with the rule: A5 on the old doctrine (brief built,
       `scratchpad/p5/brief-A5.md`), B5 on the G6 role text. `TaskStop` after 3 P4-listed files via
       `instruments/stop-watch.sh`; grade with `recover-run.sh` against the criteria frozen in `DESIGN.md`.
    3. Record the pair in `VERDICT.md`.
    4. P5 `Done-when` (brief-closure, parity, `npm test`).
    5. Spec `Status:` with evidence, closure docs commit, then the human's handoff choice.
  - **If the session dies mid-pair:** the A/B worktree paths are `.claude/worktrees/agent-<agentId>`; the
    run → agent mapping goes in `ledger.md` before `stop-watch` is armed.
- **Owed, carried forward from the rotated entries** (verbatim sources in `.ai/archive/STATE-archive.md`):
  - **P6 CHANGELOG must say:**
    - P2 replaces 1.33.0's per-worker full-suite rule, and the client `AGENTS.md` template's Verification
      and Key Commands changed;
    - P3 adds lanes, the Codex `qa` screenshot fallback becomes ENV-DEFECT, and `checker.toml` gains the
      ID-coverage rule;
    - P4 adds `Known-red:`, red by name against the base, and `checker`'s named read-only exception;
    - P5 makes the implementer report a message, keeps the file for gate roles, adds the G6 WIP rule
      (if it lands) and the G8 fix.
  - **`CUTOFF`** in `tools/contract-probe-check.js` holds the placeholder `2026-09-14`. Set it to the day of
    the merge to `main` (P6).
  - **F5:** merge to `main` only after the 1.33.x token comparison against
    `.ai/eval-runs/2026-09-12-token-baseline/`, after two days of client work on `partner-portal-v3` at 1.33.1.
  - **From 1.33.0:** the archify 2.17 re-layout of four diagrams (backlog), which unblocks the docs receipt.
  - **Lesson candidates:**
    - checker graded coverage by ID and missed a dropped qualifier (P1, CP17);
    - checker verdicts vary widely across runs of the same diff and share blind spots (P5 A/B).

    `lessons.md` is near 40 KB and needs rotating first.
  - **Worktrees are cut from `main`:** every brief orders `git merge --ff-only feat/1.34.0-quality-gates`.
  - Not mine, untouched: the untracked `.ai/specs/2026-09-01-codex-marketplace-auto-update.md` and
    `package-lock.json`.
