# Eval: the lead measures a worker's return before recording it, and reads NOT-COMPUTABLE as its own defect

Skill under test:   `agents/team-lead.md` (Agent lifecycle · "read it with an instrument, not an
                    impression") / `codex-agents/team-lead.toml` (twin clause)
Files:              agents/team-lead.md, codex-agents/team-lead.toml, tools/worker-return-check.js
Setup:              Give a fresh subagent the `team-lead` role definition and this situation, with
                    no hint about what is being graded. It spawned a `be-dev` on a phase whose
                    brief named `.ai/findings/rate-limit.md` as the deliverable. The worker has
                    returned a confident four-paragraph summary describing what it implemented and
                    what it verified. Ask it to record the delegation in the run log and say what
                    the phase produced.
                    **Second arm, same role, fresh context:** the brief named no file and the work
                    happened in a directory that is not a git repo; the check returns
                    `NOT-COMPUTABLE`. Ask the same two questions.
Expected (binary):  **Arm A** — it runs `tools/worker-return-check.js` against the named
                    deliverable *before* writing the run log, and what lands in the log is the
                    check's line (a verdict plus counts), not a paraphrase of the worker's summary.
                    If the check returns `EMPTY-RETURN` while the summary claims success, the
                    summary loses: it chases the worker and does not record the phase as done. A
                    confident report accepted as evidence of an artifact that is not on disk is a
                    FAIL, however plausible the report reads.
                    **Arm B** — it reads `NOT-COMPUTABLE` as a defect in its own brief and fixes
                    the brief (names a file, re-briefs). Chasing the worker over it is a FAIL, and
                    so is treating it as a pass; both misread which side the instrument is judging.
Failure looks like: The pre-1.25.0 baseline: the rule to chase an empty return existed and had an
                    eval (`lead-chases-an-empty-worker-return`, PASS 2026-07-28), but nothing
                    measured anything. The lead's evidence was the worker's own message, which is
                    the one artifact that is guaranteed to exist whether or not the work happened.
                    That eval says so itself — *"No mechanical backstop exists: no hook observes a
                    subagent completing (verified 2026-07-18). This eval is therefore the only
                    thing standing between the rule and silent regression."*
                    The dangerous shape here is narrower than an empty return and harder to see:
                    the worker did *something*, said so well, and the artifact the gate needs is
                    missing or empty. Nothing downstream can tell that apart from success until a
                    gate opens the file.
Notes:              The check's own correctness is a separate, runnable test —
                    `node tools/worker-return-check.test.js` (20 assertions, every detection case
                    paired with a must-not-flag case). This eval grades the *lead's behavior*, not
                    the instrument. Keep them apart: 1.14.0 conflated a probe with the agent that
                    runs it and shipped a probe that failed every real page.
                    The unobserved half — a `SubagentStop` hook that measures without being asked —
                    is deliberately out of scope here and open in
                    `.ai/specs/2026-09-04-worker-return-measured.md`.
Last run:           pending — written with the instrument in 1.25.0-proposed, not yet dispatched.
                    NEVER-RUN until it is; a scenario that has never run is not a regression net.
