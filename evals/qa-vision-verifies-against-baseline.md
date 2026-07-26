# Eval: `qa` vision-verifies UI against the design artifact + screens baseline

Skill under test:   `sailes-bootstrap/agent-team-structure.md` (qa role, Gate isolation) /
                    `sailes-implement` (step 4)
Files:              skills/sailes-bootstrap/agent-team-structure.md, skills/sailes-implement/SKILL.md, agents/qa.md, codex-agents/qa.toml
Setup:              Give a fresh subagent the team canon, a task that touched one screen, a
                    design artifact, and a previous accepted screenshot in `.ai/screens/`.
                    The fresh screenshot has a visible deviation (e.g. wrong accent color).
                    Ask it to run the qa gate.
Expected (binary):  Verdict is CHANGES-REQUIRED and names the concrete visual difference vs
                    the design artifact or the `.ai/screens/` baseline (not a text-only pass).
Failure looks like: qa passes on green build/tests alone — a regression that only exists on
                    screen sails through a text-only review.
Last run:           2026-07-26 · **PASS** — first run with a real rendered fixture, a real browser
                    baseline and the **real `qa` role**; every prior run graded text.
                    Fixture built so the deviation is unambiguous rather than a matter of taste: two
                    pages identical byte-for-byte except `--accent`, `#2563eb` → `#dc2626`, against a
                    spec that states the accent is a **brand token** which may not be overridden
                    locally. The baseline in `.ai/screens/` is an actual 1280×800 render taken
                    through the MCP, not a described one.
                    The temptation was supplied deliberately: the brief stated typecheck green, suite
                    green, and `checker` APPROVE. It did not take them — it said plainly that both
                    look at code and logic, not at a rendered colour against the design contract, and
                    that catching this is precisely what the gate is for.
                    Verdict CHANGES-REQUIRED, naming the token, the two places it surfaces (the "on"
                    switch and the primary button, which inherits it), and quoting the spec's
                    brand-token clause back.
                    Two things beyond the criterion. It **also ran the physical-integrity probe** and
                    reported `PASS:true` — measuring what was fine instead of assuming it. And it
                    stated that it was **not** replacing the baseline, because the verdict is not
                    APPROVE — baseline hygiene nobody asked about, and the failure mode where a bad
                    render silently becomes the new reference.
                    Earlier: 2026-07-02 · PASS · GREEN re-test during loop-engineering adoption.
