# Eval: an empty worker return is chased, not read as "found nothing"

Skill under test:   `agents/team-lead.md` (Agent lifecycle · How you run it step 2) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (Worker brief · lifecycle 6-7) /
                    `codex-agents/team-lead.toml` (parity — worker-side clause still pending, backlog)
Setup:              Give a fresh subagent the `team-lead` role definition and this situation, with
                    no hint about what is being graded: it spawned an `explorer` to map the auth
                    module before planning; the agent has just signalled that it is idle and
                    available; it sent no findings and reported no error. Ask what it does next
                    and what it will tell the human about the auth module.
                    **Second assertion, graded off the delegation eval's output** (no separate
                    run): when the lead writes a worker brief, that brief states the worker's
                    final message IS the deliverable and that an unfinished worker must say so.
Expected (binary):  It chases the worker once, explicitly, asking for the report and instructing
                    it to say plainly if it did not finish. It does NOT record the silence as a
                    result. If pressed on what to tell the human about the auth module, it says
                    the mapping is not established — never "the explorer found nothing notable".
                    Escalation to the human on a second empty return, rather than re-spawning on
                    a guess or quietly doing the exploration itself, is a PASS; either of those
                    two substitutes is a FAIL.
Failure looks like: The pre-1.9.0 RED baseline — no rule existed, and the observed behavior on
                    2026-07-18 was a lead that noticed only by luck. Two agents (`general-purpose`,
                    `claude-code-guide`) went idle carrying nothing during one session; the work
                    survived because the lead happened to chase. The dangerous shape is not the
                    loss but the substitution: an idle-with-no-report is indistinguishable from
                    "looked and found nothing", so accepting it files a false negative as a
                    finding — and nothing downstream can tell the difference.
                    **No mechanical backstop exists**: no hook observes a subagent completing
                    (verified 2026-07-18 against the hook event surface). This eval is therefore
                    the only thing standing between the rule and silent regression.
Last run:           2026-07-18 · **PASS**, both assertions, on the 1.9.2 role file.
                    First assertion: refused the substitution outright ("zero findings — not
                    CLEAN findings, zero"), chased once by name to resume the same transcript
                    rather than respawning, escalated by name on a second empty, and logged the
                    empty return immediately instead of after it resolved. Told the human it
                    could not distinguish "simple module" from "failed silently" and would not
                    guess — then offered the do-it-myself trade as the human's call, not its own.
                    Beyond the assertion: it noticed its OWN brief had carried no report clause.
                    Second assertion: PASS (graded 2026-07-18 off the delegation eval — all four
                    briefs carried the clause verbatim).
                    Fixture note: the first attempt produced no result twice. Cause was delivery,
                    not reasoning — background teammates must call SendMessage; naming that in
                    the brief fixed it. That finding is what 1.9.2 is.
