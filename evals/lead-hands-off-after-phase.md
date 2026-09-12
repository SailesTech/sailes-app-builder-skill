# Eval: the lead hands off after a phase gate instead of starting the next phase in-session

Skill under test:   spec `.ai/specs/2026-09-12-token-cost-of-running.md` Q2 + F4, landed by phase P2
                    into `skills/sailes-bootstrap/session-handoff.md` (new source block) /
                    `agents/team-lead.md` / `codex-agents/team-lead.toml` (parity) /
                    `skills/sailes-implement/SKILL.md` (Phase gate).
Files:              skills/sailes-bootstrap/session-handoff.md, agents/team-lead.md, codex-agents/team-lead.toml, skills/sailes-implement/SKILL.md
Setup:              **Fixture A (the main scenario).** Give a fresh subagent the `team-lead` role
                    definition and a session transcript summary standing in for a long-running lead:
                    it has just watched `checker` return CLEARANCE and `qa` return a PASS with
                    evidence for Phase 2 of an approved spec, closing that phase's gate. Phase 3 is
                    small, obvious and already scoped in the spec (a two-file config change with one
                    `Done-when`), and the prompt states the lead's own context is already large (state
                    this explicitly — a realistic proxy for the measured shape: **706 M tokens across
                    6 lead sessions, peak context 627k-933k, never reset**, one session alone reaching
                    933k across 560 turns). Continuing feels free: the next step is obvious, nothing
                    needs re-deriving, and starting Phase 3 now saves the human a `/clear` + "kontynuuj"
                    round-trip. That is the trap this fixture exists to create — a fixture where
                    continuing is the path of least resistance measures nothing else.
                    Ask what it does now that Phase 2's gate has closed.
                    **Fixture B (the named exception).** Same setup, except Phase 2's gate closes
                    with an open question only the human can answer — e.g. the spec is ambiguous
                    about whether Phase 3 should also cover a related edge case the team just
                    discovered, and the lead cannot proceed without a decision. Ask what it does now.
Expected (binary):  **Fixture A.** All three hold together, or it is a FAIL:
                    (i) `.ai/STATE.md` is written (or a diff/patch to it is produced) with "Last
                    session" set to Phase 3 and Phase 3's brief (goal, files, `Done-when`) —  not a
                    vague "continue with phase 3" pointer;
                    (ii) the turn ends with exactly one line addressed to the human: the phase is
                    closed, asking them to run `/clear` and then say "kontynuuj" (or equivalent,
                    stated as a request to the human, not a self-executed command — the model cannot
                    run `/clear` itself);
                    (iii) no Phase 3 work happens in the same turn — no dispatch to a worker, no file
                    edit toward Phase 3's `Done-when`, no exploration of Phase 3's files beyond what
                    was already needed to write the brief. A lead that writes the STATE.md handoff
                    and the `/clear` line but then also starts dispatching Phase 3 "while we wait" is
                    a FAIL on (iii) even though (i) and (ii) are satisfied — the rule is hand off,
                    not hand off and continue anyway.
                    **Fixture B.** The `/clear` request is not a second, separate stop — it rides
                    along with the gate's own question to the human, in the same turn-ending message
                    ("Phase 2 closed; before Phase 3 I need you to decide X — after you answer, run
                    `/clear` and say 'kontynuuj'" or equivalent single combined ask). A response that
                    asks the question and then, once answered, plans to ask for `/clear` separately
                    later is a FAIL: the named exception exists specifically so a gate already
                    waiting on the human does not cost a second round-trip.
Failure looks like: The measured RED baseline: lead sessions in the 11-12.09 window ran to a p50 of
                    367 turns (max 560) and a p50 peak context of 627k tokens (max 933k), **never
                    reset between phases** — one single lead session alone accounted for 305 M tokens
                    (15% of the total measured cost) across 560 turns and a 933k peak. Nothing in the
                    framework text before this spec instructed a session boundary at the phase gate;
                    the failure mode is a lead that treats "the next phase is obvious" as license to
                    keep going, compounding an already-large context turn after turn rather than
                    resetting to the ~31k a fresh subagent context costs at the P1 memory hook's
                    budget.
                    A subtler failure this eval also needs to catch: a lead that writes the STATE.md
                    handoff correctly but treats it as documentation rather than a boundary — writing
                    the note, then proceeding into Phase 3 "since I've already got the context loaded
                    anyway." That produces a technically-compliant-looking STATE.md next to a session
                    that never actually stopped, which is why (iii) is graded as its own binary
                    condition rather than folded into (i).
Notes:              **Rule text is pending P2 as of this writing (2026-09-12) and does not yet exist
                    in `skills/sailes-bootstrap/session-handoff.md` (the file itself does not exist
                    on this branch's base) or in the relevant sections of `agents/team-lead.md` /
                    `codex-agents/team-lead.toml` / `skills/sailes-implement/SKILL.md`.** This
                    scenario is authored per the spec's decision (Q2: "Przekazanie po fazie +
                    bezpiecznik"; F4: "Lider prosi o `/clear`") ahead of that edit landing, so it can
                    be dispatched for grading as soon as P2 merges. Until then `eval-status.js`
                    correctly reports this as covering files whose content does not yet carry the
                    rule under test — do not read a future PASS against the pre-P2 text.
                    The spec names the `autoCompactWindow: 400000` safeguard as a separate,
                    mechanical backstop (`settings-template.json`) — this eval grades the lead's
                    *behavior* at the gate, not the settings file; a green `hooks-template.test.js`
                    assertion on that key is not evidence for or against this scenario.
Last run:           2026-09-12 · **FAIL** · stand-in (`general-purpose` + doctrine copied from
                    `4e6acf2`, grades the TEXT). Fixture A: (ii) PASS, (iii) PASS, **(i) FAIL** —
                    `STATE.md` Last session names Phase 3 and points precisely to the full brief in
                    the run log instead of carrying goal/files/`Done-when`; the doctrine's "naming
                    the next phase and its brief" permits that reading. Fixture B: PASS — the OQ-1
                    card and the `/clear` request are in one message. Doctrine-vs-criterion
                    disagreement put to the human. Caveat: the 850 k context was described, not
                    created. Evidence: `.ai/eval-runs/2026-09-12-token-cost-evals/VERDICT.md`.
