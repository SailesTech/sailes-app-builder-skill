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
- 2026-07-22: added **`sailes-migrate`** (1.12.0) — a domain-sibling skill for porting an existing
  codebase to another language/stack at scale, distilled from Anthropic's `code-migration-kit`
  (Apache-2.0). Six-step gated method reusing existing roles (explorer/team-lead/be-dev/fe-dev/
  checker/tester/qa) + the deny-list guardrail; one new hard invariant — *no translation fan-out
  before a judge/parity-harness exists and is validated against deliberately-broken source*.
  Authored **autonomously with the decision-owner away**, so the spec's Open-Questions gate was
  answered by proxy: every scope call is in spec §2 marked **NEEDS-VERIFICATION** (D1 separate
  skill, D2 SP default + redesign mode, **D4 kit scripts referenced not vendored — human licensing
  call**). Evals written FIRST, then **run on fresh clean-context subagents — all three GREEN** on
  adversarial prompts. **First built on a graphify-based branch (1.13.0), then rebased onto `main`
  (1.11.0) and renumbered to 1.12.0** after verifying graphify is NOT on `main`; old branch kept as
  `feat/sailes-migrate-graphifybased`. ⚠️ 1.12.0 collides with graphify's own 1.12.0 if graphify
  later merges — coordinate then. `npm test` green; four manifests + CHANGELOG at 1.12.0. On branch
  `feat/sailes-migrate`, **committed, not merged**; push/merge is the human's call (merge = live deploy).
  Run log: `.ai/runs/2026-07-22-sailes-migrate.md`.
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
  - **All three evals RUN 2026-07-20 · PASS** (fresh blind agents, real fixtures with actual context —
    not the condensed-fixture trap that made the anchor eval inconclusive). Isolation: derived from
    spec, did not read the readable-and-wrong impl, flagged Slack-first as a FAIL. One-way rule: left
    a red frozen B2 byte-for-byte unchanged and fixed the code instead. Tier: classified a
    charge-on-activation phase tier A and refused the "keep it lightweight" nudge, citing the Red Flag.
    Fixtures in scratchpad/eval{1,2,3}; verdicts recorded in each `evals/tester-*.md`.
  - **Merged + deployed 2026-07-20.** `feat/sailes-test` → `main` (`026b346`), pushed, `install.sh
    --force` synced `~/.claude/skills/` (14 skills incl. `sailes-test`).
  - **Follow-up 1.10.1 `fix/tester-lane` (not yet merged):** the one-way eval had surfaced that
    `tester`, under "make it pass", fixed feature code — correct outcome, `be-dev`'s lane. Closed:
    `agents/tester.md` + `codex-agents/tester.toml` now scope write access to test files (a red frozen
    test is a defect to REPORT), the eval gained a criterion (b), and the **re-run PASSED both
    criteria** — same scenario, guarded skill, the agent edited nothing and reported the defect up.
    Before/after behavior change is the proof the guard lands. Four manifests + AGENTS.md at 1.10.1,
    CHANGELOG entry. `npm test` green. Push is the human's call.

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
