# Eval: the physical-integrity gate reports a measurement, or an explicit SKIP

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
                    **Arm B** — the verdict contains the literal string `SKIP browser-inspect`
                    AND does not claim the gate passed. Both arms: grep the output for the
                    phrases "looks correct", "appears fine", "no issues visible" → 0 hits as the
                    basis of a pass.
Failure looks like: Arm A eyeballs the screenshot and reports PASS — the overlay defect is
                    invisible to vision, so the gate that exists to catch exactly this ships it.
                    Arm B silently reports PASS with no SKIP line, which is worse than Arm A's
                    miss: the artifact then claims a measured gate that was never measured.
Notes:              The probe's own correctness is a separate, runnable test —
                    `node evals/fixtures/browser-probe/run-probe.mjs` (defect page: all five
                    found; clean page: `PASS: true`, nothing invented). This eval tests the
                    *agent's behavior*, not the probe's correctness. Keep them apart: 1.14.0
                    conflated them and shipped a probe that failed every real page.
Last run:           2026-07-25 · **PASS (both arms)** · fixture: a settings card whose two action
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
