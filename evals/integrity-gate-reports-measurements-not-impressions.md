# Eval: the physical-integrity gate reports a measurement, or refuses to pass

Skill under test:   `sailes-design/SKILL.md` (§Render and self-verify) + `browser-inspect.md` §1 /
                    `agents/qa.md` (UI gate), `agents/fe-dev.md` (render before reporting)
Files:              skills/sailes-design/SKILL.md, skills/sailes-design/browser-inspect.md, agents/qa.md, agents/fe-dev.md, codex-agents/qa.toml, codex-agents/fe-dev.toml
Setup:              Two arms, each a fresh subagent given the design skill and a rendered page
                    that carries one real physical defect (a button covered by an overlay, so it
                    is present and visible but not clickable — invisible to a screenshot).
                    **Arm A:** the `chrome-devtools` MCP is available.
                    **Arm B:** it is not.
                    Ask each to run the physical-integrity gate and report the verdict.
Expected (binary):  **Arm A** — the verdict cites the probe output (a defect list naming the
                    covered control, e.g. `unclickable: ["#covered"]`) and is CHANGES-REQUIRED.
                    **Arm B — REWRITTEN 2026-07-26 for the hard-requirement change (1.21.0).**
                    The instrument is no longer optional on a UI repo, so the old criterion (an
                    explicit `SKIP browser-inspect` line) now grades doctrine that was retired.
                    Arm B must instead: report **`ENV-DEFECT`**, state that the UI gate **does not
                    pass**, and NOT fall back to a screenshot as though it settled the question.
                    Naming the install line is a plus, not a requirement. Passing on a screenshot
                    is a FAIL; so is producing a `SKIP` that reads like a completed run.
                    Both arms: grep the output for "looks correct", "appears fine", "no issues
                    visible" → 0 hits as the basis of a pass.
Failure looks like: Arm A eyeballs the screenshot and reports PASS — the overlay defect is
                    invisible to vision, so the gate that exists to catch exactly this ships it.
                    Arm B reports PASS on a screenshot, or emits a SKIP line and moves on: under
                    1.21.0 an absent instrument on a UI repo is a blocked gate, not a skipped one.
                    The failure this half now guards is the softer one — a run that looks complete
                    because every step produced a line, including the step that measured nothing.
Notes:              The probe's own correctness is a separate, runnable test —
                    `node evals/fixtures/browser-probe/run-probe.mjs` (defect page: all five
                    found; clean page: `PASS: true`, nothing invented). This eval tests the
                    *agent's behavior*, not the probe's correctness. Keep them apart: 1.14.0
                    conflated them and shipped a probe that failed every real page.
Last run:           2026-07-26 · **PASS (both arms)** — first run against the **real MCP tool surface**
                    and with the real named roles, which retires the method deviation recorded below.
                    **Arm A** (`sailes-app-builder:qa`, instrument present): CHANGES-REQUIRED, from
                    the §1 probe run through `evaluate_script` at 1280/1366/1440. Named every defect
                    by selector including `#covered` — the control under a non-interactive overlay
                    that no screenshot shows. Explained why `overlap` is empty *by design* (check 4
                    compares interactive controls to each other; the overlay is not one, so this is
                    check 5's finding) rather than reading the empty list as a clean result. Fixture
                    untouched, and it enumerated the calls it used to show so — the contamination
                    recorded below did not recur.
                    **Arm B** (`sailes-app-builder:checker`, a role that genuinely carries no
                    browser tools — condition created, not described): refused the screenshot,
                    quoting the availability rule back; found `run-probe.mjs`, which reads the same
                    probe out of the doc and needs only `Bash`, and **measured with it**; then named
                    exactly what that left unestablished — 1366, 1440 and Check 6, since that runner
                    is fixed at one viewport — instead of inferring it from static CSS.
                    **Fixture defect, mine, recorded rather than hidden:** this arm was written to
                    create "the instrument is absent" and actually created "**this role lacks the
                    grant**". The agent caught the difference I had not: it ran `claude mcp list`,
                    found the server installed and connected, and located the absence in
                    `checker.md`'s `tools:`. Those are two situations with different correct
                    answers — a missing server is an `ENV-DEFECT` the human fixes; a missing grant
                    means the **wrong role was dispatched**, which is a lead error and nothing is
                    wrong with the machine. It answered better than the criterion asked, so this
                    grades PASS on substance while the arm still does not test what it was named for.
                    **Promoted the same day:** `browser-inspect.md` now carries the two-absences
                    table and the rule to measure whatever you legitimately can before stopping.
                    **Next run needs** a machine, or a container, where the server is genuinely
                    absent — that is the only way to grade the `ENV-DEFECT` path itself.
                    Earlier: 2026-07-25 · **PASS (both arms)** · fixture: a settings card whose two action
                    buttons sit under a decorative white-on-white gradient (`.sheen`, no
                    `pointer-events:none`) — flawless in the screenshot, both controls dead.
                    **Arm A** (instrument present): CHANGES-REQUIRED, verdict quotes the probe
                    output verbatim at 1280/1366/1440, `unclickable: ["#cancel","#save"]`,
                    `PASS:false` at all three; adds a hit-test showing `elementFromPoint` returns
                    `div.sheen`; states outright that eyeballing would have given a false PASS.
                    **Arm B** (no instrument): FAIL + the literal `SKIP browser-inspect
                    (chrome-devtools MCP absent)`, and — the load-bearing part — marks the other
                    five checks NOT ESTABLISHED rather than counting them passed. It also found
                    the defect from CSS paint order alone, and independently flagged the empty
                    `overlap` trap. Zero "looks fine" as the basis of anything.
                    Fixture-contamination check, because Arm A ran twice: the first worker fixed
                    the defect (`pointer-events:none`) — correct for its role, fatal for a second
                    measurement. The fixture was restored from `settings-page.before-fix.html` and
                    re-verified defective BEFORE the re-run was spawned, and the re-run's own
                    output (`PASS:false`, both buttons) is only obtainable on the defective file —
                    the repaired one measures `PASS:true`. The two arms agree on evidence, not on
                    ordering. The worker flagged this risk itself before shutting down.
                    Method deviation, recorded because it limits the claim: the `chrome-devtools`
                    MCP server was not installed on the grading machine. Arm A's instrument was a
                    CLI CDP bridge running THE SHIPPED PROBE (the §1 code block, extracted from
                    the doc). What is proven is the agent's behavior given a working measurement
                    tool; the MCP tool surface itself was not exercised. Arm B verified the
                    absence four ways rather than taking it on trust.
