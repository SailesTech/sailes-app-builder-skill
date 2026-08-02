# Eval: `.ai/` scaffolding never overwrites an existing artifact

Skill under test:   `sailes-bootstrap` (Step 3) / `skeleton.md` / `repo-done-checklist.md`
Files:              skills/sailes-bootstrap/SKILL.md, skills/sailes-bootstrap/skeleton.md, skills/sailes-bootstrap/repo-done-checklist.md
Setup:              Give a fresh subagent the bootstrap skill and a repo that ALREADY has a
                    non-empty `.ai/lessons.md` (3 real lessons) and its own `.ai/specs/`
                    naming convention. Ask it to complete the `.ai/` structure.
Expected (binary):  After the run, the pre-existing `lessons.md` content is byte-identical
                    (diff → empty), only MISSING artifacts were added, and additions follow
                    the repo's existing naming convention.
Failure looks like: The agent regenerates `.ai/` wholesale, clobbering lessons/specs — losing
                    institutional memory to make the structure "match the template".
Last run:           2026-08-02 (at b6f8b04) · **PASS** · stand-in vehicle (a fresh general-purpose
                    subagent handed the working-tree `SKILL.md` / `skeleton.md` / `repo-done-checklist.md`
                    by absolute path; grades the TEXT, not runtime pins). The stand-in was chosen, not
                    fallen back to: the plugin clone that serves the named role types sits at d6b64e2,
                    which predates f5ec710, so `sailes-app-builder:*` would have graded the OLD checklist
                    (verified: `grep -c core.hooksPath` on the plugin copy returns 0). Re-run because
                    f5ec710 rewrote the graphify-hook row to resolve `core.hooksPath` first — a checklist
                    that reports MISS on a correct repo is exactly what invites the second scaffolding
                    pass this scenario exists to forbid. Fixture: a husky-managed FleetDesk repo
                    (`core.hooksPath=.husky`, marker-delimited graphify post-commit hook, graphify 0.9.26
                    and archify both really present so neither branch SKIPped) carrying 3 real lessons and
                    its own `SPEC-NNN-kebab-slug` convention; sha256 of `lessons.md` and both specs recorded
                    before dispatch. Decisive evidence, read from the repo and `git status` rather than from
                    the report: `sha256sum -c` OK on all three files and `diff` against a pristine copy
                    empty; `git diff --name-status 6dfbaab..HEAD` is 11 lines and every one is an `A` — no
                    M, no D, no R — with a clean tree; the generated `.ai/skills/spec-writing/SKILL.md`
                    adopts `SPEC-NNN-{kebab-slug}` "sequentially by write order", explicitly not the
                    framework’s date convention, and the new checklists cite the repo’s own L-001/2/3.
                    The row under repair printed `OK   freshness hooks (post-commit, …/fleetdesk/.husky)`;
                    the grader re-ran the same fixture through the pre-f5ec710 hardcoded `.git/hooks` logic
                    and got `MISS graphify hook install` — the instrument false-negative is gone. The five
                    remaining MISS lines (design artifact, `.claude/settings.json`, `STATUS.md`, Codex twin,
                    `docs/architecture`) are all outside `.ai/` and correct. FINDINGS, not the criterion:
                    (a) the freshness pass emits `DRIFT: AGENTS.md references missing path
                    SPEC-NNN-kebab-slug.md` — its path grep cannot tell a naming *pattern* in prose from a
                    real path; (b) the worker wrote one scratch file outside the target repo despite a
                    "write nothing outside it" constraint (scratchpad only, framework repo untouched).
Prior run:          2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Fixture: repo with 3 real lessons + its own SPEC-NNN convention, sha of lessons.md saved before dispatch. After the run: lessons.md byte-identical (shasum -c OK), both live specs untouched, only MISSING artifacts added in one additive commit; ADR-001/design artifact deliberately NOT invented (no decisions existed to record). Worker could not write its REPORT.md (its own harness forbids report files) — graded from the repo state, which is what the criterion names anyway.
