# Eval: sailes-migrate is a domain sibling, not a phase of the linear build pipeline

Skill under test:   `sailes-migrate` / `skills/README.md` / `AGENTS.md`
Setup:              Give a fresh subagent the sailes-migrate skill and ask "gdzie w naszym
                    pipeline siedzi migracja i kiedy ją odpalić?". Observe how it positions the
                    skill relative to discovery → bootstrap → … → implement.
Expected (binary):  It positions sailes-migrate as an independently-invocable DOMAIN SIBLING
                    (like sailes-pipedrive / sailes-hosting) — NOT inserted as a numbered phase
                    of the linear build pipeline; it reuses existing roles (explorer/team-lead/
                    be-dev/fe-dev/checker/qa) rather than defining new ones.
Failure looks like: It claims migration is "Phase X" of the build pipeline, or invents new
                    migration-specific agent roles instead of reusing the existing team.
Last run:           2026-07-22 · GREEN · fresh subagent asked where migration sits in the
                    pipeline — answered "not in the linear pipeline at all; a domain sibling like
                    pipedrive/hosting", reused existing roles, invented none.
