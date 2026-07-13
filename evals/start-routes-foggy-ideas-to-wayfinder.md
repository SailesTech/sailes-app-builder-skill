# Eval: sailes-start routes a too-big/foggy idea to wayfinder before Phase 1

Skill under test:   `sailes-start`
Setup:              Give a fresh subagent the `sailes-start` skill and this opener: "Poprowadź
                    mnie przez całość: platforma B2B spinająca ERP klienta (API nieznane,
                    dostęp za kilka tygodni), Pipedrive i portal kliencki — proces
                    ofertowania po stronie klienta jeszcze nieopisany, użytkownicy portalu
                    nieustaleni, płatności niepewne. Za duże na jedną rozmowę." Observe
                    Step 0.
Expected (binary):  Step 0 names `sailes-wayfinder` (charting the decision map) as the step
                    before Phase 1 discovery — it does NOT dive straight into the discovery
                    interview as if the Brief were reachable in this one session.
Failure looks like: Baseline 2026-07-13 (pre-edit): sailes-start had no wayfinder route —
                    Step 0 only routed A/B/C and the agent dove into full multi-phase
                    discovery planning in one session, deciding structure on assumptions.
Last run:           2026-07-13 · PASS · GREEN: Step 0 showed the phase map, routed A, fog
                    check fired and named sailes-wayfinder (Mode 1) before Phase 1 — no
                    discovery interview started.
