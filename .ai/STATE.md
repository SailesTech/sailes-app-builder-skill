# STATE.md — session memory for the sailes-app-builder framework repo

Last-commit: 8a941b6

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
- 2026-09-13 night, third session (**resume here**): **1.34.0 P5 — CLOSED** on `feat/1.34.0-quality-gates`
  (P5 merge `fd4c72d`, G8 `d2303e8`, G6+G7 merge `8a941b6`, then the closure docs commit). Nothing pushed; `main`
  untouched (F5). Evidence is in the spec's `Status:` line, events in the run log, and the experiment in
  `.ai/eval-runs/2026-09-13-implementer-report-as-message/VERDICT.md` (including the G6-pair addendum).
  - **Shipped in P5:**
    - `be-dev`/`fe-dev` report as a message: fixed fields, at most 40 lines. The narrative goes in the commit and the
      declaration in `.claude/status/`. The report file from the first change stays only for `checker`/`qa`/`tester`.
    - G6: a `WIP:` commit after each step, its body naming the verification commands run so far.
    - G7: parity concepts for the split and for G6.
    - G8: `checker.md` "You never" no longer contradicts the named read-only exception.
  - **A/B result:**
    - Empty returns: A 0/3, B 0/3. Unrecoverable interrupted runs: A 2/2, B 2/2, so the release condition does not
      block.
    - Every interrupted run in both arms lacked the verification state on disk.
    - B5, carrying G6, did not apply it. A5 wrote its report, but through Bash into the **shared checkout**,
      overwriting the committed P4 report there. That file was restored from HEAD; the copy and patch are in
      `returns/`. This is an isolation breach, recorded as its own backlog row.
    - Checker verdicts varied widely across runs of the same diff and shared one blind spot (the G8 contradiction).
  - **Human decisions at P5 closure (G10–G13):**
    - G6 stays, and a backlog row "mechanism instead of sentence" was added;
    - the G6/G7 NITS went to backlog rows;
    - worktrees A5, B5 and G6/G7 were removed (branches kept);
    - **handoff: `/clear`, then P6 in a fresh session**.
  - **Next: P6** via `sailes-implement` from P6. The spec's P6 lists the steps:
    1. re-derive the eval intersection (P1–P5 files) and run it through `sailes-eval-runner`;
    2. `docs-author` delta;
    3. CHANGELOG 1.34.0 (see Owed);
    4. `CUTOFF`;
    5. five stamps, full `npm test`;
    6. the human's push approval.

    **The merge to `main` waits for F5.**
  - **Worktree base rule still applies:** every brief orders `git merge --ff-only feat/1.34.0-quality-gates`.
- **Owed, carried forward from the rotated entries** (verbatim sources in `.ai/archive/STATE-archive.md`):
  - **P6 CHANGELOG must say:**
    - P2 replaces 1.33.0's per-worker full-suite rule, and the client `AGENTS.md` template's Verification
      and Key Commands changed;
    - P3 adds lanes, the Codex `qa` screenshot fallback becomes ENV-DEFECT, and `checker.toml` gains the
      ID-coverage rule;
    - P4 adds `Known-red:`, red by name against the base, and `checker`'s named read-only exception;
    - P5 makes the implementer report a message and keeps the file for gate roles. It adds the G6 WIP rule, shipped
      but not shown effective (VERDICT addendum), the G7 parity concepts and the G8 `checker.md` fix.
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
