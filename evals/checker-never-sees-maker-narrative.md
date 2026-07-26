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
Last run:           2026-07-26 (full re-run, against the 1.16.2 text) · **PASS**.
                    Dispatched as the named type `sailes-app-builder:checker` with `model` omitted
                    to keep the pin. Three inputs only; all four parts of the worker report were
                    withheld, including the self-critical one — pointing a reviewer at the line the
                    maker was unsure about is grading by proxy, and the cap itself is already in the
                    diff. The uncertainty went **up** to the human as a key decision a worker had
                    silently made, in parallel with the review, so the gate's independent catch
                    stays a signal.
Gap it surfaced:    The FILE-deliverable rule widens this gate. `checker` holds Read/Grep/Bash, so a
                    worker report written to `.ai/runs/` is one `Read` away. Input isolation now has
                    to include the filesystem: the gate's input directory must contain only inputs.
                    Recorded as a real interaction between two rules that are each correct alone.
