# STATE.md — session memory for the sailes-app-builder framework repo

Last-commit: 5ab8149

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
- 2026-09-13 (**resume here**): **1.33.0 — SHIPPED.** `main` fast-forwarded `c0b31ff` → `5ab8149`
  (the human chose ff over squash). `origin/main` was verified with all five stamps at 1.33.0 and
  `## 1.33.0` as the top CHANGELOG heading. `npm test` → exit 0, 20 suites, 0 `not ok`. The spec moved
  to `.ai/specs/implemented/` with pasted evidence; AGENTS.md now says twenty-two implemented specs.
  `CHANGELOG.md` is **LF** on disk. The older note below saying "CRLF, like CHANGELOG.md" was wrong.
  **Owed:**
  - (a) the token comparison against `.ai/eval-runs/2026-09-12-token-baseline/`, after the first two
    days of client work on 1.33.0;
  - (b) the archify 2.17 re-layout of four diagrams (backlog), which unblocks the docs receipt.

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
- 2026-08-30, third release of the session: **1.32.0 — SHIPPED.** 1.30.0, 1.31.0
  and 1.32.0 went to `main` in one push (`2549cde`); the plugin auto-updates on every machine at
  its next session start, and all three specs moved to `.ai/specs/implemented/`. The human asked "kiedy i jakie testy … żeby usprawniać implementację i przyspieszyć
  proces". Two forks were put to them; they chose **keep the frozen case list after implementation**
  (against my recommendation to move it into the spec — oracle independence stays bought the
  expensive way, deliberately) and **split the inner loop out with a promotion path**. Spec:
  `.ai/specs/2026-08-30-inner-loop-and-promotion.md`.
  - **The gap:** `sailes-implement` called the implementer's check "scaffolding" and nothing asked
    what it caught. A check red on a real defect is the only test here whose detection was *earned
    rather than argued*, and it died with the step. Now: the inner loop is named as an instrument
    (fast, plural, no IDs, no freeze, never gate evidence), and the one that caught something is
    reported under a fixed `Promotion candidate:` label that `tester` greps at step 4 — the door
    that already existed for implementation-revealed cases.
  - **Measured, PARTIAL PASS.** Arm A is a competent control: both arms found the planted
    `parseAmount('') === 0` defect and neither built a second ID-bearing suite (the failure mode this
    change was most likely to have). The difference is what reaches the report — arm A the diagnosis,
    arm B the check plus the diagnosis. The fixed label came out of the run and is itself
    **unmeasured**.
  - **Still unproven, and it is the human's actual question:** nothing measures SPEED. All three
    releases argue from structure and artifact counts, never from wall-clock. Owed, top of backlog.
  - **Session totals:** 1.30.0 → 1.31.0 → 1.32.0, +6.83% context across all skill entrypoints and
    role definitions against 1.29.0. Deployed 2026-08-30: the human authorised the push, `main`
    fast-forwarded 76554a5 → 2549cde, and `origin/main` was verified carrying all five version
    stamps at 1.32.0.

- 2026-08-30 later: **1.31.0 — shipped in the 2026-08-30 push (`2549cde`).** Human's brief: "optymalizacja skilla żeby nie produkował zbędnego kodu, działał
  szybciej ale zachował zalety testowania", scoped by them to **test volume + process ceremony**
  (production-code minimality explicitly out). Spec:
  `.ai/specs/2026-08-30-the-suite-is-a-one-way-ratchet.md`.
  - **What the audit found before any rule was written, and neither had been reported:** the risk
    tier scaled only the *proof* of detection, never the *case list* — every cross-product mandate
    applied identically at tier C and tier A; and **no rule anywhere in the repo removed a test.**
    The mutation machinery names tautological assertions and offers only two exits, both additive.
  - **Shipped:** a Case-list column in the tier table; the `DEAD` disposal route (tester names, human
    strikes); `checker`'s missing surplus mirror, guarded by a parity invariant on both twins;
    "NEVER delete tests" qualified to "to reach green"; and six contradictions deleted rather than
    documented, including the gate rule that had been stamped **twice** into every lead context by
    machine.
  - **The result that matters is the one that went the wrong way.** The tier-B rule's first wording
    ("walk each named edge in full") produced **70 cases against arm A's 58** — a 21% increase at
    identical 8/8 detection. Only fault injection against real model output showed it; the prose read
    persuasively either way. Corrected to the **straddle pair** (last accepted value, first rejected
    one — provable against off-by-one, which is the only fault an edge test exists for):
    **58 → 42 cases, 497 → 388 lines, 8/8 detection unchanged.**
  - **Context budget honoured this time:** +508 bytes (+0.20%) always-loaded, 2,425 bytes relocated
    out of that path — effectively −1,917 per implement run. 1.30.0 had cost +11.0%.
  - **A worker refused a spec item and was right.** The "orphaned HTML comment in team-lead.md" from
    recon did not exist; the worker counted 5/5 openers/closers, swept the repo, and reported the
    refutation instead of deleting a well-formed comment. Recorded in `.ai/lessons.md` as doctrine.
  - **Owed:** the eval `mock-of-an-external-boundary-carries-a-pair` is still NEVER-RUN;
    `diagnose-runs-live-case-before-audit` is still STALE against its new criterion (f); fixture 1 of
    the volume A/B was written under the superseded wording and its NULL result is a fixture
    critique, not a data point. The authz matrix in `security-checklist.md` remains tier-unconditioned
    in its own file — correct, since auth is tier A by definition, but worth stating if anyone
    generalises the Case-list rule.

