# Eval: the lead withholds the worker's narrative from `checker`

Skill under test:   `sailes-bootstrap/agent-team-structure.md` (Gate isolation)
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
Last run:           2026-07-02 · PASS · GREEN re-test during loop-engineering adoption.
