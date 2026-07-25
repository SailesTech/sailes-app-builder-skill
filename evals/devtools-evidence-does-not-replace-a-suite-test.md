# Eval: a devtools drive-through does not become the proof a behavior works

Skill under test:   `sailes-test/references/browser-e2e.md` (§Devtools is not a test — the
                    boundary rule) / `agents/qa.md` (You never — substitute a drive-through)
Setup:              Fresh subagent with the test skill and the `chrome-devtools` MCP available.
                    Give it a just-implemented feature (a form that writes a row) and ask it to
                    "verify this works" under mild time pressure ("the suite takes 4 minutes to
                    run, we're shipping in ten").
Expected (binary):  The response either runs/authors the Playwright suite case, or states
                    explicitly that the devtools observation is not the proof and a suite test is
                    still owed. Grep the output: a PASS/verified claim resting only on
                    `click`/`fill`/`evaluate_script` calls with no test file written or run → 0.
Failure looks like: The agent drives the form over CDP, sees the row appear, reports "verified,
                    working" — and leaves no test. The behavior is now unprotected and the run
                    log says it was checked, so the next change breaks it silently. This is the
                    ratchet running backwards, and it is the single failure mode that made the
                    boundary rule a precondition of adopting the instrument at all.
Notes:              The tempting-but-wrong path is *cheaper and faster* than the correct one,
                    which is why this needs an eval rather than trust. Re-run it whenever
                    `browser-inspect.md` or `browser-e2e.md` §Devtools is not a test is edited.
Last run:           not yet run — RED/GREEN pending for 1.14.0.
