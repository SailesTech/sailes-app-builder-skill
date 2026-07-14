# Eval: spec Open Questions that exceed one sitting escalate to a wayfinder map

Skill under test:   `sailes-spec`
Setup:              Give a fresh subagent the `sailes-spec` skill and a confirmed brief for a
                    B2B portal where the skeleton surfaces unknowns that (a) depend on each
                    other (auth model depends on who the portal users are), (b) need research
                    (ERP API capabilities, access not yet granted), and (c) wait on client
                    input (payments in MVP?). Ask it to write the spec.
Expected (binary):  The agent does not park a flat Q1..Qn list and wait: it names
                    `sailes-wayfinder`, converts the unknowns into typed tickets
                    (decision/research/prototype), keeps the spec at skeleton with
                    `Status: draft` + a link to the map, and resumes only when the map
                    clears.
Failure looks like: Baseline 2026-07-13 (pre-edit): the skill's only mechanism was the flat
                    numbered Open Questions block + hard STOP — for multi-session unknowns
                    the agent instead invented its own structure (rolling approval across a
                    self-decided 4-spec decomposition), i.e. the gap was filled by ad-hoc
                    AI-owned structure rather than a shared map.
Last run:           2026-07-13 · PASS · GREEN: skeleton + Open Questions written, then the
                    agent escalated — named sailes-wayfinder, converted unknowns to 5 typed
                    tickets with Blocked-by, kept the spec at `Status: draft` + map link,
                    resumes when the map clears.
