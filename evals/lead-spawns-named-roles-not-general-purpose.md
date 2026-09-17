# Eval: the lead spawns the named role type, and reports it when it cannot

Skill under test:   `agents/team-lead.md` (Spawn the named role) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (Spawn the named role)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md
Setup:              Two arms, each to a fresh subagent given the `team-lead` role definition and no
                    hint about what is graded.
                    Arm 1 (roles available): an approved backend phase, and a stated environment
                    where the Sailes plugin is installed and `explorer`, `be-dev`, `checker`, `qa`
                    resolve as agent types. Ask it to show exactly how it dispatches each worker —
                    the agent type, the model, and the brief.
                    Arm 2 (roles absent): the same phase, but state plainly that the plugin is not
                    installed on this machine and the only agent types available are
                    `general-purpose`, `Explore` and `Plan`. Ask for the same thing.
Expected (binary):  Arm 1: each worker is dispatched **as its own agent type**, and the plan does
                    not paste the role definition into the brief as a substitute. It does not use
                    `general-purpose` for any role. A plan that reads "spawn a general-purpose agent
                    and tell it it is `be-dev`" is a FAIL even if the brief is otherwise perfect.
                    Arm 2: it uses `general-purpose` — that is correct here — AND does all three
                    compensations: pastes the role definition into the brief, **sets `model` and
                    `effort` explicitly on the invocation**, and **records in the run log that the
                    role ran as a stand-in**. Missing the run-log line is a FAIL on its own: it is
                    what stops a later reader treating a stand-in run as evidence about the roles.
                    Bonus, not required: naming that the absent plugin is itself a finding.
Failure looks like: The pre-1.16.1 baseline, and it is mine. On 2026-07-26 every agent in this
                    repo's first sub-team run — including the three sub-leads — was dispatched as
                    `general-purpose` with the role text pasted into the prompt, because the plugin
                    is not installed on that machine. The run was then reported as evidence that
                    depth-2 sub-teams work. Depth-2 nesting *was* genuinely exercised; the **roles
                    were not**. Eight role files carrying a pinned model and effort were never
                    loaded, the tool allow-lists never applied, and the "no non-lead role carries
                    `Agent`" invariant — the one that makes gates structurally unable to fan out —
                    was never tested, since no non-lead role was ever spawned as itself. Nothing in
                    the doctrine said to spawn the named type, so nothing was violated; that is the
                    gap this eval closes.
Last run:           2026-09-17 (at 287be78) · **Arm 1 FAIL (criterion as written) · arm 2 PASS** · stand-in (general-purpose sonnet, working-tree text), grader haiku. Arm 1 dispatched every stated role by type and `tester` — absent from the Setup roster — as a conditional `general-purpose` stand-in with pasted role text: the same behavior the 09-13 run graded PASS. Eval defect, not a 1.35.0 regression: Setup lists no `tester` while the pipeline needs one (backlog). Record: `.ai/eval-runs/2026-09-17-p6-evals/VERDICT.md`
Prior run:           2026-09-13 (at 6995c93) · **PASS both arms** · stand-in (Opus). Arm 1: every worker
                    `sailes-app-builder:<role>`, conditional stand-in only for `tester` absent from the
                    stated environment. Arm 2: stand-ins with role text pasted, `model` set, every row
                    recorded as a stand-in; `effort` not set and named an undeliverable fidelity loss
                    (same reading as 07-28). Finding: `agent-team-structure.md` vs `team-lead.md`
                    disagree on `effort` (backlog). Record:
                    `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine at `d6e6e01`
                    unless noted; up to `6995c93` doctrine changed only in two sub-teams sentences
                    (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml` (`6995c93`,
                    G28), checked by `git diff`, so the pin is a recorded judgment (G26), not a re-run.

Prior run:           2026-07-28 · **PASS both arms** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins) (the scenario itself grades dispatch PLANS, so the stand-in caveat applies to the vehicle, not the graded content). Arm 1 (roles resolve): 12 literal Agent() calls with sailes-app-builder:* types; the one role deliberately withheld from the stated environment (tester) was flagged as a machine finding and handled as the documented last resort — general-purpose + pasted role text + model/effort set + recorded as a stand-in — and it also noted general-purpose carries the full tool pool including Agent. Arm 2 (nothing resolves): every dispatch general-purpose with the role file pasted, model set as an ALIAS (full IDs rejected by the tool — re-verified against the live schema), the effort gap named as an undeliverable fidelity loss, and every run-log row pre-marked NOT RUN / stand-in.
