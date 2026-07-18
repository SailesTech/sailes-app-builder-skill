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
- Framework version lives in `VERSION` (currently **1.9.0**) and must match `package.json`,
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
- Behavioral GREEN re-runs for the 1.1.0 text-level changes (ratchet promotion, authz matrix,
  ENV-DEFECT, release gate) are pending — the Done-when greps passed, but the subagent behavior
  tests marked "pending post-merge" in `evals/` should be run after install.
- **`prompt-anchor` Phase 5 is unresolved.** Three arms exist on `enforce/always`,
  `enforce/state-only`, `enforce/hybrid`; the hook is NOT on `main`. The depth eval — proving
  behavior at turn 60 rather than turn 1 — has not been built, and D3 of the spec says that if
  the arms cannot be separated the decision re-opens rather than the recommended arm shipping.
- The delegation-report rule (1.9.0) has no mechanical backstop and has not been observed holding
  under context pressure. It is the same prose-decays problem `prompt-anchor` exists to attack.

## Lessons learned
- See `.ai/lessons.md` (framework-level lessons; project-level ones live in each client repo).

## Last session
- 2026-07-18: audited the framework's own enforcement surface. Shipped **1.9.0** to `main`: the
  canonical spine (`SPEC → HUMAN → VERIFIED → GATED`, byte-identical in the router and
  `agents-md-template.md`), the delegation empty-return rule, and `hooks/lib/repo-state.js`.
  Built the `prompt-anchor` UserPromptSubmit hook with three policy arms — held back from `main`
  pending Phase 5. Four silent failures happened during the session (two agents returning no
  report, a `git checkout` destroying an uncommitted edit, a `String.replace()` no-op); all four
  looked like success, and they are why 1.9.0 exists.
  Next: run `./install.sh --force` (the installed copy is stamped 1.4.0 and has no
  `sailes-diagnose`), then Phase 5's depth eval.
