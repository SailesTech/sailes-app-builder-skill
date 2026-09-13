# Eval: the gate compares pre-existing red by name against the base, never by count

Skill under test:   `agents/qa.md` (pre-push red-by-name procedure) / `agents/checker.md` (the same
                    procedure applied to a phase's `Done-when` commands) /
                    `skills/sailes-implement/SKILL.md` (`Known-red:` run-log section)
Files:              agents/qa.md, codex-agents/qa.toml, agents/checker.md, codex-agents/checker.toml, skills/sailes-implement/SKILL.md, skills/sailes-bootstrap/release-checklist.md
Setup:              Hand a fresh subagent (clean context, acting as `qa` about to push) a full-suite
                    run on the integrated branch with **4 red tests**: `A`, `B`, `C`, `D`. Also hand
                    it the base commit (the merge-base) and the previous push's run log, which
                    recorded **3 red tests at that time**: `A`, `B`, `C`.

                    The trap is built into the fixture, not into the prose: between the previous push
                    and now, `C` was fixed on the **branch** but a **different** test, `D`, went red
                    for an unrelated reason — so the branch's red *count* today (`A`, `B`, `C`, `D`
                    minus the fixed `C` = `A`, `B`, `D`) is **3**, identical to the previous run's
                    count of **3**. Nothing in the count differs; only the membership does.

                    Ask the subagent to determine, before push, whether any red test is NEW relative
                    to the base, and to fill the run log's `Known-red:` section.

                    **A/B:** arm A = `agents/qa.md` at the commit before this change (no red-by-name
                    procedure, no merge-base run, no `comm`); arm B = the same file after. Identical
                    fixture, one fresh subagent per arm.
Expected (binary):  Arm B runs the same test names (`A`, `B`, `C`, `D`) at the merge-base in a
                    temporary detached worktree, finds `A`, `B`, `C` red there and `D` NOT present/not
                    red on the base, pastes `sort` of both sides and `comm -23 <branch> <base>` =
                    `D`, and reports `D` as new red — CHANGES-REQUIRED — despite the count matching
                    the previous run (3 = 3). `A`, `B`, `C` go to `Known-red:` by name with a cause.
                    Arm A has no base run to reach for and is expected to compare the count alone
                    (3 red now vs. 3 red before → "nothing new"), missing `D` entirely — the exact
                    escape this rule closes.
PASS:               `D` is named as new red, CHANGES-REQUIRED, and the base was actually run (pasted
                    `sort` of red names on the base + `comm -23`) before that conclusion — not merely
                    asserted.
FAIL:               the count comparison (3 == 3 → "no new red", `D` never surfaces), OR `D` written
                    straight into `Known-red:` as pre-existing without any base run to support it —
                    both produce a green push over a genuinely new regression.
Failure looks like: a push goes out clean because the red-test count held steady across two runs,
                    while the actual failing tests underneath it silently changed — the fixed test
                    and the newly broken one canceling out in the tally the gate was trusting. Nobody
                    is told `D` exists until a customer hits it.
Last run:           2026-09-13 (at 6995c93) · **PASS** (arm B) · first run, A/B, stand-in
                    (general-purpose Sonnet + doctrine from git objects; grades the TEXT). Arm B ran the
                    red names at the merge-base in a detached worktree, pasted `sort` of both sides and
                    `comm -23` = `D`, CHANGES-REQUIRED at 3 = 3, `Known-red:` A, B. **Arm A did not show
                    the predicted failure**: on the 1.33.1 text it also ran the base and caught `D` by
                    name, so on this fixture the rule adds the `comm` form and the `Known-red:`
                    discipline, not the detection. Setup text self-contradicts (4 vs 3 red); fixture
                    built to the trap it describes. N=1 per arm. Record:
                    `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine at `d6e6e01`
                    unless noted; up to `6995c93` doctrine changed only in two sub-teams sentences
                    (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml` (`6995c93`,
                    G28), checked by `git diff`, so the pin is a recorded judgment (G26), not a re-run.
