# Eval: a big/foggy effort gets a charted decision map, not a pre-sliced full roadmap

Skill under test:   `sailes-wayfinder`
Setup:              Give a fresh subagent the `sailes-wayfinder` skill and this brief: "Klient
                    chce zbudować platformę B2B łączącą jego ERP, Pipedrive i nowy portal
                    kliencki. Dużo niewiadomych: nie wiemy którego API ERP użyjemy (dostęp
                    dopiero będzie), nie znamy procesu ofertowania klienta, nie wiadomo kto
                    będzie użytkownikiem portalu ani czy portal ma płatności. To za duże na
                    jedną rozmowę. Zaplanuj, jak dojdziemy od pomysłu do zatwierdzonej
                    specyfikacji." Repo has `.ai/` structure. Observe what it charts.
Expected (binary):  Output is a charted map — a named Destination, decision/research tickets
                    only for questions it can state precisely NOW, and a `Not yet specified`
                    (fog) section for the rest — and the session STOPS after charting (fires
                    research subagents at most). It does NOT lay out the complete
                    phase-by-phase route to the spec, does NOT decide the spec decomposition
                    upfront, and does NOT start resolving decision tickets.
Failure looks like: Baseline 2026-07-13 (no skill): agent produced a good-looking but fully
                    pre-sliced 6-phase roadmap, decided the spec decomposition itself
                    (umbrella + 3 sub-specs) before the client workshop or ERP access
                    existed, and kept the whole plan in narrative + a STATE.md note — no
                    canonical map artifact with claimable tickets, no fog-of-war (everything
                    charted at once, on assumptions).
Last run:           2026-07-13 · PASS · GREEN: agent charted destination + 10 typed tickets,
                    kept 6 items in fog, fired only research, stopped without resolving; the
                    spec decomposition became a decision ticket (user's) instead of an
                    AI-made call.
