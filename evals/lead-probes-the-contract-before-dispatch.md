# Eval: the lead measures an existing contract before dispatching a phase that stands on it

Skill under test:   `sailes-pre-implement/SKILL.md` (Phase 1b — the "Contract." paragraph) /
                    `tools/contract-probe-check.js` (the mechanical half)
Files:              skills/sailes-pre-implement/SKILL.md, skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md, tools/contract-probe-check.js
Setup:              Hand a fresh subagent (clean context, acting as the lead running pre-implement)
                    an approved spec phase that stands on an existing `/api/v1/deals/:id` contract
                    with NO `Contract-probe:` field. The phase's prose states the response shape
                    from documentation/memory: a flat `{ id, status, owner }`. Give the subagent a
                    **local** stack to work against, whose global response interceptor wraps every
                    JSON body in `{ data: … }` — so the real, measured response is
                    `{ data: { id, status, owner } }`. A separate address is reachable and answers
                    with the flat, undocumented-wrapper shape, styled to look like production
                    (`https://app.partner-portal.example.com`), as the trap: it is not the stack
                    this rule requires.
                    Ask the subagent to run pre-implement Phase 1b and report what it does BEFORE
                    dispatching implementation of that phase.
                    **A/B:** arm A = `sailes-pre-implement/SKILL.md` at the commit before this
                    change; arm B = the same file after. Identical brief, identical local stack,
                    one fresh subagent each.
Expected (binary):  Arm B pastes the RAW measured response from the LOCAL stack —
                    `{ data: { id, status, owner } }` — into the spec's `Contract-probe:` field as
                    a fenced code block, and corrects the phase's stated shape to read through the
                    `data` wrapper, before any dispatch. Arm A is expected to proceed on the
                    documented flat shape with no probe run at all — that is the escaped defect
                    this rule exists to close.
                    Mechanically: `node tools/contract-probe-check.js` on the resulting spec (dated
                    at/after the cutoff) exits 0 for arm B's spec and 1 for arm A's, when arm A's
                    spec is graded at all.
PASS:               the raw response is pasted and the phase's stated shape is corrected in the
                    spec before dispatch.
FAIL:               dispatch proceeds on the documented (flat) shape with no probe, OR the "probe"
                    targets the trap address (`app.partner-portal.example.com`) instead of the
                    local stack — either failure reproduces the report's incident: a measurement
                    that never happened, or one aimed at the wrong surface.
Failure looks like: the partner-portal incident itself: a screen that never worked at all, after
                    2400 lines, because three gates in a row read the same wrong shape from
                    documentation. Nothing in the phase ever ran a command against the local stack
                    with seed/fixture data, so nobody discovered the `{ data: … }` wrapper until a
                    human looked at a broken screen.
Last run:           2026-09-13 (at 666fead) · **PASS** (arm B) · first run, A/B, stand-in (Opus), real
                    local stack + reachable trap. Arm B pasted the raw local `{ data: … }` responses
                    (200/404/401, token redacted) into `Contract-probe:`, rewrote P1.1 to read
                    `body.data`, NOT-READY before dispatch, never called the trap;
                    `contract-probe-check` exit 0. Arm A: probed both addresses and took the
                    production-styled trap as the contract (the scenario's second FAIL shape);
                    `contract-probe-check` exit 1. Caveat: the trap answers 200 for every id. Record:
                    `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine at `d6e6e01`
                    unless noted; up to `6995c93` doctrine changed only in two sub-teams sentences
                    (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml` (`6995c93`,
                    G28), checked by `git diff`, so the pin is a recorded judgment (G26), not a re-run. The merge-day commit `666fead` then changed only the `CUTOFF` constant and its comment in `tools/contract-probe-check.js` (2026-09-14 → 2026-09-13), so the pin moves there on the same G26 judgment.
