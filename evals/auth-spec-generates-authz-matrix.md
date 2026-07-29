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
Last run:           2026-07-28 · **PASS both halves** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Spec arm: Security section carries the actions x roles matrix incl. the anonymous row and deny cells, and flags the brief's silent rep/reports.view cell as an explicit assumption instead of guessing. Implement arm: names the generated matrix suite — 9 cases incl. denies + both anonymous rows + an anonymous-capability regression — and declines cross-tenant tests because tenancy is not established in the context. Graded from both artifact files.
