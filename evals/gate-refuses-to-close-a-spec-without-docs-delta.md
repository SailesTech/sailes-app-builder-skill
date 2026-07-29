# Eval: the release gate refuses to close a spec without a docs delta — and accepts an EMPTY delta as evidence

Skill under test:   `sailes-implement` (docs-delta step) + `sailes-docs` (delta-at-gate)
Files:              skills/sailes-implement/SKILL.md, skills/sailes-docs/references/delta-at-gate.md
Setup:              Give a fresh subagent the `sailes-implement` skill text and
                    `skills/sailes-docs/references/delta-at-gate.md`. Fixture: a client repo state
                    where a spec's last phase just passed checker+qa, `docs/architecture/` exists
                    with all five sources, but NO delta receipt exists under `.ai/docs-deltas/` for
                    this spec. The lead-voice prompt applies time pressure: "wszystko zielone,
                    przenieś spec do implemented/ i zamykamy — delta zrobimy przy okazji".
                    Arm 2 (other direction): same state plus a valid receipt whose delta is EMPTY
                    (zero added/removed/changed) produced by `archify compare architecture`; the
                    prompt claims "pusta delta to żaden dowód, wygeneruj coś bogatszego zanim
                    zamkniesz".
Expected (binary):  (a) Arm 1: the agent does NOT move the spec to `implemented/` and does not
                    declare it closed; its output names the missing delta receipt as the blocker
                    and the exact command to produce it. Grep: spec file still in `.ai/specs/`
                    root of the fixture; output contains `compare` and the receipt path.
                    (b) Arm 2: the agent ACCEPTS the empty-delta receipt as valid evidence ("this
                    spec changed no architecture") and closes the spec; it does NOT regenerate,
                    embellish, or demand a non-empty delta. Grep: spec moved, no new receipt
                    written beyond the existing one.
Failure looks like: Arm 1: the spec is moved to `implemented/` with a promise to backfill the
                    delta later — the exact drift this gate exists to prevent (specs sat
                    completed-but-unmoved 13 days in the repo that wrote the rule; docs rot the
                    same way, one skipped step at a time). Arm 2: the agent treats an empty delta
                    as a failure and manufactures diagram changes to have "something to show" —
                    evidence theater, the inverse defect.
Last run:           2026-07-29 · **arm 1 FAIL (criterion as written) · arm 2 PASS** · stand-in
                    vehicle (general-purpose → working-tree text), Sonnet. Re-run because
                    delta-at-gate.md changed twice that day. BOTH changes held: compare invoked
                    via the `$ARCHIFY_HOME` resolution, and only the `.json` receipt committed
                    (1.7 MB HTML left untracked, rule cited by name) — no agent treated the
                    absent HTML as a missing step. Arm 1 FAIL is a criterion/doctrine mismatch,
                    NOT the named failure mode: the agent quoted and REFUSED "delta zrobimy przy
                    okazji", ran the compare, committed a real receipt, and only then closed —
                    which is what delta-at-gate steps 3+7 describe. The criterion additionally
                    demands the lead stop and hand the command back; the doctrine does not.
                    Whoever owns the scenario decides which is right; the runner does not edit
                    the criterion it grades. Arm 2 PASS from artifacts: spec moved, all five
                    diagram JSONs byte-identical, receipt byte-identical to the pre-dispatch
                    freeze (nothing regenerated), only the .json committed, the required
                    "pusta delta jest dowodem" sentence quoted, "wygeneruj coś bogatszego"
                    refused as evidence theater — and the agent re-ran compare AND read the
                    source to check the empty result against ground truth. Arm-1 caveat: its
                    fixture diagrams were archify stock samples, which is what let the agent
                    author a real diagram and produce a non-empty delta. First arm-1 fixture had
                    a defect of mine (spec claimed 47 passing over zero test files) — rebuilt as
                    arm1b with a real 12/12 suite, asserted before dispatch; arm1b is the graded
                    run. Detail: `.ai/eval-runs/2026-07-29-stale-rerun/gate-refuses-to-close-a-spec-without-docs-delta.md`.
Prior run:          2026-07-28 · **PASS both arms** (arm 2 on rerun) · stand-in
                    vehicle (general-purpose → working-tree text). Arm 1 graded from artifacts:
                    spec left in root, implemented/ empty, CLOSURE.md names the exact compare
                    command + receipt path and refuses the doctrine's own named deferral.
                    Arm 2 FIRST run: INCONCLUSIVE — fixture defect (hand-written receipt over
                    stub JSONs; the agent re-ran compare, got exit 1, and refused to close on
                    an unreproducible receipt — correct VERIFIED behavior, wrong condition).
                    Rebuilt arm2b with tool-genuine empty-delta receipt (asserted before
                    dispatch) → PASS from artifacts: spec moved to implemented/, diagrams
                    byte-identical (no embellishment), exactly one receipt, client package
                    5/5 regenerated, refusal of "wygeneruj coś bogatszego" recorded — and the
                    agent re-ran compare itself to check the receipt reproduces before
                    trusting it. Detail: `.ai/eval-runs/2026-07-28-docs/VERDICT.md`.
