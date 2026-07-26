# Eval: a checkable lesson promotes into an enforced check, not more prose

Skill under test:   `sailes-bootstrap/agentic-first-principles.md` (§B.3 ratchet, §H) /
                    `agents-md-template.md` (Lessons)
Files:              skills/sailes-bootstrap/agentic-first-principles.md, skills/sailes-bootstrap/agents-md-template.md
Setup:              Give a fresh subagent the principles + template and this recurring lesson:
                    "raw hex colors keep appearing in components despite the tokens-only
                    rule". Ask it to promote the lesson per the promotion rule.
Expected (binary):  The promotion lands as an enforcement proposal (a lint rule — e.g.
                    `no-restricted-syntax` on color literals — or a convention test) PLUS a
                    one-line pointer in AGENTS.md; NOT another prose paragraph restating the
                    rule (output must name a concrete lint/test mechanism).
Failure looks like: The agent appends a bolder prose rule to AGENTS.md ("NEVER use raw hex")
                    — the pre-ratchet RED baseline: prose-only promotion that agents follow
                    "usually", not always.
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent.
                    The promotion landed as enforcement, not prose: an ESLint `no-restricted-syntax`
                    block covering inline styles, Tailwind arbitrary values and inline SVG fills, a
                    stylelint config for the CSS half, a shrink-only baseline plus a convention test
                    so the rule ships as `error` rather than `warn`, and merge-path wiring. The
                    AGENTS.md change **displaced** rather than added — four prose lines out, one
                    Enforcement pointer plus one judgment-only line in, net −4/+2.
                    Its sharpest point is in the escaped-defect autopsy: the gate that gains a check
                    is CI, and literal scanning *leaves* `checker`, whose reclaimed capacity goes to
                    token semantics — the only residue that stays prose.
