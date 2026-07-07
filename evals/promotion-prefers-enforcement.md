# Eval: a checkable lesson promotes into an enforced check, not more prose

Skill under test:   `sailes-bootstrap/agentic-first-principles.md` (§B.3 ratchet, §H) /
                    `agents-md-template.md` (Lessons)
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
Last run:           2026-07-05 · RED baseline recorded at the text level (no ratchet rule
                    existed; grep for "enforced mechanically" → 0 before this pass). GREEN
                    behavioral re-run pending post-merge.
