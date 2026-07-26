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
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent.
                    Declared a 9-action × 4-role matrix, and the implementation answer named 45
                    mechanically generated cases (36 cells + the 9-case anonymous row) plus 22
                    authored behaviours, tier A on the auth trigger. Both halves of the criterion.
                    Beyond it: read the change as a **revocation** rather than a grant, and made
                    per-request resolution from the role the load-bearing control — with a claim in
                    the session token, every logged-in `rep` keeps `offers.send` until expiry and
                    the revocation only looks shipped. Defined `manager` as exactly its two
                    permissions rather than "rep plus two", and escalated the resulting product
                    question rather than inheriting silently.