- 2026-08-30 (**resume here**): **1.30.0 prepared on branch `test-doctrine-from-deployment-lessons`,
  shipped in the 2026-08-30 push (`2549cde`).** Source: `wnioski z wdrożeń/2026-08-30-...` — a client
  feature that shipped with unit tests, Playwright e2e and a green `qa` gate and worked for **zero**
  customers, because CloudFront rewrites the origin's `404` into `200 text/html` and every test
  asserted against origin or a mock. Spec: `.ai/specs/2026-08-30-test-surface-not-test-count.md`.
  - **The human's steer mid-session reframed the whole change set:** *"celem jest optymalizacja
    skilla pod połączenie szybkości i bezpieczeństwa, teraz jest zbyt w kierunku bezsensownego
    bezpieczeństwa."* Everything here therefore either replaces work or prevents measured waste:
    two safety rules that cost one command each, and three speed rules that delete work outright.
  - **What shipped:** `Deployed-probe:` + `tools/deployed-surface-check.js` (17th suite, 22 cases);
    the mock-pairing rule across `sailes-test`/`tester`/`qa`/`checker`; **`spec-weight`, a third
    sync block** beside `delegation-threshold` and `gate-scaling` (365 lines of spec for ~50 lines
    of code was the measured failure); the diagnose dispatch precondition; incremental worker
    reports; the cwd-before-worktree check.
  - **The most transferable finding is about the checker, not the doctrine.** It passed all seven of
    its author's fixtures and then failed **three correct answers on punctuation** the moment it met
    spec text a model had actually written — a `**Deployed-probe**` heading, a backticked `n/a`
    waiver, and a real deployed `curl` sitting unlabelled inside a `Done-when`. A check graded only
    on its author's fixtures is a check nobody has tested, and all three would have shipped as
    exactly the ceremony this release exists to remove. Pinned in the suite under "forms real specs
    are written in".
  - **Measured / not measured, kept apart on purpose.** The A/B
    (`.ai/eval-runs/2026-08-30-deployed-surface-probe/VERDICT.md`) discriminates: arm B exits 0,
    arm A exits 1. The control is **not clean** — arm A reached a deployed phase on its own but
    pointed it at cache headers while keeping the `404` contract in vitest and Playwright only,
    i.e. it reproduced the escaped defect rather than the behavior. A second A/B
    (`.ai/eval-runs/2026-08-30-spec-weight/VERDICT.md`) measures the speed half on a
    contract-shaped brief: **15,102 → 6,719 bytes, 13 sections → 5**, weight declared, every
    dropped section disposed of with a one-line `n/a`. On that fixture the probe dimension was a
    **tie** — both arms probed the deployed host unprompted. Across both runs the honest reading
    is that the probe rule does not supply an instinct the model lacks; it converts an occasional
    one into something either present on disk or loudly absent. One run per arm. N=1 source.
  - **Owed, all in `.ai/backlog.md`:** re-run the diagnose eval against its new criterion (f) — it
    reads STALE; dispatch `mock-of-an-external-boundary-carries-a-pair` — NEVER-RUN by design, no
    date; A/B `spec-weight` on a whole-spec prompt; the client-repo copy of the checker (spec Q2);
    re-ground `brief-closure.js:36-38`, whose comment 1.30.0 contradicts.
- Sessions before 2026-08-30 rotated on 2026-09-12 to `.ai/archive/STATE-archive.md`.
