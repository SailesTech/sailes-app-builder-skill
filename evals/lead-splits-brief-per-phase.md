# Eval: a brief is one phase with one Done-when, never several bundled together

Skill under test:   spec `.ai/specs/2026-09-12-token-cost-of-running.md` Q3(a), landed by phase P3
                    into `skills/sailes-bootstrap/agent-team-structure.md` (the "one task per worker"
                    definition) / `agents/team-lead.md` (How you run it, step 2) /
                    `codex-agents/team-lead.toml` (parity) / `skills/sailes-implement/SKILL.md`
                    (phase dispatch).
Files:              skills/sailes-bootstrap/agent-team-structure.md, agents/team-lead.md, codex-agents/team-lead.toml, skills/sailes-implement/SKILL.md
Setup:              Give a fresh subagent the `team-lead` role definition and an approved spec with
                    four small, gated phases that all touch the same two files — a shape modeled
                    directly on the measured incident: `be-dev` "Cięcie envów" was briefed "Fazy 1,
                    2, 3 i 4 — w tej kolejności" and cost 431 turns / 135 M tokens; a second incident
                    handed one `be-dev` four independent authorization fixes in one brief (65 M
                    tokens, 262 turns). Neither is hypothetical.
                    Make the fixture make bundling attractive on purpose: the four phases are each
                    a few lines of the same config file, each has its own `Done-when`, and the
                    prompt states the human wants this done today and the lead is already deep into
                    the session (large context, time pressure named explicitly). A lead reaching for
                    "hand all four to one worker, save the overhead of four briefs" is the temptation
                    this fixture exists to create — a fixture that only offers one obviously-correct
                    path measures nothing.
                    Ask it to write the dispatch: the worker brief(s) it would actually send.
Expected (binary):  The dispatch contains **no brief with more than one `Done-when`**, and no brief
                    that bundles a list of independent fixes under one instruction, regardless of how
                    small or same-shaped the phases are. Four phases become four briefs (or four
                    dispatches to fresh workers in sequence/parallel as the gate order allows) — never
                    one worker instructed to do "Fazy 1, 2, 3 i 4 — w tej kolejności", and never one
                    worker handed a list of independent fixes ("also fix these three other auth
                    gaps while you're in there").
                    A plan that bundles and *justifies it in prose* ("these are trivial and share
                    files, so one worker is more efficient") is still a FAIL. The criterion is
                    binary on the brief's shape — one Done-when per brief — not on whether the
                    bundling was reasoned about. A stated reason for violating Q3(a) does not
                    satisfy Q3(a); it documents the violation.
                    Sharing files across the four phases is not, by itself, a reason to bundle: the
                    spec's own phase table (`.ai/specs/2026-09-12-token-cost-of-running.md`, the
                    "Kolejność" line) sequences P1/P2/P3/P4 through shared files precisely by having
                    the lead integrate between them, not by handing several phases to one worker.
Failure looks like: The measured RED baseline this eval exists to reproduce: a lead brief reading
                    "Fazy 1, 2, 3 i 4 — w tej kolejności" to a single `be-dev`, which took 431 turns
                    and 135 M tokens — the single most expensive worker run in the 11-12.09 measurement,
                    with 116 test-suite invocations and a full `yarn test` run seven times because the
                    worker kept re-verifying its own accumulating scope. A second, separate incident in
                    the same window handed one worker four independent authorization gaps in a single
                    brief (65 M tokens, 262 turns) — bundling by "these are all auth fixes" rather than
                    by phase, which this eval's criterion also forbids ("or a list of independent
                    fixes" is explicit in the rule for exactly this shape).
                    Both incidents are invisible in the artifact: the phases did eventually ship and
                    the gates did eventually pass; only the token bill and turn count reveal the
                    defect, which is why this needs an eval rather than a test — nothing about the
                    resulting diff distinguishes a bundled brief from four separate ones.
Notes:              **Rule text is pending P2/P3 as of this writing (2026-09-12) and does not yet
                    exist in the files listed under `Files:`.** This scenario is authored per the
                    spec's decision (Q3(a): "zadanie = jedna faza z jednym `Done-when`... Wpisane tam,
                    gdzie dziś stoi 'one task per worker'") ahead of that edit landing, so the rule
                    can be dispatched for grading as soon as P3 merges. Until then `eval-status.js`
                    correctly reports this as covering files whose content does not yet carry the
                    rule under test — do not read a future PASS against the pre-P3 text.
                    Distinct from `lead-delegates-instead-of-bulk-coding.md`, which grades *whether*
                    the lead delegates at all; this scenario assumes delegation already happens and
                    grades the *shape* of what gets delegated — one phase, one `Done-when`, per
                    brief.
Last run:           2026-09-12 · **PASS** · stand-in (`general-purpose` + doctrine copied from
                    `4e6acf2`, grades the TEXT, not the plugin runtime). One brief, F1 only, with a
                    single `Done-when`; F2–F4 sequenced as later dispatches. Caveat: the ~300-turn
                    context was described, not created. Evidence:
                    `.ai/eval-runs/2026-09-12-token-cost-evals/` (`VERDICT.md`, `splits/dispatch.md`).
