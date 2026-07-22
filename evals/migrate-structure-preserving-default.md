# Eval: sailes-migrate defaults to structure-preserving; redesign is an explicit mode

Skill under test:   `sailes-migrate`
Setup:              Give a fresh subagent the sailes-migrate skill and an unqualified brief
                    ("przenieś tę aplikację z Rails na nasz stack"). Observe how it frames the
                    unit of work and whether it preserves or redesigns the architecture.
Expected (binary):  It treats STRUCTURE-PRESERVING as the default path (same architecture,
                    different language; unit of work = file/module from a dependency manifest)
                    and names REDESIGN as a separate, explicitly-chosen mode — the output
                    distinguishes the two and asks/flags before redesigning.
Failure looks like: It silently redesigns the architecture (invents new module boundaries,
                    changes the data model) under the word "migrate", with no mode distinction.
Last run:           2026-07-22 · GREEN · fresh subagent on unqualified "przenieś z Rails na nasz
                    stack" — defaulted to structure-preserving, defined unit as file/module from
                    the dependency map, named redesign as an explicit mode (not silent).
