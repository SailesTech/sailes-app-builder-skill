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
Last run:           2026-09-13 (at 4265fc3) · **PASS** · stand-in (Opus). Domain sibling like
                    `sailes-pipedrive`/`sailes-hosting`, not a pipeline phase (Red Flag quoted),
                    existing roles reused, schema migrations routed to `sailes-database`. Record:
                    `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine at `d6e6e01`
                    unless noted; up to `6995c93` doctrine changed only in two sub-teams sentences
                    (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml` (`6995c93`,
                    G28), checked by `git diff`, so the pin is a recorded judgment (G26), not a re-run. AGENTS.md then changed only its `Framework-Version:` stamp line (`4265fc3`), so this pin moves there on the same G26 judgment.

Prior run:           2026-07-29 · **PASS** · stand-in vehicle (general-purpose + byte-identical copies of the working-tree files at `feat/adhd-mode-ab` 888b7ce; grades the TEXT, not runtime pins or tool allow-lists). Re-run after the two skill-table rows + the `## Answer shape` section made it STALE; positioning survives unchanged — "domain sibling ... obok pipeline'u, nie w nim", the pipeline rendered with migration absent, the skill's own Red Flag quoted against wiring it in as a phase, and the six steps mapped onto explorer/team-lead/be-dev/fe-dev/checker/tester/qa with no new role invented. Verdict + graded artifact: `.ai/eval-runs/2026-07-29-stale-rerun/`. Single arm, one Polish phrasing; establishes nothing about runtime, nothing about `main`, and attributes nothing to the `Answer shape` change.
                    2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Positions sailes-migrate as an independently-invocable domain sibling (pipedrive/hosting family), never a numbered pipeline phase — quoting the skill's own Red Flag against that; reuses existing roles; the judge-before-fan-out invariant stated as the hard rule; correct refusals to route DB-schema migrations (sailes-database) and broken systems (sailes-diagnose) into it.
