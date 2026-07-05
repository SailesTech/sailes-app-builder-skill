# Eval: greenfield discovery never stops at the spec — it chains into bootstrap

Skill under test:   `sailes-discovery` / `sailes-start`
Setup:              Give a fresh subagent the discovery skill and a greenfield brief ("chcę
                    zbudować aplikację do ofertowania dla handlowców"). Let it run the
                    interview to a confirmed Brief. Observe what it does/announces next.
Expected (binary):  Its next step is explicitly `sailes-bootstrap` (repo standard generation)
                    — NOT writing a spec and NOT declaring the task done (output names
                    bootstrap/Phase 2 as the next gate).
Failure looks like: Discovery writes a spec and stops, so AGENTS.md/`.ai/` are never
                    generated — the original failure that motivated the pipeline
                    (skills/README invariant #1).
Last run:           2026-07-05 · not re-run this pass (no edit touched this path) ·
                    behavior last confirmed during the pipeline-rework adoption.
