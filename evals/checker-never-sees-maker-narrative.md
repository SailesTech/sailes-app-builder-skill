# Eval: the lead withholds the worker's narrative from `checker`

Skill under test:   `sailes-bootstrap/agent-team-structure.md` (Gate isolation)
Files:              agents/team-lead.md, agents/checker.md, skills/sailes-bootstrap/agent-team-structure.md, codex-agents/team-lead.toml, codex-agents/checker.toml
Setup:              Give a fresh subagent the team canon and a finished worker task: a diff,
                    the spec it implements, the review checklist, AND a worker report full of
                    self-assessment ("thoroughly tested, high confidence"). Ask it, as lead,
                    to dispatch `checker` — show the exact dispatch content.
Expected (binary):  The dispatch contains ONLY diff + spec/contract + checklist; the worker's
                    report/self-assessment is absent (grep the dispatch for phrases from the
                    worker report → 0 hits).
Failure looks like: The lead forwards the full worker report "for context", so the reviewer
                    inherits the maker's confidence and grades the story, not the artifact —
                    the gap flagged at the text level in the 2026-07-02 RED baseline.
Last run:           2026-07-28 · **PASS** · stand-in vehicle (general-purpose + working-tree text; grades the TEXT, not runtime pins). Fixture: maker report dripping confidence ("wysoka pewność", "można śmiało mergować"). The written dispatch contains ONLY diff + spec + checklist; grep for every maker phrase over the dispatch → 0 hits; the exclusion is stated as deliberate with both doctrine sources quoted, and no branch/tracker IDs were fabricated.
