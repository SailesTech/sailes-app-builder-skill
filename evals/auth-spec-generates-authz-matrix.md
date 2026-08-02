# Eval: an auth-touching spec produces per-role allow/deny matrix tests

Skill under test:   `sailes-spec` + `spec-writing-template.md` (Security section) /
                    `sailes-implement` (step 3) / `security-checklist.md`
Files:              skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md, skills/sailes-implement/SKILL.md, skills/sailes-bootstrap/security-checklist.md
Setup:              Give a fresh subagent the spec template and a brief adding a "manager"
                    role with `offers.send` + `reports.view` (admin keeps all; rep loses
                    `offers.send`). Ask for the spec's Security section, then ask a second
                    fresh subagent (with `sailes-implement`) what tests the phase generates.
Expected (binary):  (1) The spec declares a permission matrix table (actions × roles →
                    allow/deny). (2) The implementation answer names a generated matrix
                    suite: every action × role asserted INCLUDING deny cases and the
                    anonymous row — not only happy-path permission checks.
Failure looks like: Permission checks implemented and only happy-path tested — deny paths
                    unasserted, so a role regression ships silently. (Pre-2026-07-05 RED
                    baseline: no matrix concept existed in the templates; grep "matrix" → 0.)
Last run:           2026-08-01 · **PASS both halves** · stand-in, re-run after the 1.26.0 edits to
                    `sailes-spec` and `sailes-implement`.
                    Half 1 (spec): full matrix, 6 actions × 4 rows with the **anonymous row as real
                    assertions**, and `admin` asserted against the enumerated action list rather
                    than six hardcoded cells so "admin = everything" survives new actions. Treated
                    the `rep` revocation as the load-bearing half — adding a role fails visibly,
                    removing a grant from a populated role fails **silently in the user's favour**
                    via a stale cached claim — and required a positive 403 test rather than the
                    absence of an allow test. Left four cells the brief never pinned as explicit
                    unknowns rather than inventing them.
                    Half 2 (implementation): **24 assertions, not 18** — six actions × three roles
                    plus the anonymous row — with cross-org denial flagged as required-if-multi-
                    tenant. Named the structural catch the matrix exists for: it is **non-monotonic**
                    (rep may edit deals, manager may not), so a rank-comparison implementation
                    (`level >= MANAGER`) satisfies 23 of 24 cells and fails exactly one. That single
                    assertion is what proves the authz is capability-based rather than hierarchical.
                    Artifacts: `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/authz-arm1-spec.md`, `…-arm2-tests.md`.

Prior run:          2026-07-28 · **PASS both halves** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Spec arm: Security section carries the actions x roles matrix incl. the anonymous row and deny cells, and flags the brief's silent rep/reports.view cell as an explicit assumption instead of guessing. Implement arm: names the generated matrix suite — 9 cases incl. denies + both anonymous rows + an anonymous-capability regression — and declines cross-tenant tests because tenancy is not established in the context. Graded from both artifact files.
