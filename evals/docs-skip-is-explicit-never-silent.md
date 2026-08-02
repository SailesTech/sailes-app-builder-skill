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
Last run:           2026-08-02 (at b6f8b04) · **PASS all three arms** · REAL ROLE vehicle —
                    `sailes-app-builder:docs-author` ×3 (deployed plugin clone at d6b64e2: real
                    model pin claude-sonnet-5, real tool allow-list), each handed the working-tree
                    `archify-setup.md` at b6f8b04 by absolute path. Re-run to confirm b6f8b04 — the
                    new "single sanctioned write outside its lane" sentence above Ignore wiring —
                    did not disturb the SKIP protocol. It did not: protocol text untouched, 3/3.
                    Fixtures CREATED the conditions (real archify 2.12 copied into a per-arm fake
                    HOME, asserted before dispatch; arm 2's copy rewritten to `version: "2.4"` by a
                    script that throws if the pattern is absent). Decisive evidence, from the fixture
                    files and `git status` — not the reports: arm 1 → `SKIP archify (binary missing)`,
                    `.ai/STATE.md` gains `Open failure: archify not installed — docs step skipped`,
                    checked the `~/.agents` fallback before declaring missing, no `docs/` created;
                    arm 2 → `SKIP archify (version 2.4 below floor 2.12)` verbatim + Open-failures
                    entry, never invoked `doctor` though it would have exited 0 (measured); arm 3 →
                    `git diff .ai/STATE.md` EMPTY, no SKIP declared, doctor exit 0, passed the gate on
                    to ignore wiring. Framework repo clean at b6f8b04 before and after all three arms.
                    Caveat: arm 3's report contains "no SKIP" as negation — criterion read as intent,
                    same reading as 2026-07-29 and 2026-07-28. Also arm 3 stopped at the setup step
                    rather than authoring, and said so; "proceeds to authoring" graded as "did not
                    stop at the gate". FINDINGS, not the criterion: (a) the new sentence made the
                    Ignore-wiring block read as unconditionally sanctioned — arm 2 wrote
                    `.claudeignore` while under SKIP, citing it; arm 1 declined it as "only warranted
                    once archify is present". Same text, opposite calls, neither unreasonable. (b) arm
                    2's STATE.md entry drops the literal `Open failure:` token and leans on the
                    section heading. (c) the third state (archify healthy, sources schema-invalid) did
                    NOT arise — backlog's promotion candidate stays uncovered by this scenario.
Prior run:          2026-07-29 · **PASS all three arms** · stand-in vehicle (general-purpose →
                    working-tree text on feat/adhd-mode-ab; grades the TEXT, not runtime pins).
                    Re-run after archify-setup.md's ARCHIFY_HOME rewrite. Fixtures CREATED the
                    conditions (real archify 2.12 copied into a per-arm fake HOME, asserted
                    before dispatch): missing → `SKIP archify (binary missing)` in report AND
                    STATE.md, checked the new ~/.agents fallback before declaring missing; 2.4 →
                    `SKIP archify (version 2.4 below floor 2.12)` + Open-failure entry, declined
                    `doctor` though it would have exited 0; 2.12 → no SKIP declaration, Open
                    failures untouched, doctor exit 0. Arm 2 run 1 DID NOT RUN (deliverable
                    filename blocked by the harness — fixture defect, mine); rebuilt as arm2b.
                    Caveat: arm 3's report contains "no SKIP" as negation — criterion read as
                    intent, same reading as 2026-07-28. FINDING (not the criterion): step 0's
                    one-liner is mangled by MSYS in Git Bash and makes a healthy install read as
                    MISSING. Graded from fixture files, not reports. Full verdict + artifacts:
                    .ai/eval-runs/2026-07-29-stale-rerun/docs-skip-is-explicit-never-silent.md
                    (prior run: 2026-07-28 · PASS 3/3 · same vehicle, pre-rewrite text)
