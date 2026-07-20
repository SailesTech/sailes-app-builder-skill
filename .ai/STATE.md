# STATE.md — session memory for the sailes-app-builder framework repo

> Read at session start; write before walking away. Facts enter **Verified facts** only with
> evidence; hypotheses stay in **Open failures**.

## Verified facts
- The framework's source of truth is `skills/` here; the active copy is `~/.claude/skills/`,
  synced by `./install.sh --force` (evidence: install.sh reads `skills/sailes-*/SKILL.md`).
- **`main` is production.** The live plugin runs from `~/.claude/plugins/cache/sailes/…`, sourced
  from a clone at `~/.claude/plugins/marketplaces/sailes` that tracks **`main`** with
  `autoUpdate: true` (evidence: `known_marketplaces.json`; it self-updated to `9998c62` on
  2026-07-18 11:53 unprompted). A push to `main` deploys to every machine that ran
  `enable-plugin.sh`; a push to any other branch reaches nobody. Local edits never reach a session.
- Skill regression tests are persisted in `evals/` since 1.1.0. Before that, RED/GREEN lived only
  in chat sessions.
- Framework version lives in `VERSION` (currently **1.9.2**) and must match `package.json`,
  `.claude-plugin/plugin.json` **and** `.claude-plugin/marketplace.json` — that fourth one has
  drifted twice. The standard delta per version is in `CHANGELOG.md`; generated repos are stamped
  `Framework-Version:` in AGENTS.md, which `hooks/framework-version-check.js` compares on startup.
- Spec lifecycle is enforced here too: `.ai/specs/` root = live. Both 2026-07-05 specs sat
  completed-but-unmoved for 13 days and were moved to `implemented/` on 2026-07-18 — the exact
  drift `workflow-router.js` was built to flag, in the repo that wrote the check.
- **No hook observes a subagent completing** (evidence: the hook event surface is session start,
  prompt submit, tool calls). A missing delegation report therefore cannot become a check; the
  rule for it is prose by necessity.

## General rules
- Every framework change lands as: proposal spec (root `.ai/specs/`) → human answers Open
  Questions → edits with binary Done-when outputs pasted → evals updated → CHANGELOG entry →
  VERSION bump (all four manifests) → push `main` → post-merge `./install.sh --force`.
- Editing a skill = re-run the `evals/` scenarios naming it; new protected behavior = eval first.
- Experiments that change global behavior stay on a branch until their eval returns a verdict.
  `main` is not a staging area.

## Open failures
- **`prompt-anchor` Phase 5 is INCONCLUSIVE and the decision is re-opened (D3 triggered).** Both
  eval arms passed identically — but the fixture condensed 58 turns into ten lines, leaving the
  SessionStart mandate ~500 tokens from the hostile brief instead of 80k. The control held
  because the mandate was still in view; the condition an anchor would address was never created.
  The hook stays on `enforce/*` and does NOT merge until a fixture with real context distance
  exists. Do not cite `evals/anchor-holds-the-line-deep-in-session.md` as if it had answered.
- Behavioral GREEN re-runs for the 1.1.0 text-level changes are still pending — inherited, open
  since July. Either run them or write them off deliberately; they have been "pending" long enough
  that nobody now knows which.
- **Five silent failures in one day**, four of them fixtures: MSYS paths in a hook test; a typo
  that did not exist; a `git checkout -- <path>` that destroyed an uncommitted edit; a CRLF regex
  that no-op'd; backticks in a shell heredoc that ate half a STATE.md rewrite. Plus the
  condensed-context depth eval, which nearly became a conclusion. The pattern is one thing:
  **a step that reports success for a reason other than the one claimed.** Two mitigations are
  now in AGENTS.md (verify a scripted edit landed; `\r?\n` not `\n`); a third is simply to stop
  pushing prose through a shell — use the file-writing tools.

## Lessons learned
- See `.ai/lessons.md` (framework-level lessons; project-level ones live in each client repo).

## Last session
- 2026-07-20: built **`sailes-test`** (1.10.0) — a testing skill + a `tester` agent role, on branch
  `feat/sailes-test`, **not yet merged**. The last verification step inside each spec phase, before
  `checker` and `qa`. Core is informational isolation: derive expected behavior from the spec with
  the implementation unread → human freezes the case list to `.ai/test-plans/<spec>.md` → write →
  diff may only ADD, never weaken → detection proven at a risk tier computed from triggers (A Stryker
  / B per-B-ID break / C green suite), which the agent may raise but never lower. Full discovery →
  spec → pre-implement → 7 gated phases; every Done-when run with output pasted
  (`.ai/runs/2026-07-20-sailes-test.md`).
  - **Pre-implement earned its keep:** READY-WITH-FIXES, three findings of the "green for the wrong
    reason" class — a hardcoded `ROLES` array that would leave `tester.toml` unvalidated; the pipeline
    order living twice with a read-only enumeration that a writing gate makes false; a Done-when
    asserting 15 where a naive count returns 19. All fixed on paper before code.
  - **Two research statistics did not survive verification** — arXiv 2410.21136's percentages were
    fabricated in summarization (abstract has none); Luo et al.'s flaky split is unconfirmable
    (ranking real). Kept as a worked example in the skill and a lesson. See Open failures.
  - **The version-check hook caught its own repo** — flagged AGENTS.md still at 1.9.2 after the bump;
    fixed. Small proof the instrument works on the framework that ships it.
  - **NOT done:** the three evals are written but **NOT YET RUN** — they are the only proof the
    isolation/one-way/tier rules land as model behavior. Nothing merged to `main`. Both are next
    session's job, in that order: run evals, then the human decides the merge + `install.sh --force`.

- 2026-07-18: audited the framework's own enforcement surface and shipped three releases.
  **1.9.0** — the canonical spine (`SPEC → HUMAN → VERIFIED → GATED`, byte-identical in the
  router and `agents-md-template.md`), the delegation empty-return rule, `hooks/lib/repo-state.js`.
  **1.9.1** — the six enforcement-audit findings, including the guard scripts becoming real files
  and this repo finally getting its own AGENTS.md.
  **1.9.2** — briefs now name the DELIVERY mechanism, not just the deliverable: measured, three of
  five background teammates formed a correct answer and delivered nothing because plain text does
  not reach the lead. The 1.9.0 rule was right and its written cause was wrong; it survived because
  the rule worked, which is the hardest kind of error to see.
  Evals: `lead-delegates-instead-of-bulk-coding` PASS both arms (first real run since 1.7.0);
  `lead-chases-an-empty-worker-return` PASS both assertions;
  `anchor-holds-the-line-deep-in-session` INCONCLUSIVE — see Open failures.
  Next: a depth-eval fixture with real context distance. Nothing else is blocking.
