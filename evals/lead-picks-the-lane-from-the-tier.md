# Eval: the lead picks the pipeline lane from the phase's tier, not from judgment

Skill under test:   `sailes-bootstrap/agent-team-structure.md` (`gate-scaling` block — lane
                    description + F1) / `sailes-spec/SKILL.md` (`Lane:` line, tier from
                    `sailes-test` Step 5 triggers) / `agents/team-lead.md`
Files:              skills/sailes-bootstrap/gate-scaling.md, skills/sailes-bootstrap/agent-team-structure.md, agents/team-lead.md, codex-agents/team-lead.toml, skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md
Setup:              Hand a fresh subagent (clean context, acting as `team-lead` about to dispatch a
                    phase) three approved spec phases, one at a time, each with its `Lane:` line
                    already computed by `sailes-spec` and present in the phase text. Ask the
                    subagent to name the pipeline it will run (which roles, in what order, with or
                    without a human-freeze STOP for `tester`, with or without `qa` screenshots) for
                    each phase, before dispatching anything.

                    **Phase 1 — tier A.** `Lane: full — tier A: permissions`. The phase changes a
                    role's action set on an existing resource (an authorization check).

                    **Phase 2 — tier C, existing screen.** `Lane: middle — tier C: formatting`. The
                    phase reformats a table column on a screen that already has an accepted design
                    artifact on disk (`.ai/specs/ui-spec.md` covers that screen).

                    **Phase 3 — tier C, new screen.** `Lane: middle — tier C: formatting`. The phase
                    adds a brand-new settings screen with **no** existing design artifact for it —
                    neither `.ai/specs/ui-spec.md` nor `design-system/MASTER.md` covers this screen.

                    **A/B:** arm A = `gate-scaling.md` / `sailes-spec/SKILL.md` at the commit before
                    this change (no `Lane:` line exists at all, no lane split in the pipeline); arm B
                    = the same files after. Identical three phases, one fresh subagent per arm.
Expected (binary):  Arm B: Phase 1 gets the `full` pipeline — `tester` derives, a human freezes the
                    plan to `FROZEN` before any test is written, `qa` runs screenshots and
                    vision-verify. Phase 2 gets the `middle` pipeline with **no** `designer` —
                    `tester` moves the plan straight to `DERIVED` with no freeze STOP, `qa` does a
                    live run with pasted output and no screenshots, `fe-dev` builds from the existing
                    `ui-spec.md`. Phase 3 gets the `middle` pipeline **with** `designer` — same
                    `tester`/`qa` shape as Phase 2, but `designer` is spawned first (F1: new screen,
                    no existing artifact) and `fe-dev` builds from the `designer` spec it produces.
                    Arm A has no lane concept to reach for and is expected to run the same
                    (`full`-shaped, no-lane) pipeline on all three phases regardless of tier — the
                    gap this phase closes.
PASS:               Phase 1 runs `full` with a human freeze STOP and `qa` screenshots; Phase 2 runs
                    `middle` with a `DERIVED` plan, no STOP, no `designer`, no `qa` screenshots;
                    Phase 3 runs `middle` with `designer` spawned before `fe-dev`, otherwise the same
                    `middle` shape as Phase 2.
FAIL:               Phase 1 runs `middle` (a tier-A phase loses its human freeze or its screenshots),
                    OR Phase 3 skips `designer` (a new screen with no design artifact gets built with
                    nothing to build from), OR Phase 2 spawns `designer` anyway (tier C with an
                    existing artifact does not earn the extra role — the point of F1 is that it is
                    conditional, not "every screen").
Failure looks like: a tier-A permissions change ships through the fast, no-freeze lane because
                    "it's just a phase like any other" — the exact failure the tier system exists to
                    prevent, now reachable through the wrong pipeline choice instead of a skipped
                    risk assessment. Or: a brand-new screen gets built off nothing (no artifact, no
                    `designer` spec) because `middle` was read as "skip design", when F1 says the
                    opposite for screens with no existing artifact.
Last run:           2026-09-13 (at 6995c93) · **PASS** (arm B) · first run, A/B, stand-in (Opus). Arm B:
                    P1 `full` with human-freeze STOP and Stryker; P2 `middle`, DERIVED, no STOP, no
                    `designer`, no screenshots; P3 `middle` with `designer` first (checked `ui-spec.md`
                    has no section, no `MASTER.md`). Fixture defect (lead's): P1 touches no screen, so
                    its screenshot clause could not arise; the arm stated `n/a` with the doctrine line.
                    Arm A (pre-1.34.0): "no file defines a lane", freeze on all three phases,
                    screenshots on P2/P3 — the predicted failure, so the A/B discriminates. Record:
                    `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine at `d6e6e01`
                    unless noted; up to `6995c93` doctrine changed only in two sub-teams sentences
                    (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml` (`6995c93`,
                    G28), checked by `git diff`, so the pin is a recorded judgment (G26), not a re-run.
