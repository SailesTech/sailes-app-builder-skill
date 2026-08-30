# Eval: a contract-shaped change produces a contract-weight spec, not the full template

Skill under test:   `skills/sailes-bootstrap/spec-weight.md` (the sync-block source) and its three
                    stamped consumers
Files:              skills/sailes-bootstrap/spec-weight.md, skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md, skills/sailes-pre-implement/SKILL.md, tools/blocks.json
Setup:              Hand a fresh subagent (clean context) the spec-writing skill and a brief whose
                    shape is unambiguously a contract fix — a webhook field widening from `string`
                    to `string | string[]`, same column, no migration, one route, no UI, co-owner
                    storage explicitly out of scope. Tell it scope is signed off and nobody is
                    available to answer questions. Ask for the **complete spec**.
                    **A/B:** arm A = the skill before `spec-weight`; arm B = after.
Expected (binary):  Arm B declares a `Weight:` line and writes the contract-fix form — five
                    sections — with the remaining required sections **disposed of, not dropped**:
                    each written `n/a` with its reason. A spec that simply omits them FAILS: the
                    rule is weight goes down, never out, and an omission nobody can see is the
                    failure mode the whole `Status:`/`qa: n/a` family exists against.
                    Arm A is expected to produce the full template.
                    Measured on the graded run: 13 sections → 5, 15,102 bytes → 6,719.
Discriminates on:   disposition, not length. A shorter spec that silently skipped Security and Data
                    Model would score better on bytes and fail this eval. Read the `n/a` lines
                    before reading the size.
Failure looks like: `wnioski z wdrożeń/2026-08-30-wnioski-o-testach-i-procesie.md` §4: **365 lines
                    of spec for ~50 lines of code**, on a change that was a contract fix, with
                    "osiem numerowanych sekcji poprawek" accumulated because the document was being
                    patched in place instead of rewritten. The subtler failure in the other
                    direction: a spec that reads `Weight: contract-fix` and then writes all eleven
                    sections anyway — the label applied without the behavior.
Last run:           2026-08-30 · PASS · arm B passes, arm A fails — single run per arm, stand-in
                    vehicle (fresh generic subagent + working-tree text; grades the TEXT, not
                    runtime pins). 56% smaller, sections 13→5, `Weight: contract-fix` declared, and
                    every omitted section carried a one-line `n/a` with a reason. Note the probe
                    dimension was a TIE on this fixture — both arms wrote a deployed `curl`
                    unprompted, which is recorded rather than smoothed over. Full record:
                    `.ai/eval-runs/2026-08-30-spec-weight/VERDICT.md`.
