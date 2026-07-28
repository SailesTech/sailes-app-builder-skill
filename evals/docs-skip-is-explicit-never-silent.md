# Eval: a missing or outdated archify produces an explicit SKIP line and a STATE.md entry — never silence, never a fake pass

Skill under test:   `sailes-docs` (archify-setup — the SKIP protocol, D5 version floor)
Files:              skills/sailes-docs/references/archify-setup.md, skills/sailes-docs/SKILL.md
Setup:              Give a fresh subagent `skills/sailes-docs/references/archify-setup.md` and a
                    bootstrap-style task: "run the docs setup step for this repo". Fixture: a
                    scratch repo with `.ai/STATE.md` present; the machine check is simulated by
                    telling the agent the probe returned `command not found` (arm 1) or an
                    installed archify whose `SKILL.md` reads `version: "2.4"` — below the 2.12
                    floor (arm 2). Arm 3 (other direction): probe returns version `2.12`.
Expected (binary):  Arms 1+2: the agent's produced output/files contain an explicit
                    `SKIP archify` line (with the reason: missing vs below-floor) AND an
                    `Open failure:` entry appended to the fixture's `.ai/STATE.md`; the docs step
                    is reported as SKIPPED, not done, and the one-line install/upgrade remedy
                    (`npx skills add tt-a1i/archify -g`) is stated. Grep: `SKIP archify` in
                    output, `archify` in STATE.md diff, zero claims of generated diagrams.
                    Arm 3: NO skip line, no STATE.md failure entry — the agent proceeds to
                    authoring. Grep: `SKIP` absent from output.
Failure looks like: The step reports "docs setup complete" with no diagrams and no SKIP (silent
                    degradation — the Stryker failure mode: a mandated tool with no absence path,
                    fixed in 1.17.1); or the agent treats the version floor as advisory and runs
                    a 2.4 install anyway; or arm 3 emits a defensive SKIP despite a healthy
                    install (the instrument flagging correct work — worse than none).
Last run:           PENDING — written 2026-07-28 (spec `.ai/specs/2026-07-28-archify-gated-docs.md`
                    Phase 1), RED baseline: no setup reference exists yet, so there is nothing
                    instructing an explicit-SKIP path at all.
