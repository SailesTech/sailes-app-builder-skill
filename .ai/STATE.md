# STATE.md — session memory for the sailes-app-builder framework repo

Last-commit: f0469e4

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
- 2026-09-13 night, second session, later (**resume here**): **1.34.0 P4 — CLOSED** on `feat/1.34.0-quality-gates`
  (merge `01ecf81` + gate fix `f0469e4`). Nothing pushed; `main` untouched (F5). Evidence is in the spec's `Status:`
  line; events are in the run log.
  - **Shipped in P4:** pre-existing red is established **by name against the base**, never by count.
    - Evidence: sorted red names, the same names run on the base, a pasted `comm -23`; non-empty =
      CHANGES-REQUIRED.
    - Names red on the base go to the run log's `Known-red:` as `name · cause · validity: this push`.
    - `qa` pre-push uses `git merge-base HEAD origin/<base>`. `checker` at a phase gate uses the phase's
      integration base, the left side of its diff range (G1).
    - Both run it in a temporary detached worktree outside the repo (G2, G3).
    - A red e2e test runs on the base stack against a fresh seeded database, never the branch-migrated
      one; no seed path = ENV-DEFECT (G3).
  - **Handoff (human's choice at P4 closure):** `/clear`, then P5 in a fresh session via `sailes-implement` from P5.
    Worktree base rule still applies: `git merge --ff-only feat/1.34.0-quality-gates`. A new backlog row
    records that parity regexes check proximity, not meaning.
  - **Next: P5** — implementer report as a message plus the A/B, designed by the human as G4:
    - replay P4 from `738be36`;
    - 3 full runs + 1 interrupted per arm, `TaskStop` after the 3rd file edit;
    - about 1.3M tokens.

    P5 enters the release only if arm B has no more empty or lost returns than arm A.
  - **P6 CHANGELOG must also say:**
    - P4 adds `Known-red:` and red-by-name against the base;
    - `checker`'s named read-only exception (a temporary worktree).
- 2026-09-13 night, second session: **1.34.0 P3 — CLOSED** on `feat/1.34.0-quality-gates`
  (merge `cc9516a` + gate fixes `7701057`). Nothing pushed; `main` untouched (F5). Evidence is in the spec's `Status:`
  line; events and decisions are in `.ai/runs/2026-09-13-quality-gates.md`.
  - **Shipped in P3:**
    - Every phase carries `Lane: full | middle — tier <A|B|C>: <trigger>`. A → `full`; B/C → `middle`, which
      means a `DERIVED` test plan with no human freeze, a live `qa` run without screenshots, and `designer`
      only for a screen with no design artifact. The rule lives in the `gate-scaling` block.
    - At the gate the human chose: the UI integrity probe runs in **both** lanes, and `qa.toml` now says
      ENV-DEFECT instead of a screenshot fallback. That drift had been there since 2026-07-26 while parity
      stayed green. Parity gained two concepts and one inverse concept, each mutation-proven.
    - A backlog row covers the rest of the role-order restatements. Two `sailes-discovery` files omit `tester`.
  - **Decided for P4 (human, 2026-09-13):**
    - At a phase gate, `checker` compares red tests against the **phase's integration base**. `qa`
      compares against `origin/<base>` before push.
    - `checker` runs the base in a temporary detached worktree outside the repo. This is a named
      exception to read-only.
  - **Next: P4**, in the same session (human's choice). If interrupted: `sailes-implement` from P4.
  - **P6 CHANGELOG must also say:**
    - P3 adds lanes;
    - the Codex `qa` screenshot fallback is replaced by ENV-DEFECT;
    - `checker.toml` gained the ID-coverage rule it never had.
- 2026-09-13 night: **1.34.0 P2 — CLOSED** on `feat/1.34.0-quality-gates` at `aeee5e3`
  (merge `94a44ea` + NITS fix). Nothing pushed; `main` untouched (F5). Evidence is in the spec's `Status:`
  line, and every event is in `.ai/runs/2026-09-13-quality-gates.md`.
  - **Shipped in P2:**
    - `be-dev`/`fe-dev` run lint + build + changed-module tests and never the full suite on a phase.
      `checker` runs the phase's `Done-when` commands and checks that every path class has a named
      targeted command.
    - `qa` alone runs full suite + e2e, once, before push, on the integrated branch, holding the
      environment exclusively. This is in `release-checklist.md` §0 and in the new "Pre-push gate" in
      `sailes-implement`.
    - The 1.33.0 "once before the declaration commit" rule is REPLACED everywhere it stood.
    - `parity.test.js` gains `INVERSE_INVARIANTS`, proven in both directions: the old text gives exit 1.
  - checker: APPROVE with 2 NITS, which the lead fixed. tester and qa: n/a.
  - **Next: P3** (`Lane:` from the risk tier, `DERIVED` plan, F1 `designer` rule), in a fresh session:
    `sailes-implement` from P3. The worktree base rule still applies: `git merge --ff-only feat/1.34.0-quality-gates`.
  - **P6 CHANGELOG must say:** P2 replaces 1.33.0's per-worker full-suite rule. The client `AGENTS.md`
    template's Verification and Key Commands changed.
- 2026-09-13 late: **1.34.0 P1 — CLOSED** on branch `feat/1.34.0-quality-gates` at
  `999e819`. Nothing pushed; `main` untouched (F5: merge only after the 1.33.x token comparison).
  Progress and every event are in the run log `.ai/runs/2026-09-13-quality-gates.md`; the evidence
  is in the spec's `Status:` line.
  - **Shipped in P1:** `tools/contract-probe-check.js` with its test (27) and frozen suite (41 IDs, 30
    mutants, 0 survivors). `npm test` → exit 0, **22 suites**, and `AGENTS.md` says twenty-two. Doctrine is
    in `sailes-spec`, the spec template and `sailes-pre-implement` Phase 1b, where both tools are now
    called through `${CLAUDE_PLUGIN_ROOT}`. Eval `lead-probes-the-contract-before-dispatch` is NEVER-RUN
    and runs in P6. checker: APPROVE after one CHANGES-REQUIRED; qa: n/a.
  - **Human decisions 2026-09-13:**
    - `CUTOFF` = the day of the merge to `main`, set in P6. The code holds a placeholder `2026-09-14`,
      and the spec's P6 carries this item.
    - Specs without a date in the name are not graded, and the tool says so on stdout. This is durable.
    - Plan frozen at tier B, with a mandatory separator after `n/a`, an invalid calendar date counted as
      no date, and exit 2 winning over any other result.
    - The field value's boundary stays generic (`<Word>-<word>:`).
    - Handoff after P1.
  - **Next: P2** (per-phase gate from the phase's own files, full suite + e2e once before push by `qa`)
    in a fresh session: `sailes-implement` from P2. Before any dispatch, remember that worktrees are cut
    from `main`, so a brief orders `git merge --ff-only feat/1.34.0-quality-gates`.
  - **Worth remembering:** checker graded coverage **by ID** and missed that CP17 dropped its row's
    qualifier ("pre-CUTOFF"); the lead caught it while reading a NIT on the same line. This is a lesson
    candidate. It was not written into `lessons.md`, which is at 39.4 of 40 KB and needs rotating first.
  - Line endings: worktrees check out LF (Linux); the main tree's CRLF is a leftover. git stores LF,
    so content does not differ. A brief claiming "file X is CRLF" should check the worker's tree, not
    the main one.
- 2026-09-13: **1.33.0 — SHIPPED.** `main` fast-forwarded `c0b31ff` → `5ab8149`
  (the human chose ff over squash). `origin/main` was verified with all five stamps at 1.33.0 and
  `## 1.33.0` as the top CHANGELOG heading. `npm test` → exit 0, 20 suites, 0 `not ok`. The spec moved
  to `.ai/specs/implemented/` with pasted evidence; AGENTS.md now says twenty-two implemented specs.
  `CHANGELOG.md` is **LF** on disk. The older note below saying "CRLF, like CHANGELOG.md" was wrong.
  **Owed:**
  - (a) the token comparison against `.ai/eval-runs/2026-09-12-token-baseline/`, after the first two
    days of client work on 1.33.0;
  - (b) the archify 2.17 re-layout of four diagrams (backlog), which unblocks the docs receipt.

  **Then 1.33.1, the same day, chosen by the human** over adding a line to 1.33.0 or leaving it on
  the branch. It fixes the `mcp-toolnames-check` "server absent" flake. The real mechanism is an
  async EPIPE on `child.stdin` with no `error` listener, not load. Load was only the trigger: under
  the same load, 15 of 20 runs failed before the fix and 0 of 20 after. The push also carries the
  1.33.0 spec closure. The docs delta is EMPTY (receipt `.ai/docs-deltas/2026-09-13-release-1.33.1-notes.md`).
  The backlog row is closed. **Lesson: `git mv` moves the index entry, not the working-tree edit.**
  The first closure commit renamed the spec without its new Status line, and `git show --stat` caught
  it at 0 lines.

  **Spec 2 started (human chose "D1 scope").** Skeleton at
  `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`: report §3.1, 3.2, 3.3/3.3a,
  3.4, 3.8; Status draft. **Q1–Q7 answered 2026-09-13** (table in the spec; Q5a needed a second
  window — the human's words were "robimy pełny test po zakończonej pracy, przed pushem" = full suite
  + e2e once before push, not per phase; tier still picks the lane). Spec rewritten with phases
  P1–P6. Second round R1–R5 also answered (all as recommended: `qa` runs the pre-push full suite,
  `tester` without the freeze STOP in the middle lane, 40-line message cap, new narrow
  `contract-probe-check.js`, `Known-red:` in the run log). **Next gate: the human approves the whole
  spec → `Status: approved` → `sailes-pre-implement`.** Approved by the human 2026-09-13.
  **Pre-implement → READY-WITH-FIXES**, report `.ai/audits/2026-09-13-pre-implement-quality-gates.md`.
  Two Critical findings, both compositions of this session's decisions with rules already on disk:
  - lane = tier removes `designer` + vision-verify from almost all UI work, because tier C *is* "UI";
  - `Known-red:` is cleared at the per-phase handoff, while the full suite runs only before push, so
    the list never exists when it is needed, and nobody runs the base branch.

  F1–F5 answered, all as recommended:
  - F1: a new screen without a design artifact keeps `designer`;
  - F2: middle-lane test plan status `DERIVED`, expectations changed by the lead in the run log;
  - F3: at push, `qa` runs the red names on merge-base and diffs them with `comm`;
  - F4: probes run on the local stack with seed data, redacted;
  - F5: merge to `main` only after the 1.33.x token comparison.

  Spec rewritten, `Status: approved`, READY for `sailes-implement` **from P1**, which is independent of
  F1–F3 and is the only code. **Gate: not crossed.** Implementation waits for the human's go (and,
  per session-handoff, a `/clear` first). **F5 means `partner-portal-v3` must be upgraded to 1.33.1
  and worked on for two days before 1.34.0 can merge.** Out-of-D1 items (3.6, 3.7, 3.9, 3b, 3c)
  are backlog rows dated 2026-09-13. Found while grounding: 3.3a (only the gate role runs full suite +
  e2e) contradicts what 1.33.0 P3 just shipped (implementer runs them once before commit) — Q3.

  Left untouched, not mine: the untracked `.ai/specs/2026-09-01-codex-marketplace-auto-update.md` and
  `package-lock.json`.
- 2026-09-12: pre-implement of `.ai/specs/2026-09-12-token-cost-of-running.md`
  → READY-WITH-FIXES, report `.ai/audits/2026-09-12-pre-implement-token-cost.md`. The human decided
  four forks (F1 hook emits sections-or-head, F2 Upgrade-mode patch of the local hook, F3 archive
  grep by area keyword, F4 lead asks the human for `/clear`); the spec was rewritten with them and
  now starts at **P0 (token-report tool + aggregate baseline)**. **Deadline:** the 11–12.09
  partner-portal transcripts age out around 2026-10-11 under the default `cleanupPeriodDays`.
  Two findings that correct the spec's earlier claims: the client `STATE.md` is dated blocks, not
  five sections; and bare `Agent(be-dev)` vs `sailes-app-builder:be-dev` matching is **not
  documented** (P4 rests only on its live check). The human gave the go: work is on branch
  `feat/1.33.0-token-cost` (spec commit `ec1b13c`), run log `.ai/runs/2026-09-12-token-cost.md`
  carries progress. This repo's own memory was rotated the same day (P1): STATE.md 88 → 13 KB,
  lessons.md 45 → 39 KB, the rest verbatim in `.ai/archive/`. **Worktrees are cut from the default
  branch, not from the lead's current branch** — the first P0 worker stopped on its base check;
  the fix is `git merge --ff-only <lead-branch>` inside the worktree.
  **SESSION ENDED BY THE HUMAN 2026-09-12 late — superseded by the 2026-09-13 block above.** Branch
  `feat/1.33.0-token-cost`; nothing pushed, `main` untouched. Every human decision this session is in
  `.ai/runs/2026-09-12-token-cost.md` (F1–F5, JSON naming, tester n/a P2–P4, P1a-26, handoff pointer,
  P0 Done-when, docs receipt debt, archify kept).
  **State at stop:** P0–P4 merged and gated. Checkers: P1b/P2/P3/P4 APPROVE, P0/P1a NITS (accepted).
  Detection: P0 11/11, P1a 9/9 (+ P1a-26). Docs delta merged, receipt blocked, debt accepted by the
  human. Evals: `lead-splits-brief-per-phase` PASS; `lead-hands-off-after-phase` FAIL under the
  original criterion (`03ad03b`), then the criterion (`6c43a0c`) and the doctrine sentence (`8b3b207`)
  were amended by human decision. **Both follow-ups finished before the stop:** fixture A re-run on
  a fresh arm (A2) → **PASS**, so the scenario is now PASS (`VERDICT.md`); checker on the pointer
  sentence → **APPROVE**. Every phase gate and both evals are closed; only the release steps remain.
  **Resume, in order:**
  1. (done) A2 graded and recorded in VERDICT.md and the scenario's `Last run:`.
  2. (done) checker APPROVE on the pointer sentence.
  3. CHANGELOG: the complete 1.33.0 entry is in `.ai/runs/2026-09-12-token-cost-CHANGELOG-1.33.0-draft.md`
     (CRLF, like `CHANGELOG.md`), with the pointer clause and eval results included. Insert it above
     `## 1.32.0` in `CHANGELOG.md` **in the same commit** as the five stamps → 1.33.0 (`VERSION`,
     `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `AGENTS.md`
     `Framework-Version:`). `release-hygiene` fails on a heading ahead of `VERSION`.
  4. Full `npm test`. `mcp-toolnames-check` "server absent" is a known flake: rerun it standalone.
  5. Ask the human for approval to push `main` (a push is the deploy). After the push: spec →
     `implemented/` with pasted evidence; AGENTS.md "twenty-one implemented specs" → twenty-two;
     the post-release token comparison against `.ai/eval-runs/2026-09-12-token-baseline/` is owed.
  **Earlier progress on the branch (tip `27aac83` at the time), detail in `.ai/runs/2026-09-12-token-cost.md`:**
  - **P1** merged. P1b: checker APPROVE. P1a: checker NITS, accepted. Detection proof: 9/9 mutants
    killed, after tester-2 strengthened the CRLF case.
  - **P3** merged, checker APPROVE. **P4** merged, checker APPROVE: live check that bare
    `Agent(be-dev)` denies only the local copy; F4 test; salvage goes to `AGENTS.md` (human F5).
  - **P0** merged: the tool reproduces the original instrument exactly on the same corpus (714M /
    1372M). Frozen suite 37/37 after 3 genuine tool defects were fixed (turns without `usage`;
    humanized text). Wired into `npm test`, which is now twenty suites.
  - P5 eval scenarios are written but not run.
  - The P2 `autoCompactWindow` live check passed: `/context` went from 1m to 150k.

  Human decisions this session: F1–F5; mtime filter; malformed lines skipped; the suite adopts the
  tool's key names; `tester: n/a` for P2–P4; P1a-26 added. The CHANGELOG 1.33.0 draft sits in the
  session scratchpad (`CHANGELOG-1.33.0-draft.md`), because `release-hygiene` forbids a heading ahead
  of `VERSION`. If the scratchpad is gone, rewrite it from the run log.

  **In flight:** P2 (be-dev-7), P0 detection proof (tester-1), checker P0, P1a-26 (tester-2).
  **Remaining after P2:** checker P2 → run both evals via `sailes-eval-runner` → `docs-author`
  delta → CHANGELOG + five stamps → full `npm test` → human approval to push `main`.
