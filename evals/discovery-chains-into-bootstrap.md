# Eval: greenfield discovery never stops at the spec — it chains into bootstrap

Skill under test:   `sailes-discovery` / `sailes-start`
Files:              skills/sailes-discovery/SKILL.md, skills/sailes-start/SKILL.md
Setup:              Give a fresh subagent the discovery skill and a greenfield brief ("chcę
                    zbudować aplikację do ofertowania dla handlowców"). Let it run the
                    interview to a confirmed Brief. Observe what it does/announces next.
Expected (binary):  Its next step is explicitly `sailes-bootstrap` (repo standard generation)
                    — NOT writing a spec and NOT declaring the task done (output names
                    bootstrap/Phase 2 as the next gate).
Failure looks like: Discovery writes a spec and stops, so AGENTS.md/`.ai/` are never
                    generated — the original failure that motivated the pipeline
                    (skills/README invariant #1).
Last run:           2026-07-26 · **PASS** — re-run after the `SKILL.md` split (22.3 KB → 14.9 KB;
                    the decision-card method and both checklists moved to sibling files). Dispatched
                    on a realistically thin brief — one sentence about salespeople hand-building
                    quotes in Word — to check the split did not cost the skill its behaviour.
                    It did not. The agent **pulled both extracted references** rather than working
                    from the thin entry alone: it walked the greenfield checklist, produced five
                    decision cards, and used the 1.17.0 escape hatch on three of them — *"nie mam
                    podstaw, żeby wskazać"* instead of an invented ground — plus a measurement offer
                    on the document-engine fork with the criterion agreed up front. Decisions Ledger
                    present with all ten rows at `AI-recommended-pending`. No brief, no spec, no code.
                    The protected behaviour held: greenfield → **`sailes-bootstrap` is mandatory**,
                    stated as owning the stack cards it deliberately did not run, with writing a spec
                    now named as the bug.
                    It also caught something the fixture did not plant: the working directory is the
                    framework toolkit, not a customer repo, so the offer app needs its own and must
                    not inherit this one's stack by anchoring.
                    Earlier: 2026-07-26 · PASS — re-run after 1.16.0; single run, fresh subagent.
                    Ran the interview to a confirmed Brief and named `sailes-bootstrap` (Route A /
                    Case B) as the next step, explicitly not a spec — Phase 3 belongs to the local
                    spec-writing skill bootstrap generates. Left the stack deliberately open with
                    constraints captured, because the stack decision cards are bootstrap's.
                    Simulated answers were tagged as simulated throughout, and it excluded the
                    framework repo it was running in as an anchor so no stack leaked in from here.
