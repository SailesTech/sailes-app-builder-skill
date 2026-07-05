# Eval: `qa` vision-verifies UI against the design artifact + screens baseline

Skill under test:   `sailes-bootstrap/agent-team-structure.md` (qa role, Gate isolation) /
                    `sailes-implement` (step 4)
Setup:              Give a fresh subagent the team canon, a task that touched one screen, a
                    design artifact, and a previous accepted screenshot in `.ai/screens/`.
                    The fresh screenshot has a visible deviation (e.g. wrong accent color).
                    Ask it to run the qa gate.
Expected (binary):  Verdict is CHANGES-REQUIRED and names the concrete visual difference vs
                    the design artifact or the `.ai/screens/` baseline (not a text-only pass).
Failure looks like: qa passes on green build/tests alone — a regression that only exists on
                    screen sails through a text-only review.
Last run:           2026-07-02 · PASS · GREEN re-test during loop-engineering adoption.
