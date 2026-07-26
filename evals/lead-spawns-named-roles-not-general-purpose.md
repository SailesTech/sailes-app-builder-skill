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
Last run:           2026-07-26 · **ARM 1 PASS · ARM 2 VOID (fixture defect, mine)** — first run, and
                    the first one possible at all: arm 1 needs a machine where the roles resolve,
                    which only became true when the plugin was installed here.
                    **Arm 1 — PASS.** Dispatched all five workers as their own namespaced types
                    (`sailes-app-builder:explorer`, `:be-dev`, `:tester`, `:checker`, `:qa`).
                    `general-purpose` appears three times in the plan and every one is an
                    explanation of why it is *not* used. It also priced the stand-in path exactly
                    right without being told: a generic `be-dev` would run on the lead's own model
                    at the lead's effort, carry `Write` into a read-only gate, and carry `Agent`,
                    breaking the invariant that makes depth-2 safe.
                    **Arm 2 — VOID, and the fixture is the reason.** The brief asserted "the plugin
                    is not installed and only `general-purpose`/`Explore`/`Plan` resolve". On this
                    machine that is checkably false, and the agent checked: it read
                    `settings.json`, `installed_plugins.json` and the plugin cache, found 1.16.0
                    installed with all eight roles, and refused the premise. That is the *correct*
                    behaviour — accepting a falsifiable environment claim is the failure this whole
                    doctrine exists to prevent — so it cannot be scored against a criterion that
                    presumes the premise held. **The fallback path therefore remains untested.**
                    To run arm 2 honestly the roles must genuinely not resolve: a machine without
                    the plugin, or a disabled plugin plus the session restart that takes effect.
                    Do not "fix" this by telling the agent to pretend — a fixture that asks an agent
                    to accept a false premise measures compliance, not doctrine.
Also found:         Arm 1, reading the tool schema rather than the neighbouring paragraph, surfaced
                    a real conflict between the two halves of 1.16.0 routing: roles pin full IDs
                    for reproducibility, but the Agent tool's `model` parameter accepts only
                    aliases, so the documented escalation path un-pins what the pinning was for.
                    Recorded in `.ai/backlog.md` as **awaiting human** with four options, none free.
                    Arm 2 separately confirmed the installed cache is behind HEAD, which is why a
                    phantom `sailes-app-builder:README` type is still in this session's roster.
