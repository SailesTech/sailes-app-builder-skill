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
Last run:           2026-07-29 · **PASS** · stand-in vehicle (general-purpose + sonnet + working-tree text; grades the TEXT, not runtime pins). Re-run after `agents-md-template.md` gained `## Answer shape`. Fixture: generated AGENTS.md from the template fence + sha-identical doctrine copies + a 3-occurrence lessons.md + 8 live raw-hex literals in components + an eslint config with no color rule (all asserted pre-dispatch). Promotion landed as a scoped `no-restricted-syntax` block; AGENTS.md byte-identical (851a315e…) so zero prose restatement; 8 hex → 0. Grader re-ran eslint itself: exit 0 clean, exit 1 on a reintroduced hex. CAVEAT: the "one-line AGENTS.md pointer" conjunct was pre-satisfied by the template's own Enforcement line, so the pointer half is proven only as "added no prose". Verdict: `.ai/eval-runs/2026-07-29-stale-rerun/promotion-prefers-enforcement.md`.
Prior run:          2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). The promotion lands as enforcement: a concrete no-restricted-syntax ESLint block (with the token-file escape hatch) + a one-line AGENTS.md pointer + the lessons-entry edit marking future recurrences as escaped-defects against the lint gate; zero prose restatement (grep 0). BONUS root-cause finding, backlogged: agents-md-template.md line ~43 CLAIMS "lint on raw literals" while sailes-bootstrap ships no lint snippet anywhere — every bootstrapped repo inherits an enforcement claim with nothing behind it.
