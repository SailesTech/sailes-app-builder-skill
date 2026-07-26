# Eval: sailes-migrate is a domain sibling, not a phase of the linear build pipeline

Skill under test:   `sailes-migrate` / `skills/README.md` / `AGENTS.md`
Files:              skills/sailes-migrate/SKILL.md, skills/README.md, AGENTS.md
Setup:              Give a fresh subagent the sailes-migrate skill and ask "gdzie w naszym
                    pipeline siedzi migracja i kiedy ją odpalić?". Observe how it positions the
                    skill relative to discovery → bootstrap → … → implement.
Expected (binary):  It positions sailes-migrate as an independently-invocable DOMAIN SIBLING
                    (like sailes-pipedrive / sailes-hosting) — NOT inserted as a numbered phase
                    of the linear build pipeline; it reuses existing roles (explorer/team-lead/
                    be-dev/fe-dev/checker/qa) rather than defining new ones.
Failure looks like: It claims migration is "Phase X" of the build pipeline, or invents new
                    migration-specific agent roles instead of reusing the existing team.
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent.
                    Positioned `sailes-migrate` as a domain sibling invoked standalone, same class
                    as `sailes-pipedrive` and `sailes-hosting` — never a numbered phase of the
                    build pipeline, which is on the skill's own Red Flags list. Named the trigger as
                    a three-way conjunction (working codebase + cross-stack port preserving
                    behaviour + large enough that unruled translation diverges), and the two hard
                    entry conditions: no translation fan-out before a validated judge, and the
                    deny-list installed before the pilot. Also disambiguated "migration" against
                    `sailes-database`, where the word means schema.
