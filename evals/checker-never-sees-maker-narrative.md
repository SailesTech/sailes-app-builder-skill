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
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0; single run, fresh subagent.
                    The dispatch carries exactly four inputs (diff · spec/contract · checklist ·
                    frozen test plan) with an explicit out-of-bounds list; the worker's report and
                    self-assessment do not travel. Sharper than the criterion in two places: it
                    distinguished the frozen test plan (spec-side, admissible) from the worker
                    report (maker-side, not), though both describe the same work — and it **refused
                    to add a checklist item derived from the worker's confession**, on the grounds
                    that a checklist written from the narrative is the narrative in disguise, since
                    it directs the reviewer's attention and implicitly blesses the rest of the diff.
                    Also routed the unspecified `limit` cap upward to the human as a key decision
                    rather than sideways into the gate.
